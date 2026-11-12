// /mainnet's translations (react/src/i18n/pages/mainnet: the page's own copy,
// data/ for data/mainnet.js and timeline/ for data/mainnet-timeline.json),
// checked against their English for what a translation must not change:
//
//   • the shape: the same keys and the same number of paragraphs, a plural
//     node with every form its language uses (tests/i18n-staleness.mjs checks
//     the keys too, and that no English changed after it was translated);
//   • every {placeholder}, as it is;
//   • the figures: every number of the English (a block, an amount, a time, a
//     day of the month, a section of a document) appears as the English writes
//     it, with its digits and separators, Western digits in Arabic too, and in
//     Spanish as Intl writes it for the page (9.240.028, 1076,26), as /ctf and
//     its other pages do (timeline.js INTL_FIGURES); every ≈ and UTC; and the
//     names that are not translated (SN25, STSettlement2, drand, the
//     governance Safe, …);
//   • capture the flag under the apps' name for it in each language, and never
//     called a lottery or a game of chance: the draw picks slots, in plain
//     words, without the words of gambling or of earnings promises
//     (sn design/ctf/SEO.md §2.3), and is a public, verifiable random
//     selection, never named with the words of drawing lots (the owner's
//     decision of 2026-11-12; each language's word is in its page unit's
//     header, as on /ctf).
//
// Usage: node --test src/i18n/pages/mainnet/mainnet-copy.test.mjs   (from react/; no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { INTL_FIGURES } from '../../../components/pages/mainnet/timeline.js';
import { formatNumber } from '../../format.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UNITS = ['', 'data', 'timeline'];
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const intl = (lang) => (lang === 'ar' ? 'ar-u-nu-latn' : lang);

const isPlural = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v) && 'other' in v && Object.keys(v).every((k) => PLURAL.has(k));

