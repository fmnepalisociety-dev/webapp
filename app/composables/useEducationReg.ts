import type {RsvpConfig} from '~/composables/useRsvp';

/**
 * Education (Nepali Pathsala) registration. Reuses the RSVP form engine, mirrors
 * the membership feature: a public form → the `education_registrations` table →
 * an admin review panel.
 *
 * Each session (term) has its own config blob in `app_config` under the key
 * `education:<slug>` (e.g. `education:2026_fall`), holding the period, fee, open
 * flag, CTA banner, and the form. A single `education_current` key points at the
 * slug the public site uses by default, so future sessions can be prepared ahead
 * of time and switched on when ready. Registrations are stamped with the slug.
 */
export type RegistrationStatus =
  | 'new'
  | 'unpaid'
  | 'processing'
  | 'confirmed'
  | 'waitlisted'
  | 'rejected';

export interface RegisterBanner {
  active: boolean;
  title: string;
  subtitle: string;
  button_label: string;
}

export interface EducationSession {
  slug: string; // 'YYYY_season', e.g. '2026_fall' — stamped on each registration
  term: string; // human label, e.g. 'Fall 2026'
  starts: string; // YYYY-MM-DD
  ends: string; // YYYY-MM-DD
  fee: number; // USD
  open: boolean; // whether registration is currently accepted
  banner: RegisterBanner;
  form: RsvpConfig;
}

/** Built-in default form (used until a saved config exists). */
export const DEFAULT_EDUCATION_FORM: RsvpConfig = {
  active: true,
  fields: [
    {
      section: 'Student',
      fields: [
        {key: 'kid_name', label: "Child's full name", type: 'text', required: true},
        {key: 'kid_age', label: "Child's age", type: 'number', required: true},
        {key: 'kid_grade', label: "Child's grade", type: 'text', required: true},
      ],
    },
    {
      section: 'Parent / Guardian',
      fields: [
        {key: 'parent_name', label: 'Parent / guardian name', type: 'text', required: true},
        {key: 'parent_email', label: 'Email', type: 'email', required: true},
        {key: 'parent_phone', label: 'Phone', type: 'tel', required: true},
        {
          key: 'nesfm_member',
          label: 'Are you a NeSFM member?',
          type: 'select',
          options: ['Yes', 'No'],
          required: true,
        },
      ],
    },
    {
      section: 'Fees & payment',
      fields: [
        {
          key: 'fee_note',
          label: '',
          type: 'template',
          value:
            '<p style="margin:0 0 0.5rem">The fee is <strong>$35</strong> for the Fall session, running <strong>September–December 2026</strong>.</p>' +
            '<p style="margin:0">Pay via <strong>Zelle</strong> to <strong>kandelsl@gmail.com</strong> — please include the child\'s name in the payment notes.</p>',
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

/** Built-in default session (used when a slug has no saved config). */
export const DEFAULT_SESSION: EducationSession = {
  slug: '2026_fall',
  term: 'Fall 2026',
  starts: '2026-09-01',
  ends: '2026-12-31',
  fee: 35,
  open: true,
  banner: {
    active: true,
    title: 'Fall 2026 registration is open!',
    subtitle: 'Nepali Pathsala runs September–December · $35 for the session',
    button_label: 'Register Now!',
  },
  form: DEFAULT_EDUCATION_FORM,
};

export const CURRENT_SESSION_KEY = 'education_current';
export const sessionKey = (slug: string) => `education:${slug}`;

/** The slug the public site uses by default. */
export async function getCurrentSlug(): Promise<string> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('app_config')
    .select('value')
    .eq('key', CURRENT_SESSION_KEY)
    .maybeSingle();
  if (error) {
    console.error('[getCurrentSlug]', error);
    return DEFAULT_SESSION.slug;
  }
  const v = (data as {value?: unknown} | null)?.value;
  if (typeof v === 'string' && v) return v;
  if (v && typeof v === 'object' && typeof (v as any).slug === 'string') return (v as any).slug;
  return DEFAULT_SESSION.slug;
}

export async function setCurrentSlug(slug: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('app_config')
    .upsert({key: CURRENT_SESSION_KEY, value: slug, updated_at: new Date().toISOString()});
  if (error) console.error('[setCurrentSlug]', error);
  return {error};
}

/** Load one session's config, merged over the default. */
export async function getSession(slug: string): Promise<EducationSession> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('app_config')
    .select('value')
    .eq('key', sessionKey(slug))
    .maybeSingle();
  if (error) console.error('[getSession]', error);
  const value = (data as {value?: Partial<EducationSession>} | null)?.value;
  const base: EducationSession =
    slug === DEFAULT_SESSION.slug ? DEFAULT_SESSION : {...DEFAULT_SESSION, slug, term: slug};
  if (!value) return base;
  return {
    ...base,
    ...value,
    slug,
    banner: {...base.banner, ...(value.banner ?? {})},
    form: value.form && Array.isArray((value.form as any).fields) ? (value.form as RsvpConfig) : base.form,
  };
}

/** The current (default) session config. */
export async function getCurrentSession(): Promise<EducationSession> {
  return getSession(await getCurrentSlug());
}

export async function saveSession(session: EducationSession): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('app_config')
    .upsert({key: sessionKey(session.slug), value: session, updated_at: new Date().toISOString()});
  if (error) console.error('[saveSession]', error);
  return {error};
}

/** All configured sessions (for the admin picker), newest slug first. */
export async function listSessions(): Promise<EducationSession[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase.from('app_config').select('value').like('key', 'education:%');
  if (error) {
    console.error('[listSessions]', error);
    return [];
  }
  return (data as {value: EducationSession}[])
    .map((r) => r.value)
    .filter((v) => v && typeof v.slug === 'string')
    .sort((a, b) => (a.slug < b.slug ? 1 : -1));
}

/** Insert an education registration (public submission), stamped with the slug. */
export async function submitEducationReg(responses: Record<string, unknown>, slug: string) {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('education_registrations')
    .insert({responses, status: 'new', session: slug});
  if (error) {
    console.error('[submitEducationReg]', error);
    throw new Error('Failed to submit your registration. Please try again.');
  }
}

/* -----------------------------
 * Admin
 * --------------------------- */

export interface EducationRegistration {
  id: string;
  responses: Record<string, any>;
  status: RegistrationStatus;
  session: string | null; // slug it was submitted for, e.g. '2026_fall'
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'new',
  'unpaid',
  'processing',
  'confirmed',
  'waitlisted',
  'rejected',
];

export async function getRegistrations(): Promise<EducationRegistration[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('education_registrations')
    .select('*')
    .order('created_at', {ascending: false});
  if (error) {
    console.error('[getRegistrations]', error);
    return [];
  }
  return (data as EducationRegistration[]) ?? [];
}

export async function updateRegistration(
  id: string,
  patch: Partial<Pick<EducationRegistration, 'status' | 'admin_notes'>>
): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase
    .from('education_registrations')
    .update({...patch, updated_at: new Date().toISOString()})
    .eq('id', id);
  if (error) console.error('[updateRegistration]', error);
  return {error};
}

export async function deleteRegistration(id: string): Promise<{error: unknown}> {
  const {$supabase} = useNuxtApp();
  const {error} = await $supabase.from('education_registrations').delete().eq('id', id);
  if (error) console.error('[deleteRegistration]', error);
  return {error};
}
