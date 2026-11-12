import React from 'react';

/**
 * The seven method animations of the research report. Each scene is a pure
 * function of t, the seconds into its loop, drawn into a 360×200 view: the
 * static page renders its key frame (`key`), which is also what reduced
 * motion shows, and MethodFigure.jsx plays it while it is on screen. They are
 * schematics: the numbers drawn are the real example's, the rest is
 * illustration (each figure's caption says which). The words drawn in a scene
 * (`w`) and its step lines are the page copy's `scenes.<key>`, in the page's
 * language; a step here is the second it starts.
 */
const UI = '#D6E6F4', UR = '#ED8FFF', OK = '#87FB67', BAD = '#FF6C58', WHITE = '#F8F8F8';
const TEXT = 'rgba(214,230,244,0.86)', MUTED = 'rgba(214,230,244,0.58)', LINE = 'rgba(214,230,244,0.24)', LINE2 = 'rgba(214,230,244,0.1)', PANEL = 'rgba(214,230,244,0.04)';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;

const T = ({ x, y, size = 11, fill = TEXT, anchor = 'start', opacity, children }) => (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>
);
const Check = ({ x, y, color = OK, opacity = 1 }) => (
    <path d={`M${x - 4} ${y} L${x - 1} ${y + 3} L${x + 4.5} ${y - 3.5}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
);
const Cross = ({ x, y, color = BAD, opacity = 1 }) => (
    <path d={`M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x + 3.5} ${y - 3.5} L${x - 3.5} ${y + 3.5}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={opacity} />
);

// ── 01 owners: split the memory by owner, release the one that should not be there
const OWNERS = (() => {
    const X0 = 20, W = 320;
    let x = X0;
    return [['live', 0.27], ['free', 0.15], ['slack', 0.1], ['goroutines', 0.13], ['stale', 0.35, true]]
        .map(([k, f, stale], j) => { const p = { k, x, w: f * W, stale, row: j % 2 }; x += f * W; return p; });
})();

function owners(t, uid, w) {
    const X0 = 20, W = 320, Y = 40, H = 28;
    const sx = X0 + W * seg(t, 1.4, 3.2);
    const hl = ease(seg(t, 3.5, 4.2)), rel = ease(seg(t, 5.0, 6.2));
    const stale = OWNERS[4];
    return (
        <g opacity={1 - seg(t, 8.4, 9)}>
            <T x={20} y={28} size={10} fill={MUTED}>{w.heap}</T>
            <rect x={X0} y={Y} height={H} rx="3" fill={UI} fillOpacity="0.26" width={Math.max(0.01, W * ease(seg(t, 0.2, 1.3)))} opacity={1 - seg(t, 1.4, 3.2)} />
            {OWNERS.map((p) => {
                const on = t >= 3.2 ? 1 : clamp((sx - p.x) / 30);
                const ly = Y + H + (p.row ? 38 : 22);
                const gone = p.stale ? 1 - rel : 1;
                return (
                    <g key={p.k}>
                        <rect x={p.x + 1} y={Y} height={H} rx="3" opacity={on}
                            width={Math.max(0.01, (p.w - 2) * (p.stale ? 1 - rel : 1))}
                            fill={p.stale && hl > 0 ? UR : UI}
                            fillOpacity={p.stale ? lerp(0.3, 0.85, hl) : lerp(0.3, 0.2, hl)} />
                        <line x1={p.x + p.w / 2} x2={p.x + p.w / 2} y1={Y + H + 3} y2={ly - 10} stroke={LINE} opacity={on * gone} />
                        <T x={p.x + p.w / 2} y={ly} size={10} anchor="middle" fill={p.stale && hl > 0.5 ? UR : TEXT} opacity={on * gone}>{w.parts[p.k]}</T>
                    </g>
                );
            })}
            <line x1={sx} x2={sx} y1={Y - 7} y2={Y + H + 7} stroke={UR} strokeWidth="1.5" opacity={t > 1.4 && t < 3.25 ? 1 : 0} />
            <line x1={stale.x + stale.w / 2} x2={stale.x + stale.w / 2} y1={Y + H + 27} y2={126} stroke={UR} opacity={hl * (1 - rel)} />
            <T x={340} y={140} size={10.5} anchor="end" fill={UR} opacity={hl * (1 - rel)}>{w.staleNote}</T>
            <g opacity={ease(seg(t, 6.0, 6.6))}>
                <Check x={26} y={175} />
                <T x={38} y={179} size={10.5}>{w.released}</T>
            </g>
        </g>
    );
}

