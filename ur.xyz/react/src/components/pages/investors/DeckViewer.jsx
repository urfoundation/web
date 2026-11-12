import React, { useEffect, useRef, useState } from 'react';
import { investorCentre } from '../../../data/investors';
import { loadPageCopy } from '../../../i18n/page-copy.js';
import { interpolate, plural } from '../../../i18n/format.js';
import { rich } from './rich.jsx';
import { TranslationNotice, docDate, groupCopy, pagePath } from './shared.jsx';
import './DeckViewer.css';

/**
 * The investor deck (/investors/deck), viewable in the browser. Slides are
 * served as images from /investors/deck/, so viewing the deck downloads
 * nothing but the page's own assets: no third-party embed, and nothing that
 * would put a Google host into the network-privacy test's contacted-hosts
 * list.
 *
 * The slide is the page: a compact heading, then a stage sized so the slide
 * and its control bar fit in one screen, a filmstrip under it that scrolls to
 * keep the current slide in the middle, then the deck's text as a collapsed
 * outline.
 *
 * Only the slides either side of the current one are in the stage. The
 * slides sit stacked in one stage, so a hidden slide is still "in the
 * viewport" and loading="lazy" never deferred it: every slide downloaded with
 * the page. Now slide 1 loads first (fetchpriority high), its neighbours
 * quietly behind it, and each move brings in the next one. Keeping the
 * previous slide mounted is what lets a move crossfade instead of flashing the
 * empty stage. Every slide offers a 1280 px and a 2560 px file; the filmstrip
 * uses the 480 px thumbnails, lazy-loaded as they scroll into view.
 *
 * The first slide and its controls are rendered from props and the initial
 * state, so the server render (the Astro page hydrates this component) and
 * the first client render agree; the deep link in the hash, the keyboard and
 * fullscreen are applied in effects and handlers.
 *
 * The deck's text (each slide's title, headline, alt text and summary, and the
 * controls) is react/src/i18n/pages/investors/deck/ in the page's language;
 * the slides and the PDF are the English deck. On a right-to-left page the
 * viewer and the filmstrip stay left to right, like the slides they show.
 */

const { deck } = investorCentre;
const total = deck.slideCount;
// the thumbnail width `make deck-slides` renders (WIDTHS in
// scripts/generate-deck-slides.mjs)
const THUMB_WIDTH = 480;
const pad = (n) => String(n).padStart(2, '0');
const clamp = (n) => Math.min(Math.max(n, 1), total);
const file = (n, width) => `${deck.slideBase}/${pad(n)}${width === deck.slideWidth ? '' : `-${width}`}.${deck.slideExt}`;
const copy = await loadPageCopy('investors/deck');
const slidesIn = (t) => Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const text = t.slides?.[i] || {};
    return {
        n,
        title: text.title || interpolate(t.untitledSlide, { n }),
        headline: text.headline || '',
        summary: text.summary || '',
        alt: text.alt || interpolate(t.untitledAlt, { n, total }),
        src: file(n, deck.slideWidth),
        thumb: file(n, THUMB_WIDTH),
        srcSet: `${file(n, deck.slideSmallWidth)} ${deck.slideSmallWidth}w, ${file(n, deck.slideWidth)} ${deck.slideWidth}w`,
    };
});
const RTL = new Set(['ar']);
// the stage's width (--deck-frame in DeckViewer.css), for picking a file
const STAGE_SIZES = '(max-width: 767px) calc(100vw - 40px), (max-width: 1244px) calc(100vw - 64px), 1180px';

function slideFromHash() {
    const n = Number(window.location.hash.slice(1));
    return Number.isInteger(n) && n > 0 ? n : 1;
}

