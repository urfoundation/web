---
published: 2026-11-11
description: 运行 UR 矿工的扩展器。需要开放的端口、防火墙、云安全组和端口转发、Linux 上 443 端口所需的权限，以及如何检查。
---

# 运行扩展器

扩展器是一种中继，让人们能够在运营商自己的服务器被屏蔽的地方接入网络。每个矿工都会在其出口旁边运行一个扩展器，默认开启。只有当互联网能够通过 TCP 443 端口访问你的电脑时，它才能工作。如果你使用了安装程序，凡是本页写 `provider` 的地方都请输入 `urnetwork`。

扩展器是经过它的每份合约的一方，因此它会从其承载的每份合约中赚取一部分份额。

## 端口

为来自任意地址的入站连接开放以下端口，IPv4 和 IPv6 都要开放：

| 端口 | 协议 | 是否需要 | 用途 |
| --- | --- | --- | --- |
| 443 | TCP | 必需 | 扩展器的主要载体。没有它，扩展器会保持关闭，矿工每 3 分钟会再次尝试该端口。 |
| 443 | UDP | 建议 | QUIC 载体。 |
| 4053 | UDP | 建议 | DNS 载体。 |
| 53 | UDP | 可选 | 标准端口上的 DNS。如果矿工无法监听它，只会少掉这一个端口。 |

在把你的扩展器列入名单之前，运营商会从互联网测试 TCP 443 端口。UDP 端口则为客户端提供更多连接到它的方式。

一台电脑上只能有一个程序监听 TCP 443 端口。当一台主机上运行多个矿工进程时（例如使用 `--all-operators`），第一个占用该端口的进程为整台主机提供扩展器，在它停止后的 3 分钟内会有另一个进程接手。Web 服务器或任何其他占用 443 端口的程序都会让扩展器保持关闭。

## 开放端口

互联网和矿工之间可能有三道防火墙：电脑自身的防火墙、云服务商的防火墙，以及家用路由器。每一道都必须放行这些端口。

### 电脑的防火墙

使用 ufw（Ubuntu、Debian）：

```bash
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 4053/udp
```

使用 firewalld（Fedora、RHEL、Rocky、AlmaLinux）：

```bash
sudo firewall-cmd --permanent --add-port=443/tcp --add-port=443/udp --add-port=4053/udp
sudo firewall-cmd --reload
```

如果你使用自己的 nftables 或 iptables 规则，请在 input 链中、任何丢弃或拒绝规则之前，为这些端口添加接受规则，并保存它们，以便重启后仍然有效。

Oracle Cloud 的 Ubuntu 镜像自带的 iptables 规则会拒绝除 SSH 以外的所有连接。请把接受规则插入到拒绝规则之前，然后保存：

```bash
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 4053 -j ACCEPT
sudo netfilter-persistent save
```

对于 IPv6，请用 `ip6tables` 运行同样的规则。

在 macOS 和 Windows 上，如果防火墙已开启，请在系统询问时允许矿工（`provider`，或安装程序安装的 `urnetwork`）接受入站连接。

### 云防火墙和安全组

云服务器前面通常也有一道防火墙。请允许来自 `0.0.0.0/0` 和 `::/0` 的入站 TCP 443、UDP 443 和 UDP 4053：

- **AWS：** 实例的安全组（入站规则），如果你改过子网的网络 ACL，也要修改它。
- **Google Cloud：** 一条适用于该实例的 VPC 入站防火墙规则。
- **Azure：** 虚拟机网络接口或其子网上的网络安全组。
- **Oracle Cloud：** VCN 的安全列表或网络安全组，以及上面提到的 iptables 规则。
- **Hetzner Cloud：** Cloud Firewall（如果服务器挂载了它）。
- **DigitalOcean：** Cloud Firewall（如果 Droplet 挂载了它）。

### 家用路由器

在家里，路由器会阻挡入站连接。在路由器设置中（通常称为端口转发、虚拟服务器或 NAT），把 TCP 443、UDP 443 和 UDP 4053 转发到运行矿工的电脑。请在你的网络中为这台电脑分配一个固定地址（DHCP 保留），让转发始终指向它。一个公网 IPv4 地址后面只能有一台电脑使用 443 端口。

有些连接无法转发。如果路由器的互联网（WAN）地址介于 `100.64.0.0` 和 `100.127.255.255` 之间，或者与网站看到的你的地址不同，说明你的互联网服务商把你放在了运营商级 NAT（CGNAT）之后。请向服务商申请一个公网 IPv4 地址，或者使用 IPv6。

许多路由器会给每台设备分配公网 IPv6 地址，但会阻止入站 IPv6 连接。请在路由器的 IPv6 防火墙中允许到这台电脑的入站 TCP 443、UDP 443 和 UDP 4053。

### Docker

容器中的矿工需要发布其端口：

```bash
docker run -p 443:443/tcp -p 443:443/udp -p 4053:4053/udp …
```

上述防火墙对宿主机依然适用。

## Linux：让矿工监听 443 端口

Linux 只允许特权程序监听 1024 以下的端口。安装程序和 `provider service install` 以你的用户身份运行矿工，因此它的扩展器无法监听 TCP 443 端口，会保持关闭。此时日志会显示 `tcp_443_permission_denied`。已经以 root 身份运行的矿工可以监听，例如用 `sudo provider service install --system` 安装的矿工，或在容器内以 root 运行的矿工。macOS 和 Windows 允许任何程序监听 443 端口，因此在这两个系统上不需要授予任何权限。

