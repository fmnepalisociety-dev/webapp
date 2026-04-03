/**
 * Preview the RSVP confirmation email locally.
 *
 * Usage:
 *   npx tsx docs/preview-rsvp-email.ts                # uses defaults
 *   npx tsx docs/preview-rsvp-email.ts data.json      # custom data
 *
 * The JSON file (or default) should look like:
 * {
 *   "event": {
 *     "heading": "Nepali New Year 2083",
 *     "event_date": "April 14, 2026",
 *     "event_time": "5:00 PM - 10:00 PM",
 *     "event_location": "Fargo Civic Center [https://maps.google.com]",
 *     "rsvp": {
 *       "fields": [
 *         { "key": "name", "label": "Full Name" },
 *         { "key": "email", "label": "Email" },
 *         { "key": "phone", "label": "Phone" },
 *         { "key": "guests", "label": "Number of Guests" }
 *       ]
 *     }
 *   },
 *   "responses": {
 *     "name": "Ram Sharma",
 *     "email": "ram@example.com",
 *     "phone": "(701) 555-1234",
 *     "guests": "4"
 *   }
 * }
 *
 * Outputs: docs/email-preview.html (open in browser)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const defaultData = {
  event: {
    heading: 'Nepali New Year 2083 Celebration',
    event_date: 'April 14, 2026',
    event_time: '5:00 PM - 10:00 PM',
    event_location: 'Fargo Civic Center [https://maps.google.com]',
    rsvp: {
      fields: [
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'guests', label: 'Number of Guests' },
      ],
    },
  },
  responses: {
    name: 'Ram Sharma',
    email: 'ram@example.com',
    phone: '(701) 555-1234',
    guests: '4',
  },
};

// Load data from JSON file argument or use defaults
const jsonPath = process.argv[2];
const data = jsonPath ? JSON.parse(readFileSync(resolve(jsonPath), 'utf-8')) : defaultData;

const { event, responses } = data;
const eventName = event.heading ?? 'Event';
const eventDate = event.event_date ?? '';
const eventTime = event.event_time ?? '';
const eventLocation = event.event_location ?? '';

// Parse location text and optional URL from "Location Name [url]" format
const locationMatch = eventLocation.match(/^(.*?)\s*\[(.+)]$/);
const locationText = locationMatch ? locationMatch[1].trim() : eventLocation;
const locationUrl = locationMatch ? locationMatch[2].trim() : null;

const siteBase = 'https://fmnepali.org';
const eventLink = `${siteBase}/events/1`;

// Build field list from rsvp config (same logic as edge function)
const fields: { key: string; label: string }[] = [];
const rsvpConfig = event.rsvp;
if (rsvpConfig?.fields) {
  for (const item of rsvpConfig.fields) {
    if (item.section && item.fields) {
      for (const f of item.fields) {
        if (f.type !== 'readonly' && f.type !== 'image' && f.type !== 'template') {
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

const emailHtml = `
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

const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>RSVP Email Preview</title>
<style>body{background:#f3f4f6;padding:40px;}</style></head>
<body>${emailHtml}</body>
</html>`;

const outPath = resolve(__dirname, 'email-preview.html');
writeFileSync(outPath, fullHtml);
console.log(`Email preview written to: ${outPath}`);
console.log('Open it in your browser to see the result.');
