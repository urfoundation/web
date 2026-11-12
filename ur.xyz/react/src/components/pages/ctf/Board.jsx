import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CTF } from './data';
import {
    alpha,
    dayName,
    easyWins,
    gridCountries,
    neutralCountry,
    showsFor,
    sortsFor,
    staticSeed,
} from './model';
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
 * Board — the hub's island (ur.xyz/ctf): the live bar with its stats filters,
 * the visitor's country, Easy wins and the grid of the 249 countries, from
 * design.html.
 *
 *  - The stats filters (Flags held; not fully captured, providers or
 *    extenders) show only their countries, directly under the bar: the other
 *    sections animate out and the matching cells move up (a view transition),
 *    and tapping the filter again, or "Show all 249", reverses it. ?focus=held,
 *    np or nx opens the hub filtered (a country page's live bar links there).
 *  - The grid sorts A–Z (the default), by biggest pot or by easiest wins, shows
 *    all, the big pots or the flags held, and finds a country by name or code.
 *    Before the first draw it sorts by the providers online instead.
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
export default function Board({ m = CTF }) {
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
        ? (picked ? 'Your choice' : 'Your country · from your connection')
        : card ? 'Biggest open pot this epoch' : 'Ten slots in every country';

    const sorts = sortsFor(m);
    const shows = showsFor(m);
    const focusTitle = { held: `${m.totals.flagsHeld} flags held`, np: `${m.totals.openP} countries with providers not fully captured`, nx: `${m.totals.openX} countries with extenders not fully captured` }[focus];
    const focusNote = {
        held: 'Every provider slot and every extender slot was won last epoch. A newcomer needs the draw, and each cell shows the chance to win.',
        np: 'At least one provider slot went unclaimed last epoch. A new provider who stays online there for half the epoch wins by default. Biggest pots first, provider and extender together, and A–Z among pots within 0.1 α.',
        nx: 'At least one extender slot went unclaimed last epoch. A new extender who stays online there for half the epoch wins by default. Biggest pots first, provider and extender together, and A–Z among pots within 0.1 α.',
    }[focus];

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
                    title="Big pots waiting this epoch"
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
                        <div className="ctf-sec-title"><div className="ctf-label">Every flag</div><h2 id="ctf-grid-h" className="ctf-h2">All 249 countries</h2></div>
                        <div className="ctf-controls">
                            <div className="ctf-segs">
                                <div className="ctf-seg" role="group" aria-label="Sort">
                                    {sorts.map(([key, label]) => <button key={key} type="button" aria-pressed={sort === key} disabled={!mounted} onClick={() => setSort(key)}>{label}</button>)}
                                </div>
                                {shows.length > 0 && (
                                    <div className="ctf-seg" role="group" aria-label="Show">
                                        {shows.map(([key, label]) => <button key={key} type="button" aria-pressed={show === key} disabled={!mounted} onClick={() => setShow(key)}>{label}</button>)}
                                    </div>
                                )}
                            </div>
                            <div className="ctf-find">
                                <label htmlFor="ctf-q" className="ctf-label">Find</label>
                                <input id="ctf-q" className="ctf-field ctf-search" type="search" placeholder="Country or code" disabled={!mounted} value={q} onChange={(event) => setQ(event.target.value)} />
                            </div>
                        </div>
                        <Legend m={m} tips={tips} shown={cells.length} />
                    </div>
                )}
                {focus && (
                    <div className="ctf-fbar">
                        <div className="ctf-sec-title">
                            <div className="ctf-label ctf-label-acc">From the stats above</div>
                            <h2 id="ctf-grid-h" className="ctf-fbar-h">{focusTitle}</h2>
                            <p className="ctf-sub">{focusNote}</p>
                        </div>
                        <button type="button" className="ctf-btn ctf-btn-s" onClick={() => onFocus(null)}>Show all 249</button>
                    </div>
                )}
                <div className={cx('ctf-grid', focus === 'np' && 'ctf-focus-p', focus === 'nx' && 'ctf-focus-x')}>
                    {cells.map((c, i) => {
                        const t = cellTips(tips, c.code);
                        return <GridCell key={c.code} m={m} c={c} i={i} mounted={mounted} tipApi={tips.api} tipHover={t.hover} tipFocus={t.focus} tipPin={t.pin} expanded={expanded === c.code} onExpand={onExpand} />;
                    })}
                </div>
                {cells.length === 0 && <p className="ctf-empty">No country matches “{q}”.</p>}
            </section>
        </div>
    );
}

