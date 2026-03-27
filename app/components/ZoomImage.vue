<template>
  <div class="zoom-image-wrap">
    <slot>
      <img :src="src" :alt="alt" :class="imgClass" />
    </slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string
    alt?: string
    imgClass?: string
  }>(),
  {
    src: '',
    alt: '',
    imgClass: '',
  }
)
</script>

<style scoped>
.zoom-image-wrap {
  overflow: hidden;
  border-radius: 25px;
}

.zoom-image-wrap :deep(img) {
  display: block;
  width: 100%;
  transition: transform 0.5s ease;
}

.zoom-image-wrap :deep(img:hover) {
  transform: scale(1.05);
}
</style>
