#!/usr/bin/env node
/**
 * The docs corpus in translation.
 *
 * Every published document under ur.xyz/docs/ (the litepaper, the miner,
 * validator and operator guides, the legal documents and the account-deletion
 * walkthrough) has a translation per site language at
 *
 *   react/src/i18n/pages/docs/corpus/<lang>/<its path under docs/>
 *
 * (corpus/ru/miner/install.md translates docs/miner/install.md), which
 * /<lang>/docs/<slug> renders (or /<lang>/terms, /<lang>/privacy, /<lang>/vdp
 * for the legal documents). A translation follows its English block for block:
 * the same headings at the same levels, the same paragraphs, lists (same
 * number of items), tables (same rows and cells), quotes and rules, in the
 * same order; every fenced code block byte for byte; in each block the same
 * inline code, link and image targets, URLs and email addresses, and every
 * number the English writes. A translated page takes each heading's id from
 * the English heading at the same place, so links to #anchors work in every
 * language. The front matter's `title` and `description` are translated,
 * `published` is kept.
 *
 * A translation records what it was made from: corpus/<lang>/sources.json
 * holds, per document, a hash of each English unit (front matter field and
 * block) at the time the translation was accepted. When the English changes
 * afterwards, the check names the units that are new or changed, so the
 * translation can be brought up to date. A missing, stale or misaligned
 * translation fails the gate (corpus.test.mjs, run by make gates).
 *
 *   node corpus.mjs                          check every language and document
 *   node corpus.mjs --check ru [doc ...]     check one language (or all), some documents
 *   node corpus.mjs --todo ru miner/run.md   the English units changed since the translation was accepted
 *   node corpus.mjs --sync-code all [doc]    copy the English code blocks into aligned translations
 *   node corpus.mjs --accept ru [doc ...]    record the current English for these translations
 *   node corpus.mjs --status                 one line per document and language
 *
 * Documents are named by their path under docs/ (miner/install.md, litepaper.md).
 * Run it from anywhere; it finds the files from its own location.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseBlocks } from '../../../lib/markdown-blocks.js';
import { DOC_PAGE_PATHS, HIDDEN_DOC_SLUGS, slugFor, splitFrontMatter } from '../../../lib/docs-shared.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = path.resolve(HERE, '../../../../../docs');
export const CORPUS_DIR = path.join(HERE, 'corpus');
export const LANGS = Object.freeze(['ru', 'ar', 'zh', 'de', 'es']);

// The scripts each language is written in: a block of prose with none of its
// letters is untranslated (German and Spanish are Latin-script, so for them a
// block identical to the English is what gives it away).
const SCRIPT = {
    ru: /[Ѐ-ӿ]/u,
    ar: /[؀-ۿ]/u,
    zh: /[㐀-鿿]/u,
};

// The longest a meta description may be (the site's rule: astro/src/lib/meta.js).
const DESCRIPTION_MAX = 175;

const hash = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);

/** The published documents' paths under docs/, as the site publishes them (lib/docs.js). */
export function corpusDocs() {
    const out = [];
    const seen = new Set();
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            if (e.name.startsWith('.')) continue;
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) walk(abs);
            else if (e.name.endsWith('.md')) {
                const rel = path.relative(DOCS_DIR, abs).replace(/\\/g, '/');
                const slug = slugFor(rel);
                // the root README is the repository's index, not a page; first file per slug wins
                if (!slug || seen.has(slug) || HIDDEN_DOC_SLUGS.has(slug)) continue;
                seen.add(slug);
                out.push(rel);
            }
        }
    };
    walk(DOCS_DIR);
    return out;
}

/** A legal document is rendered by scripts/legal-md.mjs (its own block rules), the rest by lib/markdown.jsx. */
export const isLegal = (rel) => Boolean(DOC_PAGE_PATHS[slugFor(rel)]);

export const englishPath = (rel) => path.join(DOCS_DIR, rel);
export const translationPath = (lang, rel) => path.join(CORPUS_DIR, lang, rel);
const sourcesPath = (lang) => path.join(CORPUS_DIR, lang, 'sources.json');

