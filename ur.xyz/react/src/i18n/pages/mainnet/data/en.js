// /mainnet: the English of data/mainnet.js, derived from it, so the data stays
// the one source. A translation (ru.js, ar.js, zh.js, de.js, es.js beside
// this file) has the same keys, written out:
//
//   notices   each notice at the top of the page, by its id: its title, its
//             paragraphs in order, and its link's words. The date is not
//             here: the page writes it from the notice's `date`, in every
//             language, and keeps the notices newest first by it.
//   actions   the box under the notices: its headline and title, each step's
//             title, detail and link words, and the closing paragraph, whose
//             {link1}, {link2}, … are its links, in order (closingLinks).
//   epochs    what each epoch is, by its number (the epoch's `summary`).
//   before    the group of milestones before the first epoch.
//
// A new notice, paragraph, step or epoch in data/mainnet.js is a new key here,
// which tests/i18n-staleness.mjs fails until every translation has it.
import { mainnetActions, mainnetAfterEpochs, mainnetBeforeEpochs, mainnetEpochs, mainnetNotices } from '../../../../data/mainnet.js';

const linked = mainnetActions.closing.filter((run) => run.href);

export default {
    notices: Object.fromEntries(mainnetNotices.map((notice) => [notice.id, {
        title: notice.title,
        paragraphs: notice.paragraphs,
        link: notice.link.label,
    }])),

    actions: {
        headline: mainnetActions.headline,
        title: mainnetActions.title,
        steps: mainnetActions.steps.map((step) => ({
            title: step.title,
            detail: step.detail,
            ...(step.link ? { link: step.link.label } : {}),
        })),
        closing: mainnetActions.closing.map((run) => (run.href ? `{link${linked.indexOf(run) + 1}}` : run.text)).join(''),
        closingLinks: linked.map((run) => run.text),
    },

    epochs: Object.fromEntries(mainnetEpochs.map((epoch) => [epoch.number, epoch.summary])),

    before: {
        title: mainnetBeforeEpochs.title,
        ...(mainnetBeforeEpochs.summary ? { summary: mainnetBeforeEpochs.summary } : {}),
    },
    ...(mainnetAfterEpochs.title || mainnetAfterEpochs.summary
        ? { after: { ...(mainnetAfterEpochs.title ? { title: mainnetAfterEpochs.title } : {}), ...(mainnetAfterEpochs.summary ? { summary: mainnetAfterEpochs.summary } : {}) } }
        : {}),
};
