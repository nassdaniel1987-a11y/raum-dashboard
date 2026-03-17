import { writable, derived, get } from 'svelte/store';
import type {
	BlitzRoomMapping,
	BlitzPersonMapping,
	BlitzSettings,
	BlitzApiResponse
} from '$lib/types';
import { supabase } from '$lib/supabase/client';
import { rooms, persons, appSettings } from './appState';

// ===== BLITZ STORES =====
export const blitzSettings = writable<BlitzSettings | null>(null);
export const blitzRoomMappings = writable<BlitzRoomMapping[]>([]);
export const blitzPersonMappings = writable<BlitzPersonMapping[]>([]);
export const blitzData = writable<BlitzApiResponse | null>(null);
export const blitzLastError = writable<string | null>(null);
export const blitzSyncing = writable(false);

// ===== DERIVED: Gemappte Personen pro Dashboard-Raum =====
// Berechnet aus den Blitz-Daten + Mappings welche Dashboard-Personen in welchem Dashboard-Raum sind
// Ein Blitz-Raum kann mehreren Dashboard-Räumen zugeordnet sein (1:n)
export const blitzRoomPersons = derived(
	[blitzData, blitzRoomMappings, blitzPersonMappings, persons],
	([$data, $roomMappings, $personMappings, $persons]) => {
		const result = new Map<string, string[]>(); // Dashboard room_id → Person-Namen

		if (!$data?.zuweisungen_gesamt) return result;

		for (const [blitzRoomId, blitzPersons] of Object.entries($data.zuweisungen_gesamt)) {
			// Blitz-Raum → ALLE zugeordneten Dashboard-Räume finden
			const roomMappings = $roomMappings.filter(m => m.blitz_room_id === blitzRoomId);
			if (roomMappings.length === 0) continue;

			const personNames: string[] = [];
			for (const bp of blitzPersons) {
				// Blitz-Person → Dashboard-Person finden
				const personMapping = $personMappings.find(m => m.blitz_slug === bp.slug);
				if (personMapping?.person_id) {
					const dashPerson = $persons.find(p => p.id === personMapping.person_id);
					if (dashPerson) {
						personNames.push(dashPerson.name);
					}
				} else {
					// Kein Mapping vorhanden — Blitz-Namen direkt verwenden
					personNames.push(bp.name);
				}
			}

			if (personNames.length > 0) {
				// Gleiche Personen in ALLE zugeordneten Dashboard-Räume schreiben
				for (const mapping of roomMappings) {
					const existing = result.get(mapping.room_id) || [];
					result.set(mapping.room_id, [...existing, ...personNames]);
				}
			}
		}

		return result;
	}
);

// ===== DERIVED: Läufer vom Blitz =====
export const blitzRunner = derived(blitzData, ($data) => $data?.laufer || null);

// ===== DATEN LADEN =====

export async function loadBlitzSettings(): Promise<void> {
	const { data, error } = await supabase
		.from('blitz_settings')
		.select('*')
		.eq('id', 1)
		.single();

	if (error) {
		console.error('[Blitz] Settings laden fehlgeschlagen:', error.message);
		return;
	}
	blitzSettings.set(data);
}

export async function loadBlitzMappings(): Promise<void> {
	const [roomRes, personRes] = await Promise.all([
		supabase.from('blitz_room_mapping').select('*'),
		supabase.from('blitz_person_mapping').select('*')
	]);

	if (roomRes.error) {
		console.error('[Blitz] Raum-Mappings laden fehlgeschlagen:', roomRes.error.message);
	} else {
		blitzRoomMappings.set(roomRes.data || []);
	}

	if (personRes.error) {
		console.error('[Blitz] Personen-Mappings laden fehlgeschlagen:', personRes.error.message);
	} else {
		blitzPersonMappings.set(personRes.data || []);
	}
}

// ===== BLITZ-API DATEN HOLEN =====

export async function fetchBlitzData(): Promise<void> {
	const settings = get(blitzSettings);
	if (!settings?.enabled) return;

	blitzSyncing.set(true);
	blitzLastError.set(null);

	try {
		const response = await fetch('/api/blitz-data');

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}

		const data: BlitzApiResponse = await response.json();
		blitzData.set(data);

		// Sync-Zeitpunkt in Supabase speichern
		await supabase
			.from('blitz_settings')
			.update({ last_sync: new Date().toISOString(), last_error: null })
			.eq('id', 1);

	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
		console.error('[Blitz] Daten abrufen fehlgeschlagen:', message);
		blitzLastError.set(message);

		await supabase
			.from('blitz_settings')
			.update({ last_error: message })
			.eq('id', 1);
	} finally {
		blitzSyncing.set(false);
	}
}

// ===== PERSONEN IN RÄUME SCHREIBEN =====
// Aktualisiert rooms.person basierend auf Blitz-Daten
export async function applyBlitzPersonsToRooms(): Promise<void> {
	const mappedPersons = get(blitzRoomPersons);
	const currentRooms = get(rooms);

	for (const [roomId, personNames] of mappedPersons) {
		const room = currentRooms.find(r => r.id === roomId);
		if (!room) continue;

		const newPersonValue = personNames.join(', ');

		// Nur updaten wenn sich was geändert hat
		if (room.person !== newPersonValue) {
			await supabase
				.from('rooms')
				.update({ person: newPersonValue })
				.eq('id', roomId);
		}
	}

	// Läufer vom Blitz übernehmen (wenn vorhanden)
	await applyBlitzRunner();
}

