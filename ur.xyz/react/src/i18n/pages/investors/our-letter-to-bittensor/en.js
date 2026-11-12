// Our Letter to Bittensor (/investors/our-letter-to-bittensor), dated
// 18 August 2026 and signed by Jack Ai-Leung for the UR (SN25) team, with its
// three exhibits. The English page is components/pages/investors/
// InvestorLetter.jsx, which the letter's PDF is printed from, so it keeps its
// own text; InvestorLetterTranslation.jsx renders the translations from this
// unit, and react/src/i18n/pages/investors/investors.test.mjs requires that
// this English, rendered there, is InvestorLetter.jsx's page exactly. The
// letter's title, <title> and description are the group's (../en.js,
// docs['our-letter-to-bittensor']). The PDF is the letter as published and is
// not translated.
export default {
    salutation: 'Dear friends in Bittensor,',
    opening: [
        'Today, I am very proud to be launching UR (SN25) with dear friends Brien Colwell and Keith Singery. Three months ago, in Stockholm, Brien and I came together to discuss the necessity of a free and open internet for all, a mission which Brien has singularly dedicated himself to for the last two years.',
        'Core to an open internet is the role of one’s IP address. Often overlooked, your IP address is your online identity; every site you visit sees your address, tying to your geographic location. Today, the internet we know organizes people by their address: prices, content, outright access, all decided by where your location. If you can be identified, you can be targeted; the tool for modern day tracking and oppression.',
        'On 8 January 2026, Iran shut down access to the global internet, preventing the flow of information and disrupting contact with many families. With much sadness, this was also a breakthrough month for URnetwork, whose VPN product ur.io, reached all-time-high MAUs, and provided a lifeline for users; One user in Tehran put it plainly: “This is the only VPN that works”',
        'Over the last two years, Brien has singlehandedly built a community of 80k+ network providers servicing 350k+ MAUs, implementing difficult technology (how do you matchmake IPs for optimal performance?); bootstrapping the supply and ensuring performance is exceedingly difficult as a technological primitive, something Tor, Nym and the major networks have not been able to achieve.',
    ],
    // after the first divider; the coverage exhibit follows
    sweden: [
        'Across many sessions in Sweden in May, Brien spoke about his time early in his career at Palantir, building their Gov V1 platform, which contributed to this generation of surveillance and military technologies, lasting only 18 months before heading to NYU to study computational art. He talked about how he felt creating technology that thought the worst of humanity, and how we can instill optimism for what technology could do in empowering people, not belittling freedoms.',
        'It became abundantly clear to us that in order to build this open internet for humans (and agents too), we needed to scale this rotating fleet of residential exit nodes, and then to develop new applications which enables this unique form of internet access.',
    ],
    // after the coverage exhibit
    market: [
        'Moving our network to Bittensor will involve turning our community of IP providers into a competitive live market, which we believe can deepen network density and raise IP quality: a stronger network, which makes the experience better for users and the open internet more accessible',
        'As we enter Bittensor, we want to share our progress and observations on our mission, ultimately with the goal of empowering all of you to join us in this mission for an open and free internet.',
    ],
    subnet: {
        heading: 'UR Subnet',
        // the subnet-flow exhibit follows
        paragraphs: [
            'To begin with, UR is a supply side marketplace for 80k+ IP providers: think about it as Airbnb for your bandwidth, list access nodes and get paid for it when it is used. For users, these are exit nodes: your traffic can leave through clean IP addresses, changing constantly; no single party holds both your identity and your destinations, which means the correlation that makes surveillance possible can never be assembled.',
            'In this manner, UR Subnet looks more like a telco owned by the people, covering the entire planet with nodes that can facilitate access to the internet. The more global the coverage, the more dominant it can be.',
            "On Bittensor, top IP miners will have their own UIDs, and long tail miners will be pooled under miner UIDs. Network Operators (“NOs”) run their own servers to host users, they are billed in SN25 for leveraging bandwidth from the subnet. Validators check traffic to verify real usage. A miner runs UR software on a phone, laptop, Raspberry Pi and lets strangers' traffic exit through their home connection.",
        ],
        // between the subnet-flow and the network-stack exhibits
        operators: 'A Network Operator is the subnets demand side; they own the users, product, brand, billing and buy capacity from SN25 to facilitate their services. NOs are billed on two axes: (1) monthly active users served and (2) gigabytes moved per day, paid to the subnet in alpha.',
        // after the network-stack exhibit; <research> links the protocol research (/research)
        outlook: [
            'With our first Network Operator, ur.io, the residential fleet facilitates proxy access to the internet for many people around the world. Looking forward, we see a world where commercial buyers can leverage the global fleet to create legitimate origin (real person, real place) for variety of use cases including web crawl from residential fleet for model training, geofenced pricing intel i.e. airline pricing geofenced; aggregators buy IP to compare prices, agent access route thru exit nodes, overcomes anti-bot. I highly suggest you run our <research>core technologies</research> through an agent to understand what was required to get here, and why this technology is important for the world.',
            'Together, we think this design enables UR to create very natural network effects: better coverage → attracts more traffic → creates more revenue → makes the network more valuable to the next operator.',
        ],
    },
    openInternet: {
        heading: 'Fight for an open internet',
        // <urio> links https://ur.io
        paragraphs: [
            "The truth is, modern VPNs do not serve large swaths of the world's population, merely facilitating Netflix catalogue optimisation for the first world. Since 2024, the mission of <urio>ur.io</urio> has been to create new technologies which could defend human rights in the face of oppressive regimes around the world, this is where there is real opportunity for change.",
            "Beyond human access, we project exponential demand for residential access on the back of AI Agents: agents webfetch on their user's behalf, labs need to gather the internet's data to train on; as agents proliferate for human progress, the opportunity will increasingly be targeted by incumbents. Take Cloudflare, who announced that starting in September, they will begin blocking crawlers by default and will begin charging for internet passage.",
            'A world where access to the internet becomes a scarce resource is a bastardly concept.',
        ],
    },
    // after the last divider
    closing: [
        'The truth is there are people in the world who don’t want the best for you and your family: they track you, collect your data, throttle your internet. No matter if a company or government agency, a world where the people are surveilled by their government, or pay taxes to a landlord of the internet is bastardly. Technology was used to create these problems, surely technology can be created to solve these problems.',
        'And herein lies our goal for Bittensor: to make progress towards an open and free internet together. To us, the people of Bittensor know what’s at stake for open source technologies, and we hope that UR and Subnet 25 can be a vehicle for our dream for the world.',
        'Finally, our deepest admiration to Keith for providing us the platform for this mission, without him and his enduring optimism for Bittensor, none of this would be possible. To our many friends who have deeply influenced this mission: Max from SCORE, Micaela from Nova, Ken from Bitmind, Michael White from Karis Capital, Gyles from TAO.com, your energy inspires us everyday.',
        'To Brien, it is an honour to help you chase this dream. Let’s go make the people proud.',
    ],
    signOff: 'Jack Ai-Leung<br/>On behalf of the UR (SN25) team',

    // The coverage exhibit (CoverageExhibit.jsx)
    coverage: {
        heading: 'Miners cluster in two regions today, capping the network near one million users',
        subheading: 'Where the 100k+ network operators sit today, and where an incentive market puts them',
        before: {
            eyebrow: 'Before',
            title: 'Deep in two regions',
            text: 'real density in the US and Southeast Asia, funded by the company',
            mapAria: 'Coverage concentrated in the United States and Southeast Asia',
        },
        after: {
            eyebrow: 'After',
            title: 'That depth, everywhere',
            text: '100k+ residential addresses',
            mapAria: 'Residential address coverage distributed around the world',
        },
    },
    // The subnet-flow exhibit (SubnetFlowExhibit.jsx); <b> marks a tier's name
    flow: {
        caption: 'Users access a Network Operator, which purchases bandwidth from the UR Subnet.',
        users: { title: 'Users', text: 'use the app' },
        operator: { title: 'Network operator', example: 'e.g. ur.io', note: 'billed in alpha for bandwidth used' },
        subnet: {
            title: 'UR Subnet',
            top: '<b>Top miners</b> ~200, each with its own UID',
            longTail: '<b>Long tail</b> ~100k, earning through pools',
            note: 'miners are the residential IP providers',
        },
    },
    // The network-stack exhibit (NetworkStackExhibit.jsx), drawn at a fixed
    // width: <br/> is where a box's line breaks
    stack: {
        caption: 'The live ur.io product and three current research programmes all draw on the UR Subnet.',
        liveLabel: 'Live product',
        researchLabel: 'Current research',
        urio: { stat: '350k+ monthly active users', text: 'Live usage creates<br/>network demand.' },
        bastion: { name: 'Project Bastion', text: 'How do we unlock<br/>enterprise network<br/>connectivity?' },
        stargate: { name: 'Project Stargate', text: 'Can one open index<br/>support model training<br/>and live retrieval?' },
        meridian: { name: 'Project Meridian', text: 'How do we create<br/>dedicated identity<br/>for agents?' },
        subnetLabel: 'UR Subnet',
        subnetTitle: 'Shared provider and validation layer',
        subnetText: 'One infrastructure supports live demand and all three research programmes, through quality scoring and an incentive market.',
        minersLabel: 'residential miners',
        countriesLabel: 'countries',
        expandAria: 'Open expanded network stack diagram',
        dialogTitle: 'Network stack',
        zoomAria: 'Diagram zoom controls',
        zoomOutAria: 'Zoom out',
        fit: 'Fit',
        fitAria: 'Fit diagram to window',
        zoomInAria: 'Zoom in',
        closeAria: 'Close expanded diagram',
        viewportAria: 'Zoomable network stack diagram. Pinch, drag, or use the zoom controls.',
    },
};
