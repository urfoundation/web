---
title: UR 矿工与 Sentinel dVPN 节点对比 | UR
description: 将 Bittensor SN25 上的 UR 矿工与 Sentinel dVPN 节点对比：你运行什么、奖励如何确定、支付、开源以及你承载谁的流量。
published: 2026-11-18
---

# UR 矿工与 Sentinel dVPN 节点对比

事实核查于 2026-11-18。

本页只比较机制：不提供任一网络的收益数字、预测或代币价格。Sentinel 的事实来自 [Sentinel 节点文档](https://docs.sentinel.co/dvpn-nodes)、其[运行要求](https://docs.sentinel.co/dvpn-nodes/setup/requirements)、其[收益页面](https://docs.sentinel.co/dvpn-nodes/earnings)和[节点代码仓库](https://github.com/sentinel-official/dvpn-node)。关于 UR 的事实来自[如何运行矿工](/docs/miner)、[通过挖矿获得报酬](/docs/miner/rewards)和[研究方法](/research/methodology)。另请参阅[所有网络对比](/docs/compare)。[UR 矿工的要求与设置](/miners)汇总在一页中。

## 并列对比

| | UR 矿工 | Sentinel |
| --- | --- | --- |
| 你运行什么 | 在一台保持在线的 Linux、macOS 或 Windows 电脑上运行 `provider` 程序，需要一个稳定的公网地址，并为其扩展器开放入站 TCP 端口 443 | 在 Linux（首选 Debian 或 Ubuntu）上以 Docker 运行 dvpnx 节点，需要 2 个 vCPU、2 GB 内存、10 GB SSD、不限流量的带宽和一个公网 IP |
| 其他要求 | 一个网络运营商账户和一个 Bittensor coldkey | 节点账户中需有用于链上交易的 P2P 余额，并需通过健康检查才有资格获得奖励 |
| 奖励如何确定 | 分得子网矿工发行的一部分，与已完成流量乘以测得的可靠性成正比；付费流量和免费流量获得同样的收益 | dVPN 用户按节点运营者设定的价格按 GB 或按小时向节点付费，或通过按在线小时数付费的订阅计划付费 |
| 支付资产 | α ($UR)，作为你 coldkey 上的原生 α 质押 | P2P，每小时支付 |
| 钱包或 KYC | 一个通过签名声明证明归你所有的 Bittensor coldkey；所引用页面未描述身份核验 | 节点账户就是一个钱包；未见文档说明身份核验 |
| 开源客户端 | 指南基于 GitHub 上的 `sn/miner` 源代码 | 公开代码仓库；所查页面未确认许可证 |
| 你承载的流量 | 作为网络运营商的出口，为其承载互联网流量 | dVPN 应用用户的流量 |
| 谁承担责任 | 本页引用的页面未涉及；请阅读你的运营商的条款 | 所查页面未见文档说明 |
| 数据与卸载 | 矿工把其身份和钱包历史保存在 `~/.urnetwork` 中；所引用页面未涉及卸载 | 所查页面未见文档说明 |

## 奖励机制的差异

一个处于运营商池中的 UR 矿工获得池的一部分：已完成的使用字节数乘以可靠性，其中可靠性为确认次数除以分配次数。验证者测量这些工作；不存在按字节计算的价格。奖励按周期计算，在主网上约为一周，之后再领取。

Sentinel 的收益页面描述了两种获得报酬的方式。订阅计划将代币锁定在所选节点上，并按每小时在线时间付费。按量付费的用户按 GB 或按小时付费，价格由节点运营者以美元设定，再由预言机换算为 P2P。P2P 的质押者也会获得带宽付款的一部分。

## Sentinel 的优势

- **由你定价：** 节点自行设定按 GB 和按小时的价格。
- **每小时支付：** 节点奖励每小时发放，无需领取步骤。

## 选择 UR 你要放弃什么

- 命令行设置、开放端口，以及一份签名的 Bittensor 钱包声明。
- 每个周期结束后领取，并使用持有少量 TAO 用作 gas 的中继密钥提交。
- 你无法为自己的带宽定价。
- 本页引用的页面没有说明谁对出口流量负责；你的运营商的条款会说明。

## UR 的不同之处

UR 公开它如何衡量网络变更，包括被否决的结果：请参阅[研究方法](/research/methodology)。
