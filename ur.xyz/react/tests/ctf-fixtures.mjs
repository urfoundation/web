// Answers of GET /sn/ctf (sn/api/operator.yml) for tests/ctf.test.mjs, one per
// phase of capture the flag, built over the snapshot's 249 countries so they
// are complete and follow the document's arithmetic: won = min(5, units), the
// chance to win min(1, 5 / entries), the win estimate a slot and a fifth of
// the pot, available both pots and ten slots, and totals that count the
// countries. The figures are made up (a country's units follow the providers
// the dashboard counted there); only their consistency is real.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/ctf-epoch.json'), 'utf8'));
export const SLOT = 48_025_660; // CAPTURETHEFLAG.md §6, epoch 4's scale
const UNINHABITED = ['aq', 'bv', 'gs', 'hm', 'io', 'tf', 'um'];

export const amount = (rao) => ({ alpha: `${Math.floor(rao / 1e9)}.${String(rao % 1e9).padStart(9, '0')}`, rao });

const base = (epoch, drawAt) => ({
    as_of: '2026-12-04T22:24:12Z',
    unit: { token: 'alpha', symbol: 'α', netuid: 25, decimals: 9 },
    pool: {
        no_id: 1,
        pool_id: 4294967297,
        vault: '0xe4865eb1bebdf5c6a10c9d37f3ccdd59aee8f20c',
        carry_contract: '0x981cfe73af944cc61589cdf6f51ccfac4cbd5f54',
        carry_coldkey: '0x48cb91133081290b45bc8350c49f03041e4a4d948e43419f011e636674a2ce57',
        first_epoch: 8,
        countries_version: 'sha256:437f10be50e9e64024f6dbb668c672c6c3fe9f8caf25123fc661cfe8181cb792',
    },
    current_epoch: { epoch, start_block: 9247228 + (epoch - 1) * 50400, end_block: 9247228 + epoch * 50400 - 1, draw_at: drawAt },
    definitions: { chance_to_win: 'chance', win_estimate: 'estimate', available: 'available', eligibility: 'eligibility' },
    links: { page: 'https://ur.xyz/ctf', chance_to_win: 'https://ur.xyz/ctf#chance-to-win' },
});

/** Epoch 9 in progress, epoch 8 drawn (or, with drawn false, closed without a census, so every slot carried). */
export function drawnAnswer({ drawn = true } = {}) {
    const rows = SNAPSHOT.countries.map((c, i) => {
        const online = c.online || 0;
        const role = (units, carriedSlots, near) => {
            const won = drawn ? Math.min(5, units) : 0;
            const pot = won === 5 ? 0 : (5 - won) * SLOT * carriedSlots;
            return {
                slots: drawn ? { total: 5, won, open: 5 - won } : null,
                units: drawn ? units : null,
                near_misses: drawn ? near : null,
                pot: amount(pot),
                awarded: amount(won * SLOT),
                win_estimate: amount(SLOT + Math.floor(pot / 5)),
                entries: drawn ? units + 1 : null,
                chance_to_win: drawn ? Math.min(1, 5 / (units + 1)) : null,
            };
        };
        const providers = role(online > 0 ? Math.max(1, Math.round(Math.sqrt(online))) : 0, 1 + (i % 7), i % 5 === 0 ? 1 + (i % 3) : 0);
        const extenders = role(online >= 50 ? Math.round(online / 500) : 0, 1 + (i % 4), i % 11 === 0 ? 1 : 0);
        const held = drawn && providers.slots.won === 5 && extenders.slots.won === 5;
        return {
            code: c.code,
            name: c.name,
            sentence_name: c.sentence_name,
            inhabited: !UNINHABITED.includes(c.code),
            flag_held: held,
            open_epochs: providers.awarded.rao + extenders.awarded.rao > 0 ? 0 : 1,
            near_misses: drawn ? providers.near_misses + extenders.near_misses : null,
            available: amount(providers.pot.rao + extenders.pot.rao + 10 * SLOT),
            awarded: amount(providers.awarded.rao + extenders.awarded.rao),
            providers,
            extenders,
        };
    });
    const sum = (f) => rows.reduce((s, r) => s + f(r), 0);
    const won = sum((r) => (drawn ? r.providers.slots.won + r.extenders.slots.won : 0));
    const awarded = sum((r) => r.awarded.rao);
    const carried = sum((r) => r.providers.pot.rao + r.extenders.pot.rao);
    const fresh = SLOT * 2490 + 172;
    return {
        ...base(9, '2026-12-11T18:25:24Z'),
        last_epoch: {
            epoch: 8,
            drawn,
            root: { status: 'pending', seq: 1, root_index: null, epoch: 8, ledger_hash: `sha256:${'ab'.repeat(32)}`, committed_block: 9651000, finalized_block: null },
            amounts: {
                funding: amount(fresh), returned: amount(0), owed: amount(0), matured: true, fresh: amount(fresh), slot: amount(SLOT),
                awarded: amount(awarded), paid: amount(awarded), pending_paid: amount(0), pending_in: amount(0), pending: amount(0),
                carried_in: amount(0), carried: amount(carried),
            },
            slots: { total: 2490, won, open: 2490 - won },
        },
        pending_draw: null,
        totals: {
            countries: 249,
            flags_held: rows.filter((r) => r.flag_held).length,
            not_fully_captured: drawn ? { providers: rows.filter((r) => r.providers.slots.won < 5).length, extenders: rows.filter((r) => r.extenders.slots.won < 5).length } : null,
        },
        countries: rows,
    };
}

/** Epoch 8, the first, in progress (or, with `pending`, ended with its census committed): no root yet. */
export function firstAnswer({ pending = false } = {}) {
    const role = () => ({ slots: null, units: null, near_misses: null, pot: amount(0), awarded: amount(0), win_estimate: null, entries: null, chance_to_win: null });
    return {
        ...base(pending ? 9 : 8, pending ? '2026-12-11T18:25:24Z' : '2026-12-04T18:25:24Z'),
        last_epoch: null,
        pending_draw: pending ? { epoch: 8, census_hash: `sha256:${'cd'.repeat(32)}`, census_block: 9650612, round: 34535980 } : null,
        totals: { countries: 249, flags_held: 0, not_fully_captured: null },
        countries: SNAPSHOT.countries.map((c) => ({
            code: c.code,
            name: c.name,
            sentence_name: c.sentence_name,
            inhabited: !UNINHABITED.includes(c.code),
            flag_held: false,
            open_epochs: 0,
            near_misses: null,
            available: null,
            awarded: amount(0),
            providers: role(),
            extenders: role(),
        })),
    };
}
