<template>
  <header>
    <div class="header-container">
      <div class="header-grid">
        <!-- Column 1: Main Logo -->
        <div class="logo-column">
          <NuxtLink to="/">
            <img class="main-logo-img" src="/logo.png" alt="NeSFM Logo"/>
          </NuxtLink>
        </div>

        <!-- Column 2: Text -->
        <div class="text-column">
          <h1 class="text-header">Nepali Society of Fargo-Moorhead</h1>
          <div class="acronym">(NeSFM)</div>
          <h2 class="text-header devnagari">नेपाली समाज फार्गो-मूरहेड</h2>
          <div class="nonprofit-tags">
            <a class="nonprofit-tag" href="#" @click.prevent="irsModal?.open()">
              501(c)(3) Nonprofit Organization
            </a>
            <a class="nonprofit-tag" href="#" @click.prevent="certModal?.open()">
              Incorporated in the State of North Dakota
            </a>
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
        </div>

        <!-- Column 3: Flags -->
        <div class="flags-column">
          <img
            class="side-flag us-flag"
            src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg"
            alt="US Flag"
          />
          <img
            class="side-flag nepal-flag"
            src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Flag_of_Nepal.svg"
            alt="Nepal Flag"
          />
        </div>
      </div>

      <!-- Calls-to-action, right-aligned just above the nav -->
      <div class="header-actions">
        <NuxtLink to="/membership" class="cta-btn">
          <font-awesome-icon :icon="['fas', 'user-plus']" />
          <span>Become a Member</span>
        </NuxtLink>
        <NuxtLink to="/donation" class="cta-btn">
          <font-awesome-icon :icon="['fas', 'heart']" />
          <span>Donate</span>
        </NuxtLink>
        <!-- Tertiary action: outlined so it sits behind the two above. -->
        <NuxtLink to="/contacts" class="cta-btn cta-btn--ghost" aria-label="Contact us" title="Contact us">
          <font-awesome-icon :icon="['fas', 'envelope']" />
          <span>Contact</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
}

/* Call-to-action buttons, centered under the header text and pulled down toward
   the nav, so they group with the bar below rather than with the text above. */
.header-actions {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
  margin-bottom: -1.1rem;
}

.cta-btn {
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

.cta-btn:hover {
  transform: translateY(-1px);
  background: #ffd700;
  color: #1c3382;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

.cta-btn--ghost {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: none;
}

.cta-btn--ghost:hover {
  background: #ffd700;
  color: #1c3382;
  border-color: #ffd700;
}

/* Logo */
.logo-column .main-logo-img {
  width: 80px;
}

.main-logo-img {
  width: 40%;
  min-width: 100px;
  max-width: 250px;
  height: auto;
}

/* Text */
.text-column {
  text-align: center;
}

.text-header {
  margin: 6px 0;
  line-height: 1.2;
}

.acronym {
  font-weight: 700;
  font-size: 1.6rem;
  letter-spacing: 0.15em;
  text-indent: 0.15em; /* balance the trailing letter-spacing */
  color: #fff;
  margin: 4px 0;
}

.nonprofit-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin: 6px 0 0;
}

.nonprofit-tag {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.04em;
  font-weight: 500;
  cursor: pointer;
  /* Faint underline so these read as links before you hover them. */
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.4);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color 0.2s, text-decoration-color 0.2s;
}

.nonprofit-tag:hover {
  color: #fff;
  text-decoration-color: #ffd700;
}

/* Flags */
.flags-column {
  display: flex;
  gap: 0.75rem;
}

.side-flag {
  width: 12%;
  min-width: 30px;
  max-width: 50px;
  height: auto;
}

.nepal-flag {
  width: 25%;
}

.us-flag {
  width: 40%;
}

/* =========================
   Mobile Responsiveness
   ========================= */
@media (max-width: 768px) {
  .header-grid {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 0;
  }

  .text-column {
    line-height: 1;
  }

  .text-header {
    margin: 6px 0;
  }

  /* Hide flags on small devices */
  .flags-column {
    display: none;
  }

  .header-actions {
    margin-top: 1rem;
    margin-bottom: -0.9rem;
  }
}

/* Three worded pills don't fit one row on a phone. Stacking the icon over the
   label keeps every word — same trick as the nav's tight tier. */
@media (max-width: 520px) {
  .header-actions {
    gap: 0.4rem;
  }

  .cta-btn {
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.4rem 0.7rem;
    font-size: 0.72rem;
    line-height: 1.25;
    text-align: center;
    border-radius: 0.75rem;
  }

  .cta-btn svg {
    font-size: 0.9rem;
  }
}
</style>
<script setup lang="ts">
const irsModal = ref<InstanceType<typeof PdfModal> | null>(null);
const certModal = ref<InstanceType<typeof PdfModal> | null>(null);
</script>