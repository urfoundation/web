// The publish gate (scripts/price-gate.mjs) and the sync that applies it
// (scripts/sync-price.mjs), run for real against a copy of the site's price files.
// A stand-in for `go` plays the sn repo's pricesheet tool, so no key signs anything:
// the signatures here are not signatures, and only their shape is read.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPriceSheet } from './price-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACKED = fs.readFileSync(path.join(ROOT, 'price/price.yml'), 'utf8');
// The file published at launch, byte for byte. The tracked sheet moves on with each
// signed price, and the cases below must not move with it.
const LAUNCH = `sn: 25
# the alpha must be deposited as demand deposits per block (7 days)
#
# Initial period: no operator demand deposits are collected, so every rate is
# 0 alpha per GiB and 0 alpha per user. The tiers are kept for the shape of the
# schedule (an operator pays the best tier whose staked-alpha threshold it meets;
# the 0 tier applies to everyone) and will be filled in when deposits start.
tiered_per_block_demand_deposits:
  0:
    alpha_per_gib: 0
    alpha_per_user: 0
  1000:
    alpha_per_gib: 0
    alpha_per_user: 0
`;
const SIGNATURE = `0x${'ab'.repeat(65)}`;

const tier = (threshold, gib, user, indent = '  ') =>
    `${indent}${threshold}:\n${indent}  alpha_per_gib: ${gib}\n${indent}  alpha_per_user: ${user}\n`;
const mirror = (gib = '0.02', user = '0.005', gib2 = '0.01', user2 = '0.0025') =>
    `sn: 25\n# a comment\ntiered_per_block_demand_deposits:\n${tier(0, gib, user)}${tier(1000, gib2, user2)}`;
const entry = (epoch, { cap = '5000', gib = '0.02', user = '0.005', gib2 = '0.01', user2 = '0.0025', signature = SIGNATURE } = {}) =>
    `  ${epoch}:\n    epoch_cap_alpha: ${cap}\n    signature: "${signature}"\n    tiers:\n${tier(0, gib, user, '      ')}${tier(1000, gib2, user2, '      ')}`;
const SIGNED = `${mirror()}signed_schedule:\n${entry(9)}${entry(20)}`;

const replaced = (text, from, to) => {
    assert.ok(text.includes(from), `no ${from}`);
    return text.replace(from, to);
};

test('the sheet published at launch passes, and so does the tracked one', () => {
    assert.deepEqual(checkPriceSheet(LAUNCH), []);
    assert.deepEqual(checkPriceSheet(TRACKED), []);
});

test('a well-made signed sheet passes', () => {
    assert.deepEqual(checkPriceSheet(SIGNED), []);
    assert.deepEqual(checkPriceSheet(`${SIGNED}# a closing note\n`), []);
    assert.deepEqual(checkPriceSheet(replaced(SIGNED, 'sn: 25', 'sn: 25 # the subnet')), []);
    // Comments may sit beside a key with nothing after it, and beside a signature.
    assert.deepEqual(checkPriceSheet(replaced(SIGNED, '  1000:\n', '  1000: # staked operators\n')), []);
    assert.deepEqual(checkPriceSheet(replaced(SIGNED, 'signed_schedule:\n', 'signed_schedule:  # the prices\n')), []);
    assert.deepEqual(checkPriceSheet(replaced(SIGNED, `"${SIGNATURE}"\n`, `"${SIGNATURE}" # reviewed\n`)), []);
    // A signed zero schedule is a price: the return to the zero-price mode.
    const zero = { gib: '0', user: '0', gib2: '0', user2: '0' };
    assert.deepEqual(checkPriceSheet(`${mirror('0', '0', '0', '0')}signed_schedule:\n${entry(9, zero)}`), []);
    // Each component is priced in every tier or in none.
    const gibOnly = { user: '0', user2: '0' };
    assert.deepEqual(checkPriceSheet(`${mirror('0.02', '0', '0.01', '0')}signed_schedule:\n${entry(9, gibOnly)}`), []);
});

