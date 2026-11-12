// /build: the words inside the page's architecture models (react/src/components/pages/BuildScenes.jsx)
// and the architecture components the model's key and readout describe (Build.jsx). The page shows one
// model at a time; the live one is `terminal3` (the three-plane terminal). The others stay reachable
// through ?model= and are all in the page's HTML, so every one is translated.
//
// Text in capitals is shown as written (small labels styled as a terminal UI): write it in capitals in
// languages that have them. "01 /", "02 /" … number the parts and stay as they are. Labels on the model
// are small and must stay short. `aria` strings are the accessible names of the model's clickable parts.
// The figures on the illustrative product screens (24 sessions, 1,248 observations, 98.6%…) are made up
// for the illustration: keep them, written the way your language writes numbers.
import { BUILD_ARCH } from '../../../../data/buildContent.js';

export default {
    // the six illustrative product screens inside the terminal models, by opportunity
    apps: {
        vpn: {
            topbar: 'PRIVACY PRODUCT / OPERATOR TERMINAL',
            live: 'NETWORK READY',
            kicker: 'WHITE-LABEL VPN',
            // the screen's headline, two lines
            heading: ['Private access.', 'Your product.'],
            body: 'A branded connection experience drawing on measured residential routes.',
            action: 'CONNECTED · US',
            // labels drawn on the route map: the user, a miner (UID 081) and the exit country
            mapYou: 'YOU',
            mapUid: 'UID 081',
            mapExit: 'UNITED STATES',
            routeKind: '2-HOP ROUTE',
            exitKind: 'RESIDENTIAL EXIT',
        },
        comms: {
            topbar: 'COMMUNICATIONS / OPERATOR TERMINAL',
            live: 'ENCRYPTED SESSION',
            kicker: 'BUSINESS COMMS',
            heading: ['Private content.', 'Distributed transport.'],
            body: 'Your product owns identity and keys. UR carries the encrypted payload.',
            action: '24 SECURE SESSIONS',
            // a sender (a person's name, shown with the avatar letter A) and a recipient (a team, avatar B)
            sender: 'ALICE',
            senderRole: 'SENDER',
            payload: 'CIPHERTEXT',
            payloadVia: 'VIA UR',
            recipient: 'TEAM',
            recipientRole: 'RECIPIENT',
            appLayer: 'APPLICATION ENCRYPTION',
            networkLayer: 'MEASURED NETWORK TRANSPORT',
        },
        agent: {
            topbar: 'AGENT INFRASTRUCTURE / OPERATOR TERMINAL',
            live: 'API ONLINE',
            kicker: 'AGENT ACCESS',
            heading: ['Policy-aware', 'public web access.'],
            body: 'Assign approved geography, route policy and an audit record to every workload.',
            action: '182 ACTIVE SESSIONS',
            request: 'SESSION REQUEST',
            // a request's fields: a label and its value set apart by two no-break spaces (\u00a0\u00a0, keep them)
            region: 'REGION\u00a0\u00a0DE',
            intent: 'INTENT\u00a0\u00a0PUBLIC RESEARCH',
            response: 'NETWORK RESPONSE',
            approved: 'APPROVED',
            measured: 'UID 081 · MEASURED',
            auditLog: 'AUDIT LOG 84F2',
        },
        visibility: {
            topbar: 'RESEARCH + INTELLIGENCE / OPERATOR TERMINAL',
            live: '36 MARKETS',
            kicker: 'AI VISIBILITY',
            heading: ['Answers across', 'place and time.'],
            body: 'Compare the same public prompt through residential vantage points in each market.',
            action: '1,248 OBSERVATIONS',
            samePrompt: 'SAME PROMPT',
            variation: 'ANSWER VARIATION',
            // three markets compared, each with the source its answer cited
            markets: [
                { city: 'LONDON', source: 'SOURCE 01' },
                { city: 'BERLIN', source: 'SOURCE 03' },
                { city: 'SINGAPORE', source: 'SOURCE 02' },
            ],
        },
        verification: {
            topbar: 'MEDIA INTELLIGENCE / OPERATOR TERMINAL',
            live: 'EVIDENCE CAPTURE',
            kicker: 'AD VERIFICATION',
            heading: ['Sample what a', 'market saw.'],
            body: 'Capture a regional observation with the context needed to assess the result.',
            action: '98.6% SAMPLE MATCH',
            placement: 'PLACEMENT 04',
            // the big word on the sample advert
            ad: 'AD',
            impression: 'TEST IMPRESSION',
            record: 'EVIDENCE RECORD',
            regionLabel: 'REGION',
            region: 'BERLIN, DE',
            originLabel: 'ORIGIN',
            origin: 'RESIDENTIAL',
            timeLabel: 'TIME',
            returned: '✓ SAMPLE RETURNED',
        },
        search: {
            topbar: 'RETRIEVAL PRODUCT / OPERATOR TERMINAL',
            live: 'DISTRIBUTED ROUTE',
            kicker: 'PRIVATE SEARCH',
            heading: ['Retrieve with', 'less exposure.'],
            body: 'Distribute the retrieval path while your product controls query handling and logs.',
            action: 'LOGGING MINIMISED',
            // the query typed into the illustrative search box
            query: 'How does private retrieval work?',
            routed: 'ROUTE DISTRIBUTED',
            results: [
                { title: 'Private transport', meta: 'SOURCE MATCH · 94%' },
                { title: 'Distributed retrieval', meta: 'RESULTS RETURNED · 87%' },
            ],
            note: 'QUERY LOGGING · MINIMISED',
        },
    },

    // 05: the exchange chassis model
    chassis: {
        aria: {
            subnet: 'SN25 shared foundation',
            miners: 'Miner UID market',
            providers: 'Residential provider fleet',
            operator: 'Network Operator',
            validators: 'Independent validators',
            product: 'Selected opportunity product',
            emission: 'Emission and settlement',
        },
        subnetLabel: '03 / UR SUBNET · SN25 FOUNDATION',
        // how operator demand is priced: monthly active users × a rate plus GB a day × a rate
        subnetRate: 'OPERATOR DEMAND · MAU × RATE + GB/DAY × RATE',
        subnetName: 'ACCESS · RESERVE · SETTLEMENT',
        minersLabel: '05 / MINER UID SWITCH',
        minersName: '~200 top UIDs + pools',
        providersLabel: '06 / RESIDENTIAL SUPPLY',
        // two lines
        providersCore: ['100K+ PROVIDERS', '100+ COUNTRIES'],
        providersName: 'Shared provider dock',
        operatorLabel: '02 / NETWORK OPERATOR',
        operatorName: 'Product · users · billing · policy',
        emissionName: 'EMISSION BUS · PAID ON MEASURED SERVICE',
        // along the validators' gantry above the model
        probes: 'VALIDATOR PROBES · UPTIME / TRANSFER / TRANSIT',
        // the labelled callouts around the model: [the part's number and role, its name]
        callouts: {
            product: ['01 / CHANGES', 'Product + demand'],
            operator: ['02 / OWNS', 'Network Operator'],
            subnet: ['03 / ACCESSES', 'SN25 + reserve'],
            validators: ['04 / MEASURES', 'Validators'],
            miners: ['05 / ORGANISES', 'Miner UIDs + pools'],
            providers: ['06 / ROUTES', 'Residential fleet'],
            emission: ['07 / REWARDS', 'Emission + settlement'],
        },
    },

    // 06: the transit spine model
    spine: {
        productLabel: '01 / DEMAND',
        operatorLabel: '02 / OPERATOR',
        operatorName: 'Policy + billing',
        subnetLabel: '03 / SN25 MARKET',
        subnetName: 'Access + reserve',
        validatorsLabel: '04 / VALIDATOR BRIDGE',
        minersLabel: '05 / UIDs',
        minersName: 'Top + pools',
        providersLabel: '06 / SUPPLY',
        providersName: 'Provider exits',
        emissionName: '07 / EMISSION REWARDS MEASURED SERVICE',
        callouts: {
            product: ['01 / INTAKE', 'Customer demand'],
            operator: ['02 / CONTROL', 'Operator policy'],
            subnet: ['03 / MARKET', 'SN25 access'],
            validators: ['04 / PROBE', 'Verify transit'],
            miners: ['05 / SWITCH', 'Miner UIDs'],
            providers: ['06 / EXIT', 'Residential supply'],
            emission: ['07 / REWARD', 'Separate token rail'],
        },
    },

    // 07: the subnet tower model
    tower: {
        providersLabel: '06 / SUPPLY DOCK',
        providersName: '100K+ providers · 100+ countries',
        minersLabel: '05 / MINER MARKET',
        // above and below the miner market's ring
        ringTop: '~200 TOP UIDs',
        ringTail: 'LONG-TAIL PROVIDERS IN OPERATOR POOLS',
        subnetLabel: '03 / SHARED FOUNDATION',
        // under the "UR / SN25" title of the foundation slab
        subnetFunctions: 'ACCESS · RESERVE · SETTLEMENT',
        validatorsLabel: '04 / VALIDATOR FRAME',
        operatorLabel: '02 / OPERATOR STUDIO',
        // the four rooms of the operator studio
        operatorRooms: ['PRODUCT', 'USERS', 'BILLING', 'POLICY'],
        emissionName: 'EMISSION + SETTLEMENT',
        callouts: {
            product: ['01 / TOP FLOOR', 'Product changes'],
            operator: ['02 / BUSINESS', 'Operator owns'],
            subnet: ['03 / FOUNDATION', 'SN25 shared layer'],
            validators: ['04 / FRAME', 'Validators measure'],
            miners: ['05 / MARKET', 'UIDs + pools'],
            providers: ['06 / SUPPLY DOCK', 'Provider fleet'],
            emission: ['07 / POWER', 'Reward rail'],
        },
    },

    // 08: the operator gateway model
    gateway: {
        aria: {
            subnet: 'SN25 shared foundation',
            providers: 'Residential provider fleet',
            miners: 'Miner UID market',
            emission: 'Emission and settlement',
            operator: 'Network Operator control plane',
            validators: 'Independent validator frame',
            product: 'Selected opportunity product',
        },
        subnetLabel: '03 / UR SUBNET · ACCESS + RESERVE + SETTLEMENT',
        subnetShared: 'STAYS SHARED ACROSS EVERY EXAMPLE',
        // written along the foundation slab's edge
        subnetName: 'SN25 · SHARED FOUNDATION',
        // written down the product module's edge (vertical text: keep it short)
        productChanges: 'THIS MODULE CHANGES',
        providersLabel: '06 / RESIDENTIAL SUPPLY',
        providersName: '100K+ providers · 100+ countries',
        minersLabel: '05 / MINER UID ROUTER',
        minersName: '~200 top UIDs + operator pools',
        emissionName: '07 / EMISSION REWARDS MEASURED SERVICE · OPERATOR DEPOSITS STAY IN RESERVE',
        operatorLabel: '02 / NETWORK OPERATOR CONTROL PLANE',
        operatorOwns: 'BRAND · USERS · BILLING · POLICY · SUPPORT',
        operatorName: 'The business layer you own',
        validatorsLabel: '04 / INDEPENDENT VALIDATION FRAME',
        callouts: {
            product: ['01 / CHANGES', 'Opportunity product'],
            operator: ['02 / YOU OWN', 'Operator control plane'],
            subnet: ['03 / FOUNDATION', 'SN25 remains shared'],
            validators: ['04 / MEASURES', 'Validators test paths'],
            miners: ['05 / ORGANISES', 'Miner UIDs + pools'],
            providers: ['06 / ROUTES', 'Residential fleet'],
            emission: ['07 / REWARDS', 'Separate economics rail'],
        },
    },

    // 09: the operator terminal model
    terminal: {
        aria: {
            subnet: 'SN25 shared terminal foundation',
            providers: 'Residential provider network interface',
            miners: 'Miner UID switching fabric',
            emission: 'Emission and settlement rail',
            operator: 'Network Operator services',
            validators: 'Independent validator scan plane',
            product: 'Selected customer-facing product',
        },
        subnetLabel: '03 / UR SUBNET · ACCESS + RESERVE + SETTLEMENT',
        subnetStatus: 'SAME FOUNDATION · EVERY PRODUCT',
        // written along the terminal foundation's edge
        subnetName: 'UR / SN25 · SHARED TERMINAL FOUNDATION',
        // on the validators' scan plane
        validatorsLabel: '04 / VALIDATOR SCAN PLANE',
        providersLabel: '06 / RESIDENTIAL NETWORK INTERFACE',
        providersName: '100K+ providers · 100+ countries',
        minersLabel: '05 / MINER UID SWITCHING FABRIC',
        minersName: '~200 top UIDs + operator pools',
        emissionName: '07 / EMISSION REWARDS MEASURED SERVICE · OPERATOR DEPOSITS REMAIN IN RESERVE',
        operatorLabel: '02 / NETWORK OPERATOR SERVICES',
        operatorOwns: 'IDENTITY · BILLING · POLICY · SUPPORT · PRODUCT SERVERS',
        operatorName: 'The business logic you own',
        callouts: {
            product: ['01 / CUSTOMER VIEW', 'Selected product'],
            operator: ['02 / YOU OWN', 'Operator services'],
            subnet: ['03 / FOUNDATION', 'SN25 remains shared'],
            validators: ['04 / MEASURES', 'Validators test paths'],
            miners: ['05 / ORGANISES', 'Miner UIDs + pools'],
            providers: ['06 / ROUTES', 'Residential fleet'],
            emission: ['07 / REWARDS', 'Separate economics rail'],
        },
    },

    // 10: the three-plane terminal, the page's live model
    terminal3: {
        aria: {
            subnetbase: 'SN25 protocol and economic foundation',
            network: 'Distributed miner UID mesh with attached residential providers and a separate validation checker',
            operatorproduct: 'Illustrative Network Operator product UI',
        },
        baseLabel: '03 / SN25 SHARED FOUNDATION',
        // the core block: a small line above "SN25" and one below it
        coreKicker: 'UR SUBNET',
        coreLine: 'SHARED COORDINATION',
        // a status tag on the core: "active" on the earlier editions, "testnet" on the live page
        coreActive: 'ACTIVE',
        coreTestnet: 'TESTNET',
        definitionKicker: 'ONE PROTOCOL BENEATH EVERY OPERATOR',
        definition: 'Coordinates access, service measurement and network economics.',
        // the two ends of the rail under the definition
        railDemand: 'DEMAND',
        railSupply: 'SUPPLY',
        // the foundation's three functions: a title and a short line under it
        functions: [
            { title: 'ACCESS NETWORK', detail: 'operators use SN25' },
            { title: 'MEASURE PERFORMANCE', detail: 'uptime + transfer + proof-of-transit' },
            { title: 'REWARD SUPPLY', detail: 'emissions → miner UIDs' },
        ],
        // the two flows the foundation keeps apart, with "separate flows" (two lines) between them
        demandTitle: 'NETWORK DEMAND',
        demandFlow: 'OPERATORS → SN25 USAGE',
        separateFlows: ['SEPARATE', 'FLOWS'],
        emissionTitle: 'CHAIN EMISSION',
        emissionFlow: 'ALPHA → MINER UIDs',
        baseName: 'UR / SN25 · SHARED FOUNDATION',
        baseStatus: 'SAME FOUNDATION · EVERY OPERATOR',
        networkLabel: '02 / MINER UID + PROVIDER MESH',
        // labels drawn on the mesh: the pool's outline, and the validation checker with its three checks
        meshPool: 'POOL',
        meshValidation: 'VALIDATION',
        meshUptime: 'UPTIME',
        meshTransfer: 'TRANSFER',
        meshTransit: 'TRANSIT',
        // the key under the mesh
        keyUid: 'MINER UID',
        keyProvider: 'RESIDENTIAL PROVIDER',
        keyValidator: 'VALIDATION CHECKER',
        productBand: '01 / ILLUSTRATIVE PRODUCT UI',
        productOwns: 'BRAND · USERS · POLICY · BILLING · PRODUCT LOGIC',
        callouts: {
            operatorproduct: ['01 / CHANGES', 'Network Operator product'],
            network: ['02 / SERVES + MEASURES', 'Provider pools + validators'],
            subnetbase: ['03 / COORDINATES', 'SN25 shared foundation'],
        },
    },

    // The architecture's parts, as the component key below the model and the "selected layer" readout
    // name them: `verb` (capitals, after the part's number), `name`, `short` (one line) and `detail`.
    // The seven parts of the version 10 models (chassis … terminal), in the order of buildContent.js:
    components: BUILD_ARCH.components.map((c) => ({
        verb: c.verb,
        name: c.name,
        short: c.short,
        detail: c.detail,
    })),

    // The three planes of the three-plane terminal, worded per edition of the page: version 10
    // (?model=terminal3), version 11 (?model=terminal4) and version 12 (the live page). `mobileDetail`
    // replaces `detail` on a phone.
    planes: {
        v10: [
            { verb: 'CHANGES', name: 'Network Operator product', short: 'The product, audience and commercial relationship change.', detail: 'The Network Operator brings the customer-facing product, app or API, brand, users, policy, billing and product logic. Selecting another opportunity changes this entire top module.' },
            { verb: 'ROUTES + MEASURES', name: 'Miner UID + provider network', short: 'Provider supply attaches to miner UIDs; validators check it separately.', detail: 'Every miner is represented by a UID, with residential providers attached to those UIDs. Some miners participate through a pooled arrangement. Customer traffic traverses selected miner UIDs and provider routes; validators independently test the service but are not traffic hops.' },
            { verb: 'COORDINATES', name: 'SN25 protocol + economic backplane', short: 'Coordinates access, UIDs, measurement, reserve and settlement.', detail: 'SN25 is the shared substrate beneath every Network Operator. It coordinates network access and the UID registry, accepts independent measurement, and keeps operator demand into the reserve separate from chain emission paid to measured miners and validators.' },
        ],
        v11: [
            { verb: 'CHANGES', name: 'Illustrative operator product', short: 'The product and customer relationship change.', detail: 'The Network Operator brings the customer-facing product, audience, brand, policy, billing and product logic. Selecting another example changes this top plane.' },
            { verb: 'CONNECTS', name: 'Provider network + validation', short: 'Shared routes beneath every product.', detail: 'Residential providers connect through miner UIDs to form distributed supply. Validators check service quality separately; they are not traffic hops.' },
            { verb: 'COORDINATES', name: 'SN25 shared foundation', short: 'The common coordination and incentive layer.', detail: 'SN25 coordinates access to the provider network, service measurement and the incentive system supporting useful supply.' },
        ],
        v12: [
            { verb: 'CHANGES', name: 'Network Operator product', short: 'The product, audience and customer relationship change.', mobileDetail: 'Owns the product experience, users, policy, billing and support. This plane changes with each opportunity.', detail: 'The operator owns the customer experience, users, identity, policy, billing, support and the reason for network demand to exist. This plane changes with every opportunity.' },
            { verb: 'ROUTES + MEASURES', name: 'Residential routing network', short: 'Miner UIDs organise supply; validators measure separately.', mobileDetail: 'Miner UIDs organise residential routes while validators measure uptime, transfer and proof-of-transit separately.', detail: 'Residential providers participate as miners, directly or through pools, supplying routable capacity under miner UIDs. Encrypted traffic moves through those paths while validators measure uptime, transfer and proof-of-transit separately.' },
            { verb: 'COORDINATES', name: 'UR Subnet (SN25)', short: 'Access, measurement, incentives and settlement.', mobileDetail: 'Coordinates operator demand, measurement, miner incentives and settlement beneath every operator product.', detail: 'SN25 coordinates operator demand, validator measurement, miner incentives and settlement. It is shared infrastructure beneath every Network Operator, not the customer product above it.' },
        ],
    },
};
