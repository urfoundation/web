// Spanish copy of the research report page (/es/research/2026-q3-report): its own
// words and what its islands show. Keys mirror en.js; the figures are the English's,
// written in Spanish number format (figures.js).
export default {
    title: 'Informe de investigación de agosto–octubre de 2026',
    kinds: {
        gain: {
            label: 'Mejora',
            legend: 'medida y adoptada',
            tally: { one: '{count} mejora', other: '{count} mejoras' },
        },
        recovery: {
            label: 'Recuperación',
            legend: 'un atasco o fallo corregido',
            tally: { one: '{count} recuperación', other: '{count} recuperaciones' },
        },
        observation: {
            label: 'Observación',
            legend: 'una medición en teléfono o pública, no un A/B',
            tally: { one: '{count} observación', other: '{count} observaciones' },
        },
        mixed: {
            label: 'Mixto',
            legend: 'ayudó en un caso, perjudicó en otro',
            tally: { one: '{count} mixto', other: '{count} mixtos' },
        },
        rejected: {
            label: 'Rechazado',
            legend: 'medido y no adoptado, o sin cambio',
            tally: { one: '{count} rechazado', other: '{count} rechazados' },
        },
        groundwork: {
            label: 'Trabajo de base',
            legend: 'corrección, política o medición, sin afirmación de velocidad',
            tally: { one: '{count} trabajo de base', other: '{count} trabajos de base' },
        },
    },
    meters: {
        load: { name: 'Carga de páginas', tag: 'última mediana', unit: 'ms', short: 'Carga' },
        bulk: { name: 'Velocidad de transferencia', tag: 'H1 controlado', unit: 'Mbps', short: 'Transf.' },
        path: {
            name: 'Ruta de paquetes',
            tag: 'nunca multiplicadas',
            unit: { one: 'aceleración', other: 'aceleraciones' },
            short: 'Ruta',
        },
        memory: {
            name: 'Memoria',
            tag: 'nunca sumadas',
            unit: { one: 'reducción', other: 'reducciones' },
            short: 'Memoria',
        },
        fixed: {
            name: 'Recuperaciones',
            tag: 'recuento',
            unit: { one: 'atasco corregido', other: 'atascos corregidos' },
            short: 'Arreglos',
        },
    },
    entries: {
        'e-aug-24': {
            date: '24 ago',
            title: 'Reequilibrar juntos los ajustes de memoria y velocidad en dispositivos móviles',
            meters: {
                load: {
                    baseline: 'línea base del conjunto low-bar',
                    points: ['conjunto low-bar'],
                },
            },
        },
        'e-aug-24-2': { date: '24 ago', title: 'Comprobar si el servidor se volvió más lento' },
        'e-aug-24-3': {
            date: '24 ago',
            title: 'Encontrar el limitador con colas de secuencia más profundas',
            meters: {
                load: {
                    baseline: 'control H1 explícito',
                    points: ['profundidad 32, ruta pública', 'profundidad 64, ruta pública'],
                },
            },
        },
        'e-aug-25': {
            date: '25 ago',
            title: 'Enviar los paquetes de un proveedor como un solo grupo',
            meters: {
                path: [
                    { l: 'Envíos agrupados del proveedor', t: '2,81×' },
                    { l: 'Ruta rápida de ACK TCP puros', t: '577,8 → 596,5 MB/s' },
                ],
            },
        },
        'e-aug-25-2': {
            date: '25 ago',
            title: 'Escribir frames H1 listos sin esperar',
            meters: {
                path: [
                    { l: 'Escrituras H1 con ready-drain', t: '+85,2%' },
                ],
            },
        },
        'e-aug-25-3': {
            date: '25 ago',
            title: 'Evitar que los traspasos H1 se pierdan bajo carga',
            meters: {
                load: {
                    points: ['teléfono, proveedor exacto'],
                },
                bulk: { controlled: '6,7×' },
                fixed: 'Traspasos H1 perdidos',
            },
        },
        'e-aug-25-26': {
            date: '25–26 ago',
            title: 'Contar la memoria retenida aparte de los datos en vuelo',
            meters: {
                path: [
                    { l: 'Contabilidad de ACK', t: 'unos 44 → 20 ns/op' },
                ],
                memory: [
                    { l: 'Contabilidad de bytes retenidos', t: '29,59 → 21,77 MiB' },
                ],
            },
        },
        'e-aug-26-27': {
            date: '26–27 ago',
            title: 'Recuperarse de salidas envenenadas y elegir proveedores más sanos',
            meters: {
                load: {
                    points: ['ruta pública, tras la recuperación'],
                },
                bulk: {
                    points: ['rutas H1 públicas, mediana combinada'],
                },
                fixed: 'Reproducción tras salidas envenenadas',
            },
        },
        'e-aug-27': {
            date: '27 ago',
            title: 'Compartir la disponibilidad UDP y la gestión de inactividad en los proveedores',
            meters: {
                path: [
                    { l: 'Ida y vuelta UDP del proveedor', t: '+10,4%' },
                ],
                memory: [
                    { l: 'Ciclo de vida UDP compartido', t: '27,9 → 25,8 MiB' },
                ],
            },
        },
        'e-sep-4': { date: '4 sept', title: 'Acotar el traspaso TCP entrante' },
        'e-sep-9-11': {
            date: '9–11 sept',
            title: 'Eliminar el colapso del flight gate en rutas mixtas',
            meters: { fixed: 'Colapso del flight gate en rutas mixtas' },
        },
        'e-sep-12-13': {
            date: '12–13 sept',
            title: 'Detener las tormentas de retransmisión',
            meters: { fixed: 'Tormentas de timeouts de retransmisión' },
        },
        'e-sep-13': {
            date: '13 sept',
            title: 'Ajustar los búferes de socket de los proveedores al autoajuste del kernel',
        },
        'e-sep-14': {
            date: '14 sept',
            title: 'Dimensionar las ventanas de entrega según lo realmente entregado',
            meters: {
                path: [
                    { l: 'Ventanas dimensionadas por la entrega', t: 'razón emparejada 1,233' },
                ],
            },
        },
        'e-sep-14-19': {
            date: '14–19 sept',
            title: 'Escalar los presupuestos con el objetivo y compartir una raíz de contabilidad',
        },
        'e-sep-16-17': {
            date: '16–17 sept',
            title: 'Alcanzar un rendimiento de clase gigabit con ventanas adaptativas',
            meters: {
                path: [
                    { l: 'Ventanas adaptativas (modelo)', t: '≈4,73×' },
                ],
            },
        },
        'e-sep-17': { date: '17 sept', title: 'Elegir un historial de entrega compacto para cada servicio' },
        'e-sep-20': {
            date: '20 sept',
            title: 'Contar los envíos P2P bloqueados por congestión como evidencia de servicio',
            meters: { fixed: 'Admisiones P2P de oferta fija' },
        },
        'e-sep-20-2': { date: '20 sept', title: 'Rechazar límites blandos de memoria de Go más bajos' },
        'e-sep-19-21': {
            date: '19–21 sept',
            title: 'Una ejecución en teléfono supera una comprobación acotada de 24 MiB',
            meters: {
                load: {
                    points: ['ejecución acotada en teléfono'],
                },
                bulk: {
                    points: ['mediana de Fast.com, ejecución acotada en teléfono'],
                },
            },
        },
        'e-sep-21': {
            date: '21 sept',
            title: 'Asignar menos por paquete y reducir los búferes de log en dispositivos móviles',
            meters: {
                path: [
                    { l: 'Anexar a un grupo existente', t: '49,33 → 23,88 ns/op' },
                ],
                memory: [
                    { l: 'Búferes de log en dispositivos móviles', t: '688.128 B menos' },
                ],
            },
        },
        'e-sep-22': {
            date: '22 sept',
            title: 'H1+: un portador más ligero dentro de H1',
            meters: {
                path: [
                    { l: 'Portador H1+', t: '1,19–1,36×' },
                ],
            },
        },
        'e-sep-22-2': {
            date: '22 sept',
            title: 'Dar a los frames sueltos una ruta más rápida en el Framer',
            meters: {
                path: [
                    { l: 'Ruta de frame único del Framer', t: '2,02×' },
                ],
            },
        },
        'e-sep-22-23': {
            date: '22–23 sept',
            title: 'Llevar el RPC del dispositivo sobre FramerXL y luego reutilizar descriptores',
            meters: {
                path: [
                    { l: 'RPC del dispositivo sobre FramerXL', t: '+32,31%' },
                ],
            },
        },
        'e-sep-22-3': { date: '22 sept', title: 'Probar el enmascaramiento de WebSocket con SIMD' },
        'e-sep-23': {
            date: '23 sept',
            title: 'Despachar ráfagas cortas directamente y corregir una estimación demasiado optimista',
        },
        'e-sep-25-26': { date: '25–26 sept', title: 'Probar topes de retransmisión más cortos y UDP sin ACK' },
        'e-sep-30': {
            date: '30 sept',
            title: 'Adoptar perfiles de memoria mayores y detener recortes tempranos en Android',
        },
        'e-oct-2-5': {
            date: '2–5 oct',
            title: 'Reparar la custodia en la etapa NAT para que las subidas terminen',
            meters: { fixed: 'Subidas en la etapa NAT' },
        },
        'e-oct-7-10': { date: '7–10 oct', title: 'Reparar cómo se mide el tráfico H1 bajo carga' },
        'e-oct-14': {
            date: '14 oct',
            title: 'Dar a cada propietario del dispositivo su propia política de poca memoria',
        },
        'e-oct-16-18': {
            date: '16–18 oct',
            title: 'Corregir las cifras de memoria de H1 y hacer la admisión sin asignaciones',
            meters: {
                memory: [
                    { l: 'Asignación por escritura cancelada', t: '128 → 16 B' },
                ],
            },
        },
        'e-oct-19': {
            date: '19 oct',
            title: 'Liberar los lectores terminados en el TCP de gVisor',
            meters: {
                memory: [
                    { l: 'Lector TCP obsoleto liberado', t: '7,86 → 0,54 MiB' },
                ],
            },
        },
        'e-oct-20-21': {
            date: '20–21 oct',
            title: 'Evitar que los canales ocupados y la entrada nativa se bloqueen entre sí',
        },
        'e-oct-21': {
            date: '21 oct',
            title: 'Desactivar el espaciado adicional de la aplicación',
            meters: { fixed: 'Prueba de navegación de 100 páginas' },
        },
        'e-oct-21-23': {
            date: '21–23 oct',
            title: 'Espaciar el descubrimiento de proveedores en vez de reintentar a ciegas',
        },
        'e-oct-22': {
            date: '22 oct',
            title: 'Comprobar celdas alojadas sueltas con perfil de teléfono',
            meters: {
                bulk: {
                    points: [
                        'mediana de Fast, celda con perfil de iOS',
                        'mediana de Fast, celda Android de 64 MiB',
                    ],
                },
            },
        },
        'e-oct-24': {
            date: '24 oct',
            title: 'Elegir proveedores según la salud del servicio y corregir la custodia de SYN',
            meters: { fixed: 'Páginas de SDK100 en menos de 5 s' },
        },
        'e-oct-24-2': {
            date: '24 oct',
            title: 'La última celda en teléfono',
            meters: {
                load: {
                    points: ['última celda en teléfono'],
                },
                bulk: {
                    points: [
                        'Fast, última celda en teléfono',
                        'Fast, última celda en teléfono',
                    ],
                },
            },
        },
    },
    terms: {
        'g-a-a-test': {
            term: 'Prueba A/A',
            def: 'Ejecutar código idéntico contra sí mismo. La dispersión de sus resultados es el ruido que una diferencia real tiene que superar.',
        },
        'g-ack': {
            term: 'ACK',
            def: 'Un acuse de recibo: la señal del receptor de que los datos llegaron, para que el emisor pueda continuar en lugar de reenviar.',
        },
        'g-ack-compression': {
            term: 'Compresión de ACK',
            def: 'Acuses de recibo que llegan agrupados tras un retraso, de modo que el emisor se entera de los datos entregados más tarde de lo que sugeriría solo el tiempo de tránsito de la ruta.',
        },
        'g-admission': {
            term: 'Admisión',
            def: 'Aceptar tráfico nuevo solo cuando el presupuesto de memoria tiene espacio para él.',
        },
        'g-carrier': {
            term: 'Portador',
            def: 'Una conexión que lleva el tráfico de URnetwork entre un dispositivo y la red, como H1, H3 o P2P.',
        },
        'g-connect': {
            term: 'Connect',
            def: 'La biblioteca de red de código abierto de URnetwork, que lleva el tráfico entre clientes y proveedores.',
        },
        'g-drain': { term: 'Vaciado', def: 'Sacar todos los paquetes de una cola en una sola pasada.' },
        'g-fast-com': {
            term: 'Fast.com',
            def: 'Una prueba pública de velocidad de descarga, ejecutada aquí en el navegador de un teléfono.',
        },
        'g-framer': {
            term: 'Framer',
            def: 'El formato que marca dónde empieza y termina cada mensaje en un portador. FramerXL es la variante para frames grandes de RPC del dispositivo.',
        },
        'g-gc': {
            term: 'GC',
            def: 'Recolección de basura: Go recupera la memoria que ya no se usa. GOGC y el límite blando fijan con qué frecuencia y con qué intensidad trabaja.',
        },
        'g-goroutine': {
            term: 'Goroutine',
            def: 'Un hilo ligero de Go. Cada goroutine ocupa memoria, así que tener menos es más barato.',
        },
        'g-gvisor': {
            term: 'gVisor',
            def: 'Una pila de red de código abierto en espacio de usuario. Connect ejecuta TCP/IP en ella en el dispositivo.',
        },
        'g-h1': {
            term: 'H1',
            def: 'La familia de portadores sobre TLS, WebSocket y TCP, que pasa por la infraestructura web ordinaria.',
        },
        'g-h1-plus': {
            term: 'H1+',
            def: 'Una mejora dentro de H1 que envía el formato Framer directamente sobre el flujo TLS, con un WebSocket normal como respaldo.',
        },
        'g-h3': { term: 'H3', def: 'La familia de portadores sobre QUIC.' },
        'g-ios-profile': {
            term: 'Perfil de iOS',
            def: 'El presupuesto de memoria de 32 MiB que representa una extensión de red de iPhone, probado en teléfonos Android autorizados.',
        },
        'g-lowbar': {
            term: 'LOWBAR',
            def: 'La batería de pruebas para enlaces limitados: entrega y latencia a tasas bajas, MTU pequeña, pérdidas y rutas mixtas.',
        },
        'g-median': { term: 'Mediana', def: 'El valor central de un conjunto de mediciones.' },
        'g-memsteady': {
            term: 'MEMSTEADY',
            def: 'La batería de pruebas de memoria a lo largo del tiempo: picos en ejecución, comportamiento en reposo, desmontaje y qué código posee la memoria.',
        },
        'g-mib': { term: 'MiB', def: 'Un mebibyte, 1.048.576 bytes.' },
        'g-model-mbps': {
            term: 'Mbps del modelo',
            def: 'Una tasa medida en un modelo de la ruta con tiempo virtual en lugar de en sockets reales. Muestra que un mecanismo funciona, no lo que obtiene un dispositivo.',
        },
        'g-nat': {
            term: 'NAT',
            def: 'Traducción de direcciones de red: la correspondencia entre direcciones privadas y públicas, aquí en el proveedor.',
        },
        'g-p2p': { term: 'P2P', def: 'Un portador directo entre dos dispositivos.' },
        'g-p95': { term: 'p95', def: 'El valor que el 95% de las mediciones no supera.' },
        'g-pacing': {
            term: 'Espaciado',
            def: 'Repartir los paquetes en el tiempo en lugar de enviarlos en cuanto están listos.',
        },
        'g-pack': { term: 'Pack', def: 'Un mensaje de Connect que lleva uno o más paquetes por el cable.' },
        'g-perfvar': {
            term: 'PERFVAR',
            def: 'La batería de pruebas de desempeño: rendimiento, latencia, costo en el cable y de retransmisión, corrección y calibración, escenario por escenario.',
        },
        'g-provider': {
            term: 'Proveedor',
            def: 'Un dispositivo que comparte su conexión con la red. El tráfico sale de la red a través de él.',
        },
        'g-pto': {
            term: 'PTO',
            def: 'Tiempo de espera de sondeo (probe timeout): el punto en que un emisor TCP deja de esperar y sondea en busca de datos perdidos.',
        },
        'g-race-mode': {
            term: 'Modo race',
            def: 'Una compilación de Go con el detector de carreras activado. Es más lenta y detecta carreras de datos.',
        },
        'g-rpc': {
            term: 'RPC',
            def: 'Llamada a procedimiento remoto. El RPC del dispositivo es el canal local del SDK entre la app y su servicio de red en el mismo dispositivo.',
        },
        'g-rtt': { term: 'RTT', def: 'Tiempo de ida y vuelta: cuánto tarda un mensaje en llegar y volver.' },
        'g-sdk': {
            term: 'SDK',
            def: 'El kit de software de URnetwork sobre el que se construyen las apps. Ejecuta Connect en el dispositivo.',
        },
        'g-syn': { term: 'SYN', def: 'El primer paquete de una nueva conexión TCP.' },
        'g-synctest': {
            term: 'synctest',
            def: 'El paquete de pruebas de Go que ejecuta el código sobre un reloj simulado, de modo que los tiempos son idénticos en cada ejecución.',
        },
        'g-ttfb': {
            term: 'TTFB',
            def: 'Tiempo hasta el primer byte: cuánto tarda en llegar el primer byte de una respuesta.',
        },
        'g-tun': {
            term: 'TUN',
            def: 'Una interfaz de red virtual. Las pruebas full-TUN envían el tráfico por todo el túnel.',
        },
        'g-websocket-masking': {
            term: 'Enmascaramiento de WebSocket',
            def: 'La ofuscación XOR que un cliente WebSocket debe aplicar a todo lo que envía.',
        },
        'g-window': {
            term: 'Ventana',
            def: 'Cuántos datos pueden estar en vuelo antes de que el emisor espere un acuse de recibo. cwnd es la ventana de congestión.',
        },
    },
    description: 'Por qué importa la investigación de red de UR, su hito de clase gigabit y 39 cambios medidos (24 ago.–24 oct. 2026), con el alcance de cada tipo de mejora.',
    toc: {
        title: 'En esta página',
        labels: {
            report: 'Introducción',
            glance: 'De un vistazo',
            why: 'Por qué importa',
            timeline: 'Cronología',
            'month-aug': 'Agosto',
            'month-sep': 'Septiembre',
            'month-oct': 'Octubre',
            methods: 'Métodos',
            milestones: 'Hitos',
            milestone: 'Rendimiento de clase gigabit',
            details: 'Detalles',
            end: 'De principio a fin',
            instruments: 'Instrumentos',
            open: 'Preguntas abiertas',
            glossary: 'Glosario',
        },
    },
    sectionsAria: 'Secciones de esta página',
    intro: {
        eyebrow: 'Investigación · Informe',
        datesNote: 'Las fechas son las de los registros de investigación, que pueden diferir de las fechas de fusión.',
        updated: 'Actualizado el {date}.',
        glance: 'De un vistazo',
        kpiNote: 'Cada cifra corresponde a su propia carga de trabajo. No pueden sumarse ni multiplicarse en una sola aceleración de la app, y el informe no afirma ninguna.',
        kpiNoteLink: 'Por qué no hay una sola cifra',
        entriesByDate: { one: 'La {count} entrada, por fecha', other: 'Las {count} entradas, por fecha' },
        legendAria: 'Marcadores',
        why: 'Por qué importa',
        openLink: 'Lo que aún no está demostrado',
    },
    months: {
        aug: { name: 'Agosto', label: 'ago' },
        sep: { name: 'Septiembre', label: 'sept' },
        oct: { name: 'Octubre', label: 'oct' },
    },
    monthSpan: '{from}–{to} {month}',
    timeline: {
        eyebrow: 'Cronología',
        title: { one: '{count} cambio o experimento', other: '{count} cambios y experimentos' },
        intro: [
            'Cada entrada empieza con su resultado en palabras sencillas y una cifra. Ábrela para ver las mediciones exactas, lo que significan para las baterías de pruebas y la evidencia. Las entradas rechazadas o que no marcaron diferencia siguen en la cronología, señaladas como tales.',
            'Los medidores reproducen la evidencia a medida que lees. Cada uno se mueve solo cuando llegas a la entrada que lo registró, y ninguno se combina nunca con otro.',
        ],
        final: 'Dónde terminaron los medidores',
        railAria: 'Los medidores, según la entrada que estás leyendo',
        monthEntries: { one: '{count} entrada', other: '{count} entradas' },
        byKind: '{month} por tipo',
    },
    entry: {
        noSpeedClaim: 'Sin afirmación de velocidad',
        alsoRejected: 'También rechazado:',
        moves: 'Mueve',
        more: 'Cifras exactas y lo que significan',
        inReport: 'En el informe',
        measured: 'Medido',
        suites: 'Lo que significa para las baterías de pruebas',
        evidence: 'Evidencia',
        private: '(privado; resumido aquí)',
        commit: 'commit {sha} de connect',
    },
    milestone: {
        changed: 'Qué cambió',
        impact: 'Impacto registrado y solidez de la evidencia',
        experiment: 'Experimento',
        result: 'Antes → después',
        establishes: 'Qué demuestra',
        inReport: 'En el informe',
        chart: {
            aria: 'Ruta TCP del host, una barra por segundo: {first} Mbps en el primer segundo, luego {lo}–{hi} Mbps en los nueve siguientes; media de diez segundos {mean} Mbps, con un servicio de 1 Gbps',
            service: 'servicio de 1 Gbps',
            steady: '{lo}–{hi} cada segundo',
            second: '{n} s',
            axis: 'Mbps, carga útil',
            mean: 'media de diez segundos {mean}',
        },
    },
    end: {
        eyebrow: 'De principio a fin',
        title: 'Hasta dónde llegó cada tipo de mejora',
        intro: 'Las propias estimaciones del informe, eje por eje, con la confianza que merece cada una.',
        confidence: 'Confianza',
        inReport: 'En el informe',
        evidence: 'Evidencia de principio a fin',
        estimate: 'Estimación y confianza',
        quote: '«{text}»',
        cite: 'El propio resumen del informe en una frase',
    },
    methods: {
        eyebrow: 'Métodos',
        title: 'Cómo se hizo la investigación',
        intro: 'El programa pasó de un ajuste exploratorio a pruebas que distinguen causas en competencia. Cada método tiene una breve animación esquemática, y el ejemplo de al lado procede de la cronología.',
        seenIn: 'Visto en',
        seen: '{date}: {title}',
        inReport: 'En el informe',
        runIn: '{title}.',
    },
    instruments: {
        eyebrow: 'Instrumentos',
        title: 'Qué cambió en las propias pruebas',
        intro: 'La cobertura de las pruebas mejoró sustancialmente, incluso donde la cuestión del rendimiento sigue abierta.',
        inReport: 'En el informe',
    },
    open: {
        eyebrow: 'Preguntas abiertas',
        title: 'Lo que aún no está demostrado',
        intro: 'No se afirma ninguna mejora acumulada de la velocidad de la app ni de la batería. Estas son las brechas que la próxima calificación tiene que cerrar.',
        latest: 'El último resultado, resumido',
    },
    glossary: {
        eyebrow: 'Glosario',
        title: 'Términos usados en este informe',
        source: 'Fuente: {link}, en urnetwork/connect.',
        sourceNote: 'Su texto está traducido aquí del inglés; cada cifra se cita de él sin redondear; los porcentajes y las razones aparecen solo donde el informe los indica.',
        updated: 'Actualizado el {date}.',
    },
    meter: {
        asOf: 'A fecha de',
        start: 'Inicio',
        count: '{index} de {total}',
        loadFinalShort: '4,7–7,3× vs. 24 ago',
        loadFinal: '4,7–7,3× más rápido que el 24 ago, confianza baja',
        none: 'Aún sin medición',
        loadSub: '{label}, {date}',
        bulkFrom: 'desde unos {from}, {x}',
        otherReadings: { one: '{count} lectura más', other: '{count} lecturas más' },
        phone: 'teléfono',
        publicRoute: 'ruta pública',
        loadNote: 'ms, menos es más rápido',
        hideRest: 'Ocultar el resto',
        more: { one: '{count} más', other: '{count} más' },
        earlier: { one: 'y {count} anterior', other: 'y {count} anteriores' },
        loadAria: 'Observaciones de la mediana de carga de Wikipedia en escala logarítmica, con las líneas base del 24 ago',
        baselines: 'Líneas base del 24 ago',
        baselinesAria: 'Líneas base del 24 ago, {a} y {b} ms',
        baselinesValue: '{a} y {b} ms',
        baselinesTip: 'Líneas base del 24 ago: el control H1 explícito y la línea base del conjunto low-bar',
        thousands: '{n}K',
        msValue: '{value} ms',
        pointAria: '{value} ms, {label}, {date}',
        bulkAria: 'Velocidad de transferencia en Mbps en escala logarítmica: la ruta H1 controlada y lecturas públicas y de teléfono',
        controlled: 'ruta H1 controlada',
        readings: 'lecturas públicas y de teléfono',
        controlledAria: 'ruta H1 controlada, de unos {from} a {to} Mbps',
        controlledTip: 'unos {from} → {to} Mbps ({x})',
        controlledRuns: 'ejecuciones {runs} Mbps',
        mbpsValue: '{value} Mbps',
        bulkPointAria: '{value} Mbps, {label}, {date}',
        pathAria: 'Las mayores aceleraciones de la ruta de paquetes y de las ventanas, cada una medida por separado',
        memoryAria: 'Las tres reducciones de memoria que destaca el informe, cada una en su propio propietario',
        barAria: '{label}: {value}, {date}',
        listItem: '{label}: {value}',
    },
    dock: { menu: '— secciones de esta página' },
    glance: {
        aria: {
            one: 'La {count} entrada del 24 de agosto al 24 de octubre, por fecha',
            other: 'Las {count} entradas del 24 de agosto al 24 de octubre, por fecha',
        },
        axis: { aug: 'AGO', sep: 'SEPT', oct: 'OCT', end: '24 OCT' },
        mark: '{date}, {kind}: {title}',
        tip: '{date} · {kind}',
    },
    termTip: 'En el glosario',
    figure: {
        play: 'Reproducir',
        pause: 'Pausa',
        playAria: 'Reproducir la animación',
        pauseAria: 'Pausar la animación',
    },
    scenes: {
        owners: {
            steps: [
                'Medir el total',
                'Dividirlo por propietario',
                'Hallar el propietario que no debería estar',
                'Liberarlo y conservar el resto',
            ],
            heap: 'heap tras la prueba',
            parts: {
                live: 'datos vivos',
                free: 'lista libre',
                slack: 'holgura',
                goroutines: 'goroutines',
                stale: 'lector obsoleto',
            },
            staleNote: 'los endpoints cerrados aún retienen arrays de 128 KiB',
            released: 'liberado; el resto del heap no cambia',
        },
        boundary: {
            steps: [
                'Seguir una primera página lenta',
                'Medir cada etapa que cruza',
                'Casi toda la espera está en DNS',
                'Una etapa sin medir es desconocida, no cero',
            ],
            stages: { dns: 'DNS', tcp: 'TCP', admit: 'admisión', carrier: 'portador', reply: 'respuesta' },
            axis: 'primera página, tiempo por etapa',
            dns: 'DNS 18,103 s',
            total: '33,044 s en total',
            unknown: 'sin instrumentar: desconocido, no cero',
        },
        deterministic: {
            steps: [
                'Fijar el reloj',
                'Ejecutar el código viejo tres veces',
                'Falla en el mismo tick cada vez',
                'Ejecutar el arreglo con el mismo reloj',
                'Pasa en ese tick',
            ],
            clock: 'reloj fijo',
            rows: ['viejo, 1', 'viejo, 2', 'viejo, 3', 'el arreglo'],
            held: 'cola retenida',
            failed: 'mismo fallo, mismo tick, cada vez',
            passed: 'el arreglo pasa en ese tick',
        },
        ablation: {
            steps: [
                'Ejecutar con todo activado',
                'Desactivar solo el vaciado',
                'Desactivar solo el espaciado',
                'Conservar lo necesario, registrar lo que falló',
            ],
            change: 'cambio',
            switches: { pacing: 'espaciado', drain: 'vaciado', resizing: 'ajuste de ventana' },
            keptOn: 'sigue activo',
            test: 'navegación de 100 páginas',
            stopped: 'se detuvo en 49 páginas',
            stillFailed: 'volvió a fallar',
            running: 'en curso',
            passed: '100 de 100 páginas',
            record: 'el registro',
            rows: { all: 'todo activo', drain: 'sin vaciado', pacing: 'sin espaciado' },
            stoppedShort: 'parada en 49',
            passedShort: '100 de 100',
        },
        layers: {
            steps: [
                'Medir la pieza',
                'Medir el socket y el portador',
                'Medir el túnel completo',
                'La mejora no se trasladó, así que no se adoptó',
            ],
            rows: [
                { l: 'navegador móvil', u: 'Wikipedia, Fast.com', res: 'no alcanzado' },
                { l: 'simulador full-TUN', u: 'pérdida, RTT, MTU', res: 'sin mejora' },
                { l: 'socket y portador', u: 'MB/s sobre TLS', res: '+3,52%' },
                { l: 'microprueba', u: 'ns por op', res: 'más rápido' },
            ],
        },
        noise: {
            steps: [
                'Ejecutar código idéntico dos veces',
                'Su dispersión es el ruido',
                'Intercalar lo viejo y lo nuevo en procesos nuevos',
                'Una diferencia pequeña queda dentro del ruido',
                'Solo cuenta un efecto más allá del ruido',
            ],
            band: 'ruido A/A',
            axis: 'rendimiento',
            order: 'orden',
            fresh: 'nuevo',
            noVerdict: 'sin veredicto',
            effect: 'un efecto',
        },
        validity: {
            steps: [
                'Registrar cada intento',
                'Descartar los fallos maquillaría la mediana',
                'Así que no se descarta nada',
                'La mediana cuenta cada intento',
            ],
            axis: 'tiempo por ejecución, cada intento',
            deadline: 'plazo',
            survivor: 'mediana filtrada: parece mejor',
            notAllowed: 'no permitido',
            all: 'mediana de todos los intentos',
        },
    },
};
