---
description: ثبّت مُصادِق SN25 الحالي وشغّله، وجهّز مفاتيحه وإعداداته الإنتاجية، وراقب التحقق، واسحب مكافآت المُصادِق الأصلية.
---

# كيف تشغّل مُصادِقًا

يعمل مُصادِق UR على **Bittensor SN25، netuid 25**. يقيس [`sn/validator`](https://github.com/urfoundation/sn/tree/main/validator) الحالي المزوّدين عبر مسارات `/verify`، ويحتفظ بأدلة موقَّعة، ويرسل أوزان المُعدِّنين الناتجة عبر commit-reveal الأصلي. تؤدي عملية `validator` واحدة القياس وإرسال الأوزان معًا.

يكسب المُصادِقون **توزيعات Bittensor الأصلية**. وهي منفصلة عن مكافآت المزوّدين التي يُطالَب بها من خزينة التسوية في UR. لا يوجد في النسخة 1.0 أمر `validator claim` ولا مكافأة على جهد المُصادِق. إجراء السحب موضّح أدناه.

يغطي هذا الدليل مُصادِق SN25. أما **المُصادِق الجذري على netuid 0** فله تسجيل وتشغيل ومطالبات سلة منفصلة؛ والتسجيل على الجذر لا يبدأ تحقق UR. راجع [دليل المُعدِّن](/docs/miner) و[دليل مشغّل الشبكة](/docs/operator) لأدوار UR الأخرى.

## قبل أن تبدأ

جهّز هذه المدخلات للنشر الذي تنوي الانضمام إليه:

- مضيف Linux، وتخزين دائم، ووصول مستمر إلى واجهة HTTPS البرمجية ونقل WSS لكل مشغّل مُعَدّ، إضافة إلى نقاط نهاية RPC للنشر: EVM عبر HTTP(S) والأصلية عبر WS(S). تتطلب فحوص وحدات التخزين الدائمة على الشبكة الرئيسية نظام Linux، مع أن الملف التنفيذي يمكن بناؤه لـ macOS أيضًا.
- محفظة coldkey في Bittensor فيها أموال للتسجيل والرهن ورسوم المعاملات. احتفظ بها على الجهاز المستخدم لعمليات المحفظة. يحتاج المُصادِق العامل إلى الـ hotkey الخاص به ومفاتيح العميل لكل مشغّل، لا إلى coldkey.
- hotkey مسجّل في SN25 بوزن رهن كافٍ للحصول على تصريح مُصادِق (validator permit). التسجيل وعتبة الرهن وعدد التصاريح من حالة السلسلة، وليست مبالغ ثابتة في هذا الدليل. تشرح صفحة [Bittensor validator permits](https://www.bittensor.com/docs/guides/validating) كيف تُحدَّد الأهلية.
- **إعدادات إنتاجية schema-3** كاملة ومعتمدة بشكل مستقل، وموافقات وقت التشغيل والسياسة التي تشير إليها، وملفات التفعيل والسجل لكل مشغّل. احصل عليها للـ hotkey الفعلي ونشرك ومسارات مضيفك قبل بدء الخدمة.
- مجلدات حالة مُجهَّزة، وإعلان وحدة تخزين دائمة مثبَّت ببصمة SHA-256 لتلك المجلدات. يتطلب البدء على الشبكة الرئيسية هذا الإعلان ويتحقق من هوية التخزين الفعلية.

يقبل الملف التنفيذي الإنتاجي الحالي نشرًا مُجهَّزًا بمخطط schema-3. أما أوامره `init --config` و`register` و`stake add` و`activate` و`status --config` فلا تزال تستخدم المحمِّل الأقدم السابق للتفعيل، الذي يرفض schema 3. وهي لا توفر تمهيدًا ذاتي الخدمة للشبكة الرئيسية الحالية. استخدم خطوات المحفظة الأصلية أدناه للتسجيل والرهن؛ وجهّز أدلة الشبكة الرئيسية ومدخلات الموافقة عبر عملية التمهيد الخاصة بالنشر. تغيير رقم المخطط أو نسخ إعدادات الشبكة التجريبية لا ينتج تلك المدخلات. هذا الحد موثّق في [قبول وقت التشغيل الإنتاجي](https://github.com/urfoundation/sn/blob/main/mainnet/VALIDATOR-PRODUCTION-RUNTIME.md).

## 1. احصل على المُصادِق

نزّل نسخة رسمية من المُصادِق، أو ابنِه من المصدر.

### تنزيل نسخة

يُوزَّع المُصادِق باسم `urnetwork-validator-<version>.tar.gz` على [صفحة نسخ build](https://github.com/urnetwork/build/releases). يضم الأرشيف ملفًا تنفيذيًا واحدًا لكل منصة في المسار `<os>/<arch>/validator`، لنظامي Linux وmacOS. يشغّل مُصادِق الشبكة الرئيسية الملف التنفيذي لـ Linux، `linux/amd64` أو `linux/arm64` (راجع [قبل أن تبدأ](#before-you-start)):

```bash
VERSION=2026.10.6-1065506180   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-validator.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-validator-${VERSION}.tar.gz"
tar -xzf urnetwork-validator.tar.gz
install -d "$HOME/.local/bin"
install -m 755 linux/amd64/validator "$HOME/.local/bin/validator"   # choose your os/arch
"$HOME/.local/bin/validator" --help
```

أضف `$HOME/.local/bin` إلى `PATH` للأوامر أدناه. سجّل نسخة الإصدار البرمجي مع الملف التنفيذي كي يتمكن نشر لاحق من إعادة إنتاجها.

### أو البناء من المصدر

ابنِ من مراجعة `sn` المختارة لنشرك. استخدم إصدار Go المعلن في [`sn/go.mod`](https://github.com/urfoundation/sn/blob/main/go.mod) ونسخًا مطابقة من المستودعات الشقيقة لتوجيهات `replace` المحلية فيه: `connect` (بما في ذلك `sctp`)، و`sdk`، و`server`، و`warp`، و`proxy`، و`userwireguard`، و`glog`، و`goidenticons`، و`gvisor`.

من جذر مستودع `sn`:

```bash
go build -trimpath -o ./bin/validator ./cli/validator
install -d "$HOME/.local/bin"
install -m 755 ./bin/validator "$HOME/.local/bin/validator"
"$HOME/.local/bin/validator" --help
```

أضف `$HOME/.local/bin` إلى `PATH` للأوامر أدناه. نقطة الدخول التنفيذية هي `cli/validator`؛ و`validator/` هو التنفيذ القابل للاستيراد، لذا لا ينتج `go build ./validator` الملف التنفيذي للخدمة. سجّل مراجعة المصدر مع الملف التنفيذي كي يتمكن نشر لاحق من إعادة إنتاجها.

## 2. أنشئ مفاتيح الخدمة

أنشئ المفاتيح باسم الحساب الذي سيملك الملفات الخاصة للمُصادِق، بعد أن يجهّز مسؤول المضيف التخزين الخاص به. يستخدم هذا المثال المشغّلَين `1` و`2`؛ استبدلهما بمعرّفات المشغّلين الفعلية وأدرج كل مشغّل في إعدادات نشرك:

```bash
umask 077
validator init --state_dir=/var/lib/ur-validator --no_id=1 --no_id=2
```

ينشئ هذا `/var/lib/ur-validator/hotkey.seed` و`no-<id>/client.key` لكل مشغّل، بالأذونات `0600`. ويطبع عنوان SS58 والمفتاح العام للـ hotkey، و`vpk` العام لكل مفتاح عميل. تُعاد استخدام بذور seed الموجودة. الـ hotkey من نوع sr25519؛ ومفاتيح العميل لكل مشغّل من نوع Ed25519. احتفظ بالمفاتيح الأصلية مع الحالة الأصلية عبر عمليات إعادة التشغيل، وخذ لها نسخًا احتياطية خاصة. لا تشارك أبدًا مفتاح عميل أو مجلد حالة بين مشغّلين أو مُصادِقين.

تعمل صيغة `init` التي تأخذ مجلد الحالة قبل وجود إعدادات إنتاجية. إن كنت تشغّل بالفعل الـ hotkey المسجّل، فجهّز seed الموجود الخاص به بدلًا من توليد هوية مختلفة. يقبل ملف seed الخاص بالـ hotkey 32 بايتًا خامًا أو 64 حرفًا ست عشريًا، مع البادئة الاختيارية `0x`. أبقِ ملفات seed الخاصة بالعملاء لكل مشغّل في صيغتها المولَّدة. لا تمرّر مادة seed كوسيطة في الصدفة ولا تضعها في إعدادات YAML.

## 3. سجّل وارهن على SN25

على **جهاز محفظة coldkey**، ثبّت Bittensor CLI الحالي باتباع [تعليمات التثبيت الرسمية](https://www.bittensor.com/docs/quickstart). تستخدم الأمثلة التالية واجهة الأوامر الحالية v11؛ تحقق من `btcli --version` ومن [دليل الترحيل](https://www.bittensor.com/docs/migration) إن كانت لديك خيارات `--wallet.name` أقدم.

اضبط عنوان الـ hotkey العام على `hotkey ss58` الذي طبعه `validator init`، واختر محفظة coldkey الموجودة لديك. لا تحتوي هذه المتغيرات على أسرار:

```bash
VALIDATOR_WALLET='your-coldkey-wallet-name'
VALIDATOR_HOTKEY='your-validator-hotkey-ss58'

btcli -n finney query subnet-hyperparameters --netuid 25 --json
btcli -n finney query metagraph --netuid 25 --json
```

افحص توافر التسجيل الحالي وتكلفته قبل الإرسال. عاين [التسجيل](https://www.bittensor.com/docs/tx/burned-register) مسبقًا، ثم أرسل العملية نفسها مع التأكيد:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY"
```

إن كان الـ hotkey مسجّلًا بالفعل للـ coldkey المقصود، فأبقِ ذلك التسجيل. التسجيل وحده لا يمنح تصريح مُصادِق.

اختر مقدار TAO الذي سترهنه بناءً على شروط الأهلية الحالية ورصيدك المتاح، مع ترك أموال للرسوم. أدخل ذلك المقدار عند الطلب:

```bash
read -r -p 'TAO amount to stake: ' VALIDATOR_STAKE_TAO
btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO"
```

يحوّل [`add-stake`](https://www.bittensor.com/docs/tx/add-stake) رموز TAO إلى alpha الخاصة بـ SN25 بسعر المجمّع. راجع رسوم المعاينة وحماية السعر قبل التأكيد. وتحقق من [metagraph](https://www.bittensor.com/docs/query/metagraph) مجددًا بعد الإنهاء ومنح التصريح؛ يجب أن تطابق الـ hotkey الخاص بك، وcoldkey المالك له، والـ UID، والرهن، وتصريح المُصادِق المدخلاتِ الإنتاجية.

يحتفظ الملف التنفيذي لـ SN أيضًا بالأمرين `validator register` و`validator stake add` للإعدادات التي يقبلها محمِّله الأقدم. ويعملان افتراضيًا كتشغيل تجريبي حتى `--apply`، ويأخذان ملف seed لـ coldkey، ويعبّران عن مبالغ الرهن بوحدة **rao**. وهما ليسا بديلًا عن إعداد schema-3 للشبكة الرئيسية الموصوف هنا.

## 4. صادِق لدى كل مشغّل

استخدم بيانات اعتماد حساب وهوية عميل منفصلة لكل مشغّل مُعَدّ. للمشغّل المرجعي، احصل على رمز مصادقة من [ur.io/?auth](https://ur.io/?auth)، ثم شغّل:

```bash
validator auth --api_url=https://api.bringyour.com
install -m 600 "$HOME/.urnetwork/jwt" /var/lib/ur-validator/no-1/network.jwt
```

لمشغّل آخر، استخدم واجهته البرمجية الفعلية ومسار تسجيل الدخول الخاص به، ثم انسخ الرمز المميز الصادر حديثًا إلى مجلد ذلك المشغّل. يستبدل `validator auth -f --api_url=...` صراحةً الملف المؤقت `$HOME/.urnetwork/jwt`؛ ويطلب `validator auth --user_auth=... --api_url=...` كلمة مرور بدلًا من ذلك.

يجد `validator auth --operator=<domain>` المشغّل في [قائمة المشغّلين](/operators.yml) المنشورة بدلًا من أخذ `--api_url`، ويكتب رمزه المميز في `<state_dir>/operators/<domain>/jwt`؛ ومجلد الحالة الافتراضي هو `~/.urnetwork/validator`. ومن هناك يقرؤه [قياس كل مشغّل مُدرَج](#measure-every-listed-operator-without-weights). ومع `--hotkey_seed_file=<path>`، يسجّل `validator auth` الدخول بالـ hotkey، كمحفظة TAO، بدلًا من رمز مصادقة أو كلمة مرور. ولا تقرأ الإعدادات الإنتاجية إلا مسارات `network_jwt_file` التي تسمّيها.

تسمّي إعدادات كل مشغّل `network_jwt_file` و`client_jwt_file` و`client_key_seed_file`. ويرتبط JWT العميل بمفتاح العميل الأصلي وهويته. يمكن للإعدادات الإنتاجية أن تأذن صراحةً بالتسجيل الأول عبر `allow_client_registration: true`؛ ودون هذا الإذن الموقَّع، قدّم بيانات اعتماد العميل الموجودة. قد تُبقي واجهة تسجيل برمجية غير مدعومة، أو تسجيل دخول مفقود، أو عدم تطابق في الهوية القياسَ في حالة انتظار. حافظ على الهوية الموجودة عند استعادة المصادقة.

## 5. جهّز الإعدادات الإنتاجية والأدلة

استخدم ملف `release.yml` المعتمد الكامل، لا نسخة معدّلة يدويًا من إعدادات موقَّعة. فيما يلي قائمة المدخلات لـ [`ReleaseConfig`](https://github.com/urfoundation/sn/blob/main/validator/config.go) الحالية:

| المُدخل | ما يجب تجهيزه |
| --- | --- |
| الهوية الإنتاجية | `schema_version: 3`، و`production: true`، و`release: "1.0"`، و`deployment_id` الخاص بالنشر، و`validator_id` غير الصفري الخاص بك. |
| الشبكة والعقود | على الشبكة الرئيسية `chain_id: 964` و`netuid: 25`، و`genesis_hash` و`coordinator` و`settlement_vault` و`deploy_block` الفعلية. |
| وقت التشغيل | `runtime_spec` و`transaction_version` و`state_version` و`runtime_code_hash` و`runtime_metadata_hash` بعد مراجعتها، إضافة إلى نوافذ الكتل والحقب الأصلية المحدودة في الموافقة وقدرة المُنتِج. |
| السياسة والجدولة | `policy` كاملة، و`policy_hash` المطابق لها، و`version_key`، و`trail_depth` مساويًا لعمق المسار في السياسة، و`poll_seconds` من 1 إلى 60. |
| الموافقة الاقتصادية الأصلية | `treasury_approval` أو `owner_recycle_approval` الموقَّعة بشكل مستقل للنشر، مع المُوقِّع العام المستقل، والمسار الدقيق لملف الموافقة وطوله بالبايت وبصمة SHA-256 الخاصة به. والمُحدِّدان متنافيان. |
| الاتصالات | نقاط نهاية `rpc` صريحة لـ EVM عبر HTTP(S) ونقاط نهاية `substrate` الأصلية عبر WS(S). |
| ملفات الخدمة الخاصة | `state_dir` و`hotkey_seed_file` والحالة وبيانات الاعتماد المنفصلة لكل مشغّل. |
| دليل المشغّلين | لكل مشغّل `no_id` و`api_url` و`connect_url` و`artifact_signer` منفصل، ومسارات بيانات الاعتماد والمفاتيح، و`concurrency`. أدرج ما لا يقل عن `policy.safety.minimum_healthy_no_count` من المشغّلين. |
| الاستقلالية | يسرد `controlled_no_ids` المشغّلين الذين تتحكم فيهم، كي تُحجب مجمّعاتهم وأساطيل المستوى الأعلى المرتبطة بهم. |
| الأدلة | حدود `evidence_v2` الكاملة، ولكل مشغّل `activation` و`vpk_signature` و`hotkey_signature` و`context` و`history` و`replay_scratch_root` و`seal_scratch_root`. تثبّت مراجع الملفات المسار والبايتات وبصمة SHA-256. |
| أدلة الطلبات الأصلية | `request_receipt_scope` و`request_preparation` الخاصة بالنشر للمشغّلين الذين يستخدمون مسار إيصالات الطلبات الأصلي، مع تخزينهم المُجهَّز. |
| سجل التجديد | أي `production_runtime_approvals` و`production_authority_history` مختارة، ومراجعة السعة المطلوبة لإعادة تشغيل العمل الموجود تحت صلاحيته الأصلية. |

مسار الخزانة الإنتاجي الحالي وصيغة موافقته موصوفان في [الخزانة الأصلية في الإنتاج](https://github.com/urfoundation/sn/blob/main/validator/TREASURY-PRODUCTION.md). يتلقى المُصادِقون بيانات توجيه الخزانة العامة؛ والمفتاح الخاص للخزانة ليس شرطًا مسبقًا للمُصادِق.

حدّد حجم المضيف وفق حدود الأدلة والسجل المعتمدة وجميع عمّال المسارات المُعَدّين. يجب أن تكون قيمة `concurrency` لكل مشغّل بين 1 و128، وأن تبقى ضمن الحد الأقصى للمسارات النشطة في السياسة، وأن تتيح لكل عامل دخول بوابة seed محدودة المعدّل قبل انتهاء مهلة الخطوة. وزيادة التزامن أو حدود القرص في إعدادات موقَّعة تتطلب بديلًا معتمدًا.

تربط سجلات التفعيل هوية العميل لكل مشغّل بالـ hotkey المسجّل لمُصادِقك، مع كلا التوقيعين ونشر مُنهى في سجل الأدلة. ويجب أن يغطي سياقها وسجلها حدّ التسوية الأولي المُعَدّ. تتحقق الخدمة الإنتاجية من صحة هذه المدخلات قبل أن تبدأ عملًا جديدًا. ولا يكفي مدخل `evidence_v2.operators` فارغ على الشبكة الرئيسية. ولا يستطيع المسار الأقدم `validator activate --config=...` إنتاج هذه المدخلات من إعدادات schema-3.

أبقِ المسارات ثابتة عند التجهيز. تُحلّ المسارات النسبية بالنسبة إلى مجلد الإعدادات، وقد يغيّر نقل الإعدادات معناها. فيما يلي تخطيط نموذجي:

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

هذه مسارات أمثلة، لا بديل عن المسارات في حزمتك المعتمدة. تحتاج الملفات الخاصة إلى ملكية وأذونات محمية؛ ويجب أن تستخدم مجلدات البروتوكول التخزين الدائم المُجهَّز. إنشاء مجلدات فارغة وحده لا يجهّز سجلات المحاولات ولا يحل محل سجلها المحفوظ. ضع ملف التقدّم خارج كل مجلدات البروتوكول والمفاتيح وبيانات الاعتماد والأدلة، في مجلد أب موجود غير قابل للكتابة من المجموعة أو الآخرين.

## 6. شغّل المُصادِق وراقبه

اضبط بصمة **SHA-256 المقبولة بشكل مستقل** لإعلان التخزين الدائم؛ ولا تستبدل بها بصمة محسوبة حديثًا لتجاوز عدم تطابق. افحص المجلدات المُجهَّزة قبل البدء:

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

ينفّذ الأمر في الواجهة تحققًا حقيقيًا، ويمكنه إرسال الأوزان بمجرد استيفاء الشروط المعتمدة. شغّل عملية واحدة بالضبط لكل hotkey ونطاق حالة. استخدم الوسائط نفسها ضمن مدير الخدمات الخاص بنشرك؛ واحتفظ بالسجلات الأصلية والمعاملات المعلّقة الموقَّعة عند إعادة التشغيل. عالج أي رفض يتعلق بالحفظ أو الإعدادات قبل إعادة التشغيل بدلًا من حذف الحالة أو توليد مفاتيح بديلة.

يتبع `--operators-refresh=1h` [قائمة المشغّلين](/operators.yml) المنشورة، ويعيد جلبها كل ساعة، دون تغيير ما يوقّعه المُصادِق أو يرجّحه: لا يُرجَّح إلا المشغّلون المثبَّتون في الإعدادات الموقَّعة، وتعمل النسخة تمامًا كما تعمل دون هذا الخيار. تُخزَّن القائمة مؤقتًا باسم `operators.yml` في `state_dir` الخاص بالإعدادات. عند البدء ومع كل تغيير في القائمة، يكتب المُصادِق تقرير انحراف في السجل ويحفظه في `operators-report.json` بجانب تلك النسخة المؤقتة. يُظهر التقرير كل مشغّل مثبَّت، مطابَقًا مع القائمة بعنوان URL للواجهة البرمجية، على أنه مُدرَج أو محذوف من القائمة مع أي عدم تطابق في عنوان URL للاتصال، وكل مشغّل مُدرَج لا تثبّته الإعدادات. إنه مخرجات تشغيلية؛ ولا شيء يقرؤه مجددًا.

مع `--operators-refresh`، يتبع `--operators-url=<url>` قائمة أخرى، ويقيس `--observe-unpinned-operators` أيضًا كل مشغّل مُدرَج لا تثبّته الإعدادات، للمراقبة فقط، ضمن `observed-operators/<domain>/` في `state_dir` الخاص بالإعدادات. تسجّل المراقبة الدخول وتُجهّز باستخدام `hotkey_seed_file` الخاص بالإعدادات، ولا تصل نتائجها أبدًا إلى الأوزان أو الأدلة أو الحالة الإنتاجية. ويحتفظ المشغّلون المثبَّتون بملف `network_jwt_file` المُعَدّ لهم؛ وإن كان مفقودًا يُبلَّغ عنه ولا يُنشأ أبدًا.

راقب stderr و[سجل التقدّم](https://github.com/urfoundation/sn/blob/main/mainnet/SERVICE-PROGRESS.md) محدود الحجم. تحقق من عدة إشارات منفصلة:

- يُظهر `heartbeat_at` و`publisher.last_success_at` الحديثان نشاط العملية والنشر.
- تكشف سجلات `intent` حدود المعاملات المُجهَّزة والمُنهاة والمطبَّقة. والمعاملة المُرسلة أو المعلّقة ليست بعد متجه أوزان مطبَّقًا.
- يُظهر `settlement` مؤشر الحقبة الدائم وأعمال النشر المعلّقة.
- تُظهر تشخيصات مصادقة المشغّلين والمسارات هل يمكن للقياس أن يتقدم لكل مشغّل.
- انحراف قائمة المشغّلين ليس في سجل التقدّم. ومع `--operators-refresh` يكون في السجل وفي `operators-report.json`.
- تُظهر قراءات metagraph الأصلية هل لا يزال الـ hotkey يحتفظ بالـ UID والتصريح ويتلقى التوزيعات.

قد يكون انتظار حقبة أمرًا طبيعيًا؛ ونبضة حديثة وحدها لا تثبت نجاح التحقق. يرفض `validator status --config` الحالي schema 3، لذا استخدم سجل التقدّم وسجلات الخدمة وقراءات السلسلة الأصلية لهذا المسار الإنتاجي. ودون `--config`، يكون `validator run` وضع قياس قديمًا فقط ولا يكتب أوزان النسخة أبدًا.

### قِس كل مشغّل مُدرَج دون أوزان

يقيس `validator run --all-operators` كل مشغّل في قائمة المشغّلين المنشورة ولا يكتب أوزانًا أبدًا. لكل مشغّل حالته الخاصة ضمن `<state_dir>/operators/<domain>/`: الرمز المميز `jwt`، ومفتاح القياس `.validator.key`، وJWT العميل `.validator.jwt`. ولا يُستخدم `<state_dir>/.validator.key` و`~/.urnetwork/jwt` الخاصان بالمشغّل الواحد.

```bash
validator run --all-operators --auto-register \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

- يسجّل `--auto-register` الدخول بالـ hotkey، كمحفظة TAO، حيث لا يملك المشغّل رمزًا مميزًا. ولا يُجهّز هوية قياس إلا لمجلد مشغّل جديد تمامًا، ولا يستعيد هوية موجودة أبدًا ولا يتبناها ولا يستبدلها. يجب أن يكون ملف seed موجودًا بالفعل؛ فهو لا يُنشأ أبدًا.
- دون `--auto-register`، يكتب المشغّل الذي لا يملك رمزًا مميزًا في السجل `operator <domain> is awaiting auth: validator auth --operator=<domain>` ويُتحقق منه مجددًا كل خمس دقائق. ويُرفض المجلد الذي لا يملك هوية قياس وتُعاد محاولته، ويسمّي السجل الخيارات التي تجهّزها.
- تُخزَّن القائمة مؤقتًا باسم `<state_dir>/operators.yml` وتُجلب مجددًا كل ساعة، أو كل `--operators-refresh`، وهي مدة بصيغة Go لا تقل عن `1m`. ويتبع `--operators-url=<url>` قائمة أخرى. وتبقى آخر نسخة سليمة قيد الاستخدام ما دام تعذّر جلب القائمة.
- يبدأ المشغّل المُدرَج حديثًا، ويتوقف المشغّل المحذوف من القائمة مع الاحتفاظ بحالته، ويُعاد تشغيل المشغّل الذي تتغير عناوين URL الخاصة به. ويُعاد تشغيل المشغّل الفاشل بعد 30 ثانية، مع مضاعفة المدة حتى 10 دقائق، ولا يوقف الآخرين أبدًا.

## 7. اجمع مكافآت المُصادِق

تتراكم توزيعات مُصادِق SN25 عبر محاسبة الرهن الأصلية في Bittensor. يتحكم coldkey الخاص بك في مركزك الخاص؛ أما الرهن المفوَّض ومكافآته فتعود إلى coldkeys المفوِّضة، بعد اقتطاع حصة المُصادِق. لا يتولى منسّق UR ولا خزينة التسوية حفظ توزيعات المُصادِقين. أما `provider claim` و`snclaim submit` وأدلة Merkle لمدفوعات المشغّل فهي لمسار مكافآت المُعدِّنين والمزوّدين.

لإعادة alpha المتاحة في SN25 إلى **TAO حرة**، فكّ رهن المقدار الذي تختاره من الـ hotkey الفعلي الذي يحمل ذلك المركز. استخدم جهاز محفظة coldkey ومتغيرات المحفظة العامة نفسها من الخطوة 3. افحص مراكزك أولًا واختر المقدار بوحدة **alpha**، لا TAO:

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

يقدّر [عرض السعر](https://www.bittensor.com/docs/query/quote-unstake) ناتج TAO والرسوم والانزلاق السعري. بعد التحقق من التشغيل التجريبي والرهن المتبقي، أرسل مع التأكيد التفاعلي:

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA"

btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
```

يبادل [`remove-stake`](https://www.bittensor.com/docs/tx/remove-stake) رموز alpha المتاحة بـ TAO ويضيفها إلى الرصيد الحر لـ coldkey الموقِّع. تحقق من نتيجة المعاملة المُنهاة والأرصدة المحدَّثة. يحتوي مركزك المتراكم على رأس المال والمكافآت معًا: لا يوجد في SN25 رصيد منفصل لـ «المطالبة بأرباحي فقط». قد يؤثر سحب الرهن في تصريحك؛ وقد تحدّ الأقفال والضمانات والرسوم وحماية سعر المجمّع من العملية. إن كانت مكافآتك قد وُجّهت إلى hotkey رهن آخر، فاختر ذلك المركز الفعلي.

**مكافآت الجذر مختلفة.** إن كنت ترهن أيضًا على netuid 0، فلعائد سلّته مسار مطالبة جذر أصلي منفصل قبل السحب. اتبع [تعليمات Bittensor بشأن رهن الجذر وتوزيعاته](https://www.bittensor.com/docs/guides/staking#root-stake-and-dividends). لا تستخدم مطالبة الجذر لجمع مكافآت alpha العادية في SN25.
