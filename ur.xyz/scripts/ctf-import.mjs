#!/usr/bin/env node
// ctf-import.mjs — writes the capture the flag pages' data,
// react/src/data/ctf-epoch.json: a snapshot of GET /sn/ctf (sn/api/operator.yml).
//
// /ctf and its 249 country pages are built from the snapshot, so every figure
// is in the HTML that search engines and AI crawlers read, and a page changes
// (and its sitemap <lastmod> with it) only when its data does. The import runs
// after each epoch's census and root, and the site is rebuilt and deployed
// from the result (SITEMAP.md, "Capture the flag").
//
// The snapshot keeps the answer's facts in the page's terms: amounts are
// integers of rao (the answer's `rao`; its `alpha` strings say the same), a
// role keeps the slots won rather than total/won/open, and the figures the
// answer derives (each role's win estimate, entries and chance to win, each
// country's available amount) are checked against their definitions here and
// derived again by the page (react/src/components/pages/ctf/model.js). Every
// answer is checked before anything is written: 249 countries in code order,
// the draw figures null together, the slot and pot arithmetic, and the totals.
// Each country also gets the providers the network's dashboard counted online
// there (react/public/dashboard/history.json, panel 33 at the end of each UTC
// day): its count on the snapshot's day, and over the 90 days to it the days
// it had any, the last such day and the most at the end of a day.
//
// An answer taken while an epoch's draw is pending after a drawn epoch is
// refused: its pots and open slots are last epoch's, carried into a draw that
// newcomers can no longer enter, so the pages would be an epoch off. Import
// once that epoch's root is committed. (Before the first root, a pending
// draw is the whole story, and the pages say so.)
//
// Before capture the flag starts (epoch 8, the owner's decision) there is no
// answer to import: --prelaunch writes the pre-launch snapshot from the
// server's country table (the 249 codes of ISO 3166-1 that the CTF pool's
// country list is) and the site's time basis for epoch 8 (lib/epoch.js), with
// the sentence names the API gives (design.html's table).
//
// Usage (from ur.xyz):
//   node scripts/ctf-import.mjs                          read GET https://api.bringyour.com/sn/ctf
//   node scripts/ctf-import.mjs --from <answer.json>     a saved answer instead
//   node scripts/ctf-import.mjs --prelaunch --names <server>/model/iso_country_names.go [--now <iso>]
//   ... --check                                          exit 1 if the snapshot is not what the import writes
// Then render the social card for the new snapshot (node scripts/generate-og.mjs --ctf) and rebuild.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SNAPSHOT_FILE = path.join(ROOT, 'react/src/data/ctf-epoch.json');
const HISTORY_FILE = path.join(ROOT, 'react/public/dashboard/history.json');
export const API_URL = 'https://api.bringyour.com/sn/ctf';
export const SCHEMA = 'ur.xyz/ctf-epoch/v1';

export const COUNTRY_COUNT = 249;
export const SLOTS_PER_ROLE = 5;
export const TOTAL_SLOTS = 2 * SLOTS_PER_ROLE * COUNTRY_COUNT;
// the seven territories without a permanent population (CAPTURETHEFLAG.md §4.1)
export const UNINHABITED = Object.freeze(['aq', 'bv', 'gs', 'hm', 'io', 'tf', 'um']);
// CTF's first epoch and its bounds on the site's time basis (lib/epoch.js:
// block 9,600,028 at about 18:25 UTC on November 27, as /mainnet gives it)
export const FIRST_EPOCH = 8;
const PRESENCE_DAYS = 90;
const ROLES = ['providers', 'extenders'];

// The name as a sentence uses it, as the API gives `sentence_name`
// (design.html's THE set and SAY map): "the " + the short name for these,
const THE = new Set(['us', 'gb', 'nl', 'ph', 'ae', 'bs', 'cf', 'do', 'gm', 'ky', 'mh', 'mv', 'sb', 'sc', 'tc', 'cc', 'ck', 'fk', 'mp', 'km', 'fo']);
// and these by name.
const SAY = {
    cd: 'the DR Congo', vg: 'the British Virgin Islands', vi: 'the U.S. Virgin Islands', um: 'the U.S. Outlying Islands',
    io: 'the British Indian Ocean Territory', bq: 'the Caribbean Netherlands', fm: 'Micronesia', ps: 'Palestine',
    va: 'Vatican City', sh: 'Saint Helena', gs: 'South Georgia', hm: 'Heard Island', ru: 'Russia', bn: 'Brunei',
};

