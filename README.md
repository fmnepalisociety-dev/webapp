# Nepali Society - Fargo Moorhead

We are community-based, non-profit organization dedicated to bringing together the Nepali community in the
Fargo–Moorhead area.

## Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm generate     # Generate static site for GitHub Pages
pnpm preview      # Preview production build
```

### Environment Variables

Create a `.env` file:

```
NUXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NUXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## RSVP System

Events can have an RSVP form configured via the `rsvp` JSON column on the `events` table in Supabase.

### RSVP Config JSON Structure

```json
{
  "active": true,
  "close_date": "2026-04-25",
  "fields": [
    {
      "section": "Section Name",
      "fields": [
        { "key": "name", "label": "Name", "type": "text", "required": true },
        { "key": "email", "label": "Email", "type": "email", "required": true }
      ]
    },
    {
      "section": "Event",
      "fields": [
        { "key": "num_adults", "label": "Number of Adults", "type": "number", "required": true },
        { "key": "food_preference", "label": "Veg / Non-veg", "type": "select", "required": true, "options": ["Veg", "Non-veg"] },
        { "key": "dietary_restrictions", "label": "Any dietary restrictions", "type": "textarea" }
      ]
    }
  ]
}
```

**Field types**: `text`, `number`, `email`, `tel`, `textarea`, `select`, `checkbox`, `readonly`, `image`, `template`

**Config options**:
- `active` — set to `true` to open the RSVP
- `start_date` (optional) — RSVP opens on this date
- `close_date` (optional) — RSVP closes on this date
- `fields` — array of fields or sections containing fields

### RSVP Confirmation Email

When a user submits an RSVP, a confirmation email is automatically sent using a **Supabase Database Webhook** + **Edge Function** + **Resend**.

#### Setup Steps

1. **Sign up at [resend.com](https://resend.com)** (free tier: 100 emails/day)
   - Get your API key from the Resend dashboard

2. **Create Edge Function** in Supabase Dashboard
   - Go to **Edge Functions** > **Create Function**
   - Name: `send-rsvp-email`
   - Paste the function code from `docs/rsvp-email/send-rsvp-email.ts`

3. **Add secrets** to the Edge Function
   - In Edge Function settings, add secret: `RESEND_API_KEY` = your Resend API key
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available automatically

4. **Create Database Webhook** in Supabase Dashboard
   - Go to **Database** > **Webhooks** > **Create Webhook**
   - Name: `rsvp-email-trigger`
   - Table: `event_rsvps`
   - Events: **Insert**
   - Type: **Supabase Edge Function**
   - Function: `send-rsvp-email`

#### Preview Email Locally

You can preview the confirmation email HTML locally using the preview script:

```bash
# With default sample data
npx tsx docs/rsvp-email/preview-rsvp-email.ts

# With custom data from a JSON file
npx tsx docs/rsvp-email/preview-rsvp-email.ts my-data.json
```

This generates `docs/rsvp-email/email-preview.html` — open it in your browser to see the result.

#### Email "From" Address

- For testing, Resend provides `onboarding@resend.dev`
- For production, add and verify your domain in Resend, then update the `from` field in the Edge Function

## Merchandise / Orders

The **Buy** pages (`/shop`) list merchandise (e.g. T-shirts). Each product has its own
custom **order form** — the exact same field engine as the RSVP system — plus support for
multiple images and videos. Orders are recorded and a confirmation email is sent, mirroring
the RSVP flow.

### Database tables

Create these two tables in Supabase (dashboard → SQL editor):

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,          -- URL slug, e.g. /shop/nesfm-tshirt
  description text,          -- HTML body
  promo text,
  price numeric,             -- display price (optional)
  image text[],              -- nsfm storage paths (multiple images)
  image_bg text,             -- backdrop color behind product images (hex)
  videos jsonb,              -- [{ "type": "youtube", "src": "..." }]
  order_form jsonb,          -- same shape as events.rsvp (see RSVP Config above)
  active boolean default true,
  featured boolean default false,
  sort_order int,
  created_at timestamptz default now()
);

