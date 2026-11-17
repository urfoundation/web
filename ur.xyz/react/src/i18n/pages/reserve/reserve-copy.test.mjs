// The /reserve copy units (this directory: the hero, balance/, programs/,
// custody/; read by react/src/components/pages/Reserve.jsx): every placeholder
// of the English is one the page fills; each translation has its English's
// shape, keeps its placeholders and carries the plural forms its language
// needs; the head fits its limits; and the data the English is derived from
// (react/src/data/reserve.js) still fits the copy.
//
// Usage (from react/): node --test src/i18n/pages/reserve/
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { reserve } from '../../../data/reserve.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const UNITS = ['.', 'balance', 'programs', 'custody'];
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];

// the placeholders Reserve.jsx (and reserve/SplitBar.jsx, reserve/Denom.jsx) fill
const FILLED = new Set([
    'account', 'address', 'amount', 'archiveHosts', 'block', 'ceiling', 'change', 'coldkey', 'count',
    'date', 'emission', 'explorer', 'from', 'label', 'liveDate', 'min', 'minerAllocation', 'momentum',
    'ownerShare', 'paid', 'price', 'priceHosts', 'received', 'registered', 'reserve', 'rpcHosts',
    'segments', 'share', 'source', 'spent', 'tao', 'term', 'threshold', 'time', 'title', 'to', 'unit',
    'value',
]);

const CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const isPlural = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
    && Object.hasOwn(v, 'other') && Object.keys(v).every((k) => CATEGORIES.has(k));
const placeholders = (s) => [...String(s).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((m) => m[1]).sort();

async function unit(name, lang) {
    const file = path.join(DIR, name, `${lang}.js`);
    return fs.existsSync(file) ? (await import(pathToFileURL(file).href)).default : null;
}

/** Every string of a unit as [key, value], plural nodes whole. */
function leaves(value, prefix = '', out = []) {
    if (typeof value === 'string' || isPlural(value)) out.push([prefix, value]);
    else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${prefix}.${i}`, out));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) leaves(v, prefix ? `${prefix}.${k}` : k, out);
    return out;
}

/** The plural categories a language's counts reach (a count of days, months, programs or keys). */
function reachable(lang) {
    const rules = new Intl.PluralRules(lang);
    return new Set(Array.from({ length: 1001 }, (_, n) => rules.select(n)));
}

const english = Object.fromEntries(await Promise.all(UNITS.map(async (u) => [u, await unit(u, 'en')])));

test('every placeholder of the English is one the page fills', () => {
    for (const u of UNITS) {
        for (const [key, value] of leaves(english[u])) {
            const forms = isPlural(value) ? Object.values(value) : [value];
            for (const form of forms) {
                for (const name of placeholders(form)) assert.ok(FILLED.has(name), `${u}/en.js ${key}: {${name}} is filled nowhere`);
            }
        }
    }
});

test('the English plural nodes have one and other, with the same placeholders', () => {
    for (const u of UNITS) {
        for (const [key, value] of leaves(english[u])) {
            if (!isPlural(value)) continue;
            assert.deepEqual(Object.keys(value).sort(), ['one', 'other'], `${u}/en.js ${key}`);
            assert.deepEqual(placeholders(value.one), placeholders(value.other), `${u}/en.js ${key}`);
        }
    }
});

test('each translation has its English shape, placeholders and plural forms', async () => {
    for (const u of UNITS) {
        for (const lang of LANGS) {
            const translated = await unit(u, lang);
            if (!translated) continue;
            const mine = new Map(leaves(translated));
            const need = reachable(lang);
            for (const [key, en] of leaves(english[u])) {
                assert.ok(mine.has(key), `${u}/${lang}.js lacks ${key}`);
                const value = mine.get(key);
                if (!isPlural(en)) {
                    assert.equal(typeof value, 'string', `${u}/${lang}.js ${key} is not a string`);
                    assert.deepEqual(placeholders(value), placeholders(en), `${u}/${lang}.js ${key}: placeholders differ from the English`);
                    continue;
                }
                assert.ok(isPlural(value), `${u}/${lang}.js ${key} is not a plural node`);
                for (const category of need) assert.ok(Object.hasOwn(value, category), `${u}/${lang}.js ${key} lacks the "${category}" form`);
                // a form may leave the count implicit ("one day"), never another value
                const wanted = placeholders(en.other).filter((p) => p !== 'count');
                for (const [category, form] of Object.entries(value)) {
                    const got = placeholders(form);
                    for (const p of wanted) assert.ok(got.includes(p), `${u}/${lang}.js ${key}.${category} lacks {${p}}`);
                    for (const p of got) assert.ok(p === 'count' || wanted.includes(p), `${u}/${lang}.js ${key}.${category} has {${p}}, which its English has not`);
                }
            }
            const englishKeys = new Set(leaves(english[u]).map(([k]) => k));
            for (const key of mine.keys()) assert.ok(englishKeys.has(key), `${u}/${lang}.js has ${key}, which en.js has not`);
        }
    }
});

test('the head fits: a title of at most 60 graphemes, a description of at most 175 characters', async () => {
    const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
    for (const lang of ['en', ...LANGS]) {
        const top = lang === 'en' ? english['.'] : await unit('.', lang);
        if (!top) continue;
        assert.ok(graphemes(top.meta.title) <= 60, `${lang}: title "${top.meta.title}" is over 60 graphemes`);
        assert.ok(top.meta.description.length <= 175, `${lang}: description is over 175 characters`);
        if (lang !== 'en') assert.notEqual(top.meta.title, english['.'].meta.title, `${lang}: the title is the English one`);
    }
});

test('every program type reads as a program type title, so it is translated with it', () => {
    const titles = reserve.programTypes.map((t) => t.title);
    for (const p of reserve.programs) assert.ok(titles.includes(p.type), `program ${p.id}: type "${p.type}" is no program type's title`);
});

test('each status not yet active has its own count phrase, which reads as its label did', () => {
    const { byStatus } = english.programs.counts;
    for (const [status, label] of Object.entries(reserve.programStatus)) {
        if (status === 'active' || status === 'complete') continue;
        assert.ok(byStatus[status], `programs/en.js counts.byStatus lacks "${status}"`);
        // the English the page wrote before: `${count} ${label.toLowerCase()}`
        for (const form of Object.values(byStatus[status])) assert.equal(form, `{count} ${label.toLowerCase()}`);
    }
});

test('the derived English follows the data, item for item', () => {
    assert.equal(english['.'].hero.name, reserve.name);
    assert.equal(english['.'].meta.breadcrumb, reserve.name);
    assert.deepEqual(english.programs.types.list.map((t) => t.title), reserve.programTypes.map((t) => t.title));
    assert.deepEqual(english.programs.statuses, reserve.programStatus);
    assert.deepEqual(english.programs.programs.list.map((p) => p.title), reserve.programs.map((p) => p.title));
    assert.deepEqual(english.programs.programs.list.map((p) => p.payRule ?? null), reserve.programs.map((p) => p.payRule ?? null));
    assert.deepEqual(english.custody.process.steps.map((s) => s.title), reserve.steps.map((s) => s.title));
    assert.deepEqual(english.custody.custody.signers.map((s) => s.label), reserve.custody.signers.map((s) => s.label));
    assert.equal(english.custody.custody.threshold, reserve.custody.threshold);
});
