import type { Room, RoomStatus, AppSettings } from '$lib/types';

// Fallback-Daten falls der Supabase-Read fehlschlägt
export const FALLBACK_ROOMS: Room[] = [
	{
		id: 'sandbox-1',
		name: 'Turnhalle',
		floor: 'eg',
		position_x: 0,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#4CAF50',
		theme: 'space',
		image_url: null,
		person: null,
		created_at: '2024-01-01T00:00:00Z'
	},
	{
		id: 'sandbox-2',
		name: 'Bibliothek',
		floor: 'eg',
		position_x: 320,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#2196F3',
		theme: 'space',
		image_url: null,
		person: null,
		created_at: '2024-01-01T00:00:00Z'
	},
	{
		id: 'sandbox-3',
		name: 'Aula',
		floor: 'og1',
		position_x: 0,
		position_y: 270,
		width: 300,
		height: 250,
		background_color: '#9C27B0',
		theme: 'space',
		image_url: null,
		person: null,
		created_at: '2024-01-01T00:00:00Z'
	},
	{
		id: 'sandbox-4',
		name: 'Werkraum',
		floor: 'og1',
		position_x: 320,
		position_y: 270,
		width: 300,
		height: 250,
		background_color: '#FF5722',
		theme: 'space',
		image_url: null,
		person: null,
		created_at: '2024-01-01T00:00:00Z'
	}
];

export function buildFallbackStatuses(roomList: Room[]): Map<string, RoomStatus> {
	return new Map(
		roomList.map((r) => [
			r.id,
			{
				room_id: r.id,
				is_open: false,
				manual_override: false,
				last_updated: new Date().toISOString()
			}
		])
	);
}

export const FALLBACK_APP_SETTINGS: AppSettings = {
	id: 1,
	night_mode_enabled: false,
	night_start: '22:00',
	night_end: '07:00',
	current_theme: 'default',
	runner_name: null,
	last_daily_reset: null
};
