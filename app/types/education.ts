import type {RecurrenceFreq} from '~/types/recurrence';

export type {RecurrenceFreq, Session} from '~/types/recurrence';

export interface EducationItem {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  event_date: string | null; // anchor / start date, YYYY-MM-DD
  event_time: string | null;
  location: string | null;
  map_url: string | null; // optional Google Maps (or any) link for the location
  recurrence_freq: RecurrenceFreq | null; // null = single (one-off) session
  cancelled_dates: string[]; // YYYY-MM-DD dates with no session
  active: boolean;
  created_at?: string;
}
