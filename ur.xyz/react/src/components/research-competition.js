/**
 * The research page's algo competition: where it runs and when, how far it
 * has come, and what its card shows at a given moment. ResearchExtras.jsx
 * draws the card; the Astro pages read the phase at build time;
 * tests/research-competition.test.mjs checks the clock and pins the results.
 * No React in here.
 *
 * The current competition runs on Apex (Bittensor SN1): six weekly rounds
 * from Thursday 2026-10-29 00:00 UTC. Until then the card counts down to the
 * start; from the start it says the competition is live, and after the last
 * round that it has ended. Until the competition page is finalized `url` is
 * null and the card's art, title and button are not links.
 *
 * Under its text the card shows how many of the six epochs are complete, as a
 * bar, and the net improvement since the start in every dimension measured so
 * far. Each epoch is measured against its own freshly run baseline (the
 * previous winner, re-measured), so its change is a ratio, winner over
 * baseline; a figure's net change multiplies the ratios of every epoch that
 * measured it, applied to the starting baseline. A figure an epoch did not
 * measure carries no change from that epoch, and the card says which epoch
 * the figure runs through. Both follow APEX_RESULTS below, which changes by
 * edit, never with the clock.
 * When an epoch is sealed and summarized, add one entry to `epochs`: its
 * number, the day it was sealed, its public result, and its baseline and
 * approved winner's figures from its summary in the server repo
 * (connect/sim-latency/epoch-summary/EPOCH<n>.md, the results table), or
 * `winner: null` if no submission was approved, which leaves the net change as
 * it was; and set `asOf` to the day you checked the figures (the tests refuse
 * an `asOf` before the newest seal). Record only the figures the summary
 * reports as such, on both sides: never record bytes received as throughput.
 * The bar, the changes, the TTFB line (shown while the chained median or p95
 * TTFB is no better than the start, or, if no epoch measured TTFB, that the
 * completion time is not TTFB) and the results link all follow; no dictionary
 * needs an edit.
 */
import { intlLocale } from '../i18n/locale.js';

export const APEX_COMPETITION = Object.freeze({
    url: 'https://apex.macrocosmos.ai/competitions/15',
    startsAt: '2026-10-29T00:00:00Z',
    rounds: 6,
    roundDays: 7,
});

/**
 * The results so far. Figures are in the units their keys name: seconds,
 * megabits per second, milliseconds. They are benchmark evaluation results
 * from the competition's simulator, not measurements of the deployed network.
 */
export const APEX_RESULTS = Object.freeze({
    // the day the figures were last checked against the public results
    asOf: '2026-11-20',
    // the completed epochs, in order
    epochs: Object.freeze([
        Object.freeze({
            epoch: 1,
            sealed: '2026-11-07',
            result: 'https://api.bringyour.com/competition/v2/rounds/01a1855d-49bd-0250-90db-d0c0885f0e46/result',
            // EPOCH1.md, "Starting baseline": the competition's starting baseline
            baseline: Object.freeze({
                p95CompletionS: 19.556,
                medianThroughputMbps: 4.987,
                medianTtfbMs: 172.277,
                p95TtfbMs: 2168.952,
            }),
            // EPOCH1.md, "Winning submission" (job 01a1a440-fd2e-538a-365c-f4b23eed4739)
            winner: Object.freeze({
                p95CompletionS: 7.062,
                medianThroughputMbps: 10.15,
                medianTtfbMs: 284.084,
                p95TtfbMs: 4190.036,
            }),
        }),
        Object.freeze({
            epoch: 2,
            sealed: '2026-11-18',
            result: 'https://api.bringyour.com/competition/v2/rounds/01a1c110-585b-ce38-4f29-ca4860a1c058/result',
            // EPOCH2.md, "Shared baseline". The summary reports no throughput or
            // TTFB (bytes received is not throughput), so neither is recorded.
            baseline: Object.freeze({ p95CompletionS: 6.958769 }),
            // EPOCH2.md, "Approved winner" (job 01a1e7b9-0b4e-cec4-3fad-526342ab01ac)
            winner: Object.freeze({ p95CompletionS: 0.117002 }),
        }),
    ]),
});

/**
 * The figures the card shows, in order: each one's key (in APEX_RESULTS and
 * in the dictionaries' research.competition.results.metrics), the direction
 * that is better, and the decimals its values are written with.
 */
export const APEX_RESULT_METRICS = Object.freeze([
    Object.freeze({ key: 'p95CompletionS', better: 'lower', digits: 3 }),
    Object.freeze({ key: 'medianThroughputMbps', better: 'higher', digits: 2 }),
]);

const DAY_MS = 86_400_000;

/** 'upcoming' | 'live' | 'ended' at time `now` (ms): live from the start for rounds × roundDays days. */
export function competitionPhase(now, { startsAt, rounds, roundDays } = APEX_COMPETITION) {
    const start = Date.parse(startsAt);
    if (now < start) return 'upcoming';
    return now < start + rounds * roundDays * DAY_MS ? 'live' : 'ended';
}

