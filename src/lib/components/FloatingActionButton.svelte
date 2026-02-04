<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, viewWeekday, copyDayConfigs, visibleRooms, rooms } from '$lib/stores/appState';
	import { supabase } from '$lib/supabase/client';
	import { toasts } from '$lib/stores/toastStore';
	import { fade, fly, slide } from 'svelte/transition';
	import { get } from 'svelte/store';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// Props
	let { onOpenScheduler, onOpenNewRoom } = $props<{
		onOpenScheduler?: () => void;
		onOpenNewRoom?: () => void;
	}>();

	// State
	let isOpen = $state(false);
	let copiedDay = $state<number | null>(null);

	// Raum-Erstellung State
	let showCreateForm = $state(false);
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');

	// Personen-Übersicht State
	let showPersonsPanel = $state(false);
	let personInputs = $state<Record<string, string>>({});
	let saveTimeouts = $state<Record<string, ReturnType<typeof setTimeout>>>({});

	// Actions - Reihenfolge für nach-unten-Menü (wichtigste zuerst)
	const actions = [
		{ id: 'persons', icon: '👥', label: 'Besetzung', color: 'orange' },
		{ id: 'new-room', icon: '➕', label: 'Neuer Raum', color: 'blue' },
		{ id: 'open-all', icon: '🔓', label: 'Alle öffnen', color: 'green' },
		{ id: 'close-all', icon: '🔒', label: 'Alle schließen', color: 'red' },
		{ id: 'copy', icon: '📄', label: 'Tag kopieren', color: 'blue' },
		{ id: 'paste', icon: '📋', label: 'Tag einfügen', color: 'blue', disabled: () => copiedDay === null },
		{ id: 'scheduler', icon: '📅', label: 'Tagesplaner', color: 'purple' },
	];

	// Aktive Räume (offen) für Personen-Panel
	let activeRooms = $derived($visibleRooms.filter(r => r.isOpen).sort((a, b) => {
		// Sortiere nach Stockwerk, dann nach Position
		const floorOrder = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];
		const floorDiff = floorOrder.indexOf(a.floor) - floorOrder.indexOf(b.floor);
		if (floorDiff !== 0) return floorDiff;
		return a.position_x - b.position_x;
	}));

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
		showCreateForm = false;
		showPersonsPanel = false;
	}

	async function handleCreateRoom() {
		if (!newRoomName.trim()) {
			toasts.show('Bitte Raum-Namen eingeben!', 'error');
			return;
		}

		await createNewRoom(newRoomName.trim(), newRoomFloor);
		toasts.show(`✓ Raum "${newRoomName}" erstellt!`, 'success');
		newRoomName = '';
		newRoomFloor = 'eg';
		closeMenu();
	}

	function cancelCreateRoom() {
		showCreateForm = false;
		newRoomName = '';
		newRoomFloor = 'eg';
	}

	function openPersonsPanel() {
		showPersonsPanel = true;
		// Initialisiere Input-Werte mit aktuellen Personen
		personInputs = {};
		for (const room of activeRooms) {
			personInputs[room.id] = room.person || '';
		}
	}

	async function savePersonForRoom(roomId: string, personName: string) {
		try {
			const { error } = await supabase
				.from('rooms')
				.update({ person: personName || null })
				.eq('id', roomId);

			if (error) throw error;

			// Basis-Store "rooms" aktualisieren (visibleRooms ist derived und aktualisiert sich automatisch)
			rooms.update(roomList =>
				roomList.map(r => r.id === roomId ? { ...r, person: personName || null } : r)
			);
		} catch (err) {
			console.error('Fehler beim Speichern:', err);
			toasts.show('Fehler beim Speichern!', 'error');
		}
	}

	function handlePersonInput(roomId: string, value: string) {
		personInputs[roomId] = value;

		// Debounce: Vorheriges Timeout löschen
		if (saveTimeouts[roomId]) {
			clearTimeout(saveTimeouts[roomId]);
		}

		// Auto-Save nach 500ms Verzögerung
		saveTimeouts[roomId] = setTimeout(() => {
			savePersonForRoom(roomId, value);
		}, 500);
	}

	function getFloorLabel(floor: string): string {
		const labels: Record<string, string> = {
			dach: 'Dachgeschoss',
			og2: '2. OG',
			og1: '1. OG',
			eg: 'Erdgeschoss',
			essen: 'Essen',
			ug: 'Untergeschoss',
			extern: 'Außenbereich'
		};
		return labels[floor] || floor;
	}

	async function handleAction(actionId: string) {
		switch (actionId) {
			case 'persons':
				openPersonsPanel();
				break;

			case 'new-room':
				if (onOpenNewRoom) {
					closeMenu();
					onOpenNewRoom();
				} else {
					// Zeige Inline-Formular
					showCreateForm = true;
				}
				break;

			case 'open-all':
				await bulkOpenAllRooms();
				toasts.show('🔓 Alle Räume geöffnet!', 'success');
				closeMenu();
				break;

			case 'close-all':
				await bulkCloseAllRooms();
				toasts.show('🔒 Alle Räume geschlossen!', 'success');
				closeMenu();
				break;

			case 'copy':
				copiedDay = get(viewWeekday);
				toasts.show(`📋 ${weekdayNames[copiedDay]} kopiert!`, 'success');
				closeMenu();
				break;

			case 'paste':
				if (copiedDay !== null) {
					const currentDay = get(viewWeekday);
					if (copiedDay === currentDay) {
						toasts.show('⚠️ Quell- und Ziel-Tag sind identisch!', 'error');
					} else {
						const confirmText = `${weekdayNames[copiedDay]} nach ${weekdayNames[currentDay]} kopieren?`;
						if (confirm(confirmText)) {
							const count = await copyDayConfigs(copiedDay, currentDay);
							toasts.show(`✓ ${count} Konfigurationen eingefügt!`, 'success');
						}
					}
				}
				closeMenu();
				break;

			case 'scheduler':
				closeMenu();
				if (onOpenScheduler) {
					onOpenScheduler();
				}
				break;
		}
	}

	function getActionColor(color: string) {
		const colors: Record<string, string> = {
			blue: 'rgba(59, 130, 246, 0.9)',
			green: 'rgba(34, 197, 94, 0.9)',
			red: 'rgba(239, 68, 68, 0.9)',
			purple: 'rgba(168, 85, 247, 0.9)',
			orange: 'rgba(249, 115, 22, 0.9)'
		};
		return colors[color] || colors.blue;
	}
