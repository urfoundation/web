/**
 * Where the capture the flag pages link, in the page's language: a site page
 * in that language when it has translations (the hub, a country page, the
 * miner guide), otherwise its English page. The same in the build and in the
 * islands, since the translated routes are the committed page groups'
 * (astro/src/lib/route-localization.js).
 */
import { groupPageHref, hasLocalizedVersion } from '../../../../../astro/src/lib/route-localization.js';
import { EXTENDER_URL, START_URL } from './model.js';

/** A site path in `lang`: /ctf/ke → /ru/ctf/ke where the page is translated. */
export const pagePath = (lang, path) => (lang && lang !== 'en' && hasLocalizedVersion(path) ? `/${lang}${path === '/' ? '' : path}` : path);

/**
 * A call to action's link, in the page's language as the site's own links are
 * (groupPageHref): the miner guide for 'start' and 'p' (Start mining, Run a
 * provider; it names the URnetwork apps as the easy alternative), its chapter
 * on running an extender for 'x'.
 */
export const ctaLink = (lang, cta) => {
    const path = cta === 'x' ? EXTENDER_URL : START_URL;
    return groupPageHref(path, lang) || path;
};
