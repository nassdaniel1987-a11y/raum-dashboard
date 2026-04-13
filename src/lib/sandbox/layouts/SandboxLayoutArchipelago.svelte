<script lang="ts">
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];

	const FLOOR_META: Record<string, { label: string; depth: number; color: string; waterColor: string; terrain: string }> = {
		dach:   { label: 'Dachgeschoss', depth: 0, color: '#e2c97e', waterColor: 'transparent', terrain: 'peak' },
		og2:    { label: 'Obergeschoss 2', depth: 1, color: '#b8d4a8', waterColor: 'transparent', terrain: 'highland' },
		og1:    { label: 'Obergeschoss 1', depth: 2, color: '#8fbfa0', waterColor: 'transparent', terrain: 'midland' },
		eg:     { label: 'Erdgeschoss', depth: 3, color: '#7ab89a', waterColor: 'transparent', terrain: 'lowland' },
		essen:  { label: 'Essbereich', depth: 4, color: '#5f9e88', waterColor: 'rgba(64,146,174,0.18)', terrain: 'coast' },
		ug:     { label: 'Untergeschoss', depth: 5, color: '#4a8070', waterColor: 'rgba(40,110,145,0.32)', terrain: 'shallow' },
		extern: { label: 'Außenbereich', depth: 6, color: '#a0b8a8', waterColor: 'rgba(30,90,120,0.08)', terrain: 'island' }
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
			.map(f => ({
				floor: f,
				meta: FLOOR_META[f] ?? { label: f, depth: 3, color: '#7ab89a', waterColor: 'transparent', terrain: 'midland' },
				rooms: map.get(f)!
			}));
	});

	let openCount = $derived(allRooms.filter(r => r.isOpen).length);
	let totalCount = $derived(allRooms.length);
</script>

