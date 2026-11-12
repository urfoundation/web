// /dashboard's live data (lib/dashboardData.js) when a source fails: the page reads Grafana and Bittensor mainnet in
// the visitor's browser, and a filtered network can block either. Each read stands alone (liveReads), the page's data
// is built from whichever answered (assembleLive) and never throws for one that didn't, and a Grafana request that
// hangs gives up without holding the others. The browser side (the panels' notes, the retries) is checked by
// tests/responsive-shell.mjs on the built page, with tests/dashboard-fixture.mjs for Grafana and no chain.
//
// Run: node --test tests/dashboard-live.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CHAIN_READS, assembleLive, buildLive, grafana, liveReads } from '../src/lib/dashboardData.js';
import { COUNTRIES, grafanaPanel, grafanaStats } from './dashboard-fixture.mjs';

const history = JSON.parse(readFileSync(new URL('../public/dashboard/history.json', import.meta.url), 'utf8'));
const DAY = 86_400_000;
// the fixture as fetch: stats.json and the panel queries
async function fixtureFetch(url, init = {}) {
    const u = new URL(url, 'http://fixture');
    if (u.pathname.endsWith('/stats.json')) return new Response(JSON.stringify(grafanaStats()), { status: 200 });
    const panel = /\/panels\/(\d+)\/query$/.exec(u.pathname);
    const answer = panel && grafanaPanel(Number(panel[1]), JSON.parse(init.body || '{}'));
    return answer ? new Response(JSON.stringify(answer), { status: 200 }) : new Response('no fixture', { status: 404 });
}
// a chain endpoint nothing listens on: refused at once
const NO_CHAIN = ['http://127.0.0.1:9'];

test('with the chain unreachable, the page still gets every Grafana part, and the chain\'s come back null', async () => {
    const S = await buildLive({ g: grafana('http://fixture', { fetchImpl: fixtureFetch }), history, endpoints: NO_CHAIN });
    assert.equal(S.RESERVE, null);
    assert.equal(S.EMISSION, null);
    assert.equal(S.ROUTING, null);
    assert.equal(S.EXTRA.conviction, null);
    assert.equal(S.EXTRA.recipients, null);
    assert.equal(S.TOKEN.tao, null);
    assert.equal(S.TOKEN.usd, grafanaStats().alpha_usd);
    assert.equal(Object.keys(S.COUNTRY_NOW).length, COUNTRIES.length);
    assert.ok(S.EXT.list.length > 0);
    assert.equal(S.EPOCH.n, grafanaStats().epoch);
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
    assert.equal(S.EXTRA.minerAlpha, null);
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
    const reads = liveReads({ g: grafana('http://fixture', { fetchImpl: fixtureFetch }), history, endpoints: NO_CHAIN });
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
