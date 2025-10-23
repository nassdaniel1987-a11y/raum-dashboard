<script lang="ts">
	import {
		isEditMode,
		bulkOpenAllRooms,
		bulkCloseAllRooms,
		createNewRoom
	} from '$lib/stores/appState';
	import { slide } from 'svelte/transition';

	let showBulkMenu = false;
	let newRoomName = '';

	async function handleBulkOpen() {
		await bulkOpenAllRooms();
		showBulkMenu = false;
	}

	async function handleBulkClose() {
		await bulkCloseAllRooms();
		showBulkMenu = false;
	}

	async function handleCreateRoom() {
		if (newRoomName.trim()) {
			await createNewRoom(newRoomName.trim());
			newRoomName = '';
		}
	}

	function toggleEditMode() {
		isEditMode.update((mode) => !mode);
	}
</script>

<div class="admin-toolbar" transition:slide={{ duration: 300 }}>
	<div class="toolbar-section">
		<button class="mode-toggle" class:active={$isEditMode} on:click={toggleEditMode}>
			{#if $isEditMode}
				<span class="icon">🔓</span>
				<span>Bearbeitungs-Modus</span>
			{:else}
				<span class="icon">🔒</span>
				<span>Anzeige-Modus</span>
			{/if}
		</button>
	</div>

	{#if $isEditMode}
		<div class="toolbar-section" transition:slide={{ axis: 'x', duration: 300 }}>
			<div class="bulk-actions">
				<button class="btn btn-success" on:click={handleBulkOpen}>
					<span class="icon">✓</span>
					Alle öffnen
				</button>

				<button class="btn btn-danger" on:click={handleBulkClose}>
					<span class="icon">🔒</span>
					Alle schließen
				</button>
			</div>
		</div>

		<div class="toolbar-section" transition:slide={{ axis: 'x', duration: 300 }}>
			<div class="create-room">
				<input
					type="text"
					placeholder="Neuer Raum..."
					bind:value={newRoomName}
					on:keydown={(e) => e.key === 'Enter' && handleCreateRoom()}
				/>
				<button class="btn btn-primary" on:click={handleCreateRoom} disabled={!newRoomName.trim()}>
					<span class="icon">➕</span>
					Erstellen
				</button>
			</div>
		</div>
	{/if}

	<div class="toolbar-info">
		{#if $isEditMode}
			<span class="info-text">💡 Klicke auf Räume um Status zu ändern • Ziehe zum Verschieben</span>
		{:else}
			<span class="info-text">👀 Anzeige-Modus aktiv</span>
		{/if}
	</div>
</div>

<style>
	.admin-toolbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
		padding: 20px 40px;
		display: flex;
		align-items: center;
		gap: 30px;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.mode-toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px 30px;
		font-size: 20px;
		font-weight: 700;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		cursor: pointer;
		transition: all 0.3s;
		backdrop-filter: blur(10px);
	}

	.mode-toggle:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.mode-toggle.active {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
	}

	.bulk-actions {
		display: flex;
		gap: 15px;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 24px;
		font-size: 18px;
		font-weight: 600;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s;
		color: white;
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-success {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.btn-danger {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	}

	.icon {
		font-size: 22px;
	}

	.create-room {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.create-room input {
		padding: 12px 20px;
		font-size: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		min-width: 250px;
		backdrop-filter: blur(10px);
	}

	.create-room input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.create-room input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
	}

	.toolbar-info {
		margin-left: auto;
		padding: 12px 24px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.info-text {
		font-size: 16px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	@media (max-width: 1200px) {
		.admin-toolbar {
			padding: 15px 20px;
			gap: 15px;
		}

		.btn {
			font-size: 16px;
			padding: 10px 20px;
		}

		.create-room input {
			min-width: 180px;
			font-size: 16px;
		}
	}
</style>
