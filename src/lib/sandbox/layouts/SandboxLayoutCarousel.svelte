<script lang="ts">
	import { rooms, roomStatuses, runnerName as runnerNameStore } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	// ── Page definitions (same as Canvas.svelte) ──
	const PAGE_DEFS = [
		{ id: 'dach',   label: 'Dachgeschoss', emoji: '🏠', floors: ['dach'] },
		{ id: 'og',     label: '1. & 2. OG',   emoji: '🪜', floors: ['og2', 'og1'] },
		{ id: 'eg',     label: 'Erdgeschoss',   emoji: '🚪', floors: ['eg'] },
		{ id: 'essen',  label: 'Essensbereich', emoji: '🍽️', floors: ['essen'] },
		{ id: 'extern', label: 'Außenbereich',  emoji: '🌿', floors: ['extern'] }
	];

	// ── Derive rooms by floor ──
	let allRooms = $derived(
		$rooms.map((r) => ({
			...r,
			config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		})) as RoomWithConfig[]
	);

	let roomsByFloor = $derived(() => {
		const map = new Map<string, RoomWithConfig[]>();
		for (const r of allRooms) {
			if (!map.has(r.floor)) map.set(r.floor, []);
			map.get(r.floor)!.push(r);
		}
		return map;
	});

	let activePages = $derived(() =>
		PAGE_DEFS.filter(p =>
			p.floors.some(f => (roomsByFloor().get(f)?.length ?? 0) > 0)
		).map(p => ({
			...p,
			rooms: p.floors.flatMap(f => roomsByFloor().get(f) ?? [])
		}))
	);

	// ── Pagination state ──
	let currentIdx = $state(0);
	let direction = $state<'next' | 'prev'>('next');
	let isAnimating = $state(false);
	let autoTimer: ReturnType<typeof setTimeout> | undefined;
	const AUTO_DURATION = 9; // seconds

	function goTo(idx: number) {
		if (isAnimating || idx === currentIdx) return;
		direction = idx > currentIdx ? 'next' : 'prev';
		isAnimating = true;
		currentIdx = idx;
		clearAutoTimer();
		setTimeout(() => { isAnimating = false; }, 480);
		scheduleAuto();
	}

	function next() {
		const pages = activePages();
		if (pages.length < 2) return;
		goTo((currentIdx + 1) % pages.length);
	}

	function prev() {
		const pages = activePages();
		if (pages.length < 2) return;
		goTo(currentIdx === 0 ? pages.length - 1 : currentIdx - 1);
	}

	function scheduleAuto() {
		clearAutoTimer();
		autoTimer = setTimeout(() => { next(); }, AUTO_DURATION * 1000);
	}

	function clearAutoTimer() {
		if (autoTimer) { clearTimeout(autoTimer); autoTimer = undefined; }
	}

	// Touch swipe
	let touchStartX = 0;
	function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; }
	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 50) { dx > 0 ? prev() : next(); }
	}

	onMount(() => { scheduleAuto(); });
	onDestroy(() => { clearAutoTimer(); });

	// ── Detail panel ──
	let detailRoom = $state<RoomWithConfig | null>(null);

	function openDetail(room: RoomWithConfig) {
		detailRoom = room;
		clearAutoTimer(); // pause while detail is open
	}

	function closeDetail() {
		detailRoom = null;
		scheduleAuto();
	}

	// ── Current page rooms ──
	let currentRooms = $derived(() => activePages()[currentIdx]?.rooms ?? []);
	let currentPage  = $derived(() => activePages()[currentIdx]);
	let openCount    = $derived(() => currentRooms().filter(r => r.isOpen).length);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="sc-canvas"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Raumübersicht Karussell"
