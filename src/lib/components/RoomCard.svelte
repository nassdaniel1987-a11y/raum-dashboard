<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import { fly, scale, fade } from 'svelte/transition';
	import { isEditMode, updateRoomPosition, toggleRoomStatus } from '$lib/stores/appState';
	import { supabase } from '$lib/supabase/client';
	import type { RoomWithConfig } from '$lib/types';

	export let room: RoomWithConfig;
	export let onEdit: (room: RoomWithConfig) => void;

	let isDragging = false;
	let dragStartTime = 0;
	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;

	function handleDragStart() {
		isDragging = true;
		dragStartTime = Date.now();
	}

	function handleDragEnd(event: CustomEvent) {
		const dragDuration = Date.now() - dragStartTime;
		isDragging = false;

		// Nur Position speichern wenn wirklich gedragged wurde (> 100ms)
		if (dragDuration > 100) {
			const { offsetX, offsetY } = event.detail;
			updateRoomPosition(room.id, room.position_x + offsetX, room.position_y + offsetY);
		}
	}

	async function handleClick(e: MouseEvent) {
		// Kein Toggle wenn gerade gedragged wurde
		if (isDragging || Date.now() - dragStartTime < 200) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if ($isEditMode && !showContextMenu) {
			await toggleRoomStatus(room.id);
		}
	}

	function handleContextMenu(e: MouseEvent) {
		if (!$isEditMode) return;
		e.preventDefault();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		showContextMenu = true;
	}

	function closeContextMenu() {
		showContextMenu = false;
	}

	async function handleDelete() {
		if (confirm(`Raum "${room.name}" wirklich löschen?`)) {
			await supabase.from('rooms').delete().eq('id', room.id);
		}
		closeContextMenu();
	}

	$: cardStyle = `
		left: ${room.position_x}px;
		top: ${room.position_y}px;
		width: ${room.width}px;
		height: ${room.height}px;
		background: ${room.isOpen ? room.background_color : '#757575'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(60%) brightness(0.7)'};
		${!isDragging ? `transform: scale(${room.isOpen ? 1 : 0.96});` : ''}
	`;

	$: titleStyle = `
		font-size: ${room.config?.title_font_size || 42}px;
		text-align: ${room.config?.title_alignment || 'center'};
	`;

	$: textStyle = `
		font-size: ${room.config?.text_font_size || 28}px;
		text-align: ${room.config?.text_alignment || 'center'};
	`;
</script>

<svelte:window on:click={closeContextMenu} />

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:open={room.isOpen}
	class:dragging={isDragging}
	style={cardStyle}
	use:draggable={{
		disabled: !$isEditMode,
		bounds: 'parent',
		handle: '.drag-handle'
	}}
	on:neodrag:start={handleDragStart}
	on:neodrag:end={handleDragEnd}
	on:click={handleClick}
	on:contextmenu={handleContextMenu}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	in:fly={{ y: 50, duration: 600, delay: Math.random() * 200 }}
	out:fade={{ duration: 200 }}
	role="button"
	tabindex="0"
