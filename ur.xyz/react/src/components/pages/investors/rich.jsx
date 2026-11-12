import React from 'react';

/**
 * A copy string's inline markup as React children. The investors copy
 * (react/src/i18n/pages/investors/) keeps a sentence whole in every language,
 * so the words a link or an emphasis wraps can move with the grammar:
 *
 *   'I suggest you run our <research>core technologies</research> through an agent.'
 *   rich(t.text, { research: (words) => <a href="/research">{words}</a> })
 *
 * - <name>…</name> is an element the caller names in `elements`, or one of
 *   DEFAULTS (strong, em, u, b, code, kbd); <br/> is a line break;
 * - {name} is a value from `values`: a string, a number or an element.
 *
 * Adjacent text joins into one string, and a string with no markup comes back
 * as itself, so the copy renders the same text nodes the JSX it replaced did
 * (React's server render marks the boundary between two text nodes, which
 * would change the page). A tag or value the copy names but the caller does
 * not supply throws: a translation that lost or renamed one fails the build and
 * investors.test.mjs, never the page.
 */
const DEFAULTS = {
    strong: (children) => <strong>{children}</strong>,
    em: (children) => <em>{children}</em>,
    u: (children) => <u>{children}</u>,
    b: (children) => <b>{children}</b>,
    code: (children) => <code>{children}</code>,
    kbd: (children) => <kbd>{children}</kbd>,
    br: () => <br />,
};

const TOKEN = /<([a-z][a-z0-9]*)\/>|<([a-z][a-z0-9]*)>|<\/([a-z][a-z0-9]*)>|\{([A-Za-z][A-Za-z0-9]*)\}/g;

function asChildren(list) {
    if (list.length === 0) return undefined;
    if (list.length === 1) return list[0];
    return list.map((child, i) => (typeof child === 'string' ? child : React.cloneElement(child, { key: i })));
}

export function rich(text, elements = {}, values = {}) {
    if (typeof text !== 'string') throw new TypeError(`rich: expected a string, got ${typeof text}`);
    const stack = [{ name: null, children: [] }];
    const add = (child) => {
        const { children } = stack[stack.length - 1];
        if (typeof child === 'string') {
            if (!child) return;
            if (typeof children[children.length - 1] === 'string') children[children.length - 1] += child;
            else children.push(child);
        } else {
            children.push(child);
        }
    };
    const make = (name, children) => {
        const element = elements[name] || DEFAULTS[name];
        if (!element) throw new Error(`rich: no element for <${name}> in "${text}"`);
        return element(asChildren(children));
    };

    let at = 0;
    for (const match of text.matchAll(TOKEN)) {
        add(text.slice(at, match.index));
        at = match.index + match[0].length;
        const [, empty, open, close, value] = match;
        if (empty) {
            add(make(empty, []));
        } else if (open) {
            stack.push({ name: open, children: [] });
        } else if (close) {
            const node = stack.pop();
            if (node.name !== close) throw new Error(`rich: </${close}> closes <${node.name}> in "${text}"`);
            add(make(close, node.children));
        } else {
            if (!Object.prototype.hasOwnProperty.call(values, value)) throw new Error(`rich: no value for {${value}} in "${text}"`);
            const filled = values[value];
            add(typeof filled === 'number' ? String(filled) : filled);
        }
    }
    add(text.slice(at));
    if (stack.length !== 1) throw new Error(`rich: <${stack[stack.length - 1].name}> is not closed in "${text}"`);
    return asChildren(stack[0].children);
}
