// The capture the flag country pages' static paths, with each page's indexing
// (react/src/components/pages/ctf/indexing.js, sn design/ctf/SEO.md §2.1): a
// page that reads like another country page but for the country's name is
// noindex until its data or a local note sets it apart. It is decided once per
// build from every page rendered as the decision reads it (its country's names
// and code a placeholder, its note too), in every language the group is built
// in; every language must noindex the same countries, or the build stops. The
// decision applies to the English pages (pages/ctf/[cc].astro) and their
// translations (pages/[lang]/ctf/[cc].astro) alike, so a cluster is whole. The
// seo-audit decides again with the same function and component, and holds the
// built pages to it.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CtfCountryPage from '@react/components/pages/CtfCountry.jsx';
import { CTF } from '@react/components/pages/ctf/data.js';
import { countryIndexing } from '@react/components/pages/ctf/indexing.js';
import { PAGE_GROUPS, SITE_LANG_CODES } from '../../lib/route-localization.js';
import { LASTMOD_TOKEN } from '../../lib/lastmod.js';

let decided = null;

/** The languages the country pages are built in. */
export const ctfLangs = () => (PAGE_GROUPS.ctf.localized ? [...SITE_LANG_CODES] : ['en']);

/** [{ params: { cc }, props: { noindex } }] for the snapshot's 249 countries, in its order. */
export function ctfCountryPaths() {
    if (!decided) {
        // each page's <main> as the route renders it: without the slots,
        // CtfCountryPage renders the same islands itself, as their first render
        const decision = countryIndexing(
            CTF,
            ({ code, lang, model }) => renderToStaticMarkup(createElement(CtfCountryPage, { code, lang, model, updated: LASTMOD_TOKEN })),
            ctfLangs(),
        );
        if (decision.disagreements.length) {
            throw new Error(`capture the flag: the languages noindex different country pages: ${decision.disagreements.join('; ')}`);
        }
        decided = decision.decided;
    }
    return CTF.countries.map((c) => ({ params: { cc: c.code }, props: { noindex: decided.get(c.code).noindex } }));
}
