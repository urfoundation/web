import React, { useEffect, useMemo, useState } from 'react';
import { CTF } from './data';
import { easyWins, localModel, staticSeed } from './model';
import { ctfCopy, place } from './i18n';
import { pagePath } from './links';
import { rich } from './rich';
import { CountryCard, CountryPicker, EasyWinsSection, LiveBar, useMounted, useNow, useTips, useViewTransition } from './parts';

/**
 * The islands of a country page (ur.xyz/ctf/<cc>, and /<lang>/ctf/<cc> in
 * `lang`), from design.html's ?page=<cc>: the live bar and the country's
 * card, and its "Other big pots" (Easy wins without the page's own country).
 * The live bar's filters link to the hub filtered, and the picker opens
 * another country's page, both in the page's language. Like the hub's board,
 * each renders first exactly as the static page, from the build's snapshot;
 * the clock, the tips and a fresh draw come after.
 */
export function CountryLive({ code, lang = 'en', m: model = CTF }) {
    const m = useMemo(() => localModel(model, lang), [model, lang]);
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
                label={rich(ctfCopy(m.lang).card.thisEpochIn, place(c)).join('')}
                tips={tips}
                picker={<CountryPicker m={m} mounted={mounted} onPick={(other) => { if (other !== code) window.location.href = pagePath(m.lang, `/ctf/${other}`); }} />}
            />
        </>
    );
}

export function CountryEasyWins({ code, lang = 'en', m: model = CTF }) {
    const m = useMemo(() => localModel(model, lang), [model, lang]);
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
                title={ctfCopy(m.lang).easy.otherTitle}
                mounted={mounted}
                tips={tips}
                expanded={expanded}
                onExpand={(other) => transition(() => { setExpanded((cur) => (cur === other ? null : other)); tips.api.clear(); })}
                onShuffle={() => { setSeed(Math.floor(Math.random() * 0xffffffff)); tips.api.clear(); }}
            />
        </div>
    );
}
