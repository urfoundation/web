// Routes with real, translated static pages. Keep this a positive list: an
// English-only page added under src/pages must not silently advertise unserved
// /<lang>/... variants in its head or sitemap.
//
// Two kinds of page have translations:
//   • the home page and the sections ('/', '/operators', '/miners',
//     '/validators', '/research'), translated in the site dictionaries
//     (react/src/i18n/<lang>.js);
//   • the page groups (react/src/i18n/pages/<group>/group.js), each the pages of
//     one family (/about; /ctf and its country pages /ctf/<cc>; /investors and
//     its documents; the docs and the legal pages; …) with copy of its own,
//     once its group.js says `localized: true` (react/src/i18n/README.md).
// Every other page is English-only until its group is localized, and exists at
// its bare path alone. Its /<lang>/... URLs redirect to the English page (nginx
// serves a /<lang>/ page when the build has it and redirects otherwise), and
// the SPA router maps them the same way.
//
// This module is plain data + functions; its only imports are the groups'
// plain-data manifests. It is read by the Astro config and layout at build
// time, by the React i18n layer in the browser, and by node tests.
import about from '../../../react/src/i18n/pages/about/group.js';
import build from '../../../react/src/i18n/pages/build/group.js';
import ctf from '../../../react/src/i18n/pages/ctf/group.js';
import dashboard from '../../../react/src/i18n/pages/dashboard/group.js';
import docs from '../../../react/src/i18n/pages/docs/group.js';
import investors from '../../../react/src/i18n/pages/investors/group.js';
import mainnet from '../../../react/src/i18n/pages/mainnet/group.js';
import notFound from '../../../react/src/i18n/pages/not-found/group.js';
import price from '../../../react/src/i18n/pages/price/group.js';
import researchMethodology from '../../../react/src/i18n/pages/research-methodology/group.js';
import researchReport from '../../../react/src/i18n/pages/research-report/group.js';
import reserve from '../../../react/src/i18n/pages/reserve/group.js';

export const SITE_LANG_CODES = Object.freeze(['en', 'ru', 'ar', 'zh', 'de', 'es']);
export const NON_EN_SITE_LANG_CODES = Object.freeze(SITE_LANG_CODES.filter(code => code !== 'en'));

/** The home page and the sections, translated in the site dictionaries. */
export const SECTION_BASE_PATHS = Object.freeze(['/', '/operators', '/miners', '/validators', '/research']);

/**
 * The page groups by id (the directory name under react/src/i18n/pages/): each
 * { paths, localized, allowEnglish? }. A path ending in /* stands for every page
 * exactly one segment below it (/ctf/* is /ctf/ke, …). A new group gets its
 * directory, its group.js and a line here (react/src/i18n/README.md).
 */
export const PAGE_GROUPS = Object.freeze({
    about,
    build,
    ctf,
    dashboard,
    docs,
    investors,
    mainnet,
    'not-found': notFound,
    price,
    'research-methodology': researchMethodology,
    'research-report': researchReport,
    reserve,
});

// The not-found page is built per language once its group is localized, but it
// is no page of its own: nothing switches to it, clusters with it or redirects
// to it (a language link on it leads to that language's home).
export const NOT_FOUND_PATH = '/404';

// The visitor's explicit language choice, written by the language switcher.
export const LANG_STORAGE_KEY = 'ur.xyz.lang';

// The stored-language redirect's last target and when it went there
// (sessionStorage, "<target> <ms>"), and how long a repeat of it counts as a
// loop: the redirect makes the same one again only after this long.
export const LANG_REDIRECT_GUARD_KEY = 'ur.xyz.lang.redirect';
export const LANG_REDIRECT_GUARD_MS = 10000;

// Following a link marked data-lang-choice="<lang>" (a translation's link to
// its English original) is an explicit choice of that language, as the
// language switcher is: this inline script, on every page (Base.astro),
// records it, or the stored-language redirect would send the visitor straight
// back to the translation.
export const LANG_CHOICE_SCRIPT = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang-choice]');if(!a)return;try{localStorage.setItem(${JSON.stringify(LANG_STORAGE_KEY)},a.getAttribute('data-lang-choice'))}catch(_){}});`;

const LANG_PREFIX = new RegExp(`^/(${NON_EN_SITE_LANG_CODES.join('|')})(?=/|$)`);

