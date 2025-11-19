# Hintergrundbild-Prompts für Raum-Dashboard Themes

Diese Prompts kannst du in einem KI-Bildgenerator (wie DALL-E, Midjourney, Stable Diffusion) verwenden, um passende Hintergrundbilder für die Themes zu erstellen.

**Format:** 1920x1080px (16:9), dunkler Hintergrund, nicht zu ablenkend

---

## ⚽ Fußball Theme
**Dateiname:** `fussball-background.png`

**Prompt:**
```
A dark atmospheric football/soccer stadium background at dusk, viewed from behind one goal looking across the pitch. The grass field has subtle stripe patterns in deep green shades (#0a1f0a, #166534). Gentle stadium lights create a soft glow in the distance. The scene is moody and dramatic with dark green (#14532d) shadows. Low contrast, subtle details, not too bright - designed as an app background. No players, no text. Photorealistic 3D style. Cinematic lighting. 1920x1080px.
```

**Alternative (Comic-Stil):**
```
Cartoon-style football field background, viewed from ground level with bright green grass stripes. A soccer ball in the foreground with a goal post in the background. Dark green atmospheric lighting (#0a1f0a), playful and energetic but not too distracting. Flat design illustration style for kids, clean and minimal. 1920x1080px.
```

---

## 🤾 Handball Theme
**Dateiname:** `handball-background.png`

**Prompt:**
```
A dramatic indoor handball court background with deep red and orange tones (#991b1b, #dc2626). View from behind the goal line looking across the wooden court floor. Subtle court markings visible. Dark atmospheric lighting with red spotlights creating dynamic shadows. The scene has high energy but dark ambiance (#1a0505, #450a0a). Photorealistic 3D rendering. No players, no text. Designed for app background. 1920x1080px.
```

**Alternative (Dynamisch):**
```
Abstract handball-themed background with motion blur effects. Flying handball in mid-air, red and orange energy trails (#ef4444, #fca5a5). Dark background with court floor visible at bottom. Dynamic diagonal composition suggesting speed and power. Modern sports graphic design style. 1920x1080px.
```

---

## 🏀 Basketball Theme
**Dateiname:** `basketball-background.png`

**Prompt:**
```
A moody basketball court at night with orange and brown tones (#9a3412, #f97316). View from baseline looking toward the opposite basket. Polished wooden floor with subtle shine, dark stadium lighting. Basketball hoop silhouette visible in distance. Dramatic orange uplighting from below creating atmospheric shadows. Dark overall ambiance (#1a0905, #431407). Cinematic photorealistic style. No players, no text. 1920x1080px.
```

**Alternative (Urban):**
```
Urban outdoor basketball court at golden hour with street lights. Orange sunset glow (#ea580c, #fb923c) reflecting on dark asphalt. Chain-link fence and city buildings silhouetted in background. Gritty street basketball aesthetic. Dark but warm atmosphere. Realistic photo style. 1920x1080px.
```

---

## 🎄 Weihnachten Theme
**Dateiname:** `weihnachten-background.png`

**Prompt:**
```
A magical Christmas scene with a snow-covered forest at twilight. Deep reds (#7f1d1d, #dc2626) and forest greens (#22c55e) with golden lights (#fbbf24). Decorated Christmas trees with twinkling string lights in the distance. Gentle snowfall, stars visible in dark sky. Cozy warm glow from fairy lights. Dark atmospheric background (#0a0f0a, #1a1f1a) with festive magical feeling. Perfect for children. Illustration style like a Christmas storybook. 1920x1080px.
```

**Alternative (Gemütlich):**
```
Cozy indoor Christmas living room scene from a wide angle. Large Christmas tree with colorful lights on the left, fireplace with stockings on the right. Dark room (#0a0f0a) with warm golden glow from tree lights and fire. Red and green color scheme with golden accents. Soft bokeh lights creating magical atmosphere. Viewed as if standing in the doorway. Photorealistic 3D render, Pixar-style warmth. 1920x1080px.
```

---

## 🎵 Musik Theme
**Dateiname:** `musik-background.png`

**Prompt:**
```
A vibrant concert stage background with purple and pink lighting (#6b21a8, #a855f7, #c084fc). Empty stage with musical instruments silhouettes - keyboard, drum kit, guitars. Dramatic stage lights creating beams through dark atmospheric haze. Purple and magenta color scheme with glowing neon accents. Dark background (#0f0514, #2e1065) with energetic party atmosphere. No people. Modern concert photography style. 1920x1080px.
```

**Alternative (Abstract):**
```
Abstract music visualization with flowing sound waves and musical notes. Purple gradient background (#9333ea to #c084fc) with floating 3D music notes, treble clefs, and staff lines. Particles and energy trails suggesting rhythm and movement. Dark purple atmosphere (#0f0514) with bright neon purple highlights. Modern digital art style, dynamic composition. 1920x1080px.
```

---

## 📝 Technische Anforderungen

- **Auflösung:** 1920x1080px (Full HD)
- **Format:** PNG (für Transparenz) oder JPG (kleinere Dateigröße)
- **Dateiname:** Exakt wie oben angegeben
- **Farbpalette:** Die genannten Hex-Codes sollten im Bild vorkommen
- **Kontrast:** Dunkel genug, damit weißer Text gut lesbar ist
- **Details:** Nicht zu ablenkend - dient als Hintergrund für eine App

## 🎨 Stil-Empfehlungen

**Für Schulkinder (Grundschule):**
- Comic/Cartoon-Stil
- Freundliche, einladende Farben
- Klare, einfache Formen
- Nicht zu dunkel oder düster

**Für ältere Schüler (Weiterführende Schule):**
- Realistischer/Photorealistischer Stil
- Dramatische Beleuchtung
- Cinematic Look
- Moderne Sport-Fotografie Ästhetik

## 🚀 Nächste Schritte

1. Wähle für jedes Theme einen Prompt (Haupt- oder Alternative)
2. Generiere die Bilder mit einem KI-Tool
3. Speichere sie mit den exakten Dateinamen
4. Lade sie in Supabase Storage hoch (`theme-backgrounds` Bucket)
5. Aktualisiere die `backgroundImageUrl` in `src/lib/themes.ts` mit den URLs
