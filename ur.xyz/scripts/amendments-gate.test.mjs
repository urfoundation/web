// The publish gate (scripts/amendments-gate.mjs) and the sync that applies it
// (scripts/sync-amendments.mjs), run for real against a copy of the site's
// amendments files. A stand-in for `go` plays the sn repo's amendment tool, so no
// key signs anything there: those signatures are not signatures, and only their
// form is read. The last tests build sn's own tool from the sn checkout, as the
// sync does, and hold the tracked file, and copies signed by a key generated for
// the test, to it.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAmendments } from './amendments-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACKED = fs.readFileSync(path.join(ROOT, 'amendments/amendments.yml'), 'utf8');
// The file sn published first, byte for byte: no signed entry yet. The tracked file
// moves on with each signed entry, and the cases below must not move with it.
const LAUNCH = `sn: 25
# Settlement amendments: changes to how SN25 settles from an epoch on, for one
# network operator, made without a new policy hash.
#
# Each entry is one line of plain text that names its chain, subnet, operator
# and first epoch and every term it binds, signed by the owner's key that signs
# price.yml. Only signed entries count, and a signed entry is permanent. An
# entry applies from its first epoch until a later entry of the same kind for
# the same operator takes effect. Version 1 is the extender pool (WHITEPAPER.md
# section 8.6), version 2 capture the flag (CAPTURETHEFLAG.md).
`;

// EIP-55's own example, in its checksum form.
const CARRY = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const v1 = (from = 8, { chain = 964, sn = 25, no = 1 } = {}) =>
    `UR settlement amendment v1: chain ${chain}, sn ${sn}, no ${no}, from epoch ${from}, intra-platform and intra-network extenders, units egress prefix, free and paid, zeta 1`;
const v2 = (from = 8, { chain = 964, sn = 25, no = 1, pool = 2 ** 32 + no, carry = CARRY } = {}) =>
    `UR settlement amendment v2: chain ${chain}, sn ${sn}, no ${no}, from epoch ${from}, capture the flag, ctf pool ${pool}, carry ${carry}, shares pool 4/10 ctf 1/10 head 5/10, head cedes to pool, slots 5 providers 5 extenders, countries iso 3166-1 249, presence half epoch, units egress prefix, draw drand quicknet 60s after census`;
// A signature in the one form readers take, r ‖ s ‖ v with v 27 and s in the lower
// half of the curve order. It signs nothing.
const SIGNATURE = `0x${'11'.repeat(32)}${'22'.repeat(32)}1b`;
const HALF_ORDER = '7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0';
const entry = (line, { signature = SIGNATURE, indent = '  ' } = {}) =>
    `${indent}- line: "${line}"\n${indent}  signature: "${signature}"\n`;
const signed = (...entries) => `${LAUNCH}signed_amendments:\n${entries.join('')}`;
// Epoch 8's two entries, as the owner signs them during epoch 7.
const SIGNED = signed(entry(v1()), entry(v2()));

const replaced = (text, from, to) => {
    assert.ok(text.includes(from), `no ${from}`);
    return text.replace(from, to);
};

test('the file sn published first passes, and so does the tracked one', () => {
    assert.deepEqual(checkAmendments(LAUNCH), []);
    assert.deepEqual(checkAmendments(TRACKED), []);
    assert.deepEqual(checkAmendments('sn: 25\n'), []);
});

