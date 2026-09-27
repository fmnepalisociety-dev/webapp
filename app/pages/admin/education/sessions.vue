<template>
  <div>
    <NuxtLink to="/admin/education" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Education
    </NuxtLink>

    <div class="page-head">
      <h1 class="admin-page-title">Registration Sessions</h1>
      <button class="ghost-btn" @click="startNew">
        <font-awesome-icon :icon="['fas', 'plus']" />
        New session
      </button>
    </div>

    <div v-if="msg" :class="['save-msg', msgError ? 'save-msg--error' : 'save-msg--ok']">{{ msg }}</div>

    <!-- Session picker -->
    <div v-if="!loading" class="session-tabs">
      <button
        v-for="s in sessions"
        :key="s.slug"
        :class="['session-tab', editing.slug === s.slug && !isNew ? 'session-tab--active' : '']"
        @click="selectSession(s)"
      >
        {{ s.term }}
        <span v-if="s.slug === currentSlug" class="current-pill">current</span>
      </button>
      <button v-if="isNew" class="session-tab session-tab--active">New session</button>
    </div>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <div v-else class="editor-grid" :class="{ 'editor-grid--split': showPreview }">
      <div class="editor-col">
        <!-- Session details -->
        <div class="card">
          <h2 class="card-title">Session</h2>
          <div class="two-col">
            <div class="field">
              <label>Term</label>
              <input v-model="editing.term" class="input" placeholder="e.g. Spring 2027" />
            </div>
            <div class="field">
              <label>Slug <span class="hint">(id, from term)</span></label>
              <input :value="effectiveSlug" class="input" disabled />
            </div>
          </div>
          <div class="two-col">
            <div class="field">
              <label>Starts</label>
              <input v-model="editing.starts" type="date" class="input" />
            </div>
            <div class="field">
              <label>Ends</label>
              <input v-model="editing.ends" type="date" class="input" />
            </div>
          </div>
          <div class="two-col">
            <div class="field">
              <label>Fee (USD)</label>
              <input v-model.number="editing.fee" type="number" class="input" />
            </div>
            <div class="field field--check">
              <label class="check"><input type="checkbox" v-model="editing.open" /> Registration open</label>
              <label class="check"><input type="checkbox" v-model="makeCurrent" /> Make this the current session</label>
            </div>
          </div>
        </div>

        <!-- Banner -->
        <div class="card">
          <h2 class="card-title">Register banner (shown on /education)</h2>
          <label class="check"><input type="checkbox" v-model="editing.banner.active" /> Show banner</label>
          <div class="field">
            <label>Title</label>
            <input v-model="editing.banner.title" class="input" />
          </div>
          <div class="field">
            <label>Subtitle <span class="hint">(HTML ok)</span></label>
            <textarea v-model="editing.banner.subtitle" class="input textarea" rows="2"></textarea>
          </div>
          <div class="field">
            <label>Button label</label>
            <input v-model="editing.banner.button_label" class="input" />
          </div>
        </div>

        <!-- Form JSON -->
        <div class="card">
          <div class="card-title-row">
            <h2 class="card-title">Registration form (JSON)</h2>
            <div class="card-actions">
              <button class="link-btn" @click="showPreview = !showPreview">
                {{ showPreview ? 'Hide preview' : 'Show preview' }}
              </button>
              <button class="link-btn" @click="resetForm">Reset to default</button>
            </div>
          </div>
          <textarea v-model="jsonText" class="json-area" spellcheck="false" @input="reparse"></textarea>
          <p v-if="parseError" class="parse-error">
            <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
            {{ parseError }}
          </p>
        </div>

        <div class="footer-actions">
          <button class="admin-btn" :disabled="saving" @click="save">
            <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
            {{ saving ? 'Saving…' : 'Save session' }}
          </button>
        </div>
      </div>

      <!-- Live preview -->
      <div v-if="showPreview" class="preview-col">
        <h3 class="preview-title">Form preview</h3>
        <div v-if="parsed" class="preview-form">
          <template v-for="(item, idx) in parsed.fields" :key="idx">
            <fieldset v-if="isSection(item)" class="preview-fieldset">
              <legend class="preview-legend">{{ item.section }}</legend>
              <RsvpFieldRenderer
                v-for="field in item.fields"
                :key="field.key"
                :field="field"
                :form-data="previewData"
              />
            </fieldset>
            <RsvpFieldRenderer v-else :field="item" :form-data="previewData" />
          </template>
        </div>
        <p v-else class="preview-invalid">Fix the JSON to see a preview.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, provide} from 'vue';
import {
  listSessions,
  getCurrentSlug,
  saveSession,
  setCurrentSlug,
  DEFAULT_SESSION,
  DEFAULT_EDUCATION_FORM,
  type EducationSession,
} from '~/composables/useEducationReg';
import {isSection, type RsvpConfig} from '~/composables/useRsvp';
import RsvpFieldRenderer from '~/components/RsvpFieldRenderer.vue';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
const saving = ref(false);
const msg = ref('');
const msgError = ref(false);

const sessions = ref<EducationSession[]>([]);
const currentSlug = ref('');

const isNew = ref(false);
const makeCurrent = ref(false);
const editing = reactive<Omit<EducationSession, 'form'>>({...DEFAULT_SESSION});
const jsonText = ref('');
const parsed = ref<RsvpConfig | null>(null);
const parseError = ref('');
const showPreview = ref(false);
const previewData = reactive<Record<string, any>>({});

