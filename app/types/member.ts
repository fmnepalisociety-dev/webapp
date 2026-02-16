export interface Member {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  member_id: string | null;
  membership_type: string | null;
  expiry_date: string | null;
  image_path: string | null;
}