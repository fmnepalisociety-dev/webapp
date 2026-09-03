<template>
  <div class="cropper">
    <div
      ref="viewport"
      class="cropper-viewport"
      :style="{ aspectRatio: String(aspect) }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
      @wheel.prevent="onWheel"
    >
      <img
        v-if="src"
        ref="imgEl"
        :src="src"
        class="cropper-img"
        :style="imgStyle"
        draggable="false"
        alt="Crop preview"
        @load="onImgLoad"
      />
      <div v-if="src" class="cropper-hint">
        <font-awesome-icon :icon="['fas', 'up-down-left-right']" />
        Drag to reposition
      </div>
    </div>

    <div v-if="src" class="cropper-controls">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="cropper-zoom-icon" />
      <input
        type="range"
        min="1"
        :max="MAX_ZOOM"
        step="0.01"
        :value="zoom"
        class="cropper-zoom"
        aria-label="Zoom"
        @input="onZoomInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue';

const props = withDefaults(
  defineProps<{
    file: File | null;
    aspect?: number; // width / height of the crop frame (default 4:5)
    outputWidth?: number; // exported image width in px
    quality?: number; // JPEG quality 0..1
  }>(),
  {aspect: 0.8, outputWidth: 800, quality: 0.9}
);

const MAX_ZOOM = 4;

const viewport = ref<HTMLDivElement | null>(null);
const imgEl = ref<HTMLImageElement | null>(null);
const src = ref<string>('');

// Geometry state (all in viewport CSS pixels unless noted).
const natW = ref(0); // image natural width
const natH = ref(0);
const Vw = ref(0); // viewport size
const Vh = ref(0);
const sMin = ref(1); // min scale so the image covers the frame
const s = ref(1); // current scale (displayed px per natural px)
const tx = ref(0); // image top-left offset within viewport
const ty = ref(0);

const zoom = computed(() => (sMin.value ? s.value / sMin.value : 1));

const imgStyle = computed(() => ({
  width: `${natW.value * s.value}px`,
  height: `${natH.value * s.value}px`,
  transform: `translate(${tx.value}px, ${ty.value}px)`,
}));

/* ---------- load the incoming file ---------- */
watch(
  () => props.file,
  (file) => {
    if (src.value) URL.revokeObjectURL(src.value);
    src.value = file ? URL.createObjectURL(file) : '';
  },
  {immediate: true}
);

function onImgLoad() {
  if (!imgEl.value) return;
  natW.value = imgEl.value.naturalWidth;
  natH.value = imgEl.value.naturalHeight;
  measure();
  // Start zoomed to "cover" and centered.
  s.value = sMin.value;
  tx.value = (Vw.value - natW.value * s.value) / 2;
  ty.value = (Vh.value - natH.value * s.value) / 2;
  clamp();
}

function measure() {
  const el = viewport.value;
  if (!el) return;
  Vw.value = el.clientWidth;
  Vh.value = el.clientHeight;
  if (natW.value && natH.value && Vw.value && Vh.value) {
    sMin.value = Math.max(Vw.value / natW.value, Vh.value / natH.value);
    if (s.value < sMin.value) s.value = sMin.value;
    clamp();
  }
}

function clamp() {
  const dispW = natW.value * s.value;
  const dispH = natH.value * s.value;
  tx.value = Math.min(0, Math.max(Vw.value - dispW, tx.value));
  ty.value = Math.min(0, Math.max(Vh.value - dispH, ty.value));
}

/* ---------- zoom ---------- */
function setZoom(nextZoom: number, fx: number, fy: number) {
  const sNew = Math.max(sMin.value, Math.min(sMin.value * MAX_ZOOM, sMin.value * nextZoom));
  if (!s.value) return;
  // Keep the image point under (fx, fy) fixed while scaling.
  const px = (fx - tx.value) / s.value;
  const py = (fy - ty.value) / s.value;
  tx.value = fx - px * sNew;
  ty.value = fy - py * sNew;
  s.value = sNew;
  clamp();
}

function onZoomInput(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value);
  setZoom(v, Vw.value / 2, Vh.value / 2);
}

function onWheel(e: WheelEvent) {
  const rect = viewport.value?.getBoundingClientRect();
  if (!rect) return;
  const fx = e.clientX - rect.left;
  const fy = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  setZoom(zoom.value * factor, fx, fy);
}

/* ---------- pan + pinch (pointer events) ---------- */
const pointers = new Map<number, {x: number; y: number}>();
let dragStart: {x: number; y: number; tx: number; ty: number} | null = null;
let pinchStart: {dist: number; zoom: number} | null = null;

function localXY(e: PointerEvent) {
  const rect = viewport.value!.getBoundingClientRect();
  return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}

function onDown(e: PointerEvent) {
  if (!src.value) return;
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  pointers.set(e.pointerId, localXY(e));
  if (pointers.size === 1) {
    dragStart = {x: e.clientX, y: e.clientY, tx: tx.value, ty: ty.value};
    pinchStart = null;
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = {dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoom.value};
    dragStart = null;
  }
}

function onMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, localXY(e));

  if (pointers.size >= 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    if (pinchStart.dist > 0) setZoom((pinchStart.zoom * dist) / pinchStart.dist, mid.x, mid.y);
  } else if (dragStart) {
    tx.value = dragStart.tx + (e.clientX - dragStart.x);
    ty.value = dragStart.ty + (e.clientY - dragStart.y);
    clamp();
  }
}

function onUp(e: PointerEvent) {
  pointers.delete(e.pointerId);
  if (pointers.size === 1) {
    // Resume single-finger pan from the remaining pointer.
    const [p] = [...pointers.entries()];
    const rect = viewport.value!.getBoundingClientRect();
    dragStart = {x: p[1].x + rect.left, y: p[1].y + rect.top, tx: tx.value, ty: ty.value};
    pinchStart = null;
  } else if (pointers.size === 0) {
    dragStart = null;
    pinchStart = null;
  }
}

/* ---------- export ---------- */
async function getResult(): Promise<File | null> {
  if (!imgEl.value || !props.file || !s.value) return null;
  const outW = props.outputWidth;
  const outH = Math.round(outW / props.aspect);

  // Region of the natural image currently framed by the viewport.
  const sx = -tx.value / s.value;
  const sy = -ty.value / s.value;
  const sW = Vw.value / s.value;
  const sH = Vh.value / s.value;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(imgEl.value, sx, sy, sW, sH, 0, 0, outW, outH);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', props.quality)
  );
  if (!blob) return null;

  const base = props.file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.jpg`, {type: 'image/jpeg'});
}

defineExpose({getResult});

/* ---------- lifecycle ---------- */
function onResize() {
  measure();
}
onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  if (src.value) URL.revokeObjectURL(src.value);
});
</script>

<style scoped>
.cropper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cropper-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 0.4rem;
  border: 1px solid #e2e8f0;
  background: #0f172a;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.cropper-viewport:active {
  cursor: grabbing;
}

.cropper-img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  will-change: transform;
  pointer-events: none;
}

.cropper-hint {
  position: absolute;
  bottom: 0.4rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  color: #e2e8f0;
  font-size: 0.68rem;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
}

.cropper-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cropper-zoom-icon {
  color: #94a3b8;
  font-size: 0.8rem;
}

.cropper-zoom {
  flex: 1;
  accent-color: #0033a0;
  cursor: pointer;
}
</style>
