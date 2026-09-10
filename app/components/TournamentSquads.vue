<template>
  <div class="ts-versus" :style="{gridTemplateColumns}">
    <template v-for="(t, i) in tournament.teams" :key="t.key">
      <div v-if="i > 0" class="ts-vs" aria-hidden="true">VS</div>
      <section class="ts-side">
        <header :class="['ts-side-head', `ts-side-head--${t.kind}`]">
          <span class="ts-side-name">{{ t.label }}</span>
          <span class="ts-side-count">{{ counts[t.key] ?? 0 }}</span>
        </header>
        <SquadDisplay
          :sport="tournament.sport"
          :team="t.team"
          compact
          @loaded="counts[t.key] = $event"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {reactive, computed} from 'vue';
import type {Tournament} from '~/composables/useSquad';

const props = defineProps<{tournament: Tournament}>();

const counts = reactive<Record<string, number>>({});

// Columns: one `1fr` per team side, with an `auto` VS divider between each.
const gridTemplateColumns = computed(() =>
  props.tournament.teams.map((_, i) => (i === 0 ? '1fr' : 'auto 1fr')).join(' ')
);
</script>

<style scoped>
/* Side-by-side on all screen sizes, with a central VS divider between teams. */
.ts-versus {
  display: grid;
  gap: 0.75rem;
  align-items: start;
}

.ts-side {
  min-width: 0;
}

.ts-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.6rem;
  color: #fff;
  margin-bottom: 1rem;
}

.ts-side-head--home {
  background: linear-gradient(120deg, #1c3382, #2749b8);
}

.ts-side-head--opponent {
  background: linear-gradient(120deg, #a31432, #d21f45);
}

.ts-side-name {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.ts-side-count {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
}

.ts-vs {
  align-self: center;
  font-size: 0.95rem;
  font-weight: 900;
  color: #94a3b8;
  padding: 0 0.25rem;
}

@media (max-width: 520px) {
  .ts-versus {
    gap: 0.4rem;
  }
  .ts-side-head {
    padding: 0.45rem 0.55rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .ts-side-name {
    font-size: 0.9rem;
  }
  .ts-vs {
    font-size: 0.8rem;
  }
}
</style>
