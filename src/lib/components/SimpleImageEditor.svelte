<script lang="ts">
	// Props
	let {
		imageSrc,
		initialZoom = 1,
		initialX = 0,
		initialY = 0,
		onUpdate
	} = $props<{
		imageSrc: string;
		initialZoom?: number;
		initialX?: number;
		initialY?: number;
		onUpdate?: (data: { zoom: number; x: number; y: number }) => void;
	}>();

	// State - Position in PROZENT (wie RoomCard es erwartet)
	let zoom = $state(initialZoom);
	let posX = $state(initialX); // Prozent
	let posY = $state(initialY); // Prozent
	let isDragging = $state(false);
	let dragStartPos = $state({ x: 0, y: 0 });
	let dragStartPercent = $state({ x: 0, y: 0 });
	let containerRef: HTMLDivElement;

	// Konstanten
	const MIN_ZOOM = 1;
	const MAX_ZOOM = 3;
	const ZOOM_STEP = 0.1;

	// Update parent when values change
	$effect(() => {
		onUpdate?.({ zoom, x: posX, y: posY });
	});

	// Wenn Zoom sich ändert, Position begrenzen
	$effect(() => {
		const maxOffset = getMaxOffset(zoom);
		posX = Math.max(-maxOffset, Math.min(maxOffset, posX));
		posY = Math.max(-maxOffset, Math.min(maxOffset, posY));
	});

	function getMaxOffset(z: number): number {
		// Bei zoom=1: 0% Offset möglich
		// Bei zoom=2: 50% Offset möglich (Bild ist doppelt so groß)
		// Bei zoom=3: 100% Offset möglich
		return ((z - 1) / z) * 50;
	}

	function handleZoomChange(e: Event) {
		const target = e.target as HTMLInputElement;
		zoom = parseFloat(target.value);
	}

	function zoomIn() {
		zoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
	}

	function zoomOut() {
		zoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
	}

	function reset() {
		zoom = 1;
		posX = 0;
		posY = 0;
	}

	// Drag handlers - konvertiert Pixel-Bewegung in Prozent
	function handlePointerDown(e: PointerEvent) {
		if (!containerRef) return;
		isDragging = true;
		dragStartPos = { x: e.clientX, y: e.clientY };
		dragStartPercent = { x: posX, y: posY };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || !containerRef) return;

		const containerRect = containerRef.getBoundingClientRect();

		// Pixel-Differenz seit Drag-Start
		const deltaX = e.clientX - dragStartPos.x;
		const deltaY = e.clientY - dragStartPos.y;

		// Konvertiere Pixel zu Prozent (relativ zur Container-Größe)
		// Multipliziert mit Zoom weil das Bild gezoomt ist
		const percentX = (deltaX / containerRect.width) * 100 * zoom;
		const percentY = (deltaY / containerRect.height) * 100 * zoom;

		// Neue Position = Start + Delta
		let newX = dragStartPercent.x + percentX;
		let newY = dragStartPercent.y + percentY;

		// Begrenze die Position
		const maxOffset = getMaxOffset(zoom);
		newX = Math.max(-maxOffset, Math.min(maxOffset, newX));
		newY = Math.max(-maxOffset, Math.min(maxOffset, newY));

		posX = newX;
		posY = newY;
	}

	function handlePointerUp(e: PointerEvent) {
		isDragging = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}

	// Touch-Zoom mit Pinch
	let lastTouchDistance = 0;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			lastTouchDistance = getTouchDistance(e.touches);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2) {
			const newDistance = getTouchDistance(e.touches);
			const delta = newDistance - lastTouchDistance;
			zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta * 0.01));
			lastTouchDistance = newDistance;
		}
	}

	function getTouchDistance(touches: TouchList): number {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}
</script>

<div class="editor-container">
	<!-- Vorschau im Polaroid-Stil (wie in der echten Kachel) -->
	<div class="preview-label">Vorschau (so sieht es in der Kachel aus):</div>

	<div class="polaroid-frame">
		<div
			class="image-viewport"
			bind:this={containerRef}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			class:dragging={isDragging}
		>
			<img
				src={imageSrc}
				alt="Aktivitätsbild"
				class="preview-image"
				style="transform: translate({posX}%, {posY}%) scale({zoom}); transform-origin: center;"
				draggable="false"
			/>

			<!-- Drag-Hinweis -->
			{#if zoom > 1 && !isDragging}
				<div class="drag-hint">Ziehen zum Verschieben</div>
			{/if}
		</div>
	</div>

	<!-- Controls -->
	<div class="controls">
		<!-- Zoom -->
		<div class="zoom-control">
			<button class="zoom-btn" onclick={zoomOut} disabled={zoom <= MIN_ZOOM}>−</button>
			<div class="zoom-slider-container">
				<input
					type="range"
					min={MIN_ZOOM}
					max={MAX_ZOOM}
					step="0.05"
					value={zoom}
					oninput={handleZoomChange}
					class="zoom-slider"
				/>
				<span class="zoom-value">{Math.round(zoom * 100)}%</span>
			</div>
			<button class="zoom-btn" onclick={zoomIn} disabled={zoom >= MAX_ZOOM}>+</button>
		</div>

		<!-- Reset Button -->
		<button class="reset-btn" onclick={reset}>
			↺ Zurücksetzen
		</button>
	</div>

	<!-- Hinweis -->
	<p class="hint">
		Zoom: Bild größer/kleiner machen | Ziehen: Ausschnitt wählen
	</p>
</div>

<style>
	.editor-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.preview-label {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 4px;
	}

	/* Polaroid-Rahmen wie in RoomCard */
	.polaroid-frame {
		width: 100%;
		max-width: 300px;
		margin: 0 auto;
		padding: 6px;
		padding-bottom: 10px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 3px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.image-viewport {
		position: relative;
		width: 100%;
		height: 180px;
		overflow: hidden;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.05);
		cursor: grab;
		touch-action: none;
	}

	.image-viewport.dragging {
		cursor: grabbing;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform-origin: center center;
		pointer-events: none;
		user-select: none;
	}

	.drag-hint {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 11px;
		pointer-events: none;
		opacity: 0.8;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}

	.zoom-control {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 350px;
	}

	.zoom-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		font-size: 20px;
		font-weight: bold;
		cursor: pointer;
		transition: background 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zoom-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.25);
	}

	.zoom-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.zoom-slider-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.zoom-slider {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		outline: none;
	}

	.zoom-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.zoom-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.zoom-value {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 600;
	}

	.reset-btn {
		padding: 8px 20px;
		border: none;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		font-size: 13px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.hint {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.5);
		text-align: center;
		margin: 0;
	}

	/* Mobile */
	@media (max-width: 480px) {
		.image-viewport {
			max-width: 100%;
		}

		.zoom-control {
			max-width: 100%;
		}
	}
</style>
