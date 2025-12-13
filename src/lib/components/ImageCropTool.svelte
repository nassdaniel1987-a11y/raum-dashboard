<script lang="ts">
	import type { ImageCrop } from '$lib/types';

	let { imageSrc, onCropChange } = $props<{
		imageSrc: string;
		onCropChange: (crop: ImageCrop) => void;
	}>();

	let cropX = $state(0);
	let cropY = $state(0);
	let cropWidth = $state(100);
	let cropHeight = $state(100);
	let isDragging = $state(false);
	let isResizing = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let containerWidth = $state(300);
	let containerHeight = $state(200);
	let containerRef: HTMLDivElement;

	// ✅ Neue Features
	let zoom = $state(1);
	let rotation = $state(0); // 0, 90, 180, 270
	let aspectRatio = $state<'free' | '1:1' | '16:9' | '4:3' | '9:16'>('free');
	let lockedRatio = $state<number | null>(null);

	// ✅ Aspect Ratio Lock
	$effect(() => {
		switch (aspectRatio) {
			case '1:1':
				lockedRatio = 1;
				break;
			case '16:9':
				lockedRatio = 16 / 9;
				break;
			case '4:3':
				lockedRatio = 4 / 3;
				break;
			case '9:16':
				lockedRatio = 9 / 16;
				break;
			default:
				lockedRatio = null;
		}

		// Adjust crop to match aspect ratio
		if (lockedRatio !== null) {
			const newHeight = cropWidth / lockedRatio;
			if (newHeight <= containerHeight) {
				cropHeight = newHeight;
			} else {
				cropHeight = containerHeight;
				cropWidth = cropHeight * lockedRatio;
			}
			updateCrop();
		}
	});

	// ✅ Unified handlers for Mouse & Touch
	function getPointerPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
		if (e instanceof MouseEvent) {
			const rect = containerRef.getBoundingClientRect();
			return { x: e.clientX - rect.left, y: e.clientY - rect.top };
		} else {
			const rect = containerRef.getBoundingClientRect();
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			};
		}
	}

	function handlePointerDown(e: MouseEvent | TouchEvent) {
		const pos = getPointerPosition(e);
		isDragging = true;
		dragStartX = pos.x - cropX;
		dragStartY = pos.y - cropY;
		if (e instanceof TouchEvent) {
			e.preventDefault();
		}
	}

	function handlePointerMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		const pos = getPointerPosition(e);
		cropX = Math.max(0, Math.min(pos.x - dragStartX, containerWidth - cropWidth));
		cropY = Math.max(0, Math.min(pos.y - dragStartY, containerHeight - cropHeight));
		updateCrop();
		if (e instanceof TouchEvent) {
			e.preventDefault();
		}
	}

	function handlePointerUp() {
		isDragging = false;
	}

	function handleResizePointerDown(e: MouseEvent | TouchEvent) {
		e.stopPropagation();
		isResizing = true;
		if (e instanceof MouseEvent) {
			dragStartX = e.clientX;
			dragStartY = e.clientY;
		} else {
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			e.preventDefault();
		}
	}

	function handleResizePointerMove(e: MouseEvent | TouchEvent) {
		if (!isResizing) return;

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

		if (lockedRatio !== null) {
			// Maintain aspect ratio
			const newWidth = Math.max(50, Math.min(cropWidth + deltaX, containerWidth - cropX));
			cropWidth = newWidth;
			cropHeight = newWidth / lockedRatio;

			// Ensure height doesn't exceed container
			if (cropHeight > containerHeight - cropY) {
				cropHeight = containerHeight - cropY;
				cropWidth = cropHeight * lockedRatio;
			}
		} else {
			// Free resize
			cropWidth = Math.max(50, Math.min(cropWidth + deltaX, containerWidth - cropX));
			cropHeight = Math.max(50, Math.min(cropHeight + deltaY, containerHeight - cropY));
		}

		dragStartX = clientX;
		dragStartY = clientY;
		updateCrop();
	}

	function handleResizePointerUp() {
		isResizing = false;
	}

	function updateCrop() {
		onCropChange({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
	}

	function resetCrop() {
		cropX = 0;
		cropY = 0;
		cropWidth = containerWidth;
		cropHeight = containerHeight;
		zoom = 1;
		rotation = 0;
		aspectRatio = 'free';
		updateCrop();
	}

	function handleZoomChange() {
		updateCrop();
	}

	function rotateLeft() {
		rotation = (rotation - 90 + 360) % 360;
	}

	function rotateRight() {
		rotation = (rotation + 90) % 360;
	}

	$effect(() => {
		if (isResizing) {
			const handleMove = (e: MouseEvent | TouchEvent) => handleResizePointerMove(e);
			const handleUp = () => handleResizePointerUp();

			document.addEventListener('mousemove', handleMove as any);
			document.addEventListener('mouseup', handleUp);
			document.addEventListener('touchmove', handleMove as any, { passive: false });
			document.addEventListener('touchend', handleUp);

			return () => {
				document.removeEventListener('mousemove', handleMove as any);
				document.removeEventListener('mouseup', handleUp);
				document.removeEventListener('touchmove', handleMove as any);
				document.removeEventListener('touchend', handleUp);
			};
		}
	});
</script>

<div class="crop-tool">
	<div class="instructions">
		<div class="instruction-main">✂️ Bildausschnitt wählen</div>
		<div class="instruction-sub">
			👆 Ziehe den blauen Rahmen • 🔵 Ziehe am Punkt zum Vergrößern
		</div>
	</div>

	<!-- ✅ Controls -->
	<div class="controls">
		<!-- Zoom -->
		<div class="control-group">
			<label>🔍 Zoom</label>
			<div class="zoom-controls">
				<button type="button" onclick={() => { zoom = Math.max(0.5, zoom - 0.25); handleZoomChange(); }}>−</button>
				<input type="range" bind:value={zoom} oninput={handleZoomChange} min="0.5" max="3" step="0.25" />
				<button type="button" onclick={() => { zoom = Math.min(3, zoom + 0.25); handleZoomChange(); }}>+</button>
				<span class="zoom-value">{zoom.toFixed(2)}×</span>
			</div>
		</div>

		<!-- Aspect Ratio -->
		<div class="control-group">
			<label>📐 Seitenverhältnis</label>
			<div class="aspect-buttons">
				<button type="button" class:active={aspectRatio === 'free'} onclick={() => aspectRatio = 'free'}>Frei</button>
				<button type="button" class:active={aspectRatio === '1:1'} onclick={() => aspectRatio = '1:1'}>1:1</button>
				<button type="button" class:active={aspectRatio === '16:9'} onclick={() => aspectRatio = '16:9'}>16:9</button>
				<button type="button" class:active={aspectRatio === '4:3'} onclick={() => aspectRatio = '4:3'}>4:3</button>
				<button type="button" class:active={aspectRatio === '9:16'} onclick={() => aspectRatio = '9:16'}>9:16</button>
			</div>
		</div>

		<!-- Rotation -->
		<div class="control-group">
			<label>🔄 Drehen</label>
			<div class="rotation-controls">
				<button type="button" onclick={rotateLeft}>↶ 90° Links</button>
				<button type="button" onclick={rotateRight}>↷ 90° Rechts</button>
				<span class="rotation-value">{rotation}°</span>
			</div>
		</div>
	</div>

	<!-- Crop Container -->
	<div
		bind:this={containerRef}
		class="crop-container"
		onmousedown={handlePointerDown}
		onmousemove={handlePointerMove}
		onmouseup={handlePointerUp}
		ontouchstart={handlePointerDown}
		ontouchmove={handlePointerMove}
		ontouchend={handlePointerUp}
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
	>
		<img
			src={imageSrc}
			alt="Crop"
			class="crop-image"
			style="transform: scale({zoom}) rotate({rotation}deg); transform-origin: center;"
		/>

		<div
			class="crop-overlay"
			style="left: {cropX}px; top: {cropY}px; width: {cropWidth}px; height: {cropHeight}px;"
		>
			<div
				class="crop-handle"
				onmousedown={handleResizePointerDown}
				ontouchstart={handleResizePointerDown}
			></div>
		</div>
	</div>

	<button type="button" class="reset-btn" onclick={resetCrop}>
		🔄 Zurücksetzen
	</button>
</div>

<style>
	.crop-tool {
		margin-top: 16px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
	}

	.instructions {
		margin-bottom: 16px;
		text-align: center;
		padding: 12px;
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
		color: rgba(255, 255, 255, 0.7);
		font-size: 12px;
		font-weight: 500;
	}

	/* ✅ Controls */
	.controls {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.control-group label {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Zoom Controls */
	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.zoom-controls button {
		padding: 6px 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: white;
		cursor: pointer;
		font-weight: bold;
		font-size: 16px;
		transition: all 0.2s;
	}

	.zoom-controls button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.zoom-controls input[type="range"] {
		flex: 1;
	}

	.zoom-value {
		min-width: 50px;
		text-align: right;
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
		font-size: 13px;
	}

	/* Aspect Ratio Buttons */
	.aspect-buttons {
		display: flex;
		gap: 6px;
	}

	.aspect-buttons button {
		flex: 1;
		padding: 6px 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.aspect-buttons button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.aspect-buttons button.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		color: #60a5fa;
	}

	/* Rotation Controls */
	.rotation-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.rotation-controls button {
		flex: 1;
		padding: 6px 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: white;
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.rotation-controls button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.rotation-value {
		min-width: 40px;
		text-align: right;
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
		font-size: 13px;
	}

	.crop-container {
		position: relative;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		height: 350px;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		cursor: move;
		user-select: none;
		touch-action: none; /* ✅ Wichtig für Touch-Support */
		background: rgba(0, 0, 0, 0.5);
	}

	.crop-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
		transition: transform 0.2s;
	}

	.crop-overlay {
		position: absolute;
		border: 3px dashed #60a5fa; /* ✅ Dicker für bessere Sichtbarkeit */
		background: rgba(96, 165, 250, 0.05);
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.65), /* ✅ Dunkler für besseren Kontrast */
			inset 0 0 0 3px rgba(96, 165, 250, 0.4),
			0 0 20px rgba(96, 165, 250, 0.6); /* ✅ Leuchtender Glow */
		pointer-events: none;
		animation: pulse-border 2s ease-in-out infinite; /* ✅ Subtile Pulsierung */
	}

	@keyframes pulse-border {
		0%, 100% {
			border-color: #60a5fa;
		}
		50% {
			border-color: #93c5fd;
		}
	}

	.crop-handle {
		position: absolute;
		bottom: -8px;
		right: -8px;
		width: 24px; /* ✅ Größer für Touch */
		height: 24px;
		background: #60a5fa;
		border: 2px solid white;
		border-radius: 50%;
		cursor: nwse-resize;
		pointer-events: all;
		touch-action: none; /* ✅ Wichtig für Touch-Support */
	}

	.crop-handle:hover {
		background: #3b82f6;
		transform: scale(1.2);
	}

	.reset-btn {
		width: 100%;
		margin-top: 12px;
		padding: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
	}

	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
