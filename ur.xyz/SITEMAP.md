# ur.xyz sections


# 1. Whitepaper

This section should include a clean and minimal formatting of the statement of facts, from geode/statement-of-facts.pdf. It should link to the pdf.

# 2. Research

This should include the reasearch summary from RESEARCH.md.

The Apex competition card heads /research in every language: the art, the countdown band, the text and the button, then the competition's progress, a bar of its six epochs, and the net improvement from the starting baseline to the current best (the newest approved winner), with a line under the figures that says they are benchmark evaluation results, not deployed product gains, and that time to first byte did not improve. The progress and the figures are data, APEX_RESULTS in react/src/components/research-competition.js, one entry per completed epoch; tests/research-competition.test.mjs pins them.

## Research reports

The August–October 2026 research report at /research/2026-q3-report, English-only like /mainnet, linked from a card under the /research intro in every language. It reads intro, timeline, methods, milestones, details. The intro grounds the research in its aim (the best encryption and the best speed for everyone, in everyday use, that makes your internet better), what each meter means in everyday use, the headline figures (multiples) and every entry at a glance. The timeline lays out the 39 entries of connect/20261024-RESEARCH-IMPACT.md, each with a plain headline, one key figure and a marker for its kind, and the report's own text a click away; meters (page load, bulk speed, packet path, memory, recoveries) replay the evidence as the reader goes and are never combined into one score. Then the seven methods (each with an animation), the gigabit-class milestone from adaptive windows, and the details: how far each kind of gain went, the instruments, what is still open, and a glossary. On wide screens a sidebar lists the sections and the meters sit in the other margin beside the timeline; on tablets and phones a bar docks under the nav with a menu of the sections and, in the timeline, the meters. The content is data, in react/src/data/research-report-2026-q3.json: scripts/research-report-import.mjs refreshes the figures quoted from the report and keeps the plain layer, and tests/research-report.test.mjs checks that every figure shown is the report's.

The research methodology at /research/methodology, English-only like the reports, linked from a card right under the report's card on /research in every language. The card's hero is the three research loops' rings (the lab innermost, the open competition, the volunteer field nodes outermost), each turning at its own pace in CSS and still under reduced motion; the same rings head the page. The page, written from the research-loops abstract, reads: the discipline the loops share (a frozen baseline, the instrument's noise measured first, every attempt kept), their two outputs (a better network and a better instrument, with the five stages and their two rails), the agents' roles, each loop with its key figures and public sources, and quarterly publication. Its copy is react/src/data/research-methodology.js; its lab figures are the report's and its competition figures the competition card's (tests/research-methodology.test.mjs).

# 3. Providers

# 4. Extenders

# 5. Exchanges

The $UR token can be traded on the following exchanges:

Jupiter
Meteora

# 6. Mainnet

The SN25 mainnet launch timeline at /mainnet, English-only like /about and /reserve: the payout epochs, version 1 then settlement v2, targeted from epoch 4, and each milestone with its status (done, in progress or planned) and its on-chain sources. The milestones are data, in react/src/data/mainnet-timeline.json. The footer's Network column links it.

# Footer

Include the github link (https://github.com/urnetwork), discord link (https://discord.gg/urnetwork).

Include a disclaimer This site is an open source utility protocol powered by a community of participants, run separately from the network operator that sells access to the network.

Include a license that URnetwork and the connector logo are registered trademarks in the US. Users of the protocol are granted the right to use the brand kit as "powered by" or when clearly differentiated as a component of the product being sold. Link to the brand kit.

