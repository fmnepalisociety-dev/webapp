<template>
  <div class="field-editor">
    <div class="field-grid">
      <div class="field-row">
        <label class="field-label">Key</label>
        <input v-model="field.key" class="field-input" placeholder="e.g. full_name" />
      </div>
      <div class="field-row">
        <label class="field-label">Label</label>
        <input v-model="field.label" class="field-input" placeholder="e.g. Full Name" />
      </div>
      <div class="field-row">
        <label class="field-label">Type</label>
        <select v-model="field.type" class="field-input">
          <option v-for="t in FIELD_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <div v-if="field.type === 'select'" class="field-row">
      <label class="field-label">Options <span class="html-hint">(one per line)</span></label>
      <textarea
        v-model="field.optionsText"
        class="field-input field-textarea"
        rows="3"
        placeholder="Yes&#10;No&#10;Maybe"
      ></textarea>
    </div>

    <div v-if="field.type === 'readonly' || field.type === 'template'" class="field-row">
      <label class="field-label">Value</label>
      <input v-model="field.value" class="field-input" placeholder="Static / template value" />
    </div>

    <div v-if="field.type === 'image'" class="field-row">
      <label class="field-label">Image URL</label>
      <input v-model="field.value" class="field-input" placeholder="https://... (or pick / upload below)" />
      <div class="img-row">
        <select class="preset-select" :value="''" @change="applyPreset">
          <option value="" disabled>Use a saved image…</option>
          <option v-for="p in PAYMENT_IMAGES" :key="p.url" :value="p.url">{{ p.label }}</option>
        </select>
        <button type="button" class="mini-btn" :disabled="uploading" @click="fileInput?.click()">
          <font-awesome-icon :icon="['fas', uploading ? 'spinner' : 'upload']" :spin="uploading" />
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
        <img v-if="field.value" :src="field.value" class="img-preview" alt="preview" />
      </div>
      <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
      <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onUpload" />
    </div>

    <div class="field-inline-row">
      <label class="switch switch--sm">
        <input type="checkbox" v-model="field.required" />
        <span>Required</span>
      </label>
      <div class="reqif">
        <span class="reqif-label">Required only if</span>
        <input v-model="field.reqIfField" class="field-input field-input--sm" placeholder="field key" />
        <span class="reqif-eq">=</span>
        <input v-model="field.reqIfValue" class="field-input field-input--sm" placeholder="value" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface RsvpFieldModel {
  _key: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  reqIfField: string;
  reqIfValue: string;
  optionsText: string;
  value: string;
}

// The field object is a reactive row owned by the parent; mutating its
// properties here updates the parent's state directly.
const props = defineProps<{field: RsvpFieldModel; uploadFolder?: string}>();

import {ref} from 'vue';
import {uploadPublicImage} from '~/composables/useSupabaseImage';
import {PAYMENT_IMAGES} from '~/constants/payment';

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const uploadError = ref('');

function applyPreset(e: Event) {
  const url = (e.target as HTMLSelectElement).value;
  if (url) props.field.value = url;
  (e.target as HTMLSelectElement).value = '';
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  uploadError.value = '';
  const {url, error} = await uploadPublicImage(file, props.uploadFolder || 'rsvp');
  uploading.value = false;
  input.value = '';
  if (error || !url) {
    uploadError.value = 'Upload failed. Check the nsfm storage policy and try again.';
    return;
  }
  props.field.value = url;
}

const FIELD_TYPES = [
  'text',
  'number',
  'email',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'readonly',
  'image',
  'template',
];
</script>

<style scoped>
.field-editor {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 10rem;
  gap: 0.6rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.75rem;
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
  padding: 0.4rem 0.55rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.85rem;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
}

.field-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.field-input--sm {
  width: 8rem;
  padding: 0.3rem 0.45rem;
  font-size: 0.8rem;
}

.field-textarea {
  resize: vertical;
  min-height: 3.5rem;
  font-family: inherit;
}

.field-inline-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.switch input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.reqif {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.reqif-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.reqif-eq {
  color: #94a3b8;
}

.img-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.preset-select {
  padding: 0.35rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  font-size: 0.8rem;
  color: #334155;
  background: white;
  cursor: pointer;
}

.mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.mini-btn:hover:not(:disabled) {
  background: #dbeafe;
}

.mini-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.img-preview {
  height: 48px;
  width: 48px;
  object-fit: cover;
  border-radius: 0.3rem;
  border: 1px solid #e2e8f0;
}

.upload-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin: 0.25rem 0 0;
}

.hidden-file {
  display: none;
}

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
