<script lang="ts">
	import { visibleHighlights, viewWeekday, isEditMode } from '$lib/stores/appState';
	import { fade, fly } from 'svelte/transition';
	import type { DailyHighlight } from '$lib/types';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// SVELTE 5 PROPS
	let { onOpenEditor } = $props<{
		onOpenEditor?: () => void;
	}>();

	// Color Map für die Highlight-Farben
	const colorMap = {
		blue: { bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.5)' },
		green: { bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(34, 197, 94, 0.5)' },
		yellow: { bg: 'rgba(234, 179, 8, 0.25)', border: 'rgba(234, 179, 8, 0.5)' },
		red: { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.5)' },
		purple: { bg: 'rgba(168, 85, 247, 0.25)', border: 'rgba(168, 85, 247, 0.5)' },
		orange: { bg: 'rgba(249, 115, 22, 0.25)', border: 'rgba(249, 115, 22, 0.5)' }
	};

	function getColorStyle(color: string) {
		const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;
		return `background: ${colors.bg}; border-color: ${colors.border};`;
	}
</script>

{#if $visibleHighlights.length > 0 || $isEditMode}
	<div class="highlights-container" transition:fade={{ duration: 200 }}>
		<div class="highlights-header">
			<div class="highlights-title">
				<span class="icon">🎯</span>
				<span class="text">Heute - {weekdayNames[$viewWeekday]}</span>
			</div>
			{#if $isEditMode && onOpenEditor}
				<button
					class="edit-btn"
					onclick={onOpenEditor}
					title="Tagesangebote bearbeiten"
					transition:fly={{ x: 20, duration: 200 }}
				>
					<span class="icon">✏️</span>
					<span class="label">Bearbeiten</span>
				</button>
			{/if}
		</div>

		<div class="highlights-list">
			{#if $visibleHighlights.length > 0}
				{#each $visibleHighlights as highlight (highlight.id)}
					<div
						class="highlight-item"
						style={getColorStyle(highlight.color)}
						transition:fly={{ y: -10, duration: 300 }}
					>
						<span class="highlight-icon">{highlight.icon}</span>
						<div class="highlight-content">
							<span class="highlight-text">{highlight.text}</span>
							{#if highlight.room || highlight.person}
								<span class="highlight-details">
									{#if highlight.room}<span class="detail-room">📍 {highlight.room}</span>{/if}
									{#if highlight.person}<span class="detail-person">👤 {highlight.person}</span>{/if}
								</span>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<div class="no-highlights" transition:fade>
					<span class="emoji">📌</span>
					<span class="message">Keine besonderen Angebote für heute</span>
					{#if $isEditMode}
						<span class="hint">(Klicke "Bearbeiten" um welche hinzuzufügen)</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.highlights-container {
		position: relative;
		width: 100%;
		background: rgba(0, 0, 0, 0.15);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(5px);
		padding: 10px 20px;
		margin-top: 50px; /* Platz für Header */
	}

	.highlights-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.highlights-title {
		display: flex;
		align-items: center;
		gap: 8px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		font-weight: 500;
	}

	.highlights-title .icon {
		font-size: 16px;
	}

	.edit-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 12px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.edit-btn .icon {
		font-size: 16px;
	}

	.edit-btn .label {
		font-size: 13px;
	}

	.highlights-list {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 8px 0;
		scroll-behavior: smooth;
	}

	/* Custom Scrollbar */
	.highlights-list::-webkit-scrollbar {
		height: 6px;
	}

	.highlights-list::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.highlights-list::-webkit-scrollbar-thumb {
		background: rgba(96, 165, 250, 0.5);
		border-radius: 3px;
	}

	.highlights-list::-webkit-scrollbar-thumb:hover {
		background: rgba(96, 165, 250, 0.7);
	}

	.highlight-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border: 1px solid;
		border-radius: 8px;
		backdrop-filter: blur(5px);
		white-space: nowrap;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.highlight-icon {
		font-size: 20px;
		line-height: 1;
		flex-shrink: 0;
	}

	.highlight-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.highlight-text {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text-primary);
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.highlight-details {
		display: flex;
		gap: 10px;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.detail-room,
	.detail-person {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.no-highlights {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 20px;
		background: rgba(148, 163, 184, 0.15);
		border: 2px dashed rgba(148, 163, 184, 0.3);
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		font-weight: 500;
		width: 100%;
		justify-content: center;
	}

	.no-highlights .emoji {
		font-size: 20px;
	}

	.no-highlights .hint {
		color: rgba(255, 255, 255, 0.5);
		font-size: 12px;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.highlights-container {
			padding: 10px 15px;
		}

		.highlights-title {
			font-size: 14px;
		}

		.edit-btn .label {
			display: none;
		}

		.edit-btn {
			padding: 6px 10px;
		}

		.highlight-item {
			padding: 8px 12px;
			gap: 6px;
		}

		.highlight-icon {
			font-size: 18px;
		}

		.highlight-text {
			font-size: 13px;
		}
	}
</style>
