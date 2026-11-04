import React, { useEffect, useLayoutEffect, useRef } from 'react';

import body from './dashboard/body.html?raw';
import css from './dashboard/page.css?raw';
import medium from './dashboard/PPNeueMontreal-Medium.woff2?url';

const fonts = `@font-face{font-family:'PP Neue Montreal';src:url(/PPNeueMontreal-Regular.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'PP Neue Montreal';src:url(${medium}) format('woff2');font-weight:500;font-display:swap}
@font-face{font-family:'JetBrains Mono';src:url(/JetBrainsMono-Regular.woff2) format('woff2');font-display:swap}`;

// the module's own constants, so a re-render never resets the DOM the engine has drawn into
const STYLE = { __html: fonts + css };
const BODY = { __html: body };

/**
 * /dashboard: UR's network and SN25 stats, read live.
 *
 * A standalone page, without the site's chrome. The markup and styles are
 * rendered here (and into the static HTML by astro/src/pages/dashboard.astro);
 * dashboard/loader.js then builds the data in the visitor's browser and runs
 * the engine and page scripts over that markup, outside React. Its styles are
 * global and written for a page with no others, so while it is mounted they are
 * the only ones on: the SPA's site stylesheets switch off and back on after
 * (the static page has none).
 */
export default function DashboardPage() {
    const started = useRef(false);
    const own = useRef(null);

    // The static build's shell has the same class, title and meta in its HTML.
    useLayoutEffect(() => {
        const cls = document.body.classList;
        const title = document.title;
        const site = [...document.styleSheets].filter((s) => s.ownerNode !== own.current && !s.disabled);
        site.forEach((s) => { s.disabled = true; });
        document.title = 'UR Stats';
        cls.add('is-loading');
        return () => {
            site.forEach((s) => { s.disabled = false; });
            document.title = title;
            cls.remove('is-loading', 'is-error');
            delete document.body.dataset.accent;
        };
    }, []);

    useEffect(() => {
        // once per mount: the scripts can't be undone, and StrictMode runs effects twice
        if (started.current) return;
        started.current = true;
        import('./dashboard/loader.js').then(({ startDashboard }) => startDashboard());
    }, []);

    return (
        <>
            <style ref={own} dangerouslySetInnerHTML={STYLE} />
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={BODY} />
        </>
    );
}
