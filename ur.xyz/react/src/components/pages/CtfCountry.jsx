import React from 'react';
import { CTF } from './ctf/data';
import { CountryEasyWins, CountryLive } from './ctf/CountryIslands';
import Countdown from './ctf/Countdown';
import { Flag } from './ctf/parts';
import { chanceText, countryMessage, lastEpochFacts, localModel, neighbours, presenceSentence, startNote, uninhabitedSentence } from './ctf/model';
import { ctfCopy, formats, interpolate, place } from './ctf/i18n';
import { pagePath } from './ctf/links';
import { BOLD, rich } from './ctf/rich';
import { FinePrint, HowItWorks, Questions, slotWorth } from './Ctf';
import './Ctf.css';

/**
 * CtfCountryPage — a country's capture the flag page, /ctf/<cc> (and
 * /<lang>/ctf/<cc> in `lang`): what a newcomer can win there this epoch,
 * answered in the searcher's own words (sn design/ctf/SEO.md §2.2), from the
 * country's own data in the epoch's snapshot. Its title and H1 lead with
 * plain earning words, since "capture the flag" means hacking contests in
 * search; the program keeps its name.
 *
 * Like the hub (Ctf.jsx) it renders only the inside of <main>. The live bar
 * with the country's card, and its other big pots, are islands
 * (ctf/CountryIslands.jsx), passed in by the static page
 * (astro/src/components/routes/CtfCountryRoute.astro) as `live` and
 * `easyWins` and rendered here by the SPA. The header, the questions, the
 * countries around it, how the draw works and the fine print are static.
 * Until capture the flag starts, the hub's note opens the page too, in its
 * compact form (ctf/Countdown.jsx, passed in as `countdown`): the same words
 * on every country page, so it changes nothing of which pages read alike
 * (ctf/indexing.js).
 */
export default function CtfCountryPage({ code, lang = 'en', updated = null, live = null, easyWins = null, countdown = null, model = CTF }) {
    // `model` is the snapshot's model, or one whose page is read for its
    // indexing (ctf/indexing.js placeholderModel); the islands read the same
    const m = localModel(model, lang);
    const c = m.byCode.get(code);
    if (!c) return null;
    const t = ctfCopy(m.lang);
    const f = formats(m.lang);
    const presence = presenceSentence(m, c);
    const facts = lastEpochFacts(m, c);
    const empty = uninhabitedSentence(c, m.lang);
    const asOf = m.potsKnown ? interpolate(m.drawn ? t.country.asOfDraw : t.country.asOfClose, { epoch: m.last.epoch, day: f.utcDay(m.asOf) }) : '';
    const { prev, next } = neighbours(m, code);
    const hub = pagePath(m.lang, '/ctf');
    const values = place(c);
    const note = startNote(m);
    return (
        <div className="ctf-page">
            <div className="ctf-shell">
                {note && (countdown || <Countdown {...note} compact />)}
                <header className={note ? 'ctf-hdr ctf-hdr-noted' : 'ctf-hdr'}>
                    <nav className="ctf-crumbs" aria-label={t.country.crumbs}><a href={hub}>{t.program}</a><span aria-hidden="true">›</span><span aria-current="page">{c.short}</span></nav>
                    <h1>{rich(t.country.h1, values)}</h1>
                    <p className="ctf-mission">{m.many ? f.count(t.country.missionMany, m.roleSlots, values) : rich(t.country.mission, values)}</p>
                    <p className="ctf-intro">
                        <span className="ctf-answer">{rich(t.country.answer, values)}</span>{t.gap}
                        {asOf}{countryMessage(m, c)}{facts && <>{t.gap}{facts}</>}{empty && <>{t.gap}{empty}</>}{presence && <>{t.gap}{presence}</>}{t.country.disclaimer}
                    </p>
                </header>

                {live || <CountryLive code={code} lang={lang} m={m} />}

                <CountryQuestions m={m} c={c} />

                {easyWins || <CountryEasyWins code={code} lang={lang} m={m} />}

                {/* about other countries: left out of what this page says of its own, which decides
                    whether it is indexed (ctf/indexing.js) */}
                <nav className="ctf-sec ctf-around" aria-label={t.country.more} data-ctf-elsewhere="">
                    <Around m={m} c={prev} dir="prev" />
                    <a className="ctf-btn ctf-btn-s" href={hub}>{t.country.all}</a>
                    <Around m={m} c={next} dir="next" />
                </nav>

                <HowItWorks m={m} />
                <FinePrint m={m} updated={updated} />
            </div>
        </div>
    );
}

