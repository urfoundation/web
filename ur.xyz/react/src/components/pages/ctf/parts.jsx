import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
    countryMessage,
    drawLine,
    findCountry,
    flagSrc,
    isCellTip,
    nextStep,
    opsLine,
    presenceSentence,
    roleDetail,
    roleLine,
    slotFigure,
    uninhabitedSentence,
} from './model';
import { ctfCopy, formats, place } from './i18n';
import { ctaLink, pagePath } from './links';
import { BOLD, rich } from './rich';

/**
 * The parts the capture the flag islands share (ctf/Board.jsx and
 * ctf/CountryIslands.jsx): the flags, the next-step tips, the live bar, a
 * country's card, an Easy wins card and a grid cell, as design.html draws
 * them, and the view transitions. Their first render is the static page's (no
 * clock, no visitor, the epoch's seed), so an island hydrates onto exactly the
 * HTML the build wrote; the clock, the visitor's country and the next-step
 * text arrive after. A control that needs the script (sorting, the filters,
 * the search, Shuffle, the picker) is disabled in the static page and enabled
 * once the island runs. Every part speaks its model's language (`m.lang`,
 * ctf/model.js localModel) and links to the pages in it. With more than one
 * network operator a role's per-operator facts (its odds, an open slot) are
 * listed by operator, and the slots are five at each (ctf/model.js).
 */

export const cx = (...names) => names.filter(Boolean).join(' ');

/** A country's flag; `delay` starts its wave out of step with the others (model.js waveDelay), as design.html does. */
export function Flag({ code, size = 's', lazy = true, delay = null }) {
    const dims = { s: [36, 27], m: [72, 54], l: [128, 96] }[size];
    if (!code) return <span className={cx('ctf-flag', `ctf-flag-${size}`, 'ctf-flag-none')} aria-hidden="true" />;
    return <img className={cx('ctf-flag', `ctf-flag-${size}`)} src={flagSrc(code)} alt="" width={dims[0]} height={dims[1]} loading={lazy ? 'lazy' : 'eager'} decoding="async" style={delay ? { animationDelay: delay } : undefined} />;
}

export function Chevron() {
    return <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

/** A role's slots as pips, the won ones filled: five, or five at each operator. */
export function Pips({ won, role, slots = 5, big = false }) {
    return (
        <span className={cx('ctf-pips', big && 'ctf-big')} aria-hidden="true">
            {Array.from({ length: slots }, (_, i) => <i key={i} className={cx('ctf-pip', won !== null && i < won && `ctf-${role}`)} />)}
        </span>
    );
}

/** A grid cell's five pips as one element (the stylesheet draws them), so the grid's 2,490 pips are not 2,490 nodes. */
export function CellPips({ won, role }) {
    return <span className={cx('ctf-cpips', `ctf-n${won || 0}`, `ctf-cp-${role}`)} aria-hidden="true" />;
}

/**
 * A change that moves the page's sections, as a view transition where the
 * browser has them (design.html): the page's parts are named only while one
 * runs (.ctf-vt on the page, and .ctf-vt-on on the document for the
 * transition's own styles), until the last of overlapping transitions ends.
 * Returns the ref to put on an element inside the page, and `transition`.
 */
export function useViewTransition() {
    const ref = useRef(null);
    const running = useRef(0);
    const transition = useCallback((mutate) => {
        const page = ref.current?.closest('.ctf-page');
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!page || reduce || !document.startViewTransition) {
            mutate();
            return;
        }
        running.current += 1;
        page.classList.add('ctf-vt');
        document.documentElement.classList.add('ctf-vt-on');
        const t = document.startViewTransition(() => flushSync(mutate));
        // a transition skipped by the next one (a quick second tap) rejects `ready`;
        // the change itself has still been made
        t.ready.catch(() => {});
        t.finished.catch(() => {}).finally(() => {
            running.current -= 1;
            if (running.current) return;
            page.classList.remove('ctf-vt');
            document.documentElement.classList.remove('ctf-vt-on');
        });
    }, []);
    return [ref, transition];
}

