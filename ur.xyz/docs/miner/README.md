---
description: Start mining on UR in a few steps. What a miner does, what you need, a quick start, and where each part of the miner guide lives.
---

# How to run a miner

> **If `provider setup` or `provider service install` set up your miner's background service, update it by hand once.** Since release 2026.10.22, these miners haven't updated themselves, on Linux, macOS or Windows. The miner's updater accepted versions written like `2026.10.27-1083160450`, but releases are stamped `2026.10.27+1083160450`, so every release took itself for a development build:
>
> - `provider status` says "development build, never updates itself".
> - `provider update`, and the automatic updates, refuse with "this is a development build … which never replaces itself with a release".
> - The 10-minute check that rolls back a new version that doesn't come back connected never ran.
>
> The fix is in the first release after November 11, 2026, and your miner can't install it by itself. Once that release is out, download and unpack it as in [Manual download](/docs/miner/install#manual-download), and instead of installing it, run its update: `./linux/amd64/provider update` with your folder from the table (`sudo` in front for a system service), or on Windows `& "$env:TEMP\windows\$Arch\provider.exe" update`. Typing just `provider update` runs the miner you have, which still refuses. The update replaces the miner your service runs and restarts it.
>
> After that, updates are automatic again: spread over about 16 hours after each release, with the 10-minute connected check, a rollback, and a 7-day skip of a release that fails it. `provider status` then shows that updates are automatic, or that you're up to date.
>
> If you run the miner yourself, without that service, `provider update` refuses too: install the new release as in [Manual download](/docs/miner/install#manual-download) and restart the miner.
>
> Not affected: the Docker image, the apps, and miners an installer set up, which update through `urnet-tools`.

A UR miner shares your internet connection as an exit for a network operator. Validators check that it really carries traffic, and Bittensor SN25 (netuid 25) pays rewards for that work in the subnet's α token, branded $UR.

This page gets you from nothing to a running miner. The rest of the miner guide goes deeper, one topic per page:

| Page | What it covers |
| --- | --- |
| [Install](/docs/miner/install) | The installers for Linux, macOS and Windows, a manual download, and building from source. |
| [Run and monitor](/docs/miner/run) | Starting and stopping, running in the background, logs and the status page, backups. |
| [Run an extender](/docs/miner/extender) | The ports to open for the miner's extender, firewalls and port forwarding, and letting it listen on port 443 on Linux. |
| [Updates](/docs/miner/updates) | How the miner stays up to date, and how to control that. |
| [Get paid](/docs/miner/rewards) | Setting your payout wallet, how rewards are counted, and claiming them. |
| [Troubleshooting](/docs/miner/troubleshooting) | The common errors and what to do about each one. |
| [Advanced](/docs/miner/advanced) | Mining every operator, several exits on one host, automatic claims and the head tier for large fleets. |
| [Reference](/docs/miner/reference) | Every everyday command, the files the miner keeps, environment variables and a glossary. |

For the other roles, see [Run a validator](/docs/validator) and [Run a network operator](/docs/operator).

## How it works

```text
your miner (provider)
  │ carries internet traffic for
  ↓
a network operator  ←─  validators
  │ pays its pool       measure it
  ↓ every epoch
your Bittensor coldkey (α, $UR)
```

Most miners join an operator's **pool**. You don't need your own Bittensor registration: you sign in to the operator, your miner registers itself as a device, and the pool's rewards are paid to the Bittensor wallet you choose. Large fleets can instead claim their own miner UID; see [the head tier](/docs/miner/advanced#claim-your-own-miner-uid-head-tier).

## What you need

- **A Linux, macOS or Windows computer that stays online.** A home PC, a server or a Raspberry Pi 2 or newer all work. On Windows the miner runs while you're signed in.
- **One stable public internet address per miner.** To run more than one exit from a host, see [Several exits on one host](/docs/miner/advanced#several-exits-on-one-host).
- **Open ports for the extender.** The miner also runs an extender, which earns a share of every contract it carries. It needs incoming TCP port 443; UDP ports 443 and 4053 are recommended, and UDP 53 is optional. On Linux it also needs permission to listen on port 443. See [Run an extender](/docs/miner/extender).
- **An account with a network operator.** The miner uses the default operator, `bringyour.com`, unless you [choose another](/docs/miner/run#choose-an-operator). You'll get an **auth code** from your account to sign the miner in.
- **A Bittensor wallet address (coldkey)** for your rewards. It's an ss58 address that starts with `5`. You can sign for it on another device; its secret never needs to be on the miner.

## Quick start

The miner program is called `provider`. Install it, run `provider setup`, and check on it with `provider status`.

### 1. Install

The installer is the easiest way. It puts the miner in your home folder, runs it in the background, and keeps it up to date automatically.

On **Linux**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

On **macOS**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

On **Windows**, in PowerShell (not as administrator):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Then open a new terminal. The installer asks for an auth code from your operator account (for the default operator, from your URnetwork account at [ur.io](https://ur.io)), registers this device and starts mining.

The installer names the command `urnetwork`, not `provider`. If you used it, type `urnetwork` wherever this guide says `provider`, including in commands the miner prints for you to copy.

To install without an installer, see [Manual download](/docs/miner/install#manual-download).

### 2. Run setup

```bash
provider setup
```

It walks you through four steps, and you can stop and run it again at any time; it keeps the steps you've finished:

1. **Sign in.** Paste an auth code from your operator account. The prompt hides what you paste.
2. **Register this device.** A new device gets its own miner identity, saved in `~/.urnetwork`.
3. **Payout address.** Your Bittensor coldkey address. Setup prints a short message; sign it in your wallet app (Polkadot.js, Talisman or btcli) and paste the signature. You can press Enter to skip this and [set it later](/docs/miner/rewards#set-your-payout-wallet).
4. **Keep it running.** Starts the miner in the background now and again after every restart (on Windows, whenever you sign in), and keeps it up to date.

If you used an installer, it already signed you in, registered this device and runs the miner in the background. Run `urnetwork setup --no-service` to add your payout address; `--no-service` keeps setup from adding a second background miner beside the installer's.

### 3. Check on it

```bash
provider status
```

A minute after the miner starts, the Miner, Signed in, Device and Connected lines should each have a ✓. It exits with 0 when all is well, 3 when the device needs setup, and 4 when the miner isn't running or isn't connected, so scripts can check it too (`provider status --json` prints the details).

When something isn't right, `status` prints the command to run next. `provider doctor` looks for the reason: the state folder, DNS, the connection, a proxy that inspects TLS, and the clock. See [Run and monitor](/docs/miner/run) for logs and stopping and starting.

### 4. Back up your miner

Copy the folder `~/.urnetwork` somewhere private. It holds this device's identity and your signed wallet history. If you lose it, the device can't be recovered, even though you can still sign in to your account. See [Back up your miner](/docs/miner/run#back-up-your-miner).

That's it. Rewards are counted per settlement epoch, about a week on mainnet, and are claimed after the epoch closes: see [Get paid](/docs/miner/rewards). If something didn't work, see [Troubleshooting](/docs/miner/troubleshooting).

### Step by step instead of setup

`provider setup` runs these commands for you. To do it by hand:

```bash
provider login                    # paste the auth code when asked
provider start                    # the first start asks before registering this device
provider wallet challenge '<your coldkey ss58 address>'
provider service install          # in a second terminal, after Ctrl-C in the first
```

`provider wallet challenge` prints a message to sign; then run the `provider wallet set` command it prints, with your signature. [Get paid](/docs/miner/rewards#set-your-payout-wallet) explains it. `login`, `start` and `network` are the same commands as `auth`, `provide` and `choose_network`.

## Where this guide comes from

This guide follows the current [`sn/miner` implementation](https://github.com/urfoundation/sn/tree/main/miner) and its [`cli/miner` entry point](https://github.com/urfoundation/sn/tree/main/cli/miner). Many parts of it are refined in conversations [on our Discord](https://discord.gg/urnetwork), which is also the place to ask for help.
