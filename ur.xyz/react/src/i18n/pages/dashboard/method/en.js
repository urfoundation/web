// /dashboard's How we count tab: what each figure on the page means and where it comes from
// (react/src/components/pages/dashboard/body.html). Its sections are titled with the tab names
// (unit dashboard, nav), and a definition whose term is a panel title elsewhere on the page is
// headed with that title (unit dashboard, titles); the headings below are the others.
//
// Not translated: SN25, Bittensor, BringYour, Grafana, USDC, Gb/s, hostnames. "Alpha" is SN25's
// token. Figures written into the text (7 days, 50,400 blocks, 90 days) are yours to format.
export default {
    headings: {
        usersPerEpoch: 'Users per epoch',
        networksAndSignups: 'Networks and sign-ups',
        hourlyDataCarried: 'Hourly data carried',
        countriesAndCities: 'Countries and cities',
        change: 'Change',
        payoutEpochs: 'Payout epochs',
        operatorDeposits: 'Operator deposits',
        // the last two sections' titles
        periods: 'Periods',
        sources: 'Sources',
    },

    // each definition, under its heading
    defs: {
        // Network
        dataCarried: "Data moved through the network for its users, as counted by the operator's monitoring. The big number is the last 24 hours. The period's total and daily average are shown below it. Averages in Gb/s spread it evenly over the period.",
        dailyUsers: "Accounts that moved data in a 24-hour window. A hosted proxy and the clients behind it count as one account. The big number is the last 24 hours, read when the page opens. The period's average is shown below it and as a dashed line on the chart.",
        usersPerEpoch: "Accounts that moved data in an epoch, SN25's 7-day payout period, each counted once however many days it was active.",
        networksAndSignups: 'A network is an account. One account can connect several devices. Sign-ups are networks created in the period.',
        whenTrafficFlows: "The period's average day, hour by hour, in local time. The hourly shape comes from throughput and is scaled so the 24 hours add up to an average day of data carried.",
        // {d1} and {d3} are the period buttons 1D and 3D (unit dashboard, periods)
        hourlyDataCarried: "In the {d1} and {d3} views, the last 24 hours and the 48 before them are measured totals. Each hour gets its share of its total in proportion to that hour's throughput.",
        runningTotal: 'Data carried added up day by day from the first day our stats keep.',
        // Providers
        providersOnline: "Devices sharing their connection. The big number is the count online now. The period's average and highest point are shown below it, and the average as a dashed line on the chart.",
        countriesAndCities: 'Where providers are, never where users are. Locations are shown by country, and no provider is shown individually.',
        change: "The count now against the count at the start of the period. Where our stats don't reach back that far, no change is shown.",
        // SN25
        payoutEpochs: 'SN25 settles payouts every 7 days (50,400 blocks). Users and data carried per epoch use the same boundaries.',
        // {link} is a link to the payout schedule, written ur.xyz/mainnet
        earned: "Alpha earned by providers in finished epochs and the current one, still in progress, from the subnet's miner emissions. It shows as pending until the payout is confirmed paid; providers claim it themselves. The payout schedule is on {link}. Epochs 0 and 1 were testing, when providers were still paid in USDC.",
        operatorDeposits: 'Alpha that network operators pay into SN25 for the traffic they use.',
        reserve: "A wallet held by a 2-of-3 multisig that receives part of SN25's provider emissions through two hotkeys it owns, and funds network capacity.",
        // More stats (the other three repeat the More stats tab's notes, unit dashboard, notes)
        throughput: 'Data moving through the network each second, counted on every hop of a route, so it runs higher than data carried.',
    },

    // the Periods section. {d1} … {d90} are the period buttons 1D, 3D, 7D, 30D and 90D (unit dashboard,
    // periods); "Now" is the word that starts the live points' labels in the charts' tooltips
    // (unit dashboard/script, chart.nowOnline and chart.nowLast24)
    periods: "{d1} and {d3} end at the last full hour, in hourly and 6-hour steps. {d7}, {d30} and {d90} use full UTC days and end at the last full day. Each change compares with the period of the same length just before it. Figures marked Now are live and don't follow the period. Times are in local time.",

    // the Sources section: what each source gives (beside its name: grafana.bringyour.com, or chainName)
    sources: {
        // the source's name, in the list beside grafana.bringyour.com
        chainName: 'Bittensor mainnet',
        grafana: "Network and provider figures, from BringYour's monitoring, with 90 days of history",
        chain: "Payout epochs, the reserve and its hotkeys, read through Bittensor's public nodes",
        // {time} is when the page read them, e.g. "Thu 12 Nov, 14:05 local time" (unit dashboard/script, time.local)
        note: "Figures are read from these sources each time the page opens (last read {time}). A copy of each day's totals is kept with the site, so the charts can reach further back than Grafana's 90 days.",
    },
};
