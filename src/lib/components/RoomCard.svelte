<script lang="ts">
	import { fly, scale, fade } from 'svelte/transition';
	import { isEditMode, toggleRoomStatus, swapSelection } from '$lib/stores/appState';
	import { supabase } from '$lib/supabase/client';
	import type { RoomWithConfig } from '$lib/types';

	export let room: RoomWithConfig;
	export let onEdit: (room: RoomWithConfig) => void;
	export let onSelect: (roomId: string) => void; 
	export let isSelected: boolean = false; 

	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;
	async function handleClick() {
		// Diese Funktion wird jetzt vom card-content aufgerufen
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
			swapSelection.update(ids => ids.filter(id => id !== room.id));
			await supabase.from('rooms').delete().eq('id', room.id);
		}
		closeContextMenu();
	}

	$: roomStyle = `
		background: ${room.isOpen ? room.background_color : '#6b7280'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(40%) brightness(0.8)'};
	`;
	// Zeit ohne Sekunden (10:00:00 → 10:00)
	$: displayTime = room.config?.open_time ? room.config.open_time.substring(0, 5) : '';
</script>

<svelte:window on:click={closeContextMenu} />

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:open={room.isOpen}
	class:selected={isSelected} 
	style={roomStyle}
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

	<div class="button-container">
		{#if $isEditMode}
			<button 
				class="select-button"
				class:selected={isSelected}
				title="Für Tausch auswählen"
				on:click|stopPropagation={() => onSelect(room.id)}
			>
				{isSelected ? '✓' : '⮀'}
			</button>
			
			<button class="edit-button" title="Bearbeiten" on:click|stopPropagation={() => onEdit(room)}>
				✏️
			</button>
		{/if}
	</div>

	<div class="status-badge" class:open={room.isOpen}>
		{#if room.isOpen}
			<span in:scale={{ duration: 300 }}>✓</span>
		{:else}
			<span in:scale={{ duration: 300 }}>🔒</span>
		{/if}
	</div>

	{#if displayTime}
		<div class="time-badge-top">
			🕐 Öffnet um {displayTime}
		</div>
	{/if}

	<div 
		class="card-content"
		on:click={handleClick} >
		<h3 class="room-title">{room.name}</h3>
		
		{#if room.config?.activity}
			<p class="room-activity">{room.config.activity}</p>
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
		/* cursor: pointer; ENTFERNT VON HIER */
		overflow: hidden;
		backdrop-filter: blur(10px);
		height: 100%;
		min-height: 120px;
		display: flex;
		flex-direction: column;
		/* NEU: Rand für Auswahl */
		border: 3px solid transparent;
	}

	/* NEU: Styling für ausgewählte Karte */
	.room-card.selected {
		border-color: #f59e0b; /* Orange-Gelb */
		box-shadow: 0 0 25px rgba(245, 158, 11, 0.7);
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
	}

	/* NEU: Styling für ausgewählte Karte (wenn offen) */
	.room-card.open.selected {
		border-color: #f59e0b;
		/* Kombiniert beide Schatten */
		box-shadow: 0 0 15px rgba(76, 175, 80, 0.5), 0 0 25px rgba(245, 158, 11, 0.7);
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

	/* NEU: Container für die Buttons */
	.button-container {
		position: absolute;
		top: 6px;
		right: 6px;
		z-index: 10;
		display: flex;
		gap: 6px;
	}

	.edit-button,
	.select-button {
		padding: 4px 8px;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		color: white; /* Farbe explizit setzen */
	}

	.edit-button:hover,
	.select-button:hover {
		background: rgba(0, 0, 0, 0.9);
		transform: scale(1.1);
	}

	/* NEU: Styling für Select Button */
	.select-button {
		background: rgba(59, 130, 246, 0.7); /* Blau */
	}
	.select-button:hover {
		background: rgba(59, 130, 246, 1);
	}
	.select-button.selected {
		background: rgba(245, 158, 11, 0.9); /* Orange-Gelb */
	}
	.select-button.selected:hover {
		background: rgba(245, 158, 11, 1);
	}


	.card-content {
		position: relative;
		z-index: 1;
		padding: 12px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		color: white;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
		text-align: center;
		cursor: pointer; /* HINZUGEFÜGT HIER */
	}

	.room-title {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.3px;
		line-height: 1.2;
		width: 100%;
		padding-top: 4px;
	}

	.room-activity {
		margin: 0;
		font-size: 28px;
		font-weight: 600;
		opacity: 1;
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.time-badge-top {
		position: absolute;
		top: 35px;
		left: 50%;
		transform: translateX(-50%);
		padding: 8px 16px;
		background: rgba(251, 146, 60, 0.95);
		border: 2px solid rgba(249, 115, 22, 1);
		border-radius: 12px;
		font-size: 14px;
		font-weight: 700;
		color: white;
		z-index: 6;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(10px);
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
		white-space: nowrap;
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