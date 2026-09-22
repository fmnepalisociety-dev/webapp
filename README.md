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

## Events — recurrence, categories & the `meta` column

Events carry their extensible attributes in a single **`meta` jsonb** column, so new
optional fields don't need new columns (a data migration is limited to backfilling
`meta`). Today `meta` holds:

```jsonc
{
  "category": "education",          // omitted for a general event
  "recurrence": {                    // omitted for a one-off event
    "freq": "weekly",               // 'weekly' | 'biweekly' | 'monthly'
    "start_date": "2026-09-25",     // YYYY-MM-DD anchor
    "cancelled_dates": ["2026-10-02"]
  }
}
```

Add the column in Supabase (dashboard → SQL editor):

```sql
alter table public.events add column if not exists meta jsonb not null default '{}'::jsonb;
```

The earlier typed columns (`start_date`, `recurrence_freq`, `cancelled_dates`,
`content_type`, `content_key`) are superseded by `meta` and can be dropped once the data
is moved:

```sql
alter table public.events
  drop column if exists start_date,
  drop column if exists recurrence_freq,
  drop column if exists cancelled_dates,
  drop column if exists content_type,
  drop column if exists content_key;
```

**Recurring events** (those with `meta.recurrence`) are pulled out of Upcoming/Past into
their own bucket. The Events page (`/events`) has three sections — **Upcoming**,
**Recurring**, **Past** — with a jump bar; each also has its own route
(`/events/upcoming`, `/events/recurring`, `/events/past`). Recurrence math (next N
sessions, cancellations, local-date parsing) lives in `app/composables/useRecurrence.ts`.

**Education** is a category of event (`meta.category = 'education'`), not a separate
table. The public **`/education`** page shows education-category events with their flyer,
description, schedule, and next 5 sessions; **Admin → Education** is a filtered list of
those events that opens the normal event editor (set the Category field to *Education*).
Flyer images use the first entry of the event's image gallery in the `nsfm` bucket. The
old standalone `education` table is removed:

```sql
drop table if exists public.education;
```

## Membership

"Become a Member" (header button → `/membership`) is a public application form built on the
same JSON field engine as event RSVPs (`RsvpConfig` + `RsvpFieldRenderer`): applicant
details, a `lineitems` field for **family members**, and a payment section (Zelle
instructions/QR + "Have you paid?" + amount). Submissions go to `membership_applications`.

**Admin → Membership** lists applications by status (`new` / `unpaid` / `processing` /
`accepted` / `registered` / `rejected`), shows details + family + payment, and lets an
admin **register** an application — creating rows in `members` for the applicant and chosen
family (with a suggested next unique membership ID), linking the application via `member_id`
and marking it `registered`. **Admin → Membership → Edit application form** edits the form
config as JSON (with a live preview); it's stored in `app_config` and falls back to the
in-code default (`DEFAULT_MEMBERSHIP_FORM`) when unset.

Create the tables in Supabase (dashboard → SQL editor):

```sql
-- Public submissions
create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  responses jsonb not null,
  status text not null default 'new',   -- new | unpaid | processing | accepted | registered | rejected
  member_id int references public.members(id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.membership_applications enable row level security;
create policy "ma public insert" on public.membership_applications for insert with check (true);
create policy "ma admin read"    on public.membership_applications for select to authenticated using (true);
create policy "ma admin update"  on public.membership_applications for update to authenticated using (true) with check (true);
create policy "ma admin delete"  on public.membership_applications for delete to authenticated using (true);

-- Generic key/value config (holds the membership form under key 'membership_form')
create table public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
create policy "app_config public read"  on public.app_config for select using (true);
create policy "app_config admin insert" on public.app_config for insert to authenticated with check (true);
create policy "app_config admin update" on public.app_config for update to authenticated using (true) with check (true);
```

Membership IDs are enforced unique in the admin flow; for a hard guarantee add
`create unique index on public.members (membership_id) where membership_id is not null;`.

## Audit log

Create/update/delete on **any table** is recorded in `audit_log` by a Postgres trigger,
along with who did it. Viewable at **Admin → Audit Log** (filter by table/action, expand to
see before/after JSON).

Who gets logged is decided by the request **role**:
- `authenticated` (a logged-in admin) → logged, with their email.
- `service_role` (service-key / system / scripted changes) → logged as **system**.
- `anon` (front-facing public visitors: RSVPs, membership applications, product orders) →
  **not** logged. (An admin editing/deleting those rows still is.)

Run once in Supabase (dashboard → SQL editor). It attaches to every existing table and,
if your role allows event triggers, to future tables automatically:

```sql
-- 1. Audit table
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null,          -- INSERT | UPDATE | DELETE
  actor_id uuid,                 -- auth.uid() (null for service-key/system writes)
  actor_email text,              -- email claim from the JWT
  actor_role text,               -- authenticated | service_role
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit_log admin read" on public.audit_log for select to authenticated using (true);

-- 2. Trigger function — logs admin + system, skips anonymous public submissions
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'anon' then
    return coalesce(new, old);   -- skip front-facing public visitors
  end if;
  insert into public.audit_log(table_name, record_id, action, actor_id, actor_email, actor_role, old_data, new_data)
  values (
    tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'),
    tg_op,
    auth.uid(),
    nullif(auth.jwt() ->> 'email', ''),
    auth.role(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- 3. Helper to (re)attach the audit trigger to one table
create or replace function public.attach_audit(tbl regclass)
returns void language plpgsql as $$
begin
  execute format('drop trigger if exists audit_trg on %s', tbl);
  execute format('create trigger audit_trg after insert or update or delete on %s for each row execute function public.log_audit()', tbl);
end;
$$;

-- 4. Attach to every existing table in public (except audit_log itself)
do $$
declare r record;
begin
  for r in select format('%I.%I', schemaname, tablename)::regclass as tbl
           from pg_tables where schemaname = 'public' and tablename <> 'audit_log'
  loop
    perform public.attach_audit(r.tbl);
  end loop;
end $$;

-- 5. OPTIONAL: auto-attach to future tables. Needs permission to create event
--    triggers; if Supabase rejects this, skip it and just run
--    `select public.attach_audit('public.<new_table>');` when you add a table.
create or replace function public.auto_attach_audit()
returns event_trigger language plpgsql as $$
declare obj record;
begin
  for obj in select * from pg_event_trigger_ddl_commands() where command_tag = 'CREATE TABLE'
  loop
    if obj.schema_name = 'public' and obj.object_identity <> 'public.audit_log' then
      perform public.attach_audit(obj.object_identity::regclass);
    end if;
  end loop;
end;
$$;
drop event trigger if exists audit_auto;
create event trigger audit_auto on ddl_command_end
  when tag in ('CREATE TABLE') execute function public.auto_attach_audit();
```

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