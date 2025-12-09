<script lang="ts">
	import { dailyHighlights, viewWeekday, createHighlight, updateHighlight, deleteHighlight, reorderHighlights } from '$lib/stores/appState';
	import { toasts } from '$lib/stores/toastStore';
	import { fade, fly } from 'svelte/transition';
	import type { DailyHighlight } from '$lib/types';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// SVELTE 5 PROPS
	let { onClose } = $props<{
		onClose: () => void;
	}>();

	// SVELTE 5 STATE
	let editingHighlight = $state<DailyHighlight | null>(null);
	let showAddForm = $state(false);

	// Form State
	let formIcon = $state('📌');
	let formText = $state('');
	let formColor = $state<'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'>('blue');
	let formRoom = $state('');
	let formPerson = $state('');

	// Häufig verwendete Icons
	const iconOptions = [
		'📌', '🎯', '⚡', '🎉', '🏀', '⚽', '🎭', '🎨', '🎵', '📚',
		'💻', '🔬', '🍕', '🍔', '☕', '🌟', '💡', '🔔', '⚠️', '✨',
		'🎓', '🏆', '🎪', '🎬', '📖', '🎤', '🎸', '🎹', '🎺', '🎻'
	];

	const colorOptions: Array<{ name: string; value: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'; bg: string }> = [
		{ name: 'Blau', value: 'blue', bg: 'rgba(59, 130, 246, 0.4)' },
		{ name: 'Grün', value: 'green', bg: 'rgba(34, 197, 94, 0.4)' },
		{ name: 'Gelb', value: 'yellow', bg: 'rgba(234, 179, 8, 0.4)' },
		{ name: 'Rot', value: 'red', bg: 'rgba(239, 68, 68, 0.4)' },
		{ name: 'Lila', value: 'purple', bg: 'rgba(168, 85, 247, 0.4)' },
		{ name: 'Orange', value: 'orange', bg: 'rgba(249, 115, 22, 0.4)' }
	];

	// Gefilterte Highlights für den aktuellen Tag
	let currentDayHighlights = $derived(
		$dailyHighlights
			.filter(h => h.weekday === $viewWeekday)
			.sort((a, b) => a.sort_order - b.sort_order)
	);

	function startAdd() {
		formIcon = '📌';
		formText = '';
		formColor = 'blue';
		formRoom = '';
		formPerson = '';
		editingHighlight = null;
		showAddForm = true;
	}

	function startEdit(highlight: DailyHighlight) {
		formIcon = highlight.icon;
		formText = highlight.text;
		formColor = highlight.color;
		formRoom = highlight.room || '';
		formPerson = highlight.person || '';
		editingHighlight = highlight;
		showAddForm = true;
	}

	function cancelForm() {
		showAddForm = false;
		editingHighlight = null;
		formIcon = '📌';
		formText = '';
		formColor = 'blue';
		formRoom = '';
		formPerson = '';
	}

	async function saveHighlight() {
		if (!formText.trim()) {
			toasts.show('Bitte einen Text eingeben', 'error');
			return;
		}

		try {
			if (editingHighlight) {
				// Update
				await updateHighlight(editingHighlight.id, {
					icon: formIcon,
					text: formText.trim(),
					color: formColor,
					room: formRoom.trim() || null,
					person: formPerson.trim() || null
				});
				toasts.show('Angebot aktualisiert', 'success');
			} else {
				// Create
				await createHighlight(
					$viewWeekday,
					formIcon,
					formText.trim(),
					formColor,
					formRoom.trim() || null,
					formPerson.trim() || null
				);
				toasts.show('Angebot hinzugefügt', 'success');
			}
			cancelForm();
		} catch (err) {
			toasts.show('Fehler beim Speichern', 'error');
			console.error(err);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Möchtest du dieses Angebot wirklich löschen?')) return;

		try {
			await deleteHighlight(id);
			toasts.show('Angebot gelöscht', 'success');
		} catch (err) {
			toasts.show('Fehler beim Löschen', 'error');
			console.error(err);
		}
	}

	async function moveUp(index: number) {
		if (index === 0) return;
		const reordered = [...currentDayHighlights];
		[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
		await reorderHighlights(reordered);
	}

	async function moveDown(index: number) {
		if (index === currentDayHighlights.length - 1) return;
		const reordered = [...currentDayHighlights];
		[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
		await reorderHighlights(reordered);
	}
</script>

<div class="modal-backdrop" onclick={onClose} transition:fade={{ duration: 200 }}>
	<div
		class="modal-content"
		onclick={(e) => e.stopPropagation()}
		transition:fly={{ y: -50, duration: 300 }}
	>
		<div class="modal-header">
			<h2>Tagesangebote bearbeiten</h2>
			<p class="weekday-info">Tag: <strong>{weekdayNames[$viewWeekday]}</strong></p>
		</div>

		<div class="modal-body">
			<!-- Aktuelle Highlights -->
			<div class="highlights-section">
				<div class="section-header">
					<h3>Aktuelle Angebote ({currentDayHighlights.length})</h3>
					{#if !showAddForm}
						<button class="add-btn" onclick={startAdd}>
							<span class="icon">➕</span>
							<span>Neues Angebot</span>
						</button>
					{/if}
				</div>

				{#if currentDayHighlights.length > 0}
					<div class="highlights-list">
						{#each currentDayHighlights as highlight, index (highlight.id)}
							<div class="highlight-row" transition:fly={{ x: -20, duration: 200 }}>
								<div class="highlight-preview">
									<span class="icon">{highlight.icon}</span>
									<div class="preview-content">
										<span class="text">{highlight.text}</span>
										{#if highlight.room || highlight.person}
											<span class="preview-details">
												{#if highlight.room}<span class="preview-room">📍 {highlight.room}</span>{/if}
												{#if highlight.person}<span class="preview-person">👤 {highlight.person}</span>{/if}
											</span>
										{/if}
									</div>
									<span class="color-badge" style="background: {colorOptions.find(c => c.value === highlight.color)?.bg}">
										{colorOptions.find(c => c.value === highlight.color)?.name}
									</span>
								</div>
								<div class="highlight-actions">
									<button
										class="action-btn"
										onclick={() => moveUp(index)}
										disabled={index === 0}
										title="Nach oben"
									>
										↑
									</button>
									<button
										class="action-btn"
										onclick={() => moveDown(index)}
										disabled={index === currentDayHighlights.length - 1}
										title="Nach unten"
									>
										↓
									</button>
									<button
										class="action-btn edit"
										onclick={() => startEdit(highlight)}
										title="Bearbeiten"
									>
										✏️
									</button>
									<button
										class="action-btn delete"
										onclick={() => handleDelete(highlight.id)}
										title="Löschen"
									>
										🗑️
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-highlights">
						<span class="emoji">📭</span>
						<p>Noch keine Angebote für diesen Tag</p>
					</div>
				{/if}
			</div>

			<!-- Add/Edit Form -->
			{#if showAddForm}
				<div class="form-section" transition:fly={{ y: -20, duration: 200 }}>
					<h3>{editingHighlight ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}</h3>

					<div class="form-group">
						<label>Icon auswählen:</label>
						<div class="icon-selector">
							{#each iconOptions as icon}
								<button
									class="icon-option"
									class:selected={formIcon === icon}
									onclick={() => formIcon = icon}
								>
									{icon}
								</button>
							{/each}
						</div>
					</div>

					<div class="form-group">
						<label for="highlight-text">Text:</label>
						<input
							id="highlight-text"
							type="text"
							bind:value={formText}
							placeholder="z.B. Basketball-Training 14:00"
							maxlength="100"
						/>
					</div>

					<div class="form-group">
						<label for="highlight-room">Raum (optional):</label>
						<input
							id="highlight-room"
							type="text"
							bind:value={formRoom}
							placeholder="z.B. Turnhalle 1"
							maxlength="50"
						/>
					</div>

					<div class="form-group">
						<label for="highlight-person">Person (optional):</label>
						<input
							id="highlight-person"
							type="text"
							bind:value={formPerson}
							placeholder="z.B. Herr Schmidt"
							maxlength="50"
						/>
					</div>

					<div class="form-group">
						<label>Farbe:</label>
						<div class="color-selector">
							{#each colorOptions as color}
								<button
									class="color-option"
									class:selected={formColor === color.value}
									style="background: {color.bg}"
									onclick={() => formColor = color.value}
									title={color.name}
								>
									{color.name}
								</button>
							{/each}
						</div>
					</div>

					<div class="form-actions">
						<button class="btn-save" onclick={saveHighlight}>
							💾 Speichern
						</button>
						<button class="btn-cancel" onclick={cancelForm}>
							❌ Abbrechen
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="btn-close" onclick={onClose}>Schließen</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: rgba(15, 23, 42, 0.98);
		backdrop-filter: blur(20px);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
	}

	.modal-header {
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
	}

	.modal-header h2 {
		font-size: 18px;
		font-weight: 600;
		letter-spacing: 0.3px;
		color: white;
		margin: 0 0 4px;
	}

	.weekday-info {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	.weekday-info strong {
		color: white;
	}

	.modal-body {
		padding: 20px 24px;
		overflow-y: auto;
		flex: 1;
	}

	.highlights-section {
		margin-bottom: 20px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.section-header h3 {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(34, 197, 94, 0.3);
		border: 1px solid rgba(34, 197, 94, 0.5);
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.add-btn:hover {
		background: rgba(34, 197, 94, 0.4);
		border-color: rgba(34, 197, 94, 0.6);
	}

	.highlights-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.highlight-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
	}

	.highlight-preview {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.highlight-preview .icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.preview-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.highlight-preview .text {
		font-size: 14px;
		color: white;
		font-weight: 500;
	}

	.preview-details {
		display: flex;
		gap: 10px;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 400;
	}

	.preview-room,
	.preview-person {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.color-badge {
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
		flex-shrink: 0;
	}

	.highlight-actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.action-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--color-text-primary);
		width: 36px;
		height: 36px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.action-btn.edit:hover {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.5);
	}

	.action-btn.delete:hover {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.no-highlights {
		text-align: center;
		padding: 40px 20px;
		color: rgba(255, 255, 255, 0.5);
	}

	.no-highlights .emoji {
		font-size: 48px;
		display: block;
		margin-bottom: 12px;
	}

	.form-section {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 16px;
	}

	.form-section h3 {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0 0 12px;
	}

	.form-group {
		margin-bottom: 12px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: white;
		margin-bottom: 6px;
	}

	.form-group input {
		width: 100%;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		font-size: 13px;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		background: rgba(255, 255, 255, 0.1);
	}

	.icon-selector {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
		gap: 8px;
	}

	.icon-option {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 8px;
		font-size: 20px;
		cursor: pointer;
		transition: all 0.2s;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-option:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.icon-option.selected {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
	}

	.color-selector {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 10px;
	}

	.color-option {
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-option.selected {
		border-color: white;
		border-width: 2px;
	}

	.form-actions {
		display: flex;
		gap: 8px;
		margin-top: 16px;
	}

	.btn-save,
	.btn-cancel {
		flex: 1;
		padding: 10px 16px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-save {
		background: rgba(34, 197, 94, 0.3);
		border: 1px solid rgba(34, 197, 94, 0.5);
		color: white;
	}

	.btn-save:hover {
		background: rgba(34, 197, 94, 0.4);
		border-color: rgba(34, 197, 94, 0.6);
	}

	.btn-cancel {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: white;
	}

	.btn-cancel:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		justify-content: flex-end;
	}

	.btn-close {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 10px 24px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-close:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	@media (max-width: 768px) {
		.modal-content {
			width: 95%;
			max-width: 95%;
			max-height: 95vh;
		}

		.modal-body {
			padding: 16px 20px;
		}

		.icon-selector {
			grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
		}

		.color-selector {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.modal-content {
			width: 100%;
			max-width: 100%;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>