/** The visitor's clock, after hydration (null in the static render), ticking every 30 seconds. */
export function useNow() {
    const [now, setNow] = useState(null);
    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);
    return now;
}

export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}

/** The visitor's country from GET /sn/ctf/here at the first operator (nothing is stored), when it is one of the 249. */
export function useHere(m, enabled = true) {
    const [here, setHere] = useState(null);
    useEffect(() => {
        if (!enabled || !m.api.here) return undefined;
        const ctl = new AbortController();
        fetch(m.api.here, { signal: ctl.signal, cache: 'no-store', credentials: 'omit' })
            .then((r) => (r.ok ? r.json() : null))
            .then((answer) => {
                const code = typeof answer?.country === 'string' ? answer.country.toLowerCase() : null;
                if (code && m.byCode.has(code)) setHere(code);
            })
            .catch(() => {});
        return () => ctl.abort();
    }, [m, enabled]);
    return here;
}

/**
 * The next-step tips: open while hovered or focused, or pinned by a tap or a
 * click (design.html). Only an open tip's card is in the page, so the static
 * HTML carries none of their text. `state` holds the key of the tip hovered,
 * focused and pinned; `api` changes them and never changes itself.
 */
export function useTips() {
    const [state, setState] = useState({ hover: null, focus: null, pin: null });
    const api = useMemo(() => ({
        enter: (key) => setState((s) => ({ ...s, hover: key })),
        leave: (key) => setState((s) => (s.hover === key ? { ...s, hover: null } : s)),
        focusIn: (key) => setState((s) => ({ ...s, focus: key })),
        focusOut: (key) => setState((s) => (s.focus === key ? { ...s, focus: null } : s)),
        toggle: (key) => setState((s) => ({ ...s, pin: s.pin === key ? null : key })),
        clear: () => setState({ hover: null, focus: null, pin: null }),
    }), []);
    useEffect(() => {
        if (!state.pin) return undefined;
        const onKey = (event) => { if (event.key === 'Escape') api.clear(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [state.pin, api]);
    return { api, state };
}

/** A tip's state from the tips' state: whether it is open and whether it is pinned. */
export const tipOf = (tips, id) => ({ id, api: tips.api, open: id === tips.state.hover || id === tips.state.focus || id === tips.state.pin, pinned: id === tips.state.pin });

/** The part of the tips' state that belongs to one grid cell (model.js isCellTip), as values a memo can compare. */
export const cellTips = (tips, code) => {
    const mine = (key) => (isCellTip(key, code) ? key : null);
    return { hover: mine(tips.state.hover), focus: mine(tips.state.focus), pin: mine(tips.state.pin) };
};

/**
 * A chip or label that opens a next-step card (hover and focus on desktop; tap
 * to expand on touch sizes). `cta` is the call to action, 'start', 'p' or 'x'.
 */
export function Tip({ m, tip, cls, text, label, near, body, after, cta, pop = false, low = false }) {
    const { id, api, open, pinned } = tip;
    const domId = `ctf-d-${id.replace(/[^a-z0-9-]/gi, '-')}`;
    return (
        <span
            className={cx('ctf-tip', pop && 'ctf-tip-pop', pinned && 'ctf-pinned')}
            onMouseEnter={() => api.enter(id)}
            onMouseLeave={() => api.leave(id)}
            onFocus={() => api.focusIn(id)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) api.focusOut(id); }}
        >
            <button type="button" className={cx(cls, 'ctf-tip-btn')} aria-expanded={open} aria-describedby={open ? domId : undefined} onClick={() => api.toggle(id)}>{text}</button>
            {open && (
                <span className={cx('ctf-act', low && 'ctf-act-low')}>
                    <span className="ctf-label">{label}</span>
                    {near && <span className="ctf-act-near">{near}</span>}
                    <span className="ctf-act-do" id={domId}>{body}</span>
                    {after && <span className="ctf-act-near">{after}</span>}
                    <a className="ctf-btn ctf-btn-p ctf-btn-sm" href={ctaLink(m.lang, cta)}>{ctfCopy(m.lang).cta[cta]}</a>
                </span>
            )}
        </span>
    );
}

/** A next step's words: what to do, the take in bold, and the sentence's end. */
const stepBody = (m, step) => <>{step.act}<b>{step.take}</b>{ctfCopy(m.lang).stop}</>;

// ── the live bar ────────────────────────────────────────────────────────────

/** The epoch's clock: before the start, the time to it; then the time to the draw. */
function clock(m, now) {
    const t = ctfCopy(m.lang).live;
    const f = formats(m.lang);
    const approx = (iso) => rich(t.approx, { time: f.utcTime(iso) }).join('');
    const startsAt = m.startsAt ? Date.parse(m.startsAt) : null;
    const drawAt = Date.parse(m.drawAt);
    if (startsAt !== null && (now === null || now < startsAt)) {
        return now === null ? [t.starts, approx(m.startsAt)] : [t.startsIn, f.countdown(startsAt - now)];
    }
    if (now === null) return [t.draw, approx(m.drawAt)];
    return now < drawAt ? [t.drawIn, f.countdown(drawAt - now)] : [t.draw, t.underWay];
}

function FocusControl({ m, arg, focus, onFocus, hub, mounted, className, title, children }) {
    if (hub) return <a className={className} href={`${pagePath(m.lang, '/ctf')}?focus=${arg}`} title={title}>{children}</a>;
    return <button type="button" className={className} aria-pressed={focus === arg} disabled={!mounted} onClick={() => onFocus(arg)} title={title}>{children}</button>;
}

/**
 * This epoch at a glance (design.html's live bar). Flags held and the two
 * not-fully-captured counts are filters on the hub (`onFocus`), and on a
 * country page links to the hub filtered (`hub`). Without a draw last epoch
 * there is nothing to filter on, and the bar says what is known instead.
 */
export function LiveBar({ m, now, mounted = false, focus = null, onFocus = null, hub = false }) {
    const t = ctfCopy(m.lang).live;
    const f = formats(m.lang);
    const [clockLabel, clockValue] = clock(m, now);
    const items = [];
    const it = (label, value, key = label) => items.push(<div className="ctf-it" key={key}><span className="ctf-label">{label}</span><b>{value}</b></div>);
    const say = (template, values) => rich(template, values).join('');
    items.push(<div className="ctf-it" key="clock"><span className="ctf-label">{clockLabel}</span><b data-parity-ignore="">{clockValue}</b></div>);
    if (m.pending) {
        it(say(t.pending, { epoch: m.pending.epoch }), m.pending.census_block ? say(t.census, { block: f.int(m.pending.census_block) }) : t.waiting, 'pending');
    }
    if (m.drawn) {
        it(t.slot, `${slotFigure(m)} α`);
        it(t.carried, `${f.alpha(m.last.carried)} α`);
        it(t.paid, f.count(t.paidValue, m.last.won, { amount: f.alpha(m.last.awarded) }));
        items.push(
            <FocusControl key="held" m={m} arg="held" focus={focus} onFocus={onFocus} hub={hub} mounted={mounted} className="ctf-it ctf-it-btn" title={t.heldTitle}>
                <span className="ctf-label ctf-it-hint">{t.held}<Chevron /></span><b>{say(t.heldValue, { count: f.int(m.totals.flagsHeld), total: f.int(m.totals.flagsTotal) })}</b>
            </FocusControl>,
            <div className="ctf-it ctf-it-group" role="group" aria-labelledby="ctf-nc-label" key="nfc">
                <span className="ctf-label" id="ctf-nc-label">{t.notFully}</span>
                <FocusControl m={m} arg="np" focus={focus} onFocus={onFocus} hub={hub} mounted={mounted} className="ctf-it-row" title={t.pTitle}>
                    <span>{t.providers}</span><b>{f.int(m.totals.openP)}</b><Chevron />
                </FocusControl>
                <FocusControl m={m} arg="nx" focus={focus} onFocus={onFocus} hub={hub} mounted={mounted} className="ctf-it-row" title={t.xTitle}>
                    <span>{t.extenders}</span><b>{f.int(m.totals.openX)}</b><Chevron />
                </FocusControl>
            </div>,
        );
    } else if (m.phase === 'undrawn') {
        it(t.slot, `${slotFigure(m)} α`);
        it(t.carried, `${f.alpha(m.last.carried)} α`);
        it(say(t.undrawn, { epoch: m.last.epoch }), t.undrawnValue);
    } else {
        if (m.phase === 'prelaunch') it(t.firstDraw, say(t.approx, { time: f.utcTime(m.drawAt) }));
        it(t.slots, say(t.slotsValue, { count: f.int(m.roleSlots) }));
        it(t.countries, t.countriesValue);
    }
    const tag = say(m.phase === 'prelaunch' || (m.phase === 'first' && !m.pending) ? t.tagFirst : t.tag, { epoch: m.epoch });
    return (
        <section className="ctf-live" aria-label={t.aria}>
            <div className="ctf-tag ctf-label ctf-label-acc"><i aria-hidden="true" />{tag}</div>
            {items}
        </section>
    );
}

// ── a country's card ────────────────────────────────────────────────────────

/** A fully captured role's chance to win, as a tip: its operator's draw, or the best of the operators' with each listed. */
function chanceBody(m, c, role) {
    const t = ctfCopy(m.lang).chance;
    const P = role === 'p';
    const body = m.multi ? (P ? t.pBodyMany : t.xBodyMany) : (P ? t.pBody : t.xBody);
    return rich(body, { ...place(c), pct: formats(m.lang).pct(c[role].chance) }, BOLD);
}

function ChanceTip({ m, c, role, tips }) {
    const t = ctfCopy(m.lang).chance;
    const f = formats(m.lang);
    const r = c[role];
    const P = role === 'p';
    return (
        <Tip
            m={m}
            tip={tipOf(tips, `me-${role}c`)}
            pop
            cls="ctf-chance ctf-ex"
            text={f.pct(r.chance)}
            label={P ? t.pLabel : t.xLabel}
            body={chanceBody(m, c, role)}
            after={drawLine(m, r)}
            cta={role}
        />
    );
}

/**
 * The picker: a country by its name, its sentence name or its code, chosen
 * from the list or typed. It changes the card only when the choice is made (an
 * entry of the list, Enter, or leaving the field), as the design's change
 * event did: typing "Niger" on the way to "Nigeria", or "al" on the way to
 * "Algeria", must not jump to Niger or Albania. The list is rendered once the
 * page runs, so the static page carries no 249 options.
 */
export function CountryPicker({ m, mounted, onPick }) {
    const t = ctfCopy(m.lang).card;
    const [value, setValue] = useState('');
    const pick = (text) => {
        const hit = findCountry(m, text);
        if (hit) {
            setValue('');
            onPick(hit.code);
        }
    };
    return (
        <div className="ctf-pick">
            <label htmlFor="ctf-country" className="ctf-label">{t.pickLabel}</label>
            <input
                id="ctf-country"
                className="ctf-field"
                list="ctf-countries"
                placeholder={t.pickPlaceholder}
                autoComplete="off"
                disabled={!mounted}
                value={value}
                onChange={(event) => {
                    setValue(event.target.value);
                    // an entry of the list replaces the text whole; typing inserts it
                    const kind = event.nativeEvent?.inputType;
                    if (!kind || kind === 'insertReplacementText') pick(event.target.value);
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') pick(value); }}
                onBlur={() => pick(value)}
            />
            {mounted && <datalist id="ctf-countries">{m.az.map((c) => <option key={c.code} value={c.name} />)}</datalist>}
        </div>
    );
}

/**
 * A country's card: the hub's "Your country" (the visitor's, from
 * /sn/ctf/here, or the one they pick; before that the biggest open pot, or no
 * country) and a country page's "This epoch in …".
 */
export function CountryCard({ m, c, label, hubLink = false, tips, picker }) {
    const all = ctfCopy(m.lang);
    const t = all.card;
    const f = formats(m.lang);
    const msg = c ? countryMessage(m, c) : rich(m.phase === 'prelaunch' ? t.nonePrelaunch : t.none, { first: m.firstEpoch }).join('');
    const anyClosed = c && (c.p.held || c.x.held);
    // before a draw the dashboard's count is what is known of a country; after one, its draw says more
    const presence = c && !m.potsKnown ? presenceSentence(m, c) : null;
    const empty = c ? uninhabitedSentence(c, m.lang) : null;
    const where = c ? { where: c.the, whereIn: place(c).in } : { where: t.where, whereIn: t.whereIn };
    // its flag waves unless every slot of both roles was won last epoch, as design.html's card does: before a draw
    // nothing is held, so a country's own page and a visitor's country wave from the start
    const wave = c && !(c.p.held && c.x.held);
    return (
        <section className={cx('ctf-mine', wave && 'ctf-wave')} aria-labelledby="ctf-mine-h">
            <div className="ctf-pole"><Flag code={c?.code} size="l" lazy={false} /></div>
            <div className="ctf-me-body">
                <div className="ctf-label">{label}</div>
                <h2 id="ctf-mine-h" className="ctf-me-name">{c ? c.name : t.yourCountry}</h2>
                {hubLink && c && <p className="ctf-me-seo"><a href={pagePath(m.lang, `/ctf/${c.code}`)}>{rich(t.earning, place(c))}</a></p>}
                {c && c.avail !== null && (
                    <div className="ctf-me-amtrow"><b className="ctf-px ctf-me-amt">{f.alpha(c.avail)}</b><span className="ctf-me-unit">α</span><span className="ctf-me-what">{t.upForGrabs}</span></div>
                )}
                {c && c.avail === null && c.online !== null && (
                    <div className="ctf-me-amtrow"><b className="ctf-px ctf-me-amt">{f.int(c.online)}</b><span className="ctf-me-what">{rich(t.online, { noun: f.form(t.onlineNoun, c.online), day: f.dayName(m.presence.day) })}</span></div>
                )}
                <p className="ctf-me-msg">{msg}{empty && <>{all.gap}{empty}</>}{presence && <>{all.gap}{presence}</>}</p>
                {c && (
                    <div className="ctf-roles">
                        {['p', 'x'].map((role) => (
                            <div className="ctf-role" key={role}>
                                <span className="ctf-label">{role === 'p' ? all.live.providers : all.live.extenders}</span>
                                {/* a role's slots as pips, five at each operator; past two operators' ten, as a count */}
                                {(c[role].won === null ? m.roleSlots : c[role].slots) <= 10
                                    ? <Pips won={c[role].won} role={role} slots={c[role].won === null ? m.roleSlots : c[role].slots} big />
                                    : <span className="ctf-mono ctf-role-count" aria-hidden="true">{`${c[role].won ?? 0}/${c[role].won === null ? m.roleSlots : c[role].slots}`}</span>}
                                <span className="ctf-mono ctf-role-txt">
                                    {roleLine(m, c, role)}{c[role].held && <>{all.gap}<ChanceTip m={m} c={c} role={role} tips={tips} /></>}
                                    {m.multi && m.drawn && <span className="ctf-role-ops">{opsLine(m, c[role])}</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {anyClosed && <p className="ctf-touch-block ctf-me-note">{t.chanceNote}</p>}
            </div>
            <div className="ctf-cta">
                <a className="ctf-btn ctf-btn-p" href={ctaLink(m.lang, 'start')}>{c ? rich(t.startIn, place(c)).join('') : t.start}</a>
                <a className="ctf-btn ctf-btn-s" href={ctaLink(m.lang, 'x')}>{t.runExtender}</a>
                <p className="ctf-cta-note">{rich(t.stay, where)}</p>
                {picker}
            </div>
        </section>
    );
}

// ── easy wins ───────────────────────────────────────────────────────────────

/** One Easy wins card: a country with a big pot and an open slot. */
export function EasyWinCard({ m, c, mounted, tips, expanded, onExpand }) {
    const all = ctfCopy(m.lang);
    const t = all.easy;
    const f = formats(m.lang);
    const step = nextStep(m, c);
    const open = c.p.open && c.x.open ? t.openBoth : c.p.open ? t.openP : t.openX;
    // the card glows, and its flag waves, out of step with the others (model.js waveDelay)
    const delay = c.wave;
    return (
        <article className={cx('ctf-fc', 'ctf-wave', expanded && 'ctf-expanded')} style={{ animationDelay: delay, '--ctf-vt': `f-${c.code}` }}>
            {mounted && <button type="button" className="ctf-fc-hit ctf-tap" onClick={() => onExpand(c.code)} aria-label={rich(t.showNext, { name: c.name }).join('')} aria-expanded={expanded} />}
            <div className="ctf-fc-top">
                <span className="ctf-pole"><Flag code={c.code} size="m" delay={delay} /></span>
                <Tip m={m} tip={tipOf(tips, `feat:${c.code}`)} cls="ctf-ribbon ctf-r-hot" text={c.near > 0 ? t.soClose : t.easyWin} label={all.next.label} near={step.near} body={stepBody(m, step)} cta={step.cta} />
            </div>
            <h3 className="ctf-fc-name"><a href={pagePath(m.lang, `/ctf/${c.code}`)}>{c.name}</a></h3>
            <div className="ctf-fc-amt"><b className="ctf-px">{f.alpha(c.avail)}</b><span>{t.upForGrabs}</span></div>
            <span className="ctf-mono ctf-fc-pots ctf-fc-pots-l">{rich(t.pots, { p: f.alpha(c.p.pot), x: f.alpha(c.x.pot) }).join('')}</span>
            <span className="ctf-mono ctf-fc-pots ctf-fc-pots-s">{rich(t.potsShort, { p: f.alpha(c.p.pot), x: f.alpha(c.x.pot) }).join('')}</span>
            <p className="ctf-mono ctf-fc-line">{c.near > 0 ? f.count(t.left, c.near) : ''}{open}</p>
            {expanded && (
                <div className="ctf-fc-next">
                    <span className="ctf-act-near">{step.near}</span>
                    <span className="ctf-act-do">{stepBody(m, step)}</span>
                    <div className="ctf-more-cta"><a className="ctf-btn ctf-btn-p ctf-btn-sm" href={ctaLink(m.lang, step.cta)}>{all.cta[step.cta]}</a><button type="button" className="ctf-btn ctf-btn-s ctf-btn-sm" onClick={() => onExpand(c.code)}>{t.close}</button></div>
                </div>
            )}
        </article>
    );
}

/** The Easy wins section: eight of the big pots this epoch, with Shuffle. */
export function EasyWinsSection({ m, picks, title, mounted, tips, expanded, onExpand, onShuffle }) {
    const t = ctfCopy(m.lang).easy;
    return (
        <section className="ctf-sec ctf-feat-sec" aria-labelledby="ctf-feat-h" data-ctf-elsewhere="">
            <div className="ctf-sec-head">
                <div className="ctf-sec-title">
                    <div className="ctf-label ctf-label-acc">{t.label}</div>
                    <h2 id="ctf-feat-h" className="ctf-h2">{title}</h2>
                    <p className="ctf-sub">{t.sub}</p>
                </div>
                <button type="button" className="ctf-btn ctf-btn-s" disabled={!mounted} onClick={onShuffle}>{t.shuffle}</button>
            </div>
            {/* drawn again on each visit: the static page's draw is the epoch's */}
            <div className="ctf-feat" data-parity-ignore="">
                {picks.map((c) => <EasyWinCard key={c.code} m={m} c={c} mounted={mounted} tips={tips} expanded={expanded === c.code} onExpand={onExpand} />)}
            </div>
        </section>
    );
}

// ── a grid cell ─────────────────────────────────────────────────────────────

function RoleRow({ m, c, role, tip }) {
    const all = ctfCopy(m.lang);
    const t = all.cell;
    const f = formats(m.lang);
    const r = c[role];
    const P = role === 'p';
    let chip = null;
    if (m.drawn && r.open) {
        chip = (
            <>
                <span className="ctf-rpot" title={P ? t.pPot : t.xPot}>{f.alpha(r.pot)} α</span>
                <Tip m={m} tip={tip(`${role}:${c.code}`)} low cls="ctf-chance ctf-win" text={t.open} label={P ? t.pNotFully : t.xNotFully}
                    near={f.count(P ? t.pUnclaimed : t.xUnclaimed, SLOTS_OPEN(r), { total: r.slots })}
                    body={rich(P ? t.pRun : t.xRun, { ...place(c), amount: f.alpha(r.est) }, BOLD)}
                    after={opsLine(m, r)}
                    cta={role} />
            </>
        );
    } else if (m.drawn) {
        const ch = all.chance;
        chip = (
            <Tip m={m} tip={tip(`${role}c:${c.code}`)} low cls="ctf-chance ctf-ex" text={f.pct(r.chance)} label={P ? ch.pLabel : ch.xLabel}
                body={chanceBody(m, c, role)}
                after={drawLine(m, r)} cta={role} />
        );
    } else if (m.potsKnown) {
        chip = <span className="ctf-rpot" title={P ? t.pPot : t.xPot}>{f.alpha(r.pot)} α</span>;
    }
    return (
        <div className={cx('ctf-rrow', P ? 'ctf-p-row' : 'ctf-x-row')}>
            <span className="ctf-rl" aria-hidden="true">{P ? t.letterP : t.letterX}</span>
            <CellPips won={r.won} role={role} />
            {m.drawn && <span className="ctf-rcount" aria-hidden="true">{r.won}/{r.slots}</span>}
            {chip}
        </div>
    );
}

const SLOTS_OPEN = (r) => r.slots - r.won;

/** What a cell says to a screen reader in place of its pips and chips. */
function cellSummary(m, c) {
    const t = ctfCopy(m.lang).cell;
    const f = formats(m.lang);
    const say = (template, values) => rich(template, values).join('');
    if (m.drawn) {
        const role = (r, open, chance) => (r.open ? open : say(chance, { pct: f.pct(r.chance) }));
        return say(t.summary, {
            p: c.p.won,
            x: c.x.won,
            total: c.p.slots,
            amount: f.alpha(c.awarded),
            pRole: role(c.p, t.pOpenSr, t.pChanceSr),
            xRole: role(c.x, t.xOpenSr, t.xChanceSr),
        });
    }
    if (m.potsKnown) return say(t.undrawnSr, { p: f.alpha(c.p.pot), x: f.alpha(c.x.pot) });
    return null;
}

/** One country of the grid: its link, flag, pots, slot status and chance to win; the rest when it opens. */
export const GridCell = React.memo(function GridCell({ m, c, mounted, tipApi, tipHover, tipFocus, tipPin, expanded, onExpand }) {
    const all = ctfCopy(m.lang);
    const t = all.cell;
    const f = formats(m.lang);
    const say = (template, values) => rich(template, values).join('');
    const tip = (id) => ({ id, api: tipApi, open: id === tipHover || id === tipFocus || id === tipPin, pinned: id === tipPin });
    const ribbon = m.drawn && c.hot
        ? (() => {
            const step = nextStep(m, c);
            return <Tip m={m} tip={tip(`grid:${c.code}`)} cls="ctf-ribbon ctf-r-hot" text={t.soClose} label={all.next.label} near={step.near} body={stepBody(m, step)} cta={step.cta} />;
        })()
        : c.big ? <span className="ctf-ribbon ctf-r-open">{t.bigPot}</span> : c.flagHeld ? <span className="ctf-ribbon ctf-r-held">{t.held}</span> : null;
    const tier = c.hot ? 'ctf-hot' : c.big ? 'ctf-open' : null;
    const pinned = Boolean(tipPin);
    // a hot cell glows, and a cell's flag waves (hot, or under the pointer), out of step with the others (model.js waveDelay)
    const style = { '--ctf-vt': `c-${c.code}`, ...(c.hot ? { animationDelay: c.wave } : {}) };
    const mini = (r) => (m.drawn ? (r.open ? 'ctf-m-open' : 'ctf-m-held') : 'ctf-m-held');
    const summary = cellSummary(m, c);
    const cta = m.drawn && c.x.open && !c.p.open ? 'x' : m.drawn && c.p.open && !c.x.open ? 'p' : 'start';
    const href = pagePath(m.lang, `/ctf/${c.code}`);
    return (
        <article className={cx('ctf-cell', tier, pinned && 'ctf-pinned', expanded && 'ctf-expanded')} style={style}>
            {/* tap to expand (touch sizes) needs the page to run: the static page has no control that does nothing */}
            {mounted && <button type="button" className="ctf-cell-hit ctf-tap" onClick={() => onExpand(c.code)} aria-label={say(t.showDetails, { name: c.name })} aria-expanded={expanded} />}
            <div className="ctf-cell-top"><Flag code={c.code} delay={c.wave} />{ribbon}</div>
            <h3 className="ctf-cname" title={c.name}><a href={href}>{c.name}</a></h3>
            {m.potsKnown
                ? <div className="ctf-amt"><b>{f.alpha(c.pots)}</b><span>α</span><span className="ctf-amt-l">{t.inPots}</span></div>
                : c.online !== null && <div className="ctf-amt"><b>{f.int(c.online)}</b><span>{f.form(t.providers, c.online)}</span><span className="ctf-amt-l">{t.online}</span></div>}
            <span className="ctf-mini" aria-hidden="true"><i className={cx('ctf-m', mini(c.p))}>{t.letterP}</i><i className={cx('ctf-m', mini(c.x))}>{t.letterX}</i></span>
            <div className="ctf-last">
                <RoleRow m={m} c={c} role="p" tip={tip} />
                <RoleRow m={m} c={c} role="x" tip={tip} />
                <span aria-hidden="true">{m.drawn
                    ? say(t.wonLine, { won: c.won, amount: f.alpha(c.awarded) })
                    : m.potsKnown ? t.noDraw
                        : c.seenDays !== null ? say(t.seen, { seen: f.int(c.seenDays), days: f.int(m.presence.days) })
                            : say(t.fromEpoch, { first: m.firstEpoch })}</span>
                {summary && <span className="ctf-sr">{summary}</span>}
            </div>
            {expanded && (
                <div className="ctf-cell-more">
                    {m.drawn && c.near > 0 && <p className="ctf-more-near">{f.count(t.near, c.near)}</p>}
                    {m.potsKnown
                        ? <><p className="ctf-more-line">{roleDetail(m, c, 'p')}</p><p className="ctf-more-line">{roleDetail(m, c, 'x')}</p></>
                        : <p className="ctf-more-line">{countryMessage(m, c)}{all.gap}{presenceSentence(m, c)}</p>}
                    <div className="ctf-more-cta ctf-more-cta-3">
                        <a className="ctf-btn ctf-btn-p ctf-btn-sm" href={ctaLink(m.lang, cta)}>{all.cta[cta]}</a>
                        <a className="ctf-btn ctf-btn-s ctf-btn-sm" href={href}>{t.countryPage}</a>
                        <button type="button" className="ctf-btn ctf-btn-s ctf-btn-sm" onClick={() => onExpand(c.code)}>{t.close}</button>
                    </div>
                </div>
            )}
        </article>
    );
});
