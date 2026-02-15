<script setup lang="ts">
import type { Member } from '~/types/member';

const route = useRoute();
const memberId = route.params.id as string;

const { $supabase } = useNuxtApp();
const member = ref<Member | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data, error: fetchError } = await $supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    member.value = data;
  } catch (e) {
    console.error('[id-card] Error fetching member:', e);
    error.value = 'Member not found';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="id-card-page">
    <div class="container">
      <div v-if="loading" class="loading">
        Loading ID Card...
      </div>

      <div v-else-if="error" class="error">
        <h2>{{ error }}</h2>
        <NuxtLink to="/members" class="back-link">
          Back to Members
        </NuxtLink>
      </div>

      <div v-else-if="member" class="card-container">
        <h1 class="page-title">Member ID Card</h1>
        <MemberIdCard :member="member" />
        <div class="actions">
          <NuxtLink to="/members/id-cards" class="back-link">
            View All ID Cards
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.id-card-page {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 2rem 1rem;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1c3382;
  text-align: center;
}

.actions {
  display: flex;
  gap: 1rem;
}

.back-link {
  color: #1c3382;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #1c3382;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #1c3382;
  color: white;
}
</style>
