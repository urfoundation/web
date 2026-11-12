import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BUILD_ARCH, BUILD_V12 } from '../../data/buildContent';
import { loadPageCopy } from '../../i18n/page-copy.js';
import { formatPercent, interpolate, intlLocale } from '../../i18n/format.js';
import {
    COLORS,
    ChassisScene, SpineScene, TowerScene, FoundationScene, TerminalScene, Terminal3Scene,
} from './BuildScenes';
import { ArchitectureReadout, BriefPanel, Readout } from './BuildBrief';
import { hasLocalizedVersion, localizedPathFor } from '../../../../astro/src/lib/route-localization.js';
import './Build.css';

/**
 * BuildPage — /build, "Build on UR | Network Operator opportunities".
 *
 * Renders only what goes inside <main class="section-page">: the SPA's
 * SectionPage and astro/src/pages/build.astro both wrap it in the shared
 * Disclaimer / Nav / Footer shell. Ported from the standalone
 * astro/public/build.html, whose inline scripts became the state below.
 *
 * The page has one live design — version 12, the "native ur.xyz shell" around
 * the three-plane terminal model — and keeps the earlier editions reachable
 * through the query string, as the standalone page did:
 *
 *   ?model=terminal5 (default)  version 12, model terminal3
 *   ?model=terminal4            version 11 ("builder edition"), model terminal3
 *   ?model=chassis|spine|tower|foundation|terminal|terminal3   version 10
 *   ?op=1..6                    the initially selected opportunity
 *   ?brief=1                    open the opportunity brief
 *   #brief-<slug>               open that opportunity's brief: each brief's own
 *                               address, which the page keeps while a brief is
 *                               open and which shows the brief before hydration
 *                               too (Build.css :target)
 *
 * The attributes the scripts set on <html> (data-model, data-version,
 * data-content-view, data-brief-mode, data-brief-open, data-op and the accent
 * variables) live on the page wrapper, and Build.css keys off it. Astro renders
 * the component on the server, so the default is rendered first and the query
 * string is read in an effect; nothing touches window/document during render.
 *
 * Its words are four copy units in the page's language `lang`
 * (react/src/i18n/pages/build/): `build` (this page and the brief's labels),
 * `build/opportunities` and `build/briefs` (the six examples, paired by index
 * with buildContent.js, which keeps their data) and `build/scenes` (the models).
 */

const pageCopy = await loadPageCopy('build');
const opportunitiesCopy = await loadPageCopy('build/opportunities');
const briefsCopy = await loadPageCopy('build/briefs');
const scenesCopy = await loadPageCopy('build/scenes');

const OPS = BUILD_ARCH.opportunities;
const MODELS = ['chassis', 'spine', 'tower', 'foundation', 'terminal', 'terminal3'];

/** ?model= → { model, version, isV11, isV12, builder } (the script's isBuilderEdition). */
function resolveVariant(modelParam) {
    const param = modelParam || 'terminal5';
    const isV11 = param === 'terminal4';
    const isV12 = param === 'terminal5';
    const builder = isV11 || isV12;
    const model = builder ? 'terminal3' : MODELS.includes(param) ? param : 'terminal';
    return { model, version: isV12 ? '12' : isV11 ? '11' : '10', isV11, isV12, builder };
}
const DEFAULT_VARIANT = resolveVariant(null);
const isTerminalModel = (model) => model === 'terminal' || model === 'terminal3';
const initialView = (model) => (isTerminalModel(model) ? 'scrub' : 'open');
const initialBriefMode = (model) => (model === 'terminal3' ? 'editorial' : 'structured');

/* ---------- the page's words in a language ---------- */

/** The three planes of the terminal3 model: their keys and numbers (their words are build/scenes `planes`). */
const PLANES = [{ key: 'operatorproduct', n: '01' }, { key: 'network', n: '02' }, { key: 'subnetbase', n: '03' }];
const FLOW_COLORS = ['var(--green)', 'var(--pale)', 'var(--pink)'];

const localized = new Map();
/**
 * Everything the page shows in `lang`: the page copy, the models' copy, and
 * the opportunities, the live page's wording of them and the architecture's
 * components with their words merged over their data (index for index).
 */
function wordsIn(lang) {
    if (!localized.has(lang)) {
        const scenes = scenesCopy(lang);
        localized.set(lang, {
            t: pageCopy(lang),
            scenes,
            locale: intlLocale(lang),
            ops: OPS.map((o, i) => ({ ...o, ...opportunitiesCopy(lang).items[i] })),
            v12: BUILD_V12.map((b, i) => ({ ...b, ...briefsCopy(lang).items[i] })),
            components: BUILD_ARCH.components.map((c, i) => ({ ...c, ...scenes.components[i] })),
            planes: {
                v10: PLANES.map((p, i) => ({ ...p, ...scenes.planes.v10[i] })),
                v11: PLANES.map((p, i) => ({ ...p, ...scenes.planes.v11[i] })),
                v12: PLANES.map((p, i) => ({ ...p, ...scenes.planes.v12[i] })),
            },
        });
    }
    return localized.get(lang);
}

/* ---------- the terminal models' scrub (assembled → revealed) ---------- */

