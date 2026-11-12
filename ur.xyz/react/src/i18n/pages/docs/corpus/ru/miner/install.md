---
published: 2026-10-21
description: Установка майнера UR. Установщики для Linux, macOS и Windows с автоматическими обновлениями, загрузка вручную и сборка provider из исходного кода.
---

# Установка майнера

Майнер — это одна программа, `provider`. Получить её можно тремя способами:

| Способ | Системы | Обновления | Кому подходит |
| --- | --- | --- | --- |
| [Установщик](#the-installers) | Linux, macOS, Windows | Автоматически | Большинству |
| [Загрузка вручную](#manual-download) | Linux, macOS, Windows | Автоматически, с `provider setup` | Тем, кому нужен полный контроль |
| [Сборка из исходного кода](#build-from-source) | Linux, macOS, Windows | Вручную | Разработчикам и аудиторам |

Какой бы способ вы ни выбрали, майнер хранит свою идентичность в `~/.urnetwork` (`%USERPROFILE%\.urnetwork` в Windows), поэтому позже вы сможете перейти на другой способ без повторной регистрации. Сначала сделайте резервную копию этой папки и остановите фоновую задачу старого способа, прежде чем запускать новый, чтобы две копии никогда не работали одновременно. После установки вернитесь к [быстрому старту](/docs/miner#2-run-setup).

## Установщики

Каждый установщик помещает майнер в вашу пользовательскую папку (права администратора не нужны), запускает его в фоне, поддерживает в актуальном состоянии и даёт одну команду для управления всем этим: `urnet-tools`. Они находятся в [папке `scripts` репозитория urnetwork/connect](https://github.com/urnetwork/connect/tree/main/scripts).

Все три установщика:

- загружают последний выпуск для вашего процессора, сверяют его с контрольной суммой SHA-256, которую для него указывает GitHub (так обнаруживается повреждённая загрузка), и устанавливают только программу для вашей машины;
- устанавливают майнер под именем **`urnetwork`**: пишите `urnetwork` везде, где в этом руководстве написано `provider`, в том числе в командах, которые майнер выводит для копирования;
- запрашивают код авторизации, если вы ещё не вошли (нажмите Enter, чтобы сделать это позже; `--auth-code <code>`, или `-AuthCode` в Windows, выполняет вход без запроса, но оставляет код в истории командной оболочки; `URNETWORK_AUTH_CODE` или запрос его не оставляют);
- регистрируют новое устройство при первом запуске, как только вы вошли;
- включают [автоматические обновления](/docs/miner/updates), по умолчанию каждые 6 часов;
- их можно запустить снова в любой момент: повторный запуск обновляет установку на месте и сохраняет ваши настройки и вашу идентичность.

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

Затем откройте новый терминал или выполните строку `export PATH=…`, которую выведет установщик. Он работает на 64- и 32-битных Intel, AMD и ARM, в том числе на Raspberry Pi 2 и новее с 32-битной ОС (но не на Pi Zero или Pi 1), и ему нужен `curl` или `wget`, а также `jq` или `python3` (в большинстве систем что-то из этого есть). Он:

- устанавливает `urnetwork` и `urnet-tools` в `~/.local/share/urnetwork-provider/bin` и добавляет эту папку в ваш `PATH` в `~/.bashrc` (создавая его при необходимости) и в `~/.zshrc`, если он у вас есть. Передайте `-B`, чтобы не трогать эти файлы. Если новый терминал всё равно не находит `urnetwork`, выполните строку `export PATH=…`, которую вывел установщик;
- запускает майнер как пользовательскую службу systemd, `urnetwork.service`, с таймером обновлений и включает lingering, чтобы служба продолжала работать после выхода из системы (если для этого нужен администратор, он выведет команду `sudo loginctl enable-linger`, которую нужно выполнить);
- в командной оболочке без пользовательского сеанса systemd (оболочка `sudo su`, многие контейнеры, WSL) всё равно выполняет установку, но без фоновой службы и автоматических обновлений, и объясняет, как запустить майнер на переднем плане. Время от времени запускайте `urnet-tools update` сами. При запуске от root в такой оболочке он вместо этого устанавливает системную службу.

`--interval 6h`, `daily`, `weekly` или `monthly` задаёт, как часто проверять обновления.

Пользовательская служба не может слушать TCP-порт 443, который нужен [экстендеру](/docs/miner/extender) майнера. `--system` запускает майнер как системную службу, по-прежнему от имени вашего пользователя, с разрешением слушать порты ниже 1024:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

Запускайте его от своего имени, а не через `sudo`; он один раз спросит ваш пароль `sudo`. См. [Разрешите майнеру слушать порт 443](/docs/miner/extender#linux-let-the-miner-listen-on-port-443).

Параметры указываются после `sh -s --`, например `curl -fsSL … | sh -s -- --no-start`. Запустите его с `--help`, чтобы увидеть их все.

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

Затем откройте новое окно Terminal. Нужна macOS 12 или новее и больше ничего; установщик работает на Mac с Apple silicon и с Intel (и из терминала Rosetta тоже — он выбирает нативную сборку). Он:

- устанавливает `urnetwork` и `urnet-tools` в `~/.local/share/urnetwork-provider/bin` и добавляет эту папку в ваш `PATH` в `~/.zshrc` (и в `~/.bash_profile`, если вы используете bash). Передайте `-B`, чтобы не трогать эти файлы;
- запускает майнер как агент launchd, который стартует при входе в систему и перезапускает майнер, если тот аварийно завершился. macOS может показать уведомление «Background Items Added» — это ожидаемо. В System Settings → General → Login Items он указан как `urnet-tools`;
- снимает с загрузки флаг карантина за вас и отказывается работать через `sudo`.

В macOS `--dry-run` выводит всё, что установщик сделал бы, ничего не меняя, а `-y` сам отвечает на все вопросы. Журнал майнера находится в `~/Library/Logs/urnetwork/`.

### Windows

В обычном окне PowerShell (не «Запуск от имени администратора»):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Установщик работает в Windows PowerShell 5.1 и PowerShell 7, на 64-битных Intel или AMD и на ARM64. Он:

- устанавливает `urnetwork.exe`, `urnet-tools` и средство обновления в `%LOCALAPPDATA%\urnetwork\provider` и добавляет эту папку в ваш `PATH`. После этого откройте новое окно;
- после входа спрашивает, запускать ли майнер в фоне — сейчас и при каждом входе в Windows. Майнер работает скрыто, через ярлыки в папке «Автозагрузка», поэтому он **останавливается, когда вы выходите из системы**. Если вы войдёте в аккаунт позже, выполните `urnet-tools auto-start on` и `urnet-tools start`;
- устанавливает `urnet-tools.cmd` рядом с `urnet-tools.ps1`. Если PowerShell сообщает «running scripts is disabled», вводите `urnet-tools.cmd` вместо `urnet-tools`.

`urnetwork.exe` не подписан цифровой подписью, поэтому SmartScreen или Defender могут запросить подтверждение перед его запуском. Параметры для Windows — в стиле PowerShell: `-Tag`, `-AuthCode`, `-NoStart`, `-NoAutoUpdate`, `-AddToStartup`, `-NoStartup`, `-NonInteractive`. Установка определённой версии с `-Tag` оставляет автоматические обновления выключенными. Эти параметры нельзя передать через `irm … | iex`: сохраните скрипт и запустите его, например `powershell -ExecutionPolicy Bypass -File .\Provider_Install_Win32.ps1 -NoStart`, или задайте `$env:URNETWORK_AUTH_CODE` перед строкой с `irm`. `Get-Help .\Provider_Install_Win32.ps1 -Detailed` выводит их все.

### Управление через urnet-tools

| Команда | Что она делает |
| --- | --- |
| `urnet-tools status` | Версия, выполнен ли вход, работает ли майнер, запускается ли он сам и обновляется ли. |
| `urnet-tools start`, `stop`, `restart` | Запустить, остановить или перезапустить фоновый майнер. |
| `urnet-tools logs` | Следить за журналом майнера; Ctrl-C, чтобы выйти. |
| `urnet-tools version` | Установленная версия и последняя, если она новее. |
| `urnet-tools update` | Обновить сейчас (майнер и сам `urnet-tools`). |
| `urnet-tools auto-update`, `auto-update on`, `off` | Показать или изменить автоматические обновления; см. [Обновления](/docs/miner/updates). |
| `urnet-tools auto-start on`, `off` | Запускать майнер при загрузке или входе в систему — или нет. |
| `urnet-tools reinstall -t <version>` | Установить определённый выпуск. |
| `urnet-tools uninstall` | Удалить майнер, сохранив вашу идентичность. |

`urnet-tools --help` выводит всё, что доступно для вашей системы (в Windows: `urnet-tools help`). Параметры записываются как `--option value` или `--option=value`; в Windows они в стиле PowerShell, например `-Interval` и `-RemoveIdentity`.

### Удаление

```bash
urnet-tools uninstall
```

Команда удаляет майнер, его фоновую задачу и его запись в `PATH` и **сохраняет** вашу идентичность в `~/.urnetwork`, чтобы позже вы могли установить его снова как то же устройство. Чтобы удалить и идентичность, добавьте `--remove-identity` (`-RemoveIdentity` в Windows); сначала вас попросят ввести `delete`. Перед этим [сделайте резервную копию](/docs/miner/run#back-up-your-miner): без неё устройство не восстановить.

## Загрузка вручную

У каждого выпуска на [странице выпусков build](https://github.com/urnetwork/build/releases) есть файл `urnetwork-provider-<version>.tar.gz`. Это большая загрузка (около 240 MB), потому что в ней по одной программе `provider` для каждой системы, по пути `<os>/<arch>/provider` (`provider.exe` в Windows). В ней также есть сборки MIPS для роутеров.

| Ваш компьютер | Папка в загрузке |
| --- | --- |
| ПК или сервер с Linux (Intel или AMD, 64-бит) | `linux/amd64` |
| Raspberry Pi 3, 4 или 5 с 64-битной ОС или другой 64-битный ARM Linux | `linux/arm64` |
| Старый 32-битный ПК с Linux на Intel или AMD | `linux/386` |
| Raspberry Pi 2, 3, 4 или 5 либо другая плата ARMv7 с 32-битной ОС (не Pi Zero и не Pi 1) | `linux/arm` |
| Mac с Apple silicon (M1 или новее) | `darwin/arm64` |
| Mac с процессором Intel | `darwin/amd64` |
| ПК с Windows (Intel или AMD, 64-бит) | `windows/amd64` |
| Windows на ARM | `windows/arm64` |

В Linux или macOS скачайте его и установите в `~/.local/bin`, выбрав свою папку из таблицы:

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

Добавьте строку `export PATH=…` в файл запуска своей командной оболочки (`~/.bashrc` в большинстве систем Linux, `~/.zshrc` в macOS), чтобы команда находилась в новых терминалах.

В macOS файл, скачанный через веб-браузер (а не через `curl`, как выше), помещается в карантин и не запускается. Снимите карантин один раз:

```bash
xattr -d com.apple.quarantine "$HOME/.local/bin/provider"
```

В Windows, в PowerShell, поместите его в папку, которой вы владеете, чтобы обновления могли его заменять:

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

Запускайте его как `& "$Dir\provider.exe"` или добавьте эту папку в `PATH`, чтобы набирать `provider`. `provider.exe` не подписан цифровой подписью, поэтому SmartScreen или Defender могут запросить подтверждение перед его запуском.

Затем вернитесь к [быстрому старту](/docs/miner#2-run-setup) и выполните `provider setup`. Его фоновая служба поддерживает в актуальном состоянии и установку, сделанную вручную; см. [Обновления](/docs/miner/updates).

## Сборка из исходного кода

Используйте версию Go, которую требует `sn/go.mod` (сейчас Go 1.27.3), и соответствующие ревизии соседних репозиториев, на которые указывают его директивы `replace`. Папка с исходным кодом должна выглядеть так:

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

Локальные замены — часть сборки: используйте согласованные с выпуском checkout-ы исходного кода или пакет исходного кода выпуска, который вы разворачиваете. Одного checkout-а `sn` недостаточно. Получите соответствующий сгенерированный исходный код `gvisor` вместе с этим пакетом; произвольная ревизия из upstream не будет воспроизводимой заменой.

Из папки `sn`:

```bash
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/provider" ./cli/miner
export PATH="$HOME/.local/bin:$PATH"
provider --help
```

Ваша собственная сборка сообщает `development build` и никогда не обновляется сама. Обновляйте её, собирая заново.

## Бинарный файл от вашего оператора

Вы также можете запустить бинарный файл `provider`, который ваш оператор собирает из исходного кода того же выпуска.
