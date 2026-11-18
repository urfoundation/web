---
title: Bandbreiten-Sharing-Netzwerke für Miner im Vergleich | UR
description: Ein UR-Miner neben Mysterium, Grass, Sentinel, Orchid, Honeygain und Pawns.app: was du betreibst, wie Belohnungen festgelegt werden, Auszahlung, Open Source.
published: 2026-11-18
---

# Bandbreiten-Sharing-Netzwerke im Vergleich

Fakten geprüft am 2026-11-18.

Diese Seite stellt einen UR-Miner (Bittensor SN25) neben andere Netzwerke, die Menschen dafür bezahlen, dass sie eine Verbindung teilen oder einen Knoten betreiben. Sie vergleicht nur Mechanismen. Sie nennt für kein Netzwerk, UR eingeschlossen, Verdienstzahlen, Prognosen, Renditen oder Tokenpreise. Jede Zeile stammt von der eigenen Website, Dokumentation, den Bedingungen oder dem Repository des Projekts, verlinkt auf seiner Seite. Wo die eigenen Seiten eines Projekts etwas nicht sagen, steht in der Tabelle „nicht dokumentiert“.

Für UR stammt jede Angabe aus [Einen Miner betreiben](/docs/miner), [Für das Mining bezahlt werden](/docs/miner/rewards) und [Forschungsmethodik](/research/methodology). Die [Seite zu UR-Minern](/miners) erklärt die UR-Rolle an einem Ort.

## Auf einen Blick

| Netzwerk | Was du betreibst | Wie Belohnungen festgelegt werden | Auszahlung | Open-Source-Client |
| --- | --- | --- | --- | --- |
| [UR-Miner](/docs/miner) | Das Programm `provider` unter Linux, macOS oder Windows, mit einer öffentlichen Adresse und einem offenen Port | Ein Anteil an der Miner-Emission des Subnetzes, nach abgeschlossenem Verkehr und gemessener Zuverlässigkeit | α ($UR) an einen Bittensor-Coldkey, für den du signierst | Quellcode im Leitfaden verlinkt |
| [Mysterium-Knoten](/docs/compare/mysterium) | Knotensoftware (WireGuard) per Skript, Docker oder Apps | Geteilte Bandbreite, Verfügbarkeit und Standort | MYST | Ja, GPL-3.0 |
| [Grass](/docs/compare/grass) | Der Client von Grass; Anforderungen in den geprüften Seiten nicht dokumentiert | Verfügbarkeit, Qualität, Standort und Nutzung; zuerst Punkte | Grass-Token oder USDC, nach Ermessen von Grass | Nicht dokumentiert |
| [Sentinel-dVPN-Knoten](/docs/compare/sentinel) | Der dvpnx-Knoten in Docker auf einem Linux-Server mit öffentlicher IP | dVPN-Nutzer zahlen pro GB oder pro Stunde zu deinen Preisen oder über Abonnementpläne | P2P, stündlich | Öffentliches Repository; Lizenz nicht bestätigt |
| [Orchid](/docs/compare/orchid) | Ein Provider-Server, in einem Ethereum-Verzeichnis gelistet, mit gestaktem OXT | Nutzer zahlen per probabilistischen Nanozahlungen; Auswahl nach Stake gewichtet | Über die Nanozahlungen hinaus nicht dokumentiert | Ja, AGPL-3.0 |
| Honeygain | Die Honeygain-App | Verdienst pro geteiltem GB gutgeschrieben, zu einem Satz, den Honeygain festlegt und ändern kann | Fiatgeld über Zahlungsanbieter oder JumpTask | Nicht dokumentiert |
| Pawns.app (IPRoyal) | Die Anwendung Pawns.app | Verdienst aus geteiltem Verkehr, plus Partneraufgaben | USD aus einem Dashboard, ab einem Mindestbetrag | Nicht dokumentiert |

## Wessen Verkehr du trägst

| Netzwerk | Verkehr | Wer dafür einsteht, laut eigenen Bedingungen |
| --- | --- | --- |
| UR-Miner | Internetverkehr für einen Netzwerkbetreiber, als dessen Exit | Die hier zitierten Seiten sagen es nicht; lies die Bedingungen deines Betreibers |
| Mysterium-Knoten | Verkehr von VPN-Nutzern, mit Partnerprodukten für Residential-VPN und Business-Proxys | Die Bedingungen sagen, Betreiber „sollten nicht haftbar sein“ und illegaler Verkehr lasse sich nicht ausschließen |
| Grass | Zugriff auf öffentliche Webdaten | Du bist „allein verantwortlich und haftbar“ für deine Teilnahme |
| Sentinel-dVPN-Knoten | Verkehr von Nutzern der dVPN-Apps | In den geprüften Seiten nicht dokumentiert |
| Orchid | Verkehr von Orchid-VPN-Nutzern | Nicht dokumentiert |
| Honeygain | Kunden von Honeygain, für Zwecke wie Webanalyse und Marktforschung | Du bist verantwortlich für deine Verbindung und die Einhaltung der Vorgaben deines ISP |
| Pawns.app (IPRoyal) | Geschäftskunden von Pawns.app | Du bist „allein verantwortlich“ für Aktivitäten unter deinem Konto |

Honeygain und Pawns.app haben hier keine eigene Seite. Ihre Angaben stammen aus den [Bedingungen von Honeygain](https://www.honeygain.com/terms-of-use/) und der [Datenschutzerklärung](https://www.honeygain.com/privacy-policy/) sowie aus den [Bedingungen von Pawns.app](https://pawns.app/terms-of-use/) und der [Datenschutzerklärung](https://pawns.app/privacy-policy/).

## Worauf du bei UR verzichtest

- **Die Einrichtung ist Kommandozeilenarbeit.** Du installierst ein Programm, öffnest Ports und signierst eine Erklärung mit einer Bittensor-Wallet. App-orientierte Netzwerke verlangen weniger.
- **Du brauchst einen Bittensor-Coldkey, und das Beanspruchen erfordert Schritte.** Belohnungen werden pro Epoche gezählt, im Mainnet etwa eine Woche, und nach dem Ende der Epoche beansprucht, mit einem Relayer-Schlüssel, der ein wenig TAO für Gas hält.
- **Es gibt keinen festen Preis für deine Bandbreite.** Dein Anteil folgt der Emission des Subnetzes und deiner gemessenen Arbeit, nicht einem Satz, den du festlegst.
- **Die hier zitierten Seiten behandeln weder Haftung noch Deinstallation.** Für den Verkehr gelten die Bedingungen deines Betreibers.

## Wo die anderen vorn liegen

- **Weniger Schritte zum Start:** Honeygain und Pawns.app sind eine Anwendung auf deinem Gerät, und MystNodes nennt Windows, macOS, Linux, Android und eine Chrome-Erweiterung und sagt, es seien keine technischen Kenntnisse nötig.
- **Preise, die du festlegst:** Ein Sentinel-Knoten legt seine eigenen Preise pro GB und pro Stunde fest.
- **Eine angegebene Lizenz:** Mysterium (GPL-3.0) und Orchid (AGPL-3.0) nennen ihre im Repository.
- **Auszahlungen in Fiatgeld:** Honeygain und Pawns.app zahlen in Geld, ohne Wallet, die du verwalten musst.
