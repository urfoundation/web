import React from 'react';
import Section from '../Section';
import data from '../../data/research-report-2026-q3.json';
import Glyph from './research-report/Glyph';
import ReportMeters from './research-report/Meters';
import ReportDock from './research-report/Dock';
import ReportGlance from './research-report/Glance';
import MethodFigure from './research-report/MethodFigure';
import TermTips from './research-report/TermTips';
import ReportToc from './research-report/Toc';
import { MONTHS, TOC, fmt, linkHtml, linkText, movedMeters, rangeEnd, termMatchers } from './research-report/model';
import { countedParts, pageCopy, parts } from './research-report/copy';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { formatDate, interpolate } from '../../i18n/format.js';
import './ResearchReport.css';

/**
 * ResearchReportPage — /research/2026-q3-report, the August–October 2026
 * research report: why the research matters, its gigabit-class milestone, a
 * timeline of its entries with
 * meters that replay the evidence as the reader goes, how far each kind of gain
 * went, the seven methods (each with an animation), what changed in the
 * instruments, what is still open, and a glossary.
 *
 * The content is data (data/research-report-2026-q3.json): the figures quoted
 * from the research impact report verbatim, with a plain-language layer over
 * them. The meters are never combined; the page says so where it shows them.
 * Its words are two copy units in the page's language (`lang`):
 * i18n/pages/research-report (the page's own words and what the islands show)
 * and i18n/pages/research-report/text (the report's text), whose English is
 * derived from the data.
 *
 * Renders only what goes inside <main class="section-page">. Everything but
 * the live parts is static: the SPA renders the parts that follow the reader
 * here, and the Astro route (astro/src/components/routes/ResearchReportRoute.astro)
 * passes the same components in as islands, through the props named below, so
 * the page stays one source.
 */
export const REPORT = data;
export const REPORT_PATH = `/research/${data.slug}`;

const textCopy = await loadPageCopy('research-report/text');

const KINDS = Object.keys(data.kinds);
const ENTRIES = data.entries;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// the glossary terms each language links (model.js termMatchers), built once per language
const matchers = new Map();
function matchersFor(lang) {
    if (!matchers.has(lang)) matchers.set(lang, termMatchers(pageCopy(lang).terms, lang));
    return matchers.get(lang);
}

/** Text with its glossary terms linked, the first use of each per `used` set. */
function Linked({ text, used, lang }) {
    return linkText(text, matchersFor(lang), used).map((run, i) => (run.id
        ? <a key={i} className="rr-term" href={`#${run.id}`} data-term={run.id}>{run.text}</a>
        : <React.Fragment key={i}>{run.text}</React.Fragment>));
}

export default function ResearchReportPage({ lang = 'en', updated = null, toc = null, glance = null, railMeters = null, finalMeters = null, dock = null, termTips = null, ...figures }) {
    const t = pageCopy(lang);
    const x = textCopy(lang);
    const c = { lang, t, x };
    return (
        <div className="rr-page">
            {/* the sections, in the left margin on wide screens */}
            {/* the sticky box is outside the island, so it sticks on the static page too */}
            <aside className="rr-toc"><div className="rr-toc-sticky">{toc || <ReportToc lang={lang} />}</div></aside>
            <Intro {...c} updated={updated} glance={glance || <ReportGlance lang={lang} />} />
            <Timeline {...c} rail={railMeters || <ReportMeters mode="rail" lang={lang} />} final={finalMeters || <ReportMeters mode="final" lang={lang} />} />
            <Methods {...c} figures={figures} />
            <div className="rr-group" id="milestones">
                <Milestone {...c} />
            </div>
            <div className="rr-group" id="details">
                <StartToEnd {...c} />
                <Instruments {...c} />
                <OpenQuestions {...c} />
                <Glossary {...c} updated={updated} />
            </div>
            {dock || <ReportDock lang={lang} />}
            {termTips || <TermTips lang={lang} />}
        </div>
    );
}

/** " Updated <time>…</time>." from a template such as "Updated {date}.", as the English writes it. */
function Updated({ template, updated }) {
    const [before, after] = template.split('{date}');
    return <>{` ${before}`}<time dateTime={updated}>{updated}</time>{after}</>;
}

