// /reserve, section 04 and the page's end: how a program goes live, the reserve's
// custody (its account and signers), the links out, and the fine print on how the
// figures are made (react/src/components/pages/Reserve.jsx). The steps, the
// custody notes, the threshold and the signers' labels are derived from
// react/src/data/reserve.js, which stays their source.
//
// Placeholders: {block}, {registered} are block numbers; {time} a date and time in
// UTC; {share}, {ownerShare}, {min} percentages; {emission}, {minerAllocation}
// numbers of α a day; {date} the launch day; {tao} and {price} amounts of TAO;
// {coldkey} a shortened address; {threshold} the threshold ("2 of 3"); {count} a
// number of keys. In the fine print, {rpcHosts}, {archiveHosts}, {priceHosts} are
// lists of host names and {account} the account's hex id; {price} in
// valuation.usd is a USD price and {source} one of the price sources of the hero
// (../en.js, price.sources), after "from". Not translated: UR, SN25, TAO, α, USD,
// UID, Bittensor, Taostats, GitHub, CoinGecko, GeckoTerminal, RPC.
import { reserve } from '../../../../data/reserve.js';

export default {
    process: {
        // the section's number and name, shown in capitals
        kicker: '04 / How a program goes live',
        title: 'Published first, paid last.',
        // the steps in order, numbered by the page: each a title and a line
        steps: reserve.steps.map((step) => ({ title: step.title, detail: step.detail })),
    },

    custody: {
        // the heading, shown in capitals
        heading: 'Custody',
        // how many signatures of how many signers move the reserve: {threshold} below
        threshold: reserve.custody.threshold,
        // the account card: its label (shown in capitals) and its status pill (shown in capitals, short)
        accountLabel: 'Reserve account · {threshold} multisig',
        onChain: 'On chain',
        awaitingFunds: 'Awaiting funds',
        modeNote: reserve.custody.modeNote,
        // follows modeNote once the chain answers: {tao} the account's free TAO
        holds: 'It holds {tao} TAO free at block {block}.',
        // the hotkeys the reserve is paid through: a label (shown in capitals), then one line each
        // ("5FHneW…94ty UID 7 · registered at block 6,401,234"), or notRegistered
        recipients: 'Recipient hotkeys',
        notRegistered: 'Not yet registered',
        registeredAt: 'registered at block {block}',
        // the signers card: its label (shown in capitals) and each signer's label (shown in capitals)
        signersLabel: 'Signers · {threshold}',
        signers: reserve.custody.signers.map((signer) => ({ label: signer.label })),
        // the card's text: thresholdNote, then whether the signers' keys derive the reserve account
        // (the page checks; {count} keys at {threshold}, a number), then identities
        thresholdNote: reserve.custody.thresholdNote,
        derives: {
            one: 'This {count} key at threshold {threshold} derives the reserve account above.',
            other: 'These {count} keys at threshold {threshold} derive the reserve account above.',
        },
        notDerived: 'These keys do not derive the reserve account above: check the published signers.',
        identities: 'Identities are not published.',
    },

    // the links at the end of the section (each followed by an arrow, not part of the text)
    ctas: {
        // the button to the UR team's Telegram
        talk: 'Talk to UR team',
        // to the miner guide, /docs/miner
        guide: 'Read the miner guide',
        // to the emission policy in the sn repository on GitHub
        policy: 'Emission policy on GitHub',
    },

    // the fine print: paragraphs that each start with a label in bold
    fine: {
        // not shown: the accessible name of the fine print's section
        aria: 'Methodology',
        mechanism: {
            label: 'Mechanism.',
            // {emission}: α emitted a day; {minerAllocation}: α a day to the miners; {date}: the launch
            // day; {min}: the least share the page counts as momentum (0.1%)
            body: "SN25 emits {emission} α a day: {ownerShare} to the subnet owner and the rest split evenly between validators and miners, so the miner allocation is {minerAllocation} α a day. From {date}, momentum, the share used now to power the network, goes to providers as rewards. The reserve's recipient hotkeys receive the rest, miner emissions × (1 − momentum), so the reserve's share is not fixed. It falls as momentum grows. The page keeps momentum at its launch value until the chain shows one of at least {min}, then follows the chain.",
        },
        // before the reserve has been paid: label before the launch day, and once it has passed
        beforeLaunch: {
            label: 'Before launch.',
            labelOverdue: 'Before the first receipt.',
            // {block} ({time}): the block read; {share}: the share of the miner allocation burned;
            // by where the projection's momentum comes from
            body: {
                onChain: 'At finalized block {block} ({time}) {share} of the miner allocation was directed to the subnet owner hotkey and burned by the chain, and the reserve account held nothing. The projection holds momentum at its value on chain now and assumes no program payments.',
                launch: 'At finalized block {block} ({time}) {share} of the miner allocation was directed to the subnet owner hotkey and burned by the chain, and the reserve account held nothing. The projection holds momentum at its launch value and assumes no program payments.',
            },
        },
        // once the reserve is paid: held, then one of flows (by where momentum comes from, and
        // whether the block of the recipients' first registration, {registered}, is known)
        balance: {
            label: 'Balance.',
            held: 'The reserve is α staked on SN25 under its recipient hotkeys, owned by coldkey {coldkey}, read from finalized chain state (block {block}, {time}); any free TAO is shown separately.',
            flows: {
                onChain: "Receipts and payments are the rises and falls between daily samples, from the recipients' registration at block {registered}; the projection continues from the latest balance at momentum's on-chain value and assumes no program payments.",
                launch: "Receipts and payments are the rises and falls between daily samples, from the recipients' registration at block {registered}; the projection continues from the latest balance at momentum's launch value and assumes no program payments.",
                onChainNoBlock: "Receipts and payments are the rises and falls between daily samples, from the recipients' registration; the projection continues from the latest balance at momentum's on-chain value and assumes no program payments.",
                launchNoBlock: "Receipts and payments are the rises and falls between daily samples, from the recipients' registration; the projection continues from the latest balance at momentum's launch value and assumes no program payments.",
            },
        },
        // once the chain gives a price: tao ({price}: TAO per α), then one of usd, noPrice, inAlpha
        valuation: {
            label: 'Valuation.',
            tao: "TAO figures are a spot mark, not a realisable value: α at {price} TAO, the SN25 pool's ratio of TAO in to α in at this block.",
            usd: 'USD figures are α times the live α price, {price} from {source} at {time}: a spot mark too.',
            noPrice: 'No α price has been read yet, so no USD figure is shown.',
            inAlpha: 'No USD figure is shown while the display unit is α.',
        },
        sources: {
            label: 'Sources.',
            body: "The chain figures are read by your browser from Bittensor mainnet through its public RPC endpoints ({rpcHosts}; {archiveHosts} for history), so those hosts see the request. With USD selected, the α price is read from the network operators' stats feeds or CoinGecko's GeckoTerminal feed ({priceHosts}). Nothing else is contacted. Account {account}.",
        },
    },
};
