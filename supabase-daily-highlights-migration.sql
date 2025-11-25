-- =============================================
-- Daily Highlights Feature - Migration Script
-- =============================================
-- Version: 1.1.0 (2025-11-25)
-- Dieses Script in der Supabase SQL-Console ausführen

-- =====================
-- TABLE: daily_highlights
-- =====================
CREATE TABLE IF NOT EXISTS daily_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sonntag, 6=Samstag
  icon TEXT DEFAULT '📌',
  text TEXT NOT NULL,
  color TEXT DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'yellow', 'red', 'purple', 'orange')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_daily_highlights_weekday ON daily_highlights(weekday, sort_order);

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE daily_highlights ENABLE ROW LEVEL SECURITY;

-- Jeder kann Highlights sehen
DROP POLICY IF EXISTS "Daily highlights are viewable by everyone" ON daily_highlights;
CREATE POLICY "Daily highlights are viewable by everyone"
ON daily_highlights FOR SELECT
USING (true);

-- Jeder kann Highlights bearbeiten (kann später eingeschränkt werden)
DROP POLICY IF EXISTS "Daily highlights are editable by everyone" ON daily_highlights;
CREATE POLICY "Daily highlights are editable by everyone"
ON daily_highlights FOR ALL
USING (true);

-- =====================
-- DEMO DATA (Optional)
-- =====================

-- Beispiel-Highlights für Montag (weekday = 1)
INSERT INTO daily_highlights (weekday, icon, text, color, sort_order) VALUES
  (1, '🏀', 'Basketball-Training 14:00 Turnhalle 1', 'blue', 1),
  (1, '🎭', 'Theater-AG 16:00 Aula', 'purple', 2),
  (1, '📚', 'Bibliothek heute bis 20:00 geöffnet', 'green', 3)
ON CONFLICT DO NOTHING;

-- Beispiel-Highlights für Freitag (weekday = 5)
INSERT INTO daily_highlights (weekday, icon, text, color, sort_order) VALUES
  (5, '🎉', 'Schulfest ab 15:00 auf dem Schulhof', 'orange', 1),
  (5, '🍕', 'Pizza-Tag in der Mensa', 'red', 2)
ON CONFLICT DO NOTHING;

-- =====================
-- FERTIG!
-- =====================
-- Die Tabelle ist nun bereit. Die App kann jetzt Tages-Highlights anzeigen und verwalten.
