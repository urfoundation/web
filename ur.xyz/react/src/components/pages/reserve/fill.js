import { createElement, Fragment } from 'react';

const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/**
 * A copy template whose placeholders are filled with children of their own:
 * the template's text runs and the values, in the template's order, as one
 * fragment. fill('{amount} α a day', { amount: '2,657' }) renders as the JSX
 * `{amount} α a day` did, two text nodes ("2,657", " α a day"), so the server
 * render keeps the shape it had before the page read its words from copy; a
 * value may also be an element (a link, a code span), which then sits where
 * the language puts its placeholder. interpolate() (i18n/format.js) is the
 * one-string form, for text that was one string. Placeholders that `values`
 * lacks stay as written, as interpolate leaves them.
 */
export function fill(template, values = {}) {
    const text = String(template);
    const children = [];
    let at = 0;
    for (const match of text.matchAll(PLACEHOLDER)) {
        if (!Object.prototype.hasOwnProperty.call(values, match[1])) continue;
        if (match.index > at) children.push(text.slice(at, match.index));
        children.push(values[match[1]]);
        at = match.index + match[0].length;
    }
    if (at < text.length) children.push(text.slice(at));
    // as arguments, not an array: the children need no keys
    return createElement(Fragment, null, ...children);
}
