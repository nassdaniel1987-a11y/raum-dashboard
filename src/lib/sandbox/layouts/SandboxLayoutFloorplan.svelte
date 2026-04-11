<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dachgeschoss', og2: '2. Obergeschoss', og1: '1. Obergeschoss',
		eg: 'Erdgeschoss', essen: 'Essensbereich', ug: 'Untergeschoss', extern: 'Extern'
	};
	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];

	let floorGroups = $derived(() => {
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
		return FLOOR_ORDER.filter(f => map.has(f)).map(f => {
			const floorRooms = map.get(f)!;
			// Normalisiere position_x auf 0-100% innerhalb der Etage
			const xs = floorRooms.map(r => r.position_x ?? 0);
			const minX = Math.min(...xs);
			const maxX = Math.max(...xs);
			const range = maxX - minX || 1;
			return {
				id: f, label: FLOOR_LABELS[f] ?? f,
				rooms: floorRooms.map(r => ({
					...r,
					relX: ((r.position_x ?? 0) - minX) / range
				}))
			};
		});
	});

	function statusColor(room: RoomWithConfig) {
		if (room.isOpen) return { bg: 'rgba(34,197,94,0.25)', border: '#22c55e' };
		return { bg: 'rgba(100,116,139,0.2)', border: '#64748b' };
	}
</script>

<div class="floorplan-canvas">
	{#each floorGroups() as group (group.id)}
		<div class="floor-block">
			<div class="floor-label">{group.label}</div>
			<div class="floor-inner">
				{#each group.rooms as room (room.id)}
					{@const col = statusColor(room)}
					<button
						class="room-box"
						style="
							left: calc({room.relX * 80}% + 5%);
							background: {col.bg};
							border-color: {col.border};
						"
						onclick={() => handleEditRoom(room)}
						title={room.name}
					>
						<span class="room-box-name">{room.name}</span>
						<span class="room-box-status">{room.isOpen ? '●' : '○'}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}

	{#if $rooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{/if}
</div>

<style>
	.floorplan-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 16px 24px 32px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.floor-block {
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.floor-label {
		background: rgba(255,255,255,0.05);
		padding: 6px 12px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: rgba(255,255,255,0.45);
		border-bottom: 1px solid rgba(255,255,255,0.07);
	}

	.floor-inner {
		position: relative;
		height: 72px;
		background: rgba(255,255,255,0.02);
	}

	.room-box {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 100px;
		height: 52px;
		border-radius: 6px;
		border: 1px solid;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		cursor: pointer;
		transition: filter 0.15s, transform 0.15s;
		padding: 4px;
	}

	.room-box:hover {
		filter: brightness(1.3);
		transform: translateY(-50%) scale(1.05);
		z-index: 2;
	}

	.room-box-name {
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		text-align: center;
		line-height: 1.2;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.room-box-status {
		font-size: 10px;
		color: rgba(255,255,255,0.5);
	}

	.empty {
		color: rgba(255,255,255,0.4);
		text-align: center;
		margin-top: 60px;
		font-size: 15px;
	}
</style>
