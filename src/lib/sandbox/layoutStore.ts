import { writable } from 'svelte/store';

export type SandboxLayoutId = 'carousel' | 'focus' | 'grid' | 'compact' | 'split';

export interface LayoutOption {
	id: SandboxLayoutId;
	label: string;
	icon: string;
	description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
	{ id: 'carousel', label: 'Karussell', icon: '⊞', description: '2×2 Seiten-Ansicht' },
	{ id: 'focus',    label: 'Fokus',     icon: '⬜', description: 'Ein Raum groß' },
	{ id: 'grid',     label: 'Raster',    icon: '⊟', description: '3-Spalten Übersicht' },
	{ id: 'compact',  label: 'Kompakt',   icon: '▦',  description: '4-Spalten dicht' },
	{ id: 'split',    label: 'Etagen',    icon: '⊢⊣', description: 'Streifen pro Etage' }
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
