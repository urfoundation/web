// /mainnet in Spanish: the translation of en.js beside it (the notices, the box at the top and the epochs, from
// data/mainnet.js). Same keys as en.js; after changing a translation, run
// `node tests/i18n-staleness.mjs --unit mainnet/data --accept es <key> ...` from react/.
export default {
    notices: {
        'notice-extender-relay-share': {
            title: 'Los extensores solo ganan su parte en los contratos que pueden retransmitir. A los proveedores en la dirección de un extensor se les acredita todo.',
            paragraphs: [
                'Desde la versión del servidor del operador de red del 12 de noviembre, un extensor es uno de los saltos de un contrato, y gana su parte del uso del contrato, solo cuando puede haber retransmitido el contrato. Esta es la regla que fijó el propietario de la subred el 11 de noviembre: un contrato que llega a través de un extensor cuenta al extensor como uno de sus n saltos, a cada uno de los cuales se le acredita 1/n del uso.',
                'El operador de red cuenta una conexión como retransmitida cuando llega desde la dirección de un extensor. Tres tipos de conexión llegan desde esa dirección sin ser retransmitidos, y ya no convierten al extensor en un salto: la propia conexión del host del extensor, otros dispositivos de la propia red del extensor que comparten su dirección, y proveedores de otras redes que comparten su dirección mientras actúan como proveedores públicos, ya que un proveedor público siempre se conecta directamente a la plataforma.',
                'Así, a un proveedor de otra red en la dirección de un extensor se le acredita todo el uso de sus contratos, mientras que antes a la red del extensor se le acreditaba una parte, normalmente la mitad. Lo mismo ocurre con un proveedor que sirve a un dispositivo que se conecta desde la dirección de un extensor de la propia red del dispositivo, mientras que antes se le acreditaba una parte a la propia red del dispositivo. Dentro de una misma red, a los proveedores de una flota en la dirección de su propio extensor se les acredita el uso que sirven, y el total de la red no cambia. Los propios contratos del host de un extensor no cambian.',
                'Ahora cuenta un tipo de retransmisión que antes no contaba: una conexión desde otra dirección del /64 IPv6 de un extensor. Los hosts suelen enviar desde una dirección temporal de su /64 en lugar de la que usaron para activarse, así que las retransmisiones de un extensor desde esa dirección no le reportaban nada. En esos contratos, el extensor es ahora uno de los saltos, junto al proveedor.',
                'Las recompensas del pool de SN25 se siguen repartiendo según el uso completado, y el subsidio a proveedores del operador de red, que para el tráfico desde el corte del 6 de octubre solo cuenta para los puntos semanales que otorga, sigue los mismos saltos. Los contratos creados antes de esta versión conservan sus saltos. No tienes que hacer nada.',
            ],
            link: 'Leer el aviso completo',
        },
        'notice-capture-the-flag': {
            title: 'Captura la bandera empieza con la época 8: diez slots en cada país, junto al pool de proveedores.',
            paragraphs: [
                'Desde la época 8, que comienza en el bloque 9.600.028 hacia las 18:25 UTC del 27 de noviembre, cada operador de red obtiene un segundo pool de SN25 junto a su pool de proveedores: Captura la bandera. El pool de proveedores paga por el uso, y Captura la bandera paga por estar presente en un país. Cada uno de los 249 países de la ISO 3166-1 tiene diez slots en cada época (una semana), cinco para proveedores y cinco para extensores, y todos los slots valen lo mismo: la nueva financiación del pool para la época dividida entre 2490.',
                'Un proveedor o extensor entra en el sorteo de su país cuando estuvo en línea, superando las comprobaciones de su operador de red y en ese país, durante al menos la mitad de la época, y está activo al final de ella. Cada operador registra en la cadena su lista de participantes, y una ronda de drand publicada después sortea hasta cinco ganadores por país y rol. Los mineros de un mismo bloque de direcciones /29 IPv4 o /48 IPv6 cuentan como un solo participante. Con cinco participantes o menos, cada uno gana un slot; con más, la probabilidad de cada participante es 5 entre el número de participantes.',
                'Un slot sin ganador se traslada al fondo acumulado de su país para ese rol. Cada ganador se lleva su propio slot y una quinta parte de ese fondo, así que un minero que está solo en un país se lleva una quinta parte de lo que queda por cada época que permanece.',
                'Desde la época 8, el pool de proveedores recibe 9/10 de la parte de la emisión de los proveedores en lugar de toda. En la época 4 esa parte fue de 1195,84 α; a esa escala, el pool de proveedores recibiría 1076,26 α y Captura la bandera 119,58 α. Cuando se ponderen las flotas de nivel superior, el pool de proveedores recibirá 4/10. Estas cifras están a la escala de la época 4 y no son una previsión. Las recompensas se pagan en alfa, cuyo valor cambia y puede bajar, y lo que recibe un minero depende de su tiempo en línea, de cuántos otros cumplen los requisitos en su país y de la emisión de la red.',
                'A los ganadores se les paga en la wallet de pago que ya usa el pool de proveedores, así que no hay nada nuevo que firmar. Las reclamaciones de Captura la bandera de la época 8 se abren hacia el 7 de diciembre, junto con las reclamaciones de su pool, en el mismo flujo de reclamación. El pool se registra a través del timelock de 72 horas antes de que empiece la época 8, y los hitos de abajo indican cada paso. No tienes que hacer nada.',
            ],
            link: 'Leer el aviso completo',
        },
        'notice-pro-grant-cycle': {
            title: 'Los datos de Pro pasan al ciclo propio de cada red. Las recompensas de SN25 se cuentan como antes.',
            paragraphs: [
                'Con la versión del servidor del operador de red del 11 de noviembre, una red Pro recibe sus datos mensuales completos en su propio ciclo mensual, contado desde el día en que su suscripción comenzó o se renovó por última vez, en lugar del día 1 de cada mes. La asignación de cada ciclo lleva la parte de los ingresos de la suscripción que corresponde a ese ciclo, y un pago ya no añade un crédito de 600 GiB por separado.',
                'Las recompensas del pool de SN25 se cuentan como antes. El pool de cada operador se reparte según el uso completado, y los pagos de suscripción no intervienen en él.',
                'Lo que cambia son los ingresos por suscripción que cuenta el subsidio a proveedores del operador de red, que para el tráfico desde el corte del 6 de octubre no paga USDC y solo cuenta para los puntos semanales que otorga el operador de red. El subsidio cuenta los ingresos a través de los saldos que financian el tráfico liquidado. Antes, los ingresos de un período pagado podían contar dos veces, completos a través de su crédito de 600 GiB y de nuevo como una parte a través de la asignación mensual, y una suscripción de Google Play de larga duración contaba solo una parte repartida entre los meses desde su inicio. Desde esta versión, los ingresos de cada período cuentan una vez, a través de las asignaciones de sus ciclos.',
                'Así, el subsidio cuenta menos donde los ingresos contaban dos veces, como en el primer mes de una suscripción nueva, y más para las suscripciones de Google Play de larga duración. Su calendario sigue el ciclo propio de cada red en lugar del día 1. Un pago abonado durante un ciclo en curso, como una segunda suscripción, añade sus ingresos a los ciclos siguientes, y la parte que se solapa con el ciclo en curso no se cuenta.',
                'Nada de lo asignado antes de esta versión cambia. Una red Pro que tiene la asignación del 1 de noviembre recibe su primera asignación por ciclo el 1 de diciembre a las 00:00 UTC, cuando termina el mes de esa asignación. Los clientes pagan lo mismo, y no tienes que hacer nada.',
            ],
            link: 'Leer el aviso completo',
        },
        notice: {
            title: 'Pago de la época 3 retrasado. Los fondos están a salvo.',
            paragraphs: [
                'La raíz de pagos de la época 3 no se registró dentro de su ventana el 30 de octubre, porque un paso del servidor agotó su tiempo de espera a la escala de la red principal. Ese paso ya está corregido. La época 1 no tenía trabajo elegible que pagar, así que su financiación se trasladó según la regla del protocolo para registros omitidos.',
                'La financiación de ambas épocas está a salvo en la bóveda de liquidación v1: 3482,26 α de la época 1 y 4132,72 α de la época 3. La financiación trasladada no caduca.',
                'Al final de la época 4 (hacia las 18:25 UTC del 6 de noviembre), una raíz de recuperación mueve estos fondos a la bóveda v2. Se pagan con la época 5, y los fondos de la época 3 van a los proveedores que hicieron el trabajo de la época 3. Se esperan reclamaciones desde aproximadamente el 15 de noviembre. La época 4 no se ve afectada, y no tienes que hacer nada.',
                'Actualización, 6 de noviembre: la raíz de recuperación se registró en el bloque 9.449.041, y los fondos llegan a la bóveda v2 tras su período de impugnación de 48 horas, hacia el 8 de noviembre. Los cambios en el contrato de liquidación v2 esperan ahora 72 horas en un timelock público, así que la incorporación de los fondos a la época 5 se programa a más tardar el 10 de noviembre. El calendario de arriba no cambia.',
                'Actualización, 11 de noviembre: los fondos recuperados llegaron a la bóveda v2 el 8 de noviembre a las 18:30 UTC. Su incorporación al pago de la época 5 no se programó antes de las 18:25 UTC del 10 de noviembre, y los cambios en el contrato de liquidación v2 esperan 72 horas, así que no se pagan con la época 5. Permanecen en la bóveda v2 hasta que se añadan al pago de una época posterior, y este aviso se actualizará cuando eso se programe. El pago ordinario de la época 5 no se ve afectado.',
            ],
            link: 'Leer el aviso completo',
        },
    },

    actions: {
        headline: '¡La red principal está activa!',
        title: 'Qué tienen que hacer los mineros',
        steps: [
            {
                title: 'Instala el nuevo minero.',
                detail: 'Desde el 28 de octubre, los proveedores verificados como modernos se eligen primero en «Calidad» y «Velocidad», así que el minero antiguo pasa a tener menos prioridad.',
                link: 'Guía del minero: Instalar',
            },
            {
                title: 'Registra tu wallet de Bittensor en el nuevo minero.',
                detail: 'Tus recompensas se asocian a la wallet que registres.',
                link: 'Guía del minero: Ejecutar la configuración',
            },
            {
                title: 'La liquidación v2 paga cada época desde la época 4.',
                detail: 'La liquidación v2 empezó con la época 4, desde aproximadamente las 18:25 UTC del 30 de octubre, así que el límite de la versión 1 de 1500 mineros pagados por época ya no se aplica. Sus primeras reclamaciones se abrieron el 8 de noviembre a las 19:10 UTC. La financiación de la época 3 se ha recuperado, como explica el aviso de la época 3 arriba.',
            },
        ],
        closing: 'Con la liquidación v2 activa, la subred está preparada para funcionar por sí sola y escalar a millones de mineros. Los nuevos mineros pueden participar en Bittensor desde {link1} sin ninguna experiencia con Bittensor.',
        closingLinks: [
            'las apps',
        ],
    },

    epochs: {
        0: 'Arranque, sin raíz de pagos',
        1: 'La primera época de pago',
        2: 'Versión 1',
        3: 'Versión 1: el pool v2 no se registró a tiempo',
        4: 'La primera época de la liquidación v2',
        5: 'El primer cierre y las primeras reclamaciones de la liquidación v2',
        6: 'Su uso fija el precio del primer depósito de demanda',
        7: 'La primera época con depósitos de demanda con precio',
        8: 'La primera época de Captura la bandera: diez slots en cada país',
    },

    before: {
        title: 'Antes del lanzamiento',
    },
};
