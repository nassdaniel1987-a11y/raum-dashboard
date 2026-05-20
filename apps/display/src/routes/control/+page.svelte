<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import {
		currentTime,
		dailyConfigs,
		displayPages,
		roomStatuses,
		rooms,
		setViewDay,
		viewWeekday
	} from '$lib/stores/displayStore';
	import type { DailyConfig, DisplayRoom, RoomStatus } from '$lib/types';

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

	type ImageSize = 'small' | 'medium' | 'large';
	type ImagePosition = {
		x: number;
		y: number;
		width: number;
		zoom: number;
		rotation: number;
	};

	let selectedRoomId = $state<string | null>(null);
	let lastLoadedRoomKey = $state('');
	let viewMode = $state<'planner' | 'editor'>('planner');
	let saving = $state(false);
	let uploading = $state(false);
	let message = $state('');
	let activity = $state('');
	let openTime = $state('');
	let closeTime = $state('');
	let roomName = $state('');
	let fallbackPerson = $state('');
	let activityImageUrl = $state<string | null>(null);
	let activityImageSize = $state<ImageSize>('medium');
	let imagePosition = $state<ImagePosition>({ x: 68, y: 58, width: 36, zoom: 1, rotation: 0 });
	let selectedImageFile = $state<File | null>(null);
	let imageDragStart = $state<{ pointerId: number; x: number; y: number; position: ImagePosition } | null>(null);
	let editingTimeRoomId = $state<string | null>(null);
	let plannerOpenTime = $state('');
	let plannerCloseTime = $state('');
	let plannerSavingRoomId = $state<string | null>(null);

	let allRooms = $derived($displayPages.flatMap((page) => page.rooms));
	let selectedRoom = $derived(
		allRooms.find((room) => room.id === selectedRoomId) ?? allRooms[0] ?? null
	);
	let viewWeekdayName = $derived(weekdayNames[$viewWeekday % 7]);
	let pageLabel = $derived(
		$displayPages.find((page) => page.rooms.some((room) => room.id === selectedRoom?.id))?.label ?? ''
	);
	let selectedPageRoomCount = $derived(
		$displayPages.find((page) => page.rooms.some((room) => room.id === selectedRoom?.id))?.rooms.length ?? 4
	);

	$effect(() => {
		if (!selectedRoom && selectedRoomId !== null) {
			selectedRoomId = null;
		}

		if (selectedRoom && selectedRoomId !== selectedRoom.id) {
			selectedRoomId = selectedRoom.id;
		}
	});

	$effect(() => {
		if (!selectedRoom) return;

		const key = `${selectedRoom.id}-${$viewWeekday}`;
		if (key === lastLoadedRoomKey) return;

		lastLoadedRoomKey = key;
		roomName = selectedRoom.name;
		fallbackPerson = selectedRoom.person ?? '';
		activity = selectedRoom.config.activity ?? '';
		openTime = formatTime(selectedRoom.config.open_time);
		closeTime = formatTime(selectedRoom.config.close_time);
		activityImageUrl = selectedRoom.config.activity_image_url;
		activityImageSize = selectedRoom.config.activity_image_size ?? 'medium';
		imagePosition = normalizeImagePosition(
			selectedRoom.config.activity_image_position_calm ?? selectedRoom.config.activity_image_position,
			selectedRoom.config.activity_image_size
		);
		selectedImageFile = null;
		message = '';
	});

	function formatTime(time: string | null | undefined) {
		return time ? time.substring(0, 5) : '';
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function normalizeImagePosition(position: unknown, size: ImageSize | null | undefined = 'medium'): ImagePosition {
		const candidate =
			typeof position === 'object' && position !== null ? (position as Partial<ImagePosition>) : {};
		const legacyWidth = size === 'small' ? 26 : size === 'large' ? 46 : 36;
		const hasFreePosition = Number.isFinite(candidate.width);

		return {
			x: hasFreePosition
				? clamp(Number(candidate.x), 8, 92)
				: clamp(68 + Number(candidate.x ?? 0) * 0.12, 8, 92),
			y: hasFreePosition
				? clamp(Number(candidate.y), 12, 88)
				: clamp(58 + Number(candidate.y ?? 0) * 0.12, 12, 88),
			width: clamp(Number.isFinite(candidate.width) ? Number(candidate.width) : legacyWidth, 16, 86),
			zoom: Number.isFinite(candidate.zoom) ? Math.max(0.2, Number(candidate.zoom)) : 1,
			rotation: Number.isFinite(candidate.rotation) ? Number(candidate.rotation) : 0
		};
	}

	function imageTransform() {
		return `--image-x: ${imagePosition.x}; --image-y: ${imagePosition.y}; --image-width: ${imagePosition.width}; --image-zoom: ${imagePosition.zoom}; --image-rotation: ${imagePosition.rotation}deg;`;
	}

	function previewShapeClass(roomCount: number) {
		if (roomCount === 1) return 'one';
		if (roomCount === 2) return 'two';
		if (roomCount === 3) return 'three';
		return 'four';
	}

	function personLabel(room: DisplayRoom) {
		return room.displayPersons.length ? room.displayPersons.join(', ') : 'Keine Person';
	}

	function configTimeLabel(config: DailyConfig) {
		const open = formatTime(config.open_time);
		const close = formatTime(config.close_time);
		if (open && close) return `${open} - ${close}`;
		if (open) return `ab ${open}`;
		if (close) return `bis ${close}`;
		return 'Kein Zeitfenster';
	}

	function changeDay(offset: number) {
		setViewDay($viewWeekday + offset);
		lastLoadedRoomKey = '';
	}

	function goToday() {
		setViewDay(new Date().getDay() || 7);
		lastLoadedRoomKey = '';
	}

	function updateImagePosition(partial: Partial<ImagePosition>) {
		imagePosition = { ...imagePosition, ...partial };
	}

	function editPlannerTime(room: DisplayRoom) {
		editingTimeRoomId = room.id;
		plannerOpenTime = formatTime(room.config.open_time);
		plannerCloseTime = formatTime(room.config.close_time);
	}

	function selectRoom(room: DisplayRoom) {
		selectedRoomId = room.id;
		lastLoadedRoomKey = '';
		viewMode = 'editor';
	}

	function localPreviewUrl(file: File) {
		return URL.createObjectURL(file);
	}

	async function handleImageSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			message = 'Bitte eine Bilddatei auswählen.';
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			message = 'Das Bild ist zu groß. Maximal 10 MB.';
			return;
		}

		selectedImageFile = file;
		activityImageUrl = localPreviewUrl(file);
		message = 'Bild ausgewählt. Speichern nicht vergessen.';
	}

	async function uploadImage(roomId: string) {
		if (!selectedImageFile) return activityImageUrl;

		uploading = true;
		const fileExt = selectedImageFile.name.split('.').pop() || 'jpg';
		const fileName = `activity-${roomId}-${Date.now()}.${fileExt}`;

		const { error } = await supabase.storage.from('room-images').upload(fileName, selectedImageFile, {
			cacheControl: '3600',
			upsert: true
		});

		uploading = false;
		if (error) throw error;

		const {
			data: { publicUrl }
		} = supabase.storage.from('room-images').getPublicUrl(fileName);

		return publicUrl;
	}

	function removeImage() {
		activityImageUrl = null;
		selectedImageFile = null;
		imagePosition = { x: 68, y: 58, width: 36, zoom: 1, rotation: 0 };
		message = 'Bild wird beim Speichern entfernt.';
	}

	function fitImage() {
		imagePosition = { x: 68, y: 58, width: 38, zoom: 1, rotation: 0 };
		message = 'Bild sitzt wieder ruhig in der Kachel.';
	}

	function centerImage() {
		imagePosition = { ...imagePosition, x: 50, y: 55 };
	}

	function zoomImage(delta: number) {
		imagePosition = {
			...imagePosition,
			zoom: Math.max(0.2, Math.min(2.5, Math.round((imagePosition.zoom + delta) * 100) / 100))
		};
	}

	function resizeImage(delta: number) {
		imagePosition = {
			...imagePosition,
			width: clamp(Math.round(imagePosition.width + delta), 16, 86)
		};
	}

	function rotateImage(delta: number) {
		imagePosition = { ...imagePosition, rotation: imagePosition.rotation + delta };
	}

	function handleImagePointerDown(event: PointerEvent) {
		if (!activityImageUrl) return;
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		imageDragStart = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			position: imagePosition
		};
	}

	function handleImagePointerMove(event: PointerEvent) {
		if (!imageDragStart || imageDragStart.pointerId !== event.pointerId) return;
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const dx = ((event.clientX - imageDragStart.x) / Math.max(1, rect.width)) * 100;
		const dy = ((event.clientY - imageDragStart.y) / Math.max(1, rect.height)) * 100;
		imagePosition = {
			...imagePosition,
			x: clamp(Math.round(imageDragStart.position.x + dx), 8, 92),
			y: clamp(Math.round(imageDragStart.position.y + dy), 12, 88)
		};
	}

	function handleImagePointerEnd(event: PointerEvent) {
		if (imageDragStart?.pointerId === event.pointerId) imageDragStart = null;
	}

	async function saveRoom() {
		if (!selectedRoom) return;

		saving = true;
		message = '';

		try {
			const finalImageUrl = await uploadImage(selectedRoom.id);
			const roomUpdate = {
				name: roomName.trim() || selectedRoom.name,
				person: fallbackPerson.trim() || null
			};

			const { error: roomError } = await supabase.from('rooms').update(roomUpdate).eq('id', selectedRoom.id);
			if (roomError) throw roomError;

			const configData = {
				room_id: selectedRoom.id,
				weekday: $viewWeekday,
				activity: activity.trim() || null,
				open_time: openTime || null,
				close_time: closeTime || null,
				title_font_size: selectedRoom.config.title_font_size,
				text_font_size: selectedRoom.config.text_font_size,
				text_color: selectedRoom.config.text_color,
				title_alignment: selectedRoom.config.title_alignment,
				text_alignment: selectedRoom.config.text_alignment,
				is_locked: selectedRoom.config.is_locked,
				activity_image_url: finalImageUrl,
				activity_image_size: activityImageSize,
				activity_image_crop: selectedRoom.config.activity_image_crop,
				activity_image_position: selectedRoom.config.activity_image_position,
				activity_image_position_calm: finalImageUrl ? imagePosition : null
			} satisfies Partial<DailyConfig> & { room_id: string; weekday: number };

			const { data: savedConfig, error: configError } = await supabase
				.from('daily_configs')
				.upsert(configData, { onConflict: 'room_id,weekday' })
				.select()
				.single();
			if (configError) throw configError;

			rooms.update((list) =>
				list.map((room) => (room.id === selectedRoom.id ? { ...room, ...roomUpdate } : room))
			);
			dailyConfigs.update((map) => {
				const next = new Map(map);
				next.set(`${selectedRoom.id}-${$viewWeekday}`, savedConfig as DailyConfig);
				return next;
			});

			selectedImageFile = null;
			activityImageUrl = finalImageUrl;
			message = 'Gespeichert.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
		} finally {
			saving = false;
			uploading = false;
		}
	}

	async function savePlannerTimes(room: DisplayRoom) {
		plannerSavingRoomId = room.id;
		message = '';

		try {
			const configData = {
				room_id: room.id,
				weekday: $viewWeekday,
				activity: room.config.activity,
				open_time: plannerOpenTime || null,
				close_time: plannerCloseTime || null,
				title_font_size: room.config.title_font_size,
				text_font_size: room.config.text_font_size,
				text_color: room.config.text_color,
				title_alignment: room.config.title_alignment,
				text_alignment: room.config.text_alignment,
				is_locked: room.config.is_locked,
				activity_image_url: room.config.activity_image_url,
				activity_image_size: room.config.activity_image_size,
				activity_image_crop: room.config.activity_image_crop,
				activity_image_position: room.config.activity_image_position,
				activity_image_position_calm: room.config.activity_image_position_calm
			} satisfies Partial<DailyConfig> & { room_id: string; weekday: number };

			const { data, error } = await supabase
				.from('daily_configs')
				.upsert(configData, { onConflict: 'room_id,weekday' })
				.select()
				.single();
			if (error) throw error;

			dailyConfigs.update((map) => {
				const next = new Map(map);
				next.set(`${room.id}-${$viewWeekday}`, data as DailyConfig);
				return next;
			});
			editingTimeRoomId = null;
			message = 'Zeit gespeichert.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Zeit konnte nicht gespeichert werden.';
		} finally {
			plannerSavingRoomId = null;
		}
	}

	async function setOpenState(isOpen: boolean) {
		if (!selectedRoom) return;

		saving = true;
		message = '';
		try {
			const update = {
				room_id: selectedRoom.id,
				is_open: isOpen,
				manual_override: true,
				last_updated: new Date().toISOString()
			};
			const { data, error } = await supabase
				.from('room_status')
				.upsert(update, { onConflict: 'room_id' })
				.select()
				.single();
			if (error) throw error;

			roomStatuses.update((map) => {
				const next = new Map(map);
				next.set(selectedRoom.id, data as RoomStatus);
				return next;
			});
			message = isOpen ? 'Raum geöffnet.' : 'Raum geschlossen.';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Status konnte nicht gespeichert werden.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Raum Display · Pflege</title>
</svelte:head>

<main class="control-shell">
	<header class="topbar">
		<div>
			<span>Raum Display</span>
			<strong>Pflege</strong>
		</div>
		<div class="top-actions">
			<button class:active={viewMode === 'planner'} onclick={() => (viewMode = 'planner')}>Tagesplaner</button>
			<button class:active={viewMode === 'editor'} onclick={() => (viewMode = 'editor')}>Raum bearbeiten</button>
			<button onclick={() => goto('/')}>Zur Anzeige</button>
		</div>
	</header>

	<section class="daybar">
		<button onclick={() => changeDay(-1)} aria-label="Vorheriger Tag">‹</button>
		<div>
			<span>Tag</span>
			<strong>{viewWeekdayName}</strong>
			<small>{pageLabel}</small>
		</div>
		<button onclick={() => changeDay(1)} aria-label="Nächster Tag">›</button>
		<button class="today" onclick={goToday}>Heute</button>
	</section>

	{#if viewMode === 'planner'}
		<section class="planner-view">
			{#each $displayPages as page (page.id)}
				<div class="planner-section">
					<h2>{page.label}</h2>
					<div class="planner-grid">
						{#each page.rooms as room (room.id)}
							<article class="planner-card">
								<div class="planner-card-head">
									<strong>{room.name}</strong>
									<span class:open={room.isOpen}>{room.isOpen ? 'Offen' : 'Geschlossen'}</span>
								</div>
								<p>{room.config.activity || 'Keine Aktivität eingetragen'}</p>
								<div class="planner-meta">
									<button type="button" class="time-chip" onclick={() => editPlannerTime(room)}>
										{configTimeLabel(room.config)}
									</button>
									<span>{personLabel(room)}</span>
									<span>{room.config.activity_image_url ? 'Bild vorhanden' : 'Kein Bild'}</span>
								</div>
								{#if editingTimeRoomId === room.id}
									<div class="planner-time-editor">
										<label>
											<span>Öffnet</span>
											<input type="time" bind:value={plannerOpenTime} />
										</label>
										<label>
											<span>Schließt</span>
											<input type="time" bind:value={plannerCloseTime} />
										</label>
										<button
											type="button"
											class="save-time"
											disabled={plannerSavingRoomId === room.id}
											onclick={() => void savePlannerTimes(room)}
										>
											{plannerSavingRoomId === room.id ? 'Speichert...' : 'Zeit speichern'}
										</button>
										<button type="button" onclick={() => (editingTimeRoomId = null)}>Abbrechen</button>
									</div>
								{:else}
									<button type="button" class="edit-room-button" onclick={() => selectRoom(room)}>
										Kachel komplett bearbeiten
									</button>
								{/if}
							</article>
						{/each}
					</div>
				</div>
			{/each}
		</section>
	{:else}
	<section class="control-layout">
		<aside class="room-list" aria-label="Räume">
			{#each $displayPages as page (page.id)}
				<div class="room-group">
					<h2>{page.label}</h2>
					{#each page.rooms as room (room.id)}
						<button class:active={room.id === selectedRoom?.id} onclick={() => selectRoom(room)}>
							<strong>{room.name}</strong>
							<span>{room.config.activity || 'Keine Aktivität'}</span>
						</button>
					{/each}
				</div>
			{/each}
		</aside>

		{#if selectedRoom}
			<form class="editor" onsubmit={(event) => { event.preventDefault(); void saveRoom(); }}>
				<section class="panel hero-panel">
					<div>
						<span>Raum</span>
						<h1>{selectedRoom.name}</h1>
					</div>
					<div class="status-actions">
						<button type="button" class="open" onclick={() => void setOpenState(true)}>Öffnen</button>
						<button type="button" class="close" onclick={() => void setOpenState(false)}>Schließen</button>
					</div>
				</section>

				<section class="panel">
					<h2>Text & Zeiten</h2>
					<label>
						<span>Raumname</span>
						<input bind:value={roomName} />
					</label>
					<label>
						<span>Aktivität</span>
						<textarea bind:value={activity} rows="4" placeholder="Keine Aktivität eingetragen"></textarea>
					</label>
					<div class="time-grid">
						<label>
							<span>Öffnet um</span>
							<input type="time" bind:value={openTime} />
						</label>
						<label>
							<span>Schließt um</span>
							<input type="time" bind:value={closeTime} />
						</label>
					</div>
					<label>
						<span>Personen Fallback</span>
						<input bind:value={fallbackPerson} placeholder="Wird genutzt, wenn Blitz nichts liefert" />
					</label>
				</section>

				<section class="panel">
					<h2>Aktivitätsbild</h2>
					<div class="image-workbench">
						<div class="image-preview-stage">
							<div class="preview-scale-note">
								<span>Display-Miniatur</span>
								<strong>{selectedPageRoomCount} {selectedPageRoomCount === 1 ? 'Kachel' : 'Kacheln'} auf dieser Etage</strong>
							</div>
							<div
								class={`image-card-preview ${previewShapeClass(selectedPageRoomCount)}`}
								onpointerdown={handleImagePointerDown}
								onpointermove={handleImagePointerMove}
								onpointerup={handleImagePointerEnd}
								onpointercancel={handleImagePointerEnd}
								role="presentation"
							>
								{#if activityImageUrl}
									<figure class="preview-image-free" style={imageTransform()}>
										<img src={activityImageUrl} alt="" />
									</figure>
								{/if}
								<div class="preview-status">
									<span></span>
									<strong>{selectedRoom.isOpen ? 'Offen' : 'Geschlossen'}</strong>
								</div>
								<div class="preview-copy">
									<h3>{roomName || selectedRoom.name}</h3>
									<p>{activity || 'Keine Aktivität eingetragen'}</p>
								</div>
								<footer>
									<span>{configTimeLabel({ ...selectedRoom.config, open_time: openTime || null, close_time: closeTime || null })}</span>
									<strong>{personLabel(selectedRoom)}</strong>
								</footer>
								{#if !activityImageUrl}
									<div class="no-image-note">Kein Bild</div>
								{/if}
							</div>
						</div>
						<div class="image-actions">
							<label class="file-button">
								<input type="file" accept="image/*" onchange={handleImageSelect} />
								<span>Bild auswählen</span>
							</label>
							<button type="button" onclick={fitImage} disabled={!activityImageUrl}>Ruhig platzieren</button>
							<button type="button" onclick={centerImage} disabled={!activityImageUrl}>Zentrieren</button>
							<button type="button" onclick={() => resizeImage(-4)} disabled={!activityImageUrl}>Schmaler</button>
							<button type="button" onclick={() => resizeImage(4)} disabled={!activityImageUrl}>Breiter</button>
							<button type="button" onclick={() => zoomImage(-0.1)} disabled={!activityImageUrl}>Auszoomen</button>
							<button type="button" onclick={() => zoomImage(0.1)} disabled={!activityImageUrl}>Reinzoomen</button>
							<button type="button" onclick={() => rotateImage(90)} disabled={!activityImageUrl}>90° drehen</button>
							<button type="button" onclick={removeImage} disabled={!activityImageUrl}>Bild entfernen</button>
						</div>
					</div>

					<p class="image-help">Bild direkt auf der Kachel ziehen. Breite verändert die Bildfläche, Zoom verändert den Inhalt im Bild.</p>

					<!-- Kompatibilität: alter Größenwert bleibt erhalten, ist aber nicht mehr die Hauptsteuerung. -->
					<div class="size-row legacy-size-row">
						<button type="button" class:active={activityImageSize === 'small'} onclick={() => (activityImageSize = 'small')}>Klein</button>
						<button type="button" class:active={activityImageSize === 'medium'} onclick={() => (activityImageSize = 'medium')}>Mittel</button>
						<button type="button" class:active={activityImageSize === 'large'} onclick={() => (activityImageSize = 'large')}>Groß</button>
					</div>

					<div class="slider-grid">
						<label>
							<span>X</span>
							<input type="range" min="8" max="92" step="1" value={imagePosition.x} oninput={(event) => updateImagePosition({ x: Number(event.currentTarget.value) })} />
							<strong>{imagePosition.x}%</strong>
						</label>
						<label>
							<span>Y</span>
							<input type="range" min="12" max="88" step="1" value={imagePosition.y} oninput={(event) => updateImagePosition({ y: Number(event.currentTarget.value) })} />
							<strong>{imagePosition.y}%</strong>
						</label>
						<label>
							<span>Breite</span>
							<input type="range" min="16" max="86" step="1" value={imagePosition.width} oninput={(event) => updateImagePosition({ width: Number(event.currentTarget.value) })} />
							<strong>{imagePosition.width}%</strong>
						</label>
						<label>
							<span>Zoom</span>
							<input type="range" min="0.2" max="2.5" step="0.05" value={imagePosition.zoom} oninput={(event) => updateImagePosition({ zoom: Number(event.currentTarget.value) })} />
							<strong>{Math.round(imagePosition.zoom * 100)}%</strong>
						</label>
						<label>
							<span>Drehung</span>
							<input type="range" min="-180" max="180" step="1" value={imagePosition.rotation} oninput={(event) => updateImagePosition({ rotation: Number(event.currentTarget.value) })} />
							<strong>{imagePosition.rotation}°</strong>
						</label>
					</div>
				</section>

				<footer class="savebar">
					<span>{message}</span>
					<button type="submit" disabled={saving || uploading}>
						{saving || uploading ? 'Speichert...' : 'Speichern'}
					</button>
				</footer>
			</form>
		{:else}
			<div class="empty">
				<strong>Keine Räume</strong>
				<span>Für {viewWeekdayName} sind noch keine Räume geladen.</span>
			</div>
		{/if}
	</section>
	{/if}
</main>

<style>
	.control-shell {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background:
			radial-gradient(circle at 78% 12%, rgba(125, 211, 252, 0.14), transparent 32%),
			linear-gradient(135deg, #071016, #0b1220 58%, #111827);
		color: #f6f3e8;
	}

	button,
	input,
	textarea {
		font: inherit;
	}

	button {
		min-height: 52px;
		border: 1px solid rgba(246, 243, 232, 0.16);
		background: rgba(246, 243, 232, 0.06);
		color: #f6f3e8;
		font-weight: 900;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.topbar,
	.daybar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px;
		border-bottom: 1px solid rgba(246, 243, 232, 0.12);
		background: rgba(5, 12, 19, 0.72);
		backdrop-filter: blur(18px);
	}

	.topbar {
		justify-content: space-between;
	}

	.top-actions {
		display: flex;
		gap: 10px;
	}

	.top-actions button {
		padding: 0 14px;
	}

	.top-actions button.active {
		border-color: rgba(134, 239, 172, 0.46);
		background: rgba(34, 197, 94, 0.16);
	}

	.topbar span,
	.daybar span,
	.panel h2,
	label span,
	.room-group h2 {
		color: rgba(246, 243, 232, 0.62);
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.topbar strong {
		display: block;
		font-size: 30px;
		line-height: 1;
	}

	.topbar button {
		padding: 0 18px;
	}

	.daybar {
		display: grid;
		grid-template-columns: 58px minmax(0, 1fr) 58px 120px;
	}

	.daybar > div {
		text-align: center;
	}

	.daybar strong {
		display: block;
		color: #86efac;
		font-size: 24px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.daybar small {
		color: rgba(246, 243, 232, 0.58);
		font-weight: 800;
	}

	.control-layout {
		display: grid;
		grid-template-columns: minmax(250px, 28vw) minmax(0, 1fr);
		gap: 14px;
		min-height: 0;
		padding: 14px;
	}

	.planner-view {
		display: grid;
		align-content: start;
		gap: 16px;
		min-height: 0;
		overflow: auto;
		padding: 14px;
	}

	.planner-section {
		display: grid;
		gap: 10px;
	}

	.planner-section h2 {
		margin: 0;
		color: rgba(246, 243, 232, 0.66);
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.planner-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.planner-card {
		display: grid;
		gap: 10px;
		min-height: 156px;
		padding: 14px;
		border: 1px solid rgba(246, 243, 232, 0.16);
		text-align: left;
		background: rgba(246, 243, 232, 0.055);
	}

	.planner-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.planner-card-head strong {
		font-size: clamp(22px, 3vw, 34px);
		line-height: 1;
	}

	.planner-card-head span {
		flex: 0 0 auto;
		padding: 5px 8px;
		border: 1px solid rgba(148, 163, 184, 0.3);
		background: rgba(148, 163, 184, 0.1);
		color: rgba(246, 243, 232, 0.72);
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.planner-card-head span.open {
		border-color: rgba(34, 197, 94, 0.36);
		background: rgba(34, 197, 94, 0.14);
		color: #bbf7d0;
	}

	.planner-card p {
		margin: 0;
		color: rgba(246, 243, 232, 0.72);
		font-size: 20px;
		font-weight: 850;
		line-height: 1.12;
	}

	.planner-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: auto;
	}

	.planner-meta span,
	.planner-meta button {
		padding: 4px 8px;
		border: 1px solid rgba(246, 243, 232, 0.12);
		background: rgba(4, 10, 18, 0.3);
		color: rgba(246, 243, 232, 0.68);
		font-size: 13px;
		font-weight: 850;
	}

	.planner-meta button {
		min-height: 42px;
		color: #f6f3e8;
	}

	.planner-time-editor {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 4px;
		padding: 12px;
		border: 1px solid rgba(125, 211, 252, 0.24);
		background: rgba(125, 211, 252, 0.08);
	}

	.planner-time-editor label {
		gap: 6px;
	}

	.planner-time-editor input {
		min-height: 56px;
	}

	.planner-time-editor button {
		min-height: 54px;
	}

	.planner-time-editor .save-time {
		border-color: rgba(134, 239, 172, 0.42);
		background: rgba(34, 197, 94, 0.16);
	}

	.edit-room-button {
		justify-self: start;
		min-height: 44px;
		padding: 0 12px;
		color: rgba(246, 243, 232, 0.78);
		font-size: 13px;
	}

	.room-list,
	.editor {
		min-height: 0;
		overflow: auto;
	}

	.room-list {
		display: grid;
		align-content: start;
		gap: 14px;
		padding-right: 4px;
	}

	.room-group {
		display: grid;
		gap: 8px;
	}

	.room-group h2 {
		margin: 0;
	}

	.room-group button {
		display: grid;
		gap: 4px;
		padding: 12px;
		text-align: left;
	}

	.room-group button.active {
		border-color: rgba(125, 211, 252, 0.68);
		background: rgba(125, 211, 252, 0.14);
	}

	.room-group strong {
		font-size: 19px;
		line-height: 1.05;
	}

	.room-group span {
		color: rgba(246, 243, 232, 0.58);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.editor {
		display: grid;
		align-content: start;
		gap: 14px;
		padding-bottom: 96px;
	}

	.panel {
		display: grid;
		gap: 14px;
		padding: 18px;
		border: 1px solid rgba(246, 243, 232, 0.14);
		background: rgba(246, 243, 232, 0.055);
	}

	.hero-panel {
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
	}

	.hero-panel span {
		color: rgba(246, 243, 232, 0.62);
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.hero-panel h1 {
		margin: 4px 0 0;
		font-size: clamp(34px, 5vw, 58px);
		line-height: 0.95;
	}

	.status-actions {
		display: flex;
		gap: 10px;
	}

	.status-actions button {
		min-width: 120px;
	}

	.status-actions .open {
		border-color: rgba(34, 197, 94, 0.42);
		background: rgba(34, 197, 94, 0.16);
	}

	.status-actions .close {
		border-color: rgba(248, 113, 113, 0.42);
		background: rgba(127, 29, 29, 0.2);
	}

	.panel h2 {
		margin: 0;
		color: #f6f3e8;
		font-size: 17px;
	}

	label {
		display: grid;
		gap: 8px;
	}

	input,
	textarea {
		width: 100%;
		min-height: 54px;
		border: 1px solid rgba(246, 243, 232, 0.2);
		background: rgba(4, 10, 18, 0.54);
		color: #f6f3e8;
		padding: 12px 14px;
		font-weight: 800;
	}

	textarea {
		resize: vertical;
		line-height: 1.25;
	}

	.time-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.image-workbench {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 220px;
		gap: 14px;
		align-items: stretch;
	}

	.image-preview-stage {
		display: grid;
		align-content: center;
		justify-items: center;
		gap: 10px;
		min-width: 0;
		padding: 14px;
		overflow: hidden;
		border: 1px solid rgba(246, 243, 232, 0.12);
		background: rgba(4, 10, 18, 0.28);
	}

	.preview-scale-note {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		color: rgba(246, 243, 232, 0.6);
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.preview-scale-note strong {
		color: rgba(246, 243, 232, 0.82);
		text-align: right;
	}

	.image-card-preview {
		position: relative;
		display: flex;
		width: min(100%, 720px);
		min-height: 0;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid rgba(246, 243, 232, 0.2);
		background:
			linear-gradient(135deg, rgba(14, 24, 34, 0.95), rgba(15, 23, 42, 0.82)),
			rgba(4, 10, 18, 0.62);
		padding: 18px;
		aspect-ratio: 1.72 / 1;
		cursor: grab;
		touch-action: none;
	}

	.image-card-preview.one {
		width: min(100%, 760px);
		aspect-ratio: 16 / 9;
	}

	.image-card-preview.two {
		width: min(78%, 520px);
		aspect-ratio: 0.86 / 1;
	}

	.image-card-preview.three {
		width: min(52%, 360px);
		aspect-ratio: 0.56 / 1;
	}

	.image-card-preview.four {
		width: min(100%, 720px);
		aspect-ratio: 1.72 / 1;
	}

	.image-card-preview::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		z-index: 3;
		width: 7px;
		background: #94a3b8;
	}

	.image-card-preview:active {
		cursor: grabbing;
	}

	.preview-image-free {
		position: absolute;
		z-index: 1;
		left: calc(var(--image-x) * 1%);
		top: calc(var(--image-y) * 1%);
		width: calc(var(--image-width) * 1%);
		margin: 0;
		overflow: hidden;
		border: 1px solid rgba(246, 243, 232, 0.26);
		background: rgba(4, 10, 18, 0.56);
		aspect-ratio: 16 / 10;
		box-shadow: 0 14px 38px rgba(0, 0, 0, 0.26);
		pointer-events: none;
		transform: translate(-50%, -50%) scale(var(--image-zoom)) rotate(var(--image-rotation));
		transform-origin: center;
	}

	.preview-image-free img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: contain;
	}

	.preview-status,
	.preview-copy,
	.image-card-preview footer,
	.no-image-note {
		position: relative;
		z-index: 2;
	}

	.preview-status {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 8px;
		padding: 5px 9px;
		border: 1px solid rgba(148, 163, 184, 0.24);
		background: rgba(148, 163, 184, 0.1);
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.preview-status span {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: #94a3b8;
	}

	.preview-copy h3 {
		margin: 16px 0 0;
		font-size: clamp(30px, 5vw, 58px);
		line-height: 0.98;
	}

	.image-card-preview.two .preview-copy h3,
	.image-card-preview.three .preview-copy h3 {
		font-size: clamp(28px, 4.6vw, 46px);
	}

	.preview-copy p {
		margin: 10px 0 0;
		max-width: 24ch;
		color: rgba(246, 243, 232, 0.72);
		font-size: clamp(21px, 2.4vw, 30px);
		font-weight: 850;
		line-height: 1.08;
	}

	.image-card-preview.two .preview-copy p,
	.image-card-preview.three .preview-copy p {
		max-width: 15ch;
		font-size: clamp(18px, 2.2vw, 24px);
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	.image-card-preview footer {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: auto;
		padding-top: 32px;
		font-size: 18px;
		font-weight: 900;
	}

	.image-card-preview.two footer,
	.image-card-preview.three footer {
		flex-wrap: wrap;
		font-size: 16px;
	}

	.no-image-note {
		margin: auto;
		color: rgba(246, 243, 232, 0.58);
		font-weight: 900;
	}

	.image-help {
		margin: -4px 0 0;
		color: rgba(246, 243, 232, 0.58);
		font-weight: 800;
	}

	.image-actions {
		display: grid;
		gap: 10px;
		align-content: start;
	}

	.file-button {
		position: relative;
		display: grid;
		min-height: 72px;
		place-items: center;
		border: 1px solid rgba(125, 211, 252, 0.38);
		background: rgba(125, 211, 252, 0.12);
		cursor: pointer;
	}

	.file-button input {
		position: absolute;
		inset: 0;
		opacity: 0;
	}

	.file-button span {
		color: #f6f3e8;
		font-size: 16px;
	}

	.size-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.legacy-size-row {
		opacity: 0.72;
	}

	.size-row button.active {
		border-color: rgba(134, 239, 172, 0.52);
		background: rgba(34, 197, 94, 0.16);
	}

	.slider-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.slider-grid label {
		grid-template-columns: 64px minmax(0, 1fr) 70px;
		align-items: center;
	}

	.slider-grid input {
		min-height: 44px;
		padding: 0;
		accent-color: #86efac;
	}

	.slider-grid strong {
		text-align: right;
	}

	.savebar {
		position: fixed;
		right: 14px;
		bottom: 14px;
		left: calc(28vw + 28px);
		display: grid;
		grid-template-columns: minmax(0, 1fr) 180px;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 1px solid rgba(246, 243, 232, 0.16);
		background: rgba(5, 12, 19, 0.92);
		box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.34);
	}

	.savebar span {
		min-width: 0;
		color: rgba(246, 243, 232, 0.72);
		font-weight: 800;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.savebar button {
		border-color: rgba(125, 211, 252, 0.48);
		background: rgba(37, 99, 235, 0.42);
	}

	.empty {
		display: grid;
		place-content: center;
		text-align: center;
	}

	.empty strong {
		font-size: 42px;
	}

	.empty span {
		color: rgba(246, 243, 232, 0.62);
		font-size: 20px;
	}

	@media (orientation: landscape) and (max-width: 1180px) {
		.topbar,
		.daybar {
			padding: 10px 12px;
		}

		.control-layout {
			grid-template-columns: 230px minmax(0, 1fr);
			gap: 10px;
			padding: 10px;
		}

		.hero-panel h1 {
			font-size: 34px;
		}

		.panel {
			padding: 14px;
		}

		.image-workbench {
			grid-template-columns: minmax(0, 1fr) 180px;
		}

		.image-preview-stage {
			padding: 10px;
		}

		.image-card-preview.three {
			width: min(60%, 330px);
		}

		.savebar {
			left: 250px;
			right: 10px;
			bottom: 10px;
		}
	}

	@media (max-width: 760px) {
		.control-shell {
			overflow-y: auto;
		}

		.control-layout,
		.image-workbench,
		.planner-grid,
		.slider-grid,
		.time-grid,
		.hero-panel {
			grid-template-columns: 1fr;
		}

		.savebar {
			position: sticky;
			left: auto;
			right: auto;
			bottom: 0;
			grid-template-columns: 1fr;
		}
	}
</style>
