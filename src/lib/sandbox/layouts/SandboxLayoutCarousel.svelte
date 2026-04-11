<script lang="ts">
	import { rooms, roomStatuses, runnerName as runnerNameStore, currentTime } from '$lib/stores/appState';
	import type { RoomWithConfig } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	// ── Page definitions ──
	const PAGE_DEFS = [
		{ id: 'dach',   label: 'Dachgeschoss', emoji: '🏠', floors: ['dach'] },
		{ id: 'og',     label: '1. & 2. OG',   emoji: '🪜', floors: ['og2', 'og1'] },
		{ id: 'eg',     label: 'Erdgeschoss',   emoji: '🚪', floors: ['eg'] },
		{ id: 'essen',  label: 'Essensbereich', emoji: '🍽️', floors: ['essen'] },
		{ id: 'extern', label: 'Außenbereich',  emoji: '🌿', floors: ['extern'] }
	];

	// ── Sandbox simulation: local overrides for open/closed status ──
	// Key = room.id, Value = true (open) | false (closed) | undefined (use real status)
	let simOverrides = $state(new Map<string, boolean>());

	function toggleSim(id: string, currentIsOpen: boolean) {
		const m = new Map(simOverrides);
		// If already overridden, remove override (reset to real status)
		if (m.has(id)) {
			m.delete(id);
		} else {
			m.set(id, !currentIsOpen);
		}
		simOverrides = m;
	}

	function resetAllSim() {
		simOverrides = new Map();
	}

	// ── Derive rooms, applying sim overrides ──
	let allRooms = $derived(
		$rooms.map((r) => {
			const realStatus = $roomStatuses.get(r.id);
			const realIsOpen = realStatus?.is_open ?? false;
			const simIsOpen = simOverrides.has(r.id) ? simOverrides.get(r.id)! : realIsOpen;
			return {
				...r,
				config: null,
				status: realStatus ?? null,
				isOpen: simIsOpen,
				isSimulated: simOverrides.has(r.id)
			} as RoomWithConfig & { isSimulated: boolean };
		})
	);

	let roomsByFloor = $derived(() => {
		const map = new Map<string, (RoomWithConfig & { isSimulated: boolean })[]>();
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

	// ── Pagination ──
	let currentIdx = $state(0);
	let direction = $state<'next' | 'prev'>('next');
	let isAnimating = $state(false);
	let autoTimer: ReturnType<typeof setTimeout> | undefined;
	const AUTO_DURATION = 10;

	function goTo(idx: number) {
		if (isAnimating || idx === currentIdx) return;
		direction = idx > currentIdx ? 'next' : 'prev';
		isAnimating = true;
		currentIdx = idx;
		clearAutoTimer();
		setTimeout(() => { isAnimating = false; }, 450);
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

	// ── Side panel detail ──
	let panelRoom = $state<(RoomWithConfig & { isSimulated: boolean }) | null>(null);

	function openPanel(room: RoomWithConfig & { isSimulated: boolean }) {
		panelRoom = room;
		clearAutoTimer();
	}

	function closePanel() {
		panelRoom = null;
		scheduleAuto();
	}

	// Keep panel in sync when simOverrides change
	$effect(() => {
		if (panelRoom) {
			const updated = allRooms.find(r => r.id === panelRoom!.id);
			if (updated) panelRoom = updated as RoomWithConfig & { isSimulated: boolean };
		}
	});

	// ── Time helpers ──
	function parseMinutes(t: string | null | undefined): number | null {
		if (!t) return null;
		const [h, m] = t.split(':').map(Number);
		if (isNaN(h) || isNaN(m)) return null;
		return h * 60 + m;
	}

	function nowMinutes(): number {
		const t = $currentTime;
		return t.getHours() * 60 + t.getMinutes();
	}

	function formatTime(t: string | null | undefined): string {
		if (!t) return '';
		return t.substring(0, 5);
	}

	// Timeline percentage for open_time..close_time bar (7:00–20:00 range)
	const DAY_START = 7 * 60;
	const DAY_END   = 20 * 60;
	const DAY_RANGE = DAY_END - DAY_START;

	function timelinePos(minutes: number): number {
		return Math.max(0, Math.min(100, ((minutes - DAY_START) / DAY_RANGE) * 100));
	}

	function nowTimelinePos(): number {
		return timelinePos(nowMinutes());
	}

	function openStatus(room: RoomWithConfig): 'open' | 'closed' | 'soon' | 'closing' {
		const open  = parseMinutes(room.config?.open_time);
		const close = parseMinutes(room.config?.close_time);
		const now   = nowMinutes();
		if (!room.isOpen) {
			if (open !== null && open - now > 0 && open - now <= 10) return 'soon';
			return 'closed';
		}
		if (close !== null && close - now > 0 && close - now <= 10) return 'closing';
		return 'open';
	}

	// ── Current page derived ──
	let currentRooms = $derived(() => activePages()[currentIdx]?.rooms ?? []);
	let currentPage  = $derived(() => activePages()[currentIdx]);
	let openCount    = $derived(() => currentRooms().filter(r => r.isOpen).length);
	let simCount     = $derived(() => simOverrides.size);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="sc-canvas"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Raumübersicht Karussell"
>
	<!-- Ambient glow -->
	<div class="sc-ambient" aria-hidden="true"></div>

	<!-- ── Top bar ── -->
	<div class="sc-topbar">
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
						{#key currentIdx}
							<div class="tab-progress" style="animation-duration: {AUTO_DURATION}s;" aria-hidden="true"></div>
						{/key}
					{/if}
				</button>
			{/each}
		</nav>

		<div class="sc-topbar-right">
			<!-- Sim indicator -->
			{#if simCount > 0}
				<button class="sim-reset-btn" onclick={resetAllSim} title="Alle Simulationen zurücksetzen">
					<span class="sim-icon">⚗️</span>
					{simCount} simuliert
					<span class="sim-reset-x">✕</span>
				</button>
			{/if}
			<!-- Runner badge -->
			{#if $runnerNameStore}
				<div class="sc-runner">
					<span class="runner-dot"></span>
					<span class="runner-text">Ansprechpartner: <strong>{$runnerNameStore}</strong></span>
				</div>
			{/if}
		</div>
	</div>

	<!-- ── Page ── -->
	{#key currentIdx}
		<div
			class="sc-page"
			class:sc-page-next={isAnimating && direction === 'next'}
			class:sc-page-prev={isAnimating && direction === 'prev'}
		>
			<!-- Floor headline -->
			<div class="sc-headline">
				<span class="headline-emoji" aria-hidden="true">{currentPage()?.emoji}</span>
				<div class="headline-text">
					<h2 class="headline-title">{currentPage()?.label}</h2>
					<div class="headline-meta">
						<span class="meta-open">{openCount()} geöffnet</span>
						<span class="meta-sep">·</span>
						<span class="meta-total">{currentRooms().length} Räume</span>
					</div>
				</div>
			</div>

			<!-- Grid -->
			{#if currentRooms().length === 0}
				<div class="sc-empty">Keine Räume auf dieser Etage.</div>
			{:else}
				<div
					class="sc-grid"
					class:sc-grid-1={currentRooms().length === 1}
					class:sc-grid-2={currentRooms().length === 2}
				>
					{#each currentRooms() as room (room.id)}
						{@const status = openStatus(room)}
						<button
							class="sc-tile"
							class:tile-open={room.isOpen}
							class:tile-soon={status === 'soon'}
							class:tile-closing={status === 'closing'}
							class:tile-simulated={room.isSimulated}
							onclick={() => openPanel(room)}
							aria-label="{room.name} — Details"
						>
							<!-- Background image -->
							{#if room.image_url}
								<img src={room.image_url} alt="" class="tile-bg" aria-hidden="true" />
							{/if}

							<!-- Color wash -->
							<div
								class="tile-wash"
								style="background: {room.isOpen ? room.background_color : '#1e293b'};"
								aria-hidden="true"
							></div>

							<div class="tile-inner">
								<!-- Top row: status + sim indicator -->
								<div class="tile-top">
									<div class="tile-status-pill" class:open={room.isOpen} class:soon={status === 'soon'} class:closing={status === 'closing'}>
										<span class="pill-dot"></span>
										{#if status === 'soon'}   Öffnet bald
										{:else if status === 'closing'} Schließt bald
										{:else if room.isOpen}   Geöffnet
										{:else}                  Geschlossen
										{/if}
									</div>
									{#if room.isSimulated}
										<span class="tile-sim-badge" title="Simuliert">⚗️</span>
									{/if}
								</div>

								<!-- Center: room name -->
								<div class="tile-mid">
									<h3 class="tile-name">{room.name}</h3>
									{#if room.config?.activity}
										<p class="tile-activity">{room.config.activity}</p>
									{/if}
								</div>

								<!-- Bottom row: person + open time -->
								<div class="tile-bottom">
									{#if room.person}
										<div class="tile-person-badge">
											<span class="person-avatar">👤</span>
											<span class="person-name">{room.person.split(',')[0].trim()}</span>
										</div>
									{/if}
									{#if room.config?.open_time && !room.isOpen}
										<div class="tile-time-badge">
											<span>⏰</span>
											<span>Öffnet {formatTime(room.config.open_time)}</span>
										</div>
									{/if}
									{#if room.config?.close_time && room.isOpen}
										<div class="tile-time-badge closing">
											<span>🔔</span>
											<span>Bis {formatTime(room.config.close_time)}</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Open ring pulse -->
							{#if room.isOpen}
								<div class="tile-open-ring" aria-hidden="true"></div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/key}

	<!-- Nav arrows -->
	{#if activePages().length > 1}
		<button class="sc-nav sc-nav-prev" onclick={prev} aria-label="Vorherige Etage">‹</button>
		<button class="sc-nav sc-nav-next" onclick={next} aria-label="Nächste Etage">›</button>
	{/if}

	<!-- ── Side panel ── -->
	{#if panelRoom}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="panel-backdrop"
			onclick={closePanel}
			transition:fade={{ duration: 180 }}
			aria-hidden="true"
		></div>

		<div
			class="side-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Raumdetails"
			transition:fly={{ x: 340, duration: 300, opacity: 1 }}
		>
			<!-- Color stripe -->
			<div
				class="panel-stripe"
				style="background: {panelRoom.isOpen ? panelRoom.background_color : '#334155'};"
			></div>

			<div class="panel-content">
				<!-- Header -->
				<div class="panel-header">
					<div class="panel-header-left">
						<div class="panel-floor-label">
							{PAGE_DEFS.find(p => p.floors.includes(panelRoom.floor))?.label ?? panelRoom.floor}
						</div>
						<h2 class="panel-room-name">{panelRoom.name}</h2>
					</div>
					<button class="panel-close" onclick={closePanel} aria-label="Schließen">✕</button>
				</div>

				<!-- Status badge -->
				<div class="panel-status-row">
					{@const st = openStatus(panelRoom)}
					<div class="panel-status-badge" class:open={panelRoom.isOpen} class:soon={st === 'soon'} class:closing={st === 'closing'}>
						<span class="status-pip"></span>
						{#if st === 'soon'}        Öffnet bald
						{:else if st === 'closing'} Schließt bald
						{:else if panelRoom.isOpen} Geöffnet
						{:else}                     Geschlossen
						{/if}
					</div>
					{#if panelRoom.isSimulated}
						<span class="panel-sim-tag">⚗️ Simuliert</span>
					{/if}
				</div>

				<!-- ── Sandbox simulation toggle ── -->
				<div class="panel-section">
					<div class="section-label">🧪 Sandbox-Simulation</div>
					<div class="sim-toggle-block">
						<p class="sim-desc">Status lokal simulieren — keine Datenbankänderung.</p>
						<button
							class="sim-toggle-btn"
							class:sim-open={!panelRoom.isOpen}
							class:sim-close={panelRoom.isOpen}
							onclick={() => toggleSim(panelRoom.id, panelRoom.isOpen)}
						>
							{#if panelRoom.isSimulated}
								↩ Simulation zurücksetzen
							{:else if panelRoom.isOpen}
								🔴 Als geschlossen simulieren
							{:else}
								🟢 Als geöffnet simulieren
							{/if}
						</button>
					</div>
				</div>

				<div class="panel-divider"></div>

				<!-- ── Öffnungszeiten-Timeline ── -->
				{#if panelRoom.config?.open_time}
					<div class="panel-section">
						<div class="section-label">🕐 Öffnungszeiten</div>
						<div class="time-row">
							<div class="time-chip open-chip">
								<span class="time-chip-icon">🟢</span>
								{formatTime(panelRoom.config.open_time)}
							</div>
							{#if panelRoom.config.close_time}
								<div class="time-arrow">→</div>
								<div class="time-chip close-chip">
									<span class="time-chip-icon">🔴</span>
									{formatTime(panelRoom.config.close_time)}
								</div>
							{/if}
						</div>

						<!-- Timeline bar -->
						{#if panelRoom.config.open_time}
							{@const openPct  = timelinePos(parseMinutes(panelRoom.config.open_time) ?? DAY_START)}
							{@const closePct = timelinePos(parseMinutes(panelRoom.config.close_time) ?? DAY_END)}
							{@const nowPct   = nowTimelinePos()}
							<div class="timeline-wrap">
								<div class="timeline-track">
									<!-- Active segment -->
									<div
										class="timeline-fill"
										class:fill-open={panelRoom.isOpen}
										style="left: {openPct}%; width: {closePct - openPct}%;"
									></div>
									<!-- Now marker -->
									<div class="timeline-now" style="left: {nowPct}%;"></div>
								</div>
								<div class="timeline-labels">
									<span>07:00</span>
									<span>20:00</span>
								</div>
							</div>
						{/if}
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ── Person ── -->
				{#if panelRoom.person}
					<div class="panel-section">
						<div class="section-label">👤 Person im Raum</div>
						<div class="person-list">
							{#each panelRoom.person.split(',').map(p => p.trim()).filter(p => p) as p}
								<div class="person-chip">
									<span class="person-avatar-lg">👤</span>
									<span class="person-chip-name">{p}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ── Aktivität ── -->
				{#if panelRoom.config?.activity}
					<div class="panel-section">
						<div class="section-label">📌 Aktivität</div>
						<p class="panel-activity">{panelRoom.config.activity}</p>
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ── Actions ── -->
				<div class="panel-actions">
					<button
						class="panel-edit-btn"
						onclick={() => { handleEditRoom(panelRoom); closePanel(); }}
					>
						✏️ Raum bearbeiten
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

	:root {
		--sc-display: 'Fraunces', Georgia, serif;
		--sc-body:    'DM Sans', sans-serif;
		--sc-mono:    'DM Mono', monospace;
		--sc-glass:   rgba(8, 14, 26, 0.75);
		--sc-border:  rgba(255, 255, 255, 0.09);
		--sc-text:    rgba(235, 243, 255, 0.95);
		--sc-dim:     rgba(160, 185, 220, 0.5);
		--sc-open:    #4ade80;
		--sc-accent:  #93c5fd;
		--sc-sim:     #fbbf24;
	}

	/* ── Canvas ── */
	.sc-canvas {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: var(--sc-body);
	}

	.sc-ambient {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background:
			radial-gradient(ellipse 70% 50% at 15% 5%, rgba(59, 130, 246, 0.08) 0%, transparent 55%),
			radial-gradient(ellipse 50% 70% at 85% 95%, rgba(139, 92, 246, 0.07) 0%, transparent 55%);
	}

	/* ── Top bar ── */
	.sc-topbar {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 14px 0;
		flex-shrink: 0;
	}

	.sc-tabs {
		display: flex;
		gap: 3px;
		flex: 1;
		min-width: 0;
	}

	.sc-tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 7px 13px 9px;
		border-radius: 9px 9px 0 0;
		border: 1px solid var(--sc-border);
		border-bottom: none;
		background: rgba(255, 255, 255, 0.03);
		color: var(--sc-dim);
		cursor: pointer;
		font-family: var(--sc-body);
		font-size: 12px;
		font-weight: 500;
		transition: background 0.18s, color 0.18s;
		overflow: hidden;
		white-space: nowrap;
	}

	.sc-tab:hover { background: rgba(255,255,255,0.07); color: var(--sc-text); }

	.sc-tab-active {
		background: rgba(255, 255, 255, 0.09);
		color: var(--sc-text);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.tab-emoji { font-size: 13px; line-height: 1; }
	.tab-label { overflow: hidden; text-overflow: ellipsis; }

	.tab-progress {
		position: absolute;
		bottom: 0; left: 0;
		height: 2px;
		background: var(--sc-accent);
		box-shadow: 0 0 6px var(--sc-accent);
		animation: tab-prog linear forwards;
	}
	@keyframes tab-prog { from { width: 0; } to { width: 100%; } }

	/* Top bar right */
	.sc-topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		padding-bottom: 2px;
	}

	/* Sim reset button */
	.sim-reset-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 11px;
		border-radius: 8px;
		border: 1px solid rgba(251, 191, 36, 0.35);
		background: rgba(251, 191, 36, 0.1);
		color: var(--sc-sim);
		font-family: var(--sc-mono);
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.sim-reset-btn:hover { background: rgba(251,191,36,0.18); }
	.sim-icon { font-size: 13px; }
	.sim-reset-x { opacity: 0.6; margin-left: 2px; }

	/* Runner badge */
	.sc-runner {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		background: var(--sc-glass);
		border: 1px solid var(--sc-border);
		border-radius: 8px;
		font-size: 11px;
		color: var(--sc-text);
	}

	.runner-dot {
		display: block;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: var(--sc-open);
		box-shadow: 0 0 5px var(--sc-open);
		flex-shrink: 0;
		animation: blink-dot 3s ease-in-out infinite;
	}
	@keyframes blink-dot { 0%,85%,100% { opacity:1; } 90% { opacity:0.1; } }

	.runner-text { color: var(--sc-dim); }
	.runner-text strong { color: var(--sc-text); font-weight: 600; }

	/* ── Page ── */
	.sc-page {
		position: relative;
		z-index: 5;
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 14px 66px;
		overflow: hidden;
		background: rgba(255,255,255,0.04);
		border-top: 1px solid rgba(255,255,255,0.08);
		min-height: 0;
	}

	.sc-page-next { animation: slide-next 0.42s cubic-bezier(.25,.46,.45,.94) both; }
	.sc-page-prev { animation: slide-prev 0.42s cubic-bezier(.25,.46,.45,.94) both; }

	@keyframes slide-next { from { opacity:0; transform:translateX(36px); } to { opacity:1; transform:translateX(0); } }
	@keyframes slide-prev { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }

	/* ── Floor headline ── */
	.sc-headline {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 4px 12px;
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		margin-bottom: 14px;
	}

	.headline-emoji { font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5)); }

	.headline-title {
		font-family: var(--sc-display);
		font-size: 26px;
		font-weight: 600;
		color: var(--sc-text);
		margin: 0 0 2px;
		line-height: 1.1;
		letter-spacing: -0.2px;
	}

	.headline-meta { display: flex; align-items: center; gap: 5px; font-size: 11px; }
	.meta-open   { color: var(--sc-open); font-weight: 600; }
	.meta-sep    { color: var(--sc-dim); }
	.meta-total  { color: var(--sc-dim); }

	/* ── Grid ── */
	.sc-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 12px;
		max-width: 980px;
		width: 100%;
		margin: 0 auto;
		min-height: 0;
	}

	.sc-grid-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; max-width: 480px; }
	.sc-grid-2 { grid-template-rows: 1fr; }

	.sc-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: var(--sc-dim);
		letter-spacing: 0.5px;
	}

	/* ── Room tile ── */
	.sc-tile {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		cursor: pointer;
		border: 1px solid rgba(255,255,255,0.08);
		background: rgba(15, 23, 42, 0.8);
		display: flex;
		flex-direction: column;
		text-align: left;
		min-height: 0;
		transition: border-color 0.2s, transform 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-tile:active { transform: scale(0.975); }
	.sc-tile.tile-open { border-color: rgba(74, 222, 128, 0.22); }
	.sc-tile.tile-soon { border-color: rgba(251, 191, 36, 0.3); }
	.sc-tile.tile-closing { border-color: rgba(251, 146, 60, 0.3); }
	.sc-tile.tile-simulated { border-color: rgba(251, 191, 36, 0.4); }

	.tile-bg {
		position: absolute;
		inset: 0;
		width: 100%; height: 100%;
		object-fit: cover;
		opacity: 0.15;
		z-index: 0;
	}

	.tile-wash {
		position: absolute;
		inset: 0;
		opacity: 0.28;
		z-index: 1;
		transition: background 0.4s;
	}

	.tile-inner {
		position: relative;
		z-index: 2;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 12px 14px 13px;
		gap: 6px;
		min-height: 0;
	}

	/* Top: status pill + sim icon */
	.tile-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tile-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px 3px 7px;
		border-radius: 20px;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.2px;
		border: 1px solid rgba(100,116,139,0.35);
		background: rgba(15,23,42,0.6);
		color: rgba(148,163,184,0.9);
	}

	.tile-status-pill.open {
		border-color: rgba(74,222,128,0.35);
		background: rgba(74,222,128,0.08);
		color: #86efac;
	}

	.tile-status-pill.soon, .tile-status-pill.closing {
		border-color: rgba(251,191,36,0.35);
		background: rgba(251,191,36,0.08);
		color: #fde68a;
	}

	.pill-dot {
		display: block;
		width: 5px; height: 5px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 4px currentColor;
	}

	.tile-sim-badge {
		font-size: 14px;
		filter: drop-shadow(0 0 4px rgba(251,191,36,0.5));
	}

	/* Mid: name + activity */
	.tile-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; }

	.tile-name {
		font-family: var(--sc-display);
		font-size: 19px;
		font-weight: 600;
		color: var(--sc-text);
		margin: 0 0 4px;
		line-height: 1.2;
		text-shadow: 0 2px 8px rgba(0,0,0,0.7);
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.tile-activity {
		font-size: 11px;
		color: rgba(190,215,245,0.65);
		margin: 0;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	/* Bottom: badges */
	.tile-bottom {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		align-items: center;
	}

	.tile-person-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 5px;
		border-radius: 10px;
		background: rgba(255,255,255,0.08);
		border: 1px solid rgba(255,255,255,0.1);
		font-size: 10px;
		color: rgba(200,220,245,0.8);
	}

	.person-avatar { font-size: 10px; }
	.person-name   { font-weight: 500; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; }

	.tile-time-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 5px;
		border-radius: 10px;
		background: rgba(251,191,36,0.08);
		border: 1px solid rgba(251,191,36,0.2);
		font-size: 10px;
		font-family: var(--sc-mono);
		color: #fde68a;
	}

	.tile-time-badge.closing {
		background: rgba(251,146,60,0.08);
		border-color: rgba(251,146,60,0.2);
		color: #fed7aa;
	}

	/* Open ring */
	.tile-open-ring {
		position: absolute;
		inset: 0;
		border-radius: 16px;
		border: 2px solid rgba(74,222,128,0.35);
		pointer-events: none;
		animation: ring-pulse 3s ease-in-out infinite;
	}

	@keyframes ring-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

	/* ── Nav arrows ── */
	.sc-nav {
		position: absolute;
		top: 50%; transform: translateY(-50%);
		width: 42px; height: 68px;
		background: var(--sc-glass);
		border: 1px solid var(--sc-border);
		color: var(--sc-text);
		font-size: 30px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		transition: background 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-nav:active { background: rgba(255,255,255,0.1); }
	.sc-nav-prev { left: 0; border-radius: 0 10px 10px 0; }
	.sc-nav-next { right: 0; border-radius: 10px 0 0 10px; }

	/* ── Panel backdrop ── */
	.panel-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,0.45);
		z-index: 40;
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	/* ── Side panel ── */
	.side-panel {
		position: absolute;
		top: 0; right: 0; bottom: 0;
		width: min(340px, 92vw);
		z-index: 50;
		background: rgba(6, 12, 24, 0.97);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border-left: 1px solid rgba(255,255,255,0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-stripe {
		height: 4px;
		width: 100%;
		flex-shrink: 0;
		transition: background 0.4s;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 20px 20px 28px;
		display: flex;
		flex-direction: column;
		gap: 0;
		scrollbar-width: thin;
		scrollbar-color: rgba(255,255,255,0.1) transparent;
	}

	/* Panel header */
	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 12px;
	}

	.panel-floor-label {
		font-family: var(--sc-mono);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--sc-dim);
		margin-bottom: 4px;
	}

	.panel-room-name {
		font-family: var(--sc-display);
		font-size: 24px;
		font-weight: 700;
		color: var(--sc-text);
		margin: 0;
		line-height: 1.15;
		word-break: break-word;
	}

	.panel-close {
		width: 32px; height: 32px;
		border-radius: 8px;
		border: 1px solid var(--sc-border);
		background: rgba(255,255,255,0.04);
		color: var(--sc-dim);
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.panel-close:active { background: rgba(255,255,255,0.1); color: var(--sc-text); }

	/* Status row */
	.panel-status-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 18px;
	}

	.panel-status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 13px 5px 10px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		background: rgba(71,85,105,0.3);
		border: 1px solid rgba(100,116,139,0.3);
		color: rgba(148,163,184,0.9);
	}

	.panel-status-badge.open {
		background: rgba(74,222,128,0.1);
		border-color: rgba(74,222,128,0.3);
		color: #86efac;
	}

	.panel-status-badge.soon, .panel-status-badge.closing {
		background: rgba(251,191,36,0.1);
		border-color: rgba(251,191,36,0.3);
		color: #fde68a;
	}

	.status-pip {
		display: block;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 5px currentColor;
	}

	.panel-sim-tag {
		font-family: var(--sc-mono);
		font-size: 10px;
		color: var(--sc-sim);
		letter-spacing: 0.5px;
	}

	/* Sections */
	.panel-section {
		margin-bottom: 14px;
	}

	.section-label {
		font-family: var(--sc-mono);
		font-size: 9px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--sc-dim);
		margin-bottom: 9px;
	}

	.panel-divider {
		height: 1px;
		background: rgba(255,255,255,0.07);
		margin: 14px 0;
	}

	/* ── Simulation section ── */
	.sim-toggle-block {
		background: rgba(251,191,36,0.06);
		border: 1px solid rgba(251,191,36,0.18);
		border-radius: 10px;
		padding: 12px 14px;
	}

	.sim-desc {
		font-size: 11px;
		color: var(--sc-dim);
		margin: 0 0 10px;
		line-height: 1.4;
	}

	.sim-toggle-btn {
		width: 100%;
		padding: 10px 14px;
		border-radius: 8px;
		border: 1px solid rgba(251,191,36,0.3);
		background: rgba(251,191,36,0.1);
		color: var(--sc-sim);
		font-family: var(--sc-body);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}

	.sim-toggle-btn:active { background: rgba(251,191,36,0.2); }

	.sim-toggle-btn.sim-open {
		border-color: rgba(74,222,128,0.3);
		background: rgba(74,222,128,0.08);
		color: #86efac;
	}
	.sim-toggle-btn.sim-open:active { background: rgba(74,222,128,0.18); }

	.sim-toggle-btn.sim-close {
		border-color: rgba(239,68,68,0.3);
		background: rgba(239,68,68,0.08);
		color: #fca5a5;
	}
	.sim-toggle-btn.sim-close:active { background: rgba(239,68,68,0.18); }

	/* ── Time row ── */
	.time-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}

	.time-chip {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		border-radius: 8px;
		font-family: var(--sc-mono);
		font-size: 13px;
		font-weight: 500;
		border: 1px solid;
	}

	.open-chip  { background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.25); color: #86efac; }
	.close-chip { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.25);  color: #fca5a5; }
	.time-arrow { color: var(--sc-dim); font-size: 16px; }
	.time-chip-icon { font-size: 12px; }

	/* Timeline */
	.timeline-wrap { display: flex; flex-direction: column; gap: 4px; }

	.timeline-track {
		position: relative;
		height: 6px;
		background: rgba(255,255,255,0.08);
		border-radius: 3px;
		overflow: visible;
	}

	.timeline-fill {
		position: absolute;
		top: 0; bottom: 0;
		background: rgba(100,116,139,0.5);
		border-radius: 3px;
		transition: background 0.4s;
	}

	.timeline-fill.fill-open { background: rgba(74,222,128,0.6); }

	.timeline-now {
		position: absolute;
		top: -3px; bottom: -3px;
		width: 2px;
		background: #f87171;
		border-radius: 1px;
		transform: translateX(-50%);
		box-shadow: 0 0 4px #f87171;
	}

	.timeline-labels {
		display: flex;
		justify-content: space-between;
		font-family: var(--sc-mono);
		font-size: 9px;
		color: var(--sc-dim);
	}

	/* ── Person ── */
	.person-list { display: flex; flex-direction: column; gap: 6px; }

	.person-chip {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border-radius: 10px;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.08);
	}

	.person-avatar-lg  { font-size: 18px; }
	.person-chip-name  { font-size: 13px; font-weight: 600; color: var(--sc-text); }

	/* ── Activity ── */
	.panel-activity {
		font-size: 13px;
		color: rgba(200,220,245,0.8);
		line-height: 1.5;
		margin: 0;
		padding: 10px 12px;
		background: rgba(255,255,255,0.04);
		border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.07);
	}

	/* ── Actions ── */
	.panel-actions { margin-top: 6px; }

	.panel-edit-btn {
		width: 100%;
		padding: 13px 20px;
		border-radius: 12px;
		border: 1px solid rgba(147,197,253,0.28);
		background: rgba(147,197,253,0.08);
		color: var(--sc-accent);
		font-family: var(--sc-body);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.panel-edit-btn:active { background: rgba(147,197,253,0.18); }

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.sc-topbar { padding: 7px 10px 0; }
		.sc-tab { padding: 6px 9px 8px; font-size: 11px; }
		.tab-emoji { font-size: 12px; }
		.sc-page { padding: 0 10px 60px; }
		.sc-headline { padding: 10px 2px 10px; margin-bottom: 10px; }
		.headline-emoji { font-size: 26px; }
		.headline-title { font-size: 22px; }
		.sc-grid { gap: 9px; }
		.tile-name { font-size: 16px; }
		.side-panel { width: min(300px, 95vw); }
	}

	@media (max-width: 480px) {
		.tab-label { display: none; }
		.sc-grid { gap: 7px; }
		.tile-inner { padding: 9px 11px 10px; }
		.side-panel { width: 100%; border-left: none; border-top: 1px solid var(--sc-border); top: auto; height: 85vh; border-radius: 16px 16px 0 0; }
	}
</style>
