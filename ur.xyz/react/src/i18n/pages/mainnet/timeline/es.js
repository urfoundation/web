// /mainnet in Spanish: the translation of en.js beside it (the milestones, from data/mainnet-timeline.json). Same
// keys as en.js; after changing a translation, run
// `node tests/i18n-staleness.mjs --unit mainnet/timeline --accept es <key> ...` from react/.
export default {
    events: {
        'provider-earnings-move-to-sn25': {
            title: 'Las ganancias de los proveedores pasan a SN25',
            detail: 'Las ganancias de contratos liquidados después de este corte se pagan a través de SN25. Los pagos heredados en USDC cubren solo las ganancias anteriores.',
            sources: [],
        },
        'v1-contracts-deployed': {
            title: 'Contratos de la versión 1 desplegados',
            detail: 'Ocho pasos de despliegue en la EVM de Bittensor, en los bloques 9.239.983 a 9.240.067. El coordinador, creado a las 18:08 UTC, inicia la época 0.',
            sources: [
                'Coordinador',
                'Implementación del coordinador',
                'Bóveda de liquidación',
                'Sumidero de reserva',
                'Evidencias del validador',
                'Sumidero de reserva creado, bloque 9.239.983',
                'Bóveda de liquidación creada, bloque 9.239.994',
                'Implementación del coordinador creada, bloque 9.240.004',
                'Escrow registrado, bloque 9.240.015',
                'Coordinador creado, empieza la época 0, bloque 9.240.028',
                'Sumidero de reserva vinculado al coordinador, bloque 9.240.039',
                'Bóveda vinculada al coordinador, bloque 9.240.049',
                'Evidencias del validador creadas, bloque 9.240.067',
            ],
        },
        'network-operator-registered': {
            title: 'Operador de red 1 registrado',
            detail: 'El Safe de gobernanza registra al operador de UR, el operador de red 1, y su pool, SN25 UID 169.',
            sources: [
                'Registro a través del Safe de gobernanza, bloque 9.240.168',
                'Safe de gobernanza',
                'Safe de gobernanza creado, bloque 9.229.341',
            ],
        },
        'v1-validator-activated': {
            title: 'Validador de la versión 1 activado',
            detail: 'El único validador de SN25, UID 1, publica en la cadena su activación para la época 1.',
            sources: [
                'Activación, bloque 9.240.402',
            ],
        },
        'weekly-epochs-scheduled': {
            title: 'Épocas semanales programadas',
            detail: 'El Safe de gobernanza fija épocas de 7 días de 50.400 bloques desde la época 1.',
            sources: [
                'Calendario de épocas a través del Safe de gobernanza, bloque 9.240.407',
                'Safe de gobernanza',
            ],
        },
        'operator-settlement-enabled': {
            title: 'Liquidación del operador de red activada',
            detail: 'Los servidores del operador de red activan la liquidación de SN25 en la red principal.',
            sources: [],
        },
        'client-key-registration-live': {
            title: 'Registro firmado de claves de cliente en marcha',
            detail: 'Los primeros proveedores registran sus claves de cliente con una firma para SN25.',
            sources: [],
        },
        'epoch-1-begins': {
            title: 'Empieza la época 1: la primera época de pago',
            detail: 'La primera época de pago semanal, para la que se activó el validador de la versión 1, comienza en el bloque 9.247.228.',
            sources: [
                'Primer bloque de la época 1, 9.247.228',
            ],
        },
        'last-usdc-payout-batch': {
            title: 'Último lote de pagos en USDC',
            detail: 'El último lote de pagos heredados en USDC a proveedores.',
            sources: [],
        },
        'bittensor-runtime-478': {
            title: 'Runtime 478 de Bittensor en la red principal',
            detail: 'La cadena se actualiza de nuevo, después del runtime 477 del 12 de octubre. Los contratos de la liquidación v2 pasaron su ensayo en el runtime 478.',
            sources: [
                'Actualización al runtime 478, extrínseco 9276925-0010',
                'Actualización al runtime 477 del 12 de octubre, extrínseco 9267632-0020',
            ],
        },
        'settlement-v2-moved-to-epoch-3': {
            title: 'El inicio de la liquidación v2 pasa a la época 3',
            detail: 'El propietario de la subred traslada el inicio de la liquidación v2 de la época 2 a la época 3.',
            sources: [],
        },
        'settlement-v2-gas-policy': {
            title: 'Política de gas para la liquidación v2 en vigor',
            detail: 'Los servidores del operador de red cargan la política de gas para los cierres de época de la liquidación v2.',
            sources: [],
        },
        'settlement-v2-release-checks': {
            title: 'La versión de la liquidación v2 no estaba lista el 16 de octubre',
            detail: 'La versión de la liquidación v2 no había superado sus comprobaciones finales la mañana del 16 de octubre, así que las fechas de despliegue previstas después no se mantuvieron. La versión salió del 22 al 25 de octubre, demasiado tarde para la época 3.',
            sources: [],
        },
        'epoch-1-closes': {
            title: 'La época 1 se cierra con la versión 1',
            detail: 'La época 1 se cerró en el bloque 9.297.631, dentro de su ventana de cierre de 120 bloques, y la bóveda de liquidación recibió sus 3482,26 α. La época 1 no tenía trabajo elegible que pagar, así que no se registró ninguna raíz de pagos antes del bloque 9.298.828, y su financiación se trasladó (consulta el aviso de la época 3 arriba).',
            sources: [
                'Cierre de la época 1, bloque 9.297.631',
            ],
        },
        'first-v1-claims': {
            title: 'Época 1 finalizada sin raíz de pagos',
            detail: 'La época 1 no tuvo raíz de pagos, así que no tuvo reclamaciones de la versión 1. Sus 3482,26 α se trasladaron según la regla del protocolo para registros omitidos, y se han recuperado con la financiación de la época 3 (consulta el aviso de la época 3 arriba).',
            sources: [
                'Época 1 finalizada, bloque 9.312.031',
            ],
        },
        'v2-pool-registration-window': {
            title: 'Liquidación v2 no registrada para la época 3',
            detail: 'No se registró ningún pool v2 en la ventana, los bloques 9.333.628 a 9.340.828, así que la época 3 sigue con la versión 1. El registro no puede activar una época que ya ha comenzado.',
            sources: [],
        },
        'v2-validator-starts': {
            title: 'El validador de la liquidación v2 arranca, v2 desactivada',
            detail: 'El validador arrancó su versión de la liquidación v2 con la configuración sin cambios.',
            sources: [],
        },
        'v2-contracts-deployed': {
            title: 'Contratos de la liquidación v2 desplegados',
            detail: 'Seis pasos de despliegue en la EVM de Bittensor, en los bloques 9.344.278 a 9.344.859, pusieron en la cadena vault2, que guarda los fondos, STSettlement2 y un agrupador de reclamaciones junto a los contratos de la versión 1, que no cambian. Desplegarlos no activa la liquidación v2: también hay que registrar el pool v2.',
            sources: [
                'vault2',
                'STSettlement2',
                'Primera implementación de STSettlement2',
                'Agrupador de reclamaciones',
                'vault2 creado, bloque 9.344.278',
                'Escrow registrado, bloque 9.344.278',
                'Implementación de STSettlement2 creada, bloque 9.344.354',
                'STSettlement2 creado, bloque 9.344.841',
                'vault2 vinculado a STSettlement2, bloque 9.344.851',
                'Agrupador de reclamaciones creado, bloque 9.344.859',
            ],
        },
        'validator-adopts-v2-settings': {
            title: 'El validador adopta su configuración de la liquidación v2',
            detail: 'El validador se reinició con su configuración de la liquidación v2, después de que los contratos v2 se desplegaran esa mañana.',
            sources: [],
        },
        'epoch-3-begins-on-v1': {
            title: 'La época 3 empieza con la versión 1',
            detail: 'La época 3 comienza en el bloque 9.348.028 sin un pool v2 registrado, así que la versión 1 la liquida. La época 2 no se cerró en su ventana de cierre de 120 bloques, así que su emisión se aplazó al cierre de la época 3.',
            sources: [
                'Primer bloque de la época 3, 9.348.028',
                'Emisión de la época 2 aplazada, bloque 9.348.551',
            ],
        },
        'operator-services-updated': {
            title: 'Servicios del operador de red actualizados, v2 desactivada',
            detail: 'Los servicios del operador de red pasaron a la versión de la liquidación v2 con la v2 aún desactivada: el servicio api el 23 de octubre y los demás el 24 de octubre.',
            sources: [],
        },
        'connect-service-updated': {
            title: 'Servicio connect actualizado, v2 desactivada',
            detail: 'El servicio connect del operador de red pasó a la versión de la liquidación v2 junto con sus demás servicios.',
            sources: [],
        },
        'v2-pool-registered': {
            title: 'Pool de la liquidación v2 registrado',
            detail: 'El Safe de gobernanza registró el pool del operador de red 1 en la bóveda v2 el 29 de octubre a las 03:11 UTC, antes de que empezara la época 4, con la época 4 como su primera época v2. Esa fue la activación de la liquidación v2.',
            sources: [
                'Registro a través del Safe de gobernanza, bloque 9.386.659',
            ],
        },
        'operator-switches-to-v2-contracts': {
            title: 'El operador de red pasa a los contratos v2',
            detail: 'Los servidores del operador de red en sus seis hosts pasaron a los contratos de la liquidación v2, antes del registro del pool v2.',
            sources: [],
        },
        'last-v1-claims': {
            title: 'Época 2 finalizada sin raíz de pagos',
            detail: 'La época 2 no se cerró en su ventana de cierre, así que su emisión se quedó en el pool y se recogió en el cierre de la época 3: los 4132,72 α de la época 3 cubren unas dos semanas. Sin financiación y sin raíz de pagos, la época 2 no tuvo reclamaciones de la versión 1.',
            sources: [
                'Época 2 finalizada, bloque 9.362.431',
            ],
        },
        'settlement-v2-active': {
            title: 'Liquidación v2 activa: empieza la época 4',
            detail: 'Desde el bloque 9.398.428, la liquidación v2 paga la época 4 y todas las épocas posteriores. La época 3 se cerró con la versión 1 sin raíz de pagos; su financiación se ha recuperado (consulta el aviso de la época 3 arriba).',
            sources: [
                'Primer bloque de la época 4, 9.398.428',
            ],
        },
        'last-v1-claims-epoch-3': {
            title: 'Época 3 finalizada sin raíz de pagos',
            detail: 'La raíz de pagos de la época 3 no se registró en su ventana, así que no tuvo reclamaciones de la versión 1. Sus 4132,72 α se trasladaron junto con los 3482,26 α de la época 1, y ambos se han recuperado (consulta el aviso de la época 3 arriba).',
            sources: [
                'Época 3 finalizada, bloque 9.412.831',
            ],
        },
        'settlement-v2-timelock': {
            title: 'Los cambios en la liquidación v2 ahora esperan 72 horas',
            detail: 'El contrato de la liquidación v2 que ejecuta los pagos ahora es propiedad de un timelock. Cualquier cambio en él, como una actualización, un nuevo conjunto de auditores o añadir fondos recuperados a una época, se anuncia en la cadena, espera 72 horas y puede cancelarse durante ese tiempo. Las raíces de pagos, las aprobaciones y las reclamaciones no se ven afectadas.',
            sources: [
                'Timelock desplegado',
                'Propiedad transferida al timelock',
                'Timelock',
            ],
        },
        'first-v2-close-and-commit': {
            title: 'Primer cierre y registro de la liquidación v2',
            detail: 'La época 4 terminó en el bloque 9.448.828. Su raíz del libro mayor v2 se registró en el bloque 9.449.034 y el validador la aprobó en el bloque 9.449.041.',
            sources: [
                'Primera raíz del libro mayor v2',
                'Aprobación del validador',
            ],
        },
        'epoch-3-recovery-root': {
            title: 'La raíz de recuperación envía la financiación de las épocas 1 y 3 a la bóveda v2',
            detail: 'Una sola raíz de la versión 1 paga todos los fondos trasladados, 3482,26 α de la época 1 y 4132,72 α de la época 3, a la bóveda v2. Puede reclamarse para la bóveda tras su período de impugnación de 48 horas, desde aproximadamente las 18:25 UTC del 8 de noviembre.',
            sources: [
                'Raíz de recuperación',
            ],
        },
        'first-v2-claim': {
            title: 'Primeras reclamaciones de la liquidación v2',
            detail: 'La raíz de la época 4, la primera raíz v2, se finalizó en el bloque 9.463.438, 14.404 bloques después de su registro, y las primeras reclamaciones siguieron en el bloque 9.463.447.',
            sources: [
                'Primera raíz v2 finalizada, bloque 9.463.438',
                'Primeras reclamaciones v2, bloque 9.463.447',
            ],
        },
        'epoch-3-recovery-scheduled': {
            title: 'Fondos recuperados no programados en la época 5',
            detail: 'La recuperación llegó a la bóveda v2 el 8 de noviembre a las 18:30 UTC. Añadirla al pago de la época 5 tenía que programarse a través del timelock de 72 horas antes de aproximadamente las 18:25 UTC del 10 de noviembre, para que surtiera efecto antes del cierre de la época 5. No se programó, así que los fondos recuperados no se pagan con la época 5 (consulta el aviso de la época 3 arriba). El registro de la recuperación en el contrato de liquidación v2 se programó el 6 de noviembre y está listo para surtir efecto desde las 21:19 UTC del 9 de noviembre.',
            sources: [
                'Raíz de recuperación finalizada, bloque 9.463.231',
                'Recuperación reclamada para la bóveda v2, bloque 9.463.236',
                'Recuperación recibida en el escrow de la bóveda v2, bloque 9.463.240',
                'Registro de la recuperación programado',
            ],
        },
        'fp2-modern-provider-gate': {
            title: 'Filtro de proveedores modernos retirado: los proveedores modernos se eligen primero',
            detail: 'El filtro que habría admitido en «Calidad» y «Velocidad» solo a los proveedores verificados como modernos no llegó a activarse: el 28 de octubre, el propietario de la subred lo sustituyó por prioridad. Dentro de cada nivel, los proveedores verificados como modernos se eligen primero y los demás proveedores ocupan lo que queda, así que estos conservan su lugar en «Calidad» y «Velocidad». La prioridad llegó a los servicios del operador de red esa misma noche, de 22:37 a 23:20 UTC.',
            sources: [],
        },
        'intra-traffic-billing-planned': {
            title: 'El tráfico dentro de una misma red y el del modo «amigos y familia» ahora se descuentan del saldo de datos',
            detail: 'El tráfico entre dispositivos de una misma red y el tráfico hacia un proveedor en modo «amigos y familia» ahora se descuentan del saldo de datos de la red que envía, como el resto del tráfico, en el plan gratuito o en uno de pago. El cambio de facturación, aprobado por el propietario de la subred el 10 de noviembre, llegó a los servicios del operador de red por etapas desde las 05:43 UTC, y a todos ellos antes de las 11:39 UTC. A los proveedores en modo «amigos y familia» se les acredita como antes: el tráfico de pago y el gratuito cuentan igual. Los contratos abiertos antes del cambio no se cobran.',
            sources: [
                'La enmienda, WHITEPAPER.md §8.6.7',
            ],
        },
        'pro-grant-per-cycle': {
            title: 'Los datos de Pro siguen el ciclo propio de cada red, y el subsidio a proveedores cuenta sus ingresos una vez',
            detail: 'Desde la versión del servidor del operador de red del 11 de noviembre, una red Pro recibe sus datos mensuales completos en su propio ciclo mensual, contado desde el día en que su suscripción comenzó o se renovó por última vez, y la asignación de cada ciclo lleva la parte de los ingresos de la suscripción que corresponde a ese ciclo. El subsidio a proveedores del operador de red cuenta esos ingresos una vez, a medida que se liquida el tráfico financiado por la asignación. Antes, los ingresos de un período pagado podían contar dos veces, completos a través de su crédito de 600 GiB y de nuevo como una parte a través de la asignación mensual del día 1, y una suscripción de Google Play de larga duración contaba solo una parte repartida entre los meses desde su inicio. Las recompensas del pool de SN25 se cuentan como antes: el pool se reparte según el uso completado, y los pagos de suscripción no intervienen. Para el tráfico desde el corte del 6 de octubre, el subsidio a proveedores no paga USDC y solo cuenta para los puntos semanales que otorga el operador de red. Una red Pro que tiene la asignación del 1 de noviembre recibe su primera asignación por ciclo el 1 de diciembre a las 00:00 UTC, y nada de lo asignado antes de esta versión cambia. Los clientes pagan lo mismo.',
            sources: [
                'Cómo se cuentan las recompensas, en la guía del minero',
                'El aviso completo en el repositorio sn',
            ],
        },
        'extender-relay-share': {
            title: 'Los extensores solo ganan su parte en los contratos que pueden retransmitir',
            detail: 'Desde la versión del servidor del operador de red del 12 de noviembre, un extensor es uno de los saltos de un contrato, y gana su parte del uso del contrato, solo cuando puede haber retransmitido el contrato, como decidió el propietario de la subred el 11 de noviembre. Una conexión cuenta como retransmitida cuando llega desde la dirección de un extensor, y tres tipos llegan desde esa dirección sin ser retransmitidos: la propia conexión del host del extensor, otros dispositivos de la propia red del extensor que comparten su dirección, y proveedores de otras redes que la comparten mientras actúan como proveedores públicos, que siempre se conectan directamente a la plataforma. Estos ya no convierten al extensor en un salto, así que a sus proveedores se les acredita todo el uso de sus contratos, mientras que antes se le acreditaba una parte a un extensor. Una conexión desde otra dirección del /64 IPv6 de un extensor, como las que los hosts suelen usar para enviar, ahora cuenta como retransmitida por él. Los contratos creados antes de esta versión conservan sus saltos, y las recompensas del pool de SN25 se siguen repartiendo según el uso completado.',
            sources: [
                'El aviso completo en el repositorio sn',
            ],
        },
        'epoch-5-claims-with-recovery': {
            title: 'Reclamaciones de la época 5',
            detail: 'La época 5 termina en el bloque 9.499.228, y las reclamaciones siguen a su período de impugnación de 14.400 bloques. La financiación recuperada de las épocas 1 y 3 no forma parte del pago de la época 5: su incorporación no se programó a tiempo (consulta el aviso de la época 3 arriba).',
            sources: [
                'Raíz del libro mayor de la época 5',
            ],
        },
        'capture-the-flag-presence-sampling': {
            title: 'Captura la bandera: muestreo de presencia antes del fin de la época 6',
            detail: 'Antes de que la época 6 termine en el bloque 9.549.628, los servidores del operador de red empiezan a muestrear cada cuarto de hora a cada proveedor y extensor: si está en línea y supera las comprobaciones del operador, y en qué país está. La época 7 transcurre entonces completa como época en la sombra: cuando termina, el operador construye su lista de participantes, el sorteo y los pagos a partir de las muestras reales sin registrarlos, y publica un informe sin firmar sobre el que se ejecutan las comprobaciones del validador. Captura la bandera empieza con la época 8 solo si el muestreo está en marcha cuando empiece la época 8.',
            sources: [],
        },
        'demand-deposits-priced': {
            title: 'El precio firmado entra en vigor: depósitos de demanda desde la época 7',
            detail: 'Desde el bloque 9.549.628, el operador de red deposita 0,010437 α por GiB y 0,005218 α por usuario activo de la época 6, con un tope de 3000 α por época, según lo firmado por el propietario de la subred en price.yml (publicado el 3 de noviembre). Los validadores comprueban con él el depósito de cada época en cada pasada de ajuste, con la versión del validador que sale antes de la época 7. Hasta que el depósito coincida con lo que debe el uso de la época anterior, el pool del operador no recibe peso.',
            sources: [
                'price.yml',
                'El precio firmado en el repositorio sn',
                'Primer bloque de la época 7, 9.549.628',
                'Primer depósito con precio',
            ],
        },
        'capture-the-flag-pool-registration': {
            title: 'Pool de Captura la bandera registrado a través del timelock de 72 horas',
            detail: 'A más tardar hacia el 22 de noviembre, el Safe de gobernanza programa una operación a través del timelock público de 72 horas: actualiza STSettlement2 y registra el pool de Captura la bandera del operador de red 1, el pool 4.294.967.297, desde la época 8. Hacia el 25 de noviembre, dos días antes de la época 8, cualquiera puede ejecutarla una vez transcurridas sus 72 horas. El pool toma entonces un UID de SN25, con antelación suficiente para ganar peso antes de que termine su inmunidad, bajo un hotkey que solo se deriva en la ejecución, así que no es público durante la espera de 72 horas; una ejecución fallida se repite en un bloque posterior, y si no puede ejecutarse antes de que empiece la época 8, Captura la bandera empieza con la época 9. El contrato de traspaso, que devuelve al pool los fondos acumulados de cada época, se crea después, y vault2, que guarda los fondos, no cambia. Para ejecutarse antes de que empiece la época 8, la operación tiene que programarse antes de aproximadamente las 18:25 UTC del 24 de noviembre.',
            sources: [
                'Timelock',
                'STSettlement2',
                'Operación programada',
                'Operación ejecutada: el pool registrado',
                'Contrato de traspaso',
            ],
        },
        'extender-pool-epoch-8': {
            title: 'Pool de extensores para el tráfico dentro de la plataforma y dentro de la red, desde la época 8',
            detail: 'Desde el bloque 9.600.028, el primero de la época 8, la parte del tráfico de cada contrato que no gana ningún proveedor cuenta en su lugar para los extensores. Eso abarca el tráfico entre un cliente y la plataforma del operador de red, y el tráfico entre dispositivos de una misma red. El pool del operador lo reparte a partes iguales entre todos los bloques de direcciones /29 IPv4 o /48 IPv6 que contienen un extensor elegible, y luego a partes iguales entre los extensores de cada bloque, hasta el uso elegible de los proveedores en la época, así que los extensores ganan como mucho la mitad de un pool. Un extensor que transporta un contrato conserva su propia parte de él, como uno de los saltos del contrato, según decidió el propietario de la subred el 11 de noviembre. Aprobado por el propietario de la subred el 10 de noviembre, entra en vigor cuando se publique la entrada de enmienda firmada antes de que empiece la época 8.',
            sources: [
                'La enmienda, WHITEPAPER.md §8.6',
                'Entrada de enmienda firmada',
                'Primer bloque de la época 8, 9.600.028',
            ],
        },
        'capture-the-flag-epoch-8': {
            title: 'Captura la bandera desde la época 8: diez slots en cada país',
            detail: 'Desde el bloque 9.600.028, el primero de la época 8, cada operador de red tiene un segundo pool junto a su pool de proveedores, Captura la bandera, que paga por estar presente en un país. Cada uno de los 249 países de la ISO 3166-1 tiene cinco slots de proveedor y cinco slots de extensor en cada época, cada uno con un valor igual a la nueva financiación del pool para la época dividida entre 2490. Un proveedor o extensor entra en el sorteo de su país cuando estuvo en línea, superando las comprobaciones del operador y en ese país, durante al menos la mitad de la época, y está activo al final de ella. El operador registra en la cadena la lista de participantes, y una ronda de drand publicada después sortea hasta cinco ganadores por país y rol. Un slot sin ganador se traslada al fondo acumulado de su país, y cada ganador se lleva su propio slot y una quinta parte de ese fondo. El pool de proveedores recibe 9/10 de la parte de los proveedores en lugar de toda, 1076,26 α en lugar de 1195,84 α a la escala de la época 4, y 4/10 cuando se ponderen las flotas de nivel superior. El validador de UR, que tiene la mayoría del stake, pondera el pool desde el primer tempo de la época 8. Aprobado por el propietario de la subred el 11 de noviembre, entra en vigor cuando se publique la entrada de enmienda firmada antes de que empiece la época 8.',
            sources: [
                'El diseño, CAPTURETHEFLAG.md',
                'El aviso completo en el repositorio sn',
                'Entrada de enmienda firmada',
                'Primer bloque de la época 8, 9.600.028',
            ],
        },
        'capture-the-flag-first-draw': {
            title: 'Sorteo y raíz de Captura la bandera de la época 8',
            detail: 'La época 8 termina en el bloque 9.650.428. El operador de red registra su lista de participantes antes del bloque 9.651.028, una ronda de drand publicada al menos un minuto después sortea los ganadores, y la raíz de Captura la bandera se registra junto con la del pool de proveedores antes del bloque 9.651.628. Si el sorteo no está listo para entonces, el operador no registra ninguna lista para la época 8: cada slot se traslada al fondo acumulado de su país, y los primeros ganadores se sortean en la época 9.',
            sources: [
                'Lista de participantes de la época 8 registrada',
                'Raíz de Captura la bandera de la época 8',
            ],
        },
        'capture-the-flag-first-claims': {
            title: 'Primeras reclamaciones de Captura la bandera',
            detail: 'Las reclamaciones de Captura la bandera de la época 8 se abren una vez que el validador ha aprobado su raíz y ha pasado el período de impugnación de 14.400 bloques, aproximadamente al mismo tiempo que las reclamaciones del pool de la época 8. La versión del validador que comprueba y aprueba las raíces de Captura la bandera se espera, a más tardar, hacia el 1 de diciembre, y la aprobación antes del final de la época 9, hacia las 18:25 UTC del 11 de diciembre. A los ganadores se les paga en la wallet de pago que ya usa el pool de proveedores, y reclaman en el mismo flujo de reclamación. Hasta que salgan las versiones de las apps que lo nombren, una app muestra una cuenta de Captura la bandera como «Pool 4294967297» y la reclama como cualquier pool.',
            sources: [
                'Primeras reclamaciones de Captura la bandera',
            ],
        },
    },
};
