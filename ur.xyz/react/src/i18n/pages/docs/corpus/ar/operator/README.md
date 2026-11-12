---
description: شغّل مشغّل URnetwork بملف تنفيذي واحد، واضبط موارد PostgreSQL وRedis وWarp لبيئة main، وأدِر خط معالجة مكافآت SN25.
---

# كيف تصبح مشغّل شبكة

يشغّل مشغّل الشبكة خوادم شبكة الخصوصية UR: خدمتَي API وconnect اللتين يتصل بهما المستخدمون والمُعدِّنون، ونقطة النهاية `/verify` التي يجتازها المُصادِقون، وخط معالجة الحقب الذي يسوّي مكافآت مُعدِّنيه على **Bittensor SN25 (netuid 25)**. يجلب المشغّل مستخدميه ومنتجاته الخاصة (فتطبيقات ur.io تعود إلى أحد المشغّلين)، ويودِع α إشارةً مدعومة بالإيرادات إلى طلب حقيقي، ويثبّت في كل حقبة تسوية قائمة مدفوعات Merkle التي تقسّم مجمّعه بين مُعدِّنيه. يبلّغ المشغّل عن الاستخدام الذي يتبعه هذا التقسيم، لكنه لا يحتفظ أبدًا بـ α يخص أي طرف آخر: فخزينة التسوية غير القابلة للتغيير هي التي تملك المجمّع، ويطالب كل مُعدِّن بحصته منها مباشرة.

