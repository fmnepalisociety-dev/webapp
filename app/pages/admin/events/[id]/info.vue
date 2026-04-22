<template>
  <div>
    <NuxtLink to="/admin/events" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Events
    </NuxtLink>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <template v-else-if="event">
      <div class="info-editor-header">
        <div>
          <h1 class="admin-page-title">{{ event.heading }}</h1>
          <p class="editor-meta">{{ event.event_date }} &middot; Event Info Editor</p>
        </div>
        <div class="header-actions">
          <a
            :href="`/events/${eventId}/info`"
            target="_blank"
            class="preview-link"
          >
            <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" />
            Preview
          </a>
          <button class="admin-btn" @click="saveAll" :disabled="saving">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-if="saveMsg" :class="['save-msg', saveError ? 'save-msg--error' : 'save-msg--ok']">
        {{ saveMsg }}
      </div>

      <!-- Sections -->
      <div class="sections-list">
        <div
          v-for="(section, sIdx) in sections"
          :key="section._key"
          class="section-card"
        >
          <div class="section-card-header">
            <span class="section-badge">Section {{ sIdx + 1 }}</span>
            <div class="section-card-actions">
              <button
                class="icon-btn"
                title="Move up"
                :disabled="sIdx === 0"
                @click="moveSection(sIdx, -1)"
              >
                <font-awesome-icon :icon="['fas', 'arrow-up']" />
              </button>
              <button
                class="icon-btn"
                title="Move down"
                :disabled="sIdx === sections.length - 1"
                @click="moveSection(sIdx, 1)"
              >
                <font-awesome-icon :icon="['fas', 'arrow-down']" />
              </button>
              <button class="icon-btn icon-btn--danger" title="Remove section" @click="removeSection(sIdx)">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </div>
          </div>

          <div class="section-card-body">
            <!-- Type -->
            <div class="field-row">
              <label class="field-label">Type</label>
              <select v-model="section.type" class="field-input field-select">
                <option value="list">List</option>
                <option value="text">Text / HTML</option>
              </select>
            </div>

            <!-- Title -->
            <div class="field-row">
              <label class="field-label">Title <span class="html-hint">(HTML ok)</span></label>
              <input v-model="section.title" class="field-input" placeholder="Section title" />
            </div>

            <!-- Description -->
            <div class="field-row">
              <label class="field-label">Description <span class="html-hint">(HTML ok, optional)</span></label>
              <textarea v-model="section.description" class="field-input" rows="2" placeholder="Optional description"></textarea>
            </div>

            <!-- Text content (for type=text) -->
            <div v-if="section.type === 'text'" class="field-row">
              <label class="field-label">Content <span class="html-hint">(HTML ok)</span></label>
              <textarea v-model="section.content" class="field-input field-textarea" rows="5" placeholder="HTML content"></textarea>
            </div>

            <!-- Items (for type=list) -->
            <div v-if="section.type === 'list'" class="items-area">
              <div class="items-header">
                <label class="field-label">Items</label>
                <button class="add-btn add-btn--sm" @click="addItem(sIdx)">
                  <font-awesome-icon :icon="['fas', 'plus']" /> Add Item
                </button>
              </div>

              <div v-if="!section.items?.length" class="items-empty">No items yet.</div>

              <div
                v-for="(item, iIdx) in section.items"
                :key="item._key"
                class="item-card"
              >
                <div class="item-card-header">
                  <span class="item-badge">{{ iIdx + 1 }}</span>
                  <div class="item-card-actions">
                    <button
                      class="icon-btn icon-btn--sm"
                      title="Move up"
                      :disabled="iIdx === 0"
                      @click="moveItem(sIdx, iIdx, -1)"
                    >
                      <font-awesome-icon :icon="['fas', 'arrow-up']" />
                    </button>
                    <button
                      class="icon-btn icon-btn--sm"
                      title="Move down"
                      :disabled="iIdx === (section.items?.length ?? 0) - 1"
                      @click="moveItem(sIdx, iIdx, 1)"
                    >
                      <font-awesome-icon :icon="['fas', 'arrow-down']" />
                    </button>
                    <button
                      class="icon-btn icon-btn--sm icon-btn--danger"
                      title="Remove item"
                      @click="removeItem(sIdx, iIdx)"
                    >
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
                <div class="item-fields">
                  <input v-model="item.title" class="field-input" placeholder="Title (HTML ok)" />
                  <input v-model="item.description" class="field-input" placeholder="Description (HTML ok, optional)" />
                  <input v-model="item.detail" class="field-input" placeholder="Detail (HTML ok, optional)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="add-btn" @click="addSection">
        <font-awesome-icon :icon="['fas', 'plus']" /> Add Section
      </button>
    </template>

    <div v-else class="admin-empty">Event not found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { getEvents } from '~/composables/useEvents';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const route = useRoute();
