// English text on localized pages — a guard against copy that never reached
// the dictionaries.
//
// Every translated page (/<lang>/…: the home page, the sections, and every page
// of a localized page group, react/src/i18n/pages/) is compared with its
// English twin in the BUILT output. Text a visitor meets on the localized page (text nodes, SVG
// labels, the <title>, and the accessible names in aria-label / alt / title /
// placeholder) is split into sentences, and a sentence fails the page when it
// is English that the translation should have replaced:
//
//   • prose leak: the sentence appears verbatim on the English twin and reads
//     as English prose (it carries a lowercase word, so it is not a bare brand
//     or code name like "Bittensor", "MASA L2 2025" or "transport.go");
//   • label leak: the sentence equals an English dictionary value that this
//     language translates differently everywhere it occurs, e.g. a hard-coded
//     "Operators" on a German page whose dictionary says "Betreiber". A page
//     group's page is held to its group's copy units as well as to the site
//     dictionaries.
//
// Text marked translate="no" (code: commands, flags, error strings, which are
// the same in every language by design) is not compared, and only code, pre,
// kbd and samp may carry that mark, so it cannot hide prose.
//
// It also asserts <html lang> matches the page language, that no localized
// page carries NUL bytes (streamed React SSR once split a multibyte character
// across its flush boundary and left \0 in the zh and ar pages), and that no
// dictionary placeholder ({code}, {date}, …) reaches the visible text of a
// translated page or its English twin unreplaced.
//
// Usage: node tests/localized-english-text.mjs [buildDir]
//        (default ../astro/build/$UR_ENV, UR_ENV defaulting to main)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    LOCALIZED_GROUPS,
    NON_EN_SITE_LANG_CODES,
    NOT_FOUND_PATH,
    PAGE_GROUPS,
    groupForPath,
    hasLocalizedVersion,
} from '../../astro/src/lib/route-localization.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UR_ENV = process.env.UR_ENV || 'main';
const BUILD = path.resolve(process.argv[2] || path.join(__dirname, '../../astro/build', UR_ENV));
const I18N = path.join(__dirname, '../src/i18n');

// Sentences deliberately left in English in every language. Keep this short:
// each entry is a decision, not a convenience. A page group lists its own in
// its group.js (`allowEnglish`), and they hold for its pages only.
const ALLOWED_ENGLISH = new Set([
    // the paper's published title (research.publications.items[0].title)
    'Whole Internet Encryption for the whole world',
]);
const PAGES_DIR = path.join(I18N, 'pages');

// Accessible text a visitor meets without it being a text node.
const TEXT_ATTRIBUTES = ['aria-label', 'alt', 'title', 'placeholder', 'aria-description', 'aria-roledescription'];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(text) {
    return text.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, body) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1));
            return String.fromCodePoint(code);
        }
        return ENTITIES[body.toLowerCase()] ?? entity;
    });
}

const normalize = (text) => decode(text).replace(/[\s ]+/g, ' ').trim();

// Sentence split: after terminal punctuation (Latin, CJK, Arabic) + space, or
// right after CJK terminal punctuation, which takes no space.
function sentences(text) {
    return text
        .split(/(?<=[.!?؟])\s+|(?<=[。！？])/u)
        .map((s) => s.trim())
        .filter(Boolean);
}

// An element marked translate="no": its text and attributes are the same in
// every language by design (code), so the comparison skips them.
const TRANSLATE_NO = /<([a-z][a-z0-9-]*)\b[^>]*\stranslate="no"[^>]*>/gi;
// the elements that may carry the mark: code and its kin, never prose
const TRANSLATE_NO_ELEMENTS = new Set(['code', 'pre', 'kbd', 'samp']);
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** The elements of a page marked translate="no" other than code, pre, kbd and samp, by tag name. */
export function misplacedTranslateNo(html) {
    return [...html.matchAll(TRANSLATE_NO)].map((m) => m[1].toLowerCase()).filter((name) => !TRANSLATE_NO_ELEMENTS.has(name));
}

/**
 * The HTML without each element marked translate="no", with all it holds (its
 * own kind nested inside it included). Each leaves a tag in its place, so the
 * text on either side stays two fragments, as it was around the element.
 */
export function withoutTranslateNo(html) {
    let out = '';
    let from = 0;
    TRANSLATE_NO.lastIndex = 0;
    let open = TRANSLATE_NO.exec(html);
    while (open) {
        const name = open[1];
        const end = open.index + open[0].length;
        let to = end;
        if (!VOID_ELEMENTS.has(name.toLowerCase()) && !/\/>$/.test(open[0])) {
            const tags = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
            tags.lastIndex = end;
            let depth = 1;
            while (depth > 0) {
                const tag = tags.exec(html);
                if (!tag) break;
                depth += tag[1] ? -1 : 1;
            }
            to = depth > 0 ? html.length : tags.lastIndex;
        }
        out += `${html.slice(from, open.index)}<translate-no>`;
        from = to;
        TRANSLATE_NO.lastIndex = from;
        open = TRANSLATE_NO.exec(html);
    }
    return out + html.slice(from);
}

