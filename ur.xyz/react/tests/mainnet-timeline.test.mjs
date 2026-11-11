// The /mainnet timeline's data (src/data/mainnet-timeline.json, the epochs in
// src/data/mainnet.js) and the helpers that render it
// (src/components/pages/mainnet/timeline.js). The milestones are edited by
// hand and their transaction hashes merged in as they are verified, so this
// checks what a careless edit would break: every milestone has a readable
// date, a known status and a unique id, they run in order, and every source
// the page would link has a well-formed ref and an explorer to link it with.
// A source whose ref is still empty is allowed: the page leaves it out. Besides
// the fields every milestone has, one may say whether its time is approximate
// (`approximate`), where the default for its status is wrong, and a key
// milestone says so (`key: true`): the summary timeline under the page's title
// marks it (tests/mainnet-summary.test.mjs).
//
// Usage: node --test tests/mainnet-timeline.test.mjs   (no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { mainnetActions, mainnetEpochs, mainnetNotices, newestFirst, noticeDay, SECONDS_PER_BLOCK } from '../src/data/mainnet.js';
import {
    EXPLORER_PLACEHOLDERS,
    REF_FORMATS,
    SETTLEMENT_LABEL,
    SOURCE_KINDS,
    STATUS_LABEL,
    epochBlocks,
    groupByEpoch,
    isApproximate,
    parseWhen,
    sourceLink,
    sourceRows,
    thousands,
    whenText,
} from '../src/components/pages/mainnet/timeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '../src/data/mainnet-timeline.json');
const timeline = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const { explorers, events } = timeline;

