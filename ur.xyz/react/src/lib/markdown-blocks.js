/**
 * The block structure of a docs markdown source, as lib/markdown.jsx renders
 * it: headings, paragraphs, rules, quotes, fenced code, flat lists and pipe
 * tables. Pure code with no imports, so the renderer, the build and node
 * scripts read a document the same way: the translated docs
 * (react/src/i18n/pages/docs/corpus.mjs) are held to the English one block for
 * block, and a translated page takes its heading ids from the English
 * headings at the same places (headingIdsOf).
 */

export const HEADING_RE = /^(#{1,6})\s+(.*)$/;
export const HR_RE      = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;
export const ULIST_RE   = /^(\s*)[-*+]\s+(.*)$/;
export const OLIST_RE   = /^(\s*)\d+\.\s+(.*)$/;
export const FENCE_RE   = /^```\s*([a-zA-Z0-9_+-]*)\s*$/;
export const QUOTE_RE   = /^>\s?(.*)$/;
export const TABLE_SEP  = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/;

export function parseBlocks(src) {
    // Strip carriage returns and yaml front-matter, if any. None of the
    // shipped docs use front-matter today but it is cheap to be tolerant.
    let text = src.replace(/\r\n?/g, '\n');
    if (text.startsWith('---\n')) {
        const end = text.indexOf('\n---', 4);
        if (end !== -1) text = text.slice(end + 4).replace(/^\n+/, '');
    }

    const lines = text.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { i++; continue; }

        // Fenced code block
        const fence = line.match(FENCE_RE);
        if (fence) {
            const lang = fence[1] || '';
            const buf = [];
            i++;
            while (i < lines.length && !FENCE_RE.test(lines[i])) {
                buf.push(lines[i]);
                i++;
            }
            if (i < lines.length) i++; // consume closing fence
            blocks.push({ type: 'code', lang, content: buf.join('\n') });
            continue;
        }

        // Heading
        const h = line.match(HEADING_RE);
        if (h) {
            blocks.push({ type: 'heading', level: h[1].length, text: h[2].trim() });
            i++;
            continue;
        }

        // Horizontal rule
        if (HR_RE.test(line)) {
            blocks.push({ type: 'hr' });
            i++;
            continue;
        }

        // Blockquote
        if (QUOTE_RE.test(line)) {
            const buf = [];
            while (i < lines.length && QUOTE_RE.test(lines[i])) {
                buf.push(lines[i].match(QUOTE_RE)[1]);
                i++;
            }
            blocks.push({ type: 'quote', content: buf.join('\n') });
            continue;
        }

        // Pipe table — needs a separator row directly under the header
        if (line.includes('|') && lines[i + 1] && TABLE_SEP.test(lines[i + 1])) {
            const rows = [splitRow(line)];
            i += 2; // skip header + separator
            while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
                rows.push(splitRow(lines[i]));
                i++;
            }
            blocks.push({ type: 'table', rows });
            continue;
        }

        // Lists (we don't track nesting beyond a flat list — adequate for
        // these docs and keeps the parser simple).
        if (ULIST_RE.test(line)) {
            const items = [];
            while (i < lines.length && ULIST_RE.test(lines[i])) {
                items.push(lines[i].match(ULIST_RE)[2]);
                i++;
                // Allow simple paragraph continuations on the next indented line.
                while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
                    items[items.length - 1] += ' ' + lines[i].trim();
                    i++;
                }
            }
            blocks.push({ type: 'ulist', items });
            continue;
        }
        if (OLIST_RE.test(line)) {
            const items = [];
            while (i < lines.length && OLIST_RE.test(lines[i])) {
                items.push(lines[i].match(OLIST_RE)[2]);
                i++;
                while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
                    items[items.length - 1] += ' ' + lines[i].trim();
                    i++;
                }
            }
            blocks.push({ type: 'olist', items });
            continue;
        }

        // Paragraph: collect until a blank line or another block start.
        const para = [];
        while (i < lines.length && lines[i].trim() && !startsBlock(lines[i], lines[i + 1])) {
            para.push(lines[i]);
            i++;
        }
        if (para.length) blocks.push({ type: 'paragraph', text: para.join(' ') });
    }

    return blocks;
}

/**
 * True when `line` is the first line of a new block (so a paragraph
 * collector should stop here). The `next` line is needed to detect
 * tables, which require a separator row right after the header.
 */
function startsBlock(line, next) {
    if (!line) return false;
    if (HEADING_RE.test(line)) return true;
    if (HR_RE.test(line)) return true;
    if (FENCE_RE.test(line)) return true;
    if (QUOTE_RE.test(line)) return true;
    if (ULIST_RE.test(line)) return true;
    if (OLIST_RE.test(line)) return true;
    if (line.includes('|') && next && TABLE_SEP.test(next)) return true;
    return false;
}

function splitRow(line) {
    // Strip leading/trailing pipes, then split. Cells keep their
    // surrounding whitespace trimmed because that is how readers expect
    // pipe tables to render.
    return line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map(c => c.trim());
}

/** A heading's id, from its text: what a link to it (#…) names. */
export function slugify(s) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * The ids of a document's headings, in the order the renderer meets them: a
 * translated page passes its English document's (Markdown `headingIds`), so
 * each heading keeps the id the English links and every language's links name.
 */
export function headingIdsOf(src) {
    return parseBlocks(String(src || '')).filter(b => b.type === 'heading').map(b => slugify(b.text));
}
