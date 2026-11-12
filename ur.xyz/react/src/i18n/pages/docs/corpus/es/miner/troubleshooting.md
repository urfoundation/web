---
published: 2026-10-21
description: Problemas habituales del minero de UR: errores de inicio de sesión, un minero que se detiene o recibe rechazos, errores de wallet y de reclamación, y dónde pedir ayuda.
---

# Solución de problemas del minero

Busca abajo el mensaje que ves, o el síntoma más parecido. Si usaste un instalador, escribe `urnetwork` donde esta página diga `provider`. ¿Sigues atascado? Pregunta [en nuestro Discord](https://discord.gg/urnetwork), con el comando que ejecutaste y lo que imprimió. Nunca publiques tu código de autorización, tus archivos de seed ni nada de `~/.urnetwork`.

## Instalación

### `urnetwork: command not found` después de instalar

El instalador añade su carpeta a tu `PATH` en el archivo de inicio de tu shell (`~/.bashrc`, y `~/.zshrc` si lo tienes, en Linux; `~/.zshrc`, y `~/.bash_profile` para bash, en macOS), que solo leen las terminales nuevas. Abre una terminal nueva o ejecuta la línea `export PATH=…` que imprimió el instalador. En Windows, abre una ventana nueva de PowerShell. Si instalaste con `-B`, añade la carpeta tú mismo: consulta [los instaladores](/docs/miner/install#the-installers).

### `urnet-tools` en Windows dice que la ejecución de scripts está deshabilitada

Es la política de scripts predeterminada de Windows. Escribe `urnet-tools.cmd` en lugar de `urnet-tools`, por ejemplo `urnet-tools.cmd status`.

### `no systemd user session` (Linux)

El instalador no pudo comunicarse con el systemd de tu usuario, lo que ocurre en una shell `sudo su`, en muchos contenedores y en WSL sin systemd. Instala el minero de todos modos, pero no puede ejecutarlo en segundo plano. Inicia sesión directamente con el usuario que ejecutará el minero (por SSH o en la consola) y vuelve a ejecutar el instalador, o ejecuta el minero en primer plano: la primera vez con `urnetwork provide --allow-client-registration` y después con `urnetwork provide`. Sin una sesión de usuario no hay actualizaciones automáticas, así que ejecuta `urnet-tools update` tú mismo de vez en cuando, o usa en su lugar un servicio del sistema: `sudo urnetwork service install --system`. Si se ejecuta como root en una shell así, el instalador instala un servicio del sistema por sí solo.

### El instalador dice que tu procesador no es compatible

Las versiones cubren Intel y AMD de 64 y 32 bits, ARM de 64 bits y ARMv7 de 32 bits (una Raspberry Pi 2 o posterior) en Linux, y los Mac con Apple silicon e Intel. Una Pi Zero o una Pi 1 no son compatibles. En cualquier otra cosa, [compila desde el código fuente](/docs/miner/install#build-from-source).

### macOS dice que no se puede abrir el programa

Un archivo descargado con un navegador web queda en cuarentena. Ejecuta `xattr -d com.apple.quarantine "$HOME/.local/bin/provider"` una vez. (Un archivo descargado con `curl` no lo está, y entonces el comando dice `No such xattr`, lo cual es inofensivo.)

## Inicio de sesión

### No aparece nada al pegar el código de autorización

Es intencionado: la solicitud oculta el código. Pégalo y presiona Enter.

Para desistir, presiona Ctrl-C: dice `Cancelled.` y no cambia nada. Presionar Enter en la solicitud sin escribir nada dice `No auth code was entered`. Ten el código preparado antes de ejecutar `provider login` o `provider setup`.

### `That auth code wasn't accepted`

El código se escribió mal, ya se usó o caducó. Obtén un código nuevo en tu cuenta de operador y vuelve a ejecutar `provider login`. En un registro, en lugar de en una terminal, el mismo error aparece como `panic: Invalid auth code.` seguido de detalles internos que puedes ignorar.

### `… jwt exists. Overwrite? [yN]`

Este dispositivo ya tiene la sesión iniciada. Responde `y` para volver a iniciar sesión con el código nuevo, o cualquier otra cosa para conservar la sesión actual.

### `Couldn't reach the URnetwork API`

En un registro aparece como `panic: http request attempts exhausted`. El minero no pudo comunicarse con el operador. Comprueba la conexión a internet de la computadora y que las URL del operador sean correctas (`provider network`).

En una red que inspecciona el tráfico cifrado con su propia autoridad de certificación, como algunas redes de empresa, el minero rechaza esa autoridad. Haz que `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` apunte a un archivo PEM que contenga solo los certificados de CA de esa red y vuelve a intentarlo. Para el servicio en segundo plano, define la variable y vuelve a ejecutar `provider service install`.

## Inicio

### Primero, pregunta al minero

`provider status` dice qué falta y el comando que hay que ejecutar después, y `provider doctor` comprueba la carpeta de estado, el DNS, la conexión, TLS y el reloj, e indica la solución de cada problema. Empieza por ahí; las entradas de abajo explican los mensajes con más detalle.

### El minero se detiene enseguida

`provider start` dice el motivo con palabras sencillas y sale con el código 3:

- *This device isn't signed in yet* (este dispositivo aún no ha iniciado sesión): ejecuta `provider setup` o `provider login`.
- *This is the first start on this device* (este es el primer inicio en este dispositivo): responde que sí en una terminal, o añade `--allow-client-registration` en un script. Si usaste un instalador, ejecuta `urnet-tools start`: registra un dispositivo nuevo una vez que has iniciado sesión.

`provider provide` solo lo dice cuando el dispositivo no ha iniciado sesión. En un dispositivo que nunca se registró, escribe `startup_recovery_required` en el registro a menos que añadas `--allow-client-registration`.

En los demás casos, el minero imprime una línea JSON con `"event":"startup_recovery_required"` y sale. Con `provider provide`, como lo ejecutan los instaladores, sale con el código 0 y sigue detenido. `provider start` y el minero en segundo plano de `provider service` salen con el código 1, y el servicio lo reinicia cada 15 a 30 segundos: detenlo con `provider service stop` mientras restauras la carpeta. Esto suele significar que **los archivos de identidad de este dispositivo faltan o no coinciden**, por ejemplo después de pasar a una computadora nueva o de restaurar parte de una copia de seguridad. Restaura la carpeta `~/.urnetwork` completa desde tu copia de seguridad. Volver a iniciar sesión no sustituye una identidad perdida, y `--allow-client-registration` tampoco la recupera: solo registra dispositivos nuevos.

### `The state folder … can be changed by other users`

En un registro aparece como `registration parent must be owned and not writable by other users`. La carpeta del minero pertenece a otro usuario (por ejemplo, después de ejecutar el minero una vez con `sudo`) o la pueden modificar otros usuarios, así que se niega a guardar allí su identidad. Devuélvela a tu usuario, hazla privada y vuelve a iniciar:

```bash
sudo chown -R "$USER" ~/.urnetwork
chmod 700 ~/.urnetwork
```

En Windows, ejecuta el comando `icacls` que imprime el mensaje.

### El registro repite `refused` una y otra vez

El minero se inició, pero el operador no acepta su conexión, y sigue reintentando cada pocos segundos. La página de estado sigue diciendo `"status":"ok"`, porque el proceso en sí está bien.

- Asegúrate de que la computadora tiene una conexión a internet normal, doméstica o de servidor, sin VPN ni proxy delante del minero.
- Comprueba que iniciaste sesión con el operador que usa el minero (`provider network`).
- Si continúa, pregunta a tu operador o [en nuestro Discord](https://discord.gg/urnetwork), con las líneas que rodean a `refused`.

### El minero se detiene cuando cierro sesión

En Linux, los servicios de tu usuario se detienen al cerrar sesión a menos que lingering esté activado. El instalador y `provider service install` intentan activarlo; si imprimieron un aviso sobre lingering, actívalo una vez con `sudo loginctl enable-linger "$USER"`.

En Windows, el instalador inicia el minero cuando inicias sesión, y se detiene cuando la cierras. Es una limitación conocida: mantén la sesión iniciada (una pantalla bloqueada no es problema).

### `operator <domain> is awaiting auth`

Con `--all-operators`, ese operador aún no tiene sesión iniciada. Ejecuta `provider auth --operator=<domain>`, o inicia con `--auto-register --hotkey_seed_file=<path>`. El minero vuelve a comprobarlo cada cinco minutos. Consulta [Minar para todos los operadores de la lista](/docs/miner/advanced#mine-every-listed-operator).

## El extensor

`provider status` tiene una línea Extender, y `provider doctor` una línea Inbound 443. En el registro, el `reason` de la entrada `extender` dice qué falla y su `guidance` cómo arreglarlo. El minero sigue minando mientras su extensor está desactivado. Consulta [Ejecutar un extensor](/docs/miner/extender).

### El extensor no puede tomar el puerto TCP 443

El minero no pudo escuchar en el puerto TCP 443, así que su extensor está desactivado. Vuelve a intentarlo cada 3 minutos.

- `tcp_443_permission_denied`: en Linux, un minero que se ejecuta con tu usuario no tiene permiso para escuchar en los puertos por debajo de 1024. Instálalo como un servicio del sistema que sí pueda: con el instalador, `curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system`; con `provider service`, `sudo "$(command -v provider)" service install --system --as="$USER"`. Consulta [Permitir que el minero escuche en el puerto 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).
- `tcp_443_in_use`: otro programa tiene el puerto, como un servidor web u otro proceso del minero en la misma computadora. Solo un programa por computadora puede tenerlo; el minero lo toma en los 3 minutos siguientes a que quede libre.
- `tcp_443_bind_failed`: falló por otro motivo. Lee las líneas del registro que hay alrededor.

### El extensor no es accesible por TCP 443

`unreachable_on_tcp_443`: el minero escucha en el puerto 443, pero la prueba del operador no pudo alcanzarlo desde internet, así que el extensor no se incluye en la lista. Un cortafuegos, un grupo de seguridad en la nube o un router doméstico bloquea las conexiones entrantes, o la conexión está detrás de un NAT de operador. Abre TCP 443 (y UDP 443 y 4053): consulta [Abrir los puertos](/docs/miner/extender#open-the-ports).

El minero vuelve a intentarlo una vez al día. Después de abrir los puertos, reinícialo para intentarlo de inmediato: `provider service restart`, o `urnet-tools restart` con un instalador.

## Cobrar

### `wallet challenge` o `wallet set` dice `credential not ready`

El dispositivo aún no está registrado. Ejecuta `provider setup`, o inícialo una vez con `provider start` y deja que se registre, y luego configura la wallet. Consulta [Configurar tu wallet de pago](/docs/miner/rewards#set-your-payout-wallet).

### Una wallet nueva no aparece enseguida

Es lo esperado. Una configuración de wallet empieza en la época siguiente y nunca cambia adónde van las recompensas anteriores. Consulta [Cuándo empieza a ganar la wallet](/docs/miner/rewards#when-the-wallet-starts-earning).

### No hay pago de una época

Para cobrar, un dispositivo necesita tráfico completado, suficientes comprobaciones de verificación, al menos una confirmación y una wallet firmada para esa época. Un dispositivo del nivel superior gana allí en lugar de en el pool. Consulta [Cómo se cuentan las recompensas](/docs/miner/rewards#how-rewards-are-counted).

### La prueba de la reclamación no está lista

Comprueba que el operador ha publicado el trabajo de este dispositivo en esa época y ha finalizado la raíz de la época. La reclamación usa el `.provider.jwt` del dispositivo; el inicio de sesión de tu cuenta (`jwt`) no puede sustituirlo.

### Discrepancia en la prueba o en la raíz

Guarda la salida y compara el despliegue, la época y los archivos de pago con tu operador. Esperar o cambiar de wallet no arreglará pruebas que no coinciden.

### Reclamado, pero mi saldo no ha cambiado

Busca `ClaimPaid` o `ClaimPaymentDeferred` en el recibo, y comprueba el stake de α en tu coldkey, no el saldo del relayer. Consulta [Leer el resultado](/docs/miner/rewards#3-read-the-result).

### La conexión se cortó durante una reclamación

Comprueba qué pasó con la transacción que enviaste, o con la cola del daemon de reclamaciones, antes de volver a usar la clave del relayer. Conserva el historial de transacciones firmadas.
