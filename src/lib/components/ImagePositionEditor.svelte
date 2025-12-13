<script lang="ts">
	// ✅ WYSIWYG Image Position Editor
	// Zeigt EXAKT wie das Bild in der Kachel aussehen wird!

	let {
		imageSrc,
		size = 'medium',
		onPositionChange
	} = $props<{
		imageSrc: string;
		size: 'small' | 'medium' | 'large';
		onPositionChange: (position: { x: number; y: number; zoom: number }) => void;
	}>();

	// ✅ Image Position & Zoom
	let imageX = $state(0); // Position in %
	let imageY = $state(0); // Position in %
	let zoom = $state(1); // Zoom level (0.5x - 3x)

	// ✅ Dragging state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let startImageX = $state(0);
	let startImageY = $state(0);

	// ✅ Container reference
	let containerRef: HTMLDivElement;

	// ✅ Frame dimensions based on size (height only, width is 100%)
	const frameDimensions = {
		small: 80,
		medium: 120,
		large: 180
	};

	let frameHeight = $derived(frameDimensions[size]);

	// ✅ Update callback whenever position/zoom changes
	function updatePosition() {
		onPositionChange({ x: imageX, y: imageY, zoom });
	}

	// ✅ Mouse/Touch handlers
	function handlePointerDown(e: MouseEvent | TouchEvent) {
		isDragging = true;

		if (e instanceof MouseEvent) {
			dragStartX = e.clientX;
			dragStartY = e.clientY;
		} else {
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			e.preventDefault();
		}

		startImageX = imageX;
		startImageY = imageY;
	}

	function handlePointerMove(e: MouseEvent | TouchEvent) {
		if (!isDragging || !containerRef) return;

		let clientX, clientY;
		if (e instanceof MouseEvent) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
			e.preventDefault();
		}

		const deltaX = clientX - dragStartX;
		const deltaY = clientY - dragStartY;

		// Convert pixel movement to percentage (relative to container size)
		const containerWidth = containerRef.offsetWidth;
		const containerHeight = containerRef.offsetHeight;

		const deltaXPercent = (deltaX / containerWidth) * 100;
		const deltaYPercent = (deltaY / containerHeight) * 100;

		imageX = startImageX + deltaXPercent;
		imageY = startImageY + deltaYPercent;

		updatePosition();
	}

	function handlePointerUp() {
		isDragging = false;
	}

	// ✅ Global mouse/touch handlers for dragging
	$effect(() => {
		if (isDragging) {
			const handleMove = (e: MouseEvent | TouchEvent) => handlePointerMove(e);
			const handleUp = () => handlePointerUp();

			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleUp);
			document.addEventListener('touchmove', handleMove as any, { passive: false });
			document.addEventListener('touchend', handleUp);

			return () => {
				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleUp);
				document.removeEventListener('touchmove', handleMove as any);
				document.removeEventListener('touchend', handleUp);
			};
		}
	});

	// ✅ Zoom handler
	function handleZoomChange() {
		updatePosition();
	}

	// ✅ Reset function
	function resetPosition() {
		imageX = 0;
		imageY = 0;
		zoom = 1;
		updatePosition();
	}
</script>

