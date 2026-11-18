import React from 'react';
import Section from '../Section';
import { groupPageHref } from '../../../../astro/src/lib/route-localization.js';
import { useLanguage } from '../../i18n';
import { ResearchCompetition, ResearchReportCard, ResearchMethodologyCard, ResearchAreas, ResearchNotes, ResearchFoot } from '../ResearchExtras';

export default function Research() {
    const { t, code } = useLanguage();
    return (
        <Section id="research" eyebrow={t.research.eyebrow} title={t.research.title} headingLevel="h1">
            <ResearchCompetition t={t} lang={code} />
            <p>{t.research.intro}</p>
            {t.research.minersLink && <p><a href={groupPageHref('/miners', code) || '/miners'}>{t.research.minersLink}</a></p>}
            <ResearchReportCard t={t} lang={code} />
            <ResearchMethodologyCard t={t} lang={code} />
            <ResearchAreas t={t} />
            <ResearchNotes t={t} lang={code} />
            <ResearchFoot t={t} />
        </Section>
    );
}
