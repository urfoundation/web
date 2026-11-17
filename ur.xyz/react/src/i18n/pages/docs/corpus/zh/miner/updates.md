---
published: 2026-10-21
description: 让 UR 矿工保持最新。安装程序和矿工自己的服务如何自动更新它，如何检查、更改或关闭更新，以及如何停留在某个版本。
---

# 让矿工保持最新

新的矿工版本会修复问题，并让你的矿工与网络保持兼容，因此最好运行最新版本。如果你使用了[安装程序](/docs/miner/install#the-installers)，或者让 `provider setup` 安装了后台服务，那就什么都不用做：矿工会自动更新。

## 自动更新（安装程序）

每个安装程序都会开启自动更新，但没有 systemd 用户会话的 Linux，以及在 Windows 上用 `-Tag` 安装特定版本时除外。默认情况下，它大约每 6 小时在 [build 版本发布页面](https://github.com/urnetwork/build/releases)上检查一次是否有更新的版本。如果有，它会下载新版本，用 GitHub 为其列出的 SHA-256 进行校验（没有 SHA-256 的版本不会被安装），确认新程序能够运行，然后将其替换上去。正在运行的矿工会以新版本重启；你已停止的矿工则保持停止。如果任何环节失败，旧版本会继续运行。你在 `~/.urnetwork` 中的身份不会被改动，你的更新和启动设置也会被保留。

各系统如何按计划执行：

- **Linux：** 一个 systemd 定时器，每 6 小时一次，外加最多一小时的随机延迟。
- **macOS：** 一个 launchd 代理，每天在为每台 Mac 一次性选定的时间检查四次，并在你登录时再检查一次，因此睡眠或关机过的 Mac 也能补上。
- **Windows：** 一个更新程序，在你登录时隐藏启动，每小时唤醒一次，并在间隔时间过去后进行检查，因此睡眠和重启不会跳过检查。

更新也会把 `urnet-tools` 本身更新到最新。在 Linux 上，它永远不会把你降级到更旧的版本。

若要查看你的版本、是否有更新的版本，或立即更新：

```bash
urnet-tools version
urnet-tools update
```

### 更改或关闭自动更新

自动更新默认开启，我们建议保持开启。若要查看它是否开启以及检查频率：

```bash
urnet-tools auto-update
```

若要降低检查频率，可选择 `6h`（默认）、`daily`、`weekly` 或 `monthly`。这不会改变更新当前的开启或关闭状态：

```bash
urnet-tools auto-update --interval daily
```

若要关闭更新，以及重新开启：

```bash
urnet-tools auto-update off
urnet-tools auto-update on
```

关闭自动更新后，请不时自己运行 `urnet-tools update`。你的选择在更新或再次运行安装程序时都会被保留。若要从一开始就以关闭更新的方式安装，请向 macOS 安装程序传入 `--no-auto-update`，或向 Windows 安装程序传入 `-NoAutoUpdate`。在 Linux 上，请在安装后立即运行 `urnet-tools auto-update off`。

### 停留在某个版本

若要安装特定版本，请提供版本发布页面上的标签：

```bash
urnet-tools reinstall -t <version>
```

然后用 `urnet-tools auto-update off` 关闭自动更新，否则下一次检查又会把你更新到最新版本。

## 自动更新（provider 服务）

> **自 2026.10.22 以来，这些更新没有安装过任何版本。** 2026年11月11日之后的第一个版本发布后，请按照[如何运行矿工](/docs/miner)顶部的通知手动更新一次。从那以后，它们会按此处描述的方式工作。

由 `provider setup` 或 `provider service install` 设置的[后台服务](/docs/miner/run#with-provider-service)也会让矿工保持最新。它每 6 小时检查一次 [build 版本发布页面](https://github.com/urnetwork/build/releases)：在 Linux 上从电脑启动 15 分钟后开始，外加最多一小时的随机延迟；在 macOS 上从你登录时开始；在 Windows 上从你登录 15 分钟后开始，外加最多一小时的随机延迟。新版本发布后，每个矿工会在 16 小时内随机等待属于自己的一段时间，因此每个矿工都会在一天之内获得新版本，而不会全部同时重启。

更新会用 GitHub 为下载文件列出的 SHA-256 进行校验（这能发现损坏的下载），把旧程序保留在新程序旁边，然后重启服务。如果新版本在 10 分钟内没有恢复运行（如果之前已连接，还要求重新连接），就会换回旧版本，并在一周内跳过该版本。你在 `~/.urnetwork` 中的身份不会被改动。

```bash
provider update --check    # is a newer release out?
provider update            # update now
provider update --status   # automatic update settings and the last check
```

程序所在的文件夹必须对服务的用户可写；`provider doctor` 会检查这一点。由安装程序设置的矿工会继续通过 `urnet-tools` 更新，`provider update` 会替你运行它。

### 关闭矿工自身的更新

自动更新默认开启，我们建议保持开启。若要关闭，以及重新开启：

```bash
provider update --off
provider update --on
```

你也可以在安装服务时关闭更新：`URNETWORK_AUTO_UPDATE=0 provider service install`。这不会影响由安装程序设置的矿工；对那种矿工请使用 `urnet-tools auto-update off`。关闭更新后，请不时自己运行 `provider update`。

## 不使用自动更新

[源代码构建](/docs/miner/install#build-from-source)永远不会自动更新：请重新构建。你在终端中运行的矿工，或在[你自己的服务](/docs/miner/run#a-service-of-your-own)下运行的矿工，可以用 `provider update` 更新；然后重启它。

请关注[版本发布页面](https://github.com/urnetwork/build/releases)上的新版本；GitHub 可以在每次发布时通知你。`provider --version` 会打印你当前的版本。
