import { writable, derived, get } from 'svelte/store';
import type { Room, RoomStatus, DailyConfig, AppSettings, RoomWithConfig } from '$lib/types';
import { supabase } from '$lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ===== ADMIN MODE =====
export const isEditMode = writable(false);

// ===== NEUER STORE FÜR SWAP =====
export const swapSelection = writable<string[]>([]); // Speichert die IDs der 2 ausgewählten Räume

// ===== CURRENT DATE/TIME =====
export const currentWeekday = writable(new Date().getDay() || 7); // 0 (Sonntag) -> 7
export const currentTime = writable(new Date());

// Update Zeit jede Sekunde
if (typeof window !== 'undefined') {
	setInterval(() => {
		currentTime.set(new Date());
	}, 1000);
}

// ===== DATA STORES =====
export const rooms = writable<Room[]>([]);
export const roomStatuses = writable<Map<string, RoomStatus>>(new Map());
export const dailyConfigs = writable<Map<string, DailyConfig>>(new Map());
export const appSettings = writable<AppSettings | null>(null);

// ===== DERIVED STORES =====
export const visibleRooms = derived(
	// $time und $settings entfernt, da Logik verlagert wurde
	[rooms, roomStatuses, dailyConfigs, currentWeekday],
	([$rooms, $statuses, $configs, $weekday]) => {
		return $rooms.map((room) => {
			const status = $statuses.get(room.id);
			const configKey = `${room.id}-${$weekday}`;
			const config = $configs.get(configKey);

			// KORREKTUR: 'isOpen' kommt jetzt DIREKT aus dem Status-Store.
			// Die Berechnung passiert im neuen Automatik-Service.
			const isOpen = status?.is_open ?? false;

			const result: RoomWithConfig = {
				...room,
				config: config || null,
				status: status || null,
				isOpen
			};

			return result;
		});
	}
);

// ===== REALTIME SUBSCRIPTIONS =====
let roomStatusChannel: RealtimeChannel | null = null;
let roomsChannel: RealtimeChannel | null = null;
let configsChannel: RealtimeChannel | null = null;
let settingsChannel: RealtimeChannel | null = null;

export function subscribeToRealtimeUpdates() {
	console.log('🔌 Subscribing to realtime updates...');

	// Room Status Updates
	roomStatusChannel = supabase
		.channel('room-status-changes')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'room_status' },
			(payload) => {
				console.log('📊 Room status change:', payload);
				if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
					roomStatuses.update((map) => {
						const newMap = new Map(map); // Immer Kopie erstellen
						newMap.set(payload.new.room_id, payload.new as RoomStatus);
						return newMap;
					});
				} else if (payload.eventType === 'DELETE') {
					roomStatuses.update((map) => {
						const newMap = new Map(map); // Immer Kopie erstellen
						newMap.delete(payload.old.room_id);
						return newMap;
					});
				}
			}
		)
		.subscribe((status) => {
			console.log('Room status channel:', status);
		});

	// Rooms Updates (Position, Größe, etc.)
	roomsChannel = supabase
		.channel('rooms-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
			console.log('🏠 Room change:', payload);
			if (payload.eventType === 'INSERT') {
				rooms.update((list) => [...list, payload.new as Room]);
			} else if (payload.eventType === 'UPDATE') {
				rooms.update((list) =>
					list.map((r) => (r.id === payload.new.id ? (payload.new as Room) : r))
				);
			} else if (payload.eventType === 'DELETE') {
				rooms.update((list) => list.filter((r) => r.id !== payload.old.id));
			}
		})
		.subscribe((status) => {
			console.log('Rooms channel:', status);
		});

	// Daily Configs Updates
	configsChannel = supabase
		.channel('configs-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'daily_configs' }, (payload) => {
			console.log('📅 Config change:', payload);
			if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
				const config = payload.new as DailyConfig;
				const key = `${config.room_id}-${config.weekday}`;
				dailyConfigs.update((map) => {
					const newMap = new Map(map); // Immer Kopie erstellen
					newMap.set(key, config);
					return newMap;
				});
			} else if (payload.eventType === 'DELETE') {
				const config = payload.old as DailyConfig;
				const key = `${config.room_id}-${config.weekday}`;
				dailyConfigs.update((map) => {
					const newMap = new Map(map); // Immer Kopie erstellen
					newMap.delete(key);
					return newMap;
				});
			}
		})
		.subscribe((status) => {
			console.log('Configs channel:', status);
		});

	// App Settings Updates
	settingsChannel = supabase
		.channel('settings-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
			console.log('⚙️ Settings change:', payload);
			if (payload.eventType === 'UPDATE') {
				appSettings.set(payload.new as AppSettings);
			}
		})
		.subscribe((status) => {
			console.log('Settings channel:', status);
		});
}

