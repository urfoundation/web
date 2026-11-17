/**
 * A legal document's translation as its page shows it, on both renderers
 * (astro/src/components/LegalPage.astro, components/LegalSection.jsx): the
 * translated markdown (react/src/i18n/pages/docs/corpus/<lang>/legal/)
 * converted as scripts/generate-legal.mjs converts the English, and the
 * English document's revision date written in the reader's language.
 */
import { legalMdToHtml, legalTitle } from '../../../scripts/legal-md.mjs';
import { intlLocale } from '../i18n/format.js';

/** { title, html } of a translated legal document's markdown, without its own title heading (the page prints it). */
export function translatedLegal(md) {
    return {
        title: legalTitle(md),
        html: legalMdToHtml(md).replace(/^\s*<h1>[\s\S]*?<\/h1>\n?/, ''),
    };
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * The English document's "Last revised" date ("April 2026", "May 8, 2025") in
 * `lang`; as written for English, or when it is not a date this reads.
 */
export function legalRevisedDate(english, lang) {
    if (!english || !lang || lang === 'en') return english;
    const m = String(english).trim().match(/^([A-Za-z]+)\s+(?:(\d{1,2}),?\s+)?(\d{4})$/);
    const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
    if (month < 0) return english;
    const day = m[2] ? Number(m[2]) : 1;
    const options = { year: 'numeric', month: 'long', timeZone: 'UTC', ...(m[2] ? { day: 'numeric' } : {}) };
    return new Intl.DateTimeFormat(intlLocale(lang), options).format(new Date(Date.UTC(Number(m[3]), month, day)));
}
