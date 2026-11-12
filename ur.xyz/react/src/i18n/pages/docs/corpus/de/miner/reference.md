---
published: 2026-10-21
description: Referenz zum UR-Miner. Die Befehle und Optionen von provider, die urnet-tools-Befehle der Installer, die Dateien des Miners, Umgebungsvariablen und ein Glossar.
---

# Miner-Referenz

Eine Kurzreferenz für den Befehl `provider`. `provider --help` gibt einen kurzen Überblick aus, `provider <command> --help` erklärt einen Befehl, und `provider help all` gibt jeden Befehl und jede Option aus. Wenn du einen Installer benutzt hast, heißt der Befehl `urnetwork`.

## Alltägliche Befehle

Namen in Klammern sind andere Namen für denselben Befehl.

| Befehl | Was er tut |
| --- | --- |
| `provider setup` | Richtet dieses Gerät Schritt für Schritt ein: Anmeldung, Registrierung, Auszahlungsadresse, Hintergrunddienst. Kann gefahrlos erneut ausgeführt werden. `--no-service` überspringt den Dienst, und `--yes --auth-code-file=<path>` führt es ohne Rückfragen aus (und überspringt die Auszahlungsadresse). |
| `provider status` | Ist er eingerichtet, läuft er und ist er verbunden? Exit-Code 0, wenn alles in Ordnung ist, 3, wenn er eingerichtet werden muss, 4, wenn er nicht läuft oder nicht verbunden ist. `--json` für Skripte. |
| `provider doctor` | Warum er sich nicht anmelden oder verbinden kann: Zustandsordner, DNS, Verbindung, TLS, Uhr, Updates. |
| `provider login` (`auth`) | Mit einem Auth-Code anmelden, eingegeben in einer verdeckten Eingabeaufforderung. `provider login <auth_code>` nimmt den Code direkt, hinterlässt ihn aber in deiner Shell-Historie. `--user_auth='you@example.com'` meldet sich mit der E-Mail-Adresse deines Kontos an und fragt nach dem Passwort. |
| `provider start` (`provide`) | In diesem Terminal mit dem Mining beginnen. Der erste Start auf einem neuen Gerät fragt nach, bevor er es registriert; `--allow-client-registration` registriert ohne Nachfrage. `provide` gibt das vollständige Log statt der Live-Ansicht aus. |
| `provider service install` | Den Miner im Hintergrund betreiben, mit automatischen Updates: bei jedem Booten unter Linux, bei der Anmeldung unter macOS und Windows. Außerdem `start`, `stop`, `restart`, `status`, `logs --follow` und `uninstall`. |
| `provider update` | Auf das neueste Release aktualisieren. `--check` schaut nur nach, `--status` zeigt die Einstellungen für automatische Updates. Siehe [Updates](/docs/miner/updates). |
| `provider --version` | Die Version ausgeben. |
| `provider auth-provide` | Anmelden und starten in einem Befehl. |
| `provider wallet challenge '<coldkey_ss58>'` | Die Erklärung ausgeben, die du für deine Auszahlungs-Wallet signierst. |
| `provider wallet set '<coldkey_ss58>' …` | Deine Auszahlungs-Wallet mit einer Signatur oder einer Seed-Datei festlegen. Siehe [Bezahlt werden](/docs/miner/rewards#set-your-payout-wallet). |
| `provider claim --epoch=<epoch> --rpc=<url>` | Einen Claim auf eine Pool-Belohnung prüfen; füge `--key_file` hinzu, um ihn einzureichen. Siehe [Deine Belohnungen beanspruchen](/docs/miner/rewards#claim-your-rewards). |
| `provider network` (`choose_network`) | Den aktiven Betreiber anzeigen. `provider network use <api_url> <connect_url>` wählt einen anderen, `provider network reset` kehrt zum Standard zurück. |
| `provider operators` | Die Betreiber der veröffentlichten Betreiberliste und deinen Anmeldestatus bei jedem auflisten. |
| `provider proxy add …` | SOCKS5-Exits hinzufügen. Siehe [Mehrere Exits auf einem Host](/docs/miner/advanced#several-exits-on-one-host). |

Die Befehle für jeden Betreiber, Hotkey-Wallets, die Claim-Daemons und Flotten der Spitzenstufe stehen auf der Seite [Fortgeschritten](/docs/miner/advanced).

## Häufige Optionen

| Option | Verwendet mit | Was sie tut |
| --- | --- | --- |
| `--allow-client-registration` | `start`, `provide` | Erlaubt, ein neues Gerät zu registrieren. Ersetzt nie eine Identität, die der Miner schon hat. |
| `--port=<port>` | `start`, `provide` | Die [Statusseite](/docs/miner/run#the-status-page) auf diesem Port ausliefern. `0`, der Standard, schaltet sie aus. |
| `--max-memory=<mem>` | `start`, `provide`, `login` | Weiches Speicherziel in Bytes oder mit `b`, `kib`, `mib` oder `gib`. |
| `-v`, `-vv` | den meisten | Mehr Details im Log. (Bei `urnet-tools` unter Linux und macOS bedeutet `-v` `version`; unter Windows tippe `urnet-tools version`.) |
| `-f` | `login`, `proxy` | Eine bestehende Anmeldung oder einen Proxy ohne Nachfrage ersetzen. |
| `--api_url=<url>` | den meisten | Diese API-URL des Betreibers für einen Befehl verwenden. |
| `--connect_url=<url>` | `start`, `provide` | Diese Connect-URL des Betreibers für einen Lauf verwenden. |
| `--provider-jwt=<path>` | `wallet`, `claim` | Wählen, welche Geräte-Zugangsdaten verwendet werden, für zusätzliche Exits oder andere Betreiber. |
| `--wallet=<coldkey_ss58>` | `start`, `provide` | Beim Start auch die Auszahlungs-Wallet festlegen, wie `wallet set`. Ein Fehler wird protokolliert und stoppt das Mining nicht. |

## Befehle der Installer

Die Installer für Linux, macOS und Windows teilen sich einen Befehl, `urnet-tools`:

| Befehl | Was er tut |
| --- | --- |
| `urnet-tools status` | Zusammenfassung auf einem Bildschirm: läuft oder nicht, Version, angemeldet, automatische Updates. |
| `urnet-tools start`, `stop`, `restart` | Den Miner im Hintergrund starten, stoppen oder neu starten. |
| `urnet-tools logs` | Der Ausgabe des Miners folgen. Ctrl-C zum Beenden. |
| `urnet-tools version` | Die installierte Version anzeigen und die neueste, falls sie neuer ist. |
| `urnet-tools update` | Jetzt aktualisieren, falls es ein neueres Release gibt. Unter Linux wechselt es nie zu einem älteren. |
| `urnet-tools auto-update` | Anzeigen, ob automatische Updates eingeschaltet sind. Füge `on` oder `off` hinzu, um das zu ändern, und `--interval 6h`, `daily`, `weekly` oder `monthly`, um die Häufigkeit zu ändern. |
| `urnet-tools auto-start on`, `off` | Ob der Miner nach einem Neustart von selbst startet (unter macOS und Windows bei der Anmeldung). |
| `urnet-tools reinstall -t <version>` | Ein bestimmtes Release installieren. |
| `urnet-tools uninstall` | Den Miner und seine Hintergrundjobs entfernen. Behält `~/.urnetwork`. Füge `--remove-identity` hinzu, um es ebenfalls zu löschen, nachdem du `delete` eingetippt hast. |

Optionen werden als `--interval weekly` oder `--interval=weekly` angegeben. Unter Windows funktionieren auch die PowerShell-Schreibweisen (`-Interval`, `-RemoveIdentity`), und wenn PowerShell meldet, dass das Ausführen von Skripten deaktiviert ist, tippe stattdessen `urnet-tools.cmd`. Siehe [Updates](/docs/miner/updates) und [Im Hintergrund laufen lassen](/docs/miner/run#with-an-installer).

Wo jeder Installer den Miner ablegt:

| System | Ordner | Log |
| --- | --- | --- |
| Linux | `~/.local/share/urnetwork-provider` | `urnet-tools logs` (das systemd-Journal) |
| macOS | `~/.local/share/urnetwork-provider` | `~/Library/Logs/urnetwork/` |
| Windows | `%LOCALAPPDATA%\urnetwork\provider` | `provider.log` in diesem Ordner |

## Dateien, die der Miner anlegt

Der Miner bewahrt seinen Zustand in `~/.urnetwork` auf. Sichere den ganzen Ordner, nachdem du den Miner gestoppt hast, halte ihn privat und stelle ihn als Ganzes wieder her. Betreibe nie zwei Kopien desselben Ordners gleichzeitig. Gehen die Identitätsdateien verloren oder werden sie bearbeitet, lässt sich das Gerät womöglich nicht mehr wiederherstellen, auch wenn deine Kontoanmeldung noch funktioniert.

| Datei oder Ordner | Was sie enthält |
| --- | --- |
| `jwt` | Deine Kontoanmeldung, geschrieben von `provider login` (`auth`). |
| `.provider.key` und `.provider.key.identity` | Der ursprüngliche Ed25519-Schlüssel des Geräts und seine Identitätsmarkierung. |
| `.provider.key.registration.lock` | Eine lokale Sperre für die Registrierung des Geräts. |
| `.provider.jwt` | Die eigenen, erneuerbaren Zugangsdaten des Geräts, verwendet für Wallets und Claims. |
| `.provider.jwt.registration*` | Die aufbewahrte Registrierungsanfrage und der Wiederherstellungszustand. Behalte jede dieser Dateien. |
| `.provider.jwt.wallet-consent/` | Deine signierte Wallet-Historie, einschließlich noch nicht gesendeter Erklärungen. |
| `.provider.cert`, `.provider.extender.key` | Das Zertifikat des Geräts und die Identität des Extenders, falls vorhanden. |
| `network.json` | Der mit `provider network use` (`choose_network`) gewählte Betreiber. |
| `proxy` | Optionale SOCKS5-Exits. |
| `operators.yml` | Die letzte gültige Kopie der Betreiberliste, mit `--all-operators`. |
| `operators/<domain>/` | Der eigene Zustand eines gelisteten Betreibers, mit den Dateien oben. |
| `hotkey-wallet/` | Die signierte Hotkey-Auszahlungskette (`originals.json`) und eine eventuell ausstehende Erklärung (`pending.json`). |
| `miner.log` | Das Log von `provider start` in einem Terminal. |
| `miner-status.json`, `miner-update.json` | Was `provider status` liest, sowie die Einstellungen für automatische Updates und die letzte Prüfung. |

Die Installer legen das Miner-Programm und `urnet-tools` in ihrem eigenen Ordner ab (siehe [Befehle der Installer](#installer-commands)), getrennt von diesem Ordner.

## Umgebungsvariablen

Für eine normale Einrichtung wird keine davon gebraucht.

| Variable | Was sie tut |
| --- | --- |
| `URNETWORK_STATE_DIR` | Diesen Ordner statt `~/.urnetwork` verwenden. Praktisch, um ein Testgerät auszuprobieren, ohne dein echtes anzufassen. |
| `URNETWORK_AUTO_UPDATE` | Setze sie auf `0`, wenn du `provider service install` ausführst, um den Dienst mit abgeschalteten automatischen Updates zu installieren. Sie betrifft nicht die Updates eines Installers. |
| `URNETWORK_AUTH_CODE` | Die Installer melden sich mit diesem Auth-Code an, statt nach einem zu fragen. |
| `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` | Eine PEM-Datei mit zusätzlichen CA-Zertifikaten, denen vertraut werden soll, für ein Netz, das verschlüsselten Verkehr inspiziert. Sie darf nur CA-Zertifikate enthalten. |

## Glossar

| Begriff | Bedeutung |
| --- | --- |
| Auth-Code | Ein einmaliger Code aus deinem Betreiberkonto, mit dem sich ein Computer dort anmeldet. |
| Betreiber | Das Netzwerk, für das dein Miner Internet-Exits bereitstellt. Der Standard ist `bringyour.com`. |
| Gerät (Provider-Identität) | Dieser Computer als Miner: die Identität in `~/.urnetwork`, die über Neustarts und Updates hinweg gleich bleibt. |
| Coldkey | Deine Bittensor-Wallet, als ss58-Adresse, die mit `5` beginnt. An sie werden Belohnungen gezahlt. |
| Hotkey | Ein zweiter Bittensor-Schlüssel. Miner verwenden einen, um sich bei jedem Betreiber auf einmal anzumelden, und Flotten, um sich in der Spitzenstufe zu registrieren. |
| Epoche | Der Zeitraum, in dem Belohnungen gezählt werden. Eine Settlement-Epoche dauert im Mainnet etwa sieben Tage. |
| Pool | Die gemeinsame Auszahlung eines Betreibers. Die meisten Miner verdienen aus einem Pool. |
| Spitzenstufe | Große Flotten, die ihren eigenen Hotkey registrieren und Miner-Emission direkt verdienen. |
| Relayer | Ein EVM-Schlüssel, der das Gas zum Einreichen eines Claims bezahlt. Er erhält nie die Belohnung. |
| α ($UR) | Der Token des Subnets, in dem Belohnungen gezahlt werden. |
| Momentum | Der Anteil der Miner-Emission, der jetzt ausgezahlt wird; der Rest geht an die [Network Capacity Reserve](/reserve). |
