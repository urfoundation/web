// /dashboard's How we count tab in German: the translation of en.js beside it (same keys).
// {d1} … {d90} are the period buttons (1T … 90T); "Jetzt" is the word that starts the live
// points' labels in the charts' tooltips (dashboard/script chart.nowOnline, chart.nowLast24).
export default {
    headings: {
        usersPerEpoch: 'Nutzer pro Epoche',
        networksAndSignups: 'Netzwerke und Registrierungen',
        hourlyDataCarried: 'Übertragene Daten pro Stunde',
        countriesAndCities: 'Länder und Städte',
        change: 'Veränderung',
        payoutEpochs: 'Auszahlungsepochen',
        operatorDeposits: 'Einlagen der Betreiber',
        periods: 'Zeiträume',
        sources: 'Quellen',
    },

    defs: {
        // Network
        dataCarried: 'Daten, die das Netzwerk für seine Nutzer überträgt, gezählt vom Monitoring des Betreibers. Die große Zahl gilt für die letzten 24 Stunden. Darunter stehen die Summe und der Tagesdurchschnitt des Zeitraums. Durchschnitte in Gb/s verteilen die Datenmenge gleichmäßig über den Zeitraum.',
        dailyUsers: 'Konten, die in einem 24-Stunden-Fenster Daten übertragen haben. Ein gehosteter Proxy und die Clients dahinter zählen als ein Konto. Die große Zahl gilt für die letzten 24 Stunden und wird beim Öffnen der Seite gelesen. Der Durchschnitt des Zeitraums steht darunter und erscheint als gestrichelte Linie im Diagramm.',
        usersPerEpoch: 'Konten, die in einer Epoche, dem 7-tägigen Auszahlungszeitraum von SN25, Daten übertragen haben, jedes einmal gezählt, unabhängig davon, an wie vielen Tagen es aktiv war.',
        networksAndSignups: 'Ein Netzwerk ist ein Konto. Ein Konto kann mehrere Geräte verbinden. Registrierungen sind die im Zeitraum angelegten Netzwerke.',
        whenTrafficFlows: 'Der durchschnittliche Tag des Zeitraums, Stunde für Stunde, in Ortszeit. Der stündliche Verlauf stammt aus dem Durchsatz und ist so skaliert, dass die 24 Stunden zusammen einen durchschnittlichen Tag an übertragenen Daten ergeben.',
        hourlyDataCarried: 'In den Ansichten {d1} und {d3} sind die letzten 24 Stunden und die 48 davor gemessene Summen. Jede Stunde erhält ihren Anteil an der jeweiligen Summe im Verhältnis zu ihrem Durchsatz.',
        runningTotal: 'Die übertragenen Daten, Tag für Tag aufsummiert ab dem ersten Tag, den unsere Statistik erfasst.',
        // Providers
        providersOnline: 'Geräte, die ihre Verbindung teilen. Die große Zahl ist die Anzahl der Geräte, die jetzt online sind. Darunter stehen der Durchschnitt und der Höchstwert des Zeitraums, der Durchschnitt auch als gestrichelte Linie im Diagramm.',
        countriesAndCities: 'Wo Provider sind, nie wo Nutzer sind. Standorte werden nach Land angezeigt, und kein Provider wird einzeln gezeigt.',
        change: 'Die aktuelle Anzahl im Vergleich zur Anzahl zu Beginn des Zeitraums. Wo unsere Statistik nicht so weit zurückreicht, wird keine Veränderung angezeigt.',
        // SN25
        payoutEpochs: 'SN25 rechnet Auszahlungen alle 7 Tage ab (50.400 Blöcke). Nutzer und übertragene Daten pro Epoche verwenden dieselben Grenzen.',
        // {link} is the link ur.xyz/mainnet
        earned: 'Alpha, das Provider in abgeschlossenen Epochen und in der aktuellen, noch laufenden Epoche aus den Miner-Emissionen des Subnets verdient haben. Es wird als ausstehend angezeigt, bis die Auszahlung als bezahlt bestätigt ist; Provider beanspruchen es selbst. Der Auszahlungsplan steht auf {link}. Die Epochen 0 und 1 waren Testepochen, in denen Provider noch in USDC bezahlt wurden.',
        operatorDeposits: 'Alpha, das Netzbetreiber für den Datenverkehr, den sie nutzen, in SN25 einzahlen.',
        reserve: 'Eine von einem Multisig-Konto (2 von 3) gehaltene Wallet, die über zwei eigene Hotkeys einen Teil der Provider-Emissionen von SN25 erhält und Netzkapazität finanziert.',
        // More stats
        throughput: 'Daten, die pro Sekunde durch das Netzwerk fließen, gezählt auf jedem Hop einer Route; daher liegt der Wert über den übertragenen Daten.',
    },

    periods: '{d1} und {d3} enden mit der letzten vollen Stunde, in Schritten von 1 bzw. 6 Stunden. {d7}, {d30} und {d90} verwenden volle UTC-Tage und enden mit dem letzten vollen Tag. Jede Veränderung bezieht sich auf den gleich langen Zeitraum direkt davor. Mit „Jetzt“ markierte Werte sind live und hängen nicht vom Zeitraum ab. Uhrzeiten sind in Ortszeit angegeben.',

    sources: {
        chainName: 'Bittensor-Mainnet',
        grafana: 'Netzwerk- und Provider-Zahlen aus dem Monitoring von BringYour, mit 90 Tagen Verlauf',
        chain: 'Auszahlungsepochen, die Reserve und ihre Hotkeys, gelesen über die öffentlichen Nodes von Bittensor',
        // {time}: "Do., 12. Nov., 14:05 Uhr Ortszeit" (dashboard/script time.local)
        note: 'Die Zahlen werden bei jedem Öffnen der Seite aus diesen Quellen gelesen (zuletzt gelesen am {time}). Eine Kopie der Tagessummen wird zusammen mit der Website gespeichert, sodass die Diagramme weiter zurückreichen können als die 90 Tage von Grafana.',
    },
};
