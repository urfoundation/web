// Redirect loops, in a browser, against the site's own nginx.
//
// Two things send a visitor between a page's English URL and its /<lang>/
// twin: the stored-language redirect in the head of a translated English page
// (astro/src/lib/route-localization.js) and nginx's localized-page rules
// (web/web/nginx/nginx.conf.j2). Each is right alone. Together they looped,
// about 125 navigations a second: on every missing page under /docs/, /ctf/
// and /investors/ for a visitor with a stored language (the not-found page
// carried the redirect, and nginx sent /<lang>/<miss> back to English), and on
// real pages for a returning visitor whose browser kept a 301 to English from
// the config before the pages were translated. A unit test sees one side; this
// runs both. It starts the ur.xyz server block of nginx.conf.j2 over the build
// (as web/web/legacy_redirect_test.py runs the legacy one) and drives headless
// Chromium through it. Nothing leaves the machine: Chromium sends every request
// that is not to the local nginx to a local proxy that refuses it, and
// resolves no host name.
//
// For every family of pages (the home page and the sections, and each page
// group: about, build, capture the flag and its country pages, the dashboard,
// the docs with their miner and support chapters, the legal pages, the
// investor pages, mainnet, the not-found page, price, the research pages and
// reserve):
//   - with each language stored (the visitor's explicit choice), a real page
//     settles in at most one redirect, in the stored language when it has
//     translations, and so does its /<lang>/ twin, in its own; a missing page
//     settles in at most one redirect as a 404 page in its URL's language;
//   - the language switcher on a missing page settles, in the chosen language;
//   - a profile holding the 301s of the config before the pages were
//     translated (web 7aaef8b9^1) settles too, on every real page, and reaches
//     the translation;
// and a retired URL goes to its successor in its own language, in one
// redirect, and a translation's link to its English original keeps the
// English page, followed in the tab or opened in another.
// A page settles when no navigation follows its last one for QUIET_MS; a loop
// never does. Each settled page is watched CONFIRM_MS longer, so a slow loop
// (one a script starts after the page loads) fails too.
//
// Needs nginx (brew install nginx; apt-get install nginx-light) and the
// Chromium of `make install-playwright-browser`.
//
// Usage: node tests/redirect-loops.mjs [buildDir] [--conf path/to/nginx.conf.j2]
//   buildDir defaults to ../astro/build/main; the config to web/web's.
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    LANG_STORAGE_KEY,
    NON_EN_SITE_LANG_CODES,
    NOT_FOUND_PATH,
    PAGE_GROUPS,
    SECTION_BASE_PATHS,
    SITE_LANG_CODES,
    hasLocalizedVersion,
} from '../../astro/src/lib/route-localization.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');

