// Theme-Definitionen für das Raum-Dashboard

export interface ThemeColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	headerGradient: string;
	toolbarGradient: string;
	cardGradient: string;
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
	backgroundPattern?: string;
	customStyles?: string;
}

export const themes: Record<string, ThemeConfig> = {
	space: {
		id: 'space',
		name: '🚀 Weltraum',
		emoji: '🌌',
		colors: {
			primary: '#667eea',
			secondary: '#764ba2',
			accent: '#3b82f6',
			background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
			headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			toolbarGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			cardGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(34, 197, 94, 0.9)',
			closedBadge: 'rgba(239, 68, 68, 0.9)',
			timeBadge: 'rgba(251, 146, 60, 0.95)'
		},
		backgroundPattern: `
			radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)
		`
	},

	dino: {
		id: 'dino',
		name: '🦖 Dino-Land',
		emoji: '🦕',
		colors: {
			primary: '#22c55e',
			secondary: '#16a34a',
			accent: '#84cc16',
			background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5016 100%)',
			headerGradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
			toolbarGradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
			cardGradient: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(132, 204, 22, 0.9)',
			closedBadge: 'rgba(220, 38, 38, 0.9)',
			timeBadge: 'rgba(234, 179, 8, 0.95)'
		},
		backgroundPattern: `
			radial-gradient(circle at 30% 40%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 70% 70%, rgba(22, 163, 74, 0.15) 0%, transparent 50%)
		`
	},

	ocean: {
		id: 'ocean',
		name: '🌊 Ozean',
		emoji: '🐠',
		colors: {
			primary: '#06b6d4',
			secondary: '#0891b2',
			accent: '#0ea5e9',
			background: 'linear-gradient(135deg, #0c2340 0%, #164e63 100%)',
			headerGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
			toolbarGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
			cardGradient: 'linear-gradient(135deg, #155e75 0%, #0e7490 100%)',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(6, 182, 212, 0.9)',
			closedBadge: 'rgba(225, 29, 72, 0.9)',
			timeBadge: 'rgba(251, 191, 36, 0.95)'
		},
		backgroundPattern: `
			radial-gradient(circle at 25% 35%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
			radial-gradient(circle at 75% 65%, rgba(8, 145, 178, 0.12) 0%, transparent 50%)
		`
	},

	pokemon: {
		id: 'pokemon',
		name: '⚡ Pokémon',
		emoji: '⚡',
		colors: {
			primary: '#eab308',
			secondary: '#f59e0b',
			accent: '#ef4444',
			background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
			headerGradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
			toolbarGradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
			cardGradient: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(234, 179, 8, 0.9)',
			closedBadge: 'rgba(127, 29, 29, 0.9)',
			timeBadge: 'rgba(239, 68, 68, 0.95)'
		},
		backgroundPattern: `
			radial-gradient(circle at 30% 30%, rgba(234, 179, 8, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)
		`
	},

	minecraft: {
		id: 'minecraft',
		name: '⛏️ Minecraft',
		emoji: '🧱',
		colors: {
			primary: '#84cc16',
			secondary: '#65a30d',
			accent: '#a3e635',
			background: 'linear-gradient(135deg, #1c2817 0%, #365314 100%)',
			headerGradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
			toolbarGradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
			cardGradient: 'linear-gradient(135deg, #3f6212 0%, #4d7c0f 100%)',
			textPrimary: '#ffffff',
			textSecondary: 'rgba(255, 255, 255, 0.9)',
			openBadge: 'rgba(132, 204, 22, 0.9)',
			closedBadge: 'rgba(153, 27, 27, 0.9)',
			timeBadge: 'rgba(217, 119, 6, 0.95)'
		},
		backgroundPattern: `
			repeating-linear-gradient(
				0deg,
				rgba(132, 204, 22, 0.03) 0px,
				rgba(132, 204, 22, 0.03) 16px,
				transparent 16px,
				transparent 32px
			),
			repeating-linear-gradient(
				90deg,
				rgba(132, 204, 22, 0.03) 0px,
				rgba(132, 204, 22, 0.03) 16px,
				transparent 16px,
				transparent 32px
			)
		`
	}
};

export function getTheme(themeId: string): ThemeConfig {
	return themes[themeId] || themes.space;
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
	root.style.setProperty('--gradient-header', theme.colors.headerGradient);
	root.style.setProperty('--gradient-toolbar', theme.colors.toolbarGradient);
	root.style.setProperty('--gradient-card', theme.colors.cardGradient);

	if (theme.backgroundPattern) {
		root.style.setProperty('--background-pattern', theme.backgroundPattern);
	}

	// Theme-Klasse am Body setzen
	document.body.className = '';
	document.body.classList.add(`theme-${theme.id}`);

	console.log(`🎨 Theme "${theme.name}" aktiviert`);
}