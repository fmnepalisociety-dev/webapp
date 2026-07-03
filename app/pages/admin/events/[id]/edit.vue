<template>
  <AdminEventForm :event-id="eventId" />
</template>

<script setup lang="ts">
definePageMeta({layout: 'admin', middleware: 'auth'});

const route = useRoute();
const eventId = route.params.id as string;
</script>
