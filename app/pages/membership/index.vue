<template>
  <main class="membership-page">
    <div v-if="submitted" class="confirmation">
      <h1 class="confirmation-title">Thank You!</h1>
      <p class="confirmation-subtitle">
        Your membership application has been received. Our team will review it and follow up
        by email. Please keep your payment confirmation for your records.
      </p>
      <div class="confirmation-details">
        <table class="details-table">
          <tr v-for="field in submittedFields" :key="field.key">
            <td class="details-label">{{ field.label }}</td>
            <td class="details-value">{{ field.value }}</td>
          </tr>
        </table>
      </div>
      <NuxtLink to="/" class="back-link">Back to Home</NuxtLink>
    </div>

    <div v-else>
      <div class="membership-header">
        <h1 class="membership-title">
          <font-awesome-icon :icon="['fas', 'user-plus']" />
          Become a Member
        </h1>
        <p class="membership-sub">
          Join the Nepali Society of Fargo-Moorhead. Fill in your details below, add family
          members if you like, and enter your payment information.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" novalidate class="rsvp-form">
        <template v-for="(item, idx) in config.fields" :key="idx">
          <fieldset v-if="isSection(item)" class="rsvp-fieldset">
            <legend class="rsvp-legend">{{ item.section }}</legend>
            <div class="rsvp-fieldset-fields">
              <RsvpFieldRenderer
                v-for="field in item.fields"
                :key="field.key"
                :field="field"
                :form-data="formData"
              />
            </div>
          </fieldset>
          <RsvpFieldRenderer v-else :field="item" :form-data="formData" />
        </template>

        <div v-if="errorMsg" class="rsvp-error" ref="errorRef">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
          <span>{{ errorMsg }}</span>
        </div>

        <button type="submit" :disabled="submitting" class="rsvp-submit">
          <font-awesome-icon v-if="submitting" :icon="['fas', 'spinner']" spin />
          {{ submitting ? 'Submitting…' : 'Submit Application' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import {ref, reactive, computed, nextTick, provide} from 'vue';
import {flatFields, isEditableField, isSection} from '~/composables/useRsvp';
import {getMembershipForm, submitApplication} from '~/composables/useMembership';
import RsvpFieldRenderer from '~/components/RsvpFieldRenderer.vue';

useHead({title: 'Become a Member — Nepali Society of Fargo-Moorhead'});

const config = await getMembershipForm();

const submitting = ref(false);
const submitted = ref(false);
const errorMsg = ref('');
const errorRef = ref<HTMLElement | null>(null);
const fieldErrors = reactive<Record<string, string>>({});
const formData = reactive<Record<string, any>>({});
const submittedData = ref<Record<string, any>>({});

for (const field of flatFields(config.fields)) {
  if (isEditableField(field)) {
    formData[field.key] = field.type === 'checkbox' ? false : '';
  }
}

const submittedFields = computed(() =>
  flatFields(config.fields)
    .filter(isEditableField)
    .filter((f) => f.type !== 'lineitems')
    .filter((f) => {
      const v = submittedData.value[f.key];
      return v !== undefined && v !== '' && v !== null;
    })
    .map((f) => ({key: f.key, label: f.label, value: submittedData.value[f.key]}))
);

function validate(): boolean {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];
  const fields = flatFields(config.fields).filter(isEditableField);
  let valid = true;

  for (const field of fields) {
    const required =
      field.required ||
      (field.required_if && formData[field.required_if.field] === field.required_if.value);
    if (!required) continue;
    const val = formData[field.key];
    if (val === '' || val === undefined || val === null) {
      fieldErrors[field.key] = `${field.label} is required`;
      valid = false;
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      fieldErrors[field.key] = 'Please enter a valid email address';
      valid = false;
    } else if (field.type === 'number' && parseFloat(val) < 0) {
      fieldErrors[field.key] = `${field.label} cannot be negative`;
      valid = false;
    }
  }
  return valid;
}

async function scrollToError() {
  await nextTick();
  const firstErrorKey = Object.keys(fieldErrors)[0];
  const el = firstErrorKey ? document.getElementById(firstErrorKey) : null;
  (el ?? errorRef.value)?.scrollIntoView({behavior: 'smooth', block: 'center'});
  el?.focus();
}

async function handleSubmit() {
  errorMsg.value = '';
  if (!validate()) {
    errorMsg.value = 'Please fill in all required fields.';
    await scrollToError();
    return;
  }
  submitting.value = true;
  try {
    const snapshot = {...formData};
    await submitApplication(snapshot);
    submittedData.value = snapshot;
    submitted.value = true;
    window.scrollTo({top: 0, behavior: 'smooth'});
  } catch (e: any) {
    errorMsg.value = e.message || 'Something went wrong. Please try again.';
    await scrollToError();
  } finally {
    submitting.value = false;
  }
}

provide('fieldErrors', fieldErrors);
</script>

<style scoped>
.membership-page {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.membership-header {
  margin-bottom: 1.5rem;
}

.membership-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.6rem;
  font-weight: 800;
  color: #1c3382;
  margin: 0 0 0.5rem;
}

.membership-sub {
  margin: 0;
  color: #555;
  line-height: 1.6;
}

.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rsvp-fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 0.6rem;
  padding: 1.1rem 1.25rem 1.25rem;
  margin: 0;
}

.rsvp-legend {
  font-weight: 700;
  color: #1c3382;
  padding: 0 0.5rem;
  font-size: 0.95rem;
}

.rsvp-fieldset-fields {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.rsvp-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 600;
}

.rsvp-submit {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.6rem;
  background: #0033a0;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.rsvp-submit:hover:not(:disabled) {
  background: #002080;
}

.rsvp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirmation */
.confirmation {
  text-align: center;
  padding: 1rem 0;
}

.confirmation-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #15803d;
  margin: 0 0 0.5rem;
}

.confirmation-subtitle {
  color: #444;
  line-height: 1.6;
  max-width: 34rem;
  margin: 0 auto 1.5rem;
}

.confirmation-details {
  max-width: 32rem;
  margin: 0 auto 1.5rem;
  text-align: left;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #eee;
  font-size: 0.92rem;
}

.details-label {
  color: #6b7280;
  width: 45%;
}

.details-value {
  color: #1e293b;
  font-weight: 600;
}

.back-link {
  display: inline-block;
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
