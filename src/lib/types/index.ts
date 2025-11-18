// Haupt-Typen für das Raum-Dashboard

export interface Room {
	id: string;
	name: string;
	floor: 'dach' | 'og2' | 'og1' | 'eg' | 'ug' | 'extern';
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	background_color: string;
	image_url: string | null;
	theme: string;
	person: string | null; // Person, die in diesem Raum ist
	created_at: string;
}

export interface DailyConfig {
	id: string;
	room_id: string;
	weekday: number; // 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr
	activity: string | null;
	title_font_size: number;
	text_font_size: number;
	text_color: string; // ✅ NEU: Textfarbe für Titel und Aktivität
	title_alignment: 'left' | 'center' | 'right';
	text_alignment: 'left' | 'center' | 'right';
	open_time: string | null; // HH:MM format
	close_time: string | null; // HH:MM format
	is_locked: boolean;
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
	night_start: string; // HH:MM format
	night_end: string; // HH:MM format
	current_theme: string;
}

export interface RoomWithConfig extends Room {
	config: DailyConfig | null;
	status: RoomStatus | null;
	isOpen: boolean;
}

export type Theme = 'space' | 'dino' | 'pokemon' | 'minecraft' | 'ocean';

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}
