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