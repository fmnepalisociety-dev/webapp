<template>
  <AdminBannerForm :banner-id="null" />
</template>

<script setup lang="ts">
definePageMeta({layout: 'admin', middleware: 'auth'});
</script>
