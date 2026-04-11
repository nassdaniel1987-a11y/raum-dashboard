<script lang="ts">
	import { rooms, roomStatuses, currentTime } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const START_HOUR = 7;
	const END_HOUR = 18;
	const TOTAL_HOURS = END_HOUR - START_HOUR;
	const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

	function timeToPercent(time: string | null): number | null {
		if (!time) return null;
		const [h, m] = time.split(':').map(Number);
		const mins = (h - START_HOUR) * 60 + m;
		return Math.max(0, Math.min(100, (mins / (TOTAL_HOURS * 60)) * 100));
	}

	let nowPercent = $derived(() => {
		const t = $currentTime;
		const mins = (t.getHours() - START_HOUR) * 60 + t.getMinutes();
		return Math.max(0, Math.min(100, (mins / (TOTAL_HOURS * 60)) * 100));
	});

	let allRooms = $derived(
		$rooms.map((r) => ({
			...r,
			config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		})) as RoomWithConfig[]
	);
</script>

<div class="timeline-canvas">
	<div class="timeline-grid">
		<!-- Stunden-Header -->
		<div class="header-spacer"></div>
		<div class="hours-row">
			{#each HOURS as h}
				<div class="hour-tick">
					<span>{h}:00</span>
				</div>
			{/each}
		</div>

		<!-- Räume -->
		{#each allRooms as room (room.id)}
			<div class="room-label" title={room.name}>
				<span class="room-dot" class:open={room.isOpen}></span>
				{room.name}
			</div>
			<div class="room-track">
				<!-- Hintergrund-Streifen -->
				{#each HOURS.slice(0, -1) as _, i}
					<div class="track-segment" class:even={i % 2 === 0}></div>
				{/each}

				<!-- Jetzt-Linie -->
				<div class="now-line" style="left: {nowPercent()}%"></div>

				<!-- Balken (Platzhalter wenn kein config) -->
				<div
					class="time-bar"
					class:open={room.isOpen}
					style="left: 10%; width: 50%"
					title="{room.name}"
				></div>
			</div>
		{/each}
	</div>

	{#if allRooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{/if}
</div>

<style>
	.timeline-canvas {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 16px 20px;
		box-sizing: border-box;
	}

	.timeline-grid {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 0;
		min-width: 600px;
	}

	.header-spacer {
		height: 28px;
	}

	.hours-row {
		height: 28px;
		display: flex;
		position: relative;
	}

	.hour-tick {
		flex: 1;
		font-size: 10px;
		color: rgba(255,255,255,0.35);
		border-left: 1px solid rgba(255,255,255,0.08);
		padding-left: 4px;
		display: flex;
		align-items: center;
	}

	.room-label {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 40px;
		font-size: 12px;
		font-weight: 600;
		color: rgba(255,255,255,0.75);
		padding-right: 12px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-bottom: 1px solid rgba(255,255,255,0.04);
	}

	.room-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ef4444;
		flex-shrink: 0;
	}

	.room-dot.open {
		background: #22c55e;
	}

	.room-track {
		position: relative;
		height: 40px;
		display: flex;
		border-bottom: 1px solid rgba(255,255,255,0.04);
	}

	.track-segment {
		flex: 1;
		border-left: 1px solid rgba(255,255,255,0.06);
	}

	.track-segment.even {
		background: rgba(255,255,255,0.02);
	}

	.now-line {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #ef4444;
		opacity: 0.8;
		transform: translateX(-50%);
		z-index: 2;
		pointer-events: none;
	}

	.time-bar {
		position: absolute;
		top: 8px;
		bottom: 8px;
		border-radius: 4px;
		background: rgba(100, 116, 139, 0.5);
		z-index: 1;
		transition: background 0.2s;
	}

	.time-bar.open {
		background: rgba(34, 197, 94, 0.55);
	}

	.empty {
		color: rgba(255,255,255,0.4);
		text-align: center;
		margin-top: 60px;
		font-size: 15px;
	}
</style>
