// Translation staleness check for ur.xyz: the site dictionaries and the page
// groups' copy units.
//
// English is the canonical copy and every translation mirrors it key for key:
//
//   • the site dictionaries: src/i18n/en.js, mirrored by ru/ar/zh/de/es.js, with
//     their record in src/i18n/source-hashes.json;
//   • each copy unit of a page group: a directory under src/i18n/pages/ holding
//     an en.js (src/i18n/README.md), mirrored by the <lang>.js beside it, with
//     its record in the source-hashes.json beside it.
//
// A translation goes stale silently when the English under it changes (the
// research competition copy kept "by the end of the month with the 25 launch"
// in five languages long after English moved on). So every translated key
// records the hash of the English it was translated from, and this check fails
// when:
//
//   • a key exists in English but not in a translation, or the reverse;
//   • English changed after the translation was made (the recorded hash no
//     longer matches the current English);
//   • a translated key has no recorded source at all (a new key);
//   • a translation changes a number or a boolean of the English (figures are
//     the English's own; only text is translated);
//   • a copy unit's group is localized (its group.js says localized: true) and
//     one of its five translations is missing. A unit of a group not yet
//     localized may lack translations (work in progress), but every
//     translation it has is checked.
//
// A plural node, an object whose keys are all CLDR plural categories and
// include `other` ({ one, other }), is one entry: each language carries the
// forms it needs (src/i18n/format.js plural()).
//
// After updating a translation to the current English, record it:
//
//   node tests/i18n-staleness.mjs --accept de miners.intro nav.tagline         (site dictionaries)
//   node tests/i18n-staleness.mjs --accept de                                  (every key of de, after a full review)
//   node tests/i18n-staleness.mjs --accept all                                 (every key of every language: seeding)
//   node tests/i18n-staleness.mjs --unit about --accept de                     (a copy unit, by its directory under pages/)
//   node tests/i18n-staleness.mjs --unit investors/letter --accept ru title    (one key of a unit)
//   node tests/i18n-staleness.mjs --unit about                                 (check one unit)
//
// Usage: node tests/i18n-staleness.mjs [--unit <unit>] [--accept <lang|all> [key ...]]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PAGE_GROUPS } from '../../astro/src/lib/route-localization.js';
import { isPluralNode } from '../src/i18n/page-copy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.join(__dirname, '../src/i18n');
const PAGES = path.join(I18N, 'pages');
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const STORE_ABOUT = 'sha256 (first 12 hex) of the English each translation was made from, per language and key. '
    + 'Checked by tests/i18n-staleness.mjs; after updating a translation run '
    + '`node tests/i18n-staleness.mjs --accept <lang> <key> ...` (from react/).';

