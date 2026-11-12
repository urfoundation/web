// The investors page group: /investors, the Investor Centre, and its documents /investors/<doc>.
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
//
// The documents are signed or dated communications: a translation says the
// English is authoritative and links it, and the PDFs stay the English documents
// as published. /investors/august-investment-letter is a redirect, not a page.
export default {
    paths: ['/investors', '/investors/*'],
    localized: true,
    allowEnglish: [
        // the alt text of the taostats logo in "Explore the network": the brand's name, written in lower case
        'taostats',
    ],
};
