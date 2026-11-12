// The research methodology's translations (/<lang>/research/methodology): what
// tests/i18n-staleness.mjs does not check. Runs in `make gates` (node --test on
// src/i18n/pages).
//
// - Every translated string states the same figures as its English, in its own
//   language's number format (../research-report/figures.js), with the same
//   placeholders.
// - The lab's headline figures are, in each language, the report's own
//   (tests/research-methodology.test.mjs pins the English ones).
// - The head fits the SEO audit, and the five stages' lines fit the drawing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { figuresOf } from '../research-report/figures.js';
import { flattenCopy } from '../research-report/english.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const load = async (file) => (fs.existsSync(file) ? (await import(file)).default : null);
const english = await load(path.join(HERE, 'en.js'));
const translations = {};
for (const lang of LANGS) translations[lang] = await load(path.join(HERE, `${lang}.js`));
const present = LANGS.filter((lang) => translations[lang]);
const placeholders = (s) => (s.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) || []).sort();

test('every translated string keeps the English figures and placeholders', () => {
    const en = flattenCopy(english);
    for (const lang of present) {
        const tr = flattenCopy(translations[lang]);
        for (const [key, value] of en) {
            const got = tr.get(key);
            if (typeof value !== 'string' || got === undefined) continue;
            assert.deepEqual(figuresOf(got, lang), figuresOf(value, 'en'), `${lang} ${key}: "${got}" states other figures than "${value}"`);
            assert.deepEqual(placeholders(got), placeholders(value), `${lang} ${key}: placeholders`);
            if (lang === 'ar') assert.doesNotMatch(got, /[٠-٩۰-۹]/, `${lang} ${key}: Western digits only`);
        }
    }
});

test('the lab’s headline figures are the report’s, in each language', async () => {
    for (const lang of present) {
        const report = await load(path.join(HERE, '../research-report/text', `${lang}.js`));
        if (!report) continue;
        const kpis = report.kpis.map((k) => k.v);
        const facts = translations[lang].sections.loops.lab.facts;
        assert.equal(facts[0].v, english.sections.loops.lab.facts[0].v, `${lang}: the count of measured changes`);
        for (const f of facts.slice(1)) assert.ok(kpis.includes(f.v), `${lang}: ${f.v} is not one of the report's headline figures (${kpis.join(', ')})`);
    }
});

test('each translation has its own title and description within the SEO audit limits', () => {
    const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
    for (const lang of present) {
        const t = translations[lang];
        assert.ok(graphemes(`${t.title} | UR`) <= 60, `${lang}: title "${t.title} | UR"`);
        assert.notEqual(t.title, english.title, `${lang}: title`);
        assert.ok(t.description.length <= (lang === 'zh' ? 80 : 175), `${lang}: description is ${t.description.length} characters`);
        assert.notEqual(t.description, english.description, `${lang}: description`);
    }
});

test('the five stages fit the wide drawing', () => {
    // a stage's two lines share the 150px between two stages; CJK characters are about twice as wide
    const width = (s) => [...s].reduce((w, c) => w + (/[　-鿿＀-￯]/.test(c) ? 2 : 1), 0);
    for (const lang of present) {
        for (const s of translations[lang].outputs.stages) {
            assert.equal(s.lines.length, 2, `${lang}: ${s.name}`);
            for (const line of s.lines) assert.ok(width(line) <= 24, `${lang}: "${line}" is too wide for its stage`);
            assert.ok(width(s.name) <= 14, `${lang}: stage name "${s.name}"`);
        }
        for (const key of Object.values(translations[lang].outputs.railKeys)) assert.ok(width(key) <= 10, `${lang}: rail key "${key}"`);
    }
});
