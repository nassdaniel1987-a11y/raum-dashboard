# 🏫 Digitales Raum-Dashboard für Grundschulen

Ein interaktives, kindgerechtes Dashboard zur Anzeige von Raum-Status in Grundschulen. Optimiert für 82-Zoll-Fernseher im Eingangsbereich und iPad-Steuerung für Administratoren.

## 🎯 Features

### Kern-Funktionalität
- ✅ **Raum-Karten**: Visuell ansprechende Karten für jeden Raum mit Status (Offen/Geschlossen)
- ✅ **Drag & Drop**: Frei positionierbare Raum-Karten im Admin-Modus
- ✅ **Echtzeit-Updates**: Sofortige Synchronisation über Supabase Realtime
- ✅ **Zeit-Automatik**: Automatisches Öffnen/Schließen nach Zeitplan
- ✅ **Nachtruhe-Modus**: Globale Schließung aller Räume außerhalb der Öffnungszeiten
- ✅ **Touch-Optimiert**: Perfekte Bedienung auf iPad
- ✅ **TV-Optimiert**: Große Schrift, starke Kontraste, aus der Ferne lesbar

### Admin-Funktionen
- 🔓 **Bearbeitungs-Modus**: Einfacher Toggle zwischen Anzeige- und Admin-Modus
- 📦 **Bulk-Aktionen**: Alle Räume auf einmal öffnen/schließen
- ➕ **Raum-Verwaltung**: Neue Räume einfach erstellen
- 🎨 **Anpassbar**: Farben, Größen, Positionen individuell einstellbar

## 🚀 Tech Stack

- **Frontend**: SvelteKit (TypeScript)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Hosting**: Netlify
- **Drag & Drop**: @neodrag/svelte
- **Styling**: Native CSS mit Animationen

## 📋 Voraussetzungen

- Node.js 20+
- npm oder yarn
- Supabase-Account (kostenlos)
- Netlify-Account (optional, für Deployment)

## 🛠️ Installation & Setup

### 1. Repository klonen

```bash
git clone <dein-repo>
cd raum-dashboard
npm install
```

### 2. Supabase einrichten

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Öffne die SQL-Console im Supabase Dashboard
3. Kopiere den Inhalt von `supabase-schema.sql` und führe ihn aus
4. Gehe zu Settings > API und kopiere:
   - `URL` (Project URL)
   - `anon` public key

### 3. Environment-Variablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```bash
cp .env.example .env
```

Fülle die Werte aus:

```env
PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
PUBLIC_SUPABASE_ANON_KEY=dein-anon-key-hier
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft jetzt auf `http://localhost:5173`

## 🎨 Verwendung

### Anzeige-Modus (für TV)
- Standardmäßig aktiv beim Öffnen
- Zeigt alle Räume mit ihrem aktuellen Status
- Räume sind fixiert und nicht bewegbar
- Perfekt für die Spiegelung auf den großen Fernseher

### Bearbeitungs-Modus (für iPad-Admin)
1. Klicke auf "Bearbeitungs-Modus" in der unteren Toolbar
2. **Raum verschieben**: Ziehe die Karte am Griff-Symbol (⋮⋮)
3. **Status ändern**: Klicke auf eine Raum-Karte
4. **Neuen Raum erstellen**: Gib einen Namen ein und klicke "Erstellen"
5. **Bulk-Aktionen**: Nutze "Alle öffnen" oder "Alle schließen"

### Zeitpläne konfigurieren (in Supabase)

Gehe zur Supabase Table Editor und öffne `daily_configs`:

```sql
INSERT INTO daily_configs (room_id, weekday, activity, open_time, close_time)
VALUES (
  'deine-room-id',
  1, -- 1=Montag, 2=Dienstag, ..., 5=Freitag
  'Freies Spielen',
  '08:00',
  '15:00'
);
```

## 📱 iPad-Optimierung

### Screen Mirroring zum TV
1. Öffne die App auf dem iPad
2. Wische vom oberen rechten Rand nach unten (Control Center)
3. Tippe auf "Bildschirmsynchronisation"
4. Wähle deinen 82-Zoll-Fernseher aus

### Touch-Gesten
- **Einfaches Tippen**: Status ändern (im Edit-Modus)
- **Ziehen**: Raum-Karte verschieben
- **Pinch**: Größe ändern (geplant für zukünftige Version)

## 🌐 Deployment auf Netlify

### Variante 1: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Variante 2: GitHub Integration

1. Pushe deinen Code zu GitHub
2. Gehe zu [netlify.com](https://netlify.com)
3. Klicke "Import from Git"
4. Wähle dein Repository
5. Füge Environment-Variablen hinzu:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
6. Deploy!

## 🗄️ Datenbank-Schema

### Tabellen

**rooms**: Basis-Informationen zu jedem Raum
- `id`: UUID (Primary Key)
- `name`: Raum-Name
- `position_x`, `position_y`: Position auf Canvas
- `width`, `height`: Größe der Karte
- `background_color`: Hex-Farbcode
- `image_url`: Optional, Hintergrundbild
- `theme`: Theme-Name

**daily_configs**: Tages-spezifische Konfiguration
- `room_id`: Referenz zu Raum
- `weekday`: 1-5 (Mo-Fr)
- `activity`: Beschreibung der Aktivität
- `open_time`, `close_time`: Zeitplan
- `title_font_size`, `text_font_size`: Schriftgrößen

**room_status**: Aktueller Echtzeit-Status
- `room_id`: Referenz zu Raum
- `is_open`: Boolean
- `manual_override`: Wurde manuell gesetzt?

**app_settings**: Globale Einstellungen
- `night_mode_enabled`: Nachtruhe aktiv?
- `night_start`, `night_end`: Zeiten
- `current_theme`: Aktives Theme

## 🎨 Themes (Geplant)

- 🚀 **Weltraum**: Sterne, Planeten, Astronauten
- 🦖 **Dino-Land**: Dschungel, Dinosaurier
- ⚡ **Pokémon**: Pokéballs, Pikachu
- ⛏️ **Minecraft**: Blocky-Ästhetik

## 🔮 Roadmap / Nächste Features

- [ ] **Rudi das Maskottchen**: KI-Dino für Ankündigungen
- [ ] **Theme-Switcher**: UI zum Wechseln zwischen Themes
- [ ] **Scheduler-Modal**: Liste aller Zeitpläne auf einen Blick
- [ ] **Tag kopieren**: Montag-Plan auf Mittwoch kopieren
- [ ] **Bildupload**: Direkt in der App Bilder hochladen
- [ ] **Statistiken**: Welche Räume werden am meisten genutzt?
- [ ] **Push-Benachrichtigungen**: Lehrer-App für Status-Updates

## 🤝 Mitwirken

Contributions sind willkommen! Bitte:
1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Öffne einen Pull Request

## 📄 Lizenz

MIT License - Nutze es frei für deine Schule!

## 🎓 Support & Fragen

Bei Fragen oder Problemen:
- Öffne ein Issue auf GitHub
- Kontaktiere den Entwickler
- Schau in die Supabase-Dokumentation: [docs.supabase.com](https://docs.supabase.com)

---

**Viel Erfolg mit deinem Digitalen Raum-Dashboard! 🏫✨**
