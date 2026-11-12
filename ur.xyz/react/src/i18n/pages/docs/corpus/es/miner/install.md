---
published: 2026-10-21
description: Instala el minero de UR. Los instaladores para Linux, macOS y Windows con actualizaciones automáticas, una descarga manual y la compilación de provider desde el código fuente.
---

# Instalar el minero

El minero es un único programa, `provider`. Hay tres formas de obtenerlo:

| Forma | Sistemas | Actualizaciones | Ideal para |
| --- | --- | --- | --- |
| [Instalador](#the-installers) | Linux, macOS, Windows | Automáticas | La mayoría de la gente |
| [Descarga manual](#manual-download) | Linux, macOS, Windows | Automáticas, con `provider setup` | Control total |
| [Compilar desde el código fuente](#build-from-source) | Linux, macOS, Windows | A mano | Desarrolladores y auditores |

Elijas la que elijas, el minero guarda su identidad en `~/.urnetwork` (`%USERPROFILE%\.urnetwork` en Windows), así que más adelante puedes cambiar de forma sin volver a registrarte. Haz primero una copia de seguridad de esa carpeta y detén la tarea en segundo plano de la forma antigua antes de iniciar la nueva, para que nunca se ejecuten dos copias a la vez. Después de instalar, vuelve al [inicio rápido](/docs/miner#2-run-setup).

## Los instaladores

Cada instalador coloca el minero en tu propia carpeta de usuario (sin necesidad de permisos de administrador), lo ejecuta en segundo plano, lo mantiene actualizado y te da un único comando para gestionarlo todo: `urnet-tools`. Están en la [carpeta `scripts` de urnetwork/connect](https://github.com/urnetwork/connect/tree/main/scripts).

Los tres:

- descargan la última versión para tu procesador, la verifican con el SHA-256 que GitHub publica para ella (eso detecta una descarga dañada) e instalan solo el programa de tu máquina;
- instalan el minero como **`urnetwork`**: escribe `urnetwork` donde esta guía diga `provider`, también en los comandos que el minero imprime para que los copies;
- piden tu código de autorización si aún no has iniciado sesión (presiona Enter para hacerlo más tarde; `--auth-code <code>`, o `-AuthCode` en Windows, inicia la sesión sin preguntar, pero deja el código en el historial de tu shell; `URNETWORK_AUTH_CODE` o la solicitud interactiva no lo dejan);
- registran un dispositivo nuevo en su primer inicio, una vez que has iniciado sesión;
- activan las [actualizaciones automáticas](/docs/miner/updates), cada 6 horas de forma predeterminada;
- pueden ejecutarse de nuevo en cualquier momento: una segunda ejecución actualiza en el mismo lugar y conserva tus ajustes y tu identidad.

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

Luego abre una terminal nueva o ejecuta la línea `export PATH=…` que imprime. Funciona en Intel, AMD y ARM de 64 y 32 bits, incluida una Raspberry Pi 2 o posterior con un sistema operativo de 32 bits (no en una Pi Zero ni en una Pi 1), y necesita `curl` o `wget`, y `jq` o `python3` (la mayoría de los sistemas tienen alguno). El instalador:

- instala `urnetwork` y `urnet-tools` en `~/.local/share/urnetwork-provider/bin` y añade esa carpeta a tu `PATH` en `~/.bashrc` (creándolo si hace falta) y en `~/.zshrc` si lo tienes. Pasa `-B` para no tocarlos. Si una terminal nueva sigue sin encontrar `urnetwork`, ejecuta la línea `export PATH=…` que imprimió el instalador;
- ejecuta el minero como un servicio de usuario de systemd, `urnetwork.service`, con un temporizador de actualizaciones, y activa lingering para que el servicio siga funcionando después de que cierres sesión (si eso requiere un administrador, imprime el comando `sudo loginctl enable-linger` que hay que ejecutar);
- en una shell sin sesión de usuario de systemd (una shell `sudo su`, muchos contenedores, WSL), instala de todos modos, sin servicio en segundo plano ni actualizaciones automáticas, y te indica cómo ejecutar el minero en primer plano. Ejecuta `urnet-tools update` tú mismo de vez en cuando. Si se ejecuta como root en una shell así, instala en su lugar un servicio del sistema.

`--interval 6h`, `daily`, `weekly` o `monthly` define cada cuánto busca actualizaciones.

Un servicio de usuario no puede escuchar en el puerto TCP 443, que necesita el [extensor](/docs/miner/extender) del minero. `--system` ejecuta el minero como un servicio del sistema, aunque todavía con tu usuario, con permiso para escuchar en los puertos por debajo de 1024:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

Ejecútalo con tu usuario, no con `sudo`; te pedirá tu contraseña de `sudo` una vez. Consulta [Permitir que el minero escuche en el puerto 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).

Las opciones van después de `sh -s --`, por ejemplo `curl -fsSL … | sh -s -- --no-start`. Ejecútalo con `--help` para verlas todas.

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

Luego abre una ventana nueva de Terminal. Necesita macOS 12 o posterior y nada más, y funciona en Mac con Apple silicon e Intel (también desde una terminal de Rosetta: elige la compilación nativa). El instalador:

- instala `urnetwork` y `urnet-tools` en `~/.local/share/urnetwork-provider/bin` y añade esa carpeta a tu `PATH` en `~/.zshrc` (y en `~/.bash_profile` si usas bash). Pasa `-B` para no tocarlos;
- ejecuta el minero como un agente de launchd que se inicia cuando inicias sesión y reinicia el minero si se bloquea. macOS puede mostrar una notificación «Background Items Added»; es lo esperado. Aparece como `urnet-tools` en System Settings → General → Login Items;
- elimina por ti la marca de cuarentena de la descarga y se niega a ejecutarse con `sudo`.

En macOS, `--dry-run` imprime todo lo que haría sin cambiar nada, y `-y` responde por sí mismo a todas las preguntas. El registro del minero está en `~/Library/Logs/urnetwork/`.

### Windows

En una ventana normal de PowerShell (no «Ejecutar como administrador»):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Funciona en Windows PowerShell 5.1 y PowerShell 7, en Intel o AMD de 64 bits y en ARM64. El instalador:

- instala `urnetwork.exe`, `urnet-tools` y el actualizador en `%LOCALAPPDATA%\urnetwork\provider` y añade esa carpeta a tu `PATH`. Abre una ventana nueva después;
- una vez que has iniciado sesión, pregunta si quieres ejecutar el minero en segundo plano, ahora y cada vez que inicies sesión en Windows. Se ejecuta oculto, mediante accesos directos en tu carpeta de Inicio, así que **se detiene cuando cierras sesión**. Si inicias sesión más tarde, ejecuta `urnet-tools auto-start on` y `urnet-tools start`;
- instala `urnet-tools.cmd` junto a `urnet-tools.ps1`. Si PowerShell dice «running scripts is disabled», escribe `urnet-tools.cmd` en lugar de `urnet-tools`.

`urnetwork.exe` no está firmado digitalmente, así que SmartScreen o Defender pueden preguntar antes de ejecutarlo. Las opciones de Windows tienen estilo de PowerShell: `-Tag`, `-AuthCode`, `-NoStart`, `-NoAutoUpdate`, `-AddToStartup`, `-NoStartup`, `-NonInteractive`. Instalar una versión concreta con `-Tag` deja desactivadas las actualizaciones automáticas. No se pueden pasar a través de `irm … | iex`: guarda el script y ejecútalo, por ejemplo `powershell -ExecutionPolicy Bypass -File .\Provider_Install_Win32.ps1 -NoStart`, o define `$env:URNETWORK_AUTH_CODE` antes de la línea de `irm`. `Get-Help .\Provider_Install_Win32.ps1 -Detailed` las enumera todas.

### Gestionarlo con urnet-tools

| Comando | Qué hace |
| --- | --- |
| `urnet-tools status` | La versión, si has iniciado sesión, si el minero está en ejecución, si arranca solo y si se actualiza. |
| `urnet-tools start`, `stop`, `restart` | Iniciar, detener o reiniciar el minero en segundo plano. |
| `urnet-tools logs` | Seguir el registro del minero; Ctrl-C para salir. |
| `urnet-tools version` | La versión instalada, y la última si es más reciente. |
| `urnet-tools update` | Actualizar ahora (el minero y el propio `urnet-tools`). |
| `urnet-tools auto-update`, `auto-update on`, `off` | Mostrar o cambiar las actualizaciones automáticas; consulta [Actualizaciones](/docs/miner/updates). |
| `urnet-tools auto-start on`, `off` | Iniciar el minero al arrancar o al iniciar sesión, o no. |
| `urnet-tools reinstall -t <version>` | Instalar una versión concreta. |
| `urnet-tools uninstall` | Quitar el minero, conservando tu identidad. |

`urnet-tools --help` enumera todo lo disponible para tu sistema (en Windows: `urnet-tools help`). Las opciones se escriben como `--option value` o `--option=value`; en Windows tienen estilo de PowerShell, como `-Interval` y `-RemoveIdentity`.

### Desinstalar

```bash
urnet-tools uninstall
```

Quita el minero, su tarea en segundo plano y su entrada en `PATH`, y **conserva** tu identidad en `~/.urnetwork`, para que puedas volver a instalarlo más adelante como el mismo dispositivo. Para borrar también la identidad, añade `--remove-identity` (`-RemoveIdentity` en Windows); primero te pide que escribas `delete`. [Haz una copia de seguridad](/docs/miner/run#back-up-your-miner) antes: sin ella, el dispositivo no se puede recuperar.

## Descarga manual

Cada versión en la [página de versiones de build](https://github.com/urnetwork/build/releases) tiene un archivo llamado `urnetwork-provider-<version>.tar.gz`. Es una descarga grande (unos 240 MB), porque contiene un programa `provider` para cada sistema, en `<os>/<arch>/provider` (`provider.exe` en Windows). También incluye compilaciones MIPS para routers.

| Tu computadora | Carpeta en la descarga |
| --- | --- |
| PC o servidor Linux (Intel o AMD, 64 bits) | `linux/amd64` |
| Raspberry Pi 3, 4 o 5 con un sistema operativo de 64 bits, u otro Linux ARM de 64 bits | `linux/arm64` |
| PC Linux antiguo de 32 bits con Intel o AMD | `linux/386` |
| Raspberry Pi 2, 3, 4 o 5, u otra placa ARMv7, con un sistema operativo de 32 bits (no una Pi Zero ni una Pi 1) | `linux/arm` |
| Mac con Apple silicon (M1 o posterior) | `darwin/arm64` |
| Mac con procesador Intel | `darwin/amd64` |
| PC con Windows (Intel o AMD, 64 bits) | `windows/amd64` |
| Windows en ARM | `windows/arm64` |

En Linux o macOS, descárgalo e instálalo en `~/.local/bin`, eligiendo tu carpeta en la tabla:

```bash
VERSION=<version>   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-provider.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-provider-${VERSION}.tar.gz"
tar -xzf urnetwork-provider.tar.gz linux/amd64/provider            # your folder from the table
mkdir -p "$HOME/.local/bin"
install -m 755 linux/amd64/provider "$HOME/.local/bin/provider"   # your folder from the table
export PATH="$HOME/.local/bin:$PATH"
provider --version
```

Añade la línea `export PATH=…` al archivo de inicio de tu shell (`~/.bashrc` en la mayoría de los sistemas Linux, `~/.zshrc` en macOS) para que el comando se encuentre en las terminales nuevas.

En macOS, un archivo descargado con un navegador web (no con `curl` como arriba) queda en cuarentena y no se ejecuta. Quita la cuarentena una vez:

```bash
xattr -d com.apple.quarantine "$HOME/.local/bin/provider"
```

En Windows, en PowerShell, colócalo en una carpeta que sea tuya, para que las actualizaciones puedan reemplazarlo:

```powershell
$Version = "<version>"   # the latest tag on the releases page, without the leading v
$Arch = "amd64"          # or arm64, from the table
$Dir = "$env:LOCALAPPDATA\Programs\urnetwork"
New-Item -ItemType Directory -Force $Dir | Out-Null
$ProgressPreference = "SilentlyContinue"
Invoke-WebRequest -UseBasicParsing -OutFile "$env:TEMP\urnetwork-provider.tar.gz" "https://github.com/urnetwork/build/releases/download/v$Version/urnetwork-provider-$Version.tar.gz"
tar -xzf "$env:TEMP\urnetwork-provider.tar.gz" -C $env:TEMP "windows/$Arch/provider.exe"
Move-Item -Force "$env:TEMP\windows\$Arch\provider.exe" "$Dir\provider.exe"
& "$Dir\provider.exe" --version
```

Ejecútalo como `& "$Dir\provider.exe"`, o añade esa carpeta a tu `PATH` para escribir `provider`. `provider.exe` no está firmado digitalmente, así que SmartScreen o Defender pueden preguntar antes de ejecutarlo.

Luego vuelve al [inicio rápido](/docs/miner#2-run-setup) y ejecuta `provider setup`. Su servicio en segundo plano también mantiene actualizada una instalación manual; consulta [Actualizaciones](/docs/miner/updates).

## Compilar desde el código fuente

Usa la versión de Go que pide `sn/go.mod` (actualmente Go 1.27.3) y las revisiones correspondientes de los repositorios hermanos a los que apuntan sus directivas `replace`. La carpeta del código fuente debe quedar así:

```text
urnetwork/
├── sn/                 # github.com/urfoundation/sn
├── connect/            # includes connect/sctp
├── sdk/
├── server/
├── warp/
├── proxy/
├── userwireguard/
├── glog/
├── goidenticons/
└── gvisor/             # matching generated Go source selected by the release
```

Los reemplazos locales forman parte de la compilación: usa los checkouts del código fuente correspondientes o el paquete de código fuente de la versión que estás desplegando. Un checkout de `sn` por sí solo no basta. Obtén el código fuente generado de `gvisor` correspondiente con ese paquete; una revisión arbitraria del upstream no es un sustituto reproducible.

Desde la carpeta `sn`:

```bash
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/provider" ./cli/miner
export PATH="$HOME/.local/bin:$PATH"
provider --help
```

Una compilación propia indica `development build` y nunca se actualiza sola. Actualízala volviendo a compilar.

## Un binario de tu operador

También puedes ejecutar un binario de `provider` que tu operador compile a partir del código fuente de la misma versión.