/**
 * The intro: what the research is for and what the report covers, then at a
 * glance (the headline figures and every entry by date), then why it matters: the
 * everyday experience each meter follows. Under 1320px, where the sidebar does
 * not fit, the sections are listed here too.
 */
function Intro({ lang, t, x, updated, glance }) {
    const i = t.intro;
    return (
        <Section id="report" eyebrow={i.eyebrow} title={t.title} headingLevel="h1">
            <p className="rr-lede">{x.mission.lede}</p>
            <p className="rr-meta">
                <time dateTime={data.published}>{formatDate(data.published, lang)}</time>{` · ${i.datesNote}`}
                {updated && <Updated template={i.updated} updated={updated} />}
            </p>
            <nav className="rr-onpage" aria-label={t.sectionsAria}>
                {TOC.slice(1).map((g) => <a key={g.id} className="rr-chip" href={`#${g.id}`}>{t.toc.labels[g.id]}</a>)}
            </nav>
            <div className="rr-glance" id="glance">
                <h2 className="rr-subhead">{i.glance}</h2>
                <div className="rr-kpis">
                    {x.kpis.map((k, j) => <div className="rr-kpi" key={data.kpis[j].v}><b>{k.v}</b><span>{k.l}</span></div>)}
                </div>
                <p className="rr-kpi-note">{`${i.kpiNote} `}<a href="#end">{i.kpiNoteLink}</a></p>
                <h3 className="rr-glance-label">{countedParts(lang, i.entriesByDate, ENTRIES.length)}</h3>
                {glance}
                <Legend t={t} />
            </div>
            <div className="rr-why-block" id="why">
                <h2 className="rr-subhead">{i.why}</h2>
                <p className="rr-why-title">{x.mission.title}</p>
                {x.mission.body.map((p) => <p key={p}>{p}</p>)}
                <ul className="rr-why">
                    {data.mission.items.map((it) => (
                        <li key={it.meter}>
                            <span className="rr-why-meter">{t.meters[it.meter].name}</span>
                            <h3>{x.mission.items[it.meter].headline}</h3>
                            <p>{x.mission.items[it.meter].body}</p>
                        </li>
                    ))}
                </ul>
                <p className="rr-why-open">{x.mission.open} <a href="#open">{i.openLink}</a></p>
            </div>
        </Section>
    );
}

function Legend({ t }) {
    return (
        <ul className="rr-legend" aria-label={t.intro.legendAria}>
            {KINDS.map((kind) => (
                <li key={kind}><Glyph kind={kind} /><b>{t.kinds[kind].label}</b><span>{t.kinds[kind].legend}</span></li>
            ))}
        </ul>
    );
}

/**
 * The report's milestone: gigabit-class throughput from adaptive windows. The
 * plain layer leads (what was achieved, on what path, and what it is not); the
 * report's own section follows: what changed, its evidence table and its
 * bounds. The chart is the host run second by second, with its startup second
 * kept, because the report says startup must not be read as the steady rate.
 */
function Milestone({ lang, t, x }) {
    const ms = x.milestone, r = ms.report, words = t.milestone;
    const used = new Set();
    const link = (html) => linkHtml(html, matchersFor(lang), used);
    return (
        <Section id="milestone" eyebrow={ms.eyebrow} title={ms.headline}>
            <p className="rr-ms-lede">{ms.lede}</p>
            <p className="rr-ms-scope">{ms.scope}</p>
            <div className="rr-ms-grid">
                <figure className="rr-ms-run">
                    <RunChart run={data.milestone.run} lang={lang} words={words.chart} />
                    <figcaption>{ms.caption}</figcaption>
                </figure>
                <div className="rr-ms-stats">
                    {ms.stats.map((st, j) => <div className="rr-ms-stat" key={data.milestone.stats[j].v}><b>{st.v}</b><span><Linked text={st.l} used={used} lang={lang} /></span></div>)}
                </div>
            </div>
            <h3 className="rr-subhead rr-ms-h">{words.changed}</h3>
            <ol className="rr-ms-changes">
                {r.changes.map((ch, j) => (
                    <li key={data.milestone.report.changes[j].title}><h4>{ch.title}</h4><p dangerouslySetInnerHTML={{ __html: link(ch.text) }} /></li>
                ))}
            </ol>
            <h3 className="rr-subhead rr-ms-h">{words.impact}</h3>
            <table className="rr-ms-table" role="table">
                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">{words.experiment}</th><th role="columnheader" scope="col">{words.result}</th><th role="columnheader" scope="col">{words.establishes}</th></tr></thead>
                <tbody role="rowgroup">
                    {r.table.map((row, j) => (
                        <tr role="row" key={data.milestone.report.table[j].experiment}>
                            <td role="cell" data-label={words.experiment} dangerouslySetInnerHTML={{ __html: row.experiment }} />
                            <td role="cell" data-label={words.result} dangerouslySetInnerHTML={{ __html: row.result }} />
                            <td role="cell" data-label={words.establishes} dangerouslySetInnerHTML={{ __html: link(row.establishes) }} />
                        </tr>
                    ))}
                </tbody>
            </table>
            {r.guards.map((g) => <p className="rr-ms-guards" key={g} dangerouslySetInnerHTML={{ __html: g }} />)}
            <details className="rr-more">
                <summary>{words.inReport}</summary>
                <div className="rr-more-body">
                    {r.intro.map((para) => <p key={para} dangerouslySetInnerHTML={{ __html: para }} />)}
                    <p className="rr-evidence">
                        {data.milestone.report.evidence.map((src) => <a key={src.label} href={src.href} target="_blank" rel="noopener noreferrer">{x.sources[sourceKey(src.label)]} <span aria-hidden="true">↗</span></a>)}
                    </p>
                </div>
            </details>
        </Section>
    );
}

