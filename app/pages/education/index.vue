<template>
  <main class="education-page">
    <header class="edu-hero">
      <div class="edu-hero-icon">
        <font-awesome-icon :icon="['fas', 'graduation-cap']" />
      </div>
      <div>
        <p class="edu-kicker">Nepali Society of Fargo-Moorhead</p>
        <h1 class="edu-title">Education</h1>
        <p class="edu-sub">Keeping our language, culture, and heritage alive</p>
      </div>
    </header>

    <section class="edu-intro">
      <h2 class="edu-intro-title">Nepali Pathsala — नेपाली पाठशाला</h2>
      <p>
        Nepali Pathsala is our community learning program to help the next generation
        stay connected to the Nepali language, culture, and heritage. Let’s keep our
        language, culture, and heritage alive!
      </p>
      <p class="edu-intro-np">
        आउनुहोस्, हाम्रो भाषा, संस्कृति र पहिचानलाई जीवित राखौं! विद्यालय उमेरका
        बालबालिकाहरूलाई स्वागत छ।
      </p>
      <p class="edu-note">
        Program flyers and schedules will be posted here. Check back soon for the next
        session.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({title: 'Education — Nepali Pathsala'});
</script>

<style scoped>
.education-page {
  max-width: 74rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.edu-hero {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1.5rem;
  border-radius: 0.9rem;
  background: linear-gradient(120deg, rgba(28, 51, 130, 0.95), rgba(163, 20, 50, 0.9));
  color: #fff;
  margin-bottom: 1.75rem;
}

.edu-hero-icon {
  font-size: 2.4rem;
  width: 3.6rem;
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  flex-shrink: 0;
}

.edu-kicker {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.edu-title {
  margin: 0.1rem 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.edu-sub {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.edu-intro {
  max-width: 46rem;
}

.edu-intro-title {
  margin: 0 0 0.9rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1c3382;
}

.edu-intro p {
  margin: 0 0 1rem;
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
}

.edu-intro-np {
  color: #a31432;
  font-weight: 600;
}

.edu-note {
  margin-top: 1.5rem !important;
  padding: 0.9rem 1.1rem;
  border-radius: 0.6rem;
  background: rgba(28, 51, 130, 0.06);
  border-left: 3px solid #1c3382;
  font-size: 0.95rem !important;
  color: #444;
}

@media (max-width: 520px) {
  .education-page {
    padding: 1rem;
  }
  .edu-title {
    font-size: 1.4rem;
  }
}
</style>
