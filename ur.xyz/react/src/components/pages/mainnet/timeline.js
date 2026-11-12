/**
 * The /mainnet timeline's helpers (components/pages/Mainnet.jsx): reading a
 * milestone's date, writing it for the page, grouping the milestones by payout
 * epoch, and turning a source into a link. Pure functions with no React and
 * no browser APIs, so the static render, the SPA and the node test
 * (tests/mainnet-timeline.test.mjs) share them. Dates are read and written in
 * UTC, so the visitor's time zone changes nothing on the page.
 *
 * Every word they write is the page's copy (i18n/pages/mainnet/<lang>.js):
 * a function that writes takes that copy as `t`, and the page's language as
 * `lang` where a count picks a plural form, and writes English without them.
 */

import { SECONDS_PER_BLOCK } from '../../../data/mainnet.js';
import EN from '../../../i18n/pages/mainnet/en.js';
import { formatNumber, interpolate, plural } from '../../../i18n/format.js';

// A milestone's status: done; in progress; scheduled, fixed by the chain, a
// contract or a decision; or planned, intended but not final. Scheduled and
// planned milestones are still ahead, and may move.
export const STATUS_LABEL = Object.freeze({ ...EN.labels.status });
const AHEAD = new Set(['scheduled', 'planned']);

/**
 * Whether a milestone's date is shown as approximate (≈). A scheduled or
 * planned time is a projection, from its block number or from the plan, so it
 * is approximate unless the milestone says it is exact (`approximate: false`,
 * a time set by a decision); a past time, or a bare day, is exact unless the
 * milestone says otherwise (`approximate: true`).
 */
export function isApproximate(event, when = parseWhen(event?.date)) {
    if (typeof event?.approximate === 'boolean') return event.approximate;
    return Boolean(when?.start.hasTime) && AHEAD.has(event?.status);
}

export const SETTLEMENT_LABEL = Object.freeze({ ...EN.labels.settlement });
export const SOURCE_KINDS = Object.freeze(['evm_tx', 'substrate_extrinsic', 'evm_address', 'evm_block', 'substrate_block', 'doc']);
// the kinds that are transactions: the page folds more than a few of them away
export const TRANSACTION_KINDS = Object.freeze(['evm_tx', 'substrate_extrinsic']);

// What a source's ref must look like before the page links it. A source whose
// ref is empty (not known yet) or malformed is not shown at all.
export const REF_FORMATS = Object.freeze({
    evm_tx: /^0x[0-9a-fA-F]{64}$/,
    // block-index: 9276925-0010 (the page pads the index to 4 digits)
    substrate_extrinsic: /^\d+-\d+$/,
    evm_address: /^0x[0-9a-fA-F]{40}$/,
    // a block number
    evm_block: /^\d+$/,
    substrate_block: /^\d+$/,
    // a page elsewhere, or one of this site's
    doc: /^(?:https:\/\/\S+|\/\S*)$/,
});

// the placeholders each explorer template carries, and the words of its link
// (labels.view: View transaction, View contract, View block)
export const EXPLORER_PLACEHOLDERS = Object.freeze({
    evm_tx: ['{hash}'],
    substrate_extrinsic: ['{block}', '{index}'],
    evm_address: ['{address}'],
    evm_block: ['{number}'],
    substrate_block: ['{number}'],
});
const VIEW = Object.freeze({
    evm_tx: 'transaction',
    substrate_extrinsic: 'transaction',
    evm_address: 'contract',
    evm_block: 'block',
    substrate_block: 'block',
});

// The values a ref fills its template with. An extrinsic's id is built from
// its block and index numbers, the index padded to 4 digits: the explorer
// answers an unpadded id with an empty page.
function fills(kind, ref) {
    if (kind === 'substrate_extrinsic') {
        const [block, index] = ref.split('-').map(Number);
        if (!Number.isSafeInteger(block) || !Number.isSafeInteger(index) || index > 9999) return null;
        return { '{block}': String(block), '{index}': String(index).padStart(4, '0') };
    }
    if (kind === 'evm_block' || kind === 'substrate_block') {
        const number = Number(ref);
        return Number.isSafeInteger(number) ? { '{number}': String(number) } : null;
    }
    return { [EXPLORER_PLACEHOLDERS[kind][0]]: encodeURIComponent(ref) };
}

/**
 * The link a source becomes, or null while it has no usable ref. A
 * transaction links its explorer page as "View transaction", a contract as
 * "View contract" (`value` is its address, which the page shows beside the
 * label) and a block as "View block"; a doc links its own URL under its label.
 */
export function sourceLink(source, explorers, t = EN) {
    const kind = source?.kind;
    const ref = typeof source?.ref === 'string' ? source.ref.trim() : '';
    if (!ref || !REF_FORMATS[kind]?.test(ref)) return null;
    if (kind === 'doc') return { href: ref, text: String(source.label || ref), value: null };
    const template = explorers?.[kind];
    const placeholders = EXPLORER_PLACEHOLDERS[kind];
    if (typeof template !== 'string' || !template.startsWith('https://') || !placeholders.every((p) => template.includes(p))) return null;
    const values = fills(kind, ref);
    if (!values) return null;
    const href = placeholders.reduce((url, p) => url.split(p).join(values[p]), template);
    return { href, text: t.labels.view[VIEW[kind]], value: kind === 'evm_address' ? ref : null };
}