const argv = process.argv.slice(2);
const confAt = argv.indexOf('--conf');
const CONF = path.resolve(confAt >= 0 ? argv[confAt + 1] : path.join(REPO, 'web/nginx/nginx.conf.j2'));
const BUILD = path.resolve(argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--conf')[0] || path.join(__dirname, '../../astro/build/main'));
const MIME = path.join(REPO, 'web/nginx/mime.types');

// A page has settled when no navigation follows its last one for this long. The
// stored-language redirect runs in the head, before the first paint.
const QUIET_MS = 400;
// how long a settled page is watched for one more navigation
const CONFIRM_MS = 1500;
// how long a case may take before it counts as unsettled (a loop is found
// sooner, by its count of navigations)
const BUDGET_MS = 15000;
// more navigations than this in one case is a loop
const LOOP_NAVIGATIONS = 12;
const WORKERS = Math.max(2, Math.min(10, os.availableParallelism?.() || os.cpus().length));
const MISSING = 'no-such-page';
const VIEWPORT = { width: 1280, height: 900 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const twin = (lang, base) => (lang === 'en' ? base : base === '/' ? `/${lang}` : `/${lang}${base}`);
const pathOf = (url) => { try { return new URL(url).pathname; } catch { return url; } };

// ── nginx ────────────────────────────────────────────────────────────────────

// The nginx block that starts at `start`: from its { to the matching }, braces
// in quoted strings and comments aside.
function nginxBlock(source, start) {
    let depth = 0;
    let quote = null;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
        const c = source[i];
        if (quote) {
            if (c === '\\') i++;
            else if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '#') i = source.indexOf('\n', i);
        else if (c === '{') depth++;
        else if (c === '}' && --depth === 0) return source.slice(start, i + 1);
        if (i < 0) break;
    }
    throw new Error(`${CONF}: an unterminated block at ${start}`);
}

function substitute(text, from, to, what) {
    if (!text.includes(from)) throw new Error(`${CONF}: the ur.xyz server block has no ${what} (${from})`);
    return text.split(from).join(to);
}

// The http-level maps and the ur.xyz server block of nginx.conf.j2, listening
// on 127.0.0.1:port, serving `root`. Its absolute redirects (https://$host…)
// name the local server instead, so the browser follows them here.
function urXyzConfig(source, port, root) {
    const maps = [...source.matchAll(/^ {4}map [^\n]*\{/gm)].map((m) => nginxBlock(source, m.index));
    const marker = source.indexOf('server_name ur.xyz preview.ur.xyz;');
    if (marker < 0) throw new Error(`${CONF}: no ur.xyz server block`);
    let server = nginxBlock(source, source.lastIndexOf('server {', marker));
    server = substitute(server, 'listen 80;', `listen 127.0.0.1:${port};`, 'listen 80');
    server = substitute(server, 'root /www/preview.ur.xyz;', `root ${root};`, 'root');
    server = substitute(server, 'https://$host', 'http://$http_host', 'absolute redirect');
    return `${maps.join('\n')}\n${server}`;
}

// The localized rules of nginx.conf.j2 before the pages were translated (web
// 7aaef8b9^1), as they were: each sent /<lang>/<page> to the English page with
// a 301 and no Cache-Control, which browsers keep. A returning visitor's
// browser may hold them for any page it followed one from.
function oldConfig(port, root) {
    return `
server {
    listen 127.0.0.1:${port};
    absolute_redirect off;
    root ${root};
    error_page 404 /404.html;
    location = / {
        try_files /index.html =404;
    }
    location ~ ^/(?:(?:ru|ar|zh|de|es)(?:/docs/legal)?|docs/legal)/(?<legal_doc>terms|privacy|vdp)(?:\\.html|/)?$ {
        return 301 /$legal_doc;
    }
    location ~ ^/(?:ru|ar|zh|de|es)/docs(?<docpath>/.*?[^/])?(?:\\.html|/+)?$ {
        return 301 /docs$docpath;
    }
    location ~ ^/(?:ru|ar|zh|de|es)/(?<en_page>about|build|ctf|investors|mainnet|price|reserve)(?<en_rest>/.*)?$ {
        return 301 /$en_page$en_rest$is_args$args;
    }
    location ~ ^/(?:ru|ar|zh|de|es)/research/(?<en_report>[^/]+?)(?:\\.html|/)?$ {
        return 301 /research/$en_report$is_args$args;
    }
    location / {
        try_files $uri $uri.html =404;
    }
}`;
}

function nginxBinary() {
    if (process.env.NGINX) return process.env.NGINX;
    const found = spawnSync('sh', ['-c', 'command -v nginx'], { encoding: 'utf8' });
    return found.status === 0 ? found.stdout.trim() : null;
}

function waitForPort(port, timeoutMs = 10000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const socket = net.connect(port, '127.0.0.1');
            socket.once('connect', () => { socket.destroy(); resolve(); });
            socket.once('error', () => {
                socket.destroy();
                if (Date.now() - start > timeoutMs) reject(new Error(`nginx did not listen on 127.0.0.1:${port}`));
                else setTimeout(attempt, 50);
            });
        };
        attempt();
    });
}

// Runs `body` (an http block's servers and maps) in a private nginx; resolves
// to a handle whose stop() ends it.
async function startNginx(binary, dir, port, body) {
    mkdirSync(dir, { recursive: true });
    const conf = path.join(dir, 'nginx.conf');
    writeFileSync(conf, [
        'daemon off;',
        'master_process off;',
        `pid ${dir}/nginx.pid;`,
        `error_log ${dir}/error.log;`,
        'events {}',
        'http {',
        '    access_log off;',
        `    include ${MIME};`,
        '    default_type application/octet-stream;',
        ...['client_body', 'proxy', 'fastcgi', 'uwsgi', 'scgi'].map((t) => `    ${t}_temp_path ${dir}/${t};`),
        body,
        '}',
        '',
    ].join('\n'));
    const child = spawn(binary, ['-p', dir, '-e', `${dir}/error.log`, '-c', conf], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });
    const exited = new Promise((resolve) => child.once('exit', resolve));
    await Promise.race([
        waitForPort(port),
        exited.then((code) => { throw new Error(`nginx exited (${code}): ${stderr || readFileSync(path.join(dir, 'error.log'), 'utf8')}`); }),
    ]);
    return {
        async stop() {
            if (child.exitCode === null) child.kill('SIGTERM');
            await exited;
        },
    };
}

