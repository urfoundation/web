// The investors group in every language (react/src/i18n/pages/investors/):
//
//   • each translation keeps its English's shape, markup, placeholders,
//     figures, addresses and names, and its page heads fit and differ
//     (translation-checks.mjs);
//   • the Bittensor letter's English copy is the published letter: rendered by
//     InvestorLetterTranslation.jsx in English it is InvestorLetter.jsx's
//     markup exactly (that page stays the English letter, which its PDF is
//     printed from);
//   • every page renders in every language with no markup or placeholder left
//     as text, and a translated page says the English is authoritative and
//     links it, while the English page does not.
//
// The components are JSX, so they load through Vite's SSR loader.
import assert from 'node:assert/strict';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

import { LANGS, checkUniqueHeads, checkUnit, units } from './translation-checks.mjs';

const REACT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
let vite;
const load = (rel) => vite.ssrLoadModule(path.join(REACT_DIR, rel));

before(async () => {
    vite = await createServer({
        root: REACT_DIR,
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, watch: null },
    });
});
after(async () => { await vite?.close(); });

for (const lang of LANGS) {
    test(`${lang}: every unit is translated, keeping its figures, names and markup, with heads that fit`, async () => {
        const problems = [];
        for (const unit of units()) problems.push(...await checkUnit(unit, lang));
        problems.push(...await checkUniqueHeads(lang));
        assert.deepEqual(problems, []);
    });
}

test('the Bittensor letter: its copy, rendered in English, is the published letter', async () => {
    const { default: InvestorLetter } = await load('src/components/pages/investors/InvestorLetter.jsx');
    const { default: InvestorLetterTranslation } = await load('src/components/pages/investors/InvestorLetterTranslation.jsx');
    const published = renderToStaticMarkup(React.createElement(InvestorLetter));
    const fromCopy = renderToStaticMarkup(React.createElement(InvestorLetterTranslation, { lang: 'en' }));
    assert.equal(fromCopy, published);
});

const PAGES = {
    '': '/investors',
    deck: '/investors/deck',
    'conviction-lock': '/investors/conviction-lock',
    'apex-competition': '/investors/apex-competition',
    'our-letter-to-bittensor': '/investors/our-letter-to-bittensor',
    'letter-to-tokenholders-september-2026': '/investors/letter-to-tokenholders-september-2026',
    'funding-network-capacity': '/investors/funding-network-capacity',
};

test('every page renders in every language: no markup left as text, the English authoritative and linked', async () => {
    const { default: InvestorsPage } = await load('src/components/pages/Investors.jsx');
    for (const [slug, englishPath] of Object.entries(PAGES)) {
        for (const lang of ['en', ...LANGS]) {
            const where = `${englishPath} (${lang})`;
            const html = renderToStaticMarkup(React.createElement(InvestorsPage, { route: { name: 'investors', slug: slug || null }, lang }));
            const text = html.replace(/<[^>]+>/g, ' ');
            assert.doesNotMatch(text, /\{[A-Za-z][A-Za-z0-9]*\}/, `${where}: a placeholder reached the page`);
            assert.doesNotMatch(html, /&lt;\/?[a-z][a-z0-9]*\/?&gt;/, `${where}: inline markup reached the page as text`);
            const notices = html.match(/<p class="investor-translation[^"]*" role="note">[\s\S]*?<\/p>/g) || [];
            if (lang === 'en') {
                assert.equal(notices.length, 0, `${where}: the English page carries a translation notice`);
                continue;
            }
            assert.equal(notices.length, 1, `${where}: one translation notice`);
            assert.match(notices[0], new RegExp(`<a href="${englishPath}" hrefLang="en" data-lang-choice="en">[^<]+</a>`, 'i'),
                `${where}: the notice links the English original`);
            // a translated document's PDF is the English one, and says so
            for (const pdf of html.match(/<a [^>]*href="\/investors\/[^"]+\.pdf"[^>]*>/g) || []) {
                assert.match(pdf, /hrefLang="en"/i, `${where}: ${pdf} is the English PDF`);
            }
        }
    }
});
