<template>
  <NuxtLink v-if="show" to="/education/register" class="edu-cta">
    <span class="edu-cta-text">
      <strong>{{ banner.title }}</strong>
      <span v-if="banner.subtitle" class="edu-cta-sub" v-html="banner.subtitle"></span>
    </span>
    <span class="edu-cta-btn">
      <font-awesome-icon :icon="['fas', 'user-plus']" />
      {{ banner.button_label }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import {getCurrentSession, DEFAULT_SESSION, type RegisterBanner} from '~/composables/useEducationReg';

const banner = ref<RegisterBanner>(DEFAULT_SESSION.banner);
const open = ref(false);

onMounted(async () => {
  const session = await getCurrentSession();
  banner.value = session.banner;
  open.value = session.open;
});

// Show only when the banner is enabled and registration is open.
const show = computed(() => banner.value.active && open.value);
</script>

<style scoped>
.edu-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1rem;
  padding: 0.85rem 1.1rem;
  border-radius: 0.75rem;
  background: linear-gradient(120deg, rgba(28, 51, 130, 0.95), rgba(163, 20, 50, 0.9));
  color: #fff;
  text-decoration: none;
}

.edu-cta-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.edu-cta-text strong {
  font-size: 0.98rem;
}

.edu-cta-sub {
  font-size: 0.82rem;
  opacity: 0.9;
}

.edu-cta-sub :deep(ul) {
  margin: 0.2rem 0 0;
  padding-left: 1.1rem;
}

.edu-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1.15rem;
  background: #fff;
  color: #a31432;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.edu-cta:hover .edu-cta-btn {
  background: #ffd700;
  color: #1c3382;
  transform: translateY(-1px);
}
</style>
