/**
 * The page groups' copy (react/src/i18n/pages/, react/src/i18n/README.md).
 *
 * A copy unit is a directory under pages/ holding en.js, the English, and
 * ru.js, ar.js, zh.js, de.js, es.js, its translations with the same keys. A
 * component module loads its unit once, at its top level, and reads it by
 * language while it renders:
 *
 *   const copy = await loadPageCopy('about');
 *   export default function AboutPage({ lang = 'en' }) { const t = copy(lang); … }
 *
 * What is loaded where:
 * - the Astro build (server render) and node (tests, scripts): every language;
 * - a static page in the browser: English and the page's own language (its
 *   <html lang>), each unit language its own chunk, so an island ships one
 *   translation, never all six;
 * - the React SPA (react/index.html, marked data-ur-spa; vite dev, which the
 *   visual-parity test reads): every language, since it switches in place.
 *
 * copy(lang) is the unit's strings in `lang`, with English in place of any
 * key the translation lacks. That is a safety net, not a rule to rely on:
 * tests/i18n-staleness.mjs fails a missing or stale translation, so a
 * localized group never ships one.
 */
import { SITE_LANG_CODES } from '../../../astro/src/lib/route-localization.js';

// Under Vite (the Astro build and the browser bundles) every unit language is
// a lazily imported module of its own; node has no import.meta.env and reads
// the files from disk instead.
const LAZY = typeof import.meta.env === 'object'
    ? import.meta.glob('./pages/**/{en,ru,ar,zh,de,es}.js', { import: 'default' })
    : null;
// a variable, not the literal import.meta.url, so Vite does not read the
// node branch's new URL(…) as an asset reference
const HERE = import.meta.url;

async function loadUnitLanguage(unit, lang) {
    if (LAZY) {
        const load = LAZY[`./pages/${unit}/${lang}.js`];
        return load ? load() : null;
    }
    try {
        return (await import(/* @vite-ignore */ new URL(`./pages/${unit}/${lang}.js`, HERE).href)).default;
    } catch (error) {
        if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
        throw error;
    }
}

/** The languages to load here (see above). */
function languagesHere() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return SITE_LANG_CODES;
    const root = document.documentElement;
    if (root.hasAttribute('data-ur-spa')) return SITE_LANG_CODES;
    const page = (root.lang || 'en').slice(0, 2).toLowerCase();
    return SITE_LANG_CODES.includes(page) && page !== 'en' ? ['en', page] : ['en'];
}

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/**
 * A plural node: an object whose keys are all CLDR plural categories and
 * include `other` ({ one, other } in English, { one, few, many, other } in
 * Russian). Each language carries the forms it needs (format.js plural()).
 */
export function isPluralNode(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
        && Object.prototype.hasOwnProperty.call(value, 'other')
        && Object.keys(value).every((key) => PLURAL_CATEGORIES.has(key));
}

/** `translation` over `english`, English filling every key the translation lacks. */
function overEnglish(english, translation) {
    if (typeof english === 'string') return typeof translation === 'string' ? translation : english;
    if (isPluralNode(english)) return isPluralNode(translation) ? translation : english;
    if (Array.isArray(english)) {
        return english.map((value, i) => overEnglish(value, Array.isArray(translation) ? translation[i] : undefined));
    }
    if (english && typeof english === 'object') {
        const out = {};
        for (const [key, value] of Object.entries(english)) {
            out[key] = overEnglish(value, translation && typeof translation === 'object' ? translation[key] : undefined);
        }
        return out;
    }
    // numbers and booleans are the English's own: a translation does not change them
    return english;
}

/**
 * copy(lang) over a unit's loaded languages ({ en, de, … }): the language's
 * strings with English in place of any key it lacks, or English for a
 * language not loaded.
 */
export function copyFromTable(unit, table) {
    if (!table.en) throw new Error(`page copy: no English for unit "${unit}" (react/src/i18n/pages/${unit}/en.js)`);
    const byLang = new Map();
    return (lang = 'en') => {
        const code = table[lang] ? lang : 'en';
        if (!byLang.has(code)) byLang.set(code, code === 'en' ? table.en : overEnglish(table.en, table[code]));
        return byLang.get(code);
    };
}

const loaded = new Map();

/**
 * Load a copy unit ('about', 'investors/letter', …: its directory under
 * pages/). Resolves to copy(lang), synchronous from then on.
 */
export function loadPageCopy(unit) {
    if (!loaded.has(unit)) {
        loaded.set(unit, (async () => {
            const table = {};
            await Promise.all(languagesHere().map(async (lang) => {
                const strings = await loadUnitLanguage(unit, lang);
                if (strings) table[lang] = strings;
            }));
            return copyFromTable(unit, table);
        })());
    }
    return loaded.get(unit);
}