export function unsubscribeFromRealtimeUpdates() {
	roomStatusChannel?.unsubscribe();
	roomsChannel?.unsubscribe();
	configsChannel?.unsubscribe();
	settingsChannel?.unsubscribe();
}

// ===== DATA LOADING =====
export async function loadAllData() {
	// Load Rooms
	const { data: roomsData } = await supabase.from('rooms').select('*').order('created_at');
	if (roomsData) rooms.set(roomsData);

	// Load Room Statuses
	const { data: statusesData } = await supabase.from('room_status').select('*');
	if (statusesData) {
		const statusMap = new Map();
		statusesData.forEach((s) => statusMap.set(s.room_id, s));
		roomStatuses.set(statusMap);
	}

	// Load Daily Configs
	const { data: configsData } = await supabase.from('daily_configs').select('*');
	if (configsData) {
		const configMap = new Map();
		configsData.forEach((c) => configMap.set(`${c.room_id}-${c.weekday}`, c));
		dailyConfigs.set(configMap);
	}

	// Load App Settings
	const { data: settingsData } = await supabase
		.from('app_settings')
		.select('*')
		.eq('id', 1)
		.single();
	if (settingsData) appSettings.set(settingsData);
}

// ===== UTILITY FUNCTIONS =====
function parseTime(timeString: string | null | undefined): number | null {
	if (!timeString) return null;
	const [hours, minutes] = timeString.split(':').map(Number);
	if (isNaN(hours) || isNaN(minutes)) return null;
	return hours * 60 + minutes;
}

