/**
 * The summary timeline at the top of /mainnet (MainnetSummary.jsx): the sn
 * repo's "at a glance" ribbon (mainnet/timeline.html) in this site's terms.
 * The payout epochs of data/mainnet.js are bands on one horizontal axis, each
 * as long as it lasts and settled by version 1 or by settlement v2, followed
 * by a tail out to the last key milestone; the key milestones of
 * data/mainnet-timeline.json (`key: true`) are marked on it, numbered in date
 * order; and "now" falls where the epoch clock (lib/epoch.js) puts it.
 *
 * Pure functions with no React and no browser APIs, so the static render, the
 * SPA and the node test (tests/mainnet-summary.test.mjs) share them. The model
 * holds no clock and no dates of its own: every date in it comes from the two
 * data files, and the page draws "now" only in the browser, after hydration.
 * It is written in the page's language (its copy `t`, i18n/pages/mainnet), and
 * carries the words the island draws and the way it writes "now" (`model.t`),
 * so the island needs no copy of its own.
 */

import { epochAt, epochProgress } from '../../../lib/epoch.js';
import EN from '../../../i18n/pages/mainnet/en.js';
import { interpolate } from '../../../i18n/format.js';
import { STATUS_LABEL, isApproximate, parseWhen, whenText } from './timeline.js';

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// A key milestone that is an interval of at least this long (the v2 pool
// registration window, a day) is drawn as a span across its days; anything
// shorter, and a single date, is a numbered marker at its start.
export const SPAN_MIN_MS = 12 * HOUR_MS;

// Markers hang from the axis in two lanes. A marker takes the first lane whose
// last marker is at least this much earlier: on a 320 px phone a 7-day epoch is
// about 50 px wide, so 2.5 days keep two 18 px markers in one lane apart.
export const LANES = 2;
export const LANE_GAP_MS = 2.5 * DAY_MS;

// A band shorter than this (epoch 0, one day) has no room for "Epoch 0" or
// for its days: it shows its short name ("E0") over the full one, which a
// screen reader reads, and its first day, as the sn ribbon does.
const COMPACT_MS = 2 * DAY_MS;

// how a status is drawn: as on the track below, filled when done, filled and
// ringed in progress, outlined while scheduled or planned
export const STATUS_LOOK = Object.freeze({ done: 'filled', in_progress: 'ringed', scheduled: 'outlined', planned: 'outlined' });

const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** "Oct 8": a UTC day as the summary writes it (dates.monthDay). */
const monthDay = (ms, t = EN) => {
    const d = new Date(ms);
    return interpolate(t.dates.monthDay, { month: t.dates.months[d.getUTCMonth()], date: d.getUTCDate() });
};

/** "Oct 9–16", "Oct 30 – Nov 6", or "Oct 8" for one day: the UTC days from startMs to endMs. */
export function dayRange(startMs, endMs, t = EN) {
    const a = new Date(startMs);
    const b = new Date(endMs);
    if (Math.floor(startMs / DAY_MS) === Math.floor(endMs / DAY_MS)) return monthDay(startMs, t);
    if (a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()) {
        return interpolate(t.dates.sameMonth, { month: t.dates.months[a.getUTCMonth()], start: a.getUTCDate(), end: b.getUTCDate() });
    }
    return interpolate(t.dates.twoMonths, { start: monthDay(startMs, t), end: monthDay(endMs, t) });
}

// A date without a time is the whole day: it lasts to the next midnight, and
// a marker draws it at midday.
const endOf = ({ start, end }) => {
    const last = end || start;
    return last.hasTime ? last.ms : last.ms + DAY_MS;
};
const pointOf = ({ start }) => (start.hasTime ? start.ms : start.ms + DAY_MS / 2);

/** Where ms falls: the band and how far through it, an instant before the first band at its start. */
function place(bands, ms) {
    const found = bands.findIndex((b) => ms < b.endMs);
    const band = found === -1 ? bands.length - 1 : found;
    const { startMs, endMs } = bands[band];
    return { band, at: clamp01((ms - startMs) / (endMs - startMs)) };
}

/** The parts of [startMs, endMs) in each band it crosses: { band, from, to }. */
function segments(bands, startMs, endMs) {
    return bands
        .map((b, band) => {
            const span = b.endMs - b.startMs;
            return { band, from: clamp01((startMs - b.startMs) / span), to: clamp01((endMs - b.startMs) / span) };
        })
        .filter((s) => s.to > s.from);
}

