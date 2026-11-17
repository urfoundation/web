import { DOCS_LANDING_NOTICE } from '../../../lib/docs-shared.js';

// The docs pages' own words: the chrome around the documents (the docs
// landing, a document's header and sidebar, the search box, the code blocks'
// Copy button) and the legal pages' translation notice. The documents
// themselves are translated in corpus/<lang>/ beside this file and held to
// their English by corpus.mjs.
export default {
    // a document's page (astro/src/components/routes/DocPage.astro)
    page: {
        eyebrow: 'Docs',
        updated: 'Updated',
        // the <title> of a document without one of its own
        title: '{title} — UR Docs',
    },
    // the docs landing, /docs
    index: {
        title: 'UR Docs | Miner, validator and network operator guides',
        description: 'How to run a miner or a validator on Bittensor SN25 and become a network operator, one guide per role, plus the UR litepaper. Each is also served as markdown.',
        breadcrumb: 'Docs',
        name: 'UR documentation',
        eyebrow: 'Documentation',
        heading: 'UR docs',
        intro: 'How to take part in the UR privacy network on Bittensor SN25, one guide per role, and the litepaper that explains the mechanism they take part in. Every document is also served as markdown.',
        // shown after the intro on a translated landing only: the markdown
        // twins and the llms files stay English
        markdownEnglish: 'The markdown versions are in English.',
        // a notice in markdown above the landing's list, while docs-shared.js
        // sets one ('' when there is none); its translations follow it
        notice: DOCS_LANDING_NOTICE,
    },
    // the sidebar (astro/src/components/DocsShell.astro, components/Explorer.jsx)
    nav: {
        label: 'Documentation navigation',
        sections: 'Documentation sections',
        groups: {
            docs: 'Docs',
            miner: 'Miner guide',
            legal: 'Legal',
        },
    },
    search: {
        placeholder: 'Search docs',
        label: 'Search docs',
        results: 'Search results',
        none: 'No matches.',
        kind: 'DOC',
    },
    // the code blocks' bar (lib/markdown.jsx CodeBlock)
    code: {
        copy: 'Copy',
        copied: 'Copied',
        status: 'Copied to the clipboard',
        text: 'Text',
    },
    // the legal documents, published as /terms, /privacy and /vdp
    legal: {
        // their names in the docs sidebar and search
        titles: {
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            vdp: 'VDP',
        },
        revised: 'Last revised: {date}',
        // a translated legal page opens with this note and a link to the English page
        notice: 'This is a translation, provided for convenience. The English version is the authoritative text: where the two differ, the English version prevails.',
        english: 'Read the English version',
    },
};
