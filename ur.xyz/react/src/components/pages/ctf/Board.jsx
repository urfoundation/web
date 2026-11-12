import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CTF } from './data';
import {
    easyWins,
    gridCountries,
    localModel,
    neutralCountry,
    showsFor,
    sortsFor,
    staticSeed,
} from './model';
import { ctfCopy, formats } from './i18n';
import { BOLD, rich } from './rich';
import {
    CountryCard,
    CountryPicker,
    EasyWinsSection,
    GridCell,
    LiveBar,
    Tip,
    cellTips,
    cx,
    tipOf,
    useHere,
    useMounted,
    useNow,
    useTips,
    useViewTransition,
} from './parts';

/**
 * Board — the hub's island (ur.xyz/ctf, and /<lang>/ctf in `lang`): the live
 * bar with its stats filters, the visitor's country, Easy wins and the grid
 * of the 249 countries, from design.html.
 *
 *  - The stats filters (Flags held; not fully captured, providers or
 *    extenders) show only their countries, directly under the bar: the other
 *    sections animate out and the matching cells move up (a view transition),
 *    and tapping the filter again, or "Show all 249", reverses it. ?focus=held,
 *    np or nx opens the hub filtered (a country page's live bar links there).
 *  - The grid sorts A–Z (the default, in the language's A–Z), by biggest pot
 *    or by easiest wins, shows all, the big pots or the flags held, and finds
 *    a country by name (in the language or English) or code. Before the first
 *    draw it sorts by the providers online instead.
 *  - Easy wins is drawn again on each visit and with Shuffle; the static page's
 *    draw is the epoch's, so a build of the same data renders the same page.
 *  - The card starts on the biggest open pot (or no country before a draw) and
 *    turns to the visitor's country once GET /sn/ctf/here answers; the picker
 *    changes it.
 *
 * Its first render is the static page's, so it hydrates onto the build's HTML;
 * everything that depends on the visitor (the clock, the country, the draw)
 * comes after.
 */
export default function Board({ lang = 'en', m: model = CTF }) {
    const m = useMemo(() => localModel(model, lang), [model, lang]);
    const all = ctfCopy(m.lang);
    const t = all.board;
    const f = formats(m.lang);
    const [rootRef, transition] = useViewTransition();
    const now = useNow();
    const mounted = useMounted();
    const tips = useTips();
    const here = useHere(m);
    const [picked, setPicked] = useState(null);
    const [focus, setFocus] = useState(null);
    const [sort, setSort] = useState('az');
    const [show, setShow] = useState('all');
    const [q, setQ] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [featExpanded, setFeatExpanded] = useState(null);
    const [seed, setSeed] = useState(() => staticSeed(m));

    // a new draw for each visit, and ?focus= from a country page's live bar
    useEffect(() => {
        setSeed(Math.floor(Math.random() * 0xffffffff));
        const asked = new URLSearchParams(window.location.search).get('focus');
        if (m.drawn && ['held', 'np', 'nx'].includes(asked)) setFocus(asked);
    }, [m]);

    const onFocus = useCallback((arg) => transition(() => {
        setFocus((cur) => (arg && cur !== arg ? arg : null));
        tips.api.clear();
        setExpanded(null);
        setFeatExpanded(null);
    }), [transition, tips.api]);
    const onExpand = useCallback((code) => transition(() => {
        setExpanded((cur) => (cur === code ? null : code));
        tips.api.clear();
    }), [transition, tips.api]);
    const onFeatExpand = useCallback((code) => transition(() => {
        setFeatExpanded((cur) => (cur === code ? null : code));
        tips.api.clear();
    }), [transition, tips.api]);

    const cells = useMemo(() => gridCountries(m, { sort, show, q, focus }), [m, sort, show, q, focus]);
    const picks = useMemo(() => easyWins(m, seed), [m, seed]);

    const viewer = picked || here;
    const card = viewer ? m.byCode.get(viewer) : neutralCountry(m);
    const cardLabel = viewer
        ? (picked ? all.card.choice : all.card.here)
        : card ? all.card.biggest : all.card.ten;

    const sorts = sortsFor(m);
    const shows = showsFor(m);
    const focusTitle = {
        held: () => f.count(t.focusHeld, m.totals.flagsHeld),
        np: () => f.count(t.focusP, m.totals.openP),
        nx: () => f.count(t.focusX, m.totals.openX),
    }[focus]?.();
    const focusNote = { held: t.noteHeld, np: t.noteP, nx: t.noteX }[focus];

    return (
        <div className="ctf-board" ref={rootRef}>
            <LiveBar m={m} now={now} mounted={mounted} focus={focus} onFocus={onFocus} />

            {!focus && (
                <CountryCard
                    m={m}
                    c={card}
                    label={cardLabel}
                    hubLink
                    tips={tips}
                    picker={<CountryPicker m={m} mounted={mounted} onPick={setPicked} />}
                />
            )}

            {!focus && picks.length > 0 && (
                <EasyWinsSection
                    m={m}
                    picks={picks}
                    title={all.easy.title}
                    mounted={mounted}
                    tips={tips}
                    expanded={featExpanded}
                    onExpand={onFeatExpand}
                    onShuffle={() => { setSeed(Math.floor(Math.random() * 0xffffffff)); tips.api.clear(); }}
                />
            )}

            <section className={cx('ctf-gsec', focus && 'ctf-focused')} aria-labelledby="ctf-grid-h">
                {!focus && (
                    <div className="ctf-ghead">
                        <div className="ctf-sec-title"><div className="ctf-label">{t.everyFlag}</div><h2 id="ctf-grid-h" className="ctf-h2">{t.all}</h2></div>
                        <div className="ctf-controls">
                            <div className="ctf-segs">
                                <div className="ctf-seg" role="group" aria-label={t.sortAria}>
                                    {sorts.map(([key, label]) => <button key={key} type="button" aria-pressed={sort === key} disabled={!mounted} onClick={() => setSort(key)}>{label}</button>)}
                                </div>
                                {shows.length > 0 && (
                                    <div className="ctf-seg" role="group" aria-label={t.showAria}>
                                        {shows.map(([key, label]) => <button key={key} type="button" aria-pressed={show === key} disabled={!mounted} onClick={() => setShow(key)}>{label}</button>)}
                                    </div>
                                )}
                            </div>
                            <div className="ctf-find">
                                <label htmlFor="ctf-q" className="ctf-label">{t.find}</label>
                                <input id="ctf-q" className="ctf-field ctf-search" type="search" placeholder={t.findPlaceholder} disabled={!mounted} value={q} onChange={(event) => setQ(event.target.value)} />
                            </div>
                        </div>
                        <Legend m={m} tips={tips} shown={cells.length} />
                    </div>
                )}
                {focus && (
                    <div className="ctf-fbar">
                        <div className="ctf-sec-title">
                            <div className="ctf-label ctf-label-acc">{t.from}</div>
                            <h2 id="ctf-grid-h" className="ctf-fbar-h">{focusTitle}</h2>
                            <p className="ctf-sub">{focusNote}</p>
                        </div>
                        <button type="button" className="ctf-btn ctf-btn-s" onClick={() => onFocus(null)}>{t.showAll}</button>
                    </div>
                )}
                <div className={cx('ctf-grid', focus === 'np' && 'ctf-focus-p', focus === 'nx' && 'ctf-focus-x')}>
                    {cells.map((c) => {
                        const ct = cellTips(tips, c.code);
                        return <GridCell key={c.code} m={m} c={c} mounted={mounted} tipApi={tips.api} tipHover={ct.hover} tipFocus={ct.focus} tipPin={ct.pin} expanded={expanded === c.code} onExpand={onExpand} />;
                    })}
                </div>
                {cells.length === 0 && <p className="ctf-empty">{rich(t.empty, { q })}</p>}
            </section>
        </div>
    );
}

