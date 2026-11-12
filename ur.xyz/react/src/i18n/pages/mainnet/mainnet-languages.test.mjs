// /mainnet in every language: the page's data with each language's copy
// (components/pages/mainnet/copy.js), as Mainnet.jsx and the static route
// write it. The notices run newest first in every language, in the order the
// data sorts them (data/mainnet.js newestFirst, tests/mainnet-timeline.test.mjs),
// and each is dated by the day it was posted, written in its language; the
// milestones, the box and the epochs are translated, with the data's dates,
// statuses, figures and links; and the summary's model, which the static page
// hands its island, is in the page's language. English is as it was.
//
// Usage: node --test src/i18n/pages/mainnet/mainnet-languages.test.mjs   (from react/; no network)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadPageCopy } from '../../page-copy.js';
import { mainnetActions, mainnetEpochs, mainnetNotices, noticeDay } from '../../../data/mainnet.js';
import { localizeActions, localizeEpochs, localizeEvents, localizeNotices, noticeDate } from '../../../components/pages/mainnet/copy.js';
import { epochBlocks, figure, groupByEpoch, isApproximate, parseWhen, sourceRows, whenText } from '../../../components/pages/mainnet/timeline.js';
import { axisNow, summaryModel } from '../../../components/pages/mainnet/summary.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { events, explorers } = JSON.parse(fs.readFileSync(path.join(HERE, '../../../data/mainnet-timeline.json'), 'utf8'));
const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];
const page = await loadPageCopy('mainnet');
const data = await loadPageCopy('mainnet/data');
const timeline = await loadPageCopy('mainnet/timeline');
const translated = LANGS.filter((lang) => lang !== 'en' && fs.existsSync(path.join(HERE, `${lang}.js`)));

test('English is the data\'s own words, and a notice is dated as the data dates it', () => {
    assert.deepEqual(localizeEvents(events, timeline('en')), events);
    for (const notice of localizeNotices(mainnetNotices, data('en'), page('en'))) {
        const own = mainnetNotices.find((n) => n.id === notice.id);
        assert.deepEqual({ ...notice, dateText: undefined }, { ...own, dateText: undefined });
        // the formatter writes back the very date the data gives, "November 11, 2026"
        assert.equal(notice.dateText, own.date, notice.id);
    }
    const actions = localizeActions(mainnetActions, data('en'));
    assert.deepEqual(actions.steps, mainnetActions.steps);
    assert.equal(actions.closing.replace(/\{link(\d+)\}/g, (_, n) => actions.links[n - 1].text), mainnetActions.closing.map((run) => run.text).join(''));
    assert.deepEqual(actions.links.map((link) => link.href), mainnetActions.closing.filter((run) => run.href).map((run) => run.href));
    assert.deepEqual(localizeEpochs(mainnetEpochs, data('en')), mainnetEpochs);
});

test('the notices run newest first in every language, each dated in its language by the day it was posted', () => {
    const order = mainnetNotices.map((n) => n.id);
    for (const lang of translated) {
        const t = page(lang);
        const notices = localizeNotices(mainnetNotices, data(lang), t);
        assert.deepEqual(notices.map((n) => n.id), order, `${lang}: the data's order`);
        for (const notice of notices) {
            const own = mainnetNotices.find((n) => n.id === notice.id);
            // translated, the same paragraphs, the same link
            assert.notEqual(notice.title, own.title, `${lang}: ${notice.id} title`);
            assert.equal(notice.paragraphs.length, own.paragraphs.length, `${lang}: ${notice.id} paragraphs`);
            notice.paragraphs.forEach((p, i) => assert.notEqual(p, own.paragraphs[i], `${lang}: ${notice.id} paragraph ${i}`));
            assert.equal(notice.link.href, own.link.href);
            assert.notEqual(notice.link.label, own.link.label, `${lang}: ${notice.id} link`);
            // dated from the data: the day, month and year it was posted
            const day = new Date(noticeDay(own));
            assert.equal(notice.dateText, noticeDate(own, t));
            assert.ok(notice.dateText.includes(String(day.getUTCDate())), `${lang}: ${notice.id} ${notice.dateText}`);
            assert.ok(notice.dateText.includes(String(day.getUTCFullYear())), `${lang}: ${notice.id} ${notice.dateText}`);
            assert.ok(notice.dateText.includes(t.dates.monthsLong[day.getUTCMonth()]), `${lang}: ${notice.id} ${notice.dateText}`);
        }
    }
});

