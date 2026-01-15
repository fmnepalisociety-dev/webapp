<script setup lang="ts">
import {computed} from "vue";

interface Props {
  start: string; // ISO date string
  end: string;   // ISO date string
  timezone?: string; // optional (default = local)
}

const props = defineProps<Props>();

function getNow(tz?: string) {
  if (!tz) return new Date();
  return new Date(
    new Date().toLocaleString("en-US", {timeZone: tz})
  );
}

const show = computed(() => {
  const now = getNow(props.timezone);
  const start = new Date(props.start);
  const end = new Date(props.end);

  return now >= start && now <= end;
});
</script>

<template>
  <slot v-if="show"/>
</template>
