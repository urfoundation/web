/**
 * Which capture the flag country pages (ur.xyz/ctf/<cc>) search engines may
 * index (sn design/ctf/SEO.md §2.1, the owner's decision of 2026-11-11). Google
 * treats pages that differ only by a place's name as doorways or scaled
 * content, which can sink the whole site. So a country page whose own content
 * reads like another country page's but for the country's name, and which has
 * no local note (data/ctf-local-notes.js), is noindex: before launch, the
 * countries the network's dashboard never counted, the territories without
 * people and a few countries it counted alike. Every other page is indexable.
 * A noindex page is still built, linked from the hub and served, and the rule
 * is decided afresh from each epoch's snapshot, so a page becomes indexable as
 * soon as its data or a local note sets it apart.
 *
 * A page's own content is what it says of its own country: the visible text of
 * its <main>, without the parts about other countries (marked
 * data-ctf-elsewhere: its neighbours in A–Z and its other big pots), without
 * the days the page states (when it last changed, which the build writes only
 * after this is decided, and when its note was reviewed), and with the
 * country's names and code masked. The build decides with it
 * (astro/src/pages/ctf/[cc].astro renders every country page for it), and the
 * seo-audit checks the built pages with it, so both read a page the same way.
 * Pure, with no React: tests/ctf.test.mjs runs it on pages of its own.
 */
import { CTF_LOCAL_NOTES } from '../../../data/ctf-local-notes.js';

const MASK = '\u0000';
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    return ENTITIES[name.toLowerCase()] ?? entity;
});

/** The HTML without each element marked data-ctf-elsewhere, with all it holds. */
function withoutElsewhere(html) {
    const marked = /<([a-z][a-z0-9-]*)\b[^>]*\sdata-ctf-elsewhere\b[^>]*>/gi;
    let out = '';
    let from = 0;
    let open = marked.exec(html);
    while (open) {
        // the element ends at its own closing tag, past any element of its kind inside it
        const tags = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, 'gi');
        tags.lastIndex = open.index + open[0].length;
        let depth = 1;
        while (depth > 0) {
            const tag = tags.exec(html);
            if (!tag) break;
            depth += tag[1] ? -1 : 1;
        }
        out += `${html.slice(from, open.index)} `;
        from = depth > 0 ? html.length : tags.lastIndex;
        marked.lastIndex = from;
        open = marked.exec(html);
    }
    return out + html.slice(from);
}

/**
 * The visible text of HTML: a tag reads as a space; a comment (React's marker
 * between text it rendered apart), a script, a style or a template as nothing.
 */
function textOf(html) {
    return decode(
        html
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
            .replace(/<[^>]+>/g, ' '),
    ).replace(/\s+/g, ' ').trim();
}

/**
 * The forms of a country's identity a page can print, longest first: its names
 * (the model's name, sentence name, capitalized and short), its ISO code as a
 * word in capitals, and its code in the paths of its page and its JSON.
 */
function identity(c) {
    const names = [...new Set([c.name, c.the, c.The, c.short])].sort((a, b) => b.length - a.length);
    return [...names, new RegExp(`\\b${c.code.toUpperCase()}\\b`, 'g'), new RegExp(`/(?:ctf|country)/${c.code}\\b`, 'g')];
}

/**
 * What a country page says of its own country (see above), from the HTML of
 * its <main>; `c` is its country in the pages' model (ctf/model.js).
 */
export function ownContent(mainHtml, c) {
    let text = textOf(withoutElsewhere(mainHtml).replace(/<time\b[^>]*>[\s\S]*?<\/time>/gi, ' '));
    for (const form of identity(c)) text = typeof form === 'string' ? text.split(form).join(MASK) : text.replace(form, MASK);
    return text;
}

/** Pages (code → own content) grouped by their own content, in the order given; a page alone is a group of one. */
export function contentGroups(contents) {
    const byText = new Map();
    for (const [code, text] of contents) {
        if (!byText.has(text)) byText.set(text, []);
        byText.get(text).push(code);
    }
    return [...byText.values()];
}

/** The rule, for a page of a group: noindex when it reads like another page and has no local note. */
const ruledNoindex = (group, code, notes) => group.length > 1 && !notes[code];

/**
 * The build's decision for every country page, in the model's order: code →
 * { noindex, alike } (alike: the other pages it reads like). `render(code)` is
 * the HTML of the page's <main> as the build renders it.
 */
export function countryIndexing(m, render, notes = CTF_LOCAL_NOTES) {
    const decided = new Map();
    for (const group of contentGroups(new Map(m.countries.map((c) => [c.code, ownContent(render(c.code), c)])))) {
        for (const code of group) decided.set(code, { noindex: ruledNoindex(group, code, notes), alike: group.filter((other) => other !== code) });
    }
    return new Map(m.countries.map((c) => [c.code, decided.get(c.code)]));
}

// The data a country page states (CtfCountry.jsx and ctf/model.js): its dashboard counts, its territory flag,
// and after a root its roles' winners, units and pots, its near misses, awards and epochs without a winner.
const stated = (c) => JSON.stringify([
    c.inhabited, c.online, c.seenDays, c.lastSeen, c.peak, c.openEpochs, c.near, c.awarded,
    ...[c.p, c.x].map((r) => [r.won, r.units, r.pot]),
]);

const at = (code) => `/ctf/${code}`;
const some = (codes) => (codes.length > 3 ? `${codes.slice(0, 3).map(at).join(', ')} and ${codes.length - 3} more` : codes.map(at).join(', '));

/**
 * The seo-audit's check of the built country pages, each { code, main, noindex }
 * (`main` the HTML of its <main>): every page follows the rule, so no two
 * indexable pages differ by the country's name alone; and pages that read
 * alike are countries whose data, as the pages state it, is the same
 * (otherwise a page has left out its own figures). Returns the problems and the
 * groups of pages that read alike, as lists of codes.
 */
export function countryIndexingProblems(m, pages, notes = CTF_LOCAL_NOTES) {
    const problems = [];
    const built = new Map();
    for (const p of pages) {
        if (m.byCode.has(p.code)) built.set(p.code, p);
        else problems.push(`${at(p.code)}: no such country in the snapshot`);
    }
    const groups = contentGroups(new Map([...built.values()].map((p) => [p.code, ownContent(p.main, m.byCode.get(p.code))])));
    for (const group of groups) {
        for (const code of group) {
            const ruled = ruledNoindex(group, code, notes);
            if (ruled && !built.get(code).noindex) {
                problems.push(`${at(code)}: reads like ${some(group.filter((other) => other !== code))} but for the country's name and has no local note, so it must be noindex`);
            } else if (!ruled && built.get(code).noindex) {
                problems.push(`${at(code)}: noindex, though ${notes[code] ? 'it has a local note' : 'it reads like no other country page'}`);
            }
        }
        if (group.length < 2) continue;
        const indexable = group.filter((code) => !built.get(code).noindex);
        if (indexable.length > 1) problems.push(`${some(indexable)}: indexable, though they differ by the country's name alone`);
        if (new Set(group.map((code) => stated(m.byCode.get(code)))).size > 1) {
            problems.push(`${some(group)}: read the same but for the country's name, though their data differs (a page leaves out its own figures)`);
        }
    }
    return { problems, groups: groups.filter((group) => group.length > 1) };
}
