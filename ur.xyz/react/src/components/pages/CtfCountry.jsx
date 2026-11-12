import React from 'react';
import { CTF } from './ctf/data';
import { CountryEasyWins, CountryLive } from './ctf/CountryIslands';
import { Flag } from './ctf/parts';
import { HUB_PATH, alpha, countryMessage, countryPath, dayName, int, lastEpochFacts, neighbours, pct, presenceSentence, uninhabitedSentence, utcClock, utcDay, utcTime } from './ctf/model';
import { CTF_LOCAL_NOTES } from '../../data/ctf-local-notes';
import { FinePrint, HowItWorks, Questions, slotWorth } from './Ctf';
import './Ctf.css';

/**
 * CtfCountryPage — a country's capture the flag page, /ctf/<cc>: what a
 * newcomer can win there this epoch, answered in the searcher's own words
 * (sn design/ctf/SEO.md §2.2), from the country's own data in the epoch's
 * snapshot. Its title and H1 lead with plain earning words, since "capture the
 * flag" means hacking contests in search; the program keeps its name.
 *
 * Like the hub (Ctf.jsx) it renders only the inside of <main>. The live bar
 * with the country's card, and its other big pots, are islands
 * (ctf/CountryIslands.jsx), passed in by the static page
 * (astro/src/pages/ctf/[cc].astro) as `live` and `easyWins` and rendered
 * here by the SPA. The header, the questions, the countries around it, how
 * the draw works and the fine print are static.
 */
export default function CtfCountryPage({ code, updated = null, live = null, easyWins = null }) {
    const m = CTF;
    const c = m.byCode.get(code);
    if (!c) return null;
    const presence = presenceSentence(m, c);
    const facts = lastEpochFacts(m, c);
    const empty = uninhabitedSentence(c);
    const asOf = m.potsKnown ? `As of epoch ${m.last.epoch}'s ${m.drawn ? 'draw' : 'close'}, ${utcDay(m.asOf)}: ` : '';
    const { prev, next } = neighbours(m, code);
    return (
        <div className="ctf-page">
            <div className="ctf-shell">
                <header className="ctf-hdr">
                    <nav className="ctf-crumbs" aria-label="Breadcrumb"><a href={HUB_PATH}>Capture the flag</a><span aria-hidden="true">›</span><span aria-current="page">{c.short}</span></nav>
                    <h1>Earn crypto in {c.the} with your internet connection</h1>
                    <p className="ctf-mission">Five provider and five extender slots in {c.the} every epoch (one week)</p>
                    <p className="ctf-intro">
                        <span className="ctf-answer">Run the free URnetwork app in {c.the} as a provider or an extender, and you can win weekly crypto rewards.</span>{' '}
                        {asOf}{countryMessage(m, c)}{facts && <> {facts}</>}{empty && <> {empty}</>}{presence && <> {presence}</>} Rewards are paid in alpha, the token of Bittensor subnet 25, and are not guaranteed.
                    </p>
                </header>

                {live || <CountryLive code={code} />}

                <CountryQuestions m={m} c={c} />

                {easyWins || <CountryEasyWins code={code} />}

                {/* about other countries: the seo-audit leaves it out of what this page says of its own */}
                <nav className="ctf-sec ctf-around" aria-label="More countries" data-ctf-elsewhere="">
                    <Around m={m} c={prev} dir="prev" />
                    <a className="ctf-btn ctf-btn-s" href={HUB_PATH}>All 249 countries</a>
                    <Around m={m} c={next} dir="next" />
                </nav>

                <HowItWorks />
                <FinePrint m={m} updated={updated} />
            </div>
        </div>
    );
}

/** A neighbour in A–Z, with what it holds: its pots after a draw, its providers online before. */
function Around({ m, c, dir }) {
    const figure = m.potsKnown
        ? `${alpha(c.pots)} α in pots`
        : c.online !== null ? `${int(c.online)} ${c.online === 1 ? 'provider' : 'providers'} online` : null;
    return (
        <a className="ctf-around-link" href={countryPath(c.code)} rel={dir}>
            {dir === 'prev' && <span aria-hidden="true">←</span>}
            <Flag code={c.code} />
            <span>{c.name}{figure && <><br /><span className="ctf-around-online">{figure}</span></>}</span>
            {dir === 'next' && <span aria-hidden="true">→</span>}
        </a>
    );
}

const entries = (won, units, role) => (units === 0
    ? `no ${role} entered`
    : `${won} of ${int(units)} ${role} ${units === 1 ? 'entry' : 'entries'} won a slot`);