/**
 * A milestone's sources that have a link, in the order the data lists them,
 * split for the page: `rows` shows every source; when the milestone has more
 * than `fold` transactions, they go to `folded` instead (a closed list), so a
 * deployment's run of transactions does not bury its contracts.
 */
export function sourceRows(sources, explorers, { fold = 3, t = EN } = {}) {
    const linked = (sources || []).map((source) => ({ source, link: sourceLink(source, explorers, t) })).filter(({ link }) => link);
    const transactions = linked.filter(({ source }) => TRANSACTION_KINDS.includes(source.kind));
    if (transactions.length <= fold) return { rows: linked, folded: [] };
    return { rows: linked.filter((s) => !transactions.includes(s)), folded: transactions };
}

/** 0xC189…6406: an address short enough to sit in a line of text. */
export function shortHex(value) {
    const text = String(value || '');
    return text.length > 14 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
}

/**
 * A template's runs, for React to render in place: 'Epoch {number}' with
 * { number: 4 } is ['Epoch ', 4]. Each value goes in as given (a number, a
 * string, an element), so a sentence keeps its words and its values in the
 * language's own order. An unknown placeholder stays as written; an empty run
 * is left out.
 */
export function runs(template, values = {}) {
    return String(template)
        .split(/(\{[A-Za-z][A-Za-z0-9_]*\})/)
        .filter((part) => part !== '')
        .map((part) => {
            const name = /^\{([A-Za-z][A-Za-z0-9_]*)\}$/.exec(part)?.[1];
            return name && Object.hasOwn(values, name) ? values[name] : part;
        });
}

// ── dates ────────────────────────────────────────────────────────────────────

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function parseInstant(text) {
    const value = String(text || '').trim();
    const day = value.match(DAY);
    if (day) {
        const [year, month, date] = day.slice(1).map(Number);
        const ms = Date.UTC(year, month - 1, date);
        const back = new Date(ms);
        if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month - 1 || back.getUTCDate() !== date) return null;
        return { iso: value, ms, hasTime: false };
    }
    if (!INSTANT.test(value)) return null;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? { iso: value, ms, hasTime: true } : null;
}

/**
 * A milestone's date: "YYYY-MM-DD", an ISO date-time, or an ISO interval of
 * two of the same kind ("start/end", the end after the start). Returns
 * { start, end }, with end null for a single date, or null for anything else.
 */
export function parseWhen(value) {
    const parts = String(value || '').split('/');
    if (parts.length > 2) return null;
    const start = parseInstant(parts[0]);
    if (!start) return null;
    if (parts.length === 1) return { start, end: null };
    const end = parseInstant(parts[1]);
    if (!end || end.hasTime !== start.hasTime || end.ms <= start.ms) return null;
    return { start, end };
}

// the short month names of English (dates.months)
export const MONTHS = Object.freeze([...EN.dates.months]);
const DAY_MS = 86400000;
const pad = (n) => String(n).padStart(2, '0');

/** A day as the timeline writes it (dates.day): Thu Oct 8, чт, 8 окт., 10月8日周四. */
export function dayOf(ms, t = EN) {
    const d = new Date(ms);
    const { dates } = t;
    return interpolate(dates.day, { weekday: dates.weekdays[d.getUTCDay()], month: dates.months[d.getUTCMonth()], date: d.getUTCDate() });
}

