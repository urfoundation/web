import React from 'react';
import Section from '../Section';
import { EXTERNAL, isExternal } from '../../lib/links';
import timeline from '../../data/mainnet-timeline.json';
import { mainnetActions, mainnetAfterEpochs, mainnetBeforeEpochs, mainnetEpochs, mainnetNotices } from '../../data/mainnet';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { interpolate, plural } from '../../i18n/format.js';
import { groupPageHref } from '../../../../astro/src/lib/route-localization.js';
import {
    epochBlocks,
    epochDays,
    epochWhen,
    groupByEpoch,
    isApproximate,
    runs,
    shortHex,
    sourceRows,
    whenParts,
} from './mainnet/timeline';
import { localizeActions, localizeEpochs, localizeEvents, localizeNotices } from './mainnet/copy';
import { noticeVersion, wireNoticeBoard } from './mainnet/notices';
import { summaryModel } from './mainnet/summary';
import MainnetSummary from './mainnet/MainnetSummary';
import '../RoadmapTrack.css';
import './Mainnet.css';

// The page's words in every language (i18n/pages/mainnet): its own, the data's
// (data/mainnet.js: the notices, the box, the epochs) and the milestones'.
const pageCopy = await loadPageCopy('mainnet');
const dataCopy = await loadPageCopy('mainnet/data');
const timelineCopy = await loadPageCopy('mainnet/timeline');

/**
 * MainnetPage — the /mainnet page body: the SN25 mainnet launch timeline.
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and the Astro pages (astro/src/pages/mainnet.astro
 * and its /<lang>/mainnet twins, through components/routes/MainnetRoute.astro)
 * provide the Disclaimer + Nav + Footer shell around it, so the renders share
 * one source. The milestones are data (data/mainnet-timeline.json), grouped by
 * the payout epochs of data/mainnet.js and drawn on the roadmap's vertical
 * track (RoadmapTrack.css). Every word is the page's copy in `lang`
 * (i18n/pages/mainnet, components/pages/mainnet/copy.js); the dates,
 * statuses, figures and links are the data's in every language, and the
 * notices are newest first in every language, as the data sorts them. Apart
 * from the summary's "now" and the notice board's state, it needs no
 * browser: the Astro page renders it to static HTML, and its own script wires
 * the notice board (mainnet/notices.js).
 *
 * `updated` is the day the page's content last changed (the sitemap's
 * lastmod), which only the static build knows; the SPA leaves it out.
 *
 * Under the title, the launch at a glance (mainnet/MainnetSummary.jsx)
 * draws the epochs and the key milestones on one axis, with "now", which
 * needs the visitor's clock. The SPA renders it here; the static page,
 * which renders the rest without script, passes it in as `summary`, an
 * island that hydrates by itself, given its model in the page's language.
 */
