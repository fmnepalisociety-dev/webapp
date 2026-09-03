<template>
  <div>
    <div class="members-header">
      <h1 class="admin-page-title">Members</h1>
      <button v-if="!editing" class="admin-btn" @click="startCreate">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Member
      </button>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Editor -->
    <div v-if="editing" class="editor-card">
      <div class="editor-card-header">
        <span class="section-badge">{{ form.id ? 'Edit Member' : 'New Member' }}</span>
        <button class="icon-btn" title="Close" @click="cancelEdit">
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <div class="editor-card-body">
        <div class="editor-grid">
          <div class="fields-col">
            <div class="field-two-col">
              <div class="field-row">
                <label class="field-label">First name</label>
                <input v-model="form.firstname" class="field-input" placeholder="First name" />
              </div>
              <div class="field-row">
                <label class="field-label">Last name</label>
                <input v-model="form.lastname" class="field-input" placeholder="Last name" />
              </div>
            </div>

            <div class="field-two-col">
              <div class="field-row">
                <label class="field-label">Email</label>
                <input v-model="form.email" type="email" class="field-input" placeholder="name@example.com" />
              </div>
              <div class="field-row">
                <label class="field-label">Phone</label>
                <input v-model="form.phone" class="field-input" placeholder="(701) 555-0123" />
              </div>
            </div>

            <div class="field-two-col">
              <div class="field-row">
                <label class="field-label">Membership ID</label>
                <input v-model="form.membership_id" class="field-input" placeholder="e.g. NeSFM-0001" />
                <p class="field-hint">Human-facing ID shown on the card &amp; members list.</p>
              </div>
              <div class="field-row">
                <label class="field-label">Membership type</label>
                <input v-model="form.membership_type" class="field-input" list="member-types" placeholder="e.g. Standard" />
                <datalist id="member-types">
                  <option value="Standard" />
                  <option value="Life" />
                  <option value="Family" />
                  <option value="Student" />
                  <option value="Honorary" />
                </datalist>
              </div>
            </div>

            <div class="field-row">
              <label class="field-label">Expiry date <span class="html-hint">(blank = no expiry)</span></label>
              <input v-model="form.expiry_date" type="date" class="field-input field-date" />
            </div>
          </div>

          <!-- Photo -->
          <div class="image-col">
            <ImageUploadField
              ref="uploader"
              v-model="pendingFile"
              :current-url="previewUrl"
              :aspect="1"
              label="Photo"
              placeholder="Drag & drop or click"
              @clear="onPhotoCleared"
            />
          </div>
        </div>

        <div class="editor-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save Member' }}
          </button>
          <button class="ghost-btn" :disabled="saving" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div v-if="!editing && members.length" class="toolbar">
      <div class="search-bar">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
        <input v-model="search" type="text" placeholder="Search by name, ID, or email..." class="search-input" />
      </div>
      <span class="count">{{ filtered.length }} of {{ members.length }}</span>
    </div>

    <!-- List -->
    <div v-if="loading" class="admin-loading">Loading members...</div>

    <div v-else-if="!members.length && !editing" class="admin-empty">
      No members yet. Click "New Member" to add one.
    </div>

    <table v-else-if="!editing" class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Membership ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Expiry</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in filtered" :key="m.id">
          <td>
            <img v-if="thumbs[m.id]" :src="thumbs[m.id]!" class="row-thumb" :alt="`${m.firstname} ${m.lastname}`" />
            <span v-else class="row-thumb row-thumb--empty"><font-awesome-icon :icon="['fas', 'user']" /></span>
          </td>
          <td><span class="id-badge">{{ m.membership_id || '—' }}</span></td>
          <td>{{ m.firstname }} {{ m.lastname }}</td>
          <td>{{ m.membership_type || 'Standard' }}</td>
          <td>
            <span v-if="!m.expiry_date" class="admin-badge admin-badge--gray">No expiry</span>
            <span v-else :class="['admin-badge', isExpired(m.expiry_date) ? 'admin-badge--red' : 'admin-badge--green']">
              {{ fmtDate(m.expiry_date) }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="admin-link" @click="startEdit(m)">Edit</button>
            <a :href="`/members/${m.id}/id-card`" target="_blank" class="admin-link">ID Card</a>
            <button class="admin-link admin-link--danger" @click="askDelete(m)">Delete</button>
          </td>
        </tr>
        <tr v-if="!filtered.length">
          <td colspan="6" class="admin-empty">No members match your search.</td>
        </tr>
      </tbody>
    </table>

    <!-- Delete confirmation with type-to-confirm guardrail -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Delete member</h2>
            <button class="icon-btn" @click="cancelDelete">
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-warn">
              This permanently deletes
              <strong>{{ deleteTargetName }}</strong>
              <template v-if="deleteTarget.membership_id"> ({{ deleteTarget.membership_id }})</template>
              and their photo. This cannot be undone.
            </p>
            <label class="field-label">Type <strong>{{ deleteTargetName }}</strong> to confirm</label>
            <input
              v-model="deleteConfirmText"
              class="field-input"
              :placeholder="deleteTargetName"
              autocomplete="off"
              @keyup.enter="deleteMatches && confirmDelete()"
            />
            <div class="modal-actions">
              <button class="ghost-btn" :disabled="deleting" @click="cancelDelete">Cancel</button>
              <button class="danger-btn" :disabled="!deleteMatches || deleting" @click="confirmDelete">
                <font-awesome-icon v-if="deleting" :icon="['fas', 'spinner']" spin />
                {{ deleting ? 'Deleting...' : 'Delete member' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed} from 'vue';
import {
  getAdminMembers,
  createMember,
  updateMember,
  deleteMember,
  uploadMemberImage,
  deleteMemberImage,
  type AdminMember,
  type MemberInput,
} from '~/composables/useMembers';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

definePageMeta({layout: 'admin', middleware: 'auth'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);
const search = ref('');

const members = ref<AdminMember[]>([]);
const thumbs = ref<Record<number, string | null>>({});

const editing = ref(false);
const uploader = ref<{getResult: () => Promise<File | null>} | null>(null);
const pendingFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const photoCleared = ref(false);

interface FormState {
  id: number | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  membership_id: string;
  membership_type: string;
  expiry_date: string; // YYYY-MM-DD
  image_path: string;
}

const form = reactive<FormState>(blankForm());

function blankForm(): FormState {
  return {
    id: null,
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    membership_id: '',
    membership_type: '',
    expiry_date: '',
    image_path: '',
  };
}

const fullName = computed(() => `${form.firstname} ${form.lastname}`.trim());

onMounted(async () => {
  members.value = await getAdminMembers();
  buildThumbs();
  loading.value = false;
});

function buildThumbs() {
  for (const m of members.value) {
    thumbs.value[m.id] = m.image_path ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, m.image_path) : null;
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return members.value;
  return members.value.filter((m) => {
    const hay = `${m.firstname ?? ''} ${m.lastname ?? ''} ${m.membership_id ?? ''} ${m.email ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
});

/* -------- editor -------- */
function startCreate() {
  Object.assign(form, blankForm());
  pendingFile.value = null;
  previewUrl.value = null;
  photoCleared.value = false;
  editing.value = true;
  saveMsg.value = '';
}

function startEdit(m: AdminMember) {
  Object.assign(form, {
    id: m.id,
    firstname: m.firstname ?? '',
    lastname: m.lastname ?? '',
    email: m.email ?? '',
    phone: m.phone ?? '',
    membership_id: m.membership_id ?? '',
    membership_type: m.membership_type ?? '',
    expiry_date: m.expiry_date ? m.expiry_date.slice(0, 10) : '',
    image_path: m.image_path ?? '',
  });
  pendingFile.value = null;
  photoCleared.value = false;
  previewUrl.value = m.image_path ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, m.image_path) : null;
  editing.value = true;
  saveMsg.value = '';
}

function cancelEdit() {
  editing.value = false;
  pendingFile.value = null;
  previewUrl.value = null;
}

function onPhotoCleared() {
  previewUrl.value = null;
  photoCleared.value = true;
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  if (!isError) setTimeout(() => (saveMsg.value = ''), 4000);
}

function validate(): string | null {
  if (!form.firstname.trim()) return 'First name is required.';
  if (!form.lastname.trim()) return 'Last name is required.';
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.';
  return null;
}

async function save() {
  const err = validate();
  if (err) return flash(err, true);

  saving.value = true;

  // Resolve the final image path
  let imagePath = form.image_path;
  let oldImageToRemove: string | null = null;

  if (photoCleared.value && !pendingFile.value) {
    if (form.image_path) oldImageToRemove = form.image_path;
    imagePath = '';
  }

  if (pendingFile.value) {
    const cropped = (await uploader.value?.getResult()) ?? pendingFile.value;
    const {path, error} = await uploadMemberImage(cropped, form.membership_id.trim());
    if (error || !path) {
      saving.value = false;
      const dup = (error as any)?.statusCode === '409' || /exists|duplicate/i.test((error as any)?.message ?? '');
      return flash(
        dup
          ? `A photo named "${pendingFile.value.name}" already exists. Rename the file and try again.`
          : 'Photo upload failed. Please try again.',
        true
      );
    }
    if (form.image_path && form.image_path !== path) oldImageToRemove = form.image_path;
    imagePath = path;
  }

  const payload: MemberInput = {
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    membership_id: form.membership_id.trim() || null,
    membership_type: form.membership_type.trim() || null,
    expiry_date: form.expiry_date || null,
    image_path: imagePath || null,
  };

  const {error} = form.id ? await updateMember(form.id, payload) : await createMember(payload);

  saving.value = false;

  if (error) return flash('Failed to save member. Please try again.', true);

  if (oldImageToRemove) await deleteMemberImage(oldImageToRemove);

  editing.value = false;
  await refresh();
  flash('Member saved successfully!');
}

/* -------- delete (type-to-confirm) -------- */
const deleteTarget = ref<AdminMember | null>(null);
const deleteConfirmText = ref('');
const deleting = ref(false);

const deleteTargetName = computed(() =>
  deleteTarget.value ? `${deleteTarget.value.firstname} ${deleteTarget.value.lastname}`.trim() : ''
);

const deleteMatches = computed(
  () => deleteConfirmText.value.trim().toLowerCase() === deleteTargetName.value.toLowerCase()
);

function askDelete(m: AdminMember) {
  deleteTarget.value = m;
  deleteConfirmText.value = '';
}

function cancelDelete() {
  if (deleting.value) return;
  deleteTarget.value = null;
}

async function confirmDelete() {
  const m = deleteTarget.value;
  if (!m || !deleteMatches.value) return;
  deleting.value = true;
  const {error} = await deleteMember(m.id);
  if (error) {
    deleting.value = false;
    flash('Failed to delete member.', true);
    return;
  }
  if (m.image_path) await deleteMemberImage(m.image_path);
  deleting.value = false;
  deleteTarget.value = null;
  await refresh();
  flash('Member deleted.');
}

async function refresh() {
  members.value = await getAdminMembers();
  buildThumbs();
}

/* -------- display helpers -------- */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
}

function isExpired(iso: string): boolean {
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d < new Date();
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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

/* Buttons */
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

.admin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn:hover {
  background: #f1f5f9;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}

.add-btn--sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  width: 100%;
  justify-content: center;
}

.clear-photo-btn {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.clear-photo-btn:hover {
  text-decoration: underline;
}

.icon-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem 0.45rem;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

/* Save message */
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

.save-msg--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Editor */
.editor-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.editor-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.section-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.editor-card-body {
  padding: 1.25rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1.5rem;
}

.fields-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.html-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #94a3b8;
  font-size: 0.72rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.15rem 0 0;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.88rem;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
}

.field-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.field-date {
  max-width: 14rem;
}

/* Photo column */
.image-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.image-drop {
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  background: #f8fafc;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #cbd5e1;
  font-size: 0.85rem;
}

.image-placeholder svg {
  font-size: 2rem;
}

.file-input {
  display: none;
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Toolbar / search */
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 22rem;
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

.count {
  font-size: 0.82rem;
  color: #64748b;
}

/* Table */
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
  padding: 0.6rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
  vertical-align: middle;
}

.row-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  display: block;
}

.row-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 0.9rem;
}

.id-badge {
  display: inline-block;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

.admin-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
}

.admin-badge--green {
  background: #dcfce7;
  color: #166534;
}

.admin-badge--red {
  background: #fef2f2;
  color: #dc2626;
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

/* Delete modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.6rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 26rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #dc2626;
  margin: 0;
}

.modal-body {
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.modal-warn {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.danger-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
  .image-col {
    max-width: 200px;
  }
}
</style>
