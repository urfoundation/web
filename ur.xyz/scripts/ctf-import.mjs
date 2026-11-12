#!/usr/bin/env node
// ctf-import.mjs — writes the capture the flag pages' data: every network
// operator's capture the flag state, combined.
//
// Capture the flag is part of the SN25 protocol: every network operator runs a
// capture the flag pool beside its provider pool (sn CAPTURETHEFLAG.md §3.1,
// pool 2^32 + its number), with ten slots in every country and its own draw
// among its own miners. The pages show them all. The import reads the
// operator list ur.xyz publishes (operators/operators.yml, served at
// https://ur.xyz/operators.yml; sn docs/OPERATOR-DISCOVERY.md), then each
// listed operator's GET <api_url>/sn/ctf (sn/api/operator.yml), and writes:
//
//   react/src/data/ctf-operators/<domain>.json   each operator's snapshot, with
//                                                its operator number and domain
//   react/src/data/ctf-epoch.json                the operators' aggregate, which
//                                                the pages are built from
//
// /ctf and its 249 country pages are built from the aggregate, so every figure
// is in the HTML that search engines and AI crawlers read, and a page changes
// (and its sitemap <lastmod> with it) only when its data does. The import runs
// after each epoch's census and roots, and the site is rebuilt and deployed
// from the result (SITEMAP.md, "Capture the flag").
//
// A snapshot keeps an answer's facts in the page's terms: amounts are integers
// of rao (the answer's `rao`; its `alpha` strings say the same), a role keeps
// the slots won rather than total/won/open, and the figures the answer derives
// (each role's win estimate, entries and chance to win, each country's
// available amount) are checked against their definitions here and derived
// again by the page (react/src/components/pages/ctf/model.js). Every answer is
// checked before it is used: 249 countries in code order, the draw figures
// null together, the slot and pot arithmetic, and the totals.
//
// The aggregate adds the operators up. Per country and role: the slots won,
// the units and near misses of the draws, the pots and the awards are summed,
// and so are the flags held; the epoch, its timing and the pre-launch state
// are the protocol's. Each operator draws among its own miners, so a newcomer's
// chance to win is its operator's: with more than one operator, each role also
// keeps every operator's own figures (`ops`, in the order of `operators`), and
// the pages show each operator's odds. With one operator the aggregate holds
// exactly that operator's figures.
//
// An operator is left out of the totals, and listed with the reason, when its
// answer cannot be read or fails the checks, or when it is not at the others'
// state: figures of different epochs do not add up. An answer taken while an
// epoch's draw is pending after a drawn epoch fails the checks: its pots and
// open slots are last epoch's, carried into a draw newcomers can no longer
// enter, so its pages would be an epoch off; import once that root is
// committed. (Before the first root, a pending draw is the whole story, and
// the pages say so.) When no operator can be included, nothing is written and
// the pages keep the last snapshot: never zeros, never a default.
//
// Each country also gets the providers the network's dashboard counted online
// there (react/public/dashboard/history.json, panel 33 at the end of each UTC
// day): its count on the snapshot's day, and over the 90 days to it the days
// it had any, the last such day and the most at the end of a day.
//
// Before capture the flag starts (epoch 8, the owner's decision) there is no
// answer to import: --prelaunch writes the pre-launch aggregate from the
// server's country table (the 249 codes of ISO 3166-1 that the CTF pool's
// country list is), the site's time basis for epoch 8 (lib/epoch.js) and the
// operator list, with the sentence names the API gives (design.html's table).
//
// Usage (from ur.xyz):
//   node scripts/ctf-import.mjs                          read each listed operator's GET <api_url>/sn/ctf
//   node scripts/ctf-import.mjs --from <domain>=<answer.json> [--from …]   saved answers instead, one
//        --from per operator (a bare <answer.json> when the list has one operator); a listed operator
//        without one is left out
//   node scripts/ctf-import.mjs --prelaunch --names <server>/model/iso_country_names.go [--now <iso>]
//   ... --operators <operators.yml>                      another operator list (default operators/operators.yml)
//   ... --check                                          exit 1 if the files are not what the import writes
// Then render the social card for the new snapshot (node scripts/generate-og.mjs --ctf) and rebuild.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYaml } from '../react/src/lib/yaml.js';
import { epochAt, epochEndBlock, epochStartBlock } from '../react/src/lib/epoch.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SNAPSHOT_FILE = path.join(ROOT, 'react/src/data/ctf-epoch.json');
export const OPERATOR_DIR = path.join(ROOT, 'react/src/data/ctf-operators');
export const OPERATORS_FILE = path.join(ROOT, 'operators/operators.yml');
const HISTORY_FILE = path.join(ROOT, 'react/public/dashboard/history.json');
// the operator list as ur.xyz publishes it (scripts/sync-operators.mjs)
export const OPERATORS_URL = 'https://ur.xyz/operators.yml';
const OPERATORS_SCHEMA = 'urnetwork-operators-v1';
// one operator's snapshot of its GET /sn/ctf, and the operators' aggregate the pages read
export const SCHEMA = 'ur.xyz/ctf-epoch/v1';
export const AGGREGATE_SCHEMA = 'ur.xyz/ctf-epoch/v2';
const FETCH_TIMEOUT_MS = 30_000;
// an answer is about 200 KB; refuse one far larger rather than read it whole
const ANSWER_MAX_BYTES = 8 * 1024 * 1024;
// a reason recorded for an operator left out: one line, at most this long
const REASON_MAX = 300;

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

