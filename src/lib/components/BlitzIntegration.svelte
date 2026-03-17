<script lang="ts">
	import { rooms, persons } from '$lib/stores/appState';
	import {
		blitzSettings,
		blitzRoomMappings,
		blitzPersonMappings,
		blitzData,
		blitzLastError,
		blitzSyncing,
		updateBlitzSettings,
		saveRoomMappings,
		savePersonMapping,
		fetchBlitzRaeume,
		fetchBlitzPersonen,
		fetchBlitzData,
		applyBlitzPersonsToRooms
	} from '$lib/stores/blitzStore';
	import { toasts } from '$lib/stores/toastStore';
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	// State
	let blitzRaeume = $state<{ id: string; label: string }[]>([]);
	let blitzPersonen = $state<{ name: string; slug: string }[]>([]);
	let loadingRaeume = $state(false);
	let loadingPersonen = $state(false);
	let showRoomMapping = $state(false);
	let showPersonMapping = $state(false);

	// Blitz-Räume und -Personen laden
	async function loadBlitzRaeume() {
		loadingRaeume = true;
		blitzRaeume = await fetchBlitzRaeume();
		loadingRaeume = false;
		if (blitzRaeume.length === 0) {
			toasts.show('Keine Räume vom Blitz-Protokoll erhalten. Ist die API erreichbar?', 'error');
		}
	}

	async function loadBlitzPersonen() {
		loadingPersonen = true;
		blitzPersonen = await fetchBlitzPersonen();
		loadingPersonen = false;
		if (blitzPersonen.length === 0) {
			toasts.show('Keine Personen vom Blitz-Protokoll erhalten.', 'error');
		}
	}

	// Toggle Integration
	async function toggleEnabled() {
		try {
			await updateBlitzSettings({ enabled: !$blitzSettings?.enabled });
			toasts.show($blitzSettings?.enabled ? 'Blitz-Integration aktiviert' : 'Blitz-Integration deaktiviert');
		} catch {
			toasts.show('Einstellung konnte nicht gespeichert werden', 'error');
		}
	}

	// Raum-Mapping speichern (Checkbox toggle)
	async function handleRoomToggle(blitzRoomId: string, blitzLabel: string, dashboardRoomId: string) {
		const currentMappings = $blitzRoomMappings
			.filter(m => m.blitz_room_id === blitzRoomId)
			.map(m => m.room_id);

		let newMappings: string[];
		if (currentMappings.includes(dashboardRoomId)) {
			// Entfernen
			newMappings = currentMappings.filter(id => id !== dashboardRoomId);
		} else {
			// Hinzufügen
			newMappings = [...currentMappings, dashboardRoomId];
		}

		try {
			await saveRoomMappings(blitzRoomId, blitzLabel, newMappings);
		} catch {
			toasts.show('Verknüpfung fehlgeschlagen', 'error');
		}
	}

	// Personen-Mapping speichern
	async function handlePersonMappingChange(blitzSlug: string, blitzName: string, event: Event) {
		const select = event.target as HTMLSelectElement;
		const dashboardPersonId = select.value || null;
		try {
			await savePersonMapping(blitzSlug, blitzName, dashboardPersonId);
			toasts.show(`${blitzName} verknüpft`);
		} catch {
			toasts.show('Verknüpfung fehlgeschlagen', 'error');
		}
	}

	// Manueller Sync
	async function manualSync() {
		await fetchBlitzData();
		await applyBlitzPersonsToRooms();
		if (!$blitzLastError) {
			toasts.show('Daten synchronisiert');
		} else {
			toasts.show($blitzLastError || 'Unbekannter Fehler', 'error');
		}
	}

	// Hilfsfunktion: alle gemappten Dashboard-Raum-IDs für einen Blitz-Raum
	function getRoomMappingIds(blitzRoomId: string): string[] {
		return $blitzRoomMappings
			.filter(m => m.blitz_room_id === blitzRoomId)
			.map(m => m.room_id);
	}

	// Etage als lesbaren Text
	const floorLabels: Record<string, string> = {
		'dach': 'Dach',
		'og2': '2.OG',
		'og1': '1.OG',
		'eg': 'EG',
		'essen': 'Essen',
		'ug': 'UG',
		'extern': 'Extern'
	};

	// Dashboard-Räume sortiert nach Name + Etage
	const sortedRooms = $derived(
		[...$rooms].sort((a, b) => a.name.localeCompare(b.name, 'de'))
	);

	// Hilfsfunktion: aktuelles Mapping für eine Blitz-Person finden
	function getPersonMappingValue(blitzSlug: string): string {
		const mapping = $blitzPersonMappings.find(m => m.blitz_slug === blitzSlug);
		return mapping?.person_id || '';
	}
