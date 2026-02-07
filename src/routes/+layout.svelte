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

		// ✅ GEÄNDERT: Fullscreen nur bei explizitem User-Click
		// Nicht automatisch, da Browser das blockieren
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

		// ✅ NUR bei User-Click aktivieren (nicht automatisch)
		// Entferne automatischen Start nach 1 Sekunde
		// setTimeout(enterFullscreen, 1000); // ← DEAKTIVIERT
		
		// User kann manuell Vollbild aktivieren (z.B. F11 oder Button)
		document.addEventListener('dblclick', enterFullscreen, { once: true });

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

	:global(html) {
		/* KRITISCH: Glattes Scrollen für das gesamte Dokument */
		scroll-behavior: smooth;
		/* Hardware-Beschleunigung aktivieren */
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow: hidden;
		color: var(--color-text-primary);
		transition: background 0.5s ease, color 0.3s ease;
		position: relative;
		/* GPU-Beschleunigung für bessere Performance */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		/* Verhindert Text-Ruckeln beim Scrollen */
		text-rendering: optimizeLegibility;
		/* Background wird von themes.ts per JS gesetzt */
	}

	:global(button) {
		font-family: inherit;
		/* Verhindert doppeltes Tippen auf iOS */
		-webkit-tap-highlight-color: transparent;
		/* Touch-Feedback verbessern */
		touch-action: manipulation;
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
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Performance-Optimierung: Verhindert Layout-Thrashing */
	:global(img, video, iframe) {
		will-change: transform;
		transform: translateZ(0);
	}

	/* Verbesserte Scrollbar für große Displays */
	:global(::-webkit-scrollbar) {
		width: 14px;
		height: 14px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 7px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 7px;
		border: 2px solid rgba(0, 0, 0, 0.3);
		/* GPU-Beschleunigung auch für Scrollbar */
		transform: translateZ(0);
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.4);
	}

	/* Firefox Scrollbar */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.3);
	}

	/* Touch-Optimierung für iPad */
	:global(*) {
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
	}

	/* Verhindert Zoom beim Doppelklick auf iOS */
	:global(input, textarea, button, select, a) {
		touch-action: manipulation;
	}

	/* Performance-Boost für Animationen */
	:global(*[data-animate]) {
		will-change: transform, opacity;
		transform: translateZ(0);
	}

	/* Reduziere Motion für Nutzer mit Präferenzen */
	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}
</style>