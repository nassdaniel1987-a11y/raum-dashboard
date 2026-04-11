<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];
	const FLOOR_LABELS: Record<string, string> = {
		dach: 'Dach', og2: 'OG 2', og1: 'OG 1', eg: 'EG', essen: 'Essen', ug: 'UG', extern: 'Extern'
	};
	const FLOOR_COLORS: Record<string, string> = {
		dach: '#a78bfa', og2: '#60a5fa', og1: '#34d399',
		eg: '#fbbf24', essen: '#f87171', ug: '#94a3b8', extern: '#fb923c'
	};

	let allRooms = $derived(
		$rooms.map((r) => ({
			...r,
			config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		})) as RoomWithConfig[]
	);

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
				label: FLOOR_LABELS[f] ?? f,
				color: FLOOR_COLORS[f] ?? '#94a3b8',
				rooms: map.get(f)!,
				orbitIndex: i
			}));
	});

	// Continuous rotation — never pauses (iPad/TV passive display)
	let rotationY = $state(0);
	let animFrame: number;
	let lastTime = 0;

	function animate(ts: number) {
		const dt = lastTime ? ts - lastTime : 0;
		rotationY = (rotationY + dt * 0.010) % 360;
		lastTime = ts;
		animFrame = requestAnimationFrame(animate);
	}

	onMount(() => { animFrame = requestAnimationFrame(animate); });
	onDestroy(() => { cancelAnimationFrame(animFrame); });

	// Compute chip position on its orbit ring
	// Returns inline style string with transform + depth effects
	function chipStyle(orbitIndex: number, cardIndex: number, total: number): string {
		const baseRadius = 110 + orbitIndex * 100;
		// Stagger orbit speed slightly per ring for organic feel
		const speedOffset = orbitIndex * 15;
		const angle = ((cardIndex / total) * 360 + rotationY + speedOffset) * (Math.PI / 180);
		const x = Math.cos(angle) * baseRadius;
		const z = Math.sin(angle) * baseRadius;
		// Depth: items "behind" (z < 0) appear smaller and dimmer
		const depthFactor = (z + baseRadius) / (2 * baseRadius); // 0 = far, 1 = near
		const scale = 0.68 + depthFactor * 0.32;
		const yShift = (1 - depthFactor) * 28; // slight vertical parallax
		const brightness = 0.45 + depthFactor * 0.55;
		const zIndex = Math.round(depthFactor * 100 + orbitIndex);
		return `transform: translateX(${x}px) translateY(${yShift}px) scale(${scale}); filter: brightness(${brightness}); z-index: ${zIndex};`;
	}
</script>

