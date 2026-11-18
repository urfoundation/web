# The miners who convert IP subnets into the encrypted internet.

Source: https://ur.xyz/miners

Miners compete to make the most IPv4 /29 and IPv6 /48 subnets available on the network, each kept routable at any moment for ingress or egress traffic. In other words, miners convert the public internet into an anonymous private network for everyone to use. Every miner carries both ingress and egress traffic, runs a safe-by-default security model, routes only encrypted traffic, and is paid from subnet emission for the traffic it carries and the routable capacity it contributes. The fleets with the broadest distinct, routable coverage are promoted to top-level miners and earn more, all in user space, on hardware you already own.

A miner is both an extender and a provider: every miner takes the ingress and the egress role at once. It configures itself automatically for the system it runs on.

The goal is a dual shadow network: for every public IPv4 and IPv6 subnet, a private, anonymous counterpart is also available. UR is building that private anonymous network.

## Egress

As egress, a miner is an exit IP of the shared network. It rejects traffic that conflicts with common regulation directions like CFAA and DMCA, blocks known-malicious IPs, and routes only encrypted traffic, protecting both miners and users.

## Ingress

As ingress (an extender), a miner creates entry points that improve reachability worldwide, using N-layer TLS, SNI spoofing, and trusted forwarding. A rotating subset is exposed each cycle, and clients automatically retry the entry points that worked before.

## Measured and matched

Independent validators walk chains of miners to prove real-time transit and measure liveness and quality. Miners are ranked by that measurement and by speed, and each operator runs its own matchmaking between users and miners.

## Earn from emission

Miners are paid from the subnet's emission. Inside an operator's pool you claim your share directly from the contract by proof (with settlement v2, one claim collects everything your payout wallet has accrued, and it never expires): a low-barrier baseline reward, with no slot to win and nothing to burn. [Miner guide](https://ur.xyz/docs/miner)

## Compete for the top

Miners compete on reach. The network ranks fleets by how many distinct, routable exit IPs they actually serve rather than by traffic volume, and the roughly 200 with the broadest coverage are promoted to top-level miners: their own on-chain slot, paid natively, earning more. Shared IPs are split among the fleets that claim them, so unique coverage is what wins. Grow your distinct-IP breadth to climb, and if your reach slips you fall back to the pool.

## How do you start mining on SN25?

### What do you run?

You run the miner program, provider, on a computer that stays online. Every miner is both a provider, an exit for traffic, and an extender, an entry point, and it configures itself for the system it runs on. Most miners join a network operator's pool, so no Bittensor registration of your own is needed. On a phone or computer, a URnetwork app can mine in the background instead, with URnetwork as its operator. [Get a URnetwork app](https://ur.io/install)

### What hardware do you need?

A computer that stays online: a home PC, a server or a Raspberry Pi 2 or newer all work. Every release carries the miner for Linux on 64-bit and 32-bit Intel, AMD and ARM (not a Pi Zero or Pi 1), for macOS on Apple silicon and Intel (the installer needs macOS 12 or later), and for Windows on 64-bit Intel or AMD and on ARM64. Each miner needs one stable public internet address. Its extender needs incoming TCP port 443; UDP ports 443 and 4053 are recommended. [See the build releases](https://github.com/urnetwork/build/releases)

### Where do the rewards come from?

From the subnet's miner emission, not from a fixed price per byte. In an operator's pool, a device's share follows the traffic it completed and how reliably validators measured it, and paid and free traffic of the same size earn the same credit. Momentum, the share of miner emission paid out now, is 10%; the rest goes to the Network Capacity Reserve. Your operator's published policy and payout files show what is actually paid. [How rewards are counted](https://ur.xyz/docs/miner/rewards#how-rewards-are-counted)

### How do you start?

Create an account with a network operator (the miner uses bringyour.com unless you choose another) and get an auth code. Install the miner (the installer for your system runs it in the background and keeps it up to date), run provider setup, which signs it in and sets the Bittensor coldkey your rewards are paid to, and check on it with provider status. [Install steps for Linux, macOS and Windows](https://ur.xyz/docs/miner/install)

### What if something goes wrong?

Ask the miner first: provider status and provider doctor report what it sees. The troubleshooting page lists the common messages, from sign-in errors and a miner that keeps being refused to an extender that cannot bind TCP port 443 and a claim proof that is not ready, with what to do about each. [Miner troubleshooting](https://ur.xyz/docs/miner/troubleshooting)

### How is a miner measured?

Validators walk chains of miners and keep a signed record of each completed hop, so a miner is scored on traffic it actually carried. The routing and matching the network runs change only when a change beats the measured noise of its instrument, and every attempt, rejected ones included, is published. [Read the research methodology](https://ur.xyz/research/methodology)

Compared with: [Mysterium](https://ur.xyz/docs/compare/mysterium), [Grass](https://ur.xyz/docs/compare/grass), [Sentinel](https://ur.xyz/docs/compare/sentinel), [Orchid](https://ur.xyz/docs/compare/orchid), [all bandwidth-sharing networks](https://ur.xyz/docs/compare)

## The guides

- [How to run a miner](https://ur.xyz/docs/miner) ([markdown](https://ur.xyz/docs-md/miner.md))
- [Get paid for mining](https://ur.xyz/docs/miner/rewards) ([markdown](https://ur.xyz/docs-md/miner/rewards.md))
- [How to run a validator](https://ur.xyz/docs/validator) ([markdown](https://ur.xyz/docs-md/validator.md))
- [How to become a network operator](https://ur.xyz/docs/operator) ([markdown](https://ur.xyz/docs-md/operator.md))
- [The litepaper](https://ur.xyz/docs/litepaper) ([markdown](https://ur.xyz/litepaper.md))
