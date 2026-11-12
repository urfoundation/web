---
description: Запустите оператора URnetwork одним бинарником, настройте ресурсы PostgreSQL, Redis и Warp для среды main и обслуживайте конвейер вознаграждений SN25.
---

# Как стать сетевым оператором

Сетевой оператор запускает серверы сети конфиденциальности UR: службы API и connect, к которым подключаются пользователи и майнеры, конечную точку `/verify`, которую проходят валидаторы, и конвейер эпох, который проводит расчёты по вознаграждениям его майнеров в **Bittensor SN25 (netuid 25)**. Оператор приводит собственных пользователей и продукты (приложения ur.io — это приложения одного из операторов), вносит депозиты в α как подкреплённый выручкой сигнал реального спроса и в каждую расчётную эпоху фиксирует Merkle-список выплат, который делит его пул между его майнерами. Он сообщает об использовании, по которому идёт это деление, но никогда не хранит чужой α: пулом владеет неизменяемое расчётное хранилище, и каждый майнер забирает свою долю из него напрямую.

Точка входа [`server/cli/all/main.go`](https://github.com/urnetwork/server/blob/main/cli/all/main.go) запускает вместе API, Connect и продакшн-taskworker. Вы развёртываете один исполняемый файл оператора; PostgreSQL, Redis, хранилище артефактов и публичный входной шлюз с TLS остаются вспомогательными службами. О механизме читайте в [Litepaper](/docs/litepaper); о других ролях — на страницах [Как запустить майнер](/docs/miner) и [Как запустить валидатор](/docs/validator).

## Для кого это

Для команд, которые хотят запустить своё сетевое пространство: развёртывание серверного стека с открытым исходным кодом со своим доменом, пользователями, приложениями или интеграциями и сообществом майнеров. На этапе запуска допуск операторов контролирует владелец подсети (см. [Начальный период](#initial-period)), поэтому первый шаг — разговор с владельцем подсети.

## Что вам понадобится

- **Хост с Linux и ваш домен.** Единый бинарник обслуживает API (`api.<your domain>`), Connect (`connect.<your domain>`) и полный продакшн-taskworker. PostgreSQL хранит аккаунты, использование, расчёты и долговечную очередь задач; Redis обеспечивает общую координацию и кэши; локальное долговечное хранилище артефактов содержит артефакты выплат и свидетельств. Настройте интеграции, которые предлагает ваш оператор, включая gossip экстендеров, если вы используете экстендеры. Необязательные фронтенды Alt и Proxy — это отдельные роли сервера.
- **Допуск в координаторе.** Операторов регистрирует владелец подсети вызовом `registerOperator(noId, coldkey, poolHotkey, depositHotkey, depositSigner, rootSigner, effectiveEpoch, maximumBurnRao)`, доступным только владельцу; этот вызов также поручает расчётному хранилищу зарегистрировать UID вашего пула под собственным coldkey хранилища (сжигание при регистрации оплачивается из суммы, переданной с вызовом, в пределах `maximumBurnRao`, а несожжённый остаток возвращается). Последующие изменения ролей планируются с отложенным вступлением в силу через `scheduleOperator`. Вы предоставляете идентичности; владелец регистрирует их и выдаёт вам ваш `no_id`.
- **Ключи и hotkey.** Coldkey оператора (ss58, префикс 42); **hotkey пула**, который расчётное хранилище регистрирует как UID вашего пула; **hotkey депозитов**, уникальный для вас, на котором подготавливаются депозиты; и три EVM-подписанта, которые хранит сервер (secp256k1 в шестнадцатеричной кодировке): **подписант депозитов** (`deposit_key`, вызывает `deposit`), **подписант корней** (`root_key`, закрывает эпохи, фиксирует корни выплат и выполняет финализацию) и **подписант артефактов** (`artifact_key`, подписывает артефакты выплат; валидаторы закрепляют его как ваш `artifact_signer`). Подписантам нужен TAO в Subtensor EVM для оплаты газа; hotkey депозитов нужен α для внесения депозитов (в начальный период — не нужен).
- **Серверные ключи `/verify`.** Один или несколько ключей Ed25519 в ресурсе vault `verify.yml`; первый подписывает новые проходы, а все публикуются по `GET /verify/keys`, чтобы исторические доказательства проверялись и после ротаций.
- **Зонды исходящего трафика.** Taskworker бинарника запускает долговечные шарды зондов, настроенные в `config/main/provider_egress_probe.yml`, которые измеряют, что на самом деле передаёт выходной узел каждого майнера.
- **Публичный фид статистики** (`stats.json`), чтобы каталог операторов ur.xyz мог включить вас в список.

## Шаг 1: соберите единый бинарник оператора

Используйте текущий исходный код [`urnetwork/server`](https://github.com/urnetwork/server), а также версию Go и **точные ревизии соседних репозиториев** из его [lock-файла исходников](https://github.com/urnetwork/server/blob/main/local/source-graph/lock.yml). Текущий lock-файл использует Go 1.27.3. Соседние рабочие копии — `connect`, `glog`, `sdk`, `proxy`, `goidenticons`, `userwireguard`, `warp`, `sn` и `gvisor`; `sn` берётся из `urfoundation/sn`, остальные — из `urnetwork`. Держите их рядом с `server`: `go.mod` использует относительные замены. Готовя это дерево исходников, следуйте [каноническим инструкциям по сборке](https://github.com/urnetwork/server#canonical-build-sources) репозитория.

Из рабочей копии `server`:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/ur-operator ./cli/all

./build/ur-operator --help
```

Скопируйте `build/ur-operator` в `/usr/local/bin/ur-operator` на сервере. Храните ревизию исходного кода бинарника вместе с записью о выпуске. Собирайте каждое обновление из ревизий зависимостей, выбранных этой ревизией сервера.

## Шаг 2: создайте структуру Warp для main

Исполняемый файл использует тот же резолвер, что и отдельные службы сервера. `WARP_ENV=main` выбирает **среду развёртывания**; `URNETWORK_ST_PROFILE=mainnet` отдельно выбирает **профиль цепочки**. В этом примере процесс работает от выделенного пользователя Unix `urnetwork`, а публичный HTTPS терминируется обратным прокси на том же хосте.

```bash
sudo useradd --system --home-dir /srv/warp --no-create-home \
  --shell /usr/sbin/nologin urnetwork
sudo install -d -o root -g urnetwork -m 0750 /srv/warp
sudo install -d -o root -g urnetwork -m 0750 \
  /srv/warp/config/main/mmdb /srv/warp/vault/main /srv/warp/site
sudo install -d -o root -g urnetwork -m 0750 /etc/urnetwork
```

Используйте такую структуру. Имена вроде `pg.yml` — это буквальные имена ресурсов; значения `<...>` в примерах ниже нужно заменить.

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

Задайте файлам vault владельца `root:urnetwork` и режим `0640`, а каталогам vault — `0750`; при генерации секретов используйте `umask 077`. Конфигурация и бинарники оператора должны быть доступны служебному пользователю для чтения, но не для записи. PostgreSQL, Redis и объектному хранилищу нужны постоянные данные и резервные копии, не зависящие от этого дерева ресурсов.

Без переопределений корнями служат `$WARP_HOME/{config,vault,site}`, а `WARP_HOME` по умолчанию равен `/srv/warp`. Вместо этого можно задать другие корни в `WARP_CONFIG_HOME`, `WARP_VAULT_HOME` и `WARP_SITE_HOME`. Для каждого ресурса резолвер сначала пробует файлы прямо в корне, затем в `main/`, затем в `all/`; после них он перебирает каталоги версий в порядке убывания семантической версии. Поэтому файл на уровне корня переопределяет копию для среды. Контейнер Warp может монтировать уже выбранную среду прямо в корень. Придерживайтесь одной структуры и не оставляйте устаревших файлов в местах с более высоким приоритетом.

Запишите `/etc/urnetwork/operator.env` как простые присваивания `NAME=value`, без `export`, чтобы его могли прочитать и оболочка, и systemd:

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

Замените домен, хост, версию бинарника и версию конфигурации своими. `WARP_PORTS` задаётся в виде `service-port:host-port` и включает **5080** — первый внутренний порт обмена Connect. Три HTTP-порта должны различаться. IP-адрес хоста и явная карта портов также определяют, какие необязательные нативные слушатели Connect будут включены. Выделяя больше портов обмена, добавляйте последовательные внутренние сопоставления `5081:5081`, `5082:5082` и так далее.

В этом развёртывании на одном хосте через loopback `/srv/warp/site/settings.yml` направляет объявленный хост обратно на его внутренний слушатель:

```yaml
routes:
  operator-1.example.net: 127.0.0.1
```

`config/main/settings.yml`, если он есть, задаёт общие настройки `all:` и настройки для отдельных хостов, после которых применяются переопределения из `site/settings.yml`. Храните секреты в vault, а не в блоке `env_vars` файла `settings.yml`: при запуске объединённые настройки записываются в журнал. В этом примере в файлах vault указаны буквальные адреса PostgreSQL/Redis/RPC, поэтому `BRINGYOUR_POSTGRES_HOSTNAME`, `BRINGYOUR_REDIS_HOSTNAME` и `BRINGYOUR_SUBTENSOR_HOSTNAME` не нужны. Они нужны, только если ваши ресурсы явно подставляют их через `{{ env:NAME }}`.

## Шаг 3: настройте PostgreSQL, Redis и хранилище артефактов

Установите и запустите PostgreSQL и Redis как отдельные службы; локальная установка из репозитория сервера использует PostgreSQL 18 и Redis 8. На хосте с установленным PostgreSQL создайте собственную базу данных оператора и роль-владельца:

```bash
sudo -u postgres createuser --pwprompt urnetwork
sudo -u postgres createdb --owner=urnetwork --encoding=UTF8 \
  --locale=en_US.UTF-8 --template=template0 urnetwork
```

Если на хосте базы данных нет локали `en_US.UTF-8`, сначала установите её. Привяжите PostgreSQL к loopback и разрешите в `pg_hba.conf` аутентификацию по паролю для роли `urnetwork` к базе данных `urnetwork` с `127.0.0.1/32` методом `scram-sha-256`. Роль для миграций должна владеть базой данных/схемой и иметь право создавать и изменять её таблицы и индексы. Используйте сгенерированный шестнадцатеричный пароль, чтобы он безопасно подставлялся в URL подключения, который строит этот сервер.

Создайте `/srv/warp/vault/main/pg.yml`:

```yaml
authority: 127.0.0.1:5432
db: urnetwork
user: urnetwork
password: "<the PostgreSQL role password>"
```

Создайте `/srv/warp/config/main/db.yml`:

```yaml
min_connections: 0
max_connections: 32
```

Пул обслуживания по умолчанию использует эти же ресурсы. Если вы добавляете PgBouncer, оставьте `pg.yml` направленным на пулер, а прямое подключение к PostgreSQL укажите в `vault/main/pg_maintenance.yml`; размер этого пула можно задать отдельно в `config/main/db_maintenance.yml`. Миграциям и обслуживанию нужно прямое подключение. Рассчитайте лимит подключений PostgreSQL на оба пула и на всех прочих клиентов. Текущий клиент PostgreSQL использует `sslmode=disable`, поэтому держите это подключение на loopback или в защищённом частном транспорте.

Настройте Redis с сохранением данных на диск и паролем. Для службы Redis, установленной из пакета, нужные настройки `redis.conf` такие:

```conf
bind 127.0.0.1
protected-mode yes
appendonly yes
maxmemory-policy noeviction
requirepass <a separate generated Redis password>
```

После установки настроек перезапустите Redis. Создайте `/srv/warp/vault/main/redis.yml`:

```yaml
authority: 127.0.0.1:6379
password: "<the Redis password>"
cluster: false
db: 0
```

Создайте `/srv/warp/config/main/redis.yml`:

```yaml
min_connections: 0
max_connections: 32
```

Это отдельные файлы: vault задаёт учётные данные подключения, а config — размеры пулов. Кластер Redis использует `cluster: true`; в этом руководстве используется отдельный экземпляр, выделенный оператору. Ни одна из вспомогательных служб не должна быть доступна из публичного интернета.

### Подготовьте локальное хранилище артефактов

Код выплат и свидетельств использует интерфейс сервера `BlobStore`. Он поддерживает локальные файлы; аккаунт в облачном объектном хранилище не нужен. Ресурс конфигурации по-прежнему называется `minio.yml`, в том числе для локального бэкенда.

Смонтируйте постоянную **отдельную файловую систему** в `/srv/urnetwork-data` (ext4, XFS или Btrfs) и сделайте так, чтобы она монтировалась до запуска службы. Каталог в корневой файловой системе, tmpfs или оверлей контейнера не проходят проверку допуска хранилища демоном. Выберите размер файловой системы с учётом истории артефактов и резервных копий.

Для **нового, пустого оператора** подготовьте корень артефактов и его независимо хранимую декларацию идентичности. Пример ниже отказывается повторно использовать существующие корни, файлы-маркеры или декларацию. Запустите его один раз от имени администратора хоста, убедившись, что это именно тот смонтированный том, который нужен:

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

Запишите выведенные путь к декларации и дайджест `sha256:`, затем настройте `/srv/warp/vault/main/minio.yml`:

```yaml
authority: local
path: /srv/urnetwork-data/operator-blob
prefix: blob
max_bytes: 107374182400
durable_volumes:
  path: /etc/urnetwork/durable-volumes.json
  sha256: "sha256:<exact declaration digest>"
```

Пример выделяет блобам не более 100 GiB и отказывает в записи, когда свободно меньше 1 GiB или 10 000 inode; выберите лимиты под свой хост. Декларация привязывает UUID файловой системы, маркер, аренду, inode корня и 32-байтовый атрибут поколения. Служба проверяет эти существующие объекты и никогда не создаёт корень на замену. Следите, чтобы их владельцы и родительские каталоги были защищены от записи группой и всеми остальными. При перезапуске сохраняйте исходную декларацию и байты; восстановление на другой inode или другую файловую систему требует явной миграции хранилища, а не повторного запуска этой первичной настройки поверх сохранённых артефактов. Этот рецепт готовит только файловое хранилище оператора; у очередей заявок майнеров и журналов валидаторов своя подготовка собственного состояния.

Если `minio.yml` отсутствует, в `main` нет запасного варианта с файловой системой. Существующие развёртывания могут вместо этого использовать самостоятельно размещённый бэкенд MinIO, который поддерживает [`server/blob.go`](https://github.com/urnetwork/server/blob/main/blob.go), с полями `authority`, `tls`, `access_key`, `secret_key`, `bucket` и `prefix`. Включите хранилище артефактов и базу данных в план восстановления вместе: майнеры и валидаторы должны по-прежнему иметь возможность загрузить артефакты, на которые ссылаются ончейн-корни.

## Шаг 4: настройте аутентификацию и входной шлюз

Сгенерируйте выделенный ключ подписи JWT P-256 в `vault/main/jwt-signing.pem`, например командой `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt-signing.pem`, затем установите его с правами vault, указанными выше. Делайте это в закрытом каталоге под `umask 077`. Укажите на него в `vault/main/jwt.yml`:

```yaml
tls_key_paths:
  - jwt-signing.pem
```

Имя ресурса историческое: это может быть выделенный ключ подписи, и он не обязан быть ключом вашего публичного сертификата HTTPS. На время ротации оставляйте предыдущие ключи JWT доступными. Настройте два отдельных случайных перца:

```yaml
# vault/main/password.yml
password:
  pepper: "<random password pepper>"
```

```yaml
# vault/main/client.yml
client_ip_hash_pepper: "<different random IP hash pepper>"
```

Установите актуальную лицензированную базу GeoLite2-City в `config/main/mmdb/geolite2.mmdb` и соответствующий ей `places.yml`. Инструмент сборки сервера `cli/geolite2export` генерирует список мест из этой самой MMDB (`-mmdb <path> -out <path>`); сгенерируйте его на хосте сборки/конфигурации и доставьте на сервер оба файла. Крошечная база `local/testdata` — это тестовая фикстура, а не продакшн-база географии. Для прогрева API и Connect нужна действительная база City, а для начального заполнения местоположений — её список мест.

Создайте `config/main/tls.yml` — Connect загружает его, даже если развёртывание использует только WebSocket:

```yaml
allowed_hosts:
  - connect.example.net
```

Для приведённой выше карты портов на loopback настройте обратный прокси HTTPS так:

| Публичная конечная точка | Внутренний слушатель | Требование к входному шлюзу |
| --- | --- | --- |
| `https://api.example.net` | `http://127.0.0.1:8080` | пересылать маршруты API и реальный адрес клиента |
| `wss://connect.example.net` | `http://127.0.0.1:8081` | сохранять апгрейды WebSocket и долгоживущие соединения |
| состояние воркера | `http://127.0.0.1:8082/status` | оставить закрытым, для мониторинга |
| обмен Connect | TCP `127.0.0.1:5080` | только внутренний доступ |

Терминируйте TLS сертификатами для своих публичных имён. Входной шлюз должен **перезаписывать `X-UR-Forwarded-For` одной реальной парой `IP:port` клиента**, заключая адрес IPv6 в квадратные скобки. [Резолвер адресов сервера](https://github.com/urnetwork/server/blob/main/session/client_session.go) намеренно игнорирует стандартный `X-Forwarded-For`; `/verify` полагается на то, что видит фактический выходной адрес майнера. Обращаться к внутренним слушателям должен только ваш доверенный входной шлюз. Маршрутизируйте `/verify`, `/sn/*` и трафик WebSocket без правил аутентификации или буферизации, которые мешают их собственным протоколам.

Эта карта портов обеспечивает транспорт WebSocket. Нативным транспортам HTTP/3 и DNS дополнительно нужны сопоставления портов Connect для портов службы UDP/443 и UDP/4053, [соглашение Warp о пересылке через входной шлюз](https://github.com/urnetwork/warp) и сертификаты в `vault/main/tls/<hostname>/<hostname>.crt` и `.key`. Публичный DNS использует UDP/53, который входной шлюз пересылает на приватный UDP/4053; UDP/8053 — слушатель для совместимости, который включается только при явном сопоставлении. Эти слушатели ожидают кадрирования Proxy Protocol от продакшн-шлюза; одного открытого порта UDP недостаточно. Держите каждую пару сертификата и ключа в одном каталоге ресурса/версии.

Полные API и воркер также поддерживают продуктовые функции: OAuth, электронную почту, подписки и экстендеры. Если вы предлагаете эти функции, подготовьте их ресурсы; бинарник не генерирует учётные данные интеграций. OAuth использует `auth.yml` с собственным издателем и **отдельными** ключами подписи OAuth, которые генерируются и ротируются инструментами OAuth из Warp. См. [конфигурацию IDP сервера](https://github.com/urnetwork/server/blob/main/IDP.md). Не используйте ключ JWT в качестве подписанта OAuth.

### Настройте конечную точку проверки

Маршруту `/verify` не нужна отдельная служба: он входит в API, а его статистика, доказательства и ключи — это публичные маршруты на том же хосте:

| Маршрут | Назначение |
| --- | --- |
| `POST /verify` | протокол проходов (SEED, EXTEND, FINAL), аутентифицированный собственными подписями Ed25519 протокола, а не JWT |
| `GET /verify/keys` | ключи подписи сервера, текущие и исторические |
| `GET /verify/stats` | сводки, наблюдаемые оператором, для аудита и реконструкции (валидаторы не используют их для оценки) |
| `GET /verify/proofs` | каждый подписанный неотравленный проход, завершённый или истёкший |
| `GET /key/<client_id>` | публичный ключ Ed25519 клиента, без аутентификации |
| `POST /sn/wallet`, `GET /sn/wallet` | coldkey майнера для получения выплат |
| `GET /sn/pool/claim` | Merkle-доказательство майнера за эпоху |
| `GET /sn/epoch` | зеркальная копия часов контракта (`epoch`, `start_block`, `commit_deadline_block`, `finalize_block`, `t_epoch_blocks`, `chain_id`, `contract_address`, `settlement_vault_address`, `no_id`, `netuid`, `rpc_url`) |
| `GET /sn/artifact`, `GET /sn/artifacts` | подписанные артефакты выплат по хешу содержимого и их история |
| `POST /sn/attempt-artifact`, `GET /sn/evidence`, `GET /sn/evidence/history` | загрузки свидетельств валидаторов и опубликованный индекс свидетельств |

Создайте ресурс vault `verify.yml` (рядом с `jwt.yml`):

```yaml
keys:
  - server_key_id: 0
    seed: <base64 standard encoding of a 32-byte Ed25519 seed>
```

`server_key_id` — один байт (от 0 до 255), который передаётся в каждом сообщении ASSIGN и FINAL; для ротации добавьте новую первую запись и сохраните старые. Для проверки нужен хотя бы один ключ; после запуска проверьте `GET /verify/keys`.

Сервер `/verify` обеспечивает инвариант, на который опираются валидаторы: каждому подходящему майнеру соответствует ровно один выходной IP-адрес, а каждому выходному IP-адресу — ровно один майнер; майнер, замеченный за двумя выходными узлами, исключается из индекса подходящих майнеров, пока снова не окажется за одним. Запросы SEED, исходный адрес которых не соответствует майнеру или которые превышают мягкие лимиты, отравляются (проходятся на полную глубину, но никогда не публикуются), чтобы конечную точку нельзя было использовать как оракул, раскрывающий, какие адреса принадлежат майнерам; сразу отклоняют запросы только жёсткие лимиты на источник из политики (`hard_seed_per_minute_per_source`, `hard_extend_per_minute_per_source`, `hard_active_trails_per_source`).

## Шаг 5: настройте конвейер эпох

Конвейер subtensor настраивается в `vault/main/st.yml`. Без действительного включённого ресурса API и taskworker могут работать с отключённой подсистемой подсети, поэтому одна лишь HTTP-проверка работоспособности не доказывает, что майнеры могут зарабатывать или забирать вознаграждения. Выберите mainnet через `URNETWORK_ST_PROFILE=mainnet` в окружении и `profile: mainnet` в файле. У testnet отдельное пространство имён `testnet-...`; оно не выбирается через `WARP_ENV` или одним лишь изменением `profile`. Поля — из [`server/controller/st_controller.go`](https://github.com/urnetwork/server/blob/main/controller/st_controller.go):

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

Включённому оператору нужны **три разных** ключа: депозитов, корней и артефактов. Они должны соответствовать идентичности допущенного оператора. Отсутствующий или некорректный `st.yml` записывается в журнал как отключённая подсистема; после запуска явно проверьте это состояние. `attempt_upload` и `reserved_attempt_upload` ограничивают загрузки свидетельств валидаторов; `ops_key` и `contract_address` — устаревшие поля, и в новом развёртывании их использовать не следует.

Для активации mainnet также нужна проверенная декларация заработка `config/main/sn.yml`, включающая выбранные цепочку/генезис, координатор, расчётное хранилище, политику и квитанцию готовности. Установите её до первого запуска `db migrate` на шаге 6, который фиксирует по ней постоянную границу заработка этой базы данных, и убедитесь, что её дайджест готовности совпадает с `launch_readiness_sha256` в `st.yml`. Получите эти значения, специфичные для развёртывания, в ходе допуска оператора и сохраните проверенные байты без изменений. Сервер держит использование после отсечки отдельно от прежних обязательств и отказывает в расчётах в mainnet, если активация заблокирована или идентичности различаются.

Прежде чем любая публикация в EVM в mainnet сможет пройти, установите независимо подписанную `operator_gas_policy` в `st.yml` и соответствующий ей `config/main/operator-gas-authority.yml`. Одобрение привязывает оператора, аккаунты депозитов/корней, ревизию политики, окно действия, закрепления истории транзакций и лимиты газа/попыток. Его схему определяет [реализация политики газа](https://github.com/urnetwork/server/blob/main/st_operator_gas_policy.go). Пополнение подписанта не заменяет это одобрение, а закрытому ключу одобряющего не место на этом хосте.

Уровни депозита должны совпадать с графиком подписанной политики: валидаторы пересчитывают ваш требуемый депозит по той же формуле и обнуляют ваш пул, если наблюдаемый депозит отличается (см. ниже).

## Шаг 6: выполните миграции, инициализацию и запуск

Перед запуском воркера установите ресурсы зондов из шага 7. Для всех трёх команд ниже используйте один и тот же бинарник и окружение. Команда `db migrate` не принимает параметров. Она применяет полный каталог миграций PostgreSQL сервера; роль и базу данных PostgreSQL она не создаёт. Затем она проверяет границу заработка провайдеров: одну неизменяемую строку базы данных с отсечкой заработка и идентичностью цепочки mainnet из `sn.yml`, которая определяет, какое завершённое использование приносит заработок в SN25, а какое завершается прежними выплатами в USDC. На новой базе данных первый запуск `db migrate` готовит границу по установленному `sn.yml` и выводит `Prepared provider earning boundary:` с отсечкой, дайджестами идентичности и исходного `sn.yml` и временем подготовки. Каждый последующий запуск оставляет границу без изменений, не читая `sn.yml`, и выводит `Retained provider earning boundary:` с теми же значениями, поэтому изменённый `sn.yml` никогда не меняет границу и не проваливает миграцию; пока изменённая идентичность заработка отличается от неё, воркеры придерживают новые распределения заработка и отправку выплат. Если `sn.yml` отсутствует или недействителен до создания границы, команда сообщает об этой ошибке после применения миграций; исправьте файл и запустите команду снова. Подготовка границы не активирует mainnet.

**Проверьте `sn.yml` до первого запуска `db migrate` на новой базе данных.** Этот запуск фиксирует постоянную границу заработка по установленному файлу без проверки дайджеста, и потом границу уже никогда нельзя изменить. Каждое другое поле заработка должно равняться своему опубликованному значению (схема, политики атрибуции и прежних выплат, профиль `mainnet`, цепочка 964, netuid 25), поэтому именно `cutoff_utc` и `genesis_hash` должны быть верными до этого первого запуска.

Откройте оболочку от имени служебного пользователя и загрузите окружение:

```bash
sudo -u urnetwork bash
set -a
. /etc/urnetwork/operator.env
set +a

ur-operator db migrate
ur-operator init-tasks
ur-operator run --require-subnet
```

Дождитесь успешного завершения каждой команды, прежде чем запускать следующую. `init-tasks` инициализирует повторяющиеся продакшн-задачи; обычный запуск тоже гарантирует, что их идемпотентные расписания существуют. Обычный `run` никогда не применяет миграции базы данных. С `--require-subnet` отсутствующий, недействительный или отключённый `st.yml` становится ошибкой запуска, а не приводит к тихому запуску сети без её конвейера подсети. Работающий воркер выполняет задачи обслуживания, зондирования, проверки и эпох SN, а также настроенную розничную/продуктовую работу.

Слушатели по умолчанию: API 8080, Connect 8081 и состояние воркера 8082, с восемью воркерами и размером пакета четыре. Соответствующие параметры — `--api-port`, `--connect-port`, `--taskworker-port`, `--worker-count` и `--worker-batch-size`. Меняя порты, обновляйте `WARP_PORTS` и обратный прокси вместе.

Для необязательной диагностики Connect `--memory-owner-ledger` включает учёт по владельцам передач. `--private-heap-profile-target` принимает `config` (по умолчанию), `disabled` или точную область `host/block`.

Операторам, использующим экстендеры: укажите в `vault/main/extender.yml` корневые ключи/ключи издателя развёртывания и идентичность gossip, добавьте `8083:8083` в `WARP_PORTS`, направьте `wss://gossip.example.net` на его слушатель и добавьте `--gossip-port=8083`. Непустой `gossip_identity_key_hex` требует этого слушателя: если объявлять gossip, не запуская его, публикации экстендеров в очереди так и останутся необработанными. См. [спецификацию развёртывания экстендеров](https://github.com/urnetwork/connect/blob/main/EXTENDER.md). Развёртывания Alt и Proxy по-прежнему используют свои фронтенды; для запуска описанного здесь оператора API/Connect они не нужны.

Когда запуск на переднем плане пройдёт успешно, остановите его через Ctrl-C и выйдите из оболочки служебного пользователя. Установите `/etc/systemd/system/ur-operator.service`:

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

Подправьте имена юнитов вспомогательных служб под свой дистрибутив и добавьте аргумент gossip, если он настроен. Запустите службу:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ur-operator
sudo journalctl -u ur-operator -f
```

Проверьте JSON готовности **каждой** службы. Одного HTTP 200 недостаточно; каждый `status` должен быть `ok`:

```bash
for port in 8080 8081 8082; do
  curl --fail --silent --show-error "http://127.0.0.1:$port/status" \
    | jq -e '.status == "ok"' || break
done
curl --fail --silent --show-error https://api.example.net/verify/keys
curl --fail --silent --show-error https://api.example.net/sn/epoch
```

Убедитесь, что публичный ответ об эпохе указывает ожидаемые вами цепочку, контракт, расчётное хранилище и `no_id` и что воркер продвигает своё зеркало цепочки. Проверка готовности смотрит на последнюю миграцию PostgreSQL и на Redis до активации служб; она не доказывает ни завершённого допуска оператора, ни профинансированной/одобренной публикации, ни доступной заявки. Если проверка сообщает `error not ready`, устраните причину и перезапустите: готовность фиксируется при запуске. При обновлениях сделайте резервную копию базы данных и артефактов, разверните проверенные ресурсы, явно примените миграции, затем перезапустите бинарник и снова проверьте все слушатели.

У включённого gossip нет конечной точки `/status`. Проверяйте его слушатель и журналы запуска отдельно: `[gossip]not ready` означает, что не запустился обработчик его очереди публикаций, даже если mesh-сеть может получать сообщения. Прежде чем считать публикацию gossip готовой, устраните ошибку вспомогательной службы и перезапустите.

## Шаг 7: запустите зондирование

Майнеры размещаются и проверяются на работоспособность через туннели, закреплённые за каждым майнером, и никогда — из собственной сети хоста оператора. Продакшн-воркер единого бинарника запускает долговечные шарды зондов; настройте `config/main/provider_egress_probe.yml` со своими конечными точками:

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

Создайте `vault/main/provider_egress.yml` с `ingest_secret: "<a separate random ingest secret>"`. Каждый активный шард зондов при допуске к выполнению создаёт собственные учётные данные и кредит; повторяющаяся задача `ProberBootstrap` после сбоев очищает аккаунты завершённых шардов. После изменения конфигурации шардов снова запустите `ur-operator init-tasks`. Текущие продакшн-зонды используют `url_probe`; старые поля задач `full` и `blackhole` оставлены для совместимости. Прежде чем допускать майнеров, следите за результатами зондирования и повторами в очереди: доступность API ещё не доказывает, что исходящий трафик майнеров работает.

## Шаг 8: опубликуйте фид статистики и попадите в каталог

Каталог операторов на ur.xyz — это реестр, встроенный в сайт в `web/ur.xyz/react/src/lib/network.js` (`NETWORK_OPERATORS`): оператор вносит себя в каталог, добавляя туда запись через pull request со своим названием, сайтом, названием приложения, URL панели управления и GitHub, страницами в магазинах приложений и своим `statsUrl`. Сайт читает текущие итоги из каждого фида каталога прямо в браузере посетителя, поэтому фид должен быть публичным JSON ровно с одним `Access-Control-Allow-Origin` (`*` или отражение, включающее `https://ur.xyz`):

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

`epoch` — текущая расчётная эпоха, `epoch_start` и `epoch_end` — её границы в секундах unix, а `epoch_start_block` и `epoch_end_block` — её границы в блоках цепочки: в mainnet эпоха n ≥ 1 идёт с блока 9 247 228 + (n − 1) × 50 400 в течение 50 400 блоков, а граница, которой цепочка ещё не достигла, прогнозируется из расчёта 12 секунд на блок. Накопительные значения относятся к этой эпохе, а `prev_*` — к предыдущей (не указывайте их, если завершённой эпохи ещё нет). `block` — устаревший псевдоним, равный `epoch`. Фид без `epoch` сайт читает как старую форму, окна которой не были расчётными эпохами: тогда он ведёт собственные часы эпох и не показывает ни одного оконного показателя этого фида. `alpha_usd` — наблюдаемая вами цена α (сайт берёт среднее по операторам), а `countries` носит информационный характер. Отсутствующие поля разбираются как null и никогда — как ноль.

## Что сервер делает каждую эпоху

Как только `st.yml` на месте, taskworker выполняет конвейер сам; здесь ничто не требует присутствия оператора за клавиатурой:

1. **`StSyncChain`** (каждые 5 s) зеркалирует часы эпох контракта в `st_epoch` и Redis (отдаются по `GET /sn/epoch`), продвигает зеркало финализированных событий, дозаполняет все эпохи, которые воркер проспал, и планирует перечисленные ниже задачи каждой эпохи на моменты, вычисленные по блокам. Определяющими являются часы контракта; перед каждой отправкой каждый срок заново проверяется в блоках.
2. **`StEpochClose(e)`** вычисляет листья и корень выплат для закрытой эпохи и закрывает ваш пул ончейн (`closeOperatorEpoch`, подписант корней), зачисляя реализованную эмиссию пула в расчётное хранилище. Каждый майнер, имеющий право на выплату (`usage_bytes > 0`, не менее `reliability_a_min` назначенных узлов, хотя бы одно подтверждение, кошелёк и отсутствие привязки к флоту верхнего уровня), получает `weight = usage_bytes × confirmations / max(assignments, reliability_a_min)`; веса агрегируются по coldkey и распределяются ровно на 10 000 базисных пунктов методом наибольшего остатка. Список записывается как подписанный артефакт выплат, адресуемый по содержимому.
3. **`StCommitRoot(e)`** фиксирует корень и хеш артефакта (`commitOperatorRoot`, подписант корней) в пределах окна фиксации корня, повторяя попытку каждые 5 минут, с оповещением за два часа до срока.
4. **`StDeposit(e)`** рассчитывает размер депозита эпохи и отправляет его (`deposit`, подписант депозитов): читает подписанный артефакт выплат предыдущей эпохи, берёт из него `total_usage_bytes` и `total_users` (число различных пользователей верхнего уровня с использованием по контрактам в эпохе — та же величина, что и `users` в вашем фиде статистики), считывает ваш conviction на момент до начала этой эпохи, выбирает уровень и вычисляет `floor(usage_bytes × rate_numerator_rao_per_gib / (GiB × rate_denominator) + users × rate_numerator_rao_per_user / rate_denominator)` с ограничением сверху `deposit_epoch_cap_rao`. В эпоху 0 депозит не вносится; депозит нулевого размера пропускается; депозит, уже внесённый ончейн за эту эпоху, тоже пропускается. Пока каждая настроенная ставка равна 0 (`deposit_zero_rate_action: equal_demand`, начальный период), задача записывает пропущенную публикацию, не отправляет транзакцию, не резервирует nonce и не поднимает оповещение; `bringyourctl st status` показывает расчёт (байты, пользователи, уровень, требуемый депозит или то, что цена равна нулю). Подготовленный α перемещается на hotkey резерва и переводится в неизменяемый приёмник резерва: депозиты — это стейк conviction, и они никогда не возвращаются.
5. **`StFinalizePoke(e)`** вызывает не требующую разрешений функцию `finalizeOperatorEpoch` в блоке финализации или после него, фиксируя причитающуюся сумму (зачисленная эмиссия плюс перенос в рамках того же оператора), чтобы открылись заявки.

Каждая попытка записывается (`AddStPublish`/`UpdateStPublish`), а публикация сверяет сохранённые транзакции с состоянием цепочки и после перезапусков. В обычной работе используется единый бинарник `ur-operator`. Для необязательной ручной диагностики и восстановления соберите отдельный административный клиент из той же рабочей копии сервера и установите его на хост оператора:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/bringyourctl ./bringyourctl
sudo install -o root -g root -m 0755 build/bringyourctl /usr/local/bin/bringyourctl
```

Запускайте его от имени служебного пользователя с тем же загруженным `/etc/urnetwork/operator.env`. Это административные подкоманды `bringyourctl`, а не дополнительные подкоманды `ur-operator`:

```text
bringyourctl st status [--epoch=<epoch>]
bringyourctl st deposit [--alpha_rao=<alpha_rao>]
bringyourctl st commit --epoch=<epoch>
bringyourctl st finalize --epoch=<epoch>
```

Ручной депозит с `--alpha_rao` всё равно ограничен `deposit_epoch_cap_rao`. Для добровольного conviction (`addConviction` — тот же односторонний путь, который повышает ваш уровень, не засчитываясь как спрос) серверной задачи нет: это транзакция от вашего подписанта депозитов.

## Как вас измеряют и как вам платят

Эмиссия пула оператора принадлежит его майнерам, а расчётное хранилище выплачивает фактически зачисленную сумму по корню оператора. Провайдерам выплачивается **momentum** — доля нативного распределения майнерам, которая уже сейчас идёт на работу сети и делится между пулами операторов и флотами верхнего уровня. На старте momentum составляет 10 %. [Network Capacity Reserve](/reserve), multisig `ur-reserve` по схеме 2 из 3, получает остальное: эмиссия майнеров × (1 − momentum). Его доля не фиксирована: по мере роста momentum он получает меньше. Это целевые значения маршрутизации, которые зависят от нативного консенсуса и поведения рантайма, а не гарантированные фиксированные выплаты. Нативный резерв отделён от неизменяемого приёмника депозитов и от балансов заявок в расчётном хранилище. См. [распределение нативного резерва](https://github.com/urfoundation/sn/blob/main/mainnet/TREASURY-EMISSIONS.md). Выручку оператора вам приносит собственный бизнес; подсеть платит майнерам за передачу этого трафика.

- **Вес пула.** В каждом tempo каждый валидатор взвешивает ваш пул по `implied_demand × Q`: `implied_demand = bytes × rate0_gib / GiB + users × rate0_user` — это ваши прошедшие аудит `total_usage_bytes` и `total_users` по ценам уровня с нулевым conviction. Ваш собственный уровень — самый высокий из тех, чей порог `min_conviction_rao` достигнут вашим накопленным заблокированным α (депозиты плюс добровольный conviction), поэтому ниже лимита на эпоху оператор, вложившийся в сеть, вносит меньше α за тот же вес: скидка меняет то, сколько вы платите, а не ваш вес. Когда лимит эпохи урезает сумму, которую вы должны, он урезает ваш спрос в той же пропорции, поэтому на лимите более низкая ставка уровня повышает ваш вес. `Q` — взвешенное по экспозиции качество майнеров вашего пула, измеренное собственными проходами этого валидатора и ограниченное `quality_transform` политики. Нативный Yuma вычисляет консенсус из строк весов валидаторов по правилам маскирования, отсечения и нормализации активного рантайма. Пока опубликованная цена равна нулю, подразумеваемый спрос каждого пула равен ровно 1 (см. [Начальный период](#initial-period)).
- **Аудит депозита.** Валидаторы не доверяют вашему расчёту депозита. При `usage_lag_epochs: 1` и `tier_snapshot: conviction_before_epoch` каждый валидатор читает ваш зафиксированный корень за предыдущую эпоху, загружает подписанный артефакт из вашего API, проверяет его хеш содержимого, подписанта, финализированные границы и корень, пересчитывает требуемый депозит из `total_usage_bytes` и `total_users` и требует, чтобы наблюдаемый депозит был в точности равен ему. `mismatch_action: zero_pool_weight`; корень или артефакт, всё ещё недоступный после окна фиксации корня, — это `zero_pool_weight_after_root_window`; стартовая эпоха должна нести нулевой депозит. Кроме того, политика ограничивает депозиты каждого оператора за эпоху. При политике с нулевой ценой депозиты вообще не проверяются: аудит записывается как `zero_price_no_deposit_required`, и ваш пул допускается независимо от того, что вы внесли добровольно.
- **Ведущие флоты.** Майнеры, которые привязываются к флоту верхнего уровня, переходят на верхний уровень и исключаются из вашего списка выплат, пока привязка действует (`head_fleet_active`), и зарабатывают нативно на hotkey своего флота; в ваш пул они возвращаются начиная с эпохи после той, в которой привязка устарела.
- **Расчёты.** Начиная с эпохи 1 расчётная эпоха длится 50 400 блоков (около 7 дней; эпоха 0 в mainnet длилась 7 200 блоков); эталонные окна mainnet — окно фиксации корня в 1 200 блоков (+4 h), финализация через 14 400 блоков (+48 h) и горизонт заявок в 8 эпох плюс 1 льготная эпоха; всё это зафиксировано подписанной политикой. Незабранные и нераспределённые остатки, а также зачисленная эмиссия пропущенного корня переносятся на вашу собственную следующую эпоху (`carry_same_operator`); между операторами ничего не перемещается. Заявки не требуют разрешений, никакая пауза контракта их не останавливает, и финализированную причитающуюся сумму не может переписать никакое обновление или действие владельца; заморозить заявки может только переключатель на уровне цепочки, отключающий переводы стейка в SN25, и он не может ничего из них забрать или перенаправить. Начиная с эпохи переключения на расчёты v2 ваш пул рассчитывается вместо этого через vault2: доли ваших майнеров определяются только проверенным использованием и начисляются на счета, которые никогда не сгорают, а по каждому корню выплаты идут только после того, как его одобрит валидатор и пройдёт окно оспаривания в 14 400 блоков.

## Что может пойти не так

- **Пропущенный корень.** Если корень не зафиксирован в пределах окна, эпоха всё равно финализируется, зачисленная эмиссия переносится на вашу следующую эпоху, а валидаторы обнуляют вес вашего пула с конца окна до тех пор, пока не будет пройден аудит. Следите за оповещением T-2h.
- **Несовпадающий депозит.** Любое расхождение между вашим депозитом и пересчётом валидаторов (другая таблица уровней в `st.yml`, ручное переопределение `--alpha_rao`, лимит, урезавший сумму) обнуляет пул на эту эпоху. Держите `deposit_tiers` и `deposit_epoch_cap_rao` равными значениям подписанной политики.
- **Депозит ниже минимального порога перевода в рантайме.** Сервер заранее проверяет каждый депозит по неизменяемому `minimumTransferTaoRao` расчётного хранилища при текущей цене α и отклоняет (не резервируя nonce) рассчитанную по использованию сумму, перевод которой в резерв стоит меньше порога; результат записывается как неудачный для этой эпохи и не повторяется.
- **Слишком мало операторов.** Подписанная политика задаёт минимальное число работоспособных операторов и активных валидаторов (по одному в политике SN25, по два в политике testnet); ниже этого минимума валидаторы прекращают направлять веса.
- **Майнеры без кошельков или экспозиции.** Майнеры без кошелька для получения выплат или с числом назначенных узлов меньше `reliability_a_min` не получают листа, а майнеру, замеченному за более чем одним выходным адресом, узлы вообще не назначаются, пока он снова не окажется за одним. Неподписанный путь `POST /sn/wallet` остаётся закрытым, если вы не установите `wallet_allow_unsigned: true`; приложения подписывают проверочное сообщение кошелька.
- **Артефакт, который ваши валидаторы не могут загрузить.** Валидаторы загружают артефакты из вашего API по хешу содержимого. Держите хранилище блобов и маршруты `/sn/artifact` доступными; эквивокация (два артефакта за одну эпоху) считается провалом аудита.

## Начальный период

На старте опубликованный [прайс-лист](/price) составляет **0 α за GiB и 0 α за пользователя**, и подписанная политика mainnet явно содержит эту нулевую цену: ставка каждого уровня за GiB и за пользователя равна 0, и задано `zero_rate_action: equal_demand`. Пока цена нулевая, операторы не вносят депозиты спроса: они не требуются и не проверяются. Скопируйте тот же график в `st.yml` с `deposit_zero_rate_action: equal_demand` (без этого сервер отклоняет таблицу уровней из одних нулей, так что нулевая цена никогда не возникнет случайно); тогда `StDeposit` ничего не должен, не отправляет транзакций и не поднимает оповещений, а `bringyourctl st status` сообщает, что цена равна нулю. Валидаторы присваивают каждому зарегистрированному пулу оператора одинаковый подразумеваемый спрос (ровно 1), поэтому канал пулов делится только по их измеренному качеству; добровольный депозит или блокировка conviction (`addConviction` остаётся доступным и по-прежнему повышает ваш уровень на будущее) не помогает вашему пулу и не вредит ему. Канал флотов верхнего уровня, разделение `theta`, ограничение качества и правило уступки не меняются, а в остальном ваш конвейер эпох работает точно так же, как описано выше: артефакт выплат (теперь содержащий и `total_users`) и фиксация корня по-прежнему нужны, чтобы ваши майнеры могли забрать вознаграждения. На старте допуск операторов контролирует владелец, поэтому нового оператора регистрирует в координаторе владелец подсети после проверки. Это осознанный режим запуска на время, пока из сети вычищаются ошибки; следите за RSS-фидом прайс-листа, чтобы не пропустить изменение, с которого начнётся сбор депозитов.
