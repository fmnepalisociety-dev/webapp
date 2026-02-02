<script setup lang="ts">
import VueQrcode from '@chenfengyuan/vue-qrcode'

withDefaults(
  defineProps<{
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
  }>(),
  {
    size: 100,
    level: 'M',
  }
)
</script>

<template>
  <VueQrcode
    :value="value"
    :options="{
      width: size,
      margin: 1,
      errorCorrectionLevel: level,
      color: {
        dark: '#1c3382',
        light: '#ffffff',
      },
    }"
    tag="svg"
  />
</template>
