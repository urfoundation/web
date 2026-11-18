---
title: UR-Miner vs. Mysterium-Knoten im Vergleich | UR
description: Ein UR-Miner auf Bittensor SN25 neben einem Mysterium-Knoten: was du betreibst, Belohnungen, Auszahlung, Open Source, wessen Verkehr du trägst, deine Daten.
published: 2026-11-18
---

# UR-Miner vs. Mysterium-Knoten

Fakten geprüft am 2026-11-18.

Diese Seite vergleicht nur Mechanismen: keine Verdienstzahlen, Prognosen oder Tokenpreise für eines der beiden Netzwerke. Mysterium-Angaben stammen von [mysterium.network](https://mysterium.network/), [MystNodes](https://mystnodes.com/), den [Bedingungen von MystNodes](https://mystnodes.com/legal/terms-and-conditions) und dem [Knoten-Repository](https://github.com/mysteriumnetwork/node). UR-Angaben stammen aus [Einen Miner betreiben](/docs/miner), [Für das Mining bezahlt werden](/docs/miner/rewards) und [Forschungsmethodik](/research/methodology). Siehe auch [alle Netzwerke im Vergleich](/docs/compare). Die UR-Seite auf einer Seite zeigt [wie du auf UR minst](/miners).

## Im direkten Vergleich

| | UR-Miner | Mysterium-Knoten |
| --- | --- | --- |
| Was du betreibst | Das Programm `provider` auf einem Linux-, macOS- oder Windows-Computer, der online bleibt, mit einer stabilen öffentlichen Adresse und eingehendem TCP-Port 443 für seinen Extender | Knotensoftware mit WireGuard, per Skript unter Debian, Ubuntu oder Raspbian, per Docker oder über die MystNodes-Apps |
| Weitere Voraussetzungen | Ein Konto bei einem Netzwerkbetreiber und ein Bittensor-Coldkey | Eine Registrierungsgebühr auf Polygon, die in MYST bezahlt werden kann |
| Wie Belohnungen festgelegt werden | Ein Anteil an der Miner-Emission des Subnetzes, proportional zu abgeschlossenem Verkehr mal gemessener Zuverlässigkeit; bezahlter und kostenloser Verkehr bringen gleich viel | Geteilte Bandbreite, wie beständig der Knoten online bleibt, und Standort |
| Auszahlungswert | α ($UR), als nativer α-Stake auf deinem Coldkey | MYST |
| Wallet oder KYC | Ein Bittensor-Coldkey, den du mit einer signierten Erklärung nachweist; die zitierten Seiten beschreiben keine Identitätsprüfung | In den geprüften Seiten nicht dokumentiert |
| Open-Source-Client | Der Leitfaden folgt dem Quellcode `sn/miner` auf GitHub | Ja, GPL-3.0 |
| Verkehr, den du trägst | Internetverkehr für einen Netzwerkbetreiber, als dessen Exit | Exit-Verkehr für VPN-Nutzer; zu den Partnerprodukten gehören ein Residential-VPN und Business-Proxys |
| Wer haftet | Auf den hier zitierten Seiten nicht behandelt; lies die Bedingungen deines Betreibers | Die Bedingungen sagen, Betreiber „sollten nicht haftbar sein“ und illegaler Verkehr lasse sich nicht ausschließen |
| Daten und Deinstallation | Der Miner speichert seine Identität und Wallet-Historie in `~/.urnetwork`; die Deinstallation wird auf den zitierten Seiten nicht behandelt | Die Bedingungen beschreiben keine Browsing-Logs und minimale Nutzungsdaten; bei Beendigung „können“ Daten gelöscht werden; kein Löschverfahren dokumentiert |

## Wie sich die Belohnungen unterscheiden

Ein UR-Miner im Pool eines Betreibers verdient einen Anteil am Pool: abgeschlossene Nutzungsbytes mal Zuverlässigkeit, wobei Zuverlässigkeit Bestätigungen geteilt durch Zuweisungen ist. Validatoren messen diese Arbeit; es gibt keinen Preis pro Byte. Belohnungen werden pro Epoche gezählt, im Mainnet etwa eine Woche, und danach beansprucht.

MystNodes sagt, Belohnungen richten sich danach, wie viel Bandbreite ein Knoten teilt, wie beständig er online bleibt und wo er steht. Testverkehr berechtigt nicht zur Zahlung.

## Wo Mysterium vorn liegt

- **Leichterer Start:** MystNodes nennt Windows, macOS, Linux, Android, Docker, Raspberry Pi und eine Chrome-Erweiterung und sagt, es seien keine technischen Kenntnisse nötig.
- **Eine angegebene Lizenz:** Das Knoten-Repository steht unter GPL-3.0.
- **Eine schriftliche Position zur Haftung:** Die Bedingungen behandeln die Haftung von Exit-Knoten direkt.

## Worauf du bei UR verzichtest

- Eine Einrichtung per Kommandozeile, offene Ports und eine signierte Bittensor-Wallet-Erklärung.
- Beanspruchen nach dem Ende jeder Epoche, eingereicht mit einem Relayer-Schlüssel, der ein wenig TAO für Gas hält.
- Kein Preis, den du für deine Bandbreite festlegst.
- Die hier zitierten Seiten sagen nicht, wer für Exit-Verkehr einsteht; die Bedingungen deines Betreibers tun es.

## Worin sich UR unterscheidet

UR veröffentlicht, wie es Änderungen am Netzwerk misst, verworfene Ergebnisse eingeschlossen: siehe [Forschungsmethodik](/research/methodology).