/** A status in words, as the track's pill writes it. */
const statusLabel = (status, t = EN) => t.labels.status[status] || status;

/** "Scheduled or planned": the statuses drawn one way, in the pills' order (summary.either, summary.lower). */
function lookLabel(look, statuses, t = EN) {
    const shown = Object.keys(STATUS_LABEL).filter((s) => STATUS_LOOK[s] === look && statuses.has(s));
    return shown.reduce((words, s, i) => (i ? interpolate(t.summary.either, { first: words, second: t.summary.lower[s] }) : statusLabel(s, t)), '');
}

/**
 * The summary of the timeline:
 *
 *   startMs, endMs  the axis: from the first epoch's start to the end of the
 *                   last key milestone (or of the last epoch)
 *   bands     [{ group, number, name, short, settlement, startMs, endMs,
 *               hours, days, tail }]: the epochs, then the tail after the last
 *               one; `hours` is the band's length, its share of the axis,
 *               `days` the days it runs (the tail's first day), and `group`
 *               the id of its milestones on the page
 *   markers   [{ id, n, title, status, statusLabel, look, dateTime, day,
 *               when, band, at, lane, label }]: the key milestones drawn as a
 *               point, numbered from 1 in date order; `look` is how its status
 *               is drawn (STATUS_LOOK), `at` how far through its band (0 to
 *               1), `label` its text for a screen reader
 *   spans     [{ id, title, status, statusLabel, look, dateTime, days, when,
 *               segments: [{ band, from, to }], label }]: the key milestones
 *               drawn across their days
 *   lanes     how many marker lanes are used
 *   settlements, looks  what the legend explains: [{ settlement, label }],
 *               [{ look, label }]
 *   t         the island's words (summary), and how it writes "now" (dates,
 *             labels.arrow), in the page's language
 *
 * `events` are the milestones (each with id, date, status and title, and
 * `key` on those the summary marks), `epochs` the payout epochs in order,
 * and `t` the page's copy in its language (English when left out).
 */
export function summaryModel(events, epochs, { t = EN } = {}) {
    const keyed = events
        .filter((event) => event.key === true)
        .map((event) => ({ event, when: parseWhen(event.date) }))
        .filter(({ when }) => when);

    const bands = epochs.map((epoch) => {
        const startMs = Date.parse(epoch.start.time);
        const endMs = Date.parse(epoch.end.time);
        const compact = endMs - startMs < COMPACT_MS;
        const abbr = interpolate(t.summary.epochShort, { number: epoch.number });
        return {
            group: `epoch-${epoch.number}`,
            number: epoch.number,
            name: interpolate(t.labels.epoch, { number: epoch.number }),
            short: compact ? abbr : null,
            // a week's short name, where its band is too narrow for the full one
            abbr,
            settlement: epoch.settlement,
            startMs,
            endMs,
            hours: (endMs - startMs) / HOUR_MS,
            days: compact ? monthDay(startMs, t) : dayRange(startMs, endMs, t),
            tail: false,
        };
    });
    const last = bands[bands.length - 1];
    const endMs = Math.max(last.endMs, ...keyed.map(({ when }) => endOf(when)));
    if (endMs > last.endMs) {
        // the epochs after the last one are settled as it is, so the tail is too
        bands.push({
            group: `after-epoch-${last.number}`,
            number: null,
            name: interpolate(t.labels.afterEpoch, { number: last.number }),
            short: t.summary.afterShort,
            abbr: t.summary.afterShort,
            settlement: last.settlement,
            startMs: last.endMs,
            endMs,
            hours: (endMs - last.endMs) / HOUR_MS,
            // its first day; the page draws it running on ("Oct 30 →")
            days: monthDay(last.endMs, t),
            tail: true,
        });
    }

    const markers = [];
    const spans = [];
    for (const { event, when } of keyed) {
        const approximate = isApproximate(event, when);
        const text = whenText(when, { approxStart: approximate, t });
        const status = statusLabel(event.status, t);
        const look = STATUS_LOOK[event.status] || 'outlined';
        const common = { id: event.id, title: event.title, status: event.status, statusLabel: status, look, dateTime: when.start.iso, when: text };
        if (when.end && endOf(when) - when.start.ms >= SPAN_MIN_MS) {
            spans.push({
                ...common,
                days: dayRange(when.start.ms, (when.end || when.start).ms, t),
                segments: segments(bands, when.start.ms, endOf(when)),
                label: interpolate(t.summary.span, { title: event.title, when: text, status }),
            });
            continue;
        }
        const n = markers.length + 1;
        markers.push({
            ...common,
            n,
            // the day it happens; ≈ only on a day that is itself approximate
            day: `${!when.start.hasTime && approximate ? '≈ ' : ''}${monthDay(when.start.ms, t)}`,
            ms: pointOf(when),
            ...place(bands, pointOf(when)),
            label: interpolate(t.summary.mark, { number: n, title: event.title, when: text, status }),
        });
    }

    // lanes: the first lane free for LANE_GAP_MS, else the one free longest
    const lastIn = Array(LANES).fill(-Infinity);
    for (const marker of markers) {
        let lane = lastIn.findIndex((ms) => marker.ms - ms >= LANE_GAP_MS);
        if (lane === -1) lane = lastIn.indexOf(Math.min(...lastIn));
        lastIn[lane] = marker.ms;
        marker.lane = lane + 1;
    }

    const statuses = new Set([...markers, ...spans].map((m) => m.status));
    const looks = ['filled', 'ringed', 'outlined']
        .map((look) => ({ look, label: lookLabel(look, statuses, t) }))
        .filter((look) => look.label);
    const settlements = Object.keys(t.labels.settlement)
        .filter((settlement) => bands.some((b) => b.settlement === settlement))
        .map((settlement) => ({ settlement, label: t.labels.settlement[settlement] }));

    return {
        startMs: bands[0].startMs,
        endMs,
        bands,
        markers: markers.map(({ ms, ...marker }) => marker),
        spans,
        lanes: Math.max(1, ...markers.map((m) => m.lane)),
        settlements,
        looks,
        t: {
            summary: pick(t.summary, ['title', 'figureAria', 'from', 'settledBy', 'now', 'nowAt', 'nowIn', 'bandsAria', 'markersAria', 'legendSpan', 'datesAria']),
            dates: pick(t.dates, ['weekdays', 'months', 'day']),
            labels: { arrow: t.labels.arrow },
        },
    };
}

