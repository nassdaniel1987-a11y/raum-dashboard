<script lang="ts">
	import { scale, fade } from 'svelte/transition';

	let { onClose } = $props<{
		onClose: () => void;
	}>();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} transition:fade={{ duration: 200 }}>
	<div class="help-modal" transition:scale={{ duration: 300, start: 0.9 }}>
		<div class="modal-header">
			<h2>📖 Hilfe & Anleitung</h2>
			<button class="close-btn" onclick={onClose} aria-label="Schließen">✕</button>
		</div>

		<div class="modal-content">
			<!-- Schnelle Bedienung -->
			<section class="help-section">
				<h3>⚡ Schnelle Bedienung</h3>
				<div class="help-item">
					<div class="help-icon">👆</div>
					<div class="help-text">
						<strong>Doppelklick auf Raumkachel:</strong>
						<p>Öffnet oder schließt den Raum sofort (im Normal-Modus)</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">✋</div>
					<div class="help-text">
						<strong>Lang-drücken (0,5 Sek):</strong>
						<p>Öffnet das Bearbeitungsmenü für den Raum</p>
					</div>
				</div>
			</section>

			<!-- Tagesplaner -->
			<section class="help-section">
				<h3>📅 Tagesplaner & Auto-Öffnen</h3>
				<div class="help-item">
					<div class="help-icon">🕐</div>
					<div class="help-text">
						<strong>Öffnungs- & Schließzeiten einstellen:</strong>
						<p>Im Floating-Menü → "Tagesplaner" kannst du für jeden Wochentag Öffnungs- und Schließzeiten festlegen</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">✨</div>
					<div class="help-text">
						<strong>Auto-Open Funktion:</strong>
						<p>Räume öffnen sich automatisch zur eingestellten Zeit. Das Auto-Open ist nur für die erste Minute aktiv – wenn du den Raum manuell schließt, bleibt er geschlossen.</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🔵</div>
					<div class="help-text">
						<strong>"Öffnet um" Banner:</strong>
						<p>Zeigt die geplante Öffnungszeit an. Verschwindet automatisch wenn der Raum geöffnet wird.</p>
					</div>
				</div>
			</section>

			<!-- Status-Indikatoren -->
			<section class="help-section">
				<h3>🎨 Status-Indikatoren</h3>
				<div class="help-item">
					<div class="help-icon">🟡</div>
					<div class="help-text">
						<strong>Gelber Ring (Öffnet bald):</strong>
						<p>Zeigt 5 Minuten vor der Öffnungszeit einen pulsierenden gelben Ring</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🟢</div>
					<div class="help-text">
						<strong>Grüner Ring (Gerade geöffnet):</strong>
						<p>Zeigt 5 Minuten nach dem Öffnen einen leuchtenden grünen Ring</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🟠</div>
					<div class="help-text">
						<strong>Orange Ring (Schließt bald):</strong>
						<p>Zeigt 5 Minuten vor der Schließzeit einen blinkenden orangen Ring</p>
					</div>
				</div>
			</section>

			<!-- Display-Einstellungen -->
			<section class="help-section">
				<h3>📺 Display-Einstellungen</h3>
				<div class="help-item">
					<div class="help-icon">↔️</div>
					<div class="help-text">
						<strong>Display-Breite Skalierung:</strong>
						<p>Im Floating-Menü → "Ansicht" → "Display-Breite": Für TVs mit iPad (4:3 → 16:9) empfohlen ~75%. Kompensiert die Streckung durch das Seitenverhältnis.</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">⛶</div>
					<div class="help-text">
						<strong>Vollbild-Modus:</strong>
						<p>Button oben rechts im Header aktiviert den Vollbild-Modus (ESC zum Verlassen)</p>
					</div>
				</div>
			</section>

			<!-- Bearbeitungsmodus -->
			<section class="help-section">
				<h3>✏️ Bearbeitungsmodus</h3>
				<div class="help-item">
					<div class="help-icon">🔧</div>
					<div class="help-text">
						<strong>Aktivieren:</strong>
						<p>Floating-Menü öffnen → "Edit-Modus aktivieren"</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🎨</div>
					<div class="help-text">
						<strong>Raum bearbeiten:</strong>
						<p>Im Edit-Modus: ✏️ Button → Farbe, Titel, Text, Aktivität, Bild, Schriftgrößen und Textfarbe anpassen</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">⇄</div>
					<div class="help-text">
						<strong>Räume tauschen:</strong>
						<p>Im Edit-Modus zwei Räume mit ⇄ Button markieren, dann öffnet sich ein Dialog zum Bestätigen des Tauschs</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🗑️</div>
					<div class="help-text">
						<strong>Raum für Tag löschen:</strong>
						<p>Im Edit-Modus: 🗑️ Button löscht die Konfiguration des Raums nur für den aktuell angezeigten Wochentag</p>
					</div>
				</div>
			</section>

			<!-- Weitere Funktionen -->
			<section class="help-section">
				<h3>🛠️ Weitere Funktionen</h3>
				<div class="help-item">
					<div class="help-icon">🌙</div>
					<div class="help-text">
						<strong>Nachtmodus:</strong>
						<p>Im Floating-Menü → "Einstellungen": Automatisches Schließen aller Räume in einem definierten Zeitfenster (z.B. 22:00 - 06:00)</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🟢</div>
					<div class="help-text">
						<strong>Alle öffnen/schließen:</strong>
						<p>Im Floating-Menü → "Aktionen": Schließt oder öffnet alle Räume gleichzeitig</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">◀️▶️</div>
					<div class="help-text">
						<strong>Tag-Navigation:</strong>
						<p>Im Header: Pfeile ◀ ▶ wechseln zwischen Wochentagen. "Heute" Button kehrt zum aktuellen Tag zurück.</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">▶️</div>
					<div class="help-text">
						<strong>Auto-Scroll:</strong>
						<p>Im Header: Aktiviert automatisches Durchblättern der Etagen (konfigurierbar im Floating-Menü)</p>
					</div>
				</div>
			</section>

			<!-- Tagesangebote -->
			<section class="help-section">
				<h3>🎯 Tagesangebote</h3>
				<div class="help-item">
					<div class="help-icon">📌</div>
					<div class="help-text">
						<strong>Aktuelle Themen anzeigen:</strong>
						<p>Direkt unter dem Header werden besondere Angebote und Events des Tages angezeigt (z.B. "Basketball-Training 14:00", "Theater-AG 16:00")</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">✏️</div>
					<div class="help-text">
						<strong>Angebote bearbeiten:</strong>
						<p>Im Edit-Modus erscheint ein "Bearbeiten" Button bei den Tagesangeboten. Dort kannst du Angebote hinzufügen, ändern oder löschen</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">🎨</div>
					<div class="help-text">
						<strong>Farben & Icons:</strong>
						<p>Jedes Angebot kann mit einem Icon (🏀, 🎭, 📚 etc.) und einer Farbe (Blau, Grün, Gelb, Rot, Lila, Orange) versehen werden</p>
					</div>
				</div>
				<div class="help-item">
					<div class="help-icon">📅</div>
					<div class="help-text">
						<strong>Pro Wochentag:</strong>
						<p>Angebote werden pro Wochentag gespeichert. Wechselst du den Tag (Pfeile im Header), siehst du die Angebote für diesen Tag</p>
					</div>
				</div>
			</section>

			<!-- Tipps & Tricks -->
			<section class="help-section highlight">
				<h3>💡 Tipps & Tricks</h3>
				<ul class="tips-list">
					<li>Verwende den Tagesplaner für wiederkehrende Öffnungszeiten</li>
					<li>Status-Indikatoren helfen dir, zeitnah auf Änderungen zu reagieren</li>
					<li>Display-Breite auf 75% für optimale TV-Darstellung</li>
					<li>Nachtmodus spart Energie und schließt automatisch alle Räume</li>
					<li>Doppelklick ist die schnellste Methode zum Öffnen/Schließen</li>
					<li>Nutze Tagesangebote um besondere Events prominent zu machen</li>
				</ul>
			</section>
		</div>

		<div class="modal-footer">
			<div class="version-info">
				Version 1.1.0 • 25.11.2025
			</div>
			<button class="primary-btn" onclick={onClose}>Verstanden</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		overflow-y: auto;
	}

	.help-modal {
		background: rgba(15, 23, 42, 0.98);
		backdrop-filter: blur(20px);
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.15);
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		flex-shrink: 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		letter-spacing: 0.3px;
		color: white;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: white;
		font-size: 18px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.modal-content {
		padding: 20px;
		overflow-y: auto;
		flex-grow: 1;
	}

	.help-section {
		margin-bottom: 24px;
	}

	.help-section:last-child {
		margin-bottom: 0;
	}

	.help-section h3 {
		margin: 0 0 12px 0;
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.help-section.highlight {
		background: rgba(255, 255, 255, 0.05);
		padding: 16px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.help-section.highlight h3 {
		color: rgba(255, 255, 255, 0.9);
	}

	.help-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.help-item:last-child {
		margin-bottom: 0;
	}

	.help-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.help-text {
		flex: 1;
	}

	.help-text strong {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: white;
		margin-bottom: 4px;
	}

	.help-text p {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.7);
	}

	.tips-list {
		margin: 0;
		padding-left: 20px;
	}

	.tips-list li {
		font-size: 13px;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 6px;
	}

	.tips-list li:last-child {
		margin-bottom: 0;
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.version-info {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
	}

	.primary-btn {
		background: rgba(59, 130, 246, 0.3);
		border: 1px solid rgba(59, 130, 246, 0.5);
		color: white;
		font-size: 13px;
		font-weight: 500;
		padding: 10px 24px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-btn:hover {
		background: rgba(59, 130, 246, 0.4);
		border-color: rgba(59, 130, 246, 0.6);
	}

	/* Scrollbar Styling */
	.modal-content::-webkit-scrollbar {
		width: 8px;
	}

	.modal-content::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.modal-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.modal-content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	@media (max-width: 768px) {
		.help-modal {
			width: 95%;
			max-width: 95%;
			max-height: 95vh;
		}

		.modal-content {
			padding: 16px;
		}

		.help-item {
			flex-direction: column;
			gap: 8px;
		}

		.modal-footer {
			flex-direction: column;
			gap: 8px;
		}
	}

	@media (max-width: 480px) {
		.help-modal {
			width: 100%;
			max-width: 100%;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>
