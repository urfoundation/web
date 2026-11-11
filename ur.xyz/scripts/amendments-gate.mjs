/**
 * amendments-gate — what the settlement amendments file must be before the site
 * publishes it.
 *
 * The server, the validator and snclaim read /amendments.yml through the sn repo's
 * amendment package. It refuses a file with anything wrong in it and stays on the
 * last good one, and a reader that has never verified one holds the amendments in
 * force unknown. So this reads the file strictly, in the layout the amendment tool
 * writes, and holds it to what those readers accept: SN25's file, each line exactly
 * as a version they read writes it, for chain 964, each signature in the one form
 * they take, the entries in the order they take effect, and every entry already
 * published kept in its place.
 *
 * Signatures are not checked here, nor the carry contract's EIP-55 checksum, which
 * takes Keccak-256. That is the amendment tool's work, which scripts/sync-amendments.mjs
 * runs when it has the sn checkout. An entry whose line was edited after signing
 * passes this gate and fails that one.
 *
 * Numbers stay text and BigInt here, never a float.
 */

/** The subnet and the chain whose amendments this site publishes. */
export const PUBLISHED_SN = '25';
export const PUBLISHED_CHAIN = '964';

// The limits and the line formats of the sn repo's amendment package.
const MAX_FILE_BYTES = 256 << 10;
const MAX_LINE_BYTES = 512;
const MAX_UINT64 = 2n ** 64n - 1n;
const MAX_UINT64_DIGITS = 20;
const CTF_POOL_BASE = 2n ** 32n; // an operator's CTF pool is 2^32 + its id, which stays below 2^32
const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const LINE_PREFIX = 'UR settlement amendment v';
const CLAUSE_SEPARATOR = ', ';
// The words each version fixes after its operator and first epoch: the owner's
// decisions, which a line states in full. Version 2 states its CTF pool and carry
// contract between them.
const EXTENDER_CLAUSES = [
    'intra-platform and intra-network extenders',
    'units egress prefix',
    'free and paid',
    'zeta 1',
];
const CTF_CLAUSES = [
    'shares pool 4/10 ctf 1/10 head 5/10',
    'head cedes to pool',
    'slots 5 providers 5 extenders',
    'countries iso 3166-1 249',
    'presence half epoch',
    'units egress prefix',
    'draw drand quicknet 60s after census',
];

const WHOLE = /^(0|[1-9][0-9]*)$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const SIGNATURE = /^0x[0-9a-f]{130}$/;
// A top-level field: key, value, then an optional comment.
const FIELD = /^([^\s:#-][^\s:]*):(?: +([^\s#].*?))?(?: +#.*)?$/;
// An entry as the amendment tool writes it: "- line:", the line in double quotes
// exactly as signed, and under it "signature:", in double quotes too.
const ENTRY = /^( *)- line: "([^"\\]*)"(?: +#.*)?$/;
const ENTRY_FIELD = /^( +)([^\s:#-][^\s:]*):/;
const QUOTED_SIGNATURE = /^ +signature: "([^"\\]*)"(?: +#.*)?$/;

class Refusal extends Error {}

function refuse(line, message) {
    throw new Refusal(`line ${line}: ${message}`);
}

/**
 * The file's sn and its entries, each with the line numbers of its line and its
 * signature, refusing anything but comments, `sn: N` and a block list of entries
 * under `signed_amendments:`.
 */
function readFile(text) {
    let sn = null;
    let list = null; // the line of signed_amendments:
    let open = false; // reading the entries under it
    let indent = null; // the column of their dashes
    let entry = null; // the entry being read
    const entries = [];
    const close = () => {
        if (entry && entry.signature === undefined) refuse(entry.at, `the entry has no signature: ${entry.line}`);
    };
    text.split('\n').forEach((raw, index) => {
        const line = index + 1;
        if (/[\t\r]/.test(raw)) refuse(line, 'a tab or carriage return');
        const body = raw.trimEnd();
        if (body.trim() === '' || body.trimStart().startsWith('#')) return;

        if (!/^[ -]/.test(body)) {
            const match = FIELD.exec(body);
            if (!match) refuse(line, `not a "key: value" line: ${body}`);
            const [, key, value] = match;
            close();
            entry = null;
            open = false;
            if (key === 'sn') {
                if (sn !== null) refuse(line, 'repeated field sn');
                if (value === undefined) refuse(line, 'sn needs a value');
                sn = value;
            } else if (key === 'signed_amendments') {
                if (list !== null) refuse(line, 'repeated field signed_amendments');
                if (value !== undefined) refuse(line, 'signed_amendments must list its entries in block style, each "- line:" and under it "signature:"');
                list = line;
                open = true;
            } else {
                refuse(line, `unexpected field ${key}`);
            }
            return;
        }

        if (!open) refuse(line, `only the entries under signed_amendments are indented or start with "-": ${body.trim()}`);
        const item = ENTRY.exec(body);
        if (item) {
            if (indent === null) indent = item[1].length;
            else if (item[1].length !== indent) refuse(line, 'inconsistent indentation');
            close();
            entry = { at: line, line: item[2] };
            entries.push(entry);
            return;
        }
        if (/^ *-( |$)/.test(body)) refuse(line, 'an entry starts "- line:", with its line in double quotes, on one line, exactly as signed');
        const field = ENTRY_FIELD.exec(body);
        if (!field) refuse(line, `not a "key: value" line: ${body.trim()}`);
        if (!entry) refuse(line, `unexpected field ${field[2]} in signed_amendments, where each entry starts "- line:"`);
        if (field[2] !== 'signature') refuse(line, `unexpected field ${field[2]} in the entry at line ${entry.at}`);
        if (entry.signature !== undefined) refuse(line, `repeated field signature in the entry at line ${entry.at}`);
        if (field[1].length !== indent + 2) refuse(line, 'inconsistent indentation: a signature lines up with its entry\'s "line:"');
        const quoted = QUOTED_SIGNATURE.exec(body);
        if (!quoted) refuse(line, 'a signature is written in double quotes, on its own line');
        entry.signature = quoted[1];
        entry.signatureAt = line;
    });
    close();
    if (list !== null && entries.length === 0) refuse(list, 'signed_amendments needs entries, or leave it out');
    if (sn === null) refuse(1, 'the file names no sn');
    return { sn, entries };
}

