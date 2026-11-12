# ur.xyz translations

The site speaks English (at the bare path) and Russian, Arabic, Chinese, German and Spanish (at `/<lang>/...`):
`SITE_LANG_CODES` in `astro/src/lib/route-localization.js`. Two kinds of page are translated:

- **The home page and the sections** (`/`, `/operators`, `/miners`, `/validators`, `/research`), from the site
  dictionaries in this directory: `en.js` and its mirrors `ru.js ar.js zh.js de.js es.js`, with their record
  `source-hashes.json`. The nav, the footer, the disclaimer and the launch video read them too.
- **Every other page, by page group.** Each page family is a group, a directory under `pages/` whose `group.js`
  names its pages and says whether they are translated yet:

  | group | pages |
  | --- | --- |
  | `about` | `/about` |
  | `build` | `/build` |
  | `ctf` | `/ctf`, `/ctf/<cc>` |
  | `dashboard` | `/dashboard` |
  | `docs` | `/docs`, `/docs/<doc>`, `/docs/miner/<chapter>`, `/docs/support/<doc>`, `/terms`, `/privacy`, `/vdp` |
  | `investors` | `/investors`, `/investors/<doc>` |
  | `mainnet` | `/mainnet` |
  | `not-found` | the 404 page |
  | `price` | `/price` |
  | `research-methodology` | `/research/methodology` |
  | `research-report` | `/research/2026-q3-report` |
  | `reserve` | `/reserve` |

  ```js
  // pages/ctf/group.js
  export default {
      paths: ['/ctf', '/ctf/*'],   // '/x/*': every page one segment below /x
      localized: false,            // true once every language is complete and current and built
      // allowEnglish: ['…'],      // sentences left in English on purpose (tests/localized-english-text.mjs)
      // samples: ['/ctf/ke'],     // the pages the browser tests visit in Arabic and German (default: the first path)
  };
  ```

  Until a group is localized its pages are English-only: no `/<lang>/` page is built, nginx answers `/<lang>/<page>`
  with a 301 to the English page that no browser keeps (`Cache-Control: no-store`: the translation may come with the
  next build), and nothing links or clusters a translation. A `/<lang>/` URL that is no page in either language is a
  404 with that language's not-found page.

## Copy units

A copy unit is a directory under `pages/<group>/`, the group's own or any below it (`pages/investors/letter/`), that
holds:

- `en.js`: `export default { … }`, the page's English: strings in plain objects and arrays (numbers and booleans may
  sit among them; they are not translated). It is the one source of the page's English: the component reads it, so
  English renders as before. A data-driven page may derive it from its data (`import report from …;
  export default { entries: report.entries.map((e) => ({ headline: e.headline })) }`); figures stay in the data.
- `ru.js ar.js zh.js de.js es.js`: the same keys, translated. Same nesting, same array lengths, same numbers.
- `source-hashes.json`: the record the staleness tool writes (never edit it by hand).

Placeholders are `{name}`, kept verbatim in every translation and filled with `interpolate`. A **plural node** is an
object whose keys are all CLDR categories and include `other` (`{ one: '{count} slot', other: '{count} slots' }`);
each language carries the forms it needs (Russian `one/few/many/other`, Arabic `zero/one/two/few/many/other`,
Chinese `other`), and `plural(lang, count, forms)` picks one.

## Reading copy

```js
import { loadPageCopy } from '../../i18n/page-copy.js';
import { formatNumber, interpolate } from '../../i18n/format.js';

const copy = await loadPageCopy('about');          // once, at the module's top level

export default function AboutPage({ lang = 'en' }) {
    const t = copy(lang);                           // synchronous from then on
    return <h1>{t.title}</h1>;
}
```

- `copy(lang)` is the unit in that language, English filling any key it lacks (a safety net: the staleness check
  keeps a localized group complete). The Astro build and node load every language; a static page in the browser
  loads English and its own language (`<html lang>`), each unit language a chunk of its own, so an island carries
  one translation; the SPA (`react/index.html`, marked `data-ur-spa`) loads all six.
- Every page component takes `lang`: the Astro pages pass it to the page and to each island, and the SPA's
  `App.jsx` passes the language it shows. An island never reads the browser's language.
- `format.js`: `formatNumber`, `formatPercent`, `formatDate` (UTC unless given a `timeZone`), `formatList`,
  `plural`/`pluralCategory`, `interpolate`, `displayRegion` (a country's name; ICU differs between node and browsers,
  so compute names at build time and pass them to islands). Arabic keeps Western digits (`intlLocale`).

## Staleness

`node tests/i18n-staleness.mjs` (from `react/`, part of `make gates`) fails when a translation lacks a key of its
English or has one it lacks, when its English changed after it was translated, when it has no recorded source, when
it changes a number of its English, or when a unit of a localized group lacks one of its five translations. A unit
of a group not yet localized may lack translations, but every translation it has is checked. After translating, or
after checking a translation against its current English, record it:

```sh
node tests/i18n-staleness.mjs --accept de nav.ctf                      # the site dictionaries
node tests/i18n-staleness.mjs --unit about --accept de                 # every key of a unit's de.js
node tests/i18n-staleness.mjs --unit investors/letter --accept all     # all five languages of a unit
node tests/i18n-staleness.mjs --unit ctf --accept ru hub.title         # one key
node tests/i18n-staleness.mjs --unit about                             # check one unit
```

