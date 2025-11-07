<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { rooms, dailyConfigs, viewWeekday, currentTime } from '$lib/stores/appState';
	import { scale, fade, fly } from 'svelte/transition';
	import { get } from 'svelte/store';

	// Svelte 5 Syntax für Props
	let { onClose } = $props<{
		onClose: () => void;
	}>();

	const weekdaysFull = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// ✅ FIX: Verwende viewWeekday und filtere nur Räume mit Config für diesen Tag
	let weekday = $derived($viewWeekday);
	let allRooms = $derived($rooms.filter(room => {
		const configKey = `${room.id}-${weekday}`;
		return $dailyConfigs.has(configKey);
	}));

	// SVELTE 5 STATE SYNTAX
	let localOpenTimes = $state(new Map<string, string>());

	// ✅ FIX: Reaktiv mit $effect statt einmalig
	$effect(() => {
		const newMap = new Map<string, string>();
		allRooms.forEach(room => {
			const configKey = `${room.id}-${weekday}`;
			const config = $dailyConfigs.get(configKey);
			newMap.set(room.id, config?.open_time || '');
		});
		localOpenTimes = newMap;
	});

	let message = $state('');
	let messageType = $state<'success' | 'error' | ''>('');
	let saving = $state(false);

	// Hilfsfunktion zum Parsen der Zeit
	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	async function handleSaveAll() {
		saving = true;
		const now = get(currentTime);
		const nowMinutes = now.getHours() * 60 + now.getMinutes();

		const configUpdates: any[] = [];
		const statusUpdates: any[] = [];

		for (const [roomId, openTime] of localOpenTimes.entries()) {
			// 1. Config-Update vorbereiten
			configUpdates.push({
				room_id: roomId,
				weekday: weekday,
				open_time: openTime || null,
				close_time: null
			});

			// 2. Status-Update vorbereiten
			const openTimeParsed = parseTimeLocal(openTime);
			if (openTimeParsed !== null && openTimeParsed > nowMinutes) {
				statusUpdates.push({
					room_id: roomId,
					is_open: false,
					manual_override: false
				});
			}
		}

		try {
			// Configs speichern
			if (configUpdates.length > 0) {
				await supabase.from('daily_configs').upsert(configUpdates, { onConflict: 'room_id,weekday' });
			}
			// Status sofort aktualisieren
			if (statusUpdates.length > 0) {
				await supabase.from('room_status').upsert(statusUpdates, { onConflict: 'room_id' });
			}

			showMessage('Tagesplan gespeichert!', 'success');
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			showMessage('Fehler beim Speichern!', 'error');
		} finally {
			saving = false;
		}
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
			if (type === 'success') {
				onClose();
			}
		}, 3000);
	}

	// Räume nach Stockwerk sortieren mit $derived
	const floorOrder: string[] = ['dach', 'og2', 'og1', 'eg', 'ug', 'extern'];
	let sortedRooms = $derived(allRooms.slice().sort((a, b) => {
		const floorA = floorOrder.indexOf(a.floor);
		const floorB = floorOrder.indexOf(b.floor);
		if (floorA !== floorB) {
			return floorA - floorB;
		}
		return a.position_x - b.position_x;
	}));

	// Funktion zum Aktualisieren der Zeit für einen Raum
	function updateRoomTime(roomId: string, value: string) {
		const newMap = new Map(localOpenTimes);
		newMap.set(roomId, value);
		localOpenTimes = newMap;
	}
</script>

<div
	class="modal-backdrop"
	onclick={onClose}
	transition:fade
	role="dialog"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<div
		class="modal-scheduler"
		onclick={(e) => e.stopPropagation()}
		transition:scale={{ duration: 300 }}
		role="document"
	>
		<div class="modal-header">
			<div class="header-content">
				<h2>📅 Tagesplan für {weekdaysFull[weekday]}</h2>
				<p class="subtitle">Setze die automatische Öffnungszeit für heute.</p>
			</div>
			<button class="close-btn" onclick={onClose} aria-label="Schließen">✕</button>
		</div>

		{#if message}
			<div class="message-banner {messageType}" transition:fly={{ y: -20, duration: 300 }}>
				{message}
			</div>
		{/if}

		<div class="modal-content">
			<div class="room-list-header">
				<span class="room-name-header">Raum</span>
				<span class="room-time-header">Öffnet um (leer = keine Automatik)</span>
			</div>
			<div class="room-list">
				{#each sortedRooms as room (room.id)}
					<div class="room-row">
						<div class="room-info">
							<div class="room-color" style="background: {room.background_color}"></div>
							<span class="room-name">{room.name}</span>
							<span class="floor-badge">{room.floor.toUpperCase()}</span>
						</div>
						<div class="time-input-wrapper">
							<input
								type="time"
								class="time-input"
								value={localOpenTimes.get(room.id) || ''}
								oninput={(e) => updateRoomTime(room.id, e.currentTarget.value)}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" onclick={onClose}>Abbrechen</button>
			<button class="btn btn-primary" onclick={handleSaveAll} disabled={saving}>
				{saving ? 'Speichert...' : 'Tagesplan speichern'}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(5px);
	}

	.modal-scheduler {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 24px;
		width: 90%;
		max-width: 700px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		color: white;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 24px;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	.header-content h2 {
		margin: 0 0 8px 0;
		font-size: 28px;
	}
	.subtitle {
		margin: 0;
		font-size: 14px;
		opacity: 0.7;
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		font-size: 24px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s;
		flex-shrink: 0;
	}
	.close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: rotate(90deg);
	}

	.message-banner {
		padding: 12px 24px;
		font-weight: 600;
	}
	.message-banner.success {
		background: rgba(34, 197, 94, 0.2);
	}
	.message-banner.error {
		background: rgba(239, 68, 68, 0.2);
	}

	.modal-content {
		padding: 0 24px 24px 24px;
		overflow-y: auto;
		flex: 1;
	}

	.room-list-header {
		display: flex;
		justify-content: space-between;
		padding: 16px 12px;
		font-weight: 600;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		position: sticky;
		top: 0;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		z-index: 1;
	}

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}

	.room-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
	}

	.room-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
		margin-right: 16px;
	}

	.room-color {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
	}

	.room-name {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.floor-badge {
		font-size: 10px;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		flex-shrink: 0;
	}

	.time-input-wrapper {
		flex-shrink: 0;
	}

	.time-input {
		padding: 8px 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 16px;
		width: 120px;
		text-align: center;
	}
	.time-input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
	}

	.modal-footer {
		padding: 24px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}
	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}
	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>