<div class="archipelago" role="presentation">

	<!-- Ambient water background -->
	<div class="ocean-bg" aria-hidden="true">
		<div class="ocean-wave wave-1"></div>
		<div class="ocean-wave wave-2"></div>
		<div class="ocean-wave wave-3"></div>
		<div class="caustics"></div>
	</div>

	<!-- Depth grid lines -->
	<div class="depth-grid" aria-hidden="true"></div>

	<!-- Stats header -->
	<header class="archi-header">
		<div class="header-brand">
			<span class="brand-icon">⬡</span>
			<span class="brand-name">Raumübersicht</span>
		</div>
		<div class="header-stats">
			<span class="stat-pill open">
				<span class="stat-dot"></span>
				{openCount} offen
			</span>
			<span class="stat-divider">·</span>
			<span class="stat-pill closed">
				{totalCount - openCount} geschlossen
			</span>
			<span class="stat-divider">·</span>
			<span class="stat-pill total">
				{totalCount} gesamt
			</span>
		</div>
	</header>

	<!-- Archipelago layers — one per floor -->
	<div class="layers-scroll">
		<div class="layers-inner">
			{#each floorGroups() as group, gi}
				{@const isLast = gi === floorGroups().length - 1}
				<section
					class="layer layer--{group.meta.terrain}"
					style="--layer-color: {group.meta.color}; --water-color: {group.meta.waterColor};"
					aria-label={group.meta.label}
				>
					<!-- Terrain edge -->
					<div class="terrain-edge" aria-hidden="true">
						<div class="terrain-label">
							<span class="terrain-depth">{'▲'.repeat(Math.max(1, FLOOR_ORDER.length - group.meta.depth))}</span>
							<span class="terrain-name">{group.meta.label}</span>
							<span class="terrain-count">
								{group.rooms.filter(r => r.isOpen).length}/{group.rooms.length}
							</span>
						</div>
						<div class="terrain-contour"></div>
					</div>

					<!-- Room cards row -->
					<div class="room-row">
						{#each group.rooms as room, ri}
							<button
								class="room-card"
								class:room-card--open={room.isOpen}
								class:room-card--closed={!room.isOpen}
								style="--card-color: {room.background_color}; animation-delay: {gi * 0.08 + ri * 0.05}s;"
								onclick={() => handleEditRoom(room)}
								aria-label="{room.name}: {room.isOpen ? 'geöffnet' : 'geschlossen'}"
							>
								<!-- Status indicator bar -->
								<div class="card-status-bar"></div>

								<div class="card-inner">
									<div class="card-name">{room.name}</div>

									{#if room.config?.activity}
										<div class="card-activity">{room.config.activity}</div>
									{/if}

									{#if room.person}
										<div class="card-person">
											<span class="person-dot">◉</span>
											{room.person.split(',')[0].trim()}
										</div>
									{/if}

									{#if room.config?.open_time}
										<div class="card-time">
											{room.config.open_time}{room.config.close_time ? ' – ' + room.config.close_time : ''}
										</div>
									{/if}

									<div class="card-badge" class:badge-open={room.isOpen} class:badge-closed={!room.isOpen}>
										{room.isOpen ? 'OFFEN' : 'ZU'}
									</div>
								</div>

								<!-- Elevation shadow -->
								<div class="card-shadow" aria-hidden="true"></div>

								<!-- Open room pulse -->
								{#if room.isOpen}
									<div class="open-beacon" aria-hidden="true">
										<div class="beacon-ring beacon-ring-1"></div>
										<div class="beacon-ring beacon-ring-2"></div>
									</div>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Water fill for deep floors -->
					{#if group.meta.waterColor !== 'transparent'}
						<div class="water-fill" aria-hidden="true" style="background: {group.meta.waterColor};"></div>
					{/if}
				</section>

				{#if !isLast}
					<div class="layer-separator" aria-hidden="true">
						<div class="separator-line"></div>
					</div>
				{/if}
			{/each}

			{#if floorGroups().length === 0}
				<div class="empty-state">
					<span class="empty-icon">⬡</span>
					<span class="empty-text">Keine Räume vorhanden</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Compass rose decoration -->
	<div class="compass" aria-hidden="true">
		<div class="compass-needle north">N</div>
		<div class="compass-needle east">O</div>
		<div class="compass-circle"></div>
	</div>

</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inconsolata:wght@400;500;700&display=swap');

	/* ── Tokens ── */
	:root {
		--arch-bg: #0e1a14;
		--arch-ocean: #0a1520;
		--arch-paper: rgba(240, 235, 215, 0.06);
		--arch-gold: #c8a84b;
		--arch-green-light: #a8d4a0;
		--arch-text: rgba(220, 235, 210, 0.92);
		--arch-text-dim: rgba(160, 190, 155, 0.55);
		--arch-open: #6fdf8a;
		--arch-closed: #6b8a7a;
		--arch-border: rgba(180, 210, 160, 0.12);
		--font-display: 'Playfair Display', Georgia, serif;
		--font-mono: 'Inconsolata', 'Courier New', monospace;
	}

	/* ── Root ── */
	.archipelago {
		width: 100%;
		height: 100%;
		background: var(--arch-bg);
		background-image:
			radial-gradient(ellipse 80% 60% at 20% 10%, rgba(40, 80, 50, 0.25) 0%, transparent 60%),
			radial-gradient(ellipse 60% 80% at 80% 90%, rgba(10, 40, 60, 0.35) 0%, transparent 60%);
		position: relative;
		overflow: hidden;
		font-family: var(--font-mono);
		display: flex;
		flex-direction: column;
	}

	/* ── Ocean background ── */
	.ocean-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		overflow: hidden;
	}

	.ocean-wave {
		position: absolute;
		width: 200%;
		height: 200%;
		border-radius: 43%;
		background: rgba(20, 60, 90, 0.06);
		animation: wave-drift linear infinite;
	}

	.wave-1 { top: 60%; left: -50%; animation-duration: 28s; }
	.wave-2 { top: 70%; left: -60%; animation-duration: 38s; animation-delay: -12s; opacity: 0.6; }
	.wave-3 { top: 80%; left: -40%; animation-duration: 50s; animation-delay: -25s; opacity: 0.4; }

	@keyframes wave-drift {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.caustics {
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(ellipse 3px 5px at 15% 75%, rgba(100, 200, 160, 0.08) 0%, transparent 100%),
			radial-gradient(ellipse 4px 3px at 45% 85%, rgba(100, 200, 160, 0.06) 0%, transparent 100%),
			radial-gradient(ellipse 5px 3px at 75% 70%, rgba(100, 200, 160, 0.07) 0%, transparent 100%),
			radial-gradient(ellipse 3px 6px at 85% 90%, rgba(100, 200, 160, 0.05) 0%, transparent 100%);
		animation: caustic-shift 8s ease-in-out infinite alternate;
	}

	@keyframes caustic-shift {
		0% { opacity: 0.6; transform: translateY(0); }
		100% { opacity: 1; transform: translateY(-4px); }
	}

	/* ── Depth grid ── */
	.depth-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background-image:
			linear-gradient(rgba(140, 200, 140, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(140, 200, 140, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
	}

	/* ── Header ── */
	.archi-header {
		position: relative;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 24px 12px;
		border-bottom: 1px solid var(--arch-border);
		background: rgba(10, 20, 14, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		flex-shrink: 0;
	}

	.header-brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brand-icon {
		font-size: 20px;
		color: var(--arch-gold);
		line-height: 1;
		filter: drop-shadow(0 0 6px rgba(200, 168, 75, 0.4));
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		color: var(--arch-text);
		letter-spacing: 0.5px;
	}

	.header-stats {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.stat-pill {
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.3px;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.stat-pill.open { color: var(--arch-open); }
	.stat-pill.closed { color: var(--arch-closed); }
	.stat-pill.total { color: var(--arch-text-dim); }

	.stat-dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--arch-open);
		box-shadow: 0 0 6px var(--arch-open);
		animation: beacon-pulse 2.5s ease-in-out infinite;
	}

	@keyframes beacon-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.stat-divider {
		color: var(--arch-border);
		font-size: 14px;
	}

	/* ── Layers scroll ── */
	.layers-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		z-index: 10;
		scrollbar-width: thin;
		scrollbar-color: rgba(140, 200, 140, 0.15) transparent;
	}

	.layers-inner {
		padding: 16px 24px 24px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* ── Floor layer ── */
	.layer {
		position: relative;
		padding: 0 0 20px;
		animation: layer-reveal 0.5s ease-out both;
	}

	@keyframes layer-reveal {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Terrain edge — the "contour line" header of each floor */
	.terrain-edge {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.terrain-label {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex-shrink: 0;
	}

	.terrain-depth {
		font-size: 8px;
		color: var(--layer-color, var(--arch-green-light));
		letter-spacing: 1px;
		opacity: 0.7;
	}

	.terrain-name {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 13px;
		color: var(--layer-color, var(--arch-green-light));
		white-space: nowrap;
	}

	.terrain-count {
		font-size: 10px;
		color: var(--arch-text-dim);
		font-family: var(--font-mono);
	}

	.terrain-contour {
		flex: 1;
		height: 1px;
		background: linear-gradient(
			to right,
			var(--layer-color, var(--arch-green-light)),
			transparent
		);
		opacity: 0.25;
	}

	/* ── Room row ── */
	.room-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding-left: 4px;
	}

	/* ── Room card ── */
	.room-card {
		position: relative;
		width: 152px;
		background: rgba(16, 28, 20, 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(140, 200, 140, 0.12);
		border-radius: 6px;
		overflow: visible;
		cursor: pointer;
		text-align: left;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
		animation: card-appear 0.4s ease-out both;
		padding: 0;
	}

	@keyframes card-appear {
		from { opacity: 0; transform: translateY(6px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}

	.room-card:hover {
		transform: translateY(-3px);
		border-color: rgba(140, 200, 140, 0.3);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(140, 200, 140, 0.06);
	}

	.room-card--open {
		border-color: rgba(111, 223, 138, 0.2);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3), 0 0 8px rgba(111, 223, 138, 0.08);
	}

	.room-card--closed {
		opacity: 0.75;
	}

	/* Status bar at top of card */
	.card-status-bar {
		height: 3px;
		width: 100%;
		border-radius: 6px 6px 0 0;
		background: var(--card-color, #4a8070);
		opacity: 0.8;
	}

	.room-card--open .card-status-bar {
		background: var(--arch-open);
		box-shadow: 0 0 6px var(--arch-open);
	}

	/* Card inner content */
	.card-inner {
		padding: 9px 11px 11px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.card-name {
		font-family: var(--font-display);
		font-size: 13px;
		font-weight: 700;
		color: var(--arch-text);
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-activity {
		font-size: 10px;
		color: rgba(160, 210, 160, 0.7);
		font-family: var(--font-mono);
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}

	.card-person {
		font-size: 9.5px;
		color: var(--arch-text-dim);
		font-family: var(--font-mono);
		display: flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.person-dot {
		font-size: 8px;
		color: var(--arch-gold);
		opacity: 0.7;
	}

	.card-time {
		font-size: 9px;
		color: rgba(180, 200, 170, 0.5);
		font-family: var(--font-mono);
		letter-spacing: 0.3px;
	}

	.card-badge {
		display: inline-block;
		font-size: 8.5px;
		font-weight: 700;
		letter-spacing: 1.5px;
		padding: 2px 7px;
		border-radius: 3px;
		margin-top: 4px;
		align-self: flex-start;
	}

	.badge-open {
		background: rgba(111, 223, 138, 0.12);
		color: var(--arch-open);
		border: 1px solid rgba(111, 223, 138, 0.25);
	}

	.badge-closed {
		background: rgba(100, 120, 110, 0.1);
		color: var(--arch-closed);
		border: 1px solid rgba(100, 120, 110, 0.2);
	}

	/* Elevation shadow */
	.card-shadow {
		position: absolute;
		bottom: -6px;
		left: 6px;
		right: -6px;
		height: 100%;
		background: rgba(0, 0, 0, 0.25);
		border-radius: 6px;
		z-index: -1;
		filter: blur(4px);
	}

	/* Open beacon */
	.open-beacon {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 10px;
		height: 10px;
		pointer-events: none;
	}

	.beacon-ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1px solid var(--arch-open);
		animation: beacon-expand 2.2s ease-out infinite;
	}

	.beacon-ring-1 { background: var(--arch-open); }
	.beacon-ring-2 { animation-delay: 1.1s; }

	@keyframes beacon-expand {
		0% { opacity: 0.8; transform: scale(1); }
		100% { opacity: 0; transform: scale(3); }
	}

	/* Water fill */
	.water-fill {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 4px;
	}

	/* ── Layer separator ── */
	.layer-separator {
		padding: 2px 0 8px;
		position: relative;
	}

	.separator-line {
		height: 1px;
		background: linear-gradient(
			to right,
			transparent,
			rgba(140, 200, 140, 0.08) 20%,
			rgba(140, 200, 140, 0.08) 80%,
			transparent
		);
	}

	/* ── Compass ── */
	.compass {
		position: absolute;
		bottom: 20px;
		right: 20px;
		width: 36px;
		height: 36px;
		z-index: 15;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.3;
		pointer-events: none;
	}

	.compass-circle {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1px solid var(--arch-gold);
	}

	.compass-needle {
		position: absolute;
		font-size: 8px;
		font-family: var(--font-mono);
		font-weight: 700;
		color: var(--arch-gold);
		letter-spacing: 0;
	}

	.compass-needle.north { top: 1px; left: 50%; transform: translateX(-50%); }
	.compass-needle.east  { right: 1px; top: 50%; transform: translateY(-50%); }

	/* ── Empty ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 60px 0;
		color: var(--arch-text-dim);
	}

	.empty-icon { font-size: 32px; opacity: 0.4; }

	.empty-text {
		font-size: 12px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
</style>
