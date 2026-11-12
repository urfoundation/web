// What the built ur.xyz offers a reader, or an agent, at a stable address and
// without running the page: checked in a browser against the Astro build, with
// JavaScript on and off.
//
//   /build#brief-<slug>   each opportunity brief has its own address; it shows
//                         that brief before (or without) hydration, and the
//                         hydrated page opens it and keeps the address while a
//                         brief is open
//   /reserve              the page says, in its HTML, where its live figures
//                         come from and where to check them
//   /docs, /docs/<slug>   static HTML (the document and its sidebar need no
//                         script); the search box fetches /docs-search.json on
//                         first use; the phone sidebar toggle and the code
//                         blocks' Copy buttons work without React
//   /ctf, /ctf/<cc>       every figure and every country's link in the HTML;
//                         a control that needs the script (sorting, the
//                         search, the picker; the tap to open a card is not
//                         drawn at all) is disabled until it runs, and the
//                         hydrated board finds a country, opens on the
//                         visitor's (/sn/ctf/here) and lets a tap open a card;
//                         before capture the flag starts, the note above the
//                         hub's heading says when in the HTML (Russian and
//                         Arabic too), and on the visitor's clock it counts
//                         down and turns live at the start, holding its size
//
// Usage (from astro/, after a build):  node ../react/tests/static-affordances.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OFFLINE_CHROMIUM_ARGS } from './offline-chromium.mjs';
import { SNAPSHOT } from './ctf-fixtures.mjs';
import { buildModel, localModel, startNote } from '../src/components/pages/ctf/model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UR_ENV = process.env.UR_ENV || 'main';
const ROOT = path.resolve(__dirname, '../../astro/build', UR_ENV);

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };

function staticServer(root) {
    return http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const candidates = path.extname(relative) ? [relative] : [`${relative}.html`, path.join(relative, 'index.html')];
        const file = candidates.map((c) => path.resolve(root, c)).find((c) => c.startsWith(root + path.sep) && fs.existsSync(c) && fs.statSync(c).isFile());
        if (!file) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }
        response.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(response);
    });
}

const freePort = () => new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
        const { port } = server.address();
        server.close(() => resolve(port));
    });
});

const failures = [];
const check = (condition, message) => {
    if (!condition) failures.push(message);
    console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
};

async function open(browser, url, javaScriptEnabled) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    // the reserve reads Bittensor mainnet; an empty answer keeps this offline
    await page.route(/opentensor\.ai|bringyour\.com|ur\.network/, (r) => r.fulfill({ json: {} }).catch(() => r.abort()));
    await page.goto(url, { waitUntil: 'networkidle' });
    return { page, close: () => context.close() };
}

const visibleBriefs = (page) => page.$$eval('section.brief-panel', (els) => els.filter((el) => el.getClientRects().length > 0).map((el) => el.id));

