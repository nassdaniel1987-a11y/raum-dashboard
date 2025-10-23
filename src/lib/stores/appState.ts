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

export function subscribeToRealtimeUpdates() {
	// Room Status Updates
	roomStatusChannel = supabase
		.channel('room-status-changes')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'room_status' },
			(payload) => {
				if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
					roomStatuses.update((map) => {
						map.set(payload.new.room_id, payload.new as RoomStatus);
						return map;
					});
				} else if (payload.eventType === 'DELETE') {
					roomStatuses.update((map) => {
						map.delete(payload.old.room_id);
						return map;
					});
				}
			}
		)
		.subscribe();

	// Rooms Updates (Position, Größe, etc.)
	roomsChannel = supabase
		.channel('rooms-changes')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
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
		.subscribe();
}

export function unsubscribeFromRealtimeUpdates() {
	roomStatusChannel?.unsubscribe();
	roomsChannel?.unsubscribe();
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

	await supabase
		.from('room_status')
		.upsert({ room_id: roomId, is_open: newStatus, manual_override: true });
}

export async function updateRoomPosition(roomId: string, x: number, y: number) {
	await supabase.from('rooms').update({ position_x: x, position_y: y }).eq('id', roomId);
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

	await supabase.from('room_status').upsert(updates);
}

export async function bulkCloseAllRooms() {
	const allRooms = get(rooms);
	const updates = allRooms.map((room) => ({
		room_id: room.id,
		is_open: false,
		manual_override: true
	}));

	await supabase.from('room_status').upsert(updates);
}

export async function deleteRoom(roomId: string) {
	await supabase.from('rooms').delete().eq('id', roomId);
}

export async function createNewRoom(name: string) {
	const { data } = await supabase
		.from('rooms')
		.insert({ name, position_x: 100, position_y: 100 })
		.select()
		.single();

	if (data) {
		// Status initialisieren
		await supabase.from('room_status').insert({ room_id: data.id, is_open: false });
	}
}
