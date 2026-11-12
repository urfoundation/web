import assert from 'node:assert/strict';
import test from 'node:test';

import {
    LANG_REDIRECT_GUARD_KEY,
    LANG_REDIRECT_GUARD_MS,
    LOCALIZED_BASE_PATHS,
    PAGE_GROUPS,
    basePathFor,
    createRouteLocalization,
    groupForPath,
    hasLocalizedVersion,
    langForPath,
    localizedPathFor,
    publicPathFor,
    storedLanguageRedirectScript,
    storedLanguageTarget,
} from '../src/lib/route-localization.js';

const TRANSLATED = ['/', '/operators', '/miners', '/validators', '/research'];
// The page groups' pages (react/src/i18n/pages/<group>/group.js), English-only
// until their group is localized: the legal documents and the docs, the about
// / build / investor / reserve / mainnet / capture the flag pages, and the
// research reports under the translated research page; and pages of no group.
const GROUP_PAGES = [
    '/terms', '/privacy', '/vdp',
    '/about', '/build', '/reserve', '/mainnet', '/ctf', '/ctf/ke', '/docs', '/docs/litepaper', '/investors', '/investors/deck', '/investors/letter-to-tokenholders-september-2026',
    '/research/2026-q3-report', '/research/methodology',
];
const ENGLISH_ONLY = [
    ...GROUP_PAGES.filter((path) => !PAGE_GROUPS[groupForPath(path)]?.localized),
    '/audits/report.pdf', '/future-page',
];
// The page groups as they are with none of them localized. The fixtures that
// name particular groups build on it, so they hold whichever groups the page
// agents have localized since.
const UNLOCALIZED = Object.fromEntries(
    Object.entries(PAGE_GROUPS).map(([id, group]) => [id, { ...group, localized: false }]),
);
const unlocalized = createRouteLocalization(UNLOCALIZED);

test('localized metadata is emitted only for routes with translated pages', () => {
    assert.deepEqual(
        [...LOCALIZED_BASE_PATHS].slice(0, TRANSLATED.length),
        TRANSLATED,
    );
    for (const path of TRANSLATED) {
        assert.equal(hasLocalizedVersion(path), true, path);
        assert.equal(hasLocalizedVersion(`/de${path === '/' ? '' : path}`), true, `/de${path}`);
    }

    for (const path of ENGLISH_ONLY) {
        assert.equal(hasLocalizedVersion(path), false, path);
        assert.equal(hasLocalizedVersion(`/es${path}`), false, `/es${path}`);
    }
});

test('route metadata normalizes build paths and locale prefixes', () => {
    assert.equal(publicPathFor('/de/research.html?preview=1#top'), '/de/research');
    assert.equal(publicPathFor('/index.html'), '/');
    assert.equal(langForPath('/ar/miners.html'), 'ar');
    assert.equal(langForPath('/about'), 'en');
    assert.equal(basePathFor('/zh/operators.html'), '/operators');
    assert.equal(basePathFor('/es'), '/');
});

test('a language switch keeps the page when it is translated, else lands on that language home', () => {
    assert.equal(localizedPathFor('/miners', 'de'), '/de/miners');
    assert.equal(localizedPathFor('/de/miners', 'en'), '/miners');
    assert.equal(localizedPathFor('/de/miners.html', 'ar'), '/ar/miners');
    assert.equal(localizedPathFor('/', 'zh'), '/zh');
    assert.equal(localizedPathFor('/ru', 'en'), '/');
    assert.equal(unlocalized.localizedPathFor('/terms', 'de'), '/de');
    assert.equal(unlocalized.localizedPathFor('/docs/litepaper', 'es'), '/es');
    assert.equal(unlocalized.localizedPathFor('/about', 'en'), '/');
    // and a page of no group, which no group's state can translate
    assert.equal(localizedPathFor('/future-page', 'de'), '/de');
    assert.equal(localizedPathFor('/de/future-page', 'en'), '/');
    assert.equal(localizedPathFor('/miners', 'xx'), '/miners');
});

