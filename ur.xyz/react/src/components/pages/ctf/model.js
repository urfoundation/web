/**
 * The capture the flag pages' model: the snapshot (data/ctf-epoch.json,
 * written by scripts/ctf-import.mjs from GET /sn/ctf) in the pages' terms,
 * with the sentences more than one place says. Pure, with no React and no
 * clock, so the static render (astro/src/pages/ctf.astro, ctf/[cc].astro and
 * their /<lang>/ twins), the islands and the tests (tests/ctf.test.mjs) all
 * read one model, and the static render is the same on every build of the
 * same data.
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
 * Operators: capture the flag is part of the SN25 protocol, so every network
 * operator runs its own pool, with its own draw among its own miners, and the
 * snapshot combines every operator of the operator list (scripts/ctf-import.mjs).
 * A country's figures are the operators' sums; a role also keeps each
 * operator's own draw (`ops`), since a newcomer's chance to win and whether it
 * wins by default are its operator's. With one operator the model is that
 * operator's alone, and the pages read as they always did; with more, a
 * per-operator fact (a draw's odds, an open slot) is listed by operator
 * (opsList), and the slot counts the copy states are five at each operator.
 *
 * Languages: buildModel is English (the snapshot's names). localModel(m, lang)
 * is the same model in another language: its countries named in it
 * (react/src/i18n/pages/ctf/names/<lang>.js) and in its A–Z, and `m.lang`, by
 * which every sentence here reads its copy (pages/ctf/<lang>.js, ctf/i18n.js)
 * and formats its figures and days.
 *
 * Amounts are integers of rao (1 α = 10^9 rao), as the snapshot keeps them;
 * they are formatted only for display.
 */
import { capital, ctfCopy, ctfNames, formats, interpolate, place } from './i18n.js';
import { CTF_LOCAL_NOTES } from '../../../data/ctf-local-notes.js';

export const SITE = 'https://ur.xyz';
export const HUB_PATH = '/ctf';
// the operator list the pages combine (sn/operators.yml, as the site publishes it);
// each operator's API (its api_url) serves /sn/ctf and the routes beside it
export const OPERATORS_PATH = '/operators.yml';
export const SOURCE_URL = 'https://github.com/urfoundation/sn';
export const OPERATOR_YML = `${SOURCE_URL}/blob/main/api/operator.yml`;
export const METHOD_URL = `${SOURCE_URL}/blob/main/CAPTURETHEFLAG.md`;
export const FLAGS_LICENSE = '/ctf/flags/LICENSE.txt';
// where the calls to action go: the miner guide, which names the URnetwork
// apps as an easy alternative for mining from a phone or computer, and for an
// extender its chapter on running one (its TCP port 443); ctf/links.js gives
// them in the page's language
export const START_URL = '/docs/miner';
export const EXTENDER_URL = '/docs/miner/extender';
/** A call to action ('start', 'p' or 'x'): its link. Its words are the copy's `cta`. */
export const ctaHref = (cta) => (cta === 'x' ? EXTENDER_URL : START_URL);
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

const RAO = 1e9;
const EN = formats('en');

// ── numbers and times, in English (the US format); formats(lang) for the others ──

/** An amount of rao in α to `dp` decimals: 12_970_000_000 → "12.97". */
export const alpha = (rao, dp = 2) => EN.alpha(rao, dp);
export const int = (n) => EN.int(n);

/** A newcomer's chance to win: the entries are the role's units plus the newcomer, and five win. */
export function chanceOf(units) {
    const entries = units + 1;
    return entries <= SLOTS_PER_ROLE ? 1 : SLOTS_PER_ROLE / entries;
}

/** A chance as the page writes it: "100%", "83%", "2.6%", "0.015%". */
export const pct = (p) => EN.pct(p);

/** What a newcomer who wins a slot takes: a slot and a fifth of the pot, to the rao. */
export const winEstimate = (slot, pot) => slot + Math.floor(pot / 5);