export function sentenceName(code, name) {
    if (SAY[code]) return SAY[code];
    const short = name.split(',')[0].replace(/ \(.*\)$/, '');
    return (THE.has(code) ? 'the ' : '') + short;
}

/** The server's country table (server/model/iso_country_names.go): code → English name, in code order. */
export function parseNames(goSource) {
    const names = new Map();
    for (const m of goSource.matchAll(/^\s*"([a-z]{2})":\s*"((?:[^"\\]|\\.)*)",\s*$/gm)) names.set(m[1], JSON.parse(`"${m[2]}"`));
    return new Map([...names].sort(([a], [b]) => (a < b ? -1 : 1)));
}

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const dayOf = (isoTime) => isoTime.slice(0, 10);

/**
 * The providers the dashboard counted online in each country: on `day` (the
 * latest day of the history on or before it) and the days of the PRESENCE_DAYS
 * before it, that one included, with any. Null without a history.
 */
export function presenceFrom(history, day) {
    const days = Object.keys(history?.countries || {}).filter((d) => d <= day).sort().slice(-PRESENCE_DAYS);
    if (!days.length) return null;
    const last = days[days.length - 1];
    const byCode = {};
    for (const d of days) {
        for (const [cc, count] of Object.entries(history.countries[d])) {
            const code = cc.toLowerCase();
            const entry = (byCode[code] ||= { online: 0, seen_days: 0, last_seen: null, peak: 0 });
            const n = Math.round(count);
            if (n > 0) {
                entry.seen_days += 1;
                entry.last_seen = d; // days run in order
                entry.peak = Math.max(entry.peak, n);
            }
            if (d === last) entry.online = n;
        }
    }
    return { meta: { source: 'https://ur.xyz/dashboard', day: last, days: days.length }, byCode };
}

function withPresence(country, presence) {
    if (!presence) return { ...country, online: null, seen_days: null, last_seen: null, peak: null };
    const p = presence.byCode[country.code] || { online: 0, seen_days: 0, last_seen: null, peak: 0 };
    return { ...country, online: p.online, seen_days: p.seen_days, last_seen: p.last_seen, peak: p.peak };
}

const about = 'The capture the flag pages (ur.xyz/ctf and /ctf/<cc>): a snapshot of GET https://api.bringyour.com/sn/ctf, '
    + 'written by scripts/ctf-import.mjs; do not edit it by hand. Amounts are integers of rao (1 alpha is 10^9 rao). '
    + 'A role\'s won, units and near_misses, and a country\'s near_misses, are null without a draw last epoch. '
    + 'online, seen_days, last_seen and peak are the providers the dashboard counted online in the country at the end of a day '
    + '(react/public/dashboard/history.json): on the presence day, the days of the window with any, the last of them, and the most.';

/** The snapshot before capture the flag starts: no draw, no pots, the epoch 8 schedule. */
export function prelaunch({ names, presence, now, bounds }) {
    const countries = [...names].map(([code, name]) => withPresence({
        code,
        name,
        sentence_name: sentenceName(code, name),
        inhabited: !UNINHABITED.includes(code),
        flag_held: false,
        open_epochs: 0,
        near_misses: null,
        awarded: 0,
        providers: { won: null, units: null, near_misses: null, pot: 0, awarded: 0 },
        extenders: { won: null, units: null, near_misses: null, pot: 0, awarded: 0 },
    }, presence));
    return {
        about,
        schema: SCHEMA,
        source: API_URL,
        as_of: iso(now),
        first_epoch: FIRST_EPOCH,
        prelaunch: { start_block: bounds.startBlock, starts_at: iso(bounds.startMs) },
        pool: null,
        current_epoch: { epoch: FIRST_EPOCH, start_block: bounds.startBlock, end_block: bounds.endBlock - 1, draw_at: iso(bounds.endMs) },
        last_epoch: null,
        pending_draw: null,
        totals: { flags_held: 0, not_fully_captured: null },
        presence: presence?.meta || null,
        countries,
    };
}

// ── the answer of GET /sn/ctf ────────────────────────────────────────────────

const isInt = (v) => Number.isSafeInteger(v);
const alphaOf = (rao) => `${Math.floor(rao / 1e9)}.${String(rao % 1e9).padStart(9, '0')}`;

