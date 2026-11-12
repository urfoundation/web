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

The SN25 mainnet launch timeline at /mainnet, in English and in the site's five other languages at /ru/mainnet, /ar/mainnet (right to left), /zh/mainnet, /de/mainnet and /es/mainnet. Dated notices head the page, newest first in every language: react/src/data/mainnet.js lists them in the order they were posted, mainnetNotices sorts them by the day each was posted and within a day the later first, and each links its full text, in English, in the sn repo's mainnet/notices. Then the box of what miners need to do, the payout epochs, version 1 then settlement v2 from epoch 4, and each milestone with its status (done, in progress, scheduled or planned) and its on-chain sources, through the extender pool and capture the flag from epoch 8. The milestones are data, in react/src/data/mainnet-timeline.json; tests/mainnet-timeline.test.mjs pins the notices' order and the milestones. Every word is the page's copy in react/src/i18n/pages/mainnet: its en.js is the page's own English, and data/en.js and timeline/en.js are derived from the two data files, so a new or changed notice, step, epoch or milestone is a new or stale key that tests/i18n-staleness.mjs fails until ru, ar, zh, de and es have it (react/src/i18n/pages/mainnet's tests check the translations' figures and order). Dates are written in each language from the data, at the same UTC times, and figures keep their English digits and separators. The footer's Network column links it.

# 7. Capture the flag

Capture the flag at /ctf, English-only like /mainnet: the subnet's per-country reward, ten slots in each of the 249 ISO 3166-1 countries every epoch, five for providers and five for extenders (sn CAPTURETHEFLAG.md; the design is sn's design/ctf/design.html, the build plan design/ctf/SEO.md). Its title leads with plain earning words ("Earn crypto by sharing your internet in 249 countries"), because in search "capture the flag" means hacking contests; the H1 keeps the program's name. The hub reads: the live bar (the epoch and the time to its draw, the slot, what was carried and paid, and the flags held and the countries not fully captured, which filter the grid with a view transition), the visitor's country (from the API's /sn/ctf/here, or picked; the static page shows the biggest open pot, or no country before the first draw), Easy wins (eight big pots with an open slot, drawn by pot size, again on each visit and with Shuffle), the grid of all 249 countries (A–Z, biggest pot or easiest wins; all, big pots or held; find by name or code), how the draw works, questions, and the fine print with the chance to win's definition at #chance-to-win. Next steps open on hover or focus on desktop, and a card opens to full width on a tap on tablets and phones.

Each country has its own page at /ctf/<cc> (/ctf/ke), indexable, titled "Earn crypto in <country>: open slots and pots" where that fits 60 characters: the country's slots, pots and chance to win this epoch, or before the first draw the providers the network's dashboard counted online there; questions in the searchers' own words (make money, passive income, remote work: it is not a job), the other big pots, and the countries before and after it. Its alternate is the country's JSON (/sn/ctf/country/<cc>), and it is a WebPage about its Country, part of the hub's Dataset.

The pages are rendered to static HTML from the epoch's snapshot, react/src/data/ctf-epoch.json, so every figure is in the HTML that search engines and AI crawlers read; only the live bar, the cards, Easy wins and the grid hydrate. After each epoch's census and root, scripts/ctf-import.mjs writes the snapshot from GET https://api.bringyour.com/sn/ctf (sn/api/operator.yml), checking it first; `node scripts/generate-og.mjs --ctf` renders the epoch's social card; then the site is rebuilt and deployed. Until the API answers, from epoch 8, the snapshot is the pre-launch one (`--prelaunch`, from the server's country table): no draw, no pots, and the start at about 18:25 UTC on November 27, 2026; before the first root, and after an epoch without a draw, the pages say nothing of winning by default and show no chance to win. tests/ctf.test.mjs pins the snapshot's invariants and the pages' model. The seo-audit reads what each country page says of its own country (without its neighbours and other big pots, its name masked): pages that read alike must be countries whose data is the same, else a page has dropped its figures; it lists the countries that read alike because their data is the same (before launch, the ones the dashboard never counted), which need data or a local note of their own (react/src/data/ctf-local-notes.js); and without a draw it refuses any default win or chance to win. The flags are flag-icons 7.6.0 (MIT), one file per country under /ctf/flags (scripts/ctf-flags.mjs). The nav's Network menu and the footer's Network column link the hub; llms.txt lists the hub, the API and its OpenAPI document, not the 249 country pages.

# Footer

Include the github link (https://github.com/urnetwork), discord link (https://discord.gg/urnetwork).

Include a disclaimer This site is an open source utility protocol powered by a community of participants, run separately from the network operator that sells access to the network.

Include a license that URnetwork and the connector logo are registered trademarks in the US. Users of the protocol are granted the right to use the brand kit as "powered by" or when clearly differentiated as a component of the product being sold. Link to the brand kit.

