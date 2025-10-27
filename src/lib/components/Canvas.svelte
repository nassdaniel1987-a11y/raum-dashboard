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
	let userInteractionTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	// ✅ NEU: Scroll-Geschwindigkeit aus localStorage laden oder Default
	let scrollSpeed = $state(parseFloat(localStorage.getItem('scrollSpeed') || '0.5'));
	let pauseDuration = $state(parseInt(localStorage.getItem('pauseDuration') || '60'));

	function startAutoScroll() {
		if (!scrollContainer) return;

		// ✅ NEU: Prüfe ob Scrollen überhaupt nötig ist
		const needsScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
		if (!needsScroll) {
			console.log('📺 Kein Auto-Scroll nötig - alles sichtbar');
			return;
		}

		if (!autoScrollEnabled) return;

		let scrollDirection = 1;
		let pauseCounter = 0;

		scrollInterval = setInterval(() => {
			if (!scrollContainer) return;

			const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
			const currentScroll = scrollContainer.scrollTop;

			// Am oberen oder unteren Ende: Pause einlegen
			if (currentScroll >= maxScroll - 5) {
				if (pauseCounter < pauseDuration) {
					pauseCounter++;
					return;
				}
				scrollDirection = -1;
				pauseCounter = 0;
			} else if (currentScroll <= 5) {
				if (pauseCounter < pauseDuration) {
					pauseCounter++;
					return;
				}
				scrollDirection = 1;
				pauseCounter = 0;
			}

			scrollContainer.scrollBy({
				top: scrollDirection * scrollSpeed,
				behavior: 'auto'
			});
		}, 50);
	}

	function stopAutoScroll() {
		if (scrollInterval) {
			clearInterval(scrollInterval);
			scrollInterval = undefined;
		}
	}

	// ✅ NEU: Pause bei User-Interaktion
	function handleUserInteraction() {
		console.log('👆 User-Interaktion erkannt - Pause Auto-Scroll');
		stopAutoScroll();

		// Clear existing timeout
		if (userInteractionTimeout) {
			clearTimeout(userInteractionTimeout);
		}

		// Nach 5 Sekunden wieder starten
		userInteractionTimeout = setTimeout(() => {
			console.log('▶️ Auto-Scroll wird wieder gestartet');
			startAutoScroll();
		}, 5000);
	}

	onMount(() => {
		// Initial start nach kurzer Verzögerung
		setTimeout(() => {
			startAutoScroll();
		}, 1000);
	});

	onDestroy(() => {
		stopAutoScroll();
		if (userInteractionTimeout) {
			clearTimeout(userInteractionTimeout);
		}
	});

	// ✅ NEU: Exportiere Funktionen für Settings
	export function setScrollSpeed(speed: number, pause: number) {
		scrollSpeed = speed;
		pauseDuration = pause;
		localStorage.setItem('scrollSpeed', speed.toString());
		localStorage.setItem('pauseDuration', pause.toString());
		
		// Restart mit neuen Settings
		stopAutoScroll();
		startAutoScroll();
	}

	export function toggleAutoScroll() {
		autoScrollEnabled = !autoScrollEnabled;
		if (autoScrollEnabled) {
			startAutoScroll();
		} else {
			stopAutoScroll();
		}
		return autoScrollEnabled;
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
	onwheel={handleUserInteraction}
	ontouchstart={handleUserInteraction}
	ontouchmove={handleUserInteraction}
	transition:fade
>
	<div class="canvas">
		{#if $visibleRooms.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h2>Keine Räume vorhanden</h2>
				<p>Erstelle deinen ersten Raum über das Menü unten rechts!</p>
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

	<!-- ✅ NEU: Auto-Scroll Status Indikator -->
	{#if autoScrollEnabled}
		<div class="scroll-indicator" title="Auto-Scroll aktiv">
			<span class="scroll-icon">↕️</span>
		</div>
	{/if}
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 80px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow-y: auto;
		overflow-x: hidden;
		background: transparent;
		/* KRITISCH für glattes Scrollen auf großen Displays */
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		/* GPU-Beschleunigung für bessere Performance */
		transform: translateZ(0);
		will-change: scroll-position;
	}

	.canvas {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100%;
		/* Bessere Performance durch GPU-Layer */
		transform: translateZ(0);
	}

	.floors-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
		/* Verhindert Layout-Shifts während des Scrollens */
		contain: layout;
	}

	.floor-section {
		/* ✅ GEÄNDERT: Kein dunkler Hintergrund mehr - nur transparenter Container */
		background: transparent;
		border-radius: 16px;
		padding: 0 0 20px 0; /* Nur unten Padding für die Kacheln */
		border: none; /* Kein Border mehr */
		transition: all 0.3s ease;
		/* GPU-Beschleunigung */
		transform: translateZ(0);
		will-change: transform;
	}

	.floor-title {
		color: var(--color-text-primary);
		font-size: 22px;
		font-weight: 700;
		margin: 0 0 16px 0;
		/* ✅ NEU: Dunkler Hintergrund nur für den Titel */
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 12px 20px;
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.9), 
					 0 0 20px rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		gap: 10px;
		letter-spacing: 0.3px;
		/* Inline-block damit es sich an Content anpasst */
		width: fit-content;
	}

	.floor-hint {
		font-size: 12px;
		font-weight: 400;
		opacity: 0.7;
		font-style: italic;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
		grid-auto-rows: auto;
		align-items: start;
		/* Performance-Optimierung */
		contain: layout;
	}

	.room-wrapper {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
					opacity 0.3s ease;
		border-radius: 16px;
		height: auto;
		display: flex;
		flex-direction: column;
		/* GPU-Beschleunigung */
		transform: translateZ(0);
		will-change: transform;
	}

	.room-wrapper.selected {
		transform: scale(1.05) translateZ(0);
		filter: brightness(1.1);
	}

	/* Desktop */
	@media (min-width: 1024px) {
		.rooms-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	/* Tablet */
	@media (max-width: 1023px) {
		.canvas {
			padding: 20px;
		}

		.rooms-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 20px;
		}

		.floor-title {
			font-size: 28px;
		}
	}

	/* Mobile */
	@media (max-width: 768px) {
		.canvas {
			padding: 15px;
		}

		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 16px;
		}

		.floor-title {
			font-size: 24px;
		}

		.floor-section {
			padding: 20px;
		}
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: var(--color-text-primary);
		opacity: 0.7;
	}

	.empty-icon {
		font-size: 80px;
		margin-bottom: 16px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
	}

	.empty-state h2 {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 12px 0;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
	}

	.empty-state p {
		font-size: 16px;
		margin: 0;
		opacity: 0.8;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
	}

	/* ✅ NEU: Scroll Indikator */
	.scroll-indicator {
		position: fixed;
		bottom: 100px;
		left: 20px;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 8px 12px;
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		z-index: 500;
		animation: pulse 2s ease-in-out infinite;
	}

	.scroll-icon {
		font-size: 20px;
		display: block;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}

	/* Verbesserter Scrollbar für große Displays */
	.canvas-container::-webkit-scrollbar {
		width: 14px;
	}

	.canvas-container::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 7px;
	}

	.canvas-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 7px;
		border: 2px solid rgba(0, 0, 0, 0.3);
	}

	.canvas-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* Firefox Scrollbar */
	.canvas-container {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.3);
	}
</style>