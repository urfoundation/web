// What a translation of the investors group must keep from its English. The
// documents are signed or dated communications, so a translation may change
// the language and nothing else:
//
//   • shape: the same keys, the same array lengths, the same plural forms;
//   • markup: the same inline elements (<strong>…</strong>, <research>…</research>,
//     <br/>) and the same {placeholders} in every string;
//   • figures: every number the English states, and no number it does not
//     (written with the language's separators, or in 万 in Chinese; a month's
//     number in a written-out date is allowed);
//   • names that must not change: addresses, domains, the email address, the
//     protocols' and subnets' identifiers, and the tokens (alpha, α, TAO, $SN25);
//   • the page heads: titles within 60 graphemes ending " | UR", descriptions
//     within 175 characters, each unique within its language.
//
// investors.test.mjs runs this in the gates. From react/, while translating:
//   node src/i18n/pages/investors/translation-checks.mjs          (every language)
//   node src/i18n/pages/investors/translation-checks.mjs ru       (one)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const GROUP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 175;

/** Every copy unit of the group: its directory relative to the group ('' for the group's own). */
export function units(dir = GROUP_DIR, rel = '') {
    const found = fs.existsSync(path.join(dir, 'en.js')) ? [rel] : [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) found.push(...units(path.join(dir, entry.name), rel ? `${rel}/${entry.name}` : entry.name));
    }
    return found;
}

export async function loadUnit(unit, lang) {
    const file = path.join(GROUP_DIR, unit, `${lang}.js`);
    if (!fs.existsSync(file)) return null;
    return (await import(pathToFileURL(file).href)).default;
}

const isPlural = (v) => v && typeof v === 'object' && !Array.isArray(v) && 'other' in v && Object.keys(v).every((k) => PLURAL.has(k));

/** [keyPath, englishString, translatedValue] for every string of the English, and shape problems. */
function pairs(en, tr, at, out, problems) {
    if (typeof en === 'string') {
        if (typeof tr !== 'string') problems.push(`${at}: expected a string, found ${tr === undefined ? 'nothing' : typeof tr}`);
        else out.push([at, en, tr]);
        return;
    }
    if (Array.isArray(en)) {
        if (!Array.isArray(tr)) { problems.push(`${at}: expected an array of ${en.length}`); return; }
        if (tr.length !== en.length) problems.push(`${at}: ${tr.length} items, the English has ${en.length}`);
        en.forEach((v, i) => pairs(v, tr[i], `${at}.${i}`, out, problems));
        return;
    }
    if (en && typeof en === 'object') {
        if (!tr || typeof tr !== 'object' || Array.isArray(tr)) { problems.push(`${at || '(unit)'}: expected an object`); return; }
        if (isPlural(en)) {
            const want = Object.keys(en).sort().join(',');
            const have = Object.keys(tr).sort().join(',');
            if (want !== have) problems.push(`${at}: plural forms ${have}, the English has ${want}`);
        }
        for (const key of Object.keys(tr)) if (!(key in en)) problems.push(`${at ? `${at}.` : ''}${key}: not in the English`);
        for (const [key, v] of Object.entries(en)) pairs(v, tr[key], at ? `${at}.${key}` : key, out, problems);
        return;
    }
    if (tr !== en) problems.push(`${at}: ${JSON.stringify(en)} is not translated, keep it as it is`);
}

const sorted = (list) => [...list].sort().join(' ');
const tagsOf = (s) => sorted(s.match(/<\/?[a-z][a-z0-9]*\/?>/g) || []);
const placeholdersOf = (s) => sorted(new Set(s.match(/\{[A-Za-z][A-Za-z0-9]*\}/g) || []));

// A figure's signature: its digits without separators, decimal marks or
// trailing zeros, so 550,000 / 550.000 / 550 000 / 55万 all read 55 and
// 1.44 / 1,44 / 144万 read 144. The markup's tag names (<a16z>) are not text.
function figures(s) {
    const text = s.replace(/<\/?[a-z][a-z0-9]*\/?>/g, ' ').replace(/\{[A-Za-z][A-Za-z0-9]*\}/g, ' ');
    const found = new Set();
    for (const m of text.matchAll(/\d+(?:[.,    ]\d+)*/g)) {
        const signature = m[0].replace(/\D/g, '').replace(/0+$/, '');
        if (signature) found.add(signature);
    }
    return found;
}

