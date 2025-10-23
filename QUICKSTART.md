# 🚀 Quick Start Guide

## Schnellstart in 5 Minuten

### 1️⃣ Projekt installieren
```bash
npm install
```

### 2️⃣ Supabase Setup

1. Gehe zu https://supabase.com und erstelle ein Projekt
2. Öffne die SQL-Console
3. Kopiere den Inhalt von `supabase-schema.sql` und führe ihn aus
4. Gehe zu Settings > API

### 3️⃣ Environment-Variablen

Erstelle `.env` Datei:
```bash
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=dein-key
```

### 4️⃣ Starten!
```bash
npm run dev
```

Öffne http://localhost:5173

## ✅ Erste Schritte

1. **Bearbeitungs-Modus aktivieren**: Klicke unten auf "Bearbeitungs-Modus"
2. **Raum erstellen**: Gib einen Namen ein (z.B. "Turnhalle") und klicke "Erstellen"
3. **Raum öffnen**: Klicke auf die Karte um den Status zu ändern
4. **Position anpassen**: Ziehe die Karte an der gewünschten Position

## 🎯 Demo-Daten

Das SQL-Schema enthält bereits 5 Demo-Räume:
- Turnhalle
- Bibliothek
- Musikraum
- Kunstraum
- Computerraum

Diese werden automatisch beim ersten SQL-Import erstellt!

## 🐛 Häufige Probleme

### "Cannot read properties of undefined"
→ Prüfe ob die `.env` Datei korrekt erstellt wurde

### "Failed to fetch"
→ Prüfe deine Supabase URL und API Key

### Räume werden nicht angezeigt
→ Öffne die Supabase Table Editor und prüfe ob die `rooms` Tabelle Daten hat

## 📚 Weitere Infos

Siehe `README.md` für ausführliche Dokumentation!
