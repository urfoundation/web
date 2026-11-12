/**
 * The research report's English copy, derived from its data
 * (react/src/data/research-report-2026-q3.json, written by
 * scripts/research-report-import.mjs), so the data stays the single source of
 * the page's English and the import needs to know nothing about translations.
 *
 * The page has two copy units:
 *   pages/research-report       (en.js)       the page's own words and what its
 *     islands show (the meters, the dock, the glance chart, the sections
 *     sidebar, the method animations, the glossary tooltips): the labels written
 *     in the components, and from the data each entry's date, headline and
 *     meter labels, the kinds, the meters and the glossary;
 *   pages/research-report/text  (text/en.js)  the report's text, which only the
 *     static page renders: the plain layer written over the report (key
 *     figures, meanings, the mission, the milestone, the methods' summaries, the
 *     start-to-end cards) and the layer the import quotes from the report.
 * Keys follow the data's own ids (entry ids, method keys, meter keys, glossary
 * term ids), never their position, so a re-import that rewrites a row's English
 * changes that row's keys alone: their translations stay, and
 * tests/i18n-staleness.mjs reports exactly those keys as stale until they are
 * translated again and accepted.
 *
 * Figures stay in the data. The strings here quote them as the report writes
 * them; each translation writes the same figures in its own language's number
 * format (pages/research-report/figures.js checks that they match).
 */
import { PLURAL, termId } from '../../../components/pages/research-report/model.js';

const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const isPluralNode = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
    && 'other' in v && Object.keys(v).every((k) => PLURAL_CATEGORIES.includes(k));

/**
 * A copy unit's strings by key, as tests/i18n-staleness.mjs keys them
 * ("entries.e-aug-24.measured"; a plural node is one entry).
 */
export function flattenCopy(value, prefix = '', out = new Map()) {
    if (isPluralNode(value)) out.set(prefix, value);
    else if (Array.isArray(value)) value.forEach((v, i) => flattenCopy(v, `${prefix}.${i}`, out));
    else if (value && typeof value === 'object') {
        for (const [key, v] of Object.entries(value)) flattenCopy(v, prefix ? `${prefix}.${key}` : key, out);
    } else out.set(prefix, value);
    return out;
}

/**
 * The keys whose English differs between two versions of the report data, by
 * copy unit: after a re-import, exactly the translations of these keys are
 * stale (and a key that is new has none yet).
 */
export function changedCopy(before, after) {
    const units = { 'research-report': pageEnglish, 'research-report/text': textEnglish };
    const out = {};
    for (const [unit, derive] of Object.entries(units)) {
        const a = flattenCopy(derive(before));
        const b = flattenCopy(derive(after));
        const keys = [...new Set([...a.keys(), ...b.keys()])].filter((k) => JSON.stringify(a.get(k)) !== JSON.stringify(b.get(k)));
        if (keys.length) out[unit] = keys;
    }
    return out;
}

/** An object without its null and undefined values. */
function defined(object) {
    return Object.fromEntries(Object.entries(object).filter(([, value]) => value != null));
}

const byId = (entries, make) => Object.fromEntries(entries.map((e) => [e.id, make(e)]));

// meters whose value is a count: their unit takes the count's plural form
const COUNTED = new Set(['path', 'memory', 'fixed']);

/** The labels of an entry's meter moves, in the data's shape; the numbers stay in the data. */
function meterLabels(m) {
    const out = {};
    if (m.load) {
        out.load = defined({
            baseline: m.load.baseline && m.load.baseline.l,
            points: m.load.points && m.load.points.map((p) => p.l),
        });
    }
    if (m.bulk) {
        out.bulk = defined({
            controlled: m.bulk.controlled && m.bulk.controlled.x,
            points: m.bulk.points && m.bulk.points.map((p) => p.l),
        });
    }
    for (const key of ['path', 'memory']) if (m[key]) out[key] = m[key].map((it) => ({ l: it.l, t: it.t }));
    if (m.fixed) out.fixed = m.fixed.l;
    return out;
}

