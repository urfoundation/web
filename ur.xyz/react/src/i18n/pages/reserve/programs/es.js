// /reserve sections 02 and 03 in Spanish: the translation of en.js beside it (same keys, the
// lists in the order of data/reserve.js).
export default {
    types: {
        kicker: '02 / Tipos de programa',
        title: 'Lo que paga la reserva.',
        sub: 'Los programas compran servicios a los proveedores, no equipos.',
        verifiedBy: 'Verificado por',
        paidAs: 'Se paga como',
        list: [
            {
                tag: 'Tipo 01',
                title: 'Cobertura de red',
                summary: 'Añade capacidad donde la demanda de un operador supera la oferta: más ubicaciones de salida y rutas en los lugares donde los clientes las necesitan.',
                verifiedBy: 'Verificadores desde varios puntos de observación, con comprobaciones de superposición y de enrutamiento',
                paidAs: 'Semanalmente, por unidad de cobertura verificada',
            },
            {
                tag: 'Tipo 02',
                title: 'Confiabilidad de las rutas',
                summary: 'Eleva las tasas de éxito y reduce la latencia en las rutas que los operadores ya usan, para que los clientes vean menos sesiones fallidas.',
                verifiedBy: 'Sondeos aleatorios frente a umbrales acordados de disponibilidad y latencia',
                paidAs: 'Bonificaciones a los proveedores que cumplen los umbrales durante el período de servicio',
            },
            {
                tag: 'Tipo 03',
                title: 'Incorporación de operadores',
                summary: 'Financia capacidad de proveedores para un nuevo operador de red, para que un segundo producto pueda lanzarse sobre la oferta compartida.',
                verifiedBy: 'Aprobación de rutas en funcionamiento y de una disponibilidad sostenida',
                paidAs: 'Hitos para los proveedores del servicio, nunca una subvención de registro para el operador',
            },
        ],
    },

    statuses: {
        preparing: 'En preparación',
        indicative: 'Indicativo',
        active: 'Activo',
        complete: 'Completado',
    },

    counts: {
        byStatus: {
            preparing: { one: '{count} en preparación', other: '{count} en preparación' },
            indicative: { one: '{count} indicativo', other: '{count} indicativos' },
        },
        noneActive: 'ninguno activo',
        active: { one: '{count} activo', other: '{count} activos' },
        committedShare: {
            one: '{share} del ingreso de 12 meses · {count} programa activo',
            other: '{share} del ingreso de 12 meses · {count} programas activos',
        },
    },

    programs: {
        kicker: '03 / Programas',
        title: 'Programas actuales.',
        sub: 'Los programas se publican aquí antes de pagarse. Uno en preparación está definiendo sus términos; uno indicativo se espera, pero aún no está aprobado. Un programa solo está activo cuando sus términos se han publicado y los proveedores los han aceptado, y su tamaño y sus pagos aparecen con él.',
        noneActiveYet: 'Todavía no hay ninguno activo.',
        filterAria: 'Filtrar programas por estado',
        label: 'Programas',
        all: 'Todos',
        committed: '{amount} comprometidos',
        nothingCommitted: 'Nada comprometido todavía',
        head: {
            program: 'Programa',
            type: 'Tipo',
            pays: 'Paga',
            size: 'Tamaño',
            paid: 'Pagado',
            status: 'Estado',
        },
        termsTbd: 'Términos por publicar',
        ceiling: 'tope de {amount}',
        paidShare: '{share} pagado',
        paidAria: '{paid} α pagados de un tope de {ceiling} α',
        empty: 'Ningún programa tiene este estado.',
        list: [
            {
                title: 'Preinstalación regional',
                summary: 'Socios que aumentarán la presencia de la red en ciertas regiones.',
            },
            {
                title: 'Cobertura de salida adicional para un operador existente',
                summary: 'Nuevas ubicaciones de salida que cumplen los requisitos, mantenidas durante un período de servicio fijo.',
                payRule: 'pago por día de salida verificado',
            },
            {
                title: 'Confiabilidad en rutas de operadores existentes',
                summary: 'Mayor éxito de las rutas en una cohorte fija de sondeos comparables.',
                payRule: 'bonificaciones por umbral',
            },
            {
                title: 'Capacidad de proveedores para un segundo operador',
                summary: 'Conexiones de proveedores verificadas y en funcionamiento para un operador nuevo en la red.',
                payRule: 'pagos por hitos',
            },
        ],
    },
};
