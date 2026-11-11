---
published: 2026-11-11
description: Run the UR miner's extender. The ports to open, firewalls, cloud security groups and port forwarding, the Linux privilege for port 443, and how to check it.
---

# Run an extender

An extender is a relay that lets people reach the network from places where the operator's own servers are blocked. Every miner runs one beside its exit, on by default. It only works when the internet can reach your computer on TCP port 443. If you used an installer, type `urnetwork` wherever this page says `provider`.

An extender is a party to every contract that crosses it, so it earns a share of every contract it carries.

## The ports

Open these ports for incoming connections from any address, on IPv4 and on IPv6:

| Port | Protocol | Needed | What it's for |
| --- | --- | --- | --- |
| 443 | TCP | Required | The extender's main carrier. Without it the extender stays off, and the miner tries the port again every 3 minutes. |
| 443 | UDP | Recommended | The QUIC carrier. |
| 4053 | UDP | Recommended | The DNS carrier. |
| 53 | UDP | Optional | DNS on its standard port. If the miner can't listen on it, it only loses this one port. |

The operator tests TCP port 443 from the internet before it lists your extender. The UDP ports give clients more ways to reach it.

Only one program on a computer can listen on TCP port 443. When several miner processes run on one host, for example with `--all-operators`, the first to take the port serves the extender for the host, and another takes over within 3 minutes of it stopping. A web server or any other program on port 443 keeps the extender off.

## Open the ports

There can be three firewalls between the internet and the miner: the computer's own, the cloud provider's, and a home router. Each one has to let the ports in.

### The computer's firewall

With ufw (Ubuntu, Debian):

```bash
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 4053/udp
```

With firewalld (Fedora, RHEL, Rocky, AlmaLinux):

```bash
sudo firewall-cmd --permanent --add-port=443/tcp --add-port=443/udp --add-port=4053/udp
sudo firewall-cmd --reload
```

With nftables or iptables rules of your own, add accept rules for the ports to the input chain, before any rule that drops or rejects, and save them so they survive a restart.

Oracle Cloud's Ubuntu images come with iptables rules that reject everything except SSH. Insert the accept rules above the reject rule, then save them:

```bash
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 4053 -j ACCEPT
sudo netfilter-persistent save
```

For IPv6, run the same rules with `ip6tables`.

On macOS and Windows, if the firewall is on, allow incoming connections for the miner (`provider`, or `urnetwork` from an installer) when it asks.

### Cloud firewalls and security groups

A cloud server usually has a firewall in front of it too. Allow inbound TCP 443, UDP 443 and UDP 4053 from `0.0.0.0/0` and `::/0`:

- **AWS:** the instance's security group (inbound rules), and the subnet's network ACL if you changed it.
- **Google Cloud:** a VPC firewall rule for ingress that applies to the instance.
- **Azure:** the network security group on the VM's network interface or its subnet.
- **Oracle Cloud:** the VCN's security list or network security group, as well as the iptables rules above.
- **Hetzner Cloud:** the Cloud Firewall, if one is attached to the server.
- **DigitalOcean:** the Cloud Firewall, if one is attached to the Droplet.

### Home routers

At home, the router keeps incoming connections out. In its settings (often called port forwarding, virtual servers or NAT), forward TCP 443, UDP 443 and UDP 4053 to the computer that runs the miner. Give that computer a fixed address on your network (a DHCP reservation), so the forward keeps pointing at it. Only one computer behind a public IPv4 address can have port 443.

Some connections can't be forwarded. If the router's internet (WAN) address is between `100.64.0.0` and `100.127.255.255`, or isn't the address websites see for you, your internet provider puts you behind carrier-grade NAT (CGNAT). Ask your provider for a public IPv4 address, or use IPv6.

Many routers give each device a public IPv6 address but block incoming IPv6 connections. Allow inbound TCP 443, UDP 443 and UDP 4053 to this computer in the router's IPv6 firewall.

### Docker

A miner in a container needs its ports published:

```bash
docker run -p 443:443/tcp -p 443:443/udp -p 4053:4053/udp …
```

The firewalls above still apply to the host.

## Linux: let the miner listen on port 443

Linux lets only privileged programs listen on ports below 1024. The installer and `provider service install` run the miner as your user, so its extender can't listen on TCP port 443 and stays off. The log then says `tcp_443_permission_denied`. A miner that already runs as root, such as one installed with `sudo provider service install --system`, or as root inside a container, can. macOS and Windows let any program listen on port 443, so there is nothing to grant there.