/** Every evidence label the page shows (the entries' and the milestone's), by a slug of its own. */
export function sourceKey(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sourceLabels(data) {
    const labels = new Set();
    for (const e of data.entries) for (const src of e.evidence) labels.add(src.label);
    for (const src of (data.milestone && data.milestone.report && data.milestone.report.evidence) || []) labels.add(src.label);
    return Object.fromEntries([...labels].map((label) => [sourceKey(label), label]));
}

/** The data's part of the page unit (pages/research-report/en.js). */
export function pageEnglish(data) {
    return {
        title: data.title,
        kinds: Object.fromEntries(Object.entries(data.kinds).map(([kind, k]) => [kind, {
            label: k.label,
            legend: k.legend,
            // a month's tally: "1 gain", "3 gains"
            tally: { one: `{count} ${k.label.toLowerCase()}`, other: `{count} ${PLURAL[kind]}` },
        }])),
        meters: Object.fromEntries(data.meters.map((m) => [m.key, {
            name: m.name,
            tag: m.tag,
            unit: COUNTED.has(m.key) ? { other: m.unit } : m.unit,
            short: m.short,
        }])),
        entries: byId(data.entries, (e) => defined({
            date: e.date,
            title: e.title,
            meters: e.meters ? meterLabels(e.meters) : null,
        })),
        // the glossary, by each term's anchor id (g-ack, g-h1-plus, …)
        terms: Object.fromEntries(data.glossary.map(([term, def]) => [termId(term), { term, def }])),
    };
}

/** The text unit (pages/research-report/text/en.js): the report's text as the static page shows it. */
export function textEnglish(data) {
    const ms = data.milestone;
    const r = ms.report;
    return {
        mission: {
            lede: data.mission.lede,
            title: data.mission.title,
            body: [...data.mission.body],
            items: Object.fromEntries(data.mission.items.map((it) => [it.meter, { headline: it.headline, body: it.body }])),
            open: data.mission.open,
        },
        kpis: data.kpis.map((k) => ({ v: k.v, l: k.l })),
        milestone: {
            eyebrow: ms.eyebrow,
            headline: ms.headline,
            lede: ms.lede,
            scope: ms.scope,
            caption: ms.run.caption,
            stats: ms.stats.map((st) => ({ v: st.v, l: st.l })),
            report: {
                intro: [...r.intro],
                changes: r.changes.map((c) => ({ title: c.title, text: c.text })),
                table: r.table.map((row) => ({ experiment: row.experiment, result: row.result, establishes: row.establishes })),
                guards: [...r.guards],
            },
        },
        entries: byId(data.entries, (e) => defined({
            flag: e.flag,
            stat: e.stat ? { v: e.stat.v, l: e.stat.l } : null,
            more: e.more,
            meaning: e.meaning,
            rejected: e.rejected,
            change: e.change,
            measured: e.measured,
            suites: e.suites,
        })),
        methods: Object.fromEntries(data.methods.map((m) => [m.key, {
            heading: m.heading,
            plain: m.plain,
            title: m.title,
            text: m.text,
            caption: m.caption,
            alt: m.alt,
        }])),
        end: data.end.map((card) => defined({
            axis: card.axis,
            figure: card.figure,
            what: card.what,
            confidence: card.confidence,
            report: card.report ? { evidence: card.report.evidence, estimate: card.report.estimate } : null,
        })),
        // by the instrument's name; `name` is the card's heading (LOWBAR, …, Browsing)
        instruments: Object.fromEntries(data.instruments.map((it) => [it.name, { name: it.name, plain: it.plain, text: it.text }])),
        open: data.open.map((q) => ({ title: q.title, text: q.text })),
        latest: data.latest,
        summary: data.summary,
        source: data.source.label,
        sources: sourceLabels(data),
        commits: { ...data.commits },
    };
}
