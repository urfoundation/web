// /reserve section 04 and the fine print in German: the translation of en.js beside it (same
// keys, the lists in the order of data/reserve.js). {time} is filled as "12. Okt., 03:25 UTC";
// {source} with one of the hero's price sources, written in the dative after "aus".
export default {
    process: {
        kicker: '04 / Wie ein Programm live geht',
        title: 'Zuerst veröffentlicht, zuletzt bezahlt.',
        steps: [
            { title: 'Bedingungen veröffentlicht', detail: 'Lücke, Teilnahmevoraussetzungen, Zahlungsregel, Verifizierer.' },
            { title: 'Provider nehmen an', detail: 'Das Budget wird erst nach der Annahme reserviert.' },
            { title: 'Wöchentliche Messung', detail: 'Verifizierer signieren Beobachtungen.' },
            { title: 'Öffentliches Manifest', detail: 'Empfänger, Beträge und Nachweise.' },
            { title: '48-Stunden-Prüfung', detail: 'Vor dem Signieren zur Prüfung veröffentlicht.' },
            { title: '2 von 3 Signaturen', detail: 'Mit der kodierten Transaktion abgeglichen.' },
        ],
    },

    custody: {
        heading: 'Verwahrung',
        threshold: '2 von 3',
        accountLabel: 'Reservekonto · Multisig ({threshold})',
        onChain: 'On-Chain',
        awaitingFunds: 'Mittel ausstehend',
        modeNote: 'Das Reservekonto ist ein natives Multisig-Konto (2 von 3). Es signiert nur, um seine eigenen Empfänger zu registrieren, und zahlt die bei deren SN25-Registrierung verbrannten Beträge aus dem eigenen Saldo.',
        holds: 'Bei Block {block} hält es {tao} TAO als freies Guthaben.',
        recipients: 'Empfänger-Hotkeys',
        notRegistered: 'Noch nicht registriert',
        registeredAt: 'registriert in Block {block}',
        signersLabel: 'Unterzeichner · {threshold}',
        signers: [
            { label: 'Unterzeichner 1' },
            { label: 'Unterzeichner 2' },
            { label: 'Unterzeichner 3' },
        ],
        thresholdNote: 'Programmzahlungen werden vom selben Multisig-Konto signiert: von beliebigen 2 der 3 Unterzeichner.',
        derives: {
            one: 'Aus diesem {count} Schlüssel mit Schwellenwert {threshold} leitet sich das obige Reservekonto ab.',
            other: 'Aus diesen {count} Schlüsseln mit Schwellenwert {threshold} leitet sich das obige Reservekonto ab.',
        },
        notDerived: 'Aus diesen Schlüsseln leitet sich das obige Reservekonto nicht ab: Prüfe die veröffentlichten Unterzeichner.',
        identities: 'Identitäten werden nicht veröffentlicht.',
    },

    ctas: {
        talk: 'Mit dem UR-Team sprechen',
        guide: 'Miner-Leitfaden lesen',
        policy: 'Emissionsrichtlinie auf GitHub',
    },

    fine: {
        aria: 'Methodik',
        mechanism: {
            label: 'Mechanismus.',
            body: 'SN25 emittiert {emission} α pro Tag: {ownerShare} an den Subnet-Eigentümer, der Rest zu gleichen Teilen an Validatoren und Miner, sodass die Miner-Zuteilung {minerAllocation} α pro Tag beträgt. Ab dem {date} geht das Momentum, also der Anteil, der jetzt das Netzwerk antreibt, als Belohnungen an Provider. Die Empfänger-Hotkeys der Reserve erhalten den Rest, Miner-Emissionen × (1 − Momentum), sodass der Anteil der Reserve nicht fest ist. Mit wachsendem Momentum sinkt er. Die Seite hält das Momentum auf seinem Startwert, bis die Chain ein Momentum von mindestens {min} zeigt, und folgt dann der Chain.',
        },
        beforeLaunch: {
            label: 'Vor dem Start.',
            labelOverdue: 'Vor dem ersten Eingang.',
            body: {
                onChain: 'Beim finalisierten Block {block} ({time}) wurden {share} der Miner-Zuteilung an den Hotkey des Subnet-Eigentümers geleitet und von der Chain verbrannt, und das Reservekonto war leer. Die Hochrechnung hält das Momentum auf seinem aktuellen On-Chain-Wert und geht von keinen Programmzahlungen aus.',
                launch: 'Beim finalisierten Block {block} ({time}) wurden {share} der Miner-Zuteilung an den Hotkey des Subnet-Eigentümers geleitet und von der Chain verbrannt, und das Reservekonto war leer. Die Hochrechnung hält das Momentum auf seinem Startwert und geht von keinen Programmzahlungen aus.',
            },
        },
        balance: {
            label: 'Saldo.',
            held: 'Die Reserve besteht aus α, das unter ihren Empfänger-Hotkeys auf SN25 gestakt ist und dem Coldkey {coldkey} gehört, gelesen aus dem finalisierten Chain-Zustand (Block {block}, {time}); etwaiges freies TAO wird gesondert ausgewiesen.',
            flows: {
                onChain: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich erfassten Werten, ab der Registrierung der Empfänger in Block {registered}; die Hochrechnung schreibt den letzten Saldo mit dem On-Chain-Wert des Momentums fort und geht von keinen Programmzahlungen aus.',
                launch: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich erfassten Werten, ab der Registrierung der Empfänger in Block {registered}; die Hochrechnung schreibt den letzten Saldo mit dem Startwert des Momentums fort und geht von keinen Programmzahlungen aus.',
                onChainNoBlock: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich erfassten Werten, ab der Registrierung der Empfänger; die Hochrechnung schreibt den letzten Saldo mit dem On-Chain-Wert des Momentums fort und geht von keinen Programmzahlungen aus.',
                launchNoBlock: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich erfassten Werten, ab der Registrierung der Empfänger; die Hochrechnung schreibt den letzten Saldo mit dem Startwert des Momentums fort und geht von keinen Programmzahlungen aus.',
            },
        },
        valuation: {
            label: 'Bewertung.',
            tao: 'Angaben in TAO sind eine Momentaufnahme, kein realisierbarer Wert: α zu {price} TAO, dem Verhältnis von TAO zu α im SN25-Pool bei diesem Block.',
            usd: 'Angaben in USD sind α multipliziert mit dem Live-α-Preis, {price} aus {source}, Stand {time}: ebenfalls eine Momentaufnahme.',
            noPrice: 'Es wurde noch kein α-Preis gelesen, daher werden keine Angaben in USD angezeigt.',
            inAlpha: 'Solange die Anzeigeeinheit α ist, werden keine Angaben in USD angezeigt.',
        },
        sources: {
            label: 'Quellen.',
            body: 'Die Chain-Daten liest dein Browser über die öffentlichen RPC-Endpunkte des Bittensor-Mainnets ({rpcHosts}; {archiveHosts} für den Verlauf), daher sehen diese Hosts die Anfrage. Ist USD gewählt, wird der α-Preis aus den Statistik-Feeds der Netzbetreiber oder dem GeckoTerminal-Feed von CoinGecko gelesen ({priceHosts}). Sonst wird nichts kontaktiert. Konto {account}.',
        },
    },
};
