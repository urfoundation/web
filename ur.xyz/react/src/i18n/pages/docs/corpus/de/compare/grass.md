---
title: UR-Miner vs. Grass im Vergleich | UR
description: Ein UR-Miner auf Bittensor SN25 neben Grass: was du betreibst, wie Belohnungen festgelegt werden, Auszahlung, Open Source, wessen Verkehr, welche Daten.
published: 2026-11-18
---

# UR-Miner vs. Grass

Fakten geprüft am 2026-11-18.

Diese Seite vergleicht nur Mechanismen: keine Verdienstzahlen, Prognosen oder Tokenpreise für eines der beiden Netzwerke. Grass-Angaben stammen aus den [Bedingungen von Grass](https://www.grass.io/terms-and-conditions) und der [Datenschutzerklärung](https://www.grass.io/privacy-policy). UR-Angaben stammen aus [Einen Miner betreiben](/docs/miner), [Für das Mining bezahlt werden](/docs/miner/rewards) und [Forschungsmethodik](/research/methodology). Siehe auch [alle Netzwerke im Vergleich](/docs/compare). [UR-Miner werden](/miners) geht die UR-Seite durch.

## Im direkten Vergleich

| | UR-Miner | Grass |
| --- | --- | --- |
| Was du betreibst | Das Programm `provider` auf einem Linux-, macOS- oder Windows-Computer, der online bleibt, mit einer stabilen öffentlichen Adresse und eingehendem TCP-Port 443 für seinen Extender | Der Client von Grass; Anforderungen in den geprüften Seiten nicht dokumentiert |
| Weitere Voraussetzungen | Ein Konto bei einem Netzwerkbetreiber und ein Bittensor-Coldkey | Ein Konto mit korrekten Registrierungsangaben; ein Konto pro Person |
| Wie Belohnungen festgelegt werden | Ein Anteil an der Miner-Emission des Subnetzes, proportional zu abgeschlossenem Verkehr mal gemessener Zuverlässigkeit; bezahlter und kostenloser Verkehr bringen gleich viel | Verfügbarkeit, Qualität, Standort und Nutzung der Bandbreite, die du beisteuerst; zuerst kommen Punkte, die keinen Geldwert haben |
| Auszahlungswert | α ($UR), als nativer α-Stake auf deinem Coldkey | Grass-Token oder USDC, nach Ermessen von Grass, unter gesonderten Belohnungsbedingungen |
| Wallet oder KYC | Ein Bittensor-Coldkey, den du mit einer signierten Erklärung nachweist; die zitierten Seiten beschreiben keine Identitätsprüfung | Eine nicht verwahrende digitale Wallet, deren öffentliche Adresse Grass erfasst; keine Identitätsprüfung dokumentiert |
| Open-Source-Client | Der Leitfaden folgt dem Quellcode `sn/miner` auf GitHub | Nicht dokumentiert |
| Verkehr, den du trägst | Internetverkehr für einen Netzwerkbetreiber, als dessen Exit | Zugriff auf öffentliche Webdaten |
| Wer haftet | Auf den hier zitierten Seiten nicht behandelt; lies die Bedingungen deines Betreibers | Du bist „allein verantwortlich und haftbar“ für deine Teilnahme, einschließlich deines Vertrags mit dem ISP |
| Daten und Deinstallation | Der Miner speichert seine Identität und Wallet-Historie in `~/.urnetwork`; die Deinstallation wird auf den zitierten Seiten nicht behandelt | Erfasst deine IP-Adresse, Gerätekennungen, E-Mail und Wallet-Adresse; die Website setzt Analyse- und Werbe-Cookies; Löschung auf Anfrage per Kontakt zu Grass |

## Wie sich die Belohnungen unterscheiden

Ein UR-Miner im Pool eines Betreibers verdient einen Anteil am Pool: abgeschlossene Nutzungsbytes mal Zuverlässigkeit, wobei Zuverlässigkeit Bestätigungen geteilt durch Zuweisungen ist. Validatoren messen diese Arbeit; es gibt keinen Preis pro Byte. Belohnungen werden pro Epoche gezählt, im Mainnet etwa eine Woche, und danach beansprucht.

Die Bedingungen von Grass sagen, Belohnungen hängen von Verfügbarkeit, Qualität, Standort und Nutzung der Bandbreite ab, die du beisteuerst. Punkte haben keinen Geldwert, und die Bedingungen versprechen keine künftigen Belohnungen.

## Wo Grass vorn liegt

- **Keine Kommandozeile, keine Ports:** Die Bedingungen von Grass beschreiben keine Server-Einrichtung.
- **Eine Wahl des Werts:** Belohnungen können neben Grass-Token auch USDC umfassen.

## Worauf du bei UR verzichtest

- Eine Einrichtung per Kommandozeile, offene Ports und eine signierte Bittensor-Wallet-Erklärung.
- Beanspruchen nach dem Ende jeder Epoche, eingereicht mit einem Relayer-Schlüssel, der ein wenig TAO für Gas hält.
- Kein Preis, den du für deine Bandbreite festlegst.
- Die hier zitierten Seiten sagen nicht, wer für Exit-Verkehr einsteht; die Bedingungen deines Betreibers tun es.

## Worin sich UR unterscheidet

UR veröffentlicht, wie es Änderungen am Netzwerk misst, verworfene Ergebnisse eingeschlossen: siehe [Forschungsmethodik](/research/methodology).
