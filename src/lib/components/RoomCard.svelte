<script lang="ts">
	import { fly, scale, fade } from 'svelte/transition';
	import { isEditMode, toggleRoomStatus, swapSelection, viewWeekday, deleteRoomConfigForDay, currentTime } from '$lib/stores/appState';
	import { confirmDialog, toasts } from '$lib/stores/toastStore';
	import type { RoomWithConfig } from '$lib/types';
	import { get } from 'svelte/store';

	// Svelte 5 Props Syntax
	let { room, onEdit, onSelect, isSelected = false } = $props<{
		room: RoomWithConfig;
		onEdit: (room: RoomWithConfig) => void;
		onSelect: (roomId: string) => void;
		isSelected?: boolean;
	}>();

	const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

	// ✅ Long-press und Double-click Logic
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let lastClickTime = 0;
	let isLongPressing = $state(false);

	function handlePressStart(e: MouseEvent | TouchEvent) {
		// Im Edit-Mode kein Long-press (dort sind Buttons)
		if ($isEditMode) return;

		isLongPressing = true;

		// Long-press Timer starten (500ms)
		longPressTimer = setTimeout(() => {
			isLongPressing = false;
			// Vibrieren auf mobilen Geräten
			if (navigator.vibrate) navigator.vibrate(50);
			onEdit(room);
		}, 500);
	}

	function handlePressEnd(e: MouseEvent | TouchEvent) {
		isLongPressing = false;

		// Timer stoppen falls er läuft
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	async function handleClick() {
		if ($isEditMode) {
			// Edit-Mode: Normaler Click togglet Status
			await toggleRoomStatus(room.id);
		} else {
			// Normal-Mode: Double-click zum Togglen
			const now = Date.now();
			const timeSinceLastClick = now - lastClickTime;
			lastClickTime = now;

			if (timeSinceLastClick < 300) {
				// Double-click erkannt!
				await toggleRoomStatus(room.id);
				toasts.show(room.isOpen ? '🔴 Geschlossen' : '🟢 Geöffnet', 'success');
			}
		}
	}

	async function handleDelete(e: MouseEvent) {
		e.stopPropagation();

		const currentDay = get(viewWeekday);
		const dayName = weekdayNames[currentDay];

		const confirmed = await confirmDialog.ask({
			title: 'Raum für diesen Tag löschen?',
			message: `Möchtest du "${room.name}" für ${dayName} löschen?\n\nDer Raum bleibt an anderen Tagen erhalten.`,
			confirmText: 'Löschen',
			cancelText: 'Abbrechen',
			type: 'danger'
		});

		if (!confirmed) return;

		try {
			await deleteRoomConfigForDay(room.id, currentDay);
			toasts.show(`✓ Raum für ${dayName} gelöscht`, 'success');
		} catch (error) {
			console.error('Error deleting room config:', error);
			toasts.show('✕ Fehler beim Löschen', 'error');
		}
	}

	// ✅ NEU: Status-Berechnung für Indikatoren
	function parseTime(timeStr: string | null | undefined): number | null {
		if (!timeStr) return null;
		// ✅ FIX: Unterstütze sowohl "HH:MM" als auch "HH:MM:SS" (PostgreSQL time format)
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours * 60 + minutes;
	}

	let roomStatus = $derived(() => {
		if (!room.config?.open_time) return 'closed';

		const now = $currentTime;
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		const openTime = parseTime(room.config.open_time);
		const closeTime = parseTime(room.config.close_time);

		if (openTime === null) return 'closed';

		const minutesUntilOpen = openTime - nowMinutes;
		const minutesSinceOpen = nowMinutes - openTime;

		// Bald offen (5 Min vorher)
		if (minutesUntilOpen > 0 && minutesUntilOpen <= 5) {
			return 'opening-soon';
		}

		// Gerade geöffnet (5 Min nachher)
		if (room.isOpen && minutesSinceOpen >= 0 && minutesSinceOpen <= 5) {
			return 'just-opened';
		}

		// Schließt bald (5 Min vor Schluss)
		if (closeTime && room.isOpen) {
			const minutesUntilClose = closeTime - nowMinutes;
			if (minutesUntilClose > 0 && minutesUntilClose <= 5) {
				return 'closing-soon';
			}
		}

		return room.isOpen ? 'open' : 'closed';
	});

	// SVELTE 5 DERIVED SYNTAX
	let roomStyle = $derived(`
		background: ${room.isOpen ? room.background_color : '#6b7280'};
		filter: ${room.isOpen ? 'brightness(1) saturate(1)' : 'grayscale(40%) brightness(0.8)'};
	`);
	let displayTime = $derived(room.config?.open_time ? room.config.open_time.substring(0, 5) : '');

	// ✅ Prüfe ob open_time noch in der Zukunft liegt (mit Grace Period)
	let shouldShowOpenTime = $derived(() => {
		if (!room.config?.open_time || room.isOpen) return false;

		const now = $currentTime;
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		const openTime = parseTime(room.config.open_time);

		if (openTime === null) return false;

		// Zeige Banner wenn Zeit noch nicht erreicht wurde ODER
		// innerhalb der ersten 30 Sekunden nach open_time (Grace Period für AutoService)
		const timeDiff = nowMinutes - openTime;
		return timeDiff < 0.5; // < 0.5 Minuten = < 30 Sekunden nach open_time
	});

	// ✅ Schriftgrößen und Textfarbe
	let titleFontSize = $derived(room.config?.title_font_size);
	let textFontSize = $derived(room.config?.text_font_size);
	let textColor = $derived(room.config?.text_color || '#FFFFFF');
</script>

<div
	class="room-card"
	class:locked={!$isEditMode}
	class:status-opening-soon={roomStatus() === 'opening-soon'}
	class:status-just-opened={roomStatus() === 'just-opened'}
	class:status-closing-soon={roomStatus() === 'closing-soon'}
	class:open={room.isOpen}
	class:selected={isSelected}
	style={roomStyle}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	in:scale={{ duration: 300, start: 0.8 }}
	out:fade={{ duration: 200 }}
	role="button"
	tabindex="0"
>
	{#if room.image_url}
		<img src={room.image_url} alt={room.name} class="card-bg-image" />
	{/if}

	<!-- ✅ Button-Container rechts oben im Edit-Modus -->
	{#if $isEditMode}
		<div class="button-container">
			<button
				class="icon-button select-button"
				class:selected={isSelected}
				title="Für Tausch auswählen"
				onclick={(e) => { e.stopPropagation(); onSelect(room.id); }}
			>
				{isSelected ? '✓' : '⇄'}
			</button>

			<button 
				class="icon-button edit-button" 
				title="Bearbeiten" 
				onclick={(e) => { e.stopPropagation(); onEdit(room); }}
			>
				✏️
			</button>

			<button 
				class="icon-button delete-button" 
				title="Löschen" 
				onclick={handleDelete}
			>
				🗑️
			</button>
		</div>
	{/if}

	<!-- ✅ GESCHLOSSEN Badge (nur wenn KEINE Zeit ODER Zeit bereits vorbei) -->
	{#if !room.isOpen && !shouldShowOpenTime()}
		<div class="status-badge closed-badge" in:scale={{ duration: 300 }}>
			<div class="badge-chain"></div>
			<div class="badge-content">
				GESCHLOSSEN
			</div>
		</div>
	{/if}

	<!-- ✅ ÖFFNET UM Badge (nur wenn Zeit noch in der Zukunft liegt) -->
	{#if shouldShowOpenTime() && !room.isOpen}
		<div class="status-badge opens-badge" in:scale={{ duration: 300 }}>
			<div class="badge-chain"></div>
			<div class="badge-content">
				Öffnet um {displayTime}
			</div>
		</div>
	{/if}

	<div
		class="card-content"
		class:long-pressing={isLongPressing}
		onclick={handleClick}
		onmousedown={handlePressStart}
		onmouseup={handlePressEnd}
		onmouseleave={handlePressEnd}
		ontouchstart={handlePressStart}
		ontouchend={handlePressEnd}
		ontouchcancel={handlePressEnd}
	>
		<h3 class="room-title" style="font-size: {titleFontSize}px; color: {textColor};">{room.name}</h3>

		{#if room.config?.activity}
			<p class="room-activity" style="font-size: {textFontSize}px; color: {textColor};">{room.config.activity}</p>
		{/if}
	</div>

	<!-- ✅ Personen-Indikator - Hängendes Schild unten (immer sichtbar wenn Person gesetzt) -->
	{#if room.person}
		<div class="person-badge" title="Person: {room.person}">
			<div class="badge-chain"></div>
			<div class="badge-content">
				<span class="person-icon">👤</span>
				<span class="person-name">{room.person}</span>
			</div>
		</div>
	{/if}

</div>

<style>
	.room-card {
		position: relative;
		border-radius: 20px; /* ✅ Noch runder für moderneren Look */
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 2px 16px rgba(0, 0, 0, 0.2),
			inset 0 2px 4px rgba(255, 255, 255, 0.1);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* ✅ Smooth cubic-bezier */
		overflow: visible; /* ✅ Erlaubt Badge außerhalb der Kachel */
		/* ✅ GLASSMORPHISM: Verstärkt */
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		background: rgba(255, 255, 255, 0.1); /* ✅ Basis-Glass-Layer */
		height: 100%;
		min-height: 80px; /* ✅ Niedriger für kompaktere Kacheln */
		display: flex;
		flex-direction: column;
		border: 2px solid rgba(255, 255, 255, 0.2);
		/* GPU-Beschleunigung + TV-Skalierung */
		transform: scaleX(var(--card-scale-x, 1)) translateZ(0);
		will-change: transform, box-shadow;
	}

	/* ✅ Glassmorphism: Gradient-Overlay für Tiefe */
	.room-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.15) 0%,
			rgba(255, 255, 255, 0.05) 50%,
			rgba(0, 0, 0, 0.15) 100%
		);
		pointer-events: none;
		z-index: 1;
		opacity: 0.8;
	}

	/* ✅ Status-Indikator: Pulsierender Ring */
	.room-card::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 20px;
		pointer-events: none;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.room-card.selected {
		border-color: #f59e0b;
		box-shadow:
			0 0 30px rgba(245, 158, 11, 0.8),
			0 8px 24px rgba(0, 0, 0, 0.4),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.room-card:hover {
		transform: translateY(-6px) scale(1.02) translateZ(0); /* ✅ Micro-lift + scale */
		box-shadow:
			0 16px 40px rgba(0, 0, 0, 0.5),
			0 8px 16px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.room-card:active {
		transform: translateY(-2px) scale(0.98) translateZ(0); /* ✅ Press-down effect */
		transition: all 0.1s;
	}

	/* ✅ STATUS-INDIKATOREN: Bald offen (Gelb pulsierend) */
	.room-card.status-opening-soon::after {
		opacity: 1;
		border: 4px solid #ffd700; /* ✅ Helleres, leuchtenderes Goldgelb */
		box-shadow:
			0 0 30px rgba(255, 215, 0, 0.9), /* ✅ Stärkerer Außen-Glow */
			0 0 15px rgba(255, 215, 0, 0.7),
			inset 0 0 25px rgba(255, 215, 0, 0.4); /* ✅ Stärkerer Innen-Glow */
		animation: pulse-yellow 1.5s ease-in-out infinite; /* ✅ Etwas schneller */
	}

	@keyframes pulse-yellow {
		0%, 100% {
			opacity: 1;
			border-width: 4px;
			box-shadow:
				0 0 30px rgba(255, 215, 0, 0.9),
				0 0 15px rgba(255, 215, 0, 0.7),
				inset 0 0 25px rgba(255, 215, 0, 0.4);
		}
		50% {
			opacity: 1;
			border-width: 5px; /* ✅ Dickerer Border beim Puls */
			box-shadow:
				0 0 50px rgba(255, 215, 0, 1), /* ✅ Maximaler Glow */
				0 0 25px rgba(255, 215, 0, 0.9),
				inset 0 0 35px rgba(255, 215, 0, 0.6);
		}
	}

	/* ✅ STATUS-INDIKATOREN: Gerade geöffnet (Grün mit Glow) */
	.room-card.status-just-opened::after {
		opacity: 1;
		border: 3px solid #22c55e;
		box-shadow:
			0 0 30px rgba(34, 197, 94, 0.8),
			inset 0 0 20px rgba(34, 197, 94, 0.3);
		animation: glow-green 1.5s ease-in-out 3; /* ✅ 3x dann stop */
	}

	@keyframes glow-green {
		0%, 100% {
			opacity: 1;
			box-shadow:
				0 0 30px rgba(34, 197, 94, 0.8),
				inset 0 0 20px rgba(34, 197, 94, 0.3);
		}
		50% {
			opacity: 1;
			box-shadow:
				0 0 50px rgba(34, 197, 94, 1),
				inset 0 0 30px rgba(34, 197, 94, 0.5);
		}
	}

	/* ✅ STATUS-INDIKATOREN: Schließt bald (Orange blinkend) */
	.room-card.status-closing-soon::after {
		opacity: 1;
		border: 3px solid #f97316;
		box-shadow:
			0 0 25px rgba(249, 115, 22, 0.7),
			inset 0 0 20px rgba(249, 115, 22, 0.3);
		animation: pulse-orange 1.5s ease-in-out infinite;
	}

	@keyframes pulse-orange {
		0%, 100% {
			opacity: 1;
			box-shadow:
				0 0 25px rgba(249, 115, 22, 0.7),
				inset 0 0 20px rgba(249, 115, 22, 0.3);
		}
		50% {
			opacity: 0.6;
			box-shadow:
				0 0 40px rgba(249, 115, 22, 0.9),
				inset 0 0 30px rgba(249, 115, 22, 0.4);
		}
	}

	.card-bg-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.2;
		z-index: 0;
		border-radius: 20px; /* ✅ Hält das Bild innerhalb der Kachel */
	}

	/* ✅ Personen-Badge - Hängendes Schild unten links */
	.person-badge {
		position: absolute;
		bottom: -20px; /* Hängt unter der Kachel */
		left: 30%; /* Leicht links von der Mitte */
		transform: translateX(-50%);
		z-index: 15; /* Über allen anderen Elementen */
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: badge-swing 3s ease-in-out infinite;
	}

	/* ✅ Status-Badge - Hängendes Schild unten rechts */
	.status-badge {
		position: absolute;
		bottom: -20px; /* Hängt unter der Kachel */
		left: 70%; /* Leicht rechts von der Mitte */
		transform: translateX(-50%);
		z-index: 15;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: badge-swing 3.5s ease-in-out infinite; /* Leicht versetzt animiert */
	}

	/* Kleine "Kette" oder Verbindung oben */
	.badge-chain {
		width: 2px;
		height: 8px;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.5),
			rgba(255, 255, 255, 0.2)
		);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	/* Das eigentliche Badge - Standard (Personen-Badge) */
	.badge-content {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		background: linear-gradient(
			135deg,
			rgba(59, 130, 246, 0.98) 0%,
			rgba(37, 99, 235, 0.98) 100%
		);
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-radius: 8px;
		font-size: 12px;
		font-weight: 700;
		color: white;
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.5),
			0 2px 8px rgba(59, 130, 246, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(8px);
		transition: all 0.3s;
		white-space: nowrap;
	}

	/* Status Badge - GESCHLOSSEN (Rot) */
	.closed-badge .badge-content {
		background: linear-gradient(
			135deg,
			rgba(220, 38, 38, 0.98) 0%,
			rgba(239, 68, 68, 0.98) 100%
		);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.5),
			0 2px 8px rgba(220, 38, 38, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
		letter-spacing: 1.2px;
		font-size: 11px;
	}

	/* Status Badge - ÖFFNET UM (Blau) */
	.opens-badge .badge-content {
		background: linear-gradient(
			135deg,
			rgba(37, 99, 235, 0.98) 0%,
			rgba(59, 130, 246, 0.98) 100%
		);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.5),
			0 2px 8px rgba(37, 99, 235, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		font-size: 11px;
	}

	.person-badge:hover .badge-content,
	.status-badge:hover .badge-content {
		transform: scale(1.08);
		box-shadow:
			0 8px 20px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(59, 130, 246, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.closed-badge:hover .badge-content {
		box-shadow:
			0 8px 20px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(220, 38, 38, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	/* Sanftes Schwingen des Badges */
	@keyframes badge-swing {
		0%, 100% {
			transform: translateX(-50%) rotate(0deg);
		}
		25% {
			transform: translateX(-50%) rotate(-2deg);
		}
		75% {
			transform: translateX(-50%) rotate(2deg);
		}
	}

	.person-icon {
		font-size: 15px;
		line-height: 1;
	}

	.person-name {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
	}

	/* ✅ Button Container - kompakter */
	.button-container {
		position: absolute;
		top: 6px; /* ✅ Reduziert von 8px */
		right: 6px;
		z-index: 10;
		display: flex;
		gap: 4px; /* ✅ Reduziert von 6px */
	}

	.icon-button {
		padding: 5px 8px; /* ✅ Reduziert von 6px 10px */
		background: rgba(0, 0, 0, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px; /* ✅ Reduziert von 8px */
		font-size: 14px; /* ✅ Reduziert von 16px */
		cursor: pointer;
		transition: all 0.2s;
		color: white;
		font-weight: bold;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px; /* ✅ Reduziert von 36px */
		min-height: 32px;
		/* Touch-optimiert */
		touch-action: manipulation;
	}

	.icon-button:hover {
		background: rgba(0, 0, 0, 1);
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.icon-button:active {
		transform: scale(0.95);
	}

	.select-button {
		background: rgba(59, 130, 246, 0.8);
		border-color: rgba(59, 130, 246, 0.5);
	}
	.select-button:hover {
		background: rgba(59, 130, 246, 1);
		border-color: rgba(59, 130, 246, 0.8);
	}
	.select-button.selected {
		background: rgba(245, 158, 11, 0.9);
		border-color: rgba(245, 158, 11, 0.8);
	}

	.edit-button {
		background: rgba(34, 197, 94, 0.8);
		border-color: rgba(34, 197, 94, 0.5);
	}
	.edit-button:hover {
		background: rgba(34, 197, 94, 1);
		border-color: rgba(34, 197, 94, 0.8);
	}

	.delete-button {
		background: rgba(239, 68, 68, 0.8);
		border-color: rgba(239, 68, 68, 0.5);
	}
	.delete-button:hover {
		background: rgba(239, 68, 68, 1);
		border-color: rgba(239, 68, 68, 0.8);
	}

	.card-content {
		position: relative;
		z-index: 2; /* ✅ Über dem Gradient-Overlay */
		padding: 8px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		color: white;
		text-shadow:
			2px 2px 6px rgba(0, 0, 0, 0.9), /* ✅ Stärkerer Schatten für TV-Lesbarkeit */
			0 0 8px rgba(0, 0, 0, 0.7);
		text-align: center;
		cursor: pointer;
		flex-grow: 1;
		transition: transform 0.1s, filter 0.1s;
	}

	/* ✅ Long-press visuelles Feedback */
	.card-content.long-pressing {
		transform: scale(0.95);
		filter: brightness(1.2);
	}

	.room-title {
		margin: 0 0 4px 0; /* ✅ Reduziert von 6px */
		font-weight: 700;
		letter-spacing: 0.3px;
		line-height: 1.2;
		width: 100%;
		padding-top: 2px;
		flex-shrink: 0;
		/* Verhindert Overflow */
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.room-activity {
		margin: auto 0;
		font-weight: 600;
		opacity: 1;
		width: 100%;
		padding: 4px 3px; /* ✅ Reduziert von 6px 4px */
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
		line-height: 1.2; /* ✅ Reduziert von 1.3 */
		/* Verhindert Overflow */
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	/* ✅ Große Displays: Noch kleinere Kacheln */
	@media (min-width: 1600px) {
		.room-card {
			min-height: 90px;
		}
		
		.icon-button {
			min-width: 30px;
			min-height: 30px;
			padding: 4px 7px;
			font-size: 13px;
		}
	}

	@media (max-width: 768px) {
		.room-card {
			min-height: 100px;
		}

		.icon-button {
			min-width: 30px;
			min-height: 30px;
			padding: 4px 7px;
			font-size: 13px;
		}
	}
</style>