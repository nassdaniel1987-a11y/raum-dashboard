<script lang="ts">
	import {
		currentTime,
		currentWeekday,
		isEditMode,
		runnerName as runnerNameStore,
		viewWeekday
	} from '$lib/stores/appState';
	import {
		calmActivePageIndex,
		calmCurrentPageLabel,
		calmHeaderStats,
		calmPageChangeRequest,
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
		handleFullscreenChange();

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	});
</script>

<header class="calm-header" transition:fade>
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
		min-width: 72px;
		min-height: 42px;
		padding: 5px 10px;
		border: 1px solid rgba(226, 232, 240, 0.12);
		background: rgba(15, 23, 42, 0.4);
		color: rgba(248, 250, 252, 0.72);
		text-align: left;
		cursor: pointer;
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

	@media (max-width: 1100px) {
		.calm-header {
			height: auto;
			grid-template-columns: 1fr;
		}

		.header-left,
		.header-right {
			justify-self: stretch;
			flex-wrap: wrap;
		}

		.runner-feature {
			justify-self: stretch;
		}
	}
</style>
