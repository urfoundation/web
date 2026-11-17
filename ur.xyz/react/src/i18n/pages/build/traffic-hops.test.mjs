// /build's opportunity briefs draw each hop of an opportunity's traffic path as
// a box: BuildBrief.jsx splits the path on "→". A translation that drops,
// adds or turns one of those arrows would merge or split the boxes, so every
// language keeps exactly the English hops.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import en from './opportunities/en.js';

const LANGS = ['ru', 'ar', 'zh', 'de', 'es'];
const hops = (path) => path.split('→').length;

test('every translation of a traffic path keeps one → per hop', async () => {
    for (const lang of LANGS) {
        const file = new URL(`./opportunities/${lang}.js`, import.meta.url);
        if (!fs.existsSync(file)) continue; // a group not yet localized may lack a language
        const t = (await import(file.href)).default;
        en.items.forEach((item, i) => {
            assert.equal(hops(t.items[i].traffic), hops(item.traffic), `${lang}: opportunity ${i + 1} (${item.slug ?? item.short})`);
        });
    }
});
