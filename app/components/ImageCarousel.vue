<template>
  <div v-if="images.length" class="carousel">
    <div class="carousel-stage" ref="stageRef" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <div class="carousel-track">
        <div
          v-for="(src, i) in images"
          :key="i"
          class="carousel-slide"
          :class="{ active: i === current }"
        >
          <img
            :src="src"
            :alt="`Image ${i + 1}`"
            class="carousel-image"
            @click="$emit('open', i)"
          />
        </div>
      </div>

      <template v-if="images.length > 1">
        <button class="carousel-nav carousel-nav--left" @click="prev" aria-label="Previous">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
        </button>
        <button class="carousel-nav carousel-nav--right" @click="next" aria-label="Next">
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </button>
      </template>
    </div>

    <!-- Progress bar + counter below image -->
    <div v-if="images.length > 1" class="carousel-footer">
      <div class="carousel-progress">
        <div
          v-for="(_, i) in images"
          :key="i"
          class="carousel-progress-seg"
          :class="{ active: i === current, past: i < current }"
          @click="current = i; resetAutoplay()"
        >
          <div class="carousel-progress-fill"></div>
        </div>
      </div>
      <span class="carousel-counter">{{ current + 1 }} / {{ images.length }}</span>
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
}>();

const current = ref(0);
const stageRef = ref<HTMLElement | null>(null);
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
const paused = ref(false);

let touchStartX = 0;
let touchStartY = 0;
let swiping = false;

function prev() {
  current.value = (current.value - 1 + props.images.length) % props.images.length;
  resetAutoplay();
}

function next() {
  current.value = (current.value + 1) % props.images.length;
  resetAutoplay();
}

function startAutoplay() {
  if (props.images.length <= 1) return;
  autoplayTimer = setInterval(() => {
    if (!paused.value) {
      current.value = (current.value + 1) % props.images.length;
    }
  }, 4000);
}

function resetAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer);
  startAutoplay();
}

function onMouseEnter() { paused.value = true; }
function onMouseLeave() { paused.value = false; }

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
  startAutoplay();
});

onBeforeUnmount(() => {
  const el = stageRef.value;
  if (!el) return;
  el.removeEventListener('touchstart', onTouchStart);
  el.removeEventListener('touchmove', onTouchMove);
  el.removeEventListener('touchend', onTouchEnd);
  if (autoplayTimer) clearInterval(autoplayTimer);
});
</script>

<style scoped>
.carousel {
  user-select: none;
}

.carousel-stage {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  height: 360px;
  background: #1a1a1a;
}

.carousel-track {
  position: relative;
  height: 100%;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 2.4s ease;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 1;
}

.carousel-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

@media (max-width: 700px) {
  .carousel-stage {
    height: 260px;
  }
}

/* Nav zones */
.carousel-nav {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rem;
  border: none;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.15), transparent);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s, color 0.2s;
}

.carousel-stage:hover .carousel-nav {
  opacity: 1;
}

.carousel-nav:hover {
  color: #fff;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.35), transparent);
}

.carousel-nav--left {
  left: 0;
  border-radius: 0.75rem 0 0 0.75rem;
}

.carousel-nav--right {
  right: 0;
  border-radius: 0 0.75rem 0.75rem 0;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.15), transparent);
}

.carousel-nav--right:hover {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.35), transparent);
}

/* Progress bar below image */
.carousel-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.2rem 0 0.25rem;
}

.carousel-progress {
  flex: 1;
  display: flex;
  gap: 3px;
  height: 5px;
}

.carousel-progress-seg {
  flex: 1;
  background: #e5e7eb;
  cursor: pointer;
  overflow: hidden;
  border-radius: 2px;
  transition: background 0.2s;
}

.carousel-progress-seg:hover {
  background: #d1d5db;
}

.carousel-progress-seg.past {
  background: #93c5fd;
}

.carousel-progress-seg .carousel-progress-fill {
  height: 100%;
  width: 0;
  background: #2563eb;
  border-radius: 2px;
}

.carousel-progress-seg.active .carousel-progress-fill {
  width: 100%;
  animation: carousel-fill 4s linear;
}

@keyframes carousel-fill {
  from { width: 0; }
  to { width: 100%; }
}

.carousel-counter {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .carousel-nav {
    width: 2.25rem;
    font-size: 0.9rem;
    opacity: 1;
  }
}
</style>
