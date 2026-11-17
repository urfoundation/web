// /mainnet: the English of the milestones, data/mainnet-timeline.json, derived
// from it, so the data stays the one source. A translation (ru.js, ar.js,
// zh.js, de.js, es.js beside this file) has the same keys, written out: each
// milestone by its id, with its title, its detail and its sources' labels, in
// the order the data lists them. Its date, status, refs and links are the
// data's, in every language.
//
// A new milestone, or a new source of one, is a new key here, and a changed
// title, detail or label a changed one: tests/i18n-staleness.mjs fails until
// every translation has it (react/src/i18n/README.md).
import timeline from '../../../../data/mainnet-timeline.json' with { type: 'json' };

export default {
    events: Object.fromEntries(timeline.events.map((event) => [event.id, {
        title: event.title,
        detail: event.detail,
        sources: event.sources.map((source) => source.label),
    }])),
};
