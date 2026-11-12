// The note at the top of the capture the flag hub before it starts, and its
// countdown (components/pages/ctf/Countdown.jsx, its props model.js startNote,
// its clock ctf/clock.js): what the build puts in the HTML and what the
// countdown shows on the visitor's clock, in every site language.
//
// - The note is there only while the snapshot is the prelaunch one, with the
//   start the snapshot gives (its block and its time), in each language's
//   formats; a snapshot of any later phase has none.
// - Its words in every language keep the English's placeholders and say
//   nothing of luck, gambling or money (beside the group's lottery test in
//   ctf-copy.test.mjs, the words the owner's request rules out: luck, win big,
//   returns, passive income).
// - The countdown: days, hours, minutes and seconds that never read zero while
//   the start is ahead, a block about every 12 seconds, the flag's height over
//   the three epochs before the start, and "live" from the start, never a
//   negative count; the time in words changes at most once a minute, in the
//   language's own units (Intl), and the figures are the language's
//   (Western digits in Arabic).
//
// Usage (from react/): node --test src/i18n/pages/ctf/ctf-countdown.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';

import { normalize } from '../../../../../scripts/ctf-import.mjs';
import { SNAPSHOT, drawnAnswer, firstAnswer } from '../../../../tests/ctf-fixtures.mjs';
import { buildModel, localModel, startNote } from '../../../components/pages/ctf/model.js';
import { BLOCK_MS, HOIST_EPOCHS, blockFigure, clockFigure, startClock, timeLeftWords } from '../../../components/pages/ctf/clock.js';
import { ctfCopy, formats } from '../../../components/pages/ctf/i18n.js';
import { EPOCH_BLOCKS } from '../../../lib/epoch.js';
import { formatNumber, interpolate } from '../../format.js';

const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// a snapshot before the start, whatever is committed now: the committed one if it is, else the pre-launch state
const PRELAUNCH = SNAPSHOT.prelaunch ? SNAPSHOT : { ...SNAPSHOT, prelaunch: { start_block: 9_600_028, starts_at: '2026-11-27T18:25:24Z' }, last_epoch: null, pending_draw: null };
const START = Date.parse(PRELAUNCH.prelaunch.starts_at);
const graphemes = (s) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;

