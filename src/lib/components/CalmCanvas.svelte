<script lang="ts">
	import { appSettings, currentTime, visibleRooms } from '$lib/stores/appState';
	import {
		calmActivePageIndex,
		calmCurrentPageLabel,
		calmHeaderStats,
		calmPageChangeRequest,
		calmPageSummaries
	} from '$lib/stores/calmViewState';
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
	let calmTitleFontSize = $derived($appSettings?.calm_title_font_size ?? 42);
	let calmTextFontSize = $derived($appSettings?.calm_text_font_size ?? 24);

	$effect(() => {
		const pages = activePages();
		if (pages.length > 0 && pageIndex >= pages.length) {
			pageIndex = 0;
		}
	});

	$effect(() => {
		calmCurrentPageLabel.set(currentPage()?.label ?? 'Ruhige Ansicht');
		calmActivePageIndex.set(pageIndex);
		calmHeaderStats.set({
			pageOpen,
			pageRooms: currentRooms().length,
			totalOpen
		});
		calmPageSummaries.set(
			activePages().map((page) => ({
				id: page.id,
				label: page.label,
				short: page.short,
				openCount: page.rooms.filter((room) => room.isOpen).length,
				roomCount: page.rooms.length
			}))
		);
	});

	$effect(() => {
		const requestedIndex = $calmPageChangeRequest;
		if (requestedIndex !== null) {
			goToPage(requestedIndex);
			calmPageChangeRequest.set(null);
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

<div
	class="calm-shell"
	lang="de"
	style={`--calm-title-size: ${calmTitleFontSize}px; --calm-text-size: ${calmTextFontSize}px;`}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	{#if activePages().length === 0}
		<div class="empty-state">
			<h2>Keine Raeume vorhanden</h2>
			<p>Fuer diesen Tag sind noch keine Raeume konfiguriert.</p>
		</div>
	{:else}
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
		height: calc(100vh - 74px);
		margin-top: 74px;
		padding: 22px 32px 34px;
		box-sizing: border-box;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.14)),
			radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.12), transparent 36%);
		color: #f8fafc;
		touch-action: pan-x;
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
		height: 100%;
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
		object-fit: contain;
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
		font-size: var(--calm-title-size);
		line-height: 1.02;
		font-weight: 900;
		letter-spacing: 0;
		hyphens: auto;
		overflow-wrap: normal;
		word-break: normal;
	}

	.calm-card.has-image h3 {
		font-size: max(calc(var(--calm-title-size) - 4px), 24px);
	}

	.activity {
		margin: 14px 0 0;
		max-width: 84%;
		color: rgba(241, 245, 249, 0.78);
		font-size: var(--calm-text-size);
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
