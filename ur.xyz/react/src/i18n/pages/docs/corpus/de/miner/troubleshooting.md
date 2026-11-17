---
published: 2026-10-21
description: Häufige Probleme des UR-Miners beheben. Anmeldefehler, ein Miner, der sofort stoppt oder immer abgewiesen wird, Wallet- und Claim-Fehler und wo du Hilfe bekommst.
---

# Fehlerbehebung für den Miner

Suche unten die Meldung, die du siehst, oder das ähnlichste Symptom. Wenn du einen Installer benutzt hast, tippe `urnetwork` überall, wo diese Seite `provider` sagt. Kommst du trotzdem nicht weiter? Frag [auf unserem Discord](https://discord.gg/urnetwork), mit dem Befehl, den du ausgeführt hast, und dem, was er ausgegeben hat. Poste nie deinen Auth-Code, Seed-Dateien oder irgendetwas aus `~/.urnetwork`.

## Installieren

### `urnetwork: command not found` nach der Installation

Der Installer fügt seinen Ordner deinem `PATH` in der Startdatei deiner Shell hinzu (`~/.bashrc` und, falls vorhanden, `~/.zshrc` unter Linux; `~/.zshrc` und für bash `~/.bash_profile` unter macOS), die nur neue Terminals lesen. Öffne ein neues Terminal oder führe die `export PATH=…`-Zeile aus, die der Installer ausgegeben hat. Unter Windows öffne ein neues PowerShell-Fenster. Wenn du mit `-B` installiert hast, füge den Ordner selbst hinzu: siehe [die Installer](/docs/miner/install#the-installers).

### `urnet-tools` meldet unter Windows, dass das Ausführen von Skripten deaktiviert ist

Das ist die Standard-Skriptrichtlinie von Windows. Tippe `urnet-tools.cmd` statt `urnet-tools`, zum Beispiel `urnet-tools.cmd status`.

### `no systemd user session` (Linux)

Der Installer konnte das systemd deines Benutzers nicht erreichen, was in einer `sudo su`-Shell, in vielen Containern und in WSL ohne systemd vorkommt. Er installiert den Miner trotzdem, kann ihn aber nicht im Hintergrund betreiben. Melde dich direkt als der Benutzer an, der den Miner betreiben wird (per SSH oder an der Konsole), und führe den Installer erneut aus, oder betreibe den Miner im Vordergrund: beim ersten Mal mit `urnetwork provide --allow-client-registration`, danach mit `urnetwork provide`. Ohne Benutzersitzung gibt es keine automatischen Updates, also führe ab und zu selbst `urnet-tools update` aus oder verwende stattdessen einen Systemdienst: `sudo urnetwork service install --system`. Als root in einer solchen Shell ausgeführt, installiert der Installer von selbst einen Systemdienst.

### Der Installer meldet, dass dein Prozessor nicht unterstützt wird

Die Releases decken 64-Bit- und 32-Bit-Intel und -AMD, 64-Bit-ARM und 32-Bit-ARMv7 (ein Raspberry Pi 2 oder neuer) unter Linux ab sowie Macs mit Apple Silicon und Intel. Ein Pi Zero oder Pi 1 wird nicht unterstützt. Auf allem anderen [baust du aus dem Quellcode](/docs/miner/install#build-from-source).

### macOS meldet, dass das Programm nicht geöffnet werden kann

Eine mit einem Webbrowser heruntergeladene Datei steht unter Quarantäne. Führe einmal `xattr -d com.apple.quarantine "$HOME/.local/bin/provider"` aus. (Eine mit `curl` heruntergeladene Datei nicht; der Befehl meldet dann `No such xattr`, was harmlos ist.)

## Anmelden

### Beim Einfügen des Auth-Codes erscheint nichts

Das ist Absicht: Die Eingabeaufforderung blendet den Code aus. Füge ihn ein und drücke Enter.

Um aufzugeben, drücke Ctrl-C: Es meldet `Cancelled.` und ändert nichts. Enter bei leerer Eingabe meldet `No auth code was entered`. Halte deinen Code bereit, bevor du `provider login` oder `provider setup` ausführst.

### `That auth code wasn't accepted`

Der Code wurde vertippt, schon verwendet oder ist abgelaufen. Hol dir einen neuen Code aus deinem Betreiberkonto und führe `provider login` erneut aus. In einem Log statt in einem Terminal erscheint derselbe Fehler als `panic: Invalid auth code.`, gefolgt von internen Details, die du ignorieren kannst.

### `… jwt exists. Overwrite? [yN]`

Dieses Gerät ist bereits angemeldet. Antworte `y`, um dich mit dem neuen Code neu anzumelden, oder irgendetwas anderes, um die aktuelle Anmeldung zu behalten.

### `Couldn't reach the URnetwork API`

In einem Log erscheint das als `panic: http request attempts exhausted`. Der Miner konnte den Betreiber nicht erreichen. Prüfe die Internetverbindung des Computers und ob die URLs des Betreibers stimmen (`provider network`).

In einem Netz, das verschlüsselten Verkehr mit einer eigenen Zertifizierungsstelle inspiziert, wie manche Firmennetze, lehnt der Miner diese Stelle ab. Lass `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` auf eine PEM-Datei zeigen, die nur die CA-Zertifikate dieses Netzes enthält, und versuche es erneut. Für den Hintergrunddienst setze die Variable und führe `provider service install` erneut aus.

## Starten

### Frag zuerst den Miner

`provider status` sagt, was fehlt, und nennt den nächsten auszuführenden Befehl, und `provider doctor` prüft den Zustandsordner, DNS, die Verbindung, TLS und die Uhr und nennt für jedes Problem die Lösung. Fang dort an; die Einträge unten erklären die Meldungen genauer.

### Der Miner stoppt sofort

`provider start` sagt den Grund in klaren Worten und endet mit Code 3:

- *This device isn't signed in yet* (dieses Gerät ist noch nicht angemeldet): Führe `provider setup` oder `provider login` aus.
- *This is the first start on this device* (das ist der erste Start auf diesem Gerät): Antworte in einem Terminal mit Ja oder füge in einem Skript `--allow-client-registration` hinzu. Wenn du einen Installer benutzt hast, führe `urnet-tools start` aus: Es registriert ein neues Gerät, sobald du angemeldet bist.

`provider provide` sagt das nur, wenn das Gerät nicht angemeldet ist. Auf einem Gerät, das nie registriert wurde, protokolliert er `startup_recovery_required`, sofern du nicht `--allow-client-registration` hinzufügst.

Andernfalls gibt der Miner eine JSON-Zeile mit `"event":"startup_recovery_required"` aus und beendet sich. Mit `provider provide`, wie die Installer ihn ausführen, endet er mit Code 0 und bleibt gestoppt. `provider start` und der Hintergrund-Miner von `provider service` enden mit Code 1, und der Dienst startet ihn alle 15 bis 30 Sekunden neu: Stoppe ihn mit `provider service stop`, während du den Ordner wiederherstellst. Meist bedeutet das, dass **die Identitätsdateien dieses Geräts fehlen oder nicht zusammenpassen**, zum Beispiel nach dem Umzug auf einen neuen Computer oder nachdem nur ein Teil eines Backups wiederhergestellt wurde. Stelle den ganzen Ordner `~/.urnetwork` aus deinem Backup wieder her. Eine neue Anmeldung ersetzt keine verlorene Identität, und `--allow-client-registration` bringt sie auch nicht zurück: Es registriert nur neue Geräte.

### `The state folder … can be changed by other users`

In einem Log erscheint das als `registration parent must be owned and not writable by other users`. Der Ordner des Miners gehört einem anderen Benutzer (zum Beispiel, nachdem der Miner einmal mit `sudo` ausgeführt wurde) oder kann von anderen Benutzern geändert werden, daher weigert er sich, seine Identität dort zu speichern. Gib ihn deinem Benutzer zurück, mach ihn privat und starte erneut:

```bash
sudo chown -R "$USER" ~/.urnetwork
chmod 700 ~/.urnetwork
```

Unter Windows führe den `icacls`-Befehl aus, den die Meldung ausgibt.

### Das Log sagt immer wieder `refused`

Der Miner ist gestartet, aber der Betreiber nimmt seine Verbindung nicht an, und er versucht es alle paar Sekunden erneut. Die Statusseite meldet trotzdem `"status":"ok"`, weil der Prozess selbst in Ordnung ist.

- Stelle sicher, dass der Computer eine normale Internetverbindung für zu Hause oder für Server hat, ohne VPN oder Proxy vor dem Miner.
- Prüfe, dass du dich bei dem Betreiber angemeldet hast, den der Miner verwendet (`provider network`).
- Bleibt das Problem bestehen, frag deinen Betreiber oder [auf unserem Discord](https://discord.gg/urnetwork), mit den Zeilen rund um `refused`.

### Der Miner stoppt, wenn ich mich abmelde

Unter Linux stoppen die Dienste deines Benutzers beim Abmelden, sofern Lingering nicht eingeschaltet ist. Der Installer und `provider service install` versuchen, es einzuschalten; haben sie eine Lingering-Warnung ausgegeben, schalte es einmal mit `sudo loginctl enable-linger "$USER"` ein.

Unter Windows startet der Installer den Miner, wenn du dich anmeldest, und er stoppt, wenn du dich abmeldest. Das ist eine bekannte Einschränkung: Bleib angemeldet (ein gesperrter Bildschirm ist in Ordnung).

### `operator <domain> is awaiting auth`

Mit `--all-operators` hat dieser Betreiber noch keine Anmeldung. Führe `provider auth --operator=<domain>` aus oder starte mit `--auto-register --hotkey_seed_file=<path>`. Der Miner prüft alle fünf Minuten erneut. Siehe [Für jeden gelisteten Betreiber minen](/docs/miner/advanced#mine-every-listed-operator).

## Der Extender

`provider status` hat eine Zeile Extender und `provider doctor` eine Zeile Inbound 443. Im Log sagt `reason` im `extender`-Eintrag, was nicht stimmt, und `guidance`, wie man es behebt. Der Miner mint weiter, während sein Extender aus ist. Siehe [Einen Extender betreiben](/docs/miner/extender).

### Der Extender kann TCP-Port 443 nicht binden

Der Miner konnte nicht auf TCP-Port 443 lauschen, daher ist sein Extender aus. Er versucht es alle 3 Minuten erneut.

- `tcp_443_permission_denied`: Unter Linux darf ein Miner, der als dein Benutzer läuft, nicht auf Ports unter 1024 lauschen. Installiere ihn als Systemdienst, der das darf: mit dem Installer `curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system`; mit `provider service` `sudo "$(command -v provider)" service install --system --as="$USER"`. Siehe [Den Miner auf Port 443 lauschen lassen](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).
- `tcp_443_in_use`: Ein anderes Programm hält den Port, etwa ein Webserver oder ein anderer Miner-Prozess auf demselben Computer. Nur ein Programm pro Computer kann ihn haben; der Miner übernimmt ihn innerhalb von 3 Minuten, nachdem er frei geworden ist.
- `tcp_443_bind_failed`: Es ist aus einem anderen Grund fehlgeschlagen. Lies die Log-Zeilen darum herum.

### Der Extender ist auf TCP 443 nicht erreichbar

`unreachable_on_tcp_443`: Der Miner lauscht auf Port 443, aber der Test des Betreibers konnte ihn aus dem Internet nicht erreichen, daher wird der Extender nicht gelistet. Eine Firewall, eine Cloud-Sicherheitsgruppe oder ein Heimrouter hält eingehende Verbindungen draußen, oder der Anschluss liegt hinter Carrier-Grade-NAT. Öffne TCP 443 (und UDP 443 und 4053): siehe [Die Ports öffnen](/docs/miner/extender#open-the-ports).

Der Miner versucht es einmal am Tag erneut. Nachdem du die Ports geöffnet hast, starte ihn neu, um es sofort zu versuchen: `provider service restart` oder mit einem Installer `urnet-tools restart`.

## Bezahlt werden

### `wallet challenge` oder `wallet set` meldet `credential not ready`

Das Gerät ist noch nicht registriert. Führe `provider setup` aus oder starte es einmal mit `provider start` und lass es sich registrieren, und lege dann die Wallet fest. Siehe [Lege deine Auszahlungs-Wallet fest](/docs/miner/rewards#set-your-payout-wallet).

### Eine neue Wallet erscheint nicht sofort

Das ist zu erwarten. Eine Wallet-Einstellung beginnt mit der nächsten Epoche und ändert nie, wohin frühere Belohnungen gehen. Siehe [Wann die Wallet zu verdienen beginnt](/docs/miner/rewards#when-the-wallet-starts-earning).

### Keine Auszahlung für eine Epoche

Um bezahlt zu werden, braucht ein Gerät abgeschlossenen Verkehr, genügend Verifizierungsprüfungen, mindestens eine Bestätigung und eine signierte Wallet für diese Epoche. Ein Gerät in der Spitzenstufe verdient dort statt aus dem Pool. Siehe [Wie Belohnungen gezählt werden](/docs/miner/rewards#how-rewards-are-counted).

### Der Claim-Nachweis ist nicht bereit

Prüfe, ob der Betreiber die Arbeit dieses Geräts für die Epoche veröffentlicht und den Root der Epoche finalisiert hat. Der Claim verwendet die `.provider.jwt` des Geräts; deine Kontoanmeldung (`jwt`) kann sie nicht ersetzen.

### Abweichung bei Nachweis oder Root

Bewahre die Ausgabe auf und vergleiche Bereitstellung, Epoche und Auszahlungsdateien mit deinem Betreiber. Warten oder ein Wechsel der Wallet beheben keine widersprüchlichen Nachweise.

### Beansprucht, aber mein Guthaben hat sich nicht geändert

Suche in der Quittung nach `ClaimPaid` oder `ClaimPaymentDeferred` und prüfe den α-Stake auf deinem Coldkey, nicht das Guthaben des Relayers. Siehe [Das Ergebnis lesen](/docs/miner/rewards#3-read-the-result).

### Die Verbindung brach während eines Claims ab

Prüfe, was mit der gesendeten Transaktion oder mit der Warteschlange des Claim-Daemons passiert ist, bevor du den Relayer-Schlüssel erneut verwendest. Bewahre die Historie der signierten Transaktionen auf.