/**
 * The time left before the start at `now` (ms) as whole days, hours, minutes
 * and seconds, all zero from the start on. A part second counts as a second,
 * so the clock reads 00:00:00:01 in the last second and is never at zero
 * while the competition is still upcoming.
 */
export function countdown(now, { startsAt } = APEX_COMPETITION) {
    const left = Math.max(0, Math.ceil((Date.parse(startsAt) - now) / 1000));
    return {
        days: Math.floor(left / 86_400),
        hours: Math.floor(left / 3_600) % 24,
        minutes: Math.floor(left / 60) % 60,
        seconds: left % 60,
    };
}

/** How far the competition has come: the epochs complete, of its rounds. */
export function competitionProgress({ epochs } = APEX_RESULTS, { rounds } = APEX_COMPETITION) {
    return { done: epochs.length, total: rounds };
}

/**
 * The net improvement since the start; null until an epoch has an approved
 * winner. For each figure measured by at least one such epoch: `before` is
 * the starting baseline of the first epoch that measured it, `factor` the
 * product of winner / baseline over every epoch that measured it, `after`
 * before × factor, and `through` the last epoch that measured it. Each change
 * is a percentage of `before`, rounded to one decimal, with its direction
 * ('lower' or 'higher') and whether that is the better one. `ttfb` is 'worse'
 * when the chained median or p95 time to first byte is no better than the
 * start, 'unreported' when no epoch measured it, and null when both improved.
 */
function chain(epochs, key) {
    const measured = epochs.filter((e) => key in e.winner && key in e.baseline);
    if (!measured.length) return null;
    const factor = measured.reduce((f, e) => f * (e.winner[key] / e.baseline[key]), 1);
    const before = measured[0].baseline[key];
    return { before, factor, after: before * factor, through: measured[measured.length - 1].epoch };
}

export function netImprovement({ epochs } = APEX_RESULTS, metrics = APEX_RESULT_METRICS) {
    const won = epochs.filter((e) => e.winner);
    if (!won.length) return null;
    const median = chain(won, 'medianTtfbMs');
    const p95 = chain(won, 'p95TtfbMs');
    return {
        epoch: won[won.length - 1].epoch,
        metrics: metrics.flatMap(({ key, better, digits }) => {
            const c = chain(won, key);
            if (!c) return [];
            return [{
                key,
                digits,
                before: c.before,
                after: c.after,
                through: c.through,
                change: Math.round(Math.abs(1 - c.factor) * 1000) / 10,
                direction: c.factor < 1 ? 'lower' : 'higher',
                improved: better === 'lower' ? c.factor < 1 : c.factor > 1,
            }];
        }),
        ttfb: !median || !p95 ? 'unreported' : median.factor < 1 && p95.factor < 1 ? null : 'worse',
    };
}

// `{name}` placeholders replaced from `values`; others are left as written
const fill = (template, values) =>
    String(template || '').replace(/\{(\w+)\}/g, (m, name) => (name in values ? String(values[name]) : m));

/** The gap before what follows `text` on its line: a space, except after a full-width stop (Chinese), which carries its own. */
export const sentenceGap = (text) => (/[。！？]$/.test(String(text || '')) ? '' : ' ');

const joinSentences = (...parts) =>
    parts.filter(Boolean).reduce((text, part) => (text ? text + sentenceGap(text) + part : part), '');

/**
 * The card's progress and results as text, in one language: `copy` is the
 * dictionary's research.competition.results and `lang` the page's language,
 * which the figures and the day follow (as the site's other figures do,
 * i18n/locale.js). The card renders exactly this, and the tests read every
 * language through it. `net` is null until an epoch has a winner; `link` is
 * the newest completed epoch's public result, null before the first.
 */
export function competitionResultsText(copy, lang, results = APEX_RESULTS, competition = APEX_COMPETITION) {
    const locale = intlLocale(lang);
    const number = (value, digits = 0) =>
        new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    const { done, total } = competitionProgress(results, competition);
    const net = netImprovement(results);
    const latest = results.epochs[results.epochs.length - 1];
    const day = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${results.asOf}T00:00:00Z`));
    return {
        done,
        total,
        progressLabel: copy.progressLabel,
        progress: fill(copy.progress, { done: number(done), total: number(total) }),
        net: net && {
            title: copy.title,
            comparison: fill(copy.comparison, { epoch: number(net.epoch) }),
            asOf: fill(copy.asOf, { date: day }),
            asOfIso: results.asOf,
            metrics: net.metrics.map((m) => ({
                key: m.key,
                improved: m.improved,
                change: fill(copy[m.direction], { value: number(m.change, 1) }),
                name: copy.metrics[m.key].name,
                range: fill(copy.metrics[m.key].range, { before: number(m.before, m.digits), after: number(m.after, m.digits) }),
                // a figure the newer epochs did not measure says where it stops
                through: m.through < net.epoch ? fill(copy.through, { epoch: number(m.through) }) : null,
            })),
            caveat: joinSentences(copy.caveat, net.ttfb === 'worse' && copy.ttfb, net.ttfb === 'unreported' && copy.notTtfb),
        },
        link: latest ? { href: latest.result, label: fill(copy.link, { epoch: number(latest.epoch) }) } : null,
    };
}
