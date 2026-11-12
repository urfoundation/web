import React from 'react';
import { interpolate } from '../../i18n/format.js';
import { parts } from './copyParts.js';

/**
 * BuildBrief — the opportunity readout beside the model, the "selected layer"
 * caption and the opportunity brief panel of the "Build on UR" page.
 *
 * Ported from astro/public/build.html. The text the standalone page's script
 * wrote into `data-*` hooks on every opportunity change is rendered from the
 * selected opportunity here; the version-11/12 editions (`builder`) move the
 * layer caption into the model stage and the brief's prev/next nav into the
 * brief head, exactly as the script re-parented them.
 *
 * Every part takes `t`, the page's `build` copy unit in its language, and the
 * parts that set an opportunity's words in capitals take `locale` (its Intl
 * locale); the opportunities arrive with their words in that language.
 */

const position = (o, count) => `${o.n} / ${String(count).padStart(2, '0')}`;

/**
 * The "selected layer" caption: the focused component, or the whole system.
 * Its title is an h4 inside an opportunity readout (h3) and an h3 on the
 * builder editions' stage, under the section's h2.
 */
export function ArchitectureReadout({ className = 'architecture-readout', headingLevel = 'h4', name, detail, short, color, onClose, t }) {
    const Heading = headingLevel;
    return (
        <div className={className} aria-live="polite" aria-atomic="true" style={{ '--component-color': color }} onClick={(e) => e.stopPropagation()}>
            <div className="architecture-readout-head">
                <small>{t.layer.label}</small>
                <button className="architecture-readout-close" type="button" aria-label={t.layer.closeAria} onClick={onClose}>
                    <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" /></svg>
                </button>
            </div>
            <Heading>{name}</Heading>
            <p>{detail}</p>
            <b>{short}</b>
        </div>
    );
}

/**
 * The readout panel (a tabpanel for the opportunity tabs). `readout` carries
 * the category/title/teaser shown — version 12 words them from BUILD_V12.
 * `layer` is the ArchitectureReadout props; it renders here for version 10 and
 * on the stage for the builder editions. `triggerOpen`/`toggleOpen` are the two
 * brief buttons' own expanded states (see Build.jsx). Every opportunity has its
 * own panel in the page (`id`, labelled by its tab); all but the selected one
 * are `hidden`.
 */
export function Readout({ id, labelledBy, briefId, hidden, op, readout, isV11, builder, layer, triggerOpen, toggleOpen, briefLabel, onOpenBrief, onToggleBrief, t, locale }) {
    // the number is its own text node, as it always was
    const [beforeN, afterN] = parts(t.readout.example, 'n');
    return (
        <aside className="readout" id={id} role="tabpanel" aria-labelledby={labelledBy} hidden={hidden} aria-live="polite">
            <div className="readout-top"><span>{beforeN}{op.n}{afterN}</span><span>{isV11 ? t.readout.sixStartingPoints : t.readout.oneOfMany}</span></div>
            <div className="readout-category">{readout.category.toLocaleUpperCase(locale)}</div>
            <h3>{readout.title}</h3>
            <p className="readout-lede">{readout.teaser}</p>
            <div className="profile">
                <div><b>{t.readout.demandShape}</b><span>{op.demandProfile}</span></div>
                <div><b>{t.readout.networkReliance}</b><span>{op.reliance}</span></div>
            </div>
            <div className="readout-explainer">
                <article><b>{t.readout.product}</b><p>{op.proposition}</p></article>
                <article><b>{t.readout.usesSn25}</b><p>{op.inherits}</p></article>
            </div>
            {!builder && <ArchitectureReadout {...layer} />}
            <button className="readout-brief" type="button" aria-expanded={triggerOpen} aria-controls={briefId} onClick={onOpenBrief}>
                {briefLabel}<span aria-hidden="true">{triggerOpen ? '−' : '+'}</span>
            </button>
            <button className="brief-toggle" type="button" aria-expanded={toggleOpen} aria-controls={briefId} onClick={onToggleBrief}>
                <span>{toggleOpen ? t.readout.closeFullBrief : t.readout.readFullBrief}</span><i aria-hidden="true">{toggleOpen ? '−' : '+'}</i>
            </button>
        </aside>
    );
}

function BriefNav({ pos, onPrev, onNext, children, t }) {
    return (
        <nav className="brief-nav" aria-label={t.brief.navAria}>
            <button type="button" onClick={onPrev}>{t.brief.previous}</button>
            <span>{pos}</span>
            <button type="button" onClick={onNext}>{t.brief.next}</button>
            {children}
        </nav>
    );
}

/**
 * The opportunity brief: editorial story + rail, the structured chapters and
 * the prev/next navigation. `v12` is the BUILD_V12 entry for the opportunity
 * when the page runs as version 12 (its copy replaces the editorial story and
 * rail metadata), otherwise null. Like the readouts, every opportunity's brief
 * is in the page, at its own address (`id`, brief-<slug>), and all but the
 * selected one are `hidden` (version 12 hides a closed one too: it is not drawn).
 */
