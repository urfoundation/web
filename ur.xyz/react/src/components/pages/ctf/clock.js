/**
 * The countdown in the note at the top of the hub before capture the flag
 * starts (ctf/Countdown.jsx): what it shows at a moment of the visitor's
 * clock, counted to the start the snapshot gives (its prelaunch block's time,
 * model.js startNote). Pure, with no React and no copy, so the island stays
 * small and the tests (i18n/pages/ctf/ctf-countdown.test.mjs) read it as the
 * island does.
 *
 * The start is a block, so its time is a projection at 12 seconds a block
 * (lib/epoch.js) and the note says "about". The blocks left count down one
 * about every 12 seconds from that projection. The flag climbs its pole over
 * the three epochs before the start, so before the last three epochs it waits
 * at the foot and at the start it is at the top. Figures and units are the
 * page language's, through Intl (i18n/format.js; Arabic keeps Western digits).
 */
import { BLOCK_SECONDS, EPOCH_BLOCKS } from '../../../lib/epoch.js';
import { formatNumber } from '../../../i18n/format.js';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const BLOCK_MS = BLOCK_SECONDS * SECOND;
/** The epochs before the start that the flag climbs its pole over. */
export const HOIST_EPOCHS = 3;
const HOIST_MS = HOIST_EPOCHS * EPOCH_BLOCKS * BLOCK_MS;

/**
 * The countdown at `now` (ms) to `startsAt` (an ISO time): `live` once the
 * start has passed; before it the days, hours, minutes and seconds left (a
 * part second counts as a second, so it never reads zero while the start is
 * ahead), the blocks left and how far into the current one, and `hoist`, how
 * far up its pole the flag is (0 to 1).
 */
export function startClock(now, startsAt) {
    const ms = Date.parse(startsAt) - now;
    if (!(ms > 0)) return { live: true, hoist: 1 };
    const left = Math.ceil(ms / SECOND);
    const blocks = Math.ceil(ms / BLOCK_MS);
    return {
        live: false,
        days: Math.floor(left / 86_400),
        hours: Math.floor(left / 3_600) % 24,
        minutes: Math.floor(left / 60) % 60,
        seconds: left % 60,
        lastMinute: left <= 60,
        blocks,
        // ms into the block now counting down, 0 to 12,000
        intoBlock: blocks * BLOCK_MS - ms,
        hoist: Math.min(1, Math.max(0, 1 - ms / HOIST_MS)),
    };
}

/** A figure of the countdown in the page's language, two digits at least: 3 → "03". */
export const clockFigure = (n, lang) => formatNumber(n, lang, { minimumIntegerDigits: 2, useGrouping: false });

/** The blocks left in the page's language: 108723 → "108,723" (en), "108.723" (de), "108 723" (ru). */
export const blockFigure = (n, lang) => formatNumber(n, lang);

/**
 * The time left in words, roughly, for a screen reader: "15 days" from a day
 * and a half, then "20 hours" from an hour and a half, then "5 minutes" (at
 * least one), in the page's language (Intl's units, which agree with their
 * number). It reads the time left in whole minutes, so it changes at most once
 * a minute. Null once the start has passed.
 */
export function timeLeftWords(now, startsAt, lang) {
    const minutes = Math.ceil((Date.parse(startsAt) - now) / MINUTE);
    if (!(minutes > 0)) return null;
    const ms = minutes * MINUTE;
    const [value, unit] = ms >= 1.5 * DAY ? [Math.round(ms / DAY), 'day']
        : ms >= 1.5 * HOUR ? [Math.round(ms / HOUR), 'hour']
            : [minutes, 'minute'];
    return formatNumber(value, lang, { style: 'unit', unit, unitDisplay: 'long' });
}