function CountryQuestions({ m, c }) {
    const the = c.the;
    const note = CTF_LOCAL_NOTES[c.code] || null;
    let earn;
    if (m.drawn) {
        earn = <>Yes, in small amounts. {slotWorth(m)}, and the pots carried in {the} are <b>{alpha(c.p.pot)} α</b> for providers and <b>{alpha(c.x.pot)} α</b> for extenders. Each winner takes its slot and a fifth of its role's pot. Last epoch, {entries(c.p.won, c.p.units, 'provider')} and {entries(c.x.won, c.x.units, 'extender')}{c.won > 0 && <>, and its winners took {alpha(c.awarded)} α</>}. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.</>;
    } else if (m.phase === 'undrawn') {
        earn = <>Yes, in small amounts. Epoch {m.last.epoch} had no draw, so every slot carried: the pots in {the} are now <b>{alpha(c.p.pot)} α</b> for providers and <b>{alpha(c.x.pot)} α</b> for extenders. {slotWorth(m)}, and each winner takes its slot and a fifth of its role's pot. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.</>;
    } else {
        const when = {
            prelaunch: <>once capture the flag starts with epoch {m.firstEpoch}, at about {utcClock(m.startsAt)} on {utcDay(m.startsAt)}</>,
            first: <>from epoch {m.epoch}, capture the flag's first, which is drawn about {utcTime(m.drawAt)}</>,
            drawing: <>from epoch {m.firstEpoch}, capture the flag's first, whose draw is under way</>,
        }[m.phase];
        earn = <>Yes, in small amounts, {when}. Each epoch {the} has five provider slots and five extender slots. {slotWorth(m)}. A slot nobody wins rolls into the country's pot, and each winner takes its slot and a fifth of its role's pot. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.</>;
    }
    let advice;
    if (m.drawn && c.p.open && c.x.open) advice = <>Either. Both roles have open slots in {the}, so a newcomer in either role wins by default. The desktop app runs both.</>;
    else if (m.drawn && c.x.open) advice = <>An extender. Its slots in {the} were not all won last epoch, so a new extender wins by default. All five provider slots were won, so a new provider needs the draw: about <b>{pct(c.p.chance)}</b>.</>;
    else if (m.drawn && c.p.open) advice = <>A provider. Its slots in {the} were not all won last epoch, so a new provider wins by default. All five extender slots were won, so a new extender needs the draw: about <b>{pct(c.x.chance)}</b>.</>;
    else if (m.drawn) advice = <>Both roles were fully captured last epoch, so a newcomer needs the draw: about <b>{pct(c.p.chance)}</b> as a provider and <b>{pct(c.x.chance)}</b> as an extender. The desktop app runs both, which enters both draws.</>;
    else advice = <>Either, or both: each role has its own five slots and its own pot in {the}. A provider shares your internet connection with the people who use URnetwork; an extender is a relay for people who cannot reach the network directly. The desktop app runs both by default, and one device can win in both roles.{c.online !== null && m.presence && <> At the end of {dayName(m.presence.day)} the network's dashboard counted {c.online === 0 ? 'no provider' : `${int(c.online)} ${c.online === 1 ? 'provider' : 'providers'}`} online there.</>}</>;
    return (
        <Questions
            title={`Questions about earning in ${the}`}
            items={[
                [`Can you make money in ${the} with URnetwork?`, earn],
                ['Is it passive income?', <>Partly. The app runs in the background on a phone or computer you already have, but it earns only while it stays online, and what you win depends on how many others run in {the} and on alpha's price. It is not an investment and has no fixed return.</>],
                [`Is it remote work in ${the}?`, <>No. Capture the flag is not a job: there is no employer, no hours and no wage. It can run alongside remote work or any other job, on the internet connection you already have.</>],
                [`Provider or extender: which should I run in ${the}?`, advice],
                ['How are winners chosen, and can I check?', <>When the epoch ends, the operator commits the list of eligible miners in {the} on chain, and a drand round published after it draws up to five winners per role. With five entries or fewer, everyone wins. Miners in one /29 or /48 share a single entry. Each draw's census and round are public.</>],
                ['How do I get paid?', <>Winnings go to the payout wallet the app already uses, and you claim them with your pool earnings in the app. Local law in {the} applies to what you earn and how you cash it out.{note && <><br /><br />Local note for {the}, reviewed <time dateTime={note.reviewed}>{note.reviewed}</time>: {note.text}</>}</>],
            ]}
        />
    );
}