const TERMINAL_LAYERS = [
    { cls: 'terminal-display', range: [.02, .46], from: [0, 0, 36], to: [-20, -18, 245] },
    { cls: 'terminal-validator', range: [.16, .6], from: [0, 0, 28], to: [62, 0, 190] },
    { cls: 'terminal-operator', range: [.29, .74], from: [0, 0, 22], to: [-18, 18, 145] },
    { cls: 'terminal-economics', range: [.43, .86], from: [0, 0, 16], to: [0, 68, 105] },
    { cls: 'terminal-providers', range: [.56, .96], from: [0, 0, 12], to: [-44, 55, 80] },
    { cls: 'terminal-miners', range: [.56, .96], from: [0, 0, 14], to: [44, 55, 88] },
    { cls: 'terminal-shell', range: [.68, 1], from: [0, 0, 0], to: [0, 35, 0] },
];
const TERMINAL3_LAYERS = [
    { cls: 'terminal3-product', range: [.02, .68], from: [0, 0, 36], to: [-88, -118, 176], fromR: 0, toR: -2.6, fromS: 1, toS: .94 },
    { cls: 'terminal3-network', range: [.2, .86], from: [0, 0, 20], to: [82, 72, 88], fromR: 0, toR: 2.8, fromS: 1, toS: .98 },
    { cls: 'terminal3-base', range: [.48, 1], from: [0, 0, 0], to: [-8, 300, 0], fromR: 0, toR: .5, fromS: 1, toS: .9 },
];
const TERMINAL3_LAYERS_V11 = [
    { cls: 'terminal3-product', range: [.02, .66], from: [0, 0, 36], to: [-108, -116, 188], fromR: 0, toR: -2.2, fromS: 1, toS: .96 },
    { cls: 'terminal3-network', range: [.2, .84], from: [0, 0, 20], to: [90, 82, 96], fromR: 0, toR: 2.2, fromS: 1, toS: 1 },
    { cls: 'terminal3-base', range: [.46, 1], from: [0, 0, 0], to: [-4, 250, 0], fromR: 0, toR: .2, fromS: 1, toS: .94 },
];
const TERMINAL3_LAYERS_V11_MOBILE = [
    { cls: 'terminal3-product', range: [.02, .66], from: [0, 0, 36], to: [-10, -116, 188], fromR: 0, toR: -1.2, fromS: 1, toS: .96 },
    { cls: 'terminal3-network', range: [.2, .84], from: [0, 0, 20], to: [8, 82, 96], fromR: 0, toR: 1.2, fromS: 1, toS: .98 },
    { cls: 'terminal3-base', range: [.46, 1], from: [0, 0, 0], to: [0, 250, 0], fromR: 0, toR: 0, fromS: 1, toS: .92 },
];
const CALLOUT_THRESHOLDS = {
    terminal: { product: .12, validators: .28, operator: .4, emission: .58, providers: .67, miners: .67, subnet: .8 },
    terminal3: { operatorproduct: .18, network: .42, subnetbase: .68 },
};
const NO_LAYERS = {};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const subProgress = (p, a, b) => clamp01((p - a) / (b - a));
const easeLayer = (t) => 1 + 1.35 * Math.pow(t - 1, 3) + .35 * Math.pow(t - 1, 2);
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const viewportFlags = () => ({
    mobile: window.matchMedia('(max-width:700px)').matches,
    compact: window.matchMedia('(max-width:1080px)').matches,
});

