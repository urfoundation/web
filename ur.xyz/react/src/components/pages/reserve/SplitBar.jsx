import React from 'react';
import { formatList, interpolate } from '../../../i18n/format.js';
import { pct } from './format';

/**
 * A part-to-whole bar: the segments in proportion, 2 px of surface between
 * them, and a key beneath with every segment's value and share, so nothing
 * is read from colour alone. Segments with no value stay in the key as a
 * zero and leave the bar. `t` holds the bar's own text templates (its
 * accessible name and the segments' tooltips: the balance unit's
 * splits.bar), `lang` the page's language for the shares.
 */
export default function SplitBar({ title, meta, segments, fmt, note, showPercentages = true, t, lang = 'en' }) {
    const total = segments.reduce((s, x) => s + Math.max(0, x.value || 0), 0);
    const shown = segments.filter((s) => (s.value || 0) > 0);
    const share = (v) => (total > 0 ? v / total : 0);
    const pctOf = (v) => pct(share(v), 1, lang);
    const items = segments.map((s) => interpolate(t.segment, { label: s.label, value: showPercentages ? pctOf(s.value || 0) : fmt(s.value || 0) }));
    // English lists the segments with commas alone, as it always has
    const summary = interpolate(t.summary, { title, segments: lang === 'en' ? items.join(', ') : formatList(items, lang) });

    return (
        <div className="reserve-split">
            <div className="reserve-split-head">
                <span>{title}</span>
                {meta && <b>{meta}</b>}
            </div>
            <div className="reserve-split-bar" role="img" aria-label={summary}>
                {shown.map((s) => (
                    <i
                        key={s.label}
                        className={s.className || ''}
                        style={{ flexBasis: `${share(s.value) * 100}%`, background: s.color }}
                        title={interpolate(showPercentages ? t.tipShare : t.tip, { label: s.label, value: fmt(s.value), share: pctOf(s.value) })}
                    />
                ))}
            </div>
            <ul className="reserve-split-key">
                {segments.map((s) => (
                    <li key={s.label}>
                        <i className={s.className || ''} style={{ background: s.color }} aria-hidden="true" />
                        <span>{s.label}</span>
                        <b>{fmt(s.value || 0)}{showPercentages ? ` · ${pctOf(s.value || 0)}` : ''}</b>
                    </li>
                ))}
            </ul>
            {note && <p className="reserve-split-note">{note}</p>}
        </div>
    );
}
