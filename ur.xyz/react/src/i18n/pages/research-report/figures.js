/**
 * The figures of the research pages' copy, in each language's number format.
 *
 * The English copy quotes the report's figures as the report writes them
 * (3,967.8 ms, 0.25 Mbps, 4.73×). A translation states the same figures,
 * exactly, written as its language writes numbers: German and Spanish 3.967,8
 * and 0,25, Russian 3 967,8 (a no-break space between groups); Chinese and
 * Arabic, with Western digits, as English. Nothing is rounded, added or
 * dropped, and units, dates and commit ids are not touched.
 *
 *   localizeFigures(text, lang)  English-written figures → the language's format
 *                                (what a translator writes figures as is the
 *                                English; this formats them, once, for the copy)
 *   figuresOf(text, lang)        the figures a string states, normalized, for
 *                                checking that a translation's are the English's
 *                                (figures.test.mjs)
 *
 * A figure is a number with a decimal or a thousands separator, outside
 * <code>. Whole numbers without one (2026, 128, 40) read the same in every
 * language and are left as they are; "1,1" (two counts) is not a figure, it is
 * not grouped by threes.
 */
import { formatNumber } from '../../format.js';

// a figure as English writes it: grouped by threes with commas, with or without decimals; or with decimals only;
// or a bare decimal fraction (p = .0069). Not inside a Latin identifier (S20, H1, p95, 4e99435f).
const EN_FIGURE = /(?<![A-Za-z0-9_.,])(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\.\d+)(?![A-Za-z0-9]|[.,]\d)/g;

/** The languages that write numbers as English does (Western digits, comma groups, point decimals). */
const ENGLISH_STYLE = new Set(['en', 'zh', 'ar']);

/** One English-written figure in `lang`'s format, keeping its decimals and its grouping. */
function formatFigure(token, lang) {
    const grouped = token.includes(',');
    const plain = token.replace(/,/g, '');
    const decimals = (plain.split('.')[1] || '').length;
    const value = Number(plain.startsWith('.') ? `0${plain}` : plain);
    return formatNumber(value, lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped ? 'auto' : false });
}

/** A string's English-written figures in `lang`'s number format; <code> spans and tags stay as they are. */
export function localizeFigures(text, lang) {
    if (ENGLISH_STYLE.has(lang)) return text;
    return String(text).split(/(<code>[\s\S]*?<\/code>|<[^>]+>)/).map((part) => (part.startsWith('<')
        ? part
        : part.replace(EN_FIGURE, (token) => formatFigure(token, lang)))).join('');
}

// the separators each language writes: [group, decimal]
const SEPARATORS = { en: [',', '.'], zh: [',', '.'], ar: [',', '.'], de: ['.', ','], es: ['.', ','], ru: ['  ', ','] };

/**
 * The figures a string states, each as a canonical decimal ("3967.8",
 * "0.0069"), sorted; the small counts a sentence may write as a word (whole
 * numbers up to 64) are left out. <code> spans are left out too.
 */
export function figuresOf(text, lang) {
    const [group, decimal] = SEPARATORS[lang] || SEPARATORS.en;
    const g = `[${group.replace(/\./g, '\\.')}]`;
    const d = decimal === '.' ? '\\.' : decimal;
    const number = new RegExp(`(?<![A-Za-z0-9_${d}])(?:\\d{1,3}(?:${g}\\d{3})+(?:${d}\\d+)?|\\d+(?:${d}\\d+)?|${d}\\d+)(?![A-Za-z0-9]|${d}\\d)`, 'g');
    const plain = String(text).replace(/<code>[\s\S]*?<\/code>/g, ' ').replace(/<[^>]+>/g, ' ');
    return (plain.match(number) || [])
        .map((token) => {
            const canonical = token.replace(new RegExp(g, 'g'), '').replace(decimal, '.');
            return canonical.startsWith('.') ? `0${canonical}` : canonical;
        })
        .filter((n) => !(/^\d{1,2}$/.test(n) && Number(n) <= 64))
        .sort();
}
