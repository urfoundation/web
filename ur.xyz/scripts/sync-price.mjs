#!/usr/bin/env node
/**
 * sync-price — publish the subnet price sheet.
 *
 * Copies price.yml from the sn repo into the site, records each change in
 * price/price-history.json, regenerates the price.rss change feed, and fans
 * the published artifacts out to both app public/ directories:
 *
 *   sn/price.yml ──▶ price/price.yml           (canonical tracked copy)
 *                    price/price-history.json  (one entry per published change)
 *                    astro/public/price.yml + price.rss
 *                    react/public/price.yml + price.rss
 *
 * The sn checkout is located via $SN_DIR (default: ../../sn — the urnetwork
 * monoroot, where ur.xyz lives at web/ur.xyz since the 2026-09 reorganization;
 * the old ../../../sn dated from web/web2/ur.xyz and silently kept the
 * checked-in copy). When the sn repo is not present (e.g. a CI build of the
 * site alone), the checked-in copy is kept and only the derived artifacts are
 * regenerated, so the build stays reproducible.
 *
 * A history entry is appended only when the sheet's content changes, dated
 * at the moment the change is first synced — that is the "published" time
 * the RSS feed reports. Re-running the script without a change is a no-op,
 * so build output is deterministic.
 *
 * Nothing is written unless the sheet passes the publish gate. scripts/price-gate.mjs
 * holds it to what readers accept and what the site can show truthfully, and refuses
 * a sheet that drops or changes a signed entry already published, or adds one before
 * them. Signatures are the sn repo's to check: with a checkout that has
 * cli/pricesheet, its `verify` runs on the exact bytes about to publish, and a
 * refusal stops the publish. Without one, a sheet with signed entries publishes only
 * if it is what was published last.
 *
 * With --check it writes nothing and fails unless the tracked copies are what a sync
 * would leave: the build's gates run this, because nothing in the build syncs.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePriceSheet } from '../react/src/lib/price.js';
import { checkPriceSheet } from './price-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SN_DIR = process.env.SN_DIR || path.resolve(ROOT, '../../sn');

const SITE_ORIGIN = 'https://ur.xyz';
const PRICE_PAGE = `${SITE_ORIGIN}/price`;
const FEED_URL = `${SITE_ORIGIN}/price.rss`;

const CANONICAL = path.join(ROOT, 'price', 'price.yml');
const HISTORY = path.join(ROOT, 'price', 'price-history.json');
const PUBLIC_DIRS = [
    path.join(ROOT, 'astro', 'public'),
    path.join(ROOT, 'react', 'public')
];

function log(msg) {
    console.log(`[sync-price] ${msg}`);
}

/** The current sheet: prefer the sn repo, fall back to the tracked copy. */
function loadSheet() {
    const snFile = path.join(SN_DIR, 'price.yml');
    if (fs.existsSync(snFile)) {
        log(`reading ${snFile}`);
        return fs.readFileSync(snFile, 'utf8');
    }
    if (fs.existsSync(CANONICAL)) {
        log(`sn repo not found at ${SN_DIR}; keeping checked-in price/price.yml`);
        return fs.readFileSync(CANONICAL, 'utf8');
    }
    console.error(`[sync-price] no price.yml at ${snFile} and no checked-in copy at ${CANONICAL}`);
    process.exit(1);
}

function escapeHtml(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

/** RSS item body: the sheet rendered as a small table plus the raw yaml. */
function entryHtml(entry) {
    let sheet;
    try {
        sheet = parsePriceSheet(entry.yaml);
    } catch {
        sheet = { tiers: [], signed: [] };
    }
    const newest = sheet.signed[sheet.signed.length - 1];
    const rows = (newest ? newest.tiers : sheet.tiers).map((t, i) => `<tr><td>${i}</td><td>${
        t.minStakeAlpha === 0 ? '0 (everyone)' : `&#8805; ${t.exact.minStake}`
    }</td><td>${t.exact.gib}</td><td>${t.exact.user}</td></tr>`).join('');

    return [
        `<p>UR subnet ${sheet.sn ?? '?'} — demand deposit price per block (7 days).`,
        ` An operator pays the best tier whose staked-&#945; threshold it meets;`,
        ` tier 0 applies to everyone.</p>`,
        newest ? `<p>Signed by the subnet owner: these rates apply from epoch ${newest.effectiveEpoch}, with a deposit cap of ${newest.capAlpha} &#945; per operator per epoch.</p>` : '',
        `<table border="1" cellpadding="4" cellspacing="0">`,
        `<tr><th>Tier</th><th>Staked &#945; threshold</th><th>&#945; / GiB</th><th>&#945; / user</th></tr>`,
        rows,
        `</table>`,
        `<pre>${escapeHtml(entry.yaml)}</pre>`
    ].join('');
}

