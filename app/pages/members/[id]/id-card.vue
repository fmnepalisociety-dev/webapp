<script setup lang="ts">
import type { Member } from '~/types/member';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

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

const handlePrint = () => {
  // Get the ID card element
  const cardElement = document.querySelector('.id-card');
  if (!cardElement) return;

  // Create a new window with only the ID card
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) return;

  // Get all style and link tags from the current document
  const headContent = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  // Write the HTML for print
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print ID Card</title>
        <meta charset="UTF-8">
        ${headContent}
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
          .id-card {
            width: 2.125in !important;
            height: 3.375in !important;
            box-shadow: none !important;
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
            .id-card {
              box-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${cardElement.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
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
}

.print-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1c3382;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
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