/**
 * The network operators of an operator list (operators.yml, schema
 * urnetwork-operators-v1), in its order: [{ domain, api_url }]. The sn
 * package operatorlist is the list's authority; this refuses what no client
 * would read (another schema, no operators, an entry without a domain or an
 * https API, a domain twice).
 */
export function parseOperatorList(text) {
    const list = parseYaml(text);
    if (list?.schema !== OPERATORS_SCHEMA) throw new Error(`the operator list's schema is ${list?.schema}, not ${OPERATORS_SCHEMA}`);
    const operators = Array.isArray(list.operators) ? list.operators : [];
    if (!operators.length) throw new Error('the operator list names no operator');
    const seen = new Set();
    return operators.map((o, i) => {
        const domain = o?.domain;
        const api = o?.api_url;
        if (typeof domain !== 'string' || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) throw new Error(`operator ${i + 1}: domain ${JSON.stringify(domain)}`);
        if (typeof api !== 'string' || !/^https:\/\/[a-z0-9.-]+(:\d+)?(\/[A-Za-z0-9._~/-]*)?$/i.test(api)) throw new Error(`${domain}: api_url ${JSON.stringify(api)}`);
        if (seen.has(domain)) throw new Error(`${domain} is listed twice`);
        seen.add(domain);
        return { domain, api_url: api.replace(/\/+$/, '') };
    });
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

const FIGURES = 'Amounts are integers of rao (1 alpha is 10^9 rao). '
    + 'A role\'s won, units and near_misses, and a country\'s near_misses, are null without a draw last epoch. '
    + 'online, seen_days, last_seen and peak are the providers the dashboard counted online in the country at the end of a day '
    + '(react/public/dashboard/history.json): on the presence day, the days of the window with any, the last of them, and the most.';

const aboutOperator = (op) => `One network operator's capture the flag state: a snapshot of GET ${op ? op.api_url : '<api_url>'}/sn/ctf, written by `
    + 'scripts/ctf-import.mjs, which adds every listed operator\'s into react/src/data/ctf-epoch.json for the pages (ur.xyz/ctf and /ctf/<cc>); '
    + `do not edit it by hand. ${FIGURES}`;

const ABOUT = 'The capture the flag pages (ur.xyz/ctf and /ctf/<cc>): every network operator of the operator list '
    + `(${OPERATORS_URL}) combined, from each one's snapshot of its GET <api_url>/sn/ctf (react/src/data/ctf-operators/<domain>.json), `
    + 'written by scripts/ctf-import.mjs; do not edit it by hand. `operators` lists them all, in the list\'s order: those included, '
    + 'and any left out with the reason. Per country and role the slots won, the units and near misses of the draws, the pots and the awards are '
    + 'the included operators\' sums; with more than one, each role also keeps every included operator\'s own figures (ops, in the order of '
    + `operators), since each operator draws among its own miners. ${FIGURES}`;

/** The aggregate before capture the flag starts: no draw, no pots, the epoch 8 schedule, and every listed operator taking part. */
export function prelaunch({ names, presence, now, bounds, operators }) {
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
        about: ABOUT,
        schema: AGGREGATE_SCHEMA,
        source: OPERATORS_URL,
        as_of: iso(now),
        first_epoch: FIRST_EPOCH,
        prelaunch: { start_block: bounds.startBlock, starts_at: iso(bounds.startMs) },
        operators: operators.map((op) => operatorEntry(op, { status: 'prelaunch' })),
        current_epoch: { epoch: FIRST_EPOCH, start_block: bounds.startBlock, end_block: bounds.endBlock - 1, draw_at: iso(bounds.endMs) },
        last_epoch: null,
        pending_draw: null,
        totals: { flags_held: 0, not_fully_captured: null },
        presence: presence?.meta || null,
        countries,
    };
}

