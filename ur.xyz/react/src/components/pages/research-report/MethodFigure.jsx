import React, { useEffect, useId, useRef, useState } from 'react';
import { SCENES } from './scenes';
import { useReducedMotion } from './active';
import { pageCopy } from './copy';

/**
 * One method's animation (scenes.jsx). The static page and reduced motion show
 * its key frame; otherwise it loops while at least a third of it is on screen
 * and stops when it leaves. It moves for longer than five seconds beside text,
 * so it carries a Pause button (WCAG 2.2.2); under reduced motion the button
 * reads Play and the animation starts only when asked. The step line under it
 * names the current phase; the figure's label describes the whole for screen
 * readers, so the step line is hidden from them. The words drawn in the scene
 * and its steps are the page copy's `scenes`, in the page's language.
 */
export default function MethodFigure({ sceneKey, label, caption, lang = 'en' }) {
    const scene = SCENES[sceneKey];
    const copy = pageCopy(lang);
    const words = copy.scenes[sceneKey];
    const f = copy.figure;
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const reduced = useReducedMotion();
    const [t, setT] = useState(scene.key);
    const [paused, setPaused] = useState(true);
    const [visible, setVisible] = useState(false);
    const started = useRef(false);
    const frame = useRef(null);

    // play by default, unless the visitor asked for reduced motion
    useEffect(() => {
        setPaused(reduced);
        if (reduced) setT(scene.key);
    }, [reduced, scene.key]);

    useEffect(() => {
        const el = frame.current;
        if (!el || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (paused || !visible) return undefined;
        // the first play starts the story from its beginning, not from the key frame
        if (!started.current) { started.current = true; setT(0); }
        let raf = 0, last = performance.now();
        const step = (now) => {
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            setT((x) => (x + dt) % scene.duration);
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [paused, visible, scene.duration]);

    let n = 0;
    scene.steps.forEach((at, j) => { if (t >= at) n = j; });

    return (
        <figure className="rr-fig">
            <div className="rr-fig-frame" ref={frame}>
                <svg className="rr-scene" viewBox="0 0 360 200" role="img" aria-label={label}>
                    {scene.render(t, uid, words)}
                </svg>
                <div className="rr-fig-bar">
                    <span className="rr-fig-step" aria-hidden="true"><b>{n + 1}/{scene.steps.length}</b>{words.steps[n]}</span>
                    <button type="button" className="rr-fig-toggle" aria-label={paused ? f.playAria : f.pauseAria} onClick={() => setPaused((p) => !p)}>
                        {paused
                            ? <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1 L9 5 L2 9 Z" fill="currentColor" /></svg>
                            : <svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.4" height="8" rx="0.6" fill="currentColor" /><rect x="6.1" y="1" width="2.4" height="8" rx="0.6" fill="currentColor" /></svg>}
                        <span>{paused ? f.play : f.pause}</span>
                    </button>
                </div>
            </div>
            <figcaption>{caption}</figcaption>
        </figure>
    );
}
