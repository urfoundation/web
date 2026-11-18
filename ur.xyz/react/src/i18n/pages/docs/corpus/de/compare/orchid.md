---
title: UR-Miner vs. Orchid-Provider im Vergleich | UR
description: Ein UR-Miner auf Bittensor SN25 neben einem Orchid-Provider: was du betreibst, wie Belohnungen festgelegt werden, Staking, Open Source, wessen Verkehr.
published: 2026-11-18
---

# UR-Miner vs. Orchid-Provider

Fakten geprüft am 2026-11-18.

Diese Seite vergleicht nur Mechanismen: keine Verdienstzahlen, Prognosen oder Tokenpreise für eines der beiden Netzwerke. Orchid-Angaben stammen aus der [Orchid-Dokumentation](https://docs.orchid.com/en/latest/), dem [Orchid-Repository](https://github.com/OrchidTechnologies/orchid) und der [Datenschutzerklärung von Orchid](https://www.orchid.com/privacy-policy). UR-Angaben stammen aus [Einen Miner betreiben](/docs/miner), [Für das Mining bezahlt werden](/docs/miner/rewards) und [Forschungsmethodik](/research/methodology). Siehe auch [alle Netzwerke im Vergleich](/docs/compare). [Bittensor SN25 minen](/miners) behandelt die UR-Seite an einem Ort.

## Im direkten Vergleich

| | UR-Miner | Orchid |
| --- | --- | --- |
| Was du betreibst | Das Programm `provider` auf einem Linux-, macOS- oder Windows-Computer, der online bleibt, mit einer stabilen öffentlichen Adresse und eingehendem TCP-Port 443 für seinen Extender | Ein Provider-Server, im Ethereum-Verzeichnis von Orchid gelistet; Hardwareanforderungen nicht dokumentiert |
| Weitere Voraussetzungen | Ein Konto bei einem Netzwerkbetreiber und ein Bittensor-Coldkey | Im Verzeichnis gestaktes OXT |
| Wie Belohnungen festgelegt werden | Ein Anteil an der Miner-Emission des Subnetzes, proportional zu abgeschlossenem Verkehr mal gemessener Zuverlässigkeit; bezahlter und kostenloser Verkehr bringen gleich viel | Nutzer bezahlen Provider mit probabilistischen Nanozahlungen; Provider werden zufällig ausgewählt, gewichtet nach Stake |
| Auszahlungswert | α ($UR), als nativer α-Stake auf deinem Coldkey | Über die Nanozahlungen hinaus nicht dokumentiert |
| Wallet oder KYC | Ein Bittensor-Coldkey, den du mit einer signierten Erklärung nachweist; die zitierten Seiten beschreiben keine Identitätsprüfung | Ein Ethereum-Konto; keine Identitätsprüfung dokumentiert |
| Open-Source-Client | Der Leitfaden folgt dem Quellcode `sn/miner` auf GitHub | Ja, AGPL-3.0 |
| Verkehr, den du trägst | Internetverkehr für einen Netzwerkbetreiber, als dessen Exit | Verkehr von Orchid-VPN-Nutzern |
| Wer haftet | Auf den hier zitierten Seiten nicht behandelt; lies die Bedingungen deines Betreibers | Nicht dokumentiert |
| Daten und Deinstallation | Der Miner speichert seine Identität und Wallet-Historie in `~/.urnetwork`; die Deinstallation wird auf den zitierten Seiten nicht behandelt | Orchid sagt, es erfasse keine personenbezogenen Daten; das Löschen der App-Daten löscht die einzige Kopie |

## Wie sich die Belohnungen unterscheiden

Ein UR-Miner im Pool eines Betreibers verdient einen Anteil am Pool: abgeschlossene Nutzungsbytes mal Zuverlässigkeit, wobei Zuverlässigkeit Bestätigungen geteilt durch Zuweisungen ist. Validatoren messen diese Arbeit; es gibt keinen Preis pro Byte. Belohnungen werden pro Epoche gezählt, im Mainnet etwa eine Woche, und danach beansprucht.

Orchid ist ein Marktplatz von VPN-Providern, keine App zum Teilen privater Anschlüsse. Provider staken OXT und konkurrieren um Anfragen durch stake-gewichtete Zufallsauswahl. Nutzer zahlen mit Off-Chain-Tickets nach Lotterieart, die der Provider vor dem Bedienen prüft.

## Wo Orchid vorn liegt

- **Eine angegebene Lizenz:** Das Repository steht unter AGPL-3.0.
- **Datenumgang klar benannt:** Die Datenschutzerklärung von Orchid sagt, es würden keine personenbezogenen Daten erfasst.

## Worauf du bei UR verzichtest

- Eine Einrichtung per Kommandozeile, offene Ports und eine signierte Bittensor-Wallet-Erklärung.
- Beanspruchen nach dem Ende jeder Epoche, eingereicht mit einem Relayer-Schlüssel, der ein wenig TAO für Gas hält.
- Kein Preis, den du für deine Bandbreite festlegst.
- Die hier zitierten Seiten sagen nicht, wer für Exit-Verkehr einsteht; die Bedingungen deines Betreibers tun es.

## Worin sich UR unterscheidet

UR veröffentlicht, wie es Änderungen am Netzwerk misst, verworfene Ergebnisse eingeschlossen: siehe [Forschungsmethodik](/research/methodology).
