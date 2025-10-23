<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import type { RoomWithConfig } from '$lib/types';
	import { scale, fade } from 'svelte/transition';
	import { currentWeekday } from '$lib/stores/appState';

	export let room: RoomWithConfig;
	export let onClose: () => void;

	let name = room.name;
	let backgroundColor = room.background_color;
	let activity = room.config?.activity || '';
	let openTime = room.config?.open_time || '';
	let closeTime = room.config?.close_time || '';
	let titleFontSize = room.config?.title_font_size || 42;
	let textFontSize = room.config?.text_font_size || 28;
	let imageFile: File | null = null;
	let uploading = false;

	async function handleSave() {
		try {
			// Update Room
			await supabase
				.from('rooms')
				.update({
					name,
					background_color: backgroundColor
				})
				.eq('id', room.id);

			// Update/Insert Daily Config
			const configData = {
				room_id: room.id,
				weekday: $currentWeekday,
				activity,
				open_time: openTime || null,
				close_time: closeTime || null,
				title_font_size: titleFontSize,
				text_font_size: textFontSize
			};

			await supabase.from('daily_configs').upsert(configData, {
				onConflict: 'room_id,weekday'
			});

			// Upload Image if selected
			if (imageFile) {
				uploading = true;
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
				}
				uploading = false;
			}

			onClose();
		} catch (error) {
			console.error('Error saving room:', error);
			alert('Fehler beim Speichern!');
		}
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			imageFile = target.files[0];
		}
	}
</script>

<div class="modal-backdrop" on:click={onClose} transition:fade>
	<div class="modal" on:click|stopPropagation transition:scale>
		<div class="modal-header">
			<h2>Raum bearbeiten</h2>
			<button class="close-btn" on:click={onClose}>✕</button>
		</div>

		<div class="modal-content">
			<div class="form-group">
				<label>Raum-Name</label>
				<input type="text" bind:value={name} placeholder="z.B. Turnhalle" />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label>Hintergrundfarbe</label>
					<input type="color" bind:value={backgroundColor} />
				</div>
				<div class="form-group">
					<label>Vorschau</label>
					<div class="color-preview" style="background: {backgroundColor}"></div>
				</div>
			</div>

			<div class="form-group">
				<label>Aktivität (für {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][$currentWeekday]})</label>
				<input type="text" bind:value={activity} placeholder="z.B. Freies Spielen" />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label>Öffnet um</label>
					<input type="time" bind:value={openTime} />
				</div>
				<div class="form-group">
					<label>Schließt um</label>
					<input type="time" bind:value={closeTime} />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label>Titel-Schriftgröße: {titleFontSize}px</label>
					<input type="range" bind:value={titleFontSize} min="24" max="72" />
				</div>
				<div class="form-group">
					<label>Text-Schriftgröße: {textFontSize}px</label>
					<input type="range" bind:value={textFontSize} min="16" max="48" />
				</div>
			</div>

			<div class="form-group">
				<label>Hintergrundbild</label>
				<input type="file" accept="image/*" on:change={handleFileChange} />
				{#if room.image_url}
					<p class="hint">Aktuelles Bild: {room.image_url.split('/').pop()}</p>
				{/if}
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={onClose}>Abbrechen</button>
			<button class="btn btn-primary" on:click={handleSave} disabled={uploading}>
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
	input[type='file'] {
		width: 100%;
		padding: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 16px;
		transition: all 0.3s;
	}

	input[type='text']:focus,
	input[type='time']:focus {
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