/** A plain whole number from low to high, as text: no sign, no leading zero, no other base. */
function wholeIn(text, low, high) {
    if (text.length > MAX_UINT64_DIGITS || !WHOLE.test(text)) throw new Refusal(`${JSON.stringify(text)} is not a plain whole number`);
    const value = BigInt(text);
    if (value < low || value > high) throw new Refusal(`${text} is not ${low} to ${high}`);
    return value;
}

/**
 * The terms of a line, which must be exactly the line its version writes for them,
 * as amendment.ParseLine requires: a line that differs from it in any character is
 * refused. The carry contract's checksum is left to the amendment tool.
 */
function readLine(line) {
    const bytes = Buffer.byteLength(line, 'utf8');
    if (bytes === 0 || bytes > MAX_LINE_BYTES) throw new Refusal(`a line is 1 to ${MAX_LINE_BYTES} bytes, and this one is ${bytes}`);
    if (!/^[\x20-\x7e]+$/.test(line)) throw new Refusal('a line is printable ASCII');
    const start = `"${LINE_PREFIX}N: "`;
    if (!line.startsWith(LINE_PREFIX)) throw new Refusal(`a line starts ${start}`);
    const rest = line.slice(LINE_PREFIX.length);
    const colon = rest.indexOf(': ');
    if (colon === -1) throw new Refusal(`a line starts ${start}`);
    const versionText = rest.slice(0, colon);
    if (versionText !== '1' && versionText !== '2') throw new Refusal(`version ${versionText} is not a line format readers read`);
    const version = Number(versionText);
    const clauses = rest.slice(colon + 2).split(CLAUSE_SEPARATOR);
    const count = version === 1 ? 4 + EXTENDER_CLAUSES.length : 7 + CTF_CLAUSES.length;
    if (clauses.length !== count) throw new Refusal(`a v${version} line has ${count} clauses after its version, separated by "${CLAUSE_SEPARATOR}", and this one has ${clauses.length}`);
    const value = (index, words) => {
        if (!clauses[index].startsWith(words)) throw new Refusal(`clause ${index + 1} of a v${version} line is "${clauses[index]}", and it is "${words}" and its value`);
        return clauses[index].slice(words.length);
    };
    const whole = (index, words, low, high) => {
        const text = value(index, words);
        try {
            return wholeIn(text, low, high);
        } catch (err) {
            if (!(err instanceof Refusal)) throw err;
            throw new Refusal(`clause ${index + 1}, "${clauses[index]}": ${err.message}`);
        }
    };
    const terms = {
        version,
        chain: whole(0, 'chain ', 1n, MAX_UINT64),
        sn: whole(1, 'sn ', 1n, 2n ** 16n - 1n),
        no: whole(2, 'no ', 1n, CTF_POOL_BASE - 1n),
        from: whole(3, 'from epoch ', 0n, MAX_UINT64),
    };
    const want = [`chain ${terms.chain}`, `sn ${terms.sn}`, `no ${terms.no}`, `from epoch ${terms.from}`];
    if (version === 1) {
        want.push(...EXTENDER_CLAUSES);
    } else {
        const carry = value(6, 'carry ');
        if (!ADDRESS.test(carry)) throw new Refusal(`clause 7, "${clauses[6]}": the carry contract is 0x and 40 hex digits`);
        if (BigInt(carry) === 0n) throw new Refusal('the carry contract is the zero address');
        want.push('capture the flag', `ctf pool ${CTF_POOL_BASE + terms.no}`, `carry ${carry}`, ...CTF_CLAUSES);
    }
    want.forEach((clause, index) => {
        if (clauses[index] !== clause) throw new Refusal(`clause ${index + 1} of a v${version} line is "${clauses[index]}", and it must be "${clause}"`);
    });
    return terms;
}

