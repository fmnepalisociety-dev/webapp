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

      <!-- Donate call-to-action, right-aligned just above the nav -->
      <div class="header-actions">
        <NuxtLink to="/donation" class="donate-btn">
          <font-awesome-icon :icon="['fas', 'heart']" />
          <span>Donate</span>
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

/* Donate button */
.header-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.donate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.35rem;
  background: #fff;
  color: #a31432;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.donate-btn:hover {
  transform: translateY(-1px);
  background: #ffd700;
  color: #1c3382;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
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
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.nonprofit-tag:hover {
  color: #fff;
  text-decoration: underline;
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
    justify-content: center;
    margin-top: 1rem;
  }
}
</style>
<script setup lang="ts">
const irsModal = ref<InstanceType<typeof PdfModal> | null>(null);
const certModal = ref<InstanceType<typeof PdfModal> | null>(null);
</script>