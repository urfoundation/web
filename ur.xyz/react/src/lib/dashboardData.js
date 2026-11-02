/**
 * Data for /dashboard: the network's public Grafana panels, the operators'
 * stats feed and Bittensor mainnet, shaped into the one object the page
 * renders (window.SNAP).
 *
 * Two halves, so a visit costs a handful of requests rather than hundreds:
 *
 *   buildHistory()  runs once a day (scripts/dashboard-history.mjs, from a
 *                   GitHub Action) and writes public/dashboard/history.json:
 *                   one value per UTC day for every series, the country
 *                   counts at the end of each day, 90 days of hourly
 *                   throughput, the reserve's daily balance and the α price
 *                   at each epoch's settlement. Days accumulate in the file,
 *                   so history outlives Grafana's retention.
 *   buildLive()     runs in the visitor's browser on top of that file: the
 *                   stats feed, the last six days hourly, the countries now,
 *                   and the reserve and conviction locks from the chain.
 *
 * Hourly data carried has no single Grafana query (panel 1 sums one range,
 * panel 31 is daily). The last 24 and 72 hours are measured exactly with one
 * panel-1 query each; within them, and on earlier days, each hour gets its
 * share of the measured total in proportion to that hour's throughput, the
 * same method as the page's "When traffic flows".
 */
import { FINNEY_ARCHIVE, FINNEY_RPC, readReserve, readReserveAt } from './subtensor.js';
import { readConviction } from './conviction.js';

export const GRAFANA = 'https://grafana.bringyour.com';
const DASHBOARD = 'ea86caca098b4b91b873fd8dacbf2676';
export const H = 3_600_000, DAY = 86_400_000;
export const RESERVE_WALLET = '5CcHGEqKK3RXeEA2sVycHQAQGrqsyhWaYu9FjGtDVN6nwMwR';
const ND = 90, NH = 144, EPOCH_MS = 7 * DAY;
const RESERVE_FROM = Date.UTC(2026, 9, 10); // the reserve wallet's first balance (10 Oct 2026)
const MAINNET_FROM = Date.UTC(2026, 9, 8); // SN25 mainnet, epoch 0 (8 Oct 2026)

/**
 * Provider payouts by epoch, set by hand until a feed reports them (2026-11-02):
 *   testing  epochs 0 and 1 were testing; providers were still paid in USDC (Lemz)
 *   pending  α owed and when it pays: epoch 3's 4,132.72 α is paid with epoch 4 (Brien, 1 Nov 2026;
 *            the 31 Oct notice on ur.xyz/mainnet says epoch 5)
 *   paid     α paid out; the page values it at the α price when the epoch settled
 * No payout has been made yet. Update this as epochs are paid.
 */
export const PAYOUTS = {
    epochs: {
        0: { testing: true },
        1: { testing: true },
        3: { pending: 4132.72, note: 'paid with epoch 4' },
    },
};

/** Gauges read hourly: [key, Grafana panel, how a day is summarised]. */
const GAUGES = [
    ['providers', 36, 'mean'], ['throughput', 3, 'mean'], ['conn', 32, 'mean'], ['users24', 43, 'last'],
    ['devices', 4, 'mean'], ['countries', 9, 'last'], ['regions', 38, 'last'], ['cities', 40, 'last'],
    ['nets', 8, 'last'], ['price', 24, 'last'], ['extenders', 62, 'mean'],
];

const day = (t) => Math.floor(t / DAY) * DAY;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const num = (v) => (typeof v === 'bigint' ? Number(v) : v);
const plain = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));

async function pool(items, n, fn) {
    const out = new Array(items.length);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
        while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
    }));
    return out;
}

/** The public Grafana dashboard and stats feed, at `base` (a dev proxy locally). */
export function grafana(base = GRAFANA, { signal, fetchImpl = globalThis.fetch } = {}) {
    async function post(pid, from, to, step, mdp = 11000, tries = 3) {
        let err;
        for (let i = 0; i < tries; i++) {
            try {
                const r = await fetchImpl(`${base}/api/public/dashboards/${DASHBOARD}/panels/${pid}/query`, {
                    method: 'POST', signal, headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ intervalMs: step, maxDataPoints: mdp, timeRange: { from: String(from), to: String(to), timezone: 'utc' } }),
                });
                if (!r.ok) throw new Error(`grafana panel ${pid}: HTTP ${r.status}`);
                return frames(await r.json());
            } catch (e) {
                if (signal?.aborted) throw e;
                err = e;
                await new Promise((res) => setTimeout(res, 800 * (i + 1)));
            }
        }
        throw err;
    }
    async function stats() {
        const r = await fetchImpl(`${base}/stats.json`, { signal, cache: 'no-store' });
        if (!r.ok) throw new Error(`stats.json: HTTP ${r.status}`);
        return r.json();
    }
    return { post, stats };
}

