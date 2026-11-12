/**
 * The capture the flag pages' social card: what it says, and the file it is
 * published as (react/public/ctf/og/<name>.png, rendered by
 * `node scripts/generate-og.mjs --ctf` after each import). The name carries
 * the epoch and a digest of the card's words, so a card whose figures changed
 * is a new URL and no cache keeps the old one; the hub and the country pages
 * share it. Build-time only: no island imports this.
 */
import { createHash } from 'node:crypto';
import { alpha, int, utcDay, utcTime } from './model.js';

export function ctfCard(m) {
    let footer;
    if (m.phase === 'prelaunch') footer = `From epoch ${m.firstEpoch} · ${utcDay(m.startsAt)}`;
    else if (m.phase === 'first') footer = `Epoch ${m.epoch} · first draw ≈ ${utcTime(m.drawAt)}`;
    else if (m.phase === 'drawing') footer = `Epoch ${m.firstEpoch}'s draw under way`;
    else if (m.drawn) footer = `Epoch ${m.epoch} · ${int(m.totals.openP)} countries with open provider slots`;
    else footer = `Epoch ${m.epoch} · ${alpha(m.last.carried)} α in pots`;
    return { kicker: 'Capture the flag', title: 'Earn crypto by sharing your internet in 249 countries', footer };
}

/** What the card shows, in words: its alt text (on a country page the description names the country, the card does not). */
export function ctfCardAlt(m) {
    const card = ctfCard(m);
    return `${card.kicker}: ${card.title}. ${card.footer}.`;
}

/** The card's path on the site. */
export function ctfOgImage(m) {
    const card = ctfCard(m);
    const digest = createHash('sha256').update(JSON.stringify(card)).digest('hex').slice(0, 8);
    return `/ctf/og/epoch-${m.epoch}-${digest}.png`;
}
