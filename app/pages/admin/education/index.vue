<template>
  <div>
    <div class="education-header">
      <h1 class="admin-page-title">Education</h1>
      <button v-if="!editing" class="admin-btn" @click="startCreate">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Item
      </button>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Editor -->
    <div v-if="editing" class="editor-card">
      <div class="editor-card-header">
        <span class="section-badge">{{ form.id ? 'Edit Item' : 'New Item' }}</span>
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
              <input v-model="form.title" class="field-input" placeholder="e.g. Nepali Pathsala" />
            </div>

            <div class="field-row">
              <label class="field-label">Description <span class="html-hint">(optional)</span></label>
              <textarea
                v-model="form.description"
                class="field-input field-textarea"
                rows="4"
                placeholder="Short description of the program"
              ></textarea>
            </div>

            <div class="field-two-col">
              <div class="field-row">
                <label class="field-label">Date <span class="html-hint">(optional)</span></label>
                <input v-model="form.event_date" type="date" class="field-input" />
              </div>
              <div class="field-row">
                <label class="field-label">Time <span class="html-hint">(optional)</span></label>
                <input v-model="form.event_time" class="field-input" placeholder="e.g. 6:30 PM – 7:30 PM" />
              </div>
            </div>

            <div class="field-row">
              <label class="field-label">Location <span class="html-hint">(optional)</span></label>
              <input v-model="form.location" class="field-input" placeholder="e.g. Discovery Middle School, Door 31" />
            </div>

            <div class="field-row">
              <label class="field-label">Recurring <span class="html-hint">(optional)</span></label>
              <input v-model="form.recurring" class="field-input" placeholder="e.g. Weekly on Fridays" />
              <p class="field-hint">Leave blank for a one-off session. Shown as a badge on the page.</p>
            </div>

            <div class="field-row field-row--inline">
              <label class="switch">
                <input type="checkbox" v-model="form.active" />
                <span>Active</span>
              </label>
              <span class="field-hint field-hint--inline">Inactive items never show on the Education page.</span>
            </div>
          </div>

          <!-- Right: image -->
          <div class="image-col">
            <ImageUploadField
              ref="uploader"
              v-model="pendingFile"
              :current-url="previewUrl"
              :aspect="null"
              label="Flyer"
              contain
              @clear="onImageCleared"
            />
          </div>
        </div>

        <div class="editor-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save Item' }}
          </button>
          <button class="ghost-btn" :disabled="saving" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="admin-loading">Loading education items...</div>

    <div v-else-if="!items.length && !editing" class="admin-empty">
      No education items yet. Click "New Item" to create one.
    </div>

    <table v-else-if="!editing" class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Schedule</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <img
              v-if="thumbs[item.id]"
              :src="thumbs[item.id]!"
              class="row-thumb"
              :alt="item.title"
            />
          </td>
          <td>{{ item.title }}</td>
          <td class="window-cell">{{ scheduleText(item) }}</td>
          <td>
            <span :class="['admin-badge', item.active ? 'admin-badge--green' : 'admin-badge--gray']">
              {{ item.active ? 'Live' : 'Inactive' }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="admin-link" @click="startEdit(item)">Edit</button>
            <button class="admin-link admin-link--danger" @click="remove(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {
  getAllEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  uploadEducationImage,
  deleteEducationImage,
  type EducationInput,
} from '~/composables/useEducation';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';
import type {EducationItem} from '~/types/education';

definePageMeta({layout: 'admin', middleware: 'auth'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const items = ref<EducationItem[]>([]);
const thumbs = ref<Record<number, string | null>>({});

const editing = ref(false);
const uploader = ref<{getResult: () => Promise<File | null>} | null>(null);
const pendingFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

interface FormState {
  id: number | null;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  recurring: string;
  active: boolean;
  image_path: string; // existing path when editing
}

const form = reactive<FormState>(blankForm());

function blankForm(): FormState {
  return {
    id: null,
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    recurring: '',
    active: true,
    image_path: '',
  };
}

onMounted(async () => {
  items.value = await getAllEducation();
  buildThumbs();
  loading.value = false;
});

function buildThumbs() {
  for (const item of items.value) {
    thumbs.value[item.id] = item.image_path
      ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, item.image_path)
      : null;
  }
}

function scheduleText(item: EducationItem): string {
  const parts: string[] = [];
  if (item.event_date) parts.push(fmt(item.event_date));
  if (item.event_time) parts.push(item.event_time);
  if (item.recurring) parts.push(item.recurring);
  return parts.length ? parts.join(' · ') : '—';
}

function fmt(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

/* -------- editor -------- */

function startCreate() {
  Object.assign(form, blankForm());
  pendingFile.value = null;
  previewUrl.value = null;
  editing.value = true;
}

function startEdit(item: EducationItem) {
  Object.assign(form, {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    event_date: item.event_date ?? '',
    event_time: item.event_time ?? '',
    location: item.location ?? '',
    recurring: item.recurring ?? '',
    active: item.active,
    image_path: item.image_path ?? '',
  });
  pendingFile.value = null;
  previewUrl.value = item.image_path
    ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, item.image_path)
    : null;
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
    const year = form.event_date ? new Date(form.event_date).getFullYear() : new Date().getFullYear();
    const cropped = (await uploader.value?.getResult()) ?? pendingFile.value;
    const {path, error} = await uploadEducationImage(cropped, year);
    if (error || !path) {
      saving.value = false;
      const dup =
        (error as any)?.statusCode === '409' ||
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

  const payload: EducationInput = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    image_path: imagePath || null,
    event_date: form.event_date || null,
    event_time: form.event_time.trim() || null,
    location: form.location.trim() || null,
    recurring: form.recurring.trim() || null,
    active: form.active,
  };

  // 2. Insert or update
  const {error} = form.id
    ? await updateEducation(form.id, payload)
    : await createEducation(payload);

  saving.value = false;

  if (error) {
    flash('Failed to save item. Please try again.', true);
    return;
  }

  // 3. Clean up replaced image (best effort)
  if (oldImageToRemove) await deleteEducationImage(oldImageToRemove);

  editing.value = false;
  await refresh();
  flash('Education item saved successfully!');
}

async function remove(item: EducationItem) {
  if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
  const {error} = await deleteEducation(item.id);
  if (error) {
    flash('Failed to delete item.', true);
    return;
  }
  if (item.image_path) await deleteEducationImage(item.image_path);
  await refresh();
  flash('Education item deleted.');
}

async function refresh() {
  items.value = await getAllEducation();
  buildThumbs();
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.education-header {
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

.field-textarea {
  resize: vertical;
  line-height: 1.5;
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
