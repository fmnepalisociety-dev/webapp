<template>
  <div>
    <div class="members-header">
      <h1 class="admin-page-title">Squad — {{ EVEREST_CUP_2026 }}</h1>
      <button v-if="!editing" class="admin-btn" @click="startCreate">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New Player
      </button>
    </div>

    <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
      {{ saveMsg }}
    </div>

    <!-- Editor -->
    <div v-if="editing" class="editor-card">
      <div class="editor-card-header">
        <span class="section-badge">{{ form.id ? 'Edit Player' : 'New Player' }}</span>
        <button class="icon-btn" title="Close" @click="cancelEdit">
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <div class="editor-card-body">
        <div class="editor-grid">
          <div class="fields-col">
            <div class="field-row">
              <label class="field-label">Full name</label>
              <input v-model="form.name" class="field-input" placeholder="Player name" />
            </div>

            <div class="field-two-col">
              <div class="field-row">
                <label class="field-label">Squad number</label>
                <input v-model="form.squad_number" type="number" min="0" class="field-input" placeholder="e.g. 10" />
              </div>
              <div class="field-row">
                <label class="field-label">Role</label>
                <select v-model="form.role" class="field-input">
                  <option value="">Player</option>
                  <option value="captain">Captain</option>
                  <option value="vice-captain">Vice-Captain</option>
                </select>
              </div>
            </div>

            <div class="field-row">
              <label class="field-label">Display order <span class="html-hint">(lower shows first)</span></label>
              <input v-model="form.sort_order" type="number" class="field-input field-date" placeholder="0" />
            </div>
          </div>

          <!-- Photo -->
          <div class="image-col">
            <label class="field-label">Photo</label>

            <!-- New file chosen: pan/zoom to frame before saving -->
            <ImageCropper v-if="pendingFile" ref="cropper" :file="pendingFile" :aspect="0.8" />

            <!-- Otherwise show the current photo or a placeholder -->
            <div v-else class="image-drop">
              <img v-if="previewUrl" :src="previewUrl" class="image-preview" :alt="form.name" />
              <div v-else class="image-placeholder">
                <font-awesome-icon :icon="['fas', 'user']" />
                <span>No photo</span>
              </div>
            </div>

            <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />
            <button class="add-btn add-btn--sm" @click="fileInput?.click()">
              <font-awesome-icon :icon="['fas', 'upload']" />
              {{ previewUrl || pendingFile ? 'Replace Photo' : 'Choose Photo' }}
            </button>
            <button v-if="previewUrl || pendingFile" class="clear-photo-btn" @click="clearPhoto">
              Remove photo
            </button>
          </div>
        </div>

        <div class="editor-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save Player' }}
          </button>
          <button class="ghost-btn" :disabled="saving" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="admin-loading">Loading squad...</div>

    <div v-else-if="!players.length && !editing" class="admin-empty">
      No players yet. Click "New Player" to add one.
    </div>

    <table v-else-if="!editing" class="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>#</th>
          <th>Name</th>
          <th>Role</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in players" :key="p.id">
          <td>
            <img v-if="thumbs[p.id]" :src="thumbs[p.id]!" class="row-thumb" :alt="p.name" />
            <span v-else class="row-thumb row-thumb--empty"><font-awesome-icon :icon="['fas', 'user']" /></span>
          </td>
          <td><span class="id-badge">{{ p.squad_number ?? '—' }}</span></td>
          <td>{{ p.name }}</td>
          <td>
            <span v-if="p.role" :class="['admin-badge', p.role === 'captain' ? 'admin-badge--amber' : 'admin-badge--indigo']">
              {{ roleLabel(p.role) }}
            </span>
            <span v-else class="admin-badge admin-badge--gray">Player</span>
          </td>
          <td class="actions-cell">
            <button class="admin-link" @click="startEdit(p)">Edit</button>
            <button class="admin-link admin-link--danger" @click="askDelete(p)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Delete confirmation with type-to-confirm guardrail -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Delete player</h2>
            <button class="icon-btn" @click="cancelDelete">
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-warn">
              This permanently removes <strong>{{ deleteTarget.name }}</strong> from the squad
              and deletes their photo. This cannot be undone.
            </p>
            <label class="field-label">Type <strong>{{ deleteTarget.name }}</strong> to confirm</label>
            <input
              v-model="deleteConfirmText"
              class="field-input"
              :placeholder="deleteTarget.name"
              autocomplete="off"
              @keyup.enter="deleteMatches && confirmDelete()"
            />
            <div class="modal-actions">
              <button class="ghost-btn" :disabled="deleting" @click="cancelDelete">Cancel</button>
              <button class="danger-btn" :disabled="!deleteMatches || deleting" @click="confirmDelete">
                <font-awesome-icon v-if="deleting" :icon="['fas', 'spinner']" spin />
                {{ deleting ? 'Deleting...' : 'Delete player' }}
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
  getSquad,
  createPlayer,
  updatePlayer,
  deletePlayer,
  uploadPlayerImage,
  deletePlayerImage,
  FOOTBALL,
  EVEREST_CUP_2026,
  type SquadPlayer,
  type SquadPlayerInput,
} from '~/composables/useSquad';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

definePageMeta({layout: 'admin', middleware: 'auth'});

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const players = ref<SquadPlayer[]>([]);
const thumbs = ref<Record<string, string | null>>({});

