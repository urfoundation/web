// Spanish copy of the research methodology (/es/research/methodology). Keys mirror
// en.js; the figures are the English's, written in Spanish number format
// (../research-report/figures.js).
export default {
    eyebrow: 'Investigación · Metodología',
    title: 'Ciclos de investigación que se mejoran a sí mismos',
    description: 'Cómo la investigación de UR mejora la red y sus propias mediciones: tres ciclos (laboratorio, competencia abierta, nodos de campo voluntarios) y una disciplina.',
    figure: 'Tres ciclos de investigación anidados: el laboratorio en el centro, la competencia a su alrededor y el campo en el exterior',
    metaNote: 'Las cifras del laboratorio proceden del informe de investigación de agosto–octubre de 2026.',
    lede: 'UR mejora su red mediante tres ciclos de investigación anidados que comparten una disciplina. El laboratorio mide cada cambio, una competencia abierta se celebra cada semana y los nodos de campo voluntarios informan cada trimestre. Cada ciclo mejora la red y, a la vez, la forma de medir la siguiente ronda.',
    indexAria: 'Los tres ciclos',
    loops: {
        lab: { name: 'Laboratorio', instrument: 'PERFVAR', cadence: 'cada cambio' },
        competition: { name: 'Competencia', instrument: 'Apex SN1', cadence: 'semanal' },
        field: { name: 'Campo', instrument: 'Friends of the Network', cadence: 'trimestral' },
    },
    discipline: {
        eyebrow: 'La disciplina',
        title: 'Un cambio solo cuenta si supera el ruido medido',
        rules: [
            {
                title: 'Comparar con una línea base congelada',
                body: 'Cada cambio se ejecuta contra una línea base fija, un factor a la vez, con el código anterior como control.',
            },
            {
                title: 'Medir primero el instrumento',
                body: 'Antes de fiarse de una diferencia, cada ciclo mide el ruido de su propio instrumento. Un cambio tiene que superar ese ruido en ejecuciones nuevas e intercaladas.',
            },
            {
                title: 'Conservar cada intento',
                body: 'Cada intento queda en el registro, fallos incluidos. El informe de agosto–octubre conservó sus resultados mixtos y rechazados.',
            },
        ],
    },
    outputs: {
        eyebrow: 'Dos resultados',
        title: 'Una red mejor y un instrumento mejor',
        body: 'Cada ciclo recorre las mismas cinco etapas y tiene dos resultados. Cuando un cambio conservado se convierte en la nueva línea base, la red mejora. Cuando lo que el ciclo aprende sobre sus propias mediciones cambia cómo se juzga el siguiente cambio, el instrumento mejora.',
        figure: 'Cinco etapas, Línea base, Cambio, Medir, Juzgar y Registrar, con dos vías de vuelta: el resultado de Registrar a Línea base y el proceso de Registrar a Medir.',
        stages: [
            {
                name: 'Línea base',
                lines: ['Línea base congelada', 'y su banda de ruido'],
            },
            {
                name: 'Cambio',
                lines: ['Un factor a la vez;', 'control: código viejo'],
            },
            {
                name: 'Medir',
                lines: ['Ejecuciones nuevas en', 'el instrumento'],
            },
            {
                name: 'Juzgar',
                lines: ['Superar el ruido o', 'quedar en el registro'],
            },
            {
                name: 'Registrar',
                lines: ['Cada intento guardado,', 'también los fallos'],
            },
        ],
        outcome: 'Un cambio conservado se vuelve la nueva línea base',
        process: 'Lo que el ciclo aprende afina el instrumento',
        railKeys: { process: 'PROCESO', outcome: 'RESULTADO' },
        rails: { outcome: 'Resultado', process: 'Proceso' },
        example: {
            tag: 'Probado contra sí mismo · 12 de septiembre de 2026',
            body: 'Una prueba A/A ejecutó una compilación contra sí misma. La antigua regla de cinco ejecuciones la habría declarado peor en 15 de 17 celdas, así que se retiraron los veredictos de cinco ejecuciones. Un efecto del 10% requiere ahora 33 ejecuciones por brazo.',
            source: 'Registro de mediciones PERFVAR (privado)',
        },
    },
    agents: {
        eyebrow: 'Agentes en el ciclo',
        title: 'Los agentes hacen buena parte del trabajo',
        body: 'Los agentes operan los ciclos junto al equipo. Cada arreglo deja tras de sí una prueba determinista, para que una regresión no pueda volver en silencio.',
        roles: [
            {
                name: 'Triaje',
                body: 'Un agente de bajo esfuerzo ejecuta campañas de pruebas y clasifica sus fallos.',
            },
            {
                name: 'Causa raíz',
                body: 'Un agente de esfuerzo máximo encuentra la causa, la corrige y añade cobertura determinista. Tres pasadas enfocadas y luego una ejecución completa limpia.',
            },
            {
                name: 'Revisión',
                body: 'Dos modelos revisores independientes deben aprobar ambos a un ganador de la competencia antes de promoverlo.',
            },
        ],
    },
    sections: {
        eyebrow: 'Los ciclos',
        title: 'Tres ciclos, tres ritmos',
        loops: {
            lab: {
                tag: 'Ciclo 1 · El laboratorio · cada cambio',
                title: 'Cada cambio, en redes sintéticas con semilla fija',
                body: 'PERFVAR hace pasar la pila real de Connect, desde TUN y el NAT del proveedor hasta cada portador de producción, por redes sintéticas con semilla fija. Un fallo se repite en el mismo tick, de modo que un arreglo puede demostrarse frente al código anterior. LOWBAR, MEMSTEADY y una carga de navegación de 100 páginas llevan las mismas reglas a los enlaces débiles, a los presupuestos de memoria de los teléfonos y a páginas reales.',
                facts: [
                    { v: '39', l: 'cambios medidos, 24 ago – 24 oct 2026' },
                    { v: '≈4,73×', l: 'más rápido con ventanas adaptativas, en su modelo' },
                    {
                        v: '2,81×',
                        l: 'ruta de paquetes: los paquetes de un proveedor enviados como un grupo',
                    },
                    { v: '−26,4%', l: 'memoria en ejecución en una repetición exacta' },
                ],
                links: [
                    'Leer el informe de agosto–octubre de 2026',
                    'PERFVAR',
                    'LOWBAR',
                    'MEMSTEADY',
                ],
            },
            competition: {
                tag: 'Ciclo 2 · La competencia · semanal',
                title: 'El ganador de cada semana se convierte en la línea base que todos deben superar',
                body: 'La Competencia de algoritmos de latencia simulada en Apex (Bittensor SN1) abre el enrutamiento y el emparejamiento a investigadores externos. Un simulador fijo puntúa cada envío en una flota determinista frente a un control congelado de nueve ejecuciones, y ningún envío puede tocar el evaluador. Un ganador aprobado se convierte en la línea base de la siguiente época, con un margen que nunca se relaja.',
                facts: [
                    { v: '6', l: 'épocas semanales desde el {date}' },
                    {
                        v: '26,9%',
                        l: 'de margen, congelado de antemano a partir de ejecuciones de calibración',
                    },
                    { v: 'p ≤ 0,05', l: 'una prueba de Welch unilateral debe coincidir' },
                    { v: '2', l: 'modelos revisores independientes deben aprobar ambos' },
                ],
                links: [
                    'Participar en la competencia en Apex',
                    'Cómo se puntúan los envíos',
                ],
            },
            field: {
                tag: 'Ciclo 3 · El campo · trimestral',
                title: 'Medir la red donde la gente realmente la usa',
                body: 'Friends of the Network coloca pequeños nodos de investigación en las propias conexiones de los voluntarios: Wi-Fi doméstico, Ethernet, red móvil 4G/5G y satélite. Cada nodo ejecuta compilaciones de prueba PERFVAR de la pila de Connect e informa a un edge de investigación central, de modo que las mediciones de enlaces reales vuelven al laboratorio.',
                facts: [
                    { v: '10 nov', l: 'primeros anfitriones avisados por correo' },
                    { v: '15 nov', l: 'se envían los primeros nodos' },
                    { v: 'Trimestral', l: 'resultados publicados en ur.xyz/research' },
                ],
                links: ['Hazte Friend of the Network'],
            },
        },
    },
    publication: {
        eyebrow: 'Publicación',
        title: 'Resultados cada trimestre, rechazos incluidos',
        body: 'Los resultados se publican al menos cada trimestre aquí, en ur.xyz/research. El informe de agosto–octubre de 2026 reunió en una cronología los 39 cambios medidos, incluidos los 4 mixtos y los 3 rechazados.',
        cta: 'Leer el informe de agosto–octubre de 2026',
    },
};
