<template>
  <section class="product-card">
    <div class="product-main">
      <!-- Left: media -->
      <div class="product-media">
        <div v-if="allImageUrls.length" class="product-media-inner">
          <ImageCarousel
            v-if="allImageUrls.length > 1"
            :images="allImageUrls"
            :autoplay="false"
            :background="imageBg"
            square
            @open="(i) => { lightboxIndex = i; lightboxOpen = true; }"
          />
          <div v-else class="product-thumb" :style="{ background: imageBg }" @click="lightboxOpen = true">
            <img :src="imageUrl!" alt="Product Image" />
            <div class="expand-hint">
              <font-awesome-icon :icon="['fas', 'expand']" />
              <span>View</span>
            </div>
          </div>
        </div>
        <div v-else class="product-noimage" :style="{ background: imageBg }">
          <font-awesome-icon :icon="['fas', 'bag-shopping']" />
        </div>
      </div>

      <!-- Right: info -->
      <div class="product-info">
        <h1 class="product-heading">{{ product.name }}</h1>

        <span v-if="priceText" class="product-price">
          <font-awesome-icon :icon="['fas', 'tag']" />
          {{ priceText }}
        </span>

        <NuxtLink
          v-if="hasForm && orderOpen"
          :to="`${path}/order`"
          class="btn btn-blue product-order-top"
        >
          <font-awesome-icon :icon="['fas', 'bag-shopping']" />
          Request Now
        </NuxtLink>

        <p v-if="product.promo" v-html="product.promo" class="product-promo"></p>
        <div v-if="product.description" class="product-body" v-html="product.description"></div>

        <!-- Actions -->
        <div v-if="hasForm" class="product-actions">
          <template v-if="orderOpen">
            <NuxtLink :to="`${path}/order`" class="btn btn-blue">
              <font-awesome-icon :icon="['fas', 'bag-shopping']" />
              Request Now
            </NuxtLink>
            <div class="order-qr" ref="qrContainer">
              <QrCode :value="orderUrl" :size="88" />
              <span class="order-qr-label">Scan to request</span>
              <button class="order-qr-download" title="Download QR code" @click="downloadQr">
                <font-awesome-icon :icon="['fas', 'download']" /> Save QR
              </button>
            </div>
          </template>
          <NuxtLink v-else :to="`${path}/order`" class="order-closed-badge">
            Sorry, requests have closed
            <span class="order-closed-more">More Info</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Videos (detail view) -->
    <div v-if="expanded && videos.length" class="product-videos">
      <h3 class="videos-heading">Videos</h3>
      <div class="videos-grid">
        <div v-for="(video, i) in videos" :key="i" class="video-embed">
          <iframe
            v-if="video.type === 'youtube' && youtubeId(video.src)"
            :src="`https://www.youtube-nocookie.com/embed/${youtubeId(video.src)}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxOpen" class="lightbox-overlay" @click="lightboxOpen = false">
          <button class="lightbox-close" @click="lightboxOpen = false">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>

          <template v-if="allImageUrls.length > 1">
            <button class="lightbox-nav lightbox-nav--left" @click.stop="lightboxPrev">
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <button class="lightbox-nav lightbox-nav--right" @click.stop="lightboxNext">
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </button>
            <span class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ allImageUrls.length }}</span>
          </template>

          <img :src="allImageUrls[lightboxIndex]" alt="Product Image" class="lightbox-img" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isRsvpOpen } from '~/composables/useRsvp';
import { DEFAULT_PRODUCT_BG, productPath, type OrderFormConfig } from '~/composables/useProducts';
import { NeSFM_GENERIC_BUCKET } from '~/composables/useSupabaseImage';

const props = defineProps<{
  product: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string;
    promo?: string;
    price?: number | null;
    image?: string[] | null;
    image_bg?: string | null;
    order_form?: OrderFormConfig | null;
    videos?: { type: string; src: string }[] | null;
  };
  expanded?: boolean;
}>();

const { getPublicImageUrl } = useSupabaseImage();

const qrContainer = ref<HTMLElement | null>(null);
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

const imageBg = computed(() => props.product.image_bg || DEFAULT_PRODUCT_BG);
const path = computed(() => productPath(props.product));

const hasForm = computed(() => !!props.product.order_form);
const orderOpen = computed(() => isRsvpOpen(props.product.order_form));