test('a stored language choice moves only bare URLs of translated pages', () => {
    assert.equal(storedLanguageTarget('/miners', 'de'), '/de/miners');
    assert.equal(storedLanguageTarget('/', 'ar'), '/ar');
    assert.equal(storedLanguageTarget('/index.html', 'zh'), '/zh');
    // English never redirects; nor does an unknown or missing choice
    assert.equal(storedLanguageTarget('/miners', 'en'), null);
    assert.equal(storedLanguageTarget('/miners', null), null);
    assert.equal(storedLanguageTarget('/miners', 'xx'), null);
    // a /<lang>/ URL names its language and wins
    assert.equal(storedLanguageTarget('/de/miners', 'es'), null);
    assert.equal(storedLanguageTarget('/de', 'es'), null);
    // pages without a translation stay put
    for (const path of ENGLISH_ONLY) assert.equal(storedLanguageTarget(path, 'de'), null, path);
    // no loop: every target is itself a URL the rule leaves alone
    for (const path of TRANSLATED) {
        const target = storedLanguageTarget(path, 'ru');
        assert.equal(storedLanguageTarget(target, 'ru'), null, target);
    }
});

// A browser tab's sessionStorage.
function memoryStorage() {
    const items = new Map();
    return { getItem: (key) => (items.has(key) ? items.get(key) : null), setItem: (key, value) => { items.set(key, String(value)); } };
}

// Runs an inline redirect script as a page's <head> would, with the stored
// choice `stored`, the tab's sessionStorage `session`, the clock at `now`, the
// page's referrer and the count of redirects that brought it. Returns the URL
// it sends the page to, or null when the page stays.
function runRedirect(script, pathname, stored, { search = '', hash = '', throws = false, session = memoryStorage(), now = 1_000_000, referrer = '', redirectCount = 0 } = {}) {
    let replaced = null;
    const localStorage = { getItem: () => { if (throws) throw new Error('blocked'); return stored; } };
    const location = { origin: 'https://ur.xyz', pathname, search, hash, replace: (url) => { replaced = url; } };
    const performance = { getEntriesByType: (type) => (type === 'navigation' ? [{ redirectCount }] : []) };
    new Function('localStorage', 'sessionStorage', 'location', 'Date', 'document', 'performance', script)(
        localStorage, session, location, { now: () => now }, { referrer }, performance);
    return replaced;
}

test('the inline redirect script agrees with storedLanguageTarget', () => {
    const script = storedLanguageRedirectScript();
    const run = (pathname, stored, options) => runRedirect(script, pathname, stored, options);
    for (const lang of [null, 'en', 'de', 'ar', 'xx']) {
        for (const path of [...TRANSLATED, ...ENGLISH_ONLY, '/de/miners', '/zh', '/index.html', '/miners.html', '/miners/']) {
            assert.equal(run(path, lang), storedLanguageTarget(path, lang), `${lang} ${path}`);
        }
    }
    assert.equal(run('/research', 'es', { search: '?q=1', hash: '#papers' }), '/es/research?q=1#papers');
    assert.equal(run('/research', 'es', { throws: true }), null);
});

test('the inline redirect script tries a redirect that comes back once more past the cache, then stays', () => {
    const script = storedLanguageRedirectScript();
    const session = memoryStorage();
    const at = 5_000_000;
    assert.equal(runRedirect(script, '/miners', 'de', { session, now: at }), '/de/miners');
    assert.equal(session.getItem(LANG_REDIRECT_GUARD_KEY), `/de/miners ${at}`);
    // back from /de/miners at once (a 301 to the English page that the browser
    // cached under an older server config): once more, at an address the
    // cache holds no 301 for
    assert.equal(runRedirect(script, '/miners', 'de', { session, now: at + 40, redirectCount: 1 }), '/de/miners?');
    assert.equal(session.getItem(LANG_REDIRECT_GUARD_KEY), `/de/miners ${at + 40} 1`);
    // back again: a loop, so the page stays, until the guard time is over
    assert.equal(runRedirect(script, '/miners', 'de', { session, now: at + 80, redirectCount: 1 }), null);
    assert.equal(runRedirect(script, '/miners', 'de', { session, now: at + 40 + LANG_REDIRECT_GUARD_MS - 1 }), null);
    assert.equal(runRedirect(script, '/miners', 'de', { session, now: at + 40 + LANG_REDIRECT_GUARD_MS }), '/de/miners');
    // the retry keeps the query and the fragment
    const other = memoryStorage();
    assert.equal(runRedirect(script, '/research', 'es', { session: other, now: at, search: '?q=1', hash: '#papers' }), '/es/research?q=1#papers');
    assert.equal(runRedirect(script, '/research', 'es', { session: other, now: at + 1, search: '?q=1', hash: '#papers' }), '/es/research?q=1&#papers');
    assert.equal(runRedirect(script, '/', 'ar', { session: other, now: at + 2 }), '/ar');
    assert.equal(runRedirect(script, '/', 'ar', { session: other, now: at + 3, hash: '#roles' }), '/ar?#roles');
    // another target, or another language, is a redirect of its own
    assert.equal(runRedirect(script, '/operators', 'de', { session, now: at + 100 }), '/de/operators');
    assert.equal(runRedirect(script, '/operators', 'es', { session, now: at + 200 }), '/es/operators');
    // a record from the future (the clock went back) does not count
    assert.equal(runRedirect(script, '/operators', 'es', { session, now: at }), '/es/operators');
    // without a sessionStorage to keep the guard in, the page stays
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    assert.equal(runRedirect(script, '/miners', 'de', { session: blocked }), null);
});

