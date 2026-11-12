import React from 'react';
import { CTF } from './ctf/data';
import Board from './ctf/Board';
import { API_STATE, EPOCH4_SLOT_RAO, EXTENDER_URL, FLAGS_LICENSE, METHOD_URL, OPERATOR_YML, SOURCE_URL, defaultWinRule, localModel } from './ctf/model';
import { ctfCopy, formats, interpolate } from './ctf/i18n';
import { pagePath } from './ctf/links';
import { rich } from './ctf/rich';
import './Ctf.css';

/**
 * CtfPage — the /ctf page body: capture the flag, the hub of the 249 country
 * pages (sn CAPTURETHEFLAG.md §9.2; its design is sn's design/ctf/design.html
 * and its build plan design/ctf/SEO.md §2 and §6), in `lang` (its copy is
 * react/src/i18n/pages/ctf/; English at /ctf, the others at /<lang>/ctf).
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and the Astro page (astro/src/components/routes/
 * CtfRoute.astro) both provide the shell. The page is the epoch's snapshot
 * (data/ctf-epoch.json), so every figure is in the static HTML; the header,
 * how the draw works, the questions and the fine print need no script. The
 * board (ctf/Board.jsx: the live bar and its filters, the visitor's country,
 * Easy wins and the grid) is an island, passed in by the static page as
 * `board` and rendered here by the SPA.
 *
 * `updated` is the day the page's content last changed (the sitemap's
 * lastmod), which only the static build knows.
 */
export default function CtfPage({ lang = 'en', updated = null, board = null }) {
    const m = localModel(CTF, lang);
    const t = ctfCopy(m.lang);
    const f = formats(m.lang);
    return (
        <div className="ctf-page">
            <div className="ctf-shell">
                <header className="ctf-hdr">
                    <div className="ctf-label ctf-label-acc">{t.hub.eyebrow}</div>
                    <h1>{t.program}</h1>
                    <p className="ctf-mission">{t.hub.mission}</p>
                    <p className="ctf-intro">
                        <span className="ctf-answer">{t.hub.answer}</span>{t.gap}
                        {m.phase === 'prelaunch' && rich(t.hub.starts, { first: m.firstEpoch, clock: f.utcClock(m.startsAt), day: f.utcDay(m.startsAt) })}
                        {rich(t.hub.intro, { rule: defaultWinRule(m) })}
                    </p>
                </header>

                {board || <Board lang={lang} />}

                <HowItWorks m={m} />
                <HubQuestions m={m} />
                <FinePrint m={m} updated={updated} />
            </div>
        </div>
    );
}

export function HowItWorks({ m }) {
    const t = ctfCopy(m.lang).how;
    return (
        <section id="how" className="ctf-sec ctf-how" aria-labelledby="ctf-how-h">
            <h2 id="ctf-how-h" className="ctf-h2">{t.title}</h2>
            <div className="ctf-steps">
                {t.steps.map((step, i) => <div className="ctf-step" key={step.title}><b>{`0${i + 1}`}</b><h3>{step.title}</h3><p>{step.body}</p></div>)}
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
    const t = ctfCopy(m.lang).worth;
    const f = formats(m.lang);
    return m.slot !== null
        ? rich(t.slot, { slot: f.alpha(m.slot, 3) })
        : rich(t.scale, { slot: f.alpha(EPOCH4_SLOT_RAO, 3) });
}

function HubQuestions({ m }) {
    const t = ctfCopy(m.lang).hubFaq;
    const f = formats(m.lang);
    const live = m.phase !== 'prelaunch';
    const links = {
        ext: (kids) => <a href={pagePath(m.lang, EXTENDER_URL)}>{kids}</a>,
        api: (kids) => <a href={API_STATE}>{kids}</a>,
        spec: (kids) => <a href={OPERATOR_YML}>{kids}</a>,
        code: (kids) => <code>{kids}</code>,
    };
    return (
        <Questions
            title={t.title}
            items={[
                [t.whatQ, rich(t.whatA, { starts: !live && rich(t.whatStarts, { first: m.firstEpoch, clock: f.utcClock(m.startsAt), day: f.utcDay(m.startsAt) }) })],
                [t.winQ, m.drawn ? t.winDrawn : t.winOpen],
                [t.earnQ, rich(t.earnA, { worth: slotWorth(m) })],
                [t.passiveQ, t.passiveA],
                [t.rolesQ, rich(t.rolesA, {}, links)],
                [t.fairQ, t.fairA],
                [t.agentsQ, rich(t.agentsA, { lead: live ? t.agentsLive : interpolate(t.agentsSoon, { first: m.firstEpoch }) }, links)],
            ]}
        />
    );
}

/** The fine print under every capture the flag page. */
export function FinePrint({ m, updated }) {
    const all = ctfCopy(m.lang);
    const t = all.fine;
    const f = formats(m.lang);
    const links = {
        api: (kids) => <a href={API_STATE}>{kids}</a>,
        ur: (kids) => <a href="https://ur.io">{kids}</a>,
        mail: (kids) => <a href="mailto:support@ur.xyz">{kids}</a>,
        method: (kids) => <a href={METHOD_URL}>{kids}</a>,
        source: (kids) => <a href={SOURCE_URL}>{kids}</a>,
        lic: (kids) => <a href={FLAGS_LICENSE}>{kids}</a>,
        time: (kids) => <time dateTime={updated}>{kids}</time>,
    };
    return (
        <footer className="ctf-foot">
            {m.potsKnown
                ? <p>{rich(t.estimate, { slot: f.alpha(m.slot, 3) }, links)}</p>
                : <p>{rich(t.published, { first: m.firstEpoch }, links)}</p>}
            <p id="chance-to-win">{rich(t.chance, { drawn: m.drawn && t.chanceDrawn })}</p>
            <p>{t.disclosure}</p>
            <p>{rich(t.operator, {}, links)}</p>
            <p>
                {t.data}
                {m.presence && rich(t.dataPresence, { day: f.dayName(m.presence.day) })}
                {all.gap}{rich(t.flags, {}, links)}
                {updated && rich(t.updated, { day: updated }, links)}
            </p>
        </footer>
    );
}
