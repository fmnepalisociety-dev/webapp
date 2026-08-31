<template>
  <div class="grid-card">
    <div class="grid-card-media">
      <!-- Multiple images: carousel with counter + swipe (click image → detail) -->
      <ImageCarousel
        v-if="imageUrls.length > 1"
        class="grid-card-carousel"
        :images="imageUrls"
        :autoplay="false"
        :background="imageBg"
        height="230px"
        @open="(i) => { lightboxIndex = i; lightboxOpen = true; }"
      />
      <!-- Single image -->
      <div
        v-else-if="imageUrls.length === 1"
        class="grid-card-image"
        :style="{ background: imageBg }"
        @click="lightboxIndex = 0; lightboxOpen = true"
      >
        <img :src="imageUrls[0]" :alt="product.name" />
      </div>
      <!-- No image -->
      <div v-else class="grid-card-image grid-card-noimage" :style="{ background: imageBg }" @click="goToDetail">
        <font-awesome-icon :icon="['fas', 'bag-shopping']" />
      </div>
    </div>

    <div class="grid-card-body">
      <h3 class="grid-card-name">
        <NuxtLink :to="path" class="grid-card-name-link">{{ product.name }}</NuxtLink>
      </h3>

      <div class="grid-card-meta">
        <span v-if="priceText" class="grid-card-price">
          <font-awesome-icon :icon="['fas', 'tag']" />
          {{ priceText }}
        </span>

        <!-- Info icon: full description as a hover/focus tooltip -->
        <span v-if="detailsHtml" class="details-tip" tabindex="0" aria-label="Product details">
          <font-awesome-icon :icon="['fas', 'circle-info']" />
          <span class="details-tip-pop">
            <span class="details-tip-body" v-html="detailsHtml"></span>
          </span>
        </span>
      </div>

      <p v-if="blurb" class="grid-card-blurb">{{ blurb }}</p>

      <div class="grid-card-actions">
        <NuxtLink :to="path" class="card-link card-link--details">
          Details
        </NuxtLink>
        <NuxtLink
          v-if="hasForm && orderOpen"
          :to="`${path}/order`"
          class="card-link card-link--order"
        >
          <font-awesome-icon :icon="['fas', 'bag-shopping']" /> Request
        </NuxtLink>
      </div>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <Transition name="lb">
        <div v-if="lightboxOpen" class="lightbox-overlay" @click="lightboxOpen = false">
          <button class="lightbox-close" @click="lightboxOpen = false">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>

          <template v-if="imageUrls.length > 1">
            <button class="lightbox-nav lightbox-nav--left" @click.stop="lightboxPrev">
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <button class="lightbox-nav lightbox-nav--right" @click.stop="lightboxNext">
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </button>
            <span class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ imageUrls.length }}</span>
          </template>

          <img :src="imageUrls[lightboxIndex]" :alt="product.name" class="lightbox-img" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </div>
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
  };
}>();

const path = computed(() => productPath(props.product));

const { getPublicImageUrl } = useSupabaseImage();

const hasForm = computed(() => !!props.product.order_form);
const orderOpen = computed(() => isRsvpOpen(props.product.order_form));
const imageBg = computed(() => props.product.image_bg || DEFAULT_PRODUCT_BG);

const imageUrls = computed(() => {
  if (!props.product.image?.length) return [];
  return props.product.image
    .map((path) => getPublicImageUrl(NeSFM_GENERIC_BUCKET, path))
    .filter((url): url is string => !!url);
});

const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

function lightboxPrev() {
  lightboxIndex.value = (lightboxIndex.value - 1 + imageUrls.value.length) % imageUrls.value.length;
}

function lightboxNext() {
  lightboxIndex.value = (lightboxIndex.value + 1) % imageUrls.value.length;
}

const priceText = computed(() => {
  const p = props.product.price;
  if (p === null || p === undefined || p === ('' as any)) return '';
  const num = Number(p);
  if (isNaN(num)) return String(p);
  return `$${num.toFixed(2)}`;
});

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Card blurb prefers the short promo; falls back to a plain-text description.
const blurb = computed(() => {
  if (props.product.promo) return stripHtml(props.product.promo);
  if (props.product.description) return stripHtml(props.product.description);
  return '';
});

// Full description shown in the info tooltip (keeps line breaks / markup).
const detailsHtml = computed(() => props.product.description?.trim() || '');

function goToDetail() {
  navigateTo(path.value);
}
</script>

<style scoped>
.grid-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 470px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.grid-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.grid-card-media {
  flex-shrink: 0;
}

/* round only the top of the carousel stage / single image */
.grid-card-carousel :deep(.carousel-stage) {
  border-radius: 0.75rem 0.75rem 0 0;
}

.grid-card-carousel :deep(.carousel-footer) {
  padding: 0.35rem 0.75rem 0;
}

.grid-card-image {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.75rem 0.75rem 0 0;
  cursor: pointer;
}

.grid-card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.grid-card-noimage {
  color: #cbd5e1;
  font-size: 2.5rem;
}

.grid-card-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 1rem 1rem;
}

.grid-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.grid-card-name-link {
  color: #1e3a5f;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grid-card-name-link:hover {
  text-decoration: underline;
}

.grid-card-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.grid-card-price {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  padding: 0.15rem 0.55rem;
  border-radius: 1rem;
}

.grid-card-price svg {
  font-size: 0.7rem;
  color: #16a34a;
}

/* Info icon + tooltip */
.details-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  cursor: help;
  outline: none;
  font-size: 0.95rem;
}

.details-tip-pop {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: 240px;
  max-height: 220px;
  overflow-y: auto;
  padding: 0.6rem 0.75rem;
  background: #1e293b;
  color: #f1f5f9;
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  font-size: 0.8rem;
  font-weight: 400;
  line-height: 1.5;
  word-break: break-word;
  text-align: left;
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
}

.details-tip-pop::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0.75rem;
  border: 6px solid transparent;
  border-top-color: #1e293b;
}

.details-tip:hover .details-tip-pop,
.details-tip:focus-within .details-tip-pop {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.details-tip-body :deep(*) {
  margin: 0 0 0.4rem;
}

.details-tip-body :deep(*:last-child) {
  margin-bottom: 0;
}

.grid-card-blurb {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grid-card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.6rem;
}

.card-link {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.15s ease;
}

.card-link--details {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.card-link--details:hover {
  background: #dbeafe;
}

.card-link--order {
  background: #2563eb;
  color: #fff;
}

.card-link--order:hover {
  background: #1d4ed8;
}

.card-link--order svg {
  font-size: 0.75rem;
}

/* Lightbox */
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
</style>
