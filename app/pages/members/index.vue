<template>
  <main class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-800">Members</h1>

    <ul class="space-y-3">
      <li
        v-for="m in members"
        :key="m.id"
        class="p-4 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow flex items-center"
      >
        <span class="text-gray-700 font-medium">{{ m.firstname }} {{ m.lastname }}</span>
      </li>
    </ul>
  </main>
</template>

<script setup>
import {getMembers} from "~/composables/useMembers.js";

const members = await getMembers();
</script>

<style scoped>
body {
  background-color: #f9fafb;
  font-family: system-ui, sans-serif;
}
</style>
