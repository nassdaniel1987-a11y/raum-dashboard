<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { toasts } from '$lib/stores/toastStore';
	import ColorPicker from './ColorPicker.svelte';
	import TextColorPicker from './TextColorPicker.svelte';
	import SimpleImageEditor from './SimpleImageEditor.svelte';
	import type { RoomWithConfig, ImagePosition } from '$lib/types';
	import { scale, fade } from 'svelte/transition';
	import { viewWeekday, currentTime, persons } from '$lib/stores/appState';
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
	let person = $state(room.person || '');
	let selectedPersons = $state<string[]>(
		room.person ? room.person.split(',').map((p: string) => p.trim()).filter((p: string) => p) : []
	);
	let showPersonPicker = $state(false);
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
	let activityImagePosition = $state<ImagePosition | null>(room.config?.activity_image_position || null);

	// ✅ Bild-Resize State
	let originalImageDimensions = $state<{ width: number; height: number; size: number } | null>(null);
	let resizePercentage = $state(75); // Default 75%
	let resizedImageFile = $state<File | null>(null);

	// ✅ Drag & Drop State
	let isDragging = $state(false);

	// ✅ Bild-Verarbeitungs-Status
	let processingImage = $state(false);

	const parseTimeLocal = (timeString: string | null | undefined): number | null => {
		if (!timeString) return null;
		const [hours, minutes] = timeString.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	// ✅ Bild resizen mit Canvas
	async function resizeImage(file: File, percentage: number): Promise<{ file: File; dataUrl: string }> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const originalDataUrl = e.target?.result as string;
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement('canvas');
					const scale = percentage / 100;
					canvas.width = img.width * scale;
					canvas.height = img.height * scale;

					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Could not get canvas context'));
						return;
					}

					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					// ✅ Aggressivere Kompression (0.8 statt 0.92)
					canvas.toBlob((blob) => {
						if (!blob) {
							reject(new Error('Could not create blob'));
							return;
						}

						// ✅ VERBESSERT: Vergleiche Dateigrößen - IMMER die kleinere verwenden
						if (blob.size >= file.size) {
							// Resized ist GRÖSSER - verwende Original!
							console.log(`📦 Original behalten: ${(file.size/1024).toFixed(0)}KB < ${(blob.size/1024).toFixed(0)}KB`);
							resolve({ file, dataUrl: originalDataUrl });
						} else {
							// Resized ist KLEINER - verwende resized!
							console.log(`📦 Resized verwenden: ${(blob.size/1024).toFixed(0)}KB < ${(file.size/1024).toFixed(0)}KB`);
							const resizedFile = new File([blob], file.name, { type: file.type });
							const dataUrl = canvas.toDataURL(file.type);
							resolve({ file: resizedFile, dataUrl });
						}
					}, file.type, 0.8); // ✅ 80% Qualität
				};
				img.onerror = reject;
				img.src = originalDataUrl;
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	// ✅ Handle Aktivitäts-Bild Upload
	async function handleActivityImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			await processImageFile(file);
		}
	}

	// ✅ Gemeinsame Funktion für File-Verarbeitung (Input + Drag & Drop)
	const MAX_FILE_SIZE_MB = 10;
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	async function processImageFile(file: File) {
		if (!file.type.startsWith('image/')) {
			toasts.show('Nur Bilddateien erlaubt!', 'error');
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toasts.show(`Datei zu groß! Max. ${MAX_FILE_SIZE_MB}MB erlaubt (${Math.round(file.size / 1024 / 1024)}MB)`, 'error');
			return;
		}

		processingImage = true;
		activityImageFile = file;

		// Lade Bild um Dimensionen zu bekommen
		const reader = new FileReader();
		reader.onload = async (e) => {
			const img = new Image();
			img.onload = async () => {
				// Speichere Original-Dimensionen
				originalImageDimensions = {
					width: img.width,
					height: img.height,
					size: file.size
				};

				// Resize mit aktuellem Prozentsatz
				try {
					const { file: resized, dataUrl } = await resizeImage(file, resizePercentage);
					resizedImageFile = resized;
					activityImagePreview = dataUrl;
				} catch (error) {
					console.error('Error resizing image:', error);
					activityImagePreview = e.target?.result as string;
				}
				processingImage = false;
			};
			img.onerror = () => {
				processingImage = false;
				toasts.show('Bild konnte nicht geladen werden!', 'error');
			};
			img.src = e.target?.result as string;
		};
		reader.onerror = () => {
			processingImage = false;
			toasts.show('Fehler beim Lesen der Datei!', 'error');
		};
		reader.readAsDataURL(file);
	}

	// ✅ Drag & Drop Handler
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const file = e.dataTransfer?.files[0];
		if (file) {
			await processImageFile(file);
		}
	}

	// ✅ Handle Resize Percentage Change
	async function handleResizeChange() {
		if (activityImageFile && originalImageDimensions) {
			try {
				const { file: resized, dataUrl } = await resizeImage(activityImageFile, resizePercentage);
				resizedImageFile = resized;
				activityImagePreview = dataUrl;
			} catch (error) {
				console.error('Error resizing image:', error);
			}
		}
	}

	async function removeActivityImage() {
		// Bestätigung einholen
		if (!confirm('Möchtest du dieses Bild wirklich löschen?')) {
			return;
		}

		uploading = true;
		try {
			// ✅ Lösche aus Storage wenn es eine URL gibt
			if (room.config?.activity_image_url && room.config.activity_image_url.includes('room-images')) {
				// Extrahiere Dateinamen aus URL
				const urlParts = room.config.activity_image_url.split('/');
				const fileName = urlParts[urlParts.length - 1];

				const { error: deleteError } = await supabase.storage
					.from('room-images')
					.remove([fileName]);

				if (deleteError) {
					console.error('Error deleting from storage:', deleteError);
				}
			}

			// ✅ Update Database - setze image URL auf null
			await supabase.from('daily_configs').update({
				activity_image_url: null,
				activity_image_size: 'medium',
				activity_image_position: null
			}).eq('room_id', room.id).eq('weekday', get(viewWeekday));

			// ✅ Clear local state
			activityImageFile = null;
			activityImagePreview = null;
			activityImagePosition = null;
			originalImageDimensions = null;
			resizedImageFile = null;
			resizePercentage = 75;

			toasts.show('✓ Bild erfolgreich gelöscht!', 'success');
		} catch (error) {
			console.error('Error removing image:', error);
			toasts.show('✕ Fehler beim Löschen!', 'error');
		} finally {
			uploading = false;
		}
	}

	async function handleSave() {
		uploading = true;
		try {
			// ✅ 1. Upload Aktivitäts-Bild zu Storage (falls vorhanden)
			let finalActivityImageUrl = activityImagePreview;
			const fileToUpload = resizedImageFile || activityImageFile;
			if (fileToUpload) {
				const fileExt = fileToUpload.name.split('.').pop();
				const fileName = `activity-${room.id}-${Date.now()}.${fileExt}`;
				const { error: uploadError } = await supabase.storage
					.from('room-images')
					.upload(fileName, fileToUpload, {
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
					person: selectedPersons.length > 0 ? selectedPersons.join(', ') : null
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
				activity_image_position: activityImagePosition // ✅ Position & Zoom-Einstellungen
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
							<option value="essen">🍽️ Essen</option>
							<option value="ug">⬇️ Untergeschoss</option>
						</select>
					</div>

					<div class="input-group">
						<label>👤 Person im Raum</label>

						<!-- Zugewiesene Personen -->
						{#if selectedPersons.length > 0}
							<div class="editor-assigned-row">
								{#each selectedPersons as pName}
									<span class="editor-assigned-chip">
										{pName}
										<button
											class="editor-chip-remove"
											onclick={() => { selectedPersons = selectedPersons.filter(p => p !== pName); }}
										>✕</button>
									</span>
								{/each}
							</div>
						{/if}

						<!-- Toggle-Button -->
						<button
							class="editor-picker-toggle"
							onclick={() => showPersonPicker = !showPersonPicker}
						>
							{showPersonPicker ? '▲ Personen ausblenden' : '＋ Person zuweisen'}
						</button>

						<!-- Chip-Grid -->
						{#if showPersonPicker}
							<div class="editor-chips-grid">
								{#if $persons.length === 0}
									<p class="editor-chips-empty">Keine Personen angelegt. Bitte in Einstellungen &rarr; Personen eintragen.</p>
								{:else}
									{#each $persons as p (p.id)}
										{@const isSelected = selectedPersons.includes(p.name)}
										<button
											class="editor-person-chip"
											class:chip-active={isSelected}
											onclick={() => {
												if (isSelected) {
													selectedPersons = selectedPersons.filter(n => n !== p.name);
												} else {
													selectedPersons = [...selectedPersons, p.name];
												}
											}}
										>
											<span class="editor-chip-check">{isSelected ? '✓' : ''}</span>
											<span>{p.name}</span>
										</button>
									{/each}
								{/if}
							</div>
						{/if}

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
						<label>Bildgröße auf Kachel</label>
						<div class="size-buttons">
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'small'}
								onclick={() => activityImageSize = 'small'}
							>
								<span class="size-label">Klein</span>
								<span class="size-dimension">80px</span>
							</button>
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'medium'}
								onclick={() => activityImageSize = 'medium'}
							>
								<span class="size-label">Mittel</span>
								<span class="size-dimension">120px</span>
							</button>
							<button
								type="button"
								class="size-btn"
								class:active={activityImageSize === 'large'}
								onclick={() => activityImageSize = 'large'}
							>
								<span class="size-label">Groß</span>
								<span class="size-dimension">180px</span>
							</button>
						</div>
					</div>

					<!-- Bild Upload mit Drag & Drop -->
					<div class="input-group">
						<label>Bild hochladen</label>
						<div
							class="drop-zone"
							class:dragging={isDragging}
							class:processing={processingImage}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							ondrop={handleDrop}
							role="button"
							tabindex="0"
						>
							<div class="drop-zone-content">
								{#if processingImage}
									<span class="drop-icon spinning">⏳</span>
									<span class="drop-text">Bild wird verarbeitet...</span>
								{:else}
									<span class="drop-icon">{isDragging ? '📥' : '🖼️'}</span>
									<span class="drop-text">
										{isDragging ? 'Bild hier ablegen' : 'Bild hierher ziehen'}
									</span>
								{/if}
							</div>
							<input
								type="file"
								accept="image/*"
								onchange={handleActivityImageSelect}
								class="file-input-hidden"
								disabled={processingImage}
							/>
						</div>

						<!-- Buttons für Galerie und Kamera -->
						<div class="image-source-buttons">
							<label class="source-btn gallery">
								<span class="btn-icon">📁</span>
								<span class="btn-text">Bild auswählen</span>
								<input
									type="file"
									accept="image/*"
									onchange={handleActivityImageSelect}
									class="file-input-hidden"
								/>
							</label>
							<label class="source-btn camera">
								<span class="btn-icon">📷</span>
								<span class="btn-text">Foto aufnehmen</span>
								<input
									type="file"
									accept="image/*"
									capture="environment"
									onchange={handleActivityImageSelect}
									class="file-input-hidden"
								/>
							</label>
						</div>
					</div>

					<!-- ✅ Bild-Resize Slider -->
					{#if originalImageDimensions}
						<div class="resize-control">
							<div class="resize-info">
								<div class="info-row">
									<span class="label">📏 Original:</span>
									<span class="value">
										{originalImageDimensions.width} × {originalImageDimensions.height} px
										({Math.round(originalImageDimensions.size / 1024)} KB)
									</span>
								</div>
								<div class="slider-group">
									<div class="slider-header">
										<label>Größe anpassen</label>
										<span class="slider-value">{resizePercentage}%</span>
									</div>
									<input
										type="range"
										bind:value={resizePercentage}
										oninput={handleResizeChange}
										min="25"
										max="100"
										step="25"
										class="premium-slider"
									/>
								</div>
								<div class="info-row">
									<span class="label">📐 Neu:</span>
									<span class="value">
										{Math.round(originalImageDimensions.width * resizePercentage / 100)} × {Math.round(originalImageDimensions.height * resizePercentage / 100)} px
										{#if resizedImageFile}
											({Math.round(resizedImageFile.size / 1024)} KB)
										{/if}
									</span>
								</div>
							</div>
						</div>
					{/if}

					<!-- ✅ WYSIWYG Editor - EXAKTE Vorschau -->
					{#if activityImagePreview}
						<div class="image-preview-container">
							<div class="preview-header">
								<span>📸 WYSIWYG Editor</span>
								<button type="button" class="remove-btn" onclick={removeActivityImage}>
									🗑️ Entfernen
								</button>
							</div>

							<!-- Einfacher Bild-Editor (1:1 Vorschau) -->
							<SimpleImageEditor
								imageSrc={activityImagePreview}
								frameSize={activityImageSize}
								initialZoom={activityImagePosition?.zoom ?? 1}
								initialX={activityImagePosition?.x ?? 0}
								initialY={activityImagePosition?.y ?? 0}
								initialRotation={activityImagePosition?.rotation ?? 0}
								onUpdate={(data) => activityImagePosition = { zoom: data.zoom, x: data.x, y: data.y, rotation: data.rotation }}
							/>
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
	/* Person Chip-Auswahl im Editor */
	.editor-assigned-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 6px;
	}

	.editor-assigned-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: rgba(59, 130, 246, 0.2);
		border: 1px solid rgba(59, 130, 246, 0.4);
		border-radius: 20px;
		font-size: 14px;
		color: white;
	}

	.editor-chip-remove {
		background: rgba(255, 255, 255, 0.15);
		border: none;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-size: 12px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.editor-chip-remove:active {
		background: rgba(239, 68, 68, 0.5);
		transform: scale(1.1);
	}

	.editor-picker-toggle {
		width: 100%;
		padding: 10px 14px;
		border: 1px dashed rgba(59, 130, 246, 0.3);
		border-radius: 10px;
		background: rgba(59, 130, 246, 0.06);
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		-webkit-tap-highlight-color: transparent;
	}

	.editor-picker-toggle:active {
		background: rgba(59, 130, 246, 0.15);
		transform: scale(0.98);
	}

	.editor-chips-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px 0 4px;
	}

	.editor-chips-empty {
		width: 100%;
		color: rgba(255, 255, 255, 0.45);
		font-size: 13px;
		text-align: center;
		margin: 0;
		padding: 8px 0;
	}

	.editor-person-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border: 1.5px solid rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}

	.editor-person-chip:active {
		transform: scale(0.95);
	}

	.editor-person-chip.chip-active {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.5);
		color: white;
		font-weight: 500;
	}

	.editor-chip-check {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 700;
		background: rgba(255, 255, 255, 0.1);
		color: transparent;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.chip-active .editor-chip-check {
		background: rgba(34, 197, 94, 0.8);
		color: white;
	}

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

	/* ✅ Drop Zone für Drag & Drop */
	.drop-zone {
		position: relative;
		border: 2px dashed rgba(59, 130, 246, 0.5);
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: rgba(59, 130, 246, 0.05);
	}

	.drop-zone:hover {
		border-color: rgba(59, 130, 246, 0.8);
		background: rgba(59, 130, 246, 0.1);
	}

	.drop-zone.dragging {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.2);
		transform: scale(1.01);
	}

	.drop-zone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		pointer-events: none;
	}

	.drop-icon {
		font-size: 32px;
	}

	.drop-icon.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.drop-zone.processing {
		border-color: rgba(249, 115, 22, 0.6);
		background: rgba(249, 115, 22, 0.1);
		cursor: wait;
	}

	.drop-text {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
	}

	.file-input-hidden {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	/* Bild-Quelle Buttons (Galerie & Kamera) */
	.image-source-buttons {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}

	.source-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 16px;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	.source-btn.gallery {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.source-btn.gallery:hover {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%);
		border-color: rgba(59, 130, 246, 0.5);
		transform: translateY(-2px);
	}

	.source-btn.camera {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.source-btn.camera:hover {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%);
		border-color: rgba(34, 197, 94, 0.5);
		transform: translateY(-2px);
	}

	.source-btn .btn-icon {
		font-size: 20px;
	}

	.source-btn .btn-text {
		font-size: 14px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
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
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: center;
	}

	.size-label {
		font-size: 14px;
		font-weight: 700;
	}

	.size-dimension {
		font-size: 11px;
		opacity: 0.7;
		font-weight: 400;
	}

	.size-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	.size-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		color: #60a5fa;
	}

	.size-btn.active .size-dimension {
		opacity: 1;
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

	/* ✅ Crop-Bereich */
	.crop-section {
		margin-bottom: 20px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.1);
	}

	.crop-label {
		display: block;
		font-weight: 600;
		margin-bottom: 12px;
		color: var(--color-text-primary);
		font-size: 14px;
	}

	/* ✅ Alle 3 Größen nebeneinander */
	.all-sizes-preview {
		display: flex;
		gap: 12px;
		justify-content: center;
		padding: 16px;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 8px;
		margin-top: 16px;
		flex-wrap: wrap;
	}

	.size-preview-item {
		flex: 1;
		min-width: 150px;
		max-width: 250px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		transition: all 0.3s;
	}

	.size-preview-item.selected {
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(59, 130, 246, 0.1);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	.size-preview-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.label-text {
		font-weight: 700;
		font-size: 13px;
		color: var(--color-text-primary);
	}

	.label-dim {
		font-size: 11px;
		opacity: 0.6;
		font-weight: 400;
	}

	.size-preview-item.selected .label-text {
		color: #60a5fa;
	}

	.size-preview-item.selected .label-dim {
		opacity: 1;
		color: #60a5fa;
	}

	.preview-hint {
		text-align: center;
		margin-top: 12px;
		font-size: 13px;
		opacity: 0.8;
		font-style: italic;
	}

	.preview-hint strong {
		color: #60a5fa;
		font-weight: 700;
	}

	/* ✅ Preview - Exakt wie auf der Kachel */
	.card-preview-wrapper {
		display: flex;
		justify-content: center;
		padding: 20px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 8px;
	}

	.preview-activity-image-container {
		width: 100%;
		max-width: 300px;
		padding: 6px;
		padding-bottom: 10px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 3px;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.preview-image-wrapper {
		width: 100%;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	/* Größen-Varianten für Preview */
	.preview-activity-image-container.size-small .preview-image-wrapper {
		height: 80px;
	}

	.preview-activity-image-container.size-medium .preview-image-wrapper {
		height: 120px;
	}

	.preview-activity-image-container.size-large .preview-image-wrapper {
		height: 180px;
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

	/* ✅ Resize Control Styles */
	.resize-control {
		margin-top: 16px;
		padding: 16px;
		background: rgba(59, 130, 246, 0.1);
		border: 2px solid rgba(59, 130, 246, 0.3);
		border-radius: 8px;
	}

	.resize-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
	}

	.info-row .label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
	}

	.info-row .value {
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
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

		.image-source-buttons {
			flex-direction: column;
		}

		.source-btn {
			padding: 12px 14px;
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