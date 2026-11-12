import React from 'react';

/**
 * BuildScenes — the six architecture models of the "Build on UR" page
 * (chassis, spine, tower, foundation, terminal, terminal3), the six product
 * screens and the six illustrative terminal apps.
 *
 * Ported from astro/public/build.html: the scene markup is the original's,
 * with the parts the standalone page's script filled in at load time (provider
 * dots, UID slots, console controls, the selected product's copy and screen,
 * the terminal app) rendered from props. Only one scene is active at a time —
 * the others stay in the DOM hidden (`.scene` is display:none), as they did.
 *
 * Every scene takes `op` (the selected opportunity, its text in the page's
 * language), `t` (the `build/scenes` copy unit in that language), `locale`
 * (its Intl locale, for text set in capitals), `focus` (the selected
 * component key or "") and `onFocus(key)`. The terminal and terminal3 scenes
 * also take the scrub-driven layer transforms and callout reveals; the world
 * elements expose a ref so the page can add pointer parallax without a render.
 */

/** Component accent colours, keyed by architecture component. */
export const COLORS = {
    product: 'var(--accent)',
    operator: '#ed8fff',
    subnet: '#eff7bb',
    validators: '#8cc9ff',
    miners: '#74ff61',
    providers: '#638bfc',
    emission: '#ed8fff',
    operatorproduct: 'var(--accent)',
    network: '#8cc9ff',
    subnetbase: '#eff7bb',
};

const dots = (n) => Array.from({ length: n }, (_, i) => <i key={i} />);

/** The flow-line overlays sit above every piece of a 3D world. */
const flowSvgStyle = (z, opacity) => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
    transform: `translateZ(${z}px)`,
    pointerEvents: 'none',
    ...(opacity === undefined ? {} : { opacity }),
});

function Piece({ cls, k, label, focus, onFocus, style, children, ...rest }) {
    return (
        <button
            type="button"
            className={`piece ${cls}`}
            data-component={k}
            aria-label={label}
            aria-pressed={focus === k}
            onClick={() => onFocus(k)}
            style={style}
            {...rest}
        >
            {children}
        </button>
    );
}

/** The labelled callouts around a model: { key: [eyebrow, name] }, in order. */
function Callouts({ items, focus, onFocus, revealed }) {
    return (
        <div className="callouts">
            {Object.entries(items).map(([k, [eyebrow, name]]) => (
                <button
                    key={k}
                    type="button"
                    className={`callout c-${k}${revealed && revealed(k) ? ' is-revealed' : ''}`}
                    data-component={k}
                    style={{ '--cc': COLORS[k] }}
                    aria-pressed={focus === k}
                    onClick={() => onFocus(k)}
                >
                    <span><b>{eyebrow}</b><span>{name}</span></span>
                </button>
            ))}
        </div>
    );
}

function OpProductCopy({ op, locale }) {
    return (
        <div className="op-product-copy">
            <small>{op.category.toLocaleUpperCase(locale)}</small>
            <strong>{op.title.toLocaleUpperCase(locale)}</strong>
            <span>{op.networkUse.toLocaleUpperCase(locale)}</span>
        </div>
    );
}

/* ---------- product screens (one per opportunity `visual`) ---------- */