解决办法是使用一个系统服务，以你的用户身份运行矿工，并额外授予一项权限：`CAP_NET_BIND_SERVICE`，它允许程序监听 1024 以下的端口。

### 使用 Linux 安装程序

以负责挖矿的用户身份（不要用 `sudo`）带上 `--system` 再次运行安装程序。它会询问一次你的 `sudo` 密码：

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

已有的安装也可以通过 `urnet-tools reinstall --system` 切换过来。

它会安装 `/etc/systemd/system/urnetwork.service`，以你的身份运行矿工，停止并移除你自己的 `urnetwork.service`，并保留你的更新定时器。从此以后，`urnet-tools start`、`stop`、`restart`、`status`、`logs` 和 `uninstall` 都作用于该系统服务，其中 `start`、`stop` 和 `uninstall` 会要求 `sudo`。

如果在没有 systemd 用户会话的情况下以 root 运行（`sudo su` shell），安装程序会自行安装该系统服务。

### 使用 provider 服务

```bash
sudo "$(command -v provider)" service install --system --as="$USER"
```

之所以写完整路径，是因为 `sudo` 不会在 `~/.local/bin` 中查找。这条命令会把 `urnetwork-provider.service` 安装为系统服务，以该用户的身份、使用其二进制文件和其 `~/.urnetwork` 运行矿工。它会先停止并移除该用户自己的 `provider service`，确保永远不会有两个矿工使用同一个身份运行。

更新仍会自动安装，并以该用户身份运行，另有一个由 root 拥有的小型 path 单元会在每次更新后重启该服务。`provider service status` 会显示该服务。若要移除它：

```bash
sudo "$(command -v provider)" service uninstall --system
```

不带 `--as` 的普通 `sudo provider service install --system` 保持不变：它以 root 身份运行矿工，状态位于 `/var/lib/urnetwork`。

### 该单元授予了什么

安装程序为名为 `alice` 的用户生成的单元：

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

`provider service` 的单元有相同的 `User=` 行和相同的三行 capability 设置，另有 `ExecStart=<path>/provider start` 和 `Environment=URNETWORK_STATE_DIR=/home/<user>/.urnetwork`。

整个授权由三行组成：

- `AmbientCapabilities=CAP_NET_BIND_SERVICE` 授予矿工这唯一的一项权限。
- `CapabilityBoundingSet=CAP_NET_BIND_SERVICE` 确保它永远无法持有任何其他权限。
- `NoNewPrivileges=yes` 防止它以及它启动的任何程序获得新的权限，例如通过 setuid 程序。

需要权衡的是：服务运行期间，它启动的程序可以监听 1024 以下的端口。二进制文件位于你的目录中，因此任何能够替换它的人（你本人，或以你的身份运行的程序）都可以在这个单元下运行监听低端口的代码。这些代码不会获得任何其他权限：它不以 root 身份运行，`NoNewPrivileges` 已开启，并且边界集合中只有这一项 capability。如果在共享电脑上这无法接受，请不要使用 `--system`。即使没有扩展器，矿工仍会照常挖矿。

授予该端口的其他方式，以及矿工为什么不用它们：

- 对二进制文件使用 `setcap`：每次更新替换二进制文件时，文件 capability 都会丢失。
- setuid 二进制文件：权限远超一个端口所需。
- `net.ipv4.ip_unprivileged_port_start`：它会改变电脑上所有程序和所有用户的规则。

若要改回用户服务：使用安装程序时，运行 `urnet-tools uninstall`，然后不带 `--system` 重新安装（你在 `~/.urnetwork` 中的身份会被保留）。使用 `provider service` 时，运行 `sudo "$(command -v provider)" service uninstall --system`，然后运行 `provider service install`。

## 检查

```bash
provider status
provider doctor
```

`provider status` 中有一行 **Extender**。`provider doctor` 中有一行 **Inbound 443**：显示矿工是否占用着 TCP 443 端口，以及其最近一次激活的结果。

在日志中（`provider service logs --follow`，或 `urnet-tools logs`），`extender` 记录会在 `reason` 中说明问题所在，并在 `guidance` 中说明如何修复：

| `reason` | 含义 | 处理方法 |
| --- | --- | --- |
| `tcp_443_permission_denied` | 矿工不被允许监听 443 端口。 | [让矿工监听 443 端口](#linux-let-the-miner-listen-on-port-443)。 |
| `tcp_443_in_use` | 另一个程序占用着 TCP 443 端口：另一个矿工进程，或一个 Web 服务器。 | 每台电脑只能有一个程序占用它。端口空出后 3 分钟内，矿工会占用该端口。 |
| `tcp_443_bind_failed` | 由于其他原因，监听 443 端口失败。 | 查看它前后的日志行。 |
| `unreachable_on_tcp_443` | 矿工正在监听，但运营商的测试无法从互联网访问到它。 | [开放端口](#open-the-ports)，然后重启矿工。 |

互联网无法访问的扩展器每天会尝试重新激活一次。开放端口后，重启矿工即可立即重试：`provider service restart`，如果使用了安装程序，则为 `urnet-tools restart`。
