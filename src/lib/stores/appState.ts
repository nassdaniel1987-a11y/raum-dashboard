import { writable, derived, get } from 'svelte/store';
import type { Room, RoomStatus, DailyConfig, AppSettings, RoomWithConfig, DailyHighlight } from '$lib/types';
import { supabase } from '$lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { applyTheme } from '$lib/themes';
import { parseTime } from '$lib/utils/time';

// ===== ADMIN MODE =====
export const isEditMode = writable(false);

// ===== SWAP SELECTION =====
export const swapSelection = writable<string[]>([]);

// ===== CURRENT DATE/TIME =====
export const currentWeekday = writable(new Date().getDay() || 7);
export const currentTime = writable(new Date());

// ===== VIEW WEEKDAY (User-gesteuert) =====
// Der Tag, den der User gerade anschaut (standardmäßig der echte aktuelle Tag)
export const viewWeekday = writable(new Date().getDay() || 7);

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
export const dailyHighlights = writable<DailyHighlight[]>([]);

// ===== RUNNER (Ansprechpartner im Haus) =====
export const runnerName = derived(appSettings, ($settings) => $settings?.runner_name || '');

// ===== THEME HANDLING (BENUTZERSPEZIFISCH) =====
export const userTheme = writable<string>('default');

// ===== CARD THEME HANDLING (NEU) =====
export const cardTheme = writable<string>('default');

// Theme aus LocalStorage laden beim Start
if (typeof window !== 'undefined') {
	const savedTheme = localStorage.getItem('user-theme');
	if (savedTheme) {
		userTheme.set(savedTheme);
	}

	const savedCardTheme = localStorage.getItem('card-theme');
	if (savedCardTheme) {
		cardTheme.set(savedCardTheme);
	}

	// Wenn sich das User-Theme ändert, speichern und anwenden
	userTheme.subscribe(($theme) => {
		localStorage.setItem('user-theme', $theme);
		applyTheme($theme);
	});

	// Wenn sich das Card-Theme ändert, speichern
	cardTheme.subscribe(($theme) => {
		localStorage.setItem('card-theme', $theme);
	});
}

// ===== DERIVED STORES =====
export const visibleRooms = derived(
	[rooms, roomStatuses, dailyConfigs, viewWeekday],
	([$rooms, $statuses, $configs, $weekday]) => {
		return $rooms
			.map((room) => {
				const status = $statuses.get(room.id);
				const configKey = `${room.id}-${$weekday}`;
				const config = $configs.get(configKey);

				const isOpen = status?.is_open ?? false;

				const result: RoomWithConfig = {
					...room,
					config: config || null,
					status: status || null,
					isOpen
				};

				return result;
			})
			.filter((room) => room.config !== null); // ✅ Nur Räume mit Config für diesen Tag anzeigen
	}
);

// ✅ NEU: Nur Highlights für den aktuell angezeigten Tag
export const visibleHighlights = derived(
	[dailyHighlights, viewWeekday],
	([$highlights, $weekday]) => {
		return $highlights
			.filter((h) => h.weekday === $weekday)
			.sort((a, b) => a.sort_order - b.sort_order);
	}
);

// ===== REALTIME SUBSCRIPTIONS =====
let roomStatusChannel: RealtimeChannel | null = null;
let roomsChannel: RealtimeChannel | null = null;
let configsChannel: RealtimeChannel | null = null;
let settingsChannel: RealtimeChannel | null = null;
let highlightsChannel: RealtimeChannel | null = null;

