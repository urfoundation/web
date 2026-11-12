// Capture the flag's pages (ur.xyz/ctf and /ctf/<cc>): their data, the epoch's
// snapshot (src/data/ctf-epoch.json, written by scripts/ctf-import.mjs from
// GET /sn/ctf), and the pure model the pages and their islands render from
// (src/components/pages/ctf/model.js).
//
// The snapshot's invariants are pinned on the committed file: the 249 codes,
// pots never below zero, at most five winners per role (exactly min(5, units)
// after a draw), the draw figures null together without one, and the sums the
// pages show. The import is run on answers of every phase (tests/ctf-fixtures.mjs)
// and must refuse an answer that breaks operator.yml's arithmetic. The model
// is checked for what the owner decided (the chance to win is 5 / entries, or
// 100% at five entries or fewer; no "wins by default" and no chance without a
// draw last epoch) and for what the seo-audit and search need: titles of at
// most 60 graphemes and descriptions of at most 175 characters, all unique,
// and a static render that is the same for the same data. Which country pages
// are indexed (src/components/pages/ctf/indexing.js) is checked on pages in
// miniature: a page that reads like another but for the country's name, with
// no local note, is noindex, both as the build decides it and as the seo-audit
// checks the built pages.
//
// Usage: node --test tests/ctf.test.mjs   (no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { COUNTRY_COUNT, UNINHABITED, apiProblems, normalize, parseNames, prelaunch, presenceFrom, sentenceName, serialize, snapshotProblems } from '../../scripts/ctf-import.mjs';
import {
    HUB_TITLE,
    buildModel,
    byName,
    chanceOf,
    countdown,
    countryDescription,
    countryMessage,
    countryTitle,
    defaultWinRule,
    easyPool,
    findCountry,
    easyWins,
    gridCountries,
    hubDescription,
    isCellTip,
    lastEpochFacts,
    neighbours,
    neutralCountry,
    nextStep,
    pct,
    presenceSentence,
    roleDetail,
    roleLine,
    staticSeed,
    uninhabitedSentence,
    localModel,
    winEstimate,
} from '../src/components/pages/ctf/model.js';
import { countryIndexing, countryIndexingProblems, ownContent } from '../src/components/pages/ctf/indexing.js';
import { CTF_LOCAL_NOTES } from '../src/data/ctf-local-notes.js';
import { ctfCardAlt, ctfOgImage } from '../src/components/pages/ctf/og.js';
import { ctfNames, formats } from '../src/components/pages/ctf/i18n.js';
import { ctaLink, pagePath } from '../src/components/pages/ctf/links.js';
import group from '../src/i18n/pages/ctf/group.js';
import { buildPath, parseRoute } from '../src/router.js';
import { SLOT, SNAPSHOT, amount, drawnAnswer, firstAnswer } from './ctf-fixtures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
const DAY = '2026-12-04';
const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];

// every phase the pages render: the committed snapshot and the import of each kind of answer
const PHASES = {
    committed: SNAPSHOT,
    first: normalize(firstAnswer(), null),
    pending: normalize(firstAnswer({ pending: true }), null),
    drawn: normalize(drawnAnswer(), null),
    undrawn: normalize(drawnAnswer({ drawn: false }), null),
};
const MODELS = Object.fromEntries(Object.entries(PHASES).map(([k, s]) => [k, buildModel(s)]));

test('the committed snapshot keeps the pages\' invariants', () => {
    assert.deepEqual(snapshotProblems(SNAPSHOT), []);
    assert.equal(SNAPSHOT.countries.length, COUNTRY_COUNT);
    const codes = SNAPSHOT.countries.map((c) => c.code);
    assert.equal(new Set(codes).size, 249, 'the codes are distinct');
    assert.deepEqual(codes, [...codes].sort(), 'the codes are in code order');
    assert.ok(!codes.includes('xk'), 'Kosovo is not an ISO 3166-1 code');
    assert.deepEqual(SNAPSHOT.countries.filter((c) => !c.inhabited).map((c) => c.code), UNINHABITED);
    for (const c of SNAPSHOT.countries) {
        for (const role of ['providers', 'extenders']) {
            assert.ok(c[role].pot >= 0, `${c.code} ${role}: pot ${c[role].pot}`);
            assert.ok(c[role].won === null || (c[role].won >= 0 && c[role].won <= 5), `${c.code} ${role}: ${c[role].won} winners`);
        }
    }
    // a sample's sum: the pots the pages add up are the epoch's carry
    const pots = SNAPSHOT.countries.reduce((s, c) => s + c.providers.pot + c.extenders.pot, 0);
    assert.equal(pots, SNAPSHOT.last_epoch ? SNAPSHOT.last_epoch.carried : 0);
    assert.equal(fs.readFileSync(path.join(ROOT, 'react/src/data/ctf-epoch.json'), 'utf8'), serialize(SNAPSHOT), 'the file is as the import writes it');
});

