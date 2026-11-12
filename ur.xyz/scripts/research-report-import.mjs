#!/usr/bin/env node
// research-report-import.mjs — refreshes the verbatim layer of a research
// report page's data from the research impact report it was made from.
//
// The page data (react/src/data/research-report-<id>.json) has two layers. The
// reader's first layer (each entry's headline, key stat, meaning, marker and
// meter moves, the method headings, the glossary) is written by hand in the
// JSON. Everything quoted from the report is imported by this script: each
// timeline row's change, measured impact and meaning for the suites with its
// evidence, the methods' text, the start-to-end estimates, the instrument notes
// and the one-sentence summary. Rows are matched by order and checked by date,
// so a row added to or removed from the report stops the import instead of
// shifting every entry. The report's milestone section (adaptive windows and
// gigabit-class throughput) is imported whole: its introduction, what changed,
// its evidence table and its closing bounds.
//
// The page is translated (react/src/i18n/pages/research-report/: its English is
// derived from this data, its translations sit beside it). The import writes
// only the data, so the translations stay as they are; the strings whose
// English it changed are listed, by copy unit and key, and the gate
// (tests/i18n-staleness.mjs) reports each one's translations as stale until
// they are translated again and recorded with --accept.
//
// Usage (from ur.xyz):
//   node scripts/research-report-import.mjs <report.md> react/src/data/research-report-2026-q3.json
//   node scripts/research-report-import.mjs <report.md> <data.json> --check   exit 1 if the data is stale
import { readFileSync, writeFileSync } from 'node:fs';
import { changedCopy } from '../react/src/i18n/pages/research-report/english.js';

// The report's evidence index (S1–S21), as what a reader can open: the suite
// documents and server measurements are public on GitHub; the PERFVAR
// measurement ledger is in a private repository, so it is named without a link.
const CONNECT = 'https://github.com/urnetwork/connect/blob/main/';
const SERVER = 'https://github.com/urnetwork/server/blob/main/';
const LEDGER = { label: 'PERFVAR measurement ledger', private: true };
const MEMSTEADY = { label: 'MEMSTEADY', href: `${CONNECT}MEMSTEADY.md` };
const LOWBAR = { label: 'LOWBAR', href: `${CONNECT}LOWBAR.md` };
export const SOURCES = {
    S1: [{ label: 'Server PERFVAR measurements', href: `${SERVER}connect/perfvar/MEASUREMENTS.md` }],
    S2: [MEMSTEADY],
    S3: [LEDGER],
    S4: [LEDGER, LOWBAR],
    S5: [MEMSTEADY, LEDGER],
    S6: [{ label: 'H1PLUS', href: `${CONNECT}H1PLUS.md` }],
    S7: [MEMSTEADY],
    S8: [MEMSTEADY],
    S9: [{ label: 'RTOPT', href: `${CONNECT}RTOPT.md` }],
    S10: [MEMSTEADY, LOWBAR],
    S11: [LEDGER],
    S12: [MEMSTEADY],
    S13: [MEMSTEADY],
    S14: [LEDGER],
    S15: [LEDGER],
    S16: [MEMSTEADY],
    S17: [LEDGER],
    S18: [LEDGER],
    S19: [LOWBAR],
    S20: [{ label: 'THROUGHPUTFIX', href: `${CONNECT}THROUGHPUTFIX.md` }, { label: 'THROUGHPUT-REPORT', href: `${CONNECT}THROUGHPUT-REPORT.md` }],
    S21: [{ label: 'THROUGHPUT-REPORT-PR2', href: `${CONNECT}THROUGHPUT-REPORT-PR2.md` }],
    S22: [{ label: 'THROUGHPUT-PR2-RESULTS', href: `${CONNECT}THROUGHPUT-PR2-RESULTS.md` }, { label: 'THROUGHPUT-REPORT-PR2', href: `${CONNECT}THROUGHPUT-REPORT-PR2.md` }, MEMSTEADY],
};