test('the top-level rates are compared with the newest entry by value', () => {
    const respelled = replaced(SIGNED, 'alpha_per_gib: 0.02\n', 'alpha_per_gib: 0.0200000000\n');
    assert.deepEqual(checkPriceSheet(respelled), []);
    // Only the newest counts: an earlier entry may state another price.
    const moved = `${mirror()}signed_schedule:\n${entry(9, { gib: '0.03' })}${entry(20)}`;
    assert.deepEqual(checkPriceSheet(moved), []);
});

// The cases named for the gate, then every other way a file can be wrong, each with
// words its refusal must contain.
const BROKEN = {
    'a wrong sn': [replaced(LAUNCH, 'sn: 25', 'sn: 26'), /sn is 26/],
    'the launch-era sn': [replaced(LAUNCH, 'sn: 25', 'sn: 1'), /sn is 1/],
    'no sn': [replaced(LAUNCH, 'sn: 25\n', ''), /no sn/],
    'sn as text': [replaced(LAUNCH, 'sn: 25', 'sn: abc'), /sn is abc/],
    'sn spelt another way': [replaced(LAUNCH, 'sn: 25', 'sn: 0x19'), /sn is 0x19/],
    'no zero tier': [replaced(LAUNCH, '  0:\n', '  1:\n'), /no 0 tier/],
    'rising rates': [`${mirror('0.01', '0.005', '0.02')}signed_schedule:\n${entry(9, { gib: '0.01', gib2: '0.02' })}`, /alpha_per_gib rises/],
    'rising user rates': [`${mirror('0.02', '0.001', '0.01', '0.002')}signed_schedule:\n${entry(9, { user: '0.001', user2: '0.002' })}`, /alpha_per_user rises/],
    'a rate rising past a double': [`${mirror('0.10000000000000000001', '0', '0.10000000000000000002', '0')}signed_schedule:\n${entry(9, { gib: '0.10000000000000000001', gib2: '0.10000000000000000002', user: '0', user2: '0' })}`, /alpha_per_gib rises/],
    'a negative rate': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: -1'), /plain decimal/],
    'a misspelt rate': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gb: 0'), /unexpected field alpha_per_gb/],
    'a misspelt rate in an entry': [replaced(SIGNED, 'tiers:\n      0:\n        alpha_per_gib', 'tiers:\n      0:\n        alpha_per_gb'), /unexpected field alpha_per_gb/],
    'the top-level rates differing from the newest entry': [replaced(SIGNED, 'alpha_per_gib: 0.02\n', 'alpha_per_gib: 0.03\n'), /differs from the newest signed entry/],
    'differing past a double': [replaced(SIGNED, 'alpha_per_gib: 0.02\n', 'alpha_per_gib: 0.0200000000000000001\n'), /differs from the newest signed entry/],
    'a differing threshold': [replaced(SIGNED, '  1000:\n', '  1001:\n'), /differs from the newest signed entry/],
    'a tier fewer than the newest entry': [`sn: 25\ntiered_per_block_demand_deposits:\n${tier(0, '0.02', '0.005')}signed_schedule:\n${entry(9)}`, /differs from the newest signed entry/],
    'rates nobody signed': [mirror(), /no signed entry states them/],
    'a missing rate': [replaced(LAUNCH, '    alpha_per_gib: 0\n', ''), /has no alpha_per_gib/],
    'a rate with no value': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib:'), /needs a value/],
    'a repeated rate': [replaced(LAUNCH, '    alpha_per_gib: 0\n', '    alpha_per_gib: 0\n    alpha_per_gib: 1\n'), /repeated field alpha_per_gib/],
    'a repeated threshold': [`sn: 25\ntiered_per_block_demand_deposits:\n${tier(0, 0, 0)}${tier(0, 0, 0)}`, /repeated field 0/],
    'the same threshold spelt twice': [`sn: 25\ntiered_per_block_demand_deposits:\n${tier(0, 0, 0)}${tier('0.0', 0, 0)}`, /thresholds must increase/],
    'thresholds out of order': [`sn: 25\ntiered_per_block_demand_deposits:\n${tier(1000, 0, 0)}${tier(0, 0, 0)}`, /no 0 tier/],
    'partly priced': [`${mirror('0.02', '0.005', '0')}signed_schedule:\n${entry(9, { gib2: '0' })}`, /zero in some tiers only/],
    'a quoted rate': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: "0"'), /plain decimal/],
    'an exponent': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 1e3'), /plain decimal/],
    'an underscore': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 1_000'), /plain decimal/],
    'hex': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 0x10'), /plain decimal/],
    'a leading dot': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: .5'), /plain decimal/],
    'a leading plus': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: +1'), /plain decimal/],
    'a leading zero': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 01'), /plain decimal/],
    'null': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: null'), /plain decimal/],
    'a rate too fine to state': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 0.00000000000000000000000000000'), /29 decimals/],
    'a rate too large': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: 18446744074'), /too large/],
    'a threshold finer than a rao': [replaced(LAUNCH, '  1000:', '  1000.0000000001:'), /not a whole number of rao/],
    'nine tiers': [`sn: 25\ntiered_per_block_demand_deposits:\n${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => tier(i, 0, 0)).join('')}`, /9 tiers/],
    'rates in flow style': ['sn: 25\ntiered_per_block_demand_deposits:\n  0: { alpha_per_gib: 1, alpha_per_user: 1 }\n', /block style/],
    'tiers in flow style': ['sn: 25\ntiered_per_block_demand_deposits: { 0: { alpha_per_gib: 0, alpha_per_user: 0 } }\n', /needs tiers/],
    'a tier with no rates': ['sn: 25\ntiered_per_block_demand_deposits:\n  0:\n', /has no alpha_per_gib/],
    'no tiers': ['sn: 25\n', /no tiered_per_block_demand_deposits/],
    'empty tiers': ['sn: 25\ntiered_per_block_demand_deposits:\n', /needs tiers/],
    'a misspelt mirror': [replaced(LAUNCH, 'tiered_per_block_demand_deposits', 'tiered_per_block_demand_deposit'), /unexpected field/],
    'a misspelt schedule': [replaced(SIGNED, 'signed_schedule', 'signed_schedulee'), /unexpected field signed_schedulee/],
    'an unknown field': [`${LAUNCH}notes: hello\n`, /unexpected field notes/],
    'a repeated section': [`${LAUNCH}${LAUNCH}`, /repeated field sn/],
    'an empty schedule': [`${LAUNCH}signed_schedule:\n`, /needs entries/],
    'a flow schedule': [`${LAUNCH}signed_schedule: {}\n`, /needs entries/],
    'epochs out of order': [`${mirror()}signed_schedule:\n${entry(20)}${entry(9)}`, /effective epochs must increase/],
    'a repeated epoch': [`${mirror()}signed_schedule:\n${entry(9)}${entry(9)}`, /repeated field 9/],
    'an epoch as text': [`${mirror()}signed_schedule:\n${entry('soon')}`, /must be a whole number/],
    'an epoch spelt in hex': [`${mirror()}signed_schedule:\n${entry('0x9')}`, /must be a whole number/],
    'an epoch past a uint64': [`${mirror()}signed_schedule:\n${entry('18446744073709551616')}`, /must be a whole number/],
    'an entry with no signature': [replaced(`${mirror()}signed_schedule:\n${entry(9)}`, `    signature: "${SIGNATURE}"\n`, ''), /has no signature/],
    'a short signature': [`${mirror()}signed_schedule:\n${entry(9, { signature: '0x00' })}`, /signature of 65 bytes/],
    'an unquoted signature': [replaced(SIGNED, `"${SIGNATURE}"`, SIGNATURE), /signature of 65 bytes/],
    'an entry with no cap': [replaced(`${mirror()}signed_schedule:\n${entry(9)}`, '    epoch_cap_alpha: 5000\n', ''), /has no epoch_cap_alpha/],
    'a zero cap': [`${mirror()}signed_schedule:\n${entry(9, { cap: '0' })}`, /epoch_cap_alpha is zero/],
    'a cap finer than a rao': [`${mirror()}signed_schedule:\n${entry(9, { cap: '1.0000000001' })}`, /not a whole number of rao/],
    'an entry with an unknown field': [replaced(SIGNED, '    tiers:\n', '    surprise: 1\n    tiers:\n'), /unexpected field surprise/],
    'an entry with bad rates': [`${mirror()}signed_schedule:\n${entry(1, { gib: '0.001' })}${entry(9)}`, /alpha_per_gib rises/],
    'a tab': [replaced(LAUNCH, 'sn: 25', 'sn:\t25'), /tab/],
    'carriage returns': [LAUNCH.replaceAll('\n', '\r\n'), /carriage return/],
    'a document marker': [`---\n${LAUNCH}`, /not a "key: value" line/],
    'two documents': [`${LAUNCH}---\n${LAUNCH}`, /not a "key: value" line/],
    'a stray line': [`${LAUNCH}stray\n`, /not a "key: value" line/],
    'a value then deeper lines': [replaced(LAUNCH, 'alpha_per_gib: 0\n', 'alpha_per_gib: 0\n        alpha_per_user: 5\n'), /indented under the value/],
    'uneven indentation': [replaced(LAUNCH, '    alpha_per_user: 0\n', '   alpha_per_user: 0\n'), /inconsistent indentation/],
    'an error page': ['<!doctype html>\n<html>not a sheet</html>\n', /not a "key: value" line/],
    'an empty file': ['', /no sn/],
    'a sequence': ['sn: 25\ntiered_per_block_demand_deposits:\n  - 0\n', /not a "key: value" line/],
    'an alias': [replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gib: *rate'), /plain decimal/],
    'broken UTF-8': [`${LAUNCH}# �\n`, /UTF-8/],
    'too large': [`${LAUNCH}#${' '.repeat(256 << 10)}\n`, /larger than/],
};

test('a broken file is refused', async (t) => {
    for (const [name, [text, reason]] of Object.entries(BROKEN)) {
        await t.test(name, () => {
            const problems = checkPriceSheet(text);
            assert.ok(problems.some(problem => reason.test(problem)), `refused for: ${problems.join('; ') || 'nothing'}`);
        });
    }
});

test('a signed entry is permanent', () => {
    const one = `${mirror()}signed_schedule:\n${entry(9)}`;
    assert.deepEqual(checkPriceSheet(SIGNED, { previous: one }), []);
    assert.deepEqual(checkPriceSheet(one, { previous: one }), []);
    assert.deepEqual(checkPriceSheet(SIGNED, { previous: LAUNCH }), []);
    assert.deepEqual(checkPriceSheet(`${one}# a note\n`, { previous: one }), []);
    const refused = (text) => checkPriceSheet(text, { previous: SIGNED }).join('; ');
    assert.match(refused(`${mirror()}signed_schedule:\n${entry(20)}`), /epoch 9 is already published and this file drops it/);
    assert.match(refused(LAUNCH), /epoch 9 is already published and this file drops it/);
    assert.match(refused(`${mirror()}signed_schedule:\n${entry(9, { cap: '5001' })}${entry(20)}`), /epoch 9 is already published and this file changes it/);
    assert.match(refused(`${mirror()}signed_schedule:\n${entry(9, { user2: '0.0024' })}${entry(20)}`), /epoch 9 is already published and this file changes it/);
    assert.match(refused(`${mirror()}signed_schedule:\n${entry(9, { signature: `0x${'cd'.repeat(65)}` })}${entry(20)}`), /epoch 9 is already published and this file changes it/);
    // A reader compares an entry's own numerator and denominator, so respelling one
    // would read as a rollback too.
    assert.match(refused(`${mirror()}signed_schedule:\n${entry(9, { gib: '0.020' })}${entry(20)}`), /epoch 9 is already published and this file changes it/);
    assert.match(checkPriceSheet(SIGNED, { previous: 'not: [a sheet' }).join('; '), /last published sheet cannot be read/);
    // Only later entries may join: an earlier one could reprice epochs readers have decided.
    const later = `${mirror()}signed_schedule:\n${entry(20)}`;
    assert.match(checkPriceSheet(SIGNED, { previous: later }).join('; '), /epoch 9 is new and comes before the newest published entry, from epoch 20/);
    assert.deepEqual(checkPriceSheet(`${mirror()}signed_schedule:\n${entry(20)}${entry(21)}`, { previous: later }), []);
});

// ── the sync, in a copy of the site laid out as the monoroot is ───────────────

const SITE_CODE = ['scripts/sync-price.mjs', 'scripts/price-gate.mjs', 'react/src/lib/price.js', 'react/src/lib/yaml.js'];
const PUBLISHED = [
    'price/price.yml', 'price/price-history.json',
    'astro/public/price.yml', 'astro/public/price.rss', 'react/public/price.yml', 'react/public/price.rss',
];

function copyFiles(site, files) {
    for (const file of files) {
        fs.mkdirSync(path.dirname(path.join(site, file)), { recursive: true });
        fs.copyFileSync(path.join(ROOT, file), path.join(site, file));
    }
}

function emptySite(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'price-gate-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const site = path.join(root, 'web/ur.xyz');
    copyFiles(site, SITE_CODE);
    fs.writeFileSync(path.join(site, 'react/package.json'), '{"type":"module"}\n');
    return { root, site, sn: path.join(root, 'sn') };
}

/** The site's code with the price files as they are tracked now, whatever they hold. */
function trackedSite(t) {
    const context = emptySite(t);
    copyFiles(context.site, PUBLISHED);
    return context;
}

/** The site's code with only the launch sheet published, as a sync leaves it. */
function launchSite(t) {
    const context = emptySite(t);
    fs.mkdirSync(path.join(context.site, 'price'), { recursive: true });
    fs.writeFileSync(path.join(context.site, 'price/price.yml'), LAUNCH);
    const seeded = sync(context);
    assert.equal(seeded.status, 0, seeded.stderr);
    return context;
}

const read = (site, file) => fs.readFileSync(path.join(site, file), 'utf8');
const published = (site) => Object.fromEntries(PUBLISHED.map(file => [file, read(site, file)]));

/** An sn checkout with this price.yml, and a `go` that builds a stand-in pricesheet tool. */
function checkout(context, text, { tool = true } = {}) {
    fs.mkdirSync(context.sn, { recursive: true });
    fs.writeFileSync(path.join(context.sn, 'price.yml'), text);
    if (tool) fs.mkdirSync(path.join(context.sn, 'cli/pricesheet'), { recursive: true });
}

const STAND_IN = `#!/bin/sh
# go build -o <tool> ./cli/pricesheet
[ "$1 $2 $4" = "build -o ./cli/pricesheet" ] || { echo "go: unexpected arguments: $*" >&2; exit 2; }
[ -z "$STAND_IN_DOES_NOT_BUILD" ] || { echo "it does not compile" >&2; exit 1; }
cat > "$3" <<'TOOL'
#!/bin/sh
[ "$1" = verify ] || exit 2
cp "\${2#--in=}" "$STAND_IN_SAW"
[ -z "$STAND_IN_REFUSES" ] || { echo "entry for epoch 9 is signed by someone else" >&2; exit 1; }
echo "verified"
TOOL
chmod +x "$3"
`;

function sync(context, args = [], env = {}) {
    const bin = path.join(context.root, 'bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'go'), STAND_IN, { mode: 0o755 });
    const { SN_DIR, ...inherited } = process.env; // the script's default must find the checkout
    return spawnSync(process.execPath, [path.join(context.site, 'scripts/sync-price.mjs'), ...args], {
        encoding: 'utf8',
        env: { ...inherited, PATH: `${bin}${path.delimiter}${process.env.PATH}`, STAND_IN_SAW: path.join(context.root, 'saw.yml'), ...env },
    });
}

test('syncing the tracked file changes nothing', (t) => {
    const context = trackedSite(t);
    const before = published(context.site);
    checkout(context, TRACKED);
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /no price change/);
    assert.match(run.stdout, /pricesheet verify passed/);
    assert.deepEqual(published(context.site), before);
    assert.equal(fs.readFileSync(path.join(context.root, 'saw.yml'), 'utf8'), TRACKED);
    // With no tool to ask, or no checkout at all, what was published last still goes through.
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const noTool = sync(context);
    assert.equal(noTool.status, 0, noTool.stderr);
    assert.match(noTool.stdout, /signatures not checked/);
    fs.rmSync(context.sn, { recursive: true });
    const noCheckout = sync(context);
    assert.equal(noCheckout.status, 0, noCheckout.stderr);
    assert.match(noCheckout.stdout, /keeping checked-in/);
    assert.deepEqual(published(context.site), before);
});

test('syncing the launch file again changes nothing', (t) => {
    const context = launchSite(t);
    const before = published(context.site);
    assert.equal(JSON.parse(before['price/price-history.json']).length, 1);
    checkout(context, LAUNCH);
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /no price change/);
    assert.deepEqual(published(context.site), before);
    // Comparing with the history is what makes it a no-op, so a newline it adds counts too.
    checkout(context, LAUNCH.trimEnd());
    const unterminated = sync(context);
    assert.equal(unterminated.status, 0, unterminated.stderr);
    assert.match(unterminated.stdout, /no price change/);
    assert.deepEqual(published(context.site), before);
});