/** "2026-11-27T18:25:24Z" → "Nov 27, 18:25 UTC". */
export const utcTime = (iso) => EN.utcTime(iso);
/** "2026-11-27T18:25:24Z" → "18:25 UTC". */
export const utcClock = (iso) => EN.utcClock(iso);
/** "2026-11-27T18:25:24Z" → "November 27, 2026". */
export const utcDay = (iso) => EN.utcDay(iso);
/** "2026-11-10" → "November 10". */
export const dayName = (day) => EN.dayName(day);
/** Milliseconds to go as the live bar counts them: "16d 03h", "4h 07m", "12m". */
export const countdown = (ms) => EN.countdown(ms);

// ── the model ───────────────────────────────────────────────────────────────

// A name's place in A–Z, the same in every engine (no locale collation, so a
// page renders and hydrates in one order): accents folded, then the code; a
// translation's A–Z is its names file's `order`, which every engine reads
// alike. The search and the picker fold the same way ("cote" finds Côte
// d'Ivoire), Arabic's vowel marks and hamza seats included.
export const foldName = (name) => name.normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g, '').toLowerCase();
export const byName = (a, b) => a.rank - b.rank;
const byFolded = (a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : a.code < b.code ? -1 : 1);
// Pots within 0.1 α of each other count as equal and fall back to A–Z (bucketed, so the order is consistent).
const potBucket = (rao) => Math.round(rao / 1e8);
export const byPot = (a, b) => (potBucket(b.pots) - potBucket(a.pots)) || byName(a, b);
export const byOnline = (a, b) => (b.online - a.online) || byName(a, b);

/**
 * A country's role: the operators' sums, and each operator's own draw (`ops`,
 * in the order of `operators`; one operator's is the role itself). It is open
 * where any operator that drew left a slot of it unclaimed (a newcomer with
 * that operator wins by default), and held where every operator that drew
 * filled all five. `chance` is the best of the operators' draws and `est` what
 * a newcomer who wins takes at the operator that pays most, an open one first:
 * with one operator, that operator's own.
 */
function roleOf(r, operators, multi) {
    const ops = (multi ? r.ops : [r]).map((o, i) => {
        const drawn = o.won !== null;
        const slot = operators[i] ? operators[i].slot : null;
        return {
            operator: operators[i] ? operators[i].domain : null,
            won: o.won,
            units: o.units,
            near: o.near_misses,
            pot: o.pot,
            open: drawn && o.won < SLOTS_PER_ROLE,
            held: drawn && o.won === SLOTS_PER_ROLE,
            chance: drawn ? chanceOf(o.units) : null,
            est: slot === null || slot === undefined ? null : winEstimate(slot, o.pot),
        };
    });
    const drew = ops.filter((o) => o.won !== null);
    const open = ops.filter((o) => o.open);
    const ests = (open.length ? open : ops).map((o) => o.est).filter((v) => v !== null);
    return {
        won: r.won,
        units: r.units,
        near: r.near_misses,
        pot: r.pot,
        awarded: r.awarded,
        // the slots drawn last epoch: five at each operator that drew
        slots: SLOTS_PER_ROLE * drew.length,
        open: open.length > 0,
        held: drew.length > 0 && drew.every((o) => o.held),
        chance: drew.length ? Math.max(...drew.map((o) => o.chance)) : null,
        est: ests.length ? Math.max(...ests) : null,
        ops,
    };
}