test('the inline redirect script leaves the English original to a visitor who followed a link to it from the translation', () => {
    const script = storedLanguageRedirectScript();
    // the link on /de/terms to /terms, in this tab or another
    assert.equal(runRedirect(script, '/terms', 'de', { referrer: 'https://ur.xyz/de/terms' }), null);
    assert.equal(runRedirect(script, '/terms', 'de', { referrer: 'https://ur.xyz/de/terms?x=1#top' }), null);
    // from another page, another language or another site: the translation
    assert.equal(runRedirect(script, '/terms', 'de', { referrer: 'https://ur.xyz/de/privacy' }), '/de/terms');
    assert.equal(runRedirect(script, '/terms', 'es', { referrer: 'https://ur.xyz/de/terms' }), '/es/terms');
    assert.equal(runRedirect(script, '/terms', 'de', { referrer: 'https://example.com/de/terms' }), '/de/terms');
    // a redirect brought the visitor here (a 301 the browser kept sent the
    // translation's own link to English): the translation
    assert.equal(runRedirect(script, '/terms', 'de', { referrer: 'https://ur.xyz/de/terms', redirectCount: 1 }), '/de/terms');
});

test('every English page belongs to one page group, and each group names its pages', () => {
    const expected = {
        '/about': 'about', '/build': 'build', '/ctf': 'ctf', '/ctf/ke': 'ctf', '/dashboard': 'dashboard',
        '/docs': 'docs', '/docs/litepaper': 'docs', '/docs/miner/install': 'docs', '/docs/support/delete': 'docs',
        '/terms': 'docs', '/privacy': 'docs', '/vdp': 'docs',
        '/investors': 'investors', '/investors/deck': 'investors', '/mainnet': 'mainnet', '/price': 'price',
        '/reserve': 'reserve', '/research/2026-q3-report': 'research-report', '/research/methodology': 'research-methodology',
        '/404': 'not-found',
    };
    for (const [path, group] of Object.entries(expected)) {
        assert.equal(groupForPath(path), group, path);
        assert.equal(groupForPath(`/ar${path}`), group, `/ar${path}`);
    }
    // the home page, the sections and anything else belong to none
    for (const path of [...TRANSLATED, '/research/x/y', '/ctf/flags/ke.svg', '/docs/miner/a/b', '/audits/masa-l2-2025.pdf']) {
        assert.equal(groupForPath(path), null, path);
    }
    for (const [id, group] of Object.entries(PAGE_GROUPS)) {
        assert.ok(Array.isArray(group.paths) && group.paths.length, id);
        assert.equal(typeof group.localized, 'boolean', id);
    }
});

// A localized group, as a page agent's group.js turns it on: its pages, and a
// family of them one segment under a prefix, gain their /<lang>/ twins.
const localized = createRouteLocalization({
    ...UNLOCALIZED,
    about: { ...PAGE_GROUPS.about, localized: true },
    ctf: { ...PAGE_GROUPS.ctf, localized: true },
    'not-found': { ...PAGE_GROUPS['not-found'], localized: true },
});

