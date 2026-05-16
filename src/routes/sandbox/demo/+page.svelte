<script lang="ts">
	import { goto } from '$app/navigation';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import SandboxLayoutCalm from '$lib/sandbox/layouts/SandboxLayoutCalm.svelte';
	import {
		DEMO_APP_SETTINGS,
		DEMO_CONFIGS,
		DEMO_NOW,
		DEMO_ROOMS,
		DEMO_STATUSES
	} from '$lib/sandbox/demoData';
	import type { RoomWithConfig } from '$lib/types';

	let editingRoom = $state<RoomWithConfig | null>(null);

	function handleEditRoom(room: RoomWithConfig) {
		editingRoom = room;
	}

	function backToSandbox() {
		goto('/sandbox');
	}
</script>

<div class="demo-shell">
	<header class="demo-header">
		<div>
			<span>Sandbox Demo</span>
			<h1>Ruhige TV-Ansicht</h1>
		</div>
		<div class="demo-time">
			<span>Beispielzeit</span>
			<strong>09:55</strong>
		</div>
	</header>
	<button class="back-button" onclick={backToSandbox}>
		Zur Sandbox
	</button>

	<div class="demo-dashboard">
		<SandboxLayoutCalm
			{handleEditRoom}
			nowOverride={DEMO_NOW}
			roomsOverride={DEMO_ROOMS}
			roomStatusesOverride={DEMO_STATUSES}
			dailyConfigsOverride={DEMO_CONFIGS}
			viewWeekdayOverride={6}
			runnerNameOverride={DEMO_APP_SETTINGS.runner_name}
			initialPageId="eg"
		/>
	</div>
</div>

{#if editingRoom}
	<RoomEditorModal room={editingRoom} onClose={() => (editingRoom = null)} />
{/if}

<style>
	.demo-shell {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #020617;
	}

	.demo-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 150;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 22px;
		box-sizing: border-box;
		background: rgba(2, 6, 23, 0.94);
		border-bottom: 1px solid rgba(226, 232, 240, 0.12);
		color: #f8fafc;
	}

	.demo-header span,
	.demo-time span {
		display: block;
		color: rgba(226, 232, 240, 0.62);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.demo-header h1 {
		margin: 2px 0 0;
		font-size: 20px;
		line-height: 1;
	}

	.demo-time {
		text-align: right;
	}

	.demo-time strong {
		display: block;
		margin-top: 2px;
		font-size: 22px;
		line-height: 1;
	}

	.demo-dashboard {
		width: 100%;
		height: 100%;
		padding-top: 64px;
		box-sizing: border-box;
	}

	.back-button {
		position: fixed;
		left: 18px;
		top: 76px;
		z-index: 160;
		padding: 9px 12px;
		border: 1px solid rgba(226, 232, 240, 0.2);
		background: rgba(15, 23, 42, 0.76);
		color: rgba(248, 250, 252, 0.84);
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
	}
</style>
