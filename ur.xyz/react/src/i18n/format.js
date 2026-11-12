/**
 * Locale-aware formatting for the site's pages, by page language. Figures and
 * dates follow the page, never the browser: a static page is rendered at build
 * time and hydrated in the visitor's browser, and both must print the same.
 * So dates are in UTC unless a caller passes a timeZone, and Arabic keeps
 * Western digits (intlLocale). Pure and node-safe: tests and build scripts use
 * it as the pages do. The Intl objects are cached by locale and options.
 */
import { intlLocale } from './locale.js';

export { intlLocale };

const cache = new Map();
function cached(Kind, lang, options) {
    const key = `${Kind.name}\u0000${intlLocale(lang)}\u0000${JSON.stringify(options || {})}`;
    if (!cache.has(key)) cache.set(key, new Kind(intlLocale(lang), options));
    return cache.get(key);
}

/** 1234.5 → "1,234.5" (en), "1.234,5" (de), "1 234,5" (ru), "1,234.5" (ar, Western digits). */
export function formatNumber(value, lang, options) {
    return cached(Intl.NumberFormat, lang, options).format(value);
}

/** A fraction as a percentage: 0.125 → "12.5%" (en), "12,5 %" (de). */
export function formatPercent(fraction, lang, options = {}) {
    return cached(Intl.NumberFormat, lang, { style: 'percent', maximumFractionDigits: 1, ...options }).format(fraction);
}

/**
 * A US dollar amount through Intl's currency format, `options` as Intl takes
 * them: 1.97 → "1,97 $" (de), "US$1.97" (zh). Spanish names the dollar US$
 * before the figure, "US$1,97" and "US$1,35 M", the pattern of its prose
 * ("US$134 millones"), since a bare $ also means pesos where Spanish is read
 * (the owner's style decision of 2026-11-12); its digits are Intl's.
 */
export function formatUsd(value, lang, options = {}) {
    const format = cached(Intl.NumberFormat, lang, { style: 'currency', currency: 'USD', ...options });
    if (lang !== 'es') return format.format(value);
    // the figure without Intl's symbol and the space beside it, its sign before US$
    const parts = format.formatToParts(value).filter((part) => part.type !== 'currency');
    while (parts.length && parts[0].type === 'literal') parts.shift();
    while (parts.length && parts[parts.length - 1].type === 'literal') parts.pop();
    const sign = parts[0]?.type === 'minusSign' || parts[0]?.type === 'plusSign' ? parts.shift().value : '';
    return `${sign}US$${parts.map((part) => part.value).join('')}`;
}

/** A Date, epoch milliseconds, or an ISO day ('2026-11-27', read as UTC). */
function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00Z`);
    return new Date(value);
}

/**
 * A day or a moment in the page's language, in UTC unless options.timeZone
 * says otherwise: formatDate('2026-11-27', 'de') → "27. November 2026".
 */
export function formatDate(value, lang, options = { year: 'numeric', month: 'long', day: 'numeric' }) {
    return cached(Intl.DateTimeFormat, lang, { timeZone: 'UTC', ...options }).format(toDate(value));
}

/** ['a', 'b', 'c'] → "a, b, and c" (en), "a, b и c" (ru), "a、b和c" (zh). */
export function formatList(items, lang, options = { type: 'conjunction' }) {
    return cached(Intl.ListFormat, lang, options).format(items.map(String));
}

/** The CLDR plural category of `count` in `lang`: zero, one, two, few, many or other. */
export function pluralCategory(lang, count, options) {
    return cached(Intl.PluralRules, lang, options).select(count);
}

/**
 * The form of a plural node for `count` ({ one, few, many, other }, with the
 * categories the language needs; page-copy.js isPluralNode), falling back to
 * `other`. Fill its {count} with interpolate.
 */
export function plural(lang, count, forms) {
    return forms[pluralCategory(lang, count)] ?? forms.other;
}

/**
 * Fill {name} placeholders from `values`. An unknown placeholder is left as it
 * is, which tests/localized-english-text.mjs then reports on the built page.
 */
export function interpolate(template, values = {}) {
    return String(template).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (whole, name) =>
        (Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole));
}

/**
 * The places the site names otherwise than CLDR does, by page language and
 * code (the owner's style decisions of 2026-11-12):
 *   zh  Hong Kong, Macao and Taiwan are 香港, 澳门 and 台湾, the English site's
 *       short names, in every form: never CLDR's 中国香港特别行政区 or
 *       中国澳门特别行政区, and never a 中国… prefix;
 *   ru  Hong Kong and Macao are Гонконг and Макао, and
 *   de  Hongkong and Macau, the short names, as the English site's: never
 *       CLDR's Гонконг (САР) or Sonderverwaltungsregion Hongkong;
 *   es  the Latin American name where CLDR's Spanish is Spain's, as Latin
 *       American CLDR (es-419) writes it (Rumania, Arabia Saudita, Costa de
 *       Marfil, Timor Oriental, Islas Åland, República del Congo, Islas
 *       Georgia del Sur y Sándwich del Sur), as every Spanish page is neutral
 *       Latin American.
 */
export const REGION_NAMES = Object.freeze({
    zh: Object.freeze({ HK: '香港', MO: '澳门', TW: '台湾' }),
    ru: Object.freeze({ HK: 'Гонконг', MO: 'Макао' }),
    de: Object.freeze({ HK: 'Hongkong', MO: 'Macau' }),
    es: Object.freeze({
        RO: 'Rumania',
        SA: 'Arabia Saudita',
        CI: 'Costa de Marfil',
        TL: 'Timor Oriental',
        AX: 'Islas Åland',
        CG: 'República del Congo',
        GS: 'Islas Georgia del Sur y Sándwich del Sur',
    }),
});

/**
 * A country or territory's name in the page's language, from its ISO 3166-1
 * alpha-2 code: displayRegion('ke', 'de') → "Kenia" (REGION_NAMES where the
 * site departs from CLDR). ICU versions differ between node and browsers, so
 * compute names at build time and pass them to an island rather than calling
 * this in a hydrating render.
 */
export function displayRegion(code, lang) {
    const upper = String(code).toUpperCase();
    return REGION_NAMES[lang]?.[upper] ?? cached(Intl.DisplayNames, lang, { type: 'region' }).of(upper);
}
