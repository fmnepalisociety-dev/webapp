<template>
  <AdminProductForm :product-id="productId" />
</template>

<script setup lang="ts">
definePageMeta({layout: 'admin', middleware: 'auth'});

const route = useRoute();
const productId = route.params.id as string;
</script>
