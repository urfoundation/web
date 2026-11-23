// /dashboard's live data (lib/dashboardData.js) when a source fails: the page reads Grafana and Bittensor mainnet in
// the visitor's browser, and a filtered network can block either. Each read stands alone (liveReads), the page's data
// is built from whichever answered (assembleLive) and never throws for one that didn't, and a Grafana request that
// hangs gives up without holding the others. The browser side (the panels' notes, a late answer, a retry) is
// checked by tests/responsive-shell.mjs on the built page, with tests/dashboard-fixture.mjs for Grafana and no chain.
//
// Run: node --test tests/dashboard-live.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CHAIN_READS, assembleLive, buildHistory, buildLive, epochClock, grafana, liveReads, providersEarned } from '../src/lib/dashboardData.js';
import { EPOCH_ZERO_START_MS } from '../src/lib/epoch.js';
import { COUNTRIES, grafanaPanel, grafanaStats } from './dashboard-fixture.mjs';

const history = JSON.parse(readFileSync(new URL('../public/dashboard/history.json', import.meta.url), 'utf8'));
const DAY = 86_400_000;
// Keep yesterday one day beyond the committed history so the fixture fills a gap.
const fixtureNow = Date.parse(`${history.end}T12:00:00Z`) + 2 * DAY;
const fixtureStats = grafanaStats(fixtureNow);
// the fixture as fetch: stats.json and the panel queries
async function fixtureFetch(url, init = {}) {
    const u = new URL(url, 'http://fixture');
    if (u.pathname.endsWith('/stats.json')) return new Response(JSON.stringify(fixtureStats), { status: 200 });
    const panel = /\/panels\/(\d+)\/query$/.exec(u.pathname);
    const answer = panel && grafanaPanel(Number(panel[1]), JSON.parse(init.body || '{}'));
    return answer ? new Response(JSON.stringify(answer), { status: 200 }) : new Response('no fixture', { status: 404 });
}
// a chain endpoint nothing listens on: refused at once
const NO_CHAIN = ['http://127.0.0.1:9'];

test('with the chain unreachable, the page still gets every Grafana part, and the chain\'s come back null', async () => {
    const S = await buildLive({ g: grafana('http://fixture', { fetchImpl: fixtureFetch }), history, now: fixtureNow, endpoints: NO_CHAIN });
    assert.equal(S.RESERVE, null);
    assert.equal(S.EMISSION, null);
    assert.equal(S.ROUTING, null);
    assert.equal(S.EXTRA.conviction, null);
    assert.equal(S.EXTRA.recipients, null);
    assert.equal(S.TOKEN.tao, null);
    assert.equal(S.TOKEN.usd, fixtureStats.alpha_usd);
    assert.equal(Object.keys(S.COUNTRY_NOW).length, COUNTRIES.length);
    assert.ok(S.EXT.list.length > 0);
    assert.equal(S.EPOCH.n, fixtureStats.epoch);
    assert.ok(S.LIVE.providers > 0 && S.LIVE.users24 > 0 && S.LIVE.cities > 0);
    for (const k of ['providers', 'traffic', 'users24', 'nets']) assert.ok(S.Hs[k].some((v) => v != null), `hourly ${k}`);
    // the days the committed history lacks are read from Grafana: the last full day is yesterday
    assert.equal(S.END, Math.floor(S.NOW / DAY) * DAY - DAY);
    assert.ok(S.D.traffic.at(-1) != null);
    assert.deepEqual(S.PENDING, []);
});

test('nothing answered: the history file alone, every live part null or empty, nothing thrown', () => {
    const now = Date.parse(`${history.end}T12:00:00Z`) + DAY;
    const S = assembleLive({}, { history, now });
    assert.equal(S.END, Date.parse(history.end));
    assert.equal(S.EPOCH, null);
    assert.deepEqual(S.LIVE, { providers: null, throughput: null, conn: null, users24: null, countries: null, regions: null, cities: null, nets: null, devices: null });
    assert.deepEqual(S.COUNTRY_NOW, {});
    assert.equal(S.EXT.list, null);
    assert.equal(S.EXT.online, null);
    assert.equal(S.RESERVE, null);
    assert.equal(S.EXTRA.poolLast, null);
    assert.equal(S.EXTRA.poolBefore, null);
    assert.ok(S.D.providers.some((v) => v != null), 'the history\'s days');
    assert.ok(S.Hs.providers.every((v) => v == null));
    assert.ok(S.TPH && S.TPH.v.length > 0);
});

test('nothing answered and no history file: an empty time base ending yesterday', () => {
    const now = Date.UTC(2026, 10, 12, 9);
    const S = assembleLive({}, { now, pending: CHAIN_READS });
    assert.equal(S.END, Date.UTC(2026, 10, 11));
    assert.equal(S.dayT.length, 90);
    assert.equal(S.hourT.length, 144);
    assert.ok(Object.values(S.D).every((a) => a.every((v) => v == null)));
    assert.equal(S.TPH, null);
    assert.deepEqual(S.PENDING, ['reserve', 'conviction']);
});

