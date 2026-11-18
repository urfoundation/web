---
title: UR-Miner vs. Sentinel-dVPN-Knoten im Vergleich | UR
description: Ein UR-Miner auf Bittensor SN25 neben einem Sentinel-dVPN-Knoten: was du betreibst, wie Belohnungen festgelegt werden, Auszahlung, Open Source, wessen Verkehr.
published: 2026-11-18
---

# UR-Miner vs. Sentinel-dVPN-Knoten

Fakten geprüft am 2026-11-18.

Diese Seite vergleicht nur Mechanismen: keine Verdienstzahlen, Prognosen oder Tokenpreise für eines der beiden Netzwerke. Sentinel-Angaben stammen aus der [Sentinel-Knotendokumentation](https://docs.sentinel.co/dvpn-nodes), ihren [Anforderungen](https://docs.sentinel.co/dvpn-nodes/setup/requirements), ihrer [Verdienstseite](https://docs.sentinel.co/dvpn-nodes/earnings) und dem [Knoten-Repository](https://github.com/sentinel-official/dvpn-node). UR-Angaben stammen aus [Einen Miner betreiben](/docs/miner), [Für das Mining bezahlt werden](/docs/miner/rewards) und [Forschungsmethodik](/research/methodology). Siehe auch [alle Netzwerke im Vergleich](/docs/compare). Die [Voraussetzungen und Einrichtung eines UR-Miners](/miners) sind auf einer Seite zusammengefasst.

## Im direkten Vergleich

| | UR-Miner | Sentinel |
| --- | --- | --- |
| Was du betreibst | Das Programm `provider` auf einem Linux-, macOS- oder Windows-Computer, der online bleibt, mit einer stabilen öffentlichen Adresse und eingehendem TCP-Port 443 für seinen Extender | Der dvpnx-Knoten in Docker unter Linux (bevorzugt Debian oder Ubuntu), mit 2 vCPUs, 2 GB RAM, einer 10-GB-SSD, unbegrenzter Bandbreite und einer öffentlichen IP |
| Weitere Voraussetzungen | Ein Konto bei einem Netzwerkbetreiber und ein Bittensor-Coldkey | Ein P2P-Guthaben im Knotenkonto für On-Chain-Transaktionen und ein bestandener Health-Check, um für Belohnungen berechtigt zu sein |
| Wie Belohnungen festgelegt werden | Ein Anteil an der Miner-Emission des Subnetzes, proportional zu abgeschlossenem Verkehr mal gemessener Zuverlässigkeit; bezahlter und kostenloser Verkehr bringen gleich viel | dVPN-Nutzer bezahlen den Knoten pro GB oder pro Stunde zu Preisen, die der Betreiber festlegt, oder über Abonnementpläne, die pro Stunde Verfügbarkeit zahlen |
| Auszahlungswert | α ($UR), als nativer α-Stake auf deinem Coldkey | P2P, stündlich ausgezahlt |
| Wallet oder KYC | Ein Bittensor-Coldkey, den du mit einer signierten Erklärung nachweist; die zitierten Seiten beschreiben keine Identitätsprüfung | Das Knotenkonto ist eine Wallet; keine Identitätsprüfung dokumentiert |
| Open-Source-Client | Der Leitfaden folgt dem Quellcode `sn/miner` auf GitHub | Öffentliches Repository; Lizenz in den geprüften Seiten nicht bestätigt |
| Verkehr, den du trägst | Internetverkehr für einen Netzwerkbetreiber, als dessen Exit | Verkehr von Nutzern der dVPN-Apps |
| Wer haftet | Auf den hier zitierten Seiten nicht behandelt; lies die Bedingungen deines Betreibers | In den geprüften Seiten nicht dokumentiert |
| Daten und Deinstallation | Der Miner speichert seine Identität und Wallet-Historie in `~/.urnetwork`; die Deinstallation wird auf den zitierten Seiten nicht behandelt | In den geprüften Seiten nicht dokumentiert |

## Wie sich die Belohnungen unterscheiden

Ein UR-Miner im Pool eines Betreibers verdient einen Anteil am Pool: abgeschlossene Nutzungsbytes mal Zuverlässigkeit, wobei Zuverlässigkeit Bestätigungen geteilt durch Zuweisungen ist. Validatoren messen diese Arbeit; es gibt keinen Preis pro Byte. Belohnungen werden pro Epoche gezählt, im Mainnet etwa eine Woche, und danach beansprucht.

Die Verdienstseite von Sentinel beschreibt zwei Arten, bezahlt zu werden. Ein Abonnementplan bindet Token an ausgewählte Knoten und zahlt für jede Stunde Verfügbarkeit. Pay-as-you-go-Nutzer zahlen pro GB oder pro Stunde, zu Preisen, die der Betreiber in US-Dollar festlegt und ein Orakel in P2P umrechnet. Wer P2P stakt, erhält ebenfalls einen Anteil an den Bandbreitenzahlungen.

## Wo Sentinel vorn liegt

- **Preise, die du festlegst:** Ein Knoten legt seine eigenen Preise pro GB und pro Stunde fest.
- **Stündliche Auszahlungen:** Knotenbelohnungen werden jede Stunde ausgezahlt, ohne Schritt zum Beanspruchen.

## Worauf du bei UR verzichtest

- Eine Einrichtung per Kommandozeile, offene Ports und eine signierte Bittensor-Wallet-Erklärung.
- Beanspruchen nach dem Ende jeder Epoche, eingereicht mit einem Relayer-Schlüssel, der ein wenig TAO für Gas hält.
- Kein Preis, den du für deine Bandbreite festlegst.
- Die hier zitierten Seiten sagen nicht, wer für Exit-Verkehr einsteht; die Bedingungen deines Betreibers tun es.

## Worin sich UR unterscheidet

UR veröffentlicht, wie es Änderungen am Netzwerk misst, verworfene Ergebnisse eingeschlossen: siehe [Forschungsmethodik](/research/methodology).
