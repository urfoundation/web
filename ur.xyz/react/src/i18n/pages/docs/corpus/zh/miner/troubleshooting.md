---
published: 2026-10-21
description: 解决 UR 矿工的常见问题。登录错误、立即停止或不断被拒绝的矿工、钱包和领取错误，以及在哪里寻求帮助。
---

# 矿工故障排除

在下面找到你看到的消息，或最接近的症状。如果你使用了安装程序，凡是本页写 `provider` 的地方都请输入 `urnetwork`。仍然解决不了？请到[我们的 Discord](https://discord.gg/urnetwork) 提问，并附上你运行的命令及其输出。永远不要公开你的授权码、seed 文件或 `~/.urnetwork` 中的任何内容。

## 安装

### 安装后出现 `urnetwork: command not found`

安装程序会把它的文件夹添加到你的 shell 启动文件中的 `PATH`（在 Linux 上是 `~/.bashrc`，如果有的话还有 `~/.zshrc`；在 macOS 上是 `~/.zshrc`，使用 bash 时还有 `~/.bash_profile`），而只有新终端才会读取这些文件。请打开一个新终端，或运行安装程序打印出的 `export PATH=…` 那一行。在 Windows 上，请打开一个新的 PowerShell 窗口。如果你安装时用了 `-B`，请自行添加该文件夹：请参阅[安装程序](/docs/miner/install#the-installers)。

### Windows 上的 `urnet-tools` 提示已禁用运行脚本

这是 Windows 默认的脚本策略。请输入 `urnet-tools.cmd` 代替 `urnet-tools`，例如 `urnet-tools.cmd status`。

### `no systemd user session`（Linux）

安装程序无法连接到你用户的 systemd，这种情况会出现在 `sudo su` shell、许多容器以及没有 systemd 的 WSL 中。它仍会安装矿工，但无法在后台运行它。请直接以将要运行矿工的用户身份登录（通过 SSH 或在控制台），然后再次运行安装程序；或者在前台运行矿工：第一次使用 `urnetwork provide --allow-client-registration`，之后使用 `urnetwork provide`。没有用户会话就没有自动更新，因此请不时自己运行 `urnet-tools update`，或改用系统服务：`sudo urnetwork service install --system`。如果在这样的 shell 中以 root 身份运行，安装程序会自行安装一个系统服务。

### 安装程序提示你的处理器不受支持

发布版本涵盖 Linux 上的 64 位和 32 位 Intel 与 AMD、64 位 ARM 以及 32 位 ARMv7（Raspberry Pi 2 或更新型号），还有搭载 Apple silicon 和 Intel 的 Mac。不支持 Pi Zero 或 Pi 1。在其他任何平台上，请[从源代码构建](/docs/miner/install#build-from-source)。

### macOS 提示无法打开该程序

用网页浏览器下载的文件会被隔离。请运行一次 `xattr -d com.apple.quarantine "$HOME/.local/bin/provider"`。（用 `curl` 下载的文件不会被隔离，此时该命令会显示 `No such xattr`，这是无害的。）

## 登录

### 粘贴授权码时什么都不显示

这是有意为之：提示符会隐藏授权码。粘贴后按 Enter 即可。

若要放弃，请按 Ctrl-C：它会显示 `Cancelled.`，且不做任何更改。在空的提示符上按 Enter 会显示 `No auth code was entered`。请在运行 `provider login` 或 `provider setup` 之前准备好你的授权码。

### `That auth code wasn't accepted`

授权码输错了、已被使用或已过期。请从你的运营商账户获取一个新的授权码，然后再次运行 `provider login`。在日志中（而不是终端中），同样的错误显示为 `panic: Invalid auth code.`，后面跟着可以忽略的内部细节。

### `… jwt exists. Overwrite? [yN]`

这台设备已经登录。回答 `y` 会用新的授权码重新登录，回答其他任何内容则保留当前的登录。

### `Couldn't reach the URnetwork API`

在日志中显示为 `panic: http request attempts exhausted`。矿工无法连接到运营商。请检查电脑的互联网连接，以及运营商的 URL 是否正确（`provider network`）。

在用自己的证书颁发机构检查加密流量的网络中（例如一些公司网络），矿工会拒绝该证书颁发机构。请将 `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` 指向一个只包含该网络 CA 证书的 PEM 文件，然后重试。对于后台服务，请设置该变量后再次运行 `provider service install`。

## 启动

### 首先，问问矿工

`provider status` 会说明缺少什么以及下一步要运行的命令，`provider doctor` 会检查状态目录、DNS、连接、TLS 和时钟，并为每个问题给出修复方法。请从这里开始；下面的条目会更详细地解释这些消息。

### 矿工立即停止

`provider start` 会用简单的话说明原因，并以代码 3 退出：

- *This device isn't signed in yet*（此设备尚未登录）：运行 `provider setup` 或 `provider login`。
- *This is the first start on this device*（这是此设备的首次启动）：在终端中回答 yes，或在脚本中加上 `--allow-client-registration`。如果你使用了安装程序，请运行 `urnet-tools start`：你登录后，它会注册新设备。

`provider provide` 只在设备未登录时才会这样说明。在从未注册过的设备上，除非你加上 `--allow-client-registration`，否则它会在日志中记录 `startup_recovery_required`。

在其他情况下，矿工会打印一行包含 `"event":"startup_recovery_required"` 的 JSON 并退出。使用 `provider provide`（安装程序就是这样运行它的）时，它会以代码 0 退出并保持停止。`provider start` 和 `provider service` 的后台矿工会以代码 1 退出，并且服务每 15 到 30 秒会重启它：在恢复文件夹期间，请用 `provider service stop` 停止它。这通常意味着**此设备的身份文件缺失或不匹配**，例如在迁移到新电脑或只恢复了部分备份之后。请从备份中恢复整个 `~/.urnetwork` 文件夹。重新登录无法替代丢失的身份，`--allow-client-registration` 也无法找回它：它只会注册新设备。

### `The state folder … can be changed by other users`

在日志中显示为 `registration parent must be owned and not writable by other users`。矿工的文件夹属于另一个用户（例如在用 `sudo` 运行过一次矿工之后），或者其他用户可以修改它，因此矿工拒绝把身份保存在那里。请把它交还给你的用户，设为私密，然后重新启动：

```bash
sudo chown -R "$USER" ~/.urnetwork
chmod 700 ~/.urnetwork
```

在 Windows 上，请运行消息中打印的 `icacls` 命令。

### 日志中不断出现 `refused`

矿工已经启动，但运营商不接受它的连接，它每隔几秒就会重试。状态页面仍然显示 `"status":"ok"`，因为进程本身是正常的。

- 确保电脑使用的是普通的家庭或服务器互联网连接，矿工前面没有 VPN 或代理。
- 检查你是否登录了矿工正在使用的那个运营商（`provider network`）。
- 如果问题持续，请询问你的运营商，或到[我们的 Discord](https://discord.gg/urnetwork) 提问，并附上 `refused` 前后的几行日志。

### 我注销后矿工就停止了

在 Linux 上，除非开启了 lingering，否则你用户的服务会在注销时停止。安装程序和 `provider service install` 会尝试开启它；如果它们打印了关于 lingering 的警告，请用 `sudo loginctl enable-linger "$USER"` 开启一次。

在 Windows 上，安装程序会在你登录时启动矿工，并在你注销时停止。这是一个已知的限制：请保持用户登录（锁屏没有问题）。

### `operator <domain> is awaiting auth`

使用 `--all-operators` 时，表示该运营商尚未登录。请运行 `provider auth --operator=<domain>`，或使用 `--auto-register --hotkey_seed_file=<path>` 启动。矿工每五分钟会再检查一次。请参阅[为每个列出的运营商挖矿](/docs/miner/advanced#mine-every-listed-operator)。

## 扩展器

`provider status` 中有一行 Extender，`provider doctor` 中有一行 Inbound 443。在日志中，`extender` 记录的 `reason` 说明出了什么问题，`guidance` 说明如何修复。扩展器关闭期间，矿工会继续挖矿。请参阅[运行扩展器](/docs/miner/extender)。

### 扩展器无法绑定 TCP 443 端口

矿工无法监听 TCP 443 端口，因此它的扩展器处于关闭状态。它每 3 分钟会再试一次。

- `tcp_443_permission_denied`：在 Linux 上，以你的用户身份运行的矿工不被允许监听 1024 以下的端口。请把它安装为一个有此权限的系统服务：使用安装程序时运行 `curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system`；使用 `provider service` 时运行 `sudo "$(command -v provider)" service install --system --as="$USER"`。请参阅[让矿工监听 443 端口](/docs/miner/extender#linux-let-the-miner-listen-on-port-443)。
- `tcp_443_in_use`：另一个程序占用着该端口，例如 Web 服务器，或同一台电脑上的另一个矿工进程。每台电脑只能有一个程序占用它；端口空出后 3 分钟内，矿工会占用它。
- `tcp_443_bind_failed`：由于其他原因失败。请查看它前后的日志行。

### 扩展器无法通过 TCP 443 访问

`unreachable_on_tcp_443`：矿工在监听 443 端口，但运营商的测试无法从互联网访问到它，因此该扩展器未被列入名单。可能是防火墙、云安全组或家用路由器挡住了入站连接，或者连接位于运营商级 NAT 之后。请开放 TCP 443（以及 UDP 443 和 4053）：请参阅[开放端口](/docs/miner/extender#open-the-ports)。

矿工每天会再试一次。开放端口后，重启它即可立即重试：`provider service restart`，如果使用了安装程序，则为 `urnet-tools restart`。

## 获得报酬

### `wallet challenge` 或 `wallet set` 提示 `credential not ready`

设备尚未注册。请运行 `provider setup`，或用 `provider start` 启动一次并让它完成注册，然后再设置钱包。请参阅[设置收款钱包](/docs/miner/rewards#set-your-payout-wallet)。

### 新钱包没有立即显示

这是正常的。钱包设置从下一个周期开始生效，并且永远不会改变更早奖励的去向。请参阅[钱包何时开始获得收益](/docs/miner/rewards#when-the-wallet-starts-earning)。

### 某个周期没有报酬

要获得报酬，设备需要有已完成的流量、足够的验证检查、至少一次确认，以及该周期的已签名钱包。处于头部层级的设备在那里获得收益，而不是从池中获得。请参阅[奖励如何计算](/docs/miner/rewards#how-rewards-are-counted)。

### 领取证明尚未准备好

请检查运营商是否已经发布了此设备在该周期的工作，并已最终确定该周期的根。领取使用的是设备的 `.provider.jwt`；你的账户登录（`jwt`）不能代替它。

### 证明或根不匹配

请保存输出，并与你的运营商核对部署、周期和支付文件。等待或更换钱包都无法修复不一致的证明。

### 已领取，但余额没有变化

请在回执中查找 `ClaimPaid` 或 `ClaimPaymentDeferred`，并检查你的 coldkey 上的 α 质押，而不是 relayer 的余额。请参阅[查看结果](/docs/miner/rewards#3-read-the-result)。

### 领取过程中连接中断

在再次使用 relayer 密钥之前，请先查看你发送的交易或领取守护进程队列的情况。请保留已签名交易的历史记录。
