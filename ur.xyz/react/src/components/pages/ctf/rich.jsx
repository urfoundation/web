import React, { Fragment, cloneElement } from 'react';

/**
 * A copy string with {placeholders} and <tags> (react/src/i18n/pages/ctf/en.js)
 * as React children: each run of text, each value and each tagged part is a
 * child of its own, in order, so a sentence renders as the JSX it replaced did
 * (the same text nodes, the same elements). `values` fill the placeholders
 * (a string, a number, an element or children; null or false for none);
 * `tags` turn a tag's children into its element:
 *
 *   rich(t.fine.published, { first: 8 }, { api: (kids) => <a href={API_STATE}>{kids}</a> })
 *
 * A placeholder with no value stays as written and a tag with no element
 * keeps only its words, so a slip shows on the page and the tests and gates
 * catch it.
 */
const TOKEN = /\{([A-Za-z][A-Za-z0-9_]*)\}|<(\/?)([a-z][a-z0-9]*)>/g;

export function rich(template, values = {}, tags = {}) {
    const root = { tag: null, kids: [] };
    const stack = [root];
    let at = 0;
    let key = 0;
    const push = (node) => stack[stack.length - 1].kids.push(node);
    for (const m of String(template).matchAll(TOKEN)) {
        if (m.index > at) push(template.slice(at, m.index));
        at = m.index + m[0].length;
        if (m[1] !== undefined) {
            if (!Object.prototype.hasOwnProperty.call(values, m[1])) push(m[0]);
            else {
                const v = values[m[1]];
                if (v === null || v === undefined || v === false || v === '') continue;
                if (typeof v === 'string' || typeof v === 'number') push(String(v));
                else push(<Fragment key={`v${key++}`}>{v}</Fragment>);
            }
        } else if (m[2]) {
            if (stack.length === 1 || stack[stack.length - 1].tag !== m[3]) {
                push(m[0]);
                continue;
            }
            const frame = stack.pop();
            const make = tags[frame.tag];
            push(make ? cloneElement(make(frame.kids), { key: `t${key++}` }) : <Fragment key={`t${key++}`}>{frame.kids}</Fragment>);
        } else {
            stack.push({ tag: m[3], kids: [] });
        }
    }
    if (at < String(template).length) push(String(template).slice(at));
    // a tag left open keeps its words
    while (stack.length > 1) {
        const frame = stack.pop();
        push(<Fragment key={`t${key++}`}>{frame.kids}</Fragment>);
    }
    return root.kids;
}

/** Bold, the tag most sentences use. */
export const BOLD = { b: (kids) => <b>{kids}</b> };
