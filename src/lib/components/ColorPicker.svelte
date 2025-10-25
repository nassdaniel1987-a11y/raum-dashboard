<script lang="ts">
	import { colorPalette, getColorName, type ColorOption } from '$lib/colorPalette';
	import { scale, fade } from 'svelte/transition';

	// Svelte 5 Props Syntax
	let { 
		value = '#4CAF50',
		onChange
	} = $props<{
		value: string;
		onChange: (color: string) => void;
	}>();

	let showPicker = $state(false);
	let selectedCategory = $state<ColorOption['category'] | 'all'>('all');

	const categories = {
		all: { name: 'Alle', emoji: '🎨' },
		warm: { name: 'Warm', emoji: '🔥' },
		cold: { name: 'Kalt', emoji: '❄️' },
		vibrant: { name: 'Lebhaft', emoji: '⚡' },
		neutral: { name: 'Neutral', emoji: '🪨' }
	};

	let filteredColors = $derived(
		selectedCategory === 'all' 
			? colorPalette 
			: colorPalette.filter(c => c.category === selectedCategory)
	);

	function handleColorSelect(color: string) {
		onChange(color);
		showPicker = false;
	}
</script>

<div class="color-picker">
	<button
		class="color-preview"
		style="background-color: {value};"
		onclick={() => showPicker = !showPicker}
		title="Farbe auswählen"
	>
		<span class="color-name">{getColorName(value)}</span>
		<span class="dropdown-icon">{showPicker ? '▲' : '▼'}</span>
	</button>

	{#if showPicker}
		<div class="color-dropdown" transition:scale={{ duration: 200, start: 0.95 }}>
			<!-- Kategorie-Filter -->
			<div class="category-tabs">
				{#each Object.entries(categories) as [key, cat]}
					<button
						class="category-tab"
						class:active={selectedCategory === key}
						onclick={() => selectedCategory = key as ColorOption['category'] | 'all'}
					>
						<span class="cat-emoji">{cat.emoji}</span>
						<span class="cat-name">{cat.name}</span>
					</button>
				{/each}
			</div>

			<!-- Farbpalette -->
			<div class="color-grid">
				{#each filteredColors as color (color.value)}
					<button
						class="color-option"
						class:active={value === color.value}
						style="background-color: {color.value};"
						onclick={() => handleColorSelect(color.value)}
						title={color.name}
						transition:scale={{ duration: 150 }}
					>
						{#if value === color.value}
							<span class="checkmark">✓</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.color-picker {
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
		color: white;
		font-weight: 600;
		font-size: 15px;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
		flex: 1;
		text-align: left;
	}

	.dropdown-icon {
		color: white;
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
		z-index: 1000;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		max-height: 400px;
		overflow-y: auto;
	}

	.category-tabs {
		display: flex;
		gap: 6px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.category-tab {
		padding: 6px 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: white;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.category-tab:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.category-tab.active {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.4);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.cat-emoji {
		font-size: 14px;
	}

	.cat-name {
		font-size: 12px;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
		gap: 8px;
	}

	.color-option {
		aspect-ratio: 1;
		border: 2px solid rgba(255, 255, 255, 0.2);
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
		border-color: rgba(255, 255, 255, 0.5);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 1;
	}

	.color-option.active {
		border-color: white;
		border-width: 3px;
		box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
	}

	.checkmark {
		color: white;
		font-size: 20px;
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

	.color-dropdown::-webkit-scrollbar {
		width: 8px;
	}

	.color-dropdown::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.color-dropdown::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.color-dropdown::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	@media (max-width: 768px) {
		.color-grid {
			grid-template-columns: repeat(6, 1fr);
		}

		.category-tabs {
			gap: 4px;
		}

		.cat-name {
			display: none;
		}
	}
</style>