// ── 02 boundary: follow one slow first page; the unmeasured stage stays unknown
const STAGES = ['dns', 'tcp', 'admit', 'carrier', 'reply'];
const STAGE_WINDOWS = (() => {
    const dur = [3.0, 0.5, 0.6, 1.4, 0.5];
    const out = [];
    let at = 0.4;
    for (const d of dur) { out.push([at, at + d]); at += d + 0.25; }
    return out;
})();
const SHARES = (() => {
    const shares = [18.103 / 33.044, 0.06, 0.08, 0.22, 0.0922];
    let acc = 20;
    return shares.map((f) => { const p = { x: acc, w: f * 320 }; acc += f * 320; return p; });
})();

function boundary(t, uid, w) {
    const bw = 56, by = 30, bh = 26, wy = 108, wh = 12;
    const cxOf = (i) => 20 + i * (bw + 10) + bw / 2;
    let dotX = cxOf(0);
    STAGE_WINDOWS.forEach(([a, b], i) => {
        if (t >= a) dotX = cxOf(i);
        if (i < 4 && t > b && t < STAGE_WINDOWS[i + 1][0]) dotX = lerp(cxOf(i), cxOf(i + 1), ease(seg(t, b, STAGE_WINDOWS[i + 1][0])));
    });
    const lastEnd = STAGE_WINDOWS[4][1];
    const rev = ease(seg(t, 7.5, 8.0)), unk = ease(seg(t, 8.1, 8.6));
    const hatch = `rr-hatch-${uid}`;
    const q = SHARES[3];
    return (
        <g opacity={1 - seg(t, 9.4, 10)}>
            <defs>
                <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="5" height="5" fill="rgba(214,230,244,0.06)" />
                    <line x1="0" x2="0" y1="0" y2="5" stroke="rgba(214,230,244,0.45)" strokeWidth="1.5" />
                </pattern>
            </defs>
            {STAGES.map((n, i) => {
                const x = 20 + i * (bw + 10);
                const live = t >= STAGE_WINDOWS[i][0] && t <= STAGE_WINDOWS[i][1];
                return (
                    <g key={n}>
                        {i > 0 && <line x1={x - 10} x2={x} y1={by + bh / 2} y2={by + bh / 2} stroke={LINE} />}
                        <rect x={x} y={by} width={bw} height={bh} rx="4" fill={PANEL} stroke={i === 0 && t > 7.5 ? UR : (live ? 'rgba(214,230,244,0.7)' : LINE)} />
                        <T x={x + bw / 2} y={by + 17} anchor="middle">{w.stages[n]}</T>
                    </g>
                );
            })}
            <T x={20} y={100} size={10} fill={MUTED}>{w.axis}</T>
            {SHARES.map((p, i) => (
                <rect key={i} x={p.x + (i ? 1 : 0)} y={wy} height={wh} rx="2"
                    width={Math.max(0, (p.w - (i ? 1 : 0)) * seg(t, STAGE_WINDOWS[i][0], STAGE_WINDOWS[i][1]))}
                    fill={i === 3 ? `url(#${hatch})` : (i === 0 && rev > 0 ? UR : UI)}
                    fillOpacity={i === 3 ? 1 : (i === 0 ? lerp(0.35, 0.85, rev) : 0.35)} />
            ))}
            <circle cx={dotX} cy={by + bh / 2} r="5" fill={UR} opacity={seg(t, 0, 0.4) * (1 - seg(t, lastEnd + 0.2, lastEnd + 0.7))} />
            <T x={20} y={wy + 28} fill={UR} opacity={rev}>{w.dns}</T>
            <T x={340} y={wy + 28} anchor="end" fill={WHITE} opacity={rev}>{w.total}</T>
            <T x={q.x + q.w / 2} y={wy - 4} anchor="middle" fill={WHITE} opacity={unk}>?</T>
            <line x1={q.x + q.w / 2} x2={q.x + q.w / 2} y1={wy + wh + 2} y2={160} stroke={LINE} opacity={unk} />
            <T x={340} y={174} size={10.5} anchor="end" opacity={unk}>{w.unknown}</T>
        </g>
    );
}

