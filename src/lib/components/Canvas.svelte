<script lang="ts">
	import { visibleRooms, isEditMode, swapSelection } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade, slide } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { RoomWithConfig } from '$lib/types';

	// Svelte 5 Props Syntax
	let { handleEditRoom } = $props<{
		handleEditRoom: (room: RoomWithConfig) => void;
	}>();

	let scrollContainer: HTMLElement;
	let autoScrollEnabled = $state(false); // ✅ Standardmäßig AUS für manuellen Start
	let scrollInterval: ReturnType<typeof setInterval> | undefined = undefined;
	let userInteractionTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let isManuallyPaused = $state(false);

	let scrollSpeed = $state(0.5);
	let pauseDuration = $state(60);

	// ✅ Optimiertes Scrollen mit requestAnimationFrame für butterweiche Performance
	let animationFrameId: number | undefined = undefined;
	let scrollDirection = 1;
	let pauseCounter = 0;
	let lastScrollTime = 0;

	function smoothScroll(timestamp: number) {
		if (!scrollContainer || !autoScrollEnabled) return;

		// Throttle auf 60 FPS (16.67ms) für flüssiges Scrollen
		if (timestamp - lastScrollTime < 16.67) {
			animationFrameId = requestAnimationFrame(smoothScroll);
			return;
		}
		lastScrollTime = timestamp;

		const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
		const currentScroll = scrollContainer.scrollTop;

		// Prüfe ob Scrollen nötig ist
		if (maxScroll <= 0) {
			stopAutoScroll();
			return;
		}

		// Am oberen oder unteren Ende: Pause einlegen
		if (currentScroll >= maxScroll - 5) {
			if (pauseCounter < pauseDuration) {
				pauseCounter++;
				animationFrameId = requestAnimationFrame(smoothScroll);
				return;
			}
			scrollDirection = -1;
			pauseCounter = 0;
		} else if (currentScroll <= 5) {
			if (pauseCounter < pauseDuration) {
				pauseCounter++;
				animationFrameId = requestAnimationFrame(smoothScroll);
				return;
			}
			scrollDirection = 1;
			pauseCounter = 0;
		}

		// Smooth scroll mit GPU-Beschleunigung
		scrollContainer.scrollTop += scrollDirection * scrollSpeed;
		
		animationFrameId = requestAnimationFrame(smoothScroll);
	}

	function startAutoScroll() {
		if (!scrollContainer) return;

		const needsScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
		if (!needsScroll) {
			console.log('📺 Kein Auto-Scroll nötig - alles sichtbar');
			autoScrollEnabled = false;
			return;
		}

		if (autoScrollEnabled && !isManuallyPaused) {
			console.log('▶️ Auto-Scroll gestartet');
			pauseCounter = 0;
			lastScrollTime = 0;
			animationFrameId = requestAnimationFrame(smoothScroll);
		}
	}

	function stopAutoScroll() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = undefined;
		}
		if (scrollInterval) {
			clearInterval(scrollInterval);
			scrollInterval = undefined;
		}
		console.log('⏸️ Auto-Scroll gestoppt');
	}

	// ✅ Verbesserte Touch & Scroll Detection für iPad
	function handleUserInteraction() {
		if (!autoScrollEnabled || isManuallyPaused) return;

		console.log('👆 User-Interaktion erkannt - Pause Auto-Scroll');
		stopAutoScroll();

		if (userInteractionTimeout) {
			clearTimeout(userInteractionTimeout);
		}

		// Nach 5 Sekunden wieder starten
		userInteractionTimeout = setTimeout(() => {
			if (autoScrollEnabled && !isManuallyPaused) {
				console.log('▶️ Auto-Scroll wird wieder gestartet');
				startAutoScroll();
			}
		}, 5000);
	}

	onMount(() => {
		scrollSpeed = parseFloat(localStorage.getItem('scrollSpeed') || '0.5');
		pauseDuration = parseInt(localStorage.getItem('pauseDuration') || '60');
		
		const savedAutoScroll = localStorage.getItem('autoScrollEnabled');
		if (savedAutoScroll !== null) {
			autoScrollEnabled = savedAutoScroll === 'true';
		}

		// Event Listener für iPad
		if (scrollContainer) {
			scrollContainer.addEventListener('touchstart', handleUserInteraction, { passive: true });
			scrollContainer.addEventListener('touchmove', handleUserInteraction, { passive: true });
			scrollContainer.addEventListener('wheel', handleUserInteraction, { passive: true });
			scrollContainer.addEventListener('scroll', handleUserInteraction, { passive: true });
		}

		// Auto-Start nur wenn enabled
		if (autoScrollEnabled) {
			setTimeout(startAutoScroll, 1000);
		}
	});

	onDestroy(() => {
		stopAutoScroll();
		if (userInteractionTimeout) {
			clearTimeout(userInteractionTimeout);
		}
		if (scrollContainer) {
			scrollContainer.removeEventListener('touchstart', handleUserInteraction);
			scrollContainer.removeEventListener('touchmove', handleUserInteraction);
			scrollContainer.removeEventListener('wheel', handleUserInteraction);
			scrollContainer.removeEventListener('scroll', handleUserInteraction);
		}
	});

	export function setScrollSpeed(speed: number, pause: number) {
		scrollSpeed = speed;
		pauseDuration = pause;
		localStorage.setItem('scrollSpeed', speed.toString());
		localStorage.setItem('pauseDuration', pause.toString());

		stopAutoScroll();
		if (autoScrollEnabled) {
			startAutoScroll();
		}
	}

	export function toggleAutoScroll() {
		autoScrollEnabled = !autoScrollEnabled;
		isManuallyPaused = !autoScrollEnabled;
		
		localStorage.setItem('autoScrollEnabled', autoScrollEnabled.toString());
		
		if (autoScrollEnabled) {
			startAutoScroll();
		} else {
			stopAutoScroll();
		}
		return autoScrollEnabled;
	}

	// ✅ NEU: Manueller Start-Button Funktion
	function manualStartScroll() {
		autoScrollEnabled = true;
		isManuallyPaused = false;
		localStorage.setItem('autoScrollEnabled', 'true');
		startAutoScroll();
	}

	// Gruppiere Räume nach Stockwerk UND sortiere nach position_x
	let roomsByFloor = $derived({
		extern: $visibleRooms
			.filter((r) => r.floor === 'extern')
			.sort((a, b) => a.position_x - b.position_x),
		dach: $visibleRooms
			.filter((r) => r.floor === 'dach')
			.sort((a, b) => a.position_x - b.position_x),
		og2: $visibleRooms
			.filter((r) => r.floor === 'og2')
			.sort((a, b) => a.position_x - b.position_x),
		og1: $visibleRooms
			.filter((r) => r.floor === 'og1')
			.sort((a, b) => a.position_x - b.position_x),
		eg: $visibleRooms.filter((r) => r.floor === 'eg').sort((a, b) => a.position_x - b.position_x),
		ug: $visibleRooms.filter((r) => r.floor === 'ug').sort((a, b) => a.position_x - b.position_x)
	});

	const floorLabels = {
		extern: '🏃 Außenbereich',
		dach: '🏠 Dachgeschoss',
		og2: '2️⃣ 2. OG',
		og1: '1️⃣ 1. OG',
		eg: '🚪 Erdgeschoss',
		ug: '⬇️ Untergeschoss'
	};
	const floorOrder: (keyof typeof floorLabels)[] = ['dach', 'og2', 'og1', 'eg', 'ug', 'extern'];

	function handleSelectForSwap(roomId: string) {
		swapSelection.update((ids) => {
			if (ids.includes(roomId)) {
				return ids.filter((id) => id !== roomId);
			}
			return [...ids, roomId].slice(-2);
		});
	}