test('each part is its own read: the stats feed, the history, every hourly gauge, the countries and the chain\'s two', () => {
    const reads = liveReads({ g: grafana('http://fixture', { fetchImpl: fixtureFetch }), history, now: fixtureNow, endpoints: NO_CHAIN });
    for (const k of ['stats', 'history', 't24', 't72', 'countries', 'extenders', 'countries1', 'countries3', ...CHAIN_READS]) assert.equal(typeof reads[k], 'function', k);
    assert.equal(Object.keys(reads).filter((k) => k.startsWith('hourly.')).length, 11);
});

test('a Grafana request that hangs gives up after its time and is not tried again; one that fails is tried three times', async () => {
    let asked = 0;
    const hang = (url, { signal }) => { asked++; return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))); };
    const g = grafana('http://fixture', { fetchImpl: hang, timeoutMs: 50 });
    await assert.rejects(g.post(36, 0, 1, 1), (e) => e.timedOut === true && /no answer/.test(e.message));
    assert.equal(asked, 1);
    await assert.rejects(g.stats(), (e) => e.timedOut === true);

    let failed = 0;
    const refuse = async () => { failed++; return new Response('down', { status: 503 }); };
    await assert.rejects(grafana('http://fixture', { fetchImpl: refuse }).post(36, 0, 1, 1), /HTTP 503/);
    assert.equal(failed, 3);
});

test('at most six Grafana requests are out at once', async () => {
    let out = 0, most = 0;
    const slow = async (url, init) => { out++; most = Math.max(most, out); await new Promise((r) => setTimeout(r, 5)); out--; return fixtureFetch(url, init); };
    await Promise.all(Array.from({ length: 20 }, (_, i) => grafana('http://fixture', { fetchImpl: slow }).post(36, 0, 3_600_000 * (i + 2), 3_600_000)));
    assert.ok(most > 6, 'separate clients do not share a limit');
    out = 0; most = 0;
    const g = grafana('http://fixture', { fetchImpl: slow });
    await Promise.all(Array.from({ length: 20 }, (_, i) => g.post(36, 0, 3_600_000 * (i + 2), 3_600_000)));
    assert.equal(most, 6);
});

// the fixture, with some panels answering without data or failing
const fixtureWith = ({ empty = [], down = [] }) => async (url, init = {}) => {
    const pid = Number((/\/panels\/(\d+)\/query$/.exec(new URL(url, 'http://fixture').pathname) || [])[1]);
    if (down.includes(pid)) return new Response('down', { status: 503 });
    if (empty.includes(pid)) return new Response(JSON.stringify({ results: { A: { status: 200, frames: [] } } }), { status: 200 });
    return fixtureFetch(url, init);
};

test('a read that answers without its figures has not answered: it rejects, to be asked again', async () => {
    const reads = liveReads({ g: grafana('http://fixture', { fetchImpl: fixtureWith({ empty: [36, 33, 1] }) }), history, now: fixtureNow, endpoints: NO_CHAIN });
    await assert.rejects(reads['hourly.providers'](), /panel 36: no data/);
    await assert.rejects(reads.countries(), /panel 33: no countries/);
    await assert.rejects(reads.t24(), /panel 1: no data/);
    assert.ok((await reads['hourly.users24']()).v.length > 0);
});

test('the page\'s history keeps what it could read and comes back partial; the daily job\'s fails', async () => {
    const g = grafana('http://fixture', { fetchImpl: fixtureWith({ down: [31] }) });
    const h = await liveReads({ g, history, now: fixtureNow, endpoints: NO_CHAIN }).history();
    const yesterday = new Date(fixtureNow - DAY).toISOString().slice(0, 10);
    assert.equal(h.partial, true);
    assert.equal(h.end, yesterday);
    assert.ok(h.days[yesterday]?.providers != null, 'the gauges that answered fill the gap');
    assert.equal(h.days[yesterday]?.traffic, undefined, 'the series that failed is left out');
    assert.equal(history.partial, undefined, 'the file itself is untouched');
    assert.equal(history.days[yesterday], undefined, 'the fixture still lacks yesterday');
    await assert.rejects(buildHistory({ g, prev: history, now: fixtureNow, days: 3, chain: false, countries: false }), /grafana panel 31: HTTP 503/);
});

test("epoch bounds: the chain's own start where the feed reported it, else interpolated by block between known times", () => {
    const at = epochClock({ 6: Date.UTC(2026, 10, 13, 18, 28) });
    assert.equal(at(0), EPOCH_ZERO_START_MS);
    assert.equal(at(1), Date.UTC(2026, 9, 9, 18, 9));
    assert.equal(at(6), Date.UTC(2026, 10, 13, 18, 28));
    // epoch 5 lies between the latest anchor (24 Oct) and epoch 6's reported start: within a few minutes of 6 Nov 18:27
    assert.ok(Math.abs(at(5) - Date.UTC(2026, 10, 6, 18, 27)) < 10 * 60_000, new Date(at(5)).toISOString());
    // past the last known start, 12 s a block
    assert.equal(at(7) - at(6), 50_400 * 12_000);
});

