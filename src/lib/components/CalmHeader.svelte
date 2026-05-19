<script lang="ts">
	import {
		currentTime,
		currentWeekday,
		appSettings,
		isEditMode,
		runnerName as runnerNameStore,
		viewWeekday
	} from '$lib/stores/appState';
	import {
		calmActivePageIndex,
		calmCurrentPageLabel,
		calmHeaderStats,
		calmPageChangeRequest,
		calmPageProgress,
		calmPageSummaries
	} from '$lib/stores/calmViewState';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	let { onOpenMenu, canvasRef } = $props<{
		onOpenMenu?: () => void;
		canvasRef?: any;
	}>();

	let autoPageActive = $state(true);
	let isFullscreen = $state(false);
	let showExtras = $state(false);
	let viewportWidth = $state(1920);
	let viewportHeight = $state(1080);
	let isTouchDevice = $state(false);
	let extrasMenuEl: HTMLDivElement | undefined;

	let formattedTime = $derived($currentTime.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit'
	}));
	let formattedDate = $derived($currentTime.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	}));
	let viewWeekdayName = $derived(weekdayNames[$viewWeekday % 7]);
	let weekdayName = $derived(weekdayNames[$currentWeekday % 7]);
	let isToday = $derived($viewWeekday === $currentWeekday);
	let headerDensity = $derived($appSettings?.calm_header_density ?? 'compact');
	let isTabletLandscape = $derived(isTouchDevice && viewportWidth <= 1366 && viewportWidth > viewportHeight);

	function previousDay() {
		viewWeekday.update((day) => (day - 1 < 0 ? 6 : day - 1));
	}

	function nextDay() {
		viewWeekday.update((day) => (day + 1 > 6 ? 0 : day + 1));
	}

	function goToToday() {
		viewWeekday.set($currentWeekday);
	}

	async function toggleFullscreen() {
		try {
			if (!isFullscreen) {
				await document.documentElement.requestFullscreen?.();
			} else {
				await document.exitFullscreen?.();
			}
		} catch (error) {
			console.error('Vollbild konnte nicht umgeschaltet werden:', error);
		}
	}

	function toggleAutoPage() {
		if (canvasRef?.toggleAutoPage) {
			autoPageActive = canvasRef.toggleAutoPage();
		}
	}

	onMount(() => {
		const savedAutoPage = localStorage.getItem('autoPageEnabled');
		if (savedAutoPage !== null) {
			autoPageActive = savedAutoPage === 'true';
		}
		const updateViewport = () => {
			viewportWidth = window.visualViewport?.width ?? window.innerWidth;
			viewportHeight = window.visualViewport?.height ?? window.innerHeight;
			isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
		};

		const handleFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		const handlePointerDown = (event: PointerEvent) => {
			if (showExtras && extrasMenuEl && !extrasMenuEl.contains(event.target as Node)) {
				showExtras = false;
			}
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('pointerdown', handlePointerDown);
		window.addEventListener('resize', updateViewport);
		window.visualViewport?.addEventListener('resize', updateViewport);
		updateViewport();
		handleFullscreenChange();

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('resize', updateViewport);
			window.visualViewport?.removeEventListener('resize', updateViewport);
		};
	});
</script>

<header
	class="calm-header"
	class:comfortable={headerDensity === 'comfortable'}
	class:tablet-landscape={isTabletLandscape}
	transition:fade
