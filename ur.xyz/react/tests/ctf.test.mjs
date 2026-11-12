// Capture the flag's pages (ur.xyz/ctf and /ctf/<cc>): their data, the epoch's
// snapshot (src/data/ctf-epoch.json, written by scripts/ctf-import.mjs: every
// network operator's GET /sn/ctf of the operator list, combined), and the
// pure model the pages and their islands render from
// (src/components/pages/ctf/model.js).
//
// The operators: the import reads the published list, keeps each operator's
// snapshot and adds them up; with one operator the aggregate is that
// operator's figures, with two the sums and each operator's own draws, and an
// operator it cannot read, or one at another epoch, is left out with the
// reason, while none read writes nothing.
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

import { COUNTRY_COUNT, OPERATOR_DIR, OPERATORS_FILE, UNINHABITED, aggregate, apiProblems, normalize, parseNames, parseOperatorList, prelaunch, presenceFrom, sentenceName, serialize, snapshotProblems } from '../../scripts/ctf-import.mjs';
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
    opsLine,
    opsList,
    slotFigure,
    winEstimate,
} from '../src/components/pages/ctf/model.js';
import { PLACEHOLDER_CODE, countryIndexing, countryIndexingProblems, ownContent, placeholderModel } from '../src/components/pages/ctf/indexing.js';
import { CTF_LOCAL_NOTES } from '../src/data/ctf-local-notes.js';
import { ctfCardAlt, ctfOgImage } from '../src/components/pages/ctf/og.js';
import { ctfNames, formats } from '../src/components/pages/ctf/i18n.js';
import { ctaLink, pagePath } from '../src/components/pages/ctf/links.js';
import group from '../src/i18n/pages/ctf/group.js';
import { buildPath, parseRoute } from '../src/router.js';
import { OP, OP2, SLOT, SLOT2, SNAPSHOT, amount, combined, drawnAnswer, firstAnswer } from './ctf-fixtures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
const DAY = '2026-12-04';
const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];

// every phase the pages render: the committed snapshot and the import of each kind of answer
const PHASES = {
    committed: SNAPSHOT,
    first: combined(firstAnswer()),
    pending: combined(firstAnswer({ pending: true })),
    drawn: combined(drawnAnswer()),
    undrawn: combined(drawnAnswer({ drawn: false })),
};
const MODELS = Object.fromEntries(Object.entries(PHASES).map(([k, s]) => [k, buildModel(s)]));
// and with two operators, the second with its own slot and draws
const SECOND = { no: 2, slot: SLOT2, vary: 7 };
const TWO = {
    first: combined(firstAnswer(), firstAnswer({ no: 2 })),
    drawn: combined(drawnAnswer(), drawnAnswer(SECOND)),
    undrawn: combined(drawnAnswer({ drawn: false }), drawnAnswer({ ...SECOND, drawn: false })),
    mixed: combined(drawnAnswer(), drawnAnswer({ ...SECOND, drawn: false })),
};
const TWO_MODELS = Object.fromEntries(Object.entries(TWO).map(([k, s]) => [k, buildModel(s)]));

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
    const s = prelaunch({ names, presence, now: Date.UTC(2026, 10, 11), bounds: { startBlock: 9_600_028, endBlock: 9_650_428, startMs: Date.UTC(2026, 10, 27, 18, 25, 24), endMs: Date.UTC(2026, 11, 4, 18, 25, 24) }, operators: [OP, OP2] });
    assert.equal(s.countries.find((c) => c.code === 'cd').online, 0);
    assert.equal(s.countries.find((c) => c.code === 'ci').seen_days, 0);
    assert.equal(s.prelaunch.starts_at, '2026-11-27T18:25:24Z');
    // every listed operator takes part from the start; none has been read
    assert.deepEqual(s.operators.map((o) => [o.domain, o.status, o.no]), [[OP.domain, 'prelaunch', null], [OP2.domain, 'prelaunch', null]]);
});

