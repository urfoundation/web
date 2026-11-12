---
published: 2026-10-21
description: ثبّت مُعدِّن UR. المُثبِّتات لأنظمة Linux وmacOS وWindows مع التحديثات التلقائية، والتنزيل اليدوي، وبناء provider من المصدر.
---

# تثبيت المُعدِّن

المُعدِّن برنامج واحد، `provider`. هناك ثلاث طرق للحصول عليه:

| الطريقة | الأنظمة | التحديثات | الأنسب لـ |
| --- | --- | --- | --- |
| [المُثبِّت](#the-installers) | Linux, macOS, Windows | تلقائية | معظم الناس |
| [التنزيل اليدوي](#manual-download) | Linux, macOS, Windows | تلقائية، مع `provider setup` | التحكم الكامل |
| [البناء من المصدر](#build-from-source) | Linux, macOS, Windows | يدوية | المطوّرون والمدقّقون |

أيًّا كانت الطريقة التي تختارها، يحتفظ المُعدِّن بهويته في `~/.urnetwork` (`%USERPROFILE%\.urnetwork` في Windows)، لذا يمكنك التبديل لاحقًا دون التسجيل مرة أخرى. خذ نسخة احتياطية من ذلك المجلد أولًا، وأوقف المهمة الخلفية للطريقة القديمة قبل بدء الجديدة، كي لا تعمل نسختان في الوقت نفسه أبدًا. بعد التثبيت، عُد إلى [البدء السريع](/docs/miner#2-run-setup).

## المُثبِّتات

يضع كل مُثبِّت المُعدِّن في مجلد المستخدم الخاص بك (دون الحاجة إلى صلاحيات المسؤول)، ويشغّله في الخلفية، ويبقيه محدَّثًا، ويمنحك أمرًا واحدًا لإدارة كل ذلك: `urnet-tools`. توجد المُثبِّتات في [مجلد `scripts` في urnetwork/connect](https://github.com/urnetwork/connect/tree/main/scripts).

المُثبِّتات الثلاثة كلها:

- تنزّل أحدث نسخة لمعالجك، وتتحقق منها مقابل قيمة SHA-256 التي يدرجها GitHub لها (وهذا يكشف التنزيل التالف)، ولا تثبّت إلا البرنامج الخاص بجهازك؛
- تثبّت المُعدِّن باسم **`urnetwork`**: اكتب `urnetwork` حيثما يقول هذا الدليل `provider`، بما في ذلك الأوامر التي يطبعها المُعدِّن لتنسخها؛
- تطلب رمز المصادقة إن لم تكن قد سجّلت الدخول بعد (اضغط Enter لتفعل ذلك لاحقًا؛ يسجّل `--auth-code <code>`، أو `-AuthCode` في Windows، الدخول دون سؤال، لكنه يترك الرمز في سجل الأوامر في الصدفة؛ أما `URNETWORK_AUTH_CODE` أو الموجّه فلا يتركانه)؛
- تسجّل جهازًا جديدًا عند أول تشغيل له، بمجرد تسجيل دخولك؛
- تفعّل [التحديثات التلقائية](/docs/miner/updates)، كل 6 ساعات افتراضيًا؛
- يمكن تشغيلها مجددًا في أي وقت: التشغيل الثاني يحدّث في المكان نفسه ويحتفظ بإعداداتك وهويتك.

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

ثم افتح طرفية جديدة، أو شغّل سطر `export PATH=…` الذي يطبعه. يعمل على معالجات Intel وAMD وARM بمعمارية 64 بت و32 بت، بما في ذلك Raspberry Pi 2 أو أحدث بنظام تشغيل 32 بت (لا Pi Zero ولا Pi 1)، ويحتاج إلى `curl` أو `wget`، وإلى `jq` أو `python3` (لدى معظم الأنظمة واحد منها). وهو:

- يثبّت `urnetwork` و`urnet-tools` في `~/.local/share/urnetwork-provider/bin` ويضيف ذلك المجلد إلى `PATH` في `~/.bashrc` (وينشئه إن لزم) وفي `~/.zshrc` إن كان لديك. مرّر `-B` لتركهما دون تغيير. إن لم تجد طرفية جديدة `urnetwork`، فشغّل سطر `export PATH=…` الذي طبعه المُثبِّت؛
- يشغّل المُعدِّن كخدمة مستخدم في systemd، هي `urnetwork.service`، مع مؤقّت للتحديثات، ويفعّل خاصية lingering كي تواصل الخدمة العمل بعد تسجيل خروجك (وإن احتاج ذلك إلى مسؤول، يطبع أمر `sudo loginctl enable-linger` لتشغيله)؛
- في صدفة بلا جلسة مستخدم لـ systemd (صدفة `sudo su`، وكثير من الحاويات، وWSL)، يثبّت على أي حال، لكن دون خدمة في الخلفية أو تحديثات تلقائية، ويخبرك كيف تشغّل المُعدِّن في الواجهة. شغّل `urnet-tools update` بنفسك من حين إلى آخر. وإذا شُغّل بصلاحيات root في صدفة كهذه، فإنه يثبّت خدمة نظام بدلًا من ذلك.

يحدد `--interval 6h` أو `daily` أو `weekly` أو `monthly` عدد مرات التحقق من التحديثات.

لا تستطيع خدمة المستخدم الاستماع على منفذ TCP رقم 443، الذي يحتاج إليه [موسِّع](/docs/miner/extender) المُعدِّن. يشغّل `--system` المُعدِّن كخدمة نظام بدلًا من ذلك، لكن باسم مستخدمك، مع إذن بالاستماع على المنافذ الأدنى من 1024:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

شغّله باسمك، لا باستخدام `sudo`؛ سيطلب كلمة مرور `sudo` مرة واحدة. راجع [اسمح للمُعدِّن بالاستماع على المنفذ 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).

تأتي الخيارات بعد `sh -s --`، مثل `curl -fsSL … | sh -s -- --no-start`. شغّله مع `--help` لرؤيتها كلها.

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

ثم افتح نافذة Terminal جديدة. يحتاج إلى macOS 12 أو أحدث ولا شيء آخر، ويعمل على أجهزة Mac بمعالج Apple silicon وIntel (حتى من طرفية Rosetta، إذ يختار البناء الأصلي). وهو:

- يثبّت `urnetwork` و`urnet-tools` في `~/.local/share/urnetwork-provider/bin` ويضيف ذلك المجلد إلى `PATH` في `~/.zshrc` (وفي `~/.bash_profile` إن كنت تستخدم bash). مرّر `-B` لتركهما دون تغيير؛
- يشغّل المُعدِّن كوكيل launchd يبدأ عند تسجيل دخولك ويعيد تشغيل المُعدِّن إن تعطّل. قد يعرض macOS إشعار "Background Items Added"؛ وهذا متوقع. يظهر باسم `urnet-tools` ضمن System Settings ← General ← Login Items؛
- يزيل عنك علامة الحجر الصحي عن التنزيل، ويرفض العمل باستخدام `sudo`.

في macOS، يطبع `--dry-run` كل ما كان سيفعله دون تغيير أي شيء، ويجيب `-y` عن كل سؤال بنفسه. سجل المُعدِّن موجود في `~/Library/Logs/urnetwork/`.

### Windows

في نافذة PowerShell عادية (ليس عبر "Run as administrator"):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

يعمل في Windows PowerShell 5.1 وPowerShell 7، على معالجات Intel أو AMD بمعمارية 64 بت وعلى ARM64. وهو:

- يثبّت `urnetwork.exe` و`urnet-tools` وأداة التحديث في `%LOCALAPPDATA%\urnetwork\provider` ويضيف ذلك المجلد إلى `PATH`. افتح نافذة جديدة بعد ذلك؛
- بعد تسجيل دخولك، يسألك هل تريد تشغيل المُعدِّن في الخلفية، الآن وكلما سجّلت الدخول إلى Windows. يعمل مخفيًا، من اختصارات في مجلد Startup، لذا **يتوقف عند تسجيل خروجك**. إن سجّلت الدخول لاحقًا، فشغّل `urnet-tools auto-start on` و`urnet-tools start`؛
- يثبّت `urnet-tools.cmd` بجانب `urnet-tools.ps1`. إن قال PowerShell "running scripts is disabled"، فاكتب `urnet-tools.cmd` بدلًا من `urnet-tools`.

`urnetwork.exe` غير موقَّع رقميًا، لذا قد يطلب SmartScreen أو Defender التأكيد قبل تشغيله. خيارات Windows بأسلوب PowerShell: `-Tag` و`-AuthCode` و`-NoStart` و`-NoAutoUpdate` و`-AddToStartup` و`-NoStartup` و`-NonInteractive`. تثبيت إصدار برمجي محدد باستخدام `-Tag` يترك التحديثات التلقائية متوقفة. لا يمكن تمرير هذه الخيارات عبر `irm … | iex`: احفظ السكربت وشغّله، مثل `powershell -ExecutionPolicy Bypass -File .\Provider_Install_Win32.ps1 -NoStart`، أو اضبط `$env:URNETWORK_AUTH_CODE` قبل سطر `irm`. يسرد `Get-Help .\Provider_Install_Win32.ps1 -Detailed` جميعها.

### الإدارة باستخدام urnet-tools

| الأمر | ما يفعله |
| --- | --- |
| `urnet-tools status` | النسخة، وهل سجّلت الدخول، وهل يعمل المُعدِّن، وهل يبدأ ويتحدّث من تلقاء نفسه. |
| `urnet-tools start`, `stop`, `restart` | بدء المُعدِّن العامل في الخلفية أو إيقافه أو إعادة تشغيله. |
| `urnet-tools logs` | متابعة سجل المُعدِّن؛ Ctrl-C للخروج. |
| `urnet-tools version` | النسخة المثبّتة، وأحدث نسخة إن كانت أحدث منها. |
| `urnet-tools update` | التحديث الآن (المُعدِّن و`urnet-tools` نفسه). |
| `urnet-tools auto-update`, `auto-update on`, `off` | عرض التحديثات التلقائية أو تغييرها؛ راجع [التحديثات](/docs/miner/updates). |
| `urnet-tools auto-start on`, `off` | بدء المُعدِّن عند الإقلاع أو تسجيل الدخول، أو عدم بدئه. |
| `urnet-tools reinstall -t <version>` | تثبيت نسخة محددة. |
| `urnet-tools uninstall` | إزالة المُعدِّن مع الاحتفاظ بهويتك. |

يسرد `urnet-tools --help` كل شيء لنظامك (في Windows: `urnet-tools help`). تُكتب الخيارات بالصيغة `--option value` أو `--option=value`؛ وفي Windows تكون بأسلوب PowerShell، مثل `-Interval` و`-RemoveIdentity`.

### إلغاء التثبيت

```bash
urnet-tools uninstall
```

يزيل المُعدِّن ومهمته الخلفية ومدخله في `PATH`، و**يحتفظ** بهويتك في `~/.urnetwork`، لتتمكن من التثبيت مجددًا لاحقًا بوصفك الجهاز نفسه. لحذف الهوية أيضًا، أضف `--remove-identity` (`-RemoveIdentity` في Windows)؛ سيطلب منك كتابة `delete` أولًا. [خذ نسخة احتياطية منها](/docs/miner/run#back-up-your-miner) قبل ذلك: فمن دونها لا يمكن استعادة الجهاز.

## التنزيل اليدوي

لكل نسخة على [صفحة نسخ build](https://github.com/urnetwork/build/releases) ملف اسمه `urnetwork-provider-<version>.tar.gz`. إنه تنزيل كبير (نحو 240 MB)، لأنه يضم برنامج `provider` واحدًا لكل نظام، في المسار `<os>/<arch>/provider` (`provider.exe` في Windows). ويضم أيضًا بناءات MIPS لأجهزة التوجيه (الراوترات).

| حاسوبك | المجلد في التنزيل |
| --- | --- |
| حاسوب أو خادم Linux (Intel أو AMD، 64 بت) | `linux/amd64` |
| Raspberry Pi 3 أو 4 أو 5 بنظام تشغيل 64 بت، أو أي Linux آخر على ARM بمعمارية 64 بت | `linux/arm64` |
| حاسوب Linux أقدم بمعالج Intel أو AMD بمعمارية 32 بت | `linux/386` |
| Raspberry Pi 2 أو 3 أو 4 أو 5، أو لوحة ARMv7 أخرى، بنظام تشغيل 32 بت (لا Pi Zero ولا Pi 1) | `linux/arm` |
| Mac بمعالج Apple silicon (M1 أو أحدث) | `darwin/arm64` |
| Mac بمعالج Intel | `darwin/amd64` |
| حاسوب Windows (Intel أو AMD، 64 بت) | `windows/amd64` |
| Windows على ARM | `windows/arm64` |

على Linux أو macOS، نزّله وثبّته في `~/.local/bin`، مختارًا مجلدك من الجدول:

```bash
VERSION=<version>   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-provider.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-provider-${VERSION}.tar.gz"
tar -xzf urnetwork-provider.tar.gz linux/amd64/provider            # your folder from the table
mkdir -p "$HOME/.local/bin"
install -m 755 linux/amd64/provider "$HOME/.local/bin/provider"   # your folder from the table
export PATH="$HOME/.local/bin:$PATH"
provider --version
```

أضف سطر `export PATH=…` إلى ملف بدء التشغيل الخاص بصدفتك (`~/.bashrc` في معظم أنظمة Linux، و`~/.zshrc` في macOS) كي يُعثر على الأمر في الطرفيات الجديدة.

في macOS، يوضع الملف المنزَّل بمتصفح ويب (لا باستخدام `curl` كما أعلاه) في الحجر الصحي ولا يعمل. أزل الحجر مرة واحدة:

```bash
xattr -d com.apple.quarantine "$HOME/.local/bin/provider"
```

في Windows، في PowerShell، ضعه في مجلد تملكه، كي تتمكن التحديثات من استبداله:

```powershell
$Version = "<version>"   # the latest tag on the releases page, without the leading v
$Arch = "amd64"          # or arm64, from the table
$Dir = "$env:LOCALAPPDATA\Programs\urnetwork"
New-Item -ItemType Directory -Force $Dir | Out-Null
$ProgressPreference = "SilentlyContinue"
Invoke-WebRequest -UseBasicParsing -OutFile "$env:TEMP\urnetwork-provider.tar.gz" "https://github.com/urnetwork/build/releases/download/v$Version/urnetwork-provider-$Version.tar.gz"
tar -xzf "$env:TEMP\urnetwork-provider.tar.gz" -C $env:TEMP "windows/$Arch/provider.exe"
Move-Item -Force "$env:TEMP\windows\$Arch\provider.exe" "$Dir\provider.exe"
& "$Dir\provider.exe" --version
```

شغّله بالصيغة `& "$Dir\provider.exe"`، أو أضف ذلك المجلد إلى `PATH` لتكتب `provider`. `provider.exe` غير موقَّع رقميًا، لذا قد يطلب SmartScreen أو Defender التأكيد قبل تشغيله.

ثم عُد إلى [البدء السريع](/docs/miner#2-run-setup) وشغّل `provider setup`. تُبقي خدمته الخلفية التثبيت اليدوي محدَّثًا أيضًا؛ راجع [التحديثات](/docs/miner/updates).

## البناء من المصدر

استخدم إصدار Go الذي يطلبه `sn/go.mod` (حاليًا Go 1.27.3) والمراجعات المطابقة للمستودعات الشقيقة التي تشير إليها توجيهات `replace` فيه. يجب أن يبدو مجلد المصدر هكذا:

```text
urnetwork/
├── sn/                 # github.com/urfoundation/sn
├── connect/            # includes connect/sctp
├── sdk/
├── server/
├── warp/
├── proxy/
├── userwireguard/
├── glog/
├── goidenticons/
└── gvisor/             # matching generated Go source selected by the release
```

الاستبدالات المحلية جزء من البناء: استخدم نسخ المصدر المطابقة أو حزمة المصدر الخاصة بالنسخة التي تنشرها. لا تكفي نسخة من `sn` وحدها. احصل على مصدر `gvisor` المولَّد المطابق مع تلك الحزمة؛ فمراجعة عشوائية من المصدر الأصلي ليست بديلًا قابلًا لإعادة الإنتاج.

من مجلد `sn`:

```bash
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/provider" ./cli/miner
export PATH="$HOME/.local/bin:$PATH"
provider --help
```

البناء الخاص بك يعرض `development build` ولا يحدّث نفسه أبدًا. حدّثه بإعادة البناء.

## ملف تنفيذي من مشغّلك

يمكنك أيضًا تشغيل ملف `provider` تنفيذي يبنيه مشغّلك من مصدر النسخة نفسها.
