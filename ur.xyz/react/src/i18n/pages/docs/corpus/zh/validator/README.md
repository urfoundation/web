---
description: 安装并运行当前的 SN25 验证者，配置其密钥和生产配置，监控验证，并提取原生验证者奖励。
---

# 如何运行验证者

UR 验证者运行在 **Bittensor SN25，netuid 25** 上。当前的 [`sn/validator`](https://github.com/urfoundation/sn/tree/main/validator) 通过 `/verify` 遍历路径测量提供者，保留已签名的证据，并通过原生 commit-reveal 提交由此得出的矿工权重。一个 `validator` 进程同时执行测量和权重提交。

验证者获得的是**原生 Bittensor 分红**。它们与从 UR 结算金库领取的提供者奖励是分开的。1.0 版本中没有 `validator claim` 命令，也没有验证者工作奖励。提取流程见下文。

本指南介绍的是 SN25 验证者。**netuid 0 上的根验证者**有单独的注册、运行和篮子领取流程；在根网络上注册并不会启动 UR 验证。UR 的其他角色请参阅[矿工指南](/docs/miner)和[网络运营商指南](/docs/operator)。

## 开始之前

为你打算加入的部署准备以下输入：

- 一台 Linux 主机、持久存储，以及对每个已配置运营商的 HTTPS API 和 WSS 传输的持续访问，外加该部署的 EVM HTTP(S) 和原生 WS(S) RPC 端点。主网的持久卷检查需要 Linux，尽管该二进制文件也可以为 macOS 构建。
- 一个 Bittensor coldkey 钱包，其中有用于注册、质押和交易手续费的资金。请把它保存在用于钱包操作的机器上。运行中的验证者需要其 hotkey 和每个运营商的客户端密钥，而不需要 coldkey。
- 一个已在 SN25 注册的 hotkey，并具有足够的质押权重以获得验证者许可（validator permit）。注册、质押门槛和许可数量都是链上状态，而不是本指南中的固定数值。[Bittensor validator permits](https://www.bittensor.com/docs/guides/validating) 说明了资格是如何确定的。
- 一份完整的、经独立批准的 **schema-3 生产配置**、它所引用的运行时/策略批准，以及每个运营商的激活和历史文件。请在启动服务之前，针对你实际的 hotkey、部署和主机路径获取这些文件。
- 已准备好的状态目录，以及针对这些目录、以 SHA-256 固定的持久卷声明。主网启动需要此声明，并会检查实际的存储身份。

当前的生产二进制文件接受已配置好的 schema-3 部署。它的 `init --config`、`register`、`stake add`、`activate` 和 `status --config` 命令仍然使用旧的预激活加载器，该加载器会拒绝 schema 3。它们无法为当前主网提供自助式引导。请使用下面的原生钱包步骤进行注册和质押；主网的证据和批准输入请通过部署的引导流程获取。更改 schema 编号或复制测试网配置都无法产生这些输入。这一边界记录在[生产运行时准入](https://github.com/urfoundation/sn/blob/main/mainnet/VALIDATOR-PRODUCTION-RUNTIME.md)中。

## 1. 获取验证者

下载验证者的发布版本，或从源代码构建。

### 下载发布版本

验证者以 `urnetwork-validator-<version>.tar.gz` 的形式发布在 [build 版本发布页面](https://github.com/urnetwork/build/releases)上。该压缩包为每个平台包含一个二进制文件，位于 `<os>/<arch>/validator`，适用于 Linux 和 macOS。主网验证者运行 Linux 二进制文件，即 `linux/amd64` 或 `linux/arm64`（请参阅[开始之前](#before-you-start)）：

```bash
VERSION=2026.10.6-1065506180   # the latest tag on the releases page, without the leading v
curl -fSsL -o urnetwork-validator.tar.gz \
  "https://github.com/urnetwork/build/releases/download/v${VERSION}/urnetwork-validator-${VERSION}.tar.gz"
tar -xzf urnetwork-validator.tar.gz
install -d "$HOME/.local/bin"
install -m 755 linux/amd64/validator "$HOME/.local/bin/validator"   # choose your os/arch
"$HOME/.local/bin/validator" --help
```

请把 `$HOME/.local/bin` 添加到你的 `PATH`，以便运行下面的命令。请把发布版本号与二进制文件一起记录下来，以便之后的部署可以复现它。

### 或者从源代码构建

请从为你的部署选定的 `sn` 版本构建。使用 [`sn/go.mod`](https://github.com/urfoundation/sn/blob/main/go.mod) 中声明的 Go 版本，以及与其本地 `replace` 指令相匹配的同级仓库检出：`connect`（包括 `sctp`）、`sdk`、`server`、`warp`、`proxy`、`userwireguard`、`glog`、`goidenticons` 和 `gvisor`。

在 `sn` 仓库根目录中：

```bash
go build -trimpath -o ./bin/validator ./cli/validator
install -d "$HOME/.local/bin"
install -m 755 ./bin/validator "$HOME/.local/bin/validator"
"$HOME/.local/bin/validator" --help
```

请把 `$HOME/.local/bin` 添加到你的 `PATH`，以便运行下面的命令。可执行入口是 `cli/validator`；`validator/` 是可导入的实现，因此 `go build ./validator` 不会生成服务的可执行文件。请把源代码版本与二进制文件一起记录下来，以便之后的部署可以复现它。

## 2. 创建服务密钥

请在主机管理员为验证者准备好存储之后，以将拥有验证者私密文件的账户身份创建密钥。本示例使用运营商 `1` 和 `2`；请替换为实际的运营商 ID，并在你的部署配置中包含每一个运营商：

```bash
umask 077
validator init --state_dir=/var/lib/ur-validator --no_id=1 --no_id=2
```

这会创建 `/var/lib/ur-validator/hotkey.seed`，并为每个运营商创建一个 `no-<id>/client.key`，权限为 `0600`。它会打印 hotkey 的 SS58 地址和公钥，以及每个客户端密钥的公开 `vpk`。已有的 seed 会被复用。hotkey 为 sr25519；每个运营商的客户端密钥为 Ed25519。在重启过程中请把原始密钥与原始状态放在一起保存，并私下备份它们。永远不要在多个运营商或验证者之间共用客户端密钥或状态目录。

使用状态目录形式的 `init` 可以在生产配置存在之前运行。如果你已经在运营已注册的 hotkey，请提供它已有的 seed，而不要生成另一个身份。hotkey 的 seed 文件接受 32 个原始字节或 64 个十六进制字符，可带可选的 `0x` 前缀。请保持每个运营商的客户端 seed 文件为生成时的形式。不要把 seed 材料作为 shell 参数传递，也不要把它放进 YAML 配置中。

## 3. 在 SN25 上注册和质押

在你的 **coldkey 钱包机器**上，按照[官方安装说明](https://www.bittensor.com/docs/quickstart)安装当前的 Bittensor CLI。以下示例使用当前的 v11 命令；如果你的安装使用较旧的 `--wallet.name` 标志，请检查 `btcli --version` 和[迁移指南](https://www.bittensor.com/docs/migration)。

把公开的 hotkey 地址设为 `validator init` 打印出的 `hotkey ss58`，并选择你现有的 coldkey 钱包。这些变量不包含任何机密：

```bash
VALIDATOR_WALLET='your-coldkey-wallet-name'
VALIDATOR_HOTKEY='your-validator-hotkey-ss58'

btcli -n finney query subnet-hyperparameters --netuid 25 --json
btcli -n finney query metagraph --netuid 25 --json
```

提交之前，请检查当前的注册可用性和费用。先预览[注册](https://www.bittensor.com/docs/tx/burned-register)，然后带确认提交同一操作：

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx burned-register \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY"
```

如果该 hotkey 已经注册到预期的 coldkey，请保留该注册。仅注册并不会授予验证者许可。

请根据当前的资格条件和你的可用余额选择要质押的 TAO 数量，并预留手续费。在提示时输入该数量：

```bash
read -r -p 'TAO amount to stake: ' VALIDATOR_STAKE_TAO
btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO" --dry-run

btcli -n finney -w "$VALIDATOR_WALLET" tx add-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-tao "$VALIDATOR_STAKE_TAO"
```

[`add-stake`](https://www.bittensor.com/docs/tx/add-stake) 会按池价格把 TAO 转换为 SN25 的 alpha。确认之前，请检查预览中的手续费和价格保护。在最终确定和分配许可之后，请再次检查 [metagraph](https://www.bittensor.com/docs/query/metagraph)；你的 hotkey、拥有它的 coldkey、UID、质押和验证者许可都必须与生产输入一致。

SN 二进制文件还为其旧加载器所接受的配置保留了 `validator register` 和 `validator stake add`。在加上 `--apply` 之前，它们默认只做试运行，接收 coldkey 的 seed 文件，并以 **rao** 表示质押数量。它们不能替代此处所述的主网 schema-3 设置。

## 4. 在每个运营商处进行身份验证

为每个已配置的运营商使用单独的账户凭据和客户端身份。对于参考运营商，请在 [ur.io/?auth](https://ur.io/?auth) 获取授权码，然后运行：

```bash
validator auth --api_url=https://api.bringyour.com
install -m 600 "$HOME/.urnetwork/jwt" /var/lib/ur-validator/no-1/network.jwt
```

对于其他运营商，请使用其实际的 API 和登录流程，然后把新签发的令牌复制到该运营商的目录中。`validator auth -f --api_url=...` 会显式替换临时的 `$HOME/.urnetwork/jwt`；`validator auth --user_auth=... --api_url=...` 则会改为提示输入密码。

`validator auth --operator=<domain>` 会在公布的[运营商列表](/operators.yml)中查找该运营商，而不使用 `--api_url`，并把其令牌写入 `<state_dir>/operators/<domain>/jwt`；默认状态目录为 `~/.urnetwork/validator`。[测量每个列出的运营商](#measure-every-listed-operator-without-weights)就是从那里读取令牌的。使用 `--hotkey_seed_file=<path>` 时，`validator auth` 会用 hotkey 作为 TAO 钱包登录，代替授权码或密码。生产配置只读取它所指定的 `network_jwt_file` 路径。

每个运营商的配置都会指定 `network_jwt_file`、`client_jwt_file` 和 `client_key_seed_file`。客户端 JWT 与原始客户端密钥和身份绑定。生产配置可以通过 `allow_client_registration: true` 显式授权首次注册；如果没有这一签名许可，请提供现有的客户端凭据。不受支持的注册 API、缺少登录或身份不匹配都可能让测量一直处于等待状态。恢复身份验证时，请保留现有身份。

## 5. 准备生产配置和证据

请使用完整的、已批准的 `release.yml`，而不是手动编辑过的已签名配置。以下是当前 [`ReleaseConfig`](https://github.com/urfoundation/sn/blob/main/validator/config.go) 的输入清单：

| 输入 | 需要准备的内容 |
| --- | --- |
| 生产身份 | `schema_version: 3`、`production: true`、`release: "1.0"`、该部署的 `deployment_id`，以及你的非零 `validator_id`。 |
| 网络和合约 | 主网的 `chain_id: 964`、`netuid: 25`，以及实际的 `genesis_hash`、`coordinator`、`settlement_vault` 和 `deploy_block`。 |
| 运行时 | 经过审核的 `runtime_spec`、`transaction_version`、`state_version`、`runtime_code_hash` 和 `runtime_metadata_hash`，外加批准中有限的原生区块/周期窗口和生产者能力。 |
| 策略和调度 | 完整的 `policy`、与之匹配的 `policy_hash`、`version_key`、等于策略中遍历深度的 `trail_depth`，以及取值为 1 到 60 的 `poll_seconds`。 |
| 原生经济批准 | 该部署经独立签名的 `treasury_approval` 或 `owner_recycle_approval`，以及独立的公开签名者，和批准文件的确切路径、字节长度及 SHA-256。这两个选择器互斥。 |
| 连接 | 明确的 EVM `rpc` HTTP(S) 端点和原生 `substrate` WS(S) 端点。 |
| 私密服务文件 | `state_dir`、`hotkey_seed_file`，以及每个运营商各自独立的状态和凭据。 |
| 运营商目录 | 每个运营商的 `no_id`、`api_url`、`connect_url`、各不相同的 `artifact_signer`、凭据/密钥路径以及 `concurrency`。至少包含 `policy.safety.minimum_healthy_no_count` 个运营商。 |
| 独立性 | `controlled_no_ids` 列出你控制的运营商，以便屏蔽它们的池和相关的头部集群。 |
| 证据 | 完整的 `evidence_v2` 界限，以及每个运营商的 `activation`、`vpk_signature`、`hotkey_signature`、`context`、`history`、`replay_scratch_root` 和 `seal_scratch_root`。文件引用会固定路径、字节和 SHA-256。 |
| 原始请求证据 | 对于使用原始请求回执流程的运营商，部署的 `request_receipt_scope` 和 `request_preparation`，以及它们已准备好的存储。 |
| 续期历史 | 任何选定的 `production_runtime_approvals`、`production_authority_history`，以及在其原始授权下重放现有工作所需的容量修订。 |

当前的金库生产路径及其批准格式在[原生金库生产](https://github.com/urfoundation/sn/blob/main/validator/TREASURY-PRODUCTION.md)中有说明。验证者会收到公开的金库路由数据；金库私钥不是验证者的前提条件。

请根据已批准的证据和历史界限以及所有已配置的遍历工作线程来确定主机规格。每个运营商的 `concurrency` 必须在 1 到 128 之间，不得超过策略的活跃遍历上限，并允许每个工作线程在步骤超时之前进入限速的 seed 闸门。在已签名的配置中提高并发或磁盘界限，需要经过批准的替换配置。

激活记录把每个运营商的客户端身份与你已注册的验证者 hotkey 绑定，并带有双方的签名以及已最终确定的证据日志发布。它们的上下文和历史必须覆盖所配置的初始结算边界。生产服务在开始新工作之前会验证这些输入。在主网上，空的 `evidence_v2.operators` 条目是不够的。旧的 `validator activate --config=...` 路径无法从 schema-3 配置生成这些输入。

准备时请保持路径稳定。相对路径以配置目录为基准解析，移动配置可能会改变其含义。一个典型的布局如下：

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

这些只是示例路径，不能替代你已批准的包中的路径。私密文件需要受保护的属主和权限；协议目录必须使用已准备好的持久存储。仅创建空目录并不能准备好尝试账本，也不能替代其保留的历史。请把进度文件放在所有协议、密钥、凭据和证据目录之外，放在一个已存在、且组和其他用户都不可写的父目录中。

## 6. 运行和监控验证者

请设置持久卷声明的**经独立认可的 SHA-256**；不要用新计算出的哈希来绕过不匹配。启动之前，请检查已准备好的目录：

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

前台命令会执行真实的验证，并且在满足已批准的条件后可以提交权重。每个 hotkey 和状态命名空间只能运行恰好一个进程。在你部署的服务管理器下使用相同的参数；重启时请保留原始日志和已签名的待处理交易。遇到托管或配置方面的拒绝时，请先处理，再重启，而不要删除状态或生成替换密钥。

`--operators-refresh=1h` 会跟踪公布的[运营商列表](/operators.yml)，每小时重新获取一次，但不会改变验证者签名或赋予权重的内容：只有在已签名配置中固定的运营商才会被赋予权重，版本的运行方式与不带该标志时完全相同。该列表缓存为配置的 `state_dir` 中的 `operators.yml`。在启动时以及列表每次变化时，验证者都会在日志中记录一份偏差报告，并把它写入该缓存旁边的 `operators-report.json`。报告会显示每个固定的运营商（按 API URL 与列表匹配）是在列表中还是已被移出，以及任何连接 URL 不一致的情况，还会列出配置未固定的每个列出的运营商。它是运维输出；没有任何东西会读回它。

使用 `--operators-refresh` 时，`--operators-url=<url>` 会跟踪另一个列表，`--observe-unpinned-operators` 还会测量配置未固定的每个列出的运营商，仅用于观察，结果保存在配置的 `state_dir` 中的 `observed-operators/<domain>/` 下。观察会使用配置的 `hotkey_seed_file` 登录和配置，其结果永远不会进入权重、证据或生产状态。固定的运营商保留其配置的 `network_jwt_file`；如果缺失，会被报告，但永远不会被创建。

请关注 stderr 和有大小上限的[进度记录](https://github.com/urfoundation/sn/blob/main/mainnet/SERVICE-PROGRESS.md)。检查几个相互独立的信号：

- 近期的 `heartbeat_at` 和 `publisher.last_success_at` 表明进程和发布处于活动状态。
- `intent` 记录展示已准备、已最终确定和已应用的交易边界。已提交或待处理的交易还不是已应用的权重向量。
- `settlement` 显示持久的周期游标和尚未完成的发布工作。
- 运营商身份验证和遍历路径诊断显示每个运营商的测量能否推进。
- 运营商列表的偏差不在进度记录中。使用 `--operators-refresh` 时，它在日志和 `operators-report.json` 中。
- 原生 metagraph 读取显示该 hotkey 是否仍持有其 UID 和许可，以及是否在获得分红。

等待一个周期可能是正常的；仅有新的心跳并不能证明验证成功。当前的 `validator status --config` 会拒绝 schema 3，因此对于这条生产路径，请使用进度记录、服务日志和原生链读取。不带 `--config` 时，`validator run` 是旧版的仅测量模式，永远不会写入版本权重。

### 测量每个列出的运营商而不写入权重

`validator run --all-operators` 会测量公布的运营商列表中的每个运营商，并且永远不会写入权重。每个运营商在 `<state_dir>/operators/<domain>/` 下都有自己的状态：令牌 `jwt`、测量密钥 `.validator.key` 和客户端 JWT `.validator.jwt`。单运营商的 `<state_dir>/.validator.key` 和 `~/.urnetwork/jwt` 不会被使用。

```bash
validator run --all-operators --auto-register \
  --hotkey_seed_file=/absolute/private/hotkey.seed
```

- `--auto-register` 会在运营商没有令牌时，用 hotkey 作为 TAO 钱包登录。它只为全新的运营商目录配置测量身份，永远不会恢复、接管或替换已有的身份。seed 文件必须已经存在；它永远不会被创建。
- 不使用 `--auto-register` 时，没有令牌的运营商会在日志中记录 `operator <domain> is awaiting auth: validator auth --operator=<domain>`，并每五分钟重新检查一次。没有测量身份的目录会被拒绝并重试，日志会指出用于配置它的标志。
- 列表缓存为 `<state_dir>/operators.yml`，每小时（或每隔 `--operators-refresh`，即不少于 `1m` 的 Go 时长）重新获取一次。`--operators-url=<url>` 会跟踪另一个列表。在无法获取列表期间，会继续使用最后一份有效副本。
- 新列出的运营商会启动，被移出列表的运营商会停止并保留其状态，URL 发生变化的运营商会重启。失败的运营商会在 30 秒后重启，间隔逐次加倍，最长 10 分钟，并且永远不会让其他运营商停止。

## 7. 领取验证者奖励

SN25 验证者分红通过 Bittensor 的原生质押记账累积。你的 coldkey 控制你自己的头寸；委托的质押及其奖励属于委托方的 coldkey，并需扣除验证者的抽成。UR 的协调器和结算金库不托管验证者分红。`provider claim`、`snclaim submit` 以及运营商的支付 Merkle 证明都用于矿工/提供者的奖励路径。

若要把可用的 SN25 alpha 换回**自由 TAO**，请从实际持有该头寸的 hotkey 中取消质押你选择的数量。请使用 coldkey 钱包机器以及第 3 步中相同的公开钱包变量。首先检查你的头寸，并以 **alpha**（而不是 TAO）为单位选择数量：

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

[报价](https://www.bittensor.com/docs/query/quote-unstake)会估算 TAO 产出、手续费和滑点。检查试运行结果和剩余质押后，通过交互式确认提交：

```bash
btcli -n finney -w "$VALIDATOR_WALLET" tx remove-stake \
  --netuid 25 --hotkey "$VALIDATOR_HOTKEY" \
  --amount-alpha "$VALIDATOR_WITHDRAW_ALPHA"

btcli -n finney -w "$VALIDATOR_WALLET" stake list
btcli -n finney -w "$VALIDATOR_WALLET" wallet balance
```

[`remove-stake`](https://www.bittensor.com/docs/tx/remove-stake) 会把可用的 alpha 兑换为 TAO，并记入签名 coldkey 的自由余额。请检查已最终确定的交易结果和更新后的余额。你累积的头寸同时包含本金和奖励：SN25 中没有单独的“只领取我的收益”余额。取消质押可能会影响你的许可；锁定、抵押、手续费和池价格保护都可能限制该操作。如果你的奖励被导向了另一个质押 hotkey，请选择那个实际的头寸。

**根网络奖励有所不同。** 如果你也在 netuid 0 上质押，其篮子收益在提取之前有单独的原生根领取流程。请按照 [Bittensor 关于根质押和分红的说明](https://www.bittensor.com/docs/guides/staking#root-stake-and-dividends)操作。不要用根领取来收取普通的 SN25 alpha 奖励。