export function BriefPanel({ id, hidden, panelRef, op, v12, opportunities, builder, open, briefMode, onBriefMode, onPrev, onNext, onClose, t, locale }) {
    const b = t.brief;
    const count = opportunities.length;
    const index = opportunities.indexOf(op);
    const prev = opportunities[(index - 1 + count) % count];
    const next = opportunities[(index + 1) % count];
    const pos = position(op, count);
    const number = v12
        ? interpolate(b.number, { n: String(index + 1).padStart(2, '0'), category: v12.category.toLocaleUpperCase(locale) })
        : interpolate(b.number, { n: op.n, category: op.category.toLocaleUpperCase(locale) });
    const story = v12
        ? [
            [b.storyOpportunity, v12.opportunityTitle, v12.opportunity],
            [b.storyWhyUr, v12.sn25Title, v12.sn25],
            [b.storyOwns, b.storyOwnsTitle, v12.owns],
        ]
        : [
            [b.storyTheOpportunity, op.editorialOpportunityTitle, op.editorialThesis],
            [`02 / ${op.editorialProblemLabel}`, op.editorialProblemTitle, op.editorialWhy],
            [b.storyWhySn25, op.editorialSn25Title, op.editorialUnlock],
        ];
    const rail = v12
        ? [
            [b.railCustomer, v12.customer],
            [b.railDemand, v12.demand],
            [b.railNetworkUse, v12.networkUse],
            [b.railDemand, op.demandProfile],
        ]
        : [
            [b.railCustomer, op.customer],
            [b.railOwns, op.owns],
            [b.railOpen, op.editorialOpen],
            [b.railDemand, op.demandProfile],
        ];
    const hops = op.traffic.split('→').map((x) => x.trim());
    // the reliance is its own text node, as it always was
    const [beforeReliance, afterReliance] = parts(b.relianceTag, 'reliance');
    const close = <button className="brief-close" type="button" onClick={onClose}>{b.close}</button>;

    return (
        <section className="brief-panel" id={id} hidden={hidden} data-open={String(open)} ref={panelRef}>
            <div className="brief-inner"><div className="brief-content">
                <header className="brief-head">
                    <div><small>{number}</small><h3>{v12 ? v12.title : op.title}</h3><p>{op.teaser}</p></div>
                    <div className="brief-tags">
                        <span>{op.demandProfile.toLocaleUpperCase(locale)}</span>
                        <span>{beforeReliance}{op.reliance.toLocaleUpperCase(locale)}{afterReliance}</span>
                        <span>{op.networkUse.toLocaleUpperCase(locale)}</span>
                    </div>
                    {builder ? <BriefNav pos={pos} onPrev={onPrev} onNext={onNext} t={t}>{close}</BriefNav> : close}
                </header>
                <div className="brief-compare">
                    <span>{b.compare}</span>
                    <div role="tablist" aria-label={b.compareAria}>
                        <button type="button" role="tab" aria-selected={briefMode === 'editorial'} onClick={() => onBriefMode('editorial')}>{b.editorial}</button>
                        <button type="button" role="tab" aria-selected={briefMode === 'structured'} onClick={() => onBriefMode('structured')}>{b.structured}</button>
                    </div>
                </div>
                <div className="editorial-brief" data-brief-format="editorial">
                    <article className="editorial-story">
                        {story.map(([label, title, body]) => (
                            <section key={label}><b>{label}</b><div><h4>{title}</h4><p>{body}</p></div></section>
                        ))}
                    </article>
                    <aside className="editorial-rail">
                        <span>{b.railKicker}</span>
                        {!builder && <BriefNav pos={pos} onPrev={onPrev} onNext={onNext} t={t} />}
                        <blockquote>{op.editorialThesis}</blockquote>
                        <dl>
                            {rail.map(([dt, dd], i) => <div key={i}><dt>{dt}</dt><dd>{dd}</dd></div>)}
                        </dl>
                    </aside>
                </div>
                <nav className="brief-footer-nav" aria-label={b.footerAria}>
                    <button type="button" onClick={onPrev}><small>{b.previousExample}</small><strong>{prev.title}</strong></button>
                    <span><b>{pos}</b><small>{b.examples}</small></span>
                    <button type="button" onClick={onNext}><small>{b.nextExample}</small><strong>{next.title}</strong></button>
                </nav>
                <div className="brief-grid" data-brief-format="structured">
                    <section className="brief-chapter">
                        <header className="brief-chapter-head"><b>{b.chapterOpportunity}</b><h4>{b.chapterOpportunityTitle}</h4></header>
                        <div className="brief-chapter-grid triple">
                            <article className="brief-block"><h4>{b.potentialCustomer}</h4><p>{op.customer}</p></article>
                            <article className="brief-block"><h4>{b.problem}</h4><p>{op.problem}</p></article>
                            <article className="brief-block"><h4>{b.proposition}</h4><p>{op.proposition}</p></article>
                        </div>
                    </section>
                    <section className="brief-chapter">
                        <header className="brief-chapter-head"><b>{b.chapterInUse}</b><h4>{b.chapterInUseTitle}</h4></header>
                        <div className="brief-chapter-grid">
                            <article className="brief-block"><h4>{b.scenario}</h4><p>{op.scenario}</p></article>
                            <article className="brief-block full">
                                <h4>{b.path}</h4>
                                <div className="traffic-path">
                                    {hops.map((hop, i) => (
                                        <React.Fragment key={i}><span>{hop}</span>{i < hops.length - 1 && <i aria-hidden="true" />}</React.Fragment>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </section>
                    <section className="brief-chapter">
                        <header className="brief-chapter-head"><b>{b.chapterBoundary}</b><h4>{b.chapterBoundaryTitle}</h4></header>
                        <div className="brief-chapter-grid">
                            <article className="brief-block"><h4>{b.operatorOwns}</h4><p>{op.owns}</p></article>
                            <article className="brief-block"><h4>{b.urSupplies}</h4><p>{op.inherits}</p></article>
                            <article className="brief-block"><h4>{b.valueExchange}</h4><p>{op.value}</p></article>
                            <article className="brief-block">
                                <h4>{b.constraints}</h4>
                                <ul className="constraints">{op.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
                            </article>
                        </div>
                    </section>
                </div>
            </div></div>
        </section>
    );
}
