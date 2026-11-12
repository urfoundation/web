/**
 * /dashboard's markup in a page language: body.html with its {{key}} tokens
 * replaced by the copy (react/src/i18n/pages/dashboard/). Pure, so the server
 * render, the browser and node tests make the same markup.
 *
 * A token names a string of the copy: {{titles.dataCarried}} is unit
 * dashboard's, {{method.defs.change}} unit dashboard/method's and
 * {{script.network.averageDay}} unit dashboard/script's. The string is
 * HTML-escaped and its {placeholders} filled: {d1} … {d90} with the period
 * buttons' labels, and the token's own arguments with markup body.html gives
 * after a bar, {{subnet.reserveLede|link=<a href="…">{{subnet.reserveLink}}</a>}}
 * (an argument holds no bar and no braces; inner tokens resolve first).
 * {{=name}} is markup made here from the copy (COMPUTED).
 */
import { formatNumber, interpolate } from '../../../i18n/format.js';
import { hasLocalizedVersion, localizedPathFor } from '../../../../../astro/src/lib/route-localization.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (c) => ESCAPES[c]);

const COMPUTED = {
    // the More stats tab: phones show only its short name (page.css .nav .nl-x, .nl-s)
    navMore: ({ page }) => {
        const { more, moreShort } = page.nav;
        return more.startsWith(moreShort)
            ? `${escapeHtml(moreShort)}<span class="nl-x">${escapeHtml(more.slice(moreShort.length))}</span>`
            : `<span class="nl-x">${escapeHtml(more)}</span><span class="nl-s">${escapeHtml(moreShort)}</span>`;
    },
    // the links back to the site: its home page, and /mainnet, in the page's language while that has a translation
    home: ({ lang }) => escapeHtml(localizedPathFor('/', lang)),
    mainnet: ({ lang }) => escapeHtml(hasLocalizedVersion('/mainnet') ? localizedPathFor('/mainnet', lang) : '/mainnet'),
    // the live counters' value until the page's scripts start them
    zeroGb: ({ lang }) => escapeHtml(lang === 'en' ? '0 GB' : formatNumber(0, lang, { style: 'unit', unit: 'gigabyte', unitDisplay: 'short' })),
};

const PERIODS = ['d1', 'd3', 'd7', 'd30', 'd90'];
const TOKEN = /\{\{([^{}]*)\}\}/g;

/**
 * body.html (`html`) in a language: `page`, `method` and `script` are the
 * units' copy in that language (copy(lang) of dashboard, dashboard/method,
 * dashboard/script). Throws on a token that names no string.
 */
export function renderBody(html, { page, method, script, lang = 'en' }) {
    const root = { ...page, method, script };
    const periods = Object.fromEntries(PERIODS.map((k) => [k, escapeHtml(page.periods[k])]));
    const resolve = (whole, inner) => {
        const [key, ...args] = inner.split('|');
        if (key.startsWith('=')) {
            const make = COMPUTED[key.slice(1)];
            if (!make) throw new Error(`dashboard markup: no computed value ${whole}`);
            return make({ page, lang });
        }
        const text = key.split('.').reduce((node, part) => (node == null ? node : node[part]), root);
        if (typeof text !== 'string') throw new Error(`dashboard markup: no string for ${whole}`);
        const values = { ...periods };
        for (const arg of args) {
            const at = arg.indexOf('=');
            values[arg.slice(0, at)] = arg.slice(at + 1);
        }
        return interpolate(escapeHtml(text), values);
    };
    let out = html;
    for (let before = null; before !== out;) {
        before = out;
        out = out.replace(TOKEN, resolve);
    }
    if (out.includes('{{')) throw new Error('dashboard markup: an unresolved token');
    return out;
}
