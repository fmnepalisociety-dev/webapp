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
}
</style>
<script setup lang="ts">
const irsModal = ref<InstanceType<typeof PdfModal> | null>(null);
const certModal = ref<InstanceType<typeof PdfModal> | null>(null);
</script>