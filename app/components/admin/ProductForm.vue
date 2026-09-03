<template>
  <div>
    <NuxtLink to="/admin/products" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Wear
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <template v-else>
      <div class="form-header">
        <h1 class="admin-page-title">{{ productId ? 'Edit Product' : 'New Product' }}</h1>
        <div class="header-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : productId ? 'Save Changes' : 'Create Product' }}
          </button>
        </div>
      </div>

      <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
        {{ saveMsg }}
      </div>

      <div class="form-card">
        <div class="field-row">
          <label class="field-label">Name</label>
          <input v-model="form.name" class="field-input" placeholder="e.g. NeSFM T-Shirt 2026" @input="onNameInput" />
        </div>

        <div class="field-row">
          <label class="field-label">Slug <span class="html-hint">(URL, e.g. /shop/nesfm-tshirt)</span></label>
          <div class="slug-row">
            <span class="slug-prefix">/shop/</span>
            <input v-model="form.slug" class="field-input" placeholder="nesfm-tshirt" @input="slugEdited = true" @blur="form.slug = slugify(form.slug)" />
          </div>
          <p class="field-hint">Auto-filled from the name. Must be unique. Leave blank to use the internal ID.</p>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Price <span class="html-hint">(optional)</span></label>
            <input v-model="form.price" type="number" min="0" step="0.01" class="field-input" placeholder="e.g. 20" />
            <p class="field-hint">Shown as a chip on the product card. Leave blank to hide.</p>
          </div>
          <div class="field-row field-row--inline field-row--switches">
            <label class="switch">
              <input type="checkbox" v-model="form.active" />
              <span>Active</span>
            </label>
            <label class="switch">
              <input type="checkbox" v-model="form.featured" />
              <span>Featured</span>
            </label>
          </div>
        </div>

        <div class="field-row">
          <label class="field-label">Image background</label>
          <div class="color-row">
            <input v-model="form.image_bg" type="color" class="color-swatch" />
            <input v-model="form.image_bg" class="field-input color-hex" placeholder="#8b9199" />
            <button type="button" class="ghost-btn ghost-btn--sm" @click="form.image_bg = DEFAULT_PRODUCT_BG">
              Reset
            </button>
          </div>
          <p class="field-hint">Backdrop behind product images. Default gray works for both white and black shirts.</p>
        </div>

        <div class="field-row">
          <label class="field-label">Description <span class="html-hint">(HTML ok)</span></label>
          <textarea v-model="form.description" class="field-input field-textarea" rows="5" placeholder="Main product description"></textarea>
        </div>

        <div class="field-row">
          <label class="field-label">Promo <span class="html-hint">(HTML ok, optional)</span></label>
          <textarea v-model="form.promo" class="field-input field-textarea" rows="2" placeholder="Short promo line shown under the description"></textarea>
        </div>
      </div>

      <!-- Images -->
      <div
        :class="['form-card', imgDrag ? 'form-card--drag' : '']"
        @dragenter.prevent="imgDrag = true"
        @dragover.prevent="imgDrag = true"
        @dragleave.prevent="imgDrag = false"
        @drop.prevent="onDrop"
      >
        <div class="card-title-row">
          <h2 class="card-title">Images</h2>
          <button class="add-btn add-btn--sm" @click="fileInput?.click()">
            <font-awesome-icon :icon="['fas', 'upload']" /> Add Images
          </button>
          <input ref="fileInput" type="file" accept="image/*" multiple class="file-input" @change="onFilesChange" />
        </div>

        <p v-if="!images.length" class="items-empty">
          {{ imgDrag ? 'Drop images to add them' : 'No images yet. Drag & drop images here, or click “Add Images”. The first image is the thumbnail.' }}
        </p>

        <div v-else class="image-grid">
          <div v-for="(img, idx) in images" :key="img.key" class="image-tile">
            <img :src="img.url" class="image-thumb" :alt="`Image ${idx + 1}`" />
            <span v-if="idx === 0" class="primary-badge">Primary</span>
            <div class="image-tile-actions">
              <button class="icon-btn icon-btn--sm" title="Move left" :disabled="idx === 0" @click="moveImage(idx, -1)">
                <font-awesome-icon :icon="['fas', 'arrow-left']" />
              </button>
              <button class="icon-btn icon-btn--sm" title="Move right" :disabled="idx === images.length - 1" @click="moveImage(idx, 1)">
                <font-awesome-icon :icon="['fas', 'chevron-right']" />
              </button>
              <button class="icon-btn icon-btn--sm icon-btn--danger" title="Remove" @click="removeImage(idx)">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Videos -->
      <div class="form-card">
        <div class="card-title-row">
          <h2 class="card-title">Videos</h2>
          <button class="add-btn add-btn--sm" @click="addVideo">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add Video
          </button>
        </div>

        <p v-if="!videos.length" class="items-empty">No videos. Paste a YouTube URL to embed it on the product page.</p>

        <div v-for="(video, idx) in videos" :key="video._key" class="video-row">
          <input v-model="video.src" class="field-input" placeholder="https://www.youtube.com/watch?v=..." />
          <button class="icon-btn icon-btn--danger" title="Remove video" @click="removeVideo(idx)">
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
        </div>
      </div>

      <div class="form-footer">
        <button class="admin-btn" :disabled="saving" @click="save">
          <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
          {{ saving ? 'Saving...' : productId ? 'Save Changes' : 'Create Product' }}
        </button>
        <button class="ghost-btn" @click="navigateTo('/admin/products')">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {
  getProduct,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  DEFAULT_PRODUCT_BG,
  slugify,
  type ProductInput,
} from '~/composables/useProducts';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

