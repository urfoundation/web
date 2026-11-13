/**
 * The SN25 mainnet launch timeline (/mainnet): the box at its top that tells
 * miners what to do, and the payout epochs the page groups its milestones by.
 * The milestones themselves, and the explorers their
 * sources link to, are data/mainnet-timeline.json; edit that file when a
 * milestone happens, moves, or gains a transaction. A milestone's status is
 * done, in_progress, scheduled (set for a fixed time, shown at that time) or
 * planned (a plan, its time shown as approximate, ≈). A key milestone
 * (`key: true`) is also marked on the summary timeline under the page's title
 * (components/pages/mainnet/summary.js), which draws these epochs as its bands.
 *
 * These are UR settlement epochs, not the chain's 72-minute tempo: epoch 0 was
 * a 7,200-block bootstrap, and each later epoch is 50,400 blocks (7 days at 12
 * seconds a block). Each boundary is the coordinator's epochStartBlock /
 * epochEndBlock, as recorded in the sn repo (mainnet/LAUNCH.md); its time is
 * that block's timestamp once the block exists, and until then a projection
 * from the block number (`projected`), which the page marks with ≈.
 * `settlement` is what pays the epoch: 'v1' (version 1) or 'v2' (settlement
 * v2, from epoch 4: epoch 3 began before the v2 pool was registered, so it
 * stayed on version 1, and its funding is recovered: see its notice below).
 * `captureTheFlag` marks an epoch in which capture the flag pays beside the
 * provider pool, from epoch 8 (the capture the flag notice below); the page
 * flags it in the epoch's row and over its milestones.
 *
 * Plain data with no imports: the page, the SPA and the node test
 * (tests/mainnet-timeline.test.mjs) all read it. Its one rule is the order of
 * the notices at the top, newest first (newestFirst, below).
 */

export const mainnetEpochs = [
    {
        number: 0,
        settlement: 'v1',
        summary: 'Bootstrap, no payout root',
        start: { block: 9240028, time: '2026-10-08T18:08:12Z' },
        end: { block: 9247228, time: '2026-10-09T18:09:00Z' },
    },
    {
        number: 1,
        settlement: 'v1',
        summary: 'The first payout epoch',
        start: { block: 9247228, time: '2026-10-09T18:09:00Z' },
        end: { block: 9297628, time: '2026-10-16T18:09:00Z', projected: true },
    },
    {
        number: 2,
        settlement: 'v1',
        summary: 'Version 1',
        start: { block: 9297628, time: '2026-10-16T18:09:00Z', projected: true },
        end: { block: 9348028, time: '2026-10-23T18:09:00Z', projected: true },
    },
    {
        number: 3,
        settlement: 'v1',
        summary: 'Version 1: the v2 pool was not registered in time',
        start: { block: 9348028, time: '2026-10-23T18:09:00Z', projected: true },
        end: { block: 9398428, time: '2026-10-30T18:25:00Z', projected: true },
    },
    {
        number: 4,
        settlement: 'v2',
        summary: 'The first settlement v2 epoch',
        start: { block: 9398428, time: '2026-10-30T18:25:00Z', projected: true },
        end: { block: 9448828, time: '2026-11-06T18:25:00Z', projected: true },
    },
    {
        number: 5,
        settlement: 'v2',
        summary: 'The first settlement v2 close and claims',
        start: { block: 9448828, time: '2026-11-06T18:25:00Z', projected: true },
        end: { block: 9499228, time: '2026-11-13T18:25:00Z', projected: true },
    },
    {
        number: 6,
        settlement: 'v2',
        summary: 'Its usage prices the first demand deposit',
        start: { block: 9499228, time: '2026-11-13T18:25:00Z', projected: true },
        end: { block: 9549628, time: '2026-11-20T18:25:00Z', projected: true },
    },
    {
        number: 7,
        settlement: 'v2',
        summary: 'The first epoch with priced demand deposits',
        start: { block: 9549628, time: '2026-11-20T18:25:00Z', projected: true },
        end: { block: 9600028, time: '2026-11-27T18:25:00Z', projected: true },
    },
    {
        number: 8,
        settlement: 'v2',
        captureTheFlag: true,
        summary: 'The first capture the flag epoch: ten slots in every country',
        start: { block: 9600028, time: '2026-11-27T18:25:00Z', projected: true },
        end: { block: 9650428, time: '2026-12-04T18:25:00Z', projected: true },
    },
];