test('a broken file stops the sync before it writes anything', (t) => {
    const context = launchSite(t);
    const before = published(context.site);
    for (const name of ['a wrong sn', 'no zero tier', 'rising rates', 'a negative rate', 'a misspelt rate', 'the top-level rates differing from the newest entry', 'rates nobody signed']) {
        checkout(context, BROKEN[name][0]);
        const run = sync(context);
        assert.equal(run.status, 1, name);
        assert.match(run.stderr, /not publishing/, name);
        assert.match(run.stderr, BROKEN[name][1], name);
        assert.deepEqual(published(context.site), before, name);
    }
});

test('a signed price is published through the gate and the tool', (t) => {
    const context = launchSite(t);
    const before = published(context.site);
    const history = () => JSON.parse(read(context.site, 'price/price-history.json'));
    const count = history().length;

    // The tool refuses, or there is no tool to ask: nothing moves.
    checkout(context, SIGNED);
    const refused = sync(context, [], { STAND_IN_REFUSES: '1' });
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /signed by someone else/);
    assert.deepEqual(published(context.site), before);
    const noBuild = sync(context, [], { STAND_IN_DOES_NOT_BUILD: '1' });
    assert.equal(noBuild.status, 1);
    assert.match(noBuild.stderr, /nothing can check them.*it does not compile/s);
    assert.deepEqual(published(context.site), before);
    checkout(context, SIGNED);
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const noTool = sync(context);
    assert.equal(noTool.status, 1);
    assert.match(noTool.stderr, /nothing can check them.*no cli\/pricesheet/s);
    assert.deepEqual(published(context.site), before);

    // The tool passes it. It saw the bytes that were published, and every copy is them.
    const fine = `${mirror('0.0000002', '0.005', '0.0000001')}signed_schedule:\n${entry(9, { cap: '4000', gib2: '0.01' })}${entry(20, { gib: '0.0000002', gib2: '0.0000001' })}`;
    checkout(context, fine);
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /price change recorded/);
    assert.equal(fs.readFileSync(path.join(context.root, 'saw.yml'), 'utf8'), fine);
    for (const file of ['price/price.yml', 'astro/public/price.yml', 'react/public/price.yml']) {
        assert.equal(read(context.site, file), fine, file);
    }
    assert.equal(history().length, count + 1);
    assert.equal(history().at(-1).yaml, fine);
    assert.deepEqual(history().slice(0, -1), JSON.parse(before['price/price-history.json']));
    const rss = read(context.site, 'react/public/price.rss');
    assert.equal(read(context.site, 'astro/public/price.rss'), rss);
    assert.match(rss, /Signed by the subnet owner: these rates apply from epoch 20, with a deposit cap of 5000 &#945; per operator per epoch\./);
    assert.match(rss, /<td>0\.0000002<\/td><td>0\.005<\/td>/); // String(0.0000002) is 2e-7
    assert.match(rss, /<td>&#8805; 1000<\/td><td>0\.0000001<\/td><td>0\.0025<\/td>/);
    assert.equal((rss.match(/<item>/g) ?? []).length, count + 1);

    // Syncing it again changes nothing, even with no tool to ask: it was verified.
    const published1 = published(context.site);
    const again = sync(context);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /no price change/);
    assert.deepEqual(published(context.site), published1);
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const untooled = sync(context);
    assert.equal(untooled.status, 0, untooled.stderr);
    assert.match(untooled.stdout, /signatures not checked/);
    assert.deepEqual(published(context.site), published1);

    // A checkout that has fallen behind, or a rollback, cannot take an entry back.
    for (const text of [LAUNCH, `${mirror('0.0000002', '0.005', '0.0000001')}signed_schedule:\n${entry(20, { gib: '0.0000002', gib2: '0.0000001' })}`]) {
        checkout(context, text);
        const rollback = sync(context);
        assert.equal(rollback.status, 1);
        assert.match(rollback.stderr, /is already published and this file drops it/);
        assert.deepEqual(published(context.site), published1);
    }
    // And an entry cannot be slipped in before the published ones.
    const slipped = `${mirror('0.0000002', '0.005', '0.0000001')}signed_schedule:\n${entry(3)}${entry(9, { cap: '4000', gib2: '0.01' })}${entry(20, { gib: '0.0000002', gib2: '0.0000001' })}`;
    checkout(context, slipped);
    const earlier = sync(context);
    assert.equal(earlier.status, 1);
    assert.match(earlier.stderr, /epoch 3 is new and comes before the newest published entry, from epoch 20/);
    assert.deepEqual(published(context.site), published1);
});