const props = defineProps<{productId?: string | null}>();

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const imgDrag = ref(false);

const form = reactive({
  name: '',
  slug: '',
  price: '' as string | number,
  active: true,
  featured: false,
  image_bg: DEFAULT_PRODUCT_BG,
  description: '',
  promo: '',
});

// Track whether the admin has hand-edited the slug, so name typing stops
// overwriting it once they've customized it.
const slugEdited = ref(false);

function onNameInput() {
  if (!slugEdited.value) form.slug = slugify(form.name);
}

interface ImageSlot {
  key: number;
  path?: string; // existing storage path
  file?: File; // newly chosen
  url: string; // preview URL
}
const images = reactive<ImageSlot[]>([]);
const removedPaths: string[] = [];

interface VideoRow {
  _key: number;
  src: string;
}
const videos = reactive<VideoRow[]>([]);

let nextKey = 0;
const genKey = () => ++nextKey;

onMounted(async () => {
  if (props.productId) {
    const p = await getProduct(props.productId);
    if (p) {
      form.name = p.name ?? '';
      form.slug = p.slug ?? '';
      slugEdited.value = !!p.slug;
      form.price = p.price === null || p.price === undefined ? '' : String(p.price);
      form.active = p.active ?? true;
      form.featured = !!p.featured;
      form.image_bg = p.image_bg || DEFAULT_PRODUCT_BG;
      form.description = p.description ?? '';
      form.promo = p.promo ?? '';
      for (const path of (p.image as string[] | null) ?? []) {
        images.push({key: genKey(), path, url: getPublicImageUrl(NeSFM_GENERIC_BUCKET, path) ?? ''});
      }
      for (const v of (p.videos as any[] | null) ?? []) {
        videos.push({_key: genKey(), src: v?.src ?? ''});
      }
    } else {
      flash('Product not found.', true);
    }
  }
  loading.value = false;
});

function onFilesChange(e: Event) {
  const input = e.target as HTMLInputElement;
  acceptFiles(input.files);
  input.value = ''; // allow re-selecting the same file
}

function onDrop(e: DragEvent) {
  imgDrag.value = false;
  acceptFiles(e.dataTransfer?.files);
}

// Shared by the file picker and drag-and-drop. Only image files are added.
function acceptFiles(files: FileList | null | undefined) {
  if (!files) return;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    images.push({key: genKey(), file, url: URL.createObjectURL(file)});
  }
}

function moveImage(idx: number, dir: number) {
  const target = idx + dir;
  if (target < 0 || target >= images.length) return;
  const [item] = images.splice(idx, 1);
  images.splice(target, 0, item);
}