/** The grid's key, as the data allows: the draw's marks after a draw, the slots and providers online before. */
function Legend({ m, tips, shown }) {
    const all = ctfCopy(m.lang);
    const t = all.legend;
    const f = formats(m.lang);
    const shownLine = (node) => rich(f.form(node, shown), { count: f.int(shown) });
    if (!m.potsKnown) {
        return (
            <div className="ctf-legend">
                <span className="ctf-li"><i className="ctf-pip" />{t.slot}</span>
                {m.presence && <span className="ctf-li">{rich(f.form(t.online, m.presence.days), { day: f.dayName(m.presence.day), count: f.int(m.presence.days) })}</span>}
                <span className="ctf-shown">{shownLine(t.shown)}</span>
            </div>
        );
    }
    if (!m.drawn) {
        return (
            <div className="ctf-legend">
                <span className="ctf-li">{rich(t.undrawn, { epoch: m.last.epoch })}</span>
                <span className="ctf-li"><span className="ctf-ribbon ctf-r-open">{t.bigPot}</span>{rich(t.waiting, { amount: f.alpha(m.threshold) })}</span>
                <span className="ctf-shown">{shownLine(t.shown)}</span>
            </div>
        );
    }
    const cell = all.cell;
    return (
        <div className="ctf-legend">
            <span className="ctf-li ctf-mob-only"><i className="ctf-m ctf-m-open">{cell.letterP}</i><i className="ctf-m ctf-m-held">{cell.letterX}</i>{t.mobile}</span>
            <span className="ctf-li"><i className="ctf-pip ctf-p" />{t.pWon}</span>
            <span className="ctf-li"><i className="ctf-pip ctf-x" />{t.xWon}</span>
            <span className="ctf-li"><i className="ctf-pip" />{t.slotOpen}</span>
            <span className="ctf-li">
                <Tip m={m} tip={tipOf(tips, 'legend-open')} pop cls="ctf-chance ctf-win" text={cell.open} label={t.openLabel}
                    body={rich(t.openBody, {}, BOLD)}
                    cta="start" />
                {all.gap}{t.openTail}
            </span>
            <span className="ctf-li">
                <Tip m={m} tip={tipOf(tips, 'legend-chance')} pop cls="ctf-chance ctf-ex" text={f.pct(0.02)} label={t.chanceLabel}
                    body={rich(t.chanceBody, {}, BOLD)}
                    after={t.chanceAfter} cta="start" />
                {all.gap}{t.chanceTail}
            </span>
            <span className="ctf-li">
                <Tip m={m} tip={tipOf(tips, 'legend-near')} pop cls="ctf-ribbon ctf-r-hot" text={cell.soClose} label={all.next.label}
                    body={rich(t.nearBody, {}, BOLD)}
                    cta="start" />
                {all.gap}{t.nearTail}
            </span>
            <span className="ctf-li"><span className="ctf-ribbon ctf-r-open">{t.bigPot}</span>{rich(t.waiting, { amount: f.alpha(m.threshold) })}</span>
            <span className="ctf-shown">{shownLine(t.shownDrawn)}</span>
        </div>
    );
}
