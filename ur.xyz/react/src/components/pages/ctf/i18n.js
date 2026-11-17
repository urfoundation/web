/**
 * The capture the flag pages in the page's language: their copy
 * (react/src/i18n/pages/ctf/<lang>.js), the countries' names in it
 * (pages/ctf/names/<lang>.js, scripts/ctf-names.mjs) and its figures and
 * days. Pure, with no React and no clock: the model (ctf/model.js), the
 * static render, the islands and the tests all format alike, and a page
 * hydrates onto exactly what the build wrote. Nothing here reads the
 * browser's language or the visitor's ICU: the names, the A–Z and the month
 * names are the committed copy's, and numbers go through Intl only for their
 * separators, which every engine writes alike.
 *
 * English is the copy's source and renders exactly as the pages did before
 * they were translated (the US format, "Nov 27, 18:25 UTC").
 */
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { formatNumber, interpolate, plural } from '../../../i18n/format.js';

const COPY = await loadPageCopy('ctf');
const NAMES = await loadPageCopy('ctf/names');

export const DEFAULT_LANG = 'en';

/** The pages' copy in `lang` (English filling any key a translation lacks). */
export const ctfCopy = (lang = DEFAULT_LANG) => COPY(lang);

/** Every country's names in `lang`: { order, name, short, in, inShort } (names/<lang>.js). */
export const ctfNames = (lang = DEFAULT_LANG) => NAMES(lang);

export { interpolate };

const RAO = 1e9;
const two = (n) => String(n).padStart(2, '0');
const cache = new Map();

/**
 * The figures, days and counts of one language: alpha amounts, integers, the
 * chance to win, UTC times and days, the live bar's countdown, and a plural
 * node's form with its {count} filled.
 */
export function formats(lang = DEFAULT_LANG) {
    if (cache.has(lang)) return cache.get(lang);
    const t = COPY(lang).time;
    const en = lang === DEFAULT_LANG;
    /** An amount of rao in α to `dp` decimals: 12_970_000_000 → "12.97" (en), "12,97" (de). */
    const alpha = (rao, dp = 2) => formatNumber(rao / RAO, lang, { minimumFractionDigits: dp, maximumFractionDigits: dp });
    const int = (n) => formatNumber(Math.round(n), lang);
    const percent = (fraction, dp) => formatNumber(fraction, lang, { style: 'percent', minimumFractionDigits: dp, maximumFractionDigits: dp });
    /**
     * A chance as the pages write it: "100%", "83%", "2.6%", "0.015%" — whole
     * percent from 10%, one decimal from 0.1%, three below. Every language
     * rounds the same digits; only its percent format differs ("2,6 %").
     */
    const pct = (p) => {
        if (p >= 1) return en ? '100%' : percent(1, 0);
        const v = p * 100;
        if (v >= 10) return en ? `${Math.round(v)}%` : percent(Math.round(v) / 100, 0);
        if (v >= 0.1) return en ? `${v.toFixed(1)}%` : percent(Number(v.toFixed(1)) / 100, 1);
        return en ? `${v.toFixed(3)}%` : percent(Number(v.toFixed(3)) / 100, 3);
    };
    const parts = (date) => {
        const d = new Date(date);
        return {
            d: d.getUTCDate(),
            mon: d.getUTCMonth() + 1,
            month: t.months[d.getUTCMonth()],
            monthShort: t.monthsShort[d.getUTCMonth()],
            y: d.getUTCFullYear(),
            hh: two(d.getUTCHours()),
            mm: two(d.getUTCMinutes()),
        };
    };
    const f = {
        lang,
        alpha,
        int,
        pct,
        /** "2026-11-27T18:25:24Z" → "Nov 27, 18:25 UTC". */
        utcTime: (iso) => interpolate(t.moment, parts(iso)),
        /** "2026-11-27T18:25:24Z" → "18:25 UTC". */
        utcClock: (iso) => interpolate(t.clock, parts(iso)),
        /** "2026-11-27T18:25:24Z" → "November 27, 2026". */
        utcDay: (iso) => interpolate(t.day, parts(iso)),
        /** "2026-11-10" → "November 10". */
        dayName: (day) => interpolate(t.dayMonth, parts(`${day}T00:00:00Z`)),
        /** Milliseconds to go as the live bar counts them: "16d 03h", "4h 07m", "12m". */
        countdown: (ms) => {
            const minutes = Math.max(1, Math.ceil(ms / 60_000));
            const d = Math.floor(minutes / 1440);
            const h = Math.floor((minutes % 1440) / 60);
            const m = minutes % 60;
            if (d > 0) return interpolate(t.countdownDays, { d, hh: two(h) });
            if (h > 0) return interpolate(t.countdownHours, { h, mm: two(m) });
            return interpolate(t.countdownMinutes, { m });
        },
        /** A plural node's form for `n`, its {count} the integer and the rest from `values`. */
        count: (node, n, values = {}) => interpolate(plural(lang, n, node), { count: int(n), ...values }),
        /** A plural node's form for `n`, unfilled (for a template with tags). */
        form: (node, n) => plural(lang, n, node),
    };
    cache.set(lang, f);
    return f;
}

/** The capitalized form of a name or phrase that opens a sentence. */
export const capital = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * A country's names for a sentence's placeholders: {name}, {the}, {The},
 * {short}, {in}, {In} and {inShort} (en.js says what each is).
 */
export function place(c) {
    const inPhrase = c.in ?? `in ${c.the}`;
    return {
        name: c.name,
        the: c.the,
        The: c.The,
        short: c.short,
        in: inPhrase,
        In: c.In ?? capital(inPhrase),
        inShort: c.inShort ?? `in ${c.short}`,
    };
}