const VISUALS = {
    vpn: (
        <svg viewBox="0 0 145 64"><rect className="v-dim" x="9" y="13" width="27" height="38" /><circle className="v-fill" cx="22.5" cy="32" r="8" /><path className="v-line" d="M36 32h35" /><rect className="v-fill" x="71" y="19" width="29" height="26" /><path className="v-line" d="M100 32h29" /><circle className="v-dot" cx="132" cy="32" r="4" /></svg>
    ),
    comms: (
        <svg viewBox="0 0 145 64"><path className="v-dim" d="M8 13h51v38H8zM86 13h51v38H86z" /><path className="v-line" d="M18 23h30M18 31h23M18 39h27M96 23h28M96 31h20M96 39h29M59 32h27" /><circle className="v-dot" cx="72" cy="32" r="4" /></svg>
    ),
    agent: (
        <svg viewBox="0 0 145 64"><rect className="v-dim" x="8" y="9" width="58" height="46" /><path className="v-line" d="M18 20h30M18 30h38M18 40h25M66 32h27M87 26l7 6-7 6" /><rect className="v-fill" x="97" y="15" width="39" height="34" /></svg>
    ),
    visibility: (
        <svg viewBox="0 0 145 64"><path className="v-dim" d="M8 9h129v46H8zM18 20h28M18 30h38M18 40h31" /><rect className="v-fill" x="72" y="18" width="14" height="28" /><rect className="v-fill" x="92" y="26" width="14" height="20" /><rect className="v-fill" x="112" y="13" width="14" height="33" /></svg>
    ),
    verification: (
        <svg viewBox="0 0 145 64"><rect className="v-dim" x="9" y="10" width="83" height="44" /><path className="v-line" d="M17 43l17-14 16 7 20-18 14 9" /><circle className="v-dot" cx="34" cy="29" r="3" /><circle className="v-dot" cx="70" cy="18" r="3" /><path className="v-fill" d="M108 16l22 8v15l-22 9-9-16z" /></svg>
    ),
    search: (
        <svg viewBox="0 0 145 64"><rect className="v-dim" x="9" y="14" width="127" height="24" /><circle className="v-fill" cx="25" cy="26" r="7" /><path className="v-line" d="M31 32l7 7M49 26h70M17 49h28M52 49h28M87 49h30" /></svg>
    ),
};

export function ProductScreen({ visual }) {
    return <div className="product-screen">{VISUALS[visual]}</div>;
}

/* ---------- illustrative terminal apps (one per opportunity `visual`) ---------- */

const APPS = {
    vpn: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual vpn-route">
                    <svg viewBox="0 0 220 132" aria-hidden="true"><path className="vpn-grid" d="M22 27H198M22 53H198M22 79H198M22 105H198M46 16V116M86 16V116M126 16V116M166 16V116" /><path className="vpn-path" d="M36 92C71 86 73 45 112 50S158 83 190 35" /><circle className="vpn-end vpn-you route-start" cx="36" cy="92" r="6" /><circle className="vpn-hop" cx="112" cy="50" r="7" /><circle className="vpn-end vpn-exit route-end" cx="190" cy="35" r="6" /><text x="24" y="112">{a.mapYou}</text><text x="94" y="40">{a.mapUid}</text><text x="145" y="24">{a.mapExit}</text></svg>
                    <div className="viz-status"><b>{a.routeKind}</b><span>{a.exitKind}</span></div>
                </div>
            </div>
        </>
    ),
    comms: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout comms-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual comms-transport">
                    <div className="comms-endpoint route-start"><i>A</i><span>{a.sender}</span><small>{a.senderRole}</small></div>
                    <div className="sealed-payload"><i></i><b>{a.payload}</b><small>{a.payloadVia}</small></div>
                    <div className="comms-endpoint route-end"><i>B</i><span>{a.recipient}</span><small>{a.recipientRole}</small></div>
                    <div className="transport-label">{a.appLayer}</div>
                    <div className="transport-rail">{a.networkLayer}</div>
                </div>
            </div>
        </>
    ),
    agent: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual agent-session">
                    <div className="agent-request route-start"><small>{a.request}</small><b>research-agent-07</b><span>{a.region}</span><span>{a.intent}</span></div>
                    <i className="agent-arrow">→</i>
                    <div className="agent-decision route-end"><small>{a.response}</small><b>{a.approved}</b><span>{a.measured}</span><span>{a.auditLog}</span></div>
                </div>
            </div>
        </>
    ),
    visibility: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual market-compare">
                    <div className="market-head"><span className="route-start">{a.samePrompt}</span><b className="route-end">{a.variation}</b></div>
                    <div className="market-card"><b>{a.markets[0].city}</b><i style={{ '--w': '82%' }} /><i style={{ '--w': '54%' }} /><small>{a.markets[0].source}</small></div>
                    <div className="market-card"><b>{a.markets[1].city}</b><i style={{ '--w': '61%' }} /><i style={{ '--w': '76%' }} /><small>{a.markets[1].source}</small></div>
                    <div className="market-card"><b>{a.markets[2].city}</b><i style={{ '--w': '92%' }} /><i style={{ '--w': '43%' }} /><small>{a.markets[2].source}</small></div>
                </div>
            </div>
        </>
    ),
    verification: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual evidence-capture">
                    <div className="evidence-preview"><small>{a.placement}</small><strong className="route-start">{a.ad}</strong><span>{a.impression}</span></div>
                    <div className="evidence-meta"><small>{a.record}</small><div><b>{a.regionLabel}</b><span>{a.region}</span></div><div><b>{a.originLabel}</b><span>{a.origin}</span></div><div><b>{a.timeLabel}</b><span>14:32:08</span></div><em className="route-end">{a.returned}</em></div>
                </div>
            </div>
        </>
    ),
    search: (a) => (
        <>
            <div className="app-topbar"><span>{a.topbar}</span><span className="app-live">{a.live}</span></div>
            <div className="app-layout">
                <div className="app-copy"><small>{a.kicker}</small><h3>{a.heading[0]}<br />{a.heading[1]}</h3><p>{a.body}</p><span className="app-action">{a.action}</span></div>
                <div className="app-visual private-query">
                    <div className="query-box route-start"><span>{a.query}</span><b>{a.routed}</b></div>
                    <div className="source-result"><i>01</i><span><b>{a.results[0].title}</b><small>{a.results[0].meta}</small></span></div>
                    <div className="source-result route-end"><i>02</i><span><b>{a.results[1].title}</b><small>{a.results[1].meta}</small></span></div>
                    <div className="privacy-note">{a.note}</div>
                </div>
            </div>
        </>
    ),
};

