<script lang="ts">
	import { currentTime, currentWeekday, viewWeekday } from '$lib/stores/appState';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// SVELTE 5 PROPS - Burger Menu & Help
	let { onOpenMenu, onOpenHelp } = $props<{
		onOpenMenu?: () => void;
		onOpenHelp?: () => void;
	}>();

	// SVELTE 5 DERIVED SYNTAX
	let formattedTime = $derived($currentTime.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}));

	let formattedDate = $derived($currentTime.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	}));

	let weekdayName = $derived(weekdayNames[$currentWeekday % 7]);
	let viewWeekdayName = $derived(weekdayNames[$viewWeekday % 7]);
	let isToday = $derived($viewWeekday === $currentWeekday);

	// SVELTE 5 STATE für Vollbild
	let isFullscreen = $state(false);

	// ✅ NEU: Tag-Navigation
	function previousDay() {
		viewWeekday.update(day => {
			const newDay = day - 1;
			return newDay < 0 ? 6 : newDay;
		});
	}

	function nextDay() {
		viewWeekday.update(day => {
			const newDay = day + 1;
			return newDay > 6 ? 0 : newDay;
		});
	}

	function goToToday() {
		viewWeekday.set($currentWeekday);
	}

	onMount(() => {
		// Überwache Vollbild-Status
		const handleFullscreenChange = () => {
			isFullscreen = !!(
				document.fullscreenElement ||
				(document as any).webkitFullscreenElement ||
				(document as any).mozFullScreenElement ||
				(document as any).msFullscreenElement
			);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.addEventListener('mozfullscreenchange', handleFullscreenChange);
		document.addEventListener('MSFullscreenChange', handleFullscreenChange);

		// Initial Status setzen
		handleFullscreenChange();

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
		};
	});

	async function toggleFullscreen() {
		if (!isFullscreen) {
			// Vollbild aktivieren
			try {
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen();
				} else if ((document.documentElement as any).webkitRequestFullscreen) {
					await (document.documentElement as any).webkitRequestFullscreen();
				} else if ((document.documentElement as any).mozRequestFullScreen) {
					await (document.documentElement as any).mozRequestFullScreen();
				} else if ((document.documentElement as any).msRequestFullscreen) {
					await (document.documentElement as any).msRequestFullscreen();
				}
			} catch (err) {
				console.error('Vollbild konnte nicht aktiviert werden:', err);
			}
		} else {
			// Vollbild verlassen
			try {
				if (document.exitFullscreen) {
					await document.exitFullscreen();
				} else if ((document as any).webkitExitFullscreen) {
					await (document as any).webkitExitFullscreen();
				} else if ((document as any).mozCancelFullScreen) {
					await (document as any).mozCancelFullScreen();
				} else if ((document as any).msExitFullscreen) {
					await (document as any).msExitFullscreen();
				}
			} catch (err) {
				console.error('Vollbild konnte nicht verlassen werden:', err);
			}
		}
	}
</script>

