-- =============================================
-- Digitales Raum-Dashboard - Supabase Schema
-- =============================================
-- Dieses Script in der Supabase SQL-Console ausführen

-- =====================
-- TABLES
-- =====================

-- Räume (mit Stockwerk-System)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  floor TEXT DEFAULT 'eg' CHECK (floor IN ('dach', 'og2', 'og1', 'eg', 'ug', 'extern')),
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  width INTEGER DEFAULT 300,
  height INTEGER DEFAULT 250,
  background_color TEXT DEFAULT '#4CAF50',
  image_url TEXT,
  theme TEXT DEFAULT 'space',
  person TEXT, -- Person, die in diesem Raum ist
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tages-Konfiguration (Mo-So)
CREATE TABLE IF NOT EXISTS daily_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  weekday INTEGER CHECK (weekday BETWEEN 0 AND 6), -- 0=So, 6=Sa
  activity TEXT,
  title_font_size INTEGER DEFAULT 42,
  text_font_size INTEGER DEFAULT 28,
  title_alignment TEXT DEFAULT 'center',
  text_alignment TEXT DEFAULT 'center',
  open_time TIME,
  close_time TIME,
  is_locked BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, weekday)
);

-- Echtzeit-Status (überschreibt Zeitpläne)
CREATE TABLE IF NOT EXISTS room_status (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  is_open BOOLEAN DEFAULT FALSE,
  manual_override BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Globale Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  night_mode_enabled BOOLEAN DEFAULT TRUE,
  night_start TIME DEFAULT '17:00',
  night_end TIME DEFAULT '07:00',
  current_theme TEXT DEFAULT 'space',
  CHECK (id = 1)
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_daily_configs_room_weekday ON daily_configs(room_id, weekday);
CREATE INDEX IF NOT EXISTS idx_room_status_room_id ON room_status(room_id);

-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Rooms
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
DROP POLICY IF EXISTS "Rooms are editable by everyone" ON rooms;

CREATE POLICY "Rooms are viewable by everyone" 
ON rooms FOR SELECT 
USING (true);

CREATE POLICY "Rooms are editable by everyone" 
ON rooms FOR ALL 
USING (true);

-- Daily Configs
DROP POLICY IF EXISTS "Daily configs are viewable by everyone" ON daily_configs;
DROP POLICY IF EXISTS "Daily configs are editable by everyone" ON daily_configs;

CREATE POLICY "Daily configs are viewable by everyone" 
ON daily_configs FOR SELECT 
USING (true);

CREATE POLICY "Daily configs are editable by everyone" 
ON daily_configs FOR ALL 
USING (true);

-- Room Status
DROP POLICY IF EXISTS "Room status is viewable by everyone" ON room_status;
DROP POLICY IF EXISTS "Room status is editable by everyone" ON room_status;

CREATE POLICY "Room status is viewable by everyone" 
ON room_status FOR SELECT 
USING (true);

CREATE POLICY "Room status is editable by everyone" 
ON room_status FOR ALL 
USING (true);

-- App Settings
DROP POLICY IF EXISTS "App settings are viewable by everyone" ON app_settings;
DROP POLICY IF EXISTS "App settings are editable by everyone" ON app_settings;

CREATE POLICY "App settings are viewable by everyone" 
ON app_settings FOR SELECT 
USING (true);

CREATE POLICY "App settings are editable by everyone" 
ON app_settings FOR ALL 
USING (true);

-- =====================
-- DEMO DATA
-- =====================

-- Demo-Räume mit Stockwerk-System
INSERT INTO rooms (name, floor, background_color) VALUES
  -- Extern (Sporthallen & Hof)
  ('Turnhalle 1', 'extern', '#FF5722'),
  ('Turnhalle 2', 'extern', '#E64A19'),
  ('Schulhof', 'extern', '#4CAF50'),
  
  -- Dachgeschoss
  ('Kunstraum', 'dach', '#E91E63'),
  ('Musikraum', 'dach', '#9C27B0'),
  ('Werkraum', 'dach', '#FF9800'),
  
  -- 2. OG
  ('Klasse 4a', 'og2', '#2196F3'),
  ('Klasse 4b', 'og2', '#03A9F4'),
  ('Lehrerzimmer', 'og2', '#607D8B'),
  
  -- 1. OG
  ('Klasse 3a', 'og1', '#00BCD4'),
  ('Klasse 3b', 'og1', '#00ACC1'),
  ('Computerraum', 'og1', '#009688'),
  
  -- Erdgeschoss
  ('Klasse 1a', 'eg', '#4CAF50'),
  ('Klasse 1b', 'eg', '#66BB6A'),
  ('Bibliothek', 'eg', '#8BC34A'),
  ('Sekretariat', 'eg', '#CDDC39'),
  
  -- Untergeschoss
  ('Essensraum', 'ug', '#FFC107'),
  ('Lagerraum', 'ug', '#795548')
ON CONFLICT DO NOTHING;

-- Status für alle Räume initialisieren
INSERT INTO room_status (room_id, is_open, manual_override)
SELECT id, false, false FROM rooms
ON CONFLICT (room_id) DO NOTHING;

-- Demo-Konfigurationen für Montag (alle Räume 08:00-15:00)
INSERT INTO daily_configs (room_id, weekday, activity, open_time, close_time)
SELECT 
  id,
  1, -- Montag
  CASE 
    WHEN name LIKE 'Turn%' THEN 'Sport & Bewegung'
    WHEN name = 'Schulhof' THEN 'Pause'
    WHEN name = 'Kunstraum' THEN 'Malen & Basteln'
    WHEN name = 'Musikraum' THEN 'Singen & Musizieren'
    WHEN name = 'Werkraum' THEN 'Werken'
    WHEN name LIKE 'Klasse%' THEN 'Unterricht'
    WHEN name = 'Computerraum' THEN 'IT-Unterricht'
    WHEN name = 'Bibliothek' THEN 'Lesen & Lernen'
    WHEN name = 'Essensraum' THEN 'Mittagessen'
    ELSE 'Verfügbar'
  END,
  '08:00',
  '15:00'
FROM rooms
WHERE floor != 'extern' -- Externe Räume keine festen Zeiten
ON CONFLICT (room_id, weekday) DO NOTHING;

-- App Settings initialisieren
INSERT INTO app_settings (id, night_mode_enabled, night_start, night_end, current_theme)
VALUES (1, true, '17:00', '07:00', 'space')
ON CONFLICT (id) DO UPDATE SET
  night_mode_enabled = EXCLUDED.night_mode_enabled,
  night_start = EXCLUDED.night_start,
  night_end = EXCLUDED.night_end,
  current_theme = EXCLUDED.current_theme;

-- =====================
-- STORAGE
-- =====================

-- Storage Bucket für Raum-Bilder erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Jeder kann Bilder sehen
DROP POLICY IF EXISTS "Room images are publicly accessible" ON storage.objects;
CREATE POLICY "Room images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Storage Policy: Jeder kann Bilder hochladen
DROP POLICY IF EXISTS "Anyone can upload room images" ON storage.objects;
CREATE POLICY "Anyone can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'room-images');

-- =====================
-- FERTIG!
-- =====================
-- Du kannst jetzt die App starten.
-- Demo-Daten sind vorhanden: 18 Räume auf 6 Stockwerken
