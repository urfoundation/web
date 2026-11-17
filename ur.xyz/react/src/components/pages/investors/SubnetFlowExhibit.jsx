import React from 'react';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { rich } from './rich.jsx';

const copy = await loadPageCopy('investors/our-letter-to-bittensor');

// The letter's subnet-flow exhibit: users, the network operator that serves
// them, and the subnet it buys bandwidth from. Static. Its words are the
// letter unit's (react/src/i18n/pages/investors/our-letter-to-bittensor/,
// `flow`), in the page's language; right to left the arrows turn round
// (InvestorLetter.css).
export default function SubnetFlowExhibit({ lang = 'en' }) {
    const t = copy(lang).flow;
    return (
        <figure className="letter-exhibit letter-flow-exhibit">
            <figcaption className="letter-visually-hidden">{t.caption}</figcaption>
            <div className="letter-flow">
                <section className="letter-flow__stage">
                    <strong>{t.users.title}</strong>
                    <span>{t.users.text}</span>
                </section>
                <span className="letter-flow__arrow" aria-hidden="true">→</span>
                <section className="letter-flow__stage">
                    <strong>{t.operator.title}</strong>
                    <span>{t.operator.example}</span>
                    <small>{t.operator.note}</small>
                </section>
                <span className="letter-flow__arrow" aria-hidden="true">→</span>
                <section className="letter-flow__stage letter-flow__stage--core">
                    <strong>{t.subnet.title}</strong>
                    <span>{rich(t.subnet.top)}</span>
                    <span>{rich(t.subnet.longTail)}</span>
                    <small>{t.subnet.note}</small>
                </section>
            </div>
        </figure>
    );
}
