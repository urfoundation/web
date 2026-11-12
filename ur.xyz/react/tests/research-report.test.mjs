// The research report page's data and its pure model
// (src/data/research-report-2026-q3.json, components/pages/research-report/model.js).
//
// The page's promise is that every figure is the report's own and that the
// meters are never combined. This checks what can be checked without the
// report: the data's shape, the six kinds and their counts, that each entry's
// first layer quotes figures that its verbatim layer contains, that the meters
// only ever grow by the entries that record them, the glossary links, and the
// route that serves the page.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeStates, linkHtml, linkText, movedMeters, rangeEnd, rows, termId, termMatchers } from '../src/components/pages/research-report/model.js';
import { parseRoute, buildPath, isTranslatedRoute, RESEARCH_REPORT_SLUGS } from '../src/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/research-report-2026-q3.json'), 'utf8'));
const KINDS = ['gain', 'recovery', 'observation', 'mixed', 'rejected', 'groundwork'];
const METERS = ['load', 'bulk', 'path', 'memory', 'fixed'];

test('every entry has its two layers, a kind, a unique id and a date in the period', () => {
    assert.equal(data.entries.length, 39);
    assert.deepEqual(Object.keys(data.kinds), KINDS);
    const ids = new Set();
    let last = '';
    for (const e of data.entries) {
        assert.ok(KINDS.includes(e.kind), `${e.id}: kind ${e.kind}`);
        assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
        ids.add(e.id);
        assert.match(e.iso, /^2026-(08|09|10)-\d\d$/, e.id);
        assert.ok(e.iso >= data.period.start && (rangeEnd(e) || e.iso) <= data.period.end, `${e.id} is outside the period`);
        assert.ok(e.iso.slice(5, 7) === { aug: '08', sep: '09', oct: '10' }[e.month], `${e.id}: month ${e.month}`);
        assert.ok(e.title && e.meaning && e.change && e.measured && e.suites, `${e.id}: a layer is missing`);
        assert.ok(e.evidence.length > 0, `${e.id}: no evidence`);
        for (const src of e.evidence) assert.ok(src.private ? !src.href : /^https:\/\/github\.com\/urnetwork\//.test(src.href), `${e.id}: ${src.label}`);
        // the report's rows are in date order within a month, not across ranges, so only months are ordered
        assert.ok(e.month >= last || ['aug', 'sep', 'oct'].indexOf(e.month) >= ['aug', 'sep', 'oct'].indexOf(last), e.id);
        last = e.month;
    }
});

test('the kinds are the ones the page has always shown', () => {
    const counts = Object.fromEntries(KINDS.map((k) => [k, data.entries.filter((e) => e.kind === k).length]));
    assert.deepEqual(counts, { gain: 14, recovery: 8, observation: 3, mixed: 4, rejected: 3, groundwork: 7 });
    for (const e of data.entries.filter((x) => x.kind === 'groundwork')) {
        assert.ok(!e.meters || !e.meters.load, `${e.id}: groundwork claims no speed`);
    }
});

// The first layer quotes the report: each number it shows must appear in the
// entry's own report text (measured or suites), or in the start-to-end table
// for the few figures the report gives there. Rounding would fail this.
test('the first layer quotes figures that the report states', () => {
    const estimates = data.end.map((c) => (c.report ? c.report.evidence + c.report.estimate : '')).join(' ');
    const plain = (html) => html.replace(/<[^>]+>/g, '');
    // the milestone entry may also quote the report's milestone section
    const ms = data.milestone.report;
    const milestoneText = [...ms.intro, ...ms.changes.map((c) => c.text), ...ms.table.flatMap((r) => [r.experiment, r.result, r.establishes]), ...ms.guards].join(' ');
    for (const e of data.entries) {
        const source = `${plain(e.change)} ${plain(e.measured)} ${plain(e.suites)} ${plain(estimates)} ${e.flag === 'Milestone' ? plain(milestoneText) : ''}`.replace(/−/g, '-');
        const shown = [e.stat && e.stat.v, e.stat && e.stat.l, e.more, e.rejected].filter(Boolean).join(' ').replace(/−/g, '-');
        // whole numbers only: "H1," is a name, "1,1" two counts, "3,967.8" one figure
        for (const num of shown.match(/(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?/g) || []) {
            // small counts and dates (1–31) read as words in prose; check the rest
            if (/^\d{1,2}$/.test(num) && Number(num) <= 64) continue;
            assert.ok(source.includes(num), `${e.id}: "${num}" is not in the report's text for this entry`);
        }
    }
});

test('the meters only move at the entry that records them, and never combine', () => {
    const states = computeStates(data.entries);
    assert.equal(states.length, data.entries.length + 1);
    assert.equal(states[0].load.latest, null);
    for (let i = 1; i < states.length; i++) {
        const [a, b] = [states[i - 1], states[i]];
        const moved = new Set(Object.keys(data.entries[i - 1].meters || {}));
        for (const key of ['path', 'memory', 'fixed']) {
            assert.ok(b[key].length >= a[key].length, `${key} shrank at ${i - 1}`);
            if (!moved.has(key)) assert.equal(b[key].length, a[key].length, `${key} moved at ${data.entries[i - 1].id} without recording it`);
        }
        if (!moved.has('load')) assert.deepEqual(b.load, a.load);
        if (!moved.has('bulk')) assert.deepEqual(b.bulk, a.bulk);
    }
    const final = states.at(-1);
    assert.equal(final.load.latest.v, 545.7);
    assert.equal(final.load.final, true);
    assert.equal(final.bulk.controlled.to, 41);
    assert.equal(final.path.length, 11);
    assert.equal(final.memory.length, 5);
    assert.equal(final.fixed.length, data.entries.filter((e) => e.kind === 'recovery').length);
    for (const e of data.entries) for (const key of Object.keys(e.meters || {})) assert.ok(METERS.includes(key), `${e.id}: meter ${key}`);
    assert.deepEqual(data.meters.map((m) => m.key), METERS);
});

test('the start-to-end figures match the report rows they cite', () => {
    for (const card of data.end.filter((c) => c.row != null)) {
        assert.ok(card.report && card.report.axis, card.axis);
        const text = (card.report.evidence + card.report.estimate).replace(/<[^>]+>/g, '');
        for (const num of card.figure.match(/\d+(?:\.\d+)?/g) || []) assert.ok(text.includes(num), `${card.axis}: ${num}`);
    }
});

test('the milestone quotes its section: every figure it shows is the report\'s', () => {
    const ms = data.milestone;
    const text = [...ms.report.intro, ...ms.report.changes.map((c) => c.text), ...ms.report.table.flatMap((r) => [r.experiment, r.result, r.establishes]), ...ms.report.guards]
        .join(' ').replace(/<[^>]+>/g, '');
    assert.equal(ms.report.changes.length, 5);
    assert.equal(ms.report.table.length, 5);
    assert.ok(ms.report.evidence.every((src) => src.href.startsWith('https://github.com/urnetwork/connect/')));
    const shown = [ms.lede, ms.scope, ...ms.stats.flatMap((st) => [st.v, st.l]), ms.run.caption, data.kpis[0].v,
        ...data.end.filter((c) => c.milestone).flatMap((c) => [c.figure, c.what])].join(' ');
    for (const num of shown.match(/(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?/g) || []) {
        if (/^\d{1,2}$/.test(num) && Number(num) <= 64) continue;
        assert.ok(text.includes(num), `milestone: "${num}" is not in the report's milestone section`);
    }
    const run = ms.run;
    assert.ok(run.first < run.steady[0] && run.steady[0] <= run.steady[1] && run.mean < run.steady[0] && run.steady[1] < run.service);
});

test('methods, glossary, figures and the mission are complete', () => {
    assert.deepEqual(data.methods.map((m) => m.key), ['owners', 'boundary', 'deterministic', 'ablation', 'layers', 'noise', 'validity']);
    for (const m of data.methods) {
        assert.ok(m.heading && m.plain && m.title && m.text && m.caption && m.alt, m.key);
        for (const i of m.seen) assert.ok(data.entries[i], `${m.key}: seen ${i}`);
    }
    const ids = data.glossary.map(([term]) => termId(term));
    assert.equal(new Set(ids).size, ids.length, 'glossary ids collide');
    assert.ok(data.mission.aim.includes('best encryption') && data.mission.aim.includes('best speed'));
    assert.deepEqual(data.mission.items.map((it) => it.meter), METERS);
});

test('glossary terms link once per entry, never inside code or a tag', () => {
    const matchers = termMatchers(data.glossary);
    const used = new Set();
    const runs = linkText('H1+ beats H1 on ACK-sized writes; H1 again', matchers, used);
    assert.deepEqual(runs.filter((r) => r.id).map((r) => r.text), ['H1+', 'H1', 'ACK']);
    assert.equal(linkText('ACK again', matchers, used).filter((r) => r.id).length, 0, 'a term links once');
    const html = linkHtml('<b>PERFVAR</b> and <code>gVisor</code> then gVisor', matchers, new Set());
    assert.match(html, /<b><a class="rr-term" href="#g-perfvar"[^>]*>PERFVAR<\/a><\/b>/);
    assert.match(html, /<code>gVisor<\/code> then <a class="rr-term" href="#g-gvisor"/);
    assert.ok(!/<a[^>]*><a/.test(html));
});

test('rows place close marks apart', () => {
    assert.deepEqual(rows([0, 3, 20, 5], 8), [0, 1, 0, 2]);
});

test('the page is served at /research/<slug> and at /<lang>/research/<slug>, under the research section', () => {
    assert.deepEqual(RESEARCH_REPORT_SLUGS, [data.slug]);
    assert.deepEqual(parseRoute(`/research/${data.slug}`), { name: 'research-report', slug: data.slug });
    assert.deepEqual(parseRoute(`/de/research/${data.slug}`), { name: 'research-report', slug: data.slug });
    assert.deepEqual(parseRoute('/research/not-a-report'), { name: 'home', slug: null });
    assert.equal(buildPath({ name: 'research-report', slug: data.slug }, 'en'), `/research/${data.slug}`);
    for (const lang of ['ru', 'ar', 'zh', 'de', 'es']) {
        assert.equal(buildPath({ name: 'research-report', slug: data.slug }, lang), `/${lang}/research/${data.slug}`);
    }
    assert.equal(isTranslatedRoute({ name: 'research-report', slug: data.slug }), true);
    assert.equal(movedMeters(data.entries[5], data.meters).length, 3);
});
