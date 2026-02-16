<template>
  <main class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-800">Members</h1>

    <ul class="space-y-3">
      <li
        v-for="m in members"
        :key="m.id"
        class="p-4 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow flex items-center"
      >
        <span class="text-gray-700 font-medium">{{ formatName(m.firstname) }} {{ formatName(m.lastname) }}</span>
      </li>
    </ul>
  </main>
</template>

<script setup>
import {getMembers} from "~/composables/useMembers.js";

const members = await getMembers();

const formatName = (value) => {
  if (!value) return "";

  return value
    .split(/\s+/)
    .map(word => {
      if (!word) return '';

      // If word has any uppercase letters, check if they're intentional
      const hasUppercase = /[A-Z]/.test(word);
      if (hasUppercase) {
        // If all uppercase (like KC, USA), keep it
        if (word === word.toUpperCase()) {
          return word;
        }
        // If has capital letters after the first position (like McDonald, O'Brien, kC), preserve it
        if (word.slice(1) !== word.slice(1).toLowerCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      }

      // Otherwise, capitalize first letter only
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
</script>

<style scoped>
body {
  background-color: #f9fafb;
  font-family: system-ui, sans-serif;
}
</style>
