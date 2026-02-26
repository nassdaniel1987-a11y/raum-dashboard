<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { rooms, dailyConfigs, roomStatuses, viewWeekday, currentTime } from '$lib/stores/appState';
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
	let localCloseTimes = $state(new Map<string, string>());

	// ✅ Auto-Save State
	let saveTimeouts = $state<Record<string, ReturnType<typeof setTimeout>>>({});
	let savingRooms = $state<Set<string>>(new Set());
	let savedRooms = $state<Set<string>>(new Set());

	// ✅ FIX: Reaktiv mit $effect statt einmalig
	$effect(() => {
		const openMap = new Map<string, string>();
		const closeMap = new Map<string, string>();
		allRooms.forEach(room => {
			const configKey = `${room.id}-${weekday}`;
			const config = $dailyConfigs.get(configKey);
			openMap.set(room.id, config?.open_time || '');
			closeMap.set(room.id, config?.close_time || '');
		});
		localOpenTimes = openMap;
		localCloseTimes = closeMap;
	});

	let message = $state('');
	let messageType = $state<'success' | 'error' | ''>('');

	// Hilfsfunktion zum Parsen der Zeit
	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	// ✅ Auto-Save für einzelnen Raum
	async function saveRoomTimes(roomId: string) {
		const openTime = localOpenTimes.get(roomId) || '';
		const closeTime = localCloseTimes.get(roomId) || '';
		const now = get(currentTime);
		const nowMinutes = now.getHours() * 60 + now.getMinutes();

		// Zeige Speicher-Status
		savingRooms = new Set([...savingRooms, roomId]);

		const configKey = `${roomId}-${weekday}`;
		const existingConfig = $dailyConfigs.get(configKey);

		const configUpdate = {
			room_id: roomId,
			weekday: weekday,
			activity: existingConfig?.activity || null,
			title_font_size: existingConfig?.title_font_size || 42,
			text_font_size: existingConfig?.text_font_size || 28,
			text_color: existingConfig?.text_color || '#FFFFFF',
			title_alignment: existingConfig?.title_alignment || 'center',
			text_alignment: existingConfig?.text_alignment || 'center',
			is_locked: existingConfig?.is_locked || false,
			open_time: openTime || null,
			close_time: closeTime || null
		};

		try {
			const { error } = await supabase
				.from('daily_configs')
				.upsert(configUpdate, { onConflict: 'room_id,weekday' });

			if (error) throw error;

			// Status-Update wenn Öffnungszeit in der Zukunft liegt
			const openTimeParsed = parseTimeLocal(openTime);
			if (openTimeParsed !== null && openTimeParsed > nowMinutes) {
				await supabase.from('room_status').upsert({
					room_id: roomId,
					is_open: false,
					manual_override: false
				}, { onConflict: 'room_id' });

				// Lokalen Store sofort aktualisieren (nicht auf Realtime warten)
				roomStatuses.update((map) => {
					const newMap = new Map(map);
					newMap.set(roomId, {
						room_id: roomId,
						is_open: false,
						manual_override: false,
						last_updated: new Date().toISOString()
					});
					return newMap;
				});
			}

			// Zeige kurz "Gespeichert" Feedback
			savingRooms = new Set([...savingRooms].filter(id => id !== roomId));
			savedRooms = new Set([...savedRooms, roomId]);
			setTimeout(() => {
				savedRooms = new Set([...savedRooms].filter(id => id !== roomId));
			}, 1500);

		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			savingRooms = new Set([...savingRooms].filter(id => id !== roomId));
			showMessage('Fehler beim Speichern!', 'error');
		}
	}

	// ✅ Debounced Save - wartet 800ms nach letzter Eingabe
	function scheduleSave(roomId: string) {
		// Vorheriges Timeout löschen
		if (saveTimeouts[roomId]) {
			clearTimeout(saveTimeouts[roomId]);
		}

		// Neues Timeout setzen
		saveTimeouts[roomId] = setTimeout(() => {
			saveRoomTimes(roomId);
			delete saveTimeouts[roomId];
		}, 800);
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 3000);
	}

	// Räume nach Stockwerk sortieren mit $derived
	const floorOrder: string[] = ['dach', 'og2', 'og1', 'eg', 'essen', 'ug', 'extern'];
	let sortedRooms = $derived(allRooms.slice().sort((a, b) => {
		const floorA = floorOrder.indexOf(a.floor);
		const floorB = floorOrder.indexOf(b.floor);
		if (floorA !== floorB) {
			return floorA - floorB;
		}
		return a.position_x - b.position_x;
	}));

	// Funktion zum Aktualisieren der Öffnungszeit für einen Raum
	function updateRoomTime(roomId: string, value: string) {
		const newMap = new Map(localOpenTimes);
		newMap.set(roomId, value);
		localOpenTimes = newMap;
		scheduleSave(roomId);
	}

	// Funktion zum Aktualisieren der Schließzeit für einen Raum
	function updateRoomCloseTime(roomId: string, value: string) {
		const newMap = new Map(localCloseTimes);
		newMap.set(roomId, value);
		localCloseTimes = newMap;
		scheduleSave(roomId);
	}

	// ✅ Raum-Status (offen/geschlossen) ermitteln
	function isRoomOpen(roomId: string): boolean {
		return $roomStatuses.get(roomId)?.is_open ?? false;
	}

	// ✅ Alle Zeiten für ALLE Wochentage löschen (manueller Reset)
	let clearing = $state(false);
	async function clearAllTimes() {
		if (!confirm('Alle eingestellten Zeiten für alle Tage löschen?')) return;

		clearing = true;
		try {
			const { error } = await supabase
				.from('daily_configs')
				.update({ open_time: null, close_time: null })
				.gte('weekday', 0);

			if (error) throw error;

			// Lokalen Store aktualisieren
			dailyConfigs.update((map) => {
				const newMap = new Map(map);
				for (const [key, config] of newMap) {
					if (config.open_time !== null || config.close_time !== null) {
						newMap.set(key, { ...config, open_time: null, close_time: null });
					}
				}
				return newMap;
			});

			showMessage('Alle Zeiten gelöscht!', 'success');
		} catch (error) {
			console.error('Fehler beim Löschen:', error);
			showMessage('Fehler beim Löschen!', 'error');
		} finally {
			clearing = false;
		}
	}

	// ✅ Raum direkt schließen/öffnen (ohne Zeitangabe)
	async function toggleRoomStatus(roomId: string) {
		const currentStatus = $roomStatuses.get(roomId);
		const newIsOpen = !(currentStatus?.is_open ?? false);

		savingRooms = new Set([...savingRooms, roomId]);

		try {
			const { error } = await supabase
				.from('room_status')
				.upsert({
					room_id: roomId,
					is_open: newIsOpen,
					manual_override: true
				}, { onConflict: 'room_id' });

			if (error) throw error;

			// Lokalen Store aktualisieren
			roomStatuses.update((map) => {
				const newMap = new Map(map);
				newMap.set(roomId, {
					room_id: roomId,
					is_open: newIsOpen,
					manual_override: true,
					last_updated: new Date().toISOString()
				});
				return newMap;
			});

			savingRooms = new Set([...savingRooms].filter(id => id !== roomId));
			savedRooms = new Set([...savedRooms, roomId]);
			setTimeout(() => {
				savedRooms = new Set([...savedRooms].filter(id => id !== roomId));
			}, 1500);

		} catch (error) {
			console.error('Fehler beim Umschalten:', error);
			savingRooms = new Set([...savingRooms].filter(id => id !== roomId));
			showMessage('Fehler beim Umschalten!', 'error');
		}
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
				<p class="subtitle">Setze die automatische Öffnungs- und Schließzeit für heute.</p>
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
				<span class="room-status-header">Status</span>
				<span class="room-time-header">Öffnet um</span>
				<span class="room-time-header">Schließt um</span>
			</div>
			<div class="room-list">
				{#each sortedRooms as room (room.id)}
					<div class="room-row" class:saving={savingRooms.has(room.id)} class:saved={savedRooms.has(room.id)}>
						<div class="room-info">
							<div class="room-color" style="background: {room.background_color}"></div>
							<span class="room-name">{room.name}</span>
							<span class="floor-badge">{room.floor.toUpperCase()}</span>
							{#if savingRooms.has(room.id)}
								<span class="save-indicator saving">⏳</span>
							{:else if savedRooms.has(room.id)}
								<span class="save-indicator saved">✓</span>
							{/if}
						</div>
						<button
							class="status-btn"
							class:open={isRoomOpen(room.id)}
							class:closed={!isRoomOpen(room.id)}
							onclick={() => toggleRoomStatus(room.id)}
							title={isRoomOpen(room.id) ? 'Raum schließen' : 'Raum öffnen'}
						>
							{isRoomOpen(room.id) ? '🔓 Offen' : '🔒 Zu'}
						</button>
						<div class="time-input-wrapper">
							<input
								type="time"
								class="time-input"
								value={localOpenTimes.get(room.id) || ''}
								oninput={(e) => updateRoomTime(room.id, e.currentTarget.value)}
							/>
						</div>
						<div class="time-input-wrapper">
							<input
								type="time"
								class="time-input"
								value={localCloseTimes.get(room.id) || ''}
								oninput={(e) => updateRoomCloseTime(room.id, e.currentTarget.value)}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="modal-footer">
			<span class="auto-save-hint">💾 Änderungen werden automatisch gespeichert</span>
			<div class="footer-buttons">
				<button class="btn btn-danger" onclick={clearAllTimes} disabled={clearing}>
					{clearing ? '⏳ Lösche...' : '🗑️ Alle Zeiten löschen'}
				</button>
				<button class="btn btn-primary" onclick={onClose}>Fertig</button>
			</div>
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
		background: rgba(15, 23, 42, 0.98);
		backdrop-filter: blur(20px);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		width: 90%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
		color: white;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
	}

	.header-content h2 {
		margin: 0 0 4px 0;
		font-size: 18px;
		font-weight: 600;
		letter-spacing: 0.3px;
	}
	.subtitle {
		margin: 0;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
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
		flex-shrink: 0;
	}
	.close-btn:hover {
		background: rgba(239, 68, 68, 0.3);
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
		padding: 20px;
		overflow-y: auto;
		flex: 1;
	}

	.room-list-header {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 16px;
		padding: 12px 12px;
		font-weight: 600;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.8);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky;
		top: 0;
		background: rgba(15, 23, 42, 0.98);
		z-index: 1;
	}

	.room-status-header {
		width: 90px;
		text-align: center;
	}

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}

	.room-row {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 16px;
		align-items: center;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		margin-bottom: 8px;
	}

	.status-btn {
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 90px;
	}

	.status-btn.open {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.4);
	}

	.status-btn.open:hover {
		background: rgba(34, 197, 94, 0.3);
	}

	.status-btn.closed {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.4);
	}

	.status-btn.closed:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.room-info {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.room-color {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
	}

	.room-name {
		font-weight: 500;
		font-size: 14px;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.floor-badge {
		font-size: 10px;
		font-weight: 600;
		padding: 3px 6px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 4px;
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.9);
	}

	.save-indicator {
		font-size: 14px;
		margin-left: auto;
		flex-shrink: 0;
	}

	.save-indicator.saving {
		animation: pulse 0.8s ease-in-out infinite;
	}

	.save-indicator.saved {
		color: #22c55e;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.8); }
		to { opacity: 1; transform: scale(1); }
	}

	.room-row.saving {
		border-color: rgba(249, 115, 22, 0.4);
	}

	.room-row.saved {
		border-color: rgba(34, 197, 94, 0.4);
		background: rgba(34, 197, 94, 0.1);
	}

	.time-input-wrapper {
		flex-shrink: 0;
	}

	.time-input {
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 13px;
		font-weight: 500;
		width: 120px;
		text-align: center;
		transition: all 0.2s;
	}
	.time-input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		gap: 16px;
		justify-content: space-between;
		align-items: center;
	}

	.auto-save-hint {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.5);
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
		min-width: 100px;
	}
	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
	}
	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}
	.btn-primary {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.5);
	}
	.btn-primary:hover:not(:disabled) {
		background: rgba(59, 130, 246, 0.4);
		border-color: rgba(59, 130, 246, 0.6);
	}
	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-danger {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
		color: #ef4444;
	}
	.btn-danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
	}
	.btn-danger:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.footer-buttons {
		display: flex;
		gap: 8px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.modal-scheduler {
			width: 95%;
			max-width: 95%;
			max-height: 95vh;
		}

		.room-row {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.room-list-header {
			display: none;
		}

		.status-btn {
			width: 100%;
		}

		.time-input-wrapper {
			width: 100%;
		}

		.time-input {
			width: 100%;
		}

		.modal-footer {
			flex-direction: column;
			gap: 12px;
		}

		.auto-save-hint {
			text-align: center;
		}

		.footer-buttons {
			flex-direction: column;
			width: 100%;
		}

		.btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.modal-scheduler {
			width: 100%;
			max-width: 100%;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>