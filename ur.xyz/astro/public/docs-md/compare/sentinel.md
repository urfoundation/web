
# UR miner vs Sentinel dVPN node

Facts checked 2026-11-18.

This page compares mechanisms only: no earnings figures, projections or token prices for either network. Sentinel facts come from the [Sentinel node docs](https://docs.sentinel.co/dvpn-nodes), its [requirements](https://docs.sentinel.co/dvpn-nodes/setup/requirements), its [earnings page](https://docs.sentinel.co/dvpn-nodes/earnings) and the [node repository](https://github.com/sentinel-official/dvpn-node). UR facts come from [How to run a miner](https://ur.xyz/docs/miner), [Get paid for mining](https://ur.xyz/docs/miner/rewards) and [Research methodology](https://ur.xyz/research/methodology). See also [all networks compared](https://ur.xyz/docs/compare). The [UR miner requirements and setup](https://ur.xyz/miners) are summed up on one page.

## Side by side

| | UR miner | Sentinel |
| --- | --- | --- |
| What you run | The `provider` program on a Linux, macOS or Windows computer that stays online, with one stable public address and incoming TCP port 443 for its extender | The dvpnx node in Docker on Linux (Debian or Ubuntu preferred), with 2 vCPUs, 2 GB of RAM, a 10 GB SSD, unmetered bandwidth and a public IP |
| Other requirements | An account with a network operator and a Bittensor coldkey | A balance of P2P in the node account for on-chain transactions, and a passed health check to be eligible for rewards |
| How rewards are set | A share of the subnet's miner emission, in proportion to completed traffic times measured reliability; paid and free traffic earn the same | dVPN users pay the node per GB or per hour at prices the operator sets, or by subscription plans that pay per hour of uptime |
| Payout asset | α ($UR), as native α stake on your coldkey | P2P, paid every hour |
| Wallet or KYC | A Bittensor coldkey you prove with a signed statement; the cited pages describe no identity check | The node account is a wallet; no identity check documented |
| Open-source client | The guide follows the `sn/miner` source on GitHub | Public repository; license not confirmed in the pages checked |
| Traffic you carry | Internet traffic for a network operator, as its exit | dVPN app users' traffic |
| Who is liable | Not covered on the pages cited here; read your operator's terms | Not documented in the pages checked |
| Data and uninstall | The miner keeps its identity and wallet history in `~/.urnetwork`; uninstalling isn't covered on the pages cited | Not documented in the pages checked |

## How rewards differ

A UR miner in an operator's pool earns a share of the pool: completed usage bytes times reliability, where reliability is confirmations over assignments. Validators measure that work; there is no per-byte price. Rewards are counted per epoch, about a week on mainnet, and claimed afterwards.

Sentinel's earnings page describes two ways to be paid. A subscription plan locks tokens against chosen nodes and pays for each hour of uptime. Pay-as-you-go users pay per GB or per hour, at prices the operator sets in US dollars and an oracle converts to P2P. Stakers of P2P also receive a share of bandwidth payments.

## Where Sentinel wins

- **Prices you set:** a node sets its own per-GB and per-hour prices.
- **Hourly payouts:** node rewards are paid out every hour, with no claim step.

## What you give up with UR

- A command-line setup, open ports and a signed Bittensor wallet statement.
- Claims after each epoch closes, submitted with a relayer key that holds a little TAO for gas.
- No price you set for your bandwidth.
- The pages cited here don't state who answers for exit traffic; your operator's terms do.

## Where UR differs

UR publishes how it measures changes to the network, rejected results included: see [Research methodology](https://ur.xyz/research/methodology).
