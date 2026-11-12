---
description: Starte das Mining auf UR in wenigen Schritten. Was ein Miner tut, was du brauchst, ein Schnellstart und wo du jeden Teil des Miner-Leitfadens findest.
---

# So betreibst du einen Miner

Ein UR-Miner teilt deine Internetverbindung als Exit für einen Netzbetreiber. Validatoren prüfen, dass er wirklich Verkehr trägt, und Bittensor SN25 (netuid 25) zahlt für diese Arbeit Belohnungen im α-Token des Subnets, der als $UR auftritt.

Diese Seite bringt dich von null zu einem laufenden Miner. Der Rest des Miner-Leitfadens geht tiefer, ein Thema pro Seite:

| Seite | Was sie behandelt |
| --- | --- |
| [Installieren](/docs/miner/install) | Die Installer für Linux, macOS und Windows, ein manueller Download und der Build aus dem Quellcode. |
| [Betreiben und überwachen](/docs/miner/run) | Starten und Stoppen, Betrieb im Hintergrund, Logs und die Statusseite, Backups. |
| [Einen Extender betreiben](/docs/miner/extender) | Die Ports, die du für den Extender des Miners öffnest, Firewalls und Portweiterleitung und wie er unter Linux auf Port 443 lauschen darf. |
| [Updates](/docs/miner/updates) | Wie der Miner aktuell bleibt und wie du das steuerst. |
| [Bezahlt werden](/docs/miner/rewards) | Deine Auszahlungs-Wallet festlegen, wie Belohnungen gezählt werden und wie du sie beanspruchst. |
| [Fehlerbehebung](/docs/miner/troubleshooting) | Die häufigen Fehler und was du jeweils tun kannst. |
| [Fortgeschritten](/docs/miner/advanced) | Für jeden Betreiber minen, mehrere Exits auf einem Host, automatische Claims und die Spitzenstufe für große Flotten. |
| [Referenz](/docs/miner/reference) | Alle alltäglichen Befehle, die Dateien, die der Miner anlegt, Umgebungsvariablen und ein Glossar. |

Für die anderen Rollen siehe [Einen Validator betreiben](/docs/validator) und [Einen Netzbetreiber betreiben](/docs/operator).

## So funktioniert es

```text
your miner (provider)
  │ carries internet traffic for
  ↓
a network operator  ←─  validators
  │ pays its pool       measure it
  ↓ every epoch
your Bittensor coldkey (α, $UR)
```

