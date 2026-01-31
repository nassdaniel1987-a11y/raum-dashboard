<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import SidebarMenu from '$lib/components/SidebarMenu.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import DailyHighlights from '$lib/components/DailyHighlights.svelte';
	import DailyHighlightsEditor from '$lib/components/DailyHighlightsEditor.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import type { RoomWithConfig } from '$lib/types';

	// SVELTE 5 STATE SYNTAX
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let showHelp = $state(false);
	let showHighlightsEditor = $state(false);
	let showMenu = $state(false); // ✅ NEU: Sidebar Menu
	let canvasRef: any = $state(null); // Referenz zur Canvas-Komponente

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

	function openHighlightsEditor() {
		showHighlightsEditor = true;
	}

	function closeHighlightsEditor() {
		showHighlightsEditor = false;
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
	<DailyHighlights onOpenEditor={openHighlightsEditor} />
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
<Mascot />
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

	{#if showHighlightsEditor}
	<DailyHighlightsEditor onClose={closeHighlightsEditor} />
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