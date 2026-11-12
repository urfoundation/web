// The research report page's own words (/research/2026-q3-report) and what its
// islands show. The data's labels (each entry's date, headline and meter
// labels, the kinds, the meters, the glossary) come from the report data
// through english.js; the report's text is the text unit (text/en.js).
import data from '../../../data/research-report-2026-q3.json' with { type: 'json' };
import { pageEnglish } from './english.js';

export default {
    ...pageEnglish(data),

    // the head of the page (astro/src/components/routes/ResearchReportRoute.astro)
    description: 'Why UR’s network research matters, its gigabit-class milestone, and 39 measured changes from August 24 to October 24, 2026, with how far each kind of gain went.',

    // the sections, as the sidebar, the dock's menu and the intro's chips list them
    toc: {
        title: 'On this page',
        labels: {
            report: 'Intro',
            glance: 'At a glance',
            why: 'Why it matters',
            timeline: 'Timeline',
            'month-aug': 'August',
            'month-sep': 'September',
            'month-oct': 'October',
            methods: 'Methods',
            milestones: 'Milestones',
            milestone: 'Gigabit-class throughput',
            details: 'Details',
            end: 'Start to end',
            instruments: 'Instruments',
            open: 'Open questions',
            glossary: 'Glossary',
        },
    },
    sectionsAria: 'Sections of this page',

    intro: {
        eyebrow: 'Research · Report',
        datesNote: 'Dates are those of the research records, which can differ from the merge dates.',
        updated: 'Updated {date}.',
        glance: 'At a glance',
        kpiNote: 'Each figure is its own workload. They cannot be added or multiplied into one app speedup, and the report claims none.',
        kpiNoteLink: 'Why there is no single number',
        entriesByDate: { one: 'The {count} entry, by date', other: 'The {count} entries, by date' },
        legendAria: 'Markers',
        why: 'Why it matters',
        openLink: 'What is not yet shown',
    },

    // the months of the timeline, and a month's span of days ("Aug 24–31")
    months: {
        aug: { name: 'August', label: 'Aug' },
        sep: { name: 'September', label: 'Sep' },
        oct: { name: 'October', label: 'Oct' },
    },
    monthSpan: '{month} {from}–{to}',

    timeline: {
        eyebrow: 'Timeline',
        title: { one: '{count} change or experiment', other: '{count} changes and experiments' },
        intro: [
            'Each entry leads with its result in plain words and one figure. Open it for the exact measurements, what they mean for the test suites, and the evidence. Entries that were rejected or made no difference stay on the timeline, marked as such.',
            'The meters replay the evidence as you read. Each one moves only when you reach the entry that recorded it, and none of them is ever combined with another.',
        ],
        final: 'Where the meters ended',
        railAria: 'The meters, as of the entry you are reading',
        monthEntries: { one: '{count} entry', other: '{count} entries' },
        byKind: '{month} by kind',
    },

    entry: {
        noSpeedClaim: 'No speed claim',
        alsoRejected: 'Also rejected:',
        moves: 'Moves',
        more: 'Exact figures and what they mean',
        inReport: 'In the report',
        measured: 'Measured',
        suites: 'What it means for the test suites',
        evidence: 'Evidence',
        private: '(private; summarized here)',
        commit: 'connect {sha}',
    },

    milestone: {
        changed: 'What changed',
        impact: 'Recorded impact and evidence strength',
        experiment: 'Experiment',
        result: 'Before → after',
        establishes: 'What it establishes',
        inReport: 'In the report',
        // the host run, one bar a second (a figure of the static page)
        chart: {
            aria: 'Host TCP path, one bar per second: {first} Mbps in the first second, then {lo}–{hi} Mbps for the next nine; ten-second mean {mean} Mbps, on 1-Gbps service',
            service: '1-Gbps service',
            steady: '{lo}–{hi} each second',
            second: '{n} s',
            axis: 'Mbps, useful payload',
            mean: 'ten-second mean {mean}',
        },
    },

    end: {
        eyebrow: 'Start to end',
        title: 'How far each kind of gain went',
        intro: 'The report’s own estimates, axis by axis, with the confidence each one deserves.',
        confidence: 'Confidence',
        inReport: 'In the report',
        evidence: 'Start-to-end evidence',
        estimate: 'Estimate and confidence',
        quote: '“{text}”',
        cite: 'The report’s own one-sentence summary',
    },

    methods: {
        eyebrow: 'Methods',
        title: 'How the research was done',
        intro: 'The program moved from exploratory tuning toward tests that tell competing causes apart. Each method has a short schematic animation, and the example beside it comes from the timeline.',
        seenIn: 'Seen in',
        seen: '{date}: {title}',
        inReport: 'In the report',
        // a method's name as the report writes it, leading its text in bold
        runIn: '{title}.',
    },

    instruments: {
        eyebrow: 'Instruments',
        title: 'What changed in the tests themselves',
        intro: 'The test coverage improved substantially, even where performance is still open.',
        inReport: 'In the report',
    },

    open: {
        eyebrow: 'Open questions',
        title: 'What is not yet shown',
        intro: 'No cumulative app-speed or battery improvement is claimed. These are the gaps the next qualification has to close.',
        latest: 'The latest result, summarized',
    },

    glossary: {
        eyebrow: 'Glossary',
        title: 'Terms used in this report',
        source: 'Source: {link}, in urnetwork/connect.',
        sourceNote: 'Every figure is quoted from it unrounded; percentages and ratios appear only where the report states them.',
        updated: 'Updated {date}.',
    },

    // the meters (Meters.jsx), in the rail beside the timeline and where they ended
    meter: {
        asOf: 'As of',
        start: 'Start',
        count: '{index} of {total}',
        loadFinalShort: '4.7–7.3× vs Aug 24',
        loadFinal: '4.7–7.3× faster than Aug 24, low confidence',
        none: 'No measurement yet',
        bulkFrom: 'from about {from}, {x}',
        otherReadings: { one: '{count} other reading', other: '{count} other readings' },
        phone: 'phone',
        publicRoute: 'public route',
        loadNote: 'ms, lower is faster',
        hideRest: 'Hide the rest',
        more: { one: '{count} more', other: '{count} more' },
        earlier: { one: 'and {count} earlier', other: 'and {count} earlier' },
        loadAria: 'Median Wikipedia load observations on a log scale, with the Aug 24 baselines',
        baselines: 'Aug 24 baselines',
        baselinesAria: 'Aug 24 baselines, {a} and {b} ms',
        baselinesValue: '{a} and {b} ms',
        baselinesTip: 'Aug 24 baselines: the explicit-H1 control and the low-bar bundled baseline',
        thousands: '{n}K',
        msValue: '{value} ms',
        pointAria: '{value} ms, {label}, {date}',
        bulkAria: 'Bulk speed in Mbps on a log scale: the controlled H1 path, and public and phone readings',
        controlled: 'controlled H1 path',
        readings: 'public and phone readings',
        controlledAria: 'controlled H1 path, about {from} to {to} Mbps',
        controlledTip: 'about {from} → {to} Mbps ({x})',
        controlledRuns: 'runs {runs} Mbps',
        mbpsValue: '{value} Mbps',
        bulkPointAria: '{value} Mbps, {label}, {date}',
        pathAria: 'The largest packet-path and window speed-ups, each measured alone',
        memoryAria: 'The three memory reductions the report features, each in its own owner',
        barAria: '{label}: {value}, {date}',
        listItem: '{label}: {value}',
    },

    // the bar under the nav on tablets and phones (Dock.jsx)
    dock: {
        menu: '— sections of this page',
    },

    // every entry by date (Glance.jsx)
    glance: {
        aria: { one: 'The {count} entry from August 24 to October 24, by date', other: 'The {count} entries from August 24 to October 24, by date' },
        axis: { aug: 'AUG', sep: 'SEP', oct: 'OCT', end: 'OCT 24' },
        mark: '{date}, {kind}: {title}',
        tip: '{date} · {kind}',
    },

    // the glossary terms' tooltips (TermTips.jsx)
    termTip: 'In the glossary',

    // the method animations (MethodFigure.jsx, scenes.jsx): each scene's step
    // line and the labels drawn in it, which must fit its 360×200 view
    figure: {
        play: 'Play',
        pause: 'Pause',
        playAria: 'Play the animation',
        pauseAria: 'Pause the animation',
    },
    scenes: {
        owners: {
            steps: ['Measure the total', 'Split it by owner', 'Find the owner that should not be there', 'Release it and keep the rest'],
            heap: 'heap after the test',
            parts: { live: 'live data', free: 'free lists', slack: 'slack', goroutines: 'goroutines', stale: 'stale reader' },
            staleNote: 'closed endpoints still hold 128 KiB arrays',
            released: 'released; the rest of the heap is unchanged',
        },
        boundary: {
            steps: ['Follow one slow first page', 'Time every stage it crosses', 'Most of the wait is at DNS', 'An unmeasured stage is unknown, not zero'],
            stages: { dns: 'DNS', tcp: 'TCP', admit: 'admit', carrier: 'carrier', reply: 'reply' },
            axis: 'first page, time by stage',
            dns: 'DNS 18.103 s',
            total: '33.044 s in all',
            unknown: 'not instrumented: unknown, not zero',
        },
        deterministic: {
            steps: ['Pin the clock', 'Run the old code three times', 'It fails on the same tick every run', 'Run the fix on the same clock', 'It passes on that tick'],
            clock: 'fixed clock',
            rows: ['old, run 1', 'old, run 2', 'old, run 3', 'the fix'],
            held: 'held queue',
            failed: 'same failure, same tick, every run',
            passed: 'the fix passes on that tick',
        },
        ablation: {
            steps: ['Run with everything on', 'Turn off only the drain', 'Turn off only pacing', 'Keep what was needed, record what failed'],
            change: 'change',
            switches: { pacing: 'pacing', drain: 'drain', resizing: 'window resizing' },
            keptOn: 'kept on',
            test: '100-page browsing test',
            stopped: 'stopped at 49 pages',
            stillFailed: 'still failed',
            running: 'running',
            passed: '100 of 100 pages',
            record: 'the record',
            // the record: each row's change and its result share one line
            rows: { all: 'all on', drain: 'drain off only', pacing: 'pacing off only' },
            stoppedShort: 'stopped at 49 pages',
            passedShort: '100 of 100',
        },
        layers: {
            steps: ['Measure the part', 'Measure the socket and carrier', 'Measure the whole tunnel', 'The gain did not carry, so it was not adopted'],
            rows: [
                { l: 'phone browser', u: 'Wikipedia, Fast.com', res: 'not reached' },
                { l: 'full-TUN simulator', u: 'loss, RTT, MTU', res: 'no gain' },
                { l: 'socket and carrier', u: 'MB/s over TLS', res: '+3.52%' },
                { l: 'microbenchmark', u: 'ns per op', res: 'faster' },
            ],
        },
        noise: {
            steps: ['Run identical code twice', 'Their spread is the noise', 'Interleave old and new in fresh processes', 'A small difference stays inside the noise', 'Only an effect beyond it counts'],
            band: 'A/A noise',
            axis: 'throughput',
            order: 'order',
            fresh: 'new',
            noVerdict: 'no verdict',
            effect: 'an effect',
        },
        validity: {
            steps: ['Record every attempt', 'Dropping the failures would flatter the median', 'So nothing is dropped', 'The median counts every attempt'],
            axis: 'time per run, every attempt',
            deadline: 'deadline',
            survivor: 'survivor median: looks faster',
            notAllowed: 'not allowed',
            all: 'median of every attempt',
        },
    },
};
