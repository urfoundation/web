// /dashboard: build window.SNAP from live sources (react/src/lib/dashboardData.js) on top
// of the daily history (/dashboard/history.json), then run the engine and the page.
//
// On ur.xyz and ur.io the visitor's browser reads grafana.bringyour.com directly (its
// CORS allowlist names those origins). Anywhere else, the local dev server above all,
// the same requests go through /__grafana, which astro.config.mjs proxies in dev.
import { GRAFANA, buildLive, grafana } from '@react/lib/dashboardData.js';
import engineUrl from './engine.js?url';
import pageUrl from './page.js?url';

const firstParty = /(^|\.)(ur\.xyz|ur\.io)$/.test(location.hostname);
const base = firstParty ? GRAFANA : '/__grafana';

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

async function main() {
    const status = document.getElementById('upd');
    try {
        window.SNAP = await buildLive({ g: grafana(base), history: await history() });
        await load(engineUrl);
        await load(pageUrl);
        document.body.classList.remove('is-loading');
    } catch (e) {
        console.error('dashboard:', e);
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-error');
        if (status) {
            status.classList.add('err');
            status.textContent = 'Couldn’t reach the stats sources. Reload to try again.';
        }
    }
}

main();
