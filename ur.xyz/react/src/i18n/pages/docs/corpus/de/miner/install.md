---
published: 2026-10-21
description: Den UR-Miner installieren. Die Installer für Linux, macOS und Windows mit automatischen Updates, ein manueller Download und der Build von provider aus dem Quellcode.
---

# Den Miner installieren

Der Miner ist ein einzelnes Programm, `provider`. Es gibt drei Wege, ihn zu bekommen:

| Weg | Systeme | Updates | Am besten für |
| --- | --- | --- | --- |
| [Installer](#the-installers) | Linux, macOS, Windows | Automatisch | Die meisten |
| [Manueller Download](#manual-download) | Linux, macOS, Windows | Automatisch, mit `provider setup` | Volle Kontrolle |
| [Build aus dem Quellcode](#build-from-source) | Linux, macOS, Windows | Von Hand | Entwickler und Auditoren |

Egal, wofür du dich entscheidest: Der Miner bewahrt seine Identität in `~/.urnetwork` auf (`%USERPROFILE%\.urnetwork` unter Windows), sodass du später wechseln kannst, ohne dich neu zu registrieren. Sichere diesen Ordner zuerst und stoppe den Hintergrundjob des alten Wegs, bevor du den neuen startest, damit nie zwei Kopien gleichzeitig laufen. Gehe nach der Installation zurück zum [Schnellstart](/docs/miner#2-run-setup).

## Die Installer

Jeder Installer legt den Miner in deinem eigenen Benutzerordner ab (keine Administratorrechte nötig), betreibt ihn im Hintergrund, hält ihn aktuell und gibt dir einen Befehl, um alles zu verwalten: `urnet-tools`. Sie liegen im [Ordner `scripts` von urnetwork/connect](https://github.com/urnetwork/connect/tree/main/scripts).

Alle drei:

- laden das neueste Release für deinen Prozessor herunter, prüfen es gegen die SHA-256-Prüfsumme, die GitHub dafür auflistet (das erkennt einen beschädigten Download), und installieren nur das Programm für deinen Rechner;
- installieren den Miner als **`urnetwork`**: Tippe `urnetwork` überall, wo dieser Leitfaden `provider` sagt, auch in Befehlen, die der Miner zum Kopieren ausgibt;
- fragen nach deinem Auth-Code, wenn du noch nicht angemeldet bist (drücke Enter, um das später zu erledigen; `--auth-code <code>`, oder `-AuthCode` unter Windows, meldet dich ohne Nachfrage an, hinterlässt den Code aber in deiner Shell-Historie; `URNETWORK_AUTH_CODE` oder die Eingabeaufforderung tun das nicht);
- registrieren beim ersten Start ein neues Gerät, sobald du angemeldet bist;
- schalten [automatische Updates](/docs/miner/updates) ein, standardmäßig alle 6 Stunden;
- lassen sich jederzeit erneut ausführen: Ein zweiter Lauf aktualisiert an Ort und Stelle und behält deine Einstellungen und deine Identität.

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

Öffne dann ein neues Terminal oder führe die `export PATH=…`-Zeile aus, die er ausgibt. Er läuft auf 64-Bit- und 32-Bit-Systemen mit Intel, AMD und ARM, einschließlich eines Raspberry Pi 2 oder neuer mit 32-Bit-Betriebssystem (nicht auf einem Pi Zero oder Pi 1), und braucht `curl` oder `wget` sowie `jq` oder `python3` (die meisten Systeme haben eines davon). Er:

- installiert `urnetwork` und `urnet-tools` nach `~/.local/share/urnetwork-provider/bin` und fügt diesen Ordner deinem `PATH` in der Datei `~/.bashrc` hinzu (und legt die Datei bei Bedarf an) sowie in `~/.zshrc`, falls vorhanden. Übergib `-B`, damit er diese Dateien nicht anfasst. Wenn ein neues Terminal `urnetwork` immer noch nicht findet, führe die `export PATH=…`-Zeile aus, die der Installer ausgegeben hat;
- betreibt den Miner als systemd-Benutzerdienst, `urnetwork.service`, mit einem Update-Timer und schaltet Lingering ein, damit der Dienst nach dem Abmelden weiterläuft (braucht das einen Administrator, gibt er den auszuführenden Befehl `sudo loginctl enable-linger` aus);
- installiert in einer Shell ohne systemd-Benutzersitzung (eine `sudo su`-Shell, viele Container, WSL) trotzdem, aber ohne Hintergrunddienst und ohne automatische Updates, und sagt dir, wie du den Miner im Vordergrund betreibst. Führe dann ab und zu selbst `urnet-tools update` aus. Als root in einer solchen Shell ausgeführt, installiert er stattdessen einen Systemdienst.

`--interval 6h`, `daily`, `weekly` oder `monthly` legt fest, wie oft er nach Updates sucht.

Ein Benutzerdienst kann nicht auf TCP-Port 443 lauschen, den der [Extender](/docs/miner/extender) des Miners braucht. `--system` betreibt den Miner stattdessen als Systemdienst, weiterhin als dein Benutzer, mit der Erlaubnis, auf Ports unter 1024 zu lauschen:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

Führe ihn unter deinem eigenen Benutzer aus, nicht mit `sudo`; er fragt einmal nach deinem `sudo`-Passwort. Siehe [Den Miner auf Port 443 lauschen lassen](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).

Optionen kommen nach `sh -s --`, zum Beispiel `curl -fsSL … | sh -s -- --no-start`. Führe ihn mit `--help` aus, um alle zu sehen.

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

Öffne dann ein neues Terminal-Fenster. Er braucht macOS 12 oder neuer und sonst nichts und funktioniert auf Macs mit Apple Silicon und Intel (auch aus einem Rosetta-Terminal, er wählt den nativen Build). Er:

- installiert `urnetwork` und `urnet-tools` nach `~/.local/share/urnetwork-provider/bin` und fügt diesen Ordner deinem `PATH` in der Datei `~/.zshrc` hinzu (und in `~/.bash_profile`, wenn du bash verwendest). Übergib `-B`, damit er diese Dateien nicht anfasst;
- betreibt den Miner als launchd-Agent, der beim Anmelden startet und den Miner neu startet, wenn er abstürzt. macOS zeigt eventuell eine Mitteilung „Background Items Added“; das ist zu erwarten. Er erscheint als `urnet-tools` unter System Settings → General → Login Items;
- entfernt für dich das Quarantäne-Flag des Downloads und verweigert die Ausführung mit `sudo`.

Unter macOS gibt `--dry-run` alles aus, was er tun würde, ohne etwas zu ändern, und `-y` beantwortet jede Frage selbst. Das Log des Miners liegt in `~/Library/Logs/urnetwork/`.

### Windows

In einem normalen PowerShell-Fenster (nicht „Als Administrator ausführen“):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Er funktioniert in Windows PowerShell 5.1 und PowerShell 7, auf 64-Bit-Intel oder -AMD und auf ARM64. Er:

- installiert `urnetwork.exe`, `urnet-tools` und das Update-Programm nach `%LOCALAPPDATA%\urnetwork\provider` und fügt diesen Ordner deinem `PATH` hinzu. Öffne danach ein neues Fenster;
- fragt, sobald du angemeldet bist, ob der Miner im Hintergrund laufen soll, jetzt und bei jeder Anmeldung an Windows. Er läuft unsichtbar über Verknüpfungen in deinem Autostart-Ordner und **stoppt daher, wenn du dich abmeldest**. Wenn du dich erst später anmeldest, führe `urnet-tools auto-start on` und `urnet-tools start` aus;
- installiert `urnet-tools.cmd` neben `urnet-tools.ps1`. Meldet PowerShell „running scripts is disabled“, tippe `urnet-tools.cmd` statt `urnet-tools`.

`urnetwork.exe` ist nicht codesigniert, daher fragen SmartScreen oder Defender womöglich nach, bevor es ausgeführt wird. Windows-Optionen sind im PowerShell-Stil: `-Tag`, `-AuthCode`, `-NoStart`, `-NoAutoUpdate`, `-AddToStartup`, `-NoStartup`, `-NonInteractive`. Wer mit `-Tag` eine bestimmte Version installiert, lässt automatische Updates ausgeschaltet. Über `irm … | iex` lassen sie sich nicht übergeben: Speichere das Skript und führe es aus, zum Beispiel `powershell -ExecutionPolicy Bypass -File .\Provider_Install_Win32.ps1 -NoStart`, oder setze `$env:URNETWORK_AUTH_CODE` vor der `irm`-Zeile. `Get-Help .\Provider_Install_Win32.ps1 -Detailed` listet sie alle auf.

### Verwalten mit urnet-tools

| Befehl | Was er tut |
| --- | --- |
| `urnet-tools status` | Version, ob du angemeldet bist, ob der Miner läuft, von selbst startet und sich aktualisiert. |
| `urnet-tools start`, `stop`, `restart` | Den Hintergrund-Miner starten, stoppen oder neu starten. |
| `urnet-tools logs` | Dem Log des Miners folgen; Ctrl-C zum Beenden. |
| `urnet-tools version` | Die installierte Version und die neueste, falls sie neuer ist. |
| `urnet-tools update` | Jetzt aktualisieren (den Miner und `urnet-tools` selbst). |
| `urnet-tools auto-update`, `auto-update on`, `off` | Automatische Updates anzeigen oder ändern; siehe [Updates](/docs/miner/updates). |
| `urnet-tools auto-start on`, `off` | Den Miner beim Booten oder Anmelden starten, oder nicht. |
| `urnet-tools reinstall -t <version>` | Ein bestimmtes Release installieren. |
| `urnet-tools uninstall` | Den Miner entfernen und deine Identität behalten. |

`urnet-tools --help` listet alles für dein System auf (unter Windows: `urnet-tools help`). Optionen werden als `--option value` oder `--option=value` angegeben; unter Windows sind sie im PowerShell-Stil, etwa `-Interval` und `-RemoveIdentity`.

### Deinstallieren

```bash
urnet-tools uninstall
```

Er entfernt den Miner, seinen Hintergrundjob und seinen `PATH`-Eintrag und **behält** deine Identität in `~/.urnetwork`, sodass du später als dasselbe Gerät neu installieren kannst. Um auch die Identität zu löschen, füge `--remove-identity` hinzu (`-RemoveIdentity` unter Windows); er verlangt zuerst, dass du `delete` eintippst. [Sichere sie](/docs/miner/run#back-up-your-miner), bevor du das tust: Ohne sie lässt sich das Gerät nicht wiederherstellen.

## Manueller Download

Jedes Release auf der [Release-Seite von build](https://github.com/urnetwork/build/releases) hat eine Datei namens `urnetwork-provider-<version>.tar.gz`. Das ist ein großer Download (etwa 240 MB), weil er für jedes System ein `provider`-Programm enthält, unter `<os>/<arch>/provider` (`provider.exe` unter Windows). Er enthält auch MIPS-Builds für Router.

| Dein Computer | Ordner im Download |
| --- | --- |
| Linux-PC oder -Server (Intel oder AMD, 64 Bit) | `linux/amd64` |
| Raspberry Pi 3, 4 oder 5 mit 64-Bit-Betriebssystem oder ein anderes 64-Bit-ARM-Linux | `linux/arm64` |
| Älterer 32-Bit-Linux-PC mit Intel oder AMD | `linux/386` |
| Raspberry Pi 2, 3, 4 oder 5 oder ein anderes ARMv7-Board mit 32-Bit-Betriebssystem (kein Pi Zero oder Pi 1) | `linux/arm` |
| Mac mit Apple Silicon (M1 oder neuer) | `darwin/arm64` |
| Mac mit Intel-Prozessor | `darwin/amd64` |
| Windows-PC (Intel oder AMD, 64 Bit) | `windows/amd64` |
| Windows auf ARM | `windows/arm64` |

Unter Linux oder macOS lädst du es herunter und installierst es nach `~/.local/bin`, mit deinem Ordner aus der Tabelle:

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

Füge die `export PATH=…`-Zeile der Startdatei deiner Shell hinzu (`~/.bashrc` auf den meisten Linux-Systemen, `~/.zshrc` unter macOS), damit der Befehl in neuen Terminals gefunden wird.

Unter macOS wird eine Datei, die du mit einem Webbrowser heruntergeladen hast (nicht wie oben mit `curl`), unter Quarantäne gestellt und startet nicht. Entferne die Quarantäne einmal:

```bash
xattr -d com.apple.quarantine "$HOME/.local/bin/provider"
```

Lege es unter Windows in PowerShell in einen Ordner, der dir gehört, damit Updates es ersetzen können:

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

Starte es als `& "$Dir\provider.exe"` oder füge diesen Ordner deinem `PATH` hinzu, um `provider` tippen zu können. `provider.exe` ist nicht codesigniert, daher fragen SmartScreen oder Defender womöglich nach, bevor es ausgeführt wird.

Gehe dann zurück zum [Schnellstart](/docs/miner#2-run-setup) und führe `provider setup` aus. Sein Hintergrunddienst hält auch eine manuelle Installation aktuell; siehe [Updates](/docs/miner/updates).

## Build aus dem Quellcode

Verwende die Go-Version, die `sn/go.mod` verlangt (derzeit Go 1.27.3), und passende Revisionen der benachbarten Repositorys, auf die seine `replace`-Direktiven zeigen. Der Quellordner muss so aussehen:

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

Die lokalen Ersetzungen gehören zum Build: Verwende die passenden Quell-Checkouts oder das Quellpaket für das Release, das du bereitstellst. Ein Checkout von `sn` allein reicht nicht. Besorge dir den passenden generierten `gvisor`-Quellcode mit diesem Paket; eine beliebige Upstream-Revision ist kein reproduzierbarer Ersatz.

Im Ordner `sn`:

```bash
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/provider" ./cli/miner
export PATH="$HOME/.local/bin:$PATH"
provider --help
```

Ein eigener Build meldet `development build` und aktualisiert sich nie selbst. Aktualisiere ihn, indem du neu baust.

## Ein Binary von deinem Betreiber

Du kannst auch ein `provider`-Binary ausführen, das dein Betreiber aus dem Quellcode desselben Releases baut.
