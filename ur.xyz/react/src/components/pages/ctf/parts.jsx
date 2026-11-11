import React, { useEffect, useMemo, useState } from 'react';
import {
    API_HERE,
    START_URL,
    alpha,
    countdown,
    countryMessage,
    countryPath,
    dayName,
    drawLine,
    flagSrc,
    int,
    nextStep,
    pct,
    presenceSentence,
    roleDetail,
    roleLine,
    utcTime,
} from './model';

/**
 * The parts the capture the flag islands share (ctf/Board.jsx, CountryCard.jsx,
 * EasyWins.jsx): the flags, the next-step tips, the live bar, a country's card,
 * an Easy wins card and a grid cell, as design.html draws them. Their first
 * render is the static page's (no clock, no visitor, the epoch's seed), so an
 * island hydrates onto exactly the HTML the build wrote; the clock, the
 * visitor's country and the next-step text arrive after.
 */

export const cx = (...names) => names.filter(Boolean).join(' ');

export function Flag({ code, size = 's', lazy = true }) {
    const dims = { s: [36, 27], m: [72, 54], l: [128, 96] }[size];
    if (!code) return <span className={cx('ctf-flag', `ctf-flag-${size}`, 'ctf-flag-none')} aria-hidden="true" />;
    return <img className={cx('ctf-flag', `ctf-flag-${size}`)} src={flagSrc(code)} alt="" width={dims[0]} height={dims[1]} loading={lazy ? 'lazy' : 'eager'} decoding="async" />;
}

export function Chevron() {
    return <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

export function Pips({ won, role, big = false }) {
    return (
        <span className={cx('ctf-pips', big && 'ctf-big')} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <i key={i} className={cx('ctf-pip', won !== null && i < won && `ctf-${role}`)} />)}
        </span>
    );
}

