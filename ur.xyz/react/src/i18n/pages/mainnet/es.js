// /mainnet in Spanish: the translation of en.js beside it (the page's own copy). Same keys as en.js; after
// changing a translation, run `node tests/i18n-staleness.mjs --unit mainnet --accept es <key> ...` from react/.
export default {
    meta: {
        title: 'Cronología del lanzamiento de SN25 en la red principal | UR',
        description: 'SN25 en la red principal, por época: versión 1 desde el 8 de octubre, liquidación v2 desde la época 4 (30 de octubre) y primeras reclamaciones el 8 de noviembre.',
        breadcrumb: 'Red principal',
    },

    intro: {
        eyebrow: 'SN25 · red principal de Bittensor',
        title: 'Cronología del lanzamiento en la red principal',
        lede: 'La subred de UR, SN25, entró en funcionamiento en la red principal de Bittensor el 8 de octubre de 2026. Esta cronología sigue el lanzamiento por época de pago, desde los contratos de la versión 1 hasta la primera reclamación de la liquidación v2.',
        note: 'Los hitos marcados como {scheduled} o {planned} aún están por llegar, y sus fechas pueden cambiar. Todas las horas están en UTC, y una hora marcada con ≈ es aproximada: la mayoría se proyectan a partir de números de bloque.',
    },

    settlement: {
        eyebrow: 'Liquidación',
        title: 'Versión 1, luego liquidación v2',
        paragraphs: [
            'SN25 paga a los proveedores por época de pago. Son las épocas de liquidación de UR, no el tempo de 72 minutos de la cadena: la época 0 duró un día, y cada época posterior dura 7 días (50,400 bloques).',
            'La versión 1 se lanzó el 8 de octubre y liquida las épocas 1 a 3. Solo paga a los proveedores que el validador ha medido, y esa medición tiene un tope de unos 1,500 proveedores por época, así que la mayoría de los mineros no recibe ninguna parte de la versión 1.',
            'La liquidación v2 paga según el uso y elimina ese tope. Estaba previsto que tomara el relevo desde la época 3, pero su pool no se registró antes de que la época 3 comenzara el 23 de octubre, así que la versión 1 liquida también la época 3. Su pool se registró el 29 de octubre, y la liquidación v2 ha pagado cada época desde la época 4, que comenzó hacia las 18:25 UTC del 30 de octubre. La primera época v2 terminó hacia el 6 de noviembre, y sus reclamaciones se abrieron el 8 de noviembre, después de que se registrara su raíz y terminara su período de impugnación.',
        ],
        epochsAria: 'Épocas de pago',
    },

    milestones: {
        eyebrow: 'Cronología',
        title: 'Hitos',
        fine: 'La hora de un hito programado o previsto es una proyección, a partir de su número de bloque a 12 segundos por bloque o del plan, y se marca con ≈ salvo que se haya fijado para una hora exacta. Una hora proyectada se mueve un poco si los bloques van más rápido o más lento. Desde la época 1, cada época se cierra dentro de los 120 bloques siguientes a su fin, su raíz de pagos vence dentro de los 1,200 bloques siguientes a su fin, y sus reclamaciones se abren 14,400 bloques (unos dos días) después de ella. Los hitos programados y previstos pueden cambiar.',
        updated: 'Actualizado el {date}.',
    },

    noticeDate: 'Aviso · {date}',

    labels: {
        status: { done: 'Hecho', in_progress: 'En curso', scheduled: 'Programado', planned: 'Previsto' },
        settlement: { v1: 'Versión 1', v2: 'Liquidación v2' },
        view: { transaction: 'Ver transacción', contract: 'Ver contrato', block: 'Ver bloque' },
        sourceAria: '{action}: {label}',
        sourcesAria: 'Fuentes de {title}',
        transactionsAria: 'Transacciones de {title}',
        transactions: { one: '{count} transacción', many: '{count} transacciones', other: '{count} transacciones' },
        epoch: 'Época {number}',
        beforeLaunch: 'Antes del lanzamiento',
        afterEpoch: 'Después de la época {number}',
        epochBlocks: 'Bloques {start} → {end} · {blocks}, {length}',
        blocks: { one: '{count} bloque', many: '{count} bloques', other: '{count} bloques' },
        days: { one: '{count} día', many: '{count} días', other: '{count} días' },
        aboutDays: { one: 'aproximadamente {count} día', many: 'aproximadamente {count} días', other: 'aproximadamente {count} días' },
        arrow: '→',
    },

    dates: {
        weekdays: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
        monthsLong: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        day: '{weekday}, {date} {month}',
        monthDay: '{date} {month}',
        sameMonth: '{start}–{end} {month}',
        twoMonths: '{start} – {end}',
        long: '{date} de {month} de {year}',
    },

    summary: {
        title: 'De un vistazo',
        figureAria: 'Épocas de pago e hitos clave',
        epochShort: 'E{number}',
        afterShort: 'Después',
        from: 'desde el {days}',
        settledBy: { v1: 'liquidación con la versión 1', v2: 'liquidación v2' },
        mark: '{number}. {title}, {when}, {status}',
        span: '{title}, {when}, {status}',
        now: 'Ahora',
        nowAt: '{time}',
        nowIn: '{time}, {percent} % de la época {number}',
        bandsAria: 'Franjas',
        markersAria: 'Marcadores',
        either: '{first} o {second}',
        lower: { done: 'hecho', in_progress: 'en curso', scheduled: 'programado', planned: 'previsto' },
        legendSpan: '{title}, {days}',
        datesAria: 'Fechas clave',
    },
};
