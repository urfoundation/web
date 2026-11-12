// The capture the flag pages' copy in every site language (this directory:
// en.js and its translations, and names/, the countries' names): what the
// staleness gate (tests/i18n-staleness.mjs) does not see.
//
// - Shape: a translation has en.js's keys, arrays and plural nodes; every
//   string keeps its English's {placeholders} and <tags>, and a plural node
//   gives every form its language has (Intl.PluralRules), each with the
//   placeholders of the English forms.
// - Words: no page in any language calls capture the flag a lottery, a
//   jackpot or a bet (sn design/ctf/SEO.md §2.3); a translation says "the
//   draw" and "chance to win" in its own words.
// - Search: in every phase of the data (the committed snapshot and an answer
//   of each phase, tests/ctf-fixtures.mjs), every title fits 60 graphemes and
//   every description 175 characters, and none repeats within a language.
// - Before a draw no sentence shows a chance (a percentage).
// - Names: names/<lang>.js is what scripts/ctf-names.mjs writes (CLDR's names
//   and A–Z, node's ICU permitting), complete, and each form a plain phrase.
//
// Usage (from react/): node --test src/i18n/pages/ctf/ctf-copy.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { normalize } from '../../../../../scripts/ctf-import.mjs';
import { namesFiles } from '../../../../../scripts/ctf-names.mjs';
import { SNAPSHOT, drawnAnswer, firstAnswer } from '../../../../tests/ctf-fixtures.mjs';
import {
    DESCRIPTION_MAX,
    TITLE_MAX,
    buildModel,
    countryDescription,
    countryMessage,
    countryTitle,
    defaultWinRule,
    hubDescription,
    hubTitle,
    lastEpochFacts,
    localModel,
    presenceSentence,
    roleLine,
    titleLength,
    uninhabitedSentence,
} from '../../../components/pages/ctf/model.js';
import { ctfCardAlt } from '../../../components/pages/ctf/og.js';
import group from './group.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const load = async (file) => (fs.existsSync(path.join(HERE, file)) ? (await import(pathToFileURL(path.join(HERE, file)).href)).default : null);
const EN = await load('en.js');
const COPY = Object.fromEntries(await Promise.all(LANGS.map(async (lang) => [lang, await load(`${lang}.js`)])));
const NAMES = Object.fromEntries(await Promise.all(['en', ...LANGS].map(async (lang) => [lang, await load(`names/${lang}.js`)])));
const present = LANGS.filter((lang) => COPY[lang]);
const DAY = '2026-12-04';

const CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const isPlural = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v) && 'other' in v && Object.keys(v).every((k) => CATEGORIES.has(k));
const placeholders = (s) => [...s.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((m) => m[1]).sort();
const tags = (s) => [...s.matchAll(/<(\/?)([a-z][a-z0-9]*)>/g)].map((m) => `${m[1]}${m[2]}`).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Every string of a copy object, with its key path. */
function* strings(value, at = '') {
    if (typeof value === 'string') yield [at, value];
    else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${at}.${i}`);
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) yield* strings(v, at ? `${at}.${k}` : k);
}

/** The problems of a translation's shape against the English, with key paths. */
function shapeProblems(lang, en, tr, at = '') {
    const out = [];
    if (typeof en === 'string') {
        if (typeof tr !== 'string') return [`${at}: a string in English`];
        if (!same(placeholders(en), placeholders(tr))) out.push(`${at}: placeholders ${placeholders(tr).join(',')} for ${placeholders(en).join(',')}`);
        if (!same(tags(en), tags(tr))) out.push(`${at}: tags ${tags(tr).join(',')} for ${tags(en).join(',')}`);
        if (/^\s|\s$/.test(en) !== /^\s|\s$/.test(tr) && lang !== 'zh') out.push(`${at}: the English begins or ends with a space and the translation does not, or the other way round`);
        return out;
    }
    if (isPlural(en)) {
        if (!isPlural(tr)) return [`${at}: a plural node in English`];
        const needs = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
        for (const category of needs) if (!(category in tr)) out.push(`${at}: no "${category}" form`);
        const english = new Set(Object.values(en).flatMap(placeholders));
        const tagSet = tags(en.other);
        for (const [category, form] of Object.entries(tr)) {
            const has = placeholders(form);
            for (const name of has) if (!english.has(name)) out.push(`${at}.${category}: placeholder {${name}} the English has not`);
            for (const name of english) {
                // a form may leave out the count where its category is the single number 1 ("one at most")
                if (!has.includes(name) && !(name === 'count' && category === 'one' && lang !== 'ru')) out.push(`${at}.${category}: no {${name}}`);
            }
            if (!same(tags(form), tagSet)) out.push(`${at}.${category}: tags ${tags(form).join(',')} for ${tagSet.join(',')}`);
        }
        return out;
    }
    if (Array.isArray(en)) {
        if (!Array.isArray(tr) || tr.length !== en.length) return [`${at}: an array of ${en.length} in English`];
        return en.flatMap((v, i) => shapeProblems(lang, v, tr[i], `${at}.${i}`));
    }
    if (en && typeof en === 'object') {
        if (!tr || typeof tr !== 'object' || Array.isArray(tr)) return [`${at}: an object in English`];
        for (const key of Object.keys(tr)) if (!(key in en)) out.push(`${at ? `${at}.` : ''}${key}: not in English`);
        for (const [key, v] of Object.entries(en)) {
            if (!(key in tr)) out.push(`${at ? `${at}.` : ''}${key}: missing`);
            else out.push(...shapeProblems(lang, v, tr[key], at ? `${at}.${key}` : key));
        }
        return out;
    }
    return [];
}

test('every translation has the English\'s keys, placeholders, tags and plural forms', () => {
    if (group.localized) assert.deepEqual(present, LANGS, 'a localized group has all five translations');
    for (const lang of present) {
        assert.deepEqual(shapeProblems(lang, EN, COPY[lang]), [], lang);
    }
});

// The words the owner ruled out (sn design/ctf/SEO.md §2.3: lottery, jackpot,
// bet), and their kin, in each language; "draw", "pot" and "chance to win" stay.
const BANNED = {
    en: /\b(lotter(y|ies)|jackpots?|bets?|betting|gambl\w*|raffle\w*|sweepstake\w*)\b/i,
    ru: /(лотере|джекпот|ставк[аиуеой]|пари\b|азартн|тотализатор)/i,
    ar: /(يانصيب|اليانصيب|لوتو|جائزة كبرى|الجائزة الكبرى|رهان|مراهنة|قمار|مقامرة|ميسر)/,
    zh: /(彩票|抽奖|头奖|大奖|赌|博彩|下注)/,
    de: /(lotterie|lotto|jackpot|wette|glücksspiel|verlosung|tombola)/i,
    es: /(loter[ií]a|jackpot|apuesta|juego de azar|rifa|quiniela)/i,
};

test('no page in any language calls capture the flag a lottery, a jackpot or a bet', () => {
    for (const [lang, copy] of [['en', EN], ...present.map((l) => [l, COPY[l]])]) {
        for (const [at, s] of strings(copy)) assert.ok(!BANNED[lang].test(s), `${lang} ${at}: ${s}`);
    }
});

// every phase the pages render: the committed snapshot and an answer of each kind
const PHASES = {
    committed: SNAPSHOT,
    first: normalize(firstAnswer(), null),
    pending: normalize(firstAnswer({ pending: true }), null),
    drawn: normalize(drawnAnswer(), null),
    undrawn: normalize(drawnAnswer({ drawn: false }), null),
};
const MODELS = Object.fromEntries(Object.entries(PHASES).map(([k, s]) => [k, buildModel(s)]));

test('titles fit 60 graphemes and descriptions 175 characters, and none repeats, in every language and phase', () => {
    for (const lang of ['en', ...present]) {
        assert.ok(titleLength(hubTitle(lang)) <= TITLE_MAX, `${lang}: ${hubTitle(lang)}`);
        for (const [phase, base] of Object.entries(MODELS)) {
            const m = localModel(base, lang);
            const titles = new Set([hubTitle(lang)]);
            const descriptions = new Set([hubDescription(m)]);
            assert.ok(hubDescription(m).length <= DESCRIPTION_MAX, `${lang} ${phase}: ${hubDescription(m).length} ${hubDescription(m)}`);
            assert.ok(!/\{[A-Za-z]/.test(hubDescription(m)), `${lang} ${phase}: ${hubDescription(m)}`);
            for (const c of m.countries) {
                const title = countryTitle(c, lang);
                const description = countryDescription(m, c, DAY);
                assert.ok(titleLength(title) <= TITLE_MAX, `${lang} ${phase} ${c.code}: ${titleLength(title)} ${title}`);
                assert.ok(description.length <= DESCRIPTION_MAX, `${lang} ${phase} ${c.code}: ${description.length} ${description}`);
                assert.ok(!/\{[A-Za-z]|<\/?[a-z]/.test(title + description), `${lang} ${phase} ${c.code}: ${title} ${description}`);
                assert.ok(!titles.has(title), `${lang} ${phase}: two pages titled ${title}`);
                assert.ok(!descriptions.has(description), `${lang} ${phase}: two pages described ${description}`);
                titles.add(title);
                descriptions.add(description);
            }
        }
    }
});

test('before a draw no sentence in any language shows a chance to win', () => {
    for (const lang of ['en', ...present]) {
        for (const phase of ['committed', 'first', 'pending', 'undrawn']) {
            const m = localModel(MODELS[phase], lang);
            for (const c of m.countries) {
                const said = [countryMessage(m, c), roleLine(m, c, 'p'), roleLine(m, c, 'x'), countryDescription(m, c, DAY), lastEpochFacts(m, c) || '', defaultWinRule(m), presenceSentence(m, c) || '', uninhabitedSentence(c, lang) || ''].join(' ');
                assert.ok(!/\d\s?‎?[%٪]/.test(said), `${lang} ${phase} ${c.code}: ${said}`);
                assert.ok(!/\{[A-Za-z]/.test(said), `${lang} ${phase} ${c.code}: an unfilled placeholder in ${said}`);
            }
            assert.ok(!/\{[A-Za-z]/.test(ctfCardAlt(m)), `${lang} ${phase}: ${ctfCardAlt(m)}`);
        }
    }
});

test('the countries\' names are CLDR\'s, complete, in each language\'s A–Z, with every form written', async () => {
    const codes = SNAPSHOT.countries.map((c) => c.code);
    const files = await namesFiles();
    for (const lang of ['en', ...LANGS]) {
        const names = NAMES[lang];
        assert.ok(names, `names/${lang}.js`);
        for (const key of ['name', 'short', 'in', 'inShort']) {
            assert.deepEqual(Object.keys(names[key]), codes, `${lang} ${key}: the snapshot's codes, in order`);
            for (const [code, v] of Object.entries(names[key])) {
                assert.ok(typeof v === 'string' && v.trim() === v && v.length > 1 && !/[{}<>]/.test(v), `${lang} ${key}.${code}: ${JSON.stringify(v)}`);
            }
        }
        assert.deepEqual(names.order.split(' ').sort(), [...codes].sort(), `${lang}: the A–Z has every code once`);
        // node's ICU writes CLDR's names: the file is what the generator writes, unless this node's CLDR is not the one it was written with
        const written = fs.readFileSync(path.join(HERE, `names/${lang}.js`), 'utf8');
        if (written !== files[lang]) {
            const cldr = (written.match(/CLDR (\d+(?:\.\d+)*)/) || [])[1];
            if (lang === 'en' || !cldr || cldr === process.versions.cldr) assert.equal(written, files[lang], `names/${lang}.js is not what scripts/ctf-names.mjs writes: run it and review the diff`);
            else console.log(`ctf-copy: names/${lang}.js was written with CLDR ${cldr}; this node has ${process.versions.cldr}`);
        }
    }
    // the English is the snapshot's, as the pages print it
    const en = buildModel(SNAPSHOT);
    for (const c of en.countries) {
        assert.equal(NAMES.en.name[c.code], c.name);
        assert.equal(NAMES.en.short[c.code], c.short);
        assert.equal(NAMES.en.in[c.code], `in ${c.the}`);
    }
    assert.deepEqual(NAMES.en.order.split(' '), en.az.map((c) => c.code));
});