const exactPaths = (group) => group.paths.filter(p => !p.endsWith('/*'));
const pathPrefixes = (group) => group.paths.filter(p => p.endsWith('/*')).map(p => p.slice(0, -1));
// one segment below the prefix, no deeper: /ctf/ke, not /ctf or /ctf/flags/ke.svg
const underPrefix = (base, prefix) => base.length > prefix.length && base.startsWith(prefix) && !base.slice(prefix.length).includes('/');
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export function publicPathFor(pathname) {
    const path = String(pathname || '/')
        .split('#', 1)[0]
        .split('?', 1)[0]
        .replace(/\/index\.html$/, '/')
        .replace(/\.html$/, '')
        .replace(/\/$/, '');
    return path || '/';
}

export function langForPath(pathname) {
    return publicPathFor(pathname).match(LANG_PREFIX)?.[1] || 'en';
}

export function basePathFor(pathname) {
    return publicPathFor(pathname).replace(LANG_PREFIX, '') || '/';
}

/**
 * The routing of a set of page groups. The module's own exports below are this
 * for PAGE_GROUPS; tests build it for groups of their own (a localized group
 * with a family of pages, …).
 */
export function createRouteLocalization(groups) {
    /** The ids of the groups whose pages are built in every language. */
    const LOCALIZED_GROUPS = Object.freeze(Object.keys(groups).filter(id => groups[id].localized === true));
    /** Every exact path with translated pages: the sections, then the localized groups' pages. */
    const LOCALIZED_BASE_PATHS = Object.freeze([
        ...SECTION_BASE_PATHS,
        ...LOCALIZED_GROUPS.flatMap(id => exactPaths(groups[id])).filter(p => p !== NOT_FOUND_PATH),
    ]);
    /** Families with translated pages, as the prefix of their pages: '/ctf/' covers /ctf/<cc>. */
    const LOCALIZED_PATH_PREFIXES = Object.freeze(LOCALIZED_GROUPS.flatMap(id => pathPrefixes(groups[id])));
    const LOCALIZED = new Set(LOCALIZED_BASE_PATHS);

    /** The id of the page group a page belongs to (in any language), or null. */
    function groupForPath(pathname) {
        const base = basePathFor(pathname);
        for (const [id, group] of Object.entries(groups)) {
            if (exactPaths(group).includes(base) || pathPrefixes(group).some(prefix => underPrefix(base, prefix))) return id;
        }
        return null;
    }

    function hasLocalizedVersion(pathname) {
        const base = basePathFor(pathname);
        return LOCALIZED.has(base) || LOCALIZED_PATH_PREFIXES.some(prefix => underPrefix(base, prefix));
    }

    /**
     * The URL of `pathname`'s page in `lang` when the page has a translation,
     * otherwise `lang`'s home page. English lives at the bare path.
     */
    function localizedPathFor(pathname, lang) {
        const base = hasLocalizedVersion(pathname) ? basePathFor(pathname) : '/';
        if (!NON_EN_SITE_LANG_CODES.includes(lang)) return base;
        return base === '/' ? `/${lang}` : `/${lang}${base}`;
    }

    /**
     * Where the nav and the footer link a page of a page group in `lang`: the
     * page itself in English, its translation once its group is localized, and
     * nowhere (null: no link) while it is English-only. A page's own links use
     * it too, as `groupPageHref(href, lang) || href`, so a translated page
     * links the translations; the href's ?query and #fragment stay, and an
     * href that is no path on this site (another site's, #fragment) is null.
     */
    function groupPageHref(path, lang) {
        if (!NON_EN_SITE_LANG_CODES.includes(lang)) return path;
        if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || !hasLocalizedVersion(path)) return null;
        const rest = path.search(/[?#]/);
        return localizedPathFor(path, lang) + (rest < 0 ? '' : path.slice(rest));
    }

    /**
     * The page's hreflang cluster, [{ hreflang, path }]: every site language and
     * x-default (English), or none when the page has no translations.
     */
    function alternatesFor(pathname) {
        if (!hasLocalizedVersion(pathname)) return [];
        const base = basePathFor(pathname);
        return [
            ...SITE_LANG_CODES.map(lang => ({ hreflang: lang, path: localizedPathFor(base, lang) })),
            { hreflang: 'x-default', path: base },
        ];
    }

    /**
     * getStaticPaths for a group's translated pages (astro/src/pages/[lang]/…):
     * each of `paths` (the English route's own static paths, { params, props })
     * in every language but English while the group is localized, and none
     * until then, so a group's half-done translations are never built.
     */
    function localizedStaticPaths(groupId, paths = [{ params: {} }]) {
        const group = groups[groupId];
        if (!group) throw new Error(`localizedStaticPaths: no page group "${groupId}" (react/src/i18n/pages/<group>/group.js)`);
        if (group.localized !== true) return [];
        return NON_EN_SITE_LANG_CODES.flatMap(lang => paths.map(p => ({ ...p, params: { ...p.params, lang } })));
    }

    /**
     * Where a visitor who explicitly chose `stored` belongs when they land on
     * `pathname`, or null to stay. Only a bare (English) URL of a page that has
     * translations moves: a /<lang>/ URL names its language and wins, a page
     * without translations stays English, and English itself never redirects.
     * The target always carries a language prefix, so it can never redirect
     * again.
     */
    function storedLanguageTarget(pathname, stored) {
        if (!NON_EN_SITE_LANG_CODES.includes(stored)) return null;
        const path = publicPathFor(pathname);
        if (langForPath(path) !== 'en' || !hasLocalizedVersion(path)) return null;
        return localizedPathFor(path, stored);
    }

    /**
     * storedLanguageTarget as a self-contained inline <head> script for the
     * static pages: it has to run before the first paint, so it cannot wait for
     * a module. The route data is embedded; a storage failure (private mode,
     * blocked cookies) leaves the page alone.
     *
     * A page carries it only when it has translations (Base.astro), never the
     * not-found page: nginx serves that at every missing URL, and a missing
     * /docs/<x> reads like a docs page to the family rule here.
     *
     * It never makes the same redirect twice within LANG_REDIRECT_GUARD_MS:
     * it records its target and the time in sessionStorage, and stays on the
     * page when the visitor is back from that target so soon. That ends a loop
     * it cannot see from the page, such as a 301 from /<lang>/<page> to the
     * English page that a browser cached under an older server config, after
     * one round trip, on the English page.
     */
    function storedLanguageRedirectScript() {
        const langs = JSON.stringify(NON_EN_SITE_LANG_CODES);
        const paths = JSON.stringify(LOCALIZED_BASE_PATHS);
        // a localized family's pages, one segment under its prefix (/ctf/ke)
        const family = LOCALIZED_PATH_PREFIXES.length
            ? `&&!/^(?:${LOCALIZED_PATH_PREFIXES.map(escapeRegExp).join('|')})[^\\/]+$/.test(p)`
            : '';
        const guard = JSON.stringify(LANG_REDIRECT_GUARD_KEY);
        return [
            '(function(){try{',
            `var l=localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)});`,
            `if(${langs}.indexOf(l)<0)return;`,
            "var p=location.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'').replace(/\\/$/,'')||'/';",
            `if(${paths}.indexOf(p)<0${family})return;`,
            // the same redirect again this soon is a loop: stay
            `var t='/'+l+(p==='/'?'':p),n=Date.now(),g=(sessionStorage.getItem(${guard})||'').split(' ');`,
            `if(g[0]===t&&n-g[1]>=0&&n-g[1]<${LANG_REDIRECT_GUARD_MS})return;`,
            `sessionStorage.setItem(${guard},t+' '+n);`,
            'location.replace(t+location.search+location.hash);',
            '}catch(e){}})();',
        ].join('');
    }

    return {
        LOCALIZED_GROUPS,
        LOCALIZED_BASE_PATHS,
        LOCALIZED_PATH_PREFIXES,
        groupForPath,
        hasLocalizedVersion,
        localizedPathFor,
        groupPageHref,
        alternatesFor,
        localizedStaticPaths,
        storedLanguageTarget,
        storedLanguageRedirectScript,
    };
}

const site = createRouteLocalization(PAGE_GROUPS);

export const {
    LOCALIZED_GROUPS,
    LOCALIZED_BASE_PATHS,
    LOCALIZED_PATH_PREFIXES,
    groupForPath,
    hasLocalizedVersion,
    localizedPathFor,
    groupPageHref,
    alternatesFor,
    localizedStaticPaths,
    storedLanguageTarget,
    storedLanguageRedirectScript,
} = site;
