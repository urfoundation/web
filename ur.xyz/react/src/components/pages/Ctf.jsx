import React from 'react';
import { CTF } from './ctf/data';
import Board from './ctf/Board';
import { API_STATE, EPOCH4_SLOT_RAO, FLAGS_LICENSE, OPERATOR_YML, alpha, dayName, utcClock, utcDay } from './ctf/model';
import './Ctf.css';

/**
 * CtfPage — the /ctf page body: capture the flag, the hub of the 249 country
 * pages (sn CAPTURETHEFLAG.md §9.2; its design is sn's design/ctf/design.html
 * and its build plan design/ctf/SEO.md §2 and §6).
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and the Astro page (astro/src/pages/ctf.astro) both
 * provide the shell. The page is the epoch's snapshot (data/ctf-epoch.json),
 * so every figure is in the static HTML; the header, how the draw works, the
 * questions and the fine print need no script. The board (ctf/Board.jsx: the
 * live bar and its filters, the visitor's country, Easy wins and the grid) is
 * an island, passed in by the static page as `board` and rendered here by the
 * SPA. English-only, like /mainnet.
 *
 * `updated` is the day the page's content last changed (the sitemap's
 * lastmod), which only the static build knows.
 */
export default function CtfPage({ updated = null, board = null }) {
    const m = CTF;
    return (
        <div className="ctf-page">
            <div className="ctf-shell">
                <header className="ctf-hdr">
                    <div className="ctf-label ctf-label-acc">SN25 · every country, every epoch</div>
                    <h1>Capture the flag</h1>
                    <p className="ctf-mission">Providers and extenders in every country</p>
                    <p className="ctf-intro">
                        <span className="ctf-answer">Run the free URnetwork app as a provider or an extender, and you can win weekly crypto rewards wherever you are.</span>{' '}
                        {m.phase === 'prelaunch' && <>Capture the flag starts with epoch {m.firstEpoch}, at about {utcClock(m.startsAt)} on {utcDay(m.startsAt)}. </>}
                        Every country has ten slots each epoch (one week): five for providers and five for extenders. A slot nobody wins rolls into that country's pot, and each winner there takes its slot and a fifth of the pot. Where a slot went unclaimed, a new miner who stays online for half the epoch wins by default.
                    </p>
                </header>

                {board || <Board />}

                <HowItWorks />
                <HubQuestions m={m} />
                <FinePrint m={m} updated={updated} />
            </div>
        </div>
    );
}

export function HowItWorks() {
    return (
        <section id="how" className="ctf-sec ctf-how" aria-labelledby="ctf-how-h">
            <h2 id="ctf-how-h" className="ctf-h2">How the draw works</h2>
            <div className="ctf-steps">
                <div className="ctf-step"><b>01</b><h3>Be there</h3><p>Run a provider or an extender in the country for at least half the epoch, and be online when it ends. Your network's existing payout wallet is used, so there is nothing new to sign.</p></div>
                <div className="ctf-step"><b>02</b><h3>The draw</h3><p>When the epoch ends, the operator commits the list of eligible miners on chain. A public drand round then picks up to five winners per country for each role. With five or fewer entries, everyone wins. Miners in one /29 or /48 share a single ticket.</p></div>
                <div className="ctf-step"><b>03</b><h3>Claim</h3><p>Each winner takes its slot and a fifth of the country's pot, so staying several epochs captures most of a big pot. The alpha accrues to your wallet, and you claim it with your pool earnings in the app.</p></div>
            </div>
        </section>
    );
}

