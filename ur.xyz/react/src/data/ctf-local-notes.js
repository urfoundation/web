/**
 * Capture the flag's local notes (sn design/ctf/SEO.md §2.1): for a country,
 * how to claim and cash out there and what local law says, written by a person
 * and dated with the day they reviewed it. A note shows under "How do I get
 * paid?" on its country's page (/ctf/<cc>); tests/ctf.test.mjs checks each.
 * A page that reads like another country page but for the name is noindex
 * until its data or its note sets it apart (components/pages/ctf/indexing.js):
 * a note sets it apart by what it says, never by the country's name in it, so
 * a note that says what another country's says, name aside, does not. Write the
 * country's own circumstances. None is written yet: SEO.md lists
 * the demand markets to write first (India, Indonesia, Nigeria, the
 * Philippines, Pakistan, Vietnam, Bangladesh, Nepal, Kenya, Ghana, Egypt,
 * Brazil, Mexico, Turkey, then the US, the UK, Canada and Germany).
 *
 * `text` is the English; the same note in a site language goes under that
 * language's code (ru, ar, zh, de, es), and a page in a language without its
 * own shows the English. A note decides the page's indexing in every language.
 *
 *   ke: { reviewed: '2026-12-01', text: 'One paragraph, plain words, no fiat projections.', es: 'Un párrafo…' },
 */
export const CTF_LOCAL_NOTES = Object.freeze({});
