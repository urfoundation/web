// German copy of the research report page (/de/research/2026-q3-report): its own
// words and what its islands show. Keys mirror en.js; the figures are the English's,
// written in German number format (figures.js).
export default {
    title: 'Forschungsbericht August–Oktober 2026',
    kinds: {
        gain: {
            label: 'Verbesserung',
            legend: 'gemessen und übernommen',
            tally: { one: '{count} Verbesserung', other: '{count} Verbesserungen' },
        },
        recovery: {
            label: 'Wiederherstellung',
            legend: 'ein Stillstand oder Fehler behoben',
            tally: { one: '{count} Wiederherstellung', other: '{count} Wiederherstellungen' },
        },
        observation: {
            label: 'Beobachtung',
            legend: 'eine Messung am Telefon oder eine öffentliche, kein A/B',
            tally: { one: '{count} Beobachtung', other: '{count} Beobachtungen' },
        },
        mixed: {
            label: 'Gemischt',
            legend: 'half in einem Fall, schadete in einem anderen',
            tally: { one: '{count} gemischt', other: '{count} gemischt' },
        },
        rejected: {
            label: 'Verworfen',
            legend: 'gemessen und nicht übernommen, oder keine Änderung',
            tally: { one: '{count} verworfen', other: '{count} verworfen' },
        },
        groundwork: {
            label: 'Grundlagenarbeit',
            legend: 'Korrektheit, Richtlinie oder Messung, keine Geschwindigkeitsaussage',
            tally: { one: '{count} Grundlagenarbeit', other: '{count} Grundlagenarbeiten' },
        },
    },
    meters: {
        load: { name: 'Seitenladezeit', tag: 'letzter Median', unit: 'ms', short: 'Laden' },
        bulk: { name: 'Übertragungsrate', tag: 'kontrolliertes H1', unit: 'Mbps', short: 'Rate' },
        path: {
            name: 'Paketpfad',
            tag: 'nie multipliziert',
            unit: { one: 'Beschleunigung', other: 'Beschleunigungen' },
            short: 'Pfad',
        },
        memory: {
            name: 'Speicher',
            tag: 'nie summiert',
            unit: { one: 'Reduktion', other: 'Reduktionen' },
            short: 'Speicher',
        },
        fixed: {
            name: 'Wiederherstellungen',
            tag: 'Anzahl',
            unit: { one: 'Stillstand behoben', other: 'Stillstände behoben' },
            short: 'Behoben',
        },
    },
    entries: {
        'e-aug-24': {
            date: '24. Aug.',
            title: 'Speicher- und Geschwindigkeitseinstellungen auf Mobilgeräten gemeinsam neu austarieren',
            meters: {
                load: {
                    baseline: 'gebündelte Low-Bar-Baseline',
                    points: ['Low-Bar-Bündel'],
                },
            },
        },
        'e-aug-24-2': { date: '24. Aug.', title: 'Prüfen, ob der Server langsamer geworden ist' },
        'e-aug-24-3': {
            date: '24. Aug.',
            title: 'Den Engpass mit tieferen Sequenz-Queues finden',
            meters: {
                load: {
                    baseline: 'explizite H1-Kontrolle',
                    points: ['Tiefe 32, öffentliche Route', 'Tiefe 64, öffentliche Route'],
                },
            },
        },
        'e-aug-25': {
            date: '25. Aug.',
            title: 'Die Pakete eines Providers als eine Gruppe senden',
            meters: {
                path: [
                    { l: 'Gruppiertes Senden beim Provider', t: '2,81×' },
                    { l: 'Schnellpfad für reine TCP-ACKs', t: '577,8 → 596,5 MB/s' },
                ],
            },
        },
        'e-aug-25-2': {
            date: '25. Aug.',
            title: 'Fertige H1-Frames ohne Warten schreiben',
            meters: {
                path: [
                    { l: 'H1-Writes mit Ready-Drain', t: '+85,2%' },
                ],
            },
        },
        'e-aug-25-3': {
            date: '25. Aug.',
            title: 'H1-Übergaben unter Last nicht mehr verlieren',
            meters: {
                load: {
                    points: ['Telefon, exakter Provider'],
                },
                bulk: { controlled: '6,7×' },
                fixed: 'Verlorene H1-Übergaben',
            },
        },
        'e-aug-25-26': {
            date: '25.–26. Aug.',
            title: 'Gehaltenen Speicher getrennt von Daten im Flug zählen',
            meters: {
                path: [
                    { l: 'ACK-Buchführung', t: 'etwa 44 → 20 ns/op' },
                ],
                memory: [
                    { l: 'Zählung gehaltener Bytes', t: '29,59 → 21,77 MiB' },
                ],
            },
        },
        'e-aug-26-27': {
            date: '26.–27. Aug.',
            title: 'Sich von vergifteten Exits erholen und gesündere Provider wählen',
            meters: {
                load: {
                    points: ['öffentliche Route, nach Behebung'],
                },
                bulk: {
                    points: ['öffentliche H1-Routen, kombinierter Median'],
                },
                fixed: 'Wiedergabe nach vergifteten Exits',
            },
        },
        'e-aug-27': {
            date: '27. Aug.',
            title: 'UDP-Bereitschaft und Leerlaufbehandlung auf Providern gemeinsam nutzen',
            meters: {
                path: [
                    { l: 'UDP-Roundtrips beim Provider', t: '+10,4%' },
                ],
                memory: [
                    { l: 'Gemeinsamer Provider-UDP-Lebenszyklus', t: '27,9 → 25,8 MiB' },
                ],
            },
        },
        'e-sep-4': { date: '4. Sept.', title: 'Die eingehende TCP-Übergabe begrenzen' },
        'e-sep-9-11': {
            date: '9.–11. Sept.',
            title: 'Den Flight-Gate-Kollaps auf gemischten Routen beseitigen',
            meters: { fixed: 'Flight-Gate-Kollaps auf gemischten Routen' },
        },
        'e-sep-12-13': {
            date: '12.–13. Sept.',
            title: 'Retransmission-Stürme stoppen',
            meters: { fixed: 'Stürme von Retransmission-Timeouts' },
        },
        'e-sep-13': { date: '13. Sept.', title: 'Socket-Puffer der Provider an das Kernel-Autotuning anpassen' },
        'e-sep-14': {
            date: '14. Sept.',
            title: 'Lieferfenster an das tatsächlich Gelieferte anpassen',
            meters: {
                path: [
                    { l: 'An der Lieferung bemessene Fenster', t: 'gepaartes Verhältnis 1,233' },
                ],
            },
        },
        'e-sep-14-19': {
            date: '14.–19. Sept.',
            title: 'Budgets mit dem Ziel skalieren und eine gemeinsame Abrechnungswurzel nutzen',
        },
        'e-sep-16-17': {
            date: '16.–17. Sept.',
            title: 'Mit adaptiven Fenstern Durchsatz der Gigabit-Klasse erreichen',
            meters: {
                path: [
                    { l: 'Adaptive Fenster (Modell)', t: '≈4,73×' },
                ],
            },
        },
        'e-sep-17': { date: '17. Sept.', title: 'Für jeden Dienst einen kompakten Lieferverlauf wählen' },
        'e-sep-20': {
            date: '20. Sept.',
            title: 'Durch Überlast blockierte P2P-Sendungen als Dienstnachweis zählen',
            meters: { fixed: 'P2P-Zulassungen mit festem Angebot' },
        },
        'e-sep-20-2': { date: '20. Sept.', title: 'Niedrigere Soft Limits für den Go-Speicher verwerfen' },
        'e-sep-19-21': {
            date: '19.–21. Sept.',
            title: 'Ein Telefonlauf besteht eine eingegrenzte 24-MiB-Prüfung',
            meters: {
                load: {
                    points: ['eingegrenzter Telefonlauf'],
                },
                bulk: {
                    points: ['Fast.com-Median, eingegrenzter Telefonlauf'],
                },
            },
        },
        'e-sep-21': {
            date: '21. Sept.',
            title: 'Pro Paket weniger allozieren und mobile Log-Puffer verkleinern',
            meters: {
                path: [
                    { l: 'Anhängen an eine bestehende Gruppe', t: '49,33 → 23,88 ns/op' },
                ],
                memory: [
                    { l: 'Mobile Log-Puffer', t: '688.128 B weniger' },
                ],
            },
        },
        'e-sep-22': {
            date: '22. Sept.',
            title: 'H1+: ein schlankerer Carrier innerhalb von H1',
            meters: {
                path: [
                    { l: 'H1+-Carrier', t: '1,19–1,36×' },
                ],
            },
        },
        'e-sep-22-2': {
            date: '22. Sept.',
            title: 'Einzelnen Frames im Framer einen schnelleren Pfad geben',
            meters: {
                path: [
                    { l: 'Framer-Pfad für einzelne Frames', t: '2,02×' },
                ],
            },
        },
        'e-sep-22-23': {
            date: '22.–23. Sept.',
            title: 'Geräte-RPC über FramerXL führen, dann Deskriptoren wiederverwenden',
            meters: {
                path: [
                    { l: 'Geräte-RPC über FramerXL', t: '+32,31%' },
                ],
            },
        },
        'e-sep-22-3': { date: '22. Sept.', title: 'SIMD-WebSocket-Maskierung ausprobieren' },
        'e-sep-23': {
            date: '23. Sept.',
            title: 'Kurze Bursts direkt abfertigen und eine zu optimistische Schätzung korrigieren',
        },
        'e-sep-25-26': { date: '25.–26. Sept.', title: 'Kürzere Retransmission-Obergrenzen und UDP ohne ACKs testen' },
        'e-sep-30': { date: '30. Sept.', title: 'Größere Speicherprofile übernehmen und frühe Android-Trims stoppen' },
        'e-oct-2-5': {
            date: '2.–5. Okt.',
            title: 'Die Custody in der NAT-Stufe reparieren, damit Uploads abschließen',
            meters: { fixed: 'Uploads in der NAT-Stufe' },
        },
        'e-oct-7-10': { date: '7.–10. Okt.', title: 'Reparieren, wie belasteter H1-Verkehr gemessen wird' },
        'e-oct-14': {
            date: '14. Okt.',
            title: 'Jedem Speicherbesitzer auf dem Gerät eine eigene Low-Memory-Richtlinie geben',
        },
        'e-oct-16-18': {
            date: '16.–18. Okt.',
            title: 'H1-Speicherangaben korrigieren und die Zulassung allokationsfrei machen',
            meters: {
                memory: [
                    { l: 'Allokation bei abgebrochenem Write', t: '128 → 16 B' },
                ],
            },
        },
        'e-oct-19': {
            date: '19. Okt.',
            title: 'Beendete Reader im TCP von gVisor freigeben',
            meters: {
                memory: [
                    { l: 'Veralteter TCP-Reader freigegeben', t: '7,86 → 0,54 MiB' },
                ],
            },
        },
        'e-oct-20-21': {
            date: '20.–21. Okt.',
            title: 'Verhindern, dass ausgelastete Kanäle und nativer Input einander blockieren',
        },
        'e-oct-21': {
            date: '21. Okt.',
            title: 'Zusätzliches Pacing in der Anwendung abschalten',
            meters: { fixed: 'Browsing-Test mit 100 Seiten' },
        },
        'e-oct-21-23': { date: '21.–23. Okt.', title: 'Die Provider-Suche drosseln, statt blind zu wiederholen' },
        'e-oct-22': {
            date: '22. Okt.',
            title: 'Einzelne gehostete Zellen mit Telefonprofil prüfen',
            meters: {
                bulk: {
                    points: [
                        'Fast-Median, Zelle mit iOS-Profil',
                        'Fast-Median, Zelle mit Android 64 MiB',
                    ],
                },
            },
        },
        'e-oct-24': {
            date: '24. Okt.',
            title: 'Provider nach Dienstgesundheit wählen und die SYN-Custody korrigieren',
            meters: { fixed: 'SDK100-Seiten unter 5 s' },
        },
        'e-oct-24-2': {
            date: '24. Okt.',
            title: 'Die neueste Zelle am Telefon',
            meters: {
                load: {
                    points: ['neueste Zelle am Telefon'],
                },
                bulk: {
                    points: [
                        'Fast, neueste Zelle am Telefon',
                        'Fast, neueste Zelle am Telefon',
                    ],
                },
            },
        },
    },
    terms: {
        'g-a-a-test': {
            term: 'A/A-Test',
            def: 'Identischer Code, gegen sich selbst ausgeführt. Die Streuung seiner Ergebnisse ist das Rauschen, das ein echter Unterschied übertreffen muss.',
        },
        'g-ack': {
            term: 'ACK',
            def: 'Eine Bestätigung (Acknowledgment): das Signal des Empfängers, dass Daten angekommen sind, damit der Sender weitermachen kann, statt erneut zu senden.',
        },
        'g-ack-compression': {
            term: 'ACK-Kompression',
            def: 'Bestätigungen, die nach einer Verzögerung gebündelt eintreffen, sodass der Sender später von ausgelieferten Daten erfährt, als es die Laufzeit des Pfads allein erwarten ließe.',
        },
        'g-admission': { term: 'Zulassung', def: 'Neuen Verkehr nur annehmen, wenn das Speicherbudget Platz dafür hat.' },
        'g-carrier': {
            term: 'Carrier',
            def: 'Eine Verbindung, die URnetwork-Verkehr zwischen einem Gerät und dem Netzwerk transportiert, etwa H1, H3 oder P2P.',
        },
        'g-connect': {
            term: 'Connect',
            def: 'Die quelloffene Netzwerkbibliothek von URnetwork, die den Verkehr zwischen Clients und Providern transportiert.',
        },
        'g-drain': { term: 'Drain', def: 'Alle Pakete einer Warteschlange in einem Durchgang herausnehmen.' },
        'g-fast-com': {
            term: 'Fast.com',
            def: 'Ein öffentlicher Test der Download-Geschwindigkeit, hier im Browser eines Telefons ausgeführt.',
        },
        'g-framer': {
            term: 'Framer',
            def: 'Das Format, das auf einem Carrier markiert, wo jede Nachricht beginnt und endet. FramerXL ist die Variante für große Geräte-RPC-Frames.',
        },
        'g-gc': {
            term: 'GC',
            def: 'Garbage Collection: Go gibt Speicher frei, der nicht mehr verwendet wird. GOGC und das Soft Limit legen fest, wie oft und wie intensiv sie arbeitet.',
        },
        'g-goroutine': {
            term: 'Goroutine',
            def: 'Ein leichtgewichtiger Go-Thread. Jede Goroutine belegt Speicher, weniger sind also günstiger.',
        },
        'g-gvisor': {
            term: 'gVisor',
            def: 'Ein quelloffener Netzwerkstack im Userspace. Connect führt darin TCP/IP auf dem Gerät aus.',
        },
        'g-h1': {
            term: 'H1',
            def: 'Die Carrier-Familie über TLS, WebSocket und TCP, die durch gewöhnliche Web-Infrastruktur läuft.',
        },
        'g-h1-plus': {
            term: 'H1+',
            def: 'Ein Upgrade innerhalb von H1, das das Framer-Format direkt über den TLS-Stream sendet, mit einem einfachen WebSocket als Rückfallebene.',
        },
        'g-h3': { term: 'H3', def: 'Die Carrier-Familie über QUIC.' },
        'g-ios-profile': {
            term: 'iOS-Profil',
            def: 'Das Speicherbudget von 32 MiB, das für eine Netzwerkerweiterung auf dem iPhone steht, getestet auf freigegebenen Android-Telefonen.',
        },
        'g-lowbar': {
            term: 'LOWBAR',
            def: 'Die Testsuite für eingeschränkte Verbindungen: Auslieferung und Latenz bei niedrigen Raten, kleiner MTU, Verlust und gemischten Routen.',
        },
        'g-median': { term: 'Median', def: 'Der mittlere Wert einer Reihe von Messungen.' },
        'g-memsteady': {
            term: 'MEMSTEADY',
            def: 'Die Testsuite für den Speicher über die Zeit: Spitzen zur Laufzeit, Verhalten im Ruhezustand, Abbau und welcher Code den Speicher besitzt.',
        },
        'g-mib': { term: 'MiB', def: 'Ein Mebibyte, 1.048.576 Bytes.' },
        'g-model-mbps': {
            term: 'Modell-Mbps',
            def: 'Eine Rate, gemessen in einem Modell des Pfads mit virtueller Zeit statt an echten Sockets. Sie zeigt, dass ein Mechanismus funktioniert, nicht, was ein Gerät erreicht.',
        },
        'g-nat': {
            term: 'NAT',
            def: 'Network Address Translation: die Zuordnung zwischen privaten und öffentlichen Adressen, hier auf dem Provider.',
        },
        'g-p2p': { term: 'P2P', def: 'Ein direkter Carrier zwischen zwei Geräten.' },
        'g-p95': { term: 'p95', def: 'Der Wert, den 95% der Messungen nicht überschreiten.' },
        'g-pacing': {
            term: 'Pacing',
            def: 'Pakete zeitlich verteilt senden, statt sie zu senden, sobald sie bereit sind.',
        },
        'g-pack': {
            term: 'Pack',
            def: 'Eine Connect-Nachricht, die ein oder mehrere Pakete über die Leitung transportiert.',
        },
        'g-perfvar': {
            term: 'PERFVAR',
            def: 'Die Performance-Suite: Durchsatz, Latenz, Leitungs- und Retransmission-Kosten, Korrektheit und Kalibrierung, Szenario für Szenario.',
        },
        'g-provider': {
            term: 'Provider',
            def: 'Ein Gerät, das seine Verbindung mit dem Netzwerk teilt. Der Verkehr verlässt das Netzwerk über dieses Gerät.',
        },
        'g-pto': {
            term: 'PTO',
            def: 'Probe Timeout: der Punkt, an dem ein TCP-Sender aufhört zu warten und nach verlorenen Daten sondiert.',
        },
        'g-race-mode': {
            term: 'Race-Modus',
            def: 'Ein Go-Build mit eingeschaltetem Race Detector. Er läuft langsamer und findet Data Races.',
        },
        'g-rpc': {
            term: 'RPC',
            def: 'Remote Procedure Call. Geräte-RPC ist der lokale Kanal des SDK zwischen der App und ihrem Netzwerkdienst auf demselben Gerät.',
        },
        'g-rtt': { term: 'RTT', def: 'Round-Trip-Time: wie lange eine Nachricht hin und zurück braucht.' },
        'g-sdk': {
            term: 'SDK',
            def: 'Das Software-Kit von URnetwork, auf dem die Apps aufbauen. Es führt Connect auf dem Gerät aus.',
        },
        'g-syn': { term: 'SYN', def: 'Das erste Paket einer neuen TCP-Verbindung.' },
        'g-synctest': {
            term: 'synctest',
            def: 'Das Go-Testpaket, das Code auf einer simulierten Uhr ausführt, sodass das Timing bei jedem Lauf identisch ist.',
        },
        'g-ttfb': {
            term: 'TTFB',
            def: 'Time to First Byte: wie lange es dauert, bis das erste Byte einer Antwort ankommt.',
        },
        'g-tun': {
            term: 'TUN',
            def: 'Eine virtuelle Netzwerkschnittstelle. Full-TUN-Tests schicken den Verkehr durch den gesamten Tunnel.',
        },
        'g-websocket-masking': {
            term: 'WebSocket-Maskierung',
            def: 'Die XOR-Verschleierung, die ein WebSocket-Client auf alles anwenden muss, was er sendet.',
        },
        'g-window': {
            term: 'Fenster',
            def: 'Wie viele Daten unterwegs sein dürfen, bevor der Sender auf eine Bestätigung wartet. cwnd ist das Überlastfenster (Congestion Window).',
        },
    },
    description: 'Warum URs Netzwerkforschung zählt, ihr Gigabit-Klasse-Meilenstein, 39 gemessene Änderungen (24. Aug. – 24. Okt. 2026) und die Reichweite jeder Verbesserungsart.',
    toc: {
        title: 'Auf dieser Seite',
        labels: {
            report: 'Einleitung',
            glance: 'Auf einen Blick',
            why: 'Warum es zählt',
            timeline: 'Zeitleiste',
            'month-aug': 'August',
            'month-sep': 'September',
            'month-oct': 'Oktober',
            methods: 'Methoden',
            milestones: 'Meilensteine',
            milestone: 'Durchsatz der Gigabit-Klasse',
            details: 'Details',
            end: 'Von Anfang bis Ende',
            instruments: 'Instrumente',
            open: 'Offene Fragen',
            glossary: 'Glossar',
        },
    },
    sectionsAria: 'Abschnitte dieser Seite',
    intro: {
        eyebrow: 'Forschung · Bericht',
        datesNote: 'Die Datumsangaben sind die der Forschungsaufzeichnungen; sie können vom Datum des Merges abweichen.',
        updated: 'Aktualisiert am {date}.',
        glance: 'Auf einen Blick',
        kpiNote: 'Jede Zahl gehört zu ihrer eigenen Workload. Sie lassen sich nicht zu einer Beschleunigung der App addieren oder multiplizieren, und der Bericht behauptet keine solche.',
        kpiNoteLink: 'Warum es keine einzelne Zahl gibt',
        entriesByDate: { one: 'Der {count} Eintrag, nach Datum', other: 'Die {count} Einträge, nach Datum' },
        legendAria: 'Markierungen',
        why: 'Warum es zählt',
        openLink: 'Was noch nicht gezeigt ist',
    },
    months: {
        aug: { name: 'August', label: 'Aug.' },
        sep: { name: 'September', label: 'Sept.' },
        oct: { name: 'Oktober', label: 'Okt.' },
    },
    monthSpan: '{from}.–{to}. {month}',
    timeline: {
        eyebrow: 'Zeitleiste',
        title: { one: '{count} Änderung oder Experiment', other: '{count} Änderungen und Experimente' },
        intro: [
            'Jeder Eintrag beginnt mit seinem Ergebnis in einfachen Worten und einer Zahl. Öffne ihn für die genauen Messungen, ihre Bedeutung für die Testsuites und die Belege. Einträge, die verworfen wurden oder keinen Unterschied machten, bleiben auf der Zeitleiste und sind als solche markiert.',
            'Die Anzeigen spielen die Belege beim Lesen nach. Jede bewegt sich erst, wenn du den Eintrag erreichst, der sie aufgezeichnet hat, und keine wird je mit einer anderen kombiniert.',
        ],
        final: 'Wo die Anzeigen endeten',
        railAria: 'Die Anzeigen, Stand des Eintrags, den du gerade liest',
        monthEntries: { one: '{count} Eintrag', other: '{count} Einträge' },
        byKind: '{month} nach Art',
    },
    entry: {
        noSpeedClaim: 'Keine Geschwindigkeitsaussage',
        alsoRejected: 'Ebenfalls verworfen:',
        moves: 'Bewegt',
        more: 'Genaue Zahlen und was sie bedeuten',
        inReport: 'Im Bericht',
        measured: 'Gemessen',
        suites: 'Was es für die Testsuites bedeutet',
        evidence: 'Belege',
        private: '(privat; hier zusammengefasst)',
        commit: 'Commit {sha} in connect',
    },
    milestone: {
        changed: 'Was sich geändert hat',
        impact: 'Erfasste Wirkung und Stärke der Belege',
        experiment: 'Experiment',
        result: 'Vorher → nachher',
        establishes: 'Was es belegt',
        inReport: 'Im Bericht',
        chart: {
            aria: 'Host-TCP-Pfad, ein Balken pro Sekunde: {first} Mbps in der ersten Sekunde, dann {lo}–{hi} Mbps in den nächsten neun; Zehn-Sekunden-Mittel {mean} Mbps, bei einem 1-Gbps-Anschluss',
            service: '1-Gbps-Anschluss',
            steady: '{lo}–{hi} pro Sekunde',
            second: '{n} s',
            axis: 'Mbps, Nutzdaten',
            mean: 'Zehn-Sekunden-Mittel {mean}',
        },
    },
    end: {
        eyebrow: 'Von Anfang bis Ende',
        title: 'Wie weit jede Art von Verbesserung reichte',
        intro: 'Die eigenen Schätzungen des Berichts, Achse für Achse, mit der Konfidenz, die jede verdient.',
        confidence: 'Konfidenz',
        inReport: 'Im Bericht',
        evidence: 'Belege von Anfang bis Ende',
        estimate: 'Schätzung und Konfidenz',
        quote: '„{text}“',
        cite: 'Die eigene Zusammenfassung des Berichts in einem Satz',
    },
    methods: {
        eyebrow: 'Methoden',
        title: 'Wie geforscht wurde',
        intro: 'Das Programm bewegte sich vom explorativen Tuning hin zu Tests, die konkurrierende Ursachen auseinanderhalten. Jede Methode hat eine kurze schematische Animation, und das Beispiel daneben stammt aus der Zeitleiste.',
        seenIn: 'Zu sehen in',
        seen: '{date}: {title}',
        inReport: 'Im Bericht',
        runIn: '{title}.',
    },
    instruments: {
        eyebrow: 'Instrumente',
        title: 'Was sich an den Tests selbst geändert hat',
        intro: 'Die Testabdeckung hat sich deutlich verbessert, auch dort, wo die Performance noch offen ist.',
        inReport: 'Im Bericht',
    },
    open: {
        eyebrow: 'Offene Fragen',
        title: 'Was noch nicht gezeigt ist',
        intro: 'Eine kumulative Verbesserung der App-Geschwindigkeit oder der Akkulaufzeit wird nicht behauptet. Dies sind die Lücken, die die nächste Qualifizierung schließen muss.',
        latest: 'Das neueste Ergebnis, zusammengefasst',
    },
    glossary: {
        eyebrow: 'Glossar',
        title: 'Begriffe in diesem Bericht',
        source: 'Quelle: {link}, im Repository urnetwork/connect.',
        sourceNote: 'Seine Texte sind hier aus dem Englischen übersetzt; jede Zahl ist unverändert und ungerundet daraus übernommen; Prozentwerte und Verhältnisse stehen nur dort, wo der Bericht sie nennt.',
        updated: 'Aktualisiert am {date}.',
    },
    meter: {
        asOf: 'Stand',
        start: 'Beginn',
        count: '{index} von {total}',
        loadFinalShort: '4,7–7,3× ggü. 24. Aug.',
        loadFinal: '4,7–7,3× schneller als am 24. Aug., geringe Konfidenz',
        none: 'Noch keine Messung',
        loadSub: '{label}, {date}',
        bulkFrom: 'von etwa {from}, {x}',
        otherReadings: { one: '{count} weiterer Messwert', other: '{count} weitere Messwerte' },
        phone: 'Telefon',
        publicRoute: 'öffentliche Route',
        loadNote: 'ms, niedriger ist schneller',
        hideRest: 'Rest ausblenden',
        more: { one: '{count} weitere', other: '{count} weitere' },
        earlier: { one: 'und {count} frühere', other: 'und {count} frühere' },
        loadAria: 'Mediane Ladezeiten von Wikipedia auf logarithmischer Skala, mit den Baselines vom 24. Aug.',
        baselines: 'Baselines vom 24. Aug.',
        baselinesAria: 'Baselines vom 24. Aug., {a} und {b} ms',
        baselinesValue: '{a} und {b} ms',
        baselinesTip: 'Baselines vom 24. Aug.: die explizite H1-Kontrolle und die gebündelte Low-Bar-Baseline',
        thousands: '{n}K',
        msValue: '{value} ms',
        pointAria: '{value} ms, {label}, {date}',
        bulkAria: 'Übertragungsrate in Mbps auf logarithmischer Skala: der kontrollierte H1-Pfad sowie öffentliche und Telefon-Messwerte',
        controlled: 'kontrollierter H1-Pfad',
        readings: 'öffentliche und Telefon-Messwerte',
        controlledAria: 'kontrollierter H1-Pfad, von etwa {from} auf {to} Mbps',
        controlledTip: 'etwa {from} → {to} Mbps ({x})',
        controlledRuns: 'Läufe {runs} Mbps',
        mbpsValue: '{value} Mbps',
        bulkPointAria: '{value} Mbps, {label}, {date}',
        pathAria: 'Die größten Beschleunigungen auf dem Paketpfad und bei den Fenstern, jede einzeln gemessen',
        memoryAria: 'Die drei Speicherreduktionen, die der Bericht hervorhebt, jede bei ihrem eigenen Besitzer',
        barAria: '{label}: {value}, {date}',
        listItem: '{label}: {value}',
    },
    dock: { menu: '— Abschnitte dieser Seite' },
    glance: {
        aria: {
            one: 'Der {count} Eintrag vom 24. August bis 24. Oktober, nach Datum',
            other: 'Die {count} Einträge vom 24. August bis 24. Oktober, nach Datum',
        },
        axis: { aug: 'AUG.', sep: 'SEPT.', oct: 'OKT.', end: '24. OKT.' },
        mark: '{date}, {kind}: {title}',
        tip: '{date} · {kind}',
    },
    termTip: 'Im Glossar',
    figure: { play: 'Abspielen', pause: 'Pause', playAria: 'Animation abspielen', pauseAria: 'Animation anhalten' },
    scenes: {
        owners: {
            steps: [
                'Das Ganze messen',
                'Nach Besitzer aufteilen',
                'Den Besitzer finden, der nicht da sein sollte',
                'Ihn freigeben, den Rest behalten',
            ],
            heap: 'Heap nach dem Test',
            parts: {
                live: 'Live-Daten',
                free: 'Freilisten',
                slack: 'Verschnitt',
                goroutines: 'Goroutinen',
                stale: 'alter Reader',
            },
            staleNote: 'geschlossene Endpunkte halten noch 128-KiB-Arrays',
            released: 'freigegeben; der übrige Heap bleibt unverändert',
        },
        boundary: {
            steps: [
                'Einer langsamen ersten Seite folgen',
                'Jede Stufe auf ihrem Weg timen',
                'Das meiste Warten liegt bei DNS',
                'Eine ungemessene Stufe ist unbekannt, nicht null',
            ],
            stages: { dns: 'DNS', tcp: 'TCP', admit: 'Zulassen', carrier: 'Carrier', reply: 'Antwort' },
            axis: 'erste Seite, Zeit pro Stufe',
            dns: 'DNS 18,103 s',
            total: '33,044 s insgesamt',
            unknown: 'nicht instrumentiert: unbekannt, nicht null',
        },
        deterministic: {
            steps: [
                'Die Uhr festsetzen',
                'Den alten Code dreimal laufen lassen',
                'Er scheitert in jedem Lauf am selben Tick',
                'Den Fix auf derselben Uhr laufen lassen',
                'Er besteht an diesem Tick',
            ],
            clock: 'feste Uhr',
            rows: ['alt, Lauf 1', 'alt, Lauf 2', 'alt, Lauf 3', 'der Fix'],
            held: 'Queue gehalten',
            failed: 'gleicher Fehler, gleicher Tick, jeder Lauf',
            passed: 'der Fix besteht an diesem Tick',
        },
        ablation: {
            steps: [
                'Mit allem eingeschaltet laufen lassen',
                'Nur den Drain abschalten',
                'Nur das Pacing abschalten',
                'Behalten, was nötig war, festhalten, was scheiterte',
            ],
            change: 'Änderung',
            switches: { pacing: 'Pacing', drain: 'Drain', resizing: 'Fensteranpassung' },
            keptOn: 'bleibt an',
            test: 'Browsing-Test mit 100 Seiten',
            stopped: 'nach 49 Seiten gestoppt',
            stillFailed: 'erneut Fehler',
            running: 'läuft',
            passed: '100 von 100 Seiten',
            record: 'das Protokoll',
            rows: { all: 'alles an', drain: 'nur Drain aus', pacing: 'nur Pacing aus' },
            stoppedShort: 'Stopp bei 49 S.',
            passedShort: '100 von 100',
        },
        layers: {
            steps: [
                'Das Teil messen',
                'Socket und Carrier messen',
                'Den ganzen Tunnel messen',
                'Der Gewinn kam nicht an, also wurde er nicht übernommen',
            ],
            rows: [
                { l: 'Browser auf dem Telefon', u: 'Wikipedia, Fast.com', res: 'unerreicht' },
                { l: 'Full-TUN-Simulator', u: 'Verlust, RTT, MTU', res: 'kein Gewinn' },
                { l: 'Socket und Carrier', u: 'MB/s über TLS', res: '+3,52%' },
                { l: 'Mikrobenchmark', u: 'ns pro Op', res: 'schneller' },
            ],
        },
        noise: {
            steps: [
                'Identischen Code zweimal laufen lassen',
                'Ihre Streuung ist das Rauschen',
                'Alt und neu in frischen Prozessen verschränken',
                'Ein kleiner Unterschied bleibt im Rauschen',
                'Nur ein Effekt darüber hinaus zählt',
            ],
            band: 'A/A-Rauschen',
            axis: 'Durchsatz',
            order: 'Reihenfolge',
            fresh: 'neu',
            noVerdict: 'kein Urteil',
            effect: 'ein Effekt',
        },
        validity: {
            steps: [
                'Jeden Versuch festhalten',
                'Die Fehlschläge wegzulassen, würde den Median schönen',
                'Also wird nichts weggelassen',
                'Der Median zählt jeden Versuch',
            ],
            axis: 'Zeit pro Lauf, jeder Versuch',
            deadline: 'Frist',
            survivor: 'Rest-Median: wirkt schneller',
            notAllowed: 'nicht erlaubt',
            all: 'Median aller Versuche',
        },
    },
};
