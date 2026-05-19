export type FloorId = 'dach' | 'og2' | 'og1' | 'eg' | 'essen' | 'ug' | 'extern';

export interface Room {
	id: string;
	name: string;
	floor: FloorId;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	background_color: string;
	image_url: string | null;
	theme: string;
	person: string | null;
	created_at: string;
}

export interface DailyConfig {
	id: string;
	room_id: string;
	weekday: number;
	activity: string | null;
	title_font_size: number;
	text_font_size: number;
	text_color: string;
	title_alignment: 'left' | 'center' | 'right';
	text_alignment: 'left' | 'center' | 'right';
	open_time: string | null;
	close_time: string | null;
	is_locked: boolean;
	activity_image_url: string | null;
	activity_image_size: 'small' | 'medium' | 'large';
	activity_image_crop: unknown | null;
	activity_image_position: unknown | null;
	activity_image_position_calm: unknown | null;
}

export interface RoomStatus {
	room_id: string;
	is_open: boolean;
	manual_override: boolean;
	last_updated: string;
}

export interface AppSettings {
	id: number;
	night_mode_enabled: boolean;
	night_start: string;
	night_end: string;
	current_theme: string;
	runner_name: string | null;
	calm_title_font_size?: number;
	calm_text_font_size?: number;
	calm_card_gap_px?: number;
	calm_card_padding_px?: number;
	calm_image_width_percent?: number;
	calm_header_density?: 'compact' | 'comfortable';
	last_daily_reset: string | null;
}

export interface Person {
	id: string;
	name: string;
	sort_order: number;
	created_at: string;
}

export interface BlitzSettings {
	id: number;
	enabled: boolean;
	api_url: string | null;
	polling_interval_seconds: number;
	last_sync: string | null;
	last_error: string | null;
	runner_blitz_room_id: string | null;
	created_at: string;
}

export interface BlitzRoomMapping {
	blitz_room_id: string;
	blitz_label: string;
	room_id: string;
	created_at: string;
}

export interface BlitzPersonMapping {
	blitz_slug: string;
	blitz_name: string;
	person_id: string | null;
	created_at: string;
}

export interface BlitzApiResponse {
	datum: string;
	raeume: { id: string; label: string }[];
	zuweisungen_gesamt: Record<string, { name: string; slug: string }[]>;
	anwesenheit: string[];
	abwesend: string[];
}

export interface DisplayRoom extends Room {
	config: DailyConfig;
	status: RoomStatus | null;
	isOpen: boolean;
	displayPersons: string[];
}

export interface DisplayPage {
	id: string;
	label: string;
	short: string;
	rooms: DisplayRoom[];
}

export type DisplayConnection = 'loading' | 'ready' | 'partial' | 'offline';
