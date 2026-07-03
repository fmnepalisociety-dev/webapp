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
defineProps<{field: RsvpFieldModel}>();

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

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
