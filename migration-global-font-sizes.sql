-- Migration: Add global font sizes to app_settings
-- Fügt globale Schriftgrößen zur app_settings Tabelle hinzu

-- 1. Spalten zu app_settings hinzufügen
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS global_title_font_size INTEGER DEFAULT 16,
ADD COLUMN IF NOT EXISTS global_activity_font_size INTEGER DEFAULT 12;

-- 2. Default-Werte für existierende Row setzen
UPDATE app_settings
SET
    global_title_font_size = 16,
    global_activity_font_size = 12
WHERE id = 1;

-- 3. Optional: title_font_size und text_font_size in daily_configs auf NULL setzen
-- (damit sie die globalen Werte verwenden, statt individuelle)
-- VORSICHT: Dies entfernt alle individuellen Schriftgrößen-Einstellungen!
-- Kommentiere die nächsten Zeilen ein, wenn du alle auf global umstellen willst:

-- UPDATE daily_configs
-- SET
--     title_font_size = NULL,
--     text_font_size = NULL;

-- 4. Alternativ: Nur Standard-Werte auf NULL setzen (16 für Titel, 12 für Text)
-- Dies behält custom Einstellungen, entfernt aber Default-Werte
UPDATE daily_configs
SET title_font_size = NULL
WHERE title_font_size = 16;

UPDATE daily_configs
SET text_font_size = NULL
WHERE text_font_size = 12;

-- Fertig! ✅
