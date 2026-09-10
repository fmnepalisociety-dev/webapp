<template>
  <div class="squad-display">
    <div v-if="loading" class="squad-loading">Loading squad…</div>

    <div v-else-if="!players.length" class="squad-empty">{{ emptyText }}</div>

    <ul v-else :class="['squad-grid', compact && 'squad-grid--compact']">
      <li
        v-for="p in players"
        :key="p.id"
        :class="['player-card', p.role ? `player-card--${p.role}` : '']"
      >
        <div class="player-photo">
          <img v-if="thumbs[p.id]" :src="thumbs[p.id]!" :alt="p.name" />
          <div v-else class="player-photo-placeholder">
            <font-awesome-icon :icon="['fas', 'user']" />
          </div>
        </div>
        <div class="player-info">
          <span class="player-name">{{ p.name }}</span>
          <span v-if="roleLabel(p.role)" :class="['player-role', `player-role--${p.role}`]">
            {{ roleLabel(p.role) }}
          </span>
          <span v-else class="player-role player-role--muted">Player</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {getSquad, FOOTBALL, EVEREST_CUP_2026, type SquadPlayer} from '~/composables/useSquad';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

const props = withDefaults(
  defineProps<{
    sport?: string;
    team?: string;
    compact?: boolean;
    emptyText?: string;
  }>(),
  {
    sport: FOOTBALL,
    team: EVEREST_CUP_2026,
    compact: false,
    emptyText: 'The squad will be announced soon. Check back later!',
  }
);

const emit = defineEmits<{(e: 'loaded', count: number): void}>();

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const players = ref<SquadPlayer[]>([]);
const thumbs = ref<Record<string, string | null>>({});

async function load() {
  loading.value = true;
  players.value = await getSquad(props.sport, props.team);
  thumbs.value = {};
  for (const p of players.value) {
    thumbs.value[p.id] = p.image_path
      ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, p.image_path)
      : null;
  }
  loading.value = false;
  emit('loaded', players.value.length);
}

onMounted(load);
watch(() => [props.sport, props.team], load);

function roleLabel(role: string | null): string {
  if (role === 'captain') return 'Captain';
  if (role === 'vice-captain') return 'Vice-Captain';
  return '';
}
</script>

<style scoped>
.squad-loading,
.squad-empty {
  text-align: center;
  color: #6b7280;
  padding: 3rem 1rem;
}

.squad-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  /* 5 players per row on desktop; steps down on narrower screens. */
  grid-template-columns: repeat(5, 1fr);
  gap: 1.25rem;
}

.player-card {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.85rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.player-card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-3px);
}

/* Coloured top accent for the captain / vice-captain. */
.player-card--captain {
  border-color: #fcd34d;
  box-shadow: 0 1px 3px rgba(146, 64, 14, 0.15);
}

.player-card--captain::before,
.player-card--vice-captain::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  z-index: 1;
}

.player-card--captain::before {
  background: #f59e0b;
}

.player-card--vice-captain::before {
  background: #6366f1;
}

.player-photo {
  position: relative;
  aspect-ratio: 4 / 5;
  background: #f1f5f9;
}

.player-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.player-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 3rem;
}

.player-info {
  padding: 0.85rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-items: center;
  text-align: center;
}

.player-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.25;
}

.player-role {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
}

.player-role--captain {
  background: #fef3c7;
  color: #92400e;
}

.player-role--vice-captain {
  background: #e0e7ff;
  color: #3730a3;
}

.player-role--muted {
  background: #f1f5f9;
  color: #94a3b8;
}

/* Responsive column counts — keep 4–5 across a comfortable range. */
@media (max-width: 1024px) {
  .squad-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .squad-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 520px) {
  .squad-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
  }
}

/* Compact variant: used inside the narrow side-by-side Everest Cup columns.
   Cards auto-flow to fit whatever width the column offers, at any screen size. */
.squad-grid--compact {
  grid-template-columns: repeat(auto-fill, minmax(6.25rem, 1fr));
  gap: 0.75rem;
}

.squad-grid--compact .player-info {
  padding: 0.55rem 0.4rem 0.7rem;
  gap: 0.3rem;
}

.squad-grid--compact .player-name {
  font-size: 0.82rem;
}

.squad-grid--compact .player-role {
  font-size: 0.58rem;
  padding: 0.12rem 0.45rem;
}
</style>
