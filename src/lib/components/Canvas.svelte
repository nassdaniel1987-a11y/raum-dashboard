<script lang="ts">
	import { visibleRooms, isEditMode, swapSelection } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { RoomWithConfig } from '$lib/types';

	// Svelte 5 Props Syntax
	let { handleEditRoom } = $props<{
		handleEditRoom: (room: RoomWithConfig) => void;
	}>();

	let scrollContainer: HTMLElement;
	let autoScrollEnabled = $state(true);
	let scrollInterval: ReturnType<typeof setInterval> | undefined = undefined;

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

	function handleUserScroll() {
		// Hier kannst du Logik hinzufügen, wenn der User manuell scrollt
	}

	// Gruppiere Räume nach Stockwerk UND sortiere nach position_x
	let roomsByFloor = $derived({
		extern: $visibleRooms.filter(r => r.floor === 'extern').sort((a, b) => a.position_x - b.position_x),
		dach: $visibleRooms.filter(r => r.floor === 'dach').sort((a, b) => a.position_x - b.position_x),
		og2: $visibleRooms.filter(r => r.floor === 'og2').sort((a, b) => a.position_x - b.position_x),
		og1: $visibleRooms.filter(r => r.floor === 'og1').sort((a, b) => a.position_x - b.position_x),
		eg: $visibleRooms.filter(r => r.floor === 'eg').sort((a, b) => a.position_x - b.position_x),
		ug: $visibleRooms.filter(r => r.floor === 'ug').sort((a, b) => a.position_x - b.position_x)
	});

	const floorLabels = {
		extern: '🏃 Außenbereich',
		dach: '🏠 Dachgeschoss',
		og2: '2️⃣ 2. OG',
		og1: '1️⃣ 1. OG',
		eg: '🚪 Erdgeschoss',
		ug: '⬇️ Untergeschoss'
	};

	const floorOrder: (keyof typeof floorLabels)[] = [
		'dach',
		'og2',
		'og1',
		'eg',
		'ug',
		'extern'
	];

	function handleSelectForSwap(roomId: string) {
		swapSelection.update(ids => {
			if (ids.includes(roomId)) {
				return ids.filter(id => id !== roomId);
			}
			return [...ids, roomId].slice(-2);
		});
	}
</script>

<div
	class="canvas-container"
	bind:this={scrollContainer}
	onwheel={handleUserScroll} 
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
									<span class="floor-hint">(Kacheln zum Tauschen auswählen)</span>
								{/if}
							</h2>
							<div class="rooms-grid">
								{#each rooms as room (room.id)}
									<div
										animate:flip={{ duration: 300 }}
										class="room-wrapper"
										class:selected={$swapSelection.includes(room.id)}
									>
										<RoomCard
											{room}
											onEdit={handleEditRoom}
											onSelect={handleSelectForSwap}
											isSelected={$swapSelection.includes(room.id)}
										/>
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
	/* CSS bleibt unverändert */
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
		border-radius: 15px;
		transition: all 0.3s;
	}

	.room-wrapper.selected {
		transform: scale(1.03);
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