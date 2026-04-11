<script lang="ts">
	import { fade } from 'svelte/transition';
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	let allRooms = $derived(
		$rooms.map((r): RoomWithConfig => ({
			...r, config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		}))
	);

	let topIndex = $state(0);
	let swiping = $state(false);
	let swipeDir = $state<'left' | 'right' | null>(null);

	// Touch/Swipe
	let touchStartX = 0;

	function next() {
		if (swiping || allRooms.length === 0) return;
		swipeDir = 'left';
		swiping = true;
		setTimeout(() => {
			topIndex = (topIndex + 1) % allRooms.length;
			swiping = false;
			swipeDir = null;
		}, 300);
	}

	function prev() {
		if (swiping || allRooms.length === 0) return;
		swipeDir = 'right';
		swiping = true;
		setTimeout(() => {
			topIndex = (topIndex - 1 + allRooms.length) % allRooms.length;
			swiping = false;
			swipeDir = null;
		}, 300);
	}

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}

	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
	}

	// Indices der sichtbaren Karten (top = vorne)
	let visibleCards = $derived(() => {
		if (allRooms.length === 0) return [];
		return [0, 1, 2].map(offset => ({
			room: allRooms[(topIndex + offset) % allRooms.length],
			offset
		}));
	});
</script>

<div
	class="deck-canvas"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
>
	{#if allRooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{:else}
		<div class="deck-stack">
			{#each visibleCards().slice().reverse() as card (card.offset)}
				<div
					class="deck-card"
					class:top={card.offset === 0}
					class:swiping-left={card.offset === 0 && swipeDir === 'left' && swiping}
					class:swiping-right={card.offset === 0 && swipeDir === 'right' && swiping}
					style="
						--offset: {card.offset};
						transform: translateY({card.offset * -10}px) scale({1 - card.offset * 0.04}) translateX({card.offset * 6}px);
						z-index: {10 - card.offset};
						opacity: {1 - card.offset * 0.25};
					"
				>
					<RoomCard room={card.room} onEdit={handleEditRoom} onSelect={() => {}} />
				</div>
			{/each}
		</div>

		<div class="deck-controls">
			<button class="deck-btn" onclick={prev}>‹ Zurück</button>
			<span class="deck-counter">{topIndex + 1} / {allRooms.length}</span>
			<button class="deck-btn" onclick={next}>Weiter ›</button>
		</div>

		<p class="deck-hint">Tippen zum Weiterblättern</p>
	{/if}
</div>

<style>
	.deck-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		user-select: none;
	}

	.deck-stack {
		position: relative;
		width: min(72vw, 560px);
		height: min(55vh, 380px);
	}

	.deck-card {
		position: absolute;
		inset: 0;
		border-radius: 16px;
		overflow: hidden;
		transition: transform 0.25s ease, opacity 0.25s ease;
		cursor: grab;
	}

	.deck-card.top {
		cursor: pointer;
	}

	.deck-card.swiping-left {
		transform: translateX(-110%) rotate(-8deg) !important;
		opacity: 0 !important;
		transition: transform 0.3s ease, opacity 0.3s ease;
	}

	.deck-card.swiping-right {
		transform: translateX(110%) rotate(8deg) !important;
		opacity: 0 !important;
		transition: transform 0.3s ease, opacity 0.3s ease;
	}

	.deck-controls {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.deck-btn {
		padding: 6px 18px;
		border-radius: 20px;
		border: 1px solid rgba(255,255,255,0.2);
		background: rgba(255,255,255,0.08);
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.deck-btn:hover {
		background: rgba(255,255,255,0.18);
	}

	.deck-counter {
		font-size: 13px;
		color: rgba(255,255,255,0.5);
		font-variant-numeric: tabular-nums;
		min-width: 60px;
		text-align: center;
	}

	.deck-hint {
		font-size: 11px;
		color: rgba(255,255,255,0.25);
		margin: 0;
	}

	.empty {
		color: rgba(255,255,255,0.4);
		font-size: 15px;
	}
</style>
