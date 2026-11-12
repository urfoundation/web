// /build in German: the translation of en.js beside it (same keys).
// The page names itself as the site dictionaries do: "Auf UR entwickeln" (footer.buildOnUr), eyebrow "Entwickeln" (nav.build).
// Text in capitals stays in capitals; "01 /", "02 /" … stay as they are.
export default {
    meta: {
        title: 'Auf UR entwickeln | Chancen für Netzbetreiber',
        description: 'Entwickle als Netzbetreiber Produkte auf UR: mit gemeinsam genutzter Kapazität aus Privatanschlüssen, gemessener Dienstqualität und der Anreizschicht von SN25.',
        breadcrumb: 'Auf UR entwickeln',
    },

    hero: {
        title: 'Auf UR entwickeln',
        eyebrow: 'Entwickeln',
        intro: 'Starte neue Produkte auf dem Datenschutznetzwerk von UR, das über Privatanschlüsse läuft, oder migriere bestehende dorthin. Netzbetreiber verantworten das Kundenerlebnis und bringen die Nachfrage mit; UR stellt die Infrastruktur bereit. UR (SN25) dehnt die Koordination des Netzwerks und seine Anreize auf Bittensor aus.',
        proof: {
            providers: 'Provider',
            countries: 'Länder',
            users: 'monatliche Nutzer von URnetwork',
        },
        quiet: 'Das Netzwerk ist live. Sein nächstes Produkt gibt es vielleicht noch nicht.',
        kicker: 'Chancen für Netzbetreiber',
        v10: {
            eyebrow: 'Die Chance',
            heading: ['Bring das Produkt mit.', 'Entwickle auf dem Subnet.'],
            intro: 'Ein Netzbetreiber macht aus Kundennachfrage ein Produkt, das auf UR läuft. Der Betreiber verantwortet das Erlebnis und die Geschäftsbeziehung; SN25 liefert darunter gemessenes Routing über Privatanschlüsse und den Anreizmarkt.',
        },
        v11: {
            eyebrow: 'Für Entwickler',
            heading: ['Bring das Produkt mit.', 'Entwickle auf dem Netzwerk.'],
            intro: 'Entwickle ein Kundenprodukt auf dem gemeinsam genutzten Netzwerk von UR, das über Privatanschlüsse läuft. Erlebnis, Nutzer und Geschäftsmodell gehören dir; SN25 koordiniert darunter den Zugang, die Messung der Dienstqualität und die Anreize.',
        },
        // rendered as "100K+ NETZWERK-PROVIDER", "100+ LÄNDER", "LIVE NETZWERKINFRASTRUKTUR"
        proofV11: {
            providers: 'NETZWERK-PROVIDER',
            countries: 'LÄNDER',
            live: 'LIVE',
            infrastructure: 'NETZWERKINFRASTRUKTUR',
        },
        proofAria: 'Reichweite des UR-Netzwerks',
        bring: {
            label: 'DU BRINGST MIT',
            title: 'Produkt, Kunden und Vertrieb',
            body: 'Marke, Oberfläche, Identität, Rechnungsstellung, Richtlinien, Support und einen sinnvollen Grund für Netzwerknachfrage.',
        },
        provides: {
            label: 'DAS SUBNET LIEFERT',
            title: 'Angebot, Messung und Anreize',
            body: '100K+ Provider mit Privatanschluss in 100+ Ländern, Validatoren, Miner-UIDs und die Abrechnung über SN25.',
        },
    },

    section: {
        v12: { number: 'Netzbetreiber-Modell', title: 'Sieh das Netzwerk unter dem Produkt.', copy: 'Wähle eines von sechs Beispielprodukten und lege dann das Provider-Netzwerk und das Fundament des Subnets unter seiner Oberfläche frei. Jedes zeigt eine Möglichkeit, wie Entwickler dieselbe gemeinsame Infrastruktur nutzen könnten.', meta: 'UR / EIN PRODUKT · ZWEI GEMEINSAME EBENEN' },
        v11: { number: 'Sechs Ausgangspunkte', title: 'Was könnte auf UR laufen?', copy: 'Wähle ein Beispiel, um eine beispielhafte Produktoberfläche über demselben Provider-Netzwerk und demselben SN25-Fundament zu sehen. Die sechs sind Anregungen für Entwickler, keine Grenze dessen, was die Infrastruktur tragen kann.', meta: 'UR / AUF GEMEINSAMER INFRASTRUKTUR ENTWICKELN' },
        models: {
            chassis: { number: '05 / Chassis des Austauschknotens', title: 'Öffne den Netzbetreiber.', copy: 'Das Chassis macht aus der Architektur eine zusammenhängende Maschine. Öffne es, um das Kundenprodukt vom Betreiber, vom Subnet-Zugang, von der Validierung, vom Miner-Markt und vom Angebot aus Privatanschlüssen zu trennen.', meta: 'UR / AUSTAUSCHKNOTEN FÜR NETZBETREIBER' },
            spine: { number: '06 / Transit-Rückgrat', title: 'Folge der Nachfrage durch das Subnet.', copy: 'Das Transit-Rückgrat liest sich von links nach rechts: Kundennachfrage tritt bei einem Betreiber ein, durchquert SN25 und seine Validierungsbrücke, wird über Miner-UIDs aufgelöst und verlässt das Netzwerk über das Angebot aus Privatanschlüssen.', meta: 'UR / TRANSIT-RÜCKGRAT DER NACHFRAGE' },
            tower: { number: '07 / Subnet-Turm', title: 'Baue von SN25 aus nach oben.', copy: 'Der Turm setzt die Hierarchie wörtlich um. Das Angebot aus Privatanschlüssen und der Miner-Markt tragen SN25; Validatoren vermessen es; Betreiber und Kundenprodukt belegen die Stockwerke darüber.', meta: 'UR / TURM AUF DEM SUBNET-FUNDAMENT' },
            foundation: { number: '08 / Betreiber-Gateway', title: 'Wechsle das Produkt. Behalte das Fundament.', copy: 'Das Gateway ist ein zusammenhängendes System: Die gewählte Chance wird zum Produktmodul, der Netzbetreiber bleibt die Steuerungsebene, und SN25 liegt darunter als gemeinsames Fundament für Routing, Messung und Anreize.', meta: 'UR / NETZBETREIBER-GATEWAY' },
            terminal: { number: '09 / Betreiber-Terminal', title: 'Sieh das Produkt. Dann öffne das System.', copy: 'Das Terminal beginnt als das kundenseitige Produkt, das ein Netzbetreiber auf den Markt bringt. Zieh es auseinander, um zu sehen, wie Betreiberdienste und die gemeinsame SN25-Architektur dieses Produkt von unten antreiben.', meta: 'UR / NETZBETREIBER-TERMINAL' },
            terminal3: { number: '10 / Drei-Ebenen-Terminal', title: 'Ein Betreiberprodukt. Zwei gemeinsame Ebenen darunter.', copy: 'Produkt und Netzbetreiber bilden jetzt ein wechselndes Modul. Öffne das Terminal, um das gemeinsame Netzwerk aus Providern und Validatoren freizulegen, das auf dem Protokoll- und Wirtschaftsfundament von SN25 aufsitzt.', meta: 'UR / BETREIBER-TERMINAL MIT DREI EBENEN' },
        },
        modelNote: 'Funktionales Lehrmodell · Architektur nach der SN25-Präsentation',
    },

    intro: {
        kicker: 'WÄHLE EINES VON SECHS BEISPIELEN',
        title: 'Das Produkt wechselt. Das Netzwerkfundament nicht.',
        body: 'Diese Beispiele sind Anregungen, kein Katalog dessen, was sich bauen lässt. Wähle eines aus, um sein Nutzenversprechen für Kunden und sein Nachfrageprofil auf derselben SN25-Architektur zu sehen.',
    },

    tabsAria: 'Sechs beispielhafte Chancen',
    contentSwitch: {
        aria: 'Live-Modell oder ausführlichen Steckbrief der Chance wählen',
        model: 'LIVE-MODELL: PRODUKT + NETZWERK',
        brief: 'PRODUKTSTECKBRIEF — AUSFÜHRLICH ERKLÄRT',
    },

    stage: {
        separately: 'VERKEHR, QUALITÄT + ÖKONOMIE GETRENNT DARGESTELLT',
        controlsAria: 'Ansicht der Architektur',
        showAll: 'ALLE ZEIGEN',
        assembled: 'ZUSAMMENGEBAUT',
        openArchitecture: 'OFFENE ARCHITEKTUR',
        traffic: 'VERKEHR',
        verification: 'VERIFIZIERUNG',
        economics: 'ÖKONOMIE',
        railAria: 'Das Netzwerksystem freilegen und verfolgen',
        selectorKicker: 'SECHS AUSGANGSPUNKTE',
        selectorTitle: 'Beispielhafte Chancen für Entwickler.',
    },

    scrub: {
        assembled: 'ZUSAMMENGEBAUT',
        revealed: 'FREIGELEGT',
        exploded: 'ZERLEGT',
        product: 'PRODUKT',
        network: 'NETZWERK',
        aria: 'Die Netzwerkarchitektur im Betreiber-Terminal freilegen',
        valueStart: 'Produkt des Netzbetreibers zusammengebaut',
        valueEnd: 'Drei Netzwerkebenen vollständig freigelegt',
        // {pct} is a whole number from 1 to 99
        valueMiddle: 'Zu {pct} Prozent zerlegt',
    },

    trace: {
        start: 'EINE SITZUNG VERFOLGEN',
        stop: 'VERFOLGUNG STOPPEN',
        replay: 'ERNEUT VERFOLGEN',
        opening: 'DIE DREI EBENEN ÖFFNEN SICH…',
        quality: '02 / VALIDATOREN PRÜFEN VERFÜGBARKEIT, ÜBERTRAGUNG + TRANSIT',
        done: 'SITZUNG GEROUTET + VALIDIERT',
        idleOther: 'ROUTING + VALIDIERUNG EINER PRODUKTSITZUNG ANSEHEN',
        stepsAria: 'Schritte der Systemverfolgung',
        stepRoute: 'ROUTEN',
        stepValidate: 'VALIDIEREN',
        modes: {
            point: { idle: 'PUNKT-ZU-PUNKT · EINE SITZUNG VERFOLGEN', start: '01A / SITZUNG TRITT INS NETZWERK EIN', messages: ['01B / BLAUER INGRESS-PROVIDER VERBUNDEN', '01C / MINER-UIDS ROUTEN DIE SITZUNG', '01D / BLAUER EGRESS-PROVIDER ERREICHT', '01E / ZIELENDPUNKT ERREICHT'] },
            roundtrip: { idle: 'ANFRAGE + ANTWORT · EINE SITZUNG VERFOLGEN', start: '01A / PRODUKTANFRAGE TRITT INS NETZWERK EIN', messages: ['01B / BLAUER INGRESS-PROVIDER VERBUNDEN', '01C / MINER-UIDS ROUTEN DIE ANFRAGE', '01D / BLAUER EGRESS-PROVIDER ERREICHT DAS ZIEL', '01E / ANTWORT KEHRT ZUM PRODUKT ZURÜCK'] },
            fanout: { idle: 'AUFFÄCHERN + SAMMELN · EINEN DURCHLAUF VERFOLGEN', start: '01A / PRODUKTANFRAGE TRITT INS NETZWERK EIN', messages: ['01B / BLAUER INGRESS-PROVIDER VERBUNDEN', '01C / ANFRAGE FÄCHERT SICH ÜBER MINER-UIDS AUF', '01D / BEOBACHTUNGEN AUS PRIVATANSCHLÜSSEN GESAMMELT', '01E / BELEGE KEHREN ZUM PRODUKT ZURÜCK'] },
        },
    },

    layer: {
        label: 'AUSGEWÄHLTE EBENE',
        closeAria: 'Details zur ausgewählten Ebene schließen',
        builder: {
            name: 'Produkt über gemeinsamer Infrastruktur',
            detail: 'Das gewählte Betreiberprodukt sitzt über dem gemeinsamen Provider-Netzwerk und dem SN25-Fundament. Bewege den Schieberegler, um das System auseinanderzuziehen, und wähle dann eine Ebene, um ihre Rolle zu verstehen.',
        },
        terminal3: {
            name: 'Vollständiges Drei-Ebenen-System',
            detail: 'Das Terminal hat drei Ebenen: das wechselnde Produkt des Netzbetreibers, das gemeinsame Netzwerk aus Providern und Validatoren und das gemeinsame Protokoll- und Wirtschaftsfundament von SN25. Zieh am Schieberegler, um sie voneinander zu trennen.',
            short: 'EIN BETREIBERPRODUKT · ZWEI GEMEINSAME EBENEN',
        },
        terminal: {
            detail: 'Das Terminal beginnt als vollständiges kundenseitiges Produkt. Zieh am Schieberegler, um Produktbildschirm, Betreiberdienste und die gemeinsame SN25-Architektur zu trennen, und wähle dann eine beschriftete Ebene, um ihre Rolle zu untersuchen.',
            short: 'EIN ERKENNBARES PRODUKT · EIN GEMEINSAMES FUNDAMENT',
        },
        other: {
            name: 'Vollständiges Betreibersystem',
            detail: 'Öffne das Gateway, um das Produktmodul über der Steuerungsebene des Betreibers und dem gemeinsamen SN25-Fundament zu sehen. Wähle eine beschriftete Ebene, um ihre Rolle einzeln zu betrachten.',
            short: 'EIN PRODUKTMODUL · EIN GEMEINSAMES FUNDAMENT',
        },
    },

    componentKey: {
        aria: 'Komponenten der Architektur untersuchen',
        all: '00 / ALLE',
        allTerminal3: 'Vollständiges Drei-Ebenen-System',
        allOther: 'Vollständiges System',
        allDetail: 'Alle Funktionen der Architektur zeigen.',
    },

    readout: {
        // {n} is the opportunity's number, 01 to 06
        example: 'BEISPIEL {n}',
        oneOfMany: 'EINES VON VIELEN',
        sixStartingPoints: 'SECHS AUSGANGSPUNKTE',
        demandShape: 'NACHFRAGEPROFIL',
        networkReliance: 'NETZWERKABHÄNGIGKEIT',
        product: 'DAS PRODUKT',
        usesSn25: 'SO NUTZT ES SN25',
        // the live page's brief toggle sits in a 210px column: kept short enough for one line
        openBrief: 'STECKBRIEF ÖFFNEN',
        hideBrief: 'STECKBRIEF AUSBLENDEN',
        exploreOpportunity: 'DIESE CHANCE ERKUNDEN',
        closeOpportunity: 'DIESE CHANCE SCHLIESSEN',
        readFullBrief: 'VOLLSTÄNDIGEN STECKBRIEF LESEN',
        closeFullBrief: 'STECKBRIEF SCHLIESSEN',
    },

    brief: {
        // {n} is the opportunity's number (01 to 06), {category} its category in capitals
        number: 'CHANCE {n} / {category}',
        // {reliance} is the network reliance in capitals ("KRITISCH", "HOCH"): set after a colon, so it needs no inflection
        relianceTag: 'NETZWERKABHÄNGIGKEIT: {reliance}',
        navAria: 'Zwischen den Steckbriefen der Chancen wechseln',
        previous: '← ZURÜCK',
        next: 'WEITER →',
        close: 'STECKBRIEF SCHLIESSEN',
        compare: 'STECKBRIEF-FORMATE VERGLEICHEN',
        compareAria: 'Format des Steckbriefs',
        editorial: 'REDAKTIONELL',
        structured: 'STRUKTURIERT',
        storyOpportunity: '01 / CHANCE',
        storyWhyUr: '02 / WARUM UR',
        storyOwns: '03 / DER BETREIBER VERANTWORTET',
        storyOwnsTitle: 'Was beim Betreiber bleibt',
        storyTheOpportunity: '01 / DIE CHANCE',
        storyWhySn25: '03 / WARUM SN25',
        railKicker: 'EINE VON VIELEN MÖGLICHKEITEN',
        railCustomer: 'POTENZIELLER KUNDE',
        railDemand: 'NACHFRAGEPROFIL',
        railNetworkUse: 'NETZWERKNUTZUNG',
        railOwns: 'WAS DER BETREIBER VERANTWORTET',
        railOpen: 'WOHIN ES GEHEN KÖNNTE',
        footerAria: 'Weiter durch die Steckbriefe der Chancen',
        previousExample: '← VORHERIGES BEISPIEL',
        examples: 'BEISPIELE ZUR INSPIRATION',
        nextExample: 'NÄCHSTES BEISPIEL →',
        chapterOpportunity: '01 / CHANCE',
        chapterOpportunityTitle: 'Was aus dem Produkt werden könnte',
        potentialCustomer: 'Potenzieller Kunde',
        problem: 'Das Problem',
        proposition: 'Nutzenversprechen des Produkts',
        chapterInUse: '02 / IM EINSATZ',
        chapterInUseTitle: 'Wie die Nachfrage das Netzwerk erreicht',
        scenario: 'Konkretes Nutzungsszenario',
        path: 'Wie sich die Nachfrage durch das Netzwerk bewegt',
        chapterBoundary: '03 / ABGRENZUNG',
        chapterBoundaryTitle: 'Was du baust. Was SN25 liefert.',
        operatorOwns: 'Was der Betreiber verantwortet',
        urSupplies: 'Was UR / SN25 liefert',
        valueExchange: 'Wo der Wertaustausch stattfindet',
        constraints: 'Wichtige Einschränkungen und offene Fragen',
    },

    proof: {
        eyebrow: 'HEUTE LIVE / BRINGYOUR',
        title: 'BringYour ist der erste Netzbetreiber.',
        body: [
            'Sein erstes Produkt, URnetwork, ist ein VPN für Verbraucher, verfügbar für Mobilgeräte, Desktop und Browser. BringYour verantwortet das Produkterlebnis und die Kundenbeziehung; UR stellt das Netzwerk bereit, auf dem es läuft.',
            'URnetwork hat mehr als 350K monatlich aktive Nutzer. Das zeigt, dass das Modell im Verbrauchermaßstab funktioniert: Nachfrage eines Betreibers, geroutet über gemeinsam genutzte Provider-Kapazität.',
        ],
        chain: [
            { label: 'KUNDENPRODUKT', value: 'URnetwork-VPN' },
            { label: 'NETZWERKNACHFRAGE', value: 'Aktive Nutzer + übertragene Daten' },
            { label: 'GEMEINSAMES ANGEBOT', value: '100K+ Provider in 100+ Ländern' },
        ],
        link: 'DAS URNETWORK-VPN ENTDECKEN ↗',
    },

    flows: {
        eyebrow: 'Das gemeinsame Fundament in drei Pfaden',
        title: 'Ein Nachfragesignal. Drei Antworten des Netzwerks.',
        cards: [
            { label: '01 / VERKEHR', title: 'Kundennachfrage wird zum gerouteten Dienst', body: 'Der Betreiber authentifiziert und wendet die Produktrichtlinien an. SN25 koordiniert einen gemessenen Pfad durch Miner-Kapazität und Ingress oder Egress über Privatanschlüsse.', path: 'Produkt → Betreiber → Miner-Pfad → Provider-Exit' },
            { label: '02 / QUALITÄT', title: 'Validatoren testen den Pfad unabhängig', body: 'Validatoren durchlaufen vom Betreiber zugewiesene Ketten und messen Verfügbarkeit, Übertragung und Transit-Nachweis. Dieses Qualitätssignal fließt in den Konsens ein.', path: 'Validator-Prüfungen → gemessene Qualität → UID-Bewertung' },
            { label: '03 / ÖKONOMIE', title: 'Nachfrage und Belohnungen bleiben getrennte Ströme', body: 'Einlagen der Betreiber fließen in die Reserve des Subnets. Die Bittensor-Emission belohnt Miner und Validatoren für gemessenen, nützlichen Dienst; Einlagen werden nicht als Miner-Auszahlungen durchgereicht.', path: 'Betreiber-Einlage → Reserve · Emission → gemessenes Angebot' },
        ],
    },

    responsibility: {
        eyebrow: 'Gemeinsame Infrastruktur / unabhängige Produkte',
        eyebrowV11: 'Ein gemeinsames Fundament, kein fertiges Geschäft',
        title: 'Du schaffst den Grund, das Netzwerk zu nutzen.',
        body: 'SN25 ist das Bittensor-Subnet von UR: die Koordinations- und Anreizschicht unter dem Provider-Netzwerk. Es gibt Entwicklern Infrastruktur an die Hand, ohne vorzugeben, was das Kundenprodukt sein soll.',
        operator: {
            label: 'DER NETZBETREIBER BRINGT MIT',
            title: 'Das Produkt und die Kundenbeziehung',
            body: 'Produkterlebnis, Marke, Nutzer, Identität, Rechnungsstellung, Richtlinien, Support, Compliance und den geschäftlichen Grund für Netzwerknachfrage.',
            bodyV11: 'Produkterlebnis, Marke, Nutzer, Identität, Rechnungsstellung, Richtlinien, Support und den geschäftlichen Grund für Netzwerknachfrage.',
        },
        subnet: {
            label: 'UR (SN25) LIEFERT',
            labelV11: 'UR / SN25 KOORDINIERT',
            title: 'Zugang zur Netzwerkinfrastruktur',
            titleV11: 'Zugang zu gemeinsamer Netzwerkinfrastruktur',
            body: 'Verteilte Netzwerk-Provider mit Privatanschluss, verschlüsselte Bandbreite und ein Anreizsystem, das ein verlässliches Angebot stützt.',
            bodyV11: 'Reichweite über Provider mit Privatanschluss, Miner-UIDs, unabhängige Messung der Dienstqualität und das Anreizsystem, das ein nützliches Angebot stützt.',
        },
    },

    cta: {
        eyebrow: 'Der nächste Betreiber',
        title: 'Werde Netzbetreiber',
        copy: 'Bring ein bestehendes Produkt mit oder lote die Möglichkeit aus, ein neues auf unserer Flotte von Netzwerk-Providern zu starten. Lies die Dokumentation und sprich mit dem UR-Team darüber, wie gut es zum Netzwerk passt.',
        v11: {
            eyebrow: 'Bring die nächste Chance mit',
            title: 'Was sollte auf UR laufen?',
            copy: 'Bring ein bestehendes Produkt mit oder eine Idee, die diese Beispiele nicht abdecken. Starte ein Gespräch darüber, wie gut sie zum Netzwerk passt, welche Infrastruktur verfügbar ist und was der Betrieb auf SN25 erfordern könnte.',
        },
        talk: 'MIT DEM UR-TEAM SPRECHEN ↗',
        docs: 'SN25-DOKUMENTATION ENTDECKEN →',
    },
};
