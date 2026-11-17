import React from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { interpolate } from '../../../i18n/format.js';
import { rich } from './rich.jsx';
import {
    AnnouncementSummary, AnnouncementToolbar, Letterhead, SheetDate, SheetDisclosure, docCopy, groupCopy,
} from './shared.jsx';
import './InvestorAnnouncement.css';
import './NetworkCapacityLetter.css';

const letter = investorCentre.capacityLetter;
const copy = await loadPageCopy('investors/funding-network-capacity');

// The supplied October letter and original diagram, with approved copy edits.
// The text is react/src/i18n/pages/investors/funding-network-capacity/ in the
// page's language; the PDF and the diagram's image are the letter as
// published, in English.
export default function NetworkCapacityLetter({ lang = 'en' }) {
    const t = copy(lang);
    const doc = docCopy(groupCopy(lang), letter);
    return (
        <div className="announcement-page" id="announcement">
            <AnnouncementToolbar lang={lang} pdfHref={letter.pdfHref} />
            <AnnouncementSummary lang={lang} doc={letter} heading={doc.title} compact />

            <div className="announcement-stage">
                <article className="announcement-paper announcement-paper--tokenholders announcement-paper--capacity" aria-labelledby="capacity-letter-title">
                    <Letterhead lang={lang} />
                    <SheetDate lang={lang} doc={letter} />
                    <h2 className="announcement-document-title" id="capacity-letter-title">{doc.headline}</h2>

                    <section className="announcement-document-section" aria-labelledby="capacity-introduction">
                        <h3 id="capacity-introduction">{t.introduction.heading}</h3>
                        {t.introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        <ul>
                            {t.introduction.roles.map((item) => <li key={item}>{rich(item)}</li>)}
                        </ul>
                        <p>{t.introduction.closing}</p>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="capacity-working-capital">
                        <h3 id="capacity-working-capital">{t.workingCapital.heading}</h3>
                        {t.workingCapital.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        <figure className="capacity-letter-diagram">
                            <img src="/investors/network-capacity-gap.png" width="1140" height="606" alt={t.workingCapital.diagramAlt} />
                            <figcaption><a href="/investors/network-capacity-gap.png" target="_blank" rel="noopener noreferrer">{t.workingCapital.diagramLink}</a></figcaption>
                        </figure>
                    </section>
                </article>

                <article className="announcement-paper announcement-paper--tokenholders announcement-paper--capacity announcement-paper--continued" aria-label={interpolate(t.page2Aria, { title: doc.headline })}>
                    <section className="announcement-document-section" id="capacity-reserve" aria-label={t.reserve.aria}>
                        <p>{t.reserve.intro}</p>
                        <ul>
                            {t.reserve.uses.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                        {t.reserve.paragraphs.map((paragraph) => <p key={paragraph}>{rich(paragraph)}</p>)}
                    </section>

                    <section className="announcement-document-section" aria-labelledby="capacity-examples">
                        <h3 id="capacity-examples">{t.examples.heading}</h3>
                        <ul>
                            {t.examples.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="capacity-operations">
                        <h3 id="capacity-operations">{t.operations.heading}</h3>
                        <ul>
                            {t.operations.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </section>

                    <section className="announcement-document-section" aria-labelledby="capacity-impact">
                        <h3 id="capacity-impact">{t.impact.heading}</h3>
                        {t.impact.paragraphs.map((paragraph) => <p key={paragraph}>{rich(paragraph)}</p>)}
                    </section>
                    <SheetDisclosure lang={lang} />
                </article>
            </div>
        </div>
    );
}
