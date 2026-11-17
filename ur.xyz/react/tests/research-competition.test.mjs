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
// The figures are epoch 1's summary in the server repo
// (connect/sim-latency/epoch-summary/EPOCH1.md, "Results at a glance"): the
// starting baseline and the winning submission, checked on November 9, 2026.

test('the results are epoch 1 against the starting baseline, as of November 9, 2026', () => {
    assert.equal(APEX_RESULTS.asOf, '2026-11-09');
    assert.deepEqual({ ...APEX_RESULTS.baseline }, { p95CompletionS: 19.556, medianThroughputMbps: 4.987, medianTtfbMs: 172.277, p95TtfbMs: 2168.952 });
    assert.equal(APEX_RESULTS.epochs.length, 1);
    const [e1] = APEX_RESULTS.epochs;
    assert.equal(e1.epoch, 1);
    assert.equal(e1.sealed, '2026-11-07'); // the result's seal.sealed_at
    assert.equal(e1.result, 'https://api.bringyour.com/competition/v2/rounds/01a1855d-49bd-0250-90db-d0c0885f0e46/result');
    assert.deepEqual({ ...e1.winner }, { p95CompletionS: 7.062, medianThroughputMbps: 10.15, medianTtfbMs: 284.084, p95TtfbMs: 4190.036 });
});

test('the results are well formed: epochs 1 to n in order, within the rounds, each winner with every figure', () => {
    assert.match(APEX_RESULTS.asOf, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Date.parse(`${APEX_RESULTS.asOf}T00:00:00Z`) >= Date.parse(APEX_COMPETITION.startsAt), 'checked after the start');
    assert.ok(APEX_RESULTS.epochs.length <= APEX_COMPETITION.rounds);
    const keys = [...APEX_RESULT_METRICS.map((m) => m.key), 'medianTtfbMs', 'p95TtfbMs'];
    for (const key of keys) assert.ok(APEX_RESULTS.baseline[key] > 0, `baseline: ${key}`);
    APEX_RESULTS.epochs.forEach((e, i) => {
        assert.equal(e.epoch, i + 1, 'epochs are numbered from 1, in order');
        assert.match(e.sealed, /^\d{4}-\d{2}-\d{2}$/, `epoch ${e.epoch}: the day it was sealed`);
        if (i > 0) assert.ok(e.sealed >= APEX_RESULTS.epochs[i - 1].sealed, `epoch ${e.epoch} was sealed after epoch ${e.epoch - 1}`);
        assert.ok(APEX_RESULTS.asOf >= e.sealed, `asOf (${APEX_RESULTS.asOf}) is before epoch ${e.epoch} was sealed: move it to the day the figures were checked`);
        assert.match(e.result, /^https:\/\/api\.bringyour\.com\/competition\/v2\/rounds\/[\da-f-]{36}\/result$/, `epoch ${e.epoch}: its public result`);
        if (e.winner === null) return; // no approved winner
        for (const key of keys) assert.ok(e.winner[key] > 0, `epoch ${e.epoch} winner: ${key}`);
    });
});

test('one of six epochs is complete', () => {
    assert.deepEqual(competitionProgress(), { done: 1, total: 6 });
});

test('the net improvement is computed from the stored figures: p95 63.9% lower, throughput 103.5% higher', () => {
    const net = netImprovement();
    assert.equal(net.epoch, 1);
    const [p95, throughput] = net.metrics;
    assert.deepEqual(p95, { key: 'p95CompletionS', digits: 2, before: 19.556, after: 7.062, change: 63.9, direction: 'lower', improved: true });
    assert.deepEqual(throughput, { key: 'medianThroughputMbps', digits: 2, before: 4.987, after: 10.15, change: 103.5, direction: 'higher', improved: true });
    // worked from the raw values: (19.556 − 7.062) / 19.556 and (10.150 − 4.987) / 4.987
    assert.equal(Math.round(((19.556 - 7.062) / 19.556) * 1000) / 10, 63.9);
    assert.equal(Math.round(((10.15 - 4.987) / 4.987) * 1000) / 10, 103.5);
    // time to first byte got worse (EPOCH1.md: the median 64.9% higher, p95 93.2% higher)
    assert.equal(net.ttfbImproved, false);
});

