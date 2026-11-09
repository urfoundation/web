import React from 'react';
import Section from '../Section';
import { useLanguage } from '../../i18n';
import { ResearchCompetition, ResearchReportCard, ResearchMethodologyCard, ResearchAreas, ResearchNotes, ResearchFoot } from '../ResearchExtras';

export default function Research() {
    const { t, code } = useLanguage();
    return (
        <Section id="research" eyebrow={t.research.eyebrow} title={t.research.title} headingLevel="h1">
            <ResearchCompetition t={t} lang={code} />
            <p>{t.research.intro}</p>
            <ResearchReportCard t={t} />
            <ResearchMethodologyCard t={t} />
            <ResearchAreas t={t} />
            <ResearchNotes t={t} />
            <ResearchFoot t={t} />
        </Section>
    );
}
