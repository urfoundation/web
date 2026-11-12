// /mainnet in German: the translation of en.js beside it (the notices, the box at the top and the epochs, from
// data/mainnet.js). Same keys as en.js; after changing a translation, run
// `node tests/i18n-staleness.mjs --unit mainnet/data --accept de <key> ...` from react/.
export default {
    notices: {
        'notice-extender-relay-share': {
            title: 'Extender erhalten ihren Anteil nur bei Verträgen, die sie weiterleiten können. Providern auf der Adresse eines Extenders wird ihre Nutzung voll angerechnet.',
            paragraphs: [
                'Ab dem Server-Release des Netzbetreibers vom 12. November ist ein Extender nur dann einer der Hops eines Vertrags und erhält seinen Anteil an dessen Nutzung, wenn er den Vertrag weitergeleitet haben kann. Das ist die Regel, die der Subnet-Eigentümer am 11. November festgelegt hat: Ein Vertrag, der über einen Extender kommt, zählt den Extender als einen seiner n Hops, denen jeweils 1/n der Nutzung angerechnet wird.',
                'Der Netzbetreiber zählt eine Verbindung als weitergeleitet, wenn sie von der Adresse eines Extenders kommt. Drei Arten von Verbindungen kommen von dieser Adresse, ohne weitergeleitet zu sein, und machen den Extender nicht mehr zu einem Hop: die eigene Verbindung des Extender-Hosts, andere Geräte aus dem eigenen Netzwerk des Extenders, die seine Adresse teilen, und Provider anderer Netzwerke, die seine Adresse teilen, während sie öffentlich als Provider aktiv sind, da sich ein öffentlicher Provider immer direkt mit der Plattform verbindet.',
                'Einem Provider eines anderen Netzwerks auf der Adresse eines Extenders wird also die gesamte Nutzung seiner Verträge angerechnet, während bisher dem Netzwerk des Extenders ein Anteil davon angerechnet wurde, meist die Hälfte. Ebenso einem Provider, der ein Gerät bedient, das sich von der Adresse eines Extenders aus dem eigenen Netzwerk des Geräts verbindet, während bisher dem eigenen Netzwerk des Geräts ein Anteil angerechnet wurde. Innerhalb eines Netzwerks wird den Providern einer Flotte auf der Adresse ihres eigenen Extenders die Nutzung angerechnet, die sie bedienen, und die Summe des Netzwerks bleibt unverändert. Die eigenen Verträge eines Extender-Hosts bleiben unverändert.',
                'Eine Art der Weiterleitung zählt jetzt, die bisher nicht zählte: eine Verbindung von einer anderen Adresse aus dem IPv6-/64 eines Extenders. Hosts senden üblicherweise von einer temporären Adresse ihres /64 statt von der, mit der sie aktiviert wurden, sodass Weiterleitungen eines Extenders von einer solchen Adresse ihm nichts einbrachten. Bei diesen Verträgen ist der Extender jetzt einer der Hops, neben dem Provider.',
                'SN25-Pool-Belohnungen werden weiterhin nach abgeschlossener Nutzung aufgeteilt, und die Provider-Subvention des Netzbetreibers, die für Verkehr seit dem Stichtag 6. Oktober nur für die wöchentlichen Punkte zählt, die er vergibt, folgt denselben Hops. Verträge, die vor dem Release erstellt wurden, behalten ihre Hops. Du musst nichts tun.',
            ],
            link: 'Vollständige Mitteilung lesen',
        },
        'notice-capture-the-flag': {
            title: 'Capture the Flag startet mit Epoche 8: zehn Slots in jedem Land, neben dem Provider-Pool.',
            paragraphs: [
                'Ab Epoche 8, die mit Block 9,600,028 am 27. November gegen 18:25 UTC beginnt, erhält jeder Netzbetreiber neben seinem Provider-Pool einen zweiten SN25-Pool: Capture the Flag. Der Provider-Pool zahlt für Nutzung, Capture the Flag für die Präsenz in einem Land. Jedes der 249 Länder nach ISO 3166-1 hat pro Epoche (eine Woche) zehn Slots, fünf für Provider und fünf für Extender, und jeder Slot ist gleich viel wert: die neue Finanzierung des Pools für die Epoche, geteilt durch 2,490.',
                'Ein Provider oder Extender nimmt an der Auslosung seines Landes teil, wenn er mindestens die Hälfte der Epoche lang online war, dabei die Prüfungen des Netzbetreibers bestand und sich in diesem Land befand, und an ihrem Ende aktiv ist. Der Betreiber schreibt die Teilnehmerliste on-chain fest, und eine danach veröffentlichte drand-Runde lost bis zu fünf Gewinner pro Land und Rolle aus. Miner in demselben /29-Adressblock (IPv4) oder /48-Adressblock (IPv6) zählen zusammen als ein Teilnehmer. Bei fünf Teilnehmern oder weniger gewinnt jeder einen Slot; bei mehr beträgt die Chance jedes Teilnehmers 5 geteilt durch die Zahl der Teilnehmer.',
                'Ein Slot ohne Gewinner wird in den Topf seines Landes für diese Rolle übertragen. Jeder Gewinner erhält seinen eigenen Slot und ein Fünftel dieses Topfes, sodass ein Miner, der allein in einem Land ist, für jede Epoche, die er bleibt, ein Fünftel des Verbliebenen erhält.',
                'Ab Epoche 8 erhält der Provider-Pool 9/10 des Anteils der Provider an der Emission statt des gesamten Anteils. In Epoche 4 betrug dieser Anteil 1,195.84 α; in diesem Maßstab erhielte der Provider-Pool 1,076.26 α und Capture the Flag 119.58 α. Sobald Top-Level-Flotten gewichtet werden, erhält der Provider-Pool 4/10. Diese Zahlen beziehen sich auf den Maßstab von Epoche 4 und sind keine Prognose. Belohnungen werden in Alpha ausgezahlt, dessen Wert sich ändert und fallen kann, und was ein Miner erhält, hängt von seiner Verfügbarkeit ab, davon, wie viele andere in seinem Land die Bedingungen erfüllen, und von der Emission des Netzwerks.',
                'Gewinner erhalten ihre Auszahlung auf die Auszahlungs-Wallet, die der Provider-Pool bereits nutzt, du musst also nichts Neues signieren. Die Claims von Capture the Flag für Epoche 8 öffnen um den 7. Dezember, zusammen mit den Pool-Claims dieser Epoche, im selben Einlöse-Ablauf. Der Pool wird vor dem Start von Epoche 8 über den 72-Stunden-Timelock registriert, und die Meilensteine unten nennen jeden Schritt. Du musst nichts tun.',
            ],
            link: 'Vollständige Mitteilung lesen',
        },
        'notice-pro-grant-cycle': {
            title: 'Pro-Daten wechseln auf den eigenen Zyklus jedes Netzwerks. SN25-Belohnungen werden wie bisher gezählt.',
            paragraphs: [
                'Mit dem Server-Release des Netzbetreibers vom 11. November erhält ein Pro-Netzwerk sein volles monatliches Datenvolumen in seinem eigenen Monatszyklus, gezählt ab dem Tag, an dem sein Abonnement begann oder zuletzt verlängert wurde, statt am 1. des Monats. Die Zuteilung jedes Zyklus trägt den Anteil dieses Zyklus an den Einnahmen des Abonnements, und eine Zahlung fügt kein separates Guthaben von 600 GiB mehr hinzu.',
                'SN25-Pool-Belohnungen werden wie bisher gezählt. Der Pool wird nach abgeschlossener Nutzung aufgeteilt, und Abonnementzahlungen fließen nicht in ihn ein.',
                'Was sich ändert, sind die Abonnementeinnahmen, die die Provider-Subvention des Netzbetreibers zählt; für Verkehr seit dem Stichtag 6. Oktober zahlt sie kein USDC aus und zählt nur für die wöchentlichen Punkte, die der Netzbetreiber vergibt. Die Subvention zählt Einnahmen über die Guthaben, die abgerechneten Verkehr finanzieren. Bisher konnten die Einnahmen eines bezahlten Zeitraums doppelt zählen, voll über sein Guthaben von 600 GiB und noch einmal als Anteil über die monatliche Zuteilung, und ein lange laufendes Abonnement über Google Play zählte nur mit einem Anteil, verteilt über die Monate seit seinem Beginn. Ab dem Release zählen die Einnahmen jedes Zeitraums einmal, über seine Zyklus-Zuteilungen.',
                'Die Subvention zählt also weniger, wo Einnahmen doppelt zählten, etwa im ersten Monat eines neuen Abonnements, und mehr bei lange laufenden Abonnements über Google Play. Ihr Timing folgt dem eigenen Zyklus jedes Netzwerks statt dem 1. des Monats. Eine Zahlung, die während eines laufenden Zyklus gutgeschrieben wird, etwa für ein zweites Abonnement, fügt ihre Einnahmen den folgenden Zyklen hinzu, und der Teil, der sich mit dem laufenden Zyklus überschneidet, wird nicht gezählt.',
                'Nichts, was vor dem Release zugeteilt wurde, ändert sich. Ein Pro-Netzwerk, das die Zuteilung vom 1. November hat, erhält seine erste Zyklus-Zuteilung am 1. Dezember um 00:00 UTC, wenn der Monat dieser Zuteilung endet. Kunden zahlen dasselbe, und du musst nichts tun.',
            ],
            link: 'Vollständige Mitteilung lesen',
        },
        notice: {
            title: 'Auszahlung für Epoche 3 verzögert. Die Mittel sind sicher.',
            paragraphs: [
                'Der Auszahlungs-Root von Epoche 3 wurde am 30. Oktober nicht innerhalb seines Fensters festgeschrieben, weil ein Serverschritt im Mainnet-Maßstab eine Zeitüberschreitung hatte. Dieser Schritt ist inzwischen korrigiert. Epoche 1 hatte keine auszahlbare Arbeit, daher wurde ihre Finanzierung nach der Missed-Commit-Regel des Protokolls übertragen.',
                'Die Finanzierung beider Epochen liegt sicher im v1-Abrechnungstresor: 3,482.26 α für Epoche 1 und 4,132.72 α für Epoche 3. Übertragene Finanzierung verfällt nicht.',
                'Am Ende von Epoche 4 (um den 6. November, 18:25 UTC) bringt ein Recovery-Root diese Mittel in den v2-Tresor. Sie werden mit Epoche 5 ausgezahlt, wobei die Mittel von Epoche 3 an die Provider gehen, die die Arbeit von Epoche 3 geleistet haben. Claims werden ab etwa dem 15. November erwartet. Epoche 4 ist nicht betroffen, und du musst nichts tun.',
                'Update, 6. November: Der Recovery-Root wurde in Block 9,449,041 festgeschrieben, und die Mittel erreichen den v2-Tresor nach seiner 48-stündigen Anfechtungsfrist, um den 8. November. Änderungen am v2-Abrechnungsvertrag unterliegen jetzt einer Wartezeit von 72 Stunden in einem öffentlichen Timelock, daher wird die Aufnahme der Mittel in Epoche 5 bis zum 10. November eingeplant. Der Zeitplan oben bleibt unverändert.',
                'Update, 11. November: Die zurückgewonnenen Mittel erreichten den v2-Tresor am 8. November um 18:30 UTC. Ihre Aufnahme in die Auszahlung von Epoche 5 wurde nicht bis zum 10. November, 18:25 UTC, eingeplant, und Änderungen am v2-Abrechnungsvertrag warten 72 Stunden, daher werden sie nicht mit Epoche 5 ausgezahlt. Sie bleiben im v2-Tresor, bis sie der Auszahlung einer späteren Epoche hinzugefügt werden, und diese Mitteilung wird aktualisiert, sobald das eingeplant ist. Die reguläre Auszahlung von Epoche 5 ist nicht betroffen.',
            ],
            link: 'Vollständige Mitteilung lesen',
        },
    },

    actions: {
        headline: 'Das Mainnet ist live!',
        title: 'Was Miner tun müssen',
        steps: [
            {
                title: 'Installiere den neuen Miner.',
                detail: 'Seit dem 28. Oktober werden als modern verifizierte Provider in den Stufen „Qualität“ und „Geschwindigkeit“ zuerst ausgewählt, daher wird der alte Miner nachrangig behandelt.',
                link: 'Miner-Leitfaden: Installation',
            },
            {
                title: 'Registriere deine Bittensor-Wallet im neuen Miner.',
                detail: 'Deine Belohnungen sind mit der Wallet verknüpft, die du registrierst.',
                link: 'Miner-Leitfaden: Einrichtung',
            },
            {
                title: 'Settlement v2 zahlt ab Epoche 4 jede Epoche.',
                detail: 'Settlement v2 begann mit Epoche 4, ab etwa dem 30. Oktober, 18:25 UTC, daher gilt die Obergrenze der Version 1 von 1,500 bezahlten Minern pro Epoche nicht mehr. Seine ersten Claims öffneten am 8. November um 19:10 UTC. Die Finanzierung von Epoche 3 ist zurückgewonnen, wie die Mitteilung zu Epoche 3 oben erklärt.',
            },
        ],
        closing: 'Mit aktivem Settlement v2 ist das Subnet darauf ausgelegt, sich selbst zu betreiben und auf Millionen von Minern zu skalieren. Neue Miner können über {link1} ohne jede Bittensor-Erfahrung an Bittensor teilnehmen.',
        closingLinks: [
            'die Apps',
        ],
    },

    epochs: {
        0: 'Bootstrap, kein Auszahlungs-Root',
        1: 'Die erste Auszahlungsepoche',
        2: 'Version 1',
        3: 'Version 1: Der v2-Pool wurde nicht rechtzeitig registriert',
        4: 'Die erste Epoche mit Settlement v2',
        5: 'Der erste Abschluss und die ersten Claims mit Settlement v2',
        6: 'Ihre Nutzung bepreist die erste Nachfrage-Einlage',
        7: 'Die erste Epoche mit bepreisten Nachfrage-Einlagen',
    },

    before: {
        title: 'Vor dem Start',
    },
};
