-- Migration: Personen-Verwaltung
-- Erstellt eine eigene Tabelle für Personen, die Räumen zugeordnet werden können.
-- Die bestehende rooms.person TEXT-Spalte wird weiterhin als kommaseparierte Liste verwendet,
-- aber die Namen kommen jetzt aus der persons-Tabelle.

-- ============================
-- 1. Personen-Tabelle erstellen
-- ============================
CREATE TABLE IF NOT EXISTS persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Sortierung
CREATE INDEX IF NOT EXISTS idx_persons_sort_order ON persons (sort_order, name);

-- ============================
-- 2. Row Level Security (RLS)
-- ============================
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Erlaubt allen Zugriff (gleich wie bei den anderen Tabellen im Schulumfeld)
CREATE POLICY "Allow all access to persons" ON persons
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================
-- 3. Bestehende Personen aus rooms.person migrieren (optional)
-- ============================
-- Falls bereits Personen-Namen in der rooms.person Spalte stehen,
-- können diese automatisch in die neue Tabelle übernommen werden:
--
-- INSERT INTO persons (name, sort_order)
-- SELECT DISTINCT TRIM(unnest(string_to_array(person, ','))) AS name,
--        ROW_NUMBER() OVER (ORDER BY TRIM(unnest(string_to_array(person, ',')))) AS sort_order
-- FROM rooms
-- WHERE person IS NOT NULL AND person != ''
-- ON CONFLICT DO NOTHING;
