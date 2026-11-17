// /about: the protocol and its core contributors (react/src/components/pages/About.jsx,
// astro/src/components/routes/AboutRoute.astro). The contributors' roles and bios are
// derived from react/src/data/contributors.js, which stays their source; names and the
// platforms (LinkedIn, X) are not translated.
import { contributors } from '../../../data/contributors.js';

export default {
    meta: {
        // the page's <title>: at most 60 characters
        title: 'About UR | The people building the privacy network',
        // the meta description: at most 175 characters
        description: 'UR is an open-source protocol for private internet applications on a global network of independent bandwidth providers. Meet its core contributors.',
        // the page's name in the breadcrumb trail
        breadcrumb: 'About',
    },

    protocol: {
        // small label above the page title
        eyebrow: 'Protocol',
        // the page's h1
        title: 'About',
        // {link} is the link "ur.io" (to https://ur.io), placed where the sentence names it
        body: 'UR is an open-source protocol for building private internet applications on a global network of independent bandwidth providers. The first application is live at {link}, with more ways to use the network in development. We believe everyone has a right to privacy and strong encryption, and that the infrastructure protecting those rights should be open, resilient and accessible to all.',
    },

    people: {
        eyebrow: 'People',
        // section heading
        title: 'Core Contributors',
        // accessible name of the list of contributors
        listAria: 'UR Core Contributors',
        // a portrait's alt text: {name} is the person's name, {role} their role below
        portraitAlt: '{name}, {role} at UR',
        // accessible name of the profile link: {platform} is LinkedIn or X
        profileAria: "Open {name}'s {platform} profile",
    },

    // in the order of contributors.js: each person's role (shown in capitals) and bio
    contributors: contributors.map((person) => ({
        role: person.role,
        detail: person.detail,
    })),

    contribute: {
        eyebrow: 'Contribute',
        title: 'Build UR with us',
        body: 'UR is open source, with opportunities to contribute across the protocol, its applications and the network around them. If you want to contribute or explore joining the team, join us on Telegram.',
        // the call-to-action button's accessible name
        ctaAria: 'Join the UR community on Telegram',
        // the button's two lines, shown as written (in capitals in English)
        ctaLine1: 'JOIN THE',
        ctaLine2: 'COMMUNITY',
    },
};
