/**
 * The research methodology (/research/methodology): how UR's research works,
 * written from the research-loops abstract (October 30, 2026). The page itself
 * (components/pages/ResearchMethodology.jsx) only renders what is here. Edit
 * this file when a loop changes: a new instrument, the competition's next
 * season, the field nodes shipping.
 *
 * The page follows the research report's rules: headline figures are
 * multiples, never absolute rates; evidence links go only to public sources
 * (urnetwork/connect, urnetwork/server), and the PERFVAR ledger, which is
 * private, is named without a link. tests/research-methodology.test.mjs checks
 * that the lab's figures are the report's and the competition's are the
 * competition card's.
 *
 * This is the page's English. Its copy unit (i18n/pages/research-methodology/
 * en.js) takes the words from here and its translations mirror them; the page
 * formats the dates in its own language (`published`, and the competition's
 * start, a fact's `date`, filling its {date}).
 */
import { APEX_COMPETITION } from '../components/research-competition.js';

const REPORT_HREF = '/research/2026-q3-report';
const SOURCES = {
    perfvar: 'https://github.com/urnetwork/server/blob/main/connect/perfvar/PERFVAR.md',
    lowbar: 'https://github.com/urnetwork/connect/blob/main/LOWBAR.md',
    memsteady: 'https://github.com/urnetwork/connect/blob/main/MEMSTEADY.md',
    simLatency: 'https://github.com/urnetwork/server/blob/main/connect/sim-latency/README.md',
    friends: 'https://ur.io/friends-of-the-network',
};

