---
published: 2026-10-21
description: Referencia del minero de UR: comandos y opciones de provider, comandos urnet-tools de los instaladores, archivos del minero, variables de entorno y un glosario.
---

# Referencia del minero

Una referencia rápida del comando `provider`. `provider --help` imprime un resumen breve, `provider <command> --help` explica un comando y `provider help all` imprime todos los comandos y opciones. Si usaste un instalador, el comando se llama `urnetwork`.

## Comandos de uso diario

Los nombres entre paréntesis son otros nombres del mismo comando.

| Comando | Qué hace |
| --- | --- |
| `provider setup` | Configura este dispositivo paso a paso: inicio de sesión, registro, dirección de pago, servicio en segundo plano. Se puede volver a ejecutar sin riesgo. `--no-service` omite el servicio, y `--yes --auth-code-file=<path>` lo ejecuta sin preguntas (y omite la dirección de pago). |
| `provider status` | ¿Está configurado, en ejecución y conectado? Código de salida 0 cuando todo va bien, 3 cuando necesita configuración, 4 cuando no está en ejecución o no está conectado. `--json` para scripts. |
| `provider doctor` | Por qué no puede iniciar sesión ni conectarse: carpeta de estado, DNS, conexión, TLS, reloj, actualizaciones. |
| `provider login` (`auth`) | Inicia sesión con un código de autorización, que se escribe en una solicitud que no lo muestra. `provider login <auth_code>` toma el código directamente, pero lo deja en el historial de tu shell. `--user_auth='you@example.com'` inicia sesión con el correo de tu cuenta y pide la contraseña. |
| `provider start` (`provide`) | Empieza a minar en esta terminal. El primer inicio en un dispositivo nuevo pregunta antes de registrarlo; `--allow-client-registration` lo registra sin preguntar. `provide` imprime el registro completo en lugar de la vista en directo. |
| `provider service install` | Ejecuta el minero en segundo plano, con actualizaciones automáticas: en cada arranque en Linux, al iniciar sesión en macOS y en Windows. También `start`, `stop`, `restart`, `status`, `logs --follow` y `uninstall`. |
| `provider update` | Actualiza a la versión más reciente. `--check` solo comprueba, `--status` muestra la configuración de las actualizaciones automáticas. Consulta [Actualizaciones](/docs/miner/updates). |
| `provider --version` | Imprime la versión. |
| `provider auth-provide` | Inicia sesión y arranca en un solo comando. |
| `provider wallet challenge '<coldkey_ss58>'` | Imprime la declaración que hay que firmar para tu wallet de pago. |
| `provider wallet set '<coldkey_ss58>' …` | Configura tu wallet de pago con una firma o un archivo de seed. Consulta [Cobrar](/docs/miner/rewards#set-your-payout-wallet). |
| `provider claim --epoch=<epoch> --rpc=<url>` | Comprueba una reclamación de recompensas del pool; añade `--key_file` para enviarla. Consulta [Reclamar tus recompensas](/docs/miner/rewards#claim-your-rewards). |
| `provider network` (`choose_network`) | Muestra el operador vigente. `provider network use <api_url> <connect_url>` elige otro, `provider network reset` vuelve al predeterminado. |
| `provider operators` | Enumera los operadores de la lista de operadores publicada y tu estado de inicio de sesión con cada uno. |
| `provider proxy add …` | Añade salidas SOCKS5. Consulta [Varias salidas en un mismo host](/docs/miner/advanced#several-exits-on-one-host). |

Los comandos para todos los operadores, las wallets de hotkey, los daemons de reclamaciones y las flotas del nivel superior están en la página [Avanzado](/docs/miner/advanced).

## Opciones comunes

| Opción | Se usa con | Qué hace |
| --- | --- | --- |
| `--allow-client-registration` | `start`, `provide` | Permite registrar un dispositivo nuevo. Nunca reemplaza una identidad que el minero ya tiene. |
| `--port=<port>` | `start`, `provide` | Sirve la [página de estado](/docs/miner/run#the-status-page) en este puerto. `0`, el valor predeterminado, la desactiva. |
| `--max-memory=<mem>` | `start`, `provide`, `login` | Objetivo de memoria flexible en bytes, o con `b`, `kib`, `mib` o `gib`. |
| `-v`, `-vv` | la mayoría | Más detalle en el registro. (Para `urnet-tools` en Linux y macOS, `-v` significa `version`; en Windows escribe `urnet-tools version`.) |
| `-f` | `login`, `proxy` | Reemplaza un inicio de sesión o un proxy existente sin preguntar. |
| `--api_url=<url>` | la mayoría | Usa esta URL de API del operador para un comando. |
| `--connect_url=<url>` | `start`, `provide` | Usa esta URL de conexión del operador para una ejecución. |
| `--provider-jwt=<path>` | `wallet`, `claim` | Elige qué credencial de dispositivo usar, para salidas adicionales u otros operadores. |
| `--wallet=<coldkey_ss58>` | `start`, `provide` | También configura la wallet de pago al iniciar, como `wallet set`. Un fallo se registra y no detiene la minería. |

## Comandos de los instaladores

Los instaladores para Linux, macOS y Windows comparten un comando, `urnet-tools`:

| Comando | Qué hace |
| --- | --- |
| `urnet-tools status` | Resumen en una pantalla: si está en ejecución o no, la versión, si has iniciado sesión, las actualizaciones automáticas. |
| `urnet-tools start`, `stop`, `restart` | Inicia, detiene o reinicia el minero en segundo plano. |
| `urnet-tools logs` | Sigue la salida del minero. Ctrl-C para salir. |
| `urnet-tools version` | Muestra la versión instalada, y la más reciente si es más nueva. |
| `urnet-tools update` | Actualiza ahora, si hay una versión más reciente. En Linux nunca pasa a una anterior. |
| `urnet-tools auto-update` | Muestra si las actualizaciones automáticas están activadas. Añade `on` u `off` para cambiarlo, y `--interval 6h`, `daily`, `weekly` o `monthly` para cambiar la frecuencia. |
| `urnet-tools auto-start on`, `off` | Si el minero se inicia solo tras un reinicio (en macOS y Windows, al iniciar sesión). |
| `urnet-tools reinstall -t <version>` | Instala una versión concreta. |
| `urnet-tools uninstall` | Quita el minero y sus tareas en segundo plano. Conserva `~/.urnetwork`. Añade `--remove-identity` para borrarlo también, después de escribir `delete`. |

Las opciones aceptan `--interval weekly` o `--interval=weekly`. En Windows también funcionan las formas de PowerShell (`-Interval`, `-RemoveIdentity`), y si PowerShell dice que la ejecución de scripts está deshabilitada, escribe `urnet-tools.cmd` en su lugar. Consulta [Actualizaciones](/docs/miner/updates) y [Ejecutar en segundo plano](/docs/miner/run#with-an-installer).

Dónde guarda cada instalador el minero:

| Sistema | Carpeta | Registro |
| --- | --- | --- |
| Linux | `~/.local/share/urnetwork-provider` | `urnet-tools logs` (el journal de systemd) |
| macOS | `~/.local/share/urnetwork-provider` | `~/Library/Logs/urnetwork/` |
| Windows | `%LOCALAPPDATA%\urnetwork\provider` | `provider.log` en esa carpeta |

## Archivos que guarda el minero

El minero guarda su estado en `~/.urnetwork`. Haz una copia de seguridad de la carpeta completa después de detener el minero, mantenla en privado y restáurala de una sola pieza. No ejecutes dos copias de la misma carpeta a la vez. Perder o editar los archivos de identidad puede hacer imposible recuperar el dispositivo, aunque el inicio de sesión de tu cuenta siga funcionando.

| Archivo o carpeta | Qué contiene |
| --- | --- |
| `jwt` | El inicio de sesión de tu cuenta, escrito por `provider login` (`auth`). |
| `.provider.key` y `.provider.key.identity` | La clave Ed25519 original del dispositivo y su marcador de identidad. |
| `.provider.key.registration.lock` | Un bloqueo local para registrar el dispositivo. |
| `.provider.jwt` | La credencial renovable propia del dispositivo, usada para wallets y reclamaciones. |
| `.provider.jwt.registration*` | La solicitud de registro guardada y el estado de recuperación. Conserva cada uno de estos archivos. |
| `.provider.jwt.wallet-consent/` | Tu historial firmado de la wallet, incluidas las declaraciones aún no enviadas. |
| `.provider.cert`, `.provider.extender.key` | El certificado del dispositivo y la identidad del extensor, cuando existen. |
| `network.json` | El operador elegido con `provider network use` (`choose_network`). |
| `proxy` | Salidas SOCKS5 opcionales. |
| `operators.yml` | La última copia válida de la lista de operadores, con `--all-operators`. |
| `operators/<domain>/` | El estado propio de un operador de la lista, con los archivos de arriba. |
| `hotkey-wallet/` | La cadena de pago firmada de la hotkey (`originals.json`) y cualquier declaración pendiente (`pending.json`). |
| `miner.log` | El registro de `provider start` en una terminal. |
| `miner-status.json`, `miner-update.json` | Lo que lee `provider status`, y la configuración de las actualizaciones automáticas y la última comprobación. |

Los instaladores guardan el programa del minero y `urnet-tools` en su propia carpeta (consulta [Comandos de los instaladores](#installer-commands)), separada de esta carpeta.

## Variables de entorno

Ninguna es necesaria para una configuración normal.

| Variable | Qué hace |
| --- | --- |
| `URNETWORK_STATE_DIR` | Usa esta carpeta en lugar de `~/.urnetwork`. Útil para probar un dispositivo de prueba sin tocar el real. |
| `URNETWORK_AUTO_UPDATE` | Defínela como `0` al ejecutar `provider service install` para instalar el servicio con las actualizaciones automáticas desactivadas. No afecta a las actualizaciones de un instalador. |
| `URNETWORK_AUTH_CODE` | Los instaladores inician sesión con este código de autorización en lugar de pedir uno. |
| `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` | Un archivo PEM con certificados de CA adicionales en los que confiar, para una red que inspecciona el tráfico cifrado. Debe contener solo certificados de CA. |

## Glosario

| Término | Significado |
| --- | --- |
| Código de autorización (auth code) | Un código de un solo uso de tu cuenta de operador con el que un ordenador inicia sesión en ella. |
| Operador | La red para la que tu minero proporciona salidas a internet. El predeterminado es `bringyour.com`. |
| Dispositivo (identidad de proveedor) | Este ordenador como minero: la identidad en `~/.urnetwork` que se mantiene igual entre reinicios y actualizaciones. |
| Coldkey | Tu wallet de Bittensor, como una dirección ss58 que empieza por `5`. Las recompensas se pagan a ella. |
| Hotkey | Una segunda clave de Bittensor. Los mineros la usan para iniciar sesión con todos los operadores a la vez, y las flotas para registrarse en el nivel superior. |
| Época | El periodo en el que se cuentan las recompensas. Una época de liquidación dura unos siete días en mainnet. |
| Pool | El pago compartido de un operador. La mayoría de los mineros ganan de un pool. |
| Nivel superior | Flotas grandes que registran su propia hotkey y ganan la emisión de los mineros directamente. |
| Relayer | Una clave EVM que paga el gas para enviar una reclamación. Nunca recibe la recompensa. |
| α ($UR) | El token de la subred, en el que se pagan las recompensas. |
| Momentum | La parte de la emisión de los mineros que se paga ahora; el resto va a la [Network Capacity Reserve](/reserve). |
