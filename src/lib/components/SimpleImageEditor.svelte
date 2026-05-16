<script lang="ts">
	// Props
	let {
		imageSrc,
		initialClassic = null,
		initialCalm = null,
		frameSize = 'medium',
		roomName = 'Raumname',
		activity = 'Aktivitaet',
		timeLabel = 'Kein Zeitfenster',
		personLabel = 'Keine Person',
		onUpdate
	} = $props<{
		imageSrc: string;
		initialClassic?: { zoom: number; x: number; y: number; rotation?: number } | null;
		initialCalm?: { zoom: number; x: number; y: number; rotation?: number } | null;
		frameSize?: 'small' | 'medium' | 'large';
		roomName?: string;
		activity?: string;
		timeLabel?: string;
		personLabel?: string;
		onUpdate?: (
			view: 'classic' | 'calm',
			data: { zoom: number; x: number; y: number; rotation: number }
		) => void;
	}>();

	// Tatsaechliche Pixelgroessen wie in RoomCard
	const frameSizes = {
		small: 80,
		medium: 120,
		large: 180
	};

	let actualFrameSize = $derived(frameSizes[frameSize as keyof typeof frameSizes]);

	// State - Position in PROZENT (wie RoomCard es erwartet)
	let classicPosition = $state({
		zoom: initialClassic?.zoom ?? 1,
		x: initialClassic?.x ?? 0,
		y: initialClassic?.y ?? 0,
		rotation: initialClassic?.rotation ?? 0
	});
	let calmPosition = $state({
		zoom: initialCalm?.zoom ?? initialClassic?.zoom ?? 1,
		x: initialCalm?.x ?? initialClassic?.x ?? 0,
		y: initialCalm?.y ?? initialClassic?.y ?? 0,
		rotation: initialCalm?.rotation ?? initialClassic?.rotation ?? 0
	});
	let isDragging = $state(false);
	let activePreview = $state<'classic' | 'calm'>('classic');
	let dragStartPos = $state({ x: 0, y: 0 });
	let dragStartPercent = $state({ x: 0, y: 0 });
	let containerRef = $state<HTMLDivElement | null>(null);

	// Konstanten
	const MIN_ZOOM = 0.6;
	const MAX_ZOOM = 3;
	const ZOOM_STEP = 0.1;

	let activePosition = $derived(activePreview === 'classic' ? classicPosition : calmPosition);

	// Update parent when values change
	$effect(() => {
		onUpdate?.('classic', classicPosition);
		onUpdate?.('calm', calmPosition);
	});

	// Wenn Zoom sich ändert, Position begrenzen
	$effect(() => {
		const maxOffset = getMaxOffset(activePosition.zoom);
		const nextX = Math.max(-maxOffset, Math.min(maxOffset, activePosition.x));
		const nextY = Math.max(-maxOffset, Math.min(maxOffset, activePosition.y));
		if (nextX !== activePosition.x || nextY !== activePosition.y) {
			updateActivePosition({ x: nextX, y: nextY });
		}
	});

	function getMaxOffset(z: number): number {
		// Bei zoom=1: 0% Offset möglich
		// Bei zoom=2: 50% Offset möglich (Bild ist doppelt so groß)
		// Bei zoom=3: 100% Offset möglich
		return Math.max(0, ((z - 1) / z) * 50);
	}

	function updateActivePosition(patch: Partial<typeof classicPosition>) {
		if (activePreview === 'classic') {
			classicPosition = { ...classicPosition, ...patch };
		} else {
			calmPosition = { ...calmPosition, ...patch };
		}
	}

	function handleZoomChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateActivePosition({ zoom: parseFloat(target.value) });
	}

	function zoomIn() {
		updateActivePosition({ zoom: Math.min(MAX_ZOOM, activePosition.zoom + ZOOM_STEP) });
	}

	function zoomOut() {
		updateActivePosition({ zoom: Math.max(MIN_ZOOM, activePosition.zoom - ZOOM_STEP) });
	}

	function reset() {
		updateActivePosition({ zoom: 1, x: 0, y: 0, rotation: 0 });
	}

	function rotateRight() {
		updateActivePosition({ rotation: (activePosition.rotation + 90) % 360 });
	}

	function rotateLeft() {
		updateActivePosition({ rotation: (activePosition.rotation - 90 + 360) % 360 });
	}

	// Drag handlers - konvertiert Pixel-Bewegung in Prozent
	function handlePointerDown(e: PointerEvent) {
		if (!containerRef) return;
		isDragging = true;
		dragStartPos = { x: e.clientX, y: e.clientY };
		dragStartPercent = { x: activePosition.x, y: activePosition.y };
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
		const percentX = (deltaX / containerRect.width) * 100 * activePosition.zoom;
		const percentY = (deltaY / containerRect.height) * 100 * activePosition.zoom;

		// Neue Position = Start + Delta
		let newX = dragStartPercent.x + percentX;
		let newY = dragStartPercent.y + percentY;

		// Begrenze die Position
		const maxOffset = getMaxOffset(activePosition.zoom);
		newX = Math.max(-maxOffset, Math.min(maxOffset, newX));
		newY = Math.max(-maxOffset, Math.min(maxOffset, newY));

		updateActivePosition({ x: newX, y: newY });
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
			updateActivePosition({
				zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, activePosition.zoom + delta * 0.01))
			});
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
	<div class="preview-tabs" role="tablist" aria-label="Vorschau-Modus">
		<button
			class:active={activePreview === 'classic'}
			onclick={() => (activePreview = 'classic')}
			role="tab"
			aria-selected={activePreview === 'classic'}
		>
			Klassisch
		</button>
		<button
			class:active={activePreview === 'calm'}
			onclick={() => (activePreview = 'calm')}
			role="tab"
			aria-selected={activePreview === 'calm'}
		>
			Ruhig
		</button>
	</div>

	<div class="preview-label">
		{activePreview === 'classic'
			? `Klassische Kachel - ${actualFrameSize}px Bildmarke`
			: 'Ruhige Kachel - Live-Ausschnitt'}
	</div>

	<div class="frame-container">
		{#if activePreview === 'classic'}
			<div class="polaroid-frame" style="--frame-size: {actualFrameSize}px;">
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
						style="transform: translate({activePosition.x}%, {activePosition.y}%) scale({activePosition.zoom}) rotate({activePosition.rotation}deg); transform-origin: center;"
						draggable="false"
					/>

					{#if activePosition.zoom > 1 && !isDragging}
						<div class="drag-hint">Ziehen zum Verschieben</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="calm-preview-card">
				<div class="calm-copy">
					<span class="calm-state">Offen</span>
					<strong>{roomName || 'Raumname'}</strong>
					<span>{activity || 'Keine Aktivitaet eingetragen'}</span>
					<footer>
						<span>{timeLabel}</span>
						<span>{personLabel}</span>
					</footer>
				</div>
				<div
					class="calm-viewport"
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
						style="transform: translate({activePosition.x}%, {activePosition.y}%) scale({activePosition.zoom}) rotate({activePosition.rotation}deg); transform-origin: center;"
						draggable="false"
					/>
					{#if activePosition.zoom > 1 && !isDragging}
						<div class="drag-hint">Ziehen zum Verschieben</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Controls -->
	<div class="controls">
		<!-- Zoom -->
		<div class="zoom-control">
			<button class="zoom-btn" onclick={zoomOut} disabled={activePosition.zoom <= MIN_ZOOM}>−</button>
			<div class="zoom-slider-container">
				<input
					type="range"
					min={MIN_ZOOM}
					max={MAX_ZOOM}
					step="0.05"
					value={activePosition.zoom}
					oninput={handleZoomChange}
					class="zoom-slider"
				/>
				<span class="zoom-value">{Math.round(activePosition.zoom * 100)}%</span>
			</div>
			<button class="zoom-btn" onclick={zoomIn} disabled={activePosition.zoom >= MAX_ZOOM}>+</button>
		</div>

		<!-- Rotation + Reset -->
		<div class="action-buttons">
			<button class="action-btn" onclick={rotateLeft} title="Nach links drehen">
				↶ 90°
			</button>
			<button class="action-btn" onclick={rotateRight} title="Nach rechts drehen">
				↷ 90°
			</button>
			<button class="reset-btn" onclick={reset}>
				↺ Reset
			</button>
		</div>
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
		text-align: center;
	}

	.preview-tabs {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
		max-width: 280px;
		margin: 0 auto;
	}

	.preview-tabs button {
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.72);
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
	}

	.preview-tabs button.active {
		border-color: rgba(96, 165, 250, 0.7);
		background: rgba(59, 130, 246, 0.22);
		color: white;
	}

	.frame-container {
		display: flex;
		justify-content: center;
		padding: 16px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.calm-preview-card {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(190px, 38%);
		width: min(100%, 520px);
		aspect-ratio: 1.08 / 1;
		min-height: 360px;
		overflow: hidden;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(15, 23, 42, 0.82);
		box-shadow: 0 14px 28px rgba(2, 6, 23, 0.24);
		color: #f8fafc;
	}

	.calm-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		padding: 18px 20px;
	}

	.calm-state {
		color: rgba(248, 250, 252, 0.76);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.calm-copy strong {
		margin-top: 10px;
		font-size: 28px;
		line-height: 1;
		overflow-wrap: anywhere;
	}

	.calm-copy > span:not(.calm-state) {
		margin-top: 10px;
		color: rgba(241, 245, 249, 0.78);
		font-size: 17px;
		font-weight: 700;
		line-height: 1.15;
	}

	.calm-copy footer {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: auto;
		padding-top: 14px;
		color: rgba(226, 232, 240, 0.72);
		font-size: 13px;
		font-weight: 800;
	}

	.calm-copy footer span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.calm-viewport {
		position: relative;
		min-width: 0;
		min-height: 0;
		margin: 10px 10px 10px 0;
		overflow: hidden;
		border: 1px solid rgba(226, 232, 240, 0.16);
		background: rgba(2, 6, 23, 0.42);
		cursor: grab;
		touch-action: none;
	}

	.calm-viewport.dragging {
		cursor: grabbing;
	}

	/* Polaroid-Rahmen wie in RoomCard - exakt passend zur Bildgroesse */
	.polaroid-frame {
		display: inline-block;
		margin: 0 auto;
		padding: 6px;
		padding-bottom: 10px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 3px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.image-viewport {
		position: relative;
		width: var(--frame-size, 180px);
		height: var(--frame-size, 180px);
		margin: 0 auto;
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

	.action-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.action-btn {
		padding: 8px 14px;
		border: none;
		border-radius: 8px;
		background: rgba(59, 130, 246, 0.3);
		color: white;
		font-size: 13px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.action-btn:hover {
		background: rgba(59, 130, 246, 0.5);
	}

	.reset-btn {
		padding: 8px 14px;
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
		.calm-preview-card {
			min-height: 280px;
		}

		.image-viewport {
			max-width: 100%;
		}

		.zoom-control {
			max-width: 100%;
		}
	}
</style>
