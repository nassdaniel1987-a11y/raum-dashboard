# Datenbank-Migrationen

Dieser Ordner enthält SQL-Migrationen für die Supabase-Datenbank.

## Migration ausführen

1. Öffne dein **Supabase Dashboard**
2. Gehe zu **SQL Editor**
3. Kopiere den Inhalt der Migration-Datei
4. Führe die SQL-Befehle aus

## Aktuelle Migrationen

### 20250101_add_activity_image_fields.sql
Fügt Felder für Aktivitäts-Bilder zur `daily_configs` Tabelle hinzu:
- `activity_image_url` - URL oder Base64 des Bildes
- `activity_image_size` - Größe: 'small', 'medium', 'large'
- `activity_image_crop` - Crop-Koordinaten als JSONB

**Status:** ⏳ Noch nicht ausgeführt

Nach Ausführung bitte Status hier auf ✅ ändern.
