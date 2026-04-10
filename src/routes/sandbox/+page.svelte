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

	let isLoading = $state(true);
	let showMenu = $state(false);
	let editingRoom = $state<RoomWithConfig | null>(null);
	let showScheduler = $state(false);
	let canvasRef: any = $state(null);

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

{#if isLoading}
	<div class="sandbox-loading" transition:fade>
		<div class="loading-spinner"></div>
		<p>Lade Sandbox...</p>
	</div>
{:else}
	<div class="sandbox-banner" transition:fade>
		<span class="sandbox-label">🧪 SANDBOX MODUS</span>
		<span class="sandbox-hint">Kein DB-Schreibzugriff — nur lokale Änderungen</span>
		<button class="sandbox-exit-btn" onclick={exitSandbox}>← Live-Dashboard</button>
	</div>

	<div class="dashboard">
		<Header onOpenMenu={() => (showMenu = true)} {canvasRef} />
		<Canvas {handleEditRoom} bind:this={canvasRef} />
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

	.sandbox-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 36px;
		background: linear-gradient(90deg, #d97706, #f59e0b);
		color: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		z-index: 200;
		font-size: 13px;
		font-weight: 700;
	}

	.sandbox-label {
		font-size: 11px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		background: rgba(0, 0, 0, 0.15);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.sandbox-hint {
		font-size: 12px;
		opacity: 0.8;
	}

	@media (max-width: 600px) {
		.sandbox-hint {
			display: none;
		}
	}

	.sandbox-exit-btn {
		padding: 3px 12px;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		color: #1a1a1a;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.2s;
	}

	.sandbox-exit-btn:hover {
		background: rgba(0, 0, 0, 0.35);
	}

	.dashboard {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		padding-top: 36px;
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
