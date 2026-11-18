---
title: Minero de UR frente a nodo dVPN de Sentinel | UR
description: Un minero de UR en Bittensor SN25 frente a un nodo dVPN de Sentinel: qué ejecutas, las recompensas, pago, código abierto y el tráfico que transportas.
published: 2026-11-18
---

# Minero de UR frente a nodo dVPN de Sentinel

Datos comprobados el 2026-11-18.

Esta página solo compara mecanismos: no hay cifras de ganancias, proyecciones ni precios de tokens de ninguna de las dos redes. Los datos de Sentinel proceden de la [documentación de nodos de Sentinel](https://docs.sentinel.co/dvpn-nodes), sus [requisitos](https://docs.sentinel.co/dvpn-nodes/setup/requirements), su [página de ganancias](https://docs.sentinel.co/dvpn-nodes/earnings) y el [repositorio del nodo](https://github.com/sentinel-official/dvpn-node). Los datos de UR proceden de [Cómo ejecutar un minero](/docs/miner), [Cobra por minar](/docs/miner/rewards) y [Metodología de investigación](/research/methodology). Consulta también [todas las redes comparadas](/docs/compare). Los [requisitos y la puesta en marcha de un minero de UR](/miners) se resumen en una página.

## Lado a lado

| | Minero de UR | Sentinel |
| --- | --- | --- |
| Qué ejecutas | El programa `provider` en una computadora con Linux, macOS o Windows que permanece en línea, con una dirección pública estable y el puerto TCP 443 entrante para su extender | El nodo dvpnx en Docker en Linux (preferiblemente Debian o Ubuntu), con 2 vCPU, 2 GB de RAM, un SSD de 10 GB, ancho de banda sin límite y una IP pública |
| Otros requisitos | Una cuenta con un operador de red y una coldkey de Bittensor | Un saldo de P2P en la cuenta del nodo para las transacciones en cadena, y superar una comprobación de estado para poder recibir recompensas |
| Cómo se fijan las recompensas | Una parte de la emisión para mineros de la subred, en proporción al tráfico completado multiplicado por la confiabilidad medida; el tráfico de pago y el gratuito ganan lo mismo | Los usuarios de dVPN pagan al nodo por GB o por hora a precios que fija el operador, o mediante planes de suscripción que pagan por hora en línea |
| Activo de pago | α ($UR), como stake nativo de α en tu coldkey | P2P, pagado cada hora |
| Wallet o KYC | Una coldkey de Bittensor que demuestras con una declaración firmada; las páginas citadas no describen ninguna verificación de identidad | La cuenta del nodo es una wallet; no hay verificación de identidad documentada |
| Cliente de código abierto | La guía sigue el código fuente de `sn/miner` en GitHub | Repositorio público; licencia no confirmada en las páginas revisadas |
| Tráfico que transportas | Tráfico de internet para un operador de red, como su salida | Tráfico de usuarios de la app dVPN |
| Quién es responsable | No se trata en las páginas citadas aquí; lee los términos de tu operador | No documentado en las páginas revisadas |
| Datos y desinstalación | El minero guarda su identidad y su historial de wallet en `~/.urnetwork`; la desinstalación no se trata en las páginas citadas | No documentado en las páginas revisadas |

## En qué se diferencian las recompensas

Un minero de UR en el pool de un operador gana una parte del pool: los bytes de uso completados multiplicados por la confiabilidad, donde la confiabilidad es confirmaciones entre asignaciones. Los validadores miden ese trabajo; no hay precio por byte. Las recompensas se cuentan por época, alrededor de una semana en mainnet, y se reclaman después.

La página de ganancias de Sentinel describe dos formas de cobrar. Un plan de suscripción bloquea tokens para los nodos elegidos y paga por cada hora en línea. Los usuarios de pago por uso pagan por GB o por hora, a precios que el operador fija en dólares estadounidenses y que un oráculo convierte a P2P. Quienes hacen stake de P2P también reciben una parte de los pagos por ancho de banda.

## Dónde gana Sentinel

- **Precios que fijas tú:** un nodo fija sus propios precios por GB y por hora.
- **Pagos cada hora:** las recompensas del nodo se pagan cada hora, sin paso de reclamación.

## A qué renuncias con UR

- Una configuración en la línea de comandos, puertos abiertos y una declaración firmada con una wallet de Bittensor.
- Reclamaciones después de que se cierra cada época, enviadas con una clave de relayer que guarda un poco de TAO para el gas.
- Ningún precio que fijes tú para tu ancho de banda.
- Las páginas citadas aquí no indican quién responde por el tráfico de salida; los términos de tu operador sí.

## En qué se diferencia UR

UR publica cómo mide los cambios en la red, incluidos los resultados rechazados: consulta [Metodología de investigación](/research/methodology).