const editing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const cropper = ref<{getResult: () => Promise<File | null>} | null>(null);
const pendingFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const photoCleared = ref(false);

interface FormState {
  id: string | null;
  name: string;
  squad_number: number | string;
  role: string;
  sort_order: number | string;
  image_path: string;
}

const form = reactive<FormState>(blankForm());

function blankForm(): FormState {
  return {id: null, name: '', squad_number: '', role: '', sort_order: '', image_path: ''};
}

onMounted(async () => {
  await refresh();
  loading.value = false;
});

function buildThumbs() {
  for (const p of players.value) {
    thumbs.value[p.id] = p.image_path ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, p.image_path) : null;
  }
}

/* -------- editor -------- */
function startCreate() {
  Object.assign(form, blankForm());
  // Default the new player to the end of the list.
  form.sort_order = players.value.length
    ? Math.max(...players.value.map((p) => p.sort_order)) + 1
    : 1;
  pendingFile.value = null;
  previewUrl.value = null;
  photoCleared.value = false;
  editing.value = true;
  saveMsg.value = '';
}

function startEdit(p: SquadPlayer) {
  Object.assign(form, {
    id: p.id,
    name: p.name ?? '',
    squad_number: p.squad_number ?? '',
    role: p.role ?? '',
    sort_order: p.sort_order ?? 0,
    image_path: p.image_path ?? '',
  });
  pendingFile.value = null;
  photoCleared.value = false;
  previewUrl.value = p.image_path ? getPublicImageUrl(NeSFM_GENERIC_BUCKET, p.image_path) : null;
  editing.value = true;
  saveMsg.value = '';
}

function cancelEdit() {
  editing.value = false;
  pendingFile.value = null;
  previewUrl.value = null;
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  // Hand the raw file to the cropper; it owns the preview + pan/zoom framing.
  pendingFile.value = file;
  previewUrl.value = null;
  photoCleared.value = false;
}

function clearPhoto() {
  pendingFile.value = null;
  previewUrl.value = null;
  photoCleared.value = true;
  if (fileInput.value) fileInput.value.value = '';
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  if (!isError) setTimeout(() => (saveMsg.value = ''), 4000);
}

async function save() {
  if (!form.name.trim()) return flash('Player name is required.', true);

  saving.value = true;

  let imagePath = form.image_path;
  let oldImageToRemove: string | null = null;

  if (photoCleared.value && !pendingFile.value) {
    if (form.image_path) oldImageToRemove = form.image_path;
    imagePath = '';
  }

  if (pendingFile.value) {
    // Export the framed (pan/zoom) crop; fall back to the raw file if needed.
    const cropped = (await cropper.value?.getResult()) ?? pendingFile.value;
    const prefix = `${form.squad_number || ''}-${form.name}`;
    const {path, error} = await uploadPlayerImage(cropped, prefix);
    if (error || !path) {
      saving.value = false;
      return flash('Photo upload failed. Please try again.', true);
    }
    if (form.image_path && form.image_path !== path) oldImageToRemove = form.image_path;
    imagePath = path;
  }

  const payload: SquadPlayerInput = {
    name: form.name.trim(),
    sport: FOOTBALL,
    squad_number: form.squad_number === '' ? null : Number(form.squad_number),
    role: form.role || null,
    team: EVEREST_CUP_2026,
    sort_order: form.sort_order === '' ? 0 : Number(form.sort_order),
    image_path: imagePath || null,
  };

  const {error} = form.id ? await updatePlayer(form.id, payload) : await createPlayer(payload);

  saving.value = false;

  if (error) return flash('Failed to save player. Please try again.', true);

  if (oldImageToRemove) await deletePlayerImage(oldImageToRemove);

  editing.value = false;
  await refresh();
  flash('Player saved successfully!');
}

/* -------- delete (type-to-confirm) -------- */
const deleteTarget = ref<SquadPlayer | null>(null);
const deleteConfirmText = ref('');
const deleting = ref(false);

const deleteMatches = computed(
  () => deleteConfirmText.value.trim().toLowerCase() === (deleteTarget.value?.name ?? '').toLowerCase()
);

function askDelete(p: SquadPlayer) {
  deleteTarget.value = p;
  deleteConfirmText.value = '';
}

function cancelDelete() {
  if (deleting.value) return;
  deleteTarget.value = null;
}

async function confirmDelete() {
  const p = deleteTarget.value;
  if (!p || !deleteMatches.value) return;
  deleting.value = true;
  const {error} = await deletePlayer(p.id);
  if (error) {
    deleting.value = false;
    flash('Failed to delete player.', true);
    return;
  }
  if (p.image_path) await deletePlayerImage(p.image_path);
  deleting.value = false;
  deleteTarget.value = null;
  await refresh();
  flash('Player deleted.');
}

async function refresh() {
  players.value = await getSquad(FOOTBALL, EVEREST_CUP_2026);
  buildThumbs();
}

function roleLabel(role: string | null): string {
  if (role === 'captain') return 'Captain';
  if (role === 'vice-captain') return 'Vice-Captain';
  return 'Player';
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
  aspect-ratio: 4 / 5;
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

.admin-badge--amber {
  background: #fef3c7;
  color: #92400e;
}

.admin-badge--indigo {
  background: #e0e7ff;
  color: #3730a3;
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