// the milestones before the first epoch listed above, and after the last
// (the page names that group after the last epoch's number). The epochs run to
// epoch 8, the first in which capture the flag pays: its draw and its first
// claims, after epoch 8 ends, are listed after it. The first settlement v2
// cycle, which once came after the last epoch, is epoch 5's.
export const mainnetBeforeEpochs = { title: 'Before launch' };
export const mainnetAfterEpochs = {};

export const SECONDS_PER_BLOCK = 12;

// The box at the top of the page: what miners need to do now. Its dates are
// the milestones' (tests/mainnet-timeline.test.mjs holds them together): the
// priority that replaced the modern provider gate on October 28; epoch 4, where
// settlement v2 started, at about 18:25 UTC on October 30; and the first v2
// claims, at 19:10 UTC on November 8. A link goes only to a page the site has:
// the miner guide's install and wallet sections, and the operators' apps on
// /operators.
export const mainnetActions = {
    headline: 'Mainnet is live!',
    title: 'What miners need to do',
    steps: [
        {
            title: 'Install the new miner.',
            detail: 'Since October 28, providers verified as modern are drawn first in Quality and Speed, so the old miner is deprioritized.',
            link: { label: 'Miner guide: Install', href: '/docs/miner#1-install' },
        },
        {
            title: 'Register your Bittensor wallet in the new miner.',
            detail: 'Your rewards are associated with the wallet you register.',
            link: { label: 'Miner guide: Run setup', href: '/docs/miner#2-run-setup' },
        },
        {
            title: 'Settlement v2 pays every epoch from epoch 4.',
            detail: "Settlement v2 started with epoch 4, from about October 30, 18:25 UTC, so version 1's limit of 1,500 paid miners an epoch no longer applies. Its first claims opened on November 8, at 19:10 UTC. Epoch 3's funding is recovered, as the epoch 3 notice at the top explains.",
        },
    ],
    // the closing paragraph, in runs; a run with an href is a link
    closing: [
        { text: 'With settlement v2 active, the subnet is set up to run itself and scale to millions of miners. New miners can participate in Bittensor from ' },
        { text: 'the apps', href: '/operators' },
        { text: ' with zero Bittensor experience.' },
    ],
};

