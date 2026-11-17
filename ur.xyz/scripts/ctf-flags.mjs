#!/usr/bin/env node
// ctf-flags.mjs — writes the capture the flag page's flags, one SVG per
// country, from the flag-icons 4×3 sprite the design was drawn with.
//
// The flags are flag-icons 7.6.0 (https://github.com/lipis/flag-icons, MIT;
// its licence is published beside them as LICENSE.txt). The design
// (sn/design/ctf/design.html) bundles them as one 16 × 16 sprite of 640×480
// cells in country-code order, 1.6 MB; the site serves one small file per
// flag instead, so a page loads only the flags it shows (the hub's grid loads
// them lazily). This script cuts the sprite into those files: each cell is a
// complete <svg> whose ids are unique across the sprite, so it stands alone.
//
// The flags are site assets, served from the site's own origin (the
// network-privacy gate refuses third-party hosts). They go to react/public
// (the SPA) and astro/public (the static build; sync-public mirrors the same
// files at build time, and the copies are committed like every other public
// asset).
//
// Usage (from ur.xyz):
//   node scripts/ctf-flags.mjs <sn>/design/ctf/flags-4x3-sprite.svg <sn>/design/ctf/FLAGS-LICENSE.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(ROOT, 'react/src/data/ctf-epoch.json');
export const FLAG_DIRS = ['react/public/ctf/flags', 'astro/public/ctf/flags'];

/** The sprite's cells, in order: each a standalone <svg> document. */
export function splitSprite(sprite) {
    const rootEnd = sprite.indexOf('>') + 1;
    const tags = /<svg\b[^>]*>|<\/svg>/g;
    tags.lastIndex = rootEnd;
    const cells = [];
    let depth = 0;
    let start = -1;
    for (let m = tags.exec(sprite); m; m = tags.exec(sprite)) {
        if (m[0].startsWith('</')) {
            depth -= 1;
            if (depth === 0) cells.push(sprite.slice(start, tags.lastIndex));
            if (depth < 0) break; // the sprite's own closing tag
        } else {
            if (depth === 0) start = m.index;
            depth += 1;
        }
    }
    return cells.map((cell) => {
        const open = cell.match(/^<svg\b[^>]*>/)[0];
        const viewBox = (open.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 640 480';
        const body = cell.slice(open.length, -'</svg>'.length).trim();
        const xlink = body.includes('xlink:') ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : '';
        return `<svg xmlns="http://www.w3.org/2000/svg"${xlink} viewBox="${viewBox}">\n${body}\n</svg>\n`;
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [spritePath, licensePath] = process.argv.slice(2);
    if (!spritePath || !licensePath) {
        console.error('usage: node scripts/ctf-flags.mjs <flags-4x3-sprite.svg> <FLAGS-LICENSE.txt>');
        process.exit(2);
    }
    const codes = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).countries.map((c) => c.code);
    const cells = splitSprite(readFileSync(spritePath, 'utf8'));
    if (cells.length !== codes.length) {
        console.error(`the sprite has ${cells.length} flags and the page ${codes.length} countries`);
        process.exit(1);
    }
    const license = `flag-icons 7.6.0, https://github.com/lipis/flag-icons\n\n${readFileSync(licensePath, 'utf8')}`;
    for (const dir of FLAG_DIRS) {
        const out = path.join(ROOT, dir);
        mkdirSync(out, { recursive: true });
        codes.forEach((code, i) => writeFileSync(path.join(out, `${code}.svg`), cells[i]));
        writeFileSync(path.join(out, 'LICENSE.txt'), license);
    }
    const bytes = cells.reduce((sum, c) => sum + c.length, 0);
    console.log(`wrote ${cells.length} flags (${(bytes / 1024).toFixed(0)} KB) to ${FLAG_DIRS.join(' and ')}`);
}