test('before the first CTF epoch the snapshot is the pre-launch state of epoch 8, on the site\'s time basis', () => {
    if (!SNAPSHOT.prelaunch) return;
    assert.equal(SNAPSHOT.first_epoch, 8);
    assert.equal(SNAPSHOT.current_epoch.epoch, 8);
    assert.equal(SNAPSHOT.prelaunch.start_block, 9_600_028);
    // /mainnet's projection: block 9,600,028 at about 18:25 UTC on November 27
    assert.match(SNAPSHOT.prelaunch.starts_at, /^2026-11-27T18:25:\d\dZ$/);
    assert.match(SNAPSHOT.current_epoch.draw_at, /^2026-12-04T18:25:\d\dZ$/);
    assert.equal(SNAPSHOT.current_epoch.end_block, 9_650_427);
    assert.equal(SNAPSHOT.last_epoch, null);
    assert.equal(SNAPSHOT.pending_draw, null);
    assert.equal(SNAPSHOT.totals.not_fully_captured, null);
    assert.ok(SNAPSHOT.countries.every((c) => c.providers.pot === 0 && c.extenders.pot === 0 && c.providers.won === null));
});

test('sentence names follow the API\'s table', () => {
    assert.equal(sentenceName('cd', 'Congo, The Democratic Republic of the'), 'the DR Congo');
    assert.equal(sentenceName('us', 'United States'), 'the United States');
    assert.equal(sentenceName('gs', 'South Georgia and the South Sandwich Islands'), 'South Georgia');
    assert.equal(sentenceName('bo', 'Bolivia'), 'Bolivia');
    assert.equal(sentenceName('fk', 'Falkland Islands (Malvinas)'), 'the Falkland Islands');
    assert.equal(sentenceName('ps', 'Palestine, State of'), 'Palestine');
    const byCode = new Map(SNAPSHOT.countries.map((c) => [c.code, c]));
    assert.equal(byCode.get('cd').sentence_name, 'the DR Congo');
    assert.equal(byCode.get('ru').sentence_name, 'Russia');
});

test('the pre-launch import reads the server\'s country table and the dashboard\'s counts', () => {
    const go = 'var isoCountryNames = map[string]string{\n\t"ad": "Andorra",\n\t"cd": "Congo, The Democratic Republic of the",\n\t"ci": "C\\u00f4te d\'Ivoire",\n}\n';
    const names = parseNames(go);
    assert.deepEqual([...names.keys()], ['ad', 'cd', 'ci']);
    assert.equal(names.get('ci'), 'Côte d\'Ivoire');
    const history = { countries: { '2026-11-09': { AD: 2, CD: 0 }, '2026-11-10': { AD: 1, US: 9 } } };
    const presence = presenceFrom(history, '2026-11-10');
    assert.deepEqual(presence.meta, { source: 'https://ur.xyz/dashboard', day: '2026-11-10', days: 2 });
    assert.deepEqual(presence.byCode.ad, { online: 1, seen_days: 2, last_seen: '2026-11-10', peak: 2 });
    assert.deepEqual(presence.byCode.cd, { online: 0, seen_days: 0, last_seen: null, peak: 0 });
    const s = prelaunch({ names, presence, now: Date.UTC(2026, 10, 11), bounds: { startBlock: 9_600_028, endBlock: 9_650_428, startMs: Date.UTC(2026, 10, 27, 18, 25, 24), endMs: Date.UTC(2026, 11, 4, 18, 25, 24) } });
    assert.equal(s.countries.find((c) => c.code === 'cd').online, 0);
    assert.equal(s.countries.find((c) => c.code === 'ci').seen_days, 0);
    assert.equal(s.prelaunch.starts_at, '2026-11-27T18:25:24Z');
});

test('every phase\'s answer imports to a snapshot that keeps the invariants', () => {
    for (const [phase, snap] of Object.entries(PHASES)) {
        assert.deepEqual(snapshotProblems(snap), [], phase);
    }
    assert.equal(MODELS.drawn.phase, 'drawn');
    assert.equal(MODELS.undrawn.phase, 'undrawn');
    assert.equal(MODELS.first.phase, 'first');
    // the first epoch's draw under way: epoch 9 runs, and the first is still 8
    assert.equal(MODELS.pending.phase, 'drawing');
    assert.equal(MODELS.pending.pending.epoch, 8);
    assert.match(hubDescription(MODELS.pending), /Epoch 8, the first, has ended/);
    assert.ok(MODELS.pending.countries.every((c) => !/Epoch 9 is/.test(countryMessage(MODELS.pending, c))));
    // the API's own figures are checked, then derived again by the page
    const answer = drawnAnswer();
    for (const c of answer.countries) {
        const m = MODELS.drawn.byCode.get(c.code);
        assert.equal(m.p.est, c.providers.win_estimate.rao);
        assert.equal(m.avail, c.available.rao);
        assert.equal(m.p.chance, c.providers.chance_to_win);
    }
});

