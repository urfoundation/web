// The owner's style decisions of 2026-11-12 for the site's languages,
// checked wherever the site says something in them: the site dictionaries
// (i18n/<lang>.js), every copy unit (pages/**/<lang>.js) and the docs corpus
// (pages/docs/corpus/<lang>), code blocks and inline code left out.
//
// Chinese
//   - Hong Kong, Macao and Taiwan are 香港, 澳门 and 台湾, as the English site's
//     short names: never CLDR's 特别行政区 forms or a 中国… prefix (Intl's names
//     go through format.js REGION_NAMES);
//   - a count of places says 国家和地区, since the places counted can include
//     territories ("{count} 个国家和地区", "100 多个国家和地区");
//   - a label that names a place without counting says 国家或地区 (输入国家或地区,
//     更多国家或地区, 你所在的国家或地区, the search messages, the table's column);
//   - the pot is 累积池, never 累计奖励 (and never the lottery's 奖池).
// Spanish: neutral Latin American Spanish, the reader addressed as tú
//   - no vosotros, and no usted (ustedes, the plural, stays);
//   - no Spain-only word where a Latin American one exists: computadora,
//     costo, confiable, monitoreo, presionar a key, en vivo;
//   - a place is named as Latin American CLDR (es-419) names it where Spain's
//     differs: Rumania, Arabia Saudita, Costa de Marfil, Timor Oriental, Islas
//     Åland, República del Congo, Islas Georgia del Sur y Sándwich del Sur,
//     Bosnia-Herzegovina, Islas Ultramarinas de EE.UU.;
//   - a dollar amount names the dollar US$ before the figure ("US$134 millones";
//     format.js formatUsd writes the code's amounts so: "US$1,97"), never a
//     bare $;
//   - capture the flag is Captura la bandera, without quotes;
//   - the pages' og:locale is es_LA, Latin American Spanish.
// Russian, German, Arabic and Spanish
//   - Hong Kong and Macao are Гонконг and Макао, Hongkong and Macau, هونغ كونغ
//     and ماكاو, Hong Kong and Macao: the short names, as in English, never
//     CLDR's Гонконг (САР), Sonderverwaltungsregion Hongkong, the Arabic
//     منطقة إدارية خاصة forms or RAE de Hong Kong (China).
// Russian and German
//   - /mainnet writes its figures as Intl does for the page, as /ctf does
//     (9.240.028, 1.076,26; 9 240 028, 1 076,26): mainnet/timeline.js
//     INTL_FIGURES, held figure by figure by mainnet/mainnet-copy.test.mjs.
// Arabic
//   - /dashboard's Overview writes its data carried figure with ت.ب, the
//     terabyte's narrow form, as the charts' axes do: the short form is the
//     whole word (تيرابايت), which ran past the card at desktop widths
//     (dashboard/engine.js UR.NARROW_CARD); every other figure, and that figure
//     in every other language, keeps the form it had.
// Every language (decision of 2026-11-12): capture the flag is an auction, and
// its draw a public, verifiable random selection among the eligible entries,
// so no page in any language names it with the words of drawing lots
// (жеребьёвка, жребий, القرعة, 抽签, 摇号, Auslosung, Losentscheid, sorteo);
// the capture the flag copy tests (pages/ctf, pages/mainnet) refuse their
// verbs and kin too, which mean other things elsewhere on the site.
//
// Usage (from react/): node --test src/i18n/pages/style.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { INTL_FIGURES, figure } from '../../components/pages/mainnet/timeline.js';
import { assembleLive } from '../../lib/dashboardData.js';
import { displayRegion, formatUsd, interpolate, intlLocale, pluralCategory } from '../format.js';
import { loadPageCopy } from '../page-copy.js';

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

// a word, not a part of one: \b is ASCII-only, and á, í, ó end Spanish words
const word = (alternatives) => new RegExp(`(?<!\\p{L})(?:${alternatives})(?!\\p{L})`, 'iu');

