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
			.room-card::after {
				content: '🌸 🌼 🌺';
				position: absolute;
				top: -5px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 16px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
				animation: spring-bloom 3s ease-in-out infinite;
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

			@keyframes spring-bloom {
				0%, 100% { transform: translateX(-50%) scale(1); }
				50% { transform: translateX(-50%) scale(1.1); }
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
			@keyframes summer-shine {
				0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.4; }
				50% { transform: rotate(15deg) scale(1.15); opacity: 0.6; }
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

			/* Hängende Dekorationen - Herbstblätter */
			.card-content::before {
				content: '🍂';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: autumn-hang-left 3.2s ease-in-out infinite;
				filter: drop-shadow(0 3px 6px rgba(249, 115, 22, 0.4));
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
			.room-card::after {
				content: '❄️ ❄️ ❄️';
				position: absolute;
				top: -5px;
				left: 0;
				right: 0;
				text-align: center;
				font-size: 20px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
				animation: winter-snow 6s ease-in-out infinite;
				filter: drop-shadow(0 0 8px rgba(147, 197, 253, 0.8));
			}
			@keyframes winter-snow {
				0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
				25% { transform: translateY(2px) rotate(90deg); opacity: 0.7; }
				50% { transform: translateY(0) rotate(180deg); opacity: 0.5; }
				75% { transform: translateY(2px) rotate(270deg); opacity: 0.7; }
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

			/* Hängende Dekorationen - Geschenk rechts */
			.card-content::after {
				content: '🎁';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 22px;
				z-index: 16;
				pointer-events: none;
				animation: hanging-swing-right 3s ease-in-out infinite;
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
			@keyframes hanging-swing-left {
				0%, 100% { transform: translateX(-50%) rotate(-3deg); }
				50% { transform: translateX(-50%) rotate(3deg); }
			}
			@keyframes hanging-swing-right {
				0%, 100% { transform: translateX(50%) rotate(3deg); }
				50% { transform: translateX(50%) rotate(-3deg); }
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

			/* Hängende Dekorationen - Kürbis links */
			.card-content::before {
				content: '🎃';
				position: absolute;
				bottom: -35px;
				left: 15%;
				transform: translateX(-50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: halloween-hang-left 2.8s ease-in-out infinite;
				filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.8));
				/* Spinnenfaden */
				border-top: 2px dashed rgba(124, 58, 237, 0.5);
				padding-top: 8px;
			}

			/* Hängende Dekorationen - Kürbis rechts */
			.card-content::after {
				content: '🎃';
				position: absolute;
				bottom: -35px;
				right: 15%;
				transform: translateX(50%);
				font-size: 24px;
				z-index: 16;
				pointer-events: none;
				animation: halloween-hang-right 3.2s ease-in-out infinite;
				filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.8));
				/* Spinnenfaden */
				border-top: 2px dashed rgba(124, 58, 237, 0.5);
				padding-top: 8px;
			}

			@keyframes halloween-spook {
				0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
				50% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.05); }
			}
			@keyframes halloween-hang-left {
				0%, 100% { transform: translateX(-50%) rotate(-5deg); }
				50% { transform: translateX(-50%) rotate(5deg); }
			}
			@keyframes halloween-hang-right {
				0%, 100% { transform: translateX(50%) rotate(5deg); }
				50% { transform: translateX(50%) rotate(-5deg); }
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
			@keyframes rainbow-shift {
				0% { filter: hue-rotate(0deg); }
				100% { filter: hue-rotate(360deg); }
			}
			@keyframes rainbow-float {
				0%, 100% { transform: translate(-50%, -50%) scale(1); }
				50% { transform: translate(-50%, -48%) scale(1.05); }
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
			@keyframes nature-grow {
				0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
				50% { transform: translateY(-3px) scale(1.05); opacity: 0.6; }
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
