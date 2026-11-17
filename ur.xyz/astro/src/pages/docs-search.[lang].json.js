// /docs-search.<lang>.json: the docs search index of a translated docs page
// (islands/DocsSearchIsland.jsx), as /docs-search.json is the English pages'.
// The listed documents' translations, each leading to its page in that
// language, so a reader searches in the language they read. Built in every
// language once the docs page group is localized.
import { localizedStaticPaths } from '../lib/route-localization.js';
import { listedDocsIn } from '@react/lib/docs-i18n.js';
import { buildSearchIndex } from '@react/lib/docs-search.js';

export function getStaticPaths() {
    return localizedStaticPaths('docs');
}

export function GET({ params }) {
    const index = buildSearchIndex(listedDocsIn(params.lang), (d) => d.href);
    return new Response(JSON.stringify(index), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}
