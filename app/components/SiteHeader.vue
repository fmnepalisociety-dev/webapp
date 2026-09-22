<template>
  <header class="site-header">
    <div class="header-container">
      <!-- Brand row: English title | logo | Nepali title -->
      <div class="brand">
        <div class="brand-title brand-title--en">
          <h1><span>Nepali Society of</span> <span>Fargo-Moorhead</span></h1>
        </div>

        <div class="brand-center">
          <span class="acronym">NeSFM</span>
          <NuxtLink
            to="/"
            class="brand-logo"
            aria-label="Home"
            :style="{ '--logo-scale': logoScale }"
          >
            <img src="/logo.png" alt="NeSFM Logo" />
          </NuxtLink>
        </div>

        <div class="brand-title brand-title--np">
          <h2 class="devnagari"><span>नेपाली समाज</span> <span>फार्गो-मूरहेड</span></h2>
        </div>
      </div>

      <!-- Credentials -->
      <div class="credentials">
        <button type="button" class="credential" @click="irsModal?.open()">
          <font-awesome-icon :icon="['fas', 'certificate']" />
          501(c)(3) Nonprofit Organization
        </button>
        <button type="button" class="credential" @click="certModal?.open()">
          <font-awesome-icon :icon="['fas', 'building-columns']" />
          Incorporated in the State of North Dakota
        </button>
      </div>
      <PdfModal
        ref="irsModal"
        src="/docs/irs-501c3.pdf"
        title="IRS 501(c)(3) Determination Letter"
      />
      <PdfModal
        ref="certModal"
        src="/docs/certificate-of-incorporation.pdf"
        title="Certificate of Incorporation — State of North Dakota"
      />

      <!-- Calls-to-action -->
      <nav class="header-actions" aria-label="Get involved">
        <NuxtLink to="/membership" class="cta">
          <font-awesome-icon :icon="['fas', 'user-plus']" />
          <span>Become a Member</span>
        </NuxtLink>
        <NuxtLink to="/donation" class="cta">
          <font-awesome-icon :icon="['fas', 'heart']" />
          <span>Donate</span>
        </NuxtLink>
        <NuxtLink to="/contacts" class="cta cta--ghost">
          <font-awesome-icon :icon="['fas', 'envelope']" />
          <span>Contact</span>
        </NuxtLink>
      </nav>
    </div>

  </header>
</template>

<script setup lang="ts">
import PdfModal from './PdfModal.vue';

const irsModal = ref<InstanceType<typeof PdfModal> | null>(null);
const certModal = ref<InstanceType<typeof PdfModal> | null>(null);

// Shrink the logo from full size to 60% over the first 220px of scroll.
const logoScale = ref(1);
function onScroll() {
  const progress = Math.min(window.scrollY / 220, 1);
  logoScale.value = 1 - progress * 0.4;
}
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.site-header {
  position: relative;
  overflow: hidden;
}

/* Soft glow behind the logo for depth. */
.site-header::before {
  content: '';
  position: absolute;
  top: -40%;
  left: 50%;
  width: 520px;
  height: 520px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 65%);
  pointer-events: none;
}

.header-container {
  position: relative;
  max-width: 1040px;
  gap: 1.1rem;
}

/* ---------- Brand row ---------- */
.brand {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
}

