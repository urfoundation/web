import React from 'react';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { formatDate } from '../../../i18n/format.js';
import { LANG_STORAGE_KEY } from '../../../../../astro/src/lib/route-localization.js';
import { rich } from './rich.jsx';
import { categoryKey, documentKey, kindKey } from './keys.js';
import './InvestorTranslation.css';

/**
 * What the investor pages share: the group's copy (the registry's text, the
 * categories and kinds, the chrome; react/src/i18n/pages/investors/en.js), a
 * document's date in the page's language, the notice a translated page opens
 * with, and the announcement chrome four documents repeat.
 *
 * Every piece takes the page's `lang`. English renders exactly what the pages
 * rendered before they were translated, and a translated page states that the
 * English is the authoritative version and links it.
 */
export const groupCopy = await loadPageCopy('investors');

export const docCopy = (t, doc) => t.docs[documentKey(doc.href)];
export const categoryLabel = (t, category) => t.categories[categoryKey(category)] || category;
export const kindLabel = (t, kind) => t.kinds[kindKey(kind)] || kind;

/** A localized page's address: /<lang><path>, or the path itself in English. */
export const pagePath = (lang, path) => (!lang || lang === 'en' ? path : `/${lang}${path}`);

/**
 * A document's date as its page shows it: the registry's own wording in
 * English ("9 September 2026"), the same day in the page's language otherwise.
 */
export function docDate(doc, lang, options) {
    if (!lang || lang === 'en' || !doc.dateIso) return doc.date;
    return formatDate(doc.dateIso, lang, options);
}

// A visitor who follows the link to the English original has chosen English,
// as with the language switcher: record it, or the stored-language redirect
// would send them straight back to the translation. The static pages that do
// not hydrate do the same from INVESTOR_LANG_CHOICE_SCRIPT.
function rememberEnglish() {
    try { window.localStorage.setItem(LANG_STORAGE_KEY, 'en'); } catch (e) { /* private mode */ }
}

export const INVESTOR_LANG_CHOICE_SCRIPT = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang-choice]');if(!a)return;try{localStorage.setItem(${JSON.stringify(LANG_STORAGE_KEY)},a.getAttribute('data-lang-choice'))}catch(_){}});`;

/**
 * The note a translated page opens with: the English is the authoritative
 * version, and <english> in the text links it. Nothing in English.
 */
export function TranslationNotice({ lang, text, href, className }) {
    if (!lang || lang === 'en') return null;
    return (
        <p className={className ? `investor-translation ${className}` : 'investor-translation'} role="note">
            {rich(text, {
                english: (words) => (
                    <a href={href} hrefLang="en" data-lang-choice="en" onClick={rememberEnglish}>{words}</a>
                ),
            })}
        </p>
    );
}

/** The back link and the PDF download above an announcement or letter. */
export function AnnouncementToolbar({ lang, pdfHref }) {
    const t = groupCopy(lang);
    const english = lang && lang !== 'en';
    return (
        <div className="announcement-toolbar announcement-shell">
            <a className="announcement-back" href={pagePath(lang, '/investors')}>
                <span aria-hidden="true">←</span>{` ${t.investorCentre}`}
            </a>
            <div className="announcement-actions">
                <a className="announcement-download" href={pdfHref} download hrefLang={english ? 'en' : undefined}>
                    {`${english ? t.downloadPdfEnglish : t.downloadPdf} `}<span aria-hidden="true">↓</span>
                </a>
            </div>
        </div>
    );
}

/**
 * The summary above the sheet: the category, the page's heading, the issuer,
 * the date and the reading time, then, translated, the notice.
 */
export function AnnouncementSummary({ lang, doc, heading, compact = false }) {
    const t = groupCopy(lang);
    return (
        <header className="announcement-summary announcement-shell">
            <p className="announcement-kicker">
                <span aria-hidden="true"></span>
                {categoryLabel(t, doc.category)}
            </p>
            <h1 className={compact ? 'announcement-summary-title--compact' : undefined}>{heading}</h1>
            <div className="announcement-summary-meta">
                <div className="announcement-issuer">
                    <span className="announcement-issuer__mark" aria-hidden="true">
                        <img src="/favicon.svg" alt="" />
                    </span>
                    <span>
                        <strong>UR Foundation</strong>
                        <small>UR (SN25)</small>
                    </span>
                </div>
                <p>
                    {/* an undated draft shows the registry's wording for its date */}
                    <span>{doc.dateIso ? rich(t.dated, {}, { date: <time dateTime={doc.dateIso}>{docDate(doc, lang)}</time> }) : doc.date}</span>
                    <span>{docCopy(t, doc).readTime}</span>
                </p>
            </div>
            <TranslationNotice lang={lang} text={t.translation.document} href={doc.href} className="announcement-translation" />
        </header>
    );
}

/** The sheet's letterhead: the wordmark and the foundation's address block. */
export function Letterhead({ lang }) {
    const { letterhead } = groupCopy(lang);
    return (
        <header className="announcement-letterhead">
            <img className="announcement-wordmark" src="/ur.svg" alt="UR" />
            <address className="announcement-address">
                <strong>{letterhead.foundation}</strong>
                {letterhead.subnet}<br />
                {letterhead.protocol}<br />
                {letterhead.network}<br />
                {letterhead.applications}
            </address>
        </header>
    );
}

/** The sheet's date line. */
export function SheetDate({ lang, doc }) {
    return <p className="announcement-date">{doc.dateIso ? <time dateTime={doc.dateIso}>{docDate(doc, lang)}</time> : doc.date}</p>;
}

/** The closing disclosure on a sheet, with any sentence the document adds. */
export function SheetDisclosure({ lang, extra }) {
    const t = groupCopy(lang);
    return <p className="announcement-legal"><em>{extra ? `${t.disclosure} ${extra}` : t.disclosure}</em></p>;
}
