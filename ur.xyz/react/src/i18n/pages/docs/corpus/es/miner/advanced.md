---
published: 2026-10-21
description: Minería avanzada en UR: todos los operadores con una hotkey, varias salidas en un host, reclamaciones automáticas o separadas y un UID de minero propio para flotas grandes.
---

# Minería avanzada

La mayoría de los mineros no necesitan esta página: el [inicio rápido](/docs/miner#quick-start) cubre un dispositivo que sirve a un operador. Sigue leyendo si quieres servir a todos los operadores, ejecutar varias salidas desde un host, automatizar las reclamaciones o gestionar una flota grande. Si usaste un instalador, escribe `urnetwork` donde esta página diga `provider`.

## Minar para todos los operadores de la lista

`provider provide --all-operators` mina para todos los operadores de la lista publicada en [ur.xyz/operators.yml](/operators.yml), con un proceso del minero por operador. La forma más sencilla inicia sesión con cada operador usando una **hotkey** de Bittensor, como wallet de TAO:

```bash
provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed
```

No interviene ninguna transacción en la cadena. El primer inicio de sesión crea la red de la hotkey en ese operador, y cada operador nuevo registra su primer dispositivo: `--auto-register` implica `--allow-client-registration`, que nunca reemplaza una identidad que el minero ya tiene. El archivo de seed contiene la seed sr25519 de 32 bytes de la hotkey, en bruto o como 64 caracteres hexadecimales, en un archivo privado que el minero nunca crea.

Para iniciar sesión tú mismo con los operadores, enuméralos y luego inicia sesión con cada uno con un código de autorización, el inicio de sesión de tu cuenta o la hotkey:

```bash
provider operators
provider auth --operator='<domain>'
provider auth --operator='<domain>' --user_auth='you@example.com'
provider auth --operator='<domain>' --hotkey_seed_file=/absolute/private/hotkey.seed
```

`provider operators` imprime de dónde vino la lista y su digest, y luego el dominio de cada operador, su estado de inicio de sesión (`jwt present` o `awaiting auth`), la URL de la API y la URL de conexión. `provider auth --operator` pide el código o la contraseña que no pases, y guarda la sesión de ese operador en `~/.urnetwork/operators/<domain>/jwt`. Un operador con el que iniciaste sesión así todavía no tiene dispositivo, así que el primer inicio necesita el flag de registro; los siguientes no:

```bash
provider provide --all-operators --allow-client-registration
```

Un operador sin sesión iniciada no recibe minero. El registro muestra `operator <domain> is awaiting auth: provider auth --operator=<domain>`, y el minero vuelve a comprobarlo cada cinco minutos.

### Cómo funciona

Con `--all-operators`, un proceso se ocupa de un minero por cada operador de la lista:

- Cada operador tiene su propia carpeta, `~/.urnetwork/operators/<domain>/`, con su propio inicio de sesión, su clave de identidad y su credencial de dispositivo. Son identidades de dispositivo nuevas: la identidad de un solo operador en `~/.urnetwork` no se usa, y un operador elegido con `provider network use` no se aplica.
- La lista se vuelve a obtener cada hora. `--operators-refresh=<duration>` lo cambia, como una duración de Go de al menos `1m`, por ejemplo `30m`, y `--operators-url=<url>` sigue otra lista. La última copia válida se guarda como `~/.urnetwork/operators.yml`, así que la minería continúa mientras ur.xyz no está disponible.
- Un operador recién incluido en la lista recibe un minero en cuanto tiene sesión iniciada, y el minero de un operador cuyas URL cambian se reinicia. El minero de un operador retirado de la lista recibe SIGTERM y, a los 60 segundos, SIGKILL; su carpeta se conserva.
- Un minero que sale se reinicia a los 30 segundos, duplicando el intervalo hasta 10 minutos. Ctrl-C o una señal de terminación detienen todos los mineros.
- `--max-memory` se reparte a partes iguales entre los mineros, y un minero se reinicia cuando cambia su parte. `--port` sirve el estado de todos los operadores; los mineros en sí se ejecutan sin puerto de estado.
- El primer proceso del minero que toma el puerto TCP 443 sirve el extensor para el host.
- `--all-operators` rechaza `--api_url`, `--connect_url`, `--provider-jwt`, `--wallet` y sus flags de firma, `--test-egress-source-ip` y los flags de captura y de informe de cierre, que siguen siendo de un solo operador.

Para ejecutarlo como un [servicio propio](/docs/miner/run#a-service-of-your-own), usa `ExecStart=%h/.local/bin/provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed`. En modo automático el servicio mantiene `--auto-register`, así que cada operador recién incluido en la lista registra su primer dispositivo; nunca reemplaza una identidad que el minero ya tiene. Si inicias sesión tú mismo con los operadores, quita `--auto-register`, conserva `--hotkey_seed_file` si usas el pago por hotkey de abajo, y añade `--allow-client-registration` solo en el primer inicio después de iniciar sesión con un operador nuevo.

### Firmar una vez para todos los operadores de la lista

Con `--all-operators`, una sola firma de la coldkey configura la wallet de pago en todos los operadores. La coldkey y la hotkey firman una declaración global que asocia la hotkey a la coldkey, guardada como una cadena en `~/.urnetwork/hotkey-wallet/`. Cada operador con sesión iniciada guarda entonces la cadena, y la hotkey sola firma allí una delegación de tu red a la última entrada de la cadena. La coldkey nunca firma por operador.

Pide la declaración:

```bash
provider wallet hotkey challenge '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

Firma la declaración impresa, exactamente como aparece, con la coldkey, en el mismo contexto sr25519 `substrate` que una [wallet normal](/docs/miner/rewards#set-your-payout-wallet), y luego ejecuta el comando `wallet hotkey set` que imprime el challenge. Tiene este aspecto:

```bash
provider wallet hotkey set '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

La declaración espera en `hotkey-wallet/pending.json` hasta que se configura o se reemplaza. Si guardas a propósito la seed de la coldkey en este ordenador, pasa `--coldkey_seed_file=/absolute/private/coldkey.seed` a `set` en lugar de `--message` y `--signature`.

`set` añade la firma de la hotkey, agrega la nueva entrada a la cadena y luego guarda la cadena y la delegación en cada operador con sesión iniciada, informando de cada uno; que falle un operador nunca detiene a los demás. `provider provide --all-operators` con `--hotkey_seed_file` mantiene delegados a todos los operadores con sesión iniciada, al iniciar y cada hora, incluidos los operadores añadidos después a la lista, así que la coldkey firma una sola vez. `provider wallet hotkey status` muestra la cadena, cualquier declaración pendiente y la delegación en cada operador.

Salvo que `--wallet-from-epoch` y `--wallet-through-epoch` las elijan, la primera entrada gana desde la época 0 y una posterior desde la época actual de los operadores más 1. Cada delegación empieza en la época actual del operador más 2, y cada rango cubre 65.536 épocas. Una entrada posterior cambia la coldkey o las épocas.

Un operador paga a un dispositivo según este orden de prioridad: la wallet propia del dispositivo (`provider wallet set`), luego una wallet de toda la red y, por último, la delegación de la hotkey.

### Reclamaciones con todos los operadores

Cada operador liquida su propio pool, así que reclama a cada operador por separado. Selecciona la credencial de dispositivo de ese operador y su URL de API, tal como las imprime `provider operators`:

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>' \
  --provider-jwt="$HOME/.urnetwork/operators/<domain>/.provider.jwt" \
  --api_url='<operator api_url>'
```

## Varias salidas en un mismo host

El minero admite salidas SOCKS5, con un dispositivo independiente para cada dirección de proxy:

```bash
provider proxy add '<host>:<port>:<user>:<pass>'
provider proxy add --proxy_file=/absolute/private/proxies.txt
provider provide --allow-client-registration
```

Usa el flag de registro solo cuando añadas salidas realmente nuevas; los reinicios normales son `provider provide`. Cada salida guarda un `.provider-<hash>.jwt` y sus archivos auxiliares de registro. Selecciona ese archivo con `--provider-jwt` cuando configures su wallet y reclames para ella. El `.provider.key` compartido y los archivos de todas las salidas van en la misma copia de seguridad. Lo que cuenta son las salidas distintas y enrutables: añadir cuentas detrás de la misma salida no aumenta la cobertura.

`provider proxy remove` quita salidas, y `provider proxy auth add` y `provider proxy auth remove` gestionan las credenciales del proxy; consulta `provider proxy --help`. Con `--all-operators`, el archivo `proxy` de `~/.urnetwork` se copia en la carpeta de cada operador cuando se inicia su minero.

## Reclamar automáticamente

### Enviar reclamaciones desde otro ordenador

Para mantener la clave del relayer fuera del minero, comprueba la reclamación en el minero con `provider claim` y luego envía sus datos exactos de reclamación y la dirección de la bóveda desde otro ordenador con `snclaim`. Compílalo desde el mismo código fuente:

```bash
# From sn/:
go build -o "$HOME/.local/bin/snclaim" ./cli/snclaim
```

O descárgalo de la misma versión: la [página de versiones](https://github.com/urnetwork/build/releases) también tiene `urnetwork-snclaim-<version>.tar.gz`, con `<os>/<arch>/snclaim` para Linux y macOS. Instálalo igual que [Descarga manual](/docs/miner/install#manual-download) instala el minero. Luego:

```bash
snclaim submit --calldata='0x<verified claim calldata>' \
  --contract='0x<settlement vault>' --rpc='https://<evm-json-rpc>' \
  --chain_id=964 --key_file=/absolute/private/relayer.key --dry-run
```

Usa el ID de cadena real de tu despliegue y quita `--dry-run` para enviarla. El ordenador que envía sigue necesitando una conexión RPC. Para ver si una reclamación ya fue aceptada:

```bash
snclaim status --epoch='<settlement_epoch>' --no_id='<operator id>' \
  --coldkey='<coldkey_ss58>' --contract='0x<settlement vault>' \
  --rpc='https://<evm-json-rpc>'
```

### El daemon de reclamaciones

Los daemons de reclamaciones solo funcionan en Linux y macOS. El daemon de reclamaciones guarda las reclamaciones pendientes y firmadas en una cola duradera y sigue sus resultados en la cadena EVM a través de los reinicios. Su configuración es YAML estricto:

```yaml
schema_version: 1
release: "1.0"
api_url: https://api.example.net
rpc:
  - https://evm-rpc.example.net
key_file: /home/miner/.urnetwork/private/relayer.key
jwt_file: /home/miner/.urnetwork/.provider.jwt
state_dir: /var/lib/urnetwork/claims/provider-1
poll_seconds: 30
lookback_epochs: 2
```

Reemplaza estas rutas y endpoints. Las rutas de archivo relativas se resuelven respecto al archivo de configuración. `jwt_file` selecciona la credencial del dispositivo y debe ser un archivo normal privado; si lo omites, se selecciona el `.provider.jwt` predeterminado. `poll_seconds` acepta de 5 a 3.600; la retrospectiva predeterminada es de dos épocas, hasta 256.

Antes de iniciarlo, prepara el almacenamiento de la cola de reclamaciones y obtén la declaración exacta del volumen duradero y su digest revisado para el host. La admisión de almacenamiento actual los exige; una carpeta vacía o la omisión de los flags no bastan. La declaración usa el esquema de volumen del daemon y cubre el `state_dir` real y la cola. Consulta las instrucciones sobre la [propiedad de la cola de reclamaciones](https://github.com/urfoundation/sn/blob/main/miner/CLAIM-QUEUE-OWNERSHIP.md) y la [preparación del almacenamiento sin conexión](https://github.com/urfoundation/sn/blob/main/mainnet/OWNER-CUSTODY-PREPARATION.md).

```bash
provider claim-daemon --config=/absolute/path/claim.yml \
  --durable-volumes=/absolute/path/reviewed-daemon-volumes.json \
  --durable-volumes-sha256='sha256:<reviewed digest>'
```

Ejecuta un daemon por cada cola y clave de relayer, y no envíes reclamaciones sueltas ni ejecutes otro daemon con esa clave al mismo tiempo. Conserva la carpeta completa de la cola, incluidos sus archivos auxiliares, después de un envío interrumpido. Una entrada de la cola marcada como `uncertain` necesita que se concilie su transacción firmada original. Una entrada de reclamación finalizada muestra que la reclamación fue aceptada; los eventos de pago distinguen las recompensas pagadas del crédito aplazado.

Para las cuentas de la liquidación v2, `provider claim-daemon-v2` reclama una cuenta en cuanto su saldo reclamable alcanza `--threshold-rao` (1,9 α de forma predeterminada), y `--claim-now` reclama todo lo reclamable una vez al iniciar. `--v1-config` ejecuta el daemon v1 de arriba en el mismo proceso, compartiendo una sola clave de relayer. Consulta `provider claim-daemon-v2 --help` para ver sus opciones.

## Reclamar tu propio UID de minero (nivel superior)

De forma predeterminada, cada minero gana en el **pool** de su operador: se paga al UID del pool del operador, y el pool se reparte entre sus dispositivos. Una flota grande puede, en cambio, reclamar **su propio UID de minero** en la subred. Entonces los validadores ponderan ese UID directamente y la cadena le paga de forma nativa, como α en stake sobre la propia hotkey de la flota bajo su propia coldkey, en cada tempo. No hay pool, ni operador, ni reclamación en la ruta de pago.

### Quién puede obtener uno

Los validadores solo dan peso a las **200 flotas principales**; el UID de cualquier otra flota no recibe nada. Las flotas se clasifican por **amplitud de salidas enrutables**, no por tráfico:

- Cada dirección de salida por la que un validador enruta un salto de verificación real se reduce a su prefijo de red (un /29 para IPv4, un /48 para IPv6). La puntuación de una flota es el número de prefijos distintos desde los que salen sus dispositivos.
- Un prefijo compartido con otras flotas del nivel superior se reparte a partes iguales entre ellas, así que muchos dispositivos detrás de una dirección o en un rango pequeño cuentan una vez.
- La puntuación se suaviza en el tiempo (cada tempo cuenta una cuarta parte), así que una mala medición no hunde a una flota, y una flota nueva tarda un tiempo en alcanzar su puntuación completa.

Una sola conexión doméstica cuenta como más o menos un prefijo. Un UID del nivel superior compensa para flotas cuyos dispositivos salen desde muchas redes distintas, como hosts repartidos entre muchos centros de datos o muchas conexiones residenciales.

Para ver dónde estás, la página **Top 200** de ur.io muestra la puntuación y la posición estimadas de tu cuenta frente al corte, y si tus dispositivos ya están vinculados a una hotkey.

### Lo que cuesta, y los riesgos

- **El registro quema α.** La coldkey de la flota paga la quema de registro actual de la subred, y cada registro nuevo encarece el siguiente. `provider fleet register` muestra la quema actual antes de firmar nada.
- **Los UID son limitados.** Cuando la subred está llena, un registro nuevo reemplaza al UID con la emisión más baja, una vez terminado el periodo de inmunidad de ese UID. Una flota que sale de las 200 principales no gana nada, es reemplazada por el siguiente registro y tiene que volver a pagar la quema para regresar.
- **Un nivel a la vez.** Un dispositivo vinculado a una flota del nivel superior no gana parte del pool mientras la vinculación esté activa. Si la flota pierde su UID, sus dispositivos vuelven a ganar en el pool de su operador. Las recompensas del pool que un dispositivo ya ganó siguen siendo reclamables.
- **La vinculación es pública.** Una vinculación publica qué dispositivos pertenecen a tu hotkey y, por tanto, los prefijos de red desde los que salen. Los dispositivos del pool no se vinculan contigo de esta forma.

### Cómo reclamar uno

Necesitas una coldkey de Bittensor con suficiente TAO para la quema, una hotkey para la flota y los archivos de identidad de los mineros (`~/.urnetwork`). Mantén la coldkey en un único ordenador de registro; los mineros solo necesitan sus propias identidades. El registro, la publicación, la vinculación y la revocación en mainnet solo funcionan en Linux y macOS.

1. **Escribe el manifiesto de la flota.** Enumera el ID de cadena de la red, el netuid y el coordinador, un ID de flota, la hotkey de la flota, una generación, y el ID de cliente y la clave pública de cada dispositivo. `provider fleet init` lo construye a partir de los archivos de los mineros, y `provider fleet manifest --manifest=<path>` lo comprueba.
2. **Registra el UID.** Ejecuta `provider fleet register` con el manifiesto, los archivos de seed de la hotkey y de la coldkey y los endpoints `--substrate`. Sin `--apply` es una ejecución de prueba que indica la quema y la comisión actuales. Añade `--apply` para firmar y difundir, con `--burn_limit_rao` y `--fee_limit_rao` como topes: la cadena rechaza un registro que quemaría más de tu límite.
3. **Publica el manifiesto.** `provider fleet publish` pone el hash del manifiesto en la cadena desde la hotkey de la flota.
4. **Vincula cada dispositivo a la hotkey.** Cada vinculación la firman tanto la clave del dispositivo como la hotkey de la flota, así que nadie puede reclamar dispositivos que no ejecuta. Una vinculación no empieza antes de la siguiente época y cubre el rango de épocas que elijas (`--valid_from_epoch`, `--valid_to_epoch`). Puedes:
   - ejecutar `provider fleet sign` para cada dispositivo, que solo lee archivos locales, y luego pegar su salida en la página Top 200 de ur.io y enviar la transacción que prepara desde tu propia wallet EVM; o
   - ejecutar `provider fleet bind` para cada dispositivo, que envía la vinculación por sí mismo con una clave de relayer de EVM y endpoints `--rpc`.
5. **Compruébalo y mantenlo.** `provider fleet status` muestra la vinculación de un dispositivo y el UID. `provider fleet revoke` quita un dispositivo a partir de una época futura. Vincula los dispositivos nuevos de la misma forma, y vuelve a vincular antes de la última época de una vinculación.

En mainnet, `register`, `publish`, `bind`, `status` y `revoke` también necesitan el documento revisado de autoridad de ejecución de la flota de la red (`--mainnet-runtime-authority` y su `--mainnet-runtime-authority-sha256`), y las escrituras necesitan una declaración de volumen duradero (`--durable-volumes` y `--durable-volumes-sha256`). Consulta el [contrato de autoridad y recuperación de la flota](https://github.com/urfoundation/sn/blob/main/miner/FLEET-MAINNET-RUNTIME.md) y `provider fleet --help` para todas las opciones. Cómo se puntúan el nivel superior y el nivel de pools está en el [whitepaper](https://github.com/urfoundation/sn/blob/main/WHITEPAPER.md), secciones 8.4 y 11.4.
