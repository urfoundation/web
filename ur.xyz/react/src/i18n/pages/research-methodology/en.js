// The research methodology page's English (/research/methodology): its words
// as the data module writes them (react/src/data/research-methodology.js, which
// stays their source, with the hrefs, keys and dates), and the few the
// component writes itself.
import { METHODOLOGY as M } from '../../../data/research-methodology.js';

const byKey = (list, make) => Object.fromEntries(list.map((item) => [item.key, make(item)]));

export default {
    eyebrow: M.eyebrow,
    title: M.title,
    description: M.description,
    figure: M.figure,
    metaNote: M.metaNote,
    lede: M.lede,
    indexAria: 'The three loops',
    loops: byKey(M.loops, (l) => ({ name: l.name, instrument: l.instrument, cadence: l.cadence })),

    discipline: {
        eyebrow: M.discipline.eyebrow,
        title: M.discipline.title,
        rules: M.discipline.rules.map((r) => ({ title: r.title, body: r.body })),
    },

    outputs: {
        eyebrow: M.outputs.eyebrow,
        title: M.outputs.title,
        body: M.outputs.body,
        figure: M.outputs.figure,
        // each stage's two lines are drawn in the wide figure, where a line has about 140px
        stages: M.outputs.stages.map((s) => ({ name: s.name, lines: [...s.lines] })),
        outcome: M.outputs.outcome,
        process: M.outputs.process,
        // the rails' keys in the wide figure, and their names in the phone figure's key
        railKeys: { process: 'PROCESS', outcome: 'OUTCOME' },
        rails: { outcome: 'Outcome', process: 'Process' },
        example: { tag: M.outputs.example.tag, body: M.outputs.example.body, source: M.outputs.example.source },
    },

    agents: {
        eyebrow: M.agents.eyebrow,
        title: M.agents.title,
        body: M.agents.body,
        roles: M.agents.roles.map((r) => ({ name: r.name, body: r.body })),
    },

    sections: {
        eyebrow: M.sections.eyebrow,
        title: M.sections.title,
        loops: byKey(M.sections.loops, (l) => ({
            tag: l.tag,
            title: l.title,
            body: l.body,
            facts: l.facts.map((f) => ({ v: f.v, l: f.l })),
            links: l.links.map((k) => k.label),
        })),
    },

    publication: {
        eyebrow: M.publication.eyebrow,
        title: M.publication.title,
        body: M.publication.body,
        cta: M.publication.cta,
    },
};
