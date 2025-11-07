import { writable, derived, get } from 'svelte/store';
import type { Room, RoomStatus, DailyConfig, AppSettings, RoomWithConfig } from '$lib/types';
import { supabase } from '$lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { applyTheme } from '$lib/themes';

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

// ===== THEME HANDLING (BENUTZERSPEZIFISCH) =====
export const userTheme = writable<string>('default');

// Theme aus LocalStorage laden beim Start
if (typeof window !== 'undefined') {
	const savedTheme = localStorage.getItem('user-theme');
	if (savedTheme) {
		userTheme.set(savedTheme);
	}
	
	// Wenn sich das User-Theme ändert, speichern und anwenden
	userTheme.subscribe(($theme) => {
		localStorage.setItem('user-theme', $theme);
		applyTheme($theme);
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

// ===== REALTIME SUBSCRIPTIONS =====
let roomStatusChannel: RealtimeChannel | null = null;
let roomsChannel: RealtimeChannel | null = null;
let configsChannel: RealtimeChannel | null = null;
let settingsChannel: RealtimeChannel | null = null;

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
}

export function unsubscribeFromRealtimeUpdates() {
	roomStatusChannel?.unsubscribe();
	roomsChannel?.unsubscribe();
	configsChannel?.unsubscribe();
	settingsChannel?.unsubscribe();
}

// ===== DATA LOADING =====
export async function loadAllData() {
	const { data: roomsData } = await supabase.from('rooms').select('*').order('created_at');
	if (roomsData) rooms.set(roomsData);

	const { data: statusesData } = await supabase.from('room_status').select('*');
	if (statusesData) {
		const statusMap = new Map();
		statusesData.forEach((s) => statusMap.set(s.room_id, s));
		roomStatuses.set(statusMap);
	}

	const { data: configsData } = await supabase.from('daily_configs').select('*');
	if (configsData) {
		const configMap = new Map();
		configsData.forEach((c) => configMap.set(`${c.room_id}-${c.weekday}`, c));
		dailyConfigs.set(configMap);
	}

	const { data: settingsData } = await supabase
		.from('app_settings')
		.select('*')
		.eq('id', 1)
		.single();
	if (settingsData) {
		appSettings.set(settingsData);
	}
}

// ===== UTILITY FUNCTIONS =====
function parseTime(timeString: string | null | undefined): number | null {
	if (!timeString) return null;
	const [hours, minutes] = timeString.split(':').map(Number);
	if (isNaN(hours) || isNaN(minutes)) return null;
	return hours * 60 + minutes;
}

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

	const { data } = await supabase
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
			image_url: null
		})
		.select()
		.single();

	if (data) {
		// Room Status erstellen
		await supabase.from('room_status').insert({
			room_id: data.id,
			is_open: false,
			manual_override: false
		});

		// ✅ NEU: Daily Config nur für den aktuell angezeigten Tag erstellen
		const currentViewDay = get(viewWeekday);
		await supabase.from('daily_configs').insert({
			room_id: data.id,
			weekday: currentViewDay,
			activity: null,
			open_time: null,
			close_time: null,
			title_font_size: 42,
			text_font_size: 28,
			text_color: '#FFFFFF'
		});
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

// ========== AUTOMATIK-SERVICE ==========
if (typeof window !== 'undefined') {
	const AUTOMATION_INTERVAL_MS = 10000;

	const runAutomation = () => {
		console.log('[AutoService] 🔄 Running automation check...');

		const $rooms = get(rooms);
		const $statuses = get(roomStatuses);
		const $configs = get(dailyConfigs);
		const $settings = get(appSettings);
		const $weekday = get(currentWeekday);
		const $time = get(currentTime);

		console.log(`[AutoService] 📊 Rooms: ${$rooms.length}, Settings: ${!!$settings}, Weekday: ${$weekday}`);

		if (!$settings || $rooms.length === 0) {
			console.log('[AutoService] ⏭️ Skipping - no settings or no rooms');
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
				if (currentIsOpen && !isManual) {
					needsUpdate = true;
					newIsOpen = false;
					newManualOverride = false;
				}
			} else {
				// Auto-Open: Raum öffnen wenn open_time erreicht ist (ignoriert manual_override)
				if (!currentIsOpen) {
					const openTime = parseTime(config?.open_time);

					// 🔍 DEBUG
					if (config?.open_time) {
						console.log(`[AutoService] ${room.name}: open_time="${config.open_time}", parsed=${openTime}, now=${now}, currentIsOpen=${currentIsOpen}, condition=${openTime !== null && now >= openTime}`);
					}

					if (openTime !== null && now >= openTime) {
						console.log(`[AutoService] ✅ ÖFFNE ${room.name}!`);
						needsUpdate = true;
						newIsOpen = true;
						newManualOverride = false; // Reset manual_override
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
			console.log(`[AutoService] Aktualisiere ${updates.length} Räume...`);
			supabase
				.from('room_status')
				.upsert(updates, { onConflict: 'room_id' })
				.then(({ error }) => {
					if (error) {
						console.error("[AutoService] Fehler bei DB-Update:", error);
					} else {
						// ✅ KORRIGIERT: Lokale Updates mit last_updated
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
					}
				});
		} else {
			console.log('[AutoService] ✅ Keine Updates nötig');
		}

		console.log('[AutoService] 🏁 Check abgeschlossen');
	};

	let intervalId: ReturnType<typeof setInterval> | null = null;

	const startAutomation = () => {
		if (intervalId) clearInterval(intervalId);
		if ((window as any).clearAutomationInterval) (window as any).clearAutomationInterval();

		runAutomation();
		intervalId = setInterval(runAutomation, AUTOMATION_INTERVAL_MS);
		console.log('[AutoService] Gestartet.');

		(window as any).clearAutomationInterval = () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
				console.log('[AutoService] Gestoppt.');
			}
		};
	};

	setTimeout(startAutomation, 3000);
}