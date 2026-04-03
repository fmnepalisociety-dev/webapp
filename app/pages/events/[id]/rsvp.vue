<template>
  <main class="rsvp-page">
    <div v-if="loading" class="text-center text-gray-500 py-12">Loading...</div>

    <div v-else-if="!rsvpConfig" class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-700 mb-2">RSVP Not Available</h1>
      <p class="text-gray-500">RSVP is not open for this event.</p>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
    </div>

    <div v-else-if="submitted" class="text-center py-12">
      <font-awesome-icon :icon="['fas', 'circle-check']" class="text-green-500 text-5xl mb-4" />
      <h1 class="text-2xl font-bold text-green-700 mb-2">Thank You!</h1>
      <p class="text-gray-600">Your RSVP has been submitted successfully.</p>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
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
import { ref, reactive, nextTick } from 'vue';
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
const fieldErrors = reactive<Record<string, string>>({});
const rsvpConfig = ref<RsvpConfig | null>(null);
const event = ref<any>(null);
const formData = reactive<Record<string, any>>({});

const allEvents = await getEvents();
event.value = allEvents.find((e: any) => e.id === eventId) ?? null;

if (event.value?.rsvp && isRsvpOpen(event.value.rsvp)) {
  rsvpConfig.value = event.value.rsvp as RsvpConfig;

  for (const field of flatFields(rsvpConfig.value.fields)) {
    if (isEditableField(field)) {
      formData[field.key] = field.type === 'checkbox' ? false : '';
    }
  }
}

loading.value = false;

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
    await submitRsvp(eventId, { ...formData });
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
</style>
