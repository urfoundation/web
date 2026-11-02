/**
 * Every conviction lock on a subnet (SN25 by default), read from Bittensor
 * mainnet in the browser with the same dependency-free reader as the reserve
 * (subtensor.js). Two JSON-RPC round trips at one finalized block:
 *
 *   1. LockingColdkeys(netuid, hotkey, coldkey): the chain's reverse index of
 *      non-zero locks (state_getKeysPaged), plus the subnet owner hotkey,
 *      UnlockRate, MaturityRate, SubnetAlphaOut, the header and Timestamp.Now.
 *   2. Lock(coldkey, netuid, hotkey) and DecayingLock(coldkey, netuid) for
 *      every pair.
 *
 * Stored locks are rolled forward to the block with the chain's own formula
 * (staking/lock.rs, calculate_decayed_mass_and_conviction): a decaying lock's
 * mass falls as m·e^(−Δt/UnlockRate), a perpetual one keeps its mass, and a
 * lock on the subnet owner hotkey matures instantly. Checked against
 * @polkadot/api typed queries and StakeInfoRuntimeApi_get_coldkey_lock on
 * runtime spec 486 (2026-10-30); see the UR marketing repo's
 * dashboard/mvp-build/chain/CONVICTION-NOTES.md.
 */
import { FINNEY_RPC, NETUID, RAO, blake2b, fromHex, rpc, rpcBatch, ss58Encode, storageKey } from './subtensor.js';

/** UR team multisig (2-of-3), which holds the team's perpetual lock since block 9,210,491. */
export const TEAM_COLDKEY = '5GG1pRKrVYv4EWwRyjmypkn82Rsg9Pt1gwo2QoQHUEP2mKvd';

const UNLOCK_RATE_DEFAULT = 934866; // UnlockRate's metadata default; the chain doesn't set it explicitly
const u16le = (n) => new Uint8Array([n & 255, (n >> 8) & 255]);
const b2c = (bytes) => {
    const out = new Uint8Array(16 + bytes.length);
    out.set(blake2b(bytes, 16));
    out.set(bytes, 16);
    return out;
};
const le = (bytes, from, len) => {
    let n = 0n;
    for (let i = from + len - 1; i >= from; i--) n = (n << 8n) | BigInt(bytes[i]);
    return n;
};
const u64 = (hex) => (hex ? le(fromHex(hex), 0, 8) : null);

/** LockState = { locked_mass: u64, conviction: U64F64, last_update: u64 }, 32 bytes. */
function decodeLockState(hex) {
    if (!hex) return null;
    const b = fromHex(hex);
    const bits = le(b, 8, 16);
    return {
        mass: Number(le(b, 0, 8)),
        conviction: Number(bits >> 64n) + Number(bits & ((1n << 64n) - 1n)) / 2 ** 64,
        lastUpdate: Number(le(b, 24, 8)),
    };
}

const expDecay = (dt, tau) => (dt === 0 ? 1 : tau === 0 ? 0 : Math.exp(Math.max(-dt / tau, -40)));
function rollForward({ mass, conviction, lastUpdate }, block, unlockRate, maturityRate, perpetual, ownerLock) {
    let m = mass, c = conviction;
    if (block > lastUpdate) {
        const dt = block - lastUpdate;
        const ud = expDecay(dt, unlockRate), md = expDecay(dt, maturityRate);
        m = perpetual ? mass : Math.floor(ud * mass);
        let fromMass;
        if (perpetual) fromMass = mass * (1 - md);
        else if (unlockRate === maturityRate) fromMass = mass * (dt / maturityRate) * md;
        else if (unlockRate === 0 || maturityRate === 0) fromMass = 0;
        else { const g = (unlockRate * (ud - md)) / (unlockRate - maturityRate); fromMass = g > 0 ? mass * g : 0; }
        c = md * conviction + fromMass;
    }
    if (ownerLock) c = m;
    if (m < 100 && c < 100) { m = 0; c = 0; }
    return { mass: m, conviction: c };
}

export async function readConviction({ netuid = NETUID, endpoints = FINNEY_RPC, signal } = {}) {
    const hash = await rpc(endpoints, 'chain_getFinalizedHead', [], signal);
    const n = u16le(netuid);
    const lcPrefix = storageKey('SubtensorModule', 'LockingColdkeys', n);
    const [keys, header, ownerHk, unlock, maturity, alphaOut, now] = await rpcBatch(endpoints, [
        ['state_getKeysPaged', [lcPrefix, 1000, lcPrefix, hash]],
        ['chain_getHeader', [hash]],
        ['state_getStorage', [storageKey('SubtensorModule', 'SubnetOwnerHotkey', n), hash]],
        ['state_getStorage', [storageKey('SubtensorModule', 'UnlockRate'), hash]],
        ['state_getStorage', [storageKey('SubtensorModule', 'MaturityRate'), hash]],
        ['state_getStorage', [storageKey('SubtensorModule', 'SubnetAlphaOut', n), hash]],
        ['state_getStorage', [storageKey('Timestamp', 'Now'), hash]],
    ], signal);
    if (!Array.isArray(keys)) throw new Error('conviction: LockingColdkeys unreadable');
    const block = Number(header.number);
    const unlockRate = Number(u64(unlock) ?? BigInt(UNLOCK_RATE_DEFAULT));
    const maturityRate = Number(u64(maturity) ?? 0n);
    const ownerHotkey = ownerHk ? ss58Encode(fromHex(ownerHk)) : null;
    // key layout: prefix 32 | netuid 2 | blake2_128(hotkey) 16 | hotkey 32 | blake2_128(coldkey) 16 | coldkey 32
    const pairs = keys.map((k) => {
        const b = fromHex(k);
        return { hot: b.slice(50, 82), cold: b.slice(98, 130) };
    });
    const vals = pairs.length ? await rpcBatch(endpoints, pairs.flatMap(({ hot, cold }) => [
        ['state_getStorage', [storageKey('SubtensorModule', 'Lock', b2c(cold), n, b2c(hot)), hash]],
        ['state_getStorage', [storageKey('SubtensorModule', 'DecayingLock', b2c(cold), n), hash]],
    ]), signal) : [];
    const locks = pairs.map(({ hot, cold }, i) => {
        const stored = decodeLockState(vals[2 * i]);
        if (!stored) return null;
        const hotkey = ss58Encode(hot), coldkey = ss58Encode(cold);
        const perpetual = vals[2 * i + 1] === '0x00'; // Some(false): perpetual
        const now = rollForward(stored, block, unlockRate, maturityRate, perpetual, hotkey === ownerHotkey);
        return { coldkey, hotkey, perpetual, alpha: now.mass / RAO };
    }).filter((l) => l && l.alpha > 0).sort((a, b) => b.alpha - a.alpha);
    const sum = (ls) => ls.reduce((a, l) => a + l.alpha, 0);
    const total = sum(locks), out = Number(u64(alphaOut) ?? 0n) / RAO;
    return {
        block,
        time: now ? Number(u64(now)) : null,
        total,
        perpetual: sum(locks.filter((l) => l.perpetual)),
        decaying: sum(locks.filter((l) => !l.perpetual)),
        shareOfOut: out ? total / out : null,
        team: TEAM_COLDKEY,
        locks: locks.map(({ coldkey, alpha, perpetual }) => ({ coldkey, alpha, perpetual })),
    };
}
