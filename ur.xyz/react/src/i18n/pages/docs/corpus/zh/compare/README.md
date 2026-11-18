---
title: 带宽共享网络对比：矿工视角 | UR
description: 将 UR 矿工与 Mysterium、Grass、Sentinel、Orchid、Honeygain 和 Pawns.app 对比：你运行什么、奖励如何确定、支付方式、开源情况与授权同意。
published: 2026-11-18
---

# 带宽共享网络对比

事实核查于 2026-11-18。

本页把 UR 矿工（Bittensor SN25）与其他为共享网络连接或运行节点而付费的网络放在一起比较。本页只比较机制，不给出任何网络（包括 UR）的收益数字、预测、收益率或代币价格。每一行都来自该项目自己的网站、文档、条款或代码仓库，并在其页面上附有链接。如果项目自己的页面没有说明某项内容，表格中会写“未见文档说明”。

关于 UR 的每一项事实都来自[如何运行矿工](/docs/miner)、[通过挖矿获得报酬](/docs/miner/rewards)和[研究方法](/research/methodology)。[UR 矿工页面](/miners)在一处讲清了 UR 的角色。

## 概览

| 网络 | 你运行什么 | 奖励如何确定 | 支付 | 开源客户端 |
| --- | --- | --- | --- | --- |
| [UR 矿工](/docs/miner) | 在 Linux、macOS 或 Windows 上运行 `provider` 程序，需要一个公网地址和一个开放端口 | 按已完成流量和测得的可靠性，分得子网矿工发行的一部分 | α ($UR)，发放到你签名确认的 Bittensor coldkey | 指南中附有源代码链接 |
| [Mysterium 节点](/docs/compare/mysterium) | 通过脚本、Docker 或应用安装的节点软件（WireGuard） | 共享的带宽、在线时间和所在位置 | MYST | 是，GPL-3.0 |
| [Grass](/docs/compare/grass) | Grass 的客户端；所查页面未说明运行要求 | 在线时间、质量、位置和使用量；先发放积分 | Grass 代币或 USDC，由 Grass 自行决定 | 未见文档说明 |
| [Sentinel dVPN 节点](/docs/compare/sentinel) | 在有公网 IP 的 Linux 服务器上以 Docker 运行 dvpnx 节点 | dVPN 用户按你设定的价格按 GB 或按小时付费，或通过订阅计划付费 | P2P，每小时支付 | 公开代码仓库；许可证未确认 |
| [Orchid](/docs/compare/orchid) | 在 Ethereum 目录中登记并质押 OXT 的提供者服务器 | 用户通过概率性纳米支付付款；按质押加权选择 | 除纳米支付外未见文档说明 | 是，AGPL-3.0 |
| Honeygain | Honeygain 应用 | 按共享的每 GB 计入收益，费率由 Honeygain 设定并可更改 | 通过支付服务商以法币支付，或通过 JumpTask | 未见文档说明 |
| Pawns.app (IPRoyal) | Pawns.app 应用程序 | 来自共享流量的收益，外加合作方任务 | 达到门槛后从控制面板提取美元 | 未见文档说明 |

## 你承载谁的流量

| 网络 | 流量 | 按其自身条款由谁负责 |
| --- | --- | --- |
| UR 矿工 | 作为网络运营商的出口，为其承载互联网流量 | 本页引用的页面未说明；请阅读你的运营商的条款 |
| Mysterium 节点 | VPN 用户的流量，以及面向住宅 VPN 和企业代理的合作产品 | 条款称节点运营者“不应承担责任”，并表示无法排除非法流量 |
| Grass | 访问公开网络数据 | 你对自己的参与“承担全部责任和法律责任” |
| Sentinel dVPN 节点 | dVPN 应用用户的流量 | 所查页面未见文档说明 |
| Orchid | Orchid VPN 用户的流量 | 未见文档说明 |
| Honeygain | Honeygain 的客户，用于网络分析和市场调研等用途 | 你需要对自己的网络连接以及遵守 ISP 规定负责 |
| Pawns.app (IPRoyal) | Pawns.app 的企业客户 | 你对账户下的活动“承担全部责任” |

Honeygain 和 Pawns.app 在这里没有单独的页面。它们的事实来自 [Honeygain 的条款](https://www.honeygain.com/terms-of-use/)和[隐私政策](https://www.honeygain.com/privacy-policy/)，以及 [Pawns.app 的条款](https://pawns.app/terms-of-use/)和[隐私政策](https://pawns.app/privacy-policy/)。

## 选择 UR 你要放弃什么

- **设置需要使用命令行。** 你需要安装程序、开放端口，并用 Bittensor 钱包签署一份声明。以应用为主的网络要求更少。
- **你需要一个 Bittensor coldkey，领取需要多个步骤。** 奖励按周期计算，在主网上约为一周，周期结束后再领取，并需要一个持有少量 TAO 用作 gas 的中继密钥。
- **你的带宽没有固定价格。** 你的份额取决于子网的发行和你被测得的工作量，而不是你设定的费率。
- **本页引用的页面不涉及法律责任或卸载。** 流量由你的运营商的条款约束。

## 其他网络的优势

- **上手步骤更少：** Honeygain 和 Pawns.app 只是你设备上的一个应用程序；MystNodes 列出了 Windows、macOS、Linux、Android 和 Chrome 扩展，并表示不需要技术技能。
- **由你定价：** Sentinel 节点自行设定按 GB 和按小时的价格。
- **明确的许可证：** Mysterium (GPL-3.0) 和 Orchid (AGPL-3.0) 在代码仓库中写明了许可证。
- **法币支付：** Honeygain 和 Pawns.app 以货币支付，无需管理钱包。
