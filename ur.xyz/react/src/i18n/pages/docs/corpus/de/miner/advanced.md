---
published: 2026-10-21
description: Fortgeschrittenes Mining auf UR: alle gelisteten Betreiber mit einem Hotkey, mehrere Exits pro Host, Claims automatisieren oder auslagern, eigene Miner-UID für große Flotten.
---

# Fortgeschrittenes Mining

Die meisten Miner brauchen diese Seite nicht: Der [Schnellstart](/docs/miner#quick-start) deckt ein Gerät ab, das einen Betreiber bedient. Lies weiter, wenn du jeden Betreiber bedienen, mehrere Exits von einem Host betreiben, Claims automatisieren oder eine große Flotte betreiben willst. Wenn du einen Installer benutzt hast, tippe `urnetwork` überall, wo diese Seite `provider` sagt.

## Für jeden gelisteten Betreiber minen

`provider provide --all-operators` mint für jeden Betreiber in der Liste, die unter [ur.xyz/operators.yml](/operators.yml) veröffentlicht ist, mit einem Miner-Prozess pro Betreiber. Am einfachsten meldest du dich bei jedem Betreiber mit einem Bittensor-**Hotkey** an, als TAO-Wallet:

```bash
provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed
```

Dabei ist keine Chain-Transaktion beteiligt. Die erste Anmeldung legt das Netzwerk des Hotkeys bei diesem Betreiber an, und jeder neue Betreiber registriert sein erstes Gerät: `--auto-register` schließt `--allow-client-registration` ein, das nie eine Identität ersetzt, die der Miner schon hat. Die Seed-Datei enthält den 32-Byte-sr25519-Seed des Hotkeys, roh oder als 64 Hexadezimalzeichen, in einer privaten Datei, die der Miner nie selbst anlegt.

Um dich stattdessen selbst bei den Betreibern anzumelden, liste sie auf und melde dich dann bei jedem mit einem Auth-Code, deinem Konto-Login oder dem Hotkey an:

```bash
provider operators
provider auth --operator='<domain>'
provider auth --operator='<domain>' --user_auth='you@example.com'
provider auth --operator='<domain>' --hotkey_seed_file=/absolute/private/hotkey.seed
```

`provider operators` gibt aus, woher die Liste stammt und ihren Digest, dann für jeden Betreiber Domain, Anmeldestatus (`jwt present` oder `awaiting auth`), API-URL und Connect-URL. `provider auth --operator` fragt nach dem Code oder Passwort, das du nicht übergibst, und speichert die Anmeldung dieses Betreibers in `~/.urnetwork/operators/<domain>/jwt`. Ein so angemeldeter Betreiber hat noch kein Gerät, daher braucht der erste Start das Registrierungs-Flag; spätere Starts nicht:

```bash
provider provide --all-operators --allow-client-registration
```

Ein Betreiber ohne Anmeldung bekommt keinen Miner. Das Log zeigt `operator <domain> is awaiting auth: provider auth --operator=<domain>`, und der Miner prüft alle fünf Minuten erneut.

### Wie es läuft

Mit `--all-operators` betreut ein Prozess für jeden gelisteten Betreiber einen Miner:

- Jeder Betreiber hat seinen eigenen Ordner, `~/.urnetwork/operators/<domain>/`, mit eigener Anmeldung, eigenem Identitätsschlüssel und eigenen Geräte-Zugangsdaten. Das sind neue Geräteidentitäten: Die Einzelbetreiber-Identität in `~/.urnetwork` wird nicht verwendet, und ein mit `provider network use` gewählter Betreiber gilt nicht.
- Die Liste wird jede Stunde neu abgerufen. `--operators-refresh=<duration>` ändert das, als Go-Dauer von mindestens `1m` wie `30m`, und `--operators-url=<url>` folgt einer anderen Liste. Die letzte gültige Kopie bleibt als `~/.urnetwork/operators.yml` erhalten, sodass das Mining weiterläuft, während ur.xyz nicht erreichbar ist.
- Ein neu gelisteter Betreiber bekommt einen Miner, sobald er eine Anmeldung hat, und der Miner eines Betreibers, dessen URLs sich ändern, wird neu gestartet. Der Miner eines aus der Liste entfernten Betreibers bekommt SIGTERM, dann nach 60 Sekunden SIGKILL; sein Ordner bleibt erhalten.
- Ein Miner, der sich beendet, startet nach 30 Sekunden neu, mit Verdopplung bis zu 10 Minuten. Ctrl-C oder ein Beendigungssignal stoppt jeden Miner.
- `--max-memory` wird gleichmäßig auf die Miner aufgeteilt, und ein Miner startet neu, wenn sich sein Anteil ändert. `--port` liefert den Status jedes Betreibers; die Miner selbst laufen ohne Status-Port.
- Der erste Miner-Prozess, der TCP-Port 443 belegt, bedient den Extender für den Host.
- `--all-operators` lehnt `--api_url`, `--connect_url`, `--provider-jwt`, `--wallet` und seine Signatur-Flags, `--test-egress-source-ip` sowie die Capture- und Close-Report-Flags ab, die auf einen Betreiber beschränkt bleiben.

Um es als [eigenen Dienst](/docs/miner/run#a-service-of-your-own) zu betreiben, verwende `ExecStart=%h/.local/bin/provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed`. Im Automatikmodus behält der Dienst `--auto-register`, sodass jeder neu gelistete Betreiber sein erstes Gerät registriert; das ersetzt nie eine Identität, die der Miner schon hat. Wenn du dich selbst bei Betreibern anmeldest, lass `--auto-register` weg, behalte `--hotkey_seed_file`, wenn du die Hotkey-Auszahlung unten verwendest, und füge `--allow-client-registration` nur für den ersten Start nach der Anmeldung bei einem neuen Betreiber hinzu.

### Einmal für jeden gelisteten Betreiber signieren

Mit `--all-operators` legt eine einzige Coldkey-Signatur die Auszahlungs-Wallet bei jedem Betreiber fest. Coldkey und Hotkey signieren beide eine globale Erklärung, die den Hotkey dem Coldkey zuordnet, aufbewahrt als Kette in `~/.urnetwork/hotkey-wallet/`. Jeder angemeldete Betreiber speichert dann die Kette, und der Hotkey allein signiert dort eine Delegation deines Netzwerks an den neuesten Eintrag der Kette. Der Coldkey signiert nie pro Betreiber.

Fordere die Erklärung an:

```bash
provider wallet hotkey challenge '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

Signiere die ausgegebene Erklärung exakt so, wie sie ist, mit dem Coldkey, im selben sr25519-Kontext `substrate` wie bei einer [normalen Wallet](/docs/miner/rewards#set-your-payout-wallet), und führe dann den `wallet hotkey set`-Befehl aus, den die Challenge ausgibt. Er sieht so aus:

```bash
provider wallet hotkey set '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

Die Erklärung wartet in `hotkey-wallet/pending.json`, bis sie festgelegt oder ersetzt wird. Wenn du den Coldkey-Seed bewusst auf diesem Computer aufbewahrst, übergib `--coldkey_seed_file=/absolute/private/coldkey.seed` an `set` statt `--message` und `--signature`.

`set` fügt die Signatur des Hotkeys hinzu, hängt den neuen Eintrag an die Kette an, speichert dann die Kette und die Delegation bei jedem angemeldeten Betreiber und meldet jeden einzeln; schlägt ein Betreiber fehl, hält das die anderen nie auf. `provider provide --all-operators` mit `--hotkey_seed_file` hält jeden angemeldeten Betreiber delegiert, beim Start und jede Stunde, auch später gelistete Betreiber, sodass der Coldkey nur einmal signiert. `provider wallet hotkey status` zeigt die Kette, eine eventuell ausstehende Erklärung und die Delegation bei jedem Betreiber.

Sofern `--wallet-from-epoch` und `--wallet-through-epoch` sie nicht festlegen, verdient der erste Eintrag ab Epoche 0 und ein späterer ab der aktuellen Epoche der Betreiber plus 1. Jede Delegation beginnt mit der aktuellen Epoche des Betreibers plus 2, und jeder Bereich umfasst 65.536 Epochen. Ein späterer Eintrag ändert den Coldkey oder die Epochen.

Ein Betreiber zahlt an ein Gerät in dieser Rangfolge: die eigene Wallet des Geräts (`provider wallet set`), dann eine netzwerkweite Wallet, dann die Hotkey-Delegation.

### Claims bei jedem Betreiber

Jeder Betreiber rechnet seinen eigenen Pool ab, also beanspruche bei jedem Betreiber getrennt. Wähle die Geräte-Zugangsdaten dieses Betreibers und seine API-URL, wie `provider operators` sie ausgibt:

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>' \
  --provider-jwt="$HOME/.urnetwork/operators/<domain>/.provider.jwt" \
  --api_url='<operator api_url>'
```

## Mehrere Exits auf einem Host

Der Miner unterstützt SOCKS5-Exits, mit einem eigenen Gerät für jede Proxy-Adresse:

```bash
provider proxy add '<host>:<port>:<user>:<pass>'
provider proxy add --proxy_file=/absolute/private/proxies.txt
provider provide --allow-client-registration
```

Verwende das Registrierungs-Flag nur, wenn du wirklich neue Exits hinzufügst; normale Neustarts sind `provider provide`. Jeder Exit behält eine `.provider-<hash>.jwt` und seine Registrierungs-Nebendateien. Wähle diese Datei mit `--provider-jwt`, wenn du seine Wallet festlegst und für ihn beanspruchst. Der gemeinsame `.provider.key` und die Dateien jedes Exits gehören in dasselbe Backup. Was zählt, sind verschiedene, routbare Exits: Weitere Konten hinter demselben Exit erhöhen die Abdeckung nicht.

`provider proxy remove` entfernt Exits, und `provider proxy auth add` und `provider proxy auth remove` verwalten Proxy-Zugangsdaten; siehe `provider proxy --help`. Mit `--all-operators` wird die Datei `proxy` aus `~/.urnetwork` in den Ordner jedes Betreibers kopiert, wenn sein Miner startet.

## Automatisch beanspruchen

### Claims von einem anderen Computer einreichen

Um den Relayer-Schlüssel vom Miner fernzuhalten, prüfe den Claim auf dem Miner mit `provider claim` und reiche dann seine exakten Claim-Daten und die Tresoradresse von einem anderen Computer mit `snclaim` ein. Baue es aus demselben Quellcode:

```bash
# From sn/:
go build -o "$HOME/.local/bin/snclaim" ./cli/snclaim
```

Oder lade es aus demselben Release herunter: Die [Release-Seite](https://github.com/urnetwork/build/releases) hat auch `urnetwork-snclaim-<version>.tar.gz`, mit `<os>/<arch>/snclaim` für Linux und macOS. Installiere es so, wie [Manueller Download](/docs/miner/install#manual-download) den Miner installiert. Dann:

```bash
snclaim submit --calldata='0x<verified claim calldata>' \
  --contract='0x<settlement vault>' --rpc='https://<evm-json-rpc>' \
  --chain_id=964 --key_file=/absolute/private/relayer.key --dry-run
```

Verwende die tatsächliche Chain-ID deiner Bereitstellung und entferne `--dry-run`, um zu senden. Der einreichende Computer braucht trotzdem eine RPC-Verbindung. Um zu sehen, ob ein Claim schon angenommen wurde:

```bash
snclaim status --epoch='<settlement_epoch>' --no_id='<operator id>' \
  --coldkey='<coldkey_ss58>' --contract='0x<settlement vault>' \
  --rpc='https://<evm-json-rpc>'
```

### Der Claim-Daemon

Die Claim-Daemons laufen nur unter Linux und macOS. Der Claim-Daemon hält ausstehende und signierte Claims in einer dauerhaften Warteschlange und verfolgt ihre Ergebnisse auf der EVM-Chain über Neustarts hinweg. Seine Konfiguration ist striktes YAML:

```yaml
schema_version: 1
release: "1.0"
api_url: https://api.example.net
rpc:
  - https://evm-rpc.example.net
key_file: /home/miner/.urnetwork/private/relayer.key
jwt_file: /home/miner/.urnetwork/.provider.jwt
state_dir: /var/lib/urnetwork/claims/provider-1
poll_seconds: 30
lookback_epochs: 2
```

Ersetze diese Pfade und Endpunkte. Relative Dateipfade werden relativ zur Konfigurationsdatei aufgelöst. `jwt_file` wählt die Geräte-Zugangsdaten und muss eine private reguläre Datei sein; lässt du es weg, wird die Standard-`.provider.jwt` gewählt. `poll_seconds` akzeptiert 5 bis 3.600; der Standard-Rückblick sind zwei Epochen, bis zu 256.

Bereite vor dem Start den Speicher der Claim-Warteschlange vor und besorge die exakte Deklaration des dauerhaften Volumes und ihren geprüften Digest für den Host. Die aktuelle Speicherzulassung verlangt sie; ein leerer Ordner oder fehlende Flags reichen nicht. Die Deklaration verwendet das Daemon-Volume-Schema und deckt das tatsächliche `state_dir` und die Warteschlange ab. Siehe die Anleitungen zur [Zuständigkeit für die Claim-Warteschlange](https://github.com/urfoundation/sn/blob/main/miner/CLAIM-QUEUE-OWNERSHIP.md) und zur [Offline-Vorbereitung des Speichers](https://github.com/urfoundation/sn/blob/main/mainnet/OWNER-CUSTODY-PREPARATION.md).

```bash
provider claim-daemon --config=/absolute/path/claim.yml \
  --durable-volumes=/absolute/path/reviewed-daemon-volumes.json \
  --durable-volumes-sha256='sha256:<reviewed digest>'
```

Betreibe einen Daemon pro Warteschlange und Relayer-Schlüssel, und reiche gleichzeitig keine einzelnen Claims ein und betreibe keinen weiteren Daemon mit diesem Schlüssel. Behalte nach einer unterbrochenen Einreichung den ganzen Warteschlangenordner, einschließlich seiner Nebendateien. Ein Warteschlangeneintrag mit der Markierung `uncertain` muss mit seiner ursprünglichen signierten Transaktion abgeglichen werden. Ein finalisierter Claim-Eintrag zeigt, dass der Claim angenommen wurde; die Zahlungsereignisse unterscheiden ausgezahlte Belohnungen von zurückgestellten Gutschriften.

Für Konten unter Settlement v2 beansprucht `provider claim-daemon-v2` ein Konto, sobald sein beanspruchbares Guthaben `--threshold-rao` erreicht (Standard 1,9 α), und `--claim-now` beansprucht beim Start einmal alles Beanspruchbare. `--v1-config` betreibt den v1-Daemon von oben im selben Prozess, mit einem gemeinsamen Relayer-Schlüssel. Seine Optionen siehe `provider claim-daemon-v2 --help`.

## Eine eigene Miner-UID beanspruchen (Spitzenstufe)

Standardmäßig verdient jeder Miner im **Pool** seines Betreibers: Die Pool-UID des Betreibers wird bezahlt, und der Pool wird auf seine Geräte aufgeteilt. Eine große Flotte kann stattdessen **ihre eigene Miner-UID** im Subnet beanspruchen. Validatoren gewichten diese UID dann direkt, und die Chain bezahlt sie nativ, als α, das auf dem eigenen Hotkey der Flotte unter ihrem eigenen Coldkey gestakt wird, in jedem Tempo. Es gibt keinen Pool, keinen Betreiber und keinen Claim im Auszahlungsweg.

### Wer eine bekommen kann

Validatoren geben nur den **Top-200-Flotten** Gewicht; die UID jeder anderen Flotte bekommt nichts. Flotten werden nach **routbarer Exit-Breite** eingestuft, nicht nach Verkehr:

- Jede Exit-Adresse, über die ein Validator einen echten Verifizierungs-Hop leitet, wird auf ihr Netzwerkpräfix reduziert (ein /29 bei IPv4, ein /48 bei IPv6). Die Punktzahl einer Flotte ist die Zahl der verschiedenen Präfixe, aus denen ihre Geräte austreten.
- Ein Präfix, das mit anderen Flotten der Spitzenstufe geteilt wird, wird gleichmäßig zwischen ihnen aufgeteilt, sodass viele Geräte hinter einer Adresse oder in einem kleinen Bereich nur einmal zählen.
- Die Punktzahl wird über die Zeit geglättet (jedes Tempo zählt zu einem Viertel), sodass eine schlechte Messung keine Flotte abstürzen lässt und eine neue Flotte eine Weile braucht, bis sie ihre volle Punktzahl erreicht.

Ein einzelner Heimanschluss zählt als etwa ein Präfix. Eine eigene UID der Spitzenstufe lohnt sich für Flotten, deren Geräte aus vielen verschiedenen Netzen austreten, etwa Hosts, die über viele Rechenzentren oder viele private Anschlüsse verteilt sind.

Um zu sehen, wo du stehst, zeigt die Seite **Top 200** auf ur.io die geschätzte Punktzahl und den Rang deines Kontos gegenüber der Grenze und ob deine Geräte bereits an einen Hotkey gebunden sind.

### Was es kostet, und die Risiken

- **Die Registrierung verbrennt α.** Der Coldkey der Flotte zahlt die aktuelle Registrierungs-Burn-Gebühr des Subnets, und jede neue Registrierung erhöht die nächste. `provider fleet register` zeigt die aktuelle Burn-Gebühr, bevor es etwas signiert.
- **UIDs sind begrenzt.** Ist das Subnet voll, ersetzt eine neue Registrierung die UID mit der niedrigsten Emission, sobald deren Immunitätszeit vorbei ist. Eine Flotte, die aus den Top 200 fällt, verdient nichts, wird von der nächsten Registrierung ersetzt und muss die Burn-Gebühr erneut zahlen, um zurückzukommen.
- **Nur eine Stufe gleichzeitig.** Ein Gerät, das an eine Flotte der Spitzenstufe gebunden ist, verdient keinen Pool-Anteil, solange die Bindung aktiv ist. Verliert die Flotte ihre UID, verdienen ihre Geräte wieder im Pool ihres Betreibers. Pool-Belohnungen, die ein Gerät bereits verdient hat, bleiben beanspruchbar.
- **Die Bindung ist öffentlich.** Eine Bindung veröffentlicht, welche Geräte zu deinem Hotkey gehören, und damit die Netzwerkpräfixe, aus denen sie austreten. Geräte im Pool werden nicht auf diese Weise mit dir verknüpft.

### So beanspruchst du eine

Du brauchst einen Bittensor-Coldkey mit genug TAO für die Burn-Gebühr, einen Hotkey für die Flotte und die Identitätsdateien der Miner (`~/.urnetwork`). Bewahre den Coldkey auf einem einzigen Registrierungscomputer auf; die Miner brauchen nur ihre eigenen Identitäten. Registrieren, Veröffentlichen, Binden und Widerrufen im Mainnet laufen nur unter Linux und macOS.

1. **Schreibe das Flotten-Manifest.** Es listet die Chain-ID des Netzwerks, die netuid und den Koordinator, eine Flotten-ID, den Flotten-Hotkey, eine Generation sowie die Client-ID und den öffentlichen Schlüssel jedes Geräts. `provider fleet init` erstellt es aus den Dateien der Miner, und `provider fleet manifest --manifest=<path>` prüft es.
2. **Registriere die UID.** Führe `provider fleet register` mit dem Manifest, den Seed-Dateien von Hotkey und Coldkey und `--substrate`-Endpunkten aus. Ohne `--apply` ist es ein Probelauf, der die aktuelle Burn-Gebühr und die Transaktionsgebühr nennt. Füge `--apply` hinzu, um zu signieren und zu senden, mit `--burn_limit_rao` und `--fee_limit_rao` als Obergrenzen: Die Chain lehnt eine Registrierung ab, die mehr als dein Limit verbrennen würde.
3. **Veröffentliche das Manifest.** `provider fleet publish` schreibt den Hash des Manifests vom Flotten-Hotkey aus auf die Chain.
4. **Binde jedes Gerät an den Hotkey.** Jede Bindung wird sowohl vom Schlüssel des Geräts als auch vom Flotten-Hotkey signiert, sodass niemand Geräte beanspruchen kann, die er nicht betreibt. Eine Bindung beginnt frühestens mit der nächsten Epoche und umfasst den Epochenbereich, den du wählst (`--valid_from_epoch`, `--valid_to_epoch`). Entweder:
   - führe für jedes Gerät `provider fleet sign` aus (der Befehl liest nur lokale Dateien), füge dann seine Ausgabe auf der Top-200-Seite von ur.io ein und reiche die Transaktion, die die Seite vorbereitet, aus deiner eigenen EVM-Wallet ein; oder
   - führe für jedes Gerät `provider fleet bind` aus; der Befehl reicht die Bindung selbst mit einem EVM-Relayer-Schlüssel und `--rpc`-Endpunkten ein.
5. **Prüfe und pflege sie.** `provider fleet status` zeigt die Bindung eines Geräts und die UID. `provider fleet revoke` entfernt ein Gerät ab einer künftigen Epoche. Binde neue Geräte auf dieselbe Weise, und binde erneut vor der letzten Epoche einer Bindung.

Im Mainnet brauchen `register`, `publish`, `bind`, `status` und `revoke` außerdem das geprüfte Dokument zur Laufzeitautorität der Flotte des Netzwerks (`--mainnet-runtime-authority` und sein `--mainnet-runtime-authority-sha256`), und die Schreibvorgänge brauchen eine Deklaration des dauerhaften Volumes (`--durable-volumes` und `--durable-volumes-sha256`). Siehe den [Vertrag zu Flottenautorität und Wiederherstellung](https://github.com/urfoundation/sn/blob/main/miner/FLEET-MAINNET-RUNTIME.md) und `provider fleet --help` für jede Option. Wie Spitzenstufe und Pool-Stufe bewertet werden, steht im [Whitepaper](https://github.com/urfoundation/sn/blob/main/WHITEPAPER.md), Abschnitte 8.4 und 11.4.