/** Every way `api` departs from operator.yml's CtfState and its arithmetic; [] when none. */
export function apiProblems(api) {
    const out = [];
    const bad = (msg) => out.push(msg);
    const amount = (a, where, { nullable = false } = {}) => {
        if (a === null && nullable) return null;
        if (!a || !isInt(a.rao) || a.rao < 0 || a.alpha !== alphaOf(a.rao)) {
            bad(`${where}: not an amount (${JSON.stringify(a)})`);
            return null;
        }
        return a.rao;
    };
    if (!api || typeof api !== 'object') return ['the answer is not an object'];
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(api.as_of || '')) bad(`as_of ${api.as_of}`);
    if (api.unit?.symbol !== 'α' || api.unit?.decimals !== 9 || api.unit?.netuid !== 25) bad('unit is not alpha on subnet 25');
    if (!isInt(api.pool?.first_epoch) || !isInt(api.pool?.pool_id)) bad('pool has no first_epoch or pool_id');
    const ce = api.current_epoch;
    if (!isInt(ce?.epoch) || !isInt(ce?.start_block) || !isInt(ce?.end_block) || !/Z$/.test(ce?.draw_at || '')) bad('current_epoch is incomplete');
    const le = api.last_epoch;
    let slot = null;
    if (le !== null) {
        if (!le || !isInt(le.epoch) || typeof le.drawn !== 'boolean' || !le.root || !le.amounts || !le.slots) bad('last_epoch is incomplete');
        else {
            slot = amount(le.amounts.slot, 'last_epoch.amounts.slot');
            for (const k of ['funding', 'returned', 'owed', 'fresh', 'awarded', 'paid', 'pending_paid', 'pending_in', 'pending', 'carried_in', 'carried']) amount(le.amounts[k], `last_epoch.amounts.${k}`);
            if (le.amounts.slot?.rao !== Math.floor(le.amounts.fresh?.rao / TOTAL_SLOTS)) bad('last_epoch: slot is not floor(fresh / 2490)');
            if (le.slots.total !== TOTAL_SLOTS || le.slots.won + le.slots.open !== TOTAL_SLOTS) bad('last_epoch.slots do not add up to 2,490');
            if (!['pending', 'finalized'].includes(le.root.status)) bad(`last_epoch.root.status ${le.root.status}`);
            if (ce && le.epoch >= ce.epoch) bad('last_epoch is not before current_epoch');
        }
    }
    const pd = api.pending_draw;
    if (pd !== null && (!pd || !isInt(pd.epoch) || [pd.census_hash, pd.census_block, pd.round].some((v) => v === undefined))) bad('pending_draw is incomplete');
    const drawn = Boolean(le?.drawn);
    const countries = Array.isArray(api.countries) ? api.countries : [];
    if (countries.length !== COUNTRY_COUNT) bad(`${countries.length} countries, not ${COUNTRY_COUNT}`);
    const codes = countries.map((c) => c?.code);
    if (codes.some((c, i) => !/^[a-z]{2}$/.test(c || '') || (i > 0 && c <= codes[i - 1]))) bad('the countries are not 249 distinct lowercase codes in code order');
    const sums = { won: 0, awarded: 0, pots: 0, held: 0, openP: 0, openX: 0 };
    for (const c of countries) {
        if (!c || typeof c.name !== 'string' || !c.name || typeof c.sentence_name !== 'string' || !c.sentence_name) {
            bad(`${c?.code}: no name or sentence_name`);
            continue;
        }
        if (c.inhabited !== !UNINHABITED.includes(c.code)) bad(`${c.code}: inhabited is ${c.inhabited}`);
        if (!isInt(c.open_epochs) || c.open_epochs < 0) bad(`${c.code}: open_epochs ${c.open_epochs}`);
        const awarded = amount(c.awarded, `${c.code}.awarded`);
        let roleAwards = 0;
        let pots = 0;
        let wonBoth = 0;
        for (const role of ROLES) {
            const r = c[role];
            const where = `${c.code}.${role}`;
            if (!r) { bad(`${where}: missing`); continue; }
            const pot = amount(r.pot, `${where}.pot`);
            const got = amount(r.awarded, `${where}.awarded`);
            pots += pot || 0;
            roleAwards += got || 0;
            const est = amount(r.win_estimate, `${where}.win_estimate`, { nullable: true });
            if (le === null ? r.win_estimate !== null || pot !== 0 : est !== slot + Math.floor((pot || 0) / 5)) bad(`${where}: win_estimate is not slot + floor(pot / 5)`);
            const figures = [r.slots, r.units, r.near_misses, r.entries, r.chance_to_win];
            if (!drawn) {
                if (figures.some((v) => v !== null)) bad(`${where}: draw figures without a draw last epoch`);
                if (got !== 0) bad(`${where}: an award without a draw`);
                continue;
            }
            if (figures.some((v) => v === null || v === undefined)) { bad(`${where}: draw figures missing`); continue; }
            const { total, won, open } = r.slots;
            if (total !== SLOTS_PER_ROLE || !isInt(won) || won < 0 || won > SLOTS_PER_ROLE || won + open !== SLOTS_PER_ROLE) bad(`${where}: slots ${JSON.stringify(r.slots)}`);
            if (!isInt(r.units) || won !== Math.min(SLOTS_PER_ROLE, r.units)) bad(`${where}: ${won} won from ${r.units} units`);
            if (!isInt(r.near_misses) || r.near_misses < 0) bad(`${where}: near_misses ${r.near_misses}`);
            if (r.entries !== r.units + 1) bad(`${where}: entries is not units + 1`);
            if (Math.abs(r.chance_to_win - Math.min(1, SLOTS_PER_ROLE / r.entries)) > 1e-12) bad(`${where}: chance_to_win is not min(1, 5 / entries)`);
            if (won === SLOTS_PER_ROLE && pot !== 0) bad(`${where}: five winners left a pot`);
            if (won === 0 && got !== 0) bad(`${where}: an award without a winner`);
            sums.won += won;
            if (won === SLOTS_PER_ROLE) wonBoth += 1;
            else if (role === 'providers') sums.openP += 1;
            else sums.openX += 1;
        }
        if (awarded !== roleAwards) bad(`${c.code}: awarded is not the roles' awards`);
        const avail = amount(c.available, `${c.code}.available`, { nullable: true });
        if (le === null ? c.available !== null : avail !== pots + 10 * slot) bad(`${c.code}: available is not both pots + 10 slots`);
        if (drawn) {
            const nm = c.providers?.near_misses + c.extenders?.near_misses;
            if (c.near_misses !== nm) bad(`${c.code}: near_misses is not the roles' sum`);
            if (c.flag_held !== (wonBoth === 2)) bad(`${c.code}: flag_held ${c.flag_held} with ${wonBoth} roles fully captured`);
        } else if (c.near_misses !== null || c.flag_held !== false) {
            bad(`${c.code}: near misses or a held flag without a draw last epoch`);
        }
        if (c.flag_held) sums.held += 1;
        sums.awarded += awarded || 0;
        sums.pots += pots;
    }
    if (api.totals?.countries !== COUNTRY_COUNT) bad('totals.countries is not 249');
    if (api.totals?.flags_held !== sums.held) bad(`totals.flags_held ${api.totals?.flags_held}, the countries hold ${sums.held}`);
    const nfc = api.totals?.not_fully_captured;
    if (drawn ? nfc?.providers !== sums.openP || nfc?.extenders !== sums.openX : nfc !== null) bad('totals.not_fully_captured does not count the countries');
    if (le && le.amounts && le.slots) {
        if (drawn && le.slots.won !== sums.won) bad(`last_epoch.slots.won ${le.slots.won}, the countries won ${sums.won}`);
        if (le.amounts.awarded?.rao !== sums.awarded) bad('last_epoch.amounts.awarded is not the countries\' awards');
        if (le.amounts.carried?.rao !== sums.pots) bad('last_epoch.amounts.carried is not the countries\' pots');
    }
    return out;
}

