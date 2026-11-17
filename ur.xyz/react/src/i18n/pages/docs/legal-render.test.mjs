// The legal pages as their converter (scripts/legal-md.mjs) renders them, in
// English (docs/legal/) and in every translation (corpus/<lang>/legal/):
// emphasis renders as emphasis, so no page shows a markdown asterisk, and each
// translation emphasizes as many phrases as the English.
//
// Usage (from react/): node --test src/i18n/pages/docs/legal-render.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { legalMdToHtml } from '../../../../../scripts/legal-md.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGLISH = path.resolve(HERE, '../../../../../docs/legal');
const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const DOCS = ['terms', 'privacy', 'vdp'];
const source = (lang, doc) => fs.readFileSync(lang === 'en' ? path.join(ENGLISH, `${doc}.md`) : path.join(HERE, 'corpus', lang, 'legal', `${doc}.md`), 'utf8');

test('the converter renders **bold**, *italic*, and \\* as an asterisk', () => {
    assert.equal(legalMdToHtml('within the meaning of the *Howey* test'), '<p>within the meaning of the <em>Howey</em> test</p>');
    assert.equal(
        legalMdToHtml('*Licensed under [MPLv2](https://example.org/LICENSE). Not advice.*'),
        '<p><em>Licensed under <a href="https://example.org/LICENSE">MPLv2</a>. Not advice.</em></p>',
    );
    assert.equal(legalMdToHtml('**(b) A Heading.** Its *text*.'), '<p><strong>(b) A Heading.</strong> Its <em>text</em>.</p>');
    assert.equal(legalMdToHtml('不构成 *Howey* 测试'), '<p>不构成 <em>Howey</em> 测试</p>');
    // an asterisk that opens no emphasis stays one: beside a space, inside a word, escaped
    assert.equal(legalMdToHtml('5 * 3 * 2, x*y*z and \\*literal\\*'), '<p>5 * 3 * 2, x*y*z and *literal*</p>');
});

test('no legal page, in English or a translation, shows a markdown asterisk', () => {
    for (const lang of ['en', ...LANGS]) {
        for (const doc of DOCS) {
            const html = legalMdToHtml(source(lang, doc));
            const at = html.indexOf('*');
            assert.equal(at, -1, `${lang} ${doc}: …${html.slice(Math.max(0, at - 60), at + 60)}…`);
        }
    }
});

test('each translation of a legal page emphasizes as many phrases as the English', () => {
    const emphasized = (md) => (legalMdToHtml(md).match(/<em>/g) || []).length;
    for (const doc of DOCS) {
        const english = emphasized(source('en', doc));
        for (const lang of LANGS) assert.equal(emphasized(source(lang, doc)), english, `${lang} ${doc}`);
    }
});
