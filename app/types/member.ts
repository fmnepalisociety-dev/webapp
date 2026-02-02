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

export interface MemberCardData {
  v: number; // schema version
  org: string; // "NSFM"
  id: string; // member ID
  n: string; // name
  t: string; // membership type
  exp: string | null; // expiry date
}
