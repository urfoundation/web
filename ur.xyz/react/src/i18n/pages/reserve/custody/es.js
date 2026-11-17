// /reserve section 04 and the fine print in Spanish: the translation of en.js beside it (same
// keys, the lists in the order of data/reserve.js).
export default {
    process: {
        kicker: '04 / Cómo se activa un programa',
        title: 'Primero se publica, al final se paga.',
        steps: [
            { title: 'Términos publicados', detail: 'Necesidad, elegibilidad, regla de pago, verificador.' },
            { title: 'Los proveedores aceptan', detail: 'El presupuesto se reserva solo tras la aceptación.' },
            { title: 'Medición semanal', detail: 'Los verificadores firman las observaciones.' },
            { title: 'Manifiesto público', detail: 'Destinatarios, montos y evidencia.' },
            { title: 'Revisión de 48 horas', detail: 'Se publica para revisión antes de firmar.' },
            { title: '2 de 3 firmas', detail: 'Se verifican contra la transacción codificada.' },
        ],
    },

    custody: {
        heading: 'Custodia',
        threshold: '2 de 3',
        accountLabel: 'Cuenta de la reserva · multifirma {threshold}',
        onChain: 'On-chain',
        awaitingFunds: 'A la espera de fondos',
        modeNote: 'La cuenta de la reserva es una multifirma nativa 2 de 3. Solo firma para registrar a sus propios destinatarios y paga con su propio saldo las quemas de registro de SN25.',
        holds: 'Tiene {tao} TAO libres en el bloque {block}.',
        recipients: 'Hotkeys destinatarias',
        notRegistered: 'Aún no registradas',
        registeredAt: 'registrada en el bloque {block}',
        signersLabel: 'Firmantes · {threshold}',
        signers: [
            { label: 'Firmante 1' },
            { label: 'Firmante 2' },
            { label: 'Firmante 3' },
        ],
        thresholdNote: 'Los pagos de los programas los firma la misma multifirma: 2 cualesquiera de los 3 firmantes.',
        derives: {
            one: 'Esta {count} clave con umbral {threshold} deriva la cuenta de la reserva de arriba.',
            other: 'Estas {count} claves con umbral {threshold} derivan la cuenta de la reserva de arriba.',
        },
        notDerived: 'Estas claves no derivan la cuenta de la reserva de arriba: revisa los firmantes publicados.',
        identities: 'Las identidades no se publican.',
    },

    ctas: {
        talk: 'Habla con el equipo de UR',
        guide: 'Lee la guía del minero',
        policy: 'Política de emisión en GitHub',
    },

    fine: {
        aria: 'Metodología',
        mechanism: {
            label: 'Mecanismo.',
            body: 'SN25 emite {emission} α al día: {ownerShare} para el propietario de la subred y el resto repartido a partes iguales entre validadores y mineros, así que la asignación de los mineros es de {minerAllocation} α al día. Desde el {date}, el momentum, la parte que se usa ahora para impulsar la red, va a los proveedores como recompensas. Las hotkeys destinatarias de la reserva reciben el resto, emisiones de los mineros × (1 − momentum), así que la parte de la reserva no es fija. Disminuye a medida que crece el momentum. La página mantiene el momentum en su valor de lanzamiento hasta que la cadena muestre uno de al menos {min}, y luego sigue a la cadena.',
        },
        beforeLaunch: {
            label: 'Antes del lanzamiento.',
            labelOverdue: 'Antes del primer ingreso.',
            body: {
                onChain: 'En el bloque finalizado {block} ({time}), el {share} de la asignación de los mineros se dirigió a la hotkey del propietario de la subred y la cadena lo quemó, y la cuenta de la reserva no tenía nada. La proyección mantiene el momentum en su valor on-chain actual y no supone pagos de programas.',
                launch: 'En el bloque finalizado {block} ({time}), el {share} de la asignación de los mineros se dirigió a la hotkey del propietario de la subred y la cadena lo quemó, y la cuenta de la reserva no tenía nada. La proyección mantiene el momentum en su valor de lanzamiento y no supone pagos de programas.',
            },
        },
        balance: {
            label: 'Saldo.',
            held: 'La reserva es α en stake en SN25 bajo sus hotkeys destinatarias, propiedad de la coldkey {coldkey}, leído del estado finalizado de la cadena (bloque {block}, {time}); cualquier TAO libre se muestra por separado.',
            flows: {
                onChain: 'Los ingresos y los pagos son las subidas y bajadas entre muestras diarias, desde el registro de los destinatarios en el bloque {registered}; la proyección continúa desde el último saldo con el valor on-chain del momentum y no supone pagos de programas.',
                launch: 'Los ingresos y los pagos son las subidas y bajadas entre muestras diarias, desde el registro de los destinatarios en el bloque {registered}; la proyección continúa desde el último saldo con el valor de lanzamiento del momentum y no supone pagos de programas.',
                onChainNoBlock: 'Los ingresos y los pagos son las subidas y bajadas entre muestras diarias, desde el registro de los destinatarios; la proyección continúa desde el último saldo con el valor on-chain del momentum y no supone pagos de programas.',
                launchNoBlock: 'Los ingresos y los pagos son las subidas y bajadas entre muestras diarias, desde el registro de los destinatarios; la proyección continúa desde el último saldo con el valor de lanzamiento del momentum y no supone pagos de programas.',
            },
        },
        valuation: {
            label: 'Valoración.',
            tao: 'Las cifras en TAO son una referencia puntual, no un valor realizable: α a {price} TAO, la relación entre el TAO y el α depositados en el pool de SN25 en este bloque.',
            usd: 'Las cifras en USD son α multiplicado por el precio en vivo de α, {price} según {source}, {time}: también una referencia puntual.',
            noPrice: 'Todavía no se ha leído ningún precio de α, así que no se muestra ninguna cifra en USD.',
            inAlpha: 'No se muestra ninguna cifra en USD mientras la unidad de visualización sea α.',
        },
        sources: {
            label: 'Fuentes.',
            body: 'Tu navegador lee las cifras de la cadena de la mainnet de Bittensor a través de sus endpoints RPC públicos ({rpcHosts}; {archiveHosts} para el historial), así que esos hosts ven la solicitud. Con USD seleccionado, el precio de α se lee de los feeds de estadísticas de los operadores de red o del feed GeckoTerminal de CoinGecko ({priceHosts}). No se contacta nada más. Cuenta {account}.',
        },
    },
};
