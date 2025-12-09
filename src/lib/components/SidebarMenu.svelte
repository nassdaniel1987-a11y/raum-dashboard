<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, swapSelection, swapRoomPositions, visibleRooms, viewWeekday, copyDayConfigs, deleteDayConfigs, cardTheme, appSettings, userTheme } from '$lib/stores/appState';
	import { getAllThemes } from '$lib/cardThemes';
	import { themes as uiThemes, applyTheme } from '$lib/themes';
	import { toasts } from '$lib/stores/toastStore';
	import { supabase } from '$lib/supabase/client';
	import { fade, slide } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
	const allCardThemes = getAllThemes();
	const allUIThemes = Object.values(uiThemes);

	// Props
	let { isOpen = false, onClose, onOpenScheduler, canvasRef } = $props<{
		isOpen?: boolean;
		onClose: () => void;
		onOpenScheduler: () => void;
		canvasRef?: any;
	}>();

	// State
	let activeTab = $state<'control' | 'planning' | 'view' | 'advanced'>('control');
	let autoScrollActive = $state(false);
	let scrollSpeed = $state(0.6);
	let pauseDuration = $state(4);
	let displayScaleX = $state(1.0);
	let cardWidth = $state(1.0);
	let cardHeight = $state(1.0);
	let isFullscreen = $state(false);
	let copiedDay = $state<number | null>(null);
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');
	let showCreateForm = $state(false);

	// Nachtruhe-Modus State
	let nightModeEnabled = $state($appSettings?.night_mode_enabled ?? true);
	let nightStart = $state($appSettings?.night_start || '17:00');
	let nightEnd = $state($appSettings?.night_end || '07:00');

	// UI-Theme State
	let currentUITheme = $state($userTheme);

	onMount(() => {
		// Lade gespeicherte Werte
		const savedSpeed = localStorage.getItem('scrollSpeed');
		const savedPause = localStorage.getItem('pauseDuration');
		const savedScaleX = localStorage.getItem('displayScaleX');
		const savedCardWidth = localStorage.getItem('cardWidth');
		const savedCardHeight = localStorage.getItem('cardHeight');

		if (savedSpeed) scrollSpeed = parseFloat(savedSpeed);
		if (savedPause) pauseDuration = parseInt(savedPause);
		if (savedScaleX) {
			displayScaleX = parseFloat(savedScaleX);
			applyDisplayScale(displayScaleX);
		}
		if (savedCardWidth) {
			cardWidth = parseFloat(savedCardWidth);
			applyCardSize();
		}
		if (savedCardHeight) {
			cardHeight = parseFloat(savedCardHeight);
			applyCardSize();
		}

		// Vollbild-Status überwachen
		const handleFullscreenChange = () => {
			isFullscreen = !!(
				document.fullscreenElement ||
				(document as any).webkitFullscreenElement ||
				(document as any).mozFullScreenElement ||
				(document as any).msFullscreenElement
			);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.addEventListener('mozfullscreenchange', handleFullscreenChange);
		document.addEventListener('MSFullscreenChange', handleFullscreenChange);

		handleFullscreenChange();

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
		};
	});

	async function toggleFullscreen() {
		if (!isFullscreen) {
			try {
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen();
				} else if ((document.documentElement as any).webkitRequestFullscreen) {
					await (document.documentElement as any).webkitRequestFullscreen();
				} else if ((document.documentElement as any).mozRequestFullScreen) {
					await (document.documentElement as any).mozRequestFullScreen();
				} else if ((document.documentElement as any).msRequestFullscreen) {
					await (document.documentElement as any).msRequestFullscreen();
				}
			} catch (err) {
				console.error('Vollbild konnte nicht aktiviert werden:', err);
			}
		} else {
			try {
				if (document.exitFullscreen) {
					await document.exitFullscreen();
				} else if ((document as any).webkitExitFullscreen) {
					await (document as any).webkitExitFullscreen();
				} else if ((document as any).mozCancelFullScreen) {
					await (document as any).mozCancelFullScreen();
				} else if ((document as any).msExitFullscreen) {
					await (document as any).msExitFullscreen();
				}
			} catch (err) {
				console.error('Vollbild konnte nicht verlassen werden:', err);
			}
		}
	}

	function toggleAutoScroll() {
		if (canvasRef?.toggleAutoScroll) {
			autoScrollActive = canvasRef.toggleAutoScroll();
		}
	}

	function updateScrollSettings() {
		localStorage.setItem('scrollSpeed', scrollSpeed.toString());
		localStorage.setItem('pauseDuration', pauseDuration.toString());
		if (canvasRef?.setScrollSpeed) {
			canvasRef.setScrollSpeed(scrollSpeed, pauseDuration);
		}
	}

	function applyDisplayScale(scale: number) {
		document.documentElement.style.setProperty('--card-scale-x', scale.toString());
	}

	function updateDisplayScale() {
		localStorage.setItem('displayScaleX', displayScaleX.toString());
		applyDisplayScale(displayScaleX);
	}

	function applyCardSize() {
		document.documentElement.style.setProperty('--card-width-scale', cardWidth.toString());
		document.documentElement.style.setProperty('--card-height-scale', cardHeight.toString());
	}

	function updateCardWidth() {
		localStorage.setItem('cardWidth', cardWidth.toString());
		applyCardSize();
	}

	function updateCardHeight() {
		localStorage.setItem('cardHeight', cardHeight.toString());
		applyCardSize();
	}

	function selectCardTheme(themeName: string) {
		cardTheme.set(themeName);
	}

	function selectUITheme(themeId: string) {
		currentUITheme = themeId;
		userTheme.set(themeId);
		applyTheme(themeId);
	}

	function copyCurrentDay() {
		copiedDay = get(viewWeekday);
		toasts.show(`📋 ${weekdayNames[copiedDay]} kopiert!`, 'success');
	}

	async function pasteToCurrentDay() {
		if (copiedDay === null) {
			toasts.show('⚠️ Kein Tag kopiert!', 'error');
			return;
		}

		const currentDay = get(viewWeekday);
		if (copiedDay === currentDay) {
			toasts.show('⚠️ Quell- und Ziel-Tag sind identisch!', 'error');
			return;
		}

		const confirmText = `${weekdayNames[copiedDay]} nach ${weekdayNames[currentDay]} kopieren?\n\nAlle Raumkonfigurationen werden überschrieben!`;
		if (!confirm(confirmText)) return;

		try {
			const count = await copyDayConfigs(copiedDay, currentDay);
			toasts.show(`✓ ${count} Konfigurationen eingefügt!`, 'success');
		} catch (error) {
			console.error('Error pasting day:', error);
			toasts.show('✕ Fehler beim Einfügen!', 'error');
		}
	}

	async function deleteCurrentDay() {
		const currentDay = get(viewWeekday);
		const confirmText = `ALLE Raumkonfigurationen für ${weekdayNames[currentDay]} löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`;

		if (!confirm(confirmText)) return;

		try {
			const count = await deleteDayConfigs(currentDay);
			toasts.show(`🗑️ ${count} Konfigurationen gelöscht!`, 'success');
		} catch (error) {
			console.error('Error deleting day:', error);
			toasts.show('✕ Fehler beim Löschen!', 'error');
		}
	}

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

	async function saveNightModeSettings() {
		try {
			await supabase
				.from('app_settings')
				.update({
					night_mode_enabled: nightModeEnabled,
					night_start: nightStart,
					night_end: nightEnd
				})
				.eq('id', 1);

			toasts.show('✓ Nachtruhe-Einstellungen gespeichert!', 'success');
		} catch (error) {
			console.error('Error saving night mode settings:', error);
			toasts.show('✕ Fehler beim Speichern!', 'error');
		}
	}
