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
