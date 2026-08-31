<template>
  <main class="w-full space-y-6">

    <div v-if="loading" class="text-center py-12 text-gray-500">Loading...</div>

    <div v-else-if="!product" class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-700 mb-2">Product Not Found</h1>
      <NuxtLink to="/shop" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Wear
      </NuxtLink>
    </div>

    <template v-else>
      <div class="back-link-wrapper">
        <NuxtLink to="/shop" class="back-link">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Back to Wear
        </NuxtLink>
      </div>

      <ProductCard :product="product" expanded />
    </template>

  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getProduct } from '~/composables/useProducts';

definePageMeta({ layout: 'wide' });

const route = useRoute();
const productId = route.params.id as string;

const loading = ref(true);
const product = ref<any>(null);

onMounted(async () => {
  product.value = await getProduct(productId);
  loading.value = false;
});
</script>

<style scoped>
.back-link-wrapper {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  background: #eff6ff;
  transition: all 0.15s;
}

.back-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.back-link:active {
  background: #bfdbfe;
}
</style>
