/**
 * price-gate — what a price sheet must be before the site publishes it.
 *
 * Operators and validators read /price.yml through the sn repo's pricesheet
 * package, which refuses a file with anything wrong in it and stays on the last
 * good one. The site reads the same file through lib/yaml.js, a small parser
 * that takes in nearly anything (a repeated key, a rate in flow style) and until
 * this gate read a misspelt rate as 0. So this reads the file strictly, as that
 * package does and in the one layout the site's parser reads correctly, holds its
 * numbers to the same rules, and only then asks the site's parser to agree.
 *
 * Numbers stay text and BigInt here, never a float: two rates a double cannot
 * tell apart are two prices.
 *
 * Signatures are not checked here. That is the pricesheet tool's work, which
 * scripts/sync-price.mjs runs when it has the sn checkout. An entry whose rates
 * were edited after signing passes this gate and fails that one.
 */
import { parsePriceSheet } from '../react/src/lib/price.js';

/** The subnet this site publishes the price of. */
const PUBLISHED_SN = '25';

// The limits of the sn repo's demand/pricesheet and protocol.ValidateDepositTiers.
const MAX_SHEET_BYTES = 256 << 10;
const MAX_TIERS = 8;
const RAO_PLACES = 9;
const MAX_DENOMINATOR_PLACES = 19; // 10^19 is the largest power of ten in a uint64
const MAX_UINT64 = 2n ** 64n - 1n;

