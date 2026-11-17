// The ctf page group: /ctf, capture the flag, and its 249 country pages /ctf/<cc>.
// Its copy units are this directory (the pages' words) and names/ (the
// countries' names in each language, scripts/ctf-names.mjs); see
// react/src/i18n/README.md. Localized: the /<lang>/ pages are built in Russian,
// Arabic, Chinese, German and Spanish, each indexed as its English page is.
export default {
    paths: ['/ctf', '/ctf/*'],
    localized: true,
    // the browser tests' localized pages: the hub and a country page
    samples: ['/ctf', '/ctf/ke'],
    // German left as German writes it: CLDR's name for the island, and the word for online
    allowEnglish: ['Isle of Man', 'online'],
};
