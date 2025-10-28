<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, swapSelection, swapRoomPositions, visibleRooms } from '$lib/stores/appState';
	import { fade, slide, scale } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	// Svelte 5 Props Syntax
	let { onOpenScheduler, onOpenSettings, canvasRef } = $props<{
		onOpenScheduler: () => void;
		onOpenSettings: () => void;
		canvasRef?: any;
	}>();

	// Svelte 5 State Syntax
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');
	let showCreateForm = $state(false);
	let menuOpen = $state(false);
	let showScrollSettings = $state(false);

	let scrollPreset = $state('normal');
	let autoScrollActive = $state(false);

	const scrollPresets = {
		langsam: { speed: 0.3, pause: 100, label: '🐌 Langsam' },
		normal: { speed: 0.5, pause: 60, label: '▶️ Normal' },
		schnell: { speed: 0.8, pause: 40, label: '⚡ Schnell' }
	};

	onMount(() => {
		scrollPreset = localStorage.getItem('scrollPreset') || 'normal';
		const savedAutoScroll = localStorage.getItem('autoScrollEnabled');
		if (savedAutoScroll !== null) {
			autoScrollActive = savedAutoScroll === 'true';
		}
	});

	async function handleCreateRoom() {
		if (!newRoomName.trim()) {
			alert('Bitte gib einen Raum-Namen ein!');
			return;
		}

		await createNewRoom(newRoomName.trim(), newRoomFloor);
		newRoomName = '';
		showCreateForm = false;
	}

	function handleSwap() {
		const selected = get(swapSelection);
		if (selected.length !== 2) {
			alert('Bitte wähle genau 2 Räume zum Tauschen aus!');
			return;
		}

		const rooms = get(visibleRooms);
		const room1 = rooms.find(r => r.id === selected[0]);
		const room2 = rooms.find(r => r.id === selected[1]);
		if (room1 && room2) {
			if (room1.floor !== room2.floor) {
				alert('Räume müssen im selben Stockwerk sein!');
				return;
			}
			swapRoomPositions(room1, room2);
			swapSelection.set([]);
		}
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function setScrollPreset(preset: keyof typeof scrollPresets) {
		scrollPreset = preset;
		localStorage.setItem('scrollPreset', preset);
		const settings = scrollPresets[preset];
		if (canvasRef?.setScrollSpeed) {
			canvasRef.setScrollSpeed(settings.speed, settings.pause);
		}
	}

	function toggleAutoScroll() {
		if (canvasRef?.toggleAutoScroll) {
			autoScrollActive = canvasRef.toggleAutoScroll();
		}
	}
</script>

<button 
	class="fab"
	class:active={menuOpen}
	onclick={toggleMenu}
	transition:scale={{ duration: 300, easing: cubicOut }}
	aria-label="Menü öffnen"
>
	{#if menuOpen}
		<span class="fab-icon">✕</span>
	{:else}
		<span class="fab-icon">☰</span>
	{/if}
</button>

{#if menuOpen}
	<div class="menu-panel" transition:slide={{ duration: 300, axis: 'y' }}>
		<div class="menu-content">
			<button
				class="menu-item mode-toggle"
				class:active={$isEditMode}
				onclick={() => isEditMode.update(v => !v)}
			>
				{#if $isEditMode}
					<span class="icon">🔓</span>
					<span class="label">Bearbeitungs-Modus aktiv</span>
				{:else}
					<span class="icon">🔒</span>
					<span class="label">Ansicht-Modus</span>
				{/if}
			</button>

			<button
				class="menu-item"
				onclick={() => showScrollSettings = !showScrollSettings}
			>
				<span class="icon">↕️</span>
				<span class="label">Scroll-Einstellungen</span>
			</button>

			{#if showScrollSettings}
				<div class="scroll-settings" transition:slide={{ duration: 200 }}>
					<div class="setting-group">
						<label class="setting-label">Geschwindigkeit:</label>
						<div class="preset-buttons">
							{#each Object.entries(scrollPresets) as [key, preset]}
								<button
									class="preset-btn"
									class:active={scrollPreset === key}
									onclick={() => setScrollPreset(key as keyof typeof scrollPresets)}
								>
									{preset.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="setting-group">
						<button
							class="toggle-btn"
							class:active={autoScrollActive}
							onclick={toggleAutoScroll}
						>
							<span class="icon">{autoScrollActive ? '⏸️' : '▶️'}</span>
							<span class="label">{autoScrollActive ? 'Auto-Scroll pausieren' : 'Auto-Scroll starten'}</span>
						</button>
					</div>
				</div>
			{/if}

			{#if $isEditMode}
				<div class="edit-section" transition:slide={{ duration: 200 }}>
					<button class="menu-item" onclick={() => showCreateForm = !showCreateForm}>
						<span class="icon">➕</span>
						<span class="label">Raum erstellen</span>
					</button>

					<button class="menu-item" onclick={bulkOpenAllRooms}>
						<span class="icon">✅</span>
						<span class="label">Alle öffnen</span>
					</button>

					<button class="menu-item" onclick={bulkCloseAllRooms}>
						<span class="icon">🔒</span>
						<span class="label">Alle schließen</span>
					</button>

					<button
						class="menu-item swap-item"
						class:active={$swapSelection.length > 0}
						onclick={handleSwap}
						disabled={$swapSelection.length !== 2}
					>
						<span class="icon">⮀</span>
						<span class="label">Tauschen ({$swapSelection.length}/2)</span>
					</button>

					<button class="menu-item" onclick={onOpenScheduler}>
						<span class="icon">📅</span>
						<span class="label">Tagesplan</span>
					</button>

					<button class="menu-item" onclick={onOpenSettings}>
						<span class="icon">⚙️</span>
						<span class="label">Einstellungen</span>
					</button>
				</div>
			{/if}

			{#if showCreateForm && $isEditMode}
				<div class="create-form" transition:slide={{ duration: 200 }}>
					<input
						type="text"
						bind:value={newRoomName}
						placeholder="Raum-Name..."
						onkeydown={(e) => e.key === 'Enter' && handleCreateRoom()}
					/>
					<select bind:value={newRoomFloor}>
						<option value="extern">🏃 Außenbereich</option>
						<option value="dach">🏠 Dachgeschoss</option>
						<option value="og2">2️⃣ 2. OG</option>
						<option value="og1">1️⃣ 1. OG</option>
						<option value="eg">🚪 Erdgeschoss</option>
						<option value="ug">⬇️ Untergeschoss</option>
					</select>
					<div class="form-actions">
						<button class="create-btn" onclick={handleCreateRoom}>Erstellen</button>
						<button class="cancel-btn" onclick={() => showCreateForm = false}>Abbrechen</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ✅ KRITISCH: FAB mit sicherer Positionierung - IMMER sichtbar */
	.fab {
		position: fixed;
		/* ✅ Abstand vom unteren Rand - auch im Vollbild */
		bottom: 20px;
		right: 20px;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		border: none;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5),
					0 0 40px rgba(59, 130, 246, 0.4);
		cursor: pointer;
		z-index: 9999; /* ✅ Höchste z-index Priorität */
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		/* GPU-Beschleunigung */
		transform: translateZ(0);
		will-change: transform;
		/* Touch-optimiert */
		touch-action: manipulation;
	}

	.fab:hover {
		transform: scale(1.1) rotate(90deg) translateZ(0);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6),
					0 0 60px rgba(59, 130, 246, 0.6);
	}

	.fab:active {
		transform: scale(1.05) translateZ(0);
	}

	.fab.active {
		transform: rotate(180deg) translateZ(0);
		background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
	}

	.fab-icon {
		font-size: 26px;
		color: white;
		font-weight: bold;
	}

	/* Menu Panel */
	.menu-panel {
		position: fixed;
		/* ✅ Über dem FAB, aber nicht zu hoch */
		bottom: 100px;
		right: 20px;
		width: 320px;
		max-height: calc(100vh - 140px); /* ✅ Lässt Platz für FAB */
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 20px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
		z-index: 9998;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.menu-content {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	/* Menu Items */
	.menu-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		color: var(--color-text-primary);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		text-align: left;
		width: 100%;
	}

	.menu-item:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		transform: translateX(-4px);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.menu-item:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.menu-item .icon {
		font-size: 20px;
		min-width: 28px;
		text-align: center;
	}

	.menu-item .label {
		flex: 1;
		font-size: 13px;
	}

	.mode-toggle.active {
		background: rgba(34, 197, 94, 0.25);
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
	}

	.swap-item.active {
		background: rgba(245, 158, 11, 0.25);
		border-color: rgba(245, 158, 11, 0.5);
	}

	/* Scroll Settings */
	.scroll-settings {
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		padding: 12px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.setting-label {
		color: var(--color-text-secondary);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.preset-buttons {
		display: flex;
		gap: 6px;
	}

	.preset-btn {
		flex: 1;
		padding: 8px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		color: var(--color-text-primary);
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.preset-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.preset-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: var(--color-text-primary);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.toggle-btn.active {
		background: rgba(245, 158, 11, 0.25);
		border-color: rgba(245, 158, 11, 0.5);
	}

	/* Edit Section */
	.edit-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		padding-top: 10px;
		margin-top: 6px;
	}

	/* Create Form */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
	}

	.create-form input,
	.create-form select {
		padding: 10px 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
		font-size: 14px;
		width: 100%;
	}

	.create-form input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.create-form select option {
		background: var(--color-primary);
		color: var(--color-text-primary);
	}

	.form-actions {
		display: flex;
		gap: 8px;
	}

	.create-btn,
	.cancel-btn {
		flex: 1;
		padding: 10px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.3s;
		border: none;
	}

	.create-btn {
		background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
		color: white;
	}

	.create-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}

	.cancel-btn {
		background: rgba(239, 68, 68, 0.2);
		color: white;
		border: 2px solid rgba(239, 68, 68, 0.5);
	}

	.cancel-btn:hover {
		background: rgba(239, 68, 68, 0.4);
	}

	/* Scrollbar */
	.menu-panel::-webkit-scrollbar {
		width: 6px;
	}

	.menu-panel::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
	}

	.menu-panel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 3px;
	}

	.menu-panel::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* ✅ Mobile & Tablet Optimierungen */
	@media (max-width: 768px) {
		.fab {
			width: 56px;
			height: 56px;
			bottom: 16px;
			right: 16px;
		}

		.fab-icon {
			font-size: 22px;
		}

		.menu-panel {
			right: 16px;
			bottom: 80px;
			width: calc(100vw - 32px);
			max-width: 320px;
		}
	}

	/* ✅ iPad Touch-Optimierung */
	@media (hover: none) and (pointer: coarse) {
		.fab {
			width: 68px;
			height: 68px;
			/* Größerer Touch-Target */
		}

		.menu-item,
		.preset-btn,
		.toggle-btn {
			min-height: 44px;
			/* iOS empfohlene Touch-Größe */
		}
	}
</style>