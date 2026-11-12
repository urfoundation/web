// /dashboard: build window.SNAP from live sources (react/src/lib/dashboardData.js) on top
// of the daily history (/dashboard/history.json), then run the engine and the page.
//
// On ur.xyz and ur.io the visitor's browser reads grafana.bringyour.com directly (its
// CORS allowlist names those origins). Anywhere else, the local dev server above all,
// the same requests go through /__grafana, which the dev servers proxy (react/vite.config.js,
// astro/astro.config.mjs).
//
// Each part of the data is its own read (liveReads), so one that fails costs only the panels
// it feeds. The page draws once Grafana's reads have all answered or given up (FIRST_DRAW_MS
// at most), from whatever arrived, and a panel whose data is missing says so in its place
// (page.js UR.need). A read that failed or timed out is asked again, quietly and less often
// each time (RETRY_MS), and the panels it feeds are drawn once it answers (UR.refresh).
// Bittensor mainnet is never waited for: the page reads it in the visitor's browser, which a
// filtered network may keep from reaching it, so its panels shimmer for a few seconds at
// most (CHAIN_WAIT_MS) and then say it can't be reached right now, until it answers.
import { CHAIN_READS, GRAFANA, assembleLive, grafana, liveReads } from '../../../lib/dashboardData.js';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { displayRegion, formatUsd, interpolate, intlLocale, pluralCategory } from '../../../i18n/format.js';
import engineUrl from './engine.js?url';
import pageUrl from './page.js?url';

const [pageCopy, scriptCopy] = await Promise.all([loadPageCopy('dashboard'), loadPageCopy('dashboard/script')]);

const FIRST_DRAW_MS = 20_000;
const CHAIN_WAIT_MS = 8_000;
// a Grafana request without an answer by then has failed
const REQUEST_MS = 20_000;
// the waits before asking again for a part that failed: the fifth and later every 5 minutes
const RETRY_MS = [10_000, 20_000, 40_000, 80_000, 160_000, 300_000];

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

// after `ms`, or as soon as the page is shown again if it is hidden then: nothing is read for a page nobody sees
function later(fn, ms) {
    setTimeout(() => {
        if (!document.hidden) { fn(); return; }
        const shown = () => {
            if (document.hidden) return;
            document.removeEventListener('visibilitychange', shown);
            fn();
        };
        document.addEventListener('visibilitychange', shown);
    }, ms);
}

// The page's scripts keep references into window.SNAP (its series, its days and hours), so a
// later answer is brought into the same object, its arrays in place.
function merge(S, fresh) {
    for (const [k, v] of Object.entries(fresh)) {
        if (k === 'D' || k === 'Hs') Object.assign(S[k], v);
        else if (k === 'dayT' || k === 'hourT') S[k].splice(0, S[k].length, ...v);
        else S[k] = v;
    }
}

// the page as it is while nothing can be drawn: each panel's note (page.css content: attr(data-unavailable)) and
// the status line; `off` false takes them away again
function unavailable(t, status, off = true) {
    document.body.classList.toggle('is-error', off);
    document.querySelectorAll('section[data-tab] .pn').forEach((pn) => {
        if (off) pn.dataset.unavailable = t.unavailable;
        else delete pn.dataset.unavailable;
    });
    if (status) {
        status.classList.toggle('err', off);
        status.textContent = off ? t.loadError : '';
    }
}

export async function startDashboard(lang = 'en') {
    const firstParty = /(^|\.)(ur\.xyz|ur\.io)$/.test(location.hostname);
    const base = firstParty ? GRAFANA : '/__grafana';
    const status = document.getElementById('upd');
    const t = scriptCopy(lang);
    window.UR_I18N = scriptsI18n(lang);
    const file = await history();
    const now = Date.now();
    const reads = liveReads({ g: grafana(base, { timeoutMs: REQUEST_MS }), history: file, now });
    const answers = {};
    // the reads that have not answered or failed yet; the chain's the page shimmers for, while it still waits
    const pending = new Set(Object.keys(reads)), waitFor = new Set(CHAIN_READS);
    const snap = () => assembleLive(answers, { history: file, now, pending: [...pending].filter((k) => waitFor.has(k)) });
    let drawn = false, queued = false, settled = () => {};
    // the page's markup, while it is shown (the SPA takes it away when the visitor moves on): nothing is read or
    // drawn for it after that
    const here = () => !status || status.isConnected;
    // a later answer (or a chain read the page stops waiting for) is drawn once the page is: answers that come
    // together, in one go
    const redraw = () => {
        if (!drawn || queued || !here()) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            merge(window.SNAP, snap());
            window.UR?.refresh?.();
        });
    };
    const run = (key, attempt = 0) => reads[key]().then(
        (value) => {
            answers[key] = value;
            pending.delete(key);
            settled();
            redraw();
        },
        () => {
            if (pending.delete(key)) {
                settled();
                redraw();
            }
            if (here()) later(() => { if (here()) run(key, attempt + 1); }, RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)]);
        },
    );
    Object.keys(reads).forEach((key) => run(key));
    setTimeout(() => { waitFor.clear(); redraw(); }, CHAIN_WAIT_MS);

    // the first draw: once each of Grafana's reads has answered or failed, FIRST_DRAW_MS at most
    const grafanaDone = () => [...pending].every((k) => CHAIN_READS.includes(k));
    if (!grafanaDone()) {
        await new Promise((resolve) => {
            settled = () => { if (grafanaDone()) resolve(); };
            setTimeout(resolve, FIRST_DRAW_MS);
        });
    }
    // nothing to draw (no history, no stats feed, no hourly figure): say so, and draw once something arrives
    const drawable = () => answers.stats != null || (answers.history ?? file) != null || Object.keys(answers).some((k) => k.startsWith('hourly.') && answers[k]);
    if (!drawable()) {
        document.body.classList.remove('is-loading');
        unavailable(t, status);
        await new Promise((resolve) => { settled = () => { if (drawable()) resolve(); }; });
        unavailable(t, status, false);
    }
    settled = () => {};
    window.SNAP = snap();
    try {
        await load(engineUrl);
        await load(pageUrl);
    } catch (e) {
        console.error('dashboard:', e);
        document.body.classList.remove('is-loading');
        unavailable(t, status);
        return;
    }
    drawn = true;
    document.body.classList.remove('is-loading');
    // what answered while the scripts loaded
    redraw();
}
