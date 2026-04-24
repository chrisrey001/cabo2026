# Cabo '26

A fun, editable, interactive web app for our parents-only getaway to Los Cabos, Mexico (June 14–20, 2026).

## Stack

- **Frontend:** Single static `index.html` — React 18 + Tailwind + Babel Standalone (all via CDN, no build step)
- **Backend:** Supabase (Postgres + REST + Realtime WebSockets)
- **Hosting:** Netlify (static)

## Local Setup

No dependencies to install. Just serve the directory:

```bash
# Any static server works. Examples:
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify, **Add new site → Import from Git** and select this repo.
3. Build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `.`
4. Deploy. That's it — `netlify.toml` and `_headers` configure the rest.

## Supabase

Project is already live. The anon/publishable key and URL are hardcoded in `index.html` (safe because RLS policies gate all access).

- **Project ref:** `xkcdbmyvlirxxwxwectc`
- **Tables:** `cast_members`, `flights`, `itinerary_days` (all with RLS `anon full access` + Realtime publication enabled)

## File Structure

```
.
├── index.html      # Single-page app
├── netlify.toml    # Netlify build + headers config
├── _headers        # Security headers (Netlify)
└── README.md
```
