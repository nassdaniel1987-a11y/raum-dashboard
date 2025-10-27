<script lang="ts">
	import { scale } from 'svelte/transition';

	// Svelte 5 Props Syntax
	let { value = '#ffffff', onSelect } = $props<{
		value?: string;
		onSelect: (color: string) => void;
	}>();

	// Vordefinierte Schriftfarben
	const textColors = [
		{ name: 'Weiß', value: '#ffffff' },
		{ name: 'Schwarz', value: '#000000' },
		{ name: 'Hellgrau', value: '#e5e7eb' },
		{ name: 'Dunkelgrau', value: '#374151' },
		{ name: 'Gelb', value: '#fbbf24' },
		{ name: 'Orange', value: '#fb923c' },
		{ name: 'Rot', value: '#ef4444' },
		{ name: 'Pink', value: '#ec4899' },
		{ name: 'Lila', value: '#a855f7' },
		{ name: 'Blau', value: '#3b82f6' },
		{ name: 'Cyan', value: '#06b6d4' },
		{ name: 'Grün', value: '#10b981' },
		{ name: 'Lime', value: '#84cc16' }
	];

	let showPicker = $state(false);
	let customColor = $state(value);

	function selectColor(color: string) {
		onSelect(color);
		customColor = color;
		showPicker = false;
	}

	function handleCustomColor() {
		if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
			onSelect(customColor);
			showPicker = false;
		}
	}
</script>

<div class="text-color-picker">
	<label class="label">Schriftfarbe:</label>
	
	<button 
		class="current-color"
		onclick={() => showPicker = !showPicker}
		style="border-color: {value};"
	>
		<span class="color-preview" style="background: {value};"></span>
		<span class="color-name">{textColors.find(c => c.value === value)?.name || 'Eigene'}</span>
		<span class="arrow">{showPicker ? '▲' : '▼'}</span>
	</button>

	{#if showPicker}
		<div class="color-grid" transition:scale={{ duration: 200 }}>
			{#each textColors as color}
				<button
					class="color-option"
					class:selected={value === color.value}
					style="background: {color.value}; border-color: {color.value};"
					onclick={() => selectColor(color.value)}
					title={color.name}
				>
					{#if value === color.value}
						<span class="checkmark">✓</span>
					{/if}
					<span class="color-label" style="color: {color.value === '#ffffff' || color.value === '#e5e7eb' ? '#000' : '#fff'};">
						A
					</span>
				</button>
			{/each}

			<!-- Custom Color Input -->
			<div class="custom-color-input">
				<input
					type="text"
					bind:value={customColor}
					placeholder="#ffffff"
					maxlength="7"
					pattern="^#[0-9A-Fa-f]{6}$"
				/>
				<button class="apply-btn" onclick={handleCustomColor}>
					✓
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.text-color-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.current-color {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 10px;
		color: var(--color-text-primary);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.current-color:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.color-preview {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: 2px solid rgba(0, 0, 0, 0.3);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.color-name {
		flex: 1;
	}

	.arrow {
		font-size: 12px;
		opacity: 0.6;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 10px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
	}

	.color-option {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 8px;
		border: 3px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.color-option:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
	}

	.color-option.selected {
		border-color: rgba(255, 255, 255, 0.8);
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3),
					0 4px 12px rgba(0, 0, 0, 0.5);
	}

	.checkmark {
		position: absolute;
		top: 2px;
		right: 2px;
		font-size: 14px;
		color: white;
		text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
	}

	.color-label {
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.custom-color-input {
		grid-column: 1 / -1;
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.custom-color-input input {
		flex: 1;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: var(--color-text-primary);
		font-size: 14px;
		font-family: monospace;
		text-transform: uppercase;
	}

	.custom-color-input input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.apply-btn {
		padding: 10px 16px;
		background: rgba(34, 197, 94, 0.3);
		border: 2px solid rgba(34, 197, 94, 0.6);
		border-radius: 8px;
		color: white;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.apply-btn:hover {
		background: rgba(34, 197, 94, 0.5);
		transform: scale(1.05);
	}

	@media (max-width: 768px) {
		.color-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>