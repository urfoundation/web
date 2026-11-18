---
title: UR 矿工与 Mysterium 节点对比 | UR
description: 将 Bittensor SN25 上的 UR 矿工与 Mysterium 节点对比：你运行什么、奖励如何确定、支付、开源、你承载谁的流量以及你的数据。
published: 2026-11-18
---

# UR 矿工与 Mysterium 节点对比

事实核查于 2026-11-18。

本页只比较机制：不提供任一网络的收益数字、预测或代币价格。Mysterium 的事实来自 [mysterium.network](https://mysterium.network/)、[MystNodes](https://mystnodes.com/)、[MystNodes 条款](https://mystnodes.com/legal/terms-and-conditions)和[节点代码仓库](https://github.com/mysteriumnetwork/node)。关于 UR 的事实来自[如何运行矿工](/docs/miner)、[通过挖矿获得报酬](/docs/miner/rewards)和[研究方法](/research/methodology)。另请参阅[所有网络对比](/docs/compare)。UR 这一方的全貌见[如何在 UR 上挖矿](/miners)。

## 并列对比

| | UR 矿工 | Mysterium 节点 |
| --- | --- | --- |
| 你运行什么 | 在一台保持在线的 Linux、macOS 或 Windows 电脑上运行 `provider` 程序，需要一个稳定的公网地址，并为其扩展器开放入站 TCP 端口 443 | 使用 WireGuard 的节点软件，可在 Debian、Ubuntu 或 Raspbian 上通过脚本安装，也可通过 Docker 或 MystNodes 应用安装 |
| 其他要求 | 一个网络运营商账户和一个 Bittensor coldkey | 在 Polygon 上支付一笔注册费，可用 MYST 支付 |
| 奖励如何确定 | 分得子网矿工发行的一部分，与已完成流量乘以测得的可靠性成正比；付费流量和免费流量获得同样的收益 | 共享的带宽、节点保持在线的稳定程度以及所在位置 |
| 支付资产 | α ($UR)，作为你 coldkey 上的原生 α 质押 | MYST |
| 钱包或 KYC | 一个通过签名声明证明归你所有的 Bittensor coldkey；所引用页面未描述身份核验 | 所查页面未见文档说明 |
| 开源客户端 | 指南基于 GitHub 上的 `sn/miner` 源代码 | 是，GPL-3.0 |
| 你承载的流量 | 作为网络运营商的出口，为其承载互联网流量 | VPN 用户的出口流量；合作产品包括住宅 VPN 和企业代理 |
| 谁承担责任 | 本页引用的页面未涉及；请阅读你的运营商的条款 | 条款称节点运营者“不应承担责任”，并表示无法排除非法流量 |
| 数据与卸载 | 矿工把其身份和钱包历史保存在 `~/.urnetwork` 中；所引用页面未涉及卸载 | 条款称不保留浏览日志、仅保留最少的使用数据；终止时数据“可能”会被删除；未见文档说明删除流程 |

## 奖励机制的差异

一个处于运营商池中的 UR 矿工获得池的一部分：已完成的使用字节数乘以可靠性，其中可靠性为确认次数除以分配次数。验证者测量这些工作；不存在按字节计算的价格。奖励按周期计算，在主网上约为一周，之后再领取。

MystNodes 表示，奖励取决于节点共享的带宽量、保持在线的稳定程度以及所在位置。测试流量不计入付费。

## Mysterium 的优势

- **上手更容易：** MystNodes 列出了 Windows、macOS、Linux、Android、Docker、Raspberry Pi 和 Chrome 扩展，并表示不需要技术技能。
- **明确的许可证：** 节点代码仓库采用 GPL-3.0。
- **关于法律责任的书面立场：** 其条款直接说明了出口节点的法律责任。

## 选择 UR 你要放弃什么

- 命令行设置、开放端口，以及一份签名的 Bittensor 钱包声明。
- 每个周期结束后领取，并使用持有少量 TAO 用作 gas 的中继密钥提交。
- 你无法为自己的带宽定价。
- 本页引用的页面没有说明谁对出口流量负责；你的运营商的条款会说明。

## UR 的不同之处

UR 公开它如何衡量网络变更，包括被否决的结果：请参阅[研究方法](/research/methodology)。
