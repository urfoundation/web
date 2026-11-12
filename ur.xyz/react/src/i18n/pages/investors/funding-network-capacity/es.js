// Spanish: the letter on funding network capacity, 15 October 2026 (see en.js).
export default {
    introduction: {
        heading: 'Introducción',
        paragraphs: [
            'UR (SN25) aspira a apoyar la visión de código abierto de Bittensor construyendo un mercado de conectividad privada: coordinar a proveedores independientes para construir la capacidad de red privada que los operadores necesitan para dar servicio a sus clientes.',
            'ur.io es el primer ejemplo orientado al cliente; la oportunidad más amplia es una infraestructura compartida por múltiples operadores. En última instancia, nuestra prioridad es crear una red sólida y fiable que permita crecer a cualquier operador, y hacer que las redes privadas sean accesibles para todos.',
            'De este modo, los operadores aportan productos, clientes y demanda, y nuestros mineros independientes suministran conectividad, mientras UR (SN25) coordina los incentivos y la verificación para ayudar a que se desarrolle una oferta útil.',
            'Para UR:',
        ],
        roles: [
            '<strong>Los operadores de red</strong>, incluido ur.io, crean servicios y aportan demanda de clientes.',
            '<strong>Los proveedores y las flotas</strong> aportan las conexiones y la capacidad de enrutamiento que usan esos servicios.',
            '<strong>SN25</strong> incentiva y verifica la oferta subyacente y el uso de los mineros.',
        ],
        closing: 'Esto convierte la inversión en capacidad en una estrategia de ecosistema. Por tanto, deberíamos estar siempre construyendo y reinvirtiendo para ampliar las necesidades de la red y los resultados del servicio en todos los operadores.',
    },
    workingCapital: {
        heading: '¿Por qué retener emisiones como capital circulante?',
        paragraphs: [
            'No esperamos que la capacidad de la red y la demanda de los clientes crezcan en perfecta sintonía. En las conversaciones con los operadores, estos buscan pruebas de una oferta fiable ANTES de lanzarse en la subred. Pensemos en un nuevo operador de VPN que quizá ya tenga un producto y clientes: una cobertura más amplia o una disponibilidad fiable en determinados mercados será clave para respaldar su crecimiento. UR necesita coordinar lo antes posible a los proveedores que puedan cumplir esos requisitos.',
            'Por ello, SN25 utiliza el excedente de emisiones, es decir, las emisiones de los mineros que superan lo que va directamente a los proveedores, para impulsar la llegada de mineros y demostrar la solidez de la red con el fin de atraer a nuevos operadores de red.',
        ],
        diagramAlt: 'Los operadores quieren oferta antes de que llegue la demanda. La capacidad se establece antes de que un operador se lance, mientras que el tráfico de clientes crece más tarde. La Network Capacity Reserve financia esa brecha y se libera contra entregas verificadas. Los operadores se lanzan con la capacidad ya disponible; la reserva asume el coste hasta que el tráfico se pone al día, de modo que los primeros clientes reciben un servicio completo desde el primer día.',
        diagramLink: 'Ver el diagrama a tamaño completo ↗',
    },
    page2Aria: '{title}, página 2',
    reserve: {
        aria: 'Network Capacity Reserve',
        intro: 'Por ello lanzamos la «Network Capacity Reserve», que utiliza el excedente de emisiones para cubrir esa brecha:',
        uses: [
            'Encargar capacidad antes de la expansión de un operador.',
            'Mejorar la cobertura y la fiabilidad donde la oferta existente es insuficiente.',
            'Responder al aumento de la demanda sin depender únicamente de las emisiones de ese periodo.',
            'Mantener disponible la capacidad estratégicamente útil durante los periodos más tranquilos.',
            'Liberar fondos contra entregas verificadas en lugar de distribuir todo el presupuesto de inmediato.',
        ],
        paragraphs: [
            'La <em>Network Capacity Reserve</em> añade una forma de financiar esa oferta antes de la demanda. En este modelo, las emisiones se acumulan como capital circulante y se liberan contra compromisos definidos y verificados.',
            'Para respaldarlo, lanzamos un panel que ayuda a visualizar la asignación de capital, con los saldos de la reserva y las asignaciones publicadas, y en el que se informará de los compromisos y pagos a medida que los programas se activen.',
            'En última instancia, cada programa debería tener un ROI claro sobre cómo se incentiva la capacidad excedente.',
        ],
    },
    examples: {
        heading: 'Ejemplos',
        items: [
            'Cuando un nuevo operador esté listo para llevar usuarios a UR, establecer un programa de incentivos con tope para proveedores que cubra la oferta que necesita. Los pagos dependen de rutas que funcionen y de un servicio sostenido, no simplemente del registro de un operador.',
            'Si ur.io u otro operador necesita salidas adicionales en un mercado objetivo, encargar a proveedores que mantengan allí conexiones que cumplan los requisitos. El mecanismo de flotas existente mide la amplitud de prefijos enrutables; las recompensas geográficas requerirían una verificación de ubicación adicional.',
            'Ofrecer incentivos temporales cuando el uso de un operador supere la oferta disponible. Los pagos vinculados específicamente al rendimiento o al tráfico entregado requerirían una verificación más estricta que las comprobaciones de enrutamiento actuales.',
            'Financiar compromisos de duración limitada para mantener conexiones útiles en línea entre picos de demanda, condicionados a una verificación aleatoria satisfactoria.',
        ],
    },
    operations: {
        heading: 'Operaciones de la reserva',
        items: [
            'La reserva es una multifirma dedicada, separada de las emisiones del propietario y no utilizada para costes del equipo ni operativos: 5CcHGEqKK3RXeEA2sVycHQAQGrqsyhWaYu9FjGtDVN6nwMwR (UID 170 y 250 de SN25).',
            'Publicar los objetivos, los requisitos de participación, la medición y la duración cuando se utilicen recompensas excedentes de los mineros.',
            'Reservar fondos para los compromisos aceptados y tener en cuenta las recompensas de base existentes.',
            'Verificar la entrega, publicar el cálculo de la recompensa, aprobar los pagos a través de la multifirma y divulgar cada transferencia saliente.',
            'Mantener disponibles los fondos no utilizados para futuras necesidades de los operadores y de la red.',
        ],
    },
    impact: {
        heading: 'Impacto',
        paragraphs: [
            'UR (SN25) como red gana valor a medida que aumenta la demanda de los operadores, que compran y bloquean de forma permanente el token para seguir accediendo a la red.',
            'Esa es la conexión que se busca: <strong>más uso de ancho de banda → mayores compras / depósitos obligatorios de los NOs → posibles compras en el mercado → más demanda de $SN25</strong>',
            'La <em>Network Capacity Reserve</em> respalda esto directamente: incentiva a los proveedores a mejorar cobertura, disponibilidad y capacidad concretas, lo que nos ayuda a atraer operadores que dan servicio a más usuarios y acelera aún más el crecimiento.',
            'Esperamos compartir novedades sobre este programa.',
        ],
    },
};
