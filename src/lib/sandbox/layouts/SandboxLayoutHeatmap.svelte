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
		return FLOOR_ORDER.filter(f => map.has(f)).map(f => ({
			id: f, label: FLOOR_LABELS[f] ?? f, rooms: map.get(f)!
		}));
	});

	function statusColor(room: RoomWithConfig): string {
		if (room.isOpen) return '#22c55e';
		return '#64748b';
	}

	function statusLabel(room: RoomWithConfig): string {
		return room.isOpen ? 'Offen' : 'Geschlossen';
	}
</script>

<div class="heatmap-canvas">
	{#each floorGroups() as group (group.id)}
		<div class="floor-section">
			<h3 class="floor-header">{group.label}</h3>
			<div class="heatmap-row">
				{#each group.rooms as room (room.id)}
					<button
						class="heat-cell"
						style="background: {statusColor(room)}22; border-color: {statusColor(room)}66;"
						onclick={() => handleEditRoom(room)}
						title="{room.name} — {statusLabel(room)}"
					>
						<div class="heat-dot" style="background: {statusColor(room)}"></div>
						<span class="heat-name">{room.name}</span>
						<span class="heat-status">{statusLabel(room)}</span>
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
	.heatmap-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 16px 20px 32px;
		box-sizing: border-box;
	}

	.floor-section {
		margin-bottom: 20px;
	}

	.floor-header {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.3px;
		text-transform: uppercase;
		color: rgba(255,255,255,0.4);
		margin: 0 0 8px 0;
		padding-bottom: 5px;
		border-bottom: 1px solid rgba(255,255,255,0.07);
	}

	.heatmap-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.heat-cell {
		width: 100px;
		height: 88px;
		border-radius: 10px;
		border: 1px solid;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5px;
		cursor: pointer;
		transition: transform 0.15s, filter 0.15s;
		padding: 8px;
	}

	.heat-cell:hover {
		transform: scale(1.06);
		filter: brightness(1.2);
	}

	.heat-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.heat-name {
		font-size: 11px;
		font-weight: 700;
		color: #fff;
		text-align: center;
		line-height: 1.2;
		word-break: break-word;
	}

	.heat-status {
		font-size: 9px;
		color: rgba(255,255,255,0.5);
		text-transform: uppercase;
		letter-spacing: 0.8px;
	}

	.empty {
		color: rgba(255,255,255,0.4);
		text-align: center;
		margin-top: 60px;
		font-size: 15px;
	}
</style>
