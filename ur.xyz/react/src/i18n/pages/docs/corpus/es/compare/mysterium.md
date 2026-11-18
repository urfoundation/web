---
title: Minero de UR frente a nodo de Mysterium | UR
description: Un minero de UR en Bittensor SN25 frente a un nodo de Mysterium: qué ejecutas, las recompensas, pago, código abierto, tráfico que transportas y datos.
published: 2026-11-18
---

# Minero de UR frente a nodo de Mysterium

Datos comprobados el 2026-11-18.

Esta página solo compara mecanismos: no hay cifras de ganancias, proyecciones ni precios de tokens de ninguna de las dos redes. Los datos de Mysterium proceden de [mysterium.network](https://mysterium.network/), [MystNodes](https://mystnodes.com/), los [términos de MystNodes](https://mystnodes.com/legal/terms-and-conditions) y el [repositorio del nodo](https://github.com/mysteriumnetwork/node). Los datos de UR proceden de [Cómo ejecutar un minero](/docs/miner), [Cobra por minar](/docs/miner/rewards) y [Metodología de investigación](/research/methodology). Consulta también [todas las redes comparadas](/docs/compare). Para el lado de UR en una sola página, consulta [cómo minar en UR](/miners).

## Lado a lado

| | Minero de UR | Nodo de Mysterium |
| --- | --- | --- |
| Qué ejecutas | El programa `provider` en una computadora con Linux, macOS o Windows que permanece en línea, con una dirección pública estable y el puerto TCP 443 entrante para su extender | Software de nodo que usa WireGuard, mediante script en Debian, Ubuntu o Raspbian, mediante Docker o mediante las apps de MystNodes |
| Otros requisitos | Una cuenta con un operador de red y una coldkey de Bittensor | Una tarifa de registro en Polygon, que se puede pagar en MYST |
| Cómo se fijan las recompensas | Una parte de la emisión para mineros de la subred, en proporción al tráfico completado multiplicado por la confiabilidad medida; el tráfico de pago y el gratuito ganan lo mismo | El ancho de banda compartido, la constancia con que el nodo permanece en línea y la ubicación |
| Activo de pago | α ($UR), como stake nativo de α en tu coldkey | MYST |
| Wallet o KYC | Una coldkey de Bittensor que demuestras con una declaración firmada; las páginas citadas no describen ninguna verificación de identidad | No documentado en las páginas revisadas |
| Cliente de código abierto | La guía sigue el código fuente de `sn/miner` en GitHub | Sí, GPL-3.0 |
| Tráfico que transportas | Tráfico de internet para un operador de red, como su salida | Tráfico de salida para usuarios de VPN; los productos de socios incluyen una VPN residencial y proxies empresariales |
| Quién es responsable | No se trata en las páginas citadas aquí; lee los términos de tu operador | Los términos dicen que los operadores "no deberían ser responsables", y que no se puede descartar el tráfico ilegal |
| Datos y desinstalación | El minero guarda su identidad y su historial de wallet en `~/.urnetwork`; la desinstalación no se trata en las páginas citadas | Los términos no describen registros de navegación y sí datos de uso mínimos; al terminar, los datos "pueden" borrarse; no hay procedimiento de borrado documentado |

## En qué se diferencian las recompensas

Un minero de UR en el pool de un operador gana una parte del pool: los bytes de uso completados multiplicados por la confiabilidad, donde la confiabilidad es confirmaciones entre asignaciones. Los validadores miden ese trabajo; no hay precio por byte. Las recompensas se cuentan por época, alrededor de una semana en mainnet, y se reclaman después.

MystNodes dice que las recompensas dependen de cuánto ancho de banda comparte un nodo, de la constancia con que permanece en línea y de su ubicación. El tráfico de prueba no da derecho a pago.

## Dónde gana Mysterium

- **Inicio más fácil:** MystNodes ofrece Windows, macOS, Linux, Android, Docker, Raspberry Pi y una extensión de Chrome, y dice que no se necesitan conocimientos técnicos.
- **Una licencia declarada:** el repositorio del nodo es GPL-3.0.
- **Una postura escrita sobre la responsabilidad:** sus términos tratan directamente la responsabilidad de los nodos de salida.

## A qué renuncias con UR

- Una configuración en la línea de comandos, puertos abiertos y una declaración firmada con una wallet de Bittensor.
- Reclamaciones después de que se cierra cada época, enviadas con una clave de relayer que guarda un poco de TAO para el gas.
- Ningún precio que fijes tú para tu ancho de banda.
- Las páginas citadas aquí no indican quién responde por el tráfico de salida; los términos de tu operador sí.

## En qué se diferencia UR

UR publica cómo mide los cambios en la red, incluidos los resultados rechazados: consulta [Metodología de investigación](/research/methodology).
