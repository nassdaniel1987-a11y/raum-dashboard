<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['eg', 'og1', 'og2', 'dach', 'ug', 'essen', 'extern'];
	const FLOOR_LABELS: Record<string, string> = {
		eg: 'EG', og1: 'OG1', og2: 'OG2', dach: 'DACH', ug: 'UG', essen: 'ESSEN', extern: 'EXT'
	};

	// Orbital radii for each floor tier (px, relative to center)
	const ORBIT_RADII = [90, 155, 215, 270, 320, 365, 405];

	let allRooms = $derived(
		$rooms.map((r) => ({
			...r,
			config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		})) as RoomWithConfig[]
	);

	// Group by floor in order
	let floorGroups = $derived(() => {
		const map = new Map<string, RoomWithConfig[]>();
		for (const r of allRooms) {
			if (!map.has(r.floor)) map.set(r.floor, []);
			map.get(r.floor)!.push(r);
		}
		return FLOOR_ORDER
			.filter(f => map.has(f))
			.map((f, i) => ({
				floor: f,
				label: FLOOR_LABELS[f] ?? f.toUpperCase(),
				rooms: map.get(f)!,
				radius: ORBIT_RADII[i] ?? ORBIT_RADII[ORBIT_RADII.length - 1]
			}));
	});

	// Place rooms evenly around their orbit
	function nodePosition(index: number, total: number, radius: number): { x: number; y: number } {
		const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
		return {
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
		};
	}

	let hoveredRoom = $state<string | null>(null);
	let selectedRoom = $state<RoomWithConfig | null>(null);

	function selectRoom(room: RoomWithConfig) {
		selectedRoom = selectedRoom?.id === room.id ? null : room;
	}
</script>

