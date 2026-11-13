// The price sheet as the page reads it (src/lib/price.js) and shows it: the file
// published at launch, unchanged; signed entries; and rates shown digit for digit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOURCING_WALLETS, formatAlphaExact, parsePriceSheet } from '../src/lib/price.js';
import { parseYaml } from '../src/lib/yaml.js';

// The file published at launch, byte for byte: price/price.yml moves on with each
// signed price, and these tests must not.
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
const LOCALES = ['en', 'de', 'es', 'ru', 'zh', 'ar-u-nu-latn'];
const SIGNATURE = `0x${'ab'.repeat(65)}`; // never checked here; only its shape is read

const tier = (threshold, gib, user, indent = '  ') =>
    `${indent}${threshold}:\n${indent}  alpha_per_gib: ${gib}\n${indent}  alpha_per_user: ${user}\n`;
const sheet = (...tiers) => `sn: 25\ntiered_per_block_demand_deposits:\n${tiers.join('')}`;

test('the tracked sheet can be read', () => {
    const { sn, tiers } = parsePriceSheet(fs.readFileSync(new URL('../../price/price.yml', import.meta.url), 'utf8'));
    assert.equal(sn, 25);
    assert.ok(tiers.length > 0);
});

test('the sheet published at launch reads as it always has', () => {
    assert.deepEqual(parsePriceSheet(LAUNCH), {
        sn: 25,
        tiers: [
            { minStakeAlpha: 0, alphaPerGib: 0, alphaPerUser: 0, exact: { minStake: '0', gib: '0', user: '0' } },
            { minStakeAlpha: 1000, alphaPerGib: 0, alphaPerUser: 0, exact: { minStake: '1000', gib: '0', user: '0' } },
        ],
        signed: [],
    });
});

test('the page shows what the old formatter showed for every rate it could show exactly', () => {
    const before = (n, locale) => Number(n).toLocaleString(locale, { maximumFractionDigits: 8 });
    for (const locale of LOCALES) {
        for (const value of ['0', '1', '10', '999', '1000', '12345', '1000000', '0.1', '0.5', '1.5', '0.021605', '0.0027005', '1234.5678', '0.00000001']) {
            assert.equal(formatAlphaExact(value, locale), before(value, locale), `${value} in ${locale}`);
        }
    }
});

test('a rate is shown digit for digit, however many it has', () => {
    assert.equal(formatAlphaExact('0.1234567891', 'en'), '0.1234567891');
    assert.equal(formatAlphaExact('0.1234567891234567891', 'en'), '0.1234567891234567891');
    assert.equal(formatAlphaExact('0.0000000000000000000000000001', 'en'), '0.0000000000000000000000000001');
    assert.equal(formatAlphaExact('0.1234567891234567891', 'de'), '0,1234567891234567891');
    assert.equal(formatAlphaExact('12345.1234567891', 'de'), '12.345,1234567891');
    assert.equal(formatAlphaExact('18446744073', 'en'), '18,446,744,073');
    assert.equal(formatAlphaExact('123456789012345678901234567890', 'en'), '123,456,789,012,345,678,901,234,567,890');
});

test('no rate goes through a float on its way to the page', () => {
    const { tiers } = parsePriceSheet(sheet(
        tier(0, '0.1234567891234567891', '0.00000001'),
        tier('1000.5', '0.1234567891234567890', '0.00000000'),
    ).replace('0.00000000', '0.00000001'));
    assert.equal(tiers[0].exact.gib, '0.1234567891234567891');
    assert.equal(tiers[1].exact.gib, '0.123456789123456789');
    assert.equal(tiers[1].exact.minStake, '1000.5');
    assert.equal(tiers[0].exact.user, '0.00000001'); // String(0.00000001) is 1e-8
    assert.equal(tiers[0].alphaPerGib, 0.1234567891234567891); // the float, for USD
});

test('trailing zeros state the same rate', () => {
    const { tiers } = parsePriceSheet(sheet(tier(0, '0.10', '1.0'), tier('1000.0', '0.100', '1')));
    assert.deepEqual(tiers[0].exact, { minStake: '0', gib: '0.1', user: '1' });
    assert.deepEqual(tiers[1].exact, { minStake: '1000', gib: '0.1', user: '1' });
});

test('a rate the sheet does not state plainly is refused, not read as 0', () => {
    const refused = {
        'a misspelt rate': sheet(tier(0, 0, 0).replace('alpha_per_gib', 'alpha_per_gb')),
        'a missing rate': sheet('  0:\n    alpha_per_user: 0\n'),
        'a rate with no value': sheet('  0:\n    alpha_per_gib:\n    alpha_per_user: 0\n'),
        'rates in flow style': sheet('  0: { alpha_per_gib: 1, alpha_per_user: 1 }\n'),
        'a negative rate': sheet(tier(0, '-1', 0)),
        'an exponent': sheet(tier(0, '1e3', 0)),
        'a null rate': sheet(tier(0, 'null', 0)),
        'text for a rate': sheet(tier(0, 'free', 0)),
        'a bad threshold': sheet(tier('zero', 0, 0)),
        'no sn': 'tiered_per_block_demand_deposits:\n  0:\n    alpha_per_gib: 0\n    alpha_per_user: 0\n',
        'an error page': '<!doctype html>\n<html>not a sheet</html>\n',
        'an empty file': '',
    };
    for (const [name, text] of Object.entries(refused)) {
        assert.throws(() => parsePriceSheet(text), /^Error: price sheet: /, name);
    }
});

