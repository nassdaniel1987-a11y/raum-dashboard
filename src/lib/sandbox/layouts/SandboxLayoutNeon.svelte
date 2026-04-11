<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];
	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dachgeschoss', og2: '2. Obergeschoss', og1: '1. Obergeschoss',
		eg: 'Erdgeschoss', essen: 'Essensbereich', ug: 'Untergeschoss', extern: 'Extern'
	};

	let pages = $derived(() => {
		const map = new Map<string, RoomWithConfig[]>();
		for (const r of $rooms) {
			const room: RoomWithConfig = {
				...r, config: null,
				status: $roomStatuses.get(r.id) ?? null,
				isOpen: $roomStatuses.get(r.id)?.is_open ?? false
			};
			if (!map.has(r.floor)) map.set(r.floor, []);
			map.get(r.floor)!.push(room);
		}
		// Seiten à 4 Räume, geordnet nach Etage
		const allRooms: RoomWithConfig[] = FLOOR_ORDER
			.filter(f => map.has(f))
			.flatMap(f => map.get(f)!);

		const result: RoomWithConfig[][] = [];
		for (let i = 0; i < allRooms.length; i += 4) {
			result.push(allRooms.slice(i, i + 4));
		}
		return result;
	});

	let currentPage = $state(0);

	function neonColor(room: RoomWithConfig): string {
		if (room.isOpen) return '#22c55e';
		return '#ef4444';
	}

	function neonShadow(room: RoomWithConfig): string {
		const c = neonColor(room);
		return `0 0 12px ${c}, 0 0 40px ${c}55, 0 0 80px ${c}22`;
	}
</script>

<div class="neon-canvas">
	{#if pages().length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{:else}
		<div class="neon-page">
			{#each pages()[currentPage] as room (room.id)}
				<div
					class="neon-slot"
					style="box-shadow: {neonShadow(room)}; border-color: {neonColor(room)}88;"
				>
					<RoomCard {room} onEdit={handleEditRoom} onSelect={() => {}} />
				</div>
			{/each}
		</div>

		{#if pages().length > 1}
			<div class="neon-nav">
				{#each pages() as _, i}
					<button
						class="neon-dot"
						class:active={i === currentPage}
						onclick={() => (currentPage = i)}
						style={i === currentPage ? `box-shadow: 0 0 8px #f59e0b; background: #f59e0b;` : ''}
					></button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.neon-canvas {
		width: 100%;
		height: 100%;
		background: #07070f;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		overflow: hidden;
	}

	.neon-page {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 20px;
		width: min(90vw, 860px);
		height: min(75vh, 580px);
	}

	.neon-slot {
		border-radius: 14px;
		border: 1px solid;
		overflow: hidden;
		transition: box-shadow 0.4s ease;
		animation: neon-pulse 3s ease-in-out infinite;
	}

	@keyframes neon-pulse {
		0%, 100% { filter: brightness(1); }
		50% { filter: brightness(1.1); }
	}

	.neon-nav {
		display: flex;
		gap: 10px;
	}

	.neon-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: none;
		background: rgba(255,255,255,0.2);
		cursor: pointer;
		transition: background 0.2s, box-shadow 0.2s;
		padding: 0;
	}

	.neon-dot.active {
		background: #f59e0b;
	}

	.empty {
		color: rgba(255,255,255,0.3);
		font-size: 15px;
	}
</style>
