// A sub-field of a repeatable line-items field (one column per row).
export interface LineItemField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface RsvpField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'readonly' | 'image' | 'template' | 'lineitems';
  required?: boolean;
  required_if?: { field: string; value: string };
  options?: string[];
  value?: string;
  // For type === 'lineitems': the columns of each row, and an optional unit
  // price used to show a running total.
  item_fields?: LineItemField[];
  unit_price?: number;
}

// A blank row for a line-items field (every column empty).
export function emptyLineItemRow(field: RsvpField): Record<string, any> {
  const row: Record<string, any> = {};
  for (const f of field.item_fields ?? []) row[f.key] = '';
  return row;
}

// Human-readable one-line summary of a line-items value, e.g.
// "White / M / 2; Black / L / 1". Skips fully-empty rows.
export function formatLineItems(rows: unknown, itemFields?: { key: string }[]): string {
  if (!Array.isArray(rows)) return '';
  return rows
    .filter((r) => r && typeof r === 'object' && Object.values(r).some((v) => v !== '' && v != null))
    .map((r) => {
      const keys = itemFields?.map((f) => f.key) ?? Object.keys(r);
      return keys.map((k) => (r as any)[k]).filter((v) => v !== '' && v != null).join(' / ');
    })
    .join('; ');
}

export interface RsvpSection {
  section: string;
  fields: RsvpField[];
}

export type RsvpFieldOrSection = RsvpField | RsvpSection;

export interface RsvpTotalField {
  key: string;
  label: string;
}

export interface RsvpFilterField {
  key: string;
  label: string;
}

export interface RsvpConfig {
  active: boolean;
  start_date?: string;
  close_date?: string;
  closed_message?: string;
  override_key?: string;
  fields: RsvpFieldOrSection[];
  totals?: RsvpTotalField[];
  filters?: RsvpFilterField[];
}

export function isSection(item: RsvpFieldOrSection): item is RsvpSection {
  return 'section' in item;
}

export function flatFields(fields: RsvpFieldOrSection[]): RsvpField[] {
  const result: RsvpField[] = [];
  for (const item of fields) {
    if (isSection(item)) {
      result.push(...item.fields);
    } else {
      result.push(item);
    }
  }
  return result;
}

export function isEditableField(field: RsvpField): boolean {
  return field.type !== 'readonly' && field.type !== 'image' && field.type !== 'template';
}

export function isRsvpOpen(rsvp?: RsvpConfig | null): boolean {
  if (!rsvp?.active) return false;
  const now = new Date();
  if (rsvp.start_date && new Date(rsvp.start_date) > now) return false;
  if (rsvp.close_date && new Date(rsvp.close_date) < now) return false;
  return true;
}

export function isBeforeStart(rsvp: RsvpConfig): boolean {
  return !!(rsvp.start_date && new Date(rsvp.start_date) > new Date());
}

export async function submitRsvp(eventId: string, responses: Record<string, unknown>) {
  const { $supabase } = useNuxtApp();

  const { error } = await $supabase.from('event_rsvps').insert({
    event_id: eventId,
    responses,
  });

  if (error) {
    console.error('[submitRsvp]', error);
    throw new Error('Failed to submit RSVP. Please try again.');
  }
}
