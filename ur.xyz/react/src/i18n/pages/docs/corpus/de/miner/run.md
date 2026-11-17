---
published: 2026-10-21
description: Den UR-Miner im Alltag betreiben. Starten und stoppen, einen Betreiber wählen, im Hintergrund laufen lassen, Logs und Statusseite lesen und ihn sichern.
---

# Den Miner betreiben und überwachen

Diese Seite setzt voraus, dass du den Miner [installiert](/docs/miner/install) und [eingerichtet](/docs/miner#2-run-setup) hast. Wenn du einen Installer benutzt hast, tippe `urnetwork` überall, wo diese Seite `provider` sagt.

## Starten und stoppen

Um in einem Terminal zu minen:

```bash
provider start
```

Er zeigt eine kurze Live-Ansicht (Connecting, Connected, ● Mining) und läuft, bis du ihn mit Ctrl-C stoppst. Das ausführliche Log geht nach `miner.log` im Ordner `~/.urnetwork`; füge `-v` hinzu, um es stattdessen im Terminal zu sehen.

Der erste Start auf einem neuen Gerät fragt nach, bevor er es registriert, und speichert seine Identität in `~/.urnetwork`. Jeder spätere Start verwendet diese Identität wieder. In einem Skript, in dem niemand antworten kann, füge beim ersten Start `--allow-client-registration` hinzu. `provider provide` ist derselbe Befehl mit der vollständigen Log-Ausgabe, für Skripte und Dienste.

Registriere nur ein wirklich neues Gerät. Eine Registrierung ersetzt nie eine Identität, die der Miner schon hat, aber lösche keine Dateien, um an einem Fehler über eine fehlende oder nicht passende Identität vorbeizukommen: Siehe stattdessen [Fehlerbehebung](/docs/miner/troubleshooting#the-miner-stops-straight-away).

Führe jeden Miner-Befehl und den Hintergrunddienst als derselbe Benutzer aus. Jeder Benutzer hat sein eigenes `~/.urnetwork`.

## Einen Betreiber wählen

Der Miner bedient den Standardbetreiber `bringyour.com` (`https://api.bringyour.com` und `wss://connect.bringyour.com`), sofern du keinen anderen wählst. Um einen anderen Betreiber zu bedienen, wähle ihn **vor** dem ersten Start, mit den URLs, die er veröffentlicht:

```bash
provider network use https://api.example.net wss://connect.example.net
provider network
```

API-URLs beginnen mit `https://` und Connect-URLs mit `wss://` (einfaches `http://` und `ws://` funktionieren nur für einen lokalen Testserver). `provider network` allein zeigt den aktiven Betreiber, und `provider network reset` kehrt zum Standard zurück. Die Wahl wird gespeichert und gilt für jeden späteren Befehl. Führe dann `provider setup` oder `provider login` mit einem Auth-Code dieses Betreibers aus.

Ein Wechsel des Betreibers zieht ein bereits registriertes Gerät nicht zum neuen um. Halte für jeden Betreiber einen eigenen Zustand und ein eigenes Konto. Um jeden Betreiber der veröffentlichten Liste auf einmal zu bedienen, siehe [Für jeden gelisteten Betreiber minen](/docs/miner/advanced#mine-every-listed-operator).

## Im Hintergrund laufen lassen

### Mit einem Installer

Die [Installer](/docs/miner/install#the-installers) betreiben den Miner bereits im Hintergrund: als systemd-Benutzerdienst unter Linux (oder, mit `--system` installiert, als [Systemdienst, der unter deinem Benutzer läuft](/docs/miner/extender#with-the-linux-installer)), als launchd-Agent unter macOS und über Autostart-Verknüpfungen unter Windows. Verwalte ihn mit `urnet-tools`:

```bash
urnet-tools start          # start it (no error if it's already running)
urnet-tools status         # version, signed in, running, updates; exits 3 when it isn't running
urnet-tools logs           # follow its log; Ctrl-C to stop reading
urnet-tools restart
urnet-tools stop           # stop it until you start it again, restart (Linux) or log in again (macOS, Windows)
urnet-tools auto-update off   # turn automatic updates off; `on` turns them back on
```

Wenn du die Anmeldung bei der Installation übersprungen hast, führe `urnetwork login` aus und dann `urnet-tools start`: Das registriert das Gerät und startet den Miner. Wie automatische Updates funktionieren, steht unter [Updates](/docs/miner/updates).

Unter Linux und Windows funktionieren `provider service start`, `stop`, `status` und `logs` auch mit dem Miner des Installers.

Er startet von selbst beim Booten unter Linux (wenn Lingering eingeschaltet ist; der Installer versucht, es einzuschalten), bei der Anmeldung unter macOS und bei der Anmeldung unter Windows, wo er außerdem **stoppt, wenn du dich abmeldest**. `urnet-tools auto-start off` verhindert, dass er von selbst startet, und `urnet-tools auto-start on` schaltet das wieder ein.

Stürzt der Miner ab, startet systemd ihn unter Linux nach 30 Sekunden neu und launchd unter macOS nach 60. Unter Windows bleibt ein Miner, der stoppt, gestoppt, bis du `urnet-tools start` ausführst oder dich erneut anmeldest. Ein Miner, der sauber beendet wird, etwa weil das Gerät [nicht registriert ist](/docs/miner/troubleshooting#the-miner-stops-straight-away), bleibt gestoppt: `urnet-tools status` meldet dann, dass er nicht läuft.

### Mit dem provider-Dienst

`provider setup` bietet an, das einzurichten. Um es selbst zu tun, stoppe den Miner, falls er in einem Terminal läuft, und dann:

```bash
provider service install
```

Er startet den Miner jetzt, startet ihn danach von selbst wieder, startet ihn bei einem Absturz neu und sucht alle 6 Stunden nach [Updates](/docs/miner/updates):

- **Linux:** ein systemd-Benutzerdienst, `urnetwork-provider.service`, der beim Booten startet. Er schaltet Lingering ein, damit der Dienst nach dem Abmelden weiterläuft, oder gibt den auszuführenden Befehl `sudo loginctl enable-linger` aus.
- **macOS:** ein launchd-Agent, der bei der Anmeldung startet. Sein Log ist `service.log` im Ordner `~/.urnetwork`.
- **Windows:** eine Autostart-App, die den Miner unsichtbar startet, wenn du dich bei Windows anmeldest, und stoppt, wenn du dich abmeldest. Sie braucht keine Administratorrechte. Ihr Log ist `service.log` im Ordner `%USERPROFILE%\.urnetwork`.

So verwaltest du ihn:

```bash
provider service status
provider service logs --follow   # Ctrl-C to stop reading
provider service restart
provider service stop
provider service uninstall       # your sign-in and identity are kept
```

Auf einem Server, oder um unter Linux oder macOS für jeden Benutzer des Computers zu minen, verwende einen systemweiten Dienst, der als root läuft, mit seinem Zustand in `/var/lib/urnetwork`: `sudo provider setup --system` oder `sudo provider service install --system`. Füge `--system` zu den anderen `provider service`-Befehlen hinzu, um ihn zu verwalten. Windows hat keinen systemweiten Dienst. Unter Linux kann ein Benutzerdienst für den Extender des Miners nicht auf TCP-Port 443 lauschen; `sudo "$(command -v provider)" service install --system --as="$USER"` betreibt ihn als Systemdienst, der dein Benutzer bleibt und auf diesem Port lauschen darf. Siehe [Den Miner auf Port 443 lauschen lassen](/docs/miner/extender#linux-let-the-miner-listen-on-port-443). Für viele Maschinen richtet `provider setup --yes --auth-code-file=<path>` alles ohne Rückfragen ein; den Auszahlungsschritt überspringt es, also [lege danach die Auszahlungs-Wallet fest](/docs/miner/rewards#set-your-payout-wallet).

Unter Linux und Windows fügt `provider service install` neben dem Miner eines Installers keinen zweiten hinzu. Unter macOS sieht er den Agenten des Installers nicht; wenn du den macOS-Installer benutzt hast, verwende also weiter `urnet-tools` und installiere keinen zweiten Dienst.

### Ein eigener Dienst

Um den Miner mit eigenen Optionen oder ohne systemd oder launchd zu betreiben, führe `provider provide` unter deinem eigenen Dienstmanager, `tmux` oder `screen` aus. Lege unter Linux zum Beispiel `~/.config/systemd/user/ur-miner.service` an:

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

Stoppe den Miner, falls er läuft, aktiviere dann den Dienst und folge seinem Log:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ur-miner.service
journalctl --user -u ur-miner.service -f
```

Damit er nach dem Abmelden weiterläuft, schalte einmal Lingering ein: `sudo loginctl enable-linger "$USER"`. Lass `--allow-client-registration` aus dem Dienstbefehl weg, damit eine fehlende Identität den Dienst stoppt, statt unbemerkt ein neues Gerät zu registrieren. Betreibe diesen Dienst und `provider service` nicht gleichzeitig. Ein eigener Dienst aktualisiert den Miner nicht; siehe [Updates](/docs/miner/updates#without-automatic-updates).

## Prüfen, ob er funktioniert

### Status und Doctor

```bash
provider status
```

Je eine Zeile für den Miner, die Anmeldung, die Registrierung des Geräts, die Verbindung und die Updates, dazu der nächste auszuführende Befehl, wenn etwas nicht stimmt. Der Befehl endet mit 0, wenn alles in Ordnung ist, mit 3, wenn das Gerät eingerichtet werden muss, und mit 4, wenn der Miner nicht läuft oder nicht verbunden ist. `provider status --json` gibt dasselbe für Skripte und Monitoring aus.

```bash
provider doctor
```

Sucht nach Gründen, warum sich der Miner nicht anmelden oder verbinden kann: ob der Zustandsordner privat ist, DNS, die Verbindung zum Betreiber, einen Proxy oder eine Firewall, die TLS inspiziert, die Uhr und ob sich Updates installieren lassen. Für jedes gefundene Problem nennt er die Lösung.

### Das Log

`provider start` schreibt sein Log nach `miner.log` im Ordner `~/.urnetwork`. Für einen Hintergrund-Miner verwende `provider service logs --follow` oder mit einem Installer `urnet-tools logs`.

Der Miner schreibt viele Log-Zeilen in einigen Formaten; die meisten sind Routine. Diese Zeilen sind gute Zeichen:

- `"event":"identity_available"`: Er hat die Identität dieses Geräts gefunden oder angelegt.
- Der Miner läuft weiter. Stoppt er innerhalb weniger Sekunden von selbst, stimmt etwas nicht, selbst wenn sein Ende sauber aussieht.

Warnzeichen:

- Eine JSON-Zeile mit `"event":"startup_recovery_required"`, danach beendet sich das Programm: Siehe [Fehlerbehebung](/docs/miner/troubleshooting#the-miner-stops-straight-away).
- Das Wort `refused`, das sich alle paar Sekunden wiederholt: Der Betreiber nimmt die Verbindung nicht an. Siehe [Fehlerbehebung](/docs/miner/troubleshooting#the-log-keeps-saying-refused).

Füge `-v` hinzu, oder `-vv` für noch mehr, um mehr Details zu sehen.

### Die Statusseite

Der Miner kann eine kleine Statusseite in JSON ausliefern. Sie ist standardmäßig aus; schalte sie mit `--port` ein:

```bash
provider provide --port=8080
```

Dann auf derselben Maschine:

```bash
curl -s http://127.0.0.1:8080/
```

Sie zeigt die `version` des Miners (Release-Builds haben eine), seinen `host`-Namen und einen Abschnitt `diagnostics` mit dem letzten Ergebnis der Anmeldung (`authentication`), von `keys`, `extender` und `runtime`. Das `"status":"ok"` auf oberster Ebene bedeutet nur, dass der Miner-Prozess läuft; es bedeutet nicht, dass er verbunden ist oder verdient, also lies auch die `diagnostics`.

Die Statusseite lauscht auf jeder Netzwerkschnittstelle, nicht nur auf der lokalen. Sperre diesen Port in deiner Firewall oder erlaube nur dein Monitoring-Netz.

## Nützliche Optionen

| Option | Was sie tut |
| --- | --- |
| `--max-memory=1gib` | Ein weiches Speicherziel, in Bytes oder mit `b`, `kib`, `mib` oder `gib`. Ohne sie wählt der Miner eines anhand des Arbeitsspeichers des Computers. |
| `-v`, `-vv` | Mehr Details im Log. |
| `--port=<port>` | Die [Statusseite](#the-status-page) auf diesem Port ausliefern. `0`, der Standard, schaltet sie aus. |

`provider auth-provide` meldet an und startet in einem Befehl. Ein neues Gerät braucht trotzdem `--allow-client-registration`. Alle Optionen stehen in `provider help all` und in der [Referenz](/docs/miner/reference).

## Deinen Miner sichern

Alles, was dieses Gerät zu *deinem* Miner macht, liegt in `~/.urnetwork`: sein Identitätsschlüssel, seine Registrierung, seine Anmeldung und deine signierte Wallet-Historie. Wenn du es verlierst, kannst du das Gerät nicht wiederherstellen, auch wenn du dich weiterhin bei deinem Konto anmelden kannst.

- Stoppe den Miner (oder seinen Dienst), bevor du den Ordner kopierst, damit nichts halb geschrieben ist.
- Kopiere den **ganzen** Ordner, halte die Kopie privat und stelle sie als Ganzes wieder her.
- Betreibe nie zwei Kopien desselben Ordners gleichzeitig, weder auf einer Maschine noch auf zweien.

Die [Referenz](/docs/miner/reference#files-the-miner-keeps) listet jede Datei im Ordner auf.
