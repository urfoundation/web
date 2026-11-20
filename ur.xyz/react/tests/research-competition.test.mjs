// The research page's competition card (src/components/research-competition.js):
// the countdown to the start, the phase the card shows at a given moment, and
// the progress and results under its text. Run with
// `node --test tests/research-competition.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    APEX_COMPETITION,
    APEX_RESULTS,
    APEX_RESULT_METRICS,
    competitionPhase,
    competitionProgress,
    competitionResultsText,
    countdown,
    netImprovement,
} from '../src/components/research-competition.js';

const LANGS = ['en', 'ar', 'de', 'es', 'ru', 'zh'];
const dictionary = async (code) => (await import(`../src/i18n/${code}.js`)).default;

const START = Date.UTC(2026, 9, 29); // Thursday 2026-10-29 00:00 UTC
const WEEK = 7 * 86_400_000;

test('the competition starts on Thursday, October 29 at 00:00 UTC and links its page', () => {
    assert.equal(Date.parse(APEX_COMPETITION.startsAt), START);
    assert.equal(new Date(START).getUTCDay(), 4);
    assert.equal(APEX_COMPETITION.url, 'https://apex.macrocosmos.ai/competitions/15');
});

test('it is upcoming until the start, live for six weeks, then ended', () => {
    assert.equal(competitionPhase(Date.UTC(2026, 9, 26, 12)), 'upcoming');
    assert.equal(competitionPhase(START - 1), 'upcoming');
    assert.equal(competitionPhase(START), 'live');
    assert.equal(competitionPhase(START + 6 * WEEK - 1), 'live');
    assert.equal(competitionPhase(START + 6 * WEEK), 'ended');
});

test('the countdown splits the time left into days, hours, minutes and seconds', () => {
    assert.deepEqual(countdown(Date.UTC(2026, 9, 26, 12)), { days: 2, hours: 12, minutes: 0, seconds: 0 });
    assert.deepEqual(countdown(START - (3 * 86_400 + 4 * 3_600 + 5 * 60 + 6) * 1000), { days: 3, hours: 4, minutes: 5, seconds: 6 });
    // more than 99 days still counts whole days
    assert.deepEqual(countdown(START - 120 * 86_400_000), { days: 120, hours: 0, minutes: 0, seconds: 0 });
});

test('a part second counts as a second, so the clock is never at zero before the start', () => {
    assert.deepEqual(countdown(START - 1), { days: 0, hours: 0, minutes: 0, seconds: 1 });
    assert.deepEqual(countdown(START - 59_001), { days: 0, hours: 0, minutes: 1, seconds: 0 });
    // read 20ms past the second, as the card's clock is: the seconds the device's clock shows
    assert.deepEqual(countdown(START - 10_000 + 20), { days: 0, hours: 0, minutes: 0, seconds: 10 });
});

test('from the start on the countdown stays at zero', () => {
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    assert.deepEqual(countdown(START), zero);
    assert.deepEqual(countdown(START + WEEK), zero);
});

// The dictionaries write the start out in words; they must say the moment the clock counts to.
test('every language writes the start the clock counts to', async () => {
    const start = new Date(APEX_COMPETITION.startsAt);
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(start);
    const time = start.toISOString().slice(11, 16);
    for (const code of LANGS) {
        const c = (await dictionary(code)).research.competition;
        if (code === 'en') assert.equal(c.startDate, `${day} · ${time} UTC`);
        for (const key of ['startDate', 'startedDate']) {
            assert.match(c[key], new RegExp(`(^|\\D)${start.getUTCDate()}(\\D|$)`), `${code} ${key}: the day`);
            assert.ok(c[key].includes(`${time} `) && c[key].includes('UTC'), `${code} ${key}: the time, in UTC`);
        }
    }
});

// ── progress and results ─────────────────────────────────────────────────────
// The figures are the epoch summaries in the server repo
// (connect/sim-latency/epoch-summary/EPOCH<n>.md, the results table), each
// epoch against its own baseline, checked against the public results on
// November 20, 2026. EPOCH2.md reports completion time only: no throughput
// (bytes received is not throughput) and no time to first byte.

