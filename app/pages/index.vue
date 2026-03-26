<template>
  <div class="about-page">

    <div v-for="flyer in flyers" :key="flyer.id" class="image-section">
      <img
        v-if="flyerImages[flyer.id]"
        :src="flyerImages[flyer.id]"
        class="event-image"
        :alt="flyer.title">
      <p v-if="flyer.caption" class="image-caption">{{ flyer.caption }}</p>
    </div>

    <div class="intro">
      <p>
        We are a community-based, non-profit organization dedicated to bringing together the Nepali community in the
        Fargo–Moorhead area. Our mission is to celebrate Nepali culture, language, and traditions, while fostering
        meaningful connections within the broader local community.
      </p>
    </div>

    <div class="image-section">
      <img
        src="/img/nsfm-group-2025.jpg"
        class="event-image"
        alt="Nepali Society Fargo-Moorhead Group 2025">
      <p class="image-caption">Celebrating the Dhaka-Topi Diwas & New Year 2026</p>
    </div>

    <div class="details">
      <p>
        Join us as we continue to strengthen our community, share our culture, and build meaningful relationships with
        neighbors, friends, and the wider Fargo-Moorhead community.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {getActiveFlyers} from '~/composables/useFlyers';
import type {Flyer} from '~/types/flyer';

const {getPublicImageUrl} = useSupabaseImage();

const flyers = ref<Flyer[]>([]);
const flyerImages = ref<Record<number, string | null>>({});

onMounted(async () => {
  flyers.value = await getActiveFlyers();
  for (const flyer of flyers.value) {
    flyerImages.value[flyer.id] = getPublicImageUrl('nsfm', flyer.image_path);
  }
});
</script>

<style scoped>
.about-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.intro h2 {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3498db;
  display: inline-block;
  padding-bottom: 0.25rem;
}

.intro p {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.details p {
  margin-bottom: 1rem;
  line-height: 1.6;
}
</style>
