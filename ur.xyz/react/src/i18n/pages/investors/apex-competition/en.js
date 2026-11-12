// The Apex (SN1) competition announcement (/investors/apex-competition),
// dated 28 October 2026: components/pages/investors/ApexAnnouncement.jsx. The
// page's heading, <title> and description are the group's (../en.js,
// docs['apex-competition']); this is the announcement itself, on two sheets
// split where the PDF turns the page. The PDF is the announcement as published
// and is not translated.
export default {
    documentTitle: 'UR (SN25) launches open competition on Apex (SN1) to optimise the routing and provider-matching algorithms behind its privacy network',
    highlightsHeading: 'Highlights',
    highlights: [
        'UR (SN25) has commissioned an open competition on Apex (SN1), operated by Macrocosmos, to improve the routing and provider-matching algorithms that determine the speed, reliability and reachability of the UR network.',
        'The competition targets four named problems in the published protocol: hop selection under URTRANSPORT1, the provider window managed by UR-MULTI, re-enablement of the multi-provider hop and the peer-to-peer stream upgrade, and matching metadata in UR-FP2 that preserves its Sybil-resistance property.',
        'All current algorithms are already published as open source, and UR will release anonymised per-block datasets covering matching inputs and selected outputs so that submissions can be evaluated against real network conditions rather than simulation.',
        'Improvements adopted into production benefit the 100,000+ miners carrying traffic on the network and the network operators purchasing capacity from it.',
        'This is the first competition to place the routing layer of a live production network in front of the Bittensor research community.',
    ],
    body: [
        'UR Foundation (UR (SN25) or the Network) today announces an open competition, hosted on Apex (SN1) and operated by Macrocosmos, to improve the algorithms that route traffic across the UR network. The competition opens the Network’s core optimisation problem to the Bittensor research community, with the objective of raising measured throughput and reliability for the miners who supply capacity and the network operators who purchase it.',
        'UR (SN25) is a decentralised-native, multi-IP, multi-transport protocol rather than a conventional site-to-site tunnel. More than 100,000 miners across over 100 countries keep distinct IPv4 /29 and IPv6 /48 subnets routable for both ingress and egress traffic, and more than 350,000 monthly active users reach the open web through them. Every transfer is governed by a contract held in escrow and closed on a byte count both parties acknowledge, and validators independently walk operator-assigned chains of miners to prove real-time transit.',
    ],
    problem: {
        heading: 'The optimisation problem',
        // <research> links the protocol research (/research)
        paragraphs: [
            'Routing across an untrusted, heterogeneous fleet is a materially harder problem than routing across owned infrastructure. The Network’s published <research>protocol research</research> identifies the specific constraints. Multi-hop routing presently runs over TCP transports through a central hop. UDP transports, including HTTP/3 and DNS, are implemented but disabled owing to real-world performance results in the current configuration. A multi-provider hop with a peer-to-peer upgrade, referred to as stream, is likewise implemented but disabled, with WebRTC, XRay and WireGuard identified as candidate upgrades.',
            'Two cases require optimisation and they trade against one another: where the next hop has no public address and port, and where it does. The second favours speed, while a combination of the two favours quality. The Network has identified the addition of metadata to the matching algorithm as a route to selecting between them, subject to preserving the property that makes matching resistant to node forgery, namely that the sum of reliability is capped at one per IP subnet.',
            'On the client side, UR-MULTI manages a window of providers using a heuristic sweep based on transfer thresholds rather than protocol analysis, locking traffic into the top available tier. Improving that window is the single change most directly experienced by an end user.',
        ],
    },
    // the second sheet's accessible name
    page2Aria: 'Apex announcement, page 2',
    why: {
        heading: 'Why Apex',
        paragraphs: [
            'Apex (SN1) is the original Bittensor subnet, architected by Steffen Cruz, Co-Founder and Chief Technology Officer of Macrocosmos and formerly Chief Technology Officer of the Opentensor Foundation. Given a defined problem and a benchmark, Apex outsources research and solution discovery to a competitive global network, and is specifically suited to problems with complex landscapes and many interdependent variables where a search space is best explored in parallel.',
            'Network routing under adversarial conditions is such a problem. The objective function is measurable, the constraints are published, and the search space is large enough that no single team is well placed to explore it exhaustively. UR (SN25) will publish the benchmark, supply the datasets, and adopt validated improvements into the production protocol under its existing open-source licence.',
        ],
    },
    steffen: {
        heading: 'Steffen Cruz, CTO, Macrocosmos, said:',
        quote: '“Apex was built for exactly this. A defined problem, a real objective outcome, and a search space too large for any one team to cover on its own. UR (SN25) is putting the routing layer of a network that already carries substantial production traffic in front of the whole community, and so we expect the results to be measurable in the hands of real users rather than only on a leaderboard.”',
    },
    brien: {
        heading: 'Brien Colwell, Core Contributor, UR (SN25), said:',
        quote: '“We have published every algorithm in this network from the beginning, including the parts that are disabled and the reasons they are disabled. Opening the routing problem to Apex is the logical next step, because the people best placed to improve a matching algorithm are not necessarily the people who wrote it. Anything that survives the benchmark goes into production, and 100,000 miners and every user behind them feel the difference.”',
    },
};