An English change in a localized group fails the gates until each language is updated and recorded: a stale
translation never ships.

## Translating a group

1. Move the page's English into `pages/<group>/en.js` (or units below it) and read it with `loadPageCopy`. The
   English pages must stay byte-identical.
2. Write the five translations and record them (`--unit <unit> --accept all`). Titles at most 60 graphemes and
   descriptions at most 175 characters, each unique in its language (the seo-audit).
3. Add the translated pages under `astro/src/pages/[lang]/`, mirroring the English page's path, with
   `getStaticPaths() { return localizedStaticPaths('<group>', <the English route's paths>) }`. Share the body with
   the English page (a component of the group's own, taking `lang`) rather than copying it. Pass `lang` to `Base`;
   it sets `dir` (right to left for Arabic), hreflang and the breadcrumbs. Never build a redirect stub at a
   `/<lang>/` path: nginx serves a built `/<lang>/` page as a page.
4. Set `localized: true` in `group.js`. That turns on, for the group's pages: their `/<lang>/` routes (the static
   paths above and the SPA router), hreflang (`en ru ar zh de es` and `x-default`, English) in each head, the
   sitemap's alternates, `og:locale:alternate`, the switchers keeping the page, the stored-language redirect, the nav
   and footer links in every language (labels in the site dictionaries: `nav.about`, `nav.build`,
   `nav.investors`, `nav.dashboard`, `nav.liveDashboard`, `nav.ctf`, `footer.buildOnUr`, `footer.reserve`,
   `footer.mainnet`, `footer.investorCentre`), the browser tests' Arabic and German samples
   (`tests/localized-samples.mjs`), and the seo-audit's requirement that every English page of the group is built in
   every language, in its language and direction, and indexed alike.
5. Build (`make build-main` from `astro/`), check `/ar/...` right to left at desktop and phone width, and commit the
   pages with `astro/page-dates/<group>.json`, which the build writes.

A page and its translations are indexed alike: noindex in one language means noindex in every one, so each
hreflang cluster is whole (capture the flag decides each country once, from the English page). Right to left: use
logical CSS (`margin-inline-start`, `padding-inline`, `inset-inline-*`, `text-align: start`) and `[dir="rtl"]` for the
rest (arrows that point, charts' axes).

## The gates

`make gates` (from `astro/`, after a build) runs, among the rest: `tests/i18n-staleness.mjs`,
`tests/localized-english-text.mjs` (English prose or an untranslated label on a translated page, against the site
dictionaries and the page's group's units; `allowEnglish` in `group.js` for deliberate English; code marked
`translate="no"` is the same in every language and is not compared, and only `code`, `pre`, `kbd` and `samp` may
carry that mark), the seo-audit
(hreflang targets indexable and in their language, sitemap alternates equal to the head's, every localized group
complete, `dir` per language), `page-dates.mjs --check`, `tests/page-copy.test.mjs`,
`scripts/route-localization.test.mjs`, and every `pages/<group>/*.test.mjs`, which a group adds without editing the
Makefile.

## Good to know

- **Files named `build`.** The repository ignores every directory named `build` and every file named `build.*`.
  `.gitignore` re-includes `pages/build/`, `astro/page-dates/build.json` and `astro/src/pages/[lang]/build.astro`;
  name anything else so it does not match (`build-on-ur.test.mjs`), or add it there.
- **page-dates.** Each group's pages, in every language, are recorded in `astro/page-dates/<group>.json`; every other
  page in `astro/page-dates.json`. On a merge conflict in one of them, take `origin/main`'s version, rebuild and
  commit what the build writes.
- **A new group:** a directory under `pages/` with its `group.js`, an import in `PAGE_GROUPS`
  (`astro/src/lib/route-localization.js`), and its page roots in nginx's localized-page rule
  (`web/web/nginx/nginx.conf.j2`).
- **Retired paths.** A redirect from a retired URL belongs in nginx, to the successor in the URL's language
  (`/de/community` → `/de/about`; `/<lang>/docs/whitepaper` and `/<lang>/investors/august-investment-letter` follow
  their successor into the language when it is built).
- **Links in a page's copy.** A link to another page of the site goes to it in the page's language once it has
  translations: pass the href through `groupPageHref(href, lang) || href` (`astro/src/lib/route-localization.js`;
  its `?query` and `#fragment` stay). A link that leaves the translation by the reader's choice, such as the English
  original a translated document links, says so with `data-lang-choice="en"`: every page records the choice, as the
  language switchers do (`LANG_CHOICE_SCRIPT` in Base.astro), so the stored language does not send the reader back.
- **The stored-language redirect.** A visitor who chose a language (`ur.xyz.lang`) and opens a translated page's
  English URL is sent to the translation by a script in its head (`storedLanguageRedirectScript`). Only a page with
  translations carries it, never the not-found page, and it never makes the same redirect twice within ten seconds,
  which ends a loop it cannot see (a 301 to English a browser kept from an older config). `tests/redirect-loops.mjs`,
  in `make gates`, runs the site's nginx server block over the build and drives Chromium through every page family
  with each language stored, the language switcher on a missing page and a profile with the old config's 301s
  cached; it needs nginx.