test('the results are epochs 1 and 2, each against its own baseline, as of November 20, 2026', () => {
    assert.equal(APEX_RESULTS.asOf, '2026-11-20');
    assert.equal(APEX_RESULTS.epochs.length, 2);
    const [e1, e2] = APEX_RESULTS.epochs;
    assert.equal(e1.epoch, 1);
    assert.equal(e1.sealed, '2026-11-07'); // the result's seal.sealed_at
    assert.equal(e1.result, 'https://api.bringyour.com/competition/v2/rounds/01a1855d-49bd-0250-90db-d0c0885f0e46/result');
    assert.deepEqual({ ...e1.baseline }, { p95CompletionS: 19.556, medianThroughputMbps: 4.987, medianTtfbMs: 172.277, p95TtfbMs: 2168.952 });
    assert.deepEqual({ ...e1.winner }, { p95CompletionS: 7.062, medianThroughputMbps: 10.15, medianTtfbMs: 284.084, p95TtfbMs: 4190.036 });
    assert.equal(e2.epoch, 2);
    assert.equal(e2.sealed, '2026-11-18'); // seal.sealed_at 2026-11-18T14:35:51Z
    assert.equal(e2.result, 'https://api.bringyour.com/competition/v2/rounds/01a1c110-585b-ce38-4f29-ca4860a1c058/result');
    // seal.baseline_raw_score 6958.769 ms; the winner's raw_score 117.002 ms
    assert.deepEqual({ ...e2.baseline }, { p95CompletionS: 6.958769 });
    assert.deepEqual({ ...e2.winner }, { p95CompletionS: 0.117002 });
});

const KNOWN = ['p95CompletionS', 'medianThroughputMbps', 'medianTtfbMs', 'p95TtfbMs'];

test('the results are well formed: epochs 1 to n in order, within the rounds, each winner with its baseline\'s figures', () => {
    assert.match(APEX_RESULTS.asOf, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Date.parse(`${APEX_RESULTS.asOf}T00:00:00Z`) >= Date.parse(APEX_COMPETITION.startsAt), 'checked after the start');
    assert.ok(APEX_RESULTS.epochs.length <= APEX_COMPETITION.rounds);
    APEX_RESULTS.epochs.forEach((e, i) => {
        assert.equal(e.epoch, i + 1, 'epochs are numbered from 1, in order');
        assert.match(e.sealed, /^\d{4}-\d{2}-\d{2}$/, `epoch ${e.epoch}: the day it was sealed`);
        if (i > 0) assert.ok(e.sealed >= APEX_RESULTS.epochs[i - 1].sealed, `epoch ${e.epoch} was sealed after epoch ${e.epoch - 1}`);
        assert.ok(APEX_RESULTS.asOf >= e.sealed, `asOf (${APEX_RESULTS.asOf}) is before epoch ${e.epoch} was sealed: move it to the day the figures were checked`);
        assert.match(e.result, /^https:\/\/api\.bringyour\.com\/competition\/v2\/rounds\/[\da-f-]{36}\/result$/, `epoch ${e.epoch}: its public result`);
        if (e.winner === null) return; // no approved winner
        assert.ok(e.winner.p95CompletionS > 0 && e.baseline.p95CompletionS > 0, `epoch ${e.epoch}: the official objective, both sides`);
        for (const key of Object.keys(e.winner)) {
            assert.ok(KNOWN.includes(key), `epoch ${e.epoch} winner: unknown figure ${key}`);
            assert.ok(e.winner[key] > 0 && e.baseline[key] > 0, `epoch ${e.epoch}: ${key} on both sides`);
        }
        assert.deepEqual(Object.keys(e.baseline).sort(), Object.keys(e.winner).sort(), `epoch ${e.epoch}: the same figures on both sides`);
        // TTFB is both figures or neither
        assert.equal('medianTtfbMs' in e.winner, 'p95TtfbMs' in e.winner, `epoch ${e.epoch}: both TTFB figures or neither`);
    });
});

test('two of six epochs are complete', () => {
    assert.deepEqual(competitionProgress(), { done: 2, total: 6 });
});

