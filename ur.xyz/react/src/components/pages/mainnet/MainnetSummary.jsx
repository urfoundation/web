import React from 'react';
import { useClock } from '../../../lib/network.js';
import { interpolate } from '../../../i18n/format.js';
import { axisNow } from './summary.js';
import { runs } from './timeline.js';

// "now" moves about a pixel an hour on a desktop axis: a minute's tick is plenty
const CLOCK_TICK_MS = 60_000;

/**
 * MainnetSummary — the launch at a glance, above the /mainnet milestones: the
 * payout epochs as bands on one horizontal axis, the key milestones numbered
 * on it and listed beneath, each linking to its milestone on the page, and
 * "now". `model` is summary.js summaryModel(): plain data, so the Astro page
 * can compute it at build time and hand it to this component as an island.
 *
 * The clock is null in the static render and in the first render after
 * hydration (lib/network.js useClock), so the two agree; "now", and the
 * progress up to it, appear on the next tick, as the landing page's epoch
 * clock does. Everything else is static, and reads the same without script.
 * Its words are the model's (`model.t`), in the page's language, so the
 * island loads no copy of its own.
 */
export default function MainnetSummary({ model }) {
    const clock = useClock(CLOCK_TICK_MS);
    const now = axisNow(model, clock);
    const pin = now ? now.pin : null;
    const words = model.t.summary;
    const arrow = model.t.labels.arrow;

    return (
        <div className="mainnet-summary" data-lanes={model.lanes}>
            <h2 className="mainnet-summary-title" id="glance-heading">{words.title}</h2>
            <figure className="mainnet-summary-figure" aria-labelledby="glance-heading">
                <ol className="mainnet-summary-bands" aria-label={words.figureAria}>
                    {model.bands.map((band, index) => {
                        // the band's milestones in date order, the spans among the
                        // markers, so the tab order follows the axis
                        const items = [
                            ...model.markers.filter((m) => m.band === index).map((mark) => ({ at: mark.at, mark })),
                            ...model.spans.flatMap((span) => span.segments
                                .map((segment, part) => ({ at: segment.from, span, segment, part }))
                                .filter(({ segment }) => segment.band === index)),
                        ].sort((a, b) => a.at - b.at);
                        return (
                            <li
                                key={band.group}
                                className="mainnet-summary-band"
                                data-settlement={band.settlement}
                                data-tail={band.tail ? '' : undefined}
                                data-week={band.short ? undefined : ''}
                                style={{ '--hours': band.hours }}
                            >
                                <div className="mainnet-summary-box">
                                    <span className="mainnet-summary-name">
                                        {band.short
                                            ? <><span aria-hidden="true">{band.short}</span><span className="mainnet-visually-hidden">{band.name}</span></>
                                            // a week on the narrowest screens: "E5", over the full name a screen reader reads
                                            : <><span className="mainnet-summary-name-full">{band.name}</span><span className="mainnet-summary-name-abbr" aria-hidden="true">{band.abbr}</span></>}
                                    </span>
                                    <span className="mainnet-visually-hidden">: </span>
                                    <span className="mainnet-summary-days">
                                        {/* the tail's first day, read as "from Nov 27" and drawn running on */}
                                        {band.tail
                                            ? runs(words.from, { days: DAYS }).map((part, i) => (part === DAYS
                                                ? <React.Fragment key={i}>{band.days}</React.Fragment>
                                                : <span key={i} className="mainnet-visually-hidden">{part}</span>))
                                            : band.days}
                                        {band.tail && <span aria-hidden="true">{` ${arrow}`}</span>}
                                    </span>
                                    <span className="mainnet-visually-hidden">, {words.settledBy[band.settlement] || ''}</span>
                                </div>
                                <span className="mainnet-summary-track" aria-hidden="true">
                                    {now && <span className="mainnet-summary-elapsed" style={{ '--elapsed': now.elapsed[index] }} />}
                                </span>
                                {items.length > 0 && (
                                    <ul className="mainnet-summary-marks">
                                        {items.map(({ mark, span, segment, part }) => (mark
                                            ? (
                                                <li key={mark.id} className="mainnet-summary-mark" data-lane={mark.lane} style={{ '--at': mark.at }}>
                                                    <a className="mainnet-summary-dot" data-look={mark.look} href={`#${mark.id}`} aria-label={mark.label} title={mark.label}>{mark.n}</a>
                                                </li>
                                            )
                                            : (
                                                // a span across its days; one that crosses into this band from the last links there
                                                <li key={`${span.id}-${part}`} className="mainnet-summary-window" aria-hidden={part > 0 ? 'true' : undefined} style={{ '--from': segment.from, '--to': segment.to }}>
                                                    {part === 0
                                                        ? <a className="mainnet-summary-span" data-look={span.look} href={`#${span.id}`} aria-label={span.label} title={span.label} />
                                                        : <span className="mainnet-summary-span" data-look={span.look} />}
                                                </li>
                                            )))}
                                    </ul>
                                )}
                                {pin && pin.band === index && (
                                    <div className="mainnet-summary-now" data-flip={pin.flip ? '' : undefined} style={{ '--at': pin.at }}>
                                        <span className="mainnet-summary-now-label">{words.now}</span>
                                        <span className="mainnet-visually-hidden">
                                            {': '}
                                            {pin.epoch != null
                                                ? interpolate(words.nowIn, { time: pin.text, percent: Math.floor(pin.progress * 100), number: pin.epoch })
                                                : interpolate(words.nowAt, { time: pin.text })}
                                        </span>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
                <figcaption className="mainnet-summary-legend">
                    <ul aria-label={words.bandsAria}>
                        {model.settlements.map(({ settlement, label }) => (
                            <li key={settlement}><span className="mainnet-summary-swatch" data-settlement={settlement} aria-hidden="true" />{label}</li>
                        ))}
                        {model.spans.map((span) => (
                            <li key={span.id}><span className="mainnet-summary-swatch" data-span={span.look} aria-hidden="true" />{runs(words.legendSpan, { title: span.title, days: span.days })}</li>
                        ))}
                    </ul>
                    <ul aria-label={words.markersAria}>
                        <li><span className="mainnet-summary-swatch" data-now="" aria-hidden="true" />{words.now}</li>
                        {model.looks.map(({ look, label }) => (
                            <li key={look}><span className="mainnet-summary-dot" data-look={look} aria-hidden="true" />{label}</li>
                        ))}
                    </ul>
                </figcaption>
            </figure>
            <ol className="mainnet-summary-dates" aria-label={words.datesAria}>
                {model.markers.map((mark) => (
                    <li key={mark.id}>
                        <a href={`#${mark.id}`} className="mainnet-summary-date">
                            <span className="mainnet-summary-dot" data-look={mark.look} aria-hidden="true">{mark.n}</span>
                            <span className="mainnet-summary-date-meta">
                                <time className="mainnet-summary-day" dateTime={mark.dateTime}>{mark.day}</time>{' '}
                                <span className="roadmap-flag" data-status={mark.status}>{mark.statusLabel}</span>
                            </span>
                            <span className="mainnet-summary-date-title">{mark.title}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// where the tail's days go in summary.from
const DAYS = Symbol('days');
