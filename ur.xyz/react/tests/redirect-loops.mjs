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
// A loop fails its case at once: more than LOOP_NAVIGATIONS navigations, or
// more than BOUNCES returns from a page's translation to the page, however
// slowly they come. A case that only ran out of time (still navigating after
// BUDGET_MS, or a step before that timing out, in no more navigations than it
// may take) runs again once the rest are done, alone and with the same
// budget, and fails only if it fails again: on a busy machine a page can take
// that long to load. The cases run WORKERS at a time, fewer when the machine
// is already busy.
//
// Needs nginx (brew install nginx; apt-get install nginx-light) and the
// Chromium of `make install-playwright-browser`.
//
// Usage: node tests/redirect-loops.mjs [buildDir] [--conf path/to/nginx.conf.j2] [--overlay dir]
//   buildDir defaults to ../astro/build/main; the config to web/web's.
//   --overlay serves a copy of the build with the files of dir laid over it.
//   tests/fixtures/redirect-loops holds pages that loop on purpose, and the
//   gate must fail on them:
//     node tests/redirect-loops.mjs ../astro/build/main --overlay tests/fixtures/redirect-loops
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { constants, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    LANG_REDIRECT_GUARD_MS,
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
function option(name) {
    if (!argv.includes(name)) return null;
    const value = argv[argv.indexOf(name) + 1];
    if (!value || value.startsWith('--')) {
        console.error(`redirect-loops: ${name} needs a path`);
        process.exit(2);
    }
    return path.resolve(value);
}
const CONF = option('--conf') || path.join(REPO, 'web/nginx/nginx.conf.j2');
const OVERLAY = option('--overlay');
const SOURCE = path.resolve(argv.filter((a, i) => !a.startsWith('--') && !['--conf', '--overlay'].includes(argv[i - 1]))[0] || path.join(__dirname, '../../astro/build/main'));
// the directory nginx serves: the build, or with --overlay its copy in the work directory
let BUILD = SOURCE;
const MIME = path.join(REPO, 'web/nginx/mime.types');

// A page has settled when no navigation follows its last one for this long. The
// stored-language redirect runs in the head, before the first paint.
const QUIET_MS = 400;
// how long a settled page is watched for one more navigation
const CONFIRM_MS = 1500;
// how long a case may take before it counts as unsettled (a loop is found
// sooner, by its count of navigations or of bounces)
const BUDGET_MS = 15000;
// more navigations than this in one case is a loop
const LOOP_NAVIGATIONS = 12;
// More returns than this from a page's translation to the page, in one case,
// is a loop. The stored-language redirect's recovery from a cached 301
// (storedLanguageRedirectScript) takes one: the redirect, the 301 back, then
// once more at <target>?, an address no cached 301 matches. As the script
// does, a return counts only within LANG_REDIRECT_GUARD_MS of the redirect.
const BOUNCES = 1;
// At most this many cases that ran out of time run again in one run: more
// than that is no busy machine but a fault, and they fail as they are.
const RETRY_LIMIT = 20;
// Cases run WORKERS at a time: one per CPU, 2 to 10, and fewer on a machine
// already busy, where a page can take longer than BUDGET_MS to load. Above a
// one-minute load average of half the CPUs the count falls with the load, to
// 2 when the load reaches the CPU count. The load is read as the gate starts,
// before its own.
const CPUS = os.availableParallelism?.() || os.cpus().length;
const LOAD = os.loadavg()[0];
const WORKERS = Math.max(2, Math.round(Math.min(10, CPUS) * Math.min(1, Math.max(0, 2 * (1 - LOAD / CPUS)))));
const MISSING = 'no-such-page';
const VIEWPORT = { width: 1280, height: 900 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const twin = (lang, base) => (lang === 'en' ? base : base === '/' ? `/${lang}` : `/${lang}${base}`);
const pathOf = (url) => { try { return new URL(url).pathname; } catch { return url; } };

// A path as a page and the language it names: /de/docs/miner/ is /docs/miner
// in de, /about.html is /about in en.
const LANG_PREFIX = new RegExp(`^/(${NON_EN_SITE_LANG_CODES.join('|')})(?=/|$)`);
function pageOf(p) {
    const bare = p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const prefix = LANG_PREFIX.exec(bare);
    return prefix ? { page: bare.slice(prefix[0].length) || '/', lang: prefix[1] } : { page: bare, lang: 'en' };
}

// How many times a chain of paths came back from a page's translation to the
// page after a step from the page to that translation. `times` holds when
// each step was requested. A case that starts on the translation and is sent
// to English has not bounced yet. As in the site's script, a return counts
// only when the page decides within LANG_REDIRECT_GUARD_MS of that step:
// when its next step is requested, or `now` while none has followed. Later,
// the script starts afresh, and so does the count.
function bounces(chain, times, now) {
    const left = new Map(); // English pages the chain stepped from to a translation, and when
    let count = 0;
    for (let i = 1; i < chain.length; i++) {
        const from = pageOf(chain[i - 1]);
        const to = pageOf(chain[i]);
        if (from.page !== to.page || from.lang === to.lang) continue;
        if (from.lang === 'en') left.set(from.page, times[i]);
        else if (to.lang === 'en' && left.has(to.page) && (times[i + 1] ?? now) - left.get(to.page) < LANG_REDIRECT_GUARD_MS) count += 1;
    }
    return count;
}

// Whether a case's navigations are a loop already: false, or by which rule
// and how many navigations or bounces.
function loops(chain, times, now) {
    if (chain.length > LOOP_NAVIGATIONS) return { rule: 'navigations', count: chain.length };
    const count = bounces(chain, times, now);
    return count > BOUNCES ? { rule: 'bounces', count } : false;
}

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
// main-frame navigation for QUIET_MS, the page showing the document it last
// asked for (on a busy machine one can take longer than QUIET_MS to arrive,
// while the one before it has long been parsed), that document parsed. Stops
// at once at a loop (`looped`, from loops()). Returns the chain of main-frame
// requests (each HTTP redirect and each scripted redirect is one), where it
// ended, its status and its <html lang>, and confirm(), which watches the page
// CONFIRM_MS longer and marks the outcome unsettled, with the late
// navigations, if it moved, and looped if they made a loop; an unsettled
// chain takes in the requests that came after the wait.
async function settle(page, navigate) {
    const requests = [];
    const times = []; // when each request was made
    let last = Date.now();
    const onRequest = (request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
            requests.push(request);
            last = Date.now();
            times.push(last);
        }
    };
    const onCommit = (frame) => { if (frame === page.mainFrame()) last = Date.now(); };
    const detach = () => {
        page.off('request', onRequest);
        page.off('framenavigated', onCommit);
    };
    page.on('request', onRequest);
    page.on('framenavigated', onCommit);
    const chainOf = () => requests.map((r) => pathOf(r.url()));
    const loopOf = (chain) => loops(chain, times, Date.now());
    // a navigation was made, and the page shows its document (or Chromium's error page for it)
    const arrived = () => requests.length > 0
        && (page.url().startsWith('chrome-error:') || pathOf(page.url()) === pathOf(requests.at(-1).url()));
    const quiet = () => Date.now() - last >= QUIET_MS && arrived();
    let looped = false;
    let settled = false;
    try {
        await navigate();
        const start = Date.now();
        last = Math.max(last, start);
        for (;;) {
            await sleep(50);
            looped = loopOf(chainOf());
            if (looped) break;
            const seen = requests.length;
            settled = quiet();
            if (Date.now() - start > BUDGET_MS) break;
            // and still so once the document has answered: no navigation began meanwhile
            if (settled && await loaded(page) && requests.length === seen && quiet()) break;
        }
    } catch (error) {
        detach();
        throw error;
    }
    const settledAt = requests.length;
    const chain = chainOf();
    const response = requests.length ? await requests.at(-1).response().catch(() => null) : null;
    const outcome = {
        settled: !looped && settled,
        looped,
        redirects: Math.max(0, chain.length - 1),
        chain,
        status: response ? response.status() : null,
        path: pathOf(page.url()),
        lang: await page.evaluate(() => document.documentElement.lang).catch(() => null),
    };
    outcome.confirm = async () => {
        if (outcome.settled) await sleep(CONFIRM_MS);
        detach();
        const chain = chainOf();
        if (!outcome.settled) {
            // still navigating when the wait ended: what came since is the same chain
            outcome.chain = chain;
            outcome.redirects = Math.max(0, chain.length - 1);
            outcome.looped ||= loopOf(chain);
        } else if (chain.length > settledAt) {
            outcome.settled = false;
            outcome.late = chain.slice(settledAt);
            outcome.looped ||= loopOf(chain);
        }
        return outcome;
    };
    return outcome;
}

// Problems with a case's outcome, none when it met its expectations: each
// { what, text }, `what` naming the kind of problem for the summary.
function judge(expect, outcome) {
    const problems = [];
    const steps = (list) => list.slice(0, 6).join(' → ') + (list.length > 6 ? ' → …' : '');
    const chain = steps(outcome.chain);
    const all = [...outcome.chain, ...(outcome.late || [])];
    if (outcome.looped?.rule === 'bounces') problems.push({ what: 'loops', text: `back to the page from its translation ${outcome.looped.count} times, where the recovery from a cached 301 takes ${BOUNCES}: ${steps(all)}` });
    else if (outcome.looped) problems.push({ what: 'loops', text: `${all.length}+ navigations within seconds: ${steps(all)}` });
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
    throw Object.assign(new Error('the language switcher did not open in 8 s'), { name: 'TimeoutError' });
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

const results = new Map(); // kind -> { total, failures: [], again: count that ran as expected on their second run }
function record(c, problems) {
    if (!results.has(c.kind)) results.set(c.kind, { total: 0, failures: [], again: 0 });
    const r = results.get(c.kind);
    r.total += 1;
    if (problems.length) r.failures.push({ c, problems });
    else if (c.first) r.again += 1;
}

// The cases that only ran out of time, to run again once the rest are done
// (runAgain); each case run again, with what its first run found; and how
// many ran out of time past RETRY_LIMIT, and failed as they were.
let pending = [];
const retried = [];
let overLimit = 0;

// A case that could not run: what stopped it, and whether a step of it ran
// out of time (Playwright's TimeoutError, or the language switcher's wait).
const failsToRun = (error) => ({ what: 'fails to run', text: error.message.split('\n')[0], timeout: error.name === 'TimeoutError' });

// Records a case, or keeps it for a second run when it only ran out of time:
// still navigating after BUDGET_MS, or a step timing out before it, with no
// loop and in no more navigations than the case may take.
function conclude(c, problems, outcome) {
    const outOfTime = problems.length === 1 && (problems[0].what === 'never settles' || problems[0].timeout === true)
        && !outcome?.looped && (outcome?.chain.length ?? 0) <= c.expect.maxRedirects + 1;
    if (outOfTime && !c.first) pending.push({ c, problems });
    else record(c, problems);
}

// Runs the cases kept for a second run, one at a time, each through `run`
// with the same budget, and waits for each to be recorded. Past RETRY_LIMIT
// in the run, none of them runs again.
async function runAgain(run) {
    const queue = pending;
    pending = [];
    if (retried.length + queue.length > RETRY_LIMIT) {
        overLimit += queue.length;
        for (const { c, problems } of queue) record(c, problems);
        return;
    }
    for (const { c, problems } of queue) {
        c.first = problems;
        retried.push(c);
        await run(c);
        await watched();
    }
}

// The settled pages being watched for one more navigation (settle's confirm),
// each concluding its case when done.
let watching = [];
const watch = (c, outcome, after) => {
    watching.push(outcome.confirm()
        .then((o) => conclude(c, judge(c.expect, o), o))
        .catch((error) => conclude(c, [failsToRun(error)]))
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
        conclude(c, [failsToRun(error)]);
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
    const bounced = new Set(); // the cases the cache sent from /<lang>/<page> back to English

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
            const first = context.pages()[0] || await context.newPage();
            // a case in a tab of its own, with its language stored in the profile
            const run = async (c) => {
                const page = await context.newPage();
                try {
                    const outcome = await settle(page, () => page.goto(origin + c.url, { waitUntil: 'commit', timeout: BUDGET_MS }).catch(() => {}));
                    // the cache sent the visitor from the page's /<lang>/ URL back to English
                    if (outcome.chain.some((step, i) => step === twin(c.stored, c.family) && outcome.chain[i + 1] === c.family)) bounced.add(c);
                    watch(c, outcome, () => page.close().catch(() => {}));
                } catch (error) {
                    conclude(c, [failsToRun(error)]);
                    await page.close().catch(() => {});
                }
            };
            for (const lang of NON_EN_SITE_LANG_CODES) {
                await storeLanguage(first, origin, lang);
                // a page's English URL, and its /<lang>/ URL, which the cache
                // sends to English: both end on the translation, past the cache
                const cases = real.flatMap((p) => [p, twin(lang, p)].map((url) => (
                    { kind, family: p, url, stored: lang, expect: { maxRedirects: 4, ...landing(p, lang), status: 200 } })));
                await pool(cases, run);
                // the next language is stored in the same profile
                await watched();
            }
            await runAgain(async (c) => {
                try {
                    await storeLanguage(first, origin, c.stored);
                } catch (error) {
                    conclude(c, [failsToRun(error)]);
                    return;
                }
                await run(c);
            });
        } finally {
            await context.close().catch(() => {});
        }
    } finally {
        await current.stop();
    }
    // Without a 301 from the cache, these cases prove nothing: the profile
    // must have kept the old config's.
    if (!bounced.size) record({ kind, family: 'the profile' }, [{ what: 'kept no 301 of the old config', text: 'no case went from /<lang>/<page> to the English page' }]);
    else results.get(kind).note = `the cached 301s sent ${bounced.size} back to English`;
}

// a case, what it did and what it found, for the report
const describe = (c, text) => [c.family, c.choose ? `chose ${c.choose.toUpperCase()} on ${c.url}`
    : c.click ? `followed the English link on ${c.url}${c.stored ? ` with ${c.stored} stored` : ''}`
        : c.url && `${c.url}${c.referer ? ` from ${c.referer}` : ''}${c.stored ? ` with ${c.stored} stored` : ''}`, text].filter(Boolean).join(': ');

async function main() {
    if (!existsSync(path.join(SOURCE, 'index.html'))) {
        console.error(`redirect-loops: no build at ${SOURCE} (make build-main, or pass the build directory)`);
        process.exit(2);
    }
    if (OVERLAY && !existsSync(OVERLAY)) {
        console.error(`redirect-loops: no overlay at ${OVERLAY}`);
        process.exit(2);
    }
    const binary = nginxBinary();
    if (!binary) {
        console.error('redirect-loops: needs nginx to run the site\'s server block (brew install nginx; apt-get install nginx-light), or NGINX=/path/to/nginx');
        process.exit(1);
    }
    const started = Date.now();
    const work = mkdtempSync(path.join(os.tmpdir(), 'ur-redirect-loops-'));
    const shown = (file) => (file.startsWith(`${REPO}${path.sep}`) ? path.relative(REPO, file) : file);
    let list;
    try {
        if (OVERLAY) {
            BUILD = path.join(work, 'build');
            cpSync(SOURCE, BUILD, { recursive: true, mode: constants.COPYFILE_FICLONE });
            cpSync(OVERLAY, BUILD, { recursive: true });
            // a file laid over the build replaces its precompressed copies too
            for (const file of readdirSync(OVERLAY, { recursive: true })) {
                for (const copy of [`${file}.gz`, `${file}.br`]) rmSync(path.join(BUILD, copy), { force: true });
            }
        }
        list = families();
    } catch (error) {
        rmSync(work, { recursive: true, force: true });
        throw error;
    }
    console.log(`redirect-loops: ${shown(CONF)} over ${shown(SOURCE)}${OVERLAY ? ` with ${shown(OVERLAY)} laid over it` : ''}, ${list.length} families of pages; ${WORKERS} workers (load average ${LOAD.toFixed(1)} on ${CPUS} CPUs)`);
    let sink;
    try {
        sink = await startSink();
        const port = await freePort();
        const origin = `http://127.0.0.1:${port}`;
        const nginx = await startNginx(binary, path.join(work, 'nginx'), port, urXyzConfig(readFileSync(CONF, 'utf8'), port, BUILD));
        try {
            const browser = await chromium.launch(launchOptions(sink.port));
            try {
                await pool([...storedCases(list), ...switcherCases(list), ...originalCases()], (c) => freshCase(browser, origin, c));
                await watched();
                await runAgain((c) => freshCase(browser, origin, c));
            } finally {
                await browser.close().catch(() => {});
            }
        } finally {
            await nginx.stop();
        }
        await cachedCases(binary, work, sink.port, list);
    } finally {
        await sink?.close();
        rmSync(work, { recursive: true, force: true });
    }

    let failed = 0;
    for (const [kind, r] of results) {
        failed += r.failures.length;
        const notes = [r.note, r.again && `${r.again} on a second run`].filter(Boolean);
        console.log(`  ${r.failures.length ? '✗' : '✓'} ${kind}: ${r.total - r.failures.length} of ${r.total} as expected${notes.length ? ` (${notes.join('; ')})` : ''}`);
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
                console.log(`        ${describe(c, problem.text)}${c.first ? ' (its second run)' : ''}`);
            }
        }
    }
    // the cases that ran again, each with its first run and how the second went
    const again = retried.filter((c) => !results.get(c.kind).failures.some((f) => f.c === c));
    console.log(retried.length
        ? `  retried ${retried.length} case(s) that only ran out of time, one at a time with the same ${BUDGET_MS / 1000} s: ${again.length} as expected the second time`
        : '  retried 0 cases: none only ran out of time');
    for (const c of retried) {
        const second = results.get(c.kind).failures.find((f) => f.c === c);
        console.log(`      ${describe(c, c.first[0].text)}; then ${second ? second.problems.map((p) => p.text).join('; ') : 'as expected'}`);
    }
    if (overLimit) console.log(`  ${overLimit} case(s) only ran out of time but were not retried, as they would have taken the run past ${RETRY_LIMIT} retries: they fail as they are`);
    const hosts = [...sink.blocked.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`  blocked ${hosts.reduce((n, [, count]) => n + count, 0)} requests off the machine${hosts.length ? ` (${hosts.slice(0, 6).map(([h, n]) => `${h} ${n}`).join(', ')}${hosts.length > 6 ? ', …' : ''})` : ''}; ${Math.round((Date.now() - started) / 1000)} s`);
    if (failed) {
        console.log(`\n✗ redirect-loops: ${failed} case(s) did not settle as expected`);
        process.exit(1);
    }
    console.log(`\n✓ redirect-loops: every page settles${retried.length ? ` (${retried.length} on a second run)` : ''}`);
}

main().catch((error) => {
    console.error('redirect-loops error:', error);
    process.exit(1);
});
