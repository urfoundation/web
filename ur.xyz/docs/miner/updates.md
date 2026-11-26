---
published: 2026-10-21
description: Keep the UR miner up to date: how installers and its own service update it, how to change or turn off updates, how to stay on one version, and how to update Docker.
---

# Keep the miner up to date

New miner releases fix problems and keep your miner compatible with the network, so it's best to run the latest one. If you used an [installer](/docs/miner/install#the-installers), or let `provider setup` install the background service, there's nothing to do: the miner is updated automatically.

## Automatic updates (installers)

Every installer turns on automatic updates, except on Linux without a systemd user session and on Windows when you install a particular version with `-Tag`. By default it checks for a newer release on the [build releases page](https://github.com/urnetwork/build/releases) about every 6 hours. When there is one, it downloads it, checks it against the SHA-256 GitHub lists for it (a release without one isn't installed), makes sure the new program runs, and swaps it in. A miner that was running is restarted on the new version; one you stopped stays stopped. If anything fails, the old version keeps running. Your identity in `~/.urnetwork` isn't touched, and your update and start settings are kept.

How each system keeps to the schedule:

- **Linux:** a systemd timer, every 6 hours plus up to an hour of random delay.
- **macOS:** a launchd agent that checks four times a day at times picked once per Mac, and again when you log in, so a Mac that was asleep or off catches up.
- **Windows:** an updater that starts, hidden, when you sign in, wakes every hour and checks once the interval has passed, so sleep and restarts don't skip a check.

An update also brings `urnet-tools` itself up to date. On Linux it never moves you to an older release.

To see which version you have, and whether a newer one is out, or to update straight away:

```bash
urnet-tools version
urnet-tools update
```

### Change or turn off automatic updates

Automatic updates are on by default, and we recommend leaving them on. To see whether they're on, and how often they check:

```bash
urnet-tools auto-update
```

To check less often, choose `6h` (the default), `daily`, `weekly` or `monthly`. This keeps updates on or off as they are:

```bash
urnet-tools auto-update --interval daily
```

To turn them off, and back on:

```bash
urnet-tools auto-update off
urnet-tools auto-update on
```

With automatic updates off, run `urnet-tools update` yourself from time to time. Your choice is kept when you update or run the installer again. To install with updates off from the start, pass `--no-auto-update` to the macOS installer, or `-NoAutoUpdate` to the Windows one. On Linux, run `urnet-tools auto-update off` right after installing.

### Stay on one version

To install a particular release, give its tag from the releases page:

```bash
urnet-tools reinstall -t <version>
```

Then turn automatic updates off with `urnet-tools auto-update off`, or the next check will move you to the latest release again.

## Automatic updates (provider service)

> **These updates haven't installed any release since 2026.10.22.** Once the first release after November 11, 2026 is out, update by hand once, as the notice at the top of [How to run a miner](/docs/miner) explains. From then on they work as described here.

The [background service](/docs/miner/run#with-provider-service) that `provider setup` or `provider service install` sets up also keeps the miner up to date. It checks the [build releases page](https://github.com/urnetwork/build/releases) every 6 hours: on Linux from 15 minutes after the computer starts, plus up to an hour of random delay; on macOS from when you log in; on Windows from 15 minutes after you sign in, plus up to an hour of random delay. After a release, each miner waits its own random share of 16 hours, so every miner has it within a day without all of them restarting at once.

An update checks the download against the SHA-256 GitHub lists for it (that catches a damaged download), keeps the previous program beside the new one, and restarts the service. If the new version doesn't come back within 10 minutes (connected again, if it was connected before), the previous one is put back, and that release is skipped for a week. Your identity in `~/.urnetwork` isn't touched.

```bash
provider update --check    # is a newer release out?
provider update            # update now
provider update --status   # automatic update settings and the last check
```

The program's folder has to be writable by the service's user; `provider doctor` checks this. A miner an installer set up keeps updating through `urnet-tools`, and `provider update` runs it for you.

### Turn off the miner's own updates

Automatic updates are on by default, and we recommend leaving them on. To turn them off, and back on:

```bash
provider update --off
provider update --on
```

You can also install the service with updates off: `URNETWORK_AUTO_UPDATE=0 provider service install`. That doesn't affect a miner an installer set up; use `urnet-tools auto-update off` there. With updates off, run `provider update` yourself from time to time.

## Docker

A [Docker container](/docs/miner/install#docker) of the miner never updates itself: it runs the image it was created from until you recreate it, and restarting it isn't enough. Its log says when a newer release is out, and so does `bringyour-provider doctor`. When a release's image is published, the tags `latest` and `g4-latest` (and `beta-latest`, `g1-latest` to `g3-latest`) move to it.

> From July 2026 until November 22, 2026, the image wasn't rebuilt, and every tag of it was version 2026.7.2. A container created in that time still runs 2026.7.2 until you update it.

To update a container started with `docker run`, pull the image, then recreate the container with the same options and the same state directory:

```bash
docker pull bringyour/community-provider:latest
docker stop urnetwork
docker rm urnetwork
docker run -d --name urnetwork --restart unless-stopped \
  -v urnetwork:/root/.urnetwork bringyour/community-provider:latest provide
```

With Docker Compose, in the folder of your `compose.yaml`:

```bash
docker compose pull
docker compose up -d
```

Then `docker exec urnetwork bringyour-provider --version` prints the version it runs. Scripts and compose files written for the old image don't need to change: the image takes the same commands (`auth`, `provide`, `auth-provide`, `proxy`) and the same state directory. Tools that recreate containers when their tag moves, such as Watchtower, update a container that follows `latest` by themselves. To stay on one version instead, use its tag, such as `bringyour/community-provider:2026.11.19-1103608200`, and change the tag to update.

## Without automatic updates

A [source build](/docs/miner/install#build-from-source) never updates itself: build it again. A miner you run in a terminal, or under [a service of your own](/docs/miner/run#a-service-of-your-own), updates with `provider update`; then restart it.

Watch the [releases page](https://github.com/urnetwork/build/releases) for new versions; GitHub can notify you about each release. `provider --version` prints the version you have.
