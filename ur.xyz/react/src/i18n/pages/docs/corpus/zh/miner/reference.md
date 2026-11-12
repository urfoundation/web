---
published: 2026-10-21
description: UR 矿工参考。provider 的命令和选项、安装程序的 urnet-tools 命令、矿工保存的文件、环境变量和术语表。
---

# 矿工参考

`provider` 命令的快速参考。`provider --help` 会打印简短概览，`provider <command> --help` 会解释某一个命令，`provider help all` 会打印所有命令和选项。如果你使用了安装程序，该命令名为 `urnetwork`。

## 日常命令

括号中的名称是同一命令的其他名称。

| 命令 | 作用 |
| --- | --- |
| `provider setup` | 逐步设置此设备：登录、注册、收款地址、后台服务。可以安全地重复运行。`--no-service` 会跳过服务，`--yes --auth-code-file=<path>` 会在不提任何问题的情况下运行（并跳过收款地址）。 |
| `provider status` | 是否已设置、正在运行并已连接？一切正常时退出代码为 0，需要设置时为 3，未运行或未连接时为 4。`--json` 供脚本使用。 |
| `provider doctor` | 无法登录或连接的原因：状态目录、DNS、连接、TLS、时钟、更新。 |
| `provider login`（`auth`） | 使用授权码登录，授权码在隐藏的提示符中输入。`provider login <auth_code>` 直接接收授权码，但会把它留在 shell 历史中。`--user_auth='you@example.com'` 使用你的账户邮箱登录并询问密码。 |
| `provider start`（`provide`） | 在此终端中开始挖矿。新设备首次启动时会在注册前询问；`--allow-client-registration` 则不经询问直接注册。`provide` 会打印完整日志，而不是实时视图。 |
| `provider service install` | 在后台运行矿工并自动更新：在 Linux 上每次开机时，在 macOS 和 Windows 上登录时。还有 `start`、`stop`、`restart`、`status`、`logs --follow` 和 `uninstall`。 |
| `provider update` | 更新到最新版本。`--check` 只做检查，`--status` 显示自动更新设置。请参阅[更新](/docs/miner/updates)。 |
| `provider --version` | 打印版本。 |
| `provider auth-provide` | 用一个命令完成登录和启动。 |
| `provider wallet challenge '<coldkey_ss58>'` | 打印为收款钱包签名所需的声明。 |
| `provider wallet set '<coldkey_ss58>' …` | 用签名或 seed 文件设置收款钱包。请参阅[获得报酬](/docs/miner/rewards#set-your-payout-wallet)。 |
| `provider claim --epoch=<epoch> --rpc=<url>` | 检查一笔池奖励领取；加上 `--key_file` 即可提交。请参阅[领取奖励](/docs/miner/rewards#claim-your-rewards)。 |
| `provider network`（`choose_network`） | 显示当前生效的运营商。`provider network use <api_url> <connect_url>` 选择另一个运营商，`provider network reset` 恢复为默认运营商。 |
| `provider operators` | 列出公布的运营商列表中的运营商，以及你在每个运营商处的登录状态。 |
| `provider proxy add …` | 添加 SOCKS5 出口。请参阅[在一台主机上运行多个出口](/docs/miner/advanced#several-exits-on-one-host)。 |

用于所有运营商、hotkey 钱包、领取守护进程和头部层级集群的命令请参阅[进阶](/docs/miner/advanced)页面。

## 常用选项

| 选项 | 适用于 | 作用 |
| --- | --- | --- |
| `--allow-client-registration` | `start`, `provide` | 允许注册新设备。永远不会替换矿工已有的身份。 |
| `--port=<port>` | `start`, `provide` | 在此端口上提供[状态页面](/docs/miner/run#the-status-page)。默认值 `0` 表示关闭。 |
| `--max-memory=<mem>` | `start`, `provide`, `login` | 软性内存目标，单位为字节，或使用 `b`、`kib`、`mib` 或 `gib`。 |
| `-v`, `-vv` | 大多数命令 | 更详细的日志。（对于 Linux 和 macOS 上的 `urnet-tools`，`-v` 表示 `version`；在 Windows 上请输入 `urnet-tools version`。） |
| `-f` | `login`, `proxy` | 不经询问直接替换已有的登录或代理。 |
| `--api_url=<url>` | 大多数命令 | 在一个命令中使用此运营商 API URL。 |
| `--connect_url=<url>` | `start`, `provide` | 在一次运行中使用此运营商连接 URL。 |
| `--provider-jwt=<path>` | `wallet`, `claim` | 选择使用哪台设备的凭据，用于额外的出口或其他运营商。 |
| `--wallet=<coldkey_ss58>` | `start`, `provide` | 启动时同时设置收款钱包，与 `wallet set` 相同。失败会被记录，但不会停止挖矿。 |

## 安装程序命令

Linux、macOS 和 Windows 的安装程序共用一个命令 `urnet-tools`：

| 命令 | 作用 |
| --- | --- |
| `urnet-tools status` | 一屏摘要：是否在运行、版本、是否已登录、自动更新。 |
| `urnet-tools start`, `stop`, `restart` | 在后台启动、停止或重启矿工。 |
| `urnet-tools logs` | 跟踪矿工的输出。按 Ctrl-C 退出。 |
| `urnet-tools version` | 显示已安装的版本，以及更新的最新版本（如果有）。 |
| `urnet-tools update` | 如果有更新的版本，立即更新。在 Linux 上永远不会降级到更旧的版本。 |
| `urnet-tools auto-update` | 显示自动更新是否开启。加上 `on` 或 `off` 可更改，加上 `--interval 6h`、`daily`、`weekly` 或 `monthly` 可更改检查频率。 |
| `urnet-tools auto-start on`, `off` | 矿工是否在重启后自动启动（在 macOS 和 Windows 上为登录时）。 |
| `urnet-tools reinstall -t <version>` | 安装特定版本。 |
| `urnet-tools uninstall` | 移除矿工及其后台任务。保留 `~/.urnetwork`。加上 `--remove-identity` 可在你输入 `delete` 后将其一并删除。 |

选项可以写作 `--interval weekly` 或 `--interval=weekly`。在 Windows 上，PowerShell 写法（`-Interval`、`-RemoveIdentity`）也可以使用；如果 PowerShell 提示已禁用运行脚本，请改为输入 `urnet-tools.cmd`。请参阅[更新](/docs/miner/updates)和[在后台运行](/docs/miner/run#with-an-installer)。

各安装程序存放矿工的位置：

| 系统 | 文件夹 | 日志 |
| --- | --- | --- |
| Linux | `~/.local/share/urnetwork-provider` | `urnet-tools logs`（systemd 日志） |
| macOS | `~/.local/share/urnetwork-provider` | `~/Library/Logs/urnetwork/` |
| Windows | `%LOCALAPPDATA%\urnetwork\provider` | 该文件夹中的 `provider.log` |

## 矿工保存的文件

矿工把状态保存在 `~/.urnetwork` 中。请在停止矿工后备份整个文件夹，妥善保管，并作为一个整体进行恢复。不要同时运行同一文件夹的两个副本。丢失或编辑身份文件可能导致设备无法恢复，即使你的账户登录仍然有效。

| 文件或文件夹 | 内容 |
| --- | --- |
| `jwt` | 你的账户登录信息，由 `provider login`（`auth`）写入。 |
| `.provider.key` 和 `.provider.key.identity` | 设备原始的 Ed25519 密钥及其身份标记。 |
| `.provider.key.registration.lock` | 用于注册设备的本地锁。 |
| `.provider.jwt` | 设备自己的可续期凭据，用于钱包和领取。 |
| `.provider.jwt.registration*` | 保留的注册请求和恢复状态。请保留其中的每一个文件。 |
| `.provider.jwt.wallet-consent/` | 你已签名的钱包历史，包括尚未发送的声明。 |
| `.provider.cert`, `.provider.extender.key` | 设备的证书和扩展器身份（如果存在）。 |
| `network.json` | 用 `provider network use`（`choose_network`）选择的运营商。 |
| `proxy` | 可选的 SOCKS5 出口。 |
| `operators.yml` | 使用 `--all-operators` 时，运营商列表的最后一份有效副本。 |
| `operators/<domain>/` | 某个列出的运营商自己的状态，包含上述文件。 |
| `hotkey-wallet/` | 已签名的 hotkey 收款链（`originals.json`）以及任何待处理的声明（`pending.json`）。 |
| `miner.log` | 在终端中运行 `provider start` 时的日志。 |
| `miner-status.json`, `miner-update.json` | `provider status` 读取的内容，以及自动更新设置和最近一次检查。 |

安装程序把矿工程序和 `urnet-tools` 保存在它们自己的文件夹中（请参阅[安装程序命令](#installer-commands)），与此文件夹分开。

## 环境变量

正常设置不需要其中任何一个。

| 变量 | 作用 |
| --- | --- |
| `URNETWORK_STATE_DIR` | 使用此文件夹代替 `~/.urnetwork`。便于在不影响真实设备的情况下试用一台测试设备。 |
| `URNETWORK_AUTO_UPDATE` | 运行 `provider service install` 时设为 `0`，即可安装关闭自动更新的服务。它不影响安装程序的更新。 |
| `URNETWORK_AUTH_CODE` | 安装程序会使用此授权码登录，而不是询问授权码。 |
| `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` | 一个包含额外受信任 CA 证书的 PEM 文件，用于会检查加密流量的网络。它只能包含 CA 证书。 |

## 术语表

| 术语 | 含义 |
| --- | --- |
| 授权码（auth code） | 来自你的运营商账户的一次性代码，用于让一台电脑登录该账户。 |
| 运营商 | 你的矿工为其提供互联网出口的网络。默认是 `bringyour.com`。 |
| 设备（提供者身份） | 作为矿工的这台电脑：`~/.urnetwork` 中的身份，在重启和更新后保持不变。 |
| Coldkey | 你的 Bittensor 钱包，即以 `5` 开头的 ss58 地址。奖励支付到它。 |
| Hotkey | 第二个 Bittensor 密钥。矿工用它一次登录所有运营商，集群则用它在头部层级注册。 |
| 周期 | 计算奖励的时间段。在主网上，一个结算周期约为七天。 |
| 池 | 运营商的共享支付。大多数矿工从池中获得收益。 |
| 头部层级 | 注册自己的 hotkey 并直接获得矿工发行的大型集群。 |
| Relayer | 为提交领取支付 gas 的 EVM 密钥。它永远不会收到奖励。 |
| α（$UR） | 子网的代币，奖励以它支付。 |
| Momentum | 矿工发行中当下支付出去的份额；其余部分进入 [Network Capacity Reserve](/reserve)。 |
