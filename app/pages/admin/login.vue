<template>
  <div class="login-wrapper">
    <form class="login-card" @submit.prevent="handleLogin">
      <h1 class="login-title">NSFM Admin</h1>

      <div class="login-field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required autocomplete="email" />
      </div>

      <div class="login-field">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" required autocomplete="current-password" />
      </div>

      <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>

      <button type="submit" :disabled="submitting" class="login-btn">
        {{ submitting ? 'Signing in...' : 'Sign In' }}
      </button>

      <NuxtLink to="/" class="back-to-site">Back to website</NuxtLink>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { user, init, login } = useAuth();
await init();

if (user.value) {
  navigateTo('/admin');
}

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const submitting = ref(false);

async function handleLogin() {
  errorMsg.value = '';
  submitting.value = true;
  try {
    await login(email.value, password.value);
    navigateTo('/admin');
  } catch (e: any) {
    errorMsg.value = e.message || 'Invalid credentials';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.login-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 380px;
}

.login-title {
  text-align: center;
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.login-field {
  margin-bottom: 1rem;
}

.login-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.3rem;
}

.login-field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.login-field input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.login-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 0.7rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.login-btn:hover:not(:disabled) {
  background: #002080;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-to-site {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
}

.back-to-site:hover {
  color: #2563eb;
  text-decoration: underline;
}
</style>
