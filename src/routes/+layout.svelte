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

		// Vollbild-Modus aktivieren // ENTFERNT
		/*
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
				}
			} catch (err) {
				console.log('Fullscreen nicht verfügbar:', err);
			}
		};
		*/

		// Warte 1 Sekunde, dann Vollbild aktivieren // ENTFERNT
		// setTimeout(enterFullscreen, 1000);

		// Optional: Bei Klick auch Vollbild versuchen (falls automatisch nicht klappt) // ENTFERNT
		// document.addEventListener('click', enterFullscreen, { once: true });

		return () => {
			unsubscribeFromRealtimeUpdates();
		};
	});
</script>

<svelte:head>
	<title>Digitales Raum-Dashboard</title>
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
</style>