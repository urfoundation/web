// German: Our Letter to Bittensor, 18 August 2026, and its exhibits (see en.js).
export default {
    salutation: 'Liebe Freunde bei Bittensor,',
    opening: [
        'Heute bin ich sehr stolz, UR (SN25) gemeinsam mit meinen lieben Freunden Brien Colwell und Keith Singery zu starten. Vor drei Monaten kamen Brien und ich in Stockholm zusammen, um über die Notwendigkeit eines freien und offenen Internets für alle zu sprechen, eine Mission, der sich Brien in den letzten zwei Jahren voll und ganz verschrieben hat.',
        'Im Kern eines offenen Internets steht die Rolle der eigenen IP-Adresse. Oft übersehen, ist Ihre IP-Adresse Ihre Online-Identität; jede Website, die Sie besuchen, sieht Ihre Adresse, die an Ihren geografischen Standort gebunden ist. Das Internet, wie wir es kennen, ordnet Menschen heute nach ihrer Adresse: Preise, Inhalte, der Zugang überhaupt, alles wird danach entschieden, wo Sie sich befinden. Wer identifiziert werden kann, kann ins Visier genommen werden; das Werkzeug moderner Überwachung und Unterdrückung.',
        'Am 8. Januar 2026 schaltete der Iran den Zugang zum globalen Internet ab, unterband den Informationsfluss und unterbrach den Kontakt zu vielen Familien. Bei aller Traurigkeit war dies zugleich ein Durchbruchsmonat für URnetwork, dessen VPN-Produkt ur.io ein Allzeithoch bei den MAUs erreichte und für Nutzer zur Rettungsleine wurde; ein Nutzer in Teheran brachte es auf den Punkt: „Das ist das einzige VPN, das funktioniert“',
        'In den letzten zwei Jahren hat Brien im Alleingang eine Community von 80k+ Netzwerk-Providern aufgebaut, die 350k+ MAUs bedienen, und dabei schwierige Technologie umgesetzt (wie bringt man IPs für optimale Leistung zusammen?); das Angebot aufzubauen und die Leistung sicherzustellen, ist als technologisches Primitiv außerordentlich schwierig, etwas, das Tor, Nym und den großen Netzwerken nicht gelungen ist.',
    ],
    sweden: [
        'In vielen Gesprächen in Schweden im Mai erzählte Brien von seiner Zeit bei Palantir zu Beginn seiner Karriere, wo er deren Gov-V1-Plattform aufbaute, die zu dieser Generation von Überwachungs- und Militärtechnologien beitrug; er blieb nur 18 Monate, bevor er an die NYU ging, um Computational Art zu studieren. Er sprach darüber, wie es sich anfühlte, Technologie zu schaffen, die vom Schlechtesten der Menschheit ausging, und darüber, wie wir Optimismus dafür wecken können, was Technologie leisten könnte, indem sie Menschen stärkt, statt Freiheiten kleinzumachen.',
        'Uns wurde überdeutlich, dass wir, um dieses offene Internet für Menschen (und auch für Agenten) zu bauen, diese rotierende Flotte von Exit-Nodes in Privathaushalten skalieren und dann neue Anwendungen entwickeln mussten, die diese einzigartige Form des Internetzugangs ermöglichen.',
    ],
    market: [
        'Der Umzug unseres Netzwerks zu Bittensor wird bedeuten, unsere Community von IP-Providern in einen wettbewerbsorientierten Live-Markt zu verwandeln, der, wie wir glauben, die Netzwerkdichte vertiefen und die IP-Qualität steigern kann: ein stärkeres Netzwerk, das die Erfahrung für Nutzer verbessert und das offene Internet zugänglicher macht',
        'Mit unserem Eintritt in Bittensor möchten wir unsere Fortschritte und Beobachtungen zu unserer Mission teilen, letztlich mit dem Ziel, Sie alle zu befähigen, sich uns in dieser Mission für ein offenes und freies Internet anzuschließen.',
    ],
    subnet: {
        heading: 'UR-Subnet',
        paragraphs: [
            'Zunächst einmal ist UR ein Marktplatz auf der Angebotsseite für 80k+ IP-Provider: Stellen Sie sich das wie Airbnb für Ihre Bandbreite vor: Zugangsknoten anbieten und bezahlt werden, wenn sie genutzt werden. Für Nutzer sind dies Exit-Nodes: Ihr Datenverkehr kann über saubere, ständig wechselnde IP-Adressen austreten; keine einzelne Partei kennt sowohl Ihre Identität als auch Ihre Ziele, sodass sich die Korrelation, die Überwachung erst möglich macht, niemals herstellen lässt.',
            'Auf diese Weise ähnelt das UR-Subnet eher einem Telekommunikationsanbieter im Besitz der Menschen, der den gesamten Planeten mit Knoten abdeckt, die den Zugang zum Internet ermöglichen können. Je globaler die Abdeckung, desto dominanter kann es werden.',
            'Auf Bittensor werden Top-IP-Miner eigene UIDs haben, und Long-Tail-Miner werden unter Miner-UIDs gepoolt. Netzbetreiber (Network Operators, „NOs“) betreiben eigene Server, um Nutzer zu bedienen, und werden in SN25 dafür abgerechnet, dass sie Bandbreite aus dem Subnet nutzen. Validatoren prüfen den Datenverkehr, um echte Nutzung zu verifizieren. Ein Miner betreibt UR-Software auf einem Telefon, Laptop oder Raspberry Pi und lässt den Datenverkehr Fremder über seinen Heimanschluss austreten.',
        ],
        operators: 'Ein Netzbetreiber ist die Nachfrageseite des Subnets; ihm gehören die Nutzer, das Produkt, die Marke und die Abrechnung, und er kauft Kapazität von SN25 ein, um seine Dienste zu ermöglichen. NOs werden auf zwei Achsen abgerechnet: (1) bediente monatlich aktive Nutzer und (2) pro Tag bewegte Gigabyte, gezahlt an das Subnet in Alpha.',
        outlook: [
            'Mit unserem ersten Netzbetreiber, ur.io, ermöglicht die Flotte aus Privathaushalten vielen Menschen auf der ganzen Welt Proxy-Zugang zum Internet. Mit Blick nach vorn sehen wir eine Welt, in der gewerbliche Käufer die globale Flotte nutzen können, um eine legitime Herkunft (echte Person, echter Ort) für vielfältige Anwendungsfälle zu schaffen, darunter Web-Crawling aus der Flotte in Privathaushalten für das Modelltraining, geografisch begrenzte Preisinformationen, z. B. geografisch differenzierte Flugpreise; Aggregatoren kaufen IPs, um Preise zu vergleichen, Agenten-Zugriffe laufen über Exit-Nodes und überwinden Anti-Bot-Schutz. Ich lege Ihnen sehr ans Herz, unsere <research>Kerntechnologien</research> durch einen Agenten laufen zu lassen, um zu verstehen, was nötig war, um hierher zu gelangen, und warum diese Technologie für die Welt wichtig ist.',
            'Zusammengenommen ermöglicht dieses Design UR unserer Ansicht nach sehr natürliche Netzwerkeffekte: bessere Abdeckung → zieht mehr Datenverkehr an → erzeugt mehr Umsatz → macht das Netzwerk für den nächsten Betreiber wertvoller.',
        ],
    },
    openInternet: {
        heading: 'Für ein offenes Internet kämpfen',
        paragraphs: [
            'Die Wahrheit ist: Moderne VPNs bedienen große Teile der Weltbevölkerung nicht und ermöglichen lediglich die Optimierung des Netflix-Katalogs für die Erste Welt. Seit 2024 besteht die Mission von <urio>ur.io</urio> darin, neue Technologien zu schaffen, die Menschenrechte gegenüber repressiven Regimen auf der ganzen Welt verteidigen könnten; hier liegt eine echte Chance für Veränderung.',
            'Über den Zugang für Menschen hinaus erwarten wir eine exponentielle Nachfrage nach Zugang über Privathaushalte durch KI-Agenten: Agenten rufen Webinhalte im Auftrag ihrer Nutzer ab, Labore müssen die Daten des Internets sammeln, um damit zu trainieren; während sich Agenten zum Fortschritt der Menschheit verbreiten, werden etablierte Anbieter diese Gelegenheit zunehmend ins Visier nehmen. Nehmen wir Cloudflare, das angekündigt hat, ab September Crawler standardmäßig zu blockieren und Gebühren für die Durchleitung im Internet zu erheben.',
            'Eine Welt, in der der Zugang zum Internet zu einer knappen Ressource wird, ist eine niederträchtige Vorstellung.',
        ],
    },
    closing: [
        'Die Wahrheit ist, dass es Menschen auf der Welt gibt, die nicht das Beste für Sie und Ihre Familie wollen: Diese Menschen verfolgen Sie, sammeln Ihre Daten, drosseln Ihr Internet. Ob Unternehmen oder Behörde: Eine Welt, in der die Menschen von ihrer Regierung überwacht werden oder einem Vermieter des Internets Abgaben zahlen, ist niederträchtig. Technologie wurde benutzt, um diese Probleme zu schaffen; sicherlich lässt sich Technologie schaffen, um diese Probleme zu lösen.',
        'Und darin liegt unser Ziel für Bittensor: gemeinsam Fortschritte hin zu einem offenen und freien Internet zu machen. Aus unserer Sicht wissen die Menschen von Bittensor, was für Open-Source-Technologien auf dem Spiel steht, und wir hoffen, dass UR und Subnet 25 ein Vehikel für unseren Traum für die Welt sein können.',
        'Schließlich gilt unsere tiefste Bewunderung Keith, der uns die Plattform für diese Mission gegeben hat; ohne ihn und seinen beständigen Optimismus für Bittensor wäre nichts davon möglich. An unsere vielen Freunde, die diese Mission tief geprägt haben: Max von SCORE, Micaela von Nova, Ken von Bitmind, Michael White von Karis Capital, Gyles von TAO.com, eure Energie inspiriert uns jeden Tag.',
        'An Brien: Es ist mir eine Ehre, dir zu helfen, diesen Traum zu verfolgen. Lass uns die Menschen stolz machen.',
    ],
    signOff: 'Jack Ai-Leung<br/>Im Namen des Teams von UR (SN25)',

    coverage: {
        heading: 'Miner bündeln sich heute in zwei Regionen, was das Netzwerk bei rund einer Million Nutzern deckelt',
        subheading: 'Wo die 100k+ Netzbetreiber heute sitzen und wohin ein Anreizmarkt sie bringt',
        before: {
            eyebrow: 'Vorher',
            title: 'Tief in zwei Regionen',
            text: 'echte Dichte in den USA und Südostasien, finanziert vom Unternehmen',
            mapAria: 'Abdeckung konzentriert auf die Vereinigten Staaten und Südostasien',
        },
        after: {
            eyebrow: 'Nachher',
            title: 'Diese Tiefe, überall',
            text: '100k+ Adressen in Privathaushalten',
            mapAria: 'Abdeckung durch Adressen in Privathaushalten, verteilt über die ganze Welt',
        },
    },
    flow: {
        caption: 'Nutzer greifen über einen Netzbetreiber zu, der Bandbreite beim UR-Subnet einkauft.',
        users: { title: 'Nutzer', text: 'nutzen die App' },
        operator: { title: 'Netzbetreiber', example: 'z. B. ur.io', note: 'wird in Alpha für genutzte Bandbreite abgerechnet' },
        subnet: {
            title: 'UR-Subnet',
            top: '<b>Top-Miner</b> ~200, jeder mit eigener UID',
            longTail: '<b>Long Tail</b> ~100k, verdienen über Pools',
            note: 'Miner sind die IP-Provider in Privathaushalten',
        },
    },
    stack: {
        caption: 'Das Live-Produkt ur.io und drei aktuelle Forschungsprogramme stützen sich alle auf das UR-Subnet.',
        liveLabel: 'Live-Produkt',
        researchLabel: 'Aktuelle Forschung',
        urio: { stat: '350k+ monatlich aktive Nutzer', text: 'Live-Nutzung erzeugt<br/>Netzwerknachfrage.' },
        bastion: { name: 'Projekt Bastion', text: 'Wie erschließen wir<br/>Netzwerkkonnektivität<br/>für Unternehmen?' },
        stargate: { name: 'Projekt Stargate', text: 'Kann ein offener Index<br/>Modelltraining und<br/>Live-Abruf unterstützen?' },
        meridian: { name: 'Projekt Meridian', text: 'Wie schaffen wir<br/>eine eigene Identität<br/>für Agenten?' },
        subnetLabel: 'UR-Subnet',
        subnetTitle: 'Gemeinsame Provider- und Validierungsschicht',
        subnetText: 'Eine Infrastruktur trägt die Live-Nachfrage und alle drei Forschungsprogramme, durch Qualitätsbewertung und einen Anreizmarkt.',
        minersLabel: 'Miner in Privathaushalten',
        countriesLabel: 'Länder',
        expandAria: 'Erweitertes Netzwerk-Stack-Diagramm öffnen',
        dialogTitle: 'Netzwerk-Stack',
        zoomAria: 'Zoomsteuerung des Diagramms',
        zoomOutAria: 'Verkleinern',
        fit: 'Einpassen',
        fitAria: 'Diagramm an Fenster anpassen',
        zoomInAria: 'Vergrößern',
        closeAria: 'Erweitertes Diagramm schließen',
        viewportAria: 'Zoombares Netzwerk-Stack-Diagramm. Mit zwei Fingern zoomen, ziehen oder die Zoomsteuerung verwenden.',
    },
};
