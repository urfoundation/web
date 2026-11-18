---
title: Minero de UR frente a proveedor de Orchid | UR
description: Un minero de UR en Bittensor SN25 frente a un proveedor de Orchid: qué ejecutas, las recompensas, stake, código abierto y el tráfico que transportas.
published: 2026-11-18
---

# Minero de UR frente a proveedor de Orchid

Datos comprobados el 2026-11-18.

Esta página solo compara mecanismos: no hay cifras de ganancias, proyecciones ni precios de tokens de ninguna de las dos redes. Los datos de Orchid proceden de la [documentación de Orchid](https://docs.orchid.com/en/latest/), el [repositorio de Orchid](https://github.com/OrchidTechnologies/orchid) y la [política de privacidad de Orchid](https://www.orchid.com/privacy-policy). Los datos de UR proceden de [Cómo ejecutar un minero](/docs/miner), [Cobra por minar](/docs/miner/rewards) y [Metodología de investigación](/research/methodology). Consulta también [todas las redes comparadas](/docs/compare). [Minar Bittensor SN25](/miners) cubre el lado de UR en un solo lugar.

## Lado a lado

| | Minero de UR | Orchid |
| --- | --- | --- |
| Qué ejecutas | El programa `provider` en una computadora con Linux, macOS o Windows que permanece en línea, con una dirección pública estable y el puerto TCP 443 entrante para su extender | Un servidor proveedor listado en el directorio de Ethereum de Orchid; requisitos de hardware no documentados |
| Otros requisitos | Una cuenta con un operador de red y una coldkey de Bittensor | OXT en stake en el directorio |
| Cómo se fijan las recompensas | Una parte de la emisión para mineros de la subred, en proporción al tráfico completado multiplicado por la confiabilidad medida; el tráfico de pago y el gratuito ganan lo mismo | Los usuarios pagan a los proveedores con nanopagos probabilísticos; los proveedores se eligen al azar, con ponderación por stake |
| Activo de pago | α ($UR), como stake nativo de α en tu coldkey | No documentado más allá de los nanopagos |
| Wallet o KYC | Una coldkey de Bittensor que demuestras con una declaración firmada; las páginas citadas no describen ninguna verificación de identidad | Una cuenta de Ethereum; no hay verificación de identidad documentada |
| Cliente de código abierto | La guía sigue el código fuente de `sn/miner` en GitHub | Sí, AGPL-3.0 |
| Tráfico que transportas | Tráfico de internet para un operador de red, como su salida | Tráfico de usuarios de Orchid VPN |
| Quién es responsable | No se trata en las páginas citadas aquí; lee los términos de tu operador | No documentado |
| Datos y desinstalación | El minero guarda su identidad y su historial de wallet en `~/.urnetwork`; la desinstalación no se trata en las páginas citadas | Orchid dice que no recopila datos personales; borrar los datos de la app elimina su única copia |

## En qué se diferencian las recompensas

Un minero de UR en el pool de un operador gana una parte del pool: los bytes de uso completados multiplicados por la confiabilidad, donde la confiabilidad es confirmaciones entre asignaciones. Los validadores miden ese trabajo; no hay precio por byte. Las recompensas se cuentan por época, alrededor de una semana en mainnet, y se reclaman después.

Orchid es un mercado de proveedores de VPN, no una app para compartir conexión residencial. Los proveedores hacen stake de OXT y compiten por las solicitudes mediante una selección aleatoria ponderada por stake. Los usuarios pagan con tickets fuera de la cadena, al estilo de una lotería, que el proveedor comprueba antes de dar servicio.

## Dónde gana Orchid

- **Una licencia declarada:** el repositorio es AGPL-3.0.
- **Tratamiento de datos explicado con claridad:** la política de privacidad de Orchid dice que no recopila datos personales.

## A qué renuncias con UR

- Una configuración en la línea de comandos, puertos abiertos y una declaración firmada con una wallet de Bittensor.
- Reclamaciones después de que se cierra cada época, enviadas con una clave de relayer que guarda un poco de TAO para el gas.
- Ningún precio que fijes tú para tu ancho de banda.
- Las páginas citadas aquí no indican quién responde por el tráfico de salida; los términos de tu operador sí.

## En qué se diferencia UR

UR publica cómo mide los cambios en la red, incluidos los resultados rechazados: consulta [Metodología de investigación](/research/methodology).
