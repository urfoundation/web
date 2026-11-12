---
published: 2026-10-21
description: Actualizaciones del minero de UR: cómo lo actualizan los instaladores y su servicio, y cómo comprobar, cambiar o desactivar las actualizaciones o fijar una versión.
---

# Mantener el minero actualizado

Las nuevas versiones del minero corrigen problemas y mantienen tu minero compatible con la red, así que lo mejor es usar la más reciente. Si usaste un [instalador](/docs/miner/install#the-installers), o dejaste que `provider setup` instalara el servicio en segundo plano, no tienes que hacer nada: el minero se actualiza automáticamente.

## Actualizaciones automáticas (instaladores)

Todos los instaladores activan las actualizaciones automáticas, salvo en Linux sin sesión de usuario de systemd y en Windows cuando instalas una versión concreta con `-Tag`. De forma predeterminada buscan una versión más reciente en la [página de versiones de build](https://github.com/urnetwork/build/releases) aproximadamente cada 6 horas. Cuando la hay, la descargan, la verifican con el SHA-256 que GitHub publica para ella (una versión sin él no se instala), comprueban que el programa nuevo funciona y lo sustituyen. Un minero que estaba en ejecución se reinicia con la versión nueva; uno que detuviste sigue detenido. Si algo falla, la versión antigua sigue funcionando. Tu identidad en `~/.urnetwork` no se toca, y se conservan tus ajustes de actualización e inicio.

Cómo mantiene cada sistema el calendario:

- **Linux:** un temporizador de systemd, cada 6 horas más un retraso aleatorio de hasta una hora.
- **macOS:** un agente de launchd que comprueba cuatro veces al día a horas elegidas una vez para cada Mac, y otra vez cuando inicias sesión, así que un Mac que estaba en reposo o apagado se pone al día.
- **Windows:** un actualizador que se inicia oculto cuando inicias sesión, se activa cada hora y comprueba en cuanto ha pasado el intervalo, así que el reposo y los reinicios no se saltan ninguna comprobación.

Una actualización también pone al día el propio `urnet-tools`. En Linux nunca te lleva a una versión anterior.

Para ver qué versión tienes y si ha salido una más reciente, o para actualizar de inmediato:

```bash
urnet-tools version
urnet-tools update
```

### Cambiar o desactivar las actualizaciones automáticas

Las actualizaciones automáticas están activadas de forma predeterminada, y recomendamos dejarlas así. Para ver si están activadas y con qué frecuencia comprueban:

```bash
urnet-tools auto-update
```

Para comprobar con menos frecuencia, elige `6h` (el valor predeterminado), `daily`, `weekly` o `monthly`. Esto deja las actualizaciones activadas o desactivadas tal como estén:

```bash
urnet-tools auto-update --interval daily
```

Para desactivarlas, y volver a activarlas:

```bash
urnet-tools auto-update off
urnet-tools auto-update on
```

Con las actualizaciones automáticas desactivadas, ejecuta `urnet-tools update` tú mismo de vez en cuando. Tu elección se conserva cuando actualizas o vuelves a ejecutar el instalador. Para instalar con las actualizaciones desactivadas desde el principio, pasa `--no-auto-update` al instalador de macOS, o `-NoAutoUpdate` al de Windows. En Linux, ejecuta `urnet-tools auto-update off` justo después de instalar.

### Quedarte en una versión

Para instalar una versión concreta, indica su etiqueta de la página de versiones:

```bash
urnet-tools reinstall -t <version>
```

Luego desactiva las actualizaciones automáticas con `urnet-tools auto-update off`, o la próxima comprobación te volverá a llevar a la versión más reciente.

## Actualizaciones automáticas (servicio de provider)

> **Estas actualizaciones no han instalado ninguna versión desde la 2026.10.22.** Cuando salga la primera versión posterior al 11 de noviembre de 2026, actualiza a mano una vez, como explica el aviso al principio de [Cómo ejecutar un minero](/docs/miner). A partir de entonces funcionan como se describe aquí.

El [servicio en segundo plano](/docs/miner/run#with-provider-service) que configura `provider setup` o `provider service install` también mantiene el minero actualizado. Comprueba la [página de versiones de build](https://github.com/urnetwork/build/releases) cada 6 horas: en Linux a partir de 15 minutos después de que arranque el ordenador, más un retraso aleatorio de hasta una hora; en macOS desde que inicias sesión; en Windows a partir de 15 minutos después de que inicies sesión, más un retraso aleatorio de hasta una hora. Tras una versión, cada minero espera su propia fracción aleatoria de 16 horas, de modo que todos la tienen en un día sin que se reinicien todos a la vez.

Una actualización verifica la descarga con el SHA-256 que GitHub publica para ella (eso detecta una descarga dañada), conserva el programa anterior junto al nuevo y reinicia el servicio. Si la versión nueva no vuelve a funcionar en 10 minutos (y conectada de nuevo, si antes estaba conectada), se restaura la anterior y esa versión se omite durante una semana. Tu identidad en `~/.urnetwork` no se toca.

```bash
provider update --check    # is a newer release out?
provider update            # update now
provider update --status   # automatic update settings and the last check
```

El usuario del servicio debe poder escribir en la carpeta del programa; `provider doctor` lo comprueba. Un minero configurado por un instalador se sigue actualizando mediante `urnet-tools`, y `provider update` lo ejecuta por ti.

### Desactivar las actualizaciones propias del minero

Las actualizaciones automáticas están activadas de forma predeterminada, y recomendamos dejarlas así. Para desactivarlas, y volver a activarlas:

```bash
provider update --off
provider update --on
```

También puedes instalar el servicio con las actualizaciones desactivadas: `URNETWORK_AUTO_UPDATE=0 provider service install`. Eso no afecta a un minero configurado por un instalador; allí usa `urnet-tools auto-update off`. Con las actualizaciones desactivadas, ejecuta `provider update` tú mismo de vez en cuando.

## Sin actualizaciones automáticas

Una [compilación desde el código fuente](/docs/miner/install#build-from-source) nunca se actualiza sola: vuelve a compilarla. Un minero que ejecutas en una terminal, o bajo [un servicio propio](/docs/miner/run#a-service-of-your-own), se actualiza con `provider update`; luego reinícialo.

Sigue la [página de versiones](https://github.com/urnetwork/build/releases) para ver las nuevas versiones; GitHub puede avisarte de cada una. `provider --version` imprime la versión que tienes.