test('a well-made signed file passes', () => {
    assert.deepEqual(checkAmendments(SIGNED), []);
    assert.deepEqual(checkAmendments(`${SIGNED}# a closing note\n`), []);
    assert.deepEqual(checkAmendments(replaced(SIGNED, 'sn: 25', 'sn: 25 # the subnet')), []);
    assert.deepEqual(checkAmendments(replaced(SIGNED, 'signed_amendments:\n', 'signed_amendments:  # in the order they take effect\n  # epoch 8\n')), []);
    assert.deepEqual(checkAmendments(replaced(SIGNED, `"${SIGNATURE}"\n`, `"${SIGNATURE}" # reviewed\n`)), []);
    // The list may sit at the margin, and the entries may come before sn.
    assert.deepEqual(checkAmendments(signed(entry(v1(), { indent: '' }), entry(v2(), { indent: '' }))), []);
    assert.deepEqual(checkAmendments(`signed_amendments:\n${entry(v1())}sn: 25\n`), []);
    // Either kind may follow, for any operator, and a later entry of a kind replaces
    // the one before it from its own epoch.
    assert.deepEqual(checkAmendments(signed(entry(v1()), entry(v2()), entry(v2(8, { no: 2 })), entry(v1(9)), entry(v2(12, { no: 2 })))), []);
    // The other recovery byte, and the largest s readers take.
    assert.deepEqual(checkAmendments(signed(entry(v1(), { signature: `0x${'11'.repeat(32)}${HALF_ORDER}1c` }))), []);
});

