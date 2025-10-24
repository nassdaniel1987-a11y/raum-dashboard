<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { loadAllData, subscribeToRealtimeUpdates, unsubscribeFromRealtimeUpdates } from '$lib/stores/appState';
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import AdminToolbar from '$lib/components/AdminToolbar.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import SchedulerModal from '$lib/components/SchedulerModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let editingRoom: RoomWithConfig | null = null;
	let showScheduler = false;
	let showSettings = false;

	// Beim Start: Daten laden + Realtime aktivieren
	onMount(async () => {
		console.log('🚀 Dashboard mounted - Loading data...');
		await loadAllData();
		console.log('✅ Data loaded - Subscribing to realtime...');
		subscribeToRealtimeUpdates();
	});

	// Beim Beenden: Realtime deaktivieren
	onDestroy(() => {
		console.log('👋 Dashboard unmounting - Unsubscribing from realtime...');
		unsubscribeFromRealtimeUpdates();
	});

	function handleEditRoom(room: RoomWithConfig) {
		editingRoom = room;
	}

	function closeEditModal() {
		editingRoom = null;
	}

	function openScheduler() {
		showScheduler = true;
	}

	function closeScheduler() {
		showScheduler = false;
	}

	function openSettings() {
		showSettings = true;
	}

	function closeSettings() {
		showSettings = false;
	}
</script>

<div class="dashboard">
	<Header />
	<Canvas {handleEditRoom} />
	<AdminToolbar onOpenScheduler={openScheduler} onOpenSettings={openSettings} />

	{#if editingRoom}
		<RoomEditorModal room={editingRoom} onClose={closeEditModal} />
	{/if}

	{#if showScheduler}
		<SchedulerModal onClose={closeScheduler} />
	{/if}

	{#if showSettings}
		<SettingsModal onClose={closeSettings} />
	{/if}
</div>

<style>
	.dashboard {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
