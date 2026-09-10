# Redesign · Marlon Greta

## Ausgangspunkt

Statisches HTML/CSS/JavaScript, drei Seiten: `/`, `/en/`, `/gemeinden/`. Keine Projekt-AGENTS.md gefunden. Primäre Zielgruppen sind Unternehmen, Selbstständige und öffentliche Organisationen; primärer Weg ist die Projektanfrage. Kontakt-Endpoint, Tracking, Projektlinks und SEO-Metadaten bleiben erhalten.

Desktop und Smartphone wurden vor der Änderung im Browser angesehen. Der alte Einstieg belegte eine ganze Bildschirmhöhe vor der Navigation und wiederholte anschließend den Hero. Die referenzierten Videos fehlten. Drei externe Schriftfamilien, dunkle Verläufe, Glasbuttons und gleichförmige Karten schwächten Hierarchie und Wiedererkennbarkeit. Projektbilder wurden stark abgedunkelt; das horizontale Projektkarussell machte weitere Arbeiten leicht übersehbar.

## Referenzen und Einfluss

Recherche über Curated-Suche „portfolio“, Recent-Filter „Websites / Portfolio“, Originkit-Suche „button“ sowie die ThreeUI-Sammlung. Alle unten genannten Gestaltungen wurden im Browser visuell betrachtet, einschließlich der geladenen Live-Ansichten. Die erste Fassung verwendete keinen fremden Komponenten-Code. Auf ausdrücklichen Folgeauftrag wurde anschließend der vom Nutzer gelieferte Originkit-Phosphor-Shader integriert.

