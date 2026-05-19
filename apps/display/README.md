# Raum Display

Eigenständige TV/iPad-Display-App für das bestehende Raum-Dashboard-Backend.

## Ziel

Diese App ist bewusst keine Admin-Oberfläche. Sie liest die bestehenden Supabase-Daten und die Blitz-Protokoll-Zuordnungen, um eine ruhige Anzeige für TV/iPad zu rendern.

## Environment

Die produktiven Werte müssen aus der bestehenden Netlify-Site `dash-board09` übernommen werden. Keine Secrets committen.

Benötigt:

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
BLITZ_PROTOKOLL_API_URL=
BLITZ_PROTOKOLL_API_KEY=
```

## Lokal

```bash
npm install
npm run dev
npm run check
```

## Netlify

Für eine eigene Netlify-Site:

- Base directory: `apps/display`
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables aus `dash-board09` duplizieren

Die bestehende App im Repo bleibt produktiv unverändert.
