<script lang="ts">
	import { currentTime, runnerName as runnerNameStore, visibleRooms } from '$lib/stores/appState';
	import { onDestroy, onMount } from 'svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{
		handleEditRoom: (room: RoomWithConfig) => void;
	}>();

	const DEFAULT_PAGE_SECONDS = 10;
	const PAGE_DEFINITIONS = [
		{ id: 'dach', label: 'Dachgeschoss', short: 'DACH', floors: ['dach'] },
		{ id: 'og', label: '1. & 2. Obergeschoss', short: 'OG', floors: ['og2', 'og1'] },
		{ id: 'eg', label: 'Erdgeschoss', short: 'EG', floors: ['eg'] },
		{ id: 'essen', label: 'Essbereich', short: 'ESSEN', floors: ['essen'] },
		{ id: 'extern', label: 'Aussenbereich', short: 'AUSSEN', floors: ['extern'] }
	];

	let pageIndex = $state(0);
	let autoPageEnabled = $state(true);
	let pageDuration = $state(DEFAULT_PAGE_SECONDS);
	let pageTimer: ReturnType<typeof setTimeout> | undefined;
	let touchStartX = 0;

	let activePages = $derived(() => {
		return PAGE_DEFINITIONS.map((page) => ({
			...page,
			rooms: $visibleRooms
				.filter((room: RoomWithConfig) => page.floors.includes(room.floor))
				.sort((a: RoomWithConfig, b: RoomWithConfig) => a.position_x - b.position_x)
		})).filter((page) => page.rooms.length > 0);
	});

	let currentPage = $derived(() => activePages()[pageIndex] ?? activePages()[0] ?? null);
	let currentRooms = $derived((): RoomWithConfig[] => currentPage()?.rooms ?? []);
	let totalOpen = $derived($visibleRooms.filter((room: RoomWithConfig) => room.isOpen).length);
	let pageOpen = $derived(currentRooms().filter((room: RoomWithConfig) => room.isOpen).length);

	$effect(() => {
		const pages = activePages();
		if (pages.length > 0 && pageIndex >= pages.length) {
			pageIndex = 0;
		}
	});

	function clearAutoPage() {
		if (pageTimer) {
			clearTimeout(pageTimer);
			pageTimer = undefined;
		}
	}

	function scheduleAutoPage() {
		clearAutoPage();
		if (!autoPageEnabled || activePages().length < 2) return;
		pageTimer = setTimeout(() => {
			nextPage(false);
			scheduleAutoPage();
		}, pageDuration * 1000);
	}

	function goToPage(index: number, restart = true) {
		const pages = activePages();
		if (index < 0 || index >= pages.length || index === pageIndex) return;
		pageIndex = index;
		if (restart) scheduleAutoPage();
	}

	function nextPage(restart = true) {
		const pages = activePages();
		if (pages.length < 2) return;
		pageIndex = (pageIndex + 1) % pages.length;
		if (restart) scheduleAutoPage();
	}

	function previousPage() {
		const pages = activePages();
		if (pages.length < 2) return;
		pageIndex = pageIndex === 0 ? pages.length - 1 : pageIndex - 1;
		scheduleAutoPage();
	}

	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event: TouchEvent) {
		const deltaX = event.changedTouches[0].clientX - touchStartX;
		if (Math.abs(deltaX) < 60) return;
		if (deltaX > 0) {
			previousPage();
		} else {
			nextPage();
		}
	}

	function parseMinutes(time: string | null | undefined): number | null {
		if (!time) return null;
		const [hours, minutes] = time.split(':').map(Number);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
		return hours * 60 + minutes;
	}

	function formatTime(time: string | null | undefined): string {
		return time ? time.substring(0, 5) : '';
	}

	function roomState(room: RoomWithConfig): 'open' | 'closed' | 'opening' | 'closing' {
		const now = $currentTime.getHours() * 60 + $currentTime.getMinutes();
		const openTime = parseMinutes(room.config?.open_time);
		const closeTime = parseMinutes(room.config?.close_time);

		if (!room.isOpen) {
			if (openTime !== null && openTime > now && openTime - now <= 10) return 'opening';
			return 'closed';
		}

		if (closeTime !== null && closeTime > now && closeTime - now <= 10) return 'closing';
		return 'open';
	}

	function stateLabel(room: RoomWithConfig): string {
		const state = roomState(room);
		if (state === 'open') return 'Offen';
		if (state === 'opening') return `Offnet ${formatTime(room.config?.open_time)}`;
		if (state === 'closing') return `Schliesst ${formatTime(room.config?.close_time)}`;
		return 'Geschlossen';
	}

	function timeLabel(room: RoomWithConfig): string {
		const open = formatTime(room.config?.open_time);
		const close = formatTime(room.config?.close_time);
		if (open && close) return `${open} - ${close}`;
		if (open) return `ab ${open}`;
		if (close) return `bis ${close}`;
		return 'Kein Zeitfenster';
	}

	function personList(room: RoomWithConfig): string[] {
		return room.person
			? room.person
					.split(',')
					.map((person) => person.trim())
					.filter(Boolean)
			: [];
	}

	function cardStyle(room: RoomWithConfig): string {
		return `--room-accent: ${room.background_color || '#64748b'};`;
	}

	function calmImagePosition(room: RoomWithConfig) {
		return room.config?.activity_image_position_calm ?? room.config?.activity_image_position;
	}

	export function setPageDuration(seconds: number) {
		pageDuration = seconds;
		localStorage.setItem('pageDuration', seconds.toString());
		scheduleAutoPage();
	}

	export function toggleAutoPage(): boolean {
		autoPageEnabled = !autoPageEnabled;
		localStorage.setItem('autoPageEnabled', autoPageEnabled.toString());
		scheduleAutoPage();
		return autoPageEnabled;
	}

	export function getAutoPageStatus(): boolean {
		return autoPageEnabled;
	}

	export function setAnimationType(_type: string) {
		// Ruhige Ansicht nutzt bewusst keine wechselbaren Übergangsanimationen.
	}

	export function getAnimationType(): string {
		return 'calm';
	}

	onMount(() => {
		const savedDuration = localStorage.getItem('pageDuration');
		const savedEnabled = localStorage.getItem('autoPageEnabled');

		if (savedDuration) pageDuration = parseInt(savedDuration);
		if (savedEnabled) autoPageEnabled = savedEnabled === 'true';
		scheduleAutoPage();
	});

	onDestroy(clearAutoPage);
