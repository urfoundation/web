import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { loadPageCopy } from '../../i18n/page-copy.js';
import body from './dashboard/body.html?raw';
import { renderBody } from './dashboard/markup.js';
import css from './dashboard/page.css?raw';
import medium from './dashboard/PPNeueMontreal-Medium.woff2?url';

const [pageCopy, methodCopy, scriptCopy] = await Promise.all(
    ['dashboard', 'dashboard/method', 'dashboard/script'].map((unit) => loadPageCopy(unit)),
);

const fonts = `@font-face{font-family:'PP Neue Montreal';src:url(/PPNeueMontreal-Regular.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'PP Neue Montreal';src:url(${medium}) format('woff2');font-weight:500;font-display:swap}
@font-face{font-family:'JetBrains Mono';src:url(/JetBrainsMono-Regular.woff2) format('woff2');font-display:swap}`;

// made once per module (and language), so a re-render never resets the DOM the engine has drawn into
const STYLE = { __html: fonts + css };
const BODIES = new Map();
function bodyIn(lang) {
    if (!BODIES.has(lang)) {
        BODIES.set(lang, { __html: renderBody(body, { page: pageCopy(lang), method: methodCopy(lang), script: scriptCopy(lang), lang }) });
    }
    return BODIES.get(lang);
}

/**
 * /dashboard: UR's network and SN25 stats, read live.
 *
 * A standalone page, without the site's chrome. The markup and styles are
 * rendered here (and into the static HTML by astro/src/components/routes/DashboardRoute.astro);
 * dashboard/loader.js then builds the data in the visitor's browser and runs
 * the engine and page scripts over that markup, outside React. Its styles are
 * global and written for a page with no others, so while it is mounted they are
 * the only ones on: the SPA's site stylesheets switch off and back on after
 * (the static page has none).
 *
 * Its words are the `dashboard` copy units (react/src/i18n/pages/dashboard/) in
 * the page's language `lang`: the markup's through dashboard/markup.js, the
 * scripts' through the loader.
 */
export default function DashboardPage({ lang = 'en' }) {
    const started = useRef(null);
    const own = useRef(null);

    // The static build's shell has the same class, title and meta in its HTML.
    useLayoutEffect(() => {
        const cls = document.body.classList;
        const title = document.title;
        const site = [...document.styleSheets].filter((s) => s.ownerNode !== own.current && !s.disabled);
        site.forEach((s) => { s.disabled = true; });
        document.title = pageCopy(lang).meta.title;
        cls.add('is-loading');
        return () => {
            site.forEach((s) => { s.disabled = false; });
            document.title = title;
            cls.remove('is-loading', 'is-error');
            delete document.body.dataset.accent;
        };
    }, [lang]);

    useEffect(() => {
        // once per mount and language: the scripts can't be undone, and StrictMode runs effects twice
        if (started.current === lang) return;
        started.current = lang;
        import('./dashboard/loader.js').then(({ startDashboard }) => startDashboard(lang));
    }, [lang]);

    return (
        <>
            <style ref={own} dangerouslySetInnerHTML={STYLE} />
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={bodyIn(lang)} />
        </>
    );
}
