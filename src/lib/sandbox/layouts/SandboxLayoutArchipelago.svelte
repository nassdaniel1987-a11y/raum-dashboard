<script lang="ts">
	import { rooms, roomStatuses, dailyConfigs } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const FLOOR_ORDER = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];

	const FLOOR_META: Record<string, { label: string; short: string; accent: string }> = {
		dach:   { label: 'Dachgeschoss',   short: 'DACH', accent: '#f0c060' },
		og2:    { label: 'OG 2',           short: 'OG 2', accent: '#7eb8f7' },
		og1:    { label: 'OG 1',           short: 'OG 1', accent: '#6ed4a0' },
		eg:     { label: 'Erdgeschoss',    short: 'EG',   accent: '#a78bfa' },
		essen:  { label: 'Essbereich',     short: 'ESS',  accent: '#fb923c' },
		ug:     { label: 'Untergeschoss',  short: 'UG',   accent: '#94a3b8' },
		extern: { label: 'Außenbereich',   short: 'EXT',  accent: '#34d399' },
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

	let openCount = $derived(allRooms.filter(r => r.isOpen).length);
	let totalCount = $derived(allRooms.length);

	function getImageUrl(room: RoomWithConfig): string {
		return room.config?.activity_image_url ?? room.image_url ?? '';
	}
</script>

<div class="sb" role="presentation">

	<!-- Subtle grid texture -->
	<div class="bg-grid" aria-hidden="true"></div>

	<!-- ── Top bar ── -->
	<header class="topbar">
		<div class="topbar-left">
			<span class="topbar-logo" aria-hidden="true">▣</span>
			<span class="topbar-title">Raumstatus</span>
		</div>
		<div class="topbar-counters">
			<div class="counter counter--open">
				<span class="counter-dot" aria-hidden="true"></span>
				<span class="counter-num">{openCount}</span>
				<span class="counter-lbl">OFFEN</span>
			</div>
			<div class="counter-sep" aria-hidden="true"></div>
			<div class="counter counter--closed">
				<span class="counter-num">{totalCount - openCount}</span>
				<span class="counter-lbl">ZU</span>
			</div>
		</div>
	</header>

	<!-- ── Floor rows — each gets equal vertical space, no scroll ── -->
	<div class="floors-wrap">
		{#each floorGroups() as group, gi}
			<section
				class="floor-row"
				style="--accent: {group.meta.accent}; animation-delay: {gi * 0.05}s;"
				aria-label={group.meta.label}
			>
				<!-- Sidebar label -->
				<div class="floor-label" style="border-left-color: {group.meta.accent};">
					<span class="floor-short" style="color: {group.meta.accent};">{group.meta.short}</span>
					<span class="floor-ratio">
						<span style="color: {group.meta.accent}; font-weight: 700;">
							{group.rooms.filter(r => r.isOpen).length}
						</span>/{group.rooms.length}
					</span>
				</div>

				<!-- Cards — fill all available width equally -->
				<div class="card-strip">
					{#each group.rooms as room, ri}
						{@const imgUrl = getImageUrl(room)}
						<button
							class="card"
							class:card--open={room.isOpen}
							class:card--closed={!room.isOpen}
							style="animation-delay: {gi * 0.05 + ri * 0.035}s;"
							onclick={() => handleEditRoom(room)}
							aria-label="{room.name}: {room.isOpen ? 'geöffnet' : 'geschlossen'}"
						>
							<!-- Image background (wenn vorhanden) -->
							{#if imgUrl}
								<div
									class="card-img"
									style="background-image: url('{imgUrl}');"
									aria-hidden="true"
								></div>
								<div class="card-img-overlay" aria-hidden="true"></div>
							{/if}

							<!-- Left status stripe -->
							<div class="card-stripe" aria-hidden="true"></div>

							<!-- Content -->
							<div class="card-body">
								<!-- Status pill — always first, always visible -->
								<div class="status-pill" class:pill--open={room.isOpen} class:pill--closed={!room.isOpen}>
									{#if room.isOpen}
										<span class="pill-dot" aria-hidden="true"></span>
									{/if}
									{room.isOpen ? 'OFFEN' : 'ZU'}
								</div>

								<!-- Room name -->
								<div class="card-name">{room.name}</div>

								<!-- Activity when set -->
								{#if room.config?.activity}
									<div class="card-activity">{room.config.activity}</div>
								{/if}

								<!-- Person avatar + name -->
								{#if room.person}
									<div class="card-person">
										<span class="person-initial">{room.person.trim()[0]?.toUpperCase() ?? '?'}</span>
										<span class="person-name">{room.person.split(',')[0].trim()}</span>
									</div>
								{/if}

								<!-- Time -->
								{#if room.config?.open_time}
									<div class="card-time">
										{room.config.open_time}{room.config.close_time ? '–' + room.config.close_time : ''}
									</div>
								{/if}
							</div>

							<!-- Green halo for open rooms -->
							{#if room.isOpen}
								<div class="open-halo" aria-hidden="true"></div>
							{/if}
						</button>
					{/each}
				</div>
			</section>

			{#if gi < floorGroups().length - 1}
				<div class="floor-divider" aria-hidden="true"></div>
			{/if}
		{/each}

		{#if floorGroups().length === 0}
			<div class="empty">
				<span>▣</span>
				<span>Keine Räume vorhanden</span>
			</div>
		{/if}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');

	/* ─── tokens ─── */
	:root {
		--sb-bg:         #0b0e13;
		--sb-surface:    #12181f;
		--sb-surface-hi: #18222e;
		--sb-border:     rgba(255,255,255,0.06);
		--sb-text:       #e8edf3;
		--sb-text-dim:   rgba(180,200,220,0.45);
		--sb-open:       #22c55e;
		--sb-open-dim:   rgba(34,197,94,0.14);
		--sb-open-glow:  rgba(34,197,94,0.3);
		--font-cond:     'Barlow Condensed', sans-serif;
		--font-body:     'Barlow', sans-serif;
	}

	/* ─── shell ─── */
	.sb {
		width: 100%;
		height: 100%;
		background: var(--sb-bg);
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		position: relative;
		overflow: hidden; /* NO scroll on outer */
	}

	.bg-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background-image:
			linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
		background-size: 36px 36px;
	}

	/* ─── topbar ─── */
	.topbar {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 18px;
		background: rgba(11,14,19,0.92);
		border-bottom: 1px solid var(--sb-border);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		flex-shrink: 0;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.topbar-logo {
		font-size: 16px;
		color: var(--sb-open);
		filter: drop-shadow(0 0 5px var(--sb-open-glow));
		line-height: 1;
	}

	.topbar-title {
		font-family: var(--font-cond);
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 1px;
		color: var(--sb-text);
		text-transform: uppercase;
	}

	.topbar-counters {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.counter {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 12px;
		border-radius: 5px;
	}

	.counter--open {
		background: var(--sb-open-dim);
		border: 1px solid rgba(34,197,94,0.18);
	}

	.counter--closed {
		background: rgba(255,255,255,0.025);
		border: 1px solid rgba(255,255,255,0.05);
	}

	.counter-num {
		font-family: var(--font-cond);
		font-size: 24px;
		font-weight: 800;
		line-height: 1;
		color: var(--sb-text);
	}

	.counter--open .counter-num { color: var(--sb-open); }

	.counter-lbl {
		font-family: var(--font-cond);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 1.5px;
		color: var(--sb-text-dim);
		align-self: flex-end;
		padding-bottom: 1px;
	}

	.counter-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--sb-open);
		box-shadow: 0 0 6px var(--sb-open);
		flex-shrink: 0;
		animation: dot-blink 2s ease-in-out infinite;
	}

	@keyframes dot-blink {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.25; }
	}

	.counter-sep {
		width: 1px;
		height: 26px;
		background: var(--sb-border);
		margin: 0 2px;
	}

	/* ─── floors wrap — takes all remaining height, NO overflow ─── */
	.floors-wrap {
		flex: 1;
		overflow: hidden; /* hard clip — no scroll */
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 5;
		padding: 8px 14px 10px;
		gap: 0;
	}

	/* ─── floor row — each takes equal share of vertical space ─── */
	.floor-row {
		flex: 1;
		display: flex;
		align-items: stretch;
		gap: 10px;
		min-height: 0; /* allow flex children to shrink */
		animation: row-in 0.35s ease-out both;
	}

	@keyframes row-in {
		from { opacity: 0; transform: translateX(-6px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	.floor-divider {
		height: 1px;
		background: linear-gradient(to right, rgba(255,255,255,0.04), rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.04));
		flex-shrink: 0;
		margin: 2px 0;
	}

	/* ─── floor label sidebar ─── */
	.floor-label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		gap: 3px;
		padding: 4px 10px 4px 10px;
		border-left: 2px solid;
		min-width: 44px;
		max-width: 50px;
		flex-shrink: 0;
	}

	.floor-short {
		font-family: var(--font-cond);
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 1px;
		line-height: 1;
	}

	.floor-ratio {
		font-family: var(--font-cond);
		font-size: 11px;
		color: var(--sb-text-dim);
		white-space: nowrap;
	}

	/* ─── card strip — cards fill all available width ─── */
	.card-strip {
		flex: 1;
		display: flex;
		gap: 8px;
		align-items: stretch;
		min-width: 0;
		overflow: hidden; /* clip if somehow too many */
	}

	/* ─── card — fills available width, no fixed size ─── */
	.card {
		flex: 1;
		min-width: 0;
		position: relative;
		border-radius: 7px;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		padding: 0;
		border: 1px solid var(--sb-border);
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
		animation: card-in 0.3s ease-out both;
	}

	@keyframes card-in {
		from { opacity: 0; transform: scale(0.96); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* OPEN — bright, full height, green accent */
	.card--open {
		background: var(--sb-surface-hi);
		border-color: rgba(34,197,94,0.22);
		box-shadow:
			0 0 0 1px rgba(34,197,94,0.08),
			0 2px 14px rgba(0,0,0,0.35),
			inset 0 0 24px rgba(34,197,94,0.03);
	}

	.card--open:hover {
		transform: translateY(-2px) scale(1.01);
		border-color: rgba(34,197,94,0.38);
		box-shadow:
			0 0 0 1px rgba(34,197,94,0.22),
			0 6px 22px rgba(0,0,0,0.45),
			0 0 16px rgba(34,197,94,0.1);
	}

	/* CLOSED — dim, gray, visually smaller feel */
	.card--closed {
		background: rgba(255,255,255,0.025);
		border-color: rgba(255,255,255,0.04);
		opacity: 0.6;
		/* shrink flex basis so closed cards take less space */
		flex: 0.6;
	}

	.card--closed:hover {
		opacity: 0.82;
		transform: translateY(-1px);
	}

	/* ── image bg ── */
	.card-img {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}

	.card-img-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			150deg,
			rgba(11,14,19,0.25) 0%,
			rgba(11,14,19,0.7)  55%,
			rgba(11,14,19,0.9)  100%
		);
		z-index: 1;
	}

	/* ── left stripe ── */
	.card-stripe {
		position: absolute;
		left: 0;
		top: 0;
		width: 3px;
		height: 100%;
		z-index: 5;
	}

	.card--open .card-stripe {
		background: var(--sb-open);
		box-shadow: 2px 0 10px rgba(34,197,94,0.45);
	}

	.card--closed .card-stripe {
		background: rgba(100,120,140,0.25);
	}

	/* ── body ── */
	.card-body {
		position: relative;
		z-index: 6;
		padding: 7px 9px 8px 11px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		height: 100%;
		justify-content: center;
	}

	/* ── status pill ── */
	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border-radius: 3px;
		padding: 1px 7px;
		font-family: var(--font-cond);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1.5px;
		align-self: flex-start;
		margin-bottom: 1px;
	}

	.pill--open {
		background: rgba(34,197,94,0.18);
		color: var(--sb-open);
		border: 1px solid rgba(34,197,94,0.28);
	}

	.pill--closed {
		background: rgba(255,255,255,0.04);
		color: rgba(130,150,165,0.65);
		border: 1px solid rgba(255,255,255,0.06);
	}

	.pill-dot {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--sb-open);
		box-shadow: 0 0 5px var(--sb-open);
		flex-shrink: 0;
		animation: pill-beat 1.8s ease-in-out infinite;
	}

	@keyframes pill-beat {
		0%, 100% { transform: scale(1); opacity: 1; }
		50%       { transform: scale(1.4); opacity: 0.5; }
	}

	/* ── name ── */
	.card-name {
		font-family: var(--font-cond);
		color: var(--sb-text);
		line-height: 1.1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card--open .card-name {
		font-size: clamp(14px, 1.8vh, 22px);
		font-weight: 800;
	}

	.card--closed .card-name {
		font-size: clamp(11px, 1.4vh, 15px);
		font-weight: 600;
		color: rgba(170,190,210,0.55);
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

	.card--open  .card-activity { color: rgba(200,230,210,0.85); }
	.card--closed .card-activity { color: rgba(140,160,175,0.4); -webkit-line-clamp: 1; line-clamp: 1; }

	/* ── person ── */
	.card-person {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-top: 1px;
	}

	.person-initial {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		font-family: var(--font-cond);
		font-size: 9px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.card--open  .person-initial { background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.3); color: var(--sb-open); }
	.card--closed .person-initial { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: var(--sb-text-dim); }

	.person-name {
		font-size: 10px;
		color: var(--sb-text-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── time ── */
	.card-time {
		font-family: var(--font-cond);
		font-size: 10px;
		color: rgba(140,165,185,0.4);
		letter-spacing: 0.2px;
		margin-top: 1px;
	}

	/* ── open halo ── */
	.open-halo {
		position: absolute;
		inset: 0;
		border-radius: 7px;
		pointer-events: none;
		z-index: 3;
		border: 1px solid rgba(34,197,94,0.12);
		animation: halo-breathe 3.5s ease-in-out infinite;
	}

	@keyframes halo-breathe {
		0%, 100% { opacity: 0.4; }
		50%       { opacity: 1; }
	}

	/* ─── empty ─── */
	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: var(--sb-text-dim);
		font-family: var(--font-cond);
		font-size: 14px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}

	.empty span:first-child { font-size: 28px; opacity: 0.25; }
</style>