// ===== ROOM ACTIONS =====
export async function toggleRoomStatus(roomId: string) {
	const currentStatus = get(roomStatuses).get(roomId);
	const newStatus = !(currentStatus?.is_open ?? false);

	// 1. Optimistisches Update (sofort UI aktualisieren)
	roomStatuses.update((map) => {
		const newMap = new Map(map); // Kopie erstellen
		const existing = newMap.get(roomId) || { room_id: roomId, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
		newMap.set(roomId, { ...existing, is_open: newStatus, manual_override: true, last_updated: new Date().toISOString() });
		return newMap;
	});

	// 2. Datenbank-Update im Hintergrund
	const { error } = await supabase
		.from('room_status')
		.upsert(
			{ room_id: roomId, is_open: newStatus, manual_override: true },
			{ onConflict: 'room_id' }
		);

	// 3. Rollback bei Fehler
	if (error) {
		console.error('Error toggling room status:', error);
		// Setze den Status auf den *alten* Wert zurück
		roomStatuses.update((map) => {
			const newMap = new Map(map); // Kopie erstellen
			if (currentStatus) {
				newMap.set(roomId, currentStatus);
			} else {
				// Fallback, falls es vorher keinen Status gab
				const fallbackStatus = { room_id: roomId, is_open: !newStatus, manual_override: false, last_updated: new Date().toISOString() };
				newMap.set(roomId, fallbackStatus);
			}
			return newMap;
		});
	}
}

export async function updateRoomPosition(roomId: string, x: number, y: number) {
	const roundedX = Math.round(x);
	const roundedY = Math.round(y);

	// Optimistisches Update (UI sofort aktualisieren)
	rooms.update((list) =>
		list.map((r) =>
			r.id === roomId ? { ...r, position_x: roundedX, position_y: roundedY } : r
		)
	);

	// Update in der Datenbank
	const { error } = await supabase
		.from('rooms')
		.update({ position_x: roundedX, position_y: roundedY })
		.eq('id', roomId);

	if (error) {
		console.error('Error updating position:', error);
	}
}

export function swapRoomPositions(room1: RoomWithConfig, room2: RoomWithConfig) {
	const pos1 = room1.position_x;
	const pos2 = room2.position_x;

	// SICHERHEITSPRÜFUNG: Verhindert Tausch, wenn Positionen identisch sind
	if (pos1 === pos2) {
		console.error(
			`[SWAP FEHLER]: Tausch von "${room1.name}" und "${room2.name}" abgebrochen. Beide haben dieselbe position_x: ${pos1}. Bitte Daten in Supabase korrigieren.`
		);
		return; // Abbruch
	}

	// 1. Optimistisches Update (atomar)
	rooms.update((list) =>
		list.map((r) => {
			if (r.id === room1.id) {
				return { ...r, position_x: pos2 };
			}
			if (r.id === room2.id) {
				return { ...r, position_x: pos1 };
			}
			return r;
		})
	);

	// 2. Datenbank-Updates (fire-and-forget)
	supabase
		.from('rooms')
		.update({ position_x: pos2 })
		.eq('id', room1.id)
		.then(({ error }) => {
			if (error) console.error('Error swapping pos 1:', error.message);
		});

	supabase
		.from('rooms')
		.update({ position_x: pos1 })
		.eq('id', room2.id)
		.then(({ error }) => {
			if (error) console.error('Error swapping pos 2:', error.message);
		});
}

export async function updateRoomSize(roomId: string, width: number, height: number) {
	await supabase.from('rooms').update({ width, height }).eq('id', roomId);
}

export async function bulkOpenAllRooms() {
	const allRooms = get(rooms);
	const updates = allRooms.map((room) => ({
		room_id: room.id,
		is_open: true,
		manual_override: true
	}));

	// Optimistisches Update
	roomStatuses.update((map) => {
		const newMap = new Map(map); // Kopie erstellen
		allRooms.forEach((room) => {
			const existing = newMap.get(room.id) || { room_id: room.id, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
			newMap.set(room.id, { ...existing, is_open: true, manual_override: true });
		});
		return newMap;
	});

	// DB-Update
	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

	// Rollback (vereinfacht: lade alle Daten neu bei Fehler)
	if (error) {
		console.error("Fehler bei Bulk Open: ", error);
		loadAllData();
	}
}

export async function bulkCloseAllRooms() {
	const allRooms = get(rooms);
	const updates = allRooms.map((room) => ({
		room_id: room.id,
		is_open: false,
		manual_override: true
	}));

	// Optimistisches Update
	roomStatuses.update((map) => {
		const newMap = new Map(map); // Kopie erstellen
		allRooms.forEach((room) => {
			const existing = newMap.get(room.id) || { room_id: room.id, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
			newMap.set(room.id, { ...existing, is_open: false, manual_override: true });
		});
		return newMap;
	});

	// DB-Update
	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

	// Rollback (vereinfacht: lade alle Daten neu bei Fehler)
	if (error) {
		console.error("Fehler bei Bulk Close: ", error);
		loadAllData();
	}
}

export async function deleteRoom(roomId: string) {
	// Optimistisches Update
	rooms.update(list => list.filter(r => r.id !== roomId));
	roomStatuses.update(map => {
		const newMap = new Map(map); // Kopie erstellen
		newMap.delete(roomId);
		return newMap;
	});
	dailyConfigs.update(map => { // AUCH Configs löschen
		const newMap = new Map(map);
		for (let i = 0; i <= 6; i++) {
			newMap.delete(`${roomId}-${i}`);
		}
		return newMap;
	});

	// DB-Update (CASCADE sollte Status und Configs löschen)
	await supabase.from('rooms').delete().eq('id', roomId);
}

export async function createNewRoom(name: string, floor: string = 'eg') {
	// Berechne die nächste position_x für das Stockwerk
	const existingRooms = get(rooms).filter(r => r.floor === floor);
	const maxPosition = existingRooms.length > 0
		? Math.max(0, ...existingRooms.map(r => r.position_x || 0)) // Stelle sicher, dass nur Zahlen verglichen werden
		: -100; // Startwert, damit der erste Raum bei 0 oder 100 landet

	const { data } = await supabase
		.from('rooms')
		.insert({
			name,
			floor,
			position_x: maxPosition + 100, // Stellt sicher, dass neue Räume eine höhere pos_x haben
			position_y: 100,
			background_color: '#4CAF50',
			width: 300,
			height: 250,
			theme: 'space',
			image_url: null
		})
		.select()
		.single();

	if (data) {
		// Status initialisieren
		await supabase.from('room_status').insert({
			room_id: data.id,
			is_open: false,
			manual_override: false // Explizit setzen
		});
	}
}


// ========== NEUER AUTOMATIK-SERVICE (START - Version 5 - Vereinfacht) ==========
// Prüft alle 10 Sekunden, ob Raum-Status aktualisiert werden müssen

if (typeof window !== 'undefined') {
	// Prüf-Intervall (z.B. alle 10 Sekunden)
	const AUTOMATION_INTERVAL_MS = 10000;

	const runAutomation = () => {
		// Holt die aktuellen Werte aus den Stores
		const $rooms = get(rooms);
		const $statuses = get(roomStatuses);
		const $configs = get(dailyConfigs);
		const $settings = get(appSettings);
		const $weekday = get(currentWeekday);
		const $time = get(currentTime);

		if (!$settings || $rooms.length === 0) return; // Warten, bis alles geladen ist

		// 1. Ist Nachtruhe aktiv?
		let isNightModeActive = false;
		const now = $time.getHours() * 60 + $time.getMinutes();
		const nightStart = parseTime($settings.night_start); // parseTime ist oben in appState definiert
		const nightEnd = parseTime($settings.night_end);

		if ($settings.night_mode_enabled && nightStart !== null && nightEnd !== null) {
			if (nightStart !== nightEnd) {
				if (nightStart > nightEnd) { // z.B. 22:00 - 06:00
					if (now >= nightStart || now < nightEnd) isNightModeActive = true;
				} else { // z.B. 09:00 - 17:00
					if (now >= nightStart && now < nightEnd) isNightModeActive = true;
				}
			}
		}

		type StatusUpdate = { room_id: string; is_open: boolean; manual_override: boolean };
		const updates: StatusUpdate[] = [];

		for (const room of $rooms) {
			const status = $statuses.get(room.id);
			const currentIsOpen = status?.is_open ?? false;
			const isManual = status?.manual_override ?? false;

			const configKey = `${room.id}-${$weekday}`;
			const config = $configs.get(configKey);

			let needsUpdate = false;
			let newIsOpen = currentIsOpen;
			let newManualOverride = isManual;

			// 1. Nachtruhe-Prüfung (Priorität 1)
			if (isNightModeActive) {
				// Nachtruhe ist aktiv.
				// Sie schließt *alles*, was automatisch offen ist.
				if (currentIsOpen && !isManual) { 
					// Raum ist automatisch offen -> Schließen
					needsUpdate = true;
					newIsOpen = false;
					newManualOverride = false; 
				}
				// Wenn manuell offen -> bleibt offen (gewollt).
				// Wenn manuell/automatisch zu -> bleibt zu.
			
			} else {
				// 2. Keine Nachtruhe - Prüfe, ob ein Raum geöffnet werden soll
				
				if (!currentIsOpen && !isManual) {
					// Raum ist aktuell AUTOMATISCH GESCHLOSSEN
					const openTime = parseTime(config?.open_time);

					if (openTime !== null && now >= openTime) {
						// Es gibt eine Öffnungszeit, die Zeit ist erreicht.
						// -> AUTOMATISCH ÖFFNEN
						needsUpdate = true;
						newIsOpen = true;
						newManualOverride = false;
					}
				}
				
				// WENN RAUM MANUELL GESCHLOSSEN IST (!currentIsOpen && isManual):
				// -> Nichts tun. Manuell bleibt manuell.
				
				// WENN RAUM OFFEN IST (currentIsOpen):
				// -> Nichts tun. Er bleibt offen, bis die Nachtruhe kommt oder er manuell geschlossen wird.
			}

			// 3. Update-Objekt erstellen, wenn sich was geändert hat
			if (needsUpdate) {
				const existingDbStatus = { is_open: currentIsOpen, manual_override: isManual };
				const newDbStatus = { is_open: newIsOpen, manual_override: newManualOverride };
				if (existingDbStatus.is_open !== newDbStatus.is_open || existingDbStatus.manual_override !== newDbStatus.manual_override) {
					updates.push({
						room_id: room.id,
						is_open: newIsOpen,
						manual_override: newManualOverride
					});
				}
			}

		} // Ende der Raum-Schleife

		// 4. Führe Updates in Supabase aus (wenn es welche gibt)
		if (updates.length > 0) {
			console.log(`[AutoService V5] Aktualisiere ${updates.length} Räume...`, updates.map(u=>`${u.room_id.substring(0,4)}->${u.is_open?'O':'C'}(M:${u.manual_override})`));
			supabase
				.from('room_status')
				.upsert(updates, { onConflict: 'room_id' })
				.then(({ error }) => {
					if (error) {
						console.error("[AutoService V5] Fehler bei DB-Update:", error);
					} else {
						// Optimistisches Update im Store (lokal)
						roomStatuses.update(map => {
							const newMap = new Map(map); // Kopie erstellen
							for (const update of updates) {
								const existing = newMap.get(update.room_id) || { room_id: update.room_id, is_open: !update.is_open, manual_override: !update.manual_override, last_updated: new Date(0).toISOString() };
								newMap.set(update.room_id, {
									...existing,
									is_open: update.is_open,
									manual_override: update.manual_override,
									last_updated: new Date().toISOString()
								});
							}
							return newMap; // Aktualisierte Kopie zurückgeben
						});
					}
				});
		}
	}; // Ende runAutomation

	// Starte den Service nach kurzem Delay (damit Daten geladen sind)
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const startAutomation = () => {
		// Stoppe evtl. laufenden Timer (wichtig für HMR)
		if (intervalId) clearInterval(intervalId);
		if ((window as any).clearAutomationInterval) (window as any).clearAutomationInterval();

		runAutomation(); // Einmal sofort ausführen
		intervalId = setInterval(runAutomation, AUTOMATION_INTERVAL_MS);
		console.log('[AutoService V5] Gestartet.');

		// Funktion zum Stoppen global verfügbar machen
		(window as any).clearAutomationInterval = () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null; // Wichtig: ID zurücksetzen
				console.log('[AutoService V5] Gestoppt.');
			}
		};
	};

	setTimeout(startAutomation, 3000); // 3 Sek. Puffer

} // Ende if (typeof window !== 'undefined')

// ========== NEUER AUTOMATIK-SERVICE (ENDE - Version 5 - Vereinfacht) ==========