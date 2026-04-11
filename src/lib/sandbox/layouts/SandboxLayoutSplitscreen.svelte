<script lang="ts">
	import { fade } from 'svelte/transition';
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dach', og2: '2. OG', og1: '1. OG',
		eg: 'EG', essen: 'Essen', ug: 'UG', extern: 'Extern'
	};

	let allRooms = $derived(
		$rooms.map((r): RoomWithConfig => ({
			...r, config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		}))
	);

	let selectedId = $state<string | null>(null);

	let selectedRoom = $derived(() =>
		allRooms.find(r => r.id === selectedId) ?? allRooms[0] ?? null
	);
</script>

<div class="split-canvas">
	<!-- Liste links -->
	<div class="split-list">
		<div class="list-header">Räume</div>
		{#each allRooms as room (room.id)}
			<button
				class="list-item"
				class:selected={room.id === (selectedId ?? allRooms[0]?.id)}
				onclick={() => (selectedId = room.id)}
			>
				<span class="list-dot" class:open={room.isOpen}></span>
				<span class="list-name">{room.name}</span>
				<span class="list-floor">{FLOOR_LABELS[room.floor] ?? room.floor}</span>
			</button>
		{/each}
	</div>

	<!-- Detail rechts -->
	<div class="split-detail">
		{#if selectedRoom()}
			{#key selectedRoom()!.id}
				<div class="detail-card" in:fade={{ duration: 180 }}>
					<RoomCard room={selectedRoom()!} onEdit={handleEditRoom} onSelect={() => {}} />
				</div>
			{/key}
		{:else}
			<p class="empty">Keinen Raum ausgewählt.</p>
		{/if}
	</div>
</div>

<style>
	.split-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.split-list {
		width: 220px;
		flex-shrink: 0;
		height: 100%;
		overflow-y: auto;
		border-right: 1px solid rgba(255,255,255,0.08);
		background: rgba(0,0,0,0.2);
		display: flex;
		flex-direction: column;
	}

	.list-header {
		padding: 14px 14px 8px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(255,255,255,0.35);
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255,255,255,0.06);
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border: none;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		background: transparent;
		color: rgba(255,255,255,0.7);
		cursor: pointer;
		text-align: left;
		transition: background 0.12s;
		width: 100%;
	}

	.list-item:hover {
		background: rgba(255,255,255,0.05);
	}

	.list-item.selected {
		background: rgba(255,255,255,0.09);
		color: #fff;
	}

	.list-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #64748b;
		flex-shrink: 0;
	}

	.list-dot.open {
		background: #22c55e;
	}

	.list-name {
		flex: 1;
		font-size: 13px;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.list-floor {
		font-size: 10px;
		color: rgba(255,255,255,0.3);
		flex-shrink: 0;
	}

	.split-detail {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		overflow: hidden;
	}

	.detail-card {
		width: min(70vw, 580px);
		height: min(60vh, 440px);
		border-radius: 16px;
		overflow: hidden;
	}

	.empty {
		color: rgba(255,255,255,0.35);
		font-size: 15px;
	}
</style>
