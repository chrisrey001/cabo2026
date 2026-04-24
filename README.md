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

All 11 sections, sticky-nav tracked:

1. **Hero** — full-viewport gradient, live countdown to 2026-06-14 09:25 MDT, 5-click confetti
2. **The Cast** — editable, Supabase-backed couple cards with confirm toggles
3. **The Villa** — static Palmilla Enclave summary with amenities grid
4. **Flights** — editable, Supabase-backed per-couple outbound + return legs
5. **Weather** — static 7-day forecast + stats row
6. **Map** — Google Maps embed + 10 place cards linking out to Google Maps
7. **Activities** — expandable accordion of the top 5 experiences
8. **Itinerary** — Supabase-backed day-by-day accordion with timeline events
9. **Dining Guide** — sortable cards with tap-to-call and directions
10. **Logistics** — expandable cards; phone numbers get inline copy buttons
11. **Let's Go** — gradient footer with confetti "I'm In" button
