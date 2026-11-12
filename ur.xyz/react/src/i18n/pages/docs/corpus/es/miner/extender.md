---
published: 2026-11-11
description: El extensor del minero de UR: puertos que abrir, cortafuegos, grupos de seguridad en la nube, reenvío de puertos, el privilegio de Linux para el puerto 443 y cómo comprobarlo.
---

# Ejecutar un extensor

Un extensor es un relé que permite a la gente llegar a la red desde lugares donde los servidores del propio operador están bloqueados. Cada minero ejecuta uno junto a su salida, activado de forma predeterminada. Solo funciona cuando internet puede alcanzar tu computadora en el puerto TCP 443. Si usaste un instalador, escribe `urnetwork` donde esta página diga `provider`.

Un extensor es una de las partes de cada contrato que pasa por él, así que gana una parte de cada contrato que transporta.

## Los puertos

Abre estos puertos para las conexiones entrantes desde cualquier dirección, en IPv4 y en IPv6:

| Puerto | Protocolo | Necesidad | Para qué sirve |
| --- | --- | --- | --- |
| 443 | TCP | Obligatorio | El canal principal del extensor. Sin él, el extensor se queda desactivado y el minero vuelve a intentar el puerto cada 3 minutos. |
| 443 | UDP | Recomendado | El canal QUIC. |
| 4053 | UDP | Recomendado | El canal DNS. |
| 53 | UDP | Opcional | DNS en su puerto estándar. Si el minero no puede escuchar en él, solo pierde ese puerto. |

El operador prueba el puerto TCP 443 desde internet antes de incluir tu extensor en la lista. Los puertos UDP dan a los clientes más formas de llegar a él.

Solo un programa de una computadora puede escuchar en el puerto TCP 443. Cuando varios procesos del minero se ejecutan en un mismo host, por ejemplo con `--all-operators`, el primero que toma el puerto sirve el extensor para el host, y otro toma el relevo en los 3 minutos siguientes a que se detenga. Un servidor web o cualquier otro programa en el puerto 443 mantiene el extensor desactivado.

## Abrir los puertos

Puede haber tres cortafuegos entre internet y el minero: el de la propia computadora, el del proveedor de la nube y un router doméstico. Cada uno tiene que dejar pasar los puertos.

### El cortafuegos de la computadora

Con ufw (Ubuntu, Debian):

```bash
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 4053/udp
```

Con firewalld (Fedora, RHEL, Rocky, AlmaLinux):

```bash
sudo firewall-cmd --permanent --add-port=443/tcp --add-port=443/udp --add-port=4053/udp
sudo firewall-cmd --reload
```

Con reglas propias de nftables o iptables, añade reglas de aceptación para los puertos a la cadena input, antes de cualquier regla que descarte o rechace, y guárdalas para que sobrevivan a un reinicio.

Las imágenes de Ubuntu de Oracle Cloud vienen con reglas de iptables que rechazan todo excepto SSH. Inserta las reglas de aceptación por encima de la regla de rechazo y luego guárdalas:

```bash
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 4053 -j ACCEPT
sudo netfilter-persistent save
```

Para IPv6, ejecuta las mismas reglas con `ip6tables`.

En macOS y Windows, si el cortafuegos está activado, permite las conexiones entrantes para el minero (`provider`, o `urnetwork` si viene de un instalador) cuando lo pida.

### Cortafuegos en la nube y grupos de seguridad

Un servidor en la nube suele tener también un cortafuegos delante. Permite el tráfico entrante TCP 443, UDP 443 y UDP 4053 desde `0.0.0.0/0` y `::/0`:

- **AWS:** el grupo de seguridad de la instancia (reglas de entrada), y la ACL de red de la subred si la cambiaste.
- **Google Cloud:** una regla de cortafuegos de VPC para el tráfico entrante que se aplique a la instancia.
- **Azure:** el grupo de seguridad de red en la interfaz de red de la VM o en su subred.
- **Oracle Cloud:** la lista de seguridad de la VCN o el grupo de seguridad de red, además de las reglas de iptables de arriba.
- **Hetzner Cloud:** el Cloud Firewall, si hay uno conectado al servidor.
- **DigitalOcean:** el Cloud Firewall, si hay uno conectado al Droplet.

### Routers domésticos

En casa, el router bloquea las conexiones entrantes. En su configuración (a menudo llamada reenvío de puertos, servidores virtuales o NAT), reenvía TCP 443, UDP 443 y UDP 4053 a la computadora que ejecuta el minero. Asigna a esa computadora una dirección fija en tu red (una reserva DHCP), para que el reenvío siga apuntando a ella. Solo una computadora detrás de una dirección IPv4 pública puede tener el puerto 443.

Algunas conexiones no se pueden reenviar. Si la dirección de internet (WAN) del router está entre `100.64.0.0` y `100.127.255.255`, o no es la dirección que ven los sitios web, tu proveedor de internet te tiene detrás de un NAT de operador (CGNAT). Pide a tu proveedor una dirección IPv4 pública, o usa IPv6.

Muchos routers dan a cada dispositivo una dirección IPv6 pública, pero bloquean las conexiones IPv6 entrantes. Permite el tráfico entrante TCP 443, UDP 443 y UDP 4053 hacia esta computadora en el cortafuegos IPv6 del router.

### Docker

Un minero en un contenedor necesita publicar sus puertos:

```bash
docker run -p 443:443/tcp -p 443:443/udp -p 4053:4053/udp …
```

Los cortafuegos de arriba siguen aplicándose al host.

## Linux: permitir que el minero escuche en el puerto 443

