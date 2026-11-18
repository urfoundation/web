
# UR miner vs Grass

Facts checked 2026-11-18.

This page compares mechanisms only: no earnings figures, projections or token prices for either network. Grass facts come from the [Grass terms](https://www.grass.io/terms-and-conditions) and [privacy policy](https://www.grass.io/privacy-policy). UR facts come from [How to run a miner](https://ur.xyz/docs/miner), [Get paid for mining](https://ur.xyz/docs/miner/rewards) and [Research methodology](https://ur.xyz/research/methodology). See also [all networks compared](https://ur.xyz/docs/compare). [Becoming a UR miner](https://ur.xyz/miners) walks through the UR side.

## Side by side

| | UR miner | Grass |
| --- | --- | --- |
| What you run | The `provider` program on a Linux, macOS or Windows computer that stays online, with one stable public address and incoming TCP port 443 for its extender | Grass's client; requirements not documented in the pages checked |
| Other requirements | An account with a network operator and a Bittensor coldkey | An account with accurate registration information; one account per person |
| How rewards are set | A share of the subnet's miner emission, in proportion to completed traffic times measured reliability; paid and free traffic earn the same | Uptime, quality, location and usage of the bandwidth you contribute; points come first and have no monetary value |
| Payout asset | α ($UR), as native α stake on your coldkey | Grass tokens or USDC, at Grass's discretion, under separate rewards terms |
| Wallet or KYC | A Bittensor coldkey you prove with a signed statement; the cited pages describe no identity check | A non-custodial digital wallet, whose public address Grass collects; no identity check documented |
| Open-source client | The guide follows the `sn/miner` source on GitHub | Not documented |
| Traffic you carry | Internet traffic for a network operator, as its exit | Access to public web data |
| Who is liable | Not covered on the pages cited here; read your operator's terms | You are "solely responsible and liable" for your participation, including your ISP agreement |
| Data and uninstall | The miner keeps its identity and wallet history in `~/.urnetwork`; uninstalling isn't covered on the pages cited | Collects your IP address, device identifiers, email and wallet address; its site sets analytics and advertising cookies; erasure on request by contacting Grass |

## How rewards differ

A UR miner in an operator's pool earns a share of the pool: completed usage bytes times reliability, where reliability is confirmations over assignments. Validators measure that work; there is no per-byte price. Rewards are counted per epoch, about a week on mainnet, and claimed afterwards.

Grass's terms say rewards depend on the uptime, quality, location and usage of the bandwidth you contribute. Points have no monetary value, and the terms promise no future rewards.

## Where Grass wins

- **No command line or ports:** Grass's terms describe no server setup.
- **A choice of asset:** rewards may include USDC as well as Grass tokens.

## What you give up with UR

- A command-line setup, open ports and a signed Bittensor wallet statement.
- Claims after each epoch closes, submitted with a relayer key that holds a little TAO for gas.
- No price you set for your bandwidth.
- The pages cited here don't state who answers for exit traffic; your operator's terms do.

## Where UR differs

UR publishes how it measures changes to the network, rejected results included: see [Research methodology](https://ur.xyz/research/methodology).
