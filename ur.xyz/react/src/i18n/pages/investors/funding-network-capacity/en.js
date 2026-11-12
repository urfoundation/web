// The October 2026 letter on funding network capacity
// (/investors/funding-network-capacity), dated 15 October 2026:
// components/pages/investors/NetworkCapacityLetter.jsx. The page's heading,
// <title> and description are the group's (../en.js,
// docs['funding-network-capacity']); this is the letter itself, on two sheets.
// The PDF and the diagram's image are the letter as published and are not
// translated.
export default {
    introduction: {
        heading: 'Introduction',
        paragraphs: [
            'UR (SN25) aims to support Bittensor’s open source vision by building a marketplace for private connectivity: coordinating independent providers to build private network capacity that operators need to serve customers.',
            'ur.io is the first customer-facing example; the broader opportunity is infrastructure shared by multiple operators. Ultimately, our priority is to create a strong, reliable network that enables any operator to grow, and make private networking accessible for all.',
            'In this manner, operators bring products, customers and demand and our independent miners supply connectivity, where UR (SN25) coordinates incentives and verification to help useful supply develop.',
            'For UR:',
        ],
        roles: [
            '<strong>Network operators</strong>, including ur.io, build services and bring customer demand.',
            '<strong>Providers and fleets</strong> contribute the connections and routing capacity those services use.',
            '<strong>SN25</strong> incentivizes and verifies the underlying supply and usage of miners.',
        ],
        closing: 'This makes capacity investment an ecosystem strategy. We therefore should always be building and reinvesting to expand network needs and service outcomes across operators.',
    },
    workingCapital: {
        heading: 'Why retain emissions as working capital?',
        paragraphs: [
            'We do not expect network capacity and customer demand to grow in perfect alignment. In conversations with operators, they seek evidence of reliable supply PRIOR to launching on the subnet. Take a new VPN operator that may have an existing product and customers: broader coverage or dependable availability in particular markets will be critical to support their growth. UR needs to coordinate those providers that can fulfil those requirements as quickly as possible.',
            'SN25 therefore uses excess emissions, meaning miner emissions beyond what goes directly to providers, to bootstrap miners and demonstrate network strength to attract new Network operators.',
        ],
        // the diagram is an English image: its alt text says what it shows
        diagramAlt: 'Operators want supply before demand arrives. Capacity is established before an operator launches, while customer traffic grows later. The Network Capacity Reserve funds the gap and is released against verified delivery. Operators launch with capacity already in place; the reserve carries the cost until traffic catches up, so early customers get full service from day one.',
        diagramLink: 'View diagram at full size ↗',
    },
    // the second sheet's accessible name ({title} is the letter's headline)
    page2Aria: '{title}, page 2',
    reserve: {
        aria: 'Network Capacity Reserve',
        intro: 'As such we are launching the “Network Capacity Reserve”, which uses excess emissions to bridge that gap:',
        uses: [
            'Commission capacity ahead of an operator’s expansion.',
            'Improve coverage and reliability where existing supply is inadequate.',
            'Respond to rising demand without relying only on that period’s emissions.',
            'Keep strategically useful capacity available during quieter periods.',
            'Release funds against verified delivery instead of distributing the entire budget immediately.',
        ],
        paragraphs: [
            'The <em>Network Capacity Reserve</em> adds a way to fund that supply ahead of demand. In this model, emissions accumulate as working capital and are released against defined, verified commitments.',
            'To support this, we are launching a dashboard to help visualise capital allocation, showing reserve balances and published allocations, with commitments and payments reported as programs become active.',
            'Ultimately, each program should have a clear ROI for how excess capacity is being incentivised.',
        ],
    },
    examples: {
        heading: 'Examples',
        items: [
            'When a new operator is ready to bring users onto UR, establish a capped provider incentive program for its required supply. Payments depend on working routes and sustained service, rather than simply registering an operator.',
            'If ur.io or another operator needs additional exits in a target market, commission providers to maintain qualifying connections there. The existing fleet mechanism measures routable prefix breadth; geographic rewards would require additional location verification.',
            'Offer temporary incentives when an operator’s usage rises beyond available supply. Payments specifically tied to throughput or delivered traffic would require stronger verification than the current routing checks.',
            'Fund time-limited commitments to keep useful connections online between demand peaks, conditional on successful random verification.',
        ],
    },
    operations: {
        heading: 'Reserve Operations',
        items: [
            'The reserve is a dedicated multisig, separate from owner emissions and not used for team or operating costs: 5CcHGEqKK3RXeEA2sVycHQAQGrqsyhWaYu9FjGtDVN6nwMwR (SN25 UIDs 170 and 250).',
            'Publish objectives, eligibility, measurement and duration when excess miner rewards are used.',
            'Reserve funds for accepted commitments and account for existing baseline rewards.',
            'Verify delivery, publish the reward calculation, approve payments through the multisig and disclose every transfer out.',
            'Keep unused funds available for future operator and network needs.',
        ],
    },
    impact: {
        heading: 'Impact',
        paragraphs: [
            'UR (SN25) as a network becomes more valuable as demand from operators increases, who buy and permanently lock the token to continue accessing the network.',
            'That is the intended connection: <strong>more bandwidth usage → larger required buys / deposits from NOs → potential market purchases → more demand of $SN25</strong>',
            'The <em>Network Capacity Reserve</em> supports this directly: it incentivises providers to improve specific coverage, availability and capacity, helping us attract operators which serve more users, further accelerating growth.',
            'We look forward to sharing updates on this program.',
        ],
    },
};
