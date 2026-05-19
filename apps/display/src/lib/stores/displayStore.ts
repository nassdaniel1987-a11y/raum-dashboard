import { derived, get, writable } from 'svelte/store';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';
import type {
	AppSettings,
	BlitzApiResponse,
	BlitzPersonMapping,
	BlitzRoomMapping,
	BlitzSettings,
	DailyConfig,
	DisplayConnection,
	DisplayPage,
	DisplayRoom,
	FloorId,
	Person,
	Room,
	RoomStatus
} from '$lib/types';

const pageDefinitions: { id: string; label: string; short: string; floors: FloorId[] }[] = [
	{ id: 'dach', label: 'Dachgeschoss', short: 'Dach', floors: ['dach'] },
	{ id: 'og', label: 'Obergeschoss', short: 'OG', floors: ['og2', 'og1'] },
	{ id: 'eg', label: 'Erdgeschoss', short: 'EG', floors: ['eg'] },
	{ id: 'essen', label: 'Essbereich', short: 'Essen', floors: ['essen'] },
	{ id: 'extern', label: 'Aussenbereich', short: 'Aussen', floors: ['extern'] }
];

export const rooms = writable<Room[]>([]);
export const roomStatuses = writable<Map<string, RoomStatus>>(new Map());
export const dailyConfigs = writable<Map<string, DailyConfig>>(new Map());
export const appSettings = writable<AppSettings | null>(null);
export const persons = writable<Person[]>([]);
export const blitzSettings = writable<BlitzSettings | null>(null);
export const blitzRoomMappings = writable<BlitzRoomMapping[]>([]);
export const blitzPersonMappings = writable<BlitzPersonMapping[]>([]);
export const blitzData = writable<BlitzApiResponse | null>(null);
export const currentTime = writable(new Date());
export const viewWeekday = writable(new Date().getDay() || 7);
export const connection = writable<DisplayConnection>('loading');
export const lastSyncLabel = writable('Noch nicht geladen');
export const blitzError = writable<string | null>(null);

let channels: RealtimeChannel[] = [];
let blitzPollTimer: ReturnType<typeof setInterval> | undefined;

export const runnerName = derived(
	[appSettings, blitzSettings, blitzData, blitzPersonMappings, persons],
	([$settings, $blitzSettings, $blitzData, $personMappings, $persons]) => {
		if ($blitzSettings?.enabled && $blitzSettings.runner_blitz_room_id && $blitzData?.zuweisungen_gesamt) {
			const runnerPeople = $blitzData.zuweisungen_gesamt[$blitzSettings.runner_blitz_room_id] ?? [];
			const names = runnerPeople.map((person) => {
				const mapping = $personMappings.find((m) => m.blitz_slug === person.slug);
				return mapping?.person_id
					? $persons.find((knownPerson) => knownPerson.id === mapping.person_id)?.name ?? person.name
					: person.name;
			});

			if (names.length > 0) return names.join(', ');
		}

		return $settings?.runner_name ?? '';
	}
);

export const displayRooms = derived(
	[rooms, roomStatuses, dailyConfigs, viewWeekday, blitzData, blitzRoomMappings, blitzPersonMappings, persons],
	([$rooms, $statuses, $configs, $weekday, $blitzData, $roomMappings, $personMappings, $persons]) => {
		const blitzPersonsByRoom = new Map<string, string[]>();

		if ($blitzData?.zuweisungen_gesamt) {
			for (const [blitzRoomId, assignedPersons] of Object.entries($blitzData.zuweisungen_gesamt)) {
				const mappedRoomIds = $roomMappings
					.filter((mapping) => mapping.blitz_room_id === blitzRoomId)
					.map((mapping) => mapping.room_id);

				const mappedPersonNames = assignedPersons.map((assignedPerson) => {
					const mapping = $personMappings.find((item) => item.blitz_slug === assignedPerson.slug);
					return mapping?.person_id
						? $persons.find((knownPerson) => knownPerson.id === mapping.person_id)?.name ?? assignedPerson.name
						: assignedPerson.name;
				});

				for (const roomId of mappedRoomIds) {
					blitzPersonsByRoom.set(roomId, mappedPersonNames);
				}
			}
		}

		return $rooms
			.map((room) => {
				const config = $configs.get(`${room.id}-${$weekday}`);
				if (!config) return null;

				const fallbackPersons = room.person
					? room.person.split(',').map((person) => person.trim()).filter(Boolean)
					: [];

				return {
					...room,
					config,
					status: $statuses.get(room.id) ?? null,
					isOpen: $statuses.get(room.id)?.is_open ?? false,
					displayPersons: blitzPersonsByRoom.get(room.id) ?? fallbackPersons
				} satisfies DisplayRoom;
			})
			.filter((room): room is DisplayRoom => room !== null);
	}
);

export const displayPages = derived(displayRooms, ($displayRooms) => {
	return pageDefinitions
		.map((page) => ({
			...page,
			rooms: $displayRooms
				.filter((room) => page.floors.includes(room.floor))
				.sort((a, b) => a.position_x - b.position_x)
		}))
		.filter((page) => page.rooms.length > 0) satisfies DisplayPage[];
});

