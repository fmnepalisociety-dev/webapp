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
          />
        </div>
      </div>

      <template v-if="images.length > 1">
        <!-- Full-height nav zones -->
        <button class="carousel-nav carousel-nav--left" @click="prev" aria-label="Previous">
          <span class="carousel-nav-icon">
            <font-awesome-icon :icon="['fas', 'chevron-left']" />
          </span>
        </button>
        <button class="carousel-nav carousel-nav--right" @click="next" aria-label="Next">
          <span class="carousel-nav-icon">
            <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </span>
        </button>

      </template>
    </div>

    <!-- Dots + counter below image -->
    <div v-if="images.length > 1" class="carousel-footer">
      <div class="carousel-dots">
        <button
          v-for="(_, i) in images"
          :key="i"
          class="carousel-dot"
          :class="{ active: i === current }"
          @click="current = i"
          :aria-label="`Go to image ${i + 1}`"
        />
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
  border-radius: 0.75rem;
  height: 360px;
  background: #1a1a1a;
}

.carousel-track {
  display: flex;
  height: 100%;
  transition: transform 0.35s ease;
}

.carousel-slide {
  flex: 0 0 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Full-height Facebook-style nav zones */
.carousel-nav {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rem;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background 0.2s;
}

.carousel-nav:hover {
  background: rgba(0, 0, 0, 0.08);
}

.carousel-nav--left {
  left: 0;
  border-radius: 0.5rem 0 0 0.5rem;
}

.carousel-nav--right {
  right: 0;
  border-radius: 0 0.5rem 0.5rem 0;
}

.carousel-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.9rem;
  transition: background 0.15s, transform 0.15s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.carousel-nav:hover .carousel-nav-icon {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.15);
}

/* Footer: dots + counter below image */
.carousel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 0 0.25rem;
}

.carousel-dots {
  display: flex;
  gap: 0.4rem;
}

.carousel-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid #9ca3af;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s;
}

.carousel-dot:hover {
  border-color: #2563eb;
  background: #dbeafe;
}

.carousel-dot.active {
  background: #2563eb;
  border-color: #2563eb;
  transform: scale(1.2);
}

.carousel-counter {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
}

@media (max-width: 700px) {
  .carousel-nav {
    width: 2.25rem;
  }

  .carousel-nav-icon {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>