/** The snapshot of a checked GET /sn/ctf answer. */
export function normalize(api, presence) {
    const problems = apiProblems(api);
    if (problems.length) throw new Error(`the answer is not a valid GET /sn/ctf:\n  ${problems.slice(0, 20).join('\n  ')}`);
    const le = api.last_epoch;
    const role = (r) => ({
        won: r.slots ? r.slots.won : null,
        units: r.units,
        near_misses: r.near_misses,
        pot: r.pot.rao,
        awarded: r.awarded.rao,
    });
    return {
        about,
        schema: SCHEMA,
        source: API_URL,
        as_of: api.as_of,
        first_epoch: api.pool.first_epoch,
        prelaunch: null,
        pool: { no_id: api.pool.no_id, pool_id: api.pool.pool_id, vault: api.pool.vault, carry_contract: api.pool.carry_contract },
        current_epoch: { epoch: api.current_epoch.epoch, start_block: api.current_epoch.start_block, end_block: api.current_epoch.end_block, draw_at: api.current_epoch.draw_at },
        last_epoch: le && {
            epoch: le.epoch,
            drawn: le.drawn,
            root_status: le.root.status,
            committed_block: le.root.committed_block,
            finalized_block: le.root.finalized_block,
            slot: le.amounts.slot.rao,
            fresh: le.amounts.fresh.rao,
            awarded: le.amounts.awarded.rao,
            paid: le.amounts.paid.rao,
            pending: le.amounts.pending.rao,
            carried: le.amounts.carried.rao,
            won: le.slots.won,
        },
        pending_draw: api.pending_draw && { epoch: api.pending_draw.epoch, census_hash: api.pending_draw.census_hash, census_block: api.pending_draw.census_block, round: api.pending_draw.round },
        totals: { flags_held: api.totals.flags_held, not_fully_captured: api.totals.not_fully_captured },
        presence: presence?.meta || null,
        countries: api.countries.map((c) => withPresence({
            code: c.code,
            name: c.name,
            sentence_name: c.sentence_name,
            inhabited: c.inhabited,
            flag_held: c.flag_held,
            open_epochs: c.open_epochs,
            near_misses: c.near_misses,
            awarded: c.awarded.rao,
            providers: role(c.providers),
            extenders: role(c.extenders),
        }, presence)),
    };
}