const DECIMAL = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
const WHOLE = /^(0|[1-9][0-9]*)$/;
const SIGNATURE = /^"0x[0-9a-fA-F]{130}"$/;
// indent, key, value, then an optional comment
const LINE = /^( *)([^\s:#][^\s:]*):(?: +([^\s#].*?))?(?: +#.*)?$/;

const RATE_FIELDS = ['alpha_per_gib', 'alpha_per_user'];
const TOP_LEVEL_FIELDS = ['sn', 'tiered_per_block_demand_deposits', 'signed_schedule'];
const ENTRY_FIELDS = ['epoch_cap_alpha', 'signature', 'tiers'];

const placesOf = (text) => (text.split('.')[1] ?? '').length;
const scaled = (text, places) => {
    const [whole, fraction = ''] = text.split('.');
    return BigInt(whole + fraction.padEnd(places, '0'));
};
/** The same number however it is written: 0.10 and 0.1 state one price. */
const valueOf = (text) => (text.includes('.') ? text.replace(/\.?0+$/, '') : text);

class Refusal extends Error {}

function refuse(line, message) {
    throw new Refusal(`line ${line}: ${message}`);
}

/** The file's block mappings as a tree, refusing any line that is not "key: value" or "key:". */
function readTree(text) {
    const root = { indent: -1, line: 0, value: null, children: [] };
    const stack = [root];
    text.split('\n').forEach((raw, index) => {
        const line = index + 1;
        if (/[\t\r]/.test(raw)) refuse(line, 'a tab or carriage return');
        const body = raw.trimEnd();
        if (body.trim() === '' || body.trimStart().startsWith('#')) return;
        const match = LINE.exec(body);
        if (!match) refuse(line, `not a "key: value" line: ${body.trim()}`);
        const indent = match[1].length;
        while (stack[stack.length - 1].indent >= indent) stack.pop();
        const parent = stack[stack.length - 1];
        if (parent.value !== null) refuse(line, `indented under the value of ${parent.key}`);
        if (parent.children.length > 0 && parent.children[0].indent !== indent) refuse(line, 'inconsistent indentation');
        if (parent.children.some(child => child.key === match[2])) refuse(line, `repeated field ${match[2]}`);
        const node = { key: match[2], value: match[3] ? match[3] : null, indent, line, children: [] };
        parent.children.push(node);
        stack.push(node);
    });
    return root;
}

const childNamed = (node, key) => node.children.find(child => child.key === key);

/** A field with a value and nothing under it. */
function scalarOf(node) {
    if (node.value === null || node.children.length > 0) refuse(node.line, `${node.key} needs a value`);
    return node.value;
}

function decimalOf(node, what) {
    const text = scalarOf(node);
    if (!DECIMAL.test(text)) refuse(node.line, `${what} must be a plain decimal number, not ${text}`);
    return text;
}

function checkFields(node, allowed, where) {
    for (const child of node.children) {
        if (!allowed.includes(child.key)) refuse(child.line, `unexpected field ${child.key} in ${where}`);
    }
}

function readTiers(node, where) {
    if (node.value !== null || node.children.length === 0) refuse(node.line, `${where} needs tiers`);
    return node.children.map(tier => {
        if (!DECIMAL.test(tier.key)) refuse(tier.line, `a threshold in ${where} must be a plain decimal number, not ${tier.key}`);
        if (tier.value !== null) refuse(tier.line, `tier ${tier.key} in ${where} must set out its rates in block style`);
        checkFields(tier, RATE_FIELDS, `tier ${tier.key} of ${where}`);
        const rate = (field) => {
            const node = childNamed(tier, field);
            if (!node) refuse(tier.line, `tier ${tier.key} in ${where} has no ${field}`);
            return decimalOf(node, field);
        };
        return { minStake: tier.key, gib: rate('alpha_per_gib'), user: rate('alpha_per_user') };
    });
}

function readEntry(node) {
    const where = `signed entry ${node.key}`;
    if (!WHOLE.test(node.key) || BigInt(node.key) > MAX_UINT64) refuse(node.line, `an effective epoch must be a whole number, not ${node.key}`);
    if (node.value !== null) refuse(node.line, `${where} must be set out in block style`);
    checkFields(node, ENTRY_FIELDS, where);
    const field = (key) => {
        const child = childNamed(node, key);
        if (!child) refuse(node.line, `${where} has no ${key}`);
        return child;
    };
    const signature = scalarOf(field('signature'));
    if (!SIGNATURE.test(signature)) refuse(field('signature').line, `${where} needs a quoted 0x signature of 65 bytes`);
    return {
        epoch: node.key,
        cap: decimalOf(field('epoch_cap_alpha'), 'epoch_cap_alpha'),
        signature,
        tiers: readTiers(field('tiers'), where)
    };
}

function readSheet(text) {
    const root = readTree(text);
    checkFields(root, TOP_LEVEL_FIELDS, 'the sheet');
    const sn = childNamed(root, 'sn');
    const mirror = childNamed(root, 'tiered_per_block_demand_deposits');
    const schedule = childNamed(root, 'signed_schedule');
    if (!sn) refuse(1, 'the sheet names no sn');
    if (!mirror) refuse(1, 'the sheet has no tiered_per_block_demand_deposits');
    if (schedule && (schedule.value !== null || schedule.children.length === 0)) {
        refuse(schedule.line, 'signed_schedule needs entries, or leave it out');
    }
    return {
        sn: scalarOf(sn),
        tiers: readTiers(mirror, 'tiered_per_block_demand_deposits'),
        entries: schedule ? schedule.children.map(readEntry) : []
    };
}

/**
 * protocol.ValidateDepositTiers and the limits pricesheet.Parse puts on a
 * schedule, in the file's own order: a schedule out of order is not sorted for
 * anyone.
 */
function checkTiers(tiers, where, problems) {
    const before = problems.length;
    const bad = (message) => problems.push(`${where}: ${message}`);
    if (tiers.length > MAX_TIERS) bad(`${tiers.length} tiers, and at most ${MAX_TIERS} can be signed`);
    const ratePlaces = Math.max(...tiers.flatMap(tier => [placesOf(tier.gib), placesOf(tier.user)]));
    const places = RAO_PLACES + Math.max(0, ratePlaces - RAO_PLACES);
    if (places - RAO_PLACES > MAX_DENOMINATOR_PLACES) bad(`a rate has ${ratePlaces} decimals, and at most ${RAO_PLACES + MAX_DENOMINATOR_PLACES} can be stated`);
    for (const tier of tiers) {
        if (placesOf(tier.minStake) > RAO_PLACES || scaled(tier.minStake, RAO_PLACES) > MAX_UINT64) bad(`threshold ${tier.minStake} is not a whole number of rao`);
        for (const rate of [tier.gib, tier.user]) {
            if (scaled(rate, places) > MAX_UINT64) bad(`rate ${rate} is too large for a schedule with this many decimals`);
        }
    }
    if (problems.length > before) return;

    const threshold = (tier) => scaled(tier.minStake, RAO_PLACES);
    const [gibPriced, userPriced] = [scaled(tiers[0].gib, places) !== 0n, scaled(tiers[0].user, places) !== 0n];
    if (threshold(tiers[0]) !== 0n) bad('there is no 0 tier for everyone');
    tiers.forEach((tier, i) => {
        const [gib, user] = [scaled(tier.gib, places), scaled(tier.user, places)];
        if ((gib !== 0n) !== gibPriced) bad('alpha_per_gib is zero in some tiers only');
        if ((user !== 0n) !== userPriced) bad('alpha_per_user is zero in some tiers only');
        if (i === 0) return;
        const previous = tiers[i - 1];
        if (threshold(tier) <= threshold(previous)) bad('thresholds must increase');
        if (gib > scaled(previous.gib, places)) bad(`alpha_per_gib rises at tier ${tier.minStake}`);
        if (user > scaled(previous.user, places)) bad(`alpha_per_user rises at tier ${tier.minStake}`);
    });
}

function checkEntry(entry, problems) {
    const where = `signed entry ${entry.epoch}`;
    if (placesOf(entry.cap) > RAO_PLACES || scaled(entry.cap, RAO_PLACES) > MAX_UINT64) {
        problems.push(`${where}: epoch_cap_alpha ${entry.cap} is not a whole number of rao`);
    } else if (scaled(entry.cap, RAO_PLACES) === 0n) {
        problems.push(`${where}: epoch_cap_alpha is zero`);
    }
    checkTiers(entry.tiers, where, problems);
}

const sameTiers = (a, b) => a.length === b.length && a.every((tier, i) =>
    valueOf(tier.minStake) === valueOf(b[i].minStake)
    && valueOf(tier.gib) === valueOf(b[i].gib)
    && valueOf(tier.user) === valueOf(b[i].user));

/** The site's parser must read what this reads: anything else shows a price nobody published. */
function checkSiteReads(text, sheet, problems) {
    let site;
    try {
        site = parsePriceSheet(text);
    } catch (err) {
        problems.push(`the site cannot read it: ${err.message}`);
        return;
    }
    const exactTiers = (tiers) => tiers.map(tier => tier.exact);
    const sameRead = String(site.sn) === sheet.sn
        && sameTiers(exactTiers(site.tiers), sheet.tiers)
        && site.signed.length === sheet.entries.length
        && site.signed.every((entry, i) => entry.effectiveEpoch === sheet.entries[i].epoch
            && entry.capAlpha === valueOf(sheet.entries[i].cap)
            && sameTiers(exactTiers(entry.tiers), sheet.entries[i].tiers));
    if (!sameRead) problems.push('the site reads different rates from this file than it states');
}

/**
 * Readers take a new sheet only if it keeps every signed entry of the last one in
 * place and adds only later ones: a file that drops or changes an entry is a
 * rollback, and one that adds an entry before those could reprice epochs they have
 * already decided.
 */
function checkKeeps(sheet, previous, problems) {
    let last;
    try {
        last = readSheet(previous);
    } catch (err) {
        if (!(err instanceof Refusal)) throw err;
        problems.push(`the last published sheet cannot be read: ${err.message}`);
        return;
    }
    for (const entry of last.entries) {
        const kept = sheet.entries.find(candidate => candidate.epoch === entry.epoch);
        if (!kept) problems.push(`the signed entry from epoch ${entry.epoch} is already published and this file drops it`);
        else if (JSON.stringify(kept) !== JSON.stringify(entry)) problems.push(`the signed entry from epoch ${entry.epoch} is already published and this file changes it`);
    }
    const newest = last.entries[last.entries.length - 1];
    if (!newest) return;
    for (const entry of sheet.entries) {
        if (BigInt(entry.epoch) < BigInt(newest.epoch) && !last.entries.some(kept => kept.epoch === entry.epoch)) {
            problems.push(`the signed entry from epoch ${entry.epoch} is new and comes before the newest published entry, from epoch ${newest.epoch}; readers refuse that`);
        }
    }
}

/**
 * What is wrong with this sheet, as a list of reasons to refuse it; empty when it
 * may be published. `previous` is the text of the sheet published last, if any.
 */
export function checkPriceSheet(text, { previous } = {}) {
    if (Buffer.byteLength(text, 'utf8') > MAX_SHEET_BYTES) return [`larger than ${MAX_SHEET_BYTES} bytes`];
    if (text.includes('�')) return ['not valid UTF-8'];
    let sheet;
    try {
        sheet = readSheet(text);
    } catch (err) {
        if (!(err instanceof Refusal)) throw err;
        return [err.message];
    }

    const problems = [];
    if (sheet.sn !== PUBLISHED_SN) problems.push(`sn is ${sheet.sn}, and this site publishes sn ${PUBLISHED_SN}`);
    checkTiers(sheet.tiers, 'tiered_per_block_demand_deposits', problems);
    sheet.entries.forEach((entry, i) => {
        if (i > 0 && BigInt(entry.epoch) <= BigInt(sheet.entries[i - 1].epoch)) problems.push(`signed entry ${entry.epoch}: effective epochs must increase`);
        checkEntry(entry, problems);
    });

    const newest = sheet.entries[sheet.entries.length - 1];
    if (newest && !sameTiers(sheet.tiers, newest.tiers)) {
        problems.push(`tiered_per_block_demand_deposits differs from the newest signed entry, from epoch ${newest.epoch}`);
    }
    // A price exists only once it is signed. Rates shown with no entry behind them
    // would be read as the price, and nothing would charge them.
    if (!newest && sheet.tiers.some(tier => valueOf(tier.gib) !== '0' || valueOf(tier.user) !== '0')) {
        problems.push('tiered_per_block_demand_deposits shows rates and no signed entry states them');
    }

    checkSiteReads(text, sheet, problems);
    if (previous !== undefined) checkKeeps(sheet, previous, problems);
    return problems;
}
