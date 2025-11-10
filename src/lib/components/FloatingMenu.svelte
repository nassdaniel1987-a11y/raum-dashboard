<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, swapSelection, swapRoomPositions, visibleRooms, viewWeekday, copyDayConfigs, deleteDayConfigs, appSettings } from '$lib/stores/appState';
	import { supabase } from '$lib/supabase/client';
	import { fade, slide, scale } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { toasts } from '$lib/stores/toastStore';

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
	let activeTab = $state<'view' | 'scroll' | 'edit' | 'days'>('scroll'); // ✅ Start mit Scroll-Tab

	let autoScrollActive = $state(false);

	// ✅ Slider-Werte für flexible Einstellung
	let scrollSpeed = $state(0.6); // 0.1 - 3.0 px/Schritt
	let pauseDuration = $state(4); // 1 - 10 Sekunden

	// ✅ Display-Skalierung für TV-Kompensation
	let displayScaleX = $state(1.0); // 0.5 - 1.0

	// ✅ Kachelgröße individuell einstellbar
	let cardWidth = $state(1.0); // 0.6 - 1.4
	let cardHeight = $state(1.0); // 0.6 - 1.4

	// ✅ Globale Schriftgrößen (aus DB)
	let globalTitleSize = $state($appSettings?.global_title_font_size ?? 16); // 12-24px
	let globalActivitySize = $state($appSettings?.global_activity_font_size ?? 12); // 10-18px

	// ✅ Vollbild-Status
	let isFullscreen = $state(false);

	// ✅ NEU: Tag-Verwaltung
	let copiedDay = $state<number | null>(null);
	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	onMount(() => {
		// Lade gespeicherte Werte
		const savedSpeed = localStorage.getItem('scrollSpeed');
		const savedPause = localStorage.getItem('pauseDuration');
		const savedAutoScroll = localStorage.getItem('autoScrollEnabled');
		const savedScaleX = localStorage.getItem('displayScaleX');
		const savedCardWidth = localStorage.getItem('cardWidth');
		const savedCardHeight = localStorage.getItem('cardHeight');
		const savedTitleSize = localStorage.getItem('globalTitleSize');
		const savedActivitySize = localStorage.getItem('globalActivitySize');

		if (savedSpeed) scrollSpeed = parseFloat(savedSpeed);
		if (savedPause) pauseDuration = parseInt(savedPause);
		if (savedAutoScroll !== null) {
			autoScrollActive = savedAutoScroll === 'true';
		}
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

		// ✅ Globale Schriftgrößen aus appSettings laden (nicht localStorage!)
		if ($appSettings) {
			globalTitleSize = $appSettings.global_title_font_size ?? 16;
			globalActivitySize = $appSettings.global_activity_font_size ?? 12;
		}
		// ✅ Immer anwenden, auch wenn keine gespeicherten Werte (dann Default-Werte)
		applyFontSizes();

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

		handleFullscreenChange(); // Initial check

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
		};
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

	function updateScrollSettings() {
		// Speichere in localStorage
		localStorage.setItem('scrollSpeed', scrollSpeed.toString());
		localStorage.setItem('pauseDuration', pauseDuration.toString());

		console.log(`⚙️ Scroll-Einstellungen: ${scrollSpeed.toFixed(1)} px/Schritt, ${pauseDuration}s Pause`);

		// Update Canvas wenn vorhanden
		if (canvasRef?.setScrollSpeed) {
			canvasRef.setScrollSpeed(scrollSpeed, pauseDuration);
		}
	}

	function applyDisplayScale(scale: number) {
		// Setze CSS Variable für Kachel-Skalierung
		// Der Container bleibt normal breit, nur die Kacheln werden schmaler
		document.documentElement.style.setProperty('--card-scale-x', scale.toString());
	}

	function updateDisplayScale() {
		// Speichere in localStorage
		localStorage.setItem('displayScaleX', displayScaleX.toString());

		// Wende sofort an
		applyDisplayScale(displayScaleX);

		console.log(`📺 Display-Skalierung: ${(displayScaleX * 100).toFixed(0)}%`);
	}

	function applyCardSize() {
		// Setze CSS Variablen für Kachelgröße
		document.documentElement.style.setProperty('--card-width-scale', cardWidth.toString());
		document.documentElement.style.setProperty('--card-height-scale', cardHeight.toString());
	}

	function updateCardWidth() {
		localStorage.setItem('cardWidth', cardWidth.toString());
		applyCardSize();
		console.log(`📏 Kachel-Breite: ${(cardWidth * 100).toFixed(0)}%`);
	}

	function updateCardHeight() {
		localStorage.setItem('cardHeight', cardHeight.toString());
		applyCardSize();
		console.log(`📐 Kachel-Höhe: ${(cardHeight * 100).toFixed(0)}%`);
	}

	function applyFontSizes() {
		// Setze CSS Variablen für globale Schriftgrößen
		document.documentElement.style.setProperty('--global-title-size', `${globalTitleSize}px`);
		document.documentElement.style.setProperty('--global-activity-size', `${globalActivitySize}px`);
	}

	async function updateTitleSize() {
		applyFontSizes();
		console.log(`📝 Titel-Schriftgröße: ${globalTitleSize}px`);

		// ✅ In Datenbank speichern (für alle Geräte)
		try {
			const { error } = await supabase
				.from('app_settings')
				.update({ global_title_font_size: globalTitleSize })
				.eq('id', 1);

			if (error) {
				console.error('Fehler beim Speichern der Titel-Schriftgröße:', error);
				toasts.show('⚠️ Fehler beim Speichern', 'error');
			}
		} catch (err) {
			console.error('Fehler beim Update:', err);
		}
	}

	async function updateActivitySize() {
		applyFontSizes();
		console.log(`📄 Aktivitäts-Schriftgröße: ${globalActivitySize}px`);

		// ✅ In Datenbank speichern (für alle Geräte)
		try {
			const { error } = await supabase
				.from('app_settings')
				.update({ global_activity_font_size: globalActivitySize })
				.eq('id', 1);

			if (error) {
				console.error('Fehler beim Speichern der Aktivitäts-Schriftgröße:', error);
				toasts.show('⚠️ Fehler beim Speichern', 'error');
			}
		} catch (err) {
			console.error('Fehler beim Update:', err);
		}
	}

	async function toggleFullscreen() {
		if (!isFullscreen) {
			// Vollbild aktivieren
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
			// Vollbild verlassen
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

	// ✅ NEU: Tag-Verwaltung Funktionen
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
		<!-- ✅ Haupt-Buttons (immer sichtbar, außerhalb der Tabs) -->
		<div class="main-buttons">
			<button
				class="big-button edit-toggle"
				class:active={$isEditMode}
				onclick={() => isEditMode.update(v => !v)}
			>
				<span class="big-icon">{$isEditMode ? '🔓' : '🔒'}</span>
				<div class="big-label">
					<span class="label-text">{$isEditMode ? 'Edit-Modus' : 'Ansicht-Modus'}</span>
					<span class="label-hint">{$isEditMode ? 'Aktiv' : 'Inaktiv'}</span>
				</div>
			</button>

			<button
				class="big-button fullscreen-toggle"
				class:active={isFullscreen}
				onclick={toggleFullscreen}
			>
				<span class="big-icon">{isFullscreen ? '⛶' : '⛶'}</span>
				<div class="big-label">
					<span class="label-text">Vollbild</span>
					<span class="label-hint">{isFullscreen ? 'Aktiv' : 'Inaktiv'}</span>
				</div>
			</button>
		</div>

		<!-- ✅ Tab Navigation -->
		<div class="tab-navigation">
			<button
				class="tab-btn"
				class:active={activeTab === 'view'}
				onclick={() => activeTab = 'view'}
			>
				<span class="tab-icon">👁️</span>
				<span class="tab-label">Ansicht</span>
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'scroll'}
				onclick={() => activeTab = 'scroll'}
			>
				<span class="tab-icon">↕️</span>
				<span class="tab-label">Scroll</span>
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'days'}
				onclick={() => activeTab = 'days'}
			>
				<span class="tab-icon">📅</span>
				<span class="tab-label">Tage</span>
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'edit'}
				onclick={() => activeTab = 'edit'}
			>
				<span class="tab-icon">⚙️</span>
				<span class="tab-label">Aktionen</span>
			</button>
		</div>

		<!-- ✅ Tab Content -->
		<div class="tab-content">
			<!-- TAB 1: Ansicht -->
			{#if activeTab === 'view'}
				<div class="tab-panel" transition:fade={{ duration: 200 }}>
					<div class="scroll-controls">
						<!-- Kachel-Breite -->
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">↔️</span>
								<span class="control-label">Kachel-Breite</span>
								<span class="control-value">{(cardWidth * 100).toFixed(0)}%</span>
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

						<!-- Kachel-Höhe -->
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">↕️</span>
								<span class="control-label">Kachel-Höhe</span>
								<span class="control-value">{(cardHeight * 100).toFixed(0)}%</span>
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

						<!-- Schriftgröße Titel -->
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">📝</span>
								<span class="control-label">Schriftgröße Titel</span>
								<span class="control-value">{globalTitleSize}px</span>
							</div>
							<input
								type="range"
								min="12"
								max="24"
								step="1"
								bind:value={globalTitleSize}
								oninput={updateTitleSize}
								class="slider"
							/>
						</div>

						<!-- Schriftgröße Aktivität -->
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">📄</span>
								<span class="control-label">Schriftgröße Aktivität</span>
								<span class="control-value">{globalActivitySize}px</span>
							</div>
							<input
								type="range"
								min="10"
								max="18"
								step="1"
								bind:value={globalActivitySize}
								oninput={updateActivitySize}
								class="slider"
							/>
						</div>

						<!-- Display-Breite -->
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">📺</span>
								<span class="control-label">Display-Breite (TV)</span>
								<span class="control-value">{(displayScaleX * 100).toFixed(0)}%</span>
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
							<div class="scale-hints">
								<span class="hint-label">← TV (4:3→16:9): ~75%</span>
								<span class="hint-label">Normal: 100% →</span>
							</div>
						</div>
					</div>

					<div class="info-box">
						<span class="info-icon">ℹ️</span>
						<span class="info-text">Passe Kachelgröße und Display-Breite für optimale TV-Darstellung an</span>
					</div>
				</div>
			{/if}

			<!-- TAB 2: Scroll -->
			{#if activeTab === 'scroll'}
				<div class="tab-panel" transition:fade={{ duration: 200 }}>
					<button
						class="action-button autoscroll-toggle"
						class:active={autoScrollActive}
						onclick={toggleAutoScroll}
					>
						<span class="btn-icon">{autoScrollActive ? '⏸️' : '▶️'}</span>
						<div class="btn-content">
							<span class="btn-label">Auto-Scroll</span>
							<span class="btn-hint">{autoScrollActive ? 'Läuft...' : 'Gestoppt'}</span>
						</div>
					</button>

					<div class="scroll-controls">
						<div class="control-group">
							<div class="control-header">
								<span class="control-icon">🐌</span>
								<span class="control-label">Geschwindigkeit</span>
								<span class="control-value">{scrollSpeed.toFixed(1)} px</span>
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
								<span class="control-icon">⏱️</span>
								<span class="control-label">Pause am Ende</span>
								<span class="control-value">{pauseDuration}s</span>
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

					<div class="info-box">
						<span class="info-icon">ℹ️</span>
						<span class="info-text">Einstellungen werden automatisch gespeichert</span>
					</div>
				</div>
			{/if}

			<!-- TAB 3: Tage -->
			{#if activeTab === 'days'}
				<div class="tab-panel" transition:fade={{ duration: 200 }}>
					<div class="day-info-banner">
						<span class="day-icon">📅</span>
						<div class="day-info-text">
							<span class="day-info-label">Aktueller Tag:</span>
							<span class="day-info-value">{weekdayNames[$viewWeekday]}</span>
						</div>
					</div>

					<button
						class="action-button copy-button"
						onclick={copyCurrentDay}
					>
						<span class="btn-icon">📋</span>
						<div class="btn-content">
							<span class="btn-label">Tag kopieren</span>
							<span class="btn-hint">Alle Raumkonfigurationen</span>
						</div>
					</button>

					<button
						class="action-button paste-button"
						class:active={copiedDay !== null}
						onclick={pasteToCurrentDay}
						disabled={copiedDay === null}
					>
						<span class="btn-icon">📌</span>
						<div class="btn-content">
							<span class="btn-label">Tag einfügen</span>
							<span class="btn-hint">
								{copiedDay !== null ? `Von ${weekdayNames[copiedDay]}` : 'Zuerst Tag kopieren'}
							</span>
						</div>
					</button>

					<button
						class="action-button delete-button"
						onclick={deleteCurrentDay}
					>
						<span class="btn-icon">🗑️</span>
						<div class="btn-content">
							<span class="btn-label">Tag löschen</span>
							<span class="btn-hint">Alle Konfigurationen entfernen</span>
						</div>
					</button>

					<div class="info-box">
						<span class="info-icon">💡</span>
						<span class="info-text">Nutze die Pfeil-Buttons im Header um zwischen Tagen zu wechseln</span>
					</div>
				</div>
			{/if}

			<!-- TAB 4: Aktionen -->
			{#if activeTab === 'edit'}
				<div class="tab-panel" transition:fade={{ duration: 200 }}>
					<!-- Tagesplaner & Einstellungen -->
					<div class="action-grid">
						<button class="grid-button info" onclick={onOpenScheduler}>
							<span class="grid-icon">📅</span>
							<span class="grid-label">Tagesplaner</span>
						</button>

						<button class="grid-button info" onclick={onOpenSettings}>
							<span class="grid-icon">⚙️</span>
							<span class="grid-label">Einstellungen</span>
						</button>
					</div>

					<!-- Raum erstellen (nur im Edit-Mode) -->
					{#if $isEditMode}
						<button class="action-button" onclick={() => showCreateForm = !showCreateForm}>
							<span class="btn-icon">➕</span>
							<div class="btn-content">
								<span class="btn-label">Raum erstellen</span>
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
							class="action-button swap-button"
							class:active={$swapSelection.length > 0}
							onclick={handleSwap}
							disabled={$swapSelection.length !== 2}
						>
							<span class="btn-icon">⮀</span>
							<div class="btn-content">
								<span class="btn-label">Räume tauschen</span>
								<span class="btn-hint">{$swapSelection.length}/2 ausgewählt</span>
							</div>
						</button>
					{/if}

					<!-- Alle öffnen/schließen -->
					<div class="action-grid">
						<button class="grid-button success" onclick={bulkOpenAllRooms}>
							<span class="grid-icon">✅</span>
							<span class="grid-label">Alle öffnen</span>
						</button>

						<button class="grid-button danger" onclick={bulkCloseAllRooms}>
							<span class="grid-icon">🔒</span>
							<span class="grid-label">Alle schließen</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ✅ FAB Button - Premium Design */
	.fab {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 68px;
		height: 68px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		border: none;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 2px 12px rgba(0, 0, 0, 0.3),
			0 0 40px rgba(59, 130, 246, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		cursor: pointer;
		z-index: 9999;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translateZ(0);
		will-change: transform;
		touch-action: manipulation;
	}

	.fab:hover {
		transform: scale(1.1) rotate(90deg) translateZ(0);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.6),
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.fab:active {
		transform: scale(1.05) translateZ(0);
	}

	.fab.active {
		transform: rotate(180deg) translateZ(0);
		background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
	}

	.fab-icon {
		font-size: 28px;
		color: white;
		font-weight: bold;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	/* ✅ Menu Panel - Premium Card Design */
	.menu-panel {
		position: fixed;
		bottom: 100px;
		right: 20px;
		width: 360px;
		height: 550px; /* ✅ Etwas höher wegen main-buttons */
		background: rgba(0, 0, 0, 0.96);
		backdrop-filter: blur(24px);
		border-radius: 16px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow:
			0 12px 48px rgba(0, 0, 0, 0.8),
			0 4px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		z-index: 9998;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* ✅ Haupt-Buttons oben */
	.main-buttons {
		display: flex;
		gap: 8px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	.big-button {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s;
		color: white;
	}

	.big-button:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.big-button.active {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
	}

	.big-icon {
		font-size: 28px;
		line-height: 1;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.big-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.label-text {
		font-size: 14px;
		font-weight: 700;
		color: white;
	}

	.label-hint {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}

	/* ✅ Tab Navigation Bar */
	.tab-navigation {
		display: flex;
		background: rgba(0, 0, 0, 0.6);
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		padding: 8px;
		gap: 6px;
	}

	.tab-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px 8px;
		background: transparent;
		border: 2px solid transparent;
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.3s;
		min-height: 60px;
		touch-action: manipulation;
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.9);
	}

	.tab-btn.active {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
		border-color: rgba(59, 130, 246, 0.5);
		color: white;
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.tab-icon {
		font-size: 24px;
	}

	.tab-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* ✅ Tab Content Area */
	.tab-content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.tab-panel {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		animation: fadeIn 0.2s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ✅ Action Buttons - Large Touch-Friendly */
	.action-button {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		color: white;
		cursor: pointer;
		transition: all 0.3s;
		text-align: left;
		width: 100%;
		min-height: 64px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		touch-action: manipulation;
	}

	.action-button:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.action-button:active {
		transform: translateY(0);
	}

	.action-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-icon {
		font-size: 28px;
		min-width: 32px;
		text-align: center;
		flex-shrink: 0;
	}

	.btn-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.btn-label {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.btn-hint {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}

	/* ✅ Day Info Banner */
	.day-info-banner {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
		border: 2px solid rgba(59, 130, 246, 0.4);
		border-radius: 14px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.day-icon {
		font-size: 32px;
		min-width: 36px;
		text-align: center;
	}

	.day-info-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.day-info-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(255, 255, 255, 0.7);
	}

	.day-info-value {
		font-size: 18px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.5px;
	}

	/* ✅ Color-Coded Buttons */
	.mode-toggle.active {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow:
			0 0 24px rgba(34, 197, 94, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.copy-button:hover {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.paste-button.active {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow:
			0 0 24px rgba(34, 197, 94, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.delete-button {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.delete-button:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.5);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
	}

	.autoscroll-toggle.active {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow:
			0 0 24px rgba(34, 197, 94, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow:
				0 0 24px rgba(34, 197, 94, 0.4),
				0 4px 12px rgba(0, 0, 0, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.1);
		}
		50% {
			box-shadow:
				0 0 32px rgba(34, 197, 94, 0.6),
				0 4px 12px rgba(0, 0, 0, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.15);
		}
	}

	.swap-button.active {
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 146, 60, 0.3));
		border-color: rgba(245, 158, 11, 0.6);
		box-shadow:
			0 0 24px rgba(245, 158, 11, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* ✅ Scroll Controls */
	.scroll-controls {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 14px;
		padding: 16px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.control-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 4px;
	}

	.control-icon {
		font-size: 20px;
	}

	.control-label {
		flex: 1;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.control-value {
		font-size: 14px;
		font-weight: 700;
		color: var(--color-accent);
		min-width: 50px;
		text-align: right;
	}

	/* ✅ Premium Sliders */
	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		transition: all 0.2s;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.slider:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.4),
			0 0 20px rgba(59, 130, 246, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		transition: all 0.2s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.5),
			0 0 30px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		border: none;
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.4),
			0 0 20px rgba(59, 130, 246, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		transition: all 0.2s;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.5),
			0 0 30px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	/* ✅ Info Box */
	.info-box {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: rgba(59, 130, 246, 0.15);
		border-radius: 12px;
		border: 2px solid rgba(59, 130, 246, 0.3);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.info-icon {
		font-size: 18px;
	}

	.info-text {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	/* ✅ Action Grid - 2 Column Layout */
	.action-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	.grid-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 18px 12px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		color: white;
		cursor: pointer;
		transition: all 0.3s;
		min-height: 80px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		touch-action: manipulation;
	}

	.grid-button:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.grid-icon {
		font-size: 28px;
	}

	.grid-label {
		font-size: 13px;
		font-weight: 600;
		text-align: center;
	}

	/* ✅ Color-Coded Grid Buttons */
	.grid-button.success {
		border-color: rgba(34, 197, 94, 0.3);
	}
	.grid-button.success:hover {
		background: rgba(34, 197, 94, 0.15);
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
	}

	.grid-button.danger {
		border-color: rgba(239, 68, 68, 0.3);
	}
	.grid-button.danger:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.5);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
	}

	.grid-button.info {
		border-color: rgba(59, 130, 246, 0.3);
	}
	.grid-button.info:hover {
		background: rgba(59, 130, 246, 0.15);
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	/* ✅ Create Form */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 14px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
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
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: all 0.3s;
	}

	.create-form input:focus,
	.create-form select:focus {
		outline: none;
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.15);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.2),
			0 0 20px rgba(59, 130, 246, 0.3);
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
		padding: 14px;
		border-radius: 10px;
		font-weight: 700;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.3s;
		border: none;
		min-height: 48px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.form-btn.create {
		background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
		color: white;
	}

	.form-btn.create:hover {
		transform: translateY(-2px);
		box-shadow:
			0 6px 20px rgba(59, 130, 246, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.form-btn.cancel {
		background: rgba(239, 68, 68, 0.2);
		color: white;
		border: 2px solid rgba(239, 68, 68, 0.5);
	}

	.form-btn.cancel:hover {
		background: rgba(239, 68, 68, 0.4);
		border-color: rgba(239, 68, 68, 0.7);
		transform: translateY(-2px);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
	}

	/* ✅ Scrollbar Styling */
	.tab-content::-webkit-scrollbar {
		width: 8px;
	}

	.tab-content::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.tab-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		border: 2px solid rgba(0, 0, 0, 0.2);
	}

	.tab-content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* ✅ Responsive Styles */
	@media (max-width: 768px) {
		.fab {
			width: 60px;
			height: 60px;
			bottom: 16px;
			right: 16px;
		}

		.fab-icon {
			font-size: 24px;
		}

		.menu-panel {
			right: 16px;
			bottom: 85px;
			width: calc(100vw - 32px);
			max-width: 380px;
			height: 450px; /* ✅ Etwas kleiner auf Mobile */
		}

		.tab-btn {
			min-height: 56px;
		}

		.tab-icon {
			font-size: 20px;
		}

		.tab-label {
			font-size: 10px;
		}
	}

	@media (hover: none) and (pointer: coarse) {
		/* ✅ Touch-optimized sizes for iPad */
		.fab {
			width: 68px;
			height: 68px;
		}

		.tab-btn {
			min-height: 60px;
			padding: 14px 10px;
		}

		.action-button {
			min-height: 68px;
			padding: 18px 20px;
		}

		.grid-button {
			min-height: 85px;
			padding: 20px 14px;
		}

		.form-btn {
			min-height: 52px;
			padding: 16px;
		}
	}

	.scale-hints {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
	}

	.hint-label {
		font-size: 10px;
	}
</style>