// ── 03 deterministic: on a fixed clock the failure lands on the same tick every run
function deterministic(t, uid, w) {
    const X0 = 82, X1 = 334, N = 12, tx = (k) => X0 + (k / N) * (X1 - X0);
    const kO = seg(t, 0.5, 3.4) * N, kN = seg(t, 5.0, 7.3) * N;
    const events = [1, 3, 4, 6];
    const rowsSpec = [{ y: 54 }, { y: 80 }, { y: 106 }, { y: 154 }];
    const held = t >= 0.5 && kO >= 5 && kO < 7 ? 1 : 0;
    const failed = t >= 0.5 && kO >= 9 ? 1 : 0;
    const passed = t >= 5.0 && kN >= 9 ? 1 : 0;
    return (
        <g opacity={1 - seg(t, 9.4, 10)}>
            <T x={20} y={26} size={10} fill={MUTED}>{w.clock}</T>
            <line x1={X0} x2={X1} y1={22} y2={22} stroke={LINE} />
            {Array.from({ length: N + 1 }, (_, k) => (
                <g key={k}>
                    <line x1={tx(k)} x2={tx(k)} y1={19} y2={25} stroke={LINE} />
                    {k % 3 === 0 && <T x={tx(k)} y={13} size={9} anchor="middle" fill={MUTED}>{k}</T>}
                </g>
            ))}
            {rowsSpec.map((r, j) => {
                const k = j < 3 ? kO : kN, live = j < 3 ? t >= 0.5 : t >= 5.0;
                return (
                    <g key={r.y}>
                        <T x={20} y={r.y + 4} size={10} fill={j === 3 ? UI : MUTED}>{w.rows[j]}</T>
                        <line x1={X0} x2={X1} y1={r.y} y2={r.y} stroke={LINE2} />
                        {events.map((e) => <circle key={e} cx={tx(e)} cy={r.y} r="3.2" fill={UI} opacity={live && k >= e ? 0.85 : 0} />)}
                        {j < 3 && <Cross x={tx(9)} y={r.y} opacity={failed} />}
                    </g>
                );
            })}
            <rect x={tx(5) - 1.5} y={44} width="3" height="72" rx="1.5" fill={UI} opacity={held} />
            <T x={tx(5)} y={40} size={9} anchor="middle" fill={MUTED} opacity={held}>{w.held}</T>
            <rect x={tx(5) - 1.5} y={144} width="3" height="20" rx="1.5" fill={UI} opacity={t >= 5.0 && kN >= 5 && kN < 7 ? 1 : 0} />
            <T x={X1} y={129} size={10} anchor="end" opacity={failed}>{w.failed}</T>
            <Check x={tx(9)} y={154} opacity={passed} />
            <T x={X1} y={180} size={10} anchor="end" opacity={passed}>{w.passed}</T>
            <line x1={tx(kO)} x2={tx(kO)} y1={44} y2={116} stroke={UR} strokeWidth="1.5" opacity={t > 0.5 && t < 3.45 ? 1 : 0} />
            <line x1={tx(kN)} x2={tx(kN)} y1={144} y2={164} stroke={UR} strokeWidth="1.5" opacity={t > 5.0 && t < 7.35 ? 1 : 0} />
        </g>
    );
}

