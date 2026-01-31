<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { rooms, roomStatuses } from '$lib/stores/appState';
	import { get } from 'svelte/store';
	import lottie from 'lottie-web';
	import type { AnimationItem } from 'lottie-web';

	// Lottie Animation URLs (kostenlose Animationen von LottieFiles)
	const ANIMATIONS = {
		idle: 'https://lottie.host/4be5e4a0-3f5a-4d7f-9e3f-5c3b3e3b3e3b/cute-dino.json',
		wave: 'https://assets2.lottiefiles.com/packages/lf20_tll0j4bb.json', // Winkender Charakter
		happy: 'https://assets9.lottiefiles.com/packages/lf20_uk2lrsjn.json' // Happy Dance
	};

	// Fallback SVG Dino falls Lottie nicht lädt
	const FALLBACK_SVG = `
		<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Körper -->
			<ellipse cx="60" cy="65" rx="35" ry="28" fill="#4ade80"/>
			<!-- Bauch -->
			<ellipse cx="60" cy="70" rx="25" ry="20" fill="#86efac"/>
			<!-- Kopf -->
			<ellipse cx="60" cy="35" rx="25" ry="22" fill="#4ade80"/>
			<!-- Schnauze -->
			<ellipse cx="60" cy="42" rx="18" ry="12" fill="#86efac"/>
			<!-- Augen weiß -->
			<ellipse cx="50" cy="30" rx="8" ry="9" fill="white"/>
			<ellipse cx="70" cy="30" rx="8" ry="9" fill="white"/>
			<!-- Pupillen -->
			<circle cx="52" cy="31" r="4" fill="#1f2937"/>
			<circle cx="72" cy="31" r="4" fill="#1f2937"/>
			<!-- Glanzpunkte -->
			<circle cx="54" cy="29" r="1.5" fill="white"/>
			<circle cx="74" cy="29" r="1.5" fill="white"/>
			<!-- Lächeln -->
			<path d="M 48 48 Q 60 56 72 48" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
			<!-- Wangen -->
			<ellipse cx="40" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.6"/>
			<ellipse cx="80" cy="42" rx="5" ry="3" fill="#fca5a5" opacity="0.6"/>
			<!-- Rückenzacken -->
			<path d="M 30 25 L 38 8 L 46 25" fill="#22c55e"/>
			<path d="M 46 20 L 54 5 L 62 20" fill="#22c55e"/>
			<path d="M 62 20 L 70 5 L 78 20" fill="#22c55e"/>
			<path d="M 78 25 L 86 10 L 90 25" fill="#22c55e"/>
			<!-- Arme -->
			<ellipse cx="30" cy="60" rx="8" ry="12" fill="#4ade80" transform="rotate(-20 30 60)"/>
			<ellipse cx="90" cy="60" rx="8" ry="12" fill="#4ade80" transform="rotate(20 90 60)"/>
			<!-- Füße -->
			<ellipse cx="45" cy="92" rx="12" ry="6" fill="#4ade80"/>
			<ellipse cx="75" cy="92" rx="12" ry="6" fill="#4ade80"/>
			<!-- Schwanz -->
			<path d="M 95 70 Q 115 65 110 80 Q 105 90 95 85" fill="#4ade80"/>
		</svg>
	`;

	// State
	let container: HTMLDivElement;
	let animation: AnimationItem | null = null;
	let showBubble = $state(false);
	let bubbleText = $state('');
	let isWaving = $state(false);
	let useFallback = $state(false);

	// Nachrichten die Rudi sagen kann
	const messages = [
		'Hallo! Ich bin Rudi! 🦕',
		'Welcher Raum öffnet gleich? 🤔',
		'Schau mal was heute los ist! ✨',
		'Klick auf einen Raum für mehr Infos!',
		'Viel Spaß beim Entdecken! 🎉',
		'Heute wird ein toller Tag! ☀️'
	];

	// Dynamische Nachrichten basierend auf offenen Räumen
	function getDynamicMessage(): string {
		const allRooms = get(rooms);
		const statuses = get(roomStatuses);
		const openRooms = allRooms.filter(r => statuses.get(r.id)?.is_open);

		if (openRooms.length === 0) {
			return 'Noch sind alle Räume zu... 😴';
		} else if (openRooms.length === 1) {
			return `${openRooms[0].name} ist offen! 🎉`;
		} else if (openRooms.length <= 3) {
			return `${openRooms.length} Räume sind offen! 🌟`;
		} else {
			return `Wow, ${openRooms.length} Räume offen! 🎊`;
		}
	}

	function showRandomMessage() {
		const allMessages = [...messages, getDynamicMessage()];
		bubbleText = allMessages[Math.floor(Math.random() * allMessages.length)];
		showBubble = true;

		// Bubble nach 4 Sekunden ausblenden
		setTimeout(() => {
			showBubble = false;
		}, 4000);
	}

	function handleClick() {
		if (!showBubble) {
			isWaving = true;
			showRandomMessage();

			setTimeout(() => {
				isWaving = false;
			}, 1000);
		}
	}

	onMount(() => {
		// Versuche Lottie zu laden
		try {
			animation = lottie.loadAnimation({
				container,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				path: ANIMATIONS.happy
			});

			animation.addEventListener('error', () => {
				useFallback = true;
			});
		} catch {
			useFallback = true;
		}

		// Zeige erste Nachricht nach 3 Sekunden
		const initialTimer = setTimeout(() => {
			showRandomMessage();
		}, 3000);

		// Zeige zufällige Nachrichten alle 30-60 Sekunden
		const messageInterval = setInterval(() => {
			if (Math.random() > 0.5) {
				showRandomMessage();
			}
		}, 45000);

		return () => {
			clearTimeout(initialTimer);
			clearInterval(messageInterval);
		};
	});

	onDestroy(() => {
		if (animation) {
			animation.destroy();
		}
	});
