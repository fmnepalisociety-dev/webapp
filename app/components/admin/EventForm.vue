<template>
  <div>
    <NuxtLink to="/admin/events" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Events
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <template v-else>
      <div class="form-header">
        <h1 class="admin-page-title">{{ eventId ? 'Edit Event' : 'New Event' }}</h1>
        <div class="header-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : eventId ? 'Save Changes' : 'Create Event' }}
          </button>
        </div>
      </div>

      <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
        {{ saveMsg }}
      </div>

      <div class="form-card">
        <div class="field-row">
          <label class="field-label">Heading</label>
          <input v-model="form.heading" class="field-input" placeholder="e.g. Dashain Celebration 2026" />
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Date</label>
            <input v-model="form.event_date" class="field-input" placeholder="e.g. Saturday, July 4, 2026" />
            <p class="field-hint">Shown on the site exactly as typed. Match the format of existing events.</p>
          </div>
          <div class="field-row">
            <label class="field-label">Time</label>
            <input v-model="form.event_time" class="field-input" placeholder="e.g. 5:00 PM – 9:00 PM" />
          </div>
        </div>

        <div class="field-two-col">
          <div class="field-row">
            <label class="field-label">Location</label>
            <input v-model="form.location_name" class="field-input" placeholder="e.g. Hjemkomst Center, Moorhead" />
          </div>
          <div class="field-row">
            <label class="field-label">Map URL <span class="html-hint">(optional)</span></label>
            <input v-model="form.location_url" class="field-input" placeholder="https://maps.google.com/..." />
          </div>
        </div>

        <div class="field-row field-row--inline">
          <label class="switch">
            <input type="checkbox" v-model="form.featured" />
            <span>Featured</span>
          </label>
          <span class="field-hint field-hint--inline">Featured events with an image surface on the homepage.</span>
        </div>

        <div class="field-row">
          <label class="field-label">Body <span class="html-hint">(HTML ok)</span></label>
          <textarea v-model="form.body" class="field-input field-textarea" rows="5" placeholder="Main event description"></textarea>
        </div>

        <div class="field-row">
          <label class="field-label">Promo <span class="html-hint">(HTML ok, optional)</span></label>
          <textarea v-model="form.promo" class="field-input field-textarea" rows="2" placeholder="Short promo line shown under the body"></textarea>
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

        <p v-if="!videos.length" class="items-empty">No videos. Paste a YouTube URL to embed it on the event page.</p>

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
          {{ saving ? 'Saving...' : eventId ? 'Save Changes' : 'Create Event' }}
        </button>
        <button class="ghost-btn" @click="navigateTo('/admin/events')">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue';
import {
  getEvent,
  createEvent,
  updateEvent,
  uploadEventImage,
  deleteEventImage,
  type EventInput,
} from '~/composables/useEvents';
import {NeSFM_GENERIC_BUCKET} from '~/composables/useSupabaseImage';

const props = defineProps<{eventId?: string | null}>();

const {getPublicImageUrl} = useSupabaseImage();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const imgDrag = ref(false);

const form = reactive({
  heading: '',
  event_date: '',
  event_time: '',
  location_name: '',
  location_url: '',
  featured: false,
  body: '',
  promo: '',
});

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
  if (props.eventId) {
    const ev = await getEvent(props.eventId);
    if (ev) {
      form.heading = ev.heading ?? '';
      form.event_date = ev.event_date ?? '';
      form.event_time = ev.event_time ?? '';
      const loc = parseLocation(ev.event_location ?? '');
      form.location_name = loc.name;
      form.location_url = loc.url;
      form.featured = !!ev.featured;
      form.body = ev.body ?? '';
      form.promo = ev.promo ?? '';
      for (const path of (ev.image as string[] | null) ?? []) {
        images.push({key: genKey(), path, url: getPublicImageUrl(NeSFM_GENERIC_BUCKET, path) ?? ''});
      }
      for (const v of (ev.videos as any[] | null) ?? []) {
        videos.push({_key: genKey(), src: v?.src ?? ''});
      }
    } else {
      flash('Event not found.', true);
    }
  }
  loading.value = false;
});

function parseLocation(raw: string): {name: string; url: string} {
  const match = raw.match(/^(.*?)\s*\[(.+)]$/);
  if (match) return {name: match[1].trim(), url: match[2].trim()};
  return {name: raw, url: ''};
}

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
  if (!form.heading.trim()) return 'Heading is required.';
  if (!form.event_date.trim()) return 'Date is required.';
  return null;
}

async function save() {
  const err = validate();
  if (err) return flash(err, true);

  saving.value = true;
  saveMsg.value = '';

  // Upload any new images, in order
  const year = yearFrom(form.event_date);
  const paths: string[] = [];
  for (const slot of images) {
    if (slot.path) {
      paths.push(slot.path);
      continue;
    }
    if (slot.file) {
      const {path, error} = await uploadEventImage(slot.file, year);
      if (error || !path) {
        saving.value = false;
        const dup = (error as any)?.statusCode === '409' || /exists|duplicate/i.test((error as any)?.message ?? '');
        return flash(
          dup
            ? `An image named "${slot.file.name}" already exists for ${year}. Rename the file and try again.`
            : 'Image upload failed. Please try again.',
          true
        );
      }
      slot.path = path; // remember so a retry won't re-upload
      paths.push(path);
    }
  }

  const location = form.location_url.trim()
    ? `${form.location_name.trim()} [${form.location_url.trim()}]`
    : form.location_name.trim();

  const payload: EventInput = {
    heading: form.heading.trim(),
    event_date: form.event_date.trim(),
    event_time: form.event_time.trim(),
    event_location: location,
    body: form.body.trim() || null,
    promo: form.promo.trim() || null,
    image: paths.length ? paths : null,
    featured: form.featured,
    videos: videos.filter((v) => v.src.trim()).map((v) => ({type: 'youtube', src: v.src.trim()})),
  };
  if (!payload.videos?.length) payload.videos = null;

  const {error, id} = props.eventId
    ? {...(await updateEvent(props.eventId, payload)), id: props.eventId}
    : await createEvent(payload);

  if (error || !id) {
    saving.value = false;
    return flash('Failed to save event. Please try again.', true);
  }

  // Clean up images the admin removed (best effort)
  for (const p of removedPaths) await deleteEventImage(p);
  removedPaths.length = 0;

  saving.value = false;

  if (props.eventId) {
    flash('Event saved successfully!');
  } else {
    // Land on the edit screen of the new event so RSVP/info can be configured next
    await navigateTo(`/admin/events/${id}/edit`);
  }
}

function yearFrom(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
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
