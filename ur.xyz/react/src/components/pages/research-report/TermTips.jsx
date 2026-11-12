import { useEffect } from 'react';
import { hide, isShownFor, show } from './tooltip';
import { pageCopy } from './copy';

/**
 * The glossary terms in the report's text are links to their definitions at
 * the foot of the page, which work without script. This adds the definition
 * beside the term on hover and keyboard focus, and on a touch screen a first
 * tap shows it (with a link to the glossary) instead of jumping away.
 * It renders nothing itself. The definitions are the page copy's `terms`, by
 * the term's anchor id, in the page's language.
 */
export default function TermTips({ lang = 'en' }) {
    useEffect(() => {
        const copy = pageCopy(lang);
        const content = (a) => {
            const d = copy.terms[a.dataset.term];
            return d ? [[d.term, d.def], { href: `#${a.dataset.term}`, label: copy.termTip }] : null;
        };
        const over = (e) => {
            const a = e.target.closest?.('a.rr-term');
            if (!a || e.pointerType === 'touch') return;
            const c = content(a);
            if (c) show(a, ...c);
        };
        const out = (e) => {
            const a = e.target.closest?.('a.rr-term');
            if (a && e.pointerType !== 'touch') hide(a);
        };
        const focus = (e) => {
            const a = e.target.closest?.('a.rr-term');
            const c = a && content(a);
            if (c) show(a, ...c);
        };
        const blur = (e) => { const a = e.target.closest?.('a.rr-term'); if (a) hide(a); };
        const click = (e) => {
            const a = e.target.closest?.('a.rr-term');
            if (!a || !window.matchMedia('(pointer: coarse)').matches || isShownFor(a)) return;
            const c = content(a);
            if (!c) return;
            e.preventDefault();
            show(a, ...c);
        };
        document.addEventListener('pointerover', over);
        document.addEventListener('pointerout', out);
        document.addEventListener('focusin', focus);
        document.addEventListener('focusout', blur);
        document.addEventListener('click', click);
        return () => {
            document.removeEventListener('pointerover', over);
            document.removeEventListener('pointerout', out);
            document.removeEventListener('focusin', focus);
            document.removeEventListener('focusout', blur);
            document.removeEventListener('click', click);
        };
    }, [lang]);
    return null;
}
