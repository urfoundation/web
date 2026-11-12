import React from 'react';
import Section from '../Section';
import ResearchLoops from '../ResearchLoops';
import { METHODOLOGY as M } from '../../data/research-methodology';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { formatDate, interpolate } from '../../i18n/format.js';
import { hasLocalizedVersion, localizedPathFor } from '../../../../astro/src/lib/route-localization.js';
import './ResearchMethodology.css';

export const METHODOLOGY_PATH = M.path;

const pageCopy = await loadPageCopy('research-methodology');

/** A link on the site, to its page in `lang` when that page has one. */
const sitePath = (href, lang) => (hasLocalizedVersion(href) ? localizedPathFor(href, lang) : href);

/**
 * ResearchMethodologyPage — /research/methodology: how UR's research works.
 * Three nested loops (the lab, the open competition, the volunteer field
 * nodes) share one discipline, and each improves the network and the way the
 * next change is measured. Linked from the methodology's card on /research,
 * whose hero is the same rings (ResearchLoops.jsx).
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and the Astro route
 * (astro/src/components/routes/ResearchMethodologyRoute.astro) both wrap it in
 * the shared Disclaimer / Nav / Footer shell. Static: the rings turn in CSS,
 * so the page needs no island. The content is data
 * (data/research-methodology.js); its words are the copy unit
 * i18n/pages/research-methodology, in the page's language (`lang`).
 */
export default function ResearchMethodologyPage({ lang = 'en' }) {
    const t = pageCopy(lang);
    return (
        <div className="rm-page">
            <Intro t={t} lang={lang} />
            <Discipline t={t} />
            <Outputs t={t} />
            <Agents t={t} />
            <Loops t={t} lang={lang} />
            <Publication t={t} lang={lang} />
        </div>
    );
}

