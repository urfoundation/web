---
description: Instala y ejecuta el validador actual de SN25, aprovisiona sus claves y su configuración de producción, supervisa la validación y retira sus recompensas nativas.
---

# Cómo ejecutar un validador

El validador de UR funciona en **Bittensor SN25, netuid 25**. El [`sn/validator`](https://github.com/urfoundation/sn/tree/main/validator) actual mide a los proveedores mediante recorridos `/verify`, conserva evidencias firmadas y envía los pesos de mineros resultantes mediante commit-reveal nativo. Un solo proceso `validator` realiza tanto la medición como el envío de pesos.

Los validadores ganan **dividendos nativos de Bittensor**. Son independientes de las recompensas de los proveedores que se reclaman de la bóveda de liquidación de UR. En la versión 1.0 no hay comando `validator claim` ni recompensa por el esfuerzo del validador. El procedimiento de retiro se describe más abajo.

Esta guía trata de un validador de SN25. Un **validador de root en netuid 0** tiene registro, operación y reclamaciones de cesta propios; registrarse en root no inicia la validación de UR. Consulta la [guía del minero](/docs/miner) y la [guía del operador de red](/docs/operator) para los otros roles de UR.

## Antes de empezar

Prepara estos elementos para el despliegue al que te vas a unir:

- Un host Linux, almacenamiento persistente y acceso continuo a la API HTTPS y al transporte WSS de cada operador configurado, además de los endpoints RPC del despliegue: EVM por HTTP(S) y nativo por WS(S). Las comprobaciones de volúmenes duraderos de mainnet requieren Linux, aunque el binario también se puede compilar para macOS.
- Una wallet coldkey de Bittensor con fondos para el registro, el stake y las comisiones de las transacciones. Mantenla en la máquina que usas para las operaciones de la wallet. El validador en ejecución necesita su hotkey y las claves de cliente de cada operador, no la coldkey.
- Una hotkey registrada en SN25 con suficiente peso de stake para obtener un permiso de validador (validator permit). El registro, el umbral de stake y el número de permisos son estado de la cadena, no cantidades fijas de esta guía. [La guía de Bittensor sobre los permisos de validador](https://www.bittensor.com/docs/guides/validating) explica cómo se determina la elegibilidad.
- Una **configuración de producción schema-3** completa y aprobada de forma independiente, las aprobaciones de runtime y de política a las que hace referencia, y los archivos de activación e historial de cada operador. Obtenlos para tu hotkey, tu despliegue y las rutas de tu host reales antes de iniciar el servicio.
- Directorios de estado preparados y una declaración de volumen duradero fijada con SHA-256 para esos directorios. El arranque en mainnet exige esta declaración y comprueba la identidad real del almacenamiento.

El binario de producción actual acepta un despliegue schema-3 aprovisionado. Sus comandos `init --config`, `register`, `stake add`, `activate` y `status --config` siguen usando el cargador anterior a la activación, que rechaza schema 3. No ofrecen un arranque de autoservicio para el mainnet actual. Usa los pasos nativos de la wallet de abajo para el registro y el stake; aprovisiona las evidencias y las aprobaciones de mainnet mediante el proceso de arranque del despliegue. Cambiar un número de esquema o copiar una configuración de testnet no produce esos elementos. Este límite está documentado en [admisión del runtime de producción](https://github.com/urfoundation/sn/blob/main/mainnet/VALIDATOR-PRODUCTION-RUNTIME.md).

## 1. Obtener el validador

Descarga una compilación publicada del validador o compílalo desde el código fuente.

### Descargar una versión

El validador se distribuye como `urnetwork-validator-<version>.tar.gz` en la [página de versiones de build](https://github.com/urnetwork/build/releases). El archivo contiene un binario por plataforma en `<os>/<arch>/validator`, para Linux y macOS. Un validador de mainnet ejecuta el binario de Linux, `linux/amd64` o `linux/arm64` (consulta [Antes de empezar](#before-you-start)):

```bash
VERSION=2026.10.6-1065506180   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-validator.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-validator-${VERSION}.tar.gz"
tar -xzf urnetwork-validator.tar.gz
install -d "$HOME/.local/bin"
install -m 755 linux/amd64/validator "$HOME/.local/bin/validator"   # choose your os/arch
"$HOME/.local/bin/validator" --help
```

Añade `$HOME/.local/bin` a tu `PATH` para los comandos de abajo. Anota la versión publicada junto con el binario para que un despliegue posterior pueda reproducirla.

### O compilar desde el código fuente

Compila desde la revisión de `sn` elegida para tu despliegue. Usa la versión de Go declarada en [`sn/go.mod`](https://github.com/urfoundation/sn/blob/main/go.mod) y checkouts correspondientes de los repositorios hermanos para sus directivas `replace` locales: `connect` (incluido `sctp`), `sdk`, `server`, `warp`, `proxy`, `userwireguard`, `glog`, `goidenticons` y `gvisor`.

Desde la raíz del repositorio `sn`:

```bash
go build -trimpath -o ./bin/validator ./cli/validator
install -d "$HOME/.local/bin"
install -m 755 ./bin/validator "$HOME/.local/bin/validator"
"$HOME/.local/bin/validator" --help
```

Añade `$HOME/.local/bin` a tu `PATH` para los comandos de abajo. El punto de entrada ejecutable es `cli/validator`; `validator/` es la implementación importable, así que `go build ./validator` no produce el ejecutable del servicio. Anota la revisión del código fuente junto con el binario para que un despliegue posterior pueda reproducirla.

## 2. Crear las claves del servicio

Crea las claves con la cuenta que será dueña de los archivos privados del validador, después de que el administrador del host haya aprovisionado su almacenamiento. Este ejemplo usa los operadores `1` y `2`; sustitúyelos por los ID de operador reales e incluye a cada operador en la configuración de tu despliegue:

```bash
umask 077
validator init --state_dir=/var/lib/ur-validator --no_id=1 --no_id=2
```

Esto crea `/var/lib/ur-validator/hotkey.seed` y un `no-<id>/client.key` para cada operador, con modo `0600`. Imprime la dirección SS58 y la clave pública de la hotkey, y el `vpk` público de cada clave de cliente. Las seeds existentes se reutilizan. La hotkey es sr25519; las claves de cliente de cada operador son Ed25519. Conserva las claves originales con el estado original entre reinicios y haz copias de seguridad privadas. Nunca compartas una clave de cliente ni un directorio de estado entre operadores o validadores.

La forma de `init` con directorio de estado funciona antes de que exista una configuración de producción. Si ya operas la hotkey registrada, aprovisiona su seed existente en lugar de generar una identidad distinta. El archivo de seed de la hotkey acepta 32 bytes en bruto o 64 caracteres hexadecimales, con un prefijo `0x` opcional. Mantén los archivos de seed de cliente de cada operador en su forma generada. No pases material de seed como argumento de la shell ni lo pongas en la configuración YAML.

## 3. Registrarse y hacer stake en SN25

En tu **máquina con la wallet coldkey**, instala el CLI de Bittensor actual siguiendo sus [instrucciones oficiales de instalación](https://www.bittensor.com/docs/quickstart). Los ejemplos siguientes usan los comandos actuales de v11; comprueba `btcli --version` y la [guía de migración](https://www.bittensor.com/docs/migration) si tu instalación tiene flags `--wallet.name` antiguos.

Asigna a la dirección pública de la hotkey el `hotkey ss58` que imprimió `validator init`, y selecciona tu wallet coldkey existente. Estas variables no contienen secretos:

```bash
VALIDATOR_WALLET='your-coldkey-wallet-name'
VALIDATOR_HOTKEY='your-validator-hotkey-ss58'

btcli -n finney query subnet-hyperparameters --netuid 25 --json
btcli -n finney query metagraph --netuid 25 --json
```

Revisa la disponibilidad y el coste actuales del registro antes de enviarlo. Previsualiza el [registro](https://www.bittensor.com/docs/tx/burned-register) y luego envía la misma operación con confirmación:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY"
```

Si la hotkey ya está registrada con la coldkey prevista, conserva ese registro. El registro por sí solo no concede un permiso de validador.

Elige la cantidad de TAO para hacer stake según las condiciones de elegibilidad actuales y tu saldo disponible, dejando fondos para las comisiones. Introduce esa cantidad cuando se te pida:

```bash
read -r -p 'TAO amount to stake: ' VALIDATOR_STAKE_TAO
btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO"
```

[`add-stake`](https://www.bittensor.com/docs/tx/add-stake) convierte TAO en alpha de SN25 al precio del pool. Revisa las comisiones y la protección de precio de la previsualización antes de confirmar. Vuelve a comprobar el [metagraph](https://www.bittensor.com/docs/query/metagraph) después de la finalización y la asignación del permiso; tu hotkey, la coldkey propietaria, el UID, el stake y el permiso de validador deben coincidir con los elementos de producción.

El binario de SN también conserva `validator register` y `validator stake add` para las configuraciones que admite su cargador anterior. De forma predeterminada hacen una ejecución de prueba hasta que se indica `--apply`, toman un archivo de seed de la coldkey y expresan las cantidades de stake en **rao**. No sustituyen la configuración schema-3 de mainnet descrita aquí.

## 4. Autenticarse con cada operador

Usa una credencial de cuenta y una identidad de cliente distintas para cada operador configurado. Para el operador de referencia, obtén un código de autorización en [ur.io/?auth](https://ur.io/?auth) y luego ejecuta:

```bash
validator auth --api_url=https://api.bringyour.com
install -m 600 "$HOME/.urnetwork/jwt" /var/lib/ur-validator/no-1/network.jwt
```

Para otro operador, usa su API y su flujo de inicio de sesión reales y luego copia el token recién emitido al directorio de ese operador. `validator auth -f --api_url=...` reemplaza explícitamente el `$HOME/.urnetwork/jwt` temporal; `validator auth --user_auth=... --api_url=...` pide en cambio una contraseña.

`validator auth --operator=<domain>` busca el operador en la [lista de operadores](/operators.yml) publicada en lugar de tomar `--api_url`, y escribe su token en `<state_dir>/operators/<domain>/jwt`; el directorio de estado predeterminado es `~/.urnetwork/validator`. Ahí es donde lo lee la [medición de todos los operadores de la lista](#measure-every-listed-operator-without-weights). Con `--hotkey_seed_file=<path>`, `validator auth` inicia sesión con la hotkey, como una wallet de TAO, en lugar de con un código de autorización o una contraseña. La configuración de producción solo lee las rutas `network_jwt_file` que nombra.

La configuración de cada operador nombra `network_jwt_file`, `client_jwt_file` y `client_key_seed_file`. El JWT de cliente está ligado a la clave de cliente y la identidad originales. Una configuración de producción puede autorizar explícitamente el primer registro con `allow_client_registration: true`; sin ese permiso firmado, proporciona la credencial de cliente existente. Una API de registro no compatible, un inicio de sesión que falta o una identidad que no coincide pueden dejar la medición en espera. Conserva la identidad existente al recuperar la autenticación.

## 5. Aprovisionar la configuración de producción y las evidencias

Usa el `release.yml` aprobado completo, no una versión editada a mano de una configuración firmada. Lo siguiente es la lista de elementos para la [`ReleaseConfig`](https://github.com/urfoundation/sn/blob/main/validator/config.go) actual:

| Elemento | Qué aprovisionar |
| --- | --- |
| Identidad de producción | `schema_version: 3`, `production: true`, `release: "1.0"`, el `deployment_id` del despliegue y tu `validator_id` distinto de cero. |
| Red y contratos | En mainnet, `chain_id: 964`, `netuid: 25`, y los `genesis_hash`, `coordinator`, `settlement_vault` y `deploy_block` reales. |
| Runtime | `runtime_spec`, `transaction_version`, `state_version`, `runtime_code_hash` y `runtime_metadata_hash` revisados, además de las ventanas nativas finitas de bloques y épocas de la aprobación y la capacidad del productor. |
| Política y programación | La `policy` completa, su `policy_hash` correspondiente, `version_key`, `trail_depth` igual a la profundidad de recorrido de la política y `poll_seconds` de 1 a 60. |
| Aprobación económica nativa | La `treasury_approval` o la `owner_recycle_approval` del despliegue firmada de forma independiente, con el firmante público independiente y la ruta, la longitud en bytes y el SHA-256 exactos del archivo de aprobación. Los selectores son mutuamente excluyentes. |
| Conexiones | Endpoints `rpc` de EVM por HTTP(S) y endpoints `substrate` nativos por WS(S), explícitos. |
| Archivos privados del servicio | `state_dir`, `hotkey_seed_file`, y el estado y las credenciales independientes de cada operador. |
| Directorio de operadores | Para cada operador, `no_id`, `api_url`, `connect_url`, un `artifact_signer` distinto, las rutas de credenciales y claves y `concurrency`. Incluye al menos `policy.safety.minimum_healthy_no_count` operadores. |
| Independencia | `controlled_no_ids` enumera los operadores que controlas, para que sus pools y las flotas del nivel superior asociadas queden enmascarados. |
| Evidencias | Los límites completos de `evidence_v2` y, para cada operador, `activation`, `vpk_signature`, `hotkey_signature`, `context`, `history`, `replay_scratch_root` y `seal_scratch_root`. Las referencias a archivos fijan la ruta, los bytes y el SHA-256. |
| Evidencias de solicitudes originales | El `request_receipt_scope` y la `request_preparation` del despliegue para los operadores que usan el flujo original de recibos de solicitud, con su almacenamiento preparado. |
| Historial de renovación | Cualquier `production_runtime_approvals`, `production_authority_history` seleccionado y la revisión de capacidad necesaria para reproducir el trabajo existente bajo su autoridad original. |

La ruta de producción actual de la tesorería y el formato de su aprobación se describen en [tesorería nativa en producción](https://github.com/urfoundation/sn/blob/main/validator/TREASURY-PRODUCTION.md). Los validadores reciben datos públicos de enrutamiento de la tesorería; una clave privada de la tesorería no es un requisito para un validador.

Dimensiona el host según los límites aprobados de evidencias e historial y todos los workers de recorrido configurados. La `concurrency` de cada operador debe estar entre 1 y 128, mantenerse dentro del tope de recorridos activos de la política y permitir que cada worker entre en la puerta de seed con límite de frecuencia antes del timeout del paso. Aumentar la concurrencia o los límites de disco en una configuración firmada requiere un reemplazo aprobado.

Los registros de activación vinculan la identidad de cliente de cada operador con tu hotkey de validador registrada, con ambas firmas y una publicación finalizada en el diario de evidencias. Su contexto y su historial deben cubrir el límite inicial de liquidación configurado. El servicio de producción autentica estos elementos antes de empezar trabajo nuevo. Una entrada `evidence_v2.operators` vacía no basta en mainnet. La ruta anterior `validator activate --config=...` no puede generar estos elementos a partir de una configuración schema-3.

Mantén las rutas estables al aprovisionar. Las rutas relativas se resuelven respecto al directorio de la configuración, y mover una configuración puede cambiar su significado. Una estructura representativa es:

```text
/etc/ur-validator/
  release.yml                    # complete approved production config
  durable-volumes.json           # declaration for this host's actual storage
  approvals/                     # referenced public approval/history files
/var/lib/ur-validator/
  hotkey.seed                     # private sr25519 seed
  state/                         # durable intents and shared validator state
  no-1/
    client.key                   # private Ed25519 seed
    network.jwt
    client.jwt
    ...                          # prepared operator evidence/state
  no-2/                          # separate keys, JWTs and state
  evidence-v2/                   # prepared, hash-pinned activation inputs
  scratch-v2/                    # prepared replay and seal storage
/var/lib/ur-validator-observation/
  progress.json                  # created by the running validator
```

Son rutas de ejemplo, no un sustituto de las rutas de tu paquete aprobado. Los archivos privados necesitan propietario y permisos protegidos; los directorios del protocolo deben usar el almacenamiento duradero preparado. Crear directorios vacíos no prepara por sí solo los registros de intentos ni sustituye su historial conservado. Pon el archivo de progreso fuera de todos los directorios de protocolo, claves, credenciales y evidencias, en un directorio padre existente en el que no puedan escribir el grupo ni otros usuarios.

## 6. Ejecutar y supervisar el validador

Define el **SHA-256 aceptado de forma independiente** de la declaración de volumen duradero; no lo sustituyas por un hash recién calculado para saltarte una discrepancia. Inspecciona los directorios preparados antes del arranque:

```bash
VALIDATOR_VOLUMES_SHA256='sha256:replace-with-the-approved-64-hex-digit-digest'

validator storage-inspect \
  --durable-volumes=/etc/ur-validator/durable-volumes.json \
  --durable-volumes-sha256="$VALIDATOR_VOLUMES_SHA256" \
  --directory=/var/lib/ur-validator/state \
  --directory=/var/lib/ur-validator/no-1 \
  --directory=/var/lib/ur-validator/no-2

validator run --config=/etc/ur-validator/release.yml \
  --durable-volumes=/etc/ur-validator/durable-volumes.json \
  --durable-volumes-sha256="$VALIDATOR_VOLUMES_SHA256" \
  --progress-file=/var/lib/ur-validator-observation/progress.json \
  --operators-refresh=1h
```

El comando en primer plano realiza validación real y puede enviar pesos en cuanto se cumplen las condiciones aprobadas. Ejecuta exactamente un proceso por cada hotkey y espacio de nombres de estado. Usa los mismos argumentos bajo el gestor de servicios de tu despliegue; al reiniciar, conserva los diarios originales y las transacciones pendientes firmadas. Resuelve un rechazo por custodia o configuración antes de reiniciar en lugar de borrar el estado o generar claves de reemplazo.

`--operators-refresh=1h` sigue la [lista de operadores](/operators.yml) publicada y la vuelve a obtener cada hora, sin cambiar lo que el validador firma o pondera: solo se ponderan los operadores fijados en la configuración firmada, y la versión funciona exactamente como lo haría sin el flag. La lista se guarda en caché como `operators.yml` en el `state_dir` de la configuración. Al arrancar y en cada cambio de la lista, el validador registra un informe de desviaciones y lo escribe en `operators-report.json` junto a esa caché. El informe muestra cada operador fijado, emparejado con la lista por la URL de la API, como incluido o retirado de la lista, con cualquier discrepancia en la URL de conexión, y cada operador de la lista que la configuración no fija. Es una salida operativa; nada la vuelve a leer.

Con `--operators-refresh`, `--operators-url=<url>` sigue otra lista, y `--observe-unpinned-operators` mide además cada operador de la lista que la configuración no fija, solo para observación, en `observed-operators/<domain>/` dentro del `state_dir` de la configuración. La observación inicia sesión y aprovisiona con el `hotkey_seed_file` de la configuración, y sus resultados nunca llegan a los pesos, las evidencias ni el estado de producción. Los operadores fijados conservan su `network_jwt_file` configurado; si falta, se informa y nunca se crea.

Vigila stderr y el [registro de progreso](https://github.com/urfoundation/sn/blob/main/mainnet/SERVICE-PROGRESS.md) de tamaño acotado. Comprueba varias señales independientes:

- Un `heartbeat_at` y un `publisher.last_success_at` recientes muestran actividad del proceso y de la publicación.
- Los registros `intent` muestran los límites de las transacciones preparadas, finalizadas y aplicadas. Una transacción enviada o pendiente aún no es un vector de pesos aplicado.
- `settlement` muestra el cursor duradero de épocas y el trabajo de publicación pendiente.
- Los diagnósticos de autenticación con los operadores y de recorridos muestran si la medición puede avanzar para cada operador.
- Las desviaciones de la lista de operadores no están en el registro de progreso. Con `--operators-refresh`, están en el registro del servicio y en `operators-report.json`.
- Las lecturas nativas del metagraph muestran si la hotkey sigue teniendo su UID y su permiso y si recibe dividendos.

Esperar una época puede ser normal; un heartbeat reciente por sí solo no demuestra una validación correcta. El `validator status --config` actual rechaza schema 3, así que usa el registro de progreso, los registros del servicio y las lecturas nativas de la cadena para esta ruta de producción. Sin `--config`, `validator run` es un modo heredado solo de medición y nunca escribe pesos de la versión.

### Medir todos los operadores de la lista sin pesos

`validator run --all-operators` mide todos los operadores de la lista de operadores publicada y nunca escribe pesos. Cada operador tiene su propio estado en `<state_dir>/operators/<domain>/`: el token `jwt`, la clave de medición `.validator.key` y el JWT de cliente `.validator.jwt`. No se usan el `<state_dir>/.validator.key` ni el `~/.urnetwork/jwt` de un solo operador.

```bash
validator run --all-operators --auto-register \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

- `--auto-register` inicia sesión con la hotkey, como una wallet de TAO, donde un operador no tiene token. Solo aprovisiona una identidad de medición para un directorio de operador completamente nuevo, y nunca recupera, adopta ni reemplaza una identidad existente. El archivo de seed debe existir ya; nunca se crea.
- Sin `--auto-register`, un operador sin token registra `operator <domain> is awaiting auth: validator auth --operator=<domain>` y se vuelve a comprobar cada cinco minutos. Un directorio sin identidad de medición se rechaza y se reintenta, y el registro nombra los flags que la aprovisionan.
- La lista se guarda en caché como `<state_dir>/operators.yml` y se vuelve a obtener cada hora, o cada `--operators-refresh`, una duración de Go de al menos `1m`. `--operators-url=<url>` sigue otra lista. La última copia válida sigue en uso mientras no se pueda obtener la lista.
- Un operador recién incluido en la lista se inicia, uno retirado se detiene conservando su estado, y un operador cuyas URL cambian se reinicia. Un operador que falla se reinicia a los 30 segundos, duplicando el intervalo hasta 10 minutos, y nunca detiene a los demás.

## 7. Cobrar las recompensas del validador

Los dividendos de un validador de SN25 se acumulan mediante la contabilidad nativa de stake de Bittensor. Tu coldkey controla tu propia posición; el stake delegado y sus recompensas pertenecen a las coldkeys que delegan, descontada la comisión del validador. El coordinador y la bóveda de liquidación de UR no custodian los dividendos de los validadores. `provider claim`, `snclaim submit` y las pruebas Merkle de pago del operador son para la ruta de recompensas de mineros y proveedores.

Para devolver tu alpha de SN25 disponible a **TAO libre**, retira del stake la cantidad que elijas de la hotkey real que mantiene esa posición. Usa la máquina con la wallet coldkey y las mismas variables públicas de wallet del paso 3. Primero revisa tus posiciones y elige la cantidad en **alpha**, no en TAO:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
read -r -p 'SN25 alpha amount to withdraw: ' VALIDATOR_WITHDRAW_ALPHA

btcli -n finney query quote-unstake \
  --netuid 25 --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA" --json

btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA" --dry-run
```

La [cotización](https://www.bittensor.com/docs/query/quote-unstake) estima la salida en TAO, las comisiones y el deslizamiento. Después de comprobar la ejecución de prueba y el stake restante, envía con confirmación interactiva:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA"

btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
```

[`remove-stake`](https://www.bittensor.com/docs/tx/remove-stake) intercambia el alpha disponible por TAO y lo abona al saldo libre de la coldkey que firma. Comprueba el resultado de la transacción finalizada y los saldos actualizados. Tu posición acumulada contiene tanto el principal como las recompensas: no existe un saldo de SN25 aparte para «reclamar solo mis ganancias». Retirar stake puede afectar a tu permiso; los bloqueos, las garantías, las comisiones y la protección de precio del pool pueden limitar una operación. Si tus recompensas se han dirigido a otra hotkey de stake, selecciona esa posición real.

**Las recompensas de root son distintas.** Si también haces stake en netuid 0, el rendimiento de su cesta tiene un flujo nativo propio de reclamación de root antes del retiro. Sigue las [instrucciones de Bittensor sobre el stake en root y los dividendos](https://www.bittensor.com/docs/guides/staking#root-stake-and-dividends). No uses una reclamación de root para cobrar las recompensas ordinarias de alpha de SN25.
