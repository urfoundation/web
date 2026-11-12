// German: the Apex (SN1) competition announcement, 28 October 2026 (see en.js).
export default {
    documentTitle: 'UR (SN25) startet offenen Wettbewerb auf Apex (SN1), um die Routing- und Provider-Matching-Algorithmen hinter seinem Datenschutznetzwerk zu optimieren',
    highlightsHeading: 'Highlights',
    highlights: [
        'UR (SN25) hat einen offenen Wettbewerb auf Apex (SN1) in Auftrag gegeben, betrieben von Macrocosmos, um die Routing- und Provider-Matching-Algorithmen zu verbessern, die über Geschwindigkeit, Zuverlässigkeit und Erreichbarkeit des UR-Netzwerks entscheiden.',
        'Der Wettbewerb zielt auf vier benannte Probleme im veröffentlichten Protokoll: die Hop-Auswahl unter URTRANSPORT1, das von UR-MULTI verwaltete Provider-Fenster, die Wiederaktivierung des Multi-Provider-Hops und des Peer-to-Peer-Stream-Upgrades sowie Matching-Metadaten in UR-FP2, die dessen Sybil-Resistenz bewahren.',
        'Alle aktuellen Algorithmen sind bereits als Open Source veröffentlicht, und UR wird anonymisierte Datensätze pro Block mit Matching-Eingaben und ausgewählten Ausgaben bereitstellen, damit Einreichungen unter realen Netzwerkbedingungen statt in einer Simulation bewertet werden können.',
        'In den Produktivbetrieb übernommene Verbesserungen kommen den über 100.000 Minern zugute, die Datenverkehr im Netzwerk transportieren, sowie den Netzbetreibern, die dort Kapazität einkaufen.',
        'Dies ist der erste Wettbewerb, der die Routing-Schicht eines produktiven Live-Netzwerks der Forschungsgemeinschaft von Bittensor vorlegt.',
    ],
    body: [
        'Die UR Foundation (UR (SN25) oder das Netzwerk) kündigt heute einen offenen Wettbewerb an, ausgerichtet auf Apex (SN1) und betrieben von Macrocosmos, um die Algorithmen zu verbessern, die den Datenverkehr durch das UR-Netzwerk routen. Der Wettbewerb öffnet das zentrale Optimierungsproblem des Netzwerks für die Forschungsgemeinschaft von Bittensor, mit dem Ziel, den gemessenen Durchsatz und die Zuverlässigkeit für die Miner, die Kapazität liefern, und für die Netzbetreiber, die sie einkaufen, zu erhöhen.',
        'UR (SN25) ist ein von Grund auf dezentrales Protokoll mit mehreren IPs und mehreren Transporten statt eines herkömmlichen Site-to-Site-Tunnels. Mehr als 100.000 Miner in über 100 Ländern halten eigene IPv4-/29- und IPv6-/48-Subnetze für ein- und ausgehenden Datenverkehr routbar, und mehr als 350.000 monatlich aktive Nutzer erreichen über sie das offene Web. Jede Übertragung unterliegt einem Vertrag, dessen Mittel treuhänderisch verwahrt werden und der nach einer von beiden Parteien bestätigten Byte-Anzahl abgeschlossen wird, und Validatoren durchlaufen unabhängig die vom Betreiber zugewiesenen Ketten von Minern, um den Transit in Echtzeit nachzuweisen.',
    ],
    problem: {
        heading: 'Das Optimierungsproblem',
        paragraphs: [
            'Routing über eine nicht vertrauenswürdige, heterogene Flotte ist ein wesentlich schwierigeres Problem als Routing über eigene Infrastruktur. Die veröffentlichte <research>Protokollforschung</research> des Netzwerks benennt die konkreten Einschränkungen. Multi-Hop-Routing läuft derzeit über TCP-Transporte durch einen zentralen Hop. UDP-Transporte, darunter HTTP/3 und DNS, sind implementiert, aber aufgrund realer Leistungsergebnisse in der aktuellen Konfiguration deaktiviert. Ein Multi-Provider-Hop mit Peer-to-Peer-Upgrade, als Stream bezeichnet, ist ebenfalls implementiert, aber deaktiviert; WebRTC, XRay und WireGuard sind als mögliche Upgrades benannt.',
            'Zwei Fälle erfordern Optimierung, und sie stehen im Zielkonflikt zueinander: wenn der nächste Hop keine öffentliche Adresse und keinen Port hat, und wenn er sie hat. Der zweite begünstigt Geschwindigkeit, eine Kombination aus beiden die Qualität. Das Netzwerk hat das Hinzufügen von Metadaten zum Matching-Algorithmus als Weg identifiziert, zwischen ihnen zu wählen, sofern die Eigenschaft erhalten bleibt, die das Matching gegen die Fälschung von Nodes resistent macht: dass die Summe der Zuverlässigkeit pro IP-Subnetz auf eins begrenzt ist.',
            'Auf der Client-Seite verwaltet UR-MULTI ein Fenster von Providern mit einem heuristischen Durchlauf auf Basis von Übertragungsschwellen statt einer Protokollanalyse und bindet den Datenverkehr an die oberste verfügbare Stufe. Die Verbesserung dieses Fensters ist die eine Änderung, die ein Endnutzer am unmittelbarsten spürt.',
        ],
    },
    page2Aria: 'Apex-Mitteilung, Seite 2',
    why: {
        heading: 'Warum Apex',
        paragraphs: [
            'Apex (SN1) ist das ursprüngliche Bittensor-Subnet, entworfen von Steffen Cruz, Mitgründer und Chief Technology Officer von Macrocosmos und zuvor Chief Technology Officer der Opentensor Foundation. Mit einem definierten Problem und einem Benchmark lagert Apex Forschung und Lösungsfindung an ein wettbewerbsorientiertes globales Netzwerk aus und eignet sich besonders für Probleme mit komplexen Landschaften und vielen voneinander abhängigen Variablen, bei denen sich ein Suchraum am besten parallel erkunden lässt.',
            'Netzwerk-Routing unter adversarialen Bedingungen ist ein solches Problem. Die Zielfunktion ist messbar, die Einschränkungen sind veröffentlicht, und der Suchraum ist so groß, dass kein einzelnes Team gut aufgestellt ist, ihn erschöpfend zu erkunden. UR (SN25) wird den Benchmark veröffentlichen, die Datensätze bereitstellen und validierte Verbesserungen unter seiner bestehenden Open-Source-Lizenz in das Produktivprotokoll übernehmen.',
        ],
    },
    steffen: {
        heading: 'Steffen Cruz, CTO, Macrocosmos, sagte:',
        quote: '„Genau dafür wurde Apex gebaut. Ein definiertes Problem, ein echtes objektives Ergebnis und ein Suchraum, der zu groß ist, als dass ein einzelnes Team ihn allein abdecken könnte. UR (SN25) legt die Routing-Schicht eines Netzwerks, das bereits erheblichen Produktivverkehr transportiert, der gesamten Community vor, und deshalb erwarten wir, dass sich die Ergebnisse in den Händen echter Nutzer messen lassen und nicht nur auf einer Rangliste.“',
    },
    brien: {
        heading: 'Brien Colwell, Core Contributor, UR (SN25), sagte:',
        quote: '„Wir haben von Anfang an jeden Algorithmus dieses Netzwerks veröffentlicht, auch die deaktivierten Teile und die Gründe für ihre Deaktivierung. Das Routing-Problem für Apex zu öffnen, ist der logische nächste Schritt, denn die Menschen, die einen Matching-Algorithmus am besten verbessern können, sind nicht unbedingt die, die ihn geschrieben haben. Alles, was den Benchmark besteht, geht in Produktion, und 100.000 Miner und jeder Nutzer hinter ihnen spüren den Unterschied.“',
    },
};