const clockOf = (ms) => {
    const d = new Date(ms);
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

/**
 * A date as the page writes it, in runs: { text } and { text, dateTime }, the
 * latter a <time>. `approxStart` / `approxEnd` mark a time ≈: a planned
 * milestone's, or an epoch boundary projected from its block number. `t` is
 * the page's copy (its days, and the arrow that points on); times are UTC in
 * every language.
 *
 *   Thu Oct 8 · 18:36 UTC                            a time
 *   Thu Oct 8 · 17:59–18:16 UTC                      an interval within a day
 *   Wed Oct 21 · ≈18:09 → Thu Oct 22 · ≈18:09 UTC    an interval across days
 *   Sun Oct 11,  Sun Oct 18 – Mon Oct 19             days
 *   ≈ Sat Oct 17                                     an approximate day
 */
export function whenParts({ start, end }, { approxStart = false, approxEnd = approxStart, t = EN } = {}) {
    const mark = (on) => (on ? '≈' : '');
    if (!start.hasTime) {
        const first = { text: dayOf(start.ms, t), dateTime: start.iso };
        const days = end ? [first, { text: ' – ' }, { text: dayOf(end.ms, t), dateTime: end.iso }] : [first];
        return approxStart ? [{ text: '≈ ' }, ...days] : days;
    }
    const first = { text: `${dayOf(start.ms, t)} · ${mark(approxStart)}${clockOf(start.ms)}`, dateTime: start.iso };
    if (!end) return [first, { text: ' UTC' }];
    if (Math.floor(start.ms / DAY_MS) === Math.floor(end.ms / DAY_MS)) {
        // one ≈ covers a range within the day, as in ≈15:48–16:08
        const second = { text: `${approxStart ? '' : mark(approxEnd)}${clockOf(end.ms)}`, dateTime: end.iso };
        return [first, { text: '–' }, second, { text: ' UTC' }];
    }
    return [first, { text: ` ${t.labels.arrow} ` }, { text: `${dayOf(end.ms, t)} · ${mark(approxEnd)}${clockOf(end.ms)}`, dateTime: end.iso }, { text: ' UTC' }];
}

/** The same date as plain text. */
export const whenText = (when, options) => whenParts(when, options).map((part) => part.text).join('');

// ── epochs ───────────────────────────────────────────────────────────────────

export const thousands = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * The languages whose /mainnet figures are written as Intl writes them for the
 * page, as their other pages write figures: Spanish (9.247.228, 1076,26), the
 * owner's style decision of 2026-11-12, so /mainnet and /ctf read alike. Every
 * other language keeps the English digits and separators (9,247,228).
 */
export const INTL_FIGURES = Object.freeze(new Set(['es']));

/** A whole number as the page writes it: 9,247,228, or Intl's 9.247.228 in a language of INTL_FIGURES. */
export const figure = (n, lang = 'en') => (INTL_FIGURES.has(lang) ? formatNumber(Math.round(n), lang) : thousands(n));

/** An epoch's start and end, as a milestone date (date-times). */
export const epochWhen = (epoch) => parseWhen(`${epoch.start.time}/${epoch.end.time}`);

/** The days an epoch runs, without times (the page's epoch list). */
export const epochDays = (epoch) => parseWhen(`${epoch.start.time.slice(0, 10)}/${epoch.end.time.slice(0, 10)}`);

/**
 * "Blocks 9,247,228 → 9,297,628 · 50,400 blocks, 7 days". The figures keep
 * their English digits and separators, but in a language of INTL_FIGURES
 * (Spanish: "Bloques 9.247.228 → 9.297.628 · 50.400 bloques, 7 días"); the
 * words and their plural forms are the language's (labels.epochBlocks, blocks,
 * days, aboutDays).
 */
export function epochBlocks(epoch, { lang = 'en', t = EN } = {}) {
    const blocks = epoch.end.block - epoch.start.block;
    const days = (blocks * SECONDS_PER_BLOCK) / 86400;
    const counted = (forms, n) => interpolate(plural(lang, n, forms), { count: figure(n, lang) });
    const length = Number.isInteger(days) ? counted(t.labels.days, days) : counted(t.labels.aboutDays, Math.round(days));
    return interpolate(t.labels.epochBlocks, { start: figure(epoch.start.block, lang), end: figure(epoch.end.block, lang), blocks: counted(t.labels.blocks, blocks), length });
}

/**
 * The milestones grouped by the payout epoch they end in. A milestone with an
 * interval belongs to the epoch its interval ends in (the version 1
 * deployment starts minutes before epoch 0 and ends in it), and a date without
 * a time counts from the start of its day (a daytime step on the day an epoch
 * turns belongs to the epoch that is ending). Returns the groups in order,
 * { id, title, epoch, summary, events: [{ ...event, when }] }, each keeping
 * the order the data lists its milestones in; `t` names them (labels.epoch,
 * labels.afterEpoch, and labels.beforeLaunch where `before` has no title). A
 * milestone whose date cannot be read is left out; the test fails on it.
 */
export function groupByEpoch(events, epochs, { before = {}, after = {}, t = EN } = {}) {
    const bounds = epochs.map((epoch) => ({ epoch, startMs: Date.parse(epoch.start.time), endMs: Date.parse(epoch.end.time) }));
    const last = epochs[epochs.length - 1];
    const groupOf = (ms) => {
        if (!bounds.length || ms < bounds[0].startMs) {
            return { id: 'before-launch', title: before.title || t.labels.beforeLaunch, epoch: null, summary: before.summary || null };
        }
        const hit = bounds.find((b) => ms >= b.startMs && ms < b.endMs);
        if (hit) return { id: `epoch-${hit.epoch.number}`, title: interpolate(t.labels.epoch, { number: hit.epoch.number }), epoch: hit.epoch, summary: hit.epoch.summary };
        return { id: `after-epoch-${last.number}`, title: after.title || interpolate(t.labels.afterEpoch, { number: last.number }), epoch: null, summary: after.summary || null };
    };
    const groups = new Map();
    for (const event of events) {
        const when = parseWhen(event.date);
        if (!when) continue;
        const group = groupOf((when.end || when.start).ms);
        if (!groups.has(group.id)) groups.set(group.id, { ...group, events: [] });
        groups.get(group.id).events.push({ ...event, when });
    }
    return [...groups.values()];
}
