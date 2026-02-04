<script lang="ts">
	import { visibleRooms, isEditMode, swapSelection, viewWeekday } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { RoomWithConfig } from '$lib/types';
	import '$lib/styles/performance.css';

	// Svelte 5 Props Syntax
	let { handleEditRoom } = $props<{
		handleEditRoom: (room: RoomWithConfig) => void;
	}>();

	// =============================================
	// SEITEN-MODUS (Buchseiten-Animation)
	// =============================================

	let currentPage = $state(0);
	let isAnimating = $state(false);
	let animationDirection = $state<'next' | 'prev'>('next');
	let autoPageEnabled = $state(true);
	let pageDuration = $state(8); // Sekunden pro Seite
	let animationType = $state<'book' | 'slide' | 'fade' | 'cube'>('book');
	let pageTimerId: ReturnType<typeof setTimeout> | undefined;

	// Seiten-Definition (4 Seiten)
	const pageDefinitions = [
		{ id: 'dach', label: '🏠 Dachgeschoss', floors: ['dach'] },
		{ id: 'og', label: '1.OG / 2.OG', floors: ['og2', 'og1'] },
		{ id: 'eg', label: '🚪 Erdgeschoss', floors: ['eg', 'essen'] },
		{ id: 'extern', label: '🏃 Außenbereich', floors: ['extern'] }
	];

	// Gruppiere Räume nach Stockwerk
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
		essen: $visibleRooms.filter((r) => r.floor === 'essen').sort((a, b) => a.position_x - b.position_x),
		ug: $visibleRooms.filter((r) => r.floor === 'ug').sort((a, b) => a.position_x - b.position_x)
	});

	// Räume für aktuelle Seite
	let currentPageRooms = $derived(() => {
		const page = pageDefinitions[currentPage];
		if (!page) return [];

		const rooms: RoomWithConfig[] = [];
		for (const floor of page.floors) {
			const floorRooms = roomsByFloor[floor as keyof typeof roomsByFloor];
			if (floorRooms) {
				rooms.push(...floorRooms);
			}
		}
		return rooms;
	});

	// Filtere leere Seiten
	let activePages = $derived(() => {
		return pageDefinitions.filter(page => {
			return page.floors.some(floor => {
				const rooms = roomsByFloor[floor as keyof typeof roomsByFloor];
				return rooms && rooms.length > 0;
			});
		});
	});

	// Nächste Seite
	function nextPage() {
		if (isAnimating) return;

		const pages = activePages();
		if (pages.length <= 1) return;

		isAnimating = true;
		animationDirection = 'next';

		// Finde aktuellen Index in activePages
		const currentIdx = pages.findIndex(p => p.id === pageDefinitions[currentPage].id);
		const nextIdx = (currentIdx + 1) % pages.length;
		const nextPageDef = pages[nextIdx];
		currentPage = pageDefinitions.findIndex(p => p.id === nextPageDef.id);

		setTimeout(() => {
			isAnimating = false;
		}, 600);
	}

	// Vorherige Seite
	function prevPage() {
		if (isAnimating) return;

		const pages = activePages();
		if (pages.length <= 1) return;

		isAnimating = true;
		animationDirection = 'prev';

		const currentIdx = pages.findIndex(p => p.id === pageDefinitions[currentPage].id);
		const prevIdx = currentIdx === 0 ? pages.length - 1 : currentIdx - 1;
		const prevPageDef = pages[prevIdx];
		currentPage = pageDefinitions.findIndex(p => p.id === prevPageDef.id);

		setTimeout(() => {
			isAnimating = false;
		}, 600);
	}

	// Zu bestimmter Seite springen
	function goToPage(pageId: string) {
		if (isAnimating) return;

		const targetIdx = pageDefinitions.findIndex(p => p.id === pageId);
		if (targetIdx === -1 || targetIdx === currentPage) return;

		isAnimating = true;
		animationDirection = targetIdx > currentPage ? 'next' : 'prev';
		currentPage = targetIdx;

		// Timer neu starten
		restartAutoPage();

		setTimeout(() => {
			isAnimating = false;
		}, 600);
	}

	// Auto-Seitenwechsel starten
	function startAutoPage() {
		if (!autoPageEnabled) return;

		stopAutoPage();
		pageTimerId = setTimeout(() => {
			nextPage();
			startAutoPage();
		}, pageDuration * 1000);
	}

	// Auto-Seitenwechsel stoppen
	function stopAutoPage() {
		if (pageTimerId) {
			clearTimeout(pageTimerId);
			pageTimerId = undefined;
		}
	}

	// Timer neu starten (nach manuellem Wechsel)
	function restartAutoPage() {
		stopAutoPage();
		startAutoPage();
	}

	// Touch/Swipe Handling für Seitenwechsel
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;

		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Horizontaler Swipe für Seitenwechsel
		if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
			if (deltaX > 0) {
				prevPage();
			} else {
				nextPage();
			}
			restartAutoPage();
		}
	}

	// Export-Funktionen für Einstellungen
	export function setPageDuration(seconds: number) {
		pageDuration = seconds;
		localStorage.setItem('pageDuration', seconds.toString());
		restartAutoPage();
	}

	export function toggleAutoPage(): boolean {
		autoPageEnabled = !autoPageEnabled;
		localStorage.setItem('autoPageEnabled', autoPageEnabled.toString());

		if (autoPageEnabled) {
			startAutoPage();
		} else {
			stopAutoPage();
		}

		return autoPageEnabled;
	}

	export function getAutoPageStatus(): boolean {
		return autoPageEnabled;
	}

	export function setAnimationType(type: 'book' | 'slide' | 'fade' | 'cube') {
		animationType = type;
		localStorage.setItem('animationType', type);
	}

	export function getAnimationType(): string {
		return animationType;
	}

	// Mount: Einstellungen laden & Auto-Start
	onMount(() => {
		const savedDuration = localStorage.getItem('pageDuration');
		const savedEnabled = localStorage.getItem('autoPageEnabled');
		const savedAnimation = localStorage.getItem('animationType');

		if (savedDuration) pageDuration = parseInt(savedDuration);
		if (savedEnabled) autoPageEnabled = savedEnabled === 'true';
		if (savedAnimation) animationType = savedAnimation as typeof animationType;

		// Starte auf erster aktiver Seite
		const pages = activePages();
		if (pages.length > 0) {
			currentPage = pageDefinitions.findIndex(p => p.id === pages[0].id);
		}

		// Auto-Start
		if (autoPageEnabled) {
			setTimeout(startAutoPage, 1000);
		}
	});

	// Cleanup
	onDestroy(() => {
		stopAutoPage();
	});

	// Swap-Funktionalität
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
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	transition:fade
>
	{#if $visibleRooms.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📭</div>
			<h2>Keine Räume vorhanden</h2>
			<p>Erstelle deinen ersten Raum über das Menü unten rechts!</p>
		</div>
	{:else}
		<!-- Seiten-Container -->
		<div class="page-container" class:anim-book={animationType === 'book'} class:anim-slide={animationType === 'slide'} class:anim-fade={animationType === 'fade'} class:anim-cube={animationType === 'cube'}>
			<!-- Seiteninhalt -->
			{#key currentPage}
				<div
					class="page-content"
					class:animate-next={isAnimating && animationDirection === 'next'}
					class:animate-prev={isAnimating && animationDirection === 'prev'}
				>
					<!-- Seiten-Titel -->
					<div class="page-header">
						<h2 class="page-title">{pageDefinitions[currentPage]?.label}</h2>
					</div>

					<!-- Räume Grid -->
					<div class="rooms-grid-page">
						{#each currentPageRooms() as room (room.id)}
							<div
								animate:flip={{ duration: 300 }}
								class="room-wrapper-page"
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
			{/key}
		</div>

		<!-- Seiten-Indikatoren -->
		<div class="page-indicators">
			{#each activePages() as page, idx}
				<button
					class="page-dot"
					class:active={pageDefinitions[currentPage]?.id === page.id}
					onclick={() => goToPage(page.id)}
					title={page.label}
				>
					<span class="dot-icon">{page.label.split(' ')[0]}</span>
				</button>
			{/each}
		</div>

		<!-- Navigations-Pfeile -->
		<button class="nav-arrow nav-prev" onclick={() => { prevPage(); restartAutoPage(); }} aria-label="Vorherige Seite">
			‹
		</button>
		<button class="nav-arrow nav-next" onclick={() => { nextPage(); restartAutoPage(); }} aria-label="Nächste Seite">
			›
		</button>

		<!-- Fortschrittsbalken -->
		{#if autoPageEnabled}
			<div class="progress-bar">
				<div
					class="progress-fill"
					style="animation-duration: {pageDuration}s;"
					class:paused={!autoPageEnabled}
				></div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.canvas-container {
		position: relative;
		width: 100%;
		height: calc(100vh - 50px);
		overflow: hidden;
		background: transparent;
		/* iPad-optimiert */
		touch-action: pan-x;
		-webkit-overflow-scrolling: touch;
	}

	/* Seiten-Container */
	.page-container {
		position: relative;
		width: 100%;
		height: 100%;
		perspective: 1500px;
		overflow: hidden;
	}

	/* Seiten-Inhalt */
	.page-content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 60px 16px 80px 16px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		transform-origin: left center;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	/* ==================== ANIMATIONEN ==================== */

	/* BUCH Animation (Standard) */
	.anim-book .page-content.animate-next {
		animation: bookFlipNext 0.6s ease-in-out;
	}
	.anim-book .page-content.animate-prev {
		animation: bookFlipPrev 0.6s ease-in-out;
	}

	@keyframes bookFlipNext {
		0% { transform: rotateY(-90deg) translateZ(50px); opacity: 0; }
		50% { opacity: 0.5; }
		100% { transform: rotateY(0deg) translateZ(0); opacity: 1; }
	}
	@keyframes bookFlipPrev {
		0% { transform: rotateY(90deg) translateZ(50px); opacity: 0; }
		50% { opacity: 0.5; }
		100% { transform: rotateY(0deg) translateZ(0); opacity: 1; }
	}

	/* SLIDE Animation */
	.anim-slide .page-content.animate-next {
		animation: slideNext 0.4s ease-out;
	}
	.anim-slide .page-content.animate-prev {
		animation: slidePrev 0.4s ease-out;
	}

	@keyframes slideNext {
		0% { transform: translateX(100%); opacity: 0; }
		100% { transform: translateX(0); opacity: 1; }
	}
	@keyframes slidePrev {
		0% { transform: translateX(-100%); opacity: 0; }
		100% { transform: translateX(0); opacity: 1; }
	}

	/* FADE Animation */
	.anim-fade .page-content.animate-next,
	.anim-fade .page-content.animate-prev {
		animation: fadeIn 0.5s ease-in-out;
	}

	@keyframes fadeIn {
		0% { opacity: 0; transform: scale(0.95); }
		100% { opacity: 1; transform: scale(1); }
	}

	/* CUBE Animation */
	.anim-cube .page-content.animate-next {
		animation: cubeNext 0.5s ease-in-out;
	}
	.anim-cube .page-content.animate-prev {
		animation: cubePrev 0.5s ease-in-out;
	}

	@keyframes cubeNext {
		0% { transform: rotateY(-90deg) translateZ(200px); opacity: 0; }
		100% { transform: rotateY(0deg) translateZ(0); opacity: 1; }
	}
	@keyframes cubePrev {
		0% { transform: rotateY(90deg) translateZ(200px); opacity: 0; }
		100% { transform: rotateY(0deg) translateZ(0); opacity: 1; }
	}

	/* Seiten-Header */
	.page-header {
		text-align: center;
		margin-bottom: 16px;
		flex-shrink: 0;
	}

	.page-title {
		font-size: 28px;
		font-weight: 700;
		color: white;
		margin: 0;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		padding: 12px 32px;
		border-radius: 16px;
		display: inline-block;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	/* Räume Grid - optimiert für iPad 1024x768 */
	.rooms-grid-page {
		flex: 1;
		display: grid;
		/* 2x2 Grid für max 4 Räume pro Seite */
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 16px;
		padding: 8px;
		max-width: 900px;
		max-height: calc(100% - 20px);
		margin: 0 auto;
		align-content: center;
	}

	.room-wrapper-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 0;
		max-height: 100%;
	}

	.room-wrapper-page :global(.room-card) {
		width: 100%;
		max-width: 380px;
		height: auto;
		max-height: 280px;
	}

	.room-wrapper-page.selected {
		transform: scale(1.02);
		filter: brightness(1.1);
	}

	/* Seiten-Indikatoren */
	.page-indicators {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 12px;
		z-index: 100;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		padding: 8px 16px;
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.page-dot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
	}

	.page-dot:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	.page-dot.active {
		background: rgba(59, 130, 246, 0.6);
		border-color: rgba(59, 130, 246, 0.8);
		transform: scale(1.15);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
	}

	.dot-icon {
		line-height: 1;
	}

	/* Navigations-Pfeile */
	.nav-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 50px;
		height: 80px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 36px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.nav-prev {
		left: 8px;
		border-radius: 0 12px 12px 0;
	}

	.nav-next {
		right: 8px;
		border-radius: 12px 0 0 12px;
	}

	.nav-arrow:hover {
		background: rgba(0, 0, 0, 0.6);
		transform: translateY(-50%) scale(1.05);
	}

	.nav-arrow:active {
		transform: translateY(-50%) scale(0.95);
	}

	/* Fortschrittsbalken */
	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: rgba(255, 255, 255, 0.2);
		z-index: 100;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8));
		animation: progressFill linear forwards;
		animation-iteration-count: infinite;
	}

	.progress-fill.paused {
		animation-play-state: paused;
	}

	@keyframes progressFill {
		0% {
			width: 0%;
		}
		100% {
			width: 100%;
		}
	}

	/* Empty State */
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

	/* iPad-spezifische Anpassungen (1024x768) */
	@media (max-width: 1024px) and (min-height: 700px) {
		.page-content {
			padding: 55px 12px 70px 12px;
		}

		.page-title {
			font-size: 24px;
			padding: 10px 24px;
		}

		.rooms-grid-page {
			gap: 12px;
			max-width: 95%;
		}

		.room-wrapper-page :global(.room-card) {
			max-width: 100%;
			max-height: 250px;
		}

		.nav-arrow {
			width: 40px;
			height: 60px;
			font-size: 28px;
		}

		.page-indicators {
			bottom: 12px;
			padding: 6px 12px;
			gap: 8px;
		}

		.page-dot {
			width: 36px;
			height: 36px;
			font-size: 16px;
		}
	}

	/* Kleinere Tablets */
	@media (max-width: 768px) {
		.page-content {
			padding: 50px 8px 65px 8px;
		}

		.page-title {
			font-size: 20px;
			padding: 8px 20px;
		}

		.rooms-grid-page {
			grid-template-columns: repeat(2, 1fr);
			gap: 8px;
		}

		.nav-arrow {
			width: 35px;
			height: 50px;
			font-size: 24px;
		}

		.page-dot {
			width: 32px;
			height: 32px;
			font-size: 14px;
		}
	}
</style>
