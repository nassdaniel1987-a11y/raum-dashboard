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

	async function handleClick() {
		if ($isEditMode) {
			await toggleRoomStatus(room.id);
		}
	}

	async function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		
		const confirmed = await confirmDialog.ask({
			title: 'Raum löschen?',
			message: `Möchtest du den Raum "${room.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
			confirmText: 'Löschen',
			cancelText: 'Abbrechen',
			type: 'danger'
		});

		if (!confirmed) return;

		swapSelection.update(ids => ids.filter(id => id !== room.id));
		await supabase.from('rooms').delete().eq('id', room.id);
	}

	// SVELTE 5 DERIVED SYNTAX
	let roomStyle = $derived(`
		background: ${room.isOpen ? room.background_color : '#6b7280'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(40%) brightness(0.8)'};
	`);
	let displayTime = $derived(room.config?.open_time ? room.config.open_time.substring(0, 5) : '');

	// ✅ NOCH KLEINERE Schriftgrößen für kompaktere Kacheln
	let titleFontSize = $derived(room.config?.title_font_size || 16); // Reduziert von 18
	let textFontSize = $derived(room.config?.text_font_size || 12);  // Reduziert von 14
	let textColor = $derived(room.config?.text_color || '#FFFFFF'); // ✅ NEU: Textfarbe
</script>

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:open={room.isOpen}
	class:selected={isSelected}
	style={roomStyle}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	in:scale={{ duration: 300, start: 0.8 }}
	out:fade={{ duration: 200 }}
	role="button"
	tabindex="0"
>
	{#if room.image_url}
		<img src={room.image_url} alt={room.name} class="card-bg-image" />
	{/if}

	<!-- ✅ Button-Container rechts oben im Edit-Modus -->
	{#if $isEditMode}
		<div class="button-container">
			<button
				class="icon-button select-button"
				class:selected={isSelected}
				title="Für Tausch auswählen"
				onclick={(e) => { e.stopPropagation(); onSelect(room.id); }}
			>
				{isSelected ? '✓' : '⇄'}
			</button>

			<button 
				class="icon-button edit-button" 
				title="Bearbeiten" 
				onclick={(e) => { e.stopPropagation(); onEdit(room); }}
			>
				✏️
			</button>

			<button 
				class="icon-button delete-button" 
				title="Löschen" 
				onclick={handleDelete}
			>
				🗑️
			</button>
		</div>
	{/if}

	<!-- Status Badge -->
	<div class="status-badge" class:open={room.isOpen}>
		{#if room.isOpen}
			<span in:scale={{ duration: 300 }}>✓</span>
		{:else}
			<span in:scale={{ duration: 300 }}>🔒</span>
		{/if}
	</div>

	<!-- ✅ GESCHLOSSEN Banner (nur wenn KEINE Zeit) -->
	{#if !room.isOpen && !displayTime}
		<div class="closed-banner" in:scale={{ duration: 300 }}>
			GESCHLOSSEN
		</div>
	{/if}

	<!-- ✅ ÖFFNET UM Banner (mit Zeit) -->
	{#if displayTime && !room.isOpen}
		<div class="opens-banner" in:scale={{ duration: 300 }}>
			Öffnet um {displayTime}
		</div>
	{/if}

	<div
		class="card-content"
		onclick={handleClick}
	>
		<h3 class="room-title" style="font-size: {titleFontSize}px; color: {textColor};">{room.name}</h3>

		{#if room.config?.activity}
			<p class="room-activity" style="font-size: {textFontSize}px; color: {textColor};">{room.config.activity}</p>
		{/if}
	</div>

	{#if !room.isOpen}
		<div class="lock-overlay" transition:fade={{ duration: 300 }}>
			<div class="lock-icon">🔒</div>
		</div>
	{/if}
</div>

<style>
	.room-card {
		position: relative;
		border-radius: 10px; /* ✅ Reduziert von 12px */
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3); /* ✅ Reduziert */
		transition: all 0.3s ease;
		overflow: hidden;
		backdrop-filter: blur(10px);
		height: 100%;
		min-height: 100px; /* ✅ Reduziert von 120px */
		display: flex;
		flex-direction: column;
		border: 3px solid transparent;
		/* GPU-Beschleunigung */
		transform: translateZ(0);
		will-change: transform;
	}

	.room-card.selected {
		border-color: #f59e0b;
		box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); /* ✅ Reduziert */
	}

	.room-card:hover {
		transform: translateY(-2px) translateZ(0);
		box-shadow: 0 5px 14px rgba(0, 0, 0, 0.4); /* ✅ Reduziert */
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

	/* ✅ Button Container - kompakter */
	.button-container {
		position: absolute;
		top: 6px; /* ✅ Reduziert von 8px */
		right: 6px;
		z-index: 10;
		display: flex;
		gap: 4px; /* ✅ Reduziert von 6px */
	}

	.icon-button {
		padding: 5px 8px; /* ✅ Reduziert von 6px 10px */
		background: rgba(0, 0, 0, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px; /* ✅ Reduziert von 8px */
		font-size: 14px; /* ✅ Reduziert von 16px */
		cursor: pointer;
		transition: all 0.2s;
		color: white;
		font-weight: bold;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px; /* ✅ Reduziert von 36px */
		min-height: 32px;
		/* Touch-optimiert */
		touch-action: manipulation;
	}

	.icon-button:hover {
		background: rgba(0, 0, 0, 1);
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.icon-button:active {
		transform: scale(0.95);
	}

	.select-button {
		background: rgba(59, 130, 246, 0.8);
		border-color: rgba(59, 130, 246, 0.5);
	}
	.select-button:hover {
		background: rgba(59, 130, 246, 1);
		border-color: rgba(59, 130, 246, 0.8);
	}
	.select-button.selected {
		background: rgba(245, 158, 11, 0.9);
		border-color: rgba(245, 158, 11, 0.8);
	}

	.edit-button {
		background: rgba(34, 197, 94, 0.8);
		border-color: rgba(34, 197, 94, 0.5);
	}
	.edit-button:hover {
		background: rgba(34, 197, 94, 1);
		border-color: rgba(34, 197, 94, 0.8);
	}

	.delete-button {
		background: rgba(239, 68, 68, 0.8);
		border-color: rgba(239, 68, 68, 0.5);
	}
	.delete-button:hover {
		background: rgba(239, 68, 68, 1);
		border-color: rgba(239, 68, 68, 0.8);
	}

	.card-content {
		position: relative;
		z-index: 1;
		padding: 8px; /* ✅ Reduziert von 10px */
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
		margin: 0 0 4px 0; /* ✅ Reduziert von 6px */
		font-weight: 700;
		letter-spacing: 0.3px;
		line-height: 1.2;
		width: 100%;
		padding-top: 2px;
		flex-shrink: 0;
		/* Verhindert Overflow */
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.room-activity {
		margin: auto 0;
		font-weight: 600;
		opacity: 1;
		width: 100%;
		padding: 4px 3px; /* ✅ Reduziert von 6px 4px */
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
		line-height: 1.2; /* ✅ Reduziert von 1.3 */
		/* Verhindert Overflow */
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.status-badge {
		position: absolute;
		top: 6px; /* ✅ Reduziert von 8px */
		left: 6px;
		padding: 3px 6px; /* ✅ Reduziert von 4px 8px */
		border-radius: 5px; /* ✅ Reduziert von 6px */
		font-size: 10px; /* ✅ Reduziert von 11px */
		font-weight: 700;
		z-index: 5;
		background: var(--color-closed-badge);
		color: white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.status-badge.open {
		background: var(--color-open-badge);
	}

	/* ✅ GESCHLOSSEN Banner - Horizontales Banner am unteren Rand */
	.closed-banner {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 8px 12px;
		background: linear-gradient(to top, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.95) 100%);
		color: white;
		font-size: 13px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		text-align: center;
		z-index: 5;
		border-top: 2px solid rgba(255, 255, 255, 0.3);
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(3px);
		pointer-events: none;
	}

	/* ✅ ÖFFNET UM Banner - Horizontales Banner am unteren Rand */
	.opens-banner {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 8px 12px;
		background: linear-gradient(to top, rgba(37, 99, 235, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%);
		color: white;
		font-size: 13px;
		font-weight: 700;
		text-align: center;
		z-index: 5;
		border-top: 2px solid rgba(255, 255, 255, 0.3);
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(3px);
		pointer-events: none;
		letter-spacing: 0.5px;
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
		border-radius: 10px;
	}

	.lock-icon {
		font-size: 28px; /* ✅ Reduziert von 32px */
		opacity: 0.5;
		filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.8));
	}

	/* ✅ Große Displays: Noch kleinere Kacheln */
	@media (min-width: 1600px) {
		.room-card {
			min-height: 90px;
		}
		
		.icon-button {
			min-width: 30px;
			min-height: 30px;
			padding: 4px 7px;
			font-size: 13px;
		}
	}

	@media (max-width: 768px) {
		.room-card {
			min-height: 100px;
		}

		.icon-button {
			min-width: 30px;
			min-height: 30px;
			padding: 4px 7px;
			font-size: 13px;
		}
	}
</style>