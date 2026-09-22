export interface EducationItem {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  event_date: string | null; // YYYY-MM-DD
  event_time: string | null;
  location: string | null;
  recurring: string | null; // e.g. "Weekly on Fridays"; null = one-off
  active: boolean;
  created_at?: string;
}
