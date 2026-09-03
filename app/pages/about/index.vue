<template>
  <div class="about-us">
    <div class="org-details">
      <div class="org-row">
        <span class="org-label">Legal Name</span>
        <span class="org-value">Nepali Society of Fargo-Moorhead</span>
      </div>
      <div class="org-row">
        <span class="org-label">Type</span>
        <span class="org-value">
          <a href="#" class="doc-link" @click.prevent="irsModal?.open()">501(c)(3) Public Charity</a>
        </span>
      </div>
      <div class="org-row">
        <span class="org-label">EIN</span>
        <span class="org-value">41-3684284</span>
      </div>
      <div class="org-row">
        <span class="org-label">Incorporated</span>
        <span class="org-value">
          <a href="#" class="doc-link" @click.prevent="certModal?.open()">State of North Dakota (SOS Control ID: 0007360209)</a>
        </span>
      </div>
      <div class="org-row">
        <span class="org-label">Address</span>
        <span class="org-value">3273 Evergreen Rd N, Fargo, ND 58102</span>
      </div>
      <div class="org-row">
        <span class="org-label">Email</span>
        <span class="org-value"><a href="mailto:fmnepalisociety@gmail.com">fmnepalisociety@gmail.com</a></span>
      </div>
    </div>

    <div class="body">
      <p>
        We are a community-based, non-profit organization dedicated to bringing together the Nepali community in the
        Fargo–Moorhead area. Our mission is to celebrate Nepali culture, traditions, and language while fostering
        meaningful engagement with the wider local community.
      </p>

      <p>
        The Nepali Society of Fargo-Moorhead was created to unite Nepali students, professionals, entrepreneurs, and
        families living in the region. Through cultural events, volunteer activities, and social initiatives, we aim to
        strengthen our community, promote intercultural understanding, and provide a supportive space for all members.
      </p>

      <p>
        We take pride in our vibrant traditions, from celebrating festivals like Dashain and Tihar to organizing
        community gatherings. These events not only preserve our cultural heritage but also create opportunities for
        connection, learning, and shared joy.
      </p>

      <p>
        At the Nepali Society of Fargo-Moorhead, we encourage active participation, collaboration, and the sharing of
        talents. Together, we strive to build lasting relationships, make a positive impact, and ensure that every
        member feels valued and empowered.
      </p>

      <p class="signature">Join us as we celebrate our culture, engage with our community, and create a meaningful
        journey together.</p>
    </div>

    <PdfModal ref="irsModal" src="/docs/irs-501c3.pdf" title="IRS 501(c)(3) Determination Letter" />
    <PdfModal ref="certModal" src="/docs/certificate-of-incorporation.pdf" title="Certificate of Incorporation — State of North Dakota" />
  </div>
  <OfficialBanner />
</template>

<script lang="ts" setup>
const irsModal = ref<InstanceType<typeof PdfModal> | null>(null);
const certModal = ref<InstanceType<typeof PdfModal> | null>(null);
</script>

<style scoped>
.about-us {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-left: 6px solid #3498db;
  border-radius: 8px;
  font-family: var(--app-font);
  color: #333;
}

.header h2 {
  margin-bottom: 1rem;
  font-size: 1.9rem;
  color: #3498db;
  border-bottom: 2px solid #3498db;
  display: inline-block;
  padding-bottom: 0.25rem;
}

.body p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.signature {
  margin-top: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.org-details {
  margin: 0 0 2rem;
  padding: 1.25rem 1.5rem;
  background-color: #eef6fc;
  border-radius: 8px;
  border: 1px solid #d4e6f1;
}

.org-row {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.org-row:last-child {
  border-bottom: none;
}

.org-label {
  flex: 0 0 130px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.org-label::after {
  content: ':';
  margin-right: 0.75rem;
}

.org-value {
  color: #444;
  font-size: 0.9rem;
}

.org-details a {
  color: #3498db;
}

@media (max-width: 512px) {
  .org-row {
    flex-direction: column;
    gap: 2px;
  }

  .org-label {
    flex: none;
    font-size: 0.8rem;
  }
}

.doc-link {
  text-decoration: none;
  border-bottom: 1px dashed #3498db;
  cursor: pointer;
}

.doc-link:hover {
  color: #2c3e50;
  border-bottom-style: solid;
}
</style>
