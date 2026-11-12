// /mainnet in German: the translation of en.js beside it (the milestones, from data/mainnet-timeline.json). Same
// keys as en.js; after changing a translation, run
// `node tests/i18n-staleness.mjs --unit mainnet/timeline --accept de <key> ...` from react/.
export default {
    events: {
        'provider-earnings-move-to-sn25': {
            title: 'Provider-Einnahmen wechseln zu SN25',
            detail: 'Einnahmen aus Verträgen, die nach diesem Stichtag abgerechnet werden, werden über SN25 ausgezahlt. Die bisherigen Auszahlungen in USDC decken nur frühere Einnahmen ab.',
            sources: [],
        },
        'v1-contracts-deployed': {
            title: 'Verträge der Version 1 bereitgestellt',
            detail: 'Acht Bereitstellungsschritte auf der EVM von Bittensor, in den Blöcken 9,239,983 bis 9,240,067. Der Koordinator, um 18:08 UTC erstellt, startet Epoche 0.',
            sources: [
                'Koordinator',
                'Koordinator-Implementierung',
                'Abrechnungstresor',
                'Reserve-Senke',
                'Validator-Nachweise',
                'Reserve-Senke erstellt, Block 9,239,983',
                'Abrechnungstresor erstellt, Block 9,239,994',
                'Koordinator-Implementierung erstellt, Block 9,240,004',
                'Treuhand registriert, Block 9,240,015',
                'Koordinator erstellt, Epoche 0 beginnt, Block 9,240,028',
                'Reserve-Senke mit dem Koordinator verknüpft, Block 9,240,039',
                'Tresor mit dem Koordinator verknüpft, Block 9,240,049',
                'Validator-Nachweise erstellt, Block 9,240,067',
            ],
        },
        'network-operator-registered': {
            title: 'Netzbetreiber 1 registriert',
            detail: 'Der Governance-Safe registriert den UR-Betreiber, Netzbetreiber 1, und seinen Pool, SN25 UID 169.',
            sources: [
                'Registrierung über den Governance-Safe, Block 9,240,168',
                'Governance-Safe',
                'Governance-Safe erstellt, Block 9,229,341',
            ],
        },
        'v1-validator-activated': {
            title: 'Validator der Version 1 aktiviert',
            detail: 'Der einzige Validator von SN25, UID 1, veröffentlicht seine Aktivierung für Epoche 1 on-chain.',
            sources: [
                'Aktivierung, Block 9,240,402',
            ],
        },
        'weekly-epochs-scheduled': {
            title: 'Wöchentliche Epochen festgelegt',
            detail: 'Der Governance-Safe legt ab Epoche 1 Epochen von 7 Tagen mit 50,400 Blöcken fest.',
            sources: [
                'Epochenplan über den Governance-Safe, Block 9,240,407',
                'Governance-Safe',
            ],
        },
        'operator-settlement-enabled': {
            title: 'Abrechnung des Netzbetreibers eingeschaltet',
            detail: 'Die Server des Netzbetreibers schalten die SN25-Abrechnung im Mainnet ein.',
            sources: [],
        },
        'client-key-registration-live': {
            title: 'Signierte Registrierung von Client-Schlüsseln live',
            detail: 'Die ersten Provider registrieren ihre Client-Schlüssel mit einer Signatur für SN25.',
            sources: [],
        },
        'epoch-1-begins': {
            title: 'Epoche 1 beginnt: die erste Auszahlungsepoche',
            detail: 'Die erste wöchentliche Auszahlungsepoche, für die der Validator der Version 1 aktiviert wurde, beginnt mit Block 9,247,228.',
            sources: [
                'Erster Block von Epoche 1, 9,247,228',
            ],
        },
        'last-usdc-payout-batch': {
            title: 'Letzte Runde der USDC-Auszahlungen',
            detail: 'Die letzte Runde der bisherigen Auszahlungen in USDC an Provider.',
            sources: [],
        },
        'bittensor-runtime-478': {
            title: 'Bittensor-Runtime 478 im Mainnet',
            detail: 'Die Chain wird erneut aktualisiert, nach Runtime 477 am 12. Oktober. Die Verträge von Settlement v2 haben ihre Generalprobe auf Runtime 478 bestanden.',
            sources: [
                'Upgrade auf Runtime 478, Extrinsic 9276925-0010',
                'Upgrade auf Runtime 477 am 12. Oktober, Extrinsic 9267632-0020',
            ],
        },
        'settlement-v2-moved-to-epoch-3': {
            title: 'Start von Settlement v2 auf Epoche 3 verschoben',
            detail: 'Der Subnet-Eigentümer verschiebt den Start von Settlement v2 von Epoche 2 auf Epoche 3.',
            sources: [],
        },
        'settlement-v2-gas-policy': {
            title: 'Gas-Richtlinie für Settlement v2 eingerichtet',
            detail: 'Die Server des Netzbetreibers laden die Gas-Richtlinie für die Epochenabschlüsse von Settlement v2.',
            sources: [],
        },
        'settlement-v2-release-checks': {
            title: 'Release von Settlement v2 bis zum 16. Oktober nicht fertig',
            detail: 'Das Release von Settlement v2 hatte bis zum Morgen des 16. Oktober seine abschließenden Prüfungen nicht bestanden, daher hielten die danach geplanten Rollout-Termine nicht. Das Release ging vom 22. bis 25. Oktober hinaus, zu spät für Epoche 3.',
            sources: [],
        },
        'epoch-1-closes': {
            title: 'Epoche 1 schließt mit Version 1',
            detail: 'Epoche 1 wurde in Block 9,297,631 abgeschlossen, innerhalb ihres Abschlussfensters von 120 Blöcken, und der Abrechnungstresor nahm ihre 3,482.26 α auf. Epoche 1 hatte keine auszahlbare Arbeit, daher wurde bis Block 9,298,828 kein Auszahlungs-Root festgeschrieben, und ihre Finanzierung wurde übertragen (siehe die Mitteilung zu Epoche 3 oben).',
            sources: [
                'Abschluss von Epoche 1, Block 9,297,631',
            ],
        },
        'first-v1-claims': {
            title: 'Epoche 1 ohne Auszahlungs-Root finalisiert',
            detail: 'Epoche 1 hatte keinen Auszahlungs-Root und daher keine Claims unter Version 1. Ihre 3,482.26 α wurden nach der Missed-Commit-Regel des Protokolls übertragen und werden mit der Finanzierung von Epoche 3 zurückgewonnen (siehe die Mitteilung zu Epoche 3 oben).',
            sources: [
                'Epoche 1 finalisiert, Block 9,312,031',
            ],
        },
        'v2-pool-registration-window': {
            title: 'Settlement v2 für Epoche 3 nicht registriert',
            detail: 'Im Fenster, den Blöcken 9,333,628 bis 9,340,828, wurde kein v2-Pool registriert, daher bleibt Epoche 3 bei Version 1. Eine Registrierung kann keine Epoche aktivieren, die bereits begonnen hat.',
            sources: [],
        },
        'v2-validator-starts': {
            title: 'Validator von Settlement v2 startet, v2 aus',
            detail: 'Der Validator startete sein Release von Settlement v2 mit unveränderten Einstellungen.',
            sources: [],
        },
        'v2-contracts-deployed': {
            title: 'Verträge von Settlement v2 bereitgestellt',
            detail: 'Sechs Bereitstellungsschritte auf der EVM von Bittensor, in den Blöcken 9,344,278 bis 9,344,859, brachten vault2, das die Mittel hält, STSettlement2 und einen Claim-Batcher neben den unveränderten Verträgen der Version 1 on-chain. Ihre Bereitstellung aktiviert Settlement v2 nicht: Der v2-Pool muss außerdem registriert werden.',
            sources: [
                'vault2',
                'STSettlement2',
                'Erste Implementierung von STSettlement2',
                'Claim-Batcher',
                'vault2 erstellt, Block 9,344,278',
                'Treuhand registriert, Block 9,344,278',
                'Implementierung von STSettlement2 erstellt, Block 9,344,354',
                'STSettlement2 erstellt, Block 9,344,841',
                'vault2 mit STSettlement2 verknüpft, Block 9,344,851',
                'Claim-Batcher erstellt, Block 9,344,859',
            ],
        },
        'validator-adopts-v2-settings': {
            title: 'Validator übernimmt seine Einstellungen für Settlement v2',
            detail: 'Der Validator startete mit seinen Einstellungen für Settlement v2 neu, nachdem die v2-Verträge an jenem Morgen bereitgestellt worden waren.',
            sources: [],
        },
        'epoch-3-begins-on-v1': {
            title: 'Epoche 3 beginnt mit Version 1',
            detail: 'Epoche 3 beginnt mit Block 9,348,028 ohne registrierten v2-Pool, daher rechnet Version 1 sie ab. Epoche 2 wurde nicht in ihrem Abschlussfenster von 120 Blöcken abgeschlossen, daher wurde ihre Emission auf den Abschluss von Epoche 3 verschoben.',
            sources: [
                'Erster Block von Epoche 3, 9,348,028',
                'Emission von Epoche 2 verschoben, Block 9,348,551',
            ],
        },
        'operator-services-updated': {
            title: 'Dienste des Netzbetreibers aktualisiert, v2 aus',
            detail: 'Die Dienste des Netzbetreibers wechselten auf das Release von Settlement v2, mit noch ausgeschaltetem v2: der Dienst api am 23. Oktober, die übrigen am 24. Oktober.',
            sources: [],
        },
        'connect-service-updated': {
            title: 'Dienst connect aktualisiert, v2 aus',
            detail: 'Der Dienst connect des Netzbetreibers wechselte zusammen mit seinen anderen Diensten auf das Release von Settlement v2.',
            sources: [],
        },
        'v2-pool-registered': {
            title: 'Pool von Settlement v2 registriert',
            detail: 'Der Governance-Safe registrierte den Pool von Netzbetreiber 1 am 29. Oktober um 03:11 UTC im v2-Tresor, bevor Epoche 4 begann, mit Epoche 4 als seiner ersten v2-Epoche. Das war die Aktivierung von Settlement v2.',
            sources: [
                'Registrierung über den Governance-Safe, Block 9,386,659',
            ],
        },
        'operator-switches-to-v2-contracts': {
            title: 'Netzbetreiber wechselt auf die v2-Verträge',
            detail: 'Die Server des Netzbetreibers auf allen sechs seiner Hosts wechselten noch vor der Registrierung des v2-Pools auf die Verträge von Settlement v2.',
            sources: [],
        },
        'last-v1-claims': {
            title: 'Epoche 2 ohne Auszahlungs-Root finalisiert',
            detail: 'Epoche 2 wurde nicht in ihrem Abschlussfenster abgeschlossen, daher blieb ihre Emission im Pool und wurde beim Abschluss von Epoche 3 aufgenommen: Die 4,132.72 α von Epoche 3 decken etwa zwei Wochen ab. Ohne Finanzierung und ohne Auszahlungs-Root hatte Epoche 2 keine Claims unter Version 1.',
            sources: [
                'Epoche 2 finalisiert, Block 9,362,431',
            ],
        },
        'settlement-v2-active': {
            title: 'Settlement v2 aktiv: Epoche 4 beginnt',
            detail: 'Ab Block 9,398,428 zahlt Settlement v2 Epoche 4 und jede Epoche danach. Epoche 3 wurde mit Version 1 ohne Auszahlungs-Root abgeschlossen; ihre Finanzierung wird zurückgewonnen (siehe die Mitteilung zu Epoche 3 oben).',
            sources: [
                'Erster Block von Epoche 4, 9,398,428',
            ],
        },
        'last-v1-claims-epoch-3': {
            title: 'Epoche 3 ohne Auszahlungs-Root finalisiert',
            detail: 'Der Auszahlungs-Root von Epoche 3 wurde nicht in seinem Fenster festgeschrieben, daher hatte sie keine Claims unter Version 1. Ihre 4,132.72 α wurden zusammen mit den 3,482.26 α von Epoche 1 übertragen, und beide werden zurückgewonnen (siehe die Mitteilung zu Epoche 3 oben).',
            sources: [
                'Epoche 3 finalisiert, Block 9,412,831',
            ],
        },
        'settlement-v2-timelock': {
            title: 'Änderungen an Settlement v2 warten jetzt 72 Stunden',
            detail: 'Der Vertrag von Settlement v2, der die Auszahlungen ausführt, gehört jetzt einem Timelock. Jede Änderung daran, etwa ein Upgrade, ein neuer Kreis von Prüfern oder die Aufnahme zurückgewonnener Mittel in eine Epoche, wird on-chain angekündigt, wartet 72 Stunden und kann in dieser Zeit abgebrochen werden. Auszahlungs-Roots, Freigaben und Claims sind nicht betroffen.',
            sources: [
                'Timelock bereitgestellt',
                'Eigentum an den Timelock übertragen',
                'Timelock',
            ],
        },
        'first-v2-close-and-commit': {
            title: 'Erster Abschluss und erstes Festschreiben unter Settlement v2',
            detail: 'Epoche 4 endete mit Block 9,448,828. Ihr v2-Ledger-Root wurde in Block 9,449,034 festgeschrieben und vom Validator in Block 9,449,041 freigegeben.',
            sources: [
                'Erster v2-Ledger-Root',
                'Freigabe durch den Validator',
            ],
        },
        'epoch-3-recovery-root': {
            title: 'Recovery-Root schickt die Finanzierung der Epochen 1 und 3 in den v2-Tresor',
            detail: 'Ein einziger Root der Version 1 zahlt den gesamten Übertrag, 3,482.26 α aus Epoche 1 und 4,132.72 α aus Epoche 3, an den v2-Tresor. Er kann nach seiner 48-stündigen Anfechtungsfrist in den Tresor eingelöst werden, ab etwa dem 8. November, 18:25 UTC.',
            sources: [
                'Recovery-Root',
            ],
        },
        'first-v2-claim': {
            title: 'Erste Claims unter Settlement v2',
            detail: 'Der Root von Epoche 4, der erste v2-Root, wurde in Block 9,463,438 finalisiert, 14,404 Blöcke nach seinem Festschreiben, und die ersten Claims folgten in Block 9,463,447.',
            sources: [
                'Erster v2-Root finalisiert, Block 9,463,438',
                'Erste v2-Claims, Block 9,463,447',
            ],
        },
        'epoch-3-recovery-scheduled': {
            title: 'Zurückgewonnene Mittel nicht für Epoche 5 eingeplant',
            detail: 'Die Recovery erreichte den v2-Tresor am 8. November um 18:30 UTC. Ihre Aufnahme in die Auszahlung von Epoche 5 hätte bis etwa zum 10. November, 18:25 UTC, über den 72-Stunden-Timelock eingeplant werden müssen, um vor dem Abschluss von Epoche 5 wirksam zu werden. Sie wurde nicht eingeplant, daher werden die zurückgewonnenen Mittel nicht mit Epoche 5 ausgezahlt (siehe die Mitteilung zu Epoche 3 oben). Der Eintrag der Recovery im v2-Abrechnungsvertrag wurde am 6. November eingeplant und kann seit dem 9. November, 21:19 UTC, wirksam werden.',
            sources: [
                'Recovery-Root finalisiert, Block 9,463,231',
                'Recovery in den v2-Tresor eingelöst, Block 9,463,236',
                'Recovery in die Treuhand des v2-Tresors übernommen, Block 9,463,240',
                'Eintrag der Recovery eingeplant',
            ],
        },
        'fp2-modern-provider-gate': {
            title: 'Sperre für moderne Provider aufgegeben: Moderne Provider werden zuerst ausgewählt',
            detail: 'Die Sperre, die nur als modern verifizierte Provider zu „Qualität“ und „Geschwindigkeit“ zugelassen hätte, wurde nie eingeschaltet: Am 28. Oktober ersetzte der Subnet-Eigentümer sie durch Priorität. Innerhalb jeder Stufe werden als modern verifizierte Provider zuerst ausgewählt, und andere Provider füllen den Rest auf, sodass diese ihre Zugehörigkeit zu „Qualität“ und „Geschwindigkeit“ behalten. Die Priorität erreichte die Dienste des Netzbetreibers am selben Abend, von 22:37 bis 23:20 UTC.',
            sources: [],
        },
        'intra-traffic-billing-planned': {
            title: 'Verkehr im selben Netzwerk und im Modus „Freunde und Familie“ geht jetzt vom Datenguthaben ab',
            detail: 'Verkehr zwischen Geräten eines Netzwerks und Verkehr zu einem Provider im Modus „Freunde und Familie“ gehen jetzt, wie anderer Verkehr, vom Datenguthaben des sendenden Netzwerks ab, im kostenlosen wie im bezahlten Tarif. Die Abrechnungsänderung, am 10. November vom Subnet-Eigentümer freigegeben, erreichte die Dienste des Netzbetreibers ab 05:43 UTC schrittweise, und alle bis 11:39 UTC. Provider im Modus „Freunde und Familie“ erhalten dafür wie bisher eine Gutschrift: Bezahlter und kostenloser Verkehr zählen gleich. Verträge, die vor der Änderung eröffnet wurden, werden nicht belastet.',
            sources: [
                'Die Änderung, WHITEPAPER.md §8.6.7',
            ],
        },
        'pro-grant-per-cycle': {
            title: 'Pro-Daten folgen dem eigenen Zyklus jedes Netzwerks, und die Provider-Subvention zählt ihre Einnahmen einmal',
            detail: 'Ab dem Server-Release des Netzbetreibers vom 11. November erhält ein Pro-Netzwerk sein volles monatliches Datenvolumen in seinem eigenen Monatszyklus, gezählt ab dem Tag, an dem sein Abonnement begann oder zuletzt verlängert wurde, und die Zuteilung jedes Zyklus trägt den Anteil dieses Zyklus an den Einnahmen des Abonnements. Die Provider-Subvention des Netzbetreibers zählt diese Einnahmen einmal, sobald der Verkehr, den die Zuteilung finanziert, abgerechnet wird. Bisher konnten die Einnahmen eines bezahlten Zeitraums doppelt zählen, voll über sein Guthaben von 600 GiB und noch einmal als Anteil über die monatliche Zuteilung am 1., und ein lange laufendes Abonnement über Google Play zählte nur mit einem Anteil, verteilt über die Monate seit seinem Beginn. SN25-Pool-Belohnungen werden wie bisher gezählt: Der Pool wird nach abgeschlossener Nutzung aufgeteilt, und Abonnementzahlungen fließen nicht ein. Für Verkehr seit dem Stichtag 6. Oktober zahlt die Provider-Subvention kein USDC aus und zählt nur für die wöchentlichen Punkte, die der Netzbetreiber vergibt. Ein Pro-Netzwerk, das die Zuteilung vom 1. November hat, erhält seine erste Zyklus-Zuteilung am 1. Dezember um 00:00 UTC, und nichts, was vor dem Release zugeteilt wurde, ändert sich. Kunden zahlen dasselbe.',
            sources: [
                'So werden Belohnungen gezählt, im Miner-Leitfaden',
                'Die vollständige Mitteilung im sn-Repo',
            ],
        },
        'extender-relay-share': {
            title: 'Extender erhalten ihren Anteil nur bei Verträgen, die sie weiterleiten können',
            detail: 'Ab dem Server-Release des Netzbetreibers vom 12. November ist ein Extender nur dann einer der Hops eines Vertrags und erhält seinen Anteil an dessen Nutzung, wenn er den Vertrag weitergeleitet haben kann, wie der Subnet-Eigentümer am 11. November entschieden hat. Eine Verbindung zählt als weitergeleitet, wenn sie von der Adresse eines Extenders kommt, und drei Arten kommen von dieser Adresse, ohne weitergeleitet zu sein: die eigene Verbindung des Extender-Hosts, andere Geräte aus dem eigenen Netzwerk des Extenders, die seine Adresse teilen, und Provider anderer Netzwerke, die sie teilen, während sie öffentlich bereitstellen, und sich immer direkt mit der Plattform verbinden. Diese machen den Extender nicht mehr zu einem Hop, sodass ihren Providern die gesamte Nutzung ihrer Verträge angerechnet wird, wo bisher einem Extender ein Anteil davon angerechnet wurde. Eine Verbindung von einer anderen Adresse aus dem IPv6-/64 eines Extenders, von der Hosts üblicherweise senden, zählt jetzt als von ihm weitergeleitet. Verträge, die vor dem Release erstellt wurden, behalten ihre Hops, und SN25-Pool-Belohnungen werden weiterhin nach abgeschlossener Nutzung aufgeteilt.',
            sources: [
                'Die vollständige Mitteilung im sn-Repo',
            ],
        },
        'epoch-5-claims-with-recovery': {
            title: 'Claims für Epoche 5',
            detail: 'Epoche 5 endet mit Block 9,499,228, und die Claims folgen nach ihrer Anfechtungsfrist von 14,400 Blöcken. Die zurückgewonnene Finanzierung der Epochen 1 und 3 ist nicht Teil der Auszahlung von Epoche 5: Ihre Aufnahme wurde nicht rechtzeitig eingeplant (siehe die Mitteilung zu Epoche 3 oben).',
            sources: [
                'Ledger-Root von Epoche 5',
            ],
        },
        'capture-the-flag-presence-sampling': {
            title: 'Capture the Flag: Präsenzmessung bis zum Ende von Epoche 6',
            detail: 'Bevor Epoche 6 mit Block 9,549,628 endet, beginnen die Server des Netzbetreibers, jeden Provider und Extender jede Viertelstunde zu erfassen: ob er online ist und die Prüfungen des Betreibers besteht, und in welchem Land er ist. Epoche 7 läuft dann vollständig als Schattenepoche: Nach ihrem Ende erstellt der Betreiber seine Teilnehmerliste, die Auslosung und die Auszahlungen aus den echten Messungen, ohne sie festzuschreiben, und veröffentlicht einen unsignierten Bericht, auf dem die Prüfungen des Validators laufen. Capture the Flag startet nur dann mit Epoche 8, wenn die Messung läuft, sobald Epoche 8 beginnt.',
            sources: [],
        },
        'demand-deposits-priced': {
            title: 'Signierter Preis geht live: Nachfrage-Einlagen ab Epoche 7',
            detail: 'Ab Block 9,549,628 zahlt der Netzbetreiber 0.010437 α pro GiB und 0.005218 α pro aktivem Nutzer von Epoche 6 ein, begrenzt auf 3,000 α pro Epoche, wie vom Subnet-Eigentümer in price.yml signiert (veröffentlicht am 3. November). Validatoren prüfen die Einlage jeder Epoche bei jedem Steuerungsdurchlauf dagegen, mit dem Validator-Release, das vor Epoche 7 erscheint. Solange die Einlage nicht dem entspricht, was die Nutzung der vorigen Epoche schuldet, erhält der Pool des Betreibers kein Gewicht.',
            sources: [
                'price.yml',
                'Der signierte Preis im sn-Repo',
                'Erster Block von Epoche 7, 9,549,628',
                'Erste bepreiste Einlage',
            ],
        },
        'capture-the-flag-pool-registration': {
            title: 'Pool für Capture the Flag über den 72-Stunden-Timelock registriert',
            detail: 'Bis etwa zum 22. November plant der Governance-Safe über den öffentlichen 72-Stunden-Timelock eine Operation ein: Sie aktualisiert STSettlement2 und registriert den Pool für Capture the Flag von Netzbetreiber 1, Pool 4,294,967,297, ab Epoche 8. Um den 25. November, zwei Tage vor Epoche 8, kann sie jeder ausführen, sobald ihre 72 Stunden vergangen sind. Der Pool belegt dann eine SN25-UID, früh genug, um Gewicht zu verdienen, bevor seine Immunität endet, unter einem Hotkey, der erst bei der Ausführung abgeleitet wird, sodass er während der 72-stündigen Wartezeit nicht öffentlich ist; eine fehlgeschlagene Ausführung läuft in einem späteren Block erneut, und wenn sie nicht vor dem Start von Epoche 8 laufen kann, startet Capture the Flag mit Epoche 9. Der Übertrags-Vertrag, der die Töpfe jeder Epoche in den Pool zurückführt, wird danach erstellt, und vault2, das die Mittel hält, ändert sich nicht. Um vor dem Start von Epoche 8 ausgeführt zu werden, muss die Operation bis etwa zum 24. November, 18:25 UTC, eingeplant sein.',
            sources: [
                'Timelock',
                'STSettlement2',
                'Operation eingeplant',
                'Operation ausgeführt: der Pool registriert',
                'Übertrags-Vertrag',
            ],
        },
        'extender-pool-epoch-8': {
            title: 'Extender-Pool für Verkehr innerhalb der Plattform und innerhalb eines Netzwerks, ab Epoche 8',
            detail: 'Ab Block 9,600,028, dem ersten von Epoche 8, zählt der Teil des Verkehrs jedes Vertrags, den kein Provider verdient, stattdessen für Extender. Das umfasst Verkehr zwischen einem Client und der Plattform des Netzbetreibers sowie Verkehr zwischen Geräten eines Netzwerks. Der Pool des Betreibers verteilt ihn gleichmäßig auf jeden /29-Block (IPv4) oder /48-Block (IPv6), der einen berechtigten Extender enthält, dann gleichmäßig auf die Extender darin, bis zur berechtigten Provider-Nutzung der Epoche, sodass Extender höchstens die Hälfte eines Pools verdienen. Ein Extender, der einen Vertrag trägt, behält seinen eigenen Anteil daran als einer der Hops des Vertrags, wie der Subnet-Eigentümer am 11. November entschieden hat. Am 10. November vom Subnet-Eigentümer freigegeben, tritt dies in Kraft, sobald der signierte Amendment-Eintrag vor dem Start von Epoche 8 veröffentlicht ist.',
            sources: [
                'Die Änderung, WHITEPAPER.md §8.6',
                'Signierter Amendment-Eintrag',
                'Erster Block von Epoche 8, 9,600,028',
            ],
        },
        'capture-the-flag-epoch-8': {
            title: 'Capture the Flag ab Epoche 8: zehn Slots in jedem Land',
            detail: 'Ab Block 9,600,028, dem ersten von Epoche 8, hat jeder Netzbetreiber neben seinem Provider-Pool einen zweiten Pool, Capture the Flag, der für die Präsenz in einem Land zahlt. Jedes der 249 Länder nach ISO 3166-1 hat pro Epoche fünf Provider-Slots und fünf Extender-Slots, jeder so viel wert wie die neue Finanzierung des Pools für die Epoche, geteilt durch 2,490. Ein Provider oder Extender nimmt an der Auslosung seines Landes teil, wenn er mindestens die Hälfte der Epoche online war, die Prüfungen des Betreibers bestanden und sich in diesem Land befunden hat und an ihrem Ende aktiv ist. Der Betreiber schreibt die Teilnehmerliste on-chain fest, und eine danach veröffentlichte drand-Runde lost bis zu fünf Gewinner pro Land und Rolle aus. Ein Slot ohne Gewinner wird in den Topf seines Landes übertragen, und jeder Gewinner erhält seinen eigenen Slot und ein Fünftel dieses Topfes. Der Provider-Pool erhält 9/10 des Anteils der Provider statt des gesamten Anteils, 1,076.26 α statt 1,195.84 α im Maßstab von Epoche 4, und 4/10, sobald Top-Level-Flotten gewichtet werden. Der Validator von UR, der die Stake-Mehrheit hält, gewichtet den Pool ab dem ersten Tempo von Epoche 8. Am 11. November vom Subnet-Eigentümer freigegeben, tritt dies in Kraft, sobald der signierte Amendment-Eintrag vor dem Start von Epoche 8 veröffentlicht ist.',
            sources: [
                'Das Design, CAPTURETHEFLAG.md',
                'Die vollständige Mitteilung im sn-Repo',
                'Signierter Amendment-Eintrag',
                'Erster Block von Epoche 8, 9,600,028',
            ],
        },
        'capture-the-flag-first-draw': {
            title: 'Auslosung und Root von Capture the Flag für Epoche 8',
            detail: 'Epoche 8 endet mit Block 9,650,428. Der Netzbetreiber schreibt seine Teilnehmerliste bis Block 9,651,028 fest, eine mindestens eine Minute später veröffentlichte drand-Runde lost die Gewinner aus, und der Root von Capture the Flag wird zusammen mit dem des Provider-Pools bis Block 9,651,628 festgeschrieben. Ist die Auslosung bis dahin nicht fertig, schreibt der Betreiber für Epoche 8 keine Liste fest: Jeder Slot wird in den Topf seines Landes übertragen, und die ersten Gewinner werden in Epoche 9 ausgelost.',
            sources: [
                'Teilnehmerliste von Epoche 8 festgeschrieben',
                'Root von Capture the Flag für Epoche 8',
            ],
        },
        'capture-the-flag-first-claims': {
            title: 'Erste Claims von Capture the Flag',
            detail: 'Die Claims von Capture the Flag für Epoche 8 öffnen, sobald der Validator ihren Root freigegeben hat und die Anfechtungsfrist von 14,400 Blöcken vergangen ist, etwa zur selben Zeit wie die Pool-Claims von Epoche 8. Das Validator-Release, das Roots von Capture the Flag prüft und freigibt, ist bis etwa zum 1. Dezember fällig, und die Freigabe bis zum Ende von Epoche 9, etwa am 11. Dezember, 18:25 UTC. Gewinner werden an die Auszahlungs-Wallet ausgezahlt, die der Provider-Pool bereits nutzt, und lösen im selben Einlöse-Ablauf ein. Bis zu den App-Releases, die es benennen, zeigt eine App ein Konto von Capture the Flag als „Pool 4294967297“ an und löst es wie jeden Pool ein.',
            sources: [
                'Erste Claims von Capture the Flag',
            ],
        },
    },
};