test('the note is there only before the start, with the snapshot\'s block and time in each language\'s formats', () => {
    for (const lang of LANGS) {
        const m = localModel(buildModel(PRELAUNCH), lang);
        const f = formats(lang);
        const note = startNote(m);
        assert.ok(note, `${lang}: a note before the start`);
        assert.equal(note.lang, lang);
        assert.equal(note.first, PRELAUNCH.first_epoch);
        assert.equal(note.startsAt, PRELAUNCH.prelaunch.starts_at, 'the start is the snapshot\'s, not a second date');
        for (const part of [f.int(PRELAUNCH.prelaunch.start_block), f.dayName(PRELAUNCH.prelaunch.starts_at.slice(0, 10)), f.utcClock(PRELAUNCH.prelaunch.starts_at), String(PRELAUNCH.first_epoch)]) {
            assert.ok(note.note.includes(part), `${lang}: the note names ${part}: ${note.note}`);
        }
        assert.ok(note.live.includes(String(PRELAUNCH.first_epoch)), `${lang}: ${note.live}`);
        // once live, the sentence of before holds the note's size unseen, so it must be the longer
        assert.ok(graphemes(note.note) > graphemes(note.live) + 8, `${lang}: the sentence of before the start is the longer: ${note.note} | ${note.live}`);
        assert.equal(note.words.units.length, 4);
        for (const s of [note.note, note.live, note.words.in, note.words.blocks, note.words.go, ...note.words.units]) {
            assert.ok(s && !/\{[A-Za-z]/.test(s), `${lang}: an empty or unfilled string: ${JSON.stringify(s)}`);
        }
        assert.match(note.words.about, /\{time\}/, `${lang}: the time in words has its place`);
    }
    // the English as the owner asked for it: the epoch, the block, and the day and time, about
    assert.equal(startNote(buildModel(PRELAUNCH)).note, `Capture the flag starts with epoch 8, at block 9,600,028, about November 27, 18:25 UTC.`);
    // a snapshot from after the start leaves the note out
    for (const answer of [firstAnswer(), firstAnswer({ pending: true }), drawnAnswer(), drawnAnswer({ drawn: false })]) {
        const m = buildModel(normalize(answer, null));
        for (const lang of LANGS) assert.equal(startNote(localModel(m, lang)), null, `${m.phase} ${lang}`);
    }
});

// The words the owner's request keeps out of the note, beside the lottery words the group's copy test bans
// everywhere: luck, winning big, returns and passive income, and gambling and promises of money, in each language.
const AVOID = {
    en: /\blotter|jackpot|\bbets?\b|betting|gambl|\bluck|lucky|win big|\breturns?\b|passive income|guarantee|get rich|easy money|\binvest|\$\s?\d/i,
    ru: /лотере|джекпот|ставк|пари\b|азарт|удач|везени|везёт|доходност|пассивн\S* доход|гарант|инвест|разбогате|крупн\S* выигрыш/i,
    ar: /يانصيب|رهان|مراهن|قمار|مقامر|ميسر|(^|[\s«])(ال)?حظ(?=[\s.،»]|$)|محظوظ|عائد|دخل سلبي|مضمون|ضمان|استثمار|الثراء|الجائزة الكبرى/,
    zh: /彩票|抽奖|头奖|大奖|赌|博彩|下注|运气|幸运|手气|收益|回报|被动收入|保证|投资|致富|稳赚/,
    de: /lotter|lotto|jackpot|wette|glück|verlos|tombola|rendite|passives einkommen|garant|\binvest|reich werden|groß gewinnen|gro(ß|ss)gewinn/i,
    es: /loter[ií]a|jackpot|apuesta|azar|rifa|quiniela|suerte|rentabilidad|ingreso pasivo|garantiz|inversi|hacerse rico|gana(r)? a lo grande/i,
};
const placeholders = (s) => [...new Set([...s.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((m) => m[1]))].sort();

test('the note\'s words in every language: the English\'s keys and placeholders, and nothing of luck, gambling or money', () => {
    const en = ctfCopy('en').start;
    for (const lang of LANGS) {
        const t = ctfCopy(lang).start;
        assert.deepEqual(Object.keys(t).sort(), Object.keys(en).sort(), `${lang}: the English's keys`);
        for (const [key, s] of Object.entries(t)) {
            assert.equal(typeof s, 'string', `${lang} start.${key}`);
            assert.deepEqual(placeholders(s), placeholders(en[key]), `${lang} start.${key}: ${s}`);
            assert.ok(!AVOID[lang].test(s), `${lang} start.${key}: ${s}`);
        }
        const note = startNote(localModel(buildModel(PRELAUNCH), lang));
        for (const s of [note.note, note.live]) assert.ok(!AVOID[lang].test(s), `${lang}: ${s}`);
        if (lang !== 'en') {
            // a translation, not the English left in place
            for (const key of ['note', 'live', 'in', 'blocks', 'about']) assert.notEqual(t[key], en[key], `${lang} start.${key} is the English`);
        }
    }
});

test('the countdown: the time and blocks left on the visitor\'s clock, never zero before the start and never negative after it', () => {
    const at = (ms) => startClock(START - ms, PRELAUNCH.prelaunch.starts_at);
    const c = at(15 * DAY + 3 * HOUR + 38 * MINUTE + 9 * SECOND + 400);
    assert.deepEqual([c.days, c.hours, c.minutes, c.seconds], [15, 3, 38, 10], 'a part second counts as a second');
    assert.equal(c.live, false);
    assert.equal(c.lastMinute, false);
    assert.equal(c.blocks, Math.ceil((15 * DAY + 3 * HOUR + 38 * MINUTE + 9 * SECOND + 400) / BLOCK_MS));
    assert.ok(c.intoBlock >= 0 && c.intoBlock < BLOCK_MS);
    // the last second, the last minute, the start and after it
    assert.deepEqual(['days', 'hours', 'minutes', 'seconds'].map((k) => at(1)[k]), [0, 0, 0, 1]);
    assert.equal(at(1).blocks, 1);
    assert.equal(at(60 * SECOND).lastMinute, true);
    assert.equal(at(61 * SECOND).lastMinute, false);
    for (const ms of [0, -1, -MINUTE, -30 * DAY]) {
        const done = at(ms);
        assert.equal(done.live, true, `${ms} ms after the start`);
        assert.equal(done.hoist, 1);
        assert.equal(done.days, undefined, 'no count once it has started');
    }
    // a block about every 12 seconds: the count steps down by one at each block's end
    for (let ms = 50 * BLOCK_MS; ms > 40 * BLOCK_MS; ms -= SECOND) {
        assert.equal(at(ms).blocks, Math.ceil(ms / BLOCK_MS));
        assert.equal(at(ms).intoBlock, at(ms).blocks * BLOCK_MS - ms);
    }
    // the flag climbs over the three epochs before the start
    const climb = HOIST_EPOCHS * EPOCH_BLOCKS * BLOCK_MS;
    assert.equal(at(climb + DAY).hoist, 0, 'at the foot before the last three epochs');
    assert.equal(at(climb).hoist, 0);
    assert.ok(Math.abs(at(climb / 2).hoist - 0.5) < 1e-9);
    assert.ok(at(SECOND).hoist > 0.999999 && at(SECOND).hoist < 1);
    let last = -1;
    for (let ms = climb; ms > 0; ms -= HOUR) {
        assert.ok(at(ms).hoist >= last, 'it only climbs');
        last = at(ms).hoist;
    }
});

test('the time in words: about, in the language\'s own units, changed at most once a minute', () => {
    const words = (ms, lang = 'en') => timeLeftWords(START - ms, PRELAUNCH.prelaunch.starts_at, lang);
    assert.equal(words(15 * DAY + 3 * HOUR), '15 days');
    assert.equal(words(36 * HOUR), '2 days', 'days from a day and a half');
    assert.equal(words(36 * HOUR - MINUTE), '36 hours');
    assert.equal(words(2 * HOUR), '2 hours');
    assert.equal(words(90 * MINUTE), '2 hours', 'hours from an hour and a half');
    assert.equal(words(90 * MINUTE - SECOND), '2 hours', 'the time in whole minutes left');
    assert.equal(words(89 * MINUTE), '89 minutes');
    assert.equal(words(5 * MINUTE), '5 minutes');
    assert.equal(words(30 * SECOND), '1 minute', 'at least a minute while the start is ahead');
    assert.equal(words(1), '1 minute');
    assert.equal(words(0), null);
    assert.equal(words(-MINUTE), null);
    // Intl's units in each language, agreeing with their number
    const unit = (lang, n, u) => formatNumber(n, lang, { style: 'unit', unit: u, unitDisplay: 'long' });
    for (const lang of LANGS) {
        assert.equal(words(21 * DAY, lang), unit(lang, 21, 'day'));
        assert.equal(words(22 * HOUR, lang), unit(lang, 22, 'hour'));
        assert.equal(words(MINUTE, lang), unit(lang, 1, 'minute'));
        assert.ok(!/[٠-٩]/.test(words(15 * DAY, lang)), `${lang}: Western digits`);
    }
    assert.equal(words(21 * DAY, 'ru'), '21 день');
    assert.equal(words(5 * DAY, 'de'), '5 Tage');
    // second by second across ten minutes, it changes once a minute or less
    for (const lang of ['en', 'ru']) {
        let changes = 0;
        let before = words(2 * HOUR - 50 * MINUTE + 17 * SECOND, lang);
        for (let s = 1; s <= 600; s += 1) {
            const now = words(2 * HOUR - 50 * MINUTE + 17 * SECOND - s * SECOND, lang);
            if (now !== before) changes += 1;
            before = now;
        }
        assert.ok(changes <= 10, `${lang}: ${changes} changes in ten minutes`);
    }
    // the sentence a screen reader hears
    assert.equal(interpolate(ctfCopy('en').start.about, { time: words(15 * DAY) }), 'Starts in about 15 days.');
});

test('the countdown\'s figures are the language\'s: two digits at least, Western digits in Arabic, grouped blocks', () => {
    for (const lang of LANGS) {
        assert.equal(clockFigure(3, lang), '03');
        assert.equal(clockFigure(15, lang), '15');
        assert.equal(clockFigure(108, lang), '108', 'days past 99 keep every digit');
        assert.equal(blockFigure(108_723, lang), formatNumber(108_723, lang));
    }
    assert.equal(blockFigure(108_723, 'en'), '108,723');
    assert.equal(blockFigure(108_723, 'de'), '108.723');
    assert.equal(blockFigure(108_723, 'ar'), '108,723');
    assert.match(blockFigure(108_723, 'ru'), /^108\s723$/u);
});
