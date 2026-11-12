// The ctf page group: /ctf, capture the flag, and its 249 country pages /ctf/<cc>.
// Its copy units are this directory and any directory under it holding an en.js
// (react/src/i18n/README.md). Set `localized` to true once every unit is complete
// and current in every language and the /<lang>/ pages are built: that turns on
// the group's translated routes, hreflang, sitemap alternates and switcher links.
export default {
    paths: ['/ctf', '/ctf/*'],
    localized: false,
};
