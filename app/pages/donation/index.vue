<template>
  <div class="donation-page">
    <div class="donation-content">
      <h2>Support Our Community</h2>
      <p>
        Your generous contributions help us organize cultural events, community programs, and
        initiatives that bring our community together. Every donation, big or small, makes a
        difference.
      </p>
      <p>
        To make a donation, scan the QR code below using your Zelle app.
      </p>
      <div class="qr-container">
        <img src="/img/payment/nesfm-zelle.jpeg" alt="Scan to donate via Zelle" class="qr-code" />
      </div>
      <p>
        Having trouble scanning? You can also send payment via Zelle to
        <a href="mailto:kandelsl@gmail.com" class="zelle-email">kandelsl@gmail.com</a>.
      </p>
      <p class="thank-you">Thank you for your support!</p>
    </div>
  </div>

  <OfficialBanner />
</template>

<script lang="ts" setup></script>

<style scoped>
.donation-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-left: 6px solid #3498db;
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.donation-content h2 {
  margin-bottom: 1.5rem;
  font-size: 1.9rem;
  color: #3498db;
  border-bottom: 2px solid #3498db;
  display: inline-block;
  padding-bottom: 0.25rem;
}

.donation-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.qr-container {
  text-align: center;
  margin: 2rem 0;
}

.qr-code {
  max-width: 320px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.zelle-email {
  color: #3498db;
  font-weight: 600;
}

.thank-you {
  margin-top: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  text-align: center;
  font-size: 1.1rem;
}
</style>