function frames(d) {
    const out = [];
    for (const [ref, v] of Object.entries(d.results || {})) {
        for (const f of v.frames || []) {
            const vals = f.data.values;
            if (vals.length < 2) continue;
            const fld = f.schema.fields[1] || {};
            out.push({ ref, labels: fld.labels || {}, name: fld.config?.displayNameFromDS || fld.name, t: vals[0], v: vals[1] });
        }
    }
    return out;
}
const longest = (fs) => fs.reduce((a, f) => (!a || f.t.length > a.t.length ? f : a), null);
const last = (f) => (f && f.v.length ? f.v[f.v.length - 1] : null);

/** Hourly samples -> one value per UTC day (mean or last), keyed by ISO date; a day needs 12+ samples. */
function byDay(f, how) {
    const b = {};
    if (!f) return {};
    f.t.forEach((t, i) => { const v = f.v[i]; if (v != null) (b[iso(day(t))] ||= []).push(v); });
    const out = {};
    for (const [d, vs] of Object.entries(b)) if (vs.length >= 12) out[d] = how === 'mean' ? vs.reduce((a, x) => a + x, 0) / vs.length : vs[vs.length - 1];
    return out;
}

/** Country counts at time t (providers online by country). */
async function countriesAt(g, t, panel = 33) {
    const fs = await g.post(panel, t - H, t, 60000);
    const counts = {}, names = {};
    for (const f of fs) {
        const cc = f.labels.country_code;
        if (!cc) continue;
        counts[cc] = last(f);
        names[cc] = f.labels.country;
    }
    return { counts, names };
}

// ── the daily history (Node, once a day) ──────────────────────────────────

/**
 * Pull the history up to the end of yesterday (UTC) and merge it into `prev`
 * (the existing history.json, or null). Days already in `prev` are kept;
 * Grafana's figures for the last `days` days replace them, since late data
 * can still settle.
 */