</script>

<div
	class="canvas-container"
	bind:this={scrollContainer}
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

	<!-- ✅ NEU: Auto-Scroll Start Button (nur sichtbar wenn nicht aktiv) -->
	{#if !autoScrollEnabled && $visibleRooms.length > 0}
		<button 
			class="scroll-start-button" 
			onclick={manualStartScroll}
			transition:slide={{ axis: 'y', duration: 300 }}
		>
			<span class="start-icon">▶️</span>
			<span class="start-text">Auto-Scroll starten</span>
		</button>
	{/if}

	<!-- ✅ Auto-Scroll Indikator (wenn aktiv) -->
	{#if autoScrollEnabled}
		<div class="scroll-indicator" title="Auto-Scroll aktiv">
			<span class="scroll-icon">↕️</span>
		</div>
	{/if}
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 50px; /* ✅ Header-Höhe */
		left: 0;
		right: 0;
		bottom: 0; /* ✅ Bis ganz unten - kein Toolbar mehr im Weg */
		overflow-y: auto;
		overflow-x: hidden;
		background: transparent;
		/* GPU-Beschleunigung für butterweiche Performance */
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		transform: translateZ(0);
		will-change: scroll-position;
		/* Verhindert Bounce-Effekt auf iOS */
		overscroll-behavior: contain;
	}

	.canvas {
		max-width: 1400px;
		margin: 0 auto;
		padding: 16px; /* ✅ Reduziert von 20px */
		min-height: 100%;
		transform: translateZ(0);
	}

	.floors-container {
		display: flex;
		flex-direction: column;
		gap: 16px; /* ✅ Reduziert von 24px */
		contain: layout;
	}

	.floor-section {
		background: transparent;
		border-radius: 16px;
		padding: 0 0 12px 0; /* ✅ Reduziert */
		border: none;
		transition: all 0.3s ease;
		transform: translateZ(0);
		will-change: transform;
	}

	.floor-title {
		color: var(--color-text-primary);
		font-size: 20px; /* ✅ Reduziert von 22px */
		font-weight: 700;
		margin: 0 0 12px 0; /* ✅ Reduziert von 16px */
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 10px 16px; /* ✅ Reduziert von 12px 20px */
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		text-shadow:
			2px 2px 8px rgba(0, 0, 0, 0.9),
			0 0 20px rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		gap: 10px;
		letter-spacing: 0.3px;
		width: fit-content;
	}

	.floor-hint {
		font-size: 11px; /* ✅ Reduziert von 12px */
		font-weight: 400;
		opacity: 0.7;
		font-style: italic;
	}

	.rooms-grid {
		display: grid;
		/* ✅ Mehr Spalten = kleinere Kacheln */
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); /* ✅ Reduziert von 220px */
		gap: 10px; /* ✅ Reduziert von 16px */
		grid-auto-rows: auto;
		align-items: start;
		contain: layout;
	}

	.room-wrapper {
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s ease;
		border-radius: 12px;
		height: auto;
		display: flex;
		flex-direction: column;
		transform: translateZ(0);
		will-change: transform;
	}

	.room-wrapper.selected {
		transform: scale(1.05) translateZ(0);
		filter: brightness(1.1);
	}

	/* ✅ Desktop: Noch mehr Spalten */
	@media (min-width: 1024px) {
		.rooms-grid {
			grid-template-columns: repeat(5, 1fr); /* ✅ 5 statt 4 */
		}
	}

	/* ✅ Große Displays (wie 82-Zoll TV) */
	@media (min-width: 1600px) {
		.rooms-grid {
			grid-template-columns: repeat(6, 1fr); /* ✅ 6 Spalten */
			gap: 12px;
		}
		
		.canvas {
			max-width: 1800px;
		}
	}

	/* Tablet */
	@media (max-width: 1023px) {
		.canvas {
			padding: 16px;
		}

		.rooms-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 12px;
		}

		.floor-title {
			font-size: 18px;
		}
	}

	/* Mobile */
	@media (max-width: 768px) {
		.canvas {
			padding: 12px;
		}

		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}

		.floor-title {
			font-size: 16px;
		}

		.floor-section {
			padding: 0 0 10px 0;
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

	/* ✅ NEU: Start Button für Auto-Scroll */
	.scroll-start-button {
		position: fixed;
		bottom: 20px; /* ✅ Unten positioniert, da kein Toolbar mehr */
		left: 50%;
		transform: translateX(-50%);
		z-index: 500;
		
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 28px;
		
		background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 14px;
		box-shadow: 0 8px 32px rgba(34, 197, 94, 0.6);
		
		color: white;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		
		animation: pulse-glow 2s ease-in-out infinite;
	}

	.scroll-start-button:hover {
		transform: translateX(-50%) translateY(-3px);
		box-shadow: 0 12px 40px rgba(34, 197, 94, 0.8);
	}

	.scroll-start-button:active {
		transform: translateX(-50%) translateY(-1px);
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 8px 32px rgba(34, 197, 94, 0.6);
		}
		50% {
			box-shadow: 0 8px 40px rgba(34, 197, 94, 0.9);
		}
	}

	.start-icon {
		font-size: 22px;
		animation: bounce-icon 1.5s ease-in-out infinite;
	}

	@keyframes bounce-icon {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.start-text {
		letter-spacing: 0.5px;
	}

	/* ✅ Scroll Indikator */
	.scroll-indicator {
		position: fixed;
		bottom: 20px;
		left: 20px;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 8px 12px;
		border-radius: 8px;
		border: 2px solid rgba(34, 197, 94, 0.5);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		z-index: 500;
		animation: pulse-indicator 2s ease-in-out infinite;
	}

	@keyframes pulse-indicator {
		0%, 100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}

	.scroll-icon {
		font-size: 20px;
		display: block;
	}

	/* ✅ Verbesserte Scrollbar für große Displays */
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
		/* GPU-Beschleunigung */
		transform: translateZ(0);
	}

	.canvas-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* Firefox Scrollbar */
	.canvas-container {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.3);
	}

	/* ✅ iPad-spezifische Optimierungen */
	@media (hover: none) and (pointer: coarse) {
		.scroll-start-button {
			padding: 18px 32px;
			font-size: 18px;
			/* Größerer Touch-Target für iPad */
			min-height: 60px;
		}
	}
</style>