/** The pages' model of a snapshot, in English. */
export function buildModel(snap) {
    const last = snap.last_epoch;
    const phase = snap.prelaunch ? 'prelaunch' : !last ? (snap.pending_draw ? 'drawing' : 'first') : last.drawn ? 'drawn' : 'undrawn';
    const drawn = phase === 'drawn';
    // the operators' slot amounts added up: one slot at every operator (one operator: its slot)
    const slot = last ? last.slot : null;
    const threshold = slot === null ? null : BIG_POT_SLOTS * slot;
    // the operators of the list, with those whose figures the snapshot adds up; an
    // operator's own snapshot (ctf-operators/<domain>.json) is that operator alone
    const listed = snap.operators || (snap.operator ? [{ ...snap.operator, status: 'included', reason: null, drawn: last ? last.drawn : null, slot }] : []);
    const operators = listed.filter((o) => o.status === 'included');
    const multi = operators.length > 1;
    // the operators taking part: those included, or before the start every listed one
    const taking = operators.length || listed.length || 1;
    const apis = (operators.length ? operators : listed).map((o) => o.api_url).filter(Boolean);
    const slots = operators.map((o) => o.slot).filter((v) => v !== null && v !== undefined);
    const countries = snap.countries.map((c) => {
        const p = roleOf(c.providers, operators, multi);
        const x = roleOf(c.extenders, operators, multi);
        const pots = p.pot + x.pot;
        const avail = slot === null ? null : pots + 2 * SLOTS_PER_ROLE * slot;
        const big = avail !== null && avail >= threshold;
        const the = c.sentence_name;
        const sortKey = foldName(c.name);
        const shortKey = foldName(the.replace(/^the /, ''));
        return {
            code: c.code,
            name: c.name,
            the,
            short: the.replace(/^the /, ''),
            The: the.charAt(0).toUpperCase() + the.slice(1),
            sortKey,
            shortKey,
            // what the search and the picker match: the names, folded
            keys: [sortKey, shortKey],
            rank: 0,
            inhabited: c.inhabited,
            // held at any operator; `flags` counts the operators where it is
            flagHeld: c.flag_held,
            flags: multi ? p.ops.filter((o, i) => o.held && x.ops[i].held).length : Number(c.flag_held),
            openEpochs: c.open_epochs,
            near: c.near_misses,
            awarded: c.awarded,
            online: c.online,
            seenDays: c.seen_days,
            lastSeen: c.last_seen,
            peak: c.peak,
            p,
            x,
            pots,
            avail,
            big,
            hot: big && c.near_misses > 0,
            won: drawn ? p.won + x.won : null,
            // its local note (data/ctf-local-notes.js), shown on its page
            note: CTF_LOCAL_NOTES[c.code] || null,
        };
    });
    const az = countries.slice().sort(byFolded);
    az.forEach((c, i) => { c.rank = i; });
    const byCode = new Map(countries.map((c) => [c.code, c]));
    const nfc = snap.totals.not_fully_captured;
    return {
        lang: 'en',
        snapshot: snap,
        phase,
        drawn,
        potsKnown: Boolean(last),
        epoch: snap.current_epoch.epoch,
        firstEpoch: snap.first_epoch,
        startsAt: snap.prelaunch ? snap.prelaunch.starts_at : null,
        startBlock: snap.prelaunch ? snap.prelaunch.start_block : null,
        drawAt: snap.current_epoch.draw_at,
        asOf: snap.as_of,
        last,
        pending: snap.pending_draw,
        slot,
        threshold,
        // the operators whose figures these are, every listed one (those left out with the reason), and more than one
        operators,
        listed,
        leftOut: listed.filter((o) => o.status === 'left_out'),
        multi,
        // the slot counts the copy states: more than one operator taking part, and a country's slots of each role
        many: taking > 1,
        roleSlots: SLOTS_PER_ROLE * taking,
        // the operators' last slot amounts, the smallest and the largest
        slotMin: slots.length ? Math.min(...slots) : null,
        slotMax: slots.length ? Math.max(...slots) : null,
        // each operator's routes (sn/api/operator.yml): its state, a country's, and the visitor's country (the first operator's)
        api: {
            state: apis.map((url) => `${url}/sn/ctf`),
            here: apis.length ? `${apis[0]}/sn/ctf/here` : null,
            country: (code) => (apis.length === 1 ? `${apis[0]}/sn/ctf/country/${code}` : null),
        },
        totals: { flagsHeld: snap.totals.flags_held, flagsTotal: COUNTRY_COUNT * (operators.length || 1), openP: nfc ? nfc.providers : null, openX: nfc ? nfc.extenders : null },
        presence: snap.presence,
        countries,
        byCode,
        az,
    };
}

const localized = new WeakMap();

/**
 * The model in `lang`: the same figures, each country named in the language
 * (`name`, `the` and `The` its list name, `short`, `in`, `In`, `inShort`) and
 * ranked in its A–Z; the search matches the English names too. English is
 * the model itself.
 */
