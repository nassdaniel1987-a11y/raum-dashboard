<script lang="ts">
	import { fly, scale, fade } from 'svelte/transition';
	import { isEditMode, toggleRoomStatus } from '$lib/stores/appState';
	import { supabase } from '$lib/supabase/client';
	import type { RoomWithConfig } from '$lib/types';

	export let room: RoomWithConfig;
	export let onEdit: (room: RoomWithConfig) => void;

	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;

	async function handleClick() {
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

	$: roomStyle = `
		background: ${room.isOpen ? room.background_color : '#6b7280'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(40%) brightness(0.8)'};
	`;
</script>

<svelte:window on:click={closeContextMenu} />

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:open={room.isOpen}
	style={roomStyle}
	on:click={handleClick}
	on:contextmenu={handleContextMenu}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	in:scale={{ duration: 300, start: 0.8 }}
	out:fade={{ duration: 200 }}
	role="button"
	tabindex="0"
>
	{#if room.image_url}
		<img src={room.image_url} alt={room.name} class="card-bg-image" />
	{/if}

	{#if $isEditMode}
		<button class="edit-button" on:click|stopPropagation={() => onEdit(room)}>
			✏️
		</button>
	{/if}

	<div class="card-content">
		<h3 class="room-title">{room.name}</h3>
		
		{#if room.config?.activity}
			<p class="room-activity">{room.config.activity}</p>
		{/if}

		{#if room.config?.open_time && room.config?.close_time}
			<div class="time-badge">
				🕐 {room.config.open_time}-{room.config.close_time}
			</div>
		{/if}
	</div>

	<div class="status-badge" class:open={room.isOpen}>
		{#if room.isOpen}
			<span in:scale={{ duration: 300 }}>✓</span>
		{:else}
			<span in:scale={{ duration: 300 }}>🔒</span>
		{/if}
	</div>

	{#if !room.isOpen}
		<div class="lock-overlay" transition:fade={{ duration: 300 }}>
			<div class="lock-icon">🔒</div>
		</div>
	{/if}

	{#if room.isOpen}
		<div class="glow-effect" transition:fade={{ duration: 500 }}></div>
	{/if}
</div>

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
		<button class="context-item danger" on:click={handleDelete}>
			🗑️ Löschen
		</button>
	</div>
{/if}

<style>
	.room-card {
		position: relative;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: all 0.3s ease;
		cursor: pointer;
		overflow: hidden;
		backdrop-filter: blur(10px);
		height: 100%;
		min-height: 120px;
		display: flex;
		flex-direction: column;
	}

	.room-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	.room-card.locked {
		pointer-events: none;
	}

	.room-card.open {
		box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
		/* Pulsieren entfernt! */
	}

	.card-bg-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.2;
		z-index: 0;
	}

	.edit-button {
		position: absolute;
		top: 6px;
		right: 6px;
		padding: 4px 8px;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		z-index: 10;
		transition: all 0.2s;
	}

	.edit-button:hover {
		background: rgba(0, 0, 0, 0.9);
		transform: scale(1.1);
	}

	.card-content {
		position: relative;
		z-index: 1;
		padding: 12px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start; /* Oben statt center! */
		align-items: center;
		color: white;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
		text-align: center;
	}

	.room-title {
		margin: 0 0 8px 0; /* Abstand nach unten */
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.3px;
		line-height: 1.2;
		width: 100%;
		padding-top: 4px; /* Etwas Abstand vom Rand */
	}

	.room-activity {
		margin: 0;
		font-size: 28px; /* Größer! */
		font-weight: 600;
		opacity: 1;
		flex-grow: 1; /* Nimmt verfügbaren Platz */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.time-badge {
		margin-top: auto; /* Ganz unten */
		padding: 3px 8px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		backdrop-filter: blur(10px);
	}

	.status-badge {
		position: absolute;
		top: 6px;
		left: 6px;
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 700;
		z-index: 5;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		pointer-events: none;
	}

	.lock-icon {
		font-size: 40px;
		opacity: 0.5;
		filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.8));
	}

	.glow-effect {
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		border-radius: 15px;
		background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, transparent 70%);
		z-index: -1;
		pointer-events: none;
		/* Pulsieren entfernt! */
	}

	.context-menu {
		position: fixed;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 10px;
		padding: 6px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		z-index: 2000;
		min-width: 140px;
	}

	.context-item {
		display: block;
		width: 100%;
		padding: 8px 12px;
		background: transparent;
		border: none;
		color: white;
		text-align: left;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 6px;
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