function flatten(value, prefix = '', out = new Map()) {
    if (isPluralNode(value)) out.set(prefix, value);
    else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
    else if (value && typeof value === 'object') {
        for (const [key, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${key}` : key, out);
    } else out.set(prefix, value);
    return out;
}

const hash = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
// a plural node's record is the hash of its forms, in category order
const sourceOf = (value) => (typeof value === 'string'
    ? value
    : JSON.stringify(Object.keys(value).sort().map((key) => [key, value[key]])));
const translatable = (value) => typeof value === 'string' || isPluralNode(value);

/** The copy units: every directory under pages/ that holds an en.js, by its path under pages/. */
function copyUnits(dir = PAGES, out = []) {
    if (!fs.existsSync(dir)) return out;
    if (fs.existsSync(path.join(dir, 'en.js'))) out.push(path.relative(PAGES, dir).split(path.sep).join('/'));
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory() && !e.name.startsWith('.')) copyUnits(path.join(dir, e.name), out);
    }
    return out.sort();
}

/** A set of translations: the site dictionaries, or one copy unit. */
function target(unit) {
    if (unit === null) {
        return { name: 'site dictionaries', dir: I18N, store: path.join(I18N, 'source-hashes.json'), required: true, about: STORE_ABOUT };
    }
    const dir = path.join(PAGES, unit);
    const group = unit.split('/')[0];
    return {
        name: `unit ${unit}`,
        unit,
        dir,
        store: path.join(dir, 'source-hashes.json'),
        group,
        required: PAGE_GROUPS[group]?.localized === true,
        about: STORE_ABOUT.replace('--accept <lang>', `--unit ${unit} --accept <lang>`),
    };
}

async function dictionary(dir, code) {
    const file = path.join(dir, `${code}.js`);
    if (!fs.existsSync(file)) return null;
    return flatten((await import(pathToFileURL(file).href)).default);
}

function readStore(t) {
    if (!fs.existsSync(t.store)) return {};
    return JSON.parse(fs.readFileSync(t.store, 'utf8'));
}

function writeStore(t, store, langs) {
    const out = { about: t.about };
    for (const lang of langs) {
        const entries = Object.entries(store[lang] || {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        out[lang] = Object.fromEntries(entries);
    }
    fs.writeFileSync(t.store, `${JSON.stringify(out, null, 2)}\n`);
}

async function accept(t, langArg, keys) {
    const en = await dictionary(t.dir, 'en');
    const english = new Map([...en].filter(([, value]) => translatable(value)));
    const langs = langArg === 'all' ? LANGS : [langArg];
    if (!langArg || langs.some((lang) => !LANGS.includes(lang))) {
        console.error(`i18n-staleness: --accept takes one of ${LANGS.join(', ')} or all`);
        process.exit(2);
    }
    for (const key of keys) {
        if (!english.has(key)) {
            console.error(`i18n-staleness: ${key} is not an English string key of the ${t.name}`);
            process.exit(2);
        }
    }
    const store = readStore(t);
    const present = [];
    for (const lang of LANGS) if (fs.existsSync(path.join(t.dir, `${lang}.js`))) present.push(lang);
    for (const lang of langs) {
        if (!present.includes(lang)) {
            if (langArg !== 'all') {
                console.error(`i18n-staleness: the ${t.name} has no ${lang}.js`);
                process.exit(2);
            }
            continue;
        }
        const recorded = store[lang] || {};
        for (const key of keys.length ? keys : english.keys()) recorded[key] = hash(sourceOf(english.get(key)));
        // drop keys English no longer has
        for (const key of Object.keys(recorded)) if (!english.has(key)) delete recorded[key];
        store[lang] = recorded;
    }
    // the site record always lists every language; a unit's, the translations it has
    writeStore(t, store, t.unit ? present : LANGS);
    const done = langs.filter((lang) => present.includes(lang));
    console.log(`i18n-staleness: recorded ${keys.length || english.size} key(s) for ${done.join(', ') || 'no language'} (${t.name})`);
}

async function check(t, problems) {
    const en = await dictionary(t.dir, 'en');
    const english = new Map([...en].filter(([, value]) => translatable(value)));
    const store = readStore(t);
    const label = t.unit ? `${t.unit}: ` : '';
    const acceptCommand = t.unit ? `node tests/i18n-staleness.mjs --unit ${t.unit} --accept` : 'node tests/i18n-staleness.mjs --accept';
    let translations = 0;
    for (const lang of LANGS) {
        const dict = await dictionary(t.dir, lang);
        const recorded = store[lang] || {};
        if (!dict) {
            if (t.required) problems.push(`${label}${lang}.js is missing, and group ${t.group} is localized`);
            if (Object.keys(recorded).length) problems.push(`${label}source-hashes.json records ${lang}, which has no ${lang}.js`);
            continue;
        }
        translations += 1;
        const file = `${lang}.js`;
        const stale = [];
        for (const key of en.keys()) if (!dict.has(key)) problems.push(`${label}${lang}: missing ${key} (in en.js)`);
        for (const key of dict.keys()) if (!en.has(key)) problems.push(`${label}${lang}: ${key} is not in en.js`);
        for (const [key, value] of en) {
            if (!dict.has(key) || translatable(value)) continue;
            if (dict.get(key) !== value) problems.push(`${label}${lang}: ${key} is ${JSON.stringify(dict.get(key))} in ${file}, ${JSON.stringify(value)} in en.js (only text is translated)`);
        }
        for (const [key, value] of english) {
            if (!dict.has(key)) continue;
            if (isPluralNode(value) && !isPluralNode(dict.get(key))) {
                problems.push(`${label}${lang}: ${key} is a plural node in en.js but not in ${file}`);
                continue;
            }
            if (!(key in recorded)) {
                problems.push(`${label}${lang}: ${key} has no recorded English source (new key?)`);
                stale.push(key);
            } else if (recorded[key] !== hash(sourceOf(value))) {
                problems.push(`${label}${lang}: ${key} is stale: English changed after it was translated`);
                stale.push(key);
            }
        }
        for (const key of Object.keys(recorded)) {
            if (!english.has(key)) problems.push(`${label}${lang}: source-hashes.json records ${key}, which en.js no longer has`);
        }
        if (stale.length) {
            problems.push(`  → once ${t.unit ? `${t.unit}/` : ''}${lang}.js matches the current English: ${acceptCommand} ${lang} ${stale.join(' ')}`);
        }
    }
    return { strings: english.size, translations };
}

async function main() {
    const args = process.argv.slice(2);
    const unitAt = args.indexOf('--unit');
    const unitArg = unitAt === -1 ? null : args[unitAt + 1];
    const units = copyUnits();
    if (unitAt !== -1 && !units.includes(unitArg)) {
        console.error(`i18n-staleness: no copy unit "${unitArg}" (a directory under src/i18n/pages/ holding an en.js): ${units.join(', ') || 'none yet'}`);
        process.exit(2);
    }

    const acceptAt = args.indexOf('--accept');
    if (acceptAt !== -1) {
        const rest = args.slice(acceptAt + 1);
        const stop = rest.indexOf('--unit');
        const [langArg, ...keys] = stop === -1 ? rest : rest.slice(0, stop);
        await accept(target(unitArg), langArg, keys);
        return;
    }

    const problems = [];
    const summary = [];
    // every directory under pages/ belongs to a group of route-localization.js,
    // and no translation sits in a directory without its English
    if (unitAt === -1 && fs.existsSync(PAGES)) {
        for (const e of fs.readdirSync(PAGES, { withFileTypes: true })) {
            if (!e.isDirectory()) continue;
            if (!PAGE_GROUPS[e.name]) problems.push(`pages/${e.name}: no such page group (astro/src/lib/route-localization.js PAGE_GROUPS)`);
            else if (!fs.existsSync(path.join(PAGES, e.name, 'group.js'))) problems.push(`pages/${e.name}: no group.js`);
        }
        const orphans = (dir) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, e.name);
                if (e.isDirectory()) orphans(p);
                else if (LANGS.includes(e.name.replace(/\.js$/, '')) && e.name.endsWith('.js') && !fs.existsSync(path.join(dir, 'en.js'))) {
                    problems.push(`pages/${path.relative(PAGES, p)}: a translation with no en.js beside it`);
                }
            }
        };
        orphans(PAGES);
    }
    if (unitAt === -1) {
        const site = await check(target(null), problems);
        summary.push(`${site.strings} English strings, ${site.translations} translations`);
    }
    let unitStrings = 0;
    let unitTranslations = 0;
    for (const unit of unitAt === -1 ? units : [unitArg]) {
        const result = await check(target(unit), problems);
        unitStrings += result.strings;
        unitTranslations += result.translations;
    }
    summary.push(`${unitAt === -1 ? units.length : 1} copy unit(s): ${unitStrings} English strings, ${unitTranslations} translations`);

    if (problems.length) {
        console.error(`i18n-staleness: ${problems.filter((p) => !p.startsWith('  →')).length} problem(s)`);
        for (const problem of problems) console.error(`  ${problem}`);
        process.exit(1);
    }
    console.log(`i18n-staleness: ${summary.join('; ')}, all current`);
}

main().catch((error) => {
    console.error(`i18n-staleness: ${error.stack || error.message}`);
    process.exit(1);
});
