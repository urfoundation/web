import React from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { rich } from './rich.jsx';
import {
    AnnouncementSummary, AnnouncementToolbar, Letterhead, SheetDate, SheetDisclosure, docCopy, groupCopy,
} from './shared.jsx';
import './InvestorAnnouncement.css';

/**
 * The September 2026 letter to tokenholders
 * (/investors/letter-to-tokenholders-september-2026): a summary header over
 * the letter itself, reproduced as two white sheets in the announcement's
 * dress. Static; the Astro page server-renders it without hydration.
 *
 * Named explicitly rather than read from `featured`: this is the September
 * letter whatever the Investor Centre leads with next.
 *
 * The text is react/src/i18n/pages/investors/letter-to-tokenholders-september-2026/
 * in the page's language; the PDF is the letter as sent, in English.
 */
const letter = investorCentre.tokenholderLetter;
const copy = await loadPageCopy('investors/letter-to-tokenholders-september-2026');

const external = (href) => (words) => <a href={href} target="_blank" rel="noopener noreferrer">{words}</a>;
const LINKS = {
    a16z: external('https://a16zcrypto.com/posts/article/privacy-trends-moats-quantum-data-testing/'),
    iran: external('https://www.techradar.com/vpn/vpn-privacy-security/i-have-never-seen-such-a-thing-in-my-life-iran-completely-shuts-down-the-internet-amid-protests-starlink-also-affected'),
};

export default function TokenholderLetter({ lang = 'en' }) {
    const t = copy(lang);
    const doc = docCopy(groupCopy(lang), letter);
    return (
        <div className="announcement-page" id="announcement">
            <AnnouncementToolbar lang={lang} pdfHref={letter.pdfHref} />
            <AnnouncementSummary lang={lang} doc={letter} heading={doc.title} compact />

            <div className="announcement-stage">
                <article className="announcement-paper announcement-paper--tokenholders" aria-labelledby="tokenholder-title">
                    <Letterhead lang={lang} />

                    <SheetDate lang={lang} doc={letter} />

                    <h2 className="announcement-document-title" id="tokenholder-title">{t.documentTitle}</h2>

                    <p>{rich(t.salutation)}</p>

                    {t.opening.map((paragraph) => <p key={paragraph}>{rich(paragraph, LINKS)}</p>)}

                    <section className="announcement-document-section" aria-labelledby="design-of-sn25">
                        <h3 id="design-of-sn25">{t.design.heading}</h3>

                        <p>{rich(t.design.intro)}</p>

                        <ol>
                            {t.design.priorities.map((item) => <li key={item}>{rich(item)}</li>)}
                        </ol>

                        <p>{rich(t.design.iran, LINKS)}</p>

                        <p>{t.design.closing}</p>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="project-meridian">
                        <h3 id="project-meridian">{t.meridian.heading}</h3>

                        <p>{t.meridian.intro}</p>
                    </section>
                </article>

                <article className="announcement-paper announcement-paper--tokenholders announcement-paper--continued" aria-label={t.page2Aria}>
                    <section className="announcement-document-section" aria-label={t.meridian.continuedAria}>
                        <p>{rich(t.meridian.email)}</p>

                        <ol>
                            {t.meridian.features.map((item) => <li key={item}>{item}</li>)}
                        </ol>

                        <p>{t.meridian.vision}</p>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="mycelium-private-internet">
                        <h3 id="mycelium-private-internet">{t.mycelium.heading}</h3>

                        {t.mycelium.paragraphs.map((paragraph) => <p key={paragraph}>{rich(paragraph)}</p>)}
                    </section>

                    <footer className="announcement-signoff">
                        {t.signoff.map((line) => <p key={line}>{line}</p>)}
                    </footer>

                    <SheetDisclosure lang={lang} />
                </article>
            </div>
        </div>
    );
}