export function subscribeToRealtimeUpdates() {
	console.log('🔌 Subscribing to realtime updates...');

	roomStatusChannel = supabase
		.channel('room-status-changes')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'room_status' },
			(payload) => {
				console.log('📊 Room status change:', payload);
				if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
					roomStatuses.update((map) => {
						const newMap = new Map(map);
						newMap.set(payload.new.room_id, payload.new as RoomStatus);
						return newMap;
					});
				} else if (payload.eventType === 'DELETE') {
					roomStatuses.update((map) => {
						const newMap = new Map(map);
						newMap.delete(payload.old.room_id);
						return newMap;
					});
				}
			}
		)
		.subscribe((status) => {
			console.log('Room status channel:', status);
		});

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

	configsChannel = supabase
		.channel('configs-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'daily_configs' }, (payload) => {
			console.log('📅 Config change:', payload);
			if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
				const config = payload.new as DailyConfig;
				const key = `${config.room_id}-${config.weekday}`;
				dailyConfigs.update((map) => {
					const newMap = new Map(map);
					newMap.set(key, config);
					return newMap;
				});
			} else if (payload.eventType === 'DELETE') {
				const config = payload.old as DailyConfig;
				const key = `${config.room_id}-${config.weekday}`;
				dailyConfigs.update((map) => {
					const newMap = new Map(map);
					newMap.delete(key);
					return newMap;
				});
			}
		})
		.subscribe((status) => {
			console.log('Configs channel:', status);
		});

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

	highlightsChannel = supabase
		.channel('highlights-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'daily_highlights' }, (payload) => {
			console.log('🎯 Highlight change:', payload);
			if (payload.eventType === 'INSERT') {
				dailyHighlights.update((list) => [...list, payload.new as DailyHighlight]);
			} else if (payload.eventType === 'UPDATE') {
				dailyHighlights.update((list) =>
					list.map((h) => (h.id === payload.new.id ? (payload.new as DailyHighlight) : h))
				);
			} else if (payload.eventType === 'DELETE') {
				dailyHighlights.update((list) => list.filter((h) => h.id !== payload.old.id));
			}
		})
		.subscribe((status) => {
			console.log('Highlights channel:', status);
		});
}

export function unsubscribeFromRealtimeUpdates() {
	roomStatusChannel?.unsubscribe();
	roomsChannel?.unsubscribe();
	configsChannel?.unsubscribe();
	settingsChannel?.unsubscribe();
	highlightsChannel?.unsubscribe();
}

// ===== DATA LOADING =====
export async function loadAllData() {
	const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*').order('created_at');
	if (roomsError) console.error('[loadAllData] Fehler beim Laden der Räume:', roomsError);
	if (roomsData) rooms.set(roomsData);

	const { data: statusesData, error: statusesError } = await supabase.from('room_status').select('*');
	if (statusesError) console.error('[loadAllData] Fehler beim Laden der Status:', statusesError);
	if (statusesData) {
		const statusMap = new Map();
		statusesData.forEach((s) => statusMap.set(s.room_id, s));
		roomStatuses.set(statusMap);
	}

	const { data: configsData, error: configsError } = await supabase.from('daily_configs').select('*');
	if (configsError) console.error('[loadAllData] Fehler beim Laden der Configs:', configsError);
	if (configsData) {
		const configMap = new Map();
		configsData.forEach((c) => configMap.set(`${c.room_id}-${c.weekday}`, c));
		dailyConfigs.set(configMap);
	}

	const { data: settingsData, error: settingsError } = await supabase
		.from('app_settings')
		.select('*')
		.eq('id', 1)
		.single();
	if (settingsError) console.error('[loadAllData] Fehler beim Laden der Settings:', settingsError);
	if (settingsData) {
		appSettings.set(settingsData);
	}

	const { data: highlightsData, error: highlightsError } = await supabase
		.from('daily_highlights')
		.select('*')
		.order('weekday')
		.order('sort_order');
	if (highlightsError) console.error('[loadAllData] Fehler beim Laden der Highlights:', highlightsError);
	if (highlightsData) {
		dailyHighlights.set(highlightsData);
	}
}

// ===== UTILITY FUNCTIONS =====

// ✅ KORRIGIERT: Hilfsfunktion für sicheres Erstellen von RoomStatus
function createRoomStatus(roomId: string, isOpen: boolean, manualOverride: boolean): RoomStatus {
	return {
		room_id: roomId,
		is_open: isOpen,
		manual_override: manualOverride,
		last_updated: new Date().toISOString() // ✅ FIX: Jetzt immer dabei
	};
}

// ===== ROOM ACTIONS =====
export async function toggleRoomStatus(roomId: string) {
	const currentStatus = get(roomStatuses).get(roomId);
	const newStatus = !(currentStatus?.is_open ?? false);

	// ✅ KORRIGIERT: Verwende Helper-Funktion
	roomStatuses.update((map) => {
		const newMap = new Map(map);
		newMap.set(roomId, createRoomStatus(roomId, newStatus, true));
		return newMap;
	});

	const { error } = await supabase
		.from('room_status')
		.upsert(
			{ room_id: roomId, is_open: newStatus, manual_override: true },
			{ onConflict: 'room_id' }
		);

	if (error) {
		console.error('Error toggling room status:', error);
		// ✅ KORRIGIERT: Fallback mit last_updated
		roomStatuses.update((map) => {
			const newMap = new Map(map);
			if (currentStatus) {
				newMap.set(roomId, currentStatus);
			} else {
				newMap.set(roomId, createRoomStatus(roomId, !newStatus, false));
			}
			return newMap;
		});
	}
}