export function TerminalApp({ visual, t }) {
    return <div className="terminal-app">{APPS[visual](t.apps[visual])}</div>;
}

/* ---------- 05 — exchange chassis ---------- */

export function ChassisScene({ active, op, t, locale, focus, onFocus }) {
    const c = t.chassis;
    return (
        <div className={`scene scene-chassis${active ? ' is-active' : ''}`}>
            <div className="chassis-asset"><div className="chassis-world">
                <div className="chassis-shadow" />
                <Piece cls="chassis-base" k="subnet" label={c.aria.subnet} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.subnetLabel}</span>
                    <span className="foundation-rate">{c.subnetRate}</span>
                    <span className="piece-name">{c.subnetName}</span>
                </Piece>
                <Piece cls="uid-switch" k="miners" label={c.aria.miners} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.minersLabel}</span>
                    <div className="uid-slots">{dots(10)}</div>
                    <span className="piece-name">{c.minersName}</span>
                </Piece>
                <Piece cls="subnet-core" k="providers" label={c.aria.providers} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.providersLabel}</span>
                    <span className="core-copy">{c.providersCore[0]}<br />{c.providersCore[1]}</span>
                    <div className="mini-provider-grid">{dots(20)}</div>
                    <span className="piece-name">{c.providersName}</span>
                </Piece>
                <Piece cls="operator-console" k="operator" label={c.aria.operator} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.operatorLabel}</span>
                    <div className="console-controls">{dots(8)}</div>
                    <span className="piece-name">{c.operatorName}</span>
                </Piece>
                <Piece cls="validator-gantry" k="validators" label={c.aria.validators} focus={focus} onFocus={onFocus}>
                    <span className="gantry-beam" data-label={c.probes} /><i className="probe p1" /><i className="probe p2" /><i className="probe p3" />
                </Piece>
                <Piece cls="product-deck" k="product" label={c.aria.product} focus={focus} onFocus={onFocus}>
                    <OpProductCopy op={op} locale={locale} /><ProductScreen visual={op.visual} />
                </Piece>
                <Piece cls="emission-bus" k="emission" label={c.aria.emission} focus={focus} onFocus={onFocus}>
                    <span className="piece-name">{c.emissionName}</span>
                </Piece>
                <svg viewBox="0 0 570 320" style={flowSvgStyle(420)}><path className="traffic-line" d="M22 72H168C215 72 228 136 278 136H542" /><path className="verify-line" d="M366 20V245" /><path className="token-line" d="M70 298H510" /></svg>
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} items={c.callouts} />
        </div>
    );
}