/** Every way a snapshot breaks the pages' invariants; [] when none (tests/ctf.test.mjs). */
export function snapshotProblems(s) {
    const out = [];
    const bad = (msg) => out.push(msg);
    if (s?.schema !== SCHEMA) return [`schema ${s?.schema}, not ${SCHEMA}`];
    const countries = s.countries || [];
    if (countries.length !== COUNTRY_COUNT) bad(`${countries.length} countries, not ${COUNTRY_COUNT}`);
    const codes = countries.map((c) => c.code);
    if (codes.some((c, i) => !/^[a-z]{2}$/.test(c) || (i > 0 && c <= codes[i - 1]))) bad('the codes are not distinct lowercase pairs in code order');
    if (codes.includes('xk')) bad('xk is not an ISO 3166-1 code');
    const drawn = Boolean(s.last_epoch?.drawn);
    const potsKnown = Boolean(s.last_epoch);
    if (s.prelaunch && (s.last_epoch || s.pending_draw || s.current_epoch?.epoch !== s.first_epoch)) bad('a pre-launch snapshot with a draw');
    if (s.pending_draw && s.last_epoch) bad(`epoch ${s.pending_draw.epoch}'s draw is pending after a drawn epoch: import once its root is committed`);
    let won = 0;
    let pots = 0;
    let awarded = 0;
    let held = 0;
    const open = { providers: 0, extenders: 0 };
    for (const c of countries) {
        if (!c.name || !c.sentence_name) bad(`${c.code}: no name`);
        if (c.inhabited !== !UNINHABITED.includes(c.code)) bad(`${c.code}: inhabited ${c.inhabited}`);
        let both = 0;
        for (const role of ROLES) {
            const r = c[role];
            if (!isInt(r.pot) || r.pot < 0) bad(`${c.code}.${role}: pot ${r.pot}`);
            if (!potsKnown && r.pot !== 0) bad(`${c.code}.${role}: a pot before the first root`);
            if (!isInt(r.awarded) || r.awarded < 0) bad(`${c.code}.${role}: awarded ${r.awarded}`);
            if (!drawn) {
                if (r.won !== null || r.units !== null || r.near_misses !== null) bad(`${c.code}.${role}: draw figures without a draw`);
                continue;
            }
            if (!isInt(r.won) || r.won < 0 || r.won > SLOTS_PER_ROLE) bad(`${c.code}.${role}: ${r.won} winners`);
            if (r.won !== Math.min(SLOTS_PER_ROLE, r.units)) bad(`${c.code}.${role}: ${r.won} won from ${r.units} units`);
            if (r.won === SLOTS_PER_ROLE) both += 1;
            else open[role] += 1;
            won += r.won;
        }
        if (c.flag_held !== (both === 2)) bad(`${c.code}: flag_held ${c.flag_held}`);
        if (c.awarded !== c.providers.awarded + c.extenders.awarded) bad(`${c.code}: awarded is not its roles' sum`);
        if (c.online !== null && (!isInt(c.online) || c.online < 0 || !isInt(c.seen_days) || !isInt(c.peak) || c.peak < c.online
            || (c.seen_days > 0) !== (c.last_seen !== null) || (c.last_seen !== null && !/^\d{4}-\d{2}-\d{2}$/.test(c.last_seen)))) {
            bad(`${c.code}: dashboard counts ${JSON.stringify([c.online, c.seen_days, c.last_seen, c.peak])}`);
        }
        if (c.flag_held) held += 1;
        pots += c.providers.pot + c.extenders.pot;
        awarded += c.awarded;
    }
    if (s.totals.flags_held !== held) bad(`flags_held ${s.totals.flags_held}, the countries hold ${held}`);
    const nfc = s.totals.not_fully_captured;
    if (drawn ? nfc?.providers !== open.providers || nfc?.extenders !== open.extenders : nfc !== null) bad('not_fully_captured does not count the countries');
    if (s.last_epoch) {
        if (s.last_epoch.carried !== pots) bad(`carried ${s.last_epoch.carried}, the countries' pots ${pots}`);
        if (s.last_epoch.awarded !== awarded) bad(`awarded ${s.last_epoch.awarded}, the countries' awards ${awarded}`);
        if (drawn && s.last_epoch.won !== won) bad(`won ${s.last_epoch.won}, the countries won ${won}`);
    }
    return out;
}

