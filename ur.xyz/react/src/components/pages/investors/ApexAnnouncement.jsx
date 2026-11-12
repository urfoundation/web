import React from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { rich } from './rich.jsx';
import {
    AnnouncementSummary, AnnouncementToolbar, Letterhead, SheetDate, SheetDisclosure, docCopy, groupCopy, pagePath,
} from './shared.jsx';
import './InvestorAnnouncement.css';

/**
 * The Apex (SN1) competition announcement (/investors/apex-competition): a
 * summary header over the announcement itself, reproduced as a white sheet in
 * the conviction announcement's dress. Static; the Astro page server-renders
 * it without hydration. Two sheets, split where the PDF turns the page, so the
 * screen reads like the document; print starts each sheet on a new page.
 *
 * Named explicitly rather than read from `featured`: this is the Apex
 * announcement whatever the Investor Centre leads with next.
 *
 * The text is react/src/i18n/pages/investors/apex-competition/ in the page's
 * language; the PDF is the announcement as published, in English.
 */
const announcement = investorCentre.apexAnnouncement;
const copy = await loadPageCopy('investors/apex-competition');

export default function ApexAnnouncement({ lang = 'en' }) {
    const t = copy(lang);
    const doc = docCopy(groupCopy(lang), announcement);
    const links = { research: (words) => <a href={pagePath(lang, '/research')}>{words}</a> };
    return (
        <div className="announcement-page" id="announcement">
            <AnnouncementToolbar lang={lang} pdfHref={announcement.pdfHref} />
            <AnnouncementSummary lang={lang} doc={announcement} heading={doc.headline} />

            <div className="announcement-stage">
                <article className="announcement-paper announcement-paper--tokenholders" aria-labelledby="apex-title">
                    <Letterhead lang={lang} />

                    <SheetDate lang={lang} doc={announcement} />

                    <h2 className="announcement-document-title" id="apex-title">
                        {t.documentTitle}
                    </h2>

                    <section className="announcement-document-section" aria-labelledby="apex-highlights">
                        <h3 id="apex-highlights">{t.highlightsHeading}</h3>
                        <ul>
                            {t.highlights.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </section>

                    {t.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

                    <section className="announcement-document-section" aria-labelledby="apex-problem">
                        <h3 id="apex-problem">{t.problem.heading}</h3>
                        {t.problem.paragraphs.map((paragraph) => <p key={paragraph}>{rich(paragraph, links)}</p>)}
                    </section>
                </article>

                <article className="announcement-paper announcement-paper--tokenholders announcement-paper--continued" aria-label={t.page2Aria}>
                    <section className="announcement-document-section" aria-labelledby="apex-why">
                        <h3 id="apex-why">{t.why.heading}</h3>
                        {t.why.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </section>

                    <section className="announcement-document-section" aria-labelledby="steffen-cruz">
                        <h3 id="steffen-cruz">{t.steffen.heading}</h3>
                        <blockquote>
                            <p>{t.steffen.quote}</p>
                        </blockquote>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="brien-colwell">
                        <h3 id="brien-colwell">{t.brien.heading}</h3>
                        <blockquote>
                            <p>{t.brien.quote}</p>
                        </blockquote>
                    </section>

                    <SheetDisclosure lang={lang} />
                </article>
            </div>
        </div>
    );
}
