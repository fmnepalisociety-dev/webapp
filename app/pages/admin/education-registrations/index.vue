<template>
  <div>
    <NuxtLink to="/admin/education" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Education
    </NuxtLink>

    <div class="page-head">
      <h1 class="admin-page-title">Pathsala Registrations</h1>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Session (term) filter -->
    <div class="filter-bar" v-if="sessionSlugs.length">
      <button
        :class="['filter-chip', sessionFilter === 'all' ? 'filter-chip--active' : '']"
        @click="sessionFilter = 'all'"
      >
        All terms
      </button>
      <button
        v-for="s in sessionSlugs"
        :key="s"
        :class="['filter-chip', sessionFilter === s ? 'filter-chip--active' : '']"
        @click="sessionFilter = s"
      >
        {{ termLabel(s) }} <span class="filter-count">{{ countBySession(s) }}</span>
      </button>
    </div>

    <!-- Status filter -->
    <div class="filter-bar">
      <button
        :class="['filter-chip', statusFilter === 'all' ? 'filter-chip--active' : '']"
        @click="statusFilter = 'all'"
      >
        All <span class="filter-count">{{ inSession.length }}</span>
      </button>
      <button
        v-for="s in STATUSES"
        :key="s"
        :class="['filter-chip', statusFilter === s ? 'filter-chip--active' : '']"
        @click="statusFilter = s"
      >
        {{ s }} <span class="filter-count">{{ countByStatus(s) }}</span>
      </button>
    </div>

    <div v-if="loading" class="admin-loading">Loading registrations…</div>
    <div v-else-if="!filtered.length" class="admin-empty">No registrations in this view.</div>

    <div v-else class="app-list">
      <div v-for="reg in filtered" :key="reg.id" class="app-card">
        <div class="app-summary" @click="toggle(reg)">
          <div class="app-summary-main">
            <span class="app-name">{{ reg.responses.kid_name || 'Child' }}</span>
            <span class="app-sub">
              {{ reg.responses.parent_name }} · {{ reg.responses.parent_email }}
            </span>
          </div>
          <div class="app-summary-meta">
            <span class="app-pay">{{ payText(reg) }}</span>
            <span class="term-badge">{{ termLabel(reg.session) }}</span>
            <span :class="['status-badge', statusClass(reg.status)]">{{ reg.status }}</span>
            <span class="app-date">{{ fmtDate(reg.created_at) }}</span>
            <font-awesome-icon :icon="['fas', activeId === reg.id ? 'chevron-up' : 'chevron-down']" />
          </div>
        </div>

        <div v-if="activeId === reg.id" class="app-review">
          <div class="review-section">
            <h3 class="review-heading">Registration</h3>
            <table class="detail-table">
              <tr v-for="row in detailRows(reg)" :key="row.label">
                <td class="detail-label">{{ row.label }}</td>
                <td class="detail-value">{{ row.value }}</td>
              </tr>
            </table>
          </div>

          <div class="review-section">
            <h3 class="review-heading">Review</h3>
            <div class="review-row">
              <label class="field-label">Status</label>
              <select v-model="reviewStatus" class="field-input field-input--sm">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="review-row review-row--col">
              <label class="field-label">Admin notes</label>
              <textarea v-model="reviewNotes" rows="2" class="field-input" placeholder="Internal notes"></textarea>
            </div>
            <div class="review-actions">
              <button class="admin-btn" :disabled="saving" @click="saveReview(reg)">Save review</button>
              <button class="admin-link admin-link--danger" :disabled="saving" @click="remove(reg)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import {
  getRegistrations,
  updateRegistration,
  deleteRegistration,
  listSessions,
  REGISTRATION_STATUSES,
  type EducationRegistration,
  type RegistrationStatus,
} from '~/composables/useEducationReg';
import {flatFields, type RsvpField} from '~/composables/useRsvp';

definePageMeta({layout: 'admin', middleware: 'auth'});

const STATUSES = REGISTRATION_STATUSES;

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const regs = ref<EducationRegistration[]>([]);
const statusFilter = ref<'all' | RegistrationStatus>('all');
const sessionFilter = ref<'all' | string>('all');

const activeId = ref<string | null>(null);
const reviewStatus = ref<RegistrationStatus>('new');
const reviewNotes = ref('');

// Per-slug: term label + form fields (for detail labels).
const termBySlug = ref<Record<string, string>>({});
const fieldsBySlug = ref<Record<string, RsvpField[]>>({});

onMounted(async () => {
  const [rows, sessions] = await Promise.all([getRegistrations(), listSessions()]);
  regs.value = rows;
  for (const s of sessions) {
    termBySlug.value[s.slug] = s.term;
    fieldsBySlug.value[s.slug] = flatFields(s.form.fields);
  }
  loading.value = false;
});

// Filter options: every configured session plus any slug seen in registrations.
const sessionSlugs = computed(
  () =>
    [
      ...new Set([...Object.keys(termBySlug.value), ...regs.value.map((r) => r.session).filter(Boolean)]),
    ] as string[]
);

