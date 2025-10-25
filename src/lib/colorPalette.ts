// Vordefinierte Farbpalette für Raum-Kacheln
// 30 sorgfältig ausgewählte Farben für optimale Lesbarkeit

export interface ColorOption {
	name: string;
	value: string;
	category: 'warm' | 'cold' | 'neutral' | 'vibrant';
}

export const colorPalette: ColorOption[] = [
	// Warm (Rot, Orange, Gelb)
	{ name: 'Rot', value: '#ef4444', category: 'warm' },
	{ name: 'Dunkelrot', value: '#dc2626', category: 'warm' },
	{ name: 'Rosa', value: '#ec4899', category: 'warm' },
	{ name: 'Orange', value: '#f97316', category: 'warm' },
	{ name: 'Dunkelorange', value: '#ea580c', category: 'warm' },
	{ name: 'Gelb', value: '#eab308', category: 'warm' },
	{ name: 'Amber', value: '#f59e0b', category: 'warm' },
	
	// Kalt (Blau, Türkis, Lila)
	{ name: 'Hellblau', value: '#3b82f6', category: 'cold' },
	{ name: 'Blau', value: '#2563eb', category: 'cold' },
	{ name: 'Dunkelblau', value: '#1e40af', category: 'cold' },
	{ name: 'Cyan', value: '#06b6d4', category: 'cold' },
	{ name: 'Türkis', value: '#14b8a6', category: 'cold' },
	{ name: 'Lila', value: '#a855f7', category: 'cold' },
	{ name: 'Violett', value: '#8b5cf6', category: 'cold' },
	{ name: 'Indigo', value: '#6366f1', category: 'cold' },
	
	// Grün
	{ name: 'Hellgrün', value: '#84cc16', category: 'vibrant' },
	{ name: 'Grün', value: '#22c55e', category: 'vibrant' },
	{ name: 'Smaragd', value: '#10b981', category: 'vibrant' },
	{ name: 'Dunkelgrün', value: '#16a34a', category: 'vibrant' },
	{ name: 'Mint', value: '#6ee7b7', category: 'vibrant' },
	
	// Neutral
	{ name: 'Grau', value: '#6b7280', category: 'neutral' },
	{ name: 'Dunkelgrau', value: '#4b5563', category: 'neutral' },
	{ name: 'Slate', value: '#64748b', category: 'neutral' },
	{ name: 'Braun', value: '#92400e', category: 'neutral' },
	{ name: 'Beige', value: '#d97706', category: 'neutral' },
	
	// Vibrant
	{ name: 'Pink', value: '#db2777', category: 'vibrant' },
	{ name: 'Magenta', value: '#c026d3', category: 'vibrant' },
	{ name: 'Fuchsia', value: '#e879f9', category: 'vibrant' },
	{ name: 'Lime', value: '#a3e635', category: 'vibrant' },
	{ name: 'Teal', value: '#0d9488', category: 'vibrant' }
];

export function getColorName(hexColor: string): string {
	const color = colorPalette.find(c => c.value.toLowerCase() === hexColor.toLowerCase());
	return color ? color.name : 'Eigene Farbe';
}

export function getColorsByCategory(category: ColorOption['category']): ColorOption[] {
	return colorPalette.filter(c => c.category === category);
}