<template>
  <div>
    <NuxtLink to="/admin/membership" class="admin-back-link">
      <font-awesome-icon :icon="['fas', 'chevron-left']" />
      Back to Applications
    </NuxtLink>

    <div class="page-head">
      <h1 class="admin-page-title">Membership Form</h1>
      <div class="head-actions">
        <button class="ghost-btn" @click="showPreview = !showPreview">
          {{ showPreview ? 'Hide preview' : 'Show preview' }}
        </button>
        <button class="ghost-btn" @click="resetToDefault">Reset to default</button>
        <button class="admin-btn" :disabled="saving" @click="save">
          <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
          {{ saving ? 'Saving…' : 'Save form' }}
        </button>
      </div>
    </div>

    <p class="hint">
      The form is defined as JSON (same field engine as event RSVPs). Field types:
      <code>text, number, email, tel, textarea, select, checkbox, readonly, image, template, lineitems</code>.
      Use <code>required</code>, <code>required_if</code>, <code>options</code>, and (for
      <code>lineitems</code>) <code>item_fields</code> / <code>add_label</code>.
    </p>

    <div v-if="msg" :class="['save-msg', msgError ? 'save-msg--error' : 'save-msg--ok']">{{ msg }}</div>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <div v-else class="editor-grid" :class="{ 'editor-grid--split': showPreview }">
      <div class="json-col">
        <textarea
          v-model="jsonText"
          class="json-area"
          spellcheck="false"
          @input="onEdit"
        ></textarea>
        <p v-if="parseError" class="parse-error">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
          {{ parseError }}
        </p>
      </div>

      <div v-if="showPreview" class="preview-col">
        <h3 class="preview-title">Live preview</h3>
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
import {ref, reactive, provide} from 'vue';
import {
  getMembershipForm,
  saveMembershipForm,
  DEFAULT_MEMBERSHIP_FORM,
} from '~/composables/useMembership';
import {isSection, type RsvpConfig} from '~/composables/useRsvp';
import RsvpFieldRenderer from '~/components/RsvpFieldRenderer.vue';

definePageMeta({layout: 'admin', middleware: 'auth'});

const loading = ref(true);
const saving = ref(false);
const msg = ref('');
const msgError = ref(false);
const jsonText = ref('');
const parseError = ref('');
const parsed = ref<RsvpConfig | null>(null);
const showPreview = ref(false);
const previewData = reactive<Record<string, any>>({});

provide('fieldErrors', {});

onMounted(async () => {
  const config = await getMembershipForm();
  jsonText.value = JSON.stringify(config, null, 2);
  reparse();
  loading.value = false;
});

// Validate JSON: must parse and have a `fields` array.
function reparse(): RsvpConfig | null {
  try {
    const obj = JSON.parse(jsonText.value);
    if (!obj || !Array.isArray(obj.fields)) {
      parseError.value = 'Config must be an object with a "fields" array.';
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

function onEdit() {
  reparse();
}

function resetToDefault() {
  jsonText.value = JSON.stringify(DEFAULT_MEMBERSHIP_FORM, null, 2);
  reparse();
  flash('Loaded the default form. Click Save to apply.');
}

function flash(text: string, isError = false) {
  msg.value = text;
  msgError.value = isError;
  setTimeout(() => (msg.value = ''), 4000);
}

async function save() {
  const config = reparse();
  if (!config) return flash('Fix the JSON before saving.', true);
  saving.value = true;
  const {error} = await saveMembershipForm(config);
  saving.value = false;
  if (error) return flash('Failed to save the form.', true);
  flash('Membership form saved.');
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

.head-actions {
  display: flex;
  gap: 0.5rem;
}

.hint {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0 0 1rem;
  line-height: 1.6;
}

.hint code {
  background: #f1f5f9;
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.78rem;
}

.admin-loading {
  color: #64748b;
  padding: 2rem 0;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.editor-grid--split {
  grid-template-columns: 1fr 1fr;
}

.json-area {
  width: 100%;
  box-sizing: border-box;
  min-height: 60vh;
  padding: 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #1e293b;
  resize: vertical;
  tab-size: 2;
}

.json-area:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #dc2626;
  font-size: 0.82rem;
  margin: 0.5rem 0 0;
}

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
}

.admin-btn:hover:not(:disabled) { background: #002080; }
.admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ghost-btn {
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
  .editor-grid--split {
    grid-template-columns: 1fr;
  }
}
</style>
