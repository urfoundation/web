// /reserve, section 01: the reserve's balance and its flows (two charts, the
// table under each, the 7D / 30D / All window) and the bars showing where SN25's
// emission and the miner allocation go (react/src/components/pages/Reserve.jsx,
// reserve/ChartControls.jsx, reserve/XYChart.jsx, reserve/SplitBar.jsx).
//
// Placeholders: {amount} and {change} are formatted figures in α or USD
// ("972.4K α", "+18.6K α", "$1.91M"); {date}, {liveDate}, {from} and {to} are
// dates ("12 Oct 27", "October 2026"); {count} a number of days or months;
// {unit} is "α" or unitUsd below; {share} a percentage; {momentum} and {reserve}
// numbers of α. An arrow "→" in a string points from the figure before it to the
// one it introduces: in Arabic write "←". The words of the formula
// "miner emissions × (1 − momentum)" are as in the hero (../en.js, formula).
export default {
    // the section's number and name, shown in capitals
    kicker: '01 / The reserve',
    // the section's heading
    title: 'Reserve balance.',
    // the paragraph under the heading: once the reserve receives emission ({date}: the day the
    // projection runs to), and before; each by where momentum's value comes from, the chain or launch
    sub: {
        live: {
            onChain: "The balance and its flows by month, read from finalized chain state and projected to {date} at momentum's on-chain value.",
            launch: "The balance and its flows by month, read from finalized chain state and projected to {date} at momentum's launch value.",
        },
        projected: {
            onChain: 'What the policy implies until the reserve receives emission: miner emissions × (1 − momentum), with momentum at its value on chain, and no programs paid.',
            launch: 'What the policy implies until the reserve receives emission: miner emissions × (1 − momentum), with momentum at its launch value, and no programs paid.',
        },
    },

    // the charts' controls (reserve/ChartControls.jsx)
    controls: {
        // accessible name of the window toggle
        windowAria: 'Chart window',
        // the toggle's captions: the last 7 days, the last 30 days, everything; keep them as short
        last7: '7D',
        last30: '30D',
        all: 'All',
        // the button widening a chart to the full row, and back (shown in capitals)
        expand: 'Expand',
        collapse: 'Collapse',
        // not shown: what a screen reader hears after the button's caption ("Expand the balance chart")
        balanceChart: 'the balance chart',
        flowsChart: 'the inflow chart',
    },

    // the charts' series, named in their legends and tooltips; keep them short
    series: {
        live: 'Live balance',
        projected: 'Projected',
        received: 'Received',
        spent: 'Spent',
        projectedInflow: 'Projected inflow',
    },
    // a marker on the balance chart where the live history ends
    today: 'today',
    // a chart tooltip's line for a period with nothing in it
    nothingThisPeriod: 'Nothing this period',
    // in place of a chart while there is nothing to draw
    nothingToChart: 'Nothing to chart yet: the reserve has received no emission.',
    // {unit} in the charts' accessible names while the figures are in USD
    unitUsd: 'USD at the live α price',

    // the balance chart's card
    balance: {
        // the card's label, shown in capitals
        label: {
            liveProjected: 'Reserve balance · live, projected to {date}',
            live: 'Reserve balance · live',
            projected: 'Reserve balance · projected to {date}',
            plain: 'Reserve balance',
            // in the 7D or 30D window: the {count} days of history shown
            window: {
                one: 'Reserve balance · last {count} day',
                other: 'Reserve balance · last {count} days',
            },
        },
        // after the balance today: where the projection ends
        projectedTo: '→ {amount} by {date}',
        // after the balance today, in a window: its change over the window
        windowChange: {
            one: '{change} over the last {count} day',
            other: '{change} over the last {count} days',
        },
        // the note under the chart: with a live history and before one, each by where momentum's
        // value comes from; in a window; and the sentence added while the history is still read
        note: {
            live: {
                onChain: 'Live balance sampled daily from finalized chain state; projected at miner emissions × (1 − momentum) with momentum at its value on chain, and no program payments.',
                launch: 'Live balance sampled daily from finalized chain state; projected at miner emissions × (1 − momentum) with momentum at its launch value, and no program payments.',
            },
            projected: {
                onChain: 'Projected at miner emissions × (1 − momentum) with momentum at its value on chain and no programs paid. Switches to the live balance once the reserve receives emission.',
                launch: 'Projected at miner emissions × (1 − momentum) with momentum at its launch value and no programs paid. Switches to the live balance once the reserve receives emission.',
            },
            window: 'Live balance sampled daily from finalized chain state.',
            readingHistory: 'Reading the balance history…',
        },
        // not shown: the chart's accessible name, read before its values ({liveDate}: the last day read
        // from the chain; {amount} by {date}: where the projection ends)
        aria: {
            liveProjected: 'Reserve balance, {unit}: live to {liveDate}, then projected to {amount} by {date}. Arrow keys read each day.',
            live: 'Reserve balance, {unit}: live to {liveDate}. Arrow keys read each day.',
            projected: 'Reserve balance, {unit}: projected to {amount} by {date}. Arrow keys read each day.',
            window: {
                one: 'Reserve balance, {unit}, over the last {count} day, read from the chain. Arrow keys read each day.',
                other: 'Reserve balance, {unit}, over the last {count} days, read from the chain. Arrow keys read each day.',
            },
        },
    },

    // the inflow chart's card: receipts and payments by month, or by day in a window
    flows: {
        // the card's label, shown in capitals
        label: 'Monthly inflow · program spend',
        windowLabel: 'Daily inflow · program spend',
        // the card's figure: everything received, then (dimmed) what went to programs
        received: '{amount} in',
        toPrograms: '→ {amount} to programs so far',
        toProgramsWindow: {
            one: '→ {amount} to programs, last {count} day',
            other: '→ {amount} to programs, last {count} days',
        },
        readingHistory: 'reading the balance history…',
        // before the reserve is paid: the projected inflow a month, then (dimmed) what it assumes
        perMonth: '{amount} a month',
        projectedNoPrograms: 'projected · no programs paid',
        note: {
            live: 'Receipts and payments are the rises and falls between daily samples of the chain; the inflow after the last sample is projected at the same momentum as the balance.',
            projected: 'Every month is projected until the reserve receives emission.',
            window: 'Receipts and payments are the rises and falls between daily samples of the chain.',
        },
        // not shown: the chart's accessible name ({count} months from {from} to {to})
        aria: {
            live: {
                one: 'Monthly inflow and program spend, {unit}: {count} month from {from} to {to}, received and spent from the chain, then projected. Arrow keys read each month.',
                other: 'Monthly inflow and program spend, {unit}: {count} months from {from} to {to}, received and spent from the chain, then projected. Arrow keys read each month.',
            },
            projected: {
                one: 'Monthly inflow and program spend, {unit}: {count} month from {from} to {to}, all projected. Arrow keys read each month.',
                other: 'Monthly inflow and program spend, {unit}: {count} months from {from} to {to}, all projected. Arrow keys read each month.',
            },
            window: {
                one: 'Daily inflow and program spend, {unit}, over the last {count} day, read from the chain. Arrow keys read each day.',
                other: 'Daily inflow and program spend, {unit}, over the last {count} days, read from the chain. Arrow keys read each day.',
            },
        },
    },

    // the table under each chart, opened from its summary line ("Show as a table · α");
    // column headers shown in capitals
    table: {
        show: 'Show as a table',
        day: 'Day',
        month: 'Month',
        balance: 'Balance',
        change: 'Change',
        basis: 'Basis',
        received: 'Received',
        spent: 'Spent',
        projected: 'Projected',
        // the Basis column's values: read from the chain, or projected
        chain: 'Chain',
        basisProjected: 'Projected',
    },

    // the bars of a whole split into parts (reserve/SplitBar.jsx): a title, the parts' names
    // (each with its value in the key beneath) and a note
    splits: {
        received: {
            title: 'Everything the reserve has received',
            spent: 'Spent',
            committed: 'Committed',
            unallocated: 'Unallocated',
        },
        // the heading above the two bars below
        heading: 'Where the miner allocation goes',
        emission: {
            title: 'SN25 emission',
            owner: 'Subnet owner',
            validators: 'Validators',
            miners: 'Miner allocation',
            // {share}: the subnet owner's share
            note: 'The owner share is {share}; validators and miners split the rest evenly.',
        },
        // the miner allocation as the chain routes it now
        onChain: {
            title: 'Miner allocation, on chain now',
            momentum: 'Momentum, to providers',
            reserve: 'Reserve',
            burned: 'Owner-directed, burned',
            noteLive: 'The reserve receives what momentum leaves: 1 − momentum.',
            // {momentum}, {reserve}: α a day to providers and to the reserve
            noteOnChain: 'Momentum is on chain now: {momentum} α a day goes to providers. The reserve receives the rest, 1 − momentum ({reserve} α a day), once its hotkeys are paid.',
            // {date}: the launch day
            notePreLaunch: 'From {date}, momentum goes to providers ({momentum} α a day), and the reserve receives the rest, 1 − momentum ({reserve} α a day). Until then the chain burns the owner-directed share.',
        },
        // the miner allocation as planned from launch, before the chain answers ({date}: the launch day)
        planned: {
            title: 'Miner allocation from {date}',
            momentum: 'Momentum, to providers',
            reserve: 'Reserve, 1 − momentum',
            note: 'The live split shows once the chain answers.',
        },
        // the bar's own texts: not shown, its accessible name ({title}: the bar's title, {segments}:
        // its parts listed, each "{label} {value}"); and each part's tooltip, with its share or not
        bar: {
            summary: '{title}: {segments}',
            segment: '{label} {value}',
            tip: '{label}: {value}',
            tipShare: '{label}: {value} ({share})',
        },
    },
};
