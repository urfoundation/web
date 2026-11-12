// German: the letter on funding network capacity, 15 October 2026 (see en.js).
export default {
    introduction: {
        heading: 'Einleitung',
        paragraphs: [
            'UR (SN25) will die Open-Source-Vision von Bittensor unterstützen, indem es einen Marktplatz für private Konnektivität aufbaut: Es koordiniert unabhängige Provider, um die private Netzwerkkapazität aufzubauen, die Betreiber benötigen, um ihre Kunden zu bedienen.',
            'ur.io ist das erste kundenorientierte Beispiel; die größere Chance ist eine Infrastruktur, die von mehreren Betreibern gemeinsam genutzt wird. Letztlich hat für uns Priorität, ein starkes, zuverlässiges Netzwerk zu schaffen, das jedem Betreiber Wachstum ermöglicht, und private Netzwerke für alle zugänglich zu machen.',
            'Auf diese Weise bringen Betreiber Produkte, Kunden und Nachfrage ein und unsere unabhängigen Miner liefern Konnektivität, während UR (SN25) Anreize und Verifizierung koordiniert, damit sich nützliches Angebot entwickelt.',
            'Für UR:',
        ],
        roles: [
            '<strong>Netzbetreiber</strong>, darunter ur.io, bauen Dienste auf und bringen Kundennachfrage.',
            '<strong>Provider und Flotten</strong> stellen die Verbindungen und die Routing-Kapazität bereit, die diese Dienste nutzen.',
            '<strong>SN25</strong> setzt Anreize für das zugrunde liegende Angebot und die Nutzung der Miner und verifiziert beides.',
        ],
        closing: 'Das macht Investitionen in Kapazität zu einer Ökosystem-Strategie. Wir sollten daher stets aufbauen und reinvestieren, um den Netzwerkbedarf und die Serviceergebnisse über alle Betreiber hinweg auszuweiten.',
    },
    workingCapital: {
        heading: 'Warum Emissionen als Betriebskapital zurückbehalten?',
        paragraphs: [
            'Wir erwarten nicht, dass Netzwerkkapazität und Kundennachfrage im perfekten Gleichschritt wachsen. In Gesprächen mit Betreibern suchen diese nach Belegen für ein verlässliches Angebot, BEVOR sie auf dem Subnet starten. Nehmen Sie einen neuen VPN-Betreiber, der vielleicht schon ein Produkt und Kunden hat: Eine breitere Abdeckung oder verlässliche Verfügbarkeit in bestimmten Märkten wird entscheidend sein, um sein Wachstum zu unterstützen. UR muss die Provider, die diese Anforderungen erfüllen können, so schnell wie möglich koordinieren.',
            'SN25 nutzt daher überschüssige Emissionen, also Miner-Emissionen über das hinaus, was direkt an Provider geht, um Miner anzuschieben und die Stärke des Netzwerks zu demonstrieren und so neue Netzbetreiber zu gewinnen.',
        ],
        diagramAlt: 'Betreiber wollen Angebot, bevor die Nachfrage kommt. Kapazität wird aufgebaut, bevor ein Betreiber startet, während der Kundenverkehr später wächst. Die Network Capacity Reserve finanziert die Lücke und wird gegen verifizierte Leistung freigegeben. Betreiber starten mit bereits vorhandener Kapazität; die Reserve trägt die Kosten, bis der Verkehr aufholt, sodass frühe Kunden vom ersten Tag an vollen Service erhalten.',
        diagramLink: 'Diagramm in voller Größe ansehen ↗',
    },
    page2Aria: '{title}, Seite 2',
    reserve: {
        aria: 'Network Capacity Reserve',
        intro: 'Deshalb starten wir die „Network Capacity Reserve“, die überschüssige Emissionen nutzt, um diese Lücke zu überbrücken:',
        uses: [
            'Kapazität schon vor der Expansion eines Betreibers in Auftrag geben.',
            'Abdeckung und Zuverlässigkeit dort verbessern, wo das vorhandene Angebot nicht ausreicht.',
            'Auf steigende Nachfrage reagieren, ohne sich nur auf die Emissionen des jeweiligen Zeitraums zu verlassen.',
            'Strategisch nützliche Kapazität auch in ruhigeren Phasen verfügbar halten.',
            'Mittel gegen verifizierte Leistung freigeben, statt das gesamte Budget sofort zu verteilen.',
        ],
        paragraphs: [
            'Die <em>Network Capacity Reserve</em> schafft eine Möglichkeit, dieses Angebot vor der Nachfrage zu finanzieren. In diesem Modell sammeln sich Emissionen als Betriebskapital an und werden gegen festgelegte, verifizierte Zusagen freigegeben.',
            'Dazu starten wir ein Dashboard, das die Kapitalallokation veranschaulicht: Es zeigt die Bestände der Reserve und veröffentlichte Zuteilungen, wobei Zusagen und Zahlungen ausgewiesen werden, sobald Programme aktiv werden.',
            'Letztlich sollte jedes Programm einen klaren ROI dafür haben, wie überschüssige Kapazität gefördert wird.',
        ],
    },
    examples: {
        heading: 'Beispiele',
        items: [
            'Wenn ein neuer Betreiber bereit ist, Nutzer zu UR zu bringen, ein gedeckeltes Anreizprogramm für Provider für das von ihm benötigte Angebot einrichten. Die Zahlungen hängen von funktionierenden Routen und dauerhaftem Service ab, nicht nur von der Registrierung eines Betreibers.',
            'Wenn ur.io oder ein anderer Betreiber zusätzliche Exits in einem Zielmarkt braucht, Provider damit beauftragen, dort qualifizierende Verbindungen aufrechtzuerhalten. Der bestehende Flottenmechanismus misst die Breite routbarer Präfixe; geografische Belohnungen würden eine zusätzliche Standortverifizierung erfordern.',
            'Vorübergehende Anreize bieten, wenn die Nutzung eines Betreibers über das verfügbare Angebot hinaus steigt. Zahlungen, die speziell an Durchsatz oder ausgelieferten Datenverkehr gebunden sind, würden eine stärkere Verifizierung erfordern als die aktuellen Routing-Prüfungen.',
            'Zeitlich begrenzte Zusagen finanzieren, um nützliche Verbindungen zwischen Nachfragespitzen online zu halten, unter der Bedingung erfolgreicher Zufallsverifizierung.',
        ],
    },
    operations: {
        heading: 'Betrieb der Reserve',
        items: [
            'Die Reserve ist ein eigenes Multisig, getrennt von den Owner-Emissionen und nicht für Team- oder Betriebskosten verwendet: 5CcHGEqKK3RXeEA2sVycHQAQGrqsyhWaYu9FjGtDVN6nwMwR (SN25-UIDs 170 und 250).',
            'Ziele, Teilnahmevoraussetzungen, Messung und Dauer veröffentlichen, wenn überschüssige Miner-Belohnungen eingesetzt werden.',
            'Mittel für angenommene Zusagen reservieren und bestehende Basisbelohnungen berücksichtigen.',
            'Die Leistung verifizieren, die Berechnung der Belohnung veröffentlichen, Zahlungen über das Multisig freigeben und jeden ausgehenden Transfer offenlegen.',
            'Ungenutzte Mittel für künftigen Bedarf von Betreibern und Netzwerk verfügbar halten.',
        ],
    },
    impact: {
        heading: 'Wirkung',
        paragraphs: [
            'UR (SN25) als Netzwerk wird wertvoller, je mehr die Nachfrage von Betreibern steigt, die den Token kaufen und dauerhaft sperren, um weiterhin Zugang zum Netzwerk zu haben.',
            'Das ist der beabsichtigte Zusammenhang: <strong>mehr Bandbreitennutzung → größere erforderliche Käufe / Einlagen von NOs → mögliche Marktkäufe → mehr Nachfrage nach $SN25</strong>',
            'Die <em>Network Capacity Reserve</em> unterstützt dies direkt: Sie setzt Anreize für Provider, gezielt Abdeckung, Verfügbarkeit und Kapazität zu verbessern, und hilft uns, Betreiber zu gewinnen, die mehr Nutzer bedienen, was das Wachstum weiter beschleunigt.',
            'Wir freuen uns darauf, Neuigkeiten zu diesem Programm zu teilen.',
        ],
    },
};
