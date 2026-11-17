import React from 'react';
import { TOC, tocPlace } from './model';
import { useActiveEntry } from './active';
import { pageCopy } from './copy';

/**
 * The sections of the research report as a nested list of links, the one
 * being read marked (aria-current). Plain anchors, so it works before and
 * without hydration; the page scrolls smoothly unless the visitor asked for
 * reduced motion (App.css).
 */
export function TocList({ section, onPick, lang = 'en' }) {
    const { group } = tocPlace(section);
    const labels = pageCopy(lang).toc.labels;
    return (
        <ol className="rr-toc-list">
            {TOC.map((g) => (
                <li key={g.id} className={g.id === group.id ? 'is-current' : undefined}>
                    <a href={`#${g.id}`} aria-current={section === g.id ? 'location' : undefined} onClick={onPick}>{labels[g.id]}</a>
                    {g.items.length > 0 && (
                        <ol>
                            {g.items.map((it) => (
                                <li key={it.id}>
                                    <a href={`#${it.id}`} aria-current={section === it.id ? 'location' : undefined} onClick={onPick}>{labels[it.id]}</a>
                                </li>
                            ))}
                        </ol>
                    )}
                </li>
            ))}
        </ol>
    );
}

/** The sidebar of sections, sticky in the left margin on wide screens (the right in Arabic). */
export default function ReportToc({ lang = 'en' }) {
    const { section } = useActiveEntry();
    const t = pageCopy(lang).toc;
    return (
        <nav className="rr-toc-inner" aria-label={t.title}>
            <p className="rr-toc-title">{t.title}</p>
            <TocList section={section} lang={lang} />
        </nav>
    );
}
