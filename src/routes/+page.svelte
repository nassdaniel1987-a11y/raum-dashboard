<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import FloatingMenu from '$lib/components/FloatingMenu.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { RoomWithConfig } from '$lib/types';

	// SVELTE 5 STATE SYNTAX
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let showSettings = $state(false);
	let canvasRef: any = $state(null); // Referenz zur Canvas-Komponente
	let autoScrollActive = $state(false); // ✅ NEU: State für Auto-Scroll Status

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

	// ✅ NEU: Auto-Scroll Toggle Handler
	function handleToggleAutoScroll() {
		if (canvasRef?.toggleAutoScroll) {
			const newStatus = canvasRef.toggleAutoScroll();
			autoScrollActive = newStatus;
		}
	}

	// ✅ NEU: Initial Status abfragen
	$effect(() => {
		if (canvasRef?.getAutoScrollStatus) {
			autoScrollActive = canvasRef.getAutoScrollStatus();
		}
	});
</script>

<div class="dashboard">
	<Header 
		autoScrollActive={autoScrollActive} 
		onToggleAutoScroll={handleToggleAutoScroll}
	/>
	<Canvas {handleEditRoom} bind:this={canvasRef} />
	<FloatingMenu 
		onOpenScheduler={openScheduler} 
		onOpenSettings={openSettings}
		{canvasRef}
	/>
	<ToastContainer />
	<ConfirmDialog />

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
		/* GPU-Beschleunigung */
		transform: translateZ(0);
		/* Verhindert Layout-Shifts */
		contain: layout style paint;
	}
</style>