The fix is a system service that runs the miner as your user, with one extra privilege: `CAP_NET_BIND_SERVICE`, which lets a program listen on ports below 1024.

### With the Linux installer

Run the installer again with `--system`, as the user who mines (not with `sudo`). It asks for your `sudo` password once:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

An existing install can also switch with `urnet-tools reinstall --system`.

It installs `/etc/systemd/system/urnetwork.service`, which runs the miner as you, stops and removes your own `urnetwork.service`, and keeps your update timer. From then on, `urnet-tools start`, `stop`, `restart`, `status`, `logs` and `uninstall` work on the system service, and `start`, `stop` and `uninstall` ask for `sudo`.

Run as root without a systemd user session (a `sudo su` shell), the installer installs the system service by itself.

### With provider service

```bash
sudo "$(command -v provider)" service install --system --as="$USER"
```

The full path is there because `sudo` doesn't look in `~/.local/bin`. This installs `urnetwork-provider.service` as a system service that runs the miner as that user, with their binary and their `~/.urnetwork`. First it stops and removes that user's own `provider service`, so two miners never run on one identity.

Updates still install automatically, run as that user, and a small root-owned path unit restarts the service after each update. `provider service status` shows the service. To remove it:

```bash
sudo "$(command -v provider)" service uninstall --system
```

A plain `sudo provider service install --system`, without `--as`, is unchanged: it runs the miner as root, with its state in `/var/lib/urnetwork`.

### What the unit grants

The installer's unit, for a user named `alice`:

```ini
[Unit]
Description=URnetwork Provider
Documentation=https://ur.xyz/docs/miner/extender
Wants=network-online.target
After=network-online.target

[Service]
User=alice
ExecStart="/home/alice/.local/share/urnetwork-provider/bin/urnetwork" provide
Restart=on-failure
RestartSec=30
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

The `provider service` unit has the same `User=` line and the same three capability lines, with `ExecStart=<path>/provider start` and `Environment=URNETWORK_STATE_DIR=/home/<user>/.urnetwork`.

Three lines make the whole grant:

- `AmbientCapabilities=CAP_NET_BIND_SERVICE` gives the miner the one privilege.
- `CapabilityBoundingSet=CAP_NET_BIND_SERVICE` keeps it from ever holding any other.
- `NoNewPrivileges=yes` keeps it, and anything it starts, from gaining privileges, for example through a setuid program.

The trade-off: while the service runs, the program it starts can listen on ports below 1024. The binary lives in your folder, so anyone who can replace it (you, or a program running as you) can run code that listens on low ports under this unit. That code gains no other privilege: it doesn't run as root, `NoNewPrivileges` is on, and the bounding set holds only that one capability. If that isn't acceptable on a shared computer, don't use `--system`. The miner still mines without its extender.

Other ways to grant the port, and why the miner doesn't use them:

- `setcap` on the binary: file capabilities are lost each time an update replaces the binary.
- A setuid binary: far more privilege than one port needs.
- `net.ipv4.ip_unprivileged_port_start`: it changes the rule for every program and every user on the computer.

To go back to a user service: with the installer, run `urnet-tools uninstall`, then install again without `--system` (your identity in `~/.urnetwork` is kept). With `provider service`, run `sudo "$(command -v provider)" service uninstall --system`, then `provider service install`.

## Check it

```bash
provider status
provider doctor
```

`provider status` has an **Extender** line. `provider doctor` has an **Inbound 443** line: whether the miner holds TCP port 443, and the result of its last activation.

In the log (`provider service logs --follow`, or `urnet-tools logs`), the `extender` record says what's wrong in `reason`, and how to fix it in `guidance`:

| `reason` | What it means | What to do |
| --- | --- | --- |
| `tcp_443_permission_denied` | The miner isn't allowed to listen on port 443. | [Let the miner listen on port 443](#linux-let-the-miner-listen-on-port-443). |
| `tcp_443_in_use` | Another program holds TCP port 443: another miner process, or a web server. | Only one program per computer can have it. The miner takes the port within 3 minutes of it coming free. |
| `tcp_443_bind_failed` | Listening on port 443 failed for another reason. | Read the log lines around it. |
| `unreachable_on_tcp_443` | The miner listens, but the operator's test couldn't reach it from the internet. | [Open the ports](#open-the-ports), then restart the miner. |

An extender the internet can't reach tries to activate again once a day. After you open the ports, restart the miner to try at once: `provider service restart`, or `urnet-tools restart` with an installer.
