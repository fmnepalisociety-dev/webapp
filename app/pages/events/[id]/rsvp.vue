<template>
  <main class="rsvp-page">
    <div v-if="loading" class="text-center text-gray-500 py-12">Loading...</div>

    <div v-else-if="!rsvpConfig" class="rsvp-closed">
      <div class="back-link-wrapper">
        <NuxtLink to="/events" class="back-link">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Back to All Events
        </NuxtLink>
      </div>
      <h1 class="rsvp-closed-title">RSVP Closed</h1>
      <p class="rsvp-closed-message" v-html="closedMessage"></p>
      <div v-if="event" class="rsvp-closed-links">
        <NuxtLink :to="`/events/${eventId}`" class="rsvp-closed-link">
          <font-awesome-icon :icon="['fas', 'circle-info']" />
          View Event Details
        </NuxtLink>
      </div>
    </div>

    <div v-else-if="submitted" class="confirmation" ref="confirmationRef">
      <div class="confirmation-header">
        <h1 class="confirmation-title">Thank You!</h1>
        <p class="confirmation-subtitle">
          You have successfully registered for <strong>{{ event?.heading ?? 'the event' }}</strong>.
        </p>
      </div>

      <!-- Event Details -->
      <div v-if="event" class="confirmation-event">
        <table class="event-info-table">
          <tr v-if="event.event_date">
            <td class="event-info-label">Date</td>
            <td class="event-info-value">{{ event.event_date }}</td>
          </tr>
          <tr v-if="event.event_time">
            <td class="event-info-label">Time</td>
            <td class="event-info-value">{{ event.event_time }}</td>
          </tr>
          <tr v-if="event.event_location">
            <td class="event-info-label">Location</td>
            <td class="event-info-value">{{ parseLocation(event.event_location).text }}</td>
          </tr>
        </table>
      </div>

      <!-- RSVP Details -->
      <div class="confirmation-details">
        <h3 class="confirmation-details-title">Your RSVP Details</h3>
        <table class="details-table">
          <tr v-for="field in submittedFields" :key="field.key">
            <td class="details-label">{{ field.label }}</td>
            <td class="details-value">{{ field.value }}</td>
          </tr>
        </table>
      </div>

      <p class="confirmation-closing">We look forward to seeing you!</p>

      <!-- Print / Screenshot prompt -->
      <div class="confirmation-actions no-print">
        <p class="save-hint">
          <font-awesome-icon :icon="['fas', 'camera']" />
          Please print or take a screenshot of this confirmation for your records.
        </p>
        <button class="print-btn" @click="printConfirmation">
          <font-awesome-icon :icon="['fas', 'print']" />
          Print Confirmation
        </button>
        <NuxtLink to="/events" class="back-link">
          Back to Events
        </NuxtLink>
      </div>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="rsvp-header">
        <h1 class="text-2xl font-bold text-blue-800">
          {{ event?.heading ?? 'Event RSVP' }}
        </h1>
        <p v-if="event" class="text-gray-500 text-sm mt-1">{{ event.event_date }}</p>
        <NuxtLink
          v-if="event"
          :to="`/events/${eventId}`"
          target="_blank"
          class="event-back-link"
        >
          <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" class="text-xs" />
          View event details
        </NuxtLink>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="rsvp-form">
        <template v-for="(item, idx) in rsvpConfig.fields" :key="idx">

          <!-- Section -->
          <fieldset v-if="isSection(item)" class="rsvp-fieldset">
            <legend class="rsvp-legend">{{ item.section }}</legend>
            <div class="rsvp-fieldset-fields">
              <template v-for="field in item.fields" :key="field.key">
                <RsvpFieldRenderer :field="field" :form-data="formData" />
              </template>
            </div>
          </fieldset>

          <!-- Top-level field -->
          <RsvpFieldRenderer v-else :field="item" :form-data="formData" />

        </template>

        <div v-if="errorMsg" class="rsvp-error" ref="errorRef">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
          <span>{{ errorMsg }}</span>
        </div>

        <button type="submit" :disabled="submitting" class="rsvp-submit">
          <font-awesome-icon v-if="submitting" :icon="['fas', 'spinner']" spin />
          {{ submitting ? 'Submitting...' : 'Submit RSVP' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import {
  submitRsvp,
  flatFields,
  isEditableField,
  isSection,
  isRsvpOpen,
  type RsvpConfig,
} from '~/composables/useRsvp';
import { getEvents } from '~/composables/useEvents';
import RsvpFieldRenderer from '~/components/RsvpFieldRenderer.vue';

const route = useRoute();
const eventId = route.params.id as string;

const loading = ref(true);
const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref('');
const errorRef = ref<HTMLElement | null>(null);
const confirmationRef = ref<HTMLElement | null>(null);
const fieldErrors = reactive<Record<string, string>>({});
const rsvpConfig = ref<RsvpConfig | null>(null);
const event = ref<any>(null);
const formData = reactive<Record<string, any>>({});
const submittedData = ref<Record<string, any>>({});

const allEvents = await getEvents();
event.value = allEvents.find((e: any) => e.id === eventId) ?? null;

const rsvpData = event.value?.rsvp as RsvpConfig | null;

const closedMessage = computed(() => {
  return rsvpData?.closed_message
    || 'RSVP is not available for this event at this time. For inquiries, please contact <a href="mailto:fmnepalisociety@gmail.com">fmnepalisociety@gmail.com</a>.';
});

if (rsvpData && isRsvpOpen(rsvpData)) {
  rsvpConfig.value = rsvpData;

  for (const field of flatFields(rsvpConfig.value.fields)) {
    if (isEditableField(field)) {
      formData[field.key] = field.type === 'checkbox' ? false : '';
    }
  }
}

loading.value = false;

function parseLocation(loc: string) {
  const match = loc.match(/^(.*?)\s*\[(.+)]$/);
  return { text: match ? match[1].trim() : loc, url: match ? match[2].trim() : null };
}

const submittedFields = computed(() => {
  if (!rsvpConfig.value) return [];
  return flatFields(rsvpConfig.value.fields)
    .filter(isEditableField)
    .filter((f) => {
      const val = submittedData.value[f.key];
      return val !== undefined && val !== '' && val !== null;
    })
    .map((f) => ({
      key: f.key,
      label: f.label,
      value: f.type === 'checkbox' ? (submittedData.value[f.key] ? 'Yes' : 'No') : submittedData.value[f.key],
    }));
});

function printConfirmation() {
  window.print();
}

function validate(): boolean {
  if (!rsvpConfig.value) return false;
  // Clear previous errors
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];

  const fields = flatFields(rsvpConfig.value.fields).filter(isEditableField);
  let valid = true;

  for (const field of fields) {
    const isRequired = field.required
      || (field.required_if && formData[field.required_if.field] === field.required_if.value);
    if (!isRequired) continue;
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
  // Try to scroll to first field error
  const firstErrorKey = Object.keys(fieldErrors)[0];
  if (firstErrorKey) {
    const el = document.getElementById(firstErrorKey);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus();
    return;
  }
  // Fallback to general error box
  errorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const snapshot = { ...formData };
    await submitRsvp(eventId, snapshot);
    submittedData.value = snapshot;
    submitted.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
.rsvp-page {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.rsvp-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.event-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #2563eb;
  text-decoration: none;
}

.event-back-link:hover {
  text-decoration: underline;
}

.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rsvp-fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  min-width: 0;
  overflow: hidden;
}

.rsvp-legend {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e3a5f;
  padding: 0 0.5rem;
}

.rsvp-fieldset-fields {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.rsvp-submit {
  width: 100%;
  padding: 0.75rem;
  background-color: #0033a0;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.rsvp-submit:hover:not(:disabled) {
  background-color: #002080;
}

.rsvp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rsvp-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 500;
}

.back-link-wrapper {
  margin-bottom: 1.5rem;
  text-align: left;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  background: #eff6ff;
  transition: all 0.15s;
}

.back-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.back-link:active {
  background: #bfdbfe;
}

/* RSVP Closed styles */
.rsvp-closed {
  text-align: center;
  padding: 0 1rem 1.5rem;
}

.rsvp-closed-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
}

.rsvp-closed-message {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 28rem;
  margin: 0 auto;
}

.rsvp-closed-message :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.rsvp-closed-message :deep(a:hover) {
  text-decoration: underline;
}

.rsvp-closed-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.rsvp-closed-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
}

