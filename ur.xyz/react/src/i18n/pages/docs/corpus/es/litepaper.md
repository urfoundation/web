---
title: "Litepaper de UR: red de privacidad coordinada en Bittensor"
description: "Cómo funciona UR, la red de privacidad descentralizada en Bittensor SN25: los mineros llevan tráfico cifrado, los validadores lo miden y los operadores traen la demanda."
---
# Una red de privacidad, coordinada en Bittensor

> Posee tu privacidad. Posee la red.

## I. Una red de privacidad descentralizada

UR es una red de privacidad descentralizada. Distribuye el tráfico de los usuarios por una red global de mineros independientes mediante enrutamiento multisalto y cifrado por capas, de modo que ningún minero ve a la vez quién es un usuario y qué está haciendo. El transporte está diseñado para parecerse al HTTPS común, con cifrado TLS de N capas, suplantación de SNI e indistinguibilidad del tráfico, para que la red siga siendo accesible casi en cualquier lugar.

La subred UR, Bittensor SN25 (netuid 25), coordina esta red mediante incentivos on-chain. Los operadores de red ejecutan los servidores; los mineros independientes transportan el tráfico de entrada y de salida; y los validadores independientes recorren continuamente cadenas de mineros asignadas por los operadores para demostrar el tránsito en tiempo real y medir qué mineros son los eslabones más débiles. Esa medición es la señal central por la que paga la red.

El Yuma Consensus de Bittensor convierte las mediciones de los validadores en emisión de tokens, y un contrato inteligente en la EVM de Subtensor liquida los pagos. El protocolo es de código abierto, y ejecutar un minero o un validador no requiere permiso de nadie.

## II. Roles

Los operadores de red ejecutan los servidores de privacidad y el endpoint de verificación. Un operador deposita en la subred, firma conjuntamente cada ruta medida y registra una lista de pagos que reparte sus recompensas entre los mineros conectados a él. Un operador informa del uso que siguen sus recompensas, pero nunca custodia fondos de nadie más.

Los mineros son la entrada y la salida de la red. Funcionan con un modelo de seguridad seguro por defecto, bloquean IPs maliciosas conocidas y solo enrutan tráfico cifrado. Un minero transporta tráfico para uno o más operadores y cobra por el tráfico que transporta y, en las flotas principales, por la capacidad enrutable que aporta.

Los validadores son independientes. Cada uno hace stake de sus propios UR, ejecuta el protocolo de verificación de enrutamiento y puntúa el pool de cada operador según la demanda y la calidad medida. Los validadores ganan los dividendos nativos de la red por una puntuación precisa y alineada con el consenso. Ningún operador es dueño de un validador, y cualquiera puede unirse al conjunto de validadores sin permiso.

El propietario de la subred gobierna los coordinadores actualizables de los contratos de liquidación, no las bóvedas inmutables que guardan las recompensas de los mineros, y opera la reserva de la red. Ese rol es transitorio: el control empieza centralizado pero acotado, y se descentraliza progresivamente, como se describe en la cláusula V.

## III. El token UR

UR es el token nativo de la subred, la unidad de cuenta para depósitos, emisión y liquidación. Es un token de utilidad para coordinar los recursos de la red y pagar por ellos; no está diseñado para representar ni otorgar ningún derecho a beneficios, ingresos o rendimientos.

La coinbase de Bittensor emite nuevos UR en cada ciclo, que se reparten de tres maneras:

| Flujo | Parte | Destinatarios |
| --- | ---: | --- |
| Propietario | 18 % | Propietario de la subred |
| Mineros | 41 % | Los proveedores reciben la parte de momentum, un 10 % en el lanzamiento, a través de los pools de los operadores y los slots de mineros de nivel superior; la Network Capacity Reserve recibe el resto |
| Validadores | 41 % | Validadores independientes, que reciben dividendos nativos por una puntuación precisa |

Los operadores financian la red depositando UR en proporción a su uso real, a una tarifa de referencia publicada. Un depósito es una señal de demanda real respaldada por ingresos: el contrato traslada cada depósito a la reserva de la subred. Los depósitos acumulados de un operador reducen la tarifa a la que debe depositar, de modo que los operadores comprometidos pueden incorporarse con menos capital inicial. Durante el período inicial la tarifa publicada es 0, no se exigen depósitos y a cada pool de operador se le asigna la misma demanda, de modo que solo la calidad medida dirige el canal de pools.

A los mineros se les paga con la emisión, no con los depósitos. Como los depósitos se acumulan en la reserva en lugar de reciclarse en pagos, el uso real añade demanda del token, mientras que la emisión sigue un calendario fijo con halvings.

