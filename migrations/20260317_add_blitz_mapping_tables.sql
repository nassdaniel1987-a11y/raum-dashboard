-- Migration: Blitz-Protokoll Integration
-- Erstellt Mapping-Tabellen um Räume und Personen zwischen
-- Blitz-Protokoll und Dashboard zu verknüpfen.

-- ============================
-- 1. Raum-Mapping-Tabelle
-- ============================
CREATE TABLE IF NOT EXISTS blitz_room_mapping (
    blitz_room_id   TEXT PRIMARY KEY,        -- z.B. "treffpunkt_1", "atelier"
    blitz_label     TEXT NOT NULL,            -- Anzeigename aus Blitz, z.B. "Treffpunkt 1"
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,  -- Dashboard-Raum
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 2. Personen-Mapping-Tabelle
-- ============================
CREATE TABLE IF NOT EXISTS blitz_person_mapping (
    blitz_slug      TEXT PRIMARY KEY,         -- z.B. "max", "anna"
    blitz_name      TEXT NOT NULL,            -- Anzeigename aus Blitz, z.B. "Max"
    person_id       UUID REFERENCES persons(id) ON DELETE SET NULL,  -- Dashboard-Person
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 3. Blitz-Integration Einstellungen
-- ============================
CREATE TABLE IF NOT EXISTS blitz_settings (
    id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Nur eine Zeile
    enabled         BOOLEAN DEFAULT false,
    api_url         TEXT,                     -- z.B. "https://blitz-protokoll.netlify.app/api/raumuebersicht"
    polling_interval_seconds INTEGER DEFAULT 30,
    last_sync       TIMESTAMPTZ,
    last_error      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Default-Einstellungen einfügen
INSERT INTO blitz_settings (id, enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- ============================
-- 4. Row Level Security (RLS)
-- ============================
ALTER TABLE blitz_room_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE blitz_person_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE blitz_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to blitz_room_mapping" ON blitz_room_mapping
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to blitz_person_mapping" ON blitz_person_mapping
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to blitz_settings" ON blitz_settings
    FOR ALL USING (true) WITH CHECK (true);