<div class="orbital-canvas">
	<!-- Starfield background -->
	<div class="starfield" aria-hidden="true">
		{#each { length: 80 } as _, i}
			<div
				class="star"
				style="
					left: {(i * 137.508) % 100}%;
					top: {(i * 97.3) % 100}%;
					width: {(i % 3) + 1}px;
					height: {(i % 3) + 1}px;
					animation-delay: {(i * 0.23) % 4}s;
					opacity: {0.2 + (i % 5) * 0.12};
				"
			></div>
		{/each}
	</div>

	<div class="orbital-system">
		<!-- SVG for orbits and connection lines -->
		<svg class="orbital-svg" viewBox="-450 -450 900 900" xmlns="http://www.w3.org/2000/svg">
			<!-- Orbit rings -->
			{#each floorGroups() as group}
				<circle
					class="orbit-ring"
					cx="0"
					cy="0"
					r={group.radius}
				/>
				<!-- Floor label on ring -->
				<text
					class="orbit-label"
					x={group.radius + 6}
					y="4"
				>{group.label}</text>
			{/each}

			<!-- Connection lines from center to open rooms -->
			{#each floorGroups() as group}
				{#each group.rooms as room, i}
					{@const pos = nodePosition(i, group.rooms.length, group.radius)}
					{#if room.isOpen}
						<line
							class="spoke open"
							x1="0" y1="0"
							x2={pos.x} y2={pos.y}
						/>
					{/if}
				{/each}
			{/each}
		</svg>

		<!-- Central nucleus -->
		<div class="nucleus" aria-hidden="true">
			<div class="nucleus-core"></div>
			<div class="nucleus-ring"></div>
			<div class="nucleus-ring nucleus-ring-2"></div>
		</div>

		<!-- Room nodes -->
		{#each floorGroups() as group}
			{#each group.rooms as room, i}
				{@const pos = nodePosition(i, group.rooms.length, group.radius)}
				<button
					class="room-node"
					class:open={room.isOpen}
					class:hovered={hoveredRoom === room.id}
					class:selected={selectedRoom?.id === room.id}
					style="transform: translate(calc(-50% + {pos.x}px), calc(-50% + {pos.y}px));"
					onmouseenter={() => (hoveredRoom = room.id)}
					onmouseleave={() => (hoveredRoom = null)}
					onclick={() => selectRoom(room)}
					aria-label="{room.name} — {room.isOpen ? 'geöffnet' : 'geschlossen'}"
				>
					<span class="node-pip"></span>
					{#if room.isOpen}
						<span class="node-pulse" aria-hidden="true"></span>
					{/if}
				</button>
			{/each}
		{/each}
	</div>

	<!-- Tooltip / Detail panel -->
	{#if selectedRoom}
		<div class="detail-panel" role="dialog" aria-label="Raumdetails">
			<div class="detail-header">
				<span class="detail-status-dot" class:open={selectedRoom.isOpen}></span>
				<span class="detail-floor">{FLOOR_LABELS[selectedRoom.floor] ?? selectedRoom.floor}</span>
			</div>
			<h2 class="detail-name">{selectedRoom.name}</h2>
			<div class="detail-badge" class:open={selectedRoom.isOpen}>
				{selectedRoom.isOpen ? 'GEÖFFNET' : 'GESCHLOSSEN'}
			</div>
			<div class="detail-actions">
				<button class="detail-edit-btn" onclick={() => { handleEditRoom(selectedRoom!); selectedRoom = null; }}>
					Bearbeiten
				</button>
				<button class="detail-close-btn" onclick={() => (selectedRoom = null)}>✕</button>
			</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="legend">
		<span class="legend-item open"><span class="legend-pip"></span>Geöffnet</span>
		<span class="legend-item closed"><span class="legend-pip"></span>Geschlossen</span>
	</div>

	<!-- Stats bar -->
	<div class="stats-bar">
		<span class="stat">
			<span class="stat-val">{allRooms.filter(r => r.isOpen).length}</span>
			<span class="stat-label">OFFEN</span>
		</span>
		<span class="stat-sep">/</span>
		<span class="stat">
			<span class="stat-val">{allRooms.length}</span>
			<span class="stat-label">GESAMT</span>
		</span>
		<span class="stat">
			<span class="stat-val">{floorGroups().length}</span>
			<span class="stat-label">ETAGEN</span>
		</span>
	</div>

	{#if allRooms.length === 0}
		<div class="empty">Keine Räume vorhanden.</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Orbitron:wght@400;700;900&display=swap');

	/* ── Tokens ── */
	:root {
		--orb-open: #00ffc8;
		--orb-open-glow: rgba(0, 255, 200, 0.35);
		--orb-closed: #3a4a5c;
		--orb-closed-dim: rgba(58, 74, 92, 0.6);
		--orb-ring: rgba(100, 160, 220, 0.12);
		--orb-ring-hover: rgba(100, 160, 220, 0.28);
		--orb-bg: #020c18;
		--orb-text: rgba(160, 200, 230, 0.85);
		--orb-text-dim: rgba(100, 140, 170, 0.5);
		--orb-accent: #4fc3f7;
		--font-display: 'Orbitron', sans-serif;
		--font-mono: 'DM Mono', monospace;
	}

	/* ── Canvas ── */
	.orbital-canvas {
		width: 100%;
		height: 100%;
		background: var(--orb-bg);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
	}

	/* ── Starfield ── */
	.starfield {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.star {
		position: absolute;
		border-radius: 50%;
		background: white;
		animation: star-twinkle 4s ease-in-out infinite;
	}

	@keyframes star-twinkle {
		0%, 100% { opacity: inherit; transform: scale(1); }
		50% { opacity: 0.05; transform: scale(0.5); }
	}

	/* ── Orbital System ── */
	.orbital-system {
		position: relative;
		width: min(90vmin, 860px);
		height: min(90vmin, 860px);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* ── SVG Rings ── */
	.orbital-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.orbit-ring {
		fill: none;
		stroke: var(--orb-ring);
		stroke-width: 1;
		stroke-dasharray: 4 6;
		animation: ring-rotate 60s linear infinite;
		transform-origin: 0 0;
	}

	@keyframes ring-rotate {
		from { stroke-dashoffset: 0; }
		to { stroke-dashoffset: -100; }
	}

	.orbit-label {
		fill: var(--orb-text-dim);
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 1.5px;
		dominant-baseline: middle;
	}

	.spoke {
		stroke: none;
	}

	.spoke.open {
		stroke: var(--orb-open);
		stroke-width: 0.5;
		opacity: 0.25;
		stroke-dasharray: 3 5;
	}

	/* ── Nucleus ── */
	.nucleus {
		position: absolute;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.nucleus-core {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--orb-accent);
		box-shadow:
			0 0 8px var(--orb-accent),
			0 0 24px rgba(79, 195, 247, 0.4),
			0 0 60px rgba(79, 195, 247, 0.15);
		animation: nucleus-pulse 3s ease-in-out infinite;
	}

	.nucleus-ring {
		position: absolute;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 1px solid rgba(79, 195, 247, 0.25);
		animation: nucleus-expand 3s ease-out infinite;
	}

	.nucleus-ring-2 {
		animation-delay: 1.5s;
	}

	@keyframes nucleus-pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.3); }
	}

	@keyframes nucleus-expand {
		0% { transform: scale(1); opacity: 0.5; }
		100% { transform: scale(3.5); opacity: 0; }
	}

	/* ── Room Nodes ── */
	.room-node {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s;
	}

	.room-node:hover,
	.room-node.hovered {
		transform: translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) scale(1.8) !important;
	}

	.node-pip {
		display: block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--orb-closed);
		border: 1px solid rgba(100, 140, 170, 0.3);
		transition: background 0.3s, box-shadow 0.3s;
		position: relative;
		z-index: 2;
	}

	.room-node.open .node-pip {
		background: var(--orb-open);
		border-color: var(--orb-open);
		box-shadow:
			0 0 6px var(--orb-open),
			0 0 18px var(--orb-open-glow);
	}

	.room-node.selected .node-pip {
		border: 2px solid white;
		box-shadow:
			0 0 0 3px rgba(255,255,255,0.15),
			0 0 12px var(--orb-open);
	}

	/* Pulse ring for open rooms */
	.node-pulse {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 1px solid var(--orb-open);
		opacity: 0;
		animation: node-pulse-anim 2.5s ease-out infinite;
		pointer-events: none;
	}

	@keyframes node-pulse-anim {
		0% { opacity: 0.6; transform: scale(0.8); }
		100% { opacity: 0; transform: scale(2.5); }
	}

	/* ── Detail Panel ── */
	.detail-panel {
		position: absolute;
		bottom: 60px;
		right: 24px;
		background: rgba(2, 12, 24, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(79, 195, 247, 0.2);
		border-radius: 4px;
		padding: 16px 20px;
		min-width: 200px;
		max-width: 260px;
		box-shadow:
			0 0 40px rgba(79, 195, 247, 0.06),
			0 16px 40px rgba(0, 0, 0, 0.7);
		animation: panel-in 0.18s ease-out;
	}

	@keyframes panel-in {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.detail-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
	}

	.detail-status-dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--orb-closed);
		flex-shrink: 0;
	}

	.detail-status-dot.open {
		background: var(--orb-open);
		box-shadow: 0 0 6px var(--orb-open);
	}

	.detail-floor {
		font-size: 9px;
		letter-spacing: 2px;
		color: var(--orb-text-dim);
		text-transform: uppercase;
	}

	.detail-name {
		font-family: var(--font-display);
		font-size: 15px;
		font-weight: 700;
		color: white;
		margin: 0 0 10px;
		line-height: 1.3;
		word-break: break-word;
	}

	.detail-badge {
		display: inline-block;
		font-size: 9px;
		letter-spacing: 2px;
		padding: 3px 8px;
		border-radius: 2px;
		background: rgba(58, 74, 92, 0.4);
		color: var(--orb-text-dim);
		margin-bottom: 14px;
		border: 1px solid rgba(58, 74, 92, 0.5);
	}

	.detail-badge.open {
		background: rgba(0, 255, 200, 0.1);
		color: var(--orb-open);
		border-color: rgba(0, 255, 200, 0.3);
		text-shadow: 0 0 8px rgba(0, 255, 200, 0.4);
	}

	.detail-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.detail-edit-btn {
		flex: 1;
		padding: 7px 12px;
		border-radius: 3px;
		border: 1px solid rgba(79, 195, 247, 0.3);
		background: rgba(79, 195, 247, 0.08);
		color: var(--orb-accent);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 1px;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.detail-edit-btn:hover {
		background: rgba(79, 195, 247, 0.16);
		border-color: rgba(79, 195, 247, 0.5);
	}

	.detail-close-btn {
		width: 30px;
		height: 30px;
		border-radius: 3px;
		border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04);
		color: var(--orb-text-dim);
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.detail-close-btn:hover {
		background: rgba(255,255,255,0.1);
		color: white;
	}

	/* ── Legend ── */
	.legend {
		position: absolute;
		top: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--orb-text-dim);
	}

	.legend-pip {
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--orb-closed);
		flex-shrink: 0;
	}

	.legend-item.open .legend-pip {
		background: var(--orb-open);
		box-shadow: 0 0 5px var(--orb-open);
	}

	/* ── Stats Bar ── */
	.stats-bar {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 20px;
		background: rgba(2, 12, 24, 0.7);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(79, 195, 247, 0.12);
		border-radius: 4px;
		padding: 8px 20px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.stat-val {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		color: var(--orb-accent);
		line-height: 1;
	}

	.stat-label {
		font-size: 7px;
		letter-spacing: 2px;
		color: var(--orb-text-dim);
		text-transform: uppercase;
	}

	.stat-sep {
		color: rgba(79, 195, 247, 0.2);
		font-size: 18px;
	}

	/* ── Empty ── */
	.empty {
		position: absolute;
		color: var(--orb-text-dim);
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}

	/* ── Responsive ── */
	@media (max-width: 600px) {
		.orbital-system {
			width: 95vmin;
			height: 95vmin;
		}

		.detail-panel {
			bottom: 70px;
			right: 8px;
			left: 8px;
			max-width: none;
		}

		.stats-bar {
			gap: 14px;
			padding: 6px 14px;
		}
	}
</style>
