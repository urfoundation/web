// The owner's style decisions of 2026-11-12 for the site's Chinese and Spanish,
// checked wherever the site says something in those languages: the site
// dictionaries (i18n/<lang>.js), every copy unit (pages/**/<lang>.js) and the
// docs corpus (pages/docs/corpus/<lang>), code blocks and inline code left out.
//
// Chinese
//   - Hong Kong, Macao and Taiwan are 香港, 澳门 and 台湾, as the English site's
//     short names: never CLDR's 特别行政区 forms or a 中国… prefix (Intl's names
//     go through format.js REGION_NAMES);
//   - a count of places says 国家和地区, since the places counted can include
//     territories ("{count} 个国家和地区", "100 多个国家和地区");
//   - the pot is 累积池, never 累计奖励 (and never the lottery's 奖池).
// Spanish: neutral Latin American Spanish, the reader addressed as tú
//   - no vosotros, and no usted (ustedes, the plural, stays);
//   - no Spain-only word where a Latin American one exists: computadora,
//     costo, confiable, monitoreo, presionar a key, en vivo, Rumania, Arabia
//     Saudita;
//   - a dollar amount names the dollar US$ ("US$134 millones"), never a bare $;
//   - capture the flag is Captura la bandera, without quotes.
//
// Usage (from react/): node --test src/i18n/pages/style.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const PAGES = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.dirname(PAGES);

/** Every file that says something in `lang`, as [relative path, its words]: string literals' code and markdown code dropped. */
function sources(lang) {
    const out = [];
    const add = (file, text) => out.push([path.relative(I18N, file), text]);
    add(path.join(I18N, `${lang}.js`), jsText(path.join(I18N, `${lang}.js`)));
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) walk(abs);
            else if (e.name === `${lang}.js`) add(abs, jsText(abs));
            else if (abs.includes(`${path.sep}corpus${path.sep}${lang}${path.sep}`) && e.name.endsWith('.md')) add(abs, mdText(abs));
        }
    };
    walk(PAGES);
    return out;
}
// a copy unit without its comments
const jsText = (file) => fs.readFileSync(file, 'utf8').split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');
// a document without its code
const mdText = (file) => fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');

function refuse(lang, rules) {
    const found = [];
    for (const [file, text] of sources(lang)) {
        for (const [why, re] of rules) {
            for (const m of text.matchAll(new RegExp(re.source, `${re.flags.replace('g', '')}g`))) {
                found.push(`${file}: ${why}: …${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20).replace(/\s+/g, ' ')}…`);
            }
        }
    }
    assert.deepEqual(found, [], found.join('\n'));
}

test('Chinese names Hong Kong, Macao and Taiwan as the English site does, counts places as 国家和地区, and calls the pot 累积池', () => {
    refuse('zh', [
        ['a 特别行政区 form or a 中国… prefix', /特别行政区|中国(?:香港|澳门|台湾)/u],
        ['a count of places without 和地区', /(?:\d|\}|多|\+) ?个国家(?!和地区)/u],
        ['the pot is 累积池', /累计奖励|奖池/u],
    ]);
});

test('Spanish is neutral Latin American Spanish in tú, names the dollar US$ and capture the flag without quotes', () => {
    refuse('es', [
        ['vosotros', /\b(?:vosotr[oa]s|vuestr[oa]s?)\b|\p{L}+(?:áis|éis)\b/iu],
        ['usted', /\busted\b/iu],
        ['a Spain-only word', /\b(?:ordenador(?:es)?|costes?|fiab(?:le|les|ilidad)|monitorización|puls(?:a|ar|e)|en directo|Rumanía|Arabia Saudí)\b/iu],
        ['a bare $ before an amount', /(?<![\p{L}$])\$\s?\d/u],
        ['Captura la bandera in quotes', /[«“"]Captura la bandera[»”"]/iu],
    ]);
});