export default function DeckViewer({ lang = 'en' }) {
    const t = copy(lang);
    const shared = groupCopy(lang);
    const doc = shared.docs.deck;
    const slides = slidesIn(t);
    const english = lang === 'en';
    // the viewer's own direction on a right-to-left page (see above)
    const viewerDir = RTL.has(lang) ? 'ltr' : undefined;
    const [current, setCurrent] = useState(1);
    const stageRef = useRef(null);
    const stripRef = useRef(null);
    // The keyboard handler is registered once and reads the slide from here.
    const currentRef = useRef(1);
    // How the latest move was asked for: a user move records the slide in the
    // hash and may scroll the strip smoothly; the initial and hash-driven
    // moves do neither.
    const moveRef = useRef({ pushHash: false });

    const show = (n, pushHash = true) => {
        const next = clamp(n);
        moveRef.current = { pushHash };
        currentRef.current = next;
        setCurrent(next);
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else stageRef.current?.requestFullscreen?.();
    };

    // After each move: scroll the filmstrip to keep the current thumbnail in
    // the middle, and record the slide in the hash so the page can be shared
    // open on it.
    useEffect(() => {
        const { pushHash } = moveRef.current;
        const strip = stripRef.current;
        const activeThumb = strip?.children[current - 1];
        if (strip && activeThumb && strip.scrollWidth > strip.clientWidth) {
            const left = activeThumb.offsetLeft - ((strip.clientWidth - activeThumb.offsetWidth) / 2);
            strip.scrollTo({
                left: Math.max(0, left),
                behavior: pushHash && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto',
            });
        }
        if (pushHash) window.history.replaceState(null, '', `#${current}`);
    }, [current]);

    useEffect(() => {
        const onKeydown = (event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const at = currentRef.current;
            if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); show(at + 1); }
            else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); show(at - 1); }
            else if (event.key === 'Home') { event.preventDefault(); show(1); }
            else if (event.key === 'End') { event.preventDefault(); show(total); }
            else if (event.key === 'f' || event.key === 'F') { event.preventDefault(); toggleFullscreen(); }
        };
        // Deep link: /investors/deck#7 opens on that slide. Also honour a hash
        // that changes while the page is open, so following a #7 link from
        // someone who is already here moves the deck instead of doing nothing:
        // that is a same-document navigation and never re-runs an effect.
        const onHashchange = () => show(slideFromHash(), false);

        document.addEventListener('keydown', onKeydown);
        window.addEventListener('hashchange', onHashchange);
        show(slideFromHash(), false);

        return () => {
            document.removeEventListener('keydown', onKeydown);
            window.removeEventListener('hashchange', onHashchange);
        };
    }, []);

    return (
        <div className="deck-page">
            <header className="deck-heading deck-frame">
                <a className="deck-back" href={pagePath(lang, '/investors')}><span aria-hidden="true">←</span>{` ${shared.investorCentre}`}</a>
                <div className="deck-title-row">
                    <h1>{doc.title}</h1>
                    <div className="deck-meta">
                        <time dateTime={deck.dateIso}>{docDate(deck, lang)}</time>
                        <span aria-hidden="true">·</span>
                        <span>{interpolate(plural(lang, deck.slideCount, t.slideCount), { count: deck.slideCount })}</span>
                    </div>
                </div>
                <TranslationNotice lang={lang} text={shared.translation.deck} href={deck.href} />
            </header>

            <div className="deck-frame" dir={viewerDir}>
                <div className="deck-viewport">
                    <div className="deck-stage" id="deck-stage" ref={stageRef}>
                        {/* The current slide on top, its neighbours loading or
                            fading out behind it (invisible, and hidden from
                            assistive tech until shown). Keyed by slide, so a
                            neighbour's element is the one that becomes current. */}
                        {slides.slice(Math.max(0, current - 2), current + 1).map(s => {
                            const shown = s.n === current;
                            return (
                                <img
                                    key={s.n}
                                    className={shown ? 'deck-slide is-current' : 'deck-slide'}
                                    src={s.src}
                                    srcSet={s.srcSet}
                                    sizes={STAGE_SIZES}
                                    alt={s.alt}
                                    aria-hidden={shown ? undefined : 'true'}
                                    data-slide={s.n}
                                    width={deck.slideWidth}
                                    height={deck.slideHeight}
                                    fetchpriority={shown ? (s.n === 1 ? 'high' : undefined) : 'low'}
                                    decoding={s.n === 1 ? undefined : 'async'}
                                />
                            );
                        })}
                        <button className="deck-hit deck-hit--prev" type="button" data-deck-prev="" aria-label={t.previous} disabled={current === 1} onClick={() => show(current - 1)}></button>
                        <button className="deck-hit deck-hit--next" type="button" data-deck-next="" aria-label={t.next} disabled={current === total} onClick={() => show(current + 1)}></button>
                    </div>
                </div>

                <div className="deck-controls">
                    <div className="deck-bar">
                        <button className="deck-arrow" type="button" data-deck-prev="" aria-label={t.previous} disabled={current === 1} onClick={() => show(current - 1)}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
                        </button>
                        <span className="deck-count" data-deck-count="" aria-live="polite">{`${pad(current)} / ${pad(total)}`}</span>
                        <button className="deck-arrow" type="button" data-deck-next="" aria-label={t.next} disabled={current === total} onClick={() => show(current + 1)}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
                        </button>
                        {/* Progress at a glance. The strip below is the way to
                            jump, so this is drawn for the eye only. */}
                        <div className="deck-progress" aria-hidden="true">
                            {slides.map(s => (
                                <span key={s.n} className={s.n === current ? 'is-current' : s.n < current ? 'is-seen' : undefined}></span>
                            ))}
                        </div>
                        <span className="deck-bar-rule" aria-hidden="true"></span>
                        <button className="deck-pill-button" type="button" data-deck-fullscreen="" aria-label={t.fullscreen} onClick={toggleFullscreen}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg>
                        </button>
                        <a className="deck-pill-button deck-download" href={deck.pdfHref} download aria-label={english ? shared.downloadPdf : shared.downloadPdfEnglish} hrefLang={english ? undefined : 'en'}>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" /></svg>
                            <span>{t.pdf}</span>
                        </a>
                    </div>
                </div>

            </div>

            {/* The filmstrip: a few slides either side of the current one,
                big enough to read, to look ahead and jump. A group of jump
                buttons, not a tablist: the slides are not tabpanels, and
                claiming tab semantics without them makes a screen reader
                announce controls it cannot then resolve. */}
            <div className="deck-strip-shell">
                <div className="deck-strip" role="group" aria-label={t.jumpAria} ref={stripRef} dir={viewerDir}>
                    {slides.map(s => (
                        <button
                            key={s.n}
                            className={s.n === current ? 'deck-thumb is-current' : 'deck-thumb'}
                            type="button"
                            data-deck-go={s.n}
                            aria-label={interpolate(t.thumbAria, { n: s.n, title: s.title })}
                            aria-current={s.n === current ? 'true' : undefined}
                            onClick={() => show(s.n)}
                        >
                            <img src={s.thumb} alt="" width={THUMB_WIDTH} height={THUMB_WIDTH * 9 / 16} loading="lazy" decoding="async" />
                            <span className="deck-thumb-label">{pad(s.n)}</span>
                        </button>
                    ))}
                </div>

                <p className="deck-hint">
                    {rich(t.hint, { sep: (dot) => <span aria-hidden="true">{dot}</span> })}
                </p>
            </div>

            {/* The deck as text: what each slide says, for readers who do not
                see the images, for search, and for agents. Collapsed, because
                the slides already say it to everyone else; the text stays in
                the page either way. */}
            <details className="deck-frame deck-outline">
                <summary>
                    <h2>{t.outlineHeading}</h2>
                    <span className="deck-outline-hint">{t.outlineHint}</span>
                    <span className="deck-outline-chevron" aria-hidden="true"></span>
                </summary>
                <ol className="deck-outline-list">
                    {slides.map(s => (
                        <li key={s.n}>
                            <span className="deck-outline-label">{`${pad(s.n)} · ${s.title}`}</span>
                            {s.headline && <h3>{s.headline}</h3>}
                            {s.summary && <p>{s.summary}</p>}
                        </li>
                    ))}
                </ol>
            </details>

            <div className="deck-frame deck-outro">
                <a className="deck-back" href={pagePath(lang, '/investors')}><span aria-hidden="true">←</span>{` ${shared.backToCentre}`}</a>
            </div>
        </div>
    );
}
