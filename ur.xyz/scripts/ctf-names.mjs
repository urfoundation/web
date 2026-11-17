#!/usr/bin/env node
// ctf-names.mjs — the country names the capture the flag pages print in each
// language: react/src/i18n/pages/ctf/names/<lang>.js, a copy unit beside the
// pages' copy (react/src/i18n/README.md), so a static page and its islands
// read the same names in every engine, and an island ships only its own
// language's.
//
// Each file holds, for every one of the snapshot's 249 codes:
//   name     the name a list shows: CLDR's (Intl.DisplayNames, this node's
//            ICU), or the site's own where it departs from CLDR (REGION_NAMES
//            in react/src/i18n/format.js: 香港, 澳门 and 台湾 in Chinese,
//            Rumania and Arabia Saudita in Spanish); in English the API's
//            name (react/src/data/ctf-epoch.json)
//   short    the name a title or the breadcrumb uses when the sentence's is
//            too long: CLDR's short style, or a shorter name written by hand
//   in       "in <country>" as the language says it inside a sentence
//            ("в Кении", "in der Schweiz", "en los Países Bajos"), by hand
//   inShort  the same with the short name, by hand
//   order    the codes in the language's A–Z of `name` (Intl.Collator), one
//            string, so the grid and a page's neighbours sort alike everywhere
// `name` and `order` follow CLDR and are rewritten by every run; `short`, `in`
// and `inShort` are kept as written (a code new to the snapshot starts from a
// plain rule a translator then corrects). English follows the snapshot
// (sentence_name: "in the DR Congo"). Run it after the snapshot's names
// change or node's ICU moves, review the diff, and record the translations
// (react: node tests/i18n-staleness.mjs --unit ctf/names --accept <lang>).
//
//   node scripts/ctf-names.mjs           write the six files
//   node scripts/ctf-names.mjs --check   exit 1 if a file is not what a run writes
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { REGION_NAMES, displayRegion } from '../react/src/i18n/format.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(ROOT, 'react/src/data/ctf-epoch.json');
const DIR = path.join(ROOT, 'react/src/i18n/pages/ctf/names');
export const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** English, from the snapshot: the pages' own names (ctf/model.js). */
function english(countries) {
    const out = { order: '', name: {}, short: {}, in: {}, inShort: {} };
    for (const c of countries) {
        const short = c.sentence_name.replace(/^the /, '');
        out.name[c.code] = c.name;
        out.short[c.code] = short;
        out.in[c.code] = `in ${c.sentence_name}`;
        out.inShort[c.code] = `in ${short}`;
    }
    // A–Z as the model sorts it: accents folded, then the code
    out.order = countries
        .map((c) => [fold(c.name), c.code])
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1))
        .map(([, code]) => code)
        .join(' ');
    return out;
}

// A first draft of "in <country>" for a code new to a language; a translator corrects it.
const DRAFT_IN = { ru: (n) => `в ${n}`, ar: (n) => `في ${n}`, zh: (n) => `在${n}`, de: (n) => `in ${n}`, es: (n) => `en ${n}` };

/** A translation: CLDR's names and order, and the hand-written forms kept from `previous`. */
function translated(lang, countries, previous) {
    const shortStyle = new Intl.DisplayNames([lang], { type: 'region', style: 'short' });
    const out = { order: '', name: {}, short: {}, in: {}, inShort: {} };
    for (const { code } of countries) {
        const name = displayRegion(code, lang);
        out.name[code] = name;
        out.short[code] = previous?.short?.[code] ?? REGION_NAMES[lang]?.[code.toUpperCase()] ?? shortStyle.of(code.toUpperCase());
        out.in[code] = previous?.in?.[code] ?? DRAFT_IN[lang](name);
        out.inShort[code] = previous?.inShort?.[code] ?? DRAFT_IN[lang](out.short[code]);
    }
    const collator = new Intl.Collator(lang);
    out.order = countries
        .map((c) => c.code)
        .sort((a, b) => collator.compare(out.name[a], out.name[b]) || (a < b ? -1 : 1))
        .join(' ');
    return out;
}

const HEADER = {
    en: '// The capture the flag pages\' country names in English, from the snapshot (react/src/data/ctf-epoch.json).',
    other: (lang) => `// The capture the flag pages' country names in ${new Intl.DisplayNames(['en'], { type: 'language' }).of(lang)}: \`name\` and \`order\` from CLDR ${process.versions.cldr}${REGION_NAMES[lang] ? ` (the site's own ${Object.keys(REGION_NAMES[lang]).map((code) => code.toLowerCase()).join(', ')}: REGION_NAMES in react/src/i18n/format.js)` : ''}, \`short\`, \`in\` and \`inShort\` by hand.`,
};

function source(lang, names) {
    const map = (key) => `    ${key}: {\n${Object.entries(names[key]).map(([code, v]) => `        ${code}: ${JSON.stringify(v)},`).join('\n')}\n    },`;
    return [
        lang === 'en' ? HEADER.en : HEADER.other(lang),
        '// Written by scripts/ctf-names.mjs, which keeps the hand-written forms; see it for what each holds.',
        'export default {',
        `    order: ${JSON.stringify(names.order)},`,
        map('name'),
        map('short'),
        map('in'),
        map('inShort'),
        '};',
        '',
    ].join('\n');
}

/** Every language's file as a run writes it: { lang: text }. */
export async function namesFiles() {
    const { countries } = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
    const out = {};
    for (const lang of LANGS) {
        const file = path.join(DIR, `${lang}.js`);
        const previous = existsSync(file) ? (await import(`${pathToFileURL(file).href}?t=${Date.now()}`)).default : null;
        out[lang] = source(lang, lang === 'en' ? english(countries) : translated(lang, countries, previous));
    }
    return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const files = await namesFiles();
    const check = process.argv.includes('--check');
    let stale = 0;
    for (const [lang, text] of Object.entries(files)) {
        const file = path.join(DIR, `${lang}.js`);
        const now = existsSync(file) ? readFileSync(file, 'utf8') : null;
        if (now === text) continue;
        if (check) {
            stale += 1;
            console.error(`ctf-names: ${path.relative(ROOT, file)} is not what scripts/ctf-names.mjs writes (the snapshot's names, or node's CLDR ${process.versions.cldr}, moved)`);
        } else {
            writeFileSync(file, text);
            console.log(`ctf-names: wrote ${path.relative(ROOT, file)}`);
        }
    }
    process.exit(stale ? 1 : 0);
}
