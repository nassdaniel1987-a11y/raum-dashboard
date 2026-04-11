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

	// ── Sandbox simulation state ──
	// simStatus: open/closed override
	// simConfig: local activity, person, open_time, close_time overrides
	interface SimConfig {
		activity: string;
		person: string;
		open_time: string;
		close_time: string;
	}

	let simStatus  = $state(new Map<string, boolean>());
	let simConfigs = $state(new Map<string, Partial<SimConfig>>());

	function toggleSimStatus(id: string, currentIsOpen: boolean) {
		const m = new Map(simStatus);
		if (m.has(id)) { m.delete(id); } else { m.set(id, !currentIsOpen); }
		simStatus = m;
	}

	function setSimConfig(id: string, patch: Partial<SimConfig>) {
		const m = new Map(simConfigs);
		const existing = m.get(id) ?? {};
		m.set(id, { ...existing, ...patch });
		simConfigs = m;
	}

	function resetAllSim() {
		simStatus  = new Map();
		simConfigs = new Map();
	}

	function resetRoomSim(id: string) {
		const ms = new Map(simStatus);
		const mc = new Map(simConfigs);
		ms.delete(id);
		mc.delete(id);
		simStatus  = ms;
		simConfigs = mc;
	}

	// ── Derive rooms, applying sim overrides ──
	let allRooms = $derived(
		$rooms.map((r) => {
			const realStatus = $roomStatuses.get(r.id);
			const realIsOpen = realStatus?.is_open ?? false;
			const simIsOpen  = simStatus.has(r.id) ? simStatus.get(r.id)! : realIsOpen;
			const sc         = simConfigs.get(r.id);
			const isSimulated = simStatus.has(r.id) || simConfigs.has(r.id);

			// merge simConfig over real config
			const baseConfig = r.config ?? null;
			const mergedConfig = baseConfig
				? {
					...baseConfig,
					activity:   sc?.activity   ?? baseConfig.activity,
					open_time:  sc?.open_time  ?? baseConfig.open_time,
					close_time: sc?.close_time ?? baseConfig.close_time
				  }
				: sc
				? {
					id: '', room_id: r.id, weekday: 1,
					title_font_size: 20, text_font_size: 14, text_color: '#ffffff',
					title_alignment: 'left' as const, text_alignment: 'left' as const,
					is_locked: false, activity_image_url: null,
					activity_image_size: 'medium' as const, activity_image_crop: null,
					activity_image_position: null,
					activity:   sc?.activity   ?? null,
					open_time:  sc?.open_time  ?? null,
					close_time: sc?.close_time ?? null
				  }
				: null;

			return {
				...r,
				person:    sc?.person !== undefined ? (sc.person || null) : r.person,
				config:    mergedConfig,
				status:    realStatus ?? null,
				isOpen:    simIsOpen,
				isSimulated
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
	let currentIdx  = $state(0);
	let direction   = $state<'next' | 'prev'>('next');
	let isAnimating = $state(false);
	let autoTimer: ReturnType<typeof setTimeout> | undefined;
	const AUTO_DURATION = 10;

	function goTo(idx: number) {
		if (isAnimating || idx === currentIdx) return;
		direction   = idx > currentIdx ? 'next' : 'prev';
		isAnimating = true;
		currentIdx  = idx;
		clearAutoTimer();
		setTimeout(() => { isAnimating = false; }, 420);
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

	let touchStartX = 0;
	function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; }
	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 50) { dx > 0 ? prev() : next(); }
	}

	onMount(()   => { scheduleAuto(); });
	onDestroy(()  => { clearAutoTimer(); });

	// ── Side panel ──
	let panelRoom = $state<(RoomWithConfig & { isSimulated: boolean }) | null>(null);

	// Live panel values — always from allRooms (not snapshot)
	let panelLive = $derived(
		panelRoom ? allRooms.find(r => r.id === panelRoom!.id) ?? null : null
	);
	let panelIsOpen     = $derived(panelLive?.isOpen     ?? false);
	let panelIsSimulated = $derived(panelLive?.isSimulated ?? false);

	// Local editing state for sim fields (bound to inputs)
	let editActivity  = $state('');
	let editPerson    = $state('');
	let editOpenTime  = $state('');
	let editCloseTime = $state('');

	function openPanel(room: RoomWithConfig & { isSimulated: boolean }) {
		panelRoom     = room;
		// seed edit fields from current (real or simulated) values
		const sc      = simConfigs.get(room.id) ?? {};
		editActivity  = sc.activity   ?? room.config?.activity  ?? '';
		editPerson    = sc.person     !== undefined ? sc.person  : (room.person ?? '');
		editOpenTime  = sc.open_time  ?? room.config?.open_time ?? '';
		editCloseTime = sc.close_time ?? room.config?.close_time ?? '';
		clearAutoTimer();
	}

	function closePanel() {
		panelRoom = null;
		scheduleAuto();
	}

	function applySimConfig() {
		if (!panelRoom) return;
		setSimConfig(panelRoom.id, {
			activity:   editActivity  || undefined,
			person:     editPerson,
			open_time:  editOpenTime  || undefined,
			close_time: editCloseTime || undefined
		});
	}

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

	const DAY_START = 7 * 60;
	const DAY_END   = 20 * 60;
	const DAY_RANGE = DAY_END - DAY_START;

	function timelinePos(minutes: number): number {
		return Math.max(0, Math.min(100, ((minutes - DAY_START) / DAY_RANGE) * 100));
	}

	function nowTimelinePos(): number { return timelinePos(nowMinutes()); }

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

	// ── Current page ──
	let currentRooms = $derived(() => activePages()[currentIdx]?.rooms ?? []);
	let currentPage  = $derived(() => activePages()[currentIdx]);
	let openCount    = $derived(() => currentRooms().filter(r => r.isOpen).length);
	let simTotal     = $derived(() => simStatus.size + simConfigs.size > 0 ? new Set([...simStatus.keys(), ...simConfigs.keys()]).size : 0);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="sc-canvas"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Raumübersicht Karussell"
>
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
			{#if simTotal() > 0}
				<button class="sim-reset-btn" onclick={resetAllSim} title="Alle Simulationen zurücksetzen">
					<span class="sim-dot-pulse"></span>
					<span>{simTotal()} Sim</span>
					<span class="sim-reset-x">✕</span>
				</button>
			{/if}
			{#if $runnerNameStore}
				<div class="sc-runner">
					<span class="runner-dot"></span>
					<span class="runner-text"><strong>{$runnerNameStore}</strong></span>
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
					class:sc-grid-3={currentRooms().length === 3}
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
								<!-- Status pill row -->
								<div class="tile-top">
									<div class="tile-status-pill" class:open={room.isOpen} class:soon={status === 'soon'} class:closing={status === 'closing'}>
										<span class="pill-dot"></span>
										{#if status === 'soon'}         Öffnet bald
										{:else if status === 'closing'} Schließt bald
										{:else if room.isOpen}          Geöffnet
										{:else}                         Geschlossen
										{/if}
									</div>
									{#if room.isSimulated}
										<span class="tile-sim-badge" title="Simuliert">⚗</span>
									{/if}
								</div>

								<!-- Room name + activity -->
								<div class="tile-mid">
									<h3 class="tile-name">{room.name}</h3>
									{#if room.config?.activity}
										<p class="tile-activity">{room.config.activity}</p>
									{/if}
								</div>

								<!-- Badges row -->
								<div class="tile-bottom">
									{#if room.person}
										<div class="tile-badge person-badge">
											<span class="badge-icon">👤</span>
											<span>{room.person.split(',')[0].trim()}</span>
										</div>
									{/if}
									{#if room.config?.open_time && !room.isOpen}
										<div class="tile-badge time-badge">
											<span class="badge-icon">⏰</span>
											<span>{formatTime(room.config.open_time)}</span>
										</div>
									{/if}
									{#if room.config?.close_time && room.isOpen}
										<div class="tile-badge time-badge closing-badge">
											<span class="badge-icon">🔔</span>
											<span>bis {formatTime(room.config.close_time)}</span>
										</div>
									{/if}
								</div>
							</div>

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
	{#if panelRoom && panelLive}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="panel-backdrop" onclick={closePanel} transition:fade={{ duration: 160 }} aria-hidden="true"></div>

		<div
			class="side-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Raumdetails"
			transition:fly={{ x: 360, duration: 280, opacity: 1 }}
		>
			<!-- Header stripe with room color -->
			<div class="panel-header-band" style="background: {panelIsOpen ? panelLive.background_color : '#1e293b'};">
				<div class="panel-header-inner">
					<div>
						<div class="panel-floor-chip">
							{PAGE_DEFS.find(p => p.floors.includes(panelLive.floor))?.label ?? panelLive.floor}
						</div>
						<h2 class="panel-room-name">{panelLive.name}</h2>
					</div>
					<button class="panel-close" onclick={closePanel} aria-label="Schließen">✕</button>
				</div>

				<!-- Live status badge inside band -->
				{#if panelLive}
					{@const st = openStatus({ ...panelLive, isOpen: panelIsOpen })}
					<div class="panel-status-row">
						<div class="panel-status-badge" class:open={panelIsOpen} class:soon={st === 'soon'} class:closing={st === 'closing'}>
							<span class="status-pip"></span>
							{#if st === 'soon'}         Öffnet bald
							{:else if st === 'closing'} Schließt bald
							{:else if panelIsOpen}      Geöffnet
							{:else}                     Geschlossen
							{/if}
						</div>
						{#if panelIsSimulated}
							<span class="sim-active-tag">⚗ Simuliert</span>
						{/if}
					</div>
				{/if}
			</div>

			<div class="panel-body">

				<!-- ── Öffnungszeiten-Timeline ── -->
				{#if panelLive.config?.open_time || editOpenTime}
					<div class="panel-section">
						{@const op = parseMinutes(panelLive.config?.open_time)}
						{@const cl = parseMinutes(panelLive.config?.close_time)}
						{@const nowPct = nowTimelinePos()}
						{@const openPct  = timelinePos(op  ?? DAY_START)}
						{@const closePct = timelinePos(cl  ?? DAY_END)}
						<div class="timeline-wrap">
							<div class="timeline-track">
								<div
									class="timeline-fill"
									class:fill-open={panelIsOpen}
									style="left: {openPct}%; width: {Math.max(0, closePct - openPct)}%;"
								></div>
								<div class="timeline-now" style="left: {nowPct}%;"></div>
							</div>
							<div class="timeline-labels">
								<span>07:00</span>
								{#if panelLive.config?.open_time}
									<span class="tl-open">{formatTime(panelLive.config.open_time)}</span>
								{/if}
								{#if panelLive.config?.close_time}
									<span class="tl-close">{formatTime(panelLive.config.close_time)}</span>
								{/if}
								<span>20:00</span>
							</div>
						</div>
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ── Person ── -->
				{#if panelLive.person}
					<div class="panel-section">
						<div class="section-label">👤 Person im Raum</div>
						<div class="person-list">
							{#each panelLive.person.split(',').map(p => p.trim()).filter(p => p) as name}
								<div class="person-chip">
									<span class="person-avatar-lg">👤</span>
									<span class="person-chip-name">{name}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ── Aktivität ── -->
				{#if panelLive.config?.activity}
					<div class="panel-section">
						<div class="section-label">📌 Aktivität</div>
						<p class="panel-activity-text">{panelLive.config.activity}</p>
					</div>
					<div class="panel-divider"></div>
				{/if}

				<!-- ══ SANDBOX SIMULATION BLOCK ══ -->
				<div class="sim-block">
					<div class="sim-block-header">
						<span class="sim-block-icon">⚗</span>
						<span class="sim-block-title">Sandbox-Simulation</span>
						{#if panelIsSimulated}
							<button class="sim-reset-room-btn" onclick={() => resetRoomSim(panelRoom.id)}>
								Zurücksetzen
							</button>
						{/if}
					</div>
					<p class="sim-block-desc">Werte lokal ändern — keine Datenbankänderung.</p>

					<!-- Status toggle -->
					<div class="sim-field-row">
						<span class="sim-field-label">Status</span>
						<button
							class="sim-status-toggle"
							class:sim-status-open={!panelIsOpen}
							class:sim-status-close={panelIsOpen}
							onclick={() => toggleSimStatus(panelRoom.id, panelIsOpen)}
						>
							{#if panelIsSimulated && simStatus.has(panelRoom.id)}
								{panelIsOpen ? '🔴 Als geschlossen simulieren' : '🟢 Als geöffnet simulieren'}
							{:else if panelIsOpen}
								🔴 Als geschlossen simulieren
							{:else}
								🟢 Als geöffnet simulieren
							{/if}
						</button>
					</div>

					<!-- Activity input -->
					<div class="sim-field-group">
						<label class="sim-label" for="sim-activity">📌 Aktivität</label>
						<input
							id="sim-activity"
							class="sim-input"
							type="text"
							placeholder="z.B. Sport, Hausaufgaben, Lesen…"
							bind:value={editActivity}
							oninput={applySimConfig}
						/>
					</div>

					<!-- Person input -->
					<div class="sim-field-group">
						<label class="sim-label" for="sim-person">👤 Person im Raum</label>
						<input
							id="sim-person"
							class="sim-input"
							type="text"
							placeholder="z.B. Frau Müller, Herr Schmidt"
							bind:value={editPerson}
							oninput={applySimConfig}
						/>
					</div>

					<!-- Open/close time -->
					<div class="sim-time-row">
						<div class="sim-field-group sim-field-half">
							<label class="sim-label" for="sim-open">⏰ Öffnet</label>
							<input
								id="sim-open"
								class="sim-input sim-time-input"
								type="time"
								bind:value={editOpenTime}
								onchange={applySimConfig}
							/>
						</div>
						<div class="sim-field-group sim-field-half">
							<label class="sim-label" for="sim-close">🔔 Schließt</label>
							<input
								id="sim-close"
								class="sim-input sim-time-input"
								type="time"
								bind:value={editCloseTime}
								onchange={applySimConfig}
							/>
						</div>
					</div>
				</div>

				<!-- ── Edit button ── -->
				<div class="panel-actions">
					<button
						class="panel-edit-btn"
						onclick={() => { handleEditRoom(panelLive); closePanel(); }}
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

	/* ── Canvas ── */
	.sc-canvas {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: 'DM Sans', sans-serif;
		background: #08101e;
	}

	.sc-ambient {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background:
			radial-gradient(ellipse 60% 45% at 12% 5%,  rgba(59,130,246,.09) 0%, transparent 55%),
			radial-gradient(ellipse 45% 60% at 90% 90%, rgba(139,92,246,.07) 0%, transparent 55%);
	}

	/* ── Top bar ── */
	.sc-topbar {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 12px 0;
		flex-shrink: 0;
	}

	.sc-tabs {
		display: flex;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.sc-tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 11px 7px;
		border-radius: 8px 8px 0 0;
		border: 1px solid rgba(255,255,255,.07);
		border-bottom: none;
		background: rgba(255,255,255,.03);
		color: rgba(148,163,184,.7);
		cursor: pointer;
		font-family: 'DM Sans', sans-serif;
		font-size: 11px;
		font-weight: 500;
		transition: background .15s, color .15s;
		overflow: hidden;
		white-space: nowrap;
	}

	.sc-tab:hover { background: rgba(255,255,255,.07); color: rgba(235,243,255,.95); }

	.sc-tab-active {
		background: rgba(255,255,255,.08);
		color: rgba(235,243,255,.95);
		border-color: rgba(255,255,255,.14);
	}

	.tab-emoji { font-size: 12px; line-height: 1; }
	.tab-label { overflow: hidden; text-overflow: ellipsis; }

	.tab-progress {
		position: absolute;
		bottom: 0; left: 0;
		height: 2px;
		background: #93c5fd;
		box-shadow: 0 0 6px #93c5fd;
		animation: tab-prog linear forwards;
	}
	@keyframes tab-prog { from { width: 0; } to { width: 100%; } }

	.sc-topbar-right {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-shrink: 0;
		padding-bottom: 2px;
	}

	.sim-reset-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border-radius: 7px;
		border: 1px solid rgba(251,191,36,.35);
		background: rgba(251,191,36,.09);
		color: #fbbf24;
		font-family: 'DM Mono', monospace;
		font-size: 10.5px;
		cursor: pointer;
		transition: background .15s;
	}
	.sim-reset-btn:hover { background: rgba(251,191,36,.18); }

	.sim-dot-pulse {
		display: block;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: #fbbf24;
		box-shadow: 0 0 5px #fbbf24;
		animation: blink-dot 2s ease-in-out infinite;
	}

	.sim-reset-x { opacity: .5; margin-left: 1px; }

	.sc-runner {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		background: rgba(8,14,26,.7);
		border: 1px solid rgba(255,255,255,.08);
		border-radius: 7px;
		font-size: 10.5px;
		color: rgba(235,243,255,.9);
	}

	.runner-dot {
		display: block;
		width: 6px; height: 6px;
		border-radius: 50%;
		background: #4ade80;
		box-shadow: 0 0 5px #4ade80;
		flex-shrink: 0;
		animation: blink-dot 3s ease-in-out infinite;
	}
	@keyframes blink-dot { 0%,85%,100%{opacity:1} 90%{opacity:.1} }

	.runner-text strong { font-weight: 600; }

	/* ── Page area ── */
	.sc-page {
		position: relative;
		z-index: 5;
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 12px 56px;
		overflow: hidden;
		background: rgba(255,255,255,.03);
		border-top: 1px solid rgba(255,255,255,.07);
		min-height: 0;
	}

	.sc-page-next { animation: slide-next .4s cubic-bezier(.25,.46,.45,.94) both; }
	.sc-page-prev { animation: slide-prev .4s cubic-bezier(.25,.46,.45,.94) both; }

	@keyframes slide-next { from { opacity:0; transform:translateX(28px); } to { opacity:1; transform:none; } }
	@keyframes slide-prev { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:none; } }

	/* ── Headline ── */
	.sc-headline {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 2px 9px;
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255,255,255,.06);
		margin-bottom: 10px;
	}

	.headline-emoji { font-size: 26px; line-height: 1; filter: drop-shadow(0 2px 5px rgba(0,0,0,.6)); }

	.headline-title {
		font-family: 'Fraunces', Georgia, serif;
		font-size: 20px;
		font-weight: 600;
		color: rgba(235,243,255,.95);
		margin: 0 0 1px;
		line-height: 1.1;
	}

	.headline-meta { display: flex; align-items: center; gap: 4px; font-size: 10.5px; }
	.meta-open  { color: #4ade80; font-weight: 600; }
	.meta-sep   { color: rgba(148,163,184,.5); }
	.meta-total { color: rgba(148,163,184,.6); }

	/* ── Grid ── */
	.sc-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 10px;
		max-width: 920px;
		width: 100%;
		margin: 0 auto;
		min-height: 0;
	}

	.sc-grid-1 { grid-template-columns: 1fr;              grid-template-rows: 1fr;    max-width: 460px; }
	.sc-grid-2 { grid-template-columns: repeat(2, 1fr);   grid-template-rows: 1fr; }
	.sc-grid-3 { grid-template-columns: repeat(3, 1fr);   grid-template-rows: 1fr; }

	.sc-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: rgba(148,163,184,.5);
	}

	/* ── Room tile ── */
	.sc-tile {
		position: relative;
		border-radius: 13px;
		overflow: hidden;
		cursor: pointer;
		border: 1px solid rgba(255,255,255,.07);
		background: rgba(15,23,42,.85);
		display: flex;
		flex-direction: column;
		text-align: left;
		min-height: 0;
		transition: border-color .2s, transform .14s;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-tile:active { transform: scale(0.975); }
	.sc-tile.tile-open      { border-color: rgba(74,222,128,.22); }
	.sc-tile.tile-soon      { border-color: rgba(251,191,36,.3); }
	.sc-tile.tile-closing   { border-color: rgba(251,146,60,.3); }
	.sc-tile.tile-simulated { border-color: rgba(251,191,36,.42); box-shadow: 0 0 0 1px rgba(251,191,36,.12); }

	.tile-bg {
		position: absolute;
		inset: 0;
		width: 100%; height: 100%;
		object-fit: cover;
		opacity: .14;
		z-index: 0;
	}

	.tile-wash {
		position: absolute;
		inset: 0;
		opacity: .26;
		z-index: 1;
		transition: background .4s;
	}

	.tile-inner {
		position: relative;
		z-index: 2;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 10px 12px 11px;
		gap: 4px;
		min-height: 0;
	}

	/* Status pill */
	.tile-top { display: flex; align-items: center; justify-content: space-between; }

	.tile-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 6px;
		border-radius: 20px;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: .15px;
		border: 1px solid rgba(100,116,139,.3);
		background: rgba(15,23,42,.7);
		color: rgba(148,163,184,.85);
	}

	.tile-status-pill.open    { border-color: rgba(74,222,128,.3); background: rgba(74,222,128,.08); color: #86efac; }
	.tile-status-pill.soon,
	.tile-status-pill.closing { border-color: rgba(251,191,36,.3); background: rgba(251,191,36,.08); color: #fde68a; }

	.pill-dot {
		display: block;
		width: 4px; height: 4px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 3px currentColor;
	}

	.tile-sim-badge {
		font-size: 12px;
		opacity: .9;
		filter: drop-shadow(0 0 3px rgba(251,191,36,.5));
	}

	/* Room name + activity */
	.tile-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }

	.tile-name {
		font-family: 'Fraunces', Georgia, serif;
		font-size: clamp(14px, 1.8vw, 20px);
		font-weight: 600;
		color: rgba(235,243,255,.97);
		margin: 0 0 3px;
		line-height: 1.2;
		text-shadow: 0 2px 8px rgba(0,0,0,.7);
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.tile-activity {
		font-size: clamp(9px, 1.1vw, 11px);
		color: rgba(190,215,245,.65);
		margin: 0;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	/* Badges */
	.tile-bottom { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }

	.tile-badge {
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 2px 7px 2px 4px;
		border-radius: 9px;
		font-size: clamp(8.5px, 1vw, 10px);
		white-space: nowrap;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.person-badge {
		background: rgba(255,255,255,.07);
		border: 1px solid rgba(255,255,255,.09);
		color: rgba(200,220,245,.8);
	}

	.time-badge {
		background: rgba(251,191,36,.07);
		border: 1px solid rgba(251,191,36,.2);
		color: #fde68a;
		font-family: 'DM Mono', monospace;
	}

	.closing-badge {
		background: rgba(251,146,60,.07);
		border-color: rgba(251,146,60,.2);
		color: #fed7aa;
	}

	.badge-icon { font-size: 9px; }

	/* Open ring */
	.tile-open-ring {
		position: absolute;
		inset: 0;
		border-radius: 13px;
		border: 2px solid rgba(74,222,128,.3);
		pointer-events: none;
		animation: ring-pulse 3s ease-in-out infinite;
	}
	@keyframes ring-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

	/* ── Nav arrows ── */
	.sc-nav {
		position: absolute;
		top: 50%; transform: translateY(-50%);
		width: 36px; height: 60px;
		background: rgba(8,14,26,.8);
		border: 1px solid rgba(255,255,255,.08);
		color: rgba(235,243,255,.85);
		font-size: 26px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		transition: background .15s;
		-webkit-tap-highlight-color: transparent;
	}

	.sc-nav:active { background: rgba(255,255,255,.1); }
	.sc-nav-prev { left: 0; border-radius: 0 9px 9px 0; }
	.sc-nav-next { right: 0; border-radius: 9px 0 0 9px; }

	/* ── Panel backdrop ── */
	.panel-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,.4);
		z-index: 40;
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	/* ── Side panel ── */
	.side-panel {
		position: absolute;
		top: 0; right: 0; bottom: 0;
		width: min(360px, 94vw);
		z-index: 50;
		background: #0b1220;
		border-left: 1px solid rgba(255,255,255,.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Header band */
	.panel-header-band {
		flex-shrink: 0;
		padding: 18px 18px 14px;
		transition: background .4s;
		position: relative;
	}

	/* Dark overlay so text stays legible on any room color */
	.panel-header-band::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,.52);
	}

	.panel-header-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.panel-floor-chip {
		font-family: 'DM Mono', monospace;
		font-size: 8.5px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(200,220,245,.6);
		margin-bottom: 4px;
	}

	.panel-room-name {
		font-family: 'Fraunces', Georgia, serif;
		font-size: 22px;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.15;
		text-shadow: 0 2px 8px rgba(0,0,0,.7);
		word-break: break-word;
	}

	.panel-close {
		position: relative;
		z-index: 1;
		width: 30px; height: 30px;
		border-radius: 7px;
		border: 1px solid rgba(255,255,255,.2);
		background: rgba(255,255,255,.1);
		color: rgba(235,243,255,.9);
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background .15s;
		-webkit-tap-highlight-color: transparent;
	}
	.panel-close:active { background: rgba(255,255,255,.25); }

	/* Status row inside band */
	.panel-status-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.panel-status-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 12px 4px 9px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		background: rgba(30,41,59,.7);
		border: 1px solid rgba(100,116,139,.3);
		color: rgba(148,163,184,.9);
		backdrop-filter: blur(4px);
	}

	.panel-status-badge.open    { background: rgba(74,222,128,.15); border-color: rgba(74,222,128,.35); color: #86efac; }
	.panel-status-badge.soon,
	.panel-status-badge.closing { background: rgba(251,191,36,.15); border-color: rgba(251,191,36,.35); color: #fde68a; }

	.status-pip { display: block; width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 5px currentColor; }

	.sim-active-tag {
		font-family: 'DM Mono', monospace;
		font-size: 9px;
		letter-spacing: .5px;
		color: #fbbf24;
		background: rgba(251,191,36,.12);
		padding: 3px 8px;
		border-radius: 8px;
		border: 1px solid rgba(251,191,36,.25);
	}

	/* ── Panel body (scrollable) ── */
	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 0;
		scrollbar-width: thin;
		scrollbar-color: rgba(255,255,255,.08) transparent;
	}

	/* Sections */
	.panel-section { margin-bottom: 12px; }

	.section-label {
		font-family: 'DM Mono', monospace;
		font-size: 8.5px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(148,163,184,.55);
		margin-bottom: 8px;
	}

	.panel-divider { height: 1px; background: rgba(255,255,255,.06); margin: 12px 0; }

	/* Timeline */
	.timeline-wrap { display: flex; flex-direction: column; gap: 4px; }

	.timeline-track {
		position: relative;
		height: 5px;
		background: rgba(255,255,255,.07);
		border-radius: 3px;
		overflow: visible;
	}

	.timeline-fill {
		position: absolute;
		top: 0; bottom: 0;
		background: rgba(100,116,139,.45);
		border-radius: 3px;
		transition: background .4s;
	}

	.timeline-fill.fill-open { background: rgba(74,222,128,.6); }

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
		font-family: 'DM Mono', monospace;
		font-size: 8px;
		color: rgba(148,163,184,.45);
	}

	.tl-open  { color: #86efac; }
	.tl-close { color: #fca5a5; }

	/* Person list */
	.person-list { display: flex; flex-direction: column; gap: 5px; }

	.person-chip {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 11px;
		border-radius: 9px;
		background: rgba(255,255,255,.04);
		border: 1px solid rgba(255,255,255,.07);
	}

	.person-avatar-lg  { font-size: 16px; }
	.person-chip-name  { font-size: 12px; font-weight: 600; color: rgba(235,243,255,.92); }

	/* Activity */
	.panel-activity-text {
		font-size: 12px;
		color: rgba(200,220,245,.8);
		line-height: 1.5;
		margin: 0;
		padding: 9px 11px;
		background: rgba(255,255,255,.04);
		border-radius: 8px;
		border: 1px solid rgba(255,255,255,.07);
	}

	/* ══ Simulation block ══ */
	.sim-block {
		background: rgba(251,191,36,.05);
		border: 1px solid rgba(251,191,36,.16);
		border-radius: 12px;
		padding: 14px;
		margin-bottom: 14px;
	}

	.sim-block-header {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-bottom: 5px;
	}

	.sim-block-icon {
		font-size: 14px;
		line-height: 1;
	}

	.sim-block-title {
		font-family: 'DM Mono', monospace;
		font-size: 9.5px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: #fbbf24;
		flex: 1;
	}

	.sim-reset-room-btn {
		font-size: 9.5px;
		color: rgba(251,191,36,.65);
		background: none;
		border: 1px solid rgba(251,191,36,.2);
		border-radius: 6px;
		padding: 2px 8px;
		cursor: pointer;
		font-family: 'DM Mono', monospace;
		transition: color .15s, border-color .15s;
	}
	.sim-reset-room-btn:hover { color: #fbbf24; border-color: rgba(251,191,36,.4); }

	.sim-block-desc {
		font-size: 10.5px;
		color: rgba(148,163,184,.55);
		margin: 0 0 12px;
		line-height: 1.4;
	}

	.sim-field-row { margin-bottom: 10px; }

	.sim-status-toggle {
		width: 100%;
		padding: 9px 12px;
		border-radius: 8px;
		border: 1px solid rgba(251,191,36,.3);
		background: rgba(251,191,36,.08);
		color: #fbbf24;
		font-family: 'DM Sans', sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: background .15s;
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}
	.sim-status-toggle:active { background: rgba(251,191,36,.18); }

	.sim-status-toggle.sim-status-open {
		border-color: rgba(74,222,128,.3);
		background: rgba(74,222,128,.08);
		color: #86efac;
	}
	.sim-status-toggle.sim-status-open:active { background: rgba(74,222,128,.18); }

	.sim-status-toggle.sim-status-close {
		border-color: rgba(239,68,68,.3);
		background: rgba(239,68,68,.08);
		color: #fca5a5;
	}
	.sim-status-toggle.sim-status-close:active { background: rgba(239,68,68,.18); }

	.sim-field-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 9px;
	}

	.sim-field-group:last-child { margin-bottom: 0; }

	.sim-label {
		font-family: 'DM Mono', monospace;
		font-size: 8.5px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: rgba(148,163,184,.55);
	}

	.sim-input {
		background: rgba(255,255,255,.05);
		border: 1px solid rgba(255,255,255,.1);
		border-radius: 7px;
		color: rgba(235,243,255,.9);
		font-family: 'DM Sans', sans-serif;
		font-size: 12px;
		padding: 7px 10px;
		outline: none;
		transition: border-color .15s;
		width: 100%;
		box-sizing: border-box;
		-webkit-appearance: none;
	}

	.sim-input:focus { border-color: rgba(251,191,36,.45); }
	.sim-input::placeholder { color: rgba(148,163,184,.35); }

	/* Time inputs */
	.sim-time-row { display: flex; gap: 8px; }
	.sim-field-half { flex: 1; min-width: 0; }

	.sim-time-input {
		font-family: 'DM Mono', monospace;
		font-size: 13px;
		padding: 7px 8px;
		color-scheme: dark;
	}

	/* Actions */
	.panel-actions { margin-top: 4px; }

	.panel-edit-btn {
		width: 100%;
		padding: 11px 16px;
		border-radius: 10px;
		border: 1px solid rgba(147,197,253,.25);
		background: rgba(147,197,253,.07);
		color: #93c5fd;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background .15s;
		-webkit-tap-highlight-color: transparent;
	}
	.panel-edit-btn:active { background: rgba(147,197,253,.18); }

	/* ── Responsive (iPad 768px) ── */
	@media (max-width: 900px) {
		.sc-tab { padding: 5px 8px 7px; font-size: 10.5px; }
		.tab-emoji { font-size: 11px; }
		.sc-page { padding: 0 9px 50px; }
		.sc-headline { padding: 8px 2px 8px; margin-bottom: 8px; }
		.headline-emoji { font-size: 22px; }
		.headline-title { font-size: 18px; }
		.sc-grid { gap: 8px; }
		.side-panel { width: min(320px, 96vw); }
	}

	@media (max-width: 600px) {
		.tab-label { display: none; }
		.sc-grid { gap: 7px; }
		.tile-inner { padding: 8px 10px 9px; }
		.side-panel {
			width: 100%;
			border-left: none;
			border-top: 1px solid rgba(255,255,255,.1);
			top: auto;
			height: 88vh;
			border-radius: 14px 14px 0 0;
		}
	}
</style>