/** The title beside the rings (Section's own header, with the drawing next to it), the lede, and the three loops as an index. */
function Intro({ t, lang }) {
    return (
        <section id="methodology" className="section rm-intro" aria-labelledby="rm-title">
            <div className="section-inner">
                <div className="rm-head">
                    <header className="section-header">
                        <span className="section-eyebrow">{t.eyebrow}</span>
                        <h1 className="section-title" id="rm-title">{t.title}</h1>
                        <div className="section-rule" aria-hidden="true" />
                    </header>
                    <figure className="rm-hero">
                        <ResearchLoops label={t.figure} />
                    </figure>
                </div>
                <div className="section-body">
                    <p className="rm-lede">{t.lede}</p>
                    <p className="rm-meta"><time dateTime={M.published}>{formatDate(M.published, lang)}</time> · {t.metaNote}</p>
                    <ul className="rm-index" aria-label={t.indexAria}>
                        {M.loops.map((l) => {
                            const w = t.loops[l.key];
                            return (
                                <li key={l.key} className={`rl-${l.key}`}>
                                    <a href={`#${l.id}`}><b>{w.name}</b><span>{w.instrument} · {w.cadence}</span></a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function Discipline({ t }) {
    const d = t.discipline;
    return (
        <Section id="discipline" eyebrow={d.eyebrow} title={d.title}>
            <ol className="rm-rules">
                {d.rules.map((r, i) => (
                    <li key={M.discipline.rules[i].title}>
                        <span className="rm-rule-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <h3>{r.title}</h3>
                        <p>{r.body}</p>
                    </li>
                ))}
            </ol>
        </Section>
    );
}

/**
 * The five stages and their two rails: on wide screens one drawing, the
 * outcome rail solid from Record back to Baseline and the process rail dashed
 * from Record back to Measure; on phones the same as a list and a key. The
 * drawing keeps its left-to-right flow in every language.
 */
function Outputs({ t }) {
    const o = t.outputs;
    const x = (i) => 40 + i * 150;
    return (
        <Section id="outputs" eyebrow={o.eyebrow} title={o.title}>
            <p>{o.body}</p>
            <figure className="rm-stages">
                <svg className="rm-stages-wide" viewBox="0 0 800 240" role="img" aria-label={o.figure}>
                    <defs>
                        <marker id="rm-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="rgba(214, 230, 244, 0.45)" />
                        </marker>
                        <marker id="rm-rail-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="#F8F8F8" />
                        </marker>
                    </defs>
                    <text className="rm-rail-key" x="350" y="30">{o.railKeys.process}</text>
                    <text className="rm-rail-label" x="420" y="30">{o.process}</text>
                    <path className="rm-rail is-process" d={`M${x(4)},111 V44 H${x(2)} V108`} markerEnd="url(#rm-rail-arrow)" />
                    {o.stages.slice(0, -1).map((s, i) => (
                        <line key={`flow-${M.outputs.stages[i].name}`} className="rm-flow" x1={x(i) + 9} y1="120" x2={x(i + 1) - 10} y2="120" markerEnd="url(#rm-flow-arrow)" />
                    ))}
                    {o.stages.map((s, i) => (
                        <g key={M.outputs.stages[i].name}>
                            <circle className="rm-node" cx={x(i)} cy="120" r="7" />
                            <text className="rm-stage-n" x={x(i) + 14} y="100">{i + 1}</text>
                            <text className="rm-stage-name" x={x(i) + 28} y="100">{s.name.toUpperCase()}</text>
                            {s.lines.map((line, j) => <text key={j} className="rm-stage-desc" x={x(i) + 14} y={146 + j * 17}>{line}</text>)}
                        </g>
                    ))}
                    <path className="rm-rail" d={`M${x(4)},129 V200 H${x(0)} V132`} markerEnd="url(#rm-rail-arrow)" />
                    <text className="rm-rail-key" x="200" y="226">{o.railKeys.outcome}</text>
                    <text className="rm-rail-label" x="270" y="226">{o.outcome}</text>
                </svg>
                <ol className="rm-stages-list" aria-hidden="true">
                    {o.stages.map((s, i) => <li key={M.outputs.stages[i].name}><b>{s.name}</b><span>{s.lines.join(' ')}</span></li>)}
                </ol>
                <ul className="rm-rails-list" aria-hidden="true">
                    <li><i /><span><b>{o.rails.outcome}</b> · {o.outcome}</span></li>
                    <li className="is-process"><i /><span><b>{o.rails.process}</b> · {o.process}</span></li>
                </ul>
            </figure>
            <aside className="rm-example">
                <span className="rm-example-tag">{o.example.tag}</span>
                <p>{o.example.body}</p>
                <span className="rm-example-source">{o.example.source}</span>
            </aside>
        </Section>
    );
}

function Agents({ t }) {
    const a = t.agents;
    return (
        <Section id="agents" eyebrow={a.eyebrow} title={a.title}>
            <p>{a.body}</p>
            <dl className="rm-roles">
                {a.roles.map((r, i) => (
                    <div key={M.agents.roles[i].name}><dt>{r.name}</dt><dd>{r.body}</dd></div>
                ))}
            </dl>
        </Section>
    );
}

function Loops({ t, lang }) {
    const s = t.sections;
    return (
        <Section id="loops" eyebrow={s.eyebrow} title={s.title}>
            {M.sections.loops.map((l) => {
                const w = s.loops[l.key];
                return (
                    <article key={l.key} id={l.key} className={`rm-loop rl-${l.key}`} aria-labelledby={`${l.key}-title`}>
                        <div className="rm-loop-head">
                            <ResearchLoops only={l.key} />
                            <span className="rm-loop-tag">{w.tag}</span>
                        </div>
                        <h3 id={`${l.key}-title`}>{w.title}</h3>
                        <p>{w.body}</p>
                        <div className="rm-facts" style={{ '--rm-n': l.facts.length }}>
                            {l.facts.map((f, i) => (
                                <div key={f.v}>
                                    <b>{w.facts[i].v}</b>
                                    <span>{f.date ? interpolate(w.facts[i].l, { date: formatDate(f.date, lang, { month: 'long', day: 'numeric', year: 'numeric' }) }) : w.facts[i].l}</span>
                                </div>
                            ))}
                        </div>
                        <ul className="rm-links">
                            {l.links.map((k, i) => (
                                <li key={k.label}>
                                    {k.external
                                        ? <a href={k.href} target="_blank" rel="noopener noreferrer">{w.links[i]} <span aria-hidden="true">↗</span></a>
                                        : <a href={sitePath(k.href, lang)}>{w.links[i]} <span aria-hidden="true">→</span></a>}
                                </li>
                            ))}
                        </ul>
                    </article>
                );
            })}
        </Section>
    );
}

function Publication({ t, lang }) {
    const p = t.publication;
    return (
        <Section id="publication" eyebrow={p.eyebrow} title={p.title}>
            <p>{p.body}</p>
            <p><a className="rm-cta" href={sitePath(M.reportHref, lang)}>{p.cta} <span aria-hidden="true">→</span></a></p>
        </Section>
    );
}