// Every way a file can be wrong, each with words its refusal must contain.
const BROKEN = {
    'a wrong sn': [replaced(LAUNCH, 'sn: 25', 'sn: 26'), /sn is 26/],
    'no sn': [replaced(LAUNCH, 'sn: 25\n', ''), /names no sn/],
    'sn with no value': [replaced(LAUNCH, 'sn: 25', 'sn:'), /sn needs a value/],
    'sn in quotes': [replaced(LAUNCH, 'sn: 25', 'sn: "25"'), /sn is "25"/],
    'sn spelt another way': [replaced(LAUNCH, 'sn: 25', 'sn: 0x19'), /sn is 0x19/],
    'a repeated sn': [`${LAUNCH}sn: 25\n`, /repeated field sn/],
    'an unknown field': [`${LAUNCH}notes: hello\n`, /unexpected field notes/],
    'a misspelt list': [replaced(SIGNED, 'signed_amendments:', 'signed_amendment:'), /unexpected field signed_amendment\b/],
    'a repeated list': [`${SIGNED}signed_amendments:\n${entry(v1(9))}`, /repeated field signed_amendments/],
    'an empty list': [`${LAUNCH}signed_amendments:\n`, /needs entries, or leave it out/],
    'a flow list': [`${LAUNCH}signed_amendments: []\n`, /block style/],
    'an unsigned entry': [replaced(SIGNED, `    signature: "${SIGNATURE}"\n  - line: "${v2()}"`, `  - line: "${v2()}"`), /line 12: the entry has no signature/],
    'an unsigned last entry': [signed(entry(v1()), `  - line: "${v2()}"\n`), /line 14: the entry has no signature/],
    'an empty signature': [signed(entry(v1(), { signature: '' })), /the signature is not 0x and 65 bytes of lowercase hex/],
    'a short signature': [signed(entry(v1(), { signature: '0x00' })), /the signature is not 0x and 65 bytes/],
    'a signature in capitals': [signed(entry(v1(), { signature: `0x${SIGNATURE.slice(2).toUpperCase()}` })), /lowercase hex/],
    'a signature with no 0x': [signed(entry(v1(), { signature: SIGNATURE.slice(2) })), /the signature is not 0x/],
    'an unquoted signature': [replaced(SIGNED, `signature: "${SIGNATURE}"\n  - line`, `signature: ${SIGNATURE}\n  - line`), /a signature is written in double quotes/],
    'recovery byte 0': [signed(entry(v1(), { signature: SIGNATURE.replace(/1b$/, '00') })), /recovery byte 0, not 27 or 28/],
    's in the upper half': [signed(entry(v1(), { signature: `0x${'11'.repeat(32)}${HALF_ORDER.replace(/0$/, '1')}1b` })), /s in the upper half/],
    'r of zero': [signed(entry(v1(), { signature: `0x${'00'.repeat(32)}${'22'.repeat(32)}1b` })), /r or s out of range/],
    'a repeated signature': [replaced(SIGNED, `"${SIGNATURE}"\n`, `"${SIGNATURE}"\n    signature: "${SIGNATURE}"\n`), /repeated field signature/],
    'a misaligned signature': [replaced(SIGNED, '\n    signature', '\n     signature'), /inconsistent indentation/],
    'entries at two indents': [signed(entry(v1()), entry(v2(), { indent: '    ' })), /inconsistent indentation/],
    'a signature ahead of its line': [signed(`  - signature: "${SIGNATURE}"\n    line: "${v1()}"\n`), /an entry starts "- line:"/],
    'a line in single quotes': [replaced(SIGNED, `line: "${v1()}"`, `line: '${v1()}'`), /an entry starts "- line:", with its line in double quotes/],
    'an unquoted line': [replaced(SIGNED, `line: "${v1()}"`, `line: ${v1()}`), /an entry starts "- line:"/],
    'a line with an escape': [replaced(SIGNED, 'line: "UR settlement', 'line: "\\x55R settlement'), /exactly as signed/],
    'a line over two lines': [replaced(SIGNED, ', units egress prefix, free', ',\n      units egress prefix, free'), /on one line/],
    'an entry with another field': [replaced(SIGNED, `"${SIGNATURE}"\n  - line`, `"${SIGNATURE}"\n    note: reviewed\n  - line`), /unexpected field note in the entry at line 12/],
    'a mapping for a list': [`${LAUNCH}signed_amendments:\n  line: "${v1()}"\n  signature: "${SIGNATURE}"\n`, /unexpected field line in signed_amendments/],
    'a line that is no amendment': [signed(entry('hello')), /a line starts "UR settlement amendment vN: "/],
    'an unknown version': [signed(entry(v1().replace(' v1:', ' v3:'))), /version 3 is not a line format readers read/],
    'a version with a leading zero': [signed(entry(v1().replace(' v1:', ' v01:'))), /version 01 is not a line format/],
    'a changed term': [signed(entry(v1().replace('zeta 1', 'zeta 2'))), /clause 8 of a v1 line is "zeta 2", and it must be "zeta 1"/],
    'a changed share': [signed(entry(v2().replace('ctf 1/10', 'ctf 2/10'))), /clause 8 of a v2 line is "shares pool 4\/10 ctf 2\/10 head 5\/10"/],
    'a dropped clause': [signed(entry(v1().replace(', free and paid', ''))), /a v1 line has 8 clauses after its version, separated by ", ", and this one has 7/],
    'a doubled clause': [signed(entry(v2().replace(', head cedes to pool', ', head cedes to pool, head cedes to pool'))), /a v2 line has 14 clauses .* this one has 15/],
    'clauses swapped': [signed(entry(v1().replace('free and paid, zeta 1', 'zeta 1, free and paid'))), /clause 7 of a v1 line is "zeta 1", and it must be "free and paid"/],
    'a doubled space': [signed(entry(v1().replace('from epoch 8', 'from epoch  8'))), /clause 4, "from epoch {2}8": " 8" is not a plain whole number/],
    'another chain': [signed(entry(v1(8, { chain: 945 }))), /the v1 entry from epoch 8 for no 1 is for chain 945 sn 25/],
    'another sn in a line': [signed(entry(v1(8, { sn: 26 }))), /is for chain 964 sn 26/],
    'operator 0': [signed(entry(v1(8, { no: 0 }))), /clause 3, "no 0": 0 is not 1 to 4294967295/],
    'an operator id past 2^32 - 1': [signed(entry(v1(8, { no: 2 ** 32 }))), /4294967296 is not 1 to 4294967295/],
    'another ctf pool': [signed(entry(v2(8, { pool: 4294967298 }))), /clause 6 of a v2 line is "ctf pool 4294967298", and it must be "ctf pool 4294967297"/],
    'a short carry': [signed(entry(v2(8, { carry: CARRY.slice(0, -1) }))), /the carry contract is 0x and 40 hex digits/],
    'the zero carry': [signed(entry(v2(8, { carry: `0x${'0'.repeat(40)}` }))), /the carry contract is the zero address/],
    'an epoch with a leading zero': [signed(entry(v1('08'))), /"08" is not a plain whole number/],
    'an epoch spelt in hex': [signed(entry(v1('0x8'))), /"0x8" is not a plain whole number/],
    'an epoch past a uint64': [signed(entry(v1('18446744073709551616'))), /18446744073709551616 is not 0 to 18446744073709551615/],
    'a line that is not ASCII': [signed(entry(v1().replace('intra-platform', 'intra‑platform'))), /printable ASCII/],
    'a line too long': [signed(entry(`${v1()}${' '.repeat(400)}`)), /1 to 512 bytes/],
    'entries out of order': [signed(entry(v1(9)), entry(v2(8))), /the v2 entry from epoch 8 for no 1 takes effect before an entry listed ahead of it, from epoch 9/],
    'a kind not moving on': [signed(entry(v1(8)), entry(v2(8)), entry(v1(8))), /the v1 entry from epoch 8 for no 1 is not after the entry of its kind for its operator from epoch 8/],
    'a tab': [replaced(LAUNCH, 'sn: 25', 'sn:\t25'), /tab/],
    'carriage returns': [LAUNCH.replaceAll('\n', '\r\n'), /carriage return/],
    'a document marker': [`---\n${LAUNCH}`, /only the entries under signed_amendments are indented or start with "-": ---/],
    'two documents': [`${LAUNCH}---\n${LAUNCH}`, /start with "-": ---/],
    'a stray line': [`${LAUNCH}stray\n`, /not a "key: value" line/],
    'a line indented under sn': [replaced(LAUNCH, 'sn: 25\n', 'sn: 25\n  more: 1\n'), /only the entries under signed_amendments are indented/],
    'an error page': ['<!doctype html>\n<html>not a file</html>\n', /not a "key: value" line/],
    'an empty file': ['', /names no sn/],
    'broken UTF-8': [`${LAUNCH}# �\n`, /UTF-8/],
    'too large': [`${LAUNCH}#${' '.repeat(256 << 10)}\n`, /larger than/],
};