</script>

{#if $isEditMode}
	<div class="fab-container">
		<!-- Overlay wenn offen -->
		{#if isOpen}
			<div
				class="fab-overlay"
				onclick={closeMenu}
				transition:fade={{ duration: 150 }}
			></div>
		{/if}

		<!-- Main FAB Button (jetzt oben) -->
		<button
			class="fab-main"
			class:open={isOpen}
			onclick={toggleMenu}
			title="Schnellaktionen"
		>
			<span class="fab-icon">{isOpen ? '✕' : '⚡'}</span>
		</button>

		<!-- Speed Dial Actions (jetzt nach unten) -->
		{#if isOpen}
			{#if showPersonsPanel}
				<!-- Personen-Übersicht Panel -->
				<div class="persons-panel" transition:slide={{ duration: 200 }}>
					<div class="panel-header">
						<span class="panel-icon">👥</span>
						<span class="panel-title">Besetzung</span>
						<button class="panel-close" onclick={() => showPersonsPanel = false}>✕</button>
					</div>

					{#if activeRooms.length === 0}
						<div class="empty-state">
							<p>Keine offenen Räume</p>
							<span class="hint">Öffne zuerst Räume, um Personen zuzuweisen</span>
						</div>
					{:else}
						<div class="rooms-list">
							{#each activeRooms as room (room.id)}
								<div class="room-item">
									<div class="room-info">
										<span class="room-name">{room.name}</span>
										<span class="room-floor">{getFloorLabel(room.floor)}</span>
									</div>
									<input
										type="text"
										class="person-input"
										value={personInputs[room.id] || ''}
										placeholder="Person eingeben..."
										oninput={(e) => handlePersonInput(room.id, (e.target as HTMLInputElement).value)}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if showCreateForm}
				<!-- Inline Raum-Erstellung Formular -->
				<div class="create-form" transition:slide={{ duration: 200 }}>
					<div class="form-header">
						<span class="form-icon">➕</span>
						<span class="form-title">Neuer Raum</span>
					</div>
					<input
						type="text"
						class="form-input"
						bind:value={newRoomName}
						placeholder="Raum-Name..."
						onkeydown={(e) => e.key === 'Enter' && handleCreateRoom()}
					/>
					<select class="form-select" bind:value={newRoomFloor}>
						<option value="extern">Außenbereich</option>
						<option value="dach">Dachgeschoss</option>
						<option value="og2">2. OG</option>
						<option value="og1">1. OG</option>
						<option value="eg">Erdgeschoss</option>
						<option value="essen">Essen</option>
						<option value="ug">Untergeschoss</option>
					</select>
					<div class="form-buttons">
						<button class="form-btn create" onclick={handleCreateRoom}>Erstellen</button>
						<button class="form-btn cancel" onclick={cancelCreateRoom}>Abbrechen</button>
					</div>
				</div>
			{:else}
				<div class="fab-actions" transition:fade={{ duration: 150 }}>
					{#each actions as action, i}
						{@const isDisabled = action.disabled?.() ?? false}
						<button
							class="fab-action"
							class:disabled={isDisabled}
							style="background: {getActionColor(action.color)};"
							onclick={() => !isDisabled && handleAction(action.id)}
							disabled={isDisabled}
							title={action.label}
							transition:fly={{ y: -20, duration: 200, delay: i * 30 }}
						>
							<span class="action-icon">{action.icon}</span>
							<span class="action-label">{action.label}</span>
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.fab-container {
		position: fixed;
		/* Oben rechts, unter Header + DailyHighlights */
		top: 120px;
		right: 24px;
		z-index: 9000;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.fab-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: -1;
	}

	.fab-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
		margin-top: 8px;
	}

	.fab-action {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border: none;
		border-radius: 28px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s, box-shadow 0.2s;
		white-space: nowrap;
	}

	.fab-action:hover:not(.disabled) {
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	.fab-action:active:not(.disabled) {
		transform: scale(0.98);
	}

	.fab-action.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-icon {
		font-size: 20px;
		line-height: 1;
	}

	.action-label {
		font-size: 14px;
		letter-spacing: 0.3px;
	}

	.fab-main {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: none;
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		font-size: 28px;
		cursor: pointer;
		box-shadow:
			0 6px 20px rgba(59, 130, 246, 0.5),
			0 3px 10px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fab-main:hover {
		transform: scale(1.1);
		box-shadow:
			0 8px 25px rgba(59, 130, 246, 0.6),
			0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.fab-main:active {
		transform: scale(0.95);
	}

	.fab-main.open {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		box-shadow:
			0 6px 20px rgba(239, 68, 68, 0.5),
			0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.fab-main.open:hover {
		box-shadow:
			0 8px 25px rgba(239, 68, 68, 0.6),
			0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.fab-icon {
		line-height: 1;
		transition: transform 0.3s;
	}

	.fab-main.open .fab-icon {
		transform: rotate(90deg);
	}

	/* Personen-Panel */
	.persons-panel {
		background: rgba(30, 35, 50, 0.98);
		border-radius: 16px;
		min-width: 300px;
		max-width: 350px;
		max-height: 400px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
	}

	.panel-icon {
		font-size: 20px;
	}

	.panel-title {
		flex: 1;
		color: white;
		font-size: 16px;
		font-weight: 600;
	}

	.panel-close {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.panel-close:hover {
		background: rgba(239, 68, 68, 0.3);
		color: white;
	}

	.rooms-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.room-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		margin-bottom: 8px;
	}

	.room-item:last-child {
		margin-bottom: 0;
	}

	.room-info {
		flex: 0 0 100px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.room-name {
		font-size: 13px;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.room-floor {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.5);
	}

	.person-input {
		flex: 1;
		padding: 8px 10px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 13px;
		transition: all 0.2s;
	}

	.person-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.person-input:focus {
		outline: none;
		border-color: rgba(249, 115, 22, 0.6);
		background: rgba(255, 255, 255, 0.15);
	}

	.empty-state {
		padding: 24px 16px;
		text-align: center;
	}

	.empty-state p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		margin: 0 0 4px 0;
	}

	.empty-state .hint {
		color: rgba(255, 255, 255, 0.4);
		font-size: 12px;
	}

	/* Scrollbar für Räume-Liste */
	.rooms-list::-webkit-scrollbar {
		width: 6px;
	}

	.rooms-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.rooms-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	/* Raum-Erstellung Formular */
	.create-form {
		background: rgba(30, 35, 50, 0.98);
		border-radius: 16px;
		padding: 16px;
		min-width: 240px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.form-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.form-icon {
		font-size: 20px;
	}

	.form-title {
		color: white;
		font-size: 16px;
		font-weight: 600;
	}

	.form-input,
	.form-select {
		width: 100%;
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		margin-bottom: 10px;
		box-sizing: border-box;
	}

	.form-input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: #3b82f6;
		background: rgba(255, 255, 255, 0.15);
	}

	.form-select option {
		background: #1e2332;
		color: white;
	}

	.form-buttons {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.form-btn {
		flex: 1;
		padding: 10px 16px;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, opacity 0.2s;
	}

	.form-btn:hover {
		transform: scale(1.02);
	}

	.form-btn:active {
		transform: scale(0.98);
	}

	.form-btn.create {
		background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
		color: white;
	}

	.form-btn.cancel {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.form-btn.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Mobile/Tablet Anpassungen */
	@media (max-width: 768px) {
		.fab-container {
			top: 110px;
			right: 16px;
		}

		.fab-main {
			width: 56px;
			height: 56px;
			font-size: 24px;
		}

		.fab-action {
			padding: 10px 14px;
		}

		.action-label {
			font-size: 13px;
		}

		.create-form {
			min-width: 220px;
			padding: 14px;
		}

		.form-input,
		.form-select {
			padding: 10px;
		}

		.persons-panel {
			min-width: 280px;
			max-width: 300px;
			max-height: 350px;
		}

		.room-info {
			flex: 0 0 80px;
		}

		.room-name {
			font-size: 12px;
		}
	}

	/* iPad Landscape */
	@media (min-width: 1024px) {
		.fab-container {
			top: 130px;
			right: 32px;
		}
	}
</style>