export function localModel(m, lang = 'en') {
    if (!lang || lang === m.lang) return m;
    if (!localized.has(m)) localized.set(m, new Map());
    const mine = localized.get(m);
    if (mine.has(lang)) return mine.get(lang);
    const names = ctfNames(lang);
    const rank = new Map(names.order.split(' ').map((code, i) => [code, i]));
    const countries = m.countries.map((c) => {
        const name = names.name[c.code];
        const short = names.short[c.code];
        const inPhrase = names.in[c.code];
        const sortKey = foldName(name);
        const shortKey = foldName(short);
        return {
            ...c,
            name,
            the: name,
            The: capital(name),
            short,
            in: inPhrase,
            In: capital(inPhrase),
            inShort: names.inShort[c.code],
            sortKey,
            shortKey,
            keys: [...new Set([sortKey, shortKey, ...c.keys])],
            rank: rank.has(c.code) ? rank.get(c.code) : COUNTRY_COUNT + c.rank,
        };
    });
    const lm = {
        ...m,
        lang,
        countries,
        byCode: new Map(countries.map((c) => [c.code, c])),
        az: countries.slice().sort(byName),
    };
    mine.set(lang, lm);
    return lm;
}

// ── what the pages say ──────────────────────────────────────────────────────

const T = (m) => ctfCopy(m.lang);
const F = (m) => formats(m.lang);
const say = (template, values) => interpolate(template, values);
const join = (m, parts) => parts.filter(Boolean).join(T(m).gap);

export const HUB_TITLE = ctfCopy('en').meta.hubTitle;
export const hubTitle = (lang = 'en') => ctfCopy(lang).meta.hubTitle;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 175;
const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
export const titleLength = graphemes;

/** A country page's title: the longest of the templates that fits 60 graphemes (SEO.md §2.2). `c` is a country of the page's model. */
export function countryTitle(c, lang = 'en') {
    const { full, plain, short } = ctfCopy(lang).meta.countryTitle;
    const values = place(c);
    const forms = [full, plain, short].map((t) => say(t, values));
    return forms.find((t) => graphemes(t) <= TITLE_MAX) || forms[forms.length - 1];
}

/**
 * The note at the top of the hub before capture the flag starts: the props of
 * its island (ctf/Countdown.jsx), its words in the model's language and the
 * start, from the snapshot's prelaunch block, the one source of the start. Null
 * in every other phase, so a build of a snapshot from after the start leaves
 * the note out.
 */
export function startNote(m) {
    if (m.phase !== 'prelaunch') return null;
    const t = T(m).start;
    const f = F(m);
    return {
        lang: m.lang,
        first: m.firstEpoch,
        startsAt: m.startsAt,
        note: say(t.note, { first: m.firstEpoch, block: f.int(m.startBlock), day: f.dayName(m.startsAt.slice(0, 10)), clock: f.utcClock(m.startsAt) }),
        live: say(t.live, { first: m.firstEpoch }),
        words: {
            in: t.in,
            units: [t.days, t.hours, t.minutes, t.seconds],
            blocks: t.blocks,
            go: t.go,
            about: t.about,
        },
    };
}

/** The hub's meta description, from the data. */
export function hubDescription(m) {
    const t = T(m).meta;
    const f = F(m);
    const lead = m.many ? f.count(t.hubLeadMany, m.roleSlots) : t.hubLead;
    if (m.phase === 'drawn') return f.count(t.hubDrawn, m.totals.openP, { lead, carried: f.alpha(m.last.carried) });
    if (m.phase === 'undrawn') return say(t.hubUndrawn, { lead, epoch: m.last.epoch, carried: f.alpha(m.last.carried) });
    if (m.phase === 'first') return say(t.hubFirst, { lead, epoch: m.epoch, day: f.utcDay(m.drawAt) });
    if (m.phase === 'drawing') return say(t.hubDrawing, { lead, first: m.firstEpoch });
    return say(t.hubPrelaunch, { lead, first: m.firstEpoch, day: f.utcDay(m.startsAt) });
}

/**
 * The providers the dashboard counted online in a country, as a sentence
 * (null without the counts): at the end of the snapshot's day, and over the
 * window the days with any, the last of them and the most at the end of a day.
 */
export function presenceSentence(m, c) {
    if (!m.presence || c.online === null) return null;
    const t = T(m).presence;
    const f = F(m);
    const { day, days } = m.presence;
    const values = { ...place(c), when: say(t.when, { day: f.dayName(day) }) };
    if (c.seenDays === 0) return f.count(t.never, days, values);
    const most = f.count(t.most, c.peak);
    const seen = f.int(c.seenDays);
    if (c.online === 0) return f.count(t.lastSeen, days, { ...values, last: f.dayName(c.lastSeen), seen, most });
    return f.count(t.online, days, { ...values, providers: f.count(t.providers, c.online), seen, most });
}