// ── 04 one change at a time, with the failures kept in the record (Oct 21)
function oneAtATime(t, uid, w) {
    const drainOff = ease(seg(t, 2.6, 3.0)) * (1 - ease(seg(t, 4.6, 5.0)));
    const pacingOff = ease(seg(t, 5.0, 5.4));
    const switches = [['pacing', 50, 1 - pacingOff], ['drain', 80, 1 - drainOff], ['resizing', 110, 1]];
    let fill = 0, status = '', bad = false, good = false;
    if (t < 2.6) { fill = 0.49 * ease(seg(t, 0.3, 2.0)); if (t > 2.0) { status = w.stopped; bad = true; } }
    else if (t < 4.6) { if (t >= 4.0) { status = w.stillFailed; bad = true; } else if (t > 3.0) status = w.running; }
    else { fill = ease(seg(t, 5.4, 7.6)); if (t > 7.6) { status = w.passed; good = true; } }
    const running = t > 3.0 && t < 4.0;
    const ph = (t - 3.0) / 1.0, pp = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    const record = [[w.rows.all, w.stoppedShort, false, ease(seg(t, 2.2, 2.6))], [w.rows.drain, w.stillFailed, false, ease(seg(t, 4.2, 4.6))], [w.rows.pacing, w.passedShort, true, ease(seg(t, 7.7, 8.1))]];
    return (
        <g opacity={1 - seg(t, 10.4, 11)}>
            <T x={20} y={26} size={10} fill={MUTED}>{w.change}</T>
            {switches.map(([l, y, v]) => (
                <g key={l}>
                    <T x={20} y={y + 4}>{w.switches[l]}</T>
                    <rect x={122} y={y - 8} width="30" height="16" rx="8" fill={v > 0.5 ? 'rgba(237,143,255,0.8)' : 'transparent'} stroke={v > 0.5 ? 'none' : 'rgba(214,230,244,0.5)'} />
                    <circle cx={lerp(130, 144, v)} cy={y} r="5.5" fill={v > 0.5 ? WHITE : UI} />
                </g>
            ))}
            <T x={122} y={132} size={9.5} fill={OK} opacity={ease(seg(t, 8.1, 8.5))}>{w.keptOn}</T>
            <T x={186} y={26} size={10} fill={MUTED}>{w.test}</T>
            <rect x={186} y={40} width="154" height="8" rx="4" fill="rgba(214,230,244,0.1)" />
            <rect x={186} y={40} height="8" rx="4" fill={UI} width={Math.max(0.01, 154 * fill)} />
            <rect x={186 + (154 - 32) * ease(clamp(pp))} y={40} height="8" width="32" rx="4" fill={UI} opacity={running ? 1 : 0} />
            <Cross x={191} y={64} opacity={bad ? 1 : 0} />
            <Check x={191} y={64} opacity={good ? 1 : 0} />
            <T x={202} y={68} size={10.5} fill={bad ? BAD : (good ? OK : TEXT)}>{status}</T>
            <T x={186} y={96} size={10} fill={MUTED}>{w.record}</T>
            {record.map(([a, b, ok, o], j) => (
                <g key={j} opacity={o}>
                    {ok ? <Check x={191} y={115 + j * 22} /> : <Cross x={191} y={115 + j * 22} />}
                    <T x={202} y={118 + j * 22} size={10}>{a}</T>
                    <T x={340} y={118 + j * 22} size={10} anchor="end" fill={MUTED}>{b}</T>
                </g>
            ))}
        </g>
    );
}

// ── 05 every layer gets its own measurement (the Sep 22 SIMD masking test)
// each layer's words are the copy's scenes.layers.rows, in this order
const LAYERS = [
    { y: 20, kind: 'dim' },
    { y: 61, kind: 'none' },
    { y: 102, kind: 'up' },
    { y: 143, kind: 'up' },
];
const LAYER_PLAN = [
    { j: 3, sweep: [0.3, 1.1], show: 1.1 },
    { j: 2, arrow: [1.2, 1.4], sweep: [1.4, 2.6], show: 2.6 },
    { j: 1, arrow: [3.2, 3.4], sweep: [3.4, 5.4], show: 5.4 },
    { j: 0, show: 5.9 },
];

