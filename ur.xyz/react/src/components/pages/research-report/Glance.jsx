import React, { useRef } from 'react';
import data from '../../../data/research-report-2026-q3.json';
import { daysBetween, rangeEnd } from './model';
import { useWidth } from './active';
import { tipHandlers } from './tooltip';
import Glyph from './Glyph';
import { counted, pageCopy } from './copy';
import { interpolate } from '../../../i18n/format.js';

const ENTRIES = data.entries;
const SPAN = daysBetween(data.period.start, data.period.end);

/**
 * Every entry at a glance, by date: one marker per entry on an Aug 24 to
 * Oct 24 axis, stacked where entries share days, a hairline for an entry that
 * spans several. Each marker is a link to its entry. Drawn at the measured
 * width so the labels stay at their size; the server renders it at 800px.
 * Time runs left to right in every language, as in the meters' charts.
 */
export default function ReportGlance({ lang = 'en' }) {
    const t = pageCopy(lang);
    const ref = useRef(null);
    const W = useWidth(ref, 800);
    const small = W < 600;
    const size = small ? 10 : 12, laneH = size + 5, padL = 8, padR = 8;
    const x = (iso) => padL + (daysBetween(data.period.start, iso) / SPAN) * (W - padL - padR);
    const xs = ENTRIES.map((e) => x(e.iso));
    // an entry's range occupies its lane to its end date, so a later marker does not sit on its line
    const laneOf = [];
    const ends = [];
    ENTRIES.map((e, i) => ({ i, x0: xs[i], x1: rangeEnd(e) ? x(rangeEnd(e)) : xs[i] }))
        .sort((a, b) => a.x0 - b.x0 || a.i - b.i)
        .forEach(({ i, x0, x1 }) => {
            let l = ends.findIndex((end) => x0 - end >= size + 3);
            if (l < 0) { l = ends.length; ends.push(-Infinity); }
            ends[l] = Math.max(x0, x1);
            laneOf[i] = l;
        });
    const lanes = ends.length;
    const H = lanes * laneH + 34, axisY = lanes * laneH + 6;
    const go = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    const axis = t.glance.axis;
    return (
        <div className="rr-glance-chart" ref={ref}>
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label={counted(lang, t.glance.aria, ENTRIES.length)}>
                <line x1={padL} x2={W - padR} y1={axisY} y2={axisY} stroke="rgba(214,230,244,0.28)" />
                {[[axis.aug, data.period.start, 'start'], [axis.sep, '2026-09-01', 'middle'], [axis.oct, '2026-10-01', 'middle'], [axis.end, data.period.end, 'end']].map(([label, iso, anchor]) => (
                    <g key={iso}>
                        <line x1={x(iso)} x2={x(iso)} y1={axisY} y2={axisY + 6} stroke="rgba(214,230,244,0.4)" />
                        <text x={x(iso)} y={axisY + 20} fontSize="10" letterSpacing="0.12em" fill="rgba(214,230,244,0.6)" textAnchor={anchor}>{label}</text>
                    </g>
                ))}
                {ENTRIES.map((e, i) => {
                    const cx = xs[i], cy = axisY - 8 - laneOf[i] * laneH;
                    const end = rangeEnd(e);
                    const x1 = end ? x(end) : cx;
                    const { date, title } = t.entries[e.id];
                    const kind = t.kinds[e.kind].label;
                    return (
                        <g key={e.id}>
                            {x1 - cx > 2 && <line x1={cx} x2={x1} y1={cy} y2={cy} stroke="rgba(214,230,244,0.35)" strokeWidth="1.5" strokeLinecap="round" />}
                            <a href={`#${e.id}`} className="rr-glance-mark" aria-label={interpolate(t.glance.mark, { date, kind, title })}
                                onClick={(ev) => { ev.preventDefault(); go(e.id); history.replaceState(null, '', `#${e.id}`); }}
                                {...tipHandlers(() => [title, interpolate(t.glance.tip, { date, kind })])}>
                                <rect x={cx - 12} y={cy - 12} width="24" height="24" fill="transparent" />
                                <circle className="rr-glance-ring" cx={cx} cy={cy} r={size / 2 + 2.5} fill="none" stroke="transparent" strokeWidth="1.5" />
                                <Glyph kind={e.kind} size={size} className="" x={cx - size / 2} y={cy - size / 2} />
                            </a>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
