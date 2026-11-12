/**
 * The dated notices at the top of /mainnet open and close
 * (components/pages/Mainnet.jsx MainnetNotice). A notice is closed to its
 * header, the dateline and the title with "Expand" and a chevron, until it
 * is opened; its text stays in the HTML, closed with CSS (Mainnet.css), so a
 * search engine and a reader without script still have it, and without
 * script every notice is open (the static route's noscript style).
 *
 * The header is a real button (aria-expanded, aria-controls) inside the
 * notice's h2, so the keyboard and a screen reader open it as any button; a
 * tap anywhere on the card does the same, but a tap on a link inside follows
 * the link, and a click that ends a text selection leaves the card as it is.
 * The SPA keeps each notice's state in React; the static page, which renders
 * the body without React in the browser, runs wireNotices over the same
 * markup (astro/src/components/routes/MainnetRoute.astro). Both decide with
 * the helpers below, so they behave alike.
 */

const NOTICE = '.mainnet-notice';
const TOGGLE = '.mainnet-notice-toggle';

/**
 * Whether a click on a notice's card (event.currentTarget) opens or closes
 * it: a click on its button always does (a pointer, or Enter or Space on the
 * focused button); a click on a link or another control inside does not; nor
 * does the click that ends selecting some of the card's text.
 */
export function togglesNotice(event) {
    const card = event.currentTarget;
    const target = event.target;
    if (!card || !target || typeof target.closest !== 'function') return false;
    if (target.closest(TOGGLE)) return true;
    if (target.closest('a[href], button, input, select, textarea, summary, label')) return false;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    return !(selection && !selection.isCollapsed && card.contains(selection.anchorNode));
}

/** The notice section a URL fragment points at (the notice, or anything inside it), or null. */
export function noticeAt(hash, doc = document) {
    let id = String(hash || '').replace(/^#/, '');
    try {
        id = decodeURIComponent(id);
    } catch {
        return null;
    }
    const target = id ? doc.getElementById(id) : null;
    return target ? target.closest(NOTICE) : null;
}

/**
 * After a notice closes, bring its card back under the nav when its top has
 * scrolled away above: a reader who closes it from the end of a long text
 * would otherwise be left far below it. Smooth, unless motion is reduced.
 */
export function keepNoticeInView(section) {
    const card = section?.querySelector('.mainnet-notice-box');
    if (!card || typeof window === 'undefined') return;
    const nav = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;
    if (card.getBoundingClientRect().top >= nav) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
}

/**
 * The static page's notices: each card opens and closes on its button and on
 * a tap, as the SPA's do, and the notice the address points at
 * (/mainnet#notice, or a fragment inside a notice) opens, on load and when
 * the fragment changes. The state is the section's `data-open` and its
 * button's aria-expanded, which the CSS draws.
 */
export function wireNotices(doc = document) {
    const set = (section, open) => {
        section.toggleAttribute('data-open', open);
        section.querySelector(TOGGLE)?.setAttribute('aria-expanded', String(open));
    };
    for (const section of doc.querySelectorAll(NOTICE)) {
        section.querySelector('.mainnet-notice-box')?.addEventListener('click', (event) => {
            if (!togglesNotice(event)) return;
            const open = !section.hasAttribute('data-open');
            set(section, open);
            if (!open) keepNoticeInView(section);
        });
    }
    const follow = () => {
        const section = noticeAt(window.location.hash, doc);
        if (section) set(section, true);
    };
    follow();
    window.addEventListener('hashchange', follow);
}
