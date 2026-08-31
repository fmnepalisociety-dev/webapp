<template>
  <div>
    <NuxtLink to="/admin/products" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Wear
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading requests...</div>

    <template v-else-if="product">
      <div class="orders-header">
        <div>
          <h1 class="admin-page-title">{{ product.name }}</h1>
          <p class="orders-meta">{{ orders.length }} requests</p>
        </div>
        <button v-if="orders.length" class="admin-btn" @click="downloadCsv">
          <font-awesome-icon :icon="['fas', 'download']" />
          Download CSV
        </button>
      </div>

      <div v-if="!orders.length" class="admin-empty">No requests yet for this product.</div>

      <!-- Totals summary -->
      <div v-if="orders.length" class="totals-bar">
        <div class="total-card">
          <span class="total-label">Requests</span>
          <span class="total-value">
            {{ filteredOrders.length }}
            <span v-if="isFiltered" class="total-of">/ {{ orders.length }}</span>
          </span>
        </div>
        <div class="total-card" v-for="t in totalCards" :key="t.key">
          <span class="total-label">{{ t.label }}</span>
          <span class="total-value">
            {{ t.filtered }}
            <span v-if="isFiltered" class="total-of">/ {{ t.total }}</span>
          </span>
        </div>
      </div>

      <!-- Search + Reset -->
      <div v-if="orders.length" class="table-toolbar">
        <button v-if="isFiltered" class="clear-btn" @click="resetFilters">
          <font-awesome-icon :icon="['fas', 'xmark']" />
          Clear Filters
        </button>
        <select
          v-model="activeStatus"
          class="status-filter"
          :class="{ 'status-filter--active': activeStatus }"
        >
          <option value="">All statuses</option>
          <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
        </select>
        <div class="search-bar">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search requests..."
            class="search-input"
          />
        </div>
      </div>

      <div v-if="orders.length" class="orders-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Request ID</th>
              <th v-for="col in columns" :key="col">
                {{ formatHeader(col) }}
                <div v-if="filterMap[col]" class="th-filter-row">
                  <select
                    v-model="activeFilters[col]"
                    class="th-filter"
                    :class="{ 'th-filter--active': activeFilters[col] }"
                  >
                    <option value="">All</option>
                    <option v-for="opt in filterMap[col]" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </th>
              <th>Status</th>
              <th>Notes</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, idx) in filteredOrders" :key="order.id">
              <td>{{ idx + 1 }}</td>
              <td
                class="order-id-cell"
                title="Click 10x to edit responses"
                @click="handleSecretTap(order)"
              >{{ shortId(order.id) }}</td>
              <td v-for="col in columns" :key="col">{{ displayValue(order.responses[col]) }}</td>
              <td>
                <select
                  class="status-select"
                  :class="`status-select--${statusClass(order.status)}`"
                  :value="order.status || 'New'"
                  @change="onStatusChange(order, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td class="note-cell">{{ order.admin_note || '—' }}</td>
              <td>{{ formatDate(order.created_at) }}</td>
            </tr>
            <tr v-if="!filteredOrders.length">
              <td :colspan="columns.length + 5" class="admin-empty">No results match your search/filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Edit modal -->
      <Teleport to="body">
        <div v-if="editingOrder" class="modal-overlay" @click.self="closeEdit">
          <div class="modal">
            <div class="modal-header">
              <h2 class="modal-title">Edit Request</h2>
              <button class="modal-close" @click="closeEdit">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>
            <form class="modal-body" @submit.prevent="saveEdit">
              <div class="modal-field" v-for="col in columns" :key="col">
                <label class="modal-label">{{ formatHeader(col) }}</label>
                <textarea
                  v-if="isLongText(editForm[col])"
                  v-model="editForm[col]"
                  class="modal-input"
                  rows="3"
                />
                <input v-else v-model="editForm[col]" class="modal-input" />
              </div>

              <div class="modal-field">
                <label class="modal-label">Status</label>
                <select v-model="editStatus" class="modal-input">
                  <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="modal-field">
                <label class="modal-label">Internal note</label>
                <textarea v-model="editNote" class="modal-input" rows="3" placeholder="Notes for staff (not shown to the buyer)" />
              </div>

              <div class="modal-actions">
                <button type="button" class="modal-btn modal-btn--cancel" @click="closeEdit">
                  Cancel
                </button>
                <button type="submit" class="modal-btn modal-btn--save" :disabled="saving">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
              <p v-if="editError" class="modal-error">{{ editError }}</p>
            </form>
          </div>
        </div>
      </Teleport>
    </template>

    <div v-else class="admin-empty">Product not found.</div>
  </div>
</template>

<script setup lang="ts">
import { getProduct, updateProductOrder } from '~/composables/useProducts';
import type { RsvpConfig } from '~/composables/useRsvp';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const STATUS_OPTIONS = ['New', 'Paid', 'Printing', 'Ready for pickup', 'Completed', 'Cancelled'];

