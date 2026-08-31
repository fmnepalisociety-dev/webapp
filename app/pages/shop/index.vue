<template>
  <main class="p-6 max-w-6xl mx-auto space-y-6">
    <div class="shop-header">
      <h1 class="shop-title">Wear</h1>
      <p class="shop-subtitle">Support the community - browse our collection below.</p>
    </div>

    <div v-if="loading" class="text-center text-gray-500 py-12">Loading...</div>

    <div v-else-if="!products.length" class="shop-empty">
      <p>No merchandise is available right now. Please check back soon!</p>
    </div>

    <div v-else class="shop-grid">
      <ProductGridCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getActiveProducts } from '~/composables/useProducts';

const loading = ref(true);
const products = ref<any[]>([]);

onMounted(async () => {
  products.value = await getActiveProducts();
  loading.value = false;
});
</script>

<style scoped>
.shop-header {
  margin-bottom: 0.5rem;
}

.shop-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.25rem;
}

.shop-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.shop-empty {
  text-align: center;
  color: #6b7280;
  padding: 3rem 1rem;
}

/* Two cards side by side, filling the width and wrapping to the next row */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 560px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }
}
</style>
