<script setup lang="ts">
import type {Member} from '~/types/member'
import {getMembersForCards, getMembershipType} from '~/composables/useMemberCards'
import {faPrint, faFilter} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'

const members = ref<Member[]>([])
const selectedMemberIds = ref<Set<number>>(new Set())
const filterType = ref<string>('all')

onMounted(async () => {
  members.value = await getMembersForCards()
  // Select all members by default
  members.value.forEach((m) => selectedMemberIds.value.add(m.id))
})

const membershipTypes = computed(() => {
  const types = new Set<string>()
  members.value.forEach((m) => types.add(getMembershipType(m)))
  return ['all', ...Array.from(types).sort()]
})

const filteredMembers = computed(() => {
  if (filterType.value === 'all') return members.value
  return members.value.filter((m) => getMembershipType(m) === filterType.value)
})

const selectedMembers = computed(() => {
  return filteredMembers.value.filter((m) => selectedMemberIds.value.has(m.id))
})

const allSelected = computed(() => {
  return filteredMembers.value.every((m) => selectedMemberIds.value.has(m.id))
})

function toggleMember(id: number) {
  if (selectedMemberIds.value.has(id)) {
    selectedMemberIds.value.delete(id)
  } else {
    selectedMemberIds.value.add(id)
  }
}

function toggleAll() {
  if (allSelected.value) {
    filteredMembers.value.forEach((m) => selectedMemberIds.value.delete(m.id))
  } else {
    filteredMembers.value.forEach((m) => selectedMemberIds.value.add(m.id))
  }
}

function printCards() {
  window.print()
}
</script>

<template>
  <main class="id-cards-page">
    <!-- Controls (hidden when printing) -->
    <div class="controls no-print">
      <h1 class="text-2xl font-bold text-gray-800">Member ID Cards</h1>

      <div class="controls__row">
        <!-- Filter -->
        <div class="controls__filter">
          <FontAwesomeIcon :icon="faFilter" class="text-gray-500" />
          <select v-model="filterType" class="controls__select">
            <option v-for="type in membershipTypes" :key="type" :value="type">
              {{ type === 'all' ? 'All Types' : type }}
            </option>
          </select>
        </div>

        <!-- Select All -->
        <label class="controls__checkbox">
          <input
            type="checkbox"
            :checked="allSelected"
            @change="toggleAll"
          />
          <span>Select All ({{ filteredMembers.length }})</span>
        </label>

        <!-- Print Button -->
        <button
          class="controls__print-btn"
          :disabled="selectedMembers.length === 0"
          @click="printCards"
        >
          <FontAwesomeIcon :icon="faPrint" />
          <span>Print {{ selectedMembers.length }} Card(s)</span>
        </button>
      </div>

      <!-- Member Selection List -->
      <div class="controls__members">
        <label
          v-for="member in filteredMembers"
          :key="member.id"
          class="controls__member-item"
        >
          <input
            type="checkbox"
            :checked="selectedMemberIds.has(member.id)"
            @change="toggleMember(member.id)"
          />
          <span>{{ member.firstname }} {{ member.lastname }}</span>
          <span class="text-gray-400 text-sm ml-2">({{ getMembershipType(member) }})</span>
        </label>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="cards-grid">
      <MemberIdCard
        v-for="member in selectedMembers"
        :key="member.id"
        :member="member"
      />
    </div>

    <!-- Empty State -->
    <div v-if="selectedMembers.length === 0" class="empty-state no-print">
      <p class="text-gray-500">No members selected. Select members above to generate ID cards.</p>
    </div>
  </main>
</template>

<style scoped>
.id-cards-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 24px;
}

.controls__row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.controls__filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls__select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.controls__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.controls__print-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1c3382;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.controls__print-btn:hover:not(:disabled) {
  background: #152766;
}

.controls__print-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.controls__members {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.controls__member-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.controls__member-item:hover {
  border-color: #1c3382;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(337.5px, 1fr));
  gap: 24px;
  justify-items: center;
}

.empty-state {
  text-align: center;
  padding: 48px;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .id-cards-page {
    padding: 0;
    max-width: none;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 337.5px);
    gap: 16px;
    justify-content: center;
  }
}
</style>
