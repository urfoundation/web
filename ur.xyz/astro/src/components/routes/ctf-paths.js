// The capture the flag country pages' static paths, with each page's indexing
// (react/src/components/pages/ctf/indexing.js, sn design/ctf/SEO.md §2.1): a
// page whose own content reads like another country page's but for the
// country's name, and which has no local note, is noindex until its data or a
// note sets it apart. The decision is the English page's, made once per build
// from every English page body as pages/ctf/[cc].astro renders it, and applies
// to its translations too (pages/[lang]/ctf/[cc].astro), so a page and its
// translations are indexed alike and a cluster is whole.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CtfCountryPage from '@react/components/pages/CtfCountry.jsx';
import { CTF } from '@react/components/pages/ctf/data.js';
import { countryIndexing } from '@react/components/pages/ctf/indexing.js';
import { LASTMOD_TOKEN } from '../../lib/lastmod.js';

let decided = null;

/** [{ params: { cc }, props: { noindex } }] for the snapshot's 249 countries, in its order. */
export function ctfCountryPaths() {
    // each page's <main> as the route renders it: without the slots,
    // CtfCountryPage renders the same islands itself, as their first render
    decided ??= countryIndexing(CTF, (code) => renderToStaticMarkup(createElement(CtfCountryPage, { code, updated: LASTMOD_TOKEN })));
    return CTF.countries.map((c) => ({ params: { cc: c.code }, props: { noindex: decided.get(c.code).noindex } }));
}
