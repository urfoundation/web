import React from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { formatDate } from '../../../i18n/format.js';
import { rich } from './rich.jsx';
import { TranslationNotice, docCopy, groupCopy, pagePath } from './shared.jsx';
import CoverageExhibit from './CoverageExhibit';
import SubnetFlowExhibit from './SubnetFlowExhibit';
import NetworkStackExhibit from './NetworkStackExhibit';
import './InvestorLetter.css';

/**
 * Our Letter to Bittensor in translation (/<lang>/investors/our-letter-to-bittensor):
 * InvestorLetter.jsx's page, its words from react/src/i18n/pages/investors/
 * our-letter-to-bittensor/ in the page's language, with the notice that the
 * English is the authoritative version.
 *
 * InvestorLetter.jsx stays the English page: the letter's PDF is printed from
 * it, and the seo-audit dates the PDF against that file, so the English letter
 * keeps its own text. investors.test.mjs renders this component in English
 * and requires InvestorLetter.jsx's markup exactly, so the copy unit's English
 * and the published letter cannot drift apart.
 */
const { letter } = investorCentre;
const copy = await loadPageCopy('investors/our-letter-to-bittensor');

export default function InvestorLetterTranslation({ lang = 'en' }) {
    const t = copy(lang);
    const shared = groupCopy(lang);
    const doc = docCopy(shared, letter);
    const english = lang === 'en';
    const links = {
        research: (words) => <a href={pagePath(lang, '/research')}>{words}</a>,
        urio: (words) => <a href="https://ur.io">{words}</a>,
    };
    const paragraphs = (list) => list.map((paragraph) => <p key={paragraph}>{rich(paragraph, links)}</p>);
    return (
        <div className="investor-letter-page" id="letter">
            <div className="letter-shell letter-back-row">
                <a className="letter-back" href={pagePath(lang, '/investors')}><span aria-hidden="true">←</span>{` ${shared.investorCentre}`}</a>
            </div>

            <header className="letter-heading letter-shell">
                {/* Print only, as on the English page. */}
                <div className="letter-masthead" aria-hidden="true">
                    <img src="/ur.svg" alt="" className="letter-masthead__mark" />
                    <span>{`${shared.investorCentre} · ur.xyz/investors`}</span>
                </div>
                <p className="letter-kicker">{doc.title}</p>
                <h1>{doc.title}</h1>
                <div className="letter-meta">
                    <time dateTime={letter.dateIso}>{formatDate(letter.dateIso, lang, { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                    <span>{doc.readTime}</span>
                    <a className="letter-download" href={letter.pdfHref} download hrefLang={english ? undefined : 'en'}>
                        {`${english ? shared.downloadPdf : shared.downloadPdfEnglish} `}<i aria-hidden="true">↓</i>
                    </a>
                </div>
                <TranslationNotice lang={lang} text={shared.translation.document} href={letter.href} />
            </header>

            <article className="letter-body">
                <p className="letter-salutation">{t.salutation}</p>

                {paragraphs(t.opening)}

                <hr className="letter-divider" />

                {paragraphs(t.sweden)}

                <CoverageExhibit lang={lang} />

                {paragraphs(t.market)}

                <h2>{t.subnet.heading}</h2>

                {paragraphs(t.subnet.paragraphs)}

                <SubnetFlowExhibit lang={lang} />

                <p>{t.subnet.operators}</p>

                <NetworkStackExhibit lang={lang} />

                {paragraphs(t.subnet.outlook)}

                <hr className="letter-divider" />

                <h2>{t.openInternet.heading}</h2>

                {paragraphs(t.openInternet.paragraphs)}

                <hr className="letter-divider" />

                {paragraphs(t.closing)}

                <p className="letter-sign-off">{rich(t.signOff)}</p>
            </article>

            <nav className="letter-end" aria-label={shared.returnToCentre}>
                <a href={pagePath(lang, '/investors')}><span aria-hidden="true">←</span>{` ${shared.backToCentre}`}</a>
            </nav>

            <aside className="letter-disclosure" aria-label={shared.disclaimerAria}>
                {shared.disclosure}
            </aside>
        </div>
    );
}
