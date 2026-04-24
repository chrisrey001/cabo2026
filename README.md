# cabo2026

A fun, editable, collaborative web app for our Cabo 2026 family trip —
live countdown, editable guest list, flight details, itinerary, dining
guide, and more. Built with React + Vite, backed by Supabase, hosted
on Netlify.

> 📍 June 14–20, 2026 · Los Cabos, Mexico · Villa Dos Mares, Palmilla Enclave

## Tech stack

- **Vite + React 18** — SPA build, zero config
- **Supabase** — Postgres + auto REST APIs for the three editable tables (`guests`, `flights`, `days`)
- **Netlify** — auto-deploys from `main`
- **lucide-react** — icons · **canvas-confetti** — celebration bursts
- **Google Fonts** — Playfair Display, Manrope, DM Mono

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the two Supabase values below
npm run dev               # http://localhost:5173
```

Fill `.env` with:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

You can find both in your Supabase dashboard under
**Project Settings → API Keys** (use the *publishable* key, not secret)
and **Project Settings → Data API** (for the URL).

Without Supabase configured the app still runs — edits just stay
in memory and the nav badge shows `local` instead of `synced`.

## Supabase setup

First-time setup: open the Supabase **SQL Editor** and run the contents
of [`supabase/schema.sql`](supabase/schema.sql). It creates the three
tables (`guests`, `flights`, `days`) and wide-open RLS policies suitable
for a private trip site.

The schema is idempotent — safe to re-run as it grows. New columns go
in as `add column if not exists` statements.

## Deployment

Push to `main` → Netlify builds and deploys automatically. Build config
lives in [`netlify.toml`](netlify.toml) (`npm run build` → `dist`).

Netlify env vars to set on the site:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Both should be set to **"Same value for all deploy contexts"**.

To roll back a bad deploy: Netlify → Deploys → click the ⋯ menu on the
last good deploy → **Publish deploy**.

## Project structure

```
cabo2026/
├── src/
│   ├── App.jsx                  # stitches sections together
│   ├── main.jsx                 # React entry
│   ├── theme.js                 # COLORS, FONTS, SECTIONS constants
│   ├── supabase.js              # client (or null if env vars missing)
│   ├── styles.css               # globals, grain overlay, keyframes
│   ├── components/
│   │   ├── Nav.jsx              # sticky glass nav with IntersectionObserver
│   │   ├── SaveBadge.jsx        # local / saving / saved / offline indicator
│   │   ├── EditField.jsx        # inline click-to-edit input
│   │   ├── CountdownUnit.jsx    # DD : HH : MM : SS unit
│   │   └── CopyButton.jsx       # phone-number copy with 2s confirmation
│   └── sections/
│       ├── Hero.jsx             # §1 gradient + countdown
│       ├── Cast.jsx             # §2 guests (Supabase)
│       ├── Villa.jsx            # §3 villa summary
│       ├── Flights.jsx          # §4 flights (Supabase)
│       ├── Weather.jsx          # §5 forecast
│       ├── Map.jsx              # §6 Google Maps + place cards
│       ├── Activities.jsx       # §7 top 5 experiences
│       ├── Itinerary.jsx        # §8 days (Supabase)
│       ├── Dining.jsx           # §9 dining guide
│       ├── Logistics.jsx        # §10 need-to-know
│       └── CTA.jsx              # §11 footer
├── supabase/
│   └── schema.sql               # tables + RLS policies (idempotent)
├── ROADMAP.md                   # what's next
├── netlify.toml                 # Netlify build config
└── index.html                   # Vite entry
```

## Sections

All 11 sections, sticky-nav tracked:

| # | Section | Data source | Notes |
|---|---|---|---|
| 1 | Hero | static | Live countdown · 5-click title = confetti |
| 2 | The Cast | **Supabase** (`guests`) | Editable guest cards, confirm toggle |
| 3 | The Villa | static | Palmilla Enclave summary + amenity grid |
| 4 | Flights | **Supabase** (`flights`) | Editable per-couple outbound + return |
| 5 | Weather | static | 7-day forecast + stats row |
| 6 | Map | static | Google Maps embed + 10 place cards |
| 7 | Activities | static | Top 5 experiences, expandable |
| 8 | Itinerary | **Supabase** (`days`) | Editable day-by-day with timeline events |
| 9 | Dining Guide | static | Sortable cards with tap-to-call + directions |
| 10 | Logistics | static | Expandable cards · phone numbers get copy buttons |
| 11 | Let's Go | static | Gradient footer with confetti "I'm In" button |

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the multi-week feature plan —
live weather, sunrise/sunset, currency converter, group polls,
votable dining & activities, AI-generated experience ideas, an
interactive map, and villa photos.

## License

Private project. Built with love by Chris — see you in Cabo. 🌅
