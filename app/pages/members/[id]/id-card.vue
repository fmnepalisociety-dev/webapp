<script setup lang="ts">
import type { Member } from '~/types/member';
import { faPrint, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { formatMemberName, getMemberId } from '~/composables/useMemberCards';
import html2canvas from 'html2canvas';

const route = useRoute();
const memberId = route.params.id as string;

const { $supabase } = useNuxtApp();
const member = ref<Member | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data, error: fetchError } = await $supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

    if (fetchError) throw fetchError;

    member.value = data;
  } catch (e) {
    console.error('[id-card] Error fetching member:', e);
    error.value = 'Member not found';
  } finally {
    loading.value = false;
  }
});

const handlePrint = async () => {
  const cardElement = document.querySelector('.id-card') as HTMLElement;
  if (!cardElement) return;

  try {
    // Temporarily remove expired styling for full opacity
    const hadExpiredClass = cardElement.classList.contains('id-card--expired');
    if (hadExpiredClass) {
      cardElement.classList.remove('id-card--expired');
    }

    // Capture the ID card as canvas with high quality
    const canvas = await html2canvas(cardElement, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        // Hide expired badge when printing
        return element.classList.contains('id-card__expired-badge');
      },
    });

    // Restore expired class if it was there
    if (hadExpiredClass) {
      cardElement.classList.add('id-card--expired');
    }

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    // Write HTML with the captured image
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ID Card</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            img {
              width: 2.125in;
              height: 3.375in;
            }
            @media print {
              @page {
                size: 2.125in 3.375in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: block;
              }
              img {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="ID Card" />
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for image to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  } catch (error) {
    console.error('Error printing card:', error);
    alert('Failed to print ID card. Please try again.');
  }
};

const handleDownloadCard = async () => {
  if (!member.value) return;

  const cardElement = document.querySelector('.id-card') as HTMLElement;
  if (!cardElement) return;

  try {
    // Temporarily remove expired styling for full opacity
    const hadExpiredClass = cardElement.classList.contains('id-card--expired');
    if (hadExpiredClass) {
      cardElement.classList.remove('id-card--expired');
    }

    // Capture the ID card as canvas
    const canvas = await html2canvas(cardElement, {
      scale: 3, // Higher resolution
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        // Hide expired badge when downloading
        return element.classList.contains('id-card__expired-badge');
      },
    });

    // Restore expired class if it was there
    if (hadExpiredClass) {
      cardElement.classList.add('id-card--expired');
    }

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const name = formatMemberName(member.value!);
      const memberId = getMemberId(member.value!);

      link.href = url;
      link.download = `${memberId}_${name.replace(/\s+/g, '_')}_ID_Card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error downloading card:', error);
    alert('Failed to download ID card. Please try again.');
  }
};
</script>

<template>
  <div class="id-card-page">
    <div class="container">
      <div v-if="loading" class="loading">
        Loading ID Card...
      </div>

      <div v-else-if="error" class="error">
        <h2>{{ error }}</h2>
        <NuxtLink to="/members" class="back-link">
          Back to Members
        </NuxtLink>
      </div>

      <div v-else-if="member" class="card-container">
        <h1 class="page-title">Member ID Card</h1>
        <div class="print-area">
          <MemberIdCard :member="member" />
        </div>
        <div class="actions no-print">
          <button @click="handleDownloadCard" class="save-button">
            <FontAwesomeIcon :icon="faDownload" />
            Download Card
          </button>
          <button @click="handlePrint" class="print-button">
            <FontAwesomeIcon :icon="faPrint" />
            Print Card
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.id-card-page {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 2rem 1rem;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1c3382;
  text-align: center;
}

.print-area {
  display: flex;
  justify-content: center;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.save-button,
.print-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.save-button {
  background: #16a34a;
}

.save-button:hover {
  background: #15803d;
}

.print-button {
  background: #1c3382;
}

.print-button:hover {
  background: #152966;
}

.back-link {
  color: #1c3382;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #1c3382;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #1c3382;
  color: white;
}
</style>
