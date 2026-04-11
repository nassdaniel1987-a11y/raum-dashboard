<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { supabase } from '$lib/supabase/client';
	import {
		rooms,
		roomStatuses,
		dailyConfigs,
		appSettings,
		dailyHighlights,
		persons,
		isEditMode
	} from '$lib/stores/appState';
	import { FALLBACK_ROOMS, FALLBACK_APP_SETTINGS, buildFallbackStatuses } from '$lib/sandbox/mockData';
	import type { Room, RoomStatus, RoomWithConfig } from '$lib/types';

	import Header from '$lib/components/Header.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import SidebarMenu from '$lib/components/SidebarMenu.svelte';
	import RoomEditorModal from '$lib/components/RoomEditorModal.svelte';
	import DailySchedulerModal from '$lib/components/DailySchedulerModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import { sandboxLayout, LAYOUT_OPTIONS } from '$lib/sandbox/layoutStore';
	import SandboxLayoutFocus from '$lib/sandbox/layouts/SandboxLayoutFocus.svelte';
	import SandboxLayoutGrid from '$lib/sandbox/layouts/SandboxLayoutGrid.svelte';
	import SandboxLayoutCompact from '$lib/sandbox/layouts/SandboxLayoutCompact.svelte';
	import SandboxLayoutSplit from '$lib/sandbox/layouts/SandboxLayoutSplit.svelte';
	import SandboxLayoutTimeline from '$lib/sandbox/layouts/SandboxLayoutTimeline.svelte';
	import SandboxLayoutHeatmap from '$lib/sandbox/layouts/SandboxLayoutHeatmap.svelte';
	import SandboxLayoutMasonry from '$lib/sandbox/layouts/SandboxLayoutMasonry.svelte';
	import SandboxLayoutFloorplan from '$lib/sandbox/layouts/SandboxLayoutFloorplan.svelte';
	import SandboxLayoutDeck from '$lib/sandbox/layouts/SandboxLayoutDeck.svelte';
	import SandboxLayoutSplitscreen from '$lib/sandbox/layouts/SandboxLayoutSplitscreen.svelte';
	import SandboxLayoutNeon from '$lib/sandbox/layouts/SandboxLayoutNeon.svelte';

	let isLoading = $state(true);
	let showMenu = $state(false);
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let canvasRef: any = $state(null);
	let showPanel = $state(false);
	let badgeEl: HTMLElement | null = $state(null);
	let panelEl: HTMLElement | null = $state(null);

	function handleWindowClick(e: MouseEvent) {
		if (!showPanel) return;
		const target = e.target as Node;
		if (badgeEl?.contains(target) || panelEl?.contains(target)) return;
		showPanel = false;
	}

	onMount(async () => {
		try {
			const [roomsRes, statusRes, settingsRes] = await Promise.all([
				supabase.from('rooms').select('*').order('position_x'),
				supabase.from('room_status').select('*'),
				supabase.from('app_settings').select('*').single()
			]);

			const loadedRooms: Room[] = roomsRes.data ?? FALLBACK_ROOMS;

			rooms.set(loadedRooms);
			roomStatuses.set(
				new Map(
					((statusRes.data as RoomStatus[]) ?? []).map((s) => [s.room_id, s])
				)
			);
			dailyConfigs.set(new Map());
			appSettings.set(settingsRes.data ?? FALLBACK_APP_SETTINGS);
			dailyHighlights.set([]);
			persons.set([]);
		} catch {
			rooms.set(FALLBACK_ROOMS);
			roomStatuses.set(buildFallbackStatuses(FALLBACK_ROOMS));
			dailyConfigs.set(new Map());
			appSettings.set(FALLBACK_APP_SETTINGS);
			dailyHighlights.set([]);
			persons.set([]);
		} finally {
			isLoading = false;
		}
	});

	onDestroy(() => {
		rooms.set([]);
		roomStatuses.set(new Map());
		isEditMode.set(false);
	});

	function sandboxCreateRoom(name: string, floor: string = 'eg') {
		const fakeId = crypto.randomUUID();
		const allRooms = get(rooms);
		const sameFloor = allRooms.filter((r) => r.floor === floor);
		const maxX =
			sameFloor.length > 0 ? Math.max(...sameFloor.map((r) => r.position_x ?? 0)) : -320;

		rooms.update((list) => [
			...list,
			{
				id: fakeId,
				name,
				floor: floor as Room['floor'],
				position_x: maxX + 320,
				position_y: 0,
				width: 300,
				height: 250,
				background_color: '#607D8B',
				theme: 'space',
				image_url: null,
				person: null,
				created_at: new Date().toISOString()
			}
		]);

		roomStatuses.update((map) => {
			const m = new Map(map);
			m.set(fakeId, {
				room_id: fakeId,
				is_open: false,
				manual_override: false,
				last_updated: new Date().toISOString()
			});
			return m;
		});
	}

	function handleEditRoom(room: RoomWithConfig) {
		editingRoom = room;
	}

	function exitSandbox() {
		goto('/');
	}
</script>

<svelte:window onmousedown={handleWindowClick} />

