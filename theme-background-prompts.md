# Hintergrundbild-Prompts für Raum-Dashboard Themes

Diese Prompts kannst du in einem KI-Bildgenerator (wie DALL-E, Midjourney, Stable Diffusion) verwenden, um passende Hintergrundbilder für die Themes zu erstellen.

**Stil:** Cartoon/Illustration für Grundschulkinder - freundlich, verspielt, kindgerecht
**Format:** 1920x1080px (16:9)

---

## ⚽ Fußball Theme
**Dateiname:** `fussball-background.png`

**Prompt:**
```
Cartoon soccer/football field illustration, viewed from ground level. Bright green striped grass (#22c55e, #16a34a) with white field lines. Soccer ball in the foreground with goal posts in the background. Blue sky with fluffy clouds. Clean cartoon style with bold outlines and simple shapes. Colorful and inviting, good for elementary school. Playful sports atmosphere. Not too cute, more cool and sporty. 1920x1080px, digital illustration.
```

**Alternative:**
```
Stylized cartoon soccer stadium scene. Green grass field with stadium in background. Soccer balls and jerseys floating in dynamic composition. Bright green tones (#22c55e) with sunny yellow accents (#fbbf24). Modern kids illustration style, energetic and motivating. Bold colors, simple forms. 1920x1080px.
```

---

## 🤾 Handball Theme
**Dateiname:** `handball-background.png`

**Prompt:**
```
Cartoon handball court illustration. Indoor gym with red and orange tones (#ef4444, #fca5a5). Handball in dynamic motion in the center. Simple geometric court lines on wooden floor. Banners and flags hanging from ceiling. Energetic sports atmosphere. Clean illustration style with bold colors and simple shapes. Good for elementary school. Bright, warm colors. Not too childish, more sporty and cool. 1920x1080px, digital art.
```

**Alternative:**
```
Stylized cartoon handball scene. Red and orange color scheme (#dc2626, #fb923c) with yellow accents. Handballs in motion, jerseys, and gym equipment in dynamic composition. Modern kids illustration style with bold colors and simple forms. Energetic and motivating. 1920x1080px.
```

---

## 🏀 Basketball Theme
**Dateiname:** `basketball-background.png`

**Prompt:**
```
Cartoon basketball court illustration. Wooden floor with orange and brown tones (#f97316, #fb923c). Basketball in motion toward the hoop. Stars and sparkles around the ball showing action. Bright sunny atmosphere with warm orange glow. Clean cartoon style with bold outlines and simple shapes. Sporty and cool vibe for elementary school. Not too childish. 1920x1080px, digital illustration.
```

**Alternative:**
```
Stylized cartoon basketball playground. Orange sunset sky (#ea580c) with clouds. Basketball court with hoop, balls in dynamic composition. Urban style but kid-friendly. Warm inviting colors. Modern illustration style with bold colors and simple forms. 1920x1080px.
```

---

## 🎄 Weihnachten Theme
**Dateiname:** `weihnachten-background.png`

**Prompt:**
```
Magical cartoon Christmas scene. Decorated Christmas tree with twinkling lights and ornaments. Snowman and reindeer in background. Gentle snowflakes falling. Red (#dc2626), green (#22c55e), and gold (#fbbf24) color scheme. Cozy wooden cabin with warm glowing windows. Starry night sky. Clean cartoon illustration style. Warm, inviting, and festive. Good for elementary school. Not overly childish, more magical and cozy. 1920x1080px, digital art.
```

**Alternative:**
```
Stylized cartoon Christmas living room. Christmas tree with presents, fireplace glowing, stockings hanging. Red and green decorations with golden lights. Warm cozy atmosphere. Modern kids illustration style. Festive and cheerful but not too cute. Bold colors, simple forms. 1920x1080px.
```

---

## 🎵 Musik Theme
**Dateiname:** `musik-background.png`

**Prompt:**
```
Cartoon music scene. Musical instruments - guitar, drums, keyboard in cool arrangement. Musical notes floating in the air with motion trails. Purple and pink color scheme (#a855f7, #c084fc) with sparkles and stars. Cartoon stage with colorful spotlights. Fun concert atmosphere. Clean illustration style with bold colors and simple shapes. Cool and energetic for elementary school. Not too childish, more like a music concert vibe. 1920x1080px, digital art.
```

**Alternative:**
```
Stylized music illustration. Instruments in dynamic composition - violin, trumpet, xylophone. Musical staff lines with notes in motion. Purple gradient background (#9333ea to #c084fc) with stars. Modern kids illustration style. Cool and encouraging atmosphere. Bold colors, simple forms. 1920x1080px.
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
- ✅ **Cartoon/Illustration-Stil** - modern und clean
- ✅ **Cool und sporty** - nicht zu niedlich oder babyish
- ✅ **Helle, lebendige Farben** - energiegeladen
- ✅ **Einfache, klare Formen** - bold outlines
- ✅ **Dynamisch und einladend** - motivierend für Grundschüler
- ✅ **Kein Fotorealismus** - aber auch nicht zu comic-mäßig

**Vermeide:**
- ❌ Zu viele lächelnde Gesichter auf allen Objekten
- ❌ Zu niedlich/babyish (kein "cute overload")
- ❌ Photorealistische/düstere Darstellungen
- ❌ Zu komplexe Details oder überladene Szenen
- ❌ Aggressive oder einschüchternde Elemente

## 🚀 Nächste Schritte

1. Wähle für jedes Theme einen Prompt (Haupt- oder Alternative)
2. Generiere die Bilder mit einem KI-Tool
3. Speichere sie mit den exakten Dateinamen
4. Lade sie in Supabase Storage hoch (`theme-backgrounds` Bucket)
5. Aktualisiere die `backgroundImageUrl` in `src/lib/themes.ts` mit den URLs