Linux solo permite a los programas con privilegios escuchar en los puertos por debajo de 1024. El instalador y `provider service install` ejecutan el minero con tu usuario, así que su extensor no puede escuchar en el puerto TCP 443 y se queda desactivado. El registro dice entonces `tcp_443_permission_denied`. Un minero que ya se ejecuta como root, como uno instalado con `sudo provider service install --system`, o como root dentro de un contenedor, sí puede. macOS y Windows permiten a cualquier programa escuchar en el puerto 443, así que allí no hay nada que conceder.

La solución es un servicio del sistema que ejecute el minero con tu usuario, con un privilegio adicional: `CAP_NET_BIND_SERVICE`, que permite a un programa escuchar en los puertos por debajo de 1024.

### Con el instalador de Linux

Vuelve a ejecutar el instalador con `--system`, con el usuario que mina (no con `sudo`). Te pedirá tu contraseña de `sudo` una vez:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh -s -- --system
```

Una instalación existente también puede cambiar con `urnet-tools reinstall --system`.

Instala `/etc/systemd/system/urnetwork.service`, que ejecuta el minero con tu usuario, detiene y elimina tu propio `urnetwork.service` y conserva tu temporizador de actualizaciones. A partir de entonces, `urnet-tools start`, `stop`, `restart`, `status`, `logs` y `uninstall` actúan sobre el servicio del sistema, y `start`, `stop` y `uninstall` piden `sudo`.

Si se ejecuta como root sin sesión de usuario de systemd (una shell `sudo su`), el instalador instala el servicio del sistema por sí solo.

### Con el servicio de provider

```bash
sudo "$(command -v provider)" service install --system --as="$USER"
```

La ruta completa está ahí porque `sudo` no busca en `~/.local/bin`. Esto instala `urnetwork-provider.service` como un servicio del sistema que ejecuta el minero con ese usuario, con su binario y su `~/.urnetwork`. Primero detiene y elimina el `provider service` propio de ese usuario, para que nunca se ejecuten dos mineros con una misma identidad.

Las actualizaciones se siguen instalando automáticamente y se ejecutan con ese usuario, y una pequeña unidad path propiedad de root reinicia el servicio tras cada actualización. `provider service status` muestra el servicio. Para eliminarlo:

```bash
sudo "$(command -v provider)" service uninstall --system
```

Un `sudo provider service install --system` simple, sin `--as`, no cambia: ejecuta el minero como root, con su estado en `/var/lib/urnetwork`.

### Qué concede la unidad

La unidad del instalador, para un usuario llamado `alice`:

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

La unidad de `provider service` tiene la misma línea `User=` y las mismas tres líneas de capacidades, con `ExecStart=<path>/provider start` y `Environment=URNETWORK_STATE_DIR=/home/<user>/.urnetwork`.

Tres líneas componen toda la concesión:

- `AmbientCapabilities=CAP_NET_BIND_SERVICE` da al minero ese único privilegio.
- `CapabilityBoundingSet=CAP_NET_BIND_SERVICE` impide que llegue a tener ningún otro.
- `NoNewPrivileges=yes` impide que él, y cualquier cosa que inicie, obtenga privilegios, por ejemplo a través de un programa setuid.

La contrapartida: mientras el servicio se ejecuta, el programa que inicia puede escuchar en los puertos por debajo de 1024. El binario está en tu carpeta, así que cualquiera que pueda reemplazarlo (tú, o un programa que se ejecute con tu usuario) puede ejecutar código que escuche en puertos bajos bajo esta unidad. Ese código no obtiene ningún otro privilegio: no se ejecuta como root, `NoNewPrivileges` está activado y el conjunto delimitador solo contiene esa capacidad. Si eso no es aceptable en una computadora compartida, no uses `--system`. El minero sigue minando sin su extensor.

Otras formas de conceder el puerto, y por qué el minero no las usa:

- `setcap` sobre el binario: las capacidades de archivo se pierden cada vez que una actualización reemplaza el binario.
- Un binario setuid: muchísimo más privilegio del que necesita un puerto.
- `net.ipv4.ip_unprivileged_port_start`: cambia la regla para todos los programas y todos los usuarios de la computadora.

Para volver a un servicio de usuario: con el instalador, ejecuta `urnet-tools uninstall` y luego vuelve a instalar sin `--system` (tu identidad en `~/.urnetwork` se conserva). Con `provider service`, ejecuta `sudo "$(command -v provider)" service uninstall --system` y luego `provider service install`.

## Comprobarlo

```bash
provider status
provider doctor
```

`provider status` tiene una línea **Extender**. `provider doctor` tiene una línea **Inbound 443**: si el minero tiene el puerto TCP 443 y el resultado de su última activación.

En el registro (`provider service logs --follow`, o `urnet-tools logs`), la entrada `extender` dice qué falla en `reason`, y cómo arreglarlo en `guidance`:

| `reason` | Qué significa | Qué hacer |
| --- | --- | --- |
| `tcp_443_permission_denied` | El minero no tiene permiso para escuchar en el puerto 443. | [Permitir que el minero escuche en el puerto 443](#linux-let-the-miner-listen-on-port-443). |
| `tcp_443_in_use` | Otro programa tiene el puerto TCP 443: otro proceso del minero, o un servidor web. | Solo un programa por computadora puede tenerlo. El minero toma el puerto en los 3 minutos siguientes a que quede libre. |
| `tcp_443_bind_failed` | La escucha en el puerto 443 falló por otro motivo. | Lee las líneas del registro que hay alrededor. |
| `unreachable_on_tcp_443` | El minero escucha, pero la prueba del operador no pudo alcanzarlo desde internet. | [Abre los puertos](#open-the-ports) y luego reinicia el minero. |

Un extensor que internet no puede alcanzar vuelve a intentar activarse una vez al día. Después de abrir los puertos, reinicia el minero para intentarlo de inmediato: `provider service restart`, o `urnet-tools restart` con un instalador.
