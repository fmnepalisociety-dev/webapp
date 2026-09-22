<template>
  <div>
    <div class="page-head">
      <h1 class="admin-page-title">Membership Applications</h1>
      <NuxtLink to="/admin/membership/form" class="admin-link">
        <font-awesome-icon :icon="['fas', 'pen-to-square']" />
        Edit application form
      </NuxtLink>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Status filter -->
    <div class="filter-bar">
      <button
        :class="['filter-chip', statusFilter === 'all' ? 'filter-chip--active' : '']"
        @click="statusFilter = 'all'"
      >
        All <span class="filter-count">{{ applications.length }}</span>
      </button>
      <button
        v-for="s in STATUSES"
        :key="s"
        :class="['filter-chip', statusFilter === s ? 'filter-chip--active' : '']"
        @click="statusFilter = s"
      >
        {{ s }} <span class="filter-count">{{ countBy(s) }}</span>
      </button>
    </div>

    <div v-if="loading" class="admin-loading">Loading applications…</div>
    <div v-else-if="!filtered.length" class="admin-empty">No applications in this view.</div>

    <div v-else class="app-list">
      <div v-for="app in filtered" :key="app.id" class="app-card">
        <!-- Summary row -->
        <div class="app-summary" @click="toggle(app)">
          <div class="app-summary-main">
            <span class="app-name">{{ applicantName(app) }}</span>
            <span class="app-sub">{{ app.responses.email }} · {{ app.responses.phone }}</span>
          </div>
          <div class="app-summary-meta">
            <span class="app-pay">{{ payText(app) }}</span>
            <span :class="['status-badge', statusClass(app.status)]">{{ app.status }}</span>
            <span class="app-date">{{ fmtDate(app.created_at) }}</span>
            <font-awesome-icon :icon="['fas', activeId === app.id ? 'chevron-up' : 'chevron-down']" />
          </div>
        </div>

        <!-- Expanded review -->
        <div v-if="activeId === app.id" class="app-review">
          <!-- Submitted details -->
          <div class="review-section">
            <h3 class="review-heading">Application</h3>
            <table class="detail-table">
              <tr v-for="row in detailRows(app)" :key="row.label">
                <td class="detail-label">{{ row.label }}</td>
                <td class="detail-value">{{ row.value }}</td>
              </tr>
            </table>

            <template v-if="familyList(app).length">
              <h4 class="review-subheading">Family members</h4>
              <table class="family-table">
                <thead>
                  <tr><th>Name</th><th>Relationship</th><th>Age</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in familyList(app)" :key="i">
                    <td>{{ m.name }}</td>
                    <td>{{ m.relationship }}</td>
                    <td>{{ m.age }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>

          <!-- Status + notes -->
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
              <button class="admin-btn" :disabled="saving" @click="saveReview(app)">Save review</button>
              <button class="admin-link admin-link--danger" :disabled="saving" @click="remove(app)">Delete</button>
            </div>
          </div>

          <!-- Register as members -->
          <div class="review-section">
            <h3 class="review-heading">Add to members</h3>

            <div v-if="app.member_id" class="registered-note">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
              Registered — linked to member #{{ app.member_id }}.
              <NuxtLink to="/admin/members" class="admin-link">Open members</NuxtLink>
            </div>

            <template v-else>
              <p class="review-hint">Tick each person to add, set their membership details, then register.</p>
              <p class="review-hint review-hint--id">
                <font-awesome-icon :icon="['fas', 'circle-info']" />
                Each <strong>Membership ID</strong> must be unique. Next available:
                <strong>{{ suggestedNextId }}</strong> (IDs are pre-filled — change them if needed).
              </p>
              <table class="register-table">
                <thead>
                  <tr><th></th><th>First</th><th>Last</th><th>Membership ID</th><th>Type</th><th>Expiry</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input type="checkbox" v-model="register.applicant.add" /></td>
                    <td><input v-model="register.applicant.firstname" class="field-input field-input--sm" /></td>
                    <td><input v-model="register.applicant.lastname" class="field-input field-input--sm" /></td>
                    <td><input v-model="register.applicant.membership_id" class="field-input field-input--sm" placeholder="NeSFM-0001" /></td>
                    <td><input v-model="register.applicant.membership_type" class="field-input field-input--sm" placeholder="Standard" /></td>
                    <td><input v-model="register.applicant.expiry_date" type="date" class="field-input field-input--sm" /></td>
                  </tr>
                  <tr v-for="(m, i) in register.family" :key="i">
                    <td><input type="checkbox" v-model="m.add" /></td>
                    <td><input v-model="m.firstname" class="field-input field-input--sm" /></td>
                    <td><input v-model="m.lastname" class="field-input field-input--sm" /></td>
                    <td><input v-model="m.membership_id" class="field-input field-input--sm" placeholder="NeSFM-0002" /></td>
                    <td><input v-model="m.membership_type" class="field-input field-input--sm" placeholder="Standard" /></td>
                    <td><input v-model="m.expiry_date" type="date" class="field-input field-input--sm" /></td>
                  </tr>
                </tbody>
              </table>
              <button class="admin-btn" :disabled="saving" @click="registerMembers(app)">
                <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
                Register selected as members
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed} from 'vue';
import {
  getApplications,
  updateApplication,
  deleteApplication,
  getMembershipForm,
  APPLICATION_STATUSES,
  type MembershipApplication,
  type ApplicationStatus,
} from '~/composables/useMembership';
import {flatFields, type RsvpField} from '~/composables/useRsvp';
import {createMember, getAdminMembers} from '~/composables/useMembers';

