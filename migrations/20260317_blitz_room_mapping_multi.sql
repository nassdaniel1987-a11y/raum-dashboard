-- Migration: Raum-Mapping auf Mehrfachzuordnung umbauen
-- Ein Blitz-Raum kann jetzt mehreren Dashboard-Räumen zugeordnet werden.
-- z.B. Blitz "Hof" → Dashboard "Hof (EG)" + "Hof (1.OG)" + "Hof (Extern)"

-- 1. Alte Tabelle umbenennen
ALTER TABLE IF EXISTS blitz_room_mapping RENAME TO blitz_room_mapping_old;

-- 2. Neue Tabelle mit zusammengesetztem Primary Key
CREATE TABLE blitz_room_mapping (
    blitz_room_id   TEXT NOT NULL,
    blitz_label     TEXT NOT NULL,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blitz_room_id, room_id)
);

-- 3. Daten migrieren (nur Einträge mit room_id)
INSERT INTO blitz_room_mapping (blitz_room_id, blitz_label, room_id, created_at)
SELECT blitz_room_id, blitz_label, room_id, created_at
FROM blitz_room_mapping_old
WHERE room_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Alte Tabelle löschen
DROP TABLE blitz_room_mapping_old;

-- 5. RLS
ALTER TABLE blitz_room_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to blitz_room_mapping" ON blitz_room_mapping
    FOR ALL USING (true) WITH CHECK (true);
