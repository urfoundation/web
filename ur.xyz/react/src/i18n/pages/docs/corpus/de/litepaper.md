---
title: "UR-Litepaper: Datenschutznetzwerk auf Bittensor"
description: "So funktioniert UR: ein dezentrales Datenschutznetzwerk auf Bittensor SN25 — Miner tragen verschlüsselten Verkehr, Validatoren messen ihn, Betreiber bringen die Nachfrage."
---
# Ein Datenschutznetzwerk, koordiniert auf Bittensor

> Besitze deine Privatsphäre. Besitze das Netzwerk.

## I. Ein dezentrales Datenschutznetzwerk

UR ist ein dezentrales Datenschutznetzwerk. Es verteilt den Verkehr der Nutzer über ein globales Netz unabhängiger Miner, mit Multi-Hop-Routing und mehrschichtiger Verschlüsselung, sodass kein einzelner Miner zugleich sieht, wer ein Nutzer ist und was er tut. Der Transport ist so gestaltet, dass er gewöhnlichem HTTPS gleicht, mit N-facher TLS-Verschlüsselung, SNI-Spoofing und ununterscheidbarem Verkehr, sodass das Netzwerk fast überall erreichbar bleibt.

Das UR-Subnet, Bittensor SN25 (netuid 25), koordiniert dieses Netzwerk über On-Chain-Anreize. Netzbetreiber betreiben die Server; unabhängige Miner tragen den eingehenden und ausgehenden Verkehr; und unabhängige Validatoren durchlaufen fortlaufend von den Betreibern zugewiesene Ketten von Minern, um die Übertragung in Echtzeit nachzuweisen und zu messen, welche Miner die schwächsten Glieder sind. Diese Messung ist das zentrale Signal, für das das Netzwerk bezahlt.

Bittensors Yuma Consensus wandelt die Messungen der Validatoren in Token-Emission um, und ein Smart Contract auf der Subtensor EVM wickelt die Auszahlungen ab. Das Protokoll ist Open Source, und wer einen Miner oder Validator betreiben will, braucht dafür keine Erlaubnis.

## II. Rollen

Netzbetreiber betreiben die Datenschutzserver und den Verifizierungsendpunkt. Ein Betreiber leistet Einlagen in das Subnet, signiert jeden gemessenen Pfad mit und legt eine Auszahlungsliste fest, die seine Belohnungen auf die mit ihm verbundenen Miner aufteilt. Ein Betreiber meldet die Nutzung, der seine Belohnungen folgen, verwahrt aber niemals fremde Mittel.

Miner sind der Eingang und der Ausgang des Netzwerks. Sie arbeiten mit einem standardmäßig sicheren Sicherheitsmodell, blockieren bekannte bösartige IPs und leiten nur verschlüsselten Verkehr weiter. Ein Miner trägt Verkehr für einen oder mehrere Betreiber und wird für den Verkehr bezahlt, den er trägt, und in den Top-Flotten auch für die routbare Kapazität, die er beiträgt.

Validatoren sind unabhängig. Jeder stakt seine eigenen UR, führt das Routing-Verifizierungsprotokoll aus und bewertet den Pool jedes Betreibers nach Nachfrage und gemessener Qualität. Validatoren verdienen die nativen Dividenden des Netzwerks für eine genaue, am Konsens ausgerichtete Bewertung. Kein Betreiber besitzt einen Validator, und der Kreis der Validatoren steht allen ohne Erlaubnis offen.

Der Subnet-Eigentümer steuert die upgradefähigen Koordinatoren der Settlement-Verträge, nicht die unveränderlichen Tresore, die die Belohnungen der Miner halten, und verwaltet die Reserve des Netzwerks. Diese Rolle ist eine Übergangsrolle: Die Kontrolle beginnt zentralisiert, aber begrenzt, und wird schrittweise dezentralisiert, wie in Abschnitt V beschrieben.

## III. Der UR-Token

UR ist der native Token des Subnets, die Rechnungseinheit für Einlagen, Emission und Settlement. Er ist ein Utility-Token, um Netzwerkressourcen zu koordinieren und zu bezahlen; er ist nicht dafür gedacht, ein Recht auf Gewinne, Einkommen oder Renditen darzustellen oder zu gewähren.

Neue UR werden in jedem Zyklus von Bittensors Coinbase emittiert und dreifach aufgeteilt:

| Strom | Anteil | Empfänger |
| --- | ---: | --- |
| Eigentümer | 18 % | Subnet-Eigentümer |
| Miner | 41 % | Provider erhalten den Momentum-Anteil, zum Start 10 %, über die Pools der Betreiber und die Slots der Top-Level-Miner; die Network Capacity Reserve erhält den Rest |
| Validatoren | 41 % | Unabhängige Validatoren, die native Dividenden für genaue Bewertungen erhalten |

Betreiber finanzieren das Netzwerk, indem sie UR in Höhe ihrer tatsächlichen Nutzung zu einem veröffentlichten Referenztarif einzahlen. Eine Einlage ist ein durch Einnahmen gedecktes Signal echter Nachfrage: Der Vertrag überführt jede Einlage in die Reserve des Subnets. Die kumulierten Einlagen eines Betreibers senken den Tarif, den er hinterlegen muss, sodass engagierte Betreiber mit weniger Anfangskapital einsteigen können. In der Anfangsphase ist der veröffentlichte Tarif 0, es sind keine Einlagen erforderlich, und jedem Betreiber-Pool wird die gleiche Nachfrage zugewiesen, sodass allein die gemessene Qualität den Pool-Kanal steuert.

Miner werden aus der Emission bezahlt, nicht aus Einlagen. Weil sich die Einlagen in der Reserve ansammeln, statt in Auszahlungen zurückzufließen, schafft echte Nutzung zusätzliche Nachfrage nach dem Token, während die Emission einem festen Zeitplan mit Halvings folgt.

