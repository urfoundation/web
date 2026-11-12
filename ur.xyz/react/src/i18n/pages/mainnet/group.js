// The mainnet page group: /mainnet, the SN25 mainnet launch timeline, in English
// and at /ru/mainnet, /ar/mainnet, /zh/mainnet, /de/mainnet and /es/mainnet.
// Its copy units are this directory (the page's own words), data/ (from
// react/src/data/mainnet.js: the notices, the box at the top, the epochs) and
// timeline/ (from react/src/data/mainnet-timeline.json: the milestones); see
// react/src/i18n/README.md. It is localized, so a notice or milestone added in
// English fails tests/i18n-staleness.mjs until all five languages have it.
export default {
    paths: ['/mainnet'],
    localized: true,
};