create table product_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  responses jsonb,
  created_at timestamptz default now()
);
```

Set Row Level Security to match the events/event_rsvps policies: public **read** on
`products`, public **insert** on `product_orders`, and authenticated **read** on
`product_orders`.

The order form's payment "scan code" is just an `image`-type field holding an uploaded
payment QR (same as RSVP). The buyer's email must come from a field with key `email`.

### Order Confirmation Email

When a buyer places an order, a confirmation email is sent using the same
**Database Webhook + Edge Function + Resend** pipeline as RSVP:

1. **Create Edge Function** `send-order-email` in the Supabase dashboard — paste the code
   from `docs/order-email/send-order-email.ts`.
2. Reuse the existing `RESEND_API_KEY` secret (`SUPABASE_URL` /
   `SUPABASE_SERVICE_ROLE_KEY` are provided automatically).
3. **Create Database Webhook** `order-email-trigger` on table `product_orders`, event
   **Insert**, type **Supabase Edge Function**, function `send-order-email`.

## Notification Banners

Admin-controlled announcement banners (e.g. a fundraiser call-to-action) shown on the
public site. Managed under **Admin → Banners**. Each banner supports HTML text and
caption, an optional image and CTA link, a position (top of page / above nav / below
nav), a page scope (all pages or home only), a scheduled display window, an active
toggle, and an optional per-banner dismiss button.

Create the table in Supabase (dashboard → SQL editor):

```sql
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text,               -- internal admin label
  text text,                -- headline / body HTML (rendered as HTML)
  caption text,             -- secondary caption HTML
  image text,               -- public image URL (nsfm bucket, banners/ folder)
  image_size int,           -- optional max image size in px (blank = scale with height)
  link_url text,            -- optional CTA link (e.g. donation page)
  link_label text,          -- optional CTA button label, e.g. "Donate"
  position text default 'below_nav',  -- 'page_top' | 'above_nav' | 'below_nav'
  scope text default 'all',           -- 'all' | 'home'
  size text default 'medium',         -- height preset: xsmall | small | small-medium | medium | medium-large | large | large-xlarge | xlarge
  height_px int,            -- optional exact height in px (overrides the preset)
  bg_color text,            -- optional background hex
  dismissible boolean default true,
  active boolean default true,
  start_at timestamptz,     -- optional: show only after this time
  end_at timestamptz,       -- optional: hide after this time
  sort_order int default 0,
  created_at timestamptz default now()
);
```

Set Row Level Security to match the events policies: public **read** on `banners`,
authenticated **write** (insert/update/delete) for admins. Time-window filtering
(`start_at`/`end_at`) is applied client-side, and dismissed banners are remembered per
browser via `localStorage`.

## Education

The public **`/education`** page introduces the Nepali Pathsala program and lists
education items — each an uploaded flyer plus schedule details. Managed under
**Admin → Education**. Each item has a title, description, optional time / location, an
uploaded flyer image, and an active toggle. An item can repeat (weekly, every other
week, or monthly) from its start date; the page then shows the **next 5 upcoming
sessions** computed from that recurrence, with any **cancelled dates** struck through
and skipped. Only active items appear on the public page; if there are none, the page
shows the intro plus a "check back soon" note.

Flyer images go in the public `nsfm` bucket under the `education/` folder (same bucket
and storage policies as flyers/events).

Create the table in Supabase (dashboard → SQL editor):

```sql
create table education (
  id bigint generated always as identity primary key,
  title text not null,
  description text,           -- shown as plain text (preserves line breaks)
  image_path text,            -- flyer path in nsfm bucket, education/ folder
  event_date date,            -- anchor / start date of the (first) session
  event_time text,            -- optional, free text e.g. "6:30 PM – 7:30 PM"
  location text,              -- optional
  recurrence_freq text,       -- 'weekly' | 'biweekly' | 'monthly'; null = one-off
  cancelled_dates date[] not null default '{}',  -- session dates to skip
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

Set Row Level Security to match the events policies: public **read** on `education`,
authenticated **write** (insert/update/delete) for admins. Upcoming-session dates and
cancellation filtering are computed client-side from `event_date` + `recurrence_freq`.

## Sports — Squads & Tournaments

Squads are organised by **tournament**. Each tournament has two teams — **NeSFM** (our own
organisation, `kind: home`) and an **opponent** (`kind: opponent`, scoped to that tournament
only). Public pages:

- **`/sports/football`** — the official NeSFM football squad.
- **`/sports/everest-cup`** — both teams shown side-by-side (NeSFM vs NSA), rendered by the
  generic `TournamentSquads` component.

Each player has a name, squad number, role (captain / vice-captain / player) and an
uploadable photo; players with no photo show a placeholder avatar.

**Tournaments are defined in code**, not the DB — see `TOURNAMENTS` in
`app/composables/useSquad.ts` (each entry: `key`, `name`, `sport`, `teams[]`). Adding a
future tournament is one entry there; it then appears in the admin list, gets its own
management screen, and becomes selectable on events. Each team maps to a distinct
`players.team` string value (e.g. NeSFM → `'Everest Cup 2026'`, NSA →
`'Everest Cup 2026 (NSA)'`).

Players are managed under **Admin → Squad**, which lists tournaments; clicking one opens
`/admin/squad/[tournament]` with a per-team toggle (our team / opponent).

Create the table in Supabase (dashboard → SQL editor):

```sql
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'football',  -- discipline: football | cricket | volleyball | ...
  squad_number int,          -- jersey / list number
  role text,                 -- 'captain' | 'vice-captain' | null (player)
  team text not null default 'Everest Cup 2026',  -- team-within-tournament key (see TOURNAMENTS)
  image_path text,           -- nsfm storage path, squad/ folder
  sort_order int not null default 0,
  created_at timestamptz default now()
);
```

The `sport` column lets the same table hold multiple squads (football now, cricket /
volleyball later); the public page filters by `sport` + `team`. `squad_number` is optional —
leave it blank until real jersey numbers are assigned (the public page doesn't show it yet).

Enable Row Level Security — public **read**, authenticated **write** (admin panel):

```sql
alter table players enable row level security;

create policy "players public read"
  on players for select to anon, authenticated using (true);

create policy "players admin insert"
  on players for insert to authenticated with check (true);

create policy "players admin update"
  on players for update to authenticated using (true) with check (true);

create policy "players admin delete"
  on players for delete to authenticated using (true);
```

Player photos go in the public `nsfm` bucket under the `squad/` folder. Storage RLS is
per-folder, so the `squad/` prefix needs its own write policies (add via SQL Editor):

```sql
create policy "squad images admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'nsfm' and (storage.foldername(name))[1] = 'squad');
create policy "squad images admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'nsfm' and (storage.foldername(name))[1] = 'squad')
  with check (bucket_id = 'nsfm' and (storage.foldername(name))[1] = 'squad');
create policy "squad images admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'nsfm' and (storage.foldername(name))[1] = 'squad');
```

Public read is assumed already granted bucket-wide; add a matching `select` policy for the
`squad` prefix if not. Alternatively, a single bucket-wide `for all to authenticated using
(bucket_id = 'nsfm')` policy covers every folder and avoids repeating this per feature.

Seed the Everest Cup 2026 football squad (numbers omitted; photos are uploaded later via the
admin panel):

```sql
insert into players (name, sport, role, team, sort_order) values
  ('Bishal Rai',        'football', 'captain',      'Everest Cup 2026', 1),
  ('Anuj Shrestha',     'football', 'vice-captain', 'Everest Cup 2026', 2),
  ('Krishna Acharya',   'football', null,           'Everest Cup 2026', 3),
  ('Arjun Upadhyay',    'football', null,           'Everest Cup 2026', 4),
  ('Dipesh Basnet',     'football', null,           'Everest Cup 2026', 5),
  ('Pratik Raj Pandey', 'football', null,           'Everest Cup 2026', 6),
  ('Ram Bahadur Basnet','football', null,           'Everest Cup 2026', 7),
  ('Rukma Raj Kafle',   'football', null,           'Everest Cup 2026', 8),
  ('Sandip Van Poudel', 'football', null,           'Everest Cup 2026', 9),
  ('Sunil Bhandari',    'football', null,           'Everest Cup 2026', 10),
  ('Rijesh Shrestha',   'football', null,           'Everest Cup 2026', 11),
  ('Prabhat Paudyal',   'football', null,           'Everest Cup 2026', 12),
  ('Sanjay',            'football', null,           'Everest Cup 2026', 13),
  ('Subin Adhikari',    'football', null,           'Everest Cup 2026', 14),
  ('Bishnu Adhikari',   'football', null,           'Everest Cup 2026', 15),
  ('Arjun Shrestha',    'football', null,           'Everest Cup 2026', 16);
```

### Linking an event to a tournament

An event can render both teams' squads inline on its detail page. This is driven by a
`tournament_key` column on the `events` table (set from a dropdown in the event editor);
its value matches a tournament `key` from `TOURNAMENTS`. Multiple events (e.g. a two-leg
tie) can share the same key.

```sql
alter table events add column tournament_key text;
```

Leave it `null` for events with no squads. On the event page, `getTournament(tournament_key)`
resolves the config and `TournamentSquads` renders the teams.

## Docs

Reference docs and scripts are organized by module in `docs/`:

```
docs/
  rsvp-email/
    send-rsvp-email.ts       # Supabase Edge Function source
    preview-rsvp-email.ts     # Local email preview script
    email-preview.html        # Generated preview (git-ignored)
  order-email/
    send-order-email.ts      # Supabase Edge Function source (merch orders)
```

## Deployment

GitHub Actions workflow (`.github/workflows/front.yaml`) builds and deploys to GitHub Pages on push to `main`. Uses Nitro's `github_pages` preset.