// The arrows point the way the page reads: right to left in Arabic.
const RTL = new Set(['ar']);

/** A neighbour in A–Z, with what it holds: its pots after a draw, its providers online before. */
function Around({ m, c, dir }) {
    const t = ctfCopy(m.lang).country;
    const f = formats(m.lang);
    const figure = m.potsKnown
        ? interpolate(t.aroundPots, { amount: f.alpha(c.pots) })
        : c.online !== null ? f.count(t.aroundOnline, c.online) : null;
    const [back, ahead] = RTL.has(m.lang) ? ['→', '←'] : ['←', '→'];
    return (
        <a className="ctf-around-link" href={pagePath(m.lang, `/ctf/${c.code}`)} rel={dir}>
            {dir === 'prev' && <span aria-hidden="true">{back}</span>}
            <Flag code={c.code} />
            <span>{c.name}{figure && <><br /><span className="ctf-around-online">{figure}</span></>}</span>
            {dir === 'next' && <span aria-hidden="true">{ahead}</span>}
        </a>
    );
}

function CountryQuestions({ m, c }) {
    const t = ctfCopy(m.lang).countryFaq;
    const f = formats(m.lang);
    const values = place(c);
    const note = c.note || null;
    const entries = (r, none, some) => (r.units === 0 ? none : f.count(some, r.units, { won: r.won }));
    let earn;
    if (m.drawn) {
        earn = rich(t.earnDrawn, {
            ...values,
            worth: slotWorth(m),
            p: f.alpha(c.p.pot),
            x: f.alpha(c.x.pot),
            pe: entries(c.p, t.pNone, t.pEntries),
            xe: entries(c.x, t.xNone, t.xEntries),
            took: c.won > 0 && rich(t.took, { amount: f.alpha(c.awarded) }),
        }, BOLD);
    } else if (m.phase === 'undrawn') {
        earn = rich(t.earnUndrawn, { ...values, epoch: m.last.epoch, p: f.alpha(c.p.pot), x: f.alpha(c.x.pot), worth: slotWorth(m) }, BOLD);
    } else {
        const when = {
            prelaunch: () => rich(t.whenPrelaunch, { first: m.firstEpoch, clock: f.utcClock(m.startsAt), day: f.utcDay(m.startsAt) }),
            first: () => rich(t.whenFirst, { epoch: m.epoch, draw: f.utcTime(m.drawAt) }),
            drawing: () => rich(t.whenDrawing, { first: m.firstEpoch }),
        }[m.phase]();
        earn = rich(t.earnSoon, { ...values, when, worth: slotWorth(m) });
    }
    let advice;
    if (m.drawn && c.p.open && c.x.open) advice = rich(t.roleBoth, values);
    else if (m.drawn && c.x.open) advice = rich(t.roleX, { ...values, pct: chanceText(m, c.p) }, BOLD);
    else if (m.drawn && c.p.open) advice = rich(t.roleP, { ...values, pct: chanceText(m, c.x) }, BOLD);
    else if (m.drawn) advice = rich(t.roleHeld, { ...values, pp: chanceText(m, c.p), xp: chanceText(m, c.x) }, BOLD);
    else {
        const online = c.online !== null && m.presence && rich(t.roleOnline, {
            day: f.dayName(m.presence.day),
            providers: c.online === 0 ? t.noProvider : f.count(t.providers, c.online),
        });
        advice = rich(t.roleOpen, { ...values, online });
    }
    const noted = note && [
        <br key="b1" />,
        <br key="b2" />,
        ...rich(t.note, { ...values, day: note.reviewed, text: note[m.lang] || note.text }, { time: (kids) => <time dateTime={note.reviewed}>{kids}</time> }),
    ];
    return (
        <Questions
            title={interpolate(t.title, values)}
            items={[
                [interpolate(t.earnQ, values), earn],
                [t.passiveQ, rich(t.passiveA, values)],
                [interpolate(t.remoteQ, values), t.remoteA],
                [interpolate(t.roleQ, values), advice],
                [t.drawQ, rich(t.drawA, values)],
                [t.paidQ, rich(t.paidA, { ...values, note: noted })],
            ]}
        />
    );
}
