import { writable, derived, get } from 'svelte/store';
import type { Room, RoomStatus, DailyConfig, AppSettings, RoomWithConfig } from '$lib/types';
import { supabase } from '$lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ===== ADMIN MODE =====
export const isEditMode = writable(false);

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
	[rooms, roomStatuses, dailyConfigs, currentWeekday, currentTime, appSettings],
	([$rooms, $statuses, $configs, $weekday, $time, $settings]) => {
		return $rooms.map((room) => {
			const status = $statuses.get(room.id);
			const configKey = `${room.id}-${$weekday}`;
			const config = $configs.get(configKey);

			// Berechne ob Raum offen sein sollte
			let isOpen = status?.is_open ?? false;

			// Prüfe Nachtruhe
			if ($settings?.night_mode_enabled) {
				const now = $time.getHours() * 60 + $time.getMinutes();
				const nightStart = parseTime($settings.night_start);
				const nightEnd = parseTime($settings.night_end);

				if (nightStart && nightEnd) {
					if (nightStart > nightEnd) {
						// Nacht über Mitternacht (z.B. 22:00 - 06:00)
						if (now >= nightStart || now < nightEnd) {
							isOpen = false;
						}
					} else {
						// Normale Zeitspanne
						if (now >= nightStart && now < nightEnd) {
							isOpen = false;
						}
					}
				}
			}

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
						map.set(payload.new.room_id, payload.new as RoomStatus);
						return new Map(map);
					});
				} else if (payload.eventType === 'DELETE') {
					roomStatuses.update((map) => {
						map.delete(payload.old.room_id);
						return new Map(map);
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
					map.set(key, config);
					return new Map(map);
				});
			} else if (payload.eventType === 'DELETE') {
				const config = payload.old as DailyConfig;
				const key = `${config.room_id}-${config.weekday}`;
				dailyConfigs.update((map) => {
					map.delete(key);
					return new Map(map);
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
function parseTime(timeString: string): number | null {
	if (!timeString) return null;
	const [hours, minutes] = timeString.split(':').map(Number);
	return hours * 60 + minutes;
}

// ===== ROOM ACTIONS =====
export async function toggleRoomStatus(roomId: string) {
	const currentStatus = get(roomStatuses).get(roomId);
	const newStatus = !(currentStatus?.is_open ?? false);

	const { error } = await supabase
		.from('room_status')
		.upsert(
			{ room_id: roomId, is_open: newStatus, manual_override: true },
			{ onConflict: 'room_id' }
		);

	if (error) {
		console.error('Error toggling room status:', error);
		return;
	}

	// Optimistisches Update (sofort UI aktualisieren)
	roomStatuses.update((map) => {
		const existing = map.get(roomId) || { room_id: roomId, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
		map.set(roomId, { ...existing, is_open: newStatus, manual_override: true });
		return new Map(map);
	});
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

// ========== HIER IST DIE NEUE FUNKTION (START) ==========
export function swapRoomPositions(draggedRoom: RoomWithConfig, targetRoom: RoomWithConfig) {
	const draggedPos = draggedRoom.position_x;
	const targetPos = targetRoom.position_x;

	// 1. Optimistisches Update (atomar)
	// Mache ein einziges Update im 'rooms' store, das beide Räume tauscht
	rooms.update((list) =>
		list.map((r) => {
			if (r.id === draggedRoom.id) {
				return { ...r, position_x: targetPos };
			}
			if (r.id === targetRoom.id) {
				return { ...r, position_x: draggedPos };
			}
			return r;
		})
	);

	// 2. Datenbank-Updates (fire-and-forget, kein 'await' nötig)
	// Wir müssen nicht auf die DB warten, die UI ist schon aktualisiert.
	supabase
		.from('rooms')
		.update({ position_x: targetPos })
		.eq('id', draggedRoom.id)
		.then(({ error }) => {
			if (error) console.error('Error swapping pos 1:', error.message);
		});

	supabase
		.from('rooms')
		.update({ position_x: draggedPos })
		.eq('id', targetRoom.id)
		.then(({ error }) => {
			if (error) console.error('Error swapping pos 2:', error.message);
		});
}
// ========== HIER IST DIE NEUE FUNKTION (ENDE) ==========

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

	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

	if (!error) {
		// Optimistisches Update
		roomStatuses.update((map) => {
			allRooms.forEach((room) => {
				const existing = map.get(room.id) || { room_id: room.id, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
				map.set(room.id, { ...existing, is_open: true, manual_override: true });
			});
			return new Map(map);
		});
	}
}

export async function bulkCloseAllRooms() {
	const allRooms = get(rooms);
	const updates = allRooms.map((room) => ({
		room_id: room.id,
		is_open: false,
		manual_override: true
	}));

	const { error } = await supabase.from('room_status').upsert(updates, { onConflict: 'room_id' });

	if (!error) {
		// Optimistisches Update
		roomStatuses.update((map) => {
			allRooms.forEach((room) => {
				const existing = map.get(room.id) || { room_id: room.id, is_open: false, manual_override: false, last_updated: new Date().toISOString() };
				map.set(room.id, { ...existing, is_open: false, manual_override: true });
			});
			return new Map(map);
		});
	}
}

export async function deleteRoom(roomId: string) {
	await supabase.from('rooms').delete().eq('id', roomId);
}

export async function createNewRoom(name: string, floor: string = 'eg') {
	// Berechne die nächste position_x für das Stockwerk
	const existingRooms = get(rooms).filter(r => r.floor === floor);
	const maxPosition = existingRooms.length > 0 
		? Math.max(...existingRooms.map(r => r.position_x))
		: 0;

	const { data } = await supabase
		.from('rooms')
		.insert({ 
			name, 
			floor,
			position_x: maxPosition + 100, 
			position_y: 100 
		})
		.select()
		.single();

	if (data) {
		// Status initialisieren
		await supabase.from('room_status').insert({ room_id: data.id, is_open: false });
	}
}