test('adding an epoch is one entry: the progress, the current best and the TTFB line follow', () => {
    const e1 = APEX_RESULTS.epochs[0];
    const e2 = { epoch: 2, sealed: '2026-11-21', result: e1.result.replace('01a1855d', '02a1855d'), winner: { p95CompletionS: 5, medianThroughputMbps: 9, medianTtfbMs: 150, p95TtfbMs: 2000 } };
    const two = { ...APEX_RESULTS, epochs: [e1, e2] };
    assert.deepEqual(competitionProgress(two), { done: 2, total: 6 });
    const net = netImprovement(two);
    assert.equal(net.epoch, 2);
    assert.equal(net.metrics[0].change, 74.4); // 19.556 s to 5 s
    assert.equal(net.ttfbImproved, true);
    // a figure worse than the baseline is worded by its direction and not counted as improved
    const worse = netImprovement({ ...two, epochs: [e1, { ...e2, winner: { ...e2.winner, medianThroughputMbps: 4 } }] }).metrics[1];
    assert.deepEqual([worse.direction, worse.improved, worse.change], ['lower', false, 19.8]);
    // an epoch with no approved winner is complete and leaves the current best as it was
    const none = { ...APEX_RESULTS, epochs: [e1, { ...e2, winner: null }] };
    assert.deepEqual(competitionProgress(none), { done: 2, total: 6 });
    assert.equal(netImprovement(none).epoch, 1);
    // before the first epoch: none complete, no net change and no results link
    const start = { ...APEX_RESULTS, epochs: [] };
    assert.deepEqual(competitionProgress(start), { done: 0, total: 6 });
    assert.equal(netImprovement(start), null);
    const text = competitionResultsText({ progress: '{done} of {total}' }, 'en', start);
    assert.deepEqual([text.progress, text.net, text.link], ['0 of 6', null, null]);
});

test('the card says, in English, 1 of 6 epochs complete and the two figures with what they are not', async () => {
    const r = competitionResultsText((await dictionary('en')).research.competition.results, 'en');
    assert.deepEqual([r.done, r.total, r.progressLabel, r.progress], [1, 6, 'Competition progress', '1 of 6 epochs complete']);
    assert.equal(r.net.title, 'Net improvement since the start');
    assert.equal(r.net.comparison, 'Epoch 1 winner against the starting baseline');
    assert.deepEqual([r.net.asOf, r.net.asOfIso], ['As of November 9, 2026', '2026-11-09']);
    assert.deepEqual(r.net.metrics.map((m) => [m.change, m.name, m.range]), [
        ['63.9% lower', 'p95 full-request completion time', '19.56 s to 7.06 s'],
        ['103.5% higher', 'Median transfer throughput', '4.99 to 10.15 Mbps'],
    ]);
    assert.equal(r.net.caveat, 'These are benchmark evaluation results against the starting baseline, not deployed product gains. Time to first byte did not improve.');
    assert.deepEqual(r.link, { href: APEX_RESULTS.epochs[0].result, label: 'Epoch 1 results (JSON)' });
});

// each language's decimal mark (i18n/locale.js: Arabic keeps Western digits)
const DECIMAL = { en: '.', ar: '.', de: ',', es: ',', ru: ',', zh: '.' };

test('every language shows the count, the figures in its own number format, the caveat and the link', async () => {
    for (const code of LANGS) {
        const copy = (await dictionary(code)).research.competition.results;
        assert.ok(copy, `${code}: research.competition.results`);
        for (const { key } of APEX_RESULT_METRICS) assert.ok(copy.metrics?.[key]?.name && copy.metrics[key].range, `${code}: the ${key} figure`);
        const r = competitionResultsText(copy, code);
        const strings = [r.progressLabel, r.progress, r.net.title, r.net.comparison, r.net.asOf, ...r.net.metrics.flatMap((m) => [m.change, m.name, m.range]), r.net.caveat, r.link.label];
        for (const s of strings) {
            assert.ok(typeof s === 'string' && s.trim(), `${code}: a string is missing`);
            assert.doesNotMatch(s, /\{\w+\}/, `${code}: a placeholder is left in "${s}"`);
        }
        assert.match(r.progress, /(^|\D)1(\D|$)/, `${code}: the epochs complete in "${r.progress}"`);
        assert.match(r.progress, /(^|\D)6(\D|$)/, `${code}: the epochs in all in "${r.progress}"`);
        const d = DECIMAL[code];
        const [p95, throughput] = r.net.metrics;
        assert.ok(p95.change.includes(`63${d}9`) && throughput.change.includes(`103${d}5`), `${code}: ${p95.change}, ${throughput.change}`);
        assert.notEqual(copy.lower, copy.higher, `${code}: lower and higher`);
        for (const [m, before, after] of [[p95, `19${d}56`, `7${d}06`], [throughput, `4${d}99`, `10${d}15`]]) {
            const from = m.range.indexOf(before);
            const to = m.range.indexOf(after);
            assert.ok(from !== -1 && to > from, `${code}: "${m.range}" reads ${before} first, then ${after}`);
        }
        assert.ok(r.net.asOf.includes('2026') && /(^|\D)9(\D|$)/.test(r.net.asOf), `${code}: the day in "${r.net.asOf}"`);
        assert.match(r.net.comparison, /(^|\D)1(\D|$)/, `${code}: the winner's epoch`);
        // the caveat, then the TTFB line: a space between them, none after a full-width stop
        assert.equal(r.net.caveat, copy.caveat + (code === 'zh' ? '' : ' ') + copy.ttfb, code);
        assert.match(r.link.label, /(^|\D)1(\D|$)/, `${code}: the link names epoch 1`);
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
