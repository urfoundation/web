// /dashboard's Grafana for the browser tests. The page reads grafana.bringyour.com (through /__grafana off
// ur.xyz, dashboard/loader.js): its stats feed, /stats.json, and its public dashboard's panel queries, POST
// /api/public/dashboards/<id>/panels/<n>/query. This answers both in their own shapes (lib/dashboardData.js
// reads them) with made-up figures of the right size, so the page renders offline:
//
//   await page.route('**/__grafana/**', dashboardGrafana());
//
// A figure depends only on the time it is asked for (a daily rhythm on a slow rise), never on when the test
// runs, so two renders within the same hour draw the same page, and any gap between the committed history
// (public/dashboard/history.json) and today is filled as the live Grafana would fill it. The epoch is the
// anchor's (lib/epoch.js), as the live feed reports it. Bittensor mainnet is not here: the tests leave the chain
// unreachable or answer it with nothing, and the page shows what it reads from there as unavailable.
import { epochAt } from '../src/lib/epoch.js';

const H = 3_600_000, DAY = 86_400_000;
// the figures below are the network's around this day (the committed history ends near it), so the days
// read from here join the history's own
const MIDDLE = Date.UTC(2026, 10, 10);

// a rhythm through the day (busiest in the late afternoon UTC) on a rise of 0.2% a day
const shape = (t) => (1 + 0.12 * Math.sin(((t % DAY) / DAY - 0.4) * 2 * Math.PI)) * (1 + (0.002 * (t - MIDDLE)) / DAY);
const networks = (t) => Math.round(1_211_700 + (540 * (t - MIDDLE)) / DAY);
// data carried: about 10.8 TB a day
const BYTES_A_DAY = 10.8e12;
// providers online by country (panel 33), as Grafana labels them; extenders (panel 71) in some of them
export const COUNTRIES = [
    ['US', 'United States', 21_400], ['DE', 'Germany', 9_800], ['FR', 'France', 7_900], ['GB', 'United Kingdom', 7_200],
    ['VN', 'Vietnam', 6_100], ['BR', 'Brazil', 5_600], ['ES', 'Spain', 4_300], ['IT', 'Italy', 4_100], ['CA', 'Canada', 3_900],
    ['TH', 'Thailand', 3_500], ['NL', 'Netherlands', 3_200], ['RU', 'Russia', 2_900], ['IN', 'India', 2_700], ['SG', 'Singapore', 2_300],
    ['KR', 'South Korea', 2_100], ['JP', 'Japan', 1_900], ['PH', 'Philippines', 1_700], ['HK', 'Hong Kong', 1_500], ['SE', 'Sweden', 1_300],
    ['CN', 'China', 1_200], ['AT', 'Austria', 1_100], ['MX', 'Mexico', 1_000], ['AU', 'Australia', 950], ['RO', 'Romania', 900],
    ['ID', 'Indonesia', 850], ['UA', 'Ukraine', 800], ['TR', 'Turkey', 700], ['ZA', 'South Africa', 600], ['PL', 'Poland', 550],
    ['AR', 'Argentina', 500], ['NG', 'Nigeria', 420], ['KE', 'Kenya', 300], ['EG', 'Egypt', 260], ['AE', 'United Arab Emirates', 240],
    ['SA', 'Saudi Arabia', 200], ['IR', 'Iran', 120], ['NZ', 'New Zealand', 110], ['PE', 'Peru', 90], ['MO', 'Macao', 12], ['TW', 'Taiwan', 400],
];
const EXTENDERS = [['US', 'United States', 61], ['DE', 'Germany', 38], ['NL', 'Netherlands', 27], ['FR', 'France', 21], ['GB', 'United Kingdom', 17],
    ['SG', 'Singapore', 14], ['JP', 'Japan', 11], ['CA', 'Canada', 9], ['BR', 'Brazil', 6], ['KE', 'Kenya', 3]];

// the hourly gauges (lib/dashboardData.js GAUGES): their size at mainnet's start, and whether a count is whole
const GAUGES = {
    36: [115_000, true], 3: [3.9e9, false], 32: [840, false], 43: [76_800, true], 4: [204_000, true], 9: [COUNTRIES.length, true],
    38: [608, true], 40: [1_830, true], 24: [0.88, false], 62: [210, true],
};