/* ---------- 06 — transit spine ---------- */

export function SpineScene({ active, op, t, focus, onFocus }) {
    const c = t.spine;
    return (
        <div className={`scene scene-spine${active ? ' is-active' : ''}`}>
            <div className="spine-asset"><div className="spine-world">
                <div className="spine-shadow" /><div className="spine-rail" /><i className="packet" />
                <Piece cls="station station-product" k="product" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.productLabel}</span><i className="station-core" /><span className="piece-name">{op.short}</span>
                </Piece>
                <Piece cls="station station-operator" k="operator" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.operatorLabel}</span><i className="station-core" /><span className="piece-name">{c.operatorName}</span>
                </Piece>
                <Piece cls="station station-subnet" k="subnet" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.subnetLabel}</span><i className="station-core" /><span className="piece-name">{c.subnetName}</span>
                </Piece>
                <Piece cls="validator-bridge" k="validators" focus={focus} onFocus={onFocus}>
                    <span className="bridge-top">{c.validatorsLabel}</span><i className="bridge-probe p1" /><i className="bridge-probe p2" /><i className="bridge-probe p3" />
                </Piece>
                <Piece cls="station station-miners" k="miners" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.minersLabel}</span><i className="station-core">{dots(6)}</i><span className="piece-name">{c.minersName}</span>
                </Piece>
                <Piece cls="station station-providers" k="providers" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.providersLabel}</span><i className="station-core">{dots(8)}</i><span className="piece-name">{c.providersName}</span>
                </Piece>
                <Piece cls="spine-emission" k="emission" focus={focus} onFocus={onFocus}>
                    <span className="piece-name">{c.emissionName}</span>
                </Piece>
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} items={c.callouts} />
        </div>
    );
}

/* ---------- 07 — subnet tower ---------- */

export function TowerScene({ active, op, t, locale, focus, onFocus }) {
    const c = t.tower;
    return (
        <div className={`scene scene-tower${active ? ' is-active' : ''}`}>
            <div className="tower-asset"><div className="tower-world">
                <div className="tower-shadow" />
                <Piece cls="tower-slab tower-providers" k="providers" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.providersLabel}</span><div className="tower-provider-dots">{dots(70)}</div><span className="piece-name">{c.providersName}</span>
                </Piece>
                <Piece cls="tower-slab tower-miners" k="miners" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.minersLabel}</span><div className="miner-ring" data-top={c.ringTop} data-tail={c.ringTail} />
                </Piece>
                <Piece cls="tower-slab tower-subnet" k="subnet" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.subnetLabel}</span><div className="foundation-title">UR / SN25<small>{c.subnetFunctions}</small></div>
                </Piece>
                <Piece cls="tower-validators" k="validators" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.validatorsLabel}</span><i className="v-probe v1" /><i className="v-probe v2" /><i className="v-probe v3" />
                </Piece>
                <Piece cls="tower-slab tower-operator" k="operator" focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.operatorLabel}</span><div className="operator-studio">{c.operatorRooms.map((room) => <div key={room}>{room}</div>)}</div>
                </Piece>
                <Piece cls="tower-slab tower-product" k="product" focus={focus} onFocus={onFocus}>
                    <OpProductCopy op={op} locale={locale} /><ProductScreen visual={op.visual} />
                </Piece>
                <Piece cls="tower-emission" k="emission" focus={focus} onFocus={onFocus}>
                    <span className="piece-name">{c.emissionName}</span>
                </Piece>
                <i className="tower-traffic" />
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} items={c.callouts} />
        </div>
    );
}

