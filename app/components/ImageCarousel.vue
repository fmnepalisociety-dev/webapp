<template>
  <div v-if="images.length" class="carousel">
    <div class="carousel-stage" ref="stageRef">
      <div
        class="carousel-track"
        :style="{ transform: `translateX(-${current * 100}%)` }"
      >
        <div v-for="(src, i) in images" :key="i" class="carousel-slide">
          <img
            :src="src"
            :alt="`Image ${i + 1}`"
            class="carousel-image"
            @click="$emit('open', i)"
            @load="i === 0 ? $emit('firstLoad', $event) : undefined"
          />
        </div>
      </div>

      <!-- Arrows -->
      <template v-if="images.length > 1">
        <button class="carousel-arrow carousel-arrow--left" @click="prev" aria-label="Previous">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
        </button>
        <button class="carousel-arrow carousel-arrow--right" @click="next" aria-label="Next">
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </button>

        <!-- Counter -->
        <span class="carousel-counter">{{ current + 1 }} / {{ images.length }}</span>
      </template>
    </div>

    <!-- Dots -->
    <div v-if="images.length > 1" class="carousel-dots">
      <button
        v-for="(_, i) in images"
        :key="i"
        class="carousel-dot"
        :class="{ active: i === current }"
        @click="current = i"
        :aria-label="`Go to image ${i + 1}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  images: string[];
}>();

defineEmits<{
  open: [index: number];
  firstLoad: [event: Event];
}>();

const current = ref(0);
const stageRef = ref<HTMLElement | null>(null);

let touchStartX = 0;
let touchStartY = 0;
let swiping = false;

function prev() {
  current.value = (current.value - 1 + props.images.length) % props.images.length;
}

function next() {
  current.value = (current.value + 1) % props.images.length;
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  swiping = false;
}

function onTouchMove(e: TouchEvent) {
  const dx = Math.abs(e.touches[0].clientX - touchStartX);
  const dy = Math.abs(e.touches[0].clientY - touchStartY);
  if (dx > dy && dx > 10) {
    swiping = true;
    e.preventDefault();
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!swiping) return;
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    diff > 0 ? next() : prev();
  }
}

onMounted(() => {
  const el = stageRef.value;
  if (!el) return;
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd, { passive: true });
});

onBeforeUnmount(() => {
  const el = stageRef.value;
  if (!el) return;
  el.removeEventListener('touchstart', onTouchStart);
  el.removeEventListener('touchmove', onTouchMove);
  el.removeEventListener('touchend', onTouchEnd);
});
</script>

<style scoped>
.carousel {
  user-select: none;
}

.carousel-stage {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
}

.carousel-track {
  display: flex;
  transition: transform 0.35s ease;
}

.carousel-slide {
  flex: 0 0 100%;
  min-width: 0;
}

.carousel-image {
  display: block;
  width: 100%;
  height: auto;
  cursor: pointer;
}

/* Arrows */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.15s;
  z-index: 2;
}

.carousel-arrow:hover {
  background: rgba(0, 0, 0, 0.7);
}

.carousel-arrow--left {
  left: 0.4rem;
}

.carousel-arrow--right {
  right: 0.4rem;
}

/* Counter */
.carousel-counter {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 0.75rem;
  z-index: 2;
}

/* Dots */
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #d1d5db;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s;
}

.carousel-dot.active {
  background: #2563eb;
}
</style>