function freePort() {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

// The proxy Chromium sends everything but 127.0.0.1 to: it refuses each
// request and counts it by host.
async function startSink() {
    const blocked = new Map();
    const server = net.createServer((socket) => {
        socket.on('error', () => {});
        socket.once('data', (chunk) => {
            const target = chunk.toString('latin1').split('\r\n', 1)[0].split(' ')[1] || '?';
            let host = target.replace(/:\d+$/, '');
            try { if (/^[a-z]+:\/\//i.test(target)) host = new URL(target).hostname; } catch { /* as written */ }
            blocked.set(host, (blocked.get(host) || 0) + 1);
            socket.end('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return { port: server.address().port, blocked, close: () => new Promise((resolve) => server.close(resolve)) };
}

// ── the browser ──────────────────────────────────────────────────────────────

function chromiumArgs(sinkPort) {
    return [
        `--proxy-server=http://127.0.0.1:${sinkPort}`,
        '--proxy-bypass-list=127.0.0.1',
        '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
    ];
}

const launchOptions = (sinkPort) => ({
    headless: true,
    args: chromiumArgs(sinkPort),
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
});

// The document is parsed: the stored-language redirect, in its head, has had
// its turn. A navigation a script starts later is caught by confirm().
async function loaded(page) {
    try {
        return await page.evaluate(() => document.readyState !== 'loading');
    } catch {
        return false; // between documents
    }
}

// Starts a navigation with `navigate` and waits until the page settles: no
// main-frame navigation for QUIET_MS, the document parsed. Returns the chain
// of main-frame requests (each HTTP redirect and each scripted redirect is
// one), where it ended, its status and its <html lang>, and confirm(), which
// watches the page CONFIRM_MS longer and marks the outcome unsettled, with the
// late navigations, if it moved.
async function settle(page, navigate) {
    const requests = [];
    let last = Date.now();
    const onRequest = (request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
            requests.push(request);
            last = Date.now();
        }
    };
    const onCommit = (frame) => { if (frame === page.mainFrame()) last = Date.now(); };
    const detach = () => {
        page.off('request', onRequest);
        page.off('framenavigated', onCommit);
    };
    page.on('request', onRequest);
    page.on('framenavigated', onCommit);
    let looped = false;
    try {
        await navigate();
        const start = Date.now();
        last = Math.max(last, start);
        for (;;) {
            await sleep(50);
            if (requests.length > LOOP_NAVIGATIONS) { looped = true; break; }
            if (Date.now() - start > BUDGET_MS) break;
            if (Date.now() - last >= QUIET_MS && await loaded(page)) break;
        }
    } catch (error) {
        detach();
        throw error;
    }
    const response = requests.length ? await requests.at(-1).response().catch(() => null) : null;
    const outcome = {
        settled: !looped && Date.now() - last >= QUIET_MS,
        looped,
        redirects: Math.max(0, requests.length - 1),
        chain: requests.map((r) => pathOf(r.url())),
        status: response ? response.status() : null,
        path: pathOf(page.url()),
        lang: await page.evaluate(() => document.documentElement.lang).catch(() => null),
    };
    const settledAt = requests.length;
    outcome.confirm = async () => {
        if (outcome.settled) await sleep(CONFIRM_MS);
        detach();
        if (requests.length > settledAt) {
            outcome.settled = false;
            outcome.late = requests.slice(settledAt).map((r) => pathOf(r.url()));
        }
        return outcome;
    };
    return outcome;
}

// Problems with a case's outcome, none when it met its expectations: each
// { what, text }, `what` naming the kind of problem for the summary.
function judge(expect, outcome) {
    const problems = [];
    const chain = outcome.chain.slice(0, 6).join(' → ') + (outcome.chain.length > 6 ? ' → …' : '');
    if (outcome.looped) problems.push({ what: 'loops', text: `${outcome.chain.length}+ navigations within seconds: ${chain}` });
    else if (outcome.late) problems.push({ what: 'moves again after settling', text: `${chain}, then ${outcome.late.join(' → ')}` });
    else if (!outcome.settled) problems.push({ what: 'never settles', text: `still navigating after ${BUDGET_MS / 1000} s: ${chain}` });
    else if (outcome.redirects > expect.maxRedirects) problems.push({ what: `more than ${expect.maxRedirects} redirect(s)`, text: chain });
    if (!outcome.looped && outcome.settled) {
        if (expect.path && outcome.path !== expect.path) problems.push({ what: 'ends on another page', text: `${chain}, not ${expect.path}` });
        if (expect.status && outcome.status !== expect.status) problems.push({ what: `ends with another status than ${expect.status}`, text: `${outcome.status}` });
        if (expect.lang && outcome.lang !== expect.lang) problems.push({ what: 'ends in another language', text: `lang "${outcome.lang}", not "${expect.lang}"` });
    }
    return problems;
}

async function storeLanguage(page, origin, stored) {
    if (!stored) return;
    await page.goto(`${origin}/robots.txt`);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [LANG_STORAGE_KEY, stored]);
}

// Opens the nav's language menu on a hydrated page and picks `lang`.
async function chooseLanguage(page, lang) {
    const label = lang.toUpperCase();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
        const toggle = page.locator('.nav-lang-toggle').first();
        await toggle.click({ timeout: 2000 }).catch(() => {});
        const option = page.locator('.nav-lang-menu button').filter({ has: page.locator(`span:text-is("${label}")`) }).first();
        if (await option.isVisible().catch(() => false)) {
            await option.click({ noWaitAfter: true });
            return;
        }
        await sleep(200); // the nav hydrates on idle
    }
    throw new Error('the language switcher did not open');
}

// Runs `cases` through `run` with WORKERS at a time.
async function pool(cases, run) {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(WORKERS, cases.length) }, async () => {
        while (next < cases.length) await run(cases[next++]);
    }));
}

// ── the cases ────────────────────────────────────────────────────────────────

// The families of pages: for each, a page the build has (null for the
// not-found family) and a URL that is no page. A family one segment under a
// prefix (/ctf/*) takes a page the build has there, a sample when the group
// names one.
function families() {
    const out = SECTION_BASE_PATHS.map((base) => ({
        family: base === '/' ? 'home' : base,
        real: base,
        missing: base === '/' ? `/${MISSING}` : `${base}/${MISSING}`,
    }));
    for (const [id, group] of Object.entries(PAGE_GROUPS)) {
        for (const p of group.paths) {
            if (p === NOT_FOUND_PATH) {
                out.push({ family: `${id} ${p}`, real: null, missing: `/${MISSING}` });
            } else if (p.endsWith('/*')) {
                const dir = p.slice(0, -2);
                const sample = (group.samples || []).find((s) => s.startsWith(`${dir}/`) && !s.slice(dir.length + 1).includes('/'));
                const built = readdirSync(path.join(BUILD, dir)).filter((f) => f.endsWith('.html')).sort().map((f) => `${dir}/${f.slice(0, -5)}`);
                if (!built.length) throw new Error(`${BUILD}: no page under ${dir}/ for page group ${id}`);
                out.push({ family: `${id} ${p}`, real: sample || built[0], missing: `${dir}/${MISSING}` });
            } else {
                out.push({ family: `${id} ${p}`, real: p, missing: `${p}/${MISSING}` });
            }
        }
    }
    // directories of the build that are no page, and the docs' retired legal corpus
    out.push({ family: 'docs (a directory)', real: null, missing: '/docs/support' });
    out.push({ family: 'docs/legal', real: null, missing: '/docs/legal' });
    return out;
}

// Where a page's URL in `lang` leads: its twin when it has translations (a
// group not yet localized has none), else the English page, and the language
// it is read in there.
const landing = (base, lang) => (hasLocalizedVersion(base) ? { path: twin(lang, base), lang } : { path: base, lang: 'en' });
// the language a 404 under /<lang>/ is rendered in: that language's not-found page when the build has it
const notFoundLang = (lang) => (lang === 'en' || existsSync(path.join(BUILD, lang, '404.html')) ? lang : 'en');

// Retired URLs and their successors (nginx.conf.j2): a retired URL in a
// language leads to the successor in that language.
const RETIRED = [
    ['/providers', '/miners'],
    ['/community', '/about'],
    ['/api', '/docs'],
    ['/roadmap', '/investors'],
    ['/whitepaper', '/docs/litepaper'],
    ['/docs/provider', '/docs/miner'],
    ['/docs/cli', '/docs/miner'],
    ['/docs/trust-and-safety/trust-and-safety', '/docs/miner'],
    ['/docs/archive/whitepaper', '/docs/litepaper'],
    ['/docs/protocol/protocol-research', '/research'],
    ['/docs/economic-model', '/docs'],
    ['/docs/whitepaper', '/docs/litepaper'],
    ['/docs/legal/terms', '/terms'],
    ['/investors/august-investment-letter', '/investors/our-letter-to-bittensor'],
];

function storedCases(list) {
    const cases = [];
    const other = (lang) => SITE_LANG_CODES[(SITE_LANG_CODES.indexOf(lang) + 1) % SITE_LANG_CODES.length];
    for (const f of list) {
        for (const stored of SITE_LANG_CODES) {
            if (f.real) {
                cases.push({ kind: 'a real page', family: f.family, url: f.real, stored, expect: { maxRedirects: 1, ...landing(f.real, stored), status: 200 } });
            }
            cases.push({ kind: 'a missing page', family: f.family, url: f.missing, stored, expect: { maxRedirects: 1, path: f.missing, lang: 'en', status: 404 } });
        }
        for (const lang of NON_EN_SITE_LANG_CODES) {
            // a /<lang>/ URL names its language, whatever the visitor stored
            if (f.real) {
                cases.push({ kind: 'a real page', family: f.family, url: twin(lang, f.real), stored: other(lang), expect: { maxRedirects: 1, ...landing(f.real, lang), status: 200 } });
            }
            cases.push({ kind: 'a missing page', family: f.family, url: twin(lang, f.missing), stored: lang, expect: { maxRedirects: 1, path: twin(lang, f.missing), lang: notFoundLang(lang), status: 404 } });
        }
    }
    for (const [old, successor] of RETIRED) {
        for (const lang of NON_EN_SITE_LANG_CODES) {
            cases.push({ kind: 'a retired URL', family: old, url: twin(lang, old), stored: lang, expect: { maxRedirects: hasLocalizedVersion(successor) ? 1 : 2, ...landing(successor, lang), status: 200 } });
        }
        // in English, nginx's 301 and then the stored-language redirect
        cases.push({ kind: 'a retired URL', family: old, url: old, stored: 'de', expect: { maxRedirects: 2, ...landing(successor, 'de'), status: 200 } });
    }
    return cases;
}

function switcherCases(list) {
    const cases = [];
    for (const f of list) {
        for (const lang of NON_EN_SITE_LANG_CODES) {
            cases.push({ kind: 'the language switcher on a missing page', family: f.family, url: f.missing, choose: lang, expect: { maxRedirects: 1, lang } });
        }
        // from a translated missing page, to English and to another language
        for (const lang of ['en', 'ar']) {
            cases.push({ kind: 'the language switcher on a missing page', family: f.family, url: twin('de', f.missing), choose: lang, expect: { maxRedirects: 1, lang } });
        }
    }
    return cases;
}

// The English original a translated document links (the legal pages, an
// investor document): followed in the tab, the click records the choice of
// English; opened in another tab, the referrer says where the visitor came
// from. Either way the English page stays, with the translation's language
// stored.
const ORIGINALS = ['/terms', '/privacy', '/vdp', '/investors/deck'];
function originalCases() {
    const cases = [];
    for (const base of ORIGINALS.filter((b) => hasLocalizedVersion(b))) {
        for (const lang of NON_EN_SITE_LANG_CODES) {
            const expect = { maxRedirects: 0, path: base, lang: 'en', status: 200 };
            cases.push({ kind: "a translation's link to its English original", family: `${base}, followed`, url: twin(lang, base), stored: lang, click: 'main a[hreflang="en"]:not([download])', expect });
            cases.push({ kind: "a translation's link to its English original", family: `${base}, in a new tab`, url: base, stored: lang, referer: twin(lang, base), expect });
        }
    }
    return cases;
}

// ── the run ──────────────────────────────────────────────────────────────────

const results = new Map(); // kind -> { total, failures: [] }
function record(c, problems) {
    if (!results.has(c.kind)) results.set(c.kind, { total: 0, failures: [] });
    const r = results.get(c.kind);
    r.total += 1;
    if (problems.length) r.failures.push({ c, problems });
}

// The settled pages being watched for one more navigation (settle's confirm),
// each recording its case when done.
let watching = [];
const watch = (c, outcome, after) => {
    watching.push(outcome.confirm()
        .then((o) => record(c, judge(c.expect, o)))
        .catch((error) => record(c, [{ what: 'fails to run', text: error.message.split('\n')[0] }]))
        .finally(after));
};
async function watched() {
    while (watching.length) {
        const now = watching;
        watching = [];
        await Promise.all(now);
    }
}

async function freshCase(browser, origin, c) {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const close = () => context.close().catch(() => {});
    try {
        const page = await context.newPage();
        await storeLanguage(page, origin, c.stored);
        let outcome;
        if (c.choose) {
            await page.goto(origin + c.url);
            outcome = await settle(page, () => chooseLanguage(page, c.choose));
        } else if (c.click) {
            await page.goto(origin + c.url);
            outcome = await settle(page, () => page.locator(c.click).first().click({ noWaitAfter: true, timeout: 5000 }));
        } else {
            const referer = c.referer ? origin + c.referer : undefined;
            outcome = await settle(page, () => page.goto(origin + c.url, { waitUntil: 'commit', timeout: BUDGET_MS, referer }).catch(() => {}));
        }
        watch(c, outcome, close);
    } catch (error) {
        record(c, [{ what: 'fails to run', text: error.message.split('\n')[0] }]);
        await close();
    }
}

// The returning visitor: a profile that followed /<lang>/<page> under the old
// config, then, the language stored, visits the pages under this one.
async function cachedCases(binary, work, sinkPort, list) {
    const kind = 'a returning visitor with the old 301s cached';
    const port = await freePort();
    const origin = `http://127.0.0.1:${port}`;
    const profile = path.join(work, 'profile');
    const real = list.filter((f) => f.real).map((f) => f.real);
    let bounced = 0;

    const old = await startNginx(binary, path.join(work, 'nginx-old'), port, oldConfig(port, BUILD));
    try {
        const context = await chromium.launchPersistentContext(profile, { ...launchOptions(sinkPort), viewport: VIEWPORT });
        try {
            const visits = NON_EN_SITE_LANG_CODES.flatMap((lang) => real.map((p) => twin(lang, p)));
            await pool(visits, async (url) => {
                const page = await context.newPage();
                await page.goto(origin + url).catch(() => {});
                await page.close().catch(() => {});
            });
        } finally {
            await context.close().catch(() => {});
        }
    } finally {
        await old.stop();
    }

    const current = await startNginx(binary, path.join(work, 'nginx-new'), port, urXyzConfig(readFileSync(CONF, 'utf8'), port, BUILD));
    try {
        const context = await chromium.launchPersistentContext(profile, { ...launchOptions(sinkPort), viewport: VIEWPORT });
        try {
            for (const lang of NON_EN_SITE_LANG_CODES) {
                const first = context.pages()[0] || await context.newPage();
                await storeLanguage(first, origin, lang);
                // a page's English URL, and its /<lang>/ URL, which the cache
                // sends to English: both end on the translation, past the cache
                const cases = real.flatMap((p) => [p, twin(lang, p)].map((url) => (
                    { kind, family: p, url, stored: lang, expect: { maxRedirects: 4, ...landing(p, lang), status: 200 } })));
                await pool(cases, async (c) => {
                    const page = await context.newPage();
                    try {
                        const outcome = await settle(page, () => page.goto(origin + c.url, { waitUntil: 'commit', timeout: BUDGET_MS }).catch(() => {}));
                        // the cache sent the visitor from the page's /<lang>/ URL back to English
                        if (outcome.chain.some((step, i) => step === twin(lang, c.family) && outcome.chain[i + 1] === c.family)) bounced += 1;
                        watch(c, outcome, () => page.close().catch(() => {}));
                    } catch (error) {
                        record(c, [{ what: 'fails to run', text: error.message.split('\n')[0] }]);
                        await page.close().catch(() => {});
                    }
                });
                // the next language is stored in the same profile
                await watched();
            }
        } finally {
            await context.close().catch(() => {});
        }
    } finally {
        await current.stop();
    }
    // Without a 301 from the cache, these cases prove nothing: the profile
    // must have kept the old config's.
    if (!bounced) record({ kind, family: 'the profile' }, [{ what: 'kept no 301 of the old config', text: 'no case went from /<lang>/<page> to the English page' }]);
    else results.get(kind).note = `the cached 301s sent ${bounced} back to English`;
}

async function main() {
    if (!existsSync(path.join(BUILD, 'index.html'))) {
        console.error(`redirect-loops: no build at ${BUILD} (make build-main, or pass the build directory)`);
        process.exit(2);
    }
    const binary = nginxBinary();
    if (!binary) {
        console.error('redirect-loops: needs nginx to run the site\'s server block (brew install nginx; apt-get install nginx-light), or NGINX=/path/to/nginx');
        process.exit(1);
    }
    const started = Date.now();
    const work = mkdtempSync(path.join(os.tmpdir(), 'ur-redirect-loops-'));
    const sink = await startSink();
    const list = families();
    try {
        const port = await freePort();
        const origin = `http://127.0.0.1:${port}`;
        const nginx = await startNginx(binary, path.join(work, 'nginx'), port, urXyzConfig(readFileSync(CONF, 'utf8'), port, BUILD));
        try {
            const browser = await chromium.launch(launchOptions(sink.port));
            try {
                await pool([...storedCases(list), ...switcherCases(list), ...originalCases()], (c) => freshCase(browser, origin, c));
                await watched();
            } finally {
                await browser.close().catch(() => {});
            }
        } finally {
            await nginx.stop();
        }
        await cachedCases(binary, work, sink.port, list);
    } finally {
        await sink.close();
        rmSync(work, { recursive: true, force: true });
    }

    const shown = (file) => (file.startsWith(`${REPO}${path.sep}`) ? path.relative(REPO, file) : file);
    console.log(`redirect-loops: ${shown(CONF)} over ${shown(BUILD)}, ${list.length} families of pages`);
    let failed = 0;
    for (const [kind, r] of results) {
        failed += r.failures.length;
        console.log(`  ${r.failures.length ? '✗' : '✓'} ${kind}: ${r.total - r.failures.length} of ${r.total} as expected${r.note ? ` (${r.note})` : ''}`);
        // the failures by what went wrong, with a few examples each
        const byWhat = new Map();
        for (const { c, problems } of r.failures) {
            for (const problem of problems) {
                if (!byWhat.has(problem.what)) byWhat.set(problem.what, []);
                byWhat.get(problem.what).push({ c, problem });
            }
        }
        for (const [what, found] of byWhat) {
            const families = [...new Set(found.map(({ c }) => c.family))];
            console.log(`      ${found.length} ${what}, in ${families.length} famil${families.length === 1 ? 'y' : 'ies'} (${families.slice(0, 8).join(', ')}${families.length > 8 ? ', …' : ''}), e.g.`);
            // an example from each of the first families
            for (const { c, problem } of families.slice(0, 3).map((family) => found.find(({ c: x }) => x.family === family))) {
                const how = c.choose ? `chose ${c.choose.toUpperCase()} on ${c.url}`
                    : c.click ? `followed the English link on ${c.url}${c.stored ? ` with ${c.stored} stored` : ''}`
                        : `${c.url}${c.referer ? ` from ${c.referer}` : ''}${c.stored ? ` with ${c.stored} stored` : ''}`;
                console.log(`        ${c.family}: ${how}: ${problem.text}`);
            }
        }
    }
    const hosts = [...sink.blocked.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`  blocked ${hosts.reduce((n, [, count]) => n + count, 0)} requests off the machine${hosts.length ? ` (${hosts.slice(0, 6).map(([h, n]) => `${h} ${n}`).join(', ')}${hosts.length > 6 ? ', …' : ''})` : ''}; ${Math.round((Date.now() - started) / 1000)} s`);
    if (failed) {
        console.log(`\n✗ redirect-loops: ${failed} case(s) did not settle as expected`);
        process.exit(1);
    }
    console.log('\n✓ redirect-loops: every page settles');
}

main().catch((error) => {
    console.error('redirect-loops error:', error);
    process.exit(1);
});