export async function buildHistory({ g = grafana(), prev = null, now = Date.now(), days = ND, chain = true, countries = true, archive = FINNEY_ARCHIVE, log = () => {} } = {}) {
    const today = day(now), end = today - DAY;
    const from = end - (days - 1) * DAY;
    const h = prev ? structuredClone(prev) : { version: 1, days: {}, countries: {}, names: {}, settlePx: {}, tph: null };

    const put = (d, k, v) => { if (v != null) (h.days[d] ||= {})[k] = v; };
    await pool(GAUGES, 4, async ([k, pid, how]) => {
        const f = longest(await g.post(pid, from, today, H, Math.ceil((today - from) / H)));
        let vals = byDay(f, how);
        if (k === 'throughput') vals = Object.fromEntries(Object.entries(vals).map(([d, v]) => [d, v / 1e9]));
        for (const [d, v] of Object.entries(vals)) if (d >= iso(from) && d <= iso(end)) put(d, k, v);
        log(`${k}: ${Object.keys(vals).length} days`);
    });
    // daily panels: each point covers the day ending at its timestamp
    for (const [k, pid, scale] of [['traffic', 31, 1e12], ['newNets', 42, 1]]) {
        const f = longest(await g.post(pid, from + DAY, end + DAY, DAY));
        if (f) f.t.forEach((t, i) => { const d = iso(day(t) - DAY); if (f.v[i] != null && d >= iso(from) && d <= iso(end)) put(d, k, f.v[i] / scale); });
    }
    // hourly throughput, 90 days, for the hour-of-day pattern and the hourly split of data carried
    {
        const f = longest(await g.post(3, today - ND * DAY, today, H, 2200));
        const m = {};
        if (f) f.t.forEach((t, i) => { if (f.v[i] != null) m[Math.floor(t / H) * H] = f.v[i]; });
        const t0 = today - ND * DAY + H;
        h.tph = { t0, v: Array.from({ length: ND * 24 }, (_, i) => (m[t0 + i * H] != null ? +(m[t0 + i * H] / 1e9).toFixed(4) : null)) };
    }
    // countries at the end of each day (00:00 UTC of the next); only days not stored yet, the newest first
    const missing = [];
    if (countries) for (let t = end; t >= from; t -= DAY) if (!h.countries[iso(t)]) missing.push(t);
    await pool(missing.slice(0, 120), 4, async (t) => {
        try {
            const { counts, names } = await countriesAt(g, t + DAY);
            if (Object.keys(counts).length) { h.countries[iso(t)] = counts; Object.assign(h.names, names); }
        } catch (e) { log(`countries ${iso(t)}: ${e.message}`); }
    });
    // the α price at each epoch's settlement (its start, which ends the epoch before)
    const st = await g.stats();
    if (st.epoch_start) {
        for (let s = st.epoch_start * 1000, k = 0; k < 4 && s >= from; s -= EPOCH_MS, k++) {
            if (h.settlePx[s] != null) continue;
            const f = longest(await g.post(24, s - 2 * H, s + H, H, 10));
            let best = null;
            if (f) f.t.forEach((t, i) => { if (f.v[i] != null && t <= s + H && (!best || Math.abs(t - s) < Math.abs(best[0] - s))) best = [t, f.v[i]]; });
            if (best) h.settlePx[s] = best[1];
        }
    }
    // every finished epoch: its dates, users and operator deposits (Grafana panels 17 and 18, which
    // count up through an epoch and reset at the next) and data carried (the days it spans, split pro rata at its boundaries);
    // the epoch just finished takes the feed's own prev_* figures
    if (st.epoch) {
        const cur = st.epoch, s0 = st.epoch_start * 1000;
        const bounds = (k) => (k === 0 ? [MAINNET_FROM, s0 - (cur - 1) * EPOCH_MS] : [s0 - (cur - k) * EPOCH_MS, s0 - (cur - k - 1) * EPOCH_MS]);
        const hours = Math.ceil((today - MAINNET_FROM) / H);
        const [uf, df] = await Promise.all([17, 18].map((pid) => g.post(pid, MAINNET_FROM, today, H, hours).then((fs) => fs.find((f) => f.ref === 'A'))));
        h.epochs = {};
        for (let k = 0; k < cur; k++) {
            const [a, b] = bounds(k);
            let users = null, deposits = null, tb = 0, covered = 0;
            if (uf) uf.t.forEach((t, i) => { if (t > a && t <= b && uf.v[i] != null) users = Math.max(users ?? 0, uf.v[i]); });
            if (df) df.t.forEach((t, i) => { if (t > a && t <= b && df.v[i] != null) deposits = Math.max(deposits ?? 0, df.v[i]); });
            for (let d = day(a); d < b; d += DAY) {
                const v = h.days[iso(d)]?.traffic, o = Math.min(b, d + DAY) - Math.max(a, d);
                if (o > 0 && v != null) { tb += (v * o) / DAY; covered += o; }
            }
            h.epochs[k] = { start: a, end: b, users, deposits, dataGiB: covered >= (b - a) * 0.9 ? (tb * 1e12) / 2 ** 30 : null, settlePx: h.settlePx[b] ?? null };
        }
        const last = h.epochs[cur - 1];
        if (st.prev_users != null) last.users = st.prev_users;
        if (st.prev_data_gib != null) last.dataGiB = st.prev_data_gib;
        if (st.prev_demand_deposits_alpha != null) last.deposits = st.prev_demand_deposits_alpha;
    }
    // the reserve's balance at the end of each day, from the archive node
    if (chain) {
        try {
            const r = await readReserve({ address: RESERVE_WALLET });
            const block = num(r.block), time = num(r.time);
            const want = [];
            for (let t = Math.max(RESERVE_FROM, from) + DAY; t <= today; t += DAY) if (h.days[iso(t - DAY)]?.reserve == null) want.push(t);
            const blocks = want.map((t) => block - Math.round((time - t) / 12000));
            let samples = [];
            for (let pass = 0; pass < 3 && samples.length < blocks.length; pass++) {
                const todo = blocks.filter((b) => !samples.some((s) => num(s.block) === b));
                if (!todo.length) break;
                const res = await readReserveAt({ address: RESERVE_WALLET, hotkeys: r.stakeHotkeys, blocks: todo, endpoints: archive });
                samples = samples.concat(res.samples || []);
            }
            const at = new Map(blocks.map((b, i) => [b, want[i]])); // the day each block was chosen for
            for (const s of samples) { const t = at.get(num(s.block)); if (t) put(iso(t - DAY), 'reserve', num(s.alpha)); }
            log(`reserve: ${samples.length}/${blocks.length} days`);
        } catch (e) { log(`reserve history: ${e.message}`); }
    }
    h.end = iso(end);
    h.updated = new Date(now).toISOString();
    return h;
}

