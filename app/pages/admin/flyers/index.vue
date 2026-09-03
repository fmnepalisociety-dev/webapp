<template>
  <div>
    <div class="flyers-header">
      <h1 class="admin-page-title">Flyers</h1>
      <button v-if="!editing" class="admin-btn" @click="startCreate">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Flyer
      </button>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Editor -->
    <div v-if="editing" class="editor-card">
      <div class="editor-card-header">
        <span class="section-badge">{{ form.id ? 'Edit Flyer' : 'New Flyer' }}</span>
        <button class="icon-btn" title="Close" @click="cancelEdit">
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <div class="editor-card-body">
        <div class="editor-grid">
          <!-- Left: fields -->
          <div class="fields-col">
            <div class="field-row">
              <label class="field-label">Title</label>
              <input v-model="form.title" class="field-input" placeholder="e.g. Happy 4th of July" />
            </div>

            <div class="field-row">
              <label class="field-label">Caption <span class="html-hint">(shown under image, optional)</span></label>
              <input v-model="form.caption" class="field-input" placeholder="Optional caption" />
            </div>

            <div class="field-row">
              <label class="field-label">Type</label>
              <select v-model="form.type" class="field-input field-select">
                <option value="timebound">Time-bound (shows between dates)</option>
                <option value="permanent">Permanent (always shown)</option>
              </select>
            </div>

            <template v-if="form.type === 'timebound'">
              <div class="field-two-col">
                <div class="field-row">
                  <label class="field-label">Start</label>
                  <input v-model="form.start_date" type="datetime-local" class="field-input" />
                </div>
                <div class="field-row">
                  <label class="field-label">End</label>
                  <input v-model="form.end_date" type="datetime-local" class="field-input" />
                </div>
              </div>
              <p class="field-hint">Times are in your local timezone. The flyer appears on the homepage only within this window.</p>
            </template>

            <div class="field-row">
              <label class="field-label">Link to Event <span class="html-hint">(optional)</span></label>
              <select v-model="form.event_id" class="field-input">
                <option value="">— None —</option>
                <option v-for="e in events" :key="e.id" :value="e.id">
                  {{ e.heading }} ({{ e.event_date }})
                </option>
              </select>
              <p class="field-hint">If set, clicking the flyer shows event details and links to the event page.</p>
            </div>

            <div class="field-row field-row--inline">
              <label class="switch">
                <input type="checkbox" v-model="form.active" />
                <span>Active</span>
              </label>
              <span class="field-hint field-hint--inline">Inactive flyers never show, regardless of dates.</span>
            </div>
          </div>

          <!-- Right: image -->
          <div class="image-col">
            <ImageUploadField
              ref="uploader"
              v-model="pendingFile"
              :current-url="previewUrl"
              :aspect="null"
              label="Image"
              contain
              @clear="onImageCleared"
            />
          </div>
        </div>

        <div class="editor-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save Flyer' }}
          </button>
          <button class="ghost-btn" :disabled="saving" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="admin-loading">Loading flyers...</div>

    <div v-else-if="!flyers.length && !editing" class="admin-empty">
      No flyers yet. Click "New Flyer" to create one.
    </div>

    <table v-else-if="!editing" class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Type</th>
          <th>Window</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="flyer in flyers" :key="flyer.id">
          <td>
            <img
              v-if="thumbs[flyer.id]"
              :src="thumbs[flyer.id]!"
              class="row-thumb"
              :alt="flyer.title"
            />
          </td>
          <td>{{ flyer.title }}</td>
          <td>
            <span class="type-tag">{{ flyer.type === 'timebound' ? 'Time-bound' : 'Permanent' }}</span>
          </td>
          <td class="window-cell">{{ windowText(flyer) }}</td>
          <td>
            <span :class="['admin-badge', statusClass(flyer)]">{{ statusLabel(flyer) }}</span>
          </td>
          <td class="actions-cell">
            <button class="admin-link" @click="startEdit(flyer)">Edit</button>
            <button class="admin-link admin-link--danger" @click="remove(flyer)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed} from 'vue';