>

	<!-- ── Background ambient ── -->
	<div class="sc-ambient" aria-hidden="true"></div>

	<!-- ── Top bar ── -->
	<div class="sc-topbar">
		<!-- Page tabs -->
		<nav class="sc-tabs" aria-label="Etagen-Navigation">
			{#each activePages() as page, i}
				<button
					class="sc-tab"
					class:sc-tab-active={i === currentIdx}
					onclick={() => goTo(i)}
					aria-current={i === currentIdx ? 'page' : undefined}
				>
					<span class="tab-emoji">{page.emoji}</span>
					<span class="tab-label">{page.label}</span>
					{#if i === currentIdx}
						<div class="tab-progress" style="animation-duration: {AUTO_DURATION}s;" aria-hidden="true"></div>
					{/if}
				</button>
			{/each}
		</nav>

		<!-- Runner badge -->
		{#if $runnerNameStore}
			<div class="sc-runner">
				<span class="runner-dot"></span>
				<span class="runner-text">Ansprechpartner: <strong>{$runnerNameStore}</strong></span>
			</div>
		{/if}
	</div>

	<!-- ── Page content ── -->
	{#key currentIdx}
		<div
			class="sc-page"
			class:sc-page-next={isAnimating && direction === 'next'}
			class:sc-page-prev={isAnimating && direction === 'prev'}
		>
			<!-- Page headline -->
			<div class="sc-headline">
				<div class="headline-emoji" aria-hidden="true">{currentPage()?.emoji}</div>
				<div class="headline-text">
					<h2 class="headline-title">{currentPage()?.label}</h2>
					<div class="headline-meta">
						<span class="meta-open">{openCount()} offen</span>
						<span class="meta-sep">·</span>
						<span class="meta-total">{currentRooms().length} Räume</span>
					</div>
				</div>
			</div>

			<!-- Rooms grid -->
			{#if currentRooms().length === 0}
				<div class="sc-empty">Keine Räume auf dieser Etage.</div>
			{:else}
				<div class="sc-grid" class:sc-grid-1={currentRooms().length === 1} class:sc-grid-3plus={currentRooms().length >= 3}>
					{#each currentRooms() as room (room.id)}
						<button
							class="sc-tile"
							class:tile-open={room.isOpen}
							onclick={() => openDetail(room)}
							aria-label="{room.name} — {room.isOpen ? 'geöffnet' : 'geschlossen'}. Klicken für Details."
						>
							<!-- Background image -->
							{#if room.image_url}
								<img src={room.image_url} alt="" class="tile-bg" aria-hidden="true" />
							{/if}

							<!-- Color overlay based on status -->
							<div class="tile-overlay" style="background: {room.isOpen ? room.background_color : '#374151'};" aria-hidden="true"></div>

							<!-- Content -->
							<div class="tile-content">
								<!-- Status indicator top-right -->
								<div class="tile-status-badge" class:open={room.isOpen}>
									<span class="status-pip"></span>
									{room.isOpen ? 'Offen' : 'Geschlossen'}
								</div>

								<div class="tile-body">
									<h3 class="tile-name">{room.name}</h3>
									{#if room.config?.activity}
										<p class="tile-activity">{room.config.activity}</p>
									{/if}
									{#if room.person}
										<div class="tile-person">
											<span class="person-icon">👤</span>
											{room.person.split(',')[0].trim()}
										</div>
									{/if}
								</div>

								<!-- Tap hint -->
								<div class="tile-tap-hint" aria-hidden="true">Details →</div>
							</div>

							<!-- Open glow border -->
							{#if room.isOpen}
								<div class="tile-open-ring" aria-hidden="true"></div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/key}

	<!-- ── Nav arrows ── -->
	{#if activePages().length > 1}
		<button class="sc-nav sc-nav-prev" onclick={prev} aria-label="Vorherige Etage">
			<span aria-hidden="true">‹</span>
		</button>
		<button class="sc-nav sc-nav-next" onclick={next} aria-label="Nächste Etage">
			<span aria-hidden="true">›</span>
		</button>
	{/if}

	<!-- ── Detail panel (bottom sheet) ── -->
	{#if detailRoom}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="detail-backdrop" onclick={closeDetail} transition:fade={{ duration: 200 }} aria-hidden="true"></div>

		<div class="detail-sheet" role="dialog" aria-modal="true" aria-label="Raumdetails" transition:fade={{ duration: 220 }}>
			<div class="sheet-handle" aria-hidden="true"></div>

			<div class="sheet-body">
				<!-- Room color accent -->
				<div class="sheet-accent" style="background: {detailRoom.isOpen ? detailRoom.background_color : '#374151'};"></div>

				<div class="sheet-info">
					<div class="sheet-header">
						<div>
							<div class="sheet-floor">{PAGE_DEFS.find(p => p.floors.includes(detailRoom!.floor))?.label ?? detailRoom.floor}</div>
							<h2 class="sheet-name">{detailRoom.name}</h2>
						</div>
						<div class="sheet-status" class:open={detailRoom.isOpen}>
							<span class="sheet-status-pip"></span>
							{detailRoom.isOpen ? 'Geöffnet' : 'Geschlossen'}
						</div>
					</div>

					{#if detailRoom.config?.activity || detailRoom.person}
						<div class="sheet-details">
							{#if detailRoom.config?.activity}
								<div class="sheet-detail-row">
									<span class="sheet-detail-icon">📌</span>
									<span class="sheet-detail-text">{detailRoom.config.activity}</span>
								</div>
							{/if}
							{#if detailRoom.person}
								<div class="sheet-detail-row">
									<span class="sheet-detail-icon">👤</span>
									<span class="sheet-detail-text">{detailRoom.person}</span>
								</div>
							{/if}
						</div>
					{/if}

					<div class="sheet-actions">
						<button
							class="sheet-edit-btn"
							onclick={() => { handleEditRoom(detailRoom!); closeDetail(); }}
						>
							✏️ Raum bearbeiten
						</button>
						<button class="sheet-close-btn" onclick={closeDetail} aria-label="Schließen">
							✕
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300&family=DM+Sans:wght@400;500;600&display=swap');

	/* ── Tokens ── */
	:root {
		--sc-font-display: 'Fraunces', Georgia, serif;
		--sc-font-body: 'DM Sans', sans-serif;
		--sc-bg: transparent;
		--sc-glass: rgba(10, 14, 22, 0.72);
		--sc-border: rgba(255, 255, 255, 0.1);
		--sc-text: rgba(240, 245, 255, 0.95);
		--sc-text-dim: rgba(180, 200, 230, 0.55);
		--sc-open: #4ade80;
		--sc-open-glow: rgba(74, 222, 128, 0.3);
		--sc-accent: #93c5fd;
	}

	/* ── Canvas ── */
	.sc-canvas {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: var(--sc-font-body);
	}

	/* ── Ambient background glow ── */
	.sc-ambient {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background:
			radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59, 130, 246, 0.07) 0%, transparent 60%),
			radial-gradient(ellipse 60% 80% at 80% 90%, rgba(139, 92, 246, 0.06) 0%, transparent 60%);
	}

	/* ── Top bar ── */
	.sc-topbar {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 16px 0;
		flex-shrink: 0;
	}

	/* ── Page tabs ── */
	.sc-tabs {
		display: flex;
		gap: 4px;
		flex: 1;
	}

	.sc-tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px 10px;
		border-radius: 10px 10px 0 0;
		border: 1px solid var(--sc-border);
		border-bottom: none;
		background: rgba(255, 255, 255, 0.04);
		color: var(--sc-text-dim);
		cursor: pointer;
		font-family: var(--sc-font-body);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.2px;
		transition: background 0.2s, color 0.2s;
		overflow: hidden;
	}

	.sc-tab:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--sc-text);
	}

	.sc-tab-active {
		background: rgba(255, 255, 255, 0.1);
		color: var(--sc-text);
		border-color: rgba(255, 255, 255, 0.18);
	}

	.tab-emoji {
		font-size: 14px;
		line-height: 1;
	}

	.tab-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Progress bar inside active tab */
	.tab-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		background: var(--sc-accent);
		animation: tab-progress linear forwards;
		box-shadow: 0 0 6px var(--sc-accent);
	}

	@keyframes tab-progress {
		from { width: 0%; }
		to   { width: 100%; }
	}

	/* ── Runner badge ── */
	.sc-runner {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 6px 14px;
		background: var(--sc-glass);
		border: 1px solid var(--sc-border);
		border-radius: 8px;
		font-size: 12px;
		color: var(--sc-text);
		flex-shrink: 0;
		align-self: center;
		margin-bottom: 2px;
	}

	.runner-dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--sc-open);
		box-shadow: 0 0 6px var(--sc-open);
		flex-shrink: 0;
		animation: runner-blink 3s ease-in-out infinite;
	}

	@keyframes runner-blink {
		0%, 85%, 100% { opacity: 1; }
		90% { opacity: 0.1; }
	}

	.runner-text {
		color: rgba(200, 220, 245, 0.7);
	}

	.runner-text strong {
		color: var(--sc-text);
		font-weight: 600;
	}

	/* ── Page content ── */
	.sc-page {
		position: relative;
		z-index: 5;
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 16px 70px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin: 0 0 0 0;
	}

	.sc-page-next {
		animation: page-slide-next 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	}

	.sc-page-prev {
		animation: page-slide-prev 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	}

	@keyframes page-slide-next {
		from { opacity: 0; transform: translateX(40px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	@keyframes page-slide-prev {
		from { opacity: 0; transform: translateX(-40px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	/* ── Page headline ── */
	.sc-headline {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 4px 16px;
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		margin-bottom: 18px;
	}

	.headline-emoji {
		font-size: 36px;
		line-height: 1;
		filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
	}

	.headline-title {
		font-family: var(--sc-font-display);
		font-size: 30px;
		font-weight: 600;
		color: var(--sc-text);
		margin: 0 0 3px;
		line-height: 1.1;
		letter-spacing: -0.3px;
	}

	.headline-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-family: var(--sc-font-body);
	}

	.meta-open { color: var(--sc-open); font-weight: 600; }
	.meta-sep  { color: var(--sc-text-dim); }
	.meta-total { color: var(--sc-text-dim); }

	/* ── Rooms grid ── */
	.sc-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 14px;
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
		min-height: 0;
	}

	/* Single room: full width */
	.sc-grid-1 {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		max-width: 500px;
	}

	/* 3+ rooms: keep 2-col but allow wrap */
	.sc-grid-3plus {
		grid-template-rows: auto;
		align-content: start;
	}

	/* ── Room tile ── */
	.sc-tile {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(20, 30, 50, 0.7);
		display: flex;
		flex-direction: column;
		text-align: left;
		transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
		min-height: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-tile:active {
		transform: scale(0.97);
	}

	.sc-tile.tile-open {
		border-color: rgba(74, 222, 128, 0.25);
	}

	.sc-tile.tile-open:active {
		box-shadow: 0 0 24px rgba(74, 222, 128, 0.2);
	}

	/* Background image */
	.tile-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.18;
		z-index: 0;
	}

	/* Color overlay */
	.tile-overlay {
		position: absolute;
		inset: 0;
		opacity: 0.35;
		z-index: 1;
		transition: opacity 0.3s;
	}

	/* Content layer */
	.tile-content {
		position: relative;
		z-index: 2;
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 14px 16px 14px;
	}

	/* Status badge top-right */
	.tile-status-badge {
		align-self: flex-end;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px 3px 7px;
		border-radius: 20px;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(100, 116, 139, 0.4);
		font-size: 10px;
		font-weight: 600;
		color: rgba(148, 163, 184, 0.9);
		letter-spacing: 0.3px;
		margin-bottom: 10px;
	}

	.tile-status-badge.open {
		background: rgba(74, 222, 128, 0.12);
		border-color: rgba(74, 222, 128, 0.35);
		color: #86efac;
	}

	.status-pip {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 4px currentColor;
	}

	.tile-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.tile-name {
		font-family: var(--sc-font-display);
		font-size: 20px;
		font-weight: 600;
		color: var(--sc-text);
		margin: 0 0 5px;
		line-height: 1.2;
		text-shadow: 0 2px 8px rgba(0,0,0,0.7);
	}

	.tile-activity {
		font-size: 12px;
		color: rgba(200, 220, 245, 0.75);
		margin: 0 0 6px;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.tile-person {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		color: rgba(180, 200, 230, 0.65);
	}

	.person-icon { font-size: 12px; }

	/* Tap hint bottom-right */
	.tile-tap-hint {
		position: absolute;
		bottom: 12px;
		right: 14px;
		font-size: 10px;
		color: rgba(180, 200, 230, 0.35);
		font-family: var(--sc-font-body);
		letter-spacing: 0.5px;
		transition: color 0.2s;
	}

	.sc-tile:hover .tile-tap-hint {
		color: rgba(180, 200, 230, 0.65);
	}

	/* Open glow ring */
	.tile-open-ring {
		position: absolute;
		inset: 0;
		border-radius: 16px;
		border: 2px solid rgba(74, 222, 128, 0.4);
		pointer-events: none;
		animation: tile-ring-pulse 3s ease-in-out infinite;
	}

	@keyframes tile-ring-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	/* ── Nav arrows ── */
	.sc-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 44px;
		height: 72px;
		background: var(--sc-glass);
		border: 1px solid var(--sc-border);
		color: var(--sc-text);
		font-size: 32px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		transition: background 0.2s;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-nav:active { background: rgba(255,255,255,0.12); }

	.sc-nav-prev { left: 0; border-radius: 0 10px 10px 0; }
	.sc-nav-next { right: 0; border-radius: 10px 0 0 10px; }

	/* ── Empty ── */
	.sc-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: var(--sc-text-dim);
		letter-spacing: 0.5px;
	}

	/* ── Detail bottom sheet ── */
	.detail-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 40;
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	.detail-sheet {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 50;
		background: rgba(8, 16, 30, 0.97);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 20px 20px 0 0;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.6);
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.2);
		margin: 12px auto 0;
	}

	.sheet-body {
		display: flex;
		gap: 0;
		overflow: hidden;
		border-radius: 16px 16px 0 0;
		margin-top: 12px;
	}

	.sheet-accent {
		width: 5px;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.sheet-info {
		flex: 1;
		padding: 16px 20px 20px;
	}

	.sheet-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}

	.sheet-floor {
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--sc-text-dim);
		font-family: 'DM Mono', monospace;
		margin-bottom: 3px;
	}

	.sheet-name {
		font-family: var(--sc-font-display);
		font-size: 26px;
		font-weight: 700;
		color: var(--sc-text);
		margin: 0;
		line-height: 1.1;
	}

	.sheet-status {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		border-radius: 20px;
		background: rgba(71, 85, 105, 0.3);
		border: 1px solid rgba(100, 116, 139, 0.3);
		font-size: 11px;
		font-weight: 600;
		color: rgba(148, 163, 184, 0.9);
		white-space: nowrap;
		flex-shrink: 0;
		margin-top: 4px;
	}

	.sheet-status.open {
		background: rgba(74, 222, 128, 0.1);
		border-color: rgba(74, 222, 128, 0.3);
		color: #86efac;
	}

	.sheet-status-pip {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 5px currentColor;
	}

	.sheet-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
		padding: 12px 14px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.07);
	}

	.sheet-detail-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 13px;
		color: rgba(200, 220, 245, 0.8);
		line-height: 1.4;
	}

	.sheet-detail-icon {
		font-size: 14px;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.sheet-detail-text {
		flex: 1;
	}

	.sheet-actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.sheet-edit-btn {
		flex: 1;
		padding: 12px 20px;
		border-radius: 12px;
		border: 1px solid rgba(147, 197, 253, 0.3);
		background: rgba(147, 197, 253, 0.1);
		color: var(--sc-accent);
		font-family: var(--sc-font-body);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.sheet-edit-btn:active {
		background: rgba(147, 197, 253, 0.2);
	}

	.sheet-close-btn {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		border: 1px solid var(--sc-border);
		background: rgba(255, 255, 255, 0.05);
		color: var(--sc-text-dim);
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.sheet-close-btn:active {
		background: rgba(255, 255, 255, 0.1);
	}

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.sc-topbar { padding: 8px 10px 0; }
		.sc-tab { padding: 6px 10px 8px; font-size: 11px; }
		.tab-emoji { font-size: 12px; }
		.sc-page { padding: 0 10px 60px; }
		.sc-headline { padding: 12px 2px 12px; margin-bottom: 12px; }
		.headline-emoji { font-size: 28px; }
		.headline-title { font-size: 24px; }
		.sc-grid { gap: 10px; }
		.tile-name { font-size: 16px; }
		.sheet-name { font-size: 22px; }
	}

	@media (max-width: 480px) {
		.sc-tabs { gap: 2px; }
		.sc-tab { padding: 5px 8px 7px; }
		.tab-label { display: none; }
		.sc-grid { gap: 8px; }
		.tile-content { padding: 10px 12px; }
	}
</style>