</script>

<div class="calm-shell" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
	{#if activePages().length === 0}
		<div class="empty-state">
			<h2>Keine Raeume vorhanden</h2>
			<p>Fuer diesen Tag sind noch keine Raeume konfiguriert.</p>
		</div>
	{:else}
		<header class="calm-topline">
			<div class="page-copy">
				<span class="section-kicker">Ruhige Ansicht</span>
				<h2>{currentPage()?.label}</h2>
			</div>

			<div class="status-strip" aria-label="Statusuebersicht">
				<div class="strip-item">
					<span class="strip-number">{pageOpen}</span>
					<span class="strip-label">offen hier</span>
				</div>
				<div class="strip-item">
					<span class="strip-number">{currentRooms().length}</span>
					<span class="strip-label">Raeume</span>
				</div>
				<div class="strip-item">
					<span class="strip-number">{totalOpen}</span>
					<span class="strip-label">offen gesamt</span>
				</div>
				{#if $runnerNameStore}
					<div class="runner-pill">
						<span class="runner-label">Ansprechpartner</span>
						<span class="runner-name">{$runnerNameStore}</span>
					</div>
				{/if}
			</div>
		</header>

		<nav class="page-tabs" aria-label="Etagen">
			{#each activePages() as page, index (page.id)}
				<button
					class="page-tab"
					class:active={index === pageIndex}
					onclick={() => goToPage(index)}
					aria-current={index === pageIndex ? 'page' : undefined}
				>
					<span class="tab-short">{page.short}</span>
					<span class="tab-count">{page.rooms.filter((room) => room.isOpen).length}/{page.rooms.length}</span>
					{#if index === pageIndex && autoPageEnabled}
						{#key `${pageIndex}-${pageDuration}`}
							<span class="tab-progress" style="animation-duration: {pageDuration}s;"></span>
						{/key}
					{/if}
				</button>
			{/each}
		</nav>

		<section
			class="room-grid"
			class:grid-one={currentRooms().length === 1}
			class:grid-two={currentRooms().length === 2}
			class:grid-three={currentRooms().length === 3}
			aria-label="Raeume"
		>
			{#each currentRooms() as room (room.id)}
				<button
					class="calm-card"
					class:has-image={!!room.config?.activity_image_url}
					class:is-open={roomState(room) === 'open'}
					class:is-closed={roomState(room) === 'closed'}
					class:is-opening={roomState(room) === 'opening'}
					class:is-closing={roomState(room) === 'closing'}
					style={cardStyle(room)}
					onclick={() => handleEditRoom(room)}
					title={`${room.name} bearbeiten`}
				>
					<div class="card-layout">
						<div class="card-body">
							<div class="card-head">
								<span class="state-dot"></span>
								<span class="state-label">{stateLabel(room)}</span>
							</div>

							<h3>{room.name}</h3>

							<p class="activity">
								{room.config?.activity || 'Keine Aktivitaet eingetragen'}
							</p>

							<div class="card-meta">
								<span>{timeLabel(room)}</span>
								{#if personList(room).length > 0}
									<span>{personList(room).join(' / ')}</span>
								{:else}
									<span>Keine Person</span>
								{/if}
							</div>
						</div>

						{#if room.config?.activity_image_url}
							<div class="card-visual" aria-hidden="true">
								<img
									src={room.config.activity_image_url}
									alt=""
									loading="eager"
									style={calmImagePosition(room)
										? `transform: translate(${calmImagePosition(room)!.x}%, ${calmImagePosition(room)!.y}%) scale(${calmImagePosition(room)!.zoom}) rotate(${calmImagePosition(room)!.rotation ?? 0}deg); transform-origin: center;`
										: ''}
								/>
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</section>

		<div class="page-controls" aria-label="Seitennavigation">
			<button onclick={previousPage} aria-label="Vorherige Seite">Zurueck</button>
			<button onclick={() => nextPage()} aria-label="Naechste Seite">Weiter</button>
		</div>
	{/if}
</div>

<style>
	.calm-shell {
		position: relative;
		width: 100%;
		height: calc(100vh - 50px);
		padding: 28px 32px 34px;
		box-sizing: border-box;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.14)),
			radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.12), transparent 36%);
		color: #f8fafc;
		touch-action: pan-x;
	}

	.calm-topline {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 28px;
		min-height: 88px;
		margin-bottom: 14px;
	}

	.page-copy {
		min-width: 0;
	}

	.section-kicker {
		display: block;
		margin-bottom: 6px;
		color: rgba(226, 232, 240, 0.62);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: clamp(34px, 4.5vw, 64px);
		line-height: 0.94;
		font-weight: 850;
		letter-spacing: 0;
		text-wrap: balance;
	}

	.status-strip {
		display: flex;
		align-items: stretch;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}

	.strip-item,
	.runner-pill {
		min-width: 94px;
		padding: 10px 12px;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(15, 23, 42, 0.54);
		box-shadow: 0 10px 26px rgba(2, 6, 23, 0.18);
	}

	.strip-number {
		display: block;
		font-size: 26px;
		font-weight: 850;
		line-height: 1;
	}

	.strip-label,
	.runner-label {
		display: block;
		margin-top: 4px;
		color: rgba(226, 232, 240, 0.64);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.runner-pill {
		min-width: 180px;
		border-color: rgba(125, 211, 252, 0.26);
	}

	.runner-name {
		display: block;
		margin-top: 3px;
		font-size: 18px;
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.page-tabs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
		gap: 8px;
		margin-bottom: 18px;
	}

	.page-tab {
		position: relative;
		min-height: 48px;
		padding: 9px 12px 10px;
		border: 1px solid rgba(226, 232, 240, 0.12);
		background: rgba(15, 23, 42, 0.42);
		color: rgba(248, 250, 252, 0.72);
		text-align: left;
		cursor: pointer;
		overflow: hidden;
	}

	.page-tab.active {
		border-color: rgba(248, 250, 252, 0.34);
		background: rgba(248, 250, 252, 0.1);
		color: #ffffff;
	}

	.tab-short {
		display: block;
		font-size: 15px;
		font-weight: 850;
	}

	.tab-count {
		display: block;
		margin-top: 2px;
		font-size: 11px;
		color: rgba(226, 232, 240, 0.62);
	}

	.tab-progress {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 3px;
		width: 100%;
		background: linear-gradient(90deg, #38bdf8, #22c55e);
		transform-origin: left center;
		animation: calm-progress linear forwards;
	}

	@keyframes calm-progress {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}

	.room-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: minmax(210px, 1fr);
		gap: 14px;
		height: calc(100% - 178px);
		min-height: 430px;
	}

	.room-grid.grid-one {
		grid-template-columns: minmax(0, 1fr);
		grid-auto-rows: 1fr;
	}

	.room-grid.grid-two {
		grid-auto-rows: 1fr;
	}

	.room-grid.grid-three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.calm-card {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 0;
		padding: 0;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(15, 23, 42, 0.94);
		color: inherit;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		box-shadow: 0 18px 38px rgba(2, 6, 23, 0.24);
		transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
	}

	.calm-card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 8px;
		background: var(--room-accent);
		opacity: 0.78;
	}

	.calm-card:hover {
		transform: translateY(-2px);
		border-color: rgba(248, 250, 252, 0.3);
		background: rgba(15, 23, 42, 0.98);
	}

	.calm-card:focus-visible {
		outline: 3px solid rgba(56, 189, 248, 0.72);
		outline-offset: 3px;
	}

	.calm-card.is-closed {
		background: rgba(15, 23, 42, 0.88);
	}

	.calm-card.is-opening,
	.calm-card.is-closing {
		border-color: rgba(251, 191, 36, 0.48);
	}

	.card-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		width: 100%;
		height: 100%;
	}

	.calm-card.has-image .card-layout {
		grid-template-columns: minmax(0, 1fr) minmax(220px, 38%);
	}

	.card-body {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 0;
		padding: 18px 20px 18px 28px;
	}

	.card-visual {
		position: relative;
		min-width: 0;
		min-height: 0;
		margin: 12px 12px 12px 0;
		overflow: hidden;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(2, 6, 23, 0.42);
	}

	.card-visual::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(90deg, rgba(2, 6, 23, 0.18), transparent 24%);
		pointer-events: none;
	}

	.card-visual img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 12px;
	}

	.state-dot {
		width: 11px;
		height: 11px;
		border-radius: 999px;
		background: #94a3b8;
		flex: 0 0 auto;
	}

	.is-open .state-dot {
		background: #22c55e;
		box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
	}

	.is-opening .state-dot {
		background: #facc15;
		box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.14);
	}

	.is-closing .state-dot {
		background: #fb923c;
		box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.16);
	}

	.state-label {
		font-size: 13px;
		font-weight: 850;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: rgba(248, 250, 252, 0.78);
	}

	h3 {
		margin: 0;
		max-width: 92%;
		font-size: clamp(30px, 3.2vw, 52px);
		line-height: 0.98;
		font-weight: 900;
		letter-spacing: 0;
		overflow-wrap: anywhere;
	}

	.calm-card.has-image h3 {
		font-size: clamp(28px, 2.7vw, 46px);
	}

	.activity {
		margin: 14px 0 0;
		max-width: 84%;
		color: rgba(241, 245, 249, 0.78);
		font-size: clamp(18px, 1.6vw, 28px);
		font-weight: 700;
		line-height: 1.12;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-meta {
		display: grid;
		grid-template-columns: minmax(0, auto) minmax(0, 1fr);
		gap: 8px;
		align-items: end;
		margin-top: auto;
		padding-top: 18px;
		color: rgba(226, 232, 240, 0.72);
		font-size: clamp(14px, 1.15vw, 19px);
		font-weight: 800;
	}

	.card-meta span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-meta span:last-child {
		text-align: right;
	}

	.page-controls {
		position: absolute;
		right: 32px;
		bottom: 18px;
		display: flex;
		gap: 8px;
	}

	.page-controls button {
		padding: 8px 12px;
		border: 1px solid rgba(226, 232, 240, 0.14);
		background: rgba(15, 23, 42, 0.54);
		color: rgba(248, 250, 252, 0.72);
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
	}

	.empty-state {
		display: flex;
		height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: rgba(248, 250, 252, 0.72);
	}

	.empty-state h2 {
		font-size: 42px;
	}

	.empty-state p {
		margin-top: 10px;
		font-size: 18px;
	}

	@media (max-width: 900px) {
		.calm-shell {
			padding: 18px 16px 72px;
			overflow-y: auto;
		}

		.calm-topline {
			align-items: start;
			flex-direction: column;
			min-height: auto;
		}

		.status-strip {
			justify-content: start;
			width: 100%;
		}

		.room-grid,
		.room-grid.grid-three {
			grid-template-columns: 1fr;
			grid-auto-rows: minmax(210px, auto);
			height: auto;
			min-height: 0;
		}

		.card-meta {
			grid-template-columns: 1fr;
		}

		.calm-card.has-image .card-layout {
			grid-template-columns: minmax(0, 1fr) minmax(160px, 36%);
		}

		.card-meta span:last-child {
			text-align: left;
		}

		.page-controls {
			position: fixed;
			right: 16px;
			bottom: 16px;
		}
	}
</style>
