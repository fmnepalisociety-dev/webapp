<script setup lang="ts">
import {ref, onMounted, watch, computed} from 'vue'
import {useSupabaseImage} from '~/composables/useSupabaseImage'
import {faImage} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const props = withDefaults(
  defineProps<{
    bucket: string
    path?: string | null
    isPublic?: boolean
    alt?: string
    maxHeight?: string
    classes?: string
  }>(),
  {
    isPublic: false,
    alt: '',
    maxHeight: '200px',
    classes: '',
  }
)

const {getImageUrl} = useSupabaseImage()
const src = ref<string | null>(null)
const loading = ref(true)

const imageClasses = computed(() => ['object-contain', props.classes])

const loadImage = async () => {
  if (!props.path) {
    src.value = null
    loading.value = false
    return
  }

  loading.value = true
  const imageUrl = await getImageUrl({
    bucket: props.bucket,
    path: props.path,
    isPublic: props.isPublic,
  })
  src.value = imageUrl || null
  loading.value = false
}

onMounted(loadImage)
watch(() => props.path, loadImage)
</script>

<template>
  <div class="flex justify-center items-center">
    <!-- Image -->
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="imageClasses"
      :style="{ maxHeight }"
    />

    <!-- Custom fallback slot -->
    <slot v-else>
      <!-- Default fallback if no slot is provided -->
      <FontAwesomeIcon
        :icon="faImage"
        class="text-gray-400 rounded-full border border-gray-300 p-4"
        :style="{ fontSize: '100px' }"
      />
    </slot>
  </div>
</template>
