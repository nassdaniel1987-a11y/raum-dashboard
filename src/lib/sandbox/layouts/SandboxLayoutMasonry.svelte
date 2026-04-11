<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	let sortedRooms = $derived(() => {
		const all = $rooms.map((r): RoomWithConfig => ({
			...r, config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		}));
		// Offene Räume zuerst
		return [...all.filter(r => r.isOpen), ...all.filter(r => !r.isOpen)];
	});
</script>

<div class="masonry-canvas">
	<div class="masonry-columns">
		{#each sortedRooms() as room (room.id)}
			<div class="masonry-item" class:open={room.isOpen}>
				<RoomCard {room} onEdit={handleEditRoom} onSelect={() => {}} />
			</div>
		{/each}
	</div>

	{#if $rooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{/if}
</div>

<style>
	.masonry-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 16px 20px 32px;
		box-sizing: border-box;
	}

	.masonry-columns {
		column-count: 3;
		column-gap: 12px;
	}

	.masonry-item {
		break-inside: avoid;
		margin-bottom: 12px;
		border-radius: 10px;
		overflow: hidden;
		min-height: 130px;
	}

	.masonry-item.open {
		min-height: 220px;
	}

	@media (max-width: 768px) {
		.masonry-columns {
			column-count: 2;
		}
	}

	@media (max-width: 480px) {
		.masonry-columns {
			column-count: 1;
		}
	}

	.empty {
		color: rgba(255,255,255,0.4);
		text-align: center;
		margin-top: 60px;
		font-size: 15px;
	}
</style>
