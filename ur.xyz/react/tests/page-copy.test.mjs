// The page groups' copy (src/i18n/page-copy.js) and the locale formatting the
// pages use (src/i18n/format.js): English fills what a translation lacks,
// plural nodes keep each language's own forms, figures follow the page's
// language (Arabic in Western digits) and dates are UTC.
import assert from 'node:assert/strict';
import test from 'node:test';

import { copyFromTable, isPluralNode, loadPageCopy } from '../src/i18n/page-copy.js';
import { displayRegion, formatDate, formatList, formatNumber, formatPercent, interpolate, plural, pluralCategory } from '../src/i18n/format.js';

const en = { title: 'About', n: 3, list: ['a', 'b'], count: { one: '{count} page', other: '{count} pages' }, nested: { x: 'X', y: 'Y' } };
const ru = { title: 'О проекте', list: ['а'], count: { one: '{count} страница', few: '{count} страницы', many: '{count} страниц', other: '{count} страницы' }, nested: { x: 'Икс' } };

test('a translation reads over English, which fills what it lacks', () => {
    const copy = copyFromTable('fixture', { en, ru });
    assert.equal(copy('en'), en);
    assert.deepEqual(copy('ru'), {
        title: 'О проекте', n: 3, list: ['а', 'b'],
        count: ru.count,
        nested: { x: 'Икс', y: 'Y' },
    });
    // a language not loaded, or not a site language, reads English
    assert.equal(copy('de'), en);
    assert.equal(copy('xx'), en);
    assert.equal(copy(), en);
    // the same object each time, so a render can compare it
    assert.equal(copy('ru'), copy('ru'));
    assert.throws(() => copyFromTable('fixture', { ru }), /no English/);
});

test('a plural node is one entry with each language its own forms', () => {
    assert.equal(isPluralNode(en.count), true);
    assert.equal(isPluralNode({ other: 'x' }), true);
    assert.equal(isPluralNode(en.nested), false);
    assert.equal(isPluralNode({ one: 'x' }), false);
    assert.equal(isPluralNode(['one', 'other']), false);
    const forms = copyFromTable('fixture', { en, ru })('ru').count;
    assert.deepEqual([1, 2, 5, 21, 11].map((n) => interpolate(plural('ru', n, forms), { count: n })),
        ['1 страница', '2 страницы', '5 страниц', '21 страница', '11 страниц']);
    assert.deepEqual([0, 1, 2, 3, 11, 100].map((n) => pluralCategory('ar', n)), ['zero', 'one', 'two', 'few', 'many', 'other']);
    assert.equal(plural('zh', 5, { other: '{count} 个' }), '{count} 个');
    assert.equal(plural('de', 1, { other: 'x' }), 'x');
});

test('a unit is read from disk in node, and a missing unit says so', async () => {
    await assert.rejects(loadPageCopy('no-such-unit'), /no English for unit "no-such-unit"/);
});

test('figures and dates follow the page language, never the machine', () => {
    assert.equal(formatNumber(1234567.5, 'en'), '1,234,567.5');
    assert.equal(formatNumber(1234567.5, 'de'), '1.234.567,5');
    assert.equal(formatNumber(1234567.5, 'ar'), '1,234,567.5'); // Western digits
    assert.match(formatNumber(1234567.5, 'ru'), /^1\s234\s567,5$/u);
    assert.equal(formatNumber(1234567.5, 'xx'), '1,234,567.5'); // unknown → English
    assert.equal(formatPercent(0.125, 'en'), '12.5%');
    assert.match(formatPercent(0.125, 'de'), /^12,5\s%$/u);
    assert.doesNotMatch(formatPercent(0.125, 'ar'), /[٠-٩]/);
    assert.equal(formatDate('2026-11-27', 'en'), 'November 27, 2026');
    assert.equal(formatDate('2026-11-27', 'de'), '27. November 2026');
    assert.equal(formatDate(Date.UTC(2026, 10, 27, 23, 30), 'en'), 'November 27, 2026'); // UTC, not the machine's zone
    assert.equal(formatDate('2026-11-27', 'zh'), '2026年11月27日');
    assert.doesNotMatch(formatDate('2026-11-27', 'ar'), /[٠-٩]/);
    assert.equal(formatList(['a', 'b', 'c'], 'en'), 'a, b, and c');
    assert.equal(formatList(['a', 'b', 'c'], 'es'), 'a, b y c');
    assert.equal(displayRegion('ke', 'de'), 'Kenia');
    assert.equal(displayRegion('KE', 'en'), 'Kenya');
});

test('interpolate fills named placeholders and leaves unknown ones for the gates', () => {
    assert.equal(interpolate('{a} and {b}', { a: 1, b: 'two' }), '1 and two');
    assert.equal(interpolate('{a} and {missing}', { a: 1 }), '1 and {missing}');
    assert.equal(interpolate('{count} slots', { count: 0 }), '0 slots');
});
