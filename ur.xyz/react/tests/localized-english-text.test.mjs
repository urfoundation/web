// tests/localized-english-text.mjs on pages of its own: code marked
// translate="no" is the same in every language and is not compared, while the
// prose around it still is, and the mark on anything but code, pre, kbd or
// samp is reported, so it cannot hide prose.
import assert from 'node:assert/strict';
import test from 'node:test';

import { englishOnPage, misplacedTranslateNo, pageText, withoutTranslateNo, withoutUnits } from './localized-english-text.mjs';

const page = (lang, body) => `<!doctype html><html lang="${lang}"><head><title>Fixture</title></head><body><main>${body}</main></body></html>`;
const englishPage = page('en', '<p>Run <code translate="no">provider auth --operator=you</code> to sign in.</p>'
    + '<pre translate="no"><code>provider start --hotkey_seed_file seed.txt</code></pre>');
const english = new Set(pageText(englishPage).map((s) => s.text));

test('a code span marked translate="no" is skipped; the prose beside it is still compared', () => {
    const texts = pageText(englishPage).map((s) => s.text);
    assert.ok(texts.includes('Run'));
    assert.ok(texts.includes('to sign in.'));
    assert.ok(!texts.some((t) => t.includes('provider')), texts.join(' | '));

    // translated around the same code: nothing to report
    const translated = page('de', '<p>Führe <code translate="no">provider auth --operator=you</code> aus, um dich anzumelden.</p>'
        + '<pre translate="no"><code>provider start --hotkey_seed_file seed.txt</code></pre>');
    assert.deepEqual(englishOnPage(translated, english), []);

    // the prose after the code left in English is reported on its own
    const half = page('de', '<p>Führe <code translate="no">provider auth --operator=you</code> to sign in.</p>');
    assert.deepEqual(englishOnPage(half, english).map((f) => f.text), ['to sign in.']);

    // the same command without the mark is compared like any text
    const unmarked = page('de', '<p>Führe <code>provider auth --operator=you</code> aus.</p>');
    const withUnmarked = new Set(pageText(page('en', '<p>Run <code>provider auth --operator=you</code> to sign in.</p>')).map((s) => s.text));
    assert.deepEqual(englishOnPage(unmarked, withUnmarked).map((f) => f.text), ['provider auth --operator=you']);
});

test('an element marked translate="no" goes with all it holds, its own kind nested inside included', () => {
    assert.equal(withoutTranslateNo('<p>a <code translate="no">x <code>y</code> z</code> b</p>'), '<p>a <translate-no> b</p>');
    assert.equal(withoutTranslateNo('<pre translate="no"><code>one</code></pre><p>two</p>'), '<translate-no><p>two</p>');
    assert.equal(withoutTranslateNo('<p>no mark</p>'), '<p>no mark</p>');
    // its attributes go too
    assert.ok(!pageText(page('en', '<code translate="no" title="a title in English">x</code>')).some((s) => s.source === '@title'));
});

test('only code, pre, kbd and samp may carry translate="no"', () => {
    assert.deepEqual(misplacedTranslateNo('<code translate="no">a</code><pre translate="no">b</pre><kbd translate="no">c</kbd><samp translate="no">d</samp>'), []);
    assert.deepEqual(misplacedTranslateNo('<p translate="no">prose</p><div class="x" translate="no">more</div><span translate="no">s</span>'), ['p', 'div', 'span']);
});

test('a unit of measure beside a figure, or alone, is no English prose; prose around it still is', () => {
    const en = page('en', '<p>The median fell to <b>457.6 ms</b> from <b>2,552.3 → 543.7 ms</b>.</p><p><span>98.21</span><span>ms</span></p><p>Keep the ms budget low.</p>');
    const english = new Set(pageText(en).map((s) => s.text));
    // a Chinese page writes the figures and units as the English does, and translates the sentences
    const zh = page('zh', '<p>中位数从 <b>2,552.3 → 543.7 ms</b> 降到 <b>457.6 ms</b>。</p><p><span>98.21</span><span>ms</span></p><p>保持低延迟。</p>');
    assert.deepEqual(englishOnPage(zh, english), []);
    // an untranslated sentence with a unit in it is still English
    const half = page('zh', '<p>Keep the ms budget low.</p>');
    assert.deepEqual(englishOnPage(half, english).map((f) => f.text), ['Keep the ms budget low.']);
    assert.equal(withoutUnits('375.5/450.0/98.21 ns'), '375.5/450.0/98.21');
    assert.equal(withoutUnits('12 GiB and 3 MiB/s'), '12 and 3');
    assert.equal(withoutUnits('5 seconds'), '5 seconds', 'a word that starts like a unit is a word');
    assert.equal(withoutUnits('ms'), '');
    assert.equal(withoutUnits('3 us'), '3 us', '"us" is a word, not a unit');
});
