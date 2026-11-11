#!/usr/bin/env node
/**
 * sync-amendments — publish the signed settlement amendments.
 *
 * Copies amendments.yml from the sn repo into the site, byte for byte, and fans
 * it out to both app public/ directories, so the site serves it at
 * https://ur.xyz/amendments.yml (amendment.URL in the sn repo), beside the price
 * sheet, whose key signs its entries:
 *
 *   sn/amendments.yml ──▶ amendments/amendments.yml    (canonical tracked copy)
 *                         astro/public/amendments.yml
 *                         react/public/amendments.yml
 *
 * The server, the validator and snclaim fetch the published file through the sn
 * repo's amendment package. They take it only if every entry verifies against the
 * price sheet's pinned key and it keeps every entry they already hold, and until
 * one verifies, the amendments in force are unknown to them. The owner signs each
 * entry before its first epoch starts (sn's mainnet/SETTLEMENT-AMENDMENTS.md), so
 * an entry reaches its readers only once this has run and the site is deployed,
 * and that too has to happen before its first epoch. The copies are never
 * rewritten: readers verify the bytes the owner's tool wrote.
 *
 * The sn checkout is located via $SN_DIR (default: ../../sn, as for
 * sync-price.mjs). When it has no amendments.yml (e.g. a CI build of the site
 * alone), the checked-in copy is kept and re-published.
 *
 * Nothing is written unless the file passes the publish gate.
 * scripts/amendments-gate.mjs holds it to what readers accept, and refuses a file
 * that drops or changes an entry already published, or puts one before them.
 * Signatures are the sn repo's to check: with a checkout that has cli/amendment,
 * its `verify` runs on the exact bytes about to publish, and a refusal stops the
 * publish. Without one, a file with signed entries publishes only if it is what
 * was published last.
 *
 * With --check it writes nothing and fails unless the tracked copies are what a
 * sync would leave: the build's gates run this, because nothing in the build
 * syncs. Like sync-price.mjs, run it by hand when sn/amendments.yml changes and
 * commit the three copies:
 *
 *   node scripts/sync-amendments.mjs
 *   SN_DIR=/path/to/sn node scripts/sync-amendments.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_CHAIN, amendmentEntries, checkAmendments } from './amendments-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SN_DIR = process.env.SN_DIR || path.resolve(ROOT, '../../sn');

const CANONICAL = path.join(ROOT, 'amendments', 'amendments.yml');
const PUBLIC_DIRS = [
    path.join(ROOT, 'astro', 'public'),
    path.join(ROOT, 'react', 'public')
];

function log(msg) {
    console.log(`[sync-amendments] ${msg}`);
}

/** Stop without writing anything. */
function refuse(reasons) {
    for (const reason of reasons) console.error(`[sync-amendments] ${reason}`);
    console.error('[sync-amendments] not publishing');
    process.exit(1);
}

/** The current file, as bytes: prefer the sn repo, fall back to the tracked copy. */
function loadFile() {
    const snFile = path.join(SN_DIR, 'amendments.yml');
    if (fs.existsSync(snFile)) {
        log(`reading ${snFile}`);
        return fs.readFileSync(snFile);
    }
    if (fs.existsSync(CANONICAL)) {
        log(`no amendments.yml in ${SN_DIR}; keeping checked-in amendments/amendments.yml`);
        return fs.readFileSync(CANONICAL);
    }
    refuse([`no amendments.yml at ${snFile} and no checked-in copy at ${CANONICAL}`]);
}

/**
 * The amendment tool's verdict on these exact bytes: { passed }, { refused } or,
 * when there is no tool to ask, { unavailable }. Building it apart from running it
 * keeps a checkout that does not compile from reading as a bad signature.
 */
function verifySignatures(bytes) {
    if (!fs.existsSync(path.join(SN_DIR, 'cli', 'amendment'))) {
        return { unavailable: `no cli/amendment at ${SN_DIR}` };
    }
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-amendments-'));
    try {
        const tool = path.join(work, 'amendment');
        log('building the amendment tool');
        const build = spawnSync('go', ['build', '-o', tool, './cli/amendment'], { cwd: SN_DIR, encoding: 'utf8' });
        if (build.error || build.status !== 0) {
            return { unavailable: `cli/amendment did not build: ${build.error?.message ?? build.stderr.trim()}` };
        }
        const file = path.join(work, 'amendments.yml');
        fs.writeFileSync(file, bytes);
        const verify = spawnSync(tool, ['verify', `--in=${file}`, `--chain=${PUBLISHED_CHAIN}`], { encoding: 'utf8' });
        if (verify.error || verify.status !== 0) {
            return { refused: verify.error?.message ?? (verify.stderr.trim() || 'amendment verify failed') };
        }
        return { passed: verify.stdout.trim() };
    } finally {
        fs.rmSync(work, { recursive: true, force: true });
    }
}

/** --check: the copies are the tracked file's bytes, and it passes the gate. */
function check() {
    if (!fs.existsSync(CANONICAL)) refuse([`no ${path.relative(ROOT, CANONICAL)}`, 'run scripts/sync-amendments.mjs']);
    const bytes = fs.readFileSync(CANONICAL);
    const problems = checkAmendments(bytes.toString('utf8'));
    for (const dir of PUBLIC_DIRS) {
        const file = path.join(dir, 'amendments.yml');
        if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) {
            problems.push(`${path.relative(ROOT, file)} is not what a sync would write`);
        }
    }
    if (problems.length > 0) refuse([...problems, 'run scripts/sync-amendments.mjs']);
    log('the tracked amendments and their copies are in order');
}

function main() {
    if (process.argv.includes('--check')) {
        check();
        return;
    }

    const bytes = loadFile();
    const text = bytes.toString('utf8');
    const last = fs.existsSync(CANONICAL) ? fs.readFileSync(CANONICAL) : null;
    const changed = !last || !last.equals(bytes);

    // Fail loudly on a file readers would refuse rather than publishing it.
    const problems = checkAmendments(text, { previous: last?.toString('utf8') });
    if (problems.length > 0) refuse(problems);

    const entries = amendmentEntries(text).length;
    const verdict = verifySignatures(bytes);
    if (verdict.refused) refuse([`amendment verify: ${verdict.refused}`]);
    if (verdict.unavailable) {
        // What the last sync verified needs no new word. A new signed entry does.
        if (changed && entries > 0) {
            refuse([`this file has signed entries and nothing can check them: ${verdict.unavailable}`]);
        }
        log(`signatures not checked: ${verdict.unavailable}`);
    } else {
        log(`amendment verify passed: ${verdict.passed.split('\n').join(' | ')}`);
    }
    log(`${changed ? 'amendments changed' : 'no change to the amendments'}: ${entries} signed ${entries === 1 ? 'entry' : 'entries'}`);

    fs.mkdirSync(path.dirname(CANONICAL), { recursive: true });
    fs.writeFileSync(CANONICAL, bytes);
    for (const dir of PUBLIC_DIRS) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'amendments.yml'), bytes);
        log(`published ${path.relative(ROOT, dir)}/amendments.yml`);
    }
}

main();