{#if isLoading}
	<div class="sandbox-loading" transition:fade>
		<div class="loading-spinner"></div>
		<p>Lade Sandbox...</p>
	</div>
{:else}

	<button
		class="sandbox-badge"
		bind:this={badgeEl}
		onclick={() => (showPanel = !showPanel)}
		title="Sandbox-Menü"
	>
		🧪
	</button>

	{#if showPanel}
		<div class="sandbox-panel" bind:this={panelEl} transition:fade={{ duration: 150 }}>
			<div class="panel-header">
				<span class="panel-title">SANDBOX MODUS</span>
				<span class="panel-hint">Kein DB-Schreibzugriff</span>
			</div>

			<div class="panel-layouts">
				{#each LAYOUT_OPTIONS as opt}
					<button
						class="panel-layout-btn"
						class:active={$sandboxLayout === opt.id}
						onclick={() => { sandboxLayout.setLayout(opt.id); showPanel = false; }}
					>
						<span class="panel-layout-icon">{opt.icon}</span>
						<span class="panel-layout-name">{opt.label}</span>
						<span class="panel-layout-desc">{opt.description}</span>
					</button>
				{/each}
			</div>

			<button class="panel-exit-btn" onclick={exitSandbox}>← Live-Dashboard</button>
		</div>
	{/if}

	<div class="dashboard">
		<Header onOpenMenu={() => (showMenu = true)} {canvasRef} />
		{#if $sandboxLayout === 'carousel'}
			<Canvas {handleEditRoom} bind:this={canvasRef} />
		{:else if $sandboxLayout === 'focus'}
			<SandboxLayoutFocus {handleEditRoom} />
		{:else if $sandboxLayout === 'grid'}
			<SandboxLayoutGrid {handleEditRoom} />
		{:else if $sandboxLayout === 'compact'}
			<SandboxLayoutCompact {handleEditRoom} />
		{:else if $sandboxLayout === 'split'}
			<SandboxLayoutSplit {handleEditRoom} />
		{:else if $sandboxLayout === 'timeline'}
			<SandboxLayoutTimeline {handleEditRoom} />
		{:else if $sandboxLayout === 'heatmap'}
			<SandboxLayoutHeatmap {handleEditRoom} />
		{:else if $sandboxLayout === 'masonry'}
			<SandboxLayoutMasonry {handleEditRoom} />
		{:else if $sandboxLayout === 'floorplan'}
			<SandboxLayoutFloorplan {handleEditRoom} />
		{:else if $sandboxLayout === 'deck'}
			<SandboxLayoutDeck {handleEditRoom} />
		{:else if $sandboxLayout === 'splitscreen'}
			<SandboxLayoutSplitscreen {handleEditRoom} />
		{:else if $sandboxLayout === 'neon'}
			<SandboxLayoutNeon {handleEditRoom} />
		{/if}
	</div>

	<SidebarMenu
		isOpen={showMenu}
		onClose={() => (showMenu = false)}
		onOpenScheduler={() => (showScheduler = true)}
		{canvasRef}
		onCreateRoom={sandboxCreateRoom}
	/>
	<FloatingActionButton onOpenScheduler={() => (showScheduler = true)} />
	<ToastContainer />
	<ConfirmDialog />

	{#if editingRoom}
		<RoomEditorModal room={editingRoom} onClose={() => (editingRoom = null)} />
	{/if}

	{#if showScheduler}
		<DailySchedulerModal onClose={() => (showScheduler = false)} />
	{/if}
{/if}

<style>
	.sandbox-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: 16px;
		color: #fff;
		font-size: 16px;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-top-color: #f59e0b;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ── Mini Badge ── */
	.sandbox-badge {
		position: fixed;
		top: 12px;
		left: 12px;
		z-index: 300;
		background: rgba(217, 119, 6, 0.88);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		padding: 5px 11px;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s, transform 0.15s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.sandbox-badge:hover {
		background: rgba(217, 119, 6, 1);
		transform: scale(1.08);
	}

	/* ── Dropdown Panel ── */
	.sandbox-panel {
		position: fixed;
		top: 50px;
		left: 12px;
		z-index: 300;
		background: rgba(20, 12, 3, 0.94);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid rgba(217, 119, 6, 0.35);
		border-radius: 14px;
		padding: 14px;
		min-width: 230px;
		max-width: 280px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.panel-header {
		margin-bottom: 10px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(217, 119, 6, 0.2);
	}

	.panel-title {
		display: block;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 1.8px;
		text-transform: uppercase;
		color: #f59e0b;
	}

	.panel-hint {
		display: block;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 2px;
	}

	.panel-layouts {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 10px;
	}

	.panel-layout-btn {
		display: grid;
		grid-template-columns: 22px 1fr;
		grid-template-rows: auto auto;
		column-gap: 8px;
		padding: 7px 8px;
		border-radius: 8px;
		border: 1px solid transparent;
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		text-align: left;
		transition: background 0.12s, border-color 0.12s;
	}

	.panel-layout-btn:hover {
		background: rgba(255, 255, 255, 0.07);
	}

	.panel-layout-btn.active {
		background: rgba(217, 119, 6, 0.2);
		border-color: rgba(217, 119, 6, 0.45);
	}

	.panel-layout-icon {
		grid-row: 1 / 3;
		align-self: center;
		font-size: 15px;
		text-align: center;
	}

	.panel-layout-name {
		font-size: 12px;
		font-weight: 700;
		color: #fff;
		line-height: 1.3;
	}

	.panel-layout-desc {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.38);
		line-height: 1.2;
	}

	.panel-exit-btn {
		width: 100%;
		padding: 7px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.panel-exit-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	/* ── Dashboard ── */
	.dashboard {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		transform: translateZ(0);
		contain: layout style paint;
		box-sizing: border-box;
	}

	@media (max-width: 480px) {
		.dashboard {
			overflow: auto;
			transform: none;
			contain: none;
		}
	}
</style>