test('every phase\'s answer imports to a snapshot that keeps the invariants', () => {
    for (const [phase, snap] of Object.entries({ ...PHASES, ...Object.fromEntries(Object.entries(TWO).map(([k, v]) => [`two ${k}`, v])) })) {
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
        ['a pool that is not its operator\'s', (a) => { a.pool.pool_id += 1; }],
    ];
    for (const [what, mutate] of broken) {
        const answer = drawnAnswer();
        mutate(answer);
        assert.ok(apiProblems(answer).length > 0, `the import accepted ${what}`);
        assert.throws(() => normalize(answer, null, OP), /not a valid GET \/sn\/ctf/, what);
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
    assert.match(snapshotProblems(normalize(answer, null, OP)).join(' '), /epoch 9's draw is pending after a drawn epoch/);
});

test('the import reads the operator list the site publishes', () => {
    const list = parseOperatorList(fs.readFileSync(OPERATORS_FILE, 'utf8'));
    assert.ok(list.length >= 1);
    assert.deepEqual(list.map((op) => Object.keys(op)), list.map(() => ['domain', 'api_url']));
    // the committed snapshot lists the published operators, in the list's order
    assert.deepEqual(SNAPSHOT.operators.map((o) => [o.domain, o.api_url]), list.map((op) => [op.domain, op.api_url]));
    const two = 'schema: urnetwork-operators-v1\noperators:\n  - domain: bringyour.com\n    api_url: https://api.bringyour.com\n    connect_url: wss://connect.bringyour.com\n  - domain: example.org\n    api_url: https://api.example.org/\n    connect_url: wss://connect.example.org\n';
    assert.deepEqual(parseOperatorList(two), [OP, OP2], 'a trailing slash is dropped');
    for (const [what, text] of [
        ['another schema', two.replace('urnetwork-operators-v1', 'urnetwork-operators-v2')],
        ['no operator', 'schema: urnetwork-operators-v1\noperators: []\n'],
        ['an API over http', two.replace('https://api.example.org/', 'http://api.example.org')],
        ['a domain twice', two.replace('example.org\n', 'bringyour.com\n')],
    ]) assert.throws(() => parseOperatorList(text), Error, what);
});

test('with one operator the aggregate is that operator\'s figures, and it keeps the operator\'s own snapshot', () => {
    for (const [phase, answer] of Object.entries({ first: firstAnswer(), pending: firstAnswer({ pending: true }), drawn: drawnAnswer(), undrawn: drawnAnswer({ drawn: false }) })) {
        const own = normalize(answer, null, OP);
        assert.deepEqual(own.operator, { no: 1, domain: OP.domain, api_url: OP.api_url });
        assert.equal(own.source, 'https://api.bringyour.com/sn/ctf');
        const all = aggregate([{ op: OP, snapshot: own }], null);
        for (const key of Object.keys(own)) {
            if (['about', 'schema', 'source', 'operator', 'pool'].includes(key)) continue;
            assert.deepEqual(all[key], own[key], `${phase}: ${key}`);
        }
        assert.deepEqual(all.operators, [{ domain: OP.domain, api_url: OP.api_url, no: 1, pool_id: 2 ** 32 + 1, status: 'included', reason: null, as_of: own.as_of, drawn: own.last_epoch ? own.last_epoch.drawn : null, slot: own.last_epoch ? own.last_epoch.slot : null }]);
        assert.ok(all.countries.every((c) => !('ops' in c.providers)), `${phase}: one operator's roles are its own`);
    }
    // the pages read the same from the aggregate as from the operator's own snapshot
    const one = buildModel(normalize(drawnAnswer(), null, OP));
    for (const c of MODELS.drawn.countries) {
        const o = one.byCode.get(c.code);
        assert.deepEqual([c.p.won, c.p.slots, c.p.open, c.p.held, c.p.chance, c.p.est, c.avail, c.big, c.flags], [o.p.won, o.p.slots, o.p.open, o.p.held, o.p.chance, o.p.est, o.avail, o.big, o.flags], c.code);
    }
    // the operators' own snapshots: each included operator's, which add up to the aggregate (none before the start)
    const files = fs.existsSync(OPERATOR_DIR) ? fs.readdirSync(OPERATOR_DIR).sort() : [];
    const included = SNAPSHOT.operators.filter((o) => o.status === 'included');
    assert.deepEqual(files, included.map((o) => `${o.domain}.json`).sort());
    if (included.length) {
        const kept = included.map((o) => {
            const text = fs.readFileSync(path.join(OPERATOR_DIR, `${o.domain}.json`), 'utf8');
            const snapshot = JSON.parse(text);
            assert.equal(text, serialize(snapshot), `${o.domain}: as the import writes it`);
            assert.equal(snapshot.operator.domain, o.domain);
            return { op: { domain: o.domain, api_url: o.api_url }, snapshot };
        });
        const left = SNAPSHOT.operators.filter((o) => o.status === 'left_out').map((o) => ({ op: { domain: o.domain, api_url: o.api_url }, reason: o.reason }));
        const all = aggregate([...kept, ...left].sort((a, b) => SNAPSHOT.operators.findIndex((o) => o.domain === a.op.domain) - SNAPSHOT.operators.findIndex((o) => o.domain === b.op.domain)), null);
        const strip = (s) => ({ ...s, countries: s.countries.map(({ online, seen_days, last_seen, peak, ...c }) => c), presence: null });
        assert.deepEqual(strip(all), strip(SNAPSHOT), 'the committed aggregate is its operators\' snapshots added up');
    }
});

test('two operators add up: slots, pots, awards, flags and entries, with each operator\'s own draw', () => {
    const a = TWO.drawn;
    const [one, two] = [normalize(drawnAnswer(), null, OP), normalize(drawnAnswer(SECOND), null, OP2)];
    assert.deepEqual(a.operators.map((o) => [o.domain, o.no, o.status, o.slot]), [[OP.domain, 1, 'included', SLOT], [OP2.domain, 2, 'included', SLOT2]]);
    assert.equal(a.totals.flags_held, one.totals.flags_held + two.totals.flags_held);
    for (const key of ['carried', 'awarded', 'won', 'fresh', 'slot']) assert.equal(a.last_epoch[key], one.last_epoch[key] + two.last_epoch[key], key);
    a.countries.forEach((c, i) => {
        for (const role of ['providers', 'extenders']) {
            const [r1, r2] = [one.countries[i][role], two.countries[i][role]];
            for (const key of ['won', 'units', 'near_misses', 'pot', 'awarded']) assert.equal(c[role][key], r1[key] + r2[key], `${c.code} ${role} ${key}`);
            assert.deepEqual(c[role].ops, [r1, r2]);
        }
    });
    const m = TWO_MODELS.drawn;
    assert.equal(m.multi, true);
    assert.equal(m.roleSlots, 10);
    assert.equal(m.totals.flagsTotal, 2 * 249);
    assert.equal(slotFigure(m), '0.030–0.048');
    // a role is open where either operator left a slot of it; held where both filled theirs; the chance is each draw's
    for (const c of m.countries) {
        for (const role of ['p', 'x']) {
            const r = c[role];
            assert.equal(r.slots, 10);
            assert.equal(r.open, r.ops.some((o) => o.won < 5));
            assert.equal(r.held, r.ops.every((o) => o.won === 5));
            assert.deepEqual(r.ops.map((o) => o.chance), r.ops.map((o) => chanceOf(o.units)));
            assert.equal(r.chance, Math.max(...r.ops.map((o) => chanceOf(o.units))));
            assert.deepEqual(r.ops.map((o) => o.est), [winEstimate(SLOT, r.ops[0].pot), winEstimate(SLOT2, r.ops[1].pot)]);
        }
        assert.equal(c.flags, [0, 1].filter((i) => c.p.ops[i].held && c.x.ops[i].held).length);
    }
    const held = m.countries.find((c) => c.p.held && c.p.ops[0].units !== c.p.ops[1].units);
    assert.ok(held, 'a role both operators filled, from different draws');
    const list = opsList(m, held.p);
    assert.equal(list, held.p.ops.map((o) => `${pct(o.chance)} at ${o.operator}`).join(' · '));
    assert.match(roleLine(m, held, 'p'), /^10 of 10 won last epoch/);
    assert.equal(opsLine(m, held.p), `By operator: ${list}.`);
    assert.match(roleDetail(m, held, 'p'), new RegExp(`at every operator\\..*${list.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.$`));
    const open = m.countries.find((c) => c.p.open && c.p.ops.every((o) => o.open));
    assert.match(opsList(m, open.p), /^open at bringyour\.com, about \d+\.\d\d α · open at example\.org, about \d+\.\d\d α$/);
    assert.match(nextStep(m, open).near, / of 20 slots here| left early/);
    const allHeld = m.countries.find((c) => !c.p.open && !c.x.open);
    if (allHeld) assert.match(countryMessage(m, allHeld), /at every operator, so a newcomer needs its operator's draw\. Chance to win as a provider: .* at bringyour\.com · .* at example\.org; as an extender:/);
    // one operator's page names no operator
    for (const c of MODELS.drawn.countries) assert.equal(opsList(MODELS.drawn, c.p), null);
    // an operator without a draw beside one with it: its slots carried, the pages say so
    const mixed = TWO_MODELS.mixed;
    assert.equal(mixed.drawn, true);
    const c = mixed.countries.find((x) => x.p.ops[0].won < 5);
    assert.equal(c.p.slots, 5);
    assert.match(opsList(mixed, c.p), /no draw at example\.org$/);
    // before the first root the slot counts are five at each operator
    const first = TWO_MODELS.first;
    assert.equal(roleLine(first, first.byCode.get('ke'), 'p'), '10 slots this epoch · drawn about Dec 4, 18:25 UTC');
    assert.match(countryDescription(first, first.byCode.get('ke'), DAY), /^Kenya has 10 provider and 10 extender reward slots in epoch 8/);
    assert.match(hubDescription(first), /^10 provider and 10 extender reward slots in every country/);
});

test('an operator that cannot be read, or is not at the others\' epoch, is left out with the reason; none read writes nothing', () => {
    const drawn = { op: OP, snapshot: normalize(drawnAnswer(), null, OP) };
    const down = aggregate([drawn, { op: OP2, reason: 'GET https://api.example.org/sn/ctf: 503 Service Unavailable' }], null);
    assert.deepEqual(snapshotProblems(down), []);
    assert.deepEqual(down.operators.map((o) => [o.domain, o.status, o.reason]), [[OP.domain, 'included', null], [OP2.domain, 'left_out', 'GET https://api.example.org/sn/ctf: 503 Service Unavailable']]);
    // the figures are the one read
    const one = aggregate([drawn], null);
    assert.deepEqual({ ...down, operators: null }, { ...one, operators: null });
    const m = buildModel(down);
    assert.deepEqual(m.leftOut.map((o) => o.domain), [OP2.domain]);
    assert.equal(m.multi, false);
    // an operator whose first root is not committed yet, beside a drawn one
    const behind = aggregate([drawn, { op: OP2, snapshot: normalize(firstAnswer({ pending: true, no: 2 }), null, OP2) }], null);
    assert.match(behind.operators[1].reason, /no committed root yet/);
    // an operator whose answer is an epoch old
    const old = drawnAnswer({ no: 2 });
    old.current_epoch = { ...old.current_epoch, epoch: 8 };
    old.last_epoch = { ...old.last_epoch, epoch: 7 };
    assert.match(aggregate([drawn, { op: OP2, snapshot: normalize(old, null, OP2) }], null).operators[1].reason, /from epoch 8, the others' from epoch 9/);
    // a snapshot that breaks the pages' invariants (a draw pending after a drawn epoch)
    const late = drawnAnswer({ no: 2 });
    late.pending_draw = { epoch: 8, census_hash: null, census_block: null, round: null };
    assert.match(aggregate([drawn, { op: OP2, snapshot: normalize(late, null, OP2) }], null).operators[1].reason, /breaks the pages' invariants: epoch 8's draw is pending/);
    assert.throws(() => aggregate([{ op: OP, reason: 'GET https://api.bringyour.com/sn/ctf: 503 Service Unavailable' }], null), /no operator could be included:\n {2}bringyour\.com: GET/);
    // the aggregate keeps its own invariants: a role's figures that are not its operators' sum are refused
    const broken = structuredClone(TWO.drawn);
    broken.countries[3].providers.pot += 1;
    assert.match(snapshotProblems(broken).join(' '), /not the operators' sum/);
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
        de: ['12,97', '1.234', '2,6\u00a0%', '83\u00a0%', '27. Nov., 18:25 UTC', '27. November 2026', '16 T 03 h'],
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
    // Start mining and Run a provider open the miner guide in the page's language; Run an extender its chapter
    assert.equal(ctaLink('de', 'start'), '/de/docs/miner');
    assert.equal(ctaLink('ar', 'p'), '/ar/docs/miner');
    assert.equal(ctaLink('en', 'start'), '/docs/miner');
    assert.match(ctaLink('de', 'x'), /^(\/de)?\/docs\/miner\/extender$/);
    assert.equal(ctaLink('en', 'x'), '/docs/miner/extender');
});

// A country page's <main> in miniature, as CtfCountry.jsx renders one from a model: its names in the trail, the
// heading, the card and the questions, escaped as React escapes them; what it says of its own country (the
// territory sentence, its dashboard count and its pots, as the page prints them); a line of the copy (`copy`); its
// local note if it has one; the day it last changed; and its other big pots and neighbours, which are about other
// countries, with a section inside a section. React's marker between two texts is in it unless `markers` is false.
// `drop` leaves its figures out in the languages it names. The decision renders the page of the placeholder code in
// the placeholder model (ctf/indexing.js), so `render` reads the country from `model`, as the component does.
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
function countryMain(m, code, { copy = '', day = DAY, markers = true, drop = [] } = {}) {
    const c = m.byCode.get(code);
    const f = formats(m.lang);
    const { prev, next } = neighbours(m, code);
    const figures = drop.includes(m.lang) ? '' : [
        c.online === null ? '' : `${f.int(c.online)} providers online.`,
        `Pots: ${f.alpha(c.p.pot)} α and ${f.alpha(c.x.pot)} α.`,
    ].join(' ');
    const said = [uninhabitedSentence(c, m.lang), figures, copy].filter(Boolean).join(' ');
    const note = c.note ? `<br/><br/>Local note, reviewed <time dateTime="${c.note.reviewed}">${c.note.reviewed}</time>: ${esc(c.note[m.lang] || c.note.text)}` : '';
    return [
        '<div class="ctf-page"><div class="ctf-shell"><header class="ctf-hdr">',
        `<nav class="ctf-crumbs" aria-label="Breadcrumb"><a href="/ctf">Capture the flag</a><span aria-hidden="true">›</span><span aria-current="page">${esc(c.short)}</span></nav>`,
        `<h1>Earn crypto in ${esc(c.the)} with your internet connection</h1>`,
        `<p class="ctf-intro">${esc(c.The)} has five provider slots and five extender slots each epoch${markers ? '<!-- -->' : ''}. ${esc(said)}</p></header>`,
        `<section class="ctf-mine"><h2 id="ctf-mine-h" class="ctf-me-name">${esc(c.name)}</h2><img src="/ctf/flags/${c.code}.svg" alt=""/><a class="ctf-btn ctf-btn-p" href="https://ur.io">Start mining in ${esc(c.the)}</a></section>`,
        `<section class="ctf-sec ctf-feat-sec" data-ctf-elsewhere=""><h2>Other big pots this epoch</h2><div class="ctf-feat"><article><section><h3><a href="/ctf/${next.code}">${esc(next.name)}</a></h3></section><b>${esc(next.name)} in pots</b></article></div></section>`,
        `<nav class="ctf-sec ctf-around" aria-label="More countries" data-ctf-elsewhere=""><a href="/ctf/${prev.code}" rel="prev">${esc(prev.name)}</a><a href="/ctf">All 249 countries</a><a href="/ctf/${next.code}" rel="next">${esc(next.name)}</a></nav>`,
        `<section id="faq"><details open=""><summary>How do I get paid?</summary><p>Local law in ${esc(c.the)} applies.${note}`,
        `</p></details></section><footer class="ctf-foot"><p>Updated <time dateTime="${day}">${day}</time>.</p></footer></div></div>`,
    ].join('');
}
const renderWith = (options = {}) => ({ code, model }) => countryMain(model, code, options);
// a model with some countries' data or notes changed, as a snapshot or a note file would change them
function withCountries(m, changes) {
    const countries = m.countries.map((c) => (changes[c.code] ? { ...c, ...changes[c.code] } : c));
    const byCode = new Map(countries.map((c) => [c.code, c]));
    return { ...m, countries, byCode, az: m.az.map((c) => byCode.get(c.code)) };
}
const pots = (p, x = 0) => ({ p: { ...MODELS.first.byCode.get('ke').p, pot: p }, x: { ...MODELS.first.byCode.get('ke').x, pot: x } });

test('the decision reads a page with its country as a placeholder, leaving out other countries and the days it states', () => {
    // countries whose figures are the same (before the first draw, with no dashboard counts)
    const m = MODELS.first;
    const own = (code, options = {}) => ownContent(countryMain(placeholderModel(m, code), PLACEHOLDER_CODE, options));
    const ke = own('ke');
    // its neighbours, its other big pots and the day it last changed are no content of its own
    assert.equal(own('li', { day: '2026-12-04' }), ke, 'Liechtenstein\'s page reads like Kenya\'s but for the name');
    assert.equal(own('ke', { markers: false }), ke, 'React\'s markers between texts are nothing, so every render reads alike');
    for (const elsewhere of [...Object.values(neighbours(m, 'ke')).map((c) => c.name), 'Other big pots', 'All 249 countries', DAY, 'Kenya']) {
        assert.ok(!ke.includes(elsewhere), elsewhere);
    }
    assert.match(ke, /^Capture the flag › ⟨country⟩ Earn crypto in ⟨country⟩ with your internet connection ⟨country⟩ has five provider slots and five extender slots each epoch\. /);
    // every form of a name, whatever its length or escaping, is the one placeholder
    for (const code of ['cd', 'ci', 'us', 'bs']) assert.equal(own(code), ke, code);
    // the placeholder model is the model but for the one country, which keeps its data
    const pm = placeholderModel(m, 'ke');
    assert.equal(pm.byCode.get('ke'), undefined);
    assert.equal(pm.byCode.get(PLACEHOLDER_CODE).p, m.byCode.get('ke').p);
    assert.equal(pm.byCode.get('li'), m.byCode.get('li'));
    assert.equal(pm.countries.length, 249);
    // in a translation, its forms in that language too ("в Кении", "na Науру")
    const ru = localModel(m, 'ru');
    assert.equal(ownContent(countryMain(placeholderModel(ru, 'ke'), PLACEHOLDER_CODE)), ownContent(countryMain(placeholderModel(ru, 'nr'), PLACEHOLDER_CODE)));
});

test('the build indexes a country page unless it reads like another but for the name', () => {
    const m = withCountries(MODELS.first, { us: { online: 30000 }, de: { online: 400 }, fr: { online: 400 } });
    const { decided, byLang, disagreements } = countryIndexing(m, renderWith(), ['en']);
    assert.deepEqual(disagreements, []);
    assert.deepEqual([...decided.keys()], m.countries.map((c) => c.code), 'every country, in the model\'s order');
    assert.deepEqual(decided.get('us'), { noindex: false, alike: [] }, 'a page of its own');
    assert.deepEqual(decided.get('de'), { noindex: true, alike: ['fr'] }, 'two pages with the same figures');
    assert.equal(decided.get('ke').noindex, true);
    assert.equal(decided.get('ke').alike.length, 249 - 7 - 3 - 1, 'the inhabited countries with nothing of their own');
    assert.deepEqual(decided.get('aq').alike, ['bv', 'gs', 'hm', 'io', 'tf', 'um'], 'the territories without people read alike');
    assert.deepEqual(byLang.get('en').groups.map((g) => g.length).sort((a, b) => a - b), [2, 7, 249 - 7 - 3]);
    // nothing of its own anywhere: every page reads like another
    assert.ok([...countryIndexing(MODELS.first, renderWith(), ['en']).decided.values()].every((d) => d.noindex));
});

test('a word of the copy that is a country\'s code reads the same on every page (review finding 4a)', () => {
    // Anguilla (AI) and Italy (IT) with the same figures, under copy that says "AI" and "IT": masking a page's own
    // code in its text made each read apart from the other, so both were indexed
    const m = withCountries(MODELS.first, { ai: { online: 5 }, it: { online: 5 }, no: { online: 9 }, pm: { online: 9 } });
    const copy = 'AI agents and IT teams can use it too. NO, PM and US are words here.';
    const { decided } = countryIndexing(m, renderWith({ copy }), ['en']);
    assert.deepEqual(decided.get('ai'), { noindex: true, alike: ['it'] });
    assert.deepEqual(decided.get('it'), { noindex: true, alike: ['ai'] });
    assert.deepEqual(decided.get('no'), { noindex: true, alike: ['pm'] });
    // the copy's words stay as they are, on every page
    const own = ownContent(countryMain(placeholderModel(m, 'ai'), PLACEHOLDER_CODE, { copy }));
    assert.ok(own.includes('AI agents and IT teams can use it too. NO, PM and US are words here.'), own);
});

test('a local note sets its page apart by what it says, never by the name in it (review finding 4b)', () => {
    const note = (text, extra = {}) => ({ reviewed: '2026-12-01', text, ...extra });
    // a note of its own: indexable, and the others read alike as before
    const own = countryIndexing(withCountries(MODELS.first, { ke: { note: note('Winnings can be cashed out to M-Pesa through an exchange that lists alpha.') } }), renderWith(), ['en']).decided;
    assert.deepEqual(own.get('ke'), { noindex: false, alike: [] });
    assert.equal(own.get('li').noindex, true);
    // two notes that differ by the name alone, in English and in German: both noindex, each like the other
    const alike = withCountries(MODELS.first, {
        ke: { note: note('Winnings can be cashed out in Kenya through an exchange that lists alpha.', { de: 'In Kenia lassen sich Gewinne über eine Börse auszahlen, die Alpha listet.' }) },
        li: { note: note('Winnings can be cashed out in Liechtenstein through an exchange that lists alpha.', { de: 'In Liechtenstein lassen sich Gewinne über eine Börse auszahlen, die Alpha listet.' }) },
    });
    const both = countryIndexing(alike, renderWith(), ['en', 'de']);
    assert.deepEqual(both.disagreements, []);
    assert.deepEqual(both.decided.get('ke'), { noindex: true, alike: ['li'] });
    assert.deepEqual(both.byLang.get('de').decided.get('li'), { noindex: true, alike: ['ke'] });
    // the note's words, each name of its country (its "in <country>" forms first) the placeholder, are what the decision reads
    const read = (lm, code, key) => placeholderModel(lm, code).byCode.get(PLACEHOLDER_CODE).note[key];
    assert.equal(read(alike, 'ke', 'text'), 'Winnings can be cashed out ⟨country⟩ through an exchange that lists alpha.');
    assert.equal(read(alike, 'li', 'text'), read(alike, 'ke', 'text'));
    assert.equal(read(localModel(alike, 'de'), 'ke', 'de'), '⟨country⟩ lassen sich Gewinne über eine Börse auszahlen, die Alpha listet.');
    assert.equal(read(localModel(alike, 'de'), 'li', 'de'), read(localModel(alike, 'de'), 'ke', 'de'));
});

test('every language noindexes the same country pages', () => {
    const m = withCountries(MODELS.first, { us: { online: 30000 }, de: { online: 400 }, fr: { online: 400 } });
    const all = countryIndexing(m, renderWith(), LANGS);
    assert.deepEqual(all.disagreements, []);
    for (const lang of LANGS) {
        assert.deepEqual([...all.byLang.get(lang).decided].filter(([, d]) => d.noindex).map(([code]) => code), [...all.decided].filter(([, d]) => d.noindex).map(([code]) => code), lang);
    }
    // a translation that leaves out the figures reads alike where the English does not: the languages disagree
    const dropped = countryIndexing(m, renderWith({ drop: ['de'] }), LANGS);
    assert.equal(dropped.disagreements.length, 1);
    assert.match(dropped.disagreements[0], /^de would noindex \/de\/ctf\/us, unlike en$/);
});

test('the seo-audit holds the built pages to the decision, and reads the figures as the pages print them (review finding 3)', () => {
    const m = withCountries(MODELS.first, { us: { online: 30000 }, de: { online: 400 }, fr: { online: 400 } });
    const decision = countryIndexing(m, renderWith(), ['en', 'ru']);
    const built = (changed = {}) => ['en', 'ru'].flatMap((lang) => m.countries.map((c) => ({ lang, code: c.code, noindex: decision.decided.get(c.code).noindex, ...changed[`${lang} ${c.code}`] })));
    assert.deepEqual(countryIndexingProblems(m, decision, built()), []);
    // a page indexed against the decision, in any language, and one noindexed
    assert.deepEqual(countryIndexingProblems(m, decision, built({ 'ru ke': { noindex: false }, 'en us': { noindex: true } })), [
        '/ctf/us: noindex, though it reads like no other country page',
        '/ru/ctf/ke: indexable, though it reads like /ru/ctf/ad, /ru/ctf/ae, /ru/ctf/af and 235 more but for the country\'s name, so it must be noindex',
    ]);
    assert.deepEqual(countryIndexingProblems(m, decision, [...built(), { lang: 'en', code: 'xk', noindex: false }]).slice(-1), ['/ctf/xk: no such country in the snapshot']);
    // pots a page prints alike are alike: 0.001 α and 0.004 α are both "0.00", so two pages reading alike are fine
    const close = withCountries(MODELS.first, { ke: { online: 7, ...pots(1_000_000) }, li: { online: 7, ...pots(4_000_000) } });
    const closeDecision = countryIndexing(close, renderWith(), ['en']);
    assert.deepEqual(closeDecision.decided.get('ke'), { noindex: true, alike: ['li'] });
    assert.deepEqual(countryIndexingProblems(close, closeDecision, close.countries.map((c) => ({ lang: 'en', code: c.code, noindex: closeDecision.decided.get(c.code).noindex }))), []);
    // pots that print apart set the pages apart
    const apart = countryIndexing(withCountries(MODELS.first, { ke: { online: 7, ...pots(1_000_000) }, li: { online: 7, ...pots(10_000_000) } }), renderWith(), ['en']);
    assert.equal(apart.decided.get('ke').noindex, false);
    // a page that leaves out its own figures: pages whose pots print apart read alike
    const hidden = withCountries(MODELS.first, { ke: { online: 7, ...pots(1e9) }, li: { online: 7, ...pots(2e9) } });
    const hiddenDecision = countryIndexing(hidden, renderWith({ drop: ['en'] }), ['en']);
    const problems = countryIndexingProblems(hidden, hiddenDecision, hidden.countries.map((c) => ({ lang: 'en', code: c.code, noindex: hiddenDecision.decided.get(c.code).noindex })));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^\/ctf\/ad, \/ctf\/ae, \/ctf\/af and \d+ more: read the same but for the country's name, though the figures they print differ \(a page leaves out its own figures\)$/);
});
