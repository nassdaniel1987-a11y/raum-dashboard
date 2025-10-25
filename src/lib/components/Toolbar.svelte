<script lang="ts">
	import { isEditMode, bulkOpenAllRooms, bulkCloseAllRooms, createNewRoom, swapSelection, swapRoomPositions, visibleRooms } from '$lib/stores/appState';
	import { fade, slide } from 'svelte/transition';
	import { get } from 'svelte/store';

	// Svelte 5 Props Syntax
	let { onOpenScheduler, onOpenSettings } = $props<{
		onOpenScheduler: () => void;
		onOpenSettings: () => void;
	}>();

	// Svelte 5 State Syntax
	let newRoomName = $state('');
	let newRoomFloor = $state('eg');
	let showCreateForm = $state(false);

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
</script>

<div class="toolbar" transition:fade>
	<div class="toolbar-left">
		<button
			class="mode-toggle"
			class:active={$isEditMode}
			onclick={() => isEditMode.update(v => !v)}
			aria-label={$isEditMode ? 'Bearbeitungs-Modus deaktivieren' : 'Bearbeitungs-Modus aktivieren'}
		>
			{#if $isEditMode}
				<span class="icon">🔓</span>
				<span class="label">Bearbeitungs-Modus</span>
			{:else}
				<span class="icon">🔒</span>
				<span class="label">Ansicht-Modus</span>
			{/if}
		</button>

		{#if $isEditMode}
			<div class="edit-actions" transition:slide={{ axis: 'x', duration: 300 }}>
				<button class="action-btn" onclick={() => showCreateForm = !showCreateForm} title="Neuen Raum erstellen">
					➕ Raum erstellen
				</button>

				<button class="action-btn" onclick={bulkOpenAllRooms} title="Alle Räume öffnen">
					✅ Alle öffnen
				</button>

				<button class="action-btn" onclick={bulkCloseAllRooms} title="Alle Räume schließen">
					🔒 Alle schließen
				</button>

				<button
					class="action-btn swap-btn"
					class:active={$swapSelection.length > 0}
					onclick={handleSwap}
					disabled={$swapSelection.length !== 2}
					title="Tausche die Position von 2 ausgewählten Räumen"
				>
					⮀ Tauschen ({$swapSelection.length}/2)
				</button>

				<button class="action-btn" onclick={onOpenScheduler} title="Wochenplan verwalten">
					📅 Tagesplan
				</button>

				<button class="action-btn" onclick={onOpenSettings} title="Einstellungen öffnen">
					⚙️ Einstellungen
				</button>
			</div>
		{/if}
	</div>

	{#if showCreateForm && $isEditMode}
		<div class="create-form" transition:slide={{ duration: 300 }}>
			<input
				type="text"
				bind:value={newRoomName}
				placeholder="Raum-Name eingeben..."
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
			<button class="create-btn" onclick={handleCreateRoom}>Erstellen</button>
			<button class="cancel-btn" onclick={() => showCreateForm = false}>✕</button>
		</div>
	{/if}
</div>

<style>
	.toolbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		z-index: 100;
		gap: 12px;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.mode-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 12px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.mode-toggle:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.mode-toggle.active {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
	}

	.icon {
		font-size: 18px;
	}

	.edit-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		color: white;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		white-space: nowrap;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.swap-btn.active {
		background: rgba(245, 158, 11, 0.3);
		border-color: rgba(245, 158, 11, 0.6);
	}

	.create-form {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 12px;
	}

	.create-form input {
		padding: 8px 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		min-width: 200px;
	}

	.create-form input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.create-form select {
		padding: 8px 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		cursor: pointer;
	}

	.create-form select option {
		background: #1e3a8a;
		color: white;
	}

	.create-btn {
		padding: 8px 16px;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: none;
		border-radius: 8px;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.create-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
	}

	.cancel-btn {
		padding: 8px 12px;
		background: rgba(239, 68, 68, 0.3);
		border: 2px solid rgba(239, 68, 68, 0.5);
		border-radius: 8px;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.cancel-btn:hover {
		background: rgba(239, 68, 68, 0.5);
	}

	@media (max-width: 1024px) {
		.toolbar {
			height: auto;
			padding: 10px;
		}

		.toolbar-left {
			flex-direction: column;
			align-items: stretch;
		}

		.edit-actions {
			flex-wrap: wrap;
		}

		.label {
			display: none;
		}
	}
</style>