import type { Member } from '~/types/member';

export async function getMembersForCards(): Promise<Member[]> {
  const { $supabase } = useNuxtApp();

  const { data, error } = await $supabase
  .from('members')
  .select('id, firstname, lastname, membership_id, membership_type, expiry_date, image_path');

  if (error) {
    console.error('[getMembersForCards]', error);
    return [];
  }

  return data ?? [];
}

export function generateQrData(member: Member): string {
  // Generate URL to the member's ID card page
  // In production, this will use the actual domain (fmnepali.org)
  // In development, it will use localhost:3000
  if (import.meta.client) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/members/${member.id}/id-card`;
  }
  // Fallback for SSR (shouldn't happen since ssr: false, but just in case)
  return `https://www.fmnepali.org/members/${member.id}/id-card`;
}

export function formatMemberName(member: Member): string {
  const formatPart = (value: string | null): string => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };
  return `${formatPart(member.firstname)} ${formatPart(member.lastname)}`.trim();
}

export function formatExpiryDate(date: string | null): string {
  if (!date) return 'No Expiry';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'No Expiry';
  }
}

export function isExpired(date: string | null): boolean {
  if (!date) return false;
  try {
    return new Date(date) < new Date();
  } catch {
    return false;
  }
}

export function getMemberId(member: Member): string {
  if (member.member_id) {
    return member.member_id;
  }

  const id = String(member.id).padStart(4, '0');
  return `NSFM-${id}`;
}

export function getMembershipType(member: Member): string {
  return member.membership_type ?? 'Standard';
}
