<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { toasts } from '$lib/stores/toastStore';
	import type { RoomWithConfig } from '$lib/types';
	import { scale, fade } from 'svelte/transition';
	import { currentWeekday, currentTime } from '$lib/stores/appState';
	import { get } from 'svelte/store';

	// SVELTE 5 PROPS SYNTAX
	let { room, onClose } = $props<{
		room: RoomWithConfig;
		onClose: () => void;
	}>();

	// SVELTE 5 STATE SYNTAX
	let name = $state(room.name);
	let floor = $state(room.floor || 'eg');
	let backgroundColor = $state(room.background_color);
	let activity = $state(room.config?.activity || '');
	let openTime = $state(room.config?.open_time || '');
	let closeTime = $state(room.config?.close_time || '');
	let titleFontSize = $state(room.config?.title_font_size || 42);
	let textFontSize = $state(room.config?.text_font_size || 28);
	let imageFile = $state<File | null>(null);
	let uploading = $state(false);

	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	async function handleSave() {
		uploading = true;
		try {
			await supabase
				.from('rooms')
				.update({
					name,
					floor,
					background_color: backgroundColor
				})
				.eq('id', room.id);

			const configData = {
				room_id: room.id,
				weekday: get(currentWeekday),
				activity,
				open_time: openTime || null,
				close_time: closeTime || null,
				title_font_size: titleFontSize,
				text_font_size: textFontSize
			};
			await supabase.from('daily_configs').upsert(configData, {
				onConflict: 'room_id,weekday'
			});

			const now = get(currentTime);
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			const openTimeParsed = parseTimeLocal(openTime);

			if (openTimeParsed !== null && openTimeParsed > nowMinutes) {
				await supabase
					.from('room_status')
					.upsert(
						{ room_id: room.id, is_open: false, manual_override: false },
						{ onConflict: 'room_id' }
					);
			}

			if (imageFile) {
				const fileExt = imageFile.name.split('.').pop();
				const fileName = `${room.id}-${Date.now()}.${fileExt}`;
				const { error: uploadError } = await supabase.storage
					.from('room-images')
					.upload(fileName, imageFile);

				if (!uploadError) {
					const {
						data: { publicUrl }
					} = supabase.storage.from('room-images').getPublicUrl(fileName);

					await supabase.from('rooms').update({ image_url: publicUrl }).eq('id', room.id);
				} else {
					console.error('Error uploading image:', uploadError);
					toasts.show('✕ Fehler beim Bild-Upload!', 'error');
				}
			}

			toasts.show('✓ Raum erfolgreich aktualisiert!', 'success');
			onClose();
		} catch (error) {
			console.error('Error saving room:', error);
			toasts.show('✕ Fehler beim Speichern!', 'error');
		} finally {
			uploading = false;
		}
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			imageFile = target.files[0];
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleModalClick(e: MouseEvent) {
		e.stopPropagation();
	}
</script>

<div
	class="modal-backdrop"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	transition:fade
	role="presentation"
	tabindex="-1"
>
	<div
		class="modal"
		onclick={handleModalClick}
		transition:scale
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.stopPropagation();
			}
		}}
	>
		<div class="modal-header">
			<h2 id="modal-title">Raum bearbeiten</h2>
			<button class="close-btn" onclick={onClose} aria-label="Schließen">✕</button>
		</div>

		<div class="modal-content">
			<div class="form-group">
				<label for="room-name-{room.id}">Raum-Name</label>
				<input id="room-name-{room.id}" type="text" bind:value={name} placeholder="z.B. Turnhalle" />
			</div>

			<div class="form-group">
				<label for="room-floor-{room.id}">Stockwerk</label>
				<select id="room-floor-{room.id}" bind:value={floor}>
					<option value="extern">🏃 Außenbereich</option>
					<option value="dach">🏠 Dachgeschoss</option>
					<option value="og2">2️⃣ 2. OG</option>
					<option value="og1">1️⃣ 1. OG</option>
					<option value="eg">🚪 Erdgeschoss</option>
					<option value="ug">⬇️ Untergeschoss</option>
				</select>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="room-color-{room.id}">Hintergrundfarbe</label>
					<input id="room-color-{room.id}" type="color" bind:value={backgroundColor} />
				</div>
				<div class="form-group">
					<label for="color-preview-{room.id}">Vorschau</label>
					<div id="color-preview-{room.id}" class="color-preview" style="background: {backgroundColor}" role="img" aria-label="Farbvorschau"></div>
				</div>
			</div>

			<div class="form-group">
				<label for="room-activity-{room.id}">Aktivität (für {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][get(currentWeekday)]})</label>
				<input id="room-activity-{room.id}" type="text" bind:value={activity} placeholder="z.B. Freies Spielen" />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="room-open-time-{room.id}">Öffnet um</label>
					<input id="room-open-time-{room.id}" type="time" bind:value={openTime} />
				</div>
				<div class="form-group">
					<label for="room-close-time-{room.id}">Schließt um (Wird ignoriert)</label>
					<input id="room-close-time-{room.id}" type="time" bind:value={closeTime} />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="room-title-font-{room.id}">Titel-Schriftgröße: {titleFontSize}px</label>
					<input id="room-title-font-{room.id}" type="range" bind:value={titleFontSize} min="24" max="72" />
				</div>
				<div class="form-group">
					<label for="room-text-font-{room.id}">Text-Schriftgröße: {textFontSize}px</label>
					<input id="room-text-font-{room.id}" type="range" bind:value={textFontSize} min="16" max="48" />
				</div>
			</div>

			<div class="form-group">
				<label for="room-image-{room.id}">Hintergrundbild</label>
				<input
					id="room-image-{room.id}"
					type="file"
					accept="image/*"
					onchange={handleFileChange}
				/>
				{#if room.image_url}
					<p class="hint">Aktuelles Bild: {room.image_url.split('/').pop()}</p>
				{/if}
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" onclick={onClose}>Abbrechen</button>
			<button class="btn btn-primary" onclick={handleSave} disabled={uploading}>
				{uploading ? 'Lädt hoch...' : 'Speichern'}
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

	.modal {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 24px;
		width: 90%;
		max-width: 600px;
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

	.form-group {
		margin-bottom: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.9;
	}

	input[type='text'],
	input[type='time'],
	input[type='file'],
	select {
		width: 100%;
		padding: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 16px;
		transition: all 0.3s;
		cursor: pointer;
	}

	select option {
		background: #1e3a8a;
		color: white;
	}

	input[type='text']:focus,
	input[type='time']:focus,
	select:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.8);
		background: rgba(255, 255, 255, 0.15);
	}

	input[type='color'] {
		width: 100%;
		height: 50px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		cursor: pointer;
	}

	input[type='range'] {
		width: 100%;
	}

	.color-preview {
		width: 100%;
		height: 50px;
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.hint {
		font-size: 12px;
		opacity: 0.7;
		margin-top: 5px;
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