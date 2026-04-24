# cabo2026

A fun, editable, interactive web app for our Cabo 2026 vacation.

## Stack

- Vite + React 18
- Supabase (cast + flights)
- lucide-react icons, canvas-confetti
- Google Fonts: Playfair Display, Manrope, DM Mono

## Getting started

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Without Supabase configured the app still runs — edits just stay in memory and the
nav shows a `local` badge instead of `synced`.

## Supabase schema

See `supabase/schema.sql` for the `cast` and `flights` tables.

## What's built

Chunk 3A — sticky nav + sections 1–6:

1. **Hero** — full-viewport gradient, live countdown to 2026-06-14 09:25 MDT, 5-click confetti
2. **The Cast** — editable, Supabase-backed couple cards with confirm toggles
3. **The Villa** — static Palmilla Enclave summary with amenities grid
4. **Flights** — editable, Supabase-backed per-couple outbound + return legs
5. **Weather** — static 7-day forecast + stats row
6. **Map** — Google Maps embed + 10 place cards linking out to Google Maps

Sections 7–11 (Activities, Itinerary, Dining, Logistics, CTA) come with Chunk 3B.
