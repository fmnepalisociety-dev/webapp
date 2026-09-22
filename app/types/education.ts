export type RecurrenceFreq = 'weekly' | 'biweekly' | 'monthly';

export interface EducationItem {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  event_date: string | null; // anchor / start date, YYYY-MM-DD
  event_time: string | null;
  location: string | null;
  recurrence_freq: RecurrenceFreq | null; // null = single (one-off) session
  cancelled_dates: string[]; // YYYY-MM-DD dates with no session
  active: boolean;
  created_at?: string;
}

export interface Session {
  iso: string; // YYYY-MM-DD
  date: Date; // local Date for the session
  cancelled: boolean;
}
