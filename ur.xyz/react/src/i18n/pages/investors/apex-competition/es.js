// Spanish: the Apex (SN1) competition announcement, 28 October 2026 (see en.js).
export default {
    documentTitle: 'UR (SN25) lanza una competición abierta en Apex (SN1) para optimizar los algoritmos de enrutamiento y de emparejamiento de proveedores en los que se basa su red de privacidad',
    highlightsHeading: 'Aspectos destacados',
    highlights: [
        'UR (SN25) ha encargado una competición abierta en Apex (SN1), gestionada por Macrocosmos, para mejorar los algoritmos de enrutamiento y de emparejamiento de proveedores que determinan la velocidad, la confiabilidad y la alcanzabilidad de la red UR.',
        'La competición se centra en cuatro problemas concretos del protocolo publicado: la selección de saltos en URTRANSPORT1, la ventana de proveedores que gestiona UR-MULTI, la reactivación del salto multiproveedor y de la actualización de flujo entre pares (stream), y los metadatos de emparejamiento en UR-FP2 que preservan su resistencia a ataques Sybil.',
        'Todos los algoritmos actuales ya están publicados como código abierto, y UR publicará conjuntos de datos anonimizados por bloque que cubren las entradas del emparejamiento y salidas seleccionadas, para que las propuestas puedan evaluarse en condiciones reales de la red y no en simulación.',
        'Las mejoras que se adopten en producción beneficiarán a los más de 100.000 mineros que transportan tráfico en la red y a los operadores de red que le compran capacidad.',
        'Es la primera competición que pone la capa de enrutamiento de una red de producción en funcionamiento ante la comunidad investigadora de Bittensor.',
    ],
    body: [
        'UR Foundation (UR (SN25) o la Red) anuncia hoy una competición abierta, alojada en Apex (SN1) y gestionada por Macrocosmos, para mejorar los algoritmos que enrutan el tráfico a través de la red UR. La competición abre el problema central de optimización de la Red a la comunidad investigadora de Bittensor, con el objetivo de aumentar el rendimiento medido y la confiabilidad para los mineros que aportan capacidad y para los operadores de red que la compran.',
        'UR (SN25) es un protocolo nativamente descentralizado, multi-IP y multitransporte, en lugar de un túnel convencional de sitio a sitio. Más de 100.000 mineros en más de 100 países mantienen enrutables subredes IPv4 /29 e IPv6 /48 distintas tanto para el tráfico de entrada como de salida, y más de 350.000 usuarios activos mensuales llegan a la web abierta a través de ellos. Cada transferencia se rige por un contrato en depósito de garantía (escrow) que se cierra según un recuento de bytes que ambas partes reconocen, y los validadores recorren de forma independiente cadenas de mineros asignadas por el operador para demostrar el tránsito en tiempo real.',
    ],
    problem: {
        heading: 'El problema de optimización',
        paragraphs: [
            'Enrutar a través de una flota heterogénea y no confiable es un problema sustancialmente más difícil que enrutar a través de infraestructura propia. La <research>investigación del protocolo</research> publicada por la Red identifica las restricciones concretas. El enrutamiento multisalto funciona actualmente sobre transportes TCP a través de un salto central. Los transportes UDP, incluidos HTTP/3 y DNS, están implementados pero desactivados debido a los resultados de rendimiento en condiciones reales con la configuración actual. Un salto multiproveedor con una actualización de flujo entre pares, denominada stream, también está implementado pero desactivado, y WebRTC, XRay y WireGuard se han identificado como actualizaciones candidatas.',
            'Dos casos requieren optimización y se contrapesan entre sí: cuando el siguiente salto no tiene una dirección y un puerto públicos, y cuando los tiene. El segundo favorece la velocidad, mientras que una combinación de ambos favorece la calidad. La Red ha identificado la incorporación de metadatos al algoritmo de emparejamiento como una vía para elegir entre ellos, siempre que se preserve la propiedad que hace que el emparejamiento resista la falsificación de nodos, a saber, que la suma de la confiabilidad esté limitada a uno por subred IP.',
            'En el lado del cliente, UR-MULTI gestiona una ventana de proveedores mediante un barrido heurístico basado en umbrales de transferencia, y no en el análisis del protocolo, que fija el tráfico en el nivel superior disponible. Mejorar esa ventana es el cambio que un usuario final percibe de forma más directa.',
        ],
    },
    page2Aria: 'Comunicado de Apex, página 2',
    why: {
        heading: 'Por qué Apex',
        paragraphs: [
            'Apex (SN1) es la subred original de Bittensor, diseñada por Steffen Cruz, cofundador y director de tecnología de Macrocosmos y antiguo director de tecnología de la Opentensor Foundation. Con un problema definido y un benchmark, Apex externaliza la investigación y el descubrimiento de soluciones a una red global competitiva, y está especialmente indicada para problemas con paisajes complejos y muchas variables interdependientes, en los que un espacio de búsqueda se explora mejor en paralelo.',
            'El enrutamiento de red en condiciones adversas es uno de esos problemas. La función objetivo es medible, las restricciones están publicadas y el espacio de búsqueda es lo bastante grande como para que ningún equipo por sí solo esté en buena posición de explorarlo exhaustivamente. UR (SN25) publicará el benchmark, aportará los conjuntos de datos e incorporará las mejoras validadas al protocolo de producción bajo su licencia de código abierto vigente.',
        ],
    },
    steffen: {
        heading: 'Steffen Cruz, CTO de Macrocosmos, declaró:',
        quote: '«Apex se creó exactamente para esto. Un problema definido, un resultado objetivo real y un espacio de búsqueda demasiado grande para que un solo equipo lo cubra por sí mismo. UR (SN25) está poniendo la capa de enrutamiento de una red que ya transporta un tráfico de producción considerable ante toda la comunidad, por lo que esperamos que los resultados puedan medirse en manos de usuarios reales y no solo en una clasificación».',
    },
    brien: {
        heading: 'Brien Colwell, colaborador principal de UR (SN25), declaró:',
        quote: '«Hemos publicado todos los algoritmos de esta red desde el principio, incluidas las partes que están desactivadas y los motivos por los que lo están. Abrir el problema de enrutamiento a Apex es el siguiente paso lógico, porque quienes están en mejor posición para mejorar un algoritmo de emparejamiento no son necesariamente quienes lo escribieron. Todo lo que supere el benchmark pasa a producción, y 100.000 mineros y cada usuario que hay detrás de ellos notan la diferencia».',
    },
};