// The dated notices above the box at the top, each in its own box, listed here
// in the order they were posted: a new notice goes at the end. The page shows
// mainnetNotices, the same notices newest first: sorted by `date`, the day each
// was posted ("November 11, 2026"), and within a day by the order they were
// posted, the later first. So it shows the providers without UDP or IPv6,
// offered for the traffic they carry as the next releases roll out, of
// November 13, then the extender pool from epoch 8 and the extenders' share on
// the contracts they can relay, both of November 12, then capture the flag from
// epoch 8 and Pro data on each network's own cycle, both of November 11, then
// epoch 3's delayed payout and its recovery, with the updates that followed,
// which the milestones and the box point to as "the epoch 3 notice at the
// top". Their dates are the
// epochs' and the milestones' (tests/mainnet-timeline.test.mjs holds them
// together). `id` is the anchor of the notice's box. `link` opens a notice's
// full text in the sn repo once that is on sn's main branch, and until then the
// notice's milestone on this page.
const NOTICES = [
    {
        id: 'notice',
        date: 'October 31, 2026',
        title: 'Epoch 3 payout delayed. Funds are safe.',
        paragraphs: [
            "Epoch 3's payout root was not committed within its window on October 30, because a server step timed out at mainnet scale. That step is now fixed. Epoch 1 had no eligible work to pay out, so its funding carried forward under the protocol's missed-commit rule.",
            "Both epochs' funding is safe in the v1 settlement vault: 3,482.26 α for epoch 1 and 4,132.72 α for epoch 3. Carried funding does not expire.",
            "At the end of epoch 4 (around November 6, 18:25 UTC), a recovery root moves these funds to the v2 vault. They are paid out with epoch 5, with epoch 3's funds going to the providers who did epoch 3's work. Claims are expected from around November 15. Epoch 4 is unaffected, and there is nothing you need to do.",
            "Update, November 6: the recovery root was committed at block 9,449,041, and the funds reach the v2 vault after its 48-hour challenge period, around November 8. Changes to the v2 settlement contract now wait 72 hours behind a public timelock, so adding the funds to epoch 5 is scheduled by November 10. The schedule above is unchanged.",
            "Update, November 11: the recovered funds reached the v2 vault on November 8, at 18:30 UTC. Adding them to epoch 5's payout was not scheduled by November 10, 18:25 UTC, and changes to the v2 settlement contract wait 72 hours, so they are not paid with epoch 5. They stay in the v2 vault until they are added to a later epoch's payout, and this notice will be updated when that is scheduled. Epoch 5's regular payout is unaffected.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-10-31-epoch-3-payout-recovery.md' },
    },
    {
        id: 'notice-pro-grant-cycle',
        date: 'November 11, 2026',
        title: "Pro data moves to each network's own cycle. SN25 rewards are counted as before.",
        paragraphs: [
            "With the network operator's server release of November 11, a Pro network gets its full monthly data on its own monthly cycle, counted from the day its subscription started or last renewed, instead of on the 1st of the month. Each cycle's grant carries that cycle's share of the subscription's revenue, and a payment no longer adds a separate 600 GiB credit.",
            "SN25 pool rewards are counted as before. Each operator's pool is split by completed usage, and subscription payments are not an input to it.",
            "What changes is the subscription revenue counted by the network operator's provider subsidy, which for traffic since the October 6 cutoff pays no USDC and only counts toward the weekly points the network operator awards. The subsidy counts revenue through the balances that fund settled traffic. Before, a paid period's revenue could count twice, in full through its 600 GiB credit and again as a share through the monthly grant, and a long-running Google Play subscription counted only a share spread over the months since it began. From the release, each period's revenue counts once, through its cycle grants.",
            "So the subsidy counts less where revenue counted twice, as in a new subscription's first month, and more for long-running Google Play subscriptions. Its timing follows each network's own cycle rather than the 1st. A payment credited during a running cycle, such as a second subscription, adds its revenue to the cycles after it, and the part that overlaps the running cycle is not counted.",
            "Nothing granted before the release changes. A Pro network that holds the November 1 grant gets its first cycle grant on December 1 at 00:00 UTC, when that grant's month ends. Customers pay the same, and there is nothing you need to do.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-11-pro-data-per-cycle.md' },
    },
    {
        id: 'notice-capture-the-flag',
        date: 'November 11, 2026',
        title: 'Capture the flag starts with epoch 8: ten slots in every country, beside the provider pool.',
        paragraphs: [
            "From epoch 8, which starts at block 9,600,028 around November 27, 18:25 UTC, each network operator gets a second SN25 pool beside its provider pool: capture the flag. The provider pool pays for usage, and capture the flag pays for being present in a country. Each of the 249 ISO 3166-1 countries has ten slots each epoch (one week), five for providers and five for extenders, and every slot is worth the same: the pool's new funding for the epoch divided by 2,490.",
            "A provider or extender enters its country's draw when it was online, passing its network operator's checks and in that country for at least half of the epoch, and is active at its end. Each operator commits its list of entries on chain, and a drand round published after it draws up to five winners per country and role. Miners in one /29 IPv4 or /48 IPv6 block share one entry. With five entries or fewer, each wins a slot; with more, each entry's chance is 5 in the number of entries.",
            "A slot with no winner carries forward into its country's pot for that role. Each winner takes its own slot and a fifth of that pot, so a miner alone in a country takes a fifth of what is left for each epoch it stays.",
            "From epoch 8 the provider pool gets 9/10 of the providers' share of emission instead of all of it. In epoch 4 that share was 1,195.84 α; at that scale the provider pool would get 1,076.26 α and capture the flag 119.58 α. Once top-level fleets are weighted, the provider pool gets 4/10. These figures are at epoch 4's scale, not a forecast. Rewards are paid in alpha, whose value changes and can fall, and what a miner receives depends on its uptime, on how many others are eligible in its country and on the network's emission.",
            "Winners are paid to the payout wallet the provider pool already uses, so there is nothing new to sign. Epoch 8's capture the flag claims open around December 7, with its pool claims, in the same claim flow. The pool is registered through the 72-hour timelock before epoch 8 starts, and the milestones below give each step. There is nothing you need to do.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-11-capture-the-flag.md' },
    },
    {
        id: 'notice-extender-relay-share',
        date: 'November 12, 2026',
        title: "Extenders earn their share only on contracts they can relay. Providers on an extender's address are credited in full.",
        paragraphs: [
            "From the network operator's server release of November 12, an extender is one of a contract's hops, and earns its share of the contract's usage, only when it can have relayed the contract. This is the rule the subnet owner set on November 11: a contract that comes through an extender counts the extender as one of its n hops, each credited 1/n of the usage.",
            "The network operator counts a connection as relayed when it comes from an extender's address. Three kinds of connection come from that address without being relayed, and they no longer make the extender a hop: the extender host's own connection, other devices of the extender's own network that share its address, and providers of other networks that share its address while providing publicly, since a public provider always connects to the platform directly.",
            "So a provider of another network on an extender's address is credited the whole of its contracts' usage, where the extender's network was credited a share of it, usually half. So is a provider serving a device that connects from an extender of the device's own network, where the device's own network was credited a share. Within one network, a fleet's providers on its own extender's address are credited the usage they serve, and the network's total is unchanged. An extender host's own contracts are unchanged.",
            "One kind of relay counts that did not: a connection from another address of an extender's IPv6 /64. Hosts commonly send from a temporary address of their /64 rather than the one they activated from, so an extender's relays from such an address earned it nothing. On those contracts the extender is now one of the hops, beside the provider.",
            "SN25 pool rewards are still split by completed usage, and the network operator's provider subsidy, which for traffic since the October 6 cutoff only counts toward the weekly points it awards, follows the same hops. Contracts created before the release keep their hops. There is nothing you need to do.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-12-extender-relay-share.md' },
    },
    {
        id: 'notice-extender-pool',
        date: 'November 12, 2026',
        title: 'The extender pool starts with epoch 8. Bytes served within one network count for extenders, not providers.',
        paragraphs: [
            "From epoch 8, which starts at block 9,600,028 around November 27, 18:25 UTC, the part of each contract's usage that no provider earns counts for extenders instead, as the subnet owner approved on November 10. A provider, intermediary or extender on the network of the device that opened a contract is no longer credited its share of that contract, on the free plan or a paid one: the share goes to the extender pool, and the contract's other hops keep theirs. A share held by a platform endpoint the network operator registers, such as sidecar's edges, goes there too; sidecar has not shipped, so until it does, the pool's bytes come from same-network traffic alone. Same-network credit earned before epoch 8 is kept.",
            "Only contracts that a data balance funded count, on the free plan or a paid one, and never the network operator's own measurement and test traffic, which keeps paying the providers that carry it. Each epoch, the pool's bytes are spread evenly over each /29 IPv4 or /48 IPv6 block that holds an eligible extender, then evenly over the extenders in it, and weighted beside the provider rows up to the epoch's eligible provider usage, so extenders take at most half of a pool. With no eligible extender, the bytes are dropped. An extender that carries a contract keeps its own share of it, as one of the contract's n hops, unless it is on the network of the device that opened the contract.",
            "An extender counts when, at the end of the epoch, it is in the active pool, with at least one address that passes the network operator's five-minute challenge; it has a payout wallet and is not bound to a top-level miner's fleet; and it is not on one of the network operator's own networks. Records that share a provider client, an IPv4 address or an IPv6 /64 count once.",
            "From epoch 8, each epoch's ledger header lists the pool's bytes, the census of the network operator's extenders, by keyed /29 or /48 prefix hash and never by address, and their shares, and the epoch's usage statement, version 2, adds the pool's two parts, its weight after the cap and the contracts and payer networks behind it. Epochs 6 and 7 run in shadow first: after each, the operator publishes an unsigned report of what the pool would have paid, which the validator's checks run on and which is never paid.",
            "The subnet owner signs the amendment entry that starts the pool during epoch 7, beside capture the flag's, and it takes effect once it is published at ur.xyz/amendments.yml before epoch 8 starts. Rewards are paid in alpha, whose value changes and can fall. An extender's share is paid to the payout wallet it already uses and claimed with its pool account, in the same claim flow. There is nothing you need to do.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-12-extender-pool.md' },
    },
    {
        id: 'notice-providers-without-udp-or-ipv6',
        date: 'November 13, 2026',
        title: 'Providers without UDP or IPv6 will be offered for the traffic they carry. SN25 rewards are counted as before.',
        paragraphs: [
            "The network operator's quality probe loads test sites through every provider over HTTPS (TCP), over HTTP/3 (QUIC, which runs over UDP) where a site serves it, and over IPv6 where a provider's connections prove it. A check passes only when every load passes. So a provider that carries no UDP, or whose IPv6 fails, fails its checks, and clients are offered it rarely, if at all, even for the traffic it carries. On November 12, about 20,700 providers failed their checks only because of their HTTP/3 loads.",
            "A change that offers these providers for the traffic they carry is rolling out with the network operator's next server release and the next app releases. With both, clients are offered a provider whose checks failed only over HTTP/3 (UDP) for TCP traffic, and one whose checks failed only over IPv6 for IPv4 traffic. Clients never send UDP to a provider that does not carry it. Each app keeps a few of these providers beside its usual ones, and they join the race for every TCP connection they can carry. The apps also turn to them where a location has too few providers that carry UDP.",
            "Only failed checks count against a provider: one with no failed check over UDP or IPv6 is offered for both, as before, and one that regains UDP or IPv6 is offered for it again within 8 hours. The network operator's hosted proxies take the same change with their next release, and apps from before these releases keep the old selection.",
            "SN25 scoring, weights and payouts read none of the quality probe's checks, and none of it changes: pool rewards are still split by completed usage. A provider offered for the traffic it carries serves more of it, so it earns more through that traffic alone.",
            "With the same releases, a provider's status in the apps says how many of its checks failed only over HTTP/3 (UDP), or only over IPv6, and what it is offered for. There is nothing you need to do. A provider that carries no UDP can carry it again by updating to the latest release, since some older builds do not route UDP, and by checking that its network does not block UDP.",
        ],
        link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-11-13-providers-without-udp-or-ipv6.md' },
    },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * The day a notice was posted, from its `date` ("November 11, 2026"), as the
 * UTC milliseconds of that day's start, or NaN when its date is not a real day
 * written that way.
 */
export function noticeDay(notice) {
    const match = /^([A-Z][a-z]+) ([1-9]\d?), (\d{4})$/.exec(String(notice?.date ?? ''));
    const month = match ? MONTH_NAMES.indexOf(match[1]) : -1;
    if (month < 0) return NaN;
    const [year, day] = [Number(match[3]), Number(match[2])];
    const ms = Date.UTC(year, month, day);
    return new Date(ms).getUTCDate() === day ? ms : NaN;
}

/**
 * Notices listed in the order they were posted, newest first: by the day each
 * was posted, and within a day the later-listed first. A notice whose date
 * cannot be read stops the build rather than taking a place by accident.
 */
export function newestFirst(notices) {
    const order = notices.map((notice, index) => ({ notice, index, day: noticeDay(notice) }));
    for (const { notice, day } of order) {
        if (Number.isNaN(day)) throw new Error(`mainnet notice ${notice.id}: date "${notice.date}" is not a day such as "November 11, 2026"`);
    }
    return order.sort((a, b) => b.day - a.day || b.index - a.index).map(({ notice }) => notice);
}

export const mainnetNotices = newestFirst(NOTICES);
