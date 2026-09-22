export type RecurrenceFreq = 'weekly' | 'biweekly' | 'monthly';

export interface Session {
  iso: string; // YYYY-MM-DD
  date: Date; // local Date for the session
  cancelled: boolean;
}
