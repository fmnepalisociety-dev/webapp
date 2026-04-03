// Supabase Edge Function: send-rsvp-email
// Triggered by a database webhook on event_rsvps INSERT.
// Sends a confirmation email to the RSVP respondent via Resend.
//
// Required secrets:
//   RESEND_API_KEY — from https://resend.com
//
// Auto-available in Edge Functions:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    const { record } = await req.json(); // webhook payload
    const { event_id, responses } = record;
    const email = responses?.email;

    if (!email) {
      return new Response(JSON.stringify({ skipped: 'no email' }), { status: 200 });
    }

    // Fetch event details using service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: event } = await supabase
      .from('events')
      .select('heading, event_date, event_time, event_location, rsvp')
      .eq('id', event_id)
      .single();

    const eventName = event?.heading ?? 'Event';
    const eventDate = event?.event_date ?? '';
    const eventTime = event?.event_time ?? '';
    const eventLocation = event?.event_location ?? '';

    // Parse location text and optional URL from "Location Name [url]" format
    const locationMatch = eventLocation.match(/^(.*?)\s*\[(.+)]$/);
    const locationText = locationMatch ? locationMatch[1].trim() : eventLocation;
    const locationUrl = locationMatch ? locationMatch[2].trim() : null;

    // Build event page link
    const siteBase = 'https://fmnepali.org';
    const eventLink = `${siteBase}/events/${event_id}`;

    // Build field list from the event's rsvp config
    const rsvpConfig = event?.rsvp;
    const fields: { key: string; label: string }[] = [];
    if (rsvpConfig?.fields) {
      for (const item of rsvpConfig.fields) {
        if (item.section && item.fields) {
          for (const f of item.fields) {
            if (f.type !== 'readonly' && f.type !== 'image') {
              fields.push({ key: f.key, label: f.label });
            }
          }
        } else if (item.key) {
          fields.push({ key: item.key, label: item.label });
        }
      }
    }

    // Build HTML table rows from responses
    const detailsHtml = fields
      .map((f) => {
        const val = responses[f.key];
        if (val === undefined || val === '' || val === null) return '';
        return `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">${f.label}</td>
          <td style="padding:8px 12px;color:#1e3a5f;border-bottom:1px solid #e5e7eb;">${val}</td>
        </tr>`;
      })
      .filter(Boolean)
      .join('');

    // Build event info rows
    const eventInfoRows = [
      eventDate
        ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:70px;">Date</td>
            <td style="padding:6px 0;color:#1e3a5f;font-size:14px;font-weight:600;">${eventDate}</td>
          </tr>`
        : '',
      eventTime
        ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:70px;">Time</td>
            <td style="padding:6px 0;color:#1e3a5f;font-size:14px;font-weight:600;">${eventTime}</td>
          </tr>`
        : '',
      locationText
        ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:70px;">Location</td>
            <td style="padding:6px 0;color:#1e3a5f;font-size:14px;font-weight:600;">${
              locationUrl
                ? `<a href="${locationUrl}" style="color:#2563eb;text-decoration:none;">${locationText}</a>`
                : locationText
            }</td>
          </tr>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e3a5f;margin-bottom:4px;">Welcome!</h2>
        <p style="color:#374151;font-size:15px;">
          You have successfully registered for <strong>${eventName}</strong>.
        </p>
        ${
          eventInfoRows
            ? `<table style="border-collapse:collapse;margin-top:8px;">${eventInfoRows}</table>`
            : ''
        }
        <a href="${eventLink}" style="display:inline-block;margin-top:12px;font-size:13px;color:#2563eb;text-decoration:none;">View event details &rarr;</a>
        <h3 style="color:#1e3a5f;margin-top:24px;margin-bottom:8px;">Your RSVP Details</h3>
        <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;">
          ${detailsHtml}
        </table>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
          Thank you for your RSVP. We look forward to seeing you!
        </p>
        <p style="color:#9ca3af;font-size:12px;">— <a href="${siteBase}" style="color:#9ca3af;">Nepali Society FM</a></p>
      </div>
    `;

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Nepali Society FM <noreply@fmnepali.org>',
        to: [email],
        subject: `RSVP Confirmation — ${eventName}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