function layers(t, uid, w) {
    return (
        <g opacity={1 - seg(t, 9.4, 10)}>
            {LAYERS.map((b, j) => {
                const plan = LAYER_PLAN.find((p) => p.j === j);
                const sweep = plan.sweep ? 320 * ease(seg(t, plan.sweep[0], plan.sweep[1])) * (1 - seg(t, plan.show, plan.show + 0.5)) : 0;
                const on = ease(seg(t, plan.show, plan.show + 0.35));
                const { l, u, res: txt } = w.rows[j];
                const { kind } = b;
                return (
                    <g key={b.y}>
                        <rect x={20} y={b.y} width="320" height="34" rx="4" fill={PANEL} stroke={LINE} />
                        <rect x={20} y={b.y} width={sweep} height="34" rx="4" fill="rgba(214,230,244,0.08)" />
                        <T x={32} y={b.y + 15}>{l}</T>
                        <T x={32} y={b.y + 27} size={9.5} fill={MUTED}>{u}</T>
                        <rect x={246} y={b.y + 8} width="84" height="18" rx="9" fill="none" opacity={on}
                            stroke={kind === 'up' ? UR : (kind === 'none' ? 'rgba(214,230,244,0.6)' : 'rgba(214,230,244,0.25)')} />
                        <T x={288} y={b.y + 21} size={10} anchor="middle" opacity={on}
                            fill={kind === 'up' ? WHITE : (kind === 'none' ? UI : 'rgba(214,230,244,0.45)')}>{txt}</T>
                    </g>
                );
            })}
            {LAYER_PLAN.filter((p) => p.arrow).map((p) => (
                <path key={p.j} d={`M288 ${LAYERS[p.j + 1].y + 8} L288 ${LAYERS[p.j].y + 26}`} stroke={UR} strokeWidth="1.5" opacity={ease(seg(t, p.arrow[0], p.arrow[1]))} />
            ))}
        </g>
    );
}

// ── 06 measure the noise with A/A first; only an effect beyond it counts
function noise(t, uid, w) {
    const X = (v) => 40 + v * 290;
    const axisY = 178;
    const runs = [{ l: 'A', y: 48, v: [0.36, 0.41, 0.46, 0.5, 0.55], at: 0.3, step: 0.3 }, { l: 'A′', y: 72, v: [0.38, 0.43, 0.45, 0.52, 0.58], at: 1.6, step: 0.25 }];
    const band = ease(seg(t, 3.0, 3.6));
    return (
        <g opacity={1 - seg(t, 10.4, 11)}>
            <rect x={X(0.355)} y={30} width={X(0.585) - X(0.355)} height="140" fill="rgba(214,230,244,0.07)" opacity={band} />
            <T x={(X(0.355) + X(0.585)) / 2} y={24} size={10} anchor="middle" fill={MUTED} opacity={band}>{w.band}</T>
            <line x1={40} x2={330} y1={axisY} y2={axisY} stroke={LINE} />
            <T x={330} y={axisY + 14} size={9.5} anchor="end" fill={MUTED}>{w.axis}</T>
            {runs.map((r) => (
                <g key={r.l}>
                    <T x={20} y={r.y + 4} size={10} fill={MUTED}>{r.l}</T>
                    {r.v.map((v, j) => <circle key={j} cx={X(v)} cy={r.y} r="3.4" fill={UI} opacity={ease(seg(t, r.at + j * r.step, r.at + 0.3 + j * r.step)) * 0.85} />)}
                </g>
            ))}
            <T x={20} y={112} size={10} fill={MUTED} opacity={ease(seg(t, 4.0, 4.3))}>{w.order}</T>
            {'B C C B B C C B'.split(' ').map((c, j) => (
                <T key={j} x={108 + j * 18} y={112} anchor="middle" fill={c === 'C' ? UR : UI} opacity={ease(seg(t, 4.0 + j * 0.16, 4.3 + j * 0.16))}>{c}</T>
            ))}
            <T x={20} y={152} size={10} fill={MUTED}>{w.fresh}</T>
            <circle cx={X(0.5)} cy={148} r="5" fill={UR} opacity={ease(seg(t, 5.6, 6.1))} />
            <T x={X(0.5)} y={136} size={10} anchor="middle" opacity={ease(seg(t, 6.1, 6.5))}>{w.noVerdict}</T>
            <circle cx={X(0.84)} cy={148} r="5" fill={UR} opacity={ease(seg(t, 7.4, 7.9))} />
            <Check x={X(0.84) + 14} y={148} opacity={ease(seg(t, 7.9, 8.3))} />
            <T x={X(0.84)} y={136} size={10} anchor="middle" opacity={ease(seg(t, 7.9, 8.3))}>{w.effect}</T>
        </g>
    );
}

