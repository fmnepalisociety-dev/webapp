<template>
  <div class="ec-versus">
    <section class="ec-side">
      <header class="ec-side-head ec-side-head--nesfm">
        <span class="ec-side-name">NeSFM</span>
        <span class="ec-side-count">{{ nesfmCount }}</span>
      </header>
      <SquadDisplay :sport="FOOTBALL" :team="EVEREST_CUP_2026" compact @loaded="nesfmCount = $event" />
    </section>

    <div class="ec-vs" aria-hidden="true">VS</div>

    <section class="ec-side">
      <header class="ec-side-head ec-side-head--nsa">
        <span class="ec-side-name">NSA</span>
        <span class="ec-side-count">{{ nsaCount }}</span>
      </header>
      <SquadDisplay :sport="FOOTBALL" :team="EVEREST_CUP_2026_NSA" compact @loaded="nsaCount = $event" />
    </section>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {FOOTBALL, EVEREST_CUP_2026, EVEREST_CUP_2026_NSA} from '~/composables/useSquad';

const nesfmCount = ref(0);
const nsaCount = ref(0);
</script>

<style scoped>
/* Side-by-side on all screen sizes, with a central VS divider. */
.ec-versus {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.75rem;
  align-items: start;
}

.ec-side {
  min-width: 0;
}

.ec-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.6rem;
  color: #fff;
  margin-bottom: 1rem;
}

.ec-side-head--nesfm {
  background: linear-gradient(120deg, #1c3382, #2749b8);
}

.ec-side-head--nsa {
  background: linear-gradient(120deg, #a31432, #d21f45);
}

.ec-side-name {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.ec-side-count {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
}

.ec-vs {
  align-self: center;
  font-size: 0.95rem;
  font-weight: 900;
  color: #94a3b8;
  padding: 0 0.25rem;
}

@media (max-width: 520px) {
  .ec-versus {
    gap: 0.4rem;
  }
  .ec-side-head {
    padding: 0.45rem 0.55rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .ec-side-name {
    font-size: 0.9rem;
  }
  .ec-vs {
    font-size: 0.8rem;
  }
}
</style>
