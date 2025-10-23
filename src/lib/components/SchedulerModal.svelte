<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { rooms, dailyConfigs, currentWeekday } from '$lib/stores/appState';
	import { scale, fade } from 'svelte/transition';

	export let onClose: () => void;

	const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	$: currentDayConfigs = $rooms.map((room) => {
		const configKey = `${room.id}-${$currentWeekday}`;
		const config = $dailyConfigs.get(configKey);
		return {
			room,
			config,
			hasSchedule: !!(config?.open_time && config?.close_time)
		};
	});

	async function updateTime(roomId: string, field: 'open_time' | 'close_time', value: string) {
		await supabase
			.from('daily_configs')
			.upsert(
				{
					room_id: roomId,
					weekday: $currentWeekday,
					[field]: value || null
				},
				{ onConflict: 'room_id,weekday' }
			);
	}

	async function copyToDay(targetDay: number) {
		if (!confirm(`Alle Zeitpläne von ${weekdays[$currentWeekday]} auf ${weekdays[targetDay]} kopieren?`))
			return;

		for (const { room, config } of currentDayConfigs) {
			if (config) {
				await supabase.from('daily_configs').upsert(
					{
						room_id: room.id,
						weekday: targetDay,
						activity: config.activity,
						open_time: config.open_time,
						close_time: config.close_time,
						title_font_size: config.title_font_size,
						text_font_size: config.text_font_size
					},
					{ onConflict: 'room_id,weekday' }
				);
			}
		}

		alert('Zeitpläne kopiert!');
	}
</script>

<div class="modal-backdrop" on:click={onClose} transition:fade>
	<div class="modal" on:click|stopPropagation transition:scale>
		<div class="modal-header">
			<h2>📅 Zeitplan für {weekdays[$currentWeekday]}</h2>
			<button class="close-btn" on:click={onClose}>✕</button>
		</div>

		<div class="modal-content">
			<div class="schedule-list">
				{#each currentDayConfigs as { room, config, hasSchedule }}
					<div class="schedule-item" class:has-schedule={hasSchedule}>
						<div class="room-info">
							<div class="room-color" style="background: {room.background_color}"></div>
							<span class="room-name">{room.name}</span>
						</div>

						<div class="time-inputs">
							<input
								type="time"
								value={config?.open_time || ''}
								on:change={(e) => updateTime(room.id, 'open_time', e.currentTarget.value)}
								placeholder="Öffnet"
							/>
							<span class="separator">→</span>
							<input
								type="time"
								value={config?.close_time || ''}
								on:change={(e) => updateTime(room.id, 'close_time', e.currentTarget.value)}
								placeholder="Schließt"
							/>
						</div>
					</div>
				{/each}
			</div>

			<div class="copy-section">
				<h3>Zeitpläne kopieren</h3>
				<div class="copy-buttons">
					{#each [1, 2, 3, 4, 5] as day}
						{#if day !== $currentWeekday}
							<button class="copy-btn" on:click={() => copyToDay(day)}>
								→ {weekdays[day]}
							</button>
						{/if}
					{/each}
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-primary" on:click={onClose}>Fertig</button>
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

	.modal {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 24px;
		width: 90%;
		max-width: 700px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		color: white;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24px;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
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
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: rotate(90deg);
	}

	.modal-content {
		padding: 24px;
	}

	.schedule-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 30px;
	}

	.schedule-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s;
	}

	.schedule-item.has-schedule {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.room-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.room-color {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.room-name {
		font-weight: 600;
		font-size: 16px;
	}

	.time-inputs {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.time-inputs input {
		padding: 8px 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		width: 100px;
	}

	.separator {
		font-size: 18px;
		opacity: 0.5;
	}

	.copy-section {
		margin-top: 30px;
		padding-top: 20px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
	}

	.copy-section h3 {
		margin: 0 0 15px 0;
		font-size: 18px;
		font-weight: 600;
	}

	.copy-buttons {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.copy-btn {
		padding: 10px 20px;
		background: rgba(59, 130, 246, 0.3);
		border: 2px solid rgba(59, 130, 246, 0.5);
		border-radius: 10px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.copy-btn:hover {
		background: rgba(59, 130, 246, 0.5);
		transform: translateY(-2px);
	}

	.modal-footer {
		padding: 24px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: flex-end;
	}

	.btn {
		padding: 12px 32px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
	}
</style>
