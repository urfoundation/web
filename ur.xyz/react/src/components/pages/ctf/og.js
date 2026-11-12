/**
 * The capture the flag pages' social card: what it says, and the file it is
 * published as (react/public/ctf/og/<name>.png, rendered by
 * `node scripts/generate-og.mjs --ctf` after each import). The name carries
 * the epoch and a digest of the card's words, so a card whose figures changed
 * is a new URL and no cache keeps the old one; the hub and the country pages
 * of one language share it, and each language has its own (the English name
 * is the one the pages always had). Build-time only: no island imports this.
 */
import { createHash } from 'node:crypto';
import { ctfCopy, formats, interpolate } from './i18n.js';

export function ctfCard(m, lang = m.lang || 'en') {
    const t = ctfCopy(lang);
    const o = t.og;
    const f = formats(lang);
    let footer;
    if (m.phase === 'prelaunch') footer = interpolate(o.prelaunch, { first: m.firstEpoch, day: f.utcDay(m.startsAt) });
    else if (m.phase === 'first') footer = interpolate(o.first, { epoch: m.epoch, draw: f.utcTime(m.drawAt) });
    else if (m.phase === 'drawing') footer = interpolate(o.drawing, { first: m.firstEpoch });
    else if (m.drawn) footer = f.count(o.drawn, m.totals.openP, { epoch: m.epoch });
    else footer = interpolate(o.undrawn, { epoch: m.epoch, amount: f.alpha(m.last.carried) });
    return { kicker: t.program, title: o.title, footer };
}

/** What the card shows, in words: its alt text (on a country page the description names the country, the card does not). */
export function ctfCardAlt(m, lang = m.lang || 'en') {
    const card = ctfCard(m, lang);
    return interpolate(ctfCopy(lang).og.alt, card);
}

/** The card's path on the site. */
export function ctfOgImage(m, lang = m.lang || 'en') {
    const card = ctfCard(m, lang);
    const digest = createHash('sha256').update(JSON.stringify(card)).digest('hex').slice(0, 8);
    return `/ctf/og/epoch-${m.epoch}-${digest}.png`;
}
