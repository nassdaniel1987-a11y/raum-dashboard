<script lang="ts">
	import { visibleRooms } from '$lib/stores/appState';
	import RoomCard from './RoomCard.svelte';
	import { fade } from 'svelte/transition';
	import type { RoomWithConfig } from '$lib/types';

	export let handleEditRoom: (room: RoomWithConfig) => void;
</script>

<div class="canvas-container" transition:fade>
	<div class="canvas" id="room-canvas">
		{#each $visibleRooms as room (room.id)}
			<RoomCard {room} onEdit={handleEditRoom} />
		{/each}

		{#if $visibleRooms.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h2>Keine Räume vorhanden</h2>
				<p>Erstelle deinen ersten Raum über die Admin-Toolbar unten!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 100px; /* Header height */
		left: 0;
		right: 0;
		bottom: 80px; /* Toolbar height */
		overflow: hidden;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}

	.canvas {
		position: relative;
		width: 100%;
		height: 100%;
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
		background-size: 30px 30px;
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: white;
		opacity: 0.7;
	}

	.empty-icon {
		font-size: 120px;
		margin-bottom: 20px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.empty-state h2 {
		font-size: 36px;
		font-weight: 700;
		margin: 0 0 15px 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.empty-state p {
		font-size: 24px;
		margin: 0;
		opacity: 0.8;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}
</style>
	.canvas-container {
		position: fixed;
		top: 100px; /* Header height */
		left: 0;
		right: 0;
		bottom: 80px; /* Toolbar height */
		overflow: hidden;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}

	.canvas {
		position: relative;
		width: 100%;
		height: 100%;
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
		background-size: 30px 30px;
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: white;
		opacity: 0.7;
	}

	.empty-icon {
		font-size: 120px;
		margin-bottom: 20px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.empty-state h2 {
		font-size: 36px;
		font-weight: 700;
		margin: 0 0 15px 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.empty-state p {
		font-size: 24px;
		margin: 0;
		opacity: 0.8;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}
</style>
