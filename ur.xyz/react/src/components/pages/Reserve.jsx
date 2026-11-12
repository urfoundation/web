import React, { useEffect, useMemo, useRef, useState } from 'react';
import { reserve, publishedPrograms, activePrograms } from '../../data/reserve';
import { isLive, useReserve } from '../../lib/useReserve';
import { FINNEY_ARCHIVE, FINNEY_RPC, multisigAccountId, ss58Encode } from '../../lib/subtensor';
import { copyText } from '../../lib/clipboard';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { formatList, interpolate, plural } from '../../i18n/format.js';
import XYChart from './reserve/XYChart';
import SplitBar from './reserve/SplitBar';
import { PRICE_HOSTS, PriceNote, UnitToggle, useDenom } from './reserve/Denom';
import { formatsFor, isoDay, daysBetween } from './reserve/format';
import { projectBalance, spliceLive, flowsOf, observedInflow, monthlyFlows, dailyFlows } from './reserve/projection';
import { RANGES, RangeToggle, ExpandButton } from './reserve/ChartControls';
import { MIN_SEEN, inflowPerDay, momentumOf } from './reserve/momentum';
import { fill } from './reserve/fill';
import { hasLocalizedVersion, localizedPathFor } from '../../../../astro/src/lib/route-localization.js';
import './Reserve.css';

/**
 * ReservePage — /reserve, the Network Capacity Reserve.
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and astro/src/components/routes/ReserveRoute.astro
 * both wrap it in the shared Disclaimer / Nav / Footer shell. Its words are
 * the `reserve` copy units (react/src/i18n/pages/reserve/: the hero, then
 * balance/, programs/ and custody/), in the page's language `lang`, which
 * also formats its figures and dates (reserve/format.js).
 *
 * The figures are read in the visitor's browser from Bittensor mainnet
 * through its public RPC endpoints (lib/subtensor.js, lib/useReserve.js): the
 * reserve coldkey's α stake and free TAO at the latest finalized block, the
 * SN25 pool and emission, how the miner allocation is routed, and the
 * balance history from the recipients' registration. The reserve is not a
 * fixed share of the emissions: momentum, the share paid to providers now,
 * comes out of the miner emissions and the reserve receives the rest,
 * miner emissions × (1 − momentum). The balance chart is the live history
 * with the projection continuing from it, and the monthly chart the
 * receipts and payments by month; the projection holds momentum at its
 * launch value until the chain shows one of its own (reserve/momentum.js).
 * Amounts are in α, with a TAO mark at the SN25 pool's own ratio; a visitor
 * may switch the figures to USD at the live α price (reserve/Denom.jsx),
 * which is the only time a price feed is contacted.
 *
 * The server render carries no chain data, no price and no calendar
 * (hydration stays deterministic); the client fills them in and keeps them
 * fresh. A template whose placeholders sit among text the server renders is
 * filled with fill() (reserve/fill.js), which keeps the text nodes the JSX
 * had; text that was one string is filled with interpolate().
 */

const [heroCopy, balanceCopy, programsCopy, custodyCopy] = await Promise.all([
    loadPageCopy('reserve'),
    loadPageCopy('reserve/balance'),
    loadPageCopy('reserve/programs'),
    loadPageCopy('reserve/custody'),
]);

// The emission schedule the chain confirms on every read, used for the
// projection until it does: 1 α per block (7,200 a day), an 18% owner share,
// and the remainder split evenly between validators and miners.
const FALLBACK_EMISSION = { alphaPerDay: 7200, ownerCut: 11_796 / 65_535 };
const minerPerDayOf = (em) => (em.alphaPerDay * (1 - em.ownerCut)) / 2;
// a monthly figure is a daily one over the mean calendar month
const DAYS_PER_MONTH = 30.44;

const shortKey = (key) => `${key.slice(0, 6)}…${key.slice(-4)}`;
const hostOf = (url) => new URL(url).host;

/** An address in the code face that breaks, if it must, only at its middle: two even rows. */
function Address({ value, codeRef }) {
    const half = Math.ceil(value.length / 2);
    return (
        <code ref={codeRef} className="reserve-address" translate="no">
            <span>{value.slice(0, half)}</span><wbr /><span>{value.slice(half)}</span>
        </code>
    );
}

/** The α sign inside uppercase text, kept lowercase (uppercased it is a capital Α). */
const Alpha = () => <span className="reserve-alpha">α</span>;

function Stat({ label, value, sub }) {
    return (
        <div className="reserve-stat">
            <span className="reserve-stat-label">{label}</span>
            <b>{value}</b>
            <small>{sub || ' '}</small>
        </div>
    );
}

/** A chart's key: a line, a dashed line or a swatch per series, mirroring the mark. Nothing for a single series. */
function Legend({ items }) {
    if (items.length < 2) return null;
    return (
        <span className="reserve-legend">
            {items.map((it) => (
                <span key={it.name}><i className={`is-${it.kind}`} style={{ '--c': it.color, opacity: it.opacity ?? 1 }} aria-hidden="true" />{it.name}</span>
            ))}
        </span>
    );
}

