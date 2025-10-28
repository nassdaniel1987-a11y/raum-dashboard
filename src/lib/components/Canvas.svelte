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
	
	// ✅ Vereinfachte State-Variablen
	let autoScrollEnabled = $state(false);
	let isScrolling = $state(false);
	let isPausedByUser = $state(false);
	
	// ✅ Einstellungen
	let scrollSpeed = $state(1.5); // Pixel pro Schritt
	let pauseDurationSeconds = $state(3); // Pause in Sekunden
	
	// ✅ Scroll-Engine Variablen
	let scrollIntervalId: ReturnType<typeof setInterval> | undefined;
	let scrollDirection = $state<'down' | 'up' | 'paused'>('down');
	let pauseTimeoutId: ReturnType<typeof setTimeout> | undefined;
	let userInteractionTimeoutId: ReturnType<typeof setTimeout> | undefined;

	// ✅ KERN-FUNKTION: Ein Scroll-Schritt
	function scrollStep() {
		if (!scrollContainer || !isScrolling || isPausedByUser) return;

		const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
		const currentScroll = scrollContainer.scrollTop;

		// Kein Scroll nötig?
		if (maxScroll <= 0) {
			console.log('📺 Kein Scroll nötig - alles sichtbar');
			stopScrolling();
			return;
		}

		// ✅ Am Ende angekommen? Pause einlegen
		if (scrollDirection === 'down' && currentScroll >= maxScroll - 2) {
			pauseAtEdge('up');
			return;
		}

		if (scrollDirection === 'up' && currentScroll <= 2) {
			pauseAtEdge('down');
			return;
		}

		// ✅ Scrollen (wenn nicht pausiert)
		if (scrollDirection === 'down') {
			scrollContainer.scrollTop += scrollSpeed;
		} else if (scrollDirection === 'up') {
			scrollContainer.scrollTop -= scrollSpeed;
		}
	}

	// ✅ Pause am Rand mit Richtungswechsel
	function pauseAtEdge(nextDirection: 'up' | 'down') {
		if (scrollDirection === 'paused') return;
		
		scrollDirection = 'paused';
		const edge = nextDirection === 'up' ? 'unten' : 'oben';
		console.log(`⏸️ Pause am ${edge}en Ende für ${pauseDurationSeconds}s`);

		// Nach Pause: Richtung wechseln
		pauseTimeoutId = setTimeout(() => {
			scrollDirection = nextDirection;
			console.log(`▶️ Weiter nach ${nextDirection === 'up' ? 'oben' : 'unten'}`);
		}, pauseDurationSeconds * 1000);
	}

	// ✅ Start Auto-Scroll
	function startScrolling() {
		if (!scrollContainer) {
			console.warn('❌ Kein scrollContainer vorhanden');
			return;
		}

		const needsScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
		if (!needsScroll) {
			console.log('📺 Kein Auto-Scroll nötig - alles sichtbar');
			autoScrollEnabled = false;
			return;
		}

		if (isScrolling) {
			console.log('⚠️ Auto-Scroll läuft bereits');
			return;
		}

		isScrolling = true;
		scrollDirection = 'down';
		console.log('▶️ Auto-Scroll gestartet (Speed: ' + scrollSpeed + ', Pause: ' + pauseDurationSeconds + 's)');

		// 60 FPS = ~16ms Intervall
		scrollIntervalId = setInterval(scrollStep, 16);
	}

	// ✅ Stop Auto-Scroll
	function stopScrolling() {
		if (scrollIntervalId) {
			clearInterval(scrollIntervalId);
			scrollIntervalId = undefined;
		}
		if (pauseTimeoutId) {
			clearTimeout(pauseTimeoutId);
			pauseTimeoutId = undefined;
		}
		isScrolling = false;
		scrollDirection = 'down'; // Reset
		console.log('⏹️ Auto-Scroll gestoppt');
	}

	// ✅ User-Interaktion: Temporär pausieren
	function handleUserInteraction() {
		if (!autoScrollEnabled || !isScrolling) return;

		console.log('👆 User-Interaktion - Temporäre Pause');
		
		// Stoppe Scroll temporär
		stopScrolling();
		isPausedByUser = true;

		// Clear vorherigen Timeout
		if (userInteractionTimeoutId) {
			clearTimeout(userInteractionTimeoutId);
		}

		// Nach 5 Sekunden Inaktivität wieder starten
		userInteractionTimeoutId = setTimeout(() => {
			if (autoScrollEnabled) {
				console.log('▶️ Auto-Scroll wieder gestartet nach Inaktivität');
				isPausedByUser = false;
				startScrolling();
			}
		}, 5000);
	}

	// ✅ Mount: Einstellungen laden
	onMount(() => {
		// Lade gespeicherte Einstellungen
		const savedSpeed = localStorage.getItem('scrollSpeed');
		const savedPause = localStorage.getItem('pauseDuration');
		const savedEnabled = localStorage.getItem('autoScrollEnabled');

		if (savedSpeed) scrollSpeed = parseFloat(savedSpeed);
		if (savedPause) pauseDurationSeconds = parseInt(savedPause);
		if (savedEnabled) autoScrollEnabled = savedEnabled === 'true';

		// Event Listener für User-Interaktion
		const events = ['touchstart', 'touchmove', 'wheel', 'mousedown'];
		events.forEach(event => {
			scrollContainer?.addEventListener(event, handleUserInteraction, { passive: true });
		});

		// Auto-Start wenn enabled
		if (autoScrollEnabled) {
			setTimeout(() => {
				startScrolling();
			}, 1500); // 1.5s Verzögerung
		}

		return () => {
			// Cleanup Event Listeners
			events.forEach(event => {
				scrollContainer?.removeEventListener(event, handleUserInteraction);
			});
		};
	});

	// ✅ Cleanup beim Unmount
	onDestroy(() => {
		stopScrolling();
		if (userInteractionTimeoutId) {
			clearTimeout(userInteractionTimeoutId);
		}
	});

	// ✅ Export-Funktion: Einstellungen ändern (für FloatingMenu)
	export function setScrollSpeed(speed: number, pauseSec: number) {
		scrollSpeed = speed;
		pauseDurationSeconds = pauseSec;
		
		localStorage.setItem('scrollSpeed', speed.toString());
		localStorage.setItem('pauseDuration', pauseSec.toString());

		console.log(`⚙️ Neue Einstellungen: Speed=${speed}px, Pause=${pauseSec}s`);

		// Neustart wenn aktiv
		if (isScrolling) {
			stopScrolling();
			setTimeout(startScrolling, 100);
		}
	}

	// ✅ Export-Funktion: Toggle Auto-Scroll (für FloatingMenu)
	export function toggleAutoScroll(): boolean {
		autoScrollEnabled = !autoScrollEnabled;
		localStorage.setItem('autoScrollEnabled', autoScrollEnabled.toString());

		if (autoScrollEnabled) {
			isPausedByUser = false;
			startScrolling();
		} else {
			stopScrolling();
		}

		console.log(`🔄 Auto-Scroll ${autoScrollEnabled ? 'AKTIVIERT ✅' : 'DEAKTIVIERT ❌'}`);
		return autoScrollEnabled;
	}

	// ✅ Manueller Start-Button
	function manualStartScroll() {
		autoScrollEnabled = true;
		isPausedByUser = false;
		localStorage.setItem('autoScrollEnabled', 'true');
		startScrolling();
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

	<!-- ✅ Start Button (nur sichtbar wenn nicht aktiv) -->
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

	<!-- ✅ Scroll Indikator (wenn aktiv und scrollend) -->
	{#if isScrolling && !isPausedByUser}
		<div class="scroll-indicator" title="Auto-Scroll aktiv">
			<span class="scroll-icon">{scrollDirection === 'paused' ? '⏸️' : scrollDirection === 'down' ? '⬇️' : '⬆️'}</span>
		</div>
	{/if}

	<!-- ✅ User-Pause Indikator -->
	{#if isPausedByUser}
		<div class="pause-indicator" title="Pausiert durch User-Interaktion">
			<span class="pause-icon">👆</span>
			<span class="pause-text">Pause</span>
		</div>
	{/if}
</div>

<style>
	/* ✅ Container mit smooth scroll */
	.canvas-container {
		position: fixed;
		top: 50px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow-y: auto;
		overflow-x: hidden;
		background: transparent;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		transform: translateZ(0);
		will-change: scroll-position;
		overscroll-behavior: contain;
	}

	.canvas {
		max-width: 1400px;
		margin: 0 auto;
		padding: 16px;
		min-height: 100%;
		transform: translateZ(0);
	}

	.floors-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		contain: layout;
	}

	.floor-section {
		background: transparent;
		border-radius: 16px;
		padding: 0 0 12px 0;
		border: none;
		transition: all 0.3s ease;
		transform: translateZ(0);
		will-change: transform;
	}

	.floor-title {
		color: var(--color-text-primary);
		font-size: 20px;
		font-weight: 700;
		margin: 0 0 12px 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 10px 16px;
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
		font-size: 11px;
		font-weight: 400;
		opacity: 0.7;
		font-style: italic;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 10px;
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

	@media (min-width: 1024px) {
		.rooms-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	@media (min-width: 1600px) {
		.rooms-grid {
			grid-template-columns: repeat(6, 1fr);
			gap: 12px;
		}
		
		.canvas {
			max-width: 1800px;
		}
	}

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

	/* ✅ Start Button */
	.scroll-start-button {
		position: fixed;
		bottom: 20px;
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
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		padding: 10px 14px;
		border-radius: 10px;
		border: 2px solid rgba(34, 197, 94, 0.6);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		z-index: 500;
		animation: pulse-indicator 2s ease-in-out infinite;
	}

	@keyframes pulse-indicator {
		0%, 100% {
			opacity: 0.7;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	.scroll-icon {
		font-size: 24px;
		display: block;
	}

	/* ✅ Pause Indikator */
	.pause-indicator {
		position: fixed;
		bottom: 20px;
		left: 20px;
		background: rgba(245, 158, 11, 0.9);
		backdrop-filter: blur(10px);
		padding: 10px 16px;
		border-radius: 10px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		z-index: 500;
		display: flex;
		align-items: center;
		gap: 8px;
		color: white;
		font-weight: 700;
		animation: pulse-pause 1.5s ease-in-out infinite;
	}

	@keyframes pulse-pause {
		0%, 100% {
			opacity: 0.8;
		}
		50% {
			opacity: 1;
		}
	}

	.pause-icon {
		font-size: 20px;
	}

	.pause-text {
		font-size: 14px;
	}

	/* ✅ Scrollbar Styling */
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
		transform: translateZ(0);
	}

	.canvas-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	.canvas-container {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.3);
	}

	/* ✅ Mobile Optimierungen */
	@media (max-width: 768px) {
		.scroll-start-button {
			padding: 18px 32px;
			font-size: 18px;
			min-height: 60px;
		}
	}

	@media (hover: none) and (pointer: coarse) {
		.scroll-start-button {
			min-height: 64px;
		}
	}
</style>