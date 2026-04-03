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

## Docs

Reference docs and scripts are organized by module in `docs/`:

```
docs/
  rsvp-email/
    send-rsvp-email.ts       # Supabase Edge Function source
    preview-rsvp-email.ts     # Local email preview script
    email-preview.html        # Generated preview (git-ignored)
```

## Deployment

GitHub Actions workflow (`.github/workflows/front.yaml`) builds and deploys to GitHub Pages on push to `main`. Uses Nitro's `github_pages` preset.