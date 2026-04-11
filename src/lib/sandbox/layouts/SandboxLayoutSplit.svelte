<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dachgeschoss',
		og2: '2. Obergeschoss',
		og1: '1. Obergeschoss',
		eg: 'Erdgeschoss',
		essen: 'Essensbereich',
		ug: 'Untergeschoss',
		extern: 'Extern'
	};

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];

	let floorGroups = $derived(() => {
		const map = new Map<string, RoomWithConfig[]>();

		for (const r of $rooms) {
			const room: RoomWithConfig = {
				...r,
				config: null,
				status: $roomStatuses.get(r.id) ?? null,
				isOpen: $roomStatuses.get(r.id)?.is_open ?? false
			};
			if (!map.has(r.floor)) map.set(r.floor, []);
			map.get(r.floor)!.push(room);
		}

		return FLOOR_ORDER.filter((f) => map.has(f)).map((f) => ({
			id: f,
			label: FLOOR_LABELS[f] ?? f,
			rooms: map.get(f)!
		}));
	});
</script>

<div class="split-canvas">
	{#each floorGroups() as group (group.id)}
		<div class="floor-strip">
			<h3 class="strip-title">{group.label}</h3>
			<div class="strip-rooms">
				{#each group.rooms as room (room.id)}
					<div class="strip-slot">
						<RoomCard {room} onEdit={handleEditRoom} onSelect={() => {}} />
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if $rooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{/if}
</div>

<style>
	.split-canvas {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		height: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		gap: 8px;
		padding: 12px 16px;
		box-sizing: border-box;
		scroll-snap-type: x mandatory;
	}

	.floor-strip {
		flex-shrink: 0;
		width: 240px;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 10px 8px;
		gap: 8px;
		height: 100%;
		overflow-y: auto;
		box-sizing: border-box;
		scroll-snap-align: start;
	}

	.strip-title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 4px 0;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.strip-rooms {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	.strip-slot {
		height: 150px;
		flex-shrink: 0;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
	}

	.empty {
		color: rgba(255, 255, 255, 0.5);
		font-size: 16px;
		align-self: center;
		margin: auto;
	}
</style>
