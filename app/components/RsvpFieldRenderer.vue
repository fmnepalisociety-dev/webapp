<template>
  <div v-if="isVisible" :class="['rsvp-field', { 'rsvp-field--inline': isInline }, { 'rsvp-field--error': !!errorMsg }]">

    <!-- Readonly text -->
    <template v-if="field.type === 'readonly'">
      <p class="readonly-text">{{ field.value }}</p>
    </template>

    <!-- Image -->
    <template v-else-if="field.type === 'image'">
      <div class="readonly-image-wrapper">
        <label v-if="field.label" class="field-label">{{ field.label }}</label>
        <img :src="field.value" :alt="field.label || 'Image'" class="readonly-image" />
      </div>
    </template>

    <!-- Dynamic HTML template -->
    <template v-else-if="field.type === 'template'">
      <div v-html="renderedTemplate"></div>
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
import { computed, inject } from 'vue';
import type { RsvpField } from '~/composables/useRsvp';

const props = defineProps<{
  field: RsvpField;
  formData: Record<string, any>;
}>();

const fieldErrors = inject<Record<string, string>>('fieldErrors', {});

const errorMsg = computed(() => fieldErrors[props.field.key] || '');

const isInline = computed(() => {
  return !['readonly', 'image', 'checkbox', 'textarea', 'template'].includes(props.field.type);
});

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

.readonly-image {
  max-width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
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
  .rsvp-field--inline {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }

  .field-label {
    min-width: unset;
  }
}
</style>
