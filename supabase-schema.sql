-- Digitales Raum-Dashboard - Supabase Schema
-- Dieses Script in der Supabase SQL-Console ausführen

-- Räume (Basis-Entities)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  width INTEGER DEFAULT 300,
  height INTEGER DEFAULT 250,
  background_color TEXT DEFAULT '#4CAF50',
  image_url TEXT,
  theme TEXT DEFAULT 'space',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tages-Konfiguration (Mo-Fr)
CREATE TABLE IF NOT EXISTS daily_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  weekday INTEGER CHECK (weekday BETWEEN 1 AND 5), -- 1=Mo, 5=Fr
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
  CHECK (id = 1) -- Nur eine Zeile erlaubt
);

-- Insert default settings
INSERT INTO app_settings (id, night_mode_enabled, night_start, night_end, current_theme)
VALUES (1, true, '17:00', '07:00', 'space')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies (Row Level Security)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Alle können lesen (für TV-Anzeige)
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Daily configs are viewable by everyone" ON daily_configs FOR SELECT USING (true);
CREATE POLICY "Room status is viewable by everyone" ON room_status FOR SELECT USING (true);
CREATE POLICY "App settings are viewable by everyone" ON app_settings FOR SELECT USING (true);

-- Alle können schreiben (in Produktion: nur Admins via auth)
CREATE POLICY "Rooms are editable by everyone" ON rooms FOR ALL USING (true);
CREATE POLICY "Daily configs are editable by everyone" ON daily_configs FOR ALL USING (true);
CREATE POLICY "Room status is editable by everyone" ON room_status FOR ALL USING (true);
CREATE POLICY "App settings are editable by everyone" ON app_settings FOR ALL USING (true);

-- Demo-Daten einfügen
INSERT INTO rooms (name, position_x, position_y, width, height, background_color, theme)
VALUES 
  ('Turnhalle', 100, 100, 350, 280, '#FF6B6B', 'space'),
  ('Bibliothek', 500, 100, 350, 280, '#4ECDC4', 'space'),
  ('Musikraum', 900, 100, 350, 280, '#FFE66D', 'space'),
  ('Kunstraum', 100, 450, 350, 280, '#95E1D3', 'space'),
  ('Computerraum', 500, 450, 350, 280, '#A8E6CF', 'space');

-- Status für alle Räume initialisieren
INSERT INTO room_status (room_id, is_open, manual_override)
SELECT id, false, false FROM rooms
ON CONFLICT (room_id) DO NOTHING;

-- Demo-Konfigurationen für Montag
INSERT INTO daily_configs (room_id, weekday, activity, open_time, close_time)
SELECT 
  id,
  1, -- Montag
  CASE 
    WHEN name = 'Turnhalle' THEN 'Freies Spielen'
    WHEN name = 'Bibliothek' THEN 'Lesestunde'
    WHEN name = 'Musikraum' THEN 'Instrumentenspiel'
    WHEN name = 'Kunstraum' THEN 'Malen & Basteln'
    WHEN name = 'Computerraum' THEN 'Programmieren lernen'
  END,
  '08:00',
  '15:00'
FROM rooms
ON CONFLICT (room_id, weekday) DO NOTHING;

-- Storage Bucket für Raum-Bilder erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Jeder kann Bilder sehen
CREATE POLICY "Room images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Storage Policy: Jeder kann Bilder hochladen (für Demo - in Produktion einschränken!)
CREATE POLICY "Anyone can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'room-images');