import {
  getAllFlyers,
  createFlyer,
  updateFlyer,
  deleteFlyer,
  uploadFlyerImage,
  deleteFlyerImage,
  type FlyerInput,
} from '~/composables/useFlyers';
import {getEvents} from '~/composables/useEvents';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';
import type {Flyer, TimeboundMeta} from '~/types/flyer';

definePageMeta({layout: 'admin', middleware: 'auth'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const flyers = ref<Flyer[]>([]);
const events = ref<any[]>([]);
const thumbs = ref<Record<number, string | null>>({});

const editing = ref(false);
const uploader = ref<{getResult: () => Promise<File | null>} | null>(null);
const pendingFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

interface FormState {
  id: number | null;
  title: string;
  caption: string;
  type: Flyer['type'];
  start_date: string; // datetime-local
  end_date: string; // datetime-local
  event_id: string;
  active: boolean;
  image_path: string; // existing path when editing
}

const form = reactive<FormState>(blankForm());

function blankForm(): FormState {
  return {
    id: null,
    title: '',
    caption: '',
    type: 'timebound',
    start_date: '',
    end_date: '',
    event_id: '',
    active: true,
    image_path: '',
  };
}

onMounted(async () => {
  const [f, e] = await Promise.all([getAllFlyers(), getEvents()]);
  flyers.value = f;
  events.value = e;
  buildThumbs();
  loading.value = false;
});

function buildThumbs() {
  for (const flyer of flyers.value) {
    thumbs.value[flyer.id] = getPublicImageUrl(NeSFM_GENERIC_BUCKET, flyer.image_path);
  }
}

/* -------- datetime-local <-> ISO helpers -------- */

// ISO string -> "YYYY-MM-DDTHH:mm" in local time
function isoToLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DDTHH:mm" (local) -> ISO string
function localInputToIso(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/* -------- list display helpers -------- */

function windowText(flyer: Flyer): string {
  if (flyer.type !== 'timebound') return '—';
  const meta = flyer.metadata as TimeboundMeta | null;
  if (!meta?.start_date || !meta?.end_date) return 'Not set';
  return `${fmt(meta.start_date)} → ${fmt(meta.end_date)}`;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

type Status = 'active' | 'scheduled' | 'expired' | 'off';

function status(flyer: Flyer): Status {
  if (!flyer.active) return 'off';
  if (flyer.type !== 'timebound') return 'active';
  const meta = flyer.metadata as TimeboundMeta | null;
  if (!meta?.start_date || !meta?.end_date) return 'off';
  const now = new Date();
  const start = new Date(meta.start_date);
  const end = new Date(meta.end_date);
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}

function statusLabel(flyer: Flyer): string {
  return {active: 'Live', scheduled: 'Scheduled', expired: 'Expired', off: 'Inactive'}[status(flyer)];
}

function statusClass(flyer: Flyer): string {
  return {
    active: 'admin-badge--green',
    scheduled: 'admin-badge--blue',
    expired: 'admin-badge--gray',
    off: 'admin-badge--gray',
  }[status(flyer)];
}

/* -------- editor -------- */

function startCreate() {
  Object.assign(form, blankForm());
  pendingFile.value = null;
  previewUrl.value = null;
  editing.value = true;
}

function startEdit(flyer: Flyer) {
  const meta = flyer.metadata as TimeboundMeta | null;
  Object.assign(form, {
    id: flyer.id,
    title: flyer.title,
    caption: flyer.caption ?? '',
    type: flyer.type,
    start_date: isoToLocalInput(meta?.start_date),
    end_date: isoToLocalInput(meta?.end_date),
    event_id: meta?.event_id ?? '',
    active: flyer.active,
    image_path: flyer.image_path,
  });
  pendingFile.value = null;
  previewUrl.value = getPublicImageUrl(NeSFM_GENERIC_BUCKET, flyer.image_path);
  editing.value = true;
  saveMsg.value = '';
}

function cancelEdit() {
  editing.value = false;
  pendingFile.value = null;
  previewUrl.value = null;
}

function onImageCleared() {
  previewUrl.value = null;
  form.image_path = '';
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  setTimeout(() => (saveMsg.value = ''), 4000);
}

function validate(): string | null {
  if (!form.title.trim()) return 'Title is required.';
  if (!pendingFile.value && !form.image_path) return 'Please choose an image.';
  if (form.type === 'timebound') {
    if (!form.start_date || !form.end_date) return 'Start and end dates are required for time-bound flyers.';
    if (new Date(form.end_date) <= new Date(form.start_date)) return 'End date must be after start date.';
  }
  return null;
}

async function save() {
  const err = validate();
  if (err) {
    flash(err, true);
    return;
  }

  saving.value = true;

  // 1. Upload new image if one was chosen
  let imagePath = form.image_path;
  let oldImageToRemove: string | null = null;

  if (pendingFile.value) {
    const year =
      form.type === 'timebound' && form.start_date
        ? new Date(form.start_date).getFullYear()
        : new Date().getFullYear();
    const cropped = (await uploader.value?.getResult()) ?? pendingFile.value;
    const {path, error} = await uploadFlyerImage(cropped, year);
    if (error || !path) {
      saving.value = false;
      const dup = (error as any)?.statusCode === '409' ||
        /exists|duplicate/i.test((error as any)?.message ?? '');
      flash(
        dup
          ? `An image named "${pendingFile.value.name}" already exists for ${year}. Rename the file and try again.`
          : 'Image upload failed. Please try again.',
        true
      );
      return;
    }
    // Remove the previous file only if the new upload landed at a different path
    if (form.image_path && form.image_path !== path) oldImageToRemove = form.image_path;
    imagePath = path;
  }

  // 2. Build metadata
  let metadata: TimeboundMeta | null = null;
  if (form.type === 'timebound') {
    metadata = {
      start_date: localInputToIso(form.start_date),
      end_date: localInputToIso(form.end_date),
    };
    if (form.event_id) metadata.event_id = form.event_id;
  } else if (form.event_id) {
    metadata = {start_date: '', end_date: '', event_id: form.event_id};
  }

  const payload: FlyerInput = {
    title: form.title.trim(),
    caption: form.caption.trim() || null,
    image_path: imagePath,
    type: form.type,
    metadata,
    active: form.active,
  };

  // 3. Insert or update
  const {error} = form.id
    ? await updateFlyer(form.id, payload)
    : await createFlyer(payload);

  saving.value = false;

  if (error) {
    flash('Failed to save flyer. Please try again.', true);
    return;
  }

  // 4. Clean up replaced image (best effort)
  if (oldImageToRemove) await deleteFlyerImage(oldImageToRemove);

  editing.value = false;
  await refresh();
  flash('Flyer saved successfully!');
}

async function remove(flyer: Flyer) {
  if (!confirm(`Delete flyer "${flyer.title}"? This cannot be undone.`)) return;
  const {error} = await deleteFlyer(flyer.id);
  if (error) {
    flash('Failed to delete flyer.', true);
    return;
  }
  await deleteFlyerImage(flyer.image_path);
  await refresh();
  flash('Flyer deleted.');
}

async function refresh() {
  flyers.value = await getAllFlyers();
  buildThumbs();
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.flyers-header {
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
  grid-template-columns: 1fr 240px;
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
  gap: 0.75rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-row--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
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

.field-hint--inline {
  margin: 0;
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

.field-select {
  max-width: 100%;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.switch input {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

/* Image column */
.image-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-drop {
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  background: #f8fafc;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #334155;
  vertical-align: middle;
}

.row-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 0.35rem;
  border: 1px solid #e2e8f0;
  display: block;
}

.type-tag {
  font-size: 0.78rem;
  color: #64748b;
}

.window-cell {
  font-size: 0.82rem;
  color: #64748b;
  white-space: nowrap;
}

.admin-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
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
  gap: 1rem;
}

@media (max-width: 640px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
