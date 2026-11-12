---
published: 2026-10-21
description: 日常运行 UR 矿工。启动和停止它、选择运营商、让它在后台运行、查看日志和状态页面，以及备份。
---

# 运行与监控矿工

本页假定你已经[安装](/docs/miner/install)了矿工并[完成了设置](/docs/miner#2-run-setup)。如果你使用了安装程序，凡是本页写 `provider` 的地方都请输入 `urnetwork`。

## 启动与停止

在终端中挖矿：

```bash
provider start
```

它会显示一个简短的实时视图（Connecting、Connected、● Mining），并一直运行，直到你按 Ctrl-C 停止它。详细日志写入 `~/.urnetwork` 中的 `miner.log`；加上 `-v` 可改为在终端中查看。

在新设备上首次启动时，它会在注册设备前先询问你，并把设备身份保存在 `~/.urnetwork` 中。之后的每次启动都会复用该身份。在没人能回答提问的脚本中，请在首次启动时加上 `--allow-client-registration`。`provider provide` 是同一个命令，但会输出完整日志，适用于脚本和服务。

只注册真正的新设备。注册永远不会替换矿工已有的身份，但不要为了绕过关于身份缺失或不匹配的错误而删除文件：请改为参阅[故障排除](/docs/miner/troubleshooting#the-miner-stops-straight-away)。

请以同一个用户运行所有矿工命令和后台服务。每个用户都有自己的 `~/.urnetwork`。

## 选择运营商

矿工默认服务于运营商 `bringyour.com`（`https://api.bringyour.com` 和 `wss://connect.bringyour.com`），除非你选择其他运营商。若要服务于另一个运营商，请在首次启动**之前**，使用该运营商公布的 URL 选择它：

```bash
provider network use https://api.example.net wss://connect.example.net
provider network
```

API URL 以 `https://` 开头，连接 URL 以 `wss://` 开头（普通的 `http://` 和 `ws://` 仅适用于本地测试服务器）。单独运行 `provider network` 会显示当前生效的运营商，`provider network reset` 会恢复为默认运营商。该选择会被保存，并适用于之后的每个命令。然后使用该运营商的授权码运行 `provider setup` 或 `provider login`。

更换运营商不会把已注册的设备迁移到新运营商。请为每个运营商使用各自的状态和账户。若要同时服务于公布列表中的所有运营商，请参阅[为每个列出的运营商挖矿](/docs/miner/advanced#mine-every-listed-operator)。

## 在后台运行

### 使用安装程序

[安装程序](/docs/miner/install#the-installers)已经在后台运行矿工：在 Linux 上是 systemd 用户服务（或者，使用 `--system` 安装时，是[以你的身份运行的系统服务](/docs/miner/extender#with-the-linux-installer)），在 macOS 上是 launchd 代理，在 Windows 上是“启动”快捷方式。使用 `urnet-tools` 管理它：

```bash
urnet-tools start          # start it (no error if it's already running)
urnet-tools status         # version, signed in, running, updates; exits 3 when it isn't running
urnet-tools logs           # follow its log; Ctrl-C to stop reading
urnet-tools restart
urnet-tools stop           # stop it until you start it again, restart (Linux) or log in again (macOS, Windows)
urnet-tools auto-update off   # turn automatic updates off; `on` turns them back on
```

如果你在安装时跳过了登录，请运行 `urnetwork login`，然后运行 `urnet-tools start`：它会注册设备并启动矿工。自动更新的工作方式请参阅[更新](/docs/miner/updates)。

在 Linux 和 Windows 上，`provider service start`、`stop`、`status` 和 `logs` 也适用于安装程序的矿工。

它会自动启动：在 Linux 上是开机时（在开启 lingering 时；安装程序会尝试开启它），在 macOS 上是你登录时，在 Windows 上是你登录时，并且在 Windows 上它还会**在你注销时停止**。`urnet-tools auto-start off` 会阻止它自动启动，`urnet-tools auto-start on` 则会重新开启。

如果矿工崩溃，Linux 上的 systemd 会在 30 秒后重启它，macOS 上的 launchd 会在 60 秒后重启它。在 Windows 上，停止的矿工会一直保持停止，直到你运行 `urnet-tools start` 或重新登录。正常退出的矿工，例如因为设备[未注册](/docs/miner/troubleshooting#the-miner-stops-straight-away)而退出，会保持停止：此时 `urnet-tools status` 会显示它没有运行。

### 使用 provider 服务

`provider setup` 会提出帮你设置。若要自己设置，请先停止在终端中运行的矿工（如果有），然后：

```bash
provider service install
```

它会立即启动矿工，之后自动再次启动它，在其崩溃时重启它，并每 6 小时检查一次[更新](/docs/miner/updates)：

- **Linux：** 一个 systemd 用户服务 `urnetwork-provider.service`，开机时启动。它会开启 lingering，让服务在你注销后继续运行，或者打印出需要运行的 `sudo loginctl enable-linger` 命令。
- **macOS：** 一个在你登录时启动的 launchd 代理。它的日志是 `~/.urnetwork` 中的 `service.log`。
- **Windows：** 一个“启动”应用，在你登录 Windows 时隐藏启动矿工，并在你注销时停止。它不需要管理员权限。它的日志是 `%USERPROFILE%\.urnetwork` 中的 `service.log`。

管理它：

```bash
provider service status
provider service logs --follow   # Ctrl-C to stop reading
provider service restart
provider service stop
provider service uninstall       # your sign-in and identity are kept
```

在服务器上，或者要在 Linux 或 macOS 上为电脑的每个用户挖矿，请使用以 root 运行的系统级服务，其状态位于 `/var/lib/urnetwork`：`sudo provider setup --system`，或 `sudo provider service install --system`。在其他 `provider service` 命令中加上 `--system` 即可管理它。Windows 没有系统级服务。在 Linux 上，用户服务无法为矿工的扩展器监听 TCP 443 端口；`sudo "$(command -v provider)" service install --system --as="$USER"` 会把它作为系统服务运行，该服务仍然以你的用户身份运行，并且可以监听该端口。请参阅[让矿工监听 443 端口](/docs/miner/extender#linux-let-the-miner-listen-on-port-443)。对于大量机器，`provider setup --yes --auth-code-file=<path>` 可以在不提任何问题的情况下完成设置；它会跳过收款步骤，因此之后请[设置收款钱包](/docs/miner/rewards#set-your-payout-wallet)。

在 Linux 和 Windows 上，`provider service install` 不会在安装程序的矿工旁边再添加第二个矿工。在 macOS 上它看不到安装程序的代理，因此如果你使用了 macOS 安装程序，请继续使用 `urnet-tools`，不要再安装第二个服务。

### 你自己的服务

若要用你自己的选项运行矿工，或在没有 systemd 或 launchd 的情况下运行，请在你自己的服务管理器、`tmux` 或 `screen` 下运行 `provider provide`。例如在 Linux 上，创建 `~/.config/systemd/user/ur-miner.service`：

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

如果矿工正在运行，请先停止它，然后启用该服务并跟踪其日志：

```bash
systemctl --user daemon-reload
systemctl --user enable --now ur-miner.service
journalctl --user -u ur-miner.service -f
```

若要在你注销后让它继续运行，请开启一次 lingering：`sudo loginctl enable-linger "$USER"`。不要在服务命令中加入 `--allow-client-registration`，这样身份缺失时服务会停止，而不是在你不知情的情况下注册一台新设备。不要同时运行它和 `provider service`。你自己的服务不会更新矿工；请参阅[更新](/docs/miner/updates#without-automatic-updates)。

## 检查它是否在工作

### 状态与诊断

```bash
provider status
```

矿工、登录、设备注册、连接和更新各占一行，出现问题时还会给出下一步要运行的命令。一切正常时它以 0 退出，设备需要设置时以 3 退出，矿工未运行或未连接时以 4 退出。`provider status --json` 会为脚本和监控打印同样的内容。

```bash
provider doctor
```

查找矿工无法登录或连接的原因：状态目录是否私密、DNS、与运营商的连接、检查 TLS 的代理或防火墙、时钟，以及能否安装更新。对发现的每个问题，它都会给出修复方法。

### 日志

`provider start` 把日志写入 `~/.urnetwork` 中的 `miner.log`。对于后台矿工，请使用 `provider service logs --follow`，如果使用了安装程序，则使用 `urnet-tools logs`。

矿工会以几种格式写入大量日志行；其中大多数都是例行信息。以下几行是好迹象：

- `"event":"identity_available"`：它找到或创建了此设备的身份。
- 矿工持续运行。如果它在几秒钟内自行停止，就说明出了问题，即使它的退出看起来很正常。

警告迹象：

- 一行包含 `"event":"startup_recovery_required"` 的 JSON，随后程序退出：请参阅[故障排除](/docs/miner/troubleshooting#the-miner-stops-straight-away)。
- 每隔几秒重复出现单词 `refused`：运营商不接受该连接。请参阅[故障排除](/docs/miner/troubleshooting#the-log-keeps-saying-refused)。

加上 `-v`，或用 `-vv` 获取更多信息，可以看到更多细节。

### 状态页面

矿工可以提供一个 JSON 格式的小型状态页面。它默认关闭；用 `--port` 开启：

```bash
provider provide --port=8080
```

然后，在同一台机器上：

```bash
curl -s http://127.0.0.1:8080/
```

它会显示矿工的 `version`（正式发布的版本才有）、它的 `host` 名称，以及一个 `diagnostics` 部分，其中包含登录（`authentication`）、`keys`、`extender` 和 `runtime` 的最新结果。顶层的 `"status":"ok"` 只表示矿工进程已启动；并不表示它已连接或正在赚取收益，所以也要看 `diagnostics`。

状态页面会在所有网络接口上监听，而不仅仅是本地接口。请在防火墙中屏蔽该端口，或只允许你的监控网络访问。

## 常用选项

| 选项 | 作用 |
| --- | --- |
| `--max-memory=1gib` | 一个软性的内存目标，单位为字节，或使用 `b`、`kib`、`mib` 或 `gib`。不设置时，矿工会根据电脑的内存自行选择。 |
| `-v`, `-vv` | 更详细的日志。 |
| `--port=<port>` | 在该端口上提供[状态页面](#the-status-page)。默认值 `0` 表示关闭。 |

`provider auth-provide` 用一个命令完成登录和启动。新设备仍然需要 `--allow-client-registration`。所有选项都在 `provider help all` 和[参考](/docs/miner/reference)中。

## 备份你的矿工

让这台设备成为*你的*矿工的一切都在 `~/.urnetwork` 中：它的身份密钥、注册信息、登录信息以及你已签名的钱包历史。如果丢失了它，即使你仍能登录账户，也无法恢复这台设备。

- 复制文件夹之前先停止矿工（或其服务），以免有文件只写了一半。
- 复制**整个**文件夹，妥善保管副本，并作为一个整体进行恢复。
- 永远不要同时运行同一文件夹的两个副本，无论是在一台机器上还是两台机器上。

[参考](/docs/miner/reference#files-the-miner-keeps)中列出了该文件夹中的每个文件。
