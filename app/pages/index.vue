<template>
  <div class="about-page">

    <TimeWindow
      start="2026-01-13T00:00:00"
      end="2026-01-17T23:59:59"
      timezone="GMT"
    >
      <div class="image-section">
        <img
          src="/img/nsfm-maaghe-sakranti-2026.jpg"
          class="event-image"
          alt="NSFM-Maghe-Sakranti">
        <p class="image-caption">Happy Maghe Sankranti</p>
      </div>
    </TimeWindow>

    <div class="intro">
      <p>
        We are a community-based, non-profit organization dedicated to bringing together the Nepalese community in the
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
// Static content; can later be loaded from a database
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

.image-section {
  text-align: center;
  margin: 2rem 0;
}

.event-image {
  width: 100%;
  max-width: 700px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-caption {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

.details p {
  margin-bottom: 1rem;
  line-height: 1.6;
}
</style>
