<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadAllData,
		subscribeToRealtimeUpdates,
		unsubscribeFromRealtimeUpdates
	} from '$lib/stores/appState';

	let { children } = $props();

	onMount(async () => {
		await loadAllData();
		subscribeToRealtimeUpdates();

		// Vollbild-Modus aktivieren
		const enterFullscreen = async () => {
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
				console.log('Vollbild nicht verfügbar:', err);
			}
		};

		setTimeout(enterFullscreen, 1000);
		document.addEventListener('click', enterFullscreen, { once: true });

		return () => {
			unsubscribeFromRealtimeUpdates();
		};
	});
</script>

<svelte:head>
	<title>Digitales Raum-Dashboard</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{@render children?.()}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(:root) {
		/* Default Theme (Space) - wird von themes.ts überschrieben */
		--color-primary: #667eea;
		--color-secondary: #764ba2;
		--color-accent: #3b82f6;
		--color-background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		--color-text-primary: #ffffff;
		--color-text-secondary: rgba(255, 255, 255, 0.9);
		--color-open-badge: rgba(34, 197, 94, 0.9);
		--color-closed-badge: rgba(239, 68, 68, 0.9);
		--color-time-badge: rgba(251, 146, 60, 0.95);
		--gradient-header: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		--gradient-toolbar: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		--gradient-card: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		--background-pattern: 
			radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
	}

	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow: hidden;
		background: var(--color-background);
		color: var(--color-text-primary);
		transition: background 0.5s ease, color 0.3s ease;
		position: relative;
	}

	/* Hintergrund-Pattern als Pseudo-Element */
	:global(body::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--background-pattern);
		pointer-events: none;
		z-index: 0;
		opacity: 1;
		transition: opacity 0.5s ease;
	}

	:global(button) {
		font-family: inherit;
	}

	/* Theme-spezifische Anpassungen */
	:global(.theme-space body) {
		/* Weltraum-Theme hat schon gute Defaults */
	}

	:global(.theme-dino body::before) {
		/* Dschungel-Effekt für Dino-Theme */
		opacity: 0.8;
	}

	:global(.theme-ocean body::before) {
		/* Wellen-Effekt für Ozean-Theme */
		opacity: 0.7;
	}

	:global(.theme-pokemon body::before) {
		/* Energie-Effekt für Pokémon-Theme */
		opacity: 0.9;
	}

	:global(.theme-minecraft body::before) {
		/* Block-Pattern für Minecraft-Theme */
		opacity: 0.4;
	}

	/* Vollbild-Optimierungen */
	:global(html:fullscreen) {
		overflow: hidden;
	}

	:global(html:-webkit-full-screen) {
		overflow: hidden;
	}

	:global(html:-moz-full-screen) {
		overflow: hidden;
	}

	:global(html:-ms-fullscreen) {
		overflow: hidden;
	}

	/* Smooth Transitions für alle Theme-Wechsel */
	:global(*) {
		transition-property: background-color, border-color, box-shadow;
		transition-duration: 0.3s;
		transition-timing-function: ease;
	}

	/* Scrollbar-Styling passend zum Theme */
	:global(::-webkit-scrollbar) {
		width: 10px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgba(0, 0, 0, 0.2);
	}

	:global(::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 5px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.3);
	}
</style>