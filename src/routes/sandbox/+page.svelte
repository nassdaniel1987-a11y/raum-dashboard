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
	import SandboxLayoutOrbital from '$lib/sandbox/layouts/SandboxLayoutOrbital.svelte';

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
		<div class="loading-inner">
			<div class="loading-label">SANDBOX</div>
			<div class="loading-spinner"></div>
			<div class="loading-sub">Initialisiere Labor...</div>
		</div>
	</div>
{:else}

	<button
		class="sandbox-badge"
		bind:this={badgeEl}
		onclick={() => (showPanel = !showPanel)}
		title="Sandbox-Menü öffnen"
		aria-expanded={showPanel}
	>
		<span class="badge-ping"></span>
		<span class="badge-label">LAB</span>
	</button>

	{#if showPanel}
		<div class="sandbox-panel" bind:this={panelEl} transition:fade={{ duration: 180 }}>
			<div class="panel-scanline" aria-hidden="true"></div>

			<div class="panel-header">
				<div class="panel-header-top">
					<span class="panel-status-dot"></span>
					<span class="panel-title">SANDBOX // EXPERIMENTAL</span>
				</div>
				<span class="panel-hint">_ kein DB-Schreibzugriff aktiv</span>
			</div>

			<div class="panel-section-label">LAYOUT AUSWÄHLEN</div>
			<div class="panel-layouts">
				{#each LAYOUT_OPTIONS as opt}
					<button
						class="panel-layout-btn"
						class:active={$sandboxLayout === opt.id}
						onclick={() => { sandboxLayout.setLayout(opt.id); showPanel = false; }}
					>
						<span class="panel-layout-icon">{opt.icon}</span>
						<div class="panel-layout-text">
							<span class="panel-layout-name">{opt.label}</span>
							<span class="panel-layout-desc">{opt.description}</span>
						</div>
						{#if $sandboxLayout === opt.id}
							<span class="panel-active-pip" aria-hidden="true"></span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="panel-divider"></div>
			<button class="panel-exit-btn" onclick={exitSandbox}>
				<span class="exit-arrow">&#8617;</span>
				Live-Dashboard
			</button>
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
		{:else if $sandboxLayout === 'orbital'}
			<SandboxLayoutOrbital {handleEditRoom} />
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
	@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Bebas+Neue&display=swap');

	/* ── Design Tokens ── */
	:root {
		--lab-cyan: #00e5ff;
		--lab-cyan-dim: rgba(0, 229, 255, 0.15);
		--lab-cyan-glow: rgba(0, 229, 255, 0.4);
		--lab-amber: #ffb300;
		--lab-bg: rgba(4, 9, 14, 0.96);
		--lab-border: rgba(0, 229, 255, 0.18);
		--lab-text: rgba(200, 230, 240, 0.9);
		--lab-text-dim: rgba(120, 170, 185, 0.5);
		--lab-font-mono: 'DM Mono', 'Courier New', monospace;
		--lab-font-display: 'Bebas Neue', sans-serif;
	}

	/* ── Loading Screen ── */
	.sandbox-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: 20px;
		background: #04090e;
		font-family: var(--lab-font-mono);
	}

	.loading-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.loading-label {
		font-family: var(--lab-font-display);
		font-size: 32px;
		letter-spacing: 6px;
		color: var(--lab-cyan);
		text-shadow: 0 0 20px var(--lab-cyan-glow), 0 0 60px rgba(0, 229, 255, 0.15);
		animation: label-pulse 2s ease-in-out infinite;
	}

	@keyframes label-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.loading-spinner {
		width: 36px;
		height: 36px;
		border: 2px solid rgba(0, 229, 255, 0.12);
		border-top-color: var(--lab-cyan);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		box-shadow: 0 0 12px var(--lab-cyan-glow);
	}

	.loading-sub {
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--lab-text-dim);
		text-transform: uppercase;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ── Mini Badge (LAB Indicator) ── */
	.sandbox-badge {
		position: fixed;
		top: 10px;
		left: 10px;
		z-index: 300;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 5px 12px 5px 8px;
		background: rgba(4, 9, 14, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--lab-border);
		border-radius: 4px;
		cursor: pointer;
		font-family: var(--lab-font-mono);
		transition: border-color 0.2s, box-shadow 0.2s;
		box-shadow:
			0 0 0 1px rgba(0, 229, 255, 0.06),
			0 4px 16px rgba(0, 0, 0, 0.6);
	}

	.sandbox-badge:hover {
		border-color: rgba(0, 229, 255, 0.5);
		box-shadow:
			0 0 0 1px rgba(0, 229, 255, 0.15),
			0 0 20px rgba(0, 229, 255, 0.12),
			0 4px 20px rgba(0, 0, 0, 0.7);
	}

	.badge-ping {
		position: relative;
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--lab-cyan);
		box-shadow: 0 0 6px var(--lab-cyan);
		flex-shrink: 0;
	}

	.badge-ping::before {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 1px solid var(--lab-cyan);
		opacity: 0;
		animation: radar-ping 2.4s ease-out infinite;
	}

	.badge-ping::after {
		content: '';
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		border: 1px solid var(--lab-cyan);
		opacity: 0;
		animation: radar-ping 2.4s ease-out 0.5s infinite;
	}

	@keyframes radar-ping {
		0% { opacity: 0.7; transform: scale(0.5); }
		100% { opacity: 0; transform: scale(1.8); }
	}

	.badge-label {
		font-family: var(--lab-font-display);
		font-size: 14px;
		letter-spacing: 3px;
		color: var(--lab-cyan);
		text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
		line-height: 1;
	}

	/* ── Dropdown Panel (Terminal HUD) ── */
	.sandbox-panel {
		position: fixed;
		top: 46px;
		left: 10px;
		z-index: 300;
		background: var(--lab-bg);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--lab-border);
		border-radius: 4px;
		padding: 0;
		min-width: 248px;
		max-width: 290px;
		box-shadow:
			0 0 0 1px rgba(0, 229, 255, 0.06),
			0 0 40px rgba(0, 229, 255, 0.06),
			0 16px 48px rgba(0, 0, 0, 0.8);
		font-family: var(--lab-font-mono);
		overflow: hidden;
	}

	/* CRT scanline overlay */
	.panel-scanline {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 229, 255, 0.018) 2px,
			rgba(0, 229, 255, 0.018) 4px
		);
	}

	.panel-header {
		position: relative;
		z-index: 2;
		padding: 12px 14px 10px;
		border-bottom: 1px solid var(--lab-border);
		background: rgba(0, 229, 255, 0.03);
	}

	.panel-header-top {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 3px;
	}

	.panel-status-dot {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--lab-cyan);
		box-shadow: 0 0 6px var(--lab-cyan);
		flex-shrink: 0;
		animation: dot-blink 3s ease-in-out infinite;
	}

	@keyframes dot-blink {
		0%, 90%, 100% { opacity: 1; }
		95% { opacity: 0.1; }
	}

	.panel-title {
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		color: var(--lab-cyan);
		text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
	}

	.panel-hint {
		display: block;
		font-size: 10px;
		color: var(--lab-text-dim);
		padding-left: 14px;
		font-style: italic;
	}

	.panel-section-label {
		position: relative;
		z-index: 2;
		font-size: 8px;
		letter-spacing: 2px;
		color: var(--lab-text-dim);
		text-transform: uppercase;
		padding: 8px 14px 4px;
	}

	.panel-layouts {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 0 6px 6px;
		max-height: 360px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 229, 255, 0.2) transparent;
	}

	.panel-layouts::-webkit-scrollbar {
		width: 3px;
	}

	.panel-layouts::-webkit-scrollbar-thumb {
		background: rgba(0, 229, 255, 0.25);
		border-radius: 2px;
	}

	.panel-layout-btn {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 8px;
		border-radius: 3px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--lab-text);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s, border-color 0.15s;
		position: relative;
	}

	.panel-layout-btn:hover {
		background: rgba(0, 229, 255, 0.05);
		border-color: rgba(0, 229, 255, 0.12);
	}

	.panel-layout-btn.active {
		background: rgba(0, 229, 255, 0.08);
		border-color: rgba(0, 229, 255, 0.32);
	}

	.panel-layout-btn.active .panel-layout-name {
		color: var(--lab-cyan);
		text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
	}

	.panel-layout-icon {
		font-size: 13px;
		width: 18px;
		text-align: center;
		flex-shrink: 0;
		opacity: 0.8;
	}

	.panel-layout-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex: 1;
		min-width: 0;
	}

	.panel-layout-name {
		font-size: 11px;
		font-weight: 500;
		color: rgba(200, 230, 240, 0.95);
		line-height: 1.2;
		transition: color 0.15s, text-shadow 0.15s;
	}

	.panel-layout-desc {
		font-size: 9px;
		color: var(--lab-text-dim);
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.panel-active-pip {
		display: block;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--lab-cyan);
		box-shadow: 0 0 5px var(--lab-cyan);
		flex-shrink: 0;
	}

	.panel-divider {
		position: relative;
		z-index: 2;
		height: 1px;
		margin: 0 14px 8px;
		background: var(--lab-border);
	}

	.panel-exit-btn {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		width: calc(100% - 12px);
		margin: 0 6px 8px;
		padding: 8px;
		border-radius: 3px;
		border: 1px solid rgba(200, 230, 240, 0.1);
		background: rgba(200, 230, 240, 0.03);
		color: var(--lab-text-dim);
		font-family: var(--lab-font-mono);
		font-size: 10px;
		letter-spacing: 1px;
		font-weight: 500;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.panel-exit-btn:hover {
		background: rgba(200, 230, 240, 0.07);
		color: rgba(200, 230, 240, 0.9);
		border-color: rgba(200, 230, 240, 0.2);
	}

	.exit-arrow {
		font-size: 14px;
		line-height: 1;
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
