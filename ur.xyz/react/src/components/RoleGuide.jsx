import React from 'react';
import { EXTERNAL, isExternal } from '../lib/links.js';
import { groupPageHref } from '../../../astro/src/lib/route-localization.js';
import './RoleGuide.css';

// The static explanation on a role page (/miners, /validators, /operators):
// a question-shaped heading, the answers under it (what you run, what you
// need, where the rewards come from, how to start) and the guides that go
// deeper. Plain server-rendered HTML in the Astro shells and the same markup
// in the SPA sections, so search engines and agents read it without scripts.
// Every fact in the copy is one the role's guide states (docs/<role>/).
//
//   block: { title, items: [{ title, body, link?: { label, href } }],
//            compared?: { label, links: [{ label, href }] },
//            guidesTitle?, guides?: [{ label, href }] }
// `compared` (the miners' only) is one line linking the comparison pages
// under /docs/compare.
// The role guides every role page lists: the three role guides, the miner's
// rewards chapter (where the rewards come from) and the litepaper.
export function roleGuideBlock(t, section) {
    const block = t[section]?.guide;
    if (!block) return null;
    const g = t.roleGuides;
    return {
        ...block,
        guidesTitle: g.title,
        guides: [
            { label: g.miner, href: '/docs/miner' },
            { label: g.rewards, href: '/docs/miner/rewards' },
            { label: g.validator, href: '/docs/validator' },
            { label: g.operator, href: '/docs/operator' },
            { label: g.litepaper, href: '/docs/litepaper' },
        ],
    };
}

export default function RoleGuide({ block, id, lang = 'en' }) {
    if (!block) return null;
    const local = (href) => groupPageHref(href, lang) || href;
    const attrs = (href) => (isExternal(href) ? EXTERNAL : {});
    return (
        <section className="role-guide" id={id} aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`} className="role-guide-title">{block.title}</h2>
            <div className="role-guide-items">
                {block.items.map((item) => (
                    <div className="role-guide-item" key={item.title}>
                        <h3>{item.title}</h3>
                        <p>
                            {item.body}
                            {item.link && (
                                <>
                                    {' '}
                                    <a href={local(item.link.href)} {...attrs(item.link.href)}>{item.link.label}</a>
                                </>
                            )}
                        </p>
                    </div>
                ))}
            </div>
            {block.compared?.links?.length > 0 && (
                <p className="role-guide-compared">
                    {block.compared.label}:{' '}
                    {block.compared.links.map((l, i) => (
                        <React.Fragment key={l.href}>
                            {i > 0 && ', '}
                            <a href={local(l.href)} {...attrs(l.href)}>{l.label}</a>
                        </React.Fragment>
                    ))}
                </p>
            )}
            {block.guides?.length > 0 && (
                <nav className="role-guide-guides" aria-label={block.guidesTitle}>
                    <h3>{block.guidesTitle}</h3>
                    <ul>
                        {block.guides.map((g) => (
                            <li key={g.href}><a href={local(g.href)} {...attrs(g.href)}>{g.label}</a></li>
                        ))}
                    </ul>
                </nav>
            )}
        </section>
    );
}
