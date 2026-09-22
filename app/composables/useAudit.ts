export interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
}

/** Recent audit-log entries, newest first. */
export async function getAuditLog(limit = 300): Promise<AuditEntry[]> {
  const {$supabase} = useNuxtApp();
  const {data, error} = await $supabase
    .from('audit_log')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(limit);
  if (error) {
    console.error('[getAuditLog]', error);
    return [];
  }
  return (data as AuditEntry[]) ?? [];
}
