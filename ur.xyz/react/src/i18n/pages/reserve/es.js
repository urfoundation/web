// /reserve's head and hero in Spanish: the translation of en.js beside it (same keys).
export default {
    meta: {
        title: 'Network Capacity Reserve: reserva de capacidad de red | UR',
        description: 'Reserva para optimizar la capacidad: las emisiones de mineros de SN25 que deja el momentum pagan a proveedores por capacidad de red verificada. Leída en vivo de Bittensor.',
        breadcrumb: 'Network Capacity Reserve',
    },

    hero: {
        eyebrow: 'SN25 · Emisiones de los mineros',
        name: 'Network Capacity Reserve',
        tagline: 'Reserva para optimizaciones continuas de la capacidad.',
        lede: 'Las emisiones de los mineros de SN25 se dividen en dos: el momentum, que se paga ahora a los proveedores, y la reserva, que recibe el resto. La reserva paga a los proveedores por capacidad de red verificada: más cobertura, rutas más confiables y capacidad para nuevos operadores de red.',
    },

    perDay: '{amount} α al día',

    formula: {
        label: 'Fórmula',
        reserve: 'Reserva',
        minerEmissions: 'emisiones de los mineros',
        momentum: 'momentum',
        atLaunch: 'Al lanzamiento:',
        atBlock: 'En el bloque {block}:',
        atCurrent: 'Con el momentum actual:',
        burned: '{share} quemado',
        definition: 'El {term} es la parte de las emisiones de los mineros que se usa ahora para impulsar la red, como recompensas para los proveedores. La reserva no es una parte fija. Recibe todo lo que el momentum no usa, así que recibe menos a medida que el momentum crece.',
        term: 'momentum',
        noMomentumYet: 'La cadena todavía no muestra momentum: en el bloque {block}, los destinatarios de la reserva reciben el resto de la asignación de los mineros, y la página sigue el momentum de la cadena en cuanto llegue al menos al {min}.',
    },

    wallet: {
        label: 'Billetera de la reserva',
        copy: 'Copiar',
        copied: 'Copiado',
        copyTarget: 'la dirección de la billetera',
        copiedStatus: 'Copiado al portapapeles',
        viewOnTaostats: 'Ver en Taostats',
    },

    status: {
        reading: 'Leyendo la mainnet de Bittensor…',
        unavailable: 'Lectura de la cadena no disponible',
        retrying: 'reintentando',
        live: 'En vivo',
        liveDetail: 'mainnet de Bittensor · finalizado',
        preLaunch: 'Antes del lanzamiento',
        awaiting: 'A la espera del primer ingreso',
        preDetail: 'proyectado a partir de la emisión on-chain',
        block: 'bloque {block}',
    },

    stats: {
        balance: 'Saldo de la reserva',
        balanceReading: 'leyendo la mainnet de Bittensor…',
        balanceNothing: 'todavía no se ha recibido nada',
        balanceFlows: '{received} recibidos · {spent} pagados',
        balanceReadingHistory: 'leyendo el historial del saldo…',
        inflow: 'Ingreso mensual',
        inflowObserved: {
            one: '{amount} α al día observados, último {count} día',
            other: '{amount} α al día observados, últimos {count} días',
        },
        inflowProjected: '{amount} α al día proyectados · emisiones de los mineros × (1 − momentum)',
        committed: 'Comprometido en programas',
    },

    price: {
        unitAria: 'Unidad de visualización',
        sources: {
            operators: 'los feeds de estadísticas de los operadores de red',
            gecko: 'el feed del pool de GeckoTerminal de CoinGecko',
        },
        note: 'USD al precio en vivo de α: {price} por α según {source}, {time}. Es una referencia puntual, no un valor realizable.',
        unavailable: 'Precio de α no disponible: las cifras se quedan en α hasta que responda un feed de precios.',
    },

    verify: 'Compruébalo tú mismo: tu navegador lee estas cifras de la mainnet de Bittensor. La reserva está en la coldkey {address}; consúltala en {explorer}.',
};
