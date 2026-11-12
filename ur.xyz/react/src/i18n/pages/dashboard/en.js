// /dashboard, "UR Stats": the live URnetwork and SN25 dashboard. This unit holds the page's
// head and the words of its markup (react/src/components/pages/dashboard/body.html, whose
// {{key}} tokens name these keys), apart from the How we count tab (unit dashboard/method)
// and what the page's scripts write once the data has loaded (unit dashboard/script, which
// also reads the tab names, ledes, panel titles and period labels below).
//
// Not translated: UR, URnetwork, SN25, Bittensor, BringYour, Grafana, α (alpha's symbol),
// hostnames (ur.xyz, grafana.bringyour.com) and the GitHub organisations' names. Arrows
// (→ ← ↗) are part of the strings: point them the way your text reads (Arabic: ← and ↖).
// The CSS changes no letter case.
export default {
    meta: {
        // the page's <title>, also its og:title, twitter:title and og:image:alt: at most 60 characters
        title: 'UR Stats',
        // the meta description (also og:description and twitter:description): at most 175 characters
        description: 'Live URnetwork and SN25 stats: users, providers online, data carried, epochs, payouts and the Network Capacity Reserve, read from Grafana and Bittensor mainnet.',
    },

    // the page's h1 on the Overview tab (each other tab's h1 is its tab name, nav below)
    heading: 'UR Stats',

    // the section rail: a column on the left on wide screens, a row of tabs on phones
    rail: {
        // the UR logo, a link to the home page: its tooltip, then its accessible name
        brandTitle: 'Back to ur.xyz',
        brandAria: 'UR, back to ur.xyz',
        // accessible name of the list of tabs
        navAria: 'Sections',
        // small print at the foot of the rail
        sources: 'Sources: grafana.bringyour.com and Bittensor mainnet.',
    },

    // the tabs (the SN25 tab is "SN25" in every language). On phones five tabs share one row,
    // so keep them short (about 10 characters). Each is also its tab's h1.
    nav: {
        overview: 'Overview',
        network: 'Network',
        providers: 'Providers',
        // the More stats tab: `more` on wide screens; phones show only `moreShort` (very short).
        // When `more` begins with `moreShort` (as in English) the page shows the rest of `more`
        // after it; otherwise it shows each whole
        more: 'More stats',
        moreShort: 'More',
        // the How we count tab (on phones it is a link in the page's footer)
        method: 'How we count',
    },

    // the line under each tab's h1 (the Overview has none)
    ledes: {
        network: 'Traffic, users and growth on URnetwork.',
        providers: 'Devices sharing their connection, counted by country and city, never by individual location.',
        subnet: 'Payouts, conviction and the Network Capacity Reserve, read from Bittensor mainnet.',
        more: 'Other figures from the network’s monitoring.',
        method: 'What each number means and where it comes from.',
    },

    // the period selector (a sticky bar under the h1, and in the enlarged chart)
    periods: {
        // its label, also the accessible name of the period buttons
        label: 'Period',
        // the period buttons: 1 day, 3 days, 7 days, 30 days, 90 days. Two or three characters each;
        // the How we count tab names them too
        d1: '1D',
        d3: '3D',
        d7: '7D',
        d30: '30D',
        d90: '90D',
        // the reserve chart's own third button: its whole history
        all: 'All',
    },

    // a GitHub organisation filter (not shown at present): its label, accessible name and first button
    org: {
        label: 'Org',
        aria: 'GitHub organisation',
        all: 'All',
    },

    // the live figures
    live: {
        // beside the Overview's h1: {value} is the data carried since the visitor opened the page,
        // counting up in large type ("1.25 GB"); the page lays it out apart from the words, so no
        // space is needed after it
        sinceOpened: '{value}carried since you opened this page',
        // a strip of live figures (not shown at present): its accessible name and labels
        stripAria: 'Live values',
        usersDay: 'Users (24 hours)',
        dataDay: 'Data carried (24 hours)',
        dataSinceOpened: 'Data carried since you opened this page',
        // the tag of the live strip and of the Network tab's live route (also its accessible name)
        rightNow: 'Right now',
    },

    // the Network tab's live route: users → network operator → providers → exits. Each figure
    // has a label above it and a note below it
    route: {
        usersNote: 'in the last 24 hours',
        operator: 'Network operator',
        exits: 'Exits',
        // below the number of countries the exits are in
        exitsNote: 'countries',
    },

    // panel titles, headings and figure labels, used across the tabs (and by the scripts for the
    // charts' accessible names and the enlarged chart's title)
    titles: {
        dailyUsers: 'Daily users',
        providersOnline: 'Providers online',
        dataCarried: 'Data carried',
        totalNetworks: 'Total networks',
        thisEpoch: 'This epoch',
        totalDataCarried: 'Total data carried',
        coverage: 'Coverage',
        countries: 'Countries',
        cities: 'Cities',
        byContinent: 'By continent',
        sn25Subnet: 'SN25 subnet',
        alphaPrice: 'Alpha price',
        reserve: 'Network Capacity Reserve',
        alphaLocked: 'Alpha locked in conviction',
        traffic: 'Traffic',
        whenTrafficFlows: 'When traffic flows',
        runningTotal: 'Running total',
        users: 'Users',
        growth: 'Growth',
        signups: 'Sign-ups',
        providers: 'Providers',
        providersByCountry: 'Providers by country',
        details: 'Details',
        allCountries: 'All countries',
        becomeProvider: 'Become a provider',
        payouts: 'Payouts',
        earned: 'Earned by providers',
        conviction: 'Conviction',
        convictionLocks: 'Conviction locks',
        totalLocked: 'Total locked',
        perpetual: 'Perpetual',
        decaying: 'Decaying',
        reserveBalance: 'Reserve balance',
        reserveShort: 'Reserve',
        walletAndHotkeys: 'Wallet and hotkeys',
        throughput: 'Throughput',
        connectedDevices: 'Connected devices',
        newConnections: 'New connections',
        extendersOnline: 'Extenders online',
        whereExtenders: 'Where extenders are',
        ipFamily: 'IP family',
        extenders: 'Extenders',
    },

    // short labels beside or under a figure
    common: {
        allTime: 'all time',
        onlineNow: 'online now',
        onAverage: 'on average',
        aDayOnAverage: 'a day on average',
        // after the number of extenders online, in smaller type
        online: 'online',
        // a chip beside a panel title
        allTimeChip: 'All time',
        networkIsAccount: 'A network is an account. One account can connect several devices.',
        // the country search box: its (hidden) label and its placeholder
        searchCountry: 'Search a country',
    },

    // the expand buttons beside the Overview's charts (accessible names; the page writes the other
    // charts' with dashboard/script chart.expand)
    expand: {
        users: 'Expand the daily users chart',
        providers: 'Expand the providers online chart',
        data: 'Expand the data carried chart',
        networks: 'Expand the total networks chart',
        total: 'Expand the total data carried chart',
    },

    // links to another tab
    more: {
        network: 'More network stats →',
        providers: 'More provider stats →',
        subnet: 'More SN25 stats →',
        other: 'More stats: devices, connections, extenders →',
    },

    // the Overview's globe (accessible name; drag and click are pointer actions)
    globeAria: 'Globe of provider countries. Drag to rotate, click a country to see its numbers.',
    // the Providers tab's map (accessible name)
    mapAria: 'Map of providers by country. Every country is listed in the table below.',

    network: {
        // a toggle under the data carried chart that shows its figures as a table
        showTable: 'Show as table',
        // the hour-of-day chart's two styles: the buttons' accessible name and labels
        styleAria: 'Chart style',
        clock: 'Clock',
        bars: 'Bars',
    },

    providers: {
        liveCount: 'A live count of devices sharing their connection.',
        becomeText: 'Anyone can share their connection from the URnetwork app. Rewards depend on the traffic you carry and are paid through SN25.',
        // links (to ur.io and to ur.xyz/miners)
        install: 'Install the app ↗',
        rewards: 'How rewards are calculated ↗',
    },

    subnet: {
        payoutsLede: 'SN25 pays providers every 7 days.',
        convictionLede: "Alpha locked behind SN25 under Bittensor's conviction mechanism.",
        // {link} is the link `reserveLink` (to ur.xyz/reserve), after the sentence in English
        reserveLede: 'The reserve funds network capacity. {link}',
        reserveLink: 'Details ↗',
        // accessible name of the reserve chart's period buttons (7D, 30D, All)
        reservePeriodAria: 'Reserve balance period',
    },

    // notes under the More stats tab's charts (the How we count tab repeats the last three)
    notes: {
        throughput: 'Counts every hop of a route, so it runs higher than data carried.',
        devices: 'Distinct devices with a live connection, reconnects included.',
        connections: 'New client sessions, reconnects included.',
        extenders: 'Relays that help people connect where direct routes are blocked.',
    },

    // the enlarged chart's close button (accessible name)
    close: 'Close',

    footer: {
        // links: to the How we count tab (phones only) and to the home page
        method: 'How we count →',
        home: '← Back to ur.xyz',
        // {time} is when the figures were read, e.g. "Thu 12 Nov, 14:05 local time" (dashboard/script time.local)
        updated: 'Updated {time}.',
    },
};