function readJson(file) {
    return JSON.parse(readFileSync(file, 'utf8'));
}

/** The file's text: indented, with one line per country, so an epoch's diff reads country by country. */
export function serialize(snapshot) {
    const { countries, ...rest } = snapshot;
    const head = JSON.stringify(rest, null, 2).replace(/\n}$/, '');
    return `${head},\n  "countries": [\n${countries.map((c) => `    ${JSON.stringify(c)}`).join(',\n')}\n  ]\n}\n`;
}

async function main() {
    const args = process.argv.slice(2);
    const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
    const history = existsSync(HISTORY_FILE) ? readJson(HISTORY_FILE) : null;
    let snapshot;
    if (args.includes('--prelaunch')) {
        const namesFile = opt('--names');
        if (!namesFile) throw new Error('--prelaunch needs --names <server>/model/iso_country_names.go');
        const names = parseNames(readFileSync(namesFile, 'utf8'));
        if (names.size !== COUNTRY_COUNT) throw new Error(`${namesFile} names ${names.size} countries, not ${COUNTRY_COUNT}`);
        const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
        const { epochBounds } = await import('../react/src/lib/epoch.js');
        snapshot = prelaunch({ names, presence: presenceFrom(history, dayOf(iso(now))), now, bounds: epochBounds(FIRST_EPOCH) });
    } else {
        const from = opt('--from');
        let api;
        if (from) api = readJson(from);
        else {
            const url = opt('--url') || API_URL;
            const res = await fetch(url, { headers: { accept: 'application/json' } });
            if (!res.ok) throw new Error(`GET ${url}: ${res.status} ${res.statusText}`);
            api = await res.json();
        }
        snapshot = normalize(api, presenceFrom(history, dayOf(api.as_of)));
    }
    const problems = snapshotProblems(snapshot);
    if (problems.length) throw new Error(`the snapshot breaks the pages' invariants:\n  ${problems.join('\n  ')}`);
    const after = serialize(snapshot);
    const before = existsSync(SNAPSHOT_FILE) ? readFileSync(SNAPSHOT_FILE, 'utf8') : '';
    const rel = path.relative(ROOT, SNAPSHOT_FILE);
    if (args.includes('--check')) {
        if (before !== after) {
            console.error(`${rel} is not what the import writes: run it without --check`);
            process.exit(1);
        }
        console.log(`${rel} is current`);
        return;
    }
    writeFileSync(SNAPSHOT_FILE, after);
    console.log(before === after ? `${rel} is current` : `wrote ${rel} (epoch ${snapshot.current_epoch.epoch}${snapshot.prelaunch ? ', pre-launch' : ''}); now render its social card: node scripts/generate-og.mjs --ctf`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((e) => {
        console.error(`ctf-import: ${e.message}`);
        process.exit(1);
    });
}
