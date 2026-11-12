// /mainnet in German: the translation of en.js beside it (the page's own copy). Same keys as en.js; after
// changing a translation, run `node tests/i18n-staleness.mjs --unit mainnet --accept de <key> ...` from react/.
export default {
    meta: {
        title: 'Zeitleiste des SN25-Mainnet-Starts | UR',
        description: 'Der Start von SN25 im Mainnet nach Auszahlungsepochen: Version 1 ab dem 8. Oktober, dann Settlement v2 ab Epoche 4 (30. Oktober), mit den ersten Claims am 8. November.',
        breadcrumb: 'Mainnet',
    },

    intro: {
        eyebrow: 'SN25 · Bittensor-Mainnet',
        title: 'Zeitleiste des Mainnet-Starts',
        lede: 'Das Subnet von UR, SN25, ging am 8. Oktober 2026 im Bittensor-Mainnet live. Diese Zeitleiste verfolgt den Start nach Auszahlungsepochen, von den Verträgen der Version 1 bis zum ersten Claim unter Settlement v2.',
        note: 'Meilensteine mit der Markierung {scheduled} oder {planned} stehen noch bevor, und ihre Termine können sich ändern. Alle Zeiten sind in UTC, und eine mit ≈ markierte Zeit ist ungefähr: Die meisten sind aus Blocknummern hochgerechnet.',
    },

    settlement: {
        eyebrow: 'Abrechnung',
        title: 'Version 1, dann Settlement v2',
        paragraphs: [
            'SN25 bezahlt Provider nach Auszahlungsepochen. Das sind die Abrechnungsepochen von UR, nicht das 72-minütige Tempo der Chain: Epoche 0 dauerte einen Tag, und jede spätere Epoche dauert 7 Tage (50,400 Blöcke).',
            'Version 1 startete am 8. Oktober und rechnet die Epochen 1 bis 3 ab. Sie bezahlt nur die Provider, die der Validator gemessen hat, und diese Messung ist auf etwa 1,500 Provider pro Epoche begrenzt, sodass die meisten Miner keinen Anteil aus Version 1 erhalten.',
            'Settlement v2 zahlt nach Nutzung und hebt diese Grenze auf. Es sollte ab Epoche 3 übernehmen, doch sein Pool wurde nicht registriert, bevor Epoche 3 am 23. Oktober begann, sodass Version 1 auch Epoche 3 abrechnet. Sein Pool wurde am 29. Oktober registriert, und Settlement v2 hat seit Epoche 4, die am 30. Oktober gegen 18:25 UTC begann, jede Epoche bezahlt. Die erste v2-Epoche endete um den 6. November, und ihre Claims öffneten am 8. November, nachdem ihr Root festgeschrieben und ihre Anfechtungsfrist abgelaufen war.',
        ],
        epochsAria: 'Auszahlungsepochen',
    },

    milestones: {
        eyebrow: 'Zeitleiste',
        title: 'Meilensteine',
        fine: 'Die Zeit eines terminierten oder geplanten Meilensteins ist eine Hochrechnung, aus seiner Blocknummer bei 12 Sekunden pro Block oder aus dem Plan, und ist mit ≈ markiert, sofern sie nicht auf eine genaue Zeit festgelegt wurde. Eine hochgerechnete Zeit verschiebt sich etwas, wenn Blöcke schneller oder langsamer laufen. Ab Epoche 1 wird jede Epoche innerhalb von 120 Blöcken nach ihrem Ende abgeschlossen, ihr Auszahlungs-Root ist innerhalb von 1,200 Blöcken nach ihrem Ende fällig, und ihre Claims öffnen 14,400 Blöcke (etwa zwei Tage) danach. Terminierte und geplante Meilensteine können sich ändern.',
        updated: 'Aktualisiert am {date}.',
    },

    noticeDate: 'Mitteilung · {date}',

    labels: {
        status: { done: 'Erledigt', in_progress: 'Läuft', scheduled: 'Terminiert', planned: 'Geplant' },
        settlement: { v1: 'Version 1', v2: 'Settlement v2' },
        view: { transaction: 'Transaktion ansehen', contract: 'Vertrag ansehen', block: 'Block ansehen' },
        sourceAria: '{action}: {label}',
        sourcesAria: 'Quellen zu {title}',
        transactionsAria: 'Transaktionen zu {title}',
        transactions: { one: '{count} Transaktion', other: '{count} Transaktionen' },
        epoch: 'Epoche {number}',
        beforeLaunch: 'Vor dem Start',
        afterEpoch: 'Nach Epoche {number}',
        epochBlocks: 'Blöcke {start} → {end} · {blocks}, {length}',
        blocks: { one: '{count} Block', other: '{count} Blöcke' },
        days: { one: '{count} Tag', other: '{count} Tage' },
        aboutDays: { one: 'etwa {count} Tag', other: 'etwa {count} Tage' },
        arrow: '→',
    },

    dates: {
        weekdays: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
        months: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'],
        monthsLong: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        day: '{weekday}, {date}. {month}',
        monthDay: '{date}. {month}',
        sameMonth: '{start}.–{end}. {month}',
        twoMonths: '{start} – {end}',
        long: '{date}. {month} {year}',
    },

    summary: {
        title: 'Auf einen Blick',
        figureAria: 'Auszahlungsepochen und wichtige Meilensteine',
        epochShort: 'E{number}',
        afterShort: 'Danach',
        from: 'ab {days}',
        settledBy: { v1: 'abgerechnet mit Version 1', v2: 'abgerechnet mit Settlement v2' },
        mark: '{number}. {title}, {when}, {status}',
        span: '{title}, {when}, {status}',
        now: 'Jetzt',
        nowAt: '{time}',
        nowIn: '{time}, {percent} % von Epoche {number} vergangen',
        bandsAria: 'Bänder',
        markersAria: 'Markierungen',
        either: '{first} oder {second}',
        lower: { done: 'erledigt', in_progress: 'läuft', scheduled: 'terminiert', planned: 'geplant' },
        legendSpan: '{title}, {days}',
        datesAria: 'Wichtige Termine',
    },
};