const route = useRoute();
const productId = route.params.id as string;
const { $supabase } = useNuxtApp();

const activeStatus = ref('');

function shortId(id: string) {
  return id ? id.slice(0, 8) : '';
}

function statusClass(status?: string) {
  return (status || 'New').toLowerCase().replace(/\s+/g, '-');
}

async function onStatusChange(order: any, value: string) {
  const prev = order.status;
  order.status = value;
  const { error } = await updateProductOrder(order.id, { status: value });
  if (error) {
    order.status = prev;
    alert('Failed to update status. Please try again.');
  }
}

const loading = ref(true);
const product = ref<any>(null);
const orders = ref<any[]>([]);
const columns = ref<string[]>([]);
const searchQuery = ref('');
const activeFilters = reactive<Record<string, string>>({});

onMounted(async () => {
  product.value = await getProduct(productId);

  const { data, error } = await $supabase
    .from('product_orders')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[admin:orders]', error);
  } else {
    orders.value = data ?? [];
  }

  // Build column list from all response keys
  const colSet = new Set<string>();
  for (const r of orders.value) {
    if (r.responses && typeof r.responses === 'object') {
      Object.keys(r.responses).forEach((k) => colSet.add(k));
    }
  }
  columns.value = Array.from(colSet);

  // Initialize filter keys so selects default to "All"
  const cfg = product.value?.order_form as RsvpConfig | undefined;
  if (cfg?.filters) {
    for (const f of cfg.filters) {
      activeFilters[f.key] = '';
    }
  }

  loading.value = false;
});

// Secret tap to edit
const tapState = reactive<{ orderId: string | null; count: number; timer: ReturnType<typeof setTimeout> | null }>({
  orderId: null,
  count: 0,
  timer: null,
});

function handleSecretTap(order: any) {
  if (tapState.orderId !== order.id) {
    if (tapState.timer) clearTimeout(tapState.timer);
    tapState.orderId = order.id;
    tapState.count = 1;
  } else {
    tapState.count++;
  }

  if (tapState.timer) clearTimeout(tapState.timer);
  tapState.timer = setTimeout(() => {
    tapState.orderId = null;
    tapState.count = 0;
  }, 10000);

  if (tapState.count >= 10) {
    if (tapState.timer) clearTimeout(tapState.timer);
    tapState.orderId = null;
    tapState.count = 0;
    openEdit(order);
  }
}

// Edit modal state
const editingOrder = ref<any>(null);
const editForm = reactive<Record<string, string>>({});
const editStatus = ref('New');
const editNote = ref('');
const saving = ref(false);
const editError = ref('');

function openEdit(order: any) {
  editingOrder.value = order;
  editError.value = '';
  editStatus.value = order.status || 'New';
  editNote.value = order.admin_note || '';
  for (const col of columns.value) {
    editForm[col] = order.responses?.[col] ?? '';
  }
}

function closeEdit() {
  editingOrder.value = null;
}

function isLongText(val: unknown): boolean {
  return typeof val === 'string' && val.length > 80;
}

async function saveEdit() {
  if (!editingOrder.value) return;
  saving.value = true;
  editError.value = '';

  const updatedResponses: Record<string, unknown> = {};
  for (const col of columns.value) {
    const original = editingOrder.value.responses?.[col];
    const edited = editForm[col];
    if (typeof original === 'number') {
      const num = parseFloat(edited);
      updatedResponses[col] = isNaN(num) ? edited : num;
    } else if (typeof original === 'boolean') {
      updatedResponses[col] = edited === 'true' || edited === 'Yes';
    } else {
      updatedResponses[col] = edited;
    }
  }

  const { error } = await $supabase
    .from('product_orders')
    .update({
      responses: updatedResponses,
      status: editStatus.value,
      admin_note: editNote.value,
    })
    .eq('id', editingOrder.value.id);

  if (error) {
    console.error('[admin:orders:edit]', error);
    editError.value = 'Failed to save. Please try again.';
    saving.value = false;
    return;
  }

  editingOrder.value.responses = updatedResponses;
  editingOrder.value.status = editStatus.value;
  editingOrder.value.admin_note = editNote.value;
  saving.value = false;
  closeEdit();
}

const filterMap = computed(() => {
  const cfg = product.value?.order_form as RsvpConfig | undefined;
  if (!cfg?.filters?.length) return {} as Record<string, string[]>;
  const map: Record<string, string[]> = {};
  for (const f of cfg.filters) {
    const optSet = new Set<string>();
    for (const r of orders.value) {
      const val = r.responses?.[f.key];
      if (val != null && val !== '') {
        optSet.add(typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val));
      }
    }
    map[f.key] = Array.from(optSet).sort();
  }
  return map;
});