function buildRss(history) {
    const newestFirst = [...history].reverse();
    const items = newestFirst.map(entry => {
        const d = new Date(entry.date);
        const day = entry.date.slice(0, 10);
        // CDATA keeps the HTML readable; a literal "]]>" inside would end
        // the section early, so split it if it ever appears.
        const body = entryHtml(entry).replaceAll(']]>', ']]]]><![CDATA[>');
        return [
            '        <item>',
            `            <title>UR usage cost update — ${day}</title>`,
            `            <link>${PRICE_PAGE}</link>`,
            `            <guid isPermaLink="false">urn:ur-xyz:price:${entry.date}</guid>`,
            `            <pubDate>${d.toUTCString()}</pubDate>`,
            `            <description><![CDATA[${body}]]></description>`,
            '        </item>'
        ].join('\n');
    }).join('\n');

    const latest = newestFirst[0];
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '    <channel>',
        '        <title>UR usage cost</title>',
        `        <link>${PRICE_PAGE}</link>`,
        `        <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
        '        <description>Published price sheet changes for the UR subnet — the alpha demand deposit required per GiB and per user in each 7-day block, by staked-alpha tier.</description>',
        '        <language>en</language>',
        latest ? `        <lastBuildDate>${new Date(latest.date).toUTCString()}</lastBuildDate>` : null,
        items,
        '    </channel>',
        '</rss>',
        ''
    ].filter(l => l !== null).join('\n');
}

/** Stop without writing anything. */
function refuse(reasons) {
    for (const reason of reasons) console.error(`[sync-price] ${reason}`);
    console.error('[sync-price] not publishing');
    process.exit(1);
}

/**
 * The pricesheet tool's verdict on these exact bytes: { passed }, { refused } or,
 * when there is no tool to ask, { unavailable }. Building it apart from running it
 * keeps a checkout that does not compile from reading as a bad signature.
 */
function verifySignatures(content) {
    if (!fs.existsSync(path.join(SN_DIR, 'cli', 'pricesheet'))) {
        return { unavailable: `no cli/pricesheet at ${SN_DIR}` };
    }
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-price-'));
    try {
        const tool = path.join(work, 'pricesheet');
        log('building the pricesheet tool');
        const build = spawnSync('go', ['build', '-o', tool, './cli/pricesheet'], { cwd: SN_DIR, encoding: 'utf8' });
        if (build.error || build.status !== 0) {
            return { unavailable: `cli/pricesheet did not build: ${build.error?.message ?? build.stderr.trim()}` };
        }
        const file = path.join(work, 'price.yml');
        fs.writeFileSync(file, content);
        const verify = spawnSync(tool, ['verify', `--in=${file}`], { encoding: 'utf8' });
        if (verify.error || verify.status !== 0) {
            return { refused: verify.error?.message ?? (verify.stderr.trim() || 'pricesheet verify failed') };
        }
        return { passed: verify.stdout.trim() };
    } finally {
        fs.rmSync(work, { recursive: true, force: true });
    }
}

/** --check: the tracked copies are what a sync would leave, and they pass the gate. */
function check(history) {
    if (!fs.existsSync(CANONICAL)) refuse([`no ${path.relative(ROOT, CANONICAL)}`]);
    const content = fs.readFileSync(CANONICAL, 'utf8');
    const last = history[history.length - 1];
    const problems = checkPriceSheet(content, { previous: history[history.length - 2]?.yaml });
    if (!last || last.yaml !== content) problems.push(`${path.relative(ROOT, CANONICAL)} is not the last entry of the history`);
    const rss = buildRss(history);
    for (const dir of PUBLIC_DIRS) {
        const copies = [['price.yml', content], ['price.rss', rss]];
        for (const [name, want] of copies) {
            const file = path.join(dir, name);
            if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== want) {
                problems.push(`${path.relative(ROOT, file)} is not what a sync would write`);
            }
        }
    }
    if (problems.length > 0) refuse([...problems, 'run scripts/sync-price.mjs']);
    log('the tracked sheet and its copies are in order');
}

function main() {
    let history = [];
    if (fs.existsSync(HISTORY)) {
        history = JSON.parse(fs.readFileSync(HISTORY, 'utf8'));
    }
    if (process.argv.includes('--check')) {
        check(history);
        return;
    }

    let content = loadSheet();
    if (!content.endsWith('\n')) content += '\n';

    const last = history[history.length - 1];
    const changed = !last || last.yaml !== content;

    // Fail loudly on a sheet that is broken rather than publishing it.
    const previous = changed ? last?.yaml : history[history.length - 2]?.yaml;
    const problems = checkPriceSheet(content, { previous });
    if (problems.length > 0) refuse(problems);

    const verdict = verifySignatures(content);
    if (verdict.refused) refuse([`pricesheet verify: ${verdict.refused}`]);
    if (verdict.unavailable) {
        // What the last sync verified needs no new word. A new signed price does.
        if (changed && parsePriceSheet(content).signed.length > 0) {
            refuse([`this sheet has signed entries and nothing can check them: ${verdict.unavailable}`]);
        }
        log(`signatures not checked: ${verdict.unavailable}`);
    } else {
        log(`pricesheet verify passed: ${verdict.passed.split('\n').join(' | ')}`);
    }

    if (changed) {
        history.push({ date: new Date().toISOString(), yaml: content });
        log(`price change recorded (${history.length} ${history.length === 1 ? 'entry' : 'entries'})`);
    } else {
        log('no price change');
    }

    fs.mkdirSync(path.dirname(CANONICAL), { recursive: true });
    fs.writeFileSync(CANONICAL, content);
    fs.writeFileSync(HISTORY, JSON.stringify(history, null, 2) + '\n');

    const rss = buildRss(history);
    for (const dir of PUBLIC_DIRS) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'price.yml'), content);
        fs.writeFileSync(path.join(dir, 'price.rss'), rss);
        log(`published ${path.relative(ROOT, dir)}/price.yml + price.rss`);
    }
}

main();
