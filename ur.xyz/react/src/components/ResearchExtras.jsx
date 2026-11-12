import React, { useEffect, useState } from 'react';
import './ResearchExtras.css';
import { openResearchArea, researchAreaId } from './research-areas.js';
import { APEX_COMPETITION, competitionPhase, competitionResultsText, countdown, sentenceGap } from './research-competition.js';
import ResearchLoops, { ResearchLoopsKey } from './ResearchLoops';
import { groupPageHref } from '../../../astro/src/lib/route-localization.js';

/**
 * Research page extras — the algo-competition card, the algorithm areas,
 * the anonymization and researchers notes, and the audits foot.
 *
 * Every component here is prop-driven (dict passed as `t`, or the
 * competition's own strings as `copy`), so the Astro build renders them per
 * language and the React SPA reuses them under its LanguageProvider. The
 * competition card is the one with state (its countdown runs on the
 * visitor's clock), so the Astro pages hydrate it with just its strings.
 * The areas are native <details> — their content is in the HTML and works
 * with no JS; the one behavior (a /research#<id> deep link opens its area)
 * is a mount effect here and an inline script on the static pages
 * (research-areas.js), so they hydrate nothing.
 */

// the competition and its schedule are in research-competition.js; the Astro
// pages take the phase at build time from here
export { APEX_COMPETITION, competitionPhase };
export const APEX_COMPETITION_URL = APEX_COMPETITION.url;
export const MASA_2025_AUDIT_URL = '/audits/masa-l2-2025.pdf';
// the code the competition optimizes, linked from the card's body
export const UR_CODE_URL = 'https://github.com/urnetwork';
// the published report of each audit, by the item id in research.audits
const AUDIT_REPORT_URLS = { 'masa-l2-2025': MASA_2025_AUDIT_URL };

// The competition's preview art (public/apex-sim-latency.*), remapped from
// its white ground to the site's #101010 and #F8F8F8 so it sits inside the
// card as drawn. A 900px webp serves phones; the jpg is the fallback. It is the
// first thing on the research page and its largest paint, so it loads eagerly
// and at high priority. The dictionary may word its alt text
// (research.competition.imageAlt); English is the fallback.
const APEX_HERO = {
    webp: '/apex-sim-latency.webp',
    webpSmall: '/apex-sim-latency-900.webp',
    jpg: '/apex-sim-latency.jpg',
    width: 1672,
    height: 941,
    alt: 'Two nodes joined by routes through a barrier: the Apex sim-latency competition',
};

const external = { target: '_blank', rel: 'noopener noreferrer' };

/**
 * The card's body: the dictionary sentence with its `{code}` placeholder
 * replaced by a link to the code (labelled by research.competition.codeLabel).
 * Without a label the string is shown as written.
 */
function competitionBody(body, codeLabel) {
    const text = String(body || '');
    if (!codeLabel || !text.includes('{code}')) return text;
    return text.split('{code}').flatMap((part, i) => (i === 0 ? [part] : [
        <a key={i} className="research-competition-code" href={UR_CODE_URL} {...external}>{codeLabel}</a>,
        part,
    ]));
}

// Until the start the countdown turns every second; once the competition is
// live only its end is left to come, so a minute will do; then it stops.
const clockStep = (now) => ({ upcoming: 1000, live: 60_000 })[competitionPhase(now)] || 0;

/**
 * The visitor's clock (ms), read just past each whole step of the device's
 * clock (so the countdown turns over with it) and again when a hidden tab
 * comes back (browsers slow a background tab's timers). Null in the server
 * render and the hydration render, so they match the HTML: a number before
 * the effect would be a guess.
 */
function useClock(stepAt) {
    const [now, setNow] = useState(null);
    useEffect(() => {
        let timer = 0;
        const tick = () => {
            clearTimeout(timer);
            const time = Date.now();
            setNow(time);
            const step = stepAt(time);
            if (step) timer = setTimeout(tick, step - (time % step) + 20);
        };
        const wake = () => { if (!document.hidden) tick(); };
        tick();
        document.addEventListener('visibilitychange', wake);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', wake);
        };
    }, [stepAt]);
    return now;
}

