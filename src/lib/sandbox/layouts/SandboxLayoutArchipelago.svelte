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
</script>

<div class="board" role="presentation">

	<!-- ══ HEADER ══ -->
	<header class="hbar">
		<span class="hbar-title">Raumstatus</span>
		<div class="hbar-pills">
			<div class="hpill hpill--open">
				<span class="hpill-led" aria-hidden="true"></span>
				<span class="hpill-n">{openCount}</span>
				<span class="hpill-lbl">OFFEN</span>
			</div>
			<div class="hpill hpill--closed">
				<span class="hpill-n">{totalCount - openCount}</span>
				<span class="hpill-lbl">ZU</span>
			</div>
		</div>
	</header>

	<!-- ══ MAIN: sidebar + grid ══ -->
	<div class="main">

		<!-- Left sidebar: floor labels stacked proportionally -->
		<aside class="sidebar" aria-hidden="true">
			{#each floorGroups() as grp}
				<div
					class="sb-floor"
					style="flex: {grp.rooms.length}; --acc: {grp.meta.accent};"
				>
					<div class="sb-bar" style="background: {grp.meta.accent};"></div>
					<span class="sb-label" style="color: {grp.meta.accent};">{grp.meta.short}</span>
					<span class="sb-ratio">
						{grp.rooms.filter(r => r.isOpen).length}/{grp.rooms.length}
					</span>
				</div>
			{/each}
		</aside>

		<!-- Right: all rooms in a single responsive grid -->
		<div class="grid-wrap">
			{#each floorGroups() as grp, gi}
				{#each grp.rooms as room, ri}
					{@const imgUrl = getImageUrl(room)}
					{@const hasImg = !!imgUrl}

					<button
						class="card"
						class:is-open={room.isOpen}
						class:is-closed={!room.isOpen}
						class:has-img={hasImg}
						style="
							--acc: {grp.meta.accent};
							animation-delay: {(gi * 4 + ri) * 0.035}s;
						"
						onclick={() => handleEditRoom(room)}
						aria-label="{room.name}: {room.isOpen ? 'geöffnet' : 'geschlossen'}"
					>
						<!-- Image bg -->
						{#if hasImg}
							<div class="c-img" style="background-image:url('{imgUrl}');" aria-hidden="true"></div>
							<div class="c-scrim" aria-hidden="true"></div>
						{/if}

						<!-- Big colored background wash for open rooms -->
						{#if room.isOpen}
							<div class="c-wash" aria-hidden="true"></div>
						{/if}

						<!-- Content -->
						<div class="c-body">

							<!-- Status — THE first thing you read -->
							<div class="c-status" aria-hidden="true">
								{#if room.isOpen}
									<span class="c-led" aria-hidden="true"></span>
								{/if}
								<span class="c-status-text">
									{room.isOpen ? 'OFFEN' : 'ZU'}
								</span>
							</div>

							<!-- Floor tag -->
							<div class="c-floor-tag" style="color: {grp.meta.accent};">
								{grp.meta.short}
							</div>

							<!-- Name -->
							<div class="c-name">{room.name}</div>

							<!-- Activity -->
							{#if room.config?.activity}
								<div class="c-activity">{room.config.activity}</div>
							{/if}

							<!-- Person -->
							{#if room.person}
								<div class="c-person">
									<span class="c-person-ic" aria-hidden="true">◉</span>
									{room.person.split(',')[0].trim()}
								</div>
							{/if}

							<!-- Time -->
							{#if room.config?.open_time}
								<div class="c-time">
									{room.config.open_time}{room.config.close_time ? '–' + room.config.close_time : ''}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			{/each}

			{#if totalCount === 0}
				<div class="empty">Keine Räume</div>
			{/if}
		</div>

	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');

	/* ── design tokens ── */
	:root {
		--bg:       #0c0f14;
		--surf:     #141920;
		--surf2:    #1c2430;
		--border:   rgba(255,255,255,0.07);
		--text:     #dde6f0;
		--mid:      rgba(200,215,230,0.55);
		--dim:      rgba(150,170,190,0.3);
		--green:    #22c55e;
		--g-dim:    rgba(34,197,94,0.12);
		--g-glow:   rgba(34,197,94,0.5);
		--f-head:   'Syne', sans-serif;
		--f-mono:   'Geist Mono', 'Courier New', monospace;
	}

	/* ── shell ── */
	.board {
		width: 100%;
		height: 100%;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		font-family: var(--f-mono);
		overflow: hidden;
	}

	/* ── header ── */
	.hbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		height: 42px;
		background: var(--surf);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.hbar-title {
		font-family: var(--f-head);
		font-size: 17px;
		font-weight: 800;
		letter-spacing: 1px;
		color: var(--text);
		text-transform: uppercase;
	}

	.hbar-pills {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.hpill {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: 20px;
		font-family: var(--f-mono);
	}

	.hpill--open {
		background: var(--g-dim);
		border: 1px solid rgba(34,197,94,0.25);
	}

	.hpill--closed {
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--border);
	}

	.hpill-led {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 8px var(--g-glow);
		flex-shrink: 0;
		animation: led 2s ease-in-out infinite;
	}

	@keyframes led {
		0%,100% { opacity: 1; }
		50%      { opacity: 0.2; }
	}

	.hpill-n {
		font-size: 18px;
		font-weight: 700;
		color: var(--text);
		line-height: 1;
	}

	.hpill--open .hpill-n { color: var(--green); }

	.hpill-lbl {
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 1px;
		color: var(--dim);
	}

	/* ── main layout ── */
	.main {
		flex: 1;
		display: flex;
		overflow: hidden;
		gap: 0;
	}

	/* ── sidebar ── */
	.sidebar {
		width: 48px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background: rgba(255,255,255,0.018);
		border-right: 1px solid var(--border);
		overflow: hidden;
	}

	.sb-floor {
		/* flex set inline */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		border-bottom: 1px solid var(--border);
		position: relative;
		padding: 4px 0;
	}

	.sb-floor:last-child { border-bottom: none; }

	.sb-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		border-radius: 0 2px 2px 0;
		opacity: 0.8;
	}

	.sb-label {
		font-family: var(--f-head);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-align: center;
		line-height: 1;
	}

	.sb-ratio {
		font-size: 9px;
		color: var(--dim);
		text-align: center;
		white-space: nowrap;
	}

	/* ── grid ── */
	.grid-wrap {
		flex: 1;
		overflow: hidden;
		padding: 8px;
		/* Auto-fit: as many columns as fit at minimum 140px */
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		grid-auto-rows: 1fr;
		gap: 6px;
		align-content: start;
	}

	/* ══════════════════════════════
	   CARD
	══════════════════════════════ */
	.card {
		position: relative;
		overflow: hidden;
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		padding: 0;
		animation: pop-in 0.3s ease-out both;
		transition: transform 0.14s ease, box-shadow 0.14s ease;
		border: 1px solid transparent;
	}

	@keyframes pop-in {
		from { opacity: 0; transform: scale(0.92) translateY(6px); }
		to   { opacity: 1; transform: scale(1)    translateY(0); }
	}

	/* OPEN */
	.card.is-open {
		background: var(--surf2);
		border-color: rgba(34,197,94,0.3);
		box-shadow: 0 2px 16px rgba(0,0,0,0.35),
		            0 0 0 1px rgba(34,197,94,0.08);
	}

	.card.is-open:hover {
		transform: translateY(-3px) scale(1.015);
		box-shadow: 0 8px 24px rgba(0,0,0,0.45),
		            0 0 20px rgba(34,197,94,0.15),
		            0 0 0 1px rgba(34,197,94,0.25);
	}

	/* CLOSED */
	.card.is-closed {
		background: rgba(255,255,255,0.025);
		border-color: rgba(255,255,255,0.05);
		/* Closed cards desaturate and dim */
		filter: saturate(0.4);
		opacity: 0.55;
	}

	.card.is-closed:hover {
		opacity: 0.78;
		filter: saturate(0.7);
		transform: translateY(-1px);
	}

	/* Image bg */
	.c-img {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}

	/* Scrim over image — stronger gradient so text is always clear */
	.c-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			160deg,
			rgba(12,15,20,0.1)  0%,
			rgba(12,15,20,0.6)  50%,
			rgba(12,15,20,0.92) 100%
		);
		z-index: 1;
	}

	/* Green wash for open rooms — subtle background tint */
	.c-wash {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at top left,
			rgba(34,197,94,0.07) 0%,
			transparent 70%
		);
		z-index: 1;
		pointer-events: none;
	}

	/* Body */
	.c-body {
		position: relative;
		z-index: 5;
		padding: 9px 10px 10px;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	/* ── STATUS LINE — first and biggest ── */
	.c-status {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-bottom: 2px;
	}

	.c-led {
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 8px var(--g-glow), 0 0 16px var(--g-glow);
		flex-shrink: 0;
		animation: pulse 1.8s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,100% { transform: scale(1);    box-shadow: 0 0 8px var(--g-glow); }
		50%      { transform: scale(1.35); box-shadow: 0 0 16px var(--g-glow); }
	}

	.c-status-text {
		font-family: var(--f-head);
		font-weight: 800;
		letter-spacing: 1px;
		line-height: 1;
	}

	/* Open: big bright green */
	.is-open .c-status-text {
		font-size: clamp(13px, 1.8vh, 20px);
		color: var(--green);
		text-shadow: 0 0 12px rgba(34,197,94,0.6);
	}

	/* Closed: smaller, muted */
	.is-closed .c-status-text {
		font-size: clamp(11px, 1.4vh, 15px);
		color: rgba(140,155,170,0.7);
	}

	/* ── Floor tag ── */
	.c-floor-tag {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		opacity: 0.8;
		line-height: 1;
	}

	/* ── Room name ── */
	.c-name {
		font-family: var(--f-head);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.1;
	}

	.is-open  .c-name {
		font-size: clamp(13px, 1.9vh, 22px);
		font-weight: 800;
		color: var(--text);
	}

	.is-closed .c-name {
		font-size: clamp(11px, 1.5vh, 17px);
		font-weight: 700;
		color: rgba(170,185,205,0.5);
	}

	/* ── Activity ── */
	.c-activity {
		font-size: clamp(9px, 1.15vh, 13px);
		font-weight: 500;
		color: rgba(195,220,205,0.82);
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		margin-top: 1px;
	}

	.is-closed .c-activity {
		color: rgba(130,150,165,0.38);
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}

	/* ── Person ── */
	.c-person {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: clamp(9px, 1.05vh, 12px);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}

	.is-open  .c-person { color: rgba(200,225,210,0.7); }
	.is-closed .c-person { color: var(--dim); }

	.c-person-ic {
		font-size: 7px;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.is-open  .c-person-ic { color: var(--green); }
	.is-closed .c-person-ic { color: var(--dim); }

	/* ── Time ── */
	.c-time {
		font-size: clamp(8px, 0.95vh, 11px);
		color: var(--dim);
		margin-top: auto;
		letter-spacing: 0.2px;
	}

	/* ── empty ── */
	.empty {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--dim);
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
		padding: 40px;
	}
</style>
