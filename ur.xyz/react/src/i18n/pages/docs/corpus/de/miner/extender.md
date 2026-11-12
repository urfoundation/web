---
published: 2026-11-11
description: Den Extender des UR-Miners betreiben. Die zu öffnenden Ports, Firewalls, Cloud-Sicherheitsgruppen und Portweiterleitung, das Linux-Privileg für Port 443 und die Prüfung.
---

# Einen Extender betreiben

Ein Extender ist ein Relay, über das Menschen das Netzwerk von Orten aus erreichen, an denen die eigenen Server des Betreibers blockiert sind. Jeder Miner betreibt einen neben seinem Exit, standardmäßig eingeschaltet. Er funktioniert nur, wenn das Internet deinen Computer auf TCP-Port 443 erreichen kann. Wenn du einen Installer benutzt hast, tippe `urnetwork` überall, wo diese Seite `provider` sagt.

Ein Extender ist Partei jedes Vertrags, der ihn durchquert, und verdient daher einen Anteil an jedem Vertrag, den er trägt.

## Die Ports

Öffne diese Ports für eingehende Verbindungen von jeder Adresse, über IPv4 und über IPv6:

| Port | Protokoll | Benötigt | Wofür |
| --- | --- | --- | --- |
| 443 | TCP | Erforderlich | Der Hauptträger des Extenders. Ohne ihn bleibt der Extender aus, und der Miner versucht den Port alle 3 Minuten erneut. |
| 443 | UDP | Empfohlen | Der QUIC-Träger. |
| 4053 | UDP | Empfohlen | Der DNS-Träger. |
| 53 | UDP | Optional | DNS auf seinem Standardport. Kann der Miner nicht darauf lauschen, verliert er nur diesen einen Port. |

Der Betreiber testet TCP-Port 443 aus dem Internet, bevor er deinen Extender listet. Die UDP-Ports geben Clients weitere Wege, ihn zu erreichen.

Nur ein Programm auf einem Computer kann auf TCP-Port 443 lauschen. Laufen mehrere Miner-Prozesse auf einem Host, etwa mit `--all-operators`, bedient der erste, der den Port belegt, den Extender für den Host, und ein anderer übernimmt innerhalb von 3 Minuten, nachdem er gestoppt ist. Ein Webserver oder jedes andere Programm auf Port 443 sorgt dafür, dass der Extender ausgeschaltet bleibt.

## Die Ports öffnen

Zwischen dem Internet und dem Miner können drei Firewalls liegen: die des Computers selbst, die des Cloud-Anbieters und ein Heimrouter. Jede muss die Ports durchlassen.

### Die Firewall des Computers

Mit ufw (Ubuntu, Debian):

```bash
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 4053/udp
```

Mit firewalld (Fedora, RHEL, Rocky, AlmaLinux):

```bash
sudo firewall-cmd --permanent --add-port=443/tcp --add-port=443/udp --add-port=4053/udp
sudo firewall-cmd --reload
```

Mit eigenen nftables- oder iptables-Regeln füge der input-Chain Accept-Regeln für die Ports hinzu, vor jeder Regel, die verwirft oder ablehnt, und speichere sie, damit sie einen Neustart überstehen.

Die Ubuntu-Images von Oracle Cloud bringen iptables-Regeln mit, die alles außer SSH ablehnen. Füge die Accept-Regeln oberhalb der Reject-Regel ein und speichere sie dann:

```bash
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 4053 -j ACCEPT
sudo netfilter-persistent save
```

Für IPv6 führe dieselben Regeln mit `ip6tables` aus.

Unter macOS und Windows erlaube bei eingeschalteter Firewall eingehende Verbindungen für den Miner (`provider`, oder `urnetwork` von einem Installer), wenn sie danach fragt.

### Cloud-Firewalls und Sicherheitsgruppen

Vor einem Cloud-Server sitzt meist ebenfalls eine Firewall. Erlaube eingehend TCP 443, UDP 443 und UDP 4053 von `0.0.0.0/0` und `::/0`:

