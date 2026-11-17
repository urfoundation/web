// The research methodology (src/data/research-methodology.js, /research/methodology)
// and its card on /research. Run with `node --test tests/research-methodology.test.mjs`.
//
// The page restates figures that live elsewhere: the lab's are the August–October
// report's headline figures and counts, the competition's are the competition
// card's. These checks keep the copies from drifting.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { METHODOLOGY as M } from '../src/data/research-methodology.js';
import { APEX_COMPETITION } from '../src/components/research-competition.js';
import { RESEARCH_REPORT_SLUGS, buildPath, isTranslatedRoute, parseRoute } from '../src/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/research-report-2026-q3.json'), 'utf8'));
const loop = (key) => M.sections.loops.find((l) => l.key === key);

test('the methodology is a route of every site language under the research section', () => {
    assert.deepEqual(parseRoute('/research/methodology'), { name: 'research-methodology', slug: null });
    assert.deepEqual(parseRoute('/de/research/methodology'), { name: 'research-methodology', slug: null });
    assert.equal(buildPath({ name: 'research-methodology' }, 'en'), M.path);
    assert.equal(buildPath({ name: 'research-methodology' }, 'de'), `/de${M.path}`);
    assert.equal(isTranslatedRoute({ name: 'research-methodology' }), true);
    assert.equal(M.path, '/research/methodology');
});

test('its links to the report are the report route', () => {
    const reportPath = `/research/${RESEARCH_REPORT_SLUGS[0]}`;
    assert.equal(M.reportHref, reportPath);
    assert.ok(loop('lab').links.some((l) => l.href === reportPath));
});

test('the lab figures are the report’s', () => {
    const kpis = report.kpis.map((k) => k.v);
    const facts = loop('lab').facts;
    assert.equal(facts[0].v, String(report.entries.length), 'the count of measured changes');
    for (const f of facts.slice(1)) assert.ok(kpis.includes(f.v), `${f.v} is not one of the report's headline figures (${kpis.join(', ')})`);
    const kinds = report.entries.reduce((n, e) => ({ ...n, [e.kind]: (n[e.kind] || 0) + 1 }), {});
    assert.match(M.publication.body, new RegExp(`all ${report.entries.length} measured changes`));
    assert.match(M.publication.body, new RegExp(`${kinds.mixed} mixed and ${kinds.rejected} rejected`));
});

test('the competition figures are the competition card’s', () => {
    const c = loop('competition');
    assert.equal(c.facts[0].v, String(APEX_COMPETITION.rounds));
    assert.ok(c.links.some((l) => l.href === APEX_COMPETITION.url));
});

test('evidence links only to public sources, and headline figures stay multiples or counts', () => {
    for (const l of M.sections.loops.flatMap((x) => x.links).filter((x) => x.external)) {
        assert.match(l.href, /^https:\/\/(github\.com\/urnetwork\/(connect|server)\/|apex\.macrocosmos\.ai\/|ur\.io\/)/, l.href);
    }
    for (const f of loop('lab').facts) assert.doesNotMatch(f.v, /[MGK]bps/i, `${f.v} is an absolute rate`);
});

test('the page’s description fits the SEO audit, and every dictionary names the three loops', async () => {
    assert.ok(M.description.length <= 175, `${M.description.length} characters`);
    for (const lang of ['en', 'de', 'es', 'ru', 'zh', 'ar']) {
        const { default: d } = await import(`../src/i18n/${lang}.js`);
        const m = d.research.methodology;
        assert.equal(m.loops.length, 3, lang);
        for (const k of ['tag', 'topic', 'title', 'body', 'cta']) assert.ok(m[k], `${lang}: research.methodology.${k}`);
    }
});
