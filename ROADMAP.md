# Cabo '26 Roadmap

A phased plan to chip away at over the next few weeks. Each item is
scoped to land in one session. Work on one feature branch at a time,
merge to `main`, let Netlify auto-deploy, move on.

---

## 🌅 Start here tomorrow

Warm up with the four **XS/S items at the top of Phase 1** — they're
small wins that take maybe an hour combined and build momentum:

1. Center the Who's Coming tiles
2. Center the Forecast cards
3. Swap the Forecast to live Open-Meteo data
4. Add sunrise/sunset per trip day

Then save Phase 2/3 for weekends. Don't skip the **Open Decisions**
section at the bottom — some items are blocked on answers only you
can give.

---

## Phase 1 — Quick polish

Small, high-confidence changes. Great for picking up and putting down.

### 1.1 · Center the Who's Coming tiles — XS
**File:** `src/sections/Cast.jsx`
**Problem:** The grid uses `repeat(auto-fill, minmax(220px, 1fr))`, which
left-aligns partial rows.
**Fix:** Wrap the grid in a flex container with `justifyContent: center`,
OR switch `auto-fill` to `auto-fit` plus constrain the grid's max width.
**Done when:** On a wide screen, a row of 3 cards sits centered instead
of hugging the left edge.

### 1.2 · Center the Forecast cards — XS
**File:** `src/sections/Weather.jsx`
Same pattern as 1.1. Consider making both share a `CenteredGrid`
component in `src/components/` since they'll be the second instance.

### 1.3 · Swap Forecast to live data (Open-Meteo) — M
**Why Open-Meteo:** free, no signup, no API key, generous rate limits.
**Endpoint:**
```
https://api.open-meteo.com/v1/forecast
  ?latitude=23.008&longitude=-109.717
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode
  &timezone=America/Mazatlan
  &start_date=2026-06-14&end_date=2026-06-20
```
**Approach:**
- New file: `src/hooks/useForecast.js`. Fetches once on mount, caches
  in `sessionStorage` for the tab's lifetime so refreshes don't re-hit
  the API.
- Map Open-Meteo `weathercode` → emoji (write a small `codeToEmoji.js`).
- If the fetch fails, fall back to the current hardcoded array so the
  section never breaks.
- Keep the existing layout; just replace the `FORECAST` array with hook
  data.
**Gotcha:** Open-Meteo only returns up to 16 days out. Until ~May 30
the API will return empty data for trip dates — handle that by showing
the hardcoded fallback and a tiny "seasonal average" label.
**Done when:** Real current-outlook numbers appear once we're inside
the 16-day window, and the layout never breaks.

### 1.4 · Sunrise / sunset per trip day — S
**Same API as 1.3** — add `sunrise,sunset` to the `daily=` list, no
extra endpoint needed.
**UX:** Add a small row to each Forecast card: `🌅 5:47 · 🌇 7:23`. Use
DM Mono, very small, gold-accent.
**Done when:** Each of the 7 forecast cards shows sunrise & sunset
times for that date.

