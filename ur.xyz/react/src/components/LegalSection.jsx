import React from 'react';
import Section from './Section';
import { useLanguage } from '../i18n';
import { LEGAL_DOCS } from '../data/legal';
import { docIn, docsCopy } from '../lib/docs-i18n';
import { legalRevisedDate, translatedLegal } from '../lib/legal-i18n';
import { interpolate } from '../i18n/format.js';
import './Legal.css';

/**
 * LegalSection — a legal document page (terms | privacy | vdp). The English
 * documents render from the generated react/src/data/legal.js; the canonical
 * text lives in docs/legal/*.md. A translated page (`lang`, once the docs page
 * group is localized) renders the translation from its markdown, says that the
 * English page is the authoritative text and links it, as the static page
 * does (astro/src/components/LegalPage.astro).
 */
export default function LegalSection({ doc, lang = null }) {
    const { t, code: routeCode } = useLanguage();
    const code = lang || routeCode;
    const words = docsCopy(code).legal;
    const translation = code === 'en' ? null : docIn(`legal/${doc}`, code);
    // a translation stands in for its English only once it exists (lib/docs-i18n.js)
    const translated = Boolean(translation?.lang);
    const d = translated ? translatedLegal(translation.content) : LEGAL_DOCS[doc];
    const updated = LEGAL_DOCS[doc].updated
        && interpolate(words.revised, { date: legalRevisedDate(LEGAL_DOCS[doc].updated, translated ? code : 'en') });
    return (
        <Section id={doc} eyebrow={t.legal.eyebrow} title={d.title} headingLevel="h1">
            {translated && (
                <p className="legal-translation-note" role="note">
                    {words.notice} <a href={`/${doc}`} hrefLang="en">{words.english}</a>
                </p>
            )}
            {updated && <p className="legal-updated">{updated}</p>}
            {/* build-time trusted content: our own documents, our own converter */}
            <div className="legal-doc" dangerouslySetInnerHTML={{ __html: d.html }} />
        </Section>
    );
}
