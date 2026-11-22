<template>
  <main class="campaigns-page">
    <section class="campaigns-hero">
      <div class="hero-icon" aria-hidden="true">
        <font-awesome-icon :icon="['fas', 'bullhorn']" />
      </div>
      <div>
        <p class="eyebrow">NeSFM Community Support</p>
        <h1>Relief Campaigns</h1>
        <p class="hero-copy">
          Bringing our community together to support people affected by emergencies and natural
          disasters.
        </p>
      </div>
    </section>

    <section class="campaigns-section" aria-labelledby="campaign-archive">
      <p class="section-label">Our impact</p>
      <h2 id="campaign-archive">Campaign archive</h2>

      <article class="campaign-card">
        <header class="campaign-card-header">
          <div>
            <span class="campaign-status">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
              Successfully completed
            </span>
            <h3>🇳🇵 Nepal Flood Relief Campaign 2026</h3>
          </div>
          <div class="total-transferred">
            <span>Total transferred to Nepal</span>
            <strong>$8,234.25</strong>
            <small>Approximately NPR 12.14 lakh / NPR 1.21 million</small>
          </div>
        </header>

        <section class="campaign-document" aria-labelledby="campaign-document-title">
          <div class="campaign-document-copy">
            <span class="campaign-document-badge">PDF record</span>
            <div>
              <h4 id="campaign-document-title">Donor Contributions &amp; Financial Summary</h4>
              <p>
                View the complete donor ledger, Danaher company match, campaign fees, and transfer
                reconciliation in one document.
              </p>
            </div>
          </div>
          <div class="campaign-document-actions">
            <a
              href="/docs/campaigns/nesfm-nepal-flood-relief-campaign-2026-donor-summary.pdf"
              target="_blank"
              rel="noopener"
              class="campaign-document-link campaign-document-link-primary"
            >
              View PDF
              <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" />
            </a>
          </div>
        </section>

        <div class="campaign-body">
          <p>
            The Nepali Society of Fargo–Moorhead (NeSFM) is pleased to announce the successful
            completion of our Nepal Flood Relief Campaign.
          </p>
          <p>
            Through the generous contributions of community members, local businesses, and
            supporters—along with a company matching donation from Danaher—we raised a total of
            <strong>$8,468.00</strong>. After applicable fees, the funds were transferred to the
            Prime Minister's Disaster Relief Fund, Nepal.
          </p>

          <section class="vigil-story" aria-labelledby="vigil-title">
            <div class="vigil-copy">
              <p class="vigil-date">August 30, 2026 · Lindenwood Park</p>
              <h4 id="vigil-title">Candlelight Vigil for Nepal Flood Victims</h4>
              <p>
                Community members gathered in Fargo to remember those who lost their lives and to
                stand in solidarity with the families and communities affected by the devastating
                floods in Nepal. We are deeply grateful to everyone who attended, volunteered,
                prayed, and offered support.
              </p>
              <p class="vigil-message">
                Together in grief. Together in solidarity. Together for Nepal. 🇳🇵
              </p>
              <NuxtLink
                to="/events/a07f2ec7-0e78-4e17-bb4d-9770c851caaa"
                class="event-link"
              >
                View the candlelight vigil event
                <font-awesome-icon :icon="['fas', 'chevron-right']" />
              </NuxtLink>
            </div>

            <div class="vigil-gallery">
              <figure class="vigil-gallery-main">
                <img
                  src="/img/campaigns/candlelight-vigil-community.jpg"
                  alt="Community members gathered at Lindenwood Park for the Nepal flood victims candlelight vigil"
                  loading="lazy"
                />
              </figure>
              <figure>
                <img
                  src="/img/campaigns/candlelight-vigil-display.jpg"
                  alt="Nepal flood victims candlelight vigil display with Nepal flags and candles"
                  loading="lazy"
                />
              </figure>
            </div>
          </section>

          <section class="financial-summary" aria-labelledby="financial-summary-title">
            <h4 id="financial-summary-title">Financial &amp; transfer summary</h4>
            <dl>
              <div>
                <dt>Total raised</dt>
                <dd>$8,468.00</dd>
              </div>
              <div>
                <dt>GoFundMe fees</dt>
                <dd>$158.75</dd>
              </div>
              <div>
                <dt>Wire transfer fees</dt>
                <dd>$150.00 <small>($75 covered separately by NeSFM)</small></dd>
              </div>
              <div>
                <dt>November 3, 2026 transfer</dt>
                <dd>$7,209.25 <small>(approximately NPR 10.60 lakh)</small></dd>
              </div>
              <div>
                <dt>November 17, 2026 transfer</dt>
                <dd>$1,025.00 <small>(approximately NPR 1.55 lakh)</small></dd>
              </div>
            </dl>
          </section>

          <section class="transfer-evidence" aria-labelledby="transfer-evidence-title">
            <h4 id="transfer-evidence-title">Verified transfer receipts</h4>
            <p>
              The receipts document both transfers to Nepal's Prime Minister Disaster Relief Fund.
              NeSFM's originator account number is redacted for security; beneficiary information
              remains visible.
            </p>
            <div class="receipt-grid">
              <figure>
                <a
                  href="/img/campaigns/wire-transfer-2026-11-03-redacted.jpg"
                  target="_blank"
                  rel="noopener"
                >
                  <img
                    src="/img/campaigns/wire-transfer-2026-11-03-redacted.jpg"
                    alt="US Bank receipt for the November 3, 2026 transfer of $7,209.25 to Nepal's Prime Minister Disaster Relief Fund"
                    loading="lazy"
                  />
                </a>
                <figcaption>November 3, 2026 · $7,209.25</figcaption>
              </figure>
              <figure>
                <a
                  href="/img/campaigns/wire-transfer-2026-11-17-redacted.jpg"
                  target="_blank"
                  rel="noopener"
                >
                  <img
                    src="/img/campaigns/wire-transfer-2026-11-17-redacted.jpg"
                    alt="US Bank receipt for the November 17, 2026 transfer of $1,025 to Nepal's Prime Minister Disaster Relief Fund"
                    loading="lazy"
                  />
                </a>
                <figcaption>November 17, 2026 · $1,025.00</figcaption>
              </figure>
            </div>
          </section>

          <aside class="campaign-thanks">
            <span class="thanks-icon" aria-hidden="true">🙏</span>
            <div>
              <h4>Thank you for standing together for Nepal</h4>
              <p>
                We sincerely thank all donors, community members, local businesses, and volunteers
                for their generosity and support. Special thanks to our Flood Relief Campaign Team
                Lead and all committee members for their dedication and hard work in making this
                initiative successful.
              </p>
            </div>
          </aside>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({title: 'Relief Campaigns — NeSFM'})