// ===== LÄUFER VOM BLITZ ÜBERNEHMEN =====
async function applyBlitzRunner(): Promise<void> {
	const data = get(blitzData);
	if (!data?.laufer) return;

	const currentSettings = get(appSettings);
	if (!currentSettings) return;

	// Nur updaten wenn sich der Läufer geändert hat
	if (currentSettings.runner_name !== data.laufer) {
		const { error } = await supabase
			.from('app_settings')
			.update({ runner_name: data.laufer })
			.eq('id', 1);

		if (!error) {
			appSettings.update(s => s ? { ...s, runner_name: data.laufer! } : s);
			console.log(`[Blitz] Läufer aktualisiert: ${data.laufer}`);
		}
	}
}

// ===== POLLING SERVICE =====
let pollingInterval: ReturnType<typeof setInterval> | null = null;

export function startBlitzPolling(): void {
	stopBlitzPolling();

	const settings = get(blitzSettings);
	if (!settings?.enabled) return;

	const intervalMs = (settings.polling_interval_seconds || 30) * 1000;

	// Sofort einmal holen
	fetchBlitzData().then(() => applyBlitzPersonsToRooms());

	// Dann im Intervall
	pollingInterval = setInterval(async () => {
		await fetchBlitzData();
		await applyBlitzPersonsToRooms();
	}, intervalMs);

	console.log(`[Blitz] Polling gestartet (alle ${settings.polling_interval_seconds}s)`);
}

export function stopBlitzPolling(): void {
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
		console.log('[Blitz] Polling gestoppt');
	}
}

// ===== MAPPING VERWALTUNG =====

// Setzt die Dashboard-Räume für einen Blitz-Raum (ersetzt alle bisherigen)
export async function saveRoomMappings(blitzRoomId: string, blitzLabel: string, dashboardRoomIds: string[]): Promise<void> {
	// Alte Zuordnungen für diesen Blitz-Raum löschen
	const { error: deleteError } = await supabase
		.from('blitz_room_mapping')
		.delete()
		.eq('blitz_room_id', blitzRoomId);

	if (deleteError) {
		console.error('[Blitz] Alte Mappings löschen fehlgeschlagen:', deleteError.message);
		throw deleteError;
	}

	// Neue Zuordnungen einfügen
	if (dashboardRoomIds.length > 0) {
		const rows = dashboardRoomIds.map(roomId => ({
			blitz_room_id: blitzRoomId,
			blitz_label: blitzLabel,
			room_id: roomId
		}));

		const { error: insertError } = await supabase
			.from('blitz_room_mapping')
			.insert(rows);

		if (insertError) {
			console.error('[Blitz] Neue Mappings speichern fehlgeschlagen:', insertError.message);
			throw insertError;
		}
	}

	await loadBlitzMappings();
}

export async function savePersonMapping(blitzSlug: string, blitzName: string, dashboardPersonId: string | null): Promise<void> {
	const { error } = await supabase
		.from('blitz_person_mapping')
		.upsert({
			blitz_slug: blitzSlug,
			blitz_name: blitzName,
			person_id: dashboardPersonId
		});

	if (error) {
		console.error('[Blitz] Personen-Mapping speichern fehlgeschlagen:', error.message);
		throw error;
	}

	await loadBlitzMappings();
}

export async function updateBlitzSettings(updates: Partial<BlitzSettings>): Promise<void> {
	const { error } = await supabase
		.from('blitz_settings')
		.update(updates)
		.eq('id', 1);

	if (error) {
		console.error('[Blitz] Settings speichern fehlgeschlagen:', error.message);
		throw error;
	}

	await loadBlitzSettings();

	// Polling neu starten wenn sich enabled/interval geändert hat
	if ('enabled' in updates || 'polling_interval_seconds' in updates) {
		const settings = get(blitzSettings);
		if (settings?.enabled) {
			startBlitzPolling();
		} else {
			stopBlitzPolling();
		}
	}
}

// ===== BLITZ-RÄUME UND -PERSONEN VOM API LADEN (für Admin-UI) =====

export async function fetchBlitzRaeume(): Promise<{ id: string; label: string }[]> {
	try {
		const response = await fetch('/api/blitz-data?type=raeume');
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		return data.raeume || [];
	} catch (err) {
		console.error('[Blitz] Räume laden fehlgeschlagen:', err);
		return [];
	}
}

export async function fetchBlitzPersonen(): Promise<{ name: string; slug: string }[]> {
	try {
		const response = await fetch('/api/blitz-data?type=personen');
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		return data.personen || [];
	} catch (err) {
		console.error('[Blitz] Personen laden fehlgeschlagen:', err);
		return [];
	}
}

// ===== INITIALISIERUNG =====
export async function initBlitzIntegration(): Promise<void> {
	await loadBlitzSettings();
	await loadBlitzMappings();

	const settings = get(blitzSettings);
	if (settings?.enabled) {
		startBlitzPolling();
	}
}
