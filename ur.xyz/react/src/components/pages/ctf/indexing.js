/**
 * Which capture the flag country pages (ur.xyz/ctf/<cc>, /<lang>/ctf/<cc>)
 * search engines may index (sn design/ctf/SEO.md §2.1, the owner's decision of
 * 2026-11-11). Google treats pages that differ only by a place's name as
 * doorways or scaled content, which can sink the whole site. So a country page
 * that reads like another country page but for the country's name is noindex:
 * before launch, the countries the network's dashboard never counted, the
 * territories without people and a few countries it counted alike. Every other
 * page is indexable. A noindex page is still built, linked from the hub and
 * served, and the rule is decided afresh from each epoch's snapshot, so a page
 * becomes indexable as soon as its data or a local note sets it apart.
 *
 * The decision reads each page as it would be with no name at all: the page
 * rendered from a model in which its own country's name forms (in a list, in a
 * sentence, short, "in <country>") are one fixed placeholder, its code one
 * fixed placeholder code, and its local note names it by the placeholder too
 * (placeholderModel). What that render says of its own country is the visible
 * text of its <main>, without the parts about other countries (marked
 * data-ctf-elsewhere: its neighbours in A–Z and its other big pots) and
 * without the days it states. Pages whose renders say the same differ by the
 * name alone. Nothing in the text is masked after the render, so a word of the
 * copy that happens to be a country's code or name (AI, IT, NO, Chad) reads
 * the same on every page; and a local note sets its page apart by what it
 * says, never by the name in it.
 *
 * Every language is decided from its own renders, and every language must
 * noindex the same countries (a translation that leaves out a figure would
 * otherwise read alike where the English does not): the build fails when they
 * differ. The build (astro/src/components/routes/ctf-paths.js) and the
 * seo-audit (astro/scripts/seo-audit.mjs, which renders through Vite) both
 * decide with countryIndexing and the same component, so they read a page the
 * same way; the audit then holds the built pages to the decision and compares
 * the figures of pages that read alike as the pages print them
 * (countryIndexingProblems). Pure, with no React: the caller renders, and
 * tests/ctf.test.mjs runs it on renders of its own.
 */
import { capital, ctfNames, formats } from './i18n.js';
import { localModel } from './model.js';

/** Every name form of the page's own country, in the render that decides its indexing. */
export const PLACEHOLDER = '⟨country⟩';
/** Its code in that render: user-assigned in ISO 3166-1, so no country's. */
export const PLACEHOLDER_CODE = 'zz';

const LANGS = ['en', 'ru', 'ar', 'zh', 'de', 'es'];
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
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
 * What a country page says of its own country (see above), from the HTML of
 * its <main> as the decision renders it: without the parts about other
 * countries and the days it states. Nothing in it is masked.
 */