test('a broken file is refused', async (t) => {
    for (const [name, [text, reason]] of Object.entries(BROKEN)) {
        await t.test(name, () => {
            const problems = checkAmendments(text);
            assert.ok(problems.some(problem => reason.test(problem)), `refused for: ${problems.join('; ') || 'nothing'}`);
        });
    }
});

test('a signed entry is permanent', () => {
    const one = signed(entry(v1()));
    assert.deepEqual(checkAmendments(SIGNED, { previous: one }), []);
    assert.deepEqual(checkAmendments(SIGNED, { previous: SIGNED }), []);
    assert.deepEqual(checkAmendments(SIGNED, { previous: LAUNCH }), []);
    // Comments may change. Entries may not.
    assert.deepEqual(checkAmendments(`${SIGNED}# a note\n`, { previous: SIGNED }), []);
    const refused = (text) => checkAmendments(text, { previous: SIGNED }).join('; ');
    assert.match(refused(one), /the v2 entry from epoch 8 for no 1, entry 2, is already published, and this file drops it/);
    assert.match(refused(LAUNCH), /the v1 entry from epoch 8 for no 1, entry 1, is already published, and this file drops it/);
    assert.match(refused(signed(entry(v1()), entry(v2(), { signature: `0x${'11'.repeat(32)}${'33'.repeat(32)}1b` }))), /the v2 entry from epoch 8 for no 1, entry 2, is already published, and this file changes it/);
    // A line rewritten under its signature, to a later epoch or another carry.
    assert.match(refused(signed(entry(v1()), entry(v2(9)))), /the v2 entry from epoch 8 for no 1, entry 2, is already published, and this file changes it/);
    assert.match(refused(signed(entry(v1()), entry(v2(8, { carry: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359' })))), /entry 2, is already published, and this file changes it/);
    // Entries in another order, or one put ahead of them, which could change epochs
    // readers have already decided.
    assert.match(refused(signed(entry(v2()), entry(v1()))), /the v1 entry from epoch 8 for no 1, entry 1, is already published, and this file changes it or puts another entry in its place/);
    assert.match(refused(signed(entry(v2(8, { no: 2 })), entry(v1()), entry(v2()))), /entry 1, is already published, and this file changes it or puts another entry in its place/);
    assert.match(checkAmendments(SIGNED, { previous: 'not: [a file' }).join('; '), /last published file cannot be read/);
});

// ── the sync, in a copy of the site laid out as the monoroot is ───────────────

const SITE_CODE = ['scripts/sync-amendments.mjs', 'scripts/amendments-gate.mjs'];
const PUBLISHED = ['amendments/amendments.yml', 'astro/public/amendments.yml', 'react/public/amendments.yml'];

function copyFiles(site, files) {
    for (const file of files) {
        fs.mkdirSync(path.dirname(path.join(site, file)), { recursive: true });
        fs.copyFileSync(path.join(ROOT, file), path.join(site, file));
    }
}

function emptySite(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amendments-gate-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const site = path.join(root, 'web/ur.xyz');
    copyFiles(site, SITE_CODE);
    return { root, site, sn: path.join(root, 'sn') };
}

/** The site's code with the amendments files as they are tracked now, whatever they hold. */
function trackedSite(t) {
    const context = emptySite(t);
    copyFiles(context.site, PUBLISHED);
    return context;
}

/** The site's code with only the launch file published, as a sync leaves it. */
function launchSite(t) {
    const context = emptySite(t);
    fs.mkdirSync(path.join(context.site, 'amendments'), { recursive: true });
    fs.writeFileSync(path.join(context.site, 'amendments/amendments.yml'), LAUNCH);
    const seeded = sync(context);
    assert.equal(seeded.status, 0, seeded.stderr);
    return context;
}

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
const published = (site) => Object.fromEntries(PUBLISHED.map(file => [file, read(site, file)]));

/** An sn checkout with this amendments.yml, and a `go` that builds a stand-in amendment tool. */
function checkout(context, text, { tool = true } = {}) {
    fs.mkdirSync(context.sn, { recursive: true });
    fs.writeFileSync(path.join(context.sn, 'amendments.yml'), text);
    if (tool) fs.mkdirSync(path.join(context.sn, 'cli/amendment'), { recursive: true });
}

const STAND_IN = `#!/bin/sh
# go build -o <tool> ./cli/amendment
[ "$1 $2 $4" = "build -o ./cli/amendment" ] || { echo "go: unexpected arguments: $*" >&2; exit 2; }
[ -z "$STAND_IN_DOES_NOT_BUILD" ] || { echo "it does not compile" >&2; exit 1; }
# sn's own tool, once a test has built it
if [ -n "$STAND_IN_TOOL" ]; then cp "$STAND_IN_TOOL" "$3"; exit; fi
cat > "$3" <<'TOOL'
#!/bin/sh
[ "$1 $3" = "verify --chain=964" ] || { echo "amendment: unexpected arguments: $*" >&2; exit 2; }
cp "\${2#--in=}" "$STAND_IN_SAW"
[ -z "$STAND_IN_REFUSES" ] || { echo "amendment: the v2 entry from epoch 8 for no 1 is signed by someone else" >&2; exit 1; }
echo "verified"
TOOL
chmod +x "$3"
`;

function sync(context, args = [], env = {}) {
    const bin = path.join(context.root, 'bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'go'), STAND_IN, { mode: 0o755 });
    const { SN_DIR, ...inherited } = process.env; // the script's default must find the checkout
    return spawnSync(process.execPath, [path.join(context.site, 'scripts/sync-amendments.mjs'), ...args], {
        encoding: 'utf8',
        env: { ...inherited, PATH: `${bin}${path.delimiter}${process.env.PATH}`, STAND_IN_SAW: path.join(context.root, 'saw.yml'), ...env },
    });
}

test('syncing the tracked file changes nothing', (t) => {
    const context = trackedSite(t);
    const before = published(context.site);
    checkout(context, TRACKED);
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /no change to the amendments/);
    assert.match(run.stdout, /amendment verify passed/);
    assert.deepEqual(published(context.site), before);
    assert.equal(read(context.root, 'saw.yml'), TRACKED);
    // With no tool to ask, or no checkout at all, what was published last still goes through.
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const noTool = sync(context);
    assert.equal(noTool.status, 0, noTool.stderr);
    assert.match(noTool.stdout, /signatures not checked/);
    fs.rmSync(context.sn, { recursive: true });
    const noCheckout = sync(context);
    assert.equal(noCheckout.status, 0, noCheckout.stderr);
    assert.match(noCheckout.stdout, /keeping checked-in/);
    assert.deepEqual(published(context.site), before);
});

test("every copy is sn's file, byte for byte", (t) => {
    // The first sync, into a site with no copy yet. A file with no entries has no
    // signature to check, so it needs no tool.
    const context = emptySite(t);
    const exact = `${LAUNCH}# § 2.4: capture the flag's split, from its first epoch  \n#`;
    checkout(context, exact, { tool: false });
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /amendments changed: 0 signed entries/);
    for (const file of PUBLISHED) {
        assert.ok(fs.readFileSync(path.join(context.site, file)).equals(Buffer.from(exact)), file);
    }
});

test('a broken file stops the sync before it writes anything', (t) => {
    const context = launchSite(t);
    const before = published(context.site);
    for (const name of ['a wrong sn', 'an unsigned entry', 'a misspelt list', 'an unknown version', 'a changed term', 'another chain', 's in the upper half', 'entries out of order']) {
        checkout(context, BROKEN[name][0]);
        const run = sync(context);
        assert.equal(run.status, 1, name);
        assert.match(run.stderr, /not publishing/, name);
        assert.match(run.stderr, BROKEN[name][1], name);
        assert.deepEqual(published(context.site), before, name);
    }
});

test('a signed entry is published through the gate and the tool', (t) => {
    const context = launchSite(t);
    const before = published(context.site);

    // The tool refuses, or there is no tool to ask: nothing moves.
    checkout(context, SIGNED);
    const refused = sync(context, [], { STAND_IN_REFUSES: '1' });
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /amendment verify: amendment: the v2 entry from epoch 8 for no 1 is signed by someone else/);
    assert.deepEqual(published(context.site), before);
    const noBuild = sync(context, [], { STAND_IN_DOES_NOT_BUILD: '1' });
    assert.equal(noBuild.status, 1);
    assert.match(noBuild.stderr, /nothing can check them.*it does not compile/s);
    assert.deepEqual(published(context.site), before);
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const noTool = sync(context);
    assert.equal(noTool.status, 1);
    assert.match(noTool.stderr, /nothing can check them.*no cli\/amendment/s);
    assert.deepEqual(published(context.site), before);

    // The tool passes it. It saw the bytes that were published, and every copy is them.
    const first = signed(entry(v1()));
    checkout(context, first);
    const run = sync(context);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /amendments changed: 1 signed entry$/m);
    assert.equal(read(context.root, 'saw.yml'), first);
    for (const file of PUBLISHED) assert.equal(read(context.site, file), first, file);
    // The next entry joins after it.
    checkout(context, SIGNED);
    const next = sync(context);
    assert.equal(next.status, 0, next.stderr);
    assert.match(next.stdout, /amendments changed: 2 signed entries/);
    for (const file of PUBLISHED) assert.equal(read(context.site, file), SIGNED, file);

    // Syncing it again changes nothing, even with no tool to ask: it was verified.
    const published1 = published(context.site);
    const again = sync(context);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /no change to the amendments/);
    assert.deepEqual(published(context.site), published1);
    fs.rmSync(path.join(context.sn, 'cli'), { recursive: true });
    const untooled = sync(context);
    assert.equal(untooled.status, 0, untooled.stderr);
    assert.match(untooled.stdout, /signatures not checked/);
    assert.deepEqual(published(context.site), published1);

    // A checkout that has fallen behind, or a rollback, cannot take an entry back.
    for (const text of [LAUNCH, first, signed(entry(v2()))]) {
        checkout(context, text);
        const rollback = sync(context);
        assert.equal(rollback.status, 1);
        assert.match(rollback.stderr, /is already published, and this file (drops|changes) it/);
        assert.deepEqual(published(context.site), published1);
    }
    // And an entry cannot be slipped in ahead of the published ones.
    checkout(context, signed(entry(v2(8, { no: 2 })), entry(v1()), entry(v2())));
    const slipped = sync(context);
    assert.equal(slipped.status, 1);
    assert.match(slipped.stderr, /entry 1, is already published, and this file changes it or puts another entry in its place/);
    assert.deepEqual(published(context.site), published1);
});

test('--check passes what a sync leaves and refuses anything else', (t) => {
    const tracked = trackedSite(t);
    const passesTracked = sync(tracked, ['--check'], { STAND_IN_DOES_NOT_BUILD: '1' });
    assert.equal(passesTracked.status, 0, passesTracked.stderr);

    const context = launchSite(t);
    const before = published(context.site);
    const check = () => sync(context, ['--check'], { STAND_IN_DOES_NOT_BUILD: '1' });
    const passes = check();
    assert.equal(passes.status, 0, passes.stderr);
    assert.deepEqual(published(context.site), before);
    const write = (file, text) => fs.writeFileSync(path.join(context.site, file), text);
    for (const [file, text, reason] of [
        ['react/public/amendments.yml', `${LAUNCH}# changed\n`, /react\/public\/amendments\.yml is not what a sync would write/],
        ['astro/public/amendments.yml', `${LAUNCH}# changed\n`, /astro\/public\/amendments\.yml is not what a sync would write/],
        ['astro/public/amendments.yml', LAUNCH.trimEnd(), /astro\/public\/amendments\.yml is not what a sync would write/],
        ['amendments/amendments.yml', `${LAUNCH}# changed\n`, /react\/public\/amendments\.yml is not what a sync would write/],
        ['amendments/amendments.yml', BROKEN['an unsigned entry'][0], /the entry has no signature/],
    ]) {
        write(file, text);
        const run = check();
        assert.equal(run.status, 1, file);
        assert.match(run.stderr, reason, file);
        assert.match(run.stderr, /run scripts\/sync-amendments\.mjs/, file);
        write(file, before[file]);
    }
    fs.rmSync(path.join(context.site, 'react/public/amendments.yml'));
    const missing = check();
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /react\/public\/amendments\.yml is not what a sync would write/);
    write('react/public/amendments.yml', before['react/public/amendments.yml']);
    assert.equal(check().status, 0);
    assert.deepEqual(published(context.site), before);
});

// ── sn's own amendment tool ──────────────────────────────────────────────────

// The checkout the sync builds the tool from, found the same way.
const SN_DIR = process.env.SN_DIR || path.resolve(ROOT, '../../sn');
let built = null;
let toolDir = null;
after(() => {
    if (toolDir) fs.rmSync(toolDir, { recursive: true, force: true });
});

/** sn's cli/amendment, built once: { tool }, or { skip } with the reason it cannot be. */
function snTool() {
    if (built) return built;
    if (!fs.existsSync(path.join(SN_DIR, 'cli', 'amendment'))) {
        built = { skip: `no cli/amendment at ${SN_DIR}` };
        return built;
    }
    toolDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amendments-gate-tool-'));
    const tool = path.join(toolDir, 'amendment');
    const build = spawnSync('go', ['build', '-o', tool, './cli/amendment'], { cwd: SN_DIR, encoding: 'utf8' });
    built = build.error || build.status !== 0
        ? { skip: `cli/amendment did not build: ${build.error?.message ?? build.stderr.trim()}` }
        : { tool };
    return built;
}

function verify(t, tool, text) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'amendments-gate-file-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'amendments.yml');
    fs.writeFileSync(file, text);
    return spawnSync(tool, ['verify', `--in=${file}`, '--chain=964'], { encoding: 'utf8' });
}

