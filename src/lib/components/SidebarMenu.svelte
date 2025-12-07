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

	<!-- Sidebar -->
	<aside class="sidebar" transition:slide={{ duration: 300, axis: 'x' }}>
		<!-- Header -->
		<div class="sidebar-header">
			<h2>Menü</h2>
			<button class="close-btn" onclick={onClose} aria-label="Menü schließen">✕</button>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'control'}
				onclick={() => activeTab = 'control'}
			>
				⚡ Steuerung
			</button>
			<button
				class="tab"
				class:active={activeTab === 'planning'}
				onclick={() => activeTab = 'planning'}
			>
				📅 Planung
			</button>
			<button
				class="tab"
				class:active={activeTab === 'view'}
				onclick={() => activeTab = 'view'}
			>
				👁️ Ansicht
			</button>
			<button
				class="tab"
				class:active={activeTab === 'advanced'}
				onclick={() => activeTab = 'advanced'}
			>
				🛠️ Erweitert
			</button>
		</div>

		<!-- Content -->
		<div class="content">
			{#if activeTab === 'control'}
				<div class="tab-content" transition:fade={{ duration: 200 }}>
					<h3>Steuerung</h3>

					<!-- Edit-Modus -->
					<button
						class="action-btn"
						class:active={$isEditMode}
						onclick={() => isEditMode.update(v => !v)}
					>
						<span class="icon">{$isEditMode ? '🔓' : '🔒'}</span>
						<div class="btn-text">
							<span class="label">Edit-Modus</span>
							<span class="hint">{$isEditMode ? 'Bearbeitung aktiv' : 'Nur ansehen'}</span>
						</div>
					</button>

					<!-- Vollbild -->
					<button
						class="action-btn"
						class:active={isFullscreen}
						onclick={toggleFullscreen}
					>
						<span class="icon">🎬</span>
						<div class="btn-text">
							<span class="label">Vollbild</span>
							<span class="hint">{isFullscreen ? 'Aktiv (ESC zum Beenden)' : 'Klicken zum Aktivieren'}</span>
						</div>
					</button>

					<div class="divider"></div>

					<!-- Alle Räume öffnen/schließen -->
					<div class="button-group">
						<button class="action-btn success" onclick={bulkOpenAllRooms}>
							<span class="icon">✅</span>
							<span class="label">Alle öffnen</span>
						</button>
						<button class="action-btn danger" onclick={bulkCloseAllRooms}>
							<span class="icon">🔒</span>
							<span class="label">Alle schließen</span>
						</button>
					</div>

					<div class="divider"></div>

					<!-- Auto-Scroll -->
					<button
						class="action-btn"
						class:active={autoScrollActive}
						onclick={toggleAutoScroll}
					>
						<span class="icon">{autoScrollActive ? '⏸️' : '▶️'}</span>
						<div class="btn-text">
							<span class="label">Auto-Scroll</span>
							<span class="hint">{autoScrollActive ? 'Läuft...' : 'Gestoppt'}</span>
						</div>
					</button>
				</div>
			{:else if activeTab === 'planning'}
				<div class="tab-content" transition:fade={{ duration: 200 }}>
					<h3>Planung</h3>

					<!-- Tagesplaner -->
					<button class="action-btn" onclick={() => { onOpenScheduler(); onClose(); }}>
						<span class="icon">📅</span>
						<div class="btn-text">
							<span class="label">Tagesplaner</span>
							<span class="hint">Wochenplan verwalten</span>
						</div>
					</button>

					<div class="divider"></div>

					<!-- Aktueller Tag -->
					<div class="info-banner">
						<span class="icon">📍</span>
						<div class="info-text">
							<span class="info-label">Aktueller Tag:</span>
							<span class="info-value">{weekdayNames[$viewWeekday]}</span>
						</div>
					</div>

					<!-- Tag-Verwaltung -->
					<button class="action-btn" onclick={copyCurrentDay}>
						<span class="icon">📋</span>
						<div class="btn-text">
							<span class="label">Tag kopieren</span>
							<span class="hint">Alle Raumkonfigurationen</span>
						</div>
					</button>

					<button
						class="action-btn"
						class:active={copiedDay !== null}
						onclick={pasteToCurrentDay}
						disabled={copiedDay === null}
					>
						<span class="icon">📌</span>
						<div class="btn-text">
							<span class="label">Tag einfügen</span>
							<span class="hint">
								{copiedDay !== null ? `Von ${weekdayNames[copiedDay]}` : 'Zuerst Tag kopieren'}
							</span>
						</div>
					</button>

					<button class="action-btn danger" onclick={deleteCurrentDay}>
						<span class="icon">🗑️</span>
						<div class="btn-text">
							<span class="label">Tag löschen</span>
							<span class="hint">Alle Konfigurationen entfernen</span>
						</div>
					</button>
				</div>
			{:else if activeTab === 'view'}
				<div class="tab-content" transition:fade={{ duration: 200 }}>
					<h3>Ansicht</h3>

					<!-- Kachel-Theme-Auswahl -->
					<h4>🎨 Kachel-Themes</h4>
					<div class="theme-grid">
						{#each allCardThemes as theme}
							<button
								class="theme-btn"
								class:active={$cardTheme === theme.name}
								onclick={() => selectCardTheme(theme.name)}
								title={theme.displayName}
							>
								<span class="theme-emoji">{theme.emoji}</span>
							</button>
						{/each}
					</div>

					<div class="divider"></div>

					<!-- Kachelgröße -->
					<div class="control-group">
						<div class="control-header">
							<span class="icon">↔️</span>
							<span class="label">Kachel-Breite</span>
							<span class="value">{(cardWidth * 100).toFixed(0)}%</span>
						</div>
						<input
							type="range"
							min="0.6"
							max="1.4"
							step="0.05"
							bind:value={cardWidth}
							oninput={updateCardWidth}
							class="slider"
						/>
					</div>

					<div class="control-group">
						<div class="control-header">
							<span class="icon">↕️</span>
							<span class="label">Kachel-Höhe</span>
							<span class="value">{(cardHeight * 100).toFixed(0)}%</span>
						</div>
						<input
							type="range"
							min="0.6"
							max="1.4"
							step="0.05"
							bind:value={cardHeight}
							oninput={updateCardHeight}
							class="slider"
						/>
					</div>

					<div class="control-group">
						<div class="control-header">
							<span class="icon">📺</span>
							<span class="label">Display-Breite (TV)</span>
							<span class="value">{(displayScaleX * 100).toFixed(0)}%</span>
						</div>
						<input
							type="range"
							min="0.5"
							max="1.0"
							step="0.01"
							bind:value={displayScaleX}
							oninput={updateDisplayScale}
							class="slider"
						/>
					</div>

					<div class="divider"></div>

					<!-- Auto-Scroll Einstellungen -->
					<h4>Auto-Scroll Einstellungen</h4>

					<div class="control-group">
						<div class="control-header">
							<span class="icon">🐌</span>
							<span class="label">Geschwindigkeit</span>
							<span class="value">{scrollSpeed.toFixed(1)} px</span>
						</div>
						<input
							type="range"
							min="0.1"
							max="3.0"
							step="0.1"
							bind:value={scrollSpeed}
							oninput={updateScrollSettings}
							class="slider"
						/>
					</div>

					<div class="control-group">
						<div class="control-header">
							<span class="icon">⏱️</span>
							<span class="label">Pause am Ende</span>
							<span class="value">{pauseDuration}s</span>
						</div>
						<input
							type="range"
							min="1"
							max="10"
							step="1"
							bind:value={pauseDuration}
							oninput={updateScrollSettings}
							class="slider"
						/>
					</div>
				</div>
			{:else if activeTab === 'advanced'}
				<div class="tab-content" transition:fade={{ duration: 200 }}>
					<h3>Erweitert</h3>

					<!-- UI-Theme-Auswahl -->
					<h4>🎨 Hintergrund-Theme</h4>
					<p class="hint">Ändert das Erscheinungsbild der App</p>
					<div class="theme-grid">
						{#each allUIThemes as theme}
							<button
								class="theme-btn ui-theme-btn"
								class:active={currentUITheme === theme.id}
								onclick={() => selectUITheme(theme.id)}
								style="background: {theme.colors.cardBg};"
								title={theme.name}
							>
								<span class="theme-emoji">{theme.emoji}</span>
							</button>
						{/each}
					</div>

					<div class="divider"></div>

					<!-- Nachtruhe-Modus -->
					<h4>🌙 Nachtruhe-Modus</h4>
					<div class="night-mode-section">
						<label class="toggle-switch">
							<input type="checkbox" bind:checked={nightModeEnabled} onchange={saveNightModeSettings} />
							<span class="slider"></span>
							<span class="toggle-label">{nightModeEnabled ? 'Aktiviert' : 'Deaktiviert'}</span>
						</label>

						{#if nightModeEnabled}
							<div class="time-inputs" transition:slide={{ duration: 200 }}>
								<div class="time-input-group">
									<label for="night-start">Beginnt</label>
									<input
										id="night-start"
										type="time"
										bind:value={nightStart}
										onchange={saveNightModeSettings}
									/>
								</div>
								<div class="time-input-group">
									<label for="night-end">Endet</label>
									<input
										id="night-end"
										type="time"
										bind:value={nightEnd}
										onchange={saveNightModeSettings}
									/>
								</div>
							</div>
							<p class="hint">
								Alle Räume schließen automatisch zwischen {nightStart} und {nightEnd} Uhr
							</p>
						{/if}
					</div>

					{#if $isEditMode}
						<div class="divider"></div>

						<!-- Raum erstellen -->
						<button class="action-btn" onclick={() => showCreateForm = !showCreateForm}>
						<span class="icon">➕</span>
						<div class="btn-text">
							<span class="label">Raum erstellen</span>
							<span class="hint">Neuen Raum anlegen</span>
						</div>
					</button>

					{#if showCreateForm}
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
								<button class="form-btn create" onclick={handleCreateRoom}>Erstellen</button>
								<button class="form-btn cancel" onclick={() => showCreateForm = false}>Abbrechen</button>
							</div>
						</div>
					{/if}

						<!-- Räume tauschen -->
						<button
							class="action-btn"
							class:active={$swapSelection.length > 0}
							onclick={handleSwap}
							disabled={$swapSelection.length !== 2}
						>
							<span class="icon">⮀</span>
							<div class="btn-text">
								<span class="label">Räume tauschen</span>
								<span class="hint">{$swapSelection.length}/2 ausgewählt</span>
							</div>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 9998;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: 400px;
		max-width: 90vw;
		background: rgba(15, 23, 42, 0.98);
		backdrop-filter: blur(20px);
		box-shadow: 4px 0 32px rgba(0, 0, 0, 0.6);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		border-right: 2px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.5px;
	}

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		background: rgba(239, 68, 68, 0.2);
		border: 2px solid rgba(239, 68, 68, 0.4);
		color: white;
		font-size: 24px;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.4);
		transform: scale(1.1);
	}

	.tabs {
		display: flex;
		gap: 8px;
		padding: 16px 24px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		overflow-x: auto;
	}

	.tab {
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		white-space: nowrap;
	}

	.tab:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.tab.active {
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		border-color: transparent;
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.tab-content h3 {
		margin: 0 0 20px 0;
		font-size: 20px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.5px;
	}

	.tab-content h4 {
		margin: 16px 0 12px 0;
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.action-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px 20px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		color: white;
		cursor: pointer;
		transition: all 0.3s;
		margin-bottom: 12px;
		text-align: left;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		transform: translateX(4px);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn.active {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.action-btn.success {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.action-btn.success:hover {
		background: rgba(34, 197, 94, 0.15);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.action-btn.danger {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.action-btn.danger:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.action-btn .icon {
		font-size: 28px;
		min-width: 32px;
		text-align: center;
		flex-shrink: 0;
	}

	.btn-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.btn-text .label {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.btn-text .hint {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}

	.button-group {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 12px;
	}

	.button-group .action-btn {
		margin-bottom: 0;
	}

	.divider {
		height: 2px;
		background: rgba(255, 255, 255, 0.1);
		margin: 20px 0;
		border-radius: 1px;
	}

	.info-banner {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px 20px;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
		border: 2px solid rgba(59, 130, 246, 0.4);
		border-radius: 12px;
		margin-bottom: 16px;
	}

	.info-banner .icon {
		font-size: 28px;
		min-width: 32px;
		text-align: center;
	}

	.info-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.info-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(255, 255, 255, 0.7);
	}

	.info-value {
		font-size: 18px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.5px;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 12px;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		color: white;
		cursor: pointer;
		transition: all 0.3s;
		min-height: 80px;
	}

	.theme-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.theme-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.theme-emoji {
		font-size: 40px;
		line-height: 1;
	}

	.control-group {
		margin-bottom: 20px;
	}

	.control-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 10px;
	}

	.control-header .icon {
		font-size: 20px;
	}

	.control-header .label {
		flex: 1;
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.control-header .value {
		font-size: 14px;
		font-weight: 700;
		color: var(--color-accent);
		min-width: 50px;
		text-align: right;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		transition: all 0.2s;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
		transition: all 0.2s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
	}

	.slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
		transition: all 0.2s;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		margin-bottom: 12px;
	}

	.create-form input,
	.create-form select {
		padding: 12px 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
		font-size: 14px;
		font-weight: 500;
		width: 100%;
	}

	.create-form input:focus,
	.create-form select:focus {
		outline: none;
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.15);
	}

	.create-form input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.create-form select option {
		background: #1e3a8a;
		color: white;
	}

	.form-actions {
		display: flex;
		gap: 10px;
	}

	.form-btn {
		flex: 1;
		padding: 12px;
		border-radius: 10px;
		font-weight: 700;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.3s;
		border: none;
	}

	.form-btn.create {
		background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
		color: white;
	}

	.form-btn.create:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}

	.form-btn.cancel {
		background: rgba(239, 68, 68, 0.2);
		color: white;
		border: 2px solid rgba(239, 68, 68, 0.5);
	}

	.form-btn.cancel:hover {
		background: rgba(239, 68, 68, 0.4);
	}

	/* Nachtruhe-Modus */
	.night-mode-section {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		padding: 16px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 12px;
	}

	.toggle-switch {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		margin-bottom: 16px;
	}

	.toggle-switch input {
		opacity: 0;
		position: absolute;
		width: 0;
		height: 0;
	}

	.slider {
		width: 50px;
		height: 26px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 13px;
		position: relative;
		transition: all 0.3s;
	}

	.slider::after {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		top: 3px;
		left: 3px;
		transition: all 0.3s;
	}

	.toggle-switch input:checked + .slider {
		background: #22c55e;
	}

	.toggle-switch input:checked + .slider::after {
		left: 27px;
	}

	.toggle-label {
		font-weight: 600;
		font-size: 14px;
		color: white;
	}

	.time-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}

	.time-input-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 12px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
	}

	.time-input-group input {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		font-weight: 500;
	}

	.time-input-group input:focus {
		outline: none;
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.15);
	}

	.hint {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
		margin-top: 8px;
		line-height: 1.4;
	}

	.ui-theme-btn {
		border: 3px solid rgba(255, 255, 255, 0.2);
	}

	.ui-theme-btn.active {
		border-color: var(--color-accent);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
	}

	/* Scrollbar */
	.content::-webkit-scrollbar {
		width: 10px;
	}

	.content::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
	}

	.content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 5px;
	}

	.content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	@media (max-width: 768px) {
		.sidebar {
			width: 100vw;
			max-width: 100vw;
		}

		.tabs {
			padding: 12px 16px;
		}

		.tab {
			font-size: 13px;
			padding: 8px 12px;
		}

		.content {
			padding: 16px;
		}
	}
</style>
