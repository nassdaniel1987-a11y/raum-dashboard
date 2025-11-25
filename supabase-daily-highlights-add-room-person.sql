-- =============================================
-- Daily Highlights - Add Room & Person Fields
-- =============================================
-- Version: 1.1.1 (2025-11-25)
-- Dieses Script in der Supabase SQL-Console ausführen

-- =====================
-- ALTER TABLE
-- =====================

-- Füge room und person Felder hinzu
ALTER TABLE daily_highlights
ADD COLUMN IF NOT EXISTS room TEXT,
ADD COLUMN IF NOT EXISTS person TEXT;

-- =====================
-- FERTIG!
-- =====================
-- Die Tabelle unterstützt jetzt Raum und Person für jedes Angebot
