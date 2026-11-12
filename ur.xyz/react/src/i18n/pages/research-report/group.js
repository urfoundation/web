// The research-report page group: the research reports under /research (/research/2026-q3-report).
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
export default {
    paths: ['/research/2026-q3-report'],
    localized: true,
    // left as the report writes them, in every language (tests/localized-english-text.mjs):
    // the code names that are glossary terms. Units of measure beside figures ("457.6 ms")
    // need no entry: the gate reads them as no prose.
    allowEnglish: ['cwnd', 'goroutine', 'goroutines', 'synctest'],
};