/* ---------- 08 — operator gateway ---------- */

export function FoundationScene({ active, op, t, locale, focus, onFocus }) {
    const c = t.gateway;
    return (
        <div className={`scene scene-foundation${active ? ' is-active' : ''}`}>
            <div className="gateway-asset"><div className="gateway-world">
                <div className="gateway-shadow" />
                <Piece cls="gateway-piece gateway-foundation" k="subnet" label={c.aria.subnet} focus={focus} onFocus={onFocus} data-label={c.subnetName}>
                    <span className="piece-label">{c.subnetLabel}</span><span className="stays-shared">{c.subnetShared}</span><i className="foundation-route" />
                </Piece>
                <Piece cls="gateway-piece gateway-providers" k="providers" label={c.aria.providers} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.providersLabel}</span><div className="gateway-provider-dots">{dots(48)}</div><span className="piece-name">{c.providersName}</span>
                </Piece>
                <Piece cls="gateway-piece gateway-miners" k="miners" label={c.aria.miners} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.minersLabel}</span><div className="gateway-uid-bank">{dots(10)}</div><span className="piece-name">{c.minersName}</span>
                </Piece>
                <Piece cls="gateway-piece gateway-settlement" k="emission" label={c.aria.emission} focus={focus} onFocus={onFocus}>
                    <span className="piece-name">{c.emissionName}</span>
                </Piece>
                <Piece cls="gateway-piece gateway-operator" k="operator" label={c.aria.operator} focus={focus} onFocus={onFocus}>
                    <span className="piece-label">{c.operatorLabel}</span><div className="operator-ports">{dots(8)}</div><span className="operator-owns">{c.operatorOwns}</span><span className="piece-name">{c.operatorName}</span>
                </Piece>
                <Piece cls="gateway-validator" k="validators" label={c.aria.validators} focus={focus} onFocus={onFocus}>
                    <span className="validator-header">{c.validatorsLabel}</span><i className="validator-ray r1" /><i className="validator-ray r2" /><i className="validator-ray r3" />
                </Piece>
                <Piece cls="gateway-piece gateway-product" k="product" label={c.aria.product} focus={focus} onFocus={onFocus} data-op={op.slug} data-label={c.productChanges}>
                    <OpProductCopy op={op} locale={locale} /><ProductScreen visual={op.visual} />
                </Piece>
                <svg viewBox="0 0 590 330" style={flowSvgStyle(500)}><path className="traffic-line" d="M32 86H184C244 86 244 144 305 144H560" /><path className="verify-line" d="M430 28V255" /><path className="token-line" d="M56 306H532" /></svg>
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} items={c.callouts} />
        </div>
    );
}

/* ---------- 09 — operator terminal ---------- */

/**
 * `layers` maps a piece class to its inline transform (from the scrub);
 * `revealed(key)` says whether a callout has been revealed; `flowOpacity`
 * fades the flow lines in as the terminal opens; `worldRef`/`worldStyle`
 * belong to the tilted world (the page adds pointer parallax through the ref).
 */
