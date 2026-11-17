---
description: Den aktuellen SN25-Validator installieren und betreiben, Schlüssel und Produktionskonfiguration bereitstellen, Validierung überwachen und native Validator-Belohnungen abheben.
---

# So betreibst du einen Validator

Der UR-Validator läuft auf **Bittensor SN25, netuid 25**. Der aktuelle [`sn/validator`](https://github.com/urfoundation/sn/tree/main/validator) misst Provider über `/verify`-Trails, bewahrt signierte Evidenz auf und reicht die daraus folgenden Miner-Gewichte über natives Commit-Reveal ein. Ein einziger `validator`-Prozess erledigt sowohl die Messung als auch das Einreichen der Gewichte.

Validatoren verdienen **native Bittensor-Dividenden**. Sie sind getrennt von den Provider-Belohnungen, die aus dem Settlement-Tresor von UR beansprucht werden. In Release 1.0 gibt es keinen Befehl `validator claim` und keine Aufwandsprämie für Validatoren. Wie du abhebst, steht weiter unten.

Dieser Leitfaden behandelt einen SN25-Validator. Ein **Root-Validator auf netuid 0** hat eine eigene Registrierung, einen eigenen Betrieb und eigene Korb-Claims; eine Registrierung auf Root startet keine UR-Validierung. Die anderen Rollen von UR beschreiben der [Miner-Leitfaden](/docs/miner) und der [Leitfaden für Netzbetreiber](/docs/operator).

## Bevor du beginnst

Bereite diese Eingaben für die Bereitstellung vor, der du beitreten willst:

- Einen Linux-Host, persistenten Speicher und ununterbrochenen Zugang zur HTTPS-API und zum WSS-Transport jedes konfigurierten Betreibers, dazu die RPC-Endpunkte der Bereitstellung: EVM über HTTP(S) und nativ über WS(S). Die Prüfungen der dauerhaften Volumes im Mainnet verlangen Linux, auch wenn sich das Binary ebenso für macOS bauen lässt.
- Eine Bittensor-Coldkey-Wallet mit Mitteln für Registrierung, Staking und Transaktionsgebühren. Bewahre sie auf dem Rechner auf, den du für Wallet-Vorgänge nutzt. Der laufende Validator braucht seinen Hotkey und die Client-Schlüssel pro Betreiber, nicht den Coldkey.
- Einen in SN25 registrierten Hotkey mit genug Stake-Gewicht, um ein Validator-Permit zu erhalten. Registrierung, Stake-Schwelle und Zahl der Permits sind Chain-Zustand, keine festen Beträge dieses Leitfadens. [Bittensors Dokumentation zu Validator-Permits](https://www.bittensor.com/docs/guides/validating) erklärt, wie die Berechtigung bestimmt wird.
- Eine vollständige, unabhängig genehmigte **Produktionskonfiguration nach Schema 3**, die darin referenzierten Runtime- und Richtliniengenehmigungen sowie die Aktivierungs- und Verlaufsdateien für jeden Betreiber. Besorge sie für deinen tatsächlichen Hotkey, deine Bereitstellung und deine Host-Pfade, bevor du den Dienst startest.
- Vorbereitete Zustandsverzeichnisse und eine per SHA-256 fixierte Deklaration der dauerhaften Volumes für diese Verzeichnisse. Der Start im Mainnet verlangt diese Deklaration und prüft die tatsächliche Identität des Speichers.

Das aktuelle Produktions-Binary akzeptiert eine fertig eingerichtete Schema-3-Bereitstellung. Seine Befehle `init --config`, `register`, `stake add`, `activate` und `status --config` verwenden noch den älteren Lader vor der Aktivierung, der Schema 3 ablehnt. Sie bieten keinen Selbstbedienungs-Einstieg für das aktuelle Mainnet. Verwende für Registrierung und Staking die nativen Wallet-Schritte unten; stelle die Evidenz und die Genehmigungseingaben für das Mainnet über den Bootstrap-Prozess der Bereitstellung bereit. Eine geänderte Schemanummer oder eine kopierte Testnet-Konfiguration erzeugt diese Eingaben nicht. Diese Grenze ist unter [Zulassung der Produktions-Runtime](https://github.com/urfoundation/sn/blob/main/mainnet/VALIDATOR-PRODUCTION-RUNTIME.md) dokumentiert.

## 1. Den Validator beschaffen

Lade einen Release-Build des Validators herunter oder baue ihn aus dem Quellcode.

### Ein Release herunterladen

Der Validator wird als `urnetwork-validator-<version>.tar.gz` auf der [Release-Seite von build](https://github.com/urnetwork/build/releases) ausgeliefert. Das Archiv enthält ein Binary pro Plattform unter `<os>/<arch>/validator`, für Linux und macOS. Ein Mainnet-Validator betreibt das Linux-Binary, `linux/amd64` oder `linux/arm64` (siehe [Bevor du beginnst](#before-you-start)):

```bash
VERSION=2026.10.6-1065506180   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-validator.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-validator-${VERSION}.tar.gz"
tar -xzf urnetwork-validator.tar.gz
install -d "$HOME/.local/bin"
install -m 755 linux/amd64/validator "$HOME/.local/bin/validator"   # choose your os/arch
"$HOME/.local/bin/validator" --help
```

Füge `$HOME/.local/bin` deinem `PATH` für die Befehle unten hinzu. Notiere die Release-Version zusammen mit dem Binary, damit eine spätere Bereitstellung es reproduzieren kann.

### Oder aus dem Quellcode bauen

Baue aus der `sn`-Revision, die für deine Bereitstellung gewählt ist. Verwende die in [`sn/go.mod`](https://github.com/urfoundation/sn/blob/main/go.mod) angegebene Go-Version und passende Geschwister-Checkouts für seine lokalen `replace`-Direktiven: `connect` (einschließlich `sctp`), `sdk`, `server`, `warp`, `proxy`, `userwireguard`, `glog`, `goidenticons` und `gvisor`.

Im Wurzelverzeichnis des Repositorys `sn`:

```bash
go build -trimpath -o ./bin/validator ./cli/validator
install -d "$HOME/.local/bin"
install -m 755 ./bin/validator "$HOME/.local/bin/validator"
"$HOME/.local/bin/validator" --help
```

Füge `$HOME/.local/bin` deinem `PATH` für die Befehle unten hinzu. Der ausführbare Einstiegspunkt ist `cli/validator`; `validator/` ist die importierbare Implementierung, daher erzeugt `go build ./validator` nicht das ausführbare Programm des Dienstes. Notiere die Quellcode-Revision zusammen mit dem Binary, damit eine spätere Bereitstellung es reproduzieren kann.

## 2. Die Dienstschlüssel erzeugen

Erzeuge die Schlüssel als das Konto, dem die privaten Dateien des Validators gehören werden, nachdem der Host-Administrator dessen Speicher bereitgestellt hat. Dieses Beispiel verwendet die Betreiber `1` und `2`; setze die tatsächlichen Betreiber-IDs ein und nimm jeden Betreiber in die Konfiguration deiner Bereitstellung auf:

```bash
umask 077
validator init --state_dir=/var/lib/ur-validator --no_id=1 --no_id=2
```

Das erzeugt `/var/lib/ur-validator/hotkey.seed` und für jeden Betreiber ein `no-<id>/client.key`, mit Modus `0600`. Es gibt die SS58-Adresse und den öffentlichen Schlüssel des Hotkeys aus sowie das öffentliche `vpk` jedes Client-Schlüssels. Vorhandene Seeds werden wiederverwendet. Der Hotkey ist sr25519; die Client-Schlüssel pro Betreiber sind Ed25519. Bewahre die ursprünglichen Schlüssel über Neustarts hinweg mit dem ursprünglichen Zustand auf und sichere sie privat. Teile niemals einen Client-Schlüssel oder ein Zustandsverzeichnis zwischen Betreibern oder Validatoren.

Die Form von `init` mit Zustandsverzeichnis funktioniert, bevor eine Produktionskonfiguration existiert. Wenn du den registrierten Hotkey bereits betreibst, stelle seinen vorhandenen Seed bereit, statt eine andere Identität zu erzeugen. Die Seed-Datei des Hotkeys akzeptiert 32 rohe Bytes oder 64 Hexadezimalzeichen, mit optionalem Präfix `0x`. Behalte die Client-Seed-Dateien pro Betreiber in ihrer erzeugten Form. Übergib Seed-Material nicht als Shell-Argument und lege es nicht in die YAML-Konfiguration.

## 3. In SN25 registrieren und staken

Installiere auf deinem **Coldkey-Wallet-Rechner** die aktuelle Bittensor CLI nach ihrer [offiziellen Installationsanleitung](https://www.bittensor.com/docs/quickstart). Die folgenden Beispiele verwenden die aktuellen Befehle von v11; prüfe `btcli --version` und den [Migrationsleitfaden](https://www.bittensor.com/docs/migration), wenn deine Installation ältere `--wallet.name`-Flags hat.

Setze die öffentliche Hotkey-Adresse auf den `hotkey ss58`, den `validator init` ausgegeben hat, und wähle deine vorhandene Coldkey-Wallet. Diese Variablen enthalten keine Geheimnisse:

```bash
VALIDATOR_WALLET='your-coldkey-wallet-name'
VALIDATOR_HOTKEY='your-validator-hotkey-ss58'

btcli -n finney query subnet-hyperparameters --netuid 25 --json
btcli -n finney query metagraph --netuid 25 --json
```

Prüfe vor dem Einreichen die aktuelle Verfügbarkeit und die Kosten der Registrierung. Sieh dir die [Registrierung](https://www.bittensor.com/docs/tx/burned-register) zuerst in der Vorschau an und reiche dann denselben Vorgang mit Bestätigung ein:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY"
```

Ist der Hotkey bereits für den vorgesehenen Coldkey registriert, behalte diese Registrierung. Die Registrierung allein gewährt kein Validator-Permit.

Wähle den zu stakenden TAO-Betrag anhand der aktuellen Berechtigungsbedingungen und deines verfügbaren Guthabens und lass Mittel für Gebühren übrig. Gib diesen Betrag ein, wenn du danach gefragt wirst:

```bash
read -r -p 'TAO amount to stake: ' VALIDATOR_STAKE_TAO
btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO"
```

[`add-stake`](https://www.bittensor.com/docs/tx/add-stake) tauscht TAO zum Pool-Preis in SN25-Alpha. Prüfe vor dem Bestätigen die Gebühren und den Preisschutz in der Vorschau. Prüfe nach der Finalisierung und der Vergabe des Permits erneut den [Metagraph](https://www.bittensor.com/docs/query/metagraph); dein Hotkey, der besitzende Coldkey, die UID, der Stake und das Validator-Permit müssen zu den Produktionseingaben passen.

Das SN-Binary behält außerdem `validator register` und `validator stake add` für Konfigurationen, die sein älterer Lader zulässt. Sie laufen standardmäßig als Probelauf, bis `--apply` gesetzt ist, nehmen eine Coldkey-Seed-Datei und geben Stake-Beträge in **rao** an. Sie ersetzen nicht die hier beschriebene Schema-3-Einrichtung für das Mainnet.

## 4. Sich bei jedem Betreiber authentifizieren

Verwende für jeden konfigurierten Betreiber eigene Kontozugangsdaten und eine eigene Client-Identität. Für den Referenzbetreiber hole dir einen Auth-Code unter [ur.io/?auth](https://ur.io/?auth) und führe dann aus:

```bash
validator auth --api_url=https://api.bringyour.com
install -m 600 "$HOME/.urnetwork/jwt" /var/lib/ur-validator/no-1/network.jwt
```

Für einen anderen Betreiber verwende dessen tatsächliche API und dessen tatsächlichen Anmeldeweg und kopiere dann das neu ausgestellte Token in das Verzeichnis dieses Betreibers. `validator auth -f --api_url=...` ersetzt ausdrücklich das temporäre `$HOME/.urnetwork/jwt`; `validator auth --user_auth=... --api_url=...` fragt stattdessen nach einem Passwort.

`validator auth --operator=<domain>` findet den Betreiber in der veröffentlichten [Betreiberliste](/operators.yml), statt `--api_url` zu nehmen, und schreibt sein Token nach `<state_dir>/operators/<domain>/jwt`; das Standard-Zustandsverzeichnis ist `~/.urnetwork/validator`. Dort liest es die [Messung jedes gelisteten Betreibers](#measure-every-listed-operator-without-weights). Mit `--hotkey_seed_file=<path>` meldet sich `validator auth` mit dem Hotkey an, als TAO-Wallet, statt mit einem Auth-Code oder Passwort. Die Produktionskonfiguration liest nur die `network_jwt_file`-Pfade, die sie nennt.

Die Konfiguration jedes Betreibers nennt `network_jwt_file`, `client_jwt_file` und `client_key_seed_file`. Das Client-JWT ist an den ursprünglichen Client-Schlüssel und die ursprüngliche Identität gebunden. Eine Produktionskonfiguration kann die erste Registrierung ausdrücklich mit `allow_client_registration: true` erlauben; ohne diese signierte Erlaubnis stelle die vorhandenen Client-Zugangsdaten bereit. Eine nicht unterstützte Registrierungs-API, eine fehlende Anmeldung oder eine nicht passende Identität können die Messung im Wartezustand lassen. Bewahre bei der Wiederherstellung der Authentifizierung die vorhandene Identität.

## 5. Produktionskonfiguration und Evidenz bereitstellen

Verwende die vollständige genehmigte `release.yml`, keine von Hand bearbeitete Version einer signierten Konfiguration. Das Folgende ist die Eingabe-Checkliste für die aktuelle [`ReleaseConfig`](https://github.com/urfoundation/sn/blob/main/validator/config.go):

| Eingabe | Was bereitzustellen ist |
| --- | --- |
| Produktionsidentität | `schema_version: 3`, `production: true`, `release: "1.0"`, die `deployment_id` der Bereitstellung und deine von null verschiedene `validator_id`. |
| Netzwerk und Verträge | Im Mainnet `chain_id: 964`, `netuid: 25`, die tatsächlichen `genesis_hash`, `coordinator`, `settlement_vault` und `deploy_block`. |
| Runtime | Geprüfte `runtime_spec`, `transaction_version`, `state_version`, `runtime_code_hash` und `runtime_metadata_hash`, dazu die endlichen nativen Block- und Epochenfenster der Genehmigung und die Producer-Fähigkeit. |
| Richtlinie und Zeitplanung | Vollständige `policy`, der dazu passende `policy_hash`, `version_key`, `trail_depth` gleich der Trail-Tiefe der Richtlinie und `poll_seconds` von 1 bis 60. |
| Native wirtschaftliche Genehmigung | Die unabhängig signierte `treasury_approval` oder `owner_recycle_approval` der Bereitstellung, mit dem unabhängigen öffentlichen Signer sowie genauem Pfad, Bytelänge und SHA-256 der Genehmigungsdatei. Die Selektoren schließen sich gegenseitig aus. |
| Verbindungen | Ausdrückliche EVM-`rpc`-Endpunkte über HTTP(S) und native `substrate`-Endpunkte über WS(S). |
| Private Dienstdateien | `state_dir`, `hotkey_seed_file` und der getrennte Zustand und die getrennten Zugangsdaten für jeden Betreiber. |
| Betreiberverzeichnis | Für jeden Betreiber `no_id`, `api_url`, `connect_url`, ein eigener `artifact_signer`, Pfade zu Zugangsdaten und Schlüsseln und `concurrency`. Nimm mindestens `policy.safety.minimum_healthy_no_count` Betreiber auf. |
| Unabhängigkeit | `controlled_no_ids` listet Betreiber, die du kontrollierst, damit ihre Pools und die zugehörigen Flotten der Spitzenstufe maskiert werden. |
| Evidenz | Vollständige Grenzen für `evidence_v2` und für jeden Betreiber `activation`, `vpk_signature`, `hotkey_signature`, `context`, `history`, `replay_scratch_root` und `seal_scratch_root`. Dateiverweise fixieren Pfad, Bytes und SHA-256. |
| Ursprüngliche Anfrage-Evidenz | `request_receipt_scope` und `request_preparation` der Bereitstellung für Betreiber, die den ursprünglichen Ablauf mit Anfragebelegen verwenden, mit ihrem vorbereiteten Speicher. |
| Verlängerungsverlauf | Alle gewählten `production_runtime_approvals`, `production_authority_history` und die Kapazitätsrevision, die nötig sind, um vorhandene Arbeit unter ihrer ursprünglichen Autorität erneut abzuspielen. |

Der aktuelle Produktionsweg der Treasury und das Format ihrer Genehmigung sind unter [native Treasury in der Produktion](https://github.com/urfoundation/sn/blob/main/validator/TREASURY-PRODUCTION.md) beschrieben. Validatoren erhalten öffentliche Routing-Daten der Treasury; ein privater Treasury-Schlüssel ist keine Voraussetzung für einen Validator.

Bemiss den Host nach den genehmigten Grenzen für Evidenz und Verlauf und nach allen konfigurierten Trail-Workern. Die `concurrency` pro Betreiber muss zwischen 1 und 128 liegen, innerhalb der Obergrenze aktiver Trails der Richtlinie bleiben und jedem Worker erlauben, vor dem Schritt-Timeout das ratenbegrenzte Seed-Tor zu passieren. Wer in einer signierten Konfiguration Nebenläufigkeit oder Plattengrenzen erhöht, braucht einen genehmigten Ersatz.

Aktivierungseinträge binden die Client-Identität jedes Betreibers an deinen registrierten Validator-Hotkey, mit beiden Signaturen und einer finalisierten Veröffentlichung im Evidenz-Journal. Ihr Kontext und ihr Verlauf müssen die konfigurierte anfängliche Settlement-Grenze abdecken. Der Produktionsdienst authentifiziert diese Eingaben, bevor er neue Arbeit beginnt. Ein leerer Eintrag `evidence_v2.operators` reicht im Mainnet nicht aus. Der ältere Weg `validator activate --config=...` kann diese Eingaben nicht aus einer Schema-3-Konfiguration erzeugen.

Halte die Pfade beim Einrichten stabil. Relative Pfade werden relativ zum Konfigurationsverzeichnis aufgelöst, und das Verschieben einer Konfiguration kann ihre Bedeutung ändern. Eine typische Struktur ist:

```text
/etc/ur-validator/
  release.yml                    # complete approved production config
  durable-volumes.json           # declaration for this host's actual storage
  approvals/                     # referenced public approval/history files
/var/lib/ur-validator/
  hotkey.seed                     # private sr25519 seed
  state/                         # durable intents and shared validator state
  no-1/
    client.key                   # private Ed25519 seed
    network.jwt
    client.jwt
    ...                          # prepared operator evidence/state
  no-2/                          # separate keys, JWTs and state
  evidence-v2/                   # prepared, hash-pinned activation inputs
  scratch-v2/                    # prepared replay and seal storage
/var/lib/ur-validator-observation/
  progress.json                  # created by the running validator
```

Das sind Beispielpfade, kein Ersatz für die Pfade in deinem genehmigten Paket. Private Dateien brauchen geschützte Eigentümerschaft und Berechtigungen; Verzeichnisse des Protokollzustands müssen den vorbereiteten dauerhaften Speicher verwenden. Leere Verzeichnisse anzulegen bereitet allein keine Versuchsjournale vor und ersetzt nicht ihren aufbewahrten Verlauf. Lege die Fortschrittsdatei außerhalb aller Protokollzustands-, Schlüssel-, Zugangsdaten- und Evidenzverzeichnisse ab, in einem vorhandenen übergeordneten Verzeichnis, das für Gruppe und andere nicht beschreibbar ist.

## 6. Den Validator betreiben und überwachen

Setze die **unabhängig akzeptierte SHA-256** der Deklaration der dauerhaften Volumes; ersetze sie nicht durch einen frisch berechneten Hash, um eine Abweichung zu umgehen. Prüfe die vorbereiteten Verzeichnisse vor dem Start:

```bash
VALIDATOR_VOLUMES_SHA256='sha256:replace-with-the-approved-64-hex-digit-digest'

validator storage-inspect \
  --durable-volumes=/etc/ur-validator/durable-volumes.json \
  --durable-volumes-sha256="$VALIDATOR_VOLUMES_SHA256" \
  --directory=/var/lib/ur-validator/state \
  --directory=/var/lib/ur-validator/no-1 \
  --directory=/var/lib/ur-validator/no-2

validator run --config=/etc/ur-validator/release.yml \
  --durable-volumes=/etc/ur-validator/durable-volumes.json \
  --durable-volumes-sha256="$VALIDATOR_VOLUMES_SHA256" \
  --progress-file=/var/lib/ur-validator-observation/progress.json \
  --operators-refresh=1h
```

Der Befehl im Vordergrund führt echte Validierung durch und kann Gewichte einreichen, sobald die genehmigten Bedingungen erfüllt sind. Betreibe genau einen Prozess pro Hotkey und Zustands-Namensraum. Verwende dieselben Argumente unter dem Dienstmanager deiner Bereitstellung; bewahre beim Neustart die ursprünglichen Journale und die signierten ausstehenden Transaktionen. Kläre eine Ablehnung wegen Verwahrung oder Konfiguration vor dem Neustart, statt Zustand zu löschen oder Ersatzschlüssel zu erzeugen.

`--operators-refresh=1h` folgt der veröffentlichten [Betreiberliste](/operators.yml) und ruft sie jede Stunde neu ab, ohne zu ändern, was der Validator signiert oder gewichtet: Gewichtet werden nur die in der signierten Konfiguration fixierten Betreiber, und das Release läuft genau so, wie es ohne das Flag liefe. Die Liste wird als `operators.yml` im `state_dir` der Konfiguration zwischengespeichert. Beim Start und bei jeder Änderung der Liste protokolliert der Validator einen Abweichungsbericht und schreibt ihn nach `operators-report.json` neben diesen Cache. Der Bericht zeigt jeden fixierten Betreiber, per API-URL mit der Liste abgeglichen, als gelistet oder aus der Liste entfernt, mit einer etwaigen Abweichung der Connect-URL, und jeden gelisteten Betreiber, den die Konfiguration nicht fixiert. Er ist eine betriebliche Ausgabe; nichts liest ihn wieder ein.

Mit `--operators-refresh` folgt `--operators-url=<url>` einer anderen Liste, und `--observe-unpinned-operators` misst zusätzlich jeden gelisteten Betreiber, den die Konfiguration nicht fixiert, nur zur Beobachtung, unter `observed-operators/<domain>/` im `state_dir` der Konfiguration. Die Beobachtung meldet sich mit dem `hotkey_seed_file` der Konfiguration an und stellt damit die Messidentität bereit, und ihre Ergebnisse erreichen nie Gewichte, Evidenz oder Produktionszustand. Fixierte Betreiber behalten ihr konfiguriertes `network_jwt_file`; fehlt es, wird das gemeldet, es wird aber nie angelegt.

Beobachte stderr und den in der Größe begrenzten [Fortschrittseintrag](https://github.com/urfoundation/sn/blob/main/mainnet/SERVICE-PROGRESS.md). Prüfe mehrere getrennte Signale:

- Ein aktuelles `heartbeat_at` und `publisher.last_success_at` zeigen Prozess- und Veröffentlichungsaktivität.
- `intent`-Einträge zeigen die Grenzen vorbereiteter, finalisierter und angewendeter Transaktionen. Eine eingereichte oder ausstehende Transaktion ist noch kein angewendeter Gewichtsvektor.
- `settlement` zeigt den dauerhaften Epochen-Cursor und ausstehende Veröffentlichungsarbeit.
- Die Diagnosen zur Authentifizierung bei den Betreibern und zu den Trails zeigen, ob die Messung für jeden Betreiber vorankommen kann.
- Abweichungen von der Betreiberliste stehen nicht im Fortschrittseintrag. Mit `--operators-refresh` stehen sie im Log und in `operators-report.json`.
- Native Metagraph-Abfragen zeigen, ob der Hotkey seine UID und sein Permit noch hält und Dividenden erhält.

Das Warten auf eine Epoche kann normal sein; ein frischer Heartbeat allein belegt keine erfolgreiche Validierung. Das aktuelle `validator status --config` lehnt Schema 3 ab, also verwende für diesen Produktionsweg den Fortschrittseintrag, die Dienst-Logs und native Chain-Abfragen. Ohne `--config` ist `validator run` ein Alt-Modus, der nur misst, und schreibt nie Release-Gewichte.

### Jeden gelisteten Betreiber ohne Gewichte messen

`validator run --all-operators` misst jeden Betreiber der veröffentlichten Betreiberliste und schreibt nie Gewichte. Jeder Betreiber hat seinen eigenen Zustand unter `<state_dir>/operators/<domain>/`: das Token `jwt`, den Messschlüssel `.validator.key` und das Client-JWT `.validator.jwt`. Das Einzelbetreiber-`<state_dir>/.validator.key` und `~/.urnetwork/jwt` werden nicht verwendet.

```bash
validator run --all-operators --auto-register \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

- `--auto-register` meldet sich mit dem Hotkey an, als TAO-Wallet, wo ein Betreiber kein Token hat. Es stellt eine Messidentität nur für ein brandneues Betreiberverzeichnis bereit und stellt eine vorhandene Identität nie wieder her, übernimmt oder ersetzt sie nie. Die Seed-Datei muss bereits existieren; sie wird nie angelegt.
- Ohne `--auto-register` protokolliert ein Betreiber ohne Token `operator <domain> is awaiting auth: validator auth --operator=<domain>` und wird alle fünf Minuten erneut geprüft. Ein Verzeichnis ohne Messidentität wird abgelehnt und erneut versucht, und das Log nennt die Flags, die sie bereitstellen.
- Die Liste wird als `<state_dir>/operators.yml` zwischengespeichert und jede Stunde neu abgerufen, oder alle `--operators-refresh`, eine Go-Dauer von mindestens `1m`. `--operators-url=<url>` folgt einer anderen Liste. Solange sich die Liste nicht abrufen lässt, bleibt die letzte gültige Kopie in Gebrauch.
- Ein neu gelisteter Betreiber startet, ein aus der Liste entfernter stoppt und behält seinen Zustand, und ein Betreiber, dessen URLs sich ändern, startet neu. Ein fehlgeschlagener Betreiber startet nach 30 Sekunden neu, mit Verdopplung bis zu 10 Minuten, und hält die anderen nie auf.

## 7. Validator-Belohnungen einsammeln

Dividenden eines SN25-Validators laufen über die native Staking-Buchhaltung von Bittensor auf. Dein Coldkey kontrolliert deine eigene Position; delegierter Stake und seine Belohnungen gehören den delegierenden Coldkeys, abzüglich des Anteils des Validators. Der Koordinator und der Settlement-Tresor von UR verwahren keine Validator-Dividenden. `provider claim`, `snclaim submit` und die Merkle-Nachweise der Betreiber-Auszahlungen sind für den Belohnungsweg der Miner und Provider da.

Um dein verfügbares SN25-Alpha in **freies TAO** zurückzuholen, unstake den gewählten Betrag vom tatsächlichen Hotkey, der diese Position hält. Verwende den Coldkey-Wallet-Rechner und dieselben öffentlichen Wallet-Variablen wie in Schritt 3. Prüfe zuerst deine Positionen und wähle den Betrag in **Alpha**, nicht in TAO:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
read -r -p 'SN25 alpha amount to withdraw: ' VALIDATOR_WITHDRAW_ALPHA

btcli -n finney query quote-unstake \
  --netuid 25 --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA" --json

btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA" --dry-run
```

Das [Angebot](https://www.bittensor.com/docs/query/quote-unstake) schätzt den TAO-Ertrag, die Gebühren und die Slippage. Reiche nach Prüfung des Probelaufs und des verbleibenden Stakes mit interaktiver Bestätigung ein:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA"

btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
```

[`remove-stake`](https://www.bittensor.com/docs/tx/remove-stake) tauscht verfügbares Alpha in TAO und schreibt es dem freien Guthaben des signierenden Coldkeys gut. Prüfe das Ergebnis der finalisierten Transaktion und die aktualisierten Guthaben. Deine angesammelte Position enthält sowohl Kapital als auch Belohnungen: Es gibt kein separates SN25-Guthaben „nur meine Erträge beanspruchen“. Das Abziehen von Stake kann dein Permit beeinflussen; Sperren, Sicherheiten, Gebühren und der Preisschutz des Pools können einen Vorgang begrenzen. Wurden deine Belohnungen an einen anderen Staking-Hotkey geleitet, wähle diese tatsächliche Position.

**Root-Belohnungen sind anders.** Wenn du auch auf netuid 0 stakst, hat dessen Korbertrag vor dem Abheben einen eigenen nativen Root-Claim-Ablauf. Folge [Bittensors Anleitung zu Root-Staking und Dividenden](https://www.bittensor.com/docs/guides/staking#root-stake-and-dividends). Verwende keinen Root-Claim, um gewöhnliche SN25-Alpha-Belohnungen einzusammeln.