const describe = (terms) => `the v${terms.version} entry from epoch ${terms.from} for no ${terms.no}`;

/**
 * What keeps a signature out of the one form readers take, a hardware wallet's
 * r ‖ s ‖ v with v 27 or 28 and s in the lower half of the curve order, or null.
 */
function signatureProblem(signature) {
    if (!SIGNATURE.test(signature)) return 'is not 0x and 65 bytes of lowercase hex';
    const r = BigInt(`0x${signature.slice(2, 66)}`);
    const s = BigInt(`0x${signature.slice(66, 130)}`);
    const v = Number.parseInt(signature.slice(130), 16);
    if (v !== 27 && v !== 28) return `has recovery byte ${v}, not 27 or 28`;
    if (r < 1n || r >= SECP256K1_N || s < 1n || s > SECP256K1_N >> 1n) return 'has r or s out of range, or s in the upper half of the curve order';
    return null;
}

/**
 * The order readers require of a file (amendment.checkOrder): no entry takes effect
 * before one listed ahead of it, and the entries of one kind for one operator take
 * effect at increasing epochs.
 */
function checkOrder(entries, problems) {
    let newest = 0n;
    const latest = new Map();
    for (const { terms, at } of entries) {
        if (terms.from < newest) {
            problems.push(`line ${at}: ${describe(terms)} takes effect before an entry listed ahead of it, from epoch ${newest}: a file lists its entries in the order they take effect`);
        }
        if (terms.from > newest) newest = terms.from;
        const series = `${terms.version} ${terms.no}`;
        if (latest.has(series) && terms.from <= latest.get(series)) {
            problems.push(`line ${at}: ${describe(terms)} is not after the entry of its kind for its operator from epoch ${latest.get(series)}`);
        }
        latest.set(series, terms.from);
    }
}

/**
 * Readers take a new file only if it keeps every entry of the last one, unchanged
 * and in its place, and adds only later ones (amendment.Extends): a file that drops
 * or changes an entry is a rollback, and one that puts an entry before those could
 * change epochs they have already decided.
 */
function checkKeeps(file, previous, problems) {
    let last;
    try {
        last = readFile(previous);
    } catch (err) {
        if (!(err instanceof Refusal)) throw err;
        problems.push(`the last published file cannot be read: ${err.message}`);
        return;
    }
    last.entries.forEach((entry, i) => {
        let name = `"${entry.line}"`;
        try {
            name = describe(readLine(entry.line));
        } catch (err) {
            if (!(err instanceof Refusal)) throw err;
        }
        const kept = file.entries[i];
        if (!kept) problems.push(`${name}, entry ${i + 1}, is already published, and this file drops it`);
        else if (kept.line !== entry.line || kept.signature !== entry.signature) problems.push(`${name}, entry ${i + 1}, is already published, and this file changes it or puts another entry in its place`);
    });
}

/**
 * The file's entries, as { line, signature } in file order. It throws on a file the
 * gate refuses to read, so ask checkAmendments first.
 */
export function amendmentEntries(text) {
    return readFile(text).entries.map(({ line, signature }) => ({ line, signature }));
}

/**
 * What is wrong with this file, as a list of reasons to refuse it; empty when it may
 * be published. `previous` is the text of the file published last, if any.
 */
export function checkAmendments(text, { previous } = {}) {
    if (Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES) return [`larger than ${MAX_FILE_BYTES} bytes`];
    if (text.includes('�')) return ['not valid UTF-8'];
    let file;
    try {
        file = readFile(text);
    } catch (err) {
        if (!(err instanceof Refusal)) throw err;
        return [err.message];
    }

    const problems = [];
    if (file.sn !== PUBLISHED_SN) problems.push(`sn is ${file.sn}, and this site publishes the amendments of sn ${PUBLISHED_SN}`);
    const read = [];
    for (const entry of file.entries) {
        try {
            const terms = readLine(entry.line);
            if (String(terms.chain) !== PUBLISHED_CHAIN || String(terms.sn) !== PUBLISHED_SN) {
                problems.push(`line ${entry.at}: ${describe(terms)} is for chain ${terms.chain} sn ${terms.sn}, and this site publishes the amendments of chain ${PUBLISHED_CHAIN} sn ${PUBLISHED_SN}`);
            }
            read.push({ terms, at: entry.at });
        } catch (err) {
            if (!(err instanceof Refusal)) throw err;
            problems.push(`line ${entry.at}: ${err.message}`);
        }
        const signature = signatureProblem(entry.signature);
        if (signature) problems.push(`line ${entry.signatureAt}: the signature ${signature}`);
    }
    if (read.length === file.entries.length) checkOrder(read, problems);
    if (previous !== undefined) checkKeeps(file, previous, problems);
    return problems;
}
