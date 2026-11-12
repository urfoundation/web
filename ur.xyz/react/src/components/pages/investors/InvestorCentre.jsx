import React, { useEffect, useRef, useState } from 'react';
import { investorCentre, externalResources, investorResearchPrompt } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { formatNumber, interpolate, plural } from '../../../i18n/format.js';
import { groupPageHref } from '../../../../../astro/src/lib/route-localization.js';
import { rich } from './rich.jsx';
import { TranslationNotice, categoryLabel, docCopy, docDate, groupCopy, kindLabel, pagePath } from './shared.jsx';
import './InvestorCentre.css';

/**
 * The Investor Centre (/investors): the featured document, the archive of
 * every investor document with a search and a type filter, the network and
 * research links, and the disclosure.
 *
 * Only the page body: the shell (nav, footer, <main class="section-page">)
 * comes from the SPA's SectionPage and from astro/src/pages/investors.astro.
 *
 * The page's text is react/src/i18n/pages/investors/centre/, the documents'
 * the group's (react/src/i18n/pages/investors/en.js), in the page's language.
 */

const { featured, deck, updates, materials, metrics } = investorCentre;
const SHOW_METRICS = false;
// A translated date is formatted by Intl, whose wording can differ by a
// character between the build's ICU and a visitor's browser; the elements
// that show one keep the server's text when the page hydrates
// (suppressHydrationWarning). English dates are the registry's own strings.
const copy = await loadPageCopy('investors/centre');

// The research links' prompt is English, the registry's; on a translated page
// it asks for the answer in the page's language.
const RESEARCH_LANGUAGE = { ru: 'Russian', ar: 'Arabic', zh: 'Simplified Chinese', de: 'German', es: 'Spanish' };
function researchLinks(lang) {
    if (!RESEARCH_LANGUAGE[lang]) return externalResources;
    const prompt = `${investorResearchPrompt}\n\nWrite the response in ${RESEARCH_LANGUAGE[lang]}.`;
    return {
        ...externalResources,
        chatgpt: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
        claude: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    };
}

// Every document the centre lists, newest first and one row each: the dated
// updates plus the reference materials, which carry their own date or, for
// the deck, the deck's.
// An undated item keeps date null and shows the copy's "Not dated".
const archiveItems = [...updates, ...materials.map(item => ({
    ...item,
    date: item.date || (item.href === deck.href ? deck.date : null),
    dateIso: item.dateIso || (item.href === deck.href ? deck.dateIso : null),
    kind: item.href === deck.href ? deck.kind : 'Link',
    format: item.pdfHref ? 'PDF' : 'Web',
}))]
    .filter((item, index, items) => items.findIndex(candidate => candidate.href === item.href) === index)
    .sort((a, b) => Number(Boolean(b.draft)) - Number(Boolean(a.draft)) || (b.dateIso || '').localeCompare(a.dateIso || ''));
const archiveKinds = [...new Set(archiveItems.map(item => item.kind))];

// A row as the page shows it in `lang`: the filter values (`kind`) stay the
// registry's, the text is the page's language.
function archiveRows(lang) {
    const shared = groupCopy(lang);
    const t = copy(lang);
    return archiveItems.map(item => {
        const text = docCopy(shared, item);
        return {
            ...item,
            date: item.date ? docDate(item, lang) : t.notDated,
            kindText: kindLabel(shared, item.kind),
            title: text.title,
            category: categoryLabel(shared, item.category),
            readTime: text.readTime,
        };
    });
}

// A row's page in the page's language once it has translations: the Investor
// Centre's own documents and the litepaper; anything else as it is.
const localHref = (lang, href) => groupPageHref(href, lang) || href;

// What the search box matches: the row's visible text, as the page's script
// matched each row's textContent before the port.
const rowText = (item, t) => [
    item.date,
    item.kindText,
    item.title,
    item.readTime || item.detail || '',
    item.pdfHref ? `${t.pdf} ↓` : `${t.read} →`,
].join(' ').toLowerCase();