Die meisten Miner treten dem **Pool** eines Betreibers bei. Du brauchst keine eigene Bittensor-Registrierung: Du meldest dich beim Betreiber an, dein Miner registriert sich selbst als Gerät, und die Belohnungen des Pools werden an die Bittensor-Wallet gezahlt, die du wählst. Große Flotten können stattdessen ihre eigene Miner-UID beanspruchen; siehe [die Spitzenstufe](/docs/miner/advanced#claim-your-own-miner-uid-head-tier).

## Was du brauchst

- **Einen Linux-, macOS- oder Windows-Computer, der online bleibt.** Ein Heim-PC, ein Server oder ein Raspberry Pi 2 oder neuer funktionieren. Unter Windows läuft der Miner, solange du angemeldet bist.
- **Eine stabile öffentliche Internetadresse pro Miner.** Um mehr als einen Exit von einem Host zu betreiben, siehe [Mehrere Exits auf einem Host](/docs/miner/advanced#several-exits-on-one-host).
- **Offene Ports für den Extender.** Der Miner betreibt auch einen Extender, der einen Anteil an jedem Vertrag verdient, den er trägt. Er braucht eingehenden TCP-Port 443; die UDP-Ports 443 und 4053 werden empfohlen, UDP 53 ist optional. Unter Linux braucht er außerdem die Erlaubnis, auf Port 443 zu lauschen. Siehe [Einen Extender betreiben](/docs/miner/extender).
- **Ein Konto bei einem Netzbetreiber.** Der Miner nutzt den Standardbetreiber `bringyour.com`, sofern du nicht [einen anderen wählst](/docs/miner/run#choose-an-operator). Von deinem Konto bekommst du einen **Auth-Code**, um den Miner anzumelden.
- **Eine Bittensor-Wallet-Adresse (Coldkey)** für deine Belohnungen. Das ist eine ss58-Adresse, die mit `5` beginnt. Du kannst auf einem anderen Gerät für sie signieren; ihr Geheimnis muss nie auf dem Miner liegen.

## Schnellstart

Das Miner-Programm heißt `provider`. Installiere es, führe `provider setup` aus und prüfe es mit `provider status`.

### 1. Installieren

Der Installer ist der einfachste Weg. Er legt den Miner in deinem Home-Ordner ab, betreibt ihn im Hintergrund und hält ihn automatisch aktuell.

Unter **Linux**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

Unter **macOS**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

Unter **Windows**, in PowerShell (nicht als Administrator):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Öffne dann ein neues Terminal. Der Installer fragt nach einem Auth-Code aus deinem Betreiberkonto (beim Standardbetreiber aus deinem URnetwork-Konto auf [ur.io](https://ur.io)), registriert dieses Gerät und beginnt mit dem Mining.

Der Installer nennt den Befehl `urnetwork`, nicht `provider`. Wenn du ihn benutzt hast, tippe `urnetwork` überall, wo dieser Leitfaden `provider` sagt, auch in Befehlen, die der Miner zum Kopieren ausgibt.

Um ohne Installer zu installieren, siehe [Manueller Download](/docs/miner/install#manual-download).

### 2. Setup ausführen

```bash
provider setup
```

Es führt dich durch vier Schritte, und du kannst es jederzeit abbrechen und erneut ausführen; die erledigten Schritte bleiben erhalten:

1. **Anmelden.** Füge einen Auth-Code aus deinem Betreiberkonto ein. Die Eingabeaufforderung blendet aus, was du einfügst.
2. **Dieses Gerät registrieren.** Ein neues Gerät bekommt seine eigene Miner-Identität, gespeichert in `~/.urnetwork`.
3. **Auszahlungsadresse.** Die Adresse deines Bittensor-Coldkeys. Setup gibt eine kurze Nachricht aus; signiere sie in deiner Wallet-App (Polkadot.js, Talisman oder btcli) und füge die Signatur ein. Du kannst Enter drücken, um das zu überspringen und [sie später festzulegen](/docs/miner/rewards#set-your-payout-wallet).
4. **Am Laufen halten.** Startet den Miner jetzt im Hintergrund und erneut nach jedem Neustart (unter Windows bei jeder Anmeldung) und hält ihn aktuell.

Wenn du einen Installer benutzt hast, hat er dich bereits angemeldet, dieses Gerät registriert und betreibt den Miner im Hintergrund. Führe `urnetwork setup --no-service` aus, um deine Auszahlungsadresse hinzuzufügen; `--no-service` verhindert, dass Setup neben dem Miner des Installers einen zweiten Hintergrund-Miner hinzufügt.

### 3. Den Zustand prüfen

```bash
provider status
```

Eine Minute nach dem Start des Miners sollten die Zeilen Miner, Signed in, Device und Connected jeweils ein ✓ haben. Der Befehl endet mit 0, wenn alles in Ordnung ist, mit 3, wenn das Gerät eingerichtet werden muss, und mit 4, wenn der Miner nicht läuft oder nicht verbunden ist, sodass auch Skripte ihn prüfen können (`provider status --json` gibt die Details aus).

Wenn etwas nicht stimmt, gibt `status` den nächsten auszuführenden Befehl aus. `provider doctor` sucht nach der Ursache: den Zustandsordner, DNS, die Verbindung, einen Proxy, der TLS inspiziert, und die Uhr. Logs sowie Stoppen und Starten findest du unter [Betreiben und überwachen](/docs/miner/run).

### 4. Deinen Miner sichern

Kopiere den Ordner `~/.urnetwork` an einen privaten Ort. Er enthält die Identität dieses Geräts und deine signierte Wallet-Historie. Wenn du ihn verlierst, lässt sich das Gerät nicht wiederherstellen, auch wenn du dich weiterhin bei deinem Konto anmelden kannst. Siehe [Deinen Miner sichern](/docs/miner/run#back-up-your-miner).

Das war's. Belohnungen werden pro Settlement-Epoche gezählt, im Mainnet etwa eine Woche, und nach dem Ende der Epoche beansprucht: siehe [Bezahlt werden](/docs/miner/rewards). Wenn etwas nicht funktioniert hat, siehe [Fehlerbehebung](/docs/miner/troubleshooting).

### Schritt für Schritt statt Setup

`provider setup` führt diese Befehle für dich aus. Um es von Hand zu erledigen:

```bash
provider login                    # paste the auth code when asked
provider start                    # the first start asks before registering this device
provider wallet challenge '<your coldkey ss58 address>'
provider service install          # in a second terminal, after Ctrl-C in the first
```

`provider wallet challenge` gibt eine zu signierende Nachricht aus; führe dann den `provider wallet set`-Befehl aus, den er ausgibt, mit deiner Signatur. [Bezahlt werden](/docs/miner/rewards#set-your-payout-wallet) erklärt das. `login`, `start` und `network` sind dieselben Befehle wie `auth`, `provide` und `choose_network`.

## Woher dieser Leitfaden stammt

Dieser Leitfaden folgt der aktuellen [`sn/miner`-Implementierung](https://github.com/urfoundation/sn/tree/main/miner) und ihrem [`cli/miner`-Einstiegspunkt](https://github.com/urfoundation/sn/tree/main/cli/miner). Viele Teile davon werden in Gesprächen [auf unserem Discord](https://discord.gg/urnetwork) verfeinert, wo du auch um Hilfe bitten kannst.
