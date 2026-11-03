import React, { useEffect, useRef, useState } from 'react';
import Section from './Section';
import './PriceSection.css';
import { useLanguage, intlLocale } from '../i18n';
import { useAlphaPrice } from '../lib/usePrice';
import { copyText } from '../lib/clipboard';
import { PRICE_FEED_URL, PRICE_SHEET_URL, SOURCING_WALLETS, formatAlphaExact } from '../lib/price';

// Figures are formatted in the page's language (intlLocale), never the
// browser's.

// USD equivalents: 2 decimals at cents scale, 4 below a cent, and enough to
// stay above zero under that, so a priced rate never reads as $0.00.
const formatUsd = (n, locale) => {
    if (!isFinite(n)) return '—';
    if (n > 0 && n < 0.00005) return '$' + n.toLocaleString(locale, { maximumSignificantDigits: 2 });
    const digits = n >= 0.01 || n === 0 ? 2 : 4;
    return '$' + n.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: digits
    });
};

/** An address in the code face, whole, breaking if it must only at its middle (as on /reserve). */
function Address({ value, codeRef }) {
    const half = Math.ceil(value.length / 2);
    return (
        <code ref={codeRef} className="price-address" translate="no">
            <span>{value.slice(0, half)}</span><wbr /><span>{value.slice(half)}</span>
        </code>
    );
}

/**
 * The network operator's sourcing commitment, shown beside a signed price: how
 * it buys the α it deposits, and the two wallets that let anyone check it, each
 * in full with a Copy button and a link to its chain's explorer.
 */
