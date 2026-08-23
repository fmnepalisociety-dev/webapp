// Supabase Edge Function: send-order-email
// Triggered by a database webhook on product_orders INSERT.
// Sends an order confirmation email to the buyer via Resend.
//
// Required secrets:
//   RESEND_API_KEY — from https://resend.com (same key as send-rsvp-email)
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
    const { product_id, responses } = record;
    const email = responses?.email;

    if (!email) {
      return new Response(JSON.stringify({ skipped: 'no email' }), { status: 200 });
    }

    // Fetch product details using service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: product } = await supabase
      .from('products')
      .select('name, price, slug, order_form')
      .eq('id', product_id)
      .single();

    const productName = product?.name ?? 'Item';
    const price = product?.price;

    // Build product page link (prefer the slug)
    const siteBase = 'https://fmnepali.org';
    const productLink = `${siteBase}/shop/${product?.slug || product_id}`;

    // Build field list from the product's order_form config
    const orderForm = product?.order_form;
    const fields: { key: string; label: string }[] = [];
    if (orderForm?.fields) {
      for (const item of orderForm.fields) {
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
        let val = responses[f.key];
        // Line items come through as an array of row objects.
        if (Array.isArray(val)) {
          val = val
            .map((r) =>
              r && typeof r === 'object'
                ? Object.values(r).filter((v) => v !== '' && v !== null && v !== undefined).join(' / ')
                : r
            )
            .filter(Boolean)
            .join('<br>');
        }
        if (val === undefined || val === '' || val === null) return '';
        return `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;vertical-align:top;">${f.label}</td>
          <td style="padding:8px 12px;color:#1e3a5f;border-bottom:1px solid #e5e7eb;">${val}</td>
        </tr>`;
      })
      .filter(Boolean)
      .join('');

    // Optional price line
    const priceRow =
      price !== null && price !== undefined && price !== ''
        ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:70px;">Price</td>
            <td style="padding:6px 0;color:#1e3a5f;font-size:14px;font-weight:600;">$${Number(price).toFixed(2)}</td>
          </tr>`
        : '';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e3a5f;margin-bottom:4px;">Thank You for Your Order!</h2>
        <p style="color:#374151;font-size:15px;">
          Your order for <strong>${productName}</strong> has been received.
        </p>
        ${priceRow ? `<table style="border-collapse:collapse;margin-top:8px;">${priceRow}</table>` : ''}
        <a href="${productLink}" style="display:inline-block;margin-top:12px;font-size:13px;color:#2563eb;text-decoration:none;">View product details &rarr;</a>
        <h3 style="color:#1e3a5f;margin-top:24px;margin-bottom:8px;">Your Order Details</h3>
        <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;">
          ${detailsHtml}
        </table>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
          If you haven't completed payment yet, please follow the payment instructions shown at checkout.
          Thank you for supporting the Nepali Society FM!
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
        subject: `Order Confirmation — ${productName}`,
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
