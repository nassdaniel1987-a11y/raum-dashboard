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

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		dragStartX = e.offsetX - cropX;
		dragStartY = e.offsetY - cropY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			cropX = Math.max(0, Math.min(e.offsetX - dragStartX, containerWidth - cropWidth));
			cropY = Math.max(0, Math.min(e.offsetY - dragStartY, containerHeight - cropHeight));
			updateCrop();
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleResizeMouseDown(e: MouseEvent) {
		e.stopPropagation();
		isResizing = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
	}

	function handleResizeMouseMove(e: MouseEvent) {
		if (isResizing) {
			const deltaX = e.clientX - dragStartX;
			const deltaY = e.clientY - dragStartY;
			cropWidth = Math.max(50, Math.min(cropWidth + deltaX, containerWidth - cropX));
			cropHeight = Math.max(50, Math.min(cropHeight + deltaY, containerHeight - cropY));
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			updateCrop();
		}
	}

	function handleResizeMouseUp() {
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
		updateCrop();
	}

	$effect(() => {
		if (isResizing) {
			document.addEventListener('mousemove', handleResizeMouseMove);
			document.addEventListener('mouseup', handleResizeMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleResizeMouseMove);
				document.removeEventListener('mouseup', handleResizeMouseUp);
			};
		}
	});
</script>

<div class="crop-tool">
	<p class="instructions">📐 Ziehe das Rechteck um den gewünschten Ausschnitt zu wählen</p>

	<div
		class="crop-container"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
	>
		<img src={imageSrc} alt="Crop" class="crop-image" />

		<div
			class="crop-overlay"
			style="left: {cropX}px; top: {cropY}px; width: {cropWidth}px; height: {cropHeight}px;"
		>
			<div class="crop-handle" onmousedown={handleResizeMouseDown}></div>
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
		margin-bottom: 12px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		text-align: center;
	}

	.crop-container {
		position: relative;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		height: 300px;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		cursor: move;
		user-select: none;
	}

	.crop-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	.crop-overlay {
		position: absolute;
		border: 2px dashed #60a5fa;
		background: rgba(96, 165, 250, 0.1);
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.5),
			inset 0 0 0 2px rgba(96, 165, 250, 0.3);
		pointer-events: none;
	}

	.crop-handle {
		position: absolute;
		bottom: -6px;
		right: -6px;
		width: 16px;
		height: 16px;
		background: #60a5fa;
		border: 2px solid white;
		border-radius: 50%;
		cursor: nwse-resize;
		pointer-events: all;
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
	}

	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