function layerTransforms(model, builder, mobile, p) {
    const table = model === 'terminal3'
        ? (builder ? (mobile ? TERMINAL3_LAYERS_V11_MOBILE : TERMINAL3_LAYERS_V11) : TERMINAL3_LAYERS)
        : TERMINAL_LAYERS;
    const out = {};
    for (const L of table) {
        const sp = easeLayer(subProgress(p, L.range[0], L.range[1]));
        const x = lerp(L.from[0], L.to[0], sp), y = lerp(L.from[1], L.to[1], sp), z = lerp(L.from[2], L.to[2], sp);
        const rot = lerp(L.fromR || 0, L.toR || 0, sp), scale = lerp(L.fromS || 1, L.toS || 1, sp);
        out[L.cls] = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateZ(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }
    return out;
}

/** The tilt of the terminal world: it flattens as the model opens, plus pointer parallax. */
function worldTransform(model, builder, p, parX = 0, parZ = 0) {
    const t3 = model === 'terminal3';
    const rx = lerp(t3 ? (builder ? 24 : 28) : 42, t3 ? (builder ? 14 : 19) : 38, p) + parX;
    const rz = lerp(t3 ? (builder ? -7 : -9) : -16, t3 ? (builder ? -2.5 : -4) : -12, p) + parZ;
    return `translate(-50%,-50%) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
}

/** Builder editions size the stage to the reveal: taller once the planes separate. */
function stageHeightFor(p, { mobile, compact }) {
    const minH = mobile ? 560 : compact ? 760 : 800;
    const maxH = mobile ? 720 : compact ? 980 : 1040;
    return Math.round(lerp(minH, maxH, p));
}

/* ---------- the "trace one session" simulation (terminal3) ---------- */

const TRACE_MODE_BY_VISUAL = { vpn: 'point', comms: 'point', agent: 'roundtrip', search: 'roundtrip', visibility: 'fanout', verification: 'fanout' };
// When each of a trace mode's status messages shows during the traffic step,
// in ms (their words are the `build` unit's trace.modes[mode].messages).
const TRACE_MESSAGE_DELAYS = {
    point: [850, 1500, 2600, 3350],
    roundtrip: [850, 1500, 2600, 3350],
    fanout: [850, 1450, 2450, 3400],
};
const SIM_PHASES = [['traffic', 4100], ['quality', 2600]];
// `label` is the trace button's word (trace.start / stop / replay) and
// `status` the status line's: null (idle), 'start', 'message<i>', 'quality',
// 'opening' or 'done', put into words while rendering.
const SIM_IDLE = { running: false, phase: null, complete: false, glyph: 'play', label: 'start', status: null };
const GLYPHS = { play: '▶', stop: '■', replay: '↻' };
const traceModeOf = (mode) => (TRACE_MESSAGE_DELAYS[mode] ? mode : 'roundtrip');
const traceCopyFor = (t, mode) => t.trace.modes[traceModeOf(mode)];
const idleStatus = (t, model, traceMode) => (model === 'terminal3' ? traceCopyFor(t, traceMode).idle : t.trace.idleOther);
/** The status line's words for a sim status. */
function statusWords(t, status, traceMode) {
    const copy = traceCopyFor(t, traceMode);
    if (status === 'start') return copy.start;
    if (status.startsWith('message')) return copy.messages[Number(status.slice('message'.length))];
    return t.trace[status];
}

/** The element id, and so the address (#brief-<slug>), of an opportunity's brief. */
const briefId = (o) => `brief-${o.slug}`;
/** The opportunity whose brief an address names, or -1. */
const briefIndexOf = (hash) => OPS.findIndex((o) => hash === `#${briefId(o)}`);

/**
 * Keep ?op= (and ?model=) in the address so a selected example can be shared,
 * and, while its brief is open, the brief's own address (#brief-<slug>).
 */
function syncAddress(index, briefOpen) {
    const current = new URLSearchParams(window.location.search);
    const next = new URLSearchParams();
    if (current.get('model')) next.set('model', current.get('model'));
    if (index) next.set('op', String(index + 1));
    const qs = next.toString();
    const hash = briefOpen ? `#${briefId(OPS[index])}` : '';
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${hash}`);
}

export default function BuildPage({ lang = 'en' }) {
    const { t, scenes, locale, ops, v12: briefs, components, planes } = wordsIn(lang);
    const [variant, setVariant] = useState(DEFAULT_VARIANT);
    const { model, version, isV11, isV12, builder } = variant;
    const isTerminal = isTerminalModel(model);

    const [opIndex, setOpIndex] = useState(0);
    const [focus, setFocus] = useState('');
    const [view, setView] = useState(initialView(DEFAULT_VARIANT.model));
    const [contentView, setContentView] = useState('architecture');
    const [briefMode, setBriefMode] = useState(initialBriefMode(DEFAULT_VARIANT.model));
    // The brief panel's open state, null until first toggled (the wrapper's
    // data-brief-open attribute, version 12, only appears once it has been).
    // The two buttons that open it keep their own labels, as the script did:
    // the readout's trigger follows setInlineBrief (terminal3, ?brief=1, close),
    // the version-10 toggle follows its own clicks.
    const [briefOpen, setBriefOpen] = useState(null);
    const [triggerOpen, setTriggerOpen] = useState(false);
    const [toggleOpen, setToggleOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stageHeight, setStageHeight] = useState(null);
    const [viewport, setViewport] = useState({ mobile: false, compact: false });
    const [sim, setSim] = useState(SIM_IDLE);
    // set once mounted: until then a brief's address shows it through CSS (Build.css)
    const [hydrated, setHydrated] = useState(false);

    const variantRef = useRef(DEFAULT_VARIANT);
    const progressRef = useRef(0);
    const draggingRef = useRef(false);
    const parallaxRef = useRef({ x: 0, z: 0, tx: 0, tz: 0 });
    const traceModeRef = useRef('point');
    const simRef = useRef({ running: false, phase: null, step: -1, timer: 0, subTimers: [] });
    const stageRef = useRef(null);
    const bridgeRef = useRef(null);
    const scrubRef = useRef(null);
    const tabsRef = useRef(null);
    const briefPanelRef = useRef(null);
    const worldRef = useRef(null);
    const world3Ref = useRef(null);
    // a brief opened from its address is scrolled to once it is drawn
    const revealBriefRef = useRef(false);

    const op = ops[opIndex];
    const briefIsOpen = briefOpen === true;
    const traceMode = TRACE_MODE_BY_VISUAL[op.visual] || 'roundtrip';
    useEffect(() => { variantRef.current = variant; }, [variant]);
    useEffect(() => { traceModeRef.current = traceMode; }, [traceMode]);

    /* --- simulation --- */

    const resetSimulation = useCallback((silent = false) => {
        const s = simRef.current;
        clearTimeout(s.timer);
        s.subTimers.forEach(clearTimeout);
        s.subTimers = [];
        s.running = false;
        s.phase = null;
        s.step = -1;
        setSim((prev) => {
            const status = silent ? prev.status : null;
            if (!prev.running && !prev.phase && !prev.complete && prev.glyph === 'play' && prev.status === status) return prev;
            return { ...SIM_IDLE, status };
        });
    }, []);

    const applyProgress = useCallback((value) => {
        const { model, builder } = variantRef.current;
        if (!isTerminalModel(model)) return;
        const p = clamp01(value);
        progressRef.current = p;
        setProgress(p);
        if (model === 'terminal3' && p < .34) resetSimulation(true);
        if (builder && !draggingRef.current) setStageHeight(stageHeightFor(p, viewportFlags()));
    }, [resetSimulation]);

    /** Draw the two curves that join the product screen to the mesh's entry and exit providers. */
    const updateRouteBridge = useCallback(() => {
        const stage = stageRef.current, bridge = bridgeRef.current;
        if (!stage || !bridge) return;
        const entry = stage.querySelector('.scene-terminal3 .route-provider-in');
        const exitProvider = stage.querySelector('.scene-terminal3 .route-provider-out');
        const appVisual = stage.querySelector('.scene-terminal3 .app-visual');
        if (!entry || !exitProvider || !appVisual) return;
        const stageRect = stage.getBoundingClientRect();
        const point = (el, x = .5, y = .5) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width * x - stageRect.left, y: r.top + r.height * y - stageRect.top };
        };
        const routeStart = stage.querySelector('.scene-terminal3 .route-start');
        const routeEnd = stage.querySelector('.scene-terminal3 .route-end');
        const start = routeStart ? point(routeStart) : point(appVisual, .08, .72);
        const end = routeEnd ? point(routeEnd) : point(appVisual, .9, .28);
        const networkIn = point(entry), networkOut = point(exitProvider);
        bridge.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
        bridge.querySelector('.route-bridge-in').setAttribute('d', `M${start.x} ${start.y} C${start.x - 18} ${start.y + 48},${networkIn.x - 42} ${networkIn.y - 46},${networkIn.x} ${networkIn.y}`);
        bridge.querySelector('.route-bridge-out').setAttribute('d', `M${networkOut.x} ${networkOut.y} C${networkOut.x + 52} ${networkOut.y - 22},${end.x + 28} ${end.y + 52},${end.x} ${end.y}`);
    }, []);

    const advanceSimulation = useCallback(() => {
        const s = simRef.current;
        if (!s.running) return;
        s.step += 1;
        if (s.step >= SIM_PHASES.length) {
            s.running = false;
            s.phase = null;
            setSim((prev) => ({ ...prev, running: false, phase: null, complete: true, glyph: 'replay', label: 'replay', status: 'done' }));
            return;
        }
        const [phase, phaseDuration] = SIM_PHASES[s.step];
        s.phase = phase;
        setSim((prev) => ({ ...prev, phase, complete: false, status: phase === 'traffic' ? 'start' : 'quality' }));
        const reduced = prefersReducedMotion();
        if (phase === 'traffic' && !reduced) {
            TRACE_MESSAGE_DELAYS[traceModeOf(traceModeRef.current)].forEach((delay, i) => s.subTimers.push(setTimeout(() => {
                if (s.running && s.phase === 'traffic') setSim((prev) => (prev.phase === 'traffic' ? { ...prev, status: `message${i}` } : prev));
            }, delay)));
        }
        s.timer = setTimeout(advanceSimulation, reduced ? 900 : phaseDuration);
    }, []);

    const runSimulation = () => {
        const s = simRef.current;
        if (s.running) { resetSimulation(); return; }
        resetSimulation(true);
        s.running = true;
        setSim((prev) => ({ ...prev, running: true, complete: false, glyph: 'stop', label: 'stop' }));
        const launch = () => { if (s.running) { updateRouteBridge(); advanceSimulation(); } };
        if (progressRef.current < .84) {
            setSim((prev) => ({ ...prev, status: 'opening' }));
            applyProgress(1);
            s.timer = setTimeout(launch, prefersReducedMotion() ? 0 : 900);
        } else {
            launch();
        }
    };

    /* --- mount: the query string, the viewport, the stage height --- */

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const next = resolveVariant(params.get('model'));
        if (next.model !== DEFAULT_VARIANT.model || next.version !== DEFAULT_VARIANT.version) {
            variantRef.current = next;
            setVariant(next);
            setView(initialView(next.model));
            setBriefMode(initialBriefMode(next.model));
        }
        const initialOp = Math.max(0, Math.min(OPS.length - 1, (Number(params.get('op')) || 1) - 1));
        if (initialOp) setOpIndex(initialOp);
        if (params.get('brief') === '1') { setBriefOpen(true); setTriggerOpen(true); }
        const fromAddress = briefIndexOf(window.location.hash);
        if (fromAddress !== -1) {
            setOpIndex(fromAddress);
            setBriefOpen(true);
            setTriggerOpen(true);
            revealBriefRef.current = true;
        }
        setViewport(viewportFlags());
        applyProgress(0);
        setHydrated(true);
        return () => resetSimulation(true);
    }, [applyProgress, resetSimulation]);

    // a link to a brief's address on the page itself opens that brief
    useEffect(() => {
        const onHashChange = () => {
            const index = briefIndexOf(window.location.hash);
            if (index === -1) return;
            if (variantRef.current.model === 'terminal3') resetSimulation();
            setOpIndex(index);
            setBriefOpen(true);
            setTriggerOpen(true);
            revealBriefRef.current = true;
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [resetSimulation]);

    useEffect(() => {
        if (!revealBriefRef.current || briefOpen !== true) return;
        revealBriefRef.current = false;
        briefPanelRef.current?.scrollIntoView({ block: 'start' });
    }, [briefOpen, opIndex]);

    useEffect(() => {
        const onResize = () => {
            setViewport(viewportFlags());
            const { model, builder } = variantRef.current;
            if (model === 'terminal3') updateRouteBridge();
            if (builder) applyProgress(progressRef.current);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [applyProgress, updateRouteBridge]);

    // Pointer parallax on the terminal world: eased toward the pointer every
    // frame, written straight to the element so the scrub's render is not redone.
    useEffect(() => {
        if (!isTerminal || prefersReducedMotion()) return undefined;
        let raf = 0;
        const tick = () => {
            const par = parallaxRef.current;
            par.x = lerp(par.x, par.tx, .075);
            par.z = lerp(par.z, par.tz, .075);
            const world = (model === 'terminal3' ? world3Ref : worldRef).current;
            if (world) world.style.transform = worldTransform(model, builder, progressRef.current, par.x, par.z);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isTerminal, model, builder]);

    /* --- handlers --- */

    const selectOpportunity = (index, fromUser) => {
        if (variantRef.current.model === 'terminal3') resetSimulation();
        setOpIndex(index);
        if (fromUser) syncAddress(index, briefIsOpen);
    };
    const stepOpportunity = (direction) => {
        selectOpportunity((opIndex + direction + OPS.length) % OPS.length, true);
        briefPanelRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    const onTabKeyDown = (i) => (e) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + OPS.length) % OPS.length;
        tabsRef.current?.querySelectorAll('button')[next]?.focus();
        selectOpportunity(next, true);
    };

    const onPieceFocus = (key) => setFocus(builder && focus === key ? '' : key);
    const closeLayer = () => {
        const stage = stageRef.current;
        const selected = stage
            ? [...stage.querySelectorAll('.scene.is-active .piece[aria-pressed="true"],.scene.is-active .callout[aria-pressed="true"]')].find((el) => el.offsetParent !== null)
            : null;
        setFocus('');
        selected?.focus();
    };

    const setInlineBrief = (open) => { setBriefOpen(open); setTriggerOpen(open); syncAddress(opIndex, open); };
    const onOpenBrief = () => (model === 'terminal3' ? setInlineBrief(!briefIsOpen) : setContentView('brief'));
    const onCloseBrief = () => setInlineBrief(false);
    const onToggleBrief = () => {
        if (isTerminal) { setContentView('brief'); return; }
        setBriefOpen(!briefIsOpen);
        setToggleOpen(!briefIsOpen);
        syncAddress(opIndex, !briefIsOpen);
    };

    const setScrubFromPointer = (e) => {
        const r = scrubRef.current.getBoundingClientRect();
        applyProgress(clamp01((e.clientX - r.left) / r.width));
    };
    const onScrubPointerDown = (e) => {
        draggingRef.current = true;
        scrubRef.current.setPointerCapture?.(e.pointerId);
        setScrubFromPointer(e);
        e.preventDefault();
    };
    const onScrubPointerMove = (e) => { if (draggingRef.current) setScrubFromPointer(e); };
    const finishScrub = (e) => {
        if (!draggingRef.current) return;
        setScrubFromPointer(e);
        draggingRef.current = false;
        try { scrubRef.current.releasePointerCapture?.(e.pointerId); } catch { /* not captured */ }
        applyProgress(progressRef.current);
    };
    const onStagePointerMove = (e) => {
        if (prefersReducedMotion()) return;
        const r = stageRef.current.getBoundingClientRect();
        const par = parallaxRef.current;
        par.tz = ((e.clientX - r.left) / r.width - .5) * 3.2;
        par.tx = ((e.clientY - r.top) / r.height - .5) * -2.2;
    };
    const onStagePointerLeave = () => { parallaxRef.current.tx = 0; parallaxRef.current.tz = 0; };
    const onStageClick = (e) => { if (!e.target.closest('[data-component],.system-rail-v11')) setFocus(''); };

    /* --- derived --- */

    const activeComponents = model === 'terminal3'
        ? (isV12 ? planes.v12 : isV11 ? planes.v11 : planes.v10)
        : components;
    const component = activeComponents.find((c) => c.key === focus);
    const layerCopy = t.layer;
    const layer = {
        name: component ? component.name : model === 'terminal3' ? (builder ? layerCopy.builder.name : layerCopy.terminal3.name) : layerCopy.other.name,
        detail: component
            ? (viewport.mobile && component.mobileDetail ? component.mobileDetail : component.detail)
            : model === 'terminal3'
                ? (builder ? layerCopy.builder.detail : layerCopy.terminal3.detail)
                : model === 'terminal' ? layerCopy.terminal.detail : layerCopy.other.detail,
        short: component
            ? `${component.n} / ${component.verb} · ${component.short}`
            : model === 'terminal3' ? layerCopy.terminal3.short : model === 'terminal' ? layerCopy.terminal.short : layerCopy.other.short,
        color: component ? COLORS[component.key] : '#d6e6f4',
        onClose: closeLayer,
        t,
    };

    const head = isV12 ? t.section.v12 : isV11 ? t.section.v11 : t.section.models[model];
    const hero = isV12
        ? { eyebrow: t.hero.eyebrow, p: t.hero.intro }
        : isV11
            ? { eyebrow: t.hero.v11.eyebrow, h2: t.hero.v11.heading, p: t.hero.v11.intro }
            : { eyebrow: t.hero.v10.eyebrow, h2: t.hero.v10.heading, p: t.hero.v10.intro };
    const cta = isV11 ? t.cta.v11 : t.cta;
    // what the readout shows for opportunity i (version 12 words it from BUILD_V12)
    const readoutFor = (i) => {
        const o = ops[i];
        const w = isV12 ? briefs[i] : null;
        return w
            ? { category: w.category, title: w.displayTitle || w.title, teaser: w.summary }
            : { category: o.category, title: o.title, teaser: o.teaser };
    };
    const briefLabel = `${isV12
        ? (triggerOpen ? t.readout.hideBrief : t.readout.openBrief)
        : (triggerOpen ? t.readout.closeOpportunity : t.readout.exploreOpportunity)} `;

    const layers = isTerminal ? layerTransforms(model, builder, viewport.mobile, progress) : NO_LAYERS;
    const revealed = (key) => progress >= (CALLOUT_THRESHOLDS[model]?.[key] ?? Infinity);
    const worldStyle = isTerminal ? { transform: worldTransform(model, builder, progress) } : undefined;
    const traceReady = model === 'terminal3' && progress >= .34;
    const scrubLabels = model === 'terminal3'
        ? (builder ? [t.scrub.assembled, t.scrub.revealed] : [t.scrub.assembled, t.scrub.exploded])
        : [t.scrub.product, t.scrub.network];
    const pct = Math.round(progress * 100);
    const valueText = progress < .04 ? t.scrub.valueStart : progress > .96 ? t.scrub.valueEnd : interpolate(t.scrub.valueMiddle, { pct });
    const pctText = lang === 'en' ? `${pct}%` : formatPercent(pct / 100, lang, { maximumFractionDigits: 0 });
    const status = sim.status ? statusWords(t, sim.status, traceMode) : idleStatus(t, model, traceMode);

    const scrub = (
        <div className="stage-scrub">
            <label htmlFor="terminal-scrub">{scrubLabels[0]}</label>
            <input
                id="terminal-scrub"
                ref={scrubRef}
                type="range"
                min="0"
                max="1000"
                step={isV11 ? 10 : 1}
                value={Math.round(progress * 1000)}
                aria-label={t.scrub.aria}
                aria-valuetext={isTerminal ? valueText : undefined}
                style={isTerminal ? { '--scrub-p': progress.toFixed(3) } : undefined}
                onChange={(e) => applyProgress(Number(e.target.value) / 1000)}
                onPointerDown={onScrubPointerDown}
                onPointerMove={onScrubPointerMove}
                onPointerUp={finishScrub}
                onPointerCancel={finishScrub}
            />
            <label htmlFor="terminal-scrub">{scrubLabels[1]}</label>
            <output htmlFor="terminal-scrub">{pctText}</output>
        </div>
    );
    const playButton = (
        <button type="button" className={builder ? 'system-play' : undefined} aria-pressed={sim.running} onClick={runSimulation}>
            <i aria-hidden="true" data-glyph={sim.glyph}>{GLYPHS[sim.glyph]}</i><span>{t.trace[sim.label]}</span>
        </button>
    );
    const simulationReadout = (
        <div className="simulation-readout">
            <output>{status}</output>
            <ol aria-label={t.trace.stepsAria}>
                <li data-sim-step="traffic" aria-current={sim.phase ? sim.phase === 'traffic' : undefined}><b>01</b>{` ${t.trace.stepRoute}`}</li>
                <li data-sim-step="quality" aria-current={sim.phase ? sim.phase === 'quality' : undefined}><b>02</b>{` ${t.trace.stepValidate}`}</li>
            </ol>
        </div>
    );
    const opTabs = (
        <nav className="op-tabs" role="tablist" aria-label={t.tabsAria} ref={tabsRef}>
            {ops.map((o, i) => (
                <button
                    key={o.slug}
                    type="button"
                    role="tab"
                    id={`op-tab-${o.slug}`}
                    tabIndex={i === opIndex ? 0 : -1}
                    aria-controls={`opportunity-readout-${o.slug}`}
                    aria-selected={i === opIndex}
                    style={{ '--dot': o.accent }}
                    onClick={() => selectOpportunity(i, true)}
                    onKeyDown={onTabKeyDown(i)}
                >
                    <b>{o.n}</b><span>{o.short}</span><i aria-hidden="true" />
                </button>
            ))}
        </nav>
    );
    const sceneProps = { op, t: scenes, locale, focus, onFocus: onPieceFocus };

    return (
        <div
            className="build-page"
            data-model={model}
            data-version={version}
            data-content-view={contentView}
            data-brief-mode={briefMode}
            data-brief-open={isV12 && briefOpen !== null ? String(briefIsOpen) : undefined}
            data-op={op.slug}
            data-hydrated={hydrated ? '' : undefined}
            style={{ '--accent': op.accent, '--accent-rgb': op.rgb }}
        >
            <header className="build-hero shell">
                {isV12 ? (
                    <div className="hero-title"><span className="eyebrow">{hero.eyebrow}</span><h1>{t.hero.title}</h1></div>
                ) : (
                    <div className="hero-title"><h1>{t.hero.title}</h1><span className="hero-kicker"><i />{t.hero.kicker}</span></div>
                )}
                <div className="hero-intro">
                    {!isV12 && <span className="eyebrow">{hero.eyebrow}</span>}
                    <div>
                        {!isV12 && <h2>{hero.h2[0]}<br />{hero.h2[1]}</h2>}
                        <p>{hero.p}</p>
                    </div>
                </div>
                <div className="proof-strip v11-only" aria-label={t.hero.proofAria}>
                    {isV12 ? (
                        <><span><b>100K+</b>{` ${t.hero.proof.providers}`}</span><span><b>100+</b>{` ${t.hero.proof.countries}`}</span><span><b>350K+</b>{` ${t.hero.proof.users}`}</span></>
                    ) : (
                        <><span><b>100K+</b>{` ${t.hero.proofV11.providers}`}</span><span><b>100+</b>{` ${t.hero.proofV11.countries}`}</span><span><b>{t.hero.proofV11.live}</b>{` ${t.hero.proofV11.infrastructure}`}</span></>
                    )}
                </div>
                <p className="hero-quiet v12-only">{t.hero.quiet}</p>
                <div className="boundary">
                    <article><b>{t.hero.bring.label}</b><h2>{t.hero.bring.title}</h2><p>{t.hero.bring.body}</p></article>
                    <article><b>{t.hero.provides.label}</b><h2>{t.hero.provides.title}</h2><p>{t.hero.provides.body}</p></article>
                </div>
            </header>

            <section className="theatre" aria-labelledby="model-title"><div className="shell">
                <header className="section-head">
                    <span className="eyebrow">{head.number}</span>
                    <div>
                        <h2 id="model-title">{head.title}</h2>
                        <p>{head.copy}</p>
                        <span className="model-note">{t.section.modelNote}</span>
                    </div>
                </header>
                <div className="opportunity-intro">
                    <div><small>{t.intro.kicker}</small><strong>{t.intro.title}</strong></div>
                    <p>{t.intro.body}</p>
                </div>
                {!isV12 && opTabs}
                <div className="content-switch" role="tablist" aria-label={t.contentSwitch.aria}>
                    <button type="button" role="tab" aria-selected={contentView === 'architecture'} onClick={() => setContentView('architecture')}>{t.contentSwitch.model}</button>
                    <button type="button" role="tab" aria-selected={contentView === 'brief'} onClick={() => setContentView('brief')}>{t.contentSwitch.brief}</button>
                </div>
                <div className="architecture-panel">
                    <div className="model-grid">
                        <div
                            className={`model-stage${traceReady ? ' trace-ready' : ''}`}
                            ref={stageRef}
                            data-view={view}
                            data-focus={focus || undefined}
                            data-progress={isTerminal ? progress.toFixed(3) : undefined}
                            data-trace-mode={model === 'terminal3' ? traceMode : undefined}
                            data-sim-running={sim.running ? 'true' : undefined}
                            data-sim-phase={sim.phase || undefined}
                            data-sim-complete={sim.complete ? 'true' : undefined}
                            style={stageHeight != null ? { '--stage-height': `${stageHeight}px` } : undefined}
                            onClick={builder ? onStageClick : undefined}
                            onPointerMove={isTerminal ? onStagePointerMove : undefined}
                            onPointerLeave={isTerminal ? onStagePointerLeave : undefined}
                        >
                            <div className="stage-meta"><span>{head.meta}</span><span>{t.stage.separately}</span></div>

                            <ChassisScene active={model === 'chassis'} {...sceneProps} />
                            <SpineScene active={model === 'spine'} {...sceneProps} />
                            <TowerScene active={model === 'tower'} {...sceneProps} />
                            <FoundationScene active={model === 'foundation'} {...sceneProps} />
                            <TerminalScene
                                active={model === 'terminal'}
                                {...sceneProps}
                                layers={model === 'terminal' ? layers : NO_LAYERS}
                                revealed={model === 'terminal' ? revealed : undefined}
                                flowOpacity={model === 'terminal' ? subProgress(progress, .08, .48) : undefined}
                                worldRef={worldRef}
                                worldStyle={model === 'terminal' ? worldStyle : undefined}
                            />
                            <Terminal3Scene
                                active={model === 'terminal3'}
                                {...sceneProps}
                                layers={model === 'terminal3' ? layers : NO_LAYERS}
                                revealed={model === 'terminal3' ? revealed : undefined}
                                worldRef={world3Ref}
                                worldStyle={model === 'terminal3' ? worldStyle : undefined}
                            />

                            <svg className="terminal3-route-bridge" aria-hidden="true" ref={bridgeRef}><path className="route-bridge-in" pathLength="1" /><path className="route-bridge-out" pathLength="1" /></svg>

                            <div className="stage-controls" aria-label={t.stage.controlsAria}>
                                <button type="button" data-show-all="" aria-pressed={!focus} onClick={() => setFocus('')}>{t.stage.showAll}</button>
                                <button type="button" data-view="assembled" aria-pressed={view === 'assembled'} onClick={() => setView('assembled')}>{t.stage.assembled}</button>
                                <button type="button" data-view="open" aria-pressed={view === 'open'} onClick={() => setView('open')}>{t.stage.openArchitecture}</button>
                                {!builder && scrub}
                            </div>
                            <div className="flow-key">
                                <span style={{ '--c': 'var(--accent)' }}><i />{t.stage.traffic}</span>
                                <span style={{ '--c': '#eff7bb' }}><i />{t.stage.verification}</span>
                                <span style={{ '--c': '#ed8fff' }}><i />{t.stage.economics}</span>
                            </div>
                            {builder ? (
                                <div className="system-rail-v11" aria-label={t.stage.railAria}>
                                    {playButton}{scrub}{simulationReadout}
                                </div>
                            ) : (
                                <div className="simulation-control" aria-live="polite">{playButton}{simulationReadout}</div>
                            )}
                            {builder && <ArchitectureReadout className="architecture-readout layer-caption-v11" headingLevel="h3" {...layer} />}
                        </div>
                        {isV12 && opTabs}
                        {isV12 && <p className="selector-frame-v12"><span>{t.stage.selectorKicker}</span><b>{t.stage.selectorTitle}</b></p>}
                        {/* Every opportunity's readout is in the page (the six
                            examples are the page's substance, and a reader or a
                            crawler without the tabs should find them all); the
                            tabs show one and hide the rest. */}
                        {ops.map((o, i) => (
                            <Readout
                                key={o.slug}
                                id={`opportunity-readout-${o.slug}`}
                                labelledBy={`op-tab-${o.slug}`}
                                briefId={briefId(o)}
                                hidden={i !== opIndex}
                                op={o}
                                readout={readoutFor(i)}
                                isV11={isV11}
                                builder={builder}
                                layer={layer}
                                triggerOpen={triggerOpen}
                                toggleOpen={toggleOpen}
                                briefLabel={briefLabel}
                                onOpenBrief={onOpenBrief}
                                onToggleBrief={onToggleBrief}
                                t={t}
                                locale={locale}
                            />
                        ))}
                    </div>
                    <nav className="component-key" aria-label={t.componentKey.aria}>
                        <button type="button" data-component="" aria-pressed={!focus} style={{ '--cc': '#d6e6f4' }} onClick={() => setFocus('')}>
                            <b>{t.componentKey.all}</b><strong>{model === 'terminal3' ? t.componentKey.allTerminal3 : t.componentKey.allOther}</strong><span>{t.componentKey.allDetail}</span>
                        </button>
                        {activeComponents.map((c) => (
                            <button key={c.key} type="button" data-component={c.key} aria-pressed={focus === c.key} style={{ '--cc': COLORS[c.key] }} onClick={() => onPieceFocus(c.key)}>
                                <b>{`${c.n} / ${c.verb}`}</b><strong>{c.name}</strong><span>{c.short}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                {ops.map((o, i) => (
                    <BriefPanel
                        key={o.slug}
                        id={briefId(o)}
                        // version 12 draws only the open brief (Build.css), so the
                        // static page marks every other one hidden, as it is shown
                        hidden={i !== opIndex || (isV12 && !briefIsOpen)}
                        panelRef={i === opIndex ? briefPanelRef : undefined}
                        op={o}
                        v12={isV12 ? briefs[i] : null}
                        opportunities={ops}
                        builder={builder}
                        open={i === opIndex && briefIsOpen}
                        briefMode={briefMode}
                        onBriefMode={setBriefMode}
                        onPrev={() => stepOpportunity(-1)}
                        onNext={() => stepOpportunity(1)}
                        onClose={onCloseBrief}
                        t={t}
                        locale={locale}
                    />
                ))}
            </div></section>

            <section className="proof-v12 v12-only"><div className="shell proof-v12-grid">
                <header><span className="eyebrow">{t.proof.eyebrow}</span><h2>{t.proof.title}</h2></header>
                <div className="proof-v12-copy">
                    <p>{t.proof.body[0]}</p>
                    <p>{t.proof.body[1]}</p>
                    <div className="proof-chain-v12">
                        {t.proof.chain.map((c) => <span key={c.label}><b>{c.label}</b>{c.value}</span>)}
                    </div>
                    <a href="https://ur.io/products" target="_blank" rel="noopener noreferrer">{t.proof.link}</a>
                </div>
            </div></section>

            <section className="flows shell">
                <div className="v10-flow">
                    <header className="flows-head"><span className="eyebrow">{t.flows.eyebrow}</span><div><h2>{t.flows.title}</h2></div></header>
                    <div className="flow-grid">
                        {t.flows.cards.map((card, i) => (
                            <article key={card.label} className="flow-card" style={{ '--fc': FLOW_COLORS[i] }}><b>{card.label}</b><h3>{card.title}</h3><p>{card.body}</p><em>{card.path}</em></article>
                        ))}
                    </div>
                </div>
                <div className="responsibility-v11 v11-only">
                    <header>
                        <span className="eyebrow">{isV12 ? t.responsibility.eyebrow : t.responsibility.eyebrowV11}</span>
                        <h2>{t.responsibility.title}</h2>
                        <p>{t.responsibility.body}</p>
                    </header>
                    <div className="responsibility-grid">
                        <article>
                            <b>{t.responsibility.operator.label}</b>
                            <h3>{t.responsibility.operator.title}</h3>
                            <p>{isV12 ? t.responsibility.operator.body : t.responsibility.operator.bodyV11}</p>
                        </article>
                        <article>
                            <b>{isV12 ? t.responsibility.subnet.label : t.responsibility.subnet.labelV11}</b>
                            <h3>{isV12 ? t.responsibility.subnet.title : t.responsibility.subnet.titleV11}</h3>
                            <p>{isV12 ? t.responsibility.subnet.body : t.responsibility.subnet.bodyV11}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="cta"><div className="shell cta-grid">
                <div><span className="eyebrow">{cta.eyebrow}</span><h2>{cta.title}</h2><p>{cta.copy}</p></div>
                <div className="cta-actions-v12">
                    <a href="https://t.me/ursn25" target="_blank" rel="noopener noreferrer">{t.cta.talk}</a>
                    <a className="cta-secondary-v12 v12-only" href={hasLocalizedVersion('/docs') ? localizedPathFor('/docs', lang) : '/docs'}>{t.cta.docs}</a>
                </div>
            </div></section>
        </div>
    );
}