test('the import refuses an answer that breaks operator.yml\'s arithmetic', () => {
    assert.deepEqual(apiProblems(drawnAnswer()), []);
    assert.deepEqual(apiProblems(drawnAnswer({ drawn: false })), []);
    assert.deepEqual(apiProblems(firstAnswer()), []);
    const broken = [
        ['a country missing', (a) => a.countries.pop()],
        ['codes out of order', (a) => a.countries.reverse()],
        ['a chance that is not 5 / entries', (a) => { a.countries[100].providers.chance_to_win = 0.5; }],
        ['more winners than units', (a) => { const r = a.countries.find((c) => c.providers.units === 0).providers; r.slots = { total: 5, won: 1, open: 4 }; }],
        ['a win estimate off by a rao', (a) => { const r = a.countries[3].extenders; r.win_estimate = amount(r.win_estimate.rao + 1); }],
        ['an alpha string that is not its rao', (a) => { a.countries[5].providers.pot.alpha = '9.000000000'; }],
        ['flags held miscounted', (a) => { a.totals.flags_held += 1; }],
        ['not fully captured miscounted', (a) => { a.totals.not_fully_captured.providers -= 1; }],
        ['carried that is not the pots', (a) => { a.last_epoch.amounts.carried = amount(a.last_epoch.amounts.carried.rao + 5); }],
        ['a slot that is not fresh / 2490', (a) => { a.last_epoch.amounts.slot = amount(SLOT + 1); }],
        ['an uninhabited territory marked inhabited', (a) => { a.countries.find((c) => c.code === 'aq').inhabited = true; }],
    ];
    for (const [what, mutate] of broken) {
        const answer = drawnAnswer();
        mutate(answer);
        assert.ok(apiProblems(answer).length > 0, `the import accepted ${what}`);
        assert.throws(() => normalize(answer, null), /not a valid GET \/sn\/ctf/, what);
    }
    const undrawn = drawnAnswer({ drawn: false });
    undrawn.countries[7].providers.units = 3;
    assert.ok(apiProblems(undrawn).length > 0, 'the import accepted draw figures without a draw');
});

test('the chance to win is the draw\'s exact odds: 100% at five entries or fewer, else 5 / entries', () => {
    for (let units = 0; units <= 4; units += 1) assert.equal(chanceOf(units), 1);
    assert.equal(pct(chanceOf(5)), '83%'); // six entries
    assert.equal(chanceOf(9), 0.5); // ten entries
    assert.equal(chanceOf(99), 0.05); // a hundred entries
    assert.equal(pct(chanceOf(99)), '5.0%');
    assert.equal(pct(chanceOf(30630)), '0.016%');
    assert.equal(winEstimate(SLOT, 230_523_168), SLOT + 46_104_633);
});

test('without a draw last epoch the pages claim no default win and show no chance', () => {
    for (const phase of ['committed', 'first', 'pending', 'undrawn']) {
        const m = MODELS[phase];
        for (const c of m.countries) {
            const said = [countryMessage(m, c), roleLine(m, c, 'p'), roleLine(m, c, 'x'), countryDescription(m, c, DAY), lastEpochFacts(m, c) || '', defaultWinRule(m)].join(' ');
            assert.ok(!/wins by default|win by default|chance to win|\d%/.test(said), `${phase} ${c.code}: ${said}`);
            assert.equal(c.p.chance, null);
            assert.equal(c.p.open, false);
        }
        assert.deepEqual(easyPool(m), [], `${phase}: Easy wins draws only after a draw`);
        assert.equal(neutralCountry(m), null);
    }
    const m = MODELS.undrawn;
    assert.ok(/no draw last epoch/.test(roleDetail(m, m.countries[0], 'p')));
});

