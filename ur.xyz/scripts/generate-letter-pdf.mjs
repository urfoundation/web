// Print the Investor Centre's written documents to real PDFs.
//
// Each document's page is the single source of truth: this prints that page
// through Chromium's print pipeline, so the `@media print` rules in its
// stylesheet (react/src/components/pages/investors/*.css) decide how the file
// looks and the two can never drift. The documents, their pages and their PDF
// paths come from the investor registry (react/src/data/investors.js), so a
// new document needs no change here. The deck is not printed: its PDF is the
// Google Slides export (`make deck-slides`).
//
// The results are committed under react/public/ (the source of truth for
// static assets, mirrored into astro/public by `make sync-public` at build
// time) and served as static files, which keeps Chromium out of the site
// build — `astro build` must not depend on a browser binary being present.
//
//   Usage:  node scripts/generate-letter-pdf.mjs                       (list the documents)
//           node scripts/generate-letter-pdf.mjs apex-competition      (print one, by slug)
//           node scripts/generate-letter-pdf.mjs --all                 (print every document)
//           add --rebuild to build the site first (otherwise only if the build is missing)
//
// Chromium comes from playwright-core, which ships no browsers of its own. If it
// cannot find one, install it with `npx playwright install chromium`, or point
// CHROMIUM_PATH at an existing Chrome/Edge executable.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { investorCentre } from '../react/src/data/investors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// playwright-core is a devDependency of the react package (it also backs
// tests/visual-parity.mjs) and scripts/ has no node_modules of its own, so
// resolve it from there the way the parity test reaches for its own binaries.
const { chromium } = createRequire(path.join(ROOT, 'react', 'package.json'))('playwright-core');
const ASTRO_DIR = path.join(ROOT, 'astro');
const UR_ENV = process.env.UR_ENV || 'main';
const BUILD_DIR = path.join(ASTRO_DIR, 'build', UR_ENV);

// Every written document in the registry that offers a PDF, once each (the
// registry names some documents twice, as `featured` and by name).
const DOCUMENTS = [...new Map(
    Object.values(investorCentre)
        .filter((doc) => doc && typeof doc === 'object' && doc.href && doc.pdfHref && doc.kind !== 'Deck')
        .map((doc) => [doc.href, {
            slug: doc.href.split('/').pop(),
            title: doc.title,
            route: `${doc.href}.html`,
            out: path.join(ROOT, 'react', 'public', ...doc.pdfHref.split('/').filter(Boolean)),
        }])
).values()];

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.otf': 'font/otf',
    '.ttf': 'font/ttf',
};

function buildSite() {
    console.log('building the astro site...');
    // `npm run build` also fires the postbuild parity test; call astro directly.
    // The CLI's entry moved (astro.js → bin/astro.mjs in Astro 7): read it from
    // the package rather than hard-coding it.
    const astroPkg = path.join(ASTRO_DIR, 'node_modules', 'astro');
    const { bin } = JSON.parse(fs.readFileSync(path.join(astroPkg, 'package.json'), 'utf8'));
    const astroBin = path.join(astroPkg, typeof bin === 'string' ? bin : bin.astro);
    const res = spawnSync(process.execPath, [astroBin, 'build'], {
        cwd: ASTRO_DIR,
        stdio: 'inherit',
    });
    if (res.status !== 0) throw new Error('astro build failed');
}

// Serving the built output beats file:// — the page loads fonts and its island
// bundles by absolute path, and file:// resolves those against the drive root.
function serve(dir) {
    const server = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        let file = path.join(dir, url);
        if (!file.startsWith(dir)) return res.writeHead(403).end();
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
            file = path.join(file, 'index.html');
        }
        if (!fs.existsSync(file)) return res.writeHead(404).end('not found');
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => {
        server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    });
}

async function launch() {
    const explicit = process.env.CHROMIUM_PATH;
    if (explicit) return chromium.launch({ executablePath: explicit });
    try {
        return await chromium.launch();
    } catch (err) {
        // playwright-core ships no browsers; fall back to a system Chrome/Edge.
        for (const channel of ['chrome', 'msedge']) {
            try {
                return await chromium.launch({ channel });
            } catch {
                /* try the next one */
            }
        }
        throw new Error(
            `no chromium available (${err.message}).\n` +
            'run `npx playwright install chromium`, or set CHROMIUM_PATH to a Chrome/Edge binary.'
        );
    }
}

const args = process.argv.slice(2);
const rebuild = args.includes('--rebuild');
const slugs = args.filter((arg) => !arg.startsWith('--'));
const selected = args.includes('--all') ? DOCUMENTS : DOCUMENTS.filter((doc) => slugs.includes(doc.slug));

const unknown = slugs.filter((slug) => !DOCUMENTS.some((doc) => doc.slug === slug));
if (unknown.length || !selected.length) {
    if (unknown.length) console.error(`unknown document: ${unknown.join(', ')}`);
    console.log('documents (pass a slug, or --all):');
    for (const doc of DOCUMENTS) console.log(`  ${doc.slug.padEnd(42)} -> ${path.relative(ROOT, doc.out)}`);
    process.exit(unknown.length ? 1 : 0);
}

const missingBuild = selected.some((doc) => !fs.existsSync(path.join(BUILD_DIR, doc.route.replace(/^\//, ''))));
if (rebuild || missingBuild) buildSite();

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const { server, port } = await serve(BUILD_DIR);
const browser = await launch();

try {
    for (const doc of selected) {
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${port}${doc.route}`, { waitUntil: 'networkidle' });
        // Webfonts decide the line breaks; printing before they land reflows the file.
        await page.evaluate(() => document.fonts.ready);
        await page.emulateMedia({ media: 'print' });

        fs.mkdirSync(path.dirname(doc.out), { recursive: true });
        await page.pdf({
            path: doc.out,
            format: 'A4',
            printBackground: true,
            // Margins live in the stylesheet's @page rule so the print preview and
            // this file agree; Chromium needs preferCSSPageSize to honour them.
            preferCSSPageSize: true,
            // Chromium ignores @page margin boxes, so the running foot has to be a
            // template here. It sits inside the bottom margin each stylesheet
            // reserves. An empty header template suppresses the default date/URL.
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="
                    width: 100%;
                    margin: 0 16mm;
                    padding-top: 4mm;
                    border-top: 0.5px solid rgba(16,16,16,0.18);
                    display: flex;
                    justify-content: space-between;
                    font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 7pt;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #6b6b6b;
                ">
                    <span>UR &middot; ${escapeHtml(doc.title)}</span>
                    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
                </div>`,
            tagged: true,
        });
        await page.close();

        const kb = (fs.statSync(doc.out).size / 1024).toFixed(0);
        console.log(`wrote ${path.relative(ROOT, doc.out)} (${kb} KB)`);
    }
} finally {
    await browser.close();
    server.close();
}
