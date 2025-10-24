<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { rooms, dailyConfigs } from '$lib/stores/appState';
	import { scale, fade, fly } from 'svelte/transition';

	export let onClose: () => void;

	const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const weekdaysFull = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	let selectedSourceDay = 1; // Montag
	let selectedTargetDays: number[] = [];
	let showCopySection = false;
	let message = '';
	let messageType: 'success' | 'error' | '' = '';

	// Erstelle Matrix: Raum x Wochentag
	$: scheduleMatrix = $rooms.map((room) => {
		const weekSchedule = weekdays.map((_, dayIndex) => {
			const configKey = `${room.id}-${dayIndex}`;
			const config = $dailyConfigs.get(configKey);
			return {
				dayIndex,
				openTime: config?.open_time || '',
				closeTime: config?.close_time || '',
				hasSchedule: !!(config?.open_time || config?.close_time)
			};
		});
		
		return {
			room,
			schedule: weekSchedule
		};
	});

	// Berechne wie viele Räume pro Tag einen Zeitplan haben
	$: dayStats = weekdays.map((_, dayIndex) => {
		const count = scheduleMatrix.filter(({ schedule }) => 
			schedule[dayIndex].hasSchedule
		).length;
		return count;
	});

	async function updateTime(roomId: string, dayIndex: number, field: 'open_time' | 'close_time', value: string) {
		try {
			const updateData: any = {
				room_id: roomId,
				weekday: dayIndex,
				[field]: value || null
			};

			await supabase
				.from('daily_configs')
				.upsert(updateData, { onConflict: 'room_id,weekday' });
				
			showMessage('Zeitplan gespeichert!', 'success');
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			showMessage('Fehler beim Speichern!', 'error');
		}
	}

	function toggleTargetDay(day: number) {
		if (selectedTargetDays.includes(day)) {
			selectedTargetDays = selectedTargetDays.filter(d => d !== day);
		} else {
			selectedTargetDays = [...selectedTargetDays, day];
		}
	}

	async function copySchedules() {
		if (selectedTargetDays.length === 0) {
			showMessage('Bitte wähle mindestens einen Zieltag aus!', 'error');
			return;
		}

		const confirmText = `Zeitpläne von ${weekdaysFull[selectedSourceDay]} auf ${selectedTargetDays.length} Tag(e) kopieren? Bestehende Zeitpläne werden überschrieben!`;
		if (!confirm(confirmText)) return;

		try {
			const updates = [];

			for (const targetDay of selectedTargetDays) {
				for (const { room } of scheduleMatrix) {
					const sourceConfigKey = `${room.id}-${selectedSourceDay}`;
					const sourceConfig = $dailyConfigs.get(sourceConfigKey);

					if (sourceConfig && (sourceConfig.open_time || sourceConfig.close_time)) {
						updates.push({
							room_id: room.id,
							weekday: targetDay,
							activity: sourceConfig.activity || null,
							open_time: sourceConfig.open_time || null,
							close_time: sourceConfig.close_time || null,
							title_font_size: sourceConfig.title_font_size || 42,
							text_font_size: sourceConfig.text_font_size || 28
						});
					}
				}
			}

			if (updates.length > 0) {
				await supabase.from('daily_configs').upsert(updates, { onConflict: 'room_id,weekday' });
				showMessage(`${updates.length} Zeitpläne erfolgreich kopiert!`, 'success');
				selectedTargetDays = [];
				showCopySection = false;
			} else {
				showMessage('Keine Zeitpläne zum Kopieren gefunden!', 'error');
			}
		} catch (error) {
			console.error('Fehler beim Kopieren:', error);
			showMessage('Fehler beim Kopieren der Zeitpläne!', 'error');
		}
	}

	async function clearDay(dayIndex: number) {
		const dayName = weekdaysFull[dayIndex];
		const count = dayStats[dayIndex];
		
		if (count === 0) {
			showMessage(`${dayName} hat keine Zeitpläne!`, 'error');
			return;
		}
		
		if (!confirm(`Alle ${count} Zeitpläne für ${dayName} löschen?`)) return;

		try {
			const updates = $rooms.map(room => ({
				room_id: room.id,
				weekday: dayIndex,
				open_time: null,
				close_time: null
			}));

			await supabase.from('daily_configs').upsert(updates, { onConflict: 'room_id,weekday' });
			showMessage(`Zeitpläne für ${dayName} gelöscht!`, 'success');
		} catch (error) {
			console.error('Fehler beim Löschen:', error);
			showMessage('Fehler beim Löschen!', 'error');
		}
	}

	async function setTimeForAll(dayIndex: number) {
		const openTime = prompt(`Öffnungszeit für alle Räume am ${weekdaysFull[dayIndex]} (HH:MM):`);
		if (!openTime) return;
		
		const closeTime = prompt(`Schließzeit für alle Räume am ${weekdaysFull[dayIndex]} (HH:MM):`);
		if (!closeTime) return;

		try {
			const updates = $rooms.map(room => ({
				room_id: room.id,
				weekday: dayIndex,
				open_time: openTime,
				close_time: closeTime
			}));

			await supabase.from('daily_configs').upsert(updates, { onConflict: 'room_id,weekday' });
			showMessage(`Zeitpläne für alle Räume am ${weekdaysFull[dayIndex]} gesetzt!`, 'success');
		} catch (error) {
			console.error('Fehler:', error);
			showMessage('Fehler beim Setzen der Zeiten!', 'error');
		}
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 3000);
	}
