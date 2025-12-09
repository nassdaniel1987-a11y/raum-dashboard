<script lang="ts">
	import { goto } from '$app/navigation';
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

	// State
	let activeSection = $state<'control' | 'planning' | 'appearance' | 'advanced'>('control');
	let copiedDay = $state<number | null>(null);
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');
	let showCreateForm = $state(false);

	// Display Settings
	let displayScaleX = $state(1.0);
	let cardWidth = $state(1.0);
	let cardHeight = $state(1.0);
	let scrollSpeed = $state(0.6);
	let pauseDuration = $state(4);

	// Night Mode Settings
	let nightModeEnabled = $state($appSettings?.night_mode_enabled ?? true);
	let nightStart = $state($appSettings?.night_start || '17:00');
	let nightEnd = $state($appSettings?.night_end || '07:00');

	// UI Theme
	let currentUITheme = $state($userTheme);

	// Preview State
	let previewRoom = $state({
		name: 'Beispielraum',
		floor: 'eg',
		isOpen: true,
		theme: $cardTheme
	});

	onMount(() => {
		// Load saved values
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
	});

	function goBack() {
		goto('/');
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

	function updateScrollSettings() {
		localStorage.setItem('scrollSpeed', scrollSpeed.toString());
		localStorage.setItem('pauseDuration', pauseDuration.toString());
	}

	function selectCardTheme(themeName: string) {
		cardTheme.set(themeName);
		previewRoom.theme = themeName;
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

<div class="admin-page">
	<!-- Header -->
	<header class="admin-header">
		<button class="back-btn" onclick={goBack}>
			← Dashboard
		</button>
		<h1>Admin</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="admin-content">
		<!-- Sidebar Navigation -->
		<nav class="admin-nav">
			<button
				class="nav-item"
				class:active={activeSection === 'control'}
				onclick={() => activeSection = 'control'}
			>
				Steuerung
			</button>
			<button
				class="nav-item"
				class:active={activeSection === 'planning'}
				onclick={() => activeSection = 'planning'}
			>
				Planung
			</button>
			<button
				class="nav-item"
				class:active={activeSection === 'appearance'}
				onclick={() => activeSection = 'appearance'}
			>
				Darstellung
			</button>
			<button
				class="nav-item"
				class:active={activeSection === 'advanced'}
				onclick={() => activeSection = 'advanced'}
			>
				Erweitert
			</button>
		</nav>

		<!-- Main Content -->
		<main class="admin-main">
			{#if activeSection === 'control'}
				<div class="section" transition:fade={{ duration: 150 }}>
					<h2>Steuerung</h2>

					<div class="settings-group">
						<div class="setting-item">
							<div class="setting-label">
								<span class="label-text">Edit-Modus</span>
								<span class="label-hint">Bearbeitung von Räumen ermöglichen</span>
							</div>
							<label class="toggle">
								<input type="checkbox" bind:checked={$isEditMode} />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>

					<div class="divider"></div>

					<h3>Massenaktionen</h3>
					<div class="button-group">
						<button class="action-btn success" onclick={bulkOpenAllRooms}>
							Alle Räume öffnen
						</button>
						<button class="action-btn danger" onclick={bulkCloseAllRooms}>
							Alle Räume schließen
						</button>
					</div>
				</div>

			{:else if activeSection === 'planning'}
				<div class="section" transition:fade={{ duration: 150 }}>
					<h2>Planung</h2>

					<div class="info-card">
						<div class="info-label">Aktueller Tag</div>
						<div class="info-value">{weekdayNames[$viewWeekday]}</div>
					</div>

					<h3>Tagesverwaltung</h3>
					<div class="button-group">
						<button class="action-btn" onclick={copyCurrentDay}>
							Tag kopieren
						</button>
						<button class="action-btn" onclick={pasteToCurrentDay} disabled={copiedDay === null}>
							{copiedDay !== null ? `Einfügen (${weekdayNames[copiedDay]})` : 'Einfügen'}
						</button>
						<button class="action-btn danger" onclick={deleteCurrentDay}>
							Tag löschen
						</button>
					</div>
				</div>

			{:else if activeSection === 'appearance'}
				<div class="section" transition:fade={{ duration: 150 }}>
					<h2>Darstellung</h2>

					<!-- Theme Preview -->
					<div class="preview-card">
						<div class="preview-label">Vorschau</div>
						<div class="theme-preview">
							<div class="preview-room-card" style="transform: scale(0.8);">
								<div class="preview-header">
									<span>{previewRoom.name}</span>
									<span class="preview-status">{previewRoom.isOpen ? 'GEÖFFNET' : 'GESCHLOSSEN'}</span>
								</div>
							</div>
						</div>
					</div>

					<h3>Kachel-Theme</h3>
					<div class="theme-grid">
						{#each allCardThemes as theme}
							<button
								class="theme-btn"
								class:active={$cardTheme === theme.name}
								onclick={() => selectCardTheme(theme.name)}
								title={theme.displayName}
							>
								<span class="theme-emoji">{theme.emoji}</span>
								<span class="theme-name">{theme.displayName}</span>
							</button>
						{/each}
					</div>

					<div class="divider"></div>

					<h3>Hintergrund-Theme</h3>
					<div class="theme-grid compact">
						{#each allUIThemes as theme}
							<button
								class="theme-btn"
								class:active={currentUITheme === theme.id}
								onclick={() => selectUITheme(theme.id)}
								title={theme.name}
								style="background: {theme.colors.cardBg};"
							>
								<span class="theme-emoji">{theme.emoji}</span>
								<span class="theme-name">{theme.name}</span>
							</button>
						{/each}
					</div>

					<div class="divider"></div>

					<h3>Größen & Skalierung</h3>
					<div class="settings-group">
						<div class="slider-control">
							<label>Kachel-Breite</label>
							<div class="slider-wrapper">
								<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardWidth} oninput={updateCardWidth} />
								<span class="slider-value">{(cardWidth * 100).toFixed(0)}%</span>
							</div>
						</div>

						<div class="slider-control">
							<label>Kachel-Höhe</label>
							<div class="slider-wrapper">
								<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardHeight} oninput={updateCardHeight} />
								<span class="slider-value">{(cardHeight * 100).toFixed(0)}%</span>
							</div>
						</div>

						<div class="slider-control">
							<label>Display-Breite</label>
							<div class="slider-wrapper">
								<input type="range" min="0.5" max="1.0" step="0.01" bind:value={displayScaleX} oninput={updateDisplayScale} />
								<span class="slider-value">{(displayScaleX * 100).toFixed(0)}%</span>
							</div>
						</div>
					</div>

					<div class="divider"></div>

					<h3>Auto-Scroll</h3>
					<div class="settings-group">
						<div class="slider-control">
							<label>Geschwindigkeit</label>
							<div class="slider-wrapper">
								<input type="range" min="0.1" max="3.0" step="0.1" bind:value={scrollSpeed} oninput={updateScrollSettings} />
								<span class="slider-value">{scrollSpeed.toFixed(1)} px</span>
							</div>
						</div>

						<div class="slider-control">
							<label>Pause am Ende</label>
							<div class="slider-wrapper">
								<input type="range" min="1" max="10" step="1" bind:value={pauseDuration} oninput={updateScrollSettings} />
								<span class="slider-value">{pauseDuration}s</span>
							</div>
						</div>
					</div>
				</div>

			{:else if activeSection === 'advanced'}
				<div class="section" transition:fade={{ duration: 150 }}>
					<h2>Erweitert</h2>

					<h3>Nachtruhe-Modus</h3>
					<div class="settings-group">
						<div class="setting-item">
							<div class="setting-label">
								<span class="label-text">Aktiviert</span>
								<span class="label-hint">Automatisches Schließen aller Räume</span>
							</div>
							<label class="toggle">
								<input type="checkbox" bind:checked={nightModeEnabled} onchange={saveNightModeSettings} />
								<span class="toggle-slider"></span>
							</label>
						</div>

						{#if nightModeEnabled}
							<div class="time-controls" transition:slide={{ duration: 200 }}>
								<div class="time-input">
									<label>Beginnt</label>
									<input type="time" bind:value={nightStart} onchange={saveNightModeSettings} />
								</div>
								<div class="time-input">
									<label>Endet</label>
									<input type="time" bind:value={nightEnd} onchange={saveNightModeSettings} />
								</div>
							</div>
						{/if}
					</div>

					{#if $isEditMode}
						<div class="divider"></div>

						<h3>Raumverwaltung</h3>

						{#if !showCreateForm}
							<button class="action-btn" onclick={() => showCreateForm = true}>
								Neuen Raum erstellen
							</button>
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
								<div class="button-group">
									<button class="action-btn success" onclick={handleCreateRoom}>Erstellen</button>
									<button class="action-btn" onclick={() => showCreateForm = false}>Abbrechen</button>
								</div>
							</div>
						{/if}

						<button class="action-btn" onclick={handleSwap} disabled={$swapSelection.length !== 2}>
							Räume tauschen ({$swapSelection.length}/2)
						</button>
					{/if}
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.admin-page {
		width: 100vw;
		height: 100vh;
		background: #f9fafb;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.admin-header {
		height: 60px;
		background: white;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		display: flex;
		align-items: center;
		padding: 0 24px;
		gap: 16px;
	}

	.back-btn {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.12);
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.2);
	}

	.admin-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1a1a1a;
		letter-spacing: -0.01em;
	}

	.header-spacer {
		flex: 1;
	}

	.admin-content {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	.admin-nav {
		width: 200px;
		background: white;
		border-right: 1px solid rgba(0, 0, 0, 0.08);
		padding: 16px 0;
		overflow-y: auto;
	}

	.nav-item {
		width: 100%;
		text-align: left;
		padding: 12px 24px;
		background: transparent;
		border: none;
		color: #6b7280;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border-left: 3px solid transparent;
	}

	.nav-item:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #1a1a1a;
	}

	.nav-item.active {
		background: rgba(0, 0, 0, 0.04);
		color: #1a1a1a;
		border-left-color: #1a1a1a;
		font-weight: 600;
	}

	.admin-main {
		flex: 1;
		padding: 32px;
		overflow-y: auto;
		max-width: 900px;
	}

	.section h2 {
		margin: 0 0 24px 0;
		font-size: 24px;
		font-weight: 600;
		color: #1a1a1a;
		letter-spacing: -0.02em;
	}

	.section h3 {
		margin: 24px 0 16px 0;
		font-size: 14px;
		font-weight: 600;
		color: #1a1a1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.settings-group {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 16px;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
	}

	.setting-item:not(:last-child) {
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.setting-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label-text {
		font-size: 14px;
		font-weight: 500;
		color: #1a1a1a;
	}

	.label-hint {
		font-size: 12px;
		color: #6b7280;
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 26px;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
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

	.toggle-slider:before {
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

	.toggle input:checked + .toggle-slider {
		background: #1a1a1a;
	}

	.toggle input:checked + .toggle-slider:before {
		transform: translateX(22px);
	}

	.divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.08);
		margin: 24px 0;
	}

	.button-group {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.action-btn {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.12);
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
		padding: 10px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.2);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn.success {
		background: #059669;
		border-color: #059669;
		color: white;
	}

	.action-btn.success:hover {
		background: #047857;
	}

	.action-btn.danger {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	.action-btn.danger:hover {
		background: #b91c1c;
	}

	.info-card {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.info-label {
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 20px;
		font-weight: 600;
		color: #1a1a1a;
	}

	.preview-card {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.preview-label {
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 16px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.theme-preview {
		display: flex;
		justify-content: center;
		padding: 20px;
		background: #f9fafb;
		border-radius: 6px;
	}

	.preview-room-card {
		width: 300px;
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		font-weight: 600;
	}

	.preview-status {
		font-size: 11px;
		padding: 4px 8px;
		background: #059669;
		color: white;
		border-radius: 4px;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
	}

	.theme-grid.compact {
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	}

	.theme-btn {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.theme-btn:hover {
		border-color: rgba(0, 0, 0, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.theme-btn.active {
		border-color: #1a1a1a;
		border-width: 2px;
		background: rgba(0, 0, 0, 0.02);
	}

	.theme-emoji {
		font-size: 32px;
	}

	.theme-name {
		font-size: 12px;
		font-weight: 500;
		color: #1a1a1a;
		text-align: center;
	}

	.slider-control {
		padding: 12px 0;
	}

	.slider-control:not(:last-child) {
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.slider-control label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: #1a1a1a;
		margin-bottom: 8px;
	}

	.slider-wrapper {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.slider-wrapper input[type="range"] {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
	}

	.slider-wrapper input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #1a1a1a;
		cursor: pointer;
		transition: all 0.2s;
	}

	.slider-wrapper input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.slider-wrapper input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #1a1a1a;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.slider-wrapper input[type="range"]::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	.slider-value {
		font-size: 13px;
		font-weight: 500;
		color: #6b7280;
		min-width: 50px;
		text-align: right;
	}

	.time-controls {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	.time-input {
		flex: 1;
	}

	.time-input label {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 6px;
	}

	.time-input input[type="time"] {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		background: #f9fafb;
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
	}

	.time-input input[type="time"]:focus {
		outline: none;
		border-color: #1a1a1a;
		background: white;
	}

	.create-form {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 12px;
	}

	.create-form input[type="text"],
	.create-form select {
		padding: 10px 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		background: #f9fafb;
		color: #1a1a1a;
		font-size: 13px;
		font-weight: 500;
	}

	.create-form input[type="text"]:focus,
	.create-form select:focus {
		outline: none;
		border-color: #1a1a1a;
		background: white;
	}

	.create-form input::placeholder {
		color: #9ca3af;
	}

	.admin-main::-webkit-scrollbar {
		width: 8px;
	}

	.admin-main::-webkit-scrollbar-track {
		background: #f9fafb;
	}

	.admin-main::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;
	}

	.admin-main::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	@media (max-width: 768px) {
		.admin-nav {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid rgba(0, 0, 0, 0.08);
			padding: 8px 0;
			display: flex;
			overflow-x: auto;
		}

		.nav-item {
			flex-shrink: 0;
			padding: 12px 16px;
			border-left: none;
			border-bottom: 3px solid transparent;
		}

		.nav-item.active {
			border-left: none;
			border-bottom-color: #1a1a1a;
		}

		.admin-content {
			flex-direction: column;
		}

		.admin-main {
			padding: 16px;
		}

		.theme-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}
	}
</style>
