import React from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { rich } from './rich.jsx';
import {
    AnnouncementSummary, AnnouncementToolbar, Letterhead, SheetDate, SheetDisclosure, docCopy, groupCopy,
} from './shared.jsx';
import './InvestorAnnouncement.css';

/**
 * The conviction-lock announcement (/investors/conviction-lock): a summary
 * header over the announcement itself, reproduced as a white sheet. Static;
 * the Astro page server-renders it without hydration.
 *
 * Named explicitly rather than read from `featured`: this is the conviction
 * announcement whatever the Investor Centre leads with next.
 *
 * The text is react/src/i18n/pages/investors/conviction-lock/ in the page's
 * language; the PDF is the announcement as published, in English.
 */
const announcement = investorCentre.convictionAnnouncement;
const copy = await loadPageCopy('investors/conviction-lock');

export default function InvestorAnnouncement({ lang = 'en' }) {
    const t = copy(lang);
    const doc = docCopy(groupCopy(lang), announcement);
    return (
        <div className="announcement-page" id="announcement">
            <AnnouncementToolbar lang={lang} pdfHref={announcement.pdfHref} />
            <AnnouncementSummary lang={lang} doc={announcement} heading={doc.headline} />

            <div className="announcement-stage">
                <article className="announcement-paper" aria-labelledby="announcement-title">
                    <Letterhead lang={lang} />

                    <SheetDate lang={lang} doc={announcement} />

                    <h2 className="announcement-document-title" id="announcement-title">
                        {t.documentTitle}
                    </h2>

                    <section className="announcement-document-section" aria-labelledby="announcement-highlights">
                        <h3 id="announcement-highlights">{t.highlightsHeading}</h3>
                        <ul>
                            {t.highlights.map((item) => <li key={item}>{rich(item)}</li>)}
                        </ul>
                    </section>

                    {t.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

                    <section className="announcement-document-section" aria-labelledby="brien-colwell">
                        <h3 id="brien-colwell">{t.brien.heading}</h3>
                        <blockquote>
                            <p>{t.brien.quote}</p>
                        </blockquote>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="keith-singery">
                        <h3 id="keith-singery">{t.keith.heading}</h3>
                        <blockquote>
                            <p>{t.keith.quote}</p>
                        </blockquote>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="about-sn25">
                        <h3 id="about-sn25">{t.aboutHeading}</h3>
                        {t.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </section>

                    <SheetDisclosure lang={lang} extra={t.figuresAsAt} />
                </article>
            </div>
        </div>
    );
}