### 1.5 · Currency converter widget — S
**Why:** Small tool, useful at a restaurant, very on-theme.
**API:** [Frankfurter](https://frankfurter.dev/) (`https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN`).
Free, no key, open-source, ECB-backed.
**Placement:** Inside the Logistics section, either as a new expandable
card (`💱 Currency`) or a persistent mini-widget at the top of that section.
**Data:** Fetch once per session, cache in `sessionStorage`.
**UI:** Two inputs (USD | MXN), typing in one updates the other.
Display the rate and last-updated timestamp below.
**Done when:** Typing `100` in USD shows ~`1,700` MXN and vice versa.

---

## Phase 2 — Shared decisions & voting

Meatier features. Each is its own feature branch.

### 2.1 · Group Polls — L
**Goal:** Create polls like "Thursday night: Flora Farms or Art Walk?"
with a few options, let anyone vote, show live counts.

**Schema (new migration):**
```sql
create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,  -- [{id, label}]
  created_at timestamptz not null default now(),
  closed boolean not null default false
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id text not null,
  voter_id text not null,       -- localStorage UUID; no auth
  voter_name text,              -- optional, lets you see who voted
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)    -- one vote per voter per poll
);
```

**Anti-double-vote without auth:**
- On first load, generate a UUID in `localStorage` under
  `cabo26:voter_id`. Also let them set a display name saved in
  `cabo26:voter_name`.
- Every vote includes both. The unique index enforces one-per-poll.

**UI:** New section `src/sections/Polls.jsx`, inserted between Itinerary
and Dining. Each poll is a card with the question, vote buttons, live
counts (animated bar), and a "who voted" row of avatars/initials.
Anyone can add a new poll via a compact form at the bottom.

**Done when:** Two people on two devices can vote; counts update in
real time (or on refresh — Supabase realtime subscriptions optional).

### 2.2 · Dining: voting + edits + additions — L
**Convert from static array to Supabase-backed:**
1. Migration: `create table restaurants (...)` with the same fields
   currently in the `DINING` const. Include `votes_up` and `added_by`
   (text, optional). Seed it with the current 6 entries.
2. Refactor `src/sections/Dining.jsx` to load from Supabase with the
   same seed-on-empty pattern used in Cast/Flights/Itinerary.
3. Add EditField wrappers to each restaurant card so details are
   editable.
4. Add an "Add a restaurant" form below the grid.
5. Add a vote button per card with count. Use the same
   `localStorage` voter_id pattern from 2.1, but stored in a
   `restaurant_votes` table with a unique `(restaurant_id, voter_id)`
   index.
6. Add a "who voted" hover popover (list of `voter_name`s).
7. Update the existing sort pills: add a "Votes" sort option.

**Done when:** A new guest can add a restaurant, everyone can vote,
sort by votes shows the crowd favorite.

### 2.3 · "Experiences & Adventures" redesign (Activities) — L
**Rename:** Section title "Things We'll Actually Do" → **"Experiences
& Adventures"**. Remove the "Top 5" eyebrow. Section id stays
`activities` (don't break nav).

**Convert from static array to Supabase-backed**, same pattern as 2.2:
- New `activities` table: `title, icon, cost, duration, distance, description, tag, votes_up, added_by`.
- Seed from the current 5 entries.
- Editable accordion cards.
- Add button.
- Vote button + who-voted popover (same pattern as 2.2).
- Sort options: by votes (default), by tag, by cost.

**(AI generation is 3.1, a separate item once this foundation exists.)**

**Done when:** Activities behaves like dining does after 2.2 — live
data, vote counts, add new.

---

## Phase 3 — Delight, polish, and AI

### 3.1 · ~~AI idea generator for Experiences~~ — REMOVED (PR #2, Apr 2026)

> Built then ripped out. ~13 commits added a Tavily + Claude Sonnet
> "Suggest more ideas" flow with a category picker and a preview modal.
> It worked but added a fragile dependency on two API keys (Tavily,
> Anthropic) and proved overkill for a single-trip site. Removed in PR #2.
> Manual "Add Activity" remains and covers the actual use case.
>
> Original spec preserved below for posterity:

<details>
<summary>Original 3.1 spec (no longer pursued)</summary>

*Prereq: 2.3 complete so there's a table to insert into.*

**The flow:**
- Button in Experiences: "✨ Suggest more ideas".
- On click, call a serverless endpoint that asks Claude (or OpenAI) to
  generate 3–5 Cabo-specific activity ideas we don't already have.
- Response is shown in a preview modal — each suggestion has "Add" and
  "Skip" buttons. "Add" inserts it into the activities table.

**Why serverless, not client-side:** The AI API key must never be
shipped to the browser. Put it in a Netlify Function.

**Endpoint:** `netlify/functions/suggest-activities.js`
- Reads `ANTHROPIC_API_KEY` from environment.
- Receives the current list of activities in the request body so the AI
  knows what not to duplicate.
- Calls Claude with a prompt like: *"Suggest 5 activity ideas for a
  6-night Los Cabos trip staying in Palmilla, June 2026. Return JSON:
  [{title, icon, cost, duration, distance, description, tag}]. Avoid
  duplicating these existing ideas: [...]"*
- Returns JSON to the client.

**Required env var in Netlify:** `ANTHROPIC_API_KEY`.

**Done when:** Clicking "Suggest more ideas" produces 3–5 contextually
plausible suggestions we can add with one click.

</details>

### 3.2 · Comment threads on Experiences — M
*Complements 2.3.*

**Schema:**
```sql
create table activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  author text,          -- voter_name from localStorage
  body text not null,
  created_at timestamptz not null default now()
);
```

**UI:** Under each expanded activity card, a tiny comment thread
(`body` + `author` + relative time). "Add comment" field below.

**Done when:** Guests can leave quick comments ("Did this last year —
10/10"), they persist, and show on each activity.

### 3.3 · Interactive map upgrade — M
**Swap the Google Maps iframe for Leaflet** (free, MIT, no key).

- Install `leaflet` + `react-leaflet`.
- Plot a pin per place in the existing `PLACES` array (each already
  has a query string; geocode once, hardcode `{lat, lng}` into the
  array).
- On pin hover → matching place card gets a glow.
- On place card hover → pin bounces.
- On place card click → map pans/zooms to the pin.

**Tile source:** OpenStreetMap default, or a prettier free option
like CARTO Positron or Stadia Alidade Smooth Dark.

**Done when:** Hovering a card highlights a pin and vice versa.

### 3.4 · Villa photo carousel — M
*Blocked on open decision — see below.*

Once we have photos, build a standard carousel at the top of the
Villa section:
- Auto-advance every 5 seconds.
- Arrow buttons + dots.
- Keyboard arrows when focused.
- Swipe on touch.
- Use `embla-carousel-react` (small, solid).

**Done when:** 5–10 real villa photos rotate at the top of the Villa
section.

### 3.5 · Villa description sidebar — S
*Blocked on open decision — see below.*

Split the Villa section into two columns on wide screens:
- Left: amenity emoji cards (current).
- Right: paragraph text description from the Inspirato listing.

Stack vertically on narrow screens.

**Done when:** A readable property description sits beside the amenity
grid without breaking mobile layout.

---

## 🗝️ Open decisions — answer tomorrow before starting

1. ~~**AI provider for 3.1.**~~ Resolved: Claude was chosen, the feature
   was built (Tavily + Claude Sonnet), then removed in PR #2 because
   the complexity wasn't worth the value for a single-trip site.

2. **Villa photos for 3.4.** Inspirato's listing images can't be
   scraped (auth-walled + ToS issues). Three options:
   - **(A) You download 5–10 photos from the listing** and paste them
     into `public/villa/` in the repo. Simplest. I'll wire them up.
   - **(B) Upload to Supabase Storage** so they're editable later
     without a redeploy. Slightly more setup.
   - **(C) Unsplash stand-ins** that *look* like Palmilla villas. Honest
     but not the real place.

   Default: **(A)** — copy your favorites into `public/villa/` and I'll
   build the carousel around them.

3. **Villa description for 3.5.** Paste the paragraph(s) from the
   Inspirato listing and I'll drop them in.

4. **Voter identity UX for 2.1, 2.2, 2.3.** On first vote, pop a tiny
   modal asking "What should we call you?" and save to `localStorage`.
   From then on, votes are attributed to that name. No password, no
   email, no account — just a friendly label. Confirm this matches
   your vision.

5. **Real-time vs. refresh-to-see-votes.** Supabase has live
   subscriptions, but they cost an extra WebSocket and a bit of
   complexity. For a friend group of ~8 people, **refresh-to-update**
   is probably fine. Say the word if you want live.

---

## 🛠️ How to work

**One branch per feature:**
```bash
git checkout main
git pull
git checkout -b feature/weather-api
# ... work, commit ...
git push -u origin feature/weather-api
# open PR or merge directly:
git checkout main
git merge feature/weather-api
git push
```
Netlify auto-deploys on every push to `main`.

**Supabase schema changes:** Keep appending new statements to
`supabase/schema.sql`. Every statement should be `if not exists` or
`add column if not exists` so the file stays idempotent and can be
re-run safely.

**Local preview:** `npm run dev`, then open http://localhost:5173.

**Rollback:** If a deploy breaks the site, in Netlify → Deploys, click
the three-dot menu on the last good deploy → "Publish deploy". That
instantly reverts without touching Git.

---

## Completion tracker

Copy a checkmark as you ship each item:

### Phase 1
- [x] 1.1 Center Who's Coming tiles
- [x] 1.2 Center Forecast cards
- [x] 1.3 Live Weather (Open-Meteo)
- [x] 1.4 Sunrise / sunset per day
- [x] 1.5 Currency converter

### Phase 2
- [x] 2.1 Group Polls
- [x] 2.2 Dining voting + edits
- [x] 2.3 Experiences & Adventures redesign

### Phase 3
- [~] 3.1 AI idea generator — built, then removed (PR #2)
- [x] 3.2 Comment threads
- [x] 3.3 Interactive map
- [x] 3.4 Villa photo carousel
- [x] 3.5 Villa description sidebar
