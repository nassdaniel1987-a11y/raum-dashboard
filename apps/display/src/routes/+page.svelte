<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
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

	let activePageIndex = $state(0);
	let autoRotate = $state(true);
	let pageSeconds = $state(DEFAULT_PAGE_SECONDS);
	let progressKey = $state(0);
	let menuOpen = $state(false);
	let fullscreen = $state(false);
	let pageTimer: ReturnType<typeof setTimeout> | undefined;

	let activePage = $derived($displayPages[activePageIndex] ?? $displayPages[0] ?? null);
	let pageRooms = $derived(activePage?.rooms ?? []);
	let pageOpen = $derived(pageRooms.filter((room) => room.isOpen).length);
	let totalOpen = $derived($displayPages.flatMap((page) => page.rooms).filter((room) => room.isOpen).length);
	let formattedDate = $derived($currentTime.toLocaleDateString('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit'
	}));
	let formattedTime = $derived($currentTime.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit'
	}));
	let viewWeekdayName = $derived(weekdayNames[$viewWeekday % 7]);

	$effect(() => {
		if ($displayPages.length > 0 && activePageIndex >= $displayPages.length) {
			activePageIndex = 0;
		}
	});

	$effect(() => {
		if (autoRotate) scheduleNextPage();
	});

	function clearPageTimer() {
		if (pageTimer) clearTimeout(pageTimer);
		pageTimer = undefined;
	}

	function scheduleNextPage() {
		clearPageTimer();
		if (!autoRotate || $displayPages.length < 2) return;
		progressKey += 1;
		pageTimer = setTimeout(() => {
			goToPage(activePageIndex + 1, false);
			scheduleNextPage();
		}, pageSeconds * 1000);
	}

	function goToPage(index: number, restart = true) {
		if ($displayPages.length === 0) return;
		activePageIndex = (index + $displayPages.length) % $displayPages.length;
		if (restart) scheduleNextPage();
	}

	function changeDay(offset: number) {
		setViewDay($viewWeekday + offset);
		activePageIndex = 0;
		scheduleNextPage();
	}

	function goToday() {
		setViewDay(new Date().getDay() || 7);
		activePageIndex = 0;
		scheduleNextPage();
	}

	async function toggleFullscreen() {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
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

	function roomState(room: DisplayRoom): 'open' | 'closed' | 'opening' | 'closing' {
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

	onMount(() => {
		const savedAuto = localStorage.getItem('display-auto-rotate');
		const savedSeconds = localStorage.getItem('display-page-seconds');
		if (savedAuto !== null) autoRotate = savedAuto === 'true';
		if (savedSeconds) pageSeconds = Number(savedSeconds) || DEFAULT_PAGE_SECONDS;

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
			<span>
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
			<button class="menu-trigger" onclick={() => (menuOpen = !menuOpen)}>Menü</button>
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
			<div class="room-grid" class:one={pageRooms.length === 1} class:two={pageRooms.length === 2} class:three={pageRooms.length === 3}>
				{#each pageRooms as room (room.id)}
					<article class="room-card" class:open={roomState(room) === 'open'} class:opening={roomState(room) === 'opening'} class:closing={roomState(room) === 'closing'}>
						<div class="state-line">
							<span></span>
							<strong>{stateLabel(room)}</strong>
						</div>
						<h2>{room.name}</h2>
						<p>{room.config.activity || 'Keine Aktivität eingetragen'}</p>
						<footer>
							<span>{timeLabel(room)}</span>
							<strong>{room.displayPersons.length ? room.displayPersons.join(' / ') : 'Keine Person'}</strong>
						</footer>
					</article>
				{/each}
			</div>
		{/if}

		{#if autoRotate && $displayPages.length > 1}
			{#key `${activePageIndex}-${progressKey}`}
				<div class="page-progress" style={`animation-duration: ${pageSeconds}s;`}></div>
			{/key}
		{/if}
	</section>

	{#if menuOpen}
		<div class="control-panel">
			<button onclick={() => { autoRotate = !autoRotate; localStorage.setItem('display-auto-rotate', String(autoRotate)); scheduleNextPage(); }}>
				{autoRotate ? 'Auto-Wechsel pausieren' : 'Auto-Wechsel starten'}
			</button>
			<button onclick={toggleFullscreen}>{fullscreen ? 'Vollbild verlassen' : 'Vollbild starten'}</button>
			<button onclick={() => void refreshBlitzData()}>Blitz aktualisieren</button>
			<label>
				<span>Dauer pro Seite</span>
				<input
					type="range"
					min="6"
					max="30"
					step="1"
					bind:value={pageSeconds}
					onchange={() => {
						localStorage.setItem('display-page-seconds', String(pageSeconds));
						scheduleNextPage();
					}}
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
			linear-gradient(135deg, rgba(7, 16, 22, 0.88), rgba(8, 18, 31, 0.7)),
			radial-gradient(circle at 74% 18%, rgba(125, 211, 252, 0.2), transparent 32%),
			radial-gradient(circle at 16% 86%, rgba(253, 186, 116, 0.18), transparent 34%),
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
	.time-block span {
		color: var(--muted);
		font-size: 12px;
		font-weight: 800;
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

	.floor-nav {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	button {
		border: 1px solid var(--line);
		background: rgba(246, 243, 232, 0.05);
		color: #f6f3e8;
		cursor: pointer;
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
		padding: clamp(16px, 2vw, 34px);
	}

	.room-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: minmax(220px, 1fr);
		gap: clamp(12px, 1.4vw, 24px);
		width: 100%;
		height: 100%;
	}

	.room-grid.one {
		grid-template-columns: 1fr;
	}

	.room-grid.two {
		grid-auto-rows: 1fr;
	}

	.room-grid.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
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
			linear-gradient(135deg, rgba(14, 24, 34, 0.94), rgba(15, 23, 42, 0.78)),
			linear-gradient(90deg, rgba(125, 211, 252, 0.14), transparent 32%);
		box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
	}

	.room-card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 9px;
		background: #94a3b8;
		opacity: 0.72;
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
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: clamp(12px, 1.1vw, 16px);
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.state-line span {
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: #94a3b8;
	}

	.open .state-line span {
		background: #22c55e;
		box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.14);
	}

	.opening .state-line span {
		background: #eab308;
	}

	.closing .state-line span {
		background: #f97316;
	}

	.room-card h2 {
		margin: clamp(14px, 1.8vw, 24px) 0 0;
		font-size: clamp(38px, 4.2vw, 78px);
		line-height: 0.95;
		letter-spacing: 0;
		hyphens: auto;
		overflow-wrap: normal;
		word-break: normal;
	}

	.room-card p {
		margin: 16px 0 0;
		max-width: 20ch;
		color: rgba(246, 243, 232, 0.72);
		font-size: clamp(22px, 2vw, 36px);
		font-weight: 800;
		line-height: 1.08;
	}

	.room-card footer {
		display: grid;
		grid-template-columns: minmax(0, auto) minmax(0, 1fr);
		gap: 14px;
		align-items: end;
		margin-top: auto;
		padding-top: 24px;
		font-size: clamp(18px, 1.55vw, 28px);
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
		bottom: 12px;
		height: 4px;
		background: linear-gradient(90deg, #7dd3fc, #86efac);
		transform-origin: left center;
		animation: page-progress linear forwards;
	}

	@keyframes page-progress {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}

	.control-panel {
		position: absolute;
		right: 24px;
		bottom: 24px;
		z-index: 10;
		display: grid;
		width: min(360px, calc(100vw - 48px));
		gap: 10px;
		padding: 14px;
		border: 1px solid var(--line);
		background: rgba(5, 12, 19, 0.94);
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
	}

	.control-panel button,
	.control-panel label {
		min-height: 52px;
		padding: 0 14px;
		border: 1px solid var(--line);
		background: rgba(246, 243, 232, 0.06);
		color: #f6f3e8;
	}

	.control-panel label {
		display: grid;
		grid-template-columns: 1fr 120px auto;
		align-items: center;
		gap: 10px;
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
			grid-template-rows: 104px minmax(0, 1fr);
		}

		.status-rail {
			grid-template-columns: minmax(178px, 0.86fr) minmax(270px, 1.18fr) minmax(150px, 0.62fr) minmax(190px, 0.84fr) 56px;
			grid-template-rows: 48px 40px;
			grid-template-areas:
				"brand runner time metrics system"
				"floors floors ops metrics system";
			gap: 6px 8px;
			padding: 7px 10px 8px;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.brand-block { grid-area: brand; }
		.floor-nav { grid-area: floors; }
		.runner-block { grid-area: runner; }
		.time-block { grid-area: time; }
		.ops-block { grid-area: ops; }
		.metric-row { grid-area: metrics; }
		.system-row { grid-area: system; }

		.brand-block strong {
			font-size: 24px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.brand-block span,
		.runner-block span,
		.metric-row span,
		.system-row,
		.time-block span {
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
			min-height: 38px;
			padding: 5px 6px;
		}

		.floor-nav span {
			font-size: 13px;
			line-height: 1;
		}

		.floor-nav small {
			margin-top: 2px;
			font-size: 10px;
			line-height: 1;
		}

		.runner-block {
			align-self: stretch;
			padding: 6px 10px;
			overflow: hidden;
		}

		.runner-block strong {
			font-size: 17px;
			line-height: 1.05;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.time-block strong {
			font-size: 29px;
		}

		.ops-block {
			grid-template-columns: 38px minmax(104px, 1fr) 38px;
			gap: 6px;
		}

		.ops-block > button {
			min-height: 38px;
			font-size: 21px;
		}

		.ops-block strong {
			font-size: 14px;
			line-height: 1;
		}

		.today-button {
			margin-top: 1px;
			font-size: 10px;
			line-height: 1;
		}

		.metric-row div {
			padding: 5px 7px;
		}

		.metric-row strong {
			font-size: 20px;
		}

		.system-row {
			grid-template-columns: 1fr;
			place-items: center;
			gap: 4px;
			text-align: center;
			font-size: 9px;
		}

		.system-row > span:not(.connection-dot) {
			display: none;
		}

		.connection-dot {
			width: 9px;
			height: 9px;
		}

		.menu-trigger {
			width: 54px;
			min-height: 36px;
			padding: 0;
			font-size: 12px;
		}

		.stage {
			padding: 10px 12px 15px;
			min-height: 0;
		}

		.room-grid {
			grid-auto-rows: minmax(0, 1fr);
			gap: 9px;
		}

		.room-grid.three {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.room-card {
			padding: 18px 20px 16px 24px;
			box-shadow: none;
		}

		.room-card::before {
			width: 7px;
		}

		.state-line {
			gap: 8px;
			font-size: 11px;
		}

		.state-line span {
			width: 10px;
			height: 10px;
		}

		.room-card h2 {
			margin-top: 12px;
			font-size: clamp(34px, 4.4vw, 48px);
			line-height: 0.98;
		}

		.room-card p {
			margin-top: 10px;
			max-width: 23ch;
			font-size: clamp(20px, 2.7vw, 28px);
			line-height: 1.08;
		}

		.room-card footer {
			gap: 10px;
			padding-top: 14px;
			font-size: clamp(16px, 2vw, 20px);
		}

		.page-progress {
			left: 12px;
			right: 12px;
			bottom: 6px;
			height: 3px;
		}

		.control-panel {
			right: 12px;
			bottom: 12px;
			width: min(320px, calc(100vw - 24px));
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
		.room-grid.three {
			grid-template-columns: 1fr;
			height: auto;
		}
	}
</style>