</script>

<div class="mascot-container">
	<!-- Sprechblase -->
	{#if showBubble}
		<div class="speech-bubble" transition:scale={{ duration: 200, start: 0.8 }}>
			<span class="bubble-text">{bubbleText}</span>
			<div class="bubble-tail"></div>
		</div>
	{/if}

	<!-- Maskottchen -->
	<button
		class="mascot"
		class:waving={isWaving}
		onclick={handleClick}
		title="Klick mich! 🦕"
	>
		{#if useFallback}
			<div class="fallback-dino">
				{@html FALLBACK_SVG}
			</div>
		{:else}
			<div class="lottie-container" bind:this={container}></div>
		{/if}

		<!-- Name Badge -->
		<div class="name-badge">Rudi</div>
	</button>
</div>

<style>
	.mascot-container {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 8000;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		pointer-events: none;
	}

	.speech-bubble {
		background: white;
		border-radius: 16px;
		padding: 12px 16px;
		max-width: 200px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		position: relative;
		margin-left: 10px;
		pointer-events: auto;
	}

	.bubble-text {
		font-size: 14px;
		color: #1f2937;
		font-weight: 500;
		line-height: 1.4;
	}

	.bubble-tail {
		position: absolute;
		bottom: -8px;
		left: 20px;
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 10px solid white;
	}

	.mascot {
		width: 100px;
		height: 100px;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
		pointer-events: auto;
		transition: transform 0.3s ease;
		position: relative;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.mascot:hover {
		transform: scale(1.1);
	}

	.mascot:active {
		transform: scale(0.95);
	}

	.mascot.waving {
		animation: wave 0.5s ease-in-out 2;
	}

	@keyframes wave {
		0%, 100% { transform: rotate(0deg); }
		25% { transform: rotate(-10deg); }
		75% { transform: rotate(10deg); }
	}

	.lottie-container,
	.fallback-dino {
		width: 100%;
		height: 100%;
	}

	.fallback-dino :global(svg) {
		width: 100%;
		height: 100%;
	}

	/* Hüpf-Animation für den SVG Dino */
	.fallback-dino {
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-8px); }
	}

	.name-badge {
		position: absolute;
		bottom: -5px;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
		color: white;
		font-size: 11px;
		font-weight: 700;
		padding: 3px 10px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
		letter-spacing: 0.5px;
	}

	/* Mobile Anpassungen */
	@media (max-width: 768px) {
		.mascot-container {
			bottom: 15px;
			left: 15px;
		}

		.mascot {
			width: 80px;
			height: 80px;
		}

		.speech-bubble {
			max-width: 160px;
			padding: 10px 12px;
		}

		.bubble-text {
			font-size: 12px;
		}

		.name-badge {
			font-size: 10px;
			padding: 2px 8px;
		}
	}

	/* Verstecke auf sehr kleinen Bildschirmen */
	@media (max-width: 480px) {
		.mascot-container {
			bottom: 10px;
			left: 10px;
		}

		.mascot {
			width: 60px;
			height: 60px;
		}
	}
</style>
