---
title: Redes para compartir ancho de banda para mineros | UR
description: Un minero de UR frente a Mysterium, Grass, Sentinel, Orchid, Honeygain y Pawns.app: qué ejecutas, recompensas, pago, código abierto y consentimiento.
published: 2026-11-18
---

# Redes para compartir ancho de banda, comparadas

Datos comprobados el 2026-11-18.

Esta página pone un minero de UR (Bittensor SN25) junto a otras redes que pagan a las personas por compartir una conexión o ejecutar un nodo. Solo compara mecanismos. No da cifras de ganancias, proyecciones, rendimientos ni precios de tokens de ninguna red, incluida UR. Cada fila procede del propio sitio, la documentación, los términos o el repositorio del proyecto, enlazados en su página. Cuando las páginas de un proyecto no dicen algo, la tabla indica "no documentado".

Para UR, cada dato procede de [Cómo ejecutar un minero](/docs/miner), [Cobra por minar](/docs/miner/rewards) y [Metodología de investigación](/research/methodology). La [página de los mineros de UR](/miners) explica el rol de UR en un solo lugar.

## De un vistazo

| Red | Qué ejecutas | Cómo se fijan las recompensas | Pago | Cliente de código abierto |
| --- | --- | --- | --- | --- |
| [Minero de UR](/docs/miner) | El programa `provider` en Linux, macOS o Windows, con una dirección pública y un puerto abierto | Una parte de la emisión para mineros de la subred, según el tráfico completado y la confiabilidad medida | α ($UR) a una coldkey de Bittensor que firmas | Código fuente enlazado desde la guía |
| [Nodo de Mysterium](/docs/compare/mysterium) | Software de nodo (WireGuard) mediante script, Docker o apps | Ancho de banda compartido, tiempo en línea y ubicación | MYST | Sí, GPL-3.0 |
| [Grass](/docs/compare/grass) | El cliente de Grass; requisitos no documentados en las páginas revisadas | Tiempo en línea, calidad, ubicación y uso; primero puntos | Tokens de Grass o USDC, a discreción de Grass | No documentado |
| [Nodo dVPN de Sentinel](/docs/compare/sentinel) | El nodo dvpnx en Docker en un servidor Linux con IP pública | Los usuarios de dVPN pagan por GB o por hora a tus precios, o mediante planes de suscripción | P2P, cada hora | Repositorio público; licencia no confirmada |
| [Orchid](/docs/compare/orchid) | Un servidor proveedor listado en un directorio de Ethereum, con OXT en stake | Los usuarios pagan con nanopagos probabilísticos; selección ponderada por stake | No documentado más allá de los nanopagos | Sí, AGPL-3.0 |
| Honeygain | La app de Honeygain | Ganancias acreditadas por GB compartido a una tarifa que Honeygain fija y puede cambiar | Dinero fiduciario mediante proveedores de pago, o JumpTask | No documentado |
| Pawns.app (IPRoyal) | La aplicación Pawns.app | Ganancias por el tráfico compartido, más tareas de socios | USD desde un panel, por encima de un umbral | No documentado |

## De quién es el tráfico que transportas

| Red | Tráfico | Quién responde por él, según sus propios términos |
| --- | --- | --- |
| Minero de UR | Tráfico de internet para un operador de red, como su salida | Las páginas citadas aquí no lo dicen; lee los términos de tu operador |
| Nodo de Mysterium | Tráfico de usuarios de VPN, con productos de socios para VPN residencial y proxies empresariales | Los términos dicen que los operadores "no deberían ser responsables", y que no se puede descartar el tráfico ilegal |
| Grass | Acceso a datos web públicos | Eres "el único responsable" de tu participación |
| Nodo dVPN de Sentinel | Tráfico de usuarios de la app dVPN | No documentado en las páginas revisadas |
| Orchid | Tráfico de usuarios de Orchid VPN | No documentado |
| Honeygain | Los clientes de Honeygain, para usos como analítica web e investigación de mercado | Eres responsable de tu conexión y del cumplimiento con tu proveedor de internet |
| Pawns.app (IPRoyal) | Los clientes empresariales de Pawns.app | Eres "el único responsable" de la actividad en tu cuenta |

Honeygain y Pawns.app no tienen página propia aquí. Sus datos proceden de los [términos de Honeygain](https://www.honeygain.com/terms-of-use/) y su [política de privacidad](https://www.honeygain.com/privacy-policy/), y de los [términos de Pawns.app](https://pawns.app/terms-of-use/) y su [política de privacidad](https://pawns.app/privacy-policy/).

## A qué renuncias con UR

- **La configuración se hace en la línea de comandos.** Instalas un programa, abres puertos y firmas una declaración con una wallet de Bittensor. Las redes basadas en apps piden menos.
- **Necesitas una coldkey de Bittensor, y reclamar lleva pasos.** Las recompensas se cuentan por época, alrededor de una semana en mainnet, y se reclaman después de que la época se cierra, con una clave de relayer que guarda un poco de TAO para el gas.
- **No hay un precio fijo para tu ancho de banda.** Tu parte sigue la emisión de la subred y tu trabajo medido, no una tarifa que tú fijas.
- **Las páginas citadas aquí no cubren la responsabilidad ni la desinstalación.** Los términos de tu operador rigen el tráfico.

## Dónde ganan los demás

- **Menos pasos para empezar:** Honeygain y Pawns.app son una aplicación en tu dispositivo, y MystNodes ofrece Windows, macOS, Linux, Android y una extensión de Chrome y dice que no se necesitan conocimientos técnicos.
- **Precios que fijas tú:** un nodo de Sentinel fija sus propios precios por GB y por hora.
- **Una licencia declarada:** Mysterium (GPL-3.0) y Orchid (AGPL-3.0) declaran la suya en el repositorio.
- **Pagos en dinero fiduciario:** Honeygain y Pawns.app pagan en dinero, sin wallet que gestionar.
