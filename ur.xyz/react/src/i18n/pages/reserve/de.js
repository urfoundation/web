// /reserve's head and hero in German: the translation of en.js beside it (same keys).
// The reserve's name, Network Capacity Reserve, stays in English as a name (the h1, the
// breadcrumb); in running text it is "die Reserve". Placeholders are filled with German
// figures and dates ("2.657", "12. Okt., 03:25 UTC").
export default {
    meta: {
        title: 'Network Capacity Reserve – Reserve für Netzkapazität | UR',
        description: 'Reserve für laufende Kapazitätsoptimierungen: Der Rest der SN25-Miner-Emissionen nach dem Momentum bezahlt Provider für verifizierte Netzkapazität. Live aus Bittensor gelesen.',
        breadcrumb: 'Network Capacity Reserve',
    },

    hero: {
        eyebrow: 'SN25 · Miner-Emissionen',
        name: 'Network Capacity Reserve',
        tagline: 'Reserve für laufende Kapazitätsoptimierungen.',
        lede: 'Die Miner-Emissionen von SN25 werden in zwei Teile aufgeteilt: das Momentum, das jetzt an Provider ausgezahlt wird, und die Reserve, die den Rest erhält. Die Reserve bezahlt Provider für verifizierte Netzkapazität: mehr Abdeckung, zuverlässigere Routen und Kapazität für neue Netzbetreiber.',
    },

    perDay: '{amount} α pro Tag',

    formula: {
        label: 'Formel',
        reserve: 'Reserve',
        minerEmissions: 'Miner-Emissionen',
        momentum: 'Momentum',
        atLaunch: 'Zum Start:',
        atBlock: 'Bei Block {block}:',
        atCurrent: 'Beim aktuellen Momentum:',
        burned: '{share} verbrannt',
        definition: '{term} ist der Anteil der Miner-Emissionen, der jetzt als Belohnungen an Provider geht und so das Netzwerk antreibt. Die Reserve ist kein fester Anteil. Sie erhält alles, was das Momentum nicht nutzt, und damit umso weniger, je größer das Momentum wird.',
        term: 'Momentum',
        noMomentumYet: 'Die Chain zeigt noch kein Momentum: Bei Block {block} erhalten die Empfänger der Reserve den Rest der Miner-Zuteilung, und die Seite folgt dem Momentum der Chain, sobald es mindestens {min} beträgt.',
    },

    wallet: {
        label: 'Reserve-Wallet',
        copy: 'Kopieren',
        copied: 'Kopiert',
        // follows either caption ("Kopieren", "Kopiert"), so it reads after both
        copyTarget: '(Wallet-Adresse)',
        copiedStatus: 'In die Zwischenablage kopiert',
        viewOnTaostats: 'Auf Taostats ansehen',
    },

    // a phone shows the lead beside the α | USD toggle: the leads are kept as short as the English
    status: {
        reading: 'Bittensor wird gelesen…',
        unavailable: 'Chain nicht erreichbar',
        retrying: 'erneuter Versuch',
        live: 'Live',
        liveDetail: 'Bittensor-Mainnet · finalisiert',
        preLaunch: 'Vor dem Start',
        awaiting: 'Erster Eingang ausstehend',
        preDetail: 'hochgerechnet aus der On-Chain-Emission',
        block: 'Block {block}',
    },

    stats: {
        balance: 'Saldo der Reserve',
        balanceReading: 'Bittensor-Mainnet wird gelesen…',
        balanceNothing: 'noch nichts erhalten',
        balanceFlows: '{received} erhalten · {spent} ausgezahlt',
        balanceReadingHistory: 'Saldoverlauf wird gelesen…',
        inflow: 'Monatlicher Zufluss',
        inflowObserved: {
            one: '{amount} α pro Tag beobachtet, letzter {count} Tag',
            other: '{amount} α pro Tag beobachtet, letzte {count} Tage',
        },
        inflowProjected: '{amount} α pro Tag hochgerechnet · Miner-Emissionen × (1 − Momentum)',
        committed: 'Für Programme zugesagt',
    },

    price: {
        unitAria: 'Anzeigeeinheit',
        // each follows "aus" (from), so each is in the dative
        sources: {
            operators: 'den Statistik-Feeds der Netzbetreiber',
            gecko: 'dem GeckoTerminal-Pool-Feed von CoinGecko',
        },
        note: 'USD zum Live-α-Preis: {price} pro α aus {source}, Stand {time}. Eine Momentaufnahme, kein realisierbarer Wert.',
        unavailable: 'α-Preis nicht verfügbar: Die Angaben bleiben in α, bis ein Preis-Feed antwortet.',
    },

    verify: 'Prüf es selbst nach: Diese Zahlen werden in deinem Browser aus dem Bittensor-Mainnet gelesen. Die Reserve wird vom Coldkey {address} gehalten; sieh sie dir auf {explorer} an.',
};