provide('fieldErrors', {});

// New-session slug is derived from the term (year first, e.g. "Spring 2027" → "2027_spring").
function slugify(term: string): string {
  const year = (term.match(/\b(19|20)\d{2}\b/) || [])[0] || '';
  const rest = term
    .replace(year, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return [year, rest].filter(Boolean).join('_') || 'session';
}

const effectiveSlug = computed(() => (isNew.value ? slugify(editing.term) : editing.slug));

onMounted(async () => {
  await loadAll();
  loading.value = false;
});

async function loadAll() {
  const [list, cur] = await Promise.all([listSessions(), getCurrentSlug()]);
  sessions.value = list;
  currentSlug.value = cur;
  const start = list.find((s) => s.slug === cur) || list[0];
  if (start) selectSession(start);
  else startNew();
}

function selectSession(s: EducationSession) {
  isNew.value = false;
  Object.assign(editing, {
    slug: s.slug,
    term: s.term,
    starts: s.starts,
    ends: s.ends,
    fee: s.fee,
    open: s.open,
    banner: {...s.banner},
  });
  jsonText.value = JSON.stringify(s.form, null, 2);
  makeCurrent.value = s.slug === currentSlug.value;
  reparse();
}

function startNew() {
  isNew.value = true;
  Object.assign(editing, {
    slug: '',
    term: '',
    starts: '',
    ends: '',
    fee: DEFAULT_SESSION.fee,
    open: true,
    banner: {...DEFAULT_SESSION.banner},
  });
  jsonText.value = JSON.stringify(DEFAULT_EDUCATION_FORM, null, 2);
  makeCurrent.value = false;
  reparse();
}

function resetForm() {
  jsonText.value = JSON.stringify(DEFAULT_EDUCATION_FORM, null, 2);
  reparse();
  flash('Loaded the default form. Save to apply.');
}

function reparse(): RsvpConfig | null {
  try {
    const obj = JSON.parse(jsonText.value);
    if (!obj || !Array.isArray(obj.fields)) {
      parseError.value = 'Form must be an object with a "fields" array.';
      parsed.value = null;
      return null;
    }
    parseError.value = '';
    parsed.value = obj as RsvpConfig;
    return parsed.value;
  } catch (e: any) {
    parseError.value = `Invalid JSON: ${e.message}`;
    parsed.value = null;
    return null;
  }
}

function flash(text: string, isError = false) {
  msg.value = text;
  msgError.value = isError;
  setTimeout(() => (msg.value = ''), 4000);
}

async function save() {
  if (!editing.term.trim()) return flash('Term is required.', true);
  const form = reparse();
  if (!form) return flash('Fix the form JSON before saving.', true);

  const slug = effectiveSlug.value;
  const payload: EducationSession = {
    slug,
    term: editing.term.trim(),
    starts: editing.starts,
    ends: editing.ends,
    fee: Number(editing.fee) || 0,
    open: editing.open,
    banner: {...editing.banner},
    form,
  };

  saving.value = true;
  const {error} = await saveSession(payload);
  if (!error && makeCurrent.value) await setCurrentSlug(slug);
  saving.value = false;
  if (error) return flash('Failed to save the session.', true);

  await loadAll();
  selectSession(payload);
  flash('Session saved.');
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
.admin-back-link:hover { text-decoration: underline; }

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
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

.session-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.session-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.session-tab--active {
  background: #0033a0;
  color: #fff;
  border-color: #0033a0;
}

.current-pill {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #dcfce7;
  color: #166534;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
.editor-grid--split {
  grid-template-columns: 1fr 1fr;
}
.editor-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-actions {
  display: flex;
  gap: 1rem;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.hint {
  font-weight: 400;
  text-transform: none;
  color: #94a3b8;
}

.field--check {
  justify-content: center;
  gap: 0.4rem;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  text-transform: none;
  letter-spacing: normal;
  cursor: pointer;
}

.input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.88rem;
  color: #1e293b;
  font-family: inherit;
}

.input:disabled {
  background: #f8fafc;
  color: #64748b;
}

.textarea {
  resize: vertical;
  min-height: 3rem;
  line-height: 1.5;
}

.json-area {
  width: 100%;
  box-sizing: border-box;
  min-height: 40vh;
  padding: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #1e293b;
  resize: vertical;
  tab-size: 2;
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #dc2626;
  font-size: 0.82rem;
  margin: 0.5rem 0 0;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.2rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}
.admin-btn:hover:not(:disabled) { background: #002080; }
.admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.ghost-btn:hover { background: #f1f5f9; }

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.link-btn:hover { text-decoration: underline; }

.preview-col {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fbfcfe;
  align-self: start;
}

.preview-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
  margin: 0 0 0.75rem;
}

.preview-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.9rem 1rem 1rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.preview-legend {
  font-weight: 700;
  color: #1c3382;
  padding: 0 0.4rem;
  font-size: 0.9rem;
}

.preview-invalid {
  color: #94a3b8;
  font-size: 0.85rem;
}

.save-msg {
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.save-msg--ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.save-msg--error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

@media (max-width: 860px) {
  .editor-grid--split { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
}
</style>