<div class="editor-container">
	<!-- Instructions -->
	<div class="instructions">
		<div class="instruction-main">📸 WYSIWYG Editor - Was du siehst = Was du bekommst!</div>
		<div class="instruction-sub">
			👆 Ziehe das Bild um es zu positionieren • 🔍 Zoome mit dem Slider
		</div>
	</div>

	<!-- Zoom Control -->
	<div class="zoom-control">
		<label>🔍 Zoom</label>
		<div class="zoom-slider-group">
			<button type="button" onclick={() => { zoom = Math.max(0.5, zoom - 0.1); handleZoomChange(); }}>−</button>
			<input
				type="range"
				bind:value={zoom}
				oninput={handleZoomChange}
				min="0.5"
				max="3"
				step="0.1"
				class="zoom-slider"
			/>
			<button type="button" onclick={() => { zoom = Math.min(3, zoom + 0.1); handleZoomChange(); }}>+</button>
			<span class="zoom-value">{zoom.toFixed(1)}×</span>
		</div>
	</div>

	<!-- Main Editor - EXACT Polaroid Frame -->
	<div class="editor-frame-wrapper">
		<div class="frame-label">
			<span class="label-size">{size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Groß'}</span>
			<span class="label-dimension">{frameHeight}px Höhe</span>
		</div>

		<!-- ✅ EXAKT wie Polaroid auf Kachel -->
		<div class="polaroid-frame" style="height: {frameHeight}px;">
			<div
				bind:this={containerRef}
				class="image-viewport"
				class:dragging={isDragging}
				onmousedown={handlePointerDown}
				ontouchstart={handlePointerDown}
			>
				<img
					src={imageSrc}
					alt="Position"
					class="draggable-image"
					style="transform: translate({imageX}%, {imageY}%) scale({zoom}); transform-origin: center;"
					draggable="false"
				/>
			</div>
		</div>
		<p class="exact-preview-hint">☝️ <strong>EXAKT</strong> so wird es auf der Kachel aussehen!</p>
	</div>

	<!-- Reset Button -->
	<button type="button" class="reset-btn" onclick={resetPosition}>
		🔄 Zurücksetzen
	</button>
</div>

<style>
	.editor-container {
		margin-top: 16px;
		padding: 20px;
		background: rgba(0, 0, 0, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
	}

	.instructions {
		margin-bottom: 20px;
		text-align: center;
		padding: 16px;
		background: rgba(59, 130, 246, 0.15);
		border: 2px solid rgba(59, 130, 246, 0.3);
		border-radius: 8px;
	}

	.instruction-main {
		color: #60a5fa;
		font-size: 16px;
		font-weight: 700;
		margin-bottom: 6px;
	}

	.instruction-sub {
		color: rgba(255, 255, 255, 0.8);
		font-size: 13px;
		font-weight: 500;
	}

	/* Zoom Control */
	.zoom-control {
		margin-bottom: 20px;
	}

	.zoom-control label {
		display: block;
		font-weight: 600;
		margin-bottom: 8px;
		color: var(--color-text-primary);
		font-size: 14px;
	}

	.zoom-slider-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.zoom-slider-group button {
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		cursor: pointer;
		font-weight: bold;
		font-size: 18px;
		transition: all 0.2s;
		min-width: 40px;
	}

	.zoom-slider-group button:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(1.05);
	}

	.zoom-slider {
		flex: 1;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		outline: none;
		cursor: pointer;
	}

	.zoom-value {
		min-width: 50px;
		text-align: right;
		color: #60a5fa;
		font-family: monospace;
		font-size: 16px;
		font-weight: 700;
	}

	/* Editor Frame */
	.editor-frame-wrapper {
		margin-bottom: 16px;
	}

	.frame-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding: 8px 12px;
		background: rgba(59, 130, 246, 0.2);
		border-radius: 6px;
	}

	.label-size {
		font-weight: 700;
		color: #60a5fa;
		font-size: 15px;
	}

	.label-dimension {
		font-size: 13px;
		opacity: 0.8;
		color: var(--color-text-primary);
	}

	/* ✅ Polaroid Frame - EXAKT wie auf Kachel */
	.polaroid-frame {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		padding: 6px;
		padding-bottom: 10px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 3px;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 1px 3px rgba(0, 0, 0, 0.2),
			0 0 0 3px rgba(59, 130, 246, 0.5); /* Blauer Rahmen zur Hervorhebung */
	}

	.image-viewport {
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 2px;
		position: relative;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.image-viewport.dragging {
		cursor: grabbing;
	}

	.draggable-image {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		height: auto;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
		transition: transform 0.05s linear;
	}

	.exact-preview-hint {
		text-align: center;
		margin-top: 12px;
		font-size: 14px;
		color: #60a5fa;
		font-weight: 600;
	}

	.exact-preview-hint strong {
		font-weight: 800;
		text-transform: uppercase;
		text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
	}

	/* Reset Button */
	.reset-btn {
		width: 100%;
		padding: 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
		font-size: 14px;
	}

	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}
</style>