test('every milestone, step and epoch is translated, with the data\'s dates, statuses and links', () => {
    for (const lang of translated) {
        const t = page(lang);
        const mine = localizeEvents(events, timeline(lang));
        mine.forEach((event, i) => {
            const own = events[i];
            assert.equal(event.id, own.id);
            for (const key of ['date', 'status', 'key', 'approximate']) assert.equal(event[key], own[key], `${lang}: ${own.id} ${key}`);
            assert.notEqual(event.title, own.title, `${lang}: ${own.id} title`);
            assert.notEqual(event.detail, own.detail, `${lang}: ${own.id} detail`);
            assert.deepEqual(event.sources.map(({ kind, ref }) => ({ kind, ref })), own.sources.map(({ kind, ref }) => ({ kind, ref })), `${lang}: ${own.id} sources`);
            // the page links the same sources, in the language's words
            const rows = sourceRows(event.sources, explorers, { t });
            const english = sourceRows(own.sources, explorers);
            assert.deepEqual([...rows.rows, ...rows.folded].map((r) => r.link.href), [...english.rows, ...english.folded].map((r) => r.link.href), `${lang}: ${own.id} links`);
        });
        // grouped as in English, under the language's names
        const groups = groupByEpoch(mine, localizeEpochs(mainnetEpochs, data(lang)), { before: data(lang).before, t });
        assert.deepEqual(groups.map((g) => g.id), groupByEpoch(events, mainnetEpochs).map((g) => g.id), lang);
        const englishTitles = groupByEpoch(events, mainnetEpochs).map((g) => g.title);
        groups.forEach((g, i) => assert.notEqual(g.title, englishTitles[i], `${lang}: ${g.id}`));
        const actions = localizeActions(mainnetActions, data(lang));
        actions.steps.forEach((step, i) => assert.notEqual(step.detail, mainnetActions.steps[i].detail, `${lang}: step ${i}`));
        assert.match(actions.closing, /\{link1\}/, `${lang}: the closing paragraph links the apps`);
        // an epoch's summary is the translation's (German keeps "Version 1" as it is)
        localizeEpochs(mainnetEpochs, data(lang)).forEach((epoch, i) => {
            assert.equal(epoch.start.block, mainnetEpochs[i].start.block);
            assert.equal(epoch.summary, data(lang).epochs[epoch.number], `${lang}: epoch ${epoch.number}`);
        });
    }
});