</script>

<div class="modal-backdrop" on:click={onClose} transition:fade>
	<div class="modal-wide" on:click|stopPropagation transition:scale={{ duration: 300 }}>
		<div class="modal-header">
			<div class="header-content">
				<h2>📅 Wochenplan-Verwaltung</h2>
				<p class="subtitle">Verwalte Öffnungs- und Schließzeiten für alle Räume</p>
			</div>
			<button class="close-btn" on:click={onClose}>✕</button>
		</div>

		{#if message}
			<div class="message-banner {messageType}" transition:fly={{ y: -20, duration: 300 }}>
				<i class="fas {messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
				{message}
			</div>
		{/if}

		<div class="modal-content">
			<!-- Aktions-Buttons -->
			<div class="action-bar">
				<button 
					class="btn-action" 
					class:active={showCopySection}
					on:click={() => showCopySection = !showCopySection}
				>
					<i class="fas fa-copy"></i>
					Zeitpläne kopieren
				</button>
				
				<div class="stats-display">
					<i class="fas fa-info-circle"></i>
					<span>{$rooms.length} Räume</span>
				</div>
			</div>

			<!-- Kopier-Sektion (ausklappbar) -->
			{#if showCopySection}
				<div class="copy-section" transition:fly={{ y: -20, duration: 300 }}>
					<div class="copy-grid">
						<div class="copy-column">
							<h3><i class="fas fa-calendar-day"></i> Von welchem Tag?</h3>
							<div class="day-selector">
								{#each weekdaysFull as day, index}
									{#if index !== 0 && index !== 6}
										<button
											class="day-btn"
											class:selected={selectedSourceDay === index}
											on:click={() => selectedSourceDay = index}
										>
											<span class="day-name">{day}</span>
											{#if dayStats[index] > 0}
												<span class="day-badge">{dayStats[index]}</span>
											{/if}
										</button>
									{/if}
								{/each}
							</div>
						</div>

						<div class="copy-arrow">
							<i class="fas fa-arrow-right"></i>
						</div>

						<div class="copy-column">
							<h3><i class="fas fa-calendar-week"></i> Auf welche Tage?</h3>
							<div class="day-selector">
								{#each weekdaysFull as day, index}
									{#if index !== 0 && index !== 6 && index !== selectedSourceDay}
										<button
											class="day-btn"
											class:selected={selectedTargetDays.includes(index)}
											on:click={() => toggleTargetDay(index)}
										>
											<span class="day-name">{day}</span>
											{#if selectedTargetDays.includes(index)}
												<i class="fas fa-check check-icon"></i>
											{/if}
										</button>
									{/if}
								{/each}
							</div>
						</div>
					</div>

					<button 
						class="btn-copy-execute" 
						disabled={selectedTargetDays.length === 0}
						on:click={copySchedules}
					>
						<i class="fas fa-copy"></i>
						{selectedTargetDays.length} Tag(e) überschreiben
					</button>
				</div>
			{/if}

			<!-- Wochenplan-Tabelle -->
			<div class="schedule-table-container">
				<table class="schedule-table">
					<thead>
						<tr>
							<th class="room-header">
								<div class="header-cell">
									<i class="fas fa-door-open"></i>
									<span>Raum</span>
								</div>
							</th>
							{#each weekdays as day, index}
								<th class="day-header" class:weekend={index === 0 || index === 6}>
									<div class="day-header-content">
										<span class="day-label">{day}</span>
										{#if dayStats[index] > 0}
											<span class="schedule-count">{dayStats[index]}</span>
										{/if}
										{#if index !== 0 && index !== 6}
											<div class="day-actions">
												<button 
													class="day-action-btn" 
													title="Für alle setzen"
													on:click={() => setTimeForAll(index)}
												>
													<i class="fas fa-plus-circle"></i>
												</button>
												<button 
													class="day-action-btn danger" 
													title="Tag leeren"
													on:click={() => clearDay(index)}
													disabled={dayStats[index] === 0}
												>
													<i class="fas fa-trash-alt"></i>
												</button>
											</div>
										{/if}
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each scheduleMatrix as { room, schedule }}
							<tr>
								<td class="room-cell">
									<div class="room-info">
										<div class="room-color" style="background: {room.background_color}"></div>
										<span class="room-name" title={room.name}>{room.name}</span>
										<span class="floor-badge">{room.floor.toUpperCase()}</span>
									</div>
								</td>
								{#each schedule as { dayIndex, openTime, closeTime, hasSchedule }}
									<td class="time-cell" class:weekend={dayIndex === 0 || dayIndex === 6} class:has-schedule={hasSchedule}>
										{#if dayIndex !== 0 && dayIndex !== 6}
											<div class="time-inputs">
												<input
													type="time"
													value={openTime}
													placeholder="Von"
													title="Öffnungszeit"
													on:change={(e) => updateTime(room.id, dayIndex, 'open_time', e.currentTarget.value)}
												/>
												<span class="time-separator">→</span>
												<input
													type="time"
													value={closeTime}
													placeholder="Bis"
													title="Schließzeit"
													on:change={(e) => updateTime(room.id, dayIndex, 'close_time', e.currentTarget.value)}
												/>
											</div>
										{:else}
											<span class="weekend-label">—</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="info-box">
				<i class="fas fa-lightbulb"></i>
				<div class="info-content">
					<strong>So funktioniert's:</strong>
					<ul>
						<li>Zeiten werden automatisch angewendet</li>
						<li>Manuelle Änderungen überschreiben den Zeitplan temporär</li>
						<li>Nutze "Für alle setzen" um schnell gleiche Zeiten einzutragen</li>
						<li>Kopiere Zeitpläne zwischen Tagen um Zeit zu sparen</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={onClose}>
				<i class="fas fa-times"></i>
				Schließen
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

	.modal-wide {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 24px;
		width: 95%;
		max-width: 1400px;
		max-height: 95vh;
		overflow-y: auto;
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

	.header-content {
		flex: 1;
	}

	.modal-header h2 {
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 700;
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
		padding: 16px 24px;
		display: flex;
		align-items: center;
		gap: 12px;
		font-weight: 600;
	}

	.message-banner.success {
		background: rgba(34, 197, 94, 0.2);
		border-bottom: 2px solid rgba(34, 197, 94, 0.5);
	}

	.message-banner.error {
		background: rgba(239, 68, 68, 0.2);
		border-bottom: 2px solid rgba(239, 68, 68, 0.5);
	}

	.modal-content {
		padding: 24px;
	}

	.action-bar {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		align-items: center;
		flex-wrap: wrap;
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-action:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.btn-action.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
	}

	.stats-display {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		font-size: 14px;
		margin-left: auto;
	}

	.copy-section {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 24px;
	}

	.copy-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 24px;
		align-items: center;
		margin-bottom: 20px;
	}

	.copy-column h3 {
		margin: 0 0 16px 0;
		font-size: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		opacity: 0.9;
	}

	.day-selector {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.day-btn {
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.day-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateX(4px);
	}

	.day-btn.selected {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
	}

	.day-name {
		flex: 1;
	}

	.day-badge {
		background: rgba(34, 197, 94, 0.3);
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 12px;
	}

	.check-icon {
		color: #22c55e;
	}

	.copy-arrow {
		font-size: 24px;
		text-align: center;
		opacity: 0.5;
	}

	.btn-copy-execute {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: none;
		border-radius: 12px;
		color: white;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.btn-copy-execute:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
	}

	.btn-copy-execute:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.schedule-table-container {
		overflow-x: auto;
		border-radius: 16px;
		background: rgba(0, 0, 0, 0.2);
		margin-bottom: 20px;
	}

	.schedule-table {
		width: 100%;
		border-collapse: collapse;
	}

	.schedule-table th,
	.schedule-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.room-header .header-cell {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
	}

	.day-header {
		text-align: center;
		font-weight: 600;
		font-size: 14px;
		min-width: 140px;
	}

	.day-header.weekend {
		opacity: 0.3;
	}

	.day-header-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: center;
	}

	.day-label {
		font-weight: 700;
	}

	.schedule-count {
		background: rgba(34, 197, 94, 0.2);
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
	}

	.day-actions {
		display: flex;
		gap: 4px;
		justify-content: center;
	}

	.day-action-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 4px 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 12px;
	}

	.day-action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}

	.day-action-btn.danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.3);
	}

	.day-action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.room-cell {
		position: sticky;
		left: 0;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		z-index: 1;
	}

	.room-info {
		display: flex;
		align-items: center;
		gap: 10px;
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
		max-width: 200px;
	}

	.floor-badge {
		font-size: 10px;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.time-cell {
		text-align: center;
	}

	.time-cell.weekend {
		opacity: 0.3;
	}

	.time-cell.has-schedule {
		background: rgba(34, 197, 94, 0.05);
	}

	.time-inputs {
		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;
	}

	.time-inputs input {
		padding: 6px 8px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 13px;
		width: 70px;
		text-align: center;
	}

	.time-inputs input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
		background: rgba(255, 255, 255, 0.15);
	}

	.time-separator {
		font-size: 14px;
		opacity: 0.5;
	}

	.weekend-label {
		font-size: 18px;
		opacity: 0.3;
	}

	.info-box {
		padding: 16px;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 12px;
		border-left: 4px solid #3b82f6;
		display: flex;
		gap: 12px;
	}

	.info-box i {
		font-size: 20px;
		color: #3b82f6;
		flex-shrink: 0;
	}

	.info-content {
		flex: 1;
	}

	.info-content strong {
		display: block;
		margin-bottom: 8px;
	}

	.info-content ul {
		margin: 0;
		padding-left: 20px;
	}

	.info-content li {
		margin-bottom: 4px;
		font-size: 14px;
		opacity: 0.9;
	}

	.modal-footer {
		padding: 24px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
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
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1200px) {
		.copy-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.copy-arrow {
			transform: rotate(90deg);
		}

		.schedule-table {
			font-size: 12px;
		}

		.day-header {
			min-width: 100px;
		}
	}
</style>