</script>

{#if isOpen}
	<!-- Overlay -->
	<div class="overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="-1" transition:fade={{ duration: 200 }}></div>

	<!-- Admin Modal -->
	<div class="admin-modal" transition:fade={{ duration: 200 }}>
		<div class="modal-header">
			<h2>Admin</h2>
			<button class="close-btn" onclick={onClose} aria-label="Schließen">✕</button>
		</div>

		<div class="modal-content">
			<!-- Schnellaktionen -->
			<section class="section">
				<h3>Schnellaktionen</h3>
				<div class="action-grid">
					<button class="action-card" class:active={$isEditMode} onclick={() => isEditMode.update(v => !v)}>
						<div class="card-label">Edit-Modus</div>
						<div class="card-value">{$isEditMode ? 'An' : 'Aus'}</div>
					</button>
					<button class="action-card" class:active={autoScrollActive} onclick={toggleAutoScroll}>
						<div class="card-label">Auto-Scroll</div>
						<div class="card-value">{autoScrollActive ? 'An' : 'Aus'}</div>
					</button>
					<button class="action-card" class:active={isFullscreen} onclick={toggleFullscreen}>
						<div class="card-label">Vollbild</div>
						<div class="card-value">{isFullscreen ? 'An' : 'Aus'}</div>
					</button>
					<button class="action-card" onclick={() => { onOpenScheduler(); onClose(); }}>
						<div class="card-label">Tagesplaner</div>
						<div class="card-value">Öffnen</div>
					</button>
				</div>
				<div class="button-row">
					<button class="btn btn-success" onclick={bulkOpenAllRooms}>Alle Räume öffnen</button>
					<button class="btn btn-danger" onclick={bulkCloseAllRooms}>Alle Räume schließen</button>
				</div>
			</section>

			<!-- Tagesverwaltung -->
			<section class="section">
				<h3>Tag: {weekdayNames[$viewWeekday]}</h3>
				<div class="button-row">
					<button class="btn" onclick={copyCurrentDay}>Kopieren</button>
					<button class="btn" onclick={pasteToCurrentDay} disabled={copiedDay === null}>
						{copiedDay !== null ? `Einfügen (${weekdayNames[copiedDay]})` : 'Einfügen'}
					</button>
					<button class="btn btn-danger" onclick={deleteCurrentDay}>Löschen</button>
				</div>
			</section>

			<!-- Darstellung -->
			<section class="section">
				<h3>Darstellung</h3>

				<div class="setting-row">
					<label>Kachel-Theme</label>
					<div class="theme-selector">
						{#each allCardThemes.slice(0, 8) as theme}
							<button
								class="theme-item"
								class:active={$cardTheme === theme.name}
								onclick={() => selectCardTheme(theme.name)}
								title={theme.displayName}
							>
								{theme.emoji}
							</button>
						{/each}
					</div>
				</div>

				<div class="setting-row">
					<label>Hintergrund-Theme</label>
					<div class="theme-selector">
						{#each allUIThemes.slice(0, 6) as theme}
							<button
								class="theme-item"
								class:active={currentUITheme === theme.id}
								onclick={() => selectUITheme(theme.id)}
								title={theme.name}
								style="background: {theme.colors.cardBg};"
							>
								{theme.emoji}
							</button>
						{/each}
					</div>
				</div>

				<div class="setting-row">
					<label>Kachel-Breite</label>
					<div class="slider-group">
						<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardWidth} oninput={updateCardWidth} />
						<span class="slider-value">{(cardWidth * 100).toFixed(0)}%</span>
					</div>
				</div>

				<div class="setting-row">
					<label>Kachel-Höhe</label>
					<div class="slider-group">
						<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardHeight} oninput={updateCardHeight} />
						<span class="slider-value">{(cardHeight * 100).toFixed(0)}%</span>
					</div>
				</div>

				<div class="setting-row">
					<label>Display-Breite</label>
					<div class="slider-group">
						<input type="range" min="0.5" max="1.0" step="0.01" bind:value={displayScaleX} oninput={updateDisplayScale} />
						<span class="slider-value">{(displayScaleX * 100).toFixed(0)}%</span>
					</div>
				</div>

				<div class="setting-row">
					<label>Scroll-Geschwindigkeit</label>
					<div class="slider-group">
						<input type="range" min="0.1" max="3.0" step="0.1" bind:value={scrollSpeed} oninput={updateScrollSettings} />
						<span class="slider-value">{scrollSpeed.toFixed(1)} px</span>
					</div>
				</div>

				<div class="setting-row">
					<label>Scroll-Pause</label>
					<div class="slider-group">
						<input type="range" min="1" max="10" step="1" bind:value={pauseDuration} oninput={updateScrollSettings} />
						<span class="slider-value">{pauseDuration}s</span>
					</div>
				</div>
			</section>

			<!-- Nachtruhe -->
			<section class="section">
				<h3>Nachtruhe</h3>
				<div class="setting-row">
					<label>Aktiviert</label>
					<label class="switch">
						<input type="checkbox" bind:checked={nightModeEnabled} onchange={saveNightModeSettings} />
						<span class="switch-slider"></span>
					</label>
				</div>
				{#if nightModeEnabled}
					<div class="time-row" transition:slide={{ duration: 200 }}>
						<div class="time-field">
							<label>Beginnt</label>
							<input type="time" bind:value={nightStart} onchange={saveNightModeSettings} />
						</div>
						<div class="time-field">
							<label>Endet</label>
							<input type="time" bind:value={nightEnd} onchange={saveNightModeSettings} />
						</div>
					</div>
				{/if}
			</section>

			<!-- Raumverwaltung (nur im Edit-Modus) -->
			{#if $isEditMode}
				<section class="section">
					<h3>Raumverwaltung</h3>

					{#if !showCreateForm}
						<button class="btn" onclick={() => showCreateForm = true}>Neuen Raum erstellen</button>
					{:else}
						<div class="create-form" transition:slide={{ duration: 200 }}>
							<input type="text" bind:value={newRoomName} placeholder="Raum-Name" onkeydown={(e) => e.key === 'Enter' && handleCreateRoom()} />
							<select bind:value={newRoomFloor}>
								<option value="extern">Außenbereich</option>
								<option value="dach">Dachgeschoss</option>
								<option value="og2">2. OG</option>
								<option value="og1">1. OG</option>
								<option value="eg">Erdgeschoss</option>
								<option value="ug">Untergeschoss</option>
							</select>
							<div class="button-row">
								<button class="btn btn-success" onclick={handleCreateRoom}>Erstellen</button>
								<button class="btn" onclick={() => showCreateForm = false}>Abbrechen</button>
							</div>
						</div>
					{/if}

					<button class="btn" onclick={handleSwap} disabled={$swapSelection.length !== 2}>
						Räume tauschen ({$swapSelection.length}/2)
					</button>
				</section>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 9998;
	}

	.admin-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 900px;
		max-height: 90vh;
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1a1a1a;
		letter-spacing: -0.01em;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: transparent;
		border: none;
		color: #6b7280;
		font-size: 20px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #1a1a1a;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.section {
		margin-bottom: 32px;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section h3 {
		margin: 0 0 16px 0;
		font-size: 14px;
		font-weight: 600;
		color: #1a1a1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
	}

	.action-card {
		background: #f9fafb;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.action-card:hover {
		background: #f3f4f6;
		border-color: rgba(0, 0, 0, 0.12);
	}

	.action-card.active {
		background: #1a1a1a;
		border-color: #1a1a1a;
	}

	.action-card.active .card-label,
	.action-card.active .card-value {
		color: white;
	}

	.card-label {
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.card-value {
		font-size: 15px;
		font-weight: 600;
		color: #1a1a1a;
	}

	.button-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn {
		background: #f9fafb;
		border: 1px solid rgba(0, 0, 0, 0.08);
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
		padding: 10px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: rgba(0, 0, 0, 0.12);
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-success {
		background: #059669;
		border-color: #059669;
		color: white;
	}

	.btn-success:hover {
		background: #047857;
		border-color: #047857;
	}

	.btn-danger {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	.btn-danger:hover {
		background: #b91c1c;
		border-color: #b91c1c;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}

	.setting-row label {
		font-size: 13px;
		font-weight: 500;
		color: #1a1a1a;
		min-width: 140px;
	}

	.theme-selector {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.theme-item {
		width: 44px;
		height: 44px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		background: #f9fafb;
		font-size: 20px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-item:hover {
		border-color: rgba(0, 0, 0, 0.2);
	}

	.theme-item.active {
		border-color: #1a1a1a;
		border-width: 2px;
	}

	.slider-group {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.slider-group input[type="range"] {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
	}

	.slider-group input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #1a1a1a;
		cursor: pointer;
		transition: all 0.2s;
	}

	.slider-group input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.slider-group input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #1a1a1a;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.slider-group input[type="range"]::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	.slider-value {
		font-size: 13px;
		font-weight: 500;
		color: #6b7280;
		min-width: 60px;
		text-align: right;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 26px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.switch-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #e5e7eb;
		border-radius: 13px;
		transition: all 0.2s;
	}

	.switch-slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 3px;
		background: white;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.switch input:checked + .switch-slider {
		background: #1a1a1a;
	}

	.switch input:checked + .switch-slider:before {
		transform: translateX(22px);
	}

	.time-row {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	.time-field {
		flex: 1;
	}

	.time-field label {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 6px;
	}

	.time-field input[type="time"] {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		background: #f9fafb;
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
	}

	.time-field input[type="time"]:focus {
		outline: none;
		border-color: #1a1a1a;
		background: white;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: #f9fafb;
		border-radius: 8px;
		margin-bottom: 12px;
	}

	.create-form input[type="text"],
	.create-form select {
		padding: 10px 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		background: white;
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
	}

	.create-form input[type="text"]:focus,
	.create-form select:focus {
		outline: none;
		border-color: #1a1a1a;
	}

	.create-form input::placeholder {
		color: #9ca3af;
	}

	.modal-content::-webkit-scrollbar {
		width: 8px;
	}

	.modal-content::-webkit-scrollbar-track {
		background: #f9fafb;
	}

	.modal-content::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;
	}

	.modal-content::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	@media (max-width: 768px) {
		.admin-modal {
			width: 95%;
			max-height: 95vh;
		}

		.modal-content {
			padding: 16px;
		}

		.action-grid {
			grid-template-columns: 1fr 1fr;
		}

		.setting-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.setting-row label {
			min-width: auto;
		}

		.slider-group,
		.theme-selector {
			width: 100%;
		}
	}
</style>