// ── the live view (browser, on load) ──────────────────────────────────────

/**
 * Everything the page needs: `history` for the days, live reads for today.
 * Missing parts come back null and the page leaves them out.
 */
export async function buildLive({ g = grafana(), history, now = Date.now(), endpoints = FINNEY_RPC, signal } = {}) {
    const NOW = now, hourEnd = Math.floor(NOW / H) * H;
    const hourT = Array.from({ length: NH }, (_, i) => hourEnd - (NH - 1 - i) * H);
    const soft = (p) => p.catch(() => null);

    // days the history file doesn't have yet (it's refreshed when the site is deployed) are read here from
    // Grafana: only the gap, without the per-day countries or the archive node's reserve balances
    const gap = history?.end ? Math.round((day(NOW) - DAY - Date.parse(history.end)) / DAY) : ND;
    const stale = gap > 0;
    const [st, hist, hourly, t24, t72, cNow, cExt, c1, c3, reserve, conviction] = await Promise.all([
        g.stats(),
        stale ? buildHistory({ g, prev: history, now: NOW, days: Math.min(ND, gap + 2), chain: false, countries: !history }) : Promise.resolve(history),
        pool(GAUGES, 4, ([k, pid]) => soft(g.post(pid, hourEnd - (NH + 1) * H, NOW, H, NH + 2).then(longest))),
        soft(g.post(1, hourEnd - 24 * H, hourEnd, H, 10).then((fs) => last(fs[0]))),
        soft(g.post(1, hourEnd - 72 * H, hourEnd, H, 10).then((fs) => last(fs[0]))),
        soft(countriesAt(g, NOW)),
        soft(countriesAt(g, NOW, 71)),
        soft(countriesAt(g, NOW - DAY)),
        soft(countriesAt(g, NOW - 3 * DAY)),
        soft(readReserve({ address: RESERVE_WALLET, endpoints, signal }).then(plain)),
        soft(readConviction({ endpoints, signal })),
    ]);

    const end = Date.parse(hist.end);
    const dayT = Array.from({ length: ND }, (_, i) => end - (ND - 1 - i) * DAY);
    const D = {};
    for (const k of [...GAUGES.map(([k]) => k), 'traffic', 'newNets', 'reserve']) D[k] = dayT.map((t) => hist.days[iso(t)]?.[k] ?? null);
    if (reserve && D.reserve[ND - 1] == null) D.reserve[ND - 1] = reserve.alpha;

    const Hs = {};
    GAUGES.forEach(([k], i) => {
        const f = hourly[i], m = {};
        if (f) f.t.forEach((t, j) => { if (f.v[j] != null) m[Math.floor(t / H) * H + H] = f.v[j]; });
        Hs[k] = hourT.map((t) => m[t] ?? null);
    });
    Hs.throughput = Hs.throughput.map((v) => (v == null ? null : v / 1e9));
    Hs.newNets = Hs.nets.map((v, i) => (i && v != null && Hs.nets[i - 1] != null ? Math.max(0, v - Hs.nets[i - 1]) : null));
    Hs.traffic = hourlyTraffic(hourT, Hs.throughput, D, dayT, t24, t72);
    Hs.reserve = hourT.map(() => null);
    if (reserve) Hs.reserve[NH - 1] = reserve.alpha;

    const at = (P) => {
        const want = iso(day(NOW - P * DAY) - DAY);
        const dates = Object.keys(hist.countries).filter((d) => d <= want).sort();
        return dates.length ? hist.countries[dates[dates.length - 1]] : {};
    };
    const names = { ...hist.names, ...(cNow?.names || {}) };
    const ep = (k) => (st[k] == null ? null : st[k] * 1000);
    const alphaBy = Object.fromEntries((reserve?.stakes || []).map((s) => [s.hotkey, s.alpha]));

    return {
        NOW, END: end, dayT, hourT, D, Hs,
        LIVE: {
            providers: st.online_providers, throughput: Hs.throughput[NH - 1], conn: Hs.conn[NH - 1], users24: Hs.users24[NH - 1],
            countries: st.countries, regions: Hs.regions[NH - 1], cities: Hs.cities[NH - 1], nets: st.total_networks, devices: Hs.devices[NH - 1],
        },
        COUNTRY_NOW: cNow?.counts || {}, COUNTRY_NAMES: names,
        COUNTRY_PAST: { 1: c1?.counts || {}, 3: c3?.counts || {}, 7: at(7), 30: at(30), 90: at(90) },
        EXT: {
            online: st.online_extenders, v4: st.online_extenders_ipv4, v6: st.online_extenders_ipv6, dual: st.online_extenders_dualstack,
            list: Object.entries(cExt?.counts || {}).map(([c, v]) => [c, cExt.names[c], v]).sort((a, b) => b[2] - a[2]),
        },
        IPFAM: { v4: st.online_providers_ipv4, v6: st.online_providers_ipv6, dual: st.online_providers_dualstack },
        EPOCH: {
            n: st.epoch, start: ep('epoch_start'), end: ep('epoch_end'), startBlock: st.epoch_start_block, endBlock: st.epoch_end_block,
            users: st.users, prevUsers: st.prev_users, dataGiB: st.data_gib, prevDataGiB: st.prev_data_gib,
        },
        TOKEN: reserve ? {
            usd: st.alpha_usd, tao: reserve.pool?.priceTao, alphaOut: reserve.pool?.alphaOut, poolAlpha: reserve.pool?.alphaIn,
            poolTao: reserve.pool?.taoIn, block: reserve.block, blockTime: reserve.time,
        } : { usd: st.alpha_usd },
        EMISSION: reserve?.emission ?? null, ROUTING: reserve?.routing ?? null,
        RESERVE: reserve ? { alpha: reserve.alpha, wallet: RESERVE_WALLET, block: reserve.block, time: reserve.time } : null,
        TPH: hist.tph,
        EXTRA: {
            minerAlpha: st.miner_emissions_alpha || 0, prevMinerAlpha: st.prev_miner_emissions_alpha || 0, claimsAlpha: 0,
            depositAlpha: st.demand_deposits_alpha || 0, prevDepositAlpha: st.prev_demand_deposits_alpha || 0,
            recipients: (reserve?.hotkeys || []).map((x) => ({ hotkey: x.hotkey, uid: x.uid, alpha: alphaBy[x.hotkey] || 0 })),
            prevSettlePx: hist.settlePx?.[ep('epoch_start')] ?? null,
            epochs: hist.epochs || null,
            payouts: PAYOUTS,
            conviction,
        },
        HISTORY: { end: hist.end, updated: hist.updated, rebuilt: stale },
    };
}