// ── 07 every attempt stays in the record; dropping failures would flatter the median
const RUNS = [52, 60, 120, 66, 70, 78, 120, 84, 120, 90].map((v, i) => ({ v, fail: v === 120, x: 36 + i * 29 }));

function validity(t, uid, w) {
    const base = 172, bw = 18;
    const drop = ease(seg(t, 3.2, 3.8)) * (1 - ease(seg(t, 6.0, 6.6)));
    const surv = ease(seg(t, 3.6, 4.2)) * (1 - ease(seg(t, 6.0, 6.5)));
    const strike = ease(seg(t, 4.8, 5.2)) * (1 - ease(seg(t, 6.0, 6.5)));
    const all = ease(seg(t, 6.2, 6.8));
    const yAll = base - 81, ySurv = base - 70;
    return (
        <g opacity={1 - seg(t, 10.4, 11)}>
            <T x={20} y={22} size={10} fill={MUTED}>{w.axis}</T>
            <line x1={30} x2={340} y1={base - 124} y2={base - 124} stroke="rgba(255,108,88,0.5)" />
            <T x={340} y={base - 128} size={9} anchor="end" fill="rgba(255,108,88,0.85)">{w.deadline}</T>
            <line x1={30} x2={340} y1={base} y2={base} stroke={LINE} />
            {RUNS.map((r, i) => {
                const on = ease(seg(t, 0.3 + i * 0.26, 0.55 + i * 0.26));
                return (
                    <g key={i}>
                        <rect x={r.x} y={base - r.v} width={bw} height={r.v} rx="3"
                            fill={r.fail ? 'rgba(255,108,88,0.16)' : UI} fillOpacity={r.fail ? 1 : 0.42}
                            stroke={r.fail ? BAD : 'none'} strokeWidth="1" opacity={on * (r.fail ? 1 - drop * 0.85 : 1)} />
                        {r.fail
                            ? <Cross x={r.x + bw / 2} y={base - r.v - 10} opacity={on * (1 - drop)} />
                            : <Check x={r.x + bw / 2} y={base - r.v - 10} opacity={on} />}
                    </g>
                );
            })}
            <line x1={30} x2={340} y1={ySurv} y2={ySurv} stroke={UI} strokeWidth="1.5" opacity={surv} />
            <T x={30} y={ySurv + 14} size={10} opacity={surv}>{w.survivor}</T>
            <line x1={28} x2={178} y1={ySurv + 10} y2={ySurv + 10} stroke={BAD} strokeWidth="1.5" opacity={strike} />
            <T x={184} y={ySurv + 14} size={10} fill={BAD} opacity={strike}>{w.notAllowed}</T>
            <line x1={30} x2={340} y1={yAll} y2={yAll} stroke={WHITE} strokeWidth="1.5" opacity={all} />
            <T x={340} y={yAll - 5} size={10} anchor="end" fill={WHITE} opacity={all}>{w.all}</T>
        </g>
    );
}

// steps: the second each step line starts (its words: the copy's scenes.<key>.steps, in order)
export const SCENES = {
    owners: { duration: 9, key: 6.9, render: owners, steps: [0, 1.4, 3.5, 5.0] },
    boundary: { duration: 10, key: 8.9, render: boundary, steps: [0, 3.6, 7.5, 8.1] },
    deterministic: { duration: 10, key: 9.0, render: deterministic, steps: [0, 0.5, 3.4, 5.0, 7.3] },
    ablation: { duration: 11, key: 10.3, render: oneAtATime, steps: [0, 2.6, 4.6, 7.9] },
    layers: { duration: 10, key: 9.3, render: layers, steps: [0, 1.4, 3.4, 5.8] },
    noise: { duration: 11, key: 10.3, render: noise, steps: [0, 3.0, 4.0, 5.6, 7.4] },
    validity: { duration: 11, key: 10.3, render: validity, steps: [0, 3.2, 4.8, 6.0] },
};
