<script lang="ts">
	import { currentTime, currentWeekday } from '$lib/stores/appState';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

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

	// SVELTE 5 STATE für Vollbild
	let isFullscreen = $state(false);

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
	</div>

	<div class="header-center">
		<div class="weekday">{weekdayName}</div>
		<div class="separator">•</div>
		<div class="date">{formattedDate}</div>
	</div>

	<div class="header-right">
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
		color: white;
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

	.weekday {
		font-size: 18px;
		font-weight: 700;
		color: white;
		text-transform: uppercase;
		letter-spacing: 1px;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
	}

	.date {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.separator {
		color: rgba(255, 255, 255, 0.6);
		font-size: 16px;
		margin: 0 8px;
	}

	.fullscreen-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
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
		color: white;
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

		.weekday {
			font-size: 16px;
		}

		.time {
			font-size: 18px;
		}

		.fullscreen-btn {
			width: 36px;
			height: 36px;
			font-size: 18px;
		}
	}
</style>