// The research report's translations (/<lang>/research/2026-q3-report): what
// tests/i18n-staleness.mjs does not check. Runs in `make gates` (node --test on
// src/i18n/pages).
//
// - Every translated string states the same figures as its English, in its own
//   language's number format (figures.js): nothing rounded, added or dropped.
// - Placeholders, the report's bold and code markup, and plural forms survive.
// - The head fits the SEO audit: a title of at most 60 graphemes with " | UR",
//   a description of at most 175 characters (80 for Chinese, whose snippets are
//   shorter), each different from the English.
// - Every glossary term the English page links somewhere is linked in each
//   translation too (terms.js gives the words' patterns).
// - A re-import of the English (scripts/research-report-import.mjs) keeps the
//   translations and flags exactly the strings whose English changed: their
//   keys follow the data's ids, so a changed row changes that row's keys alone.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { changedCopy, flattenCopy, pageEnglish, textEnglish } from './english.js';
import { figuresOf } from './figures.js';
import { linkHtml, linkText, termMatchers } from '../../../components/pages/research-report/model.js';
import { refresh } from '../../../../../scripts/research-report-import.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '../../../data/research-report-2026-q3.json');
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];

async function unit(dir, lang) {
    const file = path.join(HERE, dir, `${lang}.js`);
    return fs.existsSync(file) ? (await import(file)).default : null;
}
const UNITS = { page: '.', text: 'text' };
const english = { page: await unit('.', 'en'), text: await unit('text', 'en') };
const translations = {};
for (const lang of LANGS) translations[lang] = { page: await unit('.', lang), text: await unit('text', lang) };
const present = LANGS.filter((lang) => translations[lang].page || translations[lang].text);

const placeholders = (s) => (s.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) || []).sort();
const tags = (s) => (s.match(/<\/?[a-z][^>]*>/gi) || []).sort();
const codes = (s) => (s.match(/<code>[\s\S]*?<\/code>/g) || []).sort();
const isPlural = (v) => v && typeof v === 'object' && !Array.isArray(v) && 'other' in v;

test('every translated string keeps the English figures, placeholders and markup', () => {
    for (const lang of present) {
        for (const name of Object.keys(UNITS)) {
            const t = translations[lang][name];
            if (!t) continue;
            const en = flattenCopy(english[name]);
            const tr = flattenCopy(t);
            for (const [key, value] of en) {
                const got = tr.get(key);
                if (got === undefined) continue; // tests/i18n-staleness.mjs reports a missing key
                if (isPlural(value)) {
                    assert.ok(isPlural(got), `${lang} ${name} ${key}: a plural node`);
                    const allowed = new Set([...placeholders(value.other), '{count}']);
                    for (const [cat, form] of Object.entries(got)) {
                        for (const p of placeholders(form)) assert.ok(allowed.has(p), `${lang} ${name} ${key}.${cat}: ${p}`);
                        for (const p of placeholders(value.other)) if (p !== '{count}') assert.ok(form.includes(p), `${lang} ${name} ${key}.${cat}: lacks ${p}`);
                    }
                    continue;
                }
                if (typeof value !== 'string') continue;
                assert.equal(typeof got, 'string', `${lang} ${name} ${key}`);
                const where = `${lang} ${name} ${key}: "${got}"`;
                assert.deepEqual(figuresOf(got, lang), figuresOf(value, 'en'), `${where} states other figures than "${value}"`);
                assert.deepEqual(placeholders(got), placeholders(value), `${where}: placeholders`);
                assert.deepEqual(tags(got), tags(value), `${where}: markup`);
                assert.deepEqual(codes(got), codes(value), `${where}: code`);
                if (lang === 'ar') assert.doesNotMatch(got, /[٠-٩۰-۹]/, `${where}: Western digits only`);
            }
        }
    }
});

test('each translation has its own title and description within the SEO audit limits', () => {
    const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
    for (const lang of present) {
        const t = translations[lang].page;
        if (!t) continue;
        assert.ok(graphemes(`${t.title} | UR`) <= 60, `${lang}: title "${t.title} | UR"`);
        assert.notEqual(t.title, english.page.title, `${lang}: title`);
        assert.ok(t.description.length <= (lang === 'zh' ? 80 : 175), `${lang}: description is ${t.description.length} characters`);
        assert.notEqual(t.description, english.page.description, `${lang}: description`);
    }
});