const CLOCK_UNITS = ['days', 'hours', 'minutes', 'seconds'];

// the dot between the start's day and its time never begins a line
const keepDot = (text) => String(text || '').replace(/ · /g, ' · ');

/**
 * One value on the clock, two digits or more, each digit in a cell of its
 * own: a digit that changes is a new element, so it rolls in (CSS) while the
 * others stand still. Before the clock has a time, every cell holds a dash.
 */
function ClockValue({ value }) {
    const text = value == null ? '--' : String(value).padStart(2, '0');
    return (
        <span className="research-competition-value">
            {[...text].map((digit, i) => (
                // keyed from the right, so the ones keep their cell when the days drop below 100
                <span className="research-competition-digit" key={text.length - i}>
                    <span key={digit}>{digit}</span>
                </span>
            ))}
        </span>
    );
}

/**
 * The band under the card's art. Until the start: the status ("Starts in")
 * over a countdown of days, hours, minutes and seconds, with the start
 * written under it. From the start the status alone takes the clock's place
 * ("Live now", with a pulse), at the clock's height, so nothing under the
 * band moves when it turns. The status is a polite live region, so the turn
 * is announced once; the clock is a timer, which is never announced as it
 * ticks (a reader meets it in reading order).
 *
 * The band's text follows the clock, not an edit, so the sitemap's content
 * fingerprint skips it (data-volatile, astro/scripts/page-dates.mjs; it may
 * not nest a div of its own), and the visual parity test masks the ticking
 * digits (data-parity-ignore).
 */
function CompetitionClock({ c, phase, now }) {
    const upcoming = phase === 'upcoming';
    const left = now == null ? null : countdown(now);
    const lastMinute = upcoming && left && !left.days && !left.hours && !left.minutes;
    const status = { upcoming: c.statusUpcoming, live: c.statusLive, ended: c.statusEnded }[phase];
    return (
        <div className="research-competition-clock" data-phase={phase} data-last-minute={lastMinute ? '' : undefined} data-volatile="">
            <span className="research-competition-clock-status" role="status">
                {phase === 'live' && <i className="research-competition-pulse" aria-hidden="true" />}
                {status}
            </span>
            {upcoming && (
                <span className="research-competition-countdown" role="timer" data-parity-ignore="">
                    {CLOCK_UNITS.map((unit, i) => (
                        <React.Fragment key={unit}>
                            {i > 0 && <span className="research-competition-sep" aria-hidden="true">:</span>}
                            <span className="research-competition-unit">
                                <ClockValue value={left && left[unit]} />
                                <span className="research-competition-unit-label">{c.units[unit]}</span>
                            </span>
                        </React.Fragment>
                    ))}
                </span>
            )}
            {/* both lines hold the one place; the other phase's is hidden (CSS) */}
            <span className="research-competition-when">
                <time dateTime={APEX_COMPETITION.startsAt} aria-hidden={!upcoming || undefined}>{keepDot(c.startDate)}</time>
                <time dateTime={APEX_COMPETITION.startsAt} aria-hidden={upcoming || undefined}>{keepDot(c.startedDate)}</time>
            </span>
        </div>
    );
}

// names the progress bar; the card is on the page once
const PROGRESS_LABEL_ID = 'research-competition-progress-label';

/**
 * The competition's progress and results, under the card's text: how many of
 * its epochs are complete, as a bar of one segment per epoch, then the net
 * change from the starting baseline to the current best (the newest approved
 * winner) and what those figures are not. They come from APEX_RESULTS
 * (research-competition.js) and change by edit, not with the clock, so unlike
 * the band this block is in the sitemap's content fingerprint and in the
 * parity test's pixels. Figures and the day are in the page's language.
 *
 * The bar is a progressbar named by its label, with the count as its value
 * text; the same count is written beside the label for the eye and hidden
 * from assistive technology, which reads it from the bar.
 */