<header class="dashboard-header" transition:fade>
	<div class="header-left">
		<!-- Burger Menu Button -->
		{#if onOpenMenu}
			<button
				class="burger-btn"
				onclick={onOpenMenu}
				title="Menü öffnen"
				aria-label="Menü öffnen"
			>
				<span class="icon">☰</span>
			</button>
		{/if}

		<div class="logo">
			<span class="logo-icon">🏫</span>
			<span class="logo-text">Raum-Dashboard</span>
		</div>

		{#if onOpenHelp}
			<button
				class="help-btn"
				onclick={onOpenHelp}
				title="Hilfe & Anleitung"
				aria-label="Hilfe öffnen"
			>
				<span class="icon">❓</span>
			</button>
		{/if}
	</div>

	<div class="header-center">
		<!-- ✅ NEU: Tag-Navigation -->
		<button class="day-nav-btn" onclick={previousDay} title="Vorheriger Tag" aria-label="Vorheriger Tag">
			◀
		</button>

		<div class="day-display">
			<div class="weekday" class:today={isToday}>{viewWeekdayName}</div>
			{#if !isToday}
				<button class="today-btn" onclick={goToToday} title="Zurück zu heute">
					Heute: {weekdayName}
				</button>
			{/if}
		</div>

		<button class="day-nav-btn" onclick={nextDay} title="Nächster Tag" aria-label="Nächster Tag">
			▶
		</button>

		<div class="separator">•</div>
		<div class="date">{formattedDate}</div>
	</div>

	<div class="header-right">
		<div class="clock">
			<span class="time">{formattedTime}</span>
		</div>
	</div>
</header>

<style>
	.dashboard-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 50px;
		background: var(--header-bg);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.header-left,
	.header-center,
	.header-right {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.header-left {
		justify-content: flex-start;
		gap: 12px;
	}

	.header-center {
		justify-content: center;
		gap: 8px;
	}

	.header-right {
		justify-content: flex-end;
		gap: 12px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--color-text-primary);
	}

	.logo-icon {
		font-size: 24px;
		filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3));
	}

	.logo-text {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	/* Burger Menu Button */
	.burger-btn {
		background: rgba(59, 130, 246, 0.2);
		border: 2px solid rgba(59, 130, 246, 0.4);
		color: var(--color-text-primary);
		font-size: 24px;
		width: 44px;
		height: 44px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.burger-btn:hover {
		background: rgba(59, 130, 246, 0.4);
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
	}

	.burger-btn:active {
		transform: scale(0.95);
	}

	.burger-btn .icon {
		font-size: 26px;
		line-height: 1;
	}

	/* ✅ Hilfe-Button */
	.help-btn {
		background: rgba(96, 165, 250, 0.2);
		border: 2px solid rgba(96, 165, 250, 0.4);
		color: var(--color-text-primary);
		font-size: 20px;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.help-btn:hover {
		background: rgba(96, 165, 250, 0.4);
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(96, 165, 250, 0.5);
	}

	.help-btn:active {
		transform: scale(0.95);
	}

	.help-btn .icon {
		font-size: 22px;
		line-height: 1;
	}

	/* ✅ NEU: Tag-Navigation */
	.day-nav-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: var(--color-text-primary);
		font-size: 18px;
		font-weight: 700;
		width: 44px;
		height: 44px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.day-nav-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.day-nav-btn:active {
		transform: scale(0.95);
	}

	.day-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 160px;
	}

	.weekday {
		font-size: 18px;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 1px;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
		transition: all 0.3s;
	}

	.weekday.today {
		color: #22c55e;
		text-shadow:
			1px 1px 3px rgba(0, 0, 0, 0.4),
			0 0 10px rgba(34, 197, 94, 0.5);
	}

	.today-btn {
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.4);
		color: rgba(255, 255, 255, 0.9);
		font-size: 10px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.today-btn:hover {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
		transform: scale(1.05);
	}

	.date {
		font-size: 13px;
		color: var(--color-text-secondary);
		font-weight: 500;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.separator {
		color: rgba(255, 255, 255, 0.6);
		font-size: 16px;
		margin: 0 8px;
	}

	.clock {
		background: rgba(255, 255, 255, 0.2);
		padding: 6px 12px;
		border-radius: 8px;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.time {
		font-size: 20px;
		font-weight: 600;
		color: var(--color-text-primary);
		font-family: 'Courier New', monospace;
		letter-spacing: 1px;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
	}

	@media (max-width: 1200px) {
		.dashboard-header {
			padding: 0 15px;
		}

		.logo-text {
			font-size: 16px;
		}

		.burger-btn,
		.help-btn {
			width: 40px;
			height: 40px;
		}

		.weekday {
			font-size: 16px;
		}

		.time {
			font-size: 18px;
		}
	}

	@media (max-width: 768px) {
		.header-right {
			gap: 8px;
		}

		.burger-btn,
		.help-btn {
			width: 36px;
			height: 36px;
		}
	}
</style>