<template>
  <div v-if="isVisible" :class="['rsvp-field', { 'rsvp-field--inline': isInline }, { 'rsvp-field--error': !!errorMsg }]">

    <!-- Readonly text -->
    <template v-if="field.type === 'readonly'">
      <p class="readonly-text">{{ field.value }}</p>
    </template>

    <!-- Image: a modest thumbnail that opens full size on click -->
    <template v-else-if="field.type === 'image'">
      <div class="readonly-image-wrapper">
        <label v-if="field.label" class="field-label">{{ field.label }}</label>
        <button type="button" class="readonly-image-btn" @click="imageOpen = true">
          <img :src="field.value" :alt="field.label || 'Image'" class="readonly-image" />
          <span class="readonly-image-hint">
            <font-awesome-icon :icon="['fas', 'expand']" />
            Tap to enlarge
          </span>
        </button>
      </div>

      <Teleport to="body">
        <div v-if="imageOpen" class="image-overlay" @click="imageOpen = false">
          <button type="button" class="image-overlay-close" @click="imageOpen = false" aria-label="Close image">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
          <img :src="field.value" :alt="field.label || 'Image'" class="image-overlay-img" @click.stop />
        </div>
      </Teleport>
    </template>

    <!-- Dynamic HTML template -->
    <template v-else-if="field.type === 'template'">
      <div v-html="renderedTemplate"></div>
    </template>

    <!-- Repeatable line items (e.g. color / size / qty rows) -->
    <template v-else-if="field.type === 'lineitems'">
      <label class="field-label lineitems-label">
        {{ field.label }}
        <span v-if="isRequired" class="required-star">*</span>
      </label>

      <div class="lineitems">
        <div v-for="(row, idx) in rows" :key="idx" class="lineitem-row">
          <template v-for="sf in field.item_fields" :key="sf.key">
            <select
              v-if="sf.type === 'select'"
              v-model="row[sf.key]"
              class="rsvp-input lineitem-input"
            >
              <option value="" disabled>{{ sf.label }}</option>
              <option v-for="opt in sf.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input
              v-else
              :type="sf.type === 'number' ? 'number' : 'text'"
              :min="sf.type === 'number' ? 1 : undefined"
              :placeholder="sf.label"
              v-model="row[sf.key]"
              class="rsvp-input lineitem-input"
              :class="{ 'lineitem-input--num': sf.type === 'number' }"
            />
          </template>
          <button
            type="button"
            class="lineitem-remove"
            title="Remove item"
            :disabled="rows.length <= 1"
            @click="removeRow(idx)"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
        </div>

        <button type="button" class="lineitem-add" @click="addRow">
          <font-awesome-icon :icon="['fas', 'plus']" /> {{ field.add_label || 'Add item' }}
        </button>

        <div v-if="field.unit_price" class="lineitem-total">
          <span>Total ({{ totalQty }} item{{ totalQty === 1 ? '' : 's' }})</span>
          <strong>${{ totalQty * field.unit_price }}</strong>
        </div>

        <span v-if="errorMsg" class="field-error">{{ errorMsg }}</span>
      </div>
    </template>

    <!-- Checkbox (inline by nature) -->
    <template v-else-if="field.type === 'checkbox'">
      <div class="checkbox-row">
        <input
          :id="field.key"
          type="checkbox"
          v-model="formData[field.key]"
          class="checkbox-input"
        />
        <label :for="field.key" class="checkbox-label">
          {{ field.label }}
          <span v-if="isRequired" class="required-star">*</span>
        </label>
      </div>
    </template>

    <!-- All other editable fields — label + input side by side -->
    <template v-else>
      <label :for="field.key" class="field-label">
        {{ field.label }}
        <span v-if="isRequired" class="required-star">*</span>
      </label>

      <div class="field-input-wrapper">
        <!-- Text / Email / Tel / Number -->
        <input
          v-if="['text', 'email', 'tel', 'number'].includes(field.type)"
          :id="field.key"
          :type="field.type"
          v-model="formData[field.key]"
          :required="field.required"
          :min="field.type === 'number' ? 0 : undefined"
          :class="['rsvp-input', { 'rsvp-input--error': !!errorMsg }]"
        />

        <!-- Textarea -->
        <textarea
          v-else-if="field.type === 'textarea'"
          :id="field.key"
          v-model="formData[field.key]"
          :required="field.required"
          rows="2"
          :class="['rsvp-input', { 'rsvp-input--error': !!errorMsg }]"
        ></textarea>

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          :id="field.key"
          v-model="formData[field.key]"
          :required="field.required"
          :class="['rsvp-input', { 'rsvp-input--error': !!errorMsg }]"
        >
          <option value="" disabled>Select...</option>
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span v-if="errorMsg" class="field-error">{{ errorMsg }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, onBeforeUnmount } from 'vue';
import { emptyLineItemRow, type RsvpField } from '~/composables/useRsvp';

const props = defineProps<{
  field: RsvpField;
  formData: Record<string, any>;
}>();

const fieldErrors = inject<Record<string, string>>('fieldErrors', {});

/* ---- Image field: shrinkable thumbnail + full-size overlay ---- */
const imageOpen = ref(false);

function onOverlayKey(e: KeyboardEvent) {
  if (e.key === 'Escape') imageOpen.value = false;
}

