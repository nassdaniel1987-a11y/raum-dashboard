// Haupt-Typen für das Raum-Dashboard

export interface Room {
	id: string;
	name: string;
	floor: 'dach' | 'og2' | 'og1' | 'eg' | 'essen' | 'ug' | 'extern';
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

export interface ImageCrop {
	x: number;
	y: number;
	width: number;
	height: number;
}

// ✅ NEU: Position & Zoom für WYSIWYG Editor
export interface ImagePosition {
	x: number; // Position in % (horizontal)
	y: number; // Position in % (vertikal)
	zoom: number; // Zoom level (0.5 - 3.0)
	rotation?: number; // Rotation in Grad (0, 90, 180, 270)
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
	// ✅ Aktivitäts-Bild (geheftet an Kachel, kein Hintergrund)
	activity_image_url: string | null;
	activity_image_size: 'small' | 'medium' | 'large';
	activity_image_crop: ImageCrop | null; // ✅ Legacy - wird durch activity_image_position ersetzt
	activity_image_position: ImagePosition | null; // ✅ NEU: WYSIWYG Position & Zoom
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
	runner_name: string | null; // Läufer/Ansprechpartner im Haus
}

export interface RoomWithConfig extends Room {
	config: DailyConfig | null;
	status: RoomStatus | null;
	isOpen: boolean;
}

export type Theme = 'default' | 'space' | 'dino' | 'ocean' | 'pokemon' | 'minecraft' | 'pippi' | 'candyland' | 'basketball' | 'weihnachten' | 'musik';

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface DailyHighlight {
	id: string;
	weekday: number; // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
	icon: string;
	text: string;
	color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
	room: string | null; // Raum, in dem das Angebot stattfindet
	person: string | null; // Person, die das Angebot macht
	sort_order: number;
	created_at: string;
}
