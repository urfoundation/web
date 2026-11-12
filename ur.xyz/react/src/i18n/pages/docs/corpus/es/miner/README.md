---
description: Empieza a minar en UR en pocos pasos. Qué hace un minero, qué necesitas, un inicio rápido y dónde está cada parte de la guía del minero.
---

# Cómo ejecutar un minero

> **Si `provider setup` o `provider service install` configuraron el servicio en segundo plano de tu minero, actualízalo a mano una vez.** Desde la versión 2026.10.22, estos mineros no se han actualizado solos, ni en Linux, ni en macOS, ni en Windows. El actualizador del minero aceptaba versiones escritas como `2026.10.27-1083160450`, pero las versiones publicadas llevan el sello `2026.10.27+1083160450`, así que cada versión se tomaba a sí misma por una compilación de desarrollo:
>
> - `provider status` dice «development build, never updates itself».
> - `provider update`, y las actualizaciones automáticas, se niegan con «this is a development build … which never replaces itself with a release».
> - Nunca llegó a ejecutarse la comprobación de 10 minutos que revierte una versión nueva que no vuelve conectada.
>
> La corrección está en la primera versión posterior al 11 de noviembre de 2026, y tu minero no puede instalarla por sí solo. Cuando salga esa versión, descárgala y descomprímela como en [Descarga manual](/docs/miner/install#manual-download) y, en lugar de instalarla, ejecuta su actualización: `./linux/amd64/provider update` con tu carpeta de la tabla (con `sudo` delante para un servicio del sistema), o en Windows `& "$env:TEMP\windows\$Arch\provider.exe" update`. Escribir solo `provider update` ejecuta el minero que tienes, que sigue negándose. La actualización reemplaza el minero que ejecuta tu servicio y lo reinicia.
>
> Después de eso, las actualizaciones vuelven a ser automáticas: repartidas a lo largo de unas 16 horas tras cada versión, con la comprobación de conexión de 10 minutos, una reversión y una omisión de 7 días de la versión que no la supere. `provider status` muestra entonces que las actualizaciones son automáticas, o que estás al día.
>
> Si ejecutas el minero tú mismo, sin ese servicio, `provider update` también se niega: instala la nueva versión como en [Descarga manual](/docs/miner/install#manual-download) y reinicia el minero.
>
> No están afectados: la imagen de Docker, las apps y los mineros configurados por un instalador, que se actualizan mediante `urnet-tools`.

Un minero de UR comparte tu conexión a internet como salida para un operador de red. Los validadores comprueban que realmente transporta tráfico, y Bittensor SN25 (netuid 25) paga recompensas por ese trabajo en el token α de la subred, con la marca $UR.

¿Prefieres una app? Las apps de URnetwork son una alternativa fácil para minar desde un teléfono o una computadora: instala una desde [ur.io](https://ur.io) y minará en segundo plano, con URnetwork como operador. Esta guía es para el programa minero, que funciona en Linux, macOS y Windows y puede minar para cualquier operador.

Esta página te lleva de cero a un minero en funcionamiento. El resto de la guía del minero profundiza, un tema por página:

| Página | Qué cubre |
| --- | --- |
| [Instalar](/docs/miner/install) | Los instaladores para Linux, macOS y Windows, una descarga manual y la compilación desde el código fuente. |
| [Ejecutar y supervisar](/docs/miner/run) | Iniciar y detener, ejecutar en segundo plano, los registros y la página de estado, las copias de seguridad. |
| [Ejecutar un extensor](/docs/miner/extender) | Los puertos que hay que abrir para el extensor del minero, los cortafuegos y el reenvío de puertos, y cómo permitirle escuchar en el puerto 443 en Linux. |
| [Actualizaciones](/docs/miner/updates) | Cómo se mantiene actualizado el minero y cómo controlarlo. |
| [Cobrar](/docs/miner/rewards) | Configurar tu wallet de pago, cómo se cuentan las recompensas y cómo reclamarlas. |
| [Solución de problemas](/docs/miner/troubleshooting) | Los errores habituales y qué hacer con cada uno. |
| [Avanzado](/docs/miner/advanced) | Minar para todos los operadores, varias salidas en un mismo host, reclamaciones automáticas y el nivel superior para flotas grandes. |
| [Referencia](/docs/miner/reference) | Todos los comandos de uso diario, los archivos que guarda el minero, las variables de entorno y un glosario. |

Para los otros roles, consulta [Ejecutar un validador](/docs/validator) y [Ejecutar un operador de red](/docs/operator).

## Cómo funciona

```text
your miner (provider)
  │ carries internet traffic for
  ↓
a network operator  ←─  validators
  │ pays its pool       measure it
  ↓ every epoch
your Bittensor coldkey (α, $UR)
```

La mayoría de los mineros se unen al **pool** de un operador. No necesitas tu propio registro en Bittensor: inicias sesión con el operador, tu minero se registra a sí mismo como dispositivo y las recompensas del pool se pagan a la wallet de Bittensor que elijas. Las flotas grandes pueden, en cambio, reclamar su propio UID de minero; consulta [el nivel superior](/docs/miner/advanced#claim-your-own-miner-uid-head-tier).

## Qué necesitas

- **Una computadora con Linux, macOS o Windows que permanezca en línea.** Sirven un PC doméstico, un servidor o una Raspberry Pi 2 o posterior. En Windows el minero funciona mientras tengas la sesión iniciada.
- **Una dirección pública de internet estable por minero.** Para ejecutar más de una salida desde un host, consulta [Varias salidas en un mismo host](/docs/miner/advanced#several-exits-on-one-host).
- **Puertos abiertos para el extensor.** El minero también ejecuta un extensor, que gana una parte de cada contrato que transporta. Necesita el puerto TCP 443 entrante; se recomiendan los puertos UDP 443 y 4053, y el UDP 53 es opcional. En Linux también necesita permiso para escuchar en el puerto 443. Consulta [Ejecutar un extensor](/docs/miner/extender).
- **Una cuenta con un operador de red.** El minero usa el operador predeterminado, `bringyour.com`, a menos que [elijas otro](/docs/miner/run#choose-an-operator). Obtendrás de tu cuenta un **código de autorización** (auth code) para iniciar la sesión del minero.
- **Una dirección de wallet de Bittensor (coldkey)** para tus recompensas. Es una dirección ss58 que empieza por `5`. Puedes firmar por ella en otro dispositivo; su secreto nunca tiene que estar en el minero.

## Inicio rápido

El programa del minero se llama `provider`. Instálalo, ejecuta `provider setup` y compruébalo con `provider status`.

### 1. Instalar

El instalador es la forma más sencilla. Coloca el minero en tu carpeta personal, lo ejecuta en segundo plano y lo mantiene actualizado automáticamente.

En **Linux**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Linux.sh | sh
```

En **macOS**:

```bash
curl -fsSL https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_macOS.sh | sh
```

En **Windows**, en PowerShell (no como administrador):

```powershell
irm https://raw.githubusercontent.com/urnetwork/connect/main/scripts/Provider_Install_Win32.ps1 | iex
```

Luego abre una terminal nueva. El instalador pide un código de autorización de tu cuenta de operador (para el operador predeterminado, de tu cuenta de URnetwork en [ur.io](https://ur.io)), registra este dispositivo y empieza a minar.

El instalador le da al comando el nombre `urnetwork`, no `provider`. Si lo usaste, escribe `urnetwork` donde esta guía diga `provider`, también en los comandos que el minero imprime para que los copies.

Para instalar sin instalador, consulta [Descarga manual](/docs/miner/install#manual-download).

### 2. Ejecutar setup

```bash
provider setup
```

Te guía por cuatro pasos, y puedes detenerlo y volver a ejecutarlo en cualquier momento; conserva los pasos que ya terminaste:

1. **Iniciar sesión.** Pega un código de autorización de tu cuenta de operador. La solicitud oculta lo que pegas.
2. **Registrar este dispositivo.** Un dispositivo nuevo obtiene su propia identidad de minero, guardada en `~/.urnetwork`.
3. **Dirección de pago.** La dirección de tu coldkey de Bittensor. Setup imprime un mensaje corto; fírmalo en tu app de wallet (Polkadot.js, Talisman o btcli) y pega la firma. Puedes presionar Enter para omitir este paso y [configurarla más tarde](/docs/miner/rewards#set-your-payout-wallet).
4. **Mantenerlo en marcha.** Inicia el minero en segundo plano ahora y de nuevo tras cada reinicio (en Windows, cada vez que inicias sesión), y lo mantiene actualizado.

Si usaste un instalador, ya inició tu sesión, registró este dispositivo y ejecuta el minero en segundo plano. Ejecuta `urnetwork setup --no-service` para añadir tu dirección de pago; `--no-service` evita que setup añada un segundo minero en segundo plano junto al del instalador.

### 3. Comprobarlo

```bash
provider status
```

Un minuto después de que el minero arranque, las líneas Miner, Signed in, Device y Connected deberían tener cada una un ✓. El comando sale con 0 cuando todo va bien, 3 cuando el dispositivo necesita configuración y 4 cuando el minero no está en ejecución o no está conectado, así que los scripts también pueden comprobarlo (`provider status --json` imprime los detalles).

Cuando algo no va bien, `status` imprime el siguiente comando que hay que ejecutar. `provider doctor` busca la causa: la carpeta de estado, el DNS, la conexión, un proxy que inspecciona TLS y el reloj. Consulta [Ejecutar y supervisar](/docs/miner/run) para los registros y para detener e iniciar.

### 4. Hacer una copia de seguridad de tu minero

Copia la carpeta `~/.urnetwork` en algún lugar privado. Contiene la identidad de este dispositivo y tu historial firmado de la wallet. Si la pierdes, el dispositivo no se puede recuperar, aunque todavía puedas iniciar sesión en tu cuenta. Consulta [Hacer una copia de seguridad de tu minero](/docs/miner/run#back-up-your-miner).

Eso es todo. Las recompensas se cuentan por época de liquidación, alrededor de una semana en mainnet, y se reclaman una vez cerrada la época: consulta [Cobrar](/docs/miner/rewards). Si algo no funcionó, consulta [Solución de problemas](/docs/miner/troubleshooting).

### Paso a paso en lugar de setup

`provider setup` ejecuta estos comandos por ti. Para hacerlo a mano:

```bash
provider login                    # paste the auth code when asked
provider start                    # the first start asks before registering this device
provider wallet challenge '<your coldkey ss58 address>'
provider service install          # in a second terminal, after Ctrl-C in the first
```

`provider wallet challenge` imprime un mensaje para firmar; luego ejecuta, con tu firma, el comando `provider wallet set` que imprime. [Cobrar](/docs/miner/rewards#set-your-payout-wallet) lo explica. `login`, `start` y `network` son los mismos comandos que `auth`, `provide` y `choose_network`.

## De dónde viene esta guía

Esta guía sigue la [implementación de `sn/miner`](https://github.com/urfoundation/sn/tree/main/miner) actual y su [punto de entrada `cli/miner`](https://github.com/urfoundation/sn/tree/main/cli/miner). Muchas de sus partes se pulen en conversaciones [en nuestro Discord](https://discord.gg/urnetwork), que es también el lugar para pedir ayuda.