/** An operator's entry in the aggregate's `operators`. */
function operatorEntry(op, { status, reason = null, no = null, snapshot = null }) {
    const last = snapshot?.last_epoch || null;
    return {
        domain: op.domain,
        api_url: op.api_url,
        no: snapshot ? snapshot.operator.no : no,
        pool_id: snapshot ? snapshot.pool.pool_id : null,
        status,
        reason,
        as_of: snapshot ? snapshot.as_of : null,
        drawn: last ? last.drawn : null,
        slot: last ? last.slot : null,
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
    if (!isInt(api.pool?.first_epoch) || !isInt(api.pool?.pool_id) || !isInt(api.pool?.no_id)) bad('pool has no first_epoch, pool_id or no_id');
    else if (api.pool.pool_id !== 2 ** 32 + api.pool.no_id) bad(`pool ${api.pool.pool_id} is not operator ${api.pool.no_id}'s capture the flag pool, 2^32 + ${api.pool.no_id}`);
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
            if (!le.drawn && le.slots.won !== 0) bad('last_epoch: slots won without a draw');
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

/**
 * One operator's snapshot of its checked GET /sn/ctf answer; `op` is its entry
 * of the operator list (the tests may leave it out: an answer alone names its
 * operator's number, not its domain).
 */
export function normalize(api, presence, op = null) {
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
        about: aboutOperator(op),
        schema: SCHEMA,
        source: op ? `${op.api_url}/sn/ctf` : null,
        operator: { no: api.pool.no_id, domain: op ? op.domain : null, api_url: op ? op.api_url : null },
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

// ── the aggregate ───────────────────────────────────────────────────────────

const lastEpochOf = (s) => (s.last_epoch ? s.last_epoch.epoch : -1);
const sum = (values) => values.reduce((t, v) => t + v, 0);
// the latest of figures every operator has, or null when one has none
const latest = (values) => (values.some((v) => v === null || v === undefined) ? null : Math.max(...values));

/**
 * The pages' snapshot: the listed operators' snapshots added up.
 * `results` is the operator list in its order, each { op, snapshot } for an
 * operator read (normalize's snapshot of its answer) or { op, reason } for one
 * that could not be. `history` is the dashboard's (or null). Each snapshot is
 * checked on its own; the protocol's state is the latest the operators report
 * (the current epoch, then the last epoch with a committed root), and an
 * operator elsewhere is left out, since figures of different epochs do not add
 * up. Throws when no operator can be included.
 */
export function aggregate(results, history = null) {
    const states = results.map((r) => {
        if (!r.snapshot) return { op: r.op, reason: reasonOf(r.reason || 'not read') };
        const s = r.snapshot;
        const left = (reason) => ({ op: r.op, no: s.operator?.no ?? null, reason: reasonOf(reason) });
        const problems = snapshotProblems(s);
        if (problems.length) return left(`its snapshot breaks the pages' invariants: ${problems.slice(0, 3).join('; ')}`);
        // the protocol's schedule (lib/epoch.js): an epoch's blocks are fixed, and an answer's epoch is
        // the one its time falls in, give or take the epoch an import straddles
        const e = s.current_epoch.epoch;
        const at = epochAt(Date.parse(s.as_of));
        if (s.current_epoch.start_block !== epochStartBlock(e) || s.current_epoch.end_block !== epochEndBlock(e) - 1) {
            return left(`its epoch ${e} runs from block ${s.current_epoch.start_block} to ${s.current_epoch.end_block}, not ${epochStartBlock(e)} to ${epochEndBlock(e) - 1}`);
        }
        if (!at || Math.abs(at.number - e) > 1) return left(`its epoch ${e} is not the epoch of its time, ${s.as_of} (epoch ${at ? at.number : 'none'})`);
        return r;
    });
    const read = states.filter((r) => r.snapshot);
    if (!read.length) throw new Error(`no operator could be included:\n  ${states.map((r) => `${r.op.domain}: ${r.reason}`).join('\n  ')}`);
    const epoch = Math.max(...read.map((r) => r.snapshot.current_epoch.epoch));
    const at = read.filter((r) => r.snapshot.current_epoch.epoch === epoch);
    const lastRef = Math.max(...at.map((r) => lastEpochOf(r.snapshot)));
    const ref = at.find((r) => lastEpochOf(r.snapshot) === lastRef).snapshot;
    const codes = ref.countries.map((c) => c.code).join(' ');
    const placed = states.map((r) => {
        const s = r.snapshot;
        if (!s) return r;
        const left = (reason) => ({ op: r.op, no: s.operator.no, reason });
        if (s.current_epoch.epoch !== epoch) return left(`its answer is from epoch ${s.current_epoch.epoch}, the others' from epoch ${epoch}`);
        if (lastEpochOf(s) !== lastRef) {
            return left(s.last_epoch
                ? `its last committed root is for epoch ${s.last_epoch.epoch}, the others' for epoch ${lastRef}`
                : `it has no committed root yet, and the others' last is for epoch ${lastRef}`);
        }
        if (s.current_epoch.start_block !== ref.current_epoch.start_block || s.current_epoch.end_block !== ref.current_epoch.end_block) {
            return left(`its epoch ${epoch} runs from block ${s.current_epoch.start_block} to ${s.current_epoch.end_block}, the others' from ${ref.current_epoch.start_block} to ${ref.current_epoch.end_block}`);
        }
        if (s.countries.map((c) => c.code).join(' ') !== codes) return left('its country list is not the others\'');
        return r;
    });
    // one pool counted once: a later operator answering for a pool already included is left out
    const pools = new Map();
    placed.forEach((r, i) => {
        if (!r.snapshot) return;
        const pool = r.snapshot.pool.pool_id;
        if (pools.has(pool)) placed[i] = { op: r.op, no: r.snapshot.operator.no, reason: `it answers for the same pool as ${pools.get(pool)} (pool ${pool})` };
        else pools.set(pool, r.op.domain);
    });
    const snaps = placed.filter((r) => r.snapshot).map((r) => r.snapshot);
    const one = snaps.length === 1;
    const asOf = snaps.map((s) => s.as_of).sort().at(-1);
    const presence = presenceFrom(history, dayOf(asOf));
    const lasts = snaps.map((s) => s.last_epoch);
    const drawnAny = lasts.some((l) => l && l.drawn);
    const last = lasts[0] && {
        epoch: lastRef,
        drawn: drawnAny,
        root_status: lasts.every((l) => l.root_status === 'finalized') ? 'finalized' : 'pending',
        committed_block: latest(lasts.map((l) => l.committed_block)),
        finalized_block: latest(lasts.map((l) => l.finalized_block)),
        // the slot amounts added up: what one slot at every operator pays (one operator: its slot)
        slot: sum(lasts.map((l) => l.slot)),
        fresh: sum(lasts.map((l) => l.fresh)),
        awarded: sum(lasts.map((l) => l.awarded)),
        paid: sum(lasts.map((l) => l.paid)),
        pending: sum(lasts.map((l) => l.pending)),
        carried: sum(lasts.map((l) => l.carried)),
        won: sum(lasts.map((l) => l.won)),
    };
    const pendings = snaps.map((s) => s.pending_draw);
    let pending = null;
    if (pendings.some(Boolean)) {
        pending = one ? pendings[0] : {
            epoch: Math.max(...pendings.filter(Boolean).map((p) => p.epoch)),
            census_hash: null,
            // the census is in once every operator's is: the latest block
            census_block: latest(pendings.map((p) => (p ? p.census_block : null))),
            round: null,
        };
    }
    const countries = ref.countries.map((c0, i) => {
        const rows = snaps.map((s) => s.countries[i]);
        const role = (key) => {
            const all = rows.map((r) => r[key]);
            const drawn = all.filter((r) => r.won !== null);
            const out = {
                won: drawn.length ? sum(drawn.map((r) => r.won)) : null,
                units: drawn.length ? sum(drawn.map((r) => r.units)) : null,
                near_misses: drawn.length ? sum(drawn.map((r) => r.near_misses)) : null,
                pot: sum(all.map((r) => r.pot)),
                awarded: sum(all.map((r) => r.awarded)),
            };
            if (!one) out.ops = all.map((r) => ({ won: r.won, units: r.units, near_misses: r.near_misses, pot: r.pot, awarded: r.awarded }));
            return out;
        };
        const nears = rows.map((r) => r.near_misses).filter((v) => v !== null);
        return withPresence({
            code: c0.code,
            name: c0.name,
            sentence_name: c0.sentence_name,
            inhabited: c0.inhabited,
            // held at any operator: the flags held there count toward totals.flags_held
            flag_held: rows.some((r) => r.flag_held),
            // since the country last had a winner at any operator
            open_epochs: Math.min(...rows.map((r) => r.open_epochs)),
            near_misses: nears.length ? sum(nears) : null,
            awarded: sum(rows.map((r) => r.awarded)),
            providers: role('providers'),
            extenders: role('extenders'),
        }, presence);
    });
    // a role is not fully captured where any operator that drew left a slot of it open
    const openAt = (c, key) => (one ? (c[key].won !== null && c[key].won < SLOTS_PER_ROLE) : c[key].ops.some((o) => o.won !== null && o.won < SLOTS_PER_ROLE));
    return {
        about: ABOUT,
        schema: AGGREGATE_SCHEMA,
        source: OPERATORS_URL,
        as_of: asOf,
        first_epoch: Math.min(...snaps.map((s) => s.first_epoch)),
        prelaunch: null,
        operators: placed.map((r) => (r.snapshot
            ? operatorEntry(r.op, { status: 'included', snapshot: r.snapshot })
            : operatorEntry(r.op, { status: 'left_out', reason: r.reason, no: r.no ?? null }))),
        current_epoch: { ...ref.current_epoch },
        last_epoch: last,
        pending_draw: pending,
        totals: {
            flags_held: sum(snaps.map((s) => s.totals.flags_held)),
            not_fully_captured: drawnAny ? { providers: countries.filter((c) => openAt(c, 'providers')).length, extenders: countries.filter((c) => openAt(c, 'extenders')).length } : null,
        },
        presence: presence?.meta || null,
        countries,
    };
}

// ── the pages' invariants ───────────────────────────────────────────────────

/**
 * Every way a snapshot breaks the pages' invariants; [] when none
 * (tests/ctf.test.mjs). An operator's snapshot (v1) and the aggregate (v2)
 * keep the same ones: the aggregate's are each included operator's own
 * figures (a role's `ops`, or with one operator the role itself), and its
 * sums.
 */
export function snapshotProblems(s) {
    const out = [];
    const bad = (msg) => out.push(msg);
    if (s?.schema !== SCHEMA && s?.schema !== AGGREGATE_SCHEMA) return [`schema ${s?.schema}, not ${SCHEMA} or ${AGGREGATE_SCHEMA}`];
    const combined = s.schema === AGGREGATE_SCHEMA;
    let included = 1;
    if (combined) {
        const ops = Array.isArray(s.operators) ? s.operators : [];
        if (!ops.length) return ['an aggregate without operators'];
        const status = new Set(ops.map((o) => o.status));
        included = ops.filter((o) => o.status === 'included').length;
        if (ops.some((o) => !['included', 'left_out', 'prelaunch'].includes(o.status) || !o.domain || !o.api_url)) bad('an operator entry without a domain, an API or a known status');
        if (s.prelaunch ? status.size !== 1 || !status.has('prelaunch') : status.has('prelaunch') || !included) bad('the operators\' statuses do not fit the phase');
        if (ops.some((o) => (o.status === 'left_out') !== Boolean(o.reason))) bad('an operator left out without a reason, or one included with one');
        if (new Set(ops.map((o) => o.domain)).size !== ops.length) bad('an operator listed twice');
    } else if (!isInt(s.operator?.no)) bad('an operator\'s snapshot without its operator');
    const multi = combined && included > 1;
    const includedOps = combined ? s.operators.filter((o) => o.status === 'included') : [];
    // whether each operator whose figures a role keeps drew last epoch
    const drewAt = multi ? includedOps.map((o) => o.drawn === true) : [Boolean(s.last_epoch?.drawn)];
    if (multi && Boolean(s.last_epoch?.drawn) !== drewAt.some(Boolean)) bad('last_epoch.drawn is not whether any operator drew');
    if (combined && s.last_epoch && s.last_epoch.slot !== sum(includedOps.map((o) => o.slot))) bad('last_epoch.slot is not the operators\' slots added up');
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
        // each operator's own figures of the role: its `ops`, or with one operator the role itself
        const own = (role) => (multi ? c[role].ops : [c[role]]);
        if (multi && ROLES.some((role) => !Array.isArray(c[role].ops) || c[role].ops.length !== included)) {
            bad(`${c.code}: a role without each included operator's figures`);
            continue;
        }
        const heldAt = new Array(multi ? included : 1).fill(0);
        for (const role of ROLES) {
            const r = c[role];
            const list = own(role);
            if (!isInt(r.pot) || r.pot < 0) bad(`${c.code}.${role}: pot ${r.pot}`);
            if (!potsKnown && r.pot !== 0) bad(`${c.code}.${role}: a pot before the first root`);
            if (!isInt(r.awarded) || r.awarded < 0) bad(`${c.code}.${role}: awarded ${r.awarded}`);
            if (multi && (r.pot !== sum(list.map((o) => o.pot)) || r.awarded !== sum(list.map((o) => o.awarded)))) bad(`${c.code}.${role}: the pot or the awards are not the operators' sum`);
            const drawnOps = list.filter((o) => o.won !== null);
            if (multi) {
                const total = (k) => (drawnOps.length ? sum(drawnOps.map((o) => o[k])) : null);
                if (r.won !== total('won') || r.units !== total('units') || r.near_misses !== total('near_misses')) bad(`${c.code}.${role}: the draw figures are not the operators' sums`);
            }
            let roleOpen = false;
            list.forEach((o, i) => {
                if (!drewAt[i]) {
                    if (o.won !== null || o.units !== null || o.near_misses !== null) bad(`${c.code}.${role}: draw figures without a draw`);
                    return;
                }
                if (!isInt(o.won) || o.won < 0 || o.won > SLOTS_PER_ROLE) bad(`${c.code}.${role}: ${o.won} winners`);
                if (o.won !== Math.min(SLOTS_PER_ROLE, o.units)) bad(`${c.code}.${role}: ${o.won} won from ${o.units} units`);
                if (o.won === SLOTS_PER_ROLE) heldAt[i] += 1;
                else roleOpen = true;
                won += o.won;
            });
            if (roleOpen) open[role] += 1;
        }
        const flags = heldAt.filter((n) => n === 2).length;
        if (c.flag_held !== flags > 0) bad(`${c.code}: flag_held ${c.flag_held}`);
        if (c.awarded !== c.providers.awarded + c.extenders.awarded) bad(`${c.code}: awarded is not its roles' sum`);
        if (c.online !== null && (!isInt(c.online) || c.online < 0 || !isInt(c.seen_days) || !isInt(c.peak) || c.peak < c.online
            || (c.seen_days > 0) !== (c.last_seen !== null) || (c.last_seen !== null && !/^\d{4}-\d{2}-\d{2}$/.test(c.last_seen)))) {
            bad(`${c.code}: dashboard counts ${JSON.stringify([c.online, c.seen_days, c.last_seen, c.peak])}`);
        }
        held += flags;
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

/** A reason as the aggregate records it: one line, cut short. */
const reasonOf = (text) => {
    const line = String(text).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
    return line.length > REASON_MAX ? `${line.slice(0, REASON_MAX - 1)}…` : line;
};

/** An operator's snapshot file: react/src/data/ctf-operators/<domain>.json. */
export const operatorFile = (domain) => path.join(OPERATOR_DIR, `${domain}.json`);

/** One operator's GET <api_url>/sn/ctf; throws with what went wrong. */
async function fetchAnswer(op) {
    const url = `${op.api_url}/sn/ctf`;
    let res;
    let text;
    try {
        // no redirect: an operator's API answers at the address the list gives
        res = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        if (Number(res.headers.get('content-length')) > ANSWER_MAX_BYTES) throw new Error('the answer is too large');
        text = await res.text();
    } catch (e) {
        const kind = e.cause?.code || (e.name !== 'Error' ? e.name : '');
        throw new Error(`GET ${url}: ${kind ? `${kind}: ` : ''}${e.cause?.message || e.message}`);
    }
    if (text.length > ANSWER_MAX_BYTES) throw new Error(`GET ${url}: the answer is too large`);
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`GET ${url}: the answer is not JSON`);
    }
}

/** The import's results, one per listed operator in the list's order: { op, snapshot } or { op, reason }. */
async function readOperators(list, { from, history }) {
    return Promise.all(list.map(async (op) => {
        try {
            let api;
            if (from) {
                const file = from.get(op.domain);
                if (!file) return { op, reason: 'no saved answer was given for it (--from)' };
                api = readJson(file);
            } else {
                api = await fetchAnswer(op);
            }
            const problems = apiProblems(api);
            if (problems.length) return { op, reason: `its answer is not a valid GET /sn/ctf: ${problems.slice(0, 3).join('; ')}${problems.length > 3 ? ` (and ${problems.length - 3} more)` : ''}` };
            return { op, snapshot: normalize(api, presenceFrom(history, dayOf(api.as_of)), op) };
        } catch (e) {
            return { op, reason: e.message };
        }
    }));
}

async function main() {
    const args = process.argv.slice(2);
    const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
    const history = existsSync(HISTORY_FILE) ? readJson(HISTORY_FILE) : null;
    const listFile = opt('--operators') || OPERATORS_FILE;
    const list = parseOperatorList(readFileSync(listFile, 'utf8'));
    let snapshot;
    // the operators' own snapshots: domain → snapshot, for those included
    let own = new Map();
    if (args.includes('--prelaunch')) {
        const namesFile = opt('--names');
        if (!namesFile) throw new Error('--prelaunch needs --names <server>/model/iso_country_names.go');
        const names = parseNames(readFileSync(namesFile, 'utf8'));
        if (names.size !== COUNTRY_COUNT) throw new Error(`${namesFile} names ${names.size} countries, not ${COUNTRY_COUNT}`);
        const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
        const { epochBounds } = await import('../react/src/lib/epoch.js');
        snapshot = prelaunch({ names, presence: presenceFrom(history, dayOf(iso(now))), now, bounds: epochBounds(FIRST_EPOCH), operators: list });
    } else {
        let from = null;
        if (args.includes('--from')) {
            from = new Map();
            args.forEach((a, i) => {
                if (a !== '--from') return;
                const value = args[i + 1] || '';
                const eq = value.indexOf('=');
                let domain;
                let file;
                if (eq > 0) [domain, file] = [value.slice(0, eq), value.slice(eq + 1)];
                else if (list.length === 1) [domain, file] = [list[0].domain, value];
                else throw new Error(`--from ${value}: name its operator, --from <domain>=<answer.json>, since the list has ${list.length}`);
                if (from.has(domain)) throw new Error(`--from ${domain}: given twice`);
                from.set(domain, file);
            });
            for (const domain of from.keys()) if (!list.some((op) => op.domain === domain)) throw new Error(`--from ${domain}: not in the operator list`);
        }
        const results = await readOperators(list, { from, history });
        snapshot = aggregate(results, history);
        own = new Map(results.filter((r) => r.snapshot && snapshot.operators.some((o) => o.domain === r.op.domain && o.status === 'included')).map((r) => [r.op.domain, r.snapshot]));
    }
    const problems = snapshotProblems(snapshot);
    if (problems.length) throw new Error(`the aggregate breaks the pages' invariants:\n  ${problems.join('\n  ')}`);
    // what the import writes: the aggregate, and each included operator's snapshot (no other file in its folder)
    const files = new Map([[SNAPSHOT_FILE, serialize(snapshot)], ...[...own].map(([domain, s]) => [operatorFile(domain), serialize(s)])]);
    const stale = existsSync(OPERATOR_DIR) ? readdirSync(OPERATOR_DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(OPERATOR_DIR, f)).filter((f) => !files.has(f)) : [];
    const rel = (file) => path.relative(ROOT, file);
    for (const o of snapshot.operators) {
        if (o.status === 'left_out') console.error(`ctf-import: ${o.domain} is left out of the figures: ${o.reason}`);
    }
    if (args.includes('--check')) {
        const differ = [...files].filter(([file, text]) => !existsSync(file) || readFileSync(file, 'utf8') !== text).map(([file]) => rel(file));
        if (differ.length || stale.length) {
            console.error(`ctf-import: ${[...differ, ...stale.map((f) => `${rel(f)} (not written now)`)].join(', ')}: not what the import writes; run it without --check`);
            process.exit(1);
        }
        console.log(`ctf-import: ${[...files.keys()].map(rel).join(', ')} current`);
        return;
    }
    let changed = false;
    for (const [file, text] of files) {
        if (existsSync(file) && readFileSync(file, 'utf8') === text) continue;
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, text);
        console.log(`ctf-import: wrote ${rel(file)}`);
        changed = true;
    }
    for (const file of stale) {
        rmSync(file);
        console.log(`ctf-import: removed ${rel(file)} (its operator is not included now)`);
        changed = true;
    }
    const included = snapshot.operators.filter((o) => o.status === 'included').map((o) => o.domain);
    console.log(`ctf-import: epoch ${snapshot.current_epoch.epoch}${snapshot.prelaunch ? ', pre-launch' : `, ${included.length} of ${snapshot.operators.length} operators included (${included.join(', ')})`}`);
    if (changed) console.log('ctf-import: now render its social card: node scripts/generate-og.mjs --ctf');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((e) => {
        console.error(`ctf-import: ${e.message}`);
        process.exit(1);
    });
}
