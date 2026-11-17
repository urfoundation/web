---
published: 2026-10-21
description: Updates des UR-Miners: Wie Installer und Miner-Dienst ihn automatisch aktualisieren, wie du Updates prüfst, änderst oder abschaltest und bei einer Version bleibst.
---

# Den Miner aktuell halten

Neue Miner-Releases beheben Probleme und halten deinen Miner mit dem Netzwerk kompatibel, daher betreibst du am besten das neueste. Wenn du einen [Installer](/docs/miner/install#the-installers) benutzt hast oder `provider setup` den Hintergrunddienst hast installieren lassen, musst du nichts tun: Der Miner wird automatisch aktualisiert.

## Automatische Updates (Installer)

Jeder Installer schaltet automatische Updates ein, außer unter Linux ohne systemd-Benutzersitzung und unter Windows, wenn du mit `-Tag` eine bestimmte Version installierst. Standardmäßig sucht er etwa alle 6 Stunden auf der [Release-Seite von build](https://github.com/urnetwork/build/releases) nach einem neueren Release. Gibt es eines, lädt er es herunter, prüft es gegen die SHA-256-Prüfsumme, die GitHub dafür auflistet (ein Release ohne sie wird nicht installiert), stellt sicher, dass das neue Programm läuft, und tauscht es ein. Ein Miner, der lief, wird mit der neuen Version neu gestartet; einer, den du gestoppt hast, bleibt gestoppt. Schlägt etwas fehl, läuft die alte Version weiter. Deine Identität in `~/.urnetwork` wird nicht angefasst, und deine Update- und Starteinstellungen bleiben erhalten.

So hält jedes System den Zeitplan ein:

- **Linux:** ein systemd-Timer, alle 6 Stunden plus bis zu einer Stunde zufälliger Verzögerung.
- **macOS:** ein launchd-Agent, der viermal am Tag zu Zeiten prüft, die einmal pro Mac festgelegt werden, und erneut beim Anmelden, sodass ein Mac, der schlief oder aus war, aufholt.
- **Windows:** ein Update-Programm, das beim Anmelden unsichtbar startet, jede Stunde aufwacht und prüft, sobald das Intervall verstrichen ist, sodass Ruhezustand und Neustarts keine Prüfung überspringen.

Ein Update bringt auch `urnet-tools` selbst auf den neuesten Stand. Unter Linux wechselt es nie zu einem älteren Release.

Um zu sehen, welche Version du hast und ob eine neuere erschienen ist, oder um sofort zu aktualisieren:

```bash
urnet-tools version
urnet-tools update
```

### Automatische Updates ändern oder abschalten

Automatische Updates sind standardmäßig eingeschaltet, und wir empfehlen, sie eingeschaltet zu lassen. Um zu sehen, ob sie eingeschaltet sind und wie oft sie prüfen:

```bash
urnet-tools auto-update
```

Um seltener zu prüfen, wähle `6h` (Standard), `daily`, `weekly` oder `monthly`. Das lässt Updates so ein- oder ausgeschaltet, wie sie sind:

```bash
urnet-tools auto-update --interval daily
```

Um sie aus- und wieder einzuschalten:

```bash
urnet-tools auto-update off
urnet-tools auto-update on
```

Bei abgeschalteten automatischen Updates führe ab und zu selbst `urnet-tools update` aus. Deine Wahl bleibt erhalten, wenn du aktualisierst oder den Installer erneut ausführst. Um von Anfang an mit abgeschalteten Updates zu installieren, übergib `--no-auto-update` an den macOS-Installer oder `-NoAutoUpdate` an den Windows-Installer. Unter Linux führe direkt nach der Installation `urnet-tools auto-update off` aus.

### Bei einer Version bleiben

Um ein bestimmtes Release zu installieren, gib sein Tag von der Release-Seite an:

```bash
urnet-tools reinstall -t <version>
```

Schalte dann automatische Updates mit `urnet-tools auto-update off` ab, sonst bringt dich die nächste Prüfung wieder auf das neueste Release.

## Automatische Updates (provider-Dienst)

> **Diese Updates haben seit 2026.10.22 kein Release mehr installiert.** Sobald das erste Release nach dem 11. November 2026 erschienen ist, aktualisiere einmal von Hand, wie es der Hinweis oben auf [So betreibst du einen Miner](/docs/miner) erklärt. Von da an funktionieren sie wie hier beschrieben.

Der [Hintergrunddienst](/docs/miner/run#with-provider-service), den `provider setup` oder `provider service install` einrichtet, hält den Miner ebenfalls aktuell. Er prüft die [Release-Seite von build](https://github.com/urnetwork/build/releases) alle 6 Stunden: unter Linux ab 15 Minuten nach dem Start des Computers, plus bis zu einer Stunde zufälliger Verzögerung; unter macOS ab der Anmeldung; unter Windows ab 15 Minuten nach der Anmeldung, plus bis zu einer Stunde zufälliger Verzögerung. Nach einem Release wartet jeder Miner seinen eigenen zufälligen Anteil von 16 Stunden, sodass jeder Miner es innerhalb eines Tages hat, ohne dass alle gleichzeitig neu starten.

Ein Update prüft den Download gegen die SHA-256-Prüfsumme, die GitHub dafür auflistet (das erkennt einen beschädigten Download), behält das vorherige Programm neben dem neuen und startet den Dienst neu. Kommt die neue Version nicht innerhalb von 10 Minuten wieder hoch (und wieder verbunden, falls sie vorher verbunden war), wird die vorherige wiederhergestellt, und dieses Release wird eine Woche lang übersprungen. Deine Identität in `~/.urnetwork` wird nicht angefasst.

```bash
provider update --check    # is a newer release out?
provider update            # update now
provider update --status   # automatic update settings and the last check
```

Der Ordner des Programms muss für den Benutzer des Dienstes beschreibbar sein; `provider doctor` prüft das. Ein Miner, den ein Installer eingerichtet hat, aktualisiert sich weiterhin über `urnet-tools`, und `provider update` führt das für dich aus.

### Die eigenen Updates des Miners abschalten

Automatische Updates sind standardmäßig eingeschaltet, und wir empfehlen, sie eingeschaltet zu lassen. Um sie aus- und wieder einzuschalten:

```bash
provider update --off
provider update --on
```

Du kannst den Dienst auch mit abgeschalteten Updates installieren: `URNETWORK_AUTO_UPDATE=0 provider service install`. Das betrifft keinen Miner, den ein Installer eingerichtet hat; verwende dort `urnet-tools auto-update off`. Bei abgeschalteten Updates führe ab und zu selbst `provider update` aus.

## Ohne automatische Updates

Ein [Build aus dem Quellcode](/docs/miner/install#build-from-source) aktualisiert sich nie selbst: Baue ihn neu. Ein Miner, den du in einem Terminal betreibst oder unter [einem eigenen Dienst](/docs/miner/run#a-service-of-your-own), wird mit `provider update` aktualisiert; starte ihn danach neu.

Behalte die [Release-Seite](https://github.com/urnetwork/build/releases) im Blick, um neue Versionen zu sehen; GitHub kann dich über jedes Release benachrichtigen. `provider --version` gibt deine Version aus.