// the copy's key for an evidence label (i18n/pages/research-report/english.js sourceKey)
const sourceKey = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The host TCP run, one bar a second: startup muted, the steady seconds as their 939–942 range, the mean and the service line. */
function RunChart({ run, lang, words }) {
    const L = 44, R = 10, T = 22, B = 154, W = 360;
    const y = (v) => B - (v / run.service) * (B - T);
    const slot = (W - L - R) / run.seconds;
    const [lo, hi] = run.steady;
    const n = (v) => fmt(v, (String(v).split('.')[1] || '').length, lang);
    const bar = (i, v) => {
        const x = L + i * slot + slot * 0.19, w = slot * 0.62, top = y(v), r = 3;
        return `M${x} ${B} V${top + r} A${r} ${r} 0 0 1 ${x + r} ${top} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${top + r} V${B} Z`;
    };
    return (
        <svg className="rr-ms-chart" viewBox={`0 0 ${W} 186`} role="img" aria-label={interpolate(words.aria, { first: n(run.first), lo: n(lo), hi: n(hi), mean: n(run.mean) })}>
            {[0, 500, 1000].map((v) => (
                <g key={v}>
                    <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 1000 ? 'rgba(214,230,244,0.45)' : 'rgba(214,230,244,0.1)'} />
                    <text x={L - 6} y={y(v) + 3} fontSize="9" fill="rgba(214,230,244,0.56)" textAnchor="end">{fmt(v, 0, lang)}</text>
                </g>
            ))}
            <text x={W - R} y={y(1000) - 5} fontSize="9" fill="rgba(214,230,244,0.7)" textAnchor="end">{words.service}</text>
            <path d={bar(0, run.first)} fill="#D6E6F4" fillOpacity="0.4" />
            <text x={L + slot / 2} y={y(run.first) - 6} fontSize="10" fill="#F8F8F8" textAnchor="middle">{n(run.first)}</text>
            {Array.from({ length: run.seconds - 1 }, (_, k) => (
                <g key={k}>
                    <path d={bar(k + 1, lo)} fill="#ED8FFF" />
                    <rect x={L + (k + 1) * slot + slot * 0.19} y={y(hi)} width={slot * 0.62} height={y(lo) - y(hi)} fill="#ED8FFF" fillOpacity="0.45" />
                </g>
            ))}
            <text x={L + slot * 5.5} y={y(hi) - 18} fontSize="10" fill="#F8F8F8" textAnchor="middle">{parts(words.steady, { lo: n(lo), hi: n(hi) })}</text>
            <line x1={L} x2={W - R} y1={y(run.mean)} y2={y(run.mean)} stroke="#F8F8F8" strokeOpacity="0.75" />
            {[1, 5, 10].map((sec) => <text key={sec} x={L + (sec - 0.5) * slot} y={B + 14} fontSize="9" fill="rgba(214,230,244,0.56)" textAnchor="middle">{parts(words.second, { n: n(sec) })}</text>)}
            <text x={L} y={180} fontSize="9" fill="rgba(214,230,244,0.56)">{words.axis}</text>
            <line x1={W - R - 104} x2={W - R - 92} y1={177} y2={177} stroke="#F8F8F8" strokeOpacity="0.75" />
            <text x={W - R} y={180} fontSize="9" fill="rgba(214,230,244,0.75)" textAnchor="end">{parts(words.mean, { mean: n(run.mean) })}</text>
        </svg>
    );
}