.rsvp-closed-link:hover {
  text-decoration: underline;
}

/* Confirmation styles */
.confirmation {
  padding: 1.5rem 0;
}

.confirmation-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.confirmation-icon {
  font-size: 3rem;
  color: #22c55e;
  margin-bottom: 0.75rem;
}

.confirmation-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #15803d;
  margin: 0 0 0.5rem;
}

.confirmation-subtitle {
  color: #374151;
  font-size: 1rem;
  margin: 0;
}

.confirmation-event {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.event-info-table {
  border-collapse: collapse;
}

.event-info-label {
  padding: 0.35rem 0;
  color: #6b7280;
  font-size: 0.9rem;
  width: 5rem;
}

.event-info-value {
  padding: 0.35rem 0;
  color: #1e3a5f;
  font-size: 0.9rem;
  font-weight: 600;
}

.confirmation-details {
  margin-bottom: 1.5rem;
}

.confirmation-details-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.5rem;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.details-label {
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  width: 40%;
  font-size: 0.9rem;
}

.details-value {
  padding: 0.5rem 0.75rem;
  color: #1e3a5f;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.confirmation-closing {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0 0 1.5rem;
}

.confirmation-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.save-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}

.print-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background-color: #0033a0;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.print-btn:hover {
  background-color: #002080;
}

.back-link {
  color: #2563eb;
  font-size: 0.9rem;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

@media print {
  .no-print {
    display: none !important;
  }

  .rsvp-page {
    max-width: 100%;
    padding: 0;
  }

  .confirmation {
    padding: 0;
  }
}
</style>
