// /reserve, the Network Capacity Reserve: the page's head and its hero, from the
// title to the line saying where the figures can be checked
// (react/src/components/pages/Reserve.jsx and reserve/Denom.jsx,
// astro/src/components/routes/ReserveRoute.astro). The page's other sections are
// the units balance/ (01: the charts and the emission splits), programs/ (02 and
// 03) and custody/ (04, custody, the links and the fine print).
//
// The reserve's name and tagline are derived from react/src/data/reserve.js,
// which stays their source. Placeholders are filled by the page: {amount},
// {received}, {spent} and {price} with formatted figures in α or USD ("2,657",
// "80.9K α", "$1.97"), {block} with a block number, {share} and {min} with a
// percentage, {time} with a date and time in UTC. Not translated: UR, SN25, TAO,
// α, USD, Bittensor, Taostats, CoinGecko, GeckoTerminal, addresses. "momentum"
// is a defined term: the share of the miner emissions paid to providers now;
// the reserve receives the rest, "miner emissions × (1 − momentum)".
import { reserve } from '../../../data/reserve.js';

export default {
    meta: {
        // the page's <title>: at most 60 characters
        title: `${reserve.name} | UR`,
        // the meta description: at most 175 characters
        description: `${reserve.tagline.replace(/\.$/, '')}: the SN25 miner emissions momentum leaves, paying providers for verified network capacity. Read live from Bittensor.`,
        // the page's name in the breadcrumb trail
        breadcrumb: reserve.name,
    },

    hero: {
        // small label above the title, shown in capitals
        eyebrow: 'SN25 · Miner emissions',
        // the page's h1: the reserve's name
        name: reserve.name,
        // the line under the title
        tagline: reserve.tagline,
        lede: "SN25's miner emissions are split two ways: momentum, paid to providers now, and the reserve, which receives the rest. The reserve pays providers for verified network capacity: more coverage, more reliable routes, and capacity for new Network Operators.",
    },

    // an amount per day: {amount} is a number of α ("2,657 α a day"); used across the page
    perDay: '{amount} α a day',

    formula: {
        // label of the panel, shown in capitals
        label: 'Formula',
        // the equation's three terms, which the page sets as
        // "Reserve = miner emissions × (1 − momentum)" (the signs are not text)
        reserve: 'Reserve',
        minerEmissions: 'miner emissions',
        momentum: 'momentum',
        // the label of the worked line under the equation
        // ("At launch: 2,657 α a day = 2,952 α a day × (1 − momentum)"): where momentum's value comes from
        atLaunch: 'At launch:',
        atBlock: 'At block {block}:',
        atCurrent: 'At the current momentum:',
        // added inside the worked line's "(1 − momentum)" while the chain burns a share of the
        // miner allocation: "(1 − momentum − 5% burned)"
        burned: '{share} burned',
        // the definition under the worked line; {term} is the defined word, set apart (term below)
        definition: '{term} is the share of the miner emissions used now to power the network, as rewards to providers. The reserve is not a fixed share. It receives whatever momentum does not use, so it receives less as momentum grows.',
        term: 'Momentum',
        // follows the definition while the reserve is paid but the chain pays no momentum yet;
        // {min} is the least share the page counts as momentum (0.1%)
        noMomentumYet: "The chain shows no momentum yet: at block {block} the reserve's recipients receive the remainder of the miner allocation, and the page follows the chain's momentum once it is at least {min}.",
    },

    wallet: {
        // label of the panel, shown in capitals
        label: 'Reserve wallet',
        // the copy button's caption, and the caption once the address is copied; both short
        // (the button keeps one width for the two)
        copy: 'Copy',
        copied: 'Copied',
        // not shown: what a screen reader hears after the caption ("Copy the wallet address")
        copyTarget: 'the wallet address',
        // not shown: announced to a screen reader once the address is copied
        copiedStatus: 'Copied to the clipboard',
        // link to the reserve's account on the Taostats explorer (an ↗ follows it)
        viewOnTaostats: 'View on Taostats',
    },

    // the chain's status above the figures, shown in capitals: a lead, its details, then the
    // block, each after " · " ("LIVE · BITTENSOR MAINNET · FINALIZED · BLOCK 6,658,800");
    // a phone shows the lead and the block only
    status: {
        reading: 'Reading Bittensor mainnet…',
        unavailable: 'Chain read unavailable',
        retrying: 'retrying',
        live: 'Live',
        liveDetail: 'Bittensor mainnet · finalized',
        preLaunch: 'Pre-launch',
        // a launch day that has passed with nothing received yet
        awaiting: 'Awaiting the first receipt',
        preDetail: 'projected from on-chain emission',
        block: 'block {block}',
    },

    // the three figure cards: a label (shown in capitals), the figure, and a line beneath
    stats: {
        balance: 'Reserve balance',
        balanceReading: 'reading Bittensor mainnet…',
        balanceNothing: 'nothing received yet',
        balanceFlows: '{received} in · {spent} paid out',
        balanceReadingHistory: 'reading the balance history…',
        inflow: 'Monthly inflow',
        // {amount}: α a day, observed over the last {count} days (one to seven)
        inflowObserved: {
            one: '{amount} α a day observed, last {count} day',
            other: '{amount} α a day observed, last {count} days',
        },
        inflowProjected: '{amount} α a day projected · miner emissions × (1 − momentum)',
        // the line beneath this one is the programs unit's counts (programs/en.js)
        committed: 'Committed to programs',
    },

    // the display unit, α or USD (reserve/Denom.jsx)
    price: {
        // accessible name of the α | USD toggle (its captions are not translated)
        unitAria: 'Display unit',
        // where the α price is read: each follows "from" in price.note and in the fine print's
        // valuation (custody/en.js)
        sources: {
            operators: "the network operators' stats feeds",
            gecko: "CoinGecko's GeckoTerminal pool feed",
        },
        // under the figures while USD is selected: {price} is the USD price of one α, {source} one
        // of the sources above, {time} when the price was read
        note: 'USD at the live α price: {price} per α from {source}, {time}. A spot mark, not a realisable value.',
        unavailable: 'α price unavailable: the figures stay in α until a price feed answers.',
    },

    // the line under the figures, in the page's HTML for a reader or an agent that does not run it:
    // {address} is the reserve's address (set as code), {explorer} the link "Taostats"
    verify: 'Verify it yourself: these figures are read from Bittensor mainnet in your browser. The reserve is held by coldkey {address}; see it on {explorer}.',
};
