// The reserve page group: /reserve, the Network Capacity Reserve.
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
export default {
    paths: ['/reserve'],
    localized: true,
    // momentum, the defined share, stays a Latin term in Russian, Chinese and Spanish (the glossary): the
    // term on its own and in the reserve's formula, miner emissions × (1 − momentum)
    allowEnglish: ['momentum', '× (1 − momentum )'],
};
