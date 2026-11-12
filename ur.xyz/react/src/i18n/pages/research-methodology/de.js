// German copy of the research methodology (/de/research/methodology). Keys mirror
// en.js; the figures are the English's, written in German number format
// (../research-report/figures.js).
export default {
    eyebrow: 'Forschung · Methodik',
    title: 'Selbstverbessernde Forschungsschleifen',
    description: 'Wie URs Forschung das Netzwerk und ihre eigenen Messungen verbessert: drei Schleifen – Labor, offener Wettbewerb, freiwillige Feldknoten – mit einer Disziplin.',
    figure: 'Drei verschachtelte Forschungsschleifen: das Labor innen, der Wettbewerb darum, das Feld ganz außen',
    metaNote: 'Die Laborzahlen stammen aus dem Forschungsbericht August–Oktober 2026.',
    lede: 'UR verbessert sein Netzwerk mit drei verschachtelten Forschungsschleifen, die eine Disziplin teilen. Das Labor misst jede Änderung, ein offener Wettbewerb läuft wöchentlich, und freiwillige Feldknoten berichten jedes Quartal. Jede Schleife verbessert das Netzwerk und zugleich, wie die nächste Runde gemessen wird.',
    indexAria: 'Die drei Schleifen',
    loops: {
        lab: { name: 'Labor', instrument: 'PERFVAR', cadence: 'bei jeder Änderung' },
        competition: { name: 'Wettbewerb', instrument: 'Apex SN1', cadence: 'wöchentlich' },
        field: { name: 'Feld', instrument: 'Friends of the Network', cadence: 'vierteljährlich' },
    },
    discipline: {
        eyebrow: 'Die Disziplin',
        title: 'Eine Änderung zählt nur, wenn sie das gemessene Rauschen übertrifft',
        rules: [
            {
                title: 'Mit einer eingefrorenen Baseline vergleichen',
                body: 'Jede Änderung läuft gegen eine feste Baseline, ein Faktor nach dem anderen, mit dem alten Code als Kontrolle.',
            },
            {
                title: 'Zuerst das Instrument messen',
                body: 'Bevor sie einem Unterschied traut, misst jede Schleife das Rauschen ihres eigenen Instruments. Eine Änderung muss dieses Rauschen in frischen, verschränkten Läufen übertreffen.',
            },
            {
                title: 'Jeden Versuch behalten',
                body: 'Jeder Versuch kommt ins Protokoll, Fehlschläge eingeschlossen. Der Bericht August–Oktober behielt seine gemischten und verworfenen Ergebnisse.',
            },
        ],
    },
    outputs: {
        eyebrow: 'Zwei Ergebnisse',
        title: 'Ein besseres Netzwerk und ein besseres Instrument',
        body: 'Jede Schleife durchläuft dieselben fünf Stufen und hat zwei Ergebnisse. Wenn eine behaltene Änderung zur neuen Baseline wird, verbessert sich das Netzwerk. Wenn das, was die Schleife über ihre eigenen Messungen lernt, verändert, wie die nächste Änderung beurteilt wird, verbessert sich das Instrument.',
        figure: 'Fünf Stufen, Baseline, Änderung, Messen, Urteilen und Festhalten, mit zwei Rückwegen: das Ergebnis von Festhalten zu Baseline, der Prozess von Festhalten zu Messen.',
        stages: [
            {
                name: 'Baseline',
                lines: ['Eingefrorene Baseline', 'und ihr Rauschband'],
            },
            {
                name: 'Änderung',
                lines: ['Immer nur ein Faktor,', 'Kontrolle: alter Code'],
            },
            {
                name: 'Messen',
                lines: ['Frische Läufe mit dem', 'Schleifeninstrument'],
            },
            {
                name: 'Urteilen',
                lines: ['Rauschen schlagen oder', 'im Protokoll bleiben'],
            },
            {
                name: 'Festhalten',
                lines: ['Jeder Versuch bleibt,', 'auch Fehlschläge'],
            },
        ],
        outcome: 'Eine behaltene Änderung wird zur neuen Baseline',
        process: 'Was die Schleife lernt, schärft das Instrument',
        railKeys: { process: 'PROZESS', outcome: 'ERGEBNIS' },
        rails: { outcome: 'Ergebnis', process: 'Prozess' },
        example: {
            tag: 'Gegen sich selbst getestet · 12. September 2026',
            body: 'Ein A/A-Test ließ einen Build gegen sich selbst laufen. Die alte Fünf-Läufe-Regel hätte ihn in 15 von 17 Zellen für schlechter erklärt, also wurden Urteile nach fünf Läufen abgeschafft. Ein Effekt von 10% braucht jetzt 33 Läufe pro Arm.',
            source: 'PERFVAR-Messprotokoll (privat)',
        },
    },
    agents: {
        eyebrow: 'Agenten in der Schleife',
        title: 'Agenten erledigen einen Großteil der Arbeit',
        body: 'Agenten betreiben die Schleifen zusammen mit dem Team. Jeder Fix hinterlässt einen deterministischen Test, sodass eine Regression nicht unbemerkt zurückkehren kann.',
        roles: [
            {
                name: 'Triage',
                body: 'Ein Agent mit geringem Aufwand fährt Testkampagnen und sortiert ihre Fehlschläge.',
            },
            {
                name: 'Ursachenanalyse',
                body: 'Ein Agent mit maximalem Aufwand findet die Ursache, behebt sie und ergänzt deterministische Abdeckung. Drei fokussierte Durchgänge, dann ein sauberer Gesamtlauf.',
            },
            {
                name: 'Review',
                body: 'Zwei unabhängige Reviewer-Modelle müssen beide einen Gewinner des Wettbewerbs freigeben, bevor er übernommen wird.',
            },
        ],
    },
    sections: {
        eyebrow: 'Die Schleifen',
        title: 'Drei Schleifen, drei Takte',
        loops: {
            lab: {
                tag: 'Schleife 1 · Das Labor · bei jeder Änderung',
                title: 'Jede Änderung, auf synthetischen Netzen mit festem Seed',
                body: 'PERFVAR treibt den echten Connect-Stack, von TUN und Provider-NAT bis zu jedem produktiven Carrier, durch synthetische Netze mit festem Seed. Ein Fehler wiederholt sich am selben Tick, sodass ein Fix gegen den alten Code bewiesen werden kann. LOWBAR, MEMSTEADY und eine Browsing-Workload mit 100 Seiten übertragen dieselben Regeln auf schwache Verbindungen, Speicherbudgets von Telefonen und echte Seiten.',
                facts: [
                    { v: '39', l: 'gemessene Änderungen, 24. Aug. – 24. Okt. 2026' },
                    { v: '≈4,73×', l: 'schneller mit adaptiven Fenstern, in ihrem Modell' },
                    { v: '2,81×', l: 'Paketpfad: die Pakete eines Providers als eine Gruppe gesendet' },
                    { v: '−26,4%', l: 'Laufzeitspeicher in einer exakten Wiederholung' },
                ],
                links: ['Den Bericht August–Oktober 2026 lesen', 'PERFVAR', 'LOWBAR', 'MEMSTEADY'],
            },
            competition: {
                tag: 'Schleife 2 · Der Wettbewerb · wöchentlich',
                title: 'Der Gewinner jeder Woche wird zur Baseline, die alle schlagen müssen',
                body: 'Der Sim-Latenz-Algo-Wettbewerb auf Apex (Bittensor SN1) öffnet Routing und Matching für externe Forschende. Ein fester Simulator bewertet jede Einreichung auf einer deterministischen Flotte gegen eine eingefrorene Kontrolle aus neun Läufen, und keine Einreichung kann den Bewerter verändern. Ein freigegebener Gewinner wird zur Baseline der nächsten Epoche, unter einer Marge, die nie schwächer wird.',
                facts: [
                    { v: '6', l: 'wöchentliche Epochen ab dem {date}' },
                    { v: '26,9%', l: 'Marge, vorab aus Kalibrierungsläufen eingefroren' },
                    { v: 'p ≤ 0,05', l: 'ein einseitiger Welch-Test muss zustimmen' },
                    { v: '2', l: 'unabhängige Reviewer-Modelle müssen beide zustimmen' },
                ],
                links: [
                    'Am Wettbewerb auf Apex teilnehmen',
                    'Wie Einreichungen bewertet werden',
                ],
            },
            field: {
                tag: 'Schleife 3 · Das Feld · vierteljährlich',
                title: 'Das Netzwerk dort messen, wo Menschen es tatsächlich nutzen',
                body: 'Friends of the Network bringt kleine Forschungsknoten an die eigenen Anschlüsse von Freiwilligen: WLAN zu Hause, Ethernet, 4G/5G-Mobilfunk und Satellit. Jeder Knoten führt PERFVAR-Testbuilds des Connect-Stacks aus und berichtet an einen zentralen Forschungs-Edge, sodass Messungen von echten Verbindungen zurück ins Labor fließen.',
                facts: [
                    { v: '10. Nov.', l: 'erste Hosts per E-Mail benachrichtigt' },
                    { v: '15. Nov.', l: 'erste Knoten werden ausgeliefert' },
                    { v: 'Quartalsweise', l: 'Ergebnisse veröffentlicht auf ur.xyz/research' },
                ],
                links: ['Friend of the Network werden'],
            },
        },
    },
    publication: {
        eyebrow: 'Veröffentlichung',
        title: 'Ergebnisse jedes Quartal, Verworfenes eingeschlossen',
        body: 'Ergebnisse erscheinen mindestens vierteljährlich hier, auf ur.xyz/research. Der Bericht August–Oktober 2026 stellte alle 39 gemessenen Änderungen auf eine Zeitleiste, einschließlich der 4 gemischten und 3 verworfenen.',
        cta: 'Den Bericht August–Oktober 2026 lesen',
    },
};
