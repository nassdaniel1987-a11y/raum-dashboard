<script lang="ts">
	import { scale } from 'svelte/transition';

	// Svelte 5 Props Syntax
	let {
		value = '#FFFFFF',
		onChange
	} = $props<{
		value: string;
		onChange: (color: string) => void;
	}>();

	let showPicker = $state(false);

	// ✅ Einfache Textfarben-Palette (Schwarz, Weiß und Grundfarben)
	const textColors = [
		{ value: '#FFFFFF', name: 'Weiß' },
		{ value: '#000000', name: 'Schwarz' },
		{ value: '#FF0000', name: 'Rot' },
		{ value: '#00FF00', name: 'Grün' },
		{ value: '#0000FF', name: 'Blau' },
		{ value: '#FFFF00', name: 'Gelb' },
		{ value: '#FF00FF', name: 'Magenta' },
		{ value: '#00FFFF', name: 'Cyan' },
		{ value: '#FFA500', name: 'Orange' },
		{ value: '#800080', name: 'Lila' },
		{ value: '#808080', name: 'Grau' },
		{ value: '#A0522D', name: 'Braun' }
	];

	function handleColorSelect(color: string) {
		onChange(color);
		showPicker = false;
	}

	let selectedColorName = $derived(
		textColors.find(c => c.value === value)?.name || 'Custom'
	);
</script>

<div class="text-color-picker">
	<button
		class="color-preview"
		style="background-color: {value};"
		onclick={() => showPicker = !showPicker}
		title="Textfarbe auswählen"
	>
		<span class="color-name" style="color: {value === '#FFFFFF' || value === '#FFFF00' || value === '#00FFFF' || value === '#00FF00' ? '#000000' : '#FFFFFF'};">{selectedColorName}</span>
		<span class="dropdown-icon" style="color: {value === '#FFFFFF' || value === '#FFFF00' || value === '#00FFFF' || value === '#00FF00' ? '#000000' : '#FFFFFF'};">{showPicker ? '▲' : '▼'}</span>
	</button>

	{#if showPicker}
		<div class="color-dropdown" transition:scale={{ duration: 200, start: 0.95 }}>
			<div class="color-grid">
				{#each textColors as color (color.value)}
					<button
						class="color-option"
						class:active={value === color.value}
						style="background-color: {color.value};"
						onclick={() => handleColorSelect(color.value)}
						title={color.name}
						transition:scale={{ duration: 150 }}
					>
						{#if value === color.value}
							<span class="checkmark" style="color: {color.value === '#FFFFFF' || color.value === '#FFFF00' || color.value === '#00FFFF' || color.value === '#00FF00' ? '#000000' : '#FFFFFF'};">✓</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.text-color-picker {
		position: relative;
		width: 100%;
	}

	.color-preview {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.color-preview:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.color-name {
		font-weight: 600;
		font-size: 15px;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
		flex: 1;
		text-align: left;
	}

	.dropdown-icon {
		font-size: 12px;
		opacity: 0.8;
	}

	.color-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		right: 0;
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 16px;
		z-index: 10000; /* ✅ Erhöht für Modal-Sichtbarkeit */
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}

	.color-option {
		aspect-ratio: 1;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.color-option:hover {
		transform: scale(1.1);
		border-color: rgba(255, 255, 255, 0.6);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 1;
	}

	.color-option.active {
		border-color: white;
		border-width: 3px;
		box-shadow: 0 4px 16px rgba(255, 255, 255, 0.4);
	}

	.checkmark {
		font-size: 22px;
		font-weight: bold;
		text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
		animation: pop 0.3s ease-out;
	}

	@keyframes pop {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (max-width: 768px) {
		.color-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