export function TerminalScene({ active, op, t: copy, focus, onFocus, layers, revealed, flowOpacity, worldRef, worldStyle }) {
    const t = (cls) => ({ transform: layers[cls] });
    const c = copy.terminal;
    return (
        <div className={`scene scene-terminal${active ? ' is-active' : ''}`}>
            <div className="terminal-asset"><div className="terminal-world" ref={worldRef} style={worldStyle}>
                <div className="terminal-shadow" />
                <Piece cls="terminal-piece terminal-shell" k="subnet" label={c.aria.subnet} focus={focus} onFocus={onFocus} style={t('terminal-shell')} data-label={c.subnetName}>
                    <span className="piece-label">{c.subnetLabel}</span><span className="shell-status">{c.subnetStatus}</span>
                </Piece>
                <Piece cls="terminal-piece terminal-providers" k="providers" label={c.aria.providers} focus={focus} onFocus={onFocus} style={t('terminal-providers')}>
                    <span className="piece-label">{c.providersLabel}</span><div className="terminal-provider-dots">{dots(48)}</div><span className="piece-name">{c.providersName}</span>
                </Piece>
                <Piece cls="terminal-piece terminal-miners" k="miners" label={c.aria.miners} focus={focus} onFocus={onFocus} style={t('terminal-miners')}>
                    <span className="piece-label">{c.minersLabel}</span><div className="terminal-uid-bank">{dots(10)}</div><span className="piece-name">{c.minersName}</span>
                </Piece>
                <Piece cls="terminal-economics" k="emission" label={c.aria.emission} focus={focus} onFocus={onFocus} style={t('terminal-economics')}>
                    <span className="piece-name">{c.emissionName}</span>
                </Piece>
                <Piece cls="terminal-piece terminal-operator" k="operator" label={c.aria.operator} focus={focus} onFocus={onFocus} style={t('terminal-operator')}>
                    <span className="piece-label">{c.operatorLabel}</span><div className="terminal-operator-grid">{dots(8)}</div><span className="terminal-owns">{c.operatorOwns}</span><span className="piece-name">{c.operatorName}</span>
                </Piece>
                <Piece cls="terminal-piece terminal-validator" k="validators" label={c.aria.validators} focus={focus} onFocus={onFocus} style={t('terminal-validator')} data-label={c.validatorsLabel}>
                    <div className="terminal-scan-lines" />
                </Piece>
                <Piece cls="terminal-display" k="product" label={c.aria.product} focus={focus} onFocus={onFocus} style={t('terminal-display')}>
                    <TerminalApp visual={op.visual} t={copy} />
                </Piece>
                <svg viewBox="0 0 590 350" style={flowSvgStyle(500, flowOpacity)}><path className="traffic-line" d="M30 82H186C246 82 246 150 306 150H558" /><path className="verify-line" d="M430 30V266" /><path className="token-line" d="M54 326H534" /></svg>
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} revealed={revealed} items={c.callouts} />
        </div>
    );
}

/* ---------- 10 — three-plane terminal (the live model) ---------- */

