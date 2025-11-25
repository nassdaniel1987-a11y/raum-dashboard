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
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border-radius: 20px;
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px 28px;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		color: white;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.close-btn {
		background: rgba(239, 68, 68, 0.2);
		border: 2px solid rgba(239, 68, 68, 0.4);
		color: white;
		font-size: 24px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.4);
		transform: scale(1.1);
	}

	.modal-content {
		padding: 24px 28px;
		overflow-y: auto;
		flex-grow: 1;
	}

	.help-section {
		margin-bottom: 32px;
	}

	.help-section:last-child {
		margin-bottom: 0;
	}

	.help-section h3 {
		margin: 0 0 16px 0;
		font-size: 20px;
		font-weight: 700;
		color: #60a5fa;
		display: flex;
		align-items: center;
		gap: 8px;
		padding-bottom: 8px;
		border-bottom: 2px solid rgba(96, 165, 250, 0.3);
	}

	.help-section.highlight {
		background: rgba(96, 165, 250, 0.1);
		padding: 20px;
		border-radius: 12px;
		border: 2px solid rgba(96, 165, 250, 0.3);
	}

	.help-section.highlight h3 {
		color: #fbbf24;
		border-bottom-color: rgba(251, 191, 36, 0.3);
	}

	.help-item {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 16px;
		padding: 14px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.2s;
	}

	.help-item:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(4px);
	}

	.help-item:last-child {
		margin-bottom: 0;
	}

	.help-icon {
		font-size: 32px;
		flex-shrink: 0;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.help-text {
		flex: 1;
	}

	.help-text strong {
		display: block;
		font-size: 16px;
		font-weight: 700;
		color: white;
		margin-bottom: 6px;
	}

	.help-text p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.8);
	}

	.tips-list {
		margin: 0;
		padding-left: 20px;
	}

	.tips-list li {
		font-size: 15px;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 8px;
	}

	.tips-list li:last-child {
		margin-bottom: 0;
	}

	.modal-footer {
		padding: 20px 28px;
		border-top: 2px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.version-info {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
	}

	.primary-btn {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: none;
		color: white;
		font-size: 16px;
		font-weight: 700;
		padding: 14px 40px;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.primary-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
	}

	.primary-btn:active {
		transform: translateY(0);
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
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}

		.modal-header {
			padding: 20px;
		}

		.modal-header h2 {
			font-size: 22px;
		}

		.modal-content {
			padding: 20px;
		}

		.help-section h3 {
			font-size: 18px;
		}

		.help-item {
			flex-direction: column;
			gap: 10px;
		}

		.help-icon {
			font-size: 28px;
		}

		.help-text strong {
			font-size: 15px;
		}

		.help-text p {
			font-size: 13px;
		}

		.modal-footer {
			flex-direction: column;
			gap: 12px;
		}

		.version-info {
			font-size: 12px;
		}
	}
</style>
