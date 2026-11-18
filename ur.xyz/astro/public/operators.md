# The operators who run the network.

Source: https://ur.xyz/operators

Network operators run the privacy servers and the verification endpoint. An operator deposits into the subnet as a revenue-backed signal of real demand, runs the routing-verification protocol that co-signs each measured path, and commits the payout list that splits its rewards among the miners attached to it. Operators report the usage that rewards follow but never hold anyone else's funds.

## Run the servers

Operators run the privacy servers and the /verify endpoint that co-signs each measured path, the coordination layer between users and the miners that carry the traffic.

## Signal real demand

Operators are billed in alpha sized to their real usage. Every deposit goes into a reserve and pays for the audited usage that validators weight when they score the pools.

## Commit the payouts

Each settlement period an operator commits a Merkle payout list that splits its pool among its miners; from settlement v2 the split follows verified usage alone and pays only after the validator approves it. It never takes custody: every miner claims its share directly from the contract.

## Get started

Register a network-operator key and run the /verify server to begin; no deposit is due while the published rate is 0. Operator admission is owner-gated during the launch phase. [Operator guide](https://ur.xyz/docs/operator)

## What does a network operator run?

### What do you run?

One operator executable that serves the API and Connect services users and miners attach to, the /verify endpoint validators walk, and the epoch pipeline that settles your miners' rewards. PostgreSQL, Redis, artifact storage and public TLS ingress back it.

### What do you need?

A Linux host and your own domain, PostgreSQL, Redis and local durable artifact storage, the operator keys and signers, egress probes, and a public stats feed (stats.json) so the operators directory can list you. [How miners join an operator's pool](https://ur.xyz/miners)

### Where does the money come from?

An operator brings its own users and products and deposits alpha as a revenue-backed signal of real demand; no deposit is due while the published rate is 0. Each epoch it commits the payout list that splits its pool among its miners, who claim from the settlement vault directly: the operator never holds anyone else's alpha. The ur.io apps are one operator's products. [See the ur.io apps](https://ur.io/products)

### How do you start?

Operator admission is owner-gated during the launch phase, so the first step is a conversation with the subnet owner, who registers your identities and gives you your operator id. The operator guide then walks the build, the configuration and the first epoch.

## The guides

- [How to run a miner](https://ur.xyz/docs/miner) ([markdown](https://ur.xyz/docs-md/miner.md))
- [Get paid for mining](https://ur.xyz/docs/miner/rewards) ([markdown](https://ur.xyz/docs-md/miner/rewards.md))
- [How to run a validator](https://ur.xyz/docs/validator) ([markdown](https://ur.xyz/docs-md/validator.md))
- [How to become a network operator](https://ur.xyz/docs/operator) ([markdown](https://ur.xyz/docs-md/operator.md))
- [The litepaper](https://ur.xyz/docs/litepaper) ([markdown](https://ur.xyz/litepaper.md))
