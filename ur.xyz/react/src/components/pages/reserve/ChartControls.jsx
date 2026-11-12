import React from 'react';

// The chart windows: trailing days of the live history, or everything
// (the live history and the projection after it). `key` names each one's
// caption in the copy (`t` below: the balance unit's controls).
export const RANGES = [
    { id: '7d', key: 'last7', days: 7 },
    { id: '30d', key: 'last30', days: 30 },
    { id: 'all', key: 'all', days: null },
];

/** 7D | 30D | All, shared by both balance charts. */
export function RangeToggle({ range, onChange, t }) {
    return (
        <span className="reserve-unit reserve-range" role="group" aria-label={t.windowAria}>
            {RANGES.map((r) => (
                <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => onChange(r.id)}>{t[r.key]}</button>
            ))}
        </span>
    );
}

/** Widens a chart card to the full row and back; `label` names the chart for a screen reader. */
export function ExpandButton({ expanded, onToggle, label, t }) {
    return (
        <button type="button" className="reserve-expand" aria-expanded={expanded} onClick={onToggle}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {expanded
                    ? <path d="M6.5 2.5v4h-4M9.5 13.5v-4h4M6.5 6.5L2 2M9.5 9.5L14 14" />
                    : <path d="M2.5 6.5v-4h4M13.5 9.5v4h-4M2.5 2.5L7 7M13.5 13.5L9 9" />}
            </svg>
            <span>{expanded ? t.collapse : t.expand}</span>
            <span className="reserve-visually-hidden"> {label}</span>
        </button>
    );
}
