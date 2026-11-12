// The research-report page group: the research reports under /research (/research/2026-q3-report).
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
export default {
    paths: ['/research/2026-q3-report'],
    localized: true,
    // left as the report writes them, in every language (tests/localized-english-text.mjs):
    // the code names that are glossary terms, the unit ms, and the figures with their units
    // that Chinese and Arabic write exactly as English does (their sentences are translated)
    allowEnglish: [
        'cwnd', 'goroutine', 'goroutines', 'synctest', 'ms',
        '1,575.2→248.1 ms',
        '181.5/439.2 ms',
        '206.2/545.7 ms',
        '2,552.3 → 543.7 ms',
        '2,552.3→543.7 ms',
        '2,552.3 ms',
        '355.3/127.7 ms',
        '375.5/450.0/98.21 ns',
        '387.0/600.6/573.9 ns',
        '3,967.8 → 745.0 ms',
        '3,967.8→745.0 ms',
        '3,967.8 ms',
        '457.6 ms',
        '478.3 ms',
        '49.33 → 23.88 ns',
        '545.7 ms',
        '6.426→12.629 ms',
    ],
};
