import { SITE_LANG_CODES } from '../../../astro/src/lib/route-localization.js';

/**
 * The locale to hand Intl for a page language — numbers and dates follow
 * the page, never the browser. Arabic keeps Western digits: its copy writes
 * figures that way (10–20%, 200, N≥2) and the block number and countdown sit
 * in the same lines.
 *
 * A module of its own, without the dictionaries (index.jsx loads them before
 * anything hydrates), so an island that takes its strings as props can format
 * figures in the page's language too: the research page's competition card.
 */
export function intlLocale(code) {
    return code === 'ar' ? 'ar-u-nu-latn' : (SITE_LANG_CODES.includes(code) ? code : 'en');
}