export const METHODOLOGY = Object.freeze({
    path: '/research/methodology',
    eyebrow: 'Research · Methodology',
    title: 'Self-improving research loops',
    description: 'How UR’s research improves the network and its own measurements: three loops, the lab, an open competition and volunteer field nodes, sharing one discipline.',
    figure: 'Three nested research loops: the lab innermost, the competition around it, the field outermost',
    published: '2026-10-30',
    metaNote: 'Lab figures are from the August–October 2026 research report.',
    lede: 'UR improves its network through three nested research loops that share one discipline. The lab measures every change, an open competition runs weekly, and volunteer field nodes report every quarter. Each loop improves the network, and improves how the next round is measured.',
    reportHref: REPORT_HREF,

    // the three loops, innermost first: the index under the lede, the key, and the sections
    loops: [
        { key: 'lab', id: 'lab', name: 'Lab', instrument: 'PERFVAR', cadence: 'every change' },
        { key: 'competition', id: 'competition', name: 'Competition', instrument: 'Apex SN1', cadence: 'weekly' },
        { key: 'field', id: 'field', name: 'Field', instrument: 'Friends of the Network', cadence: 'quarterly' },
    ],

    discipline: {
        eyebrow: 'The discipline',
        title: 'A change counts only when it beats measured noise',
        rules: [
            { title: 'Compare with a frozen baseline', body: 'Each change runs against a fixed baseline, one factor at a time, with the old code as the control.' },
            { title: 'Measure the instrument first', body: 'Before trusting a difference, each loop measures its own instrument’s noise. A change has to beat that noise in fresh, interleaved runs.' },
            { title: 'Keep every attempt', body: 'Every attempt goes on the record, failures included. The August–October report kept its mixed and rejected results.' },
        ],
    },

    outputs: {
        eyebrow: 'Two outputs',
        title: 'A better network, and a better instrument',
        body: 'Every loop runs the same five stages and has two outputs. When a kept change becomes the new baseline, the network improves. When what the loop learns about its own measurements changes how the next change is judged, the instrument improves.',
        figure: 'Five stages, Baseline, Change, Measure, Judge and Record, with two rails back: the outcome from Record to Baseline, the process from Record to Measure.',
        stages: [
            { name: 'Baseline', lines: ['A frozen baseline', 'and its noise band'] },
            { name: 'Change', lines: ['One factor at a time,', 'old code as control'] },
            { name: 'Measure', lines: ['Fresh runs on the', 'loop’s instrument'] },
            { name: 'Judge', lines: ['Beat the noise, or', 'stay on the record'] },
            { name: 'Record', lines: ['Every attempt kept,', 'failures too'] },
        ],
        outcome: 'A kept change becomes the new baseline',
        process: 'What the loop learns sharpens the instrument',
        example: {
            tag: 'Tested against itself · September 12, 2026',
            body: 'An A/A test ran one build against itself. The old five-run rule would have called it worse in 15 of 17 cells, so five-run verdicts were retired. A 10% effect now takes 33 runs per arm.',
            source: 'PERFVAR measurement ledger (private)',
        },
    },

    agents: {
        eyebrow: 'Agents in the loop',
        title: 'Agents do much of the work',
        body: 'Agents run the loops alongside the team. Every fix leaves a deterministic test behind, so a regression cannot quietly come back.',
        roles: [
            { name: 'Triage', body: 'A low-effort agent runs test campaigns and sorts their failures.' },
            { name: 'Root cause', body: 'A max-effort agent finds the cause, fixes it and adds deterministic coverage. Three focused passes, then one clean full run.' },
            { name: 'Review', body: 'Two independent reviewer models must both approve a competition winner before it is promoted.' },
        ],
    },

    sections: {
        eyebrow: 'The loops',
        title: 'Three loops, three cadences',
        loops: [
            {
                key: 'lab',
                tag: 'Loop 1 · The lab · every change',
                title: 'Every change, on seeded synthetic networks',
                body: 'PERFVAR drives the real Connect stack, from TUN and provider NAT to every production carrier, through seeded synthetic networks. A failure repeats on the same tick, so a fix can be proven against the old code. LOWBAR, MEMSTEADY and a 100-page browsing workload carry the same rules to weak links, phone memory budgets and real pages.',
                facts: [
                    { v: '39', l: 'changes measured, Aug 24 – Oct 24, 2026' },
                    { v: '≈4.73×', l: 'faster with adaptive windows, in their model' },
                    { v: '2.81×', l: 'packet path: a provider’s packets sent as one group' },
                    { v: '−26.4%', l: 'runtime memory in an exact replay' },
                ],
                links: [
                    { label: 'Read the August–October 2026 report', href: REPORT_HREF },
                    { label: 'PERFVAR', href: SOURCES.perfvar, external: true },
                    { label: 'LOWBAR', href: SOURCES.lowbar, external: true },
                    { label: 'MEMSTEADY', href: SOURCES.memsteady, external: true },
                ],
            },
            {
                key: 'competition',
                tag: 'Loop 2 · The competition · weekly',
                title: 'Each week’s winner becomes the baseline everyone must beat',
                body: 'The Sim Latency Algo Competition on Apex (Bittensor SN1) opens routing and matching to outside researchers. A fixed simulator scores each submission on a deterministic fleet against a frozen nine-run control, and no submission can touch the scorer. An approved winner becomes the next epoch’s baseline, under a margin that never weakens.',
                facts: [
                    { v: String(APEX_COMPETITION.rounds), l: 'weekly epochs from {date}', date: APEX_COMPETITION.startsAt },
                    { v: '26.9%', l: 'margin, frozen in advance from calibration runs' },
                    { v: 'p ≤ 0.05', l: 'a one-sided Welch test must agree' },
                    { v: '2', l: 'independent reviewer models must both approve' },
                ],
                links: [
                    { label: 'Join the competition on Apex', href: APEX_COMPETITION.url, external: true },
                    { label: 'How submissions are scored', href: SOURCES.simLatency, external: true },
                ],
            },
            {
                key: 'field',
                tag: 'Loop 3 · The field · quarterly',
                title: 'Measure the network where people actually use it',
                body: 'Friends of the Network puts small research nodes on volunteers’ own connections: home Wi-Fi, Ethernet, 4G/5G cellular and satellite. Each node runs PERFVAR test builds of the Connect stack and reports to a central research edge, so measurements from real links flow back into the lab.',
                facts: [
                    { v: 'Nov 10', l: 'first hosts notified by email' },
                    { v: 'Nov 15', l: 'first nodes ship' },
                    { v: 'Quarterly', l: 'results published at ur.xyz/research' },
                ],
                links: [
                    { label: 'Become a Friend of the Network', href: SOURCES.friends, external: true },
                ],
            },
        ],
    },

    publication: {
        eyebrow: 'Publication',
        title: 'Results every quarter, rejections included',
        body: 'Results are published at least quarterly here, at ur.xyz/research. The August–October 2026 report put all 39 measured changes on one timeline, including the 4 mixed and 3 rejected.',
        cta: 'Read the August–October 2026 report',
    },
});