>
	<!-- Hintergrundbild -->
	{#if room.image_url}
		<img src={room.image_url} alt={room.name} class="card-bg-image" />
	{/if}

	<!-- Drag Handle (nur im Edit-Modus sichtbar) -->
	{#if $isEditMode}
		<div class="drag-handle">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
				<path
					d="M9 5h2v2H9V5zm0 4h2v2H9V9zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-12h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"
				/>
			</svg>
		</div>
	{/if}

	<!-- Inhalt -->
	<div class="card-content">
		<h2 class="room-title" style={titleStyle}>
			{room.name}
		</h2>
		{#if room.config?.activity}
			<p class="room-activity" style={textStyle}>
				{room.config.activity}
			</p>
		{/if}

		<!-- Zeitanzeige -->
		{#if room.config?.open_time && room.config?.close_time}
			<div class="time-badge">🕐 {room.config.open_time} - {room.config.close_time}</div>
		{/if}
	</div>

	<!-- Status-Badge -->
	<div class="status-badge" class:open={room.isOpen}>
		{#if room.isOpen}
			<span in:scale={{ duration: 300 }}>✓ OFFEN</span>
		{:else}
			<span in:scale={{ duration: 300 }}>🔒 GESCHLOSSEN</span>
		{/if}
	</div>

	<!-- Locked Overlay bei geschlossenen Räumen -->
	{#if !room.isOpen}
		<div class="lock-overlay" transition:fade={{ duration: 300 }}>
			<div class="lock-icon">🔒</div>
		</div>
	{/if}

	<!-- Glow-Effekt bei offenen Räumen -->
	{#if room.isOpen}
		<div class="glow-effect" transition:fade={{ duration: 500 }}></div>
	{/if}
</div>

<!-- Kontextmenü -->
{#if showContextMenu}
	<div
		class="context-menu"
		style="left: {contextMenuX}px; top: {contextMenuY}px;"
		transition:scale={{ duration: 200 }}
		on:click|stopPropagation
	>
		<button class="context-item" on:click={() => { onEdit(room); closeContextMenu(); }}>
			✏️ Bearbeiten
		</button>
		<button class="context-item danger" on:click={handleDelete}>🗑️ Löschen</button>
	</div>
{/if}

<style>
	/* Vorherige Styles bleiben gleich ... */
	.room-card {
		position: absolute;
		border-radius: 24px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		overflow: hidden;
		backdrop-filter: blur(10px);
	}

	.room-card.locked {
		pointer-events: none;
	}

	.room-card.dragging {
		opacity: 0.8;
		cursor: grabbing !important;
		z-index: 1000;
	}

	.room-card.open {
		box-shadow: 0 0 60px rgba(76, 175, 80, 0.8);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 60px rgba(76, 175, 80, 0.8);
		}
		50% {
			box-shadow: 0 0 80px rgba(76, 175, 80, 1);
		}
	}

	.card-bg-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.3;
		z-index: 0;
	}

	.drag-handle {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 8px;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 8px;
		cursor: grab;
		z-index: 10;
		transition: background 0.2s;
	}

	.drag-handle:hover {
		background: rgba(0, 0, 0, 0.8);
	}

	.card-content {
		position: relative;
		z-index: 1;
		padding: 30px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: white;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
	}

	.room-title {
		margin: 0;
		font-weight: 800;
		letter-spacing: 1px;
		line-height: 1.2;
	}

	.room-activity {
		margin: 20px 0 0 0;
		font-weight: 600;
		opacity: 0.95;
	}

	.time-badge {
		margin-top: 15px;
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		font-size: 18px;
		font-weight: 600;
		backdrop-filter: blur(10px);
	}

	.status-badge {
		position: absolute;
		top: 20px;
		left: 20px;
		padding: 10px 20px;
		border-radius: 12px;
		font-size: 18px;
		font-weight: 700;
		z-index: 5;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.status-badge.open {
		background: rgba(34, 197, 94, 0.9);
	}

	.lock-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		pointer-events: none;
	}

	.lock-icon {
		font-size: 120px;
		opacity: 0.4;
		filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.8));
	}

	.glow-effect {
		position: absolute;
		top: -10px;
		left: -10px;
		right: -10px;
		bottom: -10px;
		border-radius: 30px;
		background: radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, transparent 70%);
		z-index: -1;
		pointer-events: none;
	}

	/* Kontextmenü */
	.context-menu {
		position: fixed;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 12px;
		padding: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		z-index: 2000;
		min-width: 180px;
	}

	.context-item {
		display: block;
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: white;
		text-align: left;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.context-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.context-item.danger {
		color: #ef4444;
	}

	.context-item.danger:hover {
		background: rgba(239, 68, 68, 0.2);
	}
</style>