// ── reading a document as units ──────────────────────────────────────────────

// legal-md.mjs: blocks split on blank lines; a clause marker at 0/4/8 spaces
const CLAUSE = /^(\d+|[a-z]|[ivxl]+)\.\s+/;

function legalBlocks(body) {
    const out = [];
    for (const raw of body.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
        if (!raw.trim()) continue;
        const lines = raw.split('\n');
        const first = lines[0];
        const heading = first.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
            out.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
            const rest = lines.slice(1).join(' ').trim();
            if (rest) out.push({ type: 'paragraph', text: rest.replace(/\s+/g, ' ') });
            continue;
        }
        if (lines.some((l) => /^\s*-\s+/.test(l)) && lines.every((l) => /^\s*-\s+/.test(l) || /^\s{2,}\S/.test(l))) {
            const items = [];
            for (const l of lines) {
                const m = l.match(/^\s*-\s+(.*)$/);
                if (m) items.push(m[1]);
                else if (items.length) items[items.length - 1] += ` ${l.trim()}`;
            }
            out.push({ type: 'ulist', items });
            continue;
        }
        if (lines.every((l) => /^>\s?/.test(l) || !l.trim())) {
            out.push({ type: 'quote', text: lines.map((l) => l.replace(/^>\s?/, '')).join(' ').trim().replace(/\s+/g, ' ') });
            continue;
        }
        const indent = (first.match(/^\s*/) || [''])[0].length;
        const stripped = first.trim();
        const text = lines.map((l) => l.trim()).join(' ').replace(/\s+/g, ' ');
        const clause = stripped.match(CLAUSE);
        if (clause) {
            out.push({ type: 'clause', depth: indent >= 8 ? 2 : indent >= 4 ? 1 : 0, marker: clause[1], text: text.slice(clause[0].length) });
            continue;
        }
        out.push({ type: 'paragraph', text });
    }
    return out;
}

/** A document's units: its front matter fields, then its blocks, each with the text in it to translate. */
export function readUnits(source, rel) {
    const { meta, body } = splitFrontMatter(source);
    const units = [];
    for (const key of Object.keys(meta)) units.push({ kind: `meta:${key}`, key, value: meta[key] });
    const blocks = isLegal(rel) ? legalBlocks(body) : parseBlocks(body);
    for (const block of blocks) units.push({ kind: block.type, block });
    return { meta, body, units };
}

/** The pieces of prose a unit holds: one per heading, paragraph, list item, table cell. */
function textsOf(unit) {
    if (unit.kind.startsWith('meta:')) return [unit.value];
    const b = unit.block;
    switch (b.type) {
        case 'heading': case 'paragraph': case 'clause': return [b.text];
        case 'quote': return b.text != null ? [b.text] : parseBlocks(b.content).flatMap((inner) => textsOf({ kind: inner.type, block: inner }));
        case 'ulist': case 'olist': return b.items;
        case 'table': return b.rows.flat();
        default: return [];
    }
}

/** The shape two aligned units must share, apart from their prose. */
function shapeOf(unit) {
    if (unit.kind.startsWith('meta:')) return unit.kind;
    const b = unit.block;
    switch (b.type) {
        case 'heading': return `heading ${'#'.repeat(b.level)}`;
        case 'clause': return `clause ${b.marker}. at depth ${b.depth}`;
        case 'ulist': case 'olist': return `${b.type === 'ulist' ? 'bulleted' : 'numbered'} list of ${b.items.length}`;
        case 'table': return `table of ${b.rows.map((r) => r.length).join('/')} cells per row`;
        case 'quote': return b.text != null ? 'quote' : `quote of ${parseBlocks(b.content).map((x) => shapeOf({ kind: x.type, block: x })).join(', ')}`;
        case 'code': return `code block (${b.lang || 'no language'})`;
        default: return b.type;
    }
}

