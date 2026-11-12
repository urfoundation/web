import React from 'react';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { formatNumber, interpolate, plural } from '../../../i18n/format.js';

/**
 * The research report's words in the page's language (i18n/pages/research-report/):
 * the page unit, which holds the page's own words and everything the islands
 * show, loaded once here so every island shares it. In the browser a static
 * page loads English and its own language only.
 */
export const pageCopy = await loadPageCopy('research-report');

/**
 * A template split at its placeholders into React children, the same children
 * that JSX interpolation gives ("connect {sha}" → "connect ", sha), so a value
 * may be an element (a link, a <time>).
 */
export function parts(template, values) {
    const out = [];
    const re = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
    let last = 0;
    let m;
    while ((m = re.exec(template))) {
        if (m.index > last) out.push(template.slice(last, m.index));
        out.push(Object.prototype.hasOwnProperty.call(values, m[1]) ? values[m[1]] : m[0]);
        last = re.lastIndex;
    }
    if (last < template.length) out.push(template.slice(last));
    return out.map((part, i) => (React.isValidElement(part) ? <React.Fragment key={i}>{part}</React.Fragment> : part));
}

/** A plural node's form for `n` ({ one, other } …), with {count} and any other values filled. */
export function counted(lang, forms, n, values = {}) {
    return interpolate(plural(lang, n, forms), { ...values, count: formatNumber(n, lang) });
}

/** The same as React children, so {count} stays its own text node, as JSX writes "{n} entries". */
export function countedParts(lang, forms, n, values = {}) {
    return parts(plural(lang, n, forms), { ...values, count: formatNumber(n, lang) });
}