.brand-title h1,
.brand-title h2 {
  margin: 0;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* One title line per span on wide screens. */
.brand-title span {
  display: block;
  width: fit-content;
}

.brand-title--en span {
  margin-left: auto;
}

.brand-title--np span {
  margin-right: auto;
}

/* Same size on both sides: with the Nepali tracking below, the two titles then
   run to about the same width. */
.brand-title h1,
.brand-title h2 {
  font-size: clamp(1.3rem, 2.8vw, 2rem);
}

/* Devanagari sets narrower than Latin at the same size, so bump it up to
   fill a similar width to the English side. */
.brand-title h2 {
  font-weight: 600;
  /* Wide tracking lets the Nepali side span the English side's width without
     growing taller. */
  letter-spacing: 0.2em;
  /* Devanagari glyphs carry tall marks; tighten lines so the block matches the
     English side's height. */
  line-height: 1.05;
}

.brand-title--en {
  text-align: right;
}

.brand-title--np {
  text-align: left;
}

.brand-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.acronym {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  color: #ffd700;
}

.brand-logo {
  display: grid;
  place-items: center;
  --logo-size: 170px;
  width: var(--logo-size);
  height: var(--logo-size);
  /* Scale (not resize) on scroll so the page below doesn't shift. */
  transform: scale(var(--logo-scale, 1));
  transform-origin: center top;
  will-change: transform;
}

/* Shadow cast upward, hugging the logo's own shape. */
.brand-logo img {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 -8px 14px rgba(0, 0, 0, 0.35));
  transition: filter 0.25s ease;
}

.brand-logo:hover img {
  filter: drop-shadow(0 -8px 18px rgba(255, 215, 0, 0.45));
}

/* ---------- Credentials ---------- */
.credentials {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

/* Inline, not flex: when the text wraps on a narrow screen, the icon stays
   beside the first word instead of floating off beside the whole block. */
.credential {
  display: inline;
  text-align: center;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.3);
  text-underline-offset: 4px;
  transition: color 0.2s, text-decoration-color 0.2s;
}

.credential svg {
  margin-right: 0.4rem;
  color: #ffd700;
  font-size: 0.75rem;
}

.credential:hover {
  color: #fff;
  text-decoration-color: #ffd700;
}

/* ---------- CTAs ---------- */
.header-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.3rem;
}

/* Same pills as the footer's actions. */
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  background: #fff;
  color: #a31432;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.cta:hover {
  transform: translateY(-1px);
  background: #ffd700;
  color: #1c3382;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

/* Tertiary action: outlined so it sits behind the two above. */
.cta--ghost {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: none;
}

.cta--ghost:hover {
  background: #ffd700;
  color: #1c3382;
  border-color: #ffd700;
}

/* Matching gold lines under each title, fading away from the logo, so the
   two sides read as a pair whatever their text length. */
.brand-title::after {
  content: '';
  display: block;
  width: 96px;
  height: 3px;
  margin-top: 0.6rem;
  border-radius: 3px;
}

.brand-title--en::after {
  margin-left: auto;
  background: linear-gradient(90deg, transparent, #ffd700);
}

.brand-title--np::after {
  margin-right: auto;
  background: linear-gradient(90deg, #ffd700, transparent);
}

/* ---------- Mobile ---------- */
@media (max-width: 768px) {
  .brand {
    gap: 0.9rem;
  }

  .brand-logo {
    --logo-size: 120px;
  }

  .brand-title h1,
  .brand-title h2 {
    font-size: 1.05rem;
  }

  .acronym {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
  }
}

@media (max-width: 520px) {
  .brand {
    grid-template-columns: 1fr;
    grid-template-areas: 'logo' 'en' 'np';
    gap: 0.4rem;
    text-align: center;
  }

  .brand-center {
    grid-area: logo;
  }

  .brand-title--en {
    grid-area: en;
    text-align: center;
  }

  .brand-title--np {
    grid-area: np;
    text-align: center;
  }

  /* Stacked layout: each title flows as one line. */
  .brand-title span {
    display: inline;
    margin: 0;
  }

  /* The lines point at the logo; once the titles stack they have nothing to
     point at. */
  .brand-title::after {
    display: none;
  }

  .header-actions {
    gap: 0.4rem;
  }

  /* Three worded pills don't fit one row on a phone. Stacking the icon over
     the label keeps every word — same trick as the nav's tight tier. */
  .cta {
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.4rem 0.7rem;
    font-size: 0.72rem;
    line-height: 1.25;
    text-align: center;
    border-radius: 0.75rem;
  }

  .cta svg {
    font-size: 0.9rem;
  }
}
</style>