function flatten(value, prefix = '', out = new Map()) {
    if (isPlural(value)) out.set(prefix, value);
    else if (Array.isArray(value)) {
        out.set(`${prefix}#length`, value.length);
        value.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
    } else if (value && typeof value === 'object') {
        for (const [key, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${key}` : key, out);
    } else out.set(prefix, value);
    return out;
}

async function load(unit, lang) {
    const file = path.join(HERE, unit, `${lang}.js`);
    if (!fs.existsSync(file)) return null;
    return (await import(pathToFileURL(file).href)).default;
}

const english = Object.fromEntries(await Promise.all(UNITS.map(async (unit) => [unit, flatten(await load(unit, 'en'))])));
const translations = [];
for (const lang of LANGS) {
    for (const unit of UNITS) {
        const copy = await load(unit, lang);
        if (copy) translations.push({ lang, unit, name: `${unit || 'mainnet'}/${lang}.js`, flat: flatten(copy) });
    }
}

// each translated string beside its English: a plural node's every form beside the English `other`
function* pairs(t) {
    for (const [key, en] of english[t.unit]) {
        if (!t.flat.has(key) || key.endsWith('#length')) continue;
        const value = t.flat.get(key);
        if (isPlural(en)) {
            if (isPlural(value)) for (const [form, text] of Object.entries(value)) yield { key: `${key}.${form}`, en: en.other, text };
        } else if (typeof en === 'string') yield { key, en, text: value };
    }
}

const placeholders = (text) => [...String(text).matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map((m) => m[0]).sort();

// a figure as the English writes it: 9,240,028, 1,076.26, 18:25, §8.6.7, 2026, 5
const figures = (text) => [...new Set(String(text).match(/§?\d+(?:[.,:]\d+)*/g) || [])];

// the figure as a translation writes it: as the English does, but in a language of INTL_FIGURES (Spanish), whose
// numbers are Intl's for the page (9.240.028, 1076,26, 0,1); a section (§8.6.7), a time (18:25) and a whole number
// without separators (2026, 4294967297) read the same in every language
const written = (figure, lang) => {
    if (!INTL_FIGURES.includes(lang) || !/^(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+)$/.test(figure)) return figure;
    const decimals = (figure.split('.')[1] || '').length;
    return formatNumber(Number(figure.replace(/,/g, '')), lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// names every language keeps, wherever the English has them
const NAMES = ['SN25', 'Bittensor', 'STSettlement2', 'vault2', 'drand', 'Safe', 'Google Play', 'GiB', 'USDC', 'EVM', 'UID', 'ISO 3166-1', 'IPv4', 'IPv6', 'price.yml', 'WHITEPAPER.md', 'CAPTURETHEFLAG.md', 'α', 'UTC', '≈', 'Pro'];

// capture the flag's name in the apps (localizations store, sn_ctf_pool), as each language inflects it
const CTF_NAME = {
    ru: /захват\S* флага/i,
    ar: /الاستيلاء على العلم/,
    zh: /夺旗/,
    de: /Capture the Flag/,
    es: /Captura la bandera/i,
};

// gambling and lottery words, in every string (the draw is not a lottery); and,
// in capture the flag's own texts, the words SEO.md §2.3 keeps out of them
const GAMBLING = {
    ru: /лотере|джекпот|азарт|розыгрыш|казино|ставк[аиуе] на/i,
    ar: /يانصيب|اليانصيب|مقامر|رهان|ميسر|الجائزة الكبرى|قمار/,
    zh: /彩票|抽奖|博彩|赌|乐透|头奖|奖池/,
    de: /lotter|jackpot|verlos|gewinnspiel|glücksspiel|wette|tombola/i,
    es: /loter[ií]a|jackpot|apuesta|juego de azar|rifa|tómbola|quiniela/i,
};
const PROMISES = {
    ru: /гарант|доходност|инвест|пассивн\S* доход|зарплат|ваканс|разбогате/i,
    ar: /مضمون|ضمان|عائد|استثمار|دخل سلبي|راتب|وظيف|الثراء/,
    zh: /保证|担保|收益率|投资|被动收入|工资|薪|致富|稳赚/,
    // "Lohn" (wage) as a word: a reward is a Belohnung
    de: /garant|rendite|\binvest|passives einkommen|\bgehalt\b|\blohn|reich werden|stellenangebot/i,
    es: /garantiz|rentabilidad|inversi|ingreso pasivo|salario|sueldo|hacerse rico|empleo/i,
};
const CTF_KEYS = (key) => key.startsWith('notices.notice-capture-the-flag.') || key.startsWith('events.capture-the-flag-');
// the words of drawing lots, their verbs and kin, in every string: the draw is случайный отбор, الاختيار العشوائي,
// 随机选取, Zufallsauswahl or selección aleatoria, as on /ctf (pages/ctf/ctf-copy.test.mjs)
const DRAWING_LOTS = {
    ru: /жеребь|жреби|розыгр|разыгр/iu,
    ar: /قرع[ةت]|سحب/u,
    zh: /抽签|抽取|抽出|抽中|摇号/u,
    de: /auslos|ausgelost|losentscheid|losverfahren|(?<!\p{L})(?:ziehung|gezogen|lost)(?!\p{L})/iu,
    es: /sorte(?:o|a|á|ad|ar|e)/iu,
};

test('the English units load', () => {
    for (const unit of UNITS) assert.ok(english[unit].size > 0, `${unit || 'mainnet'}/en.js`);
});

test('each translation has the English keys, paragraphs and plural forms, and no others', () => {
    for (const t of translations) {
        const en = english[t.unit];
        for (const key of en.keys()) assert.ok(t.flat.has(key), `${t.name}: missing ${key}`);
        for (const key of t.flat.keys()) assert.ok(en.has(key), `${t.name}: ${key} is not in en.js`);
        for (const [key, value] of en) {
            if (!t.flat.has(key)) continue;
            const mine = t.flat.get(key);
            if (key.endsWith('#length')) assert.equal(mine, value, `${t.name}: ${key.replace('#length', '')} has ${mine} entries, English ${value}`);
            else if (isPlural(value)) {
                assert.ok(isPlural(mine), `${t.name}: ${key} is a plural node`);
                const needs = new Intl.PluralRules(intl(t.lang)).resolvedOptions().pluralCategories;
                for (const form of needs) assert.equal(typeof mine[form], 'string', `${t.name}: ${key} lacks its "${form}" form`);
            } else {
                assert.equal(typeof mine, typeof value, `${t.name}: ${key}`);
                if (typeof value === 'string') {
                    assert.ok(mine.trim().length > 0, `${t.name}: ${key} is empty`);
                    assert.equal(mine, mine.trim(), `${t.name}: ${key} has surrounding space`);
                } else assert.equal(mine, value, `${t.name}: ${key}`);
            }
        }
    }
});

test('every placeholder stays as the English has it', () => {
    for (const t of translations) {
        for (const { key, en, text } of pairs(t)) {
            assert.deepEqual(placeholders(text), placeholders(en), `${t.name}: ${key}: "${text}"`);
        }
    }
});

test('the figures and the names are the English\'s own, in Western digits', () => {
    for (const t of translations) {
        for (const { key, en, text } of pairs(t)) {
            assert.doesNotMatch(text, /[٠-٩۰-۹]/, `${t.name}: ${key} writes Arabic-Indic digits`);
            if (/^(dates|summary\.epochShort)/.test(key)) continue;
            for (const figure of figures(en)) {
                // a figure inside a word of the English (IPv4, SN25, vault2) is the name's
                const mine = written(figure, t.lang);
                const bare = new RegExp(`(^|[^\\d.,:])${mine.replace(/[.,]/g, '\\$&')}(?![\\d]|[.,:]\\d)`);
                assert.match(text, bare, `${t.name}: ${key} lacks ${mine}: "${text}"`);
            }
            for (const name of NAMES) {
                if (!en.includes(name)) continue;
                // "Pro" only as the plan's name, "Safe" only as the governance Safe
                if (name === 'Pro' && !/\bPro\b/.test(en)) continue;
                if (name === 'Safe' && !/governance Safe/.test(en)) continue;
                assert.ok(text.includes(name), `${t.name}: ${key} lacks "${name}": "${text}"`);
            }
        }
    }
});

test('capture the flag keeps the apps\' name, and no translation reads as a lottery, a drawing of lots, a bet or a promise', () => {
    for (const t of translations) {
        for (const { key, text } of pairs(t)) {
            assert.doesNotMatch(text, GAMBLING[t.lang], `${t.name}: ${key}: "${text}"`);
            assert.doesNotMatch(text, DRAWING_LOTS[t.lang], `${t.name}: ${key}: the draw is a random selection, not a drawing of lots: "${text}"`);
            if (CTF_KEYS(key)) assert.doesNotMatch(text, PROMISES[t.lang], `${t.name}: ${key}: "${text}"`);
        }
        if (t.unit === 'data') {
            const title = t.flat.get('notices.notice-capture-the-flag.title');
            assert.match(title, CTF_NAME[t.lang], `${t.name}: the capture the flag notice's title names it as the apps do: "${title}"`);
        }
        if (t.unit === 'timeline') {
            for (const [key, text] of t.flat) {
                if (/^events\.capture-the-flag-[a-z0-9-]+\.title$/.test(key)) assert.match(text, CTF_NAME[t.lang], `${t.name}: ${key}: "${text}"`);
            }
        }
    }
});
