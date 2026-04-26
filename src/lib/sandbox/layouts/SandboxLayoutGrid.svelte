<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig, Room } from '$lib/types';

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

<div class="grid-canvas">
	{#each floorGroups() as group (group.id)}
		<div class="floor-section">
			<h3 class="floor-header">{group.label}</h3>
			<div class="grid-3col">
				{#each group.rooms as room (room.id)}
					<div class="grid-slot">
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
	.grid-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 16px 20px 32px;
		box-sizing: border-box;
	}

	.floor-section {
		margin-bottom: 24px;
	}

	.floor-header {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 10px 0;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.grid-3col {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	.grid-slot {
		min-height: 180px;
		position: relative;
		border-radius: 8px;
	}

	@media (max-width: 768px) {
		.grid-3col {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.grid-3col {
			grid-template-columns: 1fr;
		}
		.grid-slot {
			min-height: 120px;
			max-height: 160px;
		}
	}

	.empty {
		color: rgba(255, 255, 255, 0.5);
		font-size: 16px;
		text-align: center;
		margin-top: 60px;
	}
</style>
