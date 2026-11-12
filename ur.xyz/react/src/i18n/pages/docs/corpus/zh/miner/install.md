---
published: 2026-10-21
description: 安装 UR 矿工。适用于 Linux、macOS 和 Windows、带自动更新的安装程序，手动下载，以及从源代码构建 provider。
---

# 安装矿工

矿工是一个单独的程序：`provider`。获取它有三种方式：

| 方式 | 系统 | 更新 | 适合 |
| --- | --- | --- | --- |
| [安装程序](#the-installers) | Linux, macOS, Windows | 自动 | 大多数人 |
| [手动下载](#manual-download) | Linux, macOS, Windows | 自动，配合 `provider setup` | 需要完全掌控的人 |
| [从源代码构建](#build-from-source) | Linux, macOS, Windows | 手动 | 开发者和审计人员 |

无论你选择哪种方式，矿工都把它的身份保存在 `~/.urnetwork`（在 Windows 上为 `%USERPROFILE%\.urnetwork`）中，因此你以后可以切换方式而无需重新注册。请先备份该文件夹，并在启动新方式之前停止旧方式的后台任务，确保永远不会有两个副本同时运行。安装完成后，回到[快速开始](/docs/miner#2-run-setup)。

## 安装程序

每个安装程序都会把矿工放在你自己的用户目录中（无需管理员权限），在后台运行它，保持其更新，并为你提供一个管理这一切的命令：`urnet-tools`。它们位于 [urnetwork/connect 的 `scripts` 文件夹](https://github.com/urnetwork/connect/tree/main/scripts)中。

三个安装程序都会：

- 下载适合你处理器的最新版本，用 GitHub 为其列出的 SHA-256 进行校验（这能发现损坏的下载），并只安装适用于你机器的程序；
- 以 **`urnetwork`** 的名称安装矿工：凡是本指南写 `provider` 的地方都请输入 `urnetwork`，包括矿工打印出来供你复制的命令；
- 如果你尚未登录，会要求输入授权码（按 Enter 可稍后再登录；`--auth-code <code>`，在 Windows 上为 `-AuthCode`，可以不经询问直接登录，但会把授权码留在你的 shell 历史中；`URNETWORK_AUTH_CODE` 或提示输入则不会）；
- 在你登录后，于首次启动时注册新设备；
- 开启[自动更新](/docs/miner/updates)，默认每 6 小时一次；
- 可以随时再次运行：再次运行会就地更新，并保留你的设置和身份。

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

然后打开一个新终端，或运行它打印出的 `export PATH=…` 那一行。它可在 64 位和 32 位的 Intel、AMD 和 ARM 上运行，包括运行 32 位系统的 Raspberry Pi 2 或更新型号（不支持 Pi Zero 或 Pi 1），并且需要 `curl` 或 `wget`，以及 `jq` 或 `python3`（大多数系统至少有其中之一）。它会：

- 把 `urnetwork` 和 `urnet-tools` 安装到 `~/.local/share/urnetwork-provider/bin`，并把该文件夹添加到 `~/.bashrc`（必要时创建该文件）中的 `PATH`，如果你有 `~/.zshrc`，也会添加到其中。传入 `-B` 可让它不改动这些文件。如果新终端仍然找不到 `urnetwork`，请运行安装程序打印出的 `export PATH=…` 那一行；
- 将矿工作为 systemd 用户服务 `urnetwork.service` 运行，并附带一个更新定时器，同时开启 lingering，让服务在你注销后继续运行（如果这需要管理员权限，它会打印出需要运行的 `sudo loginctl enable-linger` 命令）；
- 在没有 systemd 用户会话的 shell 中（`sudo su` shell、许多容器、WSL），仍会完成安装，但不包含后台服务和自动更新，并告诉你如何在前台运行矿工。请不时自己运行 `urnet-tools update`。如果在这样的 shell 中以 root 身份运行，它会改为安装一个系统服务。

`--interval 6h`、`daily`、`weekly` 或 `monthly` 用于设置检查更新的频率。

用户服务无法监听 TCP 443 端口，而矿工的[扩展器](/docs/miner/extender)需要这个端口。`--system` 会改为将矿工作为系统服务运行，仍以你的用户身份运行，并拥有监听 1024 以下端口的权限：

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

请以你自己的身份运行，而不要用 `sudo`；它会询问一次你的 `sudo` 密码。请参阅[让矿工监听 443 端口](/docs/miner/extender#linux-let-the-miner-listen-on-port-443)。

选项放在 `sh -s --` 之后，例如 `curl -fsSL … | sh -s -- --no-start`。带上 `--help` 运行它即可查看全部选项。

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

然后打开一个新的终端窗口。它需要 macOS 12 或更高版本，不需要其他任何东西，可在 Apple silicon 和 Intel 的 Mac 上运行（在 Rosetta 终端中运行也可以，它会选择原生版本）。它会：

- 把 `urnetwork` 和 `urnet-tools` 安装到 `~/.local/share/urnetwork-provider/bin`，并把该文件夹添加到 `~/.zshrc` 中的 `PATH`（如果你使用 bash，也会添加到 `~/.bash_profile`）。传入 `-B` 可让它不改动这些文件；
- 将矿工作为 launchd 代理运行，它会在你登录时启动，并在矿工崩溃时将其重启。macOS 可能会显示 “Background Items Added” 通知；这是正常的。它以 `urnet-tools` 的名称列在 System Settings → General → Login Items 下；
- 为你清除下载文件的隔离标记，并拒绝通过 `sudo` 运行。

在 macOS 上，`--dry-run` 会打印它将执行的所有操作而不做任何更改，`-y` 会自动回答所有问题。矿工的日志位于 `~/Library/Logs/urnetwork/`。

### Windows

在普通的 PowerShell 窗口中（不要使用“以管理员身份运行”）：

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

它可在 Windows PowerShell 5.1 和 PowerShell 7 中运行，支持 64 位 Intel 或 AMD 以及 ARM64。它会：

- 把 `urnetwork.exe`、`urnet-tools` 和更新程序安装到 `%LOCALAPPDATA%\urnetwork\provider`，并把该文件夹添加到你的 `PATH`。之后请打开一个新窗口；
- 在你登录后，询问是否在后台运行矿工，包括现在以及每次登录 Windows 时。它通过“启动”文件夹中的快捷方式隐藏运行，因此**在你注销时会停止**。如果你稍后才登录账户，请运行 `urnet-tools auto-start on` 和 `urnet-tools start`；
- 在 `urnet-tools.ps1` 旁边安装 `urnet-tools.cmd`。如果 PowerShell 提示 “running scripts is disabled”，请输入 `urnet-tools.cmd` 而不是 `urnet-tools`。

`urnetwork.exe` 没有代码签名，因此 SmartScreen 或 Defender 可能会在运行前询问。Windows 选项采用 PowerShell 风格：`-Tag`、`-AuthCode`、`-NoStart`、`-NoAutoUpdate`、`-AddToStartup`、`-NoStartup`、`-NonInteractive`。用 `-Tag` 安装特定版本时，自动更新保持关闭。这些选项无法通过 `irm … | iex` 传递：请保存脚本后再运行，例如 `powershell -ExecutionPolicy Bypass -File .\Provider_Install_Win32.ps1 -NoStart`，或者在 `irm` 那一行之前设置 `$env:URNETWORK_AUTH_CODE`。`Get-Help .\Provider_Install_Win32.ps1 -Detailed` 会列出全部选项。

### 用 urnet-tools 管理

| 命令 | 作用 |
| --- | --- |
| `urnet-tools status` | 版本、你是否已登录、矿工是否在运行、是否自动启动以及是否自动更新。 |
| `urnet-tools start`, `stop`, `restart` | 启动、停止或重启后台矿工。 |
| `urnet-tools logs` | 跟踪矿工日志；按 Ctrl-C 退出。 |
| `urnet-tools version` | 已安装的版本，以及更新的最新版本（如果有）。 |
| `urnet-tools update` | 立即更新（矿工以及 `urnet-tools` 本身）。 |
| `urnet-tools auto-update`, `auto-update on`, `off` | 查看或更改自动更新；请参阅[更新](/docs/miner/updates)。 |
| `urnet-tools auto-start on`, `off` | 是否在开机或登录时启动矿工。 |
| `urnet-tools reinstall -t <version>` | 安装特定版本。 |
| `urnet-tools uninstall` | 移除矿工，保留你的身份。 |

`urnet-tools --help` 会列出适用于你系统的全部内容（在 Windows 上为 `urnet-tools help`）。选项可写作 `--option value` 或 `--option=value`；在 Windows 上采用 PowerShell 风格，例如 `-Interval` 和 `-RemoveIdentity`。

### 卸载

```bash
urnet-tools uninstall
```

它会移除矿工、其后台任务及其 `PATH` 条目，并**保留**你在 `~/.urnetwork` 中的身份，以便你以后以同一设备的身份重新安装。若要同时删除身份，请加上 `--remove-identity`（在 Windows 上为 `-RemoveIdentity`）；它会先要求你输入 `delete`。在此之前请[先备份](/docs/miner/run#back-up-your-miner)：没有备份，设备将无法恢复。

## 手动下载

[build 版本发布页面](https://github.com/urnetwork/build/releases)上的每个版本都有一个名为 `urnetwork-provider-<version>.tar.gz` 的文件。它是一个很大的下载（约 240 MB），因为其中为每个系统各包含一个 `provider` 程序，位于 `<os>/<arch>/provider`（在 Windows 上为 `provider.exe`）。其中还包含用于路由器的 MIPS 版本。

| 你的电脑 | 下载包中的文件夹 |
| --- | --- |
| Linux 电脑或服务器（Intel 或 AMD，64 位） | `linux/amd64` |
| 运行 64 位系统的 Raspberry Pi 3、4 或 5，或其他 64 位 ARM Linux | `linux/arm64` |
| 较旧的 32 位 Intel 或 AMD Linux 电脑 | `linux/386` |
| 运行 32 位系统的 Raspberry Pi 2、3、4 或 5，或其他 ARMv7 开发板（不支持 Pi Zero 或 Pi 1） | `linux/arm` |
| 搭载 Apple silicon 的 Mac（M1 或更新） | `darwin/arm64` |
| 搭载 Intel 处理器的 Mac | `darwin/amd64` |
| Windows 电脑（Intel 或 AMD，64 位） | `windows/amd64` |
| ARM 上的 Windows | `windows/arm64` |

在 Linux 或 macOS 上，下载并安装到 `~/.local/bin`，并从表中选择你的文件夹：

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

把 `export PATH=…` 这一行添加到你的 shell 启动文件中（大多数 Linux 系统为 `~/.bashrc`，macOS 为 `~/.zshrc`），以便新终端能找到该命令。

在 macOS 上，用网页浏览器下载的文件（而不是像上面那样用 `curl` 下载的）会被隔离，无法运行。请解除一次隔离：

```bash
xattr -d com.apple.quarantine "$HOME/.local/bin/provider"
```

在 Windows 上，在 PowerShell 中，把它放在你拥有的文件夹中，以便更新可以替换它：

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

以 `& "$Dir\provider.exe"` 的方式运行它，或把该文件夹添加到 `PATH`，以便直接输入 `provider`。`provider.exe` 没有代码签名，因此 SmartScreen 或 Defender 可能会在运行前询问。

然后回到[快速开始](/docs/miner#2-run-setup)并运行 `provider setup`。它的后台服务也会让手动安装保持更新；请参阅[更新](/docs/miner/updates)。

## 从源代码构建

请使用 `sn/go.mod` 要求的 Go 版本（目前为 Go 1.27.3），以及其 `replace` 指令所指向的同级仓库的对应版本。源代码文件夹必须如下所示：

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

本地替换是构建的一部分：请使用与你所部署版本相匹配的源代码检出或源代码包。只检出 `sn` 是不够的。请随该源代码包获取匹配的、已生成的 `gvisor` 源代码；任意的上游版本并不能作为可复现的替代。

在 `sn` 文件夹中：

```bash
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/provider" ./cli/miner
export PATH="$HOME/.local/bin:$PATH"
provider --help
```

你自己构建的版本会显示 `development build`，并且永远不会自动更新。要更新它，请重新构建。

## 来自运营商的二进制文件

你也可以运行由你的运营商从同一版本源代码构建的 `provider` 二进制文件。