test("what providers earned goes to the epoch that earned it: the feed's figure now is the epoch just finished's, its previous the one before", async () => {
    const g = grafana('http://fixture', { fetchImpl: fixtureFetch });
    const v1 = { ...history, version: 1, epochs: Object.fromEntries(Object.entries(history.epochs || {}).map(([k, e]) => [k, { ...e, miner: 999 }])) };
    const now = Date.now(), st = await g.stats(), cur = st.epoch;
    const h = await buildHistory({ g, prev: v1, now, days: 3, chain: false, countries: false });
    assert.equal(h.version, 2);
    assert.equal(h.starts[cur], st.epoch_start * 1000);
    assert.equal(h.epochs[cur - 2].miner, st.prev_miner_emissions_alpha);
    const captured = now >= st.epoch_start * 1000 + 2 * 3_600_000;
    assert.equal(h.epochs[cur - 1].miner, captured ? st.miner_emissions_alpha : null);
    // version 1's figures were an epoch late: none is kept (older epochs are read again from panel 19)
    for (let k = 0; k < cur; k++) assert.notEqual(h.epochs[k].miner, 999, `epoch ${k}`);
    // epoch 0 starts at its block's own time, and every epoch ends where the next starts
    assert.equal(h.epochs[0].start, EPOCH_ZERO_START_MS);
    for (let k = 1; k < cur; k++) assert.equal(h.epochs[k].start, h.epochs[k - 1].end);
    assert.equal(h.epochs[cur - 1].end, st.epoch_start * 1000);
    // the page keeps nothing of a version 1 history's miner figures either
    const S = assembleLive({ stats: st }, { history: v1, now });
    assert.ok(Object.values(S.EXTRA.epochs).every((e) => e.miner == null));
    assert.equal(S.EXTRA.poolBefore, st.prev_miner_emissions_alpha);
    assert.equal(S.EXTRA.poolLast, captured ? st.miner_emissions_alpha : null);
});

test("the running total covers every day the history keeps, not only the periods' 90", () => {
    const days = Object.keys(history.days).filter((d) => history.days[d].traffic != null).sort();
    const S = assembleLive({}, { history, now: Date.parse(`${history.end}T12:00:00Z`) + DAY });
    assert.equal(S.ALL.t[0], Date.parse(days[0]));
    assert.equal(S.ALL.t.at(-1), Date.parse(history.end));
    const sum = (a) => a.reduce((s, v) => s + (v ?? 0), 0);
    assert.ok(Math.abs(sum(S.ALL.traffic) - sum(days.map((d) => history.days[d].traffic))) < 1e-6);
    assert.equal(S.dayT.length, 90);
});

test("figures Grafana no longer has stay as the history kept them", async () => {
    const g = grafana('http://fixture', { fetchImpl: fixtureFetch });
    const st = await g.stats(), cur = st.epoch;
    const first = await buildHistory({ g, prev: history, days: 3, chain: false, countries: false });
    first.epochs[0] = { ...first.epochs[0], users: 4242, deposits: 7, miner: 12.5 };
    // a Grafana that answers every panel empty: what it no longer has
    const empty = grafana('http://fixture', { fetchImpl: async (url, init) => {
        const u = new URL(url, 'http://fixture');
        if (u.pathname.endsWith('/stats.json')) return fixtureFetch(url, init);
        return new Response(JSON.stringify({ results: {} }), { status: 200 });
    } });
    const again = await buildHistory({ g: empty, prev: first, days: 3, chain: false, countries: false, soft: true });
    assert.equal(again.epochs[0].users, 4242);
    assert.equal(again.epochs[0].deposits, 7);
    assert.equal(again.epochs[0].miner, 12.5);
    assert.equal(again.epochs[cur - 2].miner, st.prev_miner_emissions_alpha);
});

test("what providers earned in an epoch: the miner allocation less what the reserve's UIDs gained", () => {
    // epoch 6 as the chain had it: 2,952.0165 α a day to miners, the reserve gaining 18,599.13 α
    const minerPerBlock = 2952.0164797436482 / 7200;
    const e6 = providersEarned({ startAlpha: 96604.80, endAlpha: 115203.93, minerPerBlock });
    assert.ok(Math.abs(e6 - 2064.99) < 0.05, String(e6));
    // a share the chain burns isn't anyone's
    assert.ok(Math.abs(providersEarned({ startAlpha: 0, endAlpha: 9_000, minerPerBlock: 0.2, blocks: 50_000, burned: 0.1 }) - 0) < 1e-9);
    // the reserve gaining more than the allocation, or providers past half of it (α moved out of the reserve): no figure
    assert.equal(providersEarned({ startAlpha: 0, endAlpha: 30_000, minerPerBlock }), null);
    assert.equal(providersEarned({ startAlpha: 50_000, endAlpha: 40_000, minerPerBlock }), null);
    assert.equal(providersEarned({ startAlpha: null, endAlpha: 1, minerPerBlock }), null);
});
