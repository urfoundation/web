---
published: 2026-10-21
description: شغّل مُعدِّن UR يومًا بيوم. ابدأه وأوقفه، واختر مشغّلًا، وأبقِه يعمل في الخلفية، واقرأ سجلاته وصفحة حالته، وخذ نسخة احتياطية منه.
---

# تشغيل المُعدِّن ومراقبته

تفترض هذه الصفحة أنك [ثبّتّ](/docs/miner/install) المُعدِّن و[أعددته](/docs/miner#2-run-setup). إن استخدمت مُثبِّتًا، فاكتب `urnetwork` حيثما تقول هذه الصفحة `provider`.

## البدء والإيقاف

للتعدين في طرفية:

```bash
provider start
```

يعرض عرضًا حيًا قصيرًا (Connecting وConnected و● Mining) ويعمل حتى توقفه بالضغط على Ctrl-C. يذهب السجل المفصّل إلى `miner.log` في `~/.urnetwork`؛ أضف `-v` لتراه في الطرفية بدلًا من ذلك.

يسأل أول بدء على جهاز جديد قبل تسجيله، ويحفظ هويته في `~/.urnetwork`. ويعيد كل بدء لاحق استخدام تلك الهوية. في سكربت، حيث لا أحد يستطيع الإجابة، أضف `--allow-client-registration` إلى البدء الأول. `provider provide` هو الأمر نفسه مع الإخراج الكامل للسجل، للسكربتات والخدمات.

لا تسجّل إلا جهازًا جديدًا حقًا. لا يستبدل التسجيل أبدًا هوية يملكها المُعدِّن بالفعل، لكن لا تحذف ملفات لتتجاوز خطأً عن هوية مفقودة أو غير مطابقة: راجع [استكشاف الأخطاء وإصلاحها](/docs/miner/troubleshooting#the-miner-stops-straight-away) بدلًا من ذلك.

شغّل كل أوامر المُعدِّن، والخدمة في الخلفية، باسم المستخدم نفسه. لكل مستخدم `~/.urnetwork` الخاص به.

## اختيار مشغّل

يخدم المُعدِّن المشغّل الافتراضي `bringyour.com` (`https://api.bringyour.com` و`wss://connect.bringyour.com`)، ما لم تختر مشغّلًا آخر. لخدمة مشغّل مختلف، اختره **قبل** البدء الأول، باستخدام عناوين URL التي ينشرها:

```bash
provider network use https://api.example.net wss://connect.example.net
provider network
```

تبدأ عناوين URL للواجهة البرمجية بـ `https://` وعناوين URL للاتصال بـ `wss://` (لا يعمل `http://` و`ws://` العاديان إلا مع خادم اختبار محلي). يعرض `provider network` وحده المشغّل الساري، ويعيدك `provider network reset` إلى الافتراضي. يُحفظ الاختيار ويسري على كل أمر لاحق. ثم شغّل `provider setup`، أو `provider login`، برمز مصادقة من ذلك المشغّل.

لا ينقل تغيير المشغّل جهازًا مسجّلًا بالفعل إلى المشغّل الجديد. أبقِ كل مشغّل في حالته وحسابه الخاصين. لخدمة كل المشغّلين في القائمة المنشورة دفعة واحدة، راجع [التعدين لكل مشغّل مُدرَج](/docs/miner/advanced#mine-every-listed-operator).

## التشغيل في الخلفية

### باستخدام مُثبِّت

تشغّل [المُثبِّتات](/docs/miner/install#the-installers) المُعدِّن في الخلفية بالفعل: خدمة مستخدم في systemd على Linux (أو، عند التثبيت مع `--system`، [خدمة نظام تعمل باسمك](/docs/miner/extender#with-the-linux-installer))، ووكيل launchd على macOS، واختصارات Startup على Windows. أدِره باستخدام `urnet-tools`:

```bash
urnet-tools start          # start it (no error if it's already running)
urnet-tools status         # version, signed in, running, updates; exits 3 when it isn't running
urnet-tools logs           # follow its log; Ctrl-C to stop reading
urnet-tools restart
urnet-tools stop           # stop it until you start it again, restart (Linux) or log in again (macOS, Windows)
urnet-tools auto-update off   # turn automatic updates off; `on` turns them back on
```

إن تخطّيت تسجيل الدخول عند التثبيت، فشغّل `urnetwork login`، ثم `urnet-tools start`: يسجّل الجهاز ويبدأ المُعدِّن. راجع [التحديثات](/docs/miner/updates) لمعرفة كيف تعمل التحديثات التلقائية.

على Linux وWindows، تعمل `provider service start` و`stop` و`status` و`logs` مع مُعدِّن المُثبِّت أيضًا.

يبدأ من تلقاء نفسه عند الإقلاع على Linux (عندما تكون lingering مفعّلة؛ ويحاول المُثبِّت تفعيلها)، وعند تسجيل دخولك على macOS، وعند تسجيل دخولك على Windows، حيث **يتوقف أيضًا عند تسجيل خروجك**. يمنع `urnet-tools auto-start off` بدءه من تلقاء نفسه، ويعيد `urnet-tools auto-start on` تفعيل ذلك.

إن تعطّل المُعدِّن، يعيد systemd تشغيله على Linux بعد 30 ثانية، ويعيده launchd على macOS بعد 60. على Windows، يبقى المُعدِّن الذي يتوقف متوقفًا حتى تشغّل `urnet-tools start` أو تسجّل الدخول مجددًا. والمُعدِّن الذي يتوقف توقفًا سليمًا، مثلًا لأن الجهاز [غير مسجّل](/docs/miner/troubleshooting#the-miner-stops-straight-away)، يبقى متوقفًا: ويقول `urnet-tools status` حينها إنه لا يعمل.

### باستخدام خدمة provider

يعرض `provider setup` إعداد ذلك. للقيام به بنفسك، أوقف المُعدِّن إن كان يعمل في طرفية، ثم:

```bash
provider service install
```

يبدأ المُعدِّن الآن، ويبدأه مجددًا من تلقاء نفسه، ويعيد تشغيله إن تعطّل، ويتحقق من [التحديثات](/docs/miner/updates) كل 6 ساعات:

- **Linux:** خدمة مستخدم في systemd، هي `urnetwork-provider.service`، تبدأ عند الإقلاع. تفعّل lingering كي تواصل الخدمة العمل بعد تسجيل خروجك، أو تطبع أمر `sudo loginctl enable-linger` لتشغيله.
- **macOS:** وكيل launchd يبدأ عند تسجيل دخولك. سجله هو `service.log` في `~/.urnetwork`.
- **Windows:** تطبيق Startup يبدأ المُعدِّن مخفيًا عند تسجيل دخولك إلى Windows، ويتوقف عند تسجيل خروجك. لا يحتاج إلى صلاحيات المسؤول. سجله هو `service.log` في `%USERPROFILE%\.urnetwork`.

لإدارتها:

```bash
provider service status
provider service logs --follow   # Ctrl-C to stop reading
provider service restart
provider service stop
provider service uninstall       # your sign-in and identity are kept
```

على خادم، أو للتعدين لكل مستخدمي الحاسوب على Linux أو macOS، استخدم خدمة على مستوى النظام تعمل بصلاحيات root، وحالتها في `/var/lib/urnetwork`: `sudo provider setup --system`، أو `sudo provider service install --system`. أضف `--system` إلى أوامر `provider service` الأخرى لإدارتها. لا توجد خدمة على مستوى النظام في Windows. على Linux، لا تستطيع خدمة المستخدم الاستماع على منفذ TCP رقم 443 لموسِّع المُعدِّن؛ ويشغّله `sudo "$(command -v provider)" service install --system --as="$USER"` كخدمة نظام تبقى باسم مستخدمك ويمكنها الاستماع على ذلك المنفذ. راجع [اسمح للمُعدِّن بالاستماع على المنفذ 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443). لأجهزة كثيرة، يُجري `provider setup --yes --auth-code-file=<path>` الإعداد دون أي أسئلة؛ لكنه يتخطى خطوة الدفع، لذا [اضبط محفظة الدفع](/docs/miner/rewards#set-your-payout-wallet) بعد ذلك.

على Linux وWindows، لن يضيف `provider service install` مُعدِّنًا ثانيًا بجانب مُعدِّن المُثبِّت. على macOS لا يستطيع رؤية وكيل المُثبِّت، لذا إن استخدمت مُثبِّت macOS، فواصل استخدام `urnet-tools` ولا تثبّت خدمة ثانية.

### خدمة خاصة بك

لتشغيل المُعدِّن بخيارات خاصة بك، أو دون systemd أو launchd، شغّل `provider provide` ضمن مدير الخدمات الخاص بك، أو `tmux` أو `screen`. على Linux، مثلًا، أنشئ `~/.config/systemd/user/ur-miner.service`:

```ini
[Unit]
Description=UR miner

[Service]
ExecStart=%h/.local/bin/provider provide
Restart=on-failure
RestartPreventExitStatus=3
RestartSec=10
UMask=0077

[Install]
WantedBy=default.target
```

أوقف المُعدِّن إن كان يعمل، ثم فعّل الخدمة وتابع سجلها:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ur-miner.service
journalctl --user -u ur-miner.service -f
```

لإبقائها تعمل بعد تسجيل خروجك، فعّل lingering مرة واحدة: `sudo loginctl enable-linger "$USER"`. لا تضع `--allow-client-registration` في أمر الخدمة، كي توقف الهوية المفقودة الخدمة بدلًا من تسجيل جهاز جديد دون أن تلاحظ. لا تشغّل هذه الخدمة و`provider service` في الوقت نفسه. الخدمة الخاصة بك لا تحدّث المُعدِّن؛ راجع [التحديثات](/docs/miner/updates#without-automatic-updates).

## التحقق من أنه يعمل

### الحالة والتشخيص

```bash
provider status
```

سطر واحد لكل من المُعدِّن، وتسجيل الدخول، وتسجيل الجهاز، والاتصال، والتحديثات، والأمر الذي يجب تشغيله بعد ذلك عندما يكون هناك خلل. ينتهي بالرمز 0 عندما يكون كل شيء على ما يرام، و3 عندما يحتاج الجهاز إلى الإعداد، و4 عندما لا يعمل المُعدِّن أو لا يكون متصلًا. يطبع `provider status --json` المعلومات نفسها للسكربتات والمراقبة.

```bash
provider doctor
```

يبحث عن سبب عجز المُعدِّن عن تسجيل الدخول أو الاتصال: هل مجلد الحالة خاص، وDNS، والاتصال بالمشغّل، ووكيل أو جدار حماية يفحص TLS، والساعة، وهل يمكن تثبيت التحديثات. ويسمّي الحل لكل مشكلة يجدها.

### السجل

يكتب `provider start` سجله في `miner.log` في `~/.urnetwork`. لمُعدِّن يعمل في الخلفية، استخدم `provider service logs --follow`، أو `urnet-tools logs` مع مُثبِّت.

يكتب المُعدِّن أسطرًا كثيرة في السجل، بعدة صيغ؛ ومعظمها روتيني. هذه الأسطر علامات جيدة:

- `"event":"identity_available"`: وجد هوية هذا الجهاز أو أنشأها.
- يواصل المُعدِّن العمل. إن توقف من تلقاء نفسه خلال بضع ثوانٍ، فهناك خطأ ما، حتى لو بدا خروجه سليمًا.

علامات التحذير:

- سطر JSON يحوي `"event":"startup_recovery_required"`، ثم يخرج البرنامج: راجع [استكشاف الأخطاء وإصلاحها](/docs/miner/troubleshooting#the-miner-stops-straight-away).
- تكرار كلمة `refused` كل بضع ثوانٍ: المشغّل لا يقبل الاتصال. راجع [استكشاف الأخطاء وإصلاحها](/docs/miner/troubleshooting#the-log-keeps-saying-refused).

أضف `-v`، أو `-vv` لمزيد، لرؤية تفاصيل أكثر.

### صفحة الحالة

يمكن للمُعدِّن تقديم صفحة حالة صغيرة بصيغة JSON. وهي متوقفة افتراضيًا؛ فعّلها باستخدام `--port`:

```bash
provider provide --port=8080
```

ثم، على الجهاز نفسه:

```bash
curl -s http://127.0.0.1:8080/
```

تعرض `version` للمُعدِّن (لبناءات النسخ الرسمية رقم نسخة)، واسم المضيف `host`، وقسم `diagnostics` بآخر نتيجة لتسجيل الدخول (`authentication`) و`keys` و`extender` و`runtime`. لا يعني `"status":"ok"` في المستوى الأعلى إلا أن عملية المُعدِّن تعمل؛ ولا يعني أنه متصل أو يكسب، لذا اقرأ `diagnostics` أيضًا.

تستمع صفحة الحالة على كل واجهات الشبكة، لا على الواجهة المحلية فقط. احظر ذلك المنفذ في جدار الحماية، أو اسمح بشبكة المراقبة الخاصة بك فقط.

## خيارات مفيدة

| الخيار | ما يفعله |
| --- | --- |
| `--max-memory=1gib` | هدف مرن للذاكرة، بالبايت أو مع `b` أو `kib` أو `mib` أو `gib`. من دونه يختار المُعدِّن هدفًا وفق ذاكرة الحاسوب. |
| `-v`, `-vv` | تفاصيل أكثر في السجل. |
| `--port=<port>` | تقديم [صفحة الحالة](#the-status-page) على ذلك المنفذ. `0`، وهو الافتراضي، يوقفها. |

يسجّل `provider auth-provide` الدخول ويبدأ بأمر واحد. لا يزال الجهاز الجديد يحتاج إلى `--allow-client-registration`. كل الخيارات موجودة في `provider help all` وفي [المرجع](/docs/miner/reference).

## خذ نسخة احتياطية من مُعدِّنك

كل ما يجعل هذا الجهاز مُعدِّنك *أنت* موجود في `~/.urnetwork`: مفتاح هويته، وتسجيله، وتسجيل دخوله، وسجل محفظتك الموقَّع. إن فقدته، لا يمكنك استعادة الجهاز، حتى لو ظللت قادرًا على تسجيل الدخول إلى حسابك.

- أوقف المُعدِّن (أو خدمته) قبل نسخ المجلد، كي لا يُكتب شيء نصف كتابة.
- انسخ المجلد **بأكمله**، وأبقِ النسخة خاصة، واستعدها كقطعة واحدة.
- لا تشغّل أبدًا نسختين من المجلد نفسه في الوقت نفسه، على جهاز واحد أو جهازين.

يسرد [المرجع](/docs/miner/reference#files-the-miner-keeps) كل ملف في المجلد.
