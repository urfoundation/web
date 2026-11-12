// The docs page group: the docs corpus (/docs, every document /docs/<doc>, the
// miner guide's chapters /docs/miner/<chapter>, the support walkthroughs
// /docs/support/<doc>) and the legal pages it publishes outside /docs (/terms,
// /privacy, /vdp). Its copy units are this directory and any directory under it
// holding an en.js (react/src/i18n/README.md). Set `localized` to true once every
// unit is complete and current in every language and the /<lang>/ pages are
// built: that turns on the group's translated routes, hreflang, sitemap
// alternates and switcher links.
export default {
    paths: ['/docs', '/docs/*', '/docs/miner/*', '/docs/support/*', '/terms', '/privacy', '/vdp'],
    localized: false,
};