test('the net improvement chains each epoch from the starting baseline: p95 99.4% lower, throughput 103.5% higher through epoch 1', () => {
    const net = netImprovement();
    assert.equal(net.epoch, 2);
    const [p95, throughput] = net.metrics;
    // (7.062 / 19.556) × (0.117002 / 6.958769), applied to 19.556 s
    const factor = (7.062 / 19.556) * (0.117002 / 6.958769);
    assert.equal(p95.before, 19.556);
    assert.ok(Math.abs(p95.after - 19.556 * factor) < 1e-12);
    assert.deepEqual([p95.change, p95.direction, p95.improved, p95.through, p95.digits], [99.4, 'lower', true, 2, 3]);
    // epoch 2 did not measure throughput: epoch 1's change stands, through epoch 1
    assert.deepEqual([throughput.before, throughput.after, throughput.change, throughput.direction, throughput.through], [4.987, 10.15, 103.5, 'higher', 1]);
    // TTFB was measured only in epoch 1, where it got worse
    assert.equal(net.ttfb, 'worse');
});

test('adding an epoch is one entry: the progress, the chained changes and the TTFB line follow', () => {
    const [e1, e2] = APEX_RESULTS.epochs;
    // epoch 1 alone: both figures against the starting baseline
    const one = { ...APEX_RESULTS, epochs: [e1] };
    assert.deepEqual(competitionProgress(one), { done: 1, total: 6 });
    assert.deepEqual(netImprovement(one).metrics.map((m) => [m.key, m.change, m.direction, m.improved]), [
        ['p95CompletionS', 63.9, 'lower', true],
        ['medianThroughputMbps', 103.5, 'higher', true],
    ]);
    // a third epoch that cuts TTFB on its own baseline and doubles throughput
    const e3 = {
        epoch: 3, sealed: '2026-11-25', result: e2.result.replace('01a1c110', '03a1c110'),
        baseline: { p95CompletionS: 0.12, medianThroughputMbps: 10, medianTtfbMs: 300, p95TtfbMs: 4000 },
        winner: { p95CompletionS: 0.12, medianThroughputMbps: 20, medianTtfbMs: 100, p95TtfbMs: 1000 },
    };
    const n3 = netImprovement({ ...APEX_RESULTS, epochs: [e1, e2, e3] });
    assert.equal(n3.epoch, 3);
    // throughput chains epochs 1 and 3: (10.15 / 4.987) × 2
    assert.equal(n3.metrics[1].change, Math.round(((10.15 / 4.987) * 2 - 1) * 1000) / 10);
    assert.equal(n3.metrics[1].through, 3);
    // TTFB chains to (284.084 / 172.277) / 3 and (4190.036 / 2168.952) / 4: both now better than the start
    assert.equal(n3.ttfb, null);
    // a later regression is chained in too, and worded by its direction
    const back = netImprovement({ ...APEX_RESULTS, epochs: [e1, { ...e2, winner: { p95CompletionS: 6.958769 * 200 } }] }).metrics[0];
    assert.deepEqual([back.direction, back.improved], ['higher', false]);
    // an epoch with no approved winner is complete and leaves the net change as it was
    const none = { ...APEX_RESULTS, epochs: [e1, e2, { ...e3, winner: null }] };
    assert.deepEqual(competitionProgress(none), { done: 3, total: 6 });
    assert.deepEqual(netImprovement(none), netImprovement());
    // no epoch measured TTFB: say what the completion time is not
    assert.equal(netImprovement({ ...APEX_RESULTS, epochs: [e2] }).ttfb, 'unreported');
    // before the first epoch: none complete, no change and no results link
    const start = { ...APEX_RESULTS, epochs: [] };
    assert.deepEqual(competitionProgress(start), { done: 0, total: 6 });
    assert.equal(netImprovement(start), null);
    const text = competitionResultsText({ progress: '{done} of {total}' }, 'en', start);
    assert.deepEqual([text.progress, text.net, text.link], ['0 of 6', null, null]);
});

test('the card says, in English, 2 of 6 epochs complete and the net figures with what they are not', async () => {
    const r = competitionResultsText((await dictionary('en')).research.competition.results, 'en');
    assert.deepEqual([r.done, r.total, r.progressLabel, r.progress], [2, 6, 'Competition progress', '2 of 6 epochs complete']);
    assert.equal(r.net.title, 'Net improvement since the start');
    assert.equal(r.net.comparison, 'Epochs 1 to 2, every winner chained from the starting baseline');
    assert.deepEqual([r.net.asOf, r.net.asOfIso], ['As of November 20, 2026', '2026-11-20']);
    assert.deepEqual(r.net.metrics.map((m) => [m.change, m.name, m.range, m.through]), [
        ['99.4% lower', 'p95 full-request completion time', '19.556 s to 0.119 s', null],
        ['103.5% higher', 'Median transfer throughput', '4.99 to 10.15 Mbps', 'through epoch 1'],
    ]);
    assert.equal(r.net.caveat, 'These are benchmark evaluation results, not deployed product gains. Each epoch is measured against its own baseline; the net change multiplies those changes together. Time to first byte did not improve.');
    assert.deepEqual(r.link, { href: APEX_RESULTS.epochs[1].result, label: 'Epoch 2 results (JSON)' });
});

