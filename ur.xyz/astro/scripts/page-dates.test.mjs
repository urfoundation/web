// The page fingerprint behind the sitemap's <lastmod> (scripts/page-dates.mjs).
// A docs page states the day its content last changed in its header: the build
// writes LASTMOD_TOKEN there and replaces it with the recorded day once the
// page is fingerprinted. The build fingerprints the page with the token and
// the --check gate fingerprints it with the day, so both must give the same
// fingerprint, or every build re-dates the page and the gate never passes.
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { GROUP_RECORD_DIR, RECORD_FILE, pageFacts, recordFileFor, serializeRecordFiles } from './page-dates.mjs';
import { LASTMOD_TOKEN } from '../src/lib/lastmod.js';

const page = (updated) => `<!doctype html><html lang="en"><head><title>Fixture guide — UR Docs</title>
<meta name="description" content="A fixture guide."><link rel="canonical" href="https://ur.xyz/docs/fixture">
<script type="application/ld+json">{"dateModified":"${updated}"}</script></head>
<body><main><header><h1>Fixture guide</h1><p class="explorer-page-meta">Updated <time datetime="${updated}">${updated}</time></p></header>
<p>The fixture's text.</p></main></body></html>`;

test('a page stating its lastmod fingerprints the same with the token and with the day', () => {
    assert.equal(pageFacts(page(LASTMOD_TOKEN)).fingerprint, pageFacts(page('2026-01-02')).fingerprint);
    assert.equal(pageFacts(page('2026-01-02')).fingerprint, pageFacts(page('2026-03-04')).fingerprint);
});

test('a change to what the page says still changes its fingerprint', () => {
    assert.notEqual(pageFacts(page(LASTMOD_TOKEN)).fingerprint, pageFacts(page(LASTMOD_TOKEN).replace("The fixture's text.", 'Other text.')).fingerprint);
});

test('a page group\'s pages, in every language, are recorded in the group\'s own file', () => {
    const group = (name) => path.join(GROUP_RECORD_DIR, `${name}.json`);
    assert.equal(recordFileFor('/ctf/ke'), group('ctf'));
    assert.equal(recordFileFor('/de/ctf/ke'), group('ctf'));
    assert.equal(recordFileFor('/ar/about'), group('about'));
    assert.equal(recordFileFor('/docs/miner/install'), group('docs'));
    assert.equal(recordFileFor('/terms'), group('docs'));
    assert.equal(recordFileFor('/research/methodology'), group('research-methodology'));
    for (const page of ['/', '/de', '/miners', '/ar/research', '/audits/masa-l2-2025.pdf']) assert.equal(recordFileFor(page), RECORD_FILE, page);

    const entry = { fingerprint: '0123456789abcdef', lastmod: '2026-11-12' };
    const files = serializeRecordFiles(new Map([['/', entry], ['/ctf/ke', entry], ['/de/ctf/ke', entry], ['/about', entry]]));
    assert.deepEqual(Object.keys(JSON.parse(files.get(RECORD_FILE)).pages), ['/']);
    assert.deepEqual(Object.keys(JSON.parse(files.get(group('ctf'))).pages), ['/ctf/ke', '/de/ctf/ke']);
    assert.deepEqual(Object.keys(JSON.parse(files.get(group('about'))).pages), ['/about']);
    // a group with no recorded page has no file
    assert.equal(files.get(group('not-found')), null);
    assert.equal(files.get(group('mainnet')), null);
});
