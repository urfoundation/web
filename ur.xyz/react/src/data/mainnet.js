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
 * stayed on version 1, and its funding is recovered and paid with epoch 5).
 *
 * Plain data with no imports: the page, the SPA and the node test
 * (tests/mainnet-timeline.test.mjs) all read it.
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
];

// the milestones before the first epoch listed above, and after the last
// (the page names that group after the last epoch's number). The epochs run to
// epoch 7, the first with priced demand deposits; the first settlement v2 cycle,
// which once came after the last epoch, is epoch 5's.
export const mainnetBeforeEpochs = { title: 'Before launch' };
export const mainnetAfterEpochs = {};

export const SECONDS_PER_BLOCK = 12;

// The box at the top of the page: what miners need to do now. Its dates are
// the milestones' (tests/mainnet-timeline.test.mjs holds them together): the
// modern provider gate at 00:00 UTC on November 11, and epoch 4, where
// settlement v2 started, at about 18:25 UTC on October 30. A link goes only to a page the site has: the miner guide's install and
// wallet sections, and the operators' apps on /operators.
export const mainnetActions = {
    headline: 'Mainnet is live!',
    title: 'What miners need to do',
    steps: [
        {
            title: 'Install the new miner before November 11, 2026.',
            detail: 'From 00:00 UTC on November 11, the old miner will be deprioritized.',
            link: { label: 'Miner guide: Install', href: '/docs/miner#1-install' },
        },
        {
            title: 'Register your Bittensor wallet in the new miner.',
            detail: 'Your rewards are associated with the wallet you register.',
            link: { label: 'Miner guide: Run setup', href: '/docs/miner#2-run-setup' },
        },
        {
            title: 'Settlement v2 pays every epoch from epoch 4.',
            detail: "Settlement v2 started with epoch 4, from about October 30, 18:25 UTC, so version 1's limit of 1,500 paid miners an epoch no longer applies. Its first claims open from about November 8, 19:10 UTC. Epoch 3's funding is recovered and paid with epoch 5, as the notice above explains.",
        },
    ],
    // the closing paragraph, in runs; a run with an href is a link
    closing: [
        { text: 'With settlement v2 active, the subnet is set up to run itself and scale to millions of miners. New miners can participate in Bittensor from ' },
        { text: 'the apps', href: '/operators' },
        { text: ' with zero Bittensor experience.' },
    ],
};

// The dated notice above the box at the top: epoch 3's delayed payout, and its
// recovery with epoch 5. Its dates are the epochs' (tests/mainnet-timeline.test.mjs
// holds them together), and `link` opens its full text in the sn repo.
export const mainnetNotice = {
    date: 'October 31, 2026',
    title: 'Epoch 3 payout delayed. Funds are safe.',
    paragraphs: [
        "Epoch 3's payout root was not committed within its window on October 30, because a server step timed out at mainnet scale. That step is now fixed. Epoch 1 had no eligible work to pay out, so its funding carried forward under the protocol's missed-commit rule.",
        "Both epochs' funding is safe in the v1 settlement vault: 3,482.26 α for epoch 1 and 4,132.72 α for epoch 3. Carried funding does not expire.",
        "At the end of epoch 4 (around November 6, 18:25 UTC), a recovery root moves these funds to the v2 vault. They are paid out with epoch 5, with epoch 3's funds going to the providers who did epoch 3's work. Claims are expected from around November 15. Epoch 4 is unaffected, and there is nothing you need to do.",
        "Update, November 6: the recovery root was committed at block 9,449,041, and the funds reach the v2 vault after its 48-hour challenge period, around November 8. Changes to the v2 settlement contract now wait 72 hours behind a public timelock, so adding the funds to epoch 5 is scheduled by November 10. The schedule above is unchanged.",
    ],
    link: { label: 'Read the full notice', href: 'https://github.com/urfoundation/sn/blob/main/mainnet/notices/2026-10-31-epoch-3-payout-recovery.md' },
};
