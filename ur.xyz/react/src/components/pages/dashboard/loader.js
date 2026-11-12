// /dashboard: build window.SNAP from live sources (react/src/lib/dashboardData.js) on top
// of the daily history (/dashboard/history.json), then run the engine and the page.
//
// On ur.xyz and ur.io the visitor's browser reads grafana.bringyour.com directly (its
// CORS allowlist names those origins). Anywhere else, the local dev server above all,
// the same requests go through /__grafana, which the dev servers proxy (react/vite.config.js,
// astro/astro.config.mjs).
import { GRAFANA, buildLive, grafana } from '../../../lib/dashboardData.js';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { displayRegion, formatUsd, interpolate, intlLocale, pluralCategory } from '../../../i18n/format.js';
import engineUrl from './engine.js?url';
import pageUrl from './page.js?url';

const [pageCopy, scriptCopy] = await Promise.all([loadPageCopy('dashboard'), loadPageCopy('dashboard/script')]);

function load(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`could not load ${src}`));
        document.body.appendChild(s);
    });
}

async function history() {
    try {
        const r = await fetch('/dashboard/history.json', { cache: 'no-cache' });
        return r.ok ? await r.json() : null;
    } catch {
        return null;
    }
}

/**
 * What engine.js and page.js read for the page's language, as window.UR_I18N (they are
 * classic scripts, without imports): the language and its Intl locale, the copy (t: unit
 * dashboard/script, page: unit dashboard) and format.js's helpers for it.
 */
function scriptsI18n(lang) {
    return {
        lang,
        locale: intlLocale(lang),
        t: scriptCopy(lang),
        page: pageCopy(lang),
        interpolate,
        // a plural node's form for count (options: Intl.PluralRules', such as the decimals shown)
        plural: (forms, count, options) => forms[pluralCategory(lang, count, options)] ?? forms.other,
        // a price in US dollars: Intl's, the dollar's narrow symbol ("1,97 $"), and in Spanish "US$1,97"
        usd: (value) => formatUsd(value, lang, { currencyDisplay: 'narrowSymbol' }),
        // a country's name from its ISO code (Intl), or null when Intl has none
        region: (code) => {
            try {
                const name = displayRegion(code, lang);
                return name && name.toUpperCase() !== String(code).toUpperCase() ? name : null;
            } catch {
                return null;
            }
        },
    };
}

export async function startDashboard(lang = 'en') {
    const firstParty = /(^|\.)(ur\.xyz|ur\.io)$/.test(location.hostname);
    const base = firstParty ? GRAFANA : '/__grafana';
    const status = document.getElementById('upd');
    const t = scriptCopy(lang);
    window.UR_I18N = scriptsI18n(lang);
    try {
        window.SNAP = await buildLive({ g: grafana(base), history: await history() });
        await load(engineUrl);
        await load(pageUrl);
        document.body.classList.remove('is-loading');
    } catch (e) {
        console.error('dashboard:', e);
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-error');
        // each panel's note in place of its chart, table or map (page.css content: attr(data-unavailable))
        document.querySelectorAll('section[data-tab] .pn').forEach((pn) => { pn.dataset.unavailable = t.unavailable; });
        if (status) {
            status.classList.add('err');
            status.textContent = t.loadError;
        }
    }
}