</script>

<div class="blitz-integration">
	<!-- Aktivierung -->
	<section class="section">
		<h3>Blitz-Protokoll</h3>
		<p class="hint">Personen-Zuweisungen automatisch aus dem Blitz-Protokoll übernehmen.</p>

		<div class="toggle-item">
			<div class="toggle-label">
				<span class="label">Integration aktiv</span>
				{#if $blitzSettings?.enabled}
					<span class="status-dot active"></span>
				{:else}
					<span class="status-dot"></span>
				{/if}
			</div>
			<label class="switch">
				<input type="checkbox" checked={$blitzSettings?.enabled || false} onchange={toggleEnabled} />
				<span class="switch-slider"></span>
			</label>
		</div>

		{#if $blitzSettings?.enabled}
			<!-- Status -->
			<div class="status-bar" transition:slide={{ duration: 200 }}>
				{#if $blitzSyncing}
					<span class="status syncing">Synchronisiere...</span>
				{:else if $blitzLastError}
					<span class="status error">Fehler: {$blitzLastError}</span>
				{:else if $blitzData}
					<span class="status ok">Letzte Sync: {$blitzSettings.last_sync ? new Date($blitzSettings.last_sync).toLocaleTimeString('de-DE') : '–'}</span>
				{:else}
					<span class="status waiting">Warte auf erste Synchronisierung...</span>
				{/if}
				<button class="btn-small" onclick={manualSync} disabled={$blitzSyncing}>
					Jetzt sync
				</button>
			</div>

			{#if $blitzData}
				<div class="info-box" transition:fade={{ duration: 150 }}>
					<span>Datum: {$blitzData.datum}</span>
					<span>Anwesend: {$blitzData.anwesenheit?.length || 0}</span>
					<span>Abwesend: {$blitzData.abwesend?.length || 0}</span>
				</div>
			{/if}
		{/if}
	</section>

	{#if $blitzSettings?.enabled}
		<!-- Raum-Verknüpfung -->
		<section class="section" transition:slide={{ duration: 200 }}>
			<div class="section-header" role="button" tabindex="0" onclick={() => { showRoomMapping = !showRoomMapping; if (showRoomMapping && blitzRaeume.length === 0) loadBlitzRaeume(); }} onkeydown={(e) => e.key === 'Enter' && (showRoomMapping = !showRoomMapping)}>
				<h3>Räume verknüpfen</h3>
				<span class="chevron" class:open={showRoomMapping}>▸</span>
			</div>

			{#if showRoomMapping}
				<div class="mapping-list" transition:slide={{ duration: 200 }}>
					{#if loadingRaeume}
						<p class="hint">Lade Räume vom Blitz-Protokoll...</p>
					{:else if blitzRaeume.length === 0}
						<button class="btn full-width" onclick={loadBlitzRaeume}>
							Blitz-Räume laden
						</button>
					{:else}
						{#each blitzRaeume as raum}
							{@const mappedIds = getRoomMappingIds(raum.id)}
							<div class="mapping-block">
								<div class="mapping-header">
									<span class="mapping-label">{raum.label}</span>
									{#if mappedIds.length > 0}
										<span class="mapping-count">{mappedIds.length} Raum{mappedIds.length !== 1 ? 'e' : ''}</span>
									{:else}
										<span class="mapping-count unlinked">nicht verknüpft</span>
									{/if}
								</div>
								<div class="checkbox-list">
									{#each sortedRooms as room}
										<label class="checkbox-item">
											<input
												type="checkbox"
												checked={mappedIds.includes(room.id)}
												onchange={() => handleRoomToggle(raum.id, raum.label, room.id)}
											/>
											<span class="checkbox-text">{room.name} ({floorLabels[room.floor] || room.floor})</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Personen-Verknüpfung -->
		<section class="section" transition:slide={{ duration: 200 }}>
			<div class="section-header" role="button" tabindex="0" onclick={() => { showPersonMapping = !showPersonMapping; if (showPersonMapping && blitzPersonen.length === 0) loadBlitzPersonen(); }} onkeydown={(e) => e.key === 'Enter' && (showPersonMapping = !showPersonMapping)}>
				<h3>Personen verknüpfen</h3>
				<span class="chevron" class:open={showPersonMapping}>▸</span>
			</div>

			{#if showPersonMapping}
				<div class="mapping-list" transition:slide={{ duration: 200 }}>
					{#if loadingPersonen}
						<p class="hint">Lade Personen vom Blitz-Protokoll...</p>
					{:else if blitzPersonen.length === 0}
						<button class="btn full-width" onclick={loadBlitzPersonen}>
							Blitz-Personen laden
						</button>
					{:else}
						{#each blitzPersonen as person}
							<div class="mapping-row">
								<span class="mapping-label">{person.name}</span>
								<span class="mapping-arrow">→</span>
								<select
									class="mapping-select"
									value={getPersonMappingValue(person.slug)}
									onchange={(e) => handlePersonMappingChange(person.slug, person.name, e)}
								>
									<option value="">– Blitz-Name verwenden –</option>
									{#each $persons as p}
										<option value={p.id}>{p.name}</option>
									{/each}
								</select>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.blitz-integration {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.section {
		padding: 16px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.section:last-child {
		border-bottom: none;
	}

	h3 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.hint {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 12px 0;
	}

	.toggle-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.label {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.8);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
	}

	.status-dot.active {
		background: #4ade80;
		box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
	}

	/* Switch (gleich wie im Rest der App) */
	.switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.switch-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		transition: 0.3s;
	}

	.switch-slider::before {
		content: '';
		position: absolute;
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background: white;
		border-radius: 50%;
		transition: 0.3s;
	}

	.switch input:checked + .switch-slider {
		background: #4ade80;
	}

	.switch input:checked + .switch-slider::before {
		transform: translateX(20px);
	}

	/* Status Bar */
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		margin-top: 8px;
	}

	.status {
		font-size: 12px;
	}

	.status.syncing {
		color: #fbbf24;
	}

	.status.error {
		color: #f87171;
	}

	.status.ok {
		color: #4ade80;
	}

	.status.waiting {
		color: rgba(255, 255, 255, 0.5);
	}

	.btn-small {
		padding: 4px 10px;
		font-size: 11px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-small:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.btn-small:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Info Box */
	.info-box {
		display: flex;
		gap: 16px;
		padding: 8px 12px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		margin-top: 8px;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Section Header (klappbar) */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		user-select: none;
	}

	.section-header h3 {
		margin: 0;
	}

	.chevron {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.5);
		transition: transform 0.2s;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	/* Mapping Liste */
	.mapping-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
	}

	.mapping-block {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}

	.mapping-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.05);
	}

	.mapping-label {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.mapping-count {
		font-size: 11px;
		color: #4ade80;
	}

	.mapping-count.unlinked {
		color: rgba(255, 255, 255, 0.4);
	}

	.checkbox-list {
		max-height: 150px;
		overflow-y: auto;
		padding: 4px 0;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.checkbox-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.checkbox-item input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: #4ade80;
		cursor: pointer;
		flex-shrink: 0;
	}

	.checkbox-text {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.75);
	}

	.checkbox-list::-webkit-scrollbar {
		width: 6px;
	}

	.checkbox-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.checkbox-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
	}

	.btn {
		padding: 8px 16px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-size: 13px;
		transition: background 0.2s;
	}

	.btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.full-width {
		width: 100%;
	}
</style>