/** What an English unit is, for its hash: everything the translation follows. */
function unitKey(unit) {
    if (unit.kind.startsWith('meta:')) return `${unit.kind}\n${unit.value}`;
    return `${unit.kind}\n${JSON.stringify(unit.block)}`;
}

export const unitHash = (unit) => `${unit.kind}:${hash(unitKey(unit))}`;

const preview = (text, n = 90) => {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
};

function unitPreview(unit) {
    if (unit.kind === 'code') return `\`\`\`${unit.block.lang} ${preview(unit.block.content, 60)}`;
    if (unit.kind === 'hr') return '---';
    return preview(textsOf(unit).join(' | '));
}

// ── the inline checks ────────────────────────────────────────────────────────

const CODE_SPAN = /`[^`]*`/g;
const LINK_TARGET = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const BARE_URL = /\bhttps?:\/\/[^\s)<>\]`'"]+/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const DIGITS = /\d+/g;

function bag(list) {
    const m = new Map();
    for (const x of list) m.set(x, (m.get(x) || 0) + 1);
    return m;
}

function inlineParts(text) {
    const s = String(text || '');
    const code = s.match(CODE_SPAN) || [];
    const noCode = s.replace(CODE_SPAN, ' ');
    const targets = [...noCode.matchAll(LINK_TARGET)].map((m) => m[1]);
    const noTargets = noCode.replace(LINK_TARGET, '] ');
    const urls = noTargets.match(BARE_URL) || [];
    const emails = noTargets.replace(BARE_URL, ' ').match(EMAIL) || [];
    const prose = noTargets.replace(BARE_URL, ' ').replace(EMAIL, ' ');
    const digits = prose.match(DIGITS) || [];
    return { code, targets, urls, emails, digits, prose };
}

function compareSets(label, en, tr, out) {
    const a = new Set(en);
    const b = new Set(tr);
    const missing = [...a].filter((x) => !b.has(x));
    const extra = [...b].filter((x) => !a.has(x));
    if (missing.length) out.push(`${label} missing: ${missing.map((x) => JSON.stringify(x)).join(', ')}`);
    if (extra.length) out.push(`${label} not in the English: ${extra.map((x) => JSON.stringify(x)).join(', ')}`);
}

/** Problems with one translated piece of prose against its English. */
function checkInline(enText, trText, lang) {
    const out = [];
    const en = inlineParts(enText);
    const tr = inlineParts(trText);
    compareSets('inline code', en.code, tr.code, out);
    compareSets('link target', en.targets, tr.targets, out);
    compareSets('URL', en.urls, tr.urls, out);
    compareSets('email', en.emails, tr.emails, out);
    // every number the English writes, as often (a translation may add some: a month's number in a date)
    const have = bag(tr.digits);
    const lacking = [];
    for (const [d, n] of bag(en.digits)) if ((have.get(d) || 0) < n) lacking.push(d);
    if (lacking.length) out.push(`number(s) missing: ${lacking.join(', ')} (keep every figure, in Western digits)`);
    if (/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(trText)) out.push('has a direction mark (U+200E/200F/202A-202E/2066-2069): remove it');
    // untranslated prose: counted in the English's lowercase words, so a row of names
    // (Linux, macOS, Windows) may stay as written
    const words = (en.prose.match(/(?<!\p{L})[a-z]{2,}(?!\p{L})/gu) || []).length;
    const flat = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    if (words >= 3 && flat(enText) === flat(trText)) out.push('identical to the English (untranslated?)');
    else if (SCRIPT[lang] && words >= 4 && !SCRIPT[lang].test(tr.prose)) out.push(`no ${lang} text (untranslated?)`);
    return out;
}

// ── comparing a translation with its English ─────────────────────────────────

