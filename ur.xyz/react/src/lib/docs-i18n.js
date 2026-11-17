/**
 * The docs corpus in the site's other languages: each published document
 * translated at react/src/i18n/pages/docs/corpus/<lang>/<its path under
 * docs/>, held block for block to its English by corpus.mjs (beside it), and
 * published at /<lang>/docs/<slug> (the legal documents at /<lang>/terms,
 * /<lang>/privacy and /<lang>/vdp) once the docs page group is localized.
 *
 * Read at build time: the static pages render from it on the server, so no
 * page ships the corpus to the browser; the SPA (vite dev, which visual parity
 * compares the static pages with) bundles it. The markdown twins and the llms
 * files stay English (scripts/generate-agent-assets*.mjs read docs/ only).
 *
 * A translated document is the English entry of lib/docs.js with its prose
 * replaced: the title, front matter, content and search text are the
 * translation's, the slug, path and published date the English document's,
 * and its headings take the English headings' ids (markdown-blocks.js
 * headingIdsOf), so a link to /docs/miner/run#back-up-your-miner lands in
 * every language.
 */
import { docs as englishDocs, docGroups, docsIndex, listedDocs } from './docs.js';
import { DOC_PAGE_PATHS, docPath, splitFrontMatter } from './docs-shared.js';
import { extractTitle, markdownToText } from './markdown.jsx';
import { headingIdsOf } from './markdown-blocks.js';
import { loadPageCopy } from '../i18n/page-copy.js';
import { hasLocalizedVersion } from '../../../astro/src/lib/route-localization.js';

const copy = await loadPageCopy('docs');

const RAW = import.meta.glob('../i18n/pages/docs/corpus/*/**/*.md', { query: '?raw', import: 'default', eager: true });

const ENGLISH_BY_PATH = new Map(englishDocs.map((d) => [d.path, d]));

/** The legal documents' names in the sidebar and search: 'legal/terms' → the copy's legal.titles.terms. */
const legalKey = (slug) => (DOC_PAGE_PATHS[slug] ? slug.slice(slug.lastIndexOf('/') + 1) : null);

/**
 * A link a document writes, for a reader in `lang`: a site path whose page is
 * translated (lib/route-localization.js) gets the language's prefix, anything
 * else (another site's URL, an English-only page, a file such as
 * /operators.yml, an #anchor) stays as written.
 */
export function localizedHref(href, lang) {
    if (!lang || lang === 'en' || typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
    const [, path, rest] = href.match(/^([^?#]*)(.*)$/s);
    if (!hasLocalizedVersion(path || '/')) return href;
    return `${path === '/' || path === '' ? `/${lang}` : `/${lang}${path}`}${rest}`;
}

const BY_LANG = new Map();
for (const [file, source] of Object.entries(RAW)) {
    const m = file.match(/\/corpus\/([a-z]{2})\/(.+\.md)$/);
    if (!m) continue;
    const [, lang, rel] = m;
    const english = ENGLISH_BY_PATH.get(rel);
    // a translation of no published document (one since removed) is not served
    if (!english) continue;
    const { meta, body } = splitFrontMatter(source);
    const key = legalKey(english.slug);
    if (!BY_LANG.has(lang)) BY_LANG.set(lang, new Map());
    BY_LANG.get(lang).set(english.slug, {
        slug: english.slug,
        path: english.path,
        lang,
        href: localizedHref(docPath(english.slug), lang),
        title: key ? copy(lang).legal.titles[key] : extractTitle(body, english.title),
        // a document's first-published date is the English document's
        meta: { ...meta, ...(english.meta.published ? { published: english.meta.published } : {}) },
        content: body,
        text: markdownToText(body),
        headingIds: headingIdsOf(english.content),
        english,
    });
}

/** `slug`'s translation into `lang`, or null when there is none. */
export function translatedDoc(slug, lang) {
    return BY_LANG.get(lang)?.get(slug) || null;
}

/**
 * `slug` as a reader in `lang` gets it: the English entry for English, the
 * translation otherwise. Once the docs pages are built in every language (the
 * docs page group is localized), a published document without a translation
 * is an error here, not an English page under a translated chrome: corpus.mjs
 * names what to translate. Until then the English entry stands in.
 */
export function docIn(slug, lang) {
    const english = englishDocs.find((d) => d.slug === slug) || null;
    if (!lang || lang === 'en' || !english) return english;
    const doc = translatedDoc(slug, lang);
    if (doc) return doc;
    if (hasLocalizedVersion('/docs')) {
        throw new Error(`docs: no ${lang} translation of ${english.path} (react/src/i18n/pages/docs/corpus/${lang}/${english.path}; node react/src/i18n/pages/docs/corpus.mjs --check ${lang})`);
    }
    return english;
}

const inLang = (list, lang) => (lang === 'en' ? list : list.map((d) => docIn(d.slug, lang)));

/** The listed documents in `lang`, in the sidebar's order (lib/docs.js listedDocs). */
export const listedDocsIn = (lang) => inLang(listedDocs, lang);

/** The landing's documents in `lang` (lib/docs.js docsIndex). */
export const docsIndexIn = (lang) => inLang(docsIndex, lang);

/** The sidebar's groups in `lang`: lib/docs.js docGroups, named in the docs copy. */
export function docGroupsIn(lang) {
    const names = copy(lang).nav.groups;
    return docGroups.map((group) => ({ ...group, label: names[group.id] ?? group.label, docs: inLang(group.docs, lang) }));
}

/** The URL a document is published at for a reader in `lang`. */
export const docHrefIn = (slug, lang) => localizedHref(docPath(slug), lang);

/** The docs copy (react/src/i18n/pages/docs/en.js and its translations) in `lang`. */
export const docsCopy = (lang) => copy(lang);
