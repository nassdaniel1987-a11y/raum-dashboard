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
		borderColor: 'rgba(236, 72, 153, 0.4)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3), 0 2px 16px rgba(134, 239, 172, 0.2)',
		headerGradient: 'linear-gradient(135deg, #86efac 0%, #fda4af 50%, #fbbf24 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(134, 239, 172, 0.98) 0%, rgba(236, 72, 153, 0.98) 100%)',
		personBadgeBorder: 'rgba(236, 72, 153, 0.5)',
		additionalStyles: `
			.room-card::after {
				content: '🌸';
				position: absolute;
				top: 5px;
				left: 5px;
				font-size: 20px;
				opacity: 0.3;
				pointer-events: none;
			}
		`
	},

	sommer: {
		name: 'sommer',
		displayName: 'Sommer',
		emoji: '☀️',
		borderColor: 'rgba(251, 191, 36, 0.5)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4), 0 2px 16px rgba(96, 165, 250, 0.3)',
		headerGradient: 'linear-gradient(135deg, #60a5fa 0%, #fbbf24 50%, #f97316 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.98) 0%, rgba(249, 115, 22, 0.98) 100%)',
		personBadgeBorder: 'rgba(251, 191, 36, 0.6)',
		additionalStyles: `
			.room-card::after {
				content: '☀️';
				position: absolute;
				top: 5px;
				right: 5px;
				font-size: 24px;
				opacity: 0.3;
				pointer-events: none;
			}
		`
	},

	herbst: {
		name: 'herbst',
		displayName: 'Herbst',
		emoji: '🍂',
		borderColor: 'rgba(249, 115, 22, 0.5)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4), 0 2px 16px rgba(161, 98, 7, 0.3)',
		headerGradient: 'linear-gradient(135deg, #a16207 0%, #ea580c 50%, #dc2626 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.98) 0%, rgba(161, 98, 7, 0.98) 100%)',
		personBadgeBorder: 'rgba(249, 115, 22, 0.6)',
		additionalStyles: `
			.room-card::after {
				content: '🍂';
				position: absolute;
				bottom: 5px;
				left: 5px;
				font-size: 20px;
				opacity: 0.3;
				pointer-events: none;
			}
		`
	},

	winter: {
		name: 'winter',
		displayName: 'Winter',
		emoji: '❄️',
		borderColor: 'rgba(147, 197, 253, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(147, 197, 253, 0.5), 0 2px 16px rgba(219, 234, 254, 0.4), 0 0 40px rgba(147, 197, 253, 0.3)',
		headerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #dbeafe 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(147, 197, 253, 0.98) 0%, rgba(59, 130, 246, 0.98) 100%)',
		personBadgeBorder: 'rgba(147, 197, 253, 0.7)',
		additionalStyles: `
			.room-card::after {
				content: '❄️';
				position: absolute;
				top: 5px;
				right: 5px;
				font-size: 24px;
				opacity: 0.4;
				pointer-events: none;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(219, 234, 254, 0.2) 0%,
					rgba(147, 197, 253, 0.1) 50%,
					rgba(59, 130, 246, 0.15) 100%
				);
			}
		`
	},

	weihnachten: {
		name: 'weihnachten',
		displayName: 'Weihnachten',
		emoji: '🎄',
		borderColor: 'rgba(220, 38, 38, 0.5)',
		borderWidth: '4px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4), 0 2px 16px rgba(34, 197, 94, 0.3), 0 0 60px rgba(251, 191, 36, 0.2)',
		headerGradient: 'linear-gradient(135deg, #dc2626 0%, #22c55e 50%, #fbbf24 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.98) 0%, rgba(34, 197, 94, 0.98) 100%)',
		personBadgeBorder: 'rgba(251, 191, 36, 0.7)',
		additionalStyles: `
			.room-card::after {
				content: '🎄';
				position: absolute;
				top: 5px;
				left: 5px;
				font-size: 28px;
				opacity: 0.3;
				pointer-events: none;
			}
			.room-card {
				border-image: linear-gradient(45deg, #dc2626, #22c55e, #fbbf24, #dc2626) 1;
			}
		`
	},

	ostern: {
		name: 'ostern',
		displayName: 'Ostern',
		emoji: '🐰',
		borderColor: 'rgba(196, 181, 253, 0.5)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(196, 181, 253, 0.4), 0 2px 16px rgba(251, 207, 232, 0.3)',
		headerGradient: 'linear-gradient(135deg, #c4b5fd 0%, #fbcfe8 50%, #fef08a 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(196, 181, 253, 0.98) 0%, rgba(251, 207, 232, 0.98) 100%)',
		personBadgeBorder: 'rgba(196, 181, 253, 0.6)',
		additionalStyles: `
			.room-card::after {
				content: '🥚';
				position: absolute;
				bottom: 5px;
				right: 5px;
				font-size: 22px;
				opacity: 0.3;
				pointer-events: none;
			}
		`
	},

	halloween: {
		name: 'halloween',
		displayName: 'Halloween',
		emoji: '🎃',
		borderColor: 'rgba(249, 115, 22, 0.6)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(249, 115, 22, 0.5), 0 2px 16px rgba(109, 40, 217, 0.4), 0 0 50px rgba(0, 0, 0, 0.6)',
		headerGradient: 'linear-gradient(135deg, #1f2937 0%, #7c3aed 50%, #f97316 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.98) 0%, rgba(109, 40, 217, 0.98) 100%)',
		personBadgeBorder: 'rgba(249, 115, 22, 0.7)',
		additionalStyles: `
			.room-card::after {
				content: '🎃';
				position: absolute;
				top: 5px;
				left: 50%;
				transform: translateX(-50%);
				font-size: 26px;
				opacity: 0.3;
				pointer-events: none;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(31, 41, 55, 0.3) 0%,
					rgba(124, 58, 237, 0.2) 50%,
					rgba(249, 115, 22, 0.2) 100%
				);
			}
		`
	},

	regenbogen: {
		name: 'regenbogen',
		displayName: 'Regenbogen',
		emoji: '🌈',
		borderColor: 'transparent',
		borderWidth: '4px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(147, 51, 234, 0.4), 0 2px 16px rgba(59, 130, 246, 0.3)',
		headerGradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 16%, #fbbf24 32%, #84cc16 48%, #10b981 64%, #06b6d4 80%, #8b5cf6 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.98) 0%, rgba(236, 72, 153, 0.98) 100%)',
		personBadgeBorder: 'rgba(167, 139, 250, 0.6)',
		additionalStyles: `
			.room-card {
				border-image: linear-gradient(45deg, #ef4444, #f59e0b, #fbbf24, #84cc16, #10b981, #06b6d4, #8b5cf6, #ef4444) 1;
			}
			.room-card::after {
				content: '🌈';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 40px;
				opacity: 0.15;
				pointer-events: none;
			}
		`
	},

	natur: {
		name: 'natur',
		displayName: 'Natur',
		emoji: '🌿',
		borderColor: 'rgba(34, 197, 94, 0.5)',
		borderWidth: '3px',
		borderStyle: 'solid',
		boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4), 0 2px 16px rgba(132, 204, 22, 0.3)',
		headerGradient: 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #84cc16 100%)',
		personBadgeGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.98) 0%, rgba(22, 101, 52, 0.98) 100%)',
		personBadgeBorder: 'rgba(34, 197, 94, 0.6)',
		additionalStyles: `
			.room-card::after {
				content: '🌿';
				position: absolute;
				bottom: 5px;
				right: 5px;
				font-size: 22px;
				opacity: 0.3;
				pointer-events: none;
			}
			.room-card::before {
				background: linear-gradient(
					135deg,
					rgba(34, 197, 94, 0.15) 0%,
					rgba(132, 204, 22, 0.1) 50%,
					rgba(22, 101, 52, 0.15) 100%
				);
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
