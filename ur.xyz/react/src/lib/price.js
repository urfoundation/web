import { parseYaml } from './yaml.js';

/**
 * The published price sheet (/price.yml) and its market resolution.
 *
 * /price.yml is copied from the sn repo at build time (scripts/sync-price.mjs)
 * and publishes the demand deposit price per block (7 days), tiered by the
 * operator's staked α:
 *
 *   sn: 25
 *   tiered_per_block_demand_deposits:
 *     0:    { alpha_per_gib: 0, alpha_per_user: 0 }
 *     1000: { alpha_per_gib: 0, alpha_per_user: 0 }
 *
 * An operator pays the best tier whose staked-α threshold it meets; the
 * 0 tier applies to everyone, with or without staked α. In the initial
 * period every rate is 0: no demand deposits are collected while the network
 * is hardened, and the tiers keep the shape of the schedule for when they
 * are (PriceSection shows the initial-period note while every rate is 0).
 *
 * Those top-level rates are a mirror for people and this site. What prices a
 * deposit is signed_schedule: each entry takes effect from an epoch, states its
 * rates and cap, and is signed by the subnet owner's key. This module reads the
 * entries so the page can say what is signed and from when; it does not check
 * their signatures. That is the sn repo's pricesheet tool, which the publish
 * gate runs (scripts/sync-price.mjs).
 *
 * α → USD resolves against CoinGecko's public onchain (GeckoTerminal) feed:
 * on the "bittensor" network, every subnet's α/TAO pool has the
 * deterministic address "0-<sn>" and is quoted in USD. The endpoints are
 * keyless and CORS-open, so the browser queries them directly.
 */

export const PRICE_SHEET_URL = '/price.yml';
export const PRICE_FEED_URL = '/price.rss';

const GECKO_POOLS = 'https://api.geckoterminal.com/api/v2/networks/bittensor/pools';

const PLAIN_DECIMAL = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
const WHOLE_NUMBER = /^(0|[1-9][0-9]*)$/;
const SIGNATURE = /^0x[0-9a-fA-F]{130}$/;

/** A sheet's number as exact text, trailing zeros aside: 0.10 and 0.1 are one rate. */
function exactDecimal(value, what) {
    if (typeof value !== 'string' || !PLAIN_DECIMAL.test(value)) {
        throw new Error(`price sheet: ${what} is not a plain decimal number`);
    }
    return value.includes('.') ? value.replace(/\.?0+$/, '') : value;
}

function isMapping(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * A mapping of tiers, sorted by ascending staked-α threshold. A rate that is
 * missing or misspelt is an error, never a 0: this sheet's 0 means something.
 */
function parseTiers(raw, where) {
    if (!isMapping(raw)) throw new Error(`price sheet: ${where} has no tiers`);
    return Object.keys(raw)
        .map(key => {
            const what = `${where} tier ${key}`;
            const rates = raw[key];
            if (!isMapping(rates)) throw new Error(`price sheet: ${what} has no rates`);
            for (const field of Object.keys(rates)) {
                if (field !== 'alpha_per_gib' && field !== 'alpha_per_user') {
                    throw new Error(`price sheet: ${what} has an unexpected field ${field}`);
                }
            }
            const minStake = exactDecimal(key, `${what} threshold`);
            const gib = exactDecimal(rates.alpha_per_gib, `${what} alpha_per_gib`);
            const user = exactDecimal(rates.alpha_per_user, `${what} alpha_per_user`);
            return {
                minStakeAlpha: Number(minStake),
                alphaPerGib: Number(gib),
                alphaPerUser: Number(user),
                exact: { minStake, gib, user }
            };
        })
        .sort((a, b) => a.minStakeAlpha - b.minStakeAlpha);
}

/** The signed entries, oldest first. Epochs stay text: a uint64 outruns a Number. */
function parseSigned(raw) {
    if (raw === undefined || raw === null) return [];
    if (!isMapping(raw)) throw new Error('price sheet: signed_schedule is not a mapping');
    return Object.keys(raw)
        .map(epoch => {
            const where = `signed_schedule entry ${epoch}`;
            const entry = raw[epoch];
            if (!WHOLE_NUMBER.test(epoch) || !isMapping(entry)) throw new Error(`price sheet: bad ${where}`);
            if (!SIGNATURE.test(String(entry.signature))) throw new Error(`price sheet: ${where} has no signature`);
            return {
                effectiveEpoch: epoch,
                capAlpha: exactDecimal(entry.epoch_cap_alpha, `${where} epoch_cap_alpha`),
                tiers: parseTiers(entry.tiers, where)
            };
        })
        .sort((a, b) => {
            const [x, y] = [BigInt(a.effectiveEpoch), BigInt(b.effectiveEpoch)];
            return x < y ? -1 : x > y ? 1 : 0;
        });
}

/**
 * Parse the price.yml text into { sn, tiers, signed }. tiers are the top-level
 * rates sorted by ascending staked-α threshold (so tiers[0] is the 0 / everyone
 * tier), and signed the signed entries, oldest first, as { effectiveEpoch,
 * capAlpha, tiers }. Each tier's numbers are floats for arithmetic, and in its
 * `exact` their text { minStake, gib, user }, which is what to show. A sheet
 * that states a rate in any way but a plain decimal number is refused.
 */
export function parsePriceSheet(text) {
    const doc = parseYaml(text, { exactNumbers: true });
    if (!WHOLE_NUMBER.test(String(doc.sn))) throw new Error('price sheet: no sn');
    const raw = doc.tiered_per_block_demand_deposits;
    return {
        sn: Number(doc.sn),
        tiers: raw === undefined ? [] : parseTiers(raw, 'tiered_per_block_demand_deposits'),
        signed: parseSigned(doc.signed_schedule)
    };
}

/**
 * Exact decimal text in the page's language: grouping and decimal separator from
 * the locale, every digit from the text. Number#toLocaleString would round it,
 * through the float and then to its digit limit. (The site's locales all write
 * Latin digits; see intlLocale.)
 */
export function formatAlphaExact(text, locale) {
    const [whole, fraction] = String(text).split('.');
    const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(whole));
    if (!fraction) return grouped;
    const decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
        .formatToParts(1.5)
        .find(part => part.type === 'decimal').value;
    return `${grouped}${decimal}${fraction}`;
}

