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

        <!-- Image -->
        <div class="image-section flex justify-center">
          <SupabaseImage
            bucket="nsfm"
            :path="member.image_path"
            is-public
            :alt="member.display_name"
            max-height="200px"
            classes="person-image"
          >
            <!-- Custom fallback for this usage -->
            <FontAwesomeIcon
              :icon="faUser"
              class="text-gray-400 rounded-full border border-gray-300 p-4"
              :style="{ fontSize: '100px' }"
            />
          </SupabaseImage>
        </div>

      </div>
    </section>

    <p v-if="committee.length === 0" class="text-gray-500 italic">No committee members yet.</p>
  </section>
</template>

<script lang="ts" setup>
import {ref, computed} from 'vue'
import {getCommittee} from '~/composables/useCommittee'
import {useSupabaseImage} from "~/composables/useSupabaseImage";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {faUser} from '@fortawesome/free-solid-svg-icons'

const {getImageUrl} = useSupabaseImage();

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
  "Event Coordinator",
  "IT Officer",
  "Executive Member",
  "Advisory Member"
]

// Sort committee by role order
const sortedCommittee = computed(() => {
  return [...committee.value].sort((a, b) => {
    const roleA = a.role?.trim().toLowerCase() || ''
    const roleB = b.role?.trim().toLowerCase() || ''

    const indexA = roleOrder.findIndex(r => r.toLowerCase() === roleA)
    const indexB = roleOrder.findIndex(r => r.toLowerCase() === roleB)

    const rankA = indexA === -1 ? roleOrder.length : indexA
    const rankB = indexB === -1 ? roleOrder.length : indexB

    return rankA - rankB
  })
})

// Group members by role
const groupedByRole = computed(() => {
  const groups: Record<string, typeof committee.value> = {}
  for (const member of sortedCommittee.value) {
    const role = member.role || "Other"
    if (!groups[role]) groups[role] = []
    groups[role].push(member)
  }
  return groups
})

</script>