const filteredOrders = computed(() => {
  let result = orders.value;

  if (activeStatus.value) {
    result = result.filter((r) => (r.status || 'New') === activeStatus.value);
  }

  for (const key of Object.keys(activeFilters)) {
    const filterVal = activeFilters[key];
    if (!filterVal) continue;
    result = result.filter((r) => {
      const val = r.responses?.[key];
      const display = val == null || val === '' ? '-'
        : typeof val === 'boolean' ? (val ? 'Yes' : 'No')
        : String(val);
      return display === filterVal;
    });
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter((r) => {
      if (!r.responses || typeof r.responses !== 'object') return false;
      return Object.values(r.responses).some(
        (val) => val != null && String(val).toLowerCase().includes(q)
      );
    });
  }

  return result;
});

function sumField(list: any[], key: string): number {
  return list.reduce((sum, r) => {
    const val = parseFloat(r.responses?.[key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}

const isFiltered = computed(() => filteredOrders.value.length !== orders.value.length);

function resetFilters() {
  searchQuery.value = '';
  activeStatus.value = '';
  for (const key of Object.keys(activeFilters)) {
    activeFilters[key] = '';
  }
}

const totalCards = computed(() => {
  const cfg = product.value?.order_form as RsvpConfig | undefined;
  if (!cfg?.totals?.length) return [];
  return cfg.totals.map((t) => ({
    key: t.key,
    label: t.label,
    filtered: sumField(filteredOrders.value, t.key),
    total: sumField(orders.value, t.key),
  }));
});

function formatHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  // Line-item arrays: "White / M / 2; Black / L / 1"
  if (Array.isArray(val)) {
    const s = val
      .map((r) =>
        r && typeof r === 'object'
          ? Object.values(r).filter((v) => v !== '' && v != null).join(' / ')
          : String(r)
      )
      .filter(Boolean)
      .join('; ');
    return s || '-';
  }
  return String(val);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function downloadCsv() {
  const headers = ['#', 'Request ID', ...columns.value, 'Status', 'Notes', 'Submitted'];
  const rows = orders.value.map((r, idx) => [
    idx + 1,
    r.id,
    ...columns.value.map((col) => displayValue(r.responses[col])),
    r.status || 'New',
    r.admin_note || '',
    formatDate(r.created_at),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell: unknown) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const productName = (product.value?.name ?? 'orders').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${productName}_requests.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.admin-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.admin-back-link:hover {
  text-decoration: underline;
}

.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.orders-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.orders-meta {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
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

.orders-table-wrapper {
  overflow-x: auto;
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
  padding: 0.6rem 0.75rem;
  background: #f1f5f9;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  vertical-align: top;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
}

.th-filter-row {
  margin-top: 0.3rem;
}

.th-filter {
  width: 100%;
  box-sizing: border-box;
  padding: 0.15rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.2rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
  background: white;
  cursor: pointer;
  text-transform: none;
  letter-spacing: normal;
}

.th-filter:focus {
  outline: none;
  border-color: #2563eb;
}

.th-filter--active {
  border-color: #2563eb;
  color: #1e40af;
  background: #eff6ff;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.clear-btn:hover {
  background: #fecaca;
}

.status-filter {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  background: white;
  color: #334155;
  cursor: pointer;
}

.status-filter--active {
  border-color: #2563eb;
  color: #1e40af;
  background: #eff6ff;
}

.order-id-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  color: #64748b;
  cursor: default;
  user-select: none;
  white-space: nowrap;
}

.status-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: #fff;
}

.status-select--new { color: #475569; }
.status-select--paid { color: #1e40af; background: #eff6ff; border-color: #bfdbfe; }
.status-select--printing { color: #92400e; background: #fffbeb; border-color: #fde68a; }
.status-select--ready-for-pickup { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
.status-select--completed { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
.status-select--cancelled { color: #991b1b; background: #fef2f2; border-color: #fecaca; }

.note-cell {
  max-width: 14rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #475569;
  font-size: 0.85rem;
}

/* Product meta in the header */
.orders-heading {
  min-width: 0;
}

.product-meta {
  margin: 0.6rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.25rem;
}

.product-meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.product-meta dt {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin: 0;
}

.product-meta dd {
  margin: 0;
  font-size: 0.85rem;
  color: #334155;
}

.product-meta code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  background: #f1f5f9;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
}

.product-desc {
  margin-top: 0.65rem;
  padding: 0.65rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 40rem;
}

.search-bar {
  position: relative;
  width: 16rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.totals-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.total-card {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-width: 7rem;
}

.total-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 0.15rem;
}

.total-of {
  font-size: 0.9rem;
  font-weight: 500;
  color: #94a3b8;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 32rem;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.modal-field {
  margin-bottom: 0.85rem;
}

.modal-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.3rem;
}

.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.9rem;
  color: #1e293b;
  transition: border-color 0.15s;
}

.modal-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.modal-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}

.modal-btn--cancel {
  background: #f1f5f9;
  color: #475569;
}

.modal-btn--cancel:hover {
  background: #e2e8f0;
}

.modal-btn--save {
  background: #0033a0;
  color: white;
}

.modal-btn--save:hover {
  background: #002080;
}

.modal-btn--save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.75rem;
  text-align: center;
}
</style>