/** The S-numbers a citation names: "S4, S20" and the range "S20–S22". */
export function citedRefs(cite) {
    const refs = [];
    for (const part of cite.split(/,\s*/)) {
        const range = part.match(/^S(\d+)[–-]S?(\d+)$/);
        if (range) for (let n = Number(range[1]); n <= Number(range[2]); n++) refs.push(`S${n}`);
        else refs.push(part.trim());
    }
    return refs;
}

function evidenceFor(refs, where) {
    const evidence = [];
    for (const ref of refs) {
        if (!SOURCES[ref]) throw new Error(`${where} cites ${ref}, which this script does not map`);
        for (const src of SOURCES[ref]) if (!evidence.some((e) => e.label === src.label)) evidence.push(src);
    }
    return evidence;
}

// Wording the page summarizes rather than quotes: results from private runs
// are kept, the word that marks them private is not.
const SUMMARIZE = [
    ['Private pacing-on confirmation completed', 'A pacing-on confirmation run completed'],
];

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The report's inline Markdown (bold, code) as HTML, after escaping. */
export function inline(md) {
    return escapeHtml(md)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}

function summarize(text) {
    return SUMMARIZE.reduce((s, [from, to]) => s.split(from).join(to), text);
}

function section(md, heading) {
    const start = md.indexOf(`\n## ${heading}`);
    if (start < 0) throw new Error(`the report has no "## ${heading}" section`);
    const rest = md.slice(start + 1);
    const end = rest.indexOf('\n## ', 3);
    return end < 0 ? rest : rest.slice(0, end);
}

function tableRows(block) {
    return block.split('\n')
        .filter((line) => line.startsWith('| ') && !/^\|\s*-/.test(line))
        .slice(1)
        // the report's cells contain no pipes
        .map((line) => line.replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s+\|\s+/));
}

/** The report's quoted layer: its rows, methods, estimates, instruments and summary. */
export function extract(md) {
    const rows = [];
    for (const month of ['August', 'September', 'October']) {
        for (const [date, change, measured, suites] of tableRows(section(md, `Timeline: ${month}`))) {
            // the citations are the trailing bracket only ("iOS32" is not S32)
            const cite = suites.match(/\s*\[(S\d+(?:[–-]S?\d+)?(?:,\s*S\d+(?:[–-]S?\d+)?)*)\]\s*$/);
            const refs = cite ? citedRefs(cite[1]) : [];
            rows.push({
                month: month.slice(0, 3).toLowerCase(),
                date,
                change: inline(summarize(change)),
                measured: inline(summarize(measured)),
                suites: inline(summarize(cite ? suites.slice(0, cite.index) : suites)),
                refs,
            });
        }
    }
    const methods = section(md, 'Research methods used').split('\n')
        .filter((line) => line.startsWith('- **'))
        .map((line) => {
            const m = line.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
            return { title: m[1].replace(/\.$/, ''), text: inline(m[2]) };
        });
    const estimates = tableRows(section(md, 'Estimated start-to-end gains'))
        .map(([axis, evidence, estimate]) => ({ axis, evidence: inline(evidence), estimate: inline(estimate) }));
    const instruments = section(md, 'What changed in the research instruments').split('\n')
        .filter((line) => /^\d+\. \*\*/.test(line))
        .map((line) => {
            const m = line.match(/^\d+\. \*\*(.+?):\*\*\s*(.*)$/);
            return { name: m[1], text: inline(m[2]) };
        });
    const summary = (md.match(/For a brief external summary: \*\*(.+?)\*\*/) || [])[1];
    return { rows, methods, estimates, instruments, milestone: milestone(md), summary: summary ? inline(summary) : null };
}

