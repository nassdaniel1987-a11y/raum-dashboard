<script lang="ts">
	import {
		isEditMode,
		bulkOpenAllRooms,
		bulkCloseAllRooms,
		createNewRoom,
		swapSelection,
		swapRoomPositions,
		visibleRooms
	} from '$lib/stores/appState';
	import { slide } from 'svelte/transition';
	import { get } from 'svelte/store';

	// Prop für den Scheduler wieder hinzugefügt
	export let onOpenScheduler: () => void;
	export let onOpenSettings: () => void;

	let newRoomName = '';
	let newRoomFloor = 'eg';
	// Standard: Erdgeschoss

	function toggleFullscreen() {
		if (typeof document === 'undefined') return;
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable full-screen mode: ${err.message}`);
			});
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}

	async function handleBulkOpen() {
		await bulkOpenAllRooms();
	}

	async function handleBulkClose() {
		await bulkCloseAllRooms();
	}

	async function handleCreateRoom() {
		if (newRoomName.trim()) {
			await createNewRoom(newRoomName.trim(), newRoomFloor);
			newRoomName = '';
			newRoomFloor = 'eg'; // Zurücksetzen
		}
	}

	function toggleEditMode() {
		isEditMode.update((mode) => !mode);
		swapSelection.set([]);
	}

	async function handleSwap() {
		const $swapIds = get(swapSelection);
		if ($swapIds.length !== 2) return;

		const [id1, id2] = $swapIds;
		const allRooms = get(visibleRooms);
		
		const room1 = allRooms.find(r => r.id === id1);
		const room2 = allRooms.find(r => r.id === id2);

		if (room1 && room2 && room1.floor === room2.floor) {
			swapRoomPositions(room1, room2);
		} else if (room1 && room2 && room1.floor !== room2.floor) {
			alert('Fehler: Räume müssen im selben Stockwerk sein, um sie zu tauschen.');
		}
		
		swapSelection.set([]);
	}
</script>

<div class="admin-toolbar" transition:slide={{ duration: 300 }}>
	{#if $isEditMode}
		<div class="toolbar-section" transition:slide={{ axis: 'x', duration: 300 }}>
			<div class="create-room">
				</div>
		</div>

		<div class="toolbar-section" transition:slide={{ axis: 'x', duration: 300 }}>
			<button class="btn btn-info" on:click={onOpenScheduler}>
				<span class="icon">📅</span>
				Tagesplan
			</button>
		</div>
	{/if}

	<div class="toolbar-section ml-auto">
		</div>

	<div class="toolbar-info">
		</div>
</div>

<style>
	/* CSS bleibt unverändert */
	.admin-toolbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
		padding: 8px 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 100;
		backdrop-filter: blur(10px);
		flex-wrap: wrap;
		min-height: 50px;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.ml-auto {
		margin-left: auto;
	}

	.mode-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 16px;
		font-size: 14px;
		font-weight: 600;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
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
		box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
	}

	.bulk-actions {
		display: flex;
		gap: 8px;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 13px;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		color: white;
		white-space: nowrap;
	}

	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
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

	.btn-info {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.btn-settings {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	/* NEUES STYLING FÜR SWAP-BUTTON */
	.btn-swap {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
		border: 2px solid rgba(245, 158, 11, 0.8);
		padding: 6px 16px;
		/* Etwas größer */
		font-size: 14px;
	}


	.icon {
		font-size: 14px;
	}

	.create-room {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.create-room input {
		padding: 6px 12px;
		font-size: 13px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		min-width: 120px;
		backdrop-filter: blur(10px);
	}

	.create-room input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.create-room input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
	}

	.floor-select {
		padding: 6px 10px;
		font-size: 13px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
		cursor: pointer;
		font-weight: 600;
	}

	.floor-select:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
	}

	.floor-select option {
		background: #1e3a8a;
		color: white;
		font-weight: 600;
	}

	.toolbar-info {
		flex-basis: 100%;
		padding: 6px 12px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		backdrop-filter: blur(10px);
		text-align: center;
	}

	.info-text {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
	}

	@media (max-width: 1200px) {
		.admin-toolbar {
			padding: 6px 15px;
			gap: 8px;
		}

		.btn {
			font-size: 12px;
			padding: 5px 10px;
		}

		.create-room input {
			min-width: 100px;
			font-size: 12px;
		}

		.floor-select {
			font-size: 12px;
			padding: 5px 8px;
		}
	}
</style>