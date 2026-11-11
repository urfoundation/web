/**
 * The capture the flag pages' model: the snapshot (data/ctf-epoch.json,
 * written by scripts/ctf-import.mjs from GET /sn/ctf) in the pages' terms,
 * with the sentences more than one place says. Pure, with no React and no
 * clock, so the static render (astro/src/pages/ctf.astro, ctf/[cc].astro),
 * the islands and the tests (tests/ctf.test.mjs) all read one model, and the
 * static render is the same on every build of the same data.
 *
 * The phases, from the snapshot:
 *   prelaunch  before epoch 8, the first CTF epoch, starts: no draw, no pots
 *   first      the first epoch has started and no root covers it yet
 *   drawing    the first epoch has ended and its root is not committed yet
 *   drawn      last epoch (the latest with a committed root) had its draw
 *   undrawn    last epoch had no census in time, so every slot carried
 * Without a draw last epoch the draw figures are null (sn/api/operator.yml):
 * the pages then say nothing of winning by default and show no chance to win.
 * `pending` is an ended epoch whose root is not committed yet (its census and
 * drand round, as far as they have happened): the draw of the first epoch in
 * `drawing`, and later ones beside `drawn` or `undrawn`.
 *
 * Amounts are integers of rao (1 α = 10^9 rao), as the snapshot keeps them;
 * they are formatted only for display.
 */

export const SITE = 'https://ur.xyz';
export const HUB_PATH = '/ctf';
export const API_ORIGIN = 'https://api.bringyour.com';
export const API_STATE = `${API_ORIGIN}/sn/ctf`;
export const API_HERE = `${API_ORIGIN}/sn/ctf/here`;
export const apiCountry = (code) => `${API_ORIGIN}/sn/ctf/country/${code}`;
export const OPERATOR_YML = 'https://github.com/urfoundation/sn/blob/main/api/operator.yml';
export const FLAGS_LICENSE = '/ctf/flags/LICENSE.txt';
// where the calls to action go: the free URnetwork app (design.html)
export const START_URL = 'https://ur.io';
export const flagSrc = (code) => `/ctf/flags/${code}.svg`;
export const countryPath = (code) => `${HUB_PATH}/${code}`;

export const SLOTS_PER_ROLE = 5;
export const COUNTRY_COUNT = 249;
export const TOTAL_SLOTS = 2490;
// A country's next draw is a big pot from twenty slot amounts: its pots hold at
// least as much as its ten slots pay. It scales with the slot, which moves with
// the network's emission (the design's mockup drew it at 5 α after 26 epochs).
export const BIG_POT_SLOTS = 20;
// A slot at epoch 4's scale, CAPTURETHEFLAG.md §6: 119,583,893,572 rao ÷ 2,490.
export const EPOCH4_SLOT_RAO = 48_025_660;
export const EASY_WINS = 8;

const LOCALE = 'en-US';
const RAO = 1e9;

// ── numbers ─────────────────────────────────────────────────────────────────

