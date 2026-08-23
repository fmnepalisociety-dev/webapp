<template>
  <AdminProductForm :product-id="null" />
</template>

<script setup lang="ts">
definePageMeta({layout: 'admin', middleware: 'auth'});
</script>