test('a later draw pending after a drawn epoch is refused: the pages would be an epoch off', () => {
    const answer = drawnAnswer();
    answer.current_epoch = { ...answer.current_epoch, epoch: 10 };
    answer.pending_draw = { epoch: 9, census_hash: null, census_block: null, round: null };
    assert.deepEqual(apiProblems(answer), [], 'the answer itself is valid');
    assert.match(snapshotProblems(normalize(answer, null)).join(' '), /epoch 9's draw is pending after a drawn epoch/);
});

test('a country page says what its dashboard counts and its last epoch add, and a territory without people says so', () => {
    const m = MODELS.committed;
    const byCode = m.byCode;
    const lastSeenOnly = m.countries.find((c) => c.online === 0 && c.seenDays > 0);
    assert.match(presenceSentence(m, lastSeenOnly), new RegExp(`last counted any there at the end of [A-Z][a-z]+ \\d+, and on ${lastSeenOnly.seenDays} of the last \\d+ days, (one|\\d+) at most\\.$`));
    const online = m.countries.find((c) => c.online > 1);
    assert.match(presenceSentence(m, online), /providers online in .* at the end of [A-Z][a-z]+ \d+, and providers there on \d+ of the last \d+ days, [\d,]+ at most\.$/);
    assert.match(uninhabitedSentence(byCode.get('aq')), /^Antarctica has no permanent population/);
    assert.equal(uninhabitedSentence(byCode.get('ke')), null);
    assert.equal(lastEpochFacts(m, byCode.get('ke')), null, 'nothing before a root');
    const d = MODELS.drawn;
    const winners = d.countries.find((c) => c.won > 0);
    assert.match(lastEpochFacts(d, winners), new RegExp(`winners? took ${winners.awarded / 1e9 >= 0 ? '' : ''}`));
    assert.match(lastEpochFacts(MODELS.undrawn, MODELS.undrawn.countries.find((c) => c.openEpochs > 0)), /no winner for \d+ epochs?/);
});

test('the description measures a day, not the build\'s lastmod token, and a flag held enters the draw', () => {
    const TOKEN = '__UR_PAGE_LASTMOD__';
    for (const m of [MODELS.drawn, MODELS.undrawn, MODELS.committed]) {
        for (const c of m.countries) {
            assert.equal(countryDescription(m, c, TOKEN).replace(TOKEN, DAY), countryDescription(m, c, DAY), c.code);
        }
    }
    const d = MODELS.drawn;
    const held = d.countries.find((c) => c.flagHeld);
    if (held) assert.ok(!/to win\./.test(countryDescription(d, held, DAY)), 'a held flag promises no win');
    const open = d.countries.find((c) => c.p.open && countryDescription(d, c, DAY).includes('Stay online'));
    assert.match(countryDescription(d, open, DAY), /Stay online for half the epoch to win\./);
});

test('a grid cell\'s tips are its own: an Easy wins card\'s is not', () => {
    for (const kind of ['grid', 'p', 'x', 'pc', 'xc']) assert.equal(isCellTip(`${kind}:ke`, 'ke'), true, kind);
    assert.equal(isCellTip('feat:ke', 'ke'), false);
    assert.equal(isCellTip('p:ke', 'ng'), false);
    assert.equal(isCellTip(null, 'ke'), false);
});

test('the search and the picker fold accents', () => {
    const m = MODELS.committed;
    for (const [typed, code] of [['cote d\'ivoire', 'ci'], ['turkiye', 'tr'], ['reunion', 're'], ['curacao', 'cw'], ['Aland Islands', 'ax'], ['the dr congo', null], ['dr congo', 'cd'], ['KE', 'ke'], ['niger', 'ne']]) {
        assert.equal(findCountry(m, typed)?.code ?? null, code, typed);
    }
    assert.ok(gridCountries(m, { q: 'cote' }).some((c) => c.code === 'ci'));
    assert.ok(gridCountries(m, { q: 'türk' }).some((c) => c.code === 'tr'));
});

test('local notes, when written, are dated and reviewed for one of the 249', () => {
    const codes = new Set(SNAPSHOT.countries.map((c) => c.code));
    for (const [code, note] of Object.entries(CTF_LOCAL_NOTES)) {
        assert.ok(codes.has(code), code);
        assert.match(note.reviewed, /^\d{4}-\d{2}-\d{2}$/, code);
        assert.ok(typeof note.text === 'string' && note.text.length > 40, code);
        // its translations, under the site languages' codes
        for (const [key, value] of Object.entries(note)) {
            if (key === 'reviewed' || key === 'text') continue;
            assert.ok(LANGS.includes(key) && key !== 'en' && typeof value === 'string' && value.length > 40, `${code}.${key}`);
        }
    }
});

test('after a draw, an open role wins by default and a fully captured one shows its chance', () => {
    const m = MODELS.drawn;
    const open = m.countries.find((c) => c.p.open && c.x.open);
    assert.match(countryMessage(m, open), /wins by default/);
    assert.match(roleLine(m, open, 'p'), /not fully captured, a new provider wins by default/);
    const held = m.countries.find((c) => c.p.held);
    assert.match(roleLine(m, held, 'p'), /chance to win/);
    assert.match(roleDetail(m, held, 'p'), new RegExp(pct(held.p.chance).replace('.', '\\.')));
    const step = nextStep(m, open);
    assert.match(step.take, /^about \d+\.\d\d α/);
    assert.equal(m.totals.openP, m.countries.filter((c) => c.p.open).length);
    assert.equal(neutralCountry(m).inhabited, true);
});

test('titles fit 60 graphemes and descriptions 175 characters, and none repeats, in every phase', () => {
    assert.ok(graphemes(HUB_TITLE) <= 60, HUB_TITLE);
    for (const [phase, m] of Object.entries(MODELS)) {
        const titles = new Set([HUB_TITLE]);
        const descriptions = new Set([hubDescription(m)]);
        assert.ok(hubDescription(m).length <= 175, `${phase}: ${hubDescription(m)}`);
        for (const c of m.countries) {
            const title = countryTitle(c);
            const description = countryDescription(m, c, DAY);
            assert.ok(graphemes(title) <= 60, `${phase} ${c.code}: ${title}`);
            assert.ok(description.length <= 175, `${phase} ${c.code}: ${description.length} ${description}`);
            assert.ok(!titles.has(title), `${phase}: two pages titled ${title}`);
            assert.ok(!descriptions.has(description), `${phase}: two pages described ${description}`);
            titles.add(title);
            descriptions.add(description);
        }
    }
    // the templates of SEO.md §2.2, longest first
    const byCode = MODELS.committed.byCode;
    assert.equal(countryTitle(byCode.get('ke')), 'Earn crypto in Kenya: open slots and pots | UR');
    assert.equal(countryTitle(byCode.get('vc')), 'Earn crypto in Saint Vincent and the Grenadines | UR');
    assert.equal(countryTitle(byCode.get('cd')), 'Earn crypto in the DR Congo: open slots and pots | UR');
});

test('Easy wins: up to eight big pots with an open slot, weighted, never a territory without people, the same for a seed', () => {
    const m = MODELS.drawn;
    const seed = staticSeed(m);
    const picks = easyWins(m, seed);
    assert.ok(picks.length > 0 && picks.length <= 8);
    assert.deepEqual(easyWins(m, seed).map((c) => c.code), picks.map((c) => c.code), 'the same seed draws the same');
    for (const c of picks) {
        assert.ok(c.inhabited && c.big && (c.p.open || c.x.open), c.code);
        assert.ok(c.avail >= m.threshold);
    }
    assert.ok(!easyWins(m, seed, picks[0].code).some((c) => c.code === picks[0].code), 'a country page leaves itself out');
    assert.equal(staticSeed(m), staticSeed(buildModel(PHASES.drawn)), 'the static seed is the data\'s');
    assert.notEqual(staticSeed(m, 'ke'), staticSeed(m, 'ng'), 'each country page draws its own');
    // shown biggest pot first
    for (let i = 1; i < picks.length; i += 1) assert.ok(Math.round(picks[i - 1].pots / 1e8) >= Math.round(picks[i].pots / 1e8));
    // weighted: over many seeds, a bigger pot is drawn more often
    const counts = new Map();
    for (let s = 0; s < 400; s += 1) for (const c of easyWins(m, s * 2654435761)) counts.set(c.code, (counts.get(c.code) || 0) + 1);
    const pool = easyPool(m).sort((a, b) => b.avail - a.avail);
    if (pool.length > 16 && pool[0].avail > 2 * pool.at(-1).avail) {
        assert.ok((counts.get(pool[0].code) || 0) > (counts.get(pool.at(-1).code) || 0));
    }
});

test('the grid sorts, filters and finds', () => {
    const m = MODELS.drawn;
    assert.equal(gridCountries(m).length, 249);
    const az = gridCountries(m, { sort: 'az' }).map((c) => c.name);
    assert.equal(az[0], 'Afghanistan');
    assert.equal(az[1], 'Åland Islands', 'accents fold in A–Z, the same in every engine');
    assert.deepEqual(gridCountries(m, { focus: 'np' }).map((c) => c.code).sort(), m.countries.filter((c) => c.p.open).map((c) => c.code).sort());
    assert.ok(gridCountries(m, { focus: 'held' }).every((c) => c.flagHeld));
    assert.ok(gridCountries(m, { q: 'KE' }).some((c) => c.code === 'ke'), 'a code finds its country');
    assert.deepEqual(gridCountries(m, { q: 'kenya' }).map((c) => c.code), ['ke']);
    assert.deepEqual(gridCountries(m, { q: 'zz' }), []);
    assert.ok(gridCountries(m, { q: 'congo' }).some((c) => c.code === 'cd'));
    const pot = gridCountries(m, { sort: 'pot' });
    for (let i = 1; i < pot.length; i += 1) assert.ok(Math.round(pot[i - 1].pots / 1e8) >= Math.round(pot[i].pots / 1e8));
    const easy = gridCountries(m, { sort: 'easy' });
    const firstPlain = easy.findIndex((c) => !c.big);
    assert.ok(easy.slice(firstPlain).every((c) => !c.big), 'big pots sort first, the near misses first of all');
    const fewest = gridCountries(MODELS.committed, { sort: 'fewest' });
    assert.ok(fewest.at(-1).inhabited === false, 'territories without people sort last among the fewest');
    assert.ok([...MODELS.committed.az].sort(byName).every((c, i) => c === MODELS.committed.az[i]));
    const { prev, next } = neighbours(MODELS.committed, 'ad');
    assert.equal(prev.code, 'as'); // American Samoa, Andorra, Angola
    assert.equal(next.code, 'ao');
});

test('the live bar\'s clock', () => {
    assert.equal(countdown(16 * 86_400_000 + 3 * 3_600_000 + 120_000), '16d 03h');
    assert.equal(countdown(4 * 3_600_000 + 7 * 60_000), '4h 07m');
    assert.equal(countdown(30_000), '1m');
});

test('the routes: /ctf and a page per country', () => {
    assert.deepEqual(parseRoute('/ctf'), { name: 'ctf', slug: null });
    assert.deepEqual(parseRoute('/ctf/ke'), { name: 'ctf', slug: 'ke' });
    assert.deepEqual(parseRoute('/de/ctf/ke'), { name: 'ctf', slug: 'ke' });
    // the translations are routes of their own once the group is localized (react/src/i18n/pages/ctf/group.js)
    assert.equal(buildPath({ name: 'ctf', slug: 'ke' }, 'de'), group.localized ? '/de/ctf/ke' : '/ctf/ke');
    assert.equal(buildPath({ name: 'ctf', slug: null }, 'en'), '/ctf');
    assert.deepEqual(fs.readdirSync(path.join(ROOT, 'astro/src/pages/ctf')), ['[cc].astro']);
    assert.deepEqual(fs.readdirSync(path.join(ROOT, 'astro/src/pages/[lang]/ctf')), ['[cc].astro']);
    assert.ok(fs.existsSync(path.join(ROOT, 'astro/src/pages/[lang]/ctf.astro')));
});

test('every country has its flag, with flag-icons\' licence, and the snapshot its social card', () => {
    for (const dir of ['react/public/ctf/flags', 'astro/public/ctf/flags']) {
        const files = new Set(fs.readdirSync(path.join(ROOT, dir)));
        for (const c of SNAPSHOT.countries) assert.ok(files.has(`${c.code}.svg`), `${dir}/${c.code}.svg`);
        assert.equal(files.size, 250, `${dir}: 249 flags and the licence`);
        assert.match(fs.readFileSync(path.join(ROOT, dir, 'LICENSE.txt'), 'utf8'), /flag-icons 7\.6\.0[\s\S]*The MIT License/);
    }
    // a card per language, the English one named as it always was
    const cards = LANGS.map((lang) => path.basename(ctfOgImage(localModel(MODELS.committed, lang))));
    assert.equal(new Set(cards).size, LANGS.length, 'each language has a card of its own');
    for (const dir of ['react/public', 'astro/public']) {
        assert.deepEqual(fs.readdirSync(path.join(ROOT, dir, 'ctf/og')).sort(), [...cards].sort(), `${dir}/ctf/og: run node scripts/generate-og.mjs --ctf`);
    }
    for (const lang of LANGS) {
        const alt = ctfCardAlt(localModel(MODELS.committed, lang));
        assert.ok(alt.includes(String(MODELS.committed.firstEpoch)) && !/\{[A-Za-z]/.test(alt), `${lang}: ${alt}`);
    }
});


test('the pages in another language: its names, its A–Z, its figures, the same data', () => {
    const m = MODELS.drawn;
    for (const lang of LANGS.slice(1)) {
        const lm = localModel(m, lang);
        const names = ctfNames(lang);
        assert.equal(localModel(m, lang), lm, 'one model per language');
        assert.equal(lm.lang, lang);
        assert.deepEqual(lm.az.map((c) => c.code), names.order.split(' '), `${lang}: the A–Z is the names file's`);
        for (const c of lm.countries) {
            const en = m.byCode.get(c.code);
            assert.equal(c.name, names.name[c.code]);
            assert.equal(c.in, names.in[c.code]);
            // the figures are the English model's
            assert.deepEqual([c.p, c.x, c.pots, c.avail, c.online, c.big, c.hot, c.flagHeld], [en.p, en.x, en.pots, en.avail, en.online, en.big, en.hot, en.flagHeld], `${lang} ${c.code}`);
        }
        // the search and the picker know the language's names and the English ones
        const ke = lm.byCode.get('ke');
        assert.deepEqual(gridCountries(lm, { q: ke.name }).map((c) => c.code).includes('ke'), true, `${lang}: ${ke.name}`);
        assert.equal(findCountry(lm, ke.name)?.code, 'ke', `${lang}: ${ke.name}`);
        assert.equal(findCountry(lm, 'Kenya')?.code, 'ke', `${lang}: the English name`);
        assert.equal(findCountry(lm, 'KE')?.code, 'ke');
        // the same countries in every grid, in the language's A–Z among pots within 0.1 α
        const buckets = (rows) => rows.map((c) => Math.round(c.pots / 1e8));
        assert.deepEqual(buckets(gridCountries(lm, { sort: 'pot' })), buckets(gridCountries(m, { sort: 'pot' })));
        assert.deepEqual(easyWins(lm, 7).map((c) => c.code).sort(), easyWins(m, 7).map((c) => c.code).sort());
    }
    assert.equal(localModel(m, 'en'), m, 'English is the model itself');
    // Arabic's vowel marks and hamza seats fold away in the search
    const ar = localModel(m, 'ar');
    assert.equal(findCountry(ar, 'عمان')?.code, 'om', 'عُمان without its damma');
    assert.equal(findCountry(ar, 'المانيا')?.code, 'de', 'ألمانيا without its hamza');
});

test('figures and days in each language\'s format, rounded as in English', () => {
    const cases = {
        en: ['12.97', '1,234', '2.6%', '83%', 'Nov 27, 18:25 UTC', 'November 27, 2026', '16d 03h'],
        ru: ['12,97', '1\u00a0234', '2,6\u00a0%', '83\u00a0%', '27 нояб., 18:25 UTC', '27 ноября 2026 года', '16 д 03 ч'],
        de: ['12,97', '1.234', '2,6\u00a0%', '83\u00a0%', '27. Nov., 18:25 UTC', '27. November 2026', '16 T. 03 Std.'],
        es: ['12,97', '1234', '2,6\u00a0%', '83\u00a0%', '27 nov, 18:25 UTC', '27 de noviembre de 2026', '16 d 03 h'],
        zh: ['12.97', '1,234', '2.6%', '83%', '11月27日 18:25 UTC', '2026年11月27日', '16天03小时'],
    };
    for (const [lang, want] of Object.entries(cases)) {
        const f = formats(lang);
        const got = [f.alpha(12_970_000_000), f.int(1234), f.pct(chanceOf(189)), f.pct(chanceOf(5)), f.utcTime('2026-11-27T18:25:24Z'), f.utcDay('2026-11-27T18:25:24Z'), f.countdown(16 * 86_400_000 + 3 * 3_600_000 + 120_000)];
        assert.deepEqual(got, want, lang);
    }
    // Arabic keeps Western digits
    const ar = formats('ar');
    assert.match(ar.alpha(12_970_000_000), /^12\.97$/);
    assert.match(ar.pct(chanceOf(5)), /^83\u200e?%\u200e?$/);
    // the chance rounds the same digits in every language
    for (const units of [5, 9, 99, 188, 30630]) {
        const digits = (s) => s.replace(/[^\d]/g, '');
        const en = digits(formats('en').pct(chanceOf(units)));
        for (const lang of ['ru', 'ar', 'zh', 'de', 'es']) assert.equal(digits(formats(lang).pct(chanceOf(units))), en, `${lang} ${units}`);
    }
});

test('a page links to the pages in its language where they are translated', () => {
    assert.equal(pagePath('en', '/ctf/ke'), '/ctf/ke');
    assert.equal(pagePath('ru', '/ctf/ke'), group.localized ? '/ru/ctf/ke' : '/ctf/ke');
    assert.equal(pagePath('ar', '/ctf'), group.localized ? '/ar/ctf' : '/ctf');
    assert.equal(ctaLink('de', 'start'), 'https://ur.io');
    assert.match(ctaLink('de', 'x'), /^(\/de)?\/docs\/miner\/extender$/);
    assert.equal(ctaLink('en', 'x'), '/docs/miner/extender');
});

// A country page's <main> in miniature, as CtfCountry.jsx renders one: its names in the trail, the heading, the
// card and the questions, escaped as React escapes them; what it says of its own country (the territory and
// dashboard sentences, and `own`); a local note if it has one; the day it last changed; and its other big pots
// and neighbours, which are about other countries, with a section inside a section. React's marker between
// two texts is in it, as in an island's HTML (renderToString's), unless `markers` is false (renderToStaticMarkup's).
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
function countryMain(m, code, { own = '', note = null, day = DAY, states = true, markers = true } = {}) {
    const c = m.byCode.get(code);
    const { prev, next } = neighbours(m, code);
    const said = [states && uninhabitedSentence(c), states && presenceSentence(m, c), own].filter(Boolean).join(' ');
    return [
        '<div class="ctf-page"><div class="ctf-shell"><header class="ctf-hdr">',
        `<nav class="ctf-crumbs" aria-label="Breadcrumb"><a href="/ctf">Capture the flag</a><span aria-hidden="true">›</span><span aria-current="page">${esc(c.short)}</span></nav>`,
        `<h1>Earn crypto in ${esc(c.the)} with your internet connection</h1>`,
        `<p class="ctf-intro">${esc(c.The)} has five provider slots and five extender slots each epoch${markers ? '<!-- -->' : ''}. ${esc(said)}</p></header>`,
        `<section class="ctf-mine"><h2 id="ctf-mine-h" class="ctf-me-name">${esc(c.name)}</h2><a class="ctf-btn ctf-btn-p" href="https://ur.io">Start mining in ${esc(c.the)}</a></section>`,
        `<section class="ctf-sec ctf-feat-sec" data-ctf-elsewhere=""><h2>Other big pots this epoch</h2><div class="ctf-feat"><article><section><h3><a href="/ctf/${next.code}">${esc(next.name)}</a></h3></section><b>${esc(next.name)} in pots</b></article></div></section>`,
        `<nav class="ctf-sec ctf-around" aria-label="More countries" data-ctf-elsewhere=""><a href="/ctf/${prev.code}" rel="prev">${esc(prev.name)}</a><a href="/ctf">All 249 countries</a><a href="/ctf/${next.code}" rel="next">${esc(next.name)}</a></nav>`,
        `<section id="faq"><details open=""><summary>How do I get paid?</summary><p>Local law in ${esc(c.the)} applies.`,
        note ? `<br/><br/>Local note for ${esc(c.the)}, reviewed <time dateTime="${note.reviewed}">${note.reviewed}</time>: ${esc(note.text)}` : '',
        `</p></details></section><footer class="ctf-foot"><p>Updated <time dateTime="${day}">${day}</time>.</p></footer></div></div>`,
    ].join('');
}

test('a country page\'s own content leaves out other countries and the days it states, and masks its names and code', () => {
    const m = MODELS.committed;
    const own = (code, options) => ownContent(countryMain(m, code, { states: false, ...options }), m.byCode.get(code));
    const ke = own('ke');
    // its neighbours, its other big pots and the day it last changed are no content of its own
    assert.equal(own('li', { day: '2026-12-04' }), ke, 'Liechtenstein\'s page reads like Kenya\'s but for the name');
    assert.equal(own('ke', { markers: false }), ke, 'React\'s markers between texts are nothing, so the build\'s render and the built page read alike');
    for (const elsewhere of [...Object.values(neighbours(m, 'ke')).map((c) => c.name), 'Other big pots', 'All 249 countries', DAY]) {
        assert.ok(!ke.includes(elsewhere), elsewhere);
    }
    assert.match(ke, /^Capture the flag › \u0000 Earn crypto in \u0000 with your internet connection \u0000 has five provider slots and five extender slots each epoch\. \u0000 Start mining in \u0000 How do I get paid\? Local law in \u0000 applies\. Updated \.$/);
    // every form of a name, the longest first, and names escaped as React writes them
    assert.equal(own('cd'), ke, 'Congo, The Democratic Republic of the; the DR Congo; The DR Congo; DR Congo');
    assert.equal(own('ci'), ke, 'Côte d\'Ivoire');
    assert.equal(own('us'), ke, 'the United States');
    // the code too, as a word in capitals and in the paths of the page and its JSON, and no other word
    assert.equal(own('ke', { own: 'KE: /ctf/ke and /sn/ctf/country/ke' }), own('li', { own: 'LI: /ctf/li and /sn/ctf/country/li' }));
    assert.equal(own('sn', { own: 'Keep the JSON at /sn/ctf; ke.' }), own('ke', { own: 'Keep the JSON at /sn/ctf; ke.' }));
    // what a page says of its own country sets it apart
    assert.notEqual(own('ke', { own: 'The dashboard counted 1 provider online.' }), ke);
    assert.notEqual(own('ke', { own: 'The dashboard counted 1 provider online.' }), own('li', { own: 'The dashboard counted 2 providers online.' }));
});

test('the build indexes a country page unless it reads like another but for the name and has no local note', () => {
    const m = MODELS.first;
    const own = { us: 'Tens of thousands of providers online.', de: 'Hundreds of providers online.', fr: 'Hundreds of providers online.' };
    const decided = countryIndexing(m, (code) => countryMain(m, code, { own: own[code] }), {});
    assert.deepEqual([...decided.keys()], m.countries.map((c) => c.code), 'every country, in the model\'s order');
    assert.deepEqual(decided.get('us'), { noindex: false, alike: [] }, 'a page of its own');
    assert.deepEqual(decided.get('de'), { noindex: true, alike: ['fr'] }, 'two pages with the same figures');
    assert.equal(decided.get('ke').noindex, true);
    assert.equal(decided.get('ke').alike.length, 249 - 7 - 3 - 1, 'the inhabited countries with nothing of their own');
    assert.deepEqual(decided.get('aq').alike, ['bv', 'gs', 'hm', 'io', 'tf', 'um'], 'the territories without people read alike');
    // a local note, shown on its page, sets it apart; and a page with a note is never noindex
    const note = { reviewed: '2026-12-01', text: 'Winnings can be cashed out to M-Pesa through an exchange that lists alpha.' };
    const noted = countryIndexing(m, (code) => countryMain(m, code, { own: own[code], note: code === 'ke' ? note : null }), { ke: note });
    assert.deepEqual(noted.get('ke'), { noindex: false, alike: [] });
    assert.equal(noted.get('li').noindex, true);
    const unshown = countryIndexing(m, (code) => countryMain(m, code, { own: own[code] }), { ke: note });
    assert.equal(unshown.get('ke').noindex, false, 'indexable with a note even where the note does not set it apart');
    assert.ok(unshown.get('ke').alike.includes('li'));
    // nothing of its own anywhere: every page reads like another
    assert.ok([...countryIndexing(m, (code) => countryMain(m, code), {}).values()].every((d) => d.noindex));
});

test('the seo-audit refuses country pages that break the rule, by the build\'s own reading', () => {
    const m = MODELS.first;
    const own = { us: 'Tens of thousands of providers online.', de: 'Hundreds of providers online.', fr: 'Hundreds of providers online.' };
    const render = (code, options) => countryMain(m, code, { own: own[code], ...options });
    const decided = countryIndexing(m, render, {});
    const built = (changed = {}) => m.countries.map((c) => ({ code: c.code, main: render(c.code), noindex: decided.get(c.code).noindex, ...changed[c.code] }));
    // the pages as the build decides them pass, and the groups that read alike are listed
    const { problems, groups } = countryIndexingProblems(m, built(), {});
    assert.deepEqual(problems, []);
    assert.deepEqual(groups.map((g) => g.length).sort((a, b) => a - b), [2, 7, 249 - 7 - 3]);
    const refused = (changed, notes = {}) => countryIndexingProblems(m, built(changed), notes).problems;
    // a page that reads like another indexed: refused, and two such pages are indexable pages that differ by the name alone
    const two = refused({ ke: { noindex: false }, li: { noindex: false } });
    assert.match(two[0], /^\/ctf\/ke: reads like \/ctf\/ad, \/ctf\/ae, \/ctf\/af and 235 more but for the country's name and has no local note, so it must be noindex$/);
    assert.match(two[1], /^\/ctf\/li: reads like /);
    assert.equal(two[2], '/ctf/ke, /ctf/li: indexable, though they differ by the country\'s name alone');
    assert.equal(two.length, 3);
    // a page of its own, or one with a local note, made noindex
    assert.deepEqual(refused({ us: { noindex: true } }), ['/ctf/us: noindex, though it reads like no other country page']);
    const note = { reviewed: '2026-12-01', text: 'Winnings can be cashed out to M-Pesa through an exchange that lists alpha.' };
    assert.deepEqual(refused({ ke: { main: render('ke', { note }), noindex: true } }, { ke: note }), ['/ctf/ke: noindex, though it has a local note']);
    // local notes that differ by the name alone: indexable by the rule, but still two pages that differ by the name alone
    const same = (code) => ({ reviewed: '2026-12-01', text: `Winnings can be cashed out in ${m.byCode.get(code).the} through an exchange that lists alpha.` });
    const notes = { ke: same('ke'), li: same('li') };
    assert.deepEqual(refused({ ke: { main: render('ke', { note: notes.ke }), noindex: false }, li: { main: render('li', { note: notes.li }), noindex: false } }, notes), ['/ctf/ke, /ctf/li: indexable, though they differ by the country\'s name alone']);
    // a page that leaves out its own figures: a territory without people that does not say so
    const dropped = refused({ aq: { main: render('aq', { states: false }) } });
    assert.equal(dropped.length, 1);
    assert.match(dropped[0], /^\/ctf\/ad, \/ctf\/ae, \/ctf\/af and \d+ more: read the same but for the country's name, though their data differs \(a page leaves out its own figures\)$/);
    // and a page for no country of the snapshot
    assert.deepEqual(countryIndexingProblems(m, [...built(), { code: 'xk', main: '', noindex: false }], {}).problems, ['/ctf/xk: no such country in the snapshot']);
});
