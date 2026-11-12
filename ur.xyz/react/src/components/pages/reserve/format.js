/**
 * Number and date formatting for the reserve page, in the page's language.
 *
 * English keeps the page's own formats, en-US figures and its short dates
 * ("12 Oct", "12 Oct 26", "Oct 26", "12 Oct, 03:25 UTC"), compact K/M/B
 * figures and "$" amounts, exactly as before the page was translated. The
 * other languages format through the site's helpers (i18n/format.js): the
 * same fields in the language's own order and words ("12. Okt.", "окт. 26 г."),
 * compact figures in Intl's compact notation ("1,3 тыс.", "2,1 Mio."), and USD
 * as an Intl currency amount with the language's own symbol for the dollar
 * ("1,97 $" in German and Russian, "1,97 US$" in Spanish, "US$1.97" in
 * Chinese). Dates are UTC and Arabic keeps Western digits, so a static page
 * and its hydration agree.
 *
 * Every formatter takes the language last (default English); formatsFor(lang)
 * binds them all to one language.
 */
import { formatDate, formatNumber, formatPercent } from '../../../i18n/format.js';

const LOCALE = 'en-US';
const english = (lang) => !lang || lang === 'en';

/** 1,284 → "1.3K", 2,100,000 → "2.10M", 42.5 → "42.5". */
export function compact(v, lang = 'en') {
    const n = Number(v) || 0;
    const a = Math.abs(n);
    if (!english(lang)) return formatNumber(n, lang, { notation: 'compact', maximumFractionDigits: a >= 1e6 ? 2 : 1 });
    const sign = n < 0 ? '−' : '';
    if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(2)}M`;
    if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(1)}K`;
    return `${sign}${a.toLocaleString(LOCALE, { maximumFractionDigits: a % 1 ? 1 : 0 })}`;
}

/** Axis ticks: compact with no padding zeros (300K, 2.5M). */
export function axisCompact(v, lang = 'en') {
    const n = Number(v) || 0;
    if (!english(lang)) return formatNumber(n, lang, { notation: 'compact', maximumFractionDigits: 2 });
    const a = Math.abs(n);
    const sign = n < 0 ? '−' : '';
    const trim = (x) => String(Number(x.toFixed(2)));
    if (a >= 1e9) return `${sign}${trim(a / 1e9)}B`;
    if (a >= 1e6) return `${sign}${trim(a / 1e6)}M`;
    if (a >= 1e3) return `${sign}${trim(a / 1e3)}K`;
    return `${sign}${trim(a)}`;
}

/** A whole-number figure with thousands separators. */
export function whole(v, lang = 'en') {
    const n = Math.round(Number(v) || 0);
    return english(lang) ? n.toLocaleString(LOCALE) : formatNumber(n, lang);
}

/** An α amount to `dp` decimals, trailing zeros dropped. */
export function alpha(v, dp = 1, lang = 'en') {
    const options = { minimumFractionDigits: 0, maximumFractionDigits: dp };
    return english(lang) ? (Number(v) || 0).toLocaleString(LOCALE, options) : formatNumber(Number(v) || 0, lang, options);
}

