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
		<div class="logo">
			<span class="logo-text">Raum-Dashboard</span>
		</div>
	</div>

	<div class="header-center">
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

		<div class="separator"></div>
		<div class="date">{formattedDate}</div>
		<div class="separator"></div>
		<div class="time">{formattedTime}</div>
	</div>

	<div class="header-right">
		{#if onOpenMenu}
			<button class="admin-btn" onclick={onOpenMenu} title="Admin" aria-label="Admin öffnen">
				Admin
			</button>
		{/if}
	</div>
</header>

<style>
	.dashboard-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 50px;
		background: rgba(255, 255, 255, 0.95);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.header-left,
	.header-center,
	.header-right {
		display: flex;
		align-items: center;
	}

	.header-left {
		flex: 0 0 200px;
		justify-content: flex-start;
	}

	.header-center {
		flex: 1;
		justify-content: center;
		gap: 12px;
	}

	.header-right {
		flex: 0 0 200px;
		justify-content: flex-end;
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo-text {
		font-size: 16px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: #1a1a1a;
	}

	.admin-btn {
		background: #1a1a1a;
		border: none;
		color: white;
		font-size: 13px;
		font-weight: 500;
		padding: 8px 20px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0.01em;
	}

	.admin-btn:hover {
		background: #2a2a2a;
	}

	.admin-btn:active {
		transform: scale(0.98);
	}

	.day-nav-btn {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.12);
		color: #1a1a1a;
		font-size: 14px;
		font-weight: 500;
		width: 36px;
		height: 36px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.day-nav-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.2);
	}

	.day-nav-btn:active {
		transform: scale(0.96);
	}

	.day-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 140px;
	}

	.weekday {
		font-size: 15px;
		font-weight: 600;
		color: #1a1a1a;
		letter-spacing: 0.02em;
	}

	.weekday.today {
		color: #059669;
	}

	.today-btn {
		background: transparent;
		border: none;
		color: #6b7280;
		font-size: 11px;
		font-weight: 500;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s;
	}

	.today-btn:hover {
		color: #059669;
	}

	.date {
		font-size: 13px;
		color: #6b7280;
		font-weight: 500;
	}

	.separator {
		width: 1px;
		height: 20px;
		background: rgba(0, 0, 0, 0.08);
		margin: 0 12px;
	}

	.time {
		font-size: 14px;
		font-weight: 500;
		color: #1a1a1a;
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		letter-spacing: 0.03em;
	}

	@media (max-width: 1200px) {
		.dashboard-header {
			padding: 0 16px;
		}

		.logo-text {
			font-size: 15px;
		}

		.weekday {
			font-size: 14px;
		}

		.time {
			font-size: 13px;
		}
	}

	@media (max-width: 768px) {
		.header-left {
			flex: 0 0 auto;
		}

		.header-right {
			flex: 0 0 auto;
		}

		.day-nav-btn {
			width: 32px;
			height: 32px;
		}
	}
</style>