/**
 * Data carried per hour (TB): each hour's share of a measured total, in
 * proportion to its throughput. The last 24 h and the 48 h before them use
 * panel 1's exact sums; earlier hours use their day's total from the history.
 */
function hourlyTraffic(hourT, thr, D, dayT, t24, t72) {
    const out = hourT.map(() => null), n = hourT.length;
    const spread = (from, to, total) => {
        let s = 0;
        for (let i = from; i < to; i++) if (thr[i] != null) s += thr[i];
        if (!s || total == null) return;
        for (let i = from; i < to; i++) if (thr[i] != null) out[i] = (total * thr[i]) / s;
    };
    const dayIdx = Object.fromEntries(dayT.map((t, i) => [t, i]));
    for (let i = 0; i < n - 72; i++) {
        const d = Math.floor((hourT[i] - H) / DAY) * DAY, di = dayIdx[d];
        if (di == null || D.traffic[di] == null || thr[i] == null) continue;
        let s = 0, c = 0;
        for (let j = 0; j < n; j++) if (Math.floor((hourT[j] - H) / DAY) * DAY === d && thr[j] != null) { s += thr[j]; c++; }
        if (c >= 20) out[i] = (D.traffic[di] * thr[i]) / s; // the day's hours in the window carry its total
    }
    spread(n - 24, n, t24 == null ? null : t24 / 1e12);
    spread(n - 72, n - 24, t24 == null || t72 == null ? null : (t72 - t24) / 1e12);
    return out;
}
