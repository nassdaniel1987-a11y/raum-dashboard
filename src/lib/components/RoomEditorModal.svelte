<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { toasts } from '$lib/stores/toastStore';
	import ColorPicker from './ColorPicker.svelte';
	import TextColorPicker from './TextColorPicker.svelte';
	import ImageCropTool from './ImageCropTool.svelte';
	import type { RoomWithConfig, ImageCrop } from '$lib/types';
	import { scale, fade } from 'svelte/transition';
	import { viewWeekday, currentTime } from '$lib/stores/appState';
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
	let person = $state(room.person || ''); // ✅ NEU: Person im Raum
	let activity = $state(room.config?.activity || '');
	let openTime = $state(room.config?.open_time || '');
	let closeTime = $state(room.config?.close_time || '');
	let titleFontSize = $state(room.config?.title_font_size || 42);
	let textFontSize = $state(room.config?.text_font_size || 28);
	let imageFile = $state<File | null>(null);
	let uploading = $state(false);

	// ✅ Aktivitäts-Bild State
	let activityImageFile = $state<File | null>(null);
	let activityImagePreview = $state<string | null>(room.config?.activity_image_url || null);
	let activityImageSize = $state<'small' | 'medium' | 'large'>(room.config?.activity_image_size || 'medium');
	let activityImageCrop = $state(room.config?.activity_image_crop || null);
	let showCropTool = $state(false);

	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	// ✅ Handle Aktivitäts-Bild Upload
	function handleActivityImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			activityImageFile = file;
			// Erstelle Preview
			const reader = new FileReader();
			reader.onload = (e) => {
				activityImagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeActivityImage() {
		activityImageFile = null;
		activityImagePreview = null;
		activityImageCrop = null;
	}

	async function handleSave() {
		uploading = true;
		try {
			// ✅ 1. Upload Aktivitäts-Bild zu Storage (falls vorhanden)
			let finalActivityImageUrl = activityImagePreview;
			if (activityImageFile) {
				const fileExt = activityImageFile.name.split('.').pop();
				const fileName = `activity-${room.id}-${Date.now()}.${fileExt}`;
				const { error: uploadError } = await supabase.storage
					.from('room-images')
					.upload(fileName, activityImageFile, {
						cacheControl: '3600',
						upsert: true
					});

				if (!uploadError) {
					const {
						data: { publicUrl }
					} = supabase.storage.from('room-images').getPublicUrl(fileName);
					finalActivityImageUrl = publicUrl;
				} else {
					console.error('Error uploading activity image:', uploadError);
					toasts.show('✕ Fehler beim Aktivitäts-Bild Upload!', 'error');
					uploading = false;
					return;
				}
			}

			// Update Room
			await supabase
				.from('rooms')
				.update({
					name,
					floor,
					background_color: backgroundColor,
					person: person || null // ✅ NEU: Person speichern
				})
				.eq('id', room.id);

			// Update/Insert Daily Config
			const configData = {
				room_id: room.id,
				weekday: get(viewWeekday),
				activity,
				open_time: openTime || null,
				close_time: closeTime || null,
				title_font_size: titleFontSize,
				text_font_size: textFontSize,
				text_color: textColor, // ✅ NEU: Textfarbe speichern
				activity_image_url: finalActivityImageUrl, // ✅ Storage URL statt Base64
				activity_image_size: activityImageSize, // ✅ Bildgröße
				activity_image_crop: activityImageCrop // ✅ Crop-Einstellungen
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

					<div class="input-group">
						<label for="room-person-{room.id}">👤 Person im Raum</label>
						<input id="room-person-{room.id}" type="text" bind:value={person} placeholder="z.B. Max Mustermann" />
						<p class="hint">💡 Optional: Zeigt an, wer aktuell in diesem Raum ist</p>
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
							Aktivität (für {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][get(viewWeekday)]})
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

			<!-- ✅ SEKTION 3.5: Aktivitäts-Bild -->
			<div class="section-card">
				<div class="section-header">
					<span class="section-icon">🖼️</span>
					<h3 class="section-title">Aktivitäts-Bild</h3>
				</div>
				<div class="section-body">
					<p class="hint">📌 Zeigt Kindern visuell was in diesem Raum stattfindet (z.B. Bastel-Beispiel)</p>

					<!-- Größen-Auswahl -->
					<div class="input-group">
						<label>Bildgröße</label>
						<div class="size-buttons">
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'small'}
								onclick={() => activityImageSize = 'small'}
							>
								Klein
							</button>
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'medium'}
								onclick={() => activityImageSize = 'medium'}
							>
								Mittel
							</button>
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'large'}
								onclick={() => activityImageSize = 'large'}
							>
								Groß
							</button>
						</div>
					</div>

					<!-- Bild Upload -->
					<div class="input-group">
						<label>Bild hochladen</label>
						<input
							type="file"
							accept="image/*"
							onchange={handleActivityImageSelect}
							class="file-input"
						/>
					</div>

					<!-- Bild Preview -->
					{#if activityImagePreview}
						<div class="image-preview-container">
							<div class="preview-header">
								<span>Vorschau ({activityImageSize})</span>
								<button type="button" class="remove-btn" onclick={removeActivityImage}>
									🗑️ Entfernen
								</button>
							</div>
							<div class="activity-preview" class:size-small={activityImageSize === 'small'} class:size-medium={activityImageSize === 'medium'} class:size-large={activityImageSize === 'large'}>
								<img src={activityImagePreview} alt="Preview" />
							</div>
							<button type="button" class="crop-btn" onclick={() => showCropTool = !showCropTool}>
								✂️ {showCropTool ? 'Crop schließen' : 'Bild zuschneiden'}
							</button>

							{#if showCropTool}
								<ImageCropTool
									imageSrc={activityImagePreview}
									onCropChange={(crop) => activityImageCrop = crop}
								/>
							{/if}
						</div>
					{/if}
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
		background: rgba(15, 23, 42, 0.98);
		backdrop-filter: blur(20px);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		width: 90%;
		max-width: 900px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
		color: white;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		letter-spacing: 0.3px;
		color: white;
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
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.modal-content {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* ✅ Section Cards */
	.section-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		margin-bottom: 16px;
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
		gap: 8px;
		padding: 12px 16px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.section-icon {
		font-size: 18px;
		min-width: 24px;
		text-align: center;
	}

	.section-title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.section-body {
		padding: 16px;
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
		font-weight: 500;
		font-size: 14px;
		color: white;
	}

	.hint-inline {
		font-size: 11px;
		font-weight: 400;
		text-transform: none;
		color: rgba(255, 255, 255, 0.5);
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
		font-size: 11px;
		margin: 0;
		padding: 6px 0 0 0;
		color: rgba(255, 255, 255, 0.5);
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
		font-size: 14px;
		font-weight: 700;
		color: white;
		min-width: 60px;
		text-align: right;
		font-family: 'Courier New', monospace;
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
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		gap: 8px;
		justify-content: flex-end;
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
	/* ✅ Aktivitäts-Bild Styles */
	.size-buttons {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.size-btn {
		flex: 1;
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
	}

	.size-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.size-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		color: #60a5fa;
	}

	.image-preview-container {
		margin-top: 16px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		font-weight: 600;
	}

	.remove-btn {
		padding: 6px 12px;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 6px;
		color: #ef4444;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 13px;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.activity-preview {
		width: 100%;
		padding: 8px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 4px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
		overflow: hidden;
	}

	.activity-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 2px;
	}

	.activity-preview.size-small {
		max-height: 80px;
	}

	.activity-preview.size-medium {
		max-height: 120px;
	}

	.activity-preview.size-large {
		max-height: 180px;
	}

	.crop-btn {
		width: 100%;
		margin-top: 12px;
		padding: 10px;
		background: rgba(59, 130, 246, 0.2);
		border: 2px solid rgba(59, 130, 246, 0.4);
		border-radius: 6px;
		color: #60a5fa;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
	}

	.crop-btn:hover {
		background: rgba(59, 130, 246, 0.3);
	}

	@media (max-width: 768px) {
		.modal {
			width: 95%;
			max-width: 95%;
			max-height: 95vh;
		}

		.input-row {
			grid-template-columns: 1fr;
		}

		.modal-content {
			padding: 16px;
		}

		.section-header {
			padding: 10px 14px;
		}

		.section-body {
			padding: 14px;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.modal {
			width: 100%;
			max-width: 100%;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>