// /reserve section 01 in German: the translation of en.js beside it (same keys).
// Dates are filled as German formats them ("12. Okt.", "12. Okt. 27", "Oktober 2026").
export default {
    kicker: '01 / Die Reserve',
    title: 'Saldo der Reserve.',
    sub: {
        live: {
            onChain: 'Der Saldo und seine Zu- und Abflüsse nach Monat, gelesen aus dem finalisierten Chain-Zustand und bis zum {date} beim On-Chain-Wert des Momentums hochgerechnet.',
            launch: 'Der Saldo und seine Zu- und Abflüsse nach Monat, gelesen aus dem finalisierten Chain-Zustand und bis zum {date} beim Startwert des Momentums hochgerechnet.',
        },
        projected: {
            onChain: 'Was aus der Richtlinie folgt, bis die Reserve Emission erhält: Miner-Emissionen × (1 − Momentum), beim On-Chain-Wert des Momentums und ohne Programmzahlungen.',
            launch: 'Was aus der Richtlinie folgt, bis die Reserve Emission erhält: Miner-Emissionen × (1 − Momentum), beim Startwert des Momentums und ohne Programmzahlungen.',
        },
    },

    controls: {
        windowAria: 'Diagrammzeitraum',
        // T for Tage, as the site writes days ("{d}T {h}h")
        last7: '7T',
        last30: '30T',
        all: 'Alle',
        expand: 'Vergrößern',
        collapse: 'Verkleinern',
        // follow either caption: "Vergrößern des Saldo-Diagramms", "Verkleinern des Saldo-Diagramms"
        balanceChart: 'des Saldo-Diagramms',
        flowsChart: 'des Zufluss-Diagramms',
    },

    series: {
        live: 'Live-Saldo',
        projected: 'Hochrechnung',
        received: 'Eingänge',
        spent: 'Ausgaben',
        projectedInflow: 'Hochgerechneter Zufluss',
    },
    today: 'heute',
    nothingThisPeriod: 'Nichts in diesem Zeitraum',
    nothingToChart: 'Noch nichts darzustellen: Die Reserve hat bisher keine Emission erhalten.',
    unitUsd: 'USD zum Live-α-Preis',

    balance: {
        label: {
            liveProjected: 'Saldo der Reserve · live, hochgerechnet bis {date}',
            live: 'Saldo der Reserve · live',
            projected: 'Saldo der Reserve · hochgerechnet bis {date}',
            plain: 'Saldo der Reserve',
            window: {
                one: 'Saldo der Reserve · letzter {count} Tag',
                other: 'Saldo der Reserve · letzte {count} Tage',
            },
        },
        projectedTo: '→ {amount} bis zum {date}',
        windowChange: {
            one: '{change} über den letzten {count} Tag',
            other: '{change} über die letzten {count} Tage',
        },
        note: {
            live: {
                onChain: 'Live-Saldo, täglich aus dem finalisierten Chain-Zustand erfasst; hochgerechnet mit Miner-Emissionen × (1 − Momentum) beim On-Chain-Wert des Momentums und ohne Programmzahlungen.',
                launch: 'Live-Saldo, täglich aus dem finalisierten Chain-Zustand erfasst; hochgerechnet mit Miner-Emissionen × (1 − Momentum) beim Startwert des Momentums und ohne Programmzahlungen.',
            },
            projected: {
                onChain: 'Hochgerechnet mit Miner-Emissionen × (1 − Momentum) beim On-Chain-Wert des Momentums und ohne Programmzahlungen. Wechselt zum Live-Saldo, sobald die Reserve Emission erhält.',
                launch: 'Hochgerechnet mit Miner-Emissionen × (1 − Momentum) beim Startwert des Momentums und ohne Programmzahlungen. Wechselt zum Live-Saldo, sobald die Reserve Emission erhält.',
            },
            window: 'Live-Saldo, täglich aus dem finalisierten Chain-Zustand erfasst.',
            readingHistory: 'Der Saldoverlauf wird gelesen…',
        },
        // a German short date ends in a period ("12. Okt."): no sentence ends on one
        aria: {
            liveProjected: 'Saldo der Reserve, {unit}: live bis zum {liveDate}, danach hochgerechnet auf {amount} bis zum {date}; mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
            live: 'Saldo der Reserve, {unit}: live bis zum {liveDate}; mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
            projected: 'Saldo der Reserve, {unit}: hochgerechnet auf {amount} bis zum {date}; mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
            window: {
                one: 'Saldo der Reserve, {unit}, über den letzten {count} Tag, von der Chain gelesen. Mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
                other: 'Saldo der Reserve, {unit}, über die letzten {count} Tage, von der Chain gelesen. Mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
            },
        },
    },

    flows: {
        label: 'Monatlicher Zufluss · Programmausgaben',
        windowLabel: 'Täglicher Zufluss · Programmausgaben',
        received: '{amount} erhalten',
        toPrograms: '→ {amount} bisher an Programme',
        toProgramsWindow: {
            one: '→ {amount} an Programme, letzter {count} Tag',
            other: '→ {amount} an Programme, letzte {count} Tage',
        },
        readingHistory: 'Saldoverlauf wird gelesen…',
        perMonth: '{amount} pro Monat',
        projectedNoPrograms: 'hochgerechnet · ohne Programmzahlungen',
        note: {
            live: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich von der Chain erfassten Werten; der Zufluss nach dem letzten erfassten Wert wird mit demselben Momentum hochgerechnet wie der Saldo.',
            projected: 'Bis die Reserve Emission erhält, ist jeder Monat hochgerechnet.',
            window: 'Eingänge und Auszahlungen sind die Anstiege und Rückgänge zwischen den täglich von der Chain erfassten Werten.',
        },
        aria: {
            live: {
                one: 'Monatlicher Zufluss und Programmausgaben, {unit}: {count} Monat von {from} bis {to}, erhalten und ausgegeben laut Chain, danach hochgerechnet. Mit den Pfeiltasten lässt sich jeder Monat einzeln abrufen.',
                other: 'Monatlicher Zufluss und Programmausgaben, {unit}: {count} Monate von {from} bis {to}, erhalten und ausgegeben laut Chain, danach hochgerechnet. Mit den Pfeiltasten lässt sich jeder Monat einzeln abrufen.',
            },
            projected: {
                one: 'Monatlicher Zufluss und Programmausgaben, {unit}: {count} Monat von {from} bis {to}, vollständig hochgerechnet. Mit den Pfeiltasten lässt sich jeder Monat einzeln abrufen.',
                other: 'Monatlicher Zufluss und Programmausgaben, {unit}: {count} Monate von {from} bis {to}, vollständig hochgerechnet. Mit den Pfeiltasten lässt sich jeder Monat einzeln abrufen.',
            },
            window: {
                one: 'Täglicher Zufluss und Programmausgaben, {unit}, über den letzten {count} Tag, von der Chain gelesen. Mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
                other: 'Täglicher Zufluss und Programmausgaben, {unit}, über die letzten {count} Tage, von der Chain gelesen. Mit den Pfeiltasten lässt sich jeder Tag einzeln abrufen.',
            },
        },
    },

    // column headers as nouns, short enough for the four columns on a phone
    table: {
        show: 'Als Tabelle anzeigen',
        day: 'Tag',
        month: 'Monat',
        balance: 'Saldo',
        change: 'Änderung',
        basis: 'Basis',
        received: 'Eingänge',
        spent: 'Ausgaben',
        projected: 'Hochrechnung',
        chain: 'Chain',
        basisProjected: 'Hochrechnung',
    },

    splits: {
        received: {
            title: 'Alles, was die Reserve erhalten hat',
            spent: 'Ausgegeben',
            committed: 'Zugesagt',
            unallocated: 'Nicht zugewiesen',
        },
        heading: 'Wohin die Miner-Zuteilung fließt',
        emission: {
            title: 'SN25-Emission',
            owner: 'Subnet-Eigentümer',
            validators: 'Validatoren',
            miners: 'Miner-Zuteilung',
            note: 'Der Eigentümeranteil beträgt {share}; Validatoren und Miner teilen sich den Rest zu gleichen Teilen.',
        },
        onChain: {
            title: 'Miner-Zuteilung, aktuell On-Chain',
            momentum: 'Momentum, an Provider',
            reserve: 'Reserve',
            burned: 'An den Eigentümer, verbrannt',
            noteLive: 'Die Reserve erhält, was das Momentum übrig lässt: 1 − Momentum.',
            noteOnChain: 'Das Momentum ist jetzt On-Chain: {momentum} α pro Tag gehen an Provider. Die Reserve erhält den Rest, 1 − Momentum ({reserve} α pro Tag), sobald an ihre Hotkeys ausgezahlt wird.',
            notePreLaunch: 'Ab dem {date} geht das Momentum an Provider ({momentum} α pro Tag), und die Reserve erhält den Rest, 1 − Momentum ({reserve} α pro Tag). Bis dahin verbrennt die Chain den an den Eigentümer geleiteten Anteil.',
        },
        planned: {
            title: 'Miner-Zuteilung ab dem {date}',
            momentum: 'Momentum, an Provider',
            reserve: 'Reserve, 1 − Momentum',
            note: 'Die Live-Aufteilung erscheint, sobald die Chain antwortet.',
        },
        // language-neutral templates: the same in German as in English
        bar: {
            summary: '{title}: {segments}',
            segment: '{label} {value}',
            tip: '{label}: {value}',
            tipShare: '{label}: {value} ({share})',
        },
    },
};
