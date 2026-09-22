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
export const MEMBERSHIP_FORM: RsvpConfig = {
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