/** The grid's key, as the data allows: the draw's marks after a draw, the slots and providers online before. */
function Legend({ m, tips, shown }) {
    if (!m.potsKnown) {
        return (
            <div className="ctf-legend">
                <span className="ctf-li"><i className="ctf-pip" />a slot: five for providers (P) and five for extenders (E) in each country</span>
                {m.presence && <span className="ctf-li">providers online: the network dashboard's count at the end of {dayName(m.presence.day)}, and the days of the last {m.presence.days} with any</span>}
                <span className="ctf-shown">{shown} shown</span>
            </div>
        );
    }
    if (!m.drawn) {
        return (
            <div className="ctf-legend">
                <span className="ctf-li">P providers, E extenders: each role's pot. Epoch {m.last.epoch} had no draw, so every slot carried.</span>
                <span className="ctf-li"><span className="ctf-ribbon ctf-r-open">Big pot</span>{alpha(m.threshold)} α or more waiting</span>
                <span className="ctf-shown">{shown} shown</span>
            </div>
        );
    }
    return (
        <div className="ctf-legend">
            <span className="ctf-li ctf-mob-only"><i className="ctf-m ctf-m-open">P</i><i className="ctf-m ctf-m-held">E</i>open slot, or fully captured · tap a country for its details</span>
            <span className="ctf-li"><i className="ctf-pip ctf-p" />provider won</span>
            <span className="ctf-li"><i className="ctf-pip ctf-x" />extender won</span>
            <span className="ctf-li"><i className="ctf-pip" />slot open</span>
            <span className="ctf-li">
                <Tip tip={tipOf(tips, 'legend-open')} pop cls="ctf-chance ctf-win" text="Open" label="Not fully captured"
                    body={<>A slot went unclaimed last epoch. A new provider or extender who stays online there for half the epoch <b>wins by default</b> and takes a fifth of the pot each epoch. Hover any Open chip for its role and amount.</>}
                    cta="Start mining" />
                {' '}not fully captured, a newcomer wins by default
            </span>
            <span className="ctf-li">
                <Tip tip={tipOf(tips, 'legend-chance')} pop cls="ctf-chance ctf-ex" text="2.0%" label="Chance to win"
                    body={<>Where all five of a role's slots were won, this is the estimated probability that you win that role's <b>epoch reward</b> if you launch a provider or an extender in the country and keep it online for half the epoch.</>}
                    after="Entries are last epoch's eligible units in the role, plus you." cta="Start mining" />
                {' '}chance to win where all five slots were won
            </span>
            <span className="ctf-li">
                <Tip tip={tipOf(tips, 'legend-near')} pop cls="ctf-ribbon ctf-r-hot" text="So close" label="Next step"
                    body={<>Miners were in these countries but left before half the epoch. Run a provider or an extender there for half an epoch and you take <b>a fifth of the pot</b> each epoch you stay.</>}
                    cta="Start mining" />
                {' '}a big pot, and miners there fell short last epoch
            </span>
            <span className="ctf-li"><span className="ctf-ribbon ctf-r-open">Big pot</span>{alpha(m.threshold)} α or more waiting</span>
            <span className="ctf-shown">{shown} shown · P providers, E extenders: last epoch's winners and each open role's pot</span>
        </div>
    );
}
