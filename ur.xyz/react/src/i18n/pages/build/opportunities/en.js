// /build: the six example opportunities (react/src/data/buildContent.js BUILD_ARCH.opportunities,
// which stays their English source), in its order: white-label VPN, encrypted business
// communications, the agent access layer, AI answer visibility, ad verification + brand protection,
// private search + retrieval. Each is shown in the opportunity tabs, the readout beside the model, the
// product screens on the models and the opportunity brief (react/src/components/pages/BuildBrief.jsx).
//
//   short             the tab's label: keep it short (two or three words)
//   title             the opportunity's name
//   category          a small label above it, shown in capitals
//   teaser            one sentence under the title
//   customer, problem, proposition, scenario, owns, inherits, value
//                     the structured brief's paragraphs
//   traffic           the path demand takes, hops separated by " → ": keep the arrows, one per hop
//                     (the page draws each hop as a box)
//   constraints       four short items: constraints and open questions
//   demandProfile, reliance, networkUse
//                     short facts, also shown in capitals as tags ("Critical" is the network reliance)
//   editorial…        the editorial brief of the page's earlier editions (?model=terminal4 and the
//                     version 10 models); editorialThesis is also the quote on the live page's brief
import { BUILD_ARCH } from '../../../../data/buildContent.js';

export default {
    items: BUILD_ARCH.opportunities.map((o) => ({
        short: o.short,
        title: o.title,
        category: o.category,
        teaser: o.teaser,
        customer: o.customer,
        problem: o.problem,
        proposition: o.proposition,
        editorialOpportunityTitle: o.editorialOpportunityTitle,
        // a small label, shown in capitals after "02 /"
        editorialProblemLabel: o.editorialProblemLabel,
        editorialProblemTitle: o.editorialProblemTitle,
        editorialSn25Title: o.editorialSn25Title,
        editorialThesis: o.editorialThesis,
        editorialWhy: o.editorialWhy,
        editorialUnlock: o.editorialUnlock,
        editorialOpen: o.editorialOpen,
        scenario: o.scenario,
        traffic: o.traffic,
        owns: o.owns,
        inherits: o.inherits,
        value: o.value,
        constraints: [...o.constraints],
        demandProfile: o.demandProfile,
        reliance: o.reliance,
        networkUse: o.networkUse,
    })),
};
