# The validators who measure the network.

Source: https://ur.xyz/validators

Validators are independent. Each stakes its own UR and runs the routing-verification protocol, continuously walking operator-assigned chains of miners to prove real-time transit and measure which miners are the weakest links. That measurement is the core signal the network pays for, and validators earn native dividends for producing it accurately.

## Walk the routes

Validators walk operator-assigned chains of miners and collect a signed, self-proving record of each completed hop: cryptographic proof of real-time transit that anyone can check.

## Score the network

Each cycle a validator scores every operator's pool by demand and measured quality, and ranks the top fleets by routable-IP breadth, all under commit-reveal. Bittensor's Yuma Consensus turns those independent scores into miner emission.

## Earn native dividends

Validators earn Bittensor-native dividends for accurate, consensus-aligned scoring, their only reward. No operator owns a validator, and the set is permissionless. [Validator guide](https://ur.xyz/docs/validator)

## Independent by design

Because commit-reveal hides each validator's scores until they are stale, copying earns nothing. A validator has to run real trails. The measurement stays honest, and no single party controls it.

## How do you run a validator on SN25?

### What do you run?

One validator process on Bittensor SN25 (netuid 25). It walks /verify trails through each operator's miners, keeps the signed evidence, and submits the resulting miner weights through Bittensor's native commit-reveal. [What the miners it measures run](https://ur.xyz/miners)

### What do you need?

A Linux host with persistent storage and continuous access to every configured operator's API, a Bittensor coldkey with funds for registration, staking and fees, a registered SN25 hotkey with enough stake for a validator permit, and an approved production configuration from the deployment's bootstrap process.

### Where do the rewards come from?

Validators earn native Bittensor dividends for accurate, consensus-aligned scoring. They are separate from the miner rewards claimed from UR's settlement vault, and there is no validator claim command.

### How do you start?

Download the validator from the build releases page (binaries for Linux and macOS) or build it from source, create its service keys, register and stake on SN25, authenticate with every operator, then provision the configuration and run it. The validator guide walks each step.

## How does SN25 scoring differ?

### Proof of transit, not self-reports

A validator walks operator-assigned chains of miners and keeps a signed, self-proving record of each completed hop, so a score rests on traffic that was actually carried, and anyone can check the proof.

### Pools by demand and quality, fleets by breadth

Each cycle a validator scores every operator's pool by demand and measured quality, and ranks the top fleets by how many distinct, routable exit IPs they serve rather than by traffic volume. While the published rate is 0, every pool is given equal demand, so measured quality alone steers the pool channel.

### Copying earns nothing

Scores are submitted under commit-reveal, which hides each validator's scores until they are stale, so a validator has to run real trails. Bittensor's Yuma Consensus turns the independent scores into miner emission.

### Measured changes, published results

The routing and matching the network runs are improved under one discipline: a change counts only when it beats the measured noise of its instrument, and every attempt, rejected ones included, is published. [Read the research methodology](https://ur.xyz/research/methodology)

## The guides

- [How to run a miner](https://ur.xyz/docs/miner) ([markdown](https://ur.xyz/docs-md/miner.md))
- [Get paid for mining](https://ur.xyz/docs/miner/rewards) ([markdown](https://ur.xyz/docs-md/miner/rewards.md))
- [How to run a validator](https://ur.xyz/docs/validator) ([markdown](https://ur.xyz/docs-md/validator.md))
- [How to become a network operator](https://ur.xyz/docs/operator) ([markdown](https://ur.xyz/docs-md/operator.md))
- [The litepaper](https://ur.xyz/docs/litepaper) ([markdown](https://ur.xyz/litepaper.md))
