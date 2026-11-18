---
title: Bandwidth-Sharing Networks Compared for Miners | UR
description: A UR miner beside Mysterium, Grass, Sentinel, Orchid, Honeygain and Pawns.app: what you run, how rewards are set, payout, open source and consent.
published: 2026-11-18
---

# Bandwidth-sharing networks compared

Facts checked 2026-11-18.

This page sets a UR miner (Bittensor SN25) beside other networks that pay people for sharing a connection or running a node. It compares mechanisms only. It gives no earnings figures, projections, yields or token prices for any network, UR included. Each row comes from the project's own site, documentation, terms or repository, linked on its page. Where a project's own pages don't say something, the table says "not documented".

For UR, every fact comes from [How to run a miner](/docs/miner), [Get paid for mining](/docs/miner/rewards) and [Research methodology](/research/methodology). The [UR miners page](/miners) explains the UR role in one place.

## At a glance

| Network | What you run | How rewards are set | Payout | Open-source client |
| --- | --- | --- | --- | --- |
| [UR miner](/docs/miner) | The `provider` program on Linux, macOS or Windows, with a public address and an open port | A share of the subnet's miner emission, by completed traffic and measured reliability | α ($UR) to a Bittensor coldkey you sign for | Source linked from the guide |
| [Mysterium node](/docs/compare/mysterium) | Node software (WireGuard) by script, Docker or apps | Bandwidth shared, uptime and location | MYST | Yes, GPL-3.0 |
| [Grass](/docs/compare/grass) | Grass's client; requirements not documented in the pages checked | Uptime, quality, location and usage; points first | Grass tokens or USDC, at Grass's discretion | Not documented |
| [Sentinel dVPN node](/docs/compare/sentinel) | The dvpnx node in Docker on a Linux server with a public IP | dVPN users pay per GB or per hour at your prices, or by subscription plans | P2P, hourly | Public repository; license not confirmed |
| [Orchid](/docs/compare/orchid) | A provider server listed in an Ethereum directory, with OXT staked | Users pay by probabilistic nanopayments; selection weighted by stake | Not documented beyond the nanopayments | Yes, AGPL-3.0 |
| Honeygain | The Honeygain app | Earnings credited per GB shared at a rate Honeygain sets and can change | Fiat through payment providers, or JumpTask | Not documented |
| Pawns.app (IPRoyal) | The Pawns.app application | Earnings from shared traffic, plus partner tasks | USD from a dashboard, above a threshold | Not documented |

## Whose traffic you carry

| Network | Traffic | Who answers for it, in its own terms |
| --- | --- | --- |
| UR miner | Internet traffic for a network operator, as its exit | The pages cited here don't say; read your operator's terms |
| Mysterium node | VPN users' traffic, with partner products for residential VPN and business proxies | The terms say operators "should not be liable", and that illegal traffic can't be ruled out |
| Grass | Access to public web data | You are "solely responsible and liable" for your participation |
| Sentinel dVPN node | dVPN app users' traffic | Not documented in the pages checked |
| Orchid | Orchid VPN users' traffic | Not documented |
| Honeygain | Honeygain's clients, for uses such as web analytics and market research | You are responsible for your connection and ISP compliance |
| Pawns.app (IPRoyal) | Pawns.app's business clients | You are "solely responsible" for activity under your account |

Honeygain and Pawns.app have no page of their own here. Their facts come from [Honeygain's terms](https://www.honeygain.com/terms-of-use/) and [privacy policy](https://www.honeygain.com/privacy-policy/), and from [Pawns.app's terms](https://pawns.app/terms-of-use/) and [privacy policy](https://pawns.app/privacy-policy/).

## What you give up with UR

- **Setup is a command-line job.** You install a program, open ports and sign a statement with a Bittensor wallet. App-first networks ask for less.
- **You need a Bittensor coldkey, and claims take steps.** Rewards are counted per epoch, about a week on mainnet, and are claimed after the epoch closes, with a relayer key that holds a little TAO for gas.
- **There is no fixed price for your bandwidth.** Your share follows the subnet's emission and your measured work, not a rate you set.
- **The pages cited here don't cover liability or uninstalling.** Your operator's terms govern the traffic.

## Where the others win

- **Fewer steps to start:** Honeygain and Pawns.app are an application on your device, and MystNodes lists Windows, macOS, Linux, Android and a Chrome extension and says no technical skills are required.
- **Prices you set:** a Sentinel node sets its own per-GB and per-hour prices.
- **A stated license:** Mysterium (GPL-3.0) and Orchid (AGPL-3.0) state theirs in the repository.
- **Fiat payouts:** Honeygain and Pawns.app pay in money, with no wallet to manage.