export function Terminal3Scene({ active, op, t: copy, focus, onFocus, layers, revealed, worldRef, worldStyle }) {
    const t = (cls) => ({ transform: layers[cls] });
    const c = copy.terminal3;
    return (
        <div className={`scene scene-terminal3${active ? ' is-active' : ''}`}>
            <div className="terminal3-asset"><div className="terminal3-world" ref={worldRef} style={worldStyle}>
                <div className="terminal3-shadow" />
                <Piece cls="terminal3-piece terminal3-base" k="subnetbase" label={c.aria.subnetbase} focus={focus} onFocus={onFocus} style={t('terminal3-base')}>
                    <span className="piece-label">{c.baseLabel}</span>
                    <div className="sn25-simple">
                        <div className="sn25-core" data-active={c.coreActive} data-testnet={c.coreTestnet}><small>{c.coreKicker}</small><strong>SN25</strong><span>{c.coreLine}</span></div>
                        <div className="sn25-definition"><small>{c.definitionKicker}</small><strong>{c.definition}</strong><div className="foundation-rail"><span>{c.railDemand}</span><i></i><span>{c.railSupply}</span></div></div>
                        <div className="sn25-functions">{c.functions.map((f, i) => <span key={i}><b>{`0${i + 1}`}</b><strong>{f.title}</strong><small>{f.detail}</small></span>)}</div>
                        <div className="economics-split"><span><b>{c.demandTitle}</b>{c.demandFlow}</span><i>{c.separateFlows[0]}<br />{c.separateFlows[1]}</i><span><b>{c.emissionTitle}</b>{c.emissionFlow}</span></div>
                    </div>
                    <span className="piece-name">{c.baseName}</span><span className="terminal3-base-status">{c.baseStatus}</span>
                </Piece>
                <Piece cls="terminal3-piece terminal3-network" k="network" label={c.aria.network} focus={focus} onFocus={onFocus} style={t('terminal3-network')}>
                    <span className="piece-label">{c.networkLabel}</span>
                    <svg className="terminal3-mesh" viewBox="0 0 550 270" aria-hidden="true">
                        <g className="pool-zone"><rect x="164" y="42" width="128" height="186" rx="20" /><text x="179" y="61">{c.meshPool}</text></g>
                        <g className="uid-links"><path d="M90 130L210 82L226 185L350 125M90 130L226 185M210 82L350 125M226 185L350 125" /></g>
                        <g className="provider-links"><path d="M90 130L48 104M90 130L45 153M90 130L74 184M90 130L126 108M210 82L181 94M210 82L239 65M210 82L247 102M226 185L189 205M226 185L258 216M226 185L264 166M350 125L316 99M350 125L387 91M350 125L393 140M350 125L369 177" /></g>
                        <g className="provider-nodes"><circle className="route-provider-in" cx="48" cy="104" r="5" /><circle cx="45" cy="153" r="5" /><circle cx="74" cy="184" r="5" /><circle cx="126" cy="108" r="5" /><circle cx="181" cy="94" r="5" /><circle cx="239" cy="65" r="5" /><circle cx="247" cy="102" r="5" /><circle cx="189" cy="205" r="5" /><circle cx="258" cy="216" r="5" /><circle cx="264" cy="166" r="5" /><circle cx="316" cy="99" r="5" /><circle cx="387" cy="91" r="5" /><circle className="route-provider-out" cx="393" cy="140" r="5" /><circle cx="369" cy="177" r="5" /></g>
                        <g className="uid-nodes"><circle className="route-uid-a" cx="90" cy="130" r="18" /><circle className="route-uid-b" cx="210" cy="82" r="18" /><circle className="route-uid-d" cx="226" cy="185" r="18" /><circle className="route-uid-c" cx="350" cy="125" r="18" /><text x="90" y="134">018</text><text x="210" y="86">071</text><text x="226" y="189">109</text><text x="350" y="129">081</text></g>
                        <g className="checker"><rect x="425" y="48" width="105" height="172" rx="13" /><text x="442" y="72">{c.meshValidation}</text><circle cx="449" cy="103" r="10" /><path d="M444 103l4 4 7-9" /><text x="469" y="107">{c.meshUptime}</text><circle cx="449" cy="139" r="10" /><path d="M444 139l4 4 7-9" /><text x="469" y="143">{c.meshTransfer}</text><circle cx="449" cy="175" r="10" /><path d="M444 175l4 4 7-9" /><text x="469" y="179">{c.meshTransit}</text></g>
                        <g className="trace-layer trace-traffic"><path className="trace-serial" data-trace-path="serial" pathLength="1" d="M48 104L90 130L210 82L350 125L393 140" /><path className="trace-fanout-out" data-trace-path="fanout" pathLength="1" d="M48 104L90 130M90 130L210 82L239 65M90 130L226 185L258 216M90 130L350 125L387 91" /><path className="trace-fanout-return" data-trace-path="fanout" pathLength="1" d="M239 65L210 82L350 125M258 216L226 185L350 125M387 91L350 125L393 140" /></g>
                        <g className="trace-layer trace-quality"><path pathLength="1" d="M425 103L350 125M425 139L226 185M425 175L90 130" /></g>
                    </svg>
                    <div className="mesh-caption"><span><i className="pool-key" />{c.keyUid}</span><span><i className="provider-key" />{c.keyProvider}</span><span><i className="validator-key" />{c.keyValidator}</span></div>
                </Piece>
                <Piece cls="terminal3-product" k="operatorproduct" label={c.aria.operatorproduct} focus={focus} onFocus={onFocus} style={t('terminal3-product')}>
                    <TerminalApp visual={op.visual} t={copy} />
                    <div className="terminal3-operator-band"><b>{c.productBand}</b><span>{c.productOwns}</span></div>
                </Piece>
            </div></div>
            <Callouts focus={focus} onFocus={onFocus} revealed={revealed} items={c.callouts} />
        </div>
    );
}
