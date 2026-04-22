<template>
  <!-- Invisible tap zone: bottom-left corner -->
  <div class="secret-tap-zone" @click="handleTap"></div>

  <!-- QR Modal -->
  <Teleport to="body">
    <Transition name="qr-modal">
      <div v-if="showModal" class="qr-overlay" @click.self="showModal = false">
        <div class="qr-modal">
          <button class="qr-close" @click="showModal = false">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
          <p class="qr-title">
            <font-awesome-icon :icon="['fas', 'share-nodes']" />
            Share this page
          </p>
          <div class="qr-frame" ref="qrContainer">
            <QrCode :value="currentUrl" :size="200" />
          </div>
          <p class="qr-hint">Scan with your phone camera to open</p>
          <button class="qr-download-btn" @click="downloadQr">
            <font-awesome-icon :icon="['fas', 'download']" /> Download QR Code
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const showModal = ref(false);
const currentUrl = ref('');
const qrContainer = ref<HTMLElement | null>(null);

let tapCount = 0;
let tapTimer: ReturnType<typeof setTimeout> | null = null;

function handleTap() {
  tapCount++;

  if (tapCount === 1) {
    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 10000);
  }

  if (tapCount >= 10) {
    tapCount = 0;
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
    }
    currentUrl.value = window.location.href;
    showModal.value = true;
  }
}

watch(showModal, (val) => {
  if (!val) {
    tapCount = 0;
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
    }
  }
});

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

    const slug = window.location.pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'home';
    Object.assign(document.createElement('a'), {
      download: `share-qr-${slug}.png`,
      href: canvas.toDataURL('image/png'),
    }).click();
  };
  img.src = url;
}
</script>

<style scoped>
.secret-tap-zone {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 48px;
  height: 48px;
  z-index: 9998;
  cursor: default;
  /* Invisible — no background, no border */
}

/* Overlay */
.qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Modal card */
.qr-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 2.5rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  max-width: 22rem;
  width: 100%;
}

.qr-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  font-size: 1rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.qr-close:hover {
  background: #e2e8f0;
  color: #334155;
}

.qr-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0;
}

.qr-title svg {
  color: #2563eb;
}

.qr-frame {
  padding: 1rem;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
}

.qr-hint {
  font-size: 0.82rem;
  color: #9ca3af;
  margin: 0;
}

.qr-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.qr-download-btn:hover {
  background: #1d4ed8;
}

/* Transition */
.qr-modal-enter-active,
.qr-modal-leave-active {
  transition: opacity 0.2s ease;
}

.qr-modal-enter-from,
.qr-modal-leave-to {
  opacity: 0;
}
</style>
