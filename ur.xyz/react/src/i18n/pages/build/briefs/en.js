// /build: the live page's wording of the six example opportunities (react/src/data/buildContent.js
// BUILD_V12, which stays their English source), in the same order as build/opportunities: the readout
// beside the model (category, title or displayTitle, summary) and the opportunity brief (the three
// story sections and the facts beside them).
//
//   category       a small label, shown in capitals
//   title          the opportunity's name in the brief
//   displayTitle   (encrypted communications only) a shorter name for the readout's one-line headline
//   summary        one sentence under the readout's title
//   opportunityTitle + opportunity, sn25Title + sn25, owns
//                  the brief's three sections: "Opportunity", "Why UR", "What remains with the operator"
//   customer, demand, networkUse
//                  short facts beside the brief
import { BUILD_V12 } from '../../../../data/buildContent.js';

export default {
    items: BUILD_V12.map((b) => ({
        category: b.category,
        title: b.title,
        ...(b.displayTitle ? { displayTitle: b.displayTitle } : {}),
        summary: b.summary,
        opportunityTitle: b.opportunityTitle,
        opportunity: b.opportunity,
        sn25Title: b.sn25Title,
        sn25: b.sn25,
        owns: b.owns,
        customer: b.customer,
        demand: b.demand,
        networkUse: b.networkUse,
    })),
};