test('dates and blocks are written in each language, at the same UTC times, with the English figures (Spanish: Intl\'s)', () => {
    const at = (value, t, options = {}) => whenText(parseWhen(value), { ...options, t });
    for (const lang of LANGS) {
        const t = page(lang);
        // Thu Oct 8 · 18:36 UTC, its weekday and month in the language
        const one = at('2026-10-08T18:36:12Z', t);
        assert.ok(one.includes('18:36 UTC') && one.includes(t.dates.weekdays[4]) && one.includes(t.dates.months[9]) && /\b8\b|8日/.test(one), `${lang}: ${one}`);
        // across days, with the arrow that points on in the language
        const two = at('2026-10-21T18:09:00Z/2026-10-22T18:09:00Z', t, { approxStart: true });
        assert.ok(two.includes(` ${t.labels.arrow} `) && two.includes('≈18:09') && two.endsWith(' UTC'), `${lang}: ${two}`);
        // a planned milestone keeps its ≈
        const planned = events.find((e) => e.id === 'capture-the-flag-epoch-8');
        assert.match(whenText(parseWhen(planned.date), { approxStart: isApproximate(planned), t }), /≈18:25 UTC$/, lang);
        // 50,400 blocks and 7 days, and epoch 0's 7,200 blocks and 1 day, each as the language writes figures
        const week = epochBlocks(mainnetEpochs[1], { lang, t });
        assert.ok([9247228, 9297628, 50400, 7].every((n) => week.includes(figure(n, lang))), `${lang}: ${week}`);
        const day = epochBlocks(mainnetEpochs[0], { lang, t });
        assert.ok([9240028, 9247228, 7200, 1].every((n) => day.includes(figure(n, lang))), `${lang}: ${day}`);
    }
    assert.equal(epochBlocks(mainnetEpochs[1], { lang: 'ru', t: page('ru') }), 'Блоки 9,247,228 → 9,297,628 · 50,400 блоков, 7 дней');
    assert.equal(epochBlocks(mainnetEpochs[1], { lang: 'de', t: page('de') }), 'Blöcke 9,247,228 → 9,297,628 · 50,400 Blöcke, 7 Tage');
    // Spanish writes figures as Intl does for the page, as on /ctf and its other pages
    assert.equal(epochBlocks(mainnetEpochs[1], { lang: 'es', t: page('es') }), 'Bloques 9.247.228 → 9.297.628 · 50.400 bloques, 7 días');
    assert.equal(epochBlocks(mainnetEpochs[0], { lang: 'es', t: page('es') }), 'Bloques 9.240.028 → 9.247.228 · 7200 bloques, 1 día');
    assert.equal(epochBlocks(mainnetEpochs[0], { lang: 'ar', t: page('ar') }), 'الكتل 9,240,028 ← 9,247,228 · 7,200 كتلة، 1 يوم');
    assert.equal(at('2026-10-08T18:36:12Z', page('de')), 'Do., 8. Okt. · 18:36 UTC');
    assert.equal(at('2026-10-08T18:36:12Z', page('zh')), '10月8日周四 · 18:36 UTC');
});

test('the summary\'s model is in the page\'s language, and its island writes "now" in it', () => {
    const english = summaryModel(events, mainnetEpochs);
    for (const lang of translated) {
        const t = page(lang);
        const model = summaryModel(localizeEvents(events, timeline(lang)), mainnetEpochs, { t });
        // the same axis, bands and markers as English, in the language's words
        assert.deepEqual(model.bands.map((b) => [b.group, b.startMs, b.endMs]), english.bands.map((b) => [b.group, b.startMs, b.endMs]), lang);
        assert.deepEqual(model.markers.map((m) => [m.id, m.n, m.band, m.at, m.lane]), english.markers.map((m) => [m.id, m.n, m.band, m.at, m.lane]), lang);
        model.markers.forEach((m, i) => {
            assert.notEqual(m.title, english.markers[i].title, `${lang}: ${m.id}`);
            assert.ok(m.label.startsWith(`${m.n}. ${m.title}`), `${lang}: ${m.label}`);
            assert.ok(m.label.includes(t.labels.status[m.status]), `${lang}: ${m.label}`);
        });
        model.bands.forEach((b, i) => assert.notEqual(b.name, english.bands[i].name, `${lang}: ${b.group}`));
        assert.equal(model.t.summary.title, t.summary.title);
        assert.deepEqual(JSON.parse(JSON.stringify(model)), model, `${lang}: plain data, for the island`);
        // "now", as the island draws it after hydration
        const now = axisNow(model, Date.UTC(2026, 9, 15, 5, 6, 36));
        assert.ok(now.pin.text.includes('05:06 UTC') && now.pin.text.includes(t.dates.months[9]), `${lang}: ${now.pin.text}`);
    }
});
