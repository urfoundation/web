---
published: 2026-10-21
description: UR 进阶挖矿。用一个 hotkey 为每个列出的运营商挖矿，在一台主机上运行多个出口，自动化或分离领取，并以头部层级集群的身份领取自己的矿工 UID。
---

# 进阶挖矿

大多数矿工不需要本页：[快速开始](/docs/miner#quick-start)已经涵盖了一台设备服务一个运营商的情况。如果你想服务所有运营商、在一台主机上运行多个出口、自动领取或运行大型集群，请继续阅读。如果你使用了安装程序，凡是本页写 `provider` 的地方都请输入 `urnetwork`。

## 为每个列出的运营商挖矿

`provider provide --all-operators` 会为 [ur.xyz/operators.yml](/operators.yml) 上公布的列表中的每个运营商挖矿，每个运营商一个矿工进程。最简单的方式是用 Bittensor **hotkey** 作为 TAO 钱包，在每个运营商处登录：

```bash
provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed
```

这不涉及任何链上交易。第一次登录会在该运营商处创建该 hotkey 的网络，每个新运营商都会注册其第一台设备：`--auto-register` 隐含 `--allow-client-registration`，后者永远不会替换矿工已有的身份。seed 文件保存 hotkey 的 32 字节 sr25519 seed，可以是原始格式，也可以是 64 个十六进制字符，存放在一个矿工永远不会自行创建的私密文件中。

若要改为自己在各运营商处登录，请先列出它们，然后分别使用授权码、你的账户登录或 hotkey 登录：

```bash
provider operators
provider auth --operator='<domain>'
provider auth --operator='<domain>' --user_auth='you@example.com'
provider auth --operator='<domain>' --hotkey_seed_file=/absolute/private/hotkey.seed
```

`provider operators` 会打印列表的来源及其摘要，然后列出每个运营商的域名、登录状态（`jwt present` 或 `awaiting auth`）、API URL 和连接 URL。`provider auth --operator` 会询问你没有传入的授权码或密码，并把该运营商的登录信息保存在 `~/.urnetwork/operators/<domain>/jwt` 中。以这种方式登录的运营商还没有设备，因此第一次启动需要注册标志；之后的启动则不需要：

```bash
provider provide --all-operators --allow-client-registration
```

没有登录的运营商不会分配矿工。日志会显示 `operator <domain> is awaiting auth: provider auth --operator=<domain>`，矿工每五分钟再检查一次。

### 运行方式

使用 `--all-operators` 时，一个进程会为每个列出的运营商照看一个矿工：

- 每个运营商都有自己的文件夹 `~/.urnetwork/operators/<domain>/`，其中有各自的登录信息、身份密钥和设备凭据。这些都是新的设备身份：不会使用 `~/.urnetwork` 中的单运营商身份，用 `provider network use` 选择的运营商也不适用。
- 列表每小时重新获取一次。`--operators-refresh=<duration>` 可以更改这一频率，使用不少于 `1m` 的 Go 时长格式，例如 `30m`；`--operators-url=<url>` 则会改用另一个列表。最后一份有效副本保存为 `~/.urnetwork/operators.yml`，因此即使 ur.xyz 无法访问，挖矿也会继续。
- 新列出的运营商一旦完成登录就会分配矿工，URL 发生变化的运营商的矿工会被重启。被移出列表的运营商的矿工会收到 SIGTERM，60 秒后收到 SIGKILL；其文件夹会被保留。
- 退出的矿工会在 30 秒后重启，间隔逐次加倍，最长 10 分钟。按 Ctrl-C 或发送终止信号会停止所有矿工。
- `--max-memory` 会在各矿工之间平均分配，当某个矿工的份额变化时它会重启。`--port` 会提供所有运营商的状态；各矿工本身运行时不带状态端口。
- 第一个占用 TCP 443 端口的矿工进程为整台主机提供扩展器。
- `--all-operators` 不接受 `--api_url`、`--connect_url`、`--provider-jwt`、`--wallet` 及其签名标志、`--test-egress-source-ip`，以及 capture 和 close-report 相关的标志，这些仍然只适用于单个运营商。

若要将其作为[你自己的服务](/docs/miner/run#a-service-of-your-own)运行，请使用 `ExecStart=%h/.local/bin/provider provide --all-operators --auto-register --hotkey_seed_file=/absolute/private/hotkey.seed`。在自动模式下，服务会保留 `--auto-register`，因此每个新列出的运营商都会注册其第一台设备；这永远不会替换矿工已有的身份。如果你自己在各运营商处登录，请去掉 `--auto-register`；如果你使用下面介绍的 hotkey 收款方式，请保留 `--hotkey_seed_file`；并且只在登录新运营商后的第一次启动时才加上 `--allow-client-registration`。

### 为所有列出的运营商只签名一次

使用 `--all-operators` 时，一次 coldkey 签名即可在每个运营商处设置收款钱包。coldkey 和 hotkey 共同签署一份把 hotkey 映射到 coldkey 的全局声明，以链的形式保存在 `~/.urnetwork/hotkey-wallet/` 中。随后，每个已登录的运营商都会保存这条链，并由 hotkey 单独在那里签署一份委托，把你的网络委托给这条链的最新条目。coldkey 永远不需要为每个运营商单独签名。

请求获取声明：

```bash
provider wallet hotkey challenge '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

在与[普通钱包](/docs/miner/rewards#set-your-payout-wallet)相同的 sr25519 `substrate` 上下文中，用 coldkey 签署打印出的声明（必须一字不差），然后运行 challenge 打印出的 `wallet hotkey set` 命令。它看起来像这样：

```bash
provider wallet hotkey set '<coldkey_ss58>' \
  --hotkey_seed_file=/absolute/private/hotkey.seed \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

该声明会在 `hotkey-wallet/pending.json` 中等待，直到被设置或替换。如果你有意把 coldkey 的 seed 保存在这台电脑上，请向 `set` 传入 `--coldkey_seed_file=/absolute/private/coldkey.seed`，代替 `--message` 和 `--signature`。

`set` 会加上 hotkey 的签名，把新条目追加到这条链中，然后在每个已登录的运营商处保存这条链和委托，并逐一报告结果；某个运营商失败永远不会妨碍其他运营商。带 `--hotkey_seed_file` 的 `provider provide --all-operators` 会在启动时以及之后每小时让每个已登录的运营商保持委托状态，包括之后才列出的运营商，因此 coldkey 只需签名一次。`provider wallet hotkey status` 会显示这条链、任何待处理的声明以及每个运营商的委托情况。

除非通过 `--wallet-from-epoch` 和 `--wallet-through-epoch` 指定，第一个条目从周期 0 开始获得收益，之后的条目则从运营商的当前周期加 1 开始。每份委托从运营商的当前周期加 2 开始，每个范围覆盖 65,536 个周期。之后的条目可以更改 coldkey 或周期。

运营商按以下优先顺序向设备付款：设备自己的钱包（`provider wallet set`），然后是整个网络的钱包，最后是 hotkey 委托。

### 在所有运营商处领取

每个运营商都分别结算自己的池，因此请分别向每个运营商领取。按 `provider operators` 打印的信息，选择该运营商的设备凭据及其 API URL：

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>' \
  --provider-jwt="$HOME/.urnetwork/operators/<domain>/.provider.jwt" \
  --api_url='<operator api_url>'
```

## 在一台主机上运行多个出口

矿工支持 SOCKS5 出口，每个代理地址对应一台单独的设备：

```bash
provider proxy add '<host>:<port>:<user>:<pass>'
provider proxy add --proxy_file=/absolute/private/proxies.txt
provider provide --allow-client-registration
```

只在添加真正的新出口时才使用注册标志；平常重启使用 `provider provide` 即可。每个出口都保存一个 `.provider-<hash>.jwt` 及其注册附属文件。为该出口设置钱包和领取奖励时，请用 `--provider-jwt` 选择该文件。共享的 `.provider.key` 和每个出口的文件都应放在同一份备份中。真正起作用的是不同的、可路由的出口：在同一个出口后面增加账户并不会增加覆盖范围。

`provider proxy remove` 用于移除出口，`provider proxy auth add` 和 `provider proxy auth remove` 用于管理代理凭据；请参阅 `provider proxy --help`。使用 `--all-operators` 时，`~/.urnetwork` 中的 `proxy` 文件会在每个运营商的矿工启动时被复制到该运营商的文件夹中。

## 自动领取

### 从另一台电脑提交领取

为了让 relayer 密钥远离矿工，请先在矿工上用 `provider claim` 检查领取，然后在另一台电脑上用 `snclaim` 提交完全相同的领取数据和金库地址。请从同一份源代码构建它：

```bash
# From sn/:
go build -o "$HOME/.local/bin/snclaim" ./cli/snclaim
```

或者从同一个版本中下载：[版本发布页面](https://github.com/urnetwork/build/releases)上还有 `urnetwork-snclaim-<version>.tar.gz`，其中包含适用于 Linux 和 macOS 的 `<os>/<arch>/snclaim`。请按照[手动下载](/docs/miner/install#manual-download)安装矿工的方式安装它。然后：

```bash
snclaim submit --calldata='0x<verified claim calldata>' \
  --contract='0x<settlement vault>' --rpc='https://<evm-json-rpc>' \
  --chain_id=964 --key_file=/absolute/private/relayer.key --dry-run
```

请使用你的部署实际的链 ID，并去掉 `--dry-run` 来正式发送。提交领取的电脑仍然需要 RPC 连接。若要查看某个领取是否已被接受：

```bash
snclaim status --epoch='<settlement_epoch>' --no_id='<operator id>' \
  --coldkey='<coldkey_ss58>' --contract='0x<settlement vault>' \
  --rpc='https://<evm-json-rpc>'
```

### 领取守护进程

领取守护进程只能在 Linux 和 macOS 上运行。领取守护进程会把待处理和已签名的领取保存在一个持久队列中，并在重启后继续跟踪它们在 EVM 链上的结果。它的配置是严格的 YAML：

```yaml
schema_version: 1
release: "1.0"
api_url: https://api.example.net
rpc:
  - https://evm-rpc.example.net
key_file: /home/miner/.urnetwork/private/relayer.key
jwt_file: /home/miner/.urnetwork/.provider.jwt
state_dir: /var/lib/urnetwork/claims/provider-1
poll_seconds: 30
lookback_epochs: 2
```

请替换这些路径和端点。相对文件路径以配置文件为基准解析。`jwt_file` 用于选择设备凭据，必须是一个私密的普通文件；省略时会选择默认的 `.provider.jwt`。`poll_seconds` 接受 5 到 3,600；默认回溯两个周期，最多 256 个。

启动前，请准备好领取队列的存储，并为主机取得确切的持久卷声明及其经过审核的摘要。当前的存储准入要求提供它们；仅有一个空文件夹或省略这些标志是不够的。该声明使用守护进程卷的模式，并覆盖实际的 `state_dir` 和队列。请参阅关于[领取队列所有权](https://github.com/urfoundation/sn/blob/main/miner/CLAIM-QUEUE-OWNERSHIP.md)和[离线存储准备](https://github.com/urfoundation/sn/blob/main/mainnet/OWNER-CUSTODY-PREPARATION.md)的说明。

```bash
provider claim-daemon --config=/absolute/path/claim.yml \
  --durable-volumes=/absolute/path/reviewed-daemon-volumes.json \
  --durable-volumes-sha256='sha256:<reviewed digest>'
```

每个队列和 relayer 密钥只运行一个守护进程，并且不要同时用该密钥提交单次领取或运行另一个守护进程。提交中断后，请保留整个队列文件夹，包括其附属文件。标记为 `uncertain` 的队列条目需要核对其原始的已签名交易。已最终确定的领取条目表明领取已被接受；支付事件则可以区分已支付的奖励和延期的额度。

对于结算 v2 账户，`provider claim-daemon-v2` 会在账户的可领取余额达到 `--threshold-rao`（默认 1.9 α）时进行领取，`--claim-now` 则会在启动时一次性领取所有可领取的金额。`--v1-config` 会在同一进程中运行上面的 v1 守护进程，共用一个 relayer 密钥。其选项请参阅 `provider claim-daemon-v2 --help`。

## 领取你自己的矿工 UID（头部层级）

默认情况下，每个矿工都在其运营商的**池**中获得收益：运营商的池 UID 获得报酬，再由池分配给其设备。大型集群可以改为在子网上领取**自己的矿工 UID**。这样，验证者会直接为该 UID 赋予权重，链会在每个 tempo 原生地向它付款，形式是质押在该集群自己的 hotkey 上、归属于其自己 coldkey 的 α。支付路径中没有池、没有运营商，也没有领取环节。

### 谁可以获得

验证者只为**前 200 个集群**赋予权重；其他所有集群的 UID 什么也得不到。集群按**可路由出口的广度**排名，而不是按流量：

- 验证者通过其路由真实验证跳的每个出口地址都会被归并到其网络前缀（IPv4 为 /29，IPv6 为 /48）。一个集群的得分是其设备所出口的不同前缀的数量。
- 与其他头部集群共享的前缀会在它们之间平均分配，因此同一地址后面或同一小范围内的许多设备只算一次。
- 得分会随时间平滑（每个 tempo 计入四分之一），因此一次糟糕的测量不会让集群掉出排名，而新集群需要一段时间才能达到其完整得分。

一个家庭网络连接大约算作一个前缀。对于那些设备从许多不同网络出口的集群，例如分布在许多数据中心或许多家庭网络连接上的主机，头部 UID 才划算。

若要了解你所处的位置，ur.io 上的 **Top 200** 页面会显示你账户的估计得分和相对于入围线的排名，以及你的设备是否已绑定到 hotkey。

### 成本与风险

- **注册会销毁 α。** 集群的 coldkey 需要支付子网当前的注册销毁费用，而每一次新注册都会提高下一次的费用。`provider fleet register` 会在签名任何内容之前显示当前的销毁费用。
- **UID 数量有限。** 子网已满时，新的注册会替换发行最低的 UID，前提是该 UID 的豁免期已经结束。掉出前 200 名的集群什么也赚不到，会被下一次注册替换，若想回来必须再次支付销毁费用。
- **一次只能在一个层级。** 绑定到头部集群的设备在绑定有效期间不会获得池份额。如果集群失去其 UID，其设备会重新在其运营商的池中获得收益。设备已经获得的池奖励仍然可以领取。
- **绑定是公开的。** 绑定会公开哪些设备属于你的 hotkey，因而也会公开它们所出口的网络前缀。池中的设备不会以这种方式与你关联。

### 如何领取

你需要一个持有足够 TAO 用于销毁的 Bittensor coldkey、一个用于集群的 hotkey，以及矿工的身份文件（`~/.urnetwork`）。请把 coldkey 只保存在一台用于注册的电脑上；矿工只需要它们自己的身份。在主网上进行注册、发布、绑定和撤销只能在 Linux 和 macOS 上运行。

1. **编写集群清单。** 清单列出网络的链 ID、netuid 和协调器、一个集群 ID、集群 hotkey、一个代数（generation），以及每台设备的客户端 ID 和公钥。`provider fleet init` 会根据矿工的文件生成清单，`provider fleet manifest --manifest=<path>` 会对其进行检查。
2. **注册 UID。** 使用清单、hotkey 和 coldkey 的 seed 文件以及 `--substrate` 端点运行 `provider fleet register`。不加 `--apply` 时它是一次试运行，会报出当前的销毁费用和手续费。加上 `--apply` 即可签名并广播，同时用 `--burn_limit_rao` 和 `--fee_limit_rao` 作为上限：链会拒绝任何销毁超过你上限的注册。
3. **发布清单。** `provider fleet publish` 会从集群 hotkey 把清单的哈希写到链上。
4. **把每台设备绑定到 hotkey。** 每份绑定都同时由设备的密钥和集群 hotkey 签名，因此没有人能认领不是自己运行的设备。绑定最早从下一个周期开始，并覆盖你选择的周期范围（`--valid_from_epoch`、`--valid_to_epoch`）。可以任选其一：
   - 为每台设备运行 `provider fleet sign`，它只读取本地文件，然后把它的输出粘贴到 ur.io 的 Top 200 页面，并从你自己的 EVM 钱包提交该页面准备好的交易；或者
   - 为每台设备运行 `provider fleet bind`，它会使用 EVM relayer 密钥和 `--rpc` 端点自行提交绑定。
5. **检查并维护。** `provider fleet status` 显示设备的绑定和 UID。`provider fleet revoke` 会从某个未来周期起移除一台设备。新设备用同样的方法绑定，并在绑定的最后一个周期之前重新绑定。

在主网上，`register`、`publish`、`bind`、`status` 和 `revoke` 还需要网络经过审核的集群运行时授权文件（`--mainnet-runtime-authority` 及其 `--mainnet-runtime-authority-sha256`），写入操作还需要一份持久卷声明（`--durable-volumes` 和 `--durable-volumes-sha256`）。所有选项请参阅[集群授权与恢复合约](https://github.com/urfoundation/sn/blob/main/miner/FLEET-MAINNET-RUNTIME.md)和 `provider fleet --help`。头部层级和池层级如何评分，请参阅[白皮书](https://github.com/urfoundation/sn/blob/main/WHITEPAPER.md)的第 8.4 节和第 11.4 节。