test('Chinese names Hong Kong, Macao and Taiwan as the English site does, counts places as 国家和地区, and calls the pot 累积池', () => {
    refuse('zh', [
        ['a 特别行政区 form or a 中国… prefix', /特别行政区|中国(?:香港|澳门|台湾)/u],
        // after a figure, a placeholder, a Chinese numeral or 多, or as the label a figure stands before ('个国家')
        ['a count of places without 和地区', /[\d}多+几数十百千万两'"`]\s?个国家(?!和地区)/u],
        ['the pot is 累积池', /累计奖励|奖池/u],
    ]);
    assert.deepEqual(['hk', 'mo', 'tw'].map((code) => displayRegion(code, 'zh')), ['香港', '澳门', '台湾']);
});

test('Spanish is neutral Latin American Spanish in tú, names the dollar US$ and capture the flag without quotes', () => {
    refuse('es', [
        ['vosotros', word('vosotr[oa]s|vuestr[oa]s?|\\p{L}+(?:áis|éis)')],
        ['vosotros', /(?<![\p{L}{<\/.])(?:os|sois|vais|dais|veis)(?![\p{L}}>\/])/u],
        ['usted', word('usted')],
        ['a Spain-only word', word([
            'ordenador(?:es)?', 'costes?', 'fiab(?:le|les|ilidad)', 'monitorización', 'puls(?:a|as|ar|en|ando|ado)',
            'en directo', 'Rumanía', 'Arabia Saudí', 'armarios?', 'cestas?', 'aparcad[oa]s?',
            '(?:un|el|tu|su|los|tus|sus|del|al) portátil(?:es)?', 'en móviles',
        ].join('|'))],
        ['a bare $ before an amount', /(?<![\p{L}$])\$\s?\d/u],
        ['Captura la bandera in quotes', /[«“"]Captura la bandera[»”"]/iu],
        ['a place as Spain\'s CLDR names it (es-419)', /Côte d[’']Ivoire|Timor-Leste|Islas Aland|Sandwich|(?<!del\s)(?<!\p{L})Congo(?!\p{L})|Bosnia y Herzegovina|Islas menores/u],
    ]);
    assert.deepEqual(['ro', 'sa', 'ci', 'tl', 'ax', 'cg', 'gs', 'ba', 'um'].map((code) => displayRegion(code, 'es')), [
        'Rumania', 'Arabia Saudita', 'Costa de Marfil', 'Timor Oriental', 'Islas Åland', 'República del Congo', 'Islas Georgia del Sur y Sándwich del Sur',
        'Bosnia-Herzegovina', 'Islas Ultramarinas de EE.UU.',
    ]);
    // og:locale for the Spanish pages: Latin American Spanish, in the layout and the dashboard's own head
    for (const file of ['astro/src/layouts/Base.astro', 'astro/src/components/routes/DashboardRoute.astro']) {
        const head = fs.readFileSync(path.resolve(PAGES, '../../../..', file), 'utf8');
        assert.match(head, /\bes: 'es_LA'/, file);
        assert.doesNotMatch(head, /es_ES/, file);
    }
});

test('Chinese labels that name a place without counting say 国家或地区', async () => {
    // a label that begins with the verb or quantifier and names the place, as the search box and the lists do
    refuse('zh', [['a label naming a place without 或地区', /(?<=['"`])(?:输入|搜索|更多|所有|主要|其他)国家(?!或地区|和地区)/u]]);
    const unit = async (rel) => (await import(new URL(rel, import.meta.url))).default;
    const [ctf, dashboard, script] = await Promise.all(['./ctf/zh.js', './dashboard/zh.js', './dashboard/script/zh.js'].map(unit));
    const labels = {
        'ctf board.empty': ctf.board.empty, 'ctf board.findPlaceholder': ctf.board.findPlaceholder,
        'ctf card.pickLabel': ctf.card.pickLabel, 'ctf card.pickPlaceholder': ctf.card.pickPlaceholder, 'ctf country.more': ctf.country.more,
        // the card's own place, the visitor's (a visitor in 香港, 澳门 or 台湾 sees it), and the links and hints to a place
        'ctf card.here': ctf.card.here, 'ctf card.yourCountry': ctf.card.yourCountry, 'ctf card.where': ctf.card.where,
        'ctf card.whereIn': ctf.card.whereIn, 'ctf cell.countryPage': ctf.cell.countryPage, 'ctf legend.mobile': ctf.legend.mobile,
        'dashboard/script country.prompt': script.country.prompt,
        'dashboard titles.allCountries': dashboard.titles.allCountries, 'dashboard common.searchCountry': dashboard.common.searchCountry,
        'dashboard/script country.none': script.country.none, 'dashboard/script country.topCountries': script.country.topCountries,
        'dashboard/script country.tableCountry': script.country.tableCountry,
    };
    for (const [key, value] of Object.entries(labels)) assert.match(value, /国家或地区/u, `${key}: ${value}`);
});

test('Russian, German, Arabic and Spanish name Hong Kong and Macao by their short names, never CLDR\'s SAR forms', () => {
    refuse('ru', [['CLDR\'s SAR form', /\(САР\)|Специальный административный район/u]]);
    refuse('de', [['CLDR\'s SAR form', /Sonderverwaltungsregion/u]]);
    refuse('ar', [['CLDR\'s SAR form', /إدارية خاصة|الإدارية الخاصة|هونغ كونغ الصينية/u]]);
    refuse('es', [['CLDR\'s SAR form', /RAE de|Región Administrativa Especial/u]]);
    const SHORT = { ru: ['Гонконг', 'Макао'], de: ['Hongkong', 'Macau'], ar: ['هونغ كونغ', 'ماكاو'], es: ['Hong Kong', 'Macao'] };
    for (const [lang, names] of Object.entries(SHORT)) assert.deepEqual(['hk', 'mo'].map((code) => displayRegion(code, lang)), names, lang);
});

test('Russian and German write /mainnet\'s figures as Intl does', () => {
    assert.ok(['es', 'de', 'ru'].every((lang) => INTL_FIGURES.includes(lang)), String(INTL_FIGURES));
    assert.equal(figure(9247228, 'de'), '9.247.228');
    assert.equal(figure(9247228, 'ru'), '9\u00a0247\u00a0228');
    assert.equal(figure(9247228, 'ar'), '9,247,228');
});

const DASHBOARD = path.resolve(PAGES, '../../components/pages/dashboard');

/** /dashboard's engine.js as the page runs it in `lang` (loader.js's window.UR_I18N), before any read has answered: its UR. */
async function dashboardEngine(lang) {
    const [page, script] = await Promise.all([loadPageCopy('dashboard'), loadPageCopy('dashboard/script')]);
    const window = {
        UR_I18N: {
            lang, locale: intlLocale(lang), t: script(lang), page: page(lang), interpolate,
            plural: (forms, count, options) => forms[pluralCategory(lang, count, options)] ?? forms.other,
            usd: String, region: () => null,
        },
        SNAP: assembleLive({}),
        document: { querySelector: () => null, querySelectorAll: () => [] },
        matchMedia: () => ({ matches: false }),
        ResizeObserver: class { observe() {} },
        addEventListener() {},
        console, performance, setTimeout,
    };
    window.window = window;
    vm.runInNewContext(fs.readFileSync(path.join(DASHBOARD, 'engine.js'), 'utf8'), window);
    return window.UR;
}

test('Arabic writes the dashboard Overview\'s data carried figure with ت.ب, the narrow terabyte the charts\' axes write', async () => {
    const card = (UR) => [10.8, 108].map((v) => UR.un(v, v >= 100 ? 0 : 1, 'TB', UR.NARROW_CARD));
    for (const lang of ['en', 'ru', 'ar', 'zh', 'de', 'es']) {
        const UR = await dashboardEngine(lang);
        if (lang === 'ar') {
            assert.deepEqual(card(UR), ['10.8 ت.ب', '108 ت.ب']);
            // the short form, every other figure's, is the whole word
            assert.equal(UR.un(10.8, 1, 'TB'), '10.8 تيرابايت');
        } else {
            // the figure as it was, in the page's other figures' form
            assert.deepEqual(card(UR), [10.8, 108].map((v) => UR.un(v, v >= 100 ? 0 : 1, 'TB')), lang);
        }
    }
    // page.js gives the narrow form to that figure alone
    const code = fs.readFileSync(path.join(DASHBOARD, 'page.js'), 'utf8').split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');
    assert.deepEqual([...code.matchAll(/\btbCard\(([^)]*)\)/g)].map((m) => m[1]), ['nw.data']);
    assert.match(code, /set\('#o-data',tbCard\(nw\.data\)\)/);
    assert.equal(code.match(/NARROW_CARD/g).length, 1);
});

test('no page in any language names capture the flag\'s draw with the words of drawing lots', () => {
    refuse('ru', [['a drawing of lots (the draw is случайный отбор)', /жеребь[её]вк|жреби[йяюеи]/iu]]);
    refuse('ar', [['a drawing of lots (the draw is الاختيار العشوائي)', /قرع[ةت]/u]]);
    refuse('zh', [['a drawing of lots (the draw is 随机选取)', /抽签|抽中|摇号/u]]);
    refuse('de', [['a drawing of lots (the draw is Zufallsauswahl)', /auslos|ausgelost|losentscheid|losverfahren/iu]]);
    refuse('es', [['a drawing of lots (the draw is selección aleatoria)', word('sorteos?|sortead[oa]s?')]]);
});

test('the code writes a Spanish dollar amount as US$ and Intl\'s figure, and every other language as Intl does', () => {
    assert.equal(formatUsd(1.97, 'es'), 'US$1,97');
    assert.equal(formatUsd(-1.97, 'es'), '-US$1,97');
    assert.equal(formatUsd(1350000, 'es', { notation: 'compact', maximumFractionDigits: 2 }), 'US$1,35\u00a0M');
    assert.equal(formatUsd(0.05, 'es', { currencyDisplay: 'narrowSymbol' }), 'US$0,05');
    for (const lang of ['ru', 'ar', 'zh', 'de']) {
        assert.equal(formatUsd(1.97, lang), new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { style: 'currency', currency: 'USD' }).format(1.97), lang);
    }
});