function removeImage(idx: number) {
  const [item] = images.splice(idx, 1);
  if (item.path) removedPaths.push(item.path);
}

function addVideo() {
  videos.push({_key: genKey(), src: ''});
}

function removeVideo(idx: number) {
  videos.splice(idx, 1);
}

function flash(msg: string, isError = false) {
  saveMsg.value = msg;
  saveError.value = isError;
  if (!isError) setTimeout(() => (saveMsg.value = ''), 4000);
}

function validate(): string | null {
  if (!form.name.trim()) return 'Name is required.';
  return null;
}

async function save() {
  const err = validate();
  if (err) return flash(err, true);

  saving.value = true;
  saveMsg.value = '';

  try {
    // Upload any new images, in order
    const paths: string[] = [];
    for (const slot of images) {
      if (slot.path) {
        paths.push(slot.path);
        continue;
      }
      if (slot.file) {
        const {path, error} = await uploadProductImage(slot.file);
        if (error || !path) {
          throw new Error(errMsg(error) || 'Image upload failed. Please try again.');
        }
        slot.path = path; // remember so a retry won't re-upload
        paths.push(path);
      }
    }

    // <input type="number"> makes v-model yield a number (or '' when empty),
    // so never assume a string here.
    const priceRaw = form.price;
    const priceNum =
      priceRaw === '' || priceRaw === null || priceRaw === undefined ? null : Number(priceRaw);

    const payload: ProductInput = {
      name: form.name.trim(),
      slug: slugify(form.slug) || null,
      description: form.description.trim() || null,
      promo: form.promo.trim() || null,
      price: priceNum !== null && !isNaN(priceNum) ? priceNum : null,
      image: paths.length ? paths : null,
      image_bg: form.image_bg?.trim() || null,
      featured: form.featured,
      active: form.active,
      videos: videos.filter((v) => v.src.trim()).map((v) => ({type: 'youtube', src: v.src.trim()})),
    };
    if (!payload.videos?.length) payload.videos = null;

    const {error, id} = props.productId
      ? {...(await updateProduct(props.productId, payload)), id: props.productId}
      : await createProduct(payload);

    if (error || !id) {
      throw new Error(errMsg(error) || 'Failed to save product. Please try again.');
    }

    // Clean up images the admin removed (best effort)
    for (const p of removedPaths) await deleteProductImage(p);
    removedPaths.length = 0;

    if (props.productId) {
      flash('Product saved successfully!');
    } else {
      // Land on the edit screen of the new product so the order form can be configured next
      await navigateTo(`/admin/products/${id}/edit`);
    }
  } catch (e: any) {
    console.error('[ProductForm:save]', e);
    flash(e?.message || 'Something went wrong while saving. Please try again.', true);
  } finally {
    saving.value = false;
  }
}

// Pull a human-readable message out of a Supabase error object.
function errMsg(error: unknown): string {
  const e = error as any;
  if (!e) return '';
  return [e.message, e.details, e.hint].filter(Boolean).join(' — ');
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

.ghost-btn--sm {
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.color-swatch {
  width: 2.5rem;
  height: 2.2rem;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.color-hex {
  max-width: 9rem;
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

.icon-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn--sm {
  padding: 0.2rem 0.35rem;
  font-size: 0.65rem;
}

.icon-btn--danger:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
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

/* Cards */
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

.form-card--drag {
  border-color: #2563eb;
  border-style: dashed;
  background: #eff6ff;
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

/* Fields */
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
  gap: 0.75rem;
}

.field-row--switches {
  align-self: end;
  padding-bottom: 0.4rem;
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

.field-textarea {
  resize: vertical;
  min-height: 4rem;
}

.slug-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.slug-prefix {
  color: #94a3b8;
  font-size: 0.85rem;
  white-space: nowrap;
}

.slug-row .field-input {
  flex: 1;
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

/* Images */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.85rem;
}

.image-tile {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  overflow: hidden;
  background: #f8fafc;
}

.image-thumb {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.primary-badge {
  position: absolute;
  top: 0.35rem;
  left: 0.35rem;
  background: #0033a0;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
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

/* Videos */
.video-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.video-row .field-input {
  flex: 1;
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