</script>

<style scoped>
.campaigns-page {
  width: min(100% - 2rem, 68rem);
  margin: 0 auto;
  padding: 2rem 0 4rem;
  color: #1e293b;
}

.campaigns-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1.5rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 12% 15%, rgba(255, 215, 0, 0.2), transparent 26%),
    linear-gradient(135deg, #1c3382 0%, #a31432 100%);
  color: #fff;
  box-shadow: 0 1rem 2.5rem rgba(28, 51, 130, 0.18);
}

.hero-icon {
  display: grid;
  place-items: center;
  width: clamp(4rem, 8vw, 5.5rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffd700;
  font-size: clamp(1.6rem, 4vw, 2.25rem);
}

.eyebrow,
.section-label {
  margin: 0 0 0.45rem;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.eyebrow {
  color: #ffe767;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.05;
}

.hero-copy {
  max-width: 42rem;
  margin: 0.85rem 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05rem;
  line-height: 1.65;
}

.campaigns-section {
  margin-top: 2rem;
  padding: clamp(1.4rem, 4vw, 2.25rem);
  border: 1px solid #e2e8f0;
  border-radius: 1.1rem;
  background: #fff;
  box-shadow: 0 0.5rem 1.75rem rgba(15, 23, 42, 0.07);
}

.section-label {
  color: #a31432;
}

h2 {
  margin: 0;
  color: #1c3382;
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.campaign-card {
  margin-top: 1.4rem;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.campaign-card-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(15rem, auto);
  align-items: center;
  gap: 1.5rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
}

.campaign-document {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem clamp(1.25rem, 4vw, 2rem);
  border-top: 1px solid #dbe4f0;
  border-bottom: 1px solid #dbe4f0;
  background: #fff;
}

.campaign-document-copy {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.campaign-document-badge {
  flex: 0 0 auto;
  padding: 0.4rem 0.65rem;
  border-radius: 0.4rem;
  background: #b11236;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.campaign-document h4 {
  margin: 0;
  color: #1e3a5f;
  font-size: 1rem;
}

.campaign-document p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.campaign-document-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.55rem;
}

.campaign-document-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.35rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 750;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.campaign-document-link:hover {
  transform: translateY(-1px);
}

.campaign-document-link-primary {
  background: #1c3382;
  color: #fff;
  box-shadow: 0 4px 10px rgba(28, 51, 130, 0.18);
}

h3 {
  margin: 0.6rem 0 0;
  color: #1e3a5f;
  font-size: clamp(1.35rem, 3vw, 1.8rem);
  line-height: 1.25;
}

.campaign-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.total-transferred {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.2rem;
  border-radius: 0.85rem;
  background: #1c3382;
  color: #fff;
  text-align: center;
}

.total-transferred span {
  color: #ffe767;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.total-transferred strong {
  margin-top: 0.25rem;
  font-size: 1.9rem;
  line-height: 1.1;
}

.total-transferred small {
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
}

.campaign-body {
  padding: clamp(1.25rem, 4vw, 2rem);
}

.campaign-body > p {
  margin: 0 0 1rem;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.7;
}

.campaign-body > p strong {
  color: #1e3a5f;
}

.vigil-story {
  margin-top: 1.5rem;
  padding: clamp(1rem, 3vw, 1.5rem);
  border-radius: 0.85rem;
  background: #f8fafc;
}

.vigil-copy h4,
.transfer-evidence h4 {
  margin: 0;
  color: #1c3382;
  font-size: 1.15rem;
}

.vigil-date {
  margin: 0 0 0.35rem;
  color: #a31432;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.vigil-copy > p:not(.vigil-date) {
  margin: 0.65rem 0 0;
  color: #64748b;
  line-height: 1.65;
}

.vigil-copy .vigil-message {
  color: #1e3a5f;
  font-weight: 700;
}

.event-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.9rem;
  color: #1c3382;
  font-weight: 700;
  text-decoration: none;
}

.event-link:hover {
  color: #a31432;
  text-decoration: underline;
}

.vigil-gallery {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(11rem, 1fr);
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.vigil-gallery figure,
.receipt-grid figure {
  margin: 0;
}

.vigil-gallery img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 17rem;
  max-height: 28rem;
  border-radius: 0.7rem;
  object-fit: cover;
}

.vigil-gallery-main img {
  object-position: center;
}

.financial-summary {
  margin-top: 1.5rem;
}

.financial-summary h4,
.campaign-thanks h4 {
  margin: 0;
  color: #1c3382;
  font-size: 1.05rem;
}

.financial-summary dl {
  margin: 0.75rem 0 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.financial-summary dl > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(13rem, auto);
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.financial-summary dl > div:last-child {
  border-bottom: 0;
}

.financial-summary dt {
  color: #475569;
  font-weight: 650;
}

.financial-summary dd {
  margin: 0;
  color: #1e3a5f;
  font-weight: 800;
  text-align: right;
}

.financial-summary dd small {
  display: block;
  margin-top: 0.15rem;
  color: #64748b;
  font-weight: 500;
}

.transfer-evidence {
  margin-top: 1.5rem;
}

.transfer-evidence > p {
  margin: 0.5rem 0 0;
  color: #64748b;
  line-height: 1.6;
}

.receipt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.receipt-grid a {
  display: block;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #f8fafc;
}

.receipt-grid img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: contain;
}

.receipt-grid figcaption {
  margin-top: 0.45rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}

.campaign-thanks {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.2rem;
  border-left: 4px solid #ffd700;
  border-radius: 0.75rem;
  background: #fffbeb;
}

.thanks-icon {
  font-size: 1.5rem;
}

.campaign-thanks p {
  margin: 0.4rem 0 0;
  color: #64748b;
  line-height: 1.65;
}

@media (max-width: 36rem) {
  .campaigns-page {
    width: min(100% - 1.25rem, 68rem);
    padding-top: 1rem;
  }

  .campaigns-hero {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .campaign-card-header,
  .financial-summary dl > div,
  .vigil-gallery,
  .receipt-grid {
    grid-template-columns: 1fr;
  }

  .campaign-document,
  .campaign-document-copy {
    align-items: flex-start;
    flex-direction: column;
  }

  .campaign-document-actions {
    width: 100%;
  }

  .campaign-document-link {
    flex: 1;
  }

  .financial-summary dd {
    text-align: left;
  }
}
</style>
