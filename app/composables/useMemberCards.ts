import type { Member, MemberCardData } from '~/types/member';

export async function getMembersForCards(): Promise<Member[]> {
  const { $supabase } = useNuxtApp();

  const { data, error } = await $supabase
  .from('members')
  .select('id, firstname, lastname');//, member_id, membership_type, expiry_date, image_path')

  if (error) {
    console.error('[getMembersForCards]', error);
    return [];
  }

  return data ?? [];
}

export function generateQrData(member: Member): string {
  const cardData: MemberCardData = {
    v: 1,
    org: 'NSFM',
    id: member.member_id ?? `M-${member.id}`,
    n: formatMemberName(member),
    t: member.membership_type ?? 'Standard',
    exp: member.expiry_date
  };
  return JSON.stringify(cardData);
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
  return member.member_id ?? `M-${member.id}`;
}

export function getMembershipType(member: Member): string {
  return member.membership_type ?? 'Standard';
}
