/**
 * Capture the flag (ur.xyz/ctf and its 249 country pages /ctf/<cc>): the
 * English copy, the source of the five translations beside it. The program is
 * a per-country auction of reward slots on SN25: never call it a lottery, and
 * keep "draw", "pot" and "chance to win", the words the owner chose.
 *
 * Capture the flag is part of the SN25 protocol, not one operator's program:
 * every network operator runs a capture the flag pool beside its provider pool,
 * with ten slots in every country and its own draw among its own miners, and
 * the pages combine every operator of the operator list (ur.xyz/operators.yml).
 * So the copy says what each operator has ("every network operator has five
 * provider slots … in {the}"), and names an operator only where a per-operator
 * fact is the point: a draw's odds, an open slot, where to claim (`ops`). A
 * string ending in "Many" is the form a page uses when it combines more than
 * one operator, where the one-operator form states that operator's figures.
 *
 * How the pages fill it (ctf/i18n.js):
 * - {name} placeholders are filled by interpolate; keep each one verbatim.
 *   A country's sentence takes any of these, so a translation picks the form
 *   its grammar needs:
 *     {name}  the country's name as a list shows it (CLDR), "Kenya"
 *     {the}   the name inside a sentence ("the DR Congo"; in a translation the
 *             same as {name}); {The} capitalized
 *     {short} the short name a title or the breadcrumb uses ("DR Congo")
 *     {in}    "in <country>" as the language says it ("в Кении", "in der
 *             Schweiz", "en los Países Bajos"); {In} capitalized; {inShort}
 *             the same with the short name
 *   (names/<lang>.js holds every country's forms.)
 * - <b>…</b>, <api>…</api> and the other tags wrap a part of the sentence in
 *   an element (bold, a link, a <time>): keep them around the words they mark.
 * - A plural node ({ one, other } here) is one entry: a translation gives the
 *   forms its language needs (ru one/few/many/other, ar zero/one/two/few/
 *   many/other, zh other), each with the same placeholders. {count} is the
 *   number the form is chosen by; a node's comment names it.
 * - Strings that begin or end with a space join the text around them as they
 *   are; `gap` is what goes between two sentences ('' in Chinese).
 * - Figures written into the text (2,490; 249; /29) take the language's own
 *   number format; the pages format every other figure themselves.
 */
