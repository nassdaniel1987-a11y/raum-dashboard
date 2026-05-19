<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadDisplayData,
		startBlitzPolling,
		startDisplayClock,
		stopBlitzPolling,
		subscribeDisplayRealtime,
		unsubscribeDisplayRealtime
	} from '$lib/stores/displayStore';

	let { children } = $props();

	onMount(() => {
		const stopClock = startDisplayClock();
		void (async () => {
			await loadDisplayData();
			subscribeDisplayRealtime();
			startBlitzPolling();
		})();

		return () => {
			stopClock();
			stopBlitzPolling();
			unsubscribeDisplayRealtime();
		};
	});
</script>

<svelte:head>
	<title>Raum Display</title>
</svelte:head>

{@render children?.()}

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html),
	:global(body) {
		margin: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #071016;
		color: #f6f3e8;
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	:global(button) {
		font: inherit;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
</style>
