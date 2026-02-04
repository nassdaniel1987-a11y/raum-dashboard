<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import SidebarMenu from '$lib/components/SidebarMenu.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import type { RoomWithConfig } from '$lib/types';

	// SVELTE 5 STATE SYNTAX
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let showHelp = $state(false);
	let showMenu = $state(false);
	let canvasRef: any = $state(null);

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

	function openHelp() {
		showHelp = true;
	}

	function closeHelp() {
		showHelp = false;
	}

	function openMenu() {
		showMenu = true;
	}

	function closeMenu() {
		showMenu = false;
	}
</script>

<div class="dashboard">
	<Header onOpenMenu={openMenu} {canvasRef} />
	<Canvas {handleEditRoom} bind:this={canvasRef} />
</div>

<!-- Außerhalb des Containers damit contain: layout sie nicht abschneidet -->
<SidebarMenu
	isOpen={showMenu}
	onClose={closeMenu}
	onOpenScheduler={openScheduler}
	{canvasRef}
/>
<FloatingActionButton onOpenScheduler={openScheduler} />
<ToastContainer />
<ConfirmDialog />

	{#if editingRoom}
	<RoomEditorModal room={editingRoom} onClose={closeEditModal} />
{/if}

{#if showScheduler}
	<DailySchedulerModal onClose={closeScheduler} />
{/if}

{#if showHelp}
	<HelpModal onClose={closeHelp} />
{/if}

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