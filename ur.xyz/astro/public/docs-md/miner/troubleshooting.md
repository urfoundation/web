
# Miner troubleshooting

Find the message you're seeing, or the closest symptom, below. If you used an installer, type `urnetwork` wherever this page says `provider`. Still stuck? Ask [on our Discord](https://discord.gg/urnetwork), with the command you ran and what it printed. Never post your auth code, seed files or anything from `~/.urnetwork`.

## Installing

### `urnetwork: command not found` after installing

The installer adds its folder to your `PATH` in your shell's startup file (`~/.bashrc`, and `~/.zshrc` if you have one, on Linux; `~/.zshrc`, and `~/.bash_profile` for bash, on macOS), which only new terminals read. Open a new terminal, or run the `export PATH=…` line the installer printed. On Windows, open a new PowerShell window. If you installed with `-B`, add the folder yourself: see [the installers](https://ur.xyz/docs/miner/install#the-installers).

### `urnet-tools` on Windows says running scripts is disabled

That's Windows' default script policy. Type `urnet-tools.cmd` instead of `urnet-tools`, for example `urnet-tools.cmd status`.

### `no systemd user session` (Linux)

The installer couldn't reach your user's systemd, which happens in a `sudo su` shell, in many containers and in WSL without systemd. It installs the miner anyway, but can't run it in the background. Log in directly as the user who will run the miner (over SSH or at the console) and run the installer again, or run it in the foreground: the first time with `urnetwork provide --allow-client-registration`, then with `urnetwork provide`. Without a user session there are no automatic updates, so run `urnet-tools update` yourself from time to time, or use a system service instead: `sudo urnetwork service install --system`. Run as root in such a shell, the installer installs a system service by itself.

### The installer says your processor isn't supported

The releases cover 64-bit and 32-bit Intel and AMD, 64-bit ARM, and 32-bit ARMv7 (a Raspberry Pi 2 or newer) on Linux, and Apple silicon and Intel Macs. A Pi Zero or Pi 1 isn't supported. On anything else, [build from source](https://ur.xyz/docs/miner/install#build-from-source).

### macOS says the program can't be opened

