export interface RsvpField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'readonly' | 'image';
  required?: boolean;
  options?: string[];
  value?: string; // for readonly text or image src
}

export interface RsvpSection {
  section: string;
  fields: RsvpField[];
}

export type RsvpFieldOrSection = RsvpField | RsvpSection;

export interface RsvpConfig {
  id: string;
  event_id: string;
  fields: RsvpFieldOrSection[];
  active: boolean;
}

function isSection(item: RsvpFieldOrSection): item is RsvpSection {
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
  return field.type !== 'readonly' && field.type !== 'image';
}

export async function getRsvpConfig(eventId: string): Promise<RsvpConfig | null> {
  const { $supabase } = useNuxtApp();

  const { data, error } = await $supabase
    .from('event_rsvp_config')
    .select('*')
    .eq('event_id', eventId)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return data as RsvpConfig;
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

export async function getEventsWithRsvp(): Promise<string[]> {
  const { $supabase } = useNuxtApp();

  const { data, error } = await $supabase
    .from('event_rsvp_config')
    .select('event_id')
    .eq('active', true);

  if (error || !data) return [];
  return data.map((r: { event_id: string }) => r.event_id);
}
