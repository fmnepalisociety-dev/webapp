<template>
  <main class="p-6 max-w-5xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">Members</h1>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <!-- Table -->
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-24 py-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              #
            </th>
            <th class="px-24 py-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Membership ID
            </th>
            <th class="px-24 py-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Name
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(m, index) in members"
            :key="m.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-24 py-6 text-center text-sm text-gray-500">
              {{ index + 1 }}
            </td>
            <td class="px-24 py-6 text-center text-sm text-gray-600 font-mono">
              {{ m.membership_id || 'N/A' }}
            </td>
            <td class="px-24 py-6 text-left text-sm text-gray-800 font-medium">
              {{ formatName(m.firstname) }} {{ formatName(m.lastname) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