/** The glossary ids a language's page links: the same strings the page runs through its term matching. */
function linkedTerms(page, text, lang) {
    const matchers = termMatchers(page.terms, lang);
    const ids = new Set();
    const plain = (s, used) => linkText(s, matchers, used).forEach((run) => run.id && ids.add(run.id));
    const html = (s, used) => [...linkHtml(s, matchers, used).matchAll(/data-term="([^"]+)"/g)].forEach((m) => ids.add(m[1]));
    for (const e of data.entries) {
        const x = text.entries[e.id];
        const used = new Set();
        if (x.stat) plain(x.stat.l, used);
        if (x.more) plain(x.more, used);
        plain(x.meaning, used);
        html(x.measured, used);
        html(x.suites, used);
    }
    const used = new Set();
    for (const st of text.milestone.stats) plain(st.l, used);
    for (const c of text.milestone.report.changes) html(c.text, used);
    for (const row of text.milestone.report.table) html(row.establishes, used);
    for (const m of Object.values(text.methods)) html(m.text, new Set());
    return ids;
}

test('every glossary term the English page links is linked in each translation', () => {
    const linked = linkedTerms(english.page, english.text, 'en');
    assert.ok(linked.size > 20, `the English page links ${linked.size} terms`);
    for (const lang of present) {
        const { page, text } = translations[lang];
        if (!page || !text) continue;
        const got = linkedTerms(page, text, lang);
        const missing = [...linked].filter((id) => !got.has(id)).map((id) => `${id} (${page.terms[id].term})`);
        assert.deepEqual(missing, [], `${lang}: no pattern in terms.js finds these terms in the translation`);
    }
});

// The import writes only the data: the translations are other files, so they
// stay; what changes is the English that en.js derives, and only at the keys
// of the rows the report changed.
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 12);
const recordOf = (v) => (typeof v === 'string' ? v : JSON.stringify(Object.keys(v).sort().map((k) => [k, v[k]])));

function reimported(mutate) {
    const after = JSON.parse(JSON.stringify(data));
    mutate(after);
    return after;
}

test('a re-import that rewrites a row changes exactly that row’s English', () => {
    const after = reimported((d) => {
        d.entries[3].measured = d.entries[3].measured.replace('ACK fast path', 'ACK-only fast path');
        d.methods[2].text = `${d.methods[2].text} Each test names its clock.`;
    });
    assert.deepEqual(changedCopy(data, after), {
        'research-report/text': [`entries.${data.entries[3].id}.measured`, 'methods.deterministic.text'],
    });
    // the same keys exist before and after, so no translation goes missing
    for (const derive of [pageEnglish, textEnglish]) {
        assert.deepEqual([...flattenCopy(derive(after)).keys()], [...flattenCopy(derive(data)).keys()]);
    }
});

test('the recorded sources flag exactly the changed strings as stale', () => {
    const store = path.join(HERE, 'text', 'source-hashes.json');
    if (!fs.existsSync(store)) return; // recorded by tests/i18n-staleness.mjs --accept
    const recorded = JSON.parse(fs.readFileSync(store, 'utf8'));
    const after = reimported((d) => { d.summary = `${d.summary} (revised)`; });
    const now = flattenCopy(textEnglish(after));
    for (const lang of LANGS.filter((l) => recorded[l])) {
        const stale = [...now].filter(([key, value]) => recorded[lang][key] !== sha(recordOf(value))).map(([key]) => key);
        assert.deepEqual(stale, ['summary'], `${lang}: stale after the re-import`);
    }
});

// with the report itself at hand (a workspace with connect beside web), run the real import
const REPORT = path.join(HERE, '../../../../../../../connect/20261024-RESEARCH-IMPACT.md');
test('the import, run on an edited report, changes only the edited row’s English', { skip: !fs.existsSync(REPORT) && 'connect/20261024-RESEARCH-IMPACT.md is not beside this repository' }, () => {
    const md = fs.readFileSync(REPORT, 'utf8');
    assert.deepEqual(refresh(data, md), data, 'the data matches the report');
    const edited = md.replace('Peak **24.73 MiB**', 'Peak **24.74 MiB**');
    assert.notEqual(edited, md);
    assert.deepEqual(changedCopy(data, refresh(data, edited)), { 'research-report/text': ['entries.e-aug-24.suites'] });
});
