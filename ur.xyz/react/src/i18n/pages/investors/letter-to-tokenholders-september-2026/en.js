// The September 2026 letter to tokenholders
// (/investors/letter-to-tokenholders-september-2026), dated 25 September 2026
// and signed by Brien and Jack: components/pages/investors/TokenholderLetter.jsx.
// The page's heading, <title> and description are the group's (../en.js,
// docs['letter-to-tokenholders-september-2026']); this is the letter itself,
// on two sheets. The PDF is the letter as sent and is not translated.
export default {
    documentTitle: 'Letter to Tokenholders',
    salutation: '<strong>To tokenholders of UR (SN25),</strong>',
    opening: [
        'We are almost ready to launch UR mainnet, with the next quarter focused on refining incentives and expanding usage of our protocol to replace the old internet as we know it. Our ambition is to make privacy a seamless function of the internet, available without requiring technical expertise or an unacceptable sacrifice in performance. Brien and I feel immense responsibility to deliver and commercialise frontier privacy technology, and we will not be able to achieve this without the people of Bittensor.',
        // <a16z> links a16z crypto's privacy thesis
        'Privacy has gone from the least fashionable corner of crypto to its best performing one in under twelve months, led by ZEC, XMR and various confidential AI and compute names. The thesis is actually very simple, and I like what A16z said in their <a16z>privacy thesis</a16z>: “privacy will be the most important moat in crypto…” Once a user commits to a private network, leaving it leaks the metadata that made them identifiable in the first place, so privacy produces lock-in. As we prepare to launch mainnet and bring new products to UR, the journey to onboard 1bn people has just begun.',
    ],
    design: {
        heading: 'Design of SN25',
        intro: 'Our entire objective for the subnet has been to carve out our supply side bandwidth network that we have built over the last ~2 years into a marketplace accessible to developers. Core to this idea are our <em>Network Operators</em>, a scalable franchise model in which each operator can leverage UR (SN25) as a public commodity, creating an ecosystem of entrepreneurs who contribute to the network’s reach and utilisation. As we prepare to launch mainnet, here are two priorities:',
        priorities: [
            '<strong>Expand supply and improve service quality:</strong> Our internal target is to grow the miner base approximately tenfold, from around ~100k today to 1mm. Through Bittensor incentives, we aim to broaden geographic coverage and attract providers with higher-quality bandwidth, improving connection reliability, speed and availability for users.',
            '<strong>Validate the subnet through an initial fee-free period:</strong> Network Operators will operate without fees for an initial period, allowing us to test the subnet under real usage, evaluate miner and validator performance, and refine the incentive mechanism before introducing fees.',
        ],
        // <iran> links TechRadar's report of the shutdown
        iran: 'In Jan 2026, Iran <iran>turned off access to the internet</iran> for its people. For those affected, reaching the internet meant retaining contact with family, accessing information and continuing their work. During that Jan period, we went from 100k lifetime sign ups to ~350k, and have recently hit 1mm downloads in September. Behind those numbers are real lives impacted by the technology Brien has created. Interestingly, that growth also exposed the demands placed on our own infrastructure. One Saturday morning, we discovered that the load on our servers had tripped the power in a data-centre cabinet: Users were depending on us, and our capacity had been pushed beyond its limits. The experience reinforced a practical obligation: we must build for the conditions in which our service is needed most.',
        closing: 'Which brings me back to Bittensor: expanding the network’s geographic reach and attracting dependable bandwidth providers are essential to serving users under pressure. As we extend UR into private identity and agent communications, we will carry forward the same standard: infrastructure earns trust by remaining useful and true to privacy value when people need it the most.',
    },
    meridian: {
        heading: 'Project Meridian',
        intro: 'Following the mainnet launch, our core product development focus will shift to our second Network Operator, Project Meridian, extending UR’s infrastructure to serve AI agents and the businesses deploying them. Our thesis is that, as agents take on more work, they will need secure and reliable ways to communicate, exchange code and connect to services. We intend to build products that meet those needs while bringing additional demand to SN25.',
        // the second sheet opens here
        continuedAria: 'Project Meridian continued',
        email: 'Our first product under Meridian will be <strong>agent email hosted on the user’s private network</strong>; the proposed design would route messages sent to an address such as <code>agent@mynetwork.ur.network</code> directly to a mail server on that network. Users could operate their agents’ mailboxes on infrastructure they control, creating alternatives to centralized hosted email providers such as Gmail or Proton. We think that over time, agent identity persistence will be driven by email architecture, whereby they can communicate with other agents, humans and services via an email framework. If a business deploys agents for recurring operational work, such as procurement, scheduling or customer enquiries, the objective is to make workflows easier. Core features would need to be:',
        features: [
            'Let AI agents handle routine business correspondence',
            'Give each agent its own inbox, defined permissions and reviewable activity',
            'Keep sensitive stored messages and mailboxes within infrastructure under your control',
        ],
        vision: 'Our broader vision for Meridian is to help developers deploy AI agents faster and spend less time managing infrastructure. Beyond agent identity i.e. email, we plan to add encrypted code storage and private networking so agents can communicate, access code and connect to internal tools through one integrated service. A lightweight companion process, designed to run without administrator privileges, would make Meridian easier to add to existing deployments. For developers, the intended benefits are fewer integrations to build, less networking to configure and lower ongoing maintenance costs, while retaining control over their data and agent access. In this manner, we think that by accelerating the proliferation of agent capability, we can embed our world class proxy network for their agents too.',
    },
    // the second sheet's accessible name
    page2Aria: 'September Letter to Tokenholders, page 2',
    mycelium: {
        heading: 'The Mycelium Of The Private Internet',
        paragraphs: [
            'Our long-term vision is for <strong><u>privacy to become an expected property of the internet</u></strong>. Our mission is simple: People should be able to communicate, build and transact securely without having to understand the infrastructure protecting them. Accessing and leveraging the internet is a human right, and where there may be gatekeepers who try to suppress access or collect tolls, we aim to stay true to these values.',
            'Brien likes using mycelium as a useful image of how such a network could grow: Beneath a forest floor, countless local connections form a vast structure that is largely invisible from above. UR’s ambition is similarly built from the bottom up: individuals contribute connectivity, independent operators develop services, and developers bring applications and users. Each participant has a practical reason to join, while contributing to infrastructure whose reach extends beyond any single participant.',
            'For the user, that infrastructure should quietly do its job: An agent should be able to receive a message at its own address, exchange private code and connect to another service without requiring its owner to configure a complex network. Achieving that simplicity requires considerable work underneath, particularly in routing, reliability and making services reachable across different environments.',
            'The internet’s adoption of encrypted web connections provides a useful precedent: encryption became part of everyday browsing as software made it routine. We see an opportunity to extend that expectation further, towards private identities and communications hosted on infrastructure users control. Much of today’s internet already encrypts information in transit; our ambition is to reduce the additional exposure and dependence that remain around who is communicating, how they connect and who holds their data. This will be the legacy of UR (SN25).',
        ],
    },
    signoff: [
        'With much love,',
        'Brien and Jack',
        'on behalf of team UR (SN25)',
    ],
};