const priceText = computed(() => {
  const p = props.product.price;
  if (p === null || p === undefined || p === ('' as any)) return '';
  const num = Number(p);
  if (isNaN(num)) return String(p);
  return `$${num.toFixed(2)}`;
});

const allImageUrls = computed(() => {
  if (!props.product.image?.length) return [];
  return props.product.image
    .map((path) => getPublicImageUrl(NeSFM_GENERIC_BUCKET, path))
    .filter((url): url is string => !!url);
});

const imageUrl = computed(() => allImageUrls.value[0] ?? null);

function lightboxPrev() {
  lightboxIndex.value = (lightboxIndex.value - 1 + allImageUrls.value.length) % allImageUrls.value.length;
}

function lightboxNext() {
  lightboxIndex.value = (lightboxIndex.value + 1) % allImageUrls.value.length;
}

const orderUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}${path.value}/order`;
});

function downloadQr() {
  const svg = qrContainer.value?.querySelector('svg');
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('width', '1024');
  clone.setAttribute('height', '1024');

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    URL.revokeObjectURL(url);
    Object.assign(document.createElement('a'), {
      download: `order-qr-${props.product.id}.png`,
      href: canvas.toDataURL('image/png'),
    }).click();
  };
  img.src = url;
}

const videos = computed(() => props.product.videos ?? []);

function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/) ?? null;
  return m ? m[1] : null;
}
</script>

<style scoped>
.product-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ===== Two-column main ===== */
.product-main {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.product-media {
  flex: 0 0 44%;
  min-width: 0;
  position: sticky;
  top: 1rem;
}

.product-media-inner {
  width: 100%;
}

.product-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.product-thumb:hover img {
  transform: scale(1.03);
}

.expand-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s;
}

.expand-hint svg {
  font-size: 1.2rem;
}

.product-thumb:hover .expand-hint {
  opacity: 1;
}

.product-noimage {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 3rem;
}

/* ===== Right info ===== */
.product-info {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.product-heading {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0;
  line-height: 1.25;
}

.product-price {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-size: 1.05rem;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
}

.product-price svg {
  font-size: 0.85rem;
  color: #16a34a;
}

.product-order-top {
  align-self: flex-start;
}

/* Promo = short lead intro, shown first */
.product-promo {
  color: #334155;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.6;
  margin: 0;
}

/* Description = fuller details; supports pasted HTML (lists, headings, etc.) */
.product-body {
  color: #374151;
  line-height: 1.65;
  font-size: 0.92rem;
  word-break: break-word;
}

.product-body :deep(p) {
  margin: 0 0 0.75rem;
}

.product-body :deep(h4) {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 1rem 0 0.4rem;
}

.product-body :deep(ul) {
  margin: 0 0 0.75rem;
  padding-left: 1.1rem;
}

.product-body :deep(li) {
  margin: 0.2rem 0;
}

.product-body :deep(strong) {
  color: #1e293b;
}

.product-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.product-body :deep(*:last-child) {
  margin-bottom: 0;
}

/* ===== Actions ===== */
.product-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-blue {
  background-color: #2563eb;
  color: white;
}

.btn-blue:hover {
  background-color: #1d4ed8;
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);
}

.btn-blue:active {
  transform: translateY(1px);
}

.order-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.order-qr-label {
  font-size: 0.62rem;
  color: #9ca3af;
}

.order-qr-download {
  font-size: 0.6rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.order-qr-download:hover {
  text-decoration: underline;
}

.order-closed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.order-closed-badge:hover {
  background: #fee2e2;
}

.order-closed-more {
  font-size: 0.7rem;
  font-weight: 500;
  color: #2563eb;
}

/* ===== Videos ===== */
.product-videos {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
}

.videos-heading {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #000;
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ===== Lightbox ===== */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: default;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 1.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 1.25rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 10000;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-nav--left {
  left: 1rem;
}

.lightbox-nav--right {
  right: 1rem;
}

.lightbox-counter {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  z-index: 10000;
}

.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.2s ease;
}

.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .product-card {
    padding: 1rem;
  }

  .product-main {
    flex-direction: column;
    gap: 1.25rem;
  }

  .product-media {
    max-width: 100%;
    width: 100%;
    position: static;
  }

  .product-heading {
    font-size: 1.4rem;
  }
}
</style>
