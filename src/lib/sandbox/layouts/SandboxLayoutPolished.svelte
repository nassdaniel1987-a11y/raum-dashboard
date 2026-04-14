<script lang="ts">
	import { rooms, roomStatuses, runnerName as runnerNameStore, currentTime, dailyConfigs } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	const PAGE_DEFS = [
		{ id: 'dach',   label: 'Dachgeschoss', short: 'DACH', floors: ['dach'] },
		{ id: 'og',     label: '1. & 2. OG',   short: 'OG',   floors: ['og2', 'og1'] },
		{ id: 'eg',     label: 'Erdgeschoss',  short: 'EG',   floors: ['eg'] },
		{ id: 'essen',  label: 'Essbereich',   short: 'ESS',  floors: ['essen'] },
		{ id: 'extern', label: 'Außenbereich', short: 'EXT',  floors: ['extern'] },
	];

	const AUTO_S = 10;

	let allRooms = $derived(
		$rooms.map((r) => {
			const jsDay  = new Date().getDay();
			const weekday = jsDay === 0 ? 7 : jsDay;
			const config  = [...($dailyConfigs?.values() ?? [])].find(
				c => c.room_id === r.id && c.weekday === weekday
			) ?? null;
			return {
				...r,
				config,
				status: $roomStatuses.get(r.id) ?? null,
				isOpen: $roomStatuses.get(r.id)?.is_open ?? false,
			} as RoomWithConfig;
		})
	);

	let roomsByFloor = $derived(() => {
		const m = new Map<string, RoomWithConfig[]>();
		for (const r of allRooms) {
			if (!m.has(r.floor)) m.set(r.floor, []);
			m.get(r.floor)!.push(r);
		}
		return m;
	});

	let activePages = $derived(() =>
		PAGE_DEFS
			.filter(p => p.floors.some(f => (roomsByFloor().get(f)?.length ?? 0) > 0))
			.map(p => ({
				...p,
				rooms: p.floors.flatMap(f => roomsByFloor().get(f) ?? [])
			}))
	);

	let currentIdx  = $state(0);
	let direction   = $state<'next' | 'prev'>('next');
	let isAnimating = $state(false);
	let autoTimer: ReturnType<typeof setTimeout> | undefined;

	function goTo(idx: number) {
		if (isAnimating || idx === currentIdx) return;
		direction   = idx > currentIdx ? 'next' : 'prev';
		isAnimating = true;
		currentIdx  = idx;
		clearAuto();
		setTimeout(() => { isAnimating = false; }, 380);
		scheduleAuto();
	}

	function next() {
		const p = activePages();
		if (p.length < 2) return;
		goTo((currentIdx + 1) % p.length);
	}

	function prev() {
		const p = activePages();
		if (p.length < 2) return;
		goTo(currentIdx === 0 ? p.length - 1 : currentIdx - 1);
	}

	function scheduleAuto() {
		clearAuto();
		autoTimer = setTimeout(next, AUTO_S * 1000);
	}

	function clearAuto() {
		if (autoTimer) { clearTimeout(autoTimer); autoTimer = undefined; }
	}

	let touchStartX = 0;
	function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; }
	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 50) { dx > 0 ? prev() : next(); }
	}

	onMount(scheduleAuto);
	onDestroy(clearAuto);

	let currentPage  = $derived(() => activePages()[currentIdx]);
	let currentRooms = $derived(() => activePages()[currentIdx]?.rooms ?? []);
	let openCount    = $derived(() => currentRooms().filter(r => r.isOpen).length);
	let totalOpen    = $derived(allRooms.filter(r => r.isOpen).length);

	// Status helpers
	function parseMin(t: string | null | undefined): number | null {
		if (!t) return null;
		const [h, m] = t.split(':').map(Number);
		return isNaN(h) ? null : h * 60 + m;
	}

	function nowMin(): number {
		const t = $currentTime;
		return t.getHours() * 60 + t.getMinutes();
	}

	function tileStatus(room: RoomWithConfig): 'open' | 'closed' | 'soon' | 'closing' {
		const open  = parseMin(room.config?.open_time);
		const close = parseMin(room.config?.close_time);
		const now   = nowMin();
		if (!room.isOpen) {
			if (open !== null && open - now > 0 && open - now <= 10) return 'soon';
			return 'closed';
		}
		if (close !== null && close - now > 0 && close - now <= 10) return 'closing';
		return 'open';
	}

	function fmtTime(t: string | null | undefined): string {
		return t ? t.substring(0, 5) : '';
	}

	function getImageUrl(room: RoomWithConfig): string {
		return room.config?.activity_image_url ?? room.image_url ?? '';
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="pl"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Raumübersicht"
>

	<!-- ══ Tab bar ══ -->
	<nav class="tabs" aria-label="Etagen">
		<div class="tabs-left">
			{#each activePages() as page, i}
				<button
					class="tab"
					class:tab-active={i === currentIdx}
					onclick={() => goTo(i)}
					aria-current={i === currentIdx ? 'page' : undefined}
				>
					<span class="tab-label">{page.short}</span>

					<!-- Progress bar under active tab -->
					{#if i === currentIdx}
						{#key currentIdx}
							<div class="tab-progress" style="animation-duration:{AUTO_S}s;" aria-hidden="true"></div>
						{/key}
					{/if}

					<!-- Open count badge -->
					{#if page.rooms.filter(r => r.isOpen).length > 0}
						<span class="tab-badge">{page.rooms.filter(r => r.isOpen).length}</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="tabs-right">
			<!-- Global open count -->
			<div class="global-count">
				<span class="gc-dot" aria-hidden="true"></span>
				<span class="gc-n">{totalOpen}</span>
				<span class="gc-lbl">offen</span>
			</div>

	</div>
	</nav>

	<!-- ══ Page ══ -->
	{#key currentIdx}
		<div
			class="page"
			class:page-in-next={isAnimating && direction === 'next'}
			class:page-in-prev={isAnimating && direction === 'prev'}
		>
			<!-- Page header -->
			<div class="page-hdr">
				<h2 class="page-title">
					{currentPage()?.label}
					<span class="page-meta-inline">
						<span class="meta-open" class:meta-open-none={openCount() === 0}>{openCount()} geöffnet</span>
						<span class="meta-sep">·</span>
						<span class="meta-total">{currentRooms().length} Räume</span>
					</span>
				</h2>
				{#if $runnerNameStore}
					<div class="runner-row">
						<span class="runner-row-ic" aria-hidden="true">🏃</span>
						<span class="runner-row-lbl">Ansprechpartner:</span>
						<span class="runner-row-nm">{$runnerNameStore}</span>
					</div>
				{/if}
			</div>

			<!-- Room grid -->
			{#if currentRooms().length === 0}
				<div class="pg-empty">Keine Räume auf dieser Etage.</div>
			{:else}
				<div
					class="pg-grid"
					class:grid-1={currentRooms().length === 1}
					class:grid-2={currentRooms().length === 2}
					class:grid-3={currentRooms().length === 3}
				>
					{#each currentRooms() as room (room.id)}
						{@const st     = tileStatus(room)}
						{@const imgUrl = getImageUrl(room)}
						{@const hasImg = !!imgUrl}

						<button
							class="tile"
							class:tile-open={room.isOpen}
							class:tile-soon={st === 'soon'}
							class:tile-closing={st === 'closing'}
							onclick={() => handleEditRoom(room)}
							aria-label="{room.name} — {room.isOpen ? 'Geöffnet' : 'Geschlossen'}"
						>
							<!-- Full-bleed background image -->
							{#if hasImg}
								<img src={imgUrl} alt="" class="tile-img" aria-hidden="true" />
							{/if}

							<!-- Color wash — room background_color tinted in -->
							<div
								class="tile-wash"
								style="background: {room.isOpen ? room.background_color : '#1c2535'};"
								aria-hidden="true"
							></div>

							<!-- Glass overlay for readability -->
							<div class="tile-glass" aria-hidden="true"></div>

							<div class="tile-body">

								<!-- ── TOP: status pill ── -->
								<div class="tile-top">
									<div
										class="status-pill"
										class:pill-open={room.isOpen}
										class:pill-soon={st === 'soon'}
										class:pill-closing={st === 'closing'}
									>
										<span class="pill-led" aria-hidden="true"></span>
										{#if st === 'soon'}         Öffnet bald
										{:else if st === 'closing'} Schließt bald
										{:else if room.isOpen}      Geöffnet
										{:else}                     Geschlossen
										{/if}
									</div>
								</div>

								<!-- ── MID: name + activity ── -->
								<div class="tile-mid">
									<h3 class="tile-name"
										style={room.config?.title_font_size ? `font-size:${room.config.title_font_size}px;` : ''}
									>{room.name}</h3>
									{#if room.config?.activity}
										<p class="tile-activity"
											style={room.config?.text_font_size ? `font-size:${room.config.text_font_size}px;` : ''}
										>{room.config.activity}</p>
									{/if}
								</div>

								<!-- ── BOTTOM: badges ── -->
								<div class="tile-bottom">
									{#if room.person}
										<div class="tile-badge">
											<span>👤</span>
											<span>{room.person.split(',')[0].trim()}</span>
										</div>
									{/if}
									{#if room.config?.open_time && !room.isOpen}
										<div class="tile-badge tile-badge-time">
											<span>⏰</span>
											<span>{fmtTime(room.config.open_time)}</span>
										</div>
									{/if}
									{#if room.config?.close_time && room.isOpen}
										<div class="tile-badge tile-badge-close">
											<span>🔔</span>
											<span>bis {fmtTime(room.config.close_time)}</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Open ring glow -->
							{#if room.isOpen}
								<div class="tile-ring" aria-hidden="true"></div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/key}

	<!-- Nav arrows -->
	{#if activePages().length > 1}
		<button class="nav-btn nav-prev" onclick={prev} aria-label="Vorherige Etage">‹</button>
		<button class="nav-btn nav-next" onclick={next} aria-label="Nächste Etage">›</button>
	{/if}

</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

	/* ── tokens ── */
	:root {
		--pl-font: 'Plus Jakarta Sans', system-ui, sans-serif;
		--pl-open:     #22c55e;
		--pl-open-dim: rgba(34, 197, 94, 0.18);
		--pl-open-glow: rgba(34, 197, 94, 0.45);
		--pl-soon:    #eab308;
		--pl-closing: #f97316;
		--pl-tab-h:   48px;
	}

	/* ── shell ── */
	.pl {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: var(--pl-font);
		background: transparent; /* lets the app theme background show */
		position: relative;
	}

	/* ════════════════════════
	   TAB BAR
	════════════════════════ */
	.tabs {
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		height: var(--pl-tab-h);
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
		padding: 0 10px;
		gap: 4px;
		z-index: 20;
	}

	.tabs-left {
		display: flex;
		align-items: stretch;
		gap: 2px;
	}

	.tabs-right {
		display: flex;
		align-items: center;
		gap: 10px;
		padding-right: 4px;
	}

	/* individual tab */
	.tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 16px;
		background: transparent;
		border: none;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		font-family: inherit;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.5px;
		transition: color 0.2s;
		white-space: nowrap;
	}

	.tab:hover { color: rgba(255, 255, 255, 0.85); }

	.tab-active {
		color: #fff;
	}

	/* Active indicator — bottom border */
	.tab-active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 12px;
		right: 12px;
		height: 2px;
		background: var(--pl-open);
		border-radius: 2px 2px 0 0;
		box-shadow: 0 0 8px var(--pl-open-glow);
	}

	/* Progress bar that drains left-to-right under active tab */
	.tab-progress {
		position: absolute;
		bottom: 0;
		left: 12px;
		right: 12px;
		height: 2px;
		background: rgba(255,255,255,0.15);
		border-radius: 2px 2px 0 0;
		overflow: hidden;
	}

	.tab-progress::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--pl-open);
		box-shadow: 0 0 6px var(--pl-open-glow);
		transform-origin: left;
		animation: tab-drain linear forwards;
	}

	@keyframes tab-drain {
		from { transform: scaleX(1); }
		to   { transform: scaleX(0); }
	}

	/* Open-rooms badge on tab */
	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: var(--pl-open-dim);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: var(--pl-open);
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
	}

	/* Global count */
	.global-count {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 11px;
		border-radius: 20px;
		background: var(--pl-open-dim);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.gc-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--pl-open);
		box-shadow: 0 0 7px var(--pl-open-glow);
		flex-shrink: 0;
		animation: gc-blink 2.2s ease-in-out infinite;
	}

	@keyframes gc-blink {
		0%,100% { opacity: 1; }
		50%      { opacity: 0.2; }
	}

	.gc-n {
		font-size: 16px;
		font-weight: 800;
		color: var(--pl-open);
		line-height: 1;
	}

	.gc-lbl {
		font-size: 11px;
		font-weight: 600;
		color: rgba(255,255,255,0.5);
		letter-spacing: 0.3px;
	}


	/* ════════════════════════
	   PAGE
	════════════════════════ */
	.page {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 18px 20px 20px;
		min-height: 0;
		overflow: hidden;
	}

	/* Page-in animations */
	.page-in-next {
		animation: pg-next 0.38s cubic-bezier(.22,.68,0,1.12) both;
	}

	.page-in-prev {
		animation: pg-prev 0.38s cubic-bezier(.22,.68,0,1.12) both;
	}

	@keyframes pg-next {
		from { opacity: 0; transform: translateX(28px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	@keyframes pg-prev {
		from { opacity: 0; transform: translateX(-28px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	/* Page header */
	.page-hdr {
		text-align: center;
		margin-bottom: 14px;
		flex-shrink: 0;
	}

	.page-title {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: clamp(20px, 3.2vh, 30px);
		font-weight: 800;
		color: #fff;
		text-shadow: 0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5);
		letter-spacing: -0.3px;
		line-height: 1.1;
		background: rgba(0,0,0,0.45);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 10px 28px 10px;
		border-radius: 16px;
		border: 1px solid rgba(255,255,255,0.15);
	}

	.page-meta-inline {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
	}

	.meta-open {
		color: var(--pl-open);
		font-weight: 700;
	}

	.meta-open-none { color: rgba(255,255,255,0.35); }
	.meta-sep       { color: rgba(255,255,255,0.2); }
	.meta-total     { color: rgba(255,255,255,0.45); }

	/* Ansprechpartner row */
	.runner-row {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		margin-top: 7px;
		padding: 5px 16px;
		background: rgba(0,0,0,0.38);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-radius: 20px;
		border: 1px solid rgba(255,255,255,0.13);
	}

	.runner-row-ic  { font-size: 15px; line-height: 1; }

	.runner-row-lbl {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255,255,255,0.65);
	}

	.runner-row-nm {
		font-size: 13px;
		font-weight: 700;
		color: #fff;
		text-shadow: 0 1px 4px rgba(0,0,0,0.6);
	}

	/* ════════════════════════
	   GRID
	════════════════════════ */
	.pg-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 14px;
		min-height: 0;
		align-content: stretch;
	}

	/* Fewer rooms → bigger tiles */
	.grid-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
	.grid-2 { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
	.grid-3 { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr 1fr; }

	.grid-3 .tile:last-child {
		grid-column: 1 / -1;
	}

	.pg-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255,255,255,0.35);
		font-size: 15px;
		font-weight: 500;
	}

	/* ════════════════════════
	   TILE
	════════════════════════ */
	.tile {
		position: relative;
		border-radius: 18px;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		padding: 0;
		border: 2px solid transparent;
		transition:
			transform    0.2s cubic-bezier(.34,1.56,.64,1),
			box-shadow   0.2s ease,
			border-color 0.2s ease;
		background: transparent;
		min-height: 0;
	}

	/* Open tile: prominent green border + lift */
	.tile-open {
		border-color: rgba(34, 197, 94, 0.75);
		box-shadow:
			0 0 0 1px rgba(34, 197, 94, 0.15),
			0 6px 28px rgba(0, 0, 0, 0.45),
			0 0 30px rgba(34, 197, 94, 0.12);
	}

	/* Closed tile: subtle border */
	.tile:not(.tile-open) {
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
	}

	/* Soon: gold border */
	.tile-soon {
		border-color: rgba(234, 179, 8, 0.6) !important;
		box-shadow: 0 0 20px rgba(234, 179, 8, 0.15) !important;
	}

	/* Closing: orange border */
	.tile-closing {
		border-color: rgba(249, 115, 22, 0.6) !important;
		box-shadow: 0 0 20px rgba(249, 115, 22, 0.15) !important;
	}

	.tile:hover {
		transform: translateY(-4px) scale(1.012);
		box-shadow:
			0 12px 36px rgba(0, 0, 0, 0.55),
			0 0 24px rgba(34, 197, 94, 0.15);
	}

	.tile:active {
		transform: translateY(-1px) scale(0.99);
		transition-duration: 0.08s;
	}

	/* Full-bleed image */
	.tile-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
		border-radius: 16px;
	}

	/* Color wash — blends room color in */
	.tile-wash {
		position: absolute;
		inset: 0;
		z-index: 1;
		opacity: 0.82;
		transition: background 0.4s ease;
		border-radius: 16px;
	}

	/* Closed tile: stronger grey wash */
	.tile:not(.tile-open) .tile-wash {
		filter: grayscale(40%) brightness(0.75);
	}

	/* Glass layer for text readability */
	.tile-glass {
		position: absolute;
		inset: 0;
		z-index: 2;
		background: linear-gradient(
			155deg,
			rgba(255, 255, 255, 0.07) 0%,
			rgba(0, 0, 0, 0.0)        40%,
			rgba(0, 0, 0, 0.25)       100%
		);
		border-radius: 16px;
	}

	/* Body */
	.tile-body {
		position: relative;
		z-index: 5;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 14px 16px 14px;
	}

	/* ── Status pill ── */
	.tile-top { flex-shrink: 0; }

	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 11px 4px 8px;
		border-radius: 20px;
		font-size: clamp(10px, 1.3vh, 13px);
		font-weight: 700;
		letter-spacing: 0.3px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.pill-open {
		background: rgba(34, 197, 94, 0.22);
		border: 1px solid rgba(34, 197, 94, 0.45);
		color: #86efac;
		text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
	}

	.pill-soon {
		background: rgba(234, 179, 8, 0.2);
		border: 1px solid rgba(234, 179, 8, 0.4);
		color: #fde047;
	}

	.pill-closing {
		background: rgba(249, 115, 22, 0.2);
		border: 1px solid rgba(249, 115, 22, 0.4);
		color: #fdba74;
	}

	.status-pill:not(.pill-open):not(.pill-soon):not(.pill-closing) {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.55);
	}

	.pill-led {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
		background: currentColor;
	}

	.pill-open    .pill-led { animation: led-pulse 2s ease-in-out infinite; box-shadow: 0 0 6px currentColor; }
	.pill-soon    .pill-led { animation: led-pulse 1.2s ease-in-out infinite; }
	.pill-closing .pill-led { animation: led-pulse 1s ease-in-out infinite; }

	@keyframes led-pulse {
		0%,100% { opacity: 1; transform: scale(1); }
		50%      { opacity: 0.4; transform: scale(1.4); }
	}

	/* ── Name + Activity ── */
	.tile-mid {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		padding: 10px 0 6px;
	}

	.tile-name {
		margin: 0;
		font-size: clamp(18px, 3.2vh, 32px);
		font-weight: 800;
		color: #fff;
		text-shadow:
			0 2px 10px rgba(0,0,0,0.8),
			0 1px 3px rgba(0,0,0,0.6);
		line-height: 1.1;
		letter-spacing: -0.3px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	/* Closed rooms: name slightly dimmer */
	.tile:not(.tile-open) .tile-name {
		color: rgba(255,255,255,0.7);
	}

	.tile-activity {
		margin: 0;
		font-size: clamp(12px, 1.8vh, 17px);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.82);
		text-shadow: 0 1px 6px rgba(0,0,0,0.7);
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.tile:not(.tile-open) .tile-activity {
		color: rgba(255,255,255,0.45);
	}

	/* ── Badges ── */
	.tile-bottom {
		flex-shrink: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.tile-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border-radius: 20px;
		font-size: clamp(10px, 1.3vh, 13px);
		font-weight: 600;
		color: rgba(255,255,255,0.9);
		background: rgba(0,0,0,0.38);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		border: 1px solid rgba(255,255,255,0.12);
		white-space: nowrap;
	}

	.tile-badge-time  { color: #fde047; border-color: rgba(234,179,8,0.25); }
	.tile-badge-close { color: #fdba74; border-color: rgba(249,115,22,0.25); }

	/* ── Open ring ── */
	.tile-ring {
		position: absolute;
		inset: -2px;
		border-radius: 20px;
		border: 3px solid rgba(34, 197, 94, 0.55);
		pointer-events: none;
		z-index: 10;
		animation: ring-breathe 3s ease-in-out infinite;
	}

	@keyframes ring-breathe {
		0%,100% { opacity: 0.55; }
		50%      { opacity: 1; }
	}

	/* ════════════════════════
	   NAV ARROWS
	════════════════════════ */
	.nav-btn {
		position: absolute;
		top: calc(var(--pl-tab-h) + 50%);
		transform: translateY(-50%);
		width: 44px;
		height: 72px;
		background: rgba(0,0,0,0.38);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255,255,255,0.14);
		color: rgba(255,255,255,0.8);
		font-size: 28px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s, transform 0.15s;
		z-index: 30;
		line-height: 1;
		padding: 0;
	}

	.nav-prev { left: 0; border-radius: 0 12px 12px 0; }
	.nav-next { right: 0; border-radius: 12px 0 0 12px; }

	.nav-btn:hover {
		background: rgba(0,0,0,0.58);
		color: #fff;
	}

	.nav-btn:active {
		transform: translateY(-50%) scale(0.94);
	}
</style>
