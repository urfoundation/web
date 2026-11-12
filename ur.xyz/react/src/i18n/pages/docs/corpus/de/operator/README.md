---
description: Einen URnetwork-Betreiber mit einem einzigen Binary ausführen, PostgreSQL-, Redis- und Warp-Ressourcen für main konfigurieren und die SN25-Belohnungspipeline betreiben.
---

# So wirst du Netzbetreiber

Ein Netzbetreiber betreibt die Server des UR-Datenschutznetzwerks: die API- und Connect-Dienste, mit denen sich Nutzer und Miner verbinden, den `/verify`-Endpunkt, den Validatoren durchlaufen, und die Epochen-Pipeline, die die Belohnungen seiner Miner auf **Bittensor SN25 (netuid 25)** abrechnet. Ein Betreiber bringt seine eigenen Nutzer und Produkte mit (die ur.io-Apps gehören einem Betreiber), zahlt α als umsatzgedecktes Signal echter Nachfrage ein und legt in jeder Settlement-Epoche die Merkle-Auszahlungsliste fest, die seinen Pool auf seine Miner aufteilt. Er meldet die Nutzung, der die Aufteilung folgt, verwahrt aber nie fremdes α: Der Pool gehört dem unveränderlichen Settlement-Tresor, und jeder Miner beansprucht seinen Anteil direkt von dort.

