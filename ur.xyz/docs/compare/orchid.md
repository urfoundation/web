---
title: UR Miner vs Orchid Provider, Compared | UR
description: A UR miner on Bittensor SN25 beside an Orchid provider: what you run, how rewards are set, staking, open source and whose traffic you carry.
published: 2026-11-18
---

# UR miner vs Orchid provider

Facts checked 2026-11-18.

This page compares mechanisms only: no earnings figures, projections or token prices for either network. Orchid facts come from the [Orchid docs](https://docs.orchid.com/en/latest/), the [Orchid repository](https://github.com/OrchidTechnologies/orchid) and the [Orchid privacy policy](https://www.orchid.com/privacy-policy). UR facts come from [How to run a miner](/docs/miner), [Get paid for mining](/docs/miner/rewards) and [Research methodology](/research/methodology). See also [all networks compared](/docs/compare). [Mining Bittensor SN25](/miners) covers the UR side in one place.

## Side by side

| | UR miner | Orchid |
| --- | --- | --- |
| What you run | The `provider` program on a Linux, macOS or Windows computer that stays online, with one stable public address and incoming TCP port 443 for its extender | A provider server listed in Orchid's Ethereum directory; hardware requirements not documented |
| Other requirements | An account with a network operator and a Bittensor coldkey | OXT staked in the directory |
| How rewards are set | A share of the subnet's miner emission, in proportion to completed traffic times measured reliability; paid and free traffic earn the same | Users pay providers with probabilistic nanopayments; providers are chosen at random, weighted by stake |
| Payout asset | α ($UR), as native α stake on your coldkey | Not documented beyond the nanopayments |
| Wallet or KYC | A Bittensor coldkey you prove with a signed statement; the cited pages describe no identity check | An Ethereum account; no identity check documented |
| Open-source client | The guide follows the `sn/miner` source on GitHub | Yes, AGPL-3.0 |
| Traffic you carry | Internet traffic for a network operator, as its exit | Orchid VPN users' traffic |
| Who is liable | Not covered on the pages cited here; read your operator's terms | Not documented |
| Data and uninstall | The miner keeps its identity and wallet history in `~/.urnetwork`; uninstalling isn't covered on the pages cited | Orchid says it collects no personal data; clearing the app's data deletes its only copy |

## How rewards differ

A UR miner in an operator's pool earns a share of the pool: completed usage bytes times reliability, where reliability is confirmations over assignments. Validators measure that work; there is no per-byte price. Rewards are counted per epoch, about a week on mainnet, and claimed afterwards.

Orchid is a marketplace of VPN providers, not a residential-sharing app. Providers stake OXT and compete for requests by stake-weighted random selection. Users pay with off-chain, lottery-style tickets that the provider checks before serving.

## Where Orchid wins

- **A stated license:** the repository is AGPL-3.0.
- **Data handling stated plainly:** Orchid's privacy policy says it collects no personal data.

## What you give up with UR

- A command-line setup, open ports and a signed Bittensor wallet statement.
- Claims after each epoch closes, submitted with a relayer key that holds a little TAO for gas.
- No price you set for your bandwidth.
- The pages cited here don't state who answers for exit traffic; your operator's terms do.

## Where UR differs

UR publishes how it measures changes to the network, rejected results included: see [Research methodology](/research/methodology).
