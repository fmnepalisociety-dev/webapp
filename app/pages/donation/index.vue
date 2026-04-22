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
        <img src="/img/payment/nsfm-zelle.jpeg" alt="Scan to donate via Zelle" class="qr-code" />
      </div>
      <p>
        Having trouble scanning? You can also send payment via Zelle to
        <a href="mailto:kandelsl@gmail.com" class="zelle-email">kandelsl@gmail.com</a>.
      </p>
      <p class="thank-you">Thank you for your support!</p>
    </div>
  </div>

  <!-- Share this page QR -->
  <div class="share-section">
    <div class="share-card">
      <p class="share-label">
        <font-awesome-icon :icon="['fas', 'share-nodes']" />
        Share this page
      </p>
      <div class="share-qr" ref="qrContainer">
        <QrCode :value="pageUrl" :size="160" />
      </div>
      <p class="share-hint">Scan with your phone camera to open</p>
      <button class="qr-download" @click="downloadQr">
        <font-awesome-icon :icon="['fas', 'download']" /> Download QR Code
      </button>
    </div>
  </div>

  <OfficialBanner />
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const pageUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/donation`;
});

const qrContainer = ref<HTMLElement | null>(null);

function downloadQr() {
  const svg = qrContainer.value?.querySelector('svg');
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('width', '1024');
  clone.setAttribute('height', '1024');

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    URL.revokeObjectURL(url);
    Object.assign(document.createElement('a'), {
      download: 'donation-qr.png',
      href: canvas.toDataURL('image/png'),
    }).click();
  };
  img.src = url;
}
</script>

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

/* Share / QR */
.share-section {
  display: flex;
  justify-content: center;
  margin: 2rem auto;
  max-width: 800px;
}

.share-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.share-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  color: #1e3a5f;
  margin: 0;
  font-weight: 700;
}

.share-label svg {
  color: #2563eb;
}

.share-qr {
  padding: 0.75rem;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
}

.share-hint {
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0;
}

.qr-download {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 0.375rem;
  padding: 0.4rem 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}

.qr-download:hover {
  background: #1d4ed8;
}
</style>