async function main() {
    if (!fs.existsSync(path.join(ROOT, 'build.html'))) {
        console.error(`static-affordances: no build at ${ROOT}`);
        process.exit(1);
    }
    const port = await freePort();
    const server = staticServer(ROOT);
    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${port}`;
    // offline: open() answers the feeds and the chain; any other host fails to resolve
    const browser = await chromium.launch({ args: OFFLINE_CHROMIUM_ARGS, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        {
            const { page, close } = await open(browser, `${base}/build#brief-agent-access`, false);
            check(JSON.stringify(await visibleBriefs(page)) === '["brief-agent-access"]', '/build#brief-agent-access without JavaScript shows that brief, and only it');
            await close();
        }
        {
            const { page, close } = await open(browser, `${base}/build`, false);
            check((await visibleBriefs(page)).length === 0, '/build without JavaScript draws no brief, as the hydrated page does');
            await close();
        }
        {
            const { page, close } = await open(browser, `${base}/build#brief-agent-access`, true);
            await page.waitForSelector('.build-page[data-hydrated]', { timeout: 5000 }).catch(() => {});
            check(JSON.stringify(await visibleBriefs(page)) === '["brief-agent-access"]', '/build#brief-agent-access, hydrated, opens that brief');
            check(await page.getAttribute('#op-tab-agent-access', 'aria-selected') === 'true', '/build#brief-agent-access, hydrated, selects its opportunity');
            await close();
        }
        {
            const { page, close } = await open(browser, `${base}/build`, true);
            await page.waitForSelector('.build-page[data-hydrated]', { timeout: 5000 }).catch(() => {});
            await page.click('#opportunity-readout-white-label-vpn .readout-brief').catch(() => {});
            check(await page.evaluate(() => location.hash) === '#brief-white-label-vpn', '/build: opening a brief puts its address in the location');
            await close();
        }
        {
            // the docs pages are static HTML: the document and its sidebar need no script
            const { page, close } = await open(browser, `${base}/docs/miner`, false);
            check(Boolean((await page.textContent('main.explorer-main h1').catch(() => '')).trim()), '/docs/miner without JavaScript shows the document');
            check(await page.isVisible('nav.explorer-nav a[href="/docs/validator"]').catch(() => false), '/docs/miner without JavaScript shows the sidebar links');
            await close();
        }
        {
            // the search box fetches its index on first use, then searches it
            const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
            const page = await context.newPage();
            const indexFetches = [];
            page.on('request', (r) => { if (new URL(r.url()).pathname === '/docs-search.json') indexFetches.push(r.url()); });
            await page.goto(`${base}/docs`, { waitUntil: 'networkidle' });
            await page.waitForSelector('astro-island:not([ssr]) .explorer-search-input', { timeout: 5000 }).catch(() => {});
            check(indexFetches.length === 0, '/docs loads no search index until the search box is used');
            await page.fill('.explorer-search-input', 'validator');
            await page.waitForSelector('.explorer-results .explorer-result', { timeout: 5000 }).catch(() => {});
            const titles = await page.$$eval('.explorer-result-title', (els) => els.map((el) => el.textContent));
            check(indexFetches.length === 1 && titles.some((t) => /validator/i.test(t)), '/docs search finds the validator guide from /docs-search.json');
            check(!(await page.isVisible('nav.explorer-nav').catch(() => true)), '/docs search results take the place of the sidebar list');
            await page.click('.explorer-result:has-text("validator")').catch(() => {});
            await page.waitForURL(/\/docs\/validator$/, { timeout: 5000 }).catch(() => {});
            check(new URL(page.url()).pathname === '/docs/validator', '/docs search result opens the document');
            await context.close();
        }
        {
            // the phone sidebar toggle and the code blocks' Copy buttons, without React
            const context = await browser.newContext({ viewport: { width: 393, height: 659 } });
            await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
            const page = await context.newPage();
            await page.goto(`${base}/docs/miner`, { waitUntil: 'networkidle' });
            await page.click('.explorer-sidebar-toggle');
            const sidebarOpen = await page.$eval('#docs-explorer', (el) => el.classList.contains('sidebar-open')).catch(() => false);
            check(await page.getAttribute('.explorer-sidebar-toggle', 'aria-expanded') === 'true' && sidebarOpen, '/docs/miner phone sidebar toggle opens the sidebar');
            await page.click('.explorer-sidebar-toggle');
            const block = page.locator('.md-codeblock').first();
            await block.locator('.md-codeblock-copy').click();
            const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
            const source = await block.locator('.md-pre > code').textContent();
            check(await block.locator('.md-codeblock-copy').getAttribute('data-state') === 'copied' && copied === source, '/docs/miner Copy puts the code block\'s text on the clipboard and says so');
            await context.close();
        }
        {
            // capture the flag: the grid is plain HTML, one link per country
            const { page, close } = await open(browser, `${base}/ctf`, false);
            const links = await page.$$eval('.ctf-grid .ctf-cname a', (els) => els.map((a) => a.getAttribute('href')));
            check(links.length === 249 && links.every((h) => /^\/ctf\/[a-z]{2}$/.test(h)) && new Set(links).size === 249, '/ctf without JavaScript links all 249 country pages');
            check(await page.locator('.ctf-cell-hit, .ctf-fc-hit').count() === 0, '/ctf without JavaScript draws no tap control that needs the script');
            const inert = await page.$$eval('.ctf-seg button, #ctf-q, #ctf-country', (els) => els.map((el) => el.disabled));
            check(inert.length >= 4 && inert.every(Boolean), '/ctf without JavaScript disables the sorting, the search and the picker, which need the script');
            check(Boolean((await page.textContent('.ctf-live').catch(() => '')).trim()), '/ctf without JavaScript shows the live bar');
            await close();
        }
        {
            const { page, close } = await open(browser, `${base}/ctf/ke`, false);
            check(/Earn crypto in Kenya/.test(await page.textContent('h1').catch(() => '')), '/ctf/ke without JavaScript leads with its plain-words heading');
            check((await page.locator('.ctf-faq details').count()) === 6 && /Kenya/.test(await page.textContent('.ctf-intro').catch(() => '')), '/ctf/ke without JavaScript answers its questions with its own figures');
            await close();
        }
        {
            // hydrated: the visitor's country, the search and a card that opens on a tap
            const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
            const page = await context.newPage();
            await page.route(/bringyour\.com/, (r) => r.fulfill({ json: r.request().url().includes('/sn/ctf/here') ? { country: 'ke' } : {} }).catch(() => r.abort()));
            await page.goto(`${base}/ctf`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.ctf-cell-hit', { timeout: 8000 }).catch(() => {});
            check(await page.textContent('.ctf-me-name').catch(() => '') === 'Kenya', '/ctf opens on the visitor\'s country from /sn/ctf/here');
            check(await page.$$eval('.ctf-seg button, #ctf-q, #ctf-country', (els) => els.length >= 4 && els.every((el) => !el.disabled)), '/ctf, hydrated, enables its controls');
            await page.fill('#ctf-q', 'nigeria');
            await page.waitForTimeout(200);
            check(JSON.stringify(await page.$$eval('.ctf-grid .ctf-cname a', (els) => els.map((a) => a.textContent))) === '["Nigeria"]', '/ctf finds a country by name');
            await page.fill('#ctf-q', '');
            const cell = page.locator('.ctf-grid .ctf-cell').first();
            await cell.locator('.ctf-cell-hit').click().catch(() => {});
            await page.waitForTimeout(1000);
            check(await cell.evaluate((el) => el.classList.contains('ctf-expanded') && el.querySelector('.ctf-cell-more') !== null).catch(() => false), '/ctf on a tablet opens a country\'s card on a tap');
            await context.close();
        }
        {
            // capture the flag before it starts: the note above the hub's heading, in the HTML in every language and
            // counting down on the visitor's clock; once the snapshot is from after the start, no note
            const notes = Object.fromEntries(['en', 'ru', 'ar'].map((lang) => [lang, startNote(localModel(buildModel(SNAPSHOT), lang))]));
            if (!notes.en) {
                const { page, close } = await open(browser, `${base}/ctf`, false);
                check(await page.locator('.ctf-start').count() === 0, '/ctf after the start has no countdown note');
                await close();
            } else {
                for (const [lang, note] of Object.entries(notes)) {
                    const { page, close } = await open(browser, `${base}${lang === 'en' ? '' : `/${lang}`}/ctf`, false);
                    const said = await page.textContent('.ctf-start [role="status"]').catch(() => '');
                    const first = await page.evaluate(() => {
                        const start = document.querySelector('.ctf-start');
                        const h1 = document.querySelector('h1');
                        return Boolean(start && h1 && start.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING);
                    });
                    check(said === note.note && first, `/${lang === 'en' ? '' : `${lang}/`}ctf without JavaScript says above its heading when capture the flag starts: ${note.note}`);
                    if (lang === 'en') check(await page.textContent('.ctf-start-tiles').catch(() => '') === `--${note.words.units[0]}:--${note.words.units[1]}:--${note.words.units[2]}:--${note.words.units[3]}`, '/ctf without JavaScript shows no figure it cannot know');
                    await close();
                }
                // hydrated, three days before the start on the visitor's clock, then past it
                const start = Date.parse(notes.en.startsAt);
                const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
                const page = await context.newPage();
                await page.clock.install({ time: start - 3 * 86_400_000 });
                await page.route(/bringyour\.com/, (r) => r.fulfill({ json: {} }).catch(() => r.abort()));
                await page.goto(`${base}/ctf`, { waitUntil: 'networkidle' });
                await page.waitForSelector('.ctf-start.ctf-start-on', { timeout: 8000 }).catch(() => {});
                const box = async () => page.evaluate(() => {
                    const r = document.querySelector('.ctf-start').getBoundingClientRect();
                    return { height: r.height, h1: document.querySelector('h1').getBoundingClientRect().top + window.scrollY };
                });
                const before = await box();
                const figures = await page.$$eval('.ctf-start-num', (els) => els.map((el) => el.textContent));
                check(JSON.stringify(figures) === '["03","00","00","00"]', `/ctf counts down on the visitor's clock: ${figures.join(' : ')}`);
                check(await page.textContent('.ctf-start .ctf-sr').catch(() => '') === 'Starts in about 3 days.', '/ctf says the time left in words for a screen reader');
                check(/≈ 21,600$/.test(await page.textContent('.ctf-start-blocks b').catch(() => '')), '/ctf counts the blocks left, one every 12 seconds');
                await page.clock.fastForward(3 * 86_400_000 + 1000);
                await page.waitForSelector('.ctf-start[data-phase="live"]', { timeout: 5000 }).catch(() => {});
                const after = await box();
                check(await page.textContent('.ctf-start [role="status"]').catch(() => '') === notes.en.live && await page.locator('.ctf-start .ctf-sr').count() === 0, `/ctf turns live at the start, not a count below zero: ${notes.en.live}`);
                check(Math.abs(after.height - before.height) < 0.5 && Math.abs(after.h1 - before.h1) < 0.5, `/ctf's note holds its size as it turns live (${before.height} → ${after.height} px)`);
                await context.close();
            }
        }
        {
            const { page, close } = await open(browser, `${base}/reserve`, false);
            const line = await page.textContent('.reserve-verify').catch(() => '');
            const href = await page.getAttribute('.reserve-verify a', 'href').catch(() => '');
            check(/Verify it yourself/.test(line || '') && /5[1-9A-HJ-NP-Za-km-z]{47}/.test(line || '') && /taostats\.io\/account\//.test(href || ''), '/reserve without JavaScript says where its figures come from and where to check them');
            await close();
        }
    } finally {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
    }
    if (failures.length) {
        console.error(`\nstatic-affordances: ${failures.length} failure(s)`);
        process.exit(1);
    }
    console.log('\nstatic-affordances: OK');
}

main().catch((error) => {
    console.error(`static-affordances: ${error.message}`);
    process.exit(1);
});