test('--check passes what a sync leaves and refuses anything else', (t) => {
    const tracked = trackedSite(t);
    const passesTracked = sync(tracked, ['--check'], { STAND_IN_DOES_NOT_BUILD: '1' });
    assert.equal(passesTracked.status, 0, passesTracked.stderr);

    const context = launchSite(t);
    const before = published(context.site);
    const check = () => sync(context, ['--check'], { STAND_IN_DOES_NOT_BUILD: '1' });
    const passes = check();
    assert.equal(passes.status, 0, passes.stderr);
    assert.deepEqual(published(context.site), before);
    const write = (file, text) => fs.writeFileSync(path.join(context.site, file), text);
    for (const [file, text, reason] of [
        ['react/public/price.yml', `${LAUNCH}# changed\n`, /react\/public\/price\.yml is not what a sync would write/],
        ['astro/public/price.yml', `${LAUNCH}# changed\n`, /astro\/public\/price\.yml is not what a sync would write/],
        ['astro/public/price.rss', '<rss></rss>\n', /astro\/public\/price\.rss is not what a sync would write/],
        ['price/price.yml', replaced(LAUNCH, 'alpha_per_gib: 0', 'alpha_per_gb: 0'), /unexpected field alpha_per_gb/],
        ['price/price.yml', `${LAUNCH}# changed\n`, /not the last entry of the history/],
    ]) {
        write(file, text);
        const run = check();
        assert.equal(run.status, 1, file);
        assert.match(run.stderr, reason, file);
        write(file, before[file]);
    }
    assert.equal(check().status, 0);
    assert.deepEqual(published(context.site), before);
});