/** Questions, as visible HTML (no FAQPage markup: Google dropped that rich result; SEO.md §2.4). */
export function Questions({ title, items }) {
    return (
        <section id="faq" className="ctf-sec ctf-faq-sec" aria-labelledby="ctf-faq-h">
            <h2 id="ctf-faq-h" className="ctf-h2">{title}</h2>
            <div className="ctf-faq">
                {items.map(([q, a], i) => (
                    <details key={q} open={i === 0}>
                        <summary>{q}</summary>
                        <p>{a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

/** What a slot is worth, as the data allows: last epoch's, or at epoch 4's scale before the first draw. */
export function slotWorth(m) {
    return m.slot !== null
        ? <>A slot is worth about {alpha(m.slot, 3)} α this epoch</>
        : <>A slot is worth the pool's fresh funding for the epoch divided by 2,490: about {alpha(EPOCH4_SLOT_RAO, 3)} α at epoch 4's scale, an illustration rather than a forecast</>;
}

function HubQuestions({ m }) {
    const live = m.phase !== 'prelaunch';
    return (
        <Questions
            title="Questions"
            items={[
                ['What is capture the flag?', <>A weekly reward on URnetwork, Bittensor subnet 25. Every country has five provider slots and five extender slots each epoch (one week), and winners are paid in alpha, the subnet's token. A slot that nobody wins adds its amount to that country's pot, so a newcomer to an empty country takes a fifth of the pot every epoch it stays.{!live && <> It starts with epoch {m.firstEpoch}, at about {utcClock(m.startsAt)} on {utcDay(m.startsAt)}.</>}</>],
                ['How do I win a slot?', <>Run the free URnetwork app as a provider or an extender, keep it online in your country for at least half the epoch, and be online when it ends. Where a slot went unclaimed last epoch, a newcomer wins by default. Where all five were won, a public draw picks five winners.</>],
                ['How much can I earn?', <>{slotWorth(m)}, and a winner in a country with a pot also takes a fifth of that pot. Amounts change every epoch with the network's emission and with how many people run in each country, and alpha's price moves. Nothing is guaranteed.</>],
                ['Is it passive income, or a job?', <>Neither, quite. The app runs in the background on a phone or computer you already have, but it earns only while it stays online. It is not a job, with no employer, hours or wage, and not an investment, with no fixed return.</>],
                ['What is the difference between a provider and an extender?', <>A provider shares your internet connection with the people who use URnetwork. An extender is a relay for people who cannot reach the network directly, for example behind censorship. The desktop app runs both by default, and one device can win in both roles.</>],
                ['How is the draw kept fair?', <>When the epoch ends, the operator commits the list of eligible miners on chain. A drand round published after that commitment then picks the winners, so nobody can choose them. Every draw can be checked against its census and its round.</>],
                ['Can my AI assistant read this data?', <>Yes. {live ? 'The numbers on this page are' : `From epoch ${m.firstEpoch}, the numbers on this page are`} public JSON at <a href={API_STATE}>/sn/ctf</a>, documented in <a href={OPERATOR_YML}><code>sn/api/operator.yml</code></a>, with times in UTC and amounts in α. They change once an epoch.</>],
            ]}
        />
    );
}

/** The fine print under every capture the flag page. */
export function FinePrint({ m, updated }) {
    return (
        <footer className="ctf-foot">
            {m.potsKnown
                ? <p>Up for grabs is an estimate: the pots carried in, plus this epoch's ten slots at last epoch's slot amount of {alpha(m.slot, 3)} α. Every draw can be checked against its on-chain census and drand round at <a href={API_STATE}>/sn/ctf</a>.</p>
                : <p>Every draw can be checked against its on-chain census and drand round, published at <a href={API_STATE}>/sn/ctf</a> from epoch {m.firstEpoch}.</p>}
            <p id="chance-to-win">Chance to win shows where all five of a role's slots were won last epoch. Its entries are last epoch's eligible units in that role plus you, and it is 5 ÷ entries, the exact odds of a draw of five winners; with five entries or fewer, everyone wins. Where a slot went unclaimed, a new miner wins by default.</p>
            <p>Rewards are paid in alpha, the token of Bittensor subnet 25, whose value changes and can fall. They depend on uptime, on how many others run in each country and on the network's emission. They are not wages, a salary, a guaranteed income or an investment, and you pay your own costs, such as power and data.</p>
            <p>
                Country pages are built from each epoch's public data.
                {m.presence && <> Providers online are the network dashboard's count at the end of {dayName(m.presence.day)}.</>}
                {' '}Flags: flag-icons, <a href={FLAGS_LICENSE}>MIT licence</a>.
                {updated && <> Updated <time dateTime={updated}>{updated}</time>.</>}
            </p>
        </footer>
    );
}
