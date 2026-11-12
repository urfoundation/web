import React, { useEffect, useMemo, useState } from 'react';
import { CTF } from './data';
import { countryPath, easyWins, staticSeed } from './model';
import { CountryCard, CountryPicker, EasyWinsSection, LiveBar, useMounted, useNow, useTips, useViewTransition } from './parts';

/**
 * The islands of a country page (ur.xyz/ctf/<cc>), from design.html's
 * ?page=<cc>: the live bar and the country's card, and its "Other big pots"
 * (Easy wins without the page's own country). The live bar's filters link to
 * the hub filtered, and the picker opens another country's page. Like the
 * hub's board, each renders first exactly as the static page, from the
 * build's snapshot; the clock, the tips and a fresh draw come after.
 */
export function CountryLive({ code, m = CTF }) {
    const c = m.byCode.get(code);
    const now = useNow();
    const mounted = useMounted();
    const tips = useTips();
    return (
        <>
            <LiveBar m={m} now={now} mounted={mounted} hub />
            <CountryCard
                m={m}
                c={c}
                label={`This epoch in ${c.the}`}
                tips={tips}
                picker={<CountryPicker m={m} mounted={mounted} onPick={(other) => { if (other !== code) window.location.href = countryPath(other); }} />}
            />
        </>
    );
}

export function CountryEasyWins({ code, m = CTF }) {
    const tips = useTips();
    const mounted = useMounted();
    const [ref, transition] = useViewTransition();
    const [seed, setSeed] = useState(() => staticSeed(m, code));
    const [expanded, setExpanded] = useState(null);
    useEffect(() => { setSeed(Math.floor(Math.random() * 0xffffffff)); }, []);
    const picks = useMemo(() => easyWins(m, seed, code), [m, seed, code]);
    if (!picks.length) return null;
    return (
        <div ref={ref}>
            <EasyWinsSection
                m={m}
                picks={picks}
                title="Other big pots this epoch"
                mounted={mounted}
                tips={tips}
                expanded={expanded}
                onExpand={(other) => transition(() => { setExpanded((cur) => (cur === other ? null : other)); tips.api.clear(); })}
                onShuffle={() => { setSeed(Math.floor(Math.random() * 0xffffffff)); tips.api.clear(); }}
            />
        </div>
    );
}