function monthSpan(list, t, key) {
    const days = list.flatMap((e) => [e.iso, rangeEnd(e) || e.iso].map((iso) => Number(iso.slice(8, 10))));
    return interpolate(t.monthSpan, { month: t.months[key].label, from: Math.min(...days), to: Math.max(...days) });
}

/**
 * The entries by month, with the meters beside them in the rail on wide
 * screens. Under 1320px the bar under the nav carries the meters while the
 * reader is in the timeline, and the timeline ends with where they ended.
 */
function Timeline({ lang, t, x, rail, final }) {
    const w = t.timeline;
    return (
        <section id="timeline" className="section rr-timeline" aria-labelledby="timeline-title">
            <div className="rr-tl-layout">
                <div className="rr-tl-main">
                    <header className="section-header">
                        <span className="section-eyebrow">{w.eyebrow}</span>
                        <h2 className="section-title" id="timeline-title">{countedParts(lang, w.title, ENTRIES.length)}</h2>
                        <div className="section-rule" aria-hidden="true" />
                    </header>
                    <div className="section-body rr-tl-intro">
                        {w.intro.map((p) => <p key={p}>{p}</p>)}
                    </div>
                    {MONTHS.map((m) => <Month key={m.key} month={m} lang={lang} t={t} x={x} />)}
                    <section className="rr-tl-final" aria-labelledby="timeline-final-heading">
                        <h3 className="rr-subhead" id="timeline-final-heading">{w.final}</h3>
                        {final}
                    </section>
                </div>
                <aside className="rr-rail" aria-label={w.railAria}>
                    <div className="rr-rail-sticky">{rail}</div>
                </aside>
            </div>
        </section>
    );
}

/** A month's count of a kind ("5 gains"), as React children: the count, then its words after the space. */
function tally(lang, forms, n) {
    return countedParts(lang, forms, n).flatMap((p) => (typeof p === 'string' && /^ \S/.test(p) ? [' ', p.slice(1)] : [p]));
}

function Month({ month, lang, t, x }) {
    const list = ENTRIES.filter((e) => e.month === month.key);
    const counts = {};
    for (const e of list) counts[e.kind] = (counts[e.kind] || 0) + 1;
    const headingId = `month-${month.key}-heading`;
    const name = t.months[month.key].name;
    return (
        <section className="rr-month" id={`month-${month.key}`} aria-labelledby={headingId}>
            <header className="rr-month-head">
                <h3 id={headingId}>{name}</h3>
                <p className="rr-month-sub">{monthSpan(list, t, month.key)}{' · '}{countedParts(lang, t.timeline.monthEntries, list.length)}</p>
                <ul className="rr-month-tally" aria-label={interpolate(t.timeline.byKind, { month: name })}>
                    {KINDS.filter((k) => counts[k]).map((k) => (
                        <li key={k}><Glyph kind={k} size={9} />{tally(lang, t.kinds[k].tally, counts[k])}</li>
                    ))}
                </ul>
            </header>
            <ol className="rr-entries">
                {list.map((e) => <Entry key={e.id} entry={e} lang={lang} t={t} x={x} />)}
            </ol>
        </section>
    );
}