const pick = (object, keys) => Object.fromEntries(keys.map((key) => [key, object[key]]));

/**
 * Where nowMs falls on the summary's axis, for the browser to draw:
 *
 *   pin      { band, at, epoch, progress, flip, text }: the band of the epoch
 *            the epoch clock puts nowMs in, and how far through it (past the
 *            last epoch, how far through the tail); `epoch` and `progress`
 *            are the clock's own; `flip` puts the label on the pin's left,
 *            near the axis's end; `text` is the time in UTC. Null before the
 *            axis starts and after it ends.
 *   elapsed  how much of each band has passed, 0 to 1
 *
 * Null when nowMs is not a time (the static render, before the clock starts).
 */
export function axisNow(model, nowMs) {
    if (!Number.isFinite(nowMs)) return null;
    const { bands } = model;
    if (nowMs < model.startMs) return { pin: null, elapsed: bands.map(() => 0) };
    if (nowMs >= model.endMs) return { pin: null, elapsed: bands.map(() => 1) };

    const epoch = epochAt(nowMs);
    let band = epoch ? bands.findIndex((b) => b.number === epoch.number) : -1;
    let at;
    if (band !== -1) {
        at = epochProgress(epoch, nowMs);
    } else {
        band = bands.findIndex((b) => nowMs >= b.startMs && nowMs < b.endMs);
        if (band === -1) return { pin: null, elapsed: bands.map(() => 0) };
        at = clamp01((nowMs - bands[band].startMs) / (bands[band].endMs - bands[band].startMs));
    }
    const total = bands.reduce((sum, b) => sum + b.hours, 0);
    const before = bands.slice(0, band).reduce((sum, b) => sum + b.hours, 0);
    return {
        pin: {
            band,
            at,
            epoch: epoch ? epoch.number : null,
            progress: epoch ? epochProgress(epoch, nowMs) : null,
            flip: (before + at * bands[band].hours) / total > 0.88,
            text: whenText({ start: { iso: new Date(nowMs).toISOString(), ms: nowMs, hasTime: true }, end: null }, { t: model.t || EN }),
        },
        elapsed: bands.map((_, i) => (i < band ? 1 : i === band ? at : 0)),
    };
}