/** The stats feed at `now`, as grafana.bringyour.com/stats.json writes it (constant within an hour). */
export function grafanaStats(now = Date.now()) {
    const e = epochAt(now), hour = Math.floor(now / H) * H;
    return {
        block: e.number, epoch: e.number, epoch_start: e.startMs / 1000, epoch_end: e.endMs / 1000,
        epoch_start_block: e.startBlock, epoch_end_block: e.endBlock,
        users: Math.round(160_000 * ((hour - e.startMs) / (e.endMs - e.startMs) + 0.1)), data_gib: 41_000.5, total_networks: networks(hour),
        online_providers: 110_282, countries: COUNTRIES.length, staked_alpha: 0, demand_deposits_alpha: 0, miner_emissions_alpha: 1_695.15, alpha_usd: 0.8424,
        online_extenders: 212, online_providers_ipv4: 109_581, online_providers_ipv6: 33, online_providers_dualstack: 668,
        online_extenders_ipv4: 133, online_extenders_ipv6: 6, online_extenders_dualstack: 73,
        prev_users: 177_501, prev_data_gib: 62_772.3, prev_demand_deposits_alpha: 0, prev_miner_emissions_alpha: 4_132.72,
    };
}

const frame = (ref, labels, name, t, v) => ({
    schema: { refId: ref, fields: [{ name: 'Time', type: 'time' }, { name: 'Value', type: 'number', labels, config: { displayNameFromDS: name } }] },
    data: { values: [t, v] },
});
// the points of a range query: one a step, at multiples of the step, at most maxDataPoints
function times(from, to, step, max) {
    const at = Math.max(step, 60_000, Math.ceil((to - from) / Math.max(1, max || 11_000)));
    const t = [];
    for (let x = Math.ceil(from / at) * at; x <= to && t.length < 20_000; x += at) t.push(x);
    return t;
}
// users (panel 17) count up through each epoch; B is the epoch before's total, from the end of that epoch
const usersSoFar = (t) => { const e = epochAt(t); return e ? Math.round(180_000 * Math.min(1, (t - e.startMs) / (e.endMs - e.startMs))) : null; };

/** Panel `pid`'s answer to a query (its JSON body), in Grafana's shape, or null for a panel the page never asks. */
export function grafanaPanel(pid, query) {
    const from = Number(query?.timeRange?.from), to = Number(query?.timeRange?.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return { results: {} };
    const t = times(from, to, Number(query.intervalMs) || H, Number(query.maxDataPoints));
    const one = (ref, labels, name, v) => ({ [ref]: { status: 200, frames: [frame(ref, labels, name, t, t.map(v))] } });
    if (GAUGES[pid]) {
        const [size, whole] = GAUGES[pid];
        return { results: one('A', {}, 'value', (x) => (whole ? Math.round(size * shape(x)) : size * shape(x))) };
    }
    if (pid === 8) return { results: one('A', {}, 'networks', networks) };
    // data carried over the whole range, as one figure (the page reads the last)
    if (pid === 1) return { results: { A: { status: 200, frames: [frame('A', {}, 'bytes', [to], [((to - from) / DAY) * BYTES_A_DAY])] } } };
    // a day's total, at the end of the day it covers
    if (pid === 31) return { results: one('A', {}, 'bytes', (x) => BYTES_A_DAY * shape(x - DAY / 2)) };
    if (pid === 42) return { results: one('A', {}, 'networks', () => 540) };
    if (pid === 17 || pid === 18) {
        const scale = pid === 17 ? 1 : 0;
        const prev = (x) => { const e = epochAt(x); return e && e.number > 0 ? 180_000 * scale : null; };
        return { results: { ...one('A', {}, 'this epoch', (x) => usersSoFar(x) * scale), ...one('B', {}, 'last epoch', prev) } };
    }
    if (pid === 33 || pid === 71) {
        // an instant query: one point a country, at the end of the range
        const list = pid === 33 ? COUNTRIES : EXTENDERS;
        return { results: { A: { status: 200, frames: list.map(([code, name, n]) => frame('A', { country: name, country_code: code }, name, [to], [Math.round(n * shape(to))])) } } };
    }
    return null;
}

/** A Playwright route handler for **\/__grafana/**: stats.json and the panel queries; anything else is a 404. */
export function dashboardGrafana() {
    return (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.endsWith('/stats.json')) return route.fulfill({ json: grafanaStats() });
        const panel = /\/panels\/(\d+)\/query$/.exec(url.pathname);
        const answer = panel && request.method() === 'POST' ? grafanaPanel(Number(panel[1]), JSON.parse(request.postData() || '{}')) : null;
        return answer ? route.fulfill({ json: answer }) : route.fulfill({ status: 404, body: 'no fixture' });
    };
}
