<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import type { RoomWithConfig } from '$lib/types';

	let { handleEditRoom } = $props<{ handleEditRoom: (room: RoomWithConfig) => void }>();

	// Alle Räume als flache Liste mit Status anreichern
	let allRooms = $derived(
		$rooms.map((r) => ({
			...r,
			config: null,
			status: $roomStatuses.get(r.id) ?? null,
			isOpen: $roomStatuses.get(r.id)?.is_open ?? false
		})) as RoomWithConfig[]
	);

	let currentIndex = $state(0);
	let autoTimer: ReturnType<typeof setInterval> | null = null;
	const AUTO_DURATION = 6000;

	function next() {
		if (allRooms.length === 0) return;
		currentIndex = (currentIndex + 1) % allRooms.length;
		restartTimer();
	}

	function prev() {
		if (allRooms.length === 0) return;
		currentIndex = (currentIndex - 1 + allRooms.length) % allRooms.length;
		restartTimer();
	}

	function goTo(i: number) {
		currentIndex = i;
		restartTimer();
	}

	function restartTimer() {
		if (autoTimer) clearInterval(autoTimer);
		autoTimer = setInterval(next, AUTO_DURATION);
	}

	onMount(() => {
		autoTimer = setInterval(next, AUTO_DURATION);
	});

	onDestroy(() => {
		if (autoTimer) clearInterval(autoTimer);
	});
</script>

<div class="focus-canvas">
	{#if allRooms.length === 0}
		<p class="empty">Keine Räume vorhanden.</p>
	{:else}
		<button class="nav-btn prev" onclick={prev} aria-label="Vorheriger Raum">‹</button>

		{#key currentIndex}
			<div class="focus-slot" in:fade={{ duration: 220 }}>
				<RoomCard
					room={allRooms[currentIndex]}
					onEdit={handleEditRoom}
					onSelect={() => {}}
				/>
			</div>
		{/key}

		<button class="nav-btn next" onclick={next} aria-label="Nächster Raum">›</button>

		<div class="dots">
			{#each allRooms as _, i}
				<button
					class="dot"
					class:active={i === currentIndex}
					onclick={() => goTo(i)}
					aria-label="Raum {i + 1}"
				></button>
			{/each}
		</div>

		<div class="counter">{currentIndex + 1} / {allRooms.length}</div>
	{/if}
</div>

<style>
	.focus-canvas {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.focus-slot {
		width: min(80vw, 680px);
		height: min(65vh, 500px);
		display: flex;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #fff;
		font-size: 40px;
		line-height: 1;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
		z-index: 10;
		backdrop-filter: blur(4px);
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.prev { left: 16px; }
	.next { right: 16px; }

	@media (max-width: 600px) {
		.prev { left: 6px; }
		.next { right: 6px; }
		.nav-btn { width: 40px; height: 40px; font-size: 28px; }
	}

	.dots {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.35);
		border: none;
		cursor: pointer;
		padding: 0;
		transition: background 0.2s, transform 0.2s;
	}

	.dot.active {
		background: #fff;
		transform: scale(1.3);
	}

	.counter {
		position: absolute;
		top: 12px;
		right: 20px;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		font-variant-numeric: tabular-nums;
	}

	.empty {
		color: rgba(255, 255, 255, 0.5);
		font-size: 16px;
	}
</style>