/** A territory without a permanent population: what becomes of its slots. */
export function uninhabitedSentence(c, lang = 'en') {
    return c.inhabited ? null : say(ctfCopy(lang).uninhabited, place(c));
}

/**
 * The rule a newcomer meets, as the data allows: after a draw, an unclaimed
 * slot is a default win; without one, only the draw's own rule (five entries
 * or fewer all win), since there is no last epoch to say which slots were open.
 */
export function defaultWinRule(m) {
    return m.drawn ? T(m).rule.drawn : T(m).rule.open;
}

/** What a country's last epoch adds to its page: its winners' take, its near misses and the epochs without a winner. */
export function lastEpochFacts(m, c) {
    if (!m.potsKnown) return null;
    const t = T(m).facts;
    const f = F(m);
    const parts = [];
    if (m.drawn) {
        parts.push(c.won > 0 ? f.count(t.won, c.won, { amount: f.alpha(c.awarded) }) : t.nobody);
        if (c.near > 0) parts.push(f.count(t.near, c.near));
    }
    if (c.openEpochs > 0) parts.push(f.count(t.open, c.openEpochs));
    return join(m, parts) || null;
}

/**
 * A country page's meta description, from its data; within 175 characters.
 * `updated` is the day the page last changed (the build passes the lastmod
 * token, which becomes a YYYY-MM-DD day): the length is measured with a day's
 * ten characters, and the token goes in after.
 */
const A_DAY = '0000-00-00';
export function countryDescription(m, c, updated) {
    const t = T(m).meta;
    const f = F(m);
    const values = place(c);
    let forms;
    if (m.phase === 'drawn' || m.phase === 'undrawn') {
        const pots = say(t.pots, { p: f.alpha(c.p.pot), x: f.alpha(c.x.pot) });
        const lead = m.drawn
            ? say(t.drawnLead, { ...values, po: c.p.slots - c.p.won, xo: c.x.slots - c.x.won, pots })
            : say(t.undrawnLead, { ...values, pots });
        // with a slot open a newcomer wins by default; where all ten were won, or without a draw, it enters the draw
        const stay = m.drawn && (c.p.open || c.x.open) ? t.stayWin : t.stayDraw;
        const stamp = say(t.updated, { day: A_DAY });
        forms = [join(m, [lead, stay, stamp]), join(m, [lead, stamp]), lead];
    } else {
        // with more than one operator taking part, the country's slots are five at each
        const start = (one, many, more) => (m.many ? f.count(many, m.roleSlots, { ...values, ...more }) : say(one, { ...values, ...more }));
        const begin = {
            prelaunch: () => start(t.startPrelaunch, t.startPrelaunchMany, { first: m.firstEpoch, day: f.utcDay(m.startsAt) }),
            first: () => start(t.startFirst, t.startFirstMany, { epoch: m.epoch, day: f.utcDay(m.drawAt) }),
            drawing: () => start(t.startDrawing, t.startDrawingMany, { first: m.firstEpoch }),
        }[m.phase]();
        const day = m.presence ? f.dayName(m.presence.day) : null;
        const seen = !m.presence || c.online === null ? null : c.online > 0 ? f.count(t.seen, c.online, { day }) : say(t.seenNone, { day });
        forms = [join(m, [begin, seen]), begin];
    }
    return (forms.find((d) => d.length <= DESCRIPTION_MAX) || forms[forms.length - 1]).replace(A_DAY, updated);
}

/** What a newcomer can do in a country this epoch, in a sentence: the page's intro and its card. */
export function countryMessage(m, c) {
    const t = T(m).message;
    const f = F(m);
    const values = place(c);
    if (m.phase === 'prelaunch') return say(t.prelaunch, { ...values, first: m.firstEpoch, start: f.utcTime(m.startsAt), draw: f.utcTime(m.drawAt) });
    if (m.phase === 'first') return say(t.first, { ...values, epoch: m.epoch, draw: f.utcTime(m.drawAt) });
    if (m.phase === 'drawing') return say(t.drawing, { ...values, first: m.firstEpoch });
    if (m.phase === 'undrawn') return say(t.undrawn, { ...values, epoch: m.last.epoch, p: f.alpha(c.p.pot), x: f.alpha(c.x.pot) });
    if (!c.p.open && !c.x.open) return say(m.multi ? t.heldMany : t.held, { ...values, pp: chanceText(m, c.p), xp: chanceText(m, c.x) });
    const p = c.p.open ? f.count(t.pSlots, c.p.slots - c.p.won) : null;
    const x = c.x.open ? f.count(t.xSlots, c.x.slots - c.x.won) : null;
    return say(p && x ? t.both : p ? t.pOnly : t.xOnly, { ...values, p, x });
}