/** An amount of rao in α to `dp` decimals: 12_970_000_000 → "12.97". */
export function alpha(rao, dp = 2) {
    return (rao / RAO).toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export const int = (n) => Math.round(n).toLocaleString(LOCALE);

/** A newcomer's chance to win: the entries are the role's units plus the newcomer, and five win. */
export function chanceOf(units) {
    const entries = units + 1;
    return entries <= SLOTS_PER_ROLE ? 1 : SLOTS_PER_ROLE / entries;
}

/** A chance as the page writes it: "100%", "83%", "2.6%", "0.015%". */
export function pct(p) {
    if (p >= 1) return '100%';
    const v = p * 100;
    if (v >= 10) return `${Math.round(v)}%`;
    if (v >= 0.1) return `${v.toFixed(1)}%`;
    return `${v.toFixed(3)}%`;
}

/** What a newcomer who wins a slot takes: a slot and a fifth of the pot, to the rao. */
export const winEstimate = (slot, pot) => slot + Math.floor(pot / 5);

const plural = (n, one, many) => `${int(n)} ${n === 1 ? one : many}`;

// ── times (UTC, as /mainnet gives them) ──────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-27T18:25:24Z" → "Nov 27, 18:25 UTC". */
export function utcTime(iso) {
    const d = new Date(iso);
    return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

/** "2026-11-27T18:25:24Z" → "18:25 UTC". */
export function utcClock(iso) {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

/** "2026-11-27T18:25:24Z" → "November 27, 2026". */
export function utcDay(iso) {
    const d = new Date(iso);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "2026-11-10" → "November 10". */
export function dayName(day) {
    const d = new Date(`${day}T00:00:00Z`);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Milliseconds to go as the live bar counts them: "16d 03h", "4h 07m", "12m". */
export function countdown(ms) {
    const minutes = Math.max(1, Math.ceil(ms / 60_000));
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = minutes % 60;
    if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h`;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}m`;
}

// ── the model ───────────────────────────────────────────────────────────────

// A name's place in A–Z, the same in every engine (no locale collation, so a
// page renders and hydrates in one order): accents folded, then the code.
const foldName = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const byName = (a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : a.code < b.code ? -1 : 1);
// Pots within 0.1 α of each other count as equal and fall back to A–Z (bucketed, so the order is consistent).
const potBucket = (rao) => Math.round(rao / 1e8);
export const byPot = (a, b) => (potBucket(b.pots) - potBucket(a.pots)) || byName(a, b);
export const byOnline = (a, b) => (b.online - a.online) || byName(a, b);

function roleOf(r, slot) {
    const drawn = r.won !== null;
    return {
        won: r.won,
        units: r.units,
        near: r.near_misses,
        pot: r.pot,
        awarded: r.awarded,
        open: drawn && r.won < SLOTS_PER_ROLE,
        held: drawn && r.won === SLOTS_PER_ROLE,
        chance: drawn ? chanceOf(r.units) : null,
        est: slot === null ? null : winEstimate(slot, r.pot),
    };
}

/** The pages' model of a snapshot. */
export function buildModel(snap) {
    const last = snap.last_epoch;
    const phase = snap.prelaunch ? 'prelaunch' : !last ? (snap.pending_draw ? 'drawing' : 'first') : last.drawn ? 'drawn' : 'undrawn';
    const drawn = phase === 'drawn';
    const slot = last ? last.slot : null;
    const threshold = slot === null ? null : BIG_POT_SLOTS * slot;
    const countries = snap.countries.map((c) => {
        const p = roleOf(c.providers, slot);
        const x = roleOf(c.extenders, slot);
        const pots = p.pot + x.pot;
        const avail = slot === null ? null : pots + 2 * SLOTS_PER_ROLE * slot;
        const big = avail !== null && avail >= threshold;
        const the = c.sentence_name;
        return {
            code: c.code,
            name: c.name,
            the,
            short: the.replace(/^the /, ''),
            The: the.charAt(0).toUpperCase() + the.slice(1),
            sortKey: foldName(c.name),
            inhabited: c.inhabited,
            flagHeld: c.flag_held,
            openEpochs: c.open_epochs,
            near: c.near_misses,
            awarded: c.awarded,
            online: c.online,
            seenDays: c.seen_days,
            p,
            x,
            pots,
            avail,
            big,
            hot: big && c.near_misses > 0,
            won: drawn ? p.won + x.won : null,
        };
    });
    const byCode = new Map(countries.map((c) => [c.code, c]));
    const nfc = snap.totals.not_fully_captured;
    return {
        snapshot: snap,
        phase,
        drawn,
        potsKnown: Boolean(last),
        epoch: snap.current_epoch.epoch,
        firstEpoch: snap.first_epoch,
        startsAt: snap.prelaunch ? snap.prelaunch.starts_at : null,
        drawAt: snap.current_epoch.draw_at,
        asOf: snap.as_of,
        last,
        pending: snap.pending_draw,
        slot,
        threshold,
        totals: { flagsHeld: snap.totals.flags_held, openP: nfc ? nfc.providers : null, openX: nfc ? nfc.extenders : null },
        presence: snap.presence,
        countries,
        byCode,
        az: countries.slice().sort(byName),
    };
}

// ── what the pages say ──────────────────────────────────────────────────────

export const HUB_TITLE = 'Earn crypto by sharing your internet in 249 countries | UR';
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 175;
const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

/** A country page's title: the longest of the templates that fits 60 graphemes (SEO.md §2.2). */
export function countryTitle(c) {
    const forms = [`Earn crypto in ${c.the}: open slots and pots | UR`, `Earn crypto in ${c.the} | UR`, `Earn crypto in ${c.short} | UR`];
    return forms.find((t) => graphemes(t) <= TITLE_MAX) || forms[forms.length - 1];
}

/** The hub's meta description, from the data. */
export function hubDescription(m) {
    const lead = 'Five provider and five extender reward slots in every country, every week.';
    if (m.phase === 'drawn') return `${lead} This epoch: ${int(m.totals.openP)} countries with open provider slots and ${alpha(m.last.carried)} α in pots.`;
    if (m.phase === 'undrawn') return `${lead} Epoch ${m.last.epoch} had no draw, so every slot carried: ${alpha(m.last.carried)} α in pots.`;
    if (m.phase === 'first') return `${lead} Epoch ${m.epoch} is the first, and its draw follows the epoch's end, about ${utcDay(m.drawAt)}.`;
    if (m.phase === 'drawing') return `${lead} Epoch ${m.firstEpoch}, the first, has ended, and its draw is under way.`;
    return `${lead} Capture the flag starts with epoch ${m.firstEpoch} on ${utcDay(m.startsAt)}: see every country's slots.`;
}

/** The providers the dashboard counted online in a country, as a sentence (null without the counts). */
export function presenceSentence(m, c) {
    if (!m.presence || c.online === null) return null;
    const { day, days } = m.presence;
    const when = `at the end of ${dayName(day)}`;
    if (c.seenDays === 0) return `The network's dashboard counted no provider online in ${c.the} ${when}, or at the end of any of the ${days} days before.`;
    const seen = `and had providers there on ${int(c.seenDays)} of the last ${days} days`;
    if (c.online === 0) return `The network's dashboard counted no provider online in ${c.the} ${when}, ${seen}.`;
    return `The network's dashboard counted ${plural(c.online, 'provider', 'providers')} online in ${c.the} ${when}, ${seen}.`;
}

/** A country page's meta description, from its data; within 175 characters (`updated` is the day the page last changed). */
export function countryDescription(m, c, updated) {
    let forms;
    if (m.phase === 'drawn' || m.phase === 'undrawn') {
        const pots = `pots of ${alpha(c.p.pot)} α for providers and ${alpha(c.x.pot)} α for extenders`;
        const lead = m.drawn
            ? `${c.The} this epoch: ${SLOTS_PER_ROLE - c.p.won} provider and ${SLOTS_PER_ROLE - c.x.won} extender slots open, with ${pots}.`
            : `${c.The} this epoch: no draw last epoch, so every slot carried, with ${pots}.`;
        forms = [`${lead} Stay online for half the epoch to win. Updated ${updated}.`, `${lead} Updated ${updated}.`, lead];
    } else {
        const start = {
            prelaunch: () => `${c.The} has five provider and five extender reward slots each epoch from epoch ${m.firstEpoch}, ${utcDay(m.startsAt)}.`,
            first: () => `${c.The} has five provider and five extender reward slots in epoch ${m.epoch}, the first, drawn about ${utcDay(m.drawAt)}.`,
            drawing: () => `${c.The} has five provider and five extender reward slots each epoch; epoch ${m.firstEpoch}'s, the first, are being drawn.`,
        }[m.phase]();
        const seen = !m.presence || c.online === null ? '' : c.online > 0
            ? ` ${plural(c.online, 'provider was', 'providers were')} online there on ${dayName(m.presence.day)}.`
            : ` No provider was online there on ${dayName(m.presence.day)}.`;
        forms = [`${start}${seen}`, start];
    }
    return forms.find((d) => d.length <= DESCRIPTION_MAX) || forms[forms.length - 1];
}

/** What a newcomer can do in a country this epoch, in a sentence: the page's intro and its card. */
export function countryMessage(m, c) {
    if (m.phase === 'prelaunch') {
        return `Capture the flag starts with epoch ${m.firstEpoch}, about ${utcTime(m.startsAt)}: ${c.the} has five provider slots and five extender slots each epoch, and the first draw follows the epoch's end, about ${utcTime(m.drawAt)}.`;
    }
    if (m.phase === 'first') {
        return `Epoch ${m.epoch} is capture the flag's first: ${c.the} has five provider slots and five extender slots, drawn after the epoch ends, about ${utcTime(m.drawAt)}.`;
    }
    if (m.phase === 'drawing') {
        return `Epoch ${m.firstEpoch}, capture the flag's first, has ended and its draw is under way: the winners and pots in ${c.the} appear here once its root is committed. Each epoch ${c.the} has five provider slots and five extender slots.`;
    }
    if (m.phase === 'undrawn') {
        return `Epoch ${m.last.epoch} had no draw, so all ten slots in ${c.the} carried into its pots: ${alpha(c.p.pot)} α for providers and ${alpha(c.x.pot)} α for extenders.`;
    }
    const parts = [];
    if (c.p.open) parts.push(plural(SLOTS_PER_ROLE - c.p.won, 'provider slot', 'provider slots'));
    if (c.x.open) parts.push(plural(SLOTS_PER_ROLE - c.x.won, 'extender slot', 'extender slots'));
    if (!parts.length) {
        return `All ten slots in ${c.the} were won last epoch. A newcomer needs the draw: ${pct(c.p.chance)} as a provider, ${pct(c.x.chance)} as an extender.`;
    }
    const who = c.p.open && c.x.open ? 'provider or extender' : c.p.open ? 'provider' : 'extender';
    return `${parts.join(' and ')} in ${c.the} went unclaimed last epoch, so a new ${who} who stays online there for half the epoch wins by default.`;
}

/** One role's line on a country's card. */
export function roleLine(m, c, role) {
    const r = c[role];
    const name = role === 'p' ? 'provider' : 'extender';
    if (m.phase === 'prelaunch') return `5 slots each epoch from epoch ${m.firstEpoch}`;
    if (m.phase === 'first') return `5 slots this epoch · drawn about ${utcTime(m.drawAt)}`;
    if (m.phase === 'drawing') return `5 slots each epoch · epoch ${m.firstEpoch}'s draw under way`;
    if (m.phase === 'undrawn') return `no draw last epoch · pot ${alpha(r.pot)} α`;
    return r.open
        ? `${r.won} of 5 won last epoch · pot ${alpha(r.pot)} α · not fully captured, a new ${name} wins by default`
        : `5 of 5 won last epoch · ${int(r.units)} units in the draw · chance to win`;
}

/** The draw a newcomer to a fully captured role faces. */
export function drawLine(m, r) {
    return `All five slots were won last epoch from ${int(r.units)} units. With you that is ${int(r.units + 1)} entries for five slots, each worth about ${alpha(m.slot, 3)} α.`;
}

/**
 * The next step in a country with an open slot (a "So close" ribbon or an
 * "Open" chip, design.html): what the near misses were, what to run, and what
 * a newcomer takes this epoch.
 */
export function nextStep(m, c) {
    const xTake = c.x.open ? c.x.est : 0;
    const pTake = c.p.open ? c.p.est : 0;
    const top = Math.max(xTake, pTake);
    const both = Math.min(xTake, pTake) >= Math.max(0.2 * RAO, top / 2);
    const ext = xTake >= pTake;
    const unclaimed = (SLOTS_PER_ROLE - c.p.won) + (SLOTS_PER_ROLE - c.x.won);
    return {
        near: c.near > 1 ? `${int(c.near)} miners here left early last epoch.` : c.near === 1 ? '1 miner here left early last epoch.' : `${unclaimed} of 10 slots here went unclaimed last epoch.`,
        act: both
            ? `Run an extender, a provider or both in ${c.the} for half an epoch. Both roles have open slots, so you win by default and take a fifth of each pot every epoch you stay, `
            : `Run ${ext ? 'an extender' : 'a provider'} in ${c.the} for half an epoch. A slot is open, so you win by default and take a fifth of its pot every epoch you stay, `,
        take: `about ${alpha(top)} α${both ? ' a role' : ''} this epoch`,
        cta: both ? 'Start mining' : ext ? 'Run an extender' : 'Run a provider',
    };
}

/** A role's details when a card opens on a touch screen. */
export function roleDetail(m, c, role) {
    const r = c[role];
    const label = role === 'p' ? 'Providers' : 'Extenders';
    const art = role === 'p' ? 'a provider' : 'an extender';
    if (!m.drawn) return `${label}: no draw last epoch, so every slot carried; pot ${alpha(r.pot)} α.`;
    return r.open
        ? `${label}: ${r.won} of 5 won last epoch, pot ${alpha(r.pot)} α. Launch ${art} here and you win by default: about ${alpha(r.est)} α this epoch, then a fifth of what is left each epoch you stay.`
        : `${label}: all five slots were won last epoch from ${int(r.units)} units. The estimated probability that you win if you launch ${art} here: ${pct(r.chance)}, with ${int(r.units + 1)} entries for five slots, each worth about ${alpha(m.slot, 3)} α.`;
}

/** The country the hub's card shows before it knows the visitor's: the biggest open pot (null before a draw). */
export function neutralCountry(m) {
    if (!m.drawn) return null;
    const open = m.countries.filter((c) => c.inhabited && (c.p.open || c.x.open));
    return open.length ? open.slice().sort(byPot)[0] : null;
}

// ── easy wins ───────────────────────────────────────────────────────────────

/** A 32-bit seed from a string (FNV-1a). */
export function seedOf(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return h >>> 0;
}

/** A small seeded generator (design.html's), uniform in [0, 1); integer arithmetic only, so every engine draws alike. */
export function rng(seed) {
    let a = seed | 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** The countries Easy wins draws from: a big pot this epoch and an open slot; never a territory without people. */
export const easyPool = (m, exclude = null) => (m.drawn
    ? m.countries.filter((c) => c.big && c.inhabited && (c.p.open || c.x.open) && c.code !== exclude)
    : []);

/**
 * Easy wins: up to eight countries of the pool drawn by `seed`, weighted by what
 * each holds this epoch, without replacement, shown biggest pot first. Exact
 * sums of rao, so the static render and the hydrated page draw the same.
 */
export function easyWins(m, seed, exclude = null) {
    const pool = easyPool(m, exclude);
    const next = rng(seed);
    const picked = [];
    let total = pool.reduce((sum, c) => sum + c.avail, 0);
    while (picked.length < EASY_WINS && pool.length) {
        let u = next() * total;
        let i = 0;
        while (i < pool.length - 1 && u >= pool[i].avail) {
            u -= pool[i].avail;
            i += 1;
        }
        total -= pool[i].avail;
        picked.push(pool.splice(i, 1)[0]);
    }
    return picked.sort(byPot);
}

/** The static render's seed: the epoch, so a page changes only when its data does (and a country page's is its own). */
export const staticSeed = (m, code = '') => seedOf(`ctf-easy-wins:${m.epoch}:${m.last ? m.last.epoch : 'none'}:${code}`);

// ── the grid ────────────────────────────────────────────────────────────────

export const SORTS = {
    drawn: [['az', 'A–Z'], ['pot', 'Biggest pot'], ['easy', 'Easiest wins']],
    undrawn: [['az', 'A–Z'], ['pot', 'Biggest pot']],
    other: [['az', 'A–Z'], ['online', 'Most online'], ['fewest', 'Fewest online']],
};
export const sortsFor = (m) => SORTS[m.drawn ? 'drawn' : m.phase === 'undrawn' ? 'undrawn' : 'other'];
export const showsFor = (m) => (m.drawn ? [['all', 'All'], ['big', 'Big pots'], ['held', 'Held']] : m.phase === 'undrawn' ? [['all', 'All'], ['big', 'Big pots']] : []);

const rank = (c) => (c.hot ? 0 : c.big ? 1 : 2);

/** The grid's countries for a sort, a filter, a search and a focus (a stats filter). */
export function gridCountries(m, { sort = 'az', show = 'all', q = '', focus = null } = {}) {
    const query = q.trim().toLowerCase();
    const rows = m.countries.filter((c) => {
        if (focus === 'held') return c.flagHeld;
        if (focus === 'np') return c.p.open;
        if (focus === 'nx') return c.x.open;
        if (show === 'big' && !c.big) return false;
        if (show === 'held' && !c.flagHeld) return false;
        if (query && !c.name.toLowerCase().includes(query) && !c.short.toLowerCase().includes(query) && c.code !== query) return false;
        return true;
    });
    let order = byName;
    if (focus === 'np' || focus === 'nx') order = byPot;
    else if (!focus && sort === 'pot') order = byPot;
    else if (!focus && sort === 'easy') order = (a, b) => (rank(a) - rank(b)) || byPot(a, b);
    else if (!focus && sort === 'online') order = (a, b) => ((b.online || 0) - (a.online || 0)) || byName(a, b);
    else if (!focus && sort === 'fewest') order = (a, b) => (Number(a.inhabited === false) - Number(b.inhabited === false)) || ((a.online || 0) - (b.online || 0)) || byName(a, b);
    return rows.sort(order);
}

/** The pages before and after a country's in A–Z, wrapping around. */
export function neighbours(m, code) {
    const i = m.az.findIndex((c) => c.code === code);
    const n = m.az.length;
    return { prev: m.az[(i - 1 + n) % n], next: m.az[(i + 1) % n] };
}