## IV. Zwei Wege zu verdienen

Ein einzelner Betreiber kann weit über 100.000 Miner bedienen, weit mehr als die rund 256 On-Chain-Slots eines Subnets, daher bezahlt das Netzwerk Miner über zwei Stufen, die parallel laufen.

Der Pool ist der Einstieg. Jeder Betreiber hält einen On-Chain-Slot für alle seine Miner; Validatoren gewichten diesen Pool nach der Nachfrage des Betreibers und seiner gemessenen Qualität, und jeder Miner beansprucht seinen Anteil mit einem kryptografischen Nachweis direkt vom Settlement-Vertrag. Es gibt keinen Slot zu gewinnen und nichts zu verbrennen. Hier fängt ein Miner an und verdient eine Grundbelohnung.

Neben dem Pool hat jeder Betreiber auf derselben Stufe ab Epoche 8 auch einen Capture-the-Flag-Pool mit zehn Belohnungs-Slots in jedem Land: fünf für Provider und fünf für Extender. Die Miner des Betreibers nehmen mit der Registrierung des Pools daran teil und verbrennen nichts. In jeder Epoche füllt eine öffentliche Auslosung die Slots aus den Minern, die online waren, die Prüfungen des Betreibers bestanden, mindestens die Hälfte der Epoche im Land waren und an ihrem Ende aktiv sind; ein Slot, den niemand gewinnt, wird in den Topf dieses Landes für seine Rolle übertragen. Capture the Flag nimmt ein Zehntel des Anteils der Provider.

Top-Level-Miner sind die Spitze des Angebots. Die rund 200 größten Flotten, eingestuft danach, wie viele verschiedene, routbare Exit-IPs sie tatsächlich bedienen, und nicht nach Verkehrsvolumen, beanspruchen jeweils ihren eigenen On-Chain-Slot und werden direkt vom Netzwerk bezahlt, ohne Betreiber im Auszahlungsweg. Eine gemeinsam genutzte IP wird auf die Flotten aufgeteilt, die sie beanspruchen, sodass Breite nicht doppelt gezählt werden kann.

Die beiden Stufen sind ein einziges Turnier: Ein Miner beginnt in einem Pool, steigt in einen Top-Slot auf, wenn seine Breite an routbaren IPs wächst, und fällt in den Pool zurück, wenn sie nachlässt. Ein durch Governance festgelegter Anteil teilt den Emissionsanteil der Provider zwischen der Spitze und dem Rest auf.

- Pool-Stufe: der Einstieg. Schließe dich einem Betreiber an, ohne Slot und ohne Registrierungskosten; Validatoren gewichten den Pool nach Nachfrage und Qualität; der Anteil jedes Miners läuft in jeder Settlement-Periode auf und wird per Nachweis beansprucht (mit Settlement v2 auf ein einziges Konto, das nie verfällt).
- Top-Level-Miner: die Spitze. Die rund 200 Flotten mit der breitesten Abdeckung an routbaren IPs beanspruchen ihren eigenen Slot und werden direkt vom Netzwerk bezahlt, ohne Betreiber, Pool oder Vermittler.

## V. Verwahrung, Settlement und Dezentralisierung

Das Settlement läuft in einem Sieben-Tage-Zyklus. Der Vertrag sammelt die Emission jedes Pools über die Periode an und öffnet dann die Claims: Miner ziehen ihre UR direkt aus dem Vertrag, gemäß der festgelegten Auszahlungsliste ihres Betreibers. Mit Settlement v2 öffnet sich ein Auszahlungs-Root erst, nachdem der Validator ihn genehmigt hat und ein Einspruchsfenster von 14.400 Blöcken verstrichen ist, und das Guthaben eines Kontos verfällt nie. Top-Level-Miner brauchen keinen Settlement-Schritt, weil die Chain ihren Slot in jedem Zyklus nativ bezahlt.

Niemand verwahrt fremde Mittel. Die Settlement-Verträge sind die einzigen Verwahrer von UR im Transit, jede Pool-Auszahlung ist ein direkter On-Chain-Claim, und Top-Level-Miner werden nativ an ihre eigenen Schlüssel bezahlt. Betreiber und Eigentümer nehmen die Belohnungen der Miner niemals in Verwahrung.

Verdiente Claims sind endgültig. Sobald eine Settlement-Periode finalisiert ist, sind die Token, die ihre Claims decken, gebunden. Kein Vertrags-Upgrade, keine Pause und keine administrative Maßnahme kann sie blockieren oder rückgängig machen; nur der Schalter auf Chain-Ebene, der Stake-Transfers auf SN25 deaktiviert, kann Claims einfrieren, und er kann sie weder wegnehmen noch umleiten.

Die Kontrolle dezentralisiert sich mit der Zeit. Das Netzwerk startet mit Richtlinien-Koordinatoren, die hinter einem Multisig des Eigentümers upgradefähig sind, was eine bewusste, begrenzte zentrale Kontrolle für frühe Fehlerbehebungen bietet, während die Settlement-Tresore und die Einlagenreserve vom ersten Tag an unveränderlich sind und ein Guardian, der nur pausieren kann, einen Exploit stoppen, aber niemals Mittel bewegen oder finalisierte Claims blockieren kann. Die Kontrolle wird schrittweise gehärtet: ein öffentlicher Timelock auf jede Änderung und mit der Zeit On-Chain-Governance.

---

_Dies ist ein lebendiges Dokument. Das laufende Netzwerk wird mitbestimmen, wie es sich weiterentwickelt, und das hier beschriebene Design, einschließlich des Anreizmechanismus, kann sich ändern, während wir es weiterentwickeln._
