import type {Flyer, TimeboundMeta} from '~/types/flyer';

export async function getActiveFlyers(): Promise<Flyer[]> {
  const {$supabase} = useNuxtApp();

  const {data, error} = await $supabase
    .from('flyers')
    .select('*')
    .eq('active', true)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching flyers:', error);
    return [];
  }

  const now = new Date();

  return (data as Flyer[]).filter((flyer) => {
    if (flyer.type === 'timebound') {
      const meta = flyer.metadata as TimeboundMeta | null;
      if (!meta?.start_date || !meta?.end_date) return false;
      return now >= new Date(meta.start_date) && now <= new Date(meta.end_date);
    }
    return true;
  });
}
