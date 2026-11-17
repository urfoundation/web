// /dashboard ("UR Stats") in German: the translation of en.js beside it (same keys). The
// Network Capacity Reserve keeps its English name; the period buttons are 1T … 90T (T for
// Tage, as /reserve writes them). The CSS changes no letter case.
export default {
    meta: {
        title: 'UR-Statistiken',
        description: 'URnetwork und SN25 live: Nutzer, Provider online, übertragene Daten, Epochen, Auszahlungen und die Network Capacity Reserve, gelesen aus Grafana und dem Bittensor-Mainnet.',
    },

    heading: 'UR-Statistiken',

    rail: {
        brandTitle: 'Zurück zu ur.xyz',
        brandAria: 'UR, zurück zu ur.xyz',
        navAria: 'Bereiche',
        sources: 'Quellen: grafana.bringyour.com und Bittensor-Mainnet.',
    },

    // phones show moreShort in place of more (it does not begin with it)
    nav: {
        overview: 'Übersicht',
        network: 'Netzwerk',
        providers: 'Provider',
        more: 'Weitere Statistiken',
        moreShort: 'Mehr',
        method: 'So zählen wir',
    },

    ledes: {
        network: 'Datenverkehr, Nutzer und Wachstum im URnetwork.',
        providers: 'Geräte, die ihre Verbindung teilen, gezählt nach Land und Stadt, nie nach einzelnen Standorten.',
        subnet: 'Auszahlungen, Conviction und die Network Capacity Reserve, gelesen aus dem Bittensor-Mainnet.',
        more: 'Weitere Kennzahlen aus dem Monitoring des Netzwerks.',
        method: 'Was jede Zahl bedeutet und woher sie stammt.',
    },

    periods: {
        label: 'Zeitraum',
        d1: '1T',
        d3: '3T',
        d7: '7T',
        d30: '30T',
        d90: '90T',
        all: 'Alle',
    },

    org: {
        label: 'Org.',
        aria: 'GitHub-Organisation',
        all: 'Alle',
    },

    live: {
        sinceOpened: '{value}übertragen, seit du diese Seite geöffnet hast',
        stripAria: 'Live-Werte',
        usersDay: 'Nutzer (24 Stunden)',
        dataDay: 'Übertragene Daten (24 Stunden)',
        dataSinceOpened: 'Übertragene Daten, seit du diese Seite geöffnet hast',
        rightNow: 'Live',
    },

    route: {
        usersNote: 'in den letzten 24 Stunden',
        operator: 'Netzbetreiber',
        exits: 'Exits',
        exitsNote: 'Länder',
    },

    titles: {
        dailyUsers: 'Tägliche Nutzer',
        providersOnline: 'Provider online',
        dataCarried: 'Übertragene Daten',
        totalNetworks: 'Netzwerke gesamt',
        thisEpoch: 'Diese Epoche',
        totalDataCarried: 'Übertragene Daten gesamt',
        coverage: 'Abdeckung',
        countries: 'Länder',
        cities: 'Städte',
        byContinent: 'Nach Kontinent',
        sn25Subnet: 'SN25-Subnet',
        alphaPrice: 'Alpha-Preis',
        // the reserve's name, kept in English
        reserve: 'Network Capacity Reserve',
        alphaLocked: 'In Conviction gesperrtes Alpha',
        traffic: 'Datenverkehr',
        whenTrafficFlows: 'Verkehr im Tagesverlauf',
        runningTotal: 'Laufende Summe',
        users: 'Nutzer',
        growth: 'Wachstum',
        signups: 'Registrierungen',
        providers: 'Provider',
        providersByCountry: 'Provider nach Land',
        details: 'Details',
        allCountries: 'Alle Länder',
        becomeProvider: 'Provider werden',
        payouts: 'Auszahlungen',
        earned: 'Verdienst der Provider',
        conviction: 'Conviction',
        convictionLocks: 'Conviction-Sperren',
        totalLocked: 'Insgesamt gesperrt',
        perpetual: 'Unbefristet',
        decaying: 'Abklingend',
        reserveBalance: 'Saldo der Reserve',
        reserveShort: 'Reserve',
        walletAndHotkeys: 'Wallet und Hotkeys',
        throughput: 'Durchsatz',
        connectedDevices: 'Verbundene Geräte',
        newConnections: 'Neue Verbindungen',
        extendersOnline: 'Extender online',
        whereExtenders: 'Wo die Extender stehen',
        ipFamily: 'IP-Version',
        extenders: 'Extender',
    },

    common: {
        allTime: 'insgesamt',
        onlineNow: 'jetzt online',
        onAverage: 'im Schnitt',
        aDayOnAverage: 'pro Tag im Schnitt',
        // not a bare "online": the English page shows that word on its own
        online: 'jetzt online',
        allTimeChip: 'Insgesamt',
        networkIsAccount: 'Ein Netzwerk ist ein Konto. Ein Konto kann mehrere Geräte verbinden.',
        searchCountry: 'Land suchen',
    },

    // the chart's name in quotes, as dashboard/script chart.expand writes it
    expand: {
        users: 'Diagramm „Tägliche Nutzer“ vergrößern',
        providers: 'Diagramm „Provider online“ vergrößern',
        data: 'Diagramm „Übertragene Daten“ vergrößern',
        networks: 'Diagramm „Netzwerke gesamt“ vergrößern',
        total: 'Diagramm „Übertragene Daten gesamt“ vergrößern',
    },

    more: {
        network: 'Weitere Netzwerkstatistiken →',
        providers: 'Weitere Provider-Statistiken →',
        subnet: 'Weitere SN25-Statistiken →',
        other: 'Weitere Statistiken: Geräte, Verbindungen, Extender →',
    },

    globeAria: 'Globus mit den Ländern der Provider. Ziehe zum Drehen und klicke auf ein Land, um seine Zahlen zu sehen.',
    mapAria: 'Karte der Provider nach Land. Alle Länder stehen in der Tabelle unten.',

    network: {
        showTable: 'Als Tabelle anzeigen',
        styleAria: 'Diagrammdarstellung',
        clock: 'Uhr',
        bars: 'Balken',
    },

    providers: {
        liveCount: 'Eine Live-Zählung der Geräte, die ihre Verbindung teilen.',
        becomeText: 'Jeder kann seine Verbindung über die URnetwork-App teilen. Die Belohnungen richten sich nach dem Datenverkehr, den du überträgst, und werden über SN25 ausgezahlt.',
        install: 'App installieren ↗',
        rewards: 'So werden Belohnungen berechnet ↗',
    },

    subnet: {
        payoutsLede: 'SN25 bezahlt Provider alle 7 Tage.',
        convictionLede: 'Alpha, das über den Conviction-Mechanismus von Bittensor zugunsten von SN25 gesperrt ist.',
        reserveLede: 'Die Reserve finanziert Netzkapazität. {link}',
        reserveLink: 'Mehr dazu ↗',
        reservePeriodAria: 'Zeitraum für den Saldo der Reserve',
    },

    notes: {
        throughput: 'Zählt jeden Hop einer Route mit und liegt daher über den übertragenen Daten.',
        devices: 'Eindeutige Geräte mit aktiver Verbindung, Wiederverbindungen eingeschlossen.',
        connections: 'Neue Client-Sitzungen, Wiederverbindungen eingeschlossen.',
        extenders: 'Relays, die Menschen beim Verbinden helfen, wo direkte Routen blockiert sind.',
    },

    close: 'Schließen',

    footer: {
        method: 'So zählen wir →',
        home: '← Zurück zu ur.xyz',
        // {time}: "Do., 12. Nov., 14:05 Uhr Ortszeit" (dashboard/script time.local)
        updated: 'Aktualisiert am {time}.',
    },
};
