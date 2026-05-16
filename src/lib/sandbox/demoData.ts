import type { AppSettings, DailyConfig, Room, RoomStatus } from '$lib/types';

const createdAt = '2026-05-16T08:00:00.000Z';

export const DEMO_NOW = new Date('2026-05-16T09:55:00.000Z');

export const DEMO_ROOMS: Room[] = [
	{
		id: 'demo-eg-1',
		name: 'Bibliothek',
		floor: 'eg',
		position_x: 0,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#2563eb',
		image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Frau Keller',
		created_at: createdAt
	},
	{
		id: 'demo-eg-2',
		name: 'Bewegungsraum',
		floor: 'eg',
		position_x: 320,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#16a34a',
		image_url: null,
		theme: 'space',
		person: 'Herr Vogt, Frau Nguyen',
		created_at: createdAt
	},
	{
		id: 'demo-eg-3',
		name: 'Lernatelier Sprache & Medien',
		floor: 'eg',
		position_x: 640,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#0f766e',
		image_url: null,
		theme: 'space',
		person: null,
		created_at: createdAt
	},
	{
		id: 'demo-eg-4',
		name: 'Kreativwerkstatt',
		floor: 'eg',
		position_x: 960,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#c2410c',
		image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Frau Stein',
		created_at: createdAt
	},
	{
		id: 'demo-og-1',
		name: 'Mathe-Lernraum',
		floor: 'og1',
		position_x: 0,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#7c3aed',
		image_url: null,
		theme: 'space',
		person: 'Herr Brandt',
		created_at: createdAt
	},
	{
		id: 'demo-og-2',
		name: 'Forscherlabor',
		floor: 'og1',
		position_x: 320,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#0891b2',
		image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Frau Adler, Herr Cem',
		created_at: createdAt
	},
	{
		id: 'demo-og-3',
		name: 'Ruheraum',
		floor: 'og2',
		position_x: 640,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#475569',
		image_url: null,
		theme: 'space',
		person: null,
		created_at: createdAt
	},
	{
		id: 'demo-og-4',
		name: 'Musikatelier',
		floor: 'og2',
		position_x: 960,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#be185d',
		image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Herr Yilmaz',
		created_at: createdAt
	},
	{
		id: 'demo-essen-1',
		name: 'Mensa',
		floor: 'essen',
		position_x: 0,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#d97706',
		image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Team Kueche',
		created_at: createdAt
	},
	{
		id: 'demo-essen-2',
		name: 'Snackinsel',
		floor: 'essen',
		position_x: 320,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#ea580c',
		image_url: null,
		theme: 'space',
		person: null,
		created_at: createdAt
	},
	{
		id: 'demo-ext-1',
		name: 'Schulhof',
		floor: 'extern',
		position_x: 0,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#15803d',
		image_url: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=900&q=70',
		theme: 'space',
		person: 'Aufsicht Nord',
		created_at: createdAt
	},
	{
		id: 'demo-ext-2',
		name: 'Turnhalle Aussen',
		floor: 'extern',
		position_x: 320,
		position_y: 0,
		width: 300,
		height: 250,
		background_color: '#dc2626',
		image_url: null,
		theme: 'space',
		person: 'Herr Reuter',
		created_at: createdAt
	}
];

export const DEMO_STATUSES = new Map<string, RoomStatus>([
	['demo-eg-1', { room_id: 'demo-eg-1', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-eg-2', { room_id: 'demo-eg-2', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-eg-3', { room_id: 'demo-eg-3', is_open: false, manual_override: false, last_updated: createdAt }],
	['demo-eg-4', { room_id: 'demo-eg-4', is_open: false, manual_override: false, last_updated: createdAt }],
	['demo-og-1', { room_id: 'demo-og-1', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-og-2', { room_id: 'demo-og-2', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-og-3', { room_id: 'demo-og-3', is_open: false, manual_override: false, last_updated: createdAt }],
	['demo-og-4', { room_id: 'demo-og-4', is_open: false, manual_override: false, last_updated: createdAt }],
	['demo-essen-1', { room_id: 'demo-essen-1', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-essen-2', { room_id: 'demo-essen-2', is_open: false, manual_override: false, last_updated: createdAt }],
	['demo-ext-1', { room_id: 'demo-ext-1', is_open: true, manual_override: false, last_updated: createdAt }],
	['demo-ext-2', { room_id: 'demo-ext-2', is_open: false, manual_override: false, last_updated: createdAt }]
]);

function config(
	id: string,
	roomId: string,
	activity: string,
	openTime: string | null,
	closeTime: string | null,
	activityImageUrl: string | null = null
): DailyConfig {
	return {
		id,
		room_id: roomId,
		weekday: 6,
		activity,
		title_font_size: 42,
		text_font_size: 28,
		text_color: '#FFFFFF',
		title_alignment: 'center',
		text_alignment: 'center',
		open_time: openTime,
		close_time: closeTime,
		is_locked: false,
		activity_image_url: activityImageUrl,
		activity_image_size: 'medium',
		activity_image_crop: null,
		activity_image_position: null,
		activity_image_position_calm: null
	};
}

export const DEMO_CONFIGS = new Map<string, DailyConfig>([
	[
		'demo-eg-1-6',
		config(
			'cfg-eg-1',
			'demo-eg-1',
			'Lesezeit und Ausleihe',
			'08:00',
			'15:30',
			'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=70'
		)
	],
	['demo-eg-2-6', config('cfg-eg-2', 'demo-eg-2', 'Bewegungsparcours fuer Klasse 2', '09:00', '10:00')],
	['demo-eg-3-6', config('cfg-eg-3', 'demo-eg-3', 'Foerderband mit sehr langer Aktivitaetsbeschreibung', '10:00', '12:00')],
	[
		'demo-eg-4-6',
		config(
			'cfg-eg-4',
			'demo-eg-4',
			'Tonarbeiten und freies Gestalten',
			null,
			null,
			'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=70'
		)
	],
	['demo-og-1-6', config('cfg-og-1', 'demo-og-1', 'Mathewerkstatt', '08:30', '10:00')],
	[
		'demo-og-2-6',
		config(
			'cfg-og-2',
			'demo-og-2',
			'Experimente mit Licht und Wasser',
			'09:15',
			'10:00',
			'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=70'
		)
	],
	['demo-og-3-6', config('cfg-og-3', 'demo-og-3', 'Ruhezeit', null, null)],
	[
		'demo-og-4-6',
		config(
			'cfg-og-4',
			'demo-og-4',
			'Bandprobe',
			'10:05',
			'12:00',
			'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=70'
		)
	],
	[
		'demo-essen-1-6',
		config(
			'cfg-essen-1',
			'demo-essen-1',
			'Fruehstuecksausgabe',
			'08:00',
			'11:30',
			'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=70'
		)
	],
	['demo-essen-2-6', config('cfg-essen-2', 'demo-essen-2', 'Vorbereitung', '10:05', '12:00')],
	[
		'demo-ext-1-6',
		config(
			'cfg-ext-1',
			'demo-ext-1',
			'Hofpause',
			'09:00',
			'10:00',
			'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=900&q=70'
		)
	],
	['demo-ext-2-6', config('cfg-ext-2', 'demo-ext-2', 'Sportangebot', '10:05', '12:00')]
]);

export const DEMO_APP_SETTINGS: AppSettings = {
	id: 1,
	night_mode_enabled: false,
	night_start: '17:00',
	night_end: '07:00',
	current_theme: 'default',
	runner_name: 'Frau Sommer',
	last_daily_reset: '2026-05-16'
};
