<template>
  <AdminBannerForm :banner-id="bannerId" />
</template>

<script setup lang="ts">
definePageMeta({layout: 'admin', middleware: 'auth'});

const route = useRoute();
const bannerId = route.params.id as string;
</script>
