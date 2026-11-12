---
description: 只需几步即可在 UR 上开始挖矿。矿工做什么、你需要什么、快速开始，以及矿工指南各部分所在的位置。
---

# 如何运行矿工

> **如果你的矿工后台服务是由 `provider setup` 或 `provider service install` 设置的，请手动更新一次。** 自 2026.10.22 版本以来，这些矿工在 Linux、macOS 和 Windows 上都没有自行更新。矿工的更新程序接受的版本写法类似 `2026.10.27-1083160450`，但发布版本的标记是 `2026.10.27+1083160450`，因此每个发布版本都把自己当成了开发版本：
>
> - `provider status` 显示 “development build, never updates itself”。
> - `provider update` 以及自动更新都会拒绝，并提示 “this is a development build … which never replaces itself with a release”。
> - 那个会在新版本未能重新连接时将其回滚的 10 分钟检查从未运行过。
>
> 修复包含在 2026 年 11 月 11 日之后的第一个版本中，你的矿工无法自行安装它。该版本发布后，请按[手动下载](/docs/miner/install#manual-download)中的说明下载并解压，但不要安装，而是运行它的更新：使用表中你的文件夹运行 `./linux/amd64/provider update`（如果是系统服务，在前面加上 `sudo`），或在 Windows 上运行 `& "$env:TEMP\windows\$Arch\provider.exe" update`。只输入 `provider update` 会运行你现有的矿工，而它仍会拒绝。该更新会替换你的服务所运行的矿工并将其重启。
>
> 此后，更新会再次自动进行：在每次发布后分散在大约 16 小时内，带有 10 分钟的连接检查、回滚，并会把未通过检查的版本跳过 7 天。之后 `provider status` 会显示更新是自动的，或者你已是最新版本。
>
> 如果你自己运行矿工、没有使用该服务，`provider update` 也会拒绝：请按[手动下载](/docs/miner/install#manual-download)中的说明安装新版本，然后重启矿工。
>
> 不受影响的有：Docker 镜像、各个应用，以及由安装程序设置的矿工，它们通过 `urnet-tools` 更新。

UR 矿工把你的互联网连接作为出口提供给网络运营商。验证者检查它是否真的在承载流量，Bittensor SN25（netuid 25）则以子网的 α 代币（品牌名 $UR）为这项工作支付奖励。

本页带你从零开始运行起一个矿工。矿工指南的其余页面会深入介绍，每页一个主题：

| 页面 | 内容 |
| --- | --- |
| [安装](/docs/miner/install) | 适用于 Linux、macOS 和 Windows 的安装程序、手动下载以及从源代码构建。 |
| [运行与监控](/docs/miner/run) | 启动与停止、在后台运行、日志与状态页面、备份。 |
| [运行扩展器](/docs/miner/extender) | 需要为矿工的扩展器开放的端口、防火墙与端口转发，以及在 Linux 上让它监听 443 端口。 |
| [更新](/docs/miner/updates) | 矿工如何保持最新，以及如何控制更新。 |
| [获得报酬](/docs/miner/rewards) | 设置收款钱包、奖励如何计算，以及如何领取。 |
| [故障排除](/docs/miner/troubleshooting) | 常见错误以及每种错误的处理方法。 |
| [进阶](/docs/miner/advanced) | 为所有运营商挖矿、在一台主机上运行多个出口、自动领取，以及面向大型集群的头部层级。 |
| [参考](/docs/miner/reference) | 所有日常命令、矿工保存的文件、环境变量和术语表。 |

其他角色请参阅[运行验证者](/docs/validator)和[运行网络运营商](/docs/operator)。

## 工作原理

```text
your miner (provider)
  │ carries internet traffic for
  ↓
a network operator  ←─  validators
  │ pays its pool       measure it
  ↓ every epoch
your Bittensor coldkey (α, $UR)
```

大多数矿工会加入某个运营商的**池**。你不需要自己的 Bittensor 注册：你在运营商处登录，你的矿工将自己注册为设备，池的奖励会支付到你选择的 Bittensor 钱包。大型集群也可以改为领取自己的矿工 UID；请参阅[头部层级](/docs/miner/advanced#claim-your-own-miner-uid-head-tier)。

## 你需要什么

- **一台保持在线的 Linux、macOS 或 Windows 电脑。** 家用电脑、服务器或 Raspberry Pi 2 及更新的型号都可以。在 Windows 上，矿工在你登录期间运行。
- **每个矿工一个稳定的公网地址。** 若要在一台主机上运行多个出口，请参阅[在一台主机上运行多个出口](/docs/miner/advanced#several-exits-on-one-host)。
- **为扩展器开放的端口。** 矿工还会运行一个扩展器，它从其承载的每份合约中赚取一部分份额。它需要入站 TCP 443 端口；建议开放 UDP 443 和 4053 端口，UDP 53 端口为可选。在 Linux 上，它还需要监听 443 端口的权限。请参阅[运行扩展器](/docs/miner/extender)。
- **一个网络运营商的账户。** 矿工默认使用运营商 `bringyour.com`，除非你[选择其他运营商](/docs/miner/run#choose-an-operator)。你将从账户中获得一个**授权码**（auth code），用来让矿工登录。
- **一个用于接收奖励的 Bittensor 钱包地址（coldkey）。** 这是一个以 `5` 开头的 ss58 地址。你可以在另一台设备上为它签名；它的密钥永远不需要放在矿工上。

## 快速开始

矿工程序名为 `provider`。安装它，运行 `provider setup`，并用 `provider status` 查看它的状态。

### 1. 安装

使用安装程序是最简单的方式。它会把矿工放在你的主目录中，在后台运行它，并自动保持更新。

在 **Linux** 上：

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

在 **macOS** 上：

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

在 **Windows** 上，在 PowerShell 中（不要以管理员身份）：

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

然后打开一个新终端。安装程序会要求输入运营商账户中的授权码（对于默认运营商，来自你在 [ur.io](https://ur.io) 的 URnetwork 账户），然后注册此设备并开始挖矿。

安装程序把命令命名为 `urnetwork`，而不是 `provider`。如果你使用了安装程序，凡是本指南写 `provider` 的地方都请输入 `urnetwork`，包括矿工打印出来供你复制的命令。

若不使用安装程序进行安装，请参阅[手动下载](/docs/miner/install#manual-download)。

### 2. 运行 setup

```bash
provider setup
```

它会引导你完成四个步骤，你可以随时停止并重新运行；已完成的步骤会被保留：

1. **登录。** 粘贴运营商账户中的授权码。提示符会隐藏你粘贴的内容。
2. **注册此设备。** 新设备会获得自己的矿工身份，保存在 `~/.urnetwork` 中。
3. **收款地址。** 你的 Bittensor coldkey 地址。Setup 会打印一条简短消息；在你的钱包应用（Polkadot.js、Talisman 或 btcli）中对其签名，然后粘贴签名。你也可以按 Enter 跳过这一步，[稍后再设置](/docs/miner/rewards#set-your-payout-wallet)。
4. **保持运行。** 立即在后台启动矿工，并在每次重启后再次启动（在 Windows 上为每次登录时），同时保持其更新。

如果你使用了安装程序，它已经为你登录、注册了此设备，并在后台运行矿工。运行 `urnetwork setup --no-service` 来添加你的收款地址；`--no-service` 可以防止 setup 在安装程序的矿工旁边再添加第二个后台矿工。

### 3. 查看状态

```bash
provider status
```

矿工启动一分钟后，Miner、Signed in、Device 和 Connected 这几行都应显示 ✓。一切正常时它以 0 退出，设备需要设置时以 3 退出，矿工未运行或未连接时以 4 退出，因此脚本也可以检查它（`provider status --json` 会打印详细信息）。

出现问题时，`status` 会打印下一步要运行的命令。`provider doctor` 会查找原因：状态目录、DNS、连接、检查 TLS 的代理，以及时钟。日志以及停止和启动请参阅[运行与监控](/docs/miner/run)。

### 4. 备份你的矿工

把 `~/.urnetwork` 文件夹复制到某个私密的位置。它保存着此设备的身份和你已签名的钱包历史。如果丢失了它，即使你仍能登录账户，这台设备也无法恢复。请参阅[备份你的矿工](/docs/miner/run#back-up-your-miner)。

就是这样。奖励按结算周期计算，在主网上大约为一周，并在周期结束后领取：请参阅[获得报酬](/docs/miner/rewards)。如果有什么不正常，请参阅[故障排除](/docs/miner/troubleshooting)。

### 不用 setup，逐步操作

`provider setup` 会替你运行这些命令。若要手动完成：

```bash
provider login                    # paste the auth code when asked
provider start                    # the first start asks before registering this device
provider wallet challenge '<your coldkey ss58 address>'
provider service install          # in a second terminal, after Ctrl-C in the first
```

`provider wallet challenge` 会打印一条需要签名的消息；然后带上你的签名，运行它打印出的 `provider wallet set` 命令。[获得报酬](/docs/miner/rewards#set-your-payout-wallet)中有详细说明。`login`、`start` 和 `network` 分别与 `auth`、`provide` 和 `choose_network` 是同样的命令。

## 本指南的来源

本指南遵循当前的 [`sn/miner` 实现](https://github.com/urfoundation/sn/tree/main/miner)及其 [`cli/miner` 入口](https://github.com/urfoundation/sn/tree/main/cli/miner)。其中许多内容是在[我们 Discord 上](https://discord.gg/urnetwork)的讨论中不断完善的，你也可以在那里寻求帮助。
