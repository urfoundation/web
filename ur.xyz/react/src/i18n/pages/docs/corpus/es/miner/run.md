---
published: 2026-10-21
description: Ejecuta el minero de UR en el día a día. Inícialo y detenlo, elige un operador, mantenlo en segundo plano, lee sus registros y su página de estado, y haz copias de seguridad.
---

# Ejecutar y supervisar el minero

Esta página da por hecho que has [instalado](/docs/miner/install) el minero y lo has [configurado](/docs/miner#2-run-setup). Si usaste un instalador, escribe `urnetwork` donde esta página diga `provider`.

## Iniciar y detener

Para minar en una terminal:

```bash
provider start
```

Muestra una vista en directo breve (Connecting, Connected, ● Mining) y se ejecuta hasta que lo detengas con Ctrl-C. El registro detallado va a `miner.log` en `~/.urnetwork`; añade `-v` para verlo en la terminal.

El primer inicio en un dispositivo nuevo pregunta antes de registrarlo y guarda su identidad en `~/.urnetwork`. Cada inicio posterior reutiliza esa identidad. En un script, donde nadie puede responder, añade `--allow-client-registration` al primer inicio. `provider provide` es el mismo comando con la salida completa del registro, para scripts y servicios.

Registra solo un dispositivo realmente nuevo. El registro nunca reemplaza una identidad que el minero ya tiene, pero no borres archivos para saltarte un error sobre una identidad que falta o no coincide: consulta en su lugar [Solución de problemas](/docs/miner/troubleshooting#the-miner-stops-straight-away).

Ejecuta todos los comandos del minero, y el servicio en segundo plano, con el mismo usuario. Cada usuario tiene su propio `~/.urnetwork`.

## Elegir un operador

El minero sirve al operador predeterminado, `bringyour.com` (`https://api.bringyour.com` y `wss://connect.bringyour.com`), a menos que elijas otro. Para servir a un operador distinto, elígelo **antes** del primer inicio, con las URL que publica:

```bash
provider network use https://api.example.net wss://connect.example.net
provider network
```

Las URL de la API empiezan por `https://` y las de conexión por `wss://` (`http://` y `ws://` sin cifrar solo funcionan con un servidor de pruebas local). `provider network` por sí solo muestra el operador vigente, y `provider network reset` vuelve al predeterminado. La elección se guarda y se aplica a todos los comandos posteriores. Luego ejecuta `provider setup`, o `provider login`, con un código de autorización de ese operador.

Cambiar de operador no traslada al nuevo un dispositivo que ya está registrado. Mantén cada operador en su propio estado y su propia cuenta. Para servir a la vez a todos los operadores de la lista publicada, consulta [Minar para todos los operadores de la lista](/docs/miner/advanced#mine-every-listed-operator).

## Ejecutar en segundo plano

### Con un instalador

Los [instaladores](/docs/miner/install#the-installers) ya ejecutan el minero en segundo plano: un servicio de usuario de systemd en Linux (o, si se instaló con `--system`, un [servicio del sistema que se ejecuta con tu usuario](/docs/miner/extender#with-the-linux-installer)), un agente de launchd en macOS y accesos directos de Inicio en Windows. Gestiónalo con `urnet-tools`:

```bash
urnet-tools start          # start it (no error if it's already running)
urnet-tools status         # version, signed in, running, updates; exits 3 when it isn't running
urnet-tools logs           # follow its log; Ctrl-C to stop reading
urnet-tools restart
urnet-tools stop           # stop it until you start it again, restart (Linux) or log in again (macOS, Windows)
urnet-tools auto-update off   # turn automatic updates off; `on` turns them back on
```

Si al instalar te saltaste el inicio de sesión, ejecuta `urnetwork login` y después `urnet-tools start`: registra el dispositivo e inicia el minero. Consulta [Actualizaciones](/docs/miner/updates) para saber cómo funcionan las actualizaciones automáticas.

En Linux y Windows, `provider service start`, `stop`, `status` y `logs` también funcionan con el minero del instalador.

Se inicia solo al arrancar en Linux (cuando lingering está activado; el instalador intenta activarlo), al iniciar sesión en macOS y al iniciar sesión en Windows, donde además **se detiene cuando cierras sesión**. `urnet-tools auto-start off` evita que se inicie solo, y `urnet-tools auto-start on` lo vuelve a activar.

Si el minero se bloquea, systemd lo reinicia en Linux al cabo de 30 segundos y launchd en macOS al cabo de 60. En Windows, un minero que se detiene sigue detenido hasta que ejecutes `urnet-tools start` o vuelvas a iniciar sesión. Un minero que se detiene limpiamente, por ejemplo porque el dispositivo [no está registrado](/docs/miner/troubleshooting#the-miner-stops-straight-away), sigue detenido: entonces `urnet-tools status` dice que no está en ejecución.

### Con el servicio de provider

`provider setup` ofrece configurarlo. Para hacerlo tú mismo, detén el minero si se está ejecutando en una terminal y luego:

```bash
provider service install
```

Inicia el minero ahora, vuelve a iniciarlo por sí solo, lo reinicia si se bloquea y busca [actualizaciones](/docs/miner/updates) cada 6 horas:

- **Linux:** un servicio de usuario de systemd, `urnetwork-provider.service`, que se inicia al arrancar. Activa lingering para que el servicio siga funcionando después de cerrar sesión, o imprime el comando `sudo loginctl enable-linger` que hay que ejecutar.
- **macOS:** un agente de launchd que se inicia cuando inicias sesión. Su registro es `service.log` en `~/.urnetwork`.
- **Windows:** una app de Inicio que inicia el minero, oculto, cuando inicias sesión en Windows, y se detiene cuando cierras sesión. No necesita permisos de administrador. Su registro es `service.log` en `%USERPROFILE%\.urnetwork`.

Para gestionarlo:

```bash
provider service status
provider service logs --follow   # Ctrl-C to stop reading
provider service restart
provider service stop
provider service uninstall       # your sign-in and identity are kept
```

En un servidor, o para minar para todos los usuarios del ordenador en Linux o macOS, usa un servicio para todo el sistema que se ejecute como root, con su estado en `/var/lib/urnetwork`: `sudo provider setup --system`, o `sudo provider service install --system`. Añade `--system` a los demás comandos de `provider service` para gestionarlo. Windows no tiene servicio para todo el sistema. En Linux, un servicio de usuario no puede escuchar en el puerto TCP 443 para el extensor del minero; `sudo "$(command -v provider)" service install --system --as="$USER"` lo ejecuta como un servicio del sistema que sigue siendo tu usuario y puede escuchar en ese puerto. Consulta [Permitir que el minero escuche en el puerto 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443). Para muchas máquinas, `provider setup --yes --auth-code-file=<path>` configura sin hacer preguntas; se salta el paso del pago, así que [configura la wallet de pago](/docs/miner/rewards#set-your-payout-wallet) después.

En Linux y Windows, `provider service install` no añade un segundo minero junto al de un instalador. En macOS no puede ver el agente del instalador, así que si usaste el instalador de macOS, sigue usando `urnet-tools` y no instales un segundo servicio.

### Un servicio propio

Para ejecutar el minero con tus propias opciones, o sin systemd ni launchd, ejecuta `provider provide` con tu propio gestor de servicios, `tmux` o `screen`. En Linux, por ejemplo, crea `~/.config/systemd/user/ur-miner.service`:

```ini
[Unit]
Description=UR miner

[Service]
ExecStart=%h/.local/bin/provider provide
Restart=on-failure
RestartPreventExitStatus=3
RestartSec=10
UMask=0077

[Install]
WantedBy=default.target
```

Detén el minero si está en ejecución, luego habilita el servicio y sigue su registro:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ur-miner.service
journalctl --user -u ur-miner.service -f
```

Para que siga funcionando después de cerrar sesión, activa lingering una vez: `sudo loginctl enable-linger "$USER"`. Deja `--allow-client-registration` fuera del comando del servicio, para que una identidad que falta detenga el servicio en lugar de registrar un dispositivo nuevo sin que te des cuenta. No ejecutes este servicio y `provider service` a la vez. Un servicio propio no actualiza el minero; consulta [Actualizaciones](/docs/miner/updates#without-automatic-updates).

## Comprobar que funciona

### Status y doctor

```bash
provider status
```

Una línea para el minero, el inicio de sesión, el registro del dispositivo, la conexión y las actualizaciones, y el comando que hay que ejecutar después cuando algo no va bien. Sale con 0 cuando todo va bien, 3 cuando el dispositivo necesita configuración y 4 cuando el minero no está en ejecución o no está conectado. `provider status --json` imprime lo mismo para scripts y monitorización.

```bash
provider doctor
```

Busca por qué el minero no puede iniciar sesión ni conectarse: si la carpeta de estado es privada, el DNS, la conexión con el operador, un proxy o cortafuegos que inspecciona TLS, el reloj y si se pueden instalar actualizaciones. Indica la solución de cada problema que encuentra.

### El registro

`provider start` escribe su registro en `miner.log` en `~/.urnetwork`. Para un minero en segundo plano, usa `provider service logs --follow`, o `urnet-tools logs` con un instalador.

El minero escribe muchas líneas de registro, en varios formatos; la mayoría son rutinarias. Estas líneas son buenas señales:

- `"event":"identity_available"`: encontró o creó la identidad de este dispositivo.
- El minero sigue funcionando. Si se detiene solo a los pocos segundos, algo va mal, aunque su salida parezca limpia.

Señales de alarma:

- Una línea JSON con `"event":"startup_recovery_required"`, y luego el programa sale: consulta [Solución de problemas](/docs/miner/troubleshooting#the-miner-stops-straight-away).
- La palabra `refused` repitiéndose cada pocos segundos: el operador no acepta la conexión. Consulta [Solución de problemas](/docs/miner/troubleshooting#the-log-keeps-saying-refused).

Añade `-v`, o `-vv` para más, para ver más detalle.

### La página de estado

El minero puede servir una pequeña página de estado en JSON. Está desactivada de forma predeterminada; actívala con `--port`:

```bash
provider provide --port=8080
```

Luego, en la misma máquina:

```bash
curl -s http://127.0.0.1:8080/
```

Muestra la `version` del minero (las compilaciones de versiones publicadas la tienen), su nombre de `host` y una sección `diagnostics` con el último resultado del inicio de sesión (`authentication`), `keys`, `extender` y `runtime`. El `"status":"ok"` de nivel superior solo significa que el proceso del minero está en marcha; no significa que esté conectado ni ganando, así que lee también `diagnostics`.

La página de estado escucha en todas las interfaces de red, no solo en la local. Bloquea ese puerto en tu cortafuegos, o permite solo tu red de monitorización.

## Opciones útiles

| Opción | Qué hace |
| --- | --- |
| `--max-memory=1gib` | Un objetivo de memoria flexible, en bytes o con `b`, `kib`, `mib` o `gib`. Sin ella, el minero elige uno según la memoria del ordenador. |
| `-v`, `-vv` | Más detalle en el registro. |
| `--port=<port>` | Servir la [página de estado](#the-status-page) en ese puerto. `0`, el valor predeterminado, la desactiva. |

`provider auth-provide` inicia sesión y arranca en un solo comando. Un dispositivo nuevo sigue necesitando `--allow-client-registration`. Todas las opciones están en `provider help all` y en la [Referencia](/docs/miner/reference).

## Haz una copia de seguridad de tu minero

Todo lo que hace que este dispositivo sea *tu* minero está en `~/.urnetwork`: su clave de identidad, su registro, su inicio de sesión y tu historial firmado de la wallet. Si lo pierdes, no puedes recuperar el dispositivo, aunque todavía puedas iniciar sesión en tu cuenta.

- Detén el minero (o su servicio) antes de copiar la carpeta, para que nada quede a medio escribir.
- Copia la carpeta **entera**, mantén la copia en privado y restáurala de una sola pieza.
- Nunca ejecutes dos copias de la misma carpeta a la vez, ni en una máquina ni en dos.

La [Referencia](/docs/miner/reference#files-the-miner-keeps) enumera cada archivo de la carpeta.
