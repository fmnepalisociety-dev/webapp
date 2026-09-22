import type {RsvpConfig} from '~/composables/useRsvp';

/**
 * Membership application status. Applications land as `new`; an admin moves them
 * through the pipeline and eventually links an approved application to a row in
 * the `members` table (`member_id`).
 */
export type ApplicationStatus =
  | 'new'
  | 'unpaid'
  | 'processing'
  | 'accepted'
  | 'registered'
  | 'rejected';

/**
 * Default membership form. Reuses the RSVP form engine (RsvpConfig +
 * RsvpFieldRenderer) so the same field types work: text/select for details,
 * `lineitems` for family members, `template`/`image` for payment instructions,
 * and `number` for the amount paid. In a later phase this moves into a DB-backed,
 * admin-editable config; for now it lives in code.
 */
export const MEMBERSHIP_FORM_KEY = 'membership_form';

/** Built-in default used when no saved config exists (and as the "reset" target). */
export const DEFAULT_MEMBERSHIP_FORM: RsvpConfig = {
  active: true,
  fields: [
    {
      section: 'Applicant',
      fields: [
        {key: 'first_name', label: 'First name', type: 'text', required: true},
        {key: 'last_name', label: 'Last name', type: 'text', required: true},
        {key: 'email', label: 'Email', type: 'email', required: true},
        {key: 'phone', label: 'Phone', type: 'tel', required: true},
        {key: 'address', label: 'Address', type: 'textarea'},
      ],
    },
    {
      section: 'Family members',
      fields: [
        {
          key: 'has_family',
          label: 'Do you have family members?',
          type: 'select',
          options: ['Yes', 'No'],
          required: true,
        },
        {
          key: 'family',
          label: 'Family members',
          type: 'lineitems',
          required_if: {field: 'has_family', value: 'Yes'},
          add_label: 'Add member',
          item_fields: [
            {key: 'name', label: 'Full name', type: 'text'},
            {key: 'relationship', label: 'Relationship', type: 'text'},
            {key: 'age', label: 'Age', type: 'number'},
          ],
        },
      ],
    },
    {
      section: 'Payment',
      fields: [
        {
          key: 'pay_info',
          label: '',
          type: 'template',
          value:
            '<p style="margin:0 0 0.5rem">Pay membership dues via <strong>Zelle</strong> to <strong>NeSFM</strong> — please use the scan code below, or send it to <strong>kandelsl@gmail.com</strong>. The membership fee is <strong>$20</strong>.</p>' +
            '<p style="margin:0">When you pay, please include your <strong>name</strong> and <strong>"Membership"</strong> in the payment notes so we can match it to your application.</p>',
        },
        {key: 'zelle', label: 'Zelle', type: 'image', value: '/img/payment/nesfm-zelle.jpeg'},
        {
          key: 'paid',
          label: 'Have you paid?',
          type: 'select',
          options: ['Yes', 'No'],
          required: true,
        },
        {
          key: 'amount_paid',
          label: 'Amount paid (USD)',
          type: 'number',
          required_if: {field: 'paid', value: 'Yes'},
        },
        {
          key: 'payment_reference',
          label: 'Payment confirmation / reference # (optional)',
          type: 'text',
        },
      ],
    },
  ],
};

/** Load the membership form config from `app_config`, falling back to the default. */
export async function getMembershipForm(): Promise<RsvpConfig> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('app_config')
    .select('value')
    .eq('key', MEMBERSHIP_FORM_KEY)
    .maybeSingle();
  if (error) {
    console.error('[getMembershipForm]', error);
    return DEFAULT_MEMBERSHIP_FORM;
  }
  const value = (data as {value?: RsvpConfig} | null)?.value;
  return value && Array.isArray(value.fields) ? value : DEFAULT_MEMBERSHIP_FORM;
}

/** Save (upsert) the membership form config. */
export async function saveMembershipForm(config: RsvpConfig): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('app_config')
    .upsert({key: MEMBERSHIP_FORM_KEY, value: config, updated_at: new Date().toISOString()});
  if (error) console.error('[saveMembershipForm]', error);
  return {error};
}

/** Insert a membership application (public submission). */
export async function submitApplication(responses: Record<string, unknown>) {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('membership_applications')
    .insert({responses, status: 'new'});
  if (error) {
    console.error('[submitApplication]', error);
    throw new Error('Failed to submit your application. Please try again.');
  }
}

/* -----------------------------
 * Admin
 * --------------------------- */

export interface MembershipApplication {
  id: string;
  responses: Record<string, any>;
  status: ApplicationStatus;
  member_id: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'new',
  'unpaid',
  'processing',
  'accepted',
  'registered',
  'rejected',
];

export async function getApplications(): Promise<MembershipApplication[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('membership_applications')
    .select('*')
    .order('created_at', {ascending: false});
  if (error) {
    console.error('[getApplications]', error);
    return [];
  }
  return (data as MembershipApplication[]) ?? [];
}

export async function updateApplication(
  id: string,
  patch: Partial<Pick<MembershipApplication, 'status' | 'admin_notes' | 'member_id'>>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('membership_applications')
    .update({...patch, updated_at: new Date().toISOString()})
    .eq('id', id);
  if (error) console.error('[updateApplication]', error);
  return {error};
}

export async function deleteApplication(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from('membership_applications').delete().eq('id', id);
  if (error) console.error('[deleteApplication]', error);
  return {error};
}
