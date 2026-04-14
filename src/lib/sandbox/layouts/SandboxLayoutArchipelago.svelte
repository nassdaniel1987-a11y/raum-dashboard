<script lang="ts">
	import { rooms, roomStatuses, dailyConfigs } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];

	const FLOOR_META: Record<string, { label: string; short: string; accent: string }> = {
		dach:   { label: 'Dachgeschoss',  short: 'DACH', accent: '#f0c060' },
		og2:    { label: 'OG 2',          short: 'OG 2', accent: '#60a5fa' },
		og1:    { label: 'OG 1',          short: 'OG 1', accent: '#4ade80' },
		eg:     { label: 'Erdgeschoss',   short: 'EG',   accent: '#c084fc' },
		essen:  { label: 'Essbereich',    short: 'ESS',  accent: '#fb923c' },
		ug:     { label: 'Untergeschoss', short: 'UG',   accent: '#94a3b8' },
		extern: { label: 'Außen',         short: 'EXT',  accent: '#2dd4bf' },
	};

	let allRooms = $derived(
		$rooms.map((r) => {
			const jsDay = new Date().getDay();
			const weekday = jsDay === 0 ? 7 : jsDay;
			const config = [...($dailyConfigs?.values() ?? [])].find(
				(c) => c.room_id === r.id && c.weekday === weekday
			) ?? null;
			return {
				...r,
				config,
				status: $roomStatuses.get(r.id) ?? null,
				isOpen: $roomStatuses.get(r.id)?.is_open ?? false
			} as RoomWithConfig;
		})
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
				meta: FLOOR_META[f] ?? { label: f, short: f.toUpperCase(), accent: '#94a3b8' },
				rooms: map.get(f)!
			}));
	});

	let openCount  = $derived(allRooms.filter(r => r.isOpen).length);
	let totalCount = $derived(allRooms.length);

	function getImageUrl(room: RoomWithConfig): string {
		return room.config?.activity_image_url ?? room.image_url ?? '';
	}

	// Flex weight per floor: more rooms → more vertical space
	// Minimum 1, scales with room count so single-room floors don't collapse
	function floorWeight(roomCount: number): number {
		return Math.max(1, roomCount);
	}
</script>