## IV. Dos formas de ganar

Un solo operador puede atender a muchos más de 100.000 mineros, muchos más que los aproximadamente 256 slots on-chain de una subred, así que la red paga a los mineros a través de dos niveles que funcionan en paralelo.

El pool es la puerta de entrada. Cada operador tiene un slot on-chain para todos sus mineros; los validadores ponderan ese pool según la demanda del operador y su calidad medida, y cada minero reclama su parte directamente del contrato de liquidación con una prueba criptográfica. No hay ningún slot que ganar ni nada que quemar. Es donde un minero empieza y gana una recompensa base.

Junto al pool, en el mismo nivel, cada operador tiene además desde la época 8 un pool de Captura la bandera con diez slots de recompensa en cada país: cinco para proveedores y cinco para extensores. Los mineros del operador entran en él con el registro del pool y no queman nada. En cada época, una selección aleatoria pública llena los slots con los mineros que, durante al menos la mitad de la época, estuvieron en línea, superaron las comprobaciones del operador y permanecieron en el país, y estaban activos al final de ella; un slot que nadie gana se suma al fondo acumulado de ese país para su rol. Captura la bandera se lleva una décima parte de la parte de los proveedores.

Los mineros de nivel superior son la cúspide de la oferta. Las aproximadamente 200 flotas más grandes, clasificadas por cuántas IPs de salida distintas y enrutables atienden realmente y no por volumen de tráfico, reclaman cada una su propio slot on-chain y reciben el pago directamente de la red, sin ningún operador en la ruta de pago. Una IP compartida se reparte entre las flotas que la reclaman, así que la amplitud no puede contarse dos veces.

Los dos niveles forman un solo torneo: un minero empieza en un pool, asciende a un slot superior a medida que crece su amplitud de IPs enrutables y vuelve al pool si retrocede. Una proporción fijada por la gobernanza divide la parte de la emisión de los proveedores entre la cabeza y la cola.

- Nivel de pool: la puerta de entrada. Únete a un operador sin slot y sin costo de registro; los validadores ponderan el pool según la demanda y la calidad; la parte de cada minero se acumula en cada período de liquidación y se reclama con una prueba (con la liquidación v2, en una sola cuenta que nunca caduca).
- Mineros de nivel superior: la cúspide. Las aproximadamente 200 flotas con la cobertura de IPs enrutables más amplia reclaman su propio slot y reciben el pago directamente de la red, sin operador, pool ni intermediario.

## V. Custodia, liquidación y descentralización

La liquidación funciona en un ciclo de siete días. El contrato acumula la emisión de cada pool durante el período y luego abre las reclamaciones: los mineros retiran sus UR directamente del contrato según la lista de pagos registrada por su operador. Con la liquidación v2, una raíz de pagos se abre solo después de que el validador la aprueba y transcurre una ventana de impugnación de 14.400 bloques, y el saldo de una cuenta nunca caduca. Los mineros de nivel superior no necesitan ningún paso de liquidación, porque la cadena paga su slot de forma nativa en cada ciclo.

Nadie custodia fondos ajenos. Los contratos de liquidación son los únicos custodios de los UR en tránsito, cada pago de un pool es una reclamación on-chain directa y a los mineros de nivel superior se les paga de forma nativa a sus propias claves. Ni los operadores ni el propietario custodian nunca las recompensas de los mineros.

Las reclamaciones ganadas son definitivas. Una vez finalizado un período de liquidación, los tokens que respaldan sus reclamaciones quedan comprometidos. Ninguna actualización del contrato, pausa o acción administrativa puede bloquearlas ni revertirlas; solo el interruptor a nivel de cadena que desactiva las transferencias de stake en SN25 puede congelar las reclamaciones, y no puede quitarlas ni redirigirlas.

El control se descentraliza con el tiempo. La red se lanza con sus coordinadores de políticas actualizables tras un multisig del propietario, lo que proporciona un control central deliberado y acotado para corregir errores al principio, mientras que las bóvedas de liquidación y la reserva de depósitos son inmutables desde el primer día, y un guardián que solo puede pausar puede detener un exploit, pero nunca mover fondos ni bloquear reclamaciones finalizadas. Se refuerza por etapas: un timelock público en cada cambio y, con el tiempo, gobernanza on-chain.

---

_Este es un documento vivo. La red en funcionamiento influirá en cómo evoluciona, y el diseño descrito aquí, incluido el mecanismo de incentivos, puede cambiar a medida que iteremos._
