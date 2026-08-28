<template>
  <div>
    <NuxtLink to="/admin/banners" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Banners
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <template v-else>
      <div class="form-header">
        <h1 class="admin-page-title">{{ bannerId ? 'Edit Banner' : 'New Banner' }}</h1>
        <div class="header-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : bannerId ? 'Save Changes' : 'Create Banner' }}
          </button>
        </div>
      </div>

      <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
        {{ saveMsg }}
      </div>

      <div class="form-card">
        <div class="field-row">
          <label class="field-label">Title <span class="html-hint">(internal label, not shown)</span></label>
          <input v-model="form.title" class="field-input" placeholder="e.g. Nepal landslide fundraiser" />
        </div>

        <div class="field-row">
          <label class="field-label">Text <span class="html-hint">(HTML ok — the headline)</span></label>
          <textarea v-model="form.text" class="field-input field-textarea" rows="3" placeholder="e.g. Help families affected by the Nepal landslide"></textarea>
        </div>

        <div class="field-row">
          <label class="field-label">Caption <span class="html-hint">(HTML ok, optional)</span></label>
          <textarea v-model="form.caption" class="field-input field-textarea" rows="2" placeholder="Secondary line shown under the text"></textarea>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Link URL <span class="html-hint">(optional CTA)</span></label>
            <input v-model="form.link_url" class="field-input" placeholder="https://..." />
          </div>
          <div class="field-row">
            <label class="field-label">Link Label <span class="html-hint">(optional)</span></label>
            <input v-model="form.link_label" class="field-input" placeholder="e.g. Donate" />
          </div>
        </div>
      </div>

      <!-- Image -->
      <div class="form-card">
        <div class="card-title-row">
          <h2 class="card-title">Image</h2>
          <button class="add-btn add-btn--sm" @click="fileInput?.click()">
            <font-awesome-icon :icon="['fas', 'upload']" /> {{ imageUrl ? 'Replace' : 'Add Image' }}
          </button>
          <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />
        </div>

        <p v-if="!imageUrl" class="items-empty">No image. Optional — shown beside the banner text.</p>

        <div v-if="imageUrl" class="field-row" style="max-width: 260px">
          <label class="field-label">Image size (px) <span class="html-hint">(optional)</span></label>
          <input
            v-model.number="form.image_size"
            type="number"
            min="20"
            class="field-input"
            placeholder="Auto (scales with height)"
          />
          <p class="field-hint">Max width/height of the image. Leave blank to scale with the banner height.</p>
        </div>

        <div v-if="imageUrl" class="image-tile">
          <img :src="imageUrl" class="image-thumb" alt="Banner image" />
          <div class="image-tile-actions">
            <button class="icon-btn icon-btn--sm icon-btn--danger" title="Remove" @click="removeImage">
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
        </div>
      </div>

      <!-- Placement & timing -->
      <div class="form-card">
        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Position</label>
            <select v-model="form.position" class="field-input">
              <option value="page_top">Top of page (above header)</option>
              <option value="above_nav">Above navigation</option>
              <option value="below_nav">Below navigation</option>
            </select>
          </div>
          <div class="field-row">
            <label class="field-label">Show on</label>
            <select v-model="form.scope" class="field-input">
              <option value="all">All pages</option>
              <option value="home">Home page only</option>
            </select>
          </div>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Height preset</label>
            <select v-model="form.size" class="field-input">
              <option value="xsmall">X-Small</option>
              <option value="small">Small</option>
              <option value="small-medium">Small–Medium</option>
              <option value="medium">Medium (default)</option>
              <option value="medium-large">Medium–Large</option>
              <option value="large">Large</option>
              <option value="large-xlarge">Large–X-Large</option>
              <option value="xlarge">X-Large</option>
            </select>
            <p class="field-hint">Quick starting point for the banner height.</p>
          </div>
          <div class="field-row">
            <label class="field-label">Custom height (px) <span class="html-hint">(optional)</span></label>
            <input
              v-model.number="form.height_px"
              type="number"
              min="30"
              step="10"
              class="field-input"
              placeholder="Overrides the preset"
            />
            <p class="field-hint">Fine-tune the exact height. Leave blank to use the preset.</p>
          </div>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Start <span class="html-hint">(optional)</span></label>
            <input v-model="form.start_at" type="datetime-local" class="field-input" />
            <p class="field-hint">Banner stays hidden until this time.</p>
          </div>
          <div class="field-row">
            <label class="field-label">End <span class="html-hint">(optional)</span></label>
            <input v-model="form.end_at" type="datetime-local" class="field-input" />
            <p class="field-hint">Banner hides after this time.</p>
          </div>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Background color <span class="html-hint">(optional hex)</span></label>
            <div class="color-row">
              <input v-model="form.bg_color" type="color" class="color-swatch" />
              <input v-model="form.bg_color" class="field-input" placeholder="#dc2626" />
            </div>
          </div>
          <div class="field-row">
            <label class="field-label">Sort order</label>
            <input v-model.number="form.sort_order" type="number" class="field-input" placeholder="0" />
            <p class="field-hint">Lower numbers show first when several are active.</p>
          </div>
        </div>

        <div class="field-row field-row--inline">
          <label class="switch">
            <input type="checkbox" v-model="form.active" />
            <span>Active</span>
          </label>
          <label class="switch">
            <input type="checkbox" v-model="form.dismissible" />
            <span>Dismissible</span>
          </label>
          <span class="field-hint field-hint--inline">
            Active shows the banner (within its time window); Dismissible adds a close button.
          </span>
        </div>
      </div>

      <div class="form-footer">
        <button class="admin-btn" :disabled="saving" @click="save">
          <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
          {{ saving ? 'Saving...' : bannerId ? 'Save Changes' : 'Create Banner' }}
        </button>
        <button class="ghost-btn" @click="navigateTo('/admin/banners')">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {
  getBanner,
  createBanner,
  updateBanner,
  type BannerInput,
} from '~/composables/useBanners';
import {uploadPublicImage} from '~/composables/useSupabaseImage';

