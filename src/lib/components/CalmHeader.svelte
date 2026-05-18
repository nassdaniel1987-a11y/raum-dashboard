<script lang="ts">
	import {
		currentTime,
		currentWeekday,
		isEditMode,
		viewWeekday
	} from '$lib/stores/appState';
	import { calmCurrentPageLabel } from '$lib/stores/calmViewState';
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
	<div class="header-main">
		<div class="page-copy">
			<span class="eyebrow">Ruhige Ansicht</span>
			<h1>{$calmCurrentPageLabel}</h1>
		</div>

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
</header>

<style>
	.calm-header {
		position: fixed;
		inset: 0 0 auto;
		z-index: 100;
		height: 74px;
		padding: 10px 24px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		background: rgba(15, 23, 42, 0.72);
		border-bottom: 1px solid rgba(226, 232, 240, 0.12);
		backdrop-filter: blur(16px);
	}

	.header-main,
	.header-actions,
	.day-cluster,
	.meta-copy {
		display: flex;
		align-items: center;
	}

	.header-main {
		min-width: 0;
		gap: 20px;
		flex: 1;
	}

	.page-copy {
		min-width: 210px;
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
		font-size: 28px;
		line-height: 1;
		font-weight: 850;
		letter-spacing: 0;
	}

	.day-cluster {
		gap: 10px;
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
		font-size: 28px;
	}

	.day-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		min-width: 116px;
	}

	.weekday {
		color: rgba(248, 250, 252, 0.84);
		font-size: 16px;
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
		gap: 14px;
		color: rgba(226, 232, 240, 0.72);
		font-size: 14px;
		font-weight: 700;
	}

	.header-actions {
		gap: 10px;
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
		min-width: 84px;
	}

	@media (max-width: 900px) {
		.calm-header {
			height: auto;
			min-height: 74px;
			align-items: stretch;
			flex-direction: column;
		}

		.header-main {
			flex-wrap: wrap;
		}

		.page-copy {
			min-width: 0;
		}

		.header-actions {
			justify-content: flex-end;
		}
	}
</style>