/** The milestone section: its paragraphs, what changed, its table and its closing bounds, with what they cite. */
function milestone(md) {
    if (!md.includes('\n## Gigabit throughput milestone')) return null;
    const block = section(md, 'Gigabit throughput milestone');
    const title = block.split('\n', 1)[0].replace(/^## /, '');
    const refs = new Set();
    const strip = (text) => text.replace(/\s*\[(S\d+(?:[–-]S?\d+)?(?:,\s*S\d+(?:[–-]S?\d+)?)*)\]\s*$/, (m, cite) => {
        for (const r of citedRefs(cite)) refs.add(r);
        return '';
    });
    const sub = (heading) => {
        const start = block.indexOf(`\n### ${heading}`);
        if (start < 0) throw new Error(`the milestone section has no "### ${heading}"`);
        const rest = block.slice(start + 1);
        const end = rest.indexOf('\n### ', 4);
        return end < 0 ? rest : rest.slice(0, end);
    };
    const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('- '));
    const intro = paragraphs(block.slice(block.indexOf('\n') + 1, block.indexOf('\n### '))).map((p) => inline(strip(p)));
    const changes = sub('What changed').split('\n').filter((l) => l.startsWith('- **')).map((l) => {
        const m = l.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
        return { title: m[1].replace(/\.$/, ''), text: inline(strip(m[2])) };
    });
    const impact = sub('Recorded impact');
    const table = tableRows(impact).map(([experiment, result, establishes]) => ({ experiment: inline(experiment), result: inline(result), establishes: inline(establishes) }));
    const guards = paragraphs(impact).map((p) => inline(strip(p)));
    return { title, intro, changes, table, guards, evidence: evidenceFor([...refs], 'the milestone section') };
}

/** The page data with its quoted layer refreshed from the report. */
export function refresh(data, md) {
    const report = extract(md);
    if (report.rows.length !== data.entries.length) {
        throw new Error(`the report has ${report.rows.length} timeline rows and the page has ${data.entries.length} entries; add or remove the entry by hand first`);
    }
    if (report.methods.length !== data.methods.length) throw new Error(`the report has ${report.methods.length} methods and the page has ${data.methods.length}`);
    const entries = data.entries.map((entry, i) => {
        const row = report.rows[i];
        if (row.date !== entry.date) throw new Error(`entry ${i} is dated ${entry.date} and the report's row ${i} ${row.date}`);
        const evidence = evidenceFor(row.refs, `entry ${i}`);
        return { ...entry, month: row.month, change: row.change, measured: row.measured, suites: row.suites, evidence };
    });
    const methods = data.methods.map((m, j) => ({ ...m, title: report.methods[j].title, text: report.methods[j].text }));
    const end = data.end.map((card) => (card.row != null ? { ...card, report: report.estimates[card.row] } : card));
    const instruments = data.instruments.map((it) => {
        const from = report.instruments.find((r) => r.name === it.name);
        if (!from) throw new Error(`the report no longer describes the ${it.name} instrument`);
        return { ...it, text: from.text };
    });
    const milestone = report.milestone ? { ...(data.milestone || {}), report: report.milestone } : data.milestone;
    return { ...data, entries, methods, end, instruments, milestone, summary: report.summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const [reportPath, dataPath, flag] = process.argv.slice(2);
    if (!reportPath || !dataPath) {
        console.error('usage: node scripts/research-report-import.mjs <report.md> <data.json> [--check]');
        process.exit(2);
    }
    const before = readFileSync(dataPath, 'utf8');
    const refreshed = refresh(JSON.parse(before), readFileSync(reportPath, 'utf8'));
    const after = `${JSON.stringify(refreshed, null, 2)}\n`;
    // the translated strings whose English this changes
    const stale = Object.entries(changedCopy(JSON.parse(before), refreshed));
    const report = (verb) => {
        for (const [unit, keys] of stale) {
            console.log(`${unit}: ${keys.length} English string(s) ${verb}; their translations are stale until translated again:`);
            for (const key of keys) console.log(`  ${key}`);
            console.log(`  then, from react/: node tests/i18n-staleness.mjs --unit ${unit} --accept <lang> ${keys.join(' ')}`);
        }
    };
    if (flag === '--check') {
        if (before !== after) {
            report('would change');
            console.error(`${dataPath} is stale: run without --check to refresh it`);
            process.exit(1);
        }
        console.log(`${dataPath} matches the report`);
    } else {
        writeFileSync(dataPath, after);
        console.log(before === after ? `${dataPath} already matches the report` : `refreshed ${dataPath}`);
        report('changed');
    }
}