function SourcingCommitment({ p }) {
    const [copied, setCopied] = useState(null);
    const addresses = useRef({});
    const copiedTimer = useRef(0);
    useEffect(() => () => clearTimeout(copiedTimer.current), []);
    const copy = async (wallet) => {
        // say "Copied" only when it was; otherwise the address is left selected to copy by hand
        if (!(await copyText(wallet.address, addresses.current[wallet.key]))) return;
        setCopied(wallet.key);
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(null), 2000);
    };
    return (
        <div className="price-sourcing">
            <h2 className="price-sourcing-title">{p.sourcingTitle}</h2>
            <p>{p.sourcingPays}</p>
            <p>{p.sourcingRoute}</p>
            <ul className="price-wallets">
                {SOURCING_WALLETS.map((wallet) => {
                    const label = p[wallet.key];
                    const done = copied === wallet.key;
                    return (
                        <li key={wallet.key}>
                            <span className="price-wallet-label">{label}</span>
                            <span className="price-wallet-row">
                                <Address value={wallet.address} codeRef={(el) => { addresses.current[wallet.key] = el; }} />
                                <span className="price-wallet-actions">
                                    <button type="button" className="price-copy" data-state={done ? 'copied' : undefined} onClick={() => copy(wallet)}>
                                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            {done
                                                ? <path d="M3.2 8.4l3 3 6.6-6.8" />
                                                : <><rect x="5.5" y="5.5" width="8" height="8" rx="1.6" /><path d="M10.5 5.5V4.1a1.6 1.6 0 0 0-1.6-1.6H4.1a1.6 1.6 0 0 0-1.6 1.6v4.8a1.6 1.6 0 0 0 1.6 1.6h1.4" /></>}
                                        </svg>
                                        {/* both words are laid in one cell, so the button is the same size in either state */}
                                        <span className="price-copy-label">
                                            <span data-shown={!done}>{p.sourcingCopy}</span>
                                            <span data-shown={done}>{p.sourcingCopied}</span>
                                        </span>
                                        <span className="price-visually-hidden"> {label.replace(/\s*[:：]\s*$/, '')}</span>
                                    </button>
                                    <a className="price-wallet-link" href={wallet.href} target="_blank" rel="noopener noreferrer">
                                        {p.sourcingView.replace('{explorer}', wallet.explorer)} <span aria-hidden="true">↗</span>
                                    </a>
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
            <span className="price-visually-hidden" role="status">{copied ? p.sourcingCopiedStatus : ''}</span>
            <p>{p.sourcingCheck}</p>
        </div>
    );
}

/**
 * PriceSection
 *
 * The published price sheet (/price.yml) rendered as a table: one row per
 * staked-α tier, with the α rates published exactly as the sheet states
 * them and live USD equivalents resolved from the subnet's public pool
 * feed. Links out to the RSS change feed and the raw yaml. Once a price is
 * signed the table is the newest signed entry, with its effective epoch said
 * above it, because that epoch may not have arrived: before the first signed
 * entry the initial period's 0 α stays in force, and before a later one the
 * earlier signed rate, listed under the sourcing commitment that a signed
 * price always shows.
 *
 * It is the whole /price page (the SPA's SectionPage, astro/src/pages/price.astro),
 * so its title is the page's h1. The static page passes the sheet it was
 * built from as `initialSheet`, so the table and the initial-period note are
 * in the HTML; the live sheet replaces it once fetched.
 */
export default function PriceSection({ initialSheet = null }) {
    const { t, code } = useLanguage();
    const locale = intlLocale(code);
    const fmtAlphaExact = (text) => formatAlphaExact(text, locale);
    const fmtUsd = (n) => formatUsd(n, locale);
    const p = t.price;
    const { sheet: liveSheet, alphaUsd, alphaUsdSource } = useAlphaPrice();
    const sheet = liveSheet || initialSheet;

    const signed = sheet ? sheet.signed : [];
    const newest = signed.length > 0 ? signed[signed.length - 1] : null;
    const earlier = signed.slice(0, -1).reverse();
    const tiers = newest ? newest.tiers : sheet ? sheet.tiers : [];
    const stakeLabel = (tier) => (tier.minStakeAlpha === 0
        ? p.tierEveryone
        : `≥ ${fmtAlphaExact(tier.exact.minStake)} α`);
    const usdNote = alphaUsdSource === 'operators'
        ? p.usdNoteOperators
        : p.usdNote.replace('{sn}', String(sheet ? sheet.sn : ''));
    // The initial period: the sheet publishes 0 α in every tier (no demand
    // deposits are collected while the network is hardened). The table still
    // shows the zeros; the note says why. The USD columns multiply a rate by
    // the α price, so a 0 rate is an honest $0.00 and nothing divides.
    const initialPeriod = tiers.length > 0 && tiers.every(t => t.alphaPerGib === 0 && t.alphaPerUser === 0);

    return (
        <Section id="price" eyebrow={p.eyebrow} title={p.title} headingLevel="h1">
            <p>{p.intro}</p>
            {initialPeriod && p.initialPeriod && (
                <p className="price-initial-period">{p.initialPeriod}</p>
            )}
            {newest && (
                <p className="price-signed">
                    {p.signedNote
                        .replace('{before}', earlier.length > 0 ? p.signedBefore : p.signedBeforeInitial)
                        .replaceAll('{epoch}', newest.effectiveEpoch)
                        .replace('{cap}', fmtAlphaExact(newest.capAlpha))}
                </p>
            )}

            <div className="article-table-wrap">
                <table className="article-table price-table">
                    <thead>
                        <tr>
                            <th>{p.colTier}</th>
                            <th>{p.colStake}</th>
                            <th>{p.colGib}</th>
                            <th>{p.colUser}</th>
                            <th>{p.colGibUsd}</th>
                            <th>{p.colUserUsd}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map((tier, i) => (
                            <tr key={tier.minStakeAlpha}>
                                <td>{i}</td>
                                <td>{stakeLabel(tier)}</td>
                                <td>{fmtAlphaExact(tier.exact.gib)} α</td>
                                <td>{fmtAlphaExact(tier.exact.user)} α</td>
                                <td>{alphaUsd == null ? '—' : fmtUsd(tier.alphaPerGib * alphaUsd)}</td>
                                <td>{alphaUsd == null ? '—' : fmtUsd(tier.alphaPerUser * alphaUsd)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="price-note">
                {alphaUsd == null || !sheet
                    ? p.usdUnavailable
                    : `${usdNote} ${p.alphaNow.replace('{usd}', fmtUsd(alphaUsd))}`}
            </p>

            {newest && <SourcingCommitment p={p} />}

            {earlier.length > 0 && (
                <>
                    <p className="price-signed-earlier">{p.signedEarlier}</p>
                    <div className="article-table-wrap">
                        <table className="article-table price-table">
                            <thead>
                                <tr>
                                    <th>{p.colFromEpoch}</th>
                                    <th>{p.colCap}</th>
                                    <th>{p.colStake}</th>
                                    <th>{p.colGib}</th>
                                    <th>{p.colUser}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earlier.flatMap(entry => entry.tiers.map(tier => (
                                    <tr key={`${entry.effectiveEpoch}:${tier.exact.minStake}`}>
                                        <td>{entry.effectiveEpoch}</td>
                                        <td>{fmtAlphaExact(entry.capAlpha)} α</td>
                                        <td>{stakeLabel(tier)}</td>
                                        <td>{fmtAlphaExact(tier.exact.gib)} α</td>
                                        <td>{fmtAlphaExact(tier.exact.user)} α</td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <div className="price-actions">
                <a href={PRICE_FEED_URL} className="card-link" type="application/rss+xml">
                    {p.subscribe}
                </a>
                <a href={PRICE_SHEET_URL} className="card-link">
                    {p.rawFile}
                </a>
            </div>
        </Section>
    );
}
