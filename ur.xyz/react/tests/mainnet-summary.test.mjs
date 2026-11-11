// The summary timeline under the /mainnet title
// (src/components/pages/mainnet/summary.js): how the payout epochs of
// src/data/mainnet.js and the key milestones of src/data/mainnet-timeline.json
// map onto its axis, and where the epoch clock (src/lib/epoch.js) puts "now".
// The bands are the data's epochs, which must agree with the clock, then, when
// a key milestone runs past the last epoch, a tail out to it; the markers are the milestones marked
// `key`, numbered in date order, each in the band of the epoch the list below
// shows it under; "now" is drawn only in the browser, so the model has none.
//
// Usage: node --test tests/mainnet-summary.test.mjs   (no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { mainnetEpochs } from '../src/data/mainnet.js';
import { epochBounds, epochEndBlock, epochStartBlock } from '../src/lib/epoch.js';
import { LANES, LANE_GAP_MS, SPAN_MIN_MS, axisNow, dayRange, summaryModel } from '../src/components/pages/mainnet/summary.js';
import { groupByEpoch, parseWhen } from '../src/components/pages/mainnet/timeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { events } = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/mainnet-timeline.json'), 'utf8'));
const model = summaryModel(events, mainnetEpochs);
const utc = (...args) => Date.UTC(...args);
const HOUR = 3_600_000;
const DAY = 86_400_000;
const byId = (id) => events.find((e) => e.id === id);
const marker = (id) => model.markers.find((m) => m.id === id);
// the instant a marker stands for: its band's start, plus `at` of the band
const instantOf = (m) => {
    const band = model.bands[m.band];
    return band.startMs + m.at * (band.endMs - band.startMs);
};
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} is not ${expected}`);

test('the bands are the data\'s epochs, which agree with the epoch clock', () => {
    const epochBands = model.bands.filter((b) => !b.tail);
    assert.deepEqual(epochBands.map((b) => b.number), mainnetEpochs.map((e) => e.number));
    for (const [index, epoch] of mainnetEpochs.entries()) {
        const band = epochBands[index];
        // the coordinator's blocks, as the clock counts them
        assert.equal(epoch.start.block, epochStartBlock(epoch.number), `epoch ${epoch.number} start block`);
        assert.equal(epoch.end.block, epochEndBlock(epoch.number), `epoch ${epoch.number} end block`);
        // a boundary's time is its block's timestamp once it exists: within ten minutes of the clock's projection
        const clock = epochBounds(epoch.number);
        assert.ok(Math.abs(band.startMs - clock.startMs) <= 600_000, `epoch ${epoch.number} starts when the clock says`);
        assert.ok(Math.abs(band.endMs - clock.endMs) <= 600_000, `epoch ${epoch.number} ends when the clock says`);
        assert.equal(band.startMs, Date.parse(epoch.start.time));
        assert.equal(band.endMs, Date.parse(epoch.end.time));
        assert.equal(band.settlement, epoch.settlement);
        close(band.hours, (band.endMs - band.startMs) / HOUR, `epoch ${epoch.number} hours`);
    }
    // epoch 0 is a day, the others a week: the bands' shares of the axis
    assert.deepEqual(model.bands.map((b) => Math.round(b.hours)), [24, 168, 168, 168, 168, 168, 168, 168]);
    assert.deepEqual(model.bands.map((b) => b.short || b.name), ['E0', 'Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5', 'Epoch 6', 'Epoch 7']);
    assert.equal(model.bands[0].name, 'Epoch 0', 'a screen reader reads the full name');
    // a week's days; epoch 0's first day, as the sn ribbon gives it
    assert.deepEqual(model.bands.map((b) => b.days), ['Oct 8', 'Oct 9–16', 'Oct 16–23', 'Oct 23–30', 'Oct 30 – Nov 6', 'Nov 6–13', 'Nov 13–20', 'Nov 20–27']);
    // version 1 settles epochs 0 to 3; settlement v2 pays from epoch 4, block 9,398,428, and every epoch after it
    assert.deepEqual(model.bands.map((b) => b.settlement), ['v1', 'v1', 'v1', 'v1', 'v2', 'v2', 'v2', 'v2']);
    assert.equal(mainnetEpochs[4].start.block, 9_398_428);
    // no tail: the last key milestone, the first priced demand deposits, begins
    // epoch 7, the last epoch listed, so the axis ends with that epoch
    assert.equal(model.bands.some((b) => b.tail), false);
    assert.equal(parseWhen(byId('demand-deposits-priced').date).start.ms, Date.parse(mainnetEpochs.at(-1).start.time));
    assert.equal(model.startMs, model.bands[0].startMs);
    assert.equal(model.endMs, Date.parse(mainnetEpochs.at(-1).end.time));
    // each band is one of the list's groups (epoch 6 has the epoch 5 claims); and
    // each group after launch is a band, but for the
    // group after the last epoch, which is a band, the tail, exactly when it holds
    // a key milestone. The extender pool from epoch 8's first block is not key, so
    // the list shows it after epoch 7 and the axis still ends with epoch 7
    const grouped = groupByEpoch(events, mainnetEpochs);
    const groups = grouped.map((g) => g.id);
    assert.deepEqual(model.bands.map((b) => b.group).filter((g) => !groups.includes(g)), []);
    const after = `after-epoch-${mainnetEpochs.at(-1).number}`;
    for (const group of groups.filter((g) => g !== 'before-launch' && g !== after)) assert.ok(model.bands.some((b) => b.group === group), `${group} is a band`);
    const afterGroup = grouped.find((g) => g.id === after);
    assert.deepEqual(afterGroup.events.map((e) => e.id), ['extender-pool-epoch-8']);
    assert.equal(model.bands.some((b) => b.group === after), afterGroup.events.some((e) => e.key === true), `${after} is a band only for a key milestone`);
});

test('the key milestones are marked: the ones the sn summary marks, numbered in date order', () => {
    const keyed = events.filter((e) => e.key).map((e) => e.id);
    assert.deepEqual(keyed, [
        'v1-contracts-deployed', 'epoch-1-begins', 'last-usdc-payout-batch', 'v2-contracts-deployed',
        'v2-pool-registered', 'settlement-v2-active', 'first-v2-claim', 'fp2-modern-provider-gate',
        'demand-deposits-priced',
    ]);
    // the pending registration runs until epoch 4: a span; the others are numbered points
    assert.deepEqual(model.spans.map((s) => s.id), ['v2-pool-registered']);
    assert.deepEqual(model.markers.map((m) => m.id), keyed.filter((id) => id !== 'v2-pool-registered'));
    assert.deepEqual(model.markers.map((m) => m.n), [1, 2, 3, 4, 5, 6, 7, 8]);
    for (const item of [...model.markers, ...model.spans]) {
        const event = byId(item.id);
        assert.ok(event, `${item.id} is a milestone, so its link lands on it`);
        assert.equal(item.title, event.title);
        assert.equal(item.status, event.status, `${item.id}: its status, drawn as the track draws it`);
        assert.equal(item.look, { done: 'filled', in_progress: 'ringed', scheduled: 'outlined', planned: 'outlined' }[event.status]);
    }
    // a milestone not marked key is not on the summary
    assert.equal(marker('bittensor-runtime-478'), undefined);
});

test('a marker sits in the band of its date, as far through it as its date is', () => {
    const groups = groupByEpoch(events, mainnetEpochs);
    const groupOf = (id) => groups.find((g) => g.events.some((e) => e.id === id)).id;
    for (const m of model.markers) {
        // the list shows the milestone under the same epoch
        assert.equal(model.bands[m.band].group, groupOf(m.id), `${m.id}: the band of the group it is listed in`);
        // short of its band's end, but for a last key milestone that is a single instant: it ends the axis
        assert.ok(m.at >= 0 && (m.at < 1 || instantOf(m) === model.endMs), `${m.id}: at ${m.at}`);
        const when = parseWhen(byId(m.id).date);
        // a time is drawn at its start, a day at its midday, never before the axis
        const expected = Math.max(model.startMs, when.start.hasTime ? when.start.ms : when.start.ms + DAY / 2);
        assert.ok(Math.abs(instantOf(m) - expected) < 1, `${m.id}: drawn at ${new Date(instantOf(m)).toISOString()}`);
    }
    // the version 1 deployment starts 9 minutes before epoch 0: at the axis's start
    assert.deepEqual([marker('v1-contracts-deployed').band, marker('v1-contracts-deployed').at], [0, 0]);
    // epoch 1, settlement v2 and the first priced demand deposits begin their bands
    assert.deepEqual([marker('epoch-1-begins').band, marker('epoch-1-begins').at], [1, 0]);
    assert.deepEqual([marker('settlement-v2-active').band, marker('settlement-v2-active').at], [4, 0]);
    assert.deepEqual([marker('demand-deposits-priced').band, marker('demand-deposits-priced').at], [7, 0]);
    // the gate, retired, was due at 00:00 UTC on Nov 11, 4 days 5 h 35 min into epoch 5
    assert.equal(marker('fp2-modern-provider-gate').band, 5);
    close(marker('fp2-modern-provider-gate').at, (4 * 24 + 5 + 35 / 60) / (7 * 24), 'the gate');
    assert.equal(instantOf(marker('fp2-modern-provider-gate')), utc(2026, 10, 11));
    // the last USDC batch, a day, at its midday
    close(marker('last-usdc-payout-batch').at, (utc(2026, 9, 11, 12) - utc(2026, 9, 9, 18, 9)) / (7 * DAY), 'the batch');
    // the first v2 claims, from the first v2 root's finalization at 19:10 UTC on Nov 8, 2 days 45 min into epoch 5
    assert.equal(marker('first-v2-claim').band, 5);
    close(marker('first-v2-claim').at, (2 * 24 + 45 / 60) / (7 * 24), 'the first v2 claims');
    assert.equal(instantOf(marker('first-v2-claim')), utc(2026, 10, 8, 19, 10));
    // the v2 contracts, deployed from 05:55 UTC on Oct 23, near the end of epoch 2
    assert.equal(marker('v2-contracts-deployed').band, 2);
    assert.equal(instantOf(marker('v2-contracts-deployed')), utc(2026, 9, 23, 5, 55, 24));
    // the pending registration, from the October 24 reading to a minute before epoch 4
    const pending = model.spans[0];
    assert.equal(pending.segments.length, 1);
    assert.equal(pending.segments[0].band, 3);
    const epoch3 = model.bands[3];
    close(pending.segments[0].from, (utc(2026, 9, 24, 16, 40) - epoch3.startMs) / (epoch3.endMs - epoch3.startMs), 'pending from');
    close(pending.segments[0].to, (utc(2026, 9, 30, 18, 24) - epoch3.startMs) / (epoch3.endMs - epoch3.startMs), 'pending to');
});

test('markers in one lane are far enough apart never to overlap', () => {
    assert.ok(model.lanes >= 1 && model.lanes <= LANES);
    assert.equal(model.lanes, Math.max(...model.markers.map((m) => m.lane)));
    for (let lane = 1; lane <= LANES; lane++) {
        const times = model.markers.filter((m) => m.lane === lane).map(instantOf);
        for (let i = 1; i < times.length; i++) {
            assert.ok(times[i] - times[i - 1] >= LANE_GAP_MS, `lane ${lane}: markers ${(times[i] - times[i - 1]) / DAY} days apart`);
        }
    }
    // the first payout epoch, 1 day after the deployment, drops to the second lane
    assert.equal(marker('v1-contracts-deployed').lane, 1);
    assert.equal(marker('epoch-1-begins').lane, 2);
    // and so does the gate, 2 days 4 h 50 min after the first v2 claims
    assert.equal(marker('first-v2-claim').lane, 1);
    assert.equal(marker('fp2-modern-provider-gate').lane, 2);
    // the priced deposits, 12 days after the first v2 claim, are back in the first lane
    assert.equal(marker('demand-deposits-priced').lane, 1);
});

test('the text: what a screen reader reads, the key dates\' days and the legend', () => {
    assert.equal(marker('fp2-modern-provider-gate').label, '7. Modern provider gate retired: modern providers are drawn first, Wed Nov 11 · 00:00 UTC, Done');
    assert.equal(marker('v2-contracts-deployed').label, '4. Settlement v2 contracts deployed, Fri Oct 23 · 05:55–07:51 UTC, Done');
    assert.equal(marker('first-v2-claim').label, '6. First settlement v2 claims, Sun Nov 8 · 19:10–19:11 UTC, Done');
    assert.equal(marker('v1-contracts-deployed').label, '1. Version 1 contracts deployed, Thu Oct 8 · 17:59–18:16 UTC, Done');
    assert.equal(marker('settlement-v2-active').label, '5. Settlement v2 active: epoch 4 begins, Fri Oct 30 · ≈18:25 UTC, Done');
    assert.equal(marker('demand-deposits-priced').label, '8. Signed price goes live: demand deposits from epoch 7, Fri Nov 20 · ≈18:25 UTC, Scheduled');
    assert.deepEqual(model.markers.map((m) => m.day), ['Oct 8', 'Oct 9', 'Oct 11', 'Oct 23', 'Oct 30', 'Nov 8', 'Nov 11', 'Nov 20']);
    assert.deepEqual(model.markers.map((m) => m.dateTime), model.markers.map((m) => byId(m.id).date.split('/')[0]));
    const registration = model.spans[0];
    assert.equal(registration.days, 'Oct 24–30');
    assert.equal(registration.label, 'Settlement v2 pool registered, Sat Oct 24 · ≈16:40 → Fri Oct 30 · ≈18:24 UTC, Done');
    assert.deepEqual(model.settlements, [{ settlement: 'v1', label: 'Version 1' }, { settlement: 'v2', label: 'Settlement v2' }]);
    // every key milestone but the priced deposits is done, and those are scheduled
    assert.deepEqual(model.looks, [{ look: 'filled', label: 'Done' }, { look: 'outlined', label: 'Scheduled' }]);
    // the model is plain data, for the static page to hand to its island
    assert.deepEqual(JSON.parse(JSON.stringify(model)), model);
});

test('now: none until the browser\'s clock runs, then where the epoch clock puts it', () => {
    // the static render and the first render after hydration: nothing to draw
    assert.equal(axisNow(model, null), null);
    assert.equal(axisNow(model, NaN), null);

    // block 9,286,515, 2026-10-15 05:06:36 UTC: epoch 1, as tests/epoch.test.mjs reads it
    const now = axisNow(model, utc(2026, 9, 15, 5, 6, 36));
    assert.equal(now.pin.band, 1);
    assert.equal(now.pin.epoch, 1);
    assert.ok(Math.abs(now.pin.at - (9_286_515 - 9_247_228) / 50_400) < 1e-4);
    assert.equal(now.pin.progress, now.pin.at);
    assert.equal(now.pin.text, 'Thu Oct 15 · 05:06 UTC');
    assert.equal(now.pin.flip, false);
    assert.deepEqual(now.elapsed, [1, now.pin.at, 0, 0, 0, 0, 0, 0]);

    // epoch 3's first second: the start of its band
    const three = axisNow(model, utc(2026, 9, 23, 18, 9));
    assert.deepEqual([three.pin.band, three.pin.at, three.pin.epoch], [3, 0, 3]);
    assert.deepEqual(three.elapsed, [1, 1, 1, 0, 0, 0, 0, 0]);

    // epoch 5, a band now, placed as far through it as the clock says
    const clock5 = epochBounds(5);
    const five = axisNow(model, utc(2026, 10, 7));
    assert.deepEqual([five.pin.band, five.pin.epoch], [5, 5]);
    close(five.pin.at, (utc(2026, 10, 7) - clock5.startMs) / (clock5.endMs - clock5.startMs), 'epoch 5');
    assert.equal(five.pin.progress, five.pin.at);
    assert.equal(five.pin.flip, false);
    // the label goes to the left past 88% of the axis, 1,056 of its 1,200 hours: a day into epoch 7
    const early = axisNow(model, utc(2026, 10, 21));
    assert.deepEqual([early.pin.band, early.pin.epoch, early.pin.flip], [7, 7, false]);
    const late = axisNow(model, utc(2026, 10, 25));
    assert.deepEqual([late.pin.band, late.pin.epoch, late.pin.flip], [7, 7, true]);

    // off the axis: no pin, and the bands all ahead or, from epoch 7's end on, all past
    assert.deepEqual(axisNow(model, utc(2026, 9, 8, 12)), { pin: null, elapsed: [0, 0, 0, 0, 0, 0, 0, 0] });
    assert.deepEqual(axisNow(model, model.endMs), { pin: null, elapsed: [1, 1, 1, 1, 1, 1, 1, 1] });
});

test('a key milestone past the last epoch draws a tail out to it', () => {
    const last = mainnetEpochs.at(-1);
    const later = { id: 'later', date: '2026-12-01T00:00:00Z', status: 'planned', title: 'Later', key: true };
    const m = summaryModel([...events, later], mainnetEpochs);
    const tail = m.bands.at(-1);
    assert.equal(tail.tail, true);
    assert.deepEqual([tail.name, tail.short, tail.settlement, tail.days], [`After epoch ${last.number}`, 'After', last.settlement, 'Nov 27']);
    // from the last epoch's end, Nov 27 18:25 UTC, to the milestone at Dec 1 00:00 UTC: 3 days 5 h 35 min
    assert.equal(tail.startMs, Date.parse(last.end.time));
    assert.equal(tail.endMs, utc(2026, 11, 1));
    close(tail.hours, 3 * 24 + 5 + 35 / 60, 'tail hours');
    assert.equal(m.endMs, tail.endMs);
    // the last key milestone, a single instant, ends the tail and the axis
    const mark = m.markers.find((x) => x.id === 'later');
    assert.deepEqual([mark.band, mark.at], [m.bands.length - 1, 1]);
    // past the last epoch the clock's epoch has no band: "now" is placed by the tail's own span
    const pin = axisNow(m, utc(2026, 10, 29)).pin;
    assert.deepEqual([pin.band, pin.epoch], [m.bands.length - 1, 8]);
    close(pin.at, (utc(2026, 10, 29) - tail.startMs) / (tail.endMs - tail.startMs), 'in the tail');
    assert.equal(pin.flip, true);
});

test('a key interval of half a day or more is a span, cut at the bands it crosses; anything else a marker', () => {
    const fixture = [
        { id: 'a', date: '2026-10-09T20:00:00Z/2026-10-09T23:00:00Z', status: 'done', title: 'A short interval', key: true },
        { id: 'b', date: '2026-10-15T18:09:00Z/2026-10-17T18:09:00Z', status: 'planned', title: 'Across a boundary', key: true },
        { id: 'c', date: '2026-10-18/2026-10-19', status: 'scheduled', title: 'Two days', key: true },
        { id: 'd', date: '2026-10-20', status: 'in_progress', title: 'A day', key: true },
        { id: 'e', date: '2026-10-21T00:00:00Z', status: 'done', title: 'Not key' },
        { id: 'f', date: 'not a date', status: 'done', title: 'Unreadable', key: true },
    ];
    const m = summaryModel(fixture, mainnetEpochs);
    assert.deepEqual(m.markers.map((x) => [x.id, x.n]), [['a', 1], ['d', 2]]);
    assert.deepEqual(m.spans.map((x) => x.id), ['b', 'c']);
    assert.ok(3 * HOUR < SPAN_MIN_MS && SPAN_MIN_MS <= DAY);
    // a span across epochs 1 and 2: the last day of one, the first of the other
    const [b, c] = m.spans;
    assert.deepEqual(b.segments.map((s) => s.band), [1, 2]);
    close(b.segments[0].from, 6 / 7, 'b from');
    close(b.segments[0].to, 1, 'b to');
    close(b.segments[1].from, 0, 'b2 from');
    close(b.segments[1].to, 1 / 7, 'b2 to');
    // days run to the end of the last one
    assert.equal(c.days, 'Oct 18–19');
    close(c.segments[0].to, (utc(2026, 9, 20) - utc(2026, 9, 16, 18, 9)) / (7 * DAY), 'c to');
    // no milestone runs past epoch 7: no tail
    assert.equal(m.bands.some((x) => x.tail), false);
    assert.equal(m.endMs, Date.parse(mainnetEpochs.at(-1).end.time));
    // a milestone in progress is drawn filled and ringed
    assert.deepEqual(m.looks.map((x) => x.look), ['filled', 'ringed', 'outlined']);
    assert.deepEqual(m.looks.map((x) => x.label), ['Done', 'In progress', 'Scheduled or planned']);
});

test('days are written in UTC', () => {
    assert.equal(dayRange(utc(2026, 9, 9, 18, 9), utc(2026, 9, 16, 18, 9)), 'Oct 9–16');
    assert.equal(dayRange(utc(2026, 9, 30, 18, 9), utc(2026, 10, 6, 18, 9)), 'Oct 30 – Nov 6');
    assert.equal(dayRange(utc(2026, 9, 8, 18, 8), utc(2026, 9, 8, 23, 59)), 'Oct 8');
    assert.equal(dayRange(utc(2026, 11, 30), utc(2027, 0, 2)), 'Dec 30 – Jan 2');
    // an instant written with an offset is on its UTC day
    assert.equal(dayRange(Date.parse('2026-10-21T23:30:00-02:00'), Date.parse('2026-10-22T23:30:00Z')), 'Oct 22');
});