<div class="solar-canvas" role="presentation">

	<!-- Starfield -->
	<div class="starfield" aria-hidden="true">
		{#each { length: 110 } as _, i}
			<div class="star" style="
				left: {(i * 131.17) % 100}%;
				top: {(i * 79.43) % 100}%;
				width: {1 + (i % 3)}px;
				height: {1 + (i % 3)}px;
				opacity: {0.12 + (i % 6) * 0.09};
				animation-delay: {(i * 0.37) % 5}s;
				animation-duration: {3 + (i % 4)}s;
			"></div>
		{/each}
	</div>

	<!-- Depth vignette -->
	<div class="depth-vignette" aria-hidden="true"></div>

	<div class="solar-system">

		<!-- Decorative orbit rings -->
		<div class="orbit-rings-wrap" aria-hidden="true">
			{#each floorGroups() as group, i}
				{@const r = 110 + i * 100}
				<div class="orbit-ring" style="
					width: {r * 2}px;
					height: {r * 0.52}px;
					border-color: {group.color}22;
				"></div>
			{/each}
		</div>

		<!-- Central sun -->
		<div class="sun-wrap" aria-hidden="true">
			<div class="sun-core"></div>
			<div class="sun-ray sun-ray-1"></div>
			<div class="sun-ray sun-ray-2"></div>
			<div class="sun-ray sun-ray-3"></div>
		</div>

		<!-- Room chips — always visible, all info shown, no interaction needed -->
		{#each floorGroups() as group}
			{#each group.rooms as room, ci}
				<div
					class="room-chip"
					class:chip-open={room.isOpen}
					style={chipStyle(group.orbitIndex, ci, group.rooms.length)}
					aria-label="{room.name}: {room.isOpen ? 'geöffnet' : 'geschlossen'}"
					role="img"
				>
					<!-- Top color bar = floor color -->
					<div class="chip-bar" style="background: {group.color};"></div>

					<div class="chip-body">
						<!-- Floor label -->
						<div class="chip-floor" style="color: {group.color};">{group.label}</div>
						<!-- Room name -->
						<div class="chip-name">{room.name}</div>
						<!-- Activity if set -->
						{#if room.config?.activity}
							<div class="chip-activity">{room.config.activity}</div>
						{/if}
						<!-- Person if set -->
						{#if room.person}
							<div class="chip-person">👤 {room.person.split(',')[0].trim()}</div>
						{/if}
						<!-- Status pill -->
						<div class="chip-status-pill" class:pill-open={room.isOpen}>
							<span class="pill-dot" style="background: {room.isOpen ? '#4ade80' : '#64748b'};"></span>
							{room.isOpen ? 'Geöffnet' : 'Geschlossen'}
						</div>
					</div>

					<!-- Pulse glow for open rooms -->
					{#if room.isOpen}
						<div class="open-glow" aria-hidden="true"></div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>

	<!-- Floor legend — always visible -->
	<div class="floor-legend">
		{#each floorGroups() as group}
			<div class="legend-row">
				<span class="legend-dot" style="background: {group.color}; box-shadow: 0 0 5px {group.color};"></span>
				<span class="legend-name">{group.label}</span>
				<span class="legend-ratio">
					<span class="ratio-open">{group.rooms.filter(r => r.isOpen).length}</span>
					<span class="ratio-sep">/</span>
					<span class="ratio-total">{group.rooms.length}</span>
				</span>
			</div>
		{/each}
	</div>

	<!-- Stats bar — always visible -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-num open-col">{allRooms.filter(r => r.isOpen).length}</span>
			<span class="stat-lbl">Offen</span>
		</div>
		<div class="stat-sep"></div>
		<div class="stat">
			<span class="stat-num closed-col">{allRooms.length - allRooms.filter(r => r.isOpen).length}</span>
			<span class="stat-lbl">Geschlossen</span>
		</div>
		<div class="stat-sep"></div>
		<div class="stat">
			<span class="stat-num accent-col">{allRooms.length}</span>
			<span class="stat-lbl">Räume</span>
		</div>
		<div class="stat-sep"></div>
		<div class="stat">
			<span class="stat-num floor-col">{floorGroups().length}</span>
			<span class="stat-lbl">Etagen</span>
		</div>
	</div>

	{#if allRooms.length === 0}
		<div class="empty-msg">Keine Räume vorhanden.</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');

	:root {
		--sol-bg: #03080f;
		--sol-text: rgba(210, 228, 245, 0.92);
		--sol-dim: rgba(120, 160, 190, 0.5);
		--sol-accent: #7dd3fc;
		--font-ui: 'Syne', sans-serif;
		--font-mono: 'DM Mono', monospace;
	}

	/* ── Canvas ── */
	.solar-canvas {
		width: 100%;
		height: 100%;
		background: var(--sol-bg);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-ui);
	}

	/* ── Starfield ── */
	.starfield {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.star {
		position: absolute;
		border-radius: 50%;
		background: #fff;
		animation: twinkle linear infinite;
	}

	@keyframes twinkle {
		0%, 100% { opacity: inherit; }
		50% { opacity: 0.03; }
	}

	/* ── Depth vignette ── */
	.depth-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		background: radial-gradient(ellipse 65% 65% at 50% 50%, transparent 25%, rgba(3, 8, 15, 0.55) 100%);
	}

	/* ── Solar system ── */
	.solar-system {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}

	/* ── Orbit rings ── */
	.orbit-rings-wrap {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.orbit-ring {
		position: absolute;
		border-radius: 50%;
		border: 1px dashed;
		pointer-events: none;
	}

	/* ── Sun ── */
	.sun-wrap {
		position: absolute;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 50;
	}

	.sun-core {
		position: absolute;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: radial-gradient(circle, #fff8c0 0%, #fcd34d 45%, #f97316 100%);
		box-shadow:
			0 0 10px #fcd34d,
			0 0 28px rgba(252, 211, 77, 0.45),
			0 0 70px rgba(249, 115, 22, 0.2);
		animation: sun-breathe 5s ease-in-out infinite;
	}

	.sun-ray {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(252, 211, 77, 0.22);
		animation: sun-ray-expand 5s ease-out infinite;
	}

	.sun-ray-1 { width: 44px; height: 44px; }
	.sun-ray-2 { width: 60px; height: 60px; animation-delay: 1.6s; }
	.sun-ray-3 { width: 80px; height: 80px; animation-delay: 3.2s; }

	@keyframes sun-breathe {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.15); }
	}

	@keyframes sun-ray-expand {
		0% { opacity: 0.5; transform: scale(0.85); }
		100% { opacity: 0; transform: scale(1.6); }
	}

	/* ── Room chips ── */
	.room-chip {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 138px;
		/* Offset so transform origin is chip center */
		margin-top: -44px;
		margin-left: -69px;
		background: rgba(6, 16, 32, 0.88);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(100, 160, 220, 0.15);
		border-radius: 10px;
		overflow: hidden;
		will-change: transform, filter;
		transition: border-color 0.4s;
	}

	.room-chip.chip-open {
		border-color: rgba(74, 222, 128, 0.25);
	}

	/* Top colored bar */
	.chip-bar {
		height: 3px;
		width: 100%;
	}

	.chip-body {
		padding: 8px 10px 10px;
	}

	.chip-floor {
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 2px;
		text-transform: uppercase;
		font-family: var(--font-mono);
		margin-bottom: 2px;
		line-height: 1;
	}

	.chip-name {
		font-size: 12px;
		font-weight: 700;
		color: rgba(220, 235, 252, 0.97);
		line-height: 1.25;
		margin-bottom: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip-activity {
		font-size: 9px;
		color: rgba(160, 200, 230, 0.7);
		line-height: 1.3;
		margin-bottom: 3px;
		font-family: var(--font-mono);
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}

	.chip-person {
		font-size: 9px;
		color: rgba(148, 163, 184, 0.7);
		font-family: var(--font-mono);
		margin-bottom: 5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Status pill */
	.chip-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 9px;
		font-family: var(--font-mono);
		letter-spacing: 0.3px;
		color: rgba(100, 130, 160, 0.8);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 20px;
		padding: 2px 7px 2px 5px;
	}

	.chip-status-pill.pill-open {
		color: rgba(134, 239, 172, 0.9);
		background: rgba(74, 222, 128, 0.07);
		border-color: rgba(74, 222, 128, 0.2);
	}

	.pill-dot {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Open rooms get a subtle green glow */
	.open-glow {
		position: absolute;
		inset: 0;
		border-radius: 10px;
		border: 1px solid rgba(74, 222, 128, 0.35);
		pointer-events: none;
		animation: open-pulse 3s ease-out infinite;
	}

	@keyframes open-pulse {
		0% { opacity: 0.6; }
		60% { opacity: 0.2; }
		100% { opacity: 0.6; }
	}

	/* ── Floor legend ── */
	.floor-legend {
		position: absolute;
		top: 18px;
		right: 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 30;
		background: rgba(3, 8, 15, 0.78);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(100, 160, 220, 0.1);
		border-radius: 10px;
		padding: 12px 16px;
		min-width: 120px;
	}

	.legend-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-name {
		font-size: 10px;
		font-family: var(--font-mono);
		color: var(--sol-text);
		flex: 1;
		letter-spacing: 0.3px;
	}

	.legend-ratio {
		font-size: 9px;
		font-family: var(--font-mono);
		display: flex;
		align-items: center;
		gap: 1px;
	}

	.ratio-open { color: #4ade80; }
	.ratio-sep { color: rgba(100, 160, 220, 0.3); margin: 0 1px; }
	.ratio-total { color: var(--sol-dim); }

	/* ── Stats bar ── */
	.stats-bar {
		position: absolute;
		bottom: 18px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		background: rgba(3, 8, 15, 0.82);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(100, 160, 220, 0.1);
		border-radius: 10px;
		padding: 10px 0;
		z-index: 30;
		white-space: nowrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 0 22px;
	}

	.stat-num {
		font-family: var(--font-ui);
		font-size: 24px;
		font-weight: 800;
		line-height: 1;
		color: var(--sol-text);
	}

	.open-col   { color: #4ade80; }
	.closed-col { color: #94a3b8; }
	.accent-col { color: var(--sol-accent); }
	.floor-col  { color: #fbbf24; }

	.stat-lbl {
		font-size: 8px;
		font-family: var(--font-mono);
		color: var(--sol-dim);
		letter-spacing: 1.5px;
		text-transform: uppercase;
	}

	.stat-sep {
		width: 1px;
		height: 36px;
		background: rgba(100, 160, 220, 0.1);
		flex-shrink: 0;
	}

	/* ── Empty ── */
	.empty-msg {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 13px;
		letter-spacing: 2px;
		color: var(--sol-dim);
		text-transform: uppercase;
		z-index: 30;
	}
</style>
