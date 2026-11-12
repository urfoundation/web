// /mainnet, the SN25 mainnet launch timeline: the page's own English
// (components/pages/Mainnet.jsx, its summary island mainnet/MainnetSummary.jsx
// and their helpers mainnet/timeline.js and mainnet/summary.js), the
// translations' source. The page's data has two units of its own, derived
// from the data files: pages/mainnet/data (data/mainnet.js: the notices at the
// top, the box under them, the epochs) and pages/mainnet/timeline
// (data/mainnet-timeline.json: the milestones).
//
// Every {name} stays as it is in a translation. A plural node ({ one, other })
// takes the forms its language needs (i18n/format.js plural); its {count} is a
// number as the page writes it (9,240,028: figures keep their English digits
// and separators in every language but Spanish, which writes them as Intl
// does, 9.240.028, as on /ctf: timeline.js INTL_FIGURES). Dates are written
// from the `dates` patterns below, never copied into the text.
export default {
    meta: {
        title: 'SN25 mainnet launch timeline | UR',
        description: 'The SN25 mainnet launch by payout epoch: version 1 from October 8, settlement v2 from epoch 4 (October 30), and capture the flag from epoch 8 (November 27).',
        // the page's name in the breadcrumb trail
        breadcrumb: 'Mainnet',
    },

    intro: {
        eyebrow: 'SN25 · Bittensor mainnet',
        title: 'Mainnet launch timeline',
        lede: "UR's subnet, SN25, went live on Bittensor mainnet on October 8, 2026. This timeline follows the launch by payout epoch, from the version 1 contracts through settlement v2 to capture the flag, which starts with epoch 8.",
        // {scheduled} and {planned}: those statuses' pills (labels.status)
        note: 'Milestones marked {scheduled} or {planned} are still ahead, and their dates may change. All times are UTC, and a time marked ≈ is approximate: most are projected from block numbers.',
    },

    settlement: {
        eyebrow: 'Settlement',
        title: 'Version 1, then settlement v2',
        paragraphs: [
            "SN25 pays providers by payout epoch. These are UR's settlement epochs, not the chain's 72-minute tempo: epoch 0 lasted one day, and each later epoch lasts 7 days (50,400 blocks).",
            'Version 1 launched on October 8 and settles epochs 1 to 3. It pays only the providers the validator has measured, and that measurement is capped at about 1,500 providers an epoch, so most miners receive no version 1 share.',
            'Settlement v2 pays by usage and removes that cap. It was planned to take over from epoch 3, but its pool was not registered before epoch 3 began on October 23, so version 1 settles epoch 3 too. Its pool was registered on October 29, and settlement v2 has paid every epoch since epoch 4, which began around October 30 at 18:25 UTC. The first v2 epoch finished around November 6, and its claims opened on November 8, after its root was committed and its challenge period ended.',
            'From epoch 8, which begins around November 27 at 18:25 UTC, each network operator has a second pool beside its provider pool: capture the flag, which settlement v2 pays in the same claim flow. The provider pool pays for usage, and capture the flag pays for being present in a country, with ten slots in every country each epoch.',
        ],
        // the list of the epochs
        epochsAria: 'Payout epochs',
    },

    milestones: {
        eyebrow: 'Timeline',
        title: 'Milestones',
        fine: 'The time of a scheduled or planned milestone is a projection, from its block number at 12 seconds a block or from the plan, and is marked ≈ unless it was set for an exact time. A projected time moves a little if blocks run faster or slower. From epoch 1, each epoch closes within 120 blocks of its end, its payout root is due within 1,200 blocks of its end, and its claims open from 14,400 blocks (about two days) after it. Scheduled and planned milestones may change.',
        // after the fine print: {date} is the day the page last changed (2026-11-11)
        updated: 'Updated {date}.',
    },

    // a notice's dateline: {date}, the day it was posted (dates.long)
    noticeDate: 'Notice · {date}',

    // a notice's header is its button: what a tap does, beside its chevron (closed, then open)
    noticeToggle: { expand: 'Expand', collapse: 'Collapse' },

    labels: {
        // a milestone's status, in the pill beside its date
        status: { done: 'Done', in_progress: 'In progress', scheduled: 'Scheduled', planned: 'Planned' },
        // what pays an epoch
        settlement: { v1: 'Version 1', v2: 'Settlement v2' },
        // beside the settlement of an epoch in which capture the flag pays (from epoch 8): its name, as the apps write it
        captureTheFlag: 'Capture the flag',
        // a source's link to the explorer
        view: { transaction: 'View transaction', contract: 'View contract', block: 'View block' },
        // a source link's accessible name: {action}, the link's words (view), and {label}, the source's
        sourceAria: '{action}: {label}',
        // {title}: the milestone's title
        sourcesAria: 'Sources for {title}',
        transactionsAria: 'Transactions for {title}',
        // the closed list of a milestone's transactions (always more than three)
        transactions: { one: '{count} transaction', other: '{count} transactions' },
        // the milestones' groups: {number}, an epoch's number
        epoch: 'Epoch {number}',
        beforeLaunch: 'Before launch',
        afterEpoch: 'After epoch {number}',
        // an epoch's blocks: {start} → {end}, its first block and the next epoch's
        // first; {blocks}, how many (blocks); {length}, how long (days or aboutDays)
        epochBlocks: 'Blocks {start} → {end} · {blocks}, {length}',
        blocks: { one: '{count} block', other: '{count} blocks' },
        days: { one: '{count} day', other: '{count} days' },
        aboutDays: { one: 'about {count} day', other: 'about {count} days' },
        // the arrow that points on, in the reading direction (← right to left)
        arrow: '→',
    },

    // How a date is written. Times are always UTC, as 18:25 UTC.
    dates: {
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        // a day on the timeline, Thu Oct 8: {weekday} and {month} from the
        // short names above, {date} the day of the month
        day: '{weekday} {month} {date}',
        // a day on the summary, Oct 8
        monthDay: '{month} {date}',
        // days of one month, Oct 9–16: {start} and {end}, days of the month
        sameMonth: '{month} {start}–{end}',
        // days in two months, Oct 30 – Nov 6: {start} and {end} as monthDay
        twoMonths: '{start} – {end}',
        // the day a notice was posted, October 31, 2026 ({month} from monthsLong)
        long: '{month} {date}, {year}',
    },

    // the launch at a glance, under the title (mainnet/MainnetSummary.jsx)
    summary: {
        title: 'At a glance',
        figureAria: 'Payout epochs and key milestones',
        // a band's name where it is too narrow for labels.epoch: E0, E5
        epochShort: 'E{number}',
        // the band after the last epoch, where it is too narrow for labels.afterEpoch
        afterShort: 'After',
        // read by a screen reader, before that band's first day
        from: 'from {days}',
        // read by a screen reader after a band's days: what pays it
        settledBy: { v1: 'settled by version 1', v2: 'settled by settlement v2' },
        // a key milestone's name, as a screen reader reads it: {number} on the
        // axis, {title}, {when} its date, {status} in words
        mark: '{number}. {title}, {when}, {status}',
        span: '{title}, {when}, {status}',
        now: 'Now',
        // where now is: {time}, and {percent} through epoch {number}
        nowAt: '{time}',
        nowIn: '{time}, {percent}% through epoch {number}',
        bandsAria: 'Bands',
        markersAria: 'Markers',
        // two statuses drawn alike: {first}, a status (labels.status), {second}, the next (lower)
        either: '{first} or {second}',
        lower: { done: 'done', in_progress: 'in progress', scheduled: 'scheduled', planned: 'planned' },
        // a span in the legend: {title}, {days}
        legendSpan: '{title}, {days}',
        datesAria: 'Key dates',
    },
};