/** The text a visitor meets on a built page, as { source, text } sentences. */
export function pageText(html) {
    const title = normalize((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const body = withoutTranslateNo(html
        .replace(/<head\b[\s\S]*?<\/head>/i, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' '));

    const out = [];
    if (title) for (const s of sentences(title)) out.push({ source: '<title>', text: s });
    for (const tag of body.matchAll(/<[a-z][^>]*>/gi)) {
        for (const attribute of tag[0].matchAll(/\s([a-z-]+)="([^"]*)"/gi)) {
            if (!TEXT_ATTRIBUTES.includes(attribute[1].toLowerCase())) continue;
            const text = normalize(attribute[2]);
            if (text) for (const s of sentences(text)) out.push({ source: `@${attribute[1]}`, text: s });
        }
    }
    // Every tag is a boundary: an inline link inside a sentence yields its own
    // fragment, which is still compared.
    for (const chunk of body.split(/<[^>]*>/)) {
        const text = normalize(chunk);
        if (text) for (const s of sentences(text)) out.push({ source: 'text', text: s });
    }
    return out;
}

function flatten(value, prefix = '', out = new Map()) {
    if (typeof value === 'string') out.set(prefix, value);
    else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
    else if (value && typeof value === 'object') {
        for (const [key, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
}

async function dictionary(code) {
    return flatten((await import(path.join(I18N, `${code}.js`))).default);
}

/** A page group's copy units (directories holding an en.js), by path under pages/. */
function groupUnits(group, dir = path.join(PAGES_DIR, group), out = []) {
    if (!fs.existsSync(dir)) return out;
    if (fs.existsSync(path.join(dir, 'en.js'))) out.push(path.relative(PAGES_DIR, dir).split(path.sep).join('/'));
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) groupUnits(group, path.join(dir, e.name), out);
    return out;
}

/** A page group's copy in one language, every unit's keys prefixed by its unit. */
async function groupDictionary(group, code) {
    const out = new Map();
    for (const unit of groupUnits(group)) {
        const file = path.join(PAGES_DIR, unit, `${code}.js`);
        if (!fs.existsSync(file)) continue;
        for (const [key, value] of flatten((await import(pathToFileURL(file).href)).default)) out.set(`${unit}:${key}`, value);
    }
    return out;
}

// "reads as English prose": a whitespace-delimited all-lowercase ASCII word.
// A dot inside a token (llms.txt, ur.io, transport.go) makes it a name, not a
// word, so trailing punctuation only counts when a space or the end follows.
const PROSE_WORD = /(?:^|[\s(“"'])[a-z]{2,}(?=$|[\s)”"']|[,.;:!?](?:$|\s))/;

/**
 * A translated page's English (see the top): each sentence that is prose of
 * its English twin, or an English dictionary value this language translates
 * differently wherever it occurs, as { source, text, why }. `english` is the
 * twin's sentences; `keysOf` maps an English value to its dictionary keys and
 * `translations` a key to this language's value.
 */
export function englishOnPage(html, english, { allowed = new Set(), keysOf = new Map(), translations = new Map() } = {}) {
    const out = [];
    const seen = new Set();
    for (const { source, text } of pageText(html)) {
        const id = `${source}\u0000${text}`;
        if (seen.has(id) || allowed.has(text)) continue;
        seen.add(id);
        const prose = english.has(text) && PROSE_WORD.test(text);
        const keys = keysOf.get(text);
        const label = keys && keys.every((key) => translations.has(key) && translations.get(key) !== text);
        if (prose || label) out.push({ source, text, why: label ? `English for ${keys.join(', ')}` : 'identical to the English page' });
    }
    return out;
}

const fileFor = (lang, base) => {
    if (lang === 'en') return base === '/' ? 'index.html' : `${base.slice(1)}.html`;
    return base === '/' ? `${lang}.html` : `${lang}${base}.html`;
};

const isRedirectStub = (html) => /<meta http-equiv="refresh"/i.test(html.slice(0, html.indexOf('</head>') + 1 || undefined));

/**
 * The English pages that have translations in this build, by public path: the
 * home page, the sections and the localized groups' pages (their families
 * found on disk), and the not-found page once its group is localized.
 */
function translatedEnglishPages() {
    const out = [];
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            const rel = path.relative(BUILD, abs).split(path.sep).join('/');
            if (e.isDirectory()) {
                if (!NON_EN_SITE_LANG_CODES.includes(rel) && rel !== '_astro') walk(abs);
            } else if (e.name.endsWith('.html')) {
                const base = rel === 'index.html' ? '/' : `/${rel.replace(/\.html$/, '')}`;
                if (NON_EN_SITE_LANG_CODES.includes(base.slice(1))) continue; // /de.html is German's home
                const notFound = base === NOT_FOUND_PATH && LOCALIZED_GROUPS.includes('not-found');
                if ((hasLocalizedVersion(base) || notFound) && !isRedirectStub(fs.readFileSync(abs, 'utf8'))) out.push(base);
            }
        }
    };
    walk(BUILD);
    return out.sort();
}

async function main() {
    if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
        console.error(`localized-english-text: no build at ${BUILD}`);
        process.exit(2);
    }

    const en = await dictionary('en');
    const enValueKeys = new Map();
    for (const [key, value] of en) {
        if (!enValueKeys.has(value)) enValueKeys.set(value, []);
        enValueKeys.get(value).push(key);
    }

    const failures = [];
    // an unreplaced dictionary placeholder in visible text, e.g. "{code}"
    const placeholders = (route, html) => {
        for (const { source, text } of pageText(html)) {
            for (const token of text.match(/\{[a-z][A-Za-z]*\}/g) || []) {
                failures.push(`/${route} ${source}: placeholder ${token} left in "${text}"`);
            }
        }
    };
    // translate="no" exempts code only: on any other element it would hide prose
    const marks = (route, html) => {
        for (const name of misplacedTranslateNo(html)) {
            failures.push(`/${route}: translate="no" on a <${name}>; only code, pre, kbd and samp may carry it`);
        }
    };
    const englishPages = translatedEnglishPages();
    const englishText = new Map();
    for (const base of englishPages) {
        const twinFile = path.join(BUILD, fileFor('en', base));
        const html = fs.readFileSync(twinFile, 'utf8');
        placeholders(base === '/' ? '' : base.slice(1), html);
        marks(base === '/' ? '' : base.slice(1), html);
        englishText.set(base, new Set(pageText(html).map((s) => s.text)));
    }

    // English values → their keys, in the site dictionaries and in each group's copy
    const valueKeys = (entries) => {
        const out = new Map();
        for (const [key, value] of entries) {
            if (!out.has(value)) out.set(value, []);
            out.get(value).push(key);
        }
        return out;
    };
    const groupsOnPages = [...new Set(englishPages.map((base) => groupForPath(base)).filter(Boolean))];
    const groupEnglish = new Map();
    for (const group of groupsOnPages) groupEnglish.set(group, valueKeys([...en, ...(await groupDictionary(group, 'en'))]));

    let pagesChecked = 0;
    for (const lang of NON_EN_SITE_LANG_CODES) {
        const dict = await dictionary(lang);
        const groupDicts = new Map();
        for (const group of groupsOnPages) groupDicts.set(group, new Map([...dict, ...(await groupDictionary(group, lang))]));
        for (const base of englishPages) {
            const group = groupForPath(base);
            const pageFile = path.join(BUILD, fileFor(lang, base));
            const route = lang + (base === '/' ? '' : base);
            if (!fs.existsSync(pageFile)) {
                failures.push(`/${route}: not built (${path.relative(BUILD, pageFile)})`);
                continue;
            }
            const raw = fs.readFileSync(pageFile);
            if (raw.includes(0)) failures.push(`/${route}: contains NUL bytes`);
            const html = raw.toString('utf8');
            const htmlLang = (html.match(/<html[^>]*\slang="([^"]*)"/i) || [])[1];
            if (htmlLang !== lang) failures.push(`/${route}: <html lang="${htmlLang}">, expected "${lang}"`);
            placeholders(route, html);
            marks(route, html);

            const found = englishOnPage(html, englishText.get(base), {
                allowed: new Set([...ALLOWED_ENGLISH, ...((group && PAGE_GROUPS[group].allowEnglish) || [])]),
                keysOf: group ? groupEnglish.get(group) : enValueKeys,
                translations: group ? groupDicts.get(group) : dict,
            });
            for (const { source, text, why } of found) failures.push(`/${route} ${source}: "${text}" (${why})`);
            pagesChecked += 1;
        }
    }

    console.log(`localized-english-text: ${pagesChecked} localized pages compared with their English twins (${BUILD})`);
    if (failures.length) {
        console.error(`\n${failures.length} problem(s): English text or placeholders on the translated pages:`);
        for (const failure of failures) console.error(`  ${failure}`);
        process.exit(1);
    }
    console.log('localized-english-text: OK');
}

// a gate when run, a library when a test imports it
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(`localized-english-text: ${error.stack || error.message}`);
        process.exit(1);
    });
}