definePageMeta({layout: 'admin', middleware: 'auth'});

const STATUSES = APPLICATION_STATUSES;
// Field labels for rendering submitted details, sourced from the saved form config.
const formFields = ref<RsvpField[]>([]);

// Existing membership IDs, used to suggest the next one and to enforce uniqueness.
const memberIds = ref<string[]>([]);

// Next free ID like "NeSFM-0004": take the highest numeric suffix among existing
// IDs (+ offset for multiple people in one batch) and reuse that prefix.
function nextMembershipId(offset = 0): string {
  let max = 0;
  let prefix = 'NeSFM-';
  for (const id of memberIds.value) {
    const m = /^(.*?)(\d+)\s*$/.exec(id || '');
    if (m) {
      const n = parseInt(m[2], 10);
      if (n >= max) {
        max = n;
        prefix = m[1] || prefix;
      }
    }
  }
  return prefix + String(max + 1 + offset).padStart(4, '0');
}

const suggestedNextId = computed(() => nextMembershipId(0));

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const applications = ref<MembershipApplication[]>([]);
const statusFilter = ref<'all' | ApplicationStatus>('all');

const activeId = ref<string | null>(null);
const reviewStatus = ref<ApplicationStatus>('new');
const reviewNotes = ref('');
const register = reactive<{applicant: any; family: any[]}>({applicant: {}, family: []});

onMounted(async () => {
  const [apps, members, config] = await Promise.all([
    getApplications(),
    getAdminMembers(),
    getMembershipForm(),
  ]);
  applications.value = apps;
  memberIds.value = members.map((m) => m.membership_id).filter((x): x is string => !!x);
  formFields.value = flatFields(config.fields);
  loading.value = false;
});

const filtered = computed(() =>
  statusFilter.value === 'all'
    ? applications.value
    : applications.value.filter((a) => a.status === statusFilter.value)
);

function countBy(s: ApplicationStatus) {
  return applications.value.filter((a) => a.status === s).length;
}

function applicantName(app: MembershipApplication) {
  return `${app.responses.first_name ?? ''} ${app.responses.last_name ?? ''}`.trim() || 'Applicant';
}

function payText(app: MembershipApplication) {
  if (app.responses.paid !== 'Yes') return 'Unpaid';
  const amt = app.responses.amount_paid;
  return amt ? `Paid $${amt}` : 'Paid';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

function detailRows(app: MembershipApplication) {
  return formFields.value
    .filter((f) => !['template', 'image', 'lineitems'].includes(f.type))
    .map((f) => ({label: f.label, value: app.responses[f.key]}))
    .filter((r) => r.value !== undefined && r.value !== '' && r.value !== null);
}

function familyList(app: MembershipApplication): any[] {
  const fam = app.responses.family;
  if (!Array.isArray(fam)) return [];
  return fam.filter((r) => r && typeof r === 'object' && Object.values(r).some((v) => v !== '' && v != null));
}

function splitName(full: string): [string, string] {
  const parts = (full || '').trim().split(/\s+/);
  return [parts[0] ?? '', parts.slice(1).join(' ')];
}

function toggle(app: MembershipApplication) {
  if (activeId.value === app.id) {
    activeId.value = null;
    return;
  }
  activeId.value = app.id;
  reviewStatus.value = app.status;
  reviewNotes.value = app.admin_notes ?? '';
  register.applicant = {
    add: true,
    firstname: app.responses.first_name ?? '',
    lastname: app.responses.last_name ?? '',
    membership_id: nextMembershipId(0),
    membership_type: 'Standard',
    expiry_date: '',
  };
  register.family = familyList(app).map((m, i) => {
    const [f, l] = splitName(m.name ?? '');
    return {
      add: false,
      firstname: f,
      lastname: l,
      membership_id: nextMembershipId(i + 1),
      membership_type: 'Standard',
      expiry_date: '',
    };
  });
}

const statusClass = (s: ApplicationStatus) =>
  ({
    new: 'status-badge--blue',
    unpaid: 'status-badge--amber',
    processing: 'status-badge--blue',
    accepted: 'status-badge--green',
    registered: 'status-badge--green',
    rejected: 'status-badge--gray',
  })[s];

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  setTimeout(() => (saveMsg.value = ''), 4000);
}

