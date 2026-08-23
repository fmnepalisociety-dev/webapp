<template>
  <main class="order-page">
    <div v-if="loading" class="text-center text-gray-500 py-12">Loading...</div>

    <div v-else-if="!orderConfig" class="order-closed">
      <div class="back-link-wrapper">
        <NuxtLink to="/shop" class="back-link">
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Back to Shop
        </NuxtLink>
      </div>
      <h1 class="order-closed-title">Sorry, ordering is not available!</h1>
      <p class="order-closed-message" v-html="closedMessage"></p>
      <div v-if="product" class="order-closed-links">
        <NuxtLink :to="`/shop/${productId}`" class="order-closed-link">
          <font-awesome-icon :icon="['fas', 'circle-info']" />
          View Product Details
        </NuxtLink>
      </div>
    </div>

    <div v-else-if="submitted" class="confirmation" ref="confirmationRef">
      <div class="confirmation-header">
        <h1 class="confirmation-title">Thank You for Your Order!</h1>
        <p class="confirmation-subtitle">
          Your order for <strong>{{ product?.name ?? 'this item' }}</strong> has been received.
        </p>
      </div>

      <!-- Order Details -->
      <div class="confirmation-details">
        <h3 class="confirmation-details-title">Your Order Details</h3>
        <table class="details-table">
          <tr v-for="field in submittedFields" :key="field.key">
            <td class="details-label">{{ field.label }}</td>
            <td class="details-value">{{ field.value }}</td>
          </tr>
        </table>
      </div>

      <!-- Payment reminder with QR -->
      <div v-if="paymentImages.length" class="confirmation-payment">
        <h3 class="confirmation-details-title">Payment</h3>
        <p class="payment-note">
          If you haven't paid yet, please scan the code below to complete your payment.
        </p>
        <div v-for="(img, i) in paymentImages" :key="i" class="payment-image-wrap">
          <span v-if="img.label" class="payment-image-label">{{ img.label }}</span>
          <img :src="img.value" :alt="img.label || 'Payment'" class="payment-image" />
        </div>
      </div>

      <p class="confirmation-closing">A confirmation email is on its way. Thank you for your support!</p>

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
        <NuxtLink to="/shop" class="back-link">
          Back to Shop
        </NuxtLink>
      </div>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="order-header">
        <h1 class="text-2xl font-bold text-blue-800">
          {{ product?.name ?? 'Order' }}
        </h1>
        <p v-if="priceText" class="text-gray-500 text-sm mt-1">{{ priceText }}</p>

        <!-- Product images, so buyers can confirm what they're ordering -->
        <div v-if="allImageUrls.length" class="order-media">
          <ImageCarousel
            v-if="allImageUrls.length > 1"
            :images="allImageUrls"
            :autoplay="false"
            :background="imageBg"
            height="260px"
          />
          <div v-else class="order-media-single" :style="{ background: imageBg }">
            <img :src="allImageUrls[0]" :alt="product?.name || 'Product'" />
          </div>
        </div>

        <NuxtLink
          v-if="product"
          :to="`/shop/${productId}`"
          target="_blank"
          class="product-back-link"
        >
          <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" class="text-xs" />
          View product details
        </NuxtLink>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="order-form">
        <template v-for="(item, idx) in orderConfig.fields" :key="idx">

          <!-- Section -->
          <fieldset v-if="isSection(item)" class="order-fieldset">
            <legend class="order-legend">{{ item.section }}</legend>
            <div class="order-fieldset-fields">
              <template v-for="field in item.fields" :key="field.key">
                <RsvpFieldRenderer :field="field" :form-data="formData" />
              </template>
            </div>
          </fieldset>

          <!-- Top-level field -->
          <RsvpFieldRenderer v-else :field="item" :form-data="formData" />

        </template>

        <div v-if="errorMsg" class="order-error" ref="errorRef">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
          <span>{{ errorMsg }}</span>
        </div>

        <button type="submit" :disabled="submitting" class="order-submit">
          <font-awesome-icon v-if="submitting" :icon="['fas', 'spinner']" spin />
          {{ submitting ? 'Submitting...' : 'Place Order' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import {
  flatFields,
  isEditableField,
  isSection,
  isRsvpOpen,
  isBeforeStart,
  emptyLineItemRow,
  formatLineItems,
} from '~/composables/useRsvp';
import { getProduct, submitOrder, DEFAULT_PRODUCT_BG, type OrderFormConfig } from '~/composables/useProducts';
import { NeSFM_GENERIC_BUCKET } from '~/composables/useSupabaseImage';
import RsvpFieldRenderer from '~/components/RsvpFieldRenderer.vue';

const route = useRoute();
const productId = route.params.id as string;
const { getPublicImageUrl } = useSupabaseImage();

const loading = ref(true);
const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref('');
const errorRef = ref<HTMLElement | null>(null);
const confirmationRef = ref<HTMLElement | null>(null);
const fieldErrors = reactive<Record<string, string>>({});
const orderConfig = ref<OrderFormConfig | null>(null);
const product = ref<any>(null);
const formData = reactive<Record<string, any>>({});
const submittedData = ref<Record<string, any>>({});

onMounted(async () => {
  product.value = await getProduct(productId);

  const orderData = product.value?.order_form as OrderFormConfig | null;
  const overrideKey = route.query.key as string | undefined;
  const hasValidOverride = !!(
    overrideKey &&
    orderData?.override_key &&
    overrideKey === orderData.override_key
  );

  // Override bypasses active + close_date, but start_date is still enforced
  const orderAllowed =
    orderData && (isRsvpOpen(orderData) || (hasValidOverride && !isBeforeStart(orderData)));

  if (orderAllowed) {
    orderConfig.value = orderData;
    for (const field of flatFields(orderConfig.value.fields)) {
      if (isEditableField(field)) {
        if (field.type === 'lineitems') formData[field.key] = [emptyLineItemRow(field)];
        else formData[field.key] = field.type === 'checkbox' ? false : '';
      }
    }
  }

  loading.value = false;
});

const closedMessage = computed(() => {
  const orderData = product.value?.order_form as OrderFormConfig | null;
  return (
    orderData?.closed_message ||
    'Ordering is not available for this item at this time. For inquiries, please contact <a href="mailto:fmnepalisociety@gmail.com">fmnepalisociety@gmail.com</a>.'
  );
});

const priceText = computed(() => {
  const p = product.value?.price;
  if (p === null || p === undefined || p === '') return '';
  const num = Number(p);
  if (isNaN(num)) return String(p);
  return `$${num.toFixed(2)}`;
});

const imageBg = computed(() => product.value?.image_bg || DEFAULT_PRODUCT_BG);

const allImageUrls = computed(() => {
  const imgs = product.value?.image as string[] | null | undefined;
  if (!imgs?.length) return [];
  return imgs
    .map((path) => getPublicImageUrl(NeSFM_GENERIC_BUCKET, path))
    .filter((url): url is string => !!url);
});

const submittedFields = computed(() => {
  if (!orderConfig.value) return [];
  return flatFields(orderConfig.value.fields)
    .filter(isEditableField)
    .map((f) => {
      let value: any;
      if (f.type === 'lineitems') value = formatLineItems(submittedData.value[f.key], f.item_fields);
      else if (f.type === 'checkbox') value = submittedData.value[f.key] ? 'Yes' : 'No';
      else value = submittedData.value[f.key];
      return { key: f.key, label: f.label, value };
    })
    .filter((f) => f.value !== undefined && f.value !== '' && f.value !== null);
});

// Image-type fields (e.g. payment QR) carried over to the confirmation
const paymentImages = computed(() => {
  if (!orderConfig.value) return [];
  return flatFields(orderConfig.value.fields)
    .filter((f) => f.type === 'image' && !!f.value)
    .map((f) => ({ label: f.label, value: f.value as string }));
});

function printConfirmation() {
  window.print();
}

function validate(): boolean {
  if (!orderConfig.value) return false;
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];

  const fields = flatFields(orderConfig.value.fields).filter(isEditableField);
  let valid = true;

  for (const field of fields) {
    // Line items: need at least one row with every column filled (qty > 0).
    if (field.type === 'lineitems') {
      const rows = Array.isArray(formData[field.key]) ? formData[field.key] : [];
      const complete = rows.filter((r: Record<string, any>) =>
        (field.item_fields ?? []).every((sf) => {
          const v = r[sf.key];
          if (v === '' || v === undefined || v === null) return false;
          if (sf.type === 'number' && !(parseFloat(v) > 0)) return false;
          return true;
        })
      );
      if ((field.required || true) && complete.length === 0) {
        fieldErrors[field.key] = 'Please add at least one item with color, size and quantity.';
        valid = false;
      }
      continue;
    }

    const isRequired =
      field.required ||
      (field.required_if && formData[field.required_if.field] === field.required_if.value);
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
  const firstErrorKey = Object.keys(fieldErrors)[0];
  if (firstErrorKey) {
    const el = document.getElementById(firstErrorKey);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus();
    return;
  }
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
    const snapshot: Record<string, any> = { ...formData };
    // Drop blank/incomplete line-item rows so only real selections are stored.
    for (const field of flatFields(orderConfig.value!.fields)) {
      if (field.type === 'lineitems' && Array.isArray(snapshot[field.key])) {
        snapshot[field.key] = snapshot[field.key]
          .filter((r: Record<string, any>) =>
            (field.item_fields ?? []).every((sf) => r[sf.key] !== '' && r[sf.key] != null)
          )
          .map((r: Record<string, any>) => ({ ...r }));
      }
    }
    await submitOrder(product.value?.id ?? productId, snapshot);
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
.order-page {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.order-media {
  margin: 0.85rem 0;
}

.order-media-single {
  border-radius: 0.75rem;
  overflow: hidden;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-media-single img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.order-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.product-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #2563eb;
  text-decoration: none;
}

.product-back-link:hover {
  text-decoration: underline;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  min-width: 0;
  overflow: hidden;
}

.order-legend {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e3a5f;
  padding: 0 0.5rem;
}

.order-fieldset-fields {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.order-submit {
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

.order-submit:hover:not(:disabled) {
  background-color: #002080;
}

.order-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.order-error {
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

/* Order Closed styles */
.order-closed {
  text-align: center;
  padding: 0 1rem 1.5rem;
}

.order-closed-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.75rem;
}

.order-closed-message {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 28rem;
  margin: 0 auto;
}

.order-closed-message :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.order-closed-message :deep(a:hover) {
  text-decoration: underline;
}

.order-closed-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.order-closed-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
}

.order-closed-link:hover {
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

.confirmation-payment {
  margin-bottom: 1.5rem;
  text-align: center;
}

.payment-note {
  color: #4b5563;
  font-size: 0.9rem;
  margin: 0 0 0.75rem;
}

.payment-image-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.payment-image-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.payment-image {
  max-width: 220px;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.confirmation-closing {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0 0 1.5rem;
  text-align: center;
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

@media print {
  .no-print {
    display: none !important;
  }

  .order-page {
    max-width: 100%;
    padding: 0;
  }

  .confirmation {
    padding: 0;
  }
}
</style>
