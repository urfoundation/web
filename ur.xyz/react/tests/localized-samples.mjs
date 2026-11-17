// The translated pages the browser tests visit besides their own lists: one
// page of each localized page group (react/src/i18n/pages/<group>/group.js),
// its `samples` when it names some, else its first page. Arabic, read right to
// left, is the hardest test of a layout; German, with the longest words, of a
// narrow one. A group joins the tests by being localized: nobody edits the
// tests' own route lists for it.
import { LOCALIZED_GROUPS, PAGE_GROUPS } from '../../astro/src/lib/route-localization.js';

export function localizedSamples(langs = ['ar']) {
    const out = [];
    for (const id of LOCALIZED_GROUPS) {
        if (id === 'not-found') continue; // a 404 is no page to visit
        const group = PAGE_GROUPS[id];
        const pages = group.samples?.length ? group.samples : group.paths.filter((p) => !p.endsWith('/*')).slice(0, 1);
        for (const lang of langs) for (const page of pages) out.push(`/${lang}${page}`);
    }
    return out;
}
