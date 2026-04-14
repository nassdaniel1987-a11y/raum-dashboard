<script lang="ts">
	import { rooms, roomStatuses, dailyConfigs } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
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
</script>

<div class="overview" role="presentation">

	<!-- Thin header strip -->
	<header class="strip">
		<span class="strip-title">Raumübersicht</span>
		<div class="strip-counts">
			<span class="count-open">
				<span class="count-dot" aria-hidden="true"></span>
				{openCount} offen
			</span>
			<span class="count-sep" aria-hidden="true">·</span>
			<span class="count-closed">{totalCount - openCount} zu</span>
		</div>
	</header>

	<!-- Floor rows — each floor is one horizontal band -->
	<div class="floors">
		{#each floorGroups() as grp, gi}
			<section
				class="floor"
				style="
					--acc: {grp.meta.accent};
					/* flex-grow proportional to room count so more rooms = more height */
					flex: {grp.rooms.length};
					animation-delay: {gi * 0.06}s;
				"
				aria-label={grp.meta.label}
			>
				<!-- Floor label pill -->
				<div class="floor-pill">
					<div class="floor-pill-bar" style="background:{grp.meta.accent};" aria-hidden="true"></div>
					<span class="floor-pill-name" style="color:{grp.meta.accent};">{grp.meta.short}</span>
					<span class="floor-pill-ratio">
						{grp.rooms.filter(r => r.isOpen).length}/{grp.rooms.length}
					</span>
				</div>

				<!-- Cards: one slot per room, equal width -->
				<div class="floor-cards">
					{#each grp.rooms as room (room.id)}
						<div class="card-slot" style="animation-delay:{gi * 0.06 + grp.rooms.indexOf(room) * 0.04}s;">
							<RoomCard {room} onEdit={handleEditRoom} onSelect={() => {}} />
						</div>
					{/each}
				</div>
			</section>

			{#if gi < floorGroups().length - 1}
				<div class="floor-sep" aria-hidden="true"></div>
			{/if}
		{/each}

		{#if floorGroups().length === 0}
			<div class="empty">Keine Räume</div>
		{/if}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

	:root {
		--ov-bg:     #0d1117;
		--ov-surf:   #161b22;
		--ov-border: rgba(255,255,255,0.07);
		--ov-text:   #e6edf3;
		--ov-dim:    rgba(160,180,200,0.4);
		--ov-green:  #3fb950;
		--ov-gdim:   rgba(63,185,80,0.15);
		--ov-gglow:  rgba(63,185,80,0.45);
		--f-head:    'Syne', sans-serif;
		--f-mono:    'DM Mono', 'Courier New', monospace;
	}

	/* ── shell ── */
	.overview {
		width: 100%;
		height: 100%;
		background: var(--ov-bg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: var(--f-mono);
	}

	/* ── header strip ── */
	.strip {
		flex-shrink: 0;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		background: var(--ov-surf);
		border-bottom: 1px solid var(--ov-border);
	}

	.strip-title {
		font-family: var(--f-head);
		font-size: 16px;
		font-weight: 800;
		letter-spacing: 1px;
		color: var(--ov-text);
		text-transform: uppercase;
	}

	.strip-counts {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12px;
		font-weight: 500;
	}

	.count-open {
		color: var(--ov-green);
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.count-dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--ov-green);
		box-shadow: 0 0 7px var(--ov-gglow);
		animation: blink 2.2s ease-in-out infinite;
	}

	@keyframes blink {
		0%,100% { opacity: 1; }
		50%      { opacity: 0.2; }
	}

	.count-sep  { color: var(--ov-border); }
	.count-closed { color: var(--ov-dim); }

	/* ── floors container ── */
	.floors {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden; /* NO scroll */
		padding: 8px 10px 8px;
		gap: 0;
	}

	/* ── single floor band ── */
	.floor {
		/* flex set inline (= room count) */
		display: flex;
		align-items: stretch;
		gap: 8px;
		min-height: 0;
		animation: floor-in 0.35s ease-out both;
	}

	@keyframes floor-in {
		from { opacity: 0; transform: translateX(-6px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	.floor-sep {
		height: 1px;
		background: var(--ov-border);
		margin: 3px 0 3px 72px;
		flex-shrink: 0;
	}

	/* ── floor label pill ── */
	.floor-pill {
		width: 52px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		position: relative;
		padding: 4px 0;
	}

	.floor-pill-bar {
		position: absolute;
		left: 0;
		top: 10%;
		bottom: 10%;
		width: 2px;
		border-radius: 2px;
		opacity: 0.75;
	}

	.floor-pill-name {
		font-family: var(--f-head);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-align: center;
		line-height: 1;
	}

	.floor-pill-ratio {
		font-size: 10px;
		color: var(--ov-dim);
		text-align: center;
	}

	/* ── card strip ── */
	.floor-cards {
		flex: 1;
		display: flex;
		gap: 6px;
		align-items: stretch;
		min-width: 0;
		overflow: hidden;
		/* Each card-slot fills equally */
	}

	/* ── card slot ── */
	.card-slot {
		flex: 1;
		min-width: 0;
		/* RoomCard needs overflow:visible for hanging badges —
		   we clip at the slot level to prevent layout bleed */
		overflow: hidden;
		border-radius: 20px;
		animation: slot-in 0.3s ease-out both;
		/* Give slots a bit of bottom padding for person badges */
		padding-bottom: 0;
		position: relative;
	}

	@keyframes slot-in {
		from { opacity: 0; transform: scale(0.93); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* ── empty ── */
	.empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ov-dim);
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
</style>
