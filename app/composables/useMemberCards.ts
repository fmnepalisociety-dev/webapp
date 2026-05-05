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

    return value
      .split(/\s+/)
      .map(word => {
        if (!word) return '';

        // If word has any uppercase letters, check if they're intentional
        const hasUppercase = /[A-Z]/.test(word);
        if (hasUppercase) {
          // If all uppercase (like KC, USA), keep it
          if (word === word.toUpperCase()) {
            return word;
          }
          // If has capital letters after the first position (like McDonald, O'Brien, kC), preserve it
          if (word.slice(1) !== word.slice(1).toLowerCase()) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
        }

        // Otherwise, capitalize first letter only
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
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
  return `NeSFM-${id}`;
}

export function getMembershipType(member: Member): string {
  return member.membership_type ?? 'Standard';
}
