// Theme-Definitionen für das Raum-Dashboard

export interface ThemeColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	headerBg: string;
	toolbarBg: string;
	cardBg: string;
	textPrimary: string;
	textSecondary: string;
	openBadge: string;
	closedBadge: string;
	timeBadge: string;
}

export interface ThemeConfig {
	id: string;
	name: string;
	emoji: string;
	colors: ThemeColors;
	backgroundImageUrl?: string | null;
	customStyles?: string;
}

export const themes: Record<string, ThemeConfig> = {
	default: {
		id: 'default',
		name: '🖤 Default',
		emoji: '🖤',
		colors: {
			primary: '#6b7280',
			secondary: '#4b5563',
			accent: '#9ca3af',
			background: '#000000',
			headerBg: '#1a1a1a',
			toolbarBg: '#1a1a1a',
			cardBg: '#2d2d2d',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.85)',
			openBadge: 'rgba(34, 197, 94, 0.9)',
			closedBadge: 'rgba(239, 68, 68, 0.9)',
			timeBadge: 'rgba(156, 163, 175, 0.9)'
		},
		backgroundImageUrl: null
	},

	space: {
		id: 'space',
		name: '🚀 Weltraum',
		emoji: '🌌',
		colors: {
			primary: '#667eea',
			secondary: '#764ba2',
			accent: '#3b82f6',
			background: '#0a0a1e',
			headerBg: '#1a1a2e',
			toolbarBg: '#1a1a2e',
			cardBg: '#1e3a8a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(34, 197, 94, 0.9)',
			closedBadge: 'rgba(239, 68, 68, 0.9)',
			timeBadge: 'rgba(251, 146, 60, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/space-background.png'
	},

	dino: {
		id: 'dino',
		name: '🦖 Dino-Land',
		emoji: '🦕',
		colors: {
			primary: '#22c55e',
			secondary: '#16a34a',
			accent: '#84cc16',
			background: '#0d1f0d',
			headerBg: '#1a3a1a',
			toolbarBg: '#1a3a1a',
			cardBg: '#166534',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(132, 204, 22, 0.9)',
			closedBadge: 'rgba(220, 38, 38, 0.9)',
			timeBadge: 'rgba(234, 179, 8, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/dino-background.png'
	},

	ocean: {
		id: 'ocean',
		name: '🌊 Ozean',
		emoji: '🐠',
		colors: {
			primary: '#06b6d4',
			secondary: '#0891b2',
			accent: '#0ea5e9',
			background: '#0a1929',
			headerBg: '#0c2340',
			toolbarBg: '#0c2340',
			cardBg: '#155e75',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(6, 182, 212, 0.9)',
			closedBadge: 'rgba(225, 29, 72, 0.9)',
			timeBadge: 'rgba(251, 191, 36, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/ocean-background.png'
	},

	pokemon: {
		id: 'pokemon',
		name: '⚡ Pokémon',
		emoji: '⚡',
		colors: {
			primary: '#eab308',
			secondary: '#f59e0b',
			accent: '#ef4444',
			background: '#1a0505',
			headerBg: '#450a0a',
			toolbarBg: '#450a0a',
			cardBg: '#991b1b',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(234, 179, 8, 0.9)',
			closedBadge: 'rgba(127, 29, 29, 0.9)',
			timeBadge: 'rgba(239, 68, 68, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/pokemon-background.png'
	},

	minecraft: {
		id: 'minecraft',
		name: '⛏️ Minecraft',
		emoji: '🧱',
		colors: {
			primary: '#84cc16',
			secondary: '#65a30d',
			accent: '#a3e635',
			background: '#0f1a0a',
			headerBg: '#1c2817',
			toolbarBg: '#1c2817',
			cardBg: '#3f6212',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(132, 204, 22, 0.9)',
			closedBadge: 'rgba(153, 27, 27, 0.9)',
			timeBadge: 'rgba(217, 119, 6, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/minecraft-background.png'
	},

	pippi: {
		id: 'pippi',
		name: '🎨 Pippi Langstrumpf',
		emoji: '🦋',
		colors: {
			primary: '#f97316',
			secondary: '#ea580c',
			accent: '#fb923c',
			background: '#1a0f0a',
			headerBg: '#3d1f0a',
			toolbarBg: '#3d1f0a',
			cardBg: '#c2410c',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(251, 146, 60, 0.9)',
			closedBadge: 'rgba(185, 28, 28, 0.9)',
			timeBadge: 'rgba(245, 158, 11, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/pippi-background.png'
	},

	candyland: {
		id: 'candyland',
		name: '🍭 Candyland',
		emoji: '🍬',
		colors: {
			primary: '#ec4899',
			secondary: '#db2777',
			accent: '#f472b6',
			background: '#1a0a14',
			headerBg: '#3d0a2e',
			toolbarBg: '#3d0a2e',
			cardBg: '#be185d',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(236, 72, 153, 0.9)',
			closedBadge: 'rgba(190, 18, 60, 0.9)',
			timeBadge: 'rgba(244, 114, 182, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/candyland-background.png'
	},

	basketball: {
		id: 'basketball',
		name: '🏀 Basketball',
		emoji: '🏀',
		colors: {
			primary: '#f97316',
			secondary: '#ea580c',
			accent: '#fb923c',
			background: '#1a0905',
			headerBg: '#431407',
			toolbarBg: '#431407',
			cardBg: '#9a3412',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(34, 197, 94, 0.9)',
			closedBadge: 'rgba(153, 27, 27, 0.9)',
			timeBadge: 'rgba(251, 191, 36, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/basketball-background.png'
	},

	weihnachten: {
		id: 'weihnachten',
		name: '🎄 Weihnachten',
		emoji: '🎄',
		colors: {
			primary: '#dc2626',
			secondary: '#22c55e',
			accent: '#fbbf24',
			background: '#0a0f0a',
			headerBg: '#1a1f1a',
			toolbarBg: '#1a1f1a',
			cardBg: '#7f1d1d',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(34, 197, 94, 0.9)',
			closedBadge: 'rgba(127, 29, 29, 0.9)',
			timeBadge: 'rgba(251, 191, 36, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/w.png'
	},

	wald: {
		id: 'wald',
		name: '🌲 Wald',
		emoji: '🌲',
		colors: {
			primary: '#22c55e',
			secondary: '#15803d',
			accent: '#4ade80',
			background: '#0d1f0d',
			headerBg: '#1a2e1a',
			toolbarBg: '#1a2e1a',
			cardBg: '#1a3a2a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(74, 222, 128, 0.9)',
			closedBadge: 'rgba(185, 28, 28, 0.9)',
			timeBadge: 'rgba(163, 230, 53, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/wald%20(1).png'
	},

	sonnenuntergang: {
		id: 'sonnenuntergang',
		name: '🌅 Sonnenuntergang',
		emoji: '🌅',
		colors: {
			primary: '#f97316',
			secondary: '#c2574a',
			accent: '#fb923c',
			background: '#1a0a1e',
			headerBg: '#2a1028',
			toolbarBg: '#2a1028',
			cardBg: '#4a1942',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(251, 146, 60, 0.9)',
			closedBadge: 'rgba(159, 18, 57, 0.9)',
			timeBadge: 'rgba(253, 186, 116, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/sonnenuntergang%20(1).png'
	},

	morgengrauen: {
		id: 'morgengrauen',
		name: '🌄 Morgengrauen',
		emoji: '🌄',
		colors: {
			primary: '#818cf8',
			secondary: '#6366f1',
			accent: '#a5b4fc',
			background: '#0a0e2a',
			headerBg: '#1a1a3a',
			toolbarBg: '#1a1a3a',
			cardBg: '#2a2a5a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(129, 140, 248, 0.9)',
			closedBadge: 'rgba(127, 29, 29, 0.9)',
			timeBadge: 'rgba(196, 181, 253, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/Morgengraun%20(1).png'
	},

	bergsee: {
		id: 'bergsee',
		name: '🏔️ Bergsee',
		emoji: '🏔️',
		colors: {
			primary: '#38bdf8',
			secondary: '#0284c7',
			accent: '#7dd3fc',
			background: '#1a1e2a',
			headerBg: '#1e2a3a',
			toolbarBg: '#1e2a3a',
			cardBg: '#2a3a4a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(56, 189, 248, 0.9)',
			closedBadge: 'rgba(153, 27, 27, 0.9)',
			timeBadge: 'rgba(125, 211, 252, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/Bergsee%20(1).png'
	},

	lavendel: {
		id: 'lavendel',
		name: '💜 Lavendel',
		emoji: '💜',
		colors: {
			primary: '#a78bfa',
			secondary: '#7c3aed',
			accent: '#c4b5fd',
			background: '#1a0f2a',
			headerBg: '#221538',
			toolbarBg: '#221538',
			cardBg: '#2e1f4a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(167, 139, 250, 0.9)',
			closedBadge: 'rgba(159, 18, 57, 0.9)',
			timeBadge: 'rgba(196, 181, 253, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/Lavendel%20(1).png'
	},

	aurora: {
		id: 'aurora',
		name: '🌌 Nordlicht',
		emoji: '🌌',
		colors: {
			primary: '#2dd4bf',
			secondary: '#0d9488',
			accent: '#5eead4',
			background: '#0a0f1a',
			headerBg: '#0f1a2a',
			toolbarBg: '#0f1a2a',
			cardBg: '#0a3a3a',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(45, 212, 191, 0.9)',
			closedBadge: 'rgba(153, 27, 27, 0.9)',
			timeBadge: 'rgba(94, 234, 212, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/Aurora%20(1).png'
	},

	musik: {
		id: 'musik',
		name: '🎵 Musik',
		emoji: '🎵',
		colors: {
			primary: '#a855f7',
			secondary: '#9333ea',
			accent: '#c084fc',
			background: '#0f0514',
			headerBg: '#2e1065',
			toolbarBg: '#2e1065',
			cardBg: '#6b21a8',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(168, 85, 247, 0.9)',
			closedBadge: 'rgba(107, 33, 168, 0.9)',
			timeBadge: 'rgba(192, 132, 252, 0.95)'
		},
		backgroundImageUrl: 'https://yxmdhkpnyjmhmggbptjm.supabase.co/storage/v1/object/public/theme-backgrounds/musik-background.png'
	}
};

export function getTheme(themeId: string): ThemeConfig {
	return themes[themeId] || themes.default;
}

export function applyTheme(themeId: string) {
	const theme = getTheme(themeId);
	const root = document.documentElement;

	// CSS Custom Properties setzen
	root.style.setProperty('--color-primary', theme.colors.primary);
	root.style.setProperty('--color-secondary', theme.colors.secondary);
	root.style.setProperty('--color-accent', theme.colors.accent);
	root.style.setProperty('--color-background', theme.colors.background);
	root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
	root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
	root.style.setProperty('--color-open-badge', theme.colors.openBadge);
	root.style.setProperty('--color-closed-badge', theme.colors.closedBadge);
	root.style.setProperty('--color-time-badge', theme.colors.timeBadge);
	root.style.setProperty('--header-bg', theme.colors.headerBg);
	root.style.setProperty('--toolbar-bg', theme.colors.toolbarBg);
	root.style.setProperty('--card-bg', theme.colors.cardBg);

	// Hintergrundbild setzen (falls vorhanden)
	const body = document.body;
	if (theme.backgroundImageUrl) {
		// Erst Hintergrundfarbe setzen als Fallback
		body.style.backgroundColor = theme.colors.background;
		
		// Dann Hintergrundbild setzen
		body.style.backgroundImage = `url('${theme.backgroundImageUrl}')`;
		body.style.backgroundSize = 'cover';
		body.style.backgroundPosition = 'center';
		body.style.backgroundAttachment = 'fixed';
		body.style.backgroundRepeat = 'no-repeat';
		
		console.log(`🖼️ Hintergrundbild geladen: ${theme.backgroundImageUrl}`);
	} else {
		// Kein Bild - nur Hintergrundfarbe
		body.style.backgroundImage = 'none';
		body.style.backgroundColor = theme.colors.background;
		
		console.log(`🎨 Nur Hintergrundfarbe: ${theme.colors.background}`);
	}

	// Theme-Klasse am Body setzen
	document.body.className = '';
	document.body.classList.add(`theme-${theme.id}`);

	console.log(`🎨 Theme "${theme.name}" aktiviert`);
}