export default function ReservePage({ lang = 'en' }) {
    // the page's words (the hero; 01; 02 and 03; 04 and the fine print) and its formats
    const t = heroCopy(lang);
    const tb = balanceCopy(lang);
    const tp = programsCopy(lang);
    const tc = custodyCopy(lang);
    const f = formatsFor(lang);
    // a count in a plural phrase: { one: '{count} day', other: '{count} days' }
    const counted = (forms, count, values = {}) => interpolate(plural(lang, count, forms), { count, ...values });
    // a list of names: English with commas alone, as it always was; other languages as they list
    const listOf = (items) => (lang === 'en' ? items.join(', ') : formatList(items, lang));
    // an amount of α a day: "2,657 α a day"
    const perDayText = (v) => interpolate(t.perDay, { amount: f.whole(v) });

    const { snapshot, history, historyReady, error, updatedAt } = useReserve({ address: reserve.address, netuid: reserve.netuid, launch: reserve.launch });
    // the calendar is read on the client: the server render has no "today"
    const [today, setToday] = useState(null);
    useEffect(() => { setToday(isoDay(Date.now())); }, [updatedAt]);
    // α or USD; the USD path is reserve/Denom.jsx
    const denom = useDenom(lang);
    // the charts' window (7D | 30D | All) and the one card widened to the full row
    const [range, setRange] = useState('all');
    const [expanded, setExpanded] = useState(null);
    const toggleExpanded = (id) => setExpanded((e) => (e === id ? null : id));

    // the wallet's Copy button
    const [copied, setCopied] = useState(false);
    const addressRef = useRef(null);
    const copiedTimer = useRef(0);
    useEffect(() => () => clearTimeout(copiedTimer.current), []);
    const copyAddress = async () => {
        // say "Copied" only when it was; otherwise the address is left selected to copy by hand
        if (!(await copyText(reserve.address, addressRef.current))) return;
        setCopied(true);
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    const live = isLive(snapshot);
    const emission = snapshot ? snapshot.emission : { ...FALLBACK_EMISSION, ownerPerDay: FALLBACK_EMISSION.alphaPerDay * FALLBACK_EMISSION.ownerCut, validatorPerDay: minerPerDayOf(FALLBACK_EMISSION), minerPerDay: minerPerDayOf(FALLBACK_EMISSION) };
    const minerPerDay = emission.minerPerDay;
    // Momentum is the share of the miner emissions paid to providers now; the
    // reserve receives the rest, minerPerDay × (1 − momentum). The launch value
    // until the chain shows momentum of its own (reserve/momentum.js): what
    // goes to neither the reserve's hotkeys nor the burn, once it is at least
    // 0.1% of the miner allocation.
    const routing = snapshot?.routing;
    const otherShare = routing ? Math.max(0, 1 - routing.reserve - routing.burned) : 0;
    const launchMomentum = reserve.launchMomentumBps / 10_000;
    const { momentum, fromChain, burned: burnedShare } = momentumOf({ routing, live, launchMomentum });
    // the sentences that name where momentum's value comes from have one form for each
    const basis = fromChain ? 'onChain' : 'launch';
    const perDay = inflowPerDay(minerPerDay, momentum, burnedShare);
    const momentumPerDay = minerPerDay * momentum;
    // the worked line is labelled by where its momentum comes from
    const calcLabel = !fromChain ? t.formula.atLaunch : live ? interpolate(t.formula.atBlock, { block: f.whole(snapshot.block) }) : t.formula.atCurrent;
    // TAO per α at the pool's reserves: the one valuation the chain itself gives
    const priceTao = snapshot?.pool.priceTao ?? null;
    const daysToLaunch = today ? daysBetween(today, reserve.launch) : null;
    const firstRegistration = snapshot ? Math.min(...snapshot.hotkeys.map((h) => h.registeredAt).filter((b) => Number.isFinite(b) && b > 0), Infinity) : Infinity;

    // a launch day that has passed with nothing received: the projection
    // restarts from today instead of crediting days that did not happen
    const overdue = !live && daysToLaunch != null && daysToLaunch <= 0;
    const projectFrom = overdue ? today : reserve.launch;

    // ── the balance: live history, then the projection ──
    const chart = useMemo(() => {
        const livePoints = live && history?.length ? history : [];
        const { live: livePts, projected } = livePoints.length
            ? spliceLive({ live: livePoints, through: reserve.projectThrough, perDay })
            : { live: [], projected: live ? [] : projectBalance({ launch: projectFrom, through: reserve.projectThrough, perDay }) };
        const points = [...livePts, ...projected];
        const n = livePts.length;
        const liveValues = points.map((p, i) => (i < n ? p.alpha : undefined));
        // the projection starts at the last live point so the two series join
        const projValues = points.map((p, i) => (n === 0 || i >= n - 1 ? p.alpha : undefined));
        return { livePts, projected, points, liveValues, projValues: projected.length ? projValues : points.map(() => undefined) };
    }, [history, live, perDay, projectFrom]);
    const end = chart.points[chart.points.length - 1] || null;
    // receipts, payments and the observed inflow need the whole history, not
    // only the snapshot's own point. The observed rate starts at the first
    // receipt (the days between registration and the first payout are not a
    // rate) and needs at least a day of it.
    const flows = historyReady && chart.livePts.length ? flowsOf(chart.livePts) : null;
    const paidPts = chart.livePts.slice(Math.max(0, chart.livePts.findIndex((p) => p.alpha > 0)));
    const observedRaw = historyReady && paidPts.length ? observedInflow(paidPts) : null;
    const observed = observedRaw && observedRaw.days >= 1 ? observedRaw : null;
    // the same history and projection by calendar month
    const months = useMemo(() => monthlyFlows({ live: chart.livePts, projected: chart.projected }), [chart]);
    // the chart spans two Octobers, so its dates carry the year
    const yearSpan = chart.points.length > 0 && chart.points[0].date.slice(0, 4) !== end.date.slice(0, 4);
    const dateLabel = yearSpan ? f.shortDateYear : f.shortDate;

    // ── programs ──
    const earmarked = publishedPrograms.reduce((s, p) => s + Math.max(0, (p.ceilingAlpha || 0) - p.payments.reduce((t, x) => t + x.alpha, 0)), 0);
    const statusesPresent = Object.keys(reserve.programStatus).filter((s) => reserve.programs.some((p) => p.status === s));
    const countOf = (s) => reserve.programs.filter((p) => p.status === s).length;
    // "1 in preparation · 3 indicative": each status not yet active, with its own count phrase
    const statusCounts = statusesPresent.filter((s) => s !== 'active' && s !== 'complete')
        .map((s) => counted(tp.counts.byStatus[s] || { other: `{count} ${tp.statuses[s]}` }, countOf(s))).join(' · ');
    const activeCount = counted(tp.counts.active, activePrograms.length);
    const [filter, setFilter] = useState('all');
    const shownPrograms = reserve.programs.filter((p) => filter === 'all' || p.status === filter);
    // sizes and payments are columns only once a program has them
    const hasFigures = reserve.programs.some((p) => p.ceilingAlpha != null);

    // the signers' keys at the threshold must derive the reserve account itself
    const derivesAccount = useMemo(() => {
        try {
            return ss58Encode(multisigAccountId(reserve.custody.signers.map((s) => s.address), reserve.custody.multisigThreshold)) === reserve.address;
        } catch {
            return false;
        }
    }, []);

    // [lead, more, tail]: a phone shows the lead and the tail only
    const blockTail = snapshot ? ` · ${interpolate(t.status.block, { block: f.whole(snapshot.block) })}` : '';
    const status = !snapshot
        ? (error ? [t.status.unavailable, ` · ${t.status.retrying}`, ''] : [t.status.reading, '', ''])
        : live
            ? [t.status.live, ` · ${t.status.liveDetail}`, blockTail]
            : [overdue ? t.status.awaiting : t.status.preLaunch, ` · ${t.status.preDetail}`, blockTail];
    const statusState = !snapshot ? (error ? 'error' : 'loading') : live ? 'live' : 'pre';

    // ── the three figures ──
    const monthlyObserved = live && observed ? observed : null;
    const stats = [
        {
            label: t.stats.balance,
            value: snapshot ? denom.amount(snapshot.alpha) : '—',
            sub: !snapshot ? t.stats.balanceReading
                : !live ? t.stats.balanceNothing
                    : flows ? interpolate(t.stats.balanceFlows, { received: denom.short(flows.received), spent: denom.short(flows.spent) })
                        : t.stats.balanceReadingHistory,
        },
        {
            label: t.stats.inflow,
            value: denom.amount((monthlyObserved ? monthlyObserved.perDay : perDay) * DAYS_PER_MONTH),
            sub: monthlyObserved
                ? counted(t.stats.inflowObserved, monthlyObserved.days, { amount: f.whole(monthlyObserved.perDay) })
                : interpolate(t.stats.inflowProjected, { amount: f.whole(perDay) }),
        },
        {
            label: t.stats.committed,
            value: denom.amount(earmarked),
            sub: activePrograms.length
                ? counted(tp.counts.committedShare, activePrograms.length, { share: f.pct(earmarked / (perDay * 365), 0) })
                : `${tp.counts.noneActive} · ${statusCounts}`,
        },
    ];

    // ── the balance chart ──
    const sc = (v) => (v == null ? undefined : denom.scale(v));
    const balanceSeries = [
        ...(chart.livePts.length ? [{ name: tb.series.live, color: 'var(--rv-live)', type: 'area', values: chart.liveValues.map(sc) }] : []),
        ...(chart.projected.length ? [{ name: tb.series.projected, color: 'var(--rv-reserve)', type: 'dash', values: chart.projValues.map(sc), end: end ? denom.short(end.alpha) : undefined }] : []),
    ];
    const balanceLegend = [
        ...(chart.livePts.length ? [{ name: tb.series.live, kind: 'line', color: 'var(--rv-live)' }] : []),
        ...(chart.projected.length ? [{ name: tb.series.projected, kind: 'dash', color: 'var(--rv-reserve)' }] : []),
    ];
    const todayMarks = chart.livePts.length && chart.projected.length ? [{ index: chart.livePts.length - 1, label: tb.today }] : [];
    const balanceLabel = chart.livePts.length
        ? (chart.projected.length ? interpolate(tb.balance.label.liveProjected, { date: dateLabel(end.date) }) : tb.balance.label.live)
        : (end ? interpolate(tb.balance.label.projected, { date: dateLabel(end.date) }) : tb.balance.label.plain);
    const balanceNote = chart.livePts.length ? tb.balance.note.live[basis] : tb.balance.note.projected[basis];
    const unitWord = denom.rate != null ? tb.unitUsd : 'α';
    // (drawn only with a point: the live history, the projection or both)
    const lastLive = chart.livePts[chart.livePts.length - 1];
    const balanceAria = interpolate(
        chart.livePts.length ? (chart.projected.length ? tb.balance.aria.liveProjected : tb.balance.aria.live) : tb.balance.aria.projected,
        {
            unit: unitWord,
            liveDate: lastLive ? dateLabel(lastLive.date) : '',
            amount: chart.projected.length ? denom.short(end.alpha) : '',
            date: end ? dateLabel(end.date) : '',
        },
    );

    // the table twin of the balance chart: every live day, then the
    // projection's first day, month ends and last day
    const balanceRows = [
        ...chart.livePts.map((p, i) => ({ date: p.date, alpha: p.alpha, change: i === 0 ? null : p.alpha - chart.livePts[i - 1].alpha, kind: 'live' })),
        ...chart.projected
            .filter((p, i, arr) => i === 0 || i === arr.length - 1 || arr[i + 1].date.slice(5, 7) !== p.date.slice(5, 7))
            .map((p) => ({ date: p.date, alpha: p.alpha, change: null, kind: 'projected' })),
    ];

    // ── the monthly chart: receipts up, payments down, the projection on top ──
    const monthSeries = [
        ...(chart.livePts.length ? [
            { name: tb.series.received, color: 'var(--rv-live)', type: 'bar', stack: 'month', values: months.map((m) => denom.scale(m.received)) },
            { name: tb.series.spent, color: 'var(--rv-gray-1)', type: 'bar', stack: 'month', values: months.map((m) => -denom.scale(m.spent)), fmt: (v) => denom.fmt(-v) },
        ] : []),
        { name: tb.series.projectedInflow, color: 'var(--rv-reserve)', type: 'bar', stack: 'month', opacity: 0.45, values: months.map((m) => denom.scale(m.projected)) },
    ];
    const monthLegend = chart.livePts.length
        ? [
            { name: tb.series.received, kind: 'rect', color: 'var(--rv-live)' },
            { name: tb.series.spent, kind: 'rect', color: 'var(--rv-gray-1)' },
            { name: tb.series.projectedInflow, kind: 'rect', color: 'var(--rv-reserve)', opacity: 0.45 },
        ]
        : [];
    const monthHead = flows
        ? [interpolate(tb.flows.received, { amount: denom.amount(flows.received) }), ` ${interpolate(tb.flows.toPrograms, { amount: denom.amount(flows.spent) })}`]
        : live ? ['—', ` ${tb.flows.readingHistory}`]
            : snapshot ? [interpolate(tb.flows.perMonth, { amount: denom.amount(perDay * DAYS_PER_MONTH) }), ` ${tb.flows.projectedNoPrograms}`]
                : ['—', ''];
    const monthNote = chart.livePts.length ? tb.flows.note.live : tb.flows.note.projected;
    const monthAria = counted(chart.livePts.length ? tb.flows.aria.live : tb.flows.aria.projected, months.length, {
        unit: unitWord,
        from: months.length ? f.monthLong(months[0].month) : '',
        to: months.length ? f.monthLong(months[months.length - 1].month) : '',
    });

    // ── the 7D / 30D windows: the trailing days of the live history, no projection ──
    const rangeDays = RANGES.find((r) => r.id === range)?.days ?? null;
    const canWindow = historyReady && chart.livePts.length > 1;
    const windowed = rangeDays != null && canWindow;
    const windowPts = windowed ? chart.livePts.slice(-(rangeDays + 1)) : [];
    const windowSpan = windowed ? daysBetween(windowPts[0].date, windowPts[windowPts.length - 1].date) : 0;
    // fewer days of history than the window asks for: say how many there are
    const overWindow = (forms, values) => counted(forms, windowSpan, values);
    const windowChange = windowed ? windowPts[windowPts.length - 1].alpha - windowPts[0].alpha : 0;
    const days = windowed ? dailyFlows(windowPts) : [];
    const dayTotals = days.reduce((t, d) => ({ received: t.received + d.received, spent: t.spent + d.spent }), { received: 0, spent: 0 });
    const windowBalance = {
        label: overWindow(tb.balance.label.window),
        legend: [{ name: tb.series.live, kind: 'line', color: 'var(--rv-live)' }],
        dim: ` ${overWindow(tb.balance.windowChange, { change: `${windowChange >= 0 ? '+' : '−'}${denom.short(Math.abs(windowChange))}` })}`,
        labels: windowPts.map((p) => f.shortDate(p.date)),
        series: [{ name: tb.series.live, color: 'var(--rv-live)', type: 'area', values: windowPts.map((p) => sc(p.alpha)) }],
        aria: overWindow(tb.balance.aria.window, { unit: unitWord }),
        note: tb.balance.note.window,
        rows: windowPts.map((p, i) => ({ date: p.date, alpha: p.alpha, change: i === 0 ? null : p.alpha - windowPts[i - 1].alpha, kind: 'live' })),
    };
    const windowFlows = {
        label: tb.flows.windowLabel,
        legend: [{ name: tb.series.received, kind: 'rect', color: 'var(--rv-live)' }, { name: tb.series.spent, kind: 'rect', color: 'var(--rv-gray-1)' }],
        head: [interpolate(tb.flows.received, { amount: denom.amount(dayTotals.received) }), ` ${overWindow(tb.flows.toProgramsWindow, { amount: denom.amount(dayTotals.spent) })}`],
        labels: days.map((d) => f.shortDate(d.date)),
        tipLabels: days.map((d) => f.shortDateYear(d.date)),
        series: [
            { name: tb.series.received, color: 'var(--rv-live)', type: 'bar', stack: 'day', values: days.map((d) => denom.scale(d.received)) },
            { name: tb.series.spent, color: 'var(--rv-gray-1)', type: 'bar', stack: 'day', values: days.map((d) => -denom.scale(d.spent)), fmt: (v) => denom.fmt(-v) },
        ],
        aria: overWindow(tb.flows.aria.window, { unit: unitWord }),
        note: tb.flows.note.window,
    };
    const chartHeight = (id) => (expanded === id ? 420 : undefined);

    return (
        <div className="reserve-page">
            <header className="reserve-hero reserve-shell">
                <span className="reserve-eyebrow">{t.hero.eyebrow}</span>
                <h1>{t.hero.name}</h1>
                <p className="reserve-tagline">{t.hero.tagline}</p>
                <div className="reserve-rule" aria-hidden="true" />
                <p className="reserve-lede">{t.hero.lede}</p>
                <div className="reserve-facts">
                    <div className="reserve-formula">
                        <span className="reserve-fact-label">{t.formula.label}</span>
                        <p className="reserve-formula-eq">
                            <span className="reserve-nw"><span className="is-reserve">{t.formula.reserve}</span> =</span>{' '}
                            <span className="reserve-nw">{`${t.formula.minerEmissions} ×`}</span>{' '}
                            <span className="reserve-nw">(1 − <span className="is-momentum">{t.formula.momentum}</span>)</span>
                        </p>
                        <p className="reserve-formula-calc">
                            <span className="reserve-nw">{calcLabel}</span>{' '}
                            <span className="reserve-nw">{fill(t.perDay, { amount: f.whole(perDay) })}</span>{' '}
                            <span className="reserve-nw">{fill(`= ${t.perDay}`, { amount: f.whole(minerPerDay) })}</span>{' '}
                            <span className="reserve-nw">{`× (1 − ${t.formula.momentum}`}{burnedShare >= 0.0005 ? ` − ${interpolate(t.formula.burned, { share: f.pct(burnedShare) })}` : ''})</span>
                        </p>
                        <p className="reserve-formula-def">
                            {fill(t.formula.definition, { term: <dfn>{t.formula.term}</dfn> })}
                            {live && !fromChain && routing ? ` ${interpolate(t.formula.noMomentumYet, { block: f.whole(snapshot.block), min: f.pct(MIN_SEEN, 1) })}` : ''}
                        </p>
                    </div>
                    <div className="reserve-wallet">
                        <span className="reserve-fact-label">{t.wallet.label}</span>
                        <div className="reserve-wallet-row">
                            <Address value={reserve.address} codeRef={addressRef} />
                            <span className="reserve-wallet-actions">
                                <button type="button" className="reserve-copy" data-state={copied ? 'copied' : undefined} onClick={copyAddress}>
                                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        {copied
                                            ? <path d="M3.2 8.4l3 3 6.6-6.8" />
                                            : <><rect x="5.5" y="5.5" width="8" height="8" rx="1.6" /><path d="M10.5 5.5V4.1a1.6 1.6 0 0 0-1.6-1.6H4.1a1.6 1.6 0 0 0-1.6 1.6v4.8a1.6 1.6 0 0 0 1.6 1.6h1.4" /></>}
                                    </svg>
                                    {/* both words are laid in one cell, so the button is the same size in either state */}
                                    <span className="reserve-copy-label">
                                        <span data-shown={!copied}>{t.wallet.copy}</span>
                                        <span data-shown={copied}>{t.wallet.copied}</span>
                                    </span>
                                    <span className="reserve-visually-hidden">{` ${t.wallet.copyTarget}`}</span>
                                </button>
                                <a className="reserve-wallet-link" href={reserve.explorerUrl} target="_blank" rel="noopener noreferrer">{`${t.wallet.viewOnTaostats} `}<span aria-hidden="true">↗</span></a>
                            </span>
                            <span className="reserve-visually-hidden" role="status">{copied ? t.wallet.copiedStatus : ''}</span>
                        </div>
                    </div>
                </div>
                {/* the chain's status and the display unit: one row above the figures */}
                <div className="reserve-bar">
                    <p className="reserve-status" data-state={statusState}>
                        <i aria-hidden="true" />
                        <span>{status[0]}<span className="reserve-status-more">{status[1]}</span>{status[2]}</span>
                    </p>
                    <UnitToggle denom={denom} lang={lang} />
                </div>
                <div className="reserve-proof">
                    {stats.map((s) => <Stat key={s.label} {...s} />)}
                </div>
                <PriceNote denom={denom} lang={lang} />
                {/* in the page's HTML, for a reader or an agent that does not run it:
                    where the figures come from and where to check them */}
                <p className="reserve-verify">
                    {fill(t.verify, {
                        address: <code translate="no">{reserve.address}</code>,
                        explorer: <a href={reserve.explorerUrl} target="_blank" rel="noopener noreferrer">Taostats</a>,
                    })}
                </p>
            </header>

            <section className="reserve-block" id="balance" aria-labelledby="reserve-balance-h">
                <div className="reserve-shell">
                    <span className="reserve-kicker">{tb.kicker}</span>
                    <h2 id="reserve-balance-h">{tb.title}</h2>
                    <p className="reserve-sub">
                        {chart.livePts.length
                            ? interpolate(tb.sub.live[basis], { date: dateLabel(reserve.projectThrough) })
                            : tb.sub.projected[basis]}
                    </p>

                    {canWindow && (
                        <div className="reserve-chart-bar">
                            <RangeToggle range={range} onChange={setRange} t={tb.controls} />
                        </div>
                    )}
                    <div className="reserve-charts">
                        <div className={`reserve-card reserve-chart-card${expanded === 'balance' ? ' is-expanded' : ''}`}>
                            <div className="reserve-card-head">
                                <span className="reserve-card-label">{windowed ? windowBalance.label : balanceLabel}</span>
                                <ExpandButton expanded={expanded === 'balance'} onToggle={() => toggleExpanded('balance')} label={tb.controls.balanceChart} t={tb.controls} />
                            </div>
                            <div className="reserve-card-legend"><Legend items={windowed ? windowBalance.legend : balanceLegend} /></div>
                            <p className="reserve-card-num">
                                <span>{snapshot ? denom.amount(snapshot.alpha) : '—'}</span>
                                {windowed && <span className="is-dim">{windowBalance.dim}</span>}
                                {!windowed && end && chart.projected.length > 0 && <span className="is-dim">{fill(` ${tb.balance.projectedTo}`, { amount: denom.short(end.alpha), date: dateLabel(end.date) })}</span>}
                            </p>
                            {chart.points.length === 0 && <p className="reserve-chart-note">{tb.nothingToChart}</p>}
                            {windowed && (
                                <XYChart
                                    key={`balance-${range}`}
                                    labels={windowBalance.labels}
                                    series={windowBalance.series}
                                    fmt={denom.fmt}
                                    axisFmt={denom.axis}
                                    height={chartHeight('balance')}
                                    aria={windowBalance.aria}
                                    emptyLabel={tb.nothingThisPeriod}
                                />
                            )}
                            {!windowed && chart.points.length > 0 && (
                                <XYChart
                                    key="balance-all"
                                    labels={chart.points.map((p) => dateLabel(p.date))}
                                    series={balanceSeries}
                                    marks={todayMarks}
                                    fmt={denom.fmt}
                                    axisFmt={denom.axis}
                                    height={chartHeight('balance')}
                                    aria={balanceAria}
                                    emptyLabel={tb.nothingThisPeriod}
                                />
                            )}
                            <p className="reserve-card-note">
                                {windowed ? windowBalance.note : balanceNote}
                                {live && !historyReady ? ` ${tb.balance.note.readingHistory}` : ''}
                            </p>
                            {(windowed ? windowBalance.rows : balanceRows).length > 0 && (
                                <details className="reserve-table">
                                    <summary><span>{`${tb.table.show} · `}<Alpha /></span></summary>
                                    <div className="reserve-table-scroll">
                                        <table>
                                            <thead><tr><th scope="col">{tb.table.day}</th><th scope="col">{tb.table.balance}</th><th scope="col">{tb.table.change}</th><th scope="col">{tb.table.basis}</th></tr></thead>
                                            <tbody>
                                                {(windowed ? windowBalance.rows : balanceRows).map((r) => (
                                                    <tr key={`${r.kind}-${r.date}`}>
                                                        <td>{f.shortDateYear(r.date)}</td>
                                                        <td>{f.alpha(r.alpha, 1)}</td>
                                                        <td>{r.change == null ? '—' : `${r.change >= 0 ? '+' : '−'}${f.alpha(Math.abs(r.change), 1)}`}</td>
                                                        <td>{r.kind === 'live' ? tb.table.chain : tb.table.basisProjected}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                        </div>

                        <div className={`reserve-card reserve-chart-card${expanded === 'flows' ? ' is-expanded' : ''}`}>
                            <div className="reserve-card-head">
                                <span className="reserve-card-label">{windowed ? windowFlows.label : tb.flows.label}</span>
                                <ExpandButton expanded={expanded === 'flows'} onToggle={() => toggleExpanded('flows')} label={tb.controls.flowsChart} t={tb.controls} />
                            </div>
                            <div className="reserve-card-legend"><Legend items={windowed ? windowFlows.legend : monthLegend} /></div>
                            <p className="reserve-card-num">
                                <span>{windowed ? windowFlows.head[0] : monthHead[0]}</span>
                                {(windowed ? windowFlows.head[1] : monthHead[1]) && <span className="is-dim">{windowed ? windowFlows.head[1] : monthHead[1]}</span>}
                            </p>
                            {!windowed && months.length === 0 && <p className="reserve-chart-note">{tb.nothingToChart}</p>}
                            {windowed && (
                                <XYChart
                                    key={`flows-${range}`}
                                    labels={windowFlows.labels}
                                    tipLabels={windowFlows.tipLabels}
                                    series={windowFlows.series}
                                    fmt={denom.fmt}
                                    axisFmt={denom.axis}
                                    height={chartHeight('flows')}
                                    aria={windowFlows.aria}
                                    emptyLabel={tb.nothingThisPeriod}
                                />
                            )}
                            {!windowed && months.length > 0 && (
                                <XYChart
                                    key="flows-all"
                                    labels={months.map((m) => f.monthLabel(m.month))}
                                    tipLabels={months.map((m) => f.monthLong(m.month))}
                                    series={monthSeries}
                                    fmt={denom.fmt}
                                    axisFmt={denom.axis}
                                    height={chartHeight('flows')}
                                    aria={monthAria}
                                    emptyLabel={tb.nothingThisPeriod}
                                />
                            )}
                            <p className="reserve-card-note">{windowed ? windowFlows.note : monthNote}</p>
                            {windowed && days.length > 0 && (
                                <details className="reserve-table">
                                    <summary><span>{`${tb.table.show} · `}<Alpha /></span></summary>
                                    <div className="reserve-table-scroll">
                                        <table>
                                            <thead><tr><th scope="col">{tb.table.day}</th><th scope="col">{tb.table.received}</th><th scope="col">{tb.table.spent}</th></tr></thead>
                                            <tbody>
                                                {days.map((d) => (
                                                    <tr key={d.date}>
                                                        <td>{f.shortDateYear(d.date)}</td>
                                                        <td>{d.received ? f.alpha(d.received, 1) : '—'}</td>
                                                        <td>{d.spent ? f.alpha(d.spent, 1) : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                            {!windowed && months.length > 0 && (
                                <details className="reserve-table">
                                    <summary><span>{`${tb.table.show} · `}<Alpha /></span></summary>
                                    <div className="reserve-table-scroll">
                                        <table>
                                            <thead><tr><th scope="col">{tb.table.month}</th><th scope="col">{tb.table.received}</th><th scope="col">{tb.table.spent}</th><th scope="col">{tb.table.projected}</th></tr></thead>
                                            <tbody>
                                                {months.map((m) => (
                                                    <tr key={m.month}>
                                                        <td>{f.monthLabel(m.month)}</td>
                                                        <td>{m.received ? f.alpha(m.received, 1) : '—'}</td>
                                                        <td>{m.spent ? f.alpha(m.spent, 1) : '—'}</td>
                                                        <td>{m.projected ? f.alpha(m.projected, 1) : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>

                    {flows && flows.received > 0 && (flows.spent > 0 || earmarked > 0) && (
                        <SplitBar
                            title={tb.splits.received.title}
                            meta={denom.short(flows.received)}
                            fmt={(v) => denom.short(v)}
                            segments={[
                                { label: tb.splits.received.spent, value: flows.spent, color: 'var(--rv-gray-1)' },
                                { label: tb.splits.received.committed, value: Math.min(earmarked, Math.max(0, flows.received - flows.spent)), color: 'var(--rv-reserve)', className: 'is-earmarked' },
                                { label: tb.splits.received.unallocated, value: Math.max(0, flows.received - flows.spent - earmarked), color: 'var(--rv-reserve)' },
                            ]}
                            t={tb.splits.bar}
                            lang={lang}
                        />
                    )}

                    <h3 className="reserve-h3">{tb.splits.heading}</h3>
                    <div className="reserve-splits">
                        <SplitBar
                            title={tb.splits.emission.title}
                            meta={perDayText(emission.alphaPerDay)}
                            fmt={perDayText}
                            segments={[
                                { label: tb.splits.emission.owner, value: emission.ownerPerDay, color: 'var(--rv-gray-2)' },
                                { label: tb.splits.emission.validators, value: emission.validatorPerDay, color: 'var(--rv-gray-1)' },
                                { label: tb.splits.emission.miners, value: emission.minerPerDay, color: 'var(--rv-reserve)' },
                            ]}
                            note={interpolate(tb.splits.emission.note, { share: f.pct(emission.ownerCut, 0) })}
                            t={tb.splits.bar}
                            lang={lang}
                        />
                        {routing ? (
                            <SplitBar
                                title={tb.splits.onChain.title}
                                showPercentages={false}
                                meta={perDayText(minerPerDay)}
                                fmt={perDayText}
                                segments={[
                                    { label: tb.splits.onChain.momentum, value: minerPerDay * otherShare, color: 'var(--rv-providers)' },
                                    { label: tb.splits.onChain.reserve, value: minerPerDay * routing.reserve, color: 'var(--rv-reserve)' },
                                    { label: tb.splits.onChain.burned, value: minerPerDay * routing.burned, color: 'var(--rv-burn)' },
                                ]}
                                note={live
                                    ? tb.splits.onChain.noteLive
                                    : fromChain
                                        ? interpolate(tb.splits.onChain.noteOnChain, { momentum: f.whole(momentumPerDay), reserve: f.whole(perDay) })
                                        : interpolate(tb.splits.onChain.notePreLaunch, { date: f.shortDate(reserve.launch), momentum: f.whole(momentumPerDay), reserve: f.whole(perDay) })}
                                t={tb.splits.bar}
                                lang={lang}
                            />
                        ) : (
                            <SplitBar
                                title={interpolate(tb.splits.planned.title, { date: f.shortDate(reserve.launch) })}
                                showPercentages={false}
                                meta={perDayText(minerPerDay)}
                                fmt={perDayText}
                                segments={[
                                    { label: tb.splits.planned.momentum, value: momentumPerDay, color: 'var(--rv-providers)' },
                                    { label: tb.splits.planned.reserve, value: perDay, color: 'var(--rv-reserve)' },
                                ]}
                                note={tb.splits.planned.note}
                                t={tb.splits.bar}
                                lang={lang}
                            />
                        )}
                    </div>
                </div>
            </section>

            <section className="reserve-block" id="program-types" aria-labelledby="reserve-types-h">
                <div className="reserve-shell">
                    <span className="reserve-kicker">{tp.types.kicker}</span>
                    <h2 id="reserve-types-h">{tp.types.title}</h2>
                    <p className="reserve-sub">{tp.types.sub}</p>
                    <div className="reserve-boundary">
                        {reserve.programTypes.map((type, i) => {
                            const words = tp.types.list[i];
                            return (
                                <article key={type.tag}>
                                    <b className="reserve-type-tag">{words.tag}</b>
                                    <h3>{words.title}</h3>
                                    <p>{words.summary}</p>
                                    <dl>
                                        <div><dt>{tp.types.verifiedBy}</dt><dd>{words.verifiedBy}</dd></div>
                                        <div><dt>{tp.types.paidAs}</dt><dd>{words.paidAs}</dd></div>
                                    </dl>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="reserve-block" id="programs" aria-labelledby="reserve-programs-h">
                <div className="reserve-shell">
                    <span className="reserve-kicker">{tp.programs.kicker}</span>
                    <h2 id="reserve-programs-h">{tp.programs.title}</h2>
                    <p className="reserve-sub">
                        {tp.programs.sub}{activePrograms.length === 0 ? ` ${tp.programs.noneActiveYet}` : ''}
                    </p>
                    <div className="reserve-programs-bar">
                        <div className="reserve-chips" role="group" aria-label={tp.programs.filterAria}>
                            <span className="reserve-card-label">{tp.programs.label}</span>
                            {statusesPresent.length > 1 && (
                                <>
                                    <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{`${tp.programs.all} · `}{reserve.programs.length}</button>
                                    {statusesPresent.map((s) => (
                                        <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                                            {tp.statuses[s]} · {countOf(s)}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                        <span className="reserve-programs-count">
                            {earmarked > 0
                                ? `${interpolate(tp.programs.committed, { amount: denom.short(earmarked) })} · ${activeCount}`
                                : `${tp.programs.nothingCommitted} · ${activePrograms.length ? activeCount : tp.counts.noneActive}`}
                        </span>
                    </div>
                    <div className="reserve-card reserve-table-card">
                        <table className="reserve-programs" role="table">
                            <thead>
                                <tr role="row">
                                    <th role="columnheader" scope="col">{tp.programs.head.program}</th>
                                    <th role="columnheader" scope="col">{tp.programs.head.type}</th>
                                    <th role="columnheader" scope="col">{tp.programs.head.pays}</th>
                                    {hasFigures && <th role="columnheader" scope="col" className="is-num">{tp.programs.head.size}</th>}
                                    {hasFigures && <th role="columnheader" scope="col">{tp.programs.head.paid}</th>}
                                    <th role="columnheader" scope="col">{tp.programs.head.status}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shownPrograms.map((p) => {
                                    const words = tp.programs.list[reserve.programs.indexOf(p)];
                                    // a program's type reads as its type's title (02 above)
                                    const typeAt = reserve.programTypes.findIndex((type) => type.title === p.type);
                                    const typeTitle = typeAt >= 0 ? tp.types.list[typeAt].title : p.type;
                                    const payRule = p.payRule ? words.payRule : null;
                                    const paid = p.payments.reduce((s, x) => s + x.alpha, 0);
                                    return (
                                        <tr key={p.id} role="row">
                                            <td role="cell" data-label="Program">
                                                <b>{words.title}</b>
                                                <span className="reserve-program-sum">{words.summary}</span>
                                                {/* the phone card's one meta line; the columns are hidden there */}
                                                <span className="reserve-program-meta">{[typeTitle, payRule || tp.programs.termsTbd, ...(p.ceilingAlpha != null ? [interpolate(tp.programs.ceiling, { amount: denom.short(p.ceilingAlpha) }), interpolate(tp.programs.paidShare, { share: f.pct(paid / p.ceilingAlpha, 0) })] : [])].join(' · ')}</span>
                                            </td>
                                            <td role="cell" data-label="Type" className="reserve-program-col">{typeTitle}</td>
                                            <td role="cell" data-label="Pays" className="reserve-program-col">{payRule || <span className="is-dim">{tp.programs.termsTbd}</span>}</td>
                                            {hasFigures && <td role="cell" data-label="Size" className="is-num reserve-program-col">{p.ceilingAlpha != null ? denom.short(p.ceilingAlpha) : '—'}</td>}
                                            {hasFigures && (
                                                <td role="cell" data-label="Paid" className="reserve-program-col">
                                                    {p.ceilingAlpha != null ? (
                                                        <span className="reserve-paid" aria-label={interpolate(tp.programs.paidAria, { paid: f.alpha(paid), ceiling: f.alpha(p.ceilingAlpha) })}>
                                                            <span className="reserve-use" aria-hidden="true"><i style={{ width: `${Math.min(100, (paid / p.ceilingAlpha) * 100)}%` }} /></span>
                                                            <span>{f.pct(paid / p.ceilingAlpha, 0)}</span>
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                            )}
                                            <td role="cell" data-label="Status" className="reserve-program-status"><span className="reserve-pill" data-status={p.status}>{tp.statuses[p.status]}</span></td>
                                        </tr>
                                    );
                                })}
                                {shownPrograms.length === 0 && (
                                    <tr role="row"><td role="cell" colSpan={hasFigures ? 6 : 4} className="reserve-programs-empty">{tp.programs.empty}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="reserve-block" id="process" aria-labelledby="reserve-process-h">
                <div className="reserve-shell">
                    <span className="reserve-kicker">{tc.process.kicker}</span>
                    <h2 id="reserve-process-h">{tc.process.title}</h2>
                    <div className="reserve-steps">
                        {reserve.steps.map((s, i) => (
                            <div key={s.title}>
                                <span className="reserve-k">{String(i + 1).padStart(2, '0')}</span>
                                <b>{tc.process.steps[i].title}</b>
                                <p>{tc.process.steps[i].detail}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="reserve-custody-h">{tc.custody.heading}</h3>
                    <div className="reserve-custody-cards">
                        <div className="reserve-card reserve-custody-card">
                            <div className="reserve-card-head">
                                <span className="reserve-card-label">{fill(tc.custody.accountLabel, { threshold: tc.custody.threshold })}</span>
                                {snapshot && <span className="reserve-pill" data-status={live ? 'active' : 'preparing'}>{live ? tc.custody.onChain : tc.custody.awaitingFunds}</span>}
                            </div>
                            <Address value={reserve.address} />
                            <p className="reserve-card-text">
                                {tc.custody.modeNote}
                                {snapshot ? ` ${interpolate(tc.custody.holds, { tao: f.fixed(snapshot.account.freeTao, 4), block: f.whole(snapshot.block) })}` : ''}
                            </p>
                            <dl className="reserve-recipients">
                                <dt>{tc.custody.recipients}</dt>
                                {!snapshot ? <dd>—</dd> : snapshot.hotkeys.length === 0 ? <dd>{tc.custody.notRegistered}</dd> : snapshot.hotkeys.map((h) => (
                                    <dd key={h.hotkey}>
                                        <code title={h.hotkey} translate="no">{shortKey(h.hotkey)}</code> UID {h.uid ?? '—'}{h.registeredAt ? ` · ${interpolate(tc.custody.registeredAt, { block: f.whole(h.registeredAt) })}` : ''}
                                    </dd>
                                ))}
                            </dl>
                            <a className="reserve-wallet-link" href={reserve.explorerUrl} target="_blank" rel="noopener noreferrer">{`${t.wallet.viewOnTaostats} `}<span aria-hidden="true">↗</span></a>
                        </div>
                        <div className="reserve-card reserve-custody-card">
                            <div className="reserve-card-head">
                                <span className="reserve-card-label">{fill(tc.custody.signersLabel, { threshold: tc.custody.threshold })}</span>
                            </div>
                            <ul className="reserve-signers">
                                {reserve.custody.signers.map((s, i) => (
                                    <li key={s.label}><span>{tc.custody.signers[i].label}</span><Address value={s.address} /></li>
                                ))}
                            </ul>
                            <p className="reserve-card-text">
                                {tc.custody.thresholdNote}{' '}
                                {derivesAccount
                                    ? counted(tc.custody.derives, reserve.custody.signers.length, { threshold: reserve.custody.multisigThreshold })
                                    : tc.custody.notDerived}
                                {' '}{tc.custody.identities}
                            </p>
                        </div>
                    </div>

                    <div className="reserve-ctas">
                        <a className="reserve-cta" href={reserve.contactUrl} target="_blank" rel="noopener noreferrer">{`${tc.ctas.talk} `}<span aria-hidden="true">↗</span></a>
                        <a className="reserve-link" href={hasLocalizedVersion(reserve.minerGuideUrl) ? localizedPathFor(reserve.minerGuideUrl, lang) : reserve.minerGuideUrl}>{`${tc.ctas.guide} `}<span aria-hidden="true">→</span></a>
                        <a className="reserve-link" href={reserve.policyUrl} target="_blank" rel="noopener noreferrer">{`${tc.ctas.policy} `}<span aria-hidden="true">↗</span></a>
                    </div>
                </div>
            </section>

            <section className="reserve-block reserve-fine-block" aria-label={tc.fine.aria}>
                <div className="reserve-shell">
                    <p className="reserve-fine">
                        <span><b>{tc.fine.mechanism.label}</b>{fill(` ${interpolate(tc.fine.mechanism.body, { min: f.pct(MIN_SEEN, 1) })}`, {
                            emission: f.whole(emission.alphaPerDay),
                            ownerShare: f.pct(emission.ownerCut, 0),
                            minerAllocation: f.whole(minerPerDay),
                            date: f.shortDate(reserve.launch),
                        })}</span>
                        {snapshot && !live && (
                            <span><b>{overdue ? tc.fine.beforeLaunch.labelOverdue : tc.fine.beforeLaunch.label}</b>{` ${interpolate(tc.fine.beforeLaunch.body[basis], { block: f.whole(snapshot.block), time: f.timeUtc(snapshot.time), share: f.pct(snapshot.routing.burned, 0) })}`}</span>
                        )}
                        {snapshot && live && (
                            <span><b>{tc.fine.balance.label}</b>{` ${interpolate(tc.fine.balance.held, { coldkey: shortKey(reserve.address), block: f.whole(snapshot.block), time: f.timeUtc(snapshot.time) })} ${Number.isFinite(firstRegistration)
                                ? interpolate(tc.fine.balance.flows[basis], { registered: f.whole(firstRegistration) })
                                : tc.fine.balance.flows[`${basis}NoBlock`]}`}</span>
                        )}
                        {priceTao && (
                            <span><b>{tc.fine.valuation.label}</b>{` ${interpolate(tc.fine.valuation.tao, { price: f.fixed(priceTao, 6) })} ${denom.usd
                                ? (denom.rate != null
                                    ? interpolate(tc.fine.valuation.usd, { price: f.usd(denom.rate), source: denom.sourceLabel, time: f.timeUtc(denom.at) })
                                    : tc.fine.valuation.noPrice)
                                : tc.fine.valuation.inAlpha}`}</span>
                        )}
                        <span><b>{tc.fine.sources.label}</b>{fill(` ${tc.fine.sources.body}`, {
                            rpcHosts: listOf(FINNEY_RPC.map(hostOf)),
                            archiveHosts: listOf(FINNEY_ARCHIVE.map(hostOf)),
                            priceHosts: listOf(PRICE_HOSTS),
                            account: reserve.accountId,
                        })}</span>
                    </p>
                </div>
            </section>
        </div>
    );
}
