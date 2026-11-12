// The dashboard page group: /dashboard, the live network and SN25 stats.
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
export default {
    paths: ['/dashboard'],
    localized: false,
    // the org filter's buttons: the GitHub organizations' names, the same in every language
    allowEnglish: ['urnetwork', 'urfoundation'],
};