export default {
    program: 'Capture the flag',
    gap: ' ',
    stop: '.',

    time: {
        // a month with a day: "November 27"
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        // {d} day, {month} or {monthShort} its name, {mon} its number (1–12), {y} year, {hh}:{mm} UTC
        day: '{month} {d}, {y}',
        dayMonth: '{month} {d}',
        moment: '{monthShort} {d}, {hh}:{mm} UTC',
        clock: '{hh}:{mm} UTC',
        // the live bar's countdown; {hh} and {mm} are two digits
        countdownDays: '{d}d {hh}h',
        countdownHours: '{h}h {mm}m',
        countdownMinutes: '{m}m',
    },

    meta: {
        hubTitle: 'Earn crypto by sharing your internet in 249 countries | UR',
        // a country page's title: the first form within 60 characters
        countryTitle: {
            full: 'Earn crypto in {the}: open slots and pots | UR',
            plain: 'Earn crypto in {the} | UR',
            short: 'Earn crypto in {short} | UR',
        },
        // the hub's description, within 175 characters: {lead} and one sentence of the phase
        hubLead: 'Five provider and five extender reward slots in every country, every week.',
        // with more than one operator; {count}: a country's slots of each role, five at each operator
        hubLeadMany: { other: '{count} provider and {count} extender reward slots in every country, every week.' },
        // {count}: the countries with an open provider slot
        hubDrawn: { other: '{lead} This epoch: {count} countries with open provider slots and {carried} α in pots.' },
        hubUndrawn: '{lead} Epoch {epoch} had no draw, so every slot carried: {carried} α in pots.',
        hubFirst: "{lead} Epoch {epoch} is the first, and its draw follows the epoch's end, about {day}.",
        hubDrawing: '{lead} Epoch {first}, the first, has ended, and its draw is under way.',
        hubPrelaunch: "{lead} Capture the flag starts with epoch {first} on {day}: see every country's slots.",
        // a country page's description, within 175 characters: the longest of its forms that fits
        pots: 'pots of {p} α for providers and {x} α for extenders',
        drawnLead: '{The} this epoch: {po} provider and {xo} extender slots open, with {pots}.',
        undrawnLead: '{The} this epoch: no draw last epoch, so every slot carried, with {pots}.',
        stayWin: 'Stay online for half the epoch to win.',
        stayDraw: 'Stay online for half the epoch to enter the draw.',
        updated: 'Updated {day}.',
        startPrelaunch: '{The} has five provider and five extender reward slots each epoch from epoch {first}, {day}.',
        startFirst: '{The} has five provider and five extender reward slots in epoch {epoch}, the first, drawn about {day}.',
        startDrawing: "{The} has five provider and five extender reward slots each epoch; epoch {first}'s, the first, are being drawn.",
        // the three above with more than one operator; {count}: the country's slots of each role, five at each operator
        startPrelaunchMany: { other: '{The} has {count} provider and {count} extender reward slots each epoch from epoch {first}, {day}.' },
        startFirstMany: { other: '{The} has {count} provider and {count} extender reward slots in epoch {epoch}, the first, drawn about {day}.' },
        startDrawingMany: { other: "{The} has {count} provider and {count} extender reward slots each epoch; epoch {first}'s, the first, are being drawn." },
        // {count}: the providers online there that day
        seen: { one: '{count} provider was online there on {day}.', other: '{count} providers were online there on {day}.' },
        seenNone: 'No provider was online there on {day}.',
    },

    hub: {
        eyebrow: 'SN25 · every country, every epoch',
        mission: 'Providers and extenders in every country',
        answer: 'Mine as a provider or an extender, with the miner or the free URnetwork app, and you can win weekly crypto rewards wherever you are.',
        starts: 'Capture the flag starts with epoch {first}, at about {clock} on {day}. ',
        intro: "Every SN25 network operator runs a capture the flag pool beside its provider pool, with ten slots in every country each epoch (one week): five for providers and five for extenders. A slot nobody wins rolls into the country's pot at that operator, and each winner there takes its slot and a fifth of the pot. {rule}",
    },

    // the note at the top of the hub before capture the flag starts, with its countdown on the visitor's clock
    // (ctf/Countdown.jsx); the build leaves it out once a snapshot from after the start is imported
    start: {
        // {first} the first epoch, {block} its first block, {day} the day ("November 27"), {clock} "18:25 UTC"
        note: 'Capture the flag starts with epoch {first}, at block {block}, about {day}, {clock}.',
        // what the note says once the start has passed on the visitor's clock
        live: 'Capture the flag is live from epoch {first}.',
        // over the countdown's figures (the start is a projection, so about), and under each
        in: 'Starts in about',
        days: 'days',
        hours: 'hours',
        minutes: 'minutes',
        seconds: 'seconds',
        // beside the blocks left to the start
        blocks: 'Blocks to go',
        // in the countdown's place once it has started
        go: 'Live',
        // the countdown in words for a screen reader, changed at most once a minute: {time} is "15 days",
        // "20 hours" or "5 minutes" in the page's language (Intl), so it stands where a plain amount of time can
        about: 'Starts in about {time}.',
    },

    // the rule a newcomer meets: after a draw, or before one
    rule: {
        drawn: "Where an operator's slot went unclaimed, a new miner with that operator who stays online for half the epoch wins by default.",
        open: "Each operator's draw picks up to five winners per country and role, and with five entries or fewer, every entry wins a slot.",
    },

    how: {
        title: 'How the draw works',
        steps: [
            { title: 'Be there', body: "Run a provider or an extender in the country, with any network operator, for at least half the epoch, and be online when it ends. Your network's existing payout wallet is used, so there is nothing new to sign." },
            { title: 'The draw', body: 'When the epoch ends, each network operator commits the list of its eligible miners on chain. A public drand round then picks up to five winners per country for each role from that list. With five or fewer entries, everyone wins. Miners in one /29 or /48 share a single ticket.' },
            { title: 'Claim', body: "Each winner takes its slot and a fifth of the country's pot, so staying several epochs captures most of a big pot. The alpha accrues to your wallet in your operator's capture the flag pool, and you claim it with your pool earnings, in the app or with the miner." },
        ],
    },

    // what a slot is worth: last epoch's, or at epoch 4's scale before the first draw
    worth: {
        slot: 'A slot is worth about {slot} α this epoch',
        // with more than one operator, whose slots differ: the smallest and the largest
        slotMany: 'A slot is worth about {min} to {max} α this epoch, depending on the operator',
        scale: "A slot is worth its operator's fresh capture the flag funding for the epoch divided by 2,490: about {slot} α at epoch 4's scale, an illustration rather than a forecast",
    },

    hubFaq: {
        title: 'Questions',
        whatQ: 'What is capture the flag?',
        whatA: "A weekly reward that is part of the protocol of Bittensor subnet 25 (UR): every network operator runs a capture the flag pool beside its provider pool, with five provider slots and five extender slots in every country each epoch (one week), and winners are paid in alpha, the subnet's token. A slot that nobody wins adds its amount to that country's pot, so a newcomer to an empty country takes a fifth of the pot every epoch it stays.{starts}",
        whatStarts: ' It starts with epoch {first}, at about {clock} on {day}.',
        winQ: 'How do I win a slot?',
        winDrawn: "Run a miner or the free URnetwork app as a provider or an extender, keep it online in your country for at least half the epoch, and be online when it ends. Where your operator's slot went unclaimed last epoch, a newcomer wins by default. Where all five were won, its public draw picks five winners.",
        winOpen: "Run a miner or the free URnetwork app as a provider or an extender, keep it online in your country for at least half the epoch, and be online when it ends. Each operator's public draw then picks up to five winners per country for each role, and with five entries or fewer, everyone wins.",
        earnQ: 'How much can I earn?',
        earnA: "{worth}, and a winner in a country with a pot also takes a fifth of that pot. Amounts change every epoch with the network's emission and with how many people run in each country, and alpha's price moves. Nothing is guaranteed.",
        passiveQ: 'Is it passive income, or a job?',
        passiveA: 'Neither, quite. A miner, or the app, runs in the background on a computer or phone you already have, but it earns only while it stays online. It is not a job, with no employer, hours or wage, and not an investment, with no fixed return.',
        rolesQ: 'What is the difference between a provider and an extender?',
        rolesA: 'A provider shares your internet connection with the people who use the network. An extender is a relay for people who cannot reach the network directly, for example behind censorship. The miner and the desktop app run both by default, and one device can win in both roles. An extender works only where the internet can reach your computer on TCP port 443: <ext>Run an extender</ext> says how to open it.',
        fairQ: 'How is the draw kept fair?',
        fairA: 'When the epoch ends, each network operator commits the list of its eligible miners on chain. A drand round published after that commitment then picks the winners, so nobody, the operator included, can choose them. Every draw can be checked against its census and its round.',
        agentsQ: 'Can my AI assistant read this data?',
        // <list> links the operator list (ur.xyz/operators.yml)
        agentsA: "Yes. {lead} the public JSON every network operator serves at <api>/sn/ctf</api>, documented in <spec><code>sn/api/operator.yml</code></spec>, with times in UTC and amounts in α; <list>the operator list</list> names each operator's API. They change once an epoch.",
        agentsLive: 'The numbers on this page add up',
        agentsSoon: 'From epoch {first}, the numbers on this page add up',
    },

    fine: {
        estimate: "Up for grabs is an estimate: the pots carried in, plus this epoch's ten slots at last epoch's slot amount of {slot} α. Every draw can be checked against its on-chain census and drand round, published at its operator's <api>/sn/ctf</api>.",
        // with more than one operator, whose slots differ: the smallest and the largest
        estimateMany: "Up for grabs is an estimate: the pots carried in at every operator, plus this epoch's ten slots at each, at its last slot amount ({min} to {max} α). Every draw can be checked against its on-chain census and drand round, published at its operator's <api>/sn/ctf</api>.",
        published: "Every draw can be checked against its on-chain census and drand round, published at its operator's <api>/sn/ctf</api> from epoch {first}.",
        chance: "Chance to win shows where all five of a role's slots at an operator were won last epoch. Its entries are last epoch's eligible units in that role at that operator plus you, and it is 5 ÷ entries, the exact odds of that operator's draw of five winners; with five entries or fewer, everyone wins.{drawn}",
        chanceDrawn: " Where an operator's slot went unclaimed, a new miner with that operator wins by default.",
        disclosure: "Rewards are paid in alpha, the token of Bittensor subnet 25, whose value changes and can fall. They depend on uptime, on how many others run in each country and on the network's emission. They are not wages, a salary, a guaranteed income or an investment, and you pay your own costs, such as power and data. Local law applies.",
        // <list> links the operator list (ur.xyz/operators.yml)
        operator: "Capture the flag is part of the SN25 protocol: every network operator runs a capture the flag pool beside its provider pool, with its own draw in every country, and this page combines every operator in <list>the operator list</list>. Its rules are public: the method in <method>CAPTURETHEFLAG.md</method>, and the code in <source>the subnet's repository</source>.",
        // an operator of the list whose data the import could not read; {names}: their domains; {count}: how many
        leftOut: { one: ' Left out of these figures: {names}, whose data could not be read, or was not current, when this page was built.', other: ' Left out of these figures: {names}, whose data could not be read, or was not current, when this page was built.' },
        data: "Country pages are built from each epoch's public data.",
        dataPresence: " Providers online are the network dashboard's count at the end of {day}.",
        flags: 'Flags: flag-icons, <lic>MIT licence</lic>.',
        updated: ' Updated <time>{day}</time>.',
    },

    // the live bar: this epoch at a glance
    live: {
        aria: 'This epoch',
        tag: 'Epoch {epoch}',
        tagFirst: 'Epoch {epoch} · the first',
        starts: 'Starts',
        startsIn: 'Starts in',
        draw: 'Draw',
        drawIn: 'Draw in',
        underWay: 'under way',
        approx: '≈ {time}',
        pending: "Epoch {epoch}'s draw",
        census: 'census at block {block}',
        waiting: 'waiting for the census',
        slot: 'Slot',
        // the slot's amount with more than one operator, whose slots differ: the smallest and the largest
        slotRange: '{min}–{max}',
        carried: 'Carried into this epoch',
        paid: 'Paid last epoch',
        // {count}: last epoch's winners
        paidValue: { other: '{amount} α · {count} winners' },
        heldTitle: 'Show only the flags held on both roles',
        held: 'Flags held',
        // {total}: the flags there are, one per country at each operator
        heldValue: '{count} / {total}',
        notFully: 'Not fully captured',
        pTitle: 'Show only countries with a provider slot open',
        xTitle: 'Show only countries with an extender slot open',
        providers: 'Providers',
        extenders: 'Extenders',
        undrawn: 'Epoch {epoch}',
        undrawnValue: 'no draw · every slot carried',
        firstDraw: 'First draw',
        slots: 'Slots',
        // {count}: a country's slots of each role, five at each operator
        slotsValue: '{count} + {count} a country',
        countries: 'Countries',
        countriesValue: '249',
    },

    // a country's card: the hub's "Your country" and a country page's "This epoch in …"
    card: {
        choice: 'Your choice',
        here: 'Your country · from your connection',
        biggest: 'Biggest open pot this epoch',
        ten: 'Ten slots in every country',
        // with more than one operator; {count}: a country's slots, ten at each operator
        tenMany: { other: '{count} slots in every country' },
        thisEpochIn: 'This epoch in {the}',
        yourCountry: 'Your country',
        none: 'Every network operator has five provider slots and five extender slots in every country each epoch. Pick yours to see what is up for grabs there.',
        nonePrelaunch: 'Every network operator has five provider slots and five extender slots in every country each epoch, from epoch {first}. Pick yours to see what is up for grabs there.',
        earning: 'Earning in {the}: questions and how to start',
        upForGrabs: 'up for grabs this epoch',
        // beside the count of providers online: {noun} is onlineNoun's form for that count
        online: '{noun} online at the end of {day}',
        // {count}: the providers online (the number itself stands beside it)
        onlineNoun: { one: 'provider', other: 'providers' },
        chanceNote: "Chance to win is the estimated probability that you win the epoch reward in your operator's draw if you launch a provider or an extender here and keep it online for half the epoch.",
        start: 'Start mining',
        startIn: 'Start mining in {the}',
        runExtender: 'Run an extender',
        // {where} is the country ({the}) or `where`; {whereIn} is "in <country>" ({in}) or `whereIn`
        stay: "Stay online in {where} for at least half the epoch to enter your operator's draw. Your existing payout wallet is used.",
        where: 'your country',
        whereIn: 'in your country',
        pickLabel: 'Somewhere else?',
        pickPlaceholder: 'Type a country',
    },

    // one role's line on a country's card, by phase
    roleLine: {
        // {count}: the country's slots of the role, five at each operator
        prelaunch: { other: '{count} slots each epoch from epoch {first}' },
        first: { other: '{count} slots this epoch · drawn about {draw}' },
        drawing: { other: "{count} slots each epoch · epoch {first}'s draw under way" },
        undrawn: 'no draw last epoch · pot {pot} α',
        // {slots}: the role's slots drawn last epoch, five at each operator that drew
        pOpen: '{won} of {slots} won last epoch · pot {pot} α · not fully captured, a new provider wins by default',
        xOpen: '{won} of {slots} won last epoch · pot {pot} α · not fully captured, a new extender wins by default',
        // {count}: the units in the draw
        held: { other: '{slots} of {slots} won last epoch · {count} units in the draw · chance to win' },
    },

    // the draw a newcomer to a fully captured role faces; {count} the units, then the entries (units + 1)
    drawFrom: { other: 'All five slots were won last epoch from {count} units.' },
    drawWith: { other: 'With you that is {count} entries for five slots, each worth about {slot} α.' },

    // a country's message to a newcomer this epoch, by phase
    message: {
        prelaunch: "Capture the flag starts with epoch {first}, about {start}: every network operator has five provider slots and five extender slots in {the} each epoch, and each operator's first draw follows the epoch's end, about {draw}.",
        first: "Epoch {epoch} is capture the flag's first: every network operator has five provider slots and five extender slots in {the}, drawn after the epoch ends, about {draw}.",
        drawing: "Epoch {first}, capture the flag's first, has ended and its draw is under way: the winners and pots in {the} appear here once the operators' roots are committed. Each epoch every network operator has five provider slots and five extender slots in {the}.",
        undrawn: 'Epoch {epoch} had no draw, so every slot in {the} carried into its pots: {p} α for providers and {x} α for extenders.',
        held: 'Every slot in {the} was won last epoch. A newcomer needs the draw: {pp} as a provider, {xp} as an extender.',
        // with more than one operator; {pp} and {xp} are each role's chances, a list (`ops`)
        heldMany: "Every slot in {the} was won last epoch, at every operator, so a newcomer needs its operator's draw. Chance to win as a provider: {pp}; as an extender: {xp}.",
        // {p} and {x} are pSlots and xSlots
        both: '{p} and {x} in {the} went unclaimed last epoch, so a new provider or extender who stays online there for half the epoch wins by default.',
        pOnly: '{p} in {the} went unclaimed last epoch, so a new provider who stays online there for half the epoch wins by default.',
        xOnly: '{x} in {the} went unclaimed last epoch, so a new extender who stays online there for half the epoch wins by default.',
        // {count}: the open slots of the role
        pSlots: { one: '{count} provider slot', other: '{count} provider slots' },
        xSlots: { one: '{count} extender slot', other: '{count} extender slots' },
    },

    // what the network's dashboard counted in a country before the first draw
    presence: {
        when: 'at the end of {day}',
        // {count}: the days of the window
        never: { other: "The network's dashboard counted no provider online in {the} {when}, or at the end of any of the {count} days before." },
        lastSeen: { other: "The network's dashboard counted no provider online in {the} {when}; it last counted any there at the end of {last}, and on {seen} of the last {count} days, {most}." },
        online: { other: "The network's dashboard counted {providers} online in {the} {when}, and providers there on {seen} of the last {count} days, {most}." },
        // {count}: the providers online that day
        providers: { one: '{count} provider', other: '{count} providers' },
        // {count}: the most online at the end of a day
        most: { one: 'one at most', other: '{count} at most' },
    },

    uninhabited: '{The} has no permanent population, so its slots may never be won: its pots grow every epoch and stay on the grid, and Easy wins leaves it out.',

    // what a country's last epoch adds to its page
    facts: {
        // {count}: its winners
        won: { one: 'Its {count} winner took {amount} α in all.', other: 'Its {count} winners took {amount} α in all.' },
        nobody: 'Nobody won a slot there.',
        // {count}: the miners who fell short
        near: { one: '{count} miner was there but fell short of the presence rule.', other: '{count} miners were there but fell short of the presence rule.' },
        // {count}: the epochs without a winner
        open: { one: 'It has had no winner for {count} epoch.', other: 'It has had no winner for {count} epochs.' },
    },

    // the next step in a country with an open slot (a "So close" ribbon or an "Open" chip)
    next: {
        // {count}: the miners who left early
        left: { one: '{count} miner here left early last epoch.', other: '{count} miners here left early last epoch.' },
        // {count}: the slots no one won
        // {total}: the slots drawn here last epoch, ten at each operator that drew
        unclaimed: { other: '{count} of {total} slots here went unclaimed last epoch.' },
        // these end where the bold `take` follows, then `stop`
        both: 'Run an extender, a provider or both in {the} for half an epoch. Both roles have open slots, so you win by default and take a fifth of each pot every epoch you stay, ',
        pOnly: 'Run a provider in {the} for half an epoch. A slot is open, so you win by default and take a fifth of its pot every epoch you stay, ',
        xOnly: 'Run an extender in {the} for half an epoch. A slot is open, so you win by default and take a fifth of its pot every epoch you stay, ',
        take: 'about {amount} α this epoch',
        takeEach: 'about {amount} α a role this epoch',
        label: 'Next step',
    },

    cta: {
        start: 'Start mining',
        p: 'Run a provider',
        x: 'Run an extender',
    },

    // a role's details when a card opens on a touch screen
    detail: {
        pUndrawn: 'Providers: no draw last epoch, so every slot carried; pot {pot} α.',
        xUndrawn: 'Extenders: no draw last epoch, so every slot carried; pot {pot} α.',
        // {slots}: the role's slots drawn last epoch, five at each operator that drew
        pOpen: 'Providers: {won} of {slots} won last epoch, pot {pot} α. Launch a provider here and you win by default: about {est} α this epoch, then a fifth of what is left each epoch you stay.',
        xOpen: 'Extenders: {won} of {slots} won last epoch, pot {pot} α. Launch an extender here and you win by default: about {est} α this epoch, then a fifth of what is left each epoch you stay.',
        // {units} and {entries} are `units` and `entries`
        pHeld: 'Providers: all five slots were won last epoch from {units}. The estimated probability that you win if you launch a provider here: {pct}, with {entries} for five slots, each worth about {slot} α.',
        xHeld: 'Extenders: all five slots were won last epoch from {units}. The estimated probability that you win if you launch an extender here: {pct}, with {entries} for five slots, each worth about {slot} α.',
        // {count}: the units in the draw; then the entries (units + 1)
        units: { other: '{count} units' },
        entries: { other: '{count} entries' },
        // pHeld and xHeld with more than one operator; {list}: the chance to win at each (`ops`)
        pHeldMany: 'Providers: every slot was won last epoch, at every operator. The estimated probability that you win if you launch a provider here: {list}.',
        xHeldMany: 'Extenders: every slot was won last epoch, at every operator. The estimated probability that you win if you launch an extender here: {list}.',
    },

    // the chance to win's tip
    chance: {
        pLabel: 'Chance to win · providers',
        xLabel: 'Chance to win · extenders',
        pBody: "The estimated probability that you win this epoch's reward in {the} if you launch a provider there and keep it online for half the epoch: <b>{pct}</b>.",
        xBody: "The estimated probability that you win this epoch's reward in {the} if you launch an extender there and keep it online for half the epoch: <b>{pct}</b>.",
        // pBody and xBody with more than one operator: {pct} is the best of their draws, and a list of each follows
        pBodyMany: "The estimated probability that you win this epoch's reward in {the} if you launch a provider there, with the operator whose draw gives the best chance, and keep it online for half the epoch: <b>{pct}</b>.",
        xBodyMany: "The estimated probability that you win this epoch's reward in {the} if you launch an extender there, with the operator whose draw gives the best chance, and keep it online for half the epoch: <b>{pct}</b>.",
    },

    // where a per-operator fact is the point, with more than one operator (each draws among its own miners): a
    // role's figures at each operator, by its domain ({operator}); a one-operator page shows that operator's alone
    ops: {
        // the chance to win in one operator's draw: "38% at bringyour.com"
        chance: '{pct} at {operator}',
        // a slot left open at one operator, and what a newcomer there takes this epoch
        open: 'open at {operator}, about {amount} α',
        // an operator that had no draw last epoch
        noDraw: 'no draw at {operator}',
        // between two items of a list (an item may hold a comma)
        sep: ' · ',
        // a role's list on a card or a tip; {list}: its items
        label: 'By operator: {list}.',
    },

    easy: {
        label: 'Easy wins',
        title: 'Big pots waiting this epoch',
        otherTitle: 'Other big pots this epoch',
        sub: 'Eight countries drawn at random from the biggest pots, weighted by pot size. Each has an open slot at an operator, so a newcomer with that operator who stays online there for half the epoch wins by default.',
        shuffle: 'Shuffle',
        showNext: 'Show the next step for {name}',
        soClose: 'So close',
        easyWin: 'Easy win',
        upForGrabs: 'α up for grabs',
        pots: 'Provider pot {p} α · extender pot {x} α',
        potsShort: 'P {p} α · E {x} α',
        // {count}: the miners who left early
        left: { one: '{count} miner was here last epoch but left early. ', other: '{count} miners were here last epoch but left early. ' },
        openBoth: 'Not fully captured: providers and extenders, so a newcomer wins by default.',
        openP: 'Not fully captured: providers, so a newcomer wins by default.',
        openX: 'Not fully captured: extenders, so a newcomer wins by default.',
        close: 'Close',
    },

    // a country of the grid
    cell: {
        letterP: 'P',
        letterX: 'E',
        pPot: 'Provider pot',
        xPot: 'Extender pot',
        open: 'Open',
        pNotFully: 'Not fully captured · providers',
        xNotFully: 'Not fully captured · extenders',
        // {count}: the role's open slots
        // {total}: the role's slots drawn last epoch, five at each operator that drew
        pUnclaimed: { other: '{count} of {total} provider slots went unclaimed last epoch.' },
        xUnclaimed: { other: '{count} of {total} extender slots went unclaimed last epoch.' },
        pRun: 'Run a provider in {the} for half an epoch and you win by default: <b>about {amount} α</b> this epoch, then a fifth of what is left each epoch you stay.',
        xRun: 'Run an extender in {the} for half an epoch and you win by default: <b>about {amount} α</b> this epoch, then a fifth of what is left each epoch you stay.',
        // what a cell says to a screen reader in place of its pips and chips ("alpha", the word, for α)
        // {total}: each role's slots drawn last epoch, five at each operator that drew
        summary: 'Last epoch: {p} of {total} provider slots and {x} of {total} extender slots won, {amount} alpha paid; {pRole}; {xRole}.',
        pOpenSr: 'providers not fully captured, a new provider wins by default',
        xOpenSr: 'extenders not fully captured, a new extender wins by default',
        pChanceSr: 'chance to win as a new provider {pct}',
        xChanceSr: 'chance to win as a new extender {pct}',
        undrawnSr: 'No draw last epoch: provider pot {p} alpha, extender pot {x} alpha.',
        soClose: 'So close',
        bigPot: 'Big pot',
        held: 'Held',
        showDetails: 'Show details for {name}',
        inPots: 'in pots',
        // {count}: the providers online (the number stands beside it)
        providers: { one: 'provider', other: 'providers' },
        online: 'online',
        wonLine: '{won} won · {amount} α',
        noDraw: 'no draw last epoch',
        seen: 'seen {seen}/{days} days',
        fromEpoch: 'from epoch {first}',
        // {count}: the miners who left early
        near: { one: 'So close: {count} miner here left early last epoch.', other: 'So close: {count} miners here left early last epoch.' },
        countryPage: 'Country page',
        close: 'Close',
    },

    // the hub's board: the grid and the live bar's filters
    board: {
        everyFlag: 'Every flag',
        all: 'All 249 countries',
        sortAria: 'Sort',
        showAria: 'Show',
        find: 'Find',
        findPlaceholder: 'Country or code',
        empty: 'No country matches “{q}”.',
        from: 'From the stats above',
        showAll: 'Show all 249',
        // {count}: the flags held, or the countries with an open slot of the role
        focusHeld: { other: '{count} flags held' },
        focusP: { other: '{count} countries with providers not fully captured' },
        focusX: { other: '{count} countries with extenders not fully captured' },
        noteHeld: 'Every provider slot and every extender slot was won last epoch. A newcomer needs the draw, and each cell shows the chance to win.',
        // noteHeld with more than one operator, where a flag is held at one operator and maybe not at another
        noteHeldMany: "Every provider slot and every extender slot of an operator was won last epoch. A newcomer with that operator needs its draw, and each cell shows the chance to win.",
        noteP: 'At least one provider slot of an operator went unclaimed last epoch. A new provider with that operator who stays online there for half the epoch wins by default. Biggest pots first, provider and extender together, and A–Z among pots within 0.1 α.',
        noteX: 'At least one extender slot of an operator went unclaimed last epoch. A new extender with that operator who stays online there for half the epoch wins by default. Biggest pots first, provider and extender together, and A–Z among pots within 0.1 α.',
    },

    sorts: {
        az: 'A–Z',
        pot: 'Biggest pot',
        easy: 'Easiest wins',
        online: 'Most online',
        fewest: 'Fewest online',
    },
    shows: {
        all: 'All',
        big: 'Big pots',
        held: 'Held',
    },

    // the grid's key
    legend: {
        slot: 'a slot: five for providers (P) and five for extenders (E) in each country, at each operator',
        // {count}: the days of the window
        online: { other: "providers online: the network dashboard's count at the end of {day}, and the days of the last {count} with any" },
        // {count}: the countries shown
        shown: { other: '{count} shown' },
        undrawn: "P providers, E extenders: each role's pot. Epoch {epoch} had no draw, so every slot carried.",
        bigPot: 'Big pot',
        waiting: '{amount} α or more waiting',
        mobile: 'open slot, or fully captured · tap a country for its details',
        pWon: 'provider won',
        xWon: 'extender won',
        slotOpen: 'slot open',
        openLabel: 'Not fully captured',
        openBody: 'A slot of an operator went unclaimed last epoch. A new provider or extender with that operator who stays online there for half the epoch <b>wins by default</b> and takes a fifth of the pot each epoch. Hover any Open chip for its role and amount.',
        openTail: 'not fully captured, a newcomer wins by default',
        chanceLabel: 'Chance to win',
        chanceBody: "Where all five of a role's slots at an operator were won, this is the estimated probability that you win that role's <b>epoch reward</b> in its draw if you launch a provider or an extender in the country and keep it online for half the epoch.",
        chanceAfter: "Entries are last epoch's eligible units in the role at that operator, plus you.",
        chanceTail: 'chance to win where all five slots were won',
        nearBody: 'Miners were in these countries but left before half the epoch. Run a provider or an extender there for half an epoch and you take <b>a fifth of the pot</b> each epoch you stay.',
        nearTail: 'a big pot, and miners there fell short last epoch',
        // {count}: the countries shown
        shownDrawn: { other: "{count} shown · P providers, E extenders: last epoch's winners and each open role's pot" },
    },

    // a country's page
    country: {
        crumbs: 'Breadcrumb',
        h1: 'Earn crypto in {the} with your internet connection',
        mission: 'Five provider and five extender slots in {the} every epoch (one week)',
        // with more than one operator; {count}: the country's slots of each role, five at each operator
        missionMany: { other: '{count} provider and {count} extender slots in {the} every epoch (one week)' },
        answer: 'Mine in {the} as a provider or an extender, with the miner or the free URnetwork app, and you can win weekly crypto rewards.',
        asOfDraw: "As of epoch {epoch}'s draw, {day}: ",
        asOfClose: "As of epoch {epoch}'s close, {day}: ",
        disclaimer: ' Rewards are paid in alpha, the token of Bittensor subnet 25, and are not guaranteed.',
        more: 'More countries',
        all: 'All 249 countries',
        // a neighbour's figure: its pots after a draw, its providers online before
        aroundPots: '{amount} α in pots',
        // {count}: the providers online
        aroundOnline: { one: '{count} provider online', other: '{count} providers online' },
    },

    countryFaq: {
        title: 'Questions about earning in {the}',
        earnQ: 'Can you make money in {the} by sharing your internet?',
        // {pe} and {xe} are the roles' entries (entries below); {took} is `took` when it had winners
        earnDrawn: "Yes, in small amounts. {worth}, and the pots carried in {the} are <b>{p} α</b> for providers and <b>{x} α</b> for extenders. Each winner takes its slot and a fifth of its role's pot. Last epoch, {pe} and {xe}{took}. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.",
        took: ', and its winners took {amount} α',
        earnUndrawn: "Yes, in small amounts. Epoch {epoch} had no draw, so every slot carried: the pots in {the} are now <b>{p} α</b> for providers and <b>{x} α</b> for extenders. {worth}, and each winner takes its slot and a fifth of its role's pot. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.",
        // {when} is one of the three below
        earnSoon: "Yes, in small amounts, {when}. Each epoch every network operator has five provider slots and five extender slots in {the}. {worth}. A slot nobody wins rolls into the country's pot at its operator, and each winner takes its slot and a fifth of its role's pot. Rewards are paid in alpha, whose value changes, and nothing is guaranteed.",
        whenPrelaunch: 'once capture the flag starts with epoch {first}, at about {clock} on {day}',
        whenFirst: "from epoch {epoch}, capture the flag's first, which is drawn about {draw}",
        whenDrawing: "from epoch {first}, capture the flag's first, whose draw is under way",
        // last epoch's entries in a role; {count}: the role's units
        pNone: 'no provider entered',
        xNone: 'no extender entered',
        pEntries: { one: '{won} of {count} provider entry won a slot', other: '{won} of {count} provider entries won a slot' },
        xEntries: { one: '{won} of {count} extender entry won a slot', other: '{won} of {count} extender entries won a slot' },
        passiveQ: 'Is it passive income?',
        passiveA: "Partly. A miner, or the app, runs in the background on a computer or phone you already have, but it earns only while it stays online, and what you win depends on how many others run in {the} and on alpha's price. It is not an investment and has no fixed return.",
        remoteQ: 'Is it remote work in {the}?',
        remoteA: 'No. Capture the flag is not a job: there is no employer, no hours and no wage. It can run alongside remote work or any other job, on the internet connection you already have.',
        roleQ: 'Provider or extender: which should I run in {the}?',
        // with more than one operator, {pct}, {pp} and {xp} are the chance at each operator, a list (`ops`)
        roleBoth: 'Either. Both roles have open slots in {the}, so a newcomer in either role wins by default. The miner and the desktop app run both.',
        roleX: 'An extender. Its slots in {the} were not all won last epoch, so a new extender wins by default. Every provider slot was won, so a new provider needs the draw: about <b>{pct}</b>.',
        roleP: 'A provider. Its slots in {the} were not all won last epoch, so a new provider wins by default. Every extender slot was won, so a new extender needs the draw: about <b>{pct}</b>.',
        roleHeld: 'Both roles were fully captured last epoch, so a newcomer needs the draw: about <b>{pp}</b> as a provider and <b>{xp}</b> as an extender. The miner and the desktop app run both, which enters both draws.',
        roleOpen: "Either, or both: each role has its own five slots and its own pot in {the} at every network operator. A provider shares your internet connection with the people who use the network; an extender is a relay for people who cannot reach the network directly. The miner and the desktop app run both by default, and one device can win in both roles.{online}",
        // {providers} is `noProvider` or `providers`
        roleOnline: " At the end of {day} the network's dashboard counted {providers} online there.",
        noProvider: 'no provider',
        // {count}: the providers online
        providers: { one: '{count} provider', other: '{count} providers' },
        drawQ: 'How are winners chosen, and can I check?',
        drawA: "When the epoch ends, each network operator commits the list of its eligible miners in {the} on chain, and a drand round published after it draws up to five winners per role from that list. With five entries or fewer, everyone wins. Miners in one /29 or /48 share a single entry. Each draw's census and round are public.",
        paidQ: 'How do I get paid?',
        paidA: "Winnings go to the payout wallet your miner or app already uses, in your operator's capture the flag pool, and you claim them with your pool earnings. Local law in {the} applies to what you earn and how you cash it out.{note}",
        // after two line breaks; {text} is the note itself, written by a person in this language
        note: 'Local note for {the}, reviewed <time>{day}</time>: {text}',
    },

    // the social card the hub and the country pages share
    og: {
        title: 'Earn crypto by sharing your internet in 249 countries',
        prelaunch: 'From epoch {first} · {day}',
        first: 'Epoch {epoch} · first draw ≈ {draw}',
        drawing: "Epoch {first}'s draw under way",
        // {count}: the countries with an open provider slot
        drawn: { other: 'Epoch {epoch} · {count} countries with open provider slots' },
        undrawn: 'Epoch {epoch} · {amount} α in pots',
        alt: '{kicker}: {title}. {footer}.',
    },

    // the hub's structured data (a Dataset); the country pages' WebPage takes its name from the title
    dataset: {
        name: 'URnetwork capture the flag: reward slots and pots by country',
        description: "Each epoch (one week), every network operator of Bittensor subnet 25 (UR) has five provider slots and five extender slots in every one of the 249 ISO 3166-1 countries, and this data adds every operator's up. Per country, it gives last epoch's winners and the units in each draw, the pot carried into this epoch for each role, and a newcomer's chance to win where all five slots were won. Amounts are in alpha, the subnet's token, before participants' costs.",
        coverage: 'Worldwide',
        measured: ['Provider slots won', 'Extender slots won', 'Units in the draw', 'Provider pot (alpha)', 'Extender pot (alpha)', 'Chance to win'],
    },
};
