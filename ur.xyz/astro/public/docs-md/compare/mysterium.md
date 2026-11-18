
# UR miner vs Mysterium node

Facts checked 2026-11-18.

This page compares mechanisms only: no earnings figures, projections or token prices for either network. Mysterium facts come from [mysterium.network](https://mysterium.network/), [MystNodes](https://mystnodes.com/), the [MystNodes terms](https://mystnodes.com/legal/terms-and-conditions) and the [node repository](https://github.com/mysteriumnetwork/node). UR facts come from [How to run a miner](https://ur.xyz/docs/miner), [Get paid for mining](https://ur.xyz/docs/miner/rewards) and [Research methodology](https://ur.xyz/research/methodology). See also [all networks compared](https://ur.xyz/docs/compare). For the UR side on one page, see [how to mine on UR](https://ur.xyz/miners).

## Side by side

| | UR miner | Mysterium node |
| --- | --- | --- |
| What you run | The `provider` program on a Linux, macOS or Windows computer that stays online, with one stable public address and incoming TCP port 443 for its extender | Node software using WireGuard, by script on Debian, Ubuntu or Raspbian, by Docker, or by the MystNodes apps |
| Other requirements | An account with a network operator and a Bittensor coldkey | A registration fee on Polygon, which can be paid in MYST |
| How rewards are set | A share of the subnet's miner emission, in proportion to completed traffic times measured reliability; paid and free traffic earn the same | Bandwidth shared, how consistently the node stays online, and location |
| Payout asset | α ($UR), as native α stake on your coldkey | MYST |
| Wallet or KYC | A Bittensor coldkey you prove with a signed statement; the cited pages describe no identity check | Not documented in the pages checked |
| Open-source client | The guide follows the `sn/miner` source on GitHub | Yes, GPL-3.0 |
| Traffic you carry | Internet traffic for a network operator, as its exit | Exit traffic for VPN users; partner products include a residential VPN and business proxies |
| Who is liable | Not covered on the pages cited here; read your operator's terms | The terms say operators "should not be liable", and that illegal traffic can't be ruled out |
| Data and uninstall | The miner keeps its identity and wallet history in `~/.urnetwork`; uninstalling isn't covered on the pages cited | The terms describe no browsing logs and minimal usage data; on termination data "may" be deleted; no deletion procedure documented |

## How rewards differ

A UR miner in an operator's pool earns a share of the pool: completed usage bytes times reliability, where reliability is confirmations over assignments. Validators measure that work; there is no per-byte price. Rewards are counted per epoch, about a week on mainnet, and claimed afterwards.

MystNodes says rewards follow how much bandwidth a node shares, how consistently it stays online, and its location. Testing traffic doesn't qualify for payment.

## Where Mysterium wins

- **Easier start:** MystNodes lists Windows, macOS, Linux, Android, Docker, Raspberry Pi and a Chrome extension, and says no technical skills are required.
- **A stated license:** the node repository is GPL-3.0.
- **A written position on liability:** its terms address exit-node liability directly.

## What you give up with UR

- A command-line setup, open ports and a signed Bittensor wallet statement.
- Claims after each epoch closes, submitted with a relayer key that holds a little TAO for gas.
- No price you set for your bandwidth.
- The pages cited here don't state who answers for exit traffic; your operator's terms do.

## Where UR differs

UR publishes how it measures changes to the network, rejected results included: see [Research methodology](https://ur.xyz/research/methodology).