<div class="board" role="presentation">

	<!-- ── Header bar ── -->
	<header class="hbar">
		<div class="hbar-brand">
			<svg class="hbar-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<rect x="1" y="1" width="8" height="8" rx="1.5" fill="currentColor" opacity=".9"/>
				<rect x="11" y="1" width="8" height="8" rx="1.5" fill="currentColor" opacity=".5"/>
				<rect x="1" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity=".5"/>
				<rect x="11" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity=".3"/>
			</svg>
			<span class="hbar-title">Raumstatus</span>
		</div>

		<div class="hbar-stats">
			<div class="hstat hstat--open">
				<span class="hstat-dot" aria-hidden="true"></span>
				<span class="hstat-n">{openCount}</span>
				<span class="hstat-lbl">offen</span>
			</div>
			<div class="hstat-sep" aria-hidden="true"></div>
			<div class="hstat hstat--closed">
				<span class="hstat-n">{totalCount - openCount}</span>
				<span class="hstat-lbl">geschlossen</span>
			</div>
		</div>
	</header>

	<!-- ── Floor bands ── -->
	<div class="bands">
		{#each floorGroups() as grp, gi}
			<!-- Each band's flex-grow = room count, so more rooms = more height -->
			<div
				class="band"
				style="flex: {floorWeight(grp.rooms.length)}; --accent: {grp.meta.accent}; animation-delay: {gi * 0.07}s;"
				aria-label={grp.meta.label}
			>
				<!-- Floor label column -->
				<div class="band-label">
					<span class="band-short" style="color: {grp.meta.accent};">{grp.meta.short}</span>
					<span class="band-count">
						<span style="color: {grp.meta.accent}; font-weight:700;">{grp.rooms.filter(r => r.isOpen).length}</span>/{grp.rooms.length}
					</span>
				</div>

				<!-- Accent rule -->
				<div class="band-rule" style="background: {grp.meta.accent};" aria-hidden="true"></div>

				<!-- Cards -->
				<div class="band-cards">
					{#each grp.rooms as room, ri}
						{@const imgUrl = getImageUrl(room)}
						{@const hasImg = !!imgUrl}
						<button
							class="card"
							class:card--open={room.isOpen}
							class:card--closed={!room.isOpen}
							style="animation-delay: {gi * 0.07 + ri * 0.04}s;"
							onclick={() => handleEditRoom(room)}
							aria-label="{room.name}: {room.isOpen ? 'geöffnet' : 'geschlossen'}"
						>
							<!-- Full-bleed image -->
							{#if hasImg}
								<div class="card-img" style="background-image:url('{imgUrl}');" aria-hidden="true"></div>
								<div class="card-img-scrim" aria-hidden="true"></div>
							{/if}

							<!-- Colored top band = instant status signal -->
							<div class="card-topband" aria-hidden="true"></div>

							<!-- All text content -->
							<div class="card-inner">
								<!-- Status label — dominates visually -->
								<div class="card-status">
									{#if room.isOpen}
										<span class="status-open">
											<span class="status-dot" aria-hidden="true"></span>
											OFFEN
										</span>
									{:else}
										<span class="status-closed">GESCHLOSSEN</span>
									{/if}
								</div>

								<!-- Room name -->
								<div class="card-name">{room.name}</div>

								<!-- Activity — prominent when present -->
								{#if room.config?.activity}
									<div class="card-activity">{room.config.activity}</div>
								{/if}

								<!-- Person -->
								{#if room.person}
									<div class="card-person">
										<span class="card-person-dot" aria-hidden="true">●</span>
										{room.person.split(',')[0].trim()}
									</div>
								{/if}

								<!-- Time -->
								{#if room.config?.open_time}
									<div class="card-time">
										{room.config.open_time}{room.config.close_time ? '–' + room.config.close_time : ''}
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>

			{#if gi < floorGroups().length - 1}
				<div class="band-sep" aria-hidden="true"></div>
			{/if}
		{/each}

		{#if floorGroups().length === 0}
			<div class="empty">Keine Räume vorhanden</div>
		{/if}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bebas+Neue&display=swap');

	/* ─── tokens ─── */
	:root {
		--bg:          #0d1117;
		--surface:     #161b22;
		--surface2:    #1f2937;
		--border:      rgba(255,255,255,0.07);
		--text:        #e6edf3;
		--text-mid:    rgba(200,215,230,0.6);
		--text-dim:    rgba(160,180,200,0.35);
		--green:       #3fb950;
		--green-dim:   rgba(63,185,80,0.15);
		--green-glow:  rgba(63,185,80,0.4);
		--closed-col:  rgba(130,145,160,0.45);
		--font-disp:   'Bebas Neue', sans-serif;
		--font-ui:     'DM Sans', sans-serif;
	}

	/* ─── shell ─── */
	.board {
		width: 100%;
		height: 100%;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		font-family: var(--font-ui);
		overflow: hidden;
		position: relative;
	}

	/* ─── header bar ─── */
	.hbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		height: 44px;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		z-index: 10;
	}

	.hbar-brand {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--green);
	}

	.hbar-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.hbar-title {
		font-family: var(--font-disp);
		font-size: 22px;
		letter-spacing: 1.5px;
		color: var(--text);
		line-height: 1;
	}

	.hbar-stats {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.hstat {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border-radius: 5px;
	}

	.hstat--open {
		background: var(--green-dim);
		border: 1px solid rgba(63,185,80,0.2);
	}

	.hstat--closed {
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--border);
	}

	.hstat-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 7px var(--green-glow);
		animation: dot-pulse 2.2s ease-in-out infinite;
		flex-shrink: 0;
	}

	@keyframes dot-pulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.25; }
	}

	.hstat-n {
		font-family: var(--font-disp);
		font-size: 22px;
		line-height: 1;
		color: var(--text);
	}

	.hstat--open .hstat-n { color: var(--green); }

	.hstat-lbl {
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.8px;
		color: var(--text-dim);
		text-transform: uppercase;
		align-self: flex-end;
		padding-bottom: 2px;
	}

	.hstat-sep {
		width: 1px;
		height: 22px;
		background: var(--border);
		margin: 0 2px;
	}

	/* ─── bands container ─── */
	.bands {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 6px 12px 8px;
		gap: 0;
	}

	/* ─── single floor band ─── */
	.band {
		/* flex set inline per band (= room count) */
		display: flex;
		align-items: stretch;
		gap: 0;
		min-height: 0;
		animation: band-in 0.4s ease-out both;
	}

	@keyframes band-in {
		from { opacity: 0; transform: translateX(-8px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	/* ─── floor label column ─── */
	.band-label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 40px;
		flex-shrink: 0;
		padding: 4px 0;
		gap: 2px;
	}

	.band-short {
		font-family: var(--font-disp);
		font-size: 14px;
		letter-spacing: 1px;
		line-height: 1;
	}

	.band-count {
		font-size: 10px;
		color: var(--text-dim);
		font-weight: 500;
		white-space: nowrap;
	}

	/* ─── thin vertical accent rule ─── */
	.band-rule {
		width: 2px;
		border-radius: 2px;
		flex-shrink: 0;
		margin: 6px 8px 6px 4px;
		opacity: 0.7;
	}

	/* ─── card strip ─── */
	.band-cards {
		flex: 1;
		display: flex;
		gap: 6px;
		align-items: stretch;
		min-width: 0;
		overflow: hidden;
		padding: 4px 0;
	}

	/* ─── band separator ─── */
	.band-sep {
		height: 1px;
		background: var(--border);
		margin: 0 0 0 52px;
		flex-shrink: 0;
	}

	/* ═══════════════════════════════
	   CARD
	═══════════════════════════════ */
	.card {
		position: relative;
		overflow: hidden;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		padding: 0;
		border: 1px solid var(--border);
		animation: card-in 0.3s ease-out both;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		/* flex split: open cards get MORE space than closed */
		flex: 1;
		min-width: 0;
	}

	@keyframes card-in {
		from { opacity: 0; transform: scale(0.94); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* ── OPEN card ── */
	.card--open {
		background: var(--surface2);
		border-color: rgba(63,185,80,0.25);
		flex: 1.6; /* open gets 60% more space than closed */
		box-shadow: inset 0 0 0 1px rgba(63,185,80,0.08),
		            0 2px 12px rgba(0,0,0,0.3);
	}

	.card--open:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0,0,0,0.4),
		            0 0 14px rgba(63,185,80,0.12),
		            inset 0 0 0 1px rgba(63,185,80,0.2);
	}

	/* ── CLOSED card ── */
	.card--closed {
		background: rgba(255,255,255,0.025);
		border-color: rgba(255,255,255,0.04);
		flex: 1; /* baseline */
		opacity: 0.55;
	}

	.card--closed:hover {
		opacity: 0.78;
		transform: translateY(-1px);
	}

	/* ── image behind card ── */
	.card-img {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}

	/* Scrim: strong at bottom, lighter at top so image shows through top half */
	.card-img-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			175deg,
			rgba(13,17,23,0.18) 0%,
			rgba(13,17,23,0.55) 45%,
			rgba(13,17,23,0.88) 100%
		);
		z-index: 1;
	}

	/* ── colored top band — instant status signal ── */
	.card-topband {
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 4px;
		z-index: 5;
	}

	.card--open  .card-topband {
		background: var(--green);
		box-shadow: 0 0 10px var(--green-glow);
	}

	.card--closed .card-topband {
		background: rgba(130,145,160,0.3);
	}

	/* ── inner layout ── */
	.card-inner {
		position: relative;
		z-index: 6;
		padding: 10px 10px 9px 10px;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 3px;
		justify-content: center;
	}

	/* ── status label ── */
	.card-status {
		margin-bottom: 1px;
	}

	.status-open {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-family: var(--font-disp);
		font-size: clamp(12px, 1.6vh, 18px);
		letter-spacing: 1.5px;
		color: var(--green);
		text-shadow: 0 0 10px var(--green-glow);
	}

	.status-dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 7px var(--green-glow);
		flex-shrink: 0;
		animation: sdot 1.8s ease-in-out infinite;
	}

	@keyframes sdot {
		0%,100% { transform: scale(1);    opacity: 1; }
		50%      { transform: scale(1.45); opacity: 0.5; }
	}

	.status-closed {
		font-family: var(--font-disp);
		font-size: clamp(10px, 1.3vh, 14px);
		letter-spacing: 1.2px;
		color: var(--closed-col);
	}

	/* ── room name ── */
	.card-name {
		font-family: var(--font-disp);
		letter-spacing: 0.5px;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.1;
	}

	.card--open  .card-name { font-size: clamp(14px, 2.2vh, 26px); }
	.card--closed .card-name {
		font-size: clamp(12px, 1.7vh, 18px);
		color: rgba(180,195,215,0.5);
	}

	/* ── activity ── */
	.card-activity {
		font-size: clamp(10px, 1.2vh, 13px);
		font-weight: 500;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card--open  .card-activity { color: rgba(210,230,215,0.8); }
	.card--closed .card-activity {
		color: rgba(140,160,175,0.4);
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}

	/* ── person ── */
	.card-person {
		font-size: clamp(9px, 1.1vh, 12px);
		color: var(--text-mid);
		display: flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 1px;
	}

	.card--closed .card-person { color: var(--text-dim); }

	.card-person-dot {
		color: var(--green);
		font-size: 6px;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.card--closed .card-person-dot { color: var(--text-dim); }

	/* ── time ── */
	.card-time {
		font-size: clamp(8px, 1vh, 11px);
		color: var(--text-dim);
		margin-top: auto;
		font-weight: 500;
		letter-spacing: 0.3px;
	}

	/* ─── empty ─── */
	.empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-dim);
		font-size: 14px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
</style>
