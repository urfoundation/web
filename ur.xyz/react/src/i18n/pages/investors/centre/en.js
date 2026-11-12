// The Investor Centre page (/investors): components/pages/investors/
// InvestorCentre.jsx. The documents' cards and rows read the group's shared
// copy (../en.js); "About UR" and the metrics derive from the registry
// (react/src/data/investors.js), which stays their source.
import { investorCentre } from '../../../../data/investors.js';

export default {
    meta: {
        title: 'Investor Centre | UR',
        description: 'UR investor updates, materials, and public research: letters, the litepaper, and third-party audits, with live network dashboards.',
    },
    eyebrow: 'Investors',
    title: 'Investor Centre',
    updated: 'Updated {date}',
    aboutHeading: 'About UR',
    about: [...investorCentre.about],
    latestHeading: 'Latest from UR',
    latestNote: 'Curated overview',
    archiveHeading: 'All investor materials',
    archiveIntro: 'Browse announcements, letters, decks and reference materials.',
    filterAria: 'Filter investor materials',
    searchLabel: 'Search investor materials',
    searchPlaceholder: 'Search titles',
    kindLabel: 'Filter by type',
    allKinds: 'All types',
    // {count} is the number in bold; every form a site language needs
    count: {
        zero: '{count} items',
        one: '{count} item',
        two: '{count} items',
        few: '{count} items',
        many: '{count} items',
        other: '{count} items',
    },
    columns: {
        date: 'Date',
        title: 'Title',
        format: 'Format',
    },
    pdf: 'PDF',
    read: 'Read',
    notDated: 'Not dated',
    empty: 'No investor materials match those filters.',
    exploreAria: 'Network and research resources',
    exploreHeading: 'Explore the network',
    exploreText: 'Follow network performance on the UR Dashboard and view subnet market data through TaoMarketCap and taostats.',
    dashboard: 'UR Dashboard',
    networkLinksAria: 'Network data sources',
    researchHeading: 'Research UR',
    researchText: "Ask ChatGPT or Claude about UR's products, research, subnet development, published updates and public materials.",
    researchLinksAria: 'Research UR with AI',
    // behind SHOW_METRICS in InvestorCentre.jsx: a snapshot, not a feed
    metrics: {
        heading: 'Metrics',
        items: investorCentre.metrics.map(({ label, context, change }) => ({ label, context, change })),
    },
};