| Referenz | Überzeugendes Detail | Einsatz und eigenständige Anpassung |
| --- | --- | --- |
| [Diego VZ · Curated](https://curated.design/sites/s/4410/) / [Live](https://diegovz.com/) | Große, selbstbewusste Typografie und ein persönliches Portrait machen den Urheber sichtbar. | Ein eigener, ruhiger Hero mit vorhandenem Portrait; helles Umfeld, klare Leistungsbotschaft und wesentlich weniger Animation. |
| [How&How · Curated](https://curated.design/sites/s/24658/) / [Live](https://how.studio/) | Großzügige Flächen und eine klare Reihenfolge von Aussage zu Arbeiten. | Die Projektübersicht folgt direkt auf den Einstieg. Eigene Screenshots ersetzen dekorative Motive; keine Markenassets oder Texte übernommen. |
| [Harry Atkins · Recent](https://recent.design/i/9b18jw0-harry-atkins) / [Live](https://harryjatkins.com/) | Typografische Identität, feine Trennlinien und eine auf Arbeiten konzentrierte Übersicht. | Zweispaltiges Portfolio, großzügige Bildflächen und zurückhaltende Metadaten. Mobil eine vollständig vertikale Liste. |
| [Originkit · Arrow Reveal Button](https://www.originkit.dev/components/arrow-reveal-button) | Klarer Zusammenhang zwischen Beschriftung, Richtungspfeil und Aktion. | Eigenes CSS: kurzer Pfeilversatz beim Hover, unveränderte Beschriftung, sichtbarer Tastaturfokus. Keine Abhängigkeit und kein übernommener Code. |
| [ThreeUI · Tactile Button auf 21st](https://21st.dev/@mengto/components/tactile-button) / [Sammlung](https://21st.dev/@mengto/library/threeui) | Die Live-Demo zeigt eine deutliche taktile Reaktion, jedoch als WebGL-Flüssigkeitseffekt. | Als Gegenprüfung verwendet: Ein einfacher Druckzustand passt zum Projekt; Shader und React-Embed bringen hier keinen Mehrwert. Listing nennt MIT; mangels Übernahme ist keine Integration oder Abhängigkeitsinstallation erfolgt. |
| [Apple HIG · Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Schriftgröße, Gewicht und Farbe bilden eine verständliche Hierarchie; wenige Schriftfamilien, Lesbarkeit auch bei größerem Text. | Eigene Web-Tokens, normale statt dünne Textgewichte, klare Fokuszustände. Apple-spezifische Punktgrößen, SF-Schriften und Dynamic-Type-APIs wurden nicht als Webvorgaben übernommen. |

Die textbasierte Abfrage von Originkit und Apple lieferte zunächst keine brauchbaren Inhalte; beide Quellen ließen sich anschließend im Browser lesen beziehungsweise ansehen.

## Zwei Richtungen

**A · Digitales Handwerk (gewählt):** heller Grund, präzise Sans Serif, ein redaktioneller Serif-Akzent, Kobaltblau, echte Projektbilder, persönliche Zusammenarbeit.

**B · Technisches Atelier:** dunkles Anthrazit, ausschließlich Sans Serif, kompakte technische Labels, kontrastreiche großflächige Screenshots. Näher am bisherigen Auftritt und am Entwicklerpublikum, aber weniger zugänglich für die breite Zielgruppe.

A verbindet gestalterische Kompetenz und eine verständliche Ansprache für Unternehmen und Gemeinden. Leitidee: **Digitale Arbeit wird klar, persönlich und konkret sichtbar.**

## Designsystem

- Grund `#f8f9f7`, Text `#20231f`, Sekundärtext `#61665e`, Aktion `#2448e8`, Hover `#1636ba`, Linien `#d5d8d0`, Nebenflächen `#edf0e9`, Kontakt `#202820`.
- Maximalbreite 1312 px einschließlich responsivem Innenabstand; auf großen Screens rund 1184 px Inhaltsbreite. Fließtexte meist 510–650 px breit.
- Hero 48–96 px, H2 32–56 px, H3 etwa 22 px, Fließtext 16–17 px. Zeilenhöhe 1.6 im Text, circa 1.0–1.12 in großen Überschriften. Größen in rem/clamp.
- Abschnittsabstände 72–128 px, Grundraster aus 8/16/24/32 px. Projekte zweispaltig, Leistungen als nummerierte Zeilen, FAQ und Projektdetails als native `details`.
- Eckradius 3–4 px für Bedienelemente, klare Linien statt Schattenkarten. Formulare mit sichtbaren Labels, Fokusrahmen, nativer Validierung und bestehender Statusmeldung.
- Vorhandene Screenshots, Portrait in CSS entsättigt, vorhandene SVG-Icons. Kurze 180–350-ms-Reaktionen ausschließlich an interaktiven Elementen. `prefers-reduced-motion` deaktiviert Bewegung und Smooth Scrolling. Keine automatisch laufenden Videos, Marquees oder Reveal-Verstecke. Der anschließend ausdrücklich gewünschte Phosphor-Effekt ist pausierbar und berücksichtigt reduzierte Bewegung.

## Schriftvergleich

[Lokalen Schriftvergleich öffnen](http://localhost:4174/docs/typography.html). Verglichen wurden dieselbe echte Angebotsbotschaft, Fließtext und „Ä Ö Ü ä ö ü ß“.

1. **Instrument Sans allein:** klare, präzise Wirkung und ruhiger Fließtext; die große Aussage wirkt sachlicher.
2. **Manrope allein:** geometrischer, kompakter Charakter, wirkt technischer und etwas geschlossener. Nur im separaten Vergleich geladen.
3. **Instrument Sans + Instrument Serif Italic (gewählt):** sachliche UI mit einem gezielten persönlichen Akzent auf „einfacher / simpler“. Die Serif wird nicht für kleine Texte eingesetzt.

Instrument Sans ist als variable WOFF2 lokal gespeichert (30.092 Bytes), Instrument Serif Italic 400 als WOFF2 (22.128 Bytes). Zusammen 52.220 Bytes. Die Seite verwendet Sans 400/500/600 und Serif 400 Italic, maximal zwei Familien. Fallbacks sind Arial beziehungsweise Georgia. `font-display: swap` und ein Sans-Preload sind gesetzt. Lateinisches Subset einschließlich deutscher Umlaute/ß; visuell im Vergleich kontrolliert. Lizenz: SIL OFL 1.1, die originalen Lizenztexte liegen neben den Fonts. Dateien stammen aus dem Fontsource-CDN; Lizenzquellen: [Instrument Sans](https://github.com/google/fonts/tree/main/ofl/instrumentsans), [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif), [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope).

## Erhalt und Änderungen

Alle drei Routen und vorhandenen Fragment-IDs bleiben erreichbar; `intro` verweist jetzt auf den einzigen Hero. Sprachwahl bleibt verfügbar. Die automatische Spracherkennung ist lokal ausgenommen und verwendet auf der Live-Seite ein relatives Ziel statt eines fest eingebauten GitHub-Hosts. Manuelle Sprachwahl und Tracking bleiben bestehen. Formulardaten, Name-Mapping, Endpoint und Geschäftslogik wurden nicht geändert.

Die verfügbaren Inhalte bleiben erhalten; nur doppelte Intro-Aussagen und der redaktionelle Platzhalter über künftige Testimonials wurden verdichtet. Projektlisten stehen auf Wunsch in ausklappbaren Details. Keine erfundenen Referenzen, Zahlen oder Kundenbewertungen.

## Prüfung

- Alle drei Seiten im Browser bei 390, 768 und 1440 px angesehen; kein horizontaler Seitenüberlauf in den gemessenen Ansichten.
- Desktop/Tablet/Mobil: Hero, Projektbilder, Leistungsübersicht und Kontakt kontrolliert; abgeschnittene Screenshot-Ränder durch `object-fit: contain` behoben.
- Mobilmenü öffnet/schließt, `aria-expanded` stimmt, Escape setzt Fokus zurück. Native FAQ/Projekt-Details sind per Tastatur bedienbar.
- Ungültiges leeres Formular: Fokus auf Name, native Meldung und Fehlerrahmen; kein Versand.
- Fünf vorhandene Tests bestanden: deutscher Payload/Erfolg, englische Feldzuordnung, ungültiges Formular, Serverfehler, fehlender Endpoint. Erfolg/Serverfehler werden dort mit simuliertem Netzwerk getestet.
- JavaScript-Syntax und `git diff --check` geprüft. Kein Build- oder Lint-Script im statischen Projekt vorhanden.
- Lokale HTML-Referenzen geprüft: keine fehlenden verlinkten Dateien/Fragmente, keine doppelten IDs, jeweils genau ein H1. Vorhandenes externes OG-Metadatum bleibt unverändert; zugehörige Bilddatei fehlt bereits im Bestand.
- Keine echten Anfragen versendet und nichts veröffentlicht. Reale Mailzustellung und vollständige Screenreader-/WCAG-Konformität bleiben außerhalb dieser Prüfung.

## Ergänzung auf Wunsch

- Fontwise verwendet den vom Nutzer gelieferten Screenshot (2414 × 1282), vollständig eingepasst.
- Das Hero-Portrait auf Deutsch und Englisch ist durch [Originkit Phosphor](https://www.originkit.dev/components/phosphor) ersetzt. Der Nutzer hat den Komponenten-Code zur Nutzung bereitgestellt. Shader aus diesem Code übernommen, React-Lebenszyklus durch eigenes Vanilla-JavaScript ersetzt; keine neuen Paketabhängigkeiten. Kein pauschaler MIT-Lizenzclaim für diesen Shader: Die öffentlich lesbare Komponenten-Seite enthält keinen ausdrücklichen Lizenztext.
- Rendering auf maximal 420 px Puffergröße und 30 fps begrenzt. Pause-Taste, Standbild bei reduzierter Bewegung, Stopp außerhalb des Viewports und bei verborgenem Tab, Fallback bei fehlendem WebGL.
- Kundenleiste direkt unter dem Hero mit vorhandenen Markenassets und allen sieben bestehenden Live-Links: CarPriceAI, Fontwise, The White Castle, Timberon AT/DE, KebapPreis, Der Gute Freund. Mobil als Raster ohne versteckte Einträge.

Die sieben Live-URLs wurden per HTTP-Abruf kontrolliert; alle lieferten nach Weiterleitungen Status 200. Aktualisiertes Hero-Layout erneut bei 390, 768 und 1440 px geprüft.

Zusätzlich wurde die Startseite mit 200 % Basisschriftgröße in einer lokalen Testkopie bei 1440 und 390 px geprüft. Navigation und Textblöcke können dafür umbrechen; horizontale Überläufe wurden behoben. Dieser Test ersetzt keinen vollständigen Screenreader-Audit.

## Letzte Vereinfachung

Auf Wunsch: transparenter Phosphor-Canvas mit echter Alpha-Komposition, kein schwarzer Hintergrund und kein sichtbarer Animationsbutton. Reduzierte Bewegung und automatische Renderpause außerhalb des Viewports bleiben erhalten. Hero-Fußzeile, Beschriftung unter dem Effekt, doppelte Qualitätssätze und der redundante deutsche Abschnitt „Was du bekommst“ entfernt.
