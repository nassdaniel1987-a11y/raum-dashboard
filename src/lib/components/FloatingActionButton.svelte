<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, viewWeekday, copyDayConfigs } from '$lib/stores/appState';
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

	// Actions - Reihenfolge für nach-unten-Menü (wichtigste zuerst)
	const actions = [
		{ id: 'new-room', icon: '➕', label: 'Neuer Raum', color: 'blue' },
		{ id: 'open-all', icon: '🔓', label: 'Alle öffnen', color: 'green' },
		{ id: 'close-all', icon: '🔒', label: 'Alle schließen', color: 'red' },
		{ id: 'copy', icon: '📄', label: 'Tag kopieren', color: 'blue' },
		{ id: 'paste', icon: '📋', label: 'Tag einfügen', color: 'blue', disabled: () => copiedDay === null },
		{ id: 'scheduler', icon: '📅', label: 'Tagesplaner', color: 'purple' },
	];

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
		showCreateForm = false;
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

	async function handleAction(actionId: string) {
		switch (actionId) {
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
			{#if showCreateForm}
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
	}

	/* iPad Landscape */
	@media (min-width: 1024px) {
		.fab-container {
			top: 130px;
			right: 32px;
		}
	}
</style>
