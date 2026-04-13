import { writable } from 'svelte/store';

export type SandboxLayoutId =
	| 'carousel'
	| 'focus'
	| 'grid'
	| 'compact'
	| 'split'
	| 'timeline'
	| 'heatmap'
	| 'masonry'
	| 'floorplan'
	| 'deck'
	| 'splitscreen'
	| 'neon'
	| 'orbital'
	| 'archipelago';

export interface LayoutOption {
	id: SandboxLayoutId;
	label: string;
	icon: string;
	description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
	{ id: 'carousel',    label: 'Karussell',   icon: '⊞',  description: '2×2 Seiten-Ansicht' },
	{ id: 'focus',       label: 'Fokus',        icon: '⬜',  description: 'Ein Raum groß' },
	{ id: 'grid',        label: 'Raster',       icon: '⊟',  description: '3-Spalten Übersicht' },
	{ id: 'compact',     label: 'Kompakt',      icon: '▦',   description: '4-Spalten dicht' },
	{ id: 'split',       label: 'Etagen',       icon: '⊢⊣', description: 'Streifen pro Etage' },
	{ id: 'timeline',    label: 'Timeline',     icon: '📅',  description: 'Öffnungszeiten als Zeitleiste' },
	{ id: 'heatmap',     label: 'Heatmap',      icon: '🌡️',  description: 'Status-Übersicht als Farbraster' },
	{ id: 'masonry',     label: 'Kachelwand',   icon: '🧱',  description: 'Dynamische Kachelgröße nach Status' },
	{ id: 'floorplan',   label: 'Grundriss',    icon: '🏫',  description: 'Schematischer Gebäudeplan' },
	{ id: 'deck',        label: 'Karten-Deck',  icon: '🃏',  description: 'Stapel — eine Karte nach der anderen' },
	{ id: 'splitscreen', label: 'Splitscreen',  icon: '▐▌',  description: 'Liste + Detailansicht' },
	{ id: 'neon',        label: 'Neon-Board',   icon: '⚡',  description: 'Retro Neon-Optik' },
	{ id: 'orbital',      label: 'Orbital',       icon: '🪐',  description: 'Räume als Planetensystem' },
	{ id: 'archipelago',  label: 'Archipelago',   icon: '⬡',   description: 'Räume als topografische Inselkarte' }
];

const SESSION_KEY = 'sandbox_layout';

function createLayoutStore() {
	const saved =
		typeof window !== 'undefined'
			? (sessionStorage.getItem(SESSION_KEY) as SandboxLayoutId | null)
			: null;

	const { subscribe, set } = writable<SandboxLayoutId>(saved ?? 'carousel');

	return {
		subscribe,
		setLayout(id: SandboxLayoutId) {
			if (typeof window !== 'undefined') {
				sessionStorage.setItem(SESSION_KEY, id);
			}
			set(id);
		}
	};
}

export const sandboxLayout = createLayoutStore();
