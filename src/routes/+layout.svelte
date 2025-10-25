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
					// Safari
					await (document.documentElement as any).webkitRequestFullscreen();
				} else if ((document.documentElement as any).mozRequestFullScreen) {
					// Firefox
					await (document.documentElement as any).mozRequestFullScreen();
				} else if ((document.documentElement as any).msRequestFullscreen) {
					// IE/Edge
					await (document.documentElement as any).msRequestFullscreen();
				}
			} catch (err) {
				console.log('Vollbild nicht verfügbar:', err);
			}
		};

		// Warte 1 Sekunde, dann Vollbild aktivieren
		setTimeout(enterFullscreen, 1000);

		// Optional: Bei Klick auch Vollbild versuchen (falls automatisch nicht klappt)
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

	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		overflow: hidden;
		background: #1a1a2e;
		color: white;
	}

	:global(button) {
		font-family: inherit;
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
</style>