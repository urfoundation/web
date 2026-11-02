// The check the miner docs can't ship past (before-flip.mjs).
//
//   node --test ../scripts/before-flip.test.mjs      (from astro/, as `make gates` runs it)
//
// The last test is red until the owner's approved values replace the tokens. That is
// the point: this branch waits for the flip.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertNoUnfilledPlaceholders, unfilledPlaceholders } from './before-flip.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function corpus() {
    const docs = path.join(ROOT, 'docs');
    return readdirSync(docs, { recursive: true })
        .filter((name) => String(name).endsWith('.md'))
        .map((name) => ({ path: String(name), content: readFileSync(path.join(docs, String(name)), 'utf8') }));
}

test('a token is found once per doc, and nothing else matches', () => {
    assert.deepEqual(
        unfilledPlaceholders([
            { path: 'a.md', content: 'x __BEFORE_FLIP_FLEET_AUTHORITY_SHA256__ y __BEFORE_FLIP_FLEET_AUTHORITY_SHA256__' },
            { path: 'b.md', content: '__before_flip_x__ __OTHER__ BEFORE_FLIP' },
        ]),
        [{ path: 'a.md', token: '__BEFORE_FLIP_FLEET_AUTHORITY_SHA256__' }],
    );
    assert.throws(() => assertNoUnfilledPlaceholders([{ path: 'miner/a.md', content: '__BEFORE_FLIP_X__' }]), /docs\/miner\/a\.md: __BEFORE_FLIP_X__/);
    assert.doesNotThrow(() => assertNoUnfilledPlaceholders([{ path: 'a.md', content: 'filled' }]));
});

test('the build refuses through the docs corpus it publishes, and the gates run this test', () => {
    const config = readFileSync(path.join(ROOT, 'astro/astro.config.mjs'), 'utf8');
    assert.match(config, /assertNoUnfilledPlaceholders\(docs\);/);
    const makefile = readFileSync(path.join(ROOT, 'astro/Makefile'), 'utf8');
    assert.match(makefile, /node --test \.\.\/scripts\/before-flip\.test\.mjs/);
});

test('the miner docs ship no unfilled placeholder', () => {
    assert.deepEqual(unfilledPlaceholders(corpus()), []);
});