test('signed entries are read oldest first, with their effective epochs exact', () => {
    const entry = (epoch, cap, gib) => `  ${epoch}:\n    epoch_cap_alpha: ${cap}\n    signature: "${SIGNATURE}"\n    tiers:\n${tier(0, gib, 0, '      ')}`;
    const { signed, tiers } = parsePriceSheet(sheet(tier(0, '0.02', 0))
        + 'signed_schedule:\n' + entry(9, '5000', '0.01') + entry(100, '6000.5', '0.015') + entry('18446744073709551615', '7000', '0.02'));
    assert.deepEqual(signed.map(({ effectiveEpoch, capAlpha }) => [effectiveEpoch, capAlpha]), [
        ['9', '5000'], ['100', '6000.5'], ['18446744073709551615', '7000'],
    ]);
    assert.equal(signed[2].tiers[0].exact.gib, '0.02');
    assert.equal(tiers[0].exact.gib, '0.02');
});

test('an entry is signed or it is refused', () => {
    const entry = (signature) => `sn: 25\ntiered_per_block_demand_deposits:\n${tier(0, 0, 0)}signed_schedule:\n  9:\n    epoch_cap_alpha: 1\n${signature}    tiers:\n${tier(0, 0, 0, '      ')}`;
    assert.equal(parsePriceSheet(entry(`    signature: "${SIGNATURE}"\n`)).signed.length, 1);
    assert.throws(() => parsePriceSheet(entry('')), /has no signature/);
    assert.throws(() => parsePriceSheet(entry('    signature: "0x00"\n')), /has no signature/);
});

test('the YAML parser reads numbers as before unless told otherwise', () => {
    const text = 'a: 1\nb: 0.5\nc: text\nd: -2\nlist: [1, 2.5, x]\nseq:\n  - 3\n  - 0.25\nnested:\n  0: 0.1000\n';
    assert.deepEqual(parseYaml(text), { a: 1, b: 0.5, c: 'text', d: -2, list: [1, 2.5, 'x'], seq: [3, 0.25], nested: { 0: 0.1 } });
    assert.deepEqual(parseYaml(text, { exactNumbers: true }), {
        a: '1', b: '0.5', c: 'text', d: '-2', list: ['1', '2.5', 'x'], seq: ['3', '0.25'], nested: { 0: '0.1000' },
    });
});

// ── the sourcing commitment and the line before a first signed price ────────

test('the approved English is on the page word for word', async () => {
    const { default: en } = await import('../src/i18n/en.js');
    const p = en.price;
    assert.equal(p.signedBeforeInitial, "Until epoch {epoch}, the initial period's rate of 0 α stays in force.");
    assert.equal(p.sourcingTitle, 'Sourcing commitment');
    assert.equal(p.sourcingPays, 'From the first priced epoch, network operator 1 pays each of its SN25 demand deposits with alpha bought on the open market with its revenue. It uses no alpha obtained any other way.');
    assert.equal(p.sourcingRoute, 'Every purchase is on chain. USDC is swapped for TAO on Solana through Jupiter, bridged to Bittensor over LayerZero, and staked into SN25 alpha by the deposit wallet:');
    assert.equal(p.sourcingUsdcWallet, 'USDC wallet (Solana):');
    assert.equal(p.sourcingDepositWallet, 'Deposit wallet (Bittensor):');
    assert.equal(p.sourcingCheck, 'Anyone can check it: from the first priced epoch on, the alpha the deposit wallet has deposited never exceeds the alpha it has bought this way.');
});

test('every language fills the same blanks', async () => {
    for (const code of ['en', 'de', 'es', 'ru', 'zh', 'ar']) {
        const { default: dict } = await import(`../src/i18n/${code}.js`);
        const p = dict.price;
        const blanks = (text) => [...text.matchAll(/\{[a-z]+\}/g)].map((m) => m[0]).sort();
        assert.deepEqual(blanks(p.signedNote), ['{before}', '{cap}', '{epoch}'], `${code} signedNote`);
        assert.deepEqual(blanks(p.signedBefore), ['{epoch}'], `${code} signedBefore`);
        assert.deepEqual(blanks(p.signedBeforeInitial), ['{epoch}'], `${code} signedBeforeInitial`);
        assert.deepEqual(blanks(p.sourcingView), ['{explorer}'], `${code} sourcingView`);
        for (const wallet of SOURCING_WALLETS) assert.ok(p[wallet.key], `${code} ${wallet.key}`);
    }
});

test('the sourcing wallets are well formed, whole, and link their own explorer page', () => {
    const [usdc, deposit] = SOURCING_WALLETS;
    // a Solana address is 32 bytes in base58
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let n = 0n;
    for (const c of usdc.address) {
        assert.ok(BASE58.includes(c), `not base58: ${c}`);
        n = n * 58n + BigInt(BASE58.indexOf(c));
    }
    assert.ok(n > 0n && n < 2n ** 256n, 'a 32-byte key');
    assert.equal(usdc.href, `https://explorer.solana.com/address/${usdc.address}`);
    // an EVM address keeps its checksummed case (cast to-check-sum-address agrees)
    assert.match(deposit.address, /^0x[0-9a-fA-F]{40}$/);
    assert.equal(deposit.address, '0x672b0DD503c5066ab2e3fB41b84fc818e646C21B');
    assert.equal(deposit.href, `https://evm.taostats.io/address/${deposit.address}`);
    assert.deepEqual(SOURCING_WALLETS.map((w) => w.key), ['sourcingUsdcWallet', 'sourcingDepositWallet']);
});