function CompetitionResults({ copy, lang }) {
    if (!copy) return null;
    const r = competitionResultsText(copy, lang);
    const caveat = r.net ? r.net.caveat : '';
    return (
        <div className="research-competition-results">
            <div className="research-competition-progress">
                <span className="research-competition-label" id={PROGRESS_LABEL_ID}>{r.progressLabel}</span>
                <span className="research-competition-progress-count" aria-hidden="true">{r.progress}</span>
                <div
                    className="research-competition-progress-bar"
                    role="progressbar"
                    aria-labelledby={PROGRESS_LABEL_ID}
                    aria-valuemin={0}
                    aria-valuemax={r.total}
                    aria-valuenow={r.done}
                    aria-valuetext={r.progress}
                >
                    {Array.from({ length: r.total }, (_, i) => (
                        <span key={i} data-done={i < r.done ? '' : undefined} />
                    ))}
                </div>
            </div>
            {r.net && (
                <div className="research-competition-net">
                    <h3 className="research-competition-label">{r.net.title}</h3>
                    <p className="research-competition-net-meta">
                        {keepDot(`${r.net.comparison} · `)}
                        <time dateTime={r.net.asOfIso}>{r.net.asOf}</time>
                    </p>
                    <div className="research-competition-stats">
                        {r.net.metrics.map((m) => (
                            <div className="research-competition-stat" key={m.key} data-worse={m.improved ? undefined : ''}>
                                <b>{m.change}</b>
                                <span className="research-competition-stat-name">{m.name}</span>
                                <span className="research-competition-stat-range">{m.range}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {(caveat || r.link) && (
                <p className="research-competition-caveat">
                    {caveat}
                    {caveat && r.link ? sentenceGap(caveat) : ''}
                    {r.link && <a className="research-competition-code" href={r.link.href} {...external}>{r.link.label}</a>}
                </p>
            )}
        </div>
    );
}

/**
 * Gold competition card at the top of the research page: the art, the
 * countdown band, the eyebrow, the title, the body and the button, then the
 * competition's progress and results (CompetitionResults). The body carries a
 * link of its own, so the card is not one big link (anchors cannot nest): the
 * art, the title and the button each link to the competition. The title
 * renders once the dictionary has one (research.competition.title). `lang` is
 * the page's language, which the results' figures follow.
 *
 * The band follows the visitor's clock. Until the clock is read the phase is
 * `initialPhase` (the Astro page passes the phase at build time, so the
 * hydrating render matches the HTML) or, in the SPA, the phase now; from the
 * effect on it is the phase at the browser's time, and the band turns from
 * the countdown to live at the start without a reload.
 */
export function ResearchCompetition({ t, copy, initialPhase, lang = 'en' }) {
    const c = copy || t.research.competition;
    const now = useClock(clockStep);
    const phase = now == null ? (initialPhase || competitionPhase(Date.now())) : competitionPhase(now);
    // the art, the title and the button link to the competition page once it exists
    const Hero = APEX_COMPETITION_URL ? 'a' : 'div';
    const heroProps = APEX_COMPETITION_URL ? { href: APEX_COMPETITION_URL, ...external } : {};
    return (
        <div className="research-competition">
            <Hero className="research-competition-hero" {...heroProps}>
                <picture>
                    <source
                        type="image/webp"
                        srcSet={`${APEX_HERO.webpSmall} 900w, ${APEX_HERO.webp} ${APEX_HERO.width}w`}
                        sizes="(max-width: 800px) 100vw, 800px"
                    />
                    <img
                        src={APEX_HERO.jpg}
                        width={APEX_HERO.width}
                        height={APEX_HERO.height}
                        alt={c.imageAlt || APEX_HERO.alt}
                        loading="eager"
                        fetchpriority="high"
                    />
                </picture>
            </Hero>
            <CompetitionClock c={c} phase={phase} now={now} />
            <div className="research-competition-row">
                <div className="research-competition-copy">
                    <span className="research-competition-eyebrow">{c.eyebrow}</span>
                    {c.title && (
                        <h2 className="research-competition-title">
                            {APEX_COMPETITION_URL
                                ? <a href={APEX_COMPETITION_URL} {...external}>{c.title}</a>
                                : c.title}
                        </h2>
                    )}
                    <p className="research-competition-body">{competitionBody(c.body, c.codeLabel)}</p>
                </div>
                {APEX_COMPETITION_URL
                    ? <a className="research-competition-cta" href={APEX_COMPETITION_URL} {...external}>{c.cta}</a>
                    : <span className="research-competition-cta research-competition-cta--pending" aria-disabled="true">{c.cta}</span>}
            </div>
            <CompetitionResults copy={c.results} lang={lang} />
        </div>
    );
}

/**
 * A dictionary sentence with one `{placeholder}` replaced by a link; shown
 * as written when the label is missing or the placeholder is absent.
 */
function withLink(text, placeholder, href, label, className) {
    const s = String(text || '');
    if (!label || !s.includes(placeholder)) return s;
    return s.split(placeholder).flatMap((part, i) => (i === 0 ? [part] : [
        <a key={i} className={className} href={href}>{label}</a>,
        part,
    ]));
}

/**
 * Where a research card leads in `lang`, and what its call to action says: the
 * page in the reader's language once its page group is translated, else the
 * English page, whose call to action says it is in English (`ctaEnglish`).
 */
function cardLink(path, lang, copy) {
    const translated = groupPageHref(path, lang);
    return translated ? { href: translated, cta: copy.cta } : { href: path, cta: copy.ctaEnglish };
}

/**
 * The research report's card, under the page's intro: the latest report, as a
 * link to its page in the reader's language (cardLink). The path is the
 * report's (router RESEARCH_REPORT_SLUGS).
 */
export const RESEARCH_REPORT_HREF = '/research/2026-q3-report';

export function ResearchReportCard({ t, lang = 'en' }) {
    const r = t.research.report;
    const link = cardLink(RESEARCH_REPORT_HREF, lang, r);
    return (
        <a className="research-report-card" href={link.href}>
            <span className="research-report-card-tag">{r.tag} · {r.date}</span>
            <h2 className="research-report-card-title">{r.title}</h2>
            <p className="research-report-card-body">{r.body}</p>
            <span className="research-report-card-cta">{link.cta} <span aria-hidden="true">→</span></span>
        </a>
    );
}

/**
 * The research methodology's card, under the report's: the three research
 * loops' rings as its hero (ResearchLoops.jsx, turning in CSS), then a link to
 * /research/methodology in the reader's language (cardLink), where the same
 * rings head the page. The rings and their key repeat what the text says, so they are hidden from
 * assistive technology here; the page labels its drawing.
 */
export const RESEARCH_METHODOLOGY_HREF = '/research/methodology';

// the dictionaries name the loops innermost first; each takes its ring's colour
const METHOD_LOOP_KEYS = ['lab', 'competition', 'field'];

export function ResearchMethodologyCard({ t, lang = 'en' }) {
    const m = t.research.methodology;
    const loops = m.loops.map((l, i) => ({ ...l, key: METHOD_LOOP_KEYS[i] }));
    const link = cardLink(RESEARCH_METHODOLOGY_HREF, lang, m);
    return (
        <a className="research-method-card" href={link.href}>
            <div className="research-method-card-hero">
                <ResearchLoops />
                <ResearchLoopsKey loops={loops} hidden />
            </div>
            <div className="research-method-card-text">
                <span className="research-report-card-tag">{m.tag} · {m.topic}</span>
                <h2 className="research-report-card-title">{m.title}</h2>
                <p className="research-report-card-body">{m.body}</p>
                <span className="research-report-card-cta">{link.cta} <span aria-hidden="true">→</span></span>
            </div>
        </a>
    );
}

/**
 * The algorithm areas, one native <details> each. Closed: the tag, the title
 * and the one-line body (the former card). Open: the current approach, the
 * implementation links and the research directions. The summary carries the
 * area's h2 (a summary may hold heading content) and the subsections are h3s,
 * so the page outline stays h1 → h2 → h3. Each area is addressable by its
 * id; the effect opens the one a /research#<id> visit names (the static
 * pages run the same function from an inline script instead).
 */
export function ResearchAreas({ t }) {
    const labels = t.research.areaLabels;
    useEffect(() => {
        const open = () => openResearchArea(window.location.hash);
        open();
        window.addEventListener('hashchange', open);
        return () => window.removeEventListener('hashchange', open);
    }, []);
    return (
        <div className="research-areas">
            {t.research.papers.map(p => (
                <details className="research-area" id={researchAreaId(p.tag)} key={p.tag}>
                    <summary className="research-area-summary">
                        <span className="card-eyebrow research-area-tag">{p.tag}</span>
                        <h2 className="card-title research-area-title">{p.title}</h2>
                        <span className="card-body research-area-lead">{p.body}</span>
                    </summary>
                    <div className="research-area-body">
                        <h3 className="research-area-subtitle">{labels.approach}</h3>
                        <p>{p.approach}</p>
                        <h3 className="research-area-subtitle">{labels.implementation}</h3>
                        <ul className="research-area-links">
                            {p.links.map(l => (
                                <li key={l.href}>
                                    <a className="card-link" href={l.href} {...external}>{l.label}</a>
                                </li>
                            ))}
                        </ul>
                        <h3 className="research-area-subtitle">{labels.directions}</h3>
                        <p>{p.directions}</p>
                    </div>
                </details>
            ))}
        </div>
    );
}

/**
 * The page-level notes after the areas: how the block exports are
 * anonymized, and the program for researchers and builders (its `{vdp}`
 * placeholder renders as the link to the Vulnerability Disclosure Program).
 */
export function ResearchNotes({ t }) {
    const { anonymization: a, researchers: r } = t.research;
    return (
        <>
            <div className="research-subsection" id="anonymization">
                <h2 className="research-subsection-title">{a.title}</h2>
                <p className="research-subsection-body">{a.body}</p>
            </div>
            <div className="research-subsection" id="researchers">
                <h2 className="research-subsection-title">{r.title}</h2>
                <p className="research-subsection-body">{withLink(r.body, '{vdp}', '/vdp', r.vdpLabel, 'research-subsection-link')}</p>
            </div>
        </>
    );
}

/** Audits and papers at the bottom of the research page. */
export function ResearchFoot({ t }) {
    const a = t.research.audits;
    return (
        <div className="research-subsection">
            <h2 className="research-subsection-title">{a.title}</h2>
            <p className="research-subsection-note">{a.intro}</p>
            <ul className="research-audits">
                {a.items.map(item => {
                    const href = AUDIT_REPORT_URLS[item.id];
                    return (
                        <li
                            key={item.id}
                            className={'research-audit' + (item.pending ? ' research-audit--pending' : '')}
                        >
                            <span className="research-audit-tag">{item.tag || a.tag}</span>
                            {href ? (
                                <a
                                    className="research-audit-link"
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {item.name}
                                </a>
                            ) : (
                                <span className="research-audit-name">{item.name}</span>
                            )}
                            <span className="research-audit-firm">{item.firm}</span>
                            {item.status && <span className="research-audit-status">{item.status}</span>}
                            {item.scope && <span className="research-audit-detail">{item.scope}</span>}
                            {item.note && <span className="research-audit-detail">{item.note}</span>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