>
	<div class="header-left">
		<div class="page-copy">
			<span class="eyebrow">Ruhige Ansicht</span>
			<h1>{$calmCurrentPageLabel}</h1>
		</div>

		<nav class="page-tabs" aria-label="Etagen">
			{#each $calmPageSummaries as page, index (page.id)}
				<button
					class="page-tab"
					class:active={index === $calmActivePageIndex}
					onclick={() => calmPageChangeRequest.set(index)}
					aria-current={index === $calmActivePageIndex ? 'page' : undefined}
				>
					<span>{page.short}</span>
					<small>{page.openCount}/{page.roomCount}</small>
					{#if index === $calmActivePageIndex && $calmPageProgress.enabled}
						{#key `${$calmActivePageIndex}-${$calmPageProgress.cycleKey}`}
							<i
								class="tab-progress"
								aria-hidden="true"
								style={`animation-duration: ${$calmPageProgress.duration}s;`}
							></i>
						{/key}
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	{#if $runnerNameStore}
		<div class="runner-feature">
			<span>Ansprechpartner</span>
			<strong>{$runnerNameStore}</strong>
		</div>
	{/if}

	<div class="header-right">
		<div class="day-cluster">
			<button class="quiet-icon" onclick={previousDay} aria-label="Vorheriger Tag">‹</button>
			<div class="day-copy">
				<span class="weekday" class:today={isToday}>{viewWeekdayName}</span>
				{#if !isToday}
					<button class="today-chip" onclick={goToToday}>Heute: {weekdayName}</button>
				{/if}
			</div>
			<button class="quiet-icon" onclick={nextDay} aria-label="Nächster Tag">›</button>
		</div>

		<div class="meta-copy">
			<span>{formattedDate}</span>
			<span>{formattedTime}</span>
		</div>

		<div class="header-status">
			<div class="metric">
				<strong>{$calmHeaderStats.pageOpen}</strong>
				<span>offen hier</span>
			</div>
			<div class="metric">
				<strong>{$calmHeaderStats.pageRooms}</strong>
				<span>Räume</span>
			</div>
			<div class="metric">
				<strong>{$calmHeaderStats.totalOpen}</strong>
				<span>offen gesamt</span>
			</div>
		</div>

		<div class="header-actions">
			<div class="extras-wrap" bind:this={extrasMenuEl}>
				<button
					class="extras-trigger"
					onclick={() => (showExtras = !showExtras)}
					aria-label="Weitere Aktionen"
					aria-expanded={showExtras}
				>
					•••
				</button>
				{#if showExtras}
					<div class="extras-menu">
						<button onclick={() => isEditMode.update((value) => !value)}>
							<span>{$isEditMode ? 'Bearbeiten aus' : 'Bearbeiten an'}</span>
						</button>
						<button onclick={toggleAutoPage}>
							<span>{autoPageActive ? 'Auto-Wechsel pausieren' : 'Auto-Wechsel starten'}</span>
						</button>
						<button onclick={toggleFullscreen}>
							<span>{isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}</span>
						</button>
					</div>
				{/if}
			</div>

			{#if onOpenMenu}
				<button class="menu-btn" onclick={onOpenMenu}>Menü</button>
			{/if}
		</div>
	</div>
</header>

<style>
	.calm-header {
		position: fixed;
		inset: 0 0 auto;
		z-index: 100;
		height: 74px;
		padding: 10px 20px;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 18px;
		background: rgba(15, 23, 42, 0.72);
		border-bottom: 1px solid rgba(226, 232, 240, 0.12);
		backdrop-filter: blur(16px);
	}

	.calm-header.comfortable {
		height: 88px;
		padding-top: 14px;
		padding-bottom: 14px;
	}

	.calm-header.comfortable h1 {
		font-size: 30px;
	}

	.calm-header.comfortable .page-tab,
	.calm-header.comfortable .quiet-icon,
	.calm-header.comfortable .extras-trigger,
	.calm-header.comfortable .menu-btn {
		min-height: 48px;
	}

	.header-left,
	.header-right,
	.day-cluster,
	.meta-copy,
	.header-status,
	.header-actions {
		display: flex;
		align-items: center;
	}

	.header-left {
		min-width: 0;
		gap: 16px;
		justify-self: start;
	}

	.header-right {
		gap: 12px;
		justify-self: end;
	}

	.page-copy {
		min-width: 190px;
	}

	.eyebrow {
		display: block;
		margin-bottom: 2px;
		color: rgba(226, 232, 240, 0.58);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		color: #f8fafc;
		font-size: 26px;
		line-height: 1;
		font-weight: 850;
		letter-spacing: 0;
	}

	.page-tabs {
		display: flex;
		min-width: 0;
		gap: 6px;
	}

	.page-tab {
		position: relative;
		min-width: 72px;
		min-height: 42px;
		padding: 5px 10px;
		border: 1px solid rgba(226, 232, 240, 0.12);
		background: rgba(15, 23, 42, 0.4);
		color: rgba(248, 250, 252, 0.72);
		text-align: left;
		cursor: pointer;
		overflow: hidden;
	}

	.page-tab.active {
		border-color: rgba(248, 250, 252, 0.32);
		background: rgba(248, 250, 252, 0.1);
		color: #ffffff;
	}

	.page-tab span,
	.page-tab small,
	.metric strong,
	.metric span,
	.runner-feature span,
	.runner-feature strong {
		display: block;
	}

	.page-tab span {
		font-size: 13px;
		font-weight: 850;
	}

	.page-tab small {
		margin-top: 2px;
		font-size: 10px;
		color: rgba(226, 232, 240, 0.62);
	}

	.tab-progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		background: linear-gradient(90deg, #38bdf8, #86efac);
		transform-origin: left center;
		animation: calm-tab-progress linear forwards;
	}

	@keyframes calm-tab-progress {
		from { transform: scaleX(0); }
		to { transform: scaleX(1); }
	}

	.runner-feature {
		justify-self: center;
		min-width: 210px;
		padding: 8px 18px;
		border: 1px solid rgba(134, 239, 172, 0.34);
		background: rgba(20, 83, 45, 0.3);
		text-align: center;
	}

	.runner-feature span {
		color: rgba(226, 232, 240, 0.62);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.runner-feature strong {
		margin-top: 2px;
		font-size: 19px;
		font-weight: 850;
		color: #f8fafc;
	}

	.day-cluster {
		gap: 8px;
	}

	.quiet-icon,
	.extras-trigger {
		width: 42px;
		height: 42px;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(15, 23, 42, 0.42);
		color: rgba(248, 250, 252, 0.82);
		cursor: pointer;
	}

	.quiet-icon {
		font-size: 26px;
	}

	.day-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		min-width: 104px;
	}

	.weekday {
		color: rgba(248, 250, 252, 0.84);
		font-size: 15px;
		font-weight: 850;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.weekday.today {
		color: #86efac;
	}

	.today-chip {
		border: 0;
		background: transparent;
		color: rgba(134, 239, 172, 0.88);
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
	}

	.meta-copy {
		gap: 10px;
		color: rgba(226, 232, 240, 0.72);
		font-size: 13px;
		font-weight: 700;
	}

	.header-status {
		gap: 6px;
	}

	.metric {
		min-width: 68px;
		padding: 6px 8px;
		border: 1px solid rgba(226, 232, 240, 0.14);
		background: rgba(15, 23, 42, 0.42);
	}

	.metric strong {
		font-size: 19px;
		line-height: 1;
	}

	.metric span {
		margin-top: 3px;
		color: rgba(226, 232, 240, 0.62);
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.extras-wrap {
		position: relative;
	}

	.extras-trigger {
		font-size: 16px;
		font-weight: 900;
	}

	.extras-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		display: grid;
		min-width: 210px;
		padding: 8px;
		gap: 6px;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(15, 23, 42, 0.96);
		box-shadow: 0 18px 44px rgba(2, 6, 23, 0.34);
	}

	.extras-menu button,
	.menu-btn {
		min-height: 42px;
		padding: 0 14px;
		border: 1px solid rgba(226, 232, 240, 0.14);
		background: rgba(248, 250, 252, 0.06);
		color: rgba(248, 250, 252, 0.88);
		font-size: 14px;
		font-weight: 750;
		cursor: pointer;
	}

	.extras-menu button {
		text-align: left;
	}

	.menu-btn {
		min-width: 76px;
	}

	@media (max-width: 1400px) {
		.page-copy {
			min-width: 168px;
		}

		h1 {
			font-size: 22px;
		}

		.page-tab {
			min-width: 62px;
		}

		.runner-feature {
			min-width: 180px;
		}

		.meta-copy {
			display: none;
		}
	}

	@media (max-width: 1280px) {
		.calm-header {
			gap: 12px;
		}
	}

	@media (max-width: 1100px) {
		.calm-header:not(.tablet-landscape) {
			grid-template-columns: minmax(0, 1fr);
			height: auto;
		}

		.calm-header:not(.tablet-landscape) .header-left,
		.calm-header:not(.tablet-landscape) .header-right {
			justify-self: stretch;
			flex-wrap: wrap;
		}

		.calm-header:not(.tablet-landscape) .runner-feature {
			justify-self: stretch;
		}
	}

	.calm-header.tablet-landscape {
		height: 122px;
		padding: 7px max(10px, env(safe-area-inset-right)) 8px max(14px, env(safe-area-inset-left));
		grid-template-columns: minmax(170px, 0.78fr) minmax(230px, 1fr) minmax(210px, 0.82fr);
		grid-template-rows: 48px 43px;
		grid-template-areas:
			"page runner actions"
			"tabs day stats";
		align-items: center;
		gap: 7px 9px;
	}

	.calm-header.tablet-landscape.comfortable {
		height: 136px;
		padding-top: 10px;
		padding-bottom: 10px;
		grid-template-rows: 54px 45px;
	}

	.calm-header.tablet-landscape .header-left,
	.calm-header.tablet-landscape .header-right {
		display: contents;
	}

	.calm-header.tablet-landscape .page-copy {
		grid-area: page;
		min-width: 0;
		overflow: hidden;
	}

	.calm-header.tablet-landscape .eyebrow {
		margin-bottom: 1px;
		font-size: 9px;
	}

	.calm-header.tablet-landscape h1 {
		font-size: 21px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.calm-header.tablet-landscape.comfortable h1 {
		font-size: 24px;
	}

	.calm-header.tablet-landscape .page-tabs {
		grid-area: tabs;
		align-self: stretch;
		gap: 5px;
		overflow: hidden;
	}

	.calm-header.tablet-landscape .page-tab {
		flex: 1 1 0;
		min-width: 0;
		min-height: 38px;
		padding: 5px 7px;
	}

	.calm-header.tablet-landscape .page-tab span {
		font-size: 12px;
	}

	.calm-header.tablet-landscape .runner-feature {
		grid-area: runner;
		justify-self: center;
		align-self: stretch;
		display: flex;
		width: min(330px, 100%);
		min-width: 0;
		box-sizing: border-box;
		flex-direction: column;
		justify-content: center;
		padding: 6px 10px;
	}

	.calm-header.tablet-landscape .runner-feature span {
		font-size: 9px;
	}

	.calm-header.tablet-landscape .runner-feature strong {
		font-size: 17px;
		line-height: 1.12;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.calm-header.tablet-landscape .day-cluster {
		grid-area: day;
		justify-self: center;
		align-self: stretch;
		gap: 6px;
	}

	.calm-header.tablet-landscape .quiet-icon,
	.calm-header.tablet-landscape .extras-trigger,
	.calm-header.tablet-landscape .menu-btn {
		width: 38px;
		height: 38px;
		min-height: 38px;
	}

	.calm-header.tablet-landscape .day-copy {
		min-width: 88px;
	}

	.calm-header.tablet-landscape .weekday {
		font-size: 13px;
	}

	.calm-header.tablet-landscape .header-status {
		grid-area: stats;
		justify-self: end;
		align-self: stretch;
		gap: 5px;
	}

	.calm-header.tablet-landscape .metric {
		display: flex;
		min-width: 52px;
		flex-direction: column;
		justify-content: center;
		padding: 4px 6px;
	}

	.calm-header.tablet-landscape .metric strong {
		font-size: 17px;
	}

	.calm-header.tablet-landscape .metric span {
		font-size: 8px;
	}

	.calm-header.tablet-landscape .header-actions {
		grid-area: actions;
		justify-self: end;
		align-self: center;
		gap: 6px;
	}

	.calm-header.tablet-landscape .menu-btn {
		min-width: 68px;
		padding: 0 10px;
	}

	@media (max-width: 760px) {
		.calm-header.tablet-landscape {
			height: 122px;
			grid-template-columns: minmax(130px, 0.7fr) minmax(190px, 1fr) auto;
			grid-template-rows: 48px 43px;
			grid-template-areas:
				"page runner actions"
				"tabs day stats";
		}

		.calm-header.tablet-landscape.comfortable {
			height: 136px;
		}

		.calm-header.tablet-landscape .runner-feature {
			width: min(280px, 100%);
		}

		.calm-header.tablet-landscape .page-tabs {
			overflow-x: auto;
		}

		.calm-header.tablet-landscape .page-tab {
			flex: 0 0 64px;
		}
	}
</style>