- **AWS:** die Sicherheitsgruppe der Instanz (eingehende Regeln) und die Netzwerk-ACL des Subnetzes, falls du sie geändert hast.
- **Google Cloud:** eine VPC-Firewallregel für eingehenden Verkehr, die für die Instanz gilt.
- **Azure:** die Netzwerksicherheitsgruppe an der Netzwerkschnittstelle der VM oder an ihrem Subnetz.
- **Oracle Cloud:** die Sicherheitsliste oder Netzwerksicherheitsgruppe des VCN, zusätzlich zu den iptables-Regeln oben.
- **Hetzner Cloud:** die Cloud Firewall, falls eine an den Server angehängt ist.
- **DigitalOcean:** die Cloud Firewall, falls eine an das Droplet angehängt ist.

### Heimrouter

Zu Hause hält der Router eingehende Verbindungen draußen. Leite in seinen Einstellungen (oft Portweiterleitung, virtuelle Server oder NAT genannt) TCP 443, UDP 443 und UDP 4053 an den Computer weiter, auf dem der Miner läuft. Gib diesem Computer eine feste Adresse in deinem Netz (eine DHCP-Reservierung), damit die Weiterleitung weiter auf ihn zeigt. Nur ein Computer hinter einer öffentlichen IPv4-Adresse kann Port 443 haben.

Manche Anschlüsse lassen sich nicht weiterleiten. Liegt die Internetadresse (WAN) des Routers zwischen `100.64.0.0` und `100.127.255.255` oder ist sie nicht die Adresse, die Websites von dir sehen, setzt dich dein Internetanbieter hinter Carrier-Grade-NAT (CGNAT). Bitte deinen Anbieter um eine öffentliche IPv4-Adresse oder verwende IPv6.

Viele Router geben jedem Gerät eine öffentliche IPv6-Adresse, blockieren aber eingehende IPv6-Verbindungen. Erlaube in der IPv6-Firewall des Routers eingehend TCP 443, UDP 443 und UDP 4053 zu diesem Computer.

### Docker

Ein Miner in einem Container braucht veröffentlichte Ports:

```bash
docker run -p 443:443/tcp -p 443:443/udp -p 4053:4053/udp …
```

Die Firewalls oben gelten weiterhin für den Host.

## Linux: den Miner auf Port 443 lauschen lassen

Linux lässt nur privilegierte Programme auf Ports unter 1024 lauschen. Der Installer und `provider service install` betreiben den Miner als dein Benutzer, daher kann sein Extender nicht auf TCP-Port 443 lauschen und bleibt aus. Das Log meldet dann `tcp_443_permission_denied`. Ein Miner, der bereits als root läuft, etwa einer, der mit `sudo provider service install --system` installiert wurde, oder als root in einem Container, kann es. macOS und Windows lassen jedes Programm auf Port 443 lauschen, dort gibt es also nichts zu gewähren.

Die Lösung ist ein Systemdienst, der den Miner als dein Benutzer betreibt, mit einem zusätzlichen Privileg: `CAP_NET_BIND_SERVICE`, das einem Programm erlaubt, auf Ports unter 1024 zu lauschen.

### Mit dem Linux-Installer

Führe den Installer erneut mit `--system` aus, als der Benutzer, der mint (nicht mit `sudo`). Er fragt einmal nach deinem `sudo`-Passwort:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

Eine bestehende Installation kann auch mit `urnet-tools reinstall --system` wechseln.

Er installiert `/etc/systemd/system/urnetwork.service`, das den Miner unter deinem Benutzer betreibt, stoppt und entfernt deinen eigenen `urnetwork.service` und behält deinen Update-Timer. Von da an wirken `urnet-tools start`, `stop`, `restart`, `status`, `logs` und `uninstall` auf den Systemdienst, und `start`, `stop` und `uninstall` fragen nach `sudo`.

Als root ohne systemd-Benutzersitzung ausgeführt (eine `sudo su`-Shell), installiert der Installer den Systemdienst von selbst.

### Mit dem provider-Dienst

```bash
sudo "$(command -v provider)" service install --system --as="$USER"
```

Der vollständige Pfad steht dort, weil `sudo` nicht in `~/.local/bin` sucht. Das installiert `urnetwork-provider.service` als Systemdienst, der den Miner als dieser Benutzer betreibt, mit dessen Binary und dessen `~/.urnetwork`. Zuerst stoppt und entfernt er den eigenen `provider service` dieses Benutzers, damit nie zwei Miner mit einer Identität laufen.

Updates werden weiterhin automatisch installiert und laufen als dieser Benutzer, und eine kleine path-Unit, die root gehört, startet den Dienst nach jedem Update neu. `provider service status` zeigt den Dienst. So entfernst du ihn:

