export type FlyerType = 'timebound' | 'permanent';

export interface TimeboundMeta {
  start_date: string;
  end_date: string;
  event_id?: string;
}

export interface Flyer {
  id: number;
  title: string;
  caption: string | null;
  image_path: string;
  type: FlyerType;
  metadata: TimeboundMeta | Record<string, unknown> | null;
  active: boolean;
}