A file downloaded with a web browser is quarantined. Run `xattr -d com.apple.quarantine "$HOME/.local/bin/provider"` once. (A file downloaded with `curl` isn't, and the command then says `No such xattr`, which is harmless.)

## Signing in

### Nothing appears when I paste the auth code

That's on purpose: the prompt hides the code. Paste it and press Enter.

To give up, press Ctrl-C: it says `Cancelled.` and changes nothing. Pressing Enter on the empty prompt says `No auth code was entered`. Have your code ready before you run `provider login` or `provider setup`.

### `That auth code wasn't accepted`

The code was mistyped, already used or expired. Get a new code from your operator account and run `provider login` again. In a log, rather than a terminal, the same error appears as `panic: Invalid auth code.` followed by internal details you can ignore.

### `… jwt exists. Overwrite? [yN]`

This device is already signed in. Answer `y` to sign in again with the new code, or anything else to keep the current sign-in.

### `Couldn't reach the URnetwork API`

In a log this appears as `panic: http request attempts exhausted`. The miner couldn't reach the operator. Check the computer's internet connection, and that the operator's URLs are right (`provider network`).

On a network that inspects encrypted traffic with its own certificate authority, such as some company networks, the miner rejects that authority. Point `URNETWORK_CONNECT_EXTRA_ROOT_CA_FILE` at a PEM file holding only that network's CA certificates, then try again. For the background service, set it and run `provider service install` again.

## Starting

### First, ask the miner

`provider status` says what's missing and the command to run next, and `provider doctor` checks the state folder, DNS, the connection, TLS and the clock, and names the fix for each problem. Start there; the entries below explain the messages in more detail.

### The miner stops straight away

`provider start` says why in plain words, and exits with code 3:

- *This device isn't signed in yet*: run `provider setup`, or `provider login`.
- *This is the first start on this device*: answer yes in a terminal, or add `--allow-client-registration` in a script. If you used an installer, run `urnet-tools start`: it registers a new device once you're signed in.

`provider provide` says so only when the device isn't signed in. On a device that was never registered, it logs `startup_recovery_required` unless you add `--allow-client-registration`.

Otherwise the miner prints a JSON line with `"event":"startup_recovery_required"` and exits. With `provider provide`, as the installers run it, it exits with code 0 and stays stopped. `provider start` and the `provider service` background miner exit with code 1, and the service restarts it every 15 to 30 seconds: stop it with `provider service stop` while you restore the folder. This usually means **this device's identity files are missing or don't match**, for example after moving to a new computer or restoring part of a backup. Restore the whole `~/.urnetwork` folder from your backup. Signing in again doesn't replace a lost identity, and `--allow-client-registration` won't bring it back either: it only registers new devices.

### `The state folder … can be changed by other users`

In a log this appears as `registration parent must be owned and not writable by other users`. The miner's folder belongs to another user (for example, after running the miner once with `sudo`) or can be changed by other users, so it refuses to save its identity there. Give it back to your user, make it private, and start again:

```bash
sudo chown -R "$USER" ~/.urnetwork
chmod 700 ~/.urnetwork
```

On Windows, run the `icacls` command the message prints.

### The log keeps saying `refused`

The miner started, but the operator isn't accepting its connection, and it keeps retrying every few seconds. The status page still says `"status":"ok"`, because the process itself is fine.

- Make sure the computer has a normal home or server internet connection, without a VPN or proxy in front of the miner.
- Check that you signed in to the operator the miner is using (`provider network`).
- If it continues, ask your operator or [on our Discord](https://discord.gg/urnetwork), with the lines around `refused`.

### The miner stops when I log out

On Linux, your user's services stop at logout unless lingering is on. The installer and `provider service install` try to turn it on; if they printed a lingering warning, turn it on once with `sudo loginctl enable-linger "$USER"`.

On Windows, the installer starts the miner when you sign in, and it stops when you sign out. That's a known limit: keep the user signed in (a locked screen is fine).

### `operator <domain> is awaiting auth`

With `--all-operators`, that operator has no sign-in yet. Run `provider auth --operator=<domain>`, or start with `--auto-register --hotkey_seed_file=<path>`. The miner checks again every five minutes. See [Mine every listed operator](https://ur.xyz/docs/miner/advanced#mine-every-listed-operator).

## The extender

`provider status` has an Extender line, and `provider doctor` an Inbound 443 line. In the log, the `extender` record's `reason` says what's wrong and its `guidance` how to fix it. The miner keeps mining while its extender is off. See [Run an extender](https://ur.xyz/docs/miner/extender).

### The extender can't bind TCP port 443

The miner couldn't listen on TCP port 443, so its extender is off. It tries again every 3 minutes.

- `tcp_443_permission_denied`: on Linux, a miner that runs as your user isn't allowed to listen on ports below 1024. Install it as a system service that may: with the installer, `curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system`; with `provider service`, `sudo "$(command -v provider)" service install --system --as="$USER"`. See [Let the miner listen on port 443](https://ur.xyz/docs/miner/extender#linux-let-the-miner-listen-on-port-443).
- `tcp_443_in_use`: another program holds the port, such as a web server or another miner process on the same computer. Only one program per computer can have it; the miner takes it within 3 minutes of it coming free.
- `tcp_443_bind_failed`: it failed for another reason. Read the log lines around it.

### The extender is unreachable on TCP 443

`unreachable_on_tcp_443`: the miner listens on port 443, but the operator's test couldn't reach it from the internet, so the extender isn't listed. A firewall, a cloud security group or a home router is keeping incoming connections out, or the connection is behind carrier-grade NAT. Open TCP 443 (and UDP 443 and 4053): see [Open the ports](https://ur.xyz/docs/miner/extender#open-the-ports).

The miner tries again once a day. After you open the ports, restart it to try at once: `provider service restart`, or `urnet-tools restart` with an installer.

## Getting paid

### `wallet challenge` or `wallet set` says `credential not ready`

The device isn't registered yet. Run `provider setup`, or start it once with `provider start` and let it register, then set the wallet. See [Set your payout wallet](https://ur.xyz/docs/miner/rewards#set-your-payout-wallet).

### A new wallet doesn't show up straight away

That's expected. A wallet setting starts at the next epoch and never changes where earlier rewards go. See [When the wallet starts earning](https://ur.xyz/docs/miner/rewards#when-the-wallet-starts-earning).

### No payout for an epoch

To be paid, a device needs completed traffic, enough verification checks, at least one confirmation and a signed wallet for that epoch. A device in the head tier earns there instead of from the pool. See [How rewards are counted](https://ur.xyz/docs/miner/rewards#how-rewards-are-counted).

### The claim proof isn't ready

Check that the operator has published this device's work for the epoch and finalized the epoch's root. The claim uses the device's `.provider.jwt`; your account sign-in (`jwt`) can't stand in for it.

### Proof or root mismatch

Keep the output and compare the deployment, epoch and payout files with your operator. Waiting or changing wallets won't fix proofs that disagree.

### Claimed, but my balance hasn't changed

Look for `ClaimPaid` or `ClaimPaymentDeferred` in the receipt, and check the α stake on your coldkey, not the relayer's balance. See [Read the result](https://ur.xyz/docs/miner/rewards#3-read-the-result).

### The connection dropped during a claim

Check what happened to the transaction you sent, or to the claim daemon's queue, before using the relayer key again. Keep the signed transaction history.