const inSession = computed(() =>
  sessionFilter.value === 'all' ? regs.value : regs.value.filter((r) => r.session === sessionFilter.value)
);

const filtered = computed(() =>
  statusFilter.value === 'all'
    ? inSession.value
    : inSession.value.filter((r) => r.status === statusFilter.value)
);

const countBySession = (slug: string) => regs.value.filter((r) => r.session === slug).length;
const countByStatus = (s: RegistrationStatus) => inSession.value.filter((r) => r.status === s).length;

function termLabel(slug: string | null): string {
  if (!slug) return '—';
  return termBySlug.value[slug] || slug;
}

function payText(reg: EducationRegistration): string {
  if (reg.responses.paid !== 'Yes') return 'Unpaid';
  const amt = reg.responses.amount_paid;
  return amt ? `Paid $${amt}` : 'Paid';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

function humanize(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function detailRows(reg: EducationRegistration) {
  const fields = fieldsBySlug.value[reg.session ?? ''];
  if (fields) {
    return fields
      .filter((f) => !['template', 'image', 'lineitems'].includes(f.type))
      .map((f) => ({label: f.label, value: reg.responses[f.key]}))
      .filter((r) => r.value !== undefined && r.value !== '' && r.value !== null);
  }
  // Unknown session — fall back to humanised keys.
  return Object.entries(reg.responses)
    .filter(([k, v]) => !['fee_note', 'zelle'].includes(k) && v !== '' && v != null)
    .map(([k, v]) => ({label: humanize(k), value: v as any}));
}

function toggle(reg: EducationRegistration) {
  if (activeId.value === reg.id) {
    activeId.value = null;
    return;
  }
  activeId.value = reg.id;
  reviewStatus.value = reg.status;
  reviewNotes.value = reg.admin_notes ?? '';
}

const statusClass = (s: RegistrationStatus) =>
  ({
    new: 'status-badge--blue',
    unpaid: 'status-badge--amber',
    processing: 'status-badge--blue',
    confirmed: 'status-badge--green',
    waitlisted: 'status-badge--amber',
    rejected: 'status-badge--gray',
  })[s];

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  setTimeout(() => (saveMsg.value = ''), 4000);
}

async function refresh() {
  regs.value = await getRegistrations();
}

async function saveReview(reg: EducationRegistration) {
  saving.value = true;
  const {error} = await updateRegistration(reg.id, {
    status: reviewStatus.value,
    admin_notes: reviewNotes.value.trim() || null,
  });
  saving.value = false;
  if (error) return flash('Failed to save review.', true);
  await refresh();
  flash('Review saved.');
}

async function remove(reg: EducationRegistration) {
  if (!confirm(`Delete the registration for ${reg.responses.kid_name || 'this child'}? This cannot be undone.`)) return;
  const {error} = await deleteRegistration(reg.id);
  if (error) return flash('Failed to delete.', true);
  activeId.value = null;
  await refresh();
  flash('Registration deleted.');
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

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  text-transform: capitalize;
  cursor: pointer;
}

.filter-chip--active {
  background: #0033a0;
  color: #fff;
  border-color: #0033a0;
}

.filter-count {
  font-size: 0.72rem;
  opacity: 0.8;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.app-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.app-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  cursor: pointer;
}

.app-summary:hover {
  background: #f8fafc;
}

.app-summary-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.app-name {
  font-weight: 700;
  color: #1e293b;
}

.app-sub {
  font-size: 0.8rem;
  color: #64748b;
}

.app-summary-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.app-pay {
  font-weight: 600;
}

.term-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  white-space: nowrap;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  text-transform: capitalize;
}

.status-badge--blue { background: #dbeafe; color: #1e40af; }
.status-badge--green { background: #dcfce7; color: #166534; }
.status-badge--amber { background: #fef3c7; color: #92400e; }
.status-badge--gray { background: #f1f5f9; color: #64748b; }

.app-review {
  border-top: 1px solid #e2e8f0;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #fbfcfe;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.review-heading {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
  margin: 0;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.detail-table td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #eef2f7;
}

.detail-label {
  color: #64748b;
  width: 40%;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
}

.review-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.review-row--col {
  flex-direction: column;
  align-items: stretch;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-input {
  box-sizing: border-box;
  padding: 0.4rem 0.55rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.86rem;
  color: #1e293b;
  font-family: inherit;
  width: 100%;
}

.field-input--sm {
  padding: 0.3rem 0.45rem;
  font-size: 0.82rem;
  text-transform: capitalize;
}

.review-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
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
}

.admin-btn:hover:not(:disabled) { background: #002080; }
.admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.admin-link {
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-family: inherit;
}

.admin-link:hover { text-decoration: underline; }
.admin-link--danger { color: #dc2626; }

.save-msg {
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.save-msg--ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.save-msg--error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
</style>
