# Hintergrundbild-Prompts für Raum-Dashboard Themes

Diese Prompts kannst du in einem KI-Bildgenerator (wie DALL-E, Midjourney, Stable Diffusion) verwenden, um passende Hintergrundbilder für die Themes zu erstellen.

**Stil:** Cartoon/Illustration für Grundschulkinder - freundlich, verspielt, kindgerecht
**Format:** 1920x1080px (16:9)

---

## ⚽ Fußball Theme
**Dateiname:** `fussball-background.png`

**Prompt:**
```
Cute cartoon soccer/football field illustration for kids, viewed from ground level. Bright green striped grass (#22c55e, #16a34a) with white field lines. A smiling cartoon soccer ball with big eyes sitting on the grass. Cute clouds in the sky, cartoon sun shining. Friendly goal posts in the background. Colorful cartoon style like a children's book illustration. Warm and inviting, not too dark. Simple shapes, bold outlines. Perfect for elementary school kids. Fun and playful atmosphere. 1920x1080px, digital illustration.
```

**Alternative:**
```
Whimsical cartoon soccer stadium scene for children. Green grass field with gentle hills in background. Cute animated soccer balls bouncing around. Friendly cartoon referee whistle and colorful soccer jerseys floating in the air. Bright green tones (#22c55e) with sunny yellow accents (#fbbf24). Kids illustration style, very friendly and welcoming. No scary elements. 1920x1080px.
```

---

## 🤾 Handball Theme
**Dateiname:** `handball-background.png`

**Prompt:**
```
Playful cartoon handball court for kids. Indoor gym with red and orange tones (#ef4444, #fca5a5). Cute smiling handball with big friendly eyes in the center. Simple geometric court lines on wooden floor. Colorful banners and flags hanging from ceiling. Cheerful and energetic but not aggressive. Illustration style like a children's sports book. Bright, warm colors. Perfect for elementary school. No dark shadows. 1920x1080px, digital art.
```

**Alternative:**
```
Fun cartoon handball scene with cute animated handball characters jumping and playing. Red and orange color scheme (#dc2626, #fb923c) with yellow accents. Simple gym background with happy faces on the walls. Kid-friendly illustration style with bold colors and simple shapes. Inviting and motivating for young children. 1920x1080px.
```

---

## 🏀 Basketball Theme
**Dateiname:** `basketball-background.png`

**Prompt:**
```
Cheerful cartoon basketball court for kids. Wooden floor with orange and brown tones (#f97316, #fb923c). Cute smiling basketball with big friendly eyes. Cartoon basketball hoop with a net that looks happy. Stars and sparkles around the ball. Bright sunny atmosphere with warm orange glow. Children's book illustration style. Playful and welcoming, not intimidating. Bold outlines, simple shapes. Perfect for elementary school kids. 1920x1080px, digital illustration.
```

**Alternative:**
```
Fun cartoon outdoor basketball playground. Orange sunset sky (#ea580c) with friendly clouds. Cute basketball characters playing. Colorful street art on walls in background. Urban but kid-friendly and safe-looking. Warm inviting colors. Simple illustration style for children. 1920x1080px.
```

---

## 🎄 Weihnachten Theme
**Dateiname:** `weihnachten-background.png`

**Prompt:**
```
Magical cartoon Christmas scene for children. Cute decorated Christmas tree with smiling ornaments and twinkling lights. Friendly snowman and reindeer characters. Gentle snowflakes falling. Red (#dc2626), green (#22c55e), and gold (#fbbf24) color scheme. Cozy wooden cabin with warm glowing windows in background. Starry night sky. Whimsical children's book illustration style. Warm, inviting, and festive. No scary elements. Perfect for elementary school. 1920x1080px, digital art.
```

**Alternative:**
```
Cute cartoon Santa's workshop interior. Friendly elves working on toys. Big Christmas tree in corner with presents underneath. Red and green decorations everywhere. Warm fireplace glowing. Colorful stockings hanging. Everything has a happy face - even the presents smile! Kid-friendly illustration style. Bright, cheerful, festive atmosphere. 1920x1080px.
```

---

## 🎵 Musik Theme
**Dateiname:** `musik-background.png`

**Prompt:**
```
Playful cartoon music scene for kids. Cute animated musical instruments with happy faces - smiling guitar, drums, keyboard. Musical notes floating in the air with big friendly eyes. Purple and pink color scheme (#a855f7, #c084fc) with sparkles and stars. Cartoon stage with colorful spotlights. Fun concert atmosphere but kid-friendly, not too dark or loud. Children's illustration style with bold colors and simple shapes. Cheerful and inviting. Perfect for elementary school. 1920x1080px, digital art.
```

**Alternative:**
```
Whimsical music classroom illustration. Cute cartoon instruments dancing around - violin, trumpet, xylophone all with smiling faces. Musical staff lines with notes bouncing along. Purple gradient background (#9333ea to #c084fc) with stars. Bright and colorful. Simple cartoon style for children. Happy and encouraging atmosphere. 1920x1080px.
```

---

## 📝 Technische Anforderungen

- **Auflösung:** 1920x1080px (Full HD)
- **Format:** PNG (für Transparenz) oder JPG (kleinere Dateigröße)
- **Dateiname:** Exakt wie oben angegeben (z.B. `fussball-background.png`)
- **Farbpalette:** Die genannten Hex-Codes sollten im Bild vorkommen
- **Stil:** Cartoon/Illustration für Grundschulkinder
- **Details:** Nicht zu ablenkend - dient als Hintergrund für eine App

## 🎨 Wichtige Stil-Merkmale

**Passend zu existierenden Themes (Weltraum, Dino, Ozean, etc.):**
- ✅ **Cartoon/Comic-Stil** - wie Kinderbuch-Illustrationen
- ✅ **Freundliche Gesichter** - Objekte mit Augen und Lächeln
- ✅ **Helle, fröhliche Farben** - nicht zu dunkel oder gruselig
- ✅ **Einfache Formen** - klar erkennbare Objekte
- ✅ **Verspielt und einladend** - motivierend für Kinder
- ✅ **Keine realistischen/erwachsenen Elemente**

**Vermeide:**
- ❌ Photorealistische/düstere Darstellungen
- ❌ Zu viele Details oder komplexe Szenen
- ❌ Aggressive oder einschüchternde Elemente
- ❌ Zu dunkle Atmosphäre

## 🚀 Nächste Schritte

1. Wähle für jedes Theme einen Prompt (Haupt- oder Alternative)
2. Generiere die Bilder mit einem KI-Tool
3. Speichere sie mit den exakten Dateinamen
4. Lade sie in Supabase Storage hoch (`theme-backgrounds` Bucket)
5. Aktualisiere die `backgroundImageUrl` in `src/lib/themes.ts` mit den URLs
