---
description: 用一个二进制文件运行 URnetwork 运营商，为 main 环境配置 PostgreSQL、Redis 和 Warp 资源，并运营 SN25 奖励流水线。
---

# 如何成为网络运营商

网络运营商运行 UR 隐私网络的服务器：供用户和矿工接入的 API 和 connect 服务、验证者遍历的 `/verify` 端点，以及在 **Bittensor SN25（netuid 25）**上为其矿工结算奖励的周期流水线。运营商带来自己的用户和产品（ur.io 的各款应用就属于其中一个运营商），存入 α 作为有收入支撑的真实需求信号，并在每个结算周期提交 Merkle 支付清单，把自己的池分配给旗下矿工。它报告分配所依据的使用量，但从不持有任何他人的 α：不可变的结算金库拥有该池，每个矿工都直接从中领取。

[`server/cli/all/main.go`](https://github.com/urnetwork/server/blob/main/cli/all/main.go) 入口点同时运行 API、Connect 和生产 taskworker。你只需部署一个运营商可执行文件；PostgreSQL、Redis、工件存储和公网 TLS 入口仍然是后端服务。机制请阅读 [Litepaper](/docs/litepaper)；其他角色请参阅[如何运行矿工](/docs/miner)和[如何运行验证者](/docs/validator)。

## 适用对象

想要运行一个网络空间的团队：网络空间即一套开源服务器栈的部署，它拥有自己的域名、用户、应用或集成，以及一个矿工社区。在启动阶段，运营商准入由所有者把关（请参阅[初始阶段](#initial-period)），因此第一步是与子网所有者沟通。

## 你需要什么

- **一台 Linux 主机和你的域名。** 这个单一二进制文件提供 API（`api.<your domain>`）、Connect（`connect.<your domain>`）以及完整的生产 taskworker。PostgreSQL 存储账户、使用量、结算数据和持久任务队列；Redis 提供共享协调和缓存；本地持久工件存储保存支付工件和证据工件。请配置你的运营商所提供的各项集成，使用扩展器时还包括扩展器 gossip。可选的 Alt 和 Proxy 前端是独立的服务器角色。
- **在协调器上获得准入。** 运营商由子网所有者通过 `registerOperator(noId, coldkey, poolHotkey, depositHotkey, depositSigner, rootSigner, effectiveEpoch, maximumBurnRao)` 注册。这是一个仅限所有者的调用，它还会让结算金库以金库自己的 coldkey 注册你的池 UID（注册所需的销毁从该调用附带的金额中支付，上限为 `maximumBurnRao`，未销毁的余额会退还）。之后的角色变更通过 `scheduleOperator` 安排在未来生效。你提供这些身份；所有者完成注册，并把你的 `no_id` 交给你。
- **密钥和 hotkey。** 一个运营商 coldkey（ss58，前缀 42）；一个**池 hotkey**，由金库注册为你的池 UID；一个你独有的**存款 hotkey**，存款在其上暂存；以及由服务器持有的三个 EVM 签名者（十六进制编码的 secp256k1）：**存款签名者**（`deposit_key`，调用 `deposit`）、**根签名者**（`root_key`，关闭周期、提交支付根并完成最终确定），以及**工件签名者**（`artifact_key`，为支付工件签名；验证者会把它固定为你的 `artifact_signer`）。这些签名者需要 Subtensor EVM 上的 TAO 来支付 gas；存款 hotkey 需要 α 才能存款（初始阶段不需要）。
- **`/verify` 服务器密钥。** 在 `verify.yml` vault 资源中放置一个或多个 Ed25519 密钥；第一个密钥为新的遍历路径签名，所有密钥都发布在 `GET /verify/keys`，使历史证明在密钥轮换后仍能验证。
- **出口探测。** 该二进制文件的 taskworker 运行由 `config/main/provider_egress_probe.yml` 配置的持久探测分片，测量每个矿工的出口实际承载了什么。
- **一个公开的统计数据源**（`stats.json`），以便 ur.xyz 的运营商目录能够列出你。

## 第 1 步：构建单一运营商二进制文件

使用当前的 [`urnetwork/server`](https://github.com/urnetwork/server) 源码，以及其[源码锁定文件](https://github.com/urnetwork/server/blob/main/local/source-graph/lock.yml)中指定的 Go 版本和**精确的同级仓库修订版本**。当前的锁定文件使用 Go 1.27.3。它的同级检出包括 `connect`、`glog`、`sdk`、`proxy`、`goidenticons`、`userwireguard`、`warp`、`sn` 和 `gvisor`；其中 `sn` 来自 `urfoundation/sn`，其余来自 `urnetwork`。请把它们放在 `server` 旁边：`go.mod` 使用相对路径替换。准备该源码树时，请遵循仓库的[规范构建说明](https://github.com/urnetwork/server#canonical-build-sources)。

在 `server` 检出目录中运行：

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/ur-operator ./cli/all

./build/ur-operator --help
```

把 `build/ur-operator` 复制到服务器上的 `/usr/local/bin/ur-operator`。把该二进制文件的源码修订版本与你的发布记录保存在一起。每次升级都要基于该 server 修订版本所选定的依赖修订版本来构建。

## 第 2 步：为 main 创建 Warp 目录布局

该可执行文件使用与各个独立服务器服务相同的解析器。`WARP_ENV=main` 选择**部署环境**；`URNETWORK_ST_PROFILE=mainnet` 则单独选择**链 profile**。本示例以专用的 `urnetwork` Unix 用户运行该进程，公网 HTTPS 由同一主机上的反向代理终止。

```bash
sudo useradd --system --home-dir /srv/warp --no-create-home \
  --shell /usr/sbin/nologin urnetwork
sudo install -d -o root -g urnetwork -m 0750 /srv/warp
sudo install -d -o root -g urnetwork -m 0750 \
  /srv/warp/config/main/mmdb /srv/warp/vault/main /srv/warp/site
sudo install -d -o root -g urnetwork -m 0750 /etc/urnetwork
```

使用以下布局。`pg.yml` 之类的名称是字面意义上的资源名称；下面示例中的 `<...>` 值必须替换。

```text
/usr/local/bin/ur-operator
/etc/urnetwork/operator.env
/etc/urnetwork/durable-volumes.json   # external declaration for artifact storage
/srv/urnetwork-data/                 # separately mounted persistent filesystem
  operator-blob/                     # preprovisioned artifact root
  operator-identity/                 # external volume marker and root lease
/srv/warp/
  config/
    main/
      db.yml
      redis.yml
      tls.yml
      provider_egress_probe.yml
      sn.yml                         # reviewed earnings/activation declaration
      operator-gas-authority.yml      # independently provisioned public approval
      mmdb/
        geolite2.mmdb                 # real GeoLite2-City database
        places.yml                   # place export from the same database
    all/                             # optional resources shared by environments
  vault/
    main/
      pg.yml
      redis.yml
      jwt.yml
      jwt-signing.pem
      password.yml
      client.yml
      verify.yml
      provider_egress.yml
      minio.yml
      st.yml
      auth.yml                       # OAuth configuration when offering OAuth
      oauth/                         # OAuth's separate signing keys
      extender.yml                   # when offering extender/gossip services
      tls/                           # when enabling Connect's native TLS transports
        connect.example.net/
          connect.example.net.crt
          connect.example.net.key
    all/                             # optional shared vault resources
  site/
    settings.yml                     # host-specific routes/settings
```

把 vault 文件设为 `root:urnetwork`、权限 `0640`，vault 目录设为 `0750`；生成机密时使用 `umask 077`。运营商的配置和二进制文件应对服务用户可读但不可写。PostgreSQL、Redis 和对象存储需要独立于这个资源树的持久数据和备份。

在没有覆盖设置时，各根目录为 `$WARP_HOME/{config,vault,site}`，而 `WARP_HOME` 默认为 `/srv/warp`。你也可以把 `WARP_CONFIG_HOME`、`WARP_VAULT_HOME` 和 `WARP_SITE_HOME` 设为其他根目录。对于每个资源，解析器先尝试根目录下的直接文件，然后是 `main/`，再然后是 `all/`；之后它按语义版本降序搜索各版本目录。因此，根目录级别的文件会覆盖环境中的副本。Warp 容器可以把已选定的环境直接挂载到某个根目录。请始终使用同一种布局，并避免在优先级更高的位置留下过时的文件。

把 `/etc/urnetwork/operator.env` 写成普通的 `NAME=value` 赋值，不带 `export`，这样 shell 和 systemd 都能读取它：

```dotenv
WARP_HOME=/srv/warp
WARP_ENV=main
URNETWORK_ST_PROFILE=mainnet
WARP_SERVICE=all
WARP_BLOCK=operator-1
WARP_HOST=operator-1.example.net
WARP_DOMAIN=example.net
WARP_VERSION=2026.10.6
WARP_CONFIG_VERSION=2026.10.6
WARP_HOST_IPV4=127.0.0.1
WARP_PORTS=8080:8080,8081:8081,8082:8082,5080:5080
BY_LOG_LOGTOSTDERR=true
```

把域名、主机、二进制版本和配置版本替换为你自己的。`WARP_PORTS` 的格式是 `service-port:host-port`，其中包括 **5080**，即第一个内部 Connect 交换端口。三个 HTTP 端口必须互不相同。保留主机 IP 和显式的端口映射，也决定了启用哪些可选的原生 Connect 监听器。分配更多交换端口时，请添加连续的内部映射 `5081:5081`、`5082:5082`，依此类推。

对于这种单主机环回部署，`/srv/warp/site/settings.yml` 会把对外公布的主机路由回它的内部监听器：

```yaml
routes:
  operator-1.example.net: 127.0.0.1
```

如果存在 `config/main/settings.yml`，它会提供共享的 `all:` 设置和特定于主机的设置，随后由 `site/settings.yml` 覆盖。请把机密保存在 vault 中，而不是 `settings.yml` 的 `env_vars` 块里：启动时会把合并后的设置写入日志。本示例在 vault 文件中使用字面写出的 PostgreSQL/Redis/RPC authority，因此不需要 `BRINGYOUR_POSTGRES_HOSTNAME`、`BRINGYOUR_REDIS_HOSTNAME` 和 `BRINGYOUR_SUBTENSOR_HOSTNAME`。只有当你的资源用 `{{ env:NAME }}` 显式插值引用它们时，才需要这些变量。

## 第 3 步：设置 PostgreSQL、Redis 和工件存储

把 PostgreSQL 和 Redis 作为独立的服务安装并启动；server 仓库的本地环境使用 PostgreSQL 18 和 Redis 8。在已安装 PostgreSQL 的主机上，创建运营商自己的数据库和属主角色：

```bash
sudo -u postgres createuser --pwprompt urnetwork
sudo -u postgres createdb --owner=urnetwork --encoding=UTF8 \
  --locale=en_US.UTF-8 --template=template0 urnetwork
```

如果数据库主机没有 `en_US.UTF-8` 区域设置，请先安装它。把 PostgreSQL 绑定到环回地址，并在 `pg_hba.conf` 中允许角色 `urnetwork` 从 `127.0.0.1/32` 使用 `scram-sha-256` 以密码认证方式访问数据库 `urnetwork`。迁移所用的角色必须是该数据库/schema 的属主，并能创建和修改其中的表和索引。请使用生成的十六进制密码，这样它放在此服务器构造的连接 URL 中也是安全的。

创建 `/srv/warp/vault/main/pg.yml`：

```yaml
authority: 127.0.0.1:5432
db: urnetwork
user: urnetwork
password: "<the PostgreSQL role password>"
```

创建 `/srv/warp/config/main/db.yml`：

```yaml
min_connections: 0
max_connections: 32
```

维护连接池会回退使用这些资源。如果加入 PgBouncer，请让 `pg.yml` 指向连接池程序，并把直连 PostgreSQL 的连接放在 `vault/main/pg_maintenance.yml` 中；`config/main/db_maintenance.yml` 可以单独设置该连接池的大小。迁移和维护需要直接连接。请为这两个连接池以及任何其他客户端规划 PostgreSQL 的连接数上限。当前的 PostgreSQL 客户端使用 `sslmode=disable`，因此请让这条连接走环回地址或受保护的私有传输。

为 Redis 配置持久化和密码。对于通过软件包安装的 Redis 服务，相关的 `redis.conf` 设置如下：

```conf
bind 127.0.0.1
protected-mode yes
appendonly yes
maxmemory-policy noeviction
requirepass <a separate generated Redis password>
```

写入这些设置后重启 Redis。创建 `/srv/warp/vault/main/redis.yml`：

```yaml
authority: 127.0.0.1:6379
password: "<the Redis password>"
cluster: false
db: 0
```

创建 `/srv/warp/config/main/redis.yml`：

```yaml
min_connections: 0
max_connections: 32
```

这是两个独立的文件：vault 提供连接凭据，config 提供连接池大小。Redis 集群使用 `cluster: true`；本指南使用专供运营商的独立实例。这两个后端服务都不应能从公网访问。

### 准备本地工件存储

支付和证据相关代码使用服务器的 `BlobStore` 接口。它支持本地文件，不需要云对象存储账户。配置资源仍然名为 `minio.yml`，本地后端也是如此。

在 `/srv/urnetwork-data` 挂载一个持久的**独立文件系统**，使用 ext4、XFS 或 Btrfs，并确保它在服务启动前完成挂载。系统根文件系统上的目录、tmpfs 或容器 overlay 都无法通过守护进程的存储准入检查。请根据你的工件历史和备份来确定文件系统的大小。

对于一个**全新的空运营商**，请创建工件根目录及其独立保存的身份声明。下面的示例会拒绝重用已有的根目录、标记文件或声明。确认这是预期挂载的卷之后，以主机管理员身份运行一次：

```bash
sudo python3 - <<'PY'
import hashlib, json, os, pathlib, pwd, subprocess

mount = pathlib.Path('/srv/urnetwork-data')
root = mount / 'operator-blob'
identity = mount / 'operator-identity'
declaration = pathlib.Path('/etc/urnetwork/durable-volumes.json')
account = pwd.getpwnam('urnetwork')
if not os.path.ismount(mount) or mount.stat().st_dev == pathlib.Path('/').stat().st_dev:
    raise SystemExit('a separately mounted persistent filesystem is required')
uuid, fs_type = subprocess.check_output(
    ['findmnt', '--noheadings', '--raw', '--output', 'UUID,FSTYPE', '--mountpoint', str(mount)],
    text=True).strip().split()
if fs_type not in ('ext4', 'xfs', 'btrfs'):
    raise SystemExit('unsupported durable filesystem')
if any(p.exists() for p in (root, identity, declaration)):
    raise SystemExit('existing storage requires its original declaration and recovery procedure')
os.umask(0o077)
root.mkdir(mode=0o700)
os.chown(root, account.pw_uid, account.pw_gid)
identity.mkdir(mode=0o750)
os.chown(identity, 0, account.pw_gid)
os.chmod(identity, 0o750)
def digest(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()
def protected_write(path, data):
    with path.open('xb') as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.chown(path, 0, account.pw_gid)
    os.chmod(path, 0o640)
marker, lease, generation = os.urandom(32), os.urandom(32), os.urandom(32)
protected_write(identity / 'marker', marker)
protected_write(identity / 'blob-lease', lease)
os.setxattr(root, 'user.urnetwork.durable-root-generation', generation, os.XATTR_CREATE)
config = {'schema': 'urnetwork-durable-volumes-v2', 'volumes': [{
    'mount_path': str(mount), 'filesystem_uuid': uuid, 'filesystem_type': fs_type,
    'marker_path': str(identity / 'marker'), 'marker_sha256': digest(marker),
    'min_available_bytes': 1073741824, 'min_available_inodes': 10000,
    'state_roots': [{'path': str(root), 'lease_path': str(identity / 'blob-lease'),
        'lease_sha256': digest(lease), 'root_inode': root.stat().st_ino,
        'generation_sha256': digest(generation)}]}]}
encoded = (json.dumps(config, indent=2) + '\n').encode()
protected_write(declaration, encoded)
for directory in (root, identity, mount, declaration.parent):
    fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)
print('declaration:', declaration)
print('sha256:', digest(encoded))
PY
```

记下输出的声明路径和 `sha256:` 摘要，然后配置 `/srv/warp/vault/main/minio.yml`：

```yaml
authority: local
path: /srv/urnetwork-data/operator-blob
prefix: blob
max_bytes: 107374182400
durable_volumes:
  path: /etc/urnetwork/durable-volumes.json
  sha256: "sha256:<exact declaration digest>"
```

本示例最多为 blob 分配 100 GiB，并在可用空间低于 1 GiB 或空闲 inode 少于 10,000 个时拒绝写入；请为你的主机选择合适的限制。该声明绑定了文件系统 UUID、标记文件、租约、根目录 inode 和 32 字节的代次属性。服务会验证这些已有对象，绝不会创建替代的根目录。请保护好它们的所有权设置及其上级目录，不允许组用户或其他用户写入。重启时请保留原始声明及其字节；恢复到另一个 inode 或文件系统需要进行显式的存储迁移，而不是在保留的工件之上重新运行这个全新设置。此流程只准备运营商的文件存储；矿工的领取队列和验证者的日志有各自的属主状态准备步骤。

在 `main` 中，缺少 `minio.yml` 时不会回退到文件系统。现有部署也可以改用 [`server/blob.go`](https://github.com/urnetwork/server/blob/main/blob.go) 支持的自托管 MinIO 后端，配置 `authority`、`tls`、`access_key`、`secret_key`、`bucket` 和 `prefix`。请在恢复计划中把工件存储和数据库放在一起考虑：矿工和验证者必须仍能获取链上的根所引用的工件。

## 第 4 步：配置身份验证和入口

生成一个专用的 P-256 JWT 签名密钥到 `vault/main/jwt-signing.pem`，例如使用 `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt-signing.pem`，然后按上文所述的 vault 权限安装它。请在 `umask 077` 下、于私有目录中完成这一步。让 `vault/main/jwt.yml` 指向它：

```yaml
tls_key_paths:
  - jwt-signing.pem
```

这个资源名称是历史遗留的：它可以是一个专用的签名密钥，不必是你的公网 HTTPS 证书密钥。轮换期间，请让之前的 JWT 密钥保持可用。配置两个相互独立的随机 pepper：

```yaml
# vault/main/password.yml
password:
  pepper: "<random password pepper>"
```

```yaml
# vault/main/client.yml
client_ip_hash_pepper: "<different random IP hash pepper>"
```

在 `config/main/mmdb/geolite2.mmdb` 安装一个最新的、已获授权的 GeoLite2-City 数据库，以及与之匹配的 `places.yml`。服务器的 `cli/geolite2export` 构建工具会从这个确切的 MMDB 生成地点列表（`-mmdb <path> -out <path>`）；请在构建/配置主机上生成它，并同时部署这两个文件。体积很小的 `local/testdata` 数据库只是测试夹具，而不是生产用的地理数据库。API 和 Connect 的预热需要有效的 City 数据库，位置数据的初始化需要它的地点列表。

创建 `config/main/tls.yml`，即使部署只使用 WebSocket，Connect 也会加载它：

```yaml
allowed_hosts:
  - connect.example.net
```

针对上面的环回端口映射，按如下方式配置你的 HTTPS 反向代理：

| 公网端点 | 内部监听器 | 入口要求 |
| --- | --- | --- |
| `https://api.example.net` | `http://127.0.0.1:8080` | 转发 API 路由和真实的客户端地址 |
| `wss://connect.example.net` | `http://127.0.0.1:8081` | 保留 WebSocket 升级和长连接 |
| worker 状态 | `http://127.0.0.1:8082/status` | 保持私有，仅供监控 |
| Connect 交换 | TCP `127.0.0.1:5080` | 仅限内部 |

用你的公开域名的证书终止 TLS。入口必须**用一个真实的客户端 `IP:port` 对覆盖 `X-UR-Forwarded-For`**，IPv6 地址要加方括号。[服务器的地址解析器](https://github.com/urnetwork/server/blob/main/session/client_session.go)会有意忽略标准的 `X-Forwarded-For`；`/verify` 依赖于观察到矿工真实的出口地址。只有你信任的入口才应能访问内部监听器。转发 `/verify`、`/sn/*` 和 WebSocket 流量时，不要套用会干扰其自身协议的身份验证或缓冲规则。

这个端口映射提供的是 WebSocket 传输。原生的 HTTP/3 和 DNS 传输还需要：为服务端口 UDP/443 和 UDP/4053 配置的 Connect 端口映射、[Warp 入口转发约定](https://github.com/urnetwork/warp)，以及位于 `vault/main/tls/<hostname>/<hostname>.crt` 和 `.key` 的证书。公网 DNS 使用 UDP/53，入口会把它转发到私有的 UDP/4053；UDP/8053 是一个兼容监听器，只有在显式映射时才会启用。这些监听器需要生产入口的 Proxy Protocol 帧格式；仅开放一个 UDP 端口是不够的。请把每一对证书和密钥放在同一个资源/版本目录中。

完整的 API 和 worker 还支持 OAuth、电子邮件、订阅和扩展器等产品功能。提供这些功能时，请为它们准备相应的资源；该二进制文件不会生成集成凭据。OAuth 使用 `auth.yml`，有自己的签发者和**独立的** OAuth 签名密钥，由 Warp 的 OAuth 工具生成和轮换。请参阅[服务器 IDP 配置](https://github.com/urnetwork/server/blob/main/IDP.md)。不要把 JWT 密钥用作 OAuth 签名者。

### 配置验证端点

`/verify` 路由不需要单独的服务：它是 API 的一部分，它的统计数据、证明和密钥都是同一主机上的公开路由：

| 路由 | 用途 |
| --- | --- |
| `POST /verify` | 遍历路径协议（SEED、EXTEND、FINAL），通过协议自身的 Ed25519 签名进行认证，而不是 JWT |
| `GET /verify/keys` | 服务器签名密钥，包括当前的和历史的 |
| `GET /verify/stats` | 运营商观测到的汇总数据，用于审计和重建（验证者不依据这些数据评分） |
| `GET /verify/proofs` | 每一条已签名、未被毒化的已完成或已过期遍历路径 |
| `GET /key/<client_id>` | 客户端的 Ed25519 公钥，无需认证 |
| `POST /sn/wallet`, `GET /sn/wallet` | 矿工的领取 coldkey |
| `GET /sn/pool/claim` | 矿工某个周期的 Merkle 证明 |
| `GET /sn/epoch` | 镜像的合约时钟（`epoch`、`start_block`、`commit_deadline_block`、`finalize_block`、`t_epoch_blocks`、`chain_id`、`contract_address`、`settlement_vault_address`、`no_id`、`netuid`、`rpc_url`） |
| `GET /sn/artifact`, `GET /sn/artifacts` | 按内容哈希和历史提供的已签名支付工件 |
| `POST /sn/attempt-artifact`, `GET /sn/evidence`, `GET /sn/evidence/history` | 验证者的证据上传和已发布的证据索引 |

创建 `verify.yml` vault 资源（与 `jwt.yml` 位于同一级）：

```yaml
keys:
  - server_key_id: 0
    seed: <base64 standard encoding of a 32-byte Ed25519 seed>
```

`server_key_id` 是一个字节（0 到 255），携带在每条 ASSIGN 和 FINAL 消息中；轮换时，在最前面添加一个新条目，并保留旧条目。验证至少需要一个密钥；启动后请检查 `GET /verify/keys`。

`/verify` 服务器强制执行验证者所依赖的不变式：每个符合条件的矿工恰好对应一个出口 IP，每个出口 IP 也恰好对应一个矿工；在两个出口后面被观察到的矿工会从合格索引中移除，直到它恢复为一个出口。源地址无法解析为矿工、或超出软限制的种子会被毒化（照常走完全部深度，但永不发布），使该端点无法被当作判断哪些地址是矿工的预言机；只有策略中针对每个来源的硬限制（`hard_seed_per_minute_per_source`、`hard_extend_per_minute_per_source`、`hard_active_trails_per_source`）才会直接拒绝请求。

## 第 5 步：配置周期流水线

subtensor 流水线由 `vault/main/st.yml` 配置。如果没有一个有效且已启用的资源，API 和 taskworker 仍可在子网子系统被禁用的情况下运行，因此仅凭 HTTP 健康检查无法确认矿工能够获得收益或进行领取。在环境中用 `URNETWORK_ST_PROFILE=mainnet`、在文件中用 `profile: mainnet` 来选择主网。测试网有单独的 `testnet-...` 命名空间；它不能通过 `WARP_ENV` 或仅更改 `profile` 来选择。字段如下，摘自 [`server/controller/st_controller.go`](https://github.com/urnetwork/server/blob/main/controller/st_controller.go)：

```yaml
profile: mainnet
enabled: true
# keep the unsigned POST /sn/wallet path closed; apps sign the challenge
wallet_allow_unsigned: false
public_rpc_url: https://<public evm json-rpc>   # published to clients via GET /sn/epoch
rpc_urls: [https://<evm json-rpc>]        # or `authority`, resolved by server/st
chain_id: 964
genesis_hash: "0x<native genesis hash>"
deployment_id: ur-mainnet
policy_hash: "0x<sha256 of the signed policy>"
launch_readiness_sha256: "<reviewed readiness receipt digest from sn.yml>"
coordinator_address: "0x<coordinator>"
settlement_vault_address: "0x<settlement vault>"
reserve_sink_address: "0x<reserve sink>"
netuid: 25
no_id: <your operator id>
treasury_hotkey: "0x<32-byte hotkey>"
deposit_hotkey: "0x<32-byte hotkey>"
deposit_key: "<hex secp256k1 key>"        # deposit signer
root_key: "<hex secp256k1 key>"           # root signer: close, commit root, finalize
artifact_key: "<hex secp256k1 key>"       # payout artifact signer
deposit_tiers:                            # the signed policy's tier schedule, verbatim
  - min_conviction_rao: 0
    rate_numerator_rao_per_gib: <rate>    # rao per GiB of usage
    # rao per distinct user (omit or 0 when the policy prices bytes only)
    rate_numerator_rao_per_user: <rate>
    rate_denominator: 1
# the policy's zero_rate_action; equal_demand only while every rate is 0
deposit_zero_rate_action: halt
deposit_epoch_cap_rao: <cap>              # custody blast-radius cap per epoch
reliability_a_min: 8                      # the policy's reliability_a_min
block_seconds: 12
deploy_block: <coordinator deployment block>
```

已启用的运营商需要**三个互不相同的**存款、根和工件密钥。它们必须与已获准入的运营商身份一致。缺失或格式错误的 `st.yml` 会被记录为子系统已禁用；启动后请明确检查这一状态。`attempt_upload` 和 `reserved_attempt_upload` 限制验证者的证据上传；`ops_key` 和 `contract_address` 是遗留字段，新部署不应使用。

主网激活还需要经过审核的 `config/main/sn.yml` 收益声明，其中包括所选的链/创世区块、协调器、结算金库、策略和就绪回执。请在第 6 步首次运行 `db migrate` 之前安装它，因为那次运行会据此确定这个数据库永久的收益边界；并确保它的就绪摘要与 `st.yml` 中的 `launch_readiness_sha256` 一致。这些特定于部署的值通过运营商准入获得，请原样保留经过审核的字节。服务器会把截止点之后的使用量与遗留义务分开处理，并在激活受阻或身份不一致时拒绝主网结算。

在任何主网 EVM 发布能够成功之前，请在 `st.yml` 中安装独立签名的 `operator_gas_policy`，以及与之匹配的 `config/main/operator-gas-authority.yml`。该批准绑定了运营商、存款/根账户、策略修订版本、有效期窗口、交易历史固定值以及 gas/尝试次数限制。[gas 策略实现](https://github.com/urnetwork/server/blob/main/st_operator_gas_policy.go)定义了它的 schema。为签名者充值不能代替这项批准，批准者的私钥也不应放在这台主机上。

存款档位必须与已签名策略中的档位表一致：验证者会用同一公式重新计算你应缴的存款，当观察到的存款与之不同时，会将你的池归零（见下文）。

## 第 6 步：迁移、初始化并运行

启动 worker 之前，请先安装第 7 步中的探测资源。下面三条命令都要使用同一个二进制文件和同一套环境。`db migrate` 不接受任何选项。它会应用服务器完整的 PostgreSQL 迁移目录；它不会创建 PostgreSQL 角色或数据库。随后它会检查提供者收益边界：数据库中一行不可变的记录，保存着来自 `sn.yml` 的收益截止点和主网链身份，它决定哪些已完成的使用量在 SN25 上获得收益，哪些按遗留方式以 USDC 结清。在全新的数据库上，第一次 `db migrate` 会根据已安装的 `sn.yml` 准备该边界，并打印 `Prepared provider earning boundary:`，附带截止点、身份摘要和初始 `sn.yml` 的摘要，以及准备时间。之后的每次运行都不读取 `sn.yml`，保持边界不变，并打印 `Retained provider earning boundary:` 及相同的值，因此编辑过的 `sn.yml` 永远不会改变边界，也不会让迁移失败；当编辑后的收益身份与边界不一致时，worker 会暂缓新的收益分配和支付提交。如果在边界建立之前 `sn.yml` 缺失或无效，该命令会在应用迁移之后报告这个错误；请修正该文件后再次运行。准备边界并不会激活主网。

**在全新数据库上首次运行 `db migrate` 之前，请审核 `sn.yml`。** 那次运行会根据已安装的文件确定永久的收益边界，且不做摘要检查，此后边界再也无法更改。其他所有收益字段都必须等于其公布的值（schema、归属和遗留策略、profile `mainnet`、链 964、netuid 25），因此 `cutoff_utc` 和 `genesis_hash` 是首次运行前必须确保正确的值。

以服务用户身份打开一个 shell，然后加载环境：

```bash
sudo -u urnetwork bash
set -a
. /etc/urnetwork/operator.env
set +a

ur-operator db migrate
ur-operator init-tasks
ur-operator run --require-subnet
```

每条命令都成功完成后再运行下一条。`init-tasks` 会初始化周期性的生产任务；正常启动时也会确保它们幂等的调度存在。普通的 `run` 从不应用数据库迁移。`--require-subnet` 会让缺失、无效或已禁用的 `st.yml` 成为启动错误，而不是悄悄启动一个没有子网流水线的网络。运行中的 worker 会执行维护、探测、验证和 SN 周期任务，以及已配置的零售/产品工作。

默认监听器为 API 8080、Connect 8081 和 worker 状态 8082，默认有八个 worker，批大小为四。对应的选项是 `--api-port`、`--connect-port`、`--taskworker-port`、`--worker-count` 和 `--worker-batch-size`。更改端口时，请同时更新 `WARP_PORTS` 和反向代理。

对于可选的 Connect 诊断，`--memory-owner-ledger` 会启用按传输属主的记账。`--private-heap-profile-target` 接受 `config`（默认值）、`disabled` 或一个精确的 `host/block` 范围。

对于使用扩展器的运营商，请在 `vault/main/extender.yml` 中配置部署的根密钥/签发者密钥和 gossip 身份，把 `8083:8083` 加入 `WARP_PORTS`，把 `wss://gossip.example.net` 路由到它的监听器，并添加 `--gossip-port=8083`。非空的 `gossip_identity_key_hex` 要求必须有该监听器：宣告了 gossip 却不运行它，会让排队中的扩展器发布无人消费。请参阅[扩展器部署规范](https://github.com/urnetwork/connect/blob/main/EXTENDER.md)。Alt 和 Proxy 部署继续使用它们自己的前端；运行这里描述的 API/Connect 运营商并不需要它们。

前台启动运行正常后，用 Ctrl-C 停止它，并退出服务用户的 shell。安装 `/etc/systemd/system/ur-operator.service`：

```ini
[Unit]
Description=URnetwork operator
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target
RequiresMountsFor=/srv/urnetwork-data

[Service]
Type=simple
User=urnetwork
Group=urnetwork
WorkingDirectory=/srv/warp
EnvironmentFile=/etc/urnetwork/operator.env
ExecStart=/usr/local/bin/ur-operator run --require-subnet
Restart=on-failure
RestartSec=5
TimeoutStopSec=180
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

根据你的发行版调整后端服务的单元名称；如果配置了 gossip，请加上 gossip 参数。启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ur-operator
sudo journalctl -u ur-operator -f
```

检查**每个**服务的就绪 JSON。仅有 HTTP 200 是不够的；每个 `status` 都必须是 `ok`：

```bash
for port in 8080 8081 8082; do
  curl --fail --silent --show-error "http://127.0.0.1:$port/status" \
    | jq -e '.status == "ok"' || break
done
curl --fail --silent --show-error https://api.example.net/verify/keys
curl --fail --silent --show-error https://api.example.net/sn/epoch
```

确认公开的周期响应标明了你预期的链、合约、结算金库和 `no_id`，并确认 worker 正在推进它的链镜像。就绪检查会在服务激活之前检查 PostgreSQL 的迁移头和 Redis；它并不能证明运营商准入已经完成、发布已获注资和批准，或有可用的领取。如果某项检查报告 `error not ready`，请解决其原因并重启：就绪状态在启动时即被锁定。升级时，请备份数据库和工件，部署经过审核的资源，显式应用迁移，然后重启二进制文件并再次检查所有监听器。

启用 gossip 时，它没有 `/status` 端点。请单独检查它的监听器和启动日志：`[gossip]not ready` 表示它的发布队列排空器没有启动，即使网状网络能够接收消息也是如此。请先解决后端服务的错误并重启，再把 gossip 发布视为就绪。

## 第 7 步：运行探测器

矿工的定位和健康检查都通过固定到每个矿工的隧道进行，绝不从运营商主机自己的网络发起。单一二进制文件的生产 worker 运行持久探测分片；请用你自己的端点配置 `config/main/provider_egress_probe.yml`：

```yaml
enabled: true
shard_count: 4
api_url: https://api.example.net
platform_url: wss://connect.example.net
public_api_url: https://api.example.net
url_probe:
  limit: 8
  concurrency: 8
  probe_timeout_seconds: 60
```

创建 `vault/main/provider_egress.yml`，内容为 `ingest_secret: "<a separate random ingest secret>"`。每个活动的探测分片会在执行准入时创建自己的凭据和额度；周期性的 `ProberBootstrap` 任务会在崩溃后清理已结束分片的账户。更改分片配置后，请重新运行 `ur-operator init-tasks`。当前的生产探测使用 `url_probe`；较旧的 `full` 和 `blackhole` 任务字段为兼容而保留。在接纳矿工之前，请监控探测结果和队列重试：API 可以访问并不能证明矿工的出口可用。

## 第 8 步：发布统计数据源并被列入目录

ur.xyz 的运营商目录是内置在网站中的注册表，位于 `web/ur.xyz/react/src/lib/network.js`（`NETWORK_OPERATORS`）：运营商通过拉取请求在其中添加一个条目来列出自己，条目包括名称、网站、应用名称、仪表盘和 GitHub 的 URL、应用商店页面，以及它的 `statsUrl`。网站会在访问者的浏览器中从每个已列出的源读取实时总数，因此该源必须是公开的 JSON，并且恰好带有一个 `Access-Control-Allow-Origin`（`*`，或包含 `https://ur.xyz` 的回显值）：

```json
{
  "epoch": 1,
  "epoch_start": 1791569340,
  "epoch_end": 1792174140,
  "epoch_start_block": 9247228,
  "epoch_end_block": 9297628,
  "block": 1,
  "users": 125000,
  "data_gib": 812345.5,
  "total_networks": 250000,
  "staked_alpha": 250000.0,
  "demand_deposits_alpha": 1234.5,
  "miner_emissions_alpha": 5678.9,
  "alpha_usd": 1.75,
  "countries": 123,
  "prev_users": 118000,
  "prev_data_gib": 1012345.5,
  "prev_demand_deposits_alpha": 1100.5,
  "prev_miner_emissions_alpha": 5200.1
}
```

`epoch` 是当前的结算周期，`epoch_start` 和 `epoch_end` 是它以 unix 秒表示的起止时间，`epoch_start_block` 和 `epoch_end_block` 是它以链上区块表示的起止边界：在主网上，周期 n ≥ 1 从区块 9,247,228 + (n − 1) × 50,400 开始，持续 50,400 个区块；链尚未到达的边界按每个区块 12 秒推算。各累计值针对该周期，`prev_*` 则针对上一个周期（没有已结束的周期时省略它们）。`block` 是已弃用的别名，等于 `epoch`。网站会把没有 `epoch` 的源视为旧格式，其时间窗口并不是结算周期：此时网站会运行自己的周期时钟，并且不显示该源的任何窗口期数据。`alpha_usd` 是你观察到的 α 价格（网站取各运营商的平均值），`countries` 仅供参考。缺失的字段会被解析为 null，而绝不会被解析为零。

## 服务器在每个周期做什么

只要存在 `st.yml`，taskworker 就会自行运行这条流水线；这里的任何步骤都不需要运营商守在键盘前：

1. **`StSyncChain`**（每 5 s）把合约的周期时钟镜像到 `st_epoch` 和 Redis（通过 `GET /sn/epoch` 提供），推进已最终确定事件的镜像，回填 worker 停止运行期间错过的任何周期，并在根据区块推算出的时间调度下面的各项每周期任务。合约时钟具有权威性；每个截止时间在发送前都会按区块重新检查。
2. **`StEpochClose(e)`** 为已结束的周期计算支付叶节点和根，并在链上关闭你的池（`closeOperatorEpoch`，根签名者），把池已实现的发行捕获进金库。每个符合条件的矿工（`usage_bytes > 0`、至少 `reliability_a_min` 个已分配的跳、至少一次确认、有钱包，并且没有绑定到头部集群）获得 `weight = usage_bytes × confirmations / max(assignments, reliability_a_min)`，按 coldkey 汇总后，用最大余数法分配为恰好 10,000 个基点。该列表被写成一份已签名、按内容寻址的支付工件。
3. **`StCommitRoot(e)`** 在根提交窗口内提交根和工件哈希（`commitOperatorRoot`，根签名者），每 5 分钟重试一次，并在截止时间前两小时发出告警。
4. **`StDeposit(e)`** 确定并发送本周期的存款（`deposit`，存款签名者）：它读取上一个周期已签名的支付工件，取出其中的 `total_usage_bytes` 和 `total_users`（该周期内有合约使用量的不同顶级用户数，与你的统计数据源中的 `users` 是同一个数字），读取你在本周期之前的信念，选择档位，并计算 `floor(usage_bytes × rate_numerator_rao_per_gib / (GiB × rate_denominator) + users × rate_numerator_rao_per_user / rate_denominator)`，上限为 `deposit_epoch_cap_rao`。周期 0 不存入任何存款；金额为零的存款会被跳过；该周期已在链上的存款也会被跳过。当所有已配置的费率均为 0 时（`deposit_zero_rate_action: equal_demand`，即初始阶段），该任务会记录一次跳过的发布，不发送交易，不预留 nonce，也不触发告警；`bringyourctl st status` 会显示存款金额的计算（字节数、用户数、档位、应缴存款，或价格为零）。暂存的 α 会被转移到储备 hotkey，并转入不可变的储备接收合约：存款是信念质押，永远不会退还。
5. **`StFinalizePoke(e)`** 在最终确定区块当时或之后调用无需许可的 `finalizeOperatorEpoch`，确定权益（捕获的发行加上同一运营商的结转），从而开放领取。

每次尝试都会被记录（`AddStPublish`/`UpdateStPublish`），发布流程会跨重启把保留的交易与链状态进行核对。正常运行只使用单一的 `ur-operator` 二进制文件。如需可选的手动诊断和恢复，请从同一个 server 检出目录构建单独的管理客户端，并把它安装到运营商主机上：

```bash
GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
  go build -mod=readonly -p 2 -o build/bringyourctl ./bringyourctl
sudo install -o root -g root -m 0755 build/bringyourctl /usr/local/bin/bringyourctl
```

以服务用户身份运行它，并加载同一个 `/etc/urnetwork/operator.env`。这些是 `bringyourctl` 的管理子命令，而不是额外的 `ur-operator` 子命令：

```text
bringyourctl st status [--epoch=<epoch>]
bringyourctl st deposit [--alpha_rao=<alpha_rao>]
bringyourctl st commit --epoch=<epoch>
bringyourctl st finalize --epoch=<epoch>
```

手动指定 `--alpha_rao` 的存款仍受 `deposit_epoch_cap_rao` 限制。自愿信念（`addConviction`，同一条单向路径，它会提高你的档位，但不计为需求）没有对应的服务器任务；它是由你的存款签名者发出的一笔交易。

## 你如何被衡量和获得报酬

运营商的池发行属于它的矿工，结算金库依据运营商的根支付已实现的捕获金额。提供者获得的是 **momentum**：原生矿工分配中当下用于驱动网络的那部分份额，在运营商池和头部集群之间分配。启动时 momentum 为 10%。[Network Capacity Reserve](/reserve)，即 `ur-reserve` 2-of-3 multisig，获得其余部分：矿工发行 × (1 − momentum)。它的份额并不固定；随着 momentum 增长，它获得的会更少。这些是受原生共识和运行时行为约束的路由目标，而不是有保证的固定支付。原生储备与不可变的存款接收合约以及结算金库中的领取余额是分开的。请参阅[原生储备分配](https://github.com/urfoundation/sn/blob/main/mainnet/TREASURY-EMISSIONS.md)。你作为运营商的收入来自你自己的业务；子网向矿工支付的是承载这些流量的报酬。

- **池权重。** 每个 tempo，每个验证者都按 `implied_demand × Q` 为你的池赋予权重：`implied_demand = bytes × rate0_gib / GiB + users × rate0_user`，即你经审计的 `total_usage_bytes` 和 `total_users` 按信念为零的档位计价。你自己的档位，是你累计锁定的 α（存款加上自愿信念）所能满足其 `min_conviction_rao` 的最高档位，因此在每周期上限以下，坚定投入的运营商只需存入更少的 α 就能获得同样的权重：折扣改变的是你支付的金额，而不是你的权重。当周期上限截断了你应缴的金额时，它会按同一比例截断你的需求，因此在触及上限时，较低的档位费率会提高你的权重。`Q` 是该验证者通过自己的遍历路径测得的、按曝光量加权的池内矿工质量，并按策略的 `quality_transform` 限幅。原生 Yuma 根据验证者的权重行，按当前运行时的屏蔽、裁剪和归一化规则计算共识。当公布的价格为零时，每个池的隐含需求都恰好为 1（请参阅[初始阶段](#initial-period)）。
- **存款审计。** 验证者不会信任你对存款金额的计算。在 `usage_lag_epochs: 1` 和 `tier_snapshot: conviction_before_epoch` 下，每个验证者都会读取你为上一个周期提交的根，从你的 API 获取已签名的工件，检查其内容哈希、签名者、已最终确定的边界和根，根据 `total_usage_bytes` 和 `total_users` 重新计算应缴存款，并要求观察到的存款与之完全相等。`mismatch_action: zero_pool_weight`；根提交窗口结束后仍无法获取的根或工件按 `zero_pool_weight_after_root_window` 处理；引导周期必须是零存款。策略还对每个运营商每个周期的存款设有上限。在零价格策略下，根本不会审计任何存款：审计会被记录为 `zero_price_no_deposit_required`，无论你自愿存入了多少，你的池都符合条件。
- **头部集群。** 绑定到顶级集群的矿工，在绑定有效期间（`head_fleet_active`）会被提升出你的支付清单，并在其集群的 hotkey 上原生地获得收益；绑定失效后，它们会从下一个周期起回到你的池中。
- **结算。** 从周期 1 起，一个结算周期为 50,400 个区块，约 7 天（主网的周期 0 为 7,200 个区块）；主网的参考窗口为：1,200 个区块的根提交窗口（+4 h）、在 14,400 个区块时最终确定（+48 h），以及 8 个周期加 1 个宽限周期的领取期限，均由已签名的策略固定。未领取和未分配的余额，以及错过提交的根所捕获的发行，都会结转到你自己的下一个周期（`carry_same_operator`）；运营商之间不会转移任何东西。领取无需许可，任何合约暂停都无法阻止它们，已最终确定的权益也不能被任何升级或所有者操作改写；只有在链层面禁用 SN25 上质押转账的开关能够冻结领取，而它也无法拿走或转移任何领取。从结算 v2 的切换周期起，你的池改为通过 vault2 结算：你的矿工的份额只依据经验证的使用量，并累计到永不过期的账户中；每个根只有在验证者批准且 14,400 个区块的挑战窗口过去之后才会支付。

## 可能出现的问题

- **错过提交的根。** 如果根没有在窗口内提交，该周期仍会最终确定，捕获的发行会结转到你的下一个周期，验证者会从窗口结束起把你的池权重归零，直到审计通过。请留意 T-2h 告警。
- **不匹配的存款。** 你的存款与验证者重新计算的结果之间的任何差异（`st.yml` 中不同的档位表、手动的 `--alpha_rao` 覆盖、截断了金额的上限）都会让该池在这个周期归零。请让 `deposit_tiers` 和 `deposit_epoch_cap_rao` 与已签名的策略保持一致。
- **低于运行时转账下限的存款。** 服务器会按当前 α 价格，对照金库中不可变的 `minimumTransferTaoRao` 预检每一笔存款；对于转入储备时价值低于该下限的按使用量计算的金额，服务器会拒绝（且不预留 nonce）；该结果会被记录为该周期失败，且不会重试。
- **运营商太少。** 已签名的策略设定了健康运营商和在线验证者的最低数量（SN25 策略中各一个，测试网策略中各两个）；低于该数量时，验证者会停止引导。
- **没有钱包或曝光量的矿工。** 缺少领取钱包、或已分配的跳少于 `reliability_a_min` 的矿工得不到叶节点；在多个出口地址后面被观察到的矿工根本不会被分配跳，直到它恢复为一个出口地址。除非你设置 `wallet_allow_unsigned: true`，否则未签名的 `POST /sn/wallet` 路径保持关闭；应用会对钱包质询进行签名。
- **验证者无法获取的工件。** 验证者按内容哈希从你的 API 获取工件。请保持 blob 存储和 `/sn/artifact` 路由可访问；自相矛盾的发布（同一周期有两份工件）会导致审计失败。

## 初始阶段

启动时，公布的[价格表](/price)为**每 GiB 0 α、每用户 0 α**，已签名的主网策略也明确写入了这一零价格：每个档位的每 GiB 费率和每用户费率均为 0，并设置了 `zero_rate_action: equal_demand`。在价格为零期间，运营商不缴纳需求存款：既不要求，也不审计。把同样的档位表复制到 `st.yml` 中，并设置 `deposit_zero_rate_action: equal_demand`（没有这一项，服务器会拒绝全零的档位表，因此零价格绝不会意外出现）；此时 `StDeposit` 无需缴纳任何款项，不发送交易，也不触发告警，`bringyourctl st status` 会报告价格为零。验证者为每个已注册的运营商池赋予相同的隐含需求（恰好为 1），因此池通道仅按实测质量划分；自愿存款或信念锁定（`addConviction` 仍然可用，并且仍会提高你今后的档位）对你的池既无帮助也无损害。头部通道、`theta` 分配、质量限幅和让渡规则保持不变，你的周期流水线在其他方面也完全按上文运行：你的矿工要领取，仍然需要支付工件（现在还包含 `total_users`）和根提交。启动阶段，运营商准入由所有者把关，因此新的运营商会在审核后由子网所有者在协调器上注册。这是在清除网络中的错误期间有意采用的启动模式；请关注价格表的 RSS 源，留意开始收取存款的那次变更。