/** Structural and inline problems of a translation (`trSource`) against its English (`enSource`). */
export function compareDocument(enSource, trSource, rel, lang) {
    const problems = [];
    const en = readUnits(enSource, rel);
    const tr = readUnits(trSource, rel);

    // front matter: the same fields; `published` (a date) as written, the prose ones translated
    const enKeys = Object.keys(en.meta);
    const trKeys = Object.keys(tr.meta);
    for (const key of enKeys) if (!trKeys.includes(key)) problems.push(`front matter: "${key}" missing`);
    for (const key of trKeys) if (!enKeys.includes(key)) problems.push(`front matter: "${key}" is not in the English`);
    for (const key of enKeys) {
        if (!trKeys.includes(key)) continue;
        if (key === 'published') {
            if (tr.meta[key] !== en.meta[key]) problems.push(`front matter: published must stay ${en.meta[key]}`);
            continue;
        }
        for (const p of checkInline(en.meta[key], tr.meta[key], lang)) problems.push(`front matter ${key}: ${p}`);
        if (key === 'description' && [...tr.meta[key]].length > DESCRIPTION_MAX) {
            problems.push(`front matter description: ${[...tr.meta[key]].length} characters, over ${DESCRIPTION_MAX}`);
        }
    }

    // the blocks, one for one
    const enBlocks = en.units.filter((u) => !u.kind.startsWith('meta:'));
    const trBlocks = tr.units.filter((u) => !u.kind.startsWith('meta:'));
    const n = Math.min(enBlocks.length, trBlocks.length);
    for (let i = 0; i < n; i++) {
        const a = enBlocks[i];
        const b = trBlocks[i];
        if (shapeOf(a) !== shapeOf(b)) {
            problems.push(`block ${i + 1}: the English has a ${shapeOf(a)} ("${unitPreview(a)}"), the translation a ${shapeOf(b)} ("${unitPreview(b)}"). Every block after this one is compared out of step; fix this one first.`);
            return problems;
        }
        if (a.kind === 'code') {
            if (a.block.content !== b.block.content) problems.push(`block ${i + 1}: code block differs from the English (code is copied byte for byte): "${unitPreview(a)}"`);
            continue;
        }
        const ea = textsOf(a);
        const eb = textsOf(b);
        ea.forEach((text, j) => {
            const where = ea.length > 1 ? `block ${i + 1} (${a.kind === 'table' ? 'cell' : 'item'} ${j + 1})` : `block ${i + 1}`;
            for (const p of checkInline(text, eb[j], lang)) problems.push(`${where} "${preview(text, 60)}": ${p}`);
        });
    }
    if (enBlocks.length !== trBlocks.length) {
        const more = enBlocks.length > trBlocks.length ? enBlocks[n] : trBlocks[n];
        problems.push(`the English has ${enBlocks.length} blocks, the translation ${trBlocks.length}; the first unmatched is ${enBlocks.length > trBlocks.length ? 'English' : 'translated'} block ${n + 1}: ${shapeOf(more)} "${unitPreview(more)}"`);
    }
    return problems;
}

/** The English unit hashes of a document, in order: what an accepted translation records. */
export function englishHashes(rel) {
    return readUnits(fs.readFileSync(englishPath(rel), 'utf8'), rel).units.map(unitHash);
}

function readSources(lang) {
    const file = sourcesPath(lang);
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8')).docs || {};
}

function writeSources(lang, docs) {
    const sorted = Object.fromEntries(Object.entries(docs).sort(([a], [b]) => a.localeCompare(b)));
    const out = {
        about: 'Per document, a hash of each unit of the English (front matter field or block) this translation was made '
            + 'from. Written by corpus.mjs --accept, never by hand.',
        docs: sorted,
    };
    fs.mkdirSync(path.dirname(sourcesPath(lang)), { recursive: true });
    fs.writeFileSync(sourcesPath(lang), `${JSON.stringify(out, null, 2)}\n`);
}