export function ownContent(mainHtml) {
    return textOf(withoutElsewhere(String(mainHtml)).replace(/<time\b[^>]*>[\s\S]*?<\/time>/gi, ' '));
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

/**
 * Every way a country is named in the site's languages, longest first: the
 * snapshot's English forms (the model's name, sentence name, capitalized and
 * short) and each language's from the names unit (pages/ctf/names),
 * capitalized too.
 */
function nameForms(m, code) {
    const snap = m.snapshot?.countries?.find((c) => c.code === code);
    const the = snap?.sentence_name;
    const forms = [snap?.name, the, the && capital(the), the && the.replace(/^the /, '')];
    for (const lang of LANGS) {
        const names = ctfNames(lang);
        for (const key of ['name', 'short', 'in', 'inShort']) {
            const form = names[key]?.[code];
            if (form) forms.push(form, capital(form));
        }
    }
    return [...new Set(forms.filter(Boolean))].sort((a, b) => b.length - a.length);
}

/** A local note with every name of its country the placeholder, in each language it is written in. */
function placeholderNote(note, forms) {
    if (!note) return note;
    const out = { ...note };
    for (const [key, value] of Object.entries(note)) {
        if (key === 'reviewed' || typeof value !== 'string') continue;
        let text = value;
        for (const form of forms) text = text.split(form).join(PLACEHOLDER);
        out[key] = text;
    }
    return out;
}

/**
 * The model `m` (in any language) with the country `code` as the decision
 * reads it: the same data and the same local note, but every name form the
 * placeholder and its code the placeholder code. Render the page of
 * PLACEHOLDER_CODE in it.
 */
export function placeholderModel(m, code) {
    const real = m.byCode.get(code);
    if (!real) throw new Error(`placeholderModel: no country ${code} in the model`);
    const twin = {
        ...real,
        code: PLACEHOLDER_CODE,
        name: PLACEHOLDER,
        the: PLACEHOLDER,
        The: PLACEHOLDER,
        short: PLACEHOLDER,
        sortKey: PLACEHOLDER,
        shortKey: PLACEHOLDER,
        keys: [PLACEHOLDER],
        // a translation's "in <country>" forms (ctf/model.js localModel); English builds them from `the`
        ...('in' in real ? { in: PLACEHOLDER, In: PLACEHOLDER, inShort: PLACEHOLDER } : {}),
        note: placeholderNote(real.note, nameForms(m, code)),
    };
    const swap = (list) => list.map((c) => (c.code === code ? twin : c));
    const countries = swap(m.countries);
    return { ...m, countries, byCode: new Map(countries.map((c) => [c.code, c])), az: swap(m.az) };
}

/**
 * The decision for every country page in each of `langs` (English first):
 * `render({ code, lang, model })` is the HTML of the <main> of the page of
 * `code` in `model`, as the site renders it (CtfCountry.jsx). Returns
 * `decided` (code → { noindex, alike }, in the model's order: every
 * language's pages), `byLang` (lang → { decided, groups }, the groups of more
 * than one page that read alike) and `disagreements` (a language that would
 * noindex other countries than the first).
 */
export function countryIndexing(m, render, langs = ['en']) {
    const byLang = new Map();
    for (const lang of langs) {
        const lm = localModel(m, lang);
        const contents = new Map(lm.countries.map((c) => [c.code, ownContent(render({ code: PLACEHOLDER_CODE, lang, model: placeholderModel(lm, c.code) }))]));
        const groups = contentGroups(contents);
        const decided = new Map();
        for (const group of groups) {
            for (const code of group) decided.set(code, { noindex: group.length > 1, alike: group.filter((other) => other !== code) });
        }
        byLang.set(lang, {
            decided: new Map(lm.countries.map((c) => [c.code, decided.get(c.code)])),
            groups: groups.filter((group) => group.length > 1),
        });
    }
    const [first] = langs;
    const base = byLang.get(first).decided;
    const disagreements = [];
    for (const [lang, { decided }] of byLang) {
        if (lang === first) continue;
        const differ = [...decided].filter(([code, d]) => d.noindex !== base.get(code).noindex).map(([code]) => code);
        if (differ.length) {
            disagreements.push(`${lang} would ${differ.map((code) => `${decided.get(code).noindex ? 'noindex' : 'index'} /${lang}/ctf/${code}`).join(', ')}, unlike ${first}`);
        }
    }
    return { decided: base, byLang, disagreements };
}

/**
 * The figures a country page states (CtfCountry.jsx and ctf/model.js) as the
 * page prints them in its language: its dashboard counts, its territory flag,
 * and after a root its roles' winners, units, pots and chances, its near
 * misses, awards and epochs without a winner. Pots that print alike are alike
 * (0.001 α and 0.004 α are both "0.00").
 */
function statedAs(c, f) {
    const n = (value, format) => (value === null || value === undefined ? null : format(value));
    return JSON.stringify([
        c.inhabited,
        n(c.online, f.int), n(c.seenDays, f.int), n(c.lastSeen, String), n(c.peak, f.int),
        n(c.openEpochs, f.int), n(c.near, f.int), n(c.awarded, f.alpha),
        ...[c.p, c.x].map((r) => [n(r.won, f.int), n(r.units, f.int), n(r.pot, f.alpha), n(r.chance, f.pct)]),
    ]);
}

/**
 * The seo-audit's check of the built country pages against the decision
 * (countryIndexing, from the same renders the build decides with): `built` is
 * every built country page, { lang, code, noindex }. Each page is indexed as
 * decided, in every language; the languages agree; and pages that read alike
 * print the same figures, or a page leaves out its own. Returns the problems.
 */
export function countryIndexingProblems(m, decision, built) {
    const problems = decision.disagreements.map((d) => `capture the flag: ${d} (every language must noindex the same countries)`);
    const at = (lang, code) => (lang === 'en' ? `/ctf/${code}` : `/${lang}/ctf/${code}`);
    const some = (lang, codes) => (codes.length > 3
        ? `${codes.slice(0, 3).map((c) => at(lang, c)).join(', ')} and ${codes.length - 3} more`
        : codes.map((c) => at(lang, c)).join(', '));
    for (const { lang, code, noindex } of built) {
        const d = decision.decided.get(code);
        if (!d) {
            problems.push(`${at(lang, code)}: no such country in the snapshot`);
            continue;
        }
        if (Boolean(noindex) === d.noindex) continue;
        problems.push(d.noindex
            ? `${at(lang, code)}: indexable, though it reads like ${some(lang, d.alike)} but for the country's name, so it must be noindex`
            : `${at(lang, code)}: noindex, though it reads like no other country page`);
    }
    for (const [lang, { groups }] of decision.byLang) {
        const lm = localModel(m, lang);
        const f = formats(lang);
        for (const group of groups) {
            if (new Set(group.map((code) => statedAs(lm.byCode.get(code), f))).size > 1) {
                problems.push(`${some(lang, group)}: read the same but for the country's name, though the figures they print differ (a page leaves out its own figures)`);
            }
        }
    }
    return problems;
}

// What a page may say only after a draw (ctf/model.js): that a newcomer wins by
// default, in each language's words (the verb and "without the draw" in one
// clause), and a chance to win, a percentage in any language's format ("2.6%",
// "2,6 %", "83‎%‎"). ctf-copy.test.mjs keeps the copy and these in step.
export const DEFAULT_WIN = {
    en: /\bwins? by default\b/i,
    ru: /побежда\S*[^.]*?без\s+жеребь[её]вки/i,
    ar: /[يت]فوز[^.؛]*?دون\s+قرعة/,
    zh: /无需抽签/,
    de: /\bgewinn(?:t|st|en)\b[^.]*?ohne\s+Auslosung/i,
    es: /\bgan(?:a|as|an|ar)\b[^.]*?sin\s+sorteo/i,
};
export const CHANCE_SHOWN = /\d[\s  ]?‎?[%٪]/;
