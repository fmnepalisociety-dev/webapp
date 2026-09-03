<template>
  <div class="iu">
    <label v-if="label" class="field-label">{{ label }}</label>

    <!-- A new file is chosen: pan/zoom to frame before saving -->
    <ImageCropper
      v-if="modelValue"
      ref="cropper"
      :file="modelValue"
      :aspect="aspect"
      :output-width="outputWidth"
    />

    <!-- Otherwise a drop zone showing the current image or a placeholder -->
    <div
      v-else
      :class="['iu-drop', dragOver ? 'iu-drop--drag' : '', contain ? 'iu-drop--contain' : '']"
      :style="{ aspectRatio: dropAspect }"
      role="button"
      tabindex="0"
      @click="fileInput?.click()"
      @keydown.enter.prevent="fileInput?.click()"
      @dragenter.prevent="dragOver = true"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <img v-if="currentUrl" :src="currentUrl" class="iu-preview" :alt="label || 'image'" />
      <div v-else class="iu-placeholder">
        <font-awesome-icon :icon="['fas', dragOver ? 'arrow-down' : 'image']" />
        <span>{{ dragOver ? 'Drop image' : placeholder }}</span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="iu-file"
      @change="onFileChange"
    />
    <button type="button" class="add-btn add-btn--sm" @click="fileInput?.click()">
      <font-awesome-icon :icon="['fas', 'upload']" />
      {{ modelValue || currentUrl ? 'Replace Image' : 'Choose Image' }}
    </button>
    <button
      v-if="modelValue || currentUrl"
      type="button"
      class="iu-clear"
      @click="clear"
    >
      Remove image
    </button>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: File | null; // the pending (newly chosen) file
    currentUrl?: string | null; // existing image URL shown when no new file
    aspect?: number | null; // crop frame ratio; null = natural (no forced crop)
    outputWidth?: number;
    label?: string;
    placeholder?: string;
    accept?: string;
    contain?: boolean; // show existing preview with object-fit: contain
  }>(),
  {
    currentUrl: null,
    aspect: null,
    outputWidth: 1000,
    label: '',
    placeholder: 'Drag & drop or click',
    accept: 'image/*',
    contain: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: File | null): void;
  (e: 'clear'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const cropper = ref<{getResult: () => Promise<File | null>} | null>(null);
const dragOver = ref(false);

// Fixed ratio → box matches it; natural → a pleasant default until a file loads.
const dropAspect = props.aspect ? String(props.aspect) : '3 / 2';

function onFileChange(e: Event) {
  acceptFile((e.target as HTMLInputElement).files?.[0]);
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  acceptFile(e.dataTransfer?.files?.[0]);
}

function acceptFile(file: File | null | undefined) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return;
  emit('update:modelValue', file);
}

function clear() {
  emit('update:modelValue', null);
  emit('clear');
  if (fileInput.value) fileInput.value.value = '';
}

// Called by the parent at save time to get the framed/cropped file.
async function getResult(): Promise<File | null> {
  if (!props.modelValue) return null;
  return (await cropper.value?.getResult()) ?? props.modelValue;
}

defineExpose({getResult});
</script>

<style scoped>
.iu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.iu-drop {
  border: 1px dashed #cbd5e1;
  border-radius: 0.4rem;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.iu-drop:hover {
  border-color: #93c5fd;
  background: #f1f5f9;
}

.iu-drop--drag {
  border-color: #2563eb;
  border-style: solid;
  background: #eff6ff;
}

.iu-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.iu-drop--contain .iu-preview {
  object-fit: contain;
}

.iu-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.5rem;
}

.iu-placeholder svg {
  font-size: 2rem;
}

.iu-file {
  display: none;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}

.add-btn--sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  width: 100%;
  justify-content: center;
}

.iu-clear {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.iu-clear:hover {
  text-decoration: underline;
}
</style>
