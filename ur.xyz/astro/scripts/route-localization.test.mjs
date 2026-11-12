import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
    assert.equal(localizedPathFor('/terms', 'de'), '/de');
    assert.equal(localizedPathFor('/docs/litepaper', 'es'), '/es');
    assert.equal(localizedPathFor('/about', 'en'), '/');
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

test('the inline redirect script agrees with storedLanguageTarget', () => {
    const script = storedLanguageRedirectScript();
    const run = (pathname, stored, { search = '', hash = '', throws = false } = {}) => {
        let replaced = null;
        const localStorage = { getItem: () => { if (throws) throw new Error('blocked'); return stored; } };
        const location = { pathname, search, hash, replace: (url) => { replaced = url; } };
        new Function('localStorage', 'location', script)(localStorage, location);
        return replaced;
    };
    for (const lang of [null, 'en', 'de', 'ar', 'xx']) {
        for (const path of [...TRANSLATED, ...ENGLISH_ONLY, '/de/miners', '/zh', '/index.html', '/miners.html', '/miners/']) {
            assert.equal(run(path, lang), storedLanguageTarget(path, lang), `${lang} ${path}`);
        }
    }
    assert.equal(run('/research', 'es', { search: '?q=1', hash: '#papers' }), '/es/research?q=1#papers');
    assert.equal(run('/research', 'es', { throws: true }), null);
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
// family of them one segment under a prefix, gain their /<lang>/ twins. The
// fixture turns every real group off first, whatever its group.js says now,
// so the groups the page agents localize do not change what it expects.
const localized = createRouteLocalization({
    ...Object.fromEntries(Object.entries(PAGE_GROUPS).map(([id, group]) => [id, { ...group, localized: false }])),
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
    const run = (pathname, stored) => {
        let replaced = null;
        const location = { pathname, search: '', hash: '', replace: (url) => { replaced = url; } };
        new Function('localStorage', 'location', script)({ getItem: () => stored }, location);
        return replaced;
    };
    for (const lang of [null, 'en', 'de', 'ar', 'xx']) {
        for (const path of ['/', '/about', '/ctf', '/ctf/ke', '/ctf/ke.html', '/ctf/flags/ke.svg', '/ctf/', '/build', '/404', '/de/ctf/ke', '/miners']) {
            assert.equal(run(path, lang), localized.storedLanguageTarget(path, lang), `${lang} ${path}`);
        }
    }
    assert.equal(run('/ctf/ke', 'zh'), '/zh/ctf/ke');
    // with no localized family the script is the one the site has always had
    assert.ok(!storedLanguageRedirectScript().includes('.test(p)'));
});