const props = defineProps<{bannerId?: string | null}>();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  title: '',
  text: '',
  caption: '',
  link_url: '',
  link_label: '',
  position: 'below_nav' as BannerInput['position'],
  scope: 'all' as BannerInput['scope'],
  size: 'medium' as BannerInput['size'],
  height_px: null as number | null,
  image_size: null as number | null,
  bg_color: '',
  dismissible: true,
  active: true,
  start_at: '',
  end_at: '',
  sort_order: 0,
});

// Image: keep the saved URL and a pending File separately.
const imageUrl = ref<string>(''); // preview / saved URL
const savedImageUrl = ref<string>(''); // URL already persisted in DB
const pendingFile = ref<File | null>(null);

onMounted(async () => {
  if (props.bannerId) {
    const b = await getBanner(props.bannerId);
    if (b) {
      form.title = b.title ?? '';
      form.text = b.text ?? '';
      form.caption = b.caption ?? '';
      form.link_url = b.link_url ?? '';
      form.link_label = b.link_label ?? '';
      form.position = b.position ?? 'below_nav';
      form.scope = b.scope ?? 'all';
      form.size = b.size ?? 'medium';
      form.height_px = b.height_px ?? null;
      form.image_size = b.image_size ?? null;
      form.bg_color = b.bg_color ?? '';
      form.dismissible = b.dismissible ?? true;
      form.active = b.active ?? true;
      form.start_at = toLocalInput(b.start_at);
      form.end_at = toLocalInput(b.end_at);
      form.sort_order = b.sort_order ?? 0;
      imageUrl.value = b.image ?? '';
      savedImageUrl.value = b.image ?? '';
    } else {
      flash('Banner not found.', true);
    }
  }
  loading.value = false;
});

// Convert an ISO timestamp to a value for <input type="datetime-local"> in local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Convert a datetime-local value back to an ISO string (or null).
function fromLocalInput(val: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  pendingFile.value = file;
  imageUrl.value = URL.createObjectURL(file);
  input.value = '';
}

function removeImage() {
  pendingFile.value = null;
  imageUrl.value = '';
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  if (!isError) setTimeout(() => (saveMsg.value = ''), 4000);
}

function validate(): string | null {
  if (!form.title.trim()) return 'Title is required.';
  if (!form.text.trim() && !imageUrl.value) return 'Add some text or an image.';
  return null;
}

async function save() {
  const err = validate();
  if (err) return flash(err, true);

  saving.value = true;
  saveMsg.value = '';

  // Upload a new image if one was chosen.
  let finalImage = savedImageUrl.value;
  if (pendingFile.value) {
    const {url, error} = await uploadPublicImage(pendingFile.value, 'banners');
    if (error || !url) {
      saving.value = false;
      return flash('Image upload failed. Please try again.', true);
    }
    finalImage = url;
  } else if (!imageUrl.value) {
    finalImage = ''; // image was removed
  }

  const payload: BannerInput = {
    title: form.title.trim(),
    text: form.text.trim() || null,
    caption: form.caption.trim() || null,
    image: finalImage || null,
    image_size: form.image_size ? Number(form.image_size) : null,
    link_url: form.link_url.trim() || null,
    link_label: form.link_label.trim() || null,
    position: form.position,
    scope: form.scope,
    size: form.size,
    height_px: form.height_px ? Number(form.height_px) : null,
    bg_color: form.bg_color.trim() || null,
    dismissible: form.dismissible,
    active: form.active,
    start_at: fromLocalInput(form.start_at),
    end_at: fromLocalInput(form.end_at),
    sort_order: Number(form.sort_order) || 0,
  };

  const {error, id} = props.bannerId
    ? {...(await updateBanner(props.bannerId, payload)), id: props.bannerId}
    : await createBanner(payload);

  if (error || !id) {
    saving.value = false;
    return flash('Failed to save banner. Please try again.', true);
  }

  savedImageUrl.value = finalImage;
  pendingFile.value = null;
  saving.value = false;

  if (props.bannerId) {
    flash('Banner saved successfully!');
  } else {
    await navigateTo(`/admin/banners/${id}/edit`);
  }
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

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
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
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.icon-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem 0.45rem;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
}

.icon-btn--sm {
  padding: 0.2rem 0.35rem;
  font-size: 0.65rem;
}

.icon-btn--danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
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

.save-msg--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.form-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  flex: 1;
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

.field-row--inline {
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
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
  min-height: 4rem;
}

.color-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-swatch {
  width: 2.5rem;
  height: 2.3rem;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
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

.items-empty {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0;
}

.image-tile {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  overflow: hidden;
  background: #f8fafc;
  max-width: 220px;
}

.image-thumb {
  display: block;
  width: 100%;
  max-height: 160px;
  object-fit: cover;
}

.image-tile-actions {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.35rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.file-input {
  display: none;
}

.form-footer {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .field-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
