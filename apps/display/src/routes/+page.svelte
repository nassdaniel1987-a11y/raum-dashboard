<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		blitzError,
		connection,
		currentTime,
		displayPages,
		lastSyncLabel,
		refreshBlitzData,
		runnerName,
		setViewDay,
		viewWeekday
	} from '$lib/stores/displayStore';
	import type { DisplayRoom } from '$lib/types';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
	const DEFAULT_PAGE_SECONDS = 12;

	type RoomDisplayState = 'open' | 'closed' | 'opening' | 'closing';
	type ImagePosition = {
		x?: number;
		y?: number;
		zoom?: number;
		rotation?: number;
	};

	let activePageIndex = $state(0);
	let autoRotate = $state(true);
	let pageSeconds = $state(DEFAULT_PAGE_SECONDS);
	let menuOpen = $state(false);
	let fullscreen = $state(false);
	let fullscreenSupported = $state(false);
	let pageTimer: ReturnType<typeof setTimeout> | undefined;

	let activePage = $derived($displayPages[activePageIndex] ?? $displayPages[0] ?? null);
	let pageRooms = $derived(activePage?.rooms ?? []);
	let pageOpen = $derived(pageRooms.filter((room) => room.isOpen).length);
	let totalOpen = $derived($displayPages.flatMap((page) => page.rooms).filter((room) => room.isOpen).length);
	let formattedDate = $derived(
		$currentTime.toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit'
		})
	);
	let formattedTime = $derived(
		$currentTime.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit'
		})
	);
	let viewWeekdayName = $derived(weekdayNames[$viewWeekday % 7]);

	$effect(() => {
		const pageCount = $displayPages.length;
		if (pageCount > 0 && activePageIndex >= pageCount) {
			activePageIndex = 0;
		}
	});

	$effect(() => {
		const pageCount = $displayPages.length;
		const currentPage = activePageIndex;
		const seconds = pageSeconds;
		const shouldRotate = autoRotate && pageCount > 1;

		clearPageTimer();
		if (!shouldRotate) return;

		pageTimer = setTimeout(() => {
			activePageIndex = (currentPage + 1) % pageCount;
		}, seconds * 1000);

		return clearPageTimer;
	});

	function clearPageTimer() {
		if (pageTimer) clearTimeout(pageTimer);
		pageTimer = undefined;
	}

	function goToPage(index: number) {
		if ($displayPages.length === 0) return;
		activePageIndex = (index + $displayPages.length) % $displayPages.length;
	}

	function changeDay(offset: number) {
		setViewDay($viewWeekday + offset);
		activePageIndex = 0;
	}

	function goToday() {
		setViewDay(new Date().getDay() || 7);
		activePageIndex = 0;
	}

	async function toggleFullscreen() {
		if (!fullscreenSupported) return;

		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeMenu();
	}

	function setAutoRotate(value: boolean) {
		autoRotate = value;
		localStorage.setItem('display-auto-rotate', String(value));
	}

	function setPageSeconds(value: number | string) {
		pageSeconds = Number(value) || DEFAULT_PAGE_SECONDS;
		localStorage.setItem('display-page-seconds', String(pageSeconds));
	}

	function parseMinutes(time: string | null | undefined) {
		if (!time) return null;
		const [hours, minutes] = time.split(':').map(Number);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
		return hours * 60 + minutes;
	}

	function formatTime(time: string | null | undefined) {
		return time ? time.substring(0, 5) : '';
	}

	function roomState(room: DisplayRoom): RoomDisplayState {
		const now = $currentTime.getHours() * 60 + $currentTime.getMinutes();
		const openTime = parseMinutes(room.config.open_time);
		const closeTime = parseMinutes(room.config.close_time);

		if (!room.isOpen) {
			if (openTime !== null && openTime > now && openTime - now <= 15) return 'opening';
			return 'closed';
		}

		if (closeTime !== null && closeTime > now && closeTime - now <= 15) return 'closing';
		return 'open';
	}

	function stateLabel(room: DisplayRoom) {
		const state = roomState(room);
		if (state === 'open') return 'Offen';
		if (state === 'opening') return `Öffnet ${formatTime(room.config.open_time)}`;
		if (state === 'closing') return `Schließt ${formatTime(room.config.close_time)}`;
		return 'Geschlossen';
	}

	function timeLabel(room: DisplayRoom) {
		const open = formatTime(room.config.open_time);
		const close = formatTime(room.config.close_time);
		if (open && close) return `${open} - ${close}`;
		if (open) return `ab ${open}`;
		if (close) return `bis ${close}`;
		return 'Kein Zeitfenster';
	}

	function normalizeImagePosition(position: unknown): Required<ImagePosition> {
		const candidate = typeof position === 'object' && position !== null ? (position as ImagePosition) : {};
		return {
			x: Number.isFinite(candidate.x) ? Number(candidate.x) : 0,
			y: Number.isFinite(candidate.y) ? Number(candidate.y) : 0,
			zoom: Number.isFinite(candidate.zoom) ? Math.max(0.2, Number(candidate.zoom)) : 1,
			rotation: Number.isFinite(candidate.rotation) ? Number(candidate.rotation) : 0
		};
	}

	function activityImageStyle(room: DisplayRoom) {
		const position = normalizeImagePosition(
			room.config.activity_image_position_calm ?? room.config.activity_image_position
		);

		return `transform: translate(${position.x}%, ${position.y}%) scale(${position.zoom}) rotate(${position.rotation}deg);`;
	}

	function imageSizeClass(room: DisplayRoom) {
		return room.config.activity_image_size ?? 'medium';
	}

	onMount(() => {
		const savedAuto = localStorage.getItem('display-auto-rotate');
		const savedSeconds = localStorage.getItem('display-page-seconds');
		if (savedAuto !== null) autoRotate = savedAuto === 'true';
		if (savedSeconds) pageSeconds = Number(savedSeconds) || DEFAULT_PAGE_SECONDS;
		fullscreenSupported = typeof document.documentElement.requestFullscreen === 'function';

		const onFullscreen = () => {
			fullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => {
			clearPageTimer();
			document.removeEventListener('fullscreenchange', onFullscreen);
		};
	});

	onDestroy(clearPageTimer);
</script>

<svelte:head>
	<meta name="theme-color" content="#071016" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<main class="display-shell" data-connection={$connection}>
	<section class="status-rail" aria-label="Display Status">
		<div class="brand-block">
			<span>Raum Display</span>
			<strong>{activePage?.label ?? 'Laden'}</strong>
		</div>

		<nav class="floor-nav" aria-label="Etagen">
			{#each $displayPages as page, index (page.id)}
				<button class:active={index === activePageIndex} onclick={() => goToPage(index)}>
					<span>{page.short}</span>
					<small>{page.rooms.filter((room) => room.isOpen).length}/{page.rooms.length}</small>
				</button>
			{/each}
		</nav>

		<div class="runner-block">
			<span>Ansprechpartner</span>
			<strong>{$runnerName || 'Nicht gesetzt'}</strong>
		</div>

		<div class="time-block">
			<strong>{formattedTime}</strong>
			<span>{formattedDate}</span>
		</div>

		<div class="ops-block">
			<button onclick={() => changeDay(-1)} aria-label="Vorheriger Tag">‹</button>
			<div>
				<strong>{viewWeekdayName}</strong>
				<button class="today-button" onclick={goToday}>Heute</button>
			</div>
			<button onclick={() => changeDay(1)} aria-label="Nächster Tag">›</button>
		</div>

		<div class="metric-row">
			<div>
				<strong>{pageOpen}</strong>
				<span>offen hier</span>
			</div>
			<div>
				<strong>{pageRooms.length}</strong>
				<span>Räume</span>
			</div>
			<div>
				<strong>{totalOpen}</strong>
				<span>offen gesamt</span>
			</div>
		</div>

		<div class="system-row">
			<span class="connection-dot"></span>
			<span class="connection-label">
				{#if $connection === 'ready'}
					Live · Blitz {lastSyncLabel}
				{:else if $connection === 'partial'}
					Teilweise live · {$blitzError}
				{:else if $connection === 'offline'}
					Offline
				{:else}
					Lädt
				{/if}
			</span>
			<button class="menu-trigger" onclick={() => (menuOpen = true)}>Menü</button>
		</div>
	</section>

	<section class="stage" aria-label="Räume">
		{#if !activePage}
			<div class="empty-state">
				<strong>Daten werden geladen</strong>
				<span>Verbindung zu Supabase und Blitz wird aufgebaut.</span>
			</div>
		{:else if pageRooms.length === 0}
			<div class="empty-state">
				<strong>Keine Räume</strong>
				<span>Für {viewWeekdayName} ist diese Etage nicht belegt.</span>
			</div>
		{:else}
			<div
				class="room-grid"
				class:one={pageRooms.length === 1}
				class:two={pageRooms.length === 2}
				class:three={pageRooms.length === 3}
				class:four={pageRooms.length >= 4}
			>
				{#each pageRooms as room (room.id)}
					{@const state = roomState(room)}
					<article class="room-card" class:open={state === 'open'} class:opening={state === 'opening'} class:closing={state === 'closing'} lang="de">
						<div class="state-line">
							<span></span>
							<strong>{stateLabel(room)}</strong>
						</div>

						<div class="room-copy">
							<h2>{room.name}</h2>
							<p>{room.config.activity || 'Keine Aktivität eingetragen'}</p>
						</div>

						{#if room.config.activity_image_url}
							<figure class={`activity-image ${imageSizeClass(room)}`}>
								<img src={room.config.activity_image_url} alt="" style={activityImageStyle(room)} />
							</figure>
						{/if}

						<footer>
							<span>{timeLabel(room)}</span>
							<strong>{room.displayPersons.length ? room.displayPersons.join(' / ') : 'Keine Person'}</strong>
						</footer>
					</article>
				{/each}
			</div>
		{/if}

		{#if autoRotate && $displayPages.length > 1}
			{#key `${activePageIndex}-${pageSeconds}-${autoRotate}`}
				<div class="page-progress" style={`animation-duration: ${pageSeconds}s;`}></div>
			{/key}
		{/if}
	</section>

	{#if menuOpen}
		<button class="sheet-backdrop" aria-label="Menü schließen" onclick={closeMenu}></button>
		<div class="control-sheet" role="dialog" aria-modal="true" aria-label="Display Menü">
			<header>
				<div>
					<span>Betrieb</span>
					<strong>Display Menü</strong>
				</div>
				<button class="sheet-close" onclick={closeMenu} aria-label="Menü schließen">×</button>
			</header>

			<div class="sheet-grid">
				<button class:active={autoRotate} onclick={() => setAutoRotate(!autoRotate)}>
					<span>Auto-Wechsel</span>
					<strong>{autoRotate ? 'Aktiv' : 'Pausiert'}</strong>
				</button>
				<button onclick={goToday}>
					<span>Tag</span>
					<strong>Heute</strong>
				</button>
				<button onclick={() => void refreshBlitzData()}>
					<span>Daten</span>
					<strong>Blitz aktualisieren</strong>
				</button>
				<button onclick={() => goto('/control')}>
					<span>Pflege</span>
					<strong>Texte & Bilder</strong>
				</button>
				<button onclick={toggleFullscreen} disabled={!fullscreenSupported}>
					<span>Anzeige</span>
					<strong>{fullscreenSupported ? (fullscreen ? 'Vollbild verlassen' : 'Vollbild') : 'Safari begrenzt'}</strong>
				</button>
			</div>

			<div class="sheet-day-row">
				<button onclick={() => changeDay(-1)}>‹</button>
				<div>
					<span>Anzeigetag</span>
					<strong>{viewWeekdayName}</strong>
				</div>
				<button onclick={() => changeDay(1)}>›</button>
			</div>

			<label class="duration-control">
				<span>Dauer pro Etage</span>
				<input
					type="range"
					min="6"
					max="30"
					step="1"
					value={pageSeconds}
					oninput={(event) => setPageSeconds(event.currentTarget.value)}
				/>
				<strong>{pageSeconds}s</strong>
			</label>
		</div>
	{/if}
</main>

<style>
	.display-shell {
		--panel: rgba(9, 18, 28, 0.78);
		--line: rgba(244, 238, 214, 0.16);
		--line-strong: rgba(244, 238, 214, 0.28);
		--muted: rgba(246, 243, 232, 0.62);
		--accent: #7dd3fc;
		position: relative;
		display: grid;
		grid-template-columns: minmax(260px, 18vw) minmax(0, 1fr);
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background:
			linear-gradient(135deg, rgba(7, 16, 22, 0.91), rgba(8, 18, 31, 0.75)),
			radial-gradient(circle at 74% 18%, rgba(125, 211, 252, 0.16), transparent 32%),
			radial-gradient(circle at 16% 86%, rgba(253, 186, 116, 0.16), transparent 34%),
			#071016;
	}

	.status-rail {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto auto auto auto;
		gap: 14px;
		padding: clamp(16px, 2vw, 28px);
		border-right: 1px solid var(--line);
		background: rgba(5, 12, 19, 0.76);
		backdrop-filter: blur(18px);
	}

	.brand-block span,
	.runner-block span,
	.metric-row span,
	.system-row,
	.time-block span,
	.sheet-grid span,
	.control-sheet header span,
	.sheet-day-row span,
	.duration-control span {
		color: var(--muted);
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.brand-block strong {
		display: block;
		margin-top: 4px;
		font-size: clamp(28px, 3.8vw, 54px);
		line-height: 0.95;
		letter-spacing: 0;
	}

	button {
		border: 1px solid var(--line);
		background: rgba(246, 243, 232, 0.05);
		color: #f6f3e8;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.52;
	}

	.floor-nav {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.floor-nav button {
		position: relative;
		min-height: 54px;
		padding: 8px;
		text-align: left;
	}

	.floor-nav button.active {
		border-color: rgba(125, 211, 252, 0.7);
		background: rgba(125, 211, 252, 0.12);
	}

	.floor-nav button.active::after {
		content: '';
		position: absolute;
		right: 8px;
		bottom: 6px;
		left: 8px;
		height: 3px;
		background: linear-gradient(90deg, #7dd3fc, #86efac);
	}

	.floor-nav span,
	.floor-nav small {
		display: block;
	}

	.floor-nav span {
		font-size: 15px;
		font-weight: 900;
	}

	.floor-nav small {
		margin-top: 3px;
		color: var(--muted);
		font-weight: 800;
	}

	.runner-block {
		align-self: center;
		padding: 18px;
		overflow: hidden;
		border: 1px solid rgba(134, 239, 172, 0.32);
		background: linear-gradient(135deg, rgba(20, 83, 45, 0.48), rgba(6, 95, 70, 0.18));
	}

	.runner-block strong {
		display: block;
		margin-top: 6px;
		font-size: clamp(22px, 2.3vw, 36px);
		line-height: 1.05;
	}

	.time-block strong {
		display: block;
		font-size: clamp(36px, 4vw, 64px);
		line-height: 1;
	}

	.ops-block {
		display: grid;
		grid-template-columns: 46px 1fr 46px;
		align-items: center;
		gap: 8px;
		text-align: center;
	}

	.ops-block > button,
	.menu-trigger {
		min-height: 46px;
		font-size: 24px;
		font-weight: 900;
	}

	.ops-block strong {
		display: block;
		color: #86efac;
		font-size: 16px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.today-button {
		margin-top: 4px;
		border: 0;
		background: transparent;
		color: var(--muted);
		font-size: 12px;
		font-weight: 800;
	}

	.metric-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.metric-row div {
		padding: 10px 8px;
		border: 1px solid var(--line);
		background: rgba(246, 243, 232, 0.04);
	}

	.metric-row strong {
		display: block;
		font-size: 26px;
		line-height: 1;
	}

	.system-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 8px;
	}

	.connection-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #22c55e;
	}

	[data-connection='partial'] .connection-dot {
		background: #f59e0b;
	}

	[data-connection='offline'] .connection-dot {
		background: #ef4444;
	}

	.menu-trigger {
		padding: 0 14px;
		font-size: 14px;
	}

	.stage {
		position: relative;
		min-width: 0;
		min-height: 0;
		padding: clamp(16px, 2vw, 34px);
	}

	.room-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		gap: clamp(12px, 1.4vw, 24px);
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	.room-grid.one {
		grid-template-columns: 1fr;
	}

	.room-grid.two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.room-grid.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.room-grid.four {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(2, minmax(0, 1fr));
	}

	.room-card {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 0;
		flex-direction: column;
		padding: clamp(18px, 2vw, 32px);
		overflow: hidden;
		border: 1px solid rgba(246, 243, 232, 0.13);
		background:
			linear-gradient(135deg, rgba(14, 24, 34, 0.95), rgba(15, 23, 42, 0.82)),
			linear-gradient(90deg, rgba(125, 211, 252, 0.14), transparent 32%);
		box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
	}

	.room-card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 9px;
		background: #94a3b8;
		opacity: 0.78;
	}

	.room-card.open::before {
		background: #22c55e;
	}

	.room-card.opening::before {
		background: #eab308;
	}

	.room-card.closing::before {
		background: #f97316;
	}

	.state-line {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 9px;
		min-height: 30px;
		padding: 6px 10px;
		border: 1px solid rgba(148, 163, 184, 0.24);
		background: rgba(148, 163, 184, 0.1);
		color: rgba(226, 232, 240, 0.86);
		font-size: clamp(11px, 1vw, 15px);
		font-weight: 900;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}

	.state-line span {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #94a3b8;
	}

	.open .state-line {
		border-color: rgba(34, 197, 94, 0.32);
		background: rgba(34, 197, 94, 0.12);
	}

	.open .state-line span {
		background: #22c55e;
	}

	.opening .state-line {
		border-color: rgba(234, 179, 8, 0.34);
		background: rgba(234, 179, 8, 0.13);
	}

	.opening .state-line span {
		background: #eab308;
	}

	.closing .state-line {
		border-color: rgba(249, 115, 22, 0.34);
		background: rgba(249, 115, 22, 0.13);
	}

	.closing .state-line span {
		background: #f97316;
	}

	.room-copy {
		min-height: 0;
	}

	.room-card h2 {
		margin: clamp(12px, 1.5vw, 22px) 0 0;
		font-size: clamp(34px, 4vw, 76px);
		line-height: 0.98;
		letter-spacing: 0;
		hyphens: auto;
		overflow-wrap: normal;
		word-break: normal;
	}

	.room-card p {
		display: -webkit-box;
		margin: 12px 0 0;
		max-width: 24ch;
		overflow: hidden;
		color: rgba(246, 243, 232, 0.72);
		font-size: clamp(20px, 1.9vw, 34px);
		font-weight: 850;
		line-height: 1.08;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	.activity-image {
		position: relative;
		flex: 0 1 auto;
		width: min(58%, 420px);
		min-height: 54px;
		max-height: clamp(66px, 20vh, 190px);
		margin: clamp(12px, 1.5vw, 20px) 0 0;
		overflow: hidden;
		border: 1px solid rgba(246, 243, 232, 0.2);
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
			rgba(4, 10, 18, 0.46);
		aspect-ratio: 16 / 7;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
	}

	.activity-image.medium {
		width: min(66%, 500px);
		aspect-ratio: 16 / 8;
	}

	.activity-image.large {
		width: min(74%, 580px);
		aspect-ratio: 16 / 9;
	}

	.activity-image img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		transform-origin: center;
	}

	.room-card footer {
		display: grid;
		grid-template-columns: minmax(0, auto) minmax(0, 1fr);
		gap: 14px;
		align-items: end;
		margin-top: auto;
		padding-top: clamp(12px, 1.6vw, 24px);
		font-size: clamp(17px, 1.45vw, 28px);
		font-weight: 900;
	}

	.room-card footer strong {
		min-width: 0;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.page-progress {
		position: absolute;
		left: clamp(16px, 2vw, 34px);
		right: clamp(16px, 2vw, 34px);
		bottom: 10px;
		height: 4px;
		background: linear-gradient(90deg, #7dd3fc, #86efac);
		transform-origin: left center;
		animation: page-progress linear forwards;
	}

	@keyframes page-progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 30;
		border: 0;
		background: rgba(0, 0, 0, 0.36);
		backdrop-filter: blur(3px);
	}

	.control-sheet {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 31;
		display: grid;
		gap: 14px;
		width: min(760px, calc(100vw - 28px));
		margin: 0 auto 14px;
		padding: 18px;
		border: 1px solid var(--line-strong);
		background: rgba(6, 14, 22, 0.96);
		box-shadow: 0 -26px 90px rgba(0, 0, 0, 0.46);
	}

	.control-sheet header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
	}

	.control-sheet header strong {
		display: block;
		margin-top: 3px;
		font-size: 26px;
	}

	.sheet-close {
		width: 56px;
		height: 56px;
		font-size: 34px;
		line-height: 1;
	}

	.sheet-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.sheet-grid button {
		min-height: 74px;
		padding: 12px 14px;
		text-align: left;
	}

	.sheet-grid button.active {
		border-color: rgba(134, 239, 172, 0.42);
		background: rgba(34, 197, 94, 0.14);
	}

	.sheet-grid strong {
		display: block;
		margin-top: 4px;
		font-size: 18px;
	}

	.sheet-day-row {
		display: grid;
		grid-template-columns: 64px 1fr 64px;
		align-items: center;
		gap: 10px;
		text-align: center;
	}

	.sheet-day-row button {
		height: 58px;
		font-size: 30px;
		font-weight: 900;
	}

	.sheet-day-row strong {
		display: block;
		margin-top: 4px;
		color: #86efac;
		font-size: 22px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.duration-control {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		min-height: 64px;
	}

	.duration-control input {
		width: 100%;
		accent-color: #86efac;
	}

	.duration-control strong {
		font-size: 20px;
	}

	.empty-state {
		display: grid;
		height: 100%;
		place-content: center;
		text-align: center;
		color: var(--muted);
	}

	.empty-state strong {
		color: #f6f3e8;
		font-size: 44px;
	}

	.empty-state span {
		margin-top: 10px;
		font-size: 20px;
	}

	@media (orientation: landscape) and (max-width: 1180px) {
		.display-shell {
			grid-template-columns: 1fr;
			grid-template-rows: 138px minmax(0, 1fr);
		}

		.status-rail {
			grid-template-columns: minmax(172px, 0.78fr) minmax(232px, 1.1fr) minmax(110px, 0.46fr) minmax(250px, 1fr) 78px;
			grid-template-rows: 58px 58px;
			grid-template-areas:
				"brand runner time metrics system"
				"floors floors ops ops system";
			gap: 7px 8px;
			padding: 8px 10px;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.brand-block {
			grid-area: brand;
			min-width: 0;
		}

		.floor-nav {
			grid-area: floors;
		}

		.runner-block {
			grid-area: runner;
		}

		.time-block {
			grid-area: time;
		}

		.ops-block {
			grid-area: ops;
		}

		.metric-row {
			grid-area: metrics;
		}

		.system-row {
			grid-area: system;
		}

		.brand-block strong {
			font-size: clamp(22px, 3.4vw, 32px);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.brand-block span,
		.runner-block span,
		.metric-row span,
		.system-row,
		.time-block span,
		.sheet-grid span,
		.control-sheet header span,
		.sheet-day-row span,
		.duration-control span {
			font-size: 9px;
			letter-spacing: 0.08em;
		}

		.floor-nav {
			display: flex;
			gap: 6px;
			min-width: 0;
		}

		.floor-nav button {
			flex: 1 1 0;
			min-width: 0;
			min-height: 54px;
			padding: 7px 8px;
		}

		.floor-nav span {
			font-size: 13px;
			line-height: 1.05;
		}

		.floor-nav small {
			margin-top: 3px;
			font-size: 10px;
			line-height: 1;
		}

		.runner-block {
			align-self: stretch;
			padding: 8px 12px;
			text-align: center;
		}

		.runner-block strong {
			font-size: clamp(15px, 2.4vw, 21px);
			line-height: 1.05;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.time-block strong {
			font-size: clamp(23px, 3.3vw, 34px);
		}

		.ops-block {
			grid-template-columns: 48px minmax(136px, 1fr) 48px;
			gap: 8px;
		}

		.ops-block > button {
			min-height: 50px;
			font-size: 22px;
		}

		.ops-block strong {
			font-size: 15px;
			line-height: 1;
		}

		.today-button {
			margin-top: 2px;
			font-size: 10px;
			line-height: 1;
		}

		.metric-row {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.metric-row div {
			padding: 7px 8px;
		}

		.metric-row strong {
			font-size: 22px;
		}

		.system-row {
			grid-template-columns: 1fr;
			place-items: center;
			gap: 5px;
			text-align: center;
			font-size: 9px;
		}

		.connection-label {
			display: none;
		}

		.connection-dot {
			width: 10px;
			height: 10px;
		}

		.menu-trigger {
			width: 70px;
			min-height: 48px;
			padding: 0;
			font-size: 13px;
		}

		.stage {
			padding: 10px 12px 15px;
			min-height: 0;
		}

		.room-grid {
			gap: 9px;
		}

		.room-grid.three {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			grid-template-rows: minmax(0, 1fr);
		}

		.room-card {
			padding: 14px 16px 13px 21px;
			box-shadow: none;
		}

		.room-card::before {
			width: 7px;
		}

		.state-line {
			min-height: 26px;
			padding: 5px 8px;
			gap: 7px;
			font-size: 10px;
		}

		.state-line span {
			width: 9px;
			height: 9px;
		}

		.room-card h2 {
			margin-top: 10px;
			font-size: clamp(28px, 4.2vw, 44px);
			line-height: 1;
		}

		.room-grid.three .room-card h2 {
			font-size: clamp(27px, 3.8vw, 40px);
		}

		.room-card p {
			margin-top: 8px;
			max-width: 23ch;
			font-size: clamp(18px, 2.55vw, 25px);
			line-height: 1.08;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		.room-grid.three .room-card p {
			font-size: clamp(17px, 2.2vw, 22px);
		}

		.activity-image {
			width: min(64%, 330px);
			max-height: 82px;
			margin-top: 9px;
		}

		.activity-image.medium {
			width: min(70%, 360px);
		}

		.activity-image.large {
			width: min(78%, 390px);
		}

		.room-card footer {
			gap: 10px;
			padding-top: 10px;
			font-size: clamp(14px, 1.8vw, 18px);
		}

		.page-progress {
			left: 12px;
			right: 12px;
			bottom: 6px;
			height: 3px;
		}

		.control-sheet {
			width: min(720px, calc(100vw - 24px));
			margin-bottom: 12px;
			padding: 14px;
		}
	}

	@media (orientation: landscape) and (max-width: 860px) {
		.display-shell {
			grid-template-rows: 148px minmax(0, 1fr);
		}

		.status-rail {
			grid-template-columns: minmax(148px, 0.9fr) minmax(210px, 1.25fr) minmax(150px, 0.9fr) 68px;
			grid-template-areas:
				"brand runner metrics system"
				"floors floors ops system";
		}

		.time-block {
			display: none;
		}

		.room-grid.three {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.activity-image {
			max-height: 66px;
		}
	}

	@media (max-width: 900px) and (orientation: portrait) {
		.display-shell {
			grid-template-columns: 1fr;
			grid-template-rows: auto minmax(0, 1fr);
			overflow-y: auto;
		}

		.status-rail {
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.room-grid,
		.room-grid.three,
		.room-grid.four {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			height: auto;
		}
	}
</style>
