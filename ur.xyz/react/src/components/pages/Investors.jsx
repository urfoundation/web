import React from 'react';
import InvestorCentre from './investors/InvestorCentre';
import DeckViewer from './investors/DeckViewer';
import InvestorAnnouncement from './investors/InvestorAnnouncement';
import ApexAnnouncement from './investors/ApexAnnouncement';
import InvestorLetter from './investors/InvestorLetter';
import InvestorLetterTranslation from './investors/InvestorLetterTranslation';
import TokenholderLetter from './investors/TokenholderLetter';
import NetworkCapacityLetter from './investors/NetworkCapacityLetter';

/**
 * The Investor Centre and its documents, one component per slug, in the
 * page's language (`lang`; react/src/i18n/pages/investors/).
 *
 * Rendered by the SPA (App.jsx, inside SectionPage) and server-rendered by
 * the Astro build's thin pages (astro/src/components/routes/InvestorsRoute.astro,
 * behind astro/src/pages/investors*.astro and their [lang] twins), which own
 * the <head> and the shell. This returns only what goes inside
 * <main class="section-page">; each document brings its own wrapper and
 * stylesheet.
 */
const DOCUMENTS = new Map([
    ['deck', DeckViewer],
    ['conviction-lock', InvestorAnnouncement],
    ['apex-competition', ApexAnnouncement],
    ['our-letter-to-bittensor', InvestorLetter],
    ['letter-to-tokenholders-september-2026', TokenholderLetter],
    ['funding-network-capacity', NetworkCapacityLetter],
    // The letter's former address: the Astro page redirects there, the SPA
    // simply renders the letter.
    ['august-investment-letter', InvestorLetter],
]);

// The Bittensor letter's English page is InvestorLetter.jsx, which its PDF
// is printed from; a translation renders InvestorLetterTranslation.jsx.
const TRANSLATED = new Map([
    ['our-letter-to-bittensor', InvestorLetterTranslation],
    ['august-investment-letter', InvestorLetterTranslation],
]);

export default function InvestorsPage({ route, lang = 'en' }) {
    const slug = route?.slug;
    const Document = (lang !== 'en' && TRANSLATED.get(slug)) || DOCUMENTS.get(slug) || InvestorCentre;
    return <Document lang={lang} />;
}