Der Einstiegspunkt [`server/cli/all/main.go`](https://github.com/urnetwork/server/blob/main/cli/all/main.go) führt die API, Connect und den Produktions-Taskworker gemeinsam aus. Du stellst ein einziges ausführbares Programm für den Betreiber bereit; PostgreSQL, Redis, der Artefaktspeicher und der öffentliche TLS-Ingress bleiben unterstützende Dienste. Für den Mechanismus lies das [Litepaper](/docs/litepaper); für die anderen Rollen siehe [So betreibst du einen Miner](/docs/miner) und [So betreibst du einen Validator](/docs/validator).

## Für wen das ist

Teams, die einen Netzwerkraum betreiben wollen: eine Bereitstellung des Open-Source-Server-Stacks mit eigener Domain, eigenen Nutzern, Apps oder Integrationen und einer Miner-Community. In der Startphase liegt die Zulassung von Betreibern beim Eigentümer (siehe [Anfangsphase](#initial-period)), daher ist der erste Schritt ein Gespräch mit dem Subnet-Eigentümer.

## Was du brauchst

- **Einen Linux-Host und deine Domain.** Das einzelne Binary stellt die API (`api.<your domain>`), Connect (`connect.<your domain>`) und den vollständigen Produktions-Taskworker bereit. PostgreSQL speichert Konten, Nutzung, Settlement und die dauerhafte Task-Warteschlange; Redis liefert gemeinsame Koordination und Caches; ein lokaler, dauerhafter Artefaktspeicher hält Auszahlungs- und Evidenzartefakte. Konfiguriere die Integrationen, die dein Betreiber anbietet, einschließlich des Extender-Gossip, wenn du Extender verwendest. Die optionalen Frontends Alt und Proxy sind eigene Server-Rollen.
- **Die Zulassung auf dem Koordinator.** Betreiber werden vom Subnet-Eigentümer mit `registerOperator(noId, coldkey, poolHotkey, depositHotkey, depositSigner, rootSigner, effectiveEpoch, maximumBurnRao)` registriert, einem Aufruf, den nur der Eigentümer ausführen darf und der außerdem den Settlement-Tresor deine Pool-UID unter dem eigenen Coldkey des Tresors registrieren lässt (der Registrierungs-Burn wird bis zu `maximumBurnRao` aus dem mitgesendeten Betrag des Aufrufs bezahlt, und der nicht verbrannte Rest wird erstattet). Spätere Rollenänderungen werden mit `scheduleOperator` im Voraus geplant und erst in der Zukunft wirksam. Du lieferst die Identitäten; der Eigentümer registriert sie und gibt dir deine `no_id`.
- **Schlüssel und Hotkeys.** Einen Betreiber-Coldkey (ss58, Präfix 42); einen **Pool-Hotkey**, den der Tresor als deine Pool-UID registriert; einen **Einlagen-Hotkey**, der nur dir zugeordnet ist und auf dem Einlagen bereitgestellt werden; und drei EVM-Signer, die der Server hält (hexkodiertes secp256k1): den **Einlagen-Signer** (`deposit_key`, ruft `deposit` auf), den **Root-Signer** (`root_key`, schließt Epochen, legt Auszahlungs-Roots fest und finalisiert) und den **Artefakt-Signer** (`artifact_key`, signiert Auszahlungsartefakte; Validatoren pinnen ihn als deinen `artifact_signer`). Die Signer brauchen TAO auf der Subtensor EVM für Gas; der Einlagen-Hotkey braucht α für Einlagen (während der Anfangsphase keins).
- **`/verify`-Serverschlüssel.** Einen oder mehrere Ed25519-Schlüssel in der Vault-Ressource `verify.yml`; der erste signiert neue Trails, und alle werden unter `GET /verify/keys` veröffentlicht, damit sich historische Nachweise über Rotationen hinweg verifizieren lassen.
- **Egress-Probes.** Der Taskworker im Binary betreibt dauerhafte Probe-Shards, die `config/main/provider_egress_probe.yml` konfiguriert und die messen, was der Exit jedes Miners tatsächlich trägt.
- **Einen öffentlichen Statistik-Feed** (`stats.json`), damit dich das Betreiberverzeichnis von ur.xyz aufführen kann.

## Schritt 1: das einzelne Betreiber-Binary bauen

Verwende den aktuellen Quellcode von [`urnetwork/server`](https://github.com/urnetwork/server) sowie die Go-Version und die **exakten Geschwister-Revisionen** aus seinem [Source-Lock](https://github.com/urnetwork/server/blob/main/local/source-graph/lock.yml). Der aktuelle Lock verwendet Go 1.27.3. Seine Geschwister-Checkouts sind `connect`, `glog`, `sdk`, `proxy`, `goidenticons`, `userwireguard`, `warp`, `sn` und `gvisor`; `sn` stammt aus `urfoundation/sn`, die anderen aus `urnetwork`. Lege sie neben `server` ab: `go.mod` verwendet relative Ersetzungen. Folge beim Vorbereiten dieses Quellbaums den [kanonischen Build-Anweisungen](https://github.com/urnetwork/server#canonical-build-sources) des Repositorys.

Im `server`-Checkout:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/ur-operator ./cli/all

./build/ur-operator --help
```

Kopiere `build/ur-operator` auf dem Server nach `/usr/local/bin/ur-operator`. Halte die Quellrevision des Binarys in deinen Release-Unterlagen fest. Baue jedes Upgrade aus den Abhängigkeitsrevisionen, die die jeweilige Server-Revision auswählt.

## Schritt 2: das Warp-Layout für main anlegen

Die ausführbare Datei verwendet denselben Resolver wie die einzelnen Server-Dienste. `WARP_ENV=main` wählt die **Bereitstellungsumgebung**; `URNETWORK_ST_PROFILE=mainnet` wählt davon getrennt das **Chain-Profil**. Dieses Beispiel führt den Prozess als eigenen Unix-Benutzer `urnetwork` aus, wobei ein Reverse Proxy auf demselben Host das öffentliche HTTPS terminiert.

```bash
sudo useradd --system --home-dir /srv/warp --no-create-home \
  --shell /usr/sbin/nologin urnetwork
sudo install -d -o root -g urnetwork -m 0750 /srv/warp
sudo install -d -o root -g urnetwork -m 0750 \
  /srv/warp/config/main/mmdb /srv/warp/vault/main /srv/warp/site
sudo install -d -o root -g urnetwork -m 0750 /etc/urnetwork
```

Verwende dieses Layout. Namen wie `pg.yml` sind wörtliche Ressourcennamen; `<...>`-Werte in den Beispielen unten musst du ersetzen.

```text
/usr/local/bin/ur-operator
/etc/urnetwork/operator.env
/etc/urnetwork/durable-volumes.json   # external declaration for artifact storage
/srv/urnetwork-data/                 # separately mounted persistent filesystem
  operator-blob/                     # preprovisioned artifact root
  operator-identity/                 # external volume marker and root lease
/srv/warp/
  config/
    main/
      db.yml
      redis.yml
      tls.yml
      provider_egress_probe.yml
      sn.yml                         # reviewed earnings/activation declaration
      operator-gas-authority.yml      # independently provisioned public approval
      mmdb/
        geolite2.mmdb                 # real GeoLite2-City database
        places.yml                   # place export from the same database
    all/                             # optional resources shared by environments
  vault/
    main/
      pg.yml
      redis.yml
      jwt.yml
      jwt-signing.pem
      password.yml
      client.yml
      verify.yml
      provider_egress.yml
      minio.yml
      st.yml
      auth.yml                       # OAuth configuration when offering OAuth
      oauth/                         # OAuth's separate signing keys
      extender.yml                   # when offering extender/gossip services
      tls/                           # when enabling Connect's native TLS transports
        connect.example.net/
          connect.example.net.crt
          connect.example.net.key
    all/                             # optional shared vault resources
  site/
    settings.yml                     # host-specific routes/settings
```

Setze Vault-Dateien auf `root:urnetwork` mit Modus `0640` und Vault-Verzeichnisse auf `0750`; verwende `umask 077`, wenn du Geheimnisse erzeugst. Halte die Konfiguration und die Binarys des Betreibers für den Dienstbenutzer lesbar, aber nicht beschreibbar. PostgreSQL, Redis und der Objektspeicher brauchen persistente Daten und Backups unabhängig von diesem Ressourcenbaum.

Ohne Überschreibungen sind die Wurzelverzeichnisse `$WARP_HOME/{config,vault,site}`, und `WARP_HOME` ist standardmäßig `/srv/warp`. Du kannst stattdessen `WARP_CONFIG_HOME`, `WARP_VAULT_HOME` und `WARP_SITE_HOME` auf andere Wurzelverzeichnisse setzen. Für jede Ressource versucht der Resolver zuerst Dateien direkt im Wurzelverzeichnis, dann `main/`, dann `all/`; danach durchsucht er Versionsverzeichnisse in absteigender Reihenfolge der semantischen Version. Eine Datei auf Wurzelebene überschreibt daher die Kopie der Umgebung. Ein Warp-Container kann die bereits ausgewählte Umgebung direkt als Wurzelverzeichnis einhängen. Verwende durchgängig ein einziges Layout und vermeide veraltete Dateien an einem Ort mit höherer Priorität.

Schreibe `/etc/urnetwork/operator.env` als einfache `NAME=value`-Zuweisungen ohne `export`, damit sowohl die Shell als auch systemd sie lesen können:

```dotenv
WARP_HOME=/srv/warp
WARP_ENV=main
URNETWORK_ST_PROFILE=mainnet
WARP_SERVICE=all
WARP_BLOCK=operator-1
WARP_HOST=operator-1.example.net
WARP_DOMAIN=example.net
WARP_VERSION=2026.10.6
WARP_CONFIG_VERSION=2026.10.6
WARP_HOST_IPV4=127.0.0.1
WARP_PORTS=8080:8080,8081:8081,8082:8082,5080:5080
BY_LOG_LOGTOSTDERR=true
```

Ersetze Domain, Host, Binary-Version und Konfigurationsversion durch deine. `WARP_PORTS` hat die Form `service-port:host-port` und enthält **5080**, den ersten internen Connect-Exchange-Port. Die drei HTTP-Ports müssen verschieden sein. Die Host-IP und die explizite Port-Zuordnung bestimmen außerdem, welche optionalen nativen Connect-Listener aktiviert sind. Füge zusammenhängende interne Zuordnungen `5081:5081`, `5082:5082` und so weiter hinzu, wenn du weitere Exchange-Ports vergibst.

Für diese Loopback-Bereitstellung auf einem einzelnen Host leitet `/srv/warp/site/settings.yml` den angekündigten Host zurück zu seinem internen Listener:

```yaml
routes:
  operator-1.example.net: 127.0.0.1
```

`config/main/settings.yml` liefert, falls vorhanden, gemeinsame `all:`- und hostspezifische Einstellungen, gefolgt von Überschreibungen in `site/settings.yml`. Bewahre Geheimnisse im Vault auf, nicht in einem `env_vars`-Block einer `settings.yml`: Beim Start werden die zusammengeführten Einstellungen ins Log geschrieben. Dieses Beispiel trägt die PostgreSQL-, Redis- und RPC-Authorities fest in Vault-Dateien ein, daher werden `BRINGYOUR_POSTGRES_HOSTNAME`, `BRINGYOUR_REDIS_HOSTNAME` und `BRINGYOUR_SUBTENSOR_HOSTNAME` nicht gebraucht. Sie werden nur gebraucht, wenn deine Ressourcen sie ausdrücklich mit `{{ env:NAME }}` interpolieren.

## Schritt 3: PostgreSQL, Redis und den Artefaktspeicher einrichten

Installiere und starte PostgreSQL und Redis als separate Dienste; das lokale Setup des Server-Repositorys verwendet PostgreSQL 18 und Redis 8. Lege auf einem Host mit installiertem PostgreSQL die eigene Datenbank des Betreibers und ihre Eigentümerrolle an:

```bash
sudo -u postgres createuser --pwprompt urnetwork
sudo -u postgres createdb --owner=urnetwork --encoding=UTF8 \
  --locale=en_US.UTF-8 --template=template0 urnetwork
```

Installiere zuerst die Locale `en_US.UTF-8`, falls der Datenbank-Host sie nicht hat. Binde PostgreSQL an Loopback und erlaube in `pg_hba.conf` die Passwort-Authentifizierung für die Rolle `urnetwork` auf die Datenbank `urnetwork` von `127.0.0.1/32` aus mit `scram-sha-256`. Die Migrationsrolle muss Eigentümerin der Datenbank bzw. des Schemas sein und deren Tabellen und Indizes anlegen und ändern können. Verwende ein generiertes hexadezimales Passwort, damit es in der Verbindungs-URL, die dieser Server zusammensetzt, sicher ist.

Lege `/srv/warp/vault/main/pg.yml` an:

```yaml
authority: 127.0.0.1:5432
db: urnetwork
user: urnetwork
password: "<the PostgreSQL role password>"
```

Lege `/srv/warp/config/main/db.yml` an:

```yaml
min_connections: 0
max_connections: 32
```

Der Wartungs-Pool greift ersatzweise auf diese Ressourcen zurück. Wenn du PgBouncer hinzufügst, lass `pg.yml` auf den Pooler zeigen und trage die direkte PostgreSQL-Verbindung in `vault/main/pg_maintenance.yml` ein; `config/main/db_maintenance.yml` kann die Größe dieses Pools separat festlegen. Migrationen und Wartung brauchen die direkte Verbindung. Plane das Verbindungslimit von PostgreSQL für beide Pools und alle anderen Clients ein. Der aktuelle PostgreSQL-Client verwendet `sslmode=disable`, halte diese Verbindung also auf Loopback oder einem geschützten privaten Transport.

Konfiguriere Redis mit Persistenz und einem Passwort. Für einen aus Paketen installierten Redis-Dienst sind dies die relevanten Einstellungen in `redis.conf`:

```conf
bind 127.0.0.1
protected-mode yes
appendonly yes
maxmemory-policy noeviction
requirepass <a separate generated Redis password>
```

Starte Redis neu, nachdem du die Einstellungen eingespielt hast. Lege `/srv/warp/vault/main/redis.yml` an:

```yaml
authority: 127.0.0.1:6379
password: "<the Redis password>"
cluster: false
db: 0
```

Lege `/srv/warp/config/main/redis.yml` an:

```yaml
min_connections: 0
max_connections: 32
```

Das sind getrennte Dateien: Der Vault liefert die Zugangsdaten für die Verbindung, die Konfiguration die Pool-Größen. Ein Redis-Cluster verwendet `cluster: true`; dieser Leitfaden verwendet eine eigenständige Instanz nur für den Betreiber. Keiner der beiden unterstützenden Dienste sollte aus dem öffentlichen Internet erreichbar sein.

### Lokalen Artefaktspeicher vorbereiten

Der Code für Auszahlungen und Evidenz verwendet die `BlobStore`-Schnittstelle des Servers. Sie unterstützt lokale Dateien; ein Konto bei einem Cloud-Objektspeicher ist nicht nötig. Die Konfigurationsressource heißt trotzdem `minio.yml`, auch für das lokale Backend.

Hänge ein persistentes **separates Dateisystem** unter `/srv/urnetwork-data` ein, mit ext4, XFS oder Btrfs, und sorge dafür, dass es eingehängt wird, bevor der Dienst startet. Ein Verzeichnis im Root-Dateisystem des Systems, tmpfs oder ein Container-Overlay genügt der Speicherzulassung des Daemons nicht. Dimensioniere das Dateisystem für deinen Artefaktverlauf und deine Backups.

Für einen **neuen, leeren Betreiber** richtest du das Artefakt-Wurzelverzeichnis und seine unabhängig aufbewahrte Identitätsdeklaration ein. Das folgende Beispiel weigert sich, vorhandene Wurzelverzeichnisse, Marker-Dateien oder eine Deklaration wiederzuverwenden. Führe es einmal als Administrator des Hosts aus, nachdem du geprüft hast, dass dies das beabsichtigte eingehängte Volume ist:

```bash
sudo python3 - <<'PY'
import hashlib, json, os, pathlib, pwd, subprocess

mount = pathlib.Path('/srv/urnetwork-data')
root = mount / 'operator-blob'
identity = mount / 'operator-identity'
declaration = pathlib.Path('/etc/urnetwork/durable-volumes.json')
account = pwd.getpwnam('urnetwork')
if not os.path.ismount(mount) or mount.stat().st_dev == pathlib.Path('/').stat().st_dev:
    raise SystemExit('a separately mounted persistent filesystem is required')
uuid, fs_type = subprocess.check_output(
    ['findmnt', '--noheadings', '--raw', '--output', 'UUID,FSTYPE', '--mountpoint', str(mount)],
    text=True).strip().split()
if fs_type not in ('ext4', 'xfs', 'btrfs'):
    raise SystemExit('unsupported durable filesystem')
if any(p.exists() for p in (root, identity, declaration)):
    raise SystemExit('existing storage requires its original declaration and recovery procedure')
os.umask(0o077)
root.mkdir(mode=0o700)
os.chown(root, account.pw_uid, account.pw_gid)
identity.mkdir(mode=0o750)
os.chown(identity, 0, account.pw_gid)
os.chmod(identity, 0o750)
def digest(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()
def protected_write(path, data):
    with path.open('xb') as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.chown(path, 0, account.pw_gid)
    os.chmod(path, 0o640)
marker, lease, generation = os.urandom(32), os.urandom(32), os.urandom(32)
protected_write(identity / 'marker', marker)
protected_write(identity / 'blob-lease', lease)
os.setxattr(root, 'user.urnetwork.durable-root-generation', generation, os.XATTR_CREATE)
config = {'schema': 'urnetwork-durable-volumes-v2', 'volumes': [{
    'mount_path': str(mount), 'filesystem_uuid': uuid, 'filesystem_type': fs_type,
    'marker_path': str(identity / 'marker'), 'marker_sha256': digest(marker),
    'min_available_bytes': 1073741824, 'min_available_inodes': 10000,
    'state_roots': [{'path': str(root), 'lease_path': str(identity / 'blob-lease'),
        'lease_sha256': digest(lease), 'root_inode': root.stat().st_ino,
        'generation_sha256': digest(generation)}]}]}
encoded = (json.dumps(config, indent=2) + '\n').encode()
protected_write(declaration, encoded)
for directory in (root, identity, mount, declaration.parent):
    fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)
print('declaration:', declaration)
print('sha256:', digest(encoded))
PY
```

Notiere den ausgegebenen Pfad der Deklaration und den `sha256:`-Digest und konfiguriere `/srv/warp/vault/main/minio.yml`:

```yaml
authority: local
path: /srv/urnetwork-data/operator-blob
prefix: blob
max_bytes: 107374182400
durable_volumes:
  path: /etc/urnetwork/durable-volumes.json
  sha256: "sha256:<exact declaration digest>"
```

Das Beispiel weist Blobs höchstens 100 GiB zu und verweigert Schreibvorgänge, wenn weniger als 1 GiB oder 10.000 freie Inodes übrig sind; wähle Grenzen passend zu deinem Host. Die Deklaration bindet die UUID des Dateisystems, den Marker, die Lease, die Inode des Wurzelverzeichnisses und das 32-Byte-Generationsattribut. Der Dienst validiert diese vorhandenen Objekte und legt nie ein Ersatz-Wurzelverzeichnis an. Schütze ihre Eigentümerschaft und ihre übergeordneten Verzeichnisse vor Schreibzugriff durch Gruppe und Welt. Bewahre die ursprüngliche Deklaration und die Bytes über Neustarts hinweg; eine Wiederherstellung auf eine andere Inode oder ein anderes Dateisystem erfordert eine ausdrückliche Speichermigration, nicht das erneute Ausführen dieser Ersteinrichtung auf aufbewahrten Artefakten. Dieses Rezept richtet nur den Dateispeicher des Betreibers ein; die Claim-Warteschlangen der Miner und die Journale der Validatoren haben ihre eigene Vorbereitung des Eigentümerzustands.

Fehlt `minio.yml`, gibt es in `main` keinen Rückfall auf das Dateisystem. Bestehende Bereitstellungen können alternativ das selbst gehostete MinIO-Backend verwenden, das [`server/blob.go`](https://github.com/urnetwork/server/blob/main/blob.go) unterstützt, mit `authority`, `tls`, `access_key`, `secret_key`, `bucket` und `prefix`. Behandle Artefaktspeicher und Datenbank in deinem Wiederherstellungsplan gemeinsam: Miner und Validatoren müssen die Artefakte, auf die On-Chain-Roots verweisen, weiterhin abrufen können.

## Schritt 4: Authentifizierung und Ingress konfigurieren

Erzeuge einen eigenen P-256-JWT-Signaturschlüssel in `vault/main/jwt-signing.pem`, zum Beispiel mit `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt-signing.pem`, und installiere ihn dann mit den Vault-Berechtigungen von oben. Tu das in einem privaten Verzeichnis unter `umask 077`. Lass `vault/main/jwt.yml` auf ihn verweisen:

```yaml
tls_key_paths:
  - jwt-signing.pem
```

Der Ressourcenname ist historisch bedingt: Das kann ein eigener Signaturschlüssel sein und muss nicht der Schlüssel deines öffentlichen HTTPS-Zertifikats sein. Halte frühere JWT-Schlüssel während einer Rotation verfügbar. Konfiguriere zwei getrennte, zufällige Pepper:

```yaml
# vault/main/password.yml
password:
  pepper: "<random password pepper>"
```

```yaml
# vault/main/client.yml
client_ip_hash_pepper: "<different random IP hash pepper>"
```

Installiere eine aktuelle, lizenzierte GeoLite2-City-Datenbank unter `config/main/mmdb/geolite2.mmdb` und die dazu passende `places.yml`. Das Build-Werkzeug `cli/geolite2export` des Servers erzeugt die Ortsliste aus genau dieser MMDB (`-mmdb <path> -out <path>`); erzeuge sie auf dem Build- bzw. Konfigurations-Host und liefere beide Dateien aus. Die winzige Datenbank in `local/testdata` ist eine Test-Fixture, keine Geodatenbank für die Produktion. Das Aufwärmen von API und Connect erfordert eine gültige City-Datenbank, und das Seeding der Standorte erfordert ihre Ortsliste.

Lege `config/main/tls.yml` an, die Connect auch dann lädt, wenn die Bereitstellung nur WebSockets verwendet:

```yaml
allowed_hosts:
  - connect.example.net
```

Konfiguriere deinen HTTPS-Reverse-Proxy für die Loopback-Port-Zuordnung von oben wie folgt:

| Öffentlicher Endpunkt | Interner Listener | Anforderung an den Ingress |
| --- | --- | --- |
| `https://api.example.net` | `http://127.0.0.1:8080` | die API-Routen und die echte Client-Adresse weiterleiten |
| `wss://connect.example.net` | `http://127.0.0.1:8081` | WebSocket-Upgrades und langlebige Verbindungen erhalten |
| Worker-Status | `http://127.0.0.1:8082/status` | für das Monitoring privat halten |
| Connect-Exchange | TCP `127.0.0.1:5080` | nur intern |

Terminiere TLS mit Zertifikaten für deine öffentlichen Namen. Der Ingress muss **`X-UR-Forwarded-For` mit genau einem echten `IP:port`-Paar des Clients überschreiben**, mit eckigen Klammern um eine IPv6-Adresse. Der [Adress-Resolver des Servers](https://github.com/urnetwork/server/blob/main/session/client_session.go) ignoriert das übliche `X-Forwarded-For` absichtlich; `/verify` ist darauf angewiesen, die tatsächliche Exit-Adresse des Miners zu sehen. Nur dein vertrauenswürdiger Ingress sollte die internen Listener erreichen. Leite `/verify`, `/sn/*` und WebSocket-Verkehr ohne Authentifizierungs- oder Pufferregeln weiter, die ihre eigenen Protokolle stören.

Diese Port-Zuordnung stellt den WebSocket-Transport bereit. Native HTTP/3- und DNS-Transporte brauchen zusätzlich Connect-Port-Zuordnungen für die Dienst-Ports UDP/443 und UDP/4053, die [Warp-Konvention für die Ingress-Weiterleitung](https://github.com/urnetwork/warp) und Zertifikate unter `vault/main/tls/<hostname>/<hostname>.crt` und `.key`. Öffentliches DNS verwendet UDP/53, das der Ingress an das private UDP/4053 weiterleitet; UDP/8053 ist ein Kompatibilitäts-Listener, der nur aktiviert ist, wenn er ausdrücklich zugeordnet wird. Diese Listener erwarten das Proxy-Protocol-Framing des Produktions-Ingress; nur einen UDP-Port zu öffnen, reicht nicht. Bewahre jedes Paar aus Zertifikat und Schlüssel im selben Ressourcen- bzw. Versionsverzeichnis auf.

Die vollständige API und der Worker unterstützen außerdem Produktfunktionen wie OAuth, E-Mail, Abonnements und Extender. Stelle ihre Ressourcen bereit, wenn du diese Funktionen anbietest; das Binary erzeugt keine Zugangsdaten für Integrationen. OAuth verwendet `auth.yml` mit einem eigenen Issuer und **separaten** OAuth-Signaturschlüsseln, die mit den OAuth-Werkzeugen von Warp erzeugt und rotiert werden. Siehe die [IDP-Konfiguration des Servers](https://github.com/urnetwork/server/blob/main/IDP.md). Verwende den JWT-Schlüssel nicht als OAuth-Signer.

### Den Verifizierungsendpunkt konfigurieren

Die Route `/verify` braucht keinen separaten Dienst: Sie ist Teil der API, und ihre Statistiken, Nachweise und Schlüssel sind öffentliche Routen auf demselben Host:

| Route | Zweck |
| --- | --- |
| `POST /verify` | das Trail-Protokoll (SEED, EXTEND, FINAL), authentifiziert durch die eigenen Ed25519-Signaturen des Protokolls, nicht durch ein JWT |
| `GET /verify/keys` | die Signaturschlüssel des Servers, aktuelle und historische |
| `GET /verify/stats` | vom Betreiber beobachtete Aggregate für Prüfung und Rekonstruktion (Validatoren bewerten nicht auf ihrer Grundlage) |
| `GET /verify/proofs` | jeder signierte, nicht vergiftete Trail, ob abgeschlossen oder abgelaufen |
| `GET /key/<client_id>` | der öffentliche Ed25519-Schlüssel eines Clients, ohne Authentifizierung |
| `POST /sn/wallet`, `GET /sn/wallet` | der Claim-Coldkey eines Miners |
| `GET /sn/pool/claim` | der Merkle-Nachweis eines Miners für eine Epoche |
| `GET /sn/epoch` | die gespiegelte Vertragsuhr (`epoch`, `start_block`, `commit_deadline_block`, `finalize_block`, `t_epoch_blocks`, `chain_id`, `contract_address`, `settlement_vault_address`, `no_id`, `netuid`, `rpc_url`) |
| `GET /sn/artifact`, `GET /sn/artifacts` | signierte Auszahlungsartefakte nach Content-Hash und Verlauf |
| `POST /sn/attempt-artifact`, `GET /sn/evidence`, `GET /sn/evidence/history` | Evidenz-Uploads der Validatoren und der veröffentlichte Evidenzindex |

Lege die Vault-Ressource `verify.yml` an (neben `jwt.yml`):

```yaml
keys:
  - server_key_id: 0
    seed: <base64 standard encoding of a 32-byte Ed25519 seed>
```

`server_key_id` ist ein Byte (0 bis 255), das in jeder ASSIGN- und FINAL-Nachricht mitgeführt wird; zum Rotieren fügst du einen neuen ersten Eintrag hinzu und behältst die alten. Die Verifizierung braucht mindestens einen Schlüssel; prüfe nach dem Start `GET /verify/keys`.

Der `/verify`-Server erzwingt die Invariante, auf die sich Validatoren verlassen: Jeder berechtigte Miner ist genau einer Exit-IP zugeordnet und jede Exit-IP genau einem Miner; ein Miner, der hinter zwei Exits gesehen wird, fällt aus dem Index der berechtigten Miner, bis er wieder hinter einem einzigen steht. Seeds, deren Quelladresse sich keinem Miner zuordnen lässt oder die die weichen Limits überschreiten, werden vergiftet (bis zur vollen Tiefe durchlaufen, aber nie veröffentlicht), damit der Endpunkt nicht als Orakel dafür dienen kann, welche Adressen Miner sind; nur die harten Limits pro Quelle in der Richtlinie (`hard_seed_per_minute_per_source`, `hard_extend_per_minute_per_source`, `hard_active_trails_per_source`) lehnen Anfragen direkt ab.

## Schritt 5: die Epochen-Pipeline konfigurieren

Die Subtensor-Pipeline wird durch `vault/main/st.yml` konfiguriert. Ohne eine gültige, aktivierte Ressource können API und Taskworker mit deaktiviertem Subnet-Subsystem laufen, daher belegt ein HTTP-Health-Check allein nicht, dass Miner verdienen oder beanspruchen können. Wähle das Mainnet mit `URNETWORK_ST_PROFILE=mainnet` in der Umgebung und `profile: mainnet` in der Datei. Das Testnet hat einen eigenen Namensraum `testnet-...`; er wird weder durch `WARP_ENV` noch allein durch Ändern von `profile` ausgewählt. Die Felder, aus [`server/controller/st_controller.go`](https://github.com/urnetwork/server/blob/main/controller/st_controller.go):

```yaml
profile: mainnet
enabled: true
# keep the unsigned POST /sn/wallet path closed; apps sign the challenge
wallet_allow_unsigned: false
public_rpc_url: https://<public evm json-rpc>   # published to clients via GET /sn/epoch
rpc_urls: [https://<evm json-rpc>]        # or `authority`, resolved by server/st
chain_id: 964
genesis_hash: "0x<native genesis hash>"
deployment_id: ur-mainnet
policy_hash: "0x<sha256 of the signed policy>"
launch_readiness_sha256: "<reviewed readiness receipt digest from sn.yml>"
coordinator_address: "0x<coordinator>"
settlement_vault_address: "0x<settlement vault>"
reserve_sink_address: "0x<reserve sink>"
netuid: 25
no_id: <your operator id>
treasury_hotkey: "0x<32-byte hotkey>"
deposit_hotkey: "0x<32-byte hotkey>"
deposit_key: "<hex secp256k1 key>"        # deposit signer
root_key: "<hex secp256k1 key>"           # root signer: close, commit root, finalize
artifact_key: "<hex secp256k1 key>"       # payout artifact signer
deposit_tiers:                            # the signed policy's tier schedule, verbatim
  - min_conviction_rao: 0
    rate_numerator_rao_per_gib: <rate>    # rao per GiB of usage
    # rao per distinct user (omit or 0 when the policy prices bytes only)
    rate_numerator_rao_per_user: <rate>
    rate_denominator: 1
# the policy's zero_rate_action; equal_demand only while every rate is 0
deposit_zero_rate_action: halt
deposit_epoch_cap_rao: <cap>              # custody blast-radius cap per epoch
reliability_a_min: 8                      # the policy's reliability_a_min
block_seconds: 12
deploy_block: <coordinator deployment block>
```

Ein aktivierter Betreiber braucht **drei verschiedene** Schlüssel für Einlage, Root und Artefakt. Sie müssen zur zugelassenen Betreiberidentität passen. Eine fehlende oder fehlerhafte `st.yml` wird als deaktiviertes Subsystem protokolliert; prüfe diesen Zustand nach dem Start ausdrücklich. `attempt_upload` und `reserved_attempt_upload` begrenzen die Evidenz-Uploads der Validatoren; `ops_key` und `contract_address` sind Altfelder und sollten für eine neue Bereitstellung nicht verwendet werden.

Die Aktivierung im Mainnet erfordert außerdem die geprüfte Verdienstdeklaration `config/main/sn.yml`, einschließlich der gewählten Chain bzw. Genesis, des Koordinators, des Settlement-Tresors, der Richtlinie und des Bereitschaftsbelegs. Installiere sie vor dem ersten `db migrate` in Schritt 6, das daraus die dauerhafte Verdienstgrenze dieser Datenbank festlegt, und stelle sicher, dass ihr Bereitschafts-Digest mit `launch_readiness_sha256` in `st.yml` übereinstimmt. Diese bereitstellungsspezifischen Werte erhältst du über die Zulassung als Betreiber; bewahre die geprüften Bytes auf. Der Server hält Nutzung nach dem Stichzeitpunkt getrennt von Altverpflichtungen und verweigert das Mainnet-Settlement, wenn die Aktivierung blockiert ist oder die Identitäten abweichen.

Damit überhaupt ein Veröffentlichen auf der EVM im Mainnet gelingen kann, installiere die unabhängig signierte `operator_gas_policy` in `st.yml` und die dazu passende `config/main/operator-gas-authority.yml`. Die Genehmigung bindet den Betreiber, die Einlagen- und Root-Konten, die Revision der Richtlinie, das Gültigkeitsfenster, die Pins der Transaktionshistorie und die Gas- und Versuchslimits. Die [Implementierung der Gas-Richtlinie](https://github.com/urnetwork/server/blob/main/st_operator_gas_policy.go) definiert ihr Schema. Einen Signer mit Guthaben auszustatten ersetzt diese Genehmigung nicht, und der private Schlüssel des Genehmigenden gehört nicht auf diesen Host.

Die Einlagenstufen müssen der Stufenplan der signierten Richtlinie sein: Validatoren berechnen deine erforderliche Einlage mit derselben Formel neu und setzen deinen Pool auf null, wenn die beobachtete Einlage abweicht (siehe unten).

## Schritt 6: migrieren, initialisieren und starten

Installiere die Probe-Ressourcen aus Schritt 7, bevor du den Worker startest. Verwende für alle drei Befehle unten dasselbe Binary und dieselbe Umgebung. `db migrate` nimmt keine Optionen. Es wendet den vollständigen PostgreSQL-Migrationskatalog des Servers an; die PostgreSQL-Rolle und die Datenbank legt es nicht an. Danach prüft es die Verdienstgrenze der Provider: eine unveränderliche Datenbankzeile mit dem Verdienst-Stichzeitpunkt und der Mainnet-Chain-Identität aus `sn.yml`, die entscheidet, welche abgeschlossene Nutzung auf SN25 verdient und welche als Alt-Vergütung in USDC abgerechnet wird. Auf einer frischen Datenbank bereitet das erste `db migrate` die Grenze aus der installierten `sn.yml` vor und gibt `Prepared provider earning boundary:` mit dem Stichzeitpunkt, den Digests der Identität und der ursprünglichen `sn.yml` sowie dem Zeitpunkt der Vorbereitung aus. Jeder spätere Lauf lässt die Grenze unverändert, ohne `sn.yml` zu lesen, und gibt `Retained provider earning boundary:` mit denselben Werten aus, sodass eine bearbeitete `sn.yml` die Grenze nie ändert und keine Migration scheitern lässt; Worker halten neue Verdienstzuteilungen und Auszahlungseinreichungen zurück, solange eine bearbeitete Verdienstidentität von ihr abweicht. Fehlt `sn.yml` oder ist sie ungültig, bevor die Grenze existiert, meldet der Befehl diesen Fehler, nachdem er die Migrationen angewendet hat; korrigiere die Datei und führe ihn erneut aus. Das Vorbereiten der Grenze aktiviert das Mainnet nicht.

**Prüfe `sn.yml` vor dem ersten `db migrate` auf einer frischen Datenbank.** Dieser Lauf legt die dauerhafte Verdienstgrenze ohne Digest-Prüfung aus der installierten Datei fest, und die Grenze lässt sich danach nie mehr ändern. Jedes andere Verdienstfeld muss seinem veröffentlichten Wert entsprechen (Schema, Attributions- und Alt-Richtlinie, Profil `mainnet`, Chain 964, netuid 25), daher sind `cutoff_utc` und `genesis_hash` die Werte, die vor diesem ersten Lauf stimmen müssen.

Öffne eine Shell als Dienstbenutzer und lade dann die Umgebung:

```bash
sudo -u urnetwork bash
set -a
. /etc/urnetwork/operator.env
set +a

ur-operator db migrate
ur-operator init-tasks
ur-operator run --require-subnet
```

Schließe jeden Befehl erfolgreich ab, bevor du den nächsten ausführst. `init-tasks` initialisiert wiederkehrende Produktions-Tasks; der normale Start stellt außerdem sicher, dass ihre idempotenten Zeitpläne existieren. Ein gewöhnliches `run` wendet nie Datenbankmigrationen an. `--require-subnet` macht eine fehlende, ungültige oder deaktivierte `st.yml` zu einem Startfehler, statt stillschweigend ein Netzwerk ohne seine Subnet-Pipeline zu starten. Der laufende Worker führt Wartung, Probes, Verifizierung und SN-Epochen-Tasks aus, dazu konfigurierte Retail- bzw. Produktarbeit.

Die Standard-Listener sind API 8080, Connect 8081 und Worker-Status 8082, mit acht Workern und einer Batch-Größe von vier. Die zugehörigen Optionen sind `--api-port`, `--connect-port`, `--taskworker-port`, `--worker-count` und `--worker-batch-size`. Wenn du Ports änderst, passe `WARP_PORTS` und den Reverse Proxy gemeinsam an.

Für optionale Connect-Diagnosen aktiviert `--memory-owner-ledger` die Buchführung nach Transfer-Eigentümern. `--private-heap-profile-target` akzeptiert `config` (Standard), `disabled` oder einen exakten `host/block`-Bereich.

Wenn du als Betreiber Extender verwendest, konfiguriere `vault/main/extender.yml` mit den Root- und Issuer-Schlüsseln der Bereitstellung und der Gossip-Identität, füge `8083:8083` zu `WARP_PORTS` hinzu, leite `wss://gossip.example.net` an seinen Listener weiter und füge `--gossip-port=8083` hinzu. Ein nicht leerer `gossip_identity_key_hex` erfordert diesen Listener: Wer Gossip ankündigt, ohne ihn zu betreiben, lässt eingereihte Extender-Veröffentlichungen unverarbeitet liegen. Siehe die [Spezifikation für die Extender-Bereitstellung](https://github.com/urnetwork/connect/blob/main/EXTENDER.md). Alt- und Proxy-Bereitstellungen verwenden weiterhin ihre eigenen Frontends; für den Betrieb des hier beschriebenen API-/Connect-Betreibers werden sie nicht gebraucht.

Sobald der Start im Vordergrund fehlerfrei läuft, beende ihn mit Ctrl-C und verlasse die Shell des Dienstbenutzers. Installiere `/etc/systemd/system/ur-operator.service`:

```ini
[Unit]
Description=URnetwork operator
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target
RequiresMountsFor=/srv/urnetwork-data

[Service]
Type=simple
User=urnetwork
Group=urnetwork
WorkingDirectory=/srv/warp
EnvironmentFile=/etc/urnetwork/operator.env
ExecStart=/usr/local/bin/ur-operator run --require-subnet
Restart=on-failure
RestartSec=5
TimeoutStopSec=180
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Passe die Unit-Namen der unterstützenden Dienste an deine Distribution an und füge das Gossip-Argument hinzu, falls konfiguriert. Starte den Dienst:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ur-operator
sudo journalctl -u ur-operator -f
```

Prüfe das Bereitschafts-JSON **jedes** Dienstes. HTTP 200 allein reicht nicht; jeder `status` muss `ok` sein:

```bash
for port in 8080 8081 8082; do
  curl --fail --silent --show-error "http://127.0.0.1:$port/status" \
    | jq -e '.status == "ok"' || break
done
curl --fail --silent --show-error https://api.example.net/verify/keys
curl --fail --silent --show-error https://api.example.net/sn/epoch
```

Vergewissere dich, dass die öffentliche Epochen-Antwort deine erwartete Chain, deinen Vertrag, deinen Settlement-Tresor und deine `no_id` nennt und dass der Worker seinen Chain-Spiegel voranbringt. Die Bereitschaftsprüfung kontrolliert Redis und den Migrationsstand von PostgreSQL, bevor die Dienste aktiv werden; sie beweist weder eine abgeschlossene Zulassung als Betreiber noch ein finanziertes und genehmigtes Veröffentlichen noch einen verfügbaren Claim. Meldet eine Prüfung `error not ready`, behebe die Ursache und starte neu: Die Bereitschaft wird beim Start festgeschrieben. Sichere bei Upgrades die Datenbank und die Artefakte, stelle die geprüften Ressourcen bereit, wende die Migrationen ausdrücklich an, starte dann das Binary neu und prüfe erneut alle Listener.

Gossip hat, wenn aktiviert, keinen `/status`-Endpunkt. Prüfe seinen Listener und seine Start-Logs separat: `[gossip]not ready` bedeutet, dass der Drainer seiner Veröffentlichungs-Warteschlange nicht gestartet ist, selbst wenn das Mesh Nachrichten empfangen kann. Behebe den Fehler des unterstützenden Dienstes und starte neu, bevor du das Veröffentlichen über Gossip als bereit betrachtest.

## Schritt 7: den Prober betreiben

Miner werden über Tunnel, die an den jeweiligen Miner gebunden sind, verortet und auf ihren Zustand geprüft, nie aus dem eigenen Netzwerk des Betreiber-Hosts. Der Produktions-Worker des einzelnen Binarys betreibt dauerhafte Probe-Shards; konfiguriere `config/main/provider_egress_probe.yml` mit deinen eigenen Endpunkten:

```yaml
enabled: true
shard_count: 4
api_url: https://api.example.net
platform_url: wss://connect.example.net
public_api_url: https://api.example.net
url_probe:
  limit: 8
  concurrency: 8
  probe_timeout_seconds: 60
```

Lege `vault/main/provider_egress.yml` mit `ingest_secret: "<a separate random ingest secret>"` an. Jeder aktive Probe-Shard erzeugt bei der Zulassung zur Ausführung seine eigenen Zugangsdaten und sein eigenes Guthaben; der wiederkehrende Task `ProberBootstrap` räumt nach Abstürzen die Konten beendeter Shards auf. Führe `ur-operator init-tasks` erneut aus, nachdem du die Shard-Konfiguration geändert hast. Aktuelle Produktions-Probes verwenden `url_probe`; die älteren Task-Felder `full` und `blackhole` bleiben aus Kompatibilitätsgründen erhalten. Überwache Probe-Ergebnisse und Wiederholungen in der Warteschlange, bevor du Miner zulässt: Eine erreichbare API beweist nicht, dass der Egress der Miner nutzbar ist.

## Schritt 8: deinen Statistik-Feed veröffentlichen und gelistet werden

Das Betreiberverzeichnis von ur.xyz ist das Register, das unter `web/ur.xyz/react/src/lib/network.js` (`NETWORK_OPERATORS`) fest in die Website eingebaut ist: Ein Betreiber trägt sich ein, indem er dort per Pull-Request einen Eintrag mit seinem Namen, seiner Website, seinem App-Namen, den URLs von Dashboard und GitHub, seinen Store-Einträgen und seiner `statsUrl` hinzufügt. Die Website liest die Live-Summen aus jedem gelisteten Feed im Browser des Besuchers, daher muss der Feed öffentliches JSON mit genau einem `Access-Control-Allow-Origin` sein (`*` oder ein gespiegelter Wert, der `https://ur.xyz` einschließt):

```json
{
  "epoch": 1,
  "epoch_start": 1791569340,
  "epoch_end": 1792174140,
  "epoch_start_block": 9247228,
  "epoch_end_block": 9297628,
  "block": 1,
  "users": 125000,
  "data_gib": 812345.5,
  "total_networks": 250000,
  "staked_alpha": 250000.0,
  "demand_deposits_alpha": 1234.5,
  "miner_emissions_alpha": 5678.9,
  "alpha_usd": 1.75,
  "countries": 123,
  "prev_users": 118000,
  "prev_data_gib": 1012345.5,
  "prev_demand_deposits_alpha": 1100.5,
  "prev_miner_emissions_alpha": 5200.1
}
```

`epoch` ist die aktuelle Settlement-Epoche, `epoch_start` und `epoch_end` sind ihre Grenzen in Unix-Sekunden, und `epoch_start_block` und `epoch_end_block` sind ihre Grenzen in Chain-Blöcken: Im Mainnet läuft Epoche n ≥ 1 ab Block 9.247.228 + (n − 1) × 50.400 für 50.400 Blöcke, und eine Grenze, die die Chain noch nicht erreicht hat, wird mit 12 Sekunden pro Block hochgerechnet. Die Akkumulatoren gelten für diese Epoche und `prev_*` für die vorherige (lass sie weg, wenn es keine abgeschlossene Epoche gibt). `block` ist ein veralteter Alias, der `epoch` entspricht. Die Website liest einen Feed ohne `epoch` als die ältere Form, deren Zeitfenster keine Settlement-Epochen waren: Sie führt dann ihre eigene Epochenuhr und zeigt keine der fensterbezogenen Zahlen dieses Feeds. `alpha_usd` ist der α-Preis, den du beobachtest (die Website bildet den Mittelwert über die Betreiber), und `countries` dient nur der Information. Fehlende Felder werden als null geparst, nie als 0.

## Was der Server in jeder Epoche tut

Sobald `st.yml` vorhanden ist, betreibt der Taskworker die Pipeline selbstständig; nichts davon braucht einen Betreiber an der Tastatur:

1. **`StSyncChain`** (alle 5 s) spiegelt die Epochenuhr des Vertrags in `st_epoch` und Redis (ausgeliefert unter `GET /sn/epoch`), bringt den Spiegel der finalisierten Ereignisse voran, holt jede Epoche nach, die der Worker verschlafen hat, und plant die unten aufgeführten Tasks pro Epoche zu Zeitpunkten, die aus Blöcken abgeleitet sind. Die Vertragsuhr ist maßgeblich; jede Frist wird vor einem Senden erneut in Blöcken geprüft.
2. **`StEpochClose(e)`** berechnet die Auszahlungsblätter und den Root für eine geschlossene Epoche und schließt deinen Pool auf der Chain (`closeOperatorEpoch`, Root-Signer), wobei er die realisierte Emission des Pools im Tresor erfasst. Jeder berechtigte Miner (`usage_bytes > 0`, mindestens `reliability_a_min` zugewiesene Hops, mindestens eine Bestätigung, eine Wallet und keine Bindung an eine Flotte der Spitzenstufe) erhält `weight = usage_bytes × confirmations / max(assignments, reliability_a_min)`, pro Coldkey zusammengefasst und nach der Methode des größten Überrests auf genau 10.000 Basispunkte verteilt. Die Liste wird als signiertes, inhaltsadressiertes Auszahlungsartefakt geschrieben.
3. **`StCommitRoot(e)`** legt den Root und den Hash des Artefakts innerhalb des Root-Commit-Fensters fest (`commitOperatorRoot`, Root-Signer), versucht es alle 5 Minuten erneut und warnt zwei Stunden vor der Frist.
4. **`StDeposit(e)`** bemisst und sendet die Einlage der Epoche (`deposit`, Einlagen-Signer): Er liest das signierte Auszahlungsartefakt der vorherigen Epoche, übernimmt dessen `total_usage_bytes` und `total_users` (die verschiedenen Top-Level-Nutzer mit Vertragsnutzung in der Epoche, dieselbe Zahl wie `users` in deinem Statistik-Feed), liest deine Conviction vor dieser Epoche, wählt die Stufe und berechnet `floor(usage_bytes × rate_numerator_rao_per_gib / (GiB × rate_denominator) + users × rate_numerator_rao_per_user / rate_denominator)`, gedeckelt auf `deposit_epoch_cap_rao`. Epoche 0 zahlt nichts ein; eine Einlage der Größe null wird übersprungen; eine Einlage, die für die Epoche bereits auf der Chain ist, wird übersprungen. Solange jeder konfigurierte Tarif 0 ist (`deposit_zero_rate_action: equal_demand`, die Anfangsphase), verzeichnet der Task ein übersprungenes Veröffentlichen, sendet keine Transaktion, reserviert keine Nonce und löst keine Warnung aus; `bringyourctl st status` zeigt die Bemessung (Bytes, Nutzer, Stufe, erforderliche Einlage oder dass der Preis null ist). Das bereitgestellte α wird auf den Reserve-Hotkey verschoben und in die unveränderliche Reserve-Senke überwiesen: Einlagen sind Conviction-Stake und werden nie zurückgegeben.
5. **`StFinalizePoke(e)`** ruft am Finalisierungsblock oder danach das erlaubnisfreie `finalizeOperatorEpoch` auf und legt damit den Anspruch fest (erfasste Emission plus Übertrag desselben Betreibers), sodass die Claims öffnen.

Jeder Versuch wird verzeichnet (`AddStPublish`/`UpdateStPublish`), und das Veröffentlichen gleicht aufbewahrte Transaktionen über Neustarts hinweg mit dem Zustand der Chain ab. Der Normalbetrieb verwendet das einzelne Binary `ur-operator`. Für optionale manuelle Diagnose und Wiederherstellung baust du den separaten Administrations-Client aus demselben Server-Checkout und installierst ihn auf dem Betreiber-Host:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/bringyourctl ./bringyourctl
sudo install -o root -g root -m 0755 build/bringyourctl /usr/local/bin/bringyourctl
```

Führe ihn als Dienstbenutzer mit derselben geladenen `/etc/urnetwork/operator.env` aus. Das sind administrative Unterbefehle von `bringyourctl`, keine zusätzlichen Unterbefehle von `ur-operator`:

```text
bringyourctl st status [--epoch=<epoch>]
bringyourctl st deposit [--alpha_rao=<alpha_rao>]
bringyourctl st commit --epoch=<epoch>
bringyourctl st finalize --epoch=<epoch>
```

Eine manuelle Einlage mit `--alpha_rao` ist weiterhin durch `deposit_epoch_cap_rao` begrenzt. Freiwillige Conviction (`addConviction`, derselbe Einbahnweg, der deine Stufe anhebt, ohne als Nachfrage zu zählen) hat keinen Server-Task; sie ist eine Transaktion von deinem Einlagen-Signer.

## Wie du gemessen und bezahlt wirst

Die Pool-Emission eines Betreibers gehört seinen Minern, und der Settlement-Tresor zahlt den realisierten, erfassten Betrag gemäß dem Root des Betreibers aus. Provider werden mit **Momentum** bezahlt: dem Anteil der nativen Miner-Zuteilung, der jetzt eingesetzt wird, um das Netzwerk zu betreiben, aufgeteilt zwischen den Pools der Betreiber und den Flotten der Spitzenstufe. Momentum beträgt zum Start 10 %. Die [Network Capacity Reserve](/reserve), das 2-von-3-Multisig `ur-reserve`, erhält den Rest: Miner-Emission × (1 − Momentum). Ihr Anteil ist nicht fest; sie erhält weniger, wenn Momentum wächst. Das sind Routing-Ziele, die dem nativen Konsens und dem Verhalten der Runtime unterliegen, keine garantierten festen Auszahlungen. Die native Reserve ist von der unveränderlichen Einlagen-Senke und den Claim-Guthaben des Settlement-Tresors getrennt. Siehe die [Zuteilung der nativen Reserve](https://github.com/urfoundation/sn/blob/main/mainnet/TREASURY-EMISSIONS.md). Deine Einnahmen als Betreiber stammen aus deinem eigenen Geschäft; das Subnet bezahlt Miner dafür, diesen Verkehr zu tragen.

- **Pool-Gewicht.** In jedem Tempo gewichtet jeder Validator deinen Pool mit `implied_demand × Q`: `implied_demand = bytes × rate0_gib / GiB + users × rate0_user`, also deine geprüften `total_usage_bytes` und `total_users`, bepreist zum Tarif der Conviction-Stufe null. Deine eigene Stufe ist die höchste, deren `min_conviction_rao` dein kumuliert gesperrtes α (Einlagen plus freiwillige Conviction) erreicht, daher hinterlegt ein engagierter Betreiber unterhalb der Obergrenze pro Epoche für dasselbe Gewicht weniger α: Der Rabatt ändert, was du zahlst, nicht dein Gewicht. Wenn die Epochen-Obergrenze kürzt, was du schuldest, kürzt sie deine Nachfrage um denselben Faktor, sodass an der Obergrenze ein niedrigerer Stufentarif dein Gewicht erhöht. `Q` ist die expositionsgewichtete Qualität deiner Pool-Miner, gemessen an den eigenen Trails dieses Validators und begrenzt durch die `quality_transform` der Richtlinie. Das native Yuma berechnet den Konsens aus den Gewichtszeilen der Validatoren nach den Maskierungs-, Clipping- und Normalisierungsregeln der aktiven Runtime. Solange der veröffentlichte Preis null ist, ist die implizierte Nachfrage jedes Pools genau 1 (siehe [Anfangsphase](#initial-period)).
- **Die Einlagenprüfung.** Validatoren vertrauen deiner Bemessung der Einlage nicht. Mit `usage_lag_epochs: 1` und `tier_snapshot: conviction_before_epoch` liest jeder Validator deinen festgelegten Root für die vorherige Epoche, holt das signierte Artefakt von deiner API, prüft dessen Content-Hash, Signer, finalisierte Grenzen und Root, berechnet die erforderliche Einlage aus `total_usage_bytes` und `total_users` neu und verlangt, dass die beobachtete Einlage ihr genau entspricht. `mismatch_action: zero_pool_weight`; ein Root oder Artefakt, das nach dem Root-Commit-Fenster noch nicht verfügbar ist, ergibt `zero_pool_weight_after_root_window`; die Bootstrap-Epoche muss eine Einlage von null tragen. Einlagen werden durch die Richtlinie außerdem pro Betreiber und Epoche gedeckelt. Unter einer Richtlinie mit Preis null wird überhaupt keine Einlage geprüft: Die Prüfung wird als `zero_price_no_deposit_required` verzeichnet, und dein Pool ist berechtigt, unabhängig davon, was du freiwillig eingezahlt hast.
- **Flotten der Spitzenstufe.** Miner, die sich an eine Top-Level-Flotte binden, steigen aus deiner Auszahlungsliste auf, solange die Bindung aktiv ist (`head_fleet_active`), und verdienen nativ auf dem Hotkey ihrer Flotte; ab der Epoche, nachdem die Bindung veraltet ist, fallen sie in deinen Pool zurück.
- **Settlement.** Eine Settlement-Epoche umfasst 50.400 Blöcke (etwa 7 Tage), gerechnet ab Epoche 1 (Epoche 0 des Mainnets hatte 7.200 Blöcke); die Referenzfenster im Mainnet sind ein Root-Commit-Fenster von 1.200 Blöcken (+4 h), die Finalisierung bei 14.400 Blöcken (+48 h) und ein Claim-Horizont von 8 Epochen plus 1 Kulanzepoche, alle durch die signierte Richtlinie festgelegt. Nicht beanspruchte und nicht zugeteilte Reste sowie die erfasste Emission eines verpassten Roots werden in deine eigene nächste Epoche übertragen (`carry_same_operator`); zwischen Betreibern wird nichts verschoben. Claims sind erlaubnisfrei, keine Vertragspause hält sie auf, und ein finalisierter Anspruch kann durch kein Upgrade und keine Handlung des Eigentümers umgeschrieben werden; nur der Schalter auf Chain-Ebene, der Stake-Transfers auf SN25 deaktiviert, kann sie einfrieren, und er kann keinen davon wegnehmen oder umleiten. Ab der Umstellungsepoche von Settlement v2 wird dein Pool stattdessen über vault2 abgerechnet: Die Anteile deiner Miner folgen allein der verifizierten Nutzung und laufen auf Konten auf, die nie verfallen, und jeder Root zahlt erst aus, nachdem der Validator ihn genehmigt hat und ein Einspruchsfenster von 14.400 Blöcken verstrichen ist.

## Was schiefgehen kann

- **Ein verpasster Root.** Wird der Root nicht innerhalb des Fensters festgelegt, wird die Epoche trotzdem finalisiert, die erfasste Emission wird in deine nächste Epoche übertragen, und Validatoren setzen dein Pool-Gewicht vom Ende des Fensters an auf null, bis eine Prüfung bestanden ist. Achte auf die T-2h-Warnung.
- **Eine Einlage, die nicht übereinstimmt.** Jede Abweichung zwischen deiner Einlage und der Neuberechnung der Validatoren (eine andere Stufentabelle in `st.yml`, ein manuelles Überschreiben mit `--alpha_rao`, eine Obergrenze, die den Betrag gekürzt hat) setzt den Pool für die Epoche auf null. Halte `deposit_tiers` und `deposit_epoch_cap_rao` deckungsgleich mit der signierten Richtlinie.
- **Eine Einlage unter der Transfer-Untergrenze der Runtime.** Der Server prüft jede Einlage vorab gegen das unveränderliche `minimumTransferTaoRao` des Tresors zum aktuellen α-Preis und lehnt (ohne eine Nonce zu reservieren) einen nutzungsbasierten Betrag ab, dessen Verschiebung in die Reserve weniger wert ist als die Untergrenze; das Ergebnis wird für diese Epoche als fehlgeschlagen verzeichnet und nicht erneut versucht.
- **Zu wenige Betreiber.** Die signierte Richtlinie legt die Mindestzahl gesunder Betreiber und aktiver Validatoren fest (je einen in der SN25-Richtlinie, je zwei in der Testnet-Richtlinie); darunter stellen Validatoren das Steuern ein.
- **Miner ohne Wallet oder Exposition.** Miner ohne Claim-Wallet oder mit weniger als `reliability_a_min` zugewiesenen Hops erhalten kein Blatt, und einem Miner, der hinter mehr als einer Exit-Adresse gesehen wird, werden überhaupt keine Hops zugewiesen, bis er wieder hinter einer einzigen steht. Der unsignierte Pfad `POST /sn/wallet` bleibt geschlossen, solange du nicht `wallet_allow_unsigned: true` setzt; die Apps signieren die Wallet-Challenge.
- **Ein Artefakt, das deine Validatoren nicht abrufen können.** Validatoren rufen Artefakte per Content-Hash von deiner API ab. Halte den Blob-Speicher und die `/sn/artifact`-Routen erreichbar; Äquivokation (zwei Artefakte für eine Epoche) ist ein Fehlschlag der Prüfung.

## Anfangsphase

Zum Start steht in der veröffentlichten [Preistabelle](/price) **0 α pro GiB und 0 α pro Nutzer**, und die signierte Mainnet-Richtlinie führt diesen Nullpreis ausdrücklich: Der Tarif pro GiB und pro Nutzer ist in jeder Stufe 0, und `zero_rate_action: equal_demand` ist gesetzt. Solange der Preis null ist, leisten Betreiber keine Nachfrage-Einlagen: Keine ist erforderlich, und keine wird geprüft. Übernimm denselben Stufenplan mit `deposit_zero_rate_action: equal_demand` in `st.yml` (ohne diese Einstellung lehnt der Server eine Stufentabelle ab, die nur aus Nullen besteht, sodass ein Nullpreis nie versehentlich entstehen kann); `StDeposit` schuldet dann nichts, sendet keine Transaktion und löst keine Warnung aus, und `bringyourctl st status` meldet, dass der Preis null ist. Validatoren geben jedem registrierten Betreiber-Pool dieselbe implizierte Nachfrage (genau 1), sodass der Pool-Kanal allein nach ihrer gemessenen Qualität aufgeteilt wird; eine freiwillige Einlage oder Conviction-Sperre (`addConviction` bleibt verfügbar und hebt deine Stufe weiterhin für später an) hilft deinem Pool weder, noch schadet sie ihm. Der Kanal der Spitzenstufe, die `theta`-Aufteilung, die Qualitätsbegrenzung und die Abtretungsregel bleiben unverändert, und deine Epochen-Pipeline läuft ansonsten genau wie oben beschrieben: Das Auszahlungsartefakt (das jetzt auch `total_users` enthält) und die Festlegung des Roots sind weiterhin nötig, damit deine Miner beanspruchen können. Die Zulassung von Betreibern liegt zum Start beim Eigentümer, daher wird ein neuer Betreiber nach einer Überprüfung vom Subnet-Eigentümer auf dem Koordinator registriert. Das ist ein bewusster Startmodus, während Fehler aus dem Netzwerk ausgeräumt werden; achte im RSS-Feed der Preistabelle auf die Änderung, mit der das Einsammeln von Einlagen beginnt.
