<template>
  <main class="p-6 max-w-2xl mx-auto">
    <div v-if="loading" class="text-center text-gray-500 py-12">Loading...</div>

    <div v-else-if="!config" class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-700 mb-2">RSVP Not Available</h1>
      <p class="text-gray-500">RSVP is not open for this event.</p>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
    </div>

    <div v-else-if="submitted" class="text-center py-12">
      <div class="text-green-600 text-5xl mb-4">&#10003;</div>
      <h1 class="text-2xl font-bold text-green-700 mb-2">Thank You!</h1>
      <p class="text-gray-600">Your RSVP has been submitted successfully.</p>
      <NuxtLink to="/events" class="text-blue-600 hover:underline mt-4 inline-block">
        Back to Events
      </NuxtLink>
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold text-blue-800 mb-1">
        {{ event?.heading ?? 'Event RSVP' }}
      </h1>
      <p v-if="event" class="text-gray-500 mb-6">{{ event.event_date }}</p>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div v-for="field in config.fields" :key="field.key">
          <label :for="field.key" class="block font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>

          <!-- Text / Email / Tel / Number -->
          <input
            v-if="['text', 'email', 'tel', 'number'].includes(field.type)"
            :id="field.key"
            :type="field.type"
            v-model="formData[field.key]"
            :required="field.required"
            class="rsvp-input"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :id="field.key"
            v-model="formData[field.key]"
            :required="field.required"
            rows="3"
            class="rsvp-input"
          ></textarea>

          <!-- Select -->
          <select
            v-else-if="field.type === 'select'"
            :id="field.key"
            v-model="formData[field.key]"
            :required="field.required"
            class="rsvp-input"
          >
            <option value="" disabled>Select...</option>
            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <!-- Checkbox -->
          <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
            <input
              :id="field.key"
              type="checkbox"
              v-model="formData[field.key]"
              class="w-4 h-4"
            />
            <label :for="field.key" class="text-gray-700">{{ field.label }}</label>
          </div>
        </div>

        <p v-if="errorMsg" class="text-red-600 text-sm">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="rsvp-submit"
        >
          {{ submitting ? 'Submitting...' : 'Submit RSVP' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { getRsvpConfig, submitRsvp } from '~/composables/useRsvp';
import { getEvents } from '~/composables/useEvents';

const route = useRoute();
const eventId = route.params.id as string;

const loading = ref(true);
const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref('');
const config = ref<Awaited<ReturnType<typeof getRsvpConfig>>>(null);
const event = ref<any>(null);
const formData = reactive<Record<string, any>>({});

// Fetch config and event info in parallel
const [rsvpConfig, allEvents] = await Promise.all([getRsvpConfig(eventId), getEvents()]);

config.value = rsvpConfig;
event.value = allEvents.find((e: any) => e.id === eventId) ?? null;

// Initialize form data with empty values
if (config.value) {
  for (const field of config.value.fields) {
    formData[field.key] = field.type === 'checkbox' ? false : '';
  }
}

loading.value = false;

async function handleSubmit() {
  submitting.value = true;
  errorMsg.value = '';
  try {
    await submitRsvp(eventId, { ...formData });
    submitted.value = true;
  } catch (e: any) {
    errorMsg.value = e.message || 'Something went wrong.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.rsvp-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.15s;
}

.rsvp-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
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
}

.rsvp-submit:hover:not(:disabled) {
  background-color: #002080;
}

.rsvp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
