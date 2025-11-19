// Karten-Theme-System für das Raum-Dashboard

export interface CardTheme {
	name: string;
	displayName: string;
	emoji: string;
	// Kachel-Styles
	borderColor: string;
	borderWidth: string;
	borderStyle: string;
	boxShadow: string;
	// Header-Styles
	headerGradient: string;
	// Badge-Styles
	personBadgeGradient: string;
	personBadgeBorder: string;
	// Spezial-Effekte
	borderImage?: string;
	additionalStyles?: string;
}

export const cardThemes: Record<string, CardTheme> = {
	default: {
		name: 'default',
		displayName: 'Standard',
		emoji: '⚪',
		borderColor: 'rgba(255, 255, 255, 0.2)',
		borderWidth: '2px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 16px rgba(0, 0, 0, 0.2)',
		headerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.98) 0%, rgba(37, 99, 235, 0.98) 100%)',
		personBadgeBorder: 'rgba(255, 255, 255, 0.4)'
	},

	fruehling: {
		name: 'fruehling',
		displayName: 'Frühling',
		emoji: '🌸',
		borderColor: 'rgba(236, 72, 153, 0.5)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4), 0 2px 16px rgba(134, 239, 172, 0.3), 0 0 40px rgba(251, 207, 232, 0.2)',
		headerGradient: 'linear-gradient(135deg, #86efac 0%, #fda4af 50%, #fbbf24 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(134, 239, 172, 0.98) 0%, rgba(236, 72, 153, 0.98) 100%)',
		personBadgeBorder: 'rgba(236, 72, 153, 0.6)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(134, 239, 172, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(236, 72, 153, 0.15) 0%,
					rgba(134, 239, 172, 0.1) 50%,
					rgba(251, 207, 232, 0.15) 100%
				);
			}
			/* Wehende Blütenblätter */
			.room-card::after {
				content: '🌸';
				position: absolute;
				top: 10px;
				right: 20%;
				font-size: 14px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: spring-petal-drift 10s ease-in-out infinite;
				filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3));
			}

			/* Krabbelnder Marienkäfer */
			.room-header::before {
				content: '🐞';
				position: absolute;
				top: 50%;
				left: -10px;
				font-size: 16px;
				z-index: 10;
				pointer-events: none;
				animation: spring-ladybug-crawl 15s linear infinite;
				filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.4));
			}

			/* Hängende Dekorationen - Blumen */
			.card-content::before {
				content: '🌸';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: spring-hang-left 3.5s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(236, 72, 153, 0.4));
				border-top: 2px solid rgba(134, 239, 172, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🌼';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: spring-hang-right 3s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(251, 207, 232, 0.4));
				border-top: 2px solid rgba(134, 239, 172, 0.5);
				padding-top: 8px;
			}

			@keyframes spring-petal-drift {
				0% { top: 10px; right: 20%; opacity: 0; transform: rotate(0deg); }
				15% { opacity: 0.6; }
				85% { opacity: 0.3; }
				100% { top: 90%; right: 30%; opacity: 0; transform: rotate(180deg) translateX(20px); }
			}
			@keyframes spring-ladybug-crawl {
				0% { left: -10px; transform: translateY(-50%); opacity: 0; }
				5% { opacity: 1; }
				95% { opacity: 1; }
				100% { left: calc(100% + 10px); transform: translateY(-50%); opacity: 0; }
			}
			@keyframes spring-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-2deg); }
				50% { transform: translateX(-50%) rotate(2deg); }
			}
			@keyframes spring-hang-right {
				0%, 100% { transform: translateX(50%) rotate(2deg); }
				50% { transform: translateX(50%) rotate(-2deg); }
			}
		`
	},

	sommer: {
		name: 'sommer',
		displayName: 'Sommer',
		emoji: '☀️',
		borderColor: 'rgba(251, 191, 36, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5), 0 2px 16px rgba(249, 115, 22, 0.4), 0 0 60px rgba(251, 191, 36, 0.3)',
		headerGradient: 'linear-gradient(135deg, #60a5fa 0%, #fbbf24 50%, #f97316 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.98) 0%, rgba(249, 115, 22, 0.98) 100%)',
		personBadgeBorder: 'rgba(251, 191, 36, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.08) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(251, 191, 36, 0.18) 0%,
					rgba(249, 115, 22, 0.12) 50%,
					rgba(251, 191, 36, 0.15) 100%
				);
			}
			.room-card::after {
				content: '☀️';
				position: absolute;
				top: -8px;
				right: -8px;
				font-size: 32px;
				opacity: 0.4;
				pointer-events: none;
				z-index: 1;
				animation: summer-shine 4s ease-in-out infinite;
				filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6));
			}

			/* Hängende Dekorationen - Sonnenblume und Eis */
			.card-content::before {
				content: '🌻';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: summer-hang-left 3.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5));
				border-top: 2px solid rgba(251, 191, 36, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🍦';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: summer-hang-right 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(249, 115, 22, 0.4));
				border-top: 2px solid rgba(249, 115, 22, 0.4);
				padding-top: 8px;
			}

			@keyframes summer-shine {
				0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.4; }
				50% { transform: rotate(15deg) scale(1.15); opacity: 0.6; }
			}
			@keyframes summer-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-2deg); }
				50% { transform: translateX(-50%) rotate(2deg); }
			}
			@keyframes summer-hang-right {
				0%, 100% { transform: translateX(50%) rotate(2deg); }
				50% { transform: translateX(50%) rotate(-2deg); }
			}
		`
	},

	herbst: {
		name: 'herbst',
		displayName: 'Herbst',
		emoji: '🍂',
		borderColor: 'rgba(249, 115, 22, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(249, 115, 22, 0.5), 0 2px 16px rgba(161, 98, 7, 0.4), 0 0 40px rgba(217, 119, 6, 0.3)',
		headerGradient: 'linear-gradient(135deg, #a16207 0%, #ea580c 50%, #dc2626 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.98) 0%, rgba(161, 98, 7, 0.98) 100%)',
		personBadgeBorder: 'rgba(249, 115, 22, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(161, 98, 7, 0.1) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(249, 115, 22, 0.15) 0%,
					rgba(161, 98, 7, 0.12) 50%,
					rgba(217, 119, 6, 0.15) 100%
				);
			}
			.room-card::after {
				content: '🍂 🍁';
				position: absolute;
				top: 5px;
				left: 5px;
				right: 5px;
				font-size: 18px;
				opacity: 0.4;
				pointer-events: none;
				z-index: 1;
				animation: autumn-fall 8s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Pilz */
			.card-content::before {
				content: '🍄';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: autumn-hang-left 3.2s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(161, 98, 7, 0.4));
				border-top: 2px solid rgba(161, 98, 7, 0.4);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🍁';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: autumn-hang-right 2.8s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(217, 119, 6, 0.4));
				border-top: 2px solid rgba(161, 98, 7, 0.4);
				padding-top: 8px;
			}

			@keyframes autumn-fall {
				0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
				25% { transform: translateY(3px) rotate(-5deg); opacity: 0.5; }
				50% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
				75% { transform: translateY(3px) rotate(5deg); opacity: 0.5; }
			}
			@keyframes autumn-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-4deg); }
				50% { transform: translateX(-50%) rotate(4deg); }
			}
			@keyframes autumn-hang-right {
				0%, 100% { transform: translateX(50%) rotate(4deg); }
				50% { transform: translateX(50%) rotate(-4deg); }
			}
		`
	},

	winter: {
		name: 'winter',
		displayName: 'Winter',
		emoji: '❄️',
		borderColor: 'rgba(147, 197, 253, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(147, 197, 253, 0.6), 0 2px 16px rgba(219, 234, 254, 0.5), 0 0 60px rgba(147, 197, 253, 0.4)',
		headerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #dbeafe 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(147, 197, 253, 0.98) 0%, rgba(59, 130, 246, 0.98) 100%)',
		personBadgeBorder: 'rgba(147, 197, 253, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(219, 234, 254, 0.15) 0%, rgba(147, 197, 253, 0.12) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(219, 234, 254, 0.25) 0%,
					rgba(147, 197, 253, 0.15) 50%,
					rgba(59, 130, 246, 0.2) 100%
				);
			}

			/* Viele fallende Schneeflocken */
			.room-card::after {
				content: '❄️ ❄️ ❄️';
				position: absolute;
				top: -15px;
				left: 0;
				right: 0;
				text-align: center;
				font-size: 18px;
				letter-spacing: 30px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: winter-snowfall-1 5s ease-in-out infinite;
				filter: drop-shadow(0 0 10px rgba(147, 197, 253, 0.9));
			}

			.room-header::before {
				content: '❄️ ❄️';
				position: absolute;
				top: -10px;
				left: 10%;
				font-size: 16px;
				letter-spacing: 20px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: winter-snowfall-2 6s ease-in-out infinite 1s;
				filter: drop-shadow(0 0 8px rgba(147, 197, 253, 0.8));
			}

			.room-header::after {
				content: '❄️';
				position: absolute;
				top: 20%;
				right: 10%;
				font-size: 20px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: winter-snowfall-3 4s ease-in-out infinite 2s;
				filter: drop-shadow(0 0 12px rgba(219, 234, 254, 0.9));
			}

			/* Hängende Dekorationen - Eiszapfen */
			.card-content::before {
				content: '🧊';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: winter-icicle-left 4s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(147, 197, 253, 0.6));
				border-top: 2px solid rgba(219, 234, 254, 0.6);
				padding-top: 8px;
			}

			.card-content::after {
				content: '❄️';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: winter-icicle-right 3.5s ease-in-out infinite;
				filter: drop-shadow(0 0 12px rgba(147, 197, 253, 0.9));
				border-top: 2px solid rgba(219, 234, 254, 0.6);
				padding-top: 8px;
			}

			@keyframes winter-snowfall-1 {
				0% { top: -15px; opacity: 0; transform: translateY(0) rotate(0deg); }
				15% { opacity: 0.8; }
				85% { opacity: 0.6; }
				100% { top: 110%; opacity: 0; transform: translateY(0) rotate(360deg); }
			}
			@keyframes winter-snowfall-2 {
				0% { top: -10px; opacity: 0; transform: translateX(0) rotate(0deg); }
				20% { opacity: 0.7; }
				80% { opacity: 0.5; }
				100% { top: 110%; opacity: 0; transform: translateX(20px) rotate(-360deg); }
			}
			@keyframes winter-snowfall-3 {
				0% { top: 20%; right: 10%; opacity: 0; transform: scale(0.5) rotate(0deg); }
				15% { opacity: 0.9; }
				85% { opacity: 0.6; }
				100% { top: 110%; right: 15%; opacity: 0; transform: scale(1.2) rotate(540deg); }
			}
			@keyframes winter-icicle-left {
				0%, 100% { transform: translateX(-50%) rotate(-1deg) scaleY(1); }
				50% { transform: translateX(-50%) rotate(1deg) scaleY(1.05); }
			}
			@keyframes winter-icicle-right {
				0%, 100% { transform: translateX(50%) rotate(1deg); opacity: 0.8; }
				50% { transform: translateX(50%) rotate(-1deg); opacity: 1; }
			}
		`
	},

	weihnachten: {
		name: 'weihnachten',
		displayName: 'Weihnachten',
		emoji: '🎄',
		borderColor: 'rgba(220, 38, 38, 0.6)',
		borderWidth: '4px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(220, 38, 38, 0.5), 0 2px 16px rgba(34, 197, 94, 0.4), 0 0 80px rgba(251, 191, 36, 0.3)',
		headerGradient: 'linear-gradient(135deg, #dc2626 0%, #22c55e 50%, #fbbf24 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.98) 0%, rgba(34, 197, 94, 0.98) 100%)',
		personBadgeBorder: 'rgba(251, 191, 36, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%) !important;
				border-image: linear-gradient(90deg, #dc2626 0%, #22c55e 33%, #fbbf24 66%, #dc2626 100%) 1 !important;
				animation: christmas-glow 3s ease-in-out infinite;
			}
			.room-card::before {
				background: repeating-linear-gradient(
					90deg,
					rgba(220, 38, 38, 0.15) 0px,
					rgba(34, 197, 94, 0.15) 10px,
					rgba(251, 191, 36, 0.15) 20px,
					rgba(220, 38, 38, 0.15) 30px
				);
			}
			.room-card::after {
				content: '🎄 ⭐ 🎁';
				position: absolute;
				top: -5px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 18px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
				animation: christmas-sparkle 2s ease-in-out infinite;
			}

			/* Weihnachts-Lichterkette - obere Reihe */
			.room-header::before {
				content: '💡💡💡💡💡';
				position: absolute;
				top: 0px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 14px;
				letter-spacing: 8px;
				opacity: 0.9;
				pointer-events: none;
				z-index: 2;
				animation: christmas-lights-blink 2s ease-in-out infinite;
				filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.9));
			}

			.room-header::after {
				content: '🔴🟢🟡🔴🟢';
				position: absolute;
				top: -5px;
				left: 0;
				right: 0;
				text-align: center;
				font-size: 8px;
				letter-spacing: 4px;
				opacity: 0.8;
				pointer-events: none;
				z-index: 2;
				animation: christmas-lights-twinkle 1.5s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Zuckerstange links */
			.card-content::before {
				content: '🍬';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: hanging-swing-left 3.2s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
				/* Kette/Schnur */
				border-top: 2px solid rgba(255, 255, 255, 0.4);
				padding-top: 8px;
			}

			/* Hängende Dekorationen - Geschenk rechts mit Pulsieren */
			.card-content::after {
				content: '🎁';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: christmas-gift-pulse 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
				/* Kette/Schnur */
				border-top: 2px solid rgba(255, 255, 255, 0.4);
				padding-top: 8px;
			}

			@keyframes christmas-glow {
				0%, 100% { box-shadow: 0 8px 32px rgba(220, 38, 38, 0.5), 0 0 60px rgba(34, 197, 94, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.5), 0 0 60px rgba(251, 191, 36, 0.4); }
			}
			@keyframes christmas-sparkle {
				0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
				50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
			}
			@keyframes christmas-lights-blink {
				0%, 100% {
					opacity: 0.6;
					filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6)) drop-shadow(0 0 8px rgba(220, 38, 38, 0.4));
				}
				50% {
					opacity: 1;
					filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1)) drop-shadow(0 0 16px rgba(220, 38, 38, 0.8));
				}
			}
			@keyframes christmas-lights-twinkle {
				0%, 100% {
					opacity: 0.5;
					transform: scaleY(1);
				}
				25% {
					opacity: 0.9;
					transform: scaleY(1.2);
				}
				75% {
					opacity: 0.7;
					transform: scaleY(0.9);
				}
			}
			@keyframes hanging-swing-left {
				0%, 100% { transform: translateX(-50%) rotate(-3deg); }
				50% { transform: translateX(-50%) rotate(3deg); }
			}
			@keyframes christmas-gift-pulse {
				0%, 100% { transform: translateX(50%) rotate(3deg) scale(1); filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)); }
				50% { transform: translateX(50%) rotate(-3deg) scale(1.1); filter: drop-shadow(0 6px 12px rgba(251, 191, 36, 0.8)); }
			}
		`
	},

	ostern: {
		name: 'ostern',
		displayName: 'Ostern',
		emoji: '🐰',
		borderColor: 'rgba(196, 181, 253, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(196, 181, 253, 0.5), 0 2px 16px rgba(251, 207, 232, 0.4), 0 0 40px rgba(254, 240, 138, 0.3)',
		headerGradient: 'linear-gradient(135deg, #c4b5fd 0%, #fbcfe8 50%, #fef08a 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(196, 181, 253, 0.98) 0%, rgba(251, 207, 232, 0.98) 100%)',
		personBadgeBorder: 'rgba(196, 181, 253, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(196, 181, 253, 0.1) 0%, rgba(251, 207, 232, 0.08) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(196, 181, 253, 0.18) 0%,
					rgba(251, 207, 232, 0.15) 50%,
					rgba(254, 240, 138, 0.12) 100%
				);
			}
			.room-card::after {
				content: '🐰 🥚 🌷';
				position: absolute;
				bottom: -8px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 18px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
				animation: easter-hop 3s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Ostereier */
			.card-content::before {
				content: '🥚';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: easter-hang-left 3s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(196, 181, 253, 0.4));
				border-top: 2px solid rgba(196, 181, 253, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🐰';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: easter-hang-right 3.5s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(251, 207, 232, 0.4));
				border-top: 2px solid rgba(251, 207, 232, 0.5);
				padding-top: 8px;
			}

			@keyframes easter-hop {
				0%, 100% { transform: translateX(-50%) translateY(0); }
				50% { transform: translateX(-50%) translateY(-5px); }
			}
			@keyframes easter-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-2deg) translateY(0); }
				50% { transform: translateX(-50%) rotate(2deg) translateY(-3px); }
			}
			@keyframes easter-hang-right {
				0%, 100% { transform: translateX(50%) rotate(2deg) translateY(0); }
				50% { transform: translateX(50%) rotate(-2deg) translateY(-3px); }
			}
		`
	},

	halloween: {
		name: 'halloween',
		displayName: 'Halloween',
		emoji: '🎃',
		borderColor: 'rgba(249, 115, 22, 0.7)',
		borderWidth: '3px',
		borderStyle: 'dashed',
		boxShadow: '0 8px 32px rgba(249, 115, 22, 0.6), 0 2px 16px rgba(109, 40, 217, 0.5), 0 0 70px rgba(0, 0, 0, 0.8)',
		headerGradient: 'linear-gradient(135deg, #1f2937 0%, #7c3aed 50%, #f97316 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.98) 0%, rgba(109, 40, 217, 0.98) 100%)',
		personBadgeBorder: 'rgba(249, 115, 22, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(124, 58, 237, 0.15) 100%) !important;
			}
			.room-card::before {
				background: repeating-linear-gradient(
					45deg,
					rgba(31, 41, 55, 0.4) 0px,
					rgba(124, 58, 237, 0.25) 10px,
					rgba(249, 115, 22, 0.25) 20px,
					rgba(31, 41, 55, 0.4) 30px
				);
			}
			.room-card::after {
				content: '🎃 👻 🕷️';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 24px;
				opacity: 0.2;
				pointer-events: none;
				z-index: 1;
				animation: halloween-spook 4s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Glühender Kürbis links */
			.card-content::before {
				content: '🎃';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: halloween-glow-left 2.8s ease-in-out infinite;
				/* Spinnenfaden */
				border-top: 2px dashed rgba(124, 58, 237, 0.5);
				padding-top: 8px;
			}

			/* Hängende Dekorationen - Glühender Kürbis rechts */
			.card-content::after {
				content: '🎃';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: halloween-glow-right 3.2s ease-in-out infinite;
				/* Spinnenfaden */
				border-top: 2px dashed rgba(124, 58, 237, 0.5);
				padding-top: 8px;
			}

			@keyframes halloween-spook {
				0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
				50% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.05); }
			}
			@keyframes halloween-glow-left {
				0%, 100% {
					transform: translateX(-50%) rotate(-5deg);
					filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
				}
				50% {
					transform: translateX(-50%) rotate(5deg);
					filter: drop-shadow(0 0 20px rgba(249, 115, 22, 1)) drop-shadow(0 0 30px rgba(249, 115, 22, 0.8));
				}
			}
			@keyframes halloween-glow-right {
				0%, 100% {
					transform: translateX(50%) rotate(5deg);
					filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
				}
				50% {
					transform: translateX(50%) rotate(-5deg);
					filter: drop-shadow(0 0 20px rgba(249, 115, 22, 1)) drop-shadow(0 0 30px rgba(249, 115, 22, 0.8));
				}
			}
		`
	},

	regenbogen: {
		name: 'regenbogen',
		displayName: 'Regenbogen',
		emoji: '🌈',
		borderColor: 'transparent',
		borderWidth: '5px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(147, 51, 234, 0.5), 0 2px 16px rgba(59, 130, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.3)',
		headerGradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 16%, #fbbf24 32%, #84cc16 48%, #10b981 64%, #06b6d4 80%, #8b5cf6 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.98) 0%, rgba(236, 72, 153, 0.98) 100%)',
		personBadgeBorder: 'rgba(167, 139, 250, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%) !important;
				border-image: linear-gradient(90deg, #ef4444 0%, #f59e0b 14%, #fbbf24 28%, #84cc16 42%, #10b981 56%, #06b6d4 70%, #8b5cf6 84%, #ef4444 100%) 1 !important;
				animation: rainbow-shift 6s linear infinite;
			}
			.room-card::before {
				background: repeating-linear-gradient(
					90deg,
					rgba(239, 68, 68, 0.1) 0px,
					rgba(245, 158, 11, 0.1) 20px,
					rgba(251, 191, 36, 0.1) 40px,
					rgba(132, 204, 22, 0.1) 60px,
					rgba(16, 185, 129, 0.1) 80px,
					rgba(6, 182, 212, 0.1) 100px,
					rgba(139, 92, 246, 0.1) 120px
				);
			}
			.room-card::after {
				content: '🌈';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 50px;
				opacity: 0.15;
				pointer-events: none;
				z-index: 1;
				animation: rainbow-float 5s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Wolken */
			.card-content::before {
				content: '☁️';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: rainbow-cloud-left 6s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(139, 92, 246, 0.3));
				border-top: 2px solid rgba(167, 139, 250, 0.4);
				padding-top: 8px;
			}

			.card-content::after {
				content: '☁️';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: rainbow-cloud-right 5.5s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(236, 72, 153, 0.3));
				border-top: 2px solid rgba(167, 139, 250, 0.4);
				padding-top: 8px;
			}

			@keyframes rainbow-shift {
				0% { filter: hue-rotate(0deg); }
				100% { filter: hue-rotate(360deg); }
			}
			@keyframes rainbow-float {
				0%, 100% { transform: translate(-50%, -50%) scale(1); }
				50% { transform: translate(-50%, -48%) scale(1.05); }
			}
			@keyframes rainbow-cloud-left {
				0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.8; }
				50% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
			}
			@keyframes rainbow-cloud-right {
				0%, 100% { transform: translateX(50%) translateY(0); opacity: 0.8; }
				50% { transform: translateX(50%) translateY(-5px); opacity: 1; }
			}
		`
	},

	natur: {
		name: 'natur',
		displayName: 'Natur',
		emoji: '🌿',
		borderColor: 'rgba(34, 197, 94, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(34, 197, 94, 0.5), 0 2px 16px rgba(132, 204, 22, 0.4), 0 0 40px rgba(22, 101, 52, 0.3)',
		headerGradient: 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #84cc16 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.98) 0%, rgba(22, 101, 52, 0.98) 100%)',
		personBadgeBorder: 'rgba(34, 197, 94, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 101, 52, 0.1) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(34, 197, 94, 0.18) 0%,
					rgba(132, 204, 22, 0.12) 50%,
					rgba(22, 101, 52, 0.18) 100%
				);
			}
			.room-card::after {
				content: '🌿 🌱 🍃';
				position: absolute;
				bottom: -5px;
				left: 0;
				right: 0;
				text-align: center;
				font-size: 18px;
				opacity: 0.4;
				pointer-events: none;
				z-index: 1;
				animation: nature-grow 4s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Früchte und Schmetterling */
			.card-content::before {
				content: '🍎';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: nature-hang-left 3.2s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(34, 197, 94, 0.4));
				border-top: 2px solid rgba(34, 197, 94, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🦋';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: nature-butterfly 4s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(132, 204, 22, 0.4));
				border-top: 2px solid rgba(132, 204, 22, 0.4);
				padding-top: 8px;
			}

			@keyframes nature-grow {
				0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
				50% { transform: translateY(-3px) scale(1.05); opacity: 0.6; }
			}
			@keyframes nature-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-2deg); }
				50% { transform: translateX(-50%) rotate(2deg); }
			}
			@keyframes nature-butterfly {
				0%, 100% { transform: translateX(50%) rotate(2deg) translateY(0); }
				25% { transform: translateX(50%) rotate(-3deg) translateY(-2px); }
				50% { transform: translateX(50%) rotate(2deg) translateY(-4px); }
				75% { transform: translateX(50%) rotate(-3deg) translateY(-2px); }
			}
		`
	},

	geburtstag: {
		name: 'geburtstag',
		displayName: 'Geburtstag',
		emoji: '🎂',
		borderColor: 'rgba(236, 72, 153, 0.7)',
		borderWidth: '4px',
		borderStyle: 'dashed',
		boxShadow: '0 8px 32px rgba(236, 72, 153, 0.6), 0 2px 16px rgba(251, 191, 36, 0.5), 0 0 80px rgba(147, 51, 234, 0.4)',
		headerGradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #a855f7 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.98) 0%, rgba(168, 85, 247, 0.98) 100%)',
		personBadgeBorder: 'rgba(236, 72, 153, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
				animation: birthday-sparkle 3s ease-in-out infinite;
			}
			.room-card::before {
				background: radial-gradient(
					circle at 20% 80%,
					rgba(236, 72, 153, 0.2) 0%,
					rgba(251, 191, 36, 0.15) 30%,
					rgba(168, 85, 247, 0.2) 60%,
					transparent 100%
				);
			}

			/* Konfetti-Effekt */
			.room-card::after {
				content: '🎊';
				position: absolute;
				top: -10px;
				left: 50%;
				font-size: 16px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: birthday-confetti 8s ease-in-out infinite;
				filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.5));
			}

			/* Brennende Kerze */
			.room-header::before {
				content: '🕯️';
				position: absolute;
				top: 50%;
				right: 10px;
				transform: translateY(-50%);
				font-size: 18px;
				z-index: 10;
				pointer-events: none;
				animation: birthday-candle-flicker 2s ease-in-out infinite;
				filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
			}

			/* Hängende Dekorationen - Luftballons */
			.card-content::before {
				content: '🎈';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: birthday-balloon-left 4s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(236, 72, 153, 0.5));
				border-top: 2px solid rgba(236, 72, 153, 0.4);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🎉';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: birthday-party-right 3.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5));
				border-top: 2px solid rgba(251, 191, 36, 0.4);
				padding-top: 8px;
			}

			@keyframes birthday-sparkle {
				0%, 100% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.6), 0 0 60px rgba(168, 85, 247, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(251, 191, 36, 0.6), 0 0 80px rgba(236, 72, 153, 0.5); }
			}
			@keyframes birthday-confetti {
				0% { top: -10px; left: 50%; opacity: 0; transform: rotate(0deg) scale(0.5); }
				15% { opacity: 1; }
				85% { opacity: 0.5; }
				100% { top: 100%; left: 45%; opacity: 0; transform: rotate(720deg) scale(0.8); }
			}
			@keyframes birthday-candle-flicker {
				0%, 100% {
					opacity: 1;
					transform: translateY(-50%) scale(1);
					filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
				}
				50% {
					opacity: 0.8;
					transform: translateY(-50%) scale(1.05);
					filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1));
				}
			}
			@keyframes birthday-balloon-left {
				0%, 100% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
				50% { transform: translateX(-50%) translateY(-8px) rotate(3deg); }
			}
			@keyframes birthday-party-right {
				0%, 100% { transform: translateX(50%) rotate(3deg) scale(1); }
				50% { transform: translateX(50%) rotate(-3deg) scale(1.1); }
			}
		`
	},

	neujahr: {
		name: 'neujahr',
		displayName: 'Neujahr',
		emoji: '🎆',
		borderColor: 'rgba(251, 191, 36, 0.8)',
		borderWidth: '4px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(251, 191, 36, 0.7), 0 2px 16px rgba(239, 68, 68, 0.5), 0 0 100px rgba(147, 51, 234, 0.5)',
		headerGradient: 'linear-gradient(135deg, #fbbf24 0%, #ef4444 50%, #9333ea 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.98) 0%, rgba(239, 68, 68, 0.98) 100%)',
		personBadgeBorder: 'rgba(251, 191, 36, 0.9)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(147, 51, 234, 0.1) 100%) !important;
				animation: newyear-glow 2s ease-in-out infinite;
			}
			.room-card::before {
				background: radial-gradient(
					circle at 50% 50%,
					rgba(251, 191, 36, 0.15) 0%,
					rgba(239, 68, 68, 0.12) 40%,
					rgba(147, 51, 234, 0.15) 80%,
					transparent 100%
				);
			}

			/* Feuerwerk-Funken Effekt */
			.room-card::after {
				content: '✨';
				position: absolute;
				top: 20%;
				right: 20%;
				font-size: 20px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: newyear-sparkle 4s ease-in-out infinite;
				filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.9));
			}

			/* Hängende Dekorationen - Sekt und Feuerwerk */
			.card-content::before {
				content: '🍾';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: newyear-bottle 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.6));
				border-top: 2px solid rgba(251, 191, 36, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🎆';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: newyear-firework 2.5s ease-in-out infinite;
				filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.8));
				border-top: 2px solid rgba(239, 68, 68, 0.5);
				padding-top: 8px;
			}

			@keyframes newyear-glow {
				0%, 100% { box-shadow: 0 8px 32px rgba(251, 191, 36, 0.7), 0 0 60px rgba(147, 51, 234, 0.4); }
				50% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.7), 0 0 100px rgba(251, 191, 36, 0.6); }
			}
			@keyframes newyear-sparkle {
				0% { top: 20%; right: 20%; opacity: 0; transform: scale(0.3); }
				10% { opacity: 1; transform: scale(1.2); }
				30% { opacity: 0.8; transform: scale(0.8) rotate(180deg); }
				100% { top: 80%; right: 10%; opacity: 0; transform: scale(0.5) rotate(360deg); }
			}
			@keyframes newyear-bottle {
				0%, 100% { transform: translateX(-50%) rotate(-2deg); }
				50% { transform: translateX(-50%) rotate(2deg); }
			}
			@keyframes newyear-firework {
				0%, 100% {
					transform: translateX(50%) scale(1);
					filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));
				}
				50% {
					transform: translateX(50%) scale(1.2);
					filter: drop-shadow(0 0 25px rgba(239, 68, 68, 1)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.9));
				}
			}
		`
	},

	meer: {
		name: 'meer',
		displayName: 'Meer/Strand',
		emoji: '🌊',
		borderColor: 'rgba(6, 182, 212, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(6, 182, 212, 0.5), 0 2px 16px rgba(14, 165, 233, 0.4), 0 0 60px rgba(56, 189, 248, 0.3)',
		headerGradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #67e8f9 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.98) 0%, rgba(14, 165, 233, 0.98) 100%)',
		personBadgeBorder: 'rgba(6, 182, 212, 0.7)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(6, 182, 212, 0.15) 0%,
					rgba(14, 165, 233, 0.1) 50%,
					rgba(103, 232, 249, 0.12) 100%
				);
			}

			/* Wellen-Effekt */
			.room-card::after {
				content: '🌊';
				position: absolute;
				bottom: 5px;
				left: 0;
				right: 0;
				text-align: center;
				font-size: 18px;
				opacity: 0.3;
				pointer-events: none;
				z-index: 1;
				animation: meer-wave 6s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Muschel und Seestern */
			.card-content::before {
				content: '🐚';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: meer-hang-left 3.8s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(6, 182, 212, 0.4));
				border-top: 2px solid rgba(6, 182, 212, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🐠';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: meer-fish-swim 4.2s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(251, 191, 36, 0.5));
				border-top: 2px solid rgba(14, 165, 233, 0.5);
				padding-top: 8px;
			}

			@keyframes meer-wave {
				0%, 100% { transform: translateX(0) scaleX(1); opacity: 0.3; }
				50% { transform: translateX(5px) scaleX(1.05); opacity: 0.5; }
			}
			@keyframes meer-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-3deg); }
				50% { transform: translateX(-50%) rotate(3deg); }
			}
			@keyframes meer-fish-swim {
				0%, 100% { transform: translateX(50%) rotate(-5deg) scaleX(1); opacity: 0.9; }
				50% { transform: translateX(50%) rotate(5deg) scaleX(-1); opacity: 1; }
			}
		`
	},

	valentinstag: {
		name: 'valentinstag',
		displayName: 'Valentinstag',
		emoji: '💝',
		borderColor: 'rgba(236, 72, 153, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(236, 72, 153, 0.6), 0 2px 16px rgba(244, 114, 182, 0.5), 0 0 70px rgba(251, 207, 232, 0.4)',
		headerGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #fbcfe8 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.98) 0%, rgba(244, 114, 182, 0.98) 100%)',
		personBadgeBorder: 'rgba(236, 72, 153, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(251, 207, 232, 0.08) 100%) !important;
				animation: valentine-heartbeat 2.5s ease-in-out infinite;
			}
			.room-card::before {
				background: radial-gradient(
					circle at 30% 70%,
					rgba(236, 72, 153, 0.2) 0%,
					rgba(244, 114, 182, 0.15) 40%,
					rgba(251, 207, 232, 0.1) 80%,
					transparent 100%
				);
			}

			/* Fliegende Herzen */
			.room-card::after {
				content: '💕';
				position: absolute;
				bottom: 10px;
				left: 20%;
				font-size: 14px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: valentine-heart-float 6s ease-in-out infinite;
				filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.4));
			}

			.room-header::before {
				content: '💖';
				position: absolute;
				bottom: 15px;
				right: 25%;
				font-size: 16px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: valentine-heart-float 7s ease-in-out infinite 2s;
				filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.5));
			}

			/* Hängende Dekorationen - Rose und Herz */
			.card-content::before {
				content: '🌹';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: valentine-hang-left 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(220, 38, 38, 0.5));
				border-top: 2px solid rgba(220, 38, 38, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '💝';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: valentine-gift-pulse 2.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(236, 72, 153, 0.6));
				border-top: 2px solid rgba(236, 72, 153, 0.5);
				padding-top: 8px;
			}

			@keyframes valentine-heartbeat {
				0%, 100% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.6), 0 0 60px rgba(251, 207, 232, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.8), 0 0 80px rgba(244, 114, 182, 0.5); }
			}
			@keyframes valentine-heart-float {
				0% { bottom: 10px; opacity: 0; transform: rotate(0deg) scale(0.8); }
				15% { opacity: 1; }
				85% { opacity: 0.7; }
				100% { bottom: 100%; opacity: 0; transform: rotate(20deg) scale(1.2); }
			}
			@keyframes valentine-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-2deg); }
				50% { transform: translateX(-50%) rotate(2deg); }
			}
			@keyframes valentine-gift-pulse {
				0%, 100% { transform: translateX(50%) scale(1); opacity: 1; }
				50% { transform: translateX(50%) scale(1.15); opacity: 0.9; }
			}
		`
	},

	musik: {
		name: 'musik',
		displayName: 'Musik/Party',
		emoji: '🎵',
		borderColor: 'rgba(168, 85, 247, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(168, 85, 247, 0.6), 0 2px 16px rgba(139, 92, 246, 0.5), 0 0 70px rgba(196, 181, 253, 0.4)',
		headerGradient: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #c4b5fd 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.98) 0%, rgba(139, 92, 246, 0.98) 100%)',
		personBadgeBorder: 'rgba(168, 85, 247, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(196, 181, 253, 0.06) 100%) !important;
				animation: musik-pulse 1.5s ease-in-out infinite;
			}
			.room-card::before {
				background: radial-gradient(
					circle at 50% 50%,
					rgba(168, 85, 247, 0.15) 0%,
					rgba(139, 92, 246, 0.1) 50%,
					transparent 100%
				);
			}

			/* Tanzende Noten */
			.room-card::after {
				content: '🎵';
				position: absolute;
				top: 20%;
				left: 10%;
				font-size: 18px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: musik-note-dance-1 4s ease-in-out infinite;
				filter: drop-shadow(0 2px 4px rgba(168, 85, 247, 0.5));
			}

			.room-header::before {
				content: '🎶';
				position: absolute;
				top: 30%;
				right: 15%;
				font-size: 16px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: musik-note-dance-2 3.5s ease-in-out infinite 1s;
				filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.4));
			}

			/* Hängende Dekorationen - Kopfhörer und Mikrofon */
			.card-content::before {
				content: '🎧';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: musik-hang-left 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(168, 85, 247, 0.5));
				border-top: 2px solid rgba(168, 85, 247, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🎤';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: musik-mic-bounce 2.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(139, 92, 246, 0.5));
				border-top: 2px solid rgba(139, 92, 246, 0.5);
				padding-top: 8px;
			}

			@keyframes musik-pulse {
				0%, 100% { box-shadow: 0 8px 32px rgba(168, 85, 247, 0.6), 0 0 60px rgba(196, 181, 253, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(168, 85, 247, 0.9), 0 0 80px rgba(139, 92, 246, 0.6); }
			}
			@keyframes musik-note-dance-1 {
				0% { top: 20%; left: 10%; opacity: 0; transform: rotate(0deg) scale(0.8); }
				15% { opacity: 1; }
				50% { top: 40%; left: 15%; transform: rotate(15deg) scale(1.1); }
				85% { opacity: 0.8; }
				100% { top: 70%; left: 20%; opacity: 0; transform: rotate(-15deg) scale(0.9); }
			}
			@keyframes musik-note-dance-2 {
				0% { top: 30%; right: 15%; opacity: 0; transform: rotate(0deg) scale(0.7); }
				15% { opacity: 1; }
				50% { top: 50%; right: 20%; transform: rotate(-20deg) scale(1); }
				85% { opacity: 0.7; }
				100% { top: 80%; right: 25%; opacity: 0; transform: rotate(20deg) scale(0.8); }
			}
			@keyframes musik-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-3deg); }
				50% { transform: translateX(-50%) rotate(3deg); }
			}
			@keyframes musik-mic-bounce {
				0%, 100% { transform: translateX(50%) translateY(0) scale(1); }
				50% { transform: translateX(50%) translateY(-5px) scale(1.1); }
			}
		`
	},

	sport: {
		name: 'sport',
		displayName: 'Sport',
		emoji: '⚽',
		borderColor: 'rgba(34, 197, 94, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(34, 197, 94, 0.6), 0 2px 16px rgba(22, 163, 74, 0.5), 0 0 70px rgba(74, 222, 128, 0.4)',
		headerGradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.98) 0%, rgba(22, 163, 74, 0.98) 100%)',
		personBadgeBorder: 'rgba(34, 197, 94, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.06) 100%) !important;
				animation: sport-energy 2s ease-in-out infinite;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(34, 197, 94, 0.15) 0%,
					rgba(22, 163, 74, 0.1) 50%,
					rgba(74, 222, 128, 0.12) 100%
				);
			}

			/* Fliegender Ball */
			.room-card::after {
				content: '⚽';
				position: absolute;
				top: 20px;
				left: -20px;
				font-size: 20px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: sport-ball-fly 5s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(34, 197, 94, 0.4));
			}

			/* Hängende Dekorationen - Medaille und Pokal */
			.card-content::before {
				content: '🥇';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: sport-medal-swing 3.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.6));
				border-top: 2px solid rgba(251, 191, 36, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🏆';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: sport-trophy-shine 2.8s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.7));
				border-top: 2px solid rgba(34, 197, 94, 0.5);
				padding-top: 8px;
			}

			@keyframes sport-energy {
				0%, 100% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.6), 0 0 60px rgba(74, 222, 128, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.9), 0 0 80px rgba(22, 163, 74, 0.6); }
			}
			@keyframes sport-ball-fly {
				0% { top: 20px; left: -20px; opacity: 0; transform: rotate(0deg); }
				10% { opacity: 1; }
				50% { top: 50%; left: 50%; transform: rotate(360deg); }
				90% { opacity: 0.8; }
				100% { top: 80px; left: calc(100% + 20px); opacity: 0; transform: rotate(720deg); }
			}
			@keyframes sport-medal-swing {
				0%, 100% { transform: translateX(-50%) rotate(-4deg); }
				50% { transform: translateX(-50%) rotate(4deg); }
			}
			@keyframes sport-trophy-shine {
				0%, 100% {
					transform: translateX(50%) scale(1);
					filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.6));
				}
				50% {
					transform: translateX(50%) scale(1.1);
					filter: drop-shadow(0 6px 12px rgba(251, 191, 36, 1)) drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
				}
			}
		`
	},

	cafe: {
		name: 'cafe',
		displayName: 'Café/Gemütlich',
		emoji: '☕',
		borderColor: 'rgba(161, 98, 7, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(161, 98, 7, 0.6), 0 2px 16px rgba(120, 53, 15, 0.5), 0 0 60px rgba(217, 119, 6, 0.4)',
		headerGradient: 'linear-gradient(135deg, #78350f 0%, #a16207 50%, #d97706 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(161, 98, 7, 0.98) 0%, rgba(120, 53, 15, 0.98) 100%)',
		personBadgeBorder: 'rgba(161, 98, 7, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(161, 98, 7, 0.08) 0%, rgba(217, 119, 6, 0.06) 100%) !important;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(161, 98, 7, 0.15) 0%,
					rgba(120, 53, 15, 0.12) 50%,
					rgba(217, 119, 6, 0.1) 100%
				);
			}

			/* Dampf vom Kaffee */
			.room-card::after {
				content: '☁️';
				position: absolute;
				top: 30%;
				left: 50%;
				transform: translateX(-50%);
				font-size: 14px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: cafe-steam 4s ease-in-out infinite;
				filter: drop-shadow(0 2px 4px rgba(161, 98, 7, 0.3));
			}

			/* Hängende Dekorationen - Buch und Keks */
			.card-content::before {
				content: '📚';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 20px;
				z-index: 16;
				pointer-events: none;
				animation: cafe-hang-left 3.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(120, 53, 15, 0.5));
				border-top: 2px solid rgba(161, 98, 7, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '🍪';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: cafe-hang-right 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(217, 119, 6, 0.5));
				border-top: 2px solid rgba(217, 119, 6, 0.5);
				padding-top: 8px;
			}

			/* Kaffeetasse im Header */
			.room-header::before {
				content: '☕';
				position: absolute;
				top: 50%;
				right: 10px;
				transform: translateY(-50%);
				font-size: 18px;
				z-index: 10;
				pointer-events: none;
				animation: cafe-cup-steam 3s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(161, 98, 7, 0.5));
			}

			@keyframes cafe-steam {
				0% { top: 30%; opacity: 0; transform: translateX(-50%) scale(0.5); }
				20% { opacity: 0.6; }
				80% { opacity: 0.3; }
				100% { top: -10%; opacity: 0; transform: translateX(-50%) scale(1.5); }
			}
			@keyframes cafe-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-1deg); }
				50% { transform: translateX(-50%) rotate(1deg); }
			}
			@keyframes cafe-hang-right {
				0%, 100% { transform: translateX(50%) rotate(1deg); }
				50% { transform: translateX(50%) rotate(-1deg); }
			}
			@keyframes cafe-cup-steam {
				0%, 100% { transform: translateY(-50%) scale(1); opacity: 1; }
				50% { transform: translateY(-50%) scale(1.05); opacity: 0.9; }
			}
		`
	},

	fussball: {
		name: 'fussball',
		displayName: 'Fußball',
		emoji: '⚽',
		borderColor: 'rgba(34, 197, 94, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(34, 197, 94, 0.6), 0 2px 16px rgba(22, 163, 74, 0.5), 0 0 70px rgba(74, 222, 128, 0.4)',
		headerGradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #86efac 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.98) 0%, rgba(22, 163, 74, 0.98) 100%)',
		personBadgeBorder: 'rgba(34, 197, 94, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.06) 100%) !important;
				animation: fussball-energy 2s ease-in-out infinite;
			}
			.room-card::before {
				background: repeating-linear-gradient(
					0deg,
					rgba(34, 197, 94, 0.1) 0px,
					rgba(34, 197, 94, 0.05) 20px,
					rgba(74, 222, 128, 0.1) 40px,
					rgba(34, 197, 94, 0.05) 60px
				);
			}

			/* Fliegender Fußball diagonal */
			.room-card::after {
				content: '⚽';
				position: absolute;
				top: -20px;
				left: -20px;
				font-size: 22px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: fussball-kick 6s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(34, 197, 94, 0.6));
			}

			/* Torjubel im Header */
			.room-header::before {
				content: '🥅';
				position: absolute;
				top: 50%;
				right: 5px;
				transform: translateY(-50%);
				font-size: 20px;
				opacity: 0.6;
				z-index: 10;
				pointer-events: none;
				animation: fussball-goal 3s ease-in-out infinite;
			}

			/* Hängende Dekorationen - Trikot und Schuh */
			.card-content::before {
				content: '👕';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: fussball-hang-left 3.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(34, 197, 94, 0.5));
				border-top: 2px solid rgba(34, 197, 94, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '👟';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: fussball-hang-right 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(22, 163, 74, 0.5));
				border-top: 2px solid rgba(22, 163, 74, 0.5);
				padding-top: 8px;
			}

			@keyframes fussball-energy {
				0%, 100% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.6), 0 0 60px rgba(74, 222, 128, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.9), 0 0 80px rgba(22, 163, 74, 0.6); }
			}
			@keyframes fussball-kick {
				0% { top: -20px; left: -20px; opacity: 0; transform: rotate(0deg) scale(0.8); }
				10% { opacity: 1; }
				50% { top: 50%; left: 50%; transform: rotate(720deg) scale(1.1); }
				90% { opacity: 0.9; }
				100% { top: calc(100% + 20px); left: calc(100% + 20px); opacity: 0; transform: rotate(1440deg) scale(0.8); }
			}
			@keyframes fussball-goal {
				0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.6; }
				50% { transform: translateY(-50%) scale(1.15); opacity: 0.9; }
			}
			@keyframes fussball-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-4deg); }
				50% { transform: translateX(-50%) rotate(4deg); }
			}
			@keyframes fussball-hang-right {
				0%, 100% { transform: translateX(50%) rotate(4deg); }
				50% { transform: translateX(50%) rotate(-4deg); }
			}
		`
	},

	handball: {
		name: 'handball',
		displayName: 'Handball',
		emoji: '🤾',
		borderColor: 'rgba(239, 68, 68, 0.7)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(239, 68, 68, 0.6), 0 2px 16px rgba(220, 38, 38, 0.5), 0 0 70px rgba(252, 165, 165, 0.4)',
		headerGradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #fca5a5 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.98) 0%, rgba(220, 38, 38, 0.98) 100%)',
		personBadgeBorder: 'rgba(239, 68, 68, 0.8)',
		additionalStyles: `
			.room-card {
				background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(252, 165, 165, 0.06) 100%) !important;
				animation: handball-power 2s ease-in-out infinite;
			}
			.room-card::before {
				background: repeating-linear-gradient(
					45deg,
					rgba(239, 68, 68, 0.1) 0px,
					rgba(239, 68, 68, 0.05) 15px,
					rgba(220, 38, 38, 0.1) 30px,
					rgba(239, 68, 68, 0.05) 45px
				);
			}

			/* Geworfener Handball */
			.room-card::after {
				content: '🤾';
				position: absolute;
				top: 30%;
				left: -30px;
				font-size: 24px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: handball-throw 5s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(239, 68, 68, 0.6));
			}

			/* Tor im Header */
			.room-header::before {
				content: '🥅';
				position: absolute;
				top: 50%;
				right: 5px;
				transform: translateY(-50%);
				font-size: 20px;
				opacity: 0.6;
				z-index: 10;
				pointer-events: none;
				animation: handball-goal 3s ease-in-out infinite;
			}

			/* Ball Animation im Header */
			.room-header::after {
				content: '🏐';
				position: absolute;
				top: 10%;
				left: 20%;
				font-size: 16px;
				opacity: 0;
				pointer-events: none;
				z-index: 1;
				animation: handball-bounce 4s ease-in-out infinite 1s;
				filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5));
			}

			/* Hängende Dekorationen - Handball und Trillerpfeife */
			.card-content::before {
				content: '🏐';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: handball-hang-left 3s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.5));
				border-top: 2px solid rgba(239, 68, 68, 0.5);
				padding-top: 8px;
			}

			.card-content::after {
				content: '⚡';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: handball-hang-right 2.5s ease-in-out infinite;
				filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.6));
				border-top: 2px solid rgba(251, 191, 36, 0.5);
				padding-top: 8px;
			}

			@keyframes handball-power {
				0%, 100% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.6), 0 0 60px rgba(252, 165, 165, 0.3); }
				50% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.9), 0 0 80px rgba(220, 38, 38, 0.6); }
			}
			@keyframes handball-throw {
				0% { top: 30%; left: -30px; opacity: 0; transform: rotate(0deg) scale(0.7); }
				15% { opacity: 1; }
				40% { top: 20%; left: 40%; transform: rotate(180deg) scale(1.2); }
				70% { top: 40%; left: 80%; transform: rotate(360deg) scale(1); }
				90% { opacity: 0.9; }
				100% { top: 50%; left: calc(100% + 30px); opacity: 0; transform: rotate(540deg) scale(0.8); }
			}
			@keyframes handball-bounce {
				0% { top: 10%; left: 20%; opacity: 0; }
				10% { opacity: 1; }
				30% { top: 60%; left: 25%; }
				50% { top: 20%; left: 30%; }
				70% { top: 70%; left: 35%; }
				90% { opacity: 0.8; }
				100% { top: 30%; left: 40%; opacity: 0; }
			}
			@keyframes handball-goal {
				0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.6; }
				50% { transform: translateY(-50%) scale(1.15); opacity: 0.9; }
			}
			@keyframes handball-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-5deg); }
				50% { transform: translateX(-50%) rotate(5deg); }
			}
			@keyframes handball-hang-right {
				0%, 100% { transform: translateX(50%) rotate(5deg) scale(1); }
				50% { transform: translateX(50%) rotate(-5deg) scale(1.2); }
			}
		`
	}
};

export function getCardTheme(themeName: string): CardTheme {
	return cardThemes[themeName] || cardThemes.default;
}

export function getAllThemes(): CardTheme[] {
	return Object.values(cardThemes);
}