/** One role's line on a country's card. */
export function roleLine(m, c, role) {
    const t = T(m).roleLine;
    const f = F(m);
    const r = c[role];
    if (m.phase === 'prelaunch') return f.count(t.prelaunch, m.roleSlots, { first: m.firstEpoch });
    if (m.phase === 'first') return f.count(t.first, m.roleSlots, { draw: f.utcTime(m.drawAt) });
    if (m.phase === 'drawing') return f.count(t.drawing, m.roleSlots, { first: m.firstEpoch });
    if (m.phase === 'undrawn') return say(t.undrawn, { pot: f.alpha(r.pot) });
    return r.open
        ? say(role === 'p' ? t.pOpen : t.xOpen, { won: r.won, slots: r.slots, pot: f.alpha(r.pot) })
        : f.count(t.held, r.units, { slots: r.slots });
}

/**
 * A role's figures at each operator, by its domain (the copy's `ops`): its
 * chance to win where all five slots were won, what a newcomer takes where one
 * is open, or that it had no draw. Null with one operator, whose figures are
 * the role's own.
 */
export function opsList(m, r) {
    if (!m.multi) return null;
    const t = T(m).ops;
    const f = F(m);
    return r.ops.map((o) => {
        if (o.won === null) return say(t.noDraw, { operator: o.operator });
        if (o.open) return say(t.open, { operator: o.operator, amount: f.alpha(o.est) });
        return say(t.chance, { operator: o.operator, pct: f.pct(o.chance) });
    }).join(t.sep);
}

/** A role's list by operator on a card or a tip ("By operator: …"); null with one operator. */
export const opsLine = (m, r) => (m.multi ? say(T(m).ops.label, { list: opsList(m, r) }) : null);

/** A fully captured role's chance to win as a sentence states it: the operator's, or each operator's (opsList). */
export const chanceText = (m, r) => (m.multi ? opsList(m, r) : F(m).pct(r.chance));

/** The draw a newcomer to a fully captured role faces: its operator's, or with more than one each operator's. */
export function drawLine(m, r) {
    if (m.multi) return opsLine(m, r);
    const t = T(m);
    const f = F(m);
    return join(m, [f.count(t.drawFrom, r.units), f.count(t.drawWith, r.units + 1, { slot: f.alpha(m.slot, 3) })]);
}

/** The slot's amount as the live bar shows it: last epoch's, or the operators' smallest to largest when they differ. */
export function slotFigure(m) {
    const f = F(m);
    if (m.multi && m.slotMin !== m.slotMax) return say(T(m).live.slotRange, { min: f.alpha(m.slotMin, 3), max: f.alpha(m.slotMax, 3) });
    return f.alpha(m.multi ? m.slotMax : m.slot, 3);
}

/**
 * The next step in a country with an open slot (a "So close" ribbon or an
 * "Open" chip, design.html): what the near misses were, what to run, what a
 * newcomer takes this epoch, and the call to action ('start', 'p' or 'x';
 * its words are the copy's `cta`, its link ctaHref).
 */
export function nextStep(m, c) {
    const t = T(m).next;
    const f = F(m);
    const xTake = c.x.open ? c.x.est : 0;
    const pTake = c.p.open ? c.p.est : 0;
    const top = Math.max(xTake, pTake);
    const both = Math.min(xTake, pTake) >= Math.max(0.2 * RAO, top / 2);
    const ext = xTake >= pTake;
    const unclaimed = (c.p.slots - c.p.won) + (c.x.slots - c.x.won);
    const values = place(c);
    return {
        near: c.near > 0 ? f.count(t.left, c.near) : f.count(t.unclaimed, unclaimed, { total: c.p.slots + c.x.slots }),
        act: say(both ? t.both : ext ? t.xOnly : t.pOnly, values),
        take: say(both ? t.takeEach : t.take, { amount: f.alpha(top) }),
        cta: both ? 'start' : ext ? 'x' : 'p',
    };
}