```bash
sudo "$(command -v provider)" service uninstall --system
```

Ein einfaches `sudo provider service install --system` ohne `--as` ist unverändert: Es betreibt den Miner als root, mit seinem Zustand in `/var/lib/urnetwork`.

### Was die Unit gewährt

Die Unit des Installers für einen Benutzer namens `alice`:

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

Die Unit von `provider service` hat dieselbe `User=`-Zeile und dieselben drei Capability-Zeilen, mit `ExecStart=<path>/provider start` und `Environment=URNETWORK_STATE_DIR=/home/<user>/.urnetwork`.

Drei Zeilen machen die ganze Gewährung aus:

- `AmbientCapabilities=CAP_NET_BIND_SERVICE` gibt dem Miner dieses eine Privileg.
- `CapabilityBoundingSet=CAP_NET_BIND_SERVICE` verhindert, dass er je ein anderes hält.
- `NoNewPrivileges=yes` verhindert, dass er und alles, was er startet, Privilegien erlangen, zum Beispiel über ein setuid-Programm.

Der Kompromiss: Solange der Dienst läuft, kann das Programm, das er startet, auf Ports unter 1024 lauschen. Das Binary liegt in deinem Ordner, also kann jeder, der es ersetzen kann (du oder ein Programm, das unter deinem Benutzer läuft), unter dieser Unit Code ausführen, der auf niedrigen Ports lauscht. Dieser Code erlangt kein anderes Privileg: Er läuft nicht als root, `NoNewPrivileges` ist an, und die Begrenzungsmenge enthält nur diese eine Capability. Ist das auf einem gemeinsam genutzten Computer nicht akzeptabel, verwende `--system` nicht. Der Miner mint auch ohne seinen Extender.

Andere Wege, den Port zu gewähren, und warum der Miner sie nicht nutzt:

- `setcap` auf dem Binary: Datei-Capabilities gehen jedes Mal verloren, wenn ein Update das Binary ersetzt.
- Ein setuid-Binary: weit mehr Privileg, als ein einzelner Port braucht.
- `net.ipv4.ip_unprivileged_port_start`: Es ändert die Regel für jedes Programm und jeden Benutzer auf dem Computer.

Zurück zu einem Benutzerdienst: Mit dem Installer führe `urnet-tools uninstall` aus und installiere dann erneut ohne `--system` (deine Identität in `~/.urnetwork` bleibt erhalten). Mit `provider service` führe `sudo "$(command -v provider)" service uninstall --system` aus, dann `provider service install`.

## Prüfen

```bash
provider status
provider doctor
```

`provider status` hat eine Zeile **Extender**. `provider doctor` hat eine Zeile **Inbound 443**: ob der Miner TCP-Port 443 hält, und das Ergebnis seiner letzten Aktivierung.

Im Log (`provider service logs --follow` oder `urnet-tools logs`) sagt der `extender`-Eintrag in `reason`, was nicht stimmt, und in `guidance`, wie man es behebt:

| `reason` | Was es bedeutet | Was zu tun ist |
| --- | --- | --- |
| `tcp_443_permission_denied` | Der Miner darf nicht auf Port 443 lauschen. | [Den Miner auf Port 443 lauschen lassen](#linux-let-the-miner-listen-on-port-443). |
| `tcp_443_in_use` | Ein anderes Programm hält TCP-Port 443: ein anderer Miner-Prozess oder ein Webserver. | Nur ein Programm pro Computer kann ihn haben. Der Miner übernimmt den Port innerhalb von 3 Minuten, nachdem er frei geworden ist. |
| `tcp_443_bind_failed` | Das Lauschen auf Port 443 ist aus einem anderen Grund fehlgeschlagen. | Lies die Log-Zeilen darum herum. |
| `unreachable_on_tcp_443` | Der Miner lauscht, aber der Test des Betreibers konnte ihn aus dem Internet nicht erreichen. | [Öffne die Ports](#open-the-ports) und starte den Miner dann neu. |

Ein Extender, den das Internet nicht erreicht, versucht einmal am Tag erneut, sich zu aktivieren. Nachdem du die Ports geöffnet hast, starte den Miner neu, um es sofort zu versuchen: `provider service restart` oder mit einem Installer `urnet-tools restart`.
