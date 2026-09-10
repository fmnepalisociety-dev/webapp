<template>
  <div class="ts-stack">
    <nav class="ts-jump" aria-label="Jump to team">
      <button
        v-for="t in tournament.teams"
        :key="t.key"
        type="button"
        :class="['ts-jump-btn', `ts-jump-btn--${t.kind}`]"
        @click="scrollToTeam(t.key)"
      >
        {{ t.label }}
      </button>
    </nav>

    <template v-for="(t, i) in tournament.teams" :key="t.key">
      <div v-if="i > 0" class="ts-vs" aria-hidden="true"><span>VS</span></div>
      <section :id="`team-${t.key}`" class="ts-team">
        <header :class="['ts-team-head', `ts-team-head--${t.kind}`]">
          <span class="ts-team-name">{{ t.label }}</span>
          <span class="ts-team-count">{{ counts[t.key] ?? 0 }} players</span>
        </header>
        <SquadDisplay
          :sport="tournament.sport"
          :team="t.team"
          @loaded="counts[t.key] = $event"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue';
import type {Tournament} from '~/composables/useSquad';

defineProps<{tournament: Tournament}>();

const counts = reactive<Record<string, number>>({});

function scrollToTeam(key: string) {
  document.getElementById(`team-${key}`)?.scrollIntoView({behavior: 'smooth', block: 'start'});
}
</script>

<style scoped>
/* Row-based: each team is a full-width block stacked vertically, with a VS
   divider between them. */
.ts-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Quick links that scroll to each team block. */
.ts-jump {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.ts-jump-btn {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: filter 0.15s;
}

.ts-jump-btn:hover {
  filter: brightness(0.95);
}

.ts-jump-btn--home {
  background: #e0e7ff;
  color: #3730a3;
}

.ts-jump-btn--opponent {
  background: #fee2e2;
  color: #991b1b;
}

/* Offset so the sticky site header doesn't cover the team heading on scroll. */
.ts-team {
  scroll-margin-top: 6rem;
}

.ts-team-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 0.6rem;
  color: #fff;
  margin-bottom: 1.25rem;
}

.ts-team-head--home {
  background: linear-gradient(120deg, #1c3382, #2749b8);
}

.ts-team-head--opponent {
  background: linear-gradient(120deg, #a31432, #d21f45);
}

.ts-team-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.ts-team-count {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
}

/* Centered VS with a rule on each side. */
.ts-vs {
  display: flex;
  align-items: center;
}

.ts-vs::before,
.ts-vs::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.ts-vs span {
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 900;
  color: #94a3b8;
}
</style>
