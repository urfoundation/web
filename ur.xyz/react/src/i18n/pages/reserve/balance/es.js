// /reserve section 01 in Spanish: the translation of en.js beside it (same keys).
export default {
    kicker: '01 / La reserva',
    title: 'Saldo de la reserva.',
    sub: {
        live: {
            onChain: 'El saldo y sus flujos por mes, leídos del estado finalizado de la cadena y proyectados hasta el {date} con el valor on-chain del momentum.',
            launch: 'El saldo y sus flujos por mes, leídos del estado finalizado de la cadena y proyectados hasta el {date} con el valor de lanzamiento del momentum.',
        },
        projected: {
            onChain: 'Lo que implica la política hasta que la reserva reciba emisión: emisiones de los mineros × (1 − momentum), con el momentum en su valor on-chain y sin programas pagados.',
            launch: 'Lo que implica la política hasta que la reserva reciba emisión: emisiones de los mineros × (1 − momentum), con el momentum en su valor de lanzamiento y sin programas pagados.',
        },
    },

    controls: {
        windowAria: 'Ventana del gráfico',
        last7: '7D',
        last30: '30D',
        all: 'Todo',
        expand: 'Ampliar',
        collapse: 'Reducir',
        balanceChart: 'el gráfico del saldo',
        flowsChart: 'el gráfico de ingresos',
    },

    series: {
        live: 'Saldo en vivo',
        projected: 'Proyectado',
        received: 'Recibido',
        spent: 'Gastado',
        projectedInflow: 'Ingreso proyectado',
    },
    today: 'hoy',
    nothingThisPeriod: 'Nada en este período',
    nothingToChart: 'Aún no hay nada que graficar: la reserva no ha recibido emisión.',
    unitUsd: 'USD al precio en vivo de α',

    balance: {
        label: {
            liveProjected: 'Saldo de la reserva · en vivo, proyectado hasta el {date}',
            live: 'Saldo de la reserva · en vivo',
            projected: 'Saldo de la reserva · proyectado hasta el {date}',
            plain: 'Saldo de la reserva',
            window: {
                one: 'Saldo de la reserva · último {count} día',
                other: 'Saldo de la reserva · últimos {count} días',
            },
        },
        projectedTo: '→ {amount} para el {date}',
        windowChange: {
            one: '{change} en el último {count} día',
            other: '{change} en los últimos {count} días',
        },
        note: {
            live: {
                onChain: 'Saldo en vivo muestreado a diario del estado finalizado de la cadena; proyectado con emisiones de los mineros × (1 − momentum), con el momentum en su valor on-chain y sin pagos de programas.',
                launch: 'Saldo en vivo muestreado a diario del estado finalizado de la cadena; proyectado con emisiones de los mineros × (1 − momentum), con el momentum en su valor de lanzamiento y sin pagos de programas.',
            },
            projected: {
                onChain: 'Proyectado con emisiones de los mineros × (1 − momentum), con el momentum en su valor on-chain y sin programas pagados. Pasa al saldo en vivo cuando la reserva recibe emisión.',
                launch: 'Proyectado con emisiones de los mineros × (1 − momentum), con el momentum en su valor de lanzamiento y sin programas pagados. Pasa al saldo en vivo cuando la reserva recibe emisión.',
            },
            window: 'Saldo en vivo muestreado a diario del estado finalizado de la cadena.',
            readingHistory: 'Leyendo el historial del saldo…',
        },
        aria: {
            liveProjected: 'Saldo de la reserva, {unit}: en vivo hasta el {liveDate}, luego proyectado hasta {amount} para el {date}. Las flechas del teclado leen cada día.',
            live: 'Saldo de la reserva, {unit}: en vivo hasta el {liveDate}. Las flechas del teclado leen cada día.',
            projected: 'Saldo de la reserva, {unit}: proyectado hasta {amount} para el {date}. Las flechas del teclado leen cada día.',
            window: {
                one: 'Saldo de la reserva, {unit}, en el último {count} día, leído de la cadena. Las flechas del teclado leen cada día.',
                other: 'Saldo de la reserva, {unit}, en los últimos {count} días, leído de la cadena. Las flechas del teclado leen cada día.',
            },
        },
    },

    flows: {
        label: 'Ingreso mensual · gasto en programas',
        windowLabel: 'Ingreso diario · gasto en programas',
        received: '{amount} recibidos',
        toPrograms: '→ {amount} a programas hasta ahora',
        toProgramsWindow: {
            one: '→ {amount} a programas, último {count} día',
            other: '→ {amount} a programas, últimos {count} días',
        },
        readingHistory: 'leyendo el historial del saldo…',
        perMonth: '{amount} al mes',
        projectedNoPrograms: 'proyectado · sin programas pagados',
        note: {
            live: 'Los ingresos y los pagos son las subidas y bajadas entre las muestras diarias de la cadena; el ingreso posterior a la última muestra se proyecta con el mismo momentum que el saldo.',
            projected: 'Cada mes se proyecta hasta que la reserva reciba emisión.',
            window: 'Los ingresos y los pagos son las subidas y bajadas entre las muestras diarias de la cadena.',
        },
        aria: {
            live: {
                one: 'Ingreso mensual y gasto en programas, {unit}: {count} mes, de {from} a {to}, recibido y gastado según la cadena y luego proyectado. Las flechas del teclado leen cada mes.',
                other: 'Ingreso mensual y gasto en programas, {unit}: {count} meses, de {from} a {to}, recibido y gastado según la cadena y luego proyectado. Las flechas del teclado leen cada mes.',
            },
            projected: {
                one: 'Ingreso mensual y gasto en programas, {unit}: {count} mes, de {from} a {to}, todo proyectado. Las flechas del teclado leen cada mes.',
                other: 'Ingreso mensual y gasto en programas, {unit}: {count} meses, de {from} a {to}, todo proyectado. Las flechas del teclado leen cada mes.',
            },
            window: {
                one: 'Ingreso diario y gasto en programas, {unit}, en el último {count} día, leído de la cadena. Las flechas del teclado leen cada día.',
                other: 'Ingreso diario y gasto en programas, {unit}, en los últimos {count} días, leído de la cadena. Las flechas del teclado leen cada día.',
            },
        },
    },

    table: {
        show: 'Mostrar como tabla',
        day: 'Día',
        month: 'Mes',
        balance: 'Saldo',
        change: 'Cambio',
        basis: 'Base',
        received: 'Recibido',
        spent: 'Gastado',
        projected: 'Proyectado',
        chain: 'Cadena',
        basisProjected: 'Proyectado',
    },

    splits: {
        received: {
            title: 'Todo lo que ha recibido la reserva',
            spent: 'Gastado',
            committed: 'Comprometido',
            unallocated: 'Sin asignar',
        },
        heading: 'Adónde va la asignación de los mineros',
        emission: {
            title: 'Emisión de SN25',
            owner: 'Propietario de la subred',
            validators: 'Validadores',
            miners: 'Asignación de los mineros',
            note: 'La parte del propietario es {share}; validadores y mineros se reparten el resto a partes iguales.',
        },
        onChain: {
            title: 'Asignación de los mineros, on-chain ahora',
            momentum: 'Momentum, a los proveedores',
            reserve: 'Reserva',
            burned: 'Dirigido por el propietario, quemado',
            noteLive: 'La reserva recibe lo que deja el momentum: 1 − momentum.',
            noteOnChain: 'El momentum ya está on-chain: {momentum} α al día van a los proveedores. La reserva recibe el resto, 1 − momentum ({reserve} α al día), en cuanto se paga a sus hotkeys.',
            notePreLaunch: 'Desde el {date}, el momentum va a los proveedores ({momentum} α al día) y la reserva recibe el resto, 1 − momentum ({reserve} α al día). Hasta entonces, la cadena quema la parte dirigida por el propietario.',
        },
        planned: {
            title: 'Asignación de los mineros desde el {date}',
            momentum: 'Momentum, a los proveedores',
            reserve: 'Reserva, 1 − momentum',
            note: 'La división en vivo aparece cuando responde la cadena.',
        },
        bar: {
            summary: '{title}: {segments}',
            segment: '{label} {value}',
            tip: '{label}: {value}',
            tipShare: '{label}: {value} ({share})',
        },
    },
};
