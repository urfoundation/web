// /dashboard's copy units against the page that reads them (make gates runs node --test on this tree):
// body.html's {{tokens}} all name strings and leave no placeholder in any language, the page's scripts
// read only keys the copy has, the strings chosen by period, step or continent are all there, the plural
// nodes are whole, and the head's text fits its limits.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { loadPageCopy, isPluralNode } from '../../page-copy.js';
import { SITE_LANG_CODES } from '../../../../../astro/src/lib/route-localization.js';
import { renderBody } from '../../../components/pages/dashboard/markup.js';
import page from './en.js';
import method from './method/en.js';
import script from './script/en.js';

const read = (name) => fs.readFileSync(new URL(`../../../components/pages/dashboard/${name}`, import.meta.url), 'utf8');
const PLACEHOLDER = /\{[A-Za-z][A-Za-z0-9_]*\}/g;

test('body.html renders in every site language, every token resolved and every placeholder filled', async () => {
    const units = await Promise.all(['dashboard', 'dashboard/method', 'dashboard/script'].map((unit) => loadPageCopy(unit)));
    for (const lang of SITE_LANG_CODES) {
        const [p, m, s] = units.map((copy) => copy(lang));
        const html = renderBody(read('body.html'), { page: p, method: m, script: s, lang });
        assert.ok(!html.includes('{{'), `${lang}: a token left`);
        assert.equal(html.match(PLACEHOLDER), null, `${lang}: a placeholder left`);
    }
});

test('the More stats tab keeps its English shape: its short name, then the rest for wide screens', () => {
    const html = renderBody(read('body.html'), { page, method, script, lang: 'en' });
    assert.ok(html.includes('<span>More<span class="nl-x"> stats</span></span>'));
    const other = renderBody(read('body.html'), { page: { ...page, nav: { ...page.nav, more: 'Weitere Zahlen', moreShort: 'Mehr' } }, method, script, lang: 'de' });
    assert.ok(other.includes('<span><span class="nl-x">Weitere Zahlen</span><span class="nl-s">Mehr</span></span>'));
});

test('the page scripts read only keys the copy has', () => {
    const has = (root, path) => path.split('.').reduce((node, key) => (node == null ? node : node[key]), root) !== undefined;
    for (const file of ['engine.js', 'page.js']) {
        const used = [...read(file).matchAll(/\b(TX|PG)\.([A-Za-z][A-Za-z0-9_.]*)/g)];
        assert.ok(used.length > 20, `${file} reads the copy`);
        for (const [, unit, path] of used) assert.ok(has(unit === 'TX' ? script : page, path), `${file}: ${unit}.${path} is not in the copy`);
    }
    assert.ok(read('loader.js').includes('t.loadError') && typeof script.loadError === 'string');
});

test('strings picked by period, step and continent are all there', () => {
    const PERIODS = ['d1', 'd3', 'd7', 'd30', 'd90'], STEPS = ['hour', 'sixHours', 'day'];
    for (const node of [script.periodLength, script.periodAverage, script.vsPeriodAverage]) assert.deepEqual(Object.keys(node), PERIODS);
    assert.deepEqual(Object.keys(script.periodTotal), PERIODS.slice(1));
    for (const k of PERIODS) assert.equal(typeof page.periods[k], 'string');
    for (const node of [script.chart.carriedPer, script.chart.signupsPer, script.chart.legendPer, script.overview.highest,
        script.network.busiest, script.network.vsAverage, script.country.highestLast]) assert.deepEqual(Object.keys(node), STEPS);
    assert.deepEqual(Object.keys(script.continents), ['NA', 'EU', 'AS', 'SA', 'AF', 'OC']);
});

test('plural nodes carry English one and other forms with the same placeholders', () => {
    const nodes = [];
    const walk = (value, path) => {
        if (isPluralNode(value)) nodes.push([path, value]);
        else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
    };
    for (const [name, unit] of [['dashboard', page], ['dashboard/method', method], ['dashboard/script', script]]) walk(unit, name);
    assert.ok(nodes.length >= 8);
    for (const [path, node] of nodes) {
        assert.deepEqual(Object.keys(node).sort(), ['one', 'other'], path);
        assert.deepEqual(node.one.match(PLACEHOLDER), node.other.match(PLACEHOLDER), path);
        assert.ok(node.other.includes('{count}'), path);
    }
});

test('the head fits its limits', () => {
    const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
    assert.ok(graphemes(page.meta.title) <= 60);
    assert.ok(page.meta.description.length <= 175);
});
