export interface RsvpField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'readonly' | 'image' | 'template';
  required?: boolean;
  required_if?: { field: string; value: string };
  options?: string[];
  value?: string;
}

export interface RsvpSection {
  section: string;
  fields: RsvpField[];
}

export type RsvpFieldOrSection = RsvpField | RsvpSection;

export interface RsvpConfig {
  active: boolean;
  start_date?: string;
  close_date?: string;
  fields: RsvpFieldOrSection[];
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