تشغّل نقطة الدخول [`server/cli/all/main.go`](https://github.com/urnetwork/server/blob/main/cli/all/main.go) كلًّا من API وConnect وعامل مهام الإنتاج (taskworker) معًا. تنشر ملفًا تنفيذيًا واحدًا للمشغّل؛ وتبقى PostgreSQL وRedis وتخزين المُخرَجات (artifacts) ومدخل TLS العام (ingress) خدماتٍ داعمة. للاطلاع على الآلية اقرأ [الورقة المختصرة](/docs/litepaper)؛ وللأدوار الأخرى راجع [كيف تشغّل مُعدِّنًا](/docs/miner) و[كيف تشغّل مُصادِقًا](/docs/validator).

## لمن هذا الدليل

للفرق التي تريد تشغيل مساحة شبكة: أي نشرٍ لحزمة الخادم مفتوحة المصدر له نطاقه ومستخدموه وتطبيقاته أو تكاملاته الخاصة، ومجتمعه من المُعدِّنين. في مرحلة الإطلاق يخضع قبول المشغّلين لموافقة المالك (راجع [الفترة الأولية](#initial-period))، لذا فالخطوة الأولى محادثة مع مالك الشبكة الفرعية.

## ما تحتاج إليه

- **مضيف Linux ونطاقك الخاص.** يخدم الملف التنفيذي الموحَّد كلًّا من API (`api.<your domain>`) وConnect (`connect.<your domain>`) وعامل مهام الإنتاج الكامل. تخزّن PostgreSQL الحسابات والاستخدام والتسوية وطابور المهام الدائم؛ ويوفّر Redis التنسيق المشترك والتخزين المؤقت؛ ويحفظ تخزين المُخرَجات المحلي الدائم مُخرَجات المدفوعات والأدلة. اضبط التكاملات التي يقدّمها مشغّلك، بما فيها gossip الموسِّعات عند استخدام موسِّعات. والواجهتان الأماميتان الاختياريتان Alt وProxy دوران منفصلان من أدوار الخادم.
- **القبول على المنسّق.** يسجّل مالك الشبكة الفرعية المشغّلين باستخدام `registerOperator(noId, coldkey, poolHotkey, depositHotkey, depositSigner, rootSigner, effectiveEpoch, maximumBurnRao)`، وهو استدعاء مقصور على المالك يجعل خزينة التسوية أيضًا تسجّل UID مجمّعك تحت coldkey الخاص بالخزينة نفسها (تُدفع كلفة الحرق اللازمة للتسجيل من القيمة المرسلة مع الاستدعاء حتى `maximumBurnRao`، ويُردّ الباقي غير المحروق). وتُجدوَل تغييرات الأدوار اللاحقة لتسري في المستقبل باستخدام `scheduleOperator`. أنت تقدّم الهويات؛ والمالك يسجّلها ويعطيك `no_id` الخاص بك.
- **المفاتيح وhotkeys.** مفتاح coldkey للمشغّل (ss58، البادئة 42)؛ و**hotkey المجمّع** الذي تسجّله خزينة التسوية بوصفه UID مجمّعك؛ و**hotkey الودائع**، وهو خاص بك وحدك، وعليه تُجهَّز الودائع؛ وثلاثة مُوقِّعين على EVM يحتفظ بهم الخادم (secp256k1 بترميز hex): **مُوقِّع الودائع** (`deposit_key`، يستدعي `deposit`)، و**مُوقِّع الجذر** (`root_key`، يغلق الحقب، ويثبّت جذور المدفوعات، ويُنهيها)، و**مُوقِّع المُخرَجات** (`artifact_key`، يوقّع مُخرَجات المدفوعات؛ ويثبّته المُصادِقون بوصفه `artifact_signer` الخاص بك). يحتاج المُوقِّعون إلى TAO على Subtensor EVM لرسوم الغاز؛ ويحتاج hotkey الودائع إلى α ليودِع (ولا يحتاج إلى شيء منه خلال الفترة الأولية).
- **مفاتيح خادم `/verify`.** مفتاح Ed25519 واحد أو أكثر في مورد الخزنة (vault) `verify.yml`؛ يوقّع الأول المسارات الجديدة، وتُنشر جميعها في `GET /verify/keys` كي تبقى الإثباتات السابقة قابلة للتحقق عبر عمليات التدوير.
- **فحوص الخروج.** يشغّل عامل المهام في الملف التنفيذي أجزاء فحص (shards) دائمة يضبطها `config/main/provider_egress_probe.yml`، فيقيس ما تنقله نقطة خروج كل مُعدِّن فعليًا.
- **موجز إحصاءات عام** (`stats.json`) كي يتمكن دليل المشغّلين على ur.xyz من إدراجك.

## الخطوة 1: ابنِ الملف التنفيذي الموحَّد للمشغّل

استخدم المصدر الحالي لـ [`urnetwork/server`](https://github.com/urnetwork/server)، ونسخة Go و**المراجعات الدقيقة للمستودعات الشقيقة** المحددة في [قفل المصدر](https://github.com/urnetwork/server/blob/main/local/source-graph/lock.yml) الخاص به. يستخدم القفل الحالي Go 1.27.3. والنسخ المستخرجة من المستودعات الشقيقة هي `connect` و`glog` و`sdk` و`proxy` و`goidenticons` و`userwireguard` و`warp` و`sn` و`gvisor`؛ يأتي `sn` من `urfoundation/sn`، والبقية من `urnetwork`. ضعها بجانب `server`: إذ يستخدم `go.mod` استبدالات نسبية. اتبع [تعليمات البناء المعتمدة](https://github.com/urnetwork/server#canonical-build-sources) في المستودع عند تجهيز شجرة المصدر تلك.

من نسخة `server` المستخرجة:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/ur-operator ./cli/all

./build/ur-operator --help
```

انسخ `build/ur-operator` إلى `/usr/local/bin/ur-operator` على الخادم. احفظ مراجعة المصدر التي بُني منها الملف التنفيذي مع سجل النسخة لديك. وابنِ كل ترقية من مراجعات التبعيات التي تحددها مراجعة الخادم تلك.

## الخطوة 2: أنشئ تخطيط Warp لبيئة main

يستخدم الملف التنفيذي المُحلِّل نفسه الذي تستخدمه خدمات الخادم المنفردة. يختار `WARP_ENV=main` **بيئة النشر**؛ ويختار `URNETWORK_ST_PROFILE=mainnet` على حدة **ملف تعريف السلسلة**. يشغّل هذا المثال العملية بصفة مستخدم Unix مخصص اسمه `urnetwork`، مع إنهاء HTTPS العام عند وكيل عكسي على المضيف نفسه.

```bash
sudo useradd --system --home-dir /srv/warp --no-create-home \
  --shell /usr/sbin/nologin urnetwork
sudo install -d -o root -g urnetwork -m 0750 /srv/warp
sudo install -d -o root -g urnetwork -m 0750 \
  /srv/warp/config/main/mmdb /srv/warp/vault/main /srv/warp/site
sudo install -d -o root -g urnetwork -m 0750 /etc/urnetwork
```

استخدم هذا التخطيط. الأسماء مثل `pg.yml` أسماء موارد حرفية؛ أما قيم `<...>` في الأمثلة أدناه فيجب استبدالها.

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

اجعل ملفات الخزنة (vault) بملكية `root:urnetwork` ووضع `0640`، ومجلداتها بوضع `0750`؛ واستخدم `umask 077` عند توليد الأسرار. اجعل إعدادات المشغّل وملفاته التنفيذية قابلة للقراءة، لا للكتابة، من قِبل مستخدم الخدمة. وتحتاج PostgreSQL وRedis وتخزين الكائنات إلى بيانات دائمة ونسخ احتياطية مستقلة عن شجرة الموارد هذه.

من دون تجاوزات تكون الجذور `$WARP_HOME/{config,vault,site}`، وقيمة `WARP_HOME` الافتراضية `/srv/warp`. ويمكنك بدلًا من ذلك ضبط `WARP_CONFIG_HOME` و`WARP_VAULT_HOME` و`WARP_SITE_HOME` على جذور أخرى. لكل مورد، يجرّب المُحلِّل الملفات المباشرة في الجذر، ثم `main/`، ثم `all/`؛ وبعدها يبحث في مجلدات النسخ بترتيب تنازلي وفق الترقيم الدلالي للنسخ. لذا فإن الملف الموجود على مستوى الجذر يتقدّم على النسخة الخاصة بالبيئة. ويمكن لحاوية Warp أن تركّب البيئة المختارة مسبقًا مباشرة عند أحد الجذور. استخدم تخطيطًا واحدًا باتساق، وتجنّب ترك ملفات قديمة في موضع ذي أولوية أعلى.

اكتب `/etc/urnetwork/operator.env` على شكل تعيينات `NAME=value` بسيطة، دون `export`، كي يتمكن كلٌّ من الصدفة وsystemd من قراءته:

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

استبدل النطاق والمضيف ونسخة الملف التنفيذي ونسخة الإعدادات بقيمك. صيغة `WARP_PORTS` هي `service-port:host-port`، وتتضمن **5080**، أول منفذ داخلي لتبادل Connect. يجب أن تكون منافذ HTTP الثلاثة مختلفة. ويحدد الاحتفاظ بعنوان IP للمضيف وبخريطة منافذ صريحة أيضًا أيَّ مستمعات Connect الأصلية الاختيارية تُفعَّل. أضف تعيينات داخلية متتالية `5081:5081` و`5082:5082` وهكذا عند تخصيص مزيد من منافذ التبادل.

في هذا النشر على مضيف واحد عبر loopback، يعيد `/srv/warp/site/settings.yml` توجيه المضيف المُعلَن إلى مستمعه الداخلي:

```yaml
routes:
  operator-1.example.net: 127.0.0.1
```

يقدّم `config/main/settings.yml`، إن وُجد، إعدادات `all:` المشتركة والإعدادات الخاصة بكل مضيف، تليها تجاوزات `site/settings.yml`. احفظ الأسرار في الخزنة، لا في قسم `env_vars` من `settings.yml`: فبدء التشغيل يسجّل الإعدادات المدمجة. يستخدم هذا المثال عناوين (authorities) حرفية لـ PostgreSQL/Redis/RPC في ملفات الخزنة، لذا لا حاجة إلى `BRINGYOUR_POSTGRES_HOSTNAME` و`BRINGYOUR_REDIS_HOSTNAME` و`BRINGYOUR_SUBTENSOR_HOSTNAME`. فهي لا تلزم إلا إذا كانت مواردك تُدرجها صراحةً عبر `{{ env:NAME }}`.

## الخطوة 3: جهّز PostgreSQL وRedis وتخزين المُخرَجات

ثبّت PostgreSQL وRedis وشغّلهما كخدمتين منفصلتين؛ يستخدم الإعداد المحلي في مستودع الخادم PostgreSQL 18 وRedis 8. على مضيف مثبَّت عليه PostgreSQL، أنشئ قاعدة البيانات الخاصة بالمشغّل ودور المالك لها:

```bash
sudo -u postgres createuser --pwprompt urnetwork
sudo -u postgres createdb --owner=urnetwork --encoding=UTF8 \
  --locale=en_US.UTF-8 --template=template0 urnetwork
```

ثبّت الإعدادات المحلية (locale) `en_US.UTF-8` أولًا إن لم تكن موجودة على مضيف قاعدة البيانات. اربط PostgreSQL بواجهة loopback، واسمح بالمصادقة بكلمة المرور للدور `urnetwork` على قاعدة البيانات `urnetwork` من `127.0.0.1/32` في `pg_hba.conf` باستخدام `scram-sha-256`. يجب أن يملك دور الترحيل قاعدة البيانات/المخطط، وأن يستطيع إنشاء جداولها وفهارسها وتعديلها. استخدم كلمة مرور ست عشرية مولَّدة كي تكون آمنة داخل عنوان URL للاتصال الذي يبنيه هذا الخادم.

أنشئ `/srv/warp/vault/main/pg.yml`:

```yaml
authority: 127.0.0.1:5432
db: urnetwork
user: urnetwork
password: "<the PostgreSQL role password>"
```

أنشئ `/srv/warp/config/main/db.yml`:

```yaml
min_connections: 0
max_connections: 32
```

يعود مجمّع اتصالات الصيانة افتراضيًا إلى هذه الموارد. إن أضفت PgBouncer، فأبقِ `pg.yml` موجّهًا إلى مجمّع الاتصالات (pooler)، وضع الاتصال المباشر بـ PostgreSQL في `vault/main/pg_maintenance.yml`؛ ويمكن لـ `config/main/db_maintenance.yml` تحديد حجم ذلك المجمّع على حدة. تحتاج عمليات الترحيل والصيانة إلى الاتصال المباشر. خطّط لحد الاتصالات في PostgreSQL بحيث يكفي المجمّعين كليهما وأي عملاء آخرين. يستخدم عميل PostgreSQL الحالي `sslmode=disable`، لذا أبقِ هذا الاتصال على loopback أو على نقل خاص محمي.

اضبط Redis مع الحفظ الدائم (persistence) وكلمة مرور. في خدمة Redis المثبّتة من حزمة، إعدادات `redis.conf` المعنية هي:

```conf
bind 127.0.0.1
protected-mode yes
appendonly yes
maxmemory-policy noeviction
requirepass <a separate generated Redis password>
```

أعد تشغيل Redis بعد تثبيت الإعدادات. أنشئ `/srv/warp/vault/main/redis.yml`:

```yaml
authority: 127.0.0.1:6379
password: "<the Redis password>"
cluster: false
db: 0
```

أنشئ `/srv/warp/config/main/redis.yml`:

```yaml
min_connections: 0
max_connections: 32
```

هذان ملفان منفصلان: تقدّم الخزنة بيانات اعتماد الاتصال، وتقدّم الإعدادات أحجام مجمّعات الاتصالات. تستخدم مجموعة Redis العنقودية (cluster) `cluster: true`؛ ويستخدم هذا الدليل مثيلًا مستقلًا مخصصًا للمشغّل. ويجب ألا تكون أيٌّ من الخدمتين الداعمتين قابلة للوصول من الإنترنت العام.

### جهّز التخزين المحلي للمُخرَجات

تستخدم شيفرة المدفوعات والأدلة الواجهة البرمجية `BlobStore` في الخادم. وهي تدعم الملفات المحلية؛ فلا يلزم حساب لدى مخزن كائنات سحابي. ولا يزال مورد الإعدادات يحمل اسم `minio.yml`، حتى مع الواجهة الخلفية المحلية.

ركّب **نظام ملفات منفصلًا** دائمًا عند `/srv/urnetwork-data`، باستخدام ext4 أو XFS أو Btrfs، ورتّب لتركيبه قبل بدء الخدمة. لا يستوفي شروط قبول التخزين لدى الخدمة (daemon) مجلدٌ على نظام الملفات الجذر للنظام، ولا tmpfs، ولا طبقة overlay لحاوية. اختر حجم نظام الملفات بما يتسع لسجل مُخرَجاتك ونسخك الاحتياطية.

بالنسبة إلى **مشغّل جديد فارغ**، جهّز جذر المُخرَجات وإعلان هويته الذي يُحفظ على نحو مستقل. يرفض المثال التالي إعادة استخدام جذور أو ملفات علامة أو إعلان موجودة سلفًا. شغّله مرة واحدة بصفتك مسؤول المضيف بعد التحقق من أن هذه هي وحدة التخزين المركّبة المقصودة:

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

سجّل مسار الإعلان وبصمة `sha256:` اللذين يطبعهما، ثم اضبط `/srv/warp/vault/main/minio.yml`:

```yaml
authority: local
path: /srv/urnetwork-data/operator-blob
prefix: blob
max_bytes: 107374182400
durable_volumes:
  path: /etc/urnetwork/durable-volumes.json
  sha256: "sha256:<exact declaration digest>"
```

يخصّص المثال 100 GiB كحد أقصى للكائنات (blobs)، ويرفض الكتابة حين تقل المساحة الحرة عن 1 GiB أو عدد inodes الحرة عن 10,000؛ اختر حدودًا تناسب مضيفك. يربط الإعلان UUID نظام الملفات، والعلامة، وعقد الإيجار (lease)، وinode الجذر، وسمة الجيل بطول 32 بايت. تتحقق الخدمة من تلك الكائنات الموجودة ولا تنشئ أبدًا جذرًا بديلًا. أبقِ ملكيتها والمجلدات الأعلى منها محميةً من الكتابة من قِبل المجموعة/الجميع. حافظ على الإعلان الأصلي وبايتاته عند إعادة التشغيل؛ فالاستعادة إلى inode أو نظام ملفات آخر تتطلب ترحيلًا صريحًا للتخزين، لا إعادة تشغيل هذا الإعداد الجديد فوق المُخرَجات المحفوظة. تجهّز هذه الوصفة مخزن ملفات المشغّل فقط؛ أما طوابير مطالبات المُعدِّنين وسجلات المُصادِقين فلكلٍّ منها تجهيزه الخاص لحالة مالكه.

غياب `minio.yml` لا يوفّر بديلًا احتياطيًا من نظام الملفات في `main`. ويمكن لعمليات النشر القائمة بدلًا من ذلك استخدام واجهة MinIO الخلفية ذاتية الاستضافة التي يدعمها [`server/blob.go`](https://github.com/urnetwork/server/blob/main/blob.go)، مع `authority` و`tls` و`access_key` و`secret_key` و`bucket` و`prefix`. اجمع تخزين المُخرَجات وقاعدة البيانات معًا في خطة الاستعادة: يجب أن يظل المُعدِّنون والمُصادِقون قادرين على جلب المُخرَجات التي تشير إليها الجذور على السلسلة.

## الخطوة 4: اضبط المصادقة والمدخل

ولّد مفتاح توقيع JWT مخصصًا من نوع P-256 في `vault/main/jwt-signing.pem`، مثلًا باستخدام `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt-signing.pem`، ثم ثبّته بأذونات الخزنة المذكورة أعلاه. افعل ذلك في مجلد خاص مع `umask 077`. ووجّه `vault/main/jwt.yml` إليه:

```yaml
tls_key_paths:
  - jwt-signing.pem
```

اسم المورد تاريخي: يمكن أن يكون هذا مفتاح توقيع مخصصًا، ولا يلزم أن يكون مفتاح شهادة HTTPS العامة لديك. أبقِ مفاتيح JWT السابقة متاحة أثناء التدوير. اضبط قيمتَي pepper عشوائيتين منفصلتين:

```yaml
# vault/main/password.yml
password:
  pepper: "<random password pepper>"
```

```yaml
# vault/main/client.yml
client_ip_hash_pepper: "<different random IP hash pepper>"
```

ثبّت قاعدة بيانات GeoLite2-City حديثة ومرخّصة في `config/main/mmdb/geolite2.mmdb` مع ملف `places.yml` المطابق لها. تولّد أداة البناء `cli/geolite2export` في الخادم قائمة الأماكن من ملف MMDB ذاك بعينه (`-mmdb <path> -out <path>`)؛ ولّدها على مضيف البناء/الإعداد وانقل الملفين كليهما. قاعدة البيانات الصغيرة `local/testdata` أداة اختبار، لا قاعدة بيانات جغرافية للإنتاج. يتطلب إحماء API وConnect قاعدة بيانات City صالحة، وتتطلب تهيئة بيانات المواقع قائمة أماكنها.

أنشئ `config/main/tls.yml`، الذي يحمّله Connect حتى عندما لا يستخدم النشر سوى WebSockets:

```yaml
allowed_hosts:
  - connect.example.net
```

لخريطة منافذ loopback أعلاه، اضبط وكيل HTTPS العكسي على النحو التالي:

| نقطة النهاية العامة | المستمع الداخلي | متطلب المدخل |
| --- | --- | --- |
| `https://api.example.net` | `http://127.0.0.1:8080` | مرّر مسارات API وعنوان العميل الحقيقي |
| `wss://connect.example.net` | `http://127.0.0.1:8081` | حافظ على ترقيات WebSocket والاتصالات طويلة الأمد |
| حالة العامل | `http://127.0.0.1:8082/status` | أبقِها خاصة للمراقبة |
| تبادل Connect | TCP `127.0.0.1:5080` | داخلي فقط |

أنهِ TLS بشهادات لأسمائك العامة. يجب على المدخل أن **يعيد كتابة `X-UR-Forwarded-For` ليحمل زوج `IP:port` حقيقيًا واحدًا للعميل**، مع وضع عنوان IPv6 بين قوسين معقوفين. يتجاهل [مُحلِّل العناوين في الخادم](https://github.com/urnetwork/server/blob/main/session/client_session.go) عمدًا الترويسة القياسية `X-Forwarded-For`؛ إذ يعتمد `/verify` على رصد عنوان الخروج الفعلي للمُعدِّن. يجب ألا يصل إلى المستمعات الداخلية سوى مدخلك الموثوق. وجّه `/verify` و`/sn/*` وحركة WebSocket دون قواعد مصادقة أو تخزين مؤقت (buffering) تتعارض مع بروتوكولاتها الخاصة.

توفّر خريطة المنافذ هذه وسيلة النقل WebSocket. أما وسيلتا النقل الأصليتان HTTP/3 وDNS فتحتاجان أيضًا إلى تعيينات منافذ Connect لمنفذَي الخدمة UDP/443 وUDP/4053، وإلى [اصطلاح إعادة التوجيه في مدخل Warp](https://github.com/urnetwork/warp)، وإلى شهادات تحت `vault/main/tls/<hostname>/<hostname>.crt` و`.key`. يستخدم DNS العام المنفذ UDP/53، الذي يمرّره المدخل إلى UDP/4053 الخاص؛ أما UDP/8053 فمستمع توافق لا يُفعَّل إلا عند تعيينه صراحةً. تتوقع هذه المستمعات تأطير Proxy Protocol الذي يستخدمه مدخل الإنتاج؛ ولا يكفي فتح منفذ UDP وحده. احفظ كل زوج من الشهادة والمفتاح في مجلد المورد/النسخة نفسه.

يدعم API والعامل الكاملان أيضًا ميزات منتجات مثل OAuth والبريد الإلكتروني والاشتراكات والموسِّعات. جهّز مواردها عند تقديم تلك الميزات؛ فالملف التنفيذي لا يولّد بيانات اعتماد التكاملات. يستخدم OAuth الملف `auth.yml` مع مُصدِر (issuer) خاص به ومفاتيح توقيع OAuth **منفصلة**، تُولَّد وتُدوَّر بأدوات OAuth في Warp. راجع [إعدادات IDP في الخادم](https://github.com/urnetwork/server/blob/main/IDP.md). لا تستخدم مفتاح JWT مُوقِّعًا لـ OAuth.

### اضبط نقطة نهاية التحقق

لا يحتاج مسار `/verify` إلى خدمة منفصلة: فهو جزء من API، وإحصاءاته وإثباتاته ومفاتيحه مسارات عامة على المضيف نفسه:

| المسار | الغرض |
| --- | --- |
| `POST /verify` | بروتوكول المسارات (SEED وEXTEND وFINAL)، ويُصادَق عليه بتوقيعات Ed25519 الخاصة بالبروتوكول، لا بـ JWT |
| `GET /verify/keys` | مفاتيح توقيع الخادم، الحالية والسابقة |
| `GET /verify/stats` | ملخصات تجميعية يرصدها المشغّل، للتدقيق وإعادة البناء (لا يقيّم المُصادِقون بناءً عليها) |
| `GET /verify/proofs` | كل مسار موقَّع وغير مسموم، مكتمل أو منتهي الصلاحية |
| `GET /key/<client_id>` | مفتاح Ed25519 العام للعميل، دون مصادقة |
| `POST /sn/wallet`, `GET /sn/wallet` | coldkey المطالبة الخاص بالمُعدِّن |
| `GET /sn/pool/claim` | إثبات Merkle الخاص بالمُعدِّن لحقبة ما |
| `GET /sn/epoch` | ساعة العقد المنسوخة (`epoch`، `start_block`، `commit_deadline_block`، `finalize_block`، `t_epoch_blocks`، `chain_id`، `contract_address`، `settlement_vault_address`، `no_id`، `netuid`، `rpc_url`) |
| `GET /sn/artifact`, `GET /sn/artifacts` | مُخرَجات المدفوعات الموقَّعة حسب تجزئة المحتوى، وسجلّها |
| `POST /sn/attempt-artifact`, `GET /sn/evidence`, `GET /sn/evidence/history` | رفع أدلة المُصادِقين، وفهرس الأدلة المنشور |

أنشئ مورد الخزنة `verify.yml` (بجانب `jwt.yml`):

```yaml
keys:
  - server_key_id: 0
    seed: <base64 standard encoding of a 32-byte Ed25519 seed>
```

القيمة `server_key_id` بايت واحد (من 0 إلى 255) يُحمل في كل رسالة ASSIGN وFINAL؛ وللتدوير، أضف مدخلًا أول جديدًا واحتفظ بالمدخلات القديمة. يتطلب التحقق مفتاحًا واحدًا على الأقل؛ تحقق من `GET /verify/keys` بعد بدء التشغيل.

يفرض خادم `/verify` القاعدة الثابتة التي يعتمد عليها المُصادِقون: يقابل كل مُعدِّن مؤهَّل عنوان IP خارجًا واحدًا بالضبط، ويقابل كل عنوان IP خارج مُعدِّنًا واحدًا بالضبط؛ والمُعدِّن الذي يُرى خلف نقطتَي خروج يُحذف من فهرس المؤهَّلين حتى يعود إلى نقطة واحدة. أما طلبات SEED التي لا يُحلّ عنوان مصدرها إلى مُعدِّن، أو التي تتجاوز الحدود المرنة، فتُسمَّم (تُجتاز حتى عمقها الكامل لكنها لا تُنشر أبدًا)، كي لا يمكن استخدام نقطة النهاية وسيلةً لمعرفة أي العناوين تعود إلى مُعدِّنين؛ ولا ترفض الطلبات رفضًا قاطعًا إلا الحدود الصارمة لكل مصدر في السياسة (`hard_seed_per_minute_per_source` و`hard_extend_per_minute_per_source` و`hard_active_trails_per_source`).

## الخطوة 5: اضبط خط معالجة الحقب

يُضبط خط معالجة subtensor عبر `vault/main/st.yml`. فمن دون مورد صالح ومفعَّل، يمكن أن يعمل API وعامل المهام مع تعطيل النظام الفرعي الخاص بالشبكة الفرعية، لذا فإن فحص السلامة عبر HTTP وحده لا يثبت أن المُعدِّنين يستطيعون الكسب أو المطالبة. اختر الشبكة الرئيسية (mainnet) بـ `URNETWORK_ST_PROFILE=mainnet` في البيئة و`profile: mainnet` في الملف. للشبكة التجريبية (testnet) نطاق أسماء منفصل `testnet-...`؛ ولا تُختار عبر `WARP_ENV` ولا بتغيير `profile` وحده. الحقول، كما في [`server/controller/st_controller.go`](https://github.com/urnetwork/server/blob/main/controller/st_controller.go):

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

يتطلب المشغّل المفعَّل **ثلاثة مفاتيح متمايزة** للودائع والجذر والمُخرَجات. ويجب أن تطابق هوية المشغّل المقبول. يُسجَّل غياب `st.yml` أو خلل صيغته على أنه نظام فرعي معطَّل؛ تحقق من تلك الحالة صراحةً بعد بدء التشغيل. يحدّ `attempt_upload` و`reserved_attempt_upload` من رفع أدلة المُصادِقين؛ أما `ops_key` و`contract_address` فحقلان قديمان لا ينبغي استخدامهما في نشر جديد.

يتطلب تفعيل الشبكة الرئيسية أيضًا إعلان الكسب المُراجَع `config/main/sn.yml`، بما فيه السلسلة/كتلة التكوين (genesis) المختارة، والمنسّق، وخزينة التسوية، والسياسة، وإيصال الجاهزية. ثبّته قبل أول `db migrate` في الخطوة 6، الذي يحدّد منه حدّ الكسب الدائم لقاعدة البيانات هذه، وتأكد من أن بصمة الجاهزية فيه تطابق `launch_readiness_sha256` في `st.yml`. احصل على هذه القيم الخاصة بالنشر عبر قبول المشغّل، وحافظ على البايتات المُراجَعة كما هي. يفصل الخادم الاستخدام الواقع بعد الحدّ الفاصل عن المستحقات القديمة، ويرفض تسوية الشبكة الرئيسية عندما يكون التفعيل محجوبًا أو تختلف الهويات.

قبل أن ينجح أي نشر على EVM في الشبكة الرئيسية، ثبّت `operator_gas_policy` الموقَّعة توقيعًا مستقلًا في `st.yml` مع `config/main/operator-gas-authority.yml` المطابق لها. تربط هذه الموافقة المشغّلَ، وحسابَي الودائع/الجذر، ونسخة السياسة، ونافذة الصلاحية، والقيم المثبّتة لسجل المعاملات، وحدود الغاز/المحاولات. يحدد [تنفيذ سياسة الغاز](https://github.com/urnetwork/server/blob/main/st_operator_gas_policy.go) مخططها. تمويل المُوقِّع لا يغني عن هذه الموافقة، والمفتاح الخاص للجهة المُوافِقة لا مكان له على هذا المضيف.

يجب أن تكون مستويات الودائع مطابقة لجدول السياسة الموقَّعة: يعيد المُصادِقون حساب وديعتك المطلوبة بالصيغة نفسها، ويصفّرون مجمّعك عندما تختلف الوديعة المرصودة (انظر أدناه).

## الخطوة 6: رحّل وهيّئ وشغّل

ثبّت موارد الفحص في الخطوة 7 قبل بدء العامل. استخدم الملف التنفيذي نفسه والبيئة نفسها للأوامر الثلاثة أدناه كلها. لا يأخذ `db migrate` أي خيارات. فهو يطبّق فهرس ترحيلات PostgreSQL الكامل للخادم؛ ولا ينشئ دور PostgreSQL ولا قاعدة البيانات. ثم يتحقق من حدّ الكسب للمزوّدين: صفّ واحد غير قابل للتغيير في قاعدة البيانات يحمل الحدّ الفاصل للكسب وهوية سلسلة الشبكة الرئيسية من `sn.yml`، ويحدد أي استخدام مكتمل يكسب على SN25 وأيّه ينتهي إلى مدفوعات USDC القديمة. على قاعدة بيانات جديدة، يجهّز أول `db migrate` الحدَّ من `sn.yml` المثبّت ويطبع `Prepared provider earning boundary:` مع الحدّ الفاصل، وبصمتَي الهوية و`sn.yml` الأولي، ووقت التجهيز. وكل تشغيل لاحق يترك الحدّ دون تغيير من غير قراءة `sn.yml`، ويطبع `Retained provider earning boundary:` بالقيم نفسها، لذا لا يغيّر `sn.yml` المعدَّل الحدَّ أبدًا ولا يُفشل ترحيلًا؛ ويعلّق العمّال تخصيصات الكسب الجديدة وإرسال المدفوعات ما دامت هوية الكسب المعدَّلة تختلف عنه. إن كان `sn.yml` مفقودًا أو غير صالح قبل وجود الحدّ، يُبلغ الأمر عن ذلك الخطأ بعد تطبيق الترحيلات؛ صحّح الملف وشغّل الأمر مجددًا. تجهيز الحدّ لا يفعّل الشبكة الرئيسية.

**راجع `sn.yml` قبل أول `db migrate` على قاعدة بيانات جديدة.** فذلك التشغيل يحدّد حدّ الكسب الدائم من الملف المثبّت دون أي تحقق من البصمة، ولا يمكن تغيير الحدّ بعد ذلك أبدًا. يجب أن يساوي كل حقل كسب آخر قيمته المنشورة (المخطط، وسياسة الإسناد والسياسة القديمة، وملف التعريف `mainnet`، والسلسلة 964، وnetuid 25)، لذا فإن `cutoff_utc` و`genesis_hash` هما القيمتان اللتان يجب أن تكونا صحيحتين قبل ذلك التشغيل الأول.

افتح صدفة بصفة مستخدم الخدمة، ثم حمّل البيئة:

```bash
sudo -u urnetwork bash
set -a
. /etc/urnetwork/operator.env
set +a

ur-operator db migrate
ur-operator init-tasks
ur-operator run --require-subnet
```

أكمل كل أمر بنجاح قبل تشغيل الأمر التالي. يهيّئ `init-tasks` مهام الإنتاج المتكررة؛ ويضمن بدء التشغيل العادي أيضًا وجود جداولها الزمنية المتساوية القوى (idempotent). لا يطبّق `run` العادي ترحيلات قاعدة البيانات أبدًا. ويجعل `--require-subnet` غياب `st.yml` أو عدم صلاحيته أو تعطيله خطأً عند بدء التشغيل، بدلًا من تشغيل شبكة بصمت دون خط معالجة شبكتها الفرعية. ينفّذ العامل قيد التشغيل مهام الصيانة والفحص والتحقق وحقب SN، إضافةً إلى أعمال البيع بالتجزئة/المنتجات المضبوطة.

منافذ الاستماع الافتراضية هي API على 8080، وConnect على 8081، وحالة العامل على 8082، مع ثمانية عمّال وحجم دفعة قدره أربعة. والخيارات المقابلة هي `--api-port` و`--connect-port` و`--taskworker-port` و`--worker-count` و`--worker-batch-size`. عند تغيير المنافذ، حدّث `WARP_PORTS` والوكيل العكسي معًا.

لتشخيصات Connect الاختيارية، يفعّل `--memory-owner-ledger` محاسبة مالكي النقل (transfer-owner). ويقبل `--private-heap-profile-target` القيمة `config` (الافتراضية)، أو `disabled`، أو نطاق `host/block` محددًا بدقة.

للمشغّلين الذين يستخدمون موسِّعات، اضبط `vault/main/extender.yml` بمفاتيح الجذر/المُصدِر الخاصة بالنشر وهوية gossip، وأضف `8083:8083` إلى `WARP_PORTS`، ووجّه `wss://gossip.example.net` إلى مستمعه، وأضف `--gossip-port=8083`. فالقيمة غير الفارغة لـ `gossip_identity_key_hex` تتطلب ذلك المستمع: والإعلان عن gossip دون تشغيله يترك منشورات الموسِّعات المنتظرة في الطابور دون استهلاك. راجع [مواصفات نشر الموسِّع](https://github.com/urnetwork/connect/blob/main/EXTENDER.md). تواصل عمليات نشر Alt وProxy استخدام واجهاتها الأمامية الخاصة؛ وليست مطلوبة لتشغيل مشغّل API/Connect الموصوف هنا.

بمجرد أن يصبح بدء التشغيل في الواجهة سليمًا، أوقفه بـ Ctrl-C واخرج من صدفة مستخدم الخدمة. ثبّت `/etc/systemd/system/ur-operator.service`:

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

عدّل أسماء وحدات الخدمات الداعمة بما يناسب توزيعتك، وأضف وسيط gossip إن كان مضبوطًا. ابدأ الخدمة:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ur-operator
sudo journalctl -u ur-operator -f
```

تحقق من JSON الجاهزية في **كل** خدمة. رمز HTTP 200 وحده لا يكفي؛ يجب أن تكون قيمة كل `status` هي `ok`:

```bash
for port in 8080 8081 8082; do
  curl --fail --silent --show-error "http://127.0.0.1:$port/status" \
    | jq -e '.status == "ok"' || break
done
curl --fail --silent --show-error https://api.example.net/verify/keys
curl --fail --silent --show-error https://api.example.net/sn/epoch
```

تأكد من أن استجابة الحقبة العامة تحدد السلسلة والعقد وخزينة التسوية و`no_id` التي تتوقعها، وأن مرآة السلسلة لدى العامل تتقدّم. تتحقق الجاهزية من آخر ترحيل (migration head) في PostgreSQL ومن Redis قبل تفعيل الخدمات؛ وهي ليست دليلًا على اكتمال قبول المشغّل، ولا على نشر مموَّل/معتمد، ولا على مطالبة متاحة. إن أبلغ فحصٌ عن `error not ready`، فعالج ذلك السبب وأعد التشغيل: فالجاهزية تُحدَّد مرة واحدة عند بدء التشغيل. وللترقيات، خذ نسخة احتياطية من قاعدة البيانات والمُخرَجات، وانشر الموارد المُراجَعة، وطبّق الترحيلات صراحةً، ثم أعد تشغيل الملف التنفيذي وتحقق من جميع المستمعات مجددًا.

عند تفعيل gossip، لا تكون له نقطة نهاية `/status`. تحقق من مستمعه ومن سجلات بدء التشغيل على حدة: تعني `[gossip]not ready` أن مُفرِّغ طابور المنشورات الخاص به لم يبدأ، حتى لو كانت الشبكة المتشابكة (mesh) قادرة على استقبال الرسائل. عالج خطأ الخدمة الداعمة وأعد التشغيل قبل اعتبار نشر gossip جاهزًا.

## الخطوة 7: شغّل أداة الفحص

يُحدَّد موقع المُعدِّنين وتُفحص سلامتهم عبر أنفاق مثبّتة على كل مُعدِّن، لا من شبكة مضيف المشغّل نفسها أبدًا. يشغّل عامل الإنتاج في الملف التنفيذي الموحَّد أجزاء فحص (shards) دائمة؛ اضبط `config/main/provider_egress_probe.yml` بنقاط النهاية الخاصة بك:

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

أنشئ `vault/main/provider_egress.yml` يحتوي على `ingest_secret: "<a separate random ingest secret>"`. ينشئ كل جزء فحص نشط بيانات اعتماده ورصيده الخاصين عند قبوله للتنفيذ؛ وتنظّف المهمة المتكررة `ProberBootstrap` حسابات الأجزاء المنتهية بعد الأعطال. أعد تشغيل `ur-operator init-tasks` بعد تغيير إعدادات الأجزاء. تستخدم فحوص الإنتاج الحالية `url_probe`؛ وتبقى حقول المهام الأقدم `full` و`blackhole` للتوافق. راقب نتائج الفحص وإعادة المحاولات في الطابور قبل قبول المُعدِّنين: فإمكانية الوصول إلى API لا تثبت أن حركة الخروج عبر المُعدِّنين قابلة للاستخدام.

## الخطوة 8: انشر موجز إحصاءاتك وانضم إلى الدليل

دليل المشغّلين على ur.xyz هو السجل المدمج في الموقع في `web/ur.xyz/react/src/lib/network.js` (`NETWORK_OPERATORS`): يُدرج المشغّل نفسه بإضافة مدخل هناك عبر طلب سحب (pull request) يتضمن اسمه، وموقعه، واسم تطبيقه، وعناوين URL للوحة البيانات وGitHub، وصفحاته في متاجر التطبيقات، و`statsUrl` الخاص به. يقرأ الموقع الإجماليات الحية من كل موجز مُدرَج في متصفح الزائر، لذا يجب أن يكون الموجز JSON عامًا مع ترويسة `Access-Control-Allow-Origin` واحدة بالضبط (`*` أو قيمة تعكس الأصل وتشمل `https://ur.xyz`):

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

الحقل `epoch` هو حقبة التسوية الحالية، و`epoch_start` و`epoch_end` حدّاها بثواني unix، و`epoch_start_block` و`epoch_end_block` حدّاها بكتل السلسلة: على الشبكة الرئيسية، تمتد الحقبة n ≥ 1 من الكتلة 9,247,228 + (n − 1) × 50,400 لمدة 50,400 كتلة، والحدّ الذي لم تبلغه السلسلة بعد يُقدَّر بمعدل 12 ثانية للكتلة. القيم التراكمية تخص تلك الحقبة، و`prev_*` تخص الحقبة السابقة لها (احذفها عندما لا توجد حقبة منتهية). والحقل `block` اسم بديل متقادم يساوي `epoch`. يقرأ الموقع الموجز الخالي من `epoch` على أنه الصيغة الأقدم، التي لم تكن نوافذها حقب تسوية: فيشغّل عندئذ ساعة حقب خاصة به ولا يعرض أيًّا من أرقام ذلك الموجز المرتبطة بالنوافذ. و`alpha_usd` هو سعر α الذي ترصده (يأخذ الموقع المتوسط عبر المشغّلين)، و`countries` للعلم فقط. الحقول المفقودة تُقرأ على أنها null، لا صفرًا أبدًا.

## ما يفعله الخادم في كل حقبة

بمجرد وجود `st.yml` يشغّل عامل المهام خط المعالجة من تلقاء نفسه؛ ولا شيء هنا يحتاج إلى مشغّل أمام لوحة المفاتيح:

1. **`StSyncChain`** (كل 5 s) ينسخ ساعة حقب العقد إلى `st_epoch` وRedis (وتُقدَّم عبر `GET /sn/epoch`)، ويتقدّم بمرآة الأحداث المُنهاة، ويستدرك أي حقبة مرّت والعامل متوقف، ويجدول مهام كل حقبة المذكورة أدناه في أوقات مشتقة من الكتل. ساعة العقد هي المرجع؛ ويُعاد التحقق من كل موعد نهائي بالكتل قبل أي إرسال.
2. **`StEpochClose(e)`** يحسب أوراق المدفوعات وجذرها لحقبة مغلقة، ويغلق مجمّعك على السلسلة (`closeOperatorEpoch`، مُوقِّع الجذر)، محتجزًا الإصدار المُحقَّق للمجمّع في خزينة التسوية. يحصل كل مُعدِّن مؤهَّل (`usage_bytes > 0`، وقفزات مُعيَّنة لا تقل عن `reliability_a_min`، وتأكيد واحد على الأقل، ومحفظة، وعدم الارتباط بأسطول في المستوى الأعلى) على `weight = usage_bytes × confirmations / max(assignments, reliability_a_min)`، مجمَّعًا لكل coldkey وموزَّعًا على 10,000 نقطة أساس بالضبط بطريقة الباقي الأكبر. وتُكتب القائمة في مُخرَج مدفوعات موقَّع ومعنون بالمحتوى.
3. **`StCommitRoot(e)`** يثبّت الجذر وتجزئة المُخرَج (`commitOperatorRoot`، مُوقِّع الجذر) داخل نافذة تثبيت الجذر، ويعيد المحاولة كل 5 دقائق، مع تنبيه قبل الموعد النهائي بساعتين.
4. **`StDeposit(e)`** يحدد حجم وديعة الحقبة ويرسلها (`deposit`، مُوقِّع الودائع): يقرأ مُخرَج المدفوعات الموقَّع للحقبة السابقة، ويأخذ منه `total_usage_bytes` و`total_users` (المستخدمون المتمايزون من المستوى الأعلى الذين لهم استخدام عبر العقود في الحقبة، وهو الرقم نفسه الذي يحمله `users` في موجز إحصاءاتك)، ويقرأ قناعتك قبل هذه الحقبة، ويختار المستوى ويحسب `floor(usage_bytes × rate_numerator_rao_per_gib / (GiB × rate_denominator) + users × rate_numerator_rao_per_user / rate_denominator)` بسقف قدره `deposit_epoch_cap_rao`. لا تودِع الحقبة 0 شيئًا؛ وتُتخطّى الوديعة ذات الحجم الصفري؛ وتُتخطّى الوديعة الموجودة على السلسلة بالفعل لهذه الحقبة. وما دامت كل تعرفة مضبوطة تساوي 0 (`deposit_zero_rate_action: equal_demand`، الفترة الأولية)، تسجّل المهمة عملية نشر متخطّاة، ولا ترسل أي معاملة، ولا تحجز nonce، ولا تطلق أي تنبيه؛ ويعرض `bringyourctl st status` الحساب (البايتات، والمستخدمين، والمستوى، والوديعة المطلوبة، أو أن السعر صفر). يُنقل α المُجهَّز إلى hotkey الاحتياطي ويُحوَّل إلى مصبّ الاحتياطي غير القابل للتغيير: فالودائع رهن قناعة ولا تُعاد أبدًا.
5. **`StFinalizePoke(e)`** يستدعي `finalizeOperatorEpoch`، المتاحة للجميع دون إذن، عند كتلة الإنهاء أو بعدها، فيحدّد الاستحقاق (الإصدار المحتجز مضافًا إليه المُرحَّل لدى المشغّل نفسه) لتُفتح المطالبات.

تُسجَّل كل محاولة (`AddStPublish`/`UpdateStPublish`)، ويطابق النشر المعاملات المحفوظة مع حالة السلسلة عبر عمليات إعادة التشغيل. يستخدم التشغيل العادي الملف التنفيذي الموحَّد `ur-operator`. وللتشخيص والاستعادة يدويًا عند الحاجة، ابنِ عميل الإدارة المنفصل من نسخة مصدر الخادم نفسها وثبّته على مضيف المشغّل:

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/bringyourctl ./bringyourctl
sudo install -o root -g root -m 0755 build/bringyourctl /usr/local/bin/bringyourctl
```

شغّله بصفة مستخدم الخدمة مع تحميل `/etc/urnetwork/operator.env` نفسه. هذه أوامر فرعية إدارية لـ `bringyourctl`، لا أوامر فرعية إضافية لـ `ur-operator`:

```text
bringyourctl st status [--epoch=<epoch>]
bringyourctl st deposit [--alpha_rao=<alpha_rao>]
bringyourctl st commit --epoch=<epoch>
bringyourctl st finalize --epoch=<epoch>
```

تظل الوديعة اليدوية عبر `--alpha_rao` محدودة بـ `deposit_epoch_cap_rao`. أما القناعة الطوعية (`addConviction`، وهو المسار نفسه ذو الاتجاه الواحد، ويرفع مستواك دون أن يُحتسب طلبًا) فليست لها مهمة في الخادم؛ إنها معاملة من مُوقِّع ودائعك.

## كيف تُقاس وكيف يُدفع لك

إصدار مجمّع المشغّل ملكٌ لمُعدِّنيه، وتدفع خزينة التسوية المبلغ المحتجز المُحقَّق مقابل جذر المشغّل. يتلقى المزوّدون **الزخم** (momentum): حصة مخصّص المُعدِّنين الأصلي المستخدمة الآن لتشغيل الشبكة، مقسومةً بين مجمّعات المشغّلين وأساطيل المستوى الأعلى. يبلغ الزخم 10% عند الإطلاق. ويتلقى [Network Capacity Reserve](/reserve)، وهو multisig `ur-reserve` بنظام 2 من 3، الباقي: إصدار المُعدِّنين × (1 − الزخم). حصته ليست ثابتة؛ إذ تقل كلما نما الزخم. هذه أهداف توجيه تخضع للإجماع الأصلي ولسلوك وقت التشغيل، وليست مدفوعات ثابتة مضمونة. الاحتياطي الأصلي منفصل عن مصبّ الودائع غير القابل للتغيير وعن أرصدة المطالبات في خزينة التسوية. راجع [تخصيص الاحتياطي الأصلي](https://github.com/urfoundation/sn/blob/main/mainnet/TREASURY-EMISSIONS.md). تأتي إيراداتك كمشغّل من عملك الخاص؛ وتدفع الشبكة الفرعية للمُعدِّنين مقابل نقل تلك الحركة.

- **وزن المجمّع.** في كل tempo يرجّح كل مُصادِق مجمّعك بـ `implied_demand × Q`: إذ إن `implied_demand = bytes × rate0_gib / GiB + users × rate0_user`، أي قيمتا `total_usage_bytes` و`total_users` المدقَّقتان لديك مسعَّرتين بمستوى القناعة الصفري. أما مستواك أنت فهو أعلى مستوى يبلغ α المقفل التراكمي لديك (الودائع مضافًا إليها القناعة الطوعية) قيمةَ `min_conviction_rao` الخاصة به، لذا فإن المشغّل الملتزم، ما دام دون السقف لكل حقبة، يودِع α أقل مقابل الوزن نفسه: فالخصم يغيّر ما تدفعه، لا وزنك. وعندما يقتطع سقف الحقبة مما تدين به، فإنه يقتطع من طلبك بالمعامل نفسه، لذا فعند السقف ترفع تعرفةُ مستوى أدنى وزنَك. و`Q` هي جودة مُعدِّني مجمّعك مرجّحةً بالتعرّض كما تقيسها مسارات ذلك المُصادِق نفسه، محصورةً بـ `quality_transform` في السياسة. يحسب Yuma الأصلي الإجماع من صفوف أوزان المُصادِقين وفق قواعد الإخفاء والقصّ والتطبيع في وقت التشغيل النشط. وما دام السعر المنشور صفرًا، فإن الطلب الضمني لكل مجمّع يساوي 1 بالضبط (راجع [الفترة الأولية](#initial-period)).
- **تدقيق الودائع.** لا يثق المُصادِقون بحسابك لحجم وديعتك. مع `usage_lag_epochs: 1` و`tier_snapshot: conviction_before_epoch`، يقرأ كل مُصادِق جذرك المُثبَّت للحقبة السابقة، ويجلب المُخرَج الموقَّع من API الخاص بك، ويتحقق من تجزئة محتواه ومُوقِّعه وحدوده المُنهاة وجذره، ويعيد حساب الوديعة المطلوبة من `total_usage_bytes` و`total_users`، ويشترط أن تساويها الوديعة المرصودة تمامًا. القاعدة هي `mismatch_action: zero_pool_weight`؛ والجذر أو المُخرَج الذي يظل غير متاح بعد نافذة تثبيت الجذر حكمه `zero_pool_weight_after_root_window`؛ ويجب أن تحمل حقبة الإقلاع (bootstrap) وديعة صفرية. وتضع السياسة أيضًا سقفًا للودائع لكل مشغّل في كل حقبة. وفي ظل سياسة بسعر صفري لا تُدقَّق أي وديعة على الإطلاق: يُسجَّل التدقيق على أنه `zero_price_no_deposit_required`، ويكون مجمّعك مؤهَّلًا أيًّا كان ما أودعته طوعًا.
- **أساطيل المستوى الأعلى.** المُعدِّنون الذين يرتبطون بأسطول في المستوى الأعلى يُرقَّون خارج قائمة مدفوعاتك ما دام الربط قائمًا (`head_fleet_active`)، ويكسبون أصليًا على hotkey أسطولهم؛ ويعودون إلى مجمّعك ابتداءً من الحقبة التي تلي تقادم الربط.
- **التسوية.** حقبة التسوية 50,400 كتلة (نحو 7 أيام) ابتداءً من الحقبة 1 (كانت الحقبة 0 على الشبكة الرئيسية 7,200 كتلة)؛ ونوافذ الشبكة الرئيسية المرجعية هي نافذة لتثبيت الجذر من 1,200 كتلة (+4 h)، والإنهاء عند 14,400 كتلة (+48 h)، ومهلة مطالبة قدرها 8 حقب زائد 1 حقبة سماح، وكلها تحددها السياسة الموقَّعة. البواقي غير المُطالَب بها وغير المُخصَّصة، والإصدار المحتجز لجذرٍ فائت، تُرحَّل إلى حقبتك التالية أنت (`carry_same_operator`)؛ ولا ينتقل شيء بين المشغّلين. المطالبات لا تحتاج إلى إذن، ولا يوقفها أي إيقاف مؤقت للعقد، ولا يمكن لأي ترقية أو إجراء من المالك إعادة كتابة استحقاق مُنهى؛ وحده المفتاح على مستوى السلسلة الذي يعطّل تحويلات الرهن على SN25 يمكنه تجميدها، ولا يمكنه أخذ أي منها أو إعادة توجيهه. وابتداءً من حقبة التحوّل إلى التسوية v2، يُسوّى مجمّعك عبر vault2 بدلًا من ذلك: تتبع حصص مُعدِّنيك الاستخدام المُتحقَّق منه وحده وتتراكم في حسابات لا ينتهي أجلها أبدًا، ولا يدفع أي جذر إلا بعد أن يوافق عليه المُصادِق وتنقضي نافذة اعتراض مدتها 14,400 كتلة.

## ما الذي قد يسوء

- **جذر فائت.** إن لم يُثبَّت الجذر داخل النافذة، تُنهى الحقبة رغم ذلك، ويُرحَّل الإصدار المحتجز إلى حقبتك التالية، ويصفّر المُصادِقون وزن مجمّعك من نهاية النافذة حتى ينجح تدقيق. راقب تنبيه T-2h.
- **وديعة غير مطابقة.** أي اختلاف بين وديعتك وإعادة حساب المُصادِقين (جدول مستويات مختلف في `st.yml`، أو تجاوز يدوي عبر `--alpha_rao`، أو سقف اقتطع من المبلغ) يصفّر المجمّع لتلك الحقبة. أبقِ `deposit_tiers` و`deposit_epoch_cap_rao` مطابقين للسياسة الموقَّعة.
- **وديعة دون الحد الأدنى للتحويل في وقت التشغيل.** يفحص الخادم كل وديعة مسبقًا مقابل `minimumTransferTaoRao` غير القابل للتغيير في خزينة التسوية بسعر α الحالي، ويرفض (دون حجز nonce) أي مبلغ قائم على الاستخدام تقل قيمة نقله إلى الاحتياطي عن الحد الأدنى؛ وتُسجَّل النتيجة فاشلةً لتلك الحقبة ولا تُعاد محاولتها.
- **عدد قليل جدًا من المشغّلين.** تحدد السياسة الموقَّعة الحد الأدنى من المشغّلين السليمين والمُصادِقين النشطين (واحد من كلٍّ منهما في سياسة SN25، واثنان من كلٍّ منهما في سياسة الشبكة التجريبية)؛ ويتوقف المُصادِقون عن التوجيه دونه.
- **مُعدِّنون بلا محافظ أو تعرّض.** المُعدِّنون الذين تنقصهم محفظة مطالبة أو الذين لديهم قفزات مُعيَّنة أقل من `reliability_a_min` لا يحصلون على ورقة (leaf)، والمُعدِّن الذي يُرى خلف أكثر من عنوان خروج واحد لا تُعيَّن له قفزات على الإطلاق حتى يعود إلى عنوان واحد. يبقى المسار غير الموقَّع `POST /sn/wallet` مغلقًا ما لم تضبط `wallet_allow_unsigned: true`؛ فالتطبيقات توقّع تحدي المحفظة.
- **مُخرَج لا يستطيع مُصادِقوك جلبه.** يجلب المُصادِقون المُخرَجات من API الخاص بك حسب تجزئة المحتوى. أبقِ مخزن الكائنات (blob store) ومسارات `/sn/artifact` قابلة للوصول؛ فالتضارب (مُخرَجان لحقبة واحدة) فشلٌ في التدقيق.

## الفترة الأولية

عند الإطلاق تكون [ورقة الأسعار](/price) المنشورة **0 α لكل GiB و0 α لكل مستخدم**، وتنص سياسة الشبكة الرئيسية الموقَّعة على هذا السعر الصفري صراحةً: تعرفة كل مستوى لكل GiB ولكل مستخدم هي 0، و`zero_rate_action: equal_demand` مضبوط. ما دام السعر صفرًا، لا يقدّم المشغّلون ودائع طلب: فلا يُطلب أيٌّ منها ولا يُدقَّق أيٌّ منها. انسخ الجدول نفسه إلى `st.yml` مع `deposit_zero_rate_action: equal_demand` (يرفض الخادم من دونه جدول مستويات كل تعرفاته صفرية، كي لا يحدث السعر الصفري بالخطأ أبدًا)؛ عندئذ لا يدين `StDeposit` بشيء، ولا يرسل أي معاملة، ولا يطلق أي تنبيه، ويُبلغ `bringyourctl st status` أن السعر صفر. يمنح المُصادِقون كل مجمّع مشغّل مسجَّل الطلب الضمني نفسه (1 بالضبط)، فتُقسَّم قناة المجمّعات حسب جودتها المقاسة وحدها؛ والوديعة الطوعية أو قفل القناعة (يبقى `addConviction` متاحًا ويظل يرفع مستواك لما بعد) لا يفيد مجمّعك ولا يضره. وتبقى قناة المستوى الأعلى، وتقسيم `theta`، وحصر الجودة، وقاعدة التنازل دون تغيير، ويعمل خط معالجة الحقب لديك فيما عدا ذلك كما ورد أعلاه تمامًا: فلا يزال مُخرَج المدفوعات (الذي يحمل الآن أيضًا `total_users`) وتثبيت الجذر مطلوبَين كي يطالب مُعدِّنوك. يخضع قبول المشغّلين لموافقة المالك عند الإطلاق، لذا يسجّل مالك الشبكة الفرعية المشغّل الجديد على المنسّق بعد المراجعة. هذا وضع إطلاق مقصود ريثما تُنقّى الشبكة من الأخطاء؛ تابع موجز RSS الخاص بورقة الأسعار لترى التغيير الذي يبدأ به جمع الودائع.