// What must appear verbatim: the reserve's address, the email address,
// domains and repository paths, identifiers with a digit or a hyphen (SN25,
// UR-FP2, URTRANSPORT1, UR-MULTI, IPv4), and the tokens.
const VERBATIM = [
    /\b5[1-9A-HJ-NP-Za-km-z]{47}\b/g,
    /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
    /\b[\w-]+(?:\.[\w-]+)*\.(?:io|xyz|com|network|org)(?:\/[\w-]+)*/gi,
    /\b(?:[A-Z][A-Za-z]*\d[A-Za-z0-9]*|[A-Z]{2,}-[A-Z0-9]+)\b/g,
    /\$SN25|α|\bTAO\b/g,
];
function verbatimTokens(s) {
    const text = s.replace(/<\/?[a-z][a-z0-9]*\/?>/g, ' ');
    const found = new Set();
    for (const pattern of VERBATIM) for (const m of text.matchAll(pattern)) found.add(m[0].replace(/[.,;:]+$/, ''));
    return found;
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const graphemeCount = (s) => [...graphemes.segment(s)].length;

/** The page heads a unit's copy sets: [key, title, description]. */
function heads(unit, copy) {
    if (unit === '') {
        return Object.entries(copy.docs || {})
            .filter(([, doc]) => doc && doc.metaTitle)
            .map(([key, doc]) => [`docs.${key}`, doc.metaTitle, doc.metaDescription]);
    }
    if (copy.meta) return [['meta', copy.meta.title, copy.meta.description]];
    return [];
}

/** Every problem of `lang`'s translation of `unit`, as text; [] when it is right. */
export async function checkUnit(unit, lang) {
    const en = await loadUnit(unit, 'en');
    const tr = await loadUnit(unit, lang);
    const name = `${unit || 'investors'} (${lang})`;
    if (!tr) return [`${name}: no ${lang}.js`];
    const problems = [];
    const strings = [];
    pairs(en, tr, '', strings, problems);
    for (const [at, english, translated] of strings) {
        if (!translated.trim()) { problems.push(`${at}: empty`); continue; }
        if (tagsOf(english) !== tagsOf(translated)) problems.push(`${at}: markup ${tagsOf(translated) || '(none)'}, the English has ${tagsOf(english) || '(none)'}`);
        if (placeholdersOf(english) !== placeholdersOf(translated)) problems.push(`${at}: placeholders ${placeholdersOf(translated) || '(none)'}, the English has ${placeholdersOf(english) || '(none)'}`);
        const want = figures(english);
        const have = figures(translated);
        const dropped = [...want].filter((f) => !have.has(f));
        // a written-out date may give its month as a number (2026年1月8日)
        const added = [...have].filter((f) => !want.has(f) && !(Number(f) >= 1 && Number(f) <= 12));
        if (dropped.length) problems.push(`${at}: figures missing (digits ${dropped.join(', ')}): ${translated}`);
        if (added.length) problems.push(`${at}: figures the English does not state (digits ${added.join(', ')}): ${translated}`);
        for (const token of verbatimTokens(english)) {
            if (!translated.includes(token)) problems.push(`${at}: "${token}" must appear as it is: ${translated}`);
        }
        if (/\balpha\b/i.test(english) && !/alpha/i.test(translated)) problems.push(`${at}: the token alpha must be named "alpha": ${translated}`);
    }
    for (const [at, title, description] of heads(unit, tr)) {
        if (typeof title === 'string') {
            if (graphemeCount(title) > TITLE_MAX) problems.push(`${at}: title is ${graphemeCount(title)} graphemes (at most ${TITLE_MAX}): ${title}`);
            if (!title.endsWith(' | UR')) problems.push(`${at}: title must end " | UR": ${title}`);
        }
        if (typeof description === 'string' && description.length > DESCRIPTION_MAX) {
            problems.push(`${at}: description is ${description.length} characters (at most ${DESCRIPTION_MAX})`);
        }
    }
    return problems.map((p) => `${name} ${p}`);
}

/** Titles and descriptions repeated within one language across the group's pages. */
export async function checkUniqueHeads(lang) {
    const seen = { title: new Map(), description: new Map() };
    const problems = [];
    for (const unit of units()) {
        const copy = await loadUnit(unit, lang);
        if (!copy) continue;
        for (const [at, title, description] of heads(unit, copy)) {
            for (const [kind, value] of [['title', title], ['description', description]]) {
                if (typeof value !== 'string') continue;
                const where = `${unit || 'investors'}:${at}`;
                if (seen[kind].has(value)) problems.push(`${lang}: ${where} repeats the ${kind} of ${seen[kind].get(value)}: ${value}`);
                else seen[kind].set(value, where);
            }
        }
    }
    return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const langs = process.argv.slice(2).length ? process.argv.slice(2) : LANGS;
    let count = 0;
    for (const lang of langs) {
        for (const unit of units()) {
            for (const problem of await checkUnit(unit, lang)) { console.log(problem); count++; }
        }
        for (const problem of await checkUniqueHeads(lang)) { console.log(problem); count++; }
    }
    console.log(count ? `\n${count} problem(s)` : `translation checks: OK (${langs.join(', ')})`);
    process.exit(count ? 1 : 0);
}
