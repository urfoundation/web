// /dashboard: the words the page's scripts write once the data has loaded
// (react/src/components/pages/dashboard/page.js, engine.js and loader.js): the figures'
// labels and change lines, the charts' series names, tooltips and accessible names, the
// tables, the country lookup, the epochs, the conviction locks and the reserve's wallets.
// The tab names, panel titles and period buttons are the dashboard unit's.
//
// The page formats numbers, percentages, amounts (TB, GB, Gb/s, $), days and times in your
// language, so a placeholder arrives ready to print: {value} "12.3 TB", {percent} "42%",
// {date} "12 Oct", {when} "Thu 12 Nov, 14:05". {period} is the selected period as a length
// of time, from `periodLength` below ("7 days"): phrase each sentence so it reads with that
// phrase as it stands. α (alpha's symbol) follows an amount; SN25, Bittensor, UID and USDC
// stay as they are. Arrows (→) are part of the strings: point them the way your text reads.
export default {
    // the status line when the page can't read its data (under the h1, in red)
    loadError: 'Couldn’t reach the stats sources. Reload to try again.',
    // the same line in a preview of that state (the page's ?state=error)
    previewError: 'Couldn’t reach the stats source. Trying again in 1 min.',
    // at the foot of each panel whose chart, table or map couldn't load
    unavailable: 'Couldn’t load this right now',
    // in place of what the page reads from Bittensor mainnet (the reserve, its daily inflow, the conviction locks)
    // while the visitor's browser can't reach it, as a filtered network may keep it from doing; the page keeps
    // trying and fills them in once it answers
    chainUnavailable: 'Couldn’t reach Bittensor mainnet right now. Trying again.',

    // the selected period as a length of time: {period} in the sentences below
    periodLength: { d1: '24 hours', d3: '3 days', d7: '7 days', d30: '30 days', d90: '90 days' },
    // beside the period buttons, for the 1D and 3D periods (the others show their first and last days, time.days)
    lastPeriod: 'Last {period}',
    // the period's average as a label: before its figure, and on a chart's dashed line
    periodAverage: { d1: '24-hour average', d3: '3-day average', d7: '7-day average', d30: '30-day average', d90: '90-day average' },
    // under the providers online figure (Providers tab): the count now against the period's average
    vsPeriodAverage: { d1: 'vs the 24-hour average', d3: 'vs the 3-day average', d7: 'vs the 7-day average', d30: 'vs the 30-day average', d90: 'vs the 90-day average' },
    // under the data carried figure (Overview): the period's total, {value}
    periodTotal: { d3: '3-day total {value}', d7: '7-day total {value}', d30: '30-day total {value}', d90: '90-day total {value}' },

    time: {
        // when the figures were read: {time} is a day and time ("Thu 12 Nov, 14:05")
        local: '{time} local time',
        // the footer's note on time zones: {zone} is the zone's short name ("CET", "GMT+1")
        zone: 'Times in local time ({zone})',
        // … when the browser can't name the zone, and when the page shows UTC
        zoneUnknown: 'Times in local time',
        zoneUtc: 'Times in UTC',
        // spans of time in tooltips and tables: {from} and {to} are times of day ("13:00") or days
        // ("12 Oct"), {day}, {fromDay} and {toDay} days ("Thu 12 Nov")
        hours: '{from} to {to}',
        sameDay: '{day}, {from} to {to}',
        twoDays: '{fromDay}, {from} to {toDay}, {to}',
        days: '{from} – {to}',
        // the time left in an epoch, in short units: {hours} and {minutes} have two digits after a larger unit
        leftDays: '{days}d {hours}h',
        leftHours: '{hours}h {minutes}m',
    },

    // the line under a figure that compares it with the period before: the change ("↑ 12.3%") and then one of these
    change: {
        vsPrevious: 'vs previous {period}',
        vsAgo: 'vs {period} ago',
        vsDayAgo: 'vs a day ago',
        // in place of the change when the history doesn't reach back a full period
        notEnough: 'not enough history to compare',
        // in place of the change when there is none (a figure's tag)
        none: 'no change',
        // after a change counted from the start of a chart, and after a total's first day: {date} is a day or a day and time
        since: 'since {date}',
    },

    overview: {
        // under the data carried and daily users figures
        last24: 'in the last 24 hours',
        // under the providers online figure: {count} countries
        onlineInCountries: { one: 'online now, in {count} country', other: 'online now, in {count} countries' },
        // under the data carried figure: {value} is an amount ("12.3 TB") or a rate ("1.23 Gb/s"), in bold
        aDayOnAverage: '{value} a day on average',
        onAverage: '{value} on average',
        // a label (periodAverage) and its figure, in bold
        labelValue: '{label} {value}',
        // the period's highest hour, 6-hour block or day, then its figure ({value}, in bold)
        highest: { hour: 'highest hour {value}', sixHours: 'highest 6-hour block {value}', day: 'highest day {value}' },
        // under the total networks figure, after the number added ("+1,234")
        newInLast: 'new in the last {period}',
        // the alpha price's change over 24 hours, in the live strip: {change} is a signed percentage
        change24h: '{change} 24h',
        // under the reserve's balance: what flows in a day ({value} is a number of α)
        alphaPerDay: '+{value} α a day',
    },

    // the country lookups (the Overview's globe card, the Providers tab's details card and table)
    country: {
        // the Overview's card before a pick
        prompt: 'Search or click a country to see its stats.',
        // under a country's name: its continent, then its rank among {total} countries
        rank: '{continent} · rank {rank} of {total}',
        // accessible name of the button that closes a country's or continent's card: {name} is its name
        clear: 'Clear {name}',
        shareOfAllProviders: 'Share of all providers',
        shareOfAll: 'Share of all',
        continentShare: 'Continent share',
        nearby: 'Nearby in the ranking',
        // under a continent's name
        continent: { one: 'Continent · {count} country', other: 'Continent · {count} countries' },
        topCountries: 'Top countries',
        worldwide: 'Worldwide',
        worldwideHint: 'Search, click a dot, or open a continent',
        // the search's messages: {query} is what the visitor typed
        several: 'Several countries match. Keep typing or pick one from the list.',
        none: 'No country called “{query}” has providers online.',
        // under the continents: {share} is a percentage
        top3: 'Top 3 countries hold {share} of providers online.',
        // a country's change over the period (tooltips, cards, the table's last column)
        changeLast: 'Change, last {period}',
        // a country's share of all providers online (tooltips, the table's column)
        share: 'Share',
        // in a country's tooltip on the globe and the map
        clickToPin: 'Click to pin',
        // the table of countries: its column headings, a chip beside a newly listed country and the button under it
        tableCountry: 'Country',
        tableOnline: 'Online now',
        newChip: 'New',
        showTop: 'Show top 15',
        showAll: { one: 'Show all {count} country', other: 'Show all {count} countries' },
        // under the providers online figure (Providers tab)
        averageOnline: 'Average online, last {period}',
        highestLast: { hour: 'Highest hour, last {period}', sixHours: 'Highest 6-hour block, last {period}', day: 'Highest day, last {period}' },
    },

    continents: {
        NA: 'North America',
        EU: 'Europe',
        AS: 'Asia',
        SA: 'South America',
        AF: 'Africa',
        OC: 'Oceania',
    },

    chart: {
        // accessible name of a chart's expand button: {title} is the panel's title as shown ("Data carried")
        expand: 'Expand the {title} chart',
        // a tooltip's value where the monitoring has no data
        noData: 'no data (monitoring gap)',
        // the label of a chart's last point, the live figure (the How we count tab calls these "Now")
        nowOnline: 'Now, online',
        nowLast24: 'Now, last 24 hours',
        // series names, in tooltips
        usersToThen: 'Users, 24 hours to then',
        carried: 'Carried',
        carriedPer: { hour: 'Carried per hour', sixHours: 'Carried per 6 hours', day: 'Carried per day' },
        signupsPer: { hour: 'Sign-ups per hour', sixHours: 'Sign-ups per 6 hours', day: 'Sign-ups per day' },
        onlineAverage: 'Online, average',
        networksAllTime: 'Networks, all time',
        sevenDayAverage: '7-day average',
        totalCarried: 'Total carried',
        approx: 'Approx.',
        average: 'Average',
        total: 'Total',
        withProvider: 'With a provider online',
        balance: 'Balance',
        devicesDaily: 'Devices, daily average',
        aDay: 'A day',
        // an hourly amount: {value} is "123 GB"
        perHour: '{value} an hour',
        // the data carried chart's legend: its columns, then its line (sevenDayAverage) or last column
        legendPer: { hour: 'Per hour', sixHours: 'Per 6 hours', day: 'Per day' },
        latest: 'Latest',
        // the enlarged total data carried chart's chip, in place of the period buttons
        allRecorded: 'All recorded',
        // accessible names of the countries' and cities' small charts, and of the connections chart
        countriesAria: 'countries',
        citiesAria: 'cities',
        connectionsAria: 'New connections a day',
        // the hour-of-day clock: the word in its centre, above the busiest hour, and its accessible name
        busiest: 'Busiest',
        clockAria: 'Average data carried in each hour of the day, as a clock',
    },

    network: {
        // the data carried table's first column: hours (1D, 3D), then days
        tableTime: 'Time',
        tableDay: 'Day (UTC)',
        // the second figure's title: an hour's average in the 1D view, a day's otherwise
        averageHour: 'Average an hour',
        averageDay: 'Average a day',
        // the third figure's title, and under it the comparison ({value} is an amount)
        busiest: { hour: 'Busiest hour', sixHours: 'Busiest 6 hours', day: 'Busiest day' },
        vsAverage: { hour: 'vs {value} in an average hour', sixHours: 'vs {value} in an average 6 hours', day: 'vs {value} average this period' },
        // after the number of sign-ups, in small type
        aDay: 'a day',
        // under the hour-of-day chart: {busy} and {quiet} are hours of the day ("18:00")
        busiestQuietest: 'Busiest around {busy}, quietest around {quiet}, local time.',
        // the users figures: the last 24 hours, and the last epoch ({n}) with its dates
        last24: 'Last 24 hours',
        epochDates: 'Epoch {n}, {from} – {to}',
        // the growth figures
        networksAdded: 'Networks added, last {period}',
        growthLast: 'Growth, last {period}',
        // the number of networks at the period's start and at its end ("1.21M → 1.25M")
        growthRange: '{from} → {to}',
        newEvery: 'A new network every',
        seconds: { one: '{count} second', other: '{count} seconds' },
        // {count} has one decimal ("2.5")
        minutes: { one: '{count} minute', other: '{count} minutes' },
        onAverageLast: 'on average, last {period}',
        // the running total's chip: {date} is its first day
        sinceChip: 'Since {date}',
    },

    epoch: {
        current: 'Current epoch',
        // {n} is the epoch's number
        name: 'Epoch {n}',
        // under it: {percent} done, {left} the time left (time.leftDays), {when} its end, {block} its last block
        progress: '{percent} complete · {left} left · ends {when}, block {block}',
        // the Overview's epoch strip: {epoch} is the epoch's name (above), in bold
        overview: '{epoch} · {percent} complete',
        usersThisEpoch: 'Users this epoch',
        dataThisEpoch: 'Data carried this epoch',
        timeLeft: 'Time left',
        // under each: the last epoch's figure ({value}) and number ({n}), or when this one ends
        inEpoch: '{value} in epoch {n}',
        ends: 'ends {when}',
        // the timeline: E{n} is an epoch's short name, then "now" or its first day
        short: 'E{n}',
        shortNow: 'E{n} · now',
        shortOn: 'E{n} · {date}',
        // the epochs table: its first two columns, then each row's dates ({from} – now for this epoch)
        tableEpoch: 'Epoch',
        tableDates: 'Dates',
        now: 'now',
        // what providers earned: after the amount and a dot
        paid: 'paid',
        pending: 'payout pending',
        inProgress: 'in progress',
        // in place of the amount until the epoch settles
        atSettlement: 'at settlement',
        // a testing epoch's row, on hover
        testing: 'Testing epoch: providers were still paid in USDC',
        // the button that shows the earlier epochs: one ({n}) or a range ({from}–{to})
        show: 'Show epoch {n}',
        showRange: 'Show epochs {from}–{to}',
        hide: 'Hide epoch {n}',
        hideRange: 'Hide epochs {from}–{to}',
        // under the total earned: amounts ({value}, "1,234 α", in bold) paid and pending, a link,
        // and the current epoch's amount so far
        paidValue: '{value} paid',
        pendingValue: '{value} payout pending',
        schedule: 'Payout schedule →',
        inProgressValue: '{value} · epoch {n} in progress',
    },

    conviction: {
        // under the total: {percent} of all alpha in circulation
        ofOutstanding: '{percent} of alpha outstanding',
        // under the perpetual and decaying amounts
        perpetualLocks: { one: '{count} lock, no unlock date', other: '{count} locks, no unlock date' },
        decayingLocks: { one: '{count} lock, unlocking gradually', other: '{count} locks, unlocking gradually' },
        // the locks table's columns (and its share column, country.share), and the team's tag
        wallet: 'Wallet',
        locked: 'Locked',
        type: 'Type',
        team: 'UR team',
        // {block} is a block number
        readAt: 'Read from Bittensor mainnet at block {block}.',
    },

    reserve: {
        // after the balance's change ("+1,234 α"): over the last {count} days
        inLastDays: { one: 'in the last {count} day', other: 'in the last {count} days' },
        // the wallets: the reserve's own, then each hotkey ({uid} is its number on SN25)
        wallet: 'Reserve wallet · 2-of-3 multisig',
        hotkey: 'Hotkey · UID {uid}',
        receives: 'Receives on SN25 through two hotkeys it owns',
        // the copy buttons: their accessible names, then what they say once clicked ({name} is a wallet's label above)
        copy: 'Copy {name} address',
        copied: 'Copied the {name}.',
        copyBlocked: 'Copy is blocked here. Select the address instead.',
    },

    // the IP family bars: each part's label, then its tooltip and legend ({value} is a count)
    ipFamily: {
        v4: 'IPv4 only',
        dual: 'Dual-stack',
        v6: 'IPv6 only',
        title: '{label}: {value}',
        legend: '{label} {value}',
    },
};
