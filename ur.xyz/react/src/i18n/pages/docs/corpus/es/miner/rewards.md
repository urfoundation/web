---
published: 2026-10-21
description: Cobra por minar en UR. Configura la wallet de pago de tu minero, entiende cómo se cuentan las recompensas del pool por época y reclámalas a tu coldkey.
---

# Cobrar por minar

Tu minero gana por el tráfico que transporta. Esta página cubre las tres partes de cobrar: decirle al operador a qué wallet de Bittensor pagar ([configura tu wallet de pago](#set-your-payout-wallet)), [cómo se cuentan las recompensas](#how-rewards-are-counted) y [cómo reclamarlas](#claim-your-rewards).

Si usaste un instalador, escribe `urnetwork` donde esta página diga `provider`.

## Configurar tu wallet de pago

Las recompensas van a una **coldkey** de Bittensor: una dirección ss58 que empieza por `5`. Demuestras que la coldkey es tuya firmando con ella una declaración corta. El operador guarda esa declaración firmada para este dispositivo, así que no basta con una dirección de wallet guardada en el perfil de tu cuenta.

La forma más sencilla es el paso de pago de [`provider setup`](/docs/miner#2-run-setup): imprime el mensaje, lo firmas en tu app de wallet y pegas la firma. Puedes volver a ejecutar `provider setup` más adelante solo para este paso; si usaste un instalador, ejecuta `urnetwork setup --no-service`. Los comandos de abajo hacen lo mismo a mano.

Configura la wallet **después** del primer inicio del dispositivo (`provider setup`, o el primer `provider start`), porque la declaración nombra el dispositivo que ese inicio registra. Antes de eso, `wallet challenge` y `wallet set` fallan con `claim/wallet credential not ready at …/.provider.jwt`.

### Firmar en tu app de wallet (recomendado)

Así el secreto de tu coldkey se queda fuera del minero. Primero, pide la declaración:

```bash
provider wallet challenge '<coldkey_ss58>'
```

Firma la declaración impresa, exactamente como aparece, con esa coldkey en una wallet que pueda firmar mensajes en bruto con sr25519, por ejemplo [polkadot.js Apps](https://polkadot.js.org/apps/#/signing) (Developer → Sign and verify) con tu cuenta de la extensión Polkadot.js. Luego ejecuta, con tu firma, el comando `provider wallet set` que imprimió el challenge. (Si usaste un instalador, cambia `provider` al principio por `urnetwork`.) Tiene este aspecto:

```bash
provider wallet set '<coldkey_ss58>' \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

Lo que debe cumplir la firma:

- Sobre la declaración exacta tal como se imprimió, como texto UTF-8 con finales de línea LF y sin salto de línea adicional al final, firmada con sr25519 en el contexto de firma `substrate`. En `--message`, un `\n` literal representa un salto de línea.
- También se acepta un `signRaw` de tipo `bytes` de la extensión de Polkadot, que envuelve la declaración en `<Bytes>...</Bytes>`.
- Envíala dentro del plazo que imprime el challenge, normalmente cinco minutos.

El comando impreso conserva el operador y el dispositivo que estás usando, así que cópialo en lugar de escribir el tuyo.

### Firmar con un archivo de seed en el minero

Si guardas a propósito la seed de la coldkey en la computadora del minero, el minero puede obtener y firmar la declaración por sí mismo:

```bash
provider wallet set '<coldkey_ss58>' \
  --coldkey_seed_file=/absolute/private/coldkey.seed
```

El archivo debe existir ya, pertenecerte, ser privado (por ejemplo con modo `0600`) y no tener enlaces simbólicos en su ruta. Contiene el mini secreto sr25519 en bruto de 32 bytes, o lo mismo como 64 caracteres hexadecimales con un `0x` opcional. No es una frase mnemónica. El comando rechaza una seed que no corresponda a la dirección, y la seed nunca sale de tu computadora.

También puedes configurar la wallet al iniciar el minero: `provider provide --wallet='<coldkey_ss58>' --coldkey_seed_file=/absolute/private/coldkey.seed`. Si eso falla, el minero registra el fallo y sigue funcionando, así que revisa el registro antes de confiar en ello.

### Cuándo empieza a ganar la wallet

Las recompensas se cuentan por **épocas**. Una nueva configuración de wallet empieza en la **siguiente** época y dura 65.536 épocas, así que configúrala antes de la época en la que quieras ganar y renuévala antes de que caduque. Nunca cambia adónde van las recompensas anteriores. Para elegir en cambio un rango exacto, pasa tanto `--wallet-from-epoch=<epoch>` como `--wallet-through-epoch=<epoch>` a `wallet challenge` y `wallet set`; el operador sigue decidiendo la época más temprana que acepta.

El minero guarda cada declaración firmada en `.provider.jwt.wallet-consent/history.json` dentro de `~/.urnetwork`. Guárdalo con tu [copia de seguridad](/docs/miner/run#back-up-your-miner). Si el envío de una declaración se interrumpe, volver a ejecutar el mismo comando envía la misma declaración firmada, aunque la seed ya no esté en la computadora.

Cada dispositivo que deba ganar necesita su propia wallet firmada; varios dispositivos pueden usar la misma coldkey. Para salidas adicionales en un mismo host, selecciona cada una con `--provider-jwt`: consulta [Varias salidas en un mismo host](/docs/miner/advanced#several-exits-on-one-host). Para firmar una sola vez para todos los operadores de la lista, consulta [Firmar una vez para todos los operadores de la lista](/docs/miner/advanced#sign-once-for-every-listed-operator).

## Cómo se cuentan las recompensas

Las recompensas del pool dependen del tráfico que tu minero completó y de lo confiable que resultó al medirlo. El operador anota el trabajo completado a nombre de tu dispositivo y paga a la wallet firmada para esa época. **El tráfico de pago y el gratuito del mismo tamaño ganan el mismo crédito.** Los saldos de cuenta, las reservas, los pagos de suscripciones y los contratos sin terminar no son prueba de trabajo.

La parte de cada dispositivo en el pool es proporcional a:

```text
completed usage bytes × reliability
reliability = confirmations / max(assignments, reliability_a_min)
```

Para cobrar por una época, un dispositivo necesita un uso completado mayor que cero, al menos el número requerido de comprobaciones de verificación, al menos una confirmación, una wallet firmada para esa época y ninguna vinculación activa al nivel superior. Los dispositivos que pagan a la misma coldkey se suman en un solo pago. Desde la época de cambio de la liquidación v2, el pool se reparte solo por uso completado, sin factor de confiabilidad ni mínimo, en una cuenta por cada coldkey de pago que nunca caduca (consulta el [litepaper](/docs/litepaper)).

Los validadores miden la calidad del enrutamiento por su cuenta y ponderan los pools de los operadores y las flotas del nivel superior. A los mineros se les paga **momentum**: la parte de la emisión de la subred para mineros que se usa ahora para impulsar la red, repartida entre el nivel de pools y el nivel superior según una política. El momentum es del 10 %; la política publicada por tu operador indica el valor actual. La [Network Capacity Reserve](/reserve), la cuenta `ur-reserve`, recibe el resto: emisión de los mineros × (1 − momentum). Su parte no es fija; se reduce a medida que crece el momentum. El momentum es una parte de la emisión, no un precio fijo por byte; la política publicada por tu operador y los archivos de pago muestran las ganancias reales. La reserva es independiente de la garantía de reclamaciones de la bóveda de liquidación.

Una época de liquidación la fijan los contratos desplegados y la política. En mainnet son 50.400 bloques, unos siete días a 12 segundos por bloque. Cuando una época se cierra, su raíz de pagos se registra y se finaliza antes de que se abran las reclamaciones, así que el trabajo reciente no se puede reclamar de inmediato. El `claim_open_block` que imprime el comando de reclamación, y las ventanas de despliegue publicadas por tu operador, te dicen cuándo.

## Reclamar tus recompensas

Una reclamación obtiene tu prueba del operador, la comprueba y la envía a la bóveda de liquidación, que paga a tu coldkey. Necesitarás los datos de despliegue publicados por tu operador: su endpoint EVM RPC, la dirección de la bóveda de liquidación y el ID de cadena (964 en mainnet). Iniciar sesión y minar no significan por sí solos que las recompensas de la subred de un operador estén activas; lo dice su despliegue publicado.

### 1. Comprobar la reclamación

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>'
```

Usa el endpoint EVM RPC de tu operador; puedes repetir `--rpc` para tener respaldos, que se prueban en orden. El minero comprueba la prueba y la raíz de pagos e imprime `epoch`, `no_id`, `coldkey`, `share_bps`, las raíces de pagos, el `contract` de la bóveda, el `claim_open_block` y los datos de la reclamación. Comprueba la coldkey, el contrato y el ID de cadena con el despliegue publicado por tu operador. Si la prueba o la raíz no coinciden, el comando sale con un error: resuelve la discrepancia con tu operador antes de enviar.

Sin `--epoch`, el minero elige la época anterior a la actual. Esa época puede estar todavía esperando a que su raíz se finalice, así que puede que la reclamación aún no esté abierta. Indica explícitamente las épocas anteriores sin reclamar.

### 2. Enviarla

El envío necesita una clave de **relayer** de EVM: una clave secp256k1 aparte con un poco de TAO para el gas en la red Subtensor EVM. Solo paga la comisión; la recompensa sigue yendo a la coldkey de la prueba. Pon su clave hexadecimal de 32 bytes en un archivo privado y pruébala sin enviar nada:

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key --dry-run
```

Luego envíala:

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key
```

`--key_file` necesita `--rpc`. Cualquier relayer con fondos puede enviar tu prueba: no puede cambiar la coldkey ni recibir la recompensa. La recompensa llega como stake nativo de α en tu coldkey. No hace falta la seed de la coldkey para reclamar.

### 3. Leer el resultado

| Evento | Significado |
| --- | --- |
| `Claimed` | La bóveda aceptó la reclamación y abonó el crédito a tu coldkey. Por sí solo, esto no prueba una transferencia. |
| `ClaimPaid` | El crédito se transfirió a tu coldkey. |
| `ClaimPaymentDeferred` | El crédito se queda de momento en la bóveda, por ejemplo porque está por debajo del mínimo de transferencia, el precio no está disponible o la transferencia falló. |

El crédito aplazado no caduca. Una reclamación posterior paga el crédito acumulado en cuanto el pago es posible, y cualquiera puede reintentarlo con el método `withdrawClaimCredit(bytes32 coldkey)` de la bóveda; `snclaim withdraw --vault=v1` (con `--coldkey`, `--contract`, `--rpc` y `--key_file`) lo llama. Volver a enviar una reclamación ya aceptada no es un retiro y falla como ya reclamada.

Reclama antes de que caduque el derecho. En mainnet son ocho épocas más una época de gracia; después, las recompensas sin reclamar pueden volver al pool del mismo operador. La caducidad no elimina el crédito ya aceptado. Desde la época de cambio de la liquidación v2, las cuentas nunca caducan.

Para reclamar automáticamente, o enviar desde una computadora distinta del minero, consulta [Avanzado](/docs/miner/advanced#claim-automatically).
