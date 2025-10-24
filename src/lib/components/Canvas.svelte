<script lang="ts">
	import { visibleRooms } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import type { RoomWithConfig } from '$lib/types';

	export let handleEditRoom: (room: RoomWithConfig) => void;

	let scrollContainer: HTMLElement;
	let autoScrollEnabled = true;
	let scrollInterval: number;

	// Auto-Scroll Funktion
	onMount(() => {
		if (scrollContainer && autoScrollEnabled) {
			let scrollDirection = 1; // 1 = runter, -1 = hoch
			
			scrollInterval = setInterval(() => {
				if (!scrollContainer) return;

				const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
				const currentScroll = scrollContainer.scrollTop;

				// Wenn am Ende, Richtung wechseln
				if (currentScroll >= maxScroll - 10) {
					scrollDirection = -1;
				} else if (currentScroll <= 10) {
					scrollDirection = 1;
				}

				// Langsam scrollen (1px pro 50ms = 20px/Sekunde)
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

	// Bei Benutzer-Scroll Auto-Scroll pausieren
	function handleUserScroll() {
		// Optional: Auto-Scroll pausieren wenn Benutzer scrollt
	}

	// Gruppiere Räume nach Stockwerk
	$: roomsByFloor = {
		dach: $visibleRooms.filter(r => r.floor === 'dach'),
		og2: $visibleRooms.filter(r => r.floor === 'og2'),
		og1: $visibleRooms.filter(r => r.floor === 'og1'),
		eg: $visibleRooms.filter(r => r.floor === 'eg'),
		ug: $visibleRooms.filter(r => r.floor === 'ug'),
		extern: $visibleRooms.filter(r => r.floor === 'extern')
	};

	const floorLabels = {
		dach: '🏠 Dachgeschoss',
		og2: '2️⃣ 2. OG',
		og1: '1️⃣ 1. OG',
		eg: '🚪 Erdgeschoss',
		ug: '⬇️ Untergeschoss',
		extern: '🏃 Außenbereich'
	};
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
				{#each Object.entries(roomsByFloor) as [floor, rooms]}
					{#if rooms.length > 0}
						<div class="floor-section">
							<h2 class="floor-title">{floorLabels[floor]}</h2>
							<div class="rooms-grid">
								{#each rooms as room (room.id)}
									<RoomCard {room} onEdit={handleEditRoom} />
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
		top: 50px; /* Header-Höhe */
		left: 0;
		right: 0;
		bottom: 50px; /* Footer-Höhe */
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

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}

	/* Responsive für iPad/TV */
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

	/* Scrollbar Styling */
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