/**
 * The wallets the network operator's sourcing commitment names, shown beside a
 * signed price: the Solana wallet whose USDC is swapped for TAO, and the
 * Bittensor wallet that stakes it into SN25 α and makes the deposits. `key` is
 * the label's dictionary key; each links to its chain's explorer, the deposit
 * wallet to Taostats as the site links its other Bittensor addresses.
 */
export const SOURCING_WALLETS = Object.freeze([
    Object.freeze({
        key: 'sourcingUsdcWallet',
        address: 'Krk6bfrkXLFQyzguQWFGCpWn45TQ9KjE7hcw3g1dK38',
        explorer: 'Solana Explorer',
        href: 'https://explorer.solana.com/address/Krk6bfrkXLFQyzguQWFGCpWn45TQ9KjE7hcw3g1dK38'
    }),
    Object.freeze({
        key: 'sourcingDepositWallet',
        address: '0x672b0DD503c5066ab2e3fB41b84fc818e646C21B',
        explorer: 'Taostats',
        href: 'https://evm.taostats.io/address/0x672b0DD503c5066ab2e3fB41b84fc818e646C21B'
    })
]);

/** The best tier whose staked-α threshold `stakedAlpha` meets. */
export function tierForStake(tiers, stakedAlpha) {
    let best = tiers[0] || null;
    for (const t of tiers) {
        if (stakedAlpha >= t.minStakeAlpha) best = t;
    }
    return best;
}

export async function fetchPriceSheet(signal) {
    const res = await fetch(PRICE_SHEET_URL, { signal });
    if (!res.ok) throw new Error(`price sheet: HTTP ${res.status}`);
    return parsePriceSheet(await res.text());
}

/** Current subnet α price in USD. */
export async function fetchAlphaUsd(sn, signal) {
    const res = await fetch(`${GECKO_POOLS}/0-${sn}`, { signal });
    if (!res.ok) throw new Error(`alpha price: HTTP ${res.status}`);
    const body = await res.json();
    const usd = Number(body?.data?.attributes?.base_token_price_usd);
    if (!Number.isFinite(usd)) throw new Error('alpha price: no base_token_price_usd');
    return usd;
}

/** Hourly USD closes for the last 24h, oldest → newest. */
export async function fetchAlphaUsd24h(sn, signal) {
    const res = await fetch(
        `${GECKO_POOLS}/0-${sn}/ohlcv/hour?aggregate=1&limit=24&currency=usd`,
        { signal }
    );
    if (!res.ok) throw new Error(`alpha ohlcv: HTTP ${res.status}`);
    const body = await res.json();
    const list = body?.data?.attributes?.ohlcv_list;
    if (!Array.isArray(list)) throw new Error('alpha ohlcv: no ohlcv_list');
    // Rows arrive newest-first as [ts, open, high, low, close, volume].
    return list
        .map(row => Number(row?.[4]))
        .filter(Number.isFinite)
        .reverse();
}
