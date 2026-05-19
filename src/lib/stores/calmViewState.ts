import { writable } from 'svelte/store';

export const calmCurrentPageLabel = writable('Ruhige Ansicht');

export type CalmPageSummary = {
	id: string;
	label: string;
	short: string;
	openCount: number;
	roomCount: number;
};

export const calmPageSummaries = writable<CalmPageSummary[]>([]);
export const calmActivePageIndex = writable(0);
export const calmPageChangeRequest = writable<number | null>(null);
export const calmHeaderStats = writable({
	pageOpen: 0,
	pageRooms: 0,
	totalOpen: 0
});
export const calmPageProgress = writable({
	enabled: true,
	duration: 10,
	cycleKey: 0
});