export async function updateRoomPosition(roomId: string, x: number, y: number) {
	const roundedX = Math.round(x);
	const roundedY = Math.round(y);

	rooms.update((list) =>
		list.map((r) =>
			r.id === roomId ? { ...r, position_x: roundedX, position_y: roundedY } : r
		)
	);

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

	if (pos1 === pos2) {
		console.error(
			`[SWAP FEHLER]: Tausch von "${room1.name}" und "${room2.name}" abgebrochen. Beide haben dieselbe position_x: ${pos1}. Bitte Daten in Supabase korrigieren.`
		);
		return;
	}

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

// ✅ KORRIGIERT: Bulk-Operationen mit last_updated
export async function bulkOpenAllRooms() {
	const allRooms = get(rooms);
	const updates = allRooms.map((room) => ({
		room_id: room.id,
		is_open: true,
		manual_override: true
	}));

	roomStatuses.update((map) => {
		const newMap = new Map(map);
		allRooms.forEach((room) => {
			newMap.set(room.id, createRoomStatus(room.id, true, true));
		});
		return newMap;
	});

	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

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

	roomStatuses.update((map) => {
		const newMap = new Map(map);
		allRooms.forEach((room) => {
			newMap.set(room.id, createRoomStatus(room.id, false, true));
		});
		return newMap;
	});

	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

	if (error) {
		console.error("Fehler bei Bulk Close: ", error);
		loadAllData();
	}
}

export async function deleteRoom(roomId: string) {
	rooms.update(list => list.filter(r => r.id !== roomId));
	roomStatuses.update(map => {
		const newMap = new Map(map);
		newMap.delete(roomId);
		return newMap;
	});
	dailyConfigs.update(map => {
		const newMap = new Map(map);
		for (let i = 0; i <= 6; i++) {
			newMap.delete(`${roomId}-${i}`);
		}
		return newMap;
	});

	await supabase.from('rooms').delete().eq('id', roomId);
}

export async function createNewRoom(name: string, floor: string = 'eg') {
	const existingRooms = get(rooms).filter(r => r.floor === floor);
	const maxPosition = existingRooms.length > 0
		? Math.max(0, ...existingRooms.map(r => r.position_x || 0))
		: -100;

	const { data: roomData } = await supabase
		.from('rooms')
		.insert({
			name,
			floor,
			position_x: maxPosition + 100,
			position_y: 100,
			background_color: '#4CAF50',
			width: 300,
			height: 250,
			theme: 'space',
			image_url: null,
			person: null
		})
		.select()
		.single();

	if (roomData) {
		// ✅ Sofort lokalen Store aktualisieren (nicht auf Realtime warten)
		rooms.update((list) => [...list, roomData as Room]);

		// Room Status erstellen
		const { data: statusData } = await supabase.from('room_status').insert({
			room_id: roomData.id,
			is_open: false,
			manual_override: false
		}).select().single();

		if (statusData) {
			// ✅ Sofort lokalen Store aktualisieren
			roomStatuses.update((map) => {
				const newMap = new Map(map);
				newMap.set(roomData.id, statusData);
				return newMap;
			});
		}

		// Daily Config nur für den aktuell angezeigten Tag erstellen
		const currentViewDay = get(viewWeekday);
		const { data: configData } = await supabase.from('daily_configs').insert({
			room_id: roomData.id,
			weekday: currentViewDay,
			activity: null,
			open_time: null,
			close_time: null,
			title_font_size: 42,
			text_font_size: 28,
			text_color: '#FFFFFF'
		}).select().single();

		if (configData) {
			// ✅ Sofort lokalen Store aktualisieren
			dailyConfigs.update((map) => {
				const newMap = new Map(map);
				newMap.set(`${roomData.id}-${currentViewDay}`, configData);
				return newMap;
			});
		}
	}
}

// ========== TAG-VERWALTUNG ==========
export async function copyDayConfigs(sourceDay: number, targetDay: number) {
	const $dailyConfigs = get(dailyConfigs);
	const $rooms = get(rooms);

	const updates = [];

	for (const room of $rooms) {
		const sourceKey = `${room.id}-${sourceDay}`;
		const sourceConfig = $dailyConfigs.get(sourceKey);

		if (sourceConfig) {
			updates.push({
				room_id: room.id,
				weekday: targetDay,
				activity: sourceConfig.activity || null,
				open_time: sourceConfig.open_time || null,
				close_time: sourceConfig.close_time || null,
				title_font_size: sourceConfig.title_font_size || 42,
				text_font_size: sourceConfig.text_font_size || 28,
				text_color: sourceConfig.text_color || '#FFFFFF'
			});
		}
	}

	if (updates.length > 0) {
		const { error } = await supabase
			.from('daily_configs')
			.upsert(updates, { onConflict: 'room_id,weekday' });

		if (error) {
			console.error('Error copying day configs:', error);
			throw error;
		}

		return updates.length;
	}

	return 0;
}

export async function deleteDayConfigs(day: number) {
	const $rooms = get(rooms);

	// ✅ FIX: Wirklich DELETE aus der DB, nicht nur NULL setzen
	const { error } = await supabase
		.from('daily_configs')
		.delete()
		.eq('weekday', day);

	if (error) {
		console.error('Error deleting day configs:', error);
		throw error;
	}

	// Lokale State aktualisieren
	dailyConfigs.update(map => {
		const newMap = new Map(map);
		for (const room of $rooms) {
			newMap.delete(`${room.id}-${day}`);
		}
		return newMap;
	});

	return $rooms.length;
}

// ✅ NEU: Löscht nur die Config eines einzelnen Raums für einen bestimmten Tag
export async function deleteRoomConfigForDay(roomId: string, day: number) {
	const { error } = await supabase
		.from('daily_configs')
		.delete()
		.eq('room_id', roomId)
		.eq('weekday', day);

	if (error) {
		console.error('Error deleting room config:', error);
		throw error;
	}

	// Lokale State aktualisieren
	dailyConfigs.update(map => {
		const newMap = new Map(map);
		newMap.delete(`${roomId}-${day}`);
		return newMap;
	});
}

// ========== SCHRIFTGRÖSSEN VERWALTUNG ==========

export async function bulkUpdateFontSizes(weekday: number, titleFontSize: number, textFontSize: number) {
	const $configs = get(dailyConfigs);

	// Alle Config-Keys für diesen Wochentag sammeln
	const keysToUpdate: string[] = [];
	const roomIds: string[] = [];
	for (const [key, config] of $configs) {
		if (config.weekday === weekday) {
			keysToUpdate.push(key);
			roomIds.push(config.room_id);
		}
	}

	if (roomIds.length === 0) return;

	// Lokalen State sofort aktualisieren (optimistic update)
	dailyConfigs.update(map => {
		const newMap = new Map(map);
		for (const key of keysToUpdate) {
			const config = newMap.get(key);
			if (config) {
				newMap.set(key, { ...config, title_font_size: titleFontSize, text_font_size: textFontSize });
			}
		}
		return newMap;
	});

	// DB-Update für alle Configs dieses Tages
	const { error } = await supabase
		.from('daily_configs')
		.update({ title_font_size: titleFontSize, text_font_size: textFontSize })
		.eq('weekday', weekday);

	if (error) {
		console.error('[bulkUpdateFontSizes] Fehler:', error);
	}
}

// ========== RUNNER (Ansprechpartner) VERWALTUNG ==========

export async function updateRunnerName(name: string) {
	const { error } = await supabase
		.from('app_settings')
		.update({ runner_name: name || null })
		.eq('id', 1);

	if (error) {
		console.error('Error updating runner name:', error);
		throw error;
	}

	// Lokalen State aktualisieren
	appSettings.update(settings => {
		if (settings) {
			return { ...settings, runner_name: name || null };
		}
		return settings;
	});
}

// ========== DAILY HIGHLIGHTS VERWALTUNG ==========

export async function createHighlight(
	weekday: number,
	icon: string,
	text: string,
	color: string,
	room: string | null = null,
	person: string | null = null
) {
	// Ermittle die höchste sort_order für diesen Tag
	const currentHighlights = get(dailyHighlights).filter(h => h.weekday === weekday);
	const maxSortOrder = currentHighlights.length > 0
		? Math.max(...currentHighlights.map(h => h.sort_order))
		: 0;

	const { data, error } = await supabase
		.from('daily_highlights')
		.insert({
			weekday,
			icon,
			text,
			color,
			room,
			person,
			sort_order: maxSortOrder + 1
		})
		.select()
		.single();

	if (error) {
		console.error('Error creating highlight:', error);
		throw error;
	}

	// ✅ Sofort lokale State aktualisieren
	if (data) {
		dailyHighlights.update(list => [...list, data as DailyHighlight]);
	}

	return data;
}

export async function updateHighlight(id: string, updates: Partial<DailyHighlight>) {
	const { error } = await supabase
		.from('daily_highlights')
		.update(updates)
		.eq('id', id);

	if (error) {
		console.error('Error updating highlight:', error);
		throw error;
	}

	// ✅ Sofort lokale State aktualisieren
	dailyHighlights.update(list =>
		list.map(h => (h.id === id ? { ...h, ...updates } : h))
	);
}

export async function deleteHighlight(id: string) {
	const { error } = await supabase
		.from('daily_highlights')
		.delete()
		.eq('id', id);

	if (error) {
		console.error('Error deleting highlight:', error);
		throw error;
	}

	// ✅ Sofort lokale State aktualisieren
	dailyHighlights.update(list => list.filter(h => h.id !== id));
}

export async function reorderHighlights(highlights: DailyHighlight[]) {
	const updates = highlights.map((h, index) => ({
		id: h.id,
		sort_order: index + 1
	}));

	await Promise.all(
		updates.map((update) =>
			supabase
				.from('daily_highlights')
				.update({ sort_order: update.sort_order })
				.eq('id', update.id)
		)
	);
}

// ========== TAGES-RESET (Zeiten zurücksetzen bei Tageswechsel) ==========
async function resetDailyTimes() {
	console.log('🔄 Tages-Reset: Lösche ALLE Zeiten für ALLE Wochentage (blanco)');

	// ALLE daily_configs: open_time und close_time auf null setzen (ALLE Wochentage)
	// So ist der Tagesplaner jeden Morgen komplett leer - keine Zeiten von gestern oder letzter Woche
	const { error } = await supabase
		.from('daily_configs')
		.update({ open_time: null, close_time: null })
		.gte('weekday', 0); // alle Wochentage (0-7) = alles

	if (error) {
		console.error('[Tages-Reset] Fehler beim Löschen der Zeiten:', error);
		return;
	}

	// Lokalen Store aktualisieren: ALLE Configs leeren
	dailyConfigs.update((map) => {
		const newMap = new Map(map);
		for (const [key, config] of newMap) {
			if (config.open_time !== null || config.close_time !== null) {
				newMap.set(key, { ...config, open_time: null, close_time: null });
			}
		}
		return newMap;
	});

	// Alle Räume schließen + manual_override zurücksetzen für den neuen Tag
	// Räume öffnen sich dann automatisch um 08:00 durch den Automatik-Service
	const { error: statusError } = await supabase
		.from('room_status')
		.update({ is_open: false, manual_override: false });

	if (!statusError) {
		roomStatuses.update((map) => {
			const newMap = new Map(map);
			for (const [id, status] of newMap) {
				newMap.set(id, { ...status, is_open: false, manual_override: false });
			}
			return newMap;
		});
	} else {
		console.error('[Tages-Reset] Fehler beim Schließen der Räume:', statusError);
	}

	console.log('✅ Tages-Reset abgeschlossen - alle Räume geschlossen, öffnen um 08:00 automatisch');
}

async function checkDailyReset() {
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	const $settings = get(appSettings);

	// Warte auf appSettings falls noch nicht geladen
	if (!$settings) {
		console.log('[Tages-Reset] Warte auf appSettings...');
		return;
	}

	const lastResetDate = $settings.last_daily_reset;

	if (lastResetDate !== today) {
		console.log(`[Tages-Reset] Letzter Reset: ${lastResetDate}, Heute: ${today}`);

		// Atomares Update mit WHERE-Bedingung (verhindert Race Condition)
		// ✅ FIX: NULL-sicherer Filter (PostgreSQL: NULL <> 'wert' = NULL, nicht TRUE)
		const filterCondition = lastResetDate === null
			? 'last_daily_reset.is.null'
			: `last_daily_reset.neq.${today}`;

		const { data, error } = await supabase
			.from('app_settings')
			.update({ last_daily_reset: today })
			.eq('id', 1)
			.or(filterCondition)
			.select()
			.single();

		if (error) {
			// Fehler kann bedeuten: anderes Gerät hat bereits heute zurückgesetzt
			console.log('[Tages-Reset] Bereits von anderem Gerät durchgeführt oder Fehler:', error.message);
			return;
		}

		if (data) {
			// Wir haben das Update "gewonnen" - jetzt Reset durchführen
			await resetDailyTimes();

			// Lokalen Store aktualisieren
			appSettings.update(s => s ? { ...s, last_daily_reset: today } : s);
		}
	}
}

// ========== AUTOMATIK-SERVICE ==========
if (typeof window !== 'undefined') {
	const AUTOMATION_INTERVAL_MS = 10000;

	// Standard-Öffnungszeit: 08:00 (alle Räume öffnen sich automatisch)
	const DEFAULT_OPEN_MINUTES = 8 * 60; // 08:00 = 480 Minuten seit Mitternacht

	const runAutomation = () => {
		const $rooms = get(rooms);
		const $statuses = get(roomStatuses);
		const $configs = get(dailyConfigs);
		const $settings = get(appSettings);
		const $weekday = get(currentWeekday);
		const $time = get(currentTime);

		if (!$settings || $rooms.length === 0) {
			return;
		}

		let isNightModeActive = false;
		const now = $time.getHours() * 60 + $time.getMinutes();
		const nightStart = parseTime($settings.night_start);
		const nightEnd = parseTime($settings.night_end);

		if ($settings.night_mode_enabled && nightStart !== null && nightEnd !== null) {
			if (nightStart !== nightEnd) {
				if (nightStart > nightEnd) {
					if (now >= nightStart || now < nightEnd) isNightModeActive = true;
				} else {
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

			if (isNightModeActive) {
				// Nachtmodus: Alle Räume schließen (außer manuell überschrieben)
				if (currentIsOpen && !isManual) {
					needsUpdate = true;
					newIsOpen = false;
					newManualOverride = false;
				}
			} else if (config) {
				// Nur Räume mit Config für den heutigen Tag
				const openTime = parseTime(config.open_time);
				const closeTime = parseTime(config.close_time);

				// Effektive Öffnungszeit: eigene open_time oder Standard 08:00
				const effectiveOpenTime = openTime !== null ? openTime : DEFAULT_OPEN_MINUTES;

				// close_time nur berücksichtigen wenn sie NACH der Öffnungszeit liegt
				// Sonst ist es eine ungültige/veraltete Konfiguration
				const validCloseTime = closeTime !== null && closeTime > effectiveOpenTime ? closeTime : null;

				if (currentIsOpen && !isManual && validCloseTime !== null && now >= validCloseTime) {
					// Auto-Close: close_time erreicht → Raum schließen
					needsUpdate = true;
					newIsOpen = false;
					newManualOverride = false;
				} else if (!currentIsOpen && !isManual) {
					// Auto-Open: Öffnungszeit erreicht UND noch vor Schließzeit (falls gesetzt)
					if (now >= effectiveOpenTime && (validCloseTime === null || now < validCloseTime)) {
						needsUpdate = true;
						newIsOpen = true;
						newManualOverride = false;
					}
				}
			}

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
		}

		if (updates.length > 0) {
			// ✅ Optimistisches Update: Lokalen Store SOFORT aktualisieren
			// Damit die UI den neuen Status sofort zeigt (nicht auf DB-Antwort warten)
			roomStatuses.update(map => {
				const newMap = new Map(map);
				for (const update of updates) {
					newMap.set(update.room_id, createRoomStatus(
						update.room_id,
						update.is_open,
						update.manual_override
					));
				}
				return newMap;
			});

			// DB-Update im Hintergrund
			supabase
				.from('room_status')
				.upsert(updates, { onConflict: 'room_id' })
				.then(({ error }) => {
					if (error) {
						console.error("[AutoService] Fehler bei DB-Update:", error);
					}
				});
		}
	};

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let dailyResetIntervalId: ReturnType<typeof setInterval> | null = null;

	const stopAllIntervals = () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (dailyResetIntervalId) {
			clearInterval(dailyResetIntervalId);
			dailyResetIntervalId = null;
		}
	};

	const startAutomation = () => {
		stopAllIntervals();

		// Tages-Reset prüfen (einmal beim Start + stündlich)
		checkDailyReset();
		dailyResetIntervalId = setInterval(checkDailyReset, 60 * 60 * 1000);

		runAutomation();
		intervalId = setInterval(runAutomation, AUTOMATION_INTERVAL_MS);
	};

	setTimeout(startAutomation, 3000);
}