/** A grid cell's five pips as one element (the stylesheet draws them), so the grid's 2,490 pips are not 2,490 nodes. */
export function CellPips({ won, role }) {
    return <span className={cx('ctf-cpips', `ctf-n${won || 0}`, `ctf-cp-${role}`)} aria-hidden="true" />;
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

/** The visitor's country from GET /sn/ctf/here (nothing is stored), when it is one of the 249. */
export function useHere(m, enabled = true) {
    const [here, setHere] = useState(null);
    useEffect(() => {
        if (!enabled) return undefined;
        const ctl = new AbortController();
        fetch(API_HERE, { signal: ctl.signal, cache: 'no-store', credentials: 'omit' })
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

/** The part of the tips' state that belongs to one grid cell (its keys end in ":<code>"), as values a memo can compare. */
export const cellTips = (tips, code) => {
    const mine = (key) => (key && key.endsWith(`:${code}`) ? key : null);
    return { hover: mine(tips.state.hover), focus: mine(tips.state.focus), pin: mine(tips.state.pin) };
};

/** A chip or label that opens a next-step card (hover and focus on desktop; tap to expand on touch sizes). */
export function Tip({ tip, cls, text, label, near, body, after, cta, pop = false, low = false }) {
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
                    <a className="ctf-btn ctf-btn-p ctf-btn-sm" href={START_URL}>{cta}</a>
                </span>
            )}
        </span>
    );
}

// ── the live bar ────────────────────────────────────────────────────────────

/** The epoch's clock: before the start, the time to it; then the time to the draw. */
function clock(m, now) {
    const startsAt = m.startsAt ? Date.parse(m.startsAt) : null;
    const drawAt = Date.parse(m.drawAt);
    if (startsAt !== null && (now === null || now < startsAt)) {
        return now === null ? ['Starts', `≈ ${utcTime(m.startsAt)}`] : ['Starts in', countdown(startsAt - now)];
    }
    if (now === null) return ['Draw', `≈ ${utcTime(m.drawAt)}`];
    return now < drawAt ? ['Draw in', countdown(drawAt - now)] : ['Draw', 'under way'];
}

function FocusControl({ arg, focus, onFocus, hub, className, title, children }) {
    if (hub) return <a className={className} href={`/ctf?focus=${arg}`} title={title}>{children}</a>;
    return <button type="button" className={className} aria-pressed={focus === arg} onClick={() => onFocus(arg)} title={title}>{children}</button>;
}

/**
 * This epoch at a glance (design.html's live bar). Flags held and the two
 * not-fully-captured counts are filters on the hub (`onFocus`), and on a
 * country page links to the hub filtered (`hub`). Without a draw last epoch
 * there is nothing to filter on, and the bar says what is known instead.
 */
export function LiveBar({ m, now, focus = null, onFocus = null, hub = false }) {
    const [clockLabel, clockValue] = clock(m, now);
    const items = [];
    const it = (label, value, key = label) => items.push(<div className="ctf-it" key={key}><span className="ctf-label">{label}</span><b>{value}</b></div>);
    items.push(<div className="ctf-it" key="clock"><span className="ctf-label">{clockLabel}</span><b data-parity-ignore="">{clockValue}</b></div>);
    if (m.pending) {
        it(`Epoch ${m.pending.epoch}'s draw`, m.pending.census_block ? `census at block ${int(m.pending.census_block)}` : 'waiting for the census', 'pending');
    }
    if (m.drawn) {
        it('Slot', `${alpha(m.slot, 3)} α`);
        it('Carried into this epoch', `${alpha(m.last.carried)} α`);
        it('Paid last epoch', `${alpha(m.last.awarded)} α · ${int(m.last.won)} winners`);
        items.push(
            <FocusControl key="held" arg="held" focus={focus} onFocus={onFocus} hub={hub} className="ctf-it ctf-it-btn" title="Show only the flags held on both roles">
                <span className="ctf-label ctf-it-hint">Flags held<Chevron /></span><b>{int(m.totals.flagsHeld)} / 249</b>
            </FocusControl>,
            <div className="ctf-it ctf-it-group" role="group" aria-labelledby="ctf-nc-label" key="nfc">
                <span className="ctf-label" id="ctf-nc-label">Not fully captured</span>
                <FocusControl arg="np" focus={focus} onFocus={onFocus} hub={hub} className="ctf-it-row" title="Show only countries with a provider slot open">
                    <span>Providers</span><b>{int(m.totals.openP)}</b><Chevron />
                </FocusControl>
                <FocusControl arg="nx" focus={focus} onFocus={onFocus} hub={hub} className="ctf-it-row" title="Show only countries with an extender slot open">
                    <span>Extenders</span><b>{int(m.totals.openX)}</b><Chevron />
                </FocusControl>
            </div>,
        );
    } else if (m.phase === 'undrawn') {
        it('Slot', `${alpha(m.slot, 3)} α`);
        it('Carried into this epoch', `${alpha(m.last.carried)} α`);
        it(`Epoch ${m.last.epoch}`, 'no draw · every slot carried');
    } else {
        if (m.phase === 'prelaunch') it('First draw', `≈ ${utcTime(m.drawAt)}`);
        it('Slots', '5 + 5 a country');
        it('Countries', '249');
    }
    const tag = m.phase === 'prelaunch' || (m.phase === 'first' && !m.pending) ? `Epoch ${m.epoch} · the first` : `Epoch ${m.epoch}`;
    return (
        <section className="ctf-live" aria-label="This epoch">
            <div className="ctf-tag ctf-label ctf-label-acc"><i aria-hidden="true" />{tag}</div>
            {items}
        </section>
    );
}

// ── a country's card ────────────────────────────────────────────────────────

function ChanceTip({ m, c, role, tips }) {
    const r = c[role];
    const P = role === 'p';
    return (
        <Tip
            tip={tipOf(tips, `me-${role}c`)}
            pop
            cls="ctf-chance ctf-ex"
            text={pct(r.chance)}
            label={`Chance to win · ${P ? 'providers' : 'extenders'}`}
            body={<>The estimated probability that you win this epoch's reward in {c.the} if you launch {P ? 'a provider' : 'an extender'} there and keep it online for half the epoch: <b>{pct(r.chance)}</b>.</>}
            after={drawLine(m, r)}
            cta={P ? 'Run a provider' : 'Run an extender'}
        />
    );
}

/** The countries for the picker: name → code, A–Z (rendered once the page runs, so the static page carries no list). */
export function CountryPicker({ m, mounted, onPick }) {
    const [value, setValue] = useState('');
    const pick = (text) => {
        const v = text.trim().toLowerCase();
        const hit = m.countries.find((c) => c.name.toLowerCase() === v || c.short.toLowerCase() === v || c.code === v);
        if (hit) {
            setValue('');
            onPick(hit.code);
        }
    };
    return (
        <div className="ctf-pick">
            <label htmlFor="ctf-country" className="ctf-label">Somewhere else?</label>
            <input
                id="ctf-country"
                className="ctf-field"
                list="ctf-countries"
                placeholder="Type a country"
                autoComplete="off"
                value={value}
                onChange={(event) => { setValue(event.target.value); pick(event.target.value); }}
                onKeyDown={(event) => { if (event.key === 'Enter') pick(value); }}
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
    const msg = c ? countryMessage(m, c) : `Every country has five provider slots and five extender slots each epoch${m.phase === 'prelaunch' ? `, from epoch ${m.firstEpoch}` : ''}. Pick yours to see what is up for grabs there.`;
    const anyOpen = c && (c.p.open || c.x.open);
    const anyClosed = c && (c.p.held || c.x.held);
    // before a draw the dashboard's count is what is known of a country; after one, its draw says more
    const presence = c && !m.potsKnown ? presenceSentence(m, c) : null;
    const where = c ? c.the : 'your country';
    return (
        <section className={cx('ctf-mine', anyOpen && 'ctf-wave')} aria-labelledby="ctf-mine-h">
            <div className="ctf-pole"><Flag code={c?.code} size="l" lazy={false} /></div>
            <div className="ctf-me-body">
                <div className="ctf-label">{label}</div>
                <h2 id="ctf-mine-h" className="ctf-me-name">{c ? c.name : 'Your country'}</h2>
                {hubLink && c && <p className="ctf-me-seo"><a href={countryPath(c.code)}>Earning in {c.the}: questions and how to start</a></p>}
                {c && c.avail !== null && (
                    <div className="ctf-me-amtrow"><b className="ctf-px ctf-me-amt">{alpha(c.avail)}</b><span className="ctf-me-unit">α</span><span className="ctf-me-what">up for grabs this epoch</span></div>
                )}
                {c && c.avail === null && c.online !== null && (
                    <div className="ctf-me-amtrow"><b className="ctf-px ctf-me-amt">{int(c.online)}</b><span className="ctf-me-what">{c.online === 1 ? 'provider' : 'providers'} online at the end of {dayName(m.presence.day)}</span></div>
                )}
                <p className="ctf-me-msg">{msg}{presence && <> {presence}</>}</p>
                {c && (
                    <div className="ctf-roles">
                        {['p', 'x'].map((role) => (
                            <div className="ctf-role" key={role}>
                                <span className="ctf-label">{role === 'p' ? 'Providers' : 'Extenders'}</span>
                                <Pips won={c[role].won} role={role} big />
                                <span className="ctf-mono ctf-role-txt">{roleLine(m, c, role)}{c[role].held && <> <ChanceTip m={m} c={c} role={role} tips={tips} /></>}</span>
                            </div>
                        ))}
                    </div>
                )}
                {anyClosed && <p className="ctf-touch-block ctf-me-note">Chance to win is the estimated probability that you win the epoch reward if you launch a provider or an extender here and keep it online for half the epoch.</p>}
            </div>
            <div className="ctf-cta">
                <a className="ctf-btn ctf-btn-p" href={START_URL}>{c ? `Start mining in ${c.the}` : 'Start mining'}</a>
                <a className="ctf-btn ctf-btn-s" href={START_URL}>Run an extender</a>
                <p className="ctf-cta-note">Stay online in {where} for at least half the epoch to enter the draw. Your app's payout wallet is used.</p>
                {picker}
            </div>
        </section>
    );
}

// ── easy wins ───────────────────────────────────────────────────────────────

/** One Easy wins card: a country with a big pot and an open slot. */
export function EasyWinCard({ m, c, i, mounted, tips, expanded, onExpand }) {
    const step = nextStep(m, c);
    const roles = c.p.open && c.x.open ? 'providers and extenders' : c.p.open ? 'providers' : 'extenders';
    const delay = `-${(((i * 7) + 3) % 23) / 10}s`;
    return (
        <article className={cx('ctf-fc', 'ctf-wave', expanded && 'ctf-expanded')} style={{ animationDelay: delay, '--ctf-vt': `f-${c.code}` }}>
            {mounted && <button type="button" className="ctf-fc-hit ctf-tap" onClick={() => onExpand(c.code)} aria-label={`Show the next step for ${c.name}`} aria-expanded={expanded} />}
            <div className="ctf-fc-top">
                <span className="ctf-pole"><Flag code={c.code} size="m" /></span>
                <Tip tip={tipOf(tips, `feat:${c.code}`)} cls="ctf-ribbon ctf-r-hot" text={c.near > 0 ? 'So close' : 'Easy win'} label="Next step" near={step.near} body={<>{step.act}<b>{step.take}</b>.</>} cta={step.cta} />
            </div>
            <h3 className="ctf-fc-name"><a href={countryPath(c.code)}>{c.name}</a></h3>
            <div className="ctf-fc-amt"><b className="ctf-px">{alpha(c.avail)}</b><span>α up for grabs</span></div>
            <span className="ctf-mono ctf-fc-pots ctf-fc-pots-l">Provider pot {alpha(c.p.pot)} α · extender pot {alpha(c.x.pot)} α</span>
            <span className="ctf-mono ctf-fc-pots ctf-fc-pots-s">P {alpha(c.p.pot)} α · E {alpha(c.x.pot)} α</span>
            <p className="ctf-mono ctf-fc-line">{c.near > 0 ? `${int(c.near)} ${c.near === 1 ? 'miner was' : 'miners were'} here last epoch but left early. ` : ''}Not fully captured: {roles}, so a newcomer wins by default.</p>
            {expanded && (
                <div className="ctf-fc-next">
                    <span className="ctf-act-near">{step.near}</span>
                    <span className="ctf-act-do">{step.act}<b>{step.take}</b>.</span>
                    <div className="ctf-more-cta"><a className="ctf-btn ctf-btn-p ctf-btn-sm" href={START_URL}>{step.cta}</a><button type="button" className="ctf-btn ctf-btn-s ctf-btn-sm" onClick={() => onExpand(c.code)}>Close</button></div>
                </div>
            )}
        </article>
    );
}

/** The Easy wins section: eight of the big pots this epoch, with Shuffle. */
export function EasyWinsSection({ m, picks, title, mounted, tips, expanded, onExpand, onShuffle }) {
    return (
        <section className="ctf-sec ctf-feat-sec" aria-labelledby="ctf-feat-h">
            <div className="ctf-sec-head">
                <div className="ctf-sec-title">
                    <div className="ctf-label ctf-label-acc">Easy wins</div>
                    <h2 id="ctf-feat-h" className="ctf-h2">{title}</h2>
                    <p className="ctf-sub">Eight countries drawn at random from the biggest pots, weighted by pot size. Each has an open slot, so a newcomer who stays online there for half the epoch wins by default.</p>
                </div>
                <button type="button" className="ctf-btn ctf-btn-s" onClick={onShuffle}>Shuffle</button>
            </div>
            {/* drawn again on each visit: the static page's draw is the epoch's */}
            <div className="ctf-feat" data-parity-ignore="">
                {picks.map((c, i) => <EasyWinCard key={c.code} m={m} c={c} i={i} mounted={mounted} tips={tips} expanded={expanded === c.code} onExpand={onExpand} />)}
            </div>
        </section>
    );
}

// ── a grid cell ─────────────────────────────────────────────────────────────

function RoleRow({ m, c, role, tip }) {
    const r = c[role];
    const P = role === 'p';
    const name = P ? 'provider' : 'extender';
    let chip = null;
    if (m.drawn && r.open) {
        chip = (
            <>
                <span className="ctf-rpot" title={`${P ? 'Provider' : 'Extender'} pot`}>{alpha(r.pot)} α</span>
                <Tip tip={tip(`${role}:${c.code}`)} low cls="ctf-chance ctf-win" text="Open" label={`Not fully captured · ${name}s`}
                    near={`${SLOTS_OPEN(r)} of 5 ${name} slots went unclaimed last epoch.`}
                    body={<>Run {P ? 'a provider' : 'an extender'} in {c.the} for half an epoch and you win by default: <b>about {alpha(r.est)} α</b> this epoch, then a fifth of what is left each epoch you stay.</>}
                    cta={P ? 'Run a provider' : 'Run an extender'} />
            </>
        );
    } else if (m.drawn) {
        chip = (
            <Tip tip={tip(`${role}c:${c.code}`)} low cls="ctf-chance ctf-ex" text={pct(r.chance)} label={`Chance to win · ${name}s`}
                body={<>The estimated probability that you win this epoch's reward in {c.the} if you launch {P ? 'a provider' : 'an extender'} there and keep it online for half the epoch: <b>{pct(r.chance)}</b>.</>}
                after={drawLine(m, r)} cta={P ? 'Run a provider' : 'Run an extender'} />
        );
    } else if (m.potsKnown) {
        chip = <span className="ctf-rpot" title={`${P ? 'Provider' : 'Extender'} pot`}>{alpha(r.pot)} α</span>;
    }
    return (
        <div className={cx('ctf-rrow', P ? 'ctf-p-row' : 'ctf-x-row')}>
            <span className="ctf-rl" aria-hidden="true">{P ? 'P' : 'E'}</span>
            <CellPips won={r.won} role={role} />
            {m.drawn && <span className="ctf-rcount" aria-hidden="true">{r.won}/5</span>}
            {chip}
        </div>
    );
}

const SLOTS_OPEN = (r) => 5 - r.won;

/** What a cell says to a screen reader in place of its pips and chips. */
function cellSummary(m, c) {
    if (m.drawn) {
        const role = (r, name) => (r.open ? `${name}s not fully captured, a new ${name} wins by default` : `chance to win as a new ${name} ${pct(r.chance)}`);
        return `Last epoch: ${c.p.won} of 5 provider slots and ${c.x.won} of 5 extender slots won, ${alpha(c.awarded)} alpha paid; ${role(c.p, 'provider')}; ${role(c.x, 'extender')}.`;
    }
    if (m.potsKnown) return `No draw last epoch: provider pot ${alpha(c.p.pot)} alpha, extender pot ${alpha(c.x.pot)} alpha.`;
    return null;
}

/** One country of the grid: its link, flag, pots, slot status and chance to win; the rest when it opens. */
export const GridCell = React.memo(function GridCell({ m, c, i, mounted, tipApi, tipHover, tipFocus, tipPin, expanded, onExpand }) {
    const tip = (id) => ({ id, api: tipApi, open: id === tipHover || id === tipFocus || id === tipPin, pinned: id === tipPin });
    const ribbon = m.drawn && c.hot
        ? (() => {
            const step = nextStep(m, c);
            return <Tip tip={tip(`grid:${c.code}`)} cls="ctf-ribbon ctf-r-hot" text="So close" label="Next step" near={step.near} body={<>{step.act}<b>{step.take}</b>.</>} cta={step.cta} />;
        })()
        : c.big ? <span className="ctf-ribbon ctf-r-open">Big pot</span> : c.flagHeld ? <span className="ctf-ribbon ctf-r-held">Held</span> : null;
    const tier = c.hot ? 'ctf-hot' : c.big ? 'ctf-open' : null;
    const pinned = Boolean(tipPin);
    const style = { '--ctf-vt': `c-${c.code}`, ...(c.hot ? { animationDelay: `-${(((i * 7) + 5) % 23) / 10}s` } : {}) };
    const mini = (r) => (m.drawn ? (r.open ? 'ctf-m-open' : 'ctf-m-held') : 'ctf-m-held');
    const summary = cellSummary(m, c);
    return (
        <article className={cx('ctf-cell', tier, pinned && 'ctf-pinned', expanded && 'ctf-expanded')} style={style}>
            {/* tap to expand (touch sizes) needs the page to run: the static page has no control that does nothing */}
            {mounted && <button type="button" className="ctf-cell-hit ctf-tap" onClick={() => onExpand(c.code)} aria-label={`Show details for ${c.name}`} aria-expanded={expanded} />}
            <div className="ctf-cell-top"><Flag code={c.code} />{ribbon}</div>
            <h3 className="ctf-cname" title={c.name}><a href={countryPath(c.code)}>{c.name}</a></h3>
            {m.potsKnown
                ? <div className="ctf-amt"><b>{alpha(c.pots)}</b><span>α</span><span className="ctf-amt-l">in pots</span></div>
                : c.online !== null && <div className="ctf-amt"><b>{int(c.online)}</b><span>{c.online === 1 ? 'provider' : 'providers'}</span><span className="ctf-amt-l">online</span></div>}
            <span className="ctf-mini" aria-hidden="true"><i className={cx('ctf-m', mini(c.p))}>P</i><i className={cx('ctf-m', mini(c.x))}>E</i></span>
            <div className="ctf-last">
                <RoleRow m={m} c={c} role="p" tip={tip} />
                <RoleRow m={m} c={c} role="x" tip={tip} />
                <span aria-hidden="true">{m.drawn ? `${c.won} won · ${alpha(c.awarded)} α` : m.potsKnown ? 'no draw last epoch' : c.seenDays !== null ? `seen ${c.seenDays}/${m.presence.days} days` : 'from epoch 8'}</span>
                {summary && <span className="ctf-sr">{summary}</span>}
            </div>
            {expanded && (
                <div className="ctf-cell-more">
                    {m.drawn && c.near > 0 && <p className="ctf-more-near">So close: {int(c.near)} {c.near === 1 ? 'miner' : 'miners'} here left early last epoch.</p>}
                    {m.potsKnown
                        ? <><p className="ctf-more-line">{roleDetail(m, c, 'p')}</p><p className="ctf-more-line">{roleDetail(m, c, 'x')}</p></>
                        : <p className="ctf-more-line">{countryMessage(m, c)} {presenceSentence(m, c)}</p>}
                    <div className="ctf-more-cta ctf-more-cta-3">
                        <a className="ctf-btn ctf-btn-p ctf-btn-sm" href={START_URL}>{m.drawn && c.x.open && !c.p.open ? 'Run an extender' : m.drawn && c.p.open && !c.x.open ? 'Run a provider' : 'Start mining'}</a>
                        <a className="ctf-btn ctf-btn-s ctf-btn-sm" href={countryPath(c.code)}>Country page</a>
                        <button type="button" className="ctf-btn ctf-btn-s ctf-btn-sm" onClick={() => onExpand(c.code)}>Close</button>
                    </div>
                </div>
            )}
        </article>
    );
});
