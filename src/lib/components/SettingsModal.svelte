<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { appSettings } from '$lib/stores/appState';
	import { themes, applyTheme } from '$lib/themes';
	import { scale, fade } from 'svelte/transition';

	// Svelte 5 Props Syntax
	let { onClose } = $props<{
		onClose: () => void;
	}>();

	// SVELTE 5 STATE SYNTAX
	let nightModeEnabled = $state($appSettings?.night_mode_enabled ?? true);
	let nightStart = $state($appSettings?.night_start || '17:00');
	let nightEnd = $state($appSettings?.night_end || '07:00');
	let currentTheme = $state($appSettings?.current_theme || 'space');
	let previewTheme = $state(currentTheme); // Für Live-Vorschau

	const themeList = Object.values(themes);

	async function handleSave() {
		try {
			await supabase
				.from('app_settings')
				.update({
					night_mode_enabled: nightModeEnabled,
					night_start: nightStart,
					night_end: nightEnd,
					current_theme: currentTheme
				})
				.eq('id', 1);

			// Theme anwenden
			applyTheme(currentTheme);

			alert('Einstellungen gespeichert!');
			onClose();
		} catch (error) {
			console.error('Error saving settings:', error);
			alert('Fehler beim Speichern!');
		}
	}

	function handleThemePreview(themeId: string) {
		previewTheme = themeId;
		applyTheme(themeId);
	}

	function handleThemeSelect(themeId: string) {
		currentTheme = themeId;
		handleThemePreview(themeId);
	}

	function handleCancel() {
		// Theme auf Original zurücksetzen
		applyTheme($appSettings?.current_theme || 'space');
		onClose();
	}
</script>

<div
	class="modal-backdrop"
	onclick={handleCancel}
	transition:fade
	role="dialog"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && handleCancel()}
>
	<div class="modal" onclick={(e) => e.stopPropagation()} transition:scale role="document">
		<div class="modal-header">
			<h2>⚙️ Einstellungen</h2>
			<button class="close-btn" onclick={handleCancel}>✕</button>
		</div>

		<div class="modal-content">
			<!-- Theme-Auswahl mit Live-Vorschau -->
			<div class="setting-section">
				<h3>🎨 Design-Theme</h3>
				<p class="hint">Klicke auf ein Theme für eine Live-Vorschau</p>
				<div class="theme-grid">
					{#each themeList as theme}
						<button
							class="theme-card"
							class:active={currentTheme === theme.id}
							class:preview={previewTheme === theme.id && currentTheme !== theme.id}
							onclick={() => handleThemeSelect(theme.id)}
							onmouseenter={() => handleThemePreview(theme.id)}
							onmouseleave={() => handleThemePreview(currentTheme)}
							style="
								background: {theme.colors.cardGradient};
								border-color: {currentTheme === theme.id ? theme.colors.accent : 'rgba(255, 255, 255, 0.2)'};
							"
						>
							<div class="theme-emoji">{theme.emoji}</div>
							<div class="theme-name">{theme.name}</div>
							{#if currentTheme === theme.id}
								<div class="theme-check">✓</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Nachtruhe-Modus -->
			<div class="setting-section">
				<h3>🌙 Nachtruhe-Modus</h3>
				<div class="toggle-group">
					<label class="toggle">
						<input type="checkbox" bind:checked={nightModeEnabled} />
						<span class="toggle-slider"></span>
						<span class="toggle-label">
							{nightModeEnabled ? 'Aktiviert' : 'Deaktiviert'}
						</span>
					</label>
				</div>

				{#if nightModeEnabled}
					<div class="time-group">
						<div class="time-input">
							<label for="night-start">Nachtruhe beginnt</label>
							<input id="night-start" type="time" bind:value={nightStart} />
						</div>
						<div class="time-input">
							<label for="night-end">Nachtruhe endet</label>
							<input id="night-end" type="time" bind:value={nightEnd} />
						</div>
					</div>
					<p class="hint">
						Alle Räume schließen automatisch zwischen {nightStart} und {nightEnd} Uhr
					</p>
				{/if}
			</div>

			<!-- Info-Section -->
			<div class="info-section">
				<h4>💡 Hinweise</h4>
				<ul>
					<li>Nachtruhe schließt alle Räume automatisch außerhalb der Schulzeiten</li>
					<li>Themes ändern das visuelle Erscheinungsbild sofort</li>
					<li>Hover über ein Theme für eine Vorschau</li>
					<li>Einstellungen gelten für alle Geräte</li>
				</ul>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-secondary" onclick={handleCancel}>Abbrechen</button>
			<button class="btn btn-primary" onclick={handleSave}>
				Speichern & Anwenden
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
		background: var(--gradient-card, linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%));
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

	.setting-section {
		margin-bottom: 30px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
	}

	.setting-section h3 {
		margin: 0 0 15px 0;
		font-size: 20px;
		font-weight: 600;
	}

	.toggle-group {
		margin-bottom: 15px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.toggle input {
		opacity: 0;
		position: absolute;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		width: 50px;
		height: 26px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 13px;
		position: relative;
		transition: all 0.3s;
	}

	.toggle-slider::after {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		top: 3px;
		left: 3px;
		transition: all 0.3s;
	}

	.toggle input:checked + .toggle-slider {
		background: #22c55e;
	}

	.toggle input:checked + .toggle-slider::after {
		left: 27px;
	}

	.toggle-label {
		font-weight: 600;
	}

	.toggle input:focus-visible ~ .toggle-slider {
		box-shadow: 0 0 0 2px #3b82f6;
	}

	.time-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
		margin-top: 15px;
	}

	.time-input label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		opacity: 0.9;
	}

	.time-input input {
		width: 100%;
		padding: 10px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 16px;
	}

	.hint {
		margin-top: 10px;
		font-size: 13px;
		opacity: 0.7;
		font-style: italic;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		margin-top: 15px;
	}

	.theme-card {
		position: relative;
		padding: 24px 15px;
		background: rgba(255, 255, 255, 0.05);
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s;
		text-align: center;
		color: white;
		overflow: hidden;
	}

	.theme-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--background-pattern, none);
		opacity: 0.3;
		pointer-events: none;
	}

	.theme-card.active {
		border-width: 4px;
		box-shadow: 0 0 30px currentColor;
		transform: scale(1.05);
	}

	.theme-card.preview {
		border-color: rgba(255, 255, 255, 0.5);
		transform: scale(1.02);
	}

	.theme-card:hover {
		transform: translateY(-3px) scale(1.02);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.theme-card.active:hover {
		transform: translateY(-3px) scale(1.05);
	}

	.theme-card:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.theme-emoji {
		font-size: 42px;
		margin-bottom: 10px;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
		position: relative;
		z-index: 1;
	}

	.theme-name {
		font-size: 14px;
		font-weight: 600;
		position: relative;
		z-index: 1;
	}

	.theme-check {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		background: rgba(34, 197, 94, 0.9);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		z-index: 2;
	}

	.info-section {
		padding: 15px;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 12px;
		border-left: 4px solid var(--color-accent, #3b82f6);
	}

	.info-section h4 {
		margin: 0 0 10px 0;
		font-size: 16px;
	}

	.info-section ul {
		margin: 0;
		padding-left: 20px;
	}

	.info-section li {
		margin-bottom: 5px;
		font-size: 14px;
		opacity: 0.9;
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
		background: linear-gradient(135deg, var(--color-accent, #3b82f6) 0%, var(--color-primary, #2563eb) 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
	}
</style>