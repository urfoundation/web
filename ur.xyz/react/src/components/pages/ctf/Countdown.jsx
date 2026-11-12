import React, { Fragment, useEffect, useState } from 'react';
import { interpolate } from '../../../i18n/format.js';
import { blockFigure, clockFigure, startClock, timeLeftWords } from './clock.js';

/**
 * Countdown — the note at the top of the hub (ur.xyz/ctf, and /<lang>/ctf)
 * until capture the flag starts: when it starts, as a sentence in the static
 * HTML (its epoch, its block and the day and time, about), and a countdown to
 * it on the visitor's clock (ctf/clock.js). Its props are model.js
 * startNote's: its words come with them, so the island loads no copy and
 * stays small. The page renders it only while the snapshot is the prelaunch
 * one.
 *
 * The countdown, after hydration: a flag climbs its pole over the epochs
 * before the start (it is hoisted to its place as the island starts), the
 * days, hours, minutes and seconds roll over on split tiles, and the blocks
 * left tick down, a bar filling over each block's 12 seconds. At the start
 * the flag tops out, waves, and ten pips burst from it, five for providers
 * and five for extenders, the slots every country has; the sentence turns to
 * "live", which a screen reader hears once (a status), and the countdown's
 * place shows that it has started. Without motion (prefers-reduced-motion)
 * nothing rolls, waves, glides or bursts.
 *
 * For a screen reader the figures are hidden: it reads the sentence and the
 * time left in words ("Starts in about 15 days"), which changes at most once a
 * minute. The static render, and the first render here, show no figures (the
 * clock starts in an effect, so they hydrate exactly), and nothing of after
 * the start: what the HTML says before the start, to a reader or to anything
 * that reads it without styles, is only the start. Every part holds its place
 * whatever it shows (the blocks left keep a six-figure width), so nothing
 * under the note moves when the figures arrive or when it turns live: once
 * live, the sentence of before the start and the countdown stay in place
 * unseen. The figures and the flag follow the clock, not an edit, so the
 * visual parity test masks them (data-parity-ignore).
 */

const SECOND = 1000;
const DASHES = ['--', '--', '--', '--'];
const cx = (...names) => names.filter(Boolean).join(' ');

/**
 * The visitor's clock (ms), read as each second of the countdown turns over
 * (on the start's own beat) until `until`, once at it and no more, and again
 * when a hidden tab comes back (browsers slow a background tab's timers). Null
 * in the server render and the hydration render, so they match the HTML.
 */
function useCountdownClock(until) {
    const [now, setNow] = useState(null);
    useEffect(() => {
        let timer = 0;
        const tick = () => {
            clearTimeout(timer);
            const time = Date.now();
            setNow(time);
            if (time < until) timer = setTimeout(tick, (((until - time) % SECOND) || SECOND) + 20);
        };
        const wake = () => { if (!document.hidden) tick(); };
        tick();
        document.addEventListener('visibilitychange', wake);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', wake);
        };
    }, [until]);
    return now;
}

/**
 * One figure on a split tile, a cell per digit: a digit that changes is a new
 * element, so it rolls in (CSS) while the others stand still. Its digits read
 * left to right on the Arabic page too.
 */
function Tile({ text }) {
    return (
        <span className="ctf-start-num">
            {[...text].map((digit, i) => (
                // keyed from the right, so the ones keep their cell when the days lose a digit
                <span className="ctf-start-d" key={text.length - i}><span key={digit}>{digit}</span></span>
            ))}
        </span>
    );
}

/** The bar under the blocks left, filling over a block's 12 seconds from where the block is (fixed when it mounts, once a block). */
function BlockBar({ into }) {
    const [delay] = useState(-into);
    return <i className="ctf-start-bar" style={{ animationDelay: `${delay}ms` }} />;
}

// the ten pips that burst from the flag at the start: five providers' (blue), five extenders' (green)
const PIPS = Array.from({ length: 10 }, (_, i) => <i key={i} />);

export default function Countdown({ lang = 'en', first, startsAt, note, live: liveNote, words }) {
    const start = Date.parse(startsAt);
    const now = useCountdownClock(start);
    const c = now === null ? null : startClock(now, startsAt);
    const live = Boolean(c && c.live);
    const running = Boolean(c && !c.live);
    const figures = running ? [c.days, c.hours, c.minutes, c.seconds].map((n) => clockFigure(n, lang)) : DASHES;
    const left = running ? timeLeftWords(now, startsAt, lang) : null;
    return (
        <div
            className={cx('ctf-start', c && 'ctf-start-on')}
            data-phase={live ? 'live' : 'soon'}
            data-last-minute={running && c.lastMinute ? '' : undefined}
            style={{ '--ctf-hoist': c ? c.hoist : 0 }}
        >
            <div className="ctf-start-pole" aria-hidden="true" data-parity-ignore="">
                <i className="ctf-start-notch" />
                <i className="ctf-start-notch" />
                <span className="ctf-start-car">
                    <span className="ctf-start-flag"><b>{first}</b></span>
                    {live && <span className="ctf-start-burst">{PIPS}</span>}
                </span>
            </div>
            {/* the sentence is a status, so a screen reader hears the turn; once live, the sentence of
                before (always the longer) holds its place unseen, so the note keeps its size */}
            <p className="ctf-start-line">
                <span role="status">{live ? liveNote : note}</span>
                {live && <span className="ctf-start-ghost" aria-hidden="true">{note}</span>}
            </p>
            <div className="ctf-start-clock" aria-hidden="true" data-parity-ignore="">
                <span className="ctf-start-count">
                    <span className="ctf-label ctf-label-acc">{words.in}</span>
                    <span className="ctf-start-tiles">
                        {figures.map((text, i) => (
                            <Fragment key={i}>
                                {i > 0 && <span className="ctf-start-sep">:</span>}
                                <span className="ctf-start-unit">
                                    <Tile text={text} />
                                    <span className="ctf-start-uname">{words.units[i]}</span>
                                </span>
                            </Fragment>
                        ))}
                    </span>
                </span>
                {live && <span className="ctf-start-go"><i />{words.go}</span>}
            </div>
            <p className="ctf-start-blocks" aria-hidden="true" data-parity-ignore="">
                <span className="ctf-label">{words.blocks}</span>
                <b>≈ {running ? blockFigure(c.blocks, lang) : '–'}</b>
                <span className="ctf-start-track">{running && <BlockBar key={c.blocks} into={c.intoBlock} />}</span>
            </p>
            {left && <p className="ctf-sr">{interpolate(words.about, { time: left })}</p>}
        </div>
    );
}
