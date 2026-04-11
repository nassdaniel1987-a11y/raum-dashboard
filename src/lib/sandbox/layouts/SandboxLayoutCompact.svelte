<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dachgeschoss',
		og2: '2. OG',
		og1: '1. OG',
		eg: 'Erdgeschoss',
		essen: 'Essen',
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

<div class="compact-canvas">
	{#each floorGroups() as group (group.id)}
		<div class="floor-section">
			<h3 class="floor-header">{group.label}</h3>
			<div class="grid-4col">
				{#each group.rooms as room (room.id)}
					<div class="compact-slot">
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
	.compact-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 12px 16px 24px;
		box-sizing: border-box;
	}

	.floor-section {
		margin-bottom: 16px;
	}

	.floor-header {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.45);
		margin: 0 0 8px 0;
		padding-bottom: 4px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.grid-4col {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.compact-slot {
		height: 120px;
		overflow: hidden;
		position: relative;
		border-radius: 6px;
		/* Badges die rausstehen abschneiden */
	}

	@media (max-width: 900px) {
		.grid-4col {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 600px) {
		.grid-4col {
			grid-template-columns: repeat(2, 1fr);
		}
		.compact-slot {
			height: 100px;
		}
	}

	.empty {
		color: rgba(255, 255, 255, 0.5);
		font-size: 16px;
		text-align: center;
		margin-top: 60px;
	}
</style>