export default function InvestorCentre({ lang = 'en' }) {
    const t = copy(lang);
    const shared = groupCopy(lang);
    const lead = docCopy(shared, featured);
    const research = researchLinks(lang);
    const rows = archiveRows(lang);
    const [query, setQuery] = useState('');
    const [kind, setKind] = useState('all');
    const needle = query.trim().toLowerCase();
    const shown = rows.map(item =>
        (!needle || rowText(item, t).includes(needle)) && (kind === 'all' || item.kind.toLowerCase() === kind));
    const shownCount = shown.filter(Boolean).length;
    const updated = docDate({ date: investorCentre.updated, dateIso: investorCentre.updatedIso }, lang);

    return (
        <div className="investor-page">
            <header className="investor-hero investor-shell">
                <div className="investor-hero__title">
                    <span className="investor-eyebrow">{t.eyebrow}</span>
                    <h1>{t.title}</h1>
                    <div className="investor-hero__rule" aria-hidden="true"></div>
                </div>
                <p className="investor-updated">
                    <span aria-hidden="true"></span>
                    {rich(t.updated, {}, { date: <time dateTime={investorCentre.updatedIso} suppressHydrationWarning>{updated}</time> })}
                </p>
            </header>

            {lang !== 'en' && (
                <div className="investor-shell">
                    <TranslationNotice lang={lang} text={shared.translation.centre} href="/investors" />
                </div>
            )}

            <section className="investor-about investor-shell" aria-labelledby="about-ur">
                <h2 id="about-ur">{t.aboutHeading}</h2>
                <div className="investor-about__copy">
                    {t.about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>
            </section>

            <div className="investor-views investor-shell" data-investor-views="">

                <section className="investor-library">
                    <div className="investor-section-heading">
                        <h2>{t.latestHeading}</h2>
                        <span>{t.latestNote}</span>
                    </div>

                    <a className="featured-letter" href={pagePath(lang, featured.href)}>
                        <p className="resource-meta">
                            <time dateTime={featured.dateIso} suppressHydrationWarning>{docDate(featured, lang)}</time>
                            <span aria-hidden="true">·</span>
                            {categoryLabel(shared, featured.category)}
                            <span aria-hidden="true">·</span>
                            {kindLabel(shared, featured.kind)}
                            <span aria-hidden="true">·</span>
                            {lead.readTime}
                        </p>
                        <div className="featured-letter__content">
                            <h3>{lead.title}</h3>
                            <div className="featured-letter__details">
                                <p>{lead.summary}</p>
                                <span className="featured-letter__action">{lead.cta} <i aria-hidden="true">→</i></span>
                            </div>
                        </div>
                    </a>

                </section>

                <section className="investor-archive" id="announcements" aria-labelledby="all-investor-materials">
                    <div className="investor-archive__heading">
                        <div>
                            <h2 id="all-investor-materials">{t.archiveHeading}</h2>
                            <p>{t.archiveIntro}</p>
                        </div>
                        <span suppressHydrationWarning>{interpolate(t.updated, { date: updated })}</span>
                    </div>

                    <div className="archive-controls" aria-label={t.filterAria}>
                        <label className="archive-search">
                            <span className="investor-sr-only">{t.searchLabel}</span>
                            <input
                                type="search"
                                placeholder={t.searchPlaceholder}
                                data-archive-search=""
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                            />
                        </label>
                        <label>
                            <span className="investor-sr-only">{t.kindLabel}</span>
                            <select data-archive-kind="" value={kind} onChange={event => setKind(event.target.value)}>
                                <option value="all">{t.allKinds}</option>
                                {archiveKinds.map(archiveKind => (
                                    <option key={archiveKind} value={archiveKind.toLowerCase()}>{kindLabel(shared, archiveKind)}</option>
                                ))}
                            </select>
                        </label>
                        <p className="archive-count" aria-live="polite">
                            {rich(plural(lang, shownCount, t.count), {}, { count: <strong data-archive-count="">{shownCount}</strong> })}
                        </p>
                    </div>

                    <div className="archive-list" data-archive-list="">
                        <div className="archive-row archive-row--heading" aria-hidden="true">
                            <span>{t.columns.date}</span><span>{t.columns.title}</span><span>{t.columns.format}</span>
                        </div>
                        {rows.map((item, index) => (
                            <article
                                key={item.href}
                                className="archive-row"
                                data-archive-item=""
                                data-kind={item.kind.toLowerCase()}
                                hidden={!shown[index]}
                            >
                                <time dateTime={item.dateIso || undefined} suppressHydrationWarning>{item.date}</time>
                                <div className="archive-row__title">
                                    <a href={localHref(lang, item.href)}>{item.title}</a>
                                    <small>{[item.category, item.readTime || item.detail].filter(Boolean).join(' · ')}</small>
                                </div>
                                <div className="archive-row__format">
                                    {item.pdfHref
                                        ? <a href={item.pdfHref} download hrefLang={lang === 'en' ? undefined : 'en'}>{`${t.pdf} `}<span aria-hidden="true">↓</span></a>
                                        : <a href={localHref(lang, item.href)}>{`${t.read} `}<span aria-hidden="true">→</span></a>}
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="archive-empty" data-archive-empty="" hidden={shownCount !== 0}>{t.empty}</p>
                </section>
            </div>

            {SHOW_METRICS && <InvestorMetrics lang={lang} />}

            <section className="investor-explore investor-shell" aria-label={t.exploreAria}>
                <div className="explore-panel">
                    <h2>{t.exploreHeading}</h2>
                    <p>{t.exploreText}</p>
                    <nav className="network-links" aria-label={t.networkLinksAria}>
                        <a href={research.dashboard} target="_blank" rel="noopener noreferrer">
                            {`${t.dashboard} `}<span aria-hidden="true">↗</span>
                        </a>
                        <a className="network-brand network-brand--tmc" href={research.taoMarketCap} target="_blank" rel="noopener noreferrer">
                            <img src="/investors/taomarketcap.svg" alt="TaoMarketCap" />
                            <span aria-hidden="true">↗</span>
                        </a>
                        <a className="network-brand network-brand--taostats" href={research.taostats} target="_blank" rel="noopener noreferrer">
                            <img src="/investors/taostats.svg" alt="taostats" />
                            <span aria-hidden="true">↗</span>
                        </a>
                    </nav>
                </div>

                <div className="explore-panel explore-panel--research">
                    <h2>{t.researchHeading}</h2>
                    <p>{t.researchText}</p>
                    <nav className="research-links" aria-label={t.researchLinksAria}>
                        <a href={research.chatgpt} target="_blank" rel="noopener noreferrer">
                            <img src="/investors/openai.svg" alt="" width="16" height="16" />
                            ChatGPT
                        </a>
                        <a href={research.claude} target="_blank" rel="noopener noreferrer">
                            <img src="/investors/claude.svg" alt="" width="16" height="16" />
                            Claude
                        </a>
                    </nav>
                </div>
            </section>

            <aside className="investor-disclosure investor-shell" aria-label={shared.disclaimerAria}>
                {shared.disclosure}
            </aside>
        </div>
    );
}

// Kept behind SHOW_METRICS: the figures are a snapshot, not a feed.
function InvestorMetrics({ lang = 'en' }) {
    const t = copy(lang).metrics;
    const sectionRef = useRef(null);

    // Count each figure up from zero when the section scrolls into view;
    // reduced motion, or no IntersectionObserver, prints the final values.
    useEffect(() => {
        const section = sectionRef.current;
        const counters = Array.from(section.querySelectorAll('[data-count]'));
        const format = (value, decimals) => formatNumber(value, lang, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        const targetOf = (element) => [Number(element.dataset.count), Number(element.dataset.decimals || 0)];
        const finish = (element) => {
            const [value, decimals] = targetOf(element);
            element.textContent = format(value, decimals);
        };
        let cancelled = false;
        const animate = (element) => {
            const [value, decimals] = targetOf(element);
            const duration = 900;
            const started = performance.now();
            const frame = (now) => {
                if (cancelled) return;
                const progress = Math.min((now - started) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = format(value * eased, decimals);
                if (progress < 1) requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            counters.forEach(finish);
            return undefined;
        }
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            counters.forEach(animate);
            observer.disconnect();
        }, { threshold: 0.3 });
        observer.observe(section);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, []);

    return (
        <section className="investor-metrics investor-shell" aria-labelledby="metrics-title" ref={sectionRef}>
            <h2 id="metrics-title">{t.heading}</h2>
            <div className="investor-metric-grid">
                {metrics.map((metric, i) => (
                    <article className="investor-metric" key={metric.label}>
                        <p className="investor-metric__label">{t.items[i].label}</p>
                        <p className="investor-metric__value">
                            <strong>
                                <span data-count={metric.value} data-decimals={metric.decimals}>{metric.value}</span>
                                {metric.suffix && <span className="investor-metric__suffix"> {metric.suffix}</span>}
                            </strong>
                            {metric.usd && <small>({metric.usd})</small>}
                        </p>
                        <p className="investor-metric__context">{t.items[i].context}</p>
                        <p className="investor-metric__change">{t.items[i].change}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
