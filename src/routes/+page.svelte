<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import FloatingMenu from '$lib/components/FloatingMenu.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { RoomWithConfig } from '$lib/types';

	// SVELTE 5 STATE SYNTAX
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let showSettings = $state(false);
	let showHelp = $state(false);
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

	function openHelp() {
		showHelp = true;
	}

	function closeHelp() {
		showHelp = false;
	}

	// ✅ NEU: Auto-Scroll Toggle Handler
	function handleToggleAutoScroll() {
		console.log('🔘 Header Button geklickt');
		if (!canvasRef) {
			console.warn('❌ canvasRef ist null');
			return;
		}
		if (typeof canvasRef.toggleAutoScroll !== 'function') {
			console.warn('❌ toggleAutoScroll ist keine Funktion:', typeof canvasRef.toggleAutoScroll);
			return;
		}
		const newStatus = canvasRef.toggleAutoScroll();
		autoScrollActive = newStatus;
		console.log('✅ Status aktualisiert auf:', newStatus);
	}

	// ✅ Status kontinuierlich synchronisieren
	$effect(() => {
		// Regelmäßig Status synchronisieren
		const interval = setInterval(() => {
			if (canvasRef?.getAutoScrollStatus) {
				const currentStatus = canvasRef.getAutoScrollStatus();
				if (currentStatus !== autoScrollActive) {
					autoScrollActive = currentStatus;
					console.log('🔄 Status synchronisiert:', currentStatus);
				}
			}
		}, 500); // Alle 500ms checken

		return () => clearInterval(interval);
	});
</script>

<div class="dashboard">
	<Header
		autoScrollActive={autoScrollActive}
		onToggleAutoScroll={handleToggleAutoScroll}
		onOpenHelp={openHelp}
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

	{#if showHelp}
		<HelpModal onClose={closeHelp} />
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