test('a localized group translates its pages, its family and nothing else', () => {
    assert.deepEqual([...localized.LOCALIZED_BASE_PATHS], [...TRANSLATED, '/about', '/ctf']);
    assert.deepEqual([...localized.LOCALIZED_PATH_PREFIXES], ['/ctf/']);
    for (const path of ['/about', '/ctf', '/ctf/ke', '/de/ctf/ke', '/ar/about']) assert.equal(localized.hasLocalizedVersion(path), true, path);
    // one segment under the prefix only; the not-found page is no page to switch to
    for (const path of ['/ctf/flags/ke.svg', '/ctf/ke/x', '/build', '/404', '/de/404']) assert.equal(localized.hasLocalizedVersion(path), false, path);
    assert.equal(localized.localizedPathFor('/ctf/ke', 'ar'), '/ar/ctf/ke');
    assert.equal(localized.localizedPathFor('/de/ctf/ke', 'en'), '/ctf/ke');
    assert.equal(localized.localizedPathFor('/build', 'de'), '/de');
    assert.equal(localized.localizedPathFor('/404', 'de'), '/de');
    assert.equal(localized.groupPageHref('/about', 'zh'), '/zh/about');
    assert.equal(localized.groupPageHref('/build', 'zh'), null);
    assert.equal(localized.groupPageHref('/build', 'en'), '/build');
    // a page's own links: the query and fragment stay; another site's link,
    // a fragment alone and an English-only page are left to the caller (null)
    assert.equal(localized.groupPageHref('/ctf/ke#pot', 'de'), '/de/ctf/ke#pot');
    assert.equal(localized.groupPageHref('/about?ref=home#team', 'ar'), '/ar/about?ref=home#team');
    assert.equal(localized.groupPageHref('/operators#apps', 'es'), '/es/operators#apps');
    assert.equal(localized.groupPageHref('/#roles', 'ru'), '/ru#roles');
    for (const href of ['/build#brief-x', '#epoch-4', '//ur.xyz/about', 'https://github.com/urfoundation', '']) {
        assert.equal(localized.groupPageHref(href, 'de'), null, href);
    }
    assert.equal(localized.groupPageHref('/ctf/ke#pot', 'en'), '/ctf/ke#pot');
    assert.deepEqual(localized.alternatesFor('/es/ctf/ke').map((a) => `${a.hreflang} ${a.path}`), [
        'en /ctf/ke', 'ru /ru/ctf/ke', 'ar /ar/ctf/ke', 'zh /zh/ctf/ke', 'de /de/ctf/ke', 'es /es/ctf/ke', 'x-default /ctf/ke',
    ]);
    assert.deepEqual(localized.alternatesFor('/build'), []);
});

test('a group builds its translated pages only once it is localized', () => {
    assert.deepEqual(localized.localizedStaticPaths('build'), []);
    assert.deepEqual(localized.localizedStaticPaths('about').map((p) => p.params.lang), ['ru', 'ar', 'zh', 'de', 'es']);
    const countries = [{ params: { cc: 'ke' }, props: { n: 1 } }, { params: { cc: 'li' } }];
    const paths = localized.localizedStaticPaths('ctf', countries);
    assert.equal(paths.length, 10);
    assert.deepEqual(paths[0], { params: { cc: 'ke', lang: 'ru' }, props: { n: 1 } });
    assert.throws(() => localized.localizedStaticPaths('nope'), /no page group/);
});

test('the inline redirect script follows a localized family too', () => {
    const script = localized.storedLanguageRedirectScript();
    const run = (pathname, stored) => runRedirect(script, pathname, stored);
    for (const lang of [null, 'en', 'de', 'ar', 'xx']) {
        for (const path of ['/', '/about', '/ctf', '/ctf/ke', '/ctf/ke.html', '/ctf/flags/ke.svg', '/ctf/', '/build', '/404', '/de/ctf/ke', '/miners']) {
            assert.equal(run(path, lang), localized.storedLanguageTarget(path, lang), `${lang} ${path}`);
        }
    }
    assert.equal(run('/ctf/ke', 'zh'), '/zh/ctf/ke');
    // with no localized family the script is the one the site has always had
    assert.ok(!unlocalized.storedLanguageRedirectScript().includes('.test(p)'));
});
