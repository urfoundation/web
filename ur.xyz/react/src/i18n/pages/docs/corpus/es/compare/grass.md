---
title: Minero de UR frente a Grass, comparados | UR
description: Un minero de UR en Bittensor SN25 frente a Grass: qué ejecutas, las recompensas, pago, código abierto, el tráfico que transportas y qué datos se guardan.
published: 2026-11-18
---

# Minero de UR frente a Grass

Datos comprobados el 2026-11-18.

Esta página solo compara mecanismos: no hay cifras de ganancias, proyecciones ni precios de tokens de ninguna de las dos redes. Los datos de Grass proceden de los [términos de Grass](https://www.grass.io/terms-and-conditions) y su [política de privacidad](https://www.grass.io/privacy-policy). Los datos de UR proceden de [Cómo ejecutar un minero](/docs/miner), [Cobra por minar](/docs/miner/rewards) y [Metodología de investigación](/research/methodology). Consulta también [todas las redes comparadas](/docs/compare). [Hacerse minero de UR](/miners) recorre el lado de UR.

## Lado a lado

| | Minero de UR | Grass |
| --- | --- | --- |
| Qué ejecutas | El programa `provider` en una computadora con Linux, macOS o Windows que permanece en línea, con una dirección pública estable y el puerto TCP 443 entrante para su extender | El cliente de Grass; requisitos no documentados en las páginas revisadas |
| Otros requisitos | Una cuenta con un operador de red y una coldkey de Bittensor | Una cuenta con datos de registro exactos; una cuenta por persona |
| Cómo se fijan las recompensas | Una parte de la emisión para mineros de la subred, en proporción al tráfico completado multiplicado por la confiabilidad medida; el tráfico de pago y el gratuito ganan lo mismo | Tiempo en línea, calidad, ubicación y uso del ancho de banda que aportas; primero vienen los puntos, que no tienen valor monetario |
| Activo de pago | α ($UR), como stake nativo de α en tu coldkey | Tokens de Grass o USDC, a discreción de Grass, según términos de recompensas aparte |
| Wallet o KYC | Una coldkey de Bittensor que demuestras con una declaración firmada; las páginas citadas no describen ninguna verificación de identidad | Una wallet digital sin custodia, cuya dirección pública recopila Grass; no hay verificación de identidad documentada |
| Cliente de código abierto | La guía sigue el código fuente de `sn/miner` en GitHub | No documentado |
| Tráfico que transportas | Tráfico de internet para un operador de red, como su salida | Acceso a datos web públicos |
| Quién es responsable | No se trata en las páginas citadas aquí; lee los términos de tu operador | Eres "el único responsable" de tu participación, incluido tu contrato con tu proveedor de internet |
| Datos y desinstalación | El minero guarda su identidad y su historial de wallet en `~/.urnetwork`; la desinstalación no se trata en las páginas citadas | Recopila tu dirección IP, identificadores del dispositivo, correo electrónico y dirección de wallet; su sitio usa cookies de analítica y publicidad; borrado a petición contactando con Grass |

## En qué se diferencian las recompensas

Un minero de UR en el pool de un operador gana una parte del pool: los bytes de uso completados multiplicados por la confiabilidad, donde la confiabilidad es confirmaciones entre asignaciones. Los validadores miden ese trabajo; no hay precio por byte. Las recompensas se cuentan por época, alrededor de una semana en mainnet, y se reclaman después.

Los términos de Grass dicen que las recompensas dependen del tiempo en línea, la calidad, la ubicación y el uso del ancho de banda que aportas. Los puntos no tienen valor monetario, y los términos no prometen recompensas futuras.

## Dónde gana Grass

- **Sin línea de comandos ni puertos:** los términos de Grass no describen ninguna configuración de servidor.
- **Elección de activo:** las recompensas pueden incluir USDC además de tokens de Grass.

## A qué renuncias con UR

- Una configuración en la línea de comandos, puertos abiertos y una declaración firmada con una wallet de Bittensor.
- Reclamaciones después de que se cierra cada época, enviadas con una clave de relayer que guarda un poco de TAO para el gas.
- Ningún precio que fijes tú para tu ancho de banda.
- Las páginas citadas aquí no indican quién responde por el tráfico de salida; los términos de tu operador sí.

## En qué se diferencia UR

UR publica cómo mide los cambios en la red, incluidos los resultados rechazados: consulta [Metodología de investigación](/research/methodology).
