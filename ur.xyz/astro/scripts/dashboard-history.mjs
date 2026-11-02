#!/usr/bin/env node
// Update /dashboard's daily history (react/public/dashboard/history.json, mirrored
// to astro/public/dashboard/history.json): one value per UTC day for every series the
// page charts, the countries at the end of each day, 90 days of hourly throughput,
// the reserve's daily balance and the α price at each epoch's settlement.
//
// Days already in the file are kept, so the history grows past Grafana's retention;
// the last 90 days are re-read each run because late data can still settle. Run daily
// shortly after 00:00 UTC (a scheduled job on a maintainer's machine) or by hand:
//
//   node scripts/dashboard-history.mjs [--days 90] [--no-chain]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHistory } from '../../react/src/lib/dashboardData.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const TARGETS = ['../../react/public/dashboard/history.json', '../public/dashboard/history.json'].map((p) => path.resolve(here, p));
const argv = process.argv.slice(2);
const days = Number(argv[argv.indexOf('--days') + 1]) || 90;

const prev = fs.existsSync(TARGETS[0]) ? JSON.parse(fs.readFileSync(TARGETS[0], 'utf8')) : null;
const h = await buildHistory({ prev, days, chain: !argv.includes('--no-chain'), log: (m) => console.log(m) });

// the newest day must have its core series, or the run is not worth committing
const newest = h.days[h.end] || {};
const missing = ['providers', 'traffic', 'users24', 'nets'].filter((k) => newest[k] == null);
if (missing.length) {
    console.error(`dashboard history: ${h.end} is missing ${missing.join(', ')}; not written`);
    process.exit(1);
}
const json = JSON.stringify(h) + '\n';
for (const t of TARGETS) {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.writeFileSync(t, json);
}
console.log(`dashboard history: ${Object.keys(h.days).length} days to ${h.end}, ${Object.keys(h.countries).length} country snapshots, ${(json.length / 1024).toFixed(0)} KB`);
