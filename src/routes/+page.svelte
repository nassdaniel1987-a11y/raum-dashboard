<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';  // ← GEÄNDERT!
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import type { RoomWithConfig } from '$lib/types';

	// SVELTE 5 STATE SYNTAX
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let showSettings = $state(false);

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
	<Toolbar onOpenScheduler={openScheduler} onOpenSettings={openSettings} />

	{#if editingRoom}
		<RoomEditorModal room={editingRoom} onClose={closeEditModal} />
	{/if}

	{#if showScheduler}
		<DailySchedulerModal onClose={closeScheduler} />
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