// Run against the checkout's own amendment package: epoch 8's two entries, signed by
// a key it generates, whose address it prints first. That is not the owner's key, so
// the file is a forgery: well made, and signed by someone else.
const FORGER = String.raw`package main

import (
	"encoding/hex"
	"fmt"

	"github.com/ethereum/go-ethereum/crypto"

	"github.com/urfoundation/sn/amendment"
)

func main() {
	key, err := crypto.GenerateKey()
	if err != nil {
		panic(err)
	}
	carry, err := crypto.GenerateKey()
	if err != nil {
		panic(err)
	}
	fmt.Println(crypto.PubkeyToAddress(key.PublicKey).Hex())
	fmt.Println("signed_amendments:")
	for _, entry := range []*amendment.Entry{
		amendment.NewExtenders(964, 25, 1, 8),
		amendment.NewCaptureTheFlag(964, 25, 1, 8, crypto.PubkeyToAddress(carry.PublicKey)),
	} {
		if err := entry.Sign(key); err != nil {
			panic(err)
		}
		line, err := entry.Line()
		if err != nil {
			panic(err)
		}
		fmt.Printf("  - line: \"%s\"\n    signature: \"0x%s\"\n", line, hex.EncodeToString(entry.Signature))
	}
}
`;

/** The launch file with epoch 8's entries signed by a generated key, and that key's address. */
function forge(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'amendments-gate-forger-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, 'forger.go'), FORGER);
    const run = spawnSync('go', ['run', path.join(dir, 'forger.go')], { cwd: SN_DIR, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const [signer, ...file] = run.stdout.split('\n');
    return { signer, text: `${LAUNCH}${file.join('\n')}` };
}

test("sn's own tool verifies the tracked file and the file with no entries, and the sync publishes them", (t) => {
    const { tool, skip } = snTool();
    if (skip) return t.skip(skip);
    for (const text of [TRACKED, LAUNCH]) {
        const run = verify(t, tool, text);
        assert.equal(run.status, 0, run.stderr);
    }
    assert.match(verify(t, tool, LAUNCH).stdout, /No signed entries/);

    // The sync, with sn's tool where the stand-in's would be.
    const context = trackedSite(t);
    const before = published(context.site);
    checkout(context, TRACKED);
    const run = sync(context, [], { STAND_IN_TOOL: tool });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /amendment verify passed: .*chain 964, sn 25, signer 0x[0-9a-fA-F]{40}/);
    assert.deepEqual(published(context.site), before);
});

test("sn's own tool refuses a forged or unsigned copy, and the sync publishes neither", (t) => {
    const { tool, skip } = snTool();
    if (skip) return t.skip(skip);
    const { signer, text: forged } = forge(t);
    // The gate reads it as well made: only the signatures give it away.
    assert.deepEqual(checkAmendments(forged), []);
    const refused = verify(t, tool, forged);
    assert.equal(refused.status, 1);
    assert.ok(refused.stderr.includes(`signed by ${signer}`), refused.stderr);

    // The same signature in its other form (s in the upper half), one taken off, and
    // one that is no signature at all.
    const order = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    const twin = forged.replace(/signature: "0x([0-9a-f]{64})([0-9a-f]{64})(1b|1c)"/, (_, r, s, v) =>
        `signature: "0x${r}${(order - BigInt(`0x${s}`)).toString(16).padStart(64, '0')}${v === '1b' ? '1c' : '1b'}"`);
    const unsigned = forged.replace(/\n {4}signature: "0x[0-9a-f]{130}"/, '');
    const zeros = forged.replace(/0x[0-9a-f]{130}/, `0x${'0'.repeat(130)}`);
    for (const text of [twin, unsigned, zeros]) {
        assert.notEqual(text, forged);
        assert.notDeepEqual(checkAmendments(text), []);
        assert.equal(verify(t, tool, text).status, 1, text);
    }

    const context = launchSite(t);
    const before = published(context.site);
    for (const text of [forged, twin, unsigned]) {
        checkout(context, text);
        const run = sync(context, [], { STAND_IN_TOOL: tool });
        assert.equal(run.status, 1);
        assert.match(run.stderr, /not publishing/);
        assert.deepEqual(published(context.site), before);
    }
    checkout(context, forged);
    assert.ok(sync(context, [], { STAND_IN_TOOL: tool }).stderr.includes(`signed by ${signer}`));
});