// each language's decimal mark (i18n/locale.js: Arabic keeps Western digits)
const DECIMAL = { en: '.', ar: '.', de: ',', es: ',', ru: ',', zh: '.' };

test('every language shows the count, the figure in its own number format, the caveat and the link', async () => {
    for (const code of LANGS) {
        const copy = (await dictionary(code)).research.competition.results;
        assert.ok(copy, `${code}: research.competition.results`);
        for (const { key } of APEX_RESULT_METRICS) assert.ok(copy.metrics?.[key]?.name && copy.metrics[key].range, `${code}: the ${key} figure`);
        assert.ok(copy.ttfb && copy.notTtfb && copy.through, `${code}: both TTFB lines and the through label`);
        const r = competitionResultsText(copy, code);
        const strings = [r.progressLabel, r.progress, r.net.title, r.net.comparison, r.net.asOf, ...r.net.metrics.flatMap((m) => [m.change, m.name, m.range, ...(m.through ? [m.through] : [])]), r.net.caveat, r.link.label];
        for (const s of strings) {
            assert.ok(typeof s === 'string' && s.trim(), `${code}: a string is missing`);
            assert.doesNotMatch(s, /\{\w+\}/, `${code}: a placeholder is left in "${s}"`);
        }
        assert.match(r.progress, /(^|\D)2(\D|$)/, `${code}: the epochs complete in "${r.progress}"`);
        assert.match(r.progress, /(^|\D)6(\D|$)/, `${code}: the epochs in all in "${r.progress}"`);
        const d = DECIMAL[code];
        const [p95, throughput] = r.net.metrics;
        assert.ok(p95.change.includes(`99${d}4`) && throughput.change.includes(`103${d}5`), `${code}: ${p95.change}, ${throughput.change}`);
        assert.notEqual(copy.lower, copy.higher, `${code}: lower and higher`);
        for (const [m, before, after] of [[p95, `19${d}556`, `0${d}119`], [throughput, `4${d}99`, `10${d}15`]]) {
            const from = m.range.indexOf(before);
            const to = m.range.indexOf(after);
            assert.ok(from !== -1 && to > from, `${code}: "${m.range}" reads ${before} first, then ${after}`);
        }
        assert.equal(p95.through, null, `${code}: p95 runs through the latest epoch`);
        assert.match(throughput.through, /(^|\D)1(\D|$)/, `${code}: throughput runs through epoch 1`);
        assert.ok(r.net.asOf.includes('2026') && /(^|\D)20(\D|$)/.test(r.net.asOf), `${code}: the day in "${r.net.asOf}"`);
        assert.match(r.net.comparison, /(^|\D)2(\D|$)/, `${code}: the latest epoch`);
        // the caveat, then the TTFB line: a space between them, none after a full-width stop
        assert.equal(r.net.caveat, copy.caveat + (code === 'zh' ? '' : ' ') + copy.ttfb, code);
        // with no TTFB measured at all, the not-TTFB line instead
        const e2only = competitionResultsText(copy, code, { ...APEX_RESULTS, epochs: [APEX_RESULTS.epochs[1]] });
        assert.equal(e2only.net.caveat, copy.caveat + (code === 'zh' ? '' : ' ') + copy.notTtfb, `${code}: no TTFB`);
        assert.match(r.link.label, /(^|\D)2(\D|$)/, `${code}: the link names epoch 2`);
        assert.match(r.link.label, /JSON/, `${code}: the link says it is data`);
    }
});

// EPOCH1.md: the winner improved completion time and throughput but not time
// to first byte, so the outcome is never a blanket reduction in latency
test('no language calls the results a latency reduction', async () => {
    const LATENCY = /latenc|latenz|задержк|延迟|استجابة/i;
    for (const code of LANGS) {
        const copy = (await dictionary(code)).research.competition.results;
        for (const s of JSON.stringify(copy).match(/"[^"]*"/g)) assert.doesNotMatch(s, LATENCY, `${code}: ${s}`);
    }
});
