// Spanish: Our Letter to Bittensor, 18 August 2026, and its exhibits (see en.js).
export default {
    salutation: 'Queridos amigos de Bittensor:',
    opening: [
        'Hoy me enorgullece mucho lanzar UR (SN25) junto a mis queridos amigos Brien Colwell y Keith Singery. Hace tres meses, en Estocolmo, Brien y yo nos reunimos para hablar de la necesidad de un internet libre y abierto para todos, una misión a la que Brien se ha dedicado en exclusiva durante los dos últimos años.',
        'En el centro de un internet abierto está el papel de la dirección IP de cada uno. A menudo pasada por alto, su dirección IP es su identidad en línea; cada sitio que visita ve su dirección, vinculada a su ubicación geográfica. Hoy, el internet que conocemos organiza a las personas según su dirección: precios, contenidos, el acceso mismo, todo se decide según dónde se encuentre usted. Si se le puede identificar, se le puede convertir en objetivo; es la herramienta del rastreo y la opresión modernos.',
        'El 8 de enero de 2026, Irán cortó el acceso al internet global, lo que impidió el flujo de información e interrumpió el contacto con muchas familias. Con mucha tristeza, ese fue también un mes decisivo para URnetwork, cuyo producto VPN, ur.io, alcanzó máximos históricos de MAU y fue un salvavidas para los usuarios; un usuario de Teherán lo dijo claramente: «Esta es la única VPN que funciona»',
        'Durante los dos últimos años, Brien ha construido él solo una comunidad de más de 80k proveedores de red que dan servicio a más de 350k MAU, implementando una tecnología difícil (¿cómo se emparejan IP para obtener un rendimiento óptimo?); arrancar la oferta y garantizar el rendimiento es extremadamente difícil como primitiva tecnológica, algo que Tor, Nym y las grandes redes no han logrado.',
    ],
    sweden: [
        'A lo largo de muchas sesiones en Suecia en mayo, Brien habló de su etapa al comienzo de su carrera en Palantir, donde construyó su plataforma Gov V1, que contribuyó a esta generación de tecnologías de vigilancia y militares; duró solo 18 meses antes de irse a la NYU a estudiar arte computacional. Habló de cómo se sentía al crear una tecnología que pensaba lo peor de la humanidad, y de cómo podemos infundir optimismo sobre lo que la tecnología podría hacer para empoderar a las personas, no para menoscabar las libertades.',
        'Nos quedó clarísimo que, para construir este internet abierto para los humanos (y también para los agentes), necesitábamos escalar esta flota rotativa de nodos de salida residenciales y, después, desarrollar nuevas aplicaciones que hagan posible esta forma única de acceso a internet.',
    ],
    market: [
        'Llevar nuestra red a Bittensor supondrá convertir nuestra comunidad de proveedores de IP en un mercado vivo y competitivo que, creemos, puede aumentar la densidad de la red y elevar la calidad de las IP: una red más fuerte, que mejora la experiencia de los usuarios y hace el internet abierto más accesible',
        'Al entrar en Bittensor, queremos compartir nuestros avances y observaciones sobre nuestra misión, con el objetivo último de empoderarlos a todos ustedes para que se unan a nosotros en esta misión por un internet abierto y libre.',
    ],
    subnet: {
        heading: 'La subred de UR',
        paragraphs: [
            'Para empezar, UR es un mercado del lado de la oferta para más de 80k proveedores de IP: piense en él como un Airbnb para su ancho de banda; publique nodos de acceso y cobre cuando se usen. Para los usuarios, estos son nodos de salida: su tráfico puede salir a través de direcciones IP limpias que cambian constantemente; ninguna parte tiene a la vez su identidad y sus destinos, lo que significa que la correlación que hace posible la vigilancia nunca puede llegar a reunirse.',
            'De este modo, la subred de UR se parece más a una empresa de telecomunicaciones propiedad de la gente, que cubre todo el planeta con nodos capaces de facilitar el acceso a internet. Cuanto más global sea la cobertura, más dominante puede llegar a ser.',
            'En Bittensor, los principales mineros de IP tendrán sus propios UID, y los mineros de la cola larga se agruparán en pools bajo UID de mineros. Los operadores de red (Network Operators, «NOs») ejecutan sus propios servidores para alojar a los usuarios y se les factura en SN25 por aprovechar el ancho de banda de la subred. Los validadores comprueban el tráfico para verificar el uso real. Un minero ejecuta el software de UR en un teléfono, un portátil o una Raspberry Pi y deja que el tráfico de desconocidos salga por su conexión doméstica.',
        ],
        operators: 'Un operador de red es el lado de la demanda de la subred; es dueño de los usuarios, el producto, la marca y la facturación, y compra capacidad a SN25 para prestar sus servicios. A los NOs se les factura en dos ejes: (1) usuarios activos mensuales atendidos y (2) gigabytes movidos al día, pagados a la subred en alpha.',
        outlook: [
            'Con nuestro primer operador de red, ur.io, la flota residencial facilita el acceso a internet mediante proxy a muchas personas de todo el mundo. De cara al futuro, vemos un mundo en el que los compradores comerciales pueden aprovechar la flota global para crear un origen legítimo (persona real, lugar real) para diversos casos de uso, como el rastreo web desde la flota residencial para entrenar modelos o la inteligencia de precios con geovallas, es decir, precios de aerolíneas según la geografía; los agregadores compran IP para comparar precios, el acceso de agentes se enruta a través de nodos de salida y supera las medidas antibots. Le recomiendo encarecidamente que pase nuestras <research>tecnologías principales</research> por un agente para entender lo que hizo falta para llegar hasta aquí y por qué esta tecnología es importante para el mundo.',
            'En conjunto, creemos que este diseño permite a UR crear efectos de red muy naturales: mejor cobertura → atrae más tráfico → genera más ingresos → hace la red más valiosa para el siguiente operador.',
        ],
    },
    openInternet: {
        heading: 'Luchar por un internet abierto',
        paragraphs: [
            'La verdad es que las VPN modernas no sirven a amplias franjas de la población mundial y se limitan a facilitar la optimización del catálogo de Netflix para el primer mundo. Desde 2024, la misión de <urio>ur.io</urio> ha sido crear nuevas tecnologías que podrían defender los derechos humanos frente a regímenes opresivos de todo el mundo; ahí es donde hay una oportunidad real de cambio.',
            'Más allá del acceso humano, proyectamos una demanda exponencial de acceso residencial impulsada por los agentes de IA: los agentes consultan la web en nombre de sus usuarios, los laboratorios necesitan recopilar los datos de internet para entrenar; a medida que los agentes proliferen para el progreso humano, la oportunidad será cada vez más un blanco de los actores establecidos. Tomemos Cloudflare, que anunció que, a partir de septiembre, empezará a bloquear rastreadores por defecto y empezará a cobrar por el paso por internet.',
            'Un mundo en el que el acceso a internet se convierte en un recurso escaso es un concepto infame.',
        ],
    },
    closing: [
        'La verdad es que hay personas en el mundo que no quieren lo mejor para usted y su familia: le rastrean, recopilan sus datos, ralentizan su internet. Ya sea una empresa o una agencia gubernamental, un mundo en el que la gente es vigilada por su gobierno o paga impuestos a un casero de internet es infame. La tecnología se utilizó para crear estos problemas; sin duda se puede crear tecnología para resolverlos.',
        'Y aquí reside nuestro objetivo para Bittensor: avanzar juntos hacia un internet abierto y libre. Para nosotros, la gente de Bittensor sabe lo que está en juego para las tecnologías de código abierto, y esperamos que UR y la subred 25 puedan ser un vehículo para nuestro sueño para el mundo.',
        'Por último, nuestra más profunda admiración para Keith por darnos la plataforma para esta misión; sin él y su optimismo inquebrantable por Bittensor, nada de esto sería posible. A nuestros muchos amigos que han influido profundamente en esta misión: Max de SCORE, Micaela de Nova, Ken de Bitmind, Michael White de Karis Capital, Gyles de TAO.com, su energía nos inspira cada día.',
        'Brien, es un honor ayudarte a perseguir este sueño. Vamos a hacer que la gente se sienta orgullosa.',
    ],
    signOff: 'Jack Ai-Leung<br/>En nombre del equipo de UR (SN25)',

    coverage: {
        heading: 'Hoy los mineros se concentran en dos regiones, lo que limita la red a cerca de un millón de usuarios',
        subheading: 'Dónde están hoy los más de 100k operadores de red y dónde los sitúa un mercado de incentivos',
        before: {
            eyebrow: 'Antes',
            title: 'Profundidad en dos regiones',
            text: 'densidad real en EE. UU. y el Sudeste Asiático, financiada por la empresa',
            mapAria: 'Cobertura concentrada en Estados Unidos y el Sudeste Asiático',
        },
        after: {
            eyebrow: 'Después',
            title: 'Esa profundidad, en todas partes',
            text: 'más de 100k direcciones residenciales',
            mapAria: 'Cobertura de direcciones residenciales distribuida por todo el mundo',
        },
    },
    flow: {
        caption: 'Los usuarios acceden a través de un operador de red, que compra ancho de banda a la subred de UR.',
        users: { title: 'Usuarios', text: 'usan la aplicación' },
        operator: { title: 'Operador de red', example: 'p. ej., ur.io', note: 'se le factura en alpha por el ancho de banda usado' },
        subnet: {
            title: 'Subred de UR',
            top: '<b>Mineros principales</b> ~200, cada uno con su propio UID',
            longTail: '<b>Cola larga</b> ~100k, ganan a través de pools',
            note: 'los mineros son los proveedores de IP residenciales',
        },
    },
    stack: {
        caption: 'El producto en funcionamiento ur.io y tres programas de investigación actuales se apoyan en la subred de UR.',
        liveLabel: 'Producto en funcionamiento',
        researchLabel: 'Investigación actual',
        urio: { stat: '350k+ usuarios activos mensuales', text: 'El uso en vivo genera<br/>demanda para la red.' },
        bastion: { name: 'Proyecto Bastion', text: '¿Cómo desbloqueamos<br/>la conectividad de red<br/>empresarial?' },
        stargate: { name: 'Proyecto Stargate', text: '¿Puede un índice abierto<br/>servir para entrenar modelos<br/>y para la recuperación en vivo?' },
        meridian: { name: 'Proyecto Meridian', text: '¿Cómo creamos<br/>una identidad dedicada<br/>para los agentes?' },
        subnetLabel: 'Subred de UR',
        subnetTitle: 'Capa compartida de proveedores y validación',
        subnetText: 'Una sola infraestructura sostiene la demanda en vivo y los tres programas de investigación, mediante la puntuación de calidad y un mercado de incentivos.',
        minersLabel: 'mineros residenciales',
        countriesLabel: 'países',
        expandAria: 'Abrir el diagrama ampliado de la pila de red',
        dialogTitle: 'Pila de red',
        zoomAria: 'Controles de zoom del diagrama',
        zoomOutAria: 'Alejar',
        fit: 'Ajustar',
        fitAria: 'Ajustar el diagrama a la ventana',
        zoomInAria: 'Acercar',
        closeAria: 'Cerrar el diagrama ampliado',
        viewportAria: 'Diagrama ampliable de la pila de red. Pellizque, arrastre o use los controles de zoom.',
    },
};