test('the file has the explorers and the events, and nothing else', () => {
    assert.deepEqual(Object.keys(timeline).sort(), ['events', 'explorers']);
    assert.ok(Array.isArray(events) && events.length > 0);
    for (const [kind, placeholders] of Object.entries(EXPLORER_PLACEHOLDERS)) {
        const template = explorers[kind];
        assert.equal(typeof template, 'string', `explorers.${kind}`);
        assert.match(template, /^https:\/\/[^\s/]+\//, `explorers.${kind} is an https URL`);
        for (const placeholder of placeholders) assert.ok(template.includes(placeholder), `explorers.${kind} carries ${placeholder}`);
    }
    for (const kind of Object.keys(explorers)) assert.ok(Object.hasOwn(EXPLORER_PLACEHOLDERS, kind), `explorers.${kind} is no source kind`);
});

test('every milestone has a unique id, a readable date, a known status, a title and a detail', () => {
    const ids = new Set();
    // ids the page itself uses: the notices, the sections and the epoch groups
    const reserved = new Set([...mainnetNotices.map((n) => n.id), 'actions', 'mainnet', 'settlement', 'milestones', 'before-launch', ...mainnetEpochs.map((e) => `epoch-${e.number}`), `after-epoch-${mainnetEpochs.at(-1).number}`]);
    for (const event of events) {
        const fields = Object.keys(event).filter((key) => key !== 'approximate' && key !== 'key').sort();
        assert.deepEqual(fields, ['date', 'detail', 'id', 'sources', 'status', 'title'], `${event.id}: fields`);
        if ('approximate' in event) assert.equal(typeof event.approximate, 'boolean', `${event.id}: approximate is true or false`);
        if ('key' in event) assert.equal(event.key, true, `${event.id}: key is true, or left out`);
        assert.match(event.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${event.id}: a lowercase slug`);
        assert.ok(!ids.has(event.id), `${event.id}: duplicate id`);
        assert.ok(!reserved.has(event.id) && !event.id.endsWith('-heading'), `${event.id}: an id the page uses`);
        ids.add(event.id);
        assert.ok(parseWhen(event.date), `${event.id}: unreadable date ${event.date}`);
        assert.ok(Object.hasOwn(STATUS_LABEL, event.status), `${event.id}: unknown status ${event.status}`);
        for (const field of ['title', 'detail']) {
            assert.equal(typeof event[field], 'string', `${event.id}: ${field}`);
            assert.ok(event[field].trim().length > 0, `${event.id}: empty ${field}`);
            assert.equal(event[field], event[field].trim(), `${event.id}: ${field} has surrounding space`);
        }
    }
});

test('the milestones run in date order', () => {
    // a date without a time is the whole day: it orders against its day only
    let previous = null;
    for (const event of events) {
        const { start } = parseWhen(event.date);
        if (previous) {
            const coarse = !start.hasTime || !previous.start.hasTime;
            const day = (ms) => Math.floor(ms / 86400000);
            const ok = coarse ? day(start.ms) >= day(previous.start.ms) : start.ms >= previous.start.ms;
            assert.ok(ok, `${event.id} (${event.date}) comes before ${previous.id} (${previous.date})`);
        }
        previous = { id: event.id, date: event.date, start };
    }
});

test('every source has a label and a known kind, and a ref that is empty or well formed', () => {
    for (const event of events) {
        assert.ok(Array.isArray(event.sources), `${event.id}: sources`);
        const linked = new Set();
        for (const source of event.sources) {
            const where = `${event.id}: source "${source.label}"`;
            assert.deepEqual(Object.keys(source).sort(), ['kind', 'label', 'ref'], `${where}: fields`);
            assert.ok(typeof source.label === 'string' && source.label.trim(), `${where}: no label`);
            assert.ok(SOURCE_KINDS.includes(source.kind), `${where}: unknown kind ${source.kind}`);
            assert.equal(typeof source.ref, 'string', `${where}: ref is not a string`);
            if (source.ref === '') continue;
            assert.match(source.ref, REF_FORMATS[source.kind], `${where}: ref ${source.ref} is not a ${source.kind}`);
            const key = `${source.kind}:${source.ref.toLowerCase()}`;
            assert.ok(!linked.has(key), `${where}: the same ${source.kind} twice`);
            linked.add(key);
            const link = sourceLink(source, explorers);
            assert.ok(link, `${where}: no link`);
            // one of this site's pages first: new URL() throws on a path with no origin
            assert.ok(link.href.startsWith('/') || new URL(link.href).protocol === 'https:', `${where}: ${link.href}`);
            assert.ok(!/[{}]/.test(link.href), `${where}: a placeholder is left in ${link.href}`);
        }
    }
});

test('a source becomes a link only with a well-formed ref', () => {
    const hash = `0x${'ab'.repeat(32)}`;
    const address = '0xC18925925E2B7bb9059b7d696b8c92762AE86406';
    assert.equal(sourceLink({ label: 'Pending', kind: 'evm_tx', ref: '' }, explorers), null);
    assert.equal(sourceLink({ label: 'Pending', kind: 'evm_tx', ref: '   ' }, explorers), null);
    assert.equal(sourceLink({ label: 'Short', kind: 'evm_tx', ref: '0x1234' }, explorers), null);
    assert.equal(sourceLink({ label: 'Address as a tx', kind: 'evm_tx', ref: address }, explorers), null);
    assert.equal(sourceLink({ label: 'Unknown', kind: 'solana_tx', ref: hash }, explorers), null);
    assert.equal(sourceLink({ label: 'No template', kind: 'evm_tx', ref: hash }, {}), null);
    assert.equal(sourceLink({ label: 'Plain http', kind: 'doc', ref: 'http://example.com/x' }, explorers), null);
    assert.equal(sourceLink({ label: 'Not a block', kind: 'evm_block', ref: '9,247,228' }, explorers), null);
    assert.equal(sourceLink({ label: 'Index too long', kind: 'substrate_extrinsic', ref: '9276925-10000' }, explorers), null);

    const test = {
        evm_tx: 'https://explorer.test/tx/{hash}',
        substrate_extrinsic: 'https://explorer.test/extrinsic/{block}-{index}',
        evm_address: 'https://explorer.test/address/{address}',
        evm_block: 'https://explorer.test/block/{number}',
        substrate_block: 'https://explorer.test/block/{number}/extrinsics',
    };
    assert.deepEqual(sourceLink({ label: 'Close', kind: 'evm_tx', ref: hash }, test), { href: `https://explorer.test/tx/${hash}`, text: 'View transaction', value: null });
    assert.deepEqual(sourceLink({ label: 'Coordinator', kind: 'evm_address', ref: address }, test), { href: `https://explorer.test/address/${address}`, text: 'View contract', value: address });
    assert.deepEqual(sourceLink({ label: 'Epoch start', kind: 'evm_block', ref: '9247228' }, test), { href: 'https://explorer.test/block/9247228', text: 'View block', value: null });
    assert.deepEqual(sourceLink({ label: 'Upgrade', kind: 'substrate_block', ref: '9276925' }, test), { href: 'https://explorer.test/block/9276925/extrinsics', text: 'View block', value: null });
    // an extrinsic id is built from its numbers, the index padded to 4 digits:
    // the explorer answers an unpadded id with an empty page
    for (const ref of ['9248148-5', '9248148-0005', '9248148-005']) {
        const extrinsic = sourceLink({ label: 'Commit', kind: 'substrate_extrinsic', ref }, test);
        assert.deepEqual(extrinsic, { href: 'https://explorer.test/extrinsic/9248148-0005', text: 'View transaction', value: null }, ref);
    }
    assert.equal(sourceLink({ label: 'Commit', kind: 'substrate_extrinsic', ref: '9248148-5' }, explorers).href, 'https://taostats.io/extrinsic/9248148-0005');
    const doc = sourceLink({ label: 'Miner guide', kind: 'doc', ref: '/docs/miner' }, {});
    assert.deepEqual(doc, { href: '/docs/miner', text: 'Miner guide', value: null });
});

test('a run of more than three transactions is listed apart from the contracts', () => {
    const tx = (n) => ({ label: `Step ${n}`, kind: 'evm_tx', ref: `0x${String(n).repeat(64).slice(0, 64)}` });
    const contract = { label: 'Coordinator', kind: 'evm_address', ref: '0xC18925925E2B7bb9059b7d696b8c92762AE86406' };
    const pending = { label: 'Pending', kind: 'evm_tx', ref: '' };
    const few = sourceRows([contract, tx(1), tx(2), pending, tx(3)], explorers);
    assert.deepEqual(few.rows.map((r) => r.source.label), ['Coordinator', 'Step 1', 'Step 2', 'Step 3']);
    assert.equal(few.folded.length, 0);
    const many = sourceRows([contract, tx(1), tx(2), tx(3), tx(4), pending], explorers);
    assert.deepEqual(many.rows.map((r) => r.source.label), ['Coordinator']);
    assert.deepEqual(many.folded.map((r) => r.source.label), ['Step 1', 'Step 2', 'Step 3', 'Step 4']);
    // the deployment shows its contracts, and its 8 transactions apart
    const deployment = sourceRows(events.find((e) => e.id === 'v1-contracts-deployed')?.sources, explorers);
    assert.ok(deployment.rows.every((r) => r.source.kind === 'evm_address'));
    assert.equal(deployment.folded.length, 8);
});

test('dates are written in UTC, with ≈ on the times that are projections', () => {
    const at = (value, options) => whenText(parseWhen(value), options);
    assert.equal(at('2026-10-08T18:36:12Z'), 'Thu Oct 8 · 18:36 UTC');
    assert.equal(at('2026-10-08T17:59:12Z/2026-10-08T18:16:00Z'), 'Thu Oct 8 · 17:59–18:16 UTC');
    assert.equal(at('2026-10-17T15:48:00Z/2026-10-17T16:08:00Z', { approxStart: true }), 'Sat Oct 17 · ≈15:48–16:08 UTC');
    assert.equal(at('2026-10-21T18:09:00Z/2026-10-22T18:09:00Z', { approxStart: true }), 'Wed Oct 21 · ≈18:09 → Thu Oct 22 · ≈18:09 UTC');
    assert.equal(at('2026-10-09T18:09:00Z/2026-10-16T18:09:00Z', { approxStart: false, approxEnd: true }), 'Fri Oct 9 · 18:09 → Fri Oct 16 · ≈18:09 UTC');
    assert.equal(at('2026-10-11'), 'Sun Oct 11');
    assert.equal(at('2026-10-18/2026-10-19'), 'Sun Oct 18 – Mon Oct 19');
    assert.equal(at('2026-10-18/2026-10-19', { approxStart: true }), '≈ Sun Oct 18 – Mon Oct 19');
    // an offset is read as the instant it names, and written in UTC
    assert.equal(at('2026-10-09T20:09:00+02:00'), 'Fri Oct 9 · 18:09 UTC');

    assert.equal(at('2026-10-17', { approxStart: true }), '≈ Sat Oct 17');

    // a scheduled or planned time is a projection (≈) unless set exactly; a
    // past time, or a bare day, is exact unless the milestone says otherwise
    const shown = (event) => whenText(parseWhen(event.date), { approxStart: isApproximate(event) });
    assert.deepEqual(Object.keys(STATUS_LABEL).filter((status) => isApproximate({ status, date: '2026-10-21T00:00:00Z' })), ['scheduled', 'planned']);
    assert.equal(shown({ status: 'scheduled', date: '2026-10-21T00:00:00Z', approximate: false }), 'Wed Oct 21 · 00:00 UTC');
    assert.equal(shown({ status: 'scheduled', date: '2026-10-23T18:09:00Z' }), 'Fri Oct 23 · ≈18:09 UTC');
    assert.equal(shown({ status: 'done', date: '2026-10-09T17:55:00Z', approximate: true }), 'Fri Oct 9 · ≈17:55 UTC');
    assert.equal(shown({ status: 'done', date: '2026-10-09T18:09:00Z' }), 'Fri Oct 9 · 18:09 UTC');
    assert.equal(shown({ status: 'planned', date: '2026-10-16' }), 'Fri Oct 16');
    assert.equal(shown({ status: 'planned', date: '2026-10-17', approximate: true }), '≈ Sat Oct 17');

    for (const bad of ['', 'October 8', '2026-10-32', '2026-02-30', '2026-10-08T18:36', '2026-10-09/2026-10-08', '2026-10-08/2026-10-09T00:00:00Z', 'a/b/c']) {
        assert.equal(parseWhen(bad), null, `"${bad}" should not parse`);
    }
});

test('the epochs are contiguous, and each lasts its number of blocks', () => {
    mainnetEpochs.forEach((epoch, index) => {
        assert.equal(epoch.number, index);
        assert.ok(Object.hasOwn(SETTLEMENT_LABEL, epoch.settlement), `epoch ${epoch.number}: settlement ${epoch.settlement}`);
        const blocks = epoch.end.block - epoch.start.block;
        assert.equal(blocks, index === 0 ? 7200 : 50400, `epoch ${epoch.number}: ${blocks} blocks`);
        const start = Date.parse(epoch.start.time);
        const end = Date.parse(epoch.end.time);
        assert.ok(Number.isFinite(start) && Number.isFinite(end) && end > start, `epoch ${epoch.number}: times`);
        // block times wander: within twenty minutes of 12 s a block (epoch 3 ran about 16 minutes long)
        assert.ok(Math.abs((end - start) / 1000 - blocks * SECONDS_PER_BLOCK) <= 1200, `epoch ${epoch.number}: ${blocks} blocks in ${(end - start) / 1000} s`);
        if (index > 0) {
            const previous = mainnetEpochs[index - 1];
            assert.equal(epoch.start.block, previous.end.block, `epoch ${epoch.number} starts where ${previous.number} ends`);
            assert.equal(epoch.start.time, previous.end.time, `epoch ${epoch.number} starts when ${previous.number} ends`);
        }
    });
    assert.equal(epochBlocks(mainnetEpochs[1]), 'Blocks 9,247,228 → 9,297,628 · 50,400 blocks, 7 days');
    assert.equal(epochBlocks(mainnetEpochs[0]), 'Blocks 9,240,028 → 9,247,228 · 7,200 blocks, 1 day');
});

test('a milestone is grouped by the epoch it ends in, a day counting from its start', () => {
    const epochs = mainnetEpochs;
    const fixture = [
        { id: 'a', date: '2026-10-06T00:00:00Z' },
        // starts before epoch 0, ends in it
        { id: 'b', date: '2026-10-08T17:59:12Z/2026-10-08T18:16:00Z' },
        // a day on which epoch 0 ends at 18:09: the day counts from 00:00
        { id: 'c', date: '2026-10-09' },
        { id: 'd', date: '2026-10-09T18:09:00Z' },
        { id: 'e', date: '2026-10-16T18:09:00Z/2026-10-16T18:33:00Z' },
        { id: 'f', date: '2026-10-23T18:09:00Z' },
        { id: 'g', date: '2026-10-30T18:25:00Z/2026-10-30T22:25:00Z' },
        { id: 'i', date: '2026-11-06T18:25:00Z/2026-11-06T22:25:00Z' },
        // after the last epoch listed, epoch 7
        { id: 'j', date: '2026-11-27T18:25:00Z/2026-11-27T22:25:00Z' },
        { id: 'h', date: 'not a date' },
    ];
    const groups = groupByEpoch(fixture, epochs, { before: { title: 'Before launch' }, after: { summary: 'After' } });
    const where = Object.fromEntries(groups.flatMap((g) => g.events.map((e) => [e.id, g.id])));
    assert.deepEqual(where, { a: 'before-launch', b: 'epoch-0', c: 'epoch-0', d: 'epoch-1', e: 'epoch-2', f: 'epoch-3', g: 'epoch-4', i: 'epoch-5', j: 'after-epoch-7' });
    assert.deepEqual(groups.map((g) => g.title), ['Before launch', 'Epoch 0', 'Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5', 'After epoch 7']);

    // the real milestones all land in a group, in the order the data lists them
    const real = groupByEpoch(events, epochs);
    assert.deepEqual(real.flatMap((g) => g.events.map((e) => e.id)), events.map((e) => e.id));
    // the first priced demand deposits begin epoch 7: its first block, at its projected time
    const priced = events.find((e) => e.id === 'demand-deposits-priced');
    const epoch7 = epochs.find((e) => e.number === 7);
    assert.equal(real.find((g) => g.events.some((e) => e.id === priced.id)).id, 'epoch-7');
    assert.equal(priced.date, epoch7.start.time);
    assert.equal(epoch7.start.block, 9549628);
    assert.match(priced.detail, /^From block 9,549,628, /);
    assert.ok(priced.sources.some((s) => s.kind === 'evm_block' && s.label === "Epoch 7's first block, 9,549,628"));
});

test('the box at the top gives the timeline\'s dates, and links only pages the site has', () => {
    const text = (step) => `${step.title} ${step.detail}`;
    const [install, wallet, payments] = mainnetActions.steps;
    assert.equal(mainnetActions.headline, 'Mainnet is live!');
    assert.equal(mainnetActions.steps.length, 3);
    // the old miner has been deprioritized since October 28, when priority replaced the modern provider
    // gate: the gate's milestone keeps the instant it was due, and says it never turned on
    const gate = events.find((e) => e.id === 'fp2-modern-provider-gate');
    assert.equal(gate.date, '2026-11-11T00:00:00Z');
    assert.equal(gate.status, 'done');
    assert.match(gate.detail, /did not turn on: on October 28 the subnet owner replaced it with priority\./);
    assert.equal(install.title, 'Install the new miner.');
    assert.match(text(install), /Since October 28, providers verified as modern are drawn first in Quality and Speed/);
    assert.doesNotMatch(text(install), /November 11|will be deprioritized/);
    // epoch 3 stayed on version 1; settlement v2 started with epoch 4, at about 18:25 on October 30
    const [, , , epoch3, epoch4] = mainnetEpochs;
    assert.equal(epoch3.settlement, 'v1');
    // the epoch 3 notice is one of the notices at the top, and the box names it, as the milestones do
    assert.ok(mainnetNotices.some((n) => n.id === 'notice'));
    assert.match(text(payments), /Epoch 3's funding is recovered, as the epoch 3 notice at the top explains\./);
    assert.doesNotMatch(text(payments), /paid with epoch 5/);
    assert.equal(epoch4.settlement, 'v2');
    assert.equal(epoch4.start.time, '2026-10-30T18:25:00Z');
    assert.match(text(payments), /epoch 4, from about October 30, 18:25 UTC/);
    assert.equal(events.find((e) => e.id === 'settlement-v2-active').date, epoch4.start.time);
    // its first claims opened when the first v2 root finalized, at 19:10 UTC on November 8
    assert.equal(events.find((e) => e.id === 'first-v2-claim').date.split('/')[0], '2026-11-08T19:10:00Z');
    assert.match(text(payments), /Its first claims opened on November 8, at 19:10 UTC\./);
    // links: the miner guide's own sections, and the operators' apps
    const guide = fs.readFileSync(path.join(__dirname, '../../docs/miner/README.md'), 'utf8');
    const slug = (heading) => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
    const anchors = new Set([...guide.matchAll(/^#{2,3} (.+)$/gm)].map((m) => slug(m[1])));
    for (const step of [install, wallet]) {
        const [route, anchor] = step.link.href.split('#');
        assert.equal(route, '/docs/miner');
        assert.ok(anchors.has(anchor), `the miner guide has no section #${anchor}`);
    }
    assert.equal(payments.link, undefined);
    assert.deepEqual(mainnetActions.closing.filter((run) => run.href).map((run) => [run.text, run.href]), [['the apps', '/operators']]);
    assert.match(mainnetActions.closing.map((run) => run.text).join(''), /^With settlement v2 active, the subnet is set up to run itself and scale to millions of miners\. New miners can participate in Bittensor from the apps with zero Bittensor experience\.$/);
});

test('the epoch 3 notice gives the epochs\' dates, and links to its full text in the sn repo', () => {
    // epoch 3's notice, at the top of the page under the newer notices
    const mainnetNotice = mainnetNotices.find((n) => n.id === 'notice');
    assert.ok(mainnetNotice, 'the epoch 3 notice is listed');
    assert.equal(mainnetNotice.title, 'Epoch 3 payout delayed. Funds are safe.');
    const text = mainnetNotice.paragraphs.join(' ');
    // dated the day it was posted, the day its full text's file name starts with
    assert.equal(mainnetNotice.date, 'October 31, 2026');
    assert.match(mainnetNotice.link.href, /^https:\/\/github\.com\/urfoundation\/sn\/blob\/main\/mainnet\/notices\/2026-10-31-[a-z0-9-]+\.md$/);
    // the recovery root goes in at the end of epoch 4, at about 18:25 on November 6
    const epoch4 = mainnetEpochs[4];
    assert.equal(epoch4.end.time, '2026-11-06T18:25:00Z');
    assert.match(text, /end of epoch 4 \(around November 6, 18:25 UTC\)/);
    // as first posted, it paid with epoch 5, whose claims open 14,400 blocks after it ends
    const claims = new Date(Date.parse(epoch4.end.time) + (50400 + 14400) * SECONDS_PER_BLOCK * 1000);
    assert.equal(claims.toISOString().slice(0, 10), '2026-11-15');
    assert.match(text, /paid out with epoch 5/);
    assert.match(text, /Claims are expected from around November 15\./);
    // the amounts are the full text's, to the hundredth of an alpha
    assert.match(text, /3,482\.26 α for epoch 1 and 4,132\.72 α for epoch 3/);

    // the update of November 11, last: adding the recovery to epoch 5 was not scheduled in time
    const update = mainnetNotice.paragraphs.at(-1);
    assert.match(update, /^Update, November 11: the recovered funds reached the v2 vault on November 8, at 18:30 UTC\. /);
    assert.match(update, /Adding them to epoch 5's payout was not scheduled by November 10, 18:25 UTC, /);
    assert.match(update, /so they are not paid with epoch 5\./);
    assert.match(update, /Epoch 5's regular payout is unaffected\.$/);
    // the timeline says the same, and no milestone still has the recovery paid with epoch 5
    const recovery = events.find((e) => e.id === 'epoch-3-recovery-scheduled');
    assert.equal(recovery.status, 'done');
    assert.equal(recovery.title, 'Recovered funds not scheduled into epoch 5');
    assert.equal(recovery.date, '2026-11-10T18:25:00Z');
    assert.equal(whenText(parseWhen(recovery.date), { approxStart: isApproximate(recovery) }), 'Tue Nov 10 · ≈18:25 UTC');
    assert.match(recovery.detail, /^The recovery reached the v2 vault on November 8 at 18:30 UTC\. /);
    assert.match(recovery.detail, /It was not scheduled, so the recovered funds are not paid with epoch 5/);
    assert.ok(recovery.sources.every((s) => s.ref !== ''), 'the recovery lists only transactions that exist');
    const epoch5 = events.find((e) => e.id === 'epoch-5-claims-with-recovery');
    assert.equal(epoch5.status, 'planned');
    assert.equal(epoch5.title, 'Epoch 5 claims');
    assert.match(epoch5.detail, /The recovered epoch 1 and 3 funding is not part of epoch 5's payout/);
    for (const event of events) {
        assert.doesNotMatch(`${event.title} ${event.detail}`, /recovered and paid with epoch 5|with the recovered epoch 1 and 3 funding|Its root pays epoch 3's recovered funding/, event.id);
    }
});

test('no milestone that ended before November 11, 2026, 12:00 UTC is still scheduled or planned', () => {
    // brought up to date on November 11 from the chain and the rollout records
    const cutoff = Date.parse('2026-11-11T12:00:00Z');
    for (const event of events) {
        const { start, end } = parseWhen(event.date);
        const last = end || start;
        const lastMs = last.hasTime ? last.ms : last.ms + 86400000;
        if (lastMs <= cutoff) assert.equal(event.status, 'done', `${event.id} (${event.date}) is still ${event.status}`);
    }
});

test('the version 1 epochs as the chain recorded them: epochs 1 to 3 finalized without a payout root', () => {
    const byId = (id) => events.find((e) => e.id === id);
    const close = byId('epoch-1-closes');
    assert.equal(close.status, 'done');
    assert.equal(close.date, '2026-10-16T18:09:48Z');
    assert.match(close.detail, /^Epoch 1 closed at block 9,297,631, within its 120-block close window, /);
    assert.match(close.detail, /no payout root was committed by block 9,298,828/);
    assert.deepEqual(close.sources.map((s) => [s.label, s.ref.slice(0, 10)]), [['Epoch 1 close, block 9,297,631', '0xa57407ac']]);
    // the ids keep the names they were published with, so links to them still land on them
    for (const [id, epoch, date, block] of [
        ['first-v1-claims', 1, '2026-10-18T18:09:48Z', '9,312,031'],
        ['last-v1-claims', 2, '2026-10-25T18:26:00Z', '9,362,431'],
        ['last-v1-claims-epoch-3', 3, '2026-11-01T18:26:00Z', '9,412,831'],
    ]) {
        const event = byId(id);
        assert.equal(event.status, 'done', id);
        assert.equal(event.title, `Epoch ${epoch} finalized without a payout root`, id);
        assert.equal(event.date, date, id);
        assert.equal(event.approximate, undefined, `${id}: a block time, exact`);
        assert.match(event.detail, /had no version 1 claims/, id);
        assert.deepEqual(event.sources.map((s) => s.label), [`Epoch ${epoch} finalized, block ${block}`], id);
        assert.match(event.sources[0].ref, /^0x[0-9a-f]{64}$/, id);
    }
    // epoch 2 was not closed in its window: its emission was deferred, and epoch 3's close took it in
    const epoch3 = byId('epoch-3-begins-on-v1');
    assert.match(epoch3.detail, /Epoch 2 was not closed in its 120-block close window, so its emission was deferred to epoch 3's close\.$/);
    assert.deepEqual(epoch3.sources.map((s) => s.label), ["Epoch 3's first block, 9,348,028", "Epoch 2's emission deferred, block 9,348,551"]);
    assert.match(byId('last-v1-claims').detail, /epoch 3's 4,132\.72 α covers about two weeks/);
});

test('the settlement v2 rollout as it happened: from October 22 to 25, with the contracts on October 23', () => {
    const byId = (id) => events.find((e) => e.id === id);
    const checks = byId('settlement-v2-release-checks');
    assert.equal(checks.status, 'done');
    assert.equal(checks.title, 'Settlement v2 release not ready by October 16');
    assert.match(checks.detail, /The release went out from October 22 to 25, too late for epoch 3\.$/);
    // in the order they happened, each a day or a time that the page shows exactly
    const steps = [
        ['v2-validator-starts', '2026-10-22T20:48:38Z', 'Thu Oct 22 · 20:48 UTC'],
        ['v2-contracts-deployed', '2026-10-23T05:55:24Z/2026-10-23T07:51:36Z', 'Fri Oct 23 · 05:55–07:51 UTC'],
        ['validator-adopts-v2-settings', '2026-10-23T09:03:57Z', 'Fri Oct 23 · 09:03 UTC'],
        ['operator-services-updated', '2026-10-23/2026-10-24', 'Fri Oct 23 – Sat Oct 24'],
        ['connect-service-updated', '2026-10-24', 'Sat Oct 24'],
        ['operator-switches-to-v2-contracts', '2026-10-25', 'Sun Oct 25'],
    ];
    for (const [id, date, shown] of steps) {
        const event = byId(id);
        assert.equal(event.status, 'done', id);
        assert.equal(event.date, date, id);
        assert.equal(whenText(parseWhen(event.date), { approxStart: isApproximate(event) }), shown, id);
    }
    const ids = events.map((e) => e.id);
    assert.deepEqual(steps.map(([id]) => ids.indexOf(id)), steps.map(([id]) => ids.indexOf(id)).slice().sort((a, b) => a - b));
    // the deployment's six steps, each with its transaction, and its three contracts and the claim batcher
    const contracts = byId('v2-contracts-deployed');
    assert.equal(contracts.key, true);
    assert.match(contracts.detail, /^Six deployment steps on Bittensor's EVM, in blocks 9,344,278 to 9,344,859, /);
    assert.ok(contracts.sources.every((s) => s.ref !== ''), 'every source of the deployment exists');
    assert.deepEqual(contracts.sources.filter((s) => s.kind === 'evm_tx').map((s) => s.label.replace(/, block [\d,]+$/, '')), [
        'vault2 created', 'Escrow registered', 'STSettlement2 implementation created', 'STSettlement2 created', 'vault2 linked to STSettlement2', 'Claim batcher created',
    ]);
    assert.equal(sourceRows(contracts.sources, explorers).folded.length, 6);
    // the pool registration through the governance Safe, on October 29
    const registered = byId('v2-pool-registered');
    assert.match(registered.detail, /in the v2 vault on October 29 at 03:11 UTC, before epoch 4 began,/);
    assert.deepEqual(registered.sources.map((s) => s.label), ['Registration through the governance Safe, block 9,386,659']);
    assert.match(registered.sources[0].ref, /^0x[0-9a-f]{64}$/);
});

test('the first settlement v2 claims: epoch 4\'s root finalized at 19:10 UTC on November 8', () => {
    const claims = events.find((e) => e.id === 'first-v2-claim');
    assert.equal(claims.status, 'done');
    assert.equal(claims.key, true);
    assert.equal(claims.title, 'First settlement v2 claims');
    assert.equal(claims.date, '2026-11-08T19:10:00Z/2026-11-08T19:11:48Z');
    assert.equal(whenText(parseWhen(claims.date), { approxStart: isApproximate(claims) }), 'Sun Nov 8 · 19:10–19:11 UTC');
    assert.match(claims.detail, /finalized at block 9,463,438, 14,404 blocks after its commit, and the first claims followed at block 9,463,447\.$/);
    assert.deepEqual(claims.sources.map((s) => s.label), ['First v2 root finalized, block 9,463,438', 'First v2 claims, block 9,463,447']);
    assert.ok(claims.sources.every((s) => /^0x[0-9a-f]{64}$/.test(s.ref)));
    // nothing of the plan is left
    assert.doesNotMatch(`${claims.title} ${claims.detail}`, /earliest|can finalize|can push/);
});

test('the extender amendment: the pool begins epoch 8, and the billing change is live since November 11', () => {
    // approved on November 10 (the sn whitepaper's §8.6): the extender pool starts with epoch 8's first
    // block, which is the end of epoch 7, the last epoch listed, so the list shows it after epoch 7
    const pool = events.find((e) => e.id === 'extender-pool-epoch-8');
    const epoch7 = mainnetEpochs.at(-1);
    assert.equal(epoch7.number, 7);
    assert.equal(epoch7.end.block, 9600028);
    assert.equal(pool.status, 'scheduled');
    assert.equal(pool.date, epoch7.end.time);
    assert.match(pool.detail, /^From block 9,600,028, the first of epoch 8, /);
    assert.match(pool.detail, /at most half of a pool/);
    assert.match(pool.detail, /once the signed amendment entry is published before epoch 8 starts\.$/);
    // Q7, answered on November 11 (§8.6.2, decision 16): only the part of a contract that no provider earns
    // goes to the pool, and an extender on a contract keeps its own hop share of it
    assert.match(pool.detail, /the part of each contract's traffic that no provider earns counts for extenders instead\./);
    assert.match(pool.detail, /An extender that carries a contract keeps its own share of it, as one of the contract's hops, as the subnet owner decided on November 11\./);
    assert.doesNotMatch(pool.detail, /bytes that no provider carries/);
    assert.equal(groupByEpoch(events, mainnetEpochs).find((g) => g.events.some((e) => e.id === pool.id)).id, 'after-epoch-7');
    // the signed entry and epoch 8's first block do not exist yet: their sources stay empty, so the page hides them
    assert.deepEqual(pool.sources.filter((s) => s.ref === '').map((s) => s.label), ['Signed amendment entry', "Epoch 8's first block, 9,600,028"]);
    // not a key milestone: the summary timeline ends with epoch 7 (tests/mainnet-summary.test.mjs)
    assert.equal(pool.key, undefined);

    // the billing change (§8.6.7, step 0): done, dated by its deploy on November 11, which reached the network
    // operator's services in stages from 05:43 to 11:39 UTC, so it is listed after the 00:00 UTC provider gate.
    // The id keeps the name it was published with, so links to it still land on it.
    const billing = events.find((e) => e.id === 'intra-traffic-billing-planned');
    assert.equal(billing.status, 'done');
    assert.equal(billing.date, '2026-11-11T05:43:00Z/2026-11-11T11:39:00Z');
    assert.equal(whenText(parseWhen(billing.date), { approxStart: isApproximate(billing) }), 'Wed Nov 11 · 05:43–11:39 UTC');
    assert.equal(groupByEpoch(events, mainnetEpochs).find((g) => g.events.some((e) => e.id === billing.id)).id, 'epoch-5');
    assert.equal(billing.title, 'Same-network and friends-and-family traffic now draws on the data balance');
    assert.match(billing.detail, /^Traffic between devices of one network and traffic to a provider in friends-and-family mode now draw on the sending network's data balance, as other traffic does, on the free plan or a paid one\. /);
    assert.match(billing.detail, /The billing change, approved by the subnet owner on November 10, reached the network operator's services in stages from 05:43 UTC, and all of them by 11:39 UTC\./);
    // only who pays changes: a friends-and-family provider's credit does not depend on the plan (§8.6.3)
    assert.match(billing.detail, /Friends-and-family providers are credited for it as before: paid and free traffic count alike\./);
    assert.match(billing.detail, /Contracts opened before the change are not charged\.$/);
    // nothing of the plan is left
    assert.doesNotMatch(`${billing.title} ${billing.detail}`, /\bto draw\b|\bonce the billing change deploys\b|\bplanned\b|\bwill be added\b/i);
    assert.equal(billing.key, undefined);
});

test('Pro data on each network\'s own cycle: a milestone and a notice for the subsidy\'s revenue, with SN25 rewards counted as before', () => {
    // the network operator's server release of November 11 (server d96add0d6, PRO-GRANT-CYCLE.md, "Accounting
    // notes" and "Cutover"): scheduled until it has rolled out, then done and dated by its rollout
    const cycle = events.find((e) => e.id === 'pro-grant-per-cycle');
    assert.ok(cycle, 'the milestone is listed');
    assert.equal(cycle.status, 'scheduled');
    assert.equal(cycle.date, '2026-11-11');
    assert.equal(whenText(parseWhen(cycle.date), { approxStart: isApproximate(cycle) }), 'Wed Nov 11');
    assert.equal(groupByEpoch(events, mainnetEpochs).find((g) => g.events.some((e) => e.id === cycle.id)).id, 'epoch-5');
    // after the billing change of the same morning, before epoch 5's claims
    const ids = events.map((e) => e.id);
    assert.equal(ids.indexOf(cycle.id), ids.indexOf('intra-traffic-billing-planned') + 1);
    assert.equal(cycle.key, undefined);
    // the miner guide's rule for SN25 rewards, and the notice's full text, which is on sn's main branch
    const fullText = 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-11-pro-data-per-cycle.md';
    assert.deepEqual(cycle.sources, [
        { label: 'How rewards are counted, in the miner guide', kind: 'doc', ref: '/docs/miner/rewards#how-rewards-are-counted' },
        { label: 'The full notice in the sn repo', kind: 'doc', ref: fullText },
    ]);
    assert.equal(cycle.title, "Pro data follows each network's own cycle, and the provider subsidy counts its revenue once");
    assert.match(cycle.detail, /^From the network operator's server release of November 11, a Pro network gets its full monthly data on its own monthly cycle, counted from the day its subscription started or last renewed, and each cycle's grant carries that cycle's share of the subscription's revenue\. /);
    // the subsidy counts a balance's revenue only for the settled traffic it funded, and the period's own
    // balance now holds no data, so the period's revenue counts once, through its cycle grants
    assert.match(cycle.detail, / The network operator's provider subsidy counts that revenue once, as the traffic the grant funds is settled\. /);
    // before: the 600 GiB credit carried the period's full revenue and the monthly grant a share of it, and a
    // Play renewal's window starts at the subscription's first start, which spread one period's revenue thin
    assert.match(cycle.detail, / Before, a paid period's revenue could count twice, in full through its 600 GiB credit and again as a share through the monthly grant on the 1st, and a long-running Google Play subscription counted only a share spread over the months since it began\. /);
    // the SN25 pool weighs completed work only (server model/st_provider_usage.go), as the miner guide says
    assert.match(cycle.detail, / SN25 pool rewards are counted as before: the pool is split by completed usage, and subscription payments are not an input\. /);
    const rewards = fs.readFileSync(path.join(__dirname, '../../docs/miner/rewards.md'), 'utf8');
    assert.match(rewards, /^## How rewards are counted$/m);
    assert.match(rewards, /\*\*Paid and free traffic of the same size earn the same credit\.\*\* Account balances, reservations, subscription payments and unfinished contracts are not proof of work\./);
    // past the provider earning cutoff, the subsidy only weighs the operator block points
    // (server model/operator_block_points.go); the cutoff is the timeline's own first milestone
    assert.match(cycle.detail, / For traffic since the October 6 cutoff, the provider subsidy pays no USDC and only counts toward the weekly points the network operator awards\. /);
    assert.equal(events.find((e) => e.id === 'provider-earnings-move-to-sn25').date, '2026-10-06T00:00:00Z');
    // the cutover: a network holding the calendar grant of November 1 starts its chain when that grant's month ends
    assert.match(cycle.detail, / A Pro network that holds the November 1 grant gets its first cycle grant on December 1 at 00:00 UTC, and nothing granted before the release changes\. Customers pay the same\.$/);
    // it does not say the release has rolled out, and it publishes no subsidy setting or wider plan
    assert.doesNotMatch(`${cycle.title} ${cycle.detail}`, /\bnow\b|\blive\b|since November 11|remov|\$\s?\d|\d\s?%|\bfifth\b/i);

    // the notice, one of those at the top (their order is the next test's)
    assert.equal(new Set(mainnetNotices.map((n) => n.id)).size, mainnetNotices.length);
    for (const notice of mainnetNotices) {
        assert.deepEqual(Object.keys(notice).sort(), ['date', 'id', 'link', 'paragraphs', 'title'], `${notice.id}: fields`);
        assert.match(notice.id, /^notice(?:-[a-z0-9]+)*$/, `${notice.id}: a slug that starts with notice`);
        assert.ok(!ids.includes(notice.id), `${notice.id}: a milestone's id`);
    }
    const notice = mainnetNotices.find((n) => n.id === 'notice-pro-grant-cycle');
    assert.ok(notice, 'the notice is listed');
    // dated the day of the release
    assert.equal(notice.date, 'November 11, 2026');
    assert.equal(notice.title, "Pro data moves to each network's own cycle. SN25 rewards are counted as before.");
    const [what, sn25, subsidy, effect, when] = notice.paragraphs;
    assert.equal(notice.paragraphs.length, 5);
    assert.match(what, /^With the network operator's server release of November 11, a Pro network gets its full monthly data on its own monthly cycle, counted from the day its subscription started or last renewed, instead of on the 1st of the month\. /);
    assert.match(what, / a payment no longer adds a separate 600 GiB credit\.$/);
    assert.equal(sn25, 'SN25 pool rewards are counted as before. The pool is split by completed usage, and subscription payments are not an input to it.');
    assert.match(subsidy, /^What changes is the subscription revenue counted by the network operator's provider subsidy, which for traffic since the October 6 cutoff pays no USDC and only counts toward the weekly points the network operator awards\. /);
    assert.match(subsidy, / From the release, each period's revenue counts once, through its cycle grants\.$/);
    // for providers: less where revenue counted twice, more for long-running Play, on each network's own cycle;
    // a period credited inside a running cycle adds its revenue only to the cycles after it
    assert.match(effect, /^So the subsidy counts less where revenue counted twice, as in a new subscription's first month, and more for long-running Google Play subscriptions\. /);
    assert.match(effect, / Its timing follows each network's own cycle rather than the 1st\. /);
    assert.match(effect, / A payment credited during a running cycle, such as a second subscription, adds its revenue to the cycles after it, and the part that overlaps the running cycle is not counted\.$/);
    // the milestone's cutover, in the same words
    assert.match(when, /^Nothing granted before the release changes\. A Pro network that holds the November 1 grant gets its first cycle grant on December 1 at 00:00 UTC, when that grant's month ends\. /);
    assert.match(when, / Customers pay the same, and there is nothing you need to do\.$/);
    assert.doesNotMatch(`${notice.title} ${notice.paragraphs.join(' ')}`, /\bnow\b|\blive\b|since November 11|remov|\$\s?\d|\d\s?%|\bfifth\b/i);
    // its full text is in the sn repo (sn 943d77a9, on its main branch), so the notice links to it, as the
    // milestone does
    assert.deepEqual(notice.link, { label: 'Read the full notice', href: fullText });
});

test('the extenders\' share on the contracts they can relay: a milestone and a notice, with SN25 rewards still split by completed usage', () => {
    // the network operator's server change of November 11 (server fix/extender-attribution-1111: model
    // contractExtenderInsertSql and network_extender_address_cache.go), which ships with its next release:
    // planned until it has rolled out, then done and dated by its rollout
    const share = events.find((e) => e.id === 'extender-relay-share');
    assert.ok(share, 'the milestone is listed');
    assert.equal(share.status, 'planned');
    assert.equal(share.approximate, true);
    assert.equal(share.date, '2026-11-12');
    assert.equal(whenText(parseWhen(share.date), { approxStart: isApproximate(share) }), '≈ Thu Nov 12');
    assert.equal(groupByEpoch(events, mainnetEpochs).find((g) => g.events.some((e) => e.id === share.id)).id, 'epoch-5');
    // after the Pro data milestone of November 11, before epoch 5's claims
    const ids = events.map((e) => e.id);
    assert.equal(ids.indexOf(share.id), ids.indexOf('pro-grant-per-cycle') + 1);
    assert.equal(share.key, undefined);
    const fullText = 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-11-extender-relay-share.md';
    assert.deepEqual(share.sources, [{ label: 'The full notice in the sn repo', kind: 'doc', ref: fullText }]);
    assert.equal(share.title, 'Extenders earn their share only on contracts they can relay');
    // the subnet owner's rule of November 11: an extender is one of a contract's n hops only where it relays
    assert.match(share.detail, /^With the network operator's next server release, an extender is one of a contract's hops, and earns its share of the contract's usage, only when it can have relayed the contract, as the subnet owner decided on November 11\. /);
    // the three tags that relay nothing: the extender's own client, its own network's, and a public
    // provider's, which dials the platform directly (connect EXTENDER.md J4)
    assert.match(share.detail, / three kinds come from that address without being relayed: the extender host's own connection, other devices of the extender's own network that share its address, and providers of other networks that share it while providing publicly, which always connect to the platform directly\. /);
    assert.match(share.detail, / These no longer make the extender a hop, so their providers are credited the whole of their contracts' usage, where an extender was credited a share of it\. /);
    // the ipv6 /64, as the camouflage report already decides a relay
    assert.match(share.detail, / A connection from another address of an extender's IPv6 \/64, which hosts commonly send from, now counts as relayed by it\. /);
    assert.match(share.detail, / Contracts created before the release keep their hops, and SN25 pool rewards are still split by completed usage\.$/);
    // it does not say the release has rolled out, and it gives no figure
    assert.doesNotMatch(`${share.title} ${share.detail}`, /\bnow (?:earn|credit|count)s? (?:only|in full)\b|\blive\b|since November 1[12]|\d\s?%|\$\s?\d|\bGB\b/i);

    const notice = mainnetNotices.find((n) => n.id === 'notice-extender-relay-share');
    assert.ok(notice, 'the notice is listed');
    assert.equal(notice.date, 'November 11, 2026');
    assert.equal(notice.title, "Extenders earn their share only on contracts they can relay. Providers on an extender's address are credited in full.");
    assert.equal(notice.paragraphs.length, 5);
    const [rule, tags, effect, prefix, sn25] = notice.paragraphs;
    assert.match(rule, /^With the network operator's next server release, an extender is one of a contract's hops, and earns its share of the contract's usage, only when it can have relayed the contract\. /);
    assert.match(rule, / a contract that comes through an extender counts the extender as one of its n hops, each credited 1\/n of the usage\.$/);
    assert.match(tags, /^The network operator counts a connection as relayed when it comes from an extender's address\. /);
    assert.match(tags, / the extender host's own connection, other devices of the extender's own network that share its address, and providers of other networks that share its address while providing publicly, since a public provider always connects to the platform directly\.$/);
    // who is credited what: the provider in full where a tag relayed nothing; a network's own total unchanged
    assert.match(effect, /^So a provider of another network on an extender's address is credited the whole of its contracts' usage, where the extender's network was credited a share of it, usually half\. /);
    assert.match(effect, / So is a provider serving a device that connects from an extender of the device's own network, where the device's own network was credited a share\. /);
    assert.match(effect, / Within one network, a fleet's providers on its own extender's address are credited the usage they serve, and the network's total is unchanged\. An extender host's own contracts are unchanged\.$/);
    assert.match(prefix, /^One kind of relay counts that did not: a connection from another address of an extender's IPv6 \/64\. /);
    assert.match(prefix, / On those contracts the extender is now one of the hops, beside the provider\.$/);
    assert.match(sn25, /^SN25 pool rewards are still split by completed usage, and the network operator's provider subsidy, which for traffic since the October 6 cutoff only counts toward the weekly points it awards, follows the same hops\. /);
    assert.match(sn25, / Contracts created before the release keep their hops\. There is nothing you need to do\.$/);
    assert.doesNotMatch(`${notice.title} ${notice.paragraphs.join(' ')}`, /\blive\b|since November 1[12]|\d\s?%|\$\s?\d|\bGB\b/i);
    // its full text is in the sn repo, as the milestone's is
    assert.deepEqual(notice.link, { label: 'Read the full notice', href: fullText });
});

test('the notices at the top run newest first, by the day each was posted', () => {
    // the page shows mainnetNotices in order (components/pages/Mainnet.jsx): the extenders' share, capture
    // the flag and Pro data, all of November 11, the later-posted first, then epoch 3's of October 31. The
    // data lists them in the order they were posted, the other way round, so this order is the sort's
    assert.deepEqual(mainnetNotices.map((n) => [n.id, n.date]), [
        ['notice-extender-relay-share', 'November 11, 2026'],
        ['notice-capture-the-flag', 'November 11, 2026'],
        ['notice-pro-grant-cycle', 'November 11, 2026'],
        ['notice', 'October 31, 2026'],
    ]);
    const days = mainnetNotices.map(noticeDay);
    assert.ok(days.every(Number.isFinite), 'every notice has a readable date');
    days.slice(1).forEach((day, i) => assert.ok(day <= days[i], `${mainnetNotices[i + 1].id} is newer than ${mainnetNotices[i].id}, above it`));
    // listed in posting order, they come out as the page shows them; listed in any other order, still by day
    assert.deepEqual(newestFirst([...mainnetNotices].reverse()), mainnetNotices);
    for (let turn = 1; turn < mainnetNotices.length; turn += 1) {
        const listed = [...mainnetNotices.slice(turn), ...mainnetNotices.slice(0, turn)];
        assert.deepEqual(newestFirst(listed).map(noticeDay), days, `rotated by ${turn}`);
    }
    // within a day the later-listed, the later-posted, comes first; the list itself is left as it was
    const posted = (id, date) => ({ id, date });
    const listed = [posted('a', 'October 31, 2026'), posted('b', 'November 11, 2026'), posted('c', 'November 2, 2026'), posted('d', 'November 11, 2026'), posted('e', 'December 1, 2026')];
    assert.deepEqual(newestFirst(listed).map((n) => n.id), ['e', 'd', 'b', 'c', 'a']);
    assert.deepEqual(listed.map((n) => n.id), ['a', 'b', 'c', 'd', 'e']);
    // a date that is not a real day written as "November 11, 2026" stops the build instead of taking a place
    assert.equal(noticeDay(posted('x', 'November 11, 2026')), Date.UTC(2026, 10, 11));
    for (const date of ['Nov 11, 2026', 'november 11, 2026', '2026-11-11', 'November 31, 2026', 'November 011, 2026', '11 November 2026', '']) {
        assert.ok(Number.isNaN(noticeDay(posted('x', date))), `"${date}" should not read`);
        assert.throws(() => newestFirst([posted('x', date)]), /is not a day such as "November 11, 2026"/, `"${date}"`);
    }
    // with four notices at the top, the milestones and the box name the one they point to
    const pointers = [...events.map((e) => e.detail), ...mainnetActions.steps.map((s) => s.detail)];
    for (const text of pointers) assert.doesNotMatch(text, /\bthe notice at the top\b/);
    assert.equal(pointers.filter((text) => text.includes('the epoch 3 notice at the top')).length, 7);
});

test('capture the flag from epoch 8: a notice and its deployment milestones, at the times the page projects', () => {
    // the sn repo's CAPTURETHEFLAG.md: the owner's decisions of November 11 (§12.1), the split (§2.1) and the
    // deployment plan (§11.2). Its times here are the page's projection from block numbers at 12 seconds a
    // block, so epoch 8's first block, the end of epoch 7, is about 18:25 UTC on November 27, as for the
    // extender pool (the design's measured projection puts it about four minutes later)
    const epoch7 = mainnetEpochs.at(-1);
    assert.equal(epoch7.number, 7);
    assert.equal(epoch7.end.time, '2026-11-27T18:25:00Z');
    const blocksPerEpoch = epoch7.end.block - epoch7.start.block;
    const after = (time, blocks) => new Date(Date.parse(time) + blocks * SECONDS_PER_BLOCK * 1000).toISOString().replace('.000Z', 'Z');
    const byId = (id) => events.find((e) => e.id === id);
    const ids = events.map((e) => e.id);
    const groupOf = (id) => groupByEpoch(events, mainnetEpochs).find((g) => g.events.some((e) => e.id === id)).id;
    const shown = (event) => whenText(parseWhen(event.date), { approxStart: isApproximate(event) });
    const ctf = ['capture-the-flag-presence-sampling', 'capture-the-flag-pool-registration', 'capture-the-flag-epoch-8', 'capture-the-flag-first-draw', 'capture-the-flag-first-claims'];
    // in date order among the other milestones; nothing is done yet; none is a key milestone, since the
    // summary timeline ends with epoch 7 (tests/mainnet-summary.test.mjs)
    assert.deepEqual(ctf.map((id) => ids.indexOf(id)), ctf.map((id) => ids.indexOf(id)).sort((a, b) => a - b));
    for (const id of ctf) {
        assert.ok(byId(id), `${id} is listed`);
        assert.ok(['scheduled', 'planned'].includes(byId(id).status), `${id}: ${byId(id).status}`);
        assert.equal(byId(id).key, undefined, id);
    }

    // the sampler runs by the end of epoch 6, the day epoch 7 begins, so that epoch 7 is a full shadow epoch;
    // the start moves to epoch 9 only if it is not running when epoch 8 starts
    const sampling = byId('capture-the-flag-presence-sampling');
    assert.equal(sampling.date, epoch7.start.time.slice(0, 10));
    assert.equal(shown(sampling), '≈ Fri Nov 20');
    assert.equal(groupOf(sampling.id), 'epoch-6');
    assert.equal(ids.indexOf(sampling.id), ids.indexOf('demand-deposits-priced') - 1);
    assert.ok(sampling.detail.startsWith(`Before epoch 6 ends at block ${thousands(epoch7.start.block)}, the network operator's servers start sampling every provider and extender each quarter hour`));
    assert.match(sampling.detail, / Epoch 7 then runs in full as a shadow epoch: /);
    assert.match(sampling.detail, / Capture the flag starts with epoch 8 only if the sampling is running when epoch 8 starts\.$/);

    // one timelock operation upgrades STSettlement2 and registers network operator 1's pool, 2^32 + 1, two
    // days before epoch 8; it executes in time only if it is scheduled 72 hours before epoch 8 starts
    const poolId = 2 ** 32 + 1;
    const registration = byId('capture-the-flag-pool-registration');
    assert.equal(registration.date, '2026-11-22/2026-11-25');
    assert.equal(shown(registration), '≈ Sun Nov 22 – Wed Nov 25');
    assert.equal(groupOf(registration.id), 'epoch-7');
    assert.ok(registration.detail.includes(` registers network operator 1's capture the flag pool, pool ${thousands(poolId)}, from epoch 8. `));
    const deadline = after(epoch7.end.time, -72 * 3600 / SECONDS_PER_BLOCK);
    assert.equal(deadline, '2026-11-24T18:25:00Z');
    assert.match(registration.detail, / the operation has to be scheduled by about November 24, 18:25 UTC\.$/);
    // the contracts it goes through exist, and what it creates is shown once it does
    const timelock = byId('settlement-v2-timelock').sources.find((s) => s.label === 'Timelock');
    const settlement2 = byId('v2-contracts-deployed').sources.find((s) => s.label === 'STSettlement2');
    assert.deepEqual(registration.sources.filter((s) => s.ref !== ''), [timelock, settlement2]);

    // the start: epoch 8's first block, with the extender pool, at the same projected time
    const start = byId('capture-the-flag-epoch-8');
    assert.equal(start.status, 'scheduled');
    assert.equal(start.date, epoch7.end.time);
    assert.equal(start.date, byId('extender-pool-epoch-8').date);
    assert.equal(ids.indexOf(start.id), ids.indexOf('extender-pool-epoch-8') + 1);
    assert.equal(shown(start), 'Fri Nov 27 · ≈18:25 UTC');
    assert.equal(groupOf(start.id), 'after-epoch-7');
    assert.ok(start.detail.startsWith(`From block ${thousands(epoch7.end.block)}, the first of epoch 8, `));
    const slots = 249 * (5 + 5);
    assert.ok(start.detail.includes(` Each of the 249 ISO 3166-1 countries has five provider slots and five extender slots each epoch, each worth the pool's new funding for the epoch divided by ${thousands(slots)}. `));
    assert.match(start.detail, / in that country for at least half of the epoch, and is active at its end\. /);
    assert.match(start.detail, / each winner takes its own slot and a fifth of that pot\. /);
    // the providers' share was 1,195.84 α in epoch 4: from epoch 8 the pool takes 9/10 of it while no fleet
    // is weighted (the head's 5/10 cedes to the pool only), the flag pools 1/10, and the pool 4/10 after
    const share = 119584;
    const alpha = (hundredths) => {
        const h = Math.round(hundredths);
        return `${thousands(Math.floor(h / 100))}.${String(h % 100).padStart(2, '0')} α`;
    };
    assert.deepEqual([alpha(share), alpha(share * 9 / 10), alpha(share / 10)], ['1,195.84 α', '1,076.26 α', '119.58 α']);
    assert.ok(start.detail.includes(` The provider pool gets 9/10 of the providers' share instead of all of it, ${alpha(share * 9 / 10)} instead of ${alpha(share)} at epoch 4's scale, and 4/10 once top-level fleets are weighted. `));
    assert.match(start.detail, / it takes effect once the signed amendment entry is published before epoch 8 starts\.$/);
    // the design and the notice's full text are in the sn repo; the entry and the block do not exist yet
    const notice = mainnetNotices.find((n) => n.id === 'notice-capture-the-flag');
    assert.deepEqual(start.sources.map((s) => [s.label, s.ref]), [
        ['The design, CAPTURETHEFLAG.md', 'https://github.com/urfoundation/sn/blob/main/CAPTURETHEFLAG.md'],
        ['The full notice in the sn repo', notice.link.href],
        ['Signed amendment entry', ''],
        [`Epoch 8's first block, ${thousands(epoch7.end.block)}`, ''],
    ]);

    // epoch 8 ends an epoch later; its list is committed within 600 blocks and its root within 1,200
    const draw = byId('capture-the-flag-first-draw');
    const end8 = { block: epoch7.end.block + blocksPerEpoch, time: after(epoch7.end.time, blocksPerEpoch) };
    assert.deepEqual(end8, { block: 9650428, time: '2026-12-04T18:25:00Z' });
    assert.equal(draw.date, `${end8.time}/${after(end8.time, 1200)}`);
    assert.equal(shown(draw), 'Fri Dec 4 · ≈18:25–22:25 UTC');
    assert.equal(groupOf(draw.id), 'after-epoch-7');
    assert.ok(draw.detail.startsWith(`Epoch 8 ends at block ${thousands(end8.block)}. The network operator commits its list of entries by block ${thousands(end8.block + 600)}, `));
    assert.ok(draw.detail.includes(` committed with the provider pool's by block ${thousands(end8.block + 1200)}. `));
    assert.match(draw.detail, / every slot carries forward into its country's pot, and the first winners are drawn in epoch 9\.$/);

    // the claims open about two days after the root, with the pool's; the approval is due by the end of epoch 9
    const claims = byId('capture-the-flag-first-claims');
    assert.equal(claims.date, '2026-12-07');
    assert.equal(shown(claims), '≈ Mon Dec 7');
    assert.equal(after(end8.time, blocksPerEpoch), '2026-12-11T18:25:00Z');
    assert.match(claims.detail, / and the approval by the end of epoch 9, about December 11, 18:25 UTC\. /);
    assert.match(claims.detail, / Winners are paid to the payout wallet the provider pool already uses, and claim in the same claim flow\. /);
    assert.ok(claims.detail.endsWith(` an app shows a capture the flag account as "Pool ${poolId}" and claims it like any pool.`));

    // the notice, newest at the top, says the same at the same times, and links its full text in the sn repo
    assert.equal(notice.date, 'November 11, 2026');
    assert.equal(notice.title, 'Capture the flag starts with epoch 8: ten slots in every country, beside the provider pool.');
    assert.deepEqual(notice.link, { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-11-capture-the-flag.md' });
    const text = notice.paragraphs.join(' ');
    assert.ok(text.startsWith(`From epoch 8, which starts at block ${thousands(epoch7.end.block)} around November 27, 18:25 UTC, `));
    assert.ok(text.includes(` Each of the 249 ISO 3166-1 countries has ten slots each epoch (one week), five for providers and five for extenders, and every slot is worth the same: the pool's new funding for the epoch divided by ${thousands(slots)}. `));
    assert.match(text, / when it was online, passing the network operator's checks and in that country for at least half of the epoch, and is active at its end\. /);
    // the draw's exact odds (§12.1, item 15)
    assert.match(text, / With five entries or fewer, each wins a slot; with more, each entry's chance is 5 in the number of entries\. /);
    assert.match(text, / Each winner takes its own slot and a fifth of that pot, /);
    assert.ok(text.includes(` In epoch 4 that share was ${alpha(share)}; at that scale the provider pool would get ${alpha(share * 9 / 10)} and capture the flag ${alpha(share / 10)}. Once top-level fleets are weighted, the provider pool gets 4/10. `));
    assert.match(text, / Winners are paid to the payout wallet the provider pool already uses, so there is nothing new to sign\. /);
    assert.match(text, / claims open around December 7, with its pool claims, in the same claim flow\. /);
    // plain words and no earnings promises (sn design/ctf/SEO.md §2.3): the figures are at epoch 4's scale, not a
    // forecast, beside what a reward depends on
    assert.match(text, / These figures are at epoch 4's scale, not a forecast\. Rewards are paid in alpha, whose value changes and can fall, and what a miner receives depends on its uptime, on how many others are eligible in its country and on the network's emission\. /);

    // the litepaper keeps the provider pool's "no slot to win", and puts capture the flag beside it
    const litepaper = fs.readFileSync(path.join(__dirname, '../../docs/litepaper.md'), 'utf8');
    assert.match(litepaper, /\. There is no slot to win and nothing to burn\. It is where a miner starts and earns a baseline reward\.\n\nBeside the pool, in the same tier, each operator also has a capture the flag pool from epoch 8, with ten reward slots in every country: /);
    const litepaperFlag = litepaper.split('\n').find((line) => line.startsWith('Beside the pool, in the same tier,'));
    assert.match(litepaperFlag, / The operator's miners enter it with the pool's registration and burn nothing\. /);
    assert.match(litepaperFlag, / online, passing the operator's checks and in the country for at least half of the epoch, and active at its end; /);
    assert.match(litepaperFlag, / Capture the flag takes a tenth of the providers' share\.$/);

    const avoid = /guarantee|risk-free|\breturns?\b|\byield|\bAPY\b|lottery|jackpot|\bbet\b|invest|passive income|get rich|easy money|financial freedom|quit your job|\bjobs?\b|hiring|salary|wage|\$\s?\d/i;
    for (const words of [`${notice.title} ${text}`, litepaperFlag, ...ctf.map((id) => `${byId(id).title} ${byId(id).detail}`)]) {
        assert.doesNotMatch(words, avoid);
    }
});
