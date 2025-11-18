<script lang="ts">
	import { currentTime, currentWeekday, viewWeekday, cardTheme } from '$lib/stores/appState';
	import { getAllThemes } from '$lib/cardThemes';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// SVELTE 5 PROPS - Auto-Scroll Controls & Help
	let { autoScrollActive = false, onToggleAutoScroll, onOpenHelp } = $props<{
		autoScrollActive?: boolean;
		onToggleAutoScroll?: () => void;
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

	// SVELTE 5 STATE für Theme-Switcher
	let showThemeMenu = $state(false);
	const allThemes = getAllThemes();

	function selectTheme(themeName: string) {
		cardTheme.set(themeName);
		showThemeMenu = false;
	}

	function toggleThemeMenu() {
		showThemeMenu = !showThemeMenu;
	}

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
		<!-- ✅ NEU: Auto-Scroll Toggle Button -->
		{#if onToggleAutoScroll}
			<button 
				class="autoscroll-btn" 
				class:active={autoScrollActive}
				onclick={onToggleAutoScroll}
				title={autoScrollActive ? 'Auto-Scroll pausieren' : 'Auto-Scroll starten'}
				aria-label={autoScrollActive ? 'Auto-Scroll pausieren' : 'Auto-Scroll starten'}
			>
				{#if autoScrollActive}
					<span class="icon">⏸️</span>
					<span class="label">Auto-Scroll</span>
				{:else}
					<span class="icon">▶️</span>
					<span class="label">Auto-Scroll</span>
				{/if}
			</button>
		{/if}

		<!-- ✅ NEU: Theme-Switcher -->
		<div class="theme-switcher">
			<button
				class="theme-btn"
				onclick={toggleThemeMenu}
				title="Theme wechseln"
				aria-label="Theme wechseln"
			>
				<span class="icon">🎨</span>
			</button>

			{#if showThemeMenu}
				<div class="theme-menu" transition:fade={{ duration: 200 }}>
					{#each allThemes as theme}
						<button
							class="theme-option"
							class:active={$cardTheme === theme.name}
							onclick={() => selectTheme(theme.name)}
						>
							<span class="theme-emoji">{theme.emoji}</span>
							<span class="theme-label">{theme.displayName}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<button
			class="fullscreen-btn"
			onclick={toggleFullscreen}
			title={isFullscreen ? 'Vollbild verlassen (ESC)' : 'Vollbild aktivieren'}
			aria-label={isFullscreen ? 'Vollbild verlassen' : 'Vollbild aktivieren'}
		>
			{#if isFullscreen}
				<span class="icon">⛶</span>
			{:else}
				<span class="icon">⛶</span>
			{/if}
		</button>
		
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

	/* ✅ NEU: Auto-Scroll Button Styles */
	.autoscroll-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: var(--color-text-primary);
		font-size: 14px;
		font-weight: 600;
		padding: 8px 14px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.autoscroll-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.autoscroll-btn:active {
		transform: translateY(0);
	}

	.autoscroll-btn.active {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
		}
		50% {
			box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
		}
	}

	.autoscroll-btn .icon {
		font-size: 16px;
	}

	.autoscroll-btn .label {
		font-size: 13px;
	}

	/* ✅ NEU: Theme-Switcher Styles */
	.theme-switcher {
		position: relative;
	}

	.theme-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: var(--color-text-primary);
		font-size: 20px;
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

	.theme-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.theme-btn:active {
		transform: scale(0.95);
	}

	.theme-btn .icon {
		font-size: 22px;
		line-height: 1;
	}

	.theme-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: rgba(30, 41, 59, 0.98);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 8px;
		min-width: 200px;
		max-height: 400px;
		overflow-y: auto;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.6),
			0 2px 16px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(20px);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.9);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.theme-option:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateX(4px);
	}

	.theme-option.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.theme-emoji {
		font-size: 20px;
		line-height: 1;
	}

	.theme-label {
		flex: 1;
	}

	.fullscreen-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: var(--color-text-primary);
		font-size: 20px;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.fullscreen-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.fullscreen-btn:active {
		transform: scale(0.95);
	}

	.fullscreen-btn .icon {
		font-size: 22px;
		line-height: 1;
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

		.autoscroll-btn .label {
			display: none;
		}

		.autoscroll-btn {
			min-width: 40px;
			padding: 8px;
			justify-content: center;
		}

		.fullscreen-btn {
			width: 36px;
			height: 36px;
			font-size: 18px;
		}
	}

	@media (max-width: 768px) {
		.header-right {
			gap: 8px;
		}

		.help-btn {
			width: 36px;
			height: 36px;
		}

		.autoscroll-btn,
		.fullscreen-btn {
			min-width: 36px;
			height: 36px;
		}
	}
</style>