function Entry({ entry: e, lang, t, x }) {
    const used = new Set();
    const words = t.entry;
    const head = t.entries[e.id];
    const text = x.entries[e.id];
    const moves = movedMeters(e, data.meters);
    const statLabel = text.stat && <Linked text={text.stat.l} used={used} lang={lang} />;
    const more = text.more && <Linked text={text.more} used={used} lang={lang} />;
    const meaning = <Linked text={text.meaning} used={used} lang={lang} />;
    const measured = linkHtml(text.measured, matchersFor(lang), used);
    const suites = linkHtml(text.suites, matchersFor(lang), used);
    return (
        <li className="rr-entry" id={e.id} data-kind={e.kind}>
            <span className="rr-entry-node" aria-hidden="true"><Glyph kind={e.kind} /></span>
            <div className="rr-entry-body">
                <div className="rr-entry-meta">
                    <time className="rr-entry-date" dateTime={e.iso}>{head.date}</time>
                    <span className="rr-flag" data-kind={e.kind}><Glyph kind={e.kind} size={9} />{text.flag || t.kinds[e.kind].label}</span>
                </div>
                <h4 className="rr-entry-title">{head.title}</h4>
                {text.stat
                    ? <p className="rr-entry-stat"><span className="rr-entry-stat-v">{text.stat.v}</span><span className="rr-entry-stat-l">{statLabel}</span></p>
                    : <p className="rr-entry-stat is-none"><span className="rr-entry-stat-v">{words.noSpeedClaim}</span></p>}
                {more && <p className="rr-entry-more">{more}</p>}
                <p className="rr-entry-meaning">{meaning}</p>
                {text.rejected && <p className="rr-entry-rejected"><Glyph kind="rejected" size={10} /><span><b>{words.alsoRejected}</b> {text.rejected}</span></p>}
                {moves.length > 0 && (
                    <div className="rr-entry-foot">
                        <span className="rr-moves">{words.moves}{moves.map((m) => <button key={m.key} type="button" className="rr-chip" data-meter={m.key}>{t.meters[m.key].name}</button>)}</span>
                    </div>
                )}
                <details className="rr-more">
                    <summary>{words.more}</summary>
                    <dl className="rr-more-body">
                        <dt>{words.inReport}</dt>
                        <dd dangerouslySetInnerHTML={{ __html: text.change }} />
                        <dt>{words.measured}</dt>
                        <dd dangerouslySetInnerHTML={{ __html: measured }} />
                        <dt>{words.suites}</dt>
                        <dd dangerouslySetInnerHTML={{ __html: suites }} />
                        <dt>{words.evidence}</dt>
                        <dd className="rr-evidence">
                            {e.evidence.map((src) => (src.href
                                ? <a key={src.label} href={src.href} target="_blank" rel="noopener noreferrer">{x.sources[sourceKey(src.label)]} <span aria-hidden="true">↗</span></a>
                                : <span key={src.label} className="is-private">{x.sources[sourceKey(src.label)]}{` ${words.private}`}</span>))}
                            {(e.commits || []).map((sha) => (
                                <a key={sha} className="rr-commit" href={`https://github.com/urnetwork/connect/commit/${sha}`} target="_blank" rel="noopener noreferrer" title={x.commits[sha]}>
                                    {parts(words.commit, { sha: sha.slice(0, 8) })} <span aria-hidden="true">↗</span>
                                </a>
                            ))}
                        </dd>
                    </dl>
                </details>
            </div>
        </li>
    );
}

function StartToEnd({ t, x }) {
    const w = t.end;
    const summary = x.summary;
    return (
        <Section id="end" eyebrow={w.eyebrow} title={w.title}>
            <p>{w.intro}</p>
            <div className="rr-end-grid">
                {data.end.map((card, j) => {
                    const words = x.end[j];
                    return (
                        <article key={card.axis} className={`rr-end-card${card.none ? ' is-none' : ''}`}>
                            <h3>{words.axis}</h3>
                            <p className="rr-end-figure">
                                {words.figure.split(' · ').map((part, i) => <React.Fragment key={part}>{i > 0 && ' · '}<span className="rr-nw">{part}</span></React.Fragment>)}
                            </p>
                            <p className="rr-end-what">{words.what}</p>
                            <p className="rr-end-conf"><b>{w.confidence}</b> {words.confidence}</p>
                            {card.milestone && (
                                <details className="rr-more">
                                    <summary>{w.inReport}</summary>
                                    <div className="rr-more-body">
                                        {x.milestone.report.guards.map((g) => <p key={g} dangerouslySetInnerHTML={{ __html: g }} />)}
                                    </div>
                                </details>
                            )}
                            {card.report && (
                                <details className="rr-more">
                                    <summary>{w.inReport}</summary>
                                    <dl className="rr-more-body">
                                        <dt>{w.evidence}</dt>
                                        <dd dangerouslySetInnerHTML={{ __html: words.report.evidence }} />
                                        <dt>{w.estimate}</dt>
                                        <dd dangerouslySetInnerHTML={{ __html: words.report.estimate }} />
                                    </dl>
                                </details>
                            )}
                        </article>
                    );
                })}
            </div>
            <blockquote className="rr-pull">
                <p>{parts(w.quote, { text: <>{summary.charAt(0).toUpperCase()}{summary.slice(1)}</> })}</p>
                <cite>{w.cite}</cite>
            </blockquote>
        </Section>
    );
}

