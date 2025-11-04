<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { toasts } from '$lib/stores/toastStore';
	import ColorPicker from './ColorPicker.svelte';
	import TextColorPicker from './TextColorPicker.svelte';
	import type { RoomWithConfig } from '$lib/types';
	import { scale, fade } from 'svelte/transition';
	import { currentWeekday, currentTime } from '$lib/stores/appState';
	import { get } from 'svelte/store';

	// Svelte 5 Props Syntax
	let { room, onClose } = $props<{
		room: RoomWithConfig;
		onClose: () => void;
	}>();

	// Svelte 5 State Syntax
	let name = $state(room.name);
	let floor = $state(room.floor || 'eg');
	let backgroundColor = $state(room.background_color);
	let textColor = $state(room.config?.text_color || '#FFFFFF'); // ✅ NEU: Textfarbe
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
			// Update Room
			await supabase
				.from('rooms')
				.update({
					name,
					floor,
					background_color: backgroundColor
				})
				.eq('id', room.id);

			// Update/Insert Daily Config
			const configData = {
				room_id: room.id,
				weekday: get(currentWeekday),
				activity,
				open_time: openTime || null,
				close_time: closeTime || null,
				title_font_size: titleFontSize,
				text_font_size: textFontSize,
				text_color: textColor // ✅ NEU: Textfarbe speichern
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

			// Upload Image if selected
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
			<!-- ✅ SEKTION 1: Grunddaten -->
			<div class="section-card">
				<div class="section-header">
					<span class="section-icon">📝</span>
					<h3 class="section-title">Grunddaten</h3>
				</div>
				<div class="section-body">
					<div class="input-group">
						<label for="room-name-{room.id}">Raum-Name</label>
						<input id="room-name-{room.id}" type="text" bind:value={name} placeholder="z.B. Turnhalle" />
					</div>

					<div class="input-group">
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
				</div>
			</div>

			<!-- ✅ SEKTION 2: Design & Farben -->
			<div class="section-card section-card-colors">
				<div class="section-header">
					<span class="section-icon">🎨</span>
					<h3 class="section-title">Design & Farben</h3>
				</div>
				<div class="section-body">
					<div class="input-group">
						<label for="room-color-{room.id}">Hintergrundfarbe</label>
						<ColorPicker
							value={backgroundColor}
							onChange={(color) => backgroundColor = color}
						/>
					</div>

					<div class="input-group">
						<label for="room-text-color-{room.id}">Textfarbe</label>
						<TextColorPicker
							value={textColor}
							onChange={(color) => textColor = color}
						/>
					</div>

					<div class="preview-card">
						<label>Live-Vorschau</label>
						<div class="color-preview" style="background: {backgroundColor}; color: {textColor};">
							<div class="preview-title" style="font-size: {titleFontSize}px;">{name || 'Raumname'}</div>
							<div class="preview-text" style="font-size: {textFontSize}px;">{activity || 'Aktivitätstext'}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- ✅ SEKTION 3: Inhalt -->
			<div class="section-card">
				<div class="section-header">
					<span class="section-icon">📄</span>
					<h3 class="section-title">Inhalt</h3>
				</div>
				<div class="section-body">
					<div class="input-group">
						<label for="room-activity-{room.id}">
							Aktivität (für {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][get(currentWeekday)]})
							<span class="hint-inline">Mehrzeilig möglich</span>
						</label>
						<textarea
							id="room-activity-{room.id}"
							bind:value={activity}
							placeholder="z.B. Freies Spielen&#10;Bewegung & Sport&#10;08:00-12:00 Uhr"
							rows="4"
						></textarea>
						<p class="hint">💡 Drücke Enter für neue Zeilen</p>
					</div>

					<div class="input-row">
						<div class="input-group">
							<label for="room-open-time-{room.id}">⏰ Öffnet um</label>
							<input id="room-open-time-{room.id}" type="time" bind:value={openTime} />
						</div>
						<div class="input-group">
							<label for="room-close-time-{room.id}">🔒 Schließt um</label>
							<input id="room-close-time-{room.id}" type="time" bind:value={closeTime} />
						</div>
					</div>
				</div>
			</div>

			<!-- ✅ SEKTION 4: Schriftgrößen -->
			<div class="section-card">
				<div class="section-header">
					<span class="section-icon">🔤</span>
					<h3 class="section-title">Schriftgrößen</h3>
				</div>
				<div class="section-body">
					<div class="slider-group">
						<div class="slider-header">
							<label>Titel-Schriftgröße</label>
							<span class="slider-value">{titleFontSize}px</span>
						</div>
						<input type="range" bind:value={titleFontSize} min="10" max="100" class="premium-slider" />
					</div>

					<div class="slider-group">
						<div class="slider-header">
							<label>Text-Schriftgröße</label>
							<span class="slider-value">{textFontSize}px</span>
						</div>
						<input type="range" bind:value={textFontSize} min="8" max="80" class="premium-slider" />
					</div>
				</div>
			</div>

			<!-- ✅ SEKTION 5: Hintergrundbild -->
			<div class="section-card">
				<div class="section-header">
					<span class="section-icon">🖼️</span>
					<h3 class="section-title">Hintergrundbild</h3>
				</div>
				<div class="section-body">
					<div class="input-group">
						<label for="room-image-{room.id}">Bild hochladen</label>
						<input id="room-image-{room.id}" type="file" accept="image/*" onchange={handleFileChange} class="file-input" />
						{#if room.image_url}
							<p class="hint">📷 Aktuell: {room.image_url.split('/').pop()}</p>
						{/if}
					</div>
				</div>
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
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(8px);
	}

	.modal {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border-radius: 20px;
		width: 90%;
		max-width: 650px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow:
			0 24px 64px rgba(0, 0, 0, 0.6),
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		color: white;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 22px;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
		transform: rotate(90deg) scale(1.1);
		box-shadow:
			0 0 20px rgba(239, 68, 68, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.modal-content {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* ✅ Section Cards */
	.section-card {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 16px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		margin-bottom: 16px;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		overflow: visible; /* ✅ Verhindert Abschneiden von ColorPicker */
		position: relative; /* ✅ Für z-index Stacking */
	}

	/* ✅ Höherer z-index für Color Picker Section */
	.section-card-colors {
		z-index: 10; /* ✅ Über anderen Sections, damit ColorPicker nicht überlagert wird */
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	.section-icon {
		font-size: 24px;
		min-width: 28px;
		text-align: center;
	}

	.section-title {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.section-body {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow: visible; /* ✅ Verhindert Abschneiden von ColorPicker */
		position: relative;
		z-index: 1;
	}

	/* ✅ Input Groups */
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.input-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	label {
		display: block;
		font-weight: 600;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		opacity: 0.95;
		color: rgba(255, 255, 255, 0.95);
	}

	.hint-inline {
		font-size: 10px;
		font-weight: 400;
		text-transform: none;
		opacity: 0.6;
		margin-left: 8px;
	}

	/* ✅ Premium Inputs */
	input[type='text'],
	input[type='time'],
	select,
	textarea {
		width: 100%;
		padding: 14px 16px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.08);
		color: white;
		font-size: 15px;
		font-weight: 500;
		transition: all 0.3s;
		font-family: inherit;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	input[type='text']::placeholder,
	textarea::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	input[type='text']:focus,
	input[type='time']:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.12);
		box-shadow:
			0 0 24px rgba(59, 130, 246, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	textarea {
		resize: vertical;
		min-height: 90px;
		line-height: 1.5;
	}

	select {
		cursor: pointer;
	}

	select option {
		background: #1e3a8a;
		color: white;
		padding: 10px;
	}

	/* ✅ File Input */
	.file-input {
		cursor: pointer;
		padding: 12px;
		font-size: 14px;
	}

	.file-input::-webkit-file-upload-button {
		padding: 8px 16px;
		border: 2px solid rgba(59, 130, 246, 0.5);
		border-radius: 8px;
		background: rgba(59, 130, 246, 0.2);
		color: white;
		font-weight: 600;
		cursor: pointer;
		margin-right: 12px;
		transition: all 0.3s;
	}

	.file-input::-webkit-file-upload-button:hover {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.7);
	}

	.hint {
		font-size: 12px;
		opacity: 0.7;
		margin: 0;
		padding: 6px 0 0 0;
		color: rgba(255, 255, 255, 0.7);
	}

	/* ✅ Slider Groups */
	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.slider-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slider-value {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-accent);
		min-width: 60px;
		text-align: right;
	}

	/* ✅ Premium Slider */
	.premium-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		transition: all 0.2s;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.premium-slider:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.premium-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.4),
			0 0 20px rgba(59, 130, 246, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		transition: all 0.2s;
	}

	.premium-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.5),
			0 0 30px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.premium-slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		cursor: pointer;
		border: none;
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.4),
			0 0 20px rgba(59, 130, 246, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		transition: all 0.2s;
	}

	.premium-slider::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.5),
			0 0 30px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	/* ✅ Live Preview Card */
	.preview-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.color-preview {
		width: 100%;
		min-height: 120px;
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 20px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.preview-title {
		font-weight: 700;
		text-shadow:
			2px 2px 6px rgba(0, 0, 0, 0.9),
			0 0 8px rgba(0, 0, 0, 0.7);
		text-align: center;
	}

	.preview-text {
		font-weight: 600;
		text-shadow:
			1px 1px 3px rgba(0, 0, 0, 0.8),
			0 0 6px rgba(0, 0, 0, 0.6);
		opacity: 0.9;
		text-align: center;
	}

	/* ✅ Modal Footer - Premium Buttons */
	.modal-footer {
		padding: 20px 24px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn {
		padding: 14px 28px;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		min-width: 120px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		color: white;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: 2px solid rgba(59, 130, 246, 0.5);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 0 32px rgba(59, 130, 246, 0.5),
			0 6px 20px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		border-color: rgba(59, 130, 246, 0.8);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* ✅ Scrollbar Styling */
	.modal::-webkit-scrollbar,
	.modal-content::-webkit-scrollbar {
		width: 10px;
	}

	.modal::-webkit-scrollbar-track,
	.modal-content::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 5px;
	}

	.modal::-webkit-scrollbar-thumb,
	.modal-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 5px;
		border: 2px solid rgba(0, 0, 0, 0.3);
	}

	.modal::-webkit-scrollbar-thumb:hover,
	.modal-content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* ✅ Responsive */
	@media (max-width: 768px) {
		.modal {
			width: 95%;
			max-height: 85vh;
		}

		.input-row {
			grid-template-columns: 1fr;
		}

		.modal-header {
			padding: 16px 20px;
		}

		.modal-header h2 {
			font-size: 22px;
		}

		.modal-content {
			padding: 16px;
		}

		.section-header {
			padding: 14px 16px;
		}

		.section-body {
			padding: 16px;
		}

		.modal-footer {
			padding: 16px 20px;
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}
	}
</style>