export default function MainnetPage({ lang = 'en', updated = null, summary = null }) {
    const t = pageCopy(lang);
    const data = dataCopy(lang);
    const events = localizeEvents(timeline.events, timelineCopy(lang));
    // each notice's version is its English's (notices.js noticeVersion), so a mark holds in every language
    const versions = Object.fromEntries(mainnetNotices.map((notice) => [notice.id, noticeVersion(notice)]));
    const notices = localizeNotices(mainnetNotices, data, t).map((notice) => ({ ...notice, version: versions[notice.id] }));
    const epochs = localizeEpochs(mainnetEpochs, data);
    const groups = groupByEpoch(events, epochs, {
        before: { ...mainnetBeforeEpochs, ...data.before },
        after: { ...mainnetAfterEpochs, ...data.after },
        t,
    });
    const grouped = new Set(groups.map((group) => group.id));

    return (
        <div className="mainnet-page">
            <NoticeBoard notices={notices} t={t} />
            <MinerActions actions={localizeActions(mainnetActions, data)} lang={lang} t={t} />

            <Section id="mainnet" eyebrow={t.intro.eyebrow} title={t.intro.title} headingLevel="h1">
                <div className="mainnet-lede">
                    <p>{t.intro.lede}</p>
                    <p className="mainnet-note">
                        {fill(t.intro.note, {
                            scheduled: <span className="roadmap-flag" data-status="scheduled">{t.labels.status.scheduled}</span>,
                            planned: <span className="roadmap-flag" data-status="planned">{t.labels.status.planned}</span>,
                        })}
                    </p>
                </div>
                {summary || <MainnetSummary model={summaryModel(events, mainnetEpochs, { t })} />}
            </Section>

            <Section id="settlement" eyebrow={t.settlement.eyebrow} title={t.settlement.title}>
                {t.settlement.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <ol className="mainnet-epochs" aria-label={t.settlement.epochsAria}>
                    {epochs.map((epoch) => {
                        const id = `epoch-${epoch.number}`;
                        const row = (
                            <>
                                <span className="mainnet-epoch-no">{runs(t.labels.epoch, { number: epoch.number })}</span>{' '}
                                <span className="mainnet-epoch-days"><When parts={whenParts(epochDays(epoch), { t })} /></span>{' '}
                                <span className="mainnet-epoch-by" data-settlement={epoch.settlement}>{t.labels.settlement[epoch.settlement]}</span>
                                {epoch.captureTheFlag && <>{' '}<FlagTag t={t} /></>}
                            </>
                        );
                        return (
                            <li key={epoch.number}>
                                {grouped.has(id) ? <a href={`#${id}`}>{row}</a> : <div>{row}</div>}
                            </li>
                        );
                    })}
                </ol>
            </Section>

            <Section id="milestones" eyebrow={t.milestones.eyebrow} title={t.milestones.title}>
                {groups.map((group) => <MilestoneGroup key={group.id} group={group} explorers={timeline.explorers} lang={lang} t={t} />)}
                <p className="mainnet-fine">
                    {t.milestones.fine}
                    {updated && <>{after(t.milestones.fine, fill(t.milestones.updated, { date: <time dateTime={updated}>{updated}</time> }))}</>}
                </p>
            </Section>
        </div>
    );
}

/**
 * A template's runs as React children (timeline.js runs): the words as text,
 * each element value in its place with a key.
 */
function fill(template, values) {
    return runs(template, values).map((part, index) => (React.isValidElement(part) ? React.cloneElement(part, { key: index }) : part));
}

/**
 * Runs that follow `sentence`: a space before their first word, as after an
 * English full stop, but none after a Chinese one (。), which takes no space.
 */
function after(sentence, parts) {
    if (/[。！？]$/u.test(sentence)) return parts;
    return typeof parts[0] === 'string' ? [` ${parts[0]}`, ...parts.slice(1)] : [' ', ...parts];
}

/**
 * The notice board above the box at the top: the dated notices
 * (data/mainnet.js mainnetNotices, newest first) as a table, a row group
 * each, anchored at the notice's id (/mainnet#notice). A row shows the
 * unread mark, the day it was posted (copy.js noticeDate), the title, which
 * is the button that opens the row, and "Mark read" and "Archive"; open, the
 * row below it holds the text and the link to the full notice.
 *
 * React renders the markup only. The state (open, read, archived, the
 * Inbox or Archived view) is attributes that one controller sets, here from
 * an effect and on the static page from its own script
 * (mainnet/notices.js wireNoticeBoard), so the two behave alike. Each label
 * that changes with the state is written twice, and the CSS shows the one
 * that applies.
 */
function NoticeBoard({ notices, t }) {
    const board = React.useRef(null);
    React.useEffect(() => wireNoticeBoard(board.current), []);
    const b = t.noticeBoard;
    return (
        <section className="mainnet-notices" id="notices" aria-labelledby="notices-heading" data-view="inbox" ref={board}>
            <div className="mainnet-notices-box">
                <div className="mainnet-notices-bar">
                    <h2 className="mainnet-notices-title" id="notices-heading">{b.title}</h2>
                    <div className="mainnet-notices-tabs" role="group" aria-label={b.viewsAria}>
                        <button type="button" className="mainnet-notices-tab" data-tab="inbox" aria-pressed="true">
                            {b.inbox} <span className="mainnet-notices-count" data-count="inbox" />
                        </button>
                        <button type="button" className="mainnet-notices-tab" data-tab="archived" aria-pressed="false">
                            {b.archived} <span className="mainnet-notices-count" data-count="archived" />
                        </button>
                    </div>
                    <button type="button" className="mainnet-notices-allread" data-act="all-read">{b.markAllRead}</button>
                </div>
                <table className="mainnet-notices-table">
                    <thead>
                        <tr>
                            <th scope="col" className="mainnet-notices-col-dot"><span className="mainnet-visually-hidden">{b.columns.status}</span></th>
                            <th scope="col" className="mainnet-notices-col-date">{b.columns.date}</th>
                            <th scope="col">{b.columns.notice}</th>
                            <th scope="col" className="mainnet-notices-col-actions"><span className="mainnet-visually-hidden">{b.columns.actions}</span></th>
                        </tr>
                    </thead>
                    {notices.map((notice) => <NoticeRow key={notice.id} notice={notice} t={t} />)}
                    <tbody className="mainnet-notices-empty" hidden>
                        <tr>
                            <td colSpan={4}>
                                <span data-when-view="inbox">{b.emptyInbox}</span>
                                <span data-when-view="archived">{b.emptyArchived}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p className="mainnet-notices-fine">{b.stored}</p>
            </div>
        </section>
    );
}

/** One notice of the board: its row, and below it the row with its text. */
function NoticeRow({ notice, t }) {
    const b = t.noticeBoard;
    const external = isExternal(notice.link.href) ? EXTERNAL : {};
    const titleId = `${notice.id}-heading`;
    const textId = `${notice.id}-text`;
    return (
        <tbody className="mainnet-notice" id={notice.id} data-version={notice.version}>
            <tr className="mainnet-notice-row">
                <td className="mainnet-notice-dot">
                    <span className="mainnet-notice-mark" aria-hidden="true" />
                    <span className="mainnet-visually-hidden" data-when="unread">{b.unread}</span>
                </td>
                <td className="mainnet-notice-date">{notice.dateText}</td>
                <th scope="row" className="mainnet-notice-cell">
                    <button type="button" className="mainnet-notice-toggle" aria-controls={textId}>
                        <span className="mainnet-notice-title" id={titleId}>{notice.title}</span>
                        <svg className="mainnet-notice-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                            <path d="M2.5 4.5 6 8l3.5-3.5" />
                        </svg>
                    </button>
                </th>
                <td className="mainnet-notice-actions">
                    <button type="button" className="mainnet-notice-act" data-act="read" aria-describedby={titleId}>
                        <span data-when="unread">{b.markRead}</span>
                        <span data-when="read">{b.markUnread}</span>
                    </button>
                    <button type="button" className="mainnet-notice-act" data-act="archive" aria-describedby={titleId}>
                        <span data-when="inbox">{b.archive}</span>
                        <span data-when="archived">{b.restore}</span>
                    </button>
                </td>
            </tr>
            <tr className="mainnet-notice-detail" id={textId}>
                <td colSpan={4}>
                    <div className="mainnet-notice-text">
                        {notice.paragraphs.map((paragraph) => <p className="mainnet-notice-body" key={paragraph}>{paragraph}</p>)}
                        <a className="mainnet-notice-link" href={notice.link.href} {...external}>{notice.link.label} <span aria-hidden="true">{t.labels.arrow}</span></a>
                    </div>
                </td>
            </tr>
        </tbody>
    );
}

/**
 * A link of the page's data to a page of this site, in the page's language
 * once that page has translations (/docs/miner#1-install is
 * /de/docs/miner#1-install on /de/mainnet); any other link as it is.
 */
const localHref = (href, lang) => groupPageHref(href, lang) || href;

/**
 * The box at the top: mainnet is live, and what miners need to do now
 * (data/mainnet.js, copy.js localizeActions). It comes before the timeline's
 * own title, so its headline is an h2 under the page's single h1.
 */
function MinerActions({ actions, lang, t }) {
    const links = Object.fromEntries(actions.links.map((link, index) => [`link${index + 1}`, <a href={localHref(link.href, lang)}>{link.text}</a>]));
    return (
        <section className="mainnet-actions" id="actions" aria-labelledby="actions-heading">
            <div className="mainnet-actions-box">
                <h2 className="mainnet-actions-headline" id="actions-heading">{actions.headline}</h2>
                <h3 className="mainnet-actions-title">{actions.title}</h3>
                <ol className="mainnet-actions-steps">
                    {actions.steps.map((step, index) => (
                        <li key={step.title}>
                            <span className="mainnet-actions-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                            <div className="mainnet-actions-step">
                                <p><strong>{step.title}</strong> {step.detail}</p>
                                {step.link && <a className="mainnet-actions-link" href={localHref(step.link.href, lang)}>{step.link.label} <span aria-hidden="true">{t.labels.arrow}</span></a>}
                            </div>
                        </li>
                    ))}
                </ol>
                <p className="mainnet-actions-closing">{fill(actions.closing, links)}</p>
            </div>
        </section>
    );
}

/**
 * Capture the flag beside an epoch's settlement: an epoch in which it pays
 * beside the provider pool (data/mainnet.js `captureTheFlag`, from epoch 8),
 * in its row of the epoch list and over its milestones, with a pennant.
 */
function FlagTag({ t }) {
    return (
        <span className="mainnet-epoch-flag">
            <svg className="mainnet-flag-icon" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                <path className="mainnet-flag-pole" d="M2.75 11.25V1" />
                <path className="mainnet-flag-cloth" d="M3.5 1.25h6.25L8.25 3.6l1.5 2.35H3.5z" />
            </svg>
            {t.labels.captureTheFlag}
        </span>
    );
}

/** A date's runs (timeline.js whenParts), the dated ones as <time>. */
function When({ parts }) {
    return parts.map((part, index) => (part.dateTime
        ? <time key={index} dateTime={part.dateTime}>{part.text}</time>
        : <React.Fragment key={index}>{part.text}</React.Fragment>));
}

/** One payout epoch (or the milestones before or after them) and its track. */
function MilestoneGroup({ group, explorers, lang, t }) {
    const { epoch } = group;
    const headingId = `${group.id}-heading`;
    const about = [group.summary, epoch && epochBlocks(epoch, { lang, t })].filter(Boolean).join(' · ');
    return (
        <section className="mainnet-group" id={group.id} aria-labelledby={headingId}>
            <header className="mainnet-group-head">
                <h3 id={headingId}>{group.title}</h3>
                {epoch && (
                    <p className="mainnet-group-when">
                        <When parts={whenParts(epochWhen(epoch), { approxStart: Boolean(epoch.start.projected), approxEnd: Boolean(epoch.end.projected), t })} />
                    </p>
                )}
                {(epoch || about) && (
                    <p className="mainnet-group-sub">
                        {epoch && <span className="mainnet-epoch-by" data-settlement={epoch.settlement}>{t.labels.settlement[epoch.settlement]}</span>}
                        {epoch?.captureTheFlag && <>{' '}<FlagTag t={t} /></>}
                        {epoch && about && ' '}
                        {about && <span className="mainnet-group-about">{about}</span>}
                    </p>
                )}
            </header>
            <ol className="roadmap mainnet-track">
                {group.events.map((event) => <Milestone key={event.id} event={event} explorers={explorers} lang={lang} t={t} />)}
            </ol>
        </section>
    );
}

/** One milestone: its date and status, what happens, and its sources. */
function Milestone({ event, explorers, lang, t }) {
    const { rows, folded } = sourceRows(event.sources, explorers, { t });
    return (
        <li className="roadmap-stop" id={event.id} data-status={event.status}>
            <span className="roadmap-node" aria-hidden="true" />
            <div className="roadmap-content">
                <div className="roadmap-meta">
                    <span className="roadmap-date"><When parts={whenParts(event.when, { approxStart: isApproximate(event, event.when), t })} /></span>{' '}
                    <span className="roadmap-flag" data-status={event.status}>{t.labels.status[event.status] || event.status}</span>
                </div>
                <h4 className="roadmap-title">{event.title}</h4>
                <p className="roadmap-body">{event.detail}</p>
                {rows.length > 0 && (
                    <ul className="mainnet-sources" aria-label={interpolate(t.labels.sourcesAria, { title: event.title })}>
                        {rows.map(({ source, link }) => <Source key={`${source.kind}:${source.ref}`} source={source} link={link} lang={lang} t={t} />)}
                    </ul>
                )}
                {/* a run of transactions (a deployment's) is listed, closed, under its contracts */}
                {folded.length > 0 && (
                    <details className="mainnet-sources-more">
                        <summary>{runs(plural(lang, folded.length, t.labels.transactions), { count: folded.length })}</summary>
                        <ul className="mainnet-sources" aria-label={interpolate(t.labels.transactionsAria, { title: event.title })}>
                            {folded.map(({ source, link }) => <Source key={`${source.kind}:${source.ref}`} source={source} link={link} lang={lang} t={t} />)}
                        </ul>
                    </details>
                )}
            </div>
        </li>
    );
}

/** A source with a ref: its label, a contract's address in the code face, and the link. */
function Source({ source, link, lang, t }) {
    const external = isExternal(link.href) ? EXTERNAL : {};
    const arrow = external.target ? <span aria-hidden="true"> ↗</span> : null;
    if (source.kind === 'doc') {
        return <li><a href={localHref(link.href, lang)} {...external}>{link.text}{arrow}</a></li>;
    }
    return (
        <li>
            <span className="mainnet-source-label">{source.label}</span>{' '}
            {link.value && <><code title={link.value} translate="no">{shortHex(link.value)}</code>{' '}</>}
            <a href={link.href} {...external} aria-label={interpolate(t.labels.sourceAria, { action: link.text, label: source.label })}>{link.text}{arrow}</a>
        </li>
    );
}
