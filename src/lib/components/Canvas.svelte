<script lang="ts">
	import { visibleRooms, isEditMode, swapSelection, viewWeekday } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade, slide } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { RoomWithConfig } from '$lib/types';
	import '$lib/styles/performance.css';

	// Svelte 5 Props Syntax
	let { handleEditRoom } = $props<{
		handleEditRoom: (room: RoomWithConfig) => void;
	}>();

	let scrollContainer: HTMLElement;

	// ✅ iPad Swipe-Gesten
	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartTime = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		touchStartTime = Date.now();
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const touchEndTime = Date.now();

		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;
		const duration = touchEndTime - touchStartTime;

		// Nur als Swipe werten wenn:
		// - Schnell genug (< 300ms)
		// - Genug Bewegung (> 50px)
		// - Mehr horizontal als vertikal (|deltaX| > |deltaY| * 1.5)
		if (duration < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
			e.preventDefault(); // ✅ Verhindert Browser-Navigation

			if (deltaX > 0) {
				// Swipe right → Vorheriger Tag
				viewWeekday.update(day => {
					const newDay = day - 1;
					return newDay < 0 ? 6 : newDay;
				});
			} else {
				// Swipe left → Nächster Tag
				viewWeekday.update(day => {
					const newDay = day + 1;
					return newDay > 6 ? 0 : newDay;
				});
			}
		}
	}

	// ✅ Vereinfachte State-Variablen
	let autoScrollEnabled = $state(false);
	let isScrolling = $state(false);

	// ✅ Einstellungen (optimiert für 82-Zoll TV)
	let scrollSpeed = $state(0.6); // Pixel pro Schritt (sehr langsam & geschmeidig)
	let pauseDurationSeconds = $state(4); // Pause in Sekunden

	// ✅ Scroll-Engine Variablen (iPad-optimiert mit requestAnimationFrame)
	let scrollIntervalId: number | undefined;
	let scrollDirection = $state<'down' | 'up' | 'paused'>('down');
	let pauseTimeoutId: ReturnType<typeof setTimeout> | undefined;
	let scrollAccumulator = 0; // Sammelt Sub-Pixel-Werte

	// ✅ KERN-FUNKTION: Ein Scroll-Schritt (iPad-optimiert)
	function scrollStep() {
		if (!scrollContainer || !isScrolling) return;

		const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
		const currentScroll = scrollContainer.scrollTop;

		// Kein Scroll nötig?
		if (maxScroll <= 0) {
			console.log('📺 Kein Scroll nötig - alles sichtbar');
			stopScrolling();
			return;
		}

		// ✅ Am Ende angekommen? Pause einlegen (aber Loop weiterlaufen lassen)
		if (scrollDirection === 'down' && currentScroll >= maxScroll - 2) {
			pauseAtEdge('up');
		}

		if (scrollDirection === 'up' && currentScroll <= 2) {
			pauseAtEdge('down');
		}

		// ✅ Nur scrollen wenn nicht pausiert
		if (scrollDirection !== 'paused') {
			// Scrollen mit Akkumulator für Sub-Pixel-Werte
			if (scrollDirection === 'down') {
				scrollAccumulator += scrollSpeed;
			} else if (scrollDirection === 'up') {
				scrollAccumulator -= scrollSpeed;
			}

			// Nur scrollen wenn mindestens 1 ganzer Pixel erreicht wurde
			if (Math.abs(scrollAccumulator) >= 1) {
				const pixelsToScroll = Math.floor(Math.abs(scrollAccumulator)) * Math.sign(scrollAccumulator);

				// ✅ iPad/iOS Fix: Verwende scrollTo statt direkter scrollTop Manipulation
				const newScrollTop = currentScroll + pixelsToScroll;
				scrollContainer.scrollTo({
					top: newScrollTop,
					behavior: 'auto'
				});

				scrollAccumulator -= pixelsToScroll; // Rest behalten
			}
		}

		// ✅ requestAnimationFrame Loop immer weiterlaufen lassen
		if (isScrolling) {
			scrollIntervalId = requestAnimationFrame(scrollStep);
		}
	}

	// ✅ Pause am Rand mit Richtungswechsel
	function pauseAtEdge(nextDirection: 'up' | 'down') {
		if (scrollDirection === 'paused') return;

		scrollDirection = 'paused';
		scrollAccumulator = 0; // Reset beim Richtungswechsel
		const edge = nextDirection === 'up' ? 'unten' : 'oben';
		console.log(`⏸️ Pause am ${edge}en Ende für ${pauseDurationSeconds}s`);

		// Nach Pause: Richtung wechseln (Loop läuft weiter)
		pauseTimeoutId = setTimeout(() => {
			scrollDirection = nextDirection;
			console.log(`▶️ Weiter nach ${nextDirection === 'up' ? 'oben' : 'unten'}`);
		}, pauseDurationSeconds * 1000);
	}

	// ✅ Start Auto-Scroll (iPad-optimiert)
	function startScrolling() {
		if (!scrollContainer) {
			console.warn('❌ Kein scrollContainer vorhanden');
			return;
		}

		// ✅ Debug: Zeige Scroll-Dimensionen
		const scrollHeight = scrollContainer.scrollHeight;
		const clientHeight = scrollContainer.clientHeight;
		const needsScroll = scrollHeight > clientHeight;

		console.log('📊 Scroll-Check:', {
			scrollHeight,
			clientHeight,
			difference: scrollHeight - clientHeight,
			needsScroll
		});

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
		scrollAccumulator = 0; // Reset für sauberen Start
		console.log('▶️ Auto-Scroll gestartet (iPad-kompatibel mit requestAnimationFrame)');

		// ✅ Starte mit requestAnimationFrame für iPad-Kompatibilität
		scrollIntervalId = requestAnimationFrame(scrollStep);
	}

	// ✅ Stop Auto-Scroll (iPad-optimiert)
	function stopScrolling() {
		if (scrollIntervalId !== undefined) {
			cancelAnimationFrame(scrollIntervalId);
			scrollIntervalId = undefined;
		}
		if (pauseTimeoutId) {
			clearTimeout(pauseTimeoutId);
			pauseTimeoutId = undefined;
		}
		isScrolling = false;
		scrollDirection = 'down'; // Reset
		scrollAccumulator = 0; // Reset Akkumulator
		console.log('⏹️ Auto-Scroll gestoppt');
	}

	// ✅ Mount: Einstellungen laden
	onMount(() => {
		// Lade gespeicherte Einstellungen
		const savedSpeed = localStorage.getItem('scrollSpeed');
		const savedPause = localStorage.getItem('pauseDuration');
		const savedEnabled = localStorage.getItem('autoScrollEnabled');
		const savedCardScale = localStorage.getItem('cardScale');

		if (savedSpeed) scrollSpeed = parseFloat(savedSpeed);
		if (savedPause) pauseDurationSeconds = parseInt(savedPause);
		if (savedEnabled) autoScrollEnabled = savedEnabled === 'true';

		// ✅ Kachelgröße wiederherstellen
		if (savedCardScale) {
			document.documentElement.style.setProperty('--card-scale', savedCardScale);
			console.log(`🎴 Kachelgröße wiederhergestellt: ${(parseFloat(savedCardScale) * 100).toFixed(0)}%`);
		}

		// Auto-Start wenn enabled
		if (autoScrollEnabled) {
			setTimeout(() => {
				startScrolling();
			}, 1500); // 1.5s Verzögerung
		}
	});

	// ✅ Cleanup beim Unmount
	onDestroy(() => {
		stopScrolling();
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

	// ✅ Export-Funktion: Toggle Auto-Scroll (für Header)
	export function toggleAutoScroll(): boolean {
		autoScrollEnabled = !autoScrollEnabled;
		localStorage.setItem('autoScrollEnabled', autoScrollEnabled.toString());

		if (autoScrollEnabled) {
			startScrolling();
		} else {
			stopScrolling();
		}

		console.log(`🔄 Auto-Scroll ${autoScrollEnabled ? 'AKTIVIERT ✅' : 'DEAKTIVIERT ❌'}`);
		return autoScrollEnabled;
	}

	// ✅ Export für Status-Abfrage (für Header)
	export function getAutoScrollStatus(): boolean {
		return autoScrollEnabled;
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
	class:scrolling={isScrolling}
	bind:this={scrollContainer}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
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
</div>

<style>
	/* ✅ Container für autoscroll + iPad Swipe-Gesten optimiert */
	.canvas-container {
		position: relative;
		width: 100%;
		/* ✅ FIX: Feste Höhe damit Scrollen funktioniert */
		height: calc(100vh - 50px);
		max-height: calc(100vh - 50px);
		overflow-y: auto;
		overflow-x: hidden;
		background: transparent;
		/* ✅ iPad/iOS: 'auto' erlaubt programmatisches Scrollen mit scrollTo() */
		scroll-behavior: auto;
		-webkit-overflow-scrolling: auto;
		/* ✅ GPU-Beschleunigung für flüssiges Scrollen auf iPad */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		will-change: scroll-position;
		/* ✅ iPad Swipe-Gesten: Verhindert Gummiband-Effekt */
		overscroll-behavior: contain;
		overscroll-behavior-x: none; /* ✅ Horizontal-Swipe erlauben für Tag-Navigation */
		touch-action: pan-y; /* ✅ Nur vertikales Scrollen, Horizontal für Gesten */
	}

	.canvas {
		max-width: 1400px;
		margin: 0 auto;
		padding: 58px 8px 50px 8px; /* 58px top = 50px Header + 8px Spacing */
		min-height: 100%;
		transform: translateZ(0);
	}

	.floors-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		contain: layout;
	}

	.floor-section {
		background: transparent;
		border-radius: 16px;
		padding: 0 0 12px 0;
		border: none;
		border-bottom: 5px solid rgba(255, 255, 255, 0.35);
		transition: transform 0.2s ease;
		transform: translateZ(0);
		margin-bottom: 8px;
		/* Performance: Rendert nur sichtbare Sektionen */
		content-visibility: auto;
		contain-intrinsic-size: 0 300px;
	}

	.floor-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.floor-title {
		color: var(--color-text-primary);
		font-size: 20px;
		font-weight: 700;
		margin: 0 0 6px 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 6px 12px;
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
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px; /* ✅ Kleinere Abstände */
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
		/* ✅ Globale Kachelgröße über CSS Variablen (Breite und Höhe separat) */
		transform: scaleX(var(--card-width-scale, 1)) scaleY(var(--card-height-scale, 1)) translateZ(0);
		will-change: transform;
		flex: 0 0 auto;
		/* ✅ Weniger Spalten = BREITERE Kacheln */
		width: calc((100% - 12px) / 4);
		min-width: 180px;
		/* ✅ ENTFERNT: max-height - erlaubt Kacheln mit Bildern zu wachsen ohne Überlappung */
		margin-bottom: 40px; /* ✅ Extra Platz für hängende Person-Badges (auch mit Bildern) */
	}

	.room-wrapper.selected {
		transform: scaleX(calc(var(--card-width-scale, 1) * 1.05)) scaleY(calc(var(--card-height-scale, 1) * 1.05)) translateZ(0);
		filter: brightness(1.1);
	}

	@media (min-width: 1024px) {
		.room-wrapper {
			width: calc((100% - 16px) / 5);
		}
	}

	@media (min-width: 1600px) {
		.rooms-grid {
			gap: 6px;
		}

		.room-wrapper {
			width: calc((100% - 24px) / 5); /* ✅ 5 statt 6 Spalten */
		}

		.canvas {
			max-width: 1800px;
			padding-bottom: 70px;
		}
	}

	@media (max-width: 1023px) {
		.canvas {
			padding: 8px;
			padding-bottom: 40px;
		}

		.rooms-grid {
			gap: 8px;
		}

		.room-wrapper {
			width: calc((100% - 16px) / 3);
		}

		.floor-title {
			font-size: 18px;
		}
	}

	@media (max-width: 768px) {
		.canvas {
			padding: 8px;
			padding-bottom: 35px;
		}

		.rooms-grid {
			gap: 6px;
		}

		.room-wrapper {
			width: calc((100% - 6px) / 2);
		}

		.floor-title {
			font-size: 16px;
		}

		.floor-section {
			padding: 0 0 4px 0;
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
</style>