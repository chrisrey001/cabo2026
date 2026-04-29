# cabo2026

A fun, editable, collaborative web app for our Cabo 2026 family trip —
live countdown, editable guest list, flight details, itinerary, dining
guide, and more. Built with React + Vite, backed by Supabase, hosted
on Netlify.

> 📍 June 14–20, 2026 · Los Cabos, Mexico · Villa Dos Mares, Palmilla Enclave

## Tech stack

- **Vite + React 18** — SPA build, zero config
- **Supabase** — Postgres + auto REST APIs. Tables: `guests`, `flights`, `days`, `polls`, `votes`, `restaurants`, `restaurant_votes`, `activities`, `activity_votes`, `activity_comments`. Per-section voting uses a localStorage `voter_id` UUID — no auth.
- **Netlify** — auto-deploys from `main`
- **Open-Meteo** — live 7-day forecast + sunrise/sunset (no key required)
- **Frankfurter** — USD ↔ MXN currency conversion (no key required)
- **Leaflet + react-leaflet** — interactive map
- **embla-carousel-react** — villa photo carousel
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

First-time setup: open the Supabase **SQL Editor** and run the migration
files in order:

1. [`supabase/schema.sql`](supabase/schema.sql) — base tables (`guests`, `flights`, `days`) and wide-open RLS policies suitable for a private trip site.
2. [`supabase/phase2_migration.sql`](supabase/phase2_migration.sql) — voting tables (`polls`, `votes`, `restaurants`, `restaurant_votes`, `activities`, `activity_votes`).
3. [`supabase/phase3_migration.sql`](supabase/phase3_migration.sql) — `activity_comments` table.
4. [`supabase/activity_link_migration.sql`](supabase/activity_link_migration.sql) — adds the booking-`link` column to activities.

Every migration uses `if not exists` / `add column if not exists`, so they're safe to re-run.

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
│   ├── App.jsx                       # stitches sections together
│   ├── main.jsx                      # React entry
│   ├── theme.js                      # COLORS, FONTS, SECTIONS constants
│   ├── supabase.js                   # client (or null if env vars missing)
│   ├── styles.css                    # globals, grain overlay, keyframes
│   ├── components/
│   │   ├── Nav.jsx                   # sticky glass nav with IntersectionObserver
│   │   ├── SaveBadge.jsx             # local / saving / saved / offline indicator
│   │   ├── EditField.jsx             # inline click-to-edit input
│   │   ├── CountdownUnit.jsx         # DD : HH : MM : SS unit
│   │   ├── CopyButton.jsx            # phone-number copy with 2s confirmation
│   │   ├── CenteredGrid.jsx          # responsive auto-fit grid wrapper
│   │   ├── VoterModal.jsx            # first-vote display-name prompt
│   │   ├── VoterPills.jsx            # avatar/initial pills for "who voted"
│   │   ├── CommentThread.jsx         # comments-under-activity UI
│   │   ├── CurrencyConverter.jsx     # USD ↔ MXN widget (Frankfurter)
│   │   └── VillaCarousel.jsx         # embla carousel for villa photos
│   ├── hooks/
│   │   ├── useBreakpoint.js          # useMobile / useTouchDevice
│   │   ├── useForecast.js            # Open-Meteo 7-day forecast + sunrise/sunset
│   │   └── useVoterIdentity.js       # localStorage voter UUID + display name
│   ├── utils/
│   │   ├── cost.js                   # parseCostNum shared by Dining + Activities
│   │   └── weatherCode.js            # Open-Meteo weathercode → emoji
│   └── sections/
│       ├── Hero.jsx                  # §1 gradient + countdown
│       ├── Cast.jsx                  # §2 guests (Supabase)
│       ├── Villa.jsx                 # §3 villa carousel + amenities + description
│       ├── Flights.jsx               # §4 flights (Supabase)
│       ├── Weather.jsx               # §5 live forecast (Open-Meteo)
│       ├── Map.jsx                   # §6 Leaflet map + place cards
│       ├── Activities.jsx            # §7 experiences (Supabase + votes + comments)
│       ├── Itinerary.jsx             # §8 days (Supabase)
│       ├── Polls.jsx                 # §9 group polls (Supabase)
│       ├── Dining.jsx                # §10 dining guide (Supabase + votes)
│       ├── Logistics.jsx             # §11 need-to-know + currency widget
│       └── CTA.jsx                   # §12 footer
├── supabase/
│   ├── schema.sql                    # base tables + RLS (idempotent)
│   ├── phase2_migration.sql          # voting tables
│   ├── phase3_migration.sql          # activity_comments
│   └── activity_link_migration.sql   # activities.link column
├── ROADMAP.md                        # what's next
├── netlify.toml                      # Netlify build config
└── index.html                        # Vite entry
```

## Sections

All 12 sections, sticky-nav tracked:

| # | Section | Data source | Notes |
|---|---|---|---|
| 1 | Hero | static | Live countdown · 5-click title = confetti |
| 2 | The Cast | **Supabase** (`guests`) | Editable guest cards, confirm toggle |
| 3 | The Villa | static | Photo carousel (22 images) + amenity grid + description |
| 4 | Flights | **Supabase** (`flights`) | Editable per-couple outbound + return |
| 5 | Weather | **Open-Meteo API** | Live 7-day forecast + sunrise/sunset, fallback array |
| 6 | Map | static + Leaflet | Interactive pins ↔ place cards, hover-glow + click-pan |
| 7 | Experiences & Adventures | **Supabase** (`activities` + `activity_votes` + `activity_comments`) | Editable, votable, comment threads, sort by votes/tag/cost |
| 8 | Itinerary | **Supabase** (`days`) | Editable day-by-day with timeline events |
| 9 | Polls | **Supabase** (`polls` + `votes`) | Create polls, vote, live counts, who-voted pills |
| 10 | Dining Guide | **Supabase** (`restaurants` + `restaurant_votes`) | Editable, votable, sort by name/cost/distance/votes, tap-to-call |
| 11 | Logistics | static | Expandable cards · USD/MXN currency widget · phone copy buttons |
| 12 | Let's Go | static | Gradient footer with confetti "I'm In" button |

## Roadmap

Phases 1–3 of [`ROADMAP.md`](ROADMAP.md) are complete except for §3.1
(AI idea generator), which was built and then removed in PR #2 — the
complexity wasn't worth it for a single-trip site. See ROADMAP.md for
the full history.

## License

Private project. Built with love by Chris — see you in Cabo. 🌅