/** The longest common subsequence of two hash lists, as the indexes of `b` it keeps. */
function lcsKept(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    const kept = new Set();
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { kept.add(j); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    return { kept, removed: a.length - kept.size };
}

/** What changed in the English since `lang`'s translation of `rel` was accepted, or null when current. */
export function changesSinceAccepted(lang, rel) {
    const recorded = readSources(lang)[rel];
    const current = englishHashes(rel);
    if (!recorded) return { never: true, changed: [], removed: 0 };
    if (recorded.length === current.length && recorded.every((h, i) => h === current[i])) return null;
    const { kept, removed } = lcsKept(recorded, current);
    const units = readUnits(fs.readFileSync(englishPath(rel), 'utf8'), rel).units;
    const changed = current.map((h, i) => i).filter((i) => !kept.has(i)).map((i) => ({ index: i, unit: units[i] }));
    return { never: false, changed, removed };
}

/** Every problem of `lang`'s translation of `rel`: missing, misaligned, a wrong inline part, stale. */
export function checkTranslation(lang, rel) {
    const file = translationPath(lang, rel);
    if (!fs.existsSync(file)) return [`missing: no ${path.relative(path.resolve(HERE, '../../../..'), file)}`];
    const problems = compareDocument(fs.readFileSync(englishPath(rel), 'utf8'), fs.readFileSync(file, 'utf8'), rel, lang);
    const changes = changesSinceAccepted(lang, rel);
    if (changes?.never) problems.push(`not accepted: once it matches the English, run node corpus.mjs --accept ${lang} ${rel}`);
    else if (changes) {
        const blockNo = (i, units) => i - units.slice(0, i).filter((u) => u.kind.startsWith('meta:')).length + 1;
        const units = readUnits(fs.readFileSync(englishPath(rel), 'utf8'), rel).units;
        const lines = changes.changed.map(({ index, unit }) => (unit.kind.startsWith('meta:')
            ? `front matter ${unit.key}: "${preview(unit.value, 70)}"`
            : `English block ${blockNo(index, units)} (${shapeOf(unit)}): "${unitPreview(unit)}"`));
        problems.push(`stale: the English changed after this translation was accepted; new or changed: ${lines.length ? lines.join('; ') : 'none'}${changes.removed ? `; ${changes.removed} unit(s) removed` : ''}. Update the translation, then node corpus.mjs --accept ${lang} ${rel}`);
    }
    return problems;
}

// ── commands ─────────────────────────────────────────────────────────────────

function pickLangs(arg) {
    if (arg === 'all') return [...LANGS];
    if (!LANGS.includes(arg)) {
        console.error(`corpus: the language is one of ${LANGS.join(', ')} or all`);
        process.exit(2);
    }
    return [arg];
}

function pickDocs(args) {
    const all = corpusDocs();
    if (!args.length) return all;
    for (const a of args) {
        if (!all.includes(a)) {
            console.error(`corpus: ${a} is not a published document (one of ${all.join(', ')})`);
            process.exit(2);
        }
    }
    return args;
}

/** Copy the English code blocks into a translation whose other blocks line up with the English. */
function syncCode(lang, rel) {
    const file = translationPath(lang, rel);
    if (!fs.existsSync(file) || isLegal(rel)) return false;
    const enBlocks = parseBlocks(splitFrontMatter(fs.readFileSync(englishPath(rel), 'utf8')).body);
    const source = fs.readFileSync(file, 'utf8');
    const trBlocks = parseBlocks(splitFrontMatter(source).body);
    if (enBlocks.length !== trBlocks.length || enBlocks.some((b, i) => b.type !== trBlocks[i].type)) return false;
    let out = source;
    let changed = false;
    // fences are found in order in the file, so replace the n-th fenced block's content
    const fences = [...source.matchAll(/^```[^\n]*\n([\s\S]*?)^```[ \t]*$/gm)];
    const codes = enBlocks.filter((b) => b.type === 'code');
    if (fences.length !== codes.length) return false;
    for (let k = fences.length - 1; k >= 0; k--) {
        const m = fences[k];
        const want = `\`\`\`${codes[k].lang}\n${codes[k].content}${codes[k].content ? '\n' : ''}\`\`\``;
        if (m[0] !== want) {
            out = out.slice(0, m.index) + want + out.slice(m.index + m[0].length);
            changed = true;
        }
    }
    if (changed) fs.writeFileSync(file, out);
    return changed;
}

function main(argv) {
    const [cmd, ...rest] = argv;
    if (cmd === '--status') {
        for (const rel of corpusDocs()) {
            const row = LANGS.map((lang) => {
                const problems = checkTranslation(lang, rel);
                if (!problems.length) return `${lang} ok`;
                if (problems[0].startsWith('missing')) return `${lang} missing`;
                if (problems.some((p) => p.startsWith('stale'))) return `${lang} stale`;
                if (problems.length === 1 && problems[0].startsWith('not accepted')) return `${lang} unaccepted`;
                return `${lang} ${problems.length} problem(s)`;
            });
            console.log(`${rel.padEnd(28)} ${row.join('  ')}`);
        }
        return 0;
    }
    if (cmd === '--accept') {
        const langs = pickLangs(rest[0]);
        const docs = pickDocs(rest.slice(1));
        let refused = 0;
        for (const lang of langs) {
            const sources = readSources(lang);
            for (const rel of docs) {
                const file = translationPath(lang, rel);
                if (!fs.existsSync(file)) { console.error(`${lang} ${rel}: no translation to accept`); refused++; continue; }
                const problems = compareDocument(fs.readFileSync(englishPath(rel), 'utf8'), fs.readFileSync(file, 'utf8'), rel, lang);
                if (problems.length) {
                    console.error(`${lang} ${rel}: not accepted, it does not match the English yet:`);
                    for (const p of problems) console.error(`  ${p}`);
                    refused++;
                    continue;
                }
                sources[rel] = englishHashes(rel);
            }
            for (const rel of Object.keys(sources)) if (!corpusDocs().includes(rel)) delete sources[rel];
            writeSources(lang, sources);
        }
        console.log(`corpus: accepted ${langs.length * docs.length - refused} translation(s)${refused ? `, refused ${refused}` : ''}`);
        return refused ? 1 : 0;
    }
    if (cmd === '--todo') {
        const [lang, rel] = rest;
        pickLangs(lang);
        pickDocs([rel]);
        const changes = changesSinceAccepted(lang, rel);
        if (!changes) { console.log(`${lang} ${rel}: current`); return 0; }
        if (changes.never) { console.log(`${lang} ${rel}: never accepted; translate the whole document`); return 0; }
        for (const { unit } of changes.changed) {
            console.log(`── ${unit.kind.startsWith('meta:') ? `front matter ${unit.key}` : shapeOf(unit)}`);
            console.log(unit.kind.startsWith('meta:') ? unit.value : unit.kind === 'code' ? unit.block.content : textsOf(unit).join('\n'));
        }
        if (changes.removed) console.log(`── and ${changes.removed} English unit(s) removed`);
        return 0;
    }
    if (cmd === '--sync-code') {
        const langs = pickLangs(rest[0]);
        const docs = pickDocs(rest.slice(1));
        for (const lang of langs) for (const rel of docs) if (syncCode(lang, rel)) console.log(`${lang} ${rel}: code blocks copied from the English`);
        return 0;
    }
    const langs = cmd === '--check' ? pickLangs(rest[0]) : [...LANGS];
    const docs = cmd === '--check' ? pickDocs(rest.slice(1)) : corpusDocs();
    if (cmd && cmd !== '--check') {
        console.error('usage: corpus.mjs [--check <lang|all> [doc ...] | --accept <lang|all> [doc ...] | --todo <lang> <doc> | --sync-code <lang|all> [doc ...] | --status]');
        return 2;
    }
    let count = 0;
    for (const lang of langs) {
        for (const rel of docs) {
            const problems = checkTranslation(lang, rel);
            if (!problems.length) continue;
            count += problems.length;
            console.log(`${lang} ${rel}:`);
            for (const p of problems) console.log(`  ${p}`);
        }
    }
    if (count) {
        console.log(`corpus: ${count} problem(s)`);
        return 1;
    }
    console.log(`corpus: ${docs.length} document(s) in ${langs.join(', ')}, all current`);
    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exit(main(process.argv.slice(2)));
}