/** A role's details when a card opens on a touch screen. */
export function roleDetail(m, c, role) {
    const t = T(m).detail;
    const f = F(m);
    const r = c[role];
    const P = role === 'p';
    if (!m.drawn) return say(P ? t.pUndrawn : t.xUndrawn, { pot: f.alpha(r.pot) });
    if (r.open) {
        const open = say(P ? t.pOpen : t.xOpen, { won: r.won, slots: r.slots, pot: f.alpha(r.pot), est: f.alpha(r.est) });
        return m.multi ? join(m, [open, opsLine(m, r)]) : open;
    }
    if (m.multi) return say(P ? t.pHeldMany : t.xHeldMany, { list: opsList(m, r) });
    return say(P ? t.pHeld : t.xHeld, {
        units: f.count(t.units, r.units),
        pct: f.pct(r.chance),
        entries: f.count(t.entries, r.units + 1),
        slot: f.alpha(m.slot, 3),
    });
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

/** The grid's sorts and filters for the data: [key, words] in the model's language. */
export function sortsFor(m) {
    const s = T(m).sorts;
    if (m.drawn) return [['az', s.az], ['pot', s.pot], ['easy', s.easy]];
    if (m.phase === 'undrawn') return [['az', s.az], ['pot', s.pot]];
    return [['az', s.az], ['online', s.online], ['fewest', s.fewest]];
}
export function showsFor(m) {
    const s = T(m).shows;
    if (m.drawn) return [['all', s.all], ['big', s.big], ['held', s.held]];
    return m.phase === 'undrawn' ? [['all', s.all], ['big', s.big]] : [];
}

const rankOf = (c) => (c.hot ? 0 : c.big ? 1 : 2);

/** The grid's countries for a sort, a filter, a search and a focus (a stats filter). */
export function gridCountries(m, { sort = 'az', show = 'all', q = '', focus = null } = {}) {
    const query = foldName(q.trim());
    const rows = m.countries.filter((c) => {
        if (focus === 'held') return c.flagHeld;
        if (focus === 'np') return c.p.open;
        if (focus === 'nx') return c.x.open;
        if (show === 'big' && !c.big) return false;
        if (show === 'held' && !c.flagHeld) return false;
        if (query && !c.keys.some((key) => key.includes(query)) && c.code !== query) return false;
        return true;
    });
    let order = byName;
    if (focus === 'np' || focus === 'nx') order = byPot;
    else if (!focus && sort === 'pot') order = byPot;
    else if (!focus && sort === 'easy') order = (a, b) => (rankOf(a) - rankOf(b)) || byPot(a, b);
    else if (!focus && sort === 'online') order = (a, b) => ((b.online || 0) - (a.online || 0)) || byName(a, b);
    else if (!focus && sort === 'fewest') order = (a, b) => (Number(a.inhabited === false) - Number(b.inhabited === false)) || ((a.online || 0) - (b.online || 0)) || byName(a, b);
    return rows.sort(order);
}

/** The grid cell a tip belongs to: its key is "<kind>:<code>" for the cell's ribbon, chips and chances (an Easy wins card's "feat:" is not the cell's). */
export const GRID_TIP_KINDS = ['grid', 'p', 'x', 'pc', 'xc'];
export const isCellTip = (key, code) => Boolean(key) && GRID_TIP_KINDS.some((kind) => key === `${kind}:${code}`);

/** The country a typed choice names: its name, its sentence name or its code (in English or the page's language), accents folded; null for none. */
export function findCountry(m, text) {
    const v = foldName(text.trim());
    if (!v) return null;
    return m.countries.find((c) => c.sortKey === v || c.shortKey === v || c.code === v)
        || m.countries.find((c) => c.keys.includes(v))
        || null;
}

/** The pages before and after a country's in A–Z, wrapping around. */
export function neighbours(m, code) {
    const i = m.az.findIndex((c) => c.code === code);
    const n = m.az.length;
    return { prev: m.az[(i - 1 + n) % n], next: m.az[(i + 1) % n] };
}