watch(imageOpen, (open) => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) document.addEventListener('keydown', onOverlayKey);
  else document.removeEventListener('keydown', onOverlayKey);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onOverlayKey);
  if (imageOpen.value) document.body.style.overflow = '';
});

const errorMsg = computed(() => fieldErrors[props.field.key] || '');

const isInline = computed(() => {
  return !['readonly', 'image', 'checkbox', 'textarea', 'template', 'lineitems'].includes(props.field.type);
});

/* ---- Line items ---- */
const rows = computed<Record<string, any>[]>(() => {
  const v = props.formData[props.field.key];
  return Array.isArray(v) ? v : [];
});

const quantityKey = computed(() => props.field.item_fields?.find((f) => f.type === 'number')?.key);

const totalQty = computed(() => {
  const key = quantityKey.value;
  if (!key) return 0;
  return rows.value.reduce((sum, r) => sum + (Math.max(0, parseFloat(r[key]) || 0)), 0);
});

function addRow() {
  if (!Array.isArray(props.formData[props.field.key])) props.formData[props.field.key] = [];
  props.formData[props.field.key].push(emptyLineItemRow(props.field));
}

function removeRow(idx: number) {
  const arr = props.formData[props.field.key];
  if (Array.isArray(arr) && arr.length > 1) arr.splice(idx, 1);
}

const isVisible = computed(() => {
  if (!props.field.required_if) return true;
  return props.formData[props.field.required_if.field] === props.field.required_if.value;
});

const isRequired = computed(() => {
  if (props.field.required) return true;
  if (props.field.required_if) return isVisible.value;
  return false;
});

/**
 * Evaluate a simple arithmetic expression where identifiers are form field keys.
 * Supports: + - * / ( ) and numeric literals.
 * Any unknown identifier resolves to 0.
 */
function evalExpr(expr: string): string {
  // Replace identifiers (sequences of word chars) with their numeric form values
  const substituted = expr.replace(/[a-zA-Z_]\w*/g, (key) => {
    return String(Math.max(0, parseFloat(props.formData[key]) || 0));
  });
  // Only allow digits, whitespace, and basic arithmetic — reject anything else
  if (!/^[\d\s+\-*/().]+$/.test(substituted)) return '0';
  try {
    const result = Function(`"use strict"; return (${substituted});`)();
    return typeof result === 'number' && isFinite(result) ? String(result) : '0';
  } catch {
    return '0';
  }
}

const renderedTemplate = computed(() => {
  if (!props.field.value) return '';
  return props.field.value.replace(/\{\{(.+?)\}\}/g, (_, expr) => evalExpr(expr.trim()));
});
</script>

<style scoped>
.rsvp-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Line items */
.lineitems-label {
  min-width: 0;
  margin-bottom: 0.4rem;
}

.lineitems {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lineitem-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.lineitem-input {
  flex: 1;
  min-width: 0;
}

.lineitem-input--num {
  flex: 0 0 5rem;
}

.lineitem-remove {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #ef4444;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lineitem-remove:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fecaca;
}

.lineitem-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lineitem-add {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.lineitem-add:hover {
  background: #dbeafe;
}

.lineitem-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  color: #15803d;
  font-weight: 600;
}

.rsvp-field--inline {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.field-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  white-space: nowrap;
  min-width: 10rem;
  flex-shrink: 0;
}

.required-star {
  color: #ef4444;
  margin-left: 0.15rem;
}

.field-input-wrapper {
  flex: 1;
  min-width: 0;
}

.rsvp-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: border-color 0.15s;
  background: white;
}

.rsvp-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.checkbox-input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #2563eb;
}

.checkbox-label {
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
}

.readonly-text {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  padding: 0.4rem 0.65rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #f3f4f6;
}

.readonly-image-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.readonly-image-btn {
  position: relative;
  align-self: flex-start;
  display: block;
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
  line-height: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Roomy by default — a payment QR has to be scannable straight off the page —
   but capped so it shrinks with the viewport rather than anchoring the layout
   at its natural size. The overlay covers anything needing a closer look. */
.readonly-image {
  display: block;
  max-width: 100%;
  max-height: min(28rem, 60vh);
  width: auto;
  height: auto;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.readonly-image-hint {
  position: absolute;
  bottom: 0.4rem;
  right: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.4;
}

.rsvp-input--error {
  border-color: #ef4444;
}

.rsvp-input--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.field-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.15rem;
}

/* Stack on small screens */
@media (max-width: 480px) {
  .readonly-image {
    max-height: min(20rem, 55vh);
  }

  .rsvp-field--inline {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }

  /* Labels are free to wrap here — nowrap pushed the longer ones, and the page
     with them, past the viewport. */
  .field-label {
    min-width: unset;
    white-space: normal;
  }

  /* Three inputs plus a remove button leave nothing usable on one line, so give
     the text fields a row each and pair the number with the remove button. */
  .lineitem-input {
    flex: 1 1 100%;
  }

  .lineitem-input--num {
    flex: 1 1 auto;
  }
}
</style>

<style>
/* Teleported to body, so these have to be unscoped. */
/* Full-size overlay */
.image-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: zoom-out;
}

.image-overlay-img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  border-radius: 0.5rem;
  cursor: default;
}

.image-overlay-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.image-overlay-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
