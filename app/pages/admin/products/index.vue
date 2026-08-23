<template>
  <div>
    <div class="products-header">
      <h1 class="admin-page-title">Shop</h1>
      <NuxtLink to="/admin/products/new" class="admin-btn">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Product
      </NuxtLink>
    </div>

    <div v-if="msg" class="save-msg save-msg--ok">{{ msg }}</div>

    <div v-if="loading" class="admin-loading">Loading products...</div>

    <div v-else-if="!products.length" class="admin-empty">
      No products yet. Click "New Product" to create one.
    </div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Status</th>
          <th>Order Form</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>
            {{ product.name }}
            <span v-if="product.featured" class="admin-badge admin-badge--blue">Featured</span>
          </td>
          <td>{{ priceText(product.price) }}</td>
          <td>
            <span v-if="product.active" class="admin-badge admin-badge--green">Active</span>
            <span v-else class="admin-badge admin-badge--gray">Hidden</span>
          </td>
          <td>
            <span v-if="orderOpen(product)" class="admin-badge admin-badge--green">Open</span>
            <span v-else-if="product.order_form" class="admin-badge admin-badge--gray">Closed</span>
            <span v-else class="admin-badge admin-badge--gray">None</span>
          </td>
          <td class="actions-cell">
            <NuxtLink :to="`/admin/products/${product.id}/edit`" class="admin-link">Edit</NuxtLink>
            <NuxtLink :to="`/admin/products/${product.id}/order-config`" class="admin-link">Order Form</NuxtLink>
            <NuxtLink v-if="product.order_form" :to="`/admin/products/${product.id}/orders`" class="admin-link">Orders</NuxtLink>
            <button class="admin-link admin-link--danger" @click="remove(product)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {getProducts, deleteProduct} from '~/composables/useProducts';
import {isRsvpOpen} from '~/composables/useRsvp';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
const products = ref<any[]>([]);
const msg = ref('');

onMounted(async () => {
  await load();
  loading.value = false;
});

async function load() {
  products.value = await getProducts();
}

function orderOpen(product: any) {
  return isRsvpOpen(product.order_form);
}

function priceText(price: any): string {
  if (price === null || price === undefined || price === '') return '—';
  const num = Number(price);
  return isNaN(num) ? String(price) : `$${num.toFixed(2)}`;
}

async function remove(product: any) {
  if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;
  const {error} = await deleteProduct(product.id);
  if (error) {
    alert('Failed to delete product. It may have orders that must be removed first.');
    return;
  }
  await load();
  msg.value = 'Product deleted.';
  setTimeout(() => (msg.value = ''), 4000);
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
}

.admin-btn:hover {
  background: #002080;
}

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.admin-empty {
  color: #94a3b8;
  padding: 2rem 0;
  text-align: center;
}

.save-msg {
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.save-msg--ok {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.admin-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
}

.admin-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  margin-left: 0.35rem;
}

.admin-badge--green {
  background: #dcfce7;
  color: #166534;
}

.admin-badge--blue {
  background: #dbeafe;
  color: #1e40af;
}

.admin-badge--gray {
  background: #f1f5f9;
  color: #64748b;
}

.admin-link {
  color: #2563eb;
  font-size: 0.85rem;
  text-decoration: none;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.admin-link:hover {
  text-decoration: underline;
}

.admin-link--danger {
  color: #dc2626;
}

.actions-cell {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}
</style>
