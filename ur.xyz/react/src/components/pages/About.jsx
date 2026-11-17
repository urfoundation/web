import React, { useEffect, useRef } from 'react';
import Section from '../Section';
import { contributors } from '../../data/contributors';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { interpolate } from '../../i18n/format.js';
import { parts } from './copyParts.js';
import './About.css';

const copy = await loadPageCopy('about');

/**
 * AboutPage — the /about page body.
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage (App.jsx) and the Astro page (astro/src/pages/about.astro)
 * both provide the Disclaimer + Nav + Footer shell around it, so the two
 * renders share one source. Its words are the `about` copy unit
 * (react/src/i18n/pages/about/), in the page's language `lang`.
 *
 * Nothing here touches window/document during render — Astro server-renders
 * the component; the scroll-reveal behaviour lives in the effect below.
 */
export default function AboutPage({ lang = 'en' }) {
    const rootRef = useRef(null);
    const t = copy(lang);
    const [beforeLink, afterLink] = parts(t.protocol.body, 'link');

    // Scroll-reveal for the contributor rows: outside reduced motion, the
    // rows start hidden (html.has-reveal-motion, see About.css) and fade up
    // as they enter the viewport. Ported from the page's former inline script.
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        const revealItems = [...root.querySelectorAll('[data-reveal]')];
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window) || revealItems.length === 0) return undefined;

        document.documentElement.classList.add('has-reveal-motion');
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealItems.forEach((item) => revealObserver.observe(item));

        return () => {
            revealObserver.disconnect();
            // the SPA keeps the document across routes; leave no page class behind
            document.documentElement.classList.remove('has-reveal-motion');
        };
    }, []);

    return (
        <div className="about-page" ref={rootRef}>
            <Section id="about-ur" eyebrow={t.protocol.eyebrow} title={t.protocol.title} headingLevel="h1">
                <div className="about-ur-copy">
                    <p>
                        {beforeLink}<a href="https://ur.io" target="_blank" rel="noopener noreferrer">ur.io</a>{afterLink}
                    </p>
                </div>
            </Section>

            <Section id="core-contributors" eyebrow={t.people.eyebrow} title={t.people.title}>
                <div className="core-contributor-list" aria-label={t.people.listAria}>
                    {contributors.map((person, index) => {
                        const { role, detail } = t.contributors[index];
                        return (
                            <article key={person.id} className="core-contributor" data-reveal="">
                                <div className="core-contributor__portrait">
                                    <img
                                        src={person.image}
                                        srcSet={person.imageSrcSet}
                                        sizes="(max-width: 520px) 72px, (max-width: 820px) 84px, 96px"
                                        alt={interpolate(t.people.portraitAlt, { name: person.name, role })}
                                        width="400"
                                        height="400"
                                        loading={index === 0 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                </div>
                                <div className="core-contributor__identity">
                                    <h3>{person.name}</h3>
                                    <p>{role}</p>
                                    <a href={person.href} target="_blank" rel="noopener noreferrer" aria-label={interpolate(t.people.profileAria, { name: person.name, platform: person.platform })}>
                                        {person.platform} <span aria-hidden="true">↗</span>
                                    </a>
                                </div>
                                <p className="core-contributor__bio">{detail}</p>
                            </article>
                        );
                    })}
                </div>
            </Section>

            <Section id="contribute" eyebrow={t.contribute.eyebrow} title={t.contribute.title}>
                <div className="contribute-cta">
                    <p>{t.contribute.body}</p>
                    <a href="https://t.me/ursn25" target="_blank" rel="noopener noreferrer" aria-label={t.contribute.ctaAria}>
                        <span>{t.contribute.ctaLine1}</span>
                        <span>{`${t.contribute.ctaLine2} `}<i aria-hidden="true">↗</i></span>
                    </a>
                </div>
            </Section>
        </div>
    );
}
