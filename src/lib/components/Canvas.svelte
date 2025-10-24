<script lang="ts">
	import { visibleRooms, isEditMode, updateRoomPosition } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { RoomWithConfig } from '$lib/types';
	export let handleEditRoom: (room: RoomWithConfig) => void;

	let scrollContainer: HTMLElement;
	let autoScrollEnabled = true;
	let scrollInterval: number;
	let draggedRoom: RoomWithConfig | null = null;

	// Auto-Scroll
	onMount(() => {
		if (scrollContainer && autoScrollEnabled) {
			let scrollDirection = 1;
			
			scrollInterval = setInterval(() => {
				if (!scrollContainer) return;

				const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
				const currentScroll = scrollContainer.scrollTop;

				if (currentScroll >= maxScroll - 10) {
					scrollDirection = -1;
				} else if (currentScroll <= 10) {
					scrollDirection = 1;
				}

				scrollContainer.scrollBy({
					top: scrollDirection * 1,
					behavior: 'auto'
				});
			}, 50);
		}
	});
	onDestroy(() => {
		if (scrollInterval) {
			clearInterval(scrollInterval);
		}
	});

	function handleUserScroll() {}

	// Gruppiere Räume nach Stockwerk UND sortiere nach position_x
	$: roomsByFloor = {
		extern: $visibleRooms.filter(r => r.floor === 'extern').sort((a, b) => a.position_x - b.position_x),
		dach: $visibleRooms.filter(r => r.floor === 'dach').sort((a, b) => a.position_x - b.position_x),
		og2: $visibleRooms.filter(r => r.floor === 'og2').sort((a, b) => a.position_x - b.position_x),
		og1: $visibleRooms.filter(r => r.floor === 'og1').sort((a, b) => a.position_x - b.position_x),
		eg: $visibleRooms.filter(r => r.floor === 'eg').sort((a, b) => a.position_x - b.position_x),
		ug: $visibleRooms.filter(r => r.floor === 'ug').sort((a, b) => a.position_x - b.position_x)
	};
	const floorLabels = {
		extern: '🏃 Außenbereich',
		dach: '🏠 Dachgeschoss',
		og2: '2️⃣ 2. OG',
		og1: '1️⃣ 1. OG',
		eg: '🚪 Erdgeschoss',
		ug: '⬇️ Untergeschoss'
	};

	// ========== HIER IST DIE ÄNDERUNG (START) ==========
	// Definiert die gewünschte Reihenfolge der Stockwerke
	const floorOrder: (keyof typeof floorLabels)[] = [
		'dach',
		'og2',
		'og1',
		'eg',
		'ug',
		'extern'
	];
	// ========== HIER IST DIE ÄNDERUNG (ENDE) ==========

	// Drag & Drop für Reihenfolge (nur im Edit-Modus!)
	function handleDragStart(room: RoomWithConfig, event: DragEvent) {
		if (!$isEditMode) return;
		draggedRoom = room;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent) {
		if (!$isEditMode) return;
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	async function handleDrop(targetRoom: RoomWithConfig, event: DragEvent) {
		event.preventDefault();
		if (!draggedRoom || draggedRoom.id === targetRoom.id || !$isEditMode) return;
		// Nur innerhalb des gleichen Stockwerks verschieben
		if (draggedRoom.floor !== targetRoom.floor) {
			draggedRoom = null;
			return;
		}

		// Tausche position_x Werte
		const draggedPos = draggedRoom.position_x;
		const targetPos = targetRoom.position_x;

		// WICHTIG: updateRoomPosition stößt jetzt ein optimistisches Update an.
		// Wir rufen sie nacheinander auf.
		await updateRoomPosition(draggedRoom.id, targetPos, draggedRoom.position_y);
		await updateRoomPosition(targetRoom.id, draggedPos, targetRoom.position_y);
		draggedRoom = null;
	}
</script>

<div 
	class="canvas-container" 
	bind:this={scrollContainer}
	on:wheel={handleUserScroll}
	transition:fade
>
	<div class="canvas">
		{#if $visibleRooms.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h2>Keine Räume vorhanden</h2>
				<p>Erstelle deinen ersten Raum über die Admin-Toolbar unten!</p>
			</div>
		{:else}
			<div class="floors-container">
				{#each floorOrder as floorKey (floorKey)}
					{@const rooms = roomsByFloor[floorKey]}
					{#if rooms && rooms.length > 0}
						<div class="floor-section">
							<h2 class="floor-title">
								{floorLabels[floorKey]}
								{#if $isEditMode}
									<span class="floor-hint">(Ziehen zum Sortieren)</span>
								{/if}
							</h2>
							<div class="rooms-grid">
								{#each rooms as room (room.id)}
									<div
										draggable={$isEditMode}
										on:dragstart={(e) => handleDragStart(room, e)}
										on:dragover={handleDragOver}
										on:drop={(e) => handleDrop(room, e)}
										animate:flip={{ duration: 300 }}
										class="room-wrapper"
										class:draggable={$isEditMode}
									>
										<RoomCard {room} onEdit={handleEditRoom} />
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
				</div>
		{/if}
	</div>
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 50px;
		left: 0;
		right: 0;
		bottom: 50px;
		overflow-y: auto;
		overflow-x: hidden;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}

	.canvas {
		max-width: 1280px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100%;
	}

	.floors-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.floor-section {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 16px;
		padding: 20px;
		border: 2px solid rgba(255, 255, 255, 0.1);
	}

	.floor-title {
		color: white;
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 16px 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.floor-hint {
		font-size: 14px;
		font-weight: 400;
		opacity: 0.7;
		font-style: italic;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}

	.room-wrapper {
		transition: transform 0.2s, opacity 0.2s;
	}

	.room-wrapper.draggable {
		cursor: grab;
	}

	.room-wrapper.draggable:active {
		cursor: grabbing;
		opacity: 0.6;
		transform: scale(1.05);
	}

	@media (min-width: 1024px) {
		.rooms-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 768px) {
		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.floor-title {
			font-size: 20px;
		}
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: white;
		opacity: 0.7;
	}

	.empty-icon {
		font-size: 100px;
		margin-bottom: 16px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.empty-state h2 {
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 12px 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.empty-state p {
		font-size: 18px;
		margin: 0;
		opacity: 0.8;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	.canvas-container::-webkit-scrollbar {
		width: 10px;
	}

	.canvas-container::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
	}

	.canvas-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 5px;
	}

	.canvas-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>