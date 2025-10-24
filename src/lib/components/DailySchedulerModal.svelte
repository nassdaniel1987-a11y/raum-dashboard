<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { rooms, dailyConfigs, currentWeekday, currentTime } from '$lib/stores/appState';
	import { scale, fade, fly } from 'svelte/transition';
	import { get } from 'svelte/store';

	// Svelte 5 Syntax für Props
	let { onClose } = $props<{
		onClose: () => void;
	}>();

	const weekdaysFull = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
	
	// FEHLERBEHEBUNG: Das '$' wurde aus den Variablennamen entfernt
	const weekday = get(currentWeekday);
	const allRooms = get(rooms);

	// Lokaler Status für die Zeiten, um nicht bei jeder Eingabe die DB zu fluten
	let localOpenTimes = new Map<string, string>();
	allRooms.forEach(room => {
		const configKey = `${room.id}-${weekday}`;
		const config = get(dailyConfigs).get(configKey);
		localOpenTimes.set(room.id, config?.open_time || '');
	});

	let message = '';
	let messageType: 'success' | 'error' | '' = '';
	let saving = false;

	// Hilfsfunktion zum Parsen der Zeit
	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	async function handleSaveAll() {
		saving = true;
		const $now = get(currentTime);
		const nowMinutes = $now.getHours() * 60 + $now.getMinutes();

		const configUpdates: any[] = [];
		const statusUpdates: any[] = [];

		for (const [roomId, openTime] of localOpenTimes.entries()) {
			// 1. Config-Update vorbereiten
			configUpdates.push({
				room_id: roomId,
				weekday: weekday, // Korrigierte Variable
				open_time: openTime || null,
				close_time: null // Sicherstellen, dass close_time ignoriert wird
			});

			// 2. Status-Update vorbereiten (Raum sofort schließen, wenn zukünftige Zeit gesetzt)
			const openTimeParsed = parseTimeLocal(openTime);
			if (openTimeParsed !== null && openTimeParsed > nowMinutes) {
				statusUpdates.push({
					room_id: roomId,
					is_open: false,
					manual_override: false // Wichtig: Automatik!
				});
			}
		}

		try {
			// Configs speichern
			if (configUpdates.length > 0) {
				await supabase.from('daily_configs').upsert(configUpdates, { onConflict: 'room_id,weekday' });
			}
			// Status sofort aktualisieren (damit "Öffnet um..." erscheint)
			if (statusUpdates.length > 0) {
				await supabase.from('room_status').upsert(statusUpdates, { onConflict: 'room_id' });
			}
			
			showMessage('Tagesplan gespeichert!', 'success');
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			showMessage('Fehler beim Speichern!', 'error');
		}
		saving = false;
		onClose(); // Modal nach Speichern schließen
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 3000);
	}

	// Räume nach Stockwerk sortieren
	const floorOrder: string[] = ['dach', 'og2', 'og1', 'eg', 'ug', 'extern'];
	$: sortedRooms = allRooms.sort((a, b) => {
		const floorA = floorOrder.indexOf(a.floor);
		const floorB = floorOrder.indexOf(b.floor);
		if (floorA !== floorB) {
			return floorA - floorB;
		}
		return a.position_x - b.position_x; // Zweitsortierung nach Position
	});
</script>

<div 
	class="modal-backdrop" 
	on:click={onClose} 
	transition:fade
	role="dialog"
	aria-modal="true"
	on:keydown={(e) => e.key === 'Escape' && onClose()}
>
	<div class="modal-scheduler" on:click|stopPropagation transition:scale={{ duration: 300 }} role="document">
		<div class="modal-header">
			<div class="header-content">
				<h2>📅 Tagesplan für {weekdaysFull[weekday]}</h2>
				<p class="subtitle">Setze die automatische Öffnungszeit für heute.</p>
			</div>
			<button class="close-btn" on:click={onClose}>✕</button>
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
								bind:value={localOpenTimes.get(room.id)}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={onClose}>Abbrechen</button>
			<button class="btn btn-primary" on:click={handleSaveAll} disabled={saving}>
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
	}

	.floor-badge {
		font-size: 10px;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
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