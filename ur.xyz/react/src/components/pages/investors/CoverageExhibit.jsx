import React from 'react';
import { loadPageCopy } from '../../../i18n/page-copy.js';

const copy = await loadPageCopy('investors/our-letter-to-bittensor');

// The letter's coverage exhibit: the same world map twice, before and after
// an incentive market spreads the miners out. Static. The panel titles are
// captions inside the figure, not headings: as <h3>s they sat under the
// letter's <h1> before its first <h2>, a skipped level in the page outline.
// Its words are the letter unit's (react/src/i18n/pages/investors/
// our-letter-to-bittensor/, `coverage`), in the page's language.
export default function CoverageExhibit({ lang = 'en' }) {
    const t = copy(lang).coverage;
    return (
        <figure className="letter-exhibit letter-coverage-exhibit">
            <figcaption className="letter-exhibit__heading">
                <strong>{t.heading}</strong>
                <small>{t.subheading}</small>
            </figcaption>

            <div className="coverage-comparison">
                <section className="coverage-panel">
                    <p className="coverage-panel__eyebrow">{t.before.eyebrow}</p>
                    <strong className="coverage-panel__title">{t.before.title}</strong>
                    <p>{t.before.text}</p>
                    <svg className="coverage-map" viewBox="0 0 360 170" role="img" aria-label={t.before.mapAria}>
                        <defs>
                            <pattern id="coverage-dots-before" width="7" height="7" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.3" fill="currentColor" />
                            </pattern>
                        </defs>
                        <g className="coverage-map__land">
                            <path d="M18 36 40 18 78 14 108 27 118 46 103 58 91 67 80 91 62 92 54 75 36 70 22 55Z" />
                            <path d="m92 95 18 8 11 18-7 28-15 18-8-22-10-24Z" />
                            <path d="m150 31 27-15 59 3 23 12 37 2 44 24-19 20-31-1-19 12-24-4-16-18-15 9-11-9-17 4-19-14Z" />
                            <path d="m177 79 28 5 18 20-6 35-20 24-18-19-10-36Z" />
                            <path d="m288 120 24-8 29 12-4 19-31 5-19-12Z" />
                        </g>
                        <g className="coverage-map__routes">
                            <path d="M72 57 Q174 125 277 91" />
                            <path d="M83 52 Q178 116 286 86" />
                            <path d="M66 63 Q174 132 293 93" />
                        </g>
                        <g className="coverage-map__nodes">
                            <circle cx="58" cy="55" r="3" /><circle cx="69" cy="49" r="3" /><circle cx="78" cy="59" r="3" />
                            <circle cx="88" cy="53" r="3" /><circle cx="64" cy="67" r="3" /><circle cx="82" cy="70" r="3" />
                            <circle cx="274" cy="86" r="3" /><circle cx="285" cy="91" r="3" /><circle cx="293" cy="84" r="3" />
                            <circle cx="302" cy="94" r="3" /><circle cx="281" cy="101" r="3" /><circle cx="310" cy="86" r="3" />
                        </g>
                    </svg>
                </section>

                <section className="coverage-panel coverage-panel--after">
                    <p className="coverage-panel__eyebrow">{t.after.eyebrow}</p>
                    <strong className="coverage-panel__title">{t.after.title}</strong>
                    <p>{t.after.text}</p>
                    <svg className="coverage-map" viewBox="0 0 360 170" role="img" aria-label={t.after.mapAria}>
                        <defs>
                            <pattern id="coverage-dots-after" width="7" height="7" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.3" fill="currentColor" />
                            </pattern>
                        </defs>
                        <g className="coverage-map__land">
                            <path d="M18 36 40 18 78 14 108 27 118 46 103 58 91 67 80 91 62 92 54 75 36 70 22 55Z" />
                            <path d="m92 95 18 8 11 18-7 28-15 18-8-22-10-24Z" />
                            <path d="m150 31 27-15 59 3 23 12 37 2 44 24-19 20-31-1-19 12-24-4-16-18-15 9-11-9-17 4-19-14Z" />
                            <path d="m177 79 28 5 18 20-6 35-20 24-18-19-10-36Z" />
                            <path d="m288 120 24-8 29 12-4 19-31 5-19-12Z" />
                        </g>
                        <g className="coverage-map__routes">
                            <path d="M72 57 Q172 118 277 91" /><path d="M78 57 Q133 76 179 52" />
                            <path d="M179 52 Q224 83 267 70" /><path d="M109 110 Q158 105 190 90" />
                            <path d="M190 90 Q234 110 280 86" /><path d="M211 61 Q253 50 302 59" />
                            <path d="M301 130 Q287 103 277 91" /><path d="M115 80 Q139 100 175 112" />
                        </g>
                        <g className="coverage-map__nodes">
                            <circle cx="58" cy="55" r="3" /><circle cx="78" cy="59" r="3" /><circle cx="95" cy="45" r="3" />
                            <circle cx="106" cy="111" r="3" /><circle cx="112" cy="132" r="3" /><circle cx="168" cy="49" r="3" />
                            <circle cx="181" cy="55" r="3" /><circle cx="190" cy="92" r="3" /><circle cx="200" cy="118" r="3" />
                            <circle cx="223" cy="62" r="3" /><circle cx="247" cy="71" r="3" /><circle cx="272" cy="86" r="3" />
                            <circle cx="292" cy="80" r="3" /><circle cx="308" cy="61" r="3" /><circle cx="311" cy="133" r="3" />
                        </g>
                    </svg>
                </section>
            </div>
        </figure>
    );
}