/** A figure to exactly `dp` decimals: 0.1234567 → "0.1235" (a TAO balance, a price in TAO). */
export function fixed(v, dp, lang = 'en') {
    const n = Number(v) || 0;
    return english(lang) ? n.toFixed(dp) : formatNumber(n, lang, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** 0.4123 → "41.2%". */
export function pct(ratio, dp = 1, lang = 'en') {
    if (!english(lang)) return formatPercent(Number(ratio) || 0, lang, { maximumFractionDigits: dp });
    const v = (Number(ratio) || 0) * 100;
    return `${v.toLocaleString(LOCALE, { maximumFractionDigits: dp })}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_MS = 86_400_000;

/** "2026-10-12" → "12 Oct". */
export function shortDate(iso, lang = 'en') {
    if (!english(lang)) return formatDate(iso, lang, { day: 'numeric', month: 'short' });
    const [, m, d] = String(iso).split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-10-12" → "12 Oct 2026". */
export function longDate(iso, lang = 'en') {
    if (!english(lang)) return formatDate(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' });
    const [y, m, d] = String(iso).split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-10-12" → "12 Oct 26": for a span that crosses a year. */
export function shortDateYear(iso, lang = 'en') {
    if (!english(lang)) return formatDate(iso, lang, { day: 'numeric', month: 'short', year: '2-digit' });
    const [y, m, d] = String(iso).split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** "2026-10" → "Oct 26". */
export function monthLabel(ym, lang = 'en') {
    if (!english(lang)) return formatDate(`${ym}-01`, lang, { month: 'short', year: '2-digit' });
    const [y, m] = String(ym).split('-').map(Number);
    return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** "2026-10" → "October 2026". */
export function monthLong(ym, lang = 'en') {
    if (!english(lang)) return formatDate(`${ym}-01`, lang, { month: 'long', year: 'numeric' });
    const [y, m] = String(ym).split('-').map(Number);
    return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** "2026-10" → "Oct 2026". */
export function monthShort(ym, lang = 'en') {
    if (!english(lang)) return formatDate(`${ym}-01`, lang, { month: 'short', year: 'numeric' });
    const [y, m] = String(ym).split('-').map(Number);
    return `${MONTHS[m - 1]} ${y}`;
}

/** A USD amount: cents below $1,000 ("$1.97"), whole dollars above ("$4,650"), nothing as "$0". */
export function usd(v, lang = 'en') {
    const n = Number(v) || 0;
    const a = Math.abs(n);
    if (!english(lang)) {
        const digits = a === 0 || a >= 1000 ? 0 : 2;
        return formatNumber(n, lang, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
    const sign = n < 0 ? '−' : '';
    if (a === 0) return '$0';
    if (a >= 1000) return `${sign}$${whole(a)}`;
    return `${sign}$${a.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A USD amount in compact form: "$1.35M", "$80.9K", "$4,650", "$1.97". */
export function usdCompact(v, lang = 'en') {
    const n = Number(v) || 0;
    const a = Math.abs(n);
    if (!english(lang)) {
        if (a < 1e4) return usd(n, lang);
        return formatNumber(n, lang, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: a >= 1e6 ? 2 : 1 });
    }
    const sign = n < 0 ? '−' : '';
    if (a >= 1e4) return `${sign}$${compact(a)}`;
    return usd(n);
}

/** A USD axis tick: "$300K", "$2.5M". */
export function usdAxis(v, lang = 'en') {
    if (!english(lang)) return formatNumber(Number(v) || 0, lang, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
    return `$${axisCompact(v)}`;
}

/** A UTC timestamp (ms) → "2026-10-12". */
export function isoDay(ms) {
    return new Date(ms).toISOString().slice(0, 10);
}

/** A UTC timestamp (ms) → "12 Oct, 03:25 UTC". */
export function timeUtc(ms, lang = 'en') {
    if (!english(lang)) {
        return formatDate(ms, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });
    }
    const d = new Date(ms);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

/** The formatters above that depend on the language, bound to `lang`. */
export function formatsFor(lang = 'en') {
    return {
        compact: (v) => compact(v, lang),
        axisCompact: (v) => axisCompact(v, lang),
        whole: (v) => whole(v, lang),
        alpha: (v, dp) => alpha(v, dp, lang),
        fixed: (v, dp) => fixed(v, dp, lang),
        pct: (ratio, dp) => pct(ratio, dp, lang),
        shortDate: (iso) => shortDate(iso, lang),
        longDate: (iso) => longDate(iso, lang),
        shortDateYear: (iso) => shortDateYear(iso, lang),
        monthLabel: (ym) => monthLabel(ym, lang),
        monthLong: (ym) => monthLong(ym, lang),
        monthShort: (ym) => monthShort(ym, lang),
        usd: (v) => usd(v, lang),
        usdCompact: (v) => usdCompact(v, lang),
        usdAxis: (v) => usdAxis(v, lang),
        timeUtc: (ms) => timeUtc(ms, lang),
    };
}

export function epochDay(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function isoOf(day) {
    return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Every UTC day from `start` to `end` inclusive. */
export function dayRange(start, end) {
    const out = [];
    for (let d = epochDay(start); d <= epochDay(end); d++) out.push(isoOf(d));
    return out;
}

/** Whole days from `a` to `b` (negative when b is earlier). */
export function daysBetween(a, b) {
    return epochDay(b) - epochDay(a);
}
