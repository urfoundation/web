// /reserve sections 02 and 03 in German: the translation of en.js beside it (same keys, the
// lists in the order of data/reserve.js). "Indicative" is "In Aussicht": expected, not yet
// approved, as the section's paragraph says.
export default {
    types: {
        kicker: '02 / Programmtypen',
        title: 'Wofür die Reserve zahlt.',
        sub: 'Programme kaufen bei Providern Dienstleistungen ein, keine Ausrüstung.',
        verifiedBy: 'Verifiziert durch',
        paidAs: 'Vergütung',
        list: [
            {
                tag: 'Typ 01',
                title: 'Netzabdeckung',
                summary: 'Schafft Kapazität dort, wo die Nachfrage eines Betreibers das Angebot übersteigt: mehr Exit-Standorte und Routen an den Orten, an denen Kunden sie brauchen.',
                verifiedBy: 'Verifizierer an mehreren Beobachtungspunkten, mit Überlappungs- und Routing-Prüfungen',
                paidAs: 'Wöchentlich, pro verifizierter Abdeckungseinheit',
            },
            {
                tag: 'Typ 02',
                title: 'Routenzuverlässigkeit',
                summary: 'Erhöht die Erfolgsquoten und senkt die Latenz auf Routen, die Betreiber bereits nutzen, sodass Kunden weniger fehlgeschlagene Sitzungen erleben.',
                verifiedBy: 'Zufällige Testverbindungen, gemessen an vereinbarten Schwellenwerten für Verfügbarkeit und Latenz',
                paidAs: 'Boni für Provider, die die Schwellenwerte über den Leistungszeitraum einhalten',
            },
            {
                tag: 'Typ 03',
                title: 'Betreiber-Onboarding',
                summary: 'Finanziert Provider-Kapazität für einen neuen Netzbetreiber, damit ein zweites Produkt auf gemeinsam genutztem Angebot starten kann.',
                verifiedBy: 'Abnahme funktionierender Routen und dauerhafter Verfügbarkeit',
                paidAs: 'Meilensteinzahlungen an die Provider, die den Dienst erbringen, nie ein Registrierungszuschuss an den Betreiber',
            },
        ],
    },

    statuses: {
        preparing: 'In Vorbereitung',
        indicative: 'In Aussicht',
        active: 'Aktiv',
        complete: 'Abgeschlossen',
    },

    counts: {
        byStatus: {
            preparing: { one: '{count} in Vorbereitung', other: '{count} in Vorbereitung' },
            indicative: { one: '{count} in Aussicht', other: '{count} in Aussicht' },
        },
        noneActive: 'keines aktiv',
        active: { one: '{count} aktiv', other: '{count} aktiv' },
        committedShare: {
            one: '{share} des Zuflusses über 12 Monate · {count} aktives Programm',
            other: '{share} des Zuflusses über 12 Monate · {count} aktive Programme',
        },
    },

    programs: {
        kicker: '03 / Programme',
        title: 'Aktuelle Programme.',
        sub: 'Programme werden hier veröffentlicht, bevor sie bezahlt werden. Bei einem Programm in Vorbereitung werden die Bedingungen ausgearbeitet; ein Programm in Aussicht wird erwartet, ist aber noch nicht genehmigt. Aktiv ist ein Programm erst, wenn seine Bedingungen veröffentlicht sind und Provider sie angenommen haben; mit ihm erscheinen dann sein Umfang und seine Zahlungen.',
        noneActiveYet: 'Noch ist keines aktiv.',
        filterAria: 'Programme nach Status filtern',
        label: 'Programme',
        all: 'Alle',
        committed: '{amount} zugesagt',
        nothingCommitted: 'Noch nichts zugesagt',
        head: {
            program: 'Programm',
            type: 'Typ',
            pays: 'Vergütung',
            size: 'Umfang',
            paid: 'Bezahlt',
            status: 'Status',
        },
        termsTbd: 'Bedingungen folgen',
        ceiling: 'Obergrenze {amount}',
        paidShare: '{share} bezahlt',
        paidAria: '{paid} α bezahlt, bei einer Obergrenze von {ceiling} α',
        empty: 'Kein Programm hat diesen Status.',
        list: [
            {
                title: 'Regionale Vorinstallation',
                summary: 'Partner, die die Präsenz des Netzwerks in bestimmten Regionen ausbauen werden.',
            },
            {
                title: 'Zusätzliche Exit-Abdeckung für einen bestehenden Betreiber',
                summary: 'Neue anrechenbare Exit-Standorte, die über einen festen Leistungszeitraum aufrechterhalten werden.',
                payRule: 'bezahlt pro verifiziertem Exit-Tag',
            },
            {
                title: 'Zuverlässigkeit auf bestehenden Betreiber-Routen',
                summary: 'Höhere Erfolgsquote der Routen über eine feste Kohorte vergleichbarer Testverbindungen.',
                payRule: 'Schwellenwert-Boni',
            },
            {
                title: 'Provider-Kapazität für einen zweiten Betreiber',
                summary: 'Funktionierende, verifizierte Provider-Verbindungen für einen Betreiber, der neu im Netzwerk ist.',
                payRule: 'Meilensteinzahlungen',
            },
        ],
    },
};
