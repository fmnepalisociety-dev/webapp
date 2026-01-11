<template>
  <div>
    <h2 class="text-3xl font-bold text-blue-800 mb-6">Our Committee</h2>
  </div>
  <section id="committee" class="contacts max-w-4xl mx-auto p-6 space-y-6">
    <section>
      <div v-for="member in sortedCommittee" :key="member.id"
           class="contact-card">

        <!-- Name -->
        <h3 class="text-xl font-semibold text-gray-800">
          {{ member.display_name }}
        </h3>

        <!-- Role -->
        <p class="text-gray-600 mt-1">Role: {{ member.role }}</p>

        <!-- Image if available -->
        <img
          v-if="member.image_path"
          :src="member.image_path"
          alt="Member Image"
          class="mx-auto w-24 h-24 object-cover rounded-full mb-4 shadow-sm"
        />
      </div>
    </section>

    <p v-if="committee.length === 0" class="text-gray-500 italic">No committee members yet.</p>
  </section>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {getCommittee} from '~/composables/useCommittee'

// Fetch committee members
const committee = ref([])
committee.value = await getCommittee()

// Custom role order
const roleOrder = [
  "President",
  "Vice President",
  "General Secretary",
  "Secretary",
  "Treasurer",
  "Joint-Treasurer",
  "IT Officer",
  "Event Coordinator",
  "Executive Member",
  "Advisory Member"
]

// Sort the committee according to roleOrder
const sortedCommittee = computed(() => {
  return [...committee.value].sort((a, b) => {
    const indexA = roleOrder.indexOf(a.role)
    const indexB = roleOrder.indexOf(b.role)

    // Roles not in list will go to the end
    const rankA = indexA === -1 ? roleOrder.length : indexA
    const rankB = indexB === -1 ? roleOrder.length : indexB

    return rankA - rankB
  })
})
</script>

