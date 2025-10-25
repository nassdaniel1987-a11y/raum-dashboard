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
		/* Default Theme - wird von themes.ts überschrieben */
		--color-primary: #6b7280;
		--color-secondary: #4b5563;
		--color-accent: #9ca3af;
		--color-background: #000000;
		--color-text-primary: #ffffff;
		--color-text-secondary: rgba(255, 255, 255, 0.85);
		--color-open-badge: rgba(34, 197, 94, 0.9);
		--color-closed-badge: rgba(239, 68, 68, 0.9);
		--color-time-badge: rgba(156, 163, 175, 0.9);
		--header-bg: #1a1a1a;
		--toolbar-bg: #1a1a1a;
		--card-bg: #2d2d2d;
	}

	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow: hidden;
		background: var(--color-background);
		color: var(--color-text-primary);
		transition: background 0.5s ease, color 0.3s ease;
		position: relative;
	}

	:global(button) {
		font-family: inherit;
	}

	/* Theme-spezifische Anpassungen */
	:global(.theme-space body) {
		/* Weltraum-Theme hat schon gute Defaults */
	}

	:global(.theme-dino body) {
		/* Dschungel-Effekt für Dino-Theme */
	}

	:global(.theme-ocean body) {
		/* Wellen-Effekt für Ozean-Theme */
	}

	:global(.theme-pokemon body) {
		/* Energie-Effekt für Pokémon-Theme */
	}

	:global(.theme-minecraft body) {
		/* Block-Pattern für Minecraft-Theme */
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