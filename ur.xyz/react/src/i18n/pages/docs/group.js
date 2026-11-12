// The docs page group: the docs corpus (/docs, every document /docs/<doc>, the
// miner guide's chapters /docs/miner/<chapter>, the support walkthroughs
// /docs/support/<doc>) and the legal pages it publishes outside /docs (/terms,
// /privacy, /vdp). Its copy units are this directory and any directory under it
// holding an en.js (react/src/i18n/README.md). Set `localized` to true once every
// unit is complete and current in every language and the /<lang>/ pages are
// built: that turns on the group's translated routes, hreflang, sitemap
// alternates and switcher links.
//
// The documents' translations are block-aligned markdown under corpus/<lang>/
// (no en.js there, so they are not copy units), checked against the English by
// corpus.mjs and corpus.test.mjs.
export default {
    paths: ['/docs', '/docs/*', '/docs/miner/*', '/docs/support/*', '/terms', '/privacy', '/vdp'],
    localized: true,
    // Left in English on purpose on the translated pages: Bittensor's terms that
    // every language keeps in Latin script (the translators' glossary; Spanish keeps
    // pool and litepaper as well), names, the title of the English whitepaper a link
    // names, the two prompts the miner prints in English (each followed by its
    // translation), and a code block's language label. Units of measure (rao) need
    // no entry: tests/localized-english-text.mjs reads them as no prose.
    allowEnglish: [
        'hotkey', 'coldkey', 'alpha', 'metagraph', 'momentum', 'relayer', 'pool', 'litepaper',
        'Bittensor SN25 (netuid 25)', 'Bittensor SN25, netuid 25', 'whitepaper',
        "This device isn't signed in yet", 'This is the first start on this device',
        'powershell',
    ],
};
