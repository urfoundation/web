// /build, "Build on UR": the page around the architecture model (react/src/components/pages/Build.jsx)
// and the opportunity readout and brief (BuildBrief.jsx). The opportunities' own words are the units
// build/opportunities and build/briefs; the models' labels are build/scenes.
//
// The live page is version 12. Versions 11 (?model=terminal4) and 10 (?model=chassis, spine, tower,
// foundation, terminal, terminal3) stay reachable through the address, so their wording is here too:
// keys ending in V10 / V11, or grouped under `v10` / `v11`, belong to them.
//
// Text in capitals is shown as written (small labels styled as a terminal UI): write it in capitals in
// languages that have them. "01 /", "02 /" … number the parts and stay as they are.
export default {
    meta: {
        // the page's <title>: at most 60 characters
        title: 'Build on UR | Network Operator opportunities',
        // the meta description: at most 175 characters
        description: 'Build products on UR as a Network Operator using shared residential capacity, measured service quality, and the SN25 incentive layer.',
        // the page's name in the breadcrumb trail
        breadcrumb: 'Build on UR',
    },

    hero: {
        // the page's h1
        title: 'Build on UR',
        // version 12
        eyebrow: 'Build',
        intro: 'Launch or migrate existing products onto UR’s residential privacy network. Network Operators own the customer experience and bring demand; UR provides the infrastructure. UR (SN25) is extending network coordination and incentives to Bittensor.',
        // three figures, each a number (kept) and the words after it
        proof: {
            providers: 'providers',
            countries: 'countries',
            users: 'monthly users on URnetwork',
        },
        quiet: 'The network is live. Its next product may not exist yet.',
        // version 10 and 11: a kicker beside the h1, and the intro's eyebrow, two-line heading and paragraph
        kicker: 'Network Operator opportunities',
        v10: {
            eyebrow: 'The opportunity',
            heading: ['Bring the product.', 'Build on the subnet.'],
            intro: 'A Network Operator turns customer demand into a product powered by UR. The operator owns the experience and commercial relationship; SN25 supplies measured residential routing and the incentive market beneath it.',
        },
        v11: {
            eyebrow: 'For builders',
            heading: ['Bring the product.', 'Build on the network.'],
            intro: 'Build a customer product on top of UR’s shared residential network. You own the experience, users and commercial model; SN25 coordinates access, service measurement and incentives underneath.',
        },
        // version 10 and 11's three figures: "100K+ NETWORK PROVIDERS", "100+ COUNTRIES", "LIVE NETWORK INFRASTRUCTURE"
        proofV11: {
            providers: 'NETWORK PROVIDERS',
            countries: 'COUNTRIES',
            live: 'LIVE',
            infrastructure: 'NETWORK INFRASTRUCTURE',
        },
        // the accessible name of the row of figures
        proofAria: 'UR network reach',
        // two boxes: what a builder brings, what the subnet provides
        bring: {
            label: 'YOU BRING',
            title: 'Product, customers and distribution',
            body: 'Brand, interface, identity, billing, policy, support and a useful reason for network demand.',
        },
        provides: {
            label: 'THE SUBNET PROVIDES',
            title: 'Supply, measurement and incentives',
            body: '100K+ residential providers across 100+ countries, validators, miner UIDs and SN25 settlement.',
        },
    },

    // the model section's heading: a small numbered label, the h2, a paragraph and the model's caption
    // (`meta`, shown in capitals at the top of the model)
    section: {
        v12: { number: 'Network Operator model', title: 'See the network beneath the product.', copy: 'Select one of six example products, then reveal the provider network and subnet foundation beneath its interface. Each shows one way builders could use the same shared infrastructure.', meta: 'UR / ONE PRODUCT · TWO SHARED PLANES' },
        v11: { number: 'Six starting points', title: 'What could run on UR?', copy: 'Choose an example to see an illustrative product surface above the same provider network and SN25 foundation. The six are prompts for builders, not a limit on what the infrastructure can support.', meta: 'UR / BUILD ON SHARED INFRASTRUCTURE' },
        // version 10, by model
        models: {
            chassis: { number: '05 / Exchange chassis', title: 'Open the network operator.', copy: 'The chassis turns the architecture into one coherent machine. Open it to separate the customer product from the operator, subnet access, validation, miner market and residential supply.', meta: 'UR / NETWORK OPERATOR EXCHANGE' },
            spine: { number: '06 / Transit spine', title: 'Follow demand through the subnet.', copy: 'The transit spine reads left to right: customer demand enters an operator, crosses SN25 and its validation bridge, resolves through miner UIDs and exits through residential supply.', meta: 'UR / DEMAND TRANSIT SPINE' },
            tower: { number: '07 / Subnet tower', title: 'Build upward from SN25.', copy: 'The tower makes the hierarchy literal. Residential supply and the miner market support SN25; validators measure it; the operator and customer product occupy the floors above.', meta: 'UR / SUBNET FOUNDATION TOWER' },
            foundation: { number: '08 / Operator gateway', title: 'Change the product. Keep the foundation.', copy: 'The gateway is one coherent system: the selected opportunity becomes the product module, the Network Operator remains the control plane, and SN25 stays underneath as the shared foundation for routing, measurement and incentives.', meta: 'UR / NETWORK OPERATOR GATEWAY' },
            terminal: { number: '09 / Operator terminal', title: 'See the product. Then open the system.', copy: 'The terminal begins as the customer-facing product a Network Operator brings to market. Drag it apart to see how operator services and the shared SN25 architecture power that product underneath.', meta: 'UR / NETWORK OPERATOR TERMINAL' },
            terminal3: { number: '10 / Three-plane terminal', title: 'One operator product. Two shared planes underneath.', copy: 'The product and Network Operator now form one changing module. Open the terminal to reveal the shared provider-and-validator network seated on the SN25 protocol and economic foundation.', meta: 'UR / THREE-PLANE OPERATOR TERMINAL' },
        },
        modelNote: 'Functional teaching model · architecture grounded in the SN25 deck',
    },

    intro: {
        kicker: 'SELECT ONE OF SIX EXAMPLES',
        title: 'The product changes. The network foundation does not.',
        body: 'These are inspiration points rather than a catalogue of what can be built. Choose an example to see its customer proposition and demand profile placed on the same SN25 architecture.',
    },

    // the six opportunity tabs: their list's accessible name
    tabsAria: 'Six example opportunities',
    // two tabs above the model: the live model, or the full brief
    contentSwitch: {
        aria: 'Choose live model or detailed opportunity brief',
        model: 'LIVE PRODUCT + NETWORK MODEL',
        brief: 'PRODUCT BRIEF — FULL EXPLAINER',
    },

    stage: {
        // beside the model's caption, at the top of the model
        separately: 'TRAFFIC, QUALITY + ECONOMICS SHOWN SEPARATELY',
        // the model's view buttons and their group's accessible name
        controlsAria: 'Architecture view',
        showAll: 'SHOW ALL',
        assembled: 'ASSEMBLED',
        openArchitecture: 'OPEN ARCHITECTURE',
        // the key of the model's three kinds of line
        traffic: 'TRAFFIC',
        verification: 'VERIFICATION',
        economics: 'ECONOMICS',
        // the accessible name of the rail with the reveal slider and the trace button
        railAria: 'Reveal and trace the network system',
        // below the tabs (version 12)
        selectorKicker: 'SIX PLACES TO BEGIN',
        selectorTitle: 'Illustrative opportunities for builders.',
    },

    // the reveal slider: its two end labels per model, its accessible name and its spoken value
    scrub: {
        assembled: 'ASSEMBLED',
        revealed: 'REVEALED',
        exploded: 'EXPLODED',
        product: 'PRODUCT',
        network: 'NETWORK',
        aria: 'Reveal the network architecture inside the operator terminal',
        valueStart: 'Network Operator product assembled',
        valueEnd: 'Three network planes fully revealed',
        // {pct} is a whole number from 1 to 99
        valueMiddle: '{pct} percent exploded',
    },

    // "trace one session": a short animation of one session through the network, with a status line
    trace: {
        // the button: start, stop, replay
        start: 'TRACE ONE SESSION',
        stop: 'STOP TRACE',
        replay: 'REPLAY TRACE',
        opening: 'OPENING THE THREE PLANES…',
        quality: '02 / VALIDATORS CHECK UPTIME, TRANSFER + TRANSIT',
        done: 'SESSION ROUTED + VALIDATED',
        // the status line before a trace, on the version 10 models other than terminal3
        idleOther: 'WATCH ONE PRODUCT SESSION ROUTE + VALIDATE',
        // the two steps of a trace, after their numbers 01 and 02, and their list's accessible name
        stepsAria: 'System trace steps',
        stepRoute: 'ROUTE',
        stepValidate: 'VALIDATE',
        // the status lines of a trace, by the kind of traffic an opportunity makes: point-to-point (VPN,
        // communications), request and response (agents, search), fan-out (visibility, verification).
        // `messages` follow each other during the traffic step.
        modes: {
            point: { idle: 'POINT-TO-POINT · TRACE ONE SESSION', start: '01A / SESSION ENTERS THE NETWORK', messages: ['01B / BLUE INGRESS PROVIDER CONNECTED', '01C / MINER UIDS ROUTE THE SESSION', '01D / BLUE EGRESS PROVIDER REACHED', '01E / DESTINATION ENDPOINT REACHED'] },
            roundtrip: { idle: 'REQUEST + RESPONSE · TRACE ONE SESSION', start: '01A / PRODUCT REQUEST ENTERS THE NETWORK', messages: ['01B / BLUE INGRESS PROVIDER CONNECTED', '01C / MINER UIDS ROUTE THE REQUEST', '01D / BLUE EGRESS PROVIDER REACHES THE TARGET', '01E / RESPONSE RETURNS TO THE PRODUCT'] },
            fanout: { idle: 'FAN-OUT + COLLECT · TRACE ONE RUN', start: '01A / PRODUCT REQUEST ENTERS THE NETWORK', messages: ['01B / BLUE INGRESS PROVIDER CONNECTED', '01C / REQUEST FANS ACROSS MINER UIDS', '01D / RESIDENTIAL OBSERVATIONS COLLECTED', '01E / EVIDENCE RETURNS TO THE PRODUCT'] },
        },
    },

    // the "selected layer" readout when no part of the model is selected: a name, a paragraph and a
    // line in capitals, per model
    layer: {
        label: 'SELECTED LAYER',
        closeAria: 'Close selected layer details',
        builder: {
            name: 'Product above shared infrastructure',
            detail: 'The selected operator product sits above the shared provider network and SN25 foundation. Move the reveal slider to separate the system, then select a plane to understand its role.',
        },
        terminal3: {
            name: 'Complete three-plane system',
            detail: 'The terminal has three planes: the changing Network Operator product, the shared provider-and-validator network, and the shared SN25 protocol and economic foundation. Drag the reveal control to separate them.',
            short: 'ONE OPERATOR PRODUCT · TWO SHARED PLANES',
        },
        terminal: {
            detail: 'The terminal starts as the complete customer-facing product. Drag the reveal control to separate its product screen, operator services and shared SN25 architecture, then select a labelled layer to inspect its role.',
            short: 'ONE RECOGNISABLE PRODUCT · ONE SHARED FOUNDATION',
        },
        // the version 10 models other than terminal and terminal3
        other: {
            name: 'Complete operator system',
            detail: 'Open the gateway to see the product module above the operator control plane and shared SN25 foundation. Select any labelled layer to isolate its role.',
            short: 'ONE PRODUCT MODULE · ONE SHARED FOUNDATION',
        },
    },

    // the key of the model's parts, below it: its accessible name and its first button (all parts)
    componentKey: {
        aria: 'Inspect architecture components',
        all: '00 / ALL',
        allTerminal3: 'Complete three-plane system',
        allOther: 'Complete system',
        allDetail: 'Show all architecture functions.',
    },

    // the readout beside the model, one per opportunity
    readout: {
        // {n} is the opportunity's number, 01 to 06
        example: 'EXAMPLE {n}',
        oneOfMany: 'ONE OF MANY',
        sixStartingPoints: 'SIX STARTING POINTS',
        demandShape: 'DEMAND SHAPE',
        networkReliance: 'NETWORK RELIANCE',
        product: 'THE PRODUCT',
        usesSn25: 'HOW IT USES SN25',
        // the button that opens and closes the brief (version 12, then the earlier editions)
        openBrief: 'OPEN EXAMPLE BRIEF',
        hideBrief: 'HIDE EXAMPLE BRIEF',
        exploreOpportunity: 'EXPLORE THIS OPPORTUNITY',
        closeOpportunity: 'CLOSE THIS OPPORTUNITY',
        readFullBrief: 'READ FULL OPPORTUNITY BRIEF',
        closeFullBrief: 'CLOSE OPPORTUNITY BRIEF',
    },

    // the opportunity brief
    brief: {
        // {n} is the opportunity's number (01 to 06), {category} its category in capitals
        number: 'OPPORTUNITY {n} / {category}',
        // a tag: {reliance} is the opportunity's network reliance in capitals ("CRITICAL", "HIGH")
        relianceTag: '{reliance} NETWORK RELIANCE',
        navAria: 'Move between opportunity briefs',
        previous: '← PREVIOUS',
        next: 'NEXT →',
        close: 'CLOSE BRIEF',
        compare: 'COMPARE BRIEF TREATMENTS',
        compareAria: 'Brief treatment',
        editorial: 'EDITORIAL',
        structured: 'STRUCTURED',
        // the live page's three story sections
        storyOpportunity: '01 / OPPORTUNITY',
        storyWhyUr: '02 / WHY UR',
        storyOwns: '03 / THE OPERATOR OWNS',
        storyOwnsTitle: 'What remains with the operator',
        // the earlier editions' story sections (the second is "02 / " and the opportunity's own label)
        storyTheOpportunity: '01 / THE OPPORTUNITY',
        storyWhySn25: '03 / WHY SN25',
        // the facts beside the story
        railKicker: 'ONE OF MANY POSSIBILITIES',
        railCustomer: 'POTENTIAL CUSTOMER',
        railDemand: 'DEMAND SHAPE',
        railNetworkUse: 'NETWORK USE',
        railOwns: 'WHAT THE OPERATOR OWNS',
        railOpen: 'WHERE IT COULD GO',
        // the navigation at the end of a brief
        footerAria: 'Continue through opportunity briefs',
        previousExample: '← PREVIOUS EXAMPLE',
        examples: 'INSPIRATION EXAMPLES',
        nextExample: 'NEXT EXAMPLE →',
        // the structured brief's chapters and blocks
        chapterOpportunity: '01 / OPPORTUNITY',
        chapterOpportunityTitle: 'What the product could become',
        potentialCustomer: 'Potential customer',
        problem: 'The problem',
        proposition: 'Product proposition',
        chapterInUse: '02 / IN USE',
        chapterInUseTitle: 'How demand reaches the network',
        scenario: 'Concrete usage scenario',
        path: 'How demand moves through the network',
        chapterBoundary: '03 / BOUNDARY',
        chapterBoundaryTitle: 'What you build. What SN25 provides.',
        operatorOwns: 'What the operator owns',
        urSupplies: 'What UR / SN25 supplies',
        valueExchange: 'Where the value exchange happens',
        constraints: 'Important constraints and open questions',
    },

    // the first Network Operator, live today (version 12)
    proof: {
        eyebrow: 'LIVE TODAY / BRINGYOUR',
        title: 'BringYour is the first Network Operator.',
        body: [
            'Its first product, URnetwork, is a consumer VPN available across mobile, desktop and browser. BringYour owns the product experience and customer relationship; UR provides the network that powers it.',
            'URnetwork has more than 350K monthly active users. This shows the model working at consumer scale: operator demand routed across shared provider capacity.',
        ],
        // three facts: a label in capitals and its value
        chain: [
            { label: 'CUSTOMER PRODUCT', value: 'URnetwork VPN' },
            { label: 'NETWORK DEMAND', value: 'Active users + data moved' },
            { label: 'SHARED SUPPLY', value: '100K+ providers across 100+ countries' },
        ],
        // a link to the VPN's page on ur.io
        link: 'EXPLORE THE URNETWORK VPN ↗',
    },

    // the three paths the shared foundation takes (version 10 layout)
    flows: {
        eyebrow: 'The shared foundation in three paths',
        title: 'One demand signal. Three network responses.',
        // each: a label in capitals, a title, a paragraph and the path in short
        cards: [
            { label: '01 / TRAFFIC', title: 'Customer demand becomes routed service', body: 'The operator authenticates and applies product policy. SN25 coordinates a measured path through miner capacity and residential ingress or egress.', path: 'Product → operator → miner path → provider exit' },
            { label: '02 / QUALITY', title: 'Validators test the path independently', body: 'Validators walk operator-assigned chains and measure uptime, transfer and proof-of-transit. That quality signal informs consensus.', path: 'Validator probes → measured quality → UID scoring' },
            { label: '03 / ECONOMICS', title: 'Demand and rewards remain separate flows', body: 'Operator deposits enter the subnet reserve. Bittensor emission rewards miners and validators for measured useful service; deposits are not passed through as miner payouts.', path: 'Operator deposit → reserve · emission → measured supply' },
        ],
    },

    // who does what (versions 11 and 12; the v12 wording first, the version 11 wording beside it)
    responsibility: {
        eyebrow: 'Shared infrastructure / independent products',
        eyebrowV11: 'A shared foundation, not a finished business',
        title: 'You build the reason to use the network.',
        body: 'SN25 is UR’s Bittensor subnet: the coordination and incentive layer beneath the provider network. It gives builders infrastructure to draw on without deciding what the customer product should be.',
        operator: {
            label: 'THE NETWORK OPERATOR BRINGS',
            title: 'The product and customer relationship',
            body: 'Product experience, brand, users, identity, billing, policy, support, compliance and the commercial reason for network demand.',
            bodyV11: 'Product experience, brand, users, identity, billing, policy, support and the commercial reason for network demand.',
        },
        subnet: {
            label: 'UR (SN25) PROVIDES',
            labelV11: 'UR / SN25 COORDINATES',
            title: 'Access to network infrastructure',
            titleV11: 'Access to shared network infrastructure',
            body: 'Distributed residential network providers, encrypted bandwidth, and an incentive system supporting reliable supply.',
            bodyV11: 'Residential provider reach, miner UIDs, independent service measurement and the incentive system supporting useful supply.',
        },
    },

    // the call to action at the end of the page (version 12 and 10, then version 11)
    cta: {
        eyebrow: 'The next operator',
        title: 'Become a Network Operator',
        copy: 'Bring an existing product or explore launching a new one on top of our fleet of network providers. Read the documentation and speak with the UR team about network fit.',
        v11: {
            eyebrow: 'Bring the next opportunity',
            title: 'What should run on UR?',
            copy: 'Bring an existing product or an idea these examples do not cover. Start a conversation about network fit, available infrastructure and what it could take to operate on SN25.',
        },
        // links: to the UR team on Telegram, and to the docs
        talk: 'TALK TO UR TEAM ↗',
        docs: 'EXPLORE SN25 DOCUMENTATION →',
    },
};
