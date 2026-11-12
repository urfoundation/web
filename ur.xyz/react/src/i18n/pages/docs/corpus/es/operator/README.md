---
description: Ejecuta un operador de URnetwork con un solo binario, configura los recursos de PostgreSQL, Redis y Warp para main y opera el pipeline de recompensas de SN25.
---

# Cómo convertirte en operador de red

Un operador de red ejecuta los servidores de la red de privacidad UR: los servicios de API y Connect a los que se conectan los usuarios y los mineros, el endpoint `/verify` que recorren los validadores y el pipeline de épocas que liquida las recompensas de sus mineros en **Bittensor SN25 (netuid 25)**. Un operador trae sus propios usuarios y productos (las apps de ur.io son las de un operador), deposita α como señal de demanda real respaldada por ingresos y, en cada época de liquidación, registra la lista de pagos Merkle que reparte su pool entre sus mineros. Informa del uso que sigue ese reparto, pero nunca custodia el α de nadie más: la bóveda de liquidación inmutable es la dueña del pool y cada minero reclama directamente de ella.

El punto de entrada [`server/cli/all/main.go`](https://github.com/urnetwork/server/blob/main/cli/all/main.go) ejecuta juntos la API, Connect y el taskworker de producción. Despliegas un único ejecutable de operador; PostgreSQL, Redis, el almacenamiento de artefactos y el ingress TLS público siguen siendo servicios de apoyo. Para entender el mecanismo, lee el [litepaper](/docs/litepaper); para los otros roles, consulta [Cómo ejecutar un minero](/docs/miner) y [Cómo ejecutar un validador](/docs/validator).

## Para quién es

Equipos que quieren gestionar un espacio de red: un despliegue del stack de servidores de código abierto con su propio dominio, usuarios, apps o integraciones, y una comunidad de mineros. En la fase de lanzamiento, la admisión de operadores está controlada por el propietario (consulta [Período inicial](#initial-period)), así que el primer paso es una conversación con el propietario de la subred.

## Qué necesitas

- **Un host Linux y tu dominio.** El binario único sirve la API (`api.<your domain>`), Connect (`connect.<your domain>`) y el taskworker de producción completo. PostgreSQL guarda las cuentas, el uso, la liquidación y la cola de tareas duradera; Redis aporta la coordinación compartida y las cachés; un almacenamiento local y duradero de artefactos guarda los artefactos de pago y de evidencias. Configura las integraciones que ofrezca tu operador, incluido el gossip de extensores si usas extensores. Los frontends opcionales Alt y Proxy son roles de servidor aparte.
- **Admisión en el coordinador.** El propietario de la subred registra a los operadores con `registerOperator(noId, coldkey, poolHotkey, depositHotkey, depositSigner, rootSigner, effectiveEpoch, maximumBurnRao)`, una llamada que solo puede hacer el propietario y que además hace que la bóveda de liquidación registre el UID de tu pool con la propia coldkey de la bóveda (la quema del registro se paga con el valor de la llamada hasta `maximumBurnRao`, y el resto no quemado se reembolsa). Los cambios de rol posteriores se programan con efecto futuro mediante `scheduleOperator`. Tú aportas las identidades; el propietario las registra y te da tu `no_id`.
- **Claves y hotkeys.** Una coldkey de operador (ss58, prefijo 42); una **hotkey del pool**, que la bóveda registra como el UID de tu pool; una **hotkey de depósito**, exclusiva tuya, en la que se preparan los depósitos; y tres firmantes EVM que guarda el servidor (claves secp256k1 codificadas en hexadecimal): el **firmante de depósitos** (`deposit_key`, llama a `deposit`), el **firmante de raíces** (`root_key`, cierra épocas, registra las raíces de pagos y finaliza) y el **firmante de artefactos** (`artifact_key`, firma los artefactos de pago; los validadores lo fijan como tu `artifact_signer`). Los firmantes necesitan TAO en la EVM de Subtensor para el gas; la hotkey de depósito necesita α para depositar (nada durante el período inicial).
- **Claves del servidor de `/verify`.** Una o más claves Ed25519 en el recurso del vault `verify.yml`; la primera firma los recorridos nuevos y todas se publican en `GET /verify/keys` para que las pruebas históricas se sigan verificando tras las rotaciones.
- **Sondas de salida.** El taskworker del binario ejecuta shards de sondeo duraderos, configurados en `config/main/provider_egress_probe.yml`, que miden lo que realmente transporta la salida de cada minero.
- **Un feed público de estadísticas** (`stats.json`) para que el directorio de operadores de ur.xyz pueda incluirte.

## Paso 1: compila el binario único del operador

Usa el código fuente actual de [`urnetwork/server`](https://github.com/urnetwork/server), con la versión de Go y las **revisiones exactas de los repositorios hermanos** que fija su [archivo de bloqueo de fuentes](https://github.com/urnetwork/server/blob/main/local/source-graph/lock.yml). El archivo de bloqueo actual usa Go 1.27.3. Sus checkouts hermanos son `connect`, `glog`, `sdk`, `proxy`, `goidenticons`, `userwireguard`, `warp`, `sn` y `gvisor`; `sn` viene de `urfoundation/sn`, y los demás, de `urnetwork`. Mantenlos junto a `server`: `go.mod` usa reemplazos relativos. Sigue las [instrucciones de compilación canónicas](https://github.com/urnetwork/server#canonical-build-sources) del repositorio al preparar ese árbol de código fuente.

Desde el checkout de `server`:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/ur-operator ./cli/all

./build/ur-operator --help
```

Copia `build/ur-operator` a `/usr/local/bin/ur-operator` en el servidor. Anota la revisión del código fuente del binario en el registro de tus versiones. Compila cada actualización con las revisiones de dependencias que selecciona esa revisión del servidor.

## Paso 2: crea la estructura de Warp para main

El ejecutable usa el mismo resolvedor que los servicios individuales del servidor. `WARP_ENV=main` selecciona el **entorno de despliegue**; `URNETWORK_ST_PROFILE=mainnet` selecciona por separado el **perfil de cadena**. Este ejemplo ejecuta el proceso con un usuario Unix dedicado, `urnetwork`, y con el HTTPS público terminado en un proxy inverso del mismo host.

```bash
sudo useradd --system --home-dir /srv/warp --no-create-home \
  --shell /usr/sbin/nologin urnetwork
sudo install -d -o root -g urnetwork -m 0750 /srv/warp
sudo install -d -o root -g urnetwork -m 0750 \
  /srv/warp/config/main/mmdb /srv/warp/vault/main /srv/warp/site
sudo install -d -o root -g urnetwork -m 0750 /etc/urnetwork
```

Usa esta estructura. Los nombres como `pg.yml` son nombres literales de recursos; los valores `<...>` de los ejemplos de abajo deben sustituirse.

```text
/usr/local/bin/ur-operator
/etc/urnetwork/operator.env
/etc/urnetwork/durable-volumes.json   # external declaration for artifact storage
/srv/urnetwork-data/                 # separately mounted persistent filesystem
  operator-blob/                     # preprovisioned artifact root
  operator-identity/                 # external volume marker and root lease
/srv/warp/
  config/
    main/
      db.yml
      redis.yml
      tls.yml
      provider_egress_probe.yml
      sn.yml                         # reviewed earnings/activation declaration
      operator-gas-authority.yml      # independently provisioned public approval
      mmdb/
        geolite2.mmdb                 # real GeoLite2-City database
        places.yml                   # place export from the same database
    all/                             # optional resources shared by environments
  vault/
    main/
      pg.yml
      redis.yml
      jwt.yml
      jwt-signing.pem
      password.yml
      client.yml
      verify.yml
      provider_egress.yml
      minio.yml
      st.yml
      auth.yml                       # OAuth configuration when offering OAuth
      oauth/                         # OAuth's separate signing keys
      extender.yml                   # when offering extender/gossip services
      tls/                           # when enabling Connect's native TLS transports
        connect.example.net/
          connect.example.net.crt
          connect.example.net.key
    all/                             # optional shared vault resources
  site/
    settings.yml                     # host-specific routes/settings
```

Asigna a los archivos del vault el propietario `root:urnetwork` y el modo `0640`, y a los directorios del vault, el modo `0750`; usa `umask 077` al generar secretos. El usuario del servicio debe poder leer la configuración y los binarios del operador, pero no escribirlos. PostgreSQL, Redis y el almacenamiento de objetos necesitan datos persistentes y copias de seguridad independientes de este árbol de recursos.

Si no se redefinen, los directorios raíz son `$WARP_HOME/{config,vault,site}`, y `WARP_HOME` es `/srv/warp` de forma predeterminada. En su lugar, puedes definir `WARP_CONFIG_HOME`, `WARP_VAULT_HOME` y `WARP_SITE_HOME` con otros directorios raíz. Para cada recurso, el resolvedor prueba primero los archivos directamente en la raíz, luego `main/` y luego `all/`; después busca en los directorios de versión, en orden descendente de versión semántica. Por eso, un archivo en la raíz prevalece sobre la copia del entorno. Un contenedor de Warp puede montar el entorno ya seleccionado directamente en una raíz. Usa una sola estructura de forma coherente y evita archivos obsoletos en una ubicación de mayor precedencia.

Escribe `/etc/urnetwork/operator.env` como asignaciones simples `NAME=value`, sin `export`, para que tanto la shell como systemd puedan leerlo:

```dotenv
WARP_HOME=/srv/warp
WARP_ENV=main
URNETWORK_ST_PROFILE=mainnet
WARP_SERVICE=all
WARP_BLOCK=operator-1
WARP_HOST=operator-1.example.net
WARP_DOMAIN=example.net
WARP_VERSION=2026.10.6
WARP_CONFIG_VERSION=2026.10.6
WARP_HOST_IPV4=127.0.0.1
WARP_PORTS=8080:8080,8081:8081,8082:8082,5080:5080
BY_LOG_LOGTOSTDERR=true
```

Sustituye el dominio, el host, la versión del binario y la versión de configuración por los tuyos. `WARP_PORTS` tiene la forma `service-port:host-port` e incluye **5080**, el primer puerto interno de intercambio de Connect. Los tres puertos HTTP deben ser distintos. Mantener una IP de host y un mapa de puertos explícito también determina qué listeners nativos opcionales de Connect se activan. Añade asignaciones internas contiguas `5081:5081`, `5082:5082`, etc., cuando reserves más puertos de intercambio.

Para este despliegue en un solo host sobre loopback, `/srv/warp/site/settings.yml` dirige el host anunciado de vuelta a su listener interno:

```yaml
routes:
  operator-1.example.net: 127.0.0.1
```

`config/main/settings.yml`, si existe, aporta los ajustes compartidos `all:` y los específicos de cada host, y después se aplican los de `site/settings.yml`, que los sustituyen. Guarda los secretos en el vault, no en un bloque `env_vars` de `settings.yml`: al arrancar, se escriben en el registro los ajustes combinados. Este ejemplo usa en los archivos del vault direcciones literales de PostgreSQL/Redis/RPC, así que no hacen falta `BRINGYOUR_POSTGRES_HOSTNAME`, `BRINGYOUR_REDIS_HOSTNAME` ni `BRINGYOUR_SUBTENSOR_HOSTNAME`. Solo hacen falta si tus recursos los interpolan explícitamente con `{{ env:NAME }}`.

## Paso 3: configura PostgreSQL, Redis y el almacenamiento de artefactos

Instala e inicia PostgreSQL y Redis como servicios independientes; la configuración local del repositorio del servidor usa PostgreSQL 18 y Redis 8. En un host con PostgreSQL instalado, crea la base de datos propia del operador y su rol propietario:

```bash
sudo -u postgres createuser --pwprompt urnetwork
sudo -u postgres createdb --owner=urnetwork --encoding=UTF8 \
  --locale=en_US.UTF-8 --template=template0 urnetwork
```

Instala primero la configuración regional `en_US.UTF-8` si el host de la base de datos no la tiene. Haz que PostgreSQL escuche solo en loopback y, en `pg_hba.conf`, permite la autenticación por contraseña del rol `urnetwork` en la base de datos `urnetwork` desde `127.0.0.1/32` con `scram-sha-256`. El rol de migración debe ser propietario de la base de datos y del esquema, y poder crear y modificar sus tablas e índices. Usa una contraseña hexadecimal generada, para que sea segura en la URL de conexión que construye este servidor.

Crea `/srv/warp/vault/main/pg.yml`:

```yaml
authority: 127.0.0.1:5432
db: urnetwork
user: urnetwork
password: "<the PostgreSQL role password>"
```

Crea `/srv/warp/config/main/db.yml`:

```yaml
min_connections: 0
max_connections: 32
```

Si no tiene recursos propios, el pool de mantenimiento usa estos. Si añades PgBouncer, deja `pg.yml` apuntando al pooler y pon la conexión directa a PostgreSQL en `vault/main/pg_maintenance.yml`; `config/main/db_maintenance.yml` puede dimensionar ese pool por separado. Las migraciones y el mantenimiento necesitan la conexión directa. Reparte el límite de conexiones de PostgreSQL entre ambos pools y cualquier otro cliente. El cliente de PostgreSQL actual usa `sslmode=disable`, así que mantén esta conexión en loopback o en un transporte privado protegido.

Configura Redis con persistencia y contraseña. Para un servicio de Redis instalado desde paquetes, los ajustes relevantes de `redis.conf` son:

```conf
bind 127.0.0.1
protected-mode yes
appendonly yes
maxmemory-policy noeviction
requirepass <a separate generated Redis password>
```

Reinicia Redis después de aplicar los ajustes. Crea `/srv/warp/vault/main/redis.yml`:

```yaml
authority: 127.0.0.1:6379
password: "<the Redis password>"
cluster: false
db: 0
```

Crea `/srv/warp/config/main/redis.yml`:

```yaml
min_connections: 0
max_connections: 32
```

Son archivos distintos: el vault aporta las credenciales de conexión, y la configuración, los tamaños de los pools. Un clúster de Redis usa `cluster: true`; esta guía usa una instancia independiente dedicada al operador. Ninguno de los dos servicios de apoyo debe ser accesible desde la internet pública.

### Prepara el almacenamiento local de artefactos

El código de pagos y de evidencias usa la interfaz `BlobStore` del servidor. Admite archivos locales; no hace falta ninguna cuenta de almacenamiento de objetos en la nube. El recurso de configuración se sigue llamando `minio.yml`, también para el backend local.

Monta un **sistema de archivos independiente** y persistente en `/srv/urnetwork-data`, con ext4, XFS o Btrfs, y haz que se monte antes de que arranque el servicio. Un directorio en el sistema de archivos raíz, tmpfs o un overlay de contenedor no cumple la admisión de almacenamiento del daemon. Dimensiona el sistema de archivos para tu historial de artefactos y tus copias de seguridad.

Para un **operador nuevo y vacío**, aprovisiona la raíz de artefactos y su declaración de identidad, que se conserva de forma independiente. El siguiente ejemplo se niega a reutilizar raíces, archivos marcadores o una declaración que ya existan. Ejecútalo una sola vez como administrador del host, después de comprobar que este es el volumen montado que quieres usar:

```bash
sudo python3 - <<'PY'
import hashlib, json, os, pathlib, pwd, subprocess

mount = pathlib.Path('/srv/urnetwork-data')
root = mount / 'operator-blob'
identity = mount / 'operator-identity'
declaration = pathlib.Path('/etc/urnetwork/durable-volumes.json')
account = pwd.getpwnam('urnetwork')
if not os.path.ismount(mount) or mount.stat().st_dev == pathlib.Path('/').stat().st_dev:
    raise SystemExit('a separately mounted persistent filesystem is required')
uuid, fs_type = subprocess.check_output(
    ['findmnt', '--noheadings', '--raw', '--output', 'UUID,FSTYPE', '--mountpoint', str(mount)],
    text=True).strip().split()
if fs_type not in ('ext4', 'xfs', 'btrfs'):
    raise SystemExit('unsupported durable filesystem')
if any(p.exists() for p in (root, identity, declaration)):
    raise SystemExit('existing storage requires its original declaration and recovery procedure')
os.umask(0o077)
root.mkdir(mode=0o700)
os.chown(root, account.pw_uid, account.pw_gid)
identity.mkdir(mode=0o750)
os.chown(identity, 0, account.pw_gid)
os.chmod(identity, 0o750)
def digest(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()
def protected_write(path, data):
    with path.open('xb') as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.chown(path, 0, account.pw_gid)
    os.chmod(path, 0o640)
marker, lease, generation = os.urandom(32), os.urandom(32), os.urandom(32)
protected_write(identity / 'marker', marker)
protected_write(identity / 'blob-lease', lease)
os.setxattr(root, 'user.urnetwork.durable-root-generation', generation, os.XATTR_CREATE)
config = {'schema': 'urnetwork-durable-volumes-v2', 'volumes': [{
    'mount_path': str(mount), 'filesystem_uuid': uuid, 'filesystem_type': fs_type,
    'marker_path': str(identity / 'marker'), 'marker_sha256': digest(marker),
    'min_available_bytes': 1073741824, 'min_available_inodes': 10000,
    'state_roots': [{'path': str(root), 'lease_path': str(identity / 'blob-lease'),
        'lease_sha256': digest(lease), 'root_inode': root.stat().st_ino,
        'generation_sha256': digest(generation)}]}]}
encoded = (json.dumps(config, indent=2) + '\n').encode()
protected_write(declaration, encoded)
for directory in (root, identity, mount, declaration.parent):
    fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)
print('declaration:', declaration)
print('sha256:', digest(encoded))
PY
```

Anota la ruta de la declaración y el digest `sha256:` que imprime, y configura `/srv/warp/vault/main/minio.yml`:

```yaml
authority: local
path: /srv/urnetwork-data/operator-blob
prefix: blob
max_bytes: 107374182400
durable_volumes:
  path: /etc/urnetwork/durable-volumes.json
  sha256: "sha256:<exact declaration digest>"
```

El ejemplo asigna como máximo 100 GiB a los blobs y rechaza las escrituras cuando quedan menos de 1 GiB o 10.000 inodos libres; elige los límites para tu host. La declaración vincula el UUID del sistema de archivos, el marcador, la concesión, el inodo raíz y el atributo de generación de 32 bytes. El servicio valida esos objetos existentes y nunca crea una raíz de reemplazo. Mantén su propiedad y sus directorios ancestros protegidos contra la escritura del grupo o de otros usuarios. Conserva la declaración y los bytes originales al reiniciar; una restauración a otro inodo u otro sistema de archivos requiere una migración de almacenamiento explícita, no volver a ejecutar esta configuración inicial sobre los artefactos conservados. Esta receta solo aprovisiona el almacén de archivos del operador; las colas de reclamaciones de los mineros y los diarios de los validadores tienen su propia preparación del estado de su propietario.

Sin `minio.yml`, `main` no recurre al sistema de archivos como alternativa. Los despliegues existentes pueden usar en su lugar el backend MinIO autoalojado que admite [`server/blob.go`](https://github.com/urnetwork/server/blob/main/blob.go), con `authority`, `tls`, `access_key`, `secret_key`, `bucket` y `prefix`. Incluye juntos el almacenamiento de artefactos y la base de datos en tu plan de recuperación: los mineros y los validadores deben poder seguir obteniendo los artefactos a los que hacen referencia las raíces on-chain.

## Paso 4: configura la autenticación y el ingress

Genera una clave de firma JWT P-256 dedicada en `vault/main/jwt-signing.pem`, por ejemplo con `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt-signing.pem`, e instálala con los permisos del vault indicados arriba. Hazlo en un directorio privado con `umask 077`. Haz que `vault/main/jwt.yml` apunte a ella:

```yaml
tls_key_paths:
  - jwt-signing.pem
```

El nombre del recurso es histórico: puede ser una clave de firma dedicada y no tiene por qué ser la clave de tu certificado HTTPS público. Mantén disponibles las claves JWT anteriores durante una rotación. Configura dos peppers aleatorios distintos:

```yaml
# vault/main/password.yml
password:
  pepper: "<random password pepper>"
```

```yaml
# vault/main/client.yml
client_ip_hash_pepper: "<different random IP hash pepper>"
```

Instala una base de datos GeoLite2-City actual y con licencia en `config/main/mmdb/geolite2.mmdb`, junto con su `places.yml` correspondiente. La herramienta de compilación `cli/geolite2export` del servidor genera la lista de lugares a partir de esa misma MMDB (`-mmdb <path> -out <path>`); genérala en el host de compilación o de configuración y despliega ambos archivos. La pequeña base de datos de `local/testdata` es un fixture de pruebas, no una base de datos geográfica de producción. El calentamiento de la API y de Connect requiere una base de datos City válida, y la carga inicial de ubicaciones requiere su lista de lugares.

Crea `config/main/tls.yml`, que Connect carga aunque el despliegue use solo WebSockets:

```yaml
allowed_hosts:
  - connect.example.net
```

Para el mapa de puertos en loopback de arriba, configura así tu proxy inverso HTTPS:

| Endpoint público | Listener interno | Requisito del ingress |
| --- | --- | --- |
| `https://api.example.net` | `http://127.0.0.1:8080` | reenvía las rutas de la API y la dirección real del cliente |
| `wss://connect.example.net` | `http://127.0.0.1:8081` | conserva las actualizaciones a WebSocket y las conexiones de larga duración |
| estado del worker | `http://127.0.0.1:8082/status` | mantenlo privado, para la monitorización |
| Intercambio de Connect | TCP `127.0.0.1:5080` | solo interno |

Termina TLS con certificados para tus nombres públicos. El ingress debe **sobrescribir `X-UR-Forwarded-For` con un único par `IP:port` real del cliente**, con corchetes alrededor de una dirección IPv6. El [resolvedor de direcciones del servidor](https://github.com/urnetwork/server/blob/main/session/client_session.go) ignora a propósito el `X-Forwarded-For` estándar; `/verify` depende de observar la dirección de salida real del minero. Solo tu ingress de confianza debe llegar a los listeners internos. Enruta `/verify`, `/sn/*` y el tráfico WebSocket sin reglas de autenticación ni de almacenamiento en búfer que interfieran con sus propios protocolos.

Este mapa de puertos proporciona el transporte WebSocket. Los transportes nativos HTTP/3 y DNS necesitan además asignaciones de puertos de Connect para los puertos de servicio UDP/443 y UDP/4053, la [convención de reenvío del ingress de Warp](https://github.com/urnetwork/warp) y certificados en `vault/main/tls/<hostname>/<hostname>.crt` y `.key`. El DNS público usa UDP/53, que el ingress reenvía al UDP/4053 privado; UDP/8053 es un listener de compatibilidad que solo se activa cuando se asigna explícitamente. Estos listeners esperan el encapsulado Proxy Protocol del ingress de producción; no basta con abrir un puerto UDP. Guarda cada par de certificado y clave en el mismo directorio de recurso/versión.

La API y el worker completos también admiten funciones de producto como OAuth, correo electrónico, suscripciones y extensores. Aprovisiona sus recursos si ofreces esas funciones; el binario no genera credenciales de integración. OAuth usa `auth.yml` con su propio emisor y claves de firma de OAuth **independientes**, generadas y rotadas con las herramientas de OAuth de Warp. Consulta la [configuración del IDP del servidor](https://github.com/urnetwork/server/blob/main/IDP.md). No uses la clave JWT como firmante de OAuth.

### Configura el endpoint de verificación

La ruta `/verify` no necesita un servicio aparte: forma parte de la API, y sus estadísticas, pruebas y claves son rutas públicas del mismo host:

| Ruta | Propósito |
| --- | --- |
| `POST /verify` | el protocolo de recorridos (SEED, EXTEND, FINAL), autenticado con las propias firmas Ed25519 del protocolo, no con un JWT |
| `GET /verify/keys` | las claves de firma del servidor, actuales e históricas |
| `GET /verify/stats` | agregados observados por el operador para auditoría y reconstrucción (los validadores no puntúan a partir de ellos) |
| `GET /verify/proofs` | cada recorrido firmado y no envenenado, completado o caducado |
| `GET /key/<client_id>` | la clave pública Ed25519 de un cliente, sin autenticación |
| `POST /sn/wallet`, `GET /sn/wallet` | la coldkey de reclamación de un minero |
| `GET /sn/pool/claim` | la prueba de Merkle de un minero para una época |
| `GET /sn/epoch` | el reloj del contrato, replicado (`epoch`, `start_block`, `commit_deadline_block`, `finalize_block`, `t_epoch_blocks`, `chain_id`, `contract_address`, `settlement_vault_address`, `no_id`, `netuid`, `rpc_url`) |
| `GET /sn/artifact`, `GET /sn/artifacts` | los artefactos de pago firmados, por hash de contenido, y su historial |
| `POST /sn/attempt-artifact`, `GET /sn/evidence`, `GET /sn/evidence/history` | las subidas de evidencias de los validadores y el índice de evidencias publicado |

Crea el recurso del vault `verify.yml` (al mismo nivel que `jwt.yml`):

```yaml
keys:
  - server_key_id: 0
    seed: <base64 standard encoding of a 32-byte Ed25519 seed>
```

`server_key_id` es un byte (de 0 a 255) que viaja en cada mensaje ASSIGN y FINAL; para rotar, añade una nueva primera entrada y conserva las anteriores. La verificación requiere al menos una clave; comprueba `GET /verify/keys` después del arranque.

El servidor de `/verify` hace cumplir el invariante del que dependen los validadores: cada minero elegible corresponde exactamente a una IP de salida, y cada IP de salida, exactamente a un minero; un minero visto detrás de dos salidas se retira del índice de elegibles hasta que vuelva a tener una sola. Las seeds cuya dirección de origen no corresponde a un minero, o que superan los límites blandos, se envenenan (se recorren hasta la profundidad completa, pero nunca se publican) para que el endpoint no pueda usarse como oráculo de qué direcciones son mineros; solo los límites duros por origen de la política (`hard_seed_per_minute_per_source`, `hard_extend_per_minute_per_source`, `hard_active_trails_per_source`) rechazan las solicitudes directamente.

## Paso 5: configura el pipeline de épocas

El pipeline de subtensor se configura en `vault/main/st.yml`. Sin un recurso válido y habilitado, la API y el taskworker pueden funcionar con el subsistema de la subred desactivado, así que una comprobación de salud HTTP por sí sola no demuestra que los mineros puedan ganar o reclamar. Selecciona mainnet con `URNETWORK_ST_PROFILE=mainnet` en el entorno y `profile: mainnet` en el archivo. Testnet tiene un espacio de nombres `testnet-...` aparte; no se selecciona con `WARP_ENV` ni cambiando solo `profile`. Los campos, según [`server/controller/st_controller.go`](https://github.com/urnetwork/server/blob/main/controller/st_controller.go):

```yaml
profile: mainnet
enabled: true
# keep the unsigned POST /sn/wallet path closed; apps sign the challenge
wallet_allow_unsigned: false
public_rpc_url: https://<public evm json-rpc>   # published to clients via GET /sn/epoch
rpc_urls: [https://<evm json-rpc>]        # or `authority`, resolved by server/st
chain_id: 964
genesis_hash: "0x<native genesis hash>"
deployment_id: ur-mainnet
policy_hash: "0x<sha256 of the signed policy>"
launch_readiness_sha256: "<reviewed readiness receipt digest from sn.yml>"
coordinator_address: "0x<coordinator>"
settlement_vault_address: "0x<settlement vault>"
reserve_sink_address: "0x<reserve sink>"
netuid: 25
no_id: <your operator id>
treasury_hotkey: "0x<32-byte hotkey>"
deposit_hotkey: "0x<32-byte hotkey>"
deposit_key: "<hex secp256k1 key>"        # deposit signer
root_key: "<hex secp256k1 key>"           # root signer: close, commit root, finalize
artifact_key: "<hex secp256k1 key>"       # payout artifact signer
deposit_tiers:                            # the signed policy's tier schedule, verbatim
  - min_conviction_rao: 0
    rate_numerator_rao_per_gib: <rate>    # rao per GiB of usage
    # rao per distinct user (omit or 0 when the policy prices bytes only)
    rate_numerator_rao_per_user: <rate>
    rate_denominator: 1
# the policy's zero_rate_action; equal_demand only while every rate is 0
deposit_zero_rate_action: halt
deposit_epoch_cap_rao: <cap>              # custody blast-radius cap per epoch
reliability_a_min: 8                      # the policy's reliability_a_min
block_seconds: 12
deploy_block: <coordinator deployment block>
```

Un operador habilitado requiere que las claves de depósito, de raíz y de artefactos sean **tres claves distintas**. Deben coincidir con la identidad de operador admitida. Si `st.yml` falta o está mal formado, el registro lo muestra como un subsistema desactivado; comprueba ese estado explícitamente después del arranque. `attempt_upload` y `reserved_attempt_upload` limitan las subidas de evidencias de los validadores; `ops_key` y `contract_address` son campos heredados y no deben usarse en un despliegue nuevo.

La activación en mainnet también requiere la declaración de ganancias revisada `config/main/sn.yml`, que incluye la cadena y el génesis seleccionados, el coordinador, la bóveda de liquidación, la política y el recibo de preparación. Instálala antes del primer `db migrate` del paso 6, que fija a partir de ella la frontera de ganancias permanente de esta base de datos, y asegúrate de que su digest de preparación coincide con el `launch_readiness_sha256` de `st.yml`. Obtén estos valores propios del despliegue mediante la admisión del operador y conserva los bytes revisados. El servidor mantiene el uso posterior al corte separado de las obligaciones heredadas y rechaza la liquidación en mainnet cuando la activación está bloqueada o las identidades difieren.

Antes de que pueda tener éxito cualquier publicación en la EVM de mainnet, instala la `operator_gas_policy` firmada de forma independiente en `st.yml` y su `config/main/operator-gas-authority.yml` correspondiente. La aprobación vincula el operador, las cuentas de depósito y de raíz, la revisión de la política, la ventana de validez, los anclajes del historial de transacciones y los límites de gas y de intentos. La [implementación de la política de gas](https://github.com/urnetwork/server/blob/main/st_operator_gas_policy.go) define su esquema. Financiar un firmante no sustituye esta aprobación, y la clave privada del aprobador no debe estar en este host.

Los niveles de depósito deben ser la escala de la política firmada: los validadores recalculan tu depósito requerido con la misma fórmula y ponen tu pool a cero cuando el depósito observado difiere (consulta más abajo).

## Paso 6: migra, inicializa y ejecuta

Instala los recursos de sondeo del paso 7 antes de iniciar el worker. Usa el mismo binario y el mismo entorno para los tres comandos de abajo. `db migrate` no admite opciones. Aplica el catálogo completo de migraciones de PostgreSQL del servidor; no crea el rol ni la base de datos de PostgreSQL. Después comprueba la frontera de ganancias de los proveedores: una única fila inmutable de la base de datos que guarda el corte de ganancias y la identidad de la cadena de mainnet tomados de `sn.yml`, y que decide qué uso completado gana en SN25 y cuál termina como USDC heredado. En una base de datos nueva, el primer `db migrate` prepara la frontera a partir del `sn.yml` instalado e imprime `Prepared provider earning boundary:` con el corte, los digests de la identidad y del `sn.yml` inicial, y la hora de preparación. Cada ejecución posterior deja la frontera sin cambios, sin leer `sn.yml`, e imprime `Retained provider earning boundary:` con los mismos valores, de modo que un `sn.yml` editado nunca cambia la frontera ni hace fallar una migración; los workers retienen las nuevas asignaciones de ganancias y los envíos de pagos mientras una identidad de ganancias editada difiera de ella. Si `sn.yml` falta o no es válido antes de que exista la frontera, el comando informa de ese error después de aplicar las migraciones; corrige el archivo y vuelve a ejecutarlo. Preparar la frontera no activa mainnet.

**Revisa `sn.yml` antes del primer `db migrate` en una base de datos nueva.** Esa ejecución fija la frontera de ganancias permanente a partir del archivo instalado, sin comprobar ningún digest, y después la frontera ya no puede cambiarse nunca. Todos los demás campos de ganancias deben ser iguales a su valor publicado (esquema, atribución y política heredada, perfil `mainnet`, cadena 964, netuid 25), así que `cutoff_utc` y `genesis_hash` son los valores que tienen que ser correctos antes de esa primera ejecución.

Abre una shell como usuario del servicio y luego carga el entorno:

```bash
sudo -u urnetwork bash
set -a
. /etc/urnetwork/operator.env
set +a

ur-operator db migrate
ur-operator init-tasks
ur-operator run --require-subnet
```

Completa cada comando con éxito antes de ejecutar el siguiente. `init-tasks` inicializa las tareas recurrentes de producción; el arranque normal también se asegura de que existan sus programaciones idempotentes. Un `run` normal nunca aplica migraciones de base de datos. `--require-subnet` convierte un `st.yml` ausente, no válido o desactivado en un error de arranque, en lugar de iniciar en silencio una red sin su pipeline de la subred. El worker en ejecución realiza las tareas de mantenimiento, sondeo, verificación y épocas de SN, además del trabajo minorista o de producto que esté configurado.

Los listeners predeterminados son API 8080, Connect 8081 y estado del worker 8082, con ocho workers y un tamaño de lote de cuatro. Las opciones correspondientes son `--api-port`, `--connect-port`, `--taskworker-port`, `--worker-count` y `--worker-batch-size`. Si cambias los puertos, actualiza a la vez `WARP_PORTS` y el proxy inverso.

Para diagnósticos opcionales de Connect, `--memory-owner-ledger` activa la contabilidad por propietario de las transferencias. `--private-heap-profile-target` acepta `config` (el valor predeterminado), `disabled` o un ámbito `host/block` exacto.

Para los operadores que usan extensores, configura `vault/main/extender.yml` con las claves raíz y de emisor del despliegue y la identidad de gossip, añade `8083:8083` a `WARP_PORTS`, enruta `wss://gossip.example.net` a su listener y añade `--gossip-port=8083`. Un `gossip_identity_key_hex` no vacío requiere ese listener: anunciar gossip sin ejecutarlo deja sin consumir las publicaciones de extensores en cola. Consulta la [especificación de despliegue de extensores](https://github.com/urnetwork/connect/blob/main/EXTENDER.md). Los despliegues de Alt y Proxy siguen usando sus propios frontends; no son necesarios para ejecutar el operador de API/Connect que se describe aquí.

Cuando el arranque en primer plano esté sano, detenlo con Ctrl-C y sal de la shell del usuario del servicio. Instala `/etc/systemd/system/ur-operator.service`:

```ini
[Unit]
Description=URnetwork operator
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target
RequiresMountsFor=/srv/urnetwork-data

[Service]
Type=simple
User=urnetwork
Group=urnetwork
WorkingDirectory=/srv/warp
EnvironmentFile=/etc/urnetwork/operator.env
ExecStart=/usr/local/bin/ur-operator run --require-subnet
Restart=on-failure
RestartSec=5
TimeoutStopSec=180
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Ajusta a tu distribución los nombres de las unidades de los servicios de apoyo y añade el argumento de gossip si lo configuraste. Inicia el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ur-operator
sudo journalctl -u ur-operator -f
```

Comprueba el JSON de preparación de **cada** servicio. Un HTTP 200 por sí solo no basta; cada `status` debe ser `ok`:

```bash
for port in 8080 8081 8082; do
  curl --fail --silent --show-error "http://127.0.0.1:$port/status" \
    | jq -e '.status == "ok"' || break
done
curl --fail --silent --show-error https://api.example.net/verify/keys
curl --fail --silent --show-error https://api.example.net/sn/epoch
```

Confirma que la respuesta pública de la época identifica la cadena, el contrato, la bóveda de liquidación y el `no_id` que esperas, y que el worker va avanzando su réplica de la cadena. La preparación comprueba Redis y que PostgreSQL esté en la última migración antes de que se activen los servicios; no prueba que la admisión del operador se haya completado, que la publicación esté financiada y aprobada ni que haya una reclamación disponible. Si una comprobación informa `error not ready`, resuelve esa causa y reinicia: la preparación queda fijada al arrancar. Para las actualizaciones, haz una copia de seguridad de la base de datos y de los artefactos, despliega los recursos revisados, aplica las migraciones explícitamente y luego reinicia el binario y vuelve a comprobar todos los listeners.

Cuando está activado, gossip no tiene endpoint `/status`. Comprueba su listener y sus registros de arranque por separado: `[gossip]not ready` significa que no arrancó el proceso que vacía su cola de publicaciones, aunque la malla pueda recibir mensajes. Resuelve el error del servicio de apoyo y reinicia antes de dar por lista la publicación de gossip.

## Paso 7: ejecuta el sondeador

Para ubicar a los mineros y comprobar su salud se usan túneles fijados a cada minero, nunca la propia red del host del operador. El worker de producción del binario único ejecuta shards de sondeo duraderos; configura `config/main/provider_egress_probe.yml` con tus propios endpoints:

```yaml
enabled: true
shard_count: 4
api_url: https://api.example.net
platform_url: wss://connect.example.net
public_api_url: https://api.example.net
url_probe:
  limit: 8
  concurrency: 8
  probe_timeout_seconds: 60
```

Crea `vault/main/provider_egress.yml` con `ingest_secret: "<a separate random ingest secret>"`. Cada shard de sondeo activo crea su propia credencial y su propio crédito cuando se admite su ejecución; la tarea recurrente `ProberBootstrap` limpia las cuentas de los shards terminados después de una caída. Vuelve a ejecutar `ur-operator init-tasks` después de cambiar la configuración de los shards. Las sondas de producción actuales usan `url_probe`; los campos de tarea antiguos `full` y `blackhole` se mantienen por compatibilidad. Supervisa los resultados de las sondas y los reintentos en cola antes de admitir mineros: que la API sea accesible no demuestra que el tráfico de salida de los mineros se pueda usar.

## Paso 8: publica tu feed de estadísticas y entra en el directorio

El directorio de operadores de ur.xyz es el registro integrado en el sitio en `web/ur.xyz/react/src/lib/network.js` (`NETWORK_OPERATORS`): un operador se incluye añadiendo allí una entrada mediante una pull request, con su nombre, su sitio, el nombre de su app, las URLs de su panel y de GitHub, sus fichas en las tiendas de apps y su `statsUrl`. El sitio lee los totales en vivo de cada feed de la lista en el navegador del visitante, así que el feed debe ser JSON público con exactamente un `Access-Control-Allow-Origin` (`*` o un origen reflejado que incluya `https://ur.xyz`):

```json
{
  "epoch": 1,
  "epoch_start": 1791569340,
  "epoch_end": 1792174140,
  "epoch_start_block": 9247228,
  "epoch_end_block": 9297628,
  "block": 1,
  "users": 125000,
  "data_gib": 812345.5,
  "total_networks": 250000,
  "staked_alpha": 250000.0,
  "demand_deposits_alpha": 1234.5,
  "miner_emissions_alpha": 5678.9,
  "alpha_usd": 1.75,
  "countries": 123,
  "prev_users": 118000,
  "prev_data_gib": 1012345.5,
  "prev_demand_deposits_alpha": 1100.5,
  "prev_miner_emissions_alpha": 5200.1
}
```

`epoch` es la época de liquidación actual, `epoch_start` y `epoch_end` son sus límites en segundos Unix, y `epoch_start_block` y `epoch_end_block` son sus límites en bloques de la cadena: en mainnet, la época n ≥ 1 va desde el bloque 9.247.228 + (n − 1) × 50.400 durante 50.400 bloques, y un límite que la cadena aún no ha alcanzado se proyecta a 12 segundos por bloque. Los acumuladores corresponden a esa época, y `prev_*`, a la anterior (omítelos cuando no haya ninguna época terminada). `block` es un alias obsoleto igual a `epoch`. El sitio interpreta un feed sin `epoch` como el formato antiguo, cuyas ventanas no eran épocas de liquidación: entonces usa su propio reloj de épocas y no muestra ninguna de las cifras por ventana de ese feed. `alpha_usd` es el precio de α que observas (el sitio toma la media entre los operadores), y `countries` es informativo. Los campos que faltan se interpretan como null, nunca como cero.

## Qué hace el servidor en cada época

Una vez que `st.yml` está presente, el taskworker ejecuta el pipeline por sí solo; nada de esto necesita a un operador frente al teclado:

1. **`StSyncChain`** (cada 5 s) replica el reloj de épocas del contrato en `st_epoch` y en Redis (se sirve en `GET /sn/epoch`), avanza la réplica de eventos finalizados, recupera cualquier época durante la que el worker estuvo inactivo y programa las tareas por época de abajo en momentos derivados de los bloques. El reloj del contrato es la referencia; cada plazo se vuelve a comprobar en bloques antes de un envío.
2. **`StEpochClose(e)`** calcula las hojas de pago y la raíz de una época cerrada y cierra tu pool on-chain (`closeOperatorEpoch`, firmante de raíces), capturando en la bóveda la emisión realizada del pool. Cada minero elegible (`usage_bytes > 0`, al menos `reliability_a_min` saltos asignados, al menos una confirmación, una wallet y sin vinculación a una flota del nivel superior) recibe `weight = usage_bytes × confirmations / max(assignments, reliability_a_min)`, agregado por coldkey y repartido en exactamente 10.000 puntos básicos por el método del resto mayor. La lista se escribe como un artefacto de pago firmado y direccionado por contenido.
3. **`StCommitRoot(e)`** registra la raíz y el hash del artefacto (`commitOperatorRoot`, firmante de raíces) dentro de la ventana de registro de la raíz, con reintentos cada 5 minutos y una alerta dos horas antes del plazo.
4. **`StDeposit(e)`** dimensiona y envía el depósito de la época (`deposit`, firmante de depósitos): lee el artefacto de pago firmado de la época anterior, toma sus `total_usage_bytes` y `total_users` (los usuarios de nivel superior distintos con uso de contratos en la época, la misma cifra que el `users` de tu feed de estadísticas), lee tu convicción antes de esta época, selecciona el nivel y calcula `floor(usage_bytes × rate_numerator_rao_per_gib / (GiB × rate_denominator) + users × rate_numerator_rao_per_user / rate_denominator)` con el tope de `deposit_epoch_cap_rao`. La época 0 no deposita nada; un depósito de tamaño cero se omite; un depósito que ya está on-chain para la época se omite. Mientras todas las tarifas configuradas sean 0 (`deposit_zero_rate_action: equal_demand`, el período inicial), la tarea registra una publicación omitida, no envía ninguna transacción, no reserva ningún nonce y no lanza ninguna alerta; `bringyourctl st status` muestra el dimensionamiento (bytes, usuarios, nivel, depósito requerido, o que el precio es cero). El α preparado se mueve a la hotkey de la reserva y se transfiere al sumidero inmutable de la reserva: los depósitos son stake de convicción y nunca se devuelven.
5. **`StFinalizePoke(e)`** llama a `finalizeOperatorEpoch`, que no requiere permisos, en el bloque de finalización o después, y fija así el derecho (la emisión capturada más el remanente trasladado del mismo operador) para que se abran las reclamaciones.

Cada intento se registra (`AddStPublish`/`UpdateStPublish`) y la publicación concilia las transacciones conservadas con el estado de la cadena entre reinicios. El funcionamiento normal usa solo el binario `ur-operator`. Para diagnósticos y recuperación manuales opcionales, compila el cliente administrativo aparte desde el mismo checkout del servidor e instálalo en el host del operador:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/bringyourctl ./bringyourctl
sudo install -o root -g root -m 0755 build/bringyourctl /usr/local/bin/bringyourctl
```

Ejecútalo como usuario del servicio con el mismo `/etc/urnetwork/operator.env` cargado. Estos son subcomandos administrativos de `bringyourctl`, no subcomandos adicionales de `ur-operator`:

```text
bringyourctl st status [--epoch=<epoch>]
bringyourctl st deposit [--alpha_rao=<alpha_rao>]
bringyourctl st commit --epoch=<epoch>
bringyourctl st finalize --epoch=<epoch>
```

Un depósito manual con `--alpha_rao` sigue limitado por `deposit_epoch_cap_rao`. La convicción voluntaria (`addConviction`, la misma vía de un solo sentido, que sube tu nivel sin contar como demanda) no tiene tarea en el servidor; es una transacción de tu firmante de depósitos.

## Cómo se te mide y se te paga

La emisión del pool de un operador pertenece a sus mineros, y la bóveda de liquidación paga el importe capturado realizado según la raíz del operador. A los proveedores se les paga **momentum**: la parte de la asignación nativa para mineros que se usa ahora para impulsar la red, repartida entre los pools de los operadores y las flotas del nivel superior. El momentum es del 10 % en el lanzamiento. La [Network Capacity Reserve](/reserve), el multisig 2 de 3 `ur-reserve`, recibe el resto: emisiones de los mineros × (1 − momentum). Su parte no es fija; recibe menos a medida que crece el momentum. Son objetivos de enrutamiento sujetos al consenso nativo y al comportamiento del runtime, no pagos fijos garantizados. La reserva nativa es independiente del sumidero de depósitos inmutable y de los saldos de reclamaciones de la bóveda de liquidación. Consulta la [asignación nativa de la reserva](https://github.com/urfoundation/sn/blob/main/mainnet/TREASURY-EMISSIONS.md). Los ingresos de tu operador vienen de tu propio negocio; la subred paga a los mineros por transportar ese tráfico.

- **Peso del pool.** En cada tempo, cada validador pondera tu pool por `implied_demand × Q`: `implied_demand = bytes × rate0_gib / GiB + users × rate0_user`, tus `total_usage_bytes` y `total_users` auditados, valorados al nivel de convicción cero. Tu propio nivel es el más alto cuyo `min_conviction_rao` alcanza tu α bloqueado acumulado (depósitos más convicción voluntaria), así que, por debajo del tope por época, un operador comprometido deposita menos α por el mismo peso: el descuento cambia lo que pagas, no tu peso. Cuando el tope de la época trunca lo que debes, trunca tu demanda en el mismo factor, así que, en el tope, una tarifa de nivel más baja aumenta tu peso. `Q` es la calidad ponderada por exposición de los mineros de tu pool, medida por los propios recorridos de ese validador y acotada por el `quality_transform` de la política. El Yuma nativo calcula el consenso a partir de las filas de pesos de los validadores, según las reglas de enmascaramiento, recorte y normalización del runtime activo. Mientras el precio publicado sea cero, la demanda implícita de cada pool es exactamente 1 (consulta [Período inicial](#initial-period)).
- **La auditoría de depósitos.** Los validadores no se fían de cómo dimensionas tu depósito. Con `usage_lag_epochs: 1` y `tier_snapshot: conviction_before_epoch`, cada validador lee tu raíz registrada de la época anterior, obtiene el artefacto firmado de tu API, comprueba su hash de contenido, su firmante, sus límites finalizados y su raíz, recalcula el depósito requerido a partir de `total_usage_bytes` y `total_users`, y exige que el depósito observado sea exactamente igual. `mismatch_action: zero_pool_weight`; una raíz o un artefacto que sigue sin estar disponible después de la ventana de registro de la raíz es `zero_pool_weight_after_root_window`; la época de arranque debe llevar un depósito cero. La política también limita los depósitos por operador y por época. Con una política de precio cero no se audita ningún depósito: la auditoría se registra como `zero_price_no_deposit_required` y tu pool es elegible independientemente de lo que hayas depositado voluntariamente.
- **Flotas del nivel superior.** Los mineros que se vinculan a una flota de nivel superior ascienden y salen de tu lista de pagos mientras la vinculación siga activa (`head_fleet_active`) y ganan de forma nativa en la hotkey de su flota; vuelven a tu pool a partir de la época siguiente a aquella en que la vinculación queda obsoleta.
- **Liquidación.** Una época de liquidación dura 50.400 bloques (unos 7 días) a partir de la época 1 (la época 0 de mainnet duró 7.200 bloques); las ventanas de referencia de mainnet son una ventana de registro de la raíz de 1.200 bloques (+4 h), la finalización a los 14.400 bloques (+48 h) y un horizonte de reclamación de 8 épocas más 1 época de gracia, todo ello fijado por la política firmada. Los remanentes no reclamados y no asignados, y la emisión capturada de una raíz no registrada, se trasladan a tu propia época siguiente (`carry_same_operator`); nada pasa de un operador a otro. Las reclamaciones no requieren permiso, ninguna pausa del contrato las detiene y ninguna actualización ni acción del propietario puede reescribir un derecho finalizado; solo el interruptor a nivel de cadena que desactiva las transferencias de stake en SN25 puede congelarlas, y no puede quitar ni redirigir ninguna. Desde la época de cambio de la liquidación v2, tu pool se liquida en cambio a través de vault2: las partes de tus mineros siguen solo el uso verificado y se acumulan en cuentas que nunca caducan, y cada raíz paga solo después de que el validador la aprueba y pasa una ventana de impugnación de 14.400 bloques.

## Qué puede salir mal

- **Una raíz no registrada.** Si la raíz no se registra dentro de la ventana, la época se finaliza igualmente, la emisión capturada se traslada a tu siguiente época y los validadores ponen a cero el peso de tu pool desde el final de la ventana hasta que se supera una auditoría. Vigila la alerta de T-2h.
- **Un depósito que no coincide.** Cualquier diferencia entre tu depósito y el recálculo de los validadores (una tabla de niveles distinta en `st.yml`, una sustitución manual con `--alpha_rao`, un tope que truncó el importe) pone el pool a cero durante la época. Mantén `deposit_tiers` y `deposit_epoch_cap_rao` iguales a los de la política firmada.
- **Un depósito por debajo del mínimo de transferencia del runtime.** El servidor comprueba de antemano cada depósito contra el `minimumTransferTaoRao` inmutable de la bóveda al precio actual de α y rechaza (sin reservar un nonce) un importe basado en el uso cuyo traslado a la reserva valga menos que ese mínimo; el resultado se registra como fallido para esa época y no se reintenta.
- **Demasiado pocos operadores.** La política firmada fija el mínimo de operadores sanos y de validadores activos (uno de cada en la política de SN25, dos de cada en la política de testnet); por debajo de ese mínimo, los validadores dejan de dirigir.
- **Mineros sin wallet o sin exposición.** Los mineros sin wallet de reclamación o por debajo de `reliability_a_min` saltos asignados no reciben hoja, y a un minero visto detrás de más de una dirección de salida no se le asigna ningún salto hasta que vuelva a tener una sola. La ruta sin firma de `POST /sn/wallet` sigue cerrada salvo que configures `wallet_allow_unsigned: true`; las apps firman el challenge de la wallet.
- **Un artefacto que tus validadores no pueden obtener.** Los validadores obtienen los artefactos de tu API por hash de contenido. Mantén accesibles el almacén de blobs y las rutas `/sn/artifact`; la equivocación (dos artefactos para una misma época) es un fallo de auditoría.

## Período inicial

En el lanzamiento, la [tabla de precios](/price) publicada es de **0 α por GiB y 0 α por usuario**, y la política firmada de mainnet recoge ese precio cero de forma explícita: la tarifa por GiB y por usuario de cada nivel es 0 y está establecido `zero_rate_action: equal_demand`. Mientras el precio sea cero, los operadores no hacen depósitos de demanda: no se exige ninguno y no se audita ninguno. Copia la misma escala en `st.yml` con `deposit_zero_rate_action: equal_demand` (sin ese ajuste, el servidor rechaza una tabla de niveles toda a cero, así que un precio cero nunca puede darse por accidente); entonces `StDeposit` no debe nada, no envía ninguna transacción ni lanza ninguna alerta, y `bringyourctl st status` informa de que el precio es cero. Los validadores dan a cada pool de operador registrado la misma demanda implícita (exactamente 1), así que el canal de pools se reparte solo según su calidad medida; un depósito voluntario o un bloqueo de convicción (`addConviction` sigue disponible y sigue subiendo tu nivel para más adelante) ni ayuda ni perjudica a tu pool. El canal del nivel superior, el reparto `theta`, la acotación de calidad y la regla de cesión no cambian y, por lo demás, tu pipeline de épocas funciona exactamente como se describe arriba: el artefacto de pago (que ahora también incluye `total_users`) y el registro de la raíz siguen siendo necesarios para que tus mineros puedan reclamar. La admisión de operadores está controlada por el propietario en el lanzamiento, así que es el propietario de la subred quien registra a un nuevo operador en el coordinador, tras una revisión. Es un modo de lanzamiento deliberado mientras se eliminan los errores de la red; sigue el feed RSS de la tabla de precios para enterarte del cambio que empiece a cobrar depósitos.
