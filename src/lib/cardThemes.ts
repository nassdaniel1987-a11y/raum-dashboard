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
				content: '🌸';
				position: absolute;
				top: 8px;
				right: 12px;
				font-size: 16px;
				opacity: 0.55;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '🐞';
				position: absolute;
				top: 50%;
				left: 8px;
				transform: translateY(-50%);
				font-size: 16px;
				opacity: 0.9;
				pointer-events: none;
				z-index: 10;
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
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
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
				left: 8px;
				font-size: 18px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
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
				top: 6px;
				left: 8px;
				right: 8px;
				text-align: center;
				font-size: 14px;
				letter-spacing: 12px;
				opacity: 0.75;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '❄️';
				position: absolute;
				top: 50%;
				right: 10px;
				transform: translateY(-50%);
				font-size: 18px;
				opacity: 0.7;
				pointer-events: none;
				z-index: 10;
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
				top: 4px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 16px;
				opacity: 0.6;
				pointer-events: none;
				z-index: 1;
				white-space: nowrap;
			}
			.room-header::before {
				content: '💡💡💡💡💡';
				position: absolute;
				top: 4px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 12px;
				letter-spacing: 8px;
				opacity: 0.85;
				pointer-events: none;
				z-index: 2;
				white-space: nowrap;
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
				bottom: 4px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 16px;
				opacity: 0.6;
				pointer-events: none;
				z-index: 1;
				white-space: nowrap;
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
				font-size: 22px;
				opacity: 0.25;
				pointer-events: none;
				z-index: 1;
				white-space: nowrap;
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
				opacity: 0.18;
				pointer-events: none;
				z-index: 1;
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
				bottom: 4px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 16px;
				opacity: 0.5;
				pointer-events: none;
				z-index: 1;
				white-space: nowrap;
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
			.room-card::after {
				content: '🎊';
				position: absolute;
				top: 4px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 16px;
				opacity: 0.7;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '🕯️';
				position: absolute;
				top: 50%;
				right: 10px;
				transform: translateY(-50%);
				font-size: 18px;
				z-index: 10;
				pointer-events: none;
				filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
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
			.room-card::after {
				content: '✨';
				position: absolute;
				top: 18%;
				right: 18%;
				font-size: 20px;
				opacity: 0.8;
				pointer-events: none;
				z-index: 1;
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
			.room-card::after {
				content: '🌊';
				position: absolute;
				bottom: 5px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 18px;
				opacity: 0.4;
				pointer-events: none;
				z-index: 1;
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
			.room-card::after {
				content: '💕';
				position: absolute;
				bottom: 10px;
				left: 18%;
				font-size: 16px;
				opacity: 0.85;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '💖';
				position: absolute;
				top: 10px;
				right: 18%;
				font-size: 16px;
				opacity: 0.85;
				pointer-events: none;
				z-index: 1;
				filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.5));
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
			}
			.room-card::before {
				background: radial-gradient(
					circle at 50% 50%,
					rgba(168, 85, 247, 0.15) 0%,
					rgba(139, 92, 246, 0.1) 50%,
					transparent 100%
				);
			}
			.room-card::after {
				content: '🎵';
				position: absolute;
				top: 18%;
				left: 10%;
				font-size: 18px;
				opacity: 0.85;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '🎶';
				position: absolute;
				top: 28%;
				right: 12%;
				font-size: 16px;
				opacity: 0.85;
				pointer-events: none;
				z-index: 1;
				filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.4));
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
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(34, 197, 94, 0.15) 0%,
					rgba(22, 163, 74, 0.1) 50%,
					rgba(74, 222, 128, 0.12) 100%
				);
			}
			.room-card::after {
				content: '⚽';
				position: absolute;
				top: 12px;
				right: 12px;
				font-size: 22px;
				opacity: 0.75;
				pointer-events: none;
				z-index: 1;
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
			.room-card::after {
				content: '☁️';
				position: absolute;
				top: 14%;
				left: 50%;
				transform: translateX(-50%);
				font-size: 14px;
				opacity: 0.55;
				pointer-events: none;
				z-index: 1;
			}
			.room-header::before {
				content: '☕';
				position: absolute;
				top: 50%;
				right: 10px;
				transform: translateY(-50%);
				font-size: 18px;
				z-index: 10;
				pointer-events: none;
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
