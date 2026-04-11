<template>
  <main class="members-page">
    <div class="members-header">
      <h1 class="members-title">Members</h1>
      <span class="members-count">{{ filteredMembers.length }} members</span>
    </div>

    <div class="members-search">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
      <input
        v-model="search"
        type="text"
        placeholder="Search members..."
        class="search-input"
      />
      <button v-if="search" class="search-clear" @click="search = ''">
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
    </div>

    <div class="members-table-wrap">
      <table class="members-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-id">Membership ID</th>
            <th class="col-name">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, index) in filteredMembers" :key="m.id">
            <td class="col-num">{{ index + 1 }}</td>
            <td class="col-id">
              <span class="id-badge">{{ m.membership_id || 'N/A' }}</span>
            </td>
            <td class="col-name">{{ formatName(m.firstname) }} {{ formatName(m.lastname) }}</td>
          </tr>
          <tr v-if="filteredMembers.length === 0">
            <td colspan="3" class="no-results">No members found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getMembers } from '~/composables/useMembers.js';

const members = await getMembers();
const search = ref('');

const filteredMembers = computed(() => {
  if (!search.value.trim()) return members;
  const q = search.value.toLowerCase();
  return members.filter((m) => {
    const name = `${m.firstname ?? ''} ${m.lastname ?? ''}`.toLowerCase();
    const id = (m.membership_id ?? '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });
});

const formatName = (value) => {
  if (!value) return '';
  return value
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const hasUppercase = /[A-Z]/.test(word);
      if (hasUppercase) {
        if (word === word.toUpperCase()) return word;
        if (word.slice(1) !== word.slice(1).toLowerCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
</script>

<style scoped>
.members-page {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.members-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.members-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0;
}

.members-count {
  font-size: 0.82rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}

/* Search */
.members-search {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.8rem;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 2rem 0.55rem 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: border-color 0.15s;
  background: #fff;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.85rem;
}

.search-clear:hover {
  color: #374151;
}

/* Table */
.members-table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.members-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e5e7eb;
}

.members-table th {
  padding: 0.65rem 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.members-table td {
  padding: 0.55rem 1rem;
  font-size: 0.88rem;
  border-bottom: 1px solid #f3f4f6;
}

.members-table tbody tr:hover {
  background: #f8fafc;
}

.members-table tbody tr:last-child td {
  border-bottom: none;
}

.col-num {
  text-align: center;
  width: 3rem;
  color: #9ca3af;
}

.col-id {
  text-align: center;
  width: 8rem;
}

.col-name {
  text-align: left;
  color: #1e3a5f;
  font-weight: 500;
}

.id-badge {
  display: inline-block;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

.no-results {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 1rem !important;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .members-page {
    padding: 1rem;
  }

  .members-table th,
  .members-table td {
    padding: 0.45rem 0.6rem;
  }

  .col-id {
    width: auto;
  }
}
</style>