function toConfigMap(configs: DailyConfig[]) {
	return new Map(configs.map((config) => [`${config.room_id}-${config.weekday}`, config]));
}

function toStatusMap(statuses: RoomStatus[]) {
	return new Map(statuses.map((status) => [status.room_id, status]));
}

export async function loadDisplayData() {
	connection.set('loading');

	const [
		roomsResult,
		statusResult,
		configsResult,
		settingsResult,
		personsResult,
		blitzSettingsResult,
		blitzRoomMappingsResult,
		blitzPersonMappingsResult
	] = await Promise.all([
		supabase.from('rooms').select('*'),
		supabase.from('room_status').select('*'),
		supabase.from('daily_configs').select('*'),
		supabase.from('app_settings').select('*').single(),
		supabase.from('persons').select('*').order('sort_order'),
		supabase.from('blitz_settings').select('*').single(),
		supabase.from('blitz_room_mapping').select('*'),
		supabase.from('blitz_person_mapping').select('*')
	]);

	if (roomsResult.error || statusResult.error || configsResult.error || settingsResult.error) {
		connection.set('offline');
		return;
	}

	rooms.set(roomsResult.data ?? []);
	roomStatuses.set(toStatusMap(statusResult.data ?? []));
	dailyConfigs.set(toConfigMap(configsResult.data ?? []));
	appSettings.set(settingsResult.data ?? null);
	persons.set(personsResult.data ?? []);
	blitzSettings.set(blitzSettingsResult.data ?? null);
	blitzRoomMappings.set(blitzRoomMappingsResult.data ?? []);
	blitzPersonMappings.set(blitzPersonMappingsResult.data ?? []);

	await refreshBlitzData();
	connection.set(get(blitzSettings)?.enabled && get(blitzError) ? 'partial' : 'ready');
}

export function subscribeDisplayRealtime() {
	unsubscribeDisplayRealtime();

	const tableHandlers = [
		{
			table: 'rooms',
			refresh: async () => rooms.set((await supabase.from('rooms').select('*')).data ?? [])
		},
		{
			table: 'room_status',
			refresh: async () => roomStatuses.set(toStatusMap((await supabase.from('room_status').select('*')).data ?? []))
		},
		{
			table: 'daily_configs',
			refresh: async () => dailyConfigs.set(toConfigMap((await supabase.from('daily_configs').select('*')).data ?? []))
		},
		{
			table: 'app_settings',
			refresh: async () => appSettings.set((await supabase.from('app_settings').select('*').single()).data ?? null)
		},
		{
			table: 'persons',
			refresh: async () => persons.set((await supabase.from('persons').select('*').order('sort_order')).data ?? [])
		},
		{
			table: 'blitz_room_mapping',
			refresh: async () => blitzRoomMappings.set((await supabase.from('blitz_room_mapping').select('*')).data ?? [])
		},
		{
			table: 'blitz_person_mapping',
			refresh: async () => blitzPersonMappings.set((await supabase.from('blitz_person_mapping').select('*')).data ?? [])
		},
		{
			table: 'blitz_settings',
			refresh: async () => blitzSettings.set((await supabase.from('blitz_settings').select('*').single()).data ?? null)
		}
	];

	channels = tableHandlers.map(({ table, refresh }) =>
		supabase
			.channel(`display-${table}`)
			.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
				void refresh();
			})
			.subscribe()
	);
}

export function unsubscribeDisplayRealtime() {
	for (const channel of channels) {
		supabase.removeChannel(channel);
	}
	channels = [];
}

export async function refreshBlitzData() {
	const settings = get(blitzSettings);
	if (!settings?.enabled) {
		blitzError.set(null);
		return;
	}

	const today = new Date().toISOString().split('T')[0];

	try {
		const response = await fetch(`/api/blitz-data?datum=${today}`);
		if (!response.ok) throw new Error(`Blitz ${response.status}`);
		blitzData.set(await response.json());
		blitzError.set(null);
		lastSyncLabel.set(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
		connection.set('ready');
	} catch (error) {
		blitzError.set(error instanceof Error ? error.message : 'Blitz nicht erreichbar');
		connection.set('partial');
	}
}

export function startDisplayClock() {
	const clock = setInterval(() => {
		const now = new Date();
		currentTime.set(now);
		const weekday = now.getDay() || 7;
		if (weekday !== get(viewWeekday)) {
			viewWeekday.set(weekday);
		}
	}, 1000);

	return () => clearInterval(clock);
}

export function startBlitzPolling() {
	const intervalSeconds = get(blitzSettings)?.polling_interval_seconds ?? 60;
	if (blitzPollTimer) clearInterval(blitzPollTimer);
	blitzPollTimer = setInterval(() => {
		void refreshBlitzData();
	}, Math.max(30, intervalSeconds) * 1000);
}

export function stopBlitzPolling() {
	if (blitzPollTimer) clearInterval(blitzPollTimer);
	blitzPollTimer = undefined;
}

export function setViewDay(day: number) {
	viewWeekday.set(day < 1 ? 7 : day > 7 ? 1 : day);
}
