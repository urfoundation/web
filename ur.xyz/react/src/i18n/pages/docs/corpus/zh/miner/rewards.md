---
published: 2026-10-21
description: 在 UR 上挖矿获得报酬。设置矿工收益所对应的收款钱包，了解池奖励如何按周期计算，并把奖励领取到你的 coldkey。
---

# 挖矿获得报酬

你的矿工会因其承载的流量获得收益。本页介绍获得报酬的三个部分：告诉运营商向哪个 Bittensor 钱包付款（[设置收款钱包](#set-your-payout-wallet)）、[奖励如何计算](#how-rewards-are-counted)，以及[领取奖励](#claim-your-rewards)。

如果你使用了安装程序，凡是本页写 `provider` 的地方都请输入 `urnetwork`。

## 设置收款钱包

奖励会发放到 Bittensor 的 **coldkey**：一个以 `5` 开头的 ss58 地址。你需要用这个 coldkey 签署一段简短声明，以证明它属于你。运营商会为这台设备保存这份已签名的声明，因此仅仅在账户资料中保存一个钱包地址是不够的。

最简单的方式是使用 [`provider setup`](/docs/miner#2-run-setup) 中的收款步骤：它会打印消息，你在钱包应用中签名后粘贴签名即可。之后你也可以只为这一步再次运行 `provider setup`；如果你使用了安装程序，请运行 `urnetwork setup --no-service`。下面的命令则是手动完成同样的操作。

请在设备首次启动（`provider setup`，或第一次 `provider start`）**之后**再设置钱包，因为声明中写明了那次启动所注册的设备。在此之前，`wallet challenge` 和 `wallet set` 会因 `claim/wallet credential not ready at …/.provider.jwt` 而失败。

### 在钱包应用中签名（推荐）

这样可以让你的 coldkey 密钥远离矿工。首先，请求获取声明：

```bash
provider wallet challenge '<coldkey_ss58>'
```

在一个能够用 sr25519 签署原始消息的钱包中，用该 coldkey 签署打印出的声明（必须一字不差），例如在 [polkadot.js Apps](https://polkadot.js.org/apps/#/signing)（Developer → Sign and verify）中使用 Polkadot.js 扩展里的账户。然后带上你的签名，运行 challenge 打印出的 `provider wallet set` 命令。（如果你使用了安装程序，请把命令开头的 `provider` 改为 `urnetwork`。）它看起来像这样：

```bash
provider wallet set '<coldkey_ss58>' \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

签名必须满足：

- 针对打印出的原始声明，作为 UTF-8 文本，使用 LF 换行且末尾没有多余的换行，并在 `substrate` 签名上下文中用 sr25519 签名。在 `--message` 中，字面量 `\n` 表示换行。
- 也接受类型为 `bytes` 的 Polkadot 扩展 `signRaw` 签名，它会把声明包装在 `<Bytes>...</Bytes>` 中。
- 在 challenge 打印的时限内提交，通常为五分钟。

打印出的命令保留了你正在使用的运营商和设备，因此请复制它，而不要自己输入。

### 在矿工上使用 seed 文件签名

如果你有意把 coldkey 的 seed 保存在矿工所在的电脑上，矿工可以自行获取并签署声明：

```bash
provider wallet set '<coldkey_ss58>' \
  --coldkey_seed_file=/absolute/private/coldkey.seed
```

该文件必须已经存在、归你所有、保持私密（例如权限为 `0600`），并且路径中没有符号链接。它保存的是 32 字节的原始 sr25519 mini secret，或以 64 个十六进制字符表示的同一内容（可带 `0x` 前缀）。它不是助记词。如果 seed 与地址不匹配，命令会拒绝，而且 seed 永远不会离开你的电脑。

你也可以在矿工启动时设置钱包：`provider provide --wallet='<coldkey_ss58>' --coldkey_seed_file=/absolute/private/coldkey.seed`。如果设置失败，矿工会记录失败并继续运行，因此在依赖它之前请先查看日志。

### 钱包何时开始获得收益

奖励按**周期**计算。新的钱包设置从**下一个**周期开始生效，持续 65,536 个周期，因此请在你想获得收益的周期之前设置它，并在到期前续签。它永远不会改变更早奖励的去向。若要改为选择一个精确的范围，请同时向 `wallet challenge` 和 `wallet set` 传入 `--wallet-from-epoch=<epoch>` 和 `--wallet-through-epoch=<epoch>`；最早接受哪个周期仍由运营商决定。

矿工会把每份已签名的声明保存在 `~/.urnetwork` 中的 `.provider.jwt.wallet-consent/history.json`。请把它和你的[备份](/docs/miner/run#back-up-your-miner)放在一起。如果发送声明时被中断，再次运行同一命令会发送同一份已签名的声明，即使 seed 已不在这台电脑上。

每台需要获得收益的设备都需要自己的已签名钱包；多台设备可以使用同一个 coldkey。对于同一主机上的额外出口，请用 `--provider-jwt` 分别选择：请参阅[在一台主机上运行多个出口](/docs/miner/advanced#several-exits-on-one-host)。若要为所有列出的运营商只签名一次，请参阅[为所有列出的运营商只签名一次](/docs/miner/advanced#sign-once-for-every-listed-operator)。

## 奖励如何计算

池奖励取决于你的矿工完成的流量，以及它在测量中表现的可靠程度。运营商会把已完成的工作记到你的设备名下，并向为该周期签名的钱包付款。**同样大小的付费流量和免费流量获得同样的积分。** 账户余额、预留、订阅付款和未完成的合约都不能作为工作证明。

每台设备在池中的份额与以下数值成正比：

```text
completed usage bytes × reliability
reliability = confirmations / max(assignments, reliability_a_min)
```

要获得某个周期的报酬，设备需要大于零的已完成使用量、至少达到要求次数的验证检查、至少一次确认、该周期的已签名钱包，并且没有生效中的头部层级绑定。向同一个 coldkey 付款的设备会合并为一笔支付。从结算 v2 的切换周期开始，池只按已完成使用量划分，没有可靠性系数或最低门槛，并为每个收款 coldkey 计入一个永不过期的账户（请参阅 [Litepaper](/docs/litepaper)）。

验证者独立测量路由质量，并为运营商池和头部集群赋予权重。矿工获得的是 **momentum**：子网矿工发行中当下用于驱动网络的那部分份额，按策略在池层级和头部层级之间分配。momentum 为 10%；当前值以你的运营商公布的策略为准。[Network Capacity Reserve](/reserve)，即 `ur-reserve` 账户，获得其余部分：矿工发行 × (1 − momentum)。它的份额并不固定；随着 momentum 增长，它会变小。momentum 是发行中的一个份额，而不是按字节计算的固定价格；实际收益请看你的运营商公布的策略和支付文件。该储备与结算金库中的领取抵押品是分开的。

结算周期由已部署的合约和策略决定。在主网上为 50,400 个区块，按每个区块 12 秒计算约为七天。一个周期结束后，其支付根会先被提交并最终确定，然后才开放领取，因此最近的工作无法立即领取。领取命令打印的 `claim_open_block`，以及你的运营商公布的部署时间窗口，会告诉你何时可以领取。

## 领取奖励

一次领取会从运营商处获取你的证明，进行检查，然后把它发送到结算金库，由金库向你的 coldkey 付款。你需要运营商公布的部署信息：其 EVM RPC 端点、结算金库地址和链 ID（主网上为 964）。仅仅登录和挖矿并不意味着该运营商的子网奖励已经生效；以其公布的部署信息为准。

### 1. 检查领取

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>'
```

请使用你的运营商的 EVM RPC 端点；你可以重复 `--rpc` 来添加备用端点，它们会按顺序尝试。矿工会检查证明和支付根，并打印 `epoch`、`no_id`、`coldkey`、`share_bps`、各支付根、金库 `contract`、`claim_open_block` 以及领取数据。请将 coldkey、合约和链 ID 与你的运营商公布的部署信息进行核对。证明或支付根不匹配时会报错退出：提交前请先与运营商解决。

如果不带 `--epoch`，矿工会选择当前周期的前一个周期。该周期可能仍在等待其支付根最终确定，因此领取可能尚未开放。更早的未领取周期请明确指定。

### 2. 提交

提交需要一个 EVM **relayer** 密钥：一个单独的 secp256k1 密钥，里面有少量 TAO，用于支付 Subtensor EVM 网络上的 gas。它只支付手续费；奖励仍然发给证明中的 coldkey。把它的 32 字节十六进制密钥放在一个私密文件中，然后在不发送任何内容的情况下试运行：

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key --dry-run
```

然后正式提交：

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key
```

`--key_file` 需要配合 `--rpc` 使用。任何有余额的 relayer 都可以提交你的证明：它无法更改 coldkey，也无法收到奖励。奖励会以原生 α 质押的形式到达你的 coldkey。领取时不需要 coldkey 的 seed。

### 3. 查看结果

| 事件 | 含义 |
| --- | --- |
| `Claimed` | 金库已接受领取，并为你的 coldkey 记入了额度。仅凭这一点并不能证明已经转账。 |
| `ClaimPaid` | 该额度已转入你的 coldkey。 |
| `ClaimPaymentDeferred` | 该额度暂时留在金库中，例如因为它低于最低转账额、价格不可用或转账失败。 |

延期的额度不会过期。一旦可以付款，之后的领取会支付累积的额度，而且任何人都可以通过金库的 `withdrawClaimCredit(bytes32 coldkey)` 方法重试；`snclaim withdraw --vault=v1`（配合 `--coldkey`、`--contract`、`--rpc` 和 `--key_file`）会调用它。再次提交已被接受的领取并不是提款，会因已领取而失败。

请在权益到期前领取。在主网上是八个周期再加一个宽限周期；此后，未领取的奖励可能会回到同一运营商的池中。到期不会移除已被接受的额度。从结算 v2 的切换周期开始，账户永不过期。

若要自动领取，或从矿工以外的另一台电脑提交，请参阅[进阶](/docs/miner/advanced#claim-automatically)。
