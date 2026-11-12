---
published: 2026-10-21
description: Bezahlt werden fürs Mining auf UR: die Auszahlungs-Wallet deines Miners festlegen, verstehen, wie Pool-Belohnungen pro Epoche zählen, und sie auf deinen Coldkey beanspruchen.
---

# Für das Mining bezahlt werden

Dein Miner verdient für den Verkehr, den er trägt. Diese Seite behandelt die drei Teile des Bezahltwerdens: dem Betreiber mitteilen, an welche Bittensor-Wallet er zahlen soll ([lege deine Auszahlungs-Wallet fest](#set-your-payout-wallet)), [wie Belohnungen gezählt werden](#how-rewards-are-counted) und [sie beanspruchen](#claim-your-rewards).

Wenn du einen Installer benutzt hast, tippe `urnetwork` überall, wo diese Seite `provider` sagt.

## Lege deine Auszahlungs-Wallet fest

Belohnungen gehen an einen Bittensor-**Coldkey**: eine ss58-Adresse, die mit `5` beginnt. Du beweist, dass der Coldkey dir gehört, indem du damit eine kurze Erklärung signierst. Der Betreiber speichert diese signierte Erklärung für dieses Gerät, daher genügt eine Wallet-Adresse allein in deinem Kontoprofil nicht.

Am einfachsten ist der Auszahlungsschritt von [`provider setup`](/docs/miner#2-run-setup): Er gibt die Nachricht aus, du signierst sie in deiner Wallet-App und fügst die Signatur ein. Du kannst `provider setup` später nur für diesen Schritt erneut ausführen; wenn du einen Installer benutzt hast, führe `urnetwork setup --no-service` aus. Die Befehle unten tun dasselbe von Hand.

Lege die Wallet **nach** dem ersten Start des Geräts fest (`provider setup` oder das erste `provider start`), weil die Erklärung das Gerät nennt, das dieser Start registriert. Vorher schlagen `wallet challenge` und `wallet set` mit `claim/wallet credential not ready at …/.provider.jwt` fehl.

### In deiner Wallet-App signieren (empfohlen)

So bleibt das Geheimnis deines Coldkeys vom Miner fern. Fordere zuerst die Erklärung an:

```bash
provider wallet challenge '<coldkey_ss58>'
```

Signiere die ausgegebene Erklärung exakt so, wie sie ist, mit diesem Coldkey in einer Wallet, die Rohnachrichten mit sr25519 signieren kann, zum Beispiel [polkadot.js Apps](https://polkadot.js.org/apps/#/signing) (Developer → Sign and verify) mit deinem Konto aus der Polkadot.js-Erweiterung. Führe dann den `provider wallet set`-Befehl, den die Challenge ausgegeben hat, mit deiner Signatur aus. (Wenn du einen Installer benutzt hast, ändere `provider` an seinem Anfang in `urnetwork`.) Er sieht so aus:

```bash
provider wallet set '<coldkey_ss58>' \
  --message='<exact printed statement>' \
  --signature='0x<64-byte sr25519 signature>'
```

Was für die Signatur gilt:

- Über die Erklärung exakt wie ausgegeben, als UTF-8-Text mit LF-Zeilenenden und ohne zusätzlichen Zeilenumbruch am Ende, signiert mit sr25519 im Signaturkontext `substrate`. In `--message` steht ein wörtliches `\n` für einen Zeilenumbruch.
- Ein `signRaw` der Polkadot-Erweiterung vom Typ `bytes`, das die Erklärung in `<Bytes>...</Bytes>` einhüllt, wird ebenfalls akzeptiert.
- Reiche sie innerhalb der Zeit ein, die die Challenge ausgibt, meist fünf Minuten.

Der ausgegebene Befehl behält den Betreiber und das Gerät, die du verwendest, also kopiere ihn, statt einen eigenen zu tippen.

### Mit einer Seed-Datei auf dem Miner signieren

Wenn du den Seed des Coldkeys bewusst auf dem Computer des Miners aufbewahrst, kann der Miner die Erklärung selbst abrufen und signieren:

```bash
provider wallet set '<coldkey_ss58>' \
  --coldkey_seed_file=/absolute/private/coldkey.seed
```

Die Datei muss bereits existieren, dir gehören, privat sein (zum Beispiel Modus `0600`) und darf in ihrem Pfad keine symbolischen Links haben. Sie enthält das rohe 32-Byte-Mini-Secret von sr25519 oder dasselbe als 64 Hexadezimalzeichen mit optionalem `0x`. Sie ist keine mnemonische Phrase. Der Befehl lehnt einen Seed ab, der nicht zur Adresse passt, und der Seed verlässt deinen Computer nie.

Du kannst die Wallet auch beim Start des Miners festlegen: `provider provide --wallet='<coldkey_ss58>' --coldkey_seed_file=/absolute/private/coldkey.seed`. Schlägt das fehl, protokolliert der Miner den Fehler und läuft weiter, also prüfe das Log, bevor du dich darauf verlässt.

### Wann die Wallet zu verdienen beginnt

Belohnungen werden in **Epochen** gezählt. Eine neue Wallet-Einstellung beginnt mit der **nächsten** Epoche und gilt für 65.536 Epochen, also lege sie vor der Epoche fest, in der du verdienen willst, und erneuere sie, bevor sie ausläuft. Sie ändert nie, wohin frühere Belohnungen gehen. Um stattdessen einen genauen Bereich zu wählen, übergib sowohl `--wallet-from-epoch=<epoch>` als auch `--wallet-through-epoch=<epoch>` an `wallet challenge` und `wallet set`; die früheste Epoche, die er akzeptiert, bestimmt weiterhin der Betreiber.

Der Miner bewahrt jede signierte Erklärung in `.provider.jwt.wallet-consent/history.json` in `~/.urnetwork` auf. Bewahre sie mit deinem [Backup](/docs/miner/run#back-up-your-miner) auf. Wird das Senden einer Erklärung unterbrochen, sendet dieselbe Befehlszeile erneut ausgeführt dieselbe signierte Erklärung, selbst wenn der Seed nicht mehr auf dem Computer ist.

Jedes Gerät, das verdienen soll, braucht seine eigene signierte Wallet; mehrere Geräte können denselben Coldkey verwenden. Für zusätzliche Exits auf einem Host wähle jeden mit `--provider-jwt` aus: siehe [Mehrere Exits auf einem Host](/docs/miner/advanced#several-exits-on-one-host). Um einmal für jeden gelisteten Betreiber zu signieren, siehe [Einmal für jeden gelisteten Betreiber signieren](/docs/miner/advanced#sign-once-for-every-listed-operator).

## Wie Belohnungen gezählt werden

Pool-Belohnungen hängen vom Verkehr ab, den dein Miner vollständig abgewickelt hat, und davon, wie zuverlässig er dabei gemessen wurde. Der Betreiber verbucht die erledigte Arbeit auf dein Gerät und zahlt an die für diese Epoche signierte Wallet. **Bezahlter und kostenloser Verkehr gleicher Größe bringen dieselbe Gutschrift.** Kontostände, Reservierungen, Abo-Zahlungen und unvollendete Verträge sind kein Arbeitsnachweis.

Der Anteil jedes Geräts am Pool ist proportional zu:

```text
completed usage bytes × reliability
reliability = confirmations / max(assignments, reliability_a_min)
```

Um für eine Epoche bezahlt zu werden, braucht ein Gerät eine abgeschlossene Nutzung über null, mindestens die geforderte Anzahl an Verifizierungsprüfungen, mindestens eine Bestätigung, eine signierte Wallet für diese Epoche und keine aktive Bindung an die Spitzenstufe. Geräte, die an denselben Coldkey zahlen, werden zu einer Auszahlung zusammengefasst. Ab der Umstellungsepoche von Settlement v2 wird der Pool allein nach abgeschlossener Nutzung aufgeteilt, ohne Zuverlässigkeitsfaktor oder Minimum, auf ein Konto pro Auszahlungs-Coldkey, das nie verfällt (siehe das [Litepaper](/docs/litepaper)).

Validatoren messen die Routing-Qualität selbst und gewichten die Pools der Betreiber und die Flotten der Spitzenstufe. Miner werden mit **Momentum** bezahlt: dem Anteil der Miner-Emission des Subnets, der jetzt eingesetzt wird, um das Netzwerk zu betreiben, aufgeteilt zwischen der Pool-Stufe und der Spitzenstufe nach einer Richtlinie. Momentum beträgt 10 %; die veröffentlichte Richtlinie deines Betreibers nennt den aktuellen Wert. Die [Network Capacity Reserve](/reserve), das Konto `ur-reserve`, erhält den Rest: Miner-Emission × (1 − Momentum). Ihr Anteil ist nicht fest; er wird kleiner, wenn Momentum wächst. Momentum ist ein Anteil an der Emission, kein fester Preis pro Byte; die veröffentlichte Richtlinie deines Betreibers und die Auszahlungsdateien zeigen die tatsächlichen Einnahmen. Die Reserve ist von der Claim-Sicherheit des Settlement-Tresors getrennt.

Eine Settlement-Epoche wird durch die bereitgestellten Verträge und die Richtlinie festgelegt. Im Mainnet sind es 50.400 Blöcke, etwa sieben Tage bei 12 Sekunden pro Block. Nachdem eine Epoche endet, wird ihr Auszahlungs-Root festgelegt und finalisiert, bevor Claims öffnen, daher ist jüngste Arbeit nicht sofort beanspruchbar. Der `claim_open_block`, den der Claim-Befehl ausgibt, und die veröffentlichten Bereitstellungsfenster deines Betreibers sagen dir, wann.

## Deine Belohnungen beanspruchen

Ein Claim holt deinen Nachweis vom Betreiber, prüft ihn und schickt ihn an den Settlement-Tresor, der an deinen Coldkey zahlt. Du brauchst die veröffentlichten Bereitstellungsdaten deines Betreibers: seinen EVM-RPC-Endpunkt, die Adresse des Settlement-Tresors und die Chain-ID (964 im Mainnet). Anmelden und Minen allein bedeuten nicht, dass die Subnet-Belohnungen eines Betreibers aktiv sind; das sagt seine veröffentlichte Bereitstellung.

### 1. Den Claim prüfen

```bash
provider claim --epoch='<settlement_epoch>' --rpc='https://<evm-json-rpc>'
```

Verwende den EVM-RPC-Endpunkt deines Betreibers; du kannst `--rpc` für Ausweichendpunkte wiederholen, die der Reihe nach versucht werden. Der Miner prüft den Nachweis und den Auszahlungs-Root und gibt `epoch`, `no_id`, `coldkey`, `share_bps`, die Auszahlungs-Roots, den `contract` des Tresors, den `claim_open_block` und die Claim-Daten aus. Gleiche Coldkey, Vertrag und Chain-ID mit der veröffentlichten Bereitstellung deines Betreibers ab. Eine Abweichung bei Nachweis oder Root endet mit einem Fehler: Kläre sie mit deinem Betreiber, bevor du einreichst.

Ohne `--epoch` wählt der Miner die Epoche vor der aktuellen. Diese Epoche wartet womöglich noch darauf, dass ihr Root finalisiert wird, sodass der Claim eventuell noch nicht offen ist. Gib ältere, nicht beanspruchte Epochen ausdrücklich an.

### 2. Ihn einreichen

Zum Einreichen brauchst du einen EVM-**Relayer**-Schlüssel: einen separaten secp256k1-Schlüssel mit etwas TAO für Gas im Subtensor-EVM-Netzwerk. Er zahlt nur die Gebühr; die Belohnung geht trotzdem an den Coldkey im Nachweis. Lege seinen 32-Byte-Hex-Schlüssel in eine private Datei und probiere es dann aus, ohne etwas zu senden:

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key --dry-run
```

Reiche ihn dann ein:

```bash
provider claim --epoch='<settlement_epoch>' \
  --rpc='https://<evm-json-rpc>' \
  --key_file=/absolute/private/relayer.key
```

`--key_file` braucht `--rpc`. Jeder Relayer mit Guthaben kann deinen Nachweis einreichen: Er kann den Coldkey nicht ändern und die Belohnung nicht erhalten. Die Belohnung kommt als nativer α-Stake auf deinem Coldkey an. Der Seed des Coldkeys wird für den Claim nicht gebraucht.

### 3. Das Ergebnis lesen

| Ereignis | Bedeutung |
| --- | --- |
| `Claimed` | Der Tresor hat den Claim angenommen und deinem Coldkey gutgeschrieben. Für sich allein beweist das keine Überweisung. |
| `ClaimPaid` | Die Gutschrift wurde an deinen Coldkey überwiesen. |
| `ClaimPaymentDeferred` | Die Gutschrift bleibt vorerst im Tresor, zum Beispiel weil sie unter dem Überweisungsminimum liegt, der Preis nicht verfügbar ist oder die Überweisung fehlgeschlagen ist. |

Eine zurückgestellte Gutschrift verfällt nicht. Ein späterer Claim zahlt die angesammelte Gutschrift aus, sobald eine Zahlung möglich ist, und jeder kann es mit der Methode `withdrawClaimCredit(bytes32 coldkey)` des Tresors erneut versuchen; `snclaim withdraw --vault=v1` (mit `--coldkey`, `--contract`, `--rpc` und `--key_file`) ruft sie auf. Einen bereits angenommenen Claim erneut einzureichen ist keine Abhebung und schlägt als bereits beansprucht fehl.

Beanspruche vor dem Verfall des Anspruchs. Im Mainnet sind das acht Epochen plus eine Kulanzepoche; danach können nicht beanspruchte Belohnungen in den Pool desselben Betreibers zurückfließen. Der Verfall entfernt keine bereits angenommene Gutschrift. Ab der Umstellungsepoche von Settlement v2 verfallen Konten nie.

Um automatisch zu beanspruchen oder von einem anderen Computer als dem Miner einzureichen, siehe [Fortgeschritten](/docs/miner/advanced#claim-automatically).