function Methods({ lang, t, x, figures }) {
    const w = t.methods;
    return (
        <Section id="methods" eyebrow={w.eyebrow} title={w.title}>
            <p>{w.intro}</p>
            <ol className="rr-methods">
                {data.methods.map((m, j) => {
                    const used = new Set();
                    const words = x.methods[m.key];
                    return (
                        <li className="rr-method" id={`method-${m.key}`} key={m.key}>
                            {figures[`figure${cap(m.key)}`] || <MethodFigure sceneKey={m.key} label={words.alt} caption={words.caption} lang={lang} />}
                            <div className="rr-method-text">
                                <span className="rr-method-no">{String(j + 1).padStart(2, '0')}</span>
                                <h3>{words.heading}</h3>
                                <p>{words.plain}</p>
                                <p className="rr-seen">{w.seenIn}{m.seen.map((i) => {
                                    const e = t.entries[ENTRIES[i].id];
                                    return <a key={i} className="rr-chip" href={`#${ENTRIES[i].id}`}>{parts(w.seen, { date: e.date, title: e.title })}</a>;
                                })}</p>
                                <details className="rr-more">
                                    <summary>{w.inReport}</summary>
                                    <div className="rr-more-body">
                                        <p><b>{parts(w.runIn, { title: words.title })}</b> <span dangerouslySetInnerHTML={{ __html: linkHtml(words.text, matchersFor(lang), used) }} /></p>
                                    </div>
                                </details>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Section>
    );
}

function Instruments({ t, x }) {
    const w = t.instruments;
    return (
        <Section id="instruments" eyebrow={w.eyebrow} title={w.title}>
            <p>{w.intro}</p>
            <div className="rr-cards">
                {data.instruments.map((it) => (
                    <article className="rr-card" key={it.name}>
                        <h3>{x.instruments[it.name].name}</h3>
                        <p>{x.instruments[it.name].plain}</p>
                        <details className="rr-more">
                            <summary>{w.inReport}</summary>
                            <div className="rr-more-body"><p dangerouslySetInnerHTML={{ __html: x.instruments[it.name].text }} /></div>
                        </details>
                    </article>
                ))}
            </div>
        </Section>
    );
}

function OpenQuestions({ t, x }) {
    const w = t.open;
    return (
        <Section id="open" eyebrow={w.eyebrow} title={w.title}>
            <p>{w.intro}</p>
            <ul className="rr-open">
                {x.open.map((q) => <li key={q.title}><h3>{q.title}</h3><p>{q.text}</p></li>)}
            </ul>
            <div className="rr-latest">
                <h3>{w.latest}</h3>
                <p>{x.latest}</p>
            </div>
        </Section>
    );
}

// a translated glossary is listed in its own language's alphabetical order; English keeps the data's
const collators = new Map();
function glossaryOrder(t, lang) {
    const ids = Object.keys(t.terms);
    if (lang === 'en') return ids;
    if (!collators.has(lang)) collators.set(lang, new Intl.Collator(lang, { sensitivity: 'base' }));
    const collator = collators.get(lang);
    return [...ids].sort((a, b) => collator.compare(t.terms[a].term, t.terms[b].term));
}

function Glossary({ lang, t, x, updated }) {
    const w = t.glossary;
    const [before, after] = w.source.split('{link}');
    return (
        <Section id="glossary" eyebrow={w.eyebrow} title={w.title}>
            <dl className="rr-glossary">
                {glossaryOrder(t, lang).map((id) => (
                    <div key={id} id={id}><dt>{t.terms[id].term}</dt><dd>{t.terms[id].def}</dd></div>
                ))}
            </dl>
            <p className="rr-fine">
                {before}<a href={data.source.href} target="_blank" rel="noopener noreferrer">{x.source} <span aria-hidden="true">↗</span></a>{after}
                {' '}{w.sourceNote}
                {updated && <Updated template={w.updated} updated={updated} />}
            </p>
        </Section>
    );
}