async function refresh() {
  const [apps, members] = await Promise.all([getApplications(), getAdminMembers()]);
  applications.value = apps;
  memberIds.value = members.map((m) => m.membership_id).filter((x): x is string => !!x);
}

async function saveReview(app: MembershipApplication) {
  saving.value = true;
  const {error} = await updateApplication(app.id, {
    status: reviewStatus.value,
    admin_notes: reviewNotes.value.trim() || null,
  });
  saving.value = false;
  if (error) return flash('Failed to save review.', true);
  await refresh();
  flash('Review saved.');
}

async function remove(app: MembershipApplication) {
  if (!confirm(`Delete the application from ${applicantName(app)}? This cannot be undone.`)) return;
  const {error} = await deleteApplication(app.id);
  if (error) return flash('Failed to delete.', true);
  activeId.value = null;
  await refresh();
  flash('Application deleted.');
}

async function registerMembers(app: MembershipApplication) {
  const people: any[] = [];
  if (register.applicant.add) {
    people.push({...register.applicant, email: app.responses.email ?? null, phone: app.responses.phone ?? null, primary: true});
  }
  for (const m of register.family) if (m.add) people.push({...m, email: null, phone: null, primary: false});

  if (!people.length) return flash('Select at least one person to add.', true);
  if (people.some((p) => !p.firstname.trim())) return flash('Each person needs a first name.', true);

  // Membership IDs must be unique — check within this batch and against existing members.
  const assigned = people.map((p) => p.membership_id.trim()).filter(Boolean);
  const dupeInBatch = assigned.find((id, i) => assigned.indexOf(id) !== i);
  if (dupeInBatch) {
    return flash(`Membership ID "${dupeInBatch}" is used twice in this form. Each person needs a unique ID.`, true);
  }
  const taken = assigned.find((id) => memberIds.value.includes(id));
  if (taken) {
    return flash(`Membership ID "${taken}" already belongs to another member. Try ${suggestedNextId.value} or another unused ID.`, true);
  }

  saving.value = true;
  let primaryId: number | null = app.member_id;
  let firstId: number | null = null;

  for (const p of people) {
    const {id, error} = await createMember({
      firstname: p.firstname.trim(),
      lastname: p.lastname.trim(),
      email: p.email,
      phone: p.phone,
      membership_id: p.membership_id.trim() || null,
      membership_type: p.membership_type.trim() || null,
      expiry_date: p.expiry_date || null,
      image_path: null,
    });
    if (error || id == null) {
      saving.value = false;
      return flash('Failed to create a member. Please try again.', true);
    }
    if (firstId == null) firstId = id;
    if (p.primary) primaryId = id;
  }

  const {error} = await updateApplication(app.id, {member_id: primaryId ?? firstId, status: 'registered'});
  saving.value = false;
  if (error) return flash('Members created, but linking the application failed.', true);
  activeId.value = null;
  await refresh();
  flash('Members created and application registered.');
}
</script>

<style scoped>
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
  margin-bottom: 1.25rem;
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

.review-subheading {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  margin: 0.5rem 0 0;
}

.detail-table,
.family-table,
.register-table {
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

.family-table th,
.register-table th {
  text-align: left;
  padding: 0.4rem 0.5rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.family-table td,
.register-table td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #eef2f7;
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
}

.review-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
}

.review-hint {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.review-hint--id {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.5rem 0.7rem;
  border-radius: 0.4rem;
}

.registered-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.4rem;
}

.admin-btn {
  align-self: flex-start;
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
