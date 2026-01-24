<template>
  <div class="committee-wrapper">

    <h2 class="text-3xl font-bold text-blue-800 mb-8 text-center">
      Our Committee
    </h2>

    <section class="contacts-committee">

      <div
        v-for="member in sortedCommittee"
        :key="member.id"
        class="contact-card-executive"
      >

        <!-- Role -->
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ member.role }}
          </h3>
        </div>

        <!-- Member Image -->
        <div class="person-section flex justify-center">
          <SupabaseImage
            bucket="nsfm"
            :path="member.image_path"
            is-public
            :alt="member.display_name"
            max-height="200px"
            classes="person-image"
          >
            <FontAwesomeIcon
              :icon="faUser"
              class="text-gray-400 rounded-full border border-gray-300 p-4"
              :style="{ fontSize: '80px' }"
            />
          </SupabaseImage>
        </div>

        <!-- Name -->
        <div class="text-center">
          <h4>
            {{ member.display_name }}
          </h4>
        </div>

      </div>

    </section>
  </div>
</template>


<script lang="ts" setup>
import {ref, computed} from 'vue'
import {getCommittee} from '~/composables/useCommittee'
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {faUser} from '@fortawesome/free-solid-svg-icons'

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

<style scoped>
.committee-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.contacts-committee {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
}

.contact-card-executive {
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5px;
  margin: 10px 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.contact-card-executive .person-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 25px;
  margin-bottom: 10px;
}

</style>