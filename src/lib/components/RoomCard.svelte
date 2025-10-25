<script lang="ts">
	import { fly, scale, fade } from 'svelte/transition';
	import { isEditMode, toggleRoomStatus, swapSelection } from '$lib/stores/appState';
	import { confirmDialog } from '$lib/stores/toastStore';
	import { supabase } from '$lib/supabase/client';
	import type { RoomWithConfig } from '$lib/types';

	// Svelte 5 Props Syntax
	let { room, onEdit, onSelect, isSelected = false } = $props<{
		room: RoomWithConfig;
		onEdit: (room: RoomWithConfig) => void;
		onSelect: (roomId: string) => void;
		isSelected?: boolean;
	}>();

	// SVELTE 5 STATE SYNTAX
	let showContextMenu = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);

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
		const confirmed = await confirmDialog.ask({
			title: 'Raum löschen?',
			message: `Möchtest du den Raum "${room.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
			confirmText: 'Löschen',
			cancelText: 'Abbrechen',
			type: 'danger'
		});

		if (!confirmed) {
			closeContextMenu();
			return;
		}

		swapSelection.update(ids => ids.filter(id => id !== room.id));
		await supabase.from('rooms').delete().eq('id', room.id);
		closeContextMenu();
	}

	// SVELTE 5 DERIVED SYNTAX
	let roomStyle = $derived(`
		background: ${room.isOpen ? room.background_color : '#6b7280'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(40%) brightness(0.8)'};
	`);
	let displayTime = $derived(room.config?.open_time ? room.config.open_time.substring(0, 5) : '');
</script>

<svelte:window onclick={closeContextMenu} />

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:open={room.isOpen}
	class:selected={isSelected}
	style={roomStyle}
	oncontextmenu={handleContextMenu}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
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
				onclick={(e) => { e.stopPropagation(); onSelect(room.id); }}
			>
				{isSelected ? '✓' : '⇄'}
			</button>

			<button class="edit-button" title="Bearbeiten" onclick={(e) => { e.stopPropagation(); onEdit(room); }}>
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

	{#if displayTime && !room.isOpen}
		<div class="time-badge-top">
			🕐 Öffnet um {displayTime}
		</div>
	{/if}

	<div
		class="card-content"
		onclick={handleClick}
	>
		<h3 class="room-title">{room.name}</h3>

		{#if room.config?.activity}
			<!-- GEÄNDERT: Jetzt mit white-space: pre-wrap für Zeilenumbrüche -->
			<p class="room-activity">{room.config.activity}</p>
		{/if}
	</div>

	{#if !room.isOpen}
		<div class="lock-overlay" transition:fade={{ duration: 300 }}>
			<div class="lock-icon">🔒</div>
		</div>
	{/if}
</div>

{#if showContextMenu}
	<div
		class="context-menu"
		style="left: {contextMenuX}px; top: {contextMenuY}px;"
		transition:scale={{ duration: 200 }}
		onclick={(e) => e.stopPropagation()}
		role="menu"
	>
		<button class="context-item" onclick={() => { onEdit(room); closeContextMenu(); }} role="menuitem">
			✏️ Bearbeiten
		</button>
		<button class="context-item danger" onclick={handleDelete} role="menuitem">
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
		overflow: hidden;
		backdrop-filter: blur(10px);
		height: 100%;
		min-height: 140px; /* Mindesthöhe für Räume ohne viel Text */
		display: flex;
		flex-direction: column;
		border: 3px solid transparent;
	}

	.room-card.selected {
		border-color: #f59e0b;
		box-shadow: 0 0 25px rgba(245, 158, 11, 0.7);
	}

	.room-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	.room-card.open {
		/* Kein extra Glow mehr - nur einfarbige Kachel */
	}

	.room-card.open.selected {
		border-color: #f59e0b;
		box-shadow: 0 0 25px rgba(245, 158, 11, 0.7);
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
		font-size: 16px;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
		font-weight: bold;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		min-height: 28px;
	}

	.edit-button:hover,
	.select-button:hover {
		background: rgba(0, 0, 0, 0.9);
		transform: scale(1.1);
	}

	.select-button {
		background: rgba(59, 130, 246, 0.7);
	}
	.select-button:hover {
		background: rgba(59, 130, 246, 1);
	}
	.select-button.selected {
		background: rgba(245, 158, 11, 0.9);
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
		cursor: pointer;
		flex-grow: 1;
	}

	.room-title {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.3px;
		line-height: 1.2;
		width: 100%;
		padding-top: 4px;
		flex-shrink: 0;
	}

	.room-activity {
		margin: auto 0;
		font-size: 20px; /* Gute Lesbarkeit */
		font-weight: 600;
		opacity: 1;
		width: 100%;
		padding: 8px 4px;
		
		/* Ermöglicht mehrzeilige Anzeige */
		white-space: pre-wrap; /* Erhält Zeilenumbrüche aus dem Text */
		word-wrap: break-word; /* Bricht lange Wörter um */
		overflow-wrap: break-word;
		line-height: 1.4; /* Guter Zeilenabstand */
		
		/* KEIN SCROLLEN - Text wird komplett angezeigt */
		/* Die Kachel passt sich automatisch der Textlänge an */
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
		background: var(--color-closed-badge);
		color: white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.status-badge.open {
		background: var(--color-open-badge);
	}

	.time-badge-top {
		position: absolute;
		top: 35px;
		left: 50%;
		transform: translateX(-50%);
		padding: 8px 16px;
		background: var(--color-time-badge);
		border: 2px solid var(--color-accent);
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
		border-radius: 12px;
	}

	.lock-icon {
		font-size: 40px;
		opacity: 0.5;
		filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.8));
	}

	.context-menu {
		position: fixed;
		background: var(--card-bg);
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

	/* RESPONSIVE: Kleinere Schrift auf Mobile */
	@media (max-width: 768px) {
		.room-activity {
			font-size: 16px;
		}
		
		.room-card {
			min-height: 120px;
		}
	}
</style>