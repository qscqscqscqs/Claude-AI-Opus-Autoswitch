
Claude AI Opus Autoswitch

Überblick

Claude AI Opus Autoswitch ist eine Firefox‑Erweiterung, die Claude‑chats automatisch auf das leistungsfähige Opus‑Modell umschaltet. Sie entstand aus der Frustration darüber, dass Claude beim Start eines neuen Chats wieder auf das Sonnet‑Modell zurückfällt und manuell zu Opus gewechselt werden musste. Das Add‑on entfernt diesen Schritt vollständig: Sobald Sie die Seite claude.ai besuchen, wird automatisch das Opus‑Modell aktiviert.

Die Erweiterung richtet sich an Entwickler und Power‑User, die häufig neue Claude‑Chats starten und vom stärkeren Modell profitieren möchten. Durch eine anpassbare Chat‑Erkennung wird dabei sichergestellt, dass bestehende Unterhaltungen nicht unterbrochen werden.

Hauptfunktionen

- Automatisches Umschalten auf Claude Opus 4.1 – beim Laden der Seite wird Opus ausgewählt, ohne dass Sie manuell eingreifen müssen.
- Intelligente Modell‑Erkennung – das Add‑on erkennt den aktuell gewählten Modus und wechselt nur, wenn Sonnet aktiv ist.
- Mehrfache Umschaltversuche – bei Fehlschlägen werden bis zu fünf Versuche unternommen, um das Menü zu öffnen und Opus zu aktivieren.
- Übersichtliches Popup‑Menü – ein kleines Popup zeigt den Status an und bietet einen Umschalter zum Aktivieren/Deaktivieren der Automatik.
- Manueller Umschalt‑Button – mit einem Klick können Sie jederzeit manuell zu Opus wechseln.
- Persistente Speicherung – Einstellungen wie Automatik‑Status und Erkennungs‑Sensitivität werden lokal gespeichert und bleiben beim Browser‑Neustart erhalten.
- Anpassbare Chat‑Erkennung – wählen Sie zwischen „Hoch“ (wechseln nur, wenn das Eingabefeld leer ist) und „Niedrig“ (wechseln, sofern noch keine Nachricht gesendet wurde).
- Aktuellstes Release (Version 1.6) – enthält eine verbesserte Chat‑Erkennung und reagiert auf Änderungen der HTML‑Struktur von claude.ai mit generischer Klassenerkennung.

Installation

Firefox Add‑ons Store

Die einfachste Installation erfolgt über Mozillas Add‑ons Store. Besuchen Sie die Add‑on‑Seite und klicken Sie auf „Zu Firefox hinzufügen“. Nach der Installation wird das Add‑on automatisch aktiviert und erscheint in Ihrer Toolbar.

Installation aus dem Quellcode / lokale Entwicklung

1. Dieses Repository klonen oder als ZIP herunterladen.
2. Öffnen Sie in Firefox die Seite about:debugging#/runtime/this-firefox.
3. Wählen Sie „Temporäres Add‑on laden“ und wählen Sie die Datei manifest.json aus dem Projektverzeichnis aus. Das Add‑on wird temporär geladen und kann getestet werden.
4. Für eine permanente Installation müssen Sie das Add‑on signieren und verpacken. Nutzen Sie dazu Mozillas Signierungs‑Infrastruktur.

Nutzung

Nach der Installation besuchen Sie https://claude.ai und starten Sie einen neuen Chat. Das Add‑on überprüft, ob ein Sonnet‑Modell ausgewählt ist, und schaltet automatisch auf Opus um. Über das Browser‑Action‑Icon (die kleine Schaltfläche in der Toolbar) erreichen Sie das Popup:

- Nutzen Sie den Umschalter, um die automatische Umschaltung zu aktivieren oder zu deaktivieren.
- Stellen Sie unter Chat‑Erkennungs‑Sensitivität die Erkennung ein: Hoch verhindert einen Wechsel, wenn sich bereits Text im Eingabefeld befindet; Niedrig wechselt, solange noch keine Nachricht im Chat gesendet wurde.
- Der Button „Jetzt auf Opus umschalten“ erzwingt unmittelbar einen Wechsel, falls Sie während einer Sitzung manuell zum Sonnet‑Modell zurückgekehrt sind.

Die Erweiterung speichert Ihre Einstellungen lokal, sodass Sie beim nächsten Browser‑Start nicht erneut konfiguriert werden müssen.

Berechtigungen und Datenschutz

Claude AI Opus Autoswitch benötigt die folgenden Firefox‑Berechtigungen:

- Zugriff auf Browser‑Tabs und die aktuellen Seitenänderungen.
- Zugriff auf Browseraktivität während des Seitenwechsels.
- Zugriff auf Daten für Websites in der Domain claude.ai.

Diese Berechtigungen dienen ausschließlich dazu, das Modell‑Menü zu öffnen und die Seite zu analysieren. Das Add‑on überträgt keine persönlichen Daten an Dritte. Einstellungen werden mithilfe der Browser‑Speicher‑API (chrome.storage.local) ausschließlich lokal gespeichert, und es findet kein externes Logging statt.

Fehlersuche

- Die Umschaltung funktioniert nicht: Stellen Sie sicher, dass Sie sich auf der Seite claude.ai befinden und das Sonnet‑Modell aktiv ist. Überprüfen Sie, ob die Automatik im Popup aktiviert ist.
- Das Modell schaltet sich zurück auf Sonnet: Bei großen Änderungen an der Webseite kann das Add‑on die Schaltfläche gelegentlich nicht finden. Aktualisieren Sie das Add‑on auf die neueste Version oder verringern Sie die Sensitivität.
- Fehler „Umschaltung fehlgeschlagen“: Der manuelle Wechsel benötigt eine aktive Claude‑Registerkarte. Öffnen Sie einen Chat und versuchen Sie es erneut.
- Debugging: Sollten unerwartete Probleme auftreten, öffnen Sie die Entwickler‑Werkzeuge Ihres Browsers (F12) und prüfen Sie die Konsole. Fehlermeldungen des Add‑ons helfen dabei, das Problem zu diagnostizieren.
