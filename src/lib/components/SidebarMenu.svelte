<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, swapSelection, swapRoomPositions, visibleRooms, viewWeekday, copyDayConfigs, deleteDayConfigs, cardTheme, appSettings, userTheme, updateRunnerName as updateRunnerNameInDb } from '$lib/stores/appState';
	import { getAllThemes } from '$lib/cardThemes';
	import { themes as uiThemes, applyTheme } from '$lib/themes';
	import { toasts } from '$lib/stores/toastStore';
	import { supabase } from '$lib/supabase/client';
	import { fade, scale } from 'svelte/transition';
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
	let activeTab = $state<'dashboard' | 'planning' | 'design' | 'system'>('dashboard');
	let autoPageActive = $state(true);
	let pageDuration = $state(8);
	let animationType = $state<'book' | 'slide' | 'fade' | 'cube'>('book');
	let displayScaleX = $state(1.0);
	let cardWidth = $state(1.0);
	let cardHeight = $state(1.0);
	let isFullscreen = $state(false);
	let copiedDay = $state<number | null>(null);
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');
	let showCreateForm = $state(false);

	// Drag state
	let isDragging = $state(false);
	let dragX = $state(0);
	let dragY = $state(0);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let initialX = $state(0);
	let initialY = $state(0);

	// Nachtruhe
	let nightModeEnabled = $state($appSettings?.night_mode_enabled ?? true);
	let nightStart = $state($appSettings?.night_start || '17:00');
	let nightEnd = $state($appSettings?.night_end || '07:00');

	// Läufer (Ansprechpartner) - aus appSettings
	let runnerName = $state($appSettings?.runner_name || '');

	// Sync runnerName wenn sich appSettings ändert (Realtime von anderem Tablet)
	$effect(() => {
		if ($appSettings?.runner_name !== undefined) {
			runnerName = $appSettings.runner_name || '';
		}
	});

	// UI-Theme
	let currentUITheme = $state($userTheme);

	onMount(() => {
		const savedPageDuration = localStorage.getItem('pageDuration');
		const savedAutoPage = localStorage.getItem('autoPageEnabled');
		const savedAnimationType = localStorage.getItem('animationType');
		const savedScaleX = localStorage.getItem('displayScaleX');
		const savedCardWidth = localStorage.getItem('cardWidth');
		const savedCardHeight = localStorage.getItem('cardHeight');

		if (savedPageDuration) pageDuration = parseInt(savedPageDuration);
		if (savedAutoPage) autoPageActive = savedAutoPage === 'true';
		if (savedAnimationType) animationType = savedAnimationType as typeof animationType;
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

		// Vollbild-Status
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

	function toggleAutoPage() {
		if (canvasRef?.toggleAutoPage) {
			autoPageActive = canvasRef.toggleAutoPage();
		}
	}

	function updatePageDuration() {
		localStorage.setItem('pageDuration', pageDuration.toString());
		if (canvasRef?.setPageDuration) {
			canvasRef.setPageDuration(pageDuration);
		}
	}

	function selectAnimationType(type: typeof animationType) {
		animationType = type;
		localStorage.setItem('animationType', type);
		if (canvasRef?.setAnimationType) {
			canvasRef.setAnimationType(type);
		}
	}

	async function updateRunnerName() {
		try {
			await updateRunnerNameInDb(runnerName);
		} catch (error) {
			console.error('Fehler beim Speichern des Läufers:', error);
			toasts.show('Fehler beim Speichern!', 'error');
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

	// Reset drag position when modal opens
	$effect(() => {
		if (isOpen) {
			dragX = 0;
			dragY = 0;
		}
	});

	function handleDragStart(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		initialX = dragX;
		initialY = dragY;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handleDragMove(e: PointerEvent) {
		if (!isDragging) return;
		dragX = initialX + (e.clientX - dragStartX);
		dragY = initialY + (e.clientY - dragStartY);
	}

	function handleDragEnd(e: PointerEvent) {
		isDragging = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}
</script>

{#if isOpen}
	<!-- Overlay -->
	<div class="overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="-1" transition:fade={{ duration: 150 }}></div>

	<!-- Frei schwebendes Modal -->
	<aside
		class="settings-modal"
		class:dragging={isDragging}
		style="transform: translate(calc(-50% + {dragX}px), calc(-50% + {dragY}px));"
		transition:scale={{ duration: 200, start: 0.95 }}
	>
		<!-- Header (zum Ziehen) -->
		<div
			class="sidebar-header drag-handle"
			onpointerdown={handleDragStart}
			onpointermove={handleDragMove}
			onpointerup={handleDragEnd}
			onpointercancel={handleDragEnd}
		>
			<div class="drag-indicator">
				<span class="drag-dots"></span>
			</div>
			<h2>Einstellungen</h2>
			<button class="close-btn" onclick={onClose} aria-label="Schließen">✕</button>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button class="tab" class:active={activeTab === 'dashboard'} onclick={() => activeTab = 'dashboard'}>
				Dashboard
			</button>
			<button class="tab" class:active={activeTab === 'planning'} onclick={() => activeTab = 'planning'}>
				Planung
			</button>
			<button class="tab" class:active={activeTab === 'design'} onclick={() => activeTab = 'design'}>
				Design
			</button>
			<button class="tab" class:active={activeTab === 'system'} onclick={() => activeTab = 'system'}>
				System
			</button>
		</div>

		<!-- Content -->
		<div class="content">
			{#if activeTab === 'dashboard'}
				<div class="tab-content" transition:fade={{ duration: 150 }}>
					<!-- Seiten-Wechsel Einstellungen -->
					<section class="section">
						<h3>Seiten-Wechsel</h3>

						<div class="toggle-item">
							<div class="toggle-label">
								<span class="label">Auto-Wechsel</span>
								<span class="hint">Seiten automatisch durchblättern</span>
							</div>
							<label class="switch">
								<input type="checkbox" bind:checked={autoPageActive} onchange={toggleAutoPage} />
								<span class="switch-slider"></span>
							</label>
						</div>

						<div class="slider-item">
							<label>Anzeigedauer pro Seite</label>
							<div class="slider-control">
								<input type="range" min="3" max="30" step="1" bind:value={pageDuration} oninput={updatePageDuration} />
								<span class="value">{pageDuration}s</span>
							</div>
						</div>

						<div class="animation-selector">
							<label>Animation</label>
							<div class="animation-options">
								<button
									class="anim-btn"
									class:active={animationType === 'book'}
									onclick={() => selectAnimationType('book')}
									title="Buchseite"
								>📖</button>
								<button
									class="anim-btn"
									class:active={animationType === 'slide'}
									onclick={() => selectAnimationType('slide')}
									title="Schieben"
								>➡️</button>
								<button
									class="anim-btn"
									class:active={animationType === 'fade'}
									onclick={() => selectAnimationType('fade')}
									title="Überblenden"
								>✨</button>
								<button
									class="anim-btn"
									class:active={animationType === 'cube'}
									onclick={() => selectAnimationType('cube')}
									title="Würfel"
								>🎲</button>
							</div>
						</div>
					</section>

					<!-- Läufer (Ansprechpartner) -->
					<section class="section">
						<h3>Läufer im Haus</h3>
						<div class="runner-input">
							<input
								type="text"
								bind:value={runnerName}
								placeholder="Name eingeben..."
								oninput={updateRunnerName}
							/>
							{#if runnerName}
								<button class="clear-btn" onclick={() => { runnerName = ''; updateRunnerName(); }} title="Löschen">✕</button>
							{/if}
						</div>
						<p class="hint-text">Wird auf allen Seiten als "Ansprechpartner im Haus" angezeigt</p>
					</section>

					<!-- Raumsteuerung -->
					<section class="section">
						<h3>Raumsteuerung</h3>
						<div class="button-row">
							<button class="btn btn-success" onclick={bulkOpenAllRooms}>Alle öffnen</button>
							<button class="btn btn-danger" onclick={bulkCloseAllRooms}>Alle schließen</button>
						</div>
					</section>

					<!-- Tagesplaner -->
					<section class="section">
						<h3>Tagesplaner</h3>
						<button class="btn btn-primary full-width" onclick={() => { onOpenScheduler(); onClose(); }}>
							Tagesplaner öffnen
						</button>
					</section>
				</div>

			{:else if activeTab === 'planning'}
				<div class="tab-content" transition:fade={{ duration: 150 }}>
					<section class="section">
						<div class="info-box">
							<span class="info-label">Aktueller Tag</span>
							<span class="info-value">{weekdayNames[$viewWeekday]}</span>
						</div>
					</section>

					<section class="section">
						<h3>Tagesverwaltung</h3>
						<button class="btn full-width" onclick={copyCurrentDay}>
							Tag kopieren
						</button>
						<button class="btn full-width" onclick={pasteToCurrentDay} disabled={copiedDay === null}>
							{copiedDay !== null ? `Einfügen (${weekdayNames[copiedDay]})` : 'Einfügen'}
						</button>
						<button class="btn btn-danger full-width" onclick={deleteCurrentDay}>
							Tag löschen
						</button>
					</section>
				</div>

			{:else if activeTab === 'design'}
				<div class="tab-content" transition:fade={{ duration: 150 }}>
					<!-- Kachel-Theme -->
					<section class="section">
						<h3>Kachel-Theme</h3>
						<div class="theme-grid">
							{#each allCardThemes as theme}
								<button
									class="theme-item"
									class:active={$cardTheme === theme.name}
									onclick={() => selectCardTheme(theme.name)}
									title={theme.displayName}
								>
									<span class="emoji">{theme.emoji}</span>
									<span class="name">{theme.displayName}</span>
								</button>
							{/each}
						</div>
					</section>

					<!-- Hintergrund-Theme -->
					<section class="section">
						<h3>Hintergrund-Theme</h3>
						<div class="theme-grid compact">
							{#each allUIThemes as theme}
								<button
									class="theme-item"
									class:active={currentUITheme === theme.id}
									onclick={() => selectUITheme(theme.id)}
									style="background: {theme.colors.cardBg};"
									title={theme.name}
								>
									<span class="emoji">{theme.emoji}</span>
								</button>
							{/each}
						</div>
					</section>

					<!-- Größen -->
					<section class="section">
						<h3>Größen</h3>
						<div class="slider-item">
							<label>Kachel-Breite</label>
							<div class="slider-control">
								<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardWidth} oninput={updateCardWidth} />
								<span class="value">{(cardWidth * 100).toFixed(0)}%</span>
							</div>
						</div>

						<div class="slider-item">
							<label>Kachel-Höhe</label>
							<div class="slider-control">
								<input type="range" min="0.6" max="1.4" step="0.05" bind:value={cardHeight} oninput={updateCardHeight} />
								<span class="value">{(cardHeight * 100).toFixed(0)}%</span>
							</div>
						</div>

						<div class="slider-item">
							<label>Display-Breite</label>
							<div class="slider-control">
								<input type="range" min="0.5" max="1.0" step="0.01" bind:value={displayScaleX} oninput={updateDisplayScale} />
								<span class="value">{(displayScaleX * 100).toFixed(0)}%</span>
							</div>
						</div>
					</section>
				</div>

			{:else if activeTab === 'system'}
				<div class="tab-content" transition:fade={{ duration: 150 }}>
					<!-- Nachtruhe -->
					<section class="section">
						<h3>Nachtruhe-Modus</h3>
						<div class="toggle-item">
							<div class="toggle-label">
								<span class="label">Aktiviert</span>
								<span class="hint">Räume automatisch schließen</span>
							</div>
							<label class="switch">
								<input type="checkbox" bind:checked={nightModeEnabled} onchange={saveNightModeSettings} />
								<span class="switch-slider"></span>
							</label>
						</div>

						{#if nightModeEnabled}
							<div class="subsection" transition:slide={{ duration: 200 }}>
								<div class="time-row">
									<div class="time-field">
										<label>Beginnt</label>
										<input type="time" bind:value={nightStart} onchange={saveNightModeSettings} />
									</div>
									<div class="time-field">
										<label>Endet</label>
										<input type="time" bind:value={nightEnd} onchange={saveNightModeSettings} />
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- Raumverwaltung -->
					{#if $isEditMode}
						<section class="section">
							<h3>Raumverwaltung</h3>

							{#if !showCreateForm}
								<button class="btn full-width" onclick={() => showCreateForm = true}>
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
										<option value="essen">Essen</option>
										<option value="ug">Untergeschoss</option>
									</select>
									<div class="button-row">
										<button class="btn btn-success" onclick={handleCreateRoom}>Erstellen</button>
										<button class="btn" onclick={() => showCreateForm = false}>Abbrechen</button>
									</div>
								</div>
							{/if}

							<button class="btn full-width" onclick={handleSwap} disabled={$swapSelection.length !== 2}>
								Räume tauschen ({$swapSelection.length}/2)
							</button>
						</section>
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
		background: rgba(0, 0, 0, 0.5);
		z-index: 9998;
	}

	/* Frei schwebendes Modal */
	.settings-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		/* transform wird per inline-style gesetzt */
		width: 90%;
		max-width: 500px;
		max-height: 85vh;
		background: rgba(20, 25, 35, 0.98);
		box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		border-radius: 20px;
		overflow: hidden;
		backdrop-filter: blur(20px);
		transition: box-shadow 0.2s;
	}

	.settings-modal.dragging {
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15);
	}

	/* Drag Handle im Header */
	.drag-handle {
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.drag-indicator {
		position: absolute;
		left: 50%;
		top: 6px;
		transform: translateX(-50%);
	}

	.drag-dots {
		display: block;
		width: 40px;
		height: 4px;
		background: rgba(255, 255, 255, 0.25);
		border-radius: 2px;
	}

	.sidebar-header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px 16px 20px;
		background: transparent;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: white;
		letter-spacing: 0.3px;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: white;
		font-size: 18px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.tabs {
		display: flex;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tab {
		flex: 1;
		padding: 12px 8px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tab:hover {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: white;
		border-bottom-color: rgba(59, 130, 246, 0.8);
		background: rgba(59, 130, 246, 0.1);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		min-height: 500px;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 16px;
	}

	.section h3 {
		margin: 0 0 16px 0;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.toggle-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.toggle-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.toggle-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.toggle-label .label {
		font-size: 14px;
		font-weight: 500;
		color: white;
	}

	.toggle-label .hint {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.5);
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
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
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		transition: all 0.2s;
	}

	.switch-slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background: white;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.switch input:checked + .switch-slider {
		background: rgba(59, 130, 246, 0.8);
	}

	.switch input:checked + .switch-slider:before {
		transform: translateX(20px);
	}

	.subsection {
		margin-top: 12px;
		padding: 14px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.slider-item {
		margin-bottom: 16px;
	}

	.slider-item:last-child {
		margin-bottom: 0;
	}

	.slider-item label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.slider-control {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.slider-control input[type="range"] {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
	}

	.slider-control input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.slider-control input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.slider-control input[type="range"]::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.slider-control input[type="range"]::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	.slider-control .value {
		font-size: 14px;
		font-weight: 700;
		color: white;
		min-width: 60px;
		text-align: right;
		font-family: 'Courier New', monospace;
	}

	/* Animation Selector */
	.animation-selector {
		margin-top: 16px;
	}

	.animation-selector label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.animation-options {
		display: flex;
		gap: 8px;
	}

	.anim-btn {
		flex: 1;
		padding: 12px;
		font-size: 22px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.anim-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(1.05);
	}

	.anim-btn.active {
		background: rgba(59, 130, 246, 0.4);
		border-color: rgba(59, 130, 246, 0.8);
		box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
	}

	/* Läufer Input */
	.runner-input {
		display: flex;
		align-items: center;
		gap: 8px;
		position: relative;
	}

	.runner-input input {
		flex: 1;
		padding: 12px 14px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.08);
		color: white;
		font-size: 15px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.runner-input input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.12);
	}

	.runner-input input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.runner-input .clear-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.runner-input .clear-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.hint-text {
		margin: 8px 0 0 0;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.5);
	}

	.button-row {
		display: flex;
		gap: 8px;
	}

	.btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 13px;
		font-weight: 500;
		padding: 10px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
	}

	.btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn.full-width {
		width: 100%;
		margin-bottom: 8px;
	}

	.btn.full-width:last-child {
		margin-bottom: 0;
	}

	.btn-primary {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.5);
	}

	.btn-primary:hover {
		background: rgba(59, 130, 246, 0.4);
		border-color: rgba(59, 130, 246, 0.6);
	}

	.btn-success {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.btn-success:hover {
		background: rgba(34, 197, 94, 0.4);
		border-color: rgba(34, 197, 94, 0.6);
	}

	.btn-danger {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.btn-danger:hover {
		background: rgba(239, 68, 68, 0.4);
		border-color: rgba(239, 68, 68, 0.6);
	}

	.info-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: rgba(59, 130, 246, 0.15);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 6px;
	}

	.info-label {
		font-size: 11px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-value {
		font-size: 16px;
		font-weight: 700;
		color: white;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.theme-grid.compact {
		grid-template-columns: repeat(4, 1fr);
	}

	.theme-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 70px;
	}

	.theme-item:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.theme-item.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
	}

	.theme-item .emoji {
		font-size: 28px;
		margin-bottom: 4px;
	}

	.theme-grid.compact .theme-item .emoji {
		font-size: 24px;
		margin-bottom: 0;
	}

	.theme-item .name {
		font-size: 11px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
	}

	.time-row {
		display: flex;
		gap: 12px;
	}

	.time-field {
		flex: 1;
	}

	.time-field label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.time-field input[type="time"] {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 13px;
		font-weight: 500;
	}

	.time-field input[type="time"]:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.1);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		margin-bottom: 8px;
	}

	.create-form input[type="text"],
	.create-form select {
		padding: 10px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 13px;
		font-weight: 500;
	}

	.create-form input[type="text"]:focus,
	.create-form select:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.1);
	}

	.create-form input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.content::-webkit-scrollbar {
		width: 8px;
	}

	.content::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
	}

	.content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	@media (max-width: 768px) {
		.settings-modal {
			max-height: 90vh;
		}

		.theme-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.tab {
			font-size: 11px;
			padding: 12px 8px;
		}

		.content {
			min-height: 400px;
		}
	}

	@media (max-width: 480px) {
		.settings-modal {
			max-height: 95vh;
			border-radius: 16px 16px 0 0;
		}

		.theme-grid.compact {
			grid-template-columns: repeat(3, 1fr);
		}

		.section {
			padding: 12px;
		}
	}

	/* iPad/Tablet optimiert */
	@media (min-width: 769px) {
		.settings-modal {
			max-height: 70vh;
			max-width: 800px;
		}
	}
</style>
