// The investors group's shared English: what the registry says of each
// document (derived from react/src/data/investors.js, which stays the source:
// the Investor Centre's cards and rows, each document's <title>, description
// and heading), the categories and kinds that file them, and the chrome every
// document page repeats. Each document's own text is its unit's
// (./<slug>/en.js); the Investor Centre page's is ./centre/en.js.
//
// Inline markup in a string (<english>…</english>) and placeholders ({date})
// are filled by components/pages/investors/rich.jsx; a translation keeps them.
import { CATEGORIES, investorCentre } from '../../../data/investors.js';
import { categoryKey, documentKey } from '../../../components/pages/investors/keys.js';

const { deck, letter, convictionAnnouncement, tokenholderLetter, capacityLetter, apexAnnouncement, materials } = investorCentre;

// What the registry says of one document. metaTitle and metaDescription are
// what its page's <title> and meta description say: the headline (or title)
// and the description (or summary), as the English pages have always said.
// A translation may shorten them to fit (60 graphemes, 175 characters).
function registryCopy(doc) {
    return {
        title: doc.title,
        ...(doc.headline ? { headline: doc.headline } : {}),
        ...(doc.summary ? { summary: doc.summary } : {}),
        ...(doc.description ? { description: doc.description } : {}),
        ...(doc.cta ? { cta: doc.cta } : {}),
        readTime: doc.readTime,
        ...(doc.summary ? {
            metaTitle: `${doc.headline || doc.title} | UR`,
            metaDescription: doc.description || doc.summary,
        } : {}),
    };
}

const documents = [deck, letter, convictionAnnouncement, tokenholderLetter, capacityLetter, apexAnnouncement, ...materials]
    .filter((doc, index, all) => all.findIndex((other) => other.href === doc.href) === index);

export default {
    categories: Object.fromEntries(CATEGORIES.map((category) => [categoryKey(category), category])),
    kinds: {
        letter: 'Letter',
        announcement: 'Announcement',
        deck: 'Deck',
        link: 'Link',
    },
    docs: Object.fromEntries(documents.map((doc) => [documentKey(doc.href), registryCopy(doc)])),

    // the chrome of every document page
    investorCentre: 'Investor Centre',
    backToCentre: 'Back to Investor Centre',
    returnToCentre: 'Return to Investor Centre',
    downloadPdf: 'Download PDF',
    // on a translated page, where the PDF is the English document as published
    downloadPdfEnglish: 'Download PDF (English)',
    dated: 'Dated {date}',
    letterhead: {
        foundation: 'UR FOUNDATION',
        subnet: 'Bittensor Subnet 25 (netuid 25)',
        protocol: 'Protocol: github.com/urfoundation/sn',
        network: 'Network: ur.xyz',
        applications: 'Applications: ur.io',
    },
    disclaimerAria: 'Investment disclaimer',
    disclosure: 'This material is provided for informational purposes only and does not constitute an offer, solicitation or investment advice.',

    // Shown on a translated page only, above the document: the English is
    // authoritative, and <english> links it.
    translation: {
        document: 'This is a translation. The <english>English original</english> is the authoritative version, and the PDF is the document as published in English.',
        deck: 'This is a translation of the deck’s text. The slides, the PDF and the <english>English original</english> are in English, and the English is the authoritative version.',
        centre: 'This page is a translation. The <english>English Investor Centre</english> and the English originals of its documents are the authoritative versions.',
    },
};