const eventId = route.params.id as string;
const { $supabase } = useNuxtApp();

const loading = ref(true);
const saving = ref(false);
const saveMsg = ref('');
const saveError = ref(false);
const event = ref<any>(null);

let nextKey = 0;
function genKey() {
  return ++nextKey;
}

interface EditItem {
  _key: number;
  title: string;
  description: string;
  detail: string;
}

interface EditSection {
  _key: number;
  type: 'list' | 'text';
  title: string;
  description: string;
  content: string;
  items: EditItem[];
}

const sections = reactive<EditSection[]>([]);

function toEditSection(raw: any): EditSection {
  return {
    _key: genKey(),
    type: raw.type || 'list',
    title: raw.title || '',
    description: raw.description || '',
    content: raw.content || '',
    items: (raw.items || []).map((item: any) => ({
      _key: genKey(),
      title: item.title || '',
      description: item.description || '',
      detail: item.detail || '',
    })),
  };
}

function toJsonSections(): any[] {
  return sections.map((s) => {
    const out: any = { type: s.type, title: s.title };
    if (s.description) out.description = s.description;
    if (s.type === 'text') {
      if (s.content) out.content = s.content;
    } else {
      out.items = s.items.map((item) => {
        const o: any = {};
        if (item.title) o.title = item.title;
        if (item.description) o.description = item.description;
        if (item.detail) o.detail = item.detail;
        return o;
      });
    }
    return out;
  });
}

onMounted(async () => {
  const allEvents = await getEvents();
  event.value = allEvents.find((e: any) => e.id === eventId) ?? null;

  if (event.value?.event_info && Array.isArray(event.value.event_info)) {
    for (const raw of event.value.event_info) {
      sections.push(toEditSection(raw));
    }
  }

  loading.value = false;
});

function addSection() {
  sections.push({
    _key: genKey(),
    type: 'list',
    title: '',
    description: '',
    content: '',
    items: [],
  });
}

function removeSection(idx: number) {
  sections.splice(idx, 1);
}

function moveSection(idx: number, dir: number) {
  const target = idx + dir;
  if (target < 0 || target >= sections.length) return;
  const tmp = sections[idx];
  sections[idx] = sections[target];
  sections[target] = tmp;
}

function addItem(sIdx: number) {
  if (!sections[sIdx].items) sections[sIdx].items = [];
  sections[sIdx].items.push({
    _key: genKey(),
    title: '',
    description: '',
    detail: '',
  });
}

function removeItem(sIdx: number, iIdx: number) {
  sections[sIdx].items.splice(iIdx, 1);
}

function moveItem(sIdx: number, iIdx: number, dir: number) {
  const items = sections[sIdx].items;
  const target = iIdx + dir;
  if (target < 0 || target >= items.length) return;
  const tmp = items[iIdx];
  items[iIdx] = items[target];
  items[target] = tmp;
}

async function saveAll() {
  saving.value = true;
  saveMsg.value = '';
  saveError.value = false;

  const payload = toJsonSections();

  const { error } = await $supabase
    .from('events')
    .update({ event_info: payload.length ? payload : null })
    .eq('id', eventId);

  if (error) {
    console.error('[admin:info:save]', error);
    saveMsg.value = 'Failed to save. Please try again.';
    saveError.value = true;
  } else {
    saveMsg.value = 'Saved successfully!';
    // Update local event data
    if (event.value) event.value.event_info = payload.length ? payload : null;
  }

  saving.value = false;
  setTimeout(() => {
    saveMsg.value = '';
  }, 4000);
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

.admin-empty {
  color: #94a3b8;
  padding: 2rem 0;
  text-align: center;
}

.info-editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.editor-meta {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.preview-link:hover {
  text-decoration: underline;
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

/* Sections list */
.sections-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-card-header {
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

.section-card-actions {
  display: flex;
  gap: 0.35rem;
}

.section-card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Fields */
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

.field-select {
  max-width: 12rem;
}

.field-textarea {
  resize: vertical;
  min-height: 4rem;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
}

/* Items */
.items-area {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.75rem;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.items-empty {
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.75rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.item-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.item-card-actions {
  display: flex;
  gap: 0.25rem;
}

.item-fields {
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* Buttons */
.icon-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem 0.45rem;
  font-size: 0.72rem;
  transition: all 